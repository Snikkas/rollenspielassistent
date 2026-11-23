import {
  ATTRS, CRIT_SEQ, WIN_DEFAULTS
} from './constants.js';
import {
  $, uid, esc, toInt, fmtSign
} from './utils.js';
import {
  hooks
} from './ui-hooks.js';
import {
  applyWinFrame, renderWinCtrlBtns, renderWinResizeHandles, getCampaigns, isUserInCampaign, getActiveLiveCampaignId, getCampaignFilteredDiceFeed, captureScrollState, restoreScrollState, save, getWeaponSubtype, S, D, LD, DUEL, diceLogs, isMobileLayout, UI, LIVE_TAB_ID, CLOUD, getCharCampaignId
} from './state.js';
import {
  calcActiveMods, getAdvDisForContext, getWeaponRollMeta, fmtAdvSrcLines, getAttrTot, getSkBonus
} from './calc.js';
import {
  renderLobbyLiveDiceHtml, publishLiveRoll, formatSecretRollSummary, isSecretRollActive, getCachedForeignSheet, getForeignSheetLoadedAt, isForeignSheetLoading, getForeignSheetError, fetchForeignCharacterSheet, fetchLobbyList
} from './cloud.js';

export const getCSkVal=()=>D.cSkill==='custom'?toInt(D.cCustom):toInt(D.cSkill);
export const getDSkVal=()=>D.dSkill==='custom'?toInt(D.dCustom):toInt(D.dSkill);
export const getEffC=()=>D.cMode==='direct'?toInt(D.cDirect):toInt(D.cAttr)+getCSkVal();
export function getCampaignOpponents(){
  const activeCamp=isLobbyNeutralDice()?getActiveLiveCampaignId():getCharCampaignId(S.charId);
  const seen=new Set();
  const list=[];
  (CLOUD.list||[]).forEach(c=>{
    if(!c||!c.id||seen.has(c.id)) return;
    if(getCharCampaignId(c.id)!==activeCamp) return;
    seen.add(c.id);
    list.push({id:c.id,name:String(c.name||'Unbenannter Held').trim()||'Unbenannter Held',isSelf:Boolean(!UI.inLobby&&S?.charId&&c.id===S.charId)});
  });
  if(!UI.inLobby&&S?.charId&&!seen.has(S.charId)){
    list.push({id:S.charId,name:String(S.profile?.name||'').trim()||'Aktiver Charakter',isSelf:true});
  }
  return list.sort((a,b)=>{
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
function findDefaultOppWeapon(oppSheet,preset){
  const weapons=(oppSheet?.weapons||[]).filter(Boolean);
  if(!weapons.length) return null;
  if(preset==='block'){
    const blk=weapons.find(w=>Array.isArray(w.tags)&&w.tags.some(t=>/^blockf[äa]hig\b/i.test(String(t?.name||'').trim())));
    if(blk) return blk;
  }
  const melee=weapons.find(w=>w.wType!=='ranged');
  return melee||weapons[0];
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
  const liveResp=(DUEL.outgoing&&DUEL.outgoing.status==='responded'&&DUEL.outgoing.targetCharId===charId&&DUEL.outgoing.response?.snapshot)?DUEL.outgoing.response:null;
  const oppSheet=getCachedForeignSheet(charId);
  const loading=isForeignSheetLoading(charId);
  const error=getForeignSheetError(charId);
  if(!oppSheet&&!liveResp){
    return {ready:false,charId,oppName:fallbackName||'Gegner',loading,error};
  }
  const oppM=oppSheet?calcActiveMods(oppSheet):null;
  const oppName=String(liveResp?.targetCharName||oppSheet?.profile?.name||'').trim()||fallbackName||'Unbenannter Gegner';
  const oppKind=['preset','attr','skill'].includes(D.oppKind)?D.oppKind:'preset';
  const oppPreset=['dodge','parry','block','attack'].includes(D.oppPreset)?D.oppPreset:'dodge';
  const oppSkills=(oppSheet?.skills||[]).filter(Boolean);
  const oppWeapons=(oppSheet?.weapons||[]).filter(Boolean);

  if(liveResp){
    const snap=liveResp.snapshot;
    const sk=liveResp.oppSkillId&&liveResp.oppSkillId!=='__none__'?oppSkills.find(s=>s.id===liveResp.oppSkillId)||null:null;
    const oppWeapon=liveResp.oppWeaponId&&liveResp.oppWeaponId!=='__none__'?oppWeapons.find(w=>w.id===liveResp.oppWeaponId)||null:null;
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
      oppSheet:oppSheet||{skills:[],weapons:[],attributes:{},profile:{name:oppName}},
      oppM:oppM||{},
      oppKind:liveResp.oppKind||oppKind,
      oppPreset:liveResp.oppPreset||oppPreset,
      attrKey:snap.attrKey||'GW',
      attrVal:toInt(snap.attrVal,0),
      sk,
      skBonus:toInt(snap.skBonus,0),
      oppWeapon,
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

  let attrKey='GW', attrVal=0, sk=null, skBonus=0, oppWeapon=null, oppVal=0, oppRollCat='Normaler Test', oppShortLabel='', oppBreak='';

  if(oppKind==='preset'){
    if(oppPreset==='dodge'){
      attrKey='GW';
      attrVal=getAttrTot('GW',oppM,oppSheet);
      sk=D.oppSkillId==='__none__'?null:(D.oppSkillId?oppSkills.find(s=>s.id===D.oppSkillId):null)||findOppSkillByKeywords(oppSheet,['ausweichen','abwehr']);
      if(D.oppSkillId==='__none__') sk=null;
      skBonus=sk?getSkBonus(sk):0;
      oppVal=attrVal+skBonus;
      oppRollCat='Ausweichen';
      oppShortLabel=`Ausweichen ${oppVal}`;
      oppBreak=sk?`${oppName} • Ausweichen: GW ${attrVal} ${fmtSign(skBonus)} ${sk.name} = ${oppVal}`:`${oppName} • Ausweichen: GW ${attrVal} = ${oppVal}`;
    }else if(oppPreset==='parry'){
      oppWeapon=(D.oppWeaponId==='__none__')?null:((D.oppWeaponId?oppWeapons.find(w=>w.id===D.oppWeaponId):null)||findDefaultOppWeapon(oppSheet,'parry'));
      attrKey='PR';
      attrVal=getAttrTot('PR',oppM,oppSheet);
      if(D.oppSkillId==='__none__'){
        sk=null;
      }else{
        sk=(D.oppSkillId?oppSkills.find(s=>s.id===D.oppSkillId):null)||findOppSkillByKeywords(oppSheet,['parieren','parade'])||(oppWeapon?.skillId?skillsFind(oppSkills,oppWeapon.skillId):null);
      }
      skBonus=sk?getSkBonus(sk):0;
      oppVal=attrVal+skBonus;
      oppRollCat='Parieren';
      const wNm=oppWeapon?(String(oppWeapon.name||'').trim()||getWeaponSubtype(oppWeapon.wType).label):'';
      oppShortLabel=`Parieren ${oppVal}`;
      oppBreak=`${oppName} • Parieren${wNm?` (${wNm})`:''}: PR ${attrVal}${sk?` ${fmtSign(skBonus)} ${sk.name}`:''} = ${oppVal}`;
    }else if(oppPreset==='block'){
      oppWeapon=(D.oppWeaponId==='__none__')?null:((D.oppWeaponId?oppWeapons.find(w=>w.id===D.oppWeaponId):null)||findDefaultOppWeapon(oppSheet,'block'));
      attrKey='ST';
      attrVal=getAttrTot('ST',oppM,oppSheet);
      if(D.oppSkillId==='__none__'){
        sk=null;
      }else{
        sk=(D.oppSkillId?oppSkills.find(s=>s.id===D.oppSkillId):null)||findOppSkillByKeywords(oppSheet,['blocken','schildblock'])||(oppWeapon?.skillId?skillsFind(oppSkills,oppWeapon.skillId):null);
      }
      skBonus=sk?getSkBonus(sk):0;
      oppVal=attrVal+skBonus;
      oppRollCat='Blocken';
      const wNm=oppWeapon?(String(oppWeapon.name||'').trim()||getWeaponSubtype(oppWeapon.wType).label):'';
      oppShortLabel=`Blocken ${oppVal}`;
      oppBreak=`${oppName} • Blocken${wNm?` (${wNm})`:''}: ST ${attrVal}${sk?` ${fmtSign(skBonus)} ${sk.name}`:''} = ${oppVal}`;
    }else{
      oppWeapon=(D.oppWeaponId==='__none__')?null:((D.oppWeaponId?oppWeapons.find(w=>w.id===D.oppWeaponId):null)||findDefaultOppWeapon(oppSheet,'attack'));
      const wm=oppWeapon?getWeaponRollMeta(oppWeapon,oppM,oppSheet):null;
      attrKey=wm?wm.attrKey:'PR';
      attrVal=getAttrTot(attrKey,oppM,oppSheet);
      if(D.oppSkillId==='__none__'){
        sk=null;
      }else{
        sk=(D.oppSkillId?oppSkills.find(s=>s.id===D.oppSkillId):null)||(wm?.sk||null);
      }
      skBonus=sk?getSkBonus(sk):0;
      oppVal=attrVal+skBonus;
      oppRollCat='Trefferwurf';
      const wNm=oppWeapon?(String(oppWeapon.name||'').trim()||getWeaponSubtype(oppWeapon.wType).label):'Angriff';
      oppShortLabel=`${wNm} ${oppVal}`;
      oppBreak=`${oppName} • ${wNm}: ${attrKey} ${attrVal}${sk?` ${fmtSign(skBonus)} ${sk.name}`:''} = ${oppVal}`;
    }
  }else if(oppKind==='skill'){
    sk=(D.oppSkillId?oppSkills.find(s=>s.id===D.oppSkillId):null)||oppSkills[0]||null;
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
    wRollCat:oppRollCat,
    skillId:sk?.id||null,
    attrKey,
    sitActive:D.oppSitActive||{},
    includeInspiration:false,
    oppDefenseCat:oppDefForOpp
  },oppM,oppSheet);

  return {
    ready:true,
    charId,
    oppName,
    oppSheet,
    oppM,
    oppKind,
    oppPreset,
    attrKey,
    attrVal,
    sk,
    skBonus,
    oppWeapon,
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
  if(s.srcKind==='Statuseffekt') return `Status: ${s.srcName||s.label||'Effekt'}`;
  if(s.srcKind==='Waffen-Tag'||s.srcKind==='Munitions-Tag'||s.srcKind==='Rüstungs-Tag'){
    const tg=s.tagLbl?String(s.tagLbl).replace(/\(\s*(\d+)\s*\)/g,' $1').trim():(s.srcName||'Tag');
    return `${s.srcKind}: ${tg}`;
  }
  if(s.srcKind==='Inspiration') return '✨ Inspiration';
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
export function resetDiceToLobbyNeutral(){
  hooks.clearOutgoingDuel?.({notifyCancel:true,silent:true});
  D.weaponId=null; D.skillId=null; D.attrKey=null; D.wRollCat='Normaler Test'; D.sitActive={}; D.oppSitActive={}; D.critOff=0; D.advAdj=0; D.disAdj=0; D.adv=0; D.dis=0;
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
  if(isLobbyNeutralDice()&&(!D._lobbyNeutral||D.weaponId||D.skillId||D.attrKey)){
    resetDiceToLobbyNeutral();
  }
}
export function applyDiceAutoAdvDis(resetManual=false,M=isLobbyNeutralDice()?{testTh:0}:calcActiveMods()){
  if(resetManual){D.advAdj=0;D.disAdj=0;}
  const normCat=D.wRollCat==='Parade'?'Parieren':D.wRollCat;
  const effCat=['Normaler Test','Trefferwurf','Parieren','Blocken','Ausweichen'].includes(normCat)?normCat:(D.weaponId?'Trefferwurf':'Normaler Test');
  D.wRollCat=effCat;
  const opp=D.dMode==='character'?resolveOpponentComparison(effCat):null;
  const oppDefCat=(opp&&opp.ready)?opp.oppRollCat:'';
  const r1=isLobbyNeutralDice()
    ?{autoAdv:0,autoDis:0,rawAutoAdv:0,rawAutoDis:0,src:[],autoCrit:0,critSrc:[],autoRollMod:0,rollModSrc:[],sitOptions:[]}
    :getAdvDisForContext({weaponId:D.weaponId||null,wRollCat:effCat,skillId:D.skillId||null,attrKey:D.attrKey||null,sitActive:D.sitActive||{},includeInspiration:true,oppDefenseCat:oppDefCat},M);
  const oppAutoAdv=(opp&&opp.ready)?(opp.ad.autoAdv||0):0;
  const oppAutoDis=(opp&&opp.ready)?(opp.ad.autoDis||0):0;
  const oppAdvSrc=(opp&&opp.ready)?(opp.ad.src||[]).map(s=>({...s,fromOpponent:true,oppName:opp.oppName,oppOrigKind:s.kind,kind:s.kind==='dis'?'adv':'dis'})):[];
  const totalAutoAdv=r1.autoAdv+oppAutoDis;
  const totalAutoDis=r1.autoDis+oppAutoAdv;
  D.adv=Math.max(0,totalAutoAdv+toInt(D.advAdj,0));
  D.dis=Math.max(0,totalAutoDis+toInt(D.disAdj,0));
  return {
    ...r1,
    c1AutoAdv:r1.autoAdv,
    c1AutoDis:r1.autoDis,
    c1AdvSrc:r1.src||[],
    opp,
    oppAutoAdv,
    oppAutoDis,
    oppAdvSrc,
    oppSitOptions:(opp&&opp.ready)?(opp.ad.sitOptions||[]):[],
    autoAdv:totalAutoAdv,
    autoDis:totalAutoDis,
    rawAutoAdv:r1.rawAutoAdv+oppAutoDis,
    rawAutoDis:r1.rawAutoDis+oppAutoAdv,
    src:[...(r1.src||[]),...oppAdvSrc]
  };
}
export function calcRollAdvDis(M=isLobbyNeutralDice()?{testTh:0}:calcActiveMods()){
  const r=applyDiceAutoAdvDis(false,M);
  return {...r,effAdv:D.adv,effDis:D.dis};
}
export const calcEgMultiplier = th => th > 100 ? Math.floor(th / 100) + 1 : 1;
export function calcThreshold(){
  const isNeutral=isLobbyNeutralDice();
  const M=isNeutral?{testTh:0}:calcActiveMods(),ad=calcRollAdvDis(M),cv=getEffC(),dv=(ad.opp&&ad.opp.ready)?ad.opp.oppVal:getEffD(),rawNet=D.adv-D.dis,net=Math.max(-5,Math.min(5,rawNet));
  const bonus=(net===0?0:Math.sign(net)*(10+(Math.abs(net)-1)*5))+(M.testTh||0), th=cv+50-dv+bonus;
  const effCritIdx=Math.max(0,Math.min(CRIT_SEQ.length-1,(ad.autoCrit||0)+toInt(D.critOff,0))), effCrit=CRIT_SEQ[effCritIdx];
  D.crit=effCrit;
  return {cv,dv,effAdv:D.adv,effDis:D.dis,autoAdv:ad.autoAdv,autoDis:ad.autoDis,c1AutoAdv:ad.c1AutoAdv||0,c1AutoDis:ad.c1AutoDis||0,c1AdvSrc:ad.c1AdvSrc||[],opp:ad.opp||null,oppAutoAdv:ad.oppAutoAdv||0,oppAutoDis:ad.oppAutoDis||0,oppAdvSrc:ad.oppAdvSrc||[],oppSitOptions:ad.oppSitOptions||[],advAdj:toInt(D.advAdj,0),disAdj:toInt(D.disAdj,0),advSrc:ad.src,sitOptions:ad.sitOptions||[],autoCrit:ad.autoCrit||0,critSrc:ad.critSrc||[],rollMod:ad.autoRollMod||0,rollModSrc:ad.rollModSrc||[],effCrit,effCritIdx,rawNet,net,bonus,th,egMult:calcEgMultiplier(th),effTh:M.testTh||0,chance:Math.max(1,Math.min(99,th))};
}
export function openWeaponRoll(weaponId,wRollCat='Trefferwurf'){
  const w=S.weapons.find(x=>x.id===weaponId); if(!w) return;
  const normCat=wRollCat==='Parade'?'Parieren':wRollCat;
  const cat=['Normaler Test','Trefferwurf','Parieren','Blocken','Ausweichen'].includes(normCat)?normCat:'Trefferwurf';
  const wm=getWeaponRollMeta(w);
  D.weaponId=w.id; D.wRollCat=cat; D.critOff=0; D.sitActive={};
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
  D.label=wm.sk?`${cat}: ${wName} • ${wm.sk.name} (${fmtSign(wm.skBonus)}) + ${wm.attrKey} (${wm.attrVal})`:`${cat}: ${wName} • ${wm.attrKey} (${wm.attrVal})`;
  D.open=true;
  hooks.renderHeader?.(); renderDice();
}
export function syncDiceFromSheet(){
  if(isLobbyNeutralDice()){applyDiceAutoAdvDis(false);return;}
  if(D.wRollCat==='Parade') D.wRollCat='Parieren';
  if(!['Normaler Test','Trefferwurf','Parieren','Blocken','Ausweichen'].includes(D.wRollCat)){
    D.wRollCat=D.weaponId?'Trefferwurf':'Normaler Test';
  }
  if(D.weaponId){
    const w=S.weapons.find(x=>x.id===D.weaponId);
    if(w){
      const wm=getWeaponRollMeta(w), cat=D.wRollCat||'Trefferwurf';
      const ak=D.attrKey||wm.attrKey, av=getAttrTot(ak);
      const sk=D.skillId?S.skills.find(s=>s.id===D.skillId):null, b=sk?getSkBonus(sk):0;
      D.attrKey=ak; D.cAttr=av;
      if(sk){if(['0','10','15','20','30'].includes(String(b))){D.cSkill=String(b);}else{D.cSkill='custom';D.cCustom=b;}}
      const effSk=sk?b:(D.cMode==='breakdown'?getCSkVal():0);
      D.cDirect=av+effSk;
      const wName=String(w.name||'').trim()||getWeaponSubtype(w.wType).label;
      D.label=sk?`${cat}: ${wName} • ${sk.name} (${fmtSign(b)}) + ${ak} (${av})`:`${cat}: ${wName} • ${ak} (${av})`;
      applyDiceAutoAdvDis(false);
      return;
    }else{D.weaponId=null;D.wRollCat='Normaler Test';D.sitActive={};}
  }
  const isNorm=D.wRollCat==='Normaler Test';
  const catPfx=D.wRollCat?`${D.wRollCat}: `:'';
  if(D.skillId){const sk=S.skills.find(x=>x.id===D.skillId);if(sk){const ak=D.attrKey||sk.linkedAttr,av=getAttrTot(ak),b=getSkBonus(sk);D.cAttr=av;if(['0','10','15','20','30'].includes(String(b))){D.cSkill=String(b);}else{D.cSkill='custom';D.cCustom=b;}D.cDirect=av+b;D.label=`${catPfx}${sk.name} (${fmtSign(b)}) + ${ak} (${av})`;}else{D.skillId=null;}}
  else if(D.attrKey){const av=getAttrTot(D.attrKey);D.cAttr=av;if(D.cMode==='direct')D.cDirect=av;D.label=isNorm?`Normaler Test: ${D.attrKey} (${av})`:`${catPfx}${D.attrKey} (${av})`;}
  else if(!isNorm&&D.wRollCat){D.label=D.wRollCat==='Trefferwurf'?'Trefferwurf (Freie Probe)':`Abwehrprobe: ${D.wRollCat}`;}
  else if(/^(?:Abwehrprobe:|Trefferwurf)/.test(D.label)){D.label='Freie Probe';}
  applyDiceAutoAdvDis(false);
}

export function buildAdvDisInnerHtml(T){
  const aSrc=(T.advSrc||[]).filter(s=>s.kind!=='dis'), dSrc=(T.advSrc||[]).filter(s=>s.kind==='dis');
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
  const oppSrc=T.oppAdvSrc||[];
  const hasC1Auto=Boolean(c1Src.length||(T.critSrc&&T.critSrc.length)||(T.rollModSrc&&T.rollModSrc.length));
  const hasOppAuto=Boolean(T.opp?.ready&&oppSrc.length);
  const hasAdvDisAdj=(T.advAdj!==0||T.disAdj!==0);
  const c1Name=isLobbyNeutralDice()?(CLOUD.currentUser||'Gast'):(String(S.profile?.name||'').trim()||'Eigener Charakter');
  const manChips=[];
  if(T.advAdj){
    const isPos=T.advAdj>0;
    manChips.push(`<span class="inline-flex flex-wrap items-center gap-1 px-1.5 py-0.5 rounded border text-[10px] leading-snug max-w-full min-w-0 break-words ${isPos?'bg-emerald-500/15 text-emerald-200 border-emerald-500/35':'bg-amber-500/15 text-amber-200 border-amber-400/45'}"><span class="px-1 rounded font-black tabular shrink-0 ${isPos?'bg-emerald-500/25 text-emerald-300':'bg-amber-500/25 text-amber-300'}">${fmtSign(T.advAdj)}V</span><span class="font-bold">Manuell</span><span class="opacity-80">• Vorteile</span></span>`);
  }
  if(T.disAdj){
    const isPos=T.disAdj>0;
    manChips.push(`<span class="inline-flex flex-wrap items-center gap-1 px-1.5 py-0.5 rounded border text-[10px] leading-snug max-w-full min-w-0 break-words ${isPos?'bg-rose-500/15 text-rose-200 border-rose-500/35':'bg-amber-500/15 text-amber-200 border-amber-400/45'}"><span class="px-1 rounded font-black tabular shrink-0 ${isPos?'bg-rose-500/25 text-rose-300':'bg-amber-500/25 text-amber-300'}">${fmtSign(T.disAdj)}N</span><span class="font-bold">Manuell</span><span class="opacity-80">• Nachteile</span></span>`);
  }
  const oppSummaryBadge=T.opp?.ready?`<span class="text-[10px] font-bold text-indigo-300 tabular truncate">⚔️ ${esc(c1Name)} (${T.c1AutoAdv}V/${T.c1AutoDis}N) vs. ${esc(T.opp.oppName)} (${T.oppAutoAdv}V→N / ${T.oppAutoDis}N→V)</span>`:'';
  return `<div class="flex flex-wrap items-center justify-between gap-1.5 pb-0.5 min-w-0">
    <span class="text-[10px] font-extrabold t-mut uppercase tracking-wider">VORTEILE &amp; NACHTEILE</span>
    ${oppSummaryBadge}
  </div>
  <div class="grid grid-cols-11 gap-1.5 items-center min-w-0">
    <div ${aTip} class="col-span-5 min-w-0 flex items-center justify-between gap-1 p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/25 ${aTip?'cursor-help':''}"><div class="min-w-0"><div class="text-[10px] font-bold text-emerald-500">VORTEILE</div><div class="font-black text-sm tabular flex flex-wrap items-baseline gap-x-1"><span>${D.adv}</span>${(T.autoAdv||T.advAdj)?`<span class="text-[10px] font-bold text-emerald-400">(${T.autoAdv} Auto${T.advAdj?fmtSign(T.advAdj):''})</span>`:''}</div></div><div class="flex gap-1 shrink-0"><button type="button" data-action="adv-step" data-d="-1" ${D.adv<=0?'disabled':''} class="btn w-7 h-7 p-0">−</button><button type="button" data-action="adv-step" data-d="1" class="btn btn-ok w-7 h-7 p-0">+</button></div></div>
    <div class="col-span-1 flex justify-center"><button type="button" data-action="reset-dice-advdis" data-tip="Auf automatisch berechnete Vor-/Nachteile zurücksetzen" class="btn px-1.5 py-2 text-xs font-black ${hasAdvDisAdj?'!border-amber-400 !bg-amber-500/25 text-amber-300':'text-amber-500 opacity-75'}">↺</button></div>
    <div ${dTip} class="col-span-5 min-w-0 flex items-center justify-between gap-1 p-2 rounded-lg bg-rose-500/10 border border-rose-500/25 ${dTip?'cursor-help':''}"><div class="min-w-0"><div class="text-[10px] font-bold text-rose-500">NACHTEILE</div><div class="font-black text-sm tabular flex flex-wrap items-baseline gap-x-1"><span>${D.dis}</span>${(T.autoDis||T.disAdj)?`<span class="text-[10px] font-bold text-rose-400">(${T.autoDis} Auto${T.disAdj?fmtSign(T.disAdj):''})</span>`:''}</div></div><div class="flex gap-1 shrink-0"><button type="button" data-action="dis-step" data-d="-1" ${D.dis<=0?'disabled':''} class="btn w-7 h-7 p-0">−</button><button type="button" data-action="dis-step" data-d="1" class="btn bg-rose-600 text-white border-rose-600 w-7 h-7 p-0">+</button></div></div>
  </div>
  ${(hasC1Auto||hasOppAuto||hasAdvDisAdj)?`<div class="p-2 rounded-lg bg-black/25 border bdr-line space-y-1.5 min-w-0">${hasC1Auto?`<div class="space-y-1 min-w-0"><div class="text-[10px] font-extrabold text-acc leading-tight">${T.opp?.ready?`Eigene Quellen – ${esc(c1Name)} (${esc(D.wRollCat||'Normaler Test')})`:`Automatische Quellen (${esc(D.wRollCat||'Normaler Test')})`}:</div><div class="flex flex-wrap items-center gap-1 min-w-0">${c1Src.map(fmtSrcChip).join('')}${(T.critSrc||[]).map(c=>`<span data-tip="${esc(`${c.srcName} (${c.srcKind}): Kritische Ziffer ${fmtSign(c.val)}`)}" class="inline-flex flex-wrap items-center gap-1 px-1.5 py-0.5 rounded border text-[10px] leading-snug max-w-full min-w-0 break-words font-bold tabular cursor-help bg-amber-500/15 text-amber-300 border-amber-400/45">${fmtSign(c.val)} Krit. Ziffer (${esc(c.tagLbl||c.srcName)})</span>`).join('')}${(T.rollModSrc||[]).map(rm=>`<span data-tip="${esc(`${rm.srcName} (${rm.srcKind}): ${fmtSign(rm.val)} auf das geworfene W100-Ergebnis`)}" class="inline-flex flex-wrap items-center gap-1 px-1.5 py-0.5 rounded border text-[10px] leading-snug max-w-full min-w-0 break-words font-bold tabular cursor-help bg-cyan-500/15 text-cyan-300 border-cyan-400/45">🎲 ${fmtSign(rm.val)} Würfelergebnis (${esc(rm.tagLbl||rm.srcName)})</span>`).join('')}</div></div>`:''}${hasOppAuto?`<div class="${hasC1Auto?'pt-1.5 border-t border-white/10 ':''}space-y-1 min-w-0"><div class="text-[10px] font-extrabold text-indigo-300 leading-tight">⚔️ Gegner-Quellen – ${esc(T.opp.oppName)} (${esc(T.opp.oppRollCat||'Normaler Test')} • invertiert verrechnet):</div><div class="flex flex-wrap items-center gap-1 min-w-0">${oppSrc.map(fmtSrcChip).join('')}</div></div>`:''}${hasAdvDisAdj?`<div class="${(hasC1Auto||hasOppAuto)?'pt-1.5 border-t border-white/10 ':''}space-y-1 min-w-0"><div class="text-[10px] font-extrabold text-amber-300 leading-tight">Manuell:</div><div class="flex flex-wrap items-center gap-1 min-w-0">${manChips.join('')}</div></div>`:''}</div>`:''}
  ${(T.sitOptions&&T.sitOptions.length)?`<div class="pt-1 border-t bdr-line space-y-1 min-w-0"><div class="text-[10px] font-extrabold t-mut uppercase tracking-wider">Situative Schalter${T.opp?.ready?` (${esc(c1Name)})`:' (bei Bedarf anklicken)'}</div><div class="flex flex-wrap items-center gap-1.5 min-w-0">${T.sitOptions.map(so=>{const badge=so.reduceDis?`−${so.reduceDis} Nacht.`:so.adv?`+${so.adv} Vort.`:so.dis?`+${so.dis} Nacht.`:'±0';const tipTxt=so.items.map(i=>`${i.srcName}: ${i.label}`).join('\n')+(so.counterNote?`\nVerrechnung: ${so.counterNote}`:'');return `<button type="button" data-action="toggle-dice-sit" data-sit="${esc(so.sitKey)}" data-tip="${esc(tipTxt)}" class="btn py-1 px-2.5 text-[11px] font-bold tabular max-w-full ${so.active?(so.dis>0&&!so.adv?'bg-rose-600 text-white border-rose-500':'btn-ok'):'opacity-85 hover:opacity-100'}"><span>${so.active?'☑':'☐'}</span><span class="break-words">${esc(so.sitLabel)} (${badge})</span>${so.counterNote?`<span class="text-[10px] opacity-85">[${esc(so.counterNote)}]</span>`:''}</button>`;}).join('')}</div></div>`:''}
  ${(T.opp?.ready&&T.oppSitOptions&&T.oppSitOptions.length)?`<div class="pt-1 border-t bdr-line space-y-1 min-w-0"><div class="text-[10px] font-extrabold text-indigo-300 uppercase tracking-wider">⚔️ Situative Schalter (${esc(T.opp.oppName)} • invertiert)</div><div class="flex flex-wrap items-center gap-1.5 min-w-0">${T.oppSitOptions.map(so=>{const badge=so.reduceDis?`Gegner −${so.reduceDis}N`:so.adv?`Gegner +${so.adv}V → +${so.adv}N`:so.dis?`Gegner +${so.dis}N → +${so.dis}V`:'±0';const tipTxt=so.items.map(i=>`${i.srcName}: ${i.label}`).join('\n');return `<button type="button" data-action="toggle-dice-opp-sit" data-sit="${esc(so.sitKey)}" data-tip="${esc(tipTxt)}" class="btn py-1 px-2.5 text-[11px] font-bold tabular max-w-full ${so.active?(so.adv>0&&!so.dis?'bg-rose-600 text-white border-rose-500':'btn-ok'):'opacity-85 hover:opacity-100'}"><span>${so.active?'☑':'☐'}</span><span class="break-words">${esc(so.sitLabel)} (${badge})</span></button>`;}).join('')}</div></div>`:''}
  <div class="text-center text-xs font-bold py-1 rounded-lg ${T.net>0?'bg-emerald-500/15 text-emerald-500':T.net<0?'bg-rose-500/15 text-rose-500':'bg-black/15 t-mut'}">${T.net>0?`${Math.abs(T.rawNet)} Netto-Vorteil (${fmtSign(netBonus)})`:T.net<0?`${Math.abs(T.rawNet)} Netto-Nachteil (${netBonus})`:'Ausgeglichen (±0)'}</div>`;
}
export const buildThresholdInnerHtml=T=>{
  const c1Lbl=T.opp?.ready?(isLobbyNeutralDice()?(CLOUD.currentUser||'Gast'):(String(S.profile?.name||'').trim()||'Wert')):'Wert';
  const dLbl=T.opp?.ready?T.opp.oppName:'Schw.';
  return `<div class="text-[11px] font-semibold t-mut">Testschwelle (W100 ≤ Schwelle) • <span class="text-acc font-bold tabular">Chance: ${T.chance}%</span></div><div class="text-4xl font-black tabular my-0.5">${T.th}</div><div class="text-[11px] t-mut tabular break-words">${T.cv} (${esc(c1Lbl)}) + 50 − ${T.dv} (${esc(dLbl)}) ${T.bonus>=0?'+ '+T.bonus:'− '+Math.abs(T.bonus)}${T.effTh?` (inkl. ${fmtSign(T.effTh)} Effekt)`:''} = <strong>${T.th}</strong></div>${T.egMult>1?`<div class="mt-1.5 inline-flex items-center justify-center px-2.5 py-0.5 rounded-lg bg-amber-500/20 border border-amber-400/60 text-amber-300 text-[11px] font-black tabular">✨ Schwelle ${T.th}: EG ×${T.egMult} bei Erfolg (100 = Patzer)</div>`:''}${T.rollMod?`<div class="text-[11px] font-extrabold text-cyan-300 mt-1">⚡ Würfelergebnis-Modifikator: Geworfene Zahl ${fmtSign(T.rollMod)} (${esc((T.rollModSrc||[]).map(x=>x.tagLbl||x.srcName).join(', '))})</div>`:''}`;
};

export function renderDice(){
  const mount=$('diceMount'), p=mount, bd=$('diceBackdrop'), xl=window.innerWidth>=1280;
  if(!mount||!bd) return;
  const snap = mount.childElementCount>0 ? captureScrollState(mount) : null;
  applyWinFrame('dice', mount, bd, WIN_DEFAULTS.dice.dockClass); if(!D.open){mount.innerHTML='';return;}
  const isNeutral=isLobbyNeutralDice(), secAct=isSecretRollActive();
  const T=calcThreshold(), ci=CRIT_SEQ.indexOf(D.crit), cs=getCSkVal(), ds=getDSkVal();
  const adminToggleBarHtml=CLOUD.isAdmin?`<div class="subcard p-2.5 border-2 ${secAct?'border-amber-400 bg-gradient-to-r from-amber-500/20 via-purple-500/20 to-amber-500/20 shadow-lg ring-1 ring-purple-400/40':'bdr-line bg-black/20'} flex flex-wrap items-center justify-between gap-2">
    <button type="button" data-action="toggle-dice-secret" data-tip="Schaltet zwischen öffentlichem Live-Feed und geheimen Admin-Würfen um" class="btn py-1.5 px-3 text-xs font-black ${secAct?'bg-amber-500 text-slate-950 border-amber-300 shadow':'bdr-acc bg-acc-soft text-acc'}">${secAct?'🕵️ GEHEIMER WURF (Privat)':'👁️ Öffentlich (Live-Feed)'}</button>
    <span class="text-[11px] font-bold ${secAct?'text-amber-200':'t-mut'}">${secAct?'Geht nicht in den Live-Feed • später enthüllbar':'👑 Admin: Würfe gehen in den Live-Feed'}</span>
  </div>`:'';
  let secretBannerHtml='';
  if(CLOUD.isAdmin && UI.lastSecretRollId){
    const sr=(CLOUD.secretRolls||[]).find(x=>x&&x.id===UI.lastSecretRollId);
    if(sr){
      secretBannerHtml=!sr.revealed
        ?`<div class="subcard p-2.5 border-2 border-amber-400 bg-gradient-to-r from-amber-500/20 via-purple-500/20 to-amber-500/20 space-y-2 shadow-lg">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <span class="text-xs font-black text-amber-200">🕵️ GEHEIMER ADMIN-WURF (nur für dich sichtbar)</span>
            <span class="text-[10px] font-bold text-purple-200 tabular">${esc(sr.originalTs||sr.ts||'')}</span>
          </div>
          <button type="button" data-action="reveal-secret-roll" data-id="${esc(sr.id)}" class="btn w-full py-1.5 px-3 text-xs font-black bg-amber-500 text-slate-950 border-amber-300 hover:brightness-110 shadow">👁️ Jetzt im Live-Feed enthüllen (Reveal)</button>
        </div>`
        :`<div class="subcard p-2.5 border-2 border-emerald-500/70 bg-emerald-500/15 text-emerald-300 text-xs font-extrabold flex items-center justify-between gap-2">
          <span>✓ Dieser Geheimwurf wurde im Live-Feed enthüllt (${esc(sr.revealedAt||'')})</span>
        </div>`;
    }
  }
  const secretListArr=CLOUD.isAdmin?(CLOUD.secretRolls||[]):[];
  const secretListHtml=secretListArr.length?`<div class="subcard p-2.5 border border-purple-400/45 bg-purple-500/10 space-y-2">
    <div class="flex flex-wrap items-center justify-between gap-2">
      <button type="button" data-action="toggle-secret-list" class="flex items-center gap-1.5 text-left min-w-0 flex-1 cursor-pointer">
        <span class="text-xs font-black text-amber-300 w-4 shrink-0">${UI.secretRollsCollapsed?'▸':'▾'}</span>
        <span class="text-xs font-extrabold text-amber-200 truncate">🕵️ Geheime Admin-Würfe (${secretListArr.length})</span>
      </button>
      <button type="button" data-action="clear-secret-rolls" class="btn btn-err py-0.5 px-2 text-[10px] font-extrabold shrink-0">🗑️ Liste leeren</button>
    </div>
    ${!UI.secretRollsCollapsed?`<div data-scroll-key="diceSecretLog" class="space-y-1.5 max-h-56 overflow-y-auto pr-0.5">${secretListArr.map(r=>`<div class="subcard py-1.5 px-2.5 space-y-1 border ${r.revealed?'border-emerald-500/40 bg-emerald-500/10':'border-amber-400/40 bg-black/25'} min-w-0">
      <div class="flex items-center justify-between gap-2 min-w-0">
        <span class="text-xs font-extrabold truncate text-acc">${esc(r.label||'Freie Probe')}</span>
        <span class="text-[10px] t-mut tabular shrink-0">${esc(r.originalTs||r.ts||'')}</span>
      </div>
      <div class="flex flex-wrap items-center justify-between gap-1.5 min-w-0">
        <span class="text-[11px] font-bold tabular break-words min-w-0">${esc(formatSecretRollSummary(r))}</span>
        ${!r.revealed
          ?`<button type="button" data-action="reveal-secret-roll" data-id="${esc(r.id)}" class="btn py-0.5 px-2 text-[10px] font-black bg-amber-500 text-slate-950 border-amber-300 shrink-0">👁️ Enthüllen</button>`
          :`<span class="px-2 py-0.5 rounded-md bg-emerald-500/20 border border-emerald-400/50 text-emerald-300 text-[10px] font-extrabold tabular shrink-0">✓ Enthüllt (${esc(r.revealedAt||'')})</span>`}
      </div>
    </div>`).join('')}</div>`:''}
  </div>`:'';
  const skOpts=cur=>['0','10','15','20','30','custom'].map(v=>`<option value="${v}" ${cur===v?'selected':''}>${v==='custom'?'Eigener...':'+'+v}</option>`).join('');
  const DIFF_PRESETS=[20,30,40,50,60,70,80];
  const renderOppBoxBody=()=>{
    const opps=getCampaignOpponents();
    const opp=T.opp;
    const loading=Boolean(opp?.loading||isForeignSheetLoading(D.oppCharId));
    const errMsg=opp?.error||getForeignSheetError(D.oppCharId);
    const charPicker=`<div class="flex items-center gap-1.5 min-w-0">
      <select data-dice-opp="charId" aria-label="Gegner-Charakter wählen" class="inp flex-1 min-w-0 font-bold text-xs py-1.5">${opps.length?opps.map(o=>`<option value="${esc(o.id)}" ${D.oppCharId===o.id?'selected':''}>${esc(o.name)}${o.isSelf?' (Aktiver Bogen)':''}</option>`).join(''):'<option value="">Keine Charaktere in Kampagne</option>'}</select>
      <button type="button" data-action="refresh-dice-opp" data-tip="Aktuellen Stand des Gegners aus der Cloud nachladen" class="btn w-8 h-8 p-0 text-xs shrink-0 ${loading?'animate-spin':''}" ${loading?'disabled':''}>🔄</button>
    </div>`;
    if(!opps.length){
      return `${charPicker}<div class="text-[11px] t-mut bg-black/20 rounded-lg p-2 border bdr-line">Noch keine Charaktere in dieser Kampagne geladen. Klicke auf <strong>🔄</strong> zum Aktualisieren.</div>`;
    }
    if(loading&&!opp?.ready){
      return `${charPicker}<div class="text-[11px] text-acc font-bold bg-black/20 rounded-lg p-2 border bdr-acc">⏳ Lade Charakterbogen aus der Cloud...</div>`;
    }
    if(!opp?.ready){
      return `${charPicker}${errMsg?`<div class="text-[11px] text-rose-400 font-bold bg-rose-500/10 rounded-lg p-2 border border-rose-500/35">⚠️ ${esc(errMsg)}</div>`:`<div class="text-[11px] t-mut bg-black/20 rounded-lg p-2 border bdr-line">Bitte einen Gegner-Charakter auswählen.</div>`}`;
    }
    const oppSheet=opp.oppSheet, oppM=opp.oppM;
    const oppSkills=[...(oppSheet.skills||[])].filter(s=>s&&String(s.name||'').trim()).sort((a,b)=>String(a.name).localeCompare(String(b.name),'de'));
    const oppWeapons=[...(oppSheet.weapons||[])].filter(Boolean);
    const kindBar=`<div class="grid grid-cols-3 gap-1">
      <button type="button" data-action="dice-opp-kind" data-kind="preset" class="btn py-1 px-1 text-[11px] font-extrabold ${opp.oppKind==='preset'?'btn-pri':''}">🛡️ Abwehr</button>
      <button type="button" data-action="dice-opp-kind" data-kind="attr" class="btn py-1 px-1 text-[11px] font-extrabold ${opp.oppKind==='attr'?'btn-pri':''}">⚡ Attribut</button>
      <button type="button" data-action="dice-opp-kind" data-kind="skill" class="btn py-1 px-1 text-[11px] font-extrabold ${opp.oppKind==='skill'?'btn-pri':''}">🎯 Fertigk.</button>
    </div>`;
    let detailHtml='';
    if(opp.oppKind==='preset'){
      const showAtkPreset=Boolean(D.wRollCat==='Parieren'||D.wRollCat==='Blocken'||D.wRollCat==='Ausweichen'||opp.oppPreset==='attack');
      const presetBtns=[
        {k:'dodge',l:'💨 Ausw.',tip:'Ausweichen (GW + passende Fertigkeit)'},
        {k:'parry',l:'🛡️ Par.',tip:'Parieren (PR + Waffe + passende Fertigkeit)'},
        {k:'block',l:'🧱 Block.',tip:'Blocken (ST + Waffe/Schild + passende Fertigkeit)'}
      ];
      if(showAtkPreset) presetBtns.push({k:'attack',l:'⚔️ Angr.',tip:'Waffenangriff des Gegners'});
      const needsWeapon=opp.oppPreset==='parry'||opp.oppPreset==='block'||opp.oppPreset==='attack';
      const curWpVal=D.oppWeaponId==='__none__'?'__none__':(opp.oppWeapon?.id||'__none__');
      const curSkVal=D.oppSkillId==='__none__'?'__none__':(opp.sk?.id||'__none__');
      detailHtml=`<div class="grid ${presetBtns.length===4?'grid-cols-2 sm:grid-cols-4':'grid-cols-3'} gap-1">${presetBtns.map(pb=>`<button type="button" data-action="dice-opp-preset" data-preset="${pb.k}" data-tip="${esc(pb.tip)}" class="btn py-1 px-1 text-[11px] font-extrabold ${opp.oppPreset===pb.k?'btn-pri':''}">${pb.l}</button>`).join('')}</div>
      ${needsWeapon?`<div class="min-w-0"><label class="block text-[10px] font-bold t-mut mb-0.5">Waffe / Schild des Gegners</label><select data-dice-opp="weaponId" class="inp w-full text-xs font-bold py-1"><option value="__none__" ${curWpVal==='__none__'?'selected':''}>Ohne Waffe</option>${oppWeapons.map(w=>{const wn=String(w.name||'').trim()||getWeaponSubtype(w.wType).label;const tagsTxt=(w.tags||[]).map(t=>t?.name).filter(Boolean).slice(0,2).join(', ');return `<option value="${esc(w.id)}" ${curWpVal===w.id?'selected':''}>${esc(wn)}${tagsTxt?` (${esc(tagsTxt)})`:''}</option>`;}).join('')}</select></div>`:''}
      <div class="min-w-0"><label class="block text-[10px] font-bold t-mut mb-0.5">Fertigkeit des Gegners (${opp.attrKey} ${opp.attrVal})</label><select data-dice-opp="skillId" class="inp w-full text-xs font-bold py-1"><option value="__none__" ${curSkVal==='__none__'?'selected':''}>Ohne Fertigkeit (+0)</option>${oppSkills.map(sk=>{const b=getSkBonus(sk);return `<option value="${esc(sk.id)}" ${curSkVal===sk.id?'selected':''}>${esc(sk.name)} (${fmtSign(b)})</option>`;}).join('')}</select></div>`;
    }else if(opp.oppKind==='attr'){
      detailHtml=`<div class="grid grid-cols-4 gap-1">${ATTRS.map(a=>{const v=getAttrTot(a.k,oppM,oppSheet);return `<button type="button" data-action="dice-opp-attr" data-attr="${a.k}" class="btn py-1 px-0.5 flex-col gap-0 ${opp.attrKey===a.k?'btn-pri':''}"><span class="text-[10px]">${a.k}</span><span class="text-xs font-black tabular">${v}</span></button>`;}).join('')}</div>`;
    }else{
      if(oppSkills.length){
        const curSkId=opp.sk?.id||oppSkills[0].id;
        detailHtml=`<div class="min-w-0"><label class="block text-[10px] font-bold t-mut mb-0.5">Fertigkeit des Gegners</label><select data-dice-opp="skillId" class="inp w-full text-xs font-bold py-1">${oppSkills.map(sk=>{const av=getAttrTot(sk.linkedAttr||'PR',oppM,oppSheet),b=getSkBonus(sk);return `<option value="${esc(sk.id)}" ${curSkId===sk.id?'selected':''}>${esc(sk.name)} • ${sk.linkedAttr||'PR'} ${av} ${fmtSign(b)} = ${av+b}</option>`;}).join('')}</select></div>`;
      }else{
        detailHtml=`<div class="text-[11px] t-mut bg-black/20 rounded-lg p-2 border bdr-line">Dieser Charakter hat keine Fertigkeiten eingetragen.</div>`;
      }
    }
    const outDuel=(DUEL.outgoing&&DUEL.outgoing.targetCharId===D.oppCharId)?DUEL.outgoing:null;
    let liveDuelBarHtml='';
    if(outDuel&&outDuel.status==='waiting'){
      const remSec=Math.max(0,Math.ceil((toInt(outDuel.expiresAt,Date.now())-Date.now())/1000));
      liveDuelBarHtml=`<div class="p-2 rounded-lg border border-indigo-400/55 bg-indigo-500/15 space-y-1.5 min-w-0">
        <div class="flex items-center justify-between gap-2 text-[11px] font-extrabold text-indigo-200 min-w-0">
          <span class="truncate">⏳ Warte auf Konter von ${esc(opp.oppName)}...</span>
          <span id="duelWaitCountdown" class="tabular shrink-0 text-indigo-300">${remSec} s</span>
        </div>
        <div class="flex flex-wrap items-center gap-1.5">
          <button type="button" data-action="duel-roll-now" class="btn btn-pri flex-1 py-1 px-2 text-[11px] font-extrabold">🎲 Doch direkt würfeln</button>
          <button type="button" data-action="duel-cancel" class="btn py-1 px-2 text-[11px] font-bold opacity-85 hover:opacity-100">✕ Abbrechen</button>
        </div>
      </div>`;
    }else if(outDuel&&outDuel.status==='responded'&&outDuel.response?.snapshot){
      const sp=outDuel.response.snapshot;
      const modTxt=(sp.autoAdv||sp.autoDis)?` (${sp.autoAdv?`+${sp.autoAdv}V`:''}${sp.autoAdv&&sp.autoDis?' / ':''}${sp.autoDis?`+${sp.autoDis}N`:''})`:'';
      liveDuelBarHtml=`<div class="p-2 rounded-lg border border-emerald-400/60 bg-emerald-500/15 flex items-center justify-between gap-2 min-w-0">
        <div class="text-[11px] font-extrabold text-emerald-200 break-words min-w-0">✅ ${esc(opp.oppName)} kontert mit <span class="text-white">${esc(sp.oppShortLabel)}</span>${esc(modTxt)}${outDuel.response.useInspiration?' • ✨ Inspiration':''}</div>
        <button type="button" data-action="duel-clear-status" data-tip="Live-Antwort lösen und wieder lokal anpassen" class="btn w-6 h-6 p-0 text-[10px] font-black shrink-0">✕</button>
      </div>`;
    }else if(outDuel&&(outDuel.status==='timeout'||outDuel.status==='declined')){
      const reason=outDuel.status==='declined'?'Anfrage ignoriert':'Keine Antwort (Timeout)';
      liveDuelBarHtml=`<div class="p-2 rounded-lg border border-amber-400/50 bg-amber-500/10 flex flex-wrap items-center justify-between gap-1.5 min-w-0">
        <span class="text-[10px] font-bold text-amber-200 break-words">⏱️ ${reason} – lokaler Stand aktiv</span>
        <div class="flex items-center gap-1 shrink-0">
          <button type="button" data-action="duel-send" class="btn py-0.5 px-2 text-[10px] font-extrabold">🔄 Erneut</button>
          <button type="button" data-action="duel-clear-status" class="btn w-6 h-6 p-0 text-[10px] font-black">✕</button>
        </div>
      </div>`;
    }else if(opp.charId){
      liveDuelBarHtml=`<div class="flex items-center justify-between gap-1.5 min-w-0">
        <button type="button" data-action="duel-send" data-tip="Schickt dem Spieler von ${esc(opp.oppName)} eine Live-Konter-Anfrage (du kannst trotzdem jederzeit direkt würfeln)" class="btn w-full py-1 px-2.5 text-[11px] font-extrabold border-indigo-400/50 bg-indigo-500/15 text-indigo-200 hover:bg-indigo-500/25">📨 Konter anfragen (Live)</button>
      </div>`;
    }
    return `${charPicker}${errMsg?`<div class="text-[10px] text-amber-300 font-bold">⚠️ ${esc(errMsg)} (zeige zwischengespeicherten Stand)</div>`:''}${liveDuelBarHtml}${kindBar}${detailHtml}<div class="text-xs font-extrabold text-indigo-300 text-right tabular break-words pt-0.5 border-t border-white/10">${esc(opp.oppBreak)}</div>`;
  };
  const vbox=(ttl,mAct,mode,dirF,aF,sF,cF,mId,mCol,sVal,aL,sL)=>{
    const wKey=dirF==='cDirect'?'c':'d';
    const isDiffChanged=wKey==='d'&&(getEffD()!==40||D.dMode!=='direct');
    const diffResetBtn=wKey==='d'?`<button type="button" id="btnResetDiceDiff" data-action="reset-dice-diff" data-tip="Nur Schwierigkeit auf Standardwert 40 zurücksetzen (Eigener Wert &amp; Vor-/Nachteile bleiben erhalten)" class="btn py-0.5 px-1.5 text-[10px] font-extrabold tabular transition-all ${isDiffChanged?'!border-amber-400 !bg-amber-500/25 text-amber-300 shadow-sm':'opacity-70 hover:opacity-100'}">↺ 40</button>`:'';
    const diffPresetBar=(wKey==='d'&&mode!=='character')?`<div class="grid grid-cols-7 gap-1 pt-0.5" data-diff-presets="1">${DIFF_PRESETS.map(v=>{const active=D.dMode==='direct'&&toInt(D.dDirect)===v;return `<button type="button" data-action="dice-set-diff" data-val="${v}" data-tip="Schwierigkeit direkt auf ${v} setzen" class="btn py-0.5 px-0 text-[11px] tabular ${active?'btn-pri font-black':'opacity-85 hover:opacity-100'}">${v}</button>`;}).join('')}</div>`:'';
    const modeBtns=wKey==='d'
      ?`<div class="inline-flex flex-wrap rounded-lg p-0.5 bg-black/20 border bdr-line text-[11px] shrink-0"><button type="button" data-action="${mAct}" data-mode="direct" class="px-1.5 sm:px-2 py-0.5 rounded font-bold ${mode==='direct'?'bg-acc-soft text-acc':''}">Direkt</button><button type="button" data-action="${mAct}" data-mode="breakdown" class="px-1.5 sm:px-2 py-0.5 rounded font-bold ${mode==='breakdown'?'bg-acc-soft text-acc':''}">Aufgeschl.</button><button type="button" data-action="${mAct}" data-mode="character" data-tip="Gegen einen Charakterbogen der aktiven Kampagne würfeln" class="px-1.5 sm:px-2 py-0.5 rounded font-bold ${mode==='character'?'bg-indigo-500/30 text-indigo-200':''}">⚔️ <span class="hidden sm:inline">Gegen Charakter</span><span class="sm:hidden">Charakter</span></button></div>`
      :`<div class="inline-flex rounded-lg p-0.5 bg-black/20 border bdr-line text-[11px] shrink-0"><button type="button" data-action="${mAct}" data-mode="direct" class="px-2 py-0.5 rounded font-bold ${mode==='direct'?'bg-acc-soft text-acc':''}">Direkt</button><button type="button" data-action="${mAct}" data-mode="breakdown" class="px-2 py-0.5 rounded font-bold ${mode==='breakdown'?'bg-acc-soft text-acc':''}">Aufgeschl.</button></div>`;
    const bodyContent=(wKey==='d'&&mode==='character')
      ?renderOppBoxBody()
      :(mode==='direct'
        ?`<input data-dice="${dirF}" data-tip="Tipp: Feld anklicken und Mausrad drehen für ±1" type="text" inputmode="numeric" value="${D[dirF]}" class="inp w-full text-lg font-black tabular"/>`
        :`<div class="grid grid-cols-2 gap-1.5"><div><label class="block text-[10px] font-bold t-mut">${aL}</label><input data-dice="${aF}" data-tip="Tipp: Feld anklicken und Mausrad drehen für ±1" type="text" inputmode="numeric" value="${D[aF]}" class="inp w-full font-bold tabular"/></div><div><label class="block text-[10px] font-bold t-mut">${sL}</label><select data-dice-sel="${sF}" class="inp w-full font-bold">${skOpts(D[sF])}</select></div></div>${D[sF]==='custom'?`<input data-dice="${cF}" data-tip="Tipp: Feld anklicken und Mausrad drehen für ±1" type="text" inputmode="numeric" value="${D[cF]}" class="inp w-full text-xs font-bold"/>`:''}<div id="${mId}" class="text-xs font-extrabold ${mCol} text-right tabular">${D[aF]} + ${sVal} = ${toInt(D[aF])+sVal}</div>`);
    return `<div class="subcard space-y-2 min-w-0 ${wKey==='d'&&mode==='character'?'border-indigo-400/50 bg-indigo-500/5':''}"><div class="flex flex-wrap items-center justify-between gap-1.5"><div class="flex items-center gap-1.5 min-w-0"><span class="text-xs font-extrabold truncate">${ttl}</span>${diffResetBtn}</div>${modeBtns}</div>${bodyContent}${diffPresetBar}</div>`;
  };
  const mob=isMobileLayout();
  p.innerHTML=`<div class="card p-0 ${mob?'rounded-none border-0':'rounded-2xl'} flex-1 h-full flex flex-col min-h-0 overflow-hidden shadow-2xl relative"><div data-win-drag="dice" class="shrink-0 z-10 flex flex-wrap items-center justify-between gap-1.5 sm:gap-2 px-3 sm:px-4 py-2.5 sm:py-3 border-b bdr-line win-drag-hdr" style="background:var(--surf2)"><div class="min-w-0 flex-1"><h2 class="text-sm font-extrabold truncate">🎲 Würfelassistent</h2><p class="text-[11px] text-acc font-bold truncate">${esc(D.label)}${T.opp?.ready?` ⚔️ vs. ${esc(T.opp.oppName)} (${esc(T.opp.oppShortLabel)})`:''}</p></div><div class="flex items-center gap-1 sm:gap-1.5 shrink-0"><button type="button" data-action="toggle-livedice" aria-label="Live-Würfel umschalten" data-tip="Live-Würfel-Fenster daneben ein-/ausblenden" class="btn py-1 px-2 text-xs ${LD.open?'btn-pri':''}">📡 <span class="hidden sm:inline">Live</span></button>${renderWinCtrlBtns('dice')}${xl&&!UI.inLobby?`<button type="button" data-action="toggle-dock" class="hidden xl:inline-flex btn py-1 px-2 text-xs">${D.docked?'🗗 Overlay':'📌 Andocken'}</button>`:''}<button type="button" data-action="reset-dice" class="btn btn-err py-1 px-2 text-xs">Reset</button><button type="button" data-action="close-dice" aria-label="Schließen" class="btn btn-err ${mob?'w-9 h-9 p-0 text-sm':'py-1 px-2 text-xs'} font-black shrink-0">✕</button></div></div>
  <div data-dice-scroll-body="1" class="p-3.5 sm:p-4 space-y-3.5 min-w-0 flex-1 min-h-0 overflow-y-auto overscroll-contain${mob?' safe-pb':''}">
    ${adminToggleBarHtml}
    ${isNeutral?`<div class="subcard py-2 px-3 border bdr-acc bg-acc-soft/30 text-xs font-extrabold text-acc flex items-center justify-between gap-2"><span>🏰 Lobby-Modus (Neutral • Absender: ${esc(CLOUD.currentUser || 'Gast')})</span></div>`:''}
    ${(!isNeutral&&S.inspirationActive)?`<div class="subcard p-2.5 border-2 border-amber-400 bg-amber-500/20 flex items-center justify-between gap-2 shadow-lg"><div class="flex items-center gap-2"><span class="text-base">✨</span><div><div class="text-xs font-black text-amber-300">✨ Inspiration aktiv (+1 Vorteil)</div><div class="text-[10px] text-amber-200/90">Automatisch +1 Vorteil verrechnet • setzt sich nach dem Wurf zurück</div></div></div><button type="button" data-action="cancel-inspiration" data-tip="Inspiration doch nicht für diesen Wurf nutzen (1 Stapel zurücklegen)" class="btn py-0.5 px-2 text-[10px] border-amber-400/60 text-amber-200 shrink-0">↺ Zurücklegen</button></div>`:''}
    ${isNeutral?'':(()=>{const aw=D.weaponId?S.weapons.find(x=>x.id===D.weaponId):null,rawCat=D.wRollCat==='Parade'?'Parieren':D.wRollCat,curCat=['Normaler Test','Trefferwurf','Parieren','Blocken','Ausweichen'].includes(rawCat)?rawCat:(aw?'Trefferwurf':'Normaler Test'),modeIcon=c=>c==='Normaler Test'?'📋 ':c==='Trefferwurf'?'🎲 ':c==='Parieren'?'🛡️ ':c==='Blocken'?'🧱 ':'💨 ';if(aw){const awSub=getWeaponSubtype(aw.wType),wNm=esc(String(aw.name||'').trim()||awSub.label);return `<div class="subcard p-2.5 border bdr-acc bg-acc-soft/40 space-y-2"><div class="flex items-center justify-between gap-2"><div class="min-w-0"><div class="text-[10px] font-extrabold text-acc uppercase tracking-wider">${esc(awSub.icon)} Aktiver Waffen-Kontext • Modus: ${curCat}</div><div class="text-xs font-black truncate">${wNm}</div></div><button type="button" data-action="clear-dice-weapon" data-tip="Waffen-Kontext lösen & auf Normaler Test wechseln" class="btn btn-err py-0.5 px-2 text-[11px] shrink-0">✕ Lösen</button></div><div class="flex flex-wrap items-center gap-1">${['Normaler Test','Trefferwurf','Parieren','Blocken','Ausweichen'].map(c=>`<button type="button" data-action="set-dice-wcat" data-wcat="${c}" class="btn py-0.5 px-2 text-[11px] font-extrabold ${curCat===c?'btn-pri':''}">${modeIcon(c)}${c}</button>`).join('')}</div></div>`;}return `<div class="subcard p-2.5 space-y-1.5"><div class="flex items-center justify-between gap-2"><div class="text-[10px] font-extrabold t-mut uppercase tracking-wider">🎯 Wurf-Modus (Strikte Isolation)</div>${curCat!=='Normaler Test'?`<button type="button" data-action="clear-dice-weapon" data-tip="Zurück auf Normaler Test" class="btn py-0.5 px-2 text-[10px]">↺ Normaler Test</button>`:''}</div><div class="flex flex-wrap items-center gap-1">${['Normaler Test','Trefferwurf','Parieren','Blocken','Ausweichen'].map(c=>`<button type="button" data-action="set-dice-wcat" data-wcat="${c}" class="btn py-0.5 px-2 text-[11px] font-extrabold ${curCat===c?'btn-pri':''}">${modeIcon(c)}${c}</button>`).join('')}</div></div>`;})()}
    <div class="subcard p-2.5 space-y-1.5"><div class="text-[10px] font-extrabold t-mut">${isNeutral?'STANDARD-ATTRIBUTE (NEUTRAL 50)':'ATTRIBUT WÄHLEN'}</div><div class="grid grid-cols-4 sm:grid-cols-8 gap-1">${ATTRS.map(a=>isNeutral?`<button type="button" data-action="dice-pick-lobby-attr" data-attr="${a.k}" class="btn py-1 px-0.5 flex-col gap-0 ${D.label===`Freie Probe: ${a.k} (50)`?'btn-pri':''}"><span class="text-[10px]">${a.k}</span><span class="text-xs font-black tabular">50</span></button>`:`<button type="button" data-action="dice-pick-attr" data-attr="${a.k}" class="btn py-1 px-0.5 flex-col gap-0 ${D.attrKey===a.k?'btn-pri':''}"><span class="text-[10px]">${a.k}</span><span class="text-xs font-black tabular">${getAttrTot(a.k)}</span></button>`).join('')}</div></div>
    <div class="grid grid-cols-1 ${D.dMode==='character'?'':'sm:grid-cols-2'} gap-3">${vbox('Eigener Wert','c-mode',D.cMode,'cDirect','cAttr','cSkill','cCustom','diceCMath','text-acc',cs,'Attribut','Fertigkeit')}${vbox('Schwierigkeit','d-mode',D.dMode,'dDirect','dAttr','dSkill','dCustom','diceDMath','text-indigo-400',ds,'Gegner-Attr.','Gegner-Fert.')}</div>
    <div id="diceAdvDisBox" class="subcard space-y-2">${buildAdvDisInnerHtml(T)}</div>
    <div id="diceThBox" class="subcard text-center">${buildThresholdInnerHtml(T)}</div>
    <div class="dice-bar">
      <div><div class="subcard py-1.5 px-2 flex items-center justify-between gap-1 h-[44px]"><span class="text-[10px] font-extrabold t-mut">WÜRFE</span><div class="flex items-center gap-1"><button type="button" data-action="cnt-step" data-d="-1" ${D.cnt<=1?'disabled':''} class="btn w-6 h-6 p-0">−</button><select data-dice-sel="cnt" class="inp py-0.5 px-1 text-xs font-extrabold tabular">${[1,2,3,4,5,6,7,8,9,10].map(n=>`<option value="${n}" ${D.cnt===n?'selected':''}>${n}</option>`).join('')}</select><button type="button" data-action="cnt-step" data-d="1" ${D.cnt>=10?'disabled':''} class="btn w-6 h-6 p-0">+</button></div></div></div>
      <div class="justify-self-center order-first sm:order-none w-full sm:w-auto"><button type="button" data-action="roll-d100" class="btn ${secAct?'bg-gradient-to-r from-amber-500 to-purple-600 text-white border-amber-300 ring-2 ring-amber-400/60 shadow-lg':'btn-pri'} w-full sm:w-auto sm:min-w-[144px] max-w-full h-[44px] text-sm font-black px-5">${secAct?'🕵️ ':'🎲 '}${D.cnt===1?(secAct?'Geheim würfeln!':'Würfeln!'):D.cnt+(secAct?'× Geheim!':'× Würfeln!')}</button></div>
      <div class="flex flex-col items-end"><div ${T.critSrc?.length?`data-tip="${esc('Automatischer Krit-Bonus:\n'+T.critSrc.map(c=>`• ${c.srcName}: +${c.val}`).join('\n'))}"`:''} class="subcard py-1.5 px-2 flex items-center justify-between gap-1 h-[44px] w-full sm:w-auto ${T.autoCrit?'border-amber-400 bg-amber-500/15 cursor-help':'border-amber-500/40'}"><span class="text-[10px] font-extrabold text-amber-500">KRIT.${T.autoCrit?` <span class="text-amber-300">(+${T.autoCrit})</span>`:''}</span><div class="flex items-center gap-1"><button type="button" data-action="crit-step" data-d="-1" ${ci<=0?'disabled':''} class="btn w-6 h-6 p-0">−</button><select data-dice-sel="crit" class="inp py-0.5 px-1 text-xs font-extrabold tabular text-amber-500">${CRIT_SEQ.map(c=>`<option value="${c}" ${D.crit===c?'selected':''}>${c}</option>`).join('')}</select><button type="button" data-action="crit-step" data-d="1" ${ci>=CRIT_SEQ.length-1?'disabled':''} class="btn w-6 h-6 p-0">+</button></div></div>${D.crit!=='1'?`<button type="button" data-action="crit-mode" class="mt-1 text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/15 text-amber-500">${D.critMode==='range'?`Modus: 1–${D.crit} ↻`:`Modus: nur ${D.crit} ↻`}${T.autoCrit?` • ⚡ Krit +${T.autoCrit}`:''}</button>`:''}</div>
    </div>
    ${(D.wRollCat==='Trefferwurf')?`<div class="flex justify-center"><button type="button" data-action="roll-blocked-hit-20" data-tip="Behält deinen aktuellen Trefferwert bei, setzt die Schwierigkeit auf 20 und würfelt direkt die Erfolgsgrade (EG) für den Grundschaden gegen die Rüstung aus." class="btn w-full py-1.5 px-3 text-xs font-extrabold border-amber-400/60 bg-amber-500/15 text-amber-300 hover:bg-amber-500/25">${secAct?'🕵️ ':''}🛡️ Wurde geblockt (Folgewurf vs. Schw. 20)</button></div>`:''}
    ${(()=>{const cCnt=Math.max(1,Math.min(100,toInt(D.customCnt,1))), cSides=Math.max(1,toInt(D.customSides,20)), cForm=`${cCnt}W${cSides}`;return `<div class="subcard p-2.5 space-y-2 border border-sky-400/35 bg-sky-500/5">
      <div class="flex items-center justify-between gap-2">
        <button type="button" data-action="toggle-dice-custom" class="flex items-center gap-1.5 text-left min-w-0 flex-1 cursor-pointer">
          <span class="text-xs font-black text-sky-400 w-4 shrink-0">${D.customOpen?'▾':'▸'}</span>
          <span class="text-xs font-extrabold text-sky-300 truncate">🎲 Benutzerdefinierte Würfel</span>
        </button>
        <span id="lblCustomFormulaPill" class="px-2 py-0.5 rounded-md bg-sky-500/15 border border-sky-400/40 text-sky-300 text-[11px] font-black tabular shrink-0">${esc(cForm)}</span>
      </div>
      ${D.customOpen?`<div class="space-y-2 pt-1.5 border-t bdr-line">
        <div class="grid grid-cols-7 gap-1">${[4,6,8,10,12,20,100].map(sd=>`<button type="button" data-action="dice-custom-preset" data-sides="${sd}" class="btn py-1 px-0 text-[11px] tabular ${cSides===sd?'btn-pri font-black':'opacity-85 hover:opacity-100'}">W${sd}</button>`).join('')}</div>
        <div class="grid grid-cols-12 gap-2 items-end tabular">
          <div class="col-span-5">
            <label class="block text-[10px] font-bold t-mut mb-0.5">Anzahl</label>
            <input data-dice-custom="cnt" type="text" inputmode="numeric" value="${esc(D.customCnt)}" placeholder="1" class="inp w-full text-center font-black py-1 px-1"/>
          </div>
          <div class="col-span-7">
            <label class="block text-[10px] font-bold t-mut mb-0.5">Würfel (Seitenzahl)</label>
            <div class="flex items-center gap-1.5">
              <span class="text-sm font-black text-sky-400 shrink-0">W</span>
              <input data-dice-custom="sides" type="text" inputmode="numeric" value="${esc(D.customSides)}" placeholder="20" class="inp w-full text-center font-black py-1 px-1"/>
            </div>
          </div>
        </div>
        <button type="button" id="btnRollCustomDice" data-action="roll-custom-dice" class="btn w-full py-1.5 px-3 text-xs font-black ${secAct?'border-amber-400 bg-amber-500/20 text-amber-200 hover:bg-amber-500/30':'border-sky-400/60 bg-sky-500/20 text-sky-200 hover:bg-sky-500/30'}">${secAct?'🕵️ 🎲 ':'🎲 '}${esc(cForm)}${secAct?' geheim würfeln':' würfeln'}</button>
      </div>`:''}
    </div>`;})()}
    ${secretBannerHtml}
    <div>${UI.lastRollHtml||`<div class="subcard border-dashed text-center text-xs t-mut py-3">Bereit zum Würfeln!</div>`}</div>
    ${secretListHtml}
    <div class="border-t bdr-line pt-2.5"><div class="flex justify-between mb-1.5"><span class="text-xs font-extrabold t-mut">Würfel-Log (${diceLogs.length})</span><button type="button" data-action="clear-dice-log" class="text-[11px] font-bold t-mut hover:text-rose-500">Leeren</button></div><div data-scroll-key="diceLog" class="space-y-1 max-h-36 overflow-y-auto text-xs">${diceLogs.map(l=>`<div class="subcard py-1 px-2.5 space-y-0.5 min-w-0"><div class="flex justify-between gap-2 min-w-0"><span class="truncate"><strong>${esc(l.lbl)}</strong>${l.isCustomDice?`: ${esc(l.sum)}`:` [≤${l.th}]: ${l.sum}`}</span><span class="text-[10px] t-mut tabular shrink-0">${l.t}</span></div>${l.advSrc?`<div class="text-[10px] t-mut break-words">↳ ${esc(l.advSrc)}</div>`:''}</div>`).join('')}</div></div>
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
  const allCamps=getCampaigns();
  const visCamps=CLOUD.isAdmin?allCamps:(CLOUD.currentUser?allCamps.filter(c=>isUserInCampaign(c,CLOUD.currentUser)):allCamps);
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
  const atkVal=toInt(D.blockFollowAtk,getEffD()), dv=20, th2=atkVal+50-dv, ch2=Math.max(1,Math.min(99,th2)), m2=calcEgMultiplier(th2), fr=UI.lastBlockFollowRes;
  let frHtml='';
  if(fr){
    const cls2=fr.crit?'crit-glow border-amber-400 bg-amber-500/15':fr.ok?'border-emerald-500/60 bg-emerald-500/10':'border-rose-500/60 bg-rose-500/10';
    const frMult=fr.egMult||1, frBase=fr.baseEg!==undefined?fr.baseEg:(frMult>1?Math.round(fr.eg/frMult):fr.eg);
    frHtml=`<div class="subcard p-3 border-2 ${cls2} text-center space-y-1.5 mt-2 tabular">
      <div class="text-[11px] font-bold t-mut">Folgewurf (Aggressor-Trefferwert ${fr.atkVal} vs. Schwierigkeit 20) • Schwelle ≤ ${fr.th} (${fr.chance}%)${frMult>1?` • <strong class="text-amber-300">EG ×${frMult}</strong>`:''}</div>
      <div class="flex items-center justify-center gap-3">
        <span class="text-3xl font-black">${fr.r}</span>
        <span class="px-3 py-1 rounded-lg text-white font-extrabold text-xs sm:text-sm ${fr.ok?'bg-emerald-600':'bg-rose-600'}">${fr.ok?`EG: ${fr.eg}${frMult>1?` (${frBase} ×${frMult})`:''} (Grundschaden vs. Rüstung)`:`0 EG • ${fr.r===100?'Patzer (100)':'Misserfolg'} (MEG: ${fr.meg})`}</span>
      </div>
      <div class="text-xs font-extrabold ${fr.crit?'text-amber-400':fr.ok?'text-emerald-400':'text-rose-400'}">${fr.ok?`${fr.crit?'★ Kritisch! ':''}Erzielte Erfolgsgrade für Grundschaden gegen Rüstung: ${fr.eg} EG${frMult>1?` (${frBase} ×${frMult})`:''}`:'Kein Durchkommen – 0 EG Grundschaden gegen die Rüstung'}</div>
    </div>`;
  }
  return `<div class="subcard mt-2 p-3 border-2 border-emerald-500/50 bg-emerald-500/10 space-y-2.5 text-left">
    <div class="text-xs font-extrabold text-emerald-400 flex items-center justify-between gap-2">
      <span>🛡️ Erfolgreich geblockt! → 2. Wurf (Grundschaden vs. Rüstung)</span>
      <span id="blockFollowThInfo" class="text-[11px] font-bold text-acc tabular">Schw. 20 • Schwelle ≤ ${th2} (${ch2}%)${m2>1?` • EG ×${m2}`:''}</span>
    </div>
    <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
      <label class="flex items-center gap-1.5 text-xs font-bold t-mut shrink-0">
        <span>Aggressor-Trefferwert:</span>
        <input id="inpBlockFollowAtk" data-dice="blockFollowAtk" type="text" inputmode="numeric" value="${atkVal}" class="inp w-16 text-center font-black tabular py-1 px-1.5 text-xs"/>
      </label>
      <button type="button" data-action="roll-block-followup" class="btn ${isSecretRollActive()?'bg-amber-500 text-slate-950 border-amber-300':'btn-ok'} flex-1 py-1.5 px-3 text-xs font-black">${isSecretRollActive()?'🕵️ ':''}🛡️ Erfolgreich geblockt! → Folgewurf (Aggressor-Trefferwert gegen Schwierigkeit 20)</button>
    </div>
    ${frHtml}
  </div>`;
}
export function executeBlockFollowUpRoll(){
  const inp=$('inpBlockFollowAtk'), atkVal=toInt(inp?inp.value:D.blockFollowAtk,getEffD());
  D.blockFollowAtk=atkVal;
  const dv=20, th=atkVal+50-dv, chance=Math.max(1,Math.min(99,th)), egMult=calcEgMultiplier(th);
  const r=rollW100(), ok=r!==100&&(r===1||r<=th), crit=ok&&(r%10===1);
  const baseEg=ok?Math.ceil(r/10):0, eg=ok?baseEg*egMult:0, meg=!ok?Math.ceil((101-r)/10):0;
  UI.lastBlockFollowRes={r,ok,crit,baseEg,eg,egMult,meg,atkVal,dv,th,chance};
  UI.lastRollHtml=(UI.lastBlockBaseHtml||'')+renderBlockFollowUpBox();
  const lbl=`🛡️ Block-Folgewurf (Aggressor ${atkVal} vs. Schw. 20 → Grundschaden)`;
  const isLobBlk=Boolean(UI.inLobby);
  publishLiveRoll({
    id:uid(),tsMs:Date.now(),ts:new Date().toLocaleTimeString('de-DE',{hour:'2-digit',minute:'2-digit',second:'2-digit'}),
    senderTabId:LIVE_TAB_ID,charId:isLobBlk?'':(S.charId||''),charName:isLobBlk?(CLOUD.currentUser?CLOUD.currentUser:'Gast'):(String(S.profile.name||'').trim()||'Unbenannter Held'),
    playerName:isLobBlk?'':String(CLOUD.currentUser||S.owner||'').trim(),campaignId:isLobBlk?getActiveLiveCampaignId():getCharCampaignId(S.charId),label:lbl,weaponId:isLobBlk?null:(D.weaponId||null),wRollCat:'Blocken',
    th,egMult,chance,cv:atkVal,dv:20,adv:0,dis:0,net:0,bonus:0,effTh:0,
    cBreak:`Aggressor-Trefferwert ${atkVal}`,dBreak:'20 (Block-Folgewurf)',advBreak:'±0',critLbl:'Endziffer 1',
    formula:`${atkVal} (Aggressor) + 50 − 20 (Schw.) = ${th} (${chance}%)`,cnt:1,res:[{r,ok,crit,baseEg,eg,egMult,meg}]
  });
  diceLogs.unshift({t:new Date().toLocaleTimeString('de-DE'),lbl,th,sum:`${r}(${crit?'★':''}${ok?('EG'+eg+(egMult>1?` (${baseEg} ×${egMult})`:'')):'MEG'+meg})`});
  if(diceLogs.length>40) diceLogs.length=40;
  renderDice();
}
export function executeDiceRoll(opts={}){
  const prevWinY=window.scrollY, prevWinX=window.scrollX;
  const isAtkBlk20=Boolean(opts&&opts.isAttackerBlockFollowUp);
  const T=calcThreshold(), {th}=T, res=[];
  for(let i=0;i<D.cnt;i++){
    const rawR=rollW100(), rollMod=toInt(T.rollMod,0), r=rollMod?Math.max(1,Math.min(100,rawR+rollMod)):rawR, ok=r!==100&&(r===1||r<=T.th);
    let crit=false; if(ok){const ed=r%10,td=parseInt(D.crit,10),rk=x=>x===0?10:x;crit=(D.crit==='1'||D.critMode==='range')?rk(ed)<=rk(td):ed===td;}
    const baseEg=ok?Math.ceil(r/10):0, eg=ok?baseEg*T.egMult:0, meg=!ok?Math.ceil((101-r)/10):0;
    res.push({r,rawR,rollMod,ok,crit,baseEg,eg,egMult:T.egMult,meg});
  }
  const isLobRoll=Boolean(UI.inLobby);
  const c1Name=isLobRoll?(CLOUD.currentUser?CLOUD.currentUser:'Gast'):(String(S.profile.name||'').trim()||'Unbenannter Held');
  const isVsOpp=Boolean(!isAtkBlk20&&T.opp&&T.opp.ready);
  let vsSummary='';
  if(isVsOpp){
    const c1Sk=(!isLobRoll&&D.skillId)?(S.skills||[]).find(x=>x.id===D.skillId):null;
    const c1Wp=(!isLobRoll&&D.weaponId)?(S.weapons||[]).find(x=>x.id===D.weaponId):null;
    const c1WpName=c1Wp?(String(c1Wp.name||'').trim()||getWeaponSubtype(c1Wp.wType).label):'';
    let c1Short=`Wert ${T.cv}`;
    if(c1Sk) c1Short=`${c1Sk.name} ${T.cv}`;
    else if(c1WpName) c1Short=`${c1WpName} ${T.cv}`;
    else if(!isLobRoll&&D.attrKey) c1Short=`${D.attrKey} ${T.cv}`;
    else if(D.wRollCat&&D.wRollCat!=='Normaler Test') c1Short=`${D.wRollCat} ${T.cv}`;
    vsSummary=`${c1Name} (${c1Short}) vs. ${T.opp.oppName} (${T.opp.oppShortLabel})`;
  }
  const rollTitle=isAtkBlk20?`${D.label} • 🛡️ Geblockt (Folgewurf vs. Schw. 20)`:(isVsOpp?vsSummary:D.label);
  const advSrcParts=buildAdvSrcShortList(T);
  const advSrcChipsHtml=advSrcParts.map(pt=>{
    const isN=/^[+-]\d+N\b/.test(pt), isRed=/^-\d+N\b/.test(pt), isMan=/\(Manuell\)$/.test(pt);
    const cls=isMan?'bg-amber-500/15 text-amber-200 border-amber-400/40':(isN&&!isRed)?'bg-rose-500/15 text-rose-200 border-rose-500/35':'bg-emerald-500/15 text-emerald-200 border-emerald-500/35';
    return `<span class="px-1.5 py-0.5 rounded border font-bold tabular max-w-full break-words ${cls}">${esc(pt)}</span>`;
  }).join('');
  const vsSideRowHtml=isVsOpp?`<div class="mt-1.5 text-[10px] font-bold text-indigo-300 tabular break-words">⚔️ ${esc(c1Name)}: ${T.c1AutoAdv}V/${T.c1AutoDis}N • ${esc(T.opp.oppName)}: ${T.oppAutoAdv}V→N / ${T.oppAutoDis}N→V</div>`:'';
  const advSrcRowHtml=advSrcParts.length?`<div class="mt-2 pt-1.5 border-t border-white/10 flex flex-wrap items-center justify-center gap-1 text-[10px] min-w-0 break-words"><span class="font-extrabold t-mut mr-0.5">Vor./Nacht.:</span>${advSrcChipsHtml}</div>`:'';
  let baseHtml='';
  if(res.length===1){
    const x=res[0], cls=x.crit?'crit-glow border-amber-400 bg-amber-500/15':x.ok?'border-emerald-500/60 bg-emerald-500/10':'border-rose-500/60 bg-rose-500/10';
    const xMult=x.egMult||T.egMult||1;
    const blkBanner=isAtkBlk20?`<div class="mt-2.5 pt-2 border-t border-white/10 text-xs font-extrabold ${x.ok?'text-amber-300':'text-rose-400'}">${x.ok?`🛡️ Geblockter Treffer → Erzielte EG für Grundschaden gegen Rüstung: <span class="px-2 py-0.5 rounded bg-amber-500 text-slate-950 font-black">${x.eg} EG${xMult>1?` (${x.baseEg} ×${xMult})`:''}</span>`:`🛡️ Am Block gescheitert → 0 EG Grundschaden (MEG: ${x.meg})`}</div>`:'';
    baseHtml=`<div class="subcard text-center p-4 border-2 ${cls}"><div class="text-[11px] font-bold t-mut break-words">${esc(rollTitle)} • Schwelle ${th}${xMult>1?` • <span class="text-amber-300">EG ×${xMult}</span>`:''}</div>${vsSideRowHtml}<div class="text-5xl font-black tabular my-1">🎲 ${x.r}${x.rollMod&&x.rawR!==undefined?`<span class="text-xs font-bold text-cyan-300 ml-1">(Wurf ${x.rawR}${fmtSign(x.rollMod)})</span>`:''}</div><div class="text-xs font-black uppercase ${x.crit?'text-amber-500':x.ok?'text-emerald-500':'text-rose-500'}">${x.crit?'★ Kritischer Erfolg! ★':x.ok?'Erfolg':(x.r===100?'💀 Patzer (100)':'Misserfolg')}</div><div class="mt-2"><span class="px-3.5 py-1 rounded-lg text-white font-extrabold text-sm tabular ${x.ok?'bg-emerald-600':'bg-rose-600'}">${x.ok?('EG: '+x.eg+(xMult>1?` (${x.baseEg} ×${xMult})`:'')+(isAtkBlk20?' (Grundschaden)':'')):'MEG: '+x.meg}</span></div>${advSrcRowHtml}${blkBanner}</div>`;
  }else{
    const w=res.filter(x=>x.ok).length, c=res.filter(x=>x.crit).length;
    const multiSrcBox=(advSrcParts.length||isVsOpp)?`<div class="subcard py-1.5 px-2.5 space-y-1 text-[10px] min-w-0 break-words">${isVsOpp?`<div class="font-bold text-indigo-300 tabular break-words">⚔️ ${esc(rollTitle)} • ${esc(c1Name)} (${T.c1AutoAdv}V/${T.c1AutoDis}N) vs. ${esc(T.opp.oppName)} (${T.oppAutoAdv}V→N / ${T.oppAutoDis}N→V)</div>`:''}${advSrcParts.length?`<div class="flex flex-wrap items-center gap-1 min-w-0"><span class="font-extrabold t-mut mr-0.5">Vor./Nacht.:</span>${advSrcChipsHtml}</div>`:''}</div>`:'';
    baseHtml=`<div class="space-y-1.5"><div class="subcard py-1.5 px-3 flex justify-between text-xs font-extrabold"><span>${D.cnt}× W100 (≤${th})${T.egMult>1?` • <span class="text-amber-300">EG ×${T.egMult}</span>`:''}${isAtkBlk20?' • 🛡️ Folgewurf vs. Schw. 20 (Grundschaden)':''}</span><span>${w}/${D.cnt} Erfolge${c?` • ★ ${c}`:''}</span></div><div class="grid grid-cols-2 gap-1.5">${res.map((x,i)=>{const xm=x.egMult||T.egMult||1;return `<div class="subcard p-2 flex justify-between items-center ${x.crit?'border-amber-400 bg-amber-500/15':x.ok?'border-emerald-500/50 bg-emerald-500/10':'border-rose-500/50 bg-rose-500/10'}"><span class="font-black tabular">#${i+1}: ${x.r}${x.rollMod&&x.rawR!==undefined?` (${x.rawR}${fmtSign(x.rollMod)})`:""}</span><span class="text-xs font-extrabold">${x.crit?'★ ':''}${x.ok?('EG '+x.eg+(xm>1?` ×${xm}`:'')+(isAtkBlk20?' (GS)':'')):'MEG '+x.meg}</span></div>`;}).join('')}</div>${multiSrcBox}</div>`;
  }
  if(D.wRollCat==='Blocken'&&res.some(x=>x.ok)){
    D.blockFollowAtk=getEffD();
    UI.lastBlockBaseHtml=baseHtml;
    UI.lastBlockFollowRes=null;
    UI.lastRollHtml=baseHtml+renderBlockFollowUpBox();
  }else{
    UI.lastBlockBaseHtml=baseHtml;
    UI.lastBlockFollowRes=null;
    UI.lastRollHtml=baseHtml;
  }
  const cs=getCSkVal(), ds=getDSkVal();
  const cBreak=D.cMode==='breakdown'?`${D.attrKey||'Attr.'} ${D.cAttr} ${fmtSign(cs)} Fert. = ${T.cv}`:`Direkt ${T.cv}`;
  const dBreak=isVsOpp?T.opp.oppBreak:(D.dMode==='breakdown'?`${D.dAttr} ${fmtSign(ds)} = ${T.dv}`:`${T.dv}`);
  const advBreak=(T.effAdv||T.effDis||advSrcParts.length)?`${T.effAdv}V/${T.effDis}N (Netto ${fmtSign(T.rawNet)} → ${fmtSign(T.bonus-T.effTh)})${advSrcParts.length?` • ${advSrcParts.join(', ')}`:''}`:'±0';
  const critLbl=(D.crit==='1'?'Endziffer 1':(D.critMode==='range'?`Endziffer 1–${D.crit}`:`nur Endziffer ${D.crit}`))+(T.autoCrit?` [inkl. +${T.autoCrit} Krit-Bonus]`:'');
  const formula=isVsOpp
    ?`${T.cv} (${c1Name}) + 50 − ${T.dv} (${T.opp.oppName}) ${T.bonus>=0?'+ '+T.bonus:'− '+Math.abs(T.bonus)}${T.effTh?` [inkl. ${fmtSign(T.effTh)} Effekt]`:''} = ${T.th} (${T.chance}%)`
    :`${T.cv} (Wert) + 50 − ${T.dv} (Schw.) ${T.bonus>=0?'+ '+T.bonus:'− '+Math.abs(T.bonus)}${T.effTh?` [inkl. ${fmtSign(T.effTh)} Effekt]`:''} = ${T.th} (${T.chance}%)`;
  const livePayload={
    id:uid(),
    tsMs:Date.now(),
    ts:new Date().toLocaleTimeString('de-DE',{hour:'2-digit',minute:'2-digit',second:'2-digit'}),
    senderTabId:LIVE_TAB_ID,
    charId:isLobRoll?'':(S.charId||''),
    charName:c1Name,
    playerName:isLobRoll?'':String(CLOUD.currentUser||S.owner||'').trim(),
    campaignId:isLobRoll?getActiveLiveCampaignId():getCharCampaignId(S.charId),
    label:rollTitle||'Freie Probe',
    weaponId:isLobRoll?null:(D.weaponId||null),
    wRollCat:D.wRollCat||null,
    th:T.th,
    egMult:T.egMult,
    chance:T.chance,
    cv:T.cv,
    dv:T.dv,
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
    livePayload.vsSummary=vsSummary;
  }
  publishLiveRoll(livePayload);
  diceLogs.unshift({t:new Date().toLocaleTimeString('de-DE'),lbl:rollTitle,th,sum:res.map(x=>`${x.r}(${x.crit?'★':''}${x.ok?('EG'+x.eg+((x.egMult||T.egMult||1)>1?` (${x.baseEg} ×${x.egMult||T.egMult})`:'')):'MEG'+x.meg})`).join(', '),advSrc:advSrcParts.join(', ')});
  if(diceLogs.length>40) diceLogs.length=40;
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
    campaignId:isLobRoll?getActiveLiveCampaignId():getCharCampaignId(S.charId),
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

