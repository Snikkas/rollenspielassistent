import {
  ATTRS
} from './constants.js';
import {
  $, uid, esc, toInt, fmtSign
} from './utils.js';
import {
  hooks
} from './ui-hooks.js';
import {
  S, D, UI, CLOUD, DUEL, LIVE_TAB_ID, isMobileLayout, syncBodyScrollLock, bindSwipeDownClose, getWeaponSubtype, isArmorShield, isWeaponBlockable, getCharCampaignId, getCharOwner, getActiveLiveCampaignId, canManageCampaign, isEnemySheet, getEnemyMeta, shouldHideOpponentDetails, toast, logChron, save
} from './state.js';
import {
  calcActiveMods, getAdvDisForContext, getWeaponRollMeta, getShieldRollMeta, getSheetShields, getSheetBlockOptions, resolveCombatItemByRef, formatBlockModShort, getAttrTot, getSkBonus
} from './calc.js';
import {
  sendLiveBroadcast, getCachedForeignSheet, isForeignSheetLoading, getForeignSheetError, fetchForeignCharacterSheet
} from './cloud.js';
import {
  getEffC, getActiveDiceCampaignId, isLobbyNeutralDice, resolveOpponentComparison, applyDiceAutoAdvDis, renderDice, formatSrcOriginLabel, formatAdvSrcScope
} from './dice.js';

export const DUEL_TIMEOUT_MS = 60000;
const DUEL_EXPIRE_GRACE_MS = 20000;
const seenIgnoredIds = new Set();
let outgoingTickTimer = null;
let incomingPruneTimer = null;

function stopOutgoingTimer(){
  if(outgoingTickTimer){
    clearInterval(outgoingTickTimer);
    outgoingTickTimer=null;
  }
}
function ensureIncomingPruneTimer(){
  if(incomingPruneTimer) return;
  incomingPruneTimer=setInterval(()=>{
    const now=Date.now();
    const before=(DUEL.incoming||[]).length;
    if(!before){
      clearInterval(incomingPruneTimer);
      incomingPruneTimer=null;
      return;
    }
    DUEL.incoming=DUEL.incoming.filter(c=>!c.expiresAt||now<=(c.expiresAt+DUEL_EXPIRE_GRACE_MS));
    if(DUEL.incoming.length!==before){
      renderDuelBanner();
      if(DUEL.reply&&!DUEL.incoming.some(c=>c.challengeId===DUEL.reply.challenge?.challengeId)){
        // Reply bleibt offen falls der Spieler gerade darin antwortet, solange nicht explizit abgebrochen
      }
    }
  },4000);
}
function findSkillByKeywords(sheet,keywords){
  const skills=(sheet?.skills||[]).filter(s=>s&&String(s.name||'').trim());
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
function findDefaultCombatItemForPreset(sheet,preset){
  const weapons=(sheet?.weapons||[]).filter(Boolean);
  const shields=getSheetShields(sheet);
  if(preset==='block'){
    const eqShield=shields.find(s=>s.equipped!==false);
    if(eqShield) return {kind:'shield',item:eqShield,ref:`shield:${eqShield.id}`};
    const eqBlkWp=weapons.find(w=>w.equipped!==false&&isWeaponBlockable(w));
    if(eqBlkWp) return {kind:'weapon',item:eqBlkWp,ref:eqBlkWp.id};
    if(shields[0]) return {kind:'shield',item:shields[0],ref:`shield:${shields[0].id}`};
    const blkWp=weapons.find(w=>isWeaponBlockable(w));
    if(blkWp) return {kind:'weapon',item:blkWp,ref:blkWp.id};
    return null;
  }
  if(!weapons.length){
    if(preset==='attack'&&shields.length){
      const sh=shields.find(s=>s.equipped!==false)||shields[0];
      return {kind:'shield',item:sh,ref:`shield:${sh.id}`};
    }
    return null;
  }
  const melee=weapons.find(w=>w.wType!=='ranged'&&w.equipped!==false)||weapons.find(w=>w.wType!=='ranged');
  const wp=melee||weapons[0];
  return wp?{kind:'weapon',item:wp,ref:wp.id}:null;
}
export function isDuelTargetForMe(challenge){
  if(!challenge||!challenge.targetCharId) return false;
  const tid=String(challenge.targetCharId).trim();
  if(isEnemySheet(tid)){
    if(CLOUD.isAdmin) return true;
    const chCamp=String(challenge.campaignId||'').trim();
    if(chCamp&&chCamp!=='default'&&canManageCampaign(chCamp)) return true;
    const meta=getEnemyMeta(tid);
    return meta.campaignIds.some(cid=>canManageCampaign(cid));
  }
  if(!UI.inLobby&&S?.charId&&S.charId===tid) return true;
  const curUser=String(CLOUD.currentUser||'').trim().toLowerCase();
  if(curUser){
    const owner=String(getCharOwner(tid)||'').trim().toLowerCase();
    if(owner&&owner===curUser) return true;
  }
  const campId=String(challenge.campaignId||getCharCampaignId(tid)||'default');
  if(canManageCampaign(campId)) return true;
  return false;
}
export function clearOutgoingDuel({notifyCancel=false,silent=true}={}){
  const prev=DUEL.outgoing;
  stopOutgoingTimer();
  DUEL.outgoing=null;
  if(notifyCancel&&prev&&prev.status==='waiting'&&prev.challengeId){
    sendLiveBroadcast({
      type:'duel_cancel',
      challengeId:prev.challengeId,
      campaignId:prev.campaignId,
      attackerName:prev.attackerName,
      targetCharId:prev.targetCharId,
      senderTabId:LIVE_TAB_ID,
      tsMs:Date.now()
    });
    if(!silent) toast('Live-Anfrage abgebrochen.');
  }
}
export function cancelOutgoingDuel(silent=false){
  clearOutgoingDuel({notifyCancel:true,silent});
  applyDiceAutoAdvDis(false);
  renderDice();
}
export function sendDuelChallenge(){
  if(D.dMode!=='character'||!D.oppCharId){
    toast('Bitte zuerst einen Gegner-Charakter auswählen.');
    return;
  }
  const opp=resolveOpponentComparison(D.wRollCat||'Normaler Test');
  const targetCharId=String(D.oppCharId||'').trim();
  const listMatch=(CLOUD.list||[]).find(c=>c&&c.id===targetCharId);
  const targetCharName=opp?.oppName||String(listMatch?.name||'').trim()||'Gegner';
  const isLob=isLobbyNeutralDice();
  const attackerName=isLob?(CLOUD.currentUser||'Gast'):(String(S.profile?.name||'').trim()||'Unbenannter Held');
  const attackerCharId=isLob?'':(S.charId||'');
  const campaignId=getActiveDiceCampaignId();
  const w=(!isLob&&D.weaponId)?(S.weapons||[]).find(x=>x.id===D.weaponId):null;
  const sh=(!isLob&&D.shieldId)?(S.armors||[]).find(x=>x.id===D.shieldId&&isArmorShield(x)):null;
  const sk=(!isLob&&D.skillId)?(S.skills||[]).find(x=>x.id===D.skillId):null;
  const weaponName=sh?(String(sh.name||'').trim()||'Schild'):(w?(String(w.name||'').trim()||getWeaponSubtype(w.wType).label):'');
  const wRollCat=D.wRollCat||'Normaler Test';
  const cv=getEffC();
  const shortAction=sk?`${sk.name} (${cv})`:weaponName?`${wRollCat}: ${weaponName} (${cv})`:(D.attrKey?`${D.attrKey} (${cv})`:`${wRollCat} (${cv})`);

  clearOutgoingDuel({notifyCancel:true,silent:true});
  const now=Date.now();
  const challengeId=`duel_${uid()}`;
  const challenge={
    type:'duel_challenge',
    challengeId,
    campaignId,
    tsMs:now,
    expiresAt:now+DUEL_TIMEOUT_MS,
    senderTabId:LIVE_TAB_ID,
    attackerCharId,
    attackerName,
    attackerPlayer:String(CLOUD.currentUser||S.owner||'').trim(),
    label:String(D.label||shortAction),
    shortAction,
    wRollCat,
    weaponName,
    attrKey:D.attrKey||'',
    skillName:sk?sk.name:'',
    cv,
    targetCharId,
    targetCharName
  };
  DUEL.outgoing={
    ...challenge,
    status:'waiting',
    response:null
  };
  sendLiveBroadcast(challenge);
  toast(`📨 Konter-Anfrage an ${targetCharName} gesendet...`);
  stopOutgoingTimer();
  outgoingTickTimer=setInterval(()=>{
    const out=DUEL.outgoing;
    if(!out||out.status!=='waiting'){stopOutgoingTimer();return;}
    const remMs=out.expiresAt-Date.now();
    if(remMs<=0){
      stopOutgoingTimer();
      out.status='timeout';
      toast(`⏱️ Keine Live-Antwort von ${out.targetCharName} – du kannst direkt würfeln.`);
      if(D.open) renderDice();
      return;
    }
    const cd=$('duelWaitCountdown');
    if(cd) cd.textContent=`${Math.ceil(remMs/1000)} s`;
  },1000);
  renderDice();
}
function sanitizeLiveAdvSrc(srcList){
  return (srcList||[]).map(s=>({
    val:toInt(s.val,0),
    kind:s.kind==='dis'?'dis':'adv',
    scope:String(s.scope||'all'),
    attrKey:String(s.attrKey||''),
    skillName:String(s.skillName||''),
    label:String(s.label||''),
    tagLbl:String(s.tagLbl||''),
    srcName:String(s.srcName||''),
    srcKind:String(s.srcKind||'Effekt'),
    isSit:Boolean(s.isSit)
  })).filter(s=>s.val!==0);
}
export function getReplyTargetSheet(reply=DUEL.reply){
  if(!reply?.challenge?.targetCharId) return null;
  const tid=reply.challenge.targetCharId;
  if(!UI.inLobby&&S?.charId&&S.charId===tid) return S;
  return getCachedForeignSheet(tid);
}
export function computeDuelReplyPreview(reply=DUEL.reply){
  if(!reply||!reply.challenge) return null;
  const ch=reply.challenge;
  const tid=ch.targetCharId;
  const targetSheet=getReplyTargetSheet(reply);
  if(!targetSheet){
    return {
      ready:false,
      loading:isForeignSheetLoading(tid),
      error:getForeignSheetError(tid),
      targetName:ch.targetCharName||'Ziel'
    };
  }
  const oppM=calcActiveMods(targetSheet);
  const targetName=String(targetSheet.profile?.name||'').trim()||ch.targetCharName||'Ziel';
  const kind=['preset','attr','skill'].includes(reply.kind)?reply.kind:'preset';
  const preset=['dodge','parry','block','attack'].includes(reply.preset)?reply.preset:'dodge';
  const skills=(targetSheet.skills||[]).filter(Boolean);
  let attrKey='GW', attrVal=0, sk=null, skBonus=0, oppWeapon=null, oppShield=null, oppVal=0, oppRollCat='Normaler Test', oppShortLabel='', oppBreak='';

  if(kind==='preset'){
    if(preset==='dodge'){
      attrKey='GW';
      attrVal=getAttrTot('GW',oppM,targetSheet);
      sk=reply.skillId==='__none__'?null:((reply.skillId?skills.find(s=>s.id===reply.skillId):null)||findSkillByKeywords(targetSheet,['ausweichen','abwehr']));
      skBonus=sk?getSkBonus(sk):0;
      oppVal=attrVal+skBonus;
      oppRollCat='Ausweichen';
      oppShortLabel=`Ausweichen ${oppVal}`;
      oppBreak=sk?`${targetName} • Ausweichen: GW ${attrVal} ${fmtSign(skBonus)} ${sk.name} = ${oppVal}`:`${targetName} • Ausweichen: GW ${attrVal} = ${oppVal}`;
    }else if(preset==='parry'){
      const picked=reply.weaponId==='__none__'?null:(resolveCombatItemByRef(reply.weaponId,targetSheet)||findDefaultCombatItemForPreset(targetSheet,'parry'));
      oppWeapon=picked?.kind==='weapon'?picked.item:null;
      attrKey='PR';
      attrVal=getAttrTot('PR',oppM,targetSheet);
      sk=reply.skillId==='__none__'?null:((reply.skillId?skills.find(s=>s.id===reply.skillId):null)||findSkillByKeywords(targetSheet,['parieren','parade'])||(oppWeapon?.skillId?skills.find(s=>s.id===oppWeapon.skillId):null));
      skBonus=sk?getSkBonus(sk):0;
      oppVal=attrVal+skBonus;
      oppRollCat='Parieren';
      const wNm=oppWeapon?(String(oppWeapon.name||'').trim()||getWeaponSubtype(oppWeapon.wType).label):'';
      oppShortLabel=`Parieren ${oppVal}`;
      oppBreak=`${targetName} • Parieren${wNm?` (${wNm})`:''}: PR ${attrVal}${sk?` ${fmtSign(skBonus)} ${sk.name}`:''} = ${oppVal}`;
    }else if(preset==='block'){
      let picked=reply.weaponId==='__none__'?null:resolveCombatItemByRef(reply.weaponId,targetSheet);
      if(picked&&picked.kind==='weapon'&&!isWeaponBlockable(picked.item)) picked=null;
      if(!picked&&reply.weaponId!=='__none__') picked=findDefaultCombatItemForPreset(targetSheet,'block');
      if(picked?.kind==='shield') oppShield=picked.item;
      else if(picked?.kind==='weapon') oppWeapon=picked.item;
      attrKey=oppShield?(ATTRS.some(a=>a.k===oppShield.wAttr)?oppShield.wAttr:'ST'):'ST';
      attrVal=getAttrTot(attrKey,oppM,targetSheet);
      sk=reply.skillId==='__none__'?null:(
        (reply.skillId?skills.find(s=>s.id===reply.skillId):null)
        ||(oppShield?.skillId?skills.find(s=>s.id===oppShield.skillId):null)
        ||findSkillByKeywords(targetSheet,['blocken','schildblock'])
        ||(oppWeapon?.skillId?skills.find(s=>s.id===oppWeapon.skillId):null)
      );
      skBonus=sk?getSkBonus(sk):0;
      oppVal=attrVal+skBonus;
      oppRollCat='Blocken';
      const itNm=oppShield
        ?`🛡️ ${String(oppShield.name||'').trim()||'Schild'}`
        :(oppWeapon?(String(oppWeapon.name||'').trim()||getWeaponSubtype(oppWeapon.wType).label):'');
      oppShortLabel=`Blocken ${oppVal}`;
      oppBreak=`${targetName} • Blocken${itNm?` (${itNm})`:''}: ${attrKey} ${attrVal}${sk?` ${fmtSign(skBonus)} ${sk.name}`:''} = ${oppVal}`;
    }else{
      const picked=reply.weaponId==='__none__'?null:(resolveCombatItemByRef(reply.weaponId,targetSheet)||findDefaultCombatItemForPreset(targetSheet,'attack'));
      if(picked?.kind==='shield') oppShield=picked.item;
      else if(picked?.kind==='weapon') oppWeapon=picked.item;
      const meta=oppShield?getShieldRollMeta(oppShield,oppM,targetSheet):(oppWeapon?getWeaponRollMeta(oppWeapon,oppM,targetSheet):null);
      attrKey=meta?meta.attrKey:'PR';
      attrVal=getAttrTot(attrKey,oppM,targetSheet);
      sk=reply.skillId==='__none__'?null:((reply.skillId?skills.find(s=>s.id===reply.skillId):null)||(meta?.sk||null));
      skBonus=sk?getSkBonus(sk):0;
      oppVal=attrVal+skBonus;
      oppRollCat='Trefferwurf';
      const wNm=oppShield
        ?`🛡️ ${String(oppShield.name||'').trim()||'Schild'}`
        :(oppWeapon?(String(oppWeapon.name||'').trim()||getWeaponSubtype(oppWeapon.wType).label):'Angriff');
      oppShortLabel=`${wNm} ${oppVal}`;
      oppBreak=`${targetName} • ${wNm}: ${attrKey} ${attrVal}${sk?` ${fmtSign(skBonus)} ${sk.name}`:''} = ${oppVal}`;
    }
  }else if(kind==='skill'){
    sk=(reply.skillId?skills.find(s=>s.id===reply.skillId):null)||skills[0]||null;
    attrKey=sk?(ATTRS.some(a=>a.k===sk.linkedAttr)?sk.linkedAttr:'PR'):(ATTRS.some(a=>a.k===reply.attrKey)?reply.attrKey:'PR');
    attrVal=getAttrTot(attrKey,oppM,targetSheet);
    skBonus=sk?getSkBonus(sk):0;
    oppVal=attrVal+skBonus;
    oppRollCat='Normaler Test';
    oppShortLabel=sk?`${sk.name} ${oppVal}`:`${attrKey} ${oppVal}`;
    oppBreak=sk?`${targetName} • ${sk.name}: ${attrKey} ${attrVal} ${fmtSign(skBonus)} = ${oppVal}`:`${targetName} • ${attrKey} = ${oppVal}`;
  }else{
    attrKey=ATTRS.some(a=>a.k===reply.attrKey)?reply.attrKey:'GW';
    attrVal=getAttrTot(attrKey,oppM,targetSheet);
    oppVal=attrVal;
    oppRollCat='Normaler Test';
    oppShortLabel=`${attrKey} ${oppVal}`;
    oppBreak=`${targetName} • ${attrKey} = ${oppVal}`;
  }

  const oppCombatRef=oppShield?`shield:${oppShield.id}`:(oppWeapon?oppWeapon.id:'');
  const oppDefForOpp=oppRollCat==='Trefferwurf'?(ch.wRollCat==='Parade'?'Parieren':(ch.wRollCat||'')):'';
  const ad=getAdvDisForContext({
    weaponId:oppWeapon?.id||null,
    shieldId:oppShield?.id||null,
    wRollCat:oppRollCat,
    skillId:sk?.id||null,
    attrKey,
    sitActive:reply.sitActive||{},
    includeInspiration:false,
    oppDefenseCat:oppDefForOpp
  },oppM,targetSheet);

  const inspStacks=Math.max(0,toInt(targetSheet.inspiration,0));
  const inspAlreadyActive=Boolean(targetSheet.inspirationActive);
  const canUseInspiration=inspAlreadyActive||inspStacks>0;
  const useInsp=Boolean(reply.useInspiration&&canUseInspiration);
  const src=[...(ad.src||[])];
  let autoAdv=ad.autoAdv||0;
  const autoDis=ad.autoDis||0;
  if(useInsp){
    autoAdv+=1;
    src.push({val:1,kind:'adv',scope:'all',label:'Inspiration',srcName:'Inspiration',srcKind:'Inspiration'});
  }
  return {
    ready:true,
    targetSheet,
    oppM,
    targetName,
    isOwnOpenSheet:Boolean(!UI.inLobby&&S?.charId&&S.charId===tid),
    kind,
    preset,
    attrKey,
    attrVal,
    sk,
    skBonus,
    oppWeapon,
    oppShield,
    oppCombatRef,
    oppVal,
    oppRollCat,
    oppShortLabel,
    oppBreak,
    autoAdv,
    autoDis,
    src,
    sitOptions:ad.sitOptions||[],
    inspStacks,
    inspAlreadyActive,
    canUseInspiration,
    useInsp
  };
}
export function openDuelReplyModal(challengeId){
  const ch=(DUEL.incoming||[]).find(c=>c.challengeId===challengeId);
  if(!ch){toast('Diese Anfrage ist nicht mehr aktiv.');renderDuelBanner();return;}
  const normCat=ch.wRollCat==='Parade'?'Parieren':ch.wRollCat;
  let defKind='preset', defPreset='dodge';
  if(normCat==='Trefferwurf'){defKind='preset';defPreset='dodge';}
  else if(normCat==='Parieren'||normCat==='Blocken'||normCat==='Ausweichen'){defKind='preset';defPreset='attack';}
  else{defKind='attr';defPreset='dodge';}
  const isOwnOpen=Boolean(!UI.inLobby&&S?.charId&&S.charId===ch.targetCharId);
  const cachedSheet=isOwnOpen?S:getCachedForeignSheet(ch.targetCharId);
  DUEL.reply={
    challenge:ch,
    kind:defKind,
    preset:defPreset,
    attrKey:ch.attrKey&&ATTRS.some(a=>a.k===ch.attrKey)?ch.attrKey:'GW',
    weaponId:'',
    skillId:'',
    sitActive:{},
    useInspiration:Boolean(cachedSheet?.inspirationActive)
  };
  if(!isOwnOpen){
    fetchForeignCharacterSheet(ch.targetCharId,{force:false,silent:true});
  }
  renderDuelReplyModal();
  renderDuelBanner();
}
export function closeDuelReplyModal(){
  if(DUEL.swipeCleanup){try{DUEL.swipeCleanup();}catch(e){} DUEL.swipeCleanup=null;}
  DUEL.reply=null;
  const mount=$('duelReplyMount');
  if(mount) mount.innerHTML='';
  syncBodyScrollLock();
  renderDuelBanner();
}
export function ignoreIncomingDuel(challengeId,sendDecline=false){
  const idx=(DUEL.incoming||[]).findIndex(c=>c.challengeId===challengeId);
  const ch=idx>=0?DUEL.incoming[idx]:null;
  seenIgnoredIds.add(challengeId);
  if(idx>=0) DUEL.incoming.splice(idx,1);
  if(DUEL.reply?.challenge?.challengeId===challengeId) closeDuelReplyModal();
  if(sendDecline&&ch){
    sendLiveBroadcast({
      type:'duel_response',
      status:'declined',
      challengeId:ch.challengeId,
      campaignId:ch.campaignId,
      targetCharId:ch.targetCharId,
      targetCharName:ch.targetCharName,
      responderName:String(CLOUD.currentUser||ch.targetCharName||'Spieler').trim(),
      senderTabId:LIVE_TAB_ID,
      tsMs:Date.now()
    });
  }
  renderDuelBanner();
}
export function submitDuelReply(){
  const reply=DUEL.reply;
  if(!reply?.challenge) return;
  const prev=computeDuelReplyPreview(reply);
  if(!prev||!prev.ready){
    toast('Charakterbogen wird noch geladen...');
    return;
  }
  const ch=reply.challenge;
  if(prev.useInsp&&prev.isOwnOpenSheet){
    if(S.inspirationActive){
      S.inspirationActive=false;
      logChron(`Inspiration im Live-Konter (${prev.oppShortLabel}) gegen ${ch.attackerName} verbraucht.`);
      save();
      hooks.renderMain?.();
    }else if(toInt(S.inspiration,0)>0){
      S.inspiration=Math.max(0,toInt(S.inspiration,0)-1);
      logChron(`Inspiration im Live-Konter (${prev.oppShortLabel}) gegen ${ch.attackerName} eingesetzt (verbleibend: ${S.inspiration}).`);
      save();
      hooks.renderMain?.();
    }
  }
  const cleanSrc=sanitizeLiveAdvSrc(prev.src);
  const payload={
    type:'duel_response',
    status:'accepted',
    challengeId:ch.challengeId,
    campaignId:ch.campaignId,
    tsMs:Date.now(),
    senderTabId:LIVE_TAB_ID,
    targetCharId:ch.targetCharId,
    targetCharName:prev.targetName,
    responderName:String(CLOUD.currentUser||prev.targetName||'Spieler').trim(),
    oppKind:prev.kind,
    oppPreset:prev.preset,
    oppAttrKey:prev.attrKey,
    oppWeaponId:reply.weaponId==='__none__'?'__none__':(prev.oppCombatRef||'__none__'),
    oppSkillId:reply.skillId==='__none__'?'__none__':(prev.sk?.id||'__none__'),
    oppSitActive:{...(reply.sitActive||{})},
    useInspiration:prev.useInsp,
    snapshot:{
      oppVal:prev.oppVal,
      oppRollCat:prev.oppRollCat,
      oppShortLabel:prev.oppShortLabel,
      oppBreak:prev.oppBreak,
      autoAdv:prev.autoAdv,
      autoDis:prev.autoDis,
      src:cleanSrc,
      attrKey:prev.attrKey,
      attrVal:prev.attrVal,
      skName:prev.sk?.name||'',
      skBonus:prev.skBonus,
      weaponName:prev.oppShield?(String(prev.oppShield.name||'').trim()||'Schild'):(prev.oppWeapon?(String(prev.oppWeapon.name||'').trim()||getWeaponSubtype(prev.oppWeapon.wType).label):''),
      oppShieldId:prev.oppShield?.id||'',
      oppShieldName:prev.oppShield?(String(prev.oppShield.name||'').trim()||'Schild'):'',
      oppBlockKind:prev.oppShield?'shield':(prev.oppWeapon&&isWeaponBlockable(prev.oppWeapon)?'item':'none')
    }
  };
  sendLiveBroadcast(payload);
  seenIgnoredIds.add(ch.challengeId);
  DUEL.incoming=(DUEL.incoming||[]).filter(c=>c.challengeId!==ch.challengeId);
  closeDuelReplyModal();
  toast(`✅ Konter gesendet: ${prev.oppShortLabel}${prev.autoAdv||prev.autoDis?` (${prev.autoAdv}V/${prev.autoDis}N)`:''}`);
}
export function handleLiveDuelEvent(rawObj,isRealtimePush=false){
  if(!rawObj||typeof rawObj!=='object') return;
  if(rawObj.senderTabId===LIVE_TAB_ID) return;
  const cid=String(rawObj.challengeId||'').trim();
  if(!cid) return;

  if(rawObj.type==='duel_challenge'){
    if(seenIgnoredIds.has(cid)) return;
    if(rawObj.expiresAt&&Date.now()>toInt(rawObj.expiresAt,0)+5000) return;
    if(!isDuelTargetForMe(rawObj)) return;
    if((DUEL.incoming||[]).some(c=>c.challengeId===cid)) return;
    DUEL.incoming.unshift(rawObj);
    if(DUEL.incoming.length>5) DUEL.incoming.length=5;
    ensureIncomingPruneTimer();
    renderDuelBanner();
    if(isRealtimePush){
      toast(`⚔️ ${rawObj.attackerName||'Gegner'} fordert ${rawObj.targetCharName||'dich'} heraus!`);
    }
    return;
  }

  if(rawObj.type==='duel_cancel'){
    const hadInc=(DUEL.incoming||[]).some(c=>c.challengeId===cid);
    DUEL.incoming=(DUEL.incoming||[]).filter(c=>c.challengeId!==cid);
    if(DUEL.reply?.challenge?.challengeId===cid){
      const atk=DUEL.reply.challenge.attackerName||'Angreifer';
      closeDuelReplyModal();
      toast(`ℹ️ Live-Anfrage von ${atk} wurde abgebrochen.`);
    }else if(hadInc){
      renderDuelBanner();
    }
    return;
  }

  if(rawObj.type==='duel_response'){
    const hadInc=(DUEL.incoming||[]).some(c=>c.challengeId===cid);
    if(hadInc){
      DUEL.incoming=DUEL.incoming.filter(c=>c.challengeId!==cid);
      if(DUEL.reply?.challenge?.challengeId===cid) closeDuelReplyModal();
      else renderDuelBanner();
    }
    if(DUEL.outgoing&&DUEL.outgoing.challengeId===cid){
      stopOutgoingTimer();
      if(rawObj.status==='declined'){
        DUEL.outgoing.status='declined';
        DUEL.outgoing.response=rawObj;
        toast(`ℹ️ ${rawObj.targetCharName||DUEL.outgoing.targetCharName} hat die Anfrage ignoriert – du kannst direkt würfeln.`);
        if(D.open) renderDice();
        return;
      }
      DUEL.outgoing.status='responded';
      DUEL.outgoing.response=rawObj;
      D.dMode='character';
      D.oppCharId=rawObj.targetCharId||D.oppCharId;
      if(['preset','attr','skill'].includes(rawObj.oppKind)) D.oppKind=rawObj.oppKind;
      if(['dodge','parry','block','attack'].includes(rawObj.oppPreset)) D.oppPreset=rawObj.oppPreset;
      if(rawObj.oppAttrKey&&ATTRS.some(a=>a.k===rawObj.oppAttrKey)) D.oppAttrKey=rawObj.oppAttrKey;
      D.oppWeaponId=rawObj.oppWeaponId||'';
      D.oppSkillId=rawObj.oppSkillId||'';
      D.oppSitActive=(rawObj.oppSitActive&&typeof rawObj.oppSitActive==='object')?{...rawObj.oppSitActive}:{};
      applyDiceAutoAdvDis(false);
      const hideToast=shouldHideOpponentDetails(rawObj.targetCharId||D.oppCharId,rawObj.campaignId);
      if(hideToast){
        toast(`✅ ${rawObj.targetCharName||DUEL.outgoing.targetCharName} hat gekontert (Werte verborgen)!`);
      }else{
        const snap=rawObj.snapshot||{};
        const advParts=[];
        if(snap.autoAdv) advParts.push(`+${snap.autoAdv}V`);
        if(snap.autoDis) advParts.push(`+${snap.autoDis}N`);
        const modTxt=advParts.length?`, ${advParts.join(' / ')}`:'';
        toast(`✅ ${rawObj.targetCharName||DUEL.outgoing.targetCharName} kontert mit ${snap.oppShortLabel||'Abwehr'}${modTxt}!`);
      }
      if(D.open) renderDice();
    }
  }
}
export function renderDuelBanner(){
  const mount=$('duelBannerMount');
  if(!mount) return;
  const openCid=DUEL.reply?.challenge?.challengeId||'';
  const visible=(DUEL.incoming||[]).filter(c=>c.challengeId!==openCid);
  const offers=(DUEL.damageOffers||[]).filter(Boolean);
  if(!visible.length&&!offers.length){
    mount.innerHTML='';
    return;
  }
  const offerCards=offers.map(of=>{
    const poolLbl=of.pool==='mlp'?'mLP':'LP';
    const curAmt=Math.max(0,toInt(of.editOpen?of.editAmount:of.amount,0));
    const thCls=of.thresholdLevel==='heavy'
      ?'border-rose-500/70 bg-rose-500/20 text-rose-200'
      :of.thresholdLevel==='medium'
        ?'border-orange-400/70 bg-orange-500/20 text-orange-200'
        :of.thresholdLevel==='light'
          ?'border-amber-400/70 bg-amber-500/20 text-amber-200'
          :'';
    const editBox=of.editOpen
      ?`<div class="flex items-center justify-between gap-2 p-2 rounded-xl bg-black/30 border bdr-line tabular">
          <span class="text-[11px] font-extrabold t-mut shrink-0">Schaden (${poolLbl}):</span>
          <div class="flex items-center gap-1.5">
            <button type="button" data-action="combat-offer-step" data-id="${esc(of.offerId)}" data-d="-1" class="btn w-8 h-8 p-0 text-sm font-black">−</button>
            <input data-combat-offer-inp="${esc(of.offerId)}" type="text" inputmode="numeric" value="${curAmt}" class="inp w-14 text-center font-black py-1 px-1 tabular"/>
            <button type="button" data-action="combat-offer-step" data-id="${esc(of.offerId)}" data-d="1" class="btn w-8 h-8 p-0 text-sm font-black">+</button>
          </div>
        </div>`
      :'';
    return `<div data-damage-offer="${esc(of.offerId)}" class="card duel-banner-card p-3 rounded-2xl space-y-2 min-w-0 !border-rose-400/75">
      <div class="flex items-start justify-between gap-2 min-w-0">
        <div class="min-w-0 flex-1">
          <div class="text-[10px] font-black uppercase tracking-wider text-rose-300">💥 Eingehender Schaden${of.targetName?` • ${esc(of.targetName)}`:''}</div>
          <div class="text-xs sm:text-sm font-black break-words leading-snug">⚔️ ${esc(of.attackerName||'Angreifer')} trifft <span class="text-amber-300">${esc(of.zoneName||'Zone')}</span>: <span class="text-rose-300 tabular">−${curAmt} ${poolLbl}</span></div>
          ${of.thresholdLabel?`<div class="inline-block mt-1 px-2 py-0.5 rounded-md border text-[10px] font-black ${thCls}">${esc(of.thresholdLabel)}</div>`:''}
          ${of.formula?`<div class="text-[10px] t-mut break-words mt-0.5 tabular">${esc(of.formula)}</div>`:''}
        </div>
        <button type="button" data-action="combat-offer-decline" data-id="${esc(of.offerId)}" aria-label="Ablehnen" class="btn w-8 h-8 p-0 text-xs font-black opacity-75 hover:opacity-100 shrink-0">✕</button>
      </div>
      ${editBox}
      <div class="flex flex-wrap items-center gap-1.5">
        <button type="button" data-action="combat-offer-accept" data-id="${esc(of.offerId)}" class="btn btn-ok flex-1 min-h-[36px] py-1.5 px-3 text-xs font-black">✓ Schaden übernehmen</button>
        <button type="button" data-action="combat-offer-toggle-edit" data-id="${esc(of.offerId)}" class="btn min-h-[36px] py-1.5 px-2.5 text-xs font-extrabold ${of.editOpen?'btn-pri':''}">✏️ Anpassen</button>
        <button type="button" data-action="combat-offer-decline" data-id="${esc(of.offerId)}" class="btn min-h-[36px] py-1.5 px-2.5 text-xs font-bold opacity-85 hover:opacity-100">✕ Ablehnen</button>
      </div>
    </div>`;
  }).join('');
  const challengeCards=visible.map(ch=>{
    const actionTxt=ch.shortAction||ch.label||ch.wRollCat||'Vergleichsprobe';
    return `<div class="card duel-banner-card p-3 rounded-2xl space-y-2 min-w-0">
      <div class="flex items-start justify-between gap-2 min-w-0">
        <div class="min-w-0 flex-1">
          <div class="text-[10px] font-black uppercase tracking-wider text-indigo-300">⚔️ Live-Herausforderung</div>
          <div class="text-xs sm:text-sm font-black break-words leading-snug">${esc(ch.attackerName||'Angreifer')} fordert <span class="text-acc">${esc(ch.targetCharName||'dich')}</span> heraus</div>
          <div class="text-[11px] font-bold t-mut break-words mt-0.5">${esc(actionTxt)}</div>
        </div>
        <button type="button" data-action="duel-ignore" data-id="${esc(ch.challengeId)}" aria-label="Ignorieren" class="btn w-7 h-7 p-0 text-xs font-black opacity-75 hover:opacity-100 shrink-0">✕</button>
      </div>
      <div class="flex items-center gap-2">
        <button type="button" data-action="duel-open-reply" data-id="${esc(ch.challengeId)}" class="btn btn-pri flex-1 py-1.5 px-3 text-xs font-black">🛡️ Antworten</button>
        <button type="button" data-action="duel-ignore" data-id="${esc(ch.challengeId)}" class="btn py-1.5 px-3 text-xs font-bold opacity-85 hover:opacity-100">Ignorieren</button>
      </div>
    </div>`;
  }).join('');
  mount.innerHTML=offerCards+challengeCards;
}
export function renderDuelReplyModal(){
  const mount=$('duelReplyMount');
  if(!mount) return;
  if(DUEL.swipeCleanup){try{DUEL.swipeCleanup();}catch(e){} DUEL.swipeCleanup=null;}
  const reply=DUEL.reply;
  if(!reply?.challenge){
    mount.innerHTML='';
    syncBodyScrollLock();
    return;
  }
  const ch=reply.challenge;
  const prev=computeDuelReplyPreview(reply);
  const mob=isMobileLayout();
  const swipeStripHtml=mob?'<div class="duel-sheet-swipe pt-2.5 pb-1 flex justify-center shrink-0" style="background:var(--surf2)" aria-hidden="true"><div class="ctx-sheet-handle" style="margin:0"></div></div>':'';
  let bodyHtml='';
  if(!prev||!prev.ready){
    bodyHtml=prev?.error
      ?`<div class="subcard p-3 border border-rose-500/40 bg-rose-500/10 text-xs font-bold text-rose-300 space-y-2"><div>⚠️ Charakterbogen konnte nicht geladen werden: ${esc(prev.error)}</div><button type="button" data-action="duel-reply-reload" class="btn py-1 px-2.5 text-xs">🔄 Erneut versuchen</button></div>`
      :`<div class="subcard p-4 text-center text-xs font-bold text-acc">⏳ Lade aktuellen Charakterbogen von ${esc(ch.targetCharName||'Gegner')}...</div>`;
  }else{
    const sheet=prev.targetSheet, oppM=prev.oppM;
    const skills=[...(sheet.skills||[])].filter(s=>s&&String(s.name||'').trim()).sort((a,b)=>String(a.name).localeCompare(String(b.name),'de'));
    const weapons=[...(sheet.weapons||[])].filter(Boolean);
    const shields=getSheetShields(sheet);
    const blkOpts=getSheetBlockOptions(sheet);
    const showAtkPreset=Boolean(ch.wRollCat==='Parieren'||ch.wRollCat==='Blocken'||ch.wRollCat==='Ausweichen'||prev.preset==='attack');
    const kindBar=`<div class="grid grid-cols-3 gap-1.5">
      <button type="button" data-action="duel-reply-kind" data-kind="preset" class="btn py-1.5 px-2 text-xs font-extrabold ${prev.kind==='preset'?'btn-pri':''}">🛡️ Abwehr</button>
      <button type="button" data-action="duel-reply-kind" data-kind="attr" class="btn py-1.5 px-2 text-xs font-extrabold ${prev.kind==='attr'?'btn-pri':''}">⚡ Attribut</button>
      <button type="button" data-action="duel-reply-kind" data-kind="skill" class="btn py-1.5 px-2 text-xs font-extrabold ${prev.kind==='skill'?'btn-pri':''}">🎯 Fertigkeit</button>
    </div>`;
    let pickerHtml='';
    if(prev.kind==='preset'){
      const pBtns=[
        {k:'dodge',l:'💨 Ausweichen'},
        {k:'parry',l:'🛡️ Parieren'},
        {k:'block',l:'🧱 Blocken'}
      ];
      if(showAtkPreset) pBtns.push({k:'attack',l:'⚔️ Angriff'});
      const needsWp=prev.preset==='parry'||prev.preset==='block'||prev.preset==='attack';
      const curWp=reply.weaponId==='__none__'?'__none__':(prev.oppCombatRef||'__none__');
      const curSk=reply.skillId==='__none__'?'__none__':(prev.sk?.id||'__none__');
      let wpSelectHtml='';
      if(needsWp){
        if(prev.preset==='block'){
          const shOptsHtml=blkOpts.shields.map(sh=>{
            const ref=`shield:${sh.id}`;
            const nm=String(sh.name||'').trim()||'Schild';
            const bm=formatBlockModShort(sh.blockMod);
            const grp=toInt(sh.grp,0);
            const meta=[bm?`Block ${bm}`:'',grp?`RS ${grp}`:''].filter(Boolean).join(', ');
            return `<option value="${esc(ref)}" ${curWp===ref?'selected':''}>🛡️ ${esc(nm)}${meta?` (${esc(meta)})`:''}</option>`;
          }).join('');
          const bwOptsHtml=blkOpts.blockWeapons.map(w=>{
            const wn=String(w.name||'').trim()||getWeaponSubtype(w.wType).label;
            return `<option value="${esc(w.id)}" ${curWp===w.id?'selected':''}>⚔️ ${esc(wn)} (Blockfähig • −2)</option>`;
          }).join('');
          wpSelectHtml=`<div class="min-w-0">
            <label class="block text-[10px] font-bold t-mut mb-0.5">Schild / Blockfähige Waffe</label>
            <select data-duel-sel="weaponId" class="inp w-full text-xs font-bold py-1.5">
              <option value="__none__" ${curWp==='__none__'?'selected':''}>Ohne Schild / Block-Waffe</option>
              ${shOptsHtml?`<optgroup label="🛡️ Schilde">${shOptsHtml}</optgroup>`:''}
              ${bwOptsHtml?`<optgroup label="⚔️ Blockfähige Waffen (−2 Schaden)">${bwOptsHtml}</optgroup>`:''}
            </select>
            ${(!blkOpts.shields.length&&!blkOpts.blockWeapons.length)?`<div class="text-[10px] text-amber-300/90 mt-1">ℹ️ Keine Schilde oder blockfähigen Waffen vorhanden.</div>`:''}
          </div>`;
        }else if(prev.preset==='attack'){
          const wpOptsHtml=weapons.map(w=>{
            const wn=String(w.name||'').trim()||getWeaponSubtype(w.wType).label;
            const tags=(w.tags||[]).map(t=>t?.name).filter(Boolean).slice(0,2).join(', ');
            return `<option value="${esc(w.id)}" ${curWp===w.id?'selected':''}>${esc(wn)}${tags?` (${esc(tags)})`:''}</option>`;
          }).join('');
          const shOptsHtml=shields.map(sh=>{
            const ref=`shield:${sh.id}`;
            const nm=String(sh.name||'').trim()||'Schild';
            return `<option value="${esc(ref)}" ${curWp===ref?'selected':''}>🛡️ ${esc(nm)} (Schild)</option>`;
          }).join('');
          wpSelectHtml=`<div class="min-w-0">
            <label class="block text-[10px] font-bold t-mut mb-0.5">Waffe / Schild</label>
            <select data-duel-sel="weaponId" class="inp w-full text-xs font-bold py-1.5">
              <option value="__none__" ${curWp==='__none__'?'selected':''}>Ohne Waffe</option>
              ${wpOptsHtml}
              ${shOptsHtml?`<optgroup label="🛡️ Schilde (Schildangriff)">${shOptsHtml}</optgroup>`:''}
            </select>
          </div>`;
        }else{
          wpSelectHtml=`<div class="min-w-0">
            <label class="block text-[10px] font-bold t-mut mb-0.5">Waffe</label>
            <select data-duel-sel="weaponId" class="inp w-full text-xs font-bold py-1.5">
              <option value="__none__" ${curWp==='__none__'?'selected':''}>Ohne Waffe</option>
              ${weapons.map(w=>{const wn=String(w.name||'').trim()||getWeaponSubtype(w.wType).label;const tags=(w.tags||[]).map(t=>t?.name).filter(Boolean).slice(0,2).join(', ');return `<option value="${esc(w.id)}" ${curWp===w.id?'selected':''}>${esc(wn)}${tags?` (${esc(tags)})`:''}</option>`;}).join('')}
            </select>
          </div>`;
        }
      }
      pickerHtml=`<div class="grid ${pBtns.length===4?'grid-cols-2 sm:grid-cols-4':'grid-cols-3'} gap-1.5">${pBtns.map(pb=>`<button type="button" data-action="duel-reply-preset" data-preset="${pb.k}" class="btn py-1.5 px-1.5 text-xs font-extrabold ${prev.preset===pb.k?'btn-pri':''}">${pb.l}</button>`).join('')}</div>
      ${wpSelectHtml}
      <div class="min-w-0"><label class="block text-[10px] font-bold t-mut mb-0.5">Fertigkeit (${prev.attrKey} ${prev.attrVal})</label><select data-duel-sel="skillId" class="inp w-full text-xs font-bold py-1.5"><option value="__none__" ${curSk==='__none__'?'selected':''}>Ohne Fertigkeit (+0)</option>${skills.map(sk=>`<option value="${esc(sk.id)}" ${curSk===sk.id?'selected':''}>${esc(sk.name)} (${fmtSign(getSkBonus(sk))})</option>`).join('')}</select></div>`;
    }else if(prev.kind==='attr'){
      pickerHtml=`<div class="grid grid-cols-4 gap-1.5">${ATTRS.map(a=>{const v=getAttrTot(a.k,oppM,sheet);return `<button type="button" data-action="duel-reply-attr" data-attr="${a.k}" class="btn py-1.5 px-1 flex-col gap-0 ${prev.attrKey===a.k?'btn-pri':''}"><span class="text-[10px]">${a.k}</span><span class="text-xs font-black tabular">${v}</span></button>`;}).join('')}</div>`;
    }else{
      if(skills.length){
        const curSk=prev.sk?.id||skills[0].id;
        pickerHtml=`<div class="min-w-0"><label class="block text-[10px] font-bold t-mut mb-0.5">Fertigkeit wählen</label><select data-duel-sel="skillId" class="inp w-full text-xs font-bold py-1.5">${skills.map(sk=>{const av=getAttrTot(sk.linkedAttr||'PR',oppM,sheet),b=getSkBonus(sk);return `<option value="${esc(sk.id)}" ${curSk===sk.id?'selected':''}>${esc(sk.name)} • ${sk.linkedAttr||'PR'} ${av} ${fmtSign(b)} = ${av+b}</option>`;}).join('')}</select></div>`;
      }else{
        pickerHtml=`<div class="text-xs t-mut subcard p-2.5">Keine Fertigkeiten eingetragen.</div>`;
      }
    }
    const chipsHtml=(prev.src||[]).map(s=>{
      const isDis=s.kind==='dis';
      const cls=isDis?'bg-rose-500/15 text-rose-200 border-rose-500/35':'bg-emerald-500/15 text-emerald-200 border-emerald-500/35';
      const scopeTxt=formatAdvSrcScope(s);
      return `<span class="inline-flex flex-wrap items-center gap-1 px-1.5 py-0.5 rounded border text-[10px] font-bold tabular ${cls}"><span>${fmtSign(s.val)}${isDis?'N':'V'}</span><span>${esc(formatSrcOriginLabel(s))}</span>${scopeTxt?`<span class="opacity-80">• ${esc(scopeTxt)}</span>`:''}</span>`;
    }).join('');
    const sitHtml=(prev.sitOptions&&prev.sitOptions.length)?`<div class="space-y-1"><div class="text-[10px] font-extrabold t-mut uppercase tracking-wider">Situative Optionen</div><div class="flex flex-wrap gap-1.5">${prev.sitOptions.map(so=>{
      const badge=so.reduceDis?`−${so.reduceDis}N`:so.adv?`+${so.adv}V`:so.dis?`+${so.dis}N`:'±0';
      return `<button type="button" data-action="duel-reply-sit" data-sit="${esc(so.sitKey)}" class="btn py-1 px-2.5 text-[11px] font-bold ${so.active?(so.dis>0&&!so.adv?'bg-rose-600 text-white border-rose-500':'btn-ok'):'opacity-85 hover:opacity-100'}">${so.active?'☑':'☐'} ${esc(so.sitLabel)} (${badge})</button>`;
    }).join('')}</div></div>`:'';
    const inspHtml=prev.canUseInspiration?`<button type="button" data-action="duel-reply-insp" class="btn w-full justify-between py-2 px-3 text-xs font-extrabold ${prev.useInsp?'border-amber-400 bg-amber-500/20 text-amber-200':'opacity-85 hover:opacity-100'}"><span>${prev.useInsp?'☑':'☐'} ✨ Inspiration einsetzen (+1 Vorteil)</span><span class="text-[10px] tabular">${prev.inspAlreadyActive?'bereits aktiv':`${prev.inspStacks} Stapel`}</span></button>`:'';
    bodyHtml=`<div class="subcard p-2.5 border border-indigo-400/40 bg-indigo-500/10 flex items-center justify-between gap-2 min-w-0">
        <div class="min-w-0">
          <div class="text-[10px] font-extrabold text-indigo-300 uppercase tracking-wider">Angriff / Probe von ${esc(ch.attackerName||'Angreifer')}</div>
          <div class="text-xs font-black truncate">${esc(ch.shortAction||ch.label||'Vergleichsprobe')}</div>
        </div>
        <span class="px-2 py-0.5 rounded-lg bg-indigo-500/25 border border-indigo-400/45 text-xs font-black tabular shrink-0">${toInt(ch.cv,0)}</span>
      </div>
      ${kindBar}
      <div class="space-y-2">${pickerHtml}</div>
      ${sitHtml}
      ${inspHtml}
      <div class="subcard p-3 border bdr-acc bg-acc-soft/20 space-y-1.5">
        <div class="flex items-center justify-between gap-2">
          <span class="text-xs font-extrabold text-acc truncate">Dein Konter: ${esc(prev.oppShortLabel)}</span>
          <span class="text-xs font-black tabular shrink-0"><span class="text-emerald-400">${prev.autoAdv}V</span> / <span class="text-rose-400">${prev.autoDis}N</span></span>
        </div>
        <div class="text-[11px] t-mut tabular break-words">${esc(prev.oppBreak)}</div>
        ${chipsHtml?`<div class="flex flex-wrap gap-1 pt-1 border-t border-white/10">${chipsHtml}</div>`:'<div class="text-[10px] t-mut">Keine automatischen Vor-/Nachteile aktiv.</div>'}
      </div>`;
  }
  mount.innerHTML=`<div data-action="duel-reply-close-bg" class="duel-sheet-backdrop">
    <div id="duelReplyPanel" class="card duel-sheet-panel p-0 rounded-2xl shadow-2xl border-2 border-indigo-400/60">
      ${swipeStripHtml}
      <div class="duel-sheet-swipe flex items-center justify-between gap-2 px-4 py-3 border-b bdr-line shrink-0" style="background:var(--surf2)">
        <div class="min-w-0 flex-1">
          <h3 class="text-sm sm:text-base font-black truncate">🛡️ Konter wählen – ${esc(prev?.targetName||ch.targetCharName||'Ziel')}</h3>
          <p class="text-[11px] t-mut truncate">Antwort an ${esc(ch.attackerName||'Angreifer')}</p>
        </div>
        <button type="button" data-action="duel-reply-close" aria-label="Schließen" class="btn min-w-[36px] min-h-[36px] sm:min-w-0 sm:min-h-0 py-1 px-2.5 text-xs font-black shrink-0">✕</button>
      </div>
      <div class="modal-body p-3.5 sm:p-4 space-y-3 min-w-0">${bodyHtml}</div>
      <div class="modal-foot px-4 pt-2.5 pb-3 border-t bdr-line flex items-center justify-end gap-2 shrink-0" style="background:var(--surf2)">
        <button type="button" data-action="duel-reply-decline" class="btn py-2 px-3 text-xs font-bold opacity-85 hover:opacity-100">Ablehnen</button>
        <button type="button" data-action="duel-reply-submit" ${(!prev||!prev.ready)?'disabled':''} class="btn btn-ok flex-1 sm:flex-none py-2 px-4 text-xs sm:text-sm font-black">✓ Konter senden</button>
      </div>
    </div>
  </div>`;
  syncBodyScrollLock();
  if(mob){
    const panel=$('duelReplyPanel');
    if(panel) DUEL.swipeCleanup=bindSwipeDownClose(panel,'.duel-sheet-swipe',()=>closeDuelReplyModal());
  }
}
