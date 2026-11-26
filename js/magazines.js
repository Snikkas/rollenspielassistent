import {
  $, uid, esc, clone, toInt, fmtTagLabel
} from './utils.js';
import {
  hooks
} from './ui-hooks.js';
import {
  S, D, COMBAT, openCtxMenu, toast, logChron, save, makeAmmo, syncEquipmentToInventory
} from './state.js';

export const MAG_MAX_CAP = 999;
export const MAG_MAX_COUNT = 50;
export const MAG_VISUAL_SLOT_LIMIT = 24;

export function makeMagazine({ name = '', cap = 6, count = null, defaultAmmoId = '', slotOverrides = null } = {}){
  const cleanCap = Math.max(1, Math.min(MAG_MAX_CAP, toInt(cap, 6)));
  const cleanCount = count === null || count === undefined
    ? cleanCap
    : Math.max(0, Math.min(cleanCap, toInt(count, cleanCap)));
  const cleanOvr = {};
  if(slotOverrides && typeof slotOverrides === 'object'){
    Object.entries(slotOverrides).forEach(([k, v]) => {
      const idx = toInt(k, 0);
      const aid = String(v || '').trim();
      if(idx >= 1 && idx <= cleanCap && aid) cleanOvr[String(idx)] = aid;
    });
  }
  return {
    id: uid(),
    name: String(name || '').trim() || 'Magazin #1',
    cap: cleanCap,
    count: cleanCount,
    defaultAmmoId: String(defaultAmmoId || '').trim(),
    slotOverrides: cleanOvr,
    slotsOpen: false
  };
}

export function makeDefaultMagCfg(){
  return {
    enabled: false,
    cap: 6,
    autoSyncAmmo: true,
    activeMagId: '',
    expanded: true,
    mags: []
  };
}

export function normalizeWeaponMagCfg(rawCfg, validAmmoIds = null, fallbackAmmoId = ''){
  const def = makeDefaultMagCfg();
  if(!rawCfg || typeof rawCfg !== 'object') return def;
  const hasSet = validAmmoIds instanceof Set;
  const cleanAmmoId = rawId => {
    const id = String(rawId || '').trim();
    if(!id) return '';
    return (!hasSet || validAmmoIds.has(id)) ? id : '';
  };
  const defCap = Math.max(1, Math.min(MAG_MAX_CAP, toInt(rawCfg.cap, 6)));
  const fbAmmo = cleanAmmoId(fallbackAmmoId);
  const mags = Array.isArray(rawCfg.mags)
    ? rawCfg.mags.filter(m => m && typeof m === 'object').slice(0, MAG_MAX_COUNT).map((m, idx) => {
        const cap = Math.max(1, Math.min(MAG_MAX_CAP, toInt(m.cap, defCap)));
        const count = Math.max(0, Math.min(cap, toInt(m.count, cap)));
        const dAmmo = cleanAmmoId(m.defaultAmmoId) || (m.defaultAmmoId === '' ? '' : fbAmmo);
        const ovr = {};
        if(m.slotOverrides && typeof m.slotOverrides === 'object'){
          Object.entries(m.slotOverrides).forEach(([sk, sv]) => {
            const sNum = toInt(sk, 0);
            const aid = cleanAmmoId(sv);
            if(sNum >= 1 && sNum <= cap && aid) ovr[String(sNum)] = aid;
          });
        }
        return {
          id: String(m.id || '').trim() || uid(),
          name: String(m.name || '').trim() || `Magazin #${idx + 1}`,
          cap,
          count,
          defaultAmmoId: dAmmo,
          slotOverrides: ovr,
          slotsOpen: Boolean(m.slotsOpen)
        };
      })
    : [];
  let activeMagId = String(rawCfg.activeMagId || '').trim();
  if(activeMagId && !mags.some(m => m.id === activeMagId)) activeMagId = '';
  if(!activeMagId && mags.length) activeMagId = mags[0].id;
  return {
    enabled: Boolean(rawCfg.enabled),
    cap: defCap,
    autoSyncAmmo: rawCfg.autoSyncAmmo !== undefined ? Boolean(rawCfg.autoSyncAmmo) : true,
    activeMagId,
    expanded: rawCfg.expanded !== undefined ? Boolean(rawCfg.expanded) : true,
    mags
  };
}

export function hasActiveMagazines(weapon){
  return Boolean(weapon && weapon.wType === 'ranged' && weapon.magCfg && weapon.magCfg.enabled);
}

export function ensureWeaponMagCfg(weapon){
  if(!weapon) return makeDefaultMagCfg();
  if(!weapon.magCfg || typeof weapon.magCfg !== 'object'){
    weapon.magCfg = makeDefaultMagCfg();
  }
  if(!Array.isArray(weapon.magCfg.mags)) weapon.magCfg.mags = [];
  weapon.magCfg.cap = Math.max(1, Math.min(MAG_MAX_CAP, toInt(weapon.magCfg.cap, 6)));
  if(weapon.magCfg.enabled && !weapon.magCfg.mags.length){
    const first = makeMagazine({
      name: 'Magazin #1',
      cap: weapon.magCfg.cap,
      count: weapon.magCfg.cap,
      defaultAmmoId: weapon.ammoId || ''
    });
    weapon.magCfg.mags.push(first);
    weapon.magCfg.activeMagId = first.id;
  }
  if(weapon.magCfg.mags.length && !weapon.magCfg.mags.some(m => m.id === weapon.magCfg.activeMagId)){
    weapon.magCfg.activeMagId = weapon.magCfg.mags[0].id;
  }
  return weapon.magCfg;
}

export function getMagNextSlotNum(mag){
  if(!mag) return 0;
  const cap = Math.max(1, toInt(mag.cap, 1));
  const count = Math.max(0, Math.min(cap, toInt(mag.count, 0)));
  if(count <= 0) return 0;
  return cap - count + 1;
}

export function getMagSlotAmmoId(weapon, mag, slotNum){
  if(!mag) return String(weapon?.ammoId || '').trim();
  const sKey = String(toInt(slotNum, 0));
  const ovr = mag.slotOverrides && typeof mag.slotOverrides === 'object' ? String(mag.slotOverrides[sKey] || '').trim() : '';
  if(ovr) return ovr;
  const defId = String(mag.defaultAmmoId || '').trim();
  if(defId) return defId;
  return String(weapon?.ammoId || '').trim();
}

export function isMagSlotOverride(mag, slotNum){
  if(!mag || !mag.slotOverrides || typeof mag.slotOverrides !== 'object') return false;
  return Boolean(String(mag.slotOverrides[String(toInt(slotNum, 0))] || '').trim());
}

export function getWeaponActiveMag(weapon){
  if(!hasActiveMagazines(weapon)) return null;
  const mags = Array.isArray(weapon.magCfg?.mags) ? weapon.magCfg.mags : [];
  if(!mags.length) return null;
  return mags.find(m => m.id === weapon.magCfg.activeMagId) || mags[0] || null;
}

export function getNextReloadableMag(weapon){
  if(!hasActiveMagazines(weapon)) return null;
  const mags = Array.isArray(weapon.magCfg?.mags) ? weapon.magCfg.mags : [];
  if(mags.length < 2) return null;
  const curIdx = Math.max(0, mags.findIndex(m => m.id === weapon.magCfg.activeMagId));
  for(let step = 1; step < mags.length; step++){
    const cand = mags[(curIdx + step) % mags.length];
    if(cand && toInt(cand.count, 0) > 0) return cand;
  }
  return null;
}

export function getWeaponNextShotInfo(weapon, sheet = S){
  const ammos = Array.isArray(sheet?.ammos) ? sheet.ammos : [];
  if(!hasActiveMagazines(weapon)){
    const aid = String(weapon?.ammoId || '').trim();
    const ammo = aid ? (ammos.find(a => a.id === aid) || null) : null;
    return {
      hasMags: false,
      mag: null,
      magIdx: -1,
      count: ammo ? Math.max(0, toInt(ammo.qty, 0)) : 0,
      cap: 0,
      nextSlot: 0,
      ammoId: ammo?.id || '',
      ammo,
      isOverride: false,
      totalLoaded: ammo ? Math.max(0, toInt(ammo.qty, 0)) : 0,
      totalCap: 0,
      readyMagCount: 0,
      nextReloadMag: null
    };
  }
  const mags = Array.isArray(weapon.magCfg?.mags) ? weapon.magCfg.mags : [];
  const mag = getWeaponActiveMag(weapon);
  const magIdx = mag ? mags.findIndex(m => m.id === mag.id) : -1;
  const cap = mag ? Math.max(1, toInt(mag.cap, weapon.magCfg.cap || 6)) : 0;
  const count = mag ? Math.max(0, Math.min(cap, toInt(mag.count, 0))) : 0;
  const nextSlot = getMagNextSlotNum(mag);
  const rawAmmoId = nextSlot > 0
    ? getMagSlotAmmoId(weapon, mag, nextSlot)
    : String(mag?.defaultAmmoId || weapon?.ammoId || '').trim();
  const ammo = rawAmmoId ? (ammos.find(a => a.id === rawAmmoId) || null) : null;
  const isOverride = nextSlot > 0 && isMagSlotOverride(mag, nextSlot) && Boolean(ammo);
  const totalLoaded = mags.reduce((sum, m) => sum + Math.max(0, Math.min(toInt(m.cap, 1), toInt(m.count, 0))), 0);
  const totalCap = mags.reduce((sum, m) => sum + Math.max(1, toInt(m.cap, 1)), 0);
  const readyMagCount = mags.filter(m => toInt(m.count, 0) > 0).length;
  const nextReloadMag = getNextReloadableMag(weapon);
  return {
    hasMags: true,
    mag,
    magIdx,
    count,
    cap,
    nextSlot,
    ammoId: ammo?.id || '',
    ammo,
    isOverride,
    totalLoaded,
    totalCap,
    readyMagCount,
    nextReloadMag
  };
}

export function getEffectiveWeaponAmmo(weapon, sheet = S){
  if(!weapon || weapon.wType !== 'ranged') return null;
  return getWeaponNextShotInfo(weapon, sheet).ammo;
}

export function countLoadedRoundsByAmmo(sheet = S, onlyWeaponId = ''){
  const counts = new Map();
  const add = (aid, n = 1) => {
    const id = String(aid || '').trim();
    if(!id || n <= 0) return;
    counts.set(id, (counts.get(id) || 0) + n);
  };
  (sheet?.weapons || []).forEach(w => {
    if(!hasActiveMagazines(w)) return;
    if(onlyWeaponId && w.id !== onlyWeaponId) return;
    (w.magCfg.mags || []).forEach(m => {
      const cap = Math.max(1, toInt(m.cap, 1));
      const count = Math.max(0, Math.min(cap, toInt(m.count, 0)));
      if(count <= 0) return;
      const startSlot = cap - count + 1;
      for(let s = startSlot; s <= cap; s++){
        const aid = getMagSlotAmmoId(w, m, s);
        if(aid) add(aid, 1);
      }
    });
  });
  return counts;
}

export function getAmmoMagStats(ammoId, sheet = S){
  const aid = String(ammoId || '').trim();
  const am = (sheet?.ammos || []).find(a => a.id === aid) || null;
  const totalQty = am ? Math.max(0, toInt(am.qty, 0)) : 0;
  const map = countLoadedRoundsByAmmo(sheet);
  const inMags = aid ? (map.get(aid) || 0) : 0;
  const looseQty = Math.max(0, totalQty - inMags);
  return { ammo: am, totalQty, inMags, looseQty };
}

export function syncAmmoTotalsFromMagazines(sheet = S, { mode = 'ensureMin', targetAmmoIds = null } = {}){
  const loadedMap = countLoadedRoundsByAmmo(sheet);
  const targetSet = Array.isArray(targetAmmoIds) ? new Set(targetAmmoIds.filter(Boolean)) : null;
  let changed = false;
  (sheet?.ammos || []).forEach(am => {
    if(!am || !am.id) return;
    if(targetSet && !targetSet.has(am.id)) return;
    const inMags = loadedMap.get(am.id) || 0;
    const cur = Math.max(0, toInt(am.qty, 0));
    if(mode === 'exact'){
      if(cur !== inMags){
        am.qty = inMags;
        changed = true;
      }
    }else if(inMags > cur){
      am.qty = inMags;
      changed = true;
    }
  });
  if(changed){
    syncEquipmentToInventory(sheet);
  }
  return changed;
}

export function purgeDeletedAmmoFromMagazines(ammoId, sheet = S){
  const aid = String(ammoId || '').trim();
  if(!aid) return;
  (sheet?.weapons || []).forEach(w => {
    if(!w?.magCfg || !Array.isArray(w.magCfg.mags)) return;
    w.magCfg.mags.forEach(m => {
      if(m.defaultAmmoId === aid) m.defaultAmmoId = '';
      if(m.slotOverrides && typeof m.slotOverrides === 'object'){
        Object.keys(m.slotOverrides).forEach(sk => {
          if(m.slotOverrides[sk] === aid) delete m.slotOverrides[sk];
        });
      }
    });
  });
}

function getWeaponAmmoIdsInMags(weapon){
  const set = new Set();
  if(weapon?.ammoId) set.add(weapon.ammoId);
  (weapon?.magCfg?.mags || []).forEach(m => {
    if(m.defaultAmmoId) set.add(m.defaultAmmoId);
    if(m.slotOverrides && typeof m.slotOverrides === 'object'){
      Object.values(m.slotOverrides).forEach(v => { if(v) set.add(v); });
    }
  });
  return [...set];
}

function notifyMagChange(weapon, { renderDiceToo = true } = {}){
  hooks.invalidateModsCache?.();
  hooks.syncDiceFromSheet?.();
  syncEquipmentToInventory(S);
  hooks.renderMain?.();
  if(renderDiceToo && D.open) hooks.renderDice?.();
  save();
}

export function toggleWeaponMagazines(weaponId){
  const w = (S.weapons || []).find(x => x.id === weaponId);
  if(!w || w.wType !== 'ranged') return;
  const cfg = ensureWeaponMagCfg(w);
  cfg.enabled = !cfg.enabled;
  if(cfg.enabled){
    ensureWeaponMagCfg(w);
    if(cfg.autoSyncAmmo){
      syncAmmoTotalsFromMagazines(S, { mode: 'ensureMin', targetAmmoIds: getWeaponAmmoIdsInMags(w) });
    }
    toast('📦 Magazin-System für diese Fernkampfwaffe aktiviert!');
  }else{
    toast('Magazin-System deaktiviert (direkter Munitionsvorrat aktiv).');
  }
  notifyMagChange(w);
}

export function toggleWeaponMagAutoSync(weaponId){
  const w = (S.weapons || []).find(x => x.id === weaponId);
  if(!w) return;
  const cfg = ensureWeaponMagCfg(w);
  cfg.autoSyncAmmo = !cfg.autoSyncAmmo;
  if(cfg.autoSyncAmmo){
    syncAmmoTotalsFromMagazines(S, { mode: 'ensureMin', targetAmmoIds: getWeaponAmmoIdsInMags(w) });
    toast('📦 Auto-Vorrat aktiv: Munitionsbestand passt sich automatisch an Magazine an.');
  }else{
    toast('📥 Einsortier-Modus aktiv: Magazine werden aus vorhandenem Munitionsvorrat befüllt.');
  }
  notifyMagChange(w);
}

export function setWeaponMagDefaultCap(weaponId, newCapRaw, { applyToAll = false } = {}){
  const w = (S.weapons || []).find(x => x.id === weaponId);
  if(!w) return;
  const cfg = ensureWeaponMagCfg(w);
  const newCap = Math.max(1, Math.min(MAG_MAX_CAP, toInt(newCapRaw, cfg.cap || 6)));
  const prevCap = cfg.cap;
  cfg.cap = newCap;
  if(applyToAll){
    cfg.mags.forEach(m => {
      const wasFull = m.count >= m.cap;
      m.cap = newCap;
      if(wasFull && cfg.autoSyncAmmo) m.count = newCap;
      else m.count = Math.min(m.count, newCap);
      if(m.slotOverrides){
        Object.keys(m.slotOverrides).forEach(sk => {
          if(toInt(sk, 0) > newCap) delete m.slotOverrides[sk];
        });
      }
    });
  }else if(cfg.mags.length === 1 && cfg.mags[0].cap === prevCap){
    const m0 = cfg.mags[0];
    const wasFull = m0.count >= m0.cap;
    m0.cap = newCap;
    if(wasFull && cfg.autoSyncAmmo) m0.count = newCap;
    else m0.count = Math.min(m0.count, newCap);
  }
  if(cfg.autoSyncAmmo){
    syncAmmoTotalsFromMagazines(S, { mode: 'ensureMin', targetAmmoIds: getWeaponAmmoIdsInMags(w) });
  }
  notifyMagChange(w);
}

export function setWeaponMagCount(weaponId, targetCountRaw){
  const w = (S.weapons || []).find(x => x.id === weaponId);
  if(!w) return;
  const cfg = ensureWeaponMagCfg(w);
  const target = Math.max(1, Math.min(MAG_MAX_COUNT, toInt(targetCountRaw, cfg.mags.length || 1)));
  const defAmmoId = getWeaponActiveMag(w)?.defaultAmmoId || w.ammoId || '';
  while(cfg.mags.length < target){
    let initCount = cfg.cap;
    if(!cfg.autoSyncAmmo && defAmmoId){
      const st = getAmmoMagStats(defAmmoId, S);
      initCount = Math.min(cfg.cap, st.looseQty);
    }
    cfg.mags.push(makeMagazine({
      name: `Magazin #${cfg.mags.length + 1}`,
      cap: cfg.cap,
      count: initCount,
      defaultAmmoId: defAmmoId
    }));
  }
  if(cfg.mags.length > target){
    cfg.mags.length = target;
  }
  if(!cfg.mags.some(m => m.id === cfg.activeMagId)){
    cfg.activeMagId = cfg.mags[0]?.id || '';
  }
  if(cfg.autoSyncAmmo){
    syncAmmoTotalsFromMagazines(S, { mode: 'ensureMin', targetAmmoIds: getWeaponAmmoIdsInMags(w) });
  }
  notifyMagChange(w);
}

export function addWeaponMagazine(weaponId, { duplicateFromId = '' } = {}){
  const w = (S.weapons || []).find(x => x.id === weaponId);
  if(!w) return;
  const cfg = ensureWeaponMagCfg(w);
  if(cfg.mags.length >= MAG_MAX_COUNT){
    toast(`Maximal ${MAG_MAX_COUNT} Magazine pro Waffe möglich.`);
    return;
  }
  const src = duplicateFromId ? cfg.mags.find(m => m.id === duplicateFromId) : null;
  const defAmmoId = src?.defaultAmmoId || getWeaponActiveMag(w)?.defaultAmmoId || w.ammoId || '';
  const cap = src ? src.cap : cfg.cap;
  let count = cap;
  if(!cfg.autoSyncAmmo && defAmmoId){
    const st = getAmmoMagStats(defAmmoId, S);
    count = Math.min(cap, st.looseQty);
  }
  const nextMag = makeMagazine({
    name: src ? `${src.name} (Kopie)` : `Magazin #${cfg.mags.length + 1}`,
    cap,
    count,
    defaultAmmoId: defAmmoId,
    slotOverrides: src ? clone(src.slotOverrides || {}) : {}
  });
  cfg.mags.push(nextMag);
  if(!cfg.activeMagId) cfg.activeMagId = nextMag.id;
  if(cfg.autoSyncAmmo){
    syncAmmoTotalsFromMagazines(S, { mode: 'ensureMin', targetAmmoIds: getWeaponAmmoIdsInMags(w) });
  }
  toast(`📦 ${nextMag.name} angelegt (${nextMag.count}/${nextMag.cap}).`);
  notifyMagChange(w);
}

export function deleteWeaponMagazine(weaponId, magId){
  const w = (S.weapons || []).find(x => x.id === weaponId);
  if(!w || !w.magCfg) return;
  const cfg = w.magCfg;
  if(cfg.mags.length <= 1){
    toast('Mindestens 1 Magazin bleibt aktiv (zum Abschalten oben „Magazine“ deaktivieren).');
    return;
  }
  cfg.mags = cfg.mags.filter(m => m.id !== magId);
  if(cfg.activeMagId === magId){
    cfg.activeMagId = cfg.mags[0]?.id || '';
  }
  notifyMagChange(w);
  toast('🗑️ Magazin entfernt.');
}

export function selectWeaponActiveMag(weaponId, magId, { silent = false } = {}){
  const w = (S.weapons || []).find(x => x.id === weaponId);
  if(!w || !w.magCfg) return;
  const m = w.magCfg.mags.find(x => x.id === magId);
  if(!m) return;
  w.magCfg.activeMagId = m.id;
  if(COMBAT.active && COMBAT.weaponId === w.id){
    const info = getWeaponNextShotInfo(w, S);
    COMBAT.ammoId = info.ammoId || null;
  }
  notifyMagChange(w);
  if(!silent) toast(`🔄 ${m.name} eingelegt (${m.count}/${m.cap} Schuss).`);
}

export function reloadWeaponMagazine(weaponId){
  const w = (S.weapons || []).find(x => x.id === weaponId);
  if(!w || !hasActiveMagazines(w)) return false;
  const nextMag = getNextReloadableMag(w);
  const wName = String(w.name || '').trim() || 'Fernkampfwaffe';
  if(!nextMag){
    const cur = getWeaponActiveMag(w);
    if(cur && cur.count > 0){
      toast(`ℹ️ Kein weiteres geladenes Magazin – ${cur.name} hat noch ${cur.count}/${cur.cap} Schuss.`);
    }else{
      toast(`⚠️ Alle Magazine von „${wName}“ sind leer! Fülle ein Magazin aus dem Vorrat auf.`);
    }
    return false;
  }
  w.magCfg.activeMagId = nextMag.id;
  if(COMBAT.active && COMBAT.weaponId === w.id){
    const info = getWeaponNextShotInfo(w, S);
    COMBAT.ammoId = info.ammoId || null;
    COMBAT.ammoSpent = false;
  }
  logChron(`🔄 Nachgeladen (${wName}): ${nextMag.name} eingelegt (${nextMag.count}/${nextMag.cap} Schuss).`);
  notifyMagChange(w);
  toast(`🔄 Nachgeladen: ${nextMag.name} eingelegt (${nextMag.count}/${nextMag.cap} Schuss)!`);
  return true;
}

export function fireWeaponMagazineShot(weaponId, { fromCombat = false } = {}){
  const w = (S.weapons || []).find(x => x.id === weaponId);
  if(!w || !hasActiveMagazines(w)) return { ok: false, empty: false };
  const info = getWeaponNextShotInfo(w, S);
  const wName = String(w.name || '').trim() || 'Fernkampfwaffe';
  if(!info.mag || info.count <= 0){
    const hasNext = Boolean(info.nextReloadMag);
    toast(hasNext
      ? `⚠️ ${info.mag?.name || 'Magazin'} ist leer (0/${info.cap}) – klicke auf „Nachladen“!`
      : `⚠️ ${info.mag?.name || 'Magazin'} ist leer (0/${info.cap}) – keine geladenen Reserve-Magazine!`);
    return { ok: false, empty: true, mag: info.mag };
  }
  const firedSlot = info.nextSlot;
  const firedAmmo = info.ammo;
  const wasOvr = info.isOverride;
  info.mag.count = Math.max(0, info.count - 1);
  if(firedAmmo){
    firedAmmo.qty = Math.max(0, toInt(firedAmmo.qty, 0) - 1);
    hooks.syncLinkedAmmoDOM?.(firedAmmo.id, null);
  }
  const ammoLabel = firedAmmo ? (String(firedAmmo.name || '').trim() || 'Munition') : 'Patrone';
  const ovrHint = wasOvr ? ' ★' : '';
  logChron(`🏹 Schuss (${wName} • ${info.mag.name}, Slot ${firedSlot}/${info.cap}): −1 ${ammoLabel}${ovrHint} (Magazin: ${info.mag.count}/${info.cap}).`);
  if(fromCombat){
    COMBAT.ammoSpent = true;
  }
  notifyMagChange(w);
  if(info.mag.count === 0){
    toast(`🏹 −1 ${ammoLabel}${ovrHint} • ${info.mag.name} jetzt LEER (0/${info.cap})${getNextReloadableMag(w) ? ' → Nachladen bereit!' : ''}`);
  }else{
    toast(`🏹 −1 ${ammoLabel}${ovrHint} (${info.mag.name}: ${info.mag.count}/${info.cap})`);
  }
  return { ok: true, empty: info.mag.count === 0, firedAmmo, firedSlot, mag: info.mag };
}

function tryLoadOneLooseRound(w, m){
  if(m.count >= m.cap) return false;
  const slotNum = m.cap - m.count;
  const ovrId = isMagSlotOverride(m, slotNum) ? String(m.slotOverrides[String(slotNum)] || '').trim() : '';
  const defId = String(m.defaultAmmoId || w.ammoId || '').trim();
  if(ovrId){
    if(getAmmoMagStats(ovrId, S).looseQty > 0){
      m.count++;
      return true;
    }
    if(defId && defId !== ovrId && getAmmoMagStats(defId, S).looseQty > 0){
      delete m.slotOverrides[String(slotNum)];
      m.count++;
      return true;
    }
    return false;
  }
  if(!defId){
    m.count++;
    return true;
  }
  if(getAmmoMagStats(defId, S).looseQty > 0){
    m.count++;
    return true;
  }
  return false;
}

export function stepMagazineCount(weaponId, magId, delta){
  const w = (S.weapons || []).find(x => x.id === weaponId);
  if(!w || !w.magCfg) return;
  const m = w.magCfg.mags.find(x => x.id === magId);
  if(!m) return;
  const d = toInt(delta, 0);
  if(!d) return;
  if(d > 0 && !w.magCfg.autoSyncAmmo){
    let added = 0;
    for(let i = 0; i < d; i++){
      if(!tryLoadOneLooseRound(w, m)) break;
      added++;
    }
    if(added === 0){
      toast('⚠️ Keine lose Munition im Vorrat zum Einsortieren verfügbar!');
      return;
    }
    notifyMagChange(w);
    return;
  }
  const prev = Math.max(0, Math.min(m.cap, toInt(m.count, 0)));
  m.count = Math.max(0, Math.min(m.cap, prev + d));
  if(w.magCfg.autoSyncAmmo && d > 0){
    syncAmmoTotalsFromMagazines(S, { mode: 'ensureMin', targetAmmoIds: getWeaponAmmoIdsInMags(w) });
  }
  notifyMagChange(w);
}

export function fillMagazine(weaponId, magId, { fromLooseOnly = false } = {}){
  const w = (S.weapons || []).find(x => x.id === weaponId);
  if(!w || !w.magCfg) return;
  const m = w.magCfg.mags.find(x => x.id === magId);
  if(!m) return;
  const useLooseOnly = fromLooseOnly || !w.magCfg.autoSyncAmmo;
  if(!useLooseOnly){
    m.count = m.cap;
    syncAmmoTotalsFromMagazines(S, { mode: 'ensureMin', targetAmmoIds: getWeaponAmmoIdsInMags(w) });
    notifyMagChange(w);
    toast(`📦 ${m.name} voll aufgefüllt (${m.count}/${m.cap}).`);
    return;
  }
  const missing = Math.max(0, m.cap - m.count);
  if(!missing){
    toast(`✓ ${m.name} ist bereits voll (${m.count}/${m.cap}).`);
    return;
  }
  let added = 0;
  for(let k = 0; k < missing; k++){
    if(!tryLoadOneLooseRound(w, m)) break;
    added++;
  }
  notifyMagChange(w);
  if(added === 0){
    toast(`⚠️ Keine lose Munition im Vorrat zum Einsortieren in ${m.name}.`);
  }else if(added < missing){
    toast(`📥 ${added} Schuss aus losem Vorrat in ${m.name} einsortiert (${m.count}/${m.cap}, Vorrat erschöpft).`);
  }else{
    toast(`📥 ${m.name} aus losem Vorrat aufgefüllt (${m.count}/${m.cap}).`);
  }
}

export function fillAllWeaponMagazines(weaponId, { fromLooseOnly = false } = {}){
  const w = (S.weapons || []).find(x => x.id === weaponId);
  if(!w || !w.magCfg || !w.magCfg.mags.length) return;
  const useLooseOnly = fromLooseOnly || !w.magCfg.autoSyncAmmo;
  if(!useLooseOnly){
    w.magCfg.mags.forEach(m => { m.count = m.cap; });
    syncAmmoTotalsFromMagazines(S, { mode: 'ensureMin', targetAmmoIds: getWeaponAmmoIdsInMags(w) });
    notifyMagChange(w);
    toast(`📦 Alle ${w.magCfg.mags.length} Magazine voll aufgefüllt & Vorrat synchronisiert.`);
    return;
  }
  let totalAdded = 0;
  w.magCfg.mags.forEach(m => {
    const missing = Math.max(0, m.cap - m.count);
    for(let k = 0; k < missing; k++){
      if(!tryLoadOneLooseRound(w, m)) break;
      totalAdded++;
    }
  });
  notifyMagChange(w);
  if(totalAdded === 0){
    toast('⚠️ Keine lose Munition im Vorrat (oder alle Magazine sind bereits voll).');
  }else{
    toast(`📥 ${totalAdded} Schuss aus losem Vorrat auf Magazine verteilt.`);
  }
}

export function emptyMagazine(weaponId, magId){
  const w = (S.weapons || []).find(x => x.id === weaponId);
  if(!w || !w.magCfg) return;
  const m = w.magCfg.mags.find(x => x.id === magId);
  if(!m) return;
  m.count = 0;
  notifyMagChange(w);
  toast(`📤 ${m.name} geleert (Munition liegt im losen Vorrat).`);
}

export function syncWeaponAmmoExactFromMags(weaponId){
  const w = (S.weapons || []).find(x => x.id === weaponId);
  if(!w || !hasActiveMagazines(w)) return;
  const aids = getWeaponAmmoIdsInMags(w);
  if(!aids.length){
    toast('⚠️ Bitte zuerst mindestens eine Munitionsart einem Magazin oder der Waffe zuordnen.');
    return;
  }
  syncAmmoTotalsFromMagazines(S, { mode: 'exact', targetAmmoIds: aids });
  notifyMagChange(w);
  toast('🔄 Munitionsvorrat exakt aus den geladenen Magazinen berechnet!');
}

export function setMagSlotOverride(weaponId, magId, slotNum, ammoId){
  const w = (S.weapons || []).find(x => x.id === weaponId);
  if(!w || !w.magCfg) return;
  const m = w.magCfg.mags.find(x => x.id === magId);
  if(!m) return;
  const s = toInt(slotNum, 0);
  if(s < 1 || s > m.cap){
    toast(`⚠️ Slot muss zwischen 1 und ${m.cap} liegen.`);
    return;
  }
  if(!m.slotOverrides || typeof m.slotOverrides !== 'object') m.slotOverrides = {};
  const aid = String(ammoId || '').trim();
  const defId = String(m.defaultAmmoId || w.ammoId || '').trim();
  if(!aid || aid === defId){
    delete m.slotOverrides[String(s)];
  }else{
    m.slotOverrides[String(s)] = aid;
  }
  if(w.magCfg.autoSyncAmmo && aid){
    syncAmmoTotalsFromMagazines(S, { mode: 'ensureMin', targetAmmoIds: [aid] });
  }
  notifyMagChange(w);
}

export function clearMagSlotOverrides(weaponId, magId){
  const w = (S.weapons || []).find(x => x.id === weaponId);
  if(!w || !w.magCfg) return;
  const m = w.magCfg.mags.find(x => x.id === magId);
  if(!m) return;
  m.slotOverrides = {};
  notifyMagChange(w);
  toast(`↺ Alle Slot-Overwrites in ${m.name} auf Standard-Munition zurückgesetzt.`);
}

export function openMagDefaultAmmoPicker(anchorEl, weaponId, magId){
  const w = (S.weapons || []).find(x => x.id === weaponId);
  const m = w?.magCfg?.mags?.find(x => x.id === magId);
  if(!w || !m) return;
  const wAmmo = w.ammoId ? (S.ammos || []).find(a => a.id === w.ammoId) : null;
  const items = [
    {
      icon: '🎯',
      label: wAmmo ? `Waffen-Standard (${wAmmo.name || 'Munition'})` : 'Keine Standard-Munition',
      active: !m.defaultAmmoId,
      onClick: () => {
        m.defaultAmmoId = '';
        notifyMagChange(w);
      }
    }
  ];
  if((S.ammos || []).length){
    items.push({ sep: true });
    S.ammos.forEach(am => {
      const st = getAmmoMagStats(am.id, S);
      items.push({
        icon: '🎯',
        label: String(am.name || '').trim() || 'Unbenannte Munition',
        sub: `Schnitt ${am.dmgCut} • Durchstoß ${am.dmgPierce} • Einschlag ${am.dmgImpact} • Lose: ${st.looseQty}`,
        badge: `${am.qty} Stk.`,
        active: m.defaultAmmoId === am.id,
        onClick: () => {
          m.defaultAmmoId = am.id;
          if(w.magCfg.autoSyncAmmo){
            syncAmmoTotalsFromMagazines(S, { mode: 'ensureMin', targetAmmoIds: [am.id] });
          }
          notifyMagChange(w);
        }
      });
    });
  }
  items.push({ sep: true });
  items.push({
    icon: '+',
    label: 'Neue Munition erstellen & Magazin zuweisen',
    onClick: () => {
      const na = makeAmmo(`Munition #${S.ammos.length + 1}`, Math.max(m.cap, 12));
      S.ammos.push(na);
      m.defaultAmmoId = na.id;
      if(!w.ammoId) w.ammoId = na.id;
      if(w.magCfg.autoSyncAmmo){
        syncAmmoTotalsFromMagazines(S, { mode: 'ensureMin', targetAmmoIds: [na.id] });
      }
      notifyMagChange(w);
      toast(`🎯 „${na.name}“ erstellt & ${m.name} zugeordnet.`);
    }
  });
  openCtxMenu({
    key: `mag-def-ammo:${weaponId}:${magId}`,
    title: `Standard-Munition • ${m.name}`,
    anchorEl,
    align: 'left',
    minWidth: 270,
    showClose: true,
    items
  });
}

export function openMagSlotAmmoPicker(anchorEl, weaponId, magId, slotNum){
  const w = (S.weapons || []).find(x => x.id === weaponId);
  const m = w?.magCfg?.mags?.find(x => x.id === magId);
  if(!w || !m) return;
  const s = toInt(slotNum, 0);
  if(s < 1 || s > m.cap) return;
  const curOvr = String(m.slotOverrides?.[String(s)] || '').trim();
  const defId = String(m.defaultAmmoId || w.ammoId || '').trim();
  const defAmmo = defId ? (S.ammos || []).find(a => a.id === defId) : null;
  const items = [
    {
      type: 'label',
      label: `Slot #${s} von ${m.cap} (${m.name})`
    },
    {
      icon: '↺',
      label: `Standard-Munition (${defAmmo ? (defAmmo.name || 'Munition') : 'Keine'})`,
      sub: 'Kein Overwrite – nutzt automatisch die Magazin-Standardmunition',
      active: !curOvr,
      onClick: () => setMagSlotOverride(weaponId, magId, s, '')
    }
  ];
  if((S.ammos || []).length){
    items.push({ sep: true });
    items.push({ type: 'label', label: '★ Spezifische Munition als Overwrite' });
    S.ammos.forEach(am => {
      const isDef = am.id === defId;
      const dmgSub = `Schnitt ${am.dmgCut} • Durchstoß ${am.dmgPierce} • Einschlag ${am.dmgImpact}`;
      items.push({
        icon: curOvr === am.id ? '★' : '🎯',
        label: String(am.name || '').trim() || 'Unbenannte Munition',
        sub: `${dmgSub}${isDef ? ' • (Standard)' : ''}`,
        badge: `${am.qty} Stk.`,
        active: curOvr === am.id,
        onClick: () => setMagSlotOverride(weaponId, magId, s, am.id)
      });
    });
  }
  items.push({ sep: true });
  items.push({
    icon: '+',
    label: 'Neue Spezialmunition anlegen & in Slot legen',
    onClick: () => {
      const na = makeAmmo(`Spezialmunition #${S.ammos.length + 1}`, 6);
      S.ammos.push(na);
      setMagSlotOverride(weaponId, magId, s, na.id);
      toast(`★ „${na.name}“ erstellt & in Slot #${s} geladen.`);
    }
  });
  openCtxMenu({
    key: `mag-slot-ammo:${weaponId}:${magId}:${s}`,
    title: `Slot #${s} • ${m.name}`,
    anchorEl,
    align: 'left',
    minWidth: 275,
    showClose: true,
    items
  });
}

export function renderWeaponMagazineSectionHtml(w){
  if(!w || w.wType !== 'ranged') return '';
  const enabled = hasActiveMagazines(w);
  if(!enabled){
    return `<div class="pt-1.5 border-t border-amber-500/25 flex flex-wrap items-center justify-between gap-2">
      <span class="text-[11px] t-mut">📦 Optional: Munition in Magazine sortieren, nachladen &amp; einzelne Slots überschreiben</span>
      <button type="button" data-action="wp-mag-toggle" data-wid="${esc(w.id)}" data-tip="Aktiviert das Magazin-System für diese Fernkampfwaffe (Ordner für Munition, Nachladen &amp; Slot-Overwrites)" class="btn py-1 px-2.5 text-[11px] font-extrabold border-amber-400/50 bg-amber-500/15 text-amber-200">📦 Magazine aktivieren</button>
    </div>`;
  }

  const cfg = ensureWeaponMagCfg(w);
  const info = getWeaponNextShotInfo(w, S);
  const activeMag = info.mag;
  const ammos = S.ammos || [];
  const ammoById = new Map(ammos.map(a => [a.id, a]));
  const nextAmmoName = info.ammo ? (String(info.ammo.name || '').trim() || 'Munition') : 'Keine Munition';
  const nextReload = info.nextReloadMag;

  const ammoSummaryPills = (() => {
    const ids = getWeaponAmmoIdsInMags(w);
    if(!ids.length) return '';
    return `<div class="flex flex-wrap items-center gap-1.5 text-[10px] tabular">
      ${ids.map(aid => {
        const st = getAmmoMagStats(aid, S);
        if(!st.ammo) return '';
        return `<span class="px-2 py-0.5 rounded-md bg-black/30 border bdr-line" data-tip="Gesamtbestand ${st.totalQty} = ${st.inMags} in Magazinen + ${st.looseQty} lose im Vorrat">🎯 <strong>${esc(st.ammo.name || 'Munition')}</strong>: <span class="text-amber-300 font-black">${st.inMags}</span> in Mag. • <span class="${st.looseQty > 0 ? 'text-emerald-300' : 't-mut'} font-bold">${st.looseQty}</span> lose (Ges: ${st.totalQty})</span>`;
      }).join('')}
    </div>`;
  })();

  const magsListHtml = cfg.expanded ? `<div class="space-y-2 pt-2 border-t border-amber-500/25">
    <div class="flex flex-wrap items-center justify-between gap-2">
      <div class="flex flex-wrap items-center gap-2 tabular">
        <div class="inline-flex items-center gap-1">
          <span class="text-[10px] font-extrabold t-mut uppercase">Magazine:</span>
          <button type="button" data-action="wp-mag-count-step" data-wid="${esc(w.id)}" data-delta="-1" aria-label="Weniger Magazine" class="btn w-7 h-7 p-0 text-xs font-black">−</button>
          <input data-wpmag-cfg="${esc(w.id)}:count" type="text" inputmode="numeric" value="${cfg.mags.length}" aria-label="Anzahl Magazine" class="inp w-12 text-center font-black py-1 px-1 text-xs"/>
          <button type="button" data-action="wp-mag-count-step" data-wid="${esc(w.id)}" data-delta="1" aria-label="Mehr Magazine" class="btn w-7 h-7 p-0 text-xs font-black">+</button>
        </div>
        <div class="inline-flex items-center gap-1">
          <span class="text-[10px] font-extrabold t-mut uppercase" data-tip="Standard-Kapazität (Schuss pro Magazin)">Kapazität:</span>
          <input data-wpmag-cfg="${esc(w.id)}:cap" type="text" inputmode="numeric" value="${cfg.cap}" aria-label="Kapazität pro Magazin" class="inp w-14 text-center font-black py-1 px-1 text-xs"/>
          <button type="button" data-action="wp-mag-apply-cap-all" data-wid="${esc(w.id)}" data-tip="Wendet Kapazität (${cfg.cap}) auf alle Magazine dieser Waffe an" class="btn py-1 px-2 text-[10px] font-bold">Alle = ${cfg.cap}</button>
        </div>
      </div>
      <div class="flex flex-wrap items-center gap-1.5">
        <button type="button" data-action="wp-mag-toggle-autosync" data-wid="${esc(w.id)}" data-tip="${cfg.autoSyncAmmo ? 'Auto-Vorrat AN: Beim Einrichten/Befüllen von Magazinen ergibt sich der Munitionsvorrat automatisch. Klicken für Einsortier-Modus aus bestehendem Vorrat.' : 'Einsortier-Modus AN: Magazine werden wie Ordner nur aus dem vorhandenen losen Munitionsvorrat befüllt. Klicken für Auto-Vorrat.'}" class="btn py-1 px-2 text-[10px] font-extrabold ${cfg.autoSyncAmmo ? 'border-emerald-400/55 bg-emerald-500/15 text-emerald-200' : 'border-sky-400/55 bg-sky-500/15 text-sky-200'}">${cfg.autoSyncAmmo ? '🔄 Auto-Vorrat: AN' : '📥 Einsortieren (Vorrat)'}</button>
        <button type="button" data-action="wp-mag-fill-all" data-wid="${esc(w.id)}" data-tip="${cfg.autoSyncAmmo ? 'Füllt alle Magazine voll auf und passt den Vorrat an' : 'Sortiert verfügbare lose Munition in alle Magazine ein'}" class="btn py-1 px-2 text-[10px] font-bold">📥 Alle füllen</button>
        <button type="button" data-action="wp-mag-sync-exact" data-wid="${esc(w.id)}" data-tip="Setzt den Gesamtbestand der zugeordneten Munition exakt auf die Summe aller aktuell geladenen Kugeln in Magazinen" class="btn py-1 px-2 text-[10px] font-bold">⚖️ Vorrat = Mag.</button>
      </div>
    </div>

    ${ammoSummaryPills}

    <div class="space-y-1.5">
      ${cfg.mags.map((m, idx) => {
        const isAct = activeMag && activeMag.id === m.id;
        const mCap = Math.max(1, toInt(m.cap, 1));
        const mCnt = Math.max(0, Math.min(mCap, toInt(m.count, 0)));
        const nextSlot = getMagNextSlotNum(m);
        const defAmmoObj = (m.defaultAmmoId ? ammoById.get(m.defaultAmmoId) : null) || (w.ammoId ? ammoById.get(w.ammoId) : null);
        const defAmmoLbl = m.defaultAmmoId
          ? (defAmmoObj ? (defAmmoObj.name || 'Munition') : 'Standard')
          : (defAmmoObj ? `Std: ${defAmmoObj.name || 'Munition'}` : 'Keine Munition');
        const ovrEntries = Object.entries(m.slotOverrides || {})
          .map(([sk, aid]) => ({ slot: toInt(sk, 0), aid, ammo: ammoById.get(aid) || null }))
          .filter(x => x.slot >= 1 && x.slot <= mCap && x.ammo)
          .sort((a, b) => a.slot - b.slot);
        const ovrCount = ovrEntries.length;

        let slotsHtml = '';
        if(m.slotsOpen){
          if(mCap <= MAG_VISUAL_SLOT_LIMIT){
            const chips = [];
            for(let s = 1; s <= mCap; s++){
              const spent = mCnt === 0 || s < nextSlot;
              const isNext = s === nextSlot;
              const ovrId = String(m.slotOverrides?.[String(s)] || '').trim();
              const slotAmmo = ammoById.get(ovrId || m.defaultAmmoId || w.ammoId || '') || null;
              const slotTip = `Slot #${s}/${mCap}${isNext ? ' (Nächster Schuss!)' : spent ? ' (Verschossen / Leer)' : ' (Geladen)'}\nMunition: ${slotAmmo ? (slotAmmo.name || 'Munition') : 'Keine'}${ovrId ? ' ★ Overwrite' : ' (Standard)'}\nKlicken zum Überschreiben`;
              const cls = spent
                ? 'border-slate-600/50 bg-black/25 t-mut opacity-55 line-through'
                : isNext
                  ? (ovrId ? 'border-2 border-fuchsia-400 bg-fuchsia-500/25 text-fuchsia-100 ring-1 ring-amber-400/70' : 'border-2 border-amber-400 bg-amber-500/25 text-amber-100')
                  : ovrId
                    ? 'border-fuchsia-400/70 bg-fuchsia-500/20 text-fuchsia-200'
                    : 'border-amber-500/35 bg-amber-500/10 text-amber-200/90';
              chips.push(`<button type="button" data-action="wp-mag-slot-pick" data-wid="${esc(w.id)}" data-mid="${esc(m.id)}" data-slot="${s}" data-tip="${esc(slotTip)}" class="px-2 py-1 rounded-md border text-[10px] font-black tabular cursor-pointer hover:brightness-110 transition-all ${cls}">${isNext ? '▶' : ''}${ovrId ? '★' : ''}${s}</button>`);
            }
            slotsHtml = `<div class="p-2 rounded-lg bg-black/30 border bdr-line space-y-1.5">
              <div class="flex flex-wrap items-center justify-between gap-1.5 text-[10px]">
                <span class="font-bold t-mut">🎯 Schuss-Slots (1 = erster Schuss → ${mCap} = letzter Schuss) – Klick für Overwrite:</span>
                ${ovrCount ? `<button type="button" data-action="wp-mag-slot-clear" data-wid="${esc(w.id)}" data-mid="${esc(m.id)}" class="btn py-0.5 px-1.5 text-[10px] text-rose-300">↺ Overwrites löschen (${ovrCount})</button>` : ''}
              </div>
              <div class="flex flex-wrap gap-1">${chips.join('')}</div>
              ${ovrCount ? `<div class="flex flex-wrap gap-1 pt-1 border-t border-white/10 text-[10px]">${ovrEntries.map(o => `<span class="px-1.5 py-0.5 rounded bg-fuchsia-500/20 border border-fuchsia-400/45 text-fuchsia-200 font-bold tabular">★ Slot #${o.slot}: ${esc(o.ammo.name || 'Munition')}</span>`).join('')}</div>` : ''}
            </div>`;
          }else{
            slotsHtml = `<div class="p-2 rounded-lg bg-black/30 border bdr-line space-y-2 text-[11px]">
              <div class="flex flex-wrap items-center justify-between gap-1.5">
                <span class="text-[10px] font-bold t-mut">🎯 Großes Magazin (${mCap} Slots) – gezielten Slot überschreiben (1 = erster Schuss, aktuell bei Slot ${nextSlot || 'Leer'}):</span>
                ${ovrCount ? `<button type="button" data-action="wp-mag-slot-clear" data-wid="${esc(w.id)}" data-mid="${esc(m.id)}" class="btn py-0.5 px-1.5 text-[10px] text-rose-300">↺ Alle löschen</button>` : ''}
              </div>
              <div class="flex flex-wrap items-center gap-1.5">
                <span class="text-[10px] font-bold t-mut">Slot #:</span>
                <input id="inpMagSlot_${esc(w.id)}_${esc(m.id)}" type="text" inputmode="numeric" value="${nextSlot || 1}" class="inp w-16 text-center font-black py-1 px-1 text-xs tabular"/>
                <button type="button" data-action="wp-mag-slot-pick-inp" data-wid="${esc(w.id)}" data-mid="${esc(m.id)}" class="btn py-1 px-2.5 text-[11px] font-extrabold border-fuchsia-400/55 bg-fuchsia-500/15 text-fuchsia-200">★ Munition für Slot wählen</button>
              </div>
              ${ovrCount ? `<div class="flex flex-wrap gap-1">${ovrEntries.map(o => `<button type="button" data-action="wp-mag-slot-pick" data-wid="${esc(w.id)}" data-mid="${esc(m.id)}" data-slot="${o.slot}" class="btn py-0.5 px-2 text-[10px] border-fuchsia-400/55 bg-fuchsia-500/20 text-fuchsia-200 font-bold tabular">★ #${o.slot}: ${esc(o.ammo.name || 'Munition')}</button>`).join('')}</div>` : '<div class="text-[10px] t-mut">Keine Slot-Overwrites gesetzt (alle Slots nutzen die Standard-Munition).</div>'}
            </div>`;
          }
        }

        const pct = Math.round((mCnt / mCap) * 100);
        return `<div class="p-2 rounded-xl border ${isAct ? 'border-amber-400/75 bg-amber-500/12 shadow-sm' : 'bdr-line bg-black/25'} space-y-2 min-w-0">
          <div class="flex flex-wrap items-center gap-1.5 min-w-0">
            <button type="button" data-action="wp-mag-select" data-wid="${esc(w.id)}" data-mid="${esc(m.id)}" data-tip="${isAct ? 'Aktuell in der Waffe eingelegt' : 'Dieses Magazin jetzt einlegen'}" class="btn h-7 px-2 text-[11px] font-black shrink-0 ${isAct ? 'bg-amber-500 text-slate-950 border-amber-300' : 'opacity-80 hover:opacity-100'}">${isAct ? '✓ Aktiv' : 'Einlegen'}</button>
            <input data-wpmag-f="${esc(w.id)}:${esc(m.id)}:name" type="text" value="${esc(m.name)}" placeholder="Magazin #${idx + 1}" class="inp-line flex-1 min-w-[90px] text-xs font-extrabold"/>
            <div class="flex items-center gap-1 shrink-0 tabular">
              <button type="button" data-action="wp-mag-step" data-wid="${esc(w.id)}" data-mid="${esc(m.id)}" data-delta="-1" aria-label="1 Patrone weniger" class="btn w-7 h-7 p-0 text-xs font-black">−</button>
              <span class="px-2 py-0.5 rounded-md bg-black/35 border ${mCnt === 0 ? 'border-rose-500/55 text-rose-300' : 'border-amber-400/45 text-amber-200'} text-xs font-black min-w-[48px] text-center">${mCnt}/${mCap}</span>
              <button type="button" data-action="wp-mag-step" data-wid="${esc(w.id)}" data-mid="${esc(m.id)}" data-delta="1" aria-label="1 Patrone mehr" class="btn w-7 h-7 p-0 text-xs font-black">+</button>
            </div>
            <input data-wpmag-f="${esc(w.id)}:${esc(m.id)}:cap" type="text" inputmode="numeric" value="${mCap}" data-tip="Individuelle Kapazität dieses Magazins" aria-label="Kapazität von ${esc(m.name)}" class="inp w-12 text-center font-bold py-1 px-1 text-[11px] tabular shrink-0"/>
          </div>
          <div class="h-1.5 rounded-full bg-black/40 overflow-hidden"><div class="h-full transition-all ${mCnt === 0 ? 'bg-rose-500' : isAct ? 'bg-amber-400' : 'bg-sky-400/80'}" style="width:${pct}%"></div></div>
          <div class="flex flex-wrap items-center justify-between gap-1.5">
            <button type="button" data-action="wp-mag-defammo" data-wid="${esc(w.id)}" data-mid="${esc(m.id)}" aria-haspopup="menu" data-tip="Standard-Munition für alle regulären Slots dieses Magazins festlegen" class="inp py-1 px-2 text-[11px] font-bold flex items-center gap-1.5 max-w-full min-w-0 cursor-pointer hover:border-amber-400/70"><span class="truncate">🎯 ${esc(defAmmoLbl)}</span><span class="t-mut text-[9px] shrink-0">▾</span></button>
            <div class="flex flex-wrap items-center gap-1 shrink-0">
              <button type="button" data-action="wp-mag-toggle-slots" data-wid="${esc(w.id)}" data-mid="${esc(m.id)}" data-tip="Einzelne Schuss-Slots ansehen oder mit Spezialmunition überschreiben" class="btn py-1 px-2 text-[10px] font-extrabold ${m.slotsOpen ? 'btn-pri' : ovrCount ? 'border-fuchsia-400/60 bg-fuchsia-500/20 text-fuchsia-200' : ''}">★ Slots${ovrCount ? ` (${ovrCount})` : ''}</button>
              <button type="button" data-action="wp-mag-fill" data-wid="${esc(w.id)}" data-mid="${esc(m.id)}" data-tip="${cfg.autoSyncAmmo ? 'Magazin voll auffüllen' : 'Aus losem Vorrat auffüllen'}" class="btn py-1 px-2 text-[10px] font-bold">📥 Voll</button>
              ${mCnt > 0 ? `<button type="button" data-action="wp-mag-empty" data-wid="${esc(w.id)}" data-mid="${esc(m.id)}" data-tip="Magazin entleeren (Kugeln bleiben im losen Vorrat)" class="btn py-1 px-1.5 text-[10px]">📤</button>` : ''}
              <button type="button" data-action="wp-mag-dup" data-wid="${esc(w.id)}" data-mid="${esc(m.id)}" data-tip="Dieses Magazin inkl. Slot-Overwrites duplizieren" class="btn py-1 px-1.5 text-[10px]">📋</button>
              ${cfg.mags.length > 1 ? `<button type="button" data-action="wp-mag-del" data-wid="${esc(w.id)}" data-mid="${esc(m.id)}" data-tip="Magazin entfernen" class="btn py-1 px-1.5 text-[10px] hover:text-rose-400">✕</button>` : ''}
            </div>
          </div>
          ${slotsHtml}
        </div>`;
      }).join('')}
    </div>
  </div>` : '';

  const activeAmmoDmgHtml = info.ammo ? `<div class="flex flex-wrap items-center gap-1.5 tabular pt-1">
    <span class="px-2 py-0.5 rounded-md bg-black/25 border bdr-line text-[11px] font-semibold">Schnitt: <strong class="text-amber-300 font-black">${esc(info.ammo.dmgCut)}</strong></span>
    <span class="px-2 py-0.5 rounded-md bg-black/25 border bdr-line text-[11px] font-semibold">Durchstoß: <strong class="text-amber-300 font-black">${esc(info.ammo.dmgPierce)}</strong></span>
    <span class="px-2 py-0.5 rounded-md bg-black/25 border bdr-line text-[11px] font-semibold">Einschlag: <strong class="text-amber-300 font-black">${esc(info.ammo.dmgImpact)}</strong></span>
    ${(info.ammo.tags || []).map(tg => `<span class="tag !border-amber-400/45 !bg-amber-500/15 !text-amber-300">${esc(fmtTagLabel(tg.name, tg.x))}</span>`).join('')}
  </div>` : '';

  return `<div class="pt-2 border-t border-amber-500/30 space-y-2 min-w-0">
    <div class="flex flex-wrap items-center justify-between gap-2 min-w-0">
      <div class="flex flex-wrap items-center gap-1.5 min-w-0 tabular">
        <button type="button" data-action="wp-mag-toggle-exp" data-wid="${esc(w.id)}" class="btn h-7 px-2 text-[11px] font-black border-amber-400/50 bg-amber-500/15 text-amber-200">${cfg.expanded ? '▾' : '▸'} 📦 Magazine (${cfg.mags.length})</button>
        <span class="px-2 py-0.5 rounded-md border text-[11px] font-black ${info.count === 0 ? 'border-rose-500/60 bg-rose-500/20 text-rose-200' : 'border-amber-400/55 bg-amber-500/15 text-amber-200'}">${esc(activeMag?.name || 'Magazin')}: ${info.count}/${info.cap}</span>
        <span class="text-[11px] font-bold ${info.isOverride ? 'text-fuchsia-300' : 't-mut'} truncate max-w-full">${info.count > 0 ? `Nächster: Slot #${info.nextSlot} (${info.isOverride ? '★ ' : ''}${esc(nextAmmoName)})` : 'Magazin leer!'}</span>
      </div>
      <div class="flex flex-wrap items-center gap-1.5 shrink-0">
        <button type="button" data-action="wp-mag-shoot" data-wid="${esc(w.id)}" ${info.count <= 0 ? 'disabled' : ''} class="btn bg-amber-500 text-slate-950 border-amber-300 py-1 px-2.5 text-[11px] font-black">🏹 −1 Schuss</button>
        <button type="button" data-action="wp-mag-reload" data-wid="${esc(w.id)}" ${!nextReload ? 'disabled' : ''} data-tip="${nextReload ? `Lädt „${esc(nextReload.name)}“ (${nextReload.count}/${nextReload.cap}) ein` : 'Kein weiteres geladenes Magazin verfügbar'}" class="btn py-1 px-2.5 text-[11px] font-black ${info.count === 0 && nextReload ? 'btn-ok ring-1 ring-emerald-300' : 'bdr-acc bg-acc-soft text-acc'}">🔄 Nachladen${nextReload ? ` (${nextReload.count}/${nextReload.cap})` : ''}</button>
        <button type="button" data-action="wp-mag-toggle" data-wid="${esc(w.id)}" data-tip="Magazin-System für diese Waffe deaktivieren" class="btn py-1 px-2 text-[10px] opacity-75 hover:opacity-100">Aus</button>
      </div>
    </div>
    ${activeAmmoDmgHtml}
    ${magsListHtml}
  </div>`;
}

export function renderDiceMagazineStripHtml(w){
  if(!hasActiveMagazines(w)) return '';
  const info = getWeaponNextShotInfo(w, S);
  const nextReload = info.nextReloadMag;
  const ammoNm = info.ammo ? (String(info.ammo.name || '').trim() || 'Munition') : 'Keine Munition';
  return `<div class="p-2 rounded-lg border ${info.count === 0 ? 'border-rose-500/60 bg-rose-500/12' : 'border-amber-400/45 bg-amber-500/10'} flex flex-wrap items-center justify-between gap-1.5 text-[11px] tabular min-w-0">
    <div class="min-w-0 flex-1">
      <div class="flex flex-wrap items-center gap-1.5">
        <span class="font-black ${info.count === 0 ? 'text-rose-300' : 'text-amber-300'}">📦 ${esc(info.mag?.name || 'Magazin')}: ${info.count}/${info.cap}</span>
        <span class="text-[10px] t-mut">(${info.readyMagCount}/${w.magCfg.mags.length} Mag. bereit)</span>
      </div>
      <div class="text-[10px] truncate ${info.isOverride ? 'text-fuchsia-300 font-extrabold' : 't-mut'}">${info.count > 0 ? `Nächster Schuss: Slot #${info.nextSlot} • ${info.isOverride ? '★ ' : ''}${esc(ammoNm)}` : '⚠️ Magazin leer – bitte nachladen!'}</div>
    </div>
    <div class="flex items-center gap-1 shrink-0">
      <button type="button" data-action="wp-mag-shoot" data-wid="${esc(w.id)}" ${info.count <= 0 ? 'disabled' : ''} class="btn py-1 px-2 text-[10px] font-black bg-amber-500 text-slate-950 border-amber-300">🏹 −1</button>
      <button type="button" data-action="wp-mag-reload" data-wid="${esc(w.id)}" ${!nextReload ? 'disabled' : ''} class="btn py-1 px-2 text-[10px] font-black ${info.count === 0 && nextReload ? 'btn-ok' : 'bdr-acc bg-acc-soft text-acc'}">🔄 Nachladen</button>
    </div>
  </div>`;
}
