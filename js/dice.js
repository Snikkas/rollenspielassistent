import {
  ATTRS, CRIT_SEQ, WIN_DEFAULTS, SK_RANKS
} from './constants.js';
import {
  $, uid, esc, toInt, fmtSign
} from './utils.js';
import {
  hooks
} from './ui-hooks.js';
import {
  applyWinFrame, renderWinCtrlBtns, renderWinResizeHandles, getCampaigns, isUserInCampaign, canManageCampaign, getActiveLiveCampaignId, getCampaignFilteredDiceFeed, getInitiativeCampaignsForChar, isCharInCampaignInitiative, captureScrollState, restoreScrollState, save, getWeaponSubtype, isWeaponMassiv, isWeaponBlockable, isArmorShield, S, D, LD, DUEL, diceLogs, isMobileLayout, UI, LIVE_TAB_ID, CLOUD, getCharCampaignId, isEnemySheet, getEnemyMeta, isEnemyDiceVisibleInCampaign, canSeeEnemyInDice, shouldHideOpponentDetails
} from './state.js';
import {
  calcActiveMods, getAdvDisForContext, getWeaponRollMeta, getShieldRollMeta, getSheetShields, getSheetBlockOptions, resolveCombatItemByRef, formatBlockModShort, formatBlockModLong, getWeaponDualWieldInfo, fmtAdvSrcLines, getAttrTot, getSkBonus, getCharSizeInfo, getRelativeSizeHitMod
} from './calc.js';
import {
  renderLobbyLiveDiceHtml, publishLiveRoll, formatSecretRollSummary, isSecretRollActive, getCachedForeignSheet, getForeignSheetLoadedAt, isForeignSheetLoading, getForeignSheetError, fetchForeignCharacterSheet, fetchLobbyList
} from './cloud.js';
import {
  renderDiceMagazineStripHtml
} from './magazines.js';

export const getCSkVal=()=>D.cSkill==='custom'?toInt(D.cCustom):toInt(D.cSkill);
export const getDSkVal=()=>D.dSkill==='custom'?toInt(D.dCustom):toInt(D.dSkill);
export const getEffC=()=>D.cMode==='direct'?toInt(D.cDirect):toInt(D.cAttr)+getCSkVal();
export function getActiveDiceCampaignId(){
  if(isLobbyNeutralDice()) return getActiveLiveCampaignId();
  const charId=String(S?.charId||'').trim();
  if(isEnemySheet(S)){
    const meta=getEnemyMeta(S);
    const activeIniCamps=charId?getInitiativeCampaignsForChar(charId,{activeOnly:true,visibleOnly:false}):[];
    const anyIniCamps=charId?getInitiativeCampaignsForChar(charId,{activeOnly:false,visibleOnly:false}):[];
    if(CLOUD.activeCampaignId&&(activeIniCamps.includes(CLOUD.activeCampaignId)||meta.campaignIds.includes(CLOUD.activeCampaignId))){
      return CLOUD.activeCampaignId;
    }
    if(activeIniCamps.length) return activeIniCamps[0];
    if(CLOUD.activeCampaignId&&anyIniCamps.includes(CLOUD.activeCampaignId)) return CLOUD.activeCampaignId;
    if(meta.campaignIds.length) return meta.campaignIds[0];
    if(anyIniCamps.length) return anyIniCamps[0];
    return getActiveLiveCampaignId();
  }
  const ownCamp=getCharCampaignId(charId);
  if(CLOUD.registry?.initiatives?.[ownCamp]?.active) return ownCamp;
  if(charId){
    const activeIniCamps=getInitiativeCampaignsForChar(charId,{activeOnly:true,visibleOnly:false});
    if(activeIniCamps.length){
      if(CLOUD.activeCampaignId&&activeIniCamps.includes(CLOUD.activeCampaignId)) return CLOUD.activeCampaignId;
      return activeIniCamps[0];
    }
  }
  return ownCamp;
}
export function getCampaignOpponents(){
  const activeCamp=getActiveDiceCampaignId();
  const isGm=canManageCampaign(activeCamp);
  const seen=new Set();
  const list=[];
  const pushItem=(id,name,isEnemy,diceVisible)=>{
    const cid=String(id||'').trim();
    if(!cid||seen.has(cid)) return;
    seen.add(cid);
    list.push({
      id:cid,
      name:String(name||(isEnemy?'Unbenannter Gegner':'Unbenannter Held')).trim()||(isEnemy?'Unbenannter Gegner':'Unbenannter Held'),
      isSelf:Boolean(!UI.inLobby&&S?.charId&&cid===S.charId),
      isEnemy:Boolean(isEnemy),
      diceVisible:Boolean(diceVisible)
    });
  };
  (CLOUD.list||[]).forEach(c=>{
    if(!c||!c.id||seen.has(c.id)) return;
    if(isEnemySheet(c.id)){
      if(!canSeeEnemyInDice(c.id,activeCamp)) return;
      const inIni=isCharInCampaignInitiative(c.id,activeCamp,{activeOnly:!isGm,visibleOnly:!isGm});
      pushItem(c.id,c.name,true,isEnemyDiceVisibleInCampaign(c.id,activeCamp)||inIni);
      return;
    }
    const inCamp=getCharCampaignId(c.id)===activeCamp;
    const inIni=isCharInCampaignInitiative(c.id,activeCamp,{activeOnly:!isGm,visibleOnly:!isGm});
    if(!inCamp&&!inIni) return;
    pushItem(c.id,c.name,false,true);
  });
  // Falls ein Initiative-Teilnehmer noch nicht in CLOUD.list steht, direkt aus der Initiative übernehmen
  const iniSt=CLOUD.registry?.initiatives?.[activeCamp];
  if(iniSt&&Array.isArray(iniSt.entries)&&(isGm||iniSt.active)){
    iniSt.entries.forEach(e=>{
      if(!e||!e.charId||seen.has(e.charId)) return;
      if(!isGm&&e.hidden) return;
      const isEn=Boolean(e.isEnemy||isEnemySheet(e.charId));
      pushItem(e.charId,e.name,isEn,true);
    });
  }
  if(!UI.inLobby&&S?.charId&&!seen.has(S.charId)){
    if(!isEnemySheet(S)||canSeeEnemyInDice(S.charId,activeCamp)){
      pushItem(
        S.charId,
        String(S.profile?.name||'').trim()||(isEnemySheet(S)?'Aktiver Gegner':'Aktiver Charakter'),
        isEnemySheet(S),
        isEnemySheet(S)?isEnemyDiceVisibleInCampaign(S.charId,activeCamp):true
      );
    }
  }
  return list.sort((a,b)=>{
    if(a.isEnemy!==b.isEnemy) return a.isEnemy?-1:1;
    if(a.isSelf!==b.isSelf) return a.isSelf?1:-1;
    return a.name.localeCompare(b.name,'de');
  });
}
function findOppSkillByKeywords(oppSheet,keywords){
  const skills=(oppSheet?.skills||[]).filter(s=>s&&String(s.name||'').trim());
  if(!skills.length) return null;
  for(const kw of keywords){
    const exact=skills.find(s=>{
      const low=String(s.name||'').trim().toLowerCase();
      const base=low.replace(/\s*\([^)]*\)\s*$/,'').trim();
      return low===kw||base===kw;
    });
    if(exact) return exact;
  }
  for(const kw of keywords){
    const partial=skills.find(s=>String(s.name||'').trim().toLowerCase().includes(kw));
    if(partial) return partial;
  }
  return null;
}
function findDefaultOppCombatItem(oppSheet,preset){
  if(preset==='block'){
    const {shields,blockWeapons}=getSheetBlockOptions(oppSheet);
    if(shields.length) return {kind:'shield',item:shields[0],ref:`shield:${shields[0].id}`};
    if(blockWeapons.length) return {kind:'weapon',item:blockWeapons[0],ref:blockWeapons[0].id};
    return null;
  }
  const weapons=(oppSheet?.weapons||[]).filter(Boolean);
  if(weapons.length){
    const melee=weapons.find(w=>w.wType!=='ranged');
    const pick=melee||weapons[0];
    return {kind:'weapon',item:pick,ref:pick.id};
  }
  if(preset==='attack'){
    const shields=getSheetShields(oppSheet);
    if(shields.length) return {kind:'shield',item:shields[0],ref:`shield:${shields[0].id}`};
  }
  return null;
}
export function getDefaultOppPresetForC1Cat(c1Cat){
  if(c1Cat==='Parieren'||c1Cat==='Blocken'||c1Cat==='Ausweichen') return 'attack';
  return 'dodge';
}
export function selectDiceOpponent(charId,{force=false,silent=true}={}){
  const id=String(charId||'').trim();
  const changed=D.oppCharId!==id;
  D.oppCharId=id;
  if(changed){
    hooks.clearOutgoingDuel?.({notifyCancel:true,silent:true});
    D.oppWeaponId='';
    D.oppSkillId='';
    D.oppSitActive={};
  }
  if(id) fetchForeignCharacterSheet(id,{force,silent});
  renderDice();
}
export function activateVsCharMode(){
  D.dMode='character';
  const normCat=D.wRollCat==='Parade'?'Parieren':D.wRollCat;
  if(normCat==='Trefferwurf'){
    D.oppKind='preset';
    if(!['dodge','parry','block'].includes(D.oppPreset)) D.oppPreset='dodge';
  }else if(normCat==='Parieren'||normCat==='Blocken'||normCat==='Ausweichen'){
    D.oppKind='preset';
    D.oppPreset='attack';
  }else if(!['preset','attr','skill'].includes(D.oppKind)){
    D.oppKind='attr';
  }
  const opps=getCampaignOpponents();
  if(!opps.length&&!(CLOUD.list||[]).length){
    fetchLobbyList(true).then(()=>{
      if(D.dMode==='character'&&!D.oppCharId){
        const nextOpps=getCampaignOpponents();
        const pick=nextOpps.find(o=>!o.isSelf)||nextOpps[0];
        if(pick) selectDiceOpponent(pick.id,{force:false,silent:true});
        else if(D.open) renderDice();
      }
    });
  }else if(!D.oppCharId||!opps.some(o=>o.id===D.oppCharId)){
    const pick=opps.find(o=>!o.isSelf)||opps[0];
    if(pick){
      D.oppCharId=pick.id;
      D.oppWeaponId='';
      D.oppSkillId='';
      D.oppSitActive={};
      fetchForeignCharacterSheet(pick.id,{force:false,silent:true});
    }
  }else if(D.oppCharId){
    fetchForeignCharacterSheet(D.oppCharId,{force:false,silent:true});
  }
  applyDiceAutoAdvDis(false);
  renderDice();
}
export function resolveOpponentComparison(c1Cat='Normaler Test'){
  if(D.dMode!=='character') return null;
  const charId=String(D.oppCharId||'').trim();
  const listMatch=(CLOUD.list||[]).find(c=>c&&c.id===charId);
  const fallbackName=String(listMatch?.name||'').trim()||(charId&&charId===S?.charId?(String(S.profile?.name||'').trim()||'Aktiver Charakter'):'');
  if(!charId) return {ready:false,charId:'',oppName:'',loading:false,error:''};
  const activeCamp=getActiveDiceCampaignId();
  const isEnemy=isEnemySheet(charId);
  if(isEnemy&&!canSeeEnemyInDice(charId,activeCamp)){
    return {ready:false,charId,oppName:fallbackName||'Gegner',isEnemy:true,hideDetails:true,loading:false,error:'Dieser Gegner ist aktuell nicht für den Würfelassistenten freigeschaltet.'};
  }
  const hideDetails=shouldHideOpponentDetails(charId,activeCamp);
  const liveResp=(DUEL.outgoing&&DUEL.outgoing.status==='responded'&&DUEL.outgoing.targetCharId===charId&&DUEL.outgoing.response?.snapshot)?DUEL.outgoing.response:null;
  const oppSheet=getCachedForeignSheet(charId);
  const loading=isForeignSheetLoading(charId);
  const error=getForeignSheetError(charId);
  if(!oppSheet&&!liveResp){
    return {ready:false,charId,oppName:fallbackName||'Gegner',isEnemy,hideDetails,loading,error};
  }
  const oppM=oppSheet?calcActiveMods(oppSheet):null;
  const oppName=String(liveResp?.targetCharName||oppSheet?.profile?.name||'').trim()||fallbackName||'Unbenannter Gegner';
  const rawKind=['preset','attr','skill'].includes(D.oppKind)?D.oppKind:'preset';
  const oppKind=(hideDetails&&rawKind==='skill')?'preset':rawKind;
  const oppPreset=['dodge','parry','block','attack'].includes(D.oppPreset)?D.oppPreset:'dodge';
  const oppSkills=(oppSheet?.skills||[]).filter(Boolean);
  const oppWeapons=(oppSheet?.weapons||[]).filter(Boolean);

  if(liveResp){
    const snap=liveResp.snapshot;
    const sk=liveResp.oppSkillId&&liveResp.oppSkillId!=='__none__'?oppSkills.find(s=>s.id===liveResp.oppSkillId)||null:null;
    const resolvedItem=resolveCombatItemByRef(liveResp.oppWeaponId,oppSheet);
    const oppWeapon=resolvedItem?.kind==='weapon'?resolvedItem.item:null;
    const oppShield=resolvedItem?.kind==='shield'?resolvedItem.item:(snap.oppShieldId?(oppSheet?.armors||[]).find(a=>a&&a.id===snap.oppShieldId&&isArmorShield(a))||null:null);
    const oppCombatRef=oppShield?`shield:${oppShield.id}`:(oppWeapon?oppWeapon.id:'');
    const oppRollCat=snap.oppRollCat||'Normaler Test';
    const liveAd={
      autoAdv:toInt(snap.autoAdv,0),
      autoDis:toInt(snap.autoDis,0),
      rawAutoAdv:toInt(snap.autoAdv,0),
      rawAutoDis:toInt(snap.autoDis,0),
      src:Array.isArray(snap.src)?snap.src:[],
      sitOptions:[]
    };
    return {
      ready:true,
      charId,
      oppName,
      isEnemy,
      hideDetails,
      oppSheet:oppSheet||{skills:[],weapons:[],armors:[],attributes:{},profile:{name:oppName}},
      oppM:oppM||{},
      oppKind:liveResp.oppKind||oppKind,
      oppPreset:liveResp.oppPreset||oppPreset,
      attrKey:snap.attrKey||'GW',
      attrVal:toInt(snap.attrVal,0),
      sk,
      skBonus:toInt(snap.skBonus,0),
      oppWeapon,
      oppShield,
      oppCombatRef,
      oppShieldId:oppShield?.id||snap.oppShieldId||'',
      oppShieldName:oppShield?(String(oppShield.name||'').trim()||'Schild'):(snap.oppShieldName||''),
      oppBlockKind:snap.oppBlockKind||(oppShield?'shield':(oppWeapon&&isWeaponBlockable(oppWeapon)?'item':'none')),
      oppVal:toInt(snap.oppVal,0),
      oppRollCat,
      oppShortLabel:snap.oppShortLabel||`${oppRollCat} ${toInt(snap.oppVal,0)}`,
      oppBreak:snap.oppBreak||`${oppName} • ${snap.oppShortLabel||oppRollCat} = ${toInt(snap.oppVal,0)}`,
      ad:liveAd,
      fromLiveResponse:true,
      liveUseInspiration:Boolean(liveResp.useInspiration),
      liveResponderName:String(liveResp.responderName||''),
      loading,
      error,
      loadedAt:getForeignSheetLoadedAt(charId),
      isSelf:Boolean(!UI.inLobby&&S?.charId&&charId===S.charId)
    };
  }

  let attrKey='GW', attrVal=0, sk=null, skBonus=0, oppWeapon=null, oppShield=null, oppVal=0, oppRollCat='Normaler Test', oppShortLabel='', oppBreak='';
  const effOppWeaponId=hideDetails?'':D.oppWeaponId;
  const effOppSkillId=hideDetails?'':D.oppSkillId;

  if(oppKind==='preset'){
    if(oppPreset==='dodge'){
      attrKey='GW';
      attrVal=getAttrTot('GW',oppM,oppSheet);
      sk=effOppSkillId==='__none__'?null:(effOppSkillId?oppSkills.find(s=>s.id===effOppSkillId):null)||findOppSkillByKeywords(oppSheet,['ausweichen','abwehr']);
      if(effOppSkillId==='__none__') sk=null;
      skBonus=sk?getSkBonus(sk):0;
      oppVal=attrVal+skBonus;
      oppRollCat='Ausweichen';
      oppShortLabel=`Ausweichen ${oppVal}`;
      oppBreak=sk?`${oppName} • Ausweichen: GW ${attrVal} ${fmtSign(skBonus)} ${sk.name} = ${oppVal}`:`${oppName} • Ausweichen: GW ${attrVal} = ${oppVal}`;
    }else if(oppPreset==='parry'){
      const picked=(effOppWeaponId==='__none__')?null:(resolveCombatItemByRef(effOppWeaponId,oppSheet)||findDefaultOppCombatItem(oppSheet,'parry'));
      oppWeapon=picked?.kind==='weapon'?picked.item:null;
      attrKey='PR';
      attrVal=getAttrTot('PR',oppM,oppSheet);
      if(effOppSkillId==='__none__'){
        sk=null;
      }else{
        sk=(effOppSkillId?oppSkills.find(s=>s.id===effOppSkillId):null)||findOppSkillByKeywords(oppSheet,['parieren','parade'])||(oppWeapon?.skillId?skillsFind(oppSkills,oppWeapon.skillId):null);
      }
      skBonus=sk?getSkBonus(sk):0;
      oppVal=attrVal+skBonus;
      oppRollCat='Parieren';
      const wNm=oppWeapon?(String(oppWeapon.name||'').trim()||getWeaponSubtype(oppWeapon.wType).label):'';
      oppShortLabel=`Parieren ${oppVal}`;
      oppBreak=`${oppName} • Parieren${wNm?` (${wNm})`:''}: PR ${attrVal}${sk?` ${fmtSign(skBonus)} ${sk.name}`:''} = ${oppVal}`;
    }else if(oppPreset==='block'){
      let picked=(effOppWeaponId==='__none__')?null:resolveCombatItemByRef(effOppWeaponId,oppSheet);
      if(picked&&picked.kind==='weapon'&&!isWeaponBlockable(picked.item)) picked=null;
      if(!picked&&effOppWeaponId!=='__none__') picked=findDefaultOppCombatItem(oppSheet,'block');
      if(picked?.kind==='shield') oppShield=picked.item;
      else if(picked?.kind==='weapon') oppWeapon=picked.item;
      attrKey=oppShield?(ATTRS.some(a=>a.k===oppShield.wAttr)?oppShield.wAttr:'ST'):'ST';
      attrVal=getAttrTot(attrKey,oppM,oppSheet);
      if(effOppSkillId==='__none__'){
        sk=null;
      }else{
        sk=(effOppSkillId?oppSkills.find(s=>s.id===effOppSkillId):null)
          ||(oppShield?.skillId?skillsFind(oppSkills,oppShield.skillId):null)
          ||findOppSkillByKeywords(oppSheet,['blocken','schildblock'])
          ||(oppWeapon?.skillId?skillsFind(oppSkills,oppWeapon.skillId):null);
      }
      skBonus=sk?getSkBonus(sk):0;
      oppVal=attrVal+skBonus;
      oppRollCat='Blocken';
      const itNm=oppShield
        ?`🛡️ ${String(oppShield.name||'').trim()||'Schild'}`
        :(oppWeapon?(String(oppWeapon.name||'').trim()||getWeaponSubtype(oppWeapon.wType).label):'');
      oppShortLabel=`Blocken ${oppVal}`;
      oppBreak=`${oppName} • Blocken${itNm?` (${itNm})`:''}: ${attrKey} ${attrVal}${sk?` ${fmtSign(skBonus)} ${sk.name}`:''} = ${oppVal}`;
    }else{
      const picked=(effOppWeaponId==='__none__')?null:(resolveCombatItemByRef(effOppWeaponId,oppSheet)||findDefaultOppCombatItem(oppSheet,'attack'));
      if(picked?.kind==='shield') oppShield=picked.item;
      else if(picked?.kind==='weapon') oppWeapon=picked.item;
      const meta=oppShield?getShieldRollMeta(oppShield,oppM,oppSheet):(oppWeapon?getWeaponRollMeta(oppWeapon,oppM,oppSheet):null);
      attrKey=meta?meta.attrKey:'PR';
      attrVal=getAttrTot(attrKey,oppM,oppSheet);
      if(effOppSkillId==='__none__'){
        sk=null;
      }else{
        sk=(effOppSkillId?oppSkills.find(s=>s.id===effOppSkillId):null)||(meta?.sk||null);
      }
      skBonus=sk?getSkBonus(sk):0;
      oppVal=attrVal+skBonus;
      oppRollCat='Trefferwurf';
      const wNm=oppShield
        ?`🛡️ ${String(oppShield.name||'').trim()||'Schild'}`
        :(oppWeapon?(String(oppWeapon.name||'').trim()||getWeaponSubtype(oppWeapon.wType).label):'Angriff');
      oppShortLabel=`${wNm} ${oppVal}`;
      oppBreak=`${oppName} • ${wNm}: ${attrKey} ${attrVal}${sk?` ${fmtSign(skBonus)} ${sk.name}`:''} = ${oppVal}`;
    }
  }else if(oppKind==='skill'){
    sk=(effOppSkillId?oppSkills.find(s=>s.id===effOppSkillId):null)||oppSkills[0]||null;
    attrKey=sk?(ATTRS.some(a=>a.k===sk.linkedAttr)?sk.linkedAttr:'PR'):(ATTRS.some(a=>a.k===D.oppAttrKey)?D.oppAttrKey:'PR');
    attrVal=getAttrTot(attrKey,oppM,oppSheet);
    skBonus=sk?getSkBonus(sk):0;
    oppVal=attrVal+skBonus;
    oppRollCat='Normaler Test';
    oppShortLabel=sk?`${sk.name} ${oppVal}`:`${attrKey} ${oppVal}`;
    oppBreak=sk?`${oppName} • ${sk.name}: ${attrKey} ${attrVal} ${fmtSign(skBonus)} = ${oppVal}`:`${oppName} • ${attrKey} = ${oppVal}`;
  }else{
    attrKey=ATTRS.some(a=>a.k===D.oppAttrKey)?D.oppAttrKey:'GW';
    attrVal=getAttrTot(attrKey,oppM,oppSheet);
    oppVal=attrVal;
    oppRollCat='Normaler Test';
    oppShortLabel=`${attrKey} ${oppVal}`;
    oppBreak=`${oppName} • ${attrKey} = ${oppVal}`;
  }

  const oppDefForOpp=oppRollCat==='Trefferwurf'?(c1Cat==='Parade'?'Parieren':c1Cat):'';
  const ad=getAdvDisForContext({
    weaponId:oppWeapon?.id||null,
    shieldId:oppShield?.id||null,
    wRollCat:oppRollCat,
    skillId:sk?.id||null,
    attrKey,
    sitActive:hideDetails?{}:(D.oppSitActive||{}),
    includeInspiration:false,
    oppDefenseCat:oppDefForOpp
  },oppM,oppSheet);

  return {
    ready:true,
    charId,
    oppName,
    isEnemy,
    hideDetails,
    oppSheet,
    oppM,
    oppKind,
    oppPreset,
    attrKey,
    attrVal,
    sk,
    skBonus,
    oppWeapon,
    oppShield,
    oppCombatRef:oppShield?`shield:${oppShield.id}`:(oppWeapon?oppWeapon.id:''),
    oppShieldId:oppShield?.id||'',
    oppShieldName:oppShield?(String(oppShield.name||'').trim()||'Schild'):'',
    oppBlockKind:oppShield?'shield':(oppWeapon&&isWeaponBlockable(oppWeapon)?'item':'none'),
    oppVal,
    oppRollCat,
    oppShortLabel,
    oppBreak,
    ad,
    fromLiveResponse:false,
    loading,
    error,
    loadedAt:getForeignSheetLoadedAt(charId),
    isSelf:Boolean(!UI.inLobby&&S?.charId&&charId===S.charId)
  };
}
function skillsFind(list,id){return list.find(s=>s.id===id)||null;}
export const getEffD=()=>{
  if(D.dMode==='character'){
    const opp=resolveOpponentComparison(D.wRollCat||'Normaler Test');
    if(opp&&opp.ready) return opp.oppVal;
  }
  return D.dMode==='breakdown'?toInt(D.dAttr)+getDSkVal():toInt(D.dDirect);
};
export function formatSrcOriginLabel(s){
  if(!s) return 'Quelle';
  if(s.srcKind==='Kraft'||s.srcKind==='Augment') return s.srcName?`${s.srcKind}: ${s.srcName}`:s.srcKind;
  if(s.srcKind==='Rüstung'||s.srcKind==='Schild'||s.srcKind==='Waffe'||s.srcKind==='Ausrüstung') return s.srcName?`${s.srcKind}: ${s.srcName}`:s.srcKind;
  if(s.srcKind==='Statuseffekt') return `Status: ${s.srcName||s.label||'Effekt'}`;
  if(s.srcKind==='Waffen-Tag'||s.srcKind==='Munitions-Tag'||s.srcKind==='Rüstungs-Tag'){
    const tg=s.tagLbl?String(s.tagLbl).replace(/\(\s*(\d+)\s*\)/g,' $1').trim():(s.srcName||'Tag');
    return `${s.srcKind}: ${tg}`;
  }
  if(s.srcKind==='Inspiration') return '✨ Inspiration';
  if(s.srcKind==='Größe') return `📏 ${s.srcName||'Größenunterschied'}`;
  if(s.srcKind==='Mehrhändig') return s.srcName||'Mehrhändiger Kampf';
  if(s.srcKind==='Waffenwurf') return `Waffenwurf: ${s.srcName||'Waffe'}`;
  if(s.tagLbl) return String(s.tagLbl).replace(/\(\s*(\d+)\s*\)/g,' $1').trim();
  if(s.isSit) return s.srcName||s.label||'Situativ';
  return s.srcName||s.srcKind||'Effekt';
}
export function formatAdvSrcScope(s){
  if(!s) return '';
  if(s.scope==='attr'&&s.attrKey) return s.attrKey;
  if(s.scope==='skill') return s.skillName||s.label||'';
  if(s.scope==='dodge') return 'Ausweichen';
  if(s.scope==='parry') return 'Parieren';
  if(s.scope==='block') return 'Blocken';
  if(s.scope==='defense') return 'Abwehr';
  if(s.scope==='parry_block') return 'Parieren/Blocken';
  if(s.scope==='hit') return 'Trefferwurf';
  if(s.scope==='hit_melee') return 'Nahkampf-Treffer';
  if(s.scope==='hit_ranged') return 'Fernkampf-Treffer';
  if(s.scope==='all') return s.srcKind==='Inspiration'?'Nächster Wurf':'Alle Proben';
  const lbl=String(s.label||'').trim(), orig=String(formatSrcOriginLabel(s)||'').trim();
  if(lbl&&lbl.toLowerCase()!==orig.toLowerCase()) return lbl;
  return '';
}
export function buildAdvSrcShortList(T){
  const parts=[];
  (T?.advSrc||[]).forEach(s=>{
    if(!s||!s.val) return;
    if(s.fromOpponent){
      const oppDir=s.oppOrigKind==='dis'?'N':'V';
      const effDir=s.kind==='dis'?'N':'V';
      parts.push(`${fmtSign(s.val)}${effDir} (${s.oppName||'Gegner'} ${fmtSign(s.val)}${oppDir}: ${formatSrcOriginLabel(s)})`);
      return;
    }
    const dir=s.kind==='dis'?'N':'V';
    parts.push(`${fmtSign(s.val)}${dir} (${formatSrcOriginLabel(s)})`);
  });
  if(T?.advAdj) parts.push(`${fmtSign(T.advAdj)}V (Manuell)`);
  if(T?.disAdj) parts.push(`${fmtSign(T.disAdj)}N (Manuell)`);
  return parts;
}
export const isLobbyNeutralDice=()=>Boolean(UI.inLobby);
export function doesWeaponApplyToPool(weapon, atkPool = D.atkPool, wRollCat = D.wRollCat){
  if(!weapon) return false;
  if(wRollCat !== 'Trefferwurf') return true;
  const wpPool = ['lp','mlp','both'].includes(weapon.dmgPool) ? weapon.dmgPool : 'lp';
  if(wpPool === 'both') return true;
  return wpPool === (atkPool === 'mlp' ? 'mlp' : 'lp');
}
export function getEffectiveDiceWeaponId(){
  if(isLobbyNeutralDice() || !D.weaponId) return null;
  const w = (S.weapons || []).find(x => x.id === D.weaponId);
  if(!w) return null;
  if(!doesWeaponApplyToPool(w, D.atkPool, D.wRollCat)) return null;
  return w.id;
}
export function getEffectiveDiceShieldId(){
  if(isLobbyNeutralDice() || !D.shieldId) return null;
  const sh = (S.armors || []).find(x => x && x.id === D.shieldId && isArmorShield(x));
  if(!sh) return null;
  if(!doesWeaponApplyToPool(sh, D.atkPool, D.wRollCat)) return null;
  return sh.id;
}
export function resetDiceToLobbyNeutral(){
  hooks.clearOutgoingDuel?.({notifyCancel:true,silent:true});
  hooks.resetCombatState?.();
  D.weaponId=null; D.shieldId=null; D.skillId=null; D.attrKey=null; D.wRollCat='Normaler Test'; D.atkPool='lp'; D.dualWieldOvr='auto'; D.wpEditOpen=false; D.sitActive={}; D.oppSitActive={}; D.critOff=0; D.advAdj=0; D.disAdj=0; D.adv=0; D.dis=0;
  D.label='Freie Probe (Lobby)';
  D.cMode='direct'; D.cDirect=50; D.cAttr=50; D.cSkill='0';
  D.dMode='direct'; D.dDirect=40; D.oppCharId='';
  D._lobbyNeutral=true;
}
export function exitLobbyNeutralDice(){
  D._lobbyNeutral=false;
  if(D.label==='Freie Probe (Lobby)') D.label='Freie Probe';
}
export function ensureLobbyNeutralDiceOnOpen(){
  if(isLobbyNeutralDice()&&(!D._lobbyNeutral||D.weaponId||D.shieldId||D.skillId||D.attrKey)){
    resetDiceToLobbyNeutral();
  }
}
export function applyDiceAutoAdvDis(resetManual=false,M=isLobbyNeutralDice()?{testTh:0}:calcActiveMods()){
  if(resetManual){D.advAdj=0;D.disAdj=0;}
  const normCat=D.wRollCat==='Parade'?'Parieren':D.wRollCat;
  const effCat=['Normaler Test','Trefferwurf','Parieren','Blocken','Ausweichen'].includes(normCat)?normCat:(D.weaponId?'Trefferwurf':D.shieldId?'Blocken':'Normaler Test');
  D.wRollCat=effCat;
  const effWeaponId=getEffectiveDiceWeaponId();
  const effShieldId=getEffectiveDiceShieldId();
  const opp=D.dMode==='character'?resolveOpponentComparison(effCat):null;
  const oppDefCat=(opp&&opp.ready)?opp.oppRollCat:'';
  const r1=isLobbyNeutralDice()
    ?{autoAdv:0,autoDis:0,rawAutoAdv:0,rawAutoDis:0,src:[],autoCrit:0,critSrc:[],autoRollMod:0,rollModSrc:[],sitOptions:[]}
    :getAdvDisForContext({weaponId:effWeaponId,shieldId:effShieldId,wRollCat:effCat,skillId:D.skillId||null,attrKey:D.attrKey||null,sitActive:D.sitActive||{},dualWieldOvr:D.dualWieldOvr||'auto',includeInspiration:true,oppDefenseCat:oppDefCat},M);
  let c1AutoAdv=r1.autoAdv||0;
  let c1AutoDis=r1.autoDis||0;
  let c1RawAutoAdv=r1.rawAutoAdv||0;
  let c1RawAutoDis=r1.rawAutoDis||0;
  const c1AdvSrc=[...(r1.src||[])];
  let oppAutoAdv=(opp&&opp.ready)?(opp.ad.autoAdv||0):0;
  let oppAutoDis=(opp&&opp.ready)?(opp.ad.autoDis||0):0;
  let oppRawAutoAdv=(opp&&opp.ready)?(opp.ad.rawAutoAdv||opp.ad.autoAdv||0):0;
  let oppRawAutoDis=(opp&&opp.ready)?(opp.ad.rawAutoDis||opp.ad.autoDis||0):0;
  const oppAdvSrc=(opp&&opp.ready)?(opp.ad.src||[]).map(s=>({...s,fromOpponent:true,oppName:opp.oppName,oppOrigKind:s.kind,kind:s.kind==='dis'?'adv':'dis'})):[];
  if(opp&&opp.ready&&opp.oppSheet){
    const selfSheet=isLobbyNeutralDice()?null:S;
    if(effCat==='Trefferwurf'){
      const sz=getRelativeSizeHitMod(selfSheet,opp.oppSheet);
      if(sz.diff>0){
        c1AutoAdv+=sz.diff;
        c1RawAutoAdv+=sz.diff;
        c1AdvSrc.push({val:sz.diff,kind:'adv',scope:'hit',label:`${sz.atkInfo.formatted} vs. ${sz.targetInfo.formatted}`,srcName:`Größe (${sz.atkInfo.lvlStr} vs. ${sz.targetInfo.lvlStr})`,srcKind:'Größe'});
      }else if(sz.diff<0){
        const dAbs=Math.abs(sz.diff);
        c1AutoDis+=dAbs;
        c1RawAutoDis+=dAbs;
        c1AdvSrc.push({val:dAbs,kind:'dis',scope:'hit',label:`${sz.atkInfo.formatted} vs. ${sz.targetInfo.formatted}`,srcName:`Größe (${sz.atkInfo.lvlStr} vs. ${sz.targetInfo.lvlStr})`,srcKind:'Größe'});
      }
    }else if(opp.oppRollCat==='Trefferwurf'){
      const oppSz=getRelativeSizeHitMod(opp.oppSheet,selfSheet);
      if(oppSz.diff>0){
        oppAutoAdv+=oppSz.diff;
        oppRawAutoAdv+=oppSz.diff;
        oppAdvSrc.push({val:oppSz.diff,kind:'dis',oppOrigKind:'adv',fromOpponent:true,oppName:opp.oppName,scope:'hit',label:`${oppSz.atkInfo.formatted} vs. ${oppSz.targetInfo.formatted}`,srcName:`Größe (${oppSz.atkInfo.lvlStr} vs. ${oppSz.targetInfo.lvlStr})`,srcKind:'Größe'});
      }else if(oppSz.diff<0){
        const dAbs=Math.abs(oppSz.diff);
        oppAutoDis+=dAbs;
        oppRawAutoDis+=dAbs;
        oppAdvSrc.push({val:dAbs,kind:'adv',oppOrigKind:'dis',fromOpponent:true,oppName:opp.oppName,scope:'hit',label:`${oppSz.atkInfo.formatted} vs. ${oppSz.targetInfo.formatted}`,srcName:`Größe (${oppSz.atkInfo.lvlStr} vs. ${oppSz.targetInfo.lvlStr})`,srcKind:'Größe'});
      }
    }
  }
  const totalAutoAdv=c1AutoAdv+oppAutoDis;
  const totalAutoDis=c1AutoDis+oppAutoAdv;
  D.adv=Math.max(0,totalAutoAdv+toInt(D.advAdj,0));
  D.dis=Math.max(0,totalAutoDis+toInt(D.disAdj,0));
  return {
    ...r1,
    c1AutoAdv,
    c1AutoDis,
    c1AdvSrc,
    opp,
    oppAutoAdv,
    oppAutoDis,
    oppAdvSrc,
    oppSitOptions:(opp&&opp.ready)?(opp.ad.sitOptions||[]):[],
    autoAdv:totalAutoAdv,
    autoDis:totalAutoDis,
    rawAutoAdv:c1RawAutoAdv+oppRawAutoDis,
    rawAutoDis:c1RawAutoDis+oppRawAutoAdv,
    src:[...c1AdvSrc,...oppAdvSrc]
  };
}
export function calcRollAdvDis(M=isLobbyNeutralDice()?{testTh:0}:calcActiveMods()){
  const r=applyDiceAutoAdvDis(false,M);
  return {...r,effAdv:D.adv,effDis:D.dis};
}
export const calcEgMultiplier = () => 1;
export function calcThreshold(){
  const isNeutral=isLobbyNeutralDice();
  const M=isNeutral?{testTh:0}:calcActiveMods(),ad=calcRollAdvDis(M),cv=getEffC(),dv=(ad.opp&&ad.opp.ready)?ad.opp.oppVal:getEffD(),rawNet=D.adv-D.dis,net=Math.max(-5,Math.min(5,rawNet));
  const bonus=(net===0?0:Math.sign(net)*(10+(Math.abs(net)-1)*5))+(M.testTh||0), th=cv+50-dv+bonus;
  const effCritIdx=Math.max(0,Math.min(CRIT_SEQ.length-1,(ad.autoCrit||0)+toInt(D.critOff,0))), effCrit=CRIT_SEQ[effCritIdx];
  D.crit=effCrit;
  return {cv,dv,effAdv:D.adv,effDis:D.dis,autoAdv:ad.autoAdv,autoDis:ad.autoDis,c1AutoAdv:ad.c1AutoAdv||0,c1AutoDis:ad.c1AutoDis||0,c1AdvSrc:ad.c1AdvSrc||[],opp:ad.opp||null,oppAutoAdv:ad.oppAutoAdv||0,oppAutoDis:ad.oppAutoDis||0,oppAdvSrc:ad.oppAdvSrc||[],oppSitOptions:ad.oppSitOptions||[],advAdj:toInt(D.advAdj,0),disAdj:toInt(D.disAdj,0),advSrc:ad.src,sitOptions:ad.sitOptions||[],autoCrit:ad.autoCrit||0,critSrc:ad.critSrc||[],rollMod:ad.autoRollMod||0,rollModSrc:ad.rollModSrc||[],effCrit,effCritIdx,rawNet,net,bonus,th,egMult:1,effTh:M.testTh||0,chance:Math.max(1,Math.min(99,th))};
}
export function selectDiceWeapon(itemRef){
  if(isLobbyNeutralDice()) return;
  const ref=String(itemRef||'').trim();
  if(!ref||ref==='__none__'){
    D.weaponId=null;
    D.shieldId=null;
    D.dualWieldOvr='auto';
    D.wpEditOpen=false;
    D.sitActive={};
    D.critOff=0;
    syncDiceFromSheet();
    applyDiceAutoAdvDis(false);
    renderDice();
    return;
  }
  if(ref.startsWith('shield:')){
    const sid=ref.slice(7);
    const sh=(S.armors||[]).find(x=>x&&x.id===sid&&isArmorShield(x));
    if(!sh) return;
    if(D.wRollCat==='Normaler Test') D.wRollCat='Blocken';
    const sm=getShieldRollMeta(sh);
    D.weaponId=null;
    D.shieldId=sh.id;
    D.dualWieldOvr='auto';
    D.critOff=0;
    D.sitActive={};
    D.attrKey=sm.attrKey;
    D.skillId=sm.sk?sm.sk.id:null;
    if(D.wRollCat==='Trefferwurf'){
      const shPool=['lp','mlp','both'].includes(sh.dmgPool)?sh.dmgPool:'lp';
      if(shPool==='mlp') D.atkPool='mlp';
      else if(shPool==='lp') D.atkPool='lp';
    }
    D.cMode='breakdown';
    D.cAttr=sm.attrVal;
    if(sm.sk){
      if(['0','10','15','20','30'].includes(String(sm.skBonus))){D.cSkill=String(sm.skBonus);}
      else{D.cSkill='custom';D.cCustom=sm.skBonus;}
    }else{D.cSkill='0';}
    D.cDirect=sm.pool;
    syncDiceFromSheet();
    applyDiceAutoAdvDis(false);
    renderDice();
    return;
  }
  const w=(S.weapons||[]).find(x=>x.id===ref);
  if(!w) return;
  if(D.wRollCat==='Normaler Test') D.wRollCat='Trefferwurf';
  const wm=getWeaponRollMeta(w);
  D.weaponId=w.id;
  D.shieldId=null;
  D.dualWieldOvr='auto';
  D.critOff=0;
  D.sitActive={};
  D.attrKey=wm.attrKey;
  D.skillId=wm.sk?wm.sk.id:null;
  if(D.wRollCat==='Trefferwurf'){
    const wpPool=['lp','mlp','both'].includes(w.dmgPool)?w.dmgPool:'lp';
    if(wpPool==='mlp') D.atkPool='mlp';
    else if(wpPool==='lp') D.atkPool='lp';
  }
  D.cMode='breakdown';
  D.cAttr=wm.attrVal;
  if(wm.sk){
    if(['0','10','15','20','30'].includes(String(wm.skBonus))){D.cSkill=String(wm.skBonus);}
    else{D.cSkill='custom';D.cCustom=wm.skBonus;}
  }else{D.cSkill='0';}
  D.cDirect=wm.pool;
  syncDiceFromSheet();
  applyDiceAutoAdvDis(false);
  renderDice();
}
export function openWeaponRoll(weaponId,wRollCat='Trefferwurf'){
  const w=S.weapons.find(x=>x.id===weaponId); if(!w) return;
  const normCat=wRollCat==='Parade'?'Parieren':wRollCat;
  const cat=['Normaler Test','Trefferwurf','Parieren','Blocken','Ausweichen'].includes(normCat)?normCat:'Trefferwurf';
  const wm=getWeaponRollMeta(w);
  D.weaponId=w.id; D.shieldId=null; D.wRollCat=cat; D.dualWieldOvr='auto'; D.critOff=0; D.sitActive={};
  D.atkPool=(w.dmgPool==='mlp')?'mlp':'lp';
  D.attrKey=wm.attrKey; D.skillId=wm.sk?wm.sk.id:null;
  if(D.dMode==='character'){
    D.oppKind='preset';
    if(cat==='Trefferwurf'&&!['dodge','parry','block'].includes(D.oppPreset)) D.oppPreset='dodge';
    else if(cat==='Parieren'||cat==='Blocken'||cat==='Ausweichen') D.oppPreset='attack';
  }
  applyDiceAutoAdvDis(true);
  D.cMode='breakdown'; D.cAttr=wm.attrVal;
  if(wm.sk){
    if(['0','10','15','20','30'].includes(String(wm.skBonus))){D.cSkill=String(wm.skBonus);}
    else{D.cSkill='custom';D.cCustom=wm.skBonus;}
  }else{D.cSkill='0';}
  D.cDirect=wm.pool;
  const wName=String(w.name||'').trim()||getWeaponSubtype(w.wType).label;
  const poolSfx=(cat==='Trefferwurf'&&D.atkPool==='mlp')?' [mLP]':'';
  D.label=wm.sk?`${cat}${poolSfx}: ${wName} • ${wm.sk.name} (${fmtSign(wm.skBonus)}) + ${wm.attrKey} (${wm.attrVal})`:`${cat}${poolSfx}: ${wName} • ${wm.attrKey} (${wm.attrVal})`;
  D.open=true;
  hooks.renderHeader?.(); renderDice();
}
export function openShieldRoll(armorId,wRollCat='Blocken'){
  const sh=(S.armors||[]).find(x=>x&&x.id===armorId&&isArmorShield(x)); if(!sh) return;
  const normCat=wRollCat==='Parade'?'Parieren':wRollCat;
  const cat=['Normaler Test','Trefferwurf','Parieren','Blocken','Ausweichen'].includes(normCat)?normCat:'Blocken';
  const sm=getShieldRollMeta(sh);
  D.weaponId=null; D.shieldId=sh.id; D.wRollCat=cat; D.dualWieldOvr='auto'; D.critOff=0; D.sitActive={};
  D.atkPool=(sh.dmgPool==='mlp')?'mlp':'lp';
  D.attrKey=sm.attrKey; D.skillId=sm.sk?sm.sk.id:null;
  if(D.dMode==='character'){
    D.oppKind='preset';
    if(cat==='Trefferwurf'&&!['dodge','parry','block'].includes(D.oppPreset)) D.oppPreset='dodge';
    else if(cat==='Parieren'||cat==='Blocken'||cat==='Ausweichen') D.oppPreset='attack';
  }
  applyDiceAutoAdvDis(true);
  D.cMode='breakdown'; D.cAttr=sm.attrVal;
  if(sm.sk){
    if(['0','10','15','20','30'].includes(String(sm.skBonus))){D.cSkill=String(sm.skBonus);}
    else{D.cSkill='custom';D.cCustom=sm.skBonus;}
  }else{D.cSkill='0';}
  D.cDirect=sm.pool;
  const shName=String(sh.name||'').trim()||'Schild';
  const poolSfx=(cat==='Trefferwurf'&&D.atkPool==='mlp')?' [mLP]':'';
  D.label=sm.sk?`${cat}${poolSfx}: 🛡️ ${shName} • ${sm.sk.name} (${fmtSign(sm.skBonus)}) + ${sm.attrKey} (${sm.attrVal})`:`${cat}${poolSfx}: 🛡️ ${shName} • ${sm.attrKey} (${sm.attrVal})`;
  D.open=true;
  hooks.renderHeader?.(); renderDice();
}
export function syncDiceFromSheet(){
  if(isLobbyNeutralDice()){applyDiceAutoAdvDis(false);return;}
  if(D.wRollCat==='Parade') D.wRollCat='Parieren';
  if(!['Normaler Test','Trefferwurf','Parieren','Blocken','Ausweichen'].includes(D.wRollCat)){
    D.wRollCat=D.weaponId?'Trefferwurf':D.shieldId?'Blocken':'Normaler Test';
  }
  const poolSfx=(D.wRollCat==='Trefferwurf'&&D.atkPool==='mlp')?' [mLP]':'';
  if(D.weaponId){
    const w=S.weapons.find(x=>x.id===D.weaponId);
    if(w){
      const wm=getWeaponRollMeta(w), cat=D.wRollCat||'Trefferwurf';
      const applies=doesWeaponApplyToPool(w,D.atkPool,cat);
      const ak=D.attrKey||wm.attrKey, av=getAttrTot(ak);
      const sk=D.skillId?S.skills.find(s=>s.id===D.skillId):null, b=sk?getSkBonus(sk):0;
      D.attrKey=ak; D.cAttr=av;
      if(sk){if(['0','10','15','20','30'].includes(String(b))){D.cSkill=String(b);}else{D.cSkill='custom';D.cCustom=b;}}
      const effSk=sk?b:(D.cMode==='breakdown'?getCSkVal():0);
      D.cDirect=av+effSk;
      const wName=applies?(String(w.name||'').trim()||getWeaponSubtype(w.wType).label):'Ohne Waffe';
      D.label=sk?`${cat}${poolSfx}: ${wName} • ${sk.name} (${fmtSign(b)}) + ${ak} (${av})`:`${cat}${poolSfx}: ${wName} • ${ak} (${av})`;
      applyDiceAutoAdvDis(false);
      return;
    }else{D.weaponId=null;D.wpEditOpen=false;D.wRollCat='Normaler Test';D.sitActive={};}
  }
  if(D.shieldId){
    const sh=(S.armors||[]).find(x=>x&&x.id===D.shieldId&&isArmorShield(x));
    if(sh){
      const sm=getShieldRollMeta(sh), cat=D.wRollCat||'Blocken';
      const applies=doesWeaponApplyToPool(sh,D.atkPool,cat);
      const ak=D.attrKey||sm.attrKey, av=getAttrTot(ak);
      const sk=D.skillId?S.skills.find(s=>s.id===D.skillId):null, b=sk?getSkBonus(sk):0;
      D.attrKey=ak; D.cAttr=av;
      if(sk){if(['0','10','15','20','30'].includes(String(b))){D.cSkill=String(b);}else{D.cSkill='custom';D.cCustom=b;}}
      const effSk=sk?b:(D.cMode==='breakdown'?getCSkVal():0);
      D.cDirect=av+effSk;
      const shName=applies?`🛡️ ${String(sh.name||'').trim()||'Schild'}`:'Ohne Schild';
      D.label=sk?`${cat}${poolSfx}: ${shName} • ${sk.name} (${fmtSign(b)}) + ${ak} (${av})`:`${cat}${poolSfx}: ${shName} • ${ak} (${av})`;
      applyDiceAutoAdvDis(false);
      return;
    }else{D.shieldId=null;D.wpEditOpen=false;D.wRollCat='Normaler Test';D.sitActive={};}
  }
  const isNorm=D.wRollCat==='Normaler Test';
  const catPfx=D.wRollCat?`${D.wRollCat}${poolSfx}: `:'';
  if(D.skillId){const sk=S.skills.find(x=>x.id===D.skillId);if(sk){const ak=D.attrKey||sk.linkedAttr,av=getAttrTot(ak),b=getSkBonus(sk);D.cAttr=av;if(['0','10','15','20','30'].includes(String(b))){D.cSkill=String(b);}else{D.cSkill='custom';D.cCustom=b;}D.cDirect=av+b;D.label=`${catPfx}${sk.name} (${fmtSign(b)}) + ${ak} (${av})`;}else{D.skillId=null;}}
  else if(D.attrKey){const av=getAttrTot(D.attrKey);D.cAttr=av;if(D.cMode==='direct')D.cDirect=av;D.label=isNorm?`Normaler Test: ${D.attrKey} (${av})`:`${catPfx}${D.attrKey} (${av})`;}
  else if(!isNorm&&D.wRollCat){D.label=D.wRollCat==='Trefferwurf'?`Trefferwurf${poolSfx} (Freie Probe)`:`Abwehrprobe: ${D.wRollCat}`;}
  else if(/^(?:Abwehrprobe:|Trefferwurf)/.test(D.label)){D.label='Freie Probe';}
  applyDiceAutoAdvDis(false);
}

export function buildAdvDisInnerHtml(T){
  const hideOpp=Boolean(T.opp?.ready&&T.opp?.hideDetails);
  const visSrc=hideOpp?(T.c1AdvSrc||[]):(T.advSrc||[]);
  const aSrc=visSrc.filter(s=>s.kind!=='dis'), dSrc=visSrc.filter(s=>s.kind==='dis');
  const aTip=aSrc.length?`data-tip="${esc('Aktive Vorteils-Quellen:\n'+fmtAdvSrcLines(aSrc))}"`:'';
  const dTip=dSrc.length?`data-tip="${esc('Aktive Nachteils-Quellen:\n'+fmtAdvSrcLines(dSrc))}"`:'';
  const netBonus=T.bonus-T.effTh;
  const fmtSrcChip=s=>{
    const absV=Math.abs(s.val), isDis=s.kind==='dis', isGreen=!isDis||s.val<0;
    const unit=isDis?(absV===1?'Nachteil':'Nachteile'):(absV===1?'Vorteil':'Vorteile');
    const orig=formatSrcOriginLabel(s);
    const scopeTxt=formatAdvSrcScope(s);
    const cls=isGreen?'bg-emerald-500/15 text-emerald-200 border-emerald-500/35':'bg-rose-500/15 text-rose-200 border-rose-500/35';
    const badgeCls=isGreen?'bg-emerald-500/25 text-emerald-300':'bg-rose-500/25 text-rose-300';
    if(s.fromOpponent){
      const oppDir=s.oppOrigKind==='dis'?'N':'V';
      const effDir=isDis?'N':'V';
      const badge=`${fmtSign(s.val)}${oppDir}→${fmtSign(s.val)}${effDir}`;
      const tip=esc(`${s.oppName||'Gegner'} • ${orig}: ${fmtSign(s.val)} ${s.oppOrigKind==='dis'?'Nachteil(e)':'Vorteil(e)'} des Gegners → zählt als ${fmtSign(s.val)} ${unit} für dich${scopeTxt?` [${scopeTxt}]`:''}`);
      return `<span data-tip="${tip}" class="inline-flex flex-wrap items-center gap-1 px-1.5 py-0.5 rounded border text-[10px] leading-snug max-w-full min-w-0 break-words cursor-help ${cls}"><span class="px-1 rounded font-black tabular shrink-0 ${badgeCls}">${badge}</span><span class="font-bold min-w-0 break-words">${esc(orig)}</span>${scopeTxt?`<span class="opacity-80 min-w-0 break-words">• ${esc(scopeTxt)}</span>`:''}</span>`;
    }
    const badge=`${fmtSign(s.val)}${isDis?'N':'V'}`;
    const tip=esc(`${orig}: ${fmtSign(s.val)} ${unit}${scopeTxt?` [${scopeTxt}]`:''}`);
    return `<span data-tip="${tip}" class="inline-flex flex-wrap items-center gap-1 px-1.5 py-0.5 rounded border text-[10px] leading-snug max-w-full min-w-0 break-words cursor-help ${cls}"><span class="px-1 rounded font-black tabular shrink-0 ${badgeCls}">${badge}</span><span class="font-bold min-w-0 break-words">${esc(orig)}</span>${scopeTxt?`<span class="opacity-80 min-w-0 break-words">• ${esc(scopeTxt)}</span>`:''}</span>`;
  };
  const c1Src=T.c1AdvSrc||[];
  const oppSrc=hideOpp?[]:(T.oppAdvSrc||[]);
  const hasC1Auto=Boolean(c1Src.length||(T.critSrc&&T.critSrc.length)||(T.rollModSrc&&T.rollModSrc.length));
  const hasOppAuto=Boolean(!hideOpp&&T.opp?.ready&&oppSrc.length);
  const hasHiddenOppModNote=Boolean(hideOpp&&(T.oppAutoAdv||T.oppAutoDis));
  const hasAdvDisAdj=(T.advAdj!==0||T.disAdj!==0);
  const c1Name=isLobbyNeutralDice()?(CLOUD.currentUser||'Gast'):(String(S.profile?.name||'').trim()||'Eigener Charakter');
  const manChips=[];
  if(T.advAdj){
    const isPos=T.advAdj>0;
    manChips.push(`<span class="inline-flex flex-wrap items-center gap-1 px-1.5 py-0.5 rounded border text-[10px] leading-snug max-w-full min-w-0 break-words ${isPos?'bg-emerald-500/15 text-emerald-200 border-emerald-500/35':'bg-amber-500/15 text-amber-200 border-amber-400/45'}"><span class="px-1 rounded font-black tabular shrink-0 ${isPos?'bg-emerald-500/25 text-emerald-300':'bg-amber-500/25 text-amber-300'}">${fmtSign(T.advAdj)}V</span><span class="font-bold">Manuell</span></span>`);
  }
  if(T.disAdj){
    const isPos=T.disAdj>0;
    manChips.push(`<span class="inline-flex flex-wrap items-center gap-1 px-1.5 py-0.5 rounded border text-[10px] leading-snug max-w-full min-w-0 break-words ${isPos?'bg-rose-500/15 text-rose-200 border-rose-500/35':'bg-amber-500/15 text-amber-200 border-amber-400/45'}"><span class="px-1 rounded font-black tabular shrink-0 ${isPos?'bg-rose-500/25 text-rose-300':'bg-amber-500/25 text-amber-300'}">${fmtSign(T.disAdj)}N</span><span class="font-bold">Manuell</span></span>`);
  }
  const srcCount=c1Src.length+oppSrc.length+(T.critSrc?.length||0)+(T.rollModSrc?.length||0)+(T.advAdj?1:0)+(T.disAdj?1:0)+(hasHiddenOppModNote?1:0);
  const netCls=T.net>0?'bg-emerald-500/20 text-emerald-300 border-emerald-500/40':T.net<0?'bg-rose-500/20 text-rose-300 border-rose-500/40':'bg-black/25 t-mut bdr-line';
  const netShort=T.net>0?`${fmtSign(netBonus)} (${Math.abs(T.rawNet)}V)`:T.net<0?`${netBonus} (${Math.abs(T.rawNet)}N)`:'±0';
  return `<div class="grid grid-cols-[1fr_auto_1fr] gap-1.5 items-center min-w-0 tabular">
    <div ${aTip} class="min-w-0 flex items-center justify-between gap-1 px-2 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/25 ${aTip?'cursor-help':''}">
      <div class="min-w-0">
        <div class="text-[9px] font-extrabold text-emerald-400 uppercase tracking-wider leading-none">Vorteile</div>
        <div class="font-black text-sm leading-tight mt-0.5 flex items-baseline gap-1"><span>${D.adv}</span>${(T.autoAdv||T.advAdj)?`<span class="text-[10px] font-bold text-emerald-400/90">(${T.autoAdv}${T.advAdj?fmtSign(T.advAdj):''})</span>`:''}</div>
      </div>
      <div class="flex gap-1 shrink-0"><button type="button" data-action="adv-step" data-d="-1" ${D.adv<=0?'disabled':''} aria-label="Vorteile minus 1" class="btn w-7 h-7 p-0">−</button><button type="button" data-action="adv-step" data-d="1" aria-label="Vorteile plus 1" class="btn btn-ok w-7 h-7 p-0">+</button></div>
    </div>
    <div class="flex flex-col items-center gap-0.5 shrink-0">
      <span class="px-2 py-0.5 rounded-md border text-[11px] font-black leading-tight ${netCls}" data-tip="${T.net>0?`${Math.abs(T.rawNet)} Netto-Vorteil (${fmtSign(netBonus)})`:T.net<0?`${Math.abs(T.rawNet)} Netto-Nachteil (${netBonus})`:'Ausgeglichen (±0)'}">${netShort}</span>
      ${hasAdvDisAdj?`<button type="button" data-action="reset-dice-advdis" data-tip="Auf automatisch berechnete Vor-/Nachteile zurücksetzen" class="text-[10px] font-black text-amber-300 hover:underline leading-none cursor-pointer">↺ Auto</button>`:''}
    </div>
    <div ${dTip} class="min-w-0 flex items-center justify-between gap-1 px-2 py-1.5 rounded-lg bg-rose-500/10 border border-rose-500/25 ${dTip?'cursor-help':''}">
      <div class="min-w-0">
        <div class="text-[9px] font-extrabold text-rose-400 uppercase tracking-wider leading-none">Nachteile</div>
        <div class="font-black text-sm leading-tight mt-0.5 flex items-baseline gap-1"><span>${D.dis}</span>${(T.autoDis||T.disAdj)?`<span class="text-[10px] font-bold text-rose-400/90">(${T.autoDis}${T.disAdj?fmtSign(T.disAdj):''})</span>`:''}</div>
      </div>
      <div class="flex gap-1 shrink-0"><button type="button" data-action="dis-step" data-d="-1" ${D.dis<=0?'disabled':''} aria-label="Nachteile minus 1" class="btn w-7 h-7 p-0">−</button><button type="button" data-action="dis-step" data-d="1" aria-label="Nachteile plus 1" class="btn bg-rose-600 text-white border-rose-600 w-7 h-7 p-0">+</button></div>
    </div>
  </div>
  ${srcCount>0?`<div class="rounded-lg bg-black/20 border bdr-line px-2 py-1.5 space-y-1.5 min-w-0">
    <button type="button" data-action="toggle-dice-advsrc" aria-expanded="${D.advSrcOpen?'true':'false'}" class="w-full flex items-center justify-between gap-2 text-left cursor-pointer min-w-0">
      <span class="text-[10px] font-extrabold text-acc truncate">${D.advSrcOpen?'▾':'▸'} ⚡ ${srcCount} aktive ${srcCount===1?'Quelle':'Quellen'}${T.opp?.ready?(hideOpp?` • 👹 ${esc(T.opp.oppName)} (verborgen)`:` • vs. ${esc(T.opp.oppName)}`):''}</span>
      <span class="text-[10px] t-mut shrink-0">${D.advSrcOpen?'Ausblenden':'Details'}</span>
    </button>
    ${D.advSrcOpen?`<div class="space-y-1.5 pt-1 border-t border-white/10 min-w-0">
      ${hasC1Auto?`<div class="flex flex-wrap items-center gap-1 min-w-0">${c1Src.map(fmtSrcChip).join('')}${(T.critSrc||[]).map(c=>`<span data-tip="${esc(`${c.srcName} (${c.srcKind}): Kritische Ziffer ${fmtSign(c.val)}`)}" class="inline-flex flex-wrap items-center gap-1 px-1.5 py-0.5 rounded border text-[10px] leading-snug max-w-full min-w-0 break-words font-bold tabular cursor-help bg-amber-500/15 text-amber-300 border-amber-400/45">${fmtSign(c.val)} Krit. (${esc(c.tagLbl||c.srcName)})</span>`).join('')}${(T.rollModSrc||[]).map(rm=>`<span data-tip="${esc(`${rm.srcName} (${rm.srcKind}): ${fmtSign(rm.val)} auf das geworfene W100-Ergebnis`)}" class="inline-flex flex-wrap items-center gap-1 px-1.5 py-0.5 rounded border text-[10px] leading-snug max-w-full min-w-0 break-words font-bold tabular cursor-help bg-cyan-500/15 text-cyan-300 border-cyan-400/45">🎲 ${fmtSign(rm.val)} Wurf (${esc(rm.tagLbl||rm.srcName)})</span>`).join('')}</div>`:''}
      ${hasOppAuto?`<div class="${hasC1Auto?'pt-1 border-t border-white/10 ':''}space-y-1 min-w-0"><div class="text-[10px] font-extrabold text-indigo-300 leading-tight">⚔️ ${esc(T.opp.oppName)} (${esc(T.opp.oppRollCat||'Test')} • invertiert):</div><div class="flex flex-wrap items-center gap-1 min-w-0">${oppSrc.map(fmtSrcChip).join('')}</div></div>`:''}
      ${hasHiddenOppModNote?`<div class="${hasC1Auto?'pt-1 border-t border-white/10 ':''}text-[10px] font-bold text-indigo-300/90">🔒 Gegner-Modifikatoren von ${esc(T.opp.oppName)} werden im Hintergrund verrechnet.</div>`:''}
      ${hasAdvDisAdj?`<div class="${(hasC1Auto||hasOppAuto||hasHiddenOppModNote)?'pt-1 border-t border-white/10 ':''}flex flex-wrap items-center gap-1 min-w-0">${manChips.join('')}</div>`:''}
    </div>`:''}
  </div>`:''}
  ${(T.sitOptions&&T.sitOptions.length)?`<div class="flex flex-wrap items-center gap-1 pt-0.5 min-w-0"><span class="text-[10px] font-extrabold t-mut uppercase mr-0.5">Situativ:</span>${T.sitOptions.map(so=>{const badge=so.reduceDis?`−${so.reduceDis}N`:so.adv?`+${so.adv}V`:so.dis?`+${so.dis}N`:'±0';const tipTxt=so.items.map(i=>`${i.srcName}: ${i.label}`).join('\n')+(so.counterNote?`\nVerrechnung: ${so.counterNote}`:'');return `<button type="button" data-action="toggle-dice-sit" data-sit="${esc(so.sitKey)}" data-tip="${esc(tipTxt)}" class="btn py-0.5 px-2 text-[11px] font-bold tabular max-w-full ${so.active?(so.dis>0&&!so.adv?'bg-rose-600 text-white border-rose-500':'btn-ok'):'opacity-85 hover:opacity-100'}"><span>${so.active?'☑':'☐'}</span><span class="break-words">${esc(so.sitLabel)} (${badge})</span></button>`;}).join('')}</div>`:''}
  ${(!hideOpp&&T.opp?.ready&&T.oppSitOptions&&T.oppSitOptions.length)?`<div class="flex flex-wrap items-center gap-1 pt-0.5 min-w-0"><span class="text-[10px] font-extrabold text-indigo-300 uppercase mr-0.5">⚔️ ${esc(T.opp.oppName)}:</span>${T.oppSitOptions.map(so=>{const badge=so.reduceDis?`−${so.reduceDis}N`:so.adv?`+${so.adv}V→N`:so.dis?`+${so.dis}N→V`:'±0';const tipTxt=so.items.map(i=>`${i.srcName}: ${i.label}`).join('\n');return `<button type="button" data-action="toggle-dice-opp-sit" data-sit="${esc(so.sitKey)}" data-tip="${esc(tipTxt)}" class="btn py-0.5 px-2 text-[11px] font-bold tabular max-w-full ${so.active?(so.adv>0&&!so.dis?'bg-rose-600 text-white border-rose-500':'btn-ok'):'opacity-85 hover:opacity-100'}"><span>${so.active?'☑':'☐'}</span><span class="break-words">${esc(so.sitLabel)} (${badge})</span></button>`;}).join('')}</div>`:''}`;
}
export const buildThresholdInnerHtml=T=>{
  const c1Lbl=T.opp?.ready?(isLobbyNeutralDice()?(CLOUD.currentUser||'Gast'):(String(S.profile?.name||'').trim()||'Wert')):'Wert';
  const dLbl=T.opp?.ready?T.opp.oppName:'Schw.';
  const hideOpp=Boolean(T.opp?.ready&&T.opp?.hideDetails);
  const formulaLine=hideOpp
    ?`${T.cv} (${esc(c1Lbl)}) vs. 👹 ${esc(dLbl)} (verborgen)`
    :`${T.cv} + 50 − ${T.dv} ${T.bonus>=0?'+ '+T.bonus:'− '+Math.abs(T.bonus)}${T.effTh?` (inkl. ${fmtSign(T.effTh)})`:''}`;
  return `<div class="flex items-baseline gap-2 flex-wrap min-w-0">
    <span class="text-3xl sm:text-4xl font-black tabular leading-none">${T.th}</span>
    <span class="px-1.5 py-0.5 rounded-md bg-acc-soft border bdr-acc text-acc text-[11px] font-black tabular">${T.chance}%</span>
  </div>
  <div class="text-[10px] t-mut tabular truncate mt-0.5" data-tip="${esc(formulaLine+' = '+T.th)}">Schwelle ≤ ${T.th} • ${formulaLine}</div>
  ${T.rollMod?`<div class="text-[10px] font-extrabold text-cyan-300 mt-0.5">⚡ Wurf ${fmtSign(T.rollMod)} (${esc((T.rollModSrc||[]).map(x=>x.tagLbl||x.srcName).join(', '))})</div>`:''}`;
};

export function renderDice(){
  const mount=$('diceMount'), p=mount, bd=$('diceBackdrop'), xl=window.innerWidth>=1280;
  if(!mount||!bd) return;
  const snap = mount.childElementCount>0 ? captureScrollState(mount) : null;
  applyWinFrame('dice', mount, bd, WIN_DEFAULTS.dice.dockClass); if(!D.open){mount.innerHTML='';return;}
  const isNeutral=isLobbyNeutralDice(), secAct=isSecretRollActive();
  const T=calcThreshold(), ci=CRIT_SEQ.indexOf(D.crit), cs=getCSkVal(), ds=getDSkVal();

  let secretBannerHtml='';
  if(CLOUD.isAdmin && UI.lastSecretRollId){
    const sr=(CLOUD.secretRolls||[]).find(x=>x&&x.id===UI.lastSecretRollId);
    if(sr){
      secretBannerHtml=!sr.revealed
        ?`<div class="subcard p-2 border-2 border-amber-400 bg-gradient-to-r from-amber-500/20 via-purple-500/20 to-amber-500/20 flex flex-wrap items-center justify-between gap-2 shadow">
          <span class="text-xs font-black text-amber-200">🕵️ Geheimwurf (${esc(sr.originalTs||sr.ts||'')})</span>
          <button type="button" data-action="reveal-secret-roll" data-id="${esc(sr.id)}" class="btn py-1 px-2.5 text-xs font-black bg-amber-500 text-slate-950 border-amber-300 hover:brightness-110">👁️ Im Live-Feed enthüllen</button>
        </div>`
        :`<div class="subcard py-1.5 px-2.5 border border-emerald-500/60 bg-emerald-500/15 text-emerald-300 text-xs font-extrabold">✓ Geheimwurf enthüllt (${esc(sr.revealedAt||'')})</div>`;
    }
  }
  const secretListArr=CLOUD.isAdmin?(CLOUD.secretRolls||[]):[];
  const secretListHtml=secretListArr.length?`<div class="subcard py-2 px-2.5 border border-purple-400/40 bg-purple-500/5 space-y-2">
    <div class="flex items-center justify-between gap-2">
      <button type="button" data-action="toggle-secret-list" class="flex items-center gap-1.5 text-left min-w-0 flex-1 cursor-pointer">
        <span class="text-xs font-black text-amber-300 w-3.5 shrink-0">${UI.secretRollsCollapsed?'▸':'▾'}</span>
        <span class="text-xs font-extrabold text-amber-200 truncate">🕵️ Geheimwürfe (${secretListArr.length})</span>
      </button>
      <button type="button" data-action="clear-secret-rolls" class="text-[10px] font-bold t-mut hover:text-rose-400 cursor-pointer shrink-0">Leeren</button>
    </div>
    ${!UI.secretRollsCollapsed?`<div data-scroll-key="diceSecretLog" class="space-y-1.5 max-h-48 overflow-y-auto pr-0.5">${secretListArr.map(r=>`<div class="p-1.5 px-2 rounded-lg space-y-0.5 border ${r.revealed?'border-emerald-500/40 bg-emerald-500/10':'border-amber-400/40 bg-black/25'} min-w-0">
      <div class="flex items-center justify-between gap-2 min-w-0"><span class="text-[11px] font-extrabold truncate text-acc">${esc(r.label||'Freie Probe')}</span><span class="text-[10px] t-mut tabular shrink-0">${esc(r.originalTs||r.ts||'')}</span></div>
      <div class="flex flex-wrap items-center justify-between gap-1.5 min-w-0"><span class="text-[11px] font-bold tabular break-words min-w-0">${esc(formatSecretRollSummary(r))}</span>${!r.revealed?`<button type="button" data-action="reveal-secret-roll" data-id="${esc(r.id)}" class="btn py-0.5 px-2 text-[10px] font-black bg-amber-500 text-slate-950 border-amber-300 shrink-0">👁️ Enthüllen</button>`:`<span class="text-[10px] font-extrabold text-emerald-300 tabular shrink-0">✓ Enthüllt</span>`}</div>
    </div>`).join('')}</div>`:''}
  </div>`:'';

  const skOpts=cur=>['0','10','15','20','30','custom'].map(v=>`<option value="${v}" ${cur===v?'selected':''}>${v==='custom'?'Eigener...':'+'+v}</option>`).join('');
  const DIFF_PRESETS=[20,30,40,50,60,70,80];

  const opps=D.dMode==='character'?getCampaignOpponents():[];
  const renderOppTopCompact=()=>{
    const activeCamp=getActiveDiceCampaignId();
    const isGmHere=canManageCampaign(activeCamp);
    const enemyOpps=opps.filter(o=>o.isEnemy);
    const charOpps=opps.filter(o=>!o.isEnemy);
    const fmtOppOpt=o=>{
      const pfx=o.isEnemy?(isGmHere?(o.diceVisible?'👹 👁️ ':'👹 🙈 '):'👹 '):'';
      const sfx=o.isSelf?' (Aktiv)':(o.isEnemy&&isGmHere&&!o.diceVisible?' (SL)':'');
      return `<option value="${esc(o.id)}" ${D.oppCharId===o.id?'selected':''}>${pfx}${esc(o.name)}${sfx}</option>`;
    };
    const pickerOptsHtml=opps.length
      ?(enemyOpps.length&&charOpps.length
        ?`<optgroup label="👹 Gegner (${enemyOpps.length})">${enemyOpps.map(fmtOppOpt).join('')}</optgroup><optgroup label="👥 Charaktere (${charOpps.length})">${charOpps.map(fmtOppOpt).join('')}</optgroup>`
        :opps.map(fmtOppOpt).join(''))
      :'<option value="">Keine Ziele in Kampagne</option>';
    const opp=T.opp;
    const loading=Boolean(opp?.loading||isForeignSheetLoading(D.oppCharId));
    const hideOpp=Boolean(opp?.hideDetails);
    const summaryChip=opp?.ready
      ?(hideOpp?`<div class="text-[11px] font-bold text-indigo-300 truncate">🔒 ${esc(opp.oppKind==='attr'?opp.attrKey:opp.oppRollCat)} (verborgen)</div>`
        :`<div class="text-xs font-extrabold text-indigo-300 truncate tabular">${esc(opp.oppShortLabel)}</div>`)
      :(loading?`<div class="text-[11px] text-acc font-bold">⏳ Lade Ziel...</div>`:`<div class="text-[11px] t-mut">Ziel auswählen</div>`);
    return `<div class="flex items-center gap-1.5 min-w-0">
      <select data-dice-opp="charId" aria-label="Gegner-Charakter wählen" class="inp flex-1 min-w-0 font-bold text-xs py-1">${pickerOptsHtml}</select>
      <button type="button" data-action="refresh-dice-opp" data-tip="Aktuellen Stand des Gegners aus der Cloud nachladen" class="btn w-7 h-7 p-0 text-xs shrink-0 ${loading?'animate-spin':''}" ${loading?'disabled':''}>🔄</button>
    </div>
    <div class="flex items-center justify-between gap-1.5 pt-0.5 min-w-0">${summaryChip}</div>`;
  };

  const renderOppDetailTray=()=>{
    if(D.dMode!=='character') return '';
    const opp=T.opp;
    const hideOpp=Boolean(opp?.hideDetails);
    const loading=Boolean(opp?.loading||isForeignSheetLoading(D.oppCharId));
    const errMsg=opp?.error||getForeignSheetError(D.oppCharId);
    if(!opps.length){
      return `<div class="subcard py-2 px-2.5 border border-indigo-400/40 bg-indigo-500/5 text-[11px] t-mut">Noch keine Charaktere oder freigeschalteten Gegner in dieser Kampagne geladen. Klicke oben auf <strong>🔄</strong>.</div>`;
    }
    if(loading&&!opp?.ready){
      return `<div class="subcard py-2 px-2.5 border border-indigo-400/40 bg-indigo-500/5 text-[11px] text-acc font-bold">⏳ Lade Ziel-Daten aus der Cloud...</div>`;
    }
    if(!opp?.ready){
      return errMsg?`<div class="subcard py-2 px-2.5 border border-rose-500/40 bg-rose-500/10 text-[11px] text-rose-300 font-bold">⚠️ ${esc(errMsg)}</div>`:'';
    }
    const oppSheet=opp.oppSheet, oppM=opp.oppM;
    const oppSkills=[...(oppSheet.skills||[])].filter(s=>s&&String(s.name||'').trim()).sort((a,b)=>String(a.name).localeCompare(String(b.name),'de'));
    const oppWeapons=[...(oppSheet.weapons||[])].filter(Boolean);
    const kindBar=hideOpp
      ?`<div class="inline-flex rounded-lg p-0.5 bg-black/25 border bdr-line text-[11px] shrink-0">
          <button type="button" data-action="dice-opp-kind" data-kind="preset" class="px-2 py-0.5 rounded font-extrabold ${opp.oppKind==='preset'?'bg-indigo-500/35 text-indigo-100':'t-mut'}">🛡️ Abwehr</button>
          <button type="button" data-action="dice-opp-kind" data-kind="attr" class="px-2 py-0.5 rounded font-extrabold ${opp.oppKind==='attr'?'bg-indigo-500/35 text-indigo-100':'t-mut'}">⚡ Attribut</button>
        </div>`
      :`<div class="inline-flex rounded-lg p-0.5 bg-black/25 border bdr-line text-[11px] shrink-0">
          <button type="button" data-action="dice-opp-kind" data-kind="preset" class="px-2 py-0.5 rounded font-extrabold ${opp.oppKind==='preset'?'bg-indigo-500/35 text-indigo-100':'t-mut'}">🛡️ Abwehr</button>
          <button type="button" data-action="dice-opp-kind" data-kind="attr" class="px-2 py-0.5 rounded font-extrabold ${opp.oppKind==='attr'?'bg-indigo-500/35 text-indigo-100':'t-mut'}">⚡ Attr.</button>
          <button type="button" data-action="dice-opp-kind" data-kind="skill" class="px-2 py-0.5 rounded font-extrabold ${opp.oppKind==='skill'?'bg-indigo-500/35 text-indigo-100':'t-mut'}">🎯 Fert.</button>
        </div>`;

    const outDuel=(DUEL.outgoing&&DUEL.outgoing.targetCharId===D.oppCharId)?DUEL.outgoing:null;
    let duelRightHtml='', duelStatusBanner='';
    if(outDuel&&outDuel.status==='waiting'){
      const remSec=Math.max(0,Math.ceil((toInt(outDuel.expiresAt,Date.now())-Date.now())/1000));
      duelStatusBanner=`<div class="p-1.5 px-2 rounded-lg border border-indigo-400/55 bg-indigo-500/15 flex flex-wrap items-center justify-between gap-1.5 text-[11px]">
        <span class="font-extrabold text-indigo-200 truncate">⏳ Warte auf Konter (<span id="duelWaitCountdown" class="tabular">${remSec} s</span>)</span>
        <div class="flex items-center gap-1 shrink-0">
          <button type="button" data-action="duel-roll-now" class="btn btn-pri py-0.5 px-2 text-[10px] font-extrabold">🎲 Direkt würfeln</button>
          <button type="button" data-action="duel-cancel" class="btn py-0.5 px-1.5 text-[10px]">✕</button>
        </div>
      </div>`;
    }else if(outDuel&&outDuel.status==='responded'&&outDuel.response?.snapshot){
      const sp=outDuel.response.snapshot;
      const modTxt=(sp.autoAdv||sp.autoDis)?` (${sp.autoAdv?`+${sp.autoAdv}V`:''}${sp.autoAdv&&sp.autoDis?'/':''}${sp.autoDis?`+${sp.autoDis}N`:''})`:'';
      duelStatusBanner=`<div class="p-1.5 px-2 rounded-lg border border-emerald-400/60 bg-emerald-500/15 flex items-center justify-between gap-2 text-[11px]">
        <span class="font-extrabold text-emerald-200 truncate">${hideOpp?`✅ ${esc(opp.oppName)} hat gekontert (verborgen)`:`✅ Konter: ${esc(sp.oppShortLabel)}${esc(modTxt)}${outDuel.response.useInspiration?' • ✨':''}`}</span>
        <button type="button" data-action="duel-clear-status" data-tip="Live-Antwort lösen" class="btn w-5 h-5 p-0 text-[10px] shrink-0">✕</button>
      </div>`;
    }else if(outDuel&&(outDuel.status==='timeout'||outDuel.status==='declined')){
      const reason=outDuel.status==='declined'?'Ignoriert':'Timeout';
      duelStatusBanner=`<div class="p-1.5 px-2 rounded-lg border border-amber-400/50 bg-amber-500/10 flex items-center justify-between gap-1.5 text-[10px]">
        <span class="font-bold text-amber-200">⏱️ ${reason} – lokaler Stand aktiv</span>
        <div class="flex items-center gap-1"><button type="button" data-action="duel-send" class="btn py-0.5 px-1.5 text-[10px]">🔄 Erneut</button><button type="button" data-action="duel-clear-status" class="btn w-5 h-5 p-0 text-[10px]">✕</button></div>
      </div>`;
    }else if(opp.charId){
      duelRightHtml=`<button type="button" data-action="duel-send" data-tip="Schickt ${opp.isEnemy?'der Spielleitung':'dem Spieler von '+esc(opp.oppName)} eine Live-Konter-Anfrage" class="btn py-0.5 px-2 text-[11px] font-extrabold border-indigo-400/50 bg-indigo-500/15 text-indigo-200 hover:bg-indigo-500/25 shrink-0">📨 Konter</button>`;
    }

    let detailHtml='';
    if(opp.oppKind==='preset'){
      const showAtkPreset=Boolean(D.wRollCat==='Parieren'||D.wRollCat==='Blocken'||D.wRollCat==='Ausweichen'||opp.oppPreset==='attack');
      const presetBtns=[
        {k:'dodge',l:'💨 Ausw.',tip:'Ausweichen (GW + Fertigkeit)'},
        {k:'parry',l:'🛡️ Par.',tip:'Parieren (PR + Waffe + Fertigkeit)'},
        {k:'block',l:'🧱 Block.',tip:'Blocken (ST + Waffe/Schild + Fertigkeit)'}
      ];
      if(showAtkPreset) presetBtns.push({k:'attack',l:'⚔️ Angr.',tip:'Waffenangriff des Gegners'});
      if(hideOpp){
        detailHtml=`<div class="grid ${presetBtns.length===4?'grid-cols-2 sm:grid-cols-4':'grid-cols-3'} gap-1">${presetBtns.map(pb=>`<button type="button" data-action="dice-opp-preset" data-preset="${pb.k}" data-tip="${esc(pb.tip)}" class="btn py-1 px-1 text-[11px] font-extrabold ${opp.oppPreset===pb.k?'btn-pri':''}">${pb.l}</button>`).join('')}</div>`;
      }else{
        const needsWeapon=opp.oppPreset==='parry'||opp.oppPreset==='block'||opp.oppPreset==='attack';
        const curWpVal=D.oppWeaponId==='__none__'?'__none__':(opp.oppCombatRef||'__none__');
        const curSkVal=D.oppSkillId==='__none__'?'__none__':(opp.sk?.id||'__none__');
        let oppItemOptsHtml='';
        if(needsWeapon){
          const fmtOppShieldOpt=sh=>{
            const nm=String(sh.name||'').trim()||'Schild';
            const bmS=formatBlockModShort(sh.blockMod);
            const eqTag=sh.equipped===false?' (Abgel.)':'';
            return `<option value="shield:${esc(sh.id)}" ${curWpVal===`shield:${sh.id}`?'selected':''}>🛡️ ${esc(nm)} (${bmS} • gRP ${esc(sh.grp)})${eqTag}</option>`;
          };
          const fmtOppWeaponOpt=w=>{
            const wn=String(w.name||'').trim()||getWeaponSubtype(w.wType).label;
            const eqTag=w.equipped===false?' (Abgel.)':'';
            return `<option value="${esc(w.id)}" ${curWpVal===w.id?'selected':''}>🗡️ ${esc(wn)}${eqTag}</option>`;
          };
          if(opp.oppPreset==='block'){
            const {shields:oppShields,blockWeapons:oppBlkWps}=getSheetBlockOptions(oppSheet);
            const shGrp=oppShields.length?`<optgroup label="🛡️ Schilde">${oppShields.map(fmtOppShieldOpt).join('')}</optgroup>`:'';
            const wpGrp=oppBlkWps.length?`<optgroup label="⚔️ Blockfähige Waffen">${oppBlkWps.map(fmtOppWeaponOpt).join('')}</optgroup>`:'';
            oppItemOptsHtml=`<option value="__none__" ${curWpVal==='__none__'?'selected':''}>Ohne Schild / Block-Waffe</option>${shGrp}${wpGrp}`;
          }else if(opp.oppPreset==='attack'){
            const oppShields=getSheetShields(oppSheet);
            const shGrp=oppShields.length?`<optgroup label="🛡️ Schilde (Schildangriff)">${oppShields.map(fmtOppShieldOpt).join('')}</optgroup>`:'';
            oppItemOptsHtml=`<option value="__none__" ${curWpVal==='__none__'?'selected':''}>Ohne Waffe</option>${oppWeapons.map(fmtOppWeaponOpt).join('')}${shGrp}`;
          }else{
            oppItemOptsHtml=`<option value="__none__" ${curWpVal==='__none__'?'selected':''}>Ohne Waffe</option>${oppWeapons.map(fmtOppWeaponOpt).join('')}`;
          }
        }
        detailHtml=`<div class="grid ${presetBtns.length===4?'grid-cols-2 sm:grid-cols-4':'grid-cols-3'} gap-1">${presetBtns.map(pb=>`<button type="button" data-action="dice-opp-preset" data-preset="${pb.k}" data-tip="${esc(pb.tip)}" class="btn py-1 px-1 text-[11px] font-extrabold ${opp.oppPreset===pb.k?'btn-pri':''}">${pb.l}</button>`).join('')}</div>
        <div class="grid grid-cols-1 ${needsWeapon?'sm:grid-cols-2':''} gap-1.5">
          ${needsWeapon?`<select data-dice-opp="weaponId" aria-label="Waffe oder Schild des Gegners" class="inp w-full text-xs font-bold py-1">${oppItemOptsHtml}</select>`:''}
          <select data-dice-opp="skillId" aria-label="Fertigkeit des Gegners" class="inp w-full text-xs font-bold py-1"><option value="__none__" ${curSkVal==='__none__'?'selected':''}>${opp.attrKey} ${opp.attrVal} (Ohne Fert.)</option>${oppSkills.map(sk=>{const b=getSkBonus(sk);return `<option value="${esc(sk.id)}" ${curSkVal===sk.id?'selected':''}>🎯 ${esc(sk.name)} (${fmtSign(b)})</option>`;}).join('')}</select>
        </div>`;
      }
    }else if(opp.oppKind==='attr'){
      detailHtml=`<div class="grid grid-cols-4 sm:grid-cols-8 gap-1">${ATTRS.map(a=>{const v=getAttrTot(a.k,oppM,oppSheet);return `<button type="button" data-action="dice-opp-attr" data-attr="${a.k}" class="btn py-1 px-0.5 flex-col gap-0 ${opp.attrKey===a.k?'btn-pri':''}"><span class="text-[9px]">${a.k}</span><span class="text-xs font-black tabular">${hideOpp?'??':v}</span></button>`;}).join('')}</div>`;
    }else{
      if(oppSkills.length){
        const curSkId=opp.sk?.id||oppSkills[0].id;
        detailHtml=`<select data-dice-opp="skillId" aria-label="Fertigkeit des Gegners" class="inp w-full text-xs font-bold py-1">${oppSkills.map(sk=>{const av=getAttrTot(sk.linkedAttr||'PR',oppM,oppSheet),b=getSkBonus(sk);return `<option value="${esc(sk.id)}" ${curSkId===sk.id?'selected':''}>${esc(sk.name)} • ${sk.linkedAttr||'PR'} ${av} ${fmtSign(b)} = ${av+b}</option>`;}).join('')}</select>`;
      }else{
        detailHtml=`<div class="text-[11px] t-mut">Dieser Charakter hat keine Fertigkeiten eingetragen.</div>`;
      }
    }
    const oppSizeInfo=getCharSizeInfo(oppSheet);
    const selfSizeInfo=isLobbyNeutralDice()?{level:0,lvlStr:'0',formatted:'Normal (0)'}:getCharSizeInfo(S);
    const hitSizeDiff=oppSizeInfo.level-selfSizeInfo.level;
    const isHitRoll=D.wRollCat==='Trefferwurf';
    const sizeBadgeCls=(isHitRoll&&hitSizeDiff!==0)
      ?(hitSizeDiff>0?'border-emerald-400/55 bg-emerald-500/15 text-emerald-200':'border-rose-400/55 bg-rose-500/15 text-rose-200')
      :(oppSizeInfo.level!==0?'border-amber-400/45 bg-amber-500/10 text-amber-200':'bdr-line bg-black/25 t-mut');
    const sizeTip=`Ziel-Größe: ${oppSizeInfo.formatted} • Eigene Größe: ${selfSizeInfo.formatted}${hitSizeDiff!==0?`\nAuf Trefferwürfe: ${hitSizeDiff>0?`+${hitSizeDiff} Vorteil${hitSizeDiff===1?'':'e'}`:`+${Math.abs(hitSizeDiff)} Nachteil${Math.abs(hitSizeDiff)===1?'':'e'}`}`:'\nKein Größenunterschied (±0)'}`;
    return `<div class="subcard p-2.5 border border-indigo-400/45 bg-indigo-500/8 space-y-2 min-w-0">
      <div class="flex flex-wrap items-center justify-between gap-1.5 min-w-0">
        <div class="flex flex-wrap items-center gap-1.5 min-w-0">
          <span class="text-[10px] font-black text-indigo-300 uppercase tracking-wider shrink-0">⚔️ Ziel</span>
          ${kindBar}
          <span data-tip="${esc(sizeTip)}" class="px-1.5 py-0.5 rounded-md border text-[10px] font-extrabold tabular cursor-help shrink-0 ${sizeBadgeCls}">📏 ${esc(oppSizeInfo.formatted)}${(isHitRoll&&hitSizeDiff!==0)?` (${hitSizeDiff>0?`+${hitSizeDiff}V`:`+${Math.abs(hitSizeDiff)}N`})`:''}</span>
        </div>
        ${duelRightHtml}
      </div>
      ${errMsg?`<div class="text-[10px] text-amber-300 font-bold">⚠️ ${esc(errMsg)}</div>`:''}
      ${duelStatusBanner}
      ${detailHtml}
      <div class="text-[10px] font-bold text-indigo-300/90 text-right tabular truncate">${esc(hideOpp?`🔒 ${opp.oppName} • Details verborgen`:opp.oppBreak)}</div>
    </div>`;
  };

  const vbox=(ttl,mAct,mode,dirF,aF,sF,cF,mId,mCol,sVal,aL,sL)=>{
    const wKey=dirF==='cDirect'?'c':'d';
    const isDiffChanged=wKey==='d'&&(getEffD()!==40||D.dMode!=='direct');
    const diffResetBtn=wKey==='d'?`<button type="button" id="btnResetDiceDiff" data-action="reset-dice-diff" data-tip="Schwierigkeit auf 40 zurücksetzen" class="btn py-0 px-1.5 h-5 text-[10px] font-extrabold tabular ${isDiffChanged?'!border-amber-400 !bg-amber-500/25 text-amber-300':'opacity-65 hover:opacity-100'}">↺40</button>`:'';
    const diffPresetBar=(wKey==='d'&&mode!=='character')?`<div class="grid grid-cols-7 gap-0.5 pt-0.5" data-diff-presets="1">${DIFF_PRESETS.map(v=>{const active=D.dMode==='direct'&&toInt(D.dDirect)===v;return `<button type="button" data-action="dice-set-diff" data-val="${v}" class="btn py-0.5 px-0 text-[10px] tabular ${active?'btn-pri font-black':'opacity-80 hover:opacity-100'}">${v}</button>`;}).join('')}</div>`:'';
    const modeBtns=wKey==='d'
      ?`<div class="inline-flex rounded-lg p-0.5 bg-black/25 border bdr-line text-[10px] shrink-0"><button type="button" data-action="${mAct}" data-mode="direct" class="px-1.5 py-0.5 rounded font-bold ${mode==='direct'?'bg-acc-soft text-acc':'t-mut'}">Direkt</button><button type="button" data-action="${mAct}" data-mode="breakdown" class="px-1.5 py-0.5 rounded font-bold ${mode==='breakdown'?'bg-acc-soft text-acc':'t-mut'}">Split</button><button type="button" data-action="${mAct}" data-mode="character" data-tip="Gegen Charakterbogen oder Gegner würfeln" class="px-1.5 py-0.5 rounded font-bold ${mode==='character'?'bg-indigo-500/35 text-indigo-200':'t-mut'}">⚔️ Ziel</button></div>`
      :`<div class="inline-flex rounded-lg p-0.5 bg-black/25 border bdr-line text-[10px] shrink-0"><button type="button" data-action="${mAct}" data-mode="direct" class="px-1.5 py-0.5 rounded font-bold ${mode==='direct'?'bg-acc-soft text-acc':'t-mut'}">Direkt</button><button type="button" data-action="${mAct}" data-mode="breakdown" class="px-1.5 py-0.5 rounded font-bold ${mode==='breakdown'?'bg-acc-soft text-acc':'t-mut'}">Aufgeschl.</button></div>`;
    const bodyContent=(wKey==='d'&&mode==='character')
      ?renderOppTopCompact()
      :(mode==='direct'
        ?`<input data-dice="${dirF}" data-tip="Mausrad drehen für ±1" type="text" inputmode="numeric" value="${D[dirF]}" class="inp w-full text-lg font-black tabular py-1"/>`
        :`<div class="grid grid-cols-2 gap-1.5"><div><label class="block text-[9px] font-bold t-mut uppercase">${aL}</label><input data-dice="${aF}" data-tip="Mausrad drehen für ±1" type="text" inputmode="numeric" value="${D[aF]}" class="inp w-full font-bold tabular py-1"/></div><div><label class="block text-[9px] font-bold t-mut uppercase">${sL}</label><select data-dice-sel="${sF}" class="inp w-full font-bold py-1">${skOpts(D[sF])}</select></div></div>${D[sF]==='custom'?`<input data-dice="${cF}" type="text" inputmode="numeric" value="${D[cF]}" class="inp w-full text-xs font-bold py-1"/>`:''}<div id="${mId}" class="text-[11px] font-extrabold ${mCol} text-right tabular">${D[aF]} + ${sVal} = ${toInt(D[aF])+sVal}</div>`);
    return `<div class="subcard p-2.5 space-y-1.5 min-w-0 ${wKey==='d'&&mode==='character'?'border-indigo-400/55 bg-indigo-500/5':''}"><div class="flex items-center justify-between gap-1 min-w-0"><div class="flex items-center gap-1 min-w-0"><span class="text-[11px] font-extrabold uppercase tracking-wider truncate">${ttl}</span>${diffResetBtn}</div>${modeBtns}</div>${bodyContent}${diffPresetBar}</div>`;
  };

  const renderContextCard=()=>{
    const rawCat=D.wRollCat==='Parade'?'Parieren':D.wRollCat;
    const curCat=['Normaler Test','Trefferwurf','Parieren','Blocken','Ausweichen'].includes(rawCat)?rawCat:(D.weaponId?'Trefferwurf':D.shieldId?'Blocken':'Normaler Test');
    const modeBtns=[
      {c:'Normaler Test',l:'📋 Test'},
      {c:'Trefferwurf',l:'⚔️ Treffer'},
      {c:'Parieren',l:'🛡️ Par.'},
      {c:'Blocken',l:'🧱 Block'},
      {c:'Ausweichen',l:'💨 Ausw.'}
    ];
    const aw=(!isNeutral&&D.weaponId)?(S.weapons||[]).find(x=>x.id===D.weaponId):null;
    const ash=(!isNeutral&&D.shieldId)?(S.armors||[]).find(x=>x&&x.id===D.shieldId&&isArmorShield(x)):null;
    const activeItem=aw||ash;
    const wpApplies=activeItem?doesWeaponApplyToPool(activeItem,D.atkPool,curCat):true;
    const isHitMode=curCat==='Trefferwurf';
    const isBlockMode=curCat==='Blocken';
    const atkPool=D.atkPool==='mlp'?'mlp':'lp';
    const showWeaponBar=!isNeutral&&(isHitMode||curCat==='Parieren'||isBlockMode||Boolean(activeItem));

    let weaponRowHtml='';
    if(showWeaponBar){
      const weapons=S.weapons||[];
      const {shields:allShields,blockWeapons}=getSheetBlockOptions(S);
      const curSelVal=ash?`shield:${ash.id}`:(aw?aw.id:'__none__');
      const fmtSelfWeaponOpt=(w,sfx='')=>{
        const wSub=getWeaponSubtype(w.wType);
        const wNm=String(w.name||'').trim()||wSub.label;
        const wpPool=['lp','mlp','both'].includes(w.dmgPool)?w.dmgPool:'lp';
        const pTag=wpPool==='mlp'?' [mLP]':wpPool==='both'?' [LP+mLP]':'';
        const isEq=w.equipped!==false;
        const hTag=w.hand==='main'?' [HH]':w.hand==='off'?' [NH]':(w.hand==='both'||w.grip==='2h')?' [2H]':'';
        const eqTag=isEq?'':' (Abgelegt)';
        const wm=getWeaponRollMeta(w);
        return `<option value="${esc(w.id)}" ${curSelVal===w.id?'selected':''}>${wSub.icon} ${esc(wNm)}${hTag}${pTag}${sfx}${eqTag} (${wm.pool})</option>`;
      };
      const fmtSelfShieldOpt=sh=>{
        const shNm=String(sh.name||'').trim()||'Schild';
        const shPool=['lp','mlp','both'].includes(sh.dmgPool)?sh.dmgPool:'lp';
        const pTag=isHitMode?(shPool==='mlp'?' [mLP]':shPool==='both'?' [LP+mLP]':''):'';
        const isEq=sh.equipped!==false;
        const eqTag=isEq?'':' (Abgelegt)';
        const sm=getShieldRollMeta(sh);
        const bmTag=isBlockMode?` [${formatBlockModShort(sm.blockMod)} • gRP ${sh.grp}]`:` [gRP ${sh.grp}]`;
        return `<option value="shield:${esc(sh.id)}" ${curSelVal===`shield:${sh.id}`?'selected':''}>🛡️ ${esc(shNm)}${bmTag}${pTag}${eqTag} (${sm.pool})</option>`;
      };

      let selOptsHtml='';
      if(isBlockMode){
        const shGrp=allShields.length?`<optgroup label="🛡️ Schilde">${allShields.map(fmtSelfShieldOpt).join('')}</optgroup>`:'';
        const blkGrp=blockWeapons.length?`<optgroup label="⚔️ Blockfähige Waffen">${blockWeapons.map(w=>fmtSelfWeaponOpt(w,' [Blockfähig]')).join('')}</optgroup>`:'';
        const nonBlkFallback=(aw&&!isWeaponBlockable(aw))?`<optgroup label="Sonstige Waffe">${fmtSelfWeaponOpt(aw,' (nicht blockfähig)')}</optgroup>`:'';
        selOptsHtml=`<option value="__none__" ${curSelVal==='__none__'?'selected':''}>✊ Ohne Schild / Block-Waffe</option>${shGrp}${blkGrp}${nonBlkFallback}`;
      }else if(isHitMode){
        const wpGrp=weapons.length?(allShields.length?`<optgroup label="⚔️ Waffen">${weapons.map(w=>fmtSelfWeaponOpt(w)).join('')}</optgroup>`:weapons.map(w=>fmtSelfWeaponOpt(w)).join('')):'';
        const shGrp=allShields.length?`<optgroup label="🛡️ Schilde (Schildangriff)">${allShields.map(fmtSelfShieldOpt).join('')}</optgroup>`:'';
        selOptsHtml=`<option value="__none__" ${curSelVal==='__none__'?'selected':''}>✊ Ohne Waffe / Waffenlos</option>${wpGrp}${shGrp}`;
      }else{
        selOptsHtml=`<option value="__none__" ${curSelVal==='__none__'?'selected':''}>✊ Ohne Waffe / Waffenlos</option>${weapons.map(w=>fmtSelfWeaponOpt(w)).join('')}`;
      }

      let blockInfoStripHtml='';
      if(isBlockMode){
        if(ash){
          const bmVal=toInt(ash.blockMod,0);
          const bmCls=bmVal>0?'text-emerald-300':bmVal<0?'text-rose-300':'t-mut';
          blockInfoStripHtml=`<div class="px-2 py-1.5 rounded-lg border border-cyan-400/45 bg-cyan-500/10 text-[11px] flex flex-wrap items-center justify-between gap-1.5 tabular">
            <span class="font-bold text-cyan-200">🛡️ Schild-Block: <strong class="text-emerald-300">gRP ${esc(ash.grp)}</strong> (Sn ${esc(ash.protCut)} / Dß ${esc(ash.protPierce)} / Es ${esc(ash.protImpact)}${toInt(ash.mentalProt,0)?` / mRS ${esc(ash.mentalProt)}`:''}) + Zonenrüstung</span>
            <span class="font-black ${bmCls} shrink-0">Block-Mod ${esc(formatBlockModLong(bmVal))}</span>
          </div>`;
        }else if(aw&&isWeaponBlockable(aw)){
          blockInfoStripHtml=`<div class="px-2 py-1 rounded-lg border border-emerald-400/40 bg-emerald-500/10 text-[11px] font-bold text-emerald-200">🧱 Blockfähige Waffe aktiv → reduziert Schaden bei erfolgreichem Block um <strong>−2</strong> (Angreifer zählt statisch als 3 EG, kein Krit)</div>`;
        }else if(!allShields.length&&!blockWeapons.length){
          blockInfoStripHtml=`<div class="px-2 py-1 rounded-lg border bdr-line bg-black/20 text-[10px] t-mut">ℹ️ Keine Schilde (unter Rüstungen) oder Waffen mit Tag „Blockfähig“ eingetragen.</div>`;
        }
      }

      const mismatchHtml=(activeItem&&!wpApplies)?`<div class="p-2 rounded-lg border border-amber-400/55 bg-amber-500/12 text-[11px] flex flex-wrap items-center justify-between gap-1.5">
        <span class="font-bold text-amber-200 min-w-0">⚠️ <strong>${esc(String(activeItem.name||'').trim()||(ash?'Schild':getWeaponSubtype(activeItem.wType).label))}</strong> gilt nur für ${activeItem.dmgPool==='mlp'?'🧠 mLP':'❤️ LP'} – pausiert für diesen ${atkPool==='mlp'?'🧠 mLP':'❤️ LP'}-Trefferwurf.</span>
        <div class="flex items-center gap-1 shrink-0">
          <button type="button" data-action="${ash?'set-ar-dmgpool':'dice-wp-set-pool'}" data-id="${esc(activeItem.id)}" data-pool="both" class="btn py-0.5 px-2 text-[10px] font-black border-purple-400/60 bg-purple-500/20 text-purple-200">Für Beide freigeben</button>
          <button type="button" data-action="dice-clear-weapon-only" class="btn py-0.5 px-2 text-[10px] font-bold">Ohne</button>
        </div>
      </div>`:'';

      const dwInfo=(aw&&isHitMode&&wpApplies)?getWeaponDualWieldInfo(aw,S):null;
      const dwOvr=String(D.dualWieldOvr||'auto');
      const showDwBar=Boolean(dwInfo&&(dwInfo.isDualWield||dwOvr!=='auto'));
      const dwPeer=dwInfo?.peers?.[0]||null;
      const dwBarHtml=showDwBar?`<div class="p-2 rounded-lg border ${dwOvr==='off'?'bdr-line bg-black/20':'border-rose-400/50 bg-rose-500/10'} text-[11px] space-y-1.5 min-w-0">
        <div class="flex flex-wrap items-center justify-between gap-1.5">
          <span class="font-extrabold ${dwOvr==='off'?'t-mut':'text-rose-200'}">⚔️ Mehrhändiger Kampf${dwInfo.isDualWield?` (${dwInfo.label}: +${dwInfo.dis}N)`:''}</span>
          ${dwPeer?`<button type="button" data-action="dice-switch-dw-weapon" data-id="${esc(dwPeer.id)}" data-tip="Sofort zur Waffe in der anderen Hand wechseln" class="btn py-0.5 px-2 text-[10px] font-black bdr-acc bg-acc-soft text-acc shrink-0">⇄ ${esc(String(dwPeer.name||'').trim()||'Andere Hand')}</button>`:''}
        </div>
        <div class="flex flex-wrap items-center gap-1 text-[10px]">
          <span class="t-mut font-bold mr-0.5">Malus:</span>
          <button type="button" data-action="set-dice-dw-ovr" data-ovr="auto" class="btn py-0.5 px-1.5 text-[10px] font-extrabold ${dwOvr==='auto'?'btn-pri':''}">Auto${dwInfo.isDualWield?` (+${dwInfo.dis}N)`:''}</button>
          <button type="button" data-action="set-dice-dw-ovr" data-ovr="main" class="btn py-0.5 px-1.5 text-[10px] font-extrabold ${dwOvr==='main'?'bg-rose-600 text-white border-rose-500':''}">🖐️ HH (+1N)</button>
          <button type="button" data-action="set-dice-dw-ovr" data-ovr="offhand" class="btn py-0.5 px-1.5 text-[10px] font-extrabold ${dwOvr==='offhand'?'bg-rose-600 text-white border-rose-500':''}">🤚 NH (+2N)</button>
          <button type="button" data-action="set-dice-dw-ovr" data-ovr="off" class="btn py-0.5 px-1.5 text-[10px] font-extrabold ${dwOvr==='off'?'btn-ok':''}">Aus</button>
        </div>
      </div>`:'';

      let quickEditHtml='';
      if(aw&&D.wpEditOpen){
        const wPool=['lp','mlp','both'].includes(aw.dmgPool)?aw.dmgPool:'lp';
        const hasMas=isWeaponMassiv(aw);
        const isRng=aw.wType==='ranged';
        const isEq=aw.equipped!==false;
        quickEditHtml=`<div class="p-2.5 rounded-lg border bdr-acc bg-black/25 space-y-2 text-xs min-w-0">
          <div class="flex flex-wrap items-center justify-between gap-1.5 border-b border-white/10 pb-1.5">
            <div class="flex items-center gap-1.5">
              <span class="text-[10px] font-black text-acc uppercase tracking-wider">⚙️ Waffe anpassen</span>
              <button type="button" data-action="toggle-wp-eq" data-id="${esc(aw.id)}" class="btn py-0.5 px-1.5 text-[10px] font-extrabold ${isEq?'btn-ok':'opacity-70'}">${isEq?'✓ Angelegt':'○ Abgelegt'}</button>
            </div>
            <div class="inline-flex rounded-lg p-0.5 bg-black/30 border bdr-line text-[10px]">
              <button type="button" data-action="dice-wp-set-pool" data-id="${esc(aw.id)}" data-pool="lp" class="px-1.5 py-0.5 rounded font-black ${wPool==='lp'?'bg-rose-500/35 text-rose-200':'t-mut'}">❤️ LP</button>
              <button type="button" data-action="dice-wp-set-pool" data-id="${esc(aw.id)}" data-pool="mlp" class="px-1.5 py-0.5 rounded font-black ${wPool==='mlp'?'bg-indigo-500/35 text-indigo-200':'t-mut'}">🧠 mLP</button>
              <button type="button" data-action="dice-wp-set-pool" data-id="${esc(aw.id)}" data-pool="both" class="px-1.5 py-0.5 rounded font-black ${wPool==='both'?'bg-purple-500/35 text-purple-200':'t-mut'}">Beide</button>
            </div>
          </div>
          <div class="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
            <div class="min-w-0">
              <label class="block text-[9px] font-bold t-mut uppercase mb-0.5">Attribut${hasMas?' (Massiv→ST)':''}</label>
              <select data-dice-wp-edit="wAttr" data-wid="${esc(aw.id)}" ${hasMas?'disabled':''} class="inp w-full text-xs font-bold py-1">${ATTRS.map(a=>`<option value="${a.k}" ${(hasMas?'ST':aw.wAttr)===a.k?'selected':''}>${a.k} (${getAttrTot(a.k)})</option>`).join('')}</select>
            </div>
            <div class="min-w-0">
              <label class="block text-[9px] font-bold t-mut uppercase mb-0.5">Fertigkeit</label>
              <select data-dice-wp-edit="skillId" data-wid="${esc(aw.id)}" class="inp w-full text-xs font-bold py-1"><option value="" ${!aw.skillId?'selected':''}>Keine (+0)</option>${(S.skills||[]).map(sk=>`<option value="${esc(sk.id)}" ${aw.skillId===sk.id?'selected':''}>${esc(sk.name||'Fert.')} (${fmtSign(getSkBonus(sk))})</option>`).join('')}</select>
            </div>
            <div class="min-w-0 col-span-2 sm:col-span-1">
              <label class="block text-[9px] font-bold t-mut uppercase mb-0.5">Hand / Führung</label>
              <div class="grid grid-cols-3 gap-1">
                <button type="button" data-action="set-wp-hand" data-id="${esc(aw.id)}" data-hand="main" class="btn py-1 px-1 text-[10px] ${aw.hand==='main'?'btn-ok':''}">HH</button>
                <button type="button" data-action="set-wp-hand" data-id="${esc(aw.id)}" data-hand="off" class="btn py-1 px-1 text-[10px] ${aw.hand==='off'?'btn-ok':''}">NH</button>
                <button type="button" data-action="set-wp-hand" data-id="${esc(aw.id)}" data-hand="both" class="btn py-1 px-1 text-[10px] ${(aw.hand==='both'||aw.grip==='2h')?'btn-ok':''}">2H</button>
              </div>
            </div>
          </div>
          ${isRng?`<div class="min-w-0">
            <label class="block text-[9px] font-bold text-amber-400 uppercase mb-0.5">🎯 Munition</label>
            <select data-dice-wp-edit="ammoId" data-wid="${esc(aw.id)}" class="inp w-full text-xs font-bold py-1"><option value="" ${!aw.ammoId?'selected':''}>— Keine Munition —</option>${(S.ammos||[]).map(am=>`<option value="${esc(am.id)}" ${aw.ammoId===am.id?'selected':''}>${esc(am.name||'Munition')} (${am.qty} Stk.)</option>`).join('')}</select>
          </div>`:''}
          <div class="grid grid-cols-3 gap-1.5 tabular">
            <div><label class="block text-[9px] font-bold t-mut text-center mb-0.5">Schnitt</label><input data-dice-wp-inp="${esc(aw.id)}:dmgCut" type="text" value="${esc(aw.dmgCut)}" class="inp w-full text-center font-black py-1 text-xs"/></div>
            <div><label class="block text-[9px] font-bold t-mut text-center mb-0.5">Durchstoß</label><input data-dice-wp-inp="${esc(aw.id)}:dmgPierce" type="text" value="${esc(aw.dmgPierce)}" class="inp w-full text-center font-black py-1 text-xs"/></div>
            <div><label class="block text-[9px] font-bold t-mut text-center mb-0.5">Einschlag</label><input data-dice-wp-inp="${esc(aw.id)}:dmgImpact" type="text" value="${esc(aw.dmgImpact)}" class="inp w-full text-center font-black py-1 text-xs"/></div>
          </div>
        </div>`;
      }else if(ash&&D.wpEditOpen){
        const shPool=['lp','mlp','both'].includes(ash.dmgPool)?ash.dmgPool:'lp';
        const isEq=ash.equipped!==false;
        const bm=toInt(ash.blockMod,0);
        quickEditHtml=`<div class="p-2.5 rounded-lg border border-cyan-400/50 bg-black/25 space-y-2 text-xs min-w-0">
          <div class="flex flex-wrap items-center justify-between gap-1.5 border-b border-white/10 pb-1.5">
            <div class="flex items-center gap-1.5">
              <span class="text-[10px] font-black text-cyan-300 uppercase tracking-wider">⚙️ Schild anpassen</span>
              <button type="button" data-action="toggle-ar-eq" data-id="${esc(ash.id)}" class="btn py-0.5 px-1.5 text-[10px] font-extrabold ${isEq?'btn-ok':'opacity-70'}">${isEq?'✓ Angelegt':'○ Abgelegt'}</button>
            </div>
            <div class="inline-flex rounded-lg p-0.5 bg-black/30 border bdr-line text-[10px]">
              <button type="button" data-action="set-ar-dmgpool" data-id="${esc(ash.id)}" data-pool="lp" class="px-1.5 py-0.5 rounded font-black ${shPool==='lp'?'bg-rose-500/35 text-rose-200':'t-mut'}">❤️ LP</button>
              <button type="button" data-action="set-ar-dmgpool" data-id="${esc(ash.id)}" data-pool="mlp" class="px-1.5 py-0.5 rounded font-black ${shPool==='mlp'?'bg-indigo-500/35 text-indigo-200':'t-mut'}">🧠 mLP</button>
              <button type="button" data-action="set-ar-dmgpool" data-id="${esc(ash.id)}" data-pool="both" class="px-1.5 py-0.5 rounded font-black ${shPool==='both'?'bg-purple-500/35 text-purple-200':'t-mut'}">Beide</button>
            </div>
          </div>
          <div class="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
            <div class="min-w-0">
              <label class="block text-[9px] font-bold text-cyan-300 uppercase mb-0.5">Block-Mod (${esc(formatBlockModShort(bm))})</label>
              <div class="flex items-center gap-1 tabular">
                <button type="button" data-action="shield-blockmod-step" data-id="${esc(ash.id)}" data-d="-1" class="btn w-7 h-7 p-0 text-xs font-black shrink-0">−</button>
                <span class="flex-1 text-center font-black text-xs ${bm>0?'text-emerald-300':bm<0?'text-rose-300':''}">${bm>0?'+'+bm:bm}</span>
                <button type="button" data-action="shield-blockmod-step" data-id="${esc(ash.id)}" data-d="1" class="btn w-7 h-7 p-0 text-xs font-black shrink-0">+</button>
              </div>
            </div>
            <div class="min-w-0">
              <label class="block text-[9px] font-bold t-mut uppercase mb-0.5">Attribut</label>
              <select data-dice-sh-edit="wAttr" data-sid="${esc(ash.id)}" class="inp w-full text-xs font-bold py-1">${ATTRS.map(a=>`<option value="${a.k}" ${(ash.wAttr||'ST')===a.k?'selected':''}>${a.k} (${getAttrTot(a.k)})</option>`).join('')}</select>
            </div>
            <div class="min-w-0 col-span-2 sm:col-span-1">
              <label class="block text-[9px] font-bold t-mut uppercase mb-0.5">Fertigkeit</label>
              <select data-dice-sh-edit="skillId" data-sid="${esc(ash.id)}" class="inp w-full text-xs font-bold py-1"><option value="" ${!ash.skillId?'selected':''}>Keine (+0)</option>${(S.skills||[]).map(sk=>`<option value="${esc(sk.id)}" ${ash.skillId===sk.id?'selected':''}>${esc(sk.name||'Fert.')} (${fmtSign(getSkBonus(sk))})</option>`).join('')}</select>
            </div>
          </div>
          <div class="grid grid-cols-3 gap-1.5 tabular">
            <div><label class="block text-[9px] font-bold t-mut text-center mb-0.5">Schnitt (Angr.)</label><input data-dice-sh-inp="${esc(ash.id)}:dmgCut" type="text" value="${esc(ash.dmgCut)}" class="inp w-full text-center font-black py-1 text-xs"/></div>
            <div><label class="block text-[9px] font-bold t-mut text-center mb-0.5">Durchstoß</label><input data-dice-sh-inp="${esc(ash.id)}:dmgPierce" type="text" value="${esc(ash.dmgPierce)}" class="inp w-full text-center font-black py-1 text-xs"/></div>
            <div><label class="block text-[9px] font-bold t-mut text-center mb-0.5">Einschlag</label><input data-dice-sh-inp="${esc(ash.id)}:dmgImpact" type="text" value="${esc(ash.dmgImpact)}" class="inp w-full text-center font-black py-1 text-xs"/></div>
          </div>
        </div>`;
      }

      weaponRowHtml=`<div class="space-y-1.5 pt-1.5 border-t border-white/10 min-w-0">
        <div class="flex items-center gap-1.5 min-w-0">
          <select data-dice-weapon-sel="1" aria-label="Waffe oder Schild aus Charakterbogen wählen" class="inp flex-1 min-w-0 text-xs font-bold py-1 ${activeItem&&!wpApplies?'border-amber-400/60 text-amber-200':ash?'border-cyan-400/55':''}">
            ${selOptsHtml}
          </select>
          ${activeItem?`<button type="button" data-action="toggle-dice-wp-edit" data-tip="${ash?'Schild direkt im Würfelassistenten anpassen':'Waffe direkt im Würfelassistenten anpassen (LP/mLP, Attribut, Fertigkeit, Munition, Schaden)'}" class="btn py-1 px-2 text-xs font-extrabold shrink-0 ${D.wpEditOpen?'btn-pri':''}">⚙️ <span class="hidden sm:inline">Anpassen</span></button>`:''}
        </div>
        ${blockInfoStripHtml}
        ${aw?renderDiceMagazineStripHtml(aw):''}
        ${mismatchHtml}
        ${dwBarHtml}
        ${quickEditHtml}
      </div>`;
    }

    const attrStripHtml=`<div class="grid grid-cols-4 sm:grid-cols-8 gap-1 pt-1.5 border-t border-white/10">${ATTRS.map(a=>isNeutral
      ?`<button type="button" data-action="dice-pick-lobby-attr" data-attr="${a.k}" class="btn py-1 px-0.5 flex-col gap-0 ${D.label===`Freie Probe: ${a.k} (50)`?'btn-pri':''}"><span class="text-[9px] leading-none">${a.k}</span><span class="text-xs font-black tabular leading-tight">50</span></button>`
      :`<button type="button" data-action="dice-pick-attr" data-attr="${a.k}" class="btn py-1 px-0.5 flex-col gap-0 ${D.attrKey===a.k?'btn-pri':''}"><span class="text-[9px] leading-none">${a.k}</span><span class="text-xs font-black tabular leading-tight">${getAttrTot(a.k)}</span></button>`).join('')}</div>`;

    return `<div class="subcard p-2.5 space-y-2 min-w-0">
      ${isNeutral
        ?`<div class="flex items-center justify-between gap-2 text-[11px] font-extrabold text-acc"><span>🏰 Lobby-Modus (Neutral)</span><span class="t-mut font-semibold">${esc(CLOUD.currentUser||'Gast')}</span></div>`
        :`<div class="flex flex-wrap items-center justify-between gap-1.5 min-w-0">
          <div class="flex flex-wrap items-center gap-1 min-w-0">${modeBtns.map(m=>`<button type="button" data-action="set-dice-wcat" data-wcat="${m.c}" class="btn py-0.5 px-2 text-[11px] font-extrabold ${curCat===m.c?'btn-pri':'opacity-85 hover:opacity-100'}">${m.l}</button>`).join('')}</div>
          ${isHitMode?`<div class="inline-flex rounded-lg p-0.5 bg-black/30 border bdr-line text-[11px] shrink-0" data-tip="Ziel-Pool für Trefferwurf & Schaden: Physische LP oder Mentale mLP (beeinflusst, welche Waffen greifen)">
            <button type="button" data-action="set-dice-atkpool" data-pool="lp" class="px-2 py-0.5 rounded font-black transition-colors ${atkPool==='lp'?'bg-rose-500/35 text-rose-200':'t-mut hover:text-white'}">❤️ LP</button>
            <button type="button" data-action="set-dice-atkpool" data-pool="mlp" class="px-2 py-0.5 rounded font-black transition-colors ${atkPool==='mlp'?'bg-indigo-500/40 text-indigo-200':'t-mut hover:text-white'}">🧠 mLP</button>
          </div>`:''}
        </div>`}
      ${weaponRowHtml}
      ${attrStripHtml}
    </div>`;
  };

  const mob=isMobileLayout();
  const hdrOppSub=T.opp?.ready?(T.opp.hideDetails?` ⚔️ vs. 👹 ${esc(T.opp.oppName)}`:` ⚔️ vs. ${esc(T.opp.oppName)} (${esc(T.opp.oppShortLabel)})`):'';
  const adminSecretHdrBtn=CLOUD.isAdmin
    ?`<button type="button" data-action="toggle-dice-secret" data-tip="${secAct?'Geheimwurf aktiv – geht nicht in den Live-Feed (klicken für Öffentlich)':'Öffentlicher Live-Feed (klicken für geheimen Admin-Wurf)'}" class="btn py-1 px-2 text-xs font-black shrink-0 ${secAct?'bg-amber-500 text-slate-950 border-amber-300 shadow':'opacity-80'}">${secAct?'🕵️ Geheim':'👁️'}</button>`
    :'';
  const cCnt=Math.max(1,Math.min(100,toInt(D.customCnt,1))), cSides=Math.max(1,Math.min(1000,toInt(D.customSides,20))), cForm=`${cCnt}W${cSides}`;

  p.innerHTML=`<div class="card p-0 ${mob?'rounded-none border-0':'rounded-2xl'} ${secAct?'ring-2 ring-amber-400/70':''} flex-1 h-full flex flex-col min-h-0 overflow-hidden shadow-2xl relative">
    <div data-win-drag="dice" class="shrink-0 z-10 flex flex-wrap items-center justify-between gap-1.5 px-3 sm:px-3.5 py-2 border-b bdr-line win-drag-hdr" style="background:var(--surf2)">
      <div class="min-w-0 flex-1">
        <div class="flex items-center gap-1.5 min-w-0">
          <h2 class="text-sm font-black truncate">🎲 Würfelassistent</h2>
          ${secAct?'<span class="px-1.5 py-0.2 rounded text-[9px] font-black bg-amber-500/25 text-amber-300 border border-amber-400/50 shrink-0">PRIVAT</span>':''}
        </div>
        <p class="text-[11px] text-acc font-bold truncate">${esc(D.label)}${hdrOppSub}</p>
      </div>
      <div class="flex items-center gap-1 shrink-0">
        ${adminSecretHdrBtn}
        <button type="button" data-action="toggle-livedice" aria-label="Live-Würfel umschalten" data-tip="Live-Würfel-Fenster daneben ein-/ausblenden" class="btn py-1 px-2 text-xs ${LD.open?'btn-pri':''}">📡</button>
        ${renderWinCtrlBtns('dice')}
        ${xl&&!UI.inLobby?`<button type="button" data-action="toggle-dock" data-tip="${D.docked?'Als Overlay lösen':'Rechts andocken'}" class="hidden xl:inline-flex btn py-1 px-2 text-xs">${D.docked?'🗗':'📌'}</button>`:''}
        <button type="button" data-action="reset-dice" data-tip="Würfelassistent zurücksetzen" class="btn btn-err py-1 px-2 text-xs">↺</button>
        <button type="button" data-action="close-dice" aria-label="Schließen" class="btn btn-err ${mob?'w-9 h-9 p-0 text-sm':'py-1 px-2 text-xs'} font-black shrink-0">✕</button>
      </div>
    </div>

    <div data-dice-scroll-body="1" class="p-3 space-y-2.5 min-w-0 flex-1 min-h-0 overflow-y-auto overscroll-contain${mob?' safe-pb':''}">
      ${(!isNeutral&&S.inspirationActive)?`<div class="subcard py-1.5 px-2.5 border border-amber-400 bg-amber-500/15 flex items-center justify-between gap-2"><span class="text-xs font-black text-amber-300">✨ Inspiration aktiv (+1 Vorteil für diesen Wurf)</span><button type="button" data-action="cancel-inspiration" class="btn py-0.5 px-2 text-[10px] border-amber-400/60 text-amber-200 shrink-0">↺ Zurück</button></div>`:''}

      ${renderContextCard()}

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        ${vbox('Eigener Wert','c-mode',D.cMode,'cDirect','cAttr','cSkill','cCustom','diceCMath','text-acc',cs,'Attribut','Fertigkeit')}
        ${vbox('Schwierigkeit','d-mode',D.dMode,'dDirect','dAttr','dSkill','dCustom','diceDMath','text-indigo-400',ds,'Gegner-Attr.','Gegner-Fert.')}
      </div>

      ${renderOppDetailTray()}

      <div id="diceAdvDisBox" class="subcard p-2.5 space-y-1.5">${buildAdvDisInnerHtml(T)}</div>

      <div class="subcard p-3 border-2 ${secAct?'border-amber-400/70 bg-amber-500/5':'bdr-acc bg-acc-soft/15'} space-y-2.5">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 min-w-0">
          <div id="diceThBox" class="min-w-0 flex-1">${buildThresholdInnerHtml(T)}</div>
          <button type="button" data-action="roll-d100" class="btn ${secAct?'bg-gradient-to-r from-amber-500 to-purple-600 text-white border-amber-300 ring-2 ring-amber-400/50 shadow-lg':'btn-pri'} w-full sm:w-auto sm:min-w-[152px] h-[44px] text-sm font-black px-5 shrink-0">${secAct?'🕵️ ':'🎲 '}${D.cnt===1?(secAct?'Geheim würfeln!':'Würfeln!'):D.cnt+(secAct?'× Geheim!':'× Würfeln!')}</button>
        </div>
        <div class="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/10 tabular">
          <div class="inline-flex items-center gap-1">
            <span class="text-[10px] font-extrabold t-mut uppercase mr-0.5">Würfe</span>
            <button type="button" data-action="cnt-step" data-d="-1" ${D.cnt<=1?'disabled':''} class="btn w-6 h-6 p-0">−</button>
            <select data-dice-sel="cnt" aria-label="Anzahl Würfe" class="inp py-0.5 px-1 text-xs font-extrabold tabular">${[1,2,3,4,5,6,7,8,9,10].map(n=>`<option value="${n}" ${D.cnt===n?'selected':''}>${n}</option>`).join('')}</select>
            <button type="button" data-action="cnt-step" data-d="1" ${D.cnt>=10?'disabled':''} class="btn w-6 h-6 p-0">+</button>
          </div>
          <div class="inline-flex flex-wrap items-center gap-1.5">
            <div ${T.critSrc?.length?`data-tip="${esc('Automatischer Krit-Bonus:\n'+T.critSrc.map(c=>`• ${c.srcName}: +${c.val}`).join('\n'))}"`:''} class="inline-flex items-center gap-1 ${T.autoCrit?'cursor-help':''}">
              <span class="text-[10px] font-extrabold text-amber-400 uppercase">Krit${T.autoCrit?` (+${T.autoCrit})`:''}</span>
              <button type="button" data-action="crit-step" data-d="-1" ${ci<=0?'disabled':''} class="btn w-6 h-6 p-0">−</button>
              <select data-dice-sel="crit" aria-label="Kritische Endziffer" class="inp py-0.5 px-1 text-xs font-extrabold tabular text-amber-400">${CRIT_SEQ.map(c=>`<option value="${c}" ${D.crit===c?'selected':''}>${c}</option>`).join('')}</select>
              <button type="button" data-action="crit-step" data-d="1" ${ci>=CRIT_SEQ.length-1?'disabled':''} class="btn w-6 h-6 p-0">+</button>
            </div>
            ${D.crit!=='1'?`<button type="button" data-action="crit-mode" class="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400 cursor-pointer">${D.critMode==='range'?`1–${D.crit} ↻`:`nur ${D.crit} ↻`}</button>`:''}
          </div>
        </div>
        ${(D.wRollCat==='Trefferwurf')?`<button type="button" data-action="combat-open-blocked-3eg" data-tip="Öffnet direkt den Schadensrechner für einen erfolgreich geblockten Treffer (statisch 3 EG, kein kritischer Treffer; Verteidiger bestimmt die Trefferzone)." class="btn w-full py-1 px-2.5 text-[11px] font-extrabold border-amber-400/50 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20">🛡️ Geblockter Treffer (statisch 3 EG, kein Krit)</button>`:''}
      </div>

      ${secretBannerHtml}
      ${UI.lastRollHtml?`<div>${UI.lastRollHtml}</div>`:''}
      ${hooks.renderCombatDamageBox?.()||''}

      <div class="space-y-1.5 pt-1 border-t border-white/10">
        <div class="subcard py-2 px-2.5 space-y-2 border border-sky-400/30 bg-sky-500/5">
          <div class="flex items-center justify-between gap-2">
            <button type="button" data-action="toggle-dice-custom" class="flex items-center gap-1.5 text-left min-w-0 flex-1 cursor-pointer">
              <span class="text-xs font-black text-sky-400 w-3.5 shrink-0">${D.customOpen?'▾':'▸'}</span>
              <span class="text-xs font-extrabold text-sky-300 truncate">🎲 Freie Würfel</span>
            </button>
            <span id="lblCustomFormulaPill" class="px-2 py-0.5 rounded-md bg-sky-500/15 border border-sky-400/35 text-sky-300 text-[11px] font-black tabular shrink-0">${esc(cForm)}</span>
          </div>
          ${D.customOpen?`<div class="space-y-2 pt-1.5 border-t bdr-line">
            <div class="grid grid-cols-7 gap-1">${[4,6,8,10,12,20,100].map(sd=>`<button type="button" data-action="dice-custom-preset" data-sides="${sd}" class="btn py-1 px-0 text-[11px] tabular ${cSides===sd?'btn-pri font-black':'opacity-85 hover:opacity-100'}">W${sd}</button>`).join('')}</div>
            <div class="grid grid-cols-12 gap-2 items-end tabular">
              <div class="col-span-5"><label class="block text-[10px] font-bold t-mut mb-0.5">Anzahl</label><input data-dice-custom="cnt" type="text" inputmode="numeric" value="${esc(D.customCnt)}" placeholder="1" class="inp w-full text-center font-black py-1 px-1"/></div>
              <div class="col-span-7"><label class="block text-[10px] font-bold t-mut mb-0.5">Seitenzahl</label><div class="flex items-center gap-1.5"><span class="text-sm font-black text-sky-400 shrink-0">W</span><input data-dice-custom="sides" type="text" inputmode="numeric" value="${esc(D.customSides)}" placeholder="20" class="inp w-full text-center font-black py-1 px-1"/></div></div>
            </div>
            <button type="button" id="btnRollCustomDice" data-action="roll-custom-dice" class="btn w-full py-1.5 px-3 text-xs font-black ${secAct?'border-amber-400 bg-amber-500/20 text-amber-200':'border-sky-400/60 bg-sky-500/20 text-sky-200'}">${secAct?'🕵️ 🎲 ':'🎲 '}${esc(cForm)}${secAct?' geheim würfeln':' würfeln'}</button>
          </div>`:''}
        </div>

        ${secretListHtml}

        <div class="subcard py-2 px-2.5 space-y-1.5">
          <div class="flex items-center justify-between gap-2">
            <button type="button" data-action="toggle-dice-log" class="flex items-center gap-1.5 text-left min-w-0 flex-1 cursor-pointer">
              <span class="text-xs font-black t-mut w-3.5 shrink-0">${D.logOpen?'▾':'▸'}</span>
              <span class="text-xs font-extrabold t-mut truncate">📜 Würfel-Log (${diceLogs.length})</span>
            </button>
            ${diceLogs.length?`<button type="button" data-action="clear-dice-log" class="text-[10px] font-bold t-mut hover:text-rose-400 cursor-pointer shrink-0">Leeren</button>`:''}
          </div>
          ${D.logOpen?(diceLogs.length?`<div data-scroll-key="diceLog" class="space-y-1 max-h-40 overflow-y-auto text-xs pt-1 border-t border-white/10">${diceLogs.map(l=>`<div class="p-1.5 px-2 rounded-lg bg-black/25 border bdr-line space-y-0.5 min-w-0"><div class="flex justify-between gap-2 min-w-0"><span class="truncate"><strong>${esc(l.lbl)}</strong>${l.isCustomDice?`: ${esc(l.sum)}`:` [≤${l.th}]: ${l.sum}`}</span><span class="text-[10px] t-mut tabular shrink-0">${l.t}</span></div>${l.advSrc?`<div class="text-[10px] t-mut break-words">↳ ${esc(l.advSrc)}</div>`:''}</div>`).join('')}</div>`:`<div class="text-[11px] t-mut pt-1 border-t border-white/10">Noch keine Würfe im Verlauf.</div>`):''}
        </div>
      </div>
    </div>${renderWinResizeHandles('dice')}</div>`;
  if(snap) restoreScrollState(mount, snap);
  if(LD.open) renderLiveDice();
}

export function renderLiveDice(){
  const mount=$('liveDiceMount'), p=mount, bd=$('liveDiceBackdrop'), xl=window.innerWidth>=1280;
  if(!mount||!bd) return;
  const hadContent=mount.childElementCount>0;
  const snap=hadContent?captureScrollState(mount):null;
  applyWinFrame('livedice', mount, bd, WIN_DEFAULTS.livedice.dockClass); if(!LD.open){mount.innerHTML='';mount.dataset.lastCampId='';return;}
  const allCamps=getCampaigns().filter(c=>c&&(c.id==='default'||!c.archived));
  const visCamps=CLOUD.isAdmin?allCamps:(CLOUD.currentUser?allCamps.filter(c=>c.id==='default'||isUserInCampaign(c,CLOUD.currentUser)||canManageCampaign(c)):allCamps);
  const activeCampId=getActiveLiveCampaignId();
  const sameCamp=hadContent&&mount.dataset.lastCampId===activeCampId;
  const activeCampObj=allCamps.find(c=>c.id===activeCampId)||allCamps[0];
  const mob=isMobileLayout();
  p.innerHTML=`<div class="card p-0 ${mob?'rounded-none border-0':'rounded-2xl'} flex-1 h-full flex flex-col min-h-0 overflow-hidden shadow-2xl relative"><div data-win-drag="livedice" class="shrink-0 z-10 flex items-center justify-between gap-2 px-3 sm:px-4 py-2.5 sm:py-3 border-b bdr-line win-drag-hdr" style="background:var(--surf2)">
    <div class="min-w-0 flex-1">
      <h2 class="text-sm font-extrabold truncate">📡 Live-Würfel der Gruppe</h2>
      <p class="text-[11px] text-acc font-bold truncate">📁 ${esc(activeCampObj?.name||'Hauptkampagne')}</p>
    </div>
    <div class="flex items-center gap-1.5 shrink-0">
      ${renderWinCtrlBtns('livedice')}${xl&&!UI.inLobby?`<button type="button" data-action="toggle-dock-livedice" class="hidden xl:inline-flex btn py-1 px-2 text-xs">${LD.docked?'🗗 Overlay':'📌 Andocken'}</button>`:''}
      <button type="button" data-action="toggle-dice" aria-label="Würfelassistent öffnen oder schließen" data-tip="Würfelassistent öffnen/schließen" class="btn ${D.open?'btn-pri':''} py-1 px-2 text-xs font-extrabold whitespace-nowrap">🎲 <span class="hidden sm:inline">Würfelassistent</span><span class="sm:hidden">Würfel</span></button>
      <button type="button" data-action="close-livedice" aria-label="Schließen" class="btn btn-err ${mob?'w-9 h-9 p-0 text-sm':'py-1 px-2 text-xs'} font-black shrink-0">✕</button>
    </div>
  </div>
  <div data-scroll-key="livediceBody" class="p-3 sm:p-3.5 flex-1 min-h-0 flex flex-col gap-3 ${mob?'overflow-y-auto overscroll-contain safe-pb':'overflow-hidden'}">
    <div data-scroll-key="livediceCamps" class="flex items-center gap-1.5 overflow-x-auto pb-1 shrink-0">
      ${visCamps.map(c=>{
        const isAct=c.id===activeCampId;
        const cCnt=getCampaignFilteredDiceFeed(c.id).length;
        return `<button type="button" data-action="select-campaign-tab" data-id="${esc(c.id)}" class="btn shrink-0 py-1 px-2.5 text-xs font-extrabold ${isAct?'btn-pri':'opacity-80 hover:opacity-100'}"><span>📁 ${esc(c.name||'Kampagne')}</span><span class="px-1.5 py-0.2 rounded-full text-[10px] bg-black/25 tabular">${cCnt}</span></button>`;
      }).join('')}
    </div>
    ${renderLobbyLiveDiceHtml(true)}
  </div>${renderWinResizeHandles('livedice')}</div>`;
  mount.dataset.lastCampId=activeCampId;
  if(snap) restoreScrollState(mount,snap,{preserveY:sameCamp});
}

export function rollW100(){
  try{if(window.crypto?.getRandomValues){const u=new Uint32Array(1);let r;do{window.crypto.getRandomValues(u);r=u[0];}while(r>=4294967200);return(r%100)+1;}}catch(e){}
  return Math.floor(Math.random()*100)+1;
}
export function renderBlockFollowUpBox(){
  const activeSh=(!isLobbyNeutralDice()&&D.shieldId)?(S.armors||[]).find(a=>a&&a.id===D.shieldId&&isArmorShield(a)):null;
  const activeBlkWp=(!isLobbyNeutralDice()&&!activeSh&&D.weaponId)?(S.weapons||[]).find(w=>w&&w.id===D.weaponId&&isWeaponBlockable(w)):null;
  const blkMitHtml=activeSh
    ?`<div class="px-2.5 py-1.5 rounded-lg border border-cyan-400/50 bg-cyan-500/12 text-[11px] font-bold text-cyan-200 tabular">🛡️ Schild-Block (<strong>${esc(String(activeSh.name||'').trim()||'Schild')}</strong>): gRP <strong>${esc(activeSh.grp)}</strong> • Schnitt ${esc(activeSh.protCut)} / Durchstoß ${esc(activeSh.protPierce)} / Einschlag ${esc(activeSh.protImpact)}${toInt(activeSh.mentalProt,0)?` / mRS ${esc(activeSh.mentalProt)}`:''} — <em>wird zu deiner normalen Zonenrüstung addiert!</em></div>`
    :(activeBlkWp
      ?`<div class="px-2.5 py-1.5 rounded-lg border border-amber-400/45 bg-amber-500/10 text-[11px] font-bold text-amber-200">🧱 Blockfähige Waffe (<strong>${esc(String(activeBlkWp.name||'').trim()||'Waffe')}</strong>): reduziert den erlittenen Schaden um <strong>−2</strong> (+ normale Zonenrüstung).</div>`
      :'');
  return `<div class="subcard mt-2 p-3 border-2 border-emerald-500/50 bg-emerald-500/10 space-y-2 text-left">
    <div class="text-xs font-extrabold text-emerald-300 flex flex-wrap items-center justify-between gap-2">
      <span>🛡️ Erfolgreich geblockt!</span>
      <span class="px-2 py-0.5 rounded-md bg-amber-500/20 border border-amber-400/50 text-amber-200 text-[11px] font-black tabular">Angreifer: statisch 3 EG • kein Krit</span>
    </div>
    <p class="text-[11px] t-mut leading-relaxed">Der Angriff gilt als mit <strong class="text-amber-200">3 EG</strong> (ohne kritischen Treffer) getroffen — <strong class="text-emerald-200">du bestimmst absolut die Trefferzone</strong> (Schild / blockfähige Waffe + dahinterliegende Rüstung).</p>
    ${blkMitHtml}
  </div>`;
}
export function executeBlockFollowUpRoll(){
  // Veralteter 2. Block-Folgewurf wurde durch das 1-Wurf-Blocksystem (statisch 3 EG, kein Krit) ersetzt.
  renderDice();
}
export function executeDiceRoll(opts={}){
  const prevWinY=window.scrollY, prevWinX=window.scrollX;
  const T=calcThreshold(), {th}=T, res=[];
  for(let i=0;i<D.cnt;i++){
    const rawR=rollW100(), rollMod=toInt(T.rollMod,0), r=rollMod?Math.max(1,Math.min(100,rawR+rollMod)):rawR, ok=r!==100&&(r===1||r<=T.th);
    let crit=false; if(ok){const ed=r%10,td=parseInt(D.crit,10),rk=x=>x===0?10:x;crit=(D.crit==='1'||D.critMode==='range')?rk(ed)<=rk(td):ed===td;}
    const eg=ok?Math.ceil(r/10):0, meg=!ok?Math.ceil((101-r)/10):0;
    res.push({r,rawR,rollMod,ok,crit,baseEg:eg,eg,egMult:1,meg});
  }
  const isLobRoll=Boolean(UI.inLobby);
  const effWeaponId=isLobRoll?null:getEffectiveDiceWeaponId();
  const effShieldId=isLobRoll?null:getEffectiveDiceShieldId();
  const rollerIsEnemy=Boolean(!isLobRoll&&isEnemySheet(S));
  const c1Name=isLobRoll?(CLOUD.currentUser?CLOUD.currentUser:'Gast'):(String(S.profile.name||'').trim()||(rollerIsEnemy?'Gegner':'Unbenannter Held'));
  const isVsOpp=Boolean(T.opp&&T.opp.ready);
  const hideOppLocal=Boolean(isVsOpp&&T.opp.hideDetails);
  const hideOppInFeed=Boolean(isVsOpp&&T.opp.isEnemy);
  const c1WpObj=effWeaponId?(S.weapons||[]).find(x=>x.id===effWeaponId):null;
  const c1ShObj=effShieldId?(S.armors||[]).find(x=>x&&x.id===effShieldId&&isArmorShield(x)):null;
  const c1HasNichtParierbar=Boolean((c1WpObj?.tags||[]).some(tg=>/^nicht\s+parierbar\b/i.test(String(tg?.name||'').trim())));
  const isHitVsBlock=Boolean(D.wRollCat==='Trefferwurf'&&isVsOpp&&(T.opp.oppRollCat==='Blocken'||(T.opp.oppRollCat==='Parieren'&&c1HasNichtParierbar)));
  let vsSummary='', vsSummaryFeed='';
  if(isVsOpp){
    const c1Sk=(!isLobRoll&&D.skillId)?(S.skills||[]).find(x=>x.id===D.skillId):null;
    const c1Wp=c1WpObj;
    const c1Sh=c1ShObj;
    const c1WpName=c1Sh?`🛡️ ${String(c1Sh.name||'').trim()||'Schild'}`:(c1Wp?(String(c1Wp.name||'').trim()||getWeaponSubtype(c1Wp.wType).label):'');
    let c1Short=`Wert ${T.cv}`;
    if(c1Sk) c1Short=`${c1Sk.name} ${T.cv}`;
    else if(c1WpName) c1Short=`${c1WpName} ${T.cv}`;
    else if(!isLobRoll&&D.attrKey) c1Short=`${D.attrKey} ${T.cv}`;
    else if(D.wRollCat&&D.wRollCat!=='Normaler Test') c1Short=`${D.wRollCat} ${T.cv}`;
    const c1FeedShort=rollerIsEnemy?(D.wRollCat&&D.wRollCat!=='Normaler Test'?D.wRollCat:'Aktion'):c1Short;
    vsSummary=hideOppLocal
      ?`${c1Name} (${c1Short}) vs. ${T.opp.oppName}`
      :`${c1Name} (${c1Short}) vs. ${T.opp.oppName} (${T.opp.oppShortLabel})`;
    vsSummaryFeed=hideOppInFeed
      ?`${c1Name} (${c1FeedShort}) vs. ${T.opp.oppName}`
      :`${c1Name} (${c1FeedShort}) vs. ${T.opp.oppName} (${T.opp.oppShortLabel})`;
  }
  const rollTitle=isVsOpp?vsSummary:D.label;
  const feedTitle=isVsOpp?vsSummaryFeed:(rollerIsEnemy?(D.wRollCat&&D.wRollCat!=='Normaler Test'?`${D.wRollCat}`:'Probe'):D.label);
  const rawAdvSrcParts=buildAdvSrcShortList(T);
  const noOppAdvT=hideOppLocal||hideOppInFeed?{...T,advSrc:(T.advSrc||[]).filter(s=>!s?.fromOpponent)}:T;
  const advSrcParts=hideOppLocal?buildAdvSrcShortList(noOppAdvT):rawAdvSrcParts;
  const advSrcPartsFeed=rollerIsEnemy?[]:(hideOppInFeed?buildAdvSrcShortList(noOppAdvT):rawAdvSrcParts);
  const advSrcChipsHtml=advSrcParts.map(pt=>{
    const isN=/^[+-]\d+N\b/.test(pt), isRed=/^-\d+N\b/.test(pt), isMan=/\(Manuell\)$/.test(pt);
    const cls=isMan?'bg-amber-500/15 text-amber-200 border-amber-400/40':(isN&&!isRed)?'bg-rose-500/15 text-rose-200 border-rose-500/35':'bg-emerald-500/15 text-emerald-200 border-emerald-500/35';
    return `<span class="px-1.5 py-0.5 rounded border font-bold tabular max-w-full break-words ${cls}">${esc(pt)}</span>`;
  }).join('');
  const vsSideRowHtml=isVsOpp
    ?(hideOppLocal
      ?`<div class="mt-1.5 text-[10px] font-bold text-indigo-300 tabular break-words">⚔️ ${esc(c1Name)} vs. 👹 ${esc(T.opp.oppName)} (Gegnerwerte verborgen)</div>`
      :`<div class="mt-1.5 text-[10px] font-bold text-indigo-300 tabular break-words">⚔️ ${esc(c1Name)}: ${T.c1AutoAdv}V/${T.c1AutoDis}N • ${esc(T.opp.oppName)}: ${T.oppAutoAdv}V→N / ${T.oppAutoDis}N→V</div>`)
    :'';
  const advSrcRowHtml=advSrcParts.length?`<div class="mt-2 pt-1.5 border-t border-white/10 flex flex-wrap items-center justify-center gap-1 text-[10px] min-w-0 break-words"><span class="font-extrabold t-mut mr-0.5">Vor./Nacht.:</span>${advSrcChipsHtml}</div>`:'';
  let baseHtml='';
  if(res.length===1){
    const x=res[0], isBlockedMiss=Boolean(isHitVsBlock&&!x.ok&&x.r!==100);
    const cls=x.crit?'crit-glow border-amber-400 bg-amber-500/15':x.ok?'border-emerald-500/60 bg-emerald-500/10':isBlockedMiss?'border-amber-400/75 bg-amber-500/10':'border-rose-500/60 bg-rose-500/10';
    const blkBanner=isBlockedMiss
      ?`<div class="mt-2.5 pt-2 border-t border-white/10 text-xs font-extrabold text-amber-200">🛡️ Erfolgreich geblockt! → Zählt statisch als <span class="px-2 py-0.5 rounded bg-amber-500 text-slate-950 font-black">3 EG (kein Krit)</span> • Verteidiger bestimmt die Trefferzone.</div>`
      :'';
    baseHtml=`<div class="subcard text-center p-4 border-2 ${cls}"><div class="text-[11px] font-bold t-mut break-words">${esc(rollTitle)} • Schwelle ${th}</div>${vsSideRowHtml}<div class="text-5xl font-black tabular my-1">🎲 ${x.r}${x.rollMod&&x.rawR!==undefined?`<span class="text-xs font-bold text-cyan-300 ml-1">(Wurf ${x.rawR}${fmtSign(x.rollMod)})</span>`:''}</div><div class="text-xs font-black uppercase ${x.crit?'text-amber-500':x.ok?'text-emerald-500':isBlockedMiss?'text-amber-300':'text-rose-500'}">${x.crit?'★ Kritischer Erfolg! ★':x.ok?'Erfolg':(x.r===100?'💀 Patzer (100)':(isBlockedMiss?'🛡️ Geblockt (Misserfolg)':'Misserfolg'))}</div><div class="mt-2"><span class="px-3.5 py-1 rounded-lg text-white font-extrabold text-sm tabular ${x.ok?'bg-emerald-600':isBlockedMiss?'bg-amber-600':'bg-rose-600'}">${x.ok?('EG: '+x.eg):(isBlockedMiss?'Geblockt → 3 EG (MEG: '+x.meg+')':'MEG: '+x.meg)}</span></div>${advSrcRowHtml}${blkBanner}</div>`;
  }else{
    const w=res.filter(x=>x.ok).length, c=res.filter(x=>x.crit).length, blkCnt=isHitVsBlock?res.filter(x=>!x.ok&&x.r!==100).length:0;
    const multiSrcBox=(advSrcParts.length||isVsOpp)?`<div class="subcard py-1.5 px-2.5 space-y-1 text-[10px] min-w-0 break-words">${isVsOpp?`<div class="font-bold text-indigo-300 tabular break-words">${hideOppLocal?`⚔️ ${esc(rollTitle)} (Gegnerwerte verborgen)`:`⚔️ ${esc(rollTitle)} • ${esc(c1Name)} (${T.c1AutoAdv}V/${T.c1AutoDis}N) vs. ${esc(T.opp.oppName)} (${T.oppAutoAdv}V→N / ${T.oppAutoDis}N→V)`}</div>`:''}${advSrcParts.length?`<div class="flex flex-wrap items-center gap-1 min-w-0"><span class="font-extrabold t-mut mr-0.5">Vor./Nacht.:</span>${advSrcChipsHtml}</div>`:''}</div>`:'';
    baseHtml=`<div class="space-y-1.5"><div class="subcard py-1.5 px-3 flex justify-between text-xs font-extrabold"><span>${D.cnt}× W100 (≤${th})</span><span>${w}/${D.cnt} Erfolge${blkCnt?` • 🛡️ ${blkCnt} geblockt`:''}${c?` • ★ ${c}`:''}</span></div><div class="grid grid-cols-2 gap-1.5">${res.map((x,i)=>{const isBlkM=Boolean(isHitVsBlock&&!x.ok&&x.r!==100);return `<div class="subcard p-2 flex justify-between items-center ${x.crit?'border-amber-400 bg-amber-500/15':x.ok?'border-emerald-500/50 bg-emerald-500/10':isBlkM?'border-amber-400/60 bg-amber-500/10':'border-rose-500/50 bg-rose-500/10'}"><span class="font-black tabular">#${i+1}: ${x.r}${x.rollMod&&x.rawR!==undefined?` (${x.rawR}${fmtSign(x.rollMod)})`:""}</span><span class="text-xs font-extrabold">${x.crit?'★ ':''}${x.ok?('EG '+x.eg):(isBlkM?'🛡️ 3 EG':'MEG '+x.meg)}</span></div>`;}).join('')}</div>${multiSrcBox}</div>`;
  }
  if(D.wRollCat==='Blocken'&&res.some(x=>x.ok)){
    UI.lastBlockBaseHtml=baseHtml;
    UI.lastBlockFollowRes=null;
    UI.lastRollHtml=baseHtml+renderBlockFollowUpBox();
  }else{
    UI.lastBlockBaseHtml=baseHtml;
    UI.lastBlockFollowRes=null;
    UI.lastRollHtml=baseHtml;
  }
  const cs=getCSkVal(), ds=getDSkVal();
  const cBreak=rollerIsEnemy?'Gegnerwert (verborgen)':(D.cMode==='breakdown'?`${D.attrKey||'Attr.'} ${D.cAttr} ${fmtSign(cs)} Fert. = ${T.cv}`:`Direkt ${T.cv}`);
  const dBreak=isVsOpp
    ?(hideOppInFeed?`${T.opp.oppName} (Werte verborgen)`:T.opp.oppBreak)
    :(D.dMode==='breakdown'?`${D.dAttr} ${fmtSign(ds)} = ${T.dv}`:`${T.dv}`);
  const advBreak=(rollerIsEnemy||hideOppInFeed)
    ?(advSrcPartsFeed.length?`Verrechnet • ${advSrcPartsFeed.join(', ')}`:'Verrechnet (Gegnerdetails verborgen)')
    :((T.effAdv||T.effDis||advSrcPartsFeed.length)?`${T.effAdv}V/${T.effDis}N (Netto ${fmtSign(T.rawNet)} → ${fmtSign(T.bonus-T.effTh)})${advSrcPartsFeed.length?` • ${advSrcPartsFeed.join(', ')}`:''}`:'±0');
  const critLbl=(D.crit==='1'?'Endziffer 1':(D.critMode==='range'?`Endziffer 1–${D.crit}`:`nur Endziffer ${D.crit}`))+(T.autoCrit&&!rollerIsEnemy?` [inkl. +${T.autoCrit} Krit-Bonus]`:'');
  const formula=(rollerIsEnemy||hideOppInFeed)
    ?(isVsOpp?`${rollerIsEnemy?c1Name:`${T.cv} (${c1Name})`} vs. ${T.opp.oppName} (Gegnerwerte verborgen) → Schwelle ${T.th} (${T.chance}%)`:`${c1Name} (Gegnerwerte verborgen) → Schwelle ${T.th} (${T.chance}%)`)
    :(isVsOpp
      ?`${T.cv} (${c1Name}) + 50 − ${T.dv} (${T.opp.oppName}) ${T.bonus>=0?'+ '+T.bonus:'− '+Math.abs(T.bonus)}${T.effTh?` [inkl. ${fmtSign(T.effTh)} Effekt]`:''} = ${T.th} (${T.chance}%)`
      :`${T.cv} (Wert) + 50 − ${T.dv} (Schw.) ${T.bonus>=0?'+ '+T.bonus:'− '+Math.abs(T.bonus)}${T.effTh?` [inkl. ${fmtSign(T.effTh)} Effekt]`:''} = ${T.th} (${T.chance}%)`);
  const livePayload={
    id:uid(),
    tsMs:Date.now(),
    ts:new Date().toLocaleTimeString('de-DE',{hour:'2-digit',minute:'2-digit',second:'2-digit'}),
    senderTabId:LIVE_TAB_ID,
    charId:isLobRoll?'':(S.charId||''),
    charName:c1Name,
    playerName:isLobRoll?'':(rollerIsEnemy?'SL':String(CLOUD.currentUser||S.owner||'').trim()),
    campaignId:getActiveDiceCampaignId(),
    label:feedTitle||'Freie Probe',
    weaponId:effWeaponId||null,
    wRollCat:D.wRollCat||null,
    th:T.th,
    egMult:1,
    chance:T.chance,
    cv:rollerIsEnemy?'?':T.cv,
    dv:hideOppInFeed?'?':T.dv,
    adv:T.effAdv,
    dis:T.effDis,
    net:T.rawNet,
    bonus:T.bonus,
    effTh:T.effTh,
    cBreak,
    dBreak,
    advBreak,
    critLbl,
    formula,
    cnt:D.cnt,
    res
  };
  if(isVsOpp){
    livePayload.vsCharId=T.opp.charId;
    livePayload.vsCharName=T.opp.oppName;
    livePayload.vsSummary=vsSummaryFeed;
  }
  publishLiveRoll(livePayload);
  diceLogs.unshift({t:new Date().toLocaleTimeString('de-DE'),lbl:rollTitle,th,sum:res.map(x=>`${x.r}(${x.crit?'★':''}${x.ok?('EG'+x.eg):((isHitVsBlock&&x.r!==100)?'🛡️3EG':'MEG'+x.meg)})`).join(', '),advSrc:advSrcParts.join(', ')});
  if(diceLogs.length>40) diceLogs.length=40;
  hooks.initCombatFromRoll?.({T,res,attackerName:c1Name});
  if(DUEL.outgoing){
    const wasWaiting=DUEL.outgoing.status==='waiting';
    hooks.clearOutgoingDuel?.({notifyCancel:wasWaiting,silent:true});
    applyDiceAutoAdvDis(false);
  }
  if(!isLobbyNeutralDice()&&S.inspirationActive){
    S.inspirationActive=false;
    applyDiceAutoAdvDis(false);
    if(S.activeTab==='attributes') hooks.renderMain?.();
    save();
  }
  if(window.scrollY!==prevWinY) window.scrollTo(prevWinX, prevWinY);
  renderDice();
  if(window.scrollY!==prevWinY) requestAnimationFrame(()=>{ if(window.scrollY!==prevWinY) window.scrollTo(prevWinX, prevWinY); });
}
export function rollCustomDice(){
  const cnt=Math.max(1,Math.min(100,toInt(D.customCnt,1)));
  const sides=Math.max(1,toInt(D.customSides,20));
  const mod=0;
  D.customCnt=cnt; D.customSides=sides; D.customMod=0;
  const rolls=[];
  let sum=0;
  for(let i=0;i<cnt;i++){
    const r=Math.floor(Math.random()*sides)+1;
    rolls.push(r);
    sum+=r;
  }
  const total=sum+mod;
  const formula=`${cnt}W${sides}`;
  const chipsHtml=rolls.map((rv,i)=>`<span class="px-2 py-0.5 rounded-md border border-sky-400/40 bg-sky-500/15 text-sky-200 text-xs font-extrabold tabular">${cnt>1?`<span class="opacity-65 mr-0.5">#${i+1}:</span>`:''}${rv}</span>`).join('');
  const customHtml=`<div class="subcard text-center p-4 border-2 border-sky-400/60 bg-sky-500/10 space-y-2 tabular">
    <div class="text-[11px] font-bold text-sky-300">🎲 Benutzerdefinierte Würfel • ${esc(formula)}</div>
    <div class="text-5xl font-black text-sky-300 my-1">= ${total}</div>
    ${cnt>1?`<div class="text-xs font-bold t-mut">Summe: <strong class="text-sky-300">${sum}</strong></div>`:''}
    <div class="flex flex-wrap items-center justify-center gap-1 pt-1.5 border-t border-white/10">${chipsHtml}</div>
  </div>`;
  UI.lastBlockBaseHtml=customHtml;
  UI.lastBlockFollowRes=null;
  UI.lastRollHtml=customHtml;
  diceLogs.unshift({
    t:new Date().toLocaleTimeString('de-DE'),
    isCustomDice:true,
    lbl:`🎲 ${formula}`,
    sum:`${total}${cnt>1?` (${rolls.join(' + ')})`:''}`
  });
  if(diceLogs.length>40) diceLogs.length=40;
  const isLobRoll=Boolean(UI.inLobby);
  const entry={
    id:uid(),
    tsMs:Date.now(),
    ts:new Date().toLocaleTimeString('de-DE',{hour:'2-digit',minute:'2-digit',second:'2-digit'}),
    senderTabId:LIVE_TAB_ID,
    charId:isLobRoll?'':(S.charId||''),
    charName:isLobRoll?(CLOUD.currentUser||'Gast'):(String(S.profile.name||'').trim()||'Unbenannter Held'),
    playerName:isLobRoll?'':String(CLOUD.currentUser||S.owner||'').trim(),
    campaignId:getActiveDiceCampaignId(),
    label:`Benutzerdefinierte Würfel (${formula})`,
    isCustomDice:true,
    customFormula:formula,
    customSides:sides,
    customMod:mod,
    customRolls:rolls,
    customSum:sum,
    customTotal:total,
    cnt,
    res:rolls.map(r=>({r,ok:true,crit:false,eg:0,meg:0}))
  };
  publishLiveRoll(entry);
  renderDice();
}

