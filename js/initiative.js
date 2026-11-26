import {
  STATUS_DEFS, WIN_DEFAULTS
} from './constants.js';
import {
  $, uid, esc, clone, toInt, fmtSign
} from './utils.js';
import {
  hooks
} from './ui-hooks.js';
import {
  S, D, CN, LD, INI, FBW, UI, CLOUD, LIVE_TAB_ID,
  normalizeInitiativeState, normalizeInitiativeEntry,
  getCampaigns, getActiveLiveCampaignId, getCharCampaignId, getCharOwner,
  canManageCampaign, isEnemySheet, getEnemyMeta, canViewEnemySheet, isEnemyDiceVisibleInCampaign,
  applyWinFrame, renderWinCtrlBtns, renderWinResizeHandles, saveWinPref,
  openCtxMenu, captureScrollState, restoreScrollState, saveRegistryLocal,
  toast, isMobileLayout
} from './state.js';
import {
  calcActiveMods, getIniTot, getStatusEffValues
} from './calc.js';
import {
  syncCloudRegistry, sendLiveBroadcast, getCachedForeignSheet, fetchForeignCharacterSheet
} from './cloud.js';

export function getActiveInitiativeCampaignId(){
  if(UI.inLobby) return getActiveLiveCampaignId();
  if(isEnemySheet(S)){
    const meta = getEnemyMeta(S);
    if(CLOUD.activeCampaignId && meta.campaignIds.includes(CLOUD.activeCampaignId)) return CLOUD.activeCampaignId;
    if(meta.campaignIds.length) return meta.campaignIds[0];
    return getActiveLiveCampaignId();
  }
  return getCharCampaignId(S.charId);
}

export function getCampaignInitiative(campId = getActiveInitiativeCampaignId()){
  const cid = String(campId || 'default').trim() || 'default';
  const raw = CLOUD.registry?.initiatives?.[cid];
  return normalizeInitiativeState(raw);
}

export function computeSheetIniParts(sheet){
  if(!sheet || typeof sheet !== 'object'){
    return { baseIni: 0, statusIni: 0, statusNote: '', total: 0 };
  }
  const M = calcActiveMods(sheet);
  const total = getIniTot(M, sheet);
  let statusIni = 0;
  const noteParts = [];
  STATUS_DEFS.forEach(def => {
    if(def.statKey !== 'ini') return;
    const v = getStatusEffValues(def.k, sheet);
    if(!v.active || !v.effStat) return;
    statusIni += v.effStat;
    noteParts.push(`${def.name}${v.stacks > 1 ? ` ×${v.stacks}` : ''} ${fmtSign(v.effStat)}`);
  });
  return {
    baseIni: total - statusIni,
    statusIni,
    statusNote: noteParts.join(' • '),
    total
  };
}

export function getEntryTotalIni(entry){
  if(!entry) return 0;
  return toInt(entry.baseIni, 0) + toInt(entry.statusIni, 0) + toInt(entry.manualMod, 0);
}

export function getSortedInitiativeEntries(state, isGm = false){
  const list = Array.isArray(state?.entries) ? state.entries : [];
  return list
    .filter(e => e && (isGm || !e.hidden))
    .sort((a, b) => {
      const diff = getEntryTotalIni(b) - getEntryTotalIni(a);
      if(diff !== 0) return diff;
      if(Boolean(a.isEnemy) !== Boolean(b.isEnemy)) return a.isEnemy ? 1 : -1;
      return String(a.name || '').localeCompare(String(b.name || ''), 'de');
    });
}

export function canUserEditInitiativeEntry(entry, campId){
  if(!entry) return false;
  if(canManageCampaign(campId)) return true;
  if(entry.isEnemy || !entry.charId) return false;
  if(!UI.inLobby && S?.charId && S.charId === entry.charId && !CLOUD.viewingRemote) return true;
  const curUser = String(CLOUD.currentUser || '').trim().toLowerCase();
  if(curUser){
    const own = String(getCharOwner(entry.charId) || '').trim().toLowerCase();
    if(own && own === curUser) return true;
  }
  return false;
}

function getLiveEntryAvatar(entry){
  if(!entry) return '';
  if(entry.charId){
    if(!UI.inLobby && S?.charId === entry.charId && S.profile?.avatar) return S.profile.avatar;
    const match = (CLOUD.list || []).find(c => c && c.id === entry.charId);
    if(match?.avatar) return match.avatar;
  }
  return entry.avatar || '';
}

function buildEntryFromCharMeta(ch, sheetOpt = null, { nameOverride = '', isEnemyForce = null, hidden = false } = {}){
  const cid = String(ch?.id || sheetOpt?.charId || '').trim();
  const isEn = isEnemyForce !== null ? Boolean(isEnemyForce) : Boolean(ch ? isEnemySheet(ch.id) : isEnemySheet(sheetOpt));
  const rawName = String(nameOverride || sheetOpt?.profile?.name || ch?.name || '').trim() || (isEn ? 'Gegner' : 'Held');
  let baseIni = toInt(ch?.ini, 0);
  let statusIni = 0;
  let statusNote = '';
  const sheet = sheetOpt || (cid && !UI.inLobby && S?.charId === cid ? S : null) || (cid ? getCachedForeignSheet(cid) : null);
  if(sheet){
    const parts = computeSheetIniParts(sheet);
    baseIni = parts.baseIni;
    statusIni = parts.statusIni;
    statusNote = parts.statusNote;
  }
  return normalizeInitiativeEntry({
    id: 'ini_' + uid(),
    charId: cid,
    name: rawName,
    isEnemy: isEn,
    hidden: Boolean(hidden),
    baseIni,
    statusIni,
    statusNote,
    manualMod: 0,
    avatar: String(sheet?.profile?.avatar || ch?.avatar || ''),
    note: ''
  });
}

export function commitInitiativeChange(campId, nextState, { broadcast = true, pushRegistry = true } = {}){
  const cid = String(campId || getActiveInitiativeCampaignId() || 'default').trim() || 'default';
  if(!CLOUD.registry.initiatives || typeof CLOUD.registry.initiatives !== 'object') CLOUD.registry.initiatives = {};
  const clean = normalizeInitiativeState({ ...nextState, updatedAtMs: Date.now() });
  CLOUD.registry.initiatives[cid] = clean;
  saveRegistryLocal();
  if(broadcast){
    sendLiveBroadcast({
      type: 'initiative_live',
      campaignId: cid,
      state: clean,
      senderTabId: LIVE_TAB_ID,
      tsMs: clean.updatedAtMs
    });
  }
  if(pushRegistry){
    syncCloudRegistry(true);
  }
  updateInitiativeUI();
  return clean;
}

export async function toggleCampaignInitiativeActive(campId = getActiveInitiativeCampaignId()){
  const cid = String(campId || 'default').trim() || 'default';
  if(!canManageCampaign(cid)){
    toast('🔒 Nur Spielleitung oder Admin kann die Initiative-Reihenfolge steuern.');
    return;
  }
  const cur = getCampaignInitiative(cid);
  const nextActive = !cur.active;
  cur.active = nextActive;
  if(nextActive && !cur.entries.length){
    const heroes = (CLOUD.list || []).filter(c => c && c.id && !isEnemySheet(c.id) && getCharCampaignId(c.id) === cid);
    heroes.forEach(ch => {
      cur.entries.push(buildEntryFromCharMeta(ch, null, { isEnemyForce: false }));
    });
    const sorted = getSortedInitiativeEntries(cur, true);
    if(sorted.length) cur.activeEntryId = sorted[0].id;
    cur.round = 1;
  }else if(nextActive && !cur.activeEntryId && cur.entries.length){
    const sorted = getSortedInitiativeEntries(cur, true);
    if(sorted.length) cur.activeEntryId = sorted[0].id;
  }
  commitInitiativeChange(cid, cur);
  toast(nextActive ? '⚡ Initiative-Reihenfolge für die Kampagne aktiviert!' : 'Initiative-Reihenfolge beendet.');
  if(nextActive){
    refreshAllInitiativeEntries(cid, { silent: true });
  }
}

export async function loadCampaignHeroesIntoInitiative(campId = getActiveInitiativeCampaignId()){
  const cid = String(campId || 'default').trim() || 'default';
  if(!canManageCampaign(cid)){
    toast('🔒 Nur Spielleitung oder Admin kann Helden in die Initiative laden.');
    return;
  }
  const cur = getCampaignInitiative(cid);
  const heroes = (CLOUD.list || []).filter(c => c && c.id && !isEnemySheet(c.id) && getCharCampaignId(c.id) === cid);
  if(!heroes.length){
    toast('Keine Charaktere in dieser Kampagne gefunden.');
    return;
  }
  let added = 0;
  heroes.forEach(ch => {
    const existing = cur.entries.find(e => !e.isEnemy && e.charId === ch.id);
    if(!existing){
      cur.entries.push(buildEntryFromCharMeta(ch, null, { isEnemyForce: false }));
      added++;
    }
  });
  if(!cur.activeEntryId && cur.entries.length){
    const sorted = getSortedInitiativeEntries(cur, true);
    if(sorted.length) cur.activeEntryId = sorted[0].id;
  }
  commitInitiativeChange(cid, cur);
  await refreshAllInitiativeEntries(cid, { silent: true });
  toast(added > 0 ? `👥 ${added} Charakter${added === 1 ? '' : 'e'} hinzugefügt & synchronisiert.` : '🔄 Alle Kampagnen-Helden aktualisiert.');
}

export async function addCharacterOrEnemyToInitiative(campId, charId, { isEnemy = false, allowDuplicate = false, hidden = false } = {}){
  const cid = String(campId || getActiveInitiativeCampaignId() || 'default').trim() || 'default';
  if(!canManageCampaign(cid)) return;
  const targetId = String(charId || '').trim();
  if(!targetId) return;
  const cur = getCampaignInitiative(cid);
  const ch = (CLOUD.list || []).find(c => c && c.id === targetId) || null;
  let sheet = (!UI.inLobby && S?.charId === targetId) ? S : getCachedForeignSheet(targetId);
  if(!sheet){
    sheet = await fetchForeignCharacterSheet(targetId, { force: false, silent: true });
  }
  const baseName = String(sheet?.profile?.name || ch?.name || '').trim() || (isEnemy ? 'Gegner' : 'Held');
  if(!allowDuplicate){
    const ex = cur.entries.find(e => e.charId === targetId);
    if(ex){
      if(sheet){
        const p = computeSheetIniParts(sheet);
        ex.baseIni = p.baseIni;
        ex.statusIni = p.statusIni;
        ex.statusNote = p.statusNote;
        ex.name = baseName;
      }
      commitInitiativeChange(cid, cur);
      toast(`🔄 ${ex.name} in der Initiative aktualisiert.`);
      return;
    }
  }
  let finalName = baseName;
  const sameCount = cur.entries.filter(e => e.charId === targetId || String(e.name || '').toLowerCase().startsWith(baseName.toLowerCase())).length;
  if(sameCount > 0){
    finalName = `${baseName} #${sameCount + 1}`;
  }
  const entry = buildEntryFromCharMeta(ch, sheet, { nameOverride: finalName, isEnemyForce: isEnemy, hidden });
  cur.entries.push(entry);
  if(!cur.activeEntryId){
    const sorted = getSortedInitiativeEntries(cur, true);
    if(sorted.length) cur.activeEntryId = sorted[0].id;
  }
  commitInitiativeChange(cid, cur);
  toast(`${isEnemy ? '👹' : '👤'} ${finalName} zur Initiative hinzugefügt.`);
}

export function addCustomInitiativeEntry(campId = getActiveInitiativeCampaignId()){
  const cid = String(campId || 'default').trim() || 'default';
  if(!canManageCampaign(cid)) return;
  const name = String(INI.customName || '').trim();
  if(!name){
    toast('Bitte einen Namen für den Teilnehmer eingeben.');
    return;
  }
  const cur = getCampaignInitiative(cid);
  const entry = normalizeInitiativeEntry({
    id: 'ini_' + uid(),
    charId: '',
    name,
    isEnemy: Boolean(INI.customIsEnemy),
    hidden: Boolean(INI.customHidden),
    baseIni: toInt(INI.customIni, 0),
    statusIni: 0,
    statusNote: '',
    manualMod: 0,
    avatar: '',
    note: ''
  });
  cur.entries.push(entry);
  if(!cur.activeEntryId){
    const sorted = getSortedInitiativeEntries(cur, true);
    if(sorted.length) cur.activeEntryId = sorted[0].id;
  }
  INI.customName = '';
  INI.customIni = '0';
  INI.addCustomOpen = false;
  commitInitiativeChange(cid, cur);
  toast(`${entry.isEnemy ? '👹' : '👤'} ${entry.name} (${fmtSign(entry.baseIni)} Ini) hinzugefügt.`);
}

export function getEnemyInitiativeCount(campId, charId){
  const cid = String(campId || getActiveInitiativeCampaignId() || 'default').trim() || 'default';
  const tid = String(charId || '').trim();
  if(!tid) return 0;
  const st = getCampaignInitiative(cid);
  return (st.entries || []).filter(e => e && e.charId === tid).length;
}

export async function addAllCampaignEnemiesToInitiative(campId = getActiveInitiativeCampaignId(), { onlyDiceVisible = true, hidden = false } = {}){
  const cid = String(campId || 'default').trim() || 'default';
  if(!canManageCampaign(cid)){
    toast('🔒 Nur Spielleitung oder Admin kann Gegner in die Initiative laden.');
    return;
  }
  const allCampEnemies = (CLOUD.list || []).filter(c => {
    if(!c || !c.id || !isEnemySheet(c.id)) return false;
    const m = getEnemyMeta(c.id);
    return Boolean(m.isEnemy && !m.archived && m.campaignIds.includes(cid));
  });
  const diceVisEnemies = allCampEnemies.filter(c => isEnemyDiceVisibleInCampaign(c.id, cid));
  const targetList = (onlyDiceVisible && diceVisEnemies.length) ? diceVisEnemies : allCampEnemies;
  if(!targetList.length){
    toast('Keine aktiven Gegner in dieser Kampagne gefunden.');
    return;
  }
  const cur = getCampaignInitiative(cid);
  let added = 0;
  for(const ch of targetList){
    const existing = cur.entries.find(e => e.isEnemy && e.charId === ch.id);
    if(!existing){
      let sheet = (!UI.inLobby && S?.charId === ch.id) ? S : getCachedForeignSheet(ch.id);
      if(!sheet){
        sheet = await fetchForeignCharacterSheet(ch.id, { force: false, silent: true });
      }
      cur.entries.push(buildEntryFromCharMeta(ch, sheet, { isEnemyForce: true, hidden }));
      added++;
    }
  }
  if(!cur.activeEntryId && cur.entries.length){
    const sorted = getSortedInitiativeEntries(cur, true);
    if(sorted.length) cur.activeEntryId = sorted[0].id;
  }
  commitInitiativeChange(cid, cur);
  if(added > 0){
    const scopeLbl = (onlyDiceVisible && diceVisEnemies.length) ? 'sichtbare ' : '';
    toast(`👹 ${added} ${scopeLbl}Gegner zur Initiative hinzugefügt.`);
  }else{
    await refreshAllInitiativeEntries(cid, { silent: true });
    toast('🔄 Alle ausgewählten Kampagnen-Gegner sind bereits in der Initiative (Werte aktualisiert).');
  }
}

export function openInitiativePopout({ compact = null } = {}){
  INI.open = true;
  INI.collapsed = false;
  if(!isMobileLayout()){
    INI.floating = true;
    INI.docked = false;
    if(compact !== null) INI.compact = Boolean(compact);
    INI.z = Math.max(CN.z || 50, D.z || 50, LD.z || 50, INI.z || 50, FBW.z || 50) + 1;
    saveWinPref('ini');
  }
  syncCloudRegistry(false);
  updateInitiativeUI();
}

export function openInitiativeAddEnemyPicker(anchorEl, campId = getActiveInitiativeCampaignId(), forceOpen = false){
  const cid = String(campId || 'default').trim() || 'default';
  if(!canManageCampaign(cid)) return;
  const allList = CLOUD.list || [];
  const campEnemies = [];
  const templates = [];
  const campHeroes = [];
  allList.forEach(c => {
    if(!c || !c.id) return;
    if(isEnemySheet(c.id)){
      if(!canViewEnemySheet(c.id)) return;
      const m = getEnemyMeta(c.id);
      if(m.archived) return;
      if(m.isEnemy && m.campaignIds.includes(cid)) campEnemies.push(c);
      else templates.push(c);
    }else if(getCharCampaignId(c.id) === cid){
      campHeroes.push(c);
    }
  });
  campEnemies.sort((a, b) => {
    const va = isEnemyDiceVisibleInCampaign(a.id, cid) ? 1 : 0;
    const vb = isEnemyDiceVisibleInCampaign(b.id, cid) ? 1 : 0;
    if(va !== vb) return vb - va;
    return String(a.name || '').localeCompare(String(b.name || ''), 'de');
  });
  templates.sort((a, b) => String(a.name || '').localeCompare(String(b.name || ''), 'de'));
  campHeroes.sort((a, b) => String(a.name || '').localeCompare(String(b.name || ''), 'de'));

  const addHidden = Boolean(INI.pickerHidden);
  const sel = `[data-action="ini-open-add-picker"][data-camp="${CSS.escape ? CSS.escape(cid) : cid}"]`;
  const resolveAnchor = () => (anchorEl && anchorEl.isConnected) ? anchorEl : document.querySelector(sel);
  const diceVisCnt = campEnemies.filter(e => isEnemyDiceVisibleInCampaign(e.id, cid)).length;

  const items = [
    {
      icon: addHidden ? '🙈' : '👁️',
      label: addHidden ? 'Modus: Verborgen (Hinterhalt)' : 'Modus: Direkt sichtbar hinzufügen',
      sub: 'Klicken zum Umschalten für neu hinzugefügte Gegner',
      active: addHidden,
      badge: addHidden ? 'VERBORGEN' : 'SICHTBAR',
      keepOpen: true,
      onClick: () => {
        INI.pickerHidden = !INI.pickerHidden;
        openInitiativeAddEnemyPicker(resolveAnchor(), cid, true);
      }
    }
  ];

  if(campEnemies.length){
    items.push({ sep: true });
    if(diceVisCnt > 0){
      items.push({
        icon: '⚡',
        label: `Alle sichtbaren Gegner laden (${diceVisCnt})`,
        sub: 'Fügt alle im Würfelassistent sichtbaren Gegner dieser Kampagne ein',
        keepOpen: true,
        onClick: async () => {
          await addAllCampaignEnemiesToInitiative(cid, { onlyDiceVisible: true, hidden: Boolean(INI.pickerHidden) });
          openInitiativeAddEnemyPicker(resolveAnchor(), cid, true);
        }
      });
    }
    if(campEnemies.length > diceVisCnt){
      items.push({
        icon: '👹',
        label: `Alle aktiven SL-Gegner laden (${campEnemies.length})`,
        sub: 'Fügt alle nicht archivierten Gegner dieser Kampagne ein',
        keepOpen: true,
        onClick: async () => {
          await addAllCampaignEnemiesToInitiative(cid, { onlyDiceVisible: false, hidden: Boolean(INI.pickerHidden) });
          openInitiativeAddEnemyPicker(resolveAnchor(), cid, true);
        }
      });
    }
    items.push({ type: 'label', label: '👹 Gegner dieser Kampagne (mehrfach wählbar)' });
    campEnemies.forEach(e => {
      const vis = isEnemyDiceVisibleInCampaign(e.id, cid);
      const cnt = getEnemyInitiativeCount(cid, e.id);
      const subParts = [`Basis-Ini ${fmtSign(toInt(e.ini, 0))}`];
      if(vis) subParts.push('👁️ Im Würfel');
      if(cnt > 0) subParts.push(`im Kampf: ${cnt}×`);
      items.push({
        icon: vis ? '👁️' : '👹',
        label: String(e.name || 'Gegner').trim(),
        sub: subParts.join(' • '),
        badge: cnt > 0 ? `${cnt}× | ${fmtSign(toInt(e.ini, 0))}` : fmtSign(toInt(e.ini, 0)),
        active: cnt > 0,
        keepOpen: true,
        onClick: async () => {
          await addCharacterOrEnemyToInitiative(cid, e.id, { isEnemy: true, allowDuplicate: true, hidden: Boolean(INI.pickerHidden) });
          openInitiativeAddEnemyPicker(resolveAnchor(), cid, true);
        }
      });
    });
  }
  if(templates.length){
    items.push({ sep: true });
    items.push({ type: 'label', label: '📋 Gegner-Vorlagen / Bestiarium' });
    templates.forEach(t => {
      const cat = getEnemyMeta(t.id).category;
      const cnt = getEnemyInitiativeCount(cid, t.id);
      items.push({
        icon: '📋',
        label: String(t.name || 'Vorlage').trim(),
        sub: `${cat ? `${cat} • ` : ''}Basis-Ini ${fmtSign(toInt(t.ini, 0))}${cnt > 0 ? ` • im Kampf: ${cnt}×` : ''}`,
        badge: cnt > 0 ? `${cnt}× | ${fmtSign(toInt(t.ini, 0))}` : fmtSign(toInt(t.ini, 0)),
        active: cnt > 0,
        keepOpen: true,
        onClick: async () => {
          await addCharacterOrEnemyToInitiative(cid, t.id, { isEnemy: true, allowDuplicate: true, hidden: Boolean(INI.pickerHidden) });
          openInitiativeAddEnemyPicker(resolveAnchor(), cid, true);
        }
      });
    });
  }
  if(campHeroes.length){
    items.push({ sep: true });
    items.push({ type: 'label', label: '👥 Kampagnen-Charaktere' });
    campHeroes.forEach(h => {
      const cnt = getEnemyInitiativeCount(cid, h.id);
      items.push({
        icon: '👤',
        label: String(h.name || 'Held').trim(),
        sub: `Ini ${fmtSign(toInt(h.ini, 0))}${cnt > 0 ? ' • bereits in Ini' : ''}`,
        badge: fmtSign(toInt(h.ini, 0)),
        active: cnt > 0,
        keepOpen: true,
        onClick: async () => {
          await addCharacterOrEnemyToInitiative(cid, h.id, { isEnemy: false, allowDuplicate: false });
          openInitiativeAddEnemyPicker(resolveAnchor(), cid, true);
        }
      });
    });
  }
  if(items.length <= 1){
    items.push({ sep: true });
    items.push({ label: 'Keine Gegner, Vorlagen oder Helden gefunden', disabled: true });
  }
  openCtxMenu({
    key: `ini-add-picker:${cid}`,
    title: 'Teilnehmer zur Initiative hinzufügen',
    anchorEl,
    align: 'left',
    minWidth: 285,
    showClose: true,
    forceOpen,
    items
  });
}

export async function refreshAllInitiativeEntries(campId = getActiveInitiativeCampaignId(), { silent = false } = {}){
  const cid = String(campId || 'default').trim() || 'default';
  const cur = getCampaignInitiative(cid);
  const linkedIds = [...new Set(cur.entries.map(e => e.charId).filter(Boolean))];
  if(!linkedIds.length){
    if(!silent) toast('Keine verknüpften Charakterbögen in der Initiative.');
    return;
  }
  const sheetMap = new Map();
  await Promise.all(linkedIds.map(async id => {
    if(!UI.inLobby && S?.charId === id && !CLOUD.viewingRemote){
      sheetMap.set(id, S);
      return;
    }
    const fetched = await fetchForeignCharacterSheet(id, { force: true, silent: true });
    if(fetched) sheetMap.set(id, fetched);
  }));
  let changed = false;
  cur.entries.forEach(e => {
    if(!e.charId) return;
    const sh = sheetMap.get(e.charId);
    if(!sh) return;
    const p = computeSheetIniParts(sh);
    if(e.baseIni !== p.baseIni || e.statusIni !== p.statusIni || e.statusNote !== p.statusNote){
      e.baseIni = p.baseIni;
      e.statusIni = p.statusIni;
      e.statusNote = p.statusNote;
      changed = true;
    }
  });
  if(changed){
    commitInitiativeChange(cid, cur, { broadcast: canManageCampaign(cid), pushRegistry: canManageCampaign(cid) });
  }else{
    updateInitiativeUI();
  }
  if(!silent) toast('🔄 Initiative-Werte (inkl. Statuseffekte) aus Bögen aktualisiert.');
}

export function stepInitiativeTurn(campId = getActiveInitiativeCampaignId(), delta = 1){
  const cid = String(campId || 'default').trim() || 'default';
  if(!canManageCampaign(cid)) return;
  const cur = getCampaignInitiative(cid);
  const sorted = getSortedInitiativeEntries(cur, true);
  if(!sorted.length) return;
  const idx = sorted.findIndex(e => e.id === cur.activeEntryId);
  if(idx < 0){
    cur.activeEntryId = sorted[0].id;
  }else{
    let nextIdx = idx + delta;
    if(nextIdx >= sorted.length){
      nextIdx = 0;
      cur.round = Math.max(1, toInt(cur.round, 1) + 1);
    }else if(nextIdx < 0){
      nextIdx = sorted.length - 1;
      cur.round = Math.max(1, toInt(cur.round, 1) - 1);
    }
    cur.activeEntryId = sorted[nextIdx].id;
  }
  commitInitiativeChange(cid, cur);
}

export function setInitiativeActiveEntry(campId, entryId){
  const cid = String(campId || getActiveInitiativeCampaignId() || 'default').trim() || 'default';
  if(!canManageCampaign(cid)) return;
  const cur = getCampaignInitiative(cid);
  if(!cur.entries.some(e => e.id === entryId)) return;
  cur.activeEntryId = entryId;
  commitInitiativeChange(cid, cur);
}

export function resetInitiativeRound(campId = getActiveInitiativeCampaignId()){
  const cid = String(campId || 'default').trim() || 'default';
  if(!canManageCampaign(cid)) return;
  const cur = getCampaignInitiative(cid);
  const sorted = getSortedInitiativeEntries(cur, true);
  cur.round = 1;
  cur.activeEntryId = sorted[0]?.id || '';
  commitInitiativeChange(cid, cur);
  toast('↺ Initiative auf Runde 1 zurückgesetzt.');
}

export function adjustInitiativeEntryMod(campId, entryId, delta){
  const cid = String(campId || getActiveInitiativeCampaignId() || 'default').trim() || 'default';
  const cur = getCampaignInitiative(cid);
  const e = cur.entries.find(x => x.id === entryId);
  if(!e || !canUserEditInitiativeEntry(e, cid)) return;
  e.manualMod = toInt(e.manualMod, 0) + toInt(delta, 0);
  commitInitiativeChange(cid, cur);
}

export function resetInitiativeEntryMod(campId, entryId){
  const cid = String(campId || getActiveInitiativeCampaignId() || 'default').trim() || 'default';
  const cur = getCampaignInitiative(cid);
  const e = cur.entries.find(x => x.id === entryId);
  if(!e || !canUserEditInitiativeEntry(e, cid)) return;
  e.manualMod = 0;
  commitInitiativeChange(cid, cur);
}

export function toggleInitiativeEntryHidden(campId, entryId){
  const cid = String(campId || getActiveInitiativeCampaignId() || 'default').trim() || 'default';
  if(!canManageCampaign(cid)) return;
  const cur = getCampaignInitiative(cid);
  const e = cur.entries.find(x => x.id === entryId);
  if(!e) return;
  e.hidden = !e.hidden;
  commitInitiativeChange(cid, cur);
}

export function removeInitiativeEntry(campId, entryId){
  const cid = String(campId || getActiveInitiativeCampaignId() || 'default').trim() || 'default';
  if(!canManageCampaign(cid)) return;
  const cur = getCampaignInitiative(cid);
  cur.entries = cur.entries.filter(x => x.id !== entryId);
  if(cur.activeEntryId === entryId){
    const sorted = getSortedInitiativeEntries(cur, true);
    cur.activeEntryId = sorted[0]?.id || '';
  }
  commitInitiativeChange(cid, cur);
}

export function clearInitiativeEntries(campId = getActiveInitiativeCampaignId()){
  const cid = String(campId || 'default').trim() || 'default';
  if(!canManageCampaign(cid)) return;
  const cur = getCampaignInitiative(cid);
  cur.entries = [];
  cur.activeEntryId = '';
  cur.round = 1;
  commitInitiativeChange(cid, cur);
  toast('Initiative-Liste geleert.');
}

let lastOwnIniSyncSig = '';
export function syncOwnCharToInitiative(sheet = S){
  if(UI.inLobby || CLOUD.viewingRemote || !sheet || !sheet.charId) return;
  const cid = isEnemySheet(sheet) ? getActiveInitiativeCampaignId() : getCharCampaignId(sheet.charId);
  const initMap = CLOUD.registry?.initiatives;
  if(!initMap || typeof initMap !== 'object') return;
  const targetCampIds = [];
  Object.entries(initMap).forEach(([campId, st]) => {
    if(st && Array.isArray(st.entries) && st.entries.some(e => e && e.charId === sheet.charId)){
      targetCampIds.push(campId);
    }
  });
  if(!targetCampIds.length) return;
  const parts = computeSheetIniParts(sheet);
  const dispName = String(sheet.profile?.name || '').trim();
  const sig = `${sheet.charId}|${parts.baseIni}|${parts.statusIni}|${parts.statusNote}|${dispName}`;
  if(sig === lastOwnIniSyncSig) return;
  lastOwnIniSyncSig = sig;

  let anyChanged = false;
  targetCampIds.forEach(campId => {
    const cur = getCampaignInitiative(campId);
    let campChanged = false;
    cur.entries.forEach(e => {
      if(e.charId !== sheet.charId) return;
      if(e.baseIni !== parts.baseIni || e.statusIni !== parts.statusIni || e.statusNote !== parts.statusNote){
        e.baseIni = parts.baseIni;
        e.statusIni = parts.statusIni;
        e.statusNote = parts.statusNote;
        campChanged = true;
      }
    });
    if(campChanged){
      anyChanged = true;
      cur.updatedAtMs = Date.now();
      CLOUD.registry.initiatives[campId] = cur;
      sendLiveBroadcast({
        type: 'initiative_char_sync',
        campaignId: campId,
        charId: sheet.charId,
        baseIni: parts.baseIni,
        statusIni: parts.statusIni,
        statusNote: parts.statusNote,
        senderTabId: LIVE_TAB_ID,
        tsMs: cur.updatedAtMs
      });
    }
  });
  if(anyChanged){
    saveRegistryLocal();
    syncCloudRegistry(true);
    updateInitiativeUI();
  }
}

export function handleInitiativeLiveEvent(rawObj, isRealtimePush = false){
  if(!rawObj || typeof rawObj !== 'object') return;
  if(rawObj.senderTabId === LIVE_TAB_ID) return;
  const cid = String(rawObj.campaignId || 'default').trim() || 'default';
  if(!CLOUD.registry.initiatives || typeof CLOUD.registry.initiatives !== 'object') CLOUD.registry.initiatives = {};

  if(rawObj.type === 'initiative_live' && rawObj.state && typeof rawObj.state === 'object'){
    const prev = getCampaignInitiative(cid);
    const inc = normalizeInitiativeState(rawObj.state);
    if(inc.updatedAtMs && prev.updatedAtMs && inc.updatedAtMs < prev.updatedAtMs) return;
    const justActivated = !prev.active && inc.active;
    CLOUD.registry.initiatives[cid] = inc;
    saveRegistryLocal();
    updateInitiativeUI();
    if(isRealtimePush && justActivated && cid === getActiveInitiativeCampaignId()){
      toast('⚡ Spielleitung hat die Initiative-Reihenfolge aktiviert!');
    }
    return;
  }

  if(rawObj.type === 'initiative_char_sync' && rawObj.charId){
    const cur = getCampaignInitiative(cid);
    let hit = false;
    cur.entries.forEach(e => {
      if(e.charId !== rawObj.charId) return;
      e.baseIni = toInt(rawObj.baseIni, e.baseIni);
      e.statusIni = toInt(rawObj.statusIni, 0);
      e.statusNote = String(rawObj.statusNote || '').trim();
      hit = true;
    });
    if(hit){
      cur.updatedAtMs = Math.max(cur.updatedAtMs, toInt(rawObj.tsMs, Date.now()));
      CLOUD.registry.initiatives[cid] = cur;
      saveRegistryLocal();
      updateInitiativeUI();
    }
  }
}

export function renderInitiativeBodyHtml(campId = getActiveInitiativeCampaignId(), { inWindow = false } = {}){
  const cid = String(campId || 'default').trim() || 'default';
  const isGm = canManageCampaign(cid);
  const st = getCampaignInitiative(cid);
  const campObj = getCampaigns().find(c => c.id === cid);
  const campName = campObj?.name || 'Kampagne';
  const sorted = getSortedInitiativeEntries(st, isGm);
  const activeEntry = sorted.find(e => e.id === st.activeEntryId) || null;

  const gmControlsHtml = isGm ? `<div class="space-y-2 pb-2 border-b bdr-line">
    <div class="flex flex-wrap items-center gap-1.5">
      <button type="button" data-action="ini-toggle-active" data-camp="${esc(cid)}" class="btn py-1 px-2.5 text-xs font-black ${st.active ? 'bg-rose-600/85 text-white border-rose-400/70' : 'btn-ok'}">${st.active ? '⏹️ Initiative beenden' : '⚡ Initiative aktivieren'}</button>
      <button type="button" data-action="ini-load-heroes" data-camp="${esc(cid)}" data-tip="Alle Charaktere dieser Kampagne laden &amp; aktualisieren" class="btn py-1 px-2 text-xs font-extrabold bdr-acc bg-acc-soft text-acc">👥 Helden</button>
      <button type="button" data-action="ini-open-add-picker" data-camp="${esc(cid)}" aria-haspopup="menu" data-tip="Gegner aus Kampagne oder Gegner-Vorlagen hinzufügen" class="btn py-1 px-2 text-xs font-extrabold border-rose-400/55 bg-rose-500/15 text-rose-200">+ 👹 Gegner / Vorlage</button>
      <button type="button" data-action="ini-toggle-custom" class="btn py-1 px-2 text-xs font-extrabold ${INI.addCustomOpen ? 'btn-pri' : ''}">+ Frei</button>
      <button type="button" data-action="ini-refresh-all" data-camp="${esc(cid)}" data-tip="Alle verknüpften Bögen (inkl. Konzentriert/Abgelenkt ±10) frisch aus der Cloud abgleichen" class="btn py-1 px-2 text-xs font-bold">🔄</button>
      ${st.entries.length ? `<button type="button" data-action="ini-clear" data-camp="${esc(cid)}" data-tip="Alle Teilnehmer aus der Liste entfernen" class="btn btn-err py-1 px-2 text-xs">🗑️</button>` : ''}
    </div>
    ${INI.addCustomOpen ? `<div class="p-2 rounded-xl border bdr-acc bg-black/25 space-y-2 text-xs">
      <div class="grid grid-cols-1 sm:grid-cols-12 gap-1.5 items-end">
        <div class="sm:col-span-6 min-w-0">
          <label class="block text-[10px] font-bold t-mut mb-0.5">Name</label>
          <input data-ini-custom="name" type="text" value="${esc(INI.customName)}" placeholder="z.B. Scharfschütze #1" class="inp w-full py-1 px-2 text-xs font-bold"/>
        </div>
        <div class="sm:col-span-3 min-w-0">
          <label class="block text-[10px] font-bold t-mut mb-0.5">Initiative</label>
          <input data-ini-custom="ini" type="text" inputmode="numeric" value="${esc(INI.customIni)}" placeholder="0" class="inp w-full py-1 px-2 text-xs font-black text-center tabular"/>
        </div>
        <div class="sm:col-span-3 flex items-center gap-1">
          <button type="button" data-action="ini-add-custom" data-camp="${esc(cid)}" class="btn btn-ok w-full py-1 px-2 text-xs font-black">+ Einfügen</button>
        </div>
      </div>
      <div class="flex flex-wrap items-center gap-2 text-[11px]">
        <button type="button" data-action="ini-custom-toggle-enemy" class="btn py-0.5 px-2 text-[11px] font-bold ${INI.customIsEnemy ? 'border-rose-400/60 bg-rose-500/20 text-rose-200' : 'bdr-acc bg-acc-soft text-acc'}">${INI.customIsEnemy ? '👹 Gegner (INI für Spieler verborgen)' : '👤 Verbündeter / NSC (INI sichtbar)'}</button>
        <button type="button" data-action="ini-custom-toggle-hidden" class="btn py-0.5 px-2 text-[11px] font-bold ${INI.customHidden ? 'border-amber-400/60 bg-amber-500/20 text-amber-200' : 'opacity-80'}">${INI.customHidden ? '🙈 Komplett verborgen (Hinterhalt)' : '👁️ In Reihenfolge sichtbar'}</button>
      </div>
    </div>` : ''}
    ${sorted.length ? `<div class="flex flex-wrap items-center justify-between gap-1.5 pt-1">
      <div class="flex items-center gap-1.5">
        <span class="px-2 py-0.5 rounded-md bg-amber-500/20 border border-amber-400/50 text-amber-300 text-xs font-black tabular">Runde ${st.round}</span>
        ${activeEntry ? `<span class="text-xs font-extrabold truncate max-w-[180px]">▶ ${esc(activeEntry.name)}</span>` : ''}
      </div>
      <div class="flex items-center gap-1">
        <button type="button" data-action="ini-step" data-camp="${esc(cid)}" data-delta="-1" data-tip="Vorheriger Zug" class="btn py-1 px-2 text-xs font-black">◀</button>
        <button type="button" data-action="ini-step" data-camp="${esc(cid)}" data-delta="1" data-tip="Nächster Zug in der Reihenfolge" class="btn btn-pri py-1 px-2.5 text-xs font-black">Nächster Zug ▶</button>
        <button type="button" data-action="ini-reset-round" data-camp="${esc(cid)}" data-tip="Auf Runde 1 &amp; ersten Platz zurücksetzen" class="btn py-1 px-2 text-xs font-bold">↺</button>
      </div>
    </div>` : ''}
  </div>` : (st.active ? `<div class="flex flex-wrap items-center justify-between gap-2 pb-2 border-b bdr-line text-xs">
    <div class="flex items-center gap-1.5 min-w-0">
      <span class="px-2 py-0.5 rounded-md bg-amber-500/20 border border-amber-400/50 text-amber-300 font-black tabular shrink-0">Runde ${st.round}</span>
      ${activeEntry ? `<span class="font-extrabold truncate">▶ Am Zug: <strong class="text-amber-300">${esc(activeEntry.name)}</strong></span>` : '<span class="t-mut font-semibold">Initiative aktiv</span>'}
    </div>
    <button type="button" data-action="ini-refresh-all" data-camp="${esc(cid)}" data-tip="Initiative-Werte abgleichen" class="btn py-0.5 px-2 text-[11px] shrink-0">🔄</button>
  </div>` : '');

  const rowsHtml = !st.active && !isGm
    ? `<div class="subcard border-dashed py-6 px-4 text-center text-xs t-mut">Die Spielleitung hat aktuell keine Initiative-Reihenfolge für „${esc(campName)}“ aktiviert.</div>`
    : !sorted.length
      ? `<div class="subcard border-dashed py-6 px-4 text-center text-xs t-mut">${isGm ? 'Noch keine Teilnehmer in der Initiative. Klicke oben auf <strong>👥 Helden</strong> oder <strong>+ 👹 Gegner / Vorlage</strong>!' : 'Noch keine sichtbaren Teilnehmer in der Initiative.'}</div>`
      : `<div class="space-y-1.5">${sorted.map((e, idx) => {
          const isCur = st.activeEntryId === e.id;
          const isOwn = Boolean(!UI.inLobby && S?.charId && e.charId === S.charId);
          const canEdit = canUserEditInitiativeEntry(e, cid);
          const hideVal = Boolean(e.isEnemy && !isGm);
          const tot = getEntryTotalIni(e);
          const av = getLiveEntryAvatar(e);
          const breakParts = [];
          if(!hideVal){
            breakParts.push(`Basis ${fmtSign(e.baseIni)}`);
            if(e.statusIni || e.statusNote) breakParts.push(e.statusNote || `Status ${fmtSign(e.statusIni)}`);
            if(e.manualMod) breakParts.push(`Mod ${fmtSign(e.manualMod)}`);
          }
          const rowCls = isCur
            ? 'border-2 border-amber-400 bg-amber-500/15 ring-1 ring-amber-400/30'
            : e.hidden
              ? 'border border-dashed border-slate-500/60 bg-black/25 opacity-70'
              : e.isEnemy
                ? 'border border-rose-500/35 bg-rose-500/5'
                : isOwn
                  ? 'border border-sky-400/55 bg-sky-500/10'
                  : 'border bdr-line bg-black/20';
          return `<div class="rounded-xl p-2 ${rowCls} flex flex-wrap sm:flex-nowrap items-center justify-between gap-2 min-w-0 tabular transition-colors">
            <div class="flex items-center gap-2 min-w-0 flex-1 basis-[180px]">
              ${isGm
                ? `<button type="button" data-action="ini-set-active" data-camp="${esc(cid)}" data-id="${esc(e.id)}" data-tip="Als aktiven Zug setzen" class="w-7 h-7 rounded-lg font-black text-xs shrink-0 flex items-center justify-center cursor-pointer ${isCur ? 'bg-amber-500 text-slate-950 shadow' : 'bg-black/30 border bdr-line t-mut hover:text-white'}">${isCur ? '▶' : (idx + 1)}</button>`
                : `<span class="w-7 h-7 rounded-lg font-black text-xs shrink-0 flex items-center justify-center ${isCur ? 'bg-amber-500 text-slate-950 shadow' : 'bg-black/30 border bdr-line t-mut'}">${isCur ? '▶' : (idx + 1)}</span>`}
              <div class="w-8 h-8 rounded-lg overflow-hidden border ${e.isEnemy ? 'border-rose-400/45' : 'bdr-acc'} bg-black/30 shrink-0 flex items-center justify-center">${av ? `<img src="${av}" class="w-full h-full object-cover"/>` : `<span class="text-xs">${e.isEnemy ? '👹' : '👤'}</span>`}</div>
              <div class="min-w-0 flex-1">
                <div class="flex flex-wrap items-center gap-1 min-w-0">
                  <span class="font-black text-xs sm:text-sm truncate">${esc(e.name)}</span>
                  ${isCur ? `<span class="px-1.5 py-0.2 rounded text-[9px] font-black uppercase bg-amber-500 text-slate-950 shrink-0">Am Zug</span>` : ''}
                  ${isOwn ? `<span class="px-1.5 py-0.2 rounded text-[9px] font-black bg-sky-500/25 text-sky-200 border border-sky-400/45 shrink-0">Du</span>` : ''}
                  ${e.isEnemy ? `<span class="px-1 py-0.2 rounded text-[9px] font-black bg-rose-500/20 text-rose-200 border border-rose-400/40 shrink-0">Gegner</span>` : ''}
                  ${e.hidden && isGm ? `<span class="px-1 py-0.2 rounded text-[9px] font-black bg-slate-600/50 text-slate-200 shrink-0">🙈 Verborgen</span>` : ''}
                </div>
                <div class="text-[10px] t-mut truncate">
                  ${hideVal
                    ? '<span>🔒 Initiative verborgen (SL)</span>'
                    : `<span>${esc(breakParts.join(' • '))}</span>`}
                </div>
              </div>
            </div>
            <div class="flex items-center gap-1 shrink-0 ml-auto">
              ${!hideVal
                ? `<span class="px-2 py-1 rounded-lg bg-black/35 border ${e.statusIni ? 'border-amber-400/55 text-amber-300' : 'bdr-line text-acc'} text-xs sm:text-sm font-black min-w-[42px] text-center" data-tip="${esc(breakParts.join(' • '))}">${fmtSign(tot)}</span>`
                : `<span class="px-2 py-1 rounded-lg bg-black/30 border bdr-line text-[11px] font-black t-mut">🔒</span>`}
              ${canEdit ? `<div class="inline-flex items-center gap-0.5">
                <button type="button" data-action="ini-mod-step" data-camp="${esc(cid)}" data-id="${esc(e.id)}" data-delta="-10" data-tip="−10 Initiative (z. B. Konzentriert / Abgelenkt)" class="btn h-7 px-1.5 text-[10px] font-black text-rose-300">−10</button>
                <button type="button" data-action="ini-mod-step" data-camp="${esc(cid)}" data-id="${esc(e.id)}" data-delta="10" data-tip="+10 Initiative (z. B. Konzentriert / Abgelenkt)" class="btn h-7 px-1.5 text-[10px] font-black text-emerald-300">+10</button>
                ${e.manualMod ? `<button type="button" data-action="ini-mod-reset" data-camp="${esc(cid)}" data-id="${esc(e.id)}" data-tip="Manuellen Modifikator (${fmtSign(e.manualMod)}) zurücksetzen" class="btn h-7 px-1 text-[10px] text-amber-300">↺</button>` : ''}
              </div>` : ''}
              ${isGm ? `<button type="button" data-action="ini-toggle-hidden" data-camp="${esc(cid)}" data-id="${esc(e.id)}" data-tip="${e.hidden ? 'Für Spieler sichtbar schalten' : 'Vor Spielern verbergen'}" class="btn w-7 h-7 p-0 text-xs">${e.hidden ? '🙈' : '👁️'}</button>
              <button type="button" data-action="ini-remove" data-camp="${esc(cid)}" data-id="${esc(e.id)}" data-tip="Aus Initiative entfernen" class="btn w-7 h-7 p-0 text-xs hover:text-rose-400">✕</button>` : ''}
            </div>
          </div>`;
        }).join('')}</div>`;

  const statusHintHtml = `<div class="text-[10px] t-mut pt-1 border-t border-white/10">💡 Statuseffekte wie <strong class="text-amber-300">Konzentriert</strong> oder <strong class="text-rose-300">Abgelenkt</strong> (±10 Ini) im Charakterbogen werden automatisch live verrechnet (oder direkt per ±10-Button).</div>`;
  const listWrapCls = inWindow
    ? (isMobileLayout() ? 'min-w-0' : 'flex-1 min-h-0 overflow-y-auto overscroll-contain pr-0.5')
    : (isMobileLayout() ? 'min-w-0' : 'max-h-[420px] overflow-y-auto overscroll-contain pr-0.5');

  return `${gmControlsHtml}<div data-scroll-key="iniList" class="${listWrapCls}">${rowsHtml}</div>${statusHintHtml}`;
}

export function renderInitiativeCompactOverlayHtml(campId = getActiveInitiativeCampaignId()){
  const cid = String(campId || 'default').trim() || 'default';
  const isGm = canManageCampaign(cid);
  const st = getCampaignInitiative(cid);
  const sorted = getSortedInitiativeEntries(st, isGm);
  const activeEntry = sorted.find(e => e.id === st.activeEntryId) || null;

  const ctrlBar = isGm
    ? `<div class="shrink-0 flex flex-wrap items-center justify-between gap-1 pb-1.5 border-b bdr-line">
        <div class="flex items-center gap-1">
          <button type="button" data-action="ini-step" data-camp="${esc(cid)}" data-delta="-1" data-tip="Vorheriger Zug" class="btn h-7 px-2 text-xs font-black">◀</button>
          <button type="button" data-action="ini-step" data-camp="${esc(cid)}" data-delta="1" data-tip="Nächster Zug" class="btn btn-pri h-7 px-2.5 text-xs font-black">Weiter ▶</button>
          <button type="button" data-action="ini-reset-round" data-camp="${esc(cid)}" data-tip="Auf Runde 1 zurücksetzen" class="btn h-7 px-1.5 text-xs">↺</button>
        </div>
        <div class="flex items-center gap-1">
          <button type="button" data-action="ini-open-add-picker" data-camp="${esc(cid)}" aria-haspopup="menu" data-tip="Gegner, Vorlage oder Held hinzufügen" class="btn h-7 px-2 text-[11px] font-extrabold border-rose-400/55 bg-rose-500/15 text-rose-200">+ 👹</button>
          <button type="button" data-action="ini-refresh-all" data-camp="${esc(cid)}" data-tip="Werte aktualisieren" class="btn h-7 px-1.5 text-xs">🔄</button>
          <button type="button" data-action="ini-toggle-active" data-camp="${esc(cid)}" data-tip="${st.active ? 'Initiative beenden' : 'Initiative aktivieren'}" class="btn h-7 px-2 text-[11px] font-black ${st.active ? 'bg-rose-600/80 text-white border-rose-400/60' : 'btn-ok'}">${st.active ? '⏹️' : '⚡'}</button>
        </div>
      </div>`
    : (st.active ? `<div class="shrink-0 flex items-center justify-between gap-1.5 pb-1.5 border-b bdr-line text-[11px]">
        <span class="font-extrabold truncate">${activeEntry ? `▶ <strong class="text-amber-300">${esc(activeEntry.name)}</strong>` : 'Initiative aktiv'}</span>
        <button type="button" data-action="ini-refresh-all" data-camp="${esc(cid)}" data-tip="Werte abgleichen" class="btn h-6 px-1.5 text-[10px] shrink-0">🔄</button>
      </div>` : '');

  const rowsHtml = !st.active && !isGm
    ? `<div class="subcard border-dashed py-4 px-3 text-center text-[11px] t-mut">Aktuell keine Initiative aktiv.</div>`
    : !sorted.length
      ? `<div class="subcard border-dashed py-4 px-3 text-center text-[11px] t-mut">${isGm ? 'Liste leer – über <strong>+ 👹</strong> Gegner/Helden hinzufügen.' : 'Keine sichtbaren Teilnehmer.'}</div>`
      : `<div class="space-y-1">${sorted.map((e, idx) => {
          const isCur = st.activeEntryId === e.id;
          const isOwn = Boolean(!UI.inLobby && S?.charId && e.charId === S.charId);
          const canEdit = canUserEditInitiativeEntry(e, cid);
          const hideVal = Boolean(e.isEnemy && !isGm);
          const tot = getEntryTotalIni(e);
          const rowCls = isCur
            ? 'border border-amber-400 bg-amber-500/20'
            : e.hidden
              ? 'border border-dashed border-slate-500/55 bg-black/25 opacity-70'
              : e.isEnemy
                ? 'border border-rose-500/35 bg-rose-500/10'
                : isOwn
                  ? 'border border-sky-400/50 bg-sky-500/12'
                  : 'border bdr-line bg-black/25';
          const tipParts = hideVal ? ['Initiative verborgen (SL)'] : [
            `Basis ${fmtSign(e.baseIni)}`,
            ...(e.statusIni || e.statusNote ? [e.statusNote || `Status ${fmtSign(e.statusIni)}`] : []),
            ...(e.manualMod ? [`Mod ${fmtSign(e.manualMod)}`] : [])
          ];
          return `<div class="rounded-lg px-2 py-1.5 ${rowCls} flex items-center justify-between gap-1.5 min-w-0 tabular transition-colors">
            <div class="flex items-center gap-1.5 min-w-0 flex-1">
              ${isGm
                ? `<button type="button" data-action="ini-set-active" data-camp="${esc(cid)}" data-id="${esc(e.id)}" data-tip="Als aktiven Zug setzen" class="w-6 h-6 rounded-md font-black text-[11px] shrink-0 flex items-center justify-center cursor-pointer ${isCur ? 'bg-amber-500 text-slate-950 shadow' : 'bg-black/35 border bdr-line t-mut hover:text-white'}">${isCur ? '▶' : (idx + 1)}</button>`
                : `<span class="w-6 h-6 rounded-md font-black text-[11px] shrink-0 flex items-center justify-center ${isCur ? 'bg-amber-500 text-slate-950' : 'bg-black/35 border bdr-line t-mut'}">${isCur ? '▶' : (idx + 1)}</span>`}
              <span class="font-extrabold text-xs truncate min-w-0 ${isCur ? 'text-amber-200' : ''}" data-tip="${esc(`${e.name} • ${tipParts.join(' • ')}`)}">${e.isEnemy ? '👹 ' : ''}${esc(e.name)}</span>
              ${isOwn ? `<span class="px-1 rounded text-[9px] font-black bg-sky-500/25 text-sky-200 shrink-0">Du</span>` : ''}
              ${e.hidden && isGm ? `<span class="text-[10px] shrink-0" data-tip="Vor Spielern verborgen">🙈</span>` : ''}
            </div>
            <div class="flex items-center gap-0.5 shrink-0">
              ${!hideVal
                ? `<span class="px-1.5 py-0.5 rounded bg-black/40 border ${e.statusIni ? 'border-amber-400/55 text-amber-300' : 'bdr-line text-acc'} text-[11px] font-black min-w-[34px] text-center" data-tip="${esc(tipParts.join(' • '))}">${fmtSign(tot)}</span>`
                : `<span class="px-1.5 py-0.5 rounded bg-black/30 border bdr-line text-[10px] font-black t-mut">🔒</span>`}
              ${canEdit ? `<button type="button" data-action="ini-mod-step" data-camp="${esc(cid)}" data-id="${esc(e.id)}" data-delta="-10" data-tip="−10 Initiative" class="btn h-6 px-1 text-[9px] font-black text-rose-300">−10</button><button type="button" data-action="ini-mod-step" data-camp="${esc(cid)}" data-id="${esc(e.id)}" data-delta="10" data-tip="+10 Initiative" class="btn h-6 px-1 text-[9px] font-black text-emerald-300">+10</button>` : ''}
              ${isGm ? `<button type="button" data-action="ini-remove" data-camp="${esc(cid)}" data-id="${esc(e.id)}" data-tip="Entfernen" class="btn w-6 h-6 p-0 text-[10px] hover:text-rose-400">✕</button>` : ''}
            </div>
          </div>`;
        }).join('')}</div>`;

  return `${ctrlBar}<div data-scroll-key="iniList" class="flex-1 min-h-0 overflow-y-auto overscroll-contain pr-0.5">${rowsHtml}</div>`;
}

export function renderLobbyInitiativeCardHtml(campId = getActiveLiveCampaignId()){
  const cid = String(campId || 'default').trim() || 'default';
  const isGm = canManageCampaign(cid);
  const st = getCampaignInitiative(cid);
  if(!st.active && !isGm) return '';
  const campObj = getCampaigns().find(c => c.id === cid);
  const campName = campObj?.name || 'Kampagne';
  const sorted = getSortedInitiativeEntries(st, isGm);
  const isPopoutActive = Boolean(INI.open && INI.floating);
  return `<section class="subcard p-2.5 sm:p-3 border-2 ${st.active ? 'border-amber-400/65 bg-amber-500/5' : 'bdr-line'} space-y-2.5 min-w-0">
    <div class="flex flex-wrap items-center justify-between gap-2 min-w-0">
      <div class="flex flex-wrap items-center gap-1.5 min-w-0">
        <span class="text-xs sm:text-sm font-black ${st.active ? 'text-amber-300' : 'text-acc'} uppercase tracking-wider">⚡ Initiative-Reihenfolge</span>
        <span class="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-acc-soft text-acc border bdr-acc truncate max-w-[180px]">📁 ${esc(campName)}</span>
        ${st.active
          ? `<span class="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-400/50 inline-flex items-center gap-1"><span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>Aktiv • R${st.round} (${sorted.length})</span>`
          : `<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-black/25 t-mut border bdr-line">Inaktiv (SL)</span>`}
      </div>
      <div class="flex items-center gap-1.5 shrink-0">
        <button type="button" data-action="ini-popout" data-tip="Initiative als schwebendes Pop-Out-Overlay lösen (bleibt ohne Abdunklung über Lobby &amp; Charakterbogen sichtbar)" class="hidden md:inline-flex btn py-1 px-2.5 text-xs font-extrabold ${isPopoutActive ? 'btn-pri ring-1 ring-amber-400' : 'border-amber-400/55 bg-amber-500/15 text-amber-200'}">📌 Pop-Out</button>
        <button type="button" data-action="toggle-ini" class="btn py-1 px-2.5 text-xs font-extrabold ${INI.open && !INI.floating ? 'btn-pri' : 'bdr-acc bg-acc-soft text-acc'}">🪟 Fenster</button>
      </div>
    </div>
    ${st.active || isGm ? renderInitiativeBodyHtml(cid, { inWindow: false }) : ''}
  </section>`;
}

export function renderInitiativeWindow(){
  const mount = $('iniMount'), bd = $('iniBackdrop'), xl = window.innerWidth >= 1280;
  if(!mount || !bd) return;
  const snap = mount.childElementCount > 0 ? captureScrollState(mount) : null;
  applyWinFrame('ini', mount, bd, WIN_DEFAULTS.ini.dockClass);
  if(!INI.open){ mount.innerHTML = ''; return; }
  const cid = getActiveInitiativeCampaignId();
  const isGm = canManageCampaign(cid);
  const st = getCampaignInitiative(cid);
  const campObj = getCampaigns().find(c => c.id === cid);
  const campName = campObj?.name || 'Kampagne';
  const mobFlow = isMobileLayout();
  const isOverlay = Boolean(INI.floating && !mobFlow);
  const isCompact = Boolean(isOverlay && INI.compact);
  const isCollapsed = Boolean(isOverlay && INI.collapsed);
  const sorted = getSortedInitiativeEntries(st, isGm);
  const activeEntry = sorted.find(e => e.id === st.activeEntryId) || null;
  const padCls = isCollapsed ? 'px-2.5 py-2' : (isCompact ? 'p-2.5 gap-2' : 'p-3 sm:p-4 gap-3');
  const bodyHtml = isCollapsed
    ? ''
    : (isCompact ? renderInitiativeCompactOverlayHtml(cid) : renderInitiativeBodyHtml(cid, { inWindow: true }));

  mount.innerHTML = `<div class="card ${padCls} flex flex-col min-w-0 max-w-full ${mobFlow ? 'min-h-full' : (isCollapsed ? '' : 'h-full')} border-2 ${st.active ? 'border-amber-400/75' : 'bdr-acc'} shadow-2xl relative ${isOverlay ? 'ini-overlay-card' : ''}">
    <div data-win-drag="ini" class="shrink-0 flex items-center justify-between gap-1.5 ${isCollapsed ? '' : 'border-b bdr-line pb-2'} ${INI.floating ? 'cursor-move select-none' : ''}">
      <div class="flex items-center gap-1.5 min-w-0 flex-1">
        <h3 class="${isCompact || isCollapsed ? 'text-xs sm:text-sm' : 'text-sm sm:text-base'} font-black text-amber-300 truncate">⚡${isCompact || isCollapsed ? '' : ' Initiative'}</h3>
        ${st.active ? `<span class="px-1.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-400/50 shrink-0 tabular">R${st.round}</span>` : ''}
        ${isCollapsed && activeEntry
          ? `<span class="text-xs font-extrabold truncate text-amber-200">▶ ${esc(activeEntry.name)}</span>`
          : `<span class="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-acc-soft text-acc border bdr-acc truncate max-w-[130px]">${esc(campName)}</span>`}
      </div>
      <div class="flex items-center gap-1 shrink-0">
        ${isCollapsed && isGm && sorted.length ? `<button type="button" data-action="ini-step" data-camp="${esc(cid)}" data-delta="1" data-tip="Nächster Zug" class="btn btn-pri h-7 px-2 text-[11px] font-black">▶</button>` : ''}
        ${!mobFlow && !INI.floating ? `<button type="button" data-action="ini-popout" data-tip="Als schwebendes Overlay (Pop-Out ohne dunklen Hintergrund) lösen" class="hidden md:inline-flex btn py-1 px-2 text-xs border-amber-400/55 bg-amber-500/15 text-amber-200 font-extrabold">📌 Pop-Out</button>` : ''}
        ${isOverlay ? `<button type="button" data-action="ini-toggle-compact" data-tip="${INI.compact ? 'Zur ausführlichen Overlay-Ansicht wechseln' : 'Kompaktes HUD-Overlay aktivieren (ideal neben dem Charakterbogen)'}" class="hidden md:inline-flex btn py-1 px-2 text-xs font-extrabold ${INI.compact ? 'btn-pri' : ''}">${INI.compact ? '⊞ Voll' : '⊟ Kompakt'}</button>` : ''}
        ${isOverlay ? `<button type="button" data-action="ini-toggle-collapsed" data-tip="${INI.collapsed ? 'Overlay aufklappen' : 'Auf schmale Runden-Leiste einklappen'}" aria-label="${INI.collapsed ? 'Aufklappen' : 'Einklappen'}" class="hidden md:inline-flex btn w-7 h-7 p-0 text-xs font-black">${INI.collapsed ? '▾' : '▴'}</button>` : ''}
        ${xl && !UI.inLobby && !INI.floating ? `<button type="button" data-action="toggle-ini-dock" data-tip="An rechte Seite andocken" class="btn py-1 px-2 text-xs ${INI.docked ? 'btn-pri' : ''}">${INI.docked ? '📌' : '📍'}</button>` : ''}
        ${!isOverlay ? renderWinCtrlBtns('ini') : `<button type="button" data-action="win-reset" data-win="ini" data-tip="Overlay-Position &amp; Größe zurücksetzen" class="hidden md:inline-flex btn py-1 px-1.5 text-xs">↺</button>`}
        <button type="button" data-action="close-ini" aria-label="Initiative schließen" class="btn w-8 h-8 sm:w-7 sm:h-7 p-0 text-xs font-black">✕</button>
      </div>
    </div>
    ${bodyHtml}
    ${!mobFlow && !isCollapsed ? renderWinResizeHandles('ini') : ''}
  </div>`;
  if(snap) restoreScrollState(mount, snap, { preserveWindow: false });
}

export function updateInitiativeUI(){
  const lobEl = $('lobbyIniMount');
  if(lobEl){
    const campId = getActiveLiveCampaignId();
    const snap = lobEl.childElementCount > 0 ? captureScrollState(lobEl) : null;
    lobEl.innerHTML = renderLobbyInitiativeCardHtml(campId);
    if(snap) restoreScrollState(lobEl, snap, { preserveWindow: false });
  }
  if(UI.inLobby) hooks.refreshGmEnemiesGridDOM?.();
  if(INI.open) renderInitiativeWindow();
  hooks.renderHeader?.();
}
