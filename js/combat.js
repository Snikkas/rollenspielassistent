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
  S, D, UI, CLOUD, DUEL, COMBAT, LIVE_TAB_ID, diceLogs, getWeaponSubtype, isArmorShield, isWeaponBlockable, getCharCampaignId, getCharOwner, getActiveLiveCampaignId, canManageCampaign, isGlobalGM, isEnemySheet, getEnemyMeta, shouldHideOpponentDetails, toast, triggerNiceEasterEgg, logChron, save
} from './state.js';
import {
  calcActiveMods, getSheetShields
} from './calc.js';
import {
  getCachedForeignSheet, publishLiveRoll, sendLiveBroadcast, applyCloudResourceDelta, isSecretRollActive
} from './cloud.js';
import {
  getActiveDiceCampaignId, isLobbyNeutralDice, rollW100, renderDice, getEffectiveDiceWeaponId, getEffectiveDiceShieldId, doesWeaponApplyToPool
} from './dice.js';
import {
  hasActiveMagazines, getEffectiveWeaponAmmo, getWeaponNextShotInfo, fireWeaponMagazineShot
} from './magazines.js';

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

export function getHitZoneSubZones(zoneObj){
  if(!zoneObj) return [];
  if(Array.isArray(zoneObj.subZones)) return zoneObj.subZones.filter(sz => sz && String(sz.zone || '').trim());
  const znLow = String(zoneObj.zone || '').trim().toLowerCase();
  const defMatch = DEF_HZ.find(d => d.zone.toLowerCase() === znLow);
  return defMatch && Array.isArray(defMatch.subZones) ? defMatch.subZones : [];
}

export function getPartialArmorsForMainZone(targetSheet, mainZoneName, subZones = []){
  const znLow = String(mainZoneName || '').trim().toLowerCase();
  if(!targetSheet || !znLow) return [];
  const subNamesLow = new Set((subZones || []).map(sz => String(sz?.zone || '').trim().toLowerCase()).filter(Boolean));
  const out = [];
  (targetSheet.armors || []).forEach(ar => {
    if(!ar || ar.equipped === false || isArmorShield(ar)) return;
    const zList = (Array.isArray(ar.zones) ? ar.zones : []).map(z => String(z || '').trim().toLowerCase()).filter(Boolean);
    if(zList.includes(znLow)) return;
    const matchedSubs = [];
    zList.forEach(z => {
      if(z.startsWith(`${znLow}:`)){
        const part = z.slice(znLow.length + 1).trim();
        if(part) matchedSubs.push(part);
      }else if(subNamesLow.has(z)){
        matchedSubs.push(z);
      }
    });
    if(matchedSubs.length){
      out.push({ id: ar.id, name: String(ar.name || '').trim() || 'Rüstung', matchedSubs });
    }
  });
  return out;
}

export function calcArmorPieceProtection(ar, dmgOpt, pool = 'lp'){
  if(!ar) return { grp: 0, spec: 0, specDesc: '', total: 0 };
  if(pool === 'mlp'){
    const mProt = toInt(ar.mentalProt, 0);
    let customSpec = 0;
    if(dmgOpt?.isCustom){
      const cLow = String(dmgOpt.customLabel || '').trim().toLowerCase();
      customSpec = (Array.isArray(ar.customProt) ? ar.customProt : [])
        .filter(cp => String(cp?.label || '').trim().toLowerCase() === cLow)
        .reduce((acc, cp) => acc + toInt(cp?.val, 0), 0);
    }
    const total = mProt + customSpec;
    const specDesc = customSpec
      ? `Ment. RS ${mProt} + ${dmgOpt.customLabel} ${customSpec}`
      : `Ment. RS ${mProt}`;
    return { grp: 0, spec: total, specDesc, total };
  }
  const grp = toInt(ar.grp, 0);
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
  const total = grp + spec;
  return { grp, spec, specDesc, total };
}

export function getTargetZoneArmor(targetSheet, targetM, zoneName, dmgOpt, pool = 'lp', subZoneName = '', subZones = [], blockShield = null, manualArmorMod = COMBAT.armorMod){
  const isMlp = pool === 'mlp';
  const znLow = String(zoneName || '').trim().toLowerCase();
  const subClean = String(subZoneName || '').trim();
  const subLow = subClean.toLowerCase();
  const pieces = [];
  let pieceSum = 0;
  let shieldBlockTotal = 0;
  let shieldBlockName = '';
  if(targetSheet){
    const equipped = (targetSheet.armors || []).filter(ar => ar && ar.equipped !== false && !isArmorShield(ar));
    if(isMlp){
      equipped.forEach(ar => {
        const arName = String(ar.name || '').trim() || 'Rüstung';
        const p = calcArmorPieceProtection(ar, dmgOpt, 'mlp');
        if(!p.total) return;
        pieceSum += p.total;
        pieces.push({
          id: ar.id,
          name: arName,
          grp: 0,
          spec: p.total,
          specDesc: p.specDesc,
          total: p.total,
          detail: `${arName} (${p.specDesc} = ${p.total})`
        });
      });
    }else if(znLow){
      equipped.forEach(ar => {
        const zList = (Array.isArray(ar.zones) ? ar.zones : [])
          .map(z => String(z || '').trim().toLowerCase())
          .filter(Boolean);
        const coversFull = zList.includes(znLow);
        const coversSub = Boolean(subLow && zList.some(z => z === `${znLow}: ${subLow}` || z === `${znLow}:${subLow}` || z === subLow));
        if(!coversFull && !coversSub) return;
        const arName = String(ar.name || '').trim() || 'Rüstung';
        const matchTag = (!coversFull && coversSub && subClean) ? ` [${subClean}]` : '';
        const p = calcArmorPieceProtection(ar, dmgOpt, 'lp');
        pieceSum += p.total;
        pieces.push({
          id: ar.id,
          name: `${arName}${matchTag}`,
          grp: p.grp,
          spec: p.spec,
          specDesc: p.specDesc,
          total: p.total,
          matchType: coversFull ? 'full' : 'sub',
          detail: p.grp > 0 ? `${arName}${matchTag} (gRP ${p.grp} + ${p.specDesc} = ${p.total})` : `${arName}${matchTag} (${p.specDesc} = ${p.total})`
        });
      });
    }
  }
  if(blockShield && isArmorShield(blockShield)){
    const sp = calcArmorPieceProtection(blockShield, dmgOpt, pool);
    shieldBlockName = String(blockShield.name || '').trim() || 'Schild';
    shieldBlockTotal = sp.total;
    pieceSum += sp.total;
    pieces.push({
      id: blockShield.id,
      name: `🛡️ Schild (Block): ${shieldBlockName}`,
      grp: sp.grp,
      spec: sp.spec,
      specDesc: sp.specDesc,
      total: sp.total,
      isShieldBlock: true,
      detail: sp.grp > 0
        ? `Schild ${shieldBlockName} (gRP ${sp.grp} + ${sp.specDesc} = ${sp.total})`
        : `Schild ${shieldBlockName} (${sp.specDesc} = ${sp.total})`
    });
  }
  const globalMod = isMlp ? toInt(targetM?.mentalArmor, 0) : toInt(targetM?.armor, 0);
  const manualMod = toInt(manualArmorMod, 0);
  const total = Math.max(0, pieceSum + globalMod + manualMod);
  const detailParts = pieces.map(p => p.detail);
  if(globalMod) detailParts.push(`${isMlp ? 'Effekte (Ment. RS)' : 'Effekte'} ${fmtSign(globalMod)}`);
  if(manualMod) detailParts.push(`Mod ${fmtSign(manualMod)}`);
  const fullZoneLbl = subClean ? `${zoneName} → ${subClean}` : zoneName;
  return {
    isMental: isMlp,
    pieces,
    pieceSum,
    shieldBlockTotal,
    shieldBlockName,
    globalMod,
    manualMod,
    total,
    detailText: detailParts.length ? detailParts.join(' • ') : (targetSheet ? (isMlp ? 'Keine mentale Rüstung (0)' : `Keine Rüstung auf ${fullZoneLbl || 'dieser Zone'} (0)`) : 'Kein Zielbogen (0)')
  };
}

export function evaluateThresholds(targetSheet, targetM, finalDmg, pool = 'lp'){
  const thObj = targetSheet?.thresholds || { woundLight: 4, woundMedium: 7, woundHeavy: 10, traumaLight: 4, traumaMedium: 7, traumaHeavy: 10 };
  const isMlp = pool === 'mlp';
  const light = Math.max(1, toInt(isMlp ? thObj.traumaLight : thObj.woundLight, 4) + toInt(isMlp ? targetM?.traumaLight : targetM?.woundLight, 0));
  const medium = Math.max(1, toInt(isMlp ? thObj.traumaMedium : thObj.woundMedium, 7) + toInt(isMlp ? targetM?.traumaMedium : targetM?.woundMedium, 0));
  const heavy = Math.max(1, toInt(isMlp ? thObj.traumaHeavy : thObj.woundHeavy, 10) + toInt(isMlp ? targetM?.traumaHeavy : targetM?.woundHeavy, 0));
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

export function getCombatHits(){
  if(Array.isArray(COMBAT.hits) && COMBAT.hits.length) return COMBAT.hits;
  return [];
}

export function getCombatHit(hitIdx = 0){
  const hits = getCombatHits();
  if(!hits.length) return COMBAT;
  const idx = Math.max(0, Math.min(hits.length - 1, toInt(hitIdx, 0)));
  return hits[idx];
}

export function syncLegacyCombatFields(){
  const h0 = (Array.isArray(COMBAT.hits) && COMBAT.hits.length) ? COMBAT.hits[0] : null;
  if(!h0) return;
  COMBAT.isCrit = Boolean(h0.isCrit);
  COMBAT.eg = toInt(h0.eg, 0);
  COMBAT.egMult = toInt(h0.egMult, 1);
  COMBAT.baseEg = toInt(h0.baseEg, 0);
  COMBAT.isBlocked = Boolean(h0.isBlocked);
  COMBAT.blockItemRed = Boolean(h0.blockItemRed);
  COMBAT.blockShieldId = String(h0.blockShieldId || '');
  COMBAT.blockShieldName = String(h0.blockShieldName || '');
  COMBAT.dmgType = h0.dmgType || 'cut';
  COMBAT.pool = h0.pool === 'mlp' ? 'mlp' : 'lp';
  COMBAT.zoneName = h0.zoneName || '';
  COMBAT.subZoneName = h0.subZoneName || '';
  COMBAT.lastHzRoll = h0.lastHzRoll ?? null;
  COMBAT.lastSubHzRoll = h0.lastSubHzRoll ?? null;
  COMBAT.dmgMod = toInt(h0.dmgMod, 0);
  COMBAT.armorMod = toInt(h0.armorMod, 0);
  COMBAT.posted = Boolean(h0.posted);
  COMBAT.offerId = String(h0.offerId || '');
  COMBAT.offerStatus = String(h0.offerStatus || '');
  COMBAT.offerNote = String(h0.offerNote || '');
  COMBAT.directApplying = Boolean(h0.directApplying);
  COMBAT.directAppliedNote = String(h0.directAppliedNote || '');
  COMBAT.ammoSpent = Boolean(h0.ammoSpent);
}

export function mutateCombatHit(hitIdx, mutatorFn, { resetCombined = true } = {}){
  const hit = getCombatHit(hitIdx);
  if(!hit || typeof mutatorFn !== 'function') return;
  mutatorFn(hit);
  if(resetCombined){
    COMBAT.combinedPosted = false;
    COMBAT.combinedOfferStatus = '';
    COMBAT.combinedOfferNote = '';
    COMBAT.combinedDirectAppliedNote = '';
  }
  syncLegacyCombatFields();
}

export function calculateCombatDamage(hitOrIdx = 0){
  const hit = (hitOrIdx && typeof hitOrIdx === 'object') ? hitOrIdx : getCombatHit(hitOrIdx);
  const isLob = isLobbyNeutralDice();
  const pool = hit.pool === 'mlp' ? 'mlp' : 'lp';
  const rawWeapon = (!isLob && COMBAT.weaponId) ? (S.weapons || []).find(w => w.id === COMBAT.weaponId) : null;
  const rawShield = (!isLob && !rawWeapon && COMBAT.shieldId) ? (S.armors || []).find(a => a.id === COMBAT.shieldId && isArmorShield(a)) : null;
  const rawAtkItem = rawWeapon || rawShield;
  const weaponApplies = rawAtkItem ? doesWeaponApplyToPool(rawAtkItem, pool, 'Trefferwurf') : false;
  const weapon = (rawWeapon && weaponApplies) ? rawWeapon : null;
  const atkShield = (rawShield && weaponApplies) ? rawShield : null;
  const atkItem = weapon || atkShield;
  const ammo = (!isLob && weapon && weapon.wType === 'ranged')
    ? (COMBAT.ammoId ? (S.ammos || []).find(a => a.id === COMBAT.ammoId) : getEffectiveWeaponAmmo(weapon, S))
    : null;
  const tags = getWeaponAllTags(atkItem, ammo);
  const opts = getWeaponDamageOptions(atkItem, ammo);
  const selOpt = opts.find(o => o.key === hit.dmgType) || opts[0] || { key: 'cut', label: 'Schnitt', val: 0 };

  const targetSheet = resolveCombatTargetSheet(COMBAT.targetCharId);
  const targetM = targetSheet ? calcActiveMods(targetSheet) : null;
  const hitZones = getTargetHitZones(targetSheet);
  const zoneObj = hitZones.find(z => String(z.zone || '').trim().toLowerCase() === String(hit.zoneName || '').trim().toLowerCase()) || hitZones[1] || hitZones[0];
  const zoneName = zoneObj ? String(zoneObj.zone || '').trim() : (hit.zoneName || 'Rumpf');
  const subZones = getHitZoneSubZones(zoneObj);
  const rawSub = String(hit.subZoneName || '').trim();
  const subZoneMatch = rawSub ? subZones.find(sz => String(sz.zone || '').trim().toLowerCase() === rawSub.toLowerCase()) : null;
  const subZoneName = subZoneMatch ? String(subZoneMatch.zone || '').trim() : '';
  const fullZoneName = subZoneName ? `${zoneName} → ${subZoneName}` : zoneName;
  const partialArmors = (pool !== 'mlp' && targetSheet) ? getPartialArmorsForMainZone(targetSheet, zoneName, subZones) : [];
  const targetShields = targetSheet ? getSheetShields(targetSheet) : [];
  const blockShield = (hit.isBlocked && hit.blockShieldId && targetSheet)
    ? (targetSheet.armors || []).find(a => a && a.id === hit.blockShieldId && isArmorShield(a)) || null
    : null;

  const eg = Math.max(0, toInt(hit.eg, 0));
  const isCrit = Boolean(hit.isCrit);
  const critBonus = isCrit ? 2 : 0;
  const weaponDmg = toInt(selOpt.val, 0);
  const verheerendX = findTagNumericVal(tags, /^verheerend\b/i);
  const verheerendBonus = (verheerendX > 0 && eg >= 5) ? verheerendX : 0;
  const mehrfachschussX = findTagNumericVal(tags, /^mehrfachschuss\b/i);
  const mehrfachschussBonus = (mehrfachschussX > 0 && eg >= mehrfachschussX) ? Math.floor(eg / mehrfachschussX) : 0;
  const durchschlagX = findTagNumericVal(tags, /^durchschlag\b/i);
  const nichtParierbar = hasTagMatch(tags, /^nicht\s+parierbar\b/i);
  const dmgMod = toInt(hit.dmgMod, 0);
  const rawDmg = Math.max(0, eg + critBonus + weaponDmg + verheerendBonus + mehrfachschussBonus + dmgMod);

  const blockRed = (hit.isBlocked && !blockShield && hit.blockItemRed) ? 2 : 0;
  const afterBlock = Math.max(0, rawDmg - blockRed);

  const armor = getTargetZoneArmor(targetSheet, targetM, zoneName, selOpt, pool, subZoneName, subZones, blockShield, hit.armorMod);
  const afterArmor = Math.max(0, afterBlock - armor.total);

  const durchschlagApplied = Boolean(hit.isBlocked && durchschlagX > 0 && afterArmor === 0);
  const uncappedDmg = durchschlagApplied ? durchschlagX : afterArmor;
  const threshold = evaluateThresholds(targetSheet, targetM, uncappedDmg, pool);
  const maxDmgCap = Math.max(1, toInt(threshold.heavy, 10));
  const dmgCapped = uncappedDmg > maxDmgCap;
  const finalDmg = dmgCapped ? maxDmgCap : uncappedDmg;

  const parts = [`${eg} EG`];
  if(critBonus) parts.push(`+ ${critBonus} Krit`);
  if(weaponDmg) parts.push(`+ ${weaponDmg} ${atkShield ? 'Schild' : `Waffe${ammo ? '/Mun.' : ''}`}`);
  if(verheerendBonus) parts.push(`+ ${verheerendBonus} Verheerend`);
  if(mehrfachschussBonus) parts.push(`+ ${mehrfachschussBonus} Mehrfachschuss (${mehrfachschussX})`);
  if(dmgMod) parts.push(`${dmgMod > 0 ? '+' : '−'} ${Math.abs(dmgMod)} Mod`);
  if(blockRed) parts.push(`− ${blockRed} Block`);
  if(armor.total){
    const armorBaseLbl = pool === 'mlp' ? 'Ment. Rüstung' : 'Rüstung';
    if(armor.shieldBlockTotal > 0){
      const baseArmor = Math.max(0, armor.total - armor.shieldBlockTotal);
      parts.push(baseArmor > 0
        ? `− ${armor.total} ${armorBaseLbl} (${baseArmor} + ${armor.shieldBlockTotal} Schild)`
        : `− ${armor.total} Schild-Rüstung`);
    }else{
      parts.push(`− ${armor.total} ${armorBaseLbl}`);
    }
  }
  const poolLbl = pool === 'mlp' ? 'mLP' : 'LP';
  let formula = `${parts.join(' ')} = ${afterArmor} ${poolLbl}`;
  if(durchschlagApplied){
    formula += ` → Durchschlag (${durchschlagX}) = ${uncappedDmg} ${poolLbl}`;
  }
  if(dmgCapped){
    formula += ` → max. ${maxDmgCap} ${poolLbl} (Schwelle)`;
  }

  const weaponName = atkShield
    ? `🛡️ ${String(atkShield.name || '').trim() || 'Schild'}`
    : (weapon
      ? (String(weapon.name || '').trim() || getWeaponSubtype(weapon.wType).label)
      : (pool === 'mlp' ? 'Mentaler Angriff / ohne Waffe' : 'Waffenlos / Angriff'));
  const ammoName = ammo ? (String(ammo.name || '').trim() || 'Munition') : '';
  const targetName = targetSheet ? (String(targetSheet.profile?.name || '').trim() || COMBAT.targetName || 'Ziel') : (COMBAT.targetName || '');

  return {
    hit,
    rawWeapon,
    rawShield,
    weaponApplies,
    weapon,
    atkShield,
    ammo,
    weaponName,
    ammoName,
    tags,
    opts,
    selOpt,
    targetSheet,
    targetM,
    targetName,
    targetShields,
    blockShield,
    hitZones,
    zoneObj,
    zoneName,
    subZones,
    subZoneName,
    fullZoneName,
    partialArmors,
    eg,
    isCrit,
    critBonus,
    weaponDmg,
    verheerendX,
    verheerendBonus,
    mehrfachschussX,
    mehrfachschussBonus,
    durchschlagX,
    nichtParierbar,
    dmgMod,
    rawDmg,
    blockRed,
    afterBlock,
    armor,
    afterArmor,
    durchschlagApplied,
    uncappedDmg,
    maxDmgCap,
    dmgCapped,
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
  COMBAT.isCrit = false;
  COMBAT.eg = 0;
  COMBAT.egMult = 1;
  COMBAT.baseEg = 0;
  COMBAT.isBlocked = false;
  COMBAT.blockItemRed = false;
  COMBAT.blockShieldId = '';
  COMBAT.blockShieldName = '';
  COMBAT.weaponId = null;
  COMBAT.shieldId = null;
  COMBAT.ammoId = null;
  COMBAT.attackerName = '';
  COMBAT.targetCharId = '';
  COMBAT.targetName = '';
  COMBAT.dmgType = 'cut';
  COMBAT.pool = 'lp';
  COMBAT.zoneName = '';
  COMBAT.subZoneName = '';
  COMBAT.lastHzRoll = null;
  COMBAT.lastSubHzRoll = null;
  COMBAT.dmgMod = 0;
  COMBAT.armorMod = 0;
  COMBAT.posted = false;
  COMBAT.offerId = '';
  COMBAT.offerStatus = '';
  COMBAT.offerNote = '';
  COMBAT.directApplying = false;
  COMBAT.directAppliedNote = '';
  COMBAT.ammoSpent = false;
  COMBAT.hits = [];
  COMBAT.combinedPosted = false;
  COMBAT.combinedOfferId = '';
  COMBAT.combinedOfferStatus = '';
  COMBAT.combinedOfferNote = '';
  COMBAT.combinedDirectApplying = false;
  COMBAT.combinedDirectAppliedNote = '';
}

export function initCombatFromRoll({ T, res, isManualBlocked = false, isAtkBlk20 = false, attackerName = '' }){
  const manualBlk = Boolean(isManualBlocked || isAtkBlk20);
  const isWeaponHit = Boolean(manualBlk || D.wRollCat === 'Trefferwurf');
  if(!isWeaponHit){
    resetCombatState();
    return;
  }
  const isLob = isLobbyNeutralDice();
  const initPool = D.atkPool === 'mlp' ? 'mlp' : 'lp';
  const effWpId = isLob ? null : getEffectiveDiceWeaponId();
  const effShId = isLob ? null : getEffectiveDiceShieldId();
  const weapon = effWpId ? (S.weapons || []).find(w => w.id === effWpId) : null;
  const atkShield = (!weapon && effShId) ? (S.armors || []).find(a => a.id === effShId && isArmorShield(a)) : null;
  const atkItem = weapon || atkShield;
  const ammo = (!isLob && weapon && weapon.wType === 'ranged')
    ? getEffectiveWeaponAmmo(weapon, S)
    : null;
  const tags = getWeaponAllTags(atkItem, ammo);
  const nichtParierbar = hasTagMatch(tags, /^nicht\s+parierbar\b/i);

  const opp = T?.opp?.ready ? T.opp : null;
  const targetCharId = opp?.charId || (manualBlk ? (COMBAT.targetCharId || '') : '');
  const targetName = opp?.oppName || (manualBlk ? (COMBAT.targetName || '') : '');

  const oppCat = opp?.oppRollCat || '';
  const isDefBlock = Boolean(opp && oppCat === 'Blocken');
  const isDefParryUnparryable = Boolean(opp && oppCat === 'Parieren' && nichtParierbar);
  const canResolveBlock = Boolean(isDefBlock || isDefParryUnparryable);

  const defShield = (!isDefParryUnparryable && opp?.oppShield) ? opp.oppShield : null;
  const defShieldId = !isDefParryUnparryable ? (defShield?.id || opp?.oppShieldId || '') : '';
  const defShieldName = !isDefParryUnparryable
    ? (defShield ? (String(defShield.name || '').trim() || 'Schild') : (opp?.oppShieldName || ''))
    : '';
  const oppHasBlockItem = isDefParryUnparryable
    || (!defShieldId && (Boolean(opp?.oppWeapon && isWeaponBlockable(opp.oppWeapon)) || opp?.oppBlockKind === 'item'));

  const resolvedHits = [];
  if(manualBlk){
    resolvedHits.push({
      rollIdx: 1,
      rollVal: 0,
      isCrit: false,
      eg: 3,
      isBlocked: true,
      blockReason: 'blocked',
      blockShieldId: defShieldId,
      blockShieldName: defShieldName,
      blockItemRed: defShieldId ? false : (oppHasBlockItem || !targetCharId)
    });
  }else{
    (res || []).forEach((x, idx) => {
      if(!x) return;
      if(x.ok){
        resolvedHits.push({
          rollIdx: idx + 1,
          rollVal: toInt(x.r, 0),
          isCrit: Boolean(x.crit),
          eg: toInt(x.eg, 0),
          isBlocked: false,
          blockReason: '',
          blockShieldId: '',
          blockShieldName: '',
          blockItemRed: false
        });
      }else if(canResolveBlock && toInt(x.r, 0) !== 100){
        resolvedHits.push({
          rollIdx: idx + 1,
          rollVal: toInt(x.r, 0),
          isCrit: false,
          eg: 3,
          isBlocked: true,
          blockReason: isDefParryUnparryable ? 'nicht_parierbar' : 'blocked',
          blockShieldId: defShieldId,
          blockShieldName: defShieldName,
          blockItemRed: oppHasBlockItem
        });
      }
    });
  }

  if(!resolvedHits.length){
    resetCombatState();
    return;
  }

  const opts = getWeaponDamageOptions(atkItem, ammo);
  const defDmgType = pickDefaultDamageType(opts, tags);
  const targetSheet = resolveCombatTargetSheet(targetCharId);
  const hitZones = getTargetHitZones(targetSheet);
  const defZone = (hitZones[1]?.zone || hitZones[0]?.zone || 'Rumpf');
  const rawAimZone = (D.aimActive && T?.aimInfo?.zoneName) ? String(T.aimInfo.zoneName).trim() : '';
  const aimedZoneMatch = rawAimZone
    ? (hitZones.find(z => String(z?.zone || '').trim().toLowerCase() === rawAimZone.toLowerCase())?.zone || rawAimZone)
    : '';

  COMBAT.active = true;
  COMBAT.collapsed = false;
  COMBAT.hitOk = true;
  COMBAT.blockPrompt = false;
  COMBAT.blockPromptReason = '';
  COMBAT.weaponId = weapon?.id || null;
  COMBAT.shieldId = atkShield?.id || null;
  COMBAT.ammoId = ammo?.id || null;
  COMBAT.attackerName = attackerName;
  COMBAT.targetCharId = targetCharId;
  COMBAT.targetName = targetName;
  COMBAT.combinedPosted = false;
  COMBAT.combinedOfferId = '';
  COMBAT.combinedOfferStatus = '';
  COMBAT.combinedOfferNote = '';
  COMBAT.combinedDirectApplying = false;
  COMBAT.combinedDirectAppliedNote = '';
  COMBAT.hits = resolvedHits.map(rh => ({
    id: 'hit_' + uid(),
    rollIdx: rh.rollIdx,
    rollVal: rh.rollVal,
    isCrit: rh.isCrit,
    eg: rh.eg,
    egMult: 1,
    baseEg: rh.eg,
    isBlocked: rh.isBlocked,
    blockReason: rh.blockReason || '',
    blockShieldId: rh.blockShieldId || '',
    blockShieldName: rh.blockShieldName || '',
    blockItemRed: Boolean(rh.blockItemRed),
    aimedZone: (!rh.isBlocked && aimedZoneMatch) ? aimedZoneMatch : '',
    dmgType: defDmgType,
    pool: initPool,
    zoneName: (!rh.isBlocked && aimedZoneMatch) ? aimedZoneMatch : defZone,
    subZoneName: '',
    lastHzRoll: null,
    lastSubHzRoll: null,
    dmgMod: 0,
    armorMod: 0,
    posted: false,
    offerId: '',
    offerStatus: '',
    offerNote: '',
    directApplying: false,
    directAppliedNote: '',
    ammoSpent: false,
    collapsed: false
  }));
  syncLegacyCombatFields();
}

export function rollCombatHitZone(hitIdx = 0, { silentRender = false } = {}){
  if(!COMBAT.active) return null;
  const hitEntry = getCombatHit(hitIdx);
  const hits = getCombatHits();
  const isMulti = hits.length > 1;
  const targetSheet = resolveCombatTargetSheet(COMBAT.targetCharId);
  const hitZones = getTargetHitZones(targetSheet);
  const r = rollW100();
  if(r === 69) triggerNiceEasterEgg();
  const hzMatch = matchHitZoneByRoll(hitZones, r) || hitZones[0];
  hitEntry.lastHzRoll = r;
  hitEntry.zoneName = hzMatch ? String(hzMatch.zone || '').trim() : 'Rumpf';
  hitEntry.lastSubHzRoll = null;
  hitEntry.subZoneName = '';
  hitEntry.posted = false;
  hitEntry.offerStatus = '';
  hitEntry.offerNote = '';
  hitEntry.directAppliedNote = '';
  COMBAT.combinedPosted = false;
  COMBAT.combinedOfferStatus = '';
  COMBAT.combinedOfferNote = '';
  COMBAT.combinedDirectAppliedNote = '';

  const subZones = getHitZoneSubZones(hzMatch);
  const partialArmors = (hitEntry.pool !== 'mlp' && targetSheet) ? getPartialArmorsForMainZone(targetSheet, hitEntry.zoneName, subZones) : [];
  let subRoll = null, subHit = null;
  if(partialArmors.length > 0 && subZones.length > 0){
    subRoll = rollW100();
    if(subRoll === 69) triggerNiceEasterEgg();
    subHit = matchHitZoneByRoll(subZones, subRoll) || subZones[0];
    hitEntry.lastSubHzRoll = subRoll;
    hitEntry.subZoneName = subHit ? String(subHit.zone || '').trim() : '';
  }
  syncLegacyCombatFields();

  const isLob = isLobbyNeutralDice();
  const targetLbl = targetSheet ? (String(targetSheet.profile?.name || '').trim() || COMBAT.targetName) : COMBAT.targetName;
  const baseHzLabel = hzMatch ? `${hzMatch.zone}${hzMatch.size ? ` (${hzMatch.size})` : ''}` : 'Unbekannt';
  const hzLabel = (subHit && subRoll !== null)
    ? `${hzMatch?.zone || 'Zone'} → ${subHit.zone} (Detail-W100 = ${subRoll})`
    : baseHzLabel;
  const hitTag = isMulti ? ` #${hitEntry.rollIdx || (toInt(hitIdx, 0) + 1)}` : '';
  publishLiveRoll({
    id: uid(),
    tsMs: Date.now(),
    ts: new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    senderTabId: LIVE_TAB_ID,
    charId: isLob ? '' : (S.charId || ''),
    charName: COMBAT.attackerName || (isLob ? (CLOUD.currentUser || 'Gast') : (String(S.profile?.name || '').trim() || 'Unbenannter Held')),
    playerName: isLob ? '' : String(CLOUD.currentUser || S.owner || '').trim(),
    campaignId: getActiveDiceCampaignId(),
    label: targetLbl ? `🎯 Trefferzone${hitTag} (${targetLbl})` : `🎯 Trefferzonen-Wurf${hitTag}`,
    vsCharId: COMBAT.targetCharId || undefined,
    vsCharName: targetLbl || undefined,
    isHz: true,
    hzZone: hzLabel,
    th: 100,
    chance: 100,
    res: [{ r, ok: true, crit: false, eg: 0, meg: 0 }]
  });
  if(!silentRender){
    if(!isSecretRollActive()){
      toast(`🎯 Trefferzone${hitTag}${targetLbl ? ` (${targetLbl})` : ''}: W100 = ${r} → ${hzLabel}`);
    }
    renderDice();
  }
  return { r, hzLabel };
}

export function rollAllCombatHitZones(){
  const hits = getCombatHits();
  if(!COMBAT.active || !hits.length) return;
  const summaries = hits.map((h, i) => {
    const out = rollCombatHitZone(i, { silentRender: true });
    return `#${h.rollIdx || (i + 1)}: ${out?.hzLabel || h.zoneName}`;
  });
  if(!isSecretRollActive()){
    toast(`🎯 Alle ${hits.length} Trefferzonen gewürfelt: ${summaries.join(' • ')}`);
  }
  renderDice();
}

export function rollCombatSubHitZone(hitIdx = 0){
  if(!COMBAT.active) return;
  const hitEntry = getCombatHit(hitIdx);
  const hits = getCombatHits();
  const isMulti = hits.length > 1;
  const targetSheet = resolveCombatTargetSheet(COMBAT.targetCharId);
  const hitZones = getTargetHitZones(targetSheet);
  const zoneObj = hitZones.find(z => String(z.zone || '').trim().toLowerCase() === String(hitEntry.zoneName || '').trim().toLowerCase()) || hitZones[0];
  const subZones = getHitZoneSubZones(zoneObj);
  if(!subZones.length){
    toast('Für diese Trefferzone sind keine Detailzonen hinterlegt.');
    return;
  }
  const r2 = rollW100();
  if(r2 === 69) triggerNiceEasterEgg();
  const subHit = matchHitZoneByRoll(subZones, r2) || subZones[0];
  hitEntry.lastSubHzRoll = r2;
  hitEntry.subZoneName = subHit ? String(subHit.zone || '').trim() : '';
  hitEntry.posted = false;
  hitEntry.offerStatus = '';
  hitEntry.offerNote = '';
  hitEntry.directAppliedNote = '';
  COMBAT.combinedPosted = false;
  COMBAT.combinedOfferStatus = '';
  COMBAT.combinedOfferNote = '';
  COMBAT.combinedDirectAppliedNote = '';
  syncLegacyCombatFields();

  const isLob = isLobbyNeutralDice();
  const targetLbl = targetSheet ? (String(targetSheet.profile?.name || '').trim() || COMBAT.targetName) : COMBAT.targetName;
  const mainName = zoneObj ? String(zoneObj.zone || '').trim() : (hitEntry.zoneName || 'Zone');
  const hzLabel = `${mainName} → ${hitEntry.subZoneName || 'Detailzone'}`;
  const hitTag = isMulti ? ` #${hitEntry.rollIdx || (toInt(hitIdx, 0) + 1)}` : '';
  publishLiveRoll({
    id: uid(),
    tsMs: Date.now(),
    ts: new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    senderTabId: LIVE_TAB_ID,
    charId: isLob ? '' : (S.charId || ''),
    charName: COMBAT.attackerName || (isLob ? (CLOUD.currentUser || 'Gast') : (String(S.profile?.name || '').trim() || 'Unbenannter Held')),
    playerName: isLob ? '' : String(CLOUD.currentUser || S.owner || '').trim(),
    campaignId: getActiveDiceCampaignId(),
    label: targetLbl ? `🔍 Detail-Trefferzone${hitTag} (${targetLbl})` : `🔍 Detail-Trefferzone${hitTag}`,
    vsCharId: COMBAT.targetCharId || undefined,
    vsCharName: targetLbl || undefined,
    isHz: true,
    hzZone: hzLabel,
    th: 100,
    chance: 100,
    res: [{ r: r2, ok: true, crit: false, eg: 0, meg: 0 }]
  });
  if(!isSecretRollActive()){
    toast(`🔍 Detailzone${hitTag} (${mainName}): W100 = ${r2} → ${hitEntry.subZoneName}`);
  }
  renderDice();
}

function buildHiddenEnemyDmgFormula(calc){
  const parts = [`${calc.eg} EG`];
  if(calc.critBonus) parts.push(`+ ${calc.critBonus} Krit`);
  if(calc.weaponDmg) parts.push(`+ ${calc.weaponDmg} ${calc.atkShield ? 'Schild' : `Waffe${calc.ammo ? '/Mun.' : ''}`}`);
  if(calc.verheerendBonus) parts.push(`+ ${calc.verheerendBonus} Verheerend`);
  if(calc.mehrfachschussBonus) parts.push(`+ ${calc.mehrfachschussBonus} Mehrfachschuss (${calc.mehrfachschussX})`);
  if(calc.dmgMod) parts.push(`${calc.dmgMod > 0 ? '+' : '−'} ${Math.abs(calc.dmgMod)} Mod`);
  if(calc.blockRed) parts.push(`− ${calc.blockRed} Block`);
  return `${parts.join(' ')} → ${calc.finalDmg} ${calc.poolLbl} (nach Gegner-Rüstung)`;
}

export function publishCombatDamageToFeed(hitIdx = 0){
  if(!COMBAT.active || !COMBAT.hitOk) return;
  const hitEntry = getCombatHit(hitIdx);
  const hits = getCombatHits();
  const isMulti = hits.length > 1;
  const calc = calculateCombatDamage(hitEntry);
  const isLob = isLobbyNeutralDice();
  const atkName = COMBAT.attackerName || (isLob ? (CLOUD.currentUser || 'Gast') : (String(S.profile?.name || '').trim() || 'Unbenannter Held'));
  const dmgTypeLabel = calc.selOpt.shortLabel || calc.selOpt.label || 'Schaden';
  const targetIsEnemy = Boolean(COMBAT.targetCharId && isEnemySheet(COMBAT.targetCharId));
  const hitTag = isMulti ? ` #${hitEntry.rollIdx || (toInt(hitIdx, 0) + 1)}` : '';
  const title = calc.targetName
    ? `💥 Schaden${hitTag}: ${calc.weaponName} → ${calc.targetName} (${calc.fullZoneName})`
    : `💥 Schaden${hitTag}: ${calc.weaponName} (${calc.fullZoneName})`;

  const payload = {
    id: uid(),
    tsMs: Date.now(),
    ts: new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    senderTabId: LIVE_TAB_ID,
    charId: isLob ? '' : (S.charId || ''),
    charName: atkName,
    playerName: isLob ? '' : (isEnemySheet(S) ? 'SL' : String(CLOUD.currentUser || S.owner || '').trim()),
    campaignId: getActiveDiceCampaignId(),
    label: title,
    isDamage: true,
    isCrit: calc.isCrit,
    critBonus: calc.critBonus,
    finalDmg: calc.finalDmg,
    rawDmg: calc.rawDmg,
    armorTotal: targetIsEnemy ? 0 : calc.armor.total,
    armorDetail: targetIsEnemy ? '' : calc.armor.detailText,
    blockRed: calc.blockRed,
    isBlocked: Boolean(hitEntry.isBlocked),
    durchschlagApplied: calc.durchschlagApplied,
    dmgTypeLabel,
    pool: calc.pool,
    hzZone: calc.fullZoneName,
    thresholdLevel: targetIsEnemy ? 'none' : calc.threshold.level,
    thresholdLabel: targetIsEnemy ? '' : calc.threshold.label,
    formula: targetIsEnemy ? buildHiddenEnemyDmgFormula(calc) : calc.formula,
    th: 100,
    chance: 100,
    res: [{ r: calc.finalDmg, ok: calc.finalDmg > 0, crit: calc.isCrit, eg: calc.eg, meg: 0 }]
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
    sum: `💥 ${calc.finalDmg} ${calc.poolLbl}${calc.isCrit ? ' (★ Krit +2)' : ''}${(!targetIsEnemy && calc.threshold.label) ? ` (${calc.threshold.label})` : ''}`
  });
  if(diceLogs.length > 40) diceLogs.length = 40;
  hitEntry.posted = true;
  syncLegacyCombatFields();
  if(!isSecretRollActive()){
    toast(`📡 Schaden${hitTag} gepostet: ${calc.finalDmg} ${calc.poolLbl}${calc.targetName ? ` an ${calc.targetName}` : ''}`);
  }
  renderDice();
}

export function publishAllCombatDamageToFeed(){
  const hits = getCombatHits();
  if(!COMBAT.active || !COMBAT.hitOk || !hits.length) return;
  if(hits.length === 1){
    publishCombatDamageToFeed(0);
    return;
  }
  const calcs = hits.map(h => calculateCombatDamage(h));
  const isLob = isLobbyNeutralDice();
  const atkName = COMBAT.attackerName || (isLob ? (CLOUD.currentUser || 'Gast') : (String(S.profile?.name || '').trim() || 'Unbenannter Held'));
  const targetIsEnemy = Boolean(COMBAT.targetCharId && isEnemySheet(COMBAT.targetCharId));
  const c0 = calcs[0];
  const anyCrit = calcs.some(c => c.isCrit);
  const pools = [...new Set(calcs.map(c => c.pool))];
  const primaryPool = pools.length === 1 ? pools[0] : 'lp';
  const totalDmg = calcs.reduce((sum, c) => sum + c.finalDmg, 0);
  const poolLbl = pools.length === 1 ? (primaryPool === 'mlp' ? 'mLP' : 'LP') : 'LP/mLP';
  const zonesSummary = calcs.map((c, i) => `#${c.hit.rollIdx || (i + 1)}: ${c.fullZoneName}`).join(' • ');
  const formulaLines = calcs.map((c, i) => {
    const f = targetIsEnemy ? buildHiddenEnemyDmgFormula(c) : c.formula;
    return `#${c.hit.rollIdx || (i + 1)} (${c.fullZoneName}): ${f}`;
  }).join(' | ');
  const title = c0.targetName
    ? `💥 Gesamtschaden (${hits.length} Treffer): ${c0.weaponName} → ${c0.targetName}`
    : `💥 Gesamtschaden (${hits.length} Treffer): ${c0.weaponName}`;

  const payload = {
    id: uid(),
    tsMs: Date.now(),
    ts: new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    senderTabId: LIVE_TAB_ID,
    charId: isLob ? '' : (S.charId || ''),
    charName: atkName,
    playerName: isLob ? '' : (isEnemySheet(S) ? 'SL' : String(CLOUD.currentUser || S.owner || '').trim()),
    campaignId: getActiveDiceCampaignId(),
    label: title,
    isDamage: true,
    isCrit: anyCrit,
    finalDmg: totalDmg,
    rawDmg: calcs.reduce((sum, c) => sum + c.rawDmg, 0),
    armorTotal: 0,
    armorDetail: '',
    isBlocked: calcs.some(c => c.hit.isBlocked),
    durchschlagApplied: calcs.some(c => c.durchschlagApplied),
    dmgTypeLabel: `${hits.length} Treffer (${calcs.map(c => `${c.finalDmg} ${c.poolLbl}`).join(' + ')})`,
    pool: primaryPool,
    hzZone: zonesSummary,
    thresholdLevel: 'none',
    thresholdLabel: '',
    formula: formulaLines,
    th: 100,
    chance: 100,
    res: calcs.map(c => ({ r: c.finalDmg, ok: c.finalDmg > 0, crit: c.isCrit, eg: c.eg, meg: 0 }))
  };
  if(COMBAT.targetCharId && c0.targetName){
    payload.vsCharId = COMBAT.targetCharId;
    payload.vsCharName = c0.targetName;
  }
  publishLiveRoll(payload);
  diceLogs.unshift({
    t: new Date().toLocaleTimeString('de-DE'),
    lbl: title,
    isCustomDice: true,
    sum: `💥 ${totalDmg} ${poolLbl} (${calcs.map(c => `${c.finalDmg}${c.isCrit ? '★' : ''}`).join(' + ')})`
  });
  if(diceLogs.length > 40) diceLogs.length = 40;
  COMBAT.combinedPosted = true;
  hits.forEach(h => { h.posted = true; });
  syncLegacyCombatFields();
  if(!isSecretRollActive()){
    toast(`📡 Gesamtschaden (${hits.length} Treffer) gepostet: ${totalDmg} ${poolLbl}`);
  }
  renderDice();
}

const handledOfferIds = new Set();

export function isDamageOfferTargetForMe(offer){
  if(!offer || !offer.targetCharId) return false;
  const tid = String(offer.targetCharId).trim();
  if(isEnemySheet(tid)){
    if(CLOUD.isAdmin) return true;
    const ofCamp = String(offer.campaignId || '').trim();
    if(ofCamp && ofCamp !== 'default' && canManageCampaign(ofCamp)) return true;
    const meta = getEnemyMeta(tid);
    return meta.campaignIds.some(cid => canManageCampaign(cid));
  }
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
  if(isEnemySheet(tid)){
    const activeCamp = getActiveDiceCampaignId();
    if(activeCamp && activeCamp !== 'default' && canManageCampaign(activeCamp)) return true;
    const meta = getEnemyMeta(tid);
    return meta.campaignIds.some(cid => canManageCampaign(cid));
  }
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

export function sendCombatDamageOffer(hitIdx = 0){
  if(!COMBAT.active || !COMBAT.hitOk) return;
  const hitEntry = getCombatHit(hitIdx);
  const hits = getCombatHits();
  const isMulti = hits.length > 1;
  const tid = String(COMBAT.targetCharId || '').trim();
  if(!tid){
    toast('Kein Ziel-Charakter ausgewählt.');
    return;
  }
  const calc = calculateCombatDamage(hitEntry);
  if(calc.finalDmg <= 0){
    toast('Endschaden ist 0 – kein Abzug nötig.');
    return;
  }
  const isLob = isLobbyNeutralDice();
  const atkName = COMBAT.attackerName || (isLob ? (CLOUD.currentUser || 'Gast') : (String(S.profile?.name || '').trim() || 'Unbenannter Held'));
  const campId = getActiveDiceCampaignId();
  const offerId = `dmg_${uid()}`;
  const hitTag = isMulti ? ` #${hitEntry.rollIdx || (toInt(hitIdx, 0) + 1)}` : '';
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
    weaponName: `${calc.weaponName}${hitTag}`,
    pool: calc.pool,
    amount: calc.finalDmg,
    zoneName: calc.fullZoneName,
    dmgTypeLabel: `${calc.selOpt.shortLabel || calc.selOpt.label || 'Schaden'}${calc.isCrit ? ' ★ Krit' : ''}`,
    thresholdLevel: calc.threshold.level,
    thresholdLabel: calc.threshold.label,
    formula: calc.formula,
    armorDetail: calc.armor.detailText,
    isBlocked: Boolean(hitEntry.isBlocked),
    durchschlagApplied: calc.durchschlagApplied
  };
  hitEntry.offerId = offerId;
  hitEntry.offerStatus = 'sent';
  const targetIsEnemy = isEnemySheet(tid);
  hitEntry.offerNote = targetIsEnemy
    ? `📨 Schadensangebot${hitTag} (−${calc.finalDmg} ${calc.poolLbl}) für ${offer.targetName} an die Spielleitung gesendet...`
    : `📨 Schadensangebot${hitTag} (−${calc.finalDmg} ${calc.poolLbl}) an ${offer.targetName} gesendet...`;
  syncLegacyCombatFields();
  sendLiveBroadcast(offer);
  toast(targetIsEnemy
    ? `💥 Schaden${hitTag} für ${offer.targetName} an die Spielleitung gesendet (−${calc.finalDmg} ${calc.poolLbl})!`
    : `💥 Schaden${hitTag} an ${offer.targetName} gesendet (−${calc.finalDmg} ${calc.poolLbl})!`);
  renderDice();
}

export function sendCombinedCombatDamageOffer(){
  const hits = getCombatHits();
  if(!COMBAT.active || !COMBAT.hitOk || !hits.length) return;
  if(hits.length === 1){
    sendCombatDamageOffer(0);
    return;
  }
  const tid = String(COMBAT.targetCharId || '').trim();
  if(!tid){
    toast('Kein Ziel-Charakter ausgewählt.');
    return;
  }
  const calcs = hits.map(h => calculateCombatDamage(h));
  const byPool = { lp: calcs.filter(c => c.pool === 'lp' && c.finalDmg > 0), mlp: calcs.filter(c => c.pool === 'mlp' && c.finalDmg > 0) };
  const activePools = ['lp', 'mlp'].filter(p => byPool[p].length > 0);
  if(!activePools.length){
    toast('Gesamtschaden ist 0 – kein Abzug nötig.');
    return;
  }
  const isLob = isLobbyNeutralDice();
  const atkName = COMBAT.attackerName || (isLob ? (CLOUD.currentUser || 'Gast') : (String(S.profile?.name || '').trim() || 'Unbenannter Held'));
  const campId = getActiveDiceCampaignId();
  const targetIsEnemy = isEnemySheet(tid);
  const notes = [];
  activePools.forEach(pool => {
    const group = byPool[pool];
    const sumAmt = group.reduce((s, c) => s + c.finalDmg, 0);
    const poolLbl = pool === 'mlp' ? 'mLP' : 'LP';
    const offerId = `dmg_${uid()}`;
    const c0 = group[0];
    const zonesTxt = group.map(c => `#${c.hit.rollIdx}: ${c.fullZoneName}`).join(', ');
    const formulaTxt = group.map(c => `#${c.hit.rollIdx}: ${c.formula}`).join(' | ');
    const maxTh = group.reduce((best, c) => {
      const rank = l => l === 'heavy' ? 3 : l === 'medium' ? 2 : l === 'light' ? 1 : 0;
      return rank(c.threshold.level) > rank(best.level) ? c.threshold : best;
    }, { level: 'none', label: '' });
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
      targetName: c0.targetName || 'Ziel',
      weaponName: `${c0.weaponName} (${group.length} Treffer)`,
      pool,
      amount: sumAmt,
      zoneName: zonesTxt,
      dmgTypeLabel: `${group.length} Treffer (${group.map(c => `${c.finalDmg}${c.isCrit ? '★' : ''}`).join(' + ')})`,
      thresholdLevel: maxTh.level,
      thresholdLabel: maxTh.label,
      formula: formulaTxt,
      armorDetail: '',
      isBlocked: group.some(c => c.hit.isBlocked),
      durchschlagApplied: group.some(c => c.durchschlagApplied)
    };
    COMBAT.combinedOfferId = offerId;
    COMBAT.combinedOfferStatus = 'sent';
    sendLiveBroadcast(offer);
    notes.push(`−${sumAmt} ${poolLbl}`);
  });
  const targetName = calcs[0].targetName || COMBAT.targetName || 'Ziel';
  COMBAT.combinedOfferNote = targetIsEnemy
    ? `📨 Gesamtschaden (${notes.join(' / ')}) für ${targetName} an die Spielleitung gesendet...`
    : `📨 Gesamtschaden (${notes.join(' / ')}) an ${targetName} gesendet...`;
  toast(COMBAT.combinedOfferNote);
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
  const targetIsEnemy = isEnemySheet(offer.targetCharId);
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
  const publicSuffix = targetIsEnemy ? '' : valSuffix;
  sendLiveBroadcast({
    type: 'combat_damage_applied',
    status: 'applied',
    offerId: offer.offerId,
    campaignId: offer.campaignId,
    targetCharId: offer.targetCharId,
    targetName: offer.targetName,
    pool,
    appliedAmount: amt,
    prevVal: targetIsEnemy ? null : prevVal,
    newVal: targetIsEnemy ? null : newVal,
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
    playerName: targetIsEnemy ? 'SL' : String(CLOUD.currentUser || '').trim(),
    campaignId: offer.campaignId || getActiveLiveCampaignId(),
    label: `✅ Schaden übernommen (${offer.attackerName || 'Angreifer'} • ${offer.zoneName || 'Zone'})${publicSuffix}`,
    isDamage: true,
    finalDmg: amt,
    pool,
    hzZone: offer.zoneName || '',
    dmgTypeLabel: offer.dmgTypeLabel || 'Schaden',
    thresholdLevel: (!targetIsEnemy && amt > 0) ? (offer.thresholdLevel || 'none') : 'none',
    thresholdLabel: (!targetIsEnemy && amt > 0) ? (offer.thresholdLabel || '') : '',
    formula: `−${amt} ${poolLbl}${publicSuffix}`,
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
    const pl = rawObj.pool === 'mlp' ? 'mLP' : 'LP';
    const buildMsg = () => {
      if(rawObj.status === 'declined'){
        return { status: 'declined', note: `ℹ️ ${rawObj.targetName || COMBAT.targetName || 'Ziel'} hat das Schadensangebot abgelehnt.` };
      }
      const valTxt = (rawObj.prevVal !== null && rawObj.prevVal !== undefined && rawObj.newVal !== null && rawObj.newVal !== undefined)
        ? ` (${pl} ${rawObj.prevVal} → ${rawObj.newVal})`
        : '';
      return { status: 'applied', note: `✅ ${rawObj.targetName || COMBAT.targetName || 'Ziel'} hat −${toInt(rawObj.appliedAmount, 0)} ${pl} übernommen${valTxt}` };
    };
    let updated = false;
    const hitMatch = getCombatHits().find(h => h && h.offerId === oid);
    if(hitMatch){
      const { status, note } = buildMsg();
      hitMatch.offerStatus = status;
      hitMatch.offerNote = note;
      syncLegacyCombatFields();
      toast(note);
      updated = true;
    }
    if(COMBAT.combinedOfferId && COMBAT.combinedOfferId === oid){
      const { status, note } = buildMsg();
      COMBAT.combinedOfferStatus = status;
      COMBAT.combinedOfferNote = note;
      if(!updated) toast(note);
      updated = true;
    }
    if(updated && D.open) renderDice();
  }
}

export async function applyCombatDamageDirectly(hitIdx = 0){
  if(!COMBAT.active || !COMBAT.hitOk) return;
  const hitEntry = getCombatHit(hitIdx);
  if(hitEntry.directApplying) return;
  const hits = getCombatHits();
  const isMulti = hits.length > 1;
  const hitTag = isMulti ? ` #${hitEntry.rollIdx || (toInt(hitIdx, 0) + 1)}` : '';
  const tid = String(COMBAT.targetCharId || '').trim();
  if(!tid){
    toast('Kein Ziel-Charakter ausgewählt.');
    return;
  }
  if(!canDirectApplyCombatDamage(tid)){
    toast('🔒 Nur Spielleitung, Admin oder Besitzer dürfen direkt am Bogen abziehen.');
    return;
  }
  const calc = calculateCombatDamage(hitEntry);
  if(calc.finalDmg <= 0){
    toast('Endschaden ist 0 – kein Abzug nötig.');
    return;
  }
  const resKey = calc.pool === 'mlp' ? 'mlpCurrent' : 'lpCurrent';
  const isLob = isLobbyNeutralDice();
  const atkName = COMBAT.attackerName || (isLob ? (CLOUD.currentUser || 'Gast') : (String(S.profile?.name || '').trim() || 'Unbenannter Held'));
  const logText = `💥 Schaden${hitTag} (SL-Direktabzug • ${atkName}, ${calc.weaponName}, ${calc.fullZoneName}): −${calc.finalDmg} ${calc.poolLbl}${calc.isCrit ? ' [★ Krit +2]' : ''}${calc.threshold.label ? ` [${calc.threshold.label}]` : ''}`;

  hitEntry.directApplying = true;
  syncLegacyCombatFields();
  renderDice();
  const res = await applyCloudResourceDelta(tid, { [resKey]: -calc.finalDmg }, logText);
  hitEntry.directApplying = false;

  if(!res.ok){
    syncLegacyCombatFields();
    toast(`⚠️ ${res.error || 'Direkt-Abzug fehlgeschlagen.'}`);
    renderDice();
    return;
  }
  const prevVal = res.before?.[resKey];
  const newVal = res.after?.[resKey] ?? res.secondary?.[resKey];
  const targetIsEnemy = isEnemySheet(tid);
  const valTxt = (prevVal !== undefined && newVal !== undefined) ? `${calc.poolLbl} ${prevVal} → ${newVal}` : `−${calc.finalDmg} ${calc.poolLbl}`;
  const publicValTxt = targetIsEnemy ? `−${calc.finalDmg} ${calc.poolLbl}` : valTxt;
  hitEntry.directAppliedNote = `✅ ${calc.targetName || 'Ziel'}: ${valTxt}`;
  if(hitEntry.offerId){
    sendLiveBroadcast({
      type: 'combat_damage_applied',
      status: 'applied',
      offerId: hitEntry.offerId,
      campaignId: getActiveDiceCampaignId(),
      targetCharId: tid,
      targetName: calc.targetName || 'Ziel',
      pool: calc.pool,
      appliedAmount: calc.finalDmg,
      prevVal: targetIsEnemy ? null : prevVal,
      newVal: targetIsEnemy ? null : newVal,
      responderName: String(CLOUD.currentUser || 'SL').trim(),
      senderTabId: LIVE_TAB_ID,
      tsMs: Date.now()
    });
    hitEntry.offerStatus = 'applied';
    hitEntry.offerNote = hitEntry.directAppliedNote;
  }
  syncLegacyCombatFields();
  publishLiveRoll({
    id: uid(),
    tsMs: Date.now(),
    ts: new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    senderTabId: LIVE_TAB_ID,
    charId: isLob ? '' : (S.charId || ''),
    charName: atkName,
    playerName: isLob ? '' : (isEnemySheet(S) ? 'SL' : String(CLOUD.currentUser || S.owner || '').trim()),
    campaignId: getActiveDiceCampaignId(),
    vsCharId: tid,
    vsCharName: calc.targetName || 'Ziel',
    label: `⚡ Schaden${hitTag} angewendet: ${calc.targetName || 'Ziel'} (${calc.fullZoneName}) • ${publicValTxt}`,
    isDamage: true,
    isCrit: calc.isCrit,
    critBonus: calc.critBonus,
    finalDmg: calc.finalDmg,
    pool: calc.pool,
    hzZone: calc.fullZoneName,
    dmgTypeLabel: calc.selOpt.shortLabel || calc.selOpt.label || 'Schaden',
    thresholdLevel: targetIsEnemy ? 'none' : calc.threshold.level,
    thresholdLabel: targetIsEnemy ? '' : calc.threshold.label,
    formula: targetIsEnemy ? `${buildHiddenEnemyDmgFormula(calc)}` : `${calc.formula} • ${valTxt}`,
    armorDetail: targetIsEnemy ? '' : calc.armor.detailText,
    th: 100,
    chance: 100,
    res: [{ r: calc.finalDmg, ok: true, crit: calc.isCrit, eg: calc.eg, meg: 0 }]
  });
  toast(`⚡ Direkt abgezogen${hitTag} – ${calc.targetName || 'Ziel'}: ${valTxt}`);
  renderDice();
}

export async function applyCombinedCombatDamageDirectly(){
  const hits = getCombatHits();
  if(!COMBAT.active || !COMBAT.hitOk || !hits.length || COMBAT.combinedDirectApplying) return;
  if(hits.length === 1){
    await applyCombatDamageDirectly(0);
    return;
  }
  const tid = String(COMBAT.targetCharId || '').trim();
  if(!tid){
    toast('Kein Ziel-Charakter ausgewählt.');
    return;
  }
  if(!canDirectApplyCombatDamage(tid)){
    toast('🔒 Nur Spielleitung, Admin oder Besitzer dürfen direkt am Bogen abziehen.');
    return;
  }
  const calcs = hits.map(h => calculateCombatDamage(h));
  const lpSum = calcs.filter(c => c.pool === 'lp').reduce((s, c) => s + c.finalDmg, 0);
  const mlpSum = calcs.filter(c => c.pool === 'mlp').reduce((s, c) => s + c.finalDmg, 0);
  if(lpSum <= 0 && mlpSum <= 0){
    toast('Gesamtschaden ist 0 – kein Abzug nötig.');
    return;
  }
  const deltas = {};
  if(lpSum > 0) deltas.lpCurrent = -lpSum;
  if(mlpSum > 0) deltas.mlpCurrent = -mlpSum;
  const isLob = isLobbyNeutralDice();
  const atkName = COMBAT.attackerName || (isLob ? (CLOUD.currentUser || 'Gast') : (String(S.profile?.name || '').trim() || 'Unbenannter Held'));
  const c0 = calcs[0];
  const dmgParts = [];
  if(lpSum > 0) dmgParts.push(`−${lpSum} LP`);
  if(mlpSum > 0) dmgParts.push(`−${mlpSum} mLP`);
  const zonesTxt = calcs.map(c => `#${c.hit.rollIdx}: ${c.fullZoneName} (${c.finalDmg} ${c.poolLbl}${c.isCrit ? ' ★' : ''})`).join(', ');
  const logText = `💥 Gesamtschaden (${hits.length} Treffer, SL-Direktabzug • ${atkName}, ${c0.weaponName}): ${dmgParts.join(' / ')} [${zonesTxt}]`;

  COMBAT.combinedDirectApplying = true;
  renderDice();
  const res = await applyCloudResourceDelta(tid, deltas, logText);
  COMBAT.combinedDirectApplying = false;

  if(!res.ok){
    toast(`⚠️ ${res.error || 'Direkt-Abzug fehlgeschlagen.'}`);
    renderDice();
    return;
  }
  const targetIsEnemy = isEnemySheet(tid);
  const valParts = [];
  if(lpSum > 0){
    const prev = res.before?.lpCurrent, nxt = res.after?.lpCurrent ?? res.secondary?.lpCurrent;
    valParts.push((prev !== undefined && nxt !== undefined) ? `LP ${prev} → ${nxt}` : `−${lpSum} LP`);
  }
  if(mlpSum > 0){
    const prev = res.before?.mlpCurrent, nxt = res.after?.mlpCurrent ?? res.secondary?.mlpCurrent;
    valParts.push((prev !== undefined && nxt !== undefined) ? `mLP ${prev} → ${nxt}` : `−${mlpSum} mLP`);
  }
  const valTxt = valParts.join(' • ');
  const publicValTxt = targetIsEnemy ? dmgParts.join(' / ') : valTxt;
  COMBAT.combinedDirectAppliedNote = `✅ ${c0.targetName || 'Ziel'}: ${valTxt}`;
  publishLiveRoll({
    id: uid(),
    tsMs: Date.now(),
    ts: new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    senderTabId: LIVE_TAB_ID,
    charId: isLob ? '' : (S.charId || ''),
    charName: atkName,
    playerName: isLob ? '' : (isEnemySheet(S) ? 'SL' : String(CLOUD.currentUser || S.owner || '').trim()),
    campaignId: getActiveDiceCampaignId(),
    vsCharId: tid,
    vsCharName: c0.targetName || 'Ziel',
    label: `⚡ Gesamtschaden (${hits.length} Treffer) angewendet: ${c0.targetName || 'Ziel'} • ${publicValTxt}`,
    isDamage: true,
    isCrit: calcs.some(c => c.isCrit),
    finalDmg: lpSum + mlpSum,
    pool: lpSum > 0 ? 'lp' : 'mlp',
    hzZone: calcs.map(c => `#${c.hit.rollIdx}: ${c.fullZoneName}`).join(' • '),
    dmgTypeLabel: `${hits.length} Treffer`,
    thresholdLevel: 'none',
    thresholdLabel: '',
    formula: calcs.map(c => `#${c.hit.rollIdx}: ${targetIsEnemy ? buildHiddenEnemyDmgFormula(c) : c.formula}`).join(' | '),
    armorDetail: '',
    th: 100,
    chance: 100,
    res: calcs.map(c => ({ r: c.finalDmg, ok: c.finalDmg > 0, crit: c.isCrit, eg: c.eg, meg: 0 }))
  });
  toast(`⚡ Gesamtschaden direkt abgezogen – ${c0.targetName || 'Ziel'}: ${valTxt}`);
  renderDice();
}

export function spendCombatAmmo(hitIdx = 0){
  if(isLobbyNeutralDice()) return;
  const hitEntry = getCombatHit(hitIdx);
  const weapon = COMBAT.weaponId ? (S.weapons || []).find(w => w.id === COMBAT.weaponId) : null;
  if(weapon && hasActiveMagazines(weapon)){
    fireWeaponMagazineShot(weapon.id, { fromCombat: true });
    hitEntry.ammoSpent = true;
    syncLegacyCombatFields();
    return;
  }
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
  hitEntry.ammoSpent = true;
  syncLegacyCombatFields();
  logChron(`🏹 Munition verbraucht: −1 ${am.name || 'Munition'} (Rest: ${am.qty}).`);
  hooks.syncLinkedAmmoDOM?.(am.id, null);
  save();
  toast(`🏹 −1 ${am.name || 'Munition'} verbraucht (Vorrat: ${am.qty})`);
  renderDice();
}

function renderSingleCombatHitBodyHtml(hitEntry, hitIdx, isMulti){
  const calc = calculateCombatDamage(hitEntry);
  const hideTarget = Boolean(COMBAT.targetCharId && shouldHideOpponentDetails(COMBAT.targetCharId, getActiveDiceCampaignId()));
  const targetIsEnemy = Boolean(COMBAT.targetCharId && isEnemySheet(COMBAT.targetCharId));
  const th = calc.threshold;
  const thCls = th.level === 'heavy'
    ? 'border-rose-500 bg-rose-500/20 text-rose-200'
    : th.level === 'medium'
      ? 'border-orange-400 bg-orange-500/20 text-orange-200'
      : th.level === 'light'
        ? 'border-amber-400 bg-amber-500/20 text-amber-200'
        : 'bdr-line bg-black/20 t-mut';
  const hiAttr = `data-hit-idx="${hitIdx}"`;

  const zoneBtnsHtml = calc.hitZones.map(z => {
    const zn = String(z.zone || '').trim();
    const act = zn.toLowerCase() === calc.zoneName.toLowerCase();
    return `<button type="button" data-action="combat-set-zone" ${hiAttr} data-zone="${esc(zn)}" data-tip="Trefferzone ${esc(zn)} (${esc(z.range || '')}${z.size ? ', ' + esc(z.size) : ''})" class="btn py-1 px-2 text-[11px] font-extrabold ${act ? 'btn-pri' : 'opacity-85 hover:opacity-100'}">${esc(zn)}${z.range ? ` <span class="text-[9px] opacity-75 tabular">(${esc(z.range)})</span>` : ''}</button>`;
  }).join('');

  const dmgTypeBtnsHtml = calc.opts.map(o => {
    const act = o.key === calc.selOpt.key;
    return `<button type="button" data-action="combat-set-dmgtype" ${hiAttr} data-dmgtype="${esc(o.key)}" class="btn py-1 px-2 text-[11px] font-extrabold tabular ${act ? 'btn-pri' : 'opacity-85 hover:opacity-100'}">${esc(o.shortLabel || o.label)} <span class="opacity-80">+${o.val}</span></button>`;
  }).join('');

  const shieldBlockBtnsHtml = (!hideTarget && calc.targetShields && calc.targetShields.length)
    ? calc.targetShields.map(sh => {
        const act = hitEntry.blockShieldId === sh.id;
        const shName = String(sh.name || '').trim() || 'Schild';
        const sp = calcArmorPieceProtection(sh, calc.selOpt, calc.pool);
        return `<button type="button" data-action="combat-set-block-shield" ${hiAttr} data-id="${esc(sh.id)}" data-tip="Addiert den Schild-Rüstungswert (+${sp.total} ${calc.pool === 'mlp' ? 'mRS' : 'RS'}) zur normalen Zonenrüstung" class="btn py-1 px-2.5 text-[11px] font-extrabold tabular ${act ? 'border-cyan-400 bg-cyan-500/25 text-cyan-100' : 'opacity-80 hover:opacity-100'}">${act ? '☑' : '☐'} 🛡️ ${esc(shName)} (+${sp.total} ${calc.pool === 'mlp' ? 'mRS' : 'RS'})</button>`;
      }).join('')
    : '';

  const blockToggleHtml = hitEntry.isBlocked
    ? `<div class="flex flex-wrap items-center gap-1.5">
        ${shieldBlockBtnsHtml}
        <button type="button" data-action="combat-toggle-block-red" ${hiAttr} class="btn py-1 px-2.5 text-[11px] font-extrabold ${(hitEntry.blockItemRed && !calc.blockShield) ? 'border-amber-400 bg-amber-500/20 text-amber-200' : 'opacity-80'}">${(hitEntry.blockItemRed && !calc.blockShield) ? '☑' : '☐'} ⚔️ Blockfähige Waffe (−2 Schaden)</button>
        ${calc.durchschlagX ? `<span class="px-2 py-1 rounded-lg border text-[10px] font-black tabular ${calc.durchschlagApplied ? 'border-cyan-400 bg-cyan-500/25 text-cyan-200' : 'border-cyan-400/35 bg-cyan-500/10 text-cyan-300/80'}">⚡ Durchschlag (${calc.durchschlagX})${calc.durchschlagApplied ? ' AKTIV!' : ''}</span>` : ''}
      </div>`
    : '';

  const critBannerHtml = calc.isCrit
    ? `<div class="text-[11px] font-black px-2.5 py-1 rounded-lg border border-amber-400/75 bg-amber-500/20 text-amber-200 tabular">★ Kritischer Erfolg beim Trefferwurf: +${calc.critBonus} Extraschaden aktiv!</div>`
    : '';

  const blockedBannerHtml = hitEntry.isBlocked
    ? `<div class="text-[11px] font-extrabold px-2.5 py-1.5 rounded-lg border border-amber-400/65 bg-amber-500/15 text-amber-200 leading-snug">
        🛡️ ${hitEntry.blockReason === 'nicht_parierbar'
          ? '„Nicht parierbar“ – Parade zählt als Blocken'
          : 'Erfolgreich geblockt'}: statisch <strong class="text-white">3 EG</strong> (kein kritischer Treffer) • Verteidiger bestimmt die geblockte Trefferzone${calc.blockShield && !hideTarget ? ` (inkl. 🛡️ ${esc(calc.blockShield.name || 'Schild')} + Zonenrüstung)` : (hitEntry.blockItemRed ? ' (inkl. −2 Schaden durch blockfähige Waffe + Zonenrüstung)' : ' (+ dahinterliegende Rüstung)')}.
      </div>`
    : '';

  const verheerendHtml = calc.verheerendX
    ? `<div class="text-[10px] font-extrabold px-2 py-1 rounded-lg border tabular ${calc.verheerendBonus ? 'border-orange-400/60 bg-orange-500/20 text-orange-200' : 'bdr-line bg-black/20 t-mut'}">🔥 Verheerend (${calc.verheerendX}): ${calc.verheerendBonus ? `+${calc.verheerendBonus} Schaden aktiv (${calc.eg} ≥ 5 EG)` : `inaktiv (${calc.eg} < 5 EG)`}</div>`
    : '';

  const mehrfachschussHtml = calc.mehrfachschussX
    ? `<div class="text-[10px] font-extrabold px-2 py-1 rounded-lg border tabular ${calc.mehrfachschussBonus ? 'border-amber-400/60 bg-amber-500/20 text-amber-200' : 'bdr-line bg-black/20 t-mut'}">🏹 Mehrfachschuss (${calc.mehrfachschussX}): ${calc.mehrfachschussBonus ? `+${calc.mehrfachschussBonus} Schaden aktiv (⌊${calc.eg} / ${calc.mehrfachschussX}⌋)` : `inaktiv (${calc.eg} < ${calc.mehrfachschussX} EG)`}</div>`
    : '';

  const isMlpPool = calc.pool === 'mlp';
  const armorRowsHtml = calc.armor.pieces.length
    ? calc.armor.pieces.map(p => {
        if(p.isShieldBlock){
          return `<div class="flex items-center justify-between gap-2 text-[11px] tabular min-w-0 px-1.5 py-0.5 -mx-1.5 rounded bg-cyan-500/15 border border-cyan-400/35"><span class="truncate font-extrabold text-cyan-200">${esc(p.name)}</span><span class="text-cyan-200/90 shrink-0">${p.grp ? `gRP ${p.grp} + ` : ''}${esc(p.specDesc)} = <strong class="text-cyan-200">+${p.total}</strong></span></div>`;
        }
        return `<div class="flex items-center justify-between gap-2 text-[11px] tabular min-w-0"><span class="truncate font-bold">${esc(p.name)}</span><span class="t-mut shrink-0">${p.grp ? `gRP ${p.grp} + ` : ''}${esc(p.specDesc)} = <strong class="${isMlpPool ? 'text-indigo-300' : 'text-emerald-300'}">${p.total}</strong></span></div>`;
      }).join('')
    : `<div class="text-[11px] t-mut">${calc.targetSheet ? (isMlpPool ? 'Keine angelegte Rüstung bietet mentalen Schutz (mRS).' : `Keine angelegte Rüstung deckt „${esc(calc.zoneName)}“ ab.`) : 'Kein Ziel-Charakterbogen gewählt (Rüstung über ± manuell anpassbar).'}</div>`;

  const armorSectionHtml = hideTarget
    ? `<div class="p-2 rounded-lg bg-black/25 border bdr-line flex items-center justify-between gap-2 text-[11px] t-mut min-w-0">
        <span class="font-bold ${isMlpPool ? 'text-indigo-300/90' : 'text-emerald-300/90'}">${isMlpPool ? '🧠 Mentale Rüstung' : `🛡️ Rüstung (${esc(calc.fullZoneName)})`}</span>
        <span class="text-[10px] font-semibold">🔒 Automatisch verrechnet (Details verborgen)</span>
      </div>`
    : `<div class="p-2 rounded-lg bg-black/25 border ${calc.blockShield ? 'border-cyan-400/45' : (isMlpPool ? 'border-indigo-400/35' : 'bdr-line')} space-y-1 min-w-0">
        <div class="flex items-center justify-between gap-2 text-[10px] font-extrabold">
          <span class="${isMlpPool ? 'text-indigo-300' : 'text-emerald-300'} uppercase tracking-wider">${isMlpPool ? '🧠 Mentale Rüstung (global)' : `🛡️ Rüstung (${esc(calc.fullZoneName)} • ${esc(calc.selOpt.shortLabel || calc.selOpt.label)})`}${calc.blockShield ? ' <span class="text-cyan-300">+ Schild</span>' : ''}</span>
          <span class="${isMlpPool ? 'text-indigo-300' : 'text-emerald-300'} tabular">Gesamt: ${calc.armor.total}</span>
        </div>
        ${armorRowsHtml}
        ${calc.armor.globalMod ? `<div class="flex items-center justify-between gap-2 text-[11px] tabular"><span class="t-mut">Aktive Effekte (${isMlpPool ? 'Mentale Rüstung' : 'Rüstungsschutz'})</span><span class="font-bold ${isMlpPool ? 'text-indigo-300' : 'text-emerald-300'}">${fmtSign(calc.armor.globalMod)}</span></div>` : ''}
        ${calc.armor.manualMod ? `<div class="flex items-center justify-between gap-2 text-[11px] tabular"><span class="t-mut">Manueller Rüstungs-Mod</span><span class="font-bold">${fmtSign(calc.armor.manualMod)}</span></div>` : ''}
      </div>`;

  const subZoneSectionHtml = (!isMlpPool && calc.subZones && calc.subZones.length)
    ? (() => {
        const hasPart = calc.partialArmors && calc.partialArmors.length > 0;
        const partNames = hasPart ? calc.partialArmors.map(p => `${p.name} (${p.matchedSubs.join(', ')})`).join(' • ') : '';
        const warnHtml = (hasPart && !calc.subZoneName)
          ? `<div class="p-1.5 px-2 rounded-lg border border-amber-400/60 bg-amber-500/15 text-[10px] font-extrabold text-amber-200 flex flex-wrap items-center justify-between gap-1.5">
              <span>🛡️ Teilrüstung aktiv${hideTarget ? '' : `: ${esc(partNames)}`} – Detailzone bestimmen!</span>
              <button type="button" data-action="combat-roll-subhz" ${hiAttr} class="btn py-0.5 px-2 text-[10px] font-black bg-amber-500 text-slate-950 border-amber-300">🔍 Detail-W100</button>
            </div>`
          : '';
        const subBtns = [
          `<button type="button" data-action="combat-set-subzone" ${hiAttr} data-subzone="" class="btn py-0.5 px-2 text-[10px] font-extrabold ${!calc.subZoneName ? 'btn-pri' : 'opacity-80 hover:opacity-100'}">Allgemein</button>`,
          ...calc.subZones.map(sz => {
            const sn = String(sz.zone || '').trim();
            const act = sn.toLowerCase() === calc.subZoneName.toLowerCase();
            return `<button type="button" data-action="combat-set-subzone" ${hiAttr} data-subzone="${esc(sn)}" data-tip="Detailzone ${esc(calc.zoneName)} → ${esc(sn)} (${esc(sz.range || '')})" class="btn py-0.5 px-2 text-[10px] font-extrabold ${act ? 'btn-pri' : 'opacity-80 hover:opacity-100'}">${esc(sn)}${sz.range ? ` <span class="text-[9px] opacity-75 tabular">(${esc(sz.range)})</span>` : ''}</button>`;
          })
        ].join('');
        return `<div class="pt-1.5 border-t border-white/10 space-y-1.5 min-w-0">
          ${warnHtml}
          <div class="flex flex-wrap items-center justify-between gap-1.5">
            <span class="text-[10px] font-extrabold t-mut uppercase tracking-wider">🔍 Detailzone (${esc(calc.zoneName)})${hitEntry.lastSubHzRoll !== null ? ` • W100 = <strong class="text-cyan-300">${hitEntry.lastSubHzRoll}</strong>` : ''}</span>
            <button type="button" data-action="combat-roll-subhz" ${hiAttr} data-tip="Würfelt per W100 genau aus, welcher Bereich von „${esc(calc.zoneName)}“ getroffen wird" class="btn py-0.5 px-2 text-[10px] font-extrabold border-cyan-400/55 bg-cyan-500/15 text-cyan-200 hover:bg-cyan-500/25">🔍 Genau würfeln</button>
          </div>
          <div class="flex flex-wrap gap-1 min-w-0">${subBtns}</div>
        </div>`;
      })()
    : '';

  const thresholdSectionHtml = hideTarget
    ? `<div class="inline-flex flex-wrap items-center justify-center gap-1 px-2.5 py-1 rounded-lg border bdr-line bg-black/20 t-mut text-[10px] font-bold max-w-full">🔒 Verwundungsschwellen des Gegners verborgen (SL sieht Details im Schadensangebot)</div>`
    : `<div class="inline-flex flex-wrap items-center justify-center gap-1 px-2.5 py-1 rounded-lg border text-[11px] font-extrabold max-w-full ${thCls}">
        ${th.label ? `<span>${esc(th.label)}</span>` : `<span>✓ Keine ${th.kindWord}sschwelle erreicht</span>`}
        <span class="opacity-75 text-[10px]">(Schwelle: ≥ ${th.light} / ≥ ${th.medium} / ≥ ${th.heavy})</span>
      </div>${calc.dmgCapped ? `<div class="text-[10px] font-extrabold text-amber-300 tabular">🛡️ Max. ${calc.poolLbl}-Verlust gedeckelt: ${calc.uncappedDmg} → <strong>${calc.maxDmgCap} ${calc.poolLbl}</strong> (${calc.pool === 'mlp' ? 'Schwere Traumaschwelle' : 'Schwere Verwundungsschwelle'})</div>` : ''}`;

  const canDirect = canDirectApplyCombatDamage(COMBAT.targetCharId);
  const magInfo = (calc.weapon && hasActiveMagazines(calc.weapon)) ? getWeaponNextShotInfo(calc.weapon, S) : null;
  const ammoBtnHtml = magInfo
    ? `<div class="flex flex-wrap items-center gap-1.5">
        <button type="button" data-action="combat-spend-ammo" ${hiAttr} ${magInfo.count <= 0 ? 'disabled' : ''} class="btn flex-1 min-w-[160px] py-1.5 px-3 text-xs font-extrabold ${hitEntry.ammoSpent ? 'border-emerald-400/60 bg-emerald-500/15 text-emerald-200' : 'border-amber-400/50 bg-amber-500/10 text-amber-200 hover:bg-amber-500/20'}">${hitEntry.ammoSpent ? `✓ Abgefeuert • ${esc(magInfo.mag?.name || 'Magazin')}: ${magInfo.count}/${magInfo.cap}` : `🏹 −1 Schuss (${esc(magInfo.mag?.name || 'Magazin')}: ${magInfo.count}/${magInfo.cap}${magInfo.isOverride ? ` • ★ ${esc(calc.ammoName)}` : ''})`}</button>
        <button type="button" data-action="wp-mag-reload" data-wid="${esc(calc.weapon.id)}" ${!magInfo.nextReloadMag ? 'disabled' : ''} class="btn py-1.5 px-2.5 text-xs font-black shrink-0 ${magInfo.count === 0 && magInfo.nextReloadMag ? 'btn-ok' : 'bdr-acc bg-acc-soft text-acc'}">🔄 Nachladen</button>
      </div>`
    : (calc.ammo
      ? `<button type="button" data-action="combat-spend-ammo" ${hiAttr} ${toInt(calc.ammo.qty, 0) <= 0 ? 'disabled' : ''} class="btn w-full py-1.5 px-3 text-xs font-extrabold ${hitEntry.ammoSpent ? 'border-emerald-400/60 bg-emerald-500/15 text-emerald-200' : 'border-amber-400/50 bg-amber-500/10 text-amber-200 hover:bg-amber-500/20'}">${hitEntry.ammoSpent ? `✓ −1 ${esc(calc.ammoName)} verbraucht (Vorrat: ${toInt(calc.ammo.qty, 0)})` : `🏹 −1 ${esc(calc.ammoName)} verbrauchen (Vorrat: ${toInt(calc.ammo.qty, 0)})`}</button>`
      : '');

  const applyActionsHtml = COMBAT.targetCharId
    ? `<div class="space-y-1.5 pt-1 border-t border-white/10">
        <div class="grid grid-cols-1 ${canDirect ? 'sm:grid-cols-2' : ''} gap-1.5">
          <button type="button" data-action="combat-send-offer" ${hiAttr} ${calc.finalDmg <= 0 ? 'disabled' : ''} data-tip="Sendet ein Live-Aktionsbanner an ${targetIsEnemy ? 'die Spielleitung' : 'den Spieler von ' + esc(calc.targetName || 'Ziel')}, um den Schaden zu übernehmen" class="btn py-1.5 px-2.5 text-xs font-black border-rose-400/60 bg-rose-500/20 text-rose-100 hover:bg-rose-500/30">${targetIsEnemy ? '💥 Schaden an SL senden' : '💥 Schaden an Ziel senden'}</button>
          ${canDirect ? `<button type="button" data-action="combat-apply-direct" ${hiAttr} ${(calc.finalDmg <= 0 || hitEntry.directApplying) ? 'disabled' : ''} data-tip="Zieht den Schaden über den atomaren Server-Endpunkt direkt am Bogen ab (ideal für Gegner/NSCs)" class="btn py-1.5 px-2.5 text-xs font-black border-amber-400/65 bg-amber-500/20 text-amber-200 hover:bg-amber-500/30">${hitEntry.directApplying ? '⏳ Wende an...' : '⚡ Direkt abziehen (SL)'}</button>` : ''}
        </div>
        ${hitEntry.offerNote ? `<div class="text-[11px] font-extrabold px-2.5 py-1.5 rounded-lg border break-words ${hitEntry.offerStatus === 'applied' ? 'border-emerald-400/60 bg-emerald-500/15 text-emerald-200' : hitEntry.offerStatus === 'declined' ? 'border-amber-400/50 bg-amber-500/10 text-amber-200' : 'border-indigo-400/50 bg-indigo-500/15 text-indigo-200'}">${esc(hitEntry.offerNote)}</div>` : ''}
        ${(hitEntry.directAppliedNote && hitEntry.directAppliedNote !== hitEntry.offerNote) ? `<div class="text-[11px] font-extrabold px-2.5 py-1.5 rounded-lg border border-emerald-400/60 bg-emerald-500/15 text-emerald-200 break-words">${esc(hitEntry.directAppliedNote)}</div>` : ''}
      </div>`
    : '';

  const rawMismatchItem = (!calc.weaponApplies) ? (calc.rawWeapon || calc.rawShield) : null;
  const wpMismatchBanner = rawMismatchItem
    ? `<div class="p-2 rounded-lg border border-amber-400/55 bg-amber-500/12 text-[11px] flex flex-wrap items-center justify-between gap-1.5">
        <span class="font-bold text-amber-200 min-w-0">⚠️ <strong>${esc(String(rawMismatchItem.name || '').trim() || (calc.rawShield ? 'Schild' : getWeaponSubtype(rawMismatchItem.wType).label))}</strong> gilt nur für ${rawMismatchItem.dmgPool === 'mlp' ? '🧠 mLP' : '❤️ LP'} – Schaden &amp; Tags pausiert.</span>
        <button type="button" data-action="${calc.rawShield ? 'set-ar-dmgpool' : 'dice-wp-set-pool'}" data-id="${esc(rawMismatchItem.id)}" data-pool="both" class="btn py-0.5 px-2 text-[10px] font-black border-purple-400/60 bg-purple-500/20 text-purple-200 shrink-0">Für Beide freigeben</button>
      </div>`
    : '';

  const bodyInner = `
    <div class="text-[11px] t-mut flex flex-wrap items-center gap-x-2 gap-y-0.5 tabular">
      <span>${isMlpPool ? '🧠' : (calc.atkShield ? '🛡️' : '🗡️')} <strong>${esc(calc.weaponName)}</strong>${calc.ammoName ? ` + 🎯 ${esc(calc.ammoName)}` : ''}</span>
      <span>•</span>
      <span>Grundschaden: <strong class="text-emerald-300">${calc.eg} EG</strong>${calc.isCrit ? ' <strong class="text-amber-300">+ 2 Krit</strong>' : ''}${hitEntry.isBlocked ? ' <span class="text-amber-300">(Geblockt • kein Krit)</span>' : ''}</span>
    </div>
    ${critBannerHtml}
    ${blockedBannerHtml}
    ${wpMismatchBanner}

    <div class="space-y-1.5 pt-1.5 border-t border-white/10 min-w-0">
      <div class="flex flex-wrap items-center justify-between gap-1.5">
        <span class="text-[10px] font-extrabold t-mut uppercase tracking-wider">🎯 Trefferzone${hitEntry.aimedZone&&!hitEntry.isBlocked?` <span class="normal-case px-1.5 py-0.5 rounded bg-cyan-500/20 border border-cyan-400/50 text-cyan-200 font-black">Gezielt: ${esc(hitEntry.aimedZone)}</span>`:''}${isMlpPool ? ' <span class="font-semibold normal-case text-indigo-300/80">(bei mLP optional – mRS wirkt global)</span>' : ''}${hitEntry.lastHzRoll !== null ? ` • W100 = <strong class="text-amber-300">${hitEntry.lastHzRoll}</strong>` : ''}</span>
        <button type="button" data-action="combat-roll-hz" ${hiAttr} class="btn py-0.5 px-2 text-[11px] font-extrabold border-amber-400/55 bg-amber-500/15 text-amber-200 hover:bg-amber-500/25">🎯 Trefferzone auswürfeln</button>
      </div>
      <div class="flex flex-wrap gap-1 min-w-0">${zoneBtnsHtml}</div>
      ${subZoneSectionHtml}
    </div>

    <div class="space-y-1.5 pt-1.5 border-t border-white/10 min-w-0">
      <div class="flex flex-wrap items-center justify-between gap-1.5">
        <span class="text-[10px] font-extrabold t-mut uppercase tracking-wider">⚔️ Schadensart &amp; Waffenschaden</span>
        <div class="inline-flex rounded-lg p-0.5 bg-black/25 border bdr-line text-[10px]">
          <button type="button" data-action="combat-set-pool" ${hiAttr} data-pool="lp" class="px-2 py-0.5 rounded font-black ${calc.pool === 'lp' ? 'bg-rose-500/30 text-rose-200' : 't-mut'}">❤️ LP</button>
          <button type="button" data-action="combat-set-pool" ${hiAttr} data-pool="mlp" class="px-2 py-0.5 rounded font-black ${calc.pool === 'mlp' ? 'bg-purple-500/30 text-purple-200' : 't-mut'}">🧠 mLP</button>
        </div>
      </div>
      <div class="flex flex-wrap gap-1 min-w-0">${dmgTypeBtnsHtml}</div>
      ${verheerendHtml}
      ${mehrfachschussHtml}
      ${blockToggleHtml}
    </div>

    <div class="grid ${hideTarget ? 'grid-cols-1' : 'grid-cols-2'} gap-2 pt-1.5 border-t border-white/10 tabular">
      <div class="subcard p-1.5 flex items-center justify-between gap-1 min-w-0">
        <span class="text-[10px] font-extrabold t-mut truncate">Schaden ±</span>
        <div class="flex items-center gap-1 shrink-0">
          <button type="button" data-action="combat-dmg-step" ${hiAttr} data-d="-1" class="btn w-6 h-6 p-0 text-xs font-black">−</button>
          <span class="text-xs font-black min-w-[24px] text-center ${calc.dmgMod > 0 ? 'text-rose-300' : calc.dmgMod < 0 ? 'text-emerald-300' : ''}">${fmtSign(calc.dmgMod)}</span>
          <button type="button" data-action="combat-dmg-step" ${hiAttr} data-d="1" class="btn w-6 h-6 p-0 text-xs font-black">+</button>
        </div>
      </div>
      ${hideTarget ? '' : `<div class="subcard p-1.5 flex items-center justify-between gap-1 min-w-0">
        <span class="text-[10px] font-extrabold t-mut truncate">Rüstung ±</span>
        <div class="flex items-center gap-1 shrink-0">
          <button type="button" data-action="combat-armor-step" ${hiAttr} data-d="-1" class="btn w-6 h-6 p-0 text-xs font-black">−</button>
          <span class="text-xs font-black min-w-[24px] text-center ${calc.armor.manualMod > 0 ? 'text-emerald-300' : calc.armor.manualMod < 0 ? 'text-rose-300' : ''}">${fmtSign(calc.armor.manualMod)}</span>
          <button type="button" data-action="combat-armor-step" ${hiAttr} data-d="1" class="btn w-6 h-6 p-0 text-xs font-black">+</button>
        </div>
      </div>`}
    </div>

    ${armorSectionHtml}

    <div class="p-2.5 rounded-xl border-2 ${calc.isCrit ? 'border-amber-400/80 bg-amber-500/12' : calc.finalDmg > 0 ? 'border-rose-500/70 bg-rose-500/15' : 'border-emerald-500/50 bg-emerald-500/10'} text-center space-y-1.5 tabular">
      <div class="text-[11px] t-mut break-words">${esc(hideTarget ? buildHiddenEnemyDmgFormula(calc) : calc.formula)}</div>
      <div class="text-2xl sm:text-3xl font-black ${calc.finalDmg > 0 ? 'text-rose-300' : 'text-emerald-300'}">💥 ${calc.finalDmg} ${calc.poolLbl} Endschaden</div>
      ${thresholdSectionHtml}
    </div>

    ${ammoBtnHtml}
    ${applyActionsHtml}
    <button type="button" data-action="combat-post-feed" ${hiAttr} class="btn ${hitEntry.posted ? 'btn-ok' : 'btn-pri'} w-full py-1.5 px-3 text-xs font-black">${hitEntry.posted ? '✓ Im Live-Feed gepostet (erneut senden)' : (isMulti ? `📡 Treffer #${hitEntry.rollIdx || (hitIdx + 1)} in Live-Feed posten` : '📡 Schaden in Live-Feed posten')}</button>
  `;

  if(!isMulti) return { calc, html: bodyInner };

  const rollLbl = hitEntry.rollVal ? `Wurf ${hitEntry.rollVal}` : '';
  const hitHdr = `<div class="flex items-center justify-between gap-2 min-w-0">
    <button type="button" data-action="combat-hit-toggle-collapse" ${hiAttr} class="flex flex-wrap items-center gap-1.5 text-left min-w-0 flex-1 cursor-pointer">
      <span class="text-xs font-black text-rose-400 w-3 shrink-0">${hitEntry.collapsed ? '▸' : '▾'}</span>
      <span class="text-xs font-black text-rose-200">Treffer #${hitEntry.rollIdx || (hitIdx + 1)}</span>
      ${rollLbl ? `<span class="text-[10px] font-bold t-mut tabular">(${rollLbl} • ${calc.eg} EG)</span>` : ''}
      ${hitEntry.isBlocked ? `<span class="px-1.5 py-0.2 rounded text-[10px] font-black bg-amber-500/25 text-amber-200 border border-amber-400/50 shrink-0">🛡️ GEBLOCKT (3 EG)</span>` : ''}
      ${calc.isCrit ? `<span class="px-1.5 py-0.2 rounded text-[10px] font-black bg-amber-500 text-slate-950 shrink-0">★ KRIT +2</span>` : ''}
      <span class="text-[10px] font-bold text-acc truncate">🎯 ${esc(calc.fullZoneName)}</span>
    </button>
    <span class="px-2 py-0.5 rounded-md bg-rose-600/85 text-white text-[11px] font-black tabular shrink-0">${calc.finalDmg} ${calc.poolLbl}</span>
  </div>`;

  return {
    calc,
    html: `<div class="rounded-xl p-2.5 border ${calc.isCrit ? 'border-amber-400/65 bg-amber-500/5' : 'bdr-line bg-black/20'} space-y-2 min-w-0">
      ${hitHdr}
      ${hitEntry.collapsed ? '' : `<div class="space-y-2.5 pt-1.5 border-t border-white/10 min-w-0">${bodyInner}</div>`}
    </div>`
  };
}

export function renderCombatDamageBox(){
  if(!COMBAT.active || !COMBAT.hitOk) return '';
  const hits = getCombatHits();
  const effHits = hits.length ? hits : [COMBAT];
  const isMulti = effHits.length > 1;
  const rendered = effHits.map((h, idx) => renderSingleCombatHitBodyHtml(h, idx, isMulti));
  const calcs = rendered.map(r => r.calc);
  const c0 = calcs[0];
  const targetIsEnemy = Boolean(COMBAT.targetCharId && isEnemySheet(COMBAT.targetCharId));
  const lpTotal = calcs.filter(c => c.pool === 'lp').reduce((s, c) => s + c.finalDmg, 0);
  const mlpTotal = calcs.filter(c => c.pool === 'mlp').reduce((s, c) => s + c.finalDmg, 0);
  const totalBadgeTxt = (lpTotal > 0 && mlpTotal > 0)
    ? `${lpTotal} LP / ${mlpTotal} mLP`
    : (mlpTotal > 0 && lpTotal === 0)
      ? `${mlpTotal} mLP`
      : `${lpTotal} LP`;

  const hdr = `<div class="flex items-center justify-between gap-2 min-w-0">
    <button type="button" data-action="combat-toggle-collapse" class="flex items-center gap-1.5 text-left min-w-0 flex-1 cursor-pointer">
      <span class="text-xs font-black text-rose-400 w-3.5 shrink-0">${COMBAT.collapsed ? '▸' : '▾'}</span>
      <span class="text-xs font-black text-rose-300 truncate">💥 Schadens- &amp; Rüstungsrechner${isMulti ? ` (${effHits.length} Treffer)` : ''}</span>
      ${c0.targetName ? `<span class="px-1.5 py-0.2 rounded text-[10px] font-extrabold bg-indigo-500/20 text-indigo-200 border border-indigo-400/40 truncate max-w-[140px]">→ ${targetIsEnemy ? '👹 ' : ''}${esc(c0.targetName)}</span>` : ''}
    </button>
    <div class="flex items-center gap-1.5 shrink-0">
      <span class="px-2 py-0.5 rounded-md bg-rose-600/85 text-white text-[11px] font-black tabular">${isMulti ? `Σ ${totalBadgeTxt}` : `${c0.finalDmg} ${c0.poolLbl}`}</span>
      <button type="button" data-action="combat-close" aria-label="Rechner ausblenden" class="btn w-6 h-6 p-0 text-[10px] font-black">✕</button>
    </div>
  </div>`;

  if(COMBAT.collapsed){
    return `<div id="combatDamageBox" class="subcard p-2.5 border-2 border-rose-500/50 bg-rose-500/5 min-w-0">${hdr}</div>`;
  }

  if(!isMulti){
    return `<div id="combatDamageBox" class="subcard p-3 border-2 border-rose-500/50 bg-rose-500/5 space-y-2.5 min-w-0">
      ${hdr}
      ${rendered[0].html}
    </div>`;
  }

  const canDirect = canDirectApplyCombatDamage(COMBAT.targetCharId);
  const sumDmg = lpTotal + mlpTotal;
  const multiSummaryBar = `<div class="p-2.5 rounded-xl border border-rose-400/55 bg-rose-500/12 space-y-2 tabular min-w-0">
    <div class="flex flex-wrap items-center justify-between gap-2">
      <div class="text-xs font-black text-rose-200">💥 Gesamtschaden (${effHits.length} Treffer): <span class="text-base text-rose-300">${totalBadgeTxt}</span></div>
      <button type="button" data-action="combat-roll-all-hz" class="btn py-1 px-2.5 text-[11px] font-extrabold border-amber-400/60 bg-amber-500/15 text-amber-200 hover:bg-amber-500/25">🎯 Alle ${effHits.length} Zonen würfeln</button>
    </div>
    <div class="flex flex-wrap gap-1 text-[10px] font-bold">
      ${calcs.map((c, i) => `<span class="px-1.5 py-0.5 rounded border ${c.isCrit ? 'border-amber-400/70 bg-amber-500/20 text-amber-200' : 'bdr-line bg-black/30'}">#${c.hit.rollIdx || (i + 1)}: ${esc(c.fullZoneName)} → <strong class="text-rose-300">${c.finalDmg} ${c.poolLbl}</strong>${c.isCrit ? ' ★' : ''}</span>`).join('')}
    </div>
    <div class="flex flex-wrap items-center gap-1.5 pt-1 border-t border-white/10">
      ${COMBAT.targetCharId ? `<button type="button" data-action="combat-send-combined-offer" ${sumDmg <= 0 ? 'disabled' : ''} class="btn flex-1 py-1.5 px-2.5 text-xs font-black border-rose-400/60 bg-rose-500/20 text-rose-100 hover:bg-rose-500/30">${targetIsEnemy ? '💥 Gesamt an SL senden' : '💥 Gesamt an Ziel senden'}</button>` : ''}
      ${(COMBAT.targetCharId && canDirect) ? `<button type="button" data-action="combat-apply-combined-direct" ${(sumDmg <= 0 || COMBAT.combinedDirectApplying) ? 'disabled' : ''} class="btn flex-1 py-1.5 px-2.5 text-xs font-black border-amber-400/65 bg-amber-500/20 text-amber-200 hover:bg-amber-500/30">${COMBAT.combinedDirectApplying ? '⏳ Wende an...' : '⚡ Gesamt direkt abziehen (SL)'}</button>` : ''}
      <button type="button" data-action="combat-post-all-feed" class="btn ${COMBAT.combinedPosted ? 'btn-ok' : 'btn-pri'} flex-1 py-1.5 px-2.5 text-xs font-black">${COMBAT.combinedPosted ? '✓ Gesamt gepostet' : '📡 Gesamt in Live-Feed'}</button>
    </div>
    ${COMBAT.combinedOfferNote ? `<div class="text-[11px] font-extrabold px-2.5 py-1.5 rounded-lg border break-words ${COMBAT.combinedOfferStatus === 'applied' ? 'border-emerald-400/60 bg-emerald-500/15 text-emerald-200' : COMBAT.combinedOfferStatus === 'declined' ? 'border-amber-400/50 bg-amber-500/10 text-amber-200' : 'border-indigo-400/50 bg-indigo-500/15 text-indigo-200'}">${esc(COMBAT.combinedOfferNote)}</div>` : ''}
    ${(COMBAT.combinedDirectAppliedNote && COMBAT.combinedDirectAppliedNote !== COMBAT.combinedOfferNote) ? `<div class="text-[11px] font-extrabold px-2.5 py-1.5 rounded-lg border border-emerald-400/60 bg-emerald-500/15 text-emerald-200 break-words">${esc(COMBAT.combinedDirectAppliedNote)}</div>` : ''}
  </div>`;

  return `<div id="combatDamageBox" class="subcard p-3 border-2 border-rose-500/50 bg-rose-500/5 space-y-2.5 min-w-0">
    ${hdr}
    ${multiSummaryBar}
    <div class="space-y-2 min-w-0">
      ${rendered.map(r => r.html).join('')}
    </div>
  </div>`;
}
