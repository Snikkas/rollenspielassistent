import {
  DEF_HZ
} from './constants.js';
import {
  uid, esc, toInt, fmtSign
} from './utils.js';
import {
  hooks
} from './ui-hooks.js';
import {
  S, D, UI, CLOUD, DUEL, COMBAT, LIVE_TAB_ID, diceLogs, getWeaponSubtype, getCharCampaignId, getCharOwner, getActiveLiveCampaignId, canManageCampaign, isGlobalGM, toast, triggerNiceEasterEgg, logChron, save
} from './state.js';
import {
  calcActiveMods
} from './calc.js';
import {
  getCachedForeignSheet, publishLiveRoll, sendLiveBroadcast, applyCloudResourceDelta, isSecretRollActive
} from './cloud.js';
import {
  isLobbyNeutralDice, rollW100, renderDice
} from './dice.js';

export function getWeaponAllTags(weapon, ammo = null){
  return [
    ...(Array.isArray(weapon?.tags) ? weapon.tags : []),
    ...(Array.isArray(ammo?.tags) ? ammo.tags : [])
  ].filter(t => t && String(t.name || '').trim());
}

export function findTagNumericVal(tags, regex){
  let best = 0;
  (tags || []).forEach(tg => {
    const nm = String(tg?.name || '').trim();
    if(!regex.test(nm)) return;
    let v = 0;
    if(tg.x !== undefined && tg.x !== '' && tg.x !== null){
      v = toInt(tg.x, 0);
    }
    if(!v){
      const m = nm.match(/\(\s*(\d+)\s*\)/);
      if(m) v = toInt(m[1], 0);
    }
    if(!v) v = 1;
    best = Math.max(best, v);
  });
  return best;
}

export function hasTagMatch(tags, regex){
  return (tags || []).some(tg => regex.test(String(tg?.name || '').trim()));
}

export function getWeaponDamageOptions(weapon, ammo = null){
  const cut = toInt(weapon?.dmgCut, 0) + toInt(ammo?.dmgCut, 0);
  const pierce = toInt(weapon?.dmgPierce, 0) + toInt(ammo?.dmgPierce, 0);
  const impact = toInt(weapon?.dmgImpact, 0) + toInt(ammo?.dmgImpact, 0);
  const tags = getWeaponAllTags(weapon, ammo);
  const hasWuchtklinge = hasTagMatch(tags, /^wuchtklinge\b/i);
  const hasWuchtpieke = hasTagMatch(tags, /^wuchtpieke\b/i);

  const opts = [
    { key: 'cut', label: 'Schnitt', val: cut, isCombo: false, isCustom: false },
    { key: 'pierce', label: 'Durchstoß', val: pierce, isCombo: false, isCustom: false },
    { key: 'impact', label: 'Einschlag', val: impact, isCombo: false, isCustom: false }
  ];
  if(hasWuchtklinge || (cut > 0 && impact > 0)){
    opts.push({
      key: 'impact_cut',
      label: hasWuchtklinge ? 'Einschlag-Schnitt (Wuchtklinge)' : 'Einschlag-Schnitt',
      shortLabel: 'Einschlag-Schnitt',
      val: Math.max(cut, impact),
      isCombo: true,
      comboKeys: ['impact', 'cut'],
      isCustom: false
    });
  }
  if(hasWuchtpieke || (pierce > 0 && impact > 0)){
    opts.push({
      key: 'impact_pierce',
      label: hasWuchtpieke ? 'Einschlag-Durchstoß (Wuchtpieke)' : 'Einschlag-Durchstoß',
      shortLabel: 'Einschlag-Durchstoß',
      val: Math.max(pierce, impact),
      isCombo: true,
      comboKeys: ['impact', 'pierce'],
      isCustom: false
    });
  }
  const customMap = new Map();
  const addCustom = arr => {
    (Array.isArray(arr) ? arr : []).forEach(c => {
      const lbl = String(c?.label || '').trim();
      if(!lbl) return;
      const low = lbl.toLowerCase();
      const prev = customMap.get(low);
      if(prev){
        prev.val += toInt(c?.val, 0);
      }else{
        customMap.set(low, {
          key: `custom:${low}`,
          label: lbl,
          shortLabel: lbl,
          val: toInt(c?.val, 0),
          isCombo: false,
          isCustom: true,
          customLabel: lbl
        });
      }
    });
  };
  addCustom(weapon?.customDmg);
  addCustom(ammo?.customDmg);
  customMap.forEach(v => opts.push(v));
  return opts;
}

export function pickDefaultDamageType(opts, tags){
  if(hasTagMatch(tags, /^wuchtklinge\b/i) && opts.some(o => o.key === 'impact_cut')) return 'impact_cut';
  if(hasTagMatch(tags, /^wuchtpieke\b/i) && opts.some(o => o.key === 'impact_pierce')) return 'impact_pierce';
  const stdPos = opts.filter(o => !o.isCombo && !o.isCustom && o.val > 0).sort((a, b) => b.val - a.val);
  if(stdPos.length) return stdPos[0].key;
  const custPos = opts.find(o => o.isCustom && o.val > 0);
  if(custPos) return custPos.key;
  return 'cut';
}

export function resolveCombatTargetSheet(charId = COMBAT.targetCharId){
  const id = String(charId || '').trim();
  if(!id) return null;
  if(!UI.inLobby && S?.charId && S.charId === id) return S;
  return getCachedForeignSheet(id);
}

export function getTargetHitZones(targetSheet){
  if(targetSheet && Array.isArray(targetSheet.hitZones) && targetSheet.hitZones.length){
    return targetSheet.hitZones;
  }
  return DEF_HZ;
}

export function matchHitZoneByRoll(hitZones, roll){
  const r = toInt(roll, 0);
  return (hitZones || []).find(z => {
    const m = String(z?.range || '').match(/\d+/g);
    if(!m) return false;
    const lo = Math.min(+m[0], +(m[1] ?? m[0]));
    const hi = Math.max(+m[0], +(m[1] ?? m[0]));
    return r >= lo && r <= hi;
  }) || null;
}

export function getTargetZoneArmor(targetSheet, targetM, zoneName, dmgOpt, pool = 'lp'){
  const znLow = String(zoneName || '').trim().toLowerCase();
  const pieces = [];
  let pieceSum = 0;
  if(targetSheet && znLow){
    const equipped = (targetSheet.armors || []).filter(ar => ar && ar.equipped !== false);
    equipped.forEach(ar => {
      const zList = [...(Array.isArray(ar.zones) ? ar.zones : []), ...(Array.isArray(ar.extraZones) ? ar.extraZones : [])]
        .map(z => String(z || '').trim().toLowerCase())
        .filter(Boolean);
      if(!zList.includes(znLow)) return;
      const arName = String(ar.name || '').trim() || 'Rüstung';
      const grp = pool === 'mlp' ? 0 : toInt(ar.grp, 0);
      let spec = 0;
      let specDesc = '';
      if(dmgOpt?.key === 'cut'){
        spec = toInt(ar.protCut, 0);
        specDesc = `Schnitt ${spec}`;
      }else if(dmgOpt?.key === 'pierce'){
        spec = toInt(ar.protPierce, 0);
        specDesc = `Durchstoß ${spec}`;
      }else if(dmgOpt?.key === 'impact'){
        spec = toInt(ar.protImpact, 0);
        specDesc = `Einschlag ${spec}`;
      }else if(dmgOpt?.key === 'impact_cut'){
        const pC = toInt(ar.protCut, 0), pI = toInt(ar.protImpact, 0);
        spec = Math.min(pC, pI);
        specDesc = `min(Einschlag ${pI}, Schnitt ${pC})`;
      }else if(dmgOpt?.key === 'impact_pierce'){
        const pP = toInt(ar.protPierce, 0), pI = toInt(ar.protImpact, 0);
        spec = Math.min(pP, pI);
        specDesc = `min(Einschlag ${pI}, Durchstoß ${pP})`;
      }else if(dmgOpt?.isCustom){
        const cLow = String(dmgOpt.customLabel || '').trim().toLowerCase();
        spec = (Array.isArray(ar.customProt) ? ar.customProt : [])
          .filter(cp => String(cp?.label || '').trim().toLowerCase() === cLow)
          .reduce((acc, cp) => acc + toInt(cp?.val, 0), 0);
        specDesc = `${dmgOpt.customLabel} ${spec}`;
      }
      const tot = grp + spec;
      pieceSum += tot;
      pieces.push({
        id: ar.id,
        name: arName,
        grp,
        spec,
        specDesc,
        total: tot,
        detail: grp > 0 ? `${arName} (gRP ${grp} + ${specDesc} = ${tot})` : `${arName} (${specDesc} = ${tot})`
      });
    });
  }
  const globalMod = pool === 'mlp' ? 0 : toInt(targetM?.armor, 0);
  const manualMod = toInt(COMBAT.armorMod, 0);
  const total = Math.max(0, pieceSum + globalMod + manualMod);
  const detailParts = pieces.map(p => p.detail);
  if(globalMod) detailParts.push(`Effekte ${fmtSign(globalMod)}`);
  if(manualMod) detailParts.push(`Mod ${fmtSign(manualMod)}`);
  return {
    pieces,
    pieceSum,
    globalMod,
    manualMod,
    total,
    detailText: detailParts.length ? detailParts.join(' • ') : (targetSheet ? 'Keine Rüstung auf dieser Zone (0)' : 'Kein Zielbogen (0)')
  };
}

export function evaluateThresholds(targetSheet, targetM, finalDmg, pool = 'lp'){
  const thObj = targetSheet?.thresholds || { woundLight: 3, woundMedium: 6, woundHeavy: 9, traumaLight: 3, traumaMedium: 6, traumaHeavy: 9 };
  const isMlp = pool === 'mlp';
  const light = Math.max(1, toInt(isMlp ? thObj.traumaLight : thObj.woundLight, 3) + toInt(isMlp ? targetM?.traumaLight : targetM?.woundLight, 0));
  const medium = Math.max(1, toInt(isMlp ? thObj.traumaMedium : thObj.woundMedium, 6) + toInt(isMlp ? targetM?.traumaMedium : targetM?.woundMedium, 0));
  const heavy = Math.max(1, toInt(isMlp ? thObj.traumaHeavy : thObj.woundHeavy, 9) + toInt(isMlp ? targetM?.traumaHeavy : targetM?.woundHeavy, 0));
  const kindWord = isMlp ? 'Trauma' : 'Verwundung';
  let level = 'none', label = '', thresholdVal = 0;
  if(finalDmg >= heavy){
    level = 'heavy';
    label = isMlp ? `🔴 Schweres ${kindWord} (≥ ${heavy})` : `🔴 Schwere ${kindWord} (≥ ${heavy})`;
    thresholdVal = heavy;
  }else if(finalDmg >= medium){
    level = 'medium';
    label = isMlp ? `🟠 Mittleres ${kindWord} (≥ ${medium})` : `🟠 Mittlere ${kindWord} (≥ ${medium})`;
    thresholdVal = medium;
  }else if(finalDmg >= light){
    level = 'light';
    label = isMlp ? `🟡 Leichtes ${kindWord} (≥ ${light})` : `🟡 Leichte ${kindWord} (≥ ${light})`;
    thresholdVal = light;
  }
  return { level, label, thresholdVal, light, medium, heavy, kindWord };
}

export function calculateCombatDamage(){
  const isLob = isLobbyNeutralDice();
  const weapon = (!isLob && COMBAT.weaponId) ? (S.weapons || []).find(w => w.id === COMBAT.weaponId) : null;
  const ammo = (!isLob && weapon && weapon.wType === 'ranged' && (COMBAT.ammoId || weapon.ammoId))
    ? (S.ammos || []).find(a => a.id === (COMBAT.ammoId || weapon.ammoId))
    : null;
  const tags = getWeaponAllTags(weapon, ammo);
  const opts = getWeaponDamageOptions(weapon, ammo);
  const selOpt = opts.find(o => o.key === COMBAT.dmgType) || opts[0] || { key: 'cut', label: 'Schnitt', val: 0 };

  const targetSheet = resolveCombatTargetSheet(COMBAT.targetCharId);
  const targetM = targetSheet ? calcActiveMods(targetSheet) : null;
  const hitZones = getTargetHitZones(targetSheet);
  const zoneObj = hitZones.find(z => String(z.zone || '').trim().toLowerCase() === String(COMBAT.zoneName || '').trim().toLowerCase()) || hitZones[1] || hitZones[0];
  const zoneName = zoneObj ? String(zoneObj.zone || '').trim() : (COMBAT.zoneName || 'Rumpf');

  const eg = Math.max(0, toInt(COMBAT.eg, 0));
  const weaponDmg = toInt(selOpt.val, 0);
  const verheerendX = findTagNumericVal(tags, /^verheerend\b/i);
  const verheerendBonus = (verheerendX > 0 && eg >= 5) ? verheerendX : 0;
  const durchschlagX = findTagNumericVal(tags, /^durchschlag\b/i);
  const nichtParierbar = hasTagMatch(tags, /^nicht\s+parierbar\b/i);
  const dmgMod = toInt(COMBAT.dmgMod, 0);
  const rawDmg = Math.max(0, eg + weaponDmg + verheerendBonus + dmgMod);

  const blockRed = (COMBAT.isBlocked && COMBAT.blockItemRed) ? 2 : 0;
  const afterBlock = Math.max(0, rawDmg - blockRed);

  const pool = COMBAT.pool === 'mlp' ? 'mlp' : 'lp';
  const armor = getTargetZoneArmor(targetSheet, targetM, zoneName, selOpt, pool);
  const afterArmor = Math.max(0, afterBlock - armor.total);

  const durchschlagApplied = Boolean(COMBAT.isBlocked && durchschlagX > 0 && afterArmor === 0);
  const finalDmg = durchschlagApplied ? durchschlagX : afterArmor;
  const threshold = evaluateThresholds(targetSheet, targetM, finalDmg, pool);

  const parts = [`${eg} EG`];
  if(weaponDmg) parts.push(`+ ${weaponDmg} Waffe${ammo ? '/Mun.' : ''}`);
  if(verheerendBonus) parts.push(`+ ${verheerendBonus} Verheerend`);
  if(dmgMod) parts.push(`${dmgMod > 0 ? '+' : '−'} ${Math.abs(dmgMod)} Mod`);
  if(blockRed) parts.push(`− ${blockRed} Block`);
  if(armor.total) parts.push(`− ${armor.total} Rüstung`);
  const poolLbl = pool === 'mlp' ? 'mLP' : 'LP';
  let formula = `${parts.join(' ')} = ${afterArmor} ${poolLbl}`;
  if(durchschlagApplied){
    formula += ` → Durchschlag (${durchschlagX}) = ${finalDmg} ${poolLbl}`;
  }

  const weaponName = weapon ? (String(weapon.name || '').trim() || getWeaponSubtype(weapon.wType).label) : 'Waffenlos / Angriff';
  const ammoName = ammo ? (String(ammo.name || '').trim() || 'Munition') : '';
  const targetName = targetSheet ? (String(targetSheet.profile?.name || '').trim() || COMBAT.targetName || 'Ziel') : (COMBAT.targetName || '');

  return {
    weapon,
    ammo,
    weaponName,
    ammoName,
    tags,
    opts,
    selOpt,
    targetSheet,
    targetM,
    targetName,
    hitZones,
    zoneObj,
    zoneName,
    eg,
    weaponDmg,
    verheerendX,
    verheerendBonus,
    durchschlagX,
    nichtParierbar,
    dmgMod,
    rawDmg,
    blockRed,
    afterBlock,
    armor,
    afterArmor,
    durchschlagApplied,
    finalDmg,
    pool,
    poolLbl,
    threshold,
    formula
  };
}

export function resetCombatState(){
  COMBAT.active = false;
  COMBAT.collapsed = false;
  COMBAT.hitOk = false;
  COMBAT.blockPrompt = false;
  COMBAT.blockPromptReason = '';
  COMBAT.eg = 0;
  COMBAT.egMult = 1;
  COMBAT.baseEg = 0;
  COMBAT.isBlocked = false;
  COMBAT.blockItemRed = false;
  COMBAT.weaponId = null;
  COMBAT.ammoId = null;
  COMBAT.attackerName = '';
  COMBAT.targetCharId = '';
  COMBAT.targetName = '';
  COMBAT.dmgType = 'cut';
  COMBAT.pool = 'lp';
  COMBAT.zoneName = '';
  COMBAT.lastHzRoll = null;
  COMBAT.dmgMod = 0;
  COMBAT.armorMod = 0;
  COMBAT.posted = false;
  COMBAT.offerId = '';
  COMBAT.offerStatus = '';
  COMBAT.offerNote = '';
  COMBAT.directApplying = false;
  COMBAT.directAppliedNote = '';
  COMBAT.ammoSpent = false;
}

export function initCombatFromRoll({ T, res, isAtkBlk20 = false, attackerName = '' }){
  const isWeaponHit = Boolean(isAtkBlk20 || D.wRollCat === 'Trefferwurf');
  if(!isWeaponHit){
    resetCombatState();
    return;
  }
  const isLob = isLobbyNeutralDice();
  const weapon = (!isLob && D.weaponId) ? (S.weapons || []).find(w => w.id === D.weaponId) : null;
  const ammo = (!isLob && weapon && weapon.wType === 'ranged' && weapon.ammoId)
    ? (S.ammos || []).find(a => a.id === weapon.ammoId)
    : null;
  const tags = getWeaponAllTags(weapon, ammo);
  const nichtParierbar = hasTagMatch(tags, /^nicht\s+parierbar\b/i);

  const opp = T?.opp?.ready ? T.opp : null;
  const prevTargetId = COMBAT.targetCharId;
  const prevTargetName = COMBAT.targetName;
  const prevBlockItemRed = COMBAT.blockItemRed;

  const targetCharId = isAtkBlk20 ? (opp?.charId || prevTargetId || '') : (opp?.charId || '');
  const targetName = isAtkBlk20 ? (opp?.oppName || prevTargetName || '') : (opp?.oppName || '');

  const okRolls = (res || []).filter(x => x && x.ok);
  const bestOk = okRolls.length ? okRolls.reduce((a, b) => (b.eg > a.eg ? b : a), okRolls[0]) : null;
  const anyOk = Boolean(bestOk);

  // Sonderfall: Verteidiger blockt erfolgreich ODER pariert erfolgreich gegen „Nicht parierbar“
  if(!isAtkBlk20 && !anyOk && opp){
    const oppCat = opp.oppRollCat;
    const isDefBlock = oppCat === 'Blocken';
    const isDefParryUnparryable = oppCat === 'Parieren' && nichtParierbar;
    if(isDefBlock || isDefParryUnparryable){
      const oppHasBlockItem = isDefParryUnparryable || Boolean(opp.oppWeapon && hasTagMatch(opp.oppWeapon.tags, /^blockf[äa]hig\b/i));
      resetCombatState();
      COMBAT.active = true;
      COMBAT.hitOk = false;
      COMBAT.blockPrompt = true;
      COMBAT.blockPromptReason = isDefParryUnparryable ? 'nicht_parierbar' : 'blocked';
      COMBAT.isBlocked = true;
      COMBAT.blockItemRed = oppHasBlockItem;
      COMBAT.weaponId = weapon?.id || null;
      COMBAT.ammoId = ammo?.id || null;
      COMBAT.attackerName = attackerName;
      COMBAT.targetCharId = targetCharId;
      COMBAT.targetName = targetName;
      return;
    }
  }

  if(!anyOk){
    resetCombatState();
    return;
  }

  const opts = getWeaponDamageOptions(weapon, ammo);
  const defDmgType = pickDefaultDamageType(opts, tags);
  const targetSheet = resolveCombatTargetSheet(targetCharId);
  const hitZones = getTargetHitZones(targetSheet);
  const defZone = (hitZones[1]?.zone || hitZones[0]?.zone || 'Rumpf');

  COMBAT.active = true;
  COMBAT.collapsed = false;
  COMBAT.hitOk = true;
  COMBAT.blockPrompt = false;
  COMBAT.blockPromptReason = '';
  COMBAT.eg = toInt(bestOk.eg, 0);
  COMBAT.egMult = toInt(bestOk.egMult || T?.egMult, 1);
  COMBAT.baseEg = toInt(bestOk.baseEg ?? bestOk.eg, 0);
  COMBAT.isBlocked = Boolean(isAtkBlk20);
  COMBAT.blockItemRed = isAtkBlk20 ? (prevBlockItemRed || true) : false;
  COMBAT.weaponId = weapon?.id || null;
  COMBAT.ammoId = ammo?.id || null;
  COMBAT.attackerName = attackerName;
  COMBAT.targetCharId = targetCharId;
  COMBAT.targetName = targetName;
  COMBAT.dmgType = defDmgType;
  COMBAT.pool = 'lp';
  COMBAT.zoneName = defZone;
  COMBAT.lastHzRoll = null;
  COMBAT.dmgMod = 0;
  COMBAT.armorMod = 0;
  COMBAT.posted = false;
  COMBAT.offerId = '';
  COMBAT.offerStatus = '';
  COMBAT.offerNote = '';
  COMBAT.directApplying = false;
  COMBAT.directAppliedNote = '';
  COMBAT.ammoSpent = false;
}

export function rollCombatHitZone(){
  if(!COMBAT.active) return;
  const targetSheet = resolveCombatTargetSheet(COMBAT.targetCharId);
  const hitZones = getTargetHitZones(targetSheet);
  const r = rollW100();
  if(r === 69) triggerNiceEasterEgg();
  const hit = matchHitZoneByRoll(hitZones, r) || hitZones[0];
  COMBAT.lastHzRoll = r;
  COMBAT.zoneName = hit ? String(hit.zone || '').trim() : 'Rumpf';
  COMBAT.posted = false;

  const isLob = isLobbyNeutralDice();
  const targetLbl = targetSheet ? (String(targetSheet.profile?.name || '').trim() || COMBAT.targetName) : COMBAT.targetName;
  const hzLabel = hit ? `${hit.zone}${hit.size ? ` (${hit.size})` : ''}` : 'Unbekannt';
  publishLiveRoll({
    id: uid(),
    tsMs: Date.now(),
    ts: new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    senderTabId: LIVE_TAB_ID,
    charId: isLob ? '' : (S.charId || ''),
    charName: COMBAT.attackerName || (isLob ? (CLOUD.currentUser || 'Gast') : (String(S.profile?.name || '').trim() || 'Unbenannter Held')),
    playerName: isLob ? '' : String(CLOUD.currentUser || S.owner || '').trim(),
    campaignId: isLob ? getActiveLiveCampaignId() : getCharCampaignId(S.charId),
    label: targetLbl ? `🎯 Trefferzone (${targetLbl})` : '🎯 Trefferzonen-Wurf',
    vsCharId: COMBAT.targetCharId || undefined,
    vsCharName: targetLbl || undefined,
    isHz: true,
    hzZone: hzLabel,
    th: 100,
    chance: 100,
    res: [{ r, ok: true, crit: false, eg: 0, meg: 0 }]
  });
  if(!isSecretRollActive()){
    toast(`🎯 Trefferzone${targetLbl ? ` (${targetLbl})` : ''}: W100 = ${r} → ${hzLabel}`);
  }
  renderDice();
}

export function publishCombatDamageToFeed(){
  if(!COMBAT.active || !COMBAT.hitOk) return;
  const calc = calculateCombatDamage();
  const isLob = isLobbyNeutralDice();
  const atkName = COMBAT.attackerName || (isLob ? (CLOUD.currentUser || 'Gast') : (String(S.profile?.name || '').trim() || 'Unbenannter Held'));
  const dmgTypeLabel = calc.selOpt.shortLabel || calc.selOpt.label || 'Schaden';
  const title = calc.targetName
    ? `💥 Schaden: ${calc.weaponName} → ${calc.targetName} (${calc.zoneName})`
    : `💥 Schaden: ${calc.weaponName} (${calc.zoneName})`;

  const payload = {
    id: uid(),
    tsMs: Date.now(),
    ts: new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    senderTabId: LIVE_TAB_ID,
    charId: isLob ? '' : (S.charId || ''),
    charName: atkName,
    playerName: isLob ? '' : String(CLOUD.currentUser || S.owner || '').trim(),
    campaignId: isLob ? getActiveLiveCampaignId() : getCharCampaignId(S.charId),
    label: title,
    isDamage: true,
    finalDmg: calc.finalDmg,
    rawDmg: calc.rawDmg,
    armorTotal: calc.armor.total,
    armorDetail: calc.armor.detailText,
    blockRed: calc.blockRed,
    isBlocked: COMBAT.isBlocked,
    durchschlagApplied: calc.durchschlagApplied,
    dmgTypeLabel,
    pool: calc.pool,
    hzZone: calc.zoneName,
    thresholdLevel: calc.threshold.level,
    thresholdLabel: calc.threshold.label,
    formula: calc.formula,
    th: 100,
    chance: 100,
    res: [{ r: calc.finalDmg, ok: calc.finalDmg > 0, crit: false, eg: calc.eg, meg: 0 }]
  };
  if(COMBAT.targetCharId && calc.targetName){
    payload.vsCharId = COMBAT.targetCharId;
    payload.vsCharName = calc.targetName;
  }
  publishLiveRoll(payload);
  diceLogs.unshift({
    t: new Date().toLocaleTimeString('de-DE'),
    lbl: title,
    isCustomDice: true,
    sum: `💥 ${calc.finalDmg} ${calc.poolLbl}${calc.threshold.label ? ` (${calc.threshold.label})` : ''}`
  });
  if(diceLogs.length > 40) diceLogs.length = 40;
  COMBAT.posted = true;
  if(!isSecretRollActive()){
    toast(`📡 Schaden gepostet: ${calc.finalDmg} ${calc.poolLbl}${calc.targetName ? ` an ${calc.targetName}` : ''}`);
  }
  renderDice();
}

const handledOfferIds = new Set();

export function isDamageOfferTargetForMe(offer){
  if(!offer || !offer.targetCharId) return false;
  const tid = String(offer.targetCharId).trim();
  if(!UI.inLobby && S?.charId && S.charId === tid) return true;
  const curUser = String(CLOUD.currentUser || '').trim().toLowerCase();
  if(curUser){
    const own = String(getCharOwner(tid) || '').trim().toLowerCase();
    if(own && own === curUser) return true;
  }
  const campId = String(offer.campaignId || getCharCampaignId(tid) || 'default');
  if(canManageCampaign(campId)) return true;
  return false;
}

export function canDirectApplyCombatDamage(targetCharId = COMBAT.targetCharId){
  const tid = String(targetCharId || '').trim();
  if(!tid) return false;
  if(CLOUD.isAdmin) return true;
  if(!UI.inLobby && S?.charId && S.charId === tid) return true;
  const curUser = String(CLOUD.currentUser || '').trim().toLowerCase();
  if(curUser){
    const own = String(getCharOwner(tid) || '').trim().toLowerCase();
    if(own && own === curUser) return true;
  }
  const campId = getCharCampaignId(tid);
  if(canManageCampaign(campId)) return true;
  if(campId === 'default' && isGlobalGM()) return true;
  return false;
}

export function sendCombatDamageOffer(){
  if(!COMBAT.active || !COMBAT.hitOk) return;
  const tid = String(COMBAT.targetCharId || '').trim();
  if(!tid){
    toast('Kein Ziel-Charakter ausgewählt.');
    return;
  }
  const calc = calculateCombatDamage();
  if(calc.finalDmg <= 0){
    toast('Endschaden ist 0 – kein Abzug nötig.');
    return;
  }
  const isLob = isLobbyNeutralDice();
  const atkName = COMBAT.attackerName || (isLob ? (CLOUD.currentUser || 'Gast') : (String(S.profile?.name || '').trim() || 'Unbenannter Held'));
  const campId = isLob ? getActiveLiveCampaignId() : getCharCampaignId(S.charId || tid);
  const offerId = `dmg_${uid()}`;
  const offer = {
    type: 'combat_damage_offer',
    offerId,
    campaignId: campId,
    tsMs: Date.now(),
    senderTabId: LIVE_TAB_ID,
    attackerCharId: isLob ? '' : (S.charId || ''),
    attackerName: atkName,
    attackerPlayer: String(CLOUD.currentUser || S.owner || '').trim(),
    targetCharId: tid,
    targetName: calc.targetName || 'Ziel',
    weaponName: calc.weaponName,
    pool: calc.pool,
    amount: calc.finalDmg,
    zoneName: calc.zoneName,
    dmgTypeLabel: calc.selOpt.shortLabel || calc.selOpt.label || 'Schaden',
    thresholdLevel: calc.threshold.level,
    thresholdLabel: calc.threshold.label,
    formula: calc.formula,
    armorDetail: calc.armor.detailText,
    isBlocked: COMBAT.isBlocked,
    durchschlagApplied: calc.durchschlagApplied
  };
  COMBAT.offerId = offerId;
  COMBAT.offerStatus = 'sent';
  COMBAT.offerNote = `📨 Schadensangebot (−${calc.finalDmg} ${calc.poolLbl}) an ${offer.targetName} gesendet...`;
  sendLiveBroadcast(offer);
  toast(`💥 Schaden an ${offer.targetName} gesendet (−${calc.finalDmg} ${calc.poolLbl})!`);
  renderDice();
}

export async function acceptCombatDamageOffer(offerId){
  const list = DUEL.damageOffers || [];
  const idx = list.findIndex(o => o && o.offerId === offerId);
  if(idx < 0){
    toast('Dieses Schadensangebot ist nicht mehr aktiv.');
    hooks.renderDuelBanner?.();
    return;
  }
  const offer = list[idx];
  const amt = Math.max(0, toInt(offer.editOpen ? offer.editAmount : offer.amount, 0));
  const pool = offer.pool === 'mlp' ? 'mlp' : 'lp';
  const poolLbl = pool === 'mlp' ? 'mLP' : 'LP';
  const resKey = pool === 'mlp' ? 'mlpCurrent' : 'lpCurrent';
  const logText = `💥 Schaden erhalten (${offer.attackerName || 'Gegner'}, ${offer.weaponName || 'Angriff'}, ${offer.zoneName || 'Zone'}): −${amt} ${poolLbl}${offer.thresholdLabel ? ` [${offer.thresholdLabel}]` : ''}`;
  const isOwnOpen = Boolean(!UI.inLobby && S?.charId && S.charId === offer.targetCharId);
  let prevVal = null, newVal = null;

  if(isOwnOpen){
    prevVal = toInt(S.secondary?.[resKey], 8);
    newVal = prevVal - amt;
    S.secondary[resKey] = newVal;
    logChron(logText);
    save();
    hooks.syncLiveCalculations?.(false);
    hooks.renderMain?.();
  }else if(amt > 0){
    const res = await applyCloudResourceDelta(offer.targetCharId, { [resKey]: -amt }, logText);
    if(!res.ok){
      toast(`⚠️ ${res.error || 'Schaden konnte nicht übernommen werden.'}`);
      return;
    }
    prevVal = res.before?.[resKey] ?? null;
    newVal = res.after?.[resKey] ?? res.secondary?.[resKey] ?? null;
  }

  handledOfferIds.add(offer.offerId);
  DUEL.damageOffers = list.filter(o => o && o.offerId !== offerId);
  hooks.renderDuelBanner?.();

  const valSuffix = (prevVal !== null && newVal !== null) ? ` (${poolLbl} ${prevVal} → ${newVal})` : '';
  sendLiveBroadcast({
    type: 'combat_damage_applied',
    status: 'applied',
    offerId: offer.offerId,
    campaignId: offer.campaignId,
    targetCharId: offer.targetCharId,
    targetName: offer.targetName,
    pool,
    appliedAmount: amt,
    prevVal,
    newVal,
    responderName: String(CLOUD.currentUser || offer.targetName || 'Spieler').trim(),
    senderTabId: LIVE_TAB_ID,
    tsMs: Date.now()
  });

  publishLiveRoll({
    id: uid(),
    tsMs: Date.now(),
    ts: new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    senderTabId: LIVE_TAB_ID,
    charId: offer.targetCharId || '',
    charName: offer.targetName || 'Ziel',
    playerName: String(CLOUD.currentUser || '').trim(),
    campaignId: offer.campaignId || getActiveLiveCampaignId(),
    label: `✅ Schaden übernommen (${offer.attackerName || 'Angreifer'} • ${offer.zoneName || 'Zone'})${valSuffix}`,
    isDamage: true,
    finalDmg: amt,
    pool,
    hzZone: offer.zoneName || '',
    dmgTypeLabel: offer.dmgTypeLabel || 'Schaden',
    thresholdLevel: amt > 0 ? (offer.thresholdLevel || 'none') : 'none',
    thresholdLabel: amt > 0 ? (offer.thresholdLabel || '') : '',
    formula: `−${amt} ${poolLbl}${valSuffix}`,
    th: 100,
    chance: 100,
    res: [{ r: amt, ok: amt > 0, crit: false, eg: 0, meg: 0 }]
  });
  toast(`✅ Schaden übernommen: −${amt} ${poolLbl}${valSuffix}`);
}

export function declineCombatDamageOffer(offerId){
  const list = DUEL.damageOffers || [];
  const offer = list.find(o => o && o.offerId === offerId);
  handledOfferIds.add(offerId);
  DUEL.damageOffers = list.filter(o => o && o.offerId !== offerId);
  hooks.renderDuelBanner?.();
  if(offer){
    sendLiveBroadcast({
      type: 'combat_damage_applied',
      status: 'declined',
      offerId: offer.offerId,
      campaignId: offer.campaignId,
      targetCharId: offer.targetCharId,
      targetName: offer.targetName,
      pool: offer.pool || 'lp',
      appliedAmount: 0,
      responderName: String(CLOUD.currentUser || offer.targetName || 'Spieler').trim(),
      senderTabId: LIVE_TAB_ID,
      tsMs: Date.now()
    });
  }
  toast('Schadensangebot abgelehnt.');
}

export function handleCombatLiveEvent(rawObj, isRealtimePush = false){
  if(!rawObj || typeof rawObj !== 'object') return;
  if(rawObj.senderTabId === LIVE_TAB_ID) return;
  const oid = String(rawObj.offerId || '').trim();
  if(!oid) return;

  if(rawObj.type === 'combat_damage_offer'){
    if(handledOfferIds.has(oid)) return;
    if(!isDamageOfferTargetForMe(rawObj)) return;
    if(!Array.isArray(DUEL.damageOffers)) DUEL.damageOffers = [];
    if(DUEL.damageOffers.some(o => o && o.offerId === oid)) return;
    DUEL.damageOffers.unshift({
      ...rawObj,
      editOpen: false,
      editAmount: Math.max(0, toInt(rawObj.amount, 0))
    });
    if(DUEL.damageOffers.length > 5) DUEL.damageOffers.length = 5;
    hooks.renderDuelBanner?.();
    if(isRealtimePush){
      const pl = rawObj.pool === 'mlp' ? 'mLP' : 'LP';
      toast(`💥 ${rawObj.attackerName || 'Angreifer'} trifft ${rawObj.targetName || 'dich'} (${rawObj.zoneName || 'Zone'}): −${toInt(rawObj.amount, 0)} ${pl}`);
    }
    return;
  }

  if(rawObj.type === 'combat_damage_applied'){
    handledOfferIds.add(oid);
    if(Array.isArray(DUEL.damageOffers) && DUEL.damageOffers.some(o => o && o.offerId === oid)){
      DUEL.damageOffers = DUEL.damageOffers.filter(o => o && o.offerId !== oid);
      hooks.renderDuelBanner?.();
    }
    if(COMBAT.offerId && COMBAT.offerId === oid){
      const pl = rawObj.pool === 'mlp' ? 'mLP' : 'LP';
      if(rawObj.status === 'declined'){
        COMBAT.offerStatus = 'declined';
        COMBAT.offerNote = `ℹ️ ${rawObj.targetName || COMBAT.targetName || 'Ziel'} hat das Schadensangebot abgelehnt.`;
      }else{
        const valTxt = (rawObj.prevVal !== null && rawObj.prevVal !== undefined && rawObj.newVal !== null && rawObj.newVal !== undefined)
          ? ` (${pl} ${rawObj.prevVal} → ${rawObj.newVal})`
          : '';
        COMBAT.offerStatus = 'applied';
        COMBAT.offerNote = `✅ ${rawObj.targetName || COMBAT.targetName || 'Ziel'} hat −${toInt(rawObj.appliedAmount, 0)} ${pl} übernommen${valTxt}`;
      }
      toast(COMBAT.offerNote);
      if(D.open) renderDice();
    }
  }
}

export async function applyCombatDamageDirectly(){
  if(!COMBAT.active || !COMBAT.hitOk || COMBAT.directApplying) return;
  const tid = String(COMBAT.targetCharId || '').trim();
  if(!tid){
    toast('Kein Ziel-Charakter ausgewählt.');
    return;
  }
  if(!canDirectApplyCombatDamage(tid)){
    toast('🔒 Nur Spielleitung, Admin oder Besitzer dürfen direkt am Bogen abziehen.');
    return;
  }
  const calc = calculateCombatDamage();
  if(calc.finalDmg <= 0){
    toast('Endschaden ist 0 – kein Abzug nötig.');
    return;
  }
  const resKey = calc.pool === 'mlp' ? 'mlpCurrent' : 'lpCurrent';
  const isLob = isLobbyNeutralDice();
  const atkName = COMBAT.attackerName || (isLob ? (CLOUD.currentUser || 'Gast') : (String(S.profile?.name || '').trim() || 'Unbenannter Held'));
  const logText = `💥 Schaden (SL-Direktabzug • ${atkName}, ${calc.weaponName}, ${calc.zoneName}): −${calc.finalDmg} ${calc.poolLbl}${calc.threshold.label ? ` [${calc.threshold.label}]` : ''}`;

  COMBAT.directApplying = true;
  renderDice();
  const res = await applyCloudResourceDelta(tid, { [resKey]: -calc.finalDmg }, logText);
  COMBAT.directApplying = false;

  if(!res.ok){
    toast(`⚠️ ${res.error || 'Direkt-Abzug fehlgeschlagen.'}`);
    renderDice();
    return;
  }
  const prevVal = res.before?.[resKey];
  const newVal = res.after?.[resKey] ?? res.secondary?.[resKey];
  const valTxt = (prevVal !== undefined && newVal !== undefined) ? `${calc.poolLbl} ${prevVal} → ${newVal}` : `−${calc.finalDmg} ${calc.poolLbl}`;
  COMBAT.directAppliedNote = `✅ ${calc.targetName || 'Ziel'}: ${valTxt}`;
  if(COMBAT.offerId){
    sendLiveBroadcast({
      type: 'combat_damage_applied',
      status: 'applied',
      offerId: COMBAT.offerId,
      campaignId: isLob ? getActiveLiveCampaignId() : getCharCampaignId(S.charId || tid),
      targetCharId: tid,
      targetName: calc.targetName || 'Ziel',
      pool: calc.pool,
      appliedAmount: calc.finalDmg,
      prevVal,
      newVal,
      responderName: String(CLOUD.currentUser || 'SL').trim(),
      senderTabId: LIVE_TAB_ID,
      tsMs: Date.now()
    });
    COMBAT.offerStatus = 'applied';
    COMBAT.offerNote = COMBAT.directAppliedNote;
  }
  publishLiveRoll({
    id: uid(),
    tsMs: Date.now(),
    ts: new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    senderTabId: LIVE_TAB_ID,
    charId: isLob ? '' : (S.charId || ''),
    charName: atkName,
    playerName: isLob ? '' : String(CLOUD.currentUser || S.owner || '').trim(),
    campaignId: isLob ? getActiveLiveCampaignId() : getCharCampaignId(S.charId || tid),
    vsCharId: tid,
    vsCharName: calc.targetName || 'Ziel',
    label: `⚡ Schaden angewendet: ${calc.targetName || 'Ziel'} (${calc.zoneName}) • ${valTxt}`,
    isDamage: true,
    finalDmg: calc.finalDmg,
    pool: calc.pool,
    hzZone: calc.zoneName,
    dmgTypeLabel: calc.selOpt.shortLabel || calc.selOpt.label || 'Schaden',
    thresholdLevel: calc.threshold.level,
    thresholdLabel: calc.threshold.label,
    formula: `${calc.formula} • ${valTxt}`,
    armorDetail: calc.armor.detailText,
    th: 100,
    chance: 100,
    res: [{ r: calc.finalDmg, ok: true, crit: false, eg: calc.eg, meg: 0 }]
  });
  toast(`⚡ Direkt abgezogen – ${calc.targetName || 'Ziel'}: ${valTxt}`);
  renderDice();
}

export function spendCombatAmmo(){
  if(isLobbyNeutralDice()) return;
  const weapon = COMBAT.weaponId ? (S.weapons || []).find(w => w.id === COMBAT.weaponId) : null;
  const ammoId = COMBAT.ammoId || weapon?.ammoId || '';
  if(!ammoId) return;
  const am = (S.ammos || []).find(a => a.id === ammoId);
  if(!am) return;
  const cur = Math.max(0, toInt(am.qty, 0));
  if(cur <= 0){
    toast(`⚠️ Keine Munition (${am.name || 'Munition'}) mehr im Vorrat!`);
    return;
  }
  am.qty = cur - 1;
  COMBAT.ammoSpent = true;
  logChron(`🏹 Munition verbraucht: −1 ${am.name || 'Munition'} (Rest: ${am.qty}).`);
  hooks.syncLinkedAmmoDOM?.(am.id, null);
  save();
  toast(`🏹 −1 ${am.name || 'Munition'} verbraucht (Vorrat: ${am.qty})`);
  renderDice();
}

export function renderCombatDamageBox(){
  if(!COMBAT.active) return '';
  if(COMBAT.blockPrompt && !COMBAT.hitOk){
    const calc = calculateCombatDamage();
    const isUnparry = COMBAT.blockPromptReason === 'nicht_parierbar';
    const title = isUnparry
      ? '🛡️ „Nicht parierbar“ – Parade gilt als Blocken!'
      : '🛡️ Angriff wurde erfolgreich geblockt!';
    const desc = isUnparry
      ? `${esc(calc.targetName || 'Verteidiger')} hat gegen „Nicht parierbar“ pariert – das zählt regeltechnisch wie Blocken mit einem blockfähigen Gegenstand (−2 Schaden).`
      : `${esc(calc.targetName || 'Verteidiger')} hat erfolgreich geblockt. Würfle jetzt den Block-Folgewurf (Trefferwert gegen Schw. 20), um die EG für den Grundschaden zu bestimmen.`;
    return `<div id="combatDamageBox" class="subcard p-3 border-2 border-amber-400/65 bg-amber-500/10 space-y-2 min-w-0">
      <div class="flex items-start justify-between gap-2 min-w-0">
        <div class="min-w-0">
          <div class="text-xs font-black text-amber-300">${title}</div>
          <div class="text-[11px] t-mut mt-0.5 break-words">${desc}</div>
          ${calc.durchschlagX ? `<div class="text-[10px] font-extrabold text-cyan-300 mt-1">⚡ Durchschlag (${calc.durchschlagX}) aktiv: Mindestens ${calc.durchschlagX} Schaden, falls durch Blocken auf 0 reduziert.</div>` : ''}
        </div>
        <button type="button" data-action="combat-close" aria-label="Schließen" class="btn w-6 h-6 p-0 text-[10px] font-black shrink-0">✕</button>
      </div>
      <button type="button" data-action="combat-roll-blocked-20" class="btn btn-pri w-full py-2 px-3 text-xs font-black">${isSecretRollActive() ? '🕵️ ' : ''}🛡️ Block-Folgewurf würfeln (gegen Schwierigkeit 20)</button>
    </div>`;
  }

  if(!COMBAT.hitOk) return '';
  const calc = calculateCombatDamage();
  const th = calc.threshold;
  const thCls = th.level === 'heavy'
    ? 'border-rose-500 bg-rose-500/20 text-rose-200'
    : th.level === 'medium'
      ? 'border-orange-400 bg-orange-500/20 text-orange-200'
      : th.level === 'light'
        ? 'border-amber-400 bg-amber-500/20 text-amber-200'
        : 'bdr-line bg-black/20 t-mut';

  const hdr = `<div class="flex items-center justify-between gap-2 min-w-0">
    <button type="button" data-action="combat-toggle-collapse" class="flex items-center gap-1.5 text-left min-w-0 flex-1 cursor-pointer">
      <span class="text-xs font-black text-rose-400 w-3.5 shrink-0">${COMBAT.collapsed ? '▸' : '▾'}</span>
      <span class="text-xs font-black text-rose-300 truncate">💥 Schadens- &amp; Rüstungsrechner</span>
      ${calc.targetName ? `<span class="px-1.5 py-0.2 rounded text-[10px] font-extrabold bg-indigo-500/20 text-indigo-200 border border-indigo-400/40 truncate max-w-[140px]">→ ${esc(calc.targetName)}</span>` : ''}
    </button>
    <div class="flex items-center gap-1.5 shrink-0">
      <span class="px-2 py-0.5 rounded-md bg-rose-600/85 text-white text-[11px] font-black tabular">${calc.finalDmg} ${calc.poolLbl}</span>
      <button type="button" data-action="combat-close" aria-label="Rechner ausblenden" class="btn w-6 h-6 p-0 text-[10px] font-black">✕</button>
    </div>
  </div>`;

  if(COMBAT.collapsed){
    return `<div id="combatDamageBox" class="subcard p-2.5 border-2 border-rose-500/50 bg-rose-500/5 min-w-0">${hdr}</div>`;
  }

  const zoneBtnsHtml = calc.hitZones.map(z => {
    const zn = String(z.zone || '').trim();
    const act = zn.toLowerCase() === calc.zoneName.toLowerCase();
    return `<button type="button" data-action="combat-set-zone" data-zone="${esc(zn)}" data-tip="Trefferzone ${esc(zn)} (${esc(z.range || '')}${z.size ? ', ' + esc(z.size) : ''})" class="btn py-1 px-2 text-[11px] font-extrabold ${act ? 'btn-pri' : 'opacity-85 hover:opacity-100'}">${esc(zn)}${z.range ? ` <span class="text-[9px] opacity-75 tabular">(${esc(z.range)})</span>` : ''}</button>`;
  }).join('');

  const dmgTypeBtnsHtml = calc.opts.map(o => {
    const act = o.key === calc.selOpt.key;
    return `<button type="button" data-action="combat-set-dmgtype" data-dmgtype="${esc(o.key)}" class="btn py-1 px-2 text-[11px] font-extrabold tabular ${act ? 'btn-pri' : 'opacity-85 hover:opacity-100'}">${esc(o.shortLabel || o.label)} <span class="opacity-80">+${o.val}</span></button>`;
  }).join('');

  const blockToggleHtml = COMBAT.isBlocked
    ? `<div class="flex flex-wrap items-center gap-1.5">
        <button type="button" data-action="combat-toggle-block-red" class="btn py-1 px-2.5 text-[11px] font-extrabold ${COMBAT.blockItemRed ? 'border-amber-400 bg-amber-500/20 text-amber-200' : 'opacity-80'}">${COMBAT.blockItemRed ? '☑' : '☐'} 🛡️ Blockfähiger Gegenstand (−2 Schaden)</button>
        ${calc.durchschlagX ? `<span class="px-2 py-1 rounded-lg border text-[10px] font-black tabular ${calc.durchschlagApplied ? 'border-cyan-400 bg-cyan-500/25 text-cyan-200' : 'border-cyan-400/35 bg-cyan-500/10 text-cyan-300/80'}">⚡ Durchschlag (${calc.durchschlagX})${calc.durchschlagApplied ? ' AKTIV!' : ''}</span>` : ''}
      </div>`
    : '';

  const verheerendHtml = calc.verheerendX
    ? `<div class="text-[10px] font-extrabold px-2 py-1 rounded-lg border tabular ${calc.verheerendBonus ? 'border-orange-400/60 bg-orange-500/20 text-orange-200' : 'bdr-line bg-black/20 t-mut'}">🔥 Verheerend (${calc.verheerendX}): ${calc.verheerendBonus ? `+${calc.verheerendBonus} Schaden aktiv (${calc.eg} ≥ 5 EG)` : `inaktiv (${calc.eg} < 5 EG)`}</div>`
    : '';

  const armorRowsHtml = calc.armor.pieces.length
    ? calc.armor.pieces.map(p => `<div class="flex items-center justify-between gap-2 text-[11px] tabular min-w-0"><span class="truncate font-bold">${esc(p.name)}</span><span class="t-mut shrink-0">${p.grp ? `gRP ${p.grp} + ` : ''}${esc(p.specDesc)} = <strong class="text-emerald-300">${p.total}</strong></span></div>`).join('')
    : `<div class="text-[11px] t-mut">${calc.targetSheet ? `Keine angelegte Rüstung deckt „${esc(calc.zoneName)}“ ab.` : 'Kein Ziel-Charakterbogen gewählt (Rüstung über ± manuell anpassbar).'}</div>`;

  const canDirect = canDirectApplyCombatDamage(COMBAT.targetCharId);
  const ammoBtnHtml = calc.ammo
    ? `<button type="button" data-action="combat-spend-ammo" ${toInt(calc.ammo.qty, 0) <= 0 ? 'disabled' : ''} class="btn w-full py-1.5 px-3 text-xs font-extrabold ${COMBAT.ammoSpent ? 'border-emerald-400/60 bg-emerald-500/15 text-emerald-200' : 'border-amber-400/50 bg-amber-500/10 text-amber-200 hover:bg-amber-500/20'}">${COMBAT.ammoSpent ? `✓ −1 ${esc(calc.ammoName)} verbraucht (Vorrat: ${toInt(calc.ammo.qty, 0)})` : `🏹 −1 ${esc(calc.ammoName)} verbrauchen (Vorrat: ${toInt(calc.ammo.qty, 0)})`}</button>`
    : '';

  const applyActionsHtml = COMBAT.targetCharId
    ? `<div class="space-y-1.5 pt-1 border-t border-white/10">
        <div class="grid grid-cols-1 ${canDirect ? 'sm:grid-cols-2' : ''} gap-1.5">
          <button type="button" data-action="combat-send-offer" ${calc.finalDmg <= 0 ? 'disabled' : ''} data-tip="Sendet ein Live-Aktionsbanner an den Spieler von ${esc(calc.targetName || 'Ziel')}, damit er den Schaden sicher auf seinem eigenen Bogen übernimmt" class="btn py-1.5 px-2.5 text-xs font-black border-rose-400/60 bg-rose-500/20 text-rose-100 hover:bg-rose-500/30">💥 Schaden an Ziel senden</button>
          ${canDirect ? `<button type="button" data-action="combat-apply-direct" ${(calc.finalDmg <= 0 || COMBAT.directApplying) ? 'disabled' : ''} data-tip="Zieht den Schaden über den atomaren Server-Endpunkt direkt am Bogen ab (ideal für NSCs ohne aktiven Spieler)" class="btn py-1.5 px-2.5 text-xs font-black border-amber-400/65 bg-amber-500/20 text-amber-200 hover:bg-amber-500/30">${COMBAT.directApplying ? '⏳ Wende an...' : '⚡ Direkt am Bogen abziehen (SL)'}</button>` : ''}
        </div>
        ${COMBAT.offerNote ? `<div class="text-[11px] font-extrabold px-2.5 py-1.5 rounded-lg border break-words ${COMBAT.offerStatus === 'applied' ? 'border-emerald-400/60 bg-emerald-500/15 text-emerald-200' : COMBAT.offerStatus === 'declined' ? 'border-amber-400/50 bg-amber-500/10 text-amber-200' : 'border-indigo-400/50 bg-indigo-500/15 text-indigo-200'}">${esc(COMBAT.offerNote)}</div>` : ''}
        ${(COMBAT.directAppliedNote && COMBAT.directAppliedNote !== COMBAT.offerNote) ? `<div class="text-[11px] font-extrabold px-2.5 py-1.5 rounded-lg border border-emerald-400/60 bg-emerald-500/15 text-emerald-200 break-words">${esc(COMBAT.directAppliedNote)}</div>` : ''}
      </div>`
    : '';

  return `<div id="combatDamageBox" class="subcard p-3 border-2 border-rose-500/50 bg-rose-500/5 space-y-2.5 min-w-0">
    ${hdr}
    <div class="text-[11px] t-mut flex flex-wrap items-center gap-x-2 gap-y-0.5 tabular">
      <span>🗡️ <strong>${esc(calc.weaponName)}</strong>${calc.ammoName ? ` + 🎯 ${esc(calc.ammoName)}` : ''}</span>
      <span>•</span>
      <span>Grundschaden: <strong class="text-emerald-300">${calc.eg} EG</strong>${COMBAT.egMult > 1 ? ` (${COMBAT.baseEg} ×${COMBAT.egMult})` : ''}${COMBAT.isBlocked ? ' <span class="text-amber-300">(Geblockt)</span>' : ''}</span>
    </div>

    <div class="space-y-1.5 pt-1.5 border-t border-white/10 min-w-0">
      <div class="flex flex-wrap items-center justify-between gap-1.5">
        <span class="text-[10px] font-extrabold t-mut uppercase tracking-wider">🎯 Trefferzone${COMBAT.lastHzRoll !== null ? ` • W100 = <strong class="text-amber-300">${COMBAT.lastHzRoll}</strong>` : ''}</span>
        <button type="button" data-action="combat-roll-hz" class="btn py-0.5 px-2 text-[11px] font-extrabold border-amber-400/55 bg-amber-500/15 text-amber-200 hover:bg-amber-500/25">🎯 Trefferzone auswürfeln</button>
      </div>
      <div class="flex flex-wrap gap-1 min-w-0">${zoneBtnsHtml}</div>
    </div>

    <div class="space-y-1.5 pt-1.5 border-t border-white/10 min-w-0">
      <div class="flex flex-wrap items-center justify-between gap-1.5">
        <span class="text-[10px] font-extrabold t-mut uppercase tracking-wider">⚔️ Schadensart &amp; Waffenschaden</span>
        <div class="inline-flex rounded-lg p-0.5 bg-black/25 border bdr-line text-[10px]">
          <button type="button" data-action="combat-set-pool" data-pool="lp" class="px-2 py-0.5 rounded font-black ${calc.pool === 'lp' ? 'bg-rose-500/30 text-rose-200' : 't-mut'}">❤️ LP</button>
          <button type="button" data-action="combat-set-pool" data-pool="mlp" class="px-2 py-0.5 rounded font-black ${calc.pool === 'mlp' ? 'bg-purple-500/30 text-purple-200' : 't-mut'}">🧠 mLP</button>
        </div>
      </div>
      <div class="flex flex-wrap gap-1 min-w-0">${dmgTypeBtnsHtml}</div>
      ${verheerendHtml}
      ${blockToggleHtml}
    </div>

    <div class="grid grid-cols-2 gap-2 pt-1.5 border-t border-white/10 tabular">
      <div class="subcard p-1.5 flex items-center justify-between gap-1 min-w-0">
        <span class="text-[10px] font-extrabold t-mut truncate">Schaden ±</span>
        <div class="flex items-center gap-1 shrink-0">
          <button type="button" data-action="combat-dmg-step" data-d="-1" class="btn w-6 h-6 p-0 text-xs font-black">−</button>
          <span class="text-xs font-black min-w-[24px] text-center ${calc.dmgMod > 0 ? 'text-rose-300' : calc.dmgMod < 0 ? 'text-emerald-300' : ''}">${fmtSign(calc.dmgMod)}</span>
          <button type="button" data-action="combat-dmg-step" data-d="1" class="btn w-6 h-6 p-0 text-xs font-black">+</button>
        </div>
      </div>
      <div class="subcard p-1.5 flex items-center justify-between gap-1 min-w-0">
        <span class="text-[10px] font-extrabold t-mut truncate">Rüstung ±</span>
        <div class="flex items-center gap-1 shrink-0">
          <button type="button" data-action="combat-armor-step" data-d="-1" class="btn w-6 h-6 p-0 text-xs font-black">−</button>
          <span class="text-xs font-black min-w-[24px] text-center ${calc.armor.manualMod > 0 ? 'text-emerald-300' : calc.armor.manualMod < 0 ? 'text-rose-300' : ''}">${fmtSign(calc.armor.manualMod)}</span>
          <button type="button" data-action="combat-armor-step" data-d="1" class="btn w-6 h-6 p-0 text-xs font-black">+</button>
        </div>
      </div>
    </div>

    <div class="p-2 rounded-lg bg-black/25 border bdr-line space-y-1 min-w-0">
      <div class="flex items-center justify-between gap-2 text-[10px] font-extrabold">
        <span class="text-emerald-300 uppercase tracking-wider">🛡️ Rüstung (${esc(calc.zoneName)} • ${esc(calc.selOpt.shortLabel || calc.selOpt.label)})</span>
        <span class="text-emerald-300 tabular">Gesamt: ${calc.armor.total}</span>
      </div>
      ${armorRowsHtml}
      ${calc.armor.globalMod ? `<div class="flex items-center justify-between gap-2 text-[11px] tabular"><span class="t-mut">Aktive Effekte (Rüstungsschutz)</span><span class="font-bold text-emerald-300">${fmtSign(calc.armor.globalMod)}</span></div>` : ''}
      ${calc.armor.manualMod ? `<div class="flex items-center justify-between gap-2 text-[11px] tabular"><span class="t-mut">Manueller Rüstungs-Mod</span><span class="font-bold">${fmtSign(calc.armor.manualMod)}</span></div>` : ''}
    </div>

    <div class="p-2.5 rounded-xl border-2 ${calc.finalDmg > 0 ? 'border-rose-500/70 bg-rose-500/15' : 'border-emerald-500/50 bg-emerald-500/10'} text-center space-y-1.5 tabular">
      <div class="text-[11px] t-mut break-words">${esc(calc.formula)}</div>
      <div class="text-2xl sm:text-3xl font-black ${calc.finalDmg > 0 ? 'text-rose-300' : 'text-emerald-300'}">💥 ${calc.finalDmg} ${calc.poolLbl} Endschaden</div>
      <div class="inline-flex flex-wrap items-center justify-center gap-1 px-2.5 py-1 rounded-lg border text-[11px] font-extrabold max-w-full ${thCls}">
        ${th.label ? `<span>${esc(th.label)}</span>` : `<span>✓ Keine ${th.kindWord}sschwelle ausgelöst</span>`}
        <span class="opacity-75 text-[10px]">(Stufen: ${th.light} / ${th.medium} / ${th.heavy})</span>
      </div>
    </div>

    ${ammoBtnHtml}
    ${applyActionsHtml}
    <button type="button" data-action="combat-post-feed" class="btn ${COMBAT.posted ? 'btn-ok' : 'btn-pri'} w-full py-1.5 px-3 text-xs font-black">${COMBAT.posted ? '✓ Im Live-Feed gepostet (erneut senden)' : '📡 Schaden in Live-Feed posten'}</button>
  </div>`;
}
