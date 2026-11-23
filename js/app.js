import {
  DEF_WEAPON_TAGS, DEF_ARMOR_TAGS, ATTRS, DEF_ATTR_COLS, ATTR_GROUPS, STATUS_DEFS, DEF_SEC_COLS, DEF_ACTION_SUBS, DEF_PW_TAGS, DEF_USERES, TR_DEFS, SK_CATS, SK_RANKS, PW_TIERS, DEF_HZ, TABS, BIO_FIELDS, CRIT_SEQ, WEAPON_SUBTYPES, DEF_EQ_SEC_ORDER, DEF_CHR_SEC_ORDER, DICE_DEF, WIN_DEFAULTS, DEF_FB_FOLDERS, POWER_PACK_SCHEMA, DUAL_COL_TARGETS
} from './constants.js';
import {
  $, uid, stamp, esc, clone, toInt, toFlt, fmtN, fmtSign, isHex, sortAlpha, stripHtml, cleanInlineStyles, simpleHash, sortTagDefs, canSetSecParent, sanitizeSecHierarchy
} from './utils.js';
import {
  registerHooks
} from './ui-hooks.js';
import {
  syncPwUseCostsLegacy, makeDefaultStatusEffects, defaultState, setS, setD, clearDiceLogs, syncBodyScrollLock, positionFloatingMenu, closeCtxMenu, closePwDropdown, repositionOpenPwMenus, hydrateWinPrefs, saveWinPref, clearWinPref, applyWinFrame, setPwMode, normalizeCampaigns, getUserBgLocalKey, getCampaigns, setActiveCampaign, canManageCampaign, canClearLiveDice, getCreatableCampaigns, ensureAllRegistryUsers, findUserKeyByName, findUserKeyById, getUserAvatar, canViewUserProfile, saveRegistryLocal, saveSecretRollsLocal, getActiveLiveCampaignId, captureScrollState, restoreScrollState, toast, triggerNiceEasterEgg, logChron, mergeLoaded, saveLastActiveTab, save, flushPendingSave, saveSoon, load, flushThemePrefsSync, cancelThemePrefsSync, applySessionTheme, persistCurrentThemeChange, syncPalDraftFromSlot, applyTheme, CUSTOM_ICONS, findMainArt, findActionSub, isReservedPwTerm, isWeaponMassiv, makeWeapon, makeAmmo, makeArmor, makeInvItem, makeEqSecMeta, makeChrSecMeta, makeSection, makeSkSection, makeInvSection, makePower, makeAugment, S, D, CN, LD, FBW, DUEL, COMBAT, isMobileLayout, CTX_MENU, getWinState, hasSavedWinPref, savedEffRanges, savedPwRanges, lastPwFieldById, pwQuickKey, UI, LIVE_TAB_ID, PATCHNOTES, FEEDBACK, CLOUD, CLOUD_SYNC, PWLIB, getCharOwner, getCharCampaignId, canManageChar, getEditStyleSlot
} from './state.js';
import {
  getStatusEffValues, formatPwUseCosts, getReservablePwCosts, getEffectivePoolCap, getPwBuilderToken, parseStatusTokens, getAllParsedEffectChips, invalidateModsCache, calcActiveMods, buildAttrTip, buildSecTip, syncCresRenameInTokens, syncSkillRenameInTokens, purgeExtraSecFromPowers, calcAutoSkCost, findDuplicatePwEntry, makeUniquePwName, updatePwNameDupHint, enforceUniquePwName, buildPowerExportPack, downloadPowerPackJson, resolveLibraryAugmentParentName, getSuggestedAugmentsForPower, importPowerPackIntoSheet, getTrCost, performSimpleRest, performFullRest, withPoolSync, linkAugToPower, unlinkAugFromPower, calcPwCost, calcSkCost, calcProg, getWeaponRollMeta, getTagDesc, cresName, makeExtraSec, getExtraSecName, getResLabel, escReStr, getAttrCol, getSecCol, getAttrTot, getLpBase, getLpMax, getMlpBase, getMlpMax, getLpRegenAuto, getMlpRegenAuto, hasLpRegenOvr, hasMlpRegenOvr, getLpRegen, getMlpRegen, getIniBase, getIniTot, getApBase, getApMax, getMapBase, getMapMax, getCresBase, getCresMax, getExtraSecBase, getBstAuto, hasBstOvr, getBstBase, getEffBst, getSkAutoBonus, hasSkBonusOvr, getSkBonus, findPwItem, findEqItem, getLinkedAugs, getValidPwSecId
} from './calc.js';
import {
  updateLobbyLiveDiceDOM, initLiveDiceChannel, publishLiveRoll, revealSecretRoll, publishLiveCampNote, clearLiveDiceFeed, syncCloudRegistry, renameUserAccount, addCampaignAllowedUser, removeCampaignAllowedUser, toggleGlobalGMTag, addCampaignMainGM, removeCampaignMainGM, kickCharFromCampaign, duplicateCharacterSheet, getCampaignSharedPages, extractPublicPages, upsertPublicNoteEntry, fetchLobbyList, fetchForeignCharacterSheet, canWriteCurrentSheetToCloud, resetCloudSyncState, updateCloudSyncStatusDOM, scheduleCloudSync, pushToCloud, flushCloudSyncNow, flushBeforeCharacterSwitch, loadCloudCharacter, createNewUserCharacter, updateCloudCharacterMeta, deleteCloudCharacter, stripLibraryPackMeta, getAllLibraryPacks, fetchPowerLibrary, publishPackToCloudLibrary, deletePackFromCloudLibrary, parsePatchnoteTsMs, getNewestPatchnoteId, isPatchnoteCollapsed, normalizePatchnoteEntry, fetchPatchnotes, savePatchnotesToServer, fetchFeedback, saveFeedbackStore, loadCustomIconsCache, fetchCustomIcons, saveCustomIconsToServer, loadNotifSeen, saveNotifSeen, markNotifRead, markAllNotifsRead, updateNotifBadges, refreshUserNotificationsBg, fetchAndSyncBasisPowers, isSecretRollActive
} from './cloud.js';
import {
  resetDiceToLobbyNeutral, exitLobbyNeutralDice, ensureLobbyNeutralDiceOnOpen, applyDiceAutoAdvDis, calcThreshold, openWeaponRoll, syncDiceFromSheet, buildAdvDisInnerHtml, renderDice, renderLiveDice, rollW100, renderBlockFollowUpBox, executeBlockFollowUpRoll, executeDiceRoll, rollCustomDice, getCSkVal, getDSkVal, getEffC, getEffD, isLobbyNeutralDice, calcEgMultiplier, buildThresholdInnerHtml, activateVsCharMode, selectDiceOpponent, resolveOpponentComparison
} from './dice.js';
import {
  sendDuelChallenge, cancelOutgoingDuel, clearOutgoingDuel, handleLiveDuelEvent, ignoreIncomingDuel, openDuelReplyModal, closeDuelReplyModal, submitDuelReply, renderDuelBanner, renderDuelReplyModal
} from './duel.js';
import {
  initCombatFromRoll, resetCombatState, rollCombatHitZone, publishCombatDamageToFeed, renderCombatDamageBox, hasTagMatch, sendCombatDamageOffer, applyCombatDamageDirectly, spendCombatAmmo, handleCombatLiveEvent, acceptCombatDamageOffer, declineCombatDamageOffer
} from './combat.js';
import {
  applyRtfCommand, autoSizeAllTextareas, ensureCampNotesStructure, syncPublicNotesAfterChange, renderCampNotes, getCaretRangeAtPoint, syncPwFieldCursorState, saveEffRangeIfActive, insertTokenAtCursor, placeCaretAtStart, indentRtfLi, outdentRtfLi, RTF_STATE, getOrderedCampNoteFolders
} from './notes.js';
import {
  isTab1SecCollapsed, tplAttributes, modChip, isTab1PhoneDefault
} from './tabs/attributes.js';
import {
  buildSkRollBtnMeta, moveSkillOrder, moveSkSecOrder, openSkMenu, openSkSecMenu, buildSkMobRankBtnMeta, buildSkMobCostPillMeta, openSkRankMenu, tplSkills, upsertSkill
} from './tabs/skills.js';
import {
  buildTokBarInnerHtml, updatePwDynPreviewDOM, refreshTab3DynamicDOM, updatePwBuilderChipDOM, movePwSecOrder, movePwOrder, moveAugOrder, openPwCardMenu, openPwSecMenu, tplPowers, spendResource, addCustomPwTagFromInput
} from './tabs/powers.js';
import {
  buildPwCatPillsHtml, moveChrSecOrder, moveChrPwOrder, openChrSecMenu, openChrPwMenu, tplChronicle, applyEp
} from './tabs/chronicle.js';
import {
  syncLinkedAmmoDOM, syncInvSecNameDOM, addEqTagToItem, openAddWeaponMenu, openEqTagPicker, openWpTypePicker, openWpAttrPicker, openWpSkillPicker, openWpAmmoPicker, openArZonePicker, openInvSecPicker, openInvSecParentPicker, isTab5EquipNotesCollapsed, isTab5BioGalleryCollapsed, isTab5BioFieldCollapsed, moveEqSecOrder, moveEqItemOrder, moveInvSecOrder, openEqItemMenu, openEqSecMenu, openInvSecMenu, tplEquipment
} from './tabs/equipment.js';
import {
  openLobbyCharMenu, tplLobbyScreen
} from './lobby.js';
import {
  openUserProfile, ensureProfileModalAccess, closeActiveModal, renderFbAdminWin, buildHdrPillsHtml, openSheetCtxMenu, openLobbyCtxMenu, renderHeader, formatPwLibImportToast, refreshPwLibListDOM, buildAdminDraftPack, getImgMenuContext, openImgMenu, applyImgUrlForContext, applyImgFileForCurrentTarget, removeImgForCurrentTarget, openAdminPanel, renderModal, updateInfoGlossaryGridDOM, compressImg, handleAdminIconFileUpload, performAdminUnlock, performAdminChangePin, getColTargetObj, openDualColorModal
} from './modals.js';

let dragPwId=null, dragAugId=null, dragSecId=null, dragSkSecId=null, dragSkId=null, dragChrPw=null, dragChrSec=null, dragEqSec=null, dragEqItem=null, dragInvSecId=null, dragInvItemId=null, dragCampId=null, dragCnPageId=null, dragCnFolderId=null, dragToken='';
let dragMouseY=null, dragScrollRaf=null;
{
  const _initIconsCache=loadCustomIconsCache();
  if(_initIconsCache){
    CUSTOM_ICONS.icons=_initIconsCache.icons;
    if(_initIconsCache.lastLoadedTs) CUSTOM_ICONS.lastLoadedTs=_initIconsCache.lastLoadedTs;
  }
}
function renderMain(){
  const mainEl=$('mainMount');
  if(!mainEl) return;
  const viewKey=UI.inLobby?'lobby':('sheet:'+S.activeTab);
  const sameView=mainEl.childElementCount>0&&mainEl.dataset.lastViewKey===viewKey;
  const snap=sameView?captureScrollState(mainEl):null;
  if(UI.inLobby){
    mainEl.innerHTML=tplLobbyScreen();
    mainEl.dataset.lastViewKey=viewKey;
    if(snap) restoreScrollState(mainEl,snap);
    return;
  }
  mainEl.innerHTML=S.activeTab==='attributes'?tplAttributes():S.activeTab==='skills'?tplSkills():S.activeTab==='powers'?tplPowers():S.activeTab==='chronicle'?tplChronicle():tplEquipment();
  mainEl.dataset.lastViewKey=viewKey;
  if(S.activeTab==='powers'||S.activeTab==='equipment') autoSizeAllTextareas();
  if(snap) restoreScrollState(mainEl,snap);
  if(UI.openPwMenu) repositionOpenPwMenus();
}

function renderAll(userSave=true){applyTheme();renderHeader();renderMain();renderDice();renderLiveDice();renderCampNotes();renderModal(true);save(userSave);}

const updateCalcDOM=()=>syncLiveCalculations();
function syncLiveCalculations(deferSave=false){
  const P=calcProg(), M=calcActiveMods();
  const hp=$('hdrPills'); if(hp) hp.innerHTML=buildHdrPillsHtml(P);
  const hcl=$('hdrCompactLvl'); if(hcl) hcl.textContent=`St. ${P.lvl}`;
  const hcs=$('hdrCompactSp'); if(hcs){hcs.textContent=`SP ${P.spSpent}/${P.totSp}`;hcs.classList.toggle('!border-rose-500',P.spRem<0);hcs.classList.toggle('text-rose-400',P.spRem<0);hcs.classList.toggle('t-mut',P.spRem>=0);}
  if(S.activeTab==='attributes'){
    ATTRS.forEach(a=>{
      const g=$(`ges_${a.k}`), h=$(`hdr_${a.k}`), ch=$(`chipAttr_${a.k}`), em=M[a.k]||0, tot=getAttrTot(a.k,M), tip=buildAttrTip(a.k,M), ac=getAttrCol(a.k);
      if(g){g.innerHTML=`<span>${tot}</span>${em?`<span class="text-[10px]">(${fmtSign(em)})</span>`:''}`;g.dataset.tip=tip;}
      if(h) h.dataset.tip=tip;
      if(ch){ch.innerHTML=`<span class="text-[11px] font-black tracking-wide leading-none flex items-center gap-0.5 max-w-full" style="color:${ac}"><span>${a.k}</span>${em?`<span class="text-[9px] opacity-90">${fmtSign(em)}</span>`:''}</span><span class="text-base sm:text-lg font-black leading-tight">${tot}</span>`;ch.dataset.tip=tip;}
    });
    ATTR_GROUPS.forEach(gr=>{
      const ps=$(`pairSum_${gr.k}`);
      if(ps){
        const gc=S.attrColors[gr.k]||DEF_ATTR_COLS[gr.k];
        ps.innerHTML=ATTRS.filter(a=>a.g===gr.k).map(a=>`<button type="button" data-action="roll-attr" data-attr="${a.k}" data-tip="${esc(buildAttrTip(a.k,M))}" class="px-2 py-1 rounded-lg text-[11px] font-black border tabular" style="color:${gc};border-color:color-mix(in srgb,${gc} 50%,var(--bdr));background:color-mix(in srgb,${gc} 16%,var(--surf2))">🎲 ${a.k} ${getAttrTot(a.k,M)}</button>`).join('');
      }
    });
    const lpTip=buildSecTip('lp',M), mlpTip=buildSecTip('mlp',M), iniTip=buildSecTip('ini',M), apTip=buildSecTip('ap',M), mapTip=buildSecTip('map',M), cresTip=buildSecTip('cres',M), bstTip=buildSecTip('bst',M);
    const lpBase=getLpBase(), lpMax=getLpMax(M), lpDiff=lpMax-lpBase, lm=$('val_lpMax');
    if($('inp_lpCurrent')&&document.activeElement!==$('inp_lpCurrent'))$('inp_lpCurrent').value=S.secondary.lpCurrent;
    if(lm){if(document.activeElement!==lm)lm.value=lpMax;lm.dataset.tip=lpTip;}
    if($('inp_lpMod')&&document.activeElement!==$('inp_lpMod'))$('inp_lpMod').value=S.secondary.lpMod;
    if($('val_lpMaxEff')){$('val_lpMaxEff').textContent=`(${lpBase})`;$('val_lpMaxEff').dataset.tip=lpTip;$('val_lpMaxEff').classList.toggle('hidden',!lpDiff);}
    if($('chip_lpMax'))$('chip_lpMax').innerHTML=modChip(lpDiff);
    if($('tip_val_lpMax_hdr'))$('tip_val_lpMax_hdr').dataset.tip=lpTip;
    const mlpBase=getMlpBase(), mlpMax=getMlpMax(M), mlpDiff=mlpMax-mlpBase, mm=$('val_mlpMax');
    if($('inp_mlpCurrent')&&document.activeElement!==$('inp_mlpCurrent'))$('inp_mlpCurrent').value=S.secondary.mlpCurrent;
    if(mm){if(document.activeElement!==mm)mm.value=mlpMax;mm.dataset.tip=mlpTip;}
    if($('inp_mlpMod')&&document.activeElement!==$('inp_mlpMod'))$('inp_mlpMod').value=S.secondary.mlpMod;
    if($('val_mlpMaxEff')){$('val_mlpMaxEff').textContent=`(${mlpBase})`;$('val_mlpMaxEff').dataset.tip=mlpTip;$('val_mlpMaxEff').classList.toggle('hidden',!mlpDiff);}
    if($('chip_mlpMax'))$('chip_mlpMax').innerHTML=modChip(mlpDiff);
    if($('tip_val_mlpMax_hdr'))$('tip_val_mlpMax_hdr').dataset.tip=mlpTip;
    const iniBase=getIniBase(), ini=getIniTot(M), iniDiff=ini-iniBase, it=$('val_iniTot'), is=$('val_iniSub');
    if(it){if(document.activeElement!==it)it.value=ini;it.dataset.tip=iniTip;}
    if($('inp_iniMod')&&document.activeElement!==$('inp_iniMod'))$('inp_iniMod').value=S.secondary.iniMod;
    if($('val_iniOrig')){$('val_iniOrig').textContent=`(${iniBase})`;$('val_iniOrig').dataset.tip=iniTip;$('val_iniOrig').classList.toggle('hidden',!iniDiff);}
    if($('chip_ini'))$('chip_ini').innerHTML=modChip(iniDiff);
    if($('tip_ini_hdr'))$('tip_ini_hdr').dataset.tip=iniTip;
    if(is) is.textContent=`${getAttrTot('WA',M)} (WA) − ${getAttrTot('IN',M)} (IN)${S.secondary.iniMod||M.ini?` + (${toInt(S.secondary.iniMod)+M.ini})`:''} = ${ini}`;
    const apBase=getApBase(), apMax=getApMax(M);
    if($('inp_apMax')){if(document.activeElement!==$('inp_apMax'))$('inp_apMax').value=apMax;$('inp_apMax').dataset.tip=apTip;}
    if($('tip_apMax_hdr'))$('tip_apMax_hdr').dataset.tip=apTip;
    if($('chip_apMax'))$('chip_apMax').innerHTML=modChip(M.apMax);
    if($('val_apMaxEff')){$('val_apMaxEff').textContent=`(${apBase})`;$('val_apMaxEff').dataset.tip=apTip;$('val_apMaxEff').classList.toggle('hidden',!M.apMax);}
    const mapBase=getMapBase(), mapMax=getMapMax(M);
    if($('inp_mapMax')){if(document.activeElement!==$('inp_mapMax'))$('inp_mapMax').value=mapMax;$('inp_mapMax').dataset.tip=mapTip;}
    if($('tip_mapMax_hdr'))$('tip_mapMax_hdr').dataset.tip=mapTip;
    if($('chip_mapMax'))$('chip_mapMax').innerHTML=modChip(M.mapMax);
    if($('val_mapMaxEff')){$('val_mapMaxEff').textContent=`(${mapBase})`;$('val_mapMaxEff').dataset.tip=mapTip;$('val_mapMaxEff').classList.toggle('hidden',!M.mapMax);}
    const cresBase=getCresBase(), cresMax=getCresMax(M);
    if($('cresNameInp'))$('cresNameInp').dataset.tip=cresTip;
    if($('inp_cresMax')){if(document.activeElement!==$('inp_cresMax'))$('inp_cresMax').value=cresMax;$('inp_cresMax').dataset.tip=cresTip;}
    if($('chip_cresMax'))$('chip_cresMax').innerHTML=modChip(M.cresMax);
    if($('val_cresMaxEff')){$('val_cresMaxEff').textContent=`(${cresBase})`;$('val_cresMaxEff').dataset.tip=cresTip;$('val_cresMaxEff').classList.toggle('hidden',!M.cresMax);}
    (S.extraSecList||[]).forEach(ex=>{
      const exKey='ex_'+ex.id,exBase=getExtraSecBase(ex),exEff=M.extraSec?.[ex.id]||0,exMax=exBase+exEff,exTip=buildSecTip(exKey,M);
      if($(`exName_${ex.id}`))$(`exName_${ex.id}`).dataset.tip=exTip;
      if($(`inp_ex_${ex.id}_cur`)&&document.activeElement!==$(`inp_ex_${ex.id}_cur`))$(`inp_ex_${ex.id}_cur`).value=ex.current;
      if($(`inp_ex_${ex.id}_max`)){if(document.activeElement!==$(`inp_ex_${ex.id}_max`))$(`inp_ex_${ex.id}_max`).value=exMax;$(`inp_ex_${ex.id}_max`).dataset.tip=exTip;}
      if($(`chip_ex_${ex.id}Max`))$(`chip_ex_${ex.id}Max`).innerHTML=modChip(exEff);
      if($(`val_ex_${ex.id}_eff`)){$(`val_ex_${ex.id}_eff`).textContent=`(${exBase})`;$(`val_ex_${ex.id}_eff`).dataset.tip=exTip;$(`val_ex_${ex.id}_eff`).classList.toggle('hidden',!exEff);}
    });
    ['woundLight','woundMedium','woundHeavy','traumaLight','traumaMedium','traumaHeavy'].forEach(k=>{
      const bx=$(`thBox_${k}`), ef=$(`thEff_${k}`), inp=$(`thInp_${k}`), b=toInt(S.thresholds[k],0), em=M[k]||0, eff=b+em;
      if(bx) bx.dataset.tip=buildSecTip(k,M);
      if(ef){ef.textContent=`(${b})`;ef.classList.toggle('hidden',!em);}
      if(inp&&document.activeElement!==inp){inp.value=eff;inp.classList.toggle('!border-emerald-500/60',Boolean(em));inp.classList.toggle('text-emerald-300',Boolean(em));}
    });
    const bst=getEffBst(M), bstAuto=getBstAuto(), bstBase=getBstBase(), bstOvr=hasBstOvr();
    if($('bstBox'))$('bstBox').dataset.tip=bstTip;
    if($('val_bstEff')){
      if(document.activeElement!==$('val_bstEff'))$('val_bstEff').value=bst;
      $('val_bstEff').classList.toggle('!border-amber-400',bstOvr);
      $('val_bstEff').classList.toggle('text-amber-300',bstOvr);
      $('val_bstEff').classList.toggle('text-acc',!bstOvr);
    }
    if($('rst_bstOvr')){
      $('rst_bstOvr').textContent=`(${bstAuto})`;
      $('rst_bstOvr').dataset.tip=`Manueller Overwrite aktiv – Klicken für Standardberechnung (${bstAuto})`;
      $('rst_bstOvr').classList.toggle('hidden',!bstOvr);
    }
    if($('val_bstOrig')){$('val_bstOrig').textContent=`(${bstBase})`;$('val_bstOrig').classList.toggle('hidden',!M.bst);}
    if($('chip_bstMod'))$('chip_bstMod').innerHTML=modChip(M.bst);
    S.movements.forEach(mv=>{
      const bstDelta=bst-bstAuto,autoBew=Math.max(0,toFlt(mv.base,5)+M.moveBase+bstDelta),hasOvr=mv.ovr!==undefined&&mv.ovr!==null&&String(mv.ovr).trim()!=='',bew=hasOvr?Math.max(0,toFlt(mv.ovr,autoBew)):autoBew;
      const inp1=$(`mv1_${mv.id}`),rst=$(`mvOvrReset_${mv.id}`);
      if(inp1){
        if(document.activeElement!==inp1) inp1.value=fmtN(bew);
        inp1.classList.toggle('!border-amber-400',hasOvr);
        inp1.classList.toggle('text-amber-300',hasOvr);
        inp1.dataset.tip=hasOvr?`Manueller Overwrite aktiv (Automatisch: ${fmtN(autoBew)} m)\nFeld leeren oder auf (${fmtN(autoBew)}) klicken für Automatik`:`Automatisch berechnet: ${fmtN(autoBew)} m (Basis + BSt)\nDirekt eintippen für manuellen Overwrite`;
      }
      if(rst){rst.textContent=`(${fmtN(autoBew)})`;rst.dataset.tip=`Manueller Overwrite aktiv – Klicken für Standardberechnung (${fmtN(autoBew)} m)`;rst.classList.toggle('hidden',!hasOvr);}
      if($(`mv2_${mv.id}`))$(`mv2_${mv.id}`).textContent=fmtN(bew/2)+' m';
      if($(`mv3_${mv.id}`))$(`mv3_${mv.id}`).textContent=fmtN(bew*2)+' m';
    });
    STATUS_DEFS.forEach(def=>{
      const v=getStatusEffValues(def.k), isPos=def.isPos;
      const sb=$(`stSumBadge_${def.k}`), sr=$(`stStatRst_${def.k}`), ar=$(`stAdvRst_${def.k}`), si=$(`stStatOvr_${def.k}`), ai=$(`stAdvOvr_${def.k}`), ki=$(`stStackInp_${def.k}`);
      if(sb) sb.textContent=`${fmtSign(v.effStat)} ${def.statLbl} • +${v.effAdv} ${isPos?(v.effAdv===1?'Vorteil':'Vorteile'):(v.effAdv===1?'Nachteil':'Nachteile')} (${def.attrs.join('/')})`;
      if(ki&&document.activeElement!==ki) ki.value=v.stacks;
      if(si){if(document.activeElement!==si)si.value=fmtSign(v.effStat);si.classList.toggle('!border-amber-400',v.hasStatOvr);si.classList.toggle('text-amber-300',v.hasStatOvr);}
      if(ai){if(document.activeElement!==ai)ai.value='+'+v.effAdv;ai.classList.toggle('!border-amber-400',v.hasAdvOvr);ai.classList.toggle('text-amber-300',v.hasAdvOvr);}
      if(sr){sr.textContent=`(${fmtSign(v.autoStat)})`;sr.classList.toggle('hidden',!v.hasStatOvr);}
      if(ar){ar.textContent=`(+${v.autoAdv})`;ar.classList.toggle('hidden',!v.hasAdvOvr);}
    });
    if($('t1Prev_lp')) $('t1Prev_lp').textContent=`LP ${S.secondary.lpCurrent}/${lpMax}`;
    if($('t1Prev_mlp')) $('t1Prev_mlp').textContent=`mLP ${S.secondary.mlpCurrent}/${mlpMax}`;
    if($('t1Prev_ap')) $('t1Prev_ap').textContent=`AP ${S.secondary.apCurrent}/${apMax}`;
    if($('t1Prev_map')) $('t1Prev_map').textContent=`mAP ${S.secondary.mapCurrent}/${mapMax}`;
    if($('t1Prev_ini')) $('t1Prev_ini').textContent=`Ini ${fmtSign(ini)}`;
    if($('t1Prev_wound')) $('t1Prev_wound').textContent=`Verw. ${toInt(S.thresholds.woundLight,0)+(M.woundLight||0)}/${toInt(S.thresholds.woundMedium,0)+(M.woundMedium||0)}/${toInt(S.thresholds.woundHeavy,0)+(M.woundHeavy||0)}`;
    if($('t1Prev_trauma')) $('t1Prev_trauma').textContent=`Trauma ${toInt(S.thresholds.traumaLight,0)+(M.traumaLight||0)}/${toInt(S.thresholds.traumaMedium,0)+(M.traumaMedium||0)}/${toInt(S.thresholds.traumaHeavy,0)+(M.traumaHeavy||0)}`;
    if($('t1Prev_bst')){$('t1Prev_bst').textContent=`BSt ${bst}`;$('t1Prev_bst').dataset.tip=bstTip;}
    if($('t1Prev_move0')&&S.movements[0]){
      const mv0=S.movements[0], bstDelta0=bst-bstAuto, autoBew0=Math.max(0,toFlt(mv0.base,5)+M.moveBase+bstDelta0), hasOvr0=mv0.ovr!==undefined&&mv0.ovr!==null&&String(mv0.ovr).trim()!=='', bew0=hasOvr0?Math.max(0,toFlt(mv0.ovr,autoBew0)):autoBew0;
      $('t1Prev_move0').innerHTML=`${esc(mv0.type)}: <strong>${fmtN(bew0)} m</strong>${S.movements.length>1?` <span class="t-mut">(+${S.movements.length-1})</span>`:''}`;
    }
    if($('t1Regen_lp')) $('t1Regen_lp').textContent=`LP ${getLpRegen(M)}`;
    if($('t1Regen_mlp')) $('t1Regen_mlp').textContent=`mLP ${getMlpRegen(M)}`;
  }else if(S.activeTab==='skills'){
    const ss=$('skSummaryHdr'); if(ss) ss.textContent=`${P.skSp} SP${P.skMsp?` + ${P.skMsp} MsP`:''}`;
  }else if(S.activeTab==='powers'){
    const ps=$('pwSummaryHdr'); if(ps) ps.textContent=`${P.pwSp} SP${P.pwMsp?` + ${P.pwMsp} MsP`:''}`;
    refreshTab3DynamicDOM(M);
  }else if(S.activeTab==='chronicle'){
    if($('chrSpRem'))$('chrSpRem').textContent=P.spRem; if($('chrSpSpent'))$('chrSpSpent').textContent=P.spSpent; if($('chrSpTot'))$('chrSpTot').textContent=P.totSp;
    if($('chrMspRem'))$('chrMspRem').textContent=P.mspRem; if($('chrMspSpent'))$('chrMspSpent').textContent=P.mspSpent; if($('chrMspTot'))$('chrMspTot').textContent=P.totMsp;
    if($('chrSpBreak'))$('chrSpBreak').innerHTML=`Tr: ${P.trSp} • Fert.: ${P.skSp} • Kräfte: ${P.pwSp}${P.spMod?` • <span class="text-emerald-400 font-bold" data-tip="${esc('SP-Mod durch Kraft-Effekte:\n'+P.spModSrc)}">SP-Mod: ${fmtSign(P.spMod)}</span>`:''}`;
    if($('chrMspBreak'))$('chrMspBreak').textContent=`Tr: ${P.trMsp} • Fert.: ${P.skMsp} • Kräfte: ${P.pwMsp}`;
    if($('chrTrBadge'))$('chrTrBadge').textContent=`${P.trSp} SP | ${P.trMsp||'-'} MsP`;
    if($('chrSkBadge'))$('chrSkBadge').textContent=`${P.skSp} SP | ${P.skMsp||'-'} MsP`;
    if($('chrPwBadge'))$('chrPwBadge').textContent=`${P.pwSp} SP | ${P.pwMsp||'-'} MsP`;
    if($('chrPwCats'))$('chrPwCats').innerHTML=buildPwCatPillsHtml();
    ATTRS.forEach(a=>{
      const spEl=$(`trSumSp_${a.k}`), mspEl=$(`trSumMsp_${a.k}`);
      if(spEl||mspEl){
        let sSp=0, sMsp=0;
        TR_DEFS.forEach(b=>{if(S.attributes[a.k].tr[b.i]){const tc=getTrCost(a.k,b.i);sSp+=tc.sp;sMsp+=tc.msp;}});
        if(spEl) spEl.textContent=`${sSp} SP`;
        if(mspEl) mspEl.textContent=sMsp||0;
      }
    });
  }
  S.skills.forEach(sk=>{
    const rb=$(`skRollBtn_${sk.id}`), mrb=$(`skMobRollBtn_${sk.id}`);
    if(rb||mrb){
      const bm=buildSkRollBtnMeta(sk,M);
      if(rb){rb.innerHTML=bm.innerHtml;rb.dataset.tip=bm.tip;}
      if(mrb){mrb.innerHTML=`<span>🎲 ${bm.pool}</span>${bm.skBadge}`;mrb.dataset.tip=bm.tip;}
    }
    const mrank=$(`skMobRankBtn_${sk.id}`);
    if(mrank){
      const rm=buildSkMobRankBtnMeta(sk);
      mrank.className=`btn py-1 px-2 text-[11px] font-extrabold tabular min-w-0 max-w-[60%] ${rm.cls}`;
      mrank.innerHTML=rm.html;
      mrank.dataset.tip=rm.tip;
    }
    const mcp=$(`skMobCostPill_${sk.id}`);
    if(mcp){
      const cp=buildSkMobCostPillMeta(sk);
      mcp.className=`inline-flex items-center px-1.5 py-0.5 rounded-md border text-[10px] font-extrabold tabular whitespace-nowrap ${cp.cls}`;
      mcp.textContent=cp.text;
    }
  });
  syncDiceFromSheet();
  if(D.open){
    const ae=document.activeElement, inDice=Boolean(ae&&ae.closest&&ae.closest('#diceMount'));
    if(!inDice){renderDice();}
    else{const dT=calcThreshold();if($('diceAdvDisBox'))$('diceAdvDisBox').innerHTML=buildAdvDisInnerHtml(dT);if($('diceThBox'))$('diceThBox').innerHTML=buildThresholdInnerHtml(dT);}
  }
  if(deferSave) saveSoon(); else save();
}

document.addEventListener('click',async e=>{
  if(CTX_MENU.open){
    const closeTrigger=e.target.closest('[data-ctx-backdrop],[data-ctx-close]');
    if(closeTrigger){
      closeCtxMenu();
      return;
    }
    const inCtx=e.target.closest('.ctx-menu');
    if(!inCtx){
      const clickedOwnAnchor=Boolean(CTX_MENU.anchorEl&&(e.target===CTX_MENU.anchorEl||CTX_MENU.anchorEl.contains(e.target)));
      closeCtxMenu();
      if(clickedOwnAnchor) return;
    }else{
      const ctxItem=e.target.closest('.ctx-item');
      if(ctxItem){
        if(ctxItem.disabled) return;
        const curMenuId=CTX_MENU.id;
        const keepOpen=ctxItem.hasAttribute('data-ctx-keep-open');
        const cbIdx=ctxItem.dataset.ctxCb;
        if(cbIdx!==undefined){
          const fn=CTX_MENU.callbacks[toInt(cbIdx,-1)];
          if(typeof fn==='function'){
            try{await fn(e,ctxItem);}catch(err){console.error(err);}
          }
        }
        if(!keepOpen){
          queueMicrotask(()=>{if(CTX_MENU.open&&CTX_MENU.id===curMenuId)closeCtxMenu();});
        }
        if(!ctxItem.dataset.action) return;
      }
    }
  }
  if(UI.openPwMenu&&!e.target.closest('.pw-dd-wrap')) closePwDropdown();
  const el=e.target.closest('[data-action]'); if(!el) return;
  const btn=el, act=el.dataset.action; if(act==='close-modal-bg'&&e.target!==el) return;
  if(act==='fb-set-backlog-user'){if(!CLOUD.isAdmin)return;FEEDBACK.backlogUser=btn.dataset.user||'all';renderModal();return;}
  if(act==='win-float'){ const k=btn.dataset.win, st=getWinState(k); st.floating=!st.floating; if(st.floating){st.docked=false; st.z=Math.max(CN.z||50,D.z||50,LD.z||50,FBW.z||50)+1;} saveWinPref(k); renderCampNotes(); renderLiveDice(); renderFbAdminWin(); renderDice(); return; }
  if(act==='win-reset'){ const k=btn.dataset.win, st=getWinState(k); st.w=0; st.h=0; st.x=null; st.y=null; st.floating=false; clearWinPref(k); renderCampNotes(); renderLiveDice(); renderFbAdminWin(); renderDice(); return; }
  if(act==='open-fbadmin-win'){ if(CLOUD.isAdmin){ UI.modal=null; FBW.open=true; if(!hasSavedWinPref('fbadmin')) FBW.floating=true; renderModal(); renderFbAdminWin(); fetchFeedback(false); } return; }
  if(act==='close-fbadmin'){ FBW.open=false; renderFbAdminWin(); return; }
  switch(act){
    case 'switch-tab': closeCtxMenu({silent:true}); S.activeTab=el.dataset.tab; UI.openPwMenu=''; UI.confirmDelId=null; UI.confirmDelExSecId=null; saveLastActiveTab(S.charId,S.activeTab); applyTheme(); renderHeader(); renderMain(); save(false); break;
    case 'rest-simple': performSimpleRest(); break;
    case 'rest-full': performFullRest(); break;
    case 'set-phase':{
      if(CLOUD.viewingRemote){toast('👁️ Im Ansichtsmodus kann die Phase nicht geändert werden.');break;}
      const next=el.dataset.phase==='flut'?'flut':'ebbe';
      if(S.phase!==next){S.phase=next;renderHeader();save();}
      break;
    }
    case 'toggle-phase':{
      if(CLOUD.viewingRemote){toast('👁️ Im Ansichtsmodus kann die Phase nicht geändert werden.');break;}
      S.phase=S.phase==='flut'?'ebbe':'flut';
      renderHeader();save();
      break;
    }
    case 'reset-regen-ovr':{
      const k=el.dataset.key;
      if(k==='lp') S.secondary.lpRegenOvr='';
      else if(k==='mlp') S.secondary.mlpRegenOvr='';
      save(); renderHeader(); renderMain();
      break;
    }
    case 'insp-step':{
      const d=toInt(el.dataset.d,0);
      S.inspiration=Math.max(0,toInt(S.inspiration,0)+d);
      renderMain(); save(); break;
    }
    case 'use-inspiration':{
      if(S.inspirationActive){toast('✨ Inspiration ist bereits für den nächsten Wurf aktiv!');break;}
      const cur=Math.max(0,toInt(S.inspiration,0));
      if(cur<=0){toast('Keine Inspirations-Stapel verfügbar.');break;}
      S.inspiration=cur-1;
      S.inspirationActive=true;
      logChron(`Inspiration eingesetzt: 1 Stapel verbraucht (verbleibend: ${S.inspiration}) → +1 Vorteil für den nächsten Wurf aktiv.`);
      syncDiceFromSheet(); renderMain(); renderDice(); save();
      toast('✨ Inspiration aktiv (+1 Vorteil für den nächsten Wurf)!');
      break;
    }
    case 'cancel-inspiration':{
      if(!S.inspirationActive) break;
      S.inspirationActive=false;
      S.inspiration=Math.max(0,toInt(S.inspiration,0))+1;
      syncDiceFromSheet(); renderMain(); renderDice(); save();
      toast('↺ Inspiration zurückgelegt (+1 Stapel).');
      break;
    }
    case 'toggle-status-sec': {
      const next=!isTab1SecCollapsed('status');
      UI.tab1.status=next;
      if(!isTab1PhoneDefault()){S.statusCollapsed=next; save(false);}
      renderMain();
      break;
    }
    case 'toggle-t1-sec': {
      const sec=String(el.dataset.sec||'');
      if(!sec||!Object.prototype.hasOwnProperty.call(UI.tab1,sec)) break;
      const next=!isTab1SecCollapsed(sec);
      UI.tab1[sec]=next;
      if(sec==='attrs'){
        if(!next) UI.tab1.attrPairs={ST_KO:true,PR_GW:true,WA_IN:true,AU_WK:true};
        else UI.tab1.attrPairs={};
      }
      renderMain();
      break;
    }
    case 'toggle-attr-pair': {
      const grp=String(el.dataset.group||'');
      if(!grp) break;
      if(!UI.tab1.attrPairs) UI.tab1.attrPairs={};
      if(isTab1SecCollapsed('attrs')) UI.tab1.attrPairs[grp]=!UI.tab1.attrPairs[grp];
      else UI.tab1.attrPairs[grp]=!(UI.tab1.attrPairs[grp]!==false);
      renderMain();
      break;
    }
    case 'toggle-status-eff': {
      const k=el.dataset.key, def=STATUS_DEFS.find(d=>d.k===k); if(!def) break;
      if(!S.statusEffects) S.statusEffects=makeDefaultStatusEffects();
      const st=S.statusEffects[k];
      withPoolSync(()=>{
        st.active=!st.active;
        if(st.active&&def.hasIniChoice) UI.statusIniPromptKey=k;
        else if(!st.active&&UI.statusIniPromptKey===k) UI.statusIniPromptKey='';
      });
      syncLiveCalculations(); renderMain(); renderHeader(); renderDice(); save();
      break;
    }
    case 'set-status-inidir':
    case 'confirm-status-inidir': {
      const k=el.dataset.key, dir=toInt(el.dataset.dir,1)<0?-1:1, def=STATUS_DEFS.find(d=>d.k===k); if(!def) break;
      if(!S.statusEffects) S.statusEffects=makeDefaultStatusEffects();
      const st=S.statusEffects[k];
      withPoolSync(()=>{
        st.iniDir=dir;
        st.active=true;
        if(UI.statusIniPromptKey===k) UI.statusIniPromptKey='';
      });
      syncLiveCalculations(); renderMain(); renderHeader(); renderDice(); save();
      break;
    }
    case 'set-status-stack': {
      const k=el.dataset.key, val=Math.max(1,toInt(el.dataset.val,1));
      if(!S.statusEffects) S.statusEffects=makeDefaultStatusEffects();
      if(S.statusEffects[k]){
        withPoolSync(()=>{S.statusEffects[k].stacks=val;});
        syncLiveCalculations(); renderMain(); renderHeader(); renderDice(); save();
      }
      break;
    }
    case 'step-status-stack': {
      const k=el.dataset.key, d=toInt(el.dataset.d,0);
      if(!S.statusEffects) S.statusEffects=makeDefaultStatusEffects();
      if(S.statusEffects[k]){
        withPoolSync(()=>{S.statusEffects[k].stacks=Math.max(1,toInt(S.statusEffects[k].stacks,1)+d);});
        syncLiveCalculations(); renderMain(); renderHeader(); renderDice(); save();
      }
      break;
    }
    case 'reset-status-ovr': {
      const k=el.dataset.key, fld=el.dataset.field;
      if(!S.statusEffects) S.statusEffects=makeDefaultStatusEffects();
      if(S.statusEffects[k]){
        withPoolSync(()=>{if(fld==='stat')S.statusEffects[k].statOvr='';else if(fld==='adv')S.statusEffects[k].advOvr='';});
        syncLiveCalculations(); renderMain(); renderHeader(); renderDice(); save();
      }
      break;
    }
    case 'reset-all-status': {
      if(!S.statusEffects) S.statusEffects=makeDefaultStatusEffects();
      withPoolSync(()=>{
        STATUS_DEFS.forEach(d=>{if(S.statusEffects[d.k])S.statusEffects[d.k].active=false;});
        UI.statusIniPromptKey='';
      });
      syncLiveCalculations(); renderMain(); renderHeader(); renderDice(); save();
      toast('Alle Statuseffekte deaktiviert');
      break;
    }
    case 'switch-qtab': S.quickTab=el.dataset.qtab; renderMain(); save(false); break;
    case 'toggle-tr': {const k=el.dataset.attr,idx=+el.dataset.idx,a=S.attributes[k],oldL=getLpMax(),oldM=getMlpMax(),nx=a.tr.lastIndexOf(true)===idx?idx-1:idx;a.tr=[0,1,2,3,4].map(i=>i<=nx);if(S.secondary.lpCurrent===oldL)S.secondary.lpCurrent=getLpMax();if(S.secondary.mlpCurrent===oldM)S.secondary.mlpCurrent=getMlpMax();logChron(`Training (${el.dataset.src}): ${k} → ${nx<0?'0':`Block ${nx+1}`}.`);syncDiceFromSheet();renderAll();break;}
    case 'toggle-tr-grp': {const k=el.dataset.attr;if(!S.chrTrExpanded)S.chrTrExpanded={};S.chrTrExpanded[k]=!S.chrTrExpanded[k];renderMain();save(false);break;}
    case 'toggle-all-tr-grp': {const v=el.dataset.val==='1';if(!S.chrTrExpanded)S.chrTrExpanded={};ATTRS.forEach(a=>{S.chrTrExpanded[a.k]=v;});renderMain();save(false);break;}
    case 'gift-tr-attr': {
      const k=el.dataset.attr,a=S.attributes[k];
      if(a){
        const actBlocks=TR_DEFS.filter(b=>a.tr[b.i]);
        const allGift=actBlocks.length>0&&actBlocks.every(b=>{const tc=getTrCost(k,b.i);return tc.manual&&tc.sp===0&&tc.msp===0;});
        if(allGift){
          TR_DEFS.forEach(b=>{a.trSp[b.i]=null;a.trMsp[b.i]=null;});
          renderAll();toast(`Standard-Trainingskosten für ${k} wiederhergestellt`);
        }else{
          TR_DEFS.forEach(b=>{if(a.tr[b.i]){a.trSp[b.i]=0;a.trMsp[b.i]=0;}});
          renderAll();toast(`Alle aktiven Stufen von ${k} auf 0 SP gesetzt`);
        }
      }
      break;
    }
    case 'gift-tr': {
      const k=el.dataset.attr,a=S.attributes[k],i=+el.dataset.idx;
      if(a){
        const tc=getTrCost(k,i);
        if(tc.manual&&tc.sp===0&&tc.msp===0){
          a.trSp[i]=null;a.trMsp[i]=null;
          renderAll();toast(`${k} Block ${i+1}: Standardkosten wiederhergestellt`);
        }else{
          a.trSp[i]=0;a.trMsp[i]=0;
          renderAll();toast(`${k} Block ${i+1} auf 0 SP gesetzt`);
        }
      }
      break;
    }
    case 'toggle-chrsec-collapse': {if(!S.chrSecMeta)S.chrSecMeta=makeChrSecMeta();const m=S.chrSecMeta[el.dataset.sec];if(m){m.collapsed=!m.collapsed;renderMain();save(false);}break;}
    case 'collapse-all-chr': {const v=el.dataset.val==='1';if(!S.chrSecMeta)S.chrSecMeta=makeChrSecMeta();DEF_CHR_SEC_ORDER.forEach(k=>{if(S.chrSecMeta[k])S.chrSecMeta[k].collapsed=v;});renderMain();save(false);break;}
    case 'open-chrsec-menu': openChrSecMenu(el,el.dataset.sec); break;
    case 'open-chrpw-menu': openChrPwMenu(el,el.dataset.kind,el.dataset.id); break;
    case 'move-chrsec': moveChrSecOrder(el.dataset.sec,el.dataset.dir); break;
    case 'open-chrsec-color': if(!S.chrSecMeta)S.chrSecMeta=makeChrSecMeta(); openDualColorModal('chrsec',el.dataset.sec,el.dataset.cmode); break;
    case 'sec-step': {
      const f=el.dataset.field, d=Number(el.dataset.delta);
      let next=toInt(S.secondary[f])+d;
      const resMap={lpCurrent:'lp',mlpCurrent:'mlp',apCurrent:'ap',mapCurrent:'map'};
      const rKey=resMap[f];
      if(rKey&&d>0){
        const cap=getEffectivePoolCap(rKey);
        if(cap.reserved>0&&next>cap.effMax){
          next=cap.effMax;
          toast(`🔒 ${cap.reserved} ${getResLabel(rKey)} reserviert (max. ${cap.effMax}/${cap.fullMax}) – zum Freigeben Reservierung aufheben.`);
        }
      }
      S.secondary[f]=next; renderMain(); save(); break;
    }
    case 'cres-step': {
      const d=Number(el.dataset.delta);
      let next=toInt(S.customRes.current)+d;
      if(d>0){
        const cap=getEffectivePoolCap('cres');
        if(cap.reserved>0&&next>cap.effMax){
          next=cap.effMax;
          toast(`🔒 ${cap.reserved} ${getResLabel('cres')} reserviert (max. ${cap.effMax}/${cap.fullMax}) – zum Freigeben Reservierung aufheben.`);
        }
      }
      S.customRes.current=next; renderMain(); save(); break;
    }
    case 'add-extra-sec': if(!Array.isArray(S.extraSecList))S.extraSecList=[]; S.extraSecList.push(makeExtraSec(S.extraSecList.length+1)); renderMain(); save(); toast('Sekundärattribut hinzugefügt'); break;
    case 'ask-del-extra-sec': UI.confirmDelExSecId=el.dataset.id; renderMain(); break;
    case 'cancel-del-extra-sec': UI.confirmDelExSecId=null; renderMain(); break;
    case 'confirm-del-extra-sec': {
      const id=el.dataset.id, ex=(S.extraSecList||[]).find(x=>x.id===id);
      UI.confirmDelExSecId=null;
      if(ex){
        const nm=getExtraSecName(ex);
        purgeExtraSecFromPowers(nm,id);
        S.extraSecList=(S.extraSecList||[]).filter(x=>x.id!==id);
        S.useResList=(S.useResList||[]).filter(r=>r!=='ex_'+id);
        renderAll();
        toast(`Sekundärattribut „${nm}“ & zugehörige Effekt-Bausteine entfernt`);
      }
      break;
    }
    case 'exsec-step': {
      const ex=(S.extraSecList||[]).find(x=>x.id===el.dataset.id);
      if(ex){
        const d=Number(el.dataset.delta);
        let next=toInt(ex.current)+d;
        if(d>0){
          const rKey='ex_'+ex.id, cap=getEffectivePoolCap(rKey);
          if(cap.reserved>0&&next>cap.effMax){
            next=cap.effMax;
            toast(`🔒 ${cap.reserved} ${getResLabel(rKey)} reserviert (max. ${cap.effMax}/${cap.fullMax}) – zum Freigeben Reservierung aufheben.`);
          }
        }
        ex.current=next; renderMain(); save();
      }
      break;
    }
    case 'open-attr-colors': UI.colTarget='attr'; UI.attrGroupSel='ST_KO'; UI.colDraft=S.attrColors.ST_KO; UI.modal='color'; renderModal(); break;
    case 'sel-attr-grp': UI.attrGroupSel=el.dataset.grp; UI.colDraft=S.attrColors[UI.attrGroupSel]; renderModal(); break;
    case 'open-sec-color': UI.colTarget=el.dataset.target; UI.colDraft=getSecCol(UI.colTarget); UI.modal='color'; renderModal(); break;
    case 'open-pw-color': openDualColorModal('pw',el.dataset.id,el.dataset.cmode,el.dataset.kind); break;
    case 'open-sec-folder-color': openDualColorModal('sec-folder',el.dataset.id,el.dataset.cmode); break;
    case 'open-sksec-color': openDualColorModal('sksec-folder',el.dataset.id,el.dataset.cmode); break;
    case 'open-invsec-color': openDualColorModal('invsec-folder',el.dataset.id,el.dataset.cmode); break;
    case 'open-sk-color': openDualColorModal('sk-item',el.dataset.id,el.dataset.cmode); break;
    case 'open-eq-color': openDualColorModal('eq',el.dataset.id,el.dataset.cmode,el.dataset.kind); break;
    case 'open-eqsec-color': if(!S.equipSecMeta)S.equipSecMeta=makeEqSecMeta(); openDualColorModal('eqsec',el.dataset.sec,el.dataset.cmode); break;
    case 'open-camp-color': if(CLOUD.isAdmin) openDualColorModal('camp',el.dataset.id,el.dataset.cmode); break;
    case 'switch-col-mode': {
      UI.colMode=el.dataset.cmode==='bg'?'bg':'text';
      const it=getColTargetObj(), cur=UI.colMode==='bg'?it?.bgColor:it?.color;
      UI.colDraft=isHex(cur)?cur:(UI.colMode==='bg'?'#1e293b':'#38bdf8');
      renderModal(); break;
    }
    case 'col-preset': UI.colDraft=el.dataset.col; renderModal(); break;
    case 'reset-col':
      if(UI.colTarget==='attr') UI.colDraft=DEF_ATTR_COLS[UI.attrGroupSel];
      else if(DUAL_COL_TARGETS.has(UI.colTarget)){
        const it=getColTargetObj();
        if(it){if(UI.colMode==='bg')it.bgColor='';else it.color='';}
        const wasCamp=UI.colTarget==='camp';
        UI.modal=null;
        if(wasCamp){saveRegistryLocal();syncCloudRegistry(true);}else save();
        renderMain();renderModal();
        toast(UI.colMode==='bg'?'Standard-Fensterfarbe wiederhergestellt':'Standard-Textfarbe wiederhergestellt');break;
      }
      else if(UI.colTarget==='cres') UI.colDraft='#c084fc';
      else if(String(UI.colTarget||'').startsWith('ex_')) UI.colDraft='#34d399';
      else UI.colDraft=DEF_SEC_COLS[UI.colTarget];
      renderModal(); break;
    case 'save-col': {
      const raw=$('colHexInp')?$('colHexInp').value.trim():UI.colDraft, hx=raw.startsWith('#')?raw:'#'+raw, fin=isHex(hx)?hx.toLowerCase():UI.colDraft;
      if(UI.colTarget==='attr'){S.attrColors[UI.attrGroupSel]=fin;renderMain();save();renderModal();toast('Paarfarbe gespeichert');}
      else if(DUAL_COL_TARGETS.has(UI.colTarget)){
        const it=getColTargetObj();
        if(it){if(UI.colMode==='bg')it.bgColor=fin;else it.color=fin;}
        const wasCamp=UI.colTarget==='camp';
        UI.modal=null;
        if(wasCamp){saveRegistryLocal();syncCloudRegistry(true);}else save();
        renderMain();renderModal();
        toast(UI.colMode==='bg'?'Fensterfarbe gespeichert':'Textfarbe gespeichert');
      }
      else{
        if(UI.colTarget==='cres') S.customRes.color=fin;
        else if(String(UI.colTarget||'').startsWith('ex_')){const ex=(S.extraSecList||[]).find(x=>'ex_'+x.id===UI.colTarget);if(ex)ex.color=fin;}
        else S.secColors[UI.colTarget]=fin;
        UI.modal=null;renderMain();renderModal();save();toast('Farbe gespeichert');
      }
      break;
    }
    case 'open-list': UI.listType=el.dataset.ltype==='subcat'?'pwTag':el.dataset.ltype; UI.modal='list'; renderModal(); break;
    case 'quick-add-res': if(!S.useResList.includes(el.dataset.val)){S.useResList.push(el.dataset.val);renderMain();renderModal();save();} break;
    case 'del-list-item': {
      const v=el.dataset.val, lt=UI.listType;
      if(lt==='weaponTags'||lt==='armorTags'||lt==='ammoTags'){
        const k={weaponTags:'weaponTagList',armorTags:'armorTagList',ammoTags:'ammoTagList'}[lt];
        S[k]=S[k].filter(x=>x.name!==v);
        invalidateModsCache();
        syncDiceFromSheet();
      }else if(lt==='pwTag'||lt==='subcat'){
        S.pwTagList=(S.pwTagList||DEF_PW_TAGS).filter(x=>x!==v);
      }else{
        const k={useRes:'useResList',customStats:'customStats'}[lt];
        if(k) S[k]=S[k].filter(x=>x!==v);
      }
      renderMain();renderModal();if(D.open)renderDice();save();break;
    }
    case 'reset-list':
      if(UI.listType==='pwTag'||UI.listType==='subcat'){S.pwTagList=[...DEF_PW_TAGS];}
      else if(UI.listType==='useRes')S.useResList=[...DEF_USERES];
      else if(UI.listType==='weaponTags'){S.weaponTagList=clone(DEF_WEAPON_TAGS);invalidateModsCache();syncDiceFromSheet();}
      else if(UI.listType==='armorTags'){S.armorTagList=clone(DEF_ARMOR_TAGS);invalidateModsCache();syncDiceFromSheet();}
      else if(UI.listType==='ammoTags'){S.ammoTagList=[];invalidateModsCache();syncDiceFromSheet();}
      renderMain(); renderModal(); if(D.open)renderDice(); save(); break;
    case 'bst-step': {const nb=getBstBase()+Number(el.dataset.delta);S.bst=nb;S.bstOvr=String(nb);renderMain();save();break;}
    case 'reset-bst-ovr': S.bstOvr=''; S.bst=getBstAuto(); renderMain(); save(); toast('BSt auf Automatik (⌊Bew/5⌋) zurückgesetzt'); break;
    case 'reset-mv-ovr': {const mv=S.movements.find(x=>x.id===el.dataset.id);if(mv){mv.ovr='';renderMain();save();toast('Bew (BSt) auf Automatik zurückgesetzt');}break;}
    case 'add-move': S.movements.push({id:uid(),type:'Bewegung',base:5,ovr:''}); renderMain(); save(); break;
    case 'del-move': S.movements=S.movements.filter(m=>m.id!==el.dataset.id); renderMain(); save(); break;
    case 'add-hz': S.hitZones.push({id:uid(),range:'01 - 10',zone:'Neue Zone',size:'normal',armor:''}); renderMain(); save(); break;
    case 'del-hz': if(S.hitZones.length>1){S.hitZones=S.hitZones.filter(z=>z.id!==el.dataset.id);renderMain();save();} break;
    case 'reset-hz': UI.confirmHzStep=1; UI.modal='resetHz'; renderModal(); break;
    case 'confirm-reset-hz-1': UI.confirmHzStep=2; renderModal(); break;
    case 'confirm-reset-hz-2': S.hitZones=JSON.parse(JSON.stringify(DEF_HZ)); S.lastHzRoll=null; UI.modal=null; renderMain(); renderModal(); save(); toast('Standard-Trefferzonen wiederhergestellt'); break;
    case 'roll-hz': {const prevWinY=window.scrollY,prevWinX=window.scrollX;const r=rollW100(); if(r===69) triggerNiceEasterEgg();S.lastHzRoll=r;const hzHit=S.hitZones.find(z=>{const m=String(z.range||'').match(/\d+/g);return m&&r>=Math.min(+m[0],+(m[1]??m[0]))&&r<=Math.max(+m[0],+(m[1]??m[0]));});const isLobHz=Boolean(UI.inLobby);publishLiveRoll({id:uid(),tsMs:Date.now(),ts:new Date().toLocaleTimeString('de-DE',{hour:'2-digit',minute:'2-digit',second:'2-digit'}),senderTabId:LIVE_TAB_ID,charId:isLobHz?'':(S.charId||''),charName:isLobHz?(CLOUD.currentUser?CLOUD.currentUser:'Gast'):(String(S.profile.name||'').trim()||'Unbenannter Held'),playerName:isLobHz?'':String(CLOUD.currentUser||S.owner||'').trim(),campaignId:isLobHz?getActiveLiveCampaignId():getCharCampaignId(S.charId),label:'🎯 Trefferzonen-Wurf',isHz:true,hzZone:hzHit?`${hzHit.zone} (${hzHit.size||'normal'})`:'Keine Zone',th:100,chance:100,res:[{r,ok:true,crit:false,eg:0,meg:0}]});renderMain();if(window.scrollY!==prevWinY)window.scrollTo(prevWinX,prevWinY);save();if(!isSecretRollActive()) toast(`Trefferzone W100 = ${r}${hzHit?` (${hzHit.zone})`:''}`);break;}
    case 'roll-attr': {const k=el.dataset.attr,v=getAttrTot(k);D.weaponId=null;D.wRollCat='Normaler Test';D.skillId=null;D.attrKey=k;D.critOff=0;D.sitActive={};D.cMode='breakdown';D.cAttr=v;D.cSkill='0';D.cDirect=v;D.label=`Normaler Test: ${k} (${v})`;applyDiceAutoAdvDis(true);D.open=true;renderHeader();renderDice();break;}
    case 'toggle-sk-edit': {
      const sid=el.dataset.id;
      if(UI.editSkNameId===sid){
        UI.editSkNameId=null;
        renderMain();
        updateCalcDOM();
      }else{
        UI.editSkNameId=sid;
        renderMain();
        const inp=$(`skNameInp_${sid}`);
        if(inp){
          inp.focus();
          const len=inp.value.length;
          try{inp.setSelectionRange(len,len);}catch(err){}
        }
      }
      break;
    }
    case 'roll-skill': {const sk=S.skills.find(x=>x.id===el.dataset.id);if(!sk)break;const ak=sk.linkedAttr||'PR',av=getAttrTot(ak),b=getSkBonus(sk);D.weaponId=null;D.wRollCat='Normaler Test';D.skillId=sk.id;D.attrKey=ak;D.critOff=0;D.sitActive={};D.cMode='breakdown';D.cAttr=av;if(['0','10','15','20','30'].includes(String(b))){D.cSkill=String(b);}else{D.cSkill='custom';D.cCustom=b;}D.cDirect=av+b;D.label=`Normaler Test: ${sk.name} (${fmtSign(b)}) + ${ak} (${av})`;applyDiceAutoAdvDis(true);D.open=true;renderHeader();renderDice();break;}
    case 'roll-weapon': openWeaponRoll(el.dataset.id,el.dataset.wcat); break;
    case 'set-dice-wcat': {
      const wc=el.dataset.wcat||'Normaler Test';
      D.wRollCat=wc;D.sitActive={};
      if(D.dMode==='character'){
        if(wc==='Trefferwurf'){D.oppKind='preset';if(!['dodge','parry','block'].includes(D.oppPreset))D.oppPreset='dodge';D.oppSitActive={};}
        else if(wc==='Parieren'||wc==='Blocken'||wc==='Ausweichen'){D.oppKind='preset';D.oppPreset='attack';D.oppSitActive={};}
      }
      applyDiceAutoAdvDis(true);syncDiceFromSheet();renderDice();break;
    }
    case 'clear-dice-weapon': D.weaponId=null; D.wRollCat='Normaler Test'; D.critOff=0; D.sitActive={}; applyDiceAutoAdvDis(true); syncDiceFromSheet(); renderDice(); break;
    case 'toggle-dice-sit': {const sk=el.dataset.sit;if(sk){if(!D.sitActive)D.sitActive={};D.sitActive[sk]=!D.sitActive[sk];applyDiceAutoAdvDis(false);renderDice();}break;}
    case 'dice-pick-lobby-attr': {const ak=el.dataset.attr||'ST';D.cAttr=50;D.cDirect=D.cMode==='breakdown'?50+getCSkVal():50;D.label='Freie Probe: '+ak+' (50)';D.attrKey=null;D.skillId=null;D.weaponId=null;applyDiceAutoAdvDis(false);renderDice();break;}
    case 'dice-pick-attr': {if(isLobbyNeutralDice()){const ak=el.dataset.attr||'ST';D.cAttr=50;D.cDirect=D.cMode==='breakdown'?50+getCSkVal():50;D.label='Freie Probe: '+ak+' (50)';D.attrKey=null;D.skillId=null;D.weaponId=null;applyDiceAutoAdvDis(false);renderDice();break;}const k=el.dataset.attr,av=getAttrTot(k);D.attrKey=k;if(D.weaponId){D.cMode='breakdown';syncDiceFromSheet();}else if(D.skillId){const sk=S.skills.find(x=>x.id===D.skillId);if(sk){const b=getSkBonus(sk);D.cMode='breakdown';D.cAttr=av;if(['0','10','15','20','30'].includes(String(b))){D.cSkill=String(b);}else{D.cSkill='custom';D.cCustom=b;}D.cDirect=av+b;D.label=`${sk.name} (${fmtSign(b)}) + ${k} (${av})`;applyDiceAutoAdvDis(false);}}else{D.cMode='breakdown';D.cAttr=av;D.cSkill='0';D.cDirect=av;D.label=`Attributsprobe: ${k} (${av})`;applyDiceAutoAdvDis(false);}renderDice();break;}
    case 'set-sk-rank': {const sk=S.skills.find(x=>x.id===el.dataset.id),rk=+el.dataset.rank;if(sk){sk.rank=sk.rank===rk?rk-1:rk;if(!sk.manualCost){const auto=calcAutoSkCost(sk.category,sk.rank);sk.customSp=auto.sp;sk.customMsp=auto.msp;}logChron(`Fertigkeit "${sk.name}" → ${SK_RANKS[sk.rank].n}.`);syncDiceFromSheet();renderAll();}break;}
    case 'open-sk-rank-menu': openSkRankMenu(el,el.dataset.id); break;
    case 'toggle-sk-mob-exp': {const sid=el.dataset.id;if(sid){if(!UI.skMobExp)UI.skMobExp={};UI.skMobExp[sid]=!UI.skMobExp[sid];renderMain();}break;}
    case 'reset-sk-cost': {const sk=S.skills.find(x=>x.id===el.dataset.id);if(sk){const auto=calcAutoSkCost(sk.category,sk.rank);sk.manualCost=false;sk.customSp=auto.sp;sk.customMsp=auto.msp;renderAll();toast(`"${sk.name}": Standardkosten wiederhergestellt (${auto.sp} SP${auto.msp?` + ${auto.msp} MsP`:''})`);}break;}
    case 'reset-sk-bon': {const sk=S.skills.find(x=>x.id===el.dataset.id);if(sk){sk.bonusOvr='';syncDiceFromSheet();renderMain();save();toast(`"${sk.name}": Bonus auf Grad-Standard (+${getSkAutoBonus(sk.rank)}) zurückgesetzt`);}break;}
    case 'gift-sk': {
      const sk=S.skills.find(x=>x.id===el.dataset.id);
      if(sk){
        const isGifted=sk.manualCost&&toInt(sk.customSp,0)===0&&toInt(sk.customMsp,0)===0;
        if(isGifted){
          const auto=calcAutoSkCost(sk.category,sk.rank);
          sk.manualCost=false;sk.customSp=auto.sp;sk.customMsp=auto.msp;
          renderAll();toast(`"${sk.name}": Standardkosten wiederhergestellt`);
        }else{
          sk.manualCost=true;sk.customSp=0;sk.customMsp=0;
          renderAll();toast(`"${sk.name}" auf 0 SP (Geschenkt) gesetzt`);
        }
      }
      break;
    }
    case 'sort-skills-az': UI.skSort={col:'name',asc:true}; S.skills.sort((a,b)=>String(a.name||'').localeCompare(String(b.name||''),'de')); renderMain(); save(); toast('Fertigkeiten A–Z sortiert'); break;
    case 'sort-sk-col': {
      const col=el.dataset.col;
      if(UI.skSort?.col===col) UI.skSort.asc=!UI.skSort.asc;
      else UI.skSort={col,asc:true};
      const dir=UI.skSort.asc?1:-1, attrOrd=ATTRS.map(a=>a.k), catOrd=['marginal','fundamental','grandios'];
      S.skills.sort((a,b)=>{
        if(col==='name') return dir*String(a.name||'').localeCompare(String(b.name||''),'de');
        if(col==='attr'){
          const ai=attrOrd.indexOf(a.linkedAttr), bi=attrOrd.indexOf(b.linkedAttr);
          if(ai!==bi) return dir*(ai-bi);
          const pa=getAttrTot(a.linkedAttr)+getSkBonus(a), pb=getAttrTot(b.linkedAttr)+getSkBonus(b);
          if(pb!==pa) return dir*(pb-pa);
          return String(a.name||'').localeCompare(String(b.name||''),'de');
        }
        if(col==='cat'){
          const ci=catOrd.indexOf(a.category)-catOrd.indexOf(b.category);
          return ci!==0?dir*ci:String(a.name||'').localeCompare(String(b.name||''),'de');
        }
        if(col==='rank'){
          const d=(toInt(a.rank,0)-toInt(b.rank,0));
          return d!==0?dir*d:String(a.name||'').localeCompare(String(b.name||''),'de');
        }
        if(col==='bonus'){
          const d=getSkBonus(a)-getSkBonus(b);
          return d!==0?dir*d:String(a.name||'').localeCompare(String(b.name||''),'de');
        }
        if(col==='sp'){
          const d=calcSkCost(a).sp-calcSkCost(b).sp;
          return d!==0?dir*d:String(a.name||'').localeCompare(String(b.name||''),'de');
        }
        if(col==='msp'){
          const d=calcSkCost(a).msp-calcSkCost(b).msp;
          return d!==0?dir*d:String(a.name||'').localeCompare(String(b.name||''),'de');
        }
        return 0;
      });
      renderMain(); save(); break;
    }
    case 'open-sk-menu': openSkMenu(el,el.dataset.id,el.dataset.chron==='1'); break;
    case 'open-sksec-menu': openSkSecMenu(el,el.dataset.id); break;
    case 'move-chr-pw': moveChrPwOrder(el.dataset.kind,el.dataset.id,el.dataset.dir); break;
    case 'move-sk': moveSkillOrder(el.dataset.id,el.dataset.dir,el.dataset.chron==='1'); break;
    case 'del-skill': {const i=S.skills.findIndex(x=>x.id===el.dataset.id);if(i>-1){const sid=S.skills[i].id;logChron(`Fertigkeit entfernt: "${S.skills[i].name}".`);S.skills.splice(i,1);if(UI.skMobExp)delete UI.skMobExp[sid];S.weapons.forEach(w=>{if(w.skillId===sid)w.skillId='';});if(D.skillId===sid)D.skillId=null;syncDiceFromSheet();renderAll();}break;}
    case 'add-sk-section': {const pId=el.dataset.parent||'';S.skillSections.push(makeSkSection(pId));if(pId){const par=S.skillSections.find(s=>s.id===pId);if(par)par.collapsed=false;}renderMain();save();toast(pId?'Neue Untersektion erstellt':'Neue Fertigkeits-Sektion erstellt');break;}
    case 'toggle-sksec-collapse': {const sec=S.skillSections.find(s=>s.id===el.dataset.id);if(sec){sec.collapsed=!sec.collapsed;renderMain();save(false);}break;}
    case 'collapse-all-sk': {const v=el.dataset.val==='1';S.skillSections.forEach(s=>{s.collapsed=v;});renderMain();save(false);break;}
    case 'move-sksec': moveSkSecOrder(el.dataset.id,el.dataset.dir); break;
    case 'ask-del-sksec': UI.confirmDelSkSecId=el.dataset.id; renderMain(); break;
    case 'cancel-del-sksec': UI.confirmDelSkSecId=null; renderMain(); break;
    case 'confirm-del-sksec': {
      const sid=el.dataset.id, delSec=S.skillSections.find(s=>s.id===sid), upPar=delSec?.parentSectionId||''; UI.confirmDelSkSecId=null;
      S.skills.forEach(sk=>{if(sk.sectionId===sid)sk.sectionId=upPar;});
      S.skillSections.forEach(s=>{if(s.parentSectionId===sid)s.parentSectionId=upPar;});
      S.skillSections=S.skillSections.filter(s=>s.id!==sid);
      sanitizeSecHierarchy(S.skillSections);
      renderMain(); save(); toast('Sektion entfernt (Fertigkeiten & Untersektionen wurden behalten)'); break;
    }
    case 'ask-sksec-pull': {const sec=S.skillSections.find(s=>s.id===el.dataset.id);UI.confirmSkSecPullId=el.dataset.id;renderMain();if(sec&&sec.filterAttr){const lbl=sec.filterAttr.startsWith('cat:')?SK_CATS[sec.filterAttr.slice(4)]?.l:sec.filterAttr;toast(`⚠️ Sicherheitsabfrage (1/2): Alle Fertigkeiten mit „${lbl}“ hierher verschieben? Bitte (2/2) bestätigen.`);}break;}
    case 'cancel-sksec-pull': UI.confirmSkSecPullId=null; renderMain(); break;
    case 'confirm-sksec-pull': {
      const sec=S.skillSections.find(s=>s.id===el.dataset.id); UI.confirmSkSecPullId=null;
      if(sec&&sec.filterAttr){
        const isCat=sec.filterAttr.startsWith('cat:'), target=isCat?sec.filterAttr.slice(4):sec.filterAttr;
        S.skills.forEach(sk=>{if(isCat?(sk.category===target):(sk.linkedAttr===target)) sk.sectionId=sec.id;});
        const inSec=S.skills.filter(sk=>sk.sectionId===sec.id).sort((a,b)=>String(a.name||'').localeCompare(String(b.name||''),'de'));
        const outSec=S.skills.filter(sk=>sk.sectionId!==sec.id);
        S.skills=[...inSec,...outSec];
        sec.collapsed=false;
        renderMain(); save(); toast('Passende Fertigkeiten gesammelt & A–Z sortiert!');
      }
      break;
    }
    case 'sort-sksec-az': {
      const sec=S.skillSections.find(s=>s.id===el.dataset.id);
      if(sec){
        const inSec=S.skills.filter(sk=>sk.sectionId===sec.id).sort((a,b)=>String(a.name||'').localeCompare(String(b.name||''),'de'));
        const outSec=S.skills.filter(sk=>sk.sectionId!==sec.id);
        S.skills=[...inSec,...outSec];
        renderMain(); save(); toast(`Sektion „${sec.name}“ A–Z sortiert`);
      }
      break;
    }
    case 'add-sk-in-sec': {
      const secId=el.dataset.sec||'', auto=calcAutoSkCost('fundamental',1);
      const nSk={id:uid(),name:'Neue Fertigkeit',color:'',bgColor:'',linkedAttr:'PR',category:'fundamental',rank:1,bonusOvr:'',sectionId:secId,manualCost:false,customSp:auto.sp,customMsp:auto.msp,notes:''};
      S.skills.push(nSk);
      const sec=S.skillSections.find(s=>s.id===secId); if(sec) sec.collapsed=false;
      logChron('Neue Fertigkeit in Sektion angelegt.');
      renderAll(); break;
    }
    case 'open-pw-card-menu': openPwCardMenu(el,el.dataset.kind,el.dataset.id); break;
    case 'open-pw-sec-menu': openPwSecMenu(el,el.dataset.id); break;
    case 'add-pw-section': {const pId=el.dataset.parent||'';S.powerSections.push(makeSection(pId));if(pId){const par=S.powerSections.find(s=>s.id===pId);if(par)par.collapsed=false;}renderMain();save();toast(pId?'Neue Untersektion erstellt':'Neue Sektion erstellt');break;}
    case 'toggle-sec-collapse': {const sec=S.powerSections.find(s=>s.id===el.dataset.id);if(sec){sec.collapsed=!sec.collapsed;renderMain();save(false);}break;}
    case 'move-sec': movePwSecOrder(el.dataset.id,el.dataset.dir); break;
    case 'ask-del-sec': UI.confirmDelSecId=el.dataset.id; renderMain(); break;
    case 'cancel-del-sec': UI.confirmDelSecId=null; renderMain(); break;
    case 'confirm-del-sec': {
      const sid=el.dataset.id, delSec=S.powerSections.find(s=>s.id===sid), upPar=delSec?.parentSectionId||''; UI.confirmDelSecId=null;
      S.powers.forEach(p=>{if(p.sectionId===sid)p.sectionId=upPar;});
      S.augments.forEach(a=>{if(!a.parentPowerId&&a.sectionId===sid)a.sectionId=upPar;});
      S.powerSections.forEach(s=>{if(s.parentSectionId===sid)s.parentSectionId=upPar;});
      S.powerSections=S.powerSections.filter(s=>s.id!==sid);
      sanitizeSecHierarchy(S.powerSections);
      renderMain(); save(); toast('Sektion entfernt (Kräfte, freie Augmente & Untersektionen wurden behalten)'); break;
    }
    case 'ask-sec-pull': {const sec=S.powerSections.find(s=>s.id===el.dataset.id);UI.confirmSecPullId=el.dataset.id;renderMain();if(sec&&sec.filterArt)toast(`⚠️ Sicherheitsabfrage (1/2): Alle Kräfte & freien Augmente mit „${sec.filterArt}“ hierher verschieben? Bitte (2/2) bestätigen.`);break;}
    case 'cancel-sec-pull': UI.confirmSecPullId=null; renderMain(); break;
    case 'confirm-sec-pull': {
      const sec=S.powerSections.find(s=>s.id===el.dataset.id); UI.confirmSecPullId=null;
      if(sec&&sec.filterArt){
        const targetArt=sec.filterArt.toLowerCase();
        S.powers.forEach(p=>{if(String(p.art||'').trim().toLowerCase()===targetArt) p.sectionId=sec.id;});
        S.augments.forEach(a=>{if(!a.parentPowerId&&String(a.art||'').trim().toLowerCase()===targetArt) a.sectionId=sec.id;});
        const inSec=S.powers.filter(p=>p.sectionId===sec.id).sort((a,b)=>String(a.name||'').localeCompare(String(b.name||''),'de'));
        const outSec=S.powers.filter(p=>p.sectionId!==sec.id);
        S.powers=[...inSec,...outSec];
        inSec.forEach(p=>{
          const idxs=[], linked=[];
          S.augments.forEach((a,i)=>{if(a.parentPowerId===p.id){idxs.push(i);linked.push(a);}});
          linked.sort((a,b)=>String(a.name||'').localeCompare(String(b.name||''),'de'));
          idxs.forEach((pos,k)=>{S.augments[pos]=linked[k];});
        });
        const augIdxs=[], secFreeAugs=[];
        S.augments.forEach((a,i)=>{if(!a.parentPowerId&&a.sectionId===sec.id){augIdxs.push(i);secFreeAugs.push(a);}});
        secFreeAugs.sort((a,b)=>String(a.name||'').localeCompare(String(b.name||''),'de'));
        augIdxs.forEach((pos,k)=>{S.augments[pos]=secFreeAugs[k];});
        sec.collapsed=false;
        renderMain(); save(); toast(`Alle Kräfte & freien Augmente der Art „${sec.filterArt}“ gesammelt & A–Z sortiert!`);
      }
      break;
    }
    case 'sort-sec-az': {
      const sec=S.powerSections.find(s=>s.id===el.dataset.id);
      if(sec){
        const inSec=S.powers.filter(p=>p.sectionId===sec.id).sort((a,b)=>String(a.name||'').localeCompare(String(b.name||''),'de'));
        const outSec=S.powers.filter(p=>p.sectionId!==sec.id);
        S.powers=[...inSec,...outSec];
        inSec.forEach(p=>{
          const idxs=[], linked=[];
          S.augments.forEach((a,i)=>{if(a.parentPowerId===p.id){idxs.push(i);linked.push(a);}});
          linked.sort((a,b)=>String(a.name||'').localeCompare(String(b.name||''),'de'));
          idxs.forEach((pos,k)=>{S.augments[pos]=linked[k];});
        });
        const augIdxs=[], secFreeAugs=[];
        S.augments.forEach((a,i)=>{if(!a.parentPowerId&&a.sectionId===sec.id){augIdxs.push(i);secFreeAugs.push(a);}});
        secFreeAugs.sort((a,b)=>String(a.name||'').localeCompare(String(b.name||''),'de'));
        augIdxs.forEach((pos,k)=>{S.augments[pos]=secFreeAugs[k];});
        renderMain(); save(); toast(`Sektion „${sec.name}“ A–Z sortiert`);
      }
      break;
    }
    case 'set-pw-mode': setPwMode(el.dataset.mode); break;
    case 'open-pw-quick-edit': {
      const k=el.dataset.kind==='augment'?'augment':'power', id=String(el.dataset.id||''), it=findPwItem(k,id);
      if(it){
        if(!(UI.pwQuickEditIds instanceof Set)) UI.pwQuickEditIds=new Set();
        UI.pwQuickEditIds.add(pwQuickKey(k,id));
        if(it.collapsed){it.collapsed=false;save(false);}
        closePwDropdown(); closeCtxMenu(); renderMain();
      }
      break;
    }
    case 'close-pw-quick-edit': {
      const k=el.dataset.kind==='augment'?'augment':'power', id=String(el.dataset.id||'');
      if(UI.pwQuickEditIds instanceof Set) UI.pwQuickEditIds.delete(pwQuickKey(k,id));
      closePwDropdown(); closeCtxMenu(); renderMain();
      break;
    }
    case 'add-power': {const np=makePower(el.dataset.sec||''); S.powers.push(np); if(UI.pwMode!=='edit'){if(!(UI.pwQuickEditIds instanceof Set))UI.pwQuickEditIds=new Set();UI.pwQuickEditIds.add(pwQuickKey('power',np.id));} logChron('Neue Kraft angelegt.'); renderAll(); break;}
    case 'add-augment': {const secId=getValidPwSecId(el.dataset.sec||''); const na=makeAugment('',secId); S.augments.push(na); if(secId){const sec=S.powerSections.find(s=>s.id===secId);if(sec)sec.collapsed=false;} if(UI.pwMode!=='edit'){if(!(UI.pwQuickEditIds instanceof Set))UI.pwQuickEditIds=new Set();UI.pwQuickEditIds.add(pwQuickKey('augment',na.id));} logChron(secId?'Neues freies Augment in Sektion angelegt.':'Neues freies Augment angelegt.'); renderAll(); break;}
    case 'new-linked-aug': if(getLinkedAugs(el.dataset.pid).length<3){const na=makeAugment(el.dataset.pid); S.augments.push(na); if(UI.pwMode!=='edit'){if(!(UI.pwQuickEditIds instanceof Set))UI.pwQuickEditIds=new Set();UI.pwQuickEditIds.add(pwQuickKey('augment',na.id));} logChron('Neues Augment in Kraft-Slot angelegt.'); renderAll();} break;
    case 'dup-pw': {
      const kind=el.dataset.kind==='augment'?'augment':'power', id=String(el.dataset.id||''), it=findPwItem(kind,id);
      if(!it) break;
      const copy=clone(it);
      copy.id=uid();
      copy.templateId='';
      copy.collapsed=false;
      copy.showManual=false;
      copy.reserved=false;
      copy.reservedCosts=[];
      if(String(it.name||'').trim()) copy.name=makeUniquePwName(it.name);
      else copy.name='';
      let slotFullNotice=false;
      withPoolSync(()=>{
        if(kind==='power'){
          const origIdx=S.powers.indexOf(it);
          if(origIdx>=0) S.powers.splice(origIdx+1,0,copy);
          else S.powers.push(copy);
        }else{
          if(copy.parentPowerId&&getLinkedAugs(copy.parentPowerId).length>=3){
            const parPw=S.powers.find(p=>p.id===copy.parentPowerId);
            copy.sectionId=getValidPwSecId(parPw?.sectionId);
            copy.parentPowerId='';
            slotFullNotice=true;
          }
          const origIdx=S.augments.indexOf(it);
          if(origIdx>=0) S.augments.splice(origIdx+1,0,copy);
          else S.augments.push(copy);
        }
      });
      invalidateModsCache();
      logChron(`${kind==='augment'?'Augment':'Kraft'} dupliziert${copy.name?`: "${copy.name}"`:''}${slotFullNotice?' (als freies Augment, da 3/3 Slots belegt)':''}.`);
      save();
      renderHeader();
      renderMain();
      syncDiceFromSheet();
      if(D.open) renderDice();
      if(slotFullNotice){
        toast(`📋 Augment „${copy.name||'Unbenanntes Augment'}“ als freies Augment dupliziert (3/3 Slots belegt).`,4500);
      }else{
        toast(`📋 ${kind==='augment'?'Augment':'Kraft'} dupliziert${copy.name?`: „${copy.name}“`:''}`);
      }
      break;
    }
    case 'unlink-aug': {const ag=S.augments.find(a=>a.id===el.dataset.id);if(ag){unlinkAugFromPower(ag);renderMain();save();toast('Augment aus Slot gelöst');}break;}
    case 'toggle-pw-collapse': {const it=findPwItem(el.dataset.kind,el.dataset.id);if(it){it.collapsed=!it.collapsed;renderMain();save(false);}break;}
    case 'toggle-pw-filter': UI.pwFilterOpen=!UI.pwFilterOpen; renderMain(); break;
    case 'toggle-pw-filter-mode': UI.pwFilterMode=UI.pwFilterMode==='and'?'or':'and'; renderMain(); break;
    case 'toggle-pw-filter-linked': UI.pwFilterIncludeLinkedAugs=!UI.pwFilterIncludeLinkedAugs; renderMain(); break;
    case 'toggle-pw-filter-opt': {
      const fk=el.dataset.fkind, fv=String(el.dataset.fval||'');
      const arrKey=fk==='type'?'pwFilterTypes':fk==='art'?'pwFilterArts':fk==='asub'?'pwFilterActionSubs':fk==='tier'?'pwFilterTiers':'pwFilterTags';
      if(!Array.isArray(UI[arrKey])) UI[arrKey]=[];
      const idx=UI[arrKey].indexOf(fv);
      if(idx>=0) UI[arrKey].splice(idx,1);
      else if(fv) UI[arrKey].push(fv);
      renderMain();
      break;
    }
    case 'reset-pw-filter': UI.pwFilterTypes=[]; UI.pwFilterArts=[]; UI.pwFilterActionSubs=[]; UI.pwFilterTiers=[]; UI.pwFilterTags=[]; renderMain(); toast('Kräfte-Filter zurückgesetzt'); break;
    case 'collapse-all-pw': {const v=el.dataset.val==='1';[...S.powers,...S.augments,...S.powerSections].forEach(it=>{it.collapsed=v;});renderMain();save(false);break;}
    case 'ask-del-pw': UI.confirmDelId=el.dataset.id; renderMain(); break;
    case 'cancel-del-pw': UI.confirmDelId=null; renderMain(); break;
    case 'confirm-del-pw': {
      const id=el.dataset.id, isAug=el.dataset.kind==='augment'; UI.confirmDelId=null;
      if(UI.pwQuickEditIds instanceof Set) UI.pwQuickEditIds.delete(pwQuickKey(isAug?'augment':'power',id));
      withPoolSync(()=>{
        if(isAug){const a=S.augments.find(x=>x.id===id);S.augments=S.augments.filter(x=>x.id!==id);logChron(`Augment gelöscht${a?.name?`: "${a.name}"`:''}.`);}
        else{const p=S.powers.find(x=>x.id===id);const inheritedSec=getValidPwSecId(p?.sectionId);S.augments.forEach(a=>{if(a.parentPowerId===id){a.parentPowerId='';a.sectionId=inheritedSec;}});S.powers=S.powers.filter(x=>x.id!==id);logChron(`Kraft gelöscht${p?.name?`: "${p.name}"`:''}.`);}
      });
      syncDiceFromSheet(); renderAll(); toast('Eintrag gelöscht'); break;
    }
    case 'move-pw': movePwOrder(el.dataset.id,el.dataset.dir); break;
    case 'move-aug': moveAugOrder(el.dataset.id,el.dataset.dir); break;
    case 'toggle-pw-man': {const k=el.dataset.kind==='augment'?'augment':'power', it=findPwItem(k,el.dataset.id);if(it){it.showManual=!it.showManual;if(it.showManual&&UI.pwMode!=='edit'){if(!(UI.pwQuickEditIds instanceof Set))UI.pwQuickEditIds=new Set();UI.pwQuickEditIds.add(pwQuickKey(k,it.id));it.collapsed=false;}renderMain();save(false);}break;}
    case 'gift-pw': {
      const it=findPwItem(el.dataset.kind,el.dataset.id);
      if(it){
        const c=calcPwCost(it), isGifted=it.manualCost&&c.sp===0&&c.msp===0;
        if(isGifted){
          const d=PW_TIERS[it.tier]||PW_TIERS.marginal;
          it.manualCost=false;it.sp=d.sp;it.msp=d.msp;
          renderAll();toast('Standardkosten wiederhergestellt');
        }else{
          it.manualCost=true;it.sp=0;it.msp=0;
          renderAll();toast('Auf 0 SP (Geschenkt) gesetzt');
        }
      }
      break;
    }
    case 'toggle-pw-dd': {
      const k=String(el.dataset.ddkey||'');
      UI.openPwMenu=(UI.openPwMenu===k)?'':k;
      hideTooltip();
      renderMain();
      break;
    }
    case 'set-pw-main-art': {
      const it=findPwItem(el.dataset.kind,el.dataset.id);
      if(it){
        const rawV=String(el.dataset.val||'').trim();
        it.art=rawV?findMainArt(rawV):'';
        it.artManual=false;
        UI.openPwMenu='';
        hideTooltip();
        save(); renderMain();
      }
      break;
    }
    case 'toggle-pw-asub': {
      const it=findPwItem(el.dataset.kind,el.dataset.id);
      const asub=findActionSub(el.dataset.val);
      if(it&&asub){
        const cur=new Set(Array.isArray(it.actionSubs)?it.actionSubs:[]);
        if(cur.has(asub)) cur.delete(asub);
        else cur.add(asub);
        it.actionSubs=DEF_ACTION_SUBS.filter(a=>cur.has(a));
        hideTooltip();
        save(); renderMain();
      }
      break;
    }
    case 'rm-pw-tag': {
      const it=findPwItem(el.dataset.kind,el.dataset.id);
      if(it){
        it.tags=(Array.isArray(it.tags)?it.tags:[]).filter(t=>t!==el.dataset.val);
        save(); renderMain();
      }
      break;
    }
    case 'add-custom-pw-tag': {
      addCustomPwTagFromInput(el.dataset.kind,el.dataset.id);
      break;
    }
    case 'set-pw-bld-mode': {
      const it=findPwItem(el.dataset.kind,el.dataset.id);
      if(it){
        const rawM=el.dataset.mode;
        const mode=rawM==='skill'?'skill':(rawM==='dyn'?'dyn':(rawM==='stat'?'stat':(it.bldMode==='skill'?'stat':'skill')));
        if(it.bldMode!==mode){
          it.bldMode=mode;
          if(mode==='skill'){
            const named=(S.skills||[]).filter(s=>s&&String(s.name||'').trim()).sort((a,b)=>String(a.name).trim().localeCompare(String(b.name).trim(),'de'));
            if(!it.bldSkId||!named.some(s=>s.id===it.bldSkId)) it.bldSkId=named[0]?.id||'';
            if(!String(it.bldSkCnt||'').replace(/\D/g,'').replace(/^0+/,'')) it.bldSkCnt='1';
            if(it.bldSkKind!=='dis') it.bldSkKind='adv';
          }else if(mode==='dyn'){
            if(!String(it.bldDynVar||'').trim()) it.bldDynVar='WA';
            if(it.bldDynFactor===undefined||it.bldDynFactor===null) it.bldDynFactor='/2';
            if(!['','floor','ceil','round'].includes(it.bldDynRound)) it.bldDynRound='';
            if(!['desc','effects','rules'].includes(it.bldDynTarget)) it.bldDynTarget='desc';
          }
          renderMain(); save();
        }
      }
      break;
    }
    case 'ins-token': {const it=findPwItem(el.dataset.kind,el.dataset.id);if(it){const tok=getPwBuilderToken(it);if(tok)insertTokenAtCursor(el.dataset.kind,el.dataset.id,tok);}break;}
    case 'rm-token': {
      const it=findPwItem(el.dataset.kind,el.dataset.id);
      if(it){
        const tks=getAllParsedEffectChips(it.effects),tk=tks[+el.dataset.tidx];
        if(tk){
          withPoolSync(()=>{
            const prev=String(it.effects||'');
            let nx=prev.replace(tk.raw,'');
            if(nx===prev) nx=prev.replace(esc(tk.raw),'');
            if(nx===prev){
              const flexRe=new RegExp(tk.raw.split(/(\s+)/).map(p=>/^\s+$/.test(p)?'(?:\\s|<[^>]+>|&nbsp;)+':escReStr(p)).join('(?:<[^>]+>)*'));
              nx=prev.replace(flexRe,'');
            }
            it.effects=nx.replace(/\s{2,}/g,' ').trim();
          });
          syncDiceFromSheet();renderMain();renderHeader();if(D.open)renderDice();save();
        }
      }
      break;
    }
    case 'toggle-apply-mods': {const it=findPwItem(el.dataset.kind,el.dataset.id);if(it){withPoolSync(()=>{it.applyMods=!it.applyMods;});syncDiceFromSheet();renderAll();toast(it.applyMods?'Effekt-Bausteine auf Charakterbogen aktiv!':'Effekt-Bausteine deaktiviert');}break;}
    case 'spend-pw': spendResource(el.dataset.kind,el.dataset.id); break;
    case 'toggle-reserve-pw': {
      const kind=el.dataset.kind==='augment'?'augment':'power', it=findPwItem(kind,el.dataset.id);
      if(!it) break;
      const nm=String(it.name||'').trim()||(kind==='augment'?'Augment':'Kraft');
      if(!it.reserved){
        const costs=getReservablePwCosts(it);
        if(!costs.length){
          toast('⚠️ Bitte zuerst AP, mAP, LP oder mLP als Einsatzkosten eintragen.');
          break;
        }
        costs.forEach(c=>{
          if(c.res==='ap') S.secondary.apCurrent=toInt(S.secondary.apCurrent)-c.amt;
          else if(c.res==='map') S.secondary.mapCurrent=toInt(S.secondary.mapCurrent)-c.amt;
          else if(c.res==='lp') S.secondary.lpCurrent=toInt(S.secondary.lpCurrent)-c.amt;
          else if(c.res==='mlp') S.secondary.mlpCurrent=toInt(S.secondary.mlpCurrent)-c.amt;
          else if(c.res==='cres') S.customRes.current=toInt(S.customRes.current)-c.amt;
          else if(String(c.res||'').startsWith('ex_')){
            const ex=(S.extraSecList||[]).find(x=>'ex_'+x.id===c.res);
            if(ex) ex.current=toInt(ex.current)-c.amt;
          }
        });
        it.reserved=true;
        it.reservedCosts=clone(costs);
        const resTxt=costs.map(c=>`${c.amt} ${getResLabel(c.res)}`).join(' + ');
        logChron(`🔒 Reserviert (${kind==='augment'?'Augment':'Kraft'}): ${nm} (${resTxt}).`);
        save(); renderHeader(); renderMain();
        toast(`🔒 Reserviert: ${nm} (${resTxt})`);
      }else{
        const prevCosts=(Array.isArray(it.reservedCosts)&&it.reservedCosts.length)?it.reservedCosts:getReservablePwCosts(it);
        const resTxt=prevCosts.map(c=>`${c.amt} ${getResLabel(c.res)}`).join(' + ');
        it.reserved=false;
        it.reservedCosts=[];
        logChron(`🔓 Reservierung aufgehoben (${kind==='augment'?'Augment':'Kraft'}): ${nm}${resTxt?` (${resTxt})`:''} – verbrauchte Kosten nicht wiederhergestellt.`);
        save(); renderHeader(); renderMain();
        toast('🔓 Reservierung aufgehoben (verbrauchte Kosten werden nicht wiederhergestellt).');
      }
      break;
    }
    case 'rm-pw-ucost': {
      const it=findPwItem(el.dataset.kind,el.dataset.id), idx=toInt(el.dataset.cidx,-1);
      if(it){
        if(!Array.isArray(it.useCosts)) syncPwUseCostsLegacy(it);
        if(idx>=0&&idx<it.useCosts.length){
          it.useCosts.splice(idx,1);
          syncPwUseCostsLegacy(it);
          renderMain(); save();
        }
      }
      break;
    }
    case 'toggle-eqsec-collapse': {if(!S.equipSecMeta)S.equipSecMeta=makeEqSecMeta();const m=S.equipSecMeta[el.dataset.sec];if(m){m.collapsed=!m.collapsed;renderMain();save(false);}break;}
    case 'move-eqsec': moveEqSecOrder(el.dataset.sec,el.dataset.dir); break;
    case 'toggle-eqitem-collapse': {const it=findEqItem(el.dataset.kind,el.dataset.id);if(it){it.collapsed=!it.collapsed;renderMain();save(false);}break;}
    case 'collapse-all-eq': {
      const v=el.dataset.val==='1';
      if(!S.equipSecMeta) S.equipSecMeta=makeEqSecMeta();
      if(!v){DEF_EQ_SEC_ORDER.forEach(k=>{if(S.equipSecMeta[k])S.equipSecMeta[k].collapsed=false;});}
      [...S.weapons,...S.ammos,...S.armors,...(S.invSections||[]),...S.inventory].forEach(it=>{if(it)it.collapsed=v;});
      renderMain(); save(false); break;
    }
    case 'toggle-t5-sec': {
      const sec=String(el.dataset.sec||'');
      if(!UI.tab5) UI.tab5={equipNotes:null,bioSec:false,bioGallery:null,bioFields:{}};
      if(sec==='equipNotes') UI.tab5.equipNotes=!isTab5EquipNotesCollapsed();
      else if(sec==='bioSec') UI.tab5.bioSec=!UI.tab5.bioSec;
      else if(sec==='bioGallery') UI.tab5.bioGallery=!isTab5BioGalleryCollapsed();
      renderMain(); break;
    }
    case 'toggle-t5-bio': {
      const k=String(el.dataset.biok||'');
      if(!k) break;
      if(!UI.tab5) UI.tab5={equipNotes:null,bioSec:false,bioGallery:null,bioFields:{}};
      if(!UI.tab5.bioFields) UI.tab5.bioFields={};
      UI.tab5.bioFields[k]=!isTab5BioFieldCollapsed(k);
      renderMain(); break;
    }
    case 'collapse-all-bio': {
      const v=el.dataset.val==='1';
      if(!UI.tab5) UI.tab5={equipNotes:null,bioSec:false,bioGallery:null,bioFields:{}};
      UI.tab5.bioGallery=v;
      if(!UI.tab5.bioFields) UI.tab5.bioFields={};
      BIO_FIELDS.forEach(b=>{UI.tab5.bioFields[b.k]=v;});
      renderMain(); break;
    }
    case 'open-eq-item-menu': openEqItemMenu(el,el.dataset.kind,el.dataset.id); break;
    case 'open-eq-sec-menu': openEqSecMenu(el,el.dataset.sec); break;
    case 'open-invsec-menu': openInvSecMenu(el,el.dataset.id); break;
    case 'open-add-weapon-menu': openAddWeaponMenu(el,el.dataset.ddkey||'top',el.dataset.align==='right'); break;
    case 'open-eq-tag-picker': openEqTagPicker(el,el.dataset.kind,el.dataset.id); break;
    case 'open-wp-type-picker': openWpTypePicker(el,el.dataset.id); break;
    case 'open-wp-attr-picker': openWpAttrPicker(el,el.dataset.id); break;
    case 'open-wp-skill-picker': openWpSkillPicker(el,el.dataset.id); break;
    case 'open-wp-ammo-picker': openWpAmmoPicker(el,el.dataset.id); break;
    case 'open-ar-zone-picker': openArZonePicker(el,el.dataset.id); break;
    case 'open-inv-sec-picker': openInvSecPicker(el,el.dataset.id); break;
    case 'open-invsec-parent-picker': openInvSecParentPicker(el,el.dataset.id); break;
    case 'move-eqitem': moveEqItemOrder(el.dataset.kind,el.dataset.id,el.dataset.dir); break;
    case 'add-weapon': S.weapons.push(makeWeapon(el.dataset.wtype||WEAPON_SUBTYPES[0].key)); if(S.equipSecMeta?.weapons)S.equipSecMeta.weapons.collapsed=false; UI.openPwMenu=''; hideTooltip(); renderMain(); save(); break;
    case 'del-weapon': S.weapons=S.weapons.filter(w=>w.id!==el.dataset.id); if(D.weaponId===el.dataset.id){D.weaponId=null;D.wRollCat='Normaler Test';D.sitActive={};applyDiceAutoAdvDis(true);if(D.open)renderDice();} renderMain(); save(); break;
    case 'add-weapon-dmg': {
      const w=S.weapons.find(x=>x.id===el.dataset.id);
      if(w){if(!Array.isArray(w.customDmg))w.customDmg=[];const entry={id:uid(),label:'',val:'0'};w.customDmg.push(entry);renderMain();save();setTimeout(()=>{document.querySelector(`input[data-eqcv="weapon:${w.id}:${entry.id}:label"]`)?.focus();},0);}
      break;
    }
    case 'del-weapon-dmg': {
      const w=S.weapons.find(x=>x.id===el.dataset.id);
      if(w&&Array.isArray(w.customDmg)){w.customDmg=w.customDmg.filter(c=>c.id!==el.dataset.cvid);renderMain();save();}
      break;
    }
    case 'add-ammo-dmg': {
      const am=S.ammos.find(x=>x.id===el.dataset.id);
      if(am){if(!Array.isArray(am.customDmg))am.customDmg=[];const entry={id:uid(),label:'',val:'0'};am.customDmg.push(entry);renderMain();save();setTimeout(()=>{document.querySelector(`input[data-eqcv="ammo:${am.id}:${entry.id}:label"]`)?.focus();},0);}
      break;
    }
    case 'del-ammo-dmg': {
      const am=S.ammos.find(x=>x.id===el.dataset.id);
      if(am&&Array.isArray(am.customDmg)){am.customDmg=am.customDmg.filter(c=>c.id!==el.dataset.cvid);renderMain();save();}
      break;
    }
    case 'add-armor-prot': {
      const ar=S.armors.find(x=>x.id===el.dataset.id);
      if(ar){if(!Array.isArray(ar.customProt))ar.customProt=[];const entry={id:uid(),label:'',val:'0'};ar.customProt.push(entry);renderMain();save();setTimeout(()=>{document.querySelector(`input[data-eqcv="armor:${ar.id}:${entry.id}:label"]`)?.focus();},0);}
      break;
    }
    case 'del-armor-prot': {
      const ar=S.armors.find(x=>x.id===el.dataset.id);
      if(ar&&Array.isArray(ar.customProt)){ar.customProt=ar.customProt.filter(c=>c.id!==el.dataset.cvid);renderMain();save();}
      break;
    }
    case 'add-ammo': {
      const na=makeAmmo(`Munition #${S.ammos.length+1}`,20);
      S.ammos.push(na);
      if(S.equipSecMeta?.ammos) S.equipSecMeta.ammos.collapsed=false;
      renderMain(); if(UI.modal==='ammoList') renderModal(); save(); break;
    }
    case 'quick-new-ammo': {
      const na=makeAmmo(`Munition #${S.ammos.length+1}`,20);
      S.ammos.push(na);
      const w=S.weapons.find(x=>x.id===el.dataset.wid);
      if(w) w.ammoId=na.id;
      if(S.equipSecMeta?.ammos) S.equipSecMeta.ammos.collapsed=false;
      invalidateModsCache(); syncDiceFromSheet();
      renderMain(); if(D.open) renderDice(); save(); toast('Neue Munition erstellt & verknüpft'); break;
    }
    case 'open-ammo-modal': UI.ammoModalWeaponId=el.dataset.wid||''; UI.modal='ammoList'; renderModal(); break;
    case 'select-ammo-for-wp': {
      const w=S.weapons.find(x=>x.id===el.dataset.wid);
      if(w){w.ammoId=el.dataset.aid;invalidateModsCache();syncDiceFromSheet();renderMain();renderModal();if(D.open)renderDice();save();toast('Munition zugeordnet');}
      break;
    }
    case 'del-ammo': {const aid=el.dataset.id; S.ammos=S.ammos.filter(a=>a.id!==aid); S.weapons.forEach(w=>{if(w.ammoId===aid)w.ammoId='';}); invalidateModsCache(); syncDiceFromSheet(); renderMain(); if(UI.modal==='ammoList') renderModal(); if(D.open) renderDice(); save(); break;}
    case 'ammo-step': {const am=S.ammos.find(a=>a.id===el.dataset.id);if(am){am.qty=Math.max(0,toInt(am.qty,0)+Number(el.dataset.delta));syncLinkedAmmoDOM(am.id);save();}break;}
    case 'add-armor': S.armors.push(makeArmor()); if(S.equipSecMeta?.armors)S.equipSecMeta.armors.collapsed=false; renderMain(); save(); break;
    case 'del-armor': S.armors=S.armors.filter(a=>a.id!==el.dataset.id); if(UI.arZoneDrafts) delete UI.arZoneDrafts[el.dataset.id]; invalidateModsCache(); syncDiceFromSheet(); renderMain(); if(D.open) renderDice(); save(); break;
    case 'set-wp-grip': {
      const w=S.weapons.find(x=>x.id===el.dataset.id), g=el.dataset.grip;
      if(w&&(g==='1h'||g==='2h')){
        w.grip=w.grip===g?'':g;
        invalidateModsCache(); syncDiceFromSheet();
        renderMain(); if(D.open) renderDice(); save();
      }
      break;
    }
    case 'toggle-ar-zone': {
      const ar=S.armors.find(a=>a.id===el.dataset.id), zn=String(el.dataset.zone||'').trim();
      if(ar&&zn){
        if(!Array.isArray(ar.zones)) ar.zones=[];
        const idx=ar.zones.findIndex(z=>z.toLowerCase()===zn.toLowerCase());
        if(idx>-1) ar.zones.splice(idx,1);
        else ar.zones.push(zn);
        renderMain(); save();
      }
      break;
    }
    case 'add-ar-zone': {
      const ar=S.armors.find(a=>a.id===el.dataset.id);
      if(ar){
        const raw=String($(`inpArCz_${ar.id}`)?.value??UI.arZoneDrafts?.[ar.id]??'').trim();
        const parts=raw.split(/[,;]+/).map(s=>s.trim()).filter(Boolean);
        if(!parts.length){toast('Bitte zuerst eine Trefferzone unter „Weitere Zonen...“ eintragen.');break;}
        if(!Array.isArray(ar.extraZones)) ar.extraZones=[];
        if(!Array.isArray(ar.zones)) ar.zones=[];
        const hzNames=S.hitZones.map(z=>String(z.zone||'').trim()).filter(Boolean);
        parts.forEach(p=>{
          const hzMatch=hzNames.find(h=>h.toLowerCase()===p.toLowerCase());
          const canon=hzMatch||ar.extraZones.find(e=>e.toLowerCase()===p.toLowerCase())||p;
          if(!hzMatch&&!ar.extraZones.some(e=>e.toLowerCase()===canon.toLowerCase())) ar.extraZones.push(canon);
          if(!ar.zones.some(z=>z.toLowerCase()===canon.toLowerCase())) ar.zones.push(canon);
        });
        if(!UI.arZoneDrafts) UI.arZoneDrafts={};
        UI.arZoneDrafts[ar.id]='';
        delete ar.customZones;
        renderMain(); save();
      }
      break;
    }
    case 'del-ar-zone': {
      const ar=S.armors.find(a=>a.id===el.dataset.id), zn=String(el.dataset.zone||'').trim();
      if(ar&&zn){
        const low=zn.toLowerCase();
        if(Array.isArray(ar.extraZones)) ar.extraZones=ar.extraZones.filter(z=>z.toLowerCase()!==low);
        if(Array.isArray(ar.zones)) ar.zones=ar.zones.filter(z=>z.toLowerCase()!==low);
        renderMain(); save();
      }
      break;
    }
    case 'toggle-ar-eq': {
      const ar=S.armors.find(a=>a.id===el.dataset.id);
      if(ar){ar.equipped=ar.equipped===false?true:false;invalidateModsCache();syncDiceFromSheet();renderMain();if(D.open)renderDice();save();}
      break;
    }
    case 'rm-eq-tag': {
      const k={weapon:'weapons',armor:'armors',ammo:'ammos'}[el.dataset.kind], it=(S[k]||[]).find(x=>x.id===el.dataset.id);
      if(it&&Array.isArray(it.tags)){it.tags.splice(+el.dataset.tidx,1);invalidateModsCache();syncDiceFromSheet();renderMain();if(D.open)renderDice();save();}
      break;
    }
    case 'pick-item-img': openImgMenu(el.dataset.kind,el.dataset.id); break;
    case 'pick-bio-img': openImgMenu('bio',el.dataset.id||''); break;
    case 'rtf-cmd': if(Date.now()-RTF_STATE.lastRtfTouchCmdAt<450) break; applyRtfCommand(el.dataset.cmd,'',el); break;
    case 'add-inv': {
      const secId=el.dataset.sec||'';
      S.inventory.push(makeInvItem(secId));
      if(S.equipSecMeta?.inventory) S.equipSecMeta.inventory.collapsed=false;
      if(secId){const sec=(S.invSections||[]).find(s=>s.id===secId);if(sec)sec.collapsed=false;}
      renderMain(); save(); break;
    }
    case 'del-inv': S.inventory=S.inventory.filter(i=>i.id!==el.dataset.id); renderMain(); save(); break;
    case 'add-inv-section': {
      if(!Array.isArray(S.invSections)) S.invSections=[];
      const pId=el.dataset.parent||'';
      S.invSections.push(makeInvSection(pId));
      if(S.equipSecMeta?.inventory) S.equipSecMeta.inventory.collapsed=false;
      if(pId){const par=S.invSections.find(s=>s.id===pId);if(par)par.collapsed=false;}
      renderMain(); save(); toast(pId?'Neuer Unterordner erstellt':'Neuer Beutel / Sektion erstellt'); break;
    }
    case 'toggle-invsec-collapse': {
      const sec=(S.invSections||[]).find(s=>s.id===el.dataset.id);
      if(sec){sec.collapsed=!sec.collapsed;renderMain();save(false);}
      break;
    }
    case 'collapse-all-inv': {
      const v=el.dataset.val==='1';
      (S.invSections||[]).forEach(s=>{s.collapsed=v;});
      renderMain(); save(false); break;
    }
    case 'move-invsec': moveInvSecOrder(el.dataset.id,el.dataset.dir); break;
    case 'sort-invsec-az': {
      const sec=(S.invSections||[]).find(s=>s.id===el.dataset.id);
      if(sec){
        const indices=[], inSec=[];
        S.inventory.forEach((it,idx)=>{if(it.sectionId===sec.id){indices.push(idx);inSec.push(it);}});
        inSec.sort((a,b)=>String(a.name||'').localeCompare(String(b.name||''),'de'));
        indices.forEach((pos,k)=>{S.inventory[pos]=inSec[k];});
        renderMain(); save(); toast(`Beutel „${sec.name||'Beutel'}“ A–Z sortiert`);
      }
      break;
    }
    case 'ask-del-invsec': UI.confirmDelInvSecId=el.dataset.id; renderMain(); break;
    case 'cancel-del-invsec': UI.confirmDelInvSecId=null; renderMain(); break;
    case 'confirm-del-invsec': {
      const sid=el.dataset.id, delSec=(S.invSections||[]).find(s=>s.id===sid), upPar=delSec?.parentSectionId||''; UI.confirmDelInvSecId=null;
      S.inventory.forEach(it=>{if(it.sectionId===sid)it.sectionId=upPar;});
      (S.invSections||[]).forEach(s=>{if(s.parentSectionId===sid)s.parentSectionId=upPar;});
      S.invSections=(S.invSections||[]).filter(s=>s.id!==sid);
      sanitizeSecHierarchy(S.invSections);
      renderMain(); save(); toast('Beutel entfernt (Gegenstände & Unterordner wurden behalten)'); break;
    }
    case 'lvl-step': S.progression.level=Math.max(1,toInt(S.progression.level,1)+Number(el.dataset.delta)); logChron(`Stufe → ${S.progression.level}.`); renderAll(); break;
    case 'clear-log-ask': UI.confirmLog=true; renderMain(); break;
    case 'clear-log-no': UI.confirmLog=false; renderMain(); break;
    case 'clear-log-yes': S.chronicleLog=[]; UI.confirmLog=false; renderAll(); break;
    case 'toggle-mobile-hdr': UI.mobileHdrOpen=!UI.mobileHdrOpen; renderHeader(); break;
    case 'toggle-mobile-lobby-menu':
    case 'open-lobby-ctx-menu': openLobbyCtxMenu(el); break;
    case 'open-sheet-ctx-menu': openSheetCtxMenu(el); break;
    case 'toggle-dice': D.open=!D.open; if(D.open) ensureLobbyNeutralDiceOnOpen(); renderHeader(); renderDice(); renderLiveDice(); break;
    case 'close-dice': D.open=false; renderHeader(); renderDice(); renderLiveDice(); break;
    case 'dock-dice':
    case 'toggle-dock': D.docked=!D.docked; if(D.docked&&D.floating){D.floating=false;saveWinPref('dice');} renderDice(); renderLiveDice(); break;
    case 'toggle-livedice': LD.open=!LD.open; if(LD.open) syncCloudRegistry(false); renderHeader(); renderDice(); renderLiveDice(); break;
    case 'close-livedice': LD.open=false; renderHeader(); renderDice(); renderLiveDice(); break;
    case 'dock-livedice':
    case 'toggle-dock-livedice': LD.docked=!LD.docked; if(LD.docked&&LD.floating){LD.floating=false;saveWinPref('livedice');} renderDice(); renderLiveDice(); break;
    case 'reset-dice': clearOutgoingDuel({notifyCancel:true,silent:true}); resetCombatState(); setD({...DICE_DEF,sitActive:{},oppSitActive:{},open:true,docked:D.docked,floating:D.floating,x:D.x,y:D.y,w:D.w,h:D.h,z:D.z}); if(isLobbyNeutralDice()) resetDiceToLobbyNeutral(); UI.lastRollHtml=''; UI.lastBlockBaseHtml=''; UI.lastBlockFollowRes=null; UI.lastSecretRollId=''; renderDice(); updateLobbyLiveDiceDOM(); break;
    case 'toggle-cnotes': CN.open=!CN.open; CN.confirmDelId=null; renderHeader(); renderCampNotes(); break;
    case 'close-cnotes': CN.open=false; CN.confirmDelId=null; renderHeader(); renderCampNotes(); break;
    case 'dock-cnotes':
    case 'toggle-dock-cnotes': CN.docked=!CN.docked; if(CN.docked&&CN.floating){CN.floating=false;saveWinPref('cnotes');} renderCampNotes(); break;
    case 'toggle-cn-toc':
    case 'toggle-cn-newfolder':
    case 'toggle-cn-newfolder-pub':
    case 'create-cn-folder':
    case 'toggle-cnfolder-collapse':
    case 'toggle-cnfolder-pub':
    case 'move-cnfolder':
    case 'ask-del-cnfolder':
    case 'cancel-del-cnfolder':
    case 'confirm-del-cnfolder':
    case 'add-cn-page':
    case 'sel-cn-page':
    case 'prev-cn-page':
    case 'next-cn-page':
    case 'toggle-cn-public':
    case 'move-cnpage':
    case 'ask-del-cnpage':
    case 'cancel-del-cnpage':
    case 'confirm-del-cnpage':
  if(act==='toggle-cn-toc'){CN.tocOpen=!CN.tocOpen;renderCampNotes();return;}
  if(act==='toggle-cn-newfolder'){CN.newFolderOpen=!CN.newFolderOpen;if(CN.newFolderOpen)CN.tocOpen=true;CN.newFolderName='';renderCampNotes();setTimeout(()=>{const el=$('inpNewCnFolderName');if(el){try{el.focus({preventScroll:true});}catch(_){el.focus();}}},20);return;}
  if(act==='toggle-cn-newfolder-pub'){CN.newFolderPublic=!CN.newFolderPublic;renderCampNotes();return;}
  if(act==='create-cn-folder'){
    ensureCampNotesStructure();
    const rawName=String($('inpNewCnFolderName')?.value||CN.newFolderName||'').trim()||'Neues Kapitel';
    const isPub=Boolean(CN.newFolderPublic);
    const fid='cf_'+uid();
    S.campNoteFolders.push({id:fid,name:rawName,isPublic:isPub,collapsed:false,isSystem:false});
    CN.newFolderOpen=false; CN.newFolderName=''; CN.tocOpen=true;
    save(); renderCampNotes(); toast(`📁 Ordner „${rawName}“ angelegt!`);
    return;
  }
  if(act==='toggle-cnfolder-collapse'){
    ensureCampNotesStructure();
    const f=S.campNoteFolders.find(x=>x.id===btn.dataset.fid);
    if(f){f.collapsed=!f.collapsed;save(false);renderCampNotes();}
    return;
  }
  if(act==='toggle-cnfolder-pub'){
    ensureCampNotesStructure();
    const f=S.campNoteFolders.find(x=>x.id===btn.dataset.fid);
    if(f&&!f.isSystem){
      f.isPublic=!f.isPublic;
      S.campaignNotes.filter(n=>n.folderId===f.id).forEach(n=>{n.isPublic=f.isPublic;n.updatedAt=stamp();});
      syncPublicNotesAfterChange();
      save(); renderCampNotes();
      toast(f.isPublic?`🌐 Ordner „${f.name}“ ist jetzt öffentlich!`:`🔒 Ordner „${f.name}“ ist jetzt privat.`);
    }
    return;
  }
  if(act==='move-cnfolder'){
    ensureCampNotesStructure();
    const curF=S.campNoteFolders.find(x=>x.id===btn.dataset.fid), dir=toInt(btn.dataset.dir,0);
    if(curF&&dir){
      const sameGroup=S.campNoteFolders.filter(x=>Boolean(x.isPublic)===Boolean(curF.isPublic));
      const gIdx=sameGroup.indexOf(curF), tgtF=sameGroup[gIdx+dir];
      if(tgtF){
        const aIdx=S.campNoteFolders.indexOf(curF), bIdx=S.campNoteFolders.indexOf(tgtF);
        S.campNoteFolders[aIdx]=tgtF;
        S.campNoteFolders[bIdx]=curF;
        save(); renderCampNotes();
      }
    }
    return;
  }
  if(act==='ask-del-cnfolder'){CN.confirmDelFolderId=btn.dataset.fid;renderCampNotes();return;}
  if(act==='cancel-del-cnfolder'){CN.confirmDelFolderId=null;renderCampNotes();return;}
  if(act==='confirm-del-cnfolder'){
    ensureCampNotesStructure();
    const fid=btn.dataset.fid, f=S.campNoteFolders.find(x=>x.id===fid);
    if(f&&!f.isSystem){
      const fallbackId=f.isPublic?'cf_public':'cf_private';
      S.campaignNotes.filter(n=>n.folderId===fid).forEach(n=>{n.folderId=fallbackId;});
      S.campNoteFolders=S.campNoteFolders.filter(x=>x.id!==fid);
      CN.confirmDelFolderId=null;
      save(); renderCampNotes(); toast('🗑️ Ordner entfernt (Seiten wurden in den Standard-Ordner verschoben).');
    }
    return;
  }
  if(act==='add-cn-page'){
    ensureCampNotesStructure();
    const isPub=btn.dataset.pub==='1';
    const targetFolderId=btn.dataset.folder||(isPub?'cf_public':'cf_private');
    const folder=S.campNoteFolders.find(f=>f.id===targetFolderId)||(isPub?S.campNoteFolders.find(f=>f.id==='cf_public'):S.campNoteFolders.find(f=>f.id==='cf_private'));
    if(folder) folder.collapsed=false;
    const newPg={
      id:'cn_'+uid(),
      title:isPub?'Öffentliche Notiz':'Neue Notiz',
      content:'',
      isPublic:Boolean(folder?folder.isPublic:isPub),
      folderId:folder?folder.id:(isPub?'cf_public':'cf_private'),
      updatedAt:stamp()
    };
    S.campaignNotes.push(newPg);
    S.activeCampNoteId=newPg.id;
    CN.confirmDelId=null;
    syncPublicNotesAfterChange(newPg);
    save(); renderCampNotes();
    setTimeout(()=>{const el=$('inpCnTitle');if(el){try{el.focus({preventScroll:true});}catch(_){el.focus();}}},20);
    return;
  }
  if(act==='sel-cn-page'){
    S.activeCampNoteId=btn.dataset.id;
    CN.confirmDelId=null;
    save(false); renderCampNotes();
    return;
  }
  if(act==='prev-cn-page'||act==='next-cn-page'){
    ensureCampNotesStructure();
    const ordered=[];
    getOrderedCampNoteFolders().forEach(f=>S.campaignNotes.filter(n=>n.folderId===f.id).forEach(n=>ordered.push(n)));
    const idx=ordered.findIndex(n=>n.id===S.activeCampNoteId);
    const nextIdx=act==='prev-cn-page'?idx-1:idx+1;
    if(nextIdx>=0&&nextIdx<ordered.length){
      S.activeCampNoteId=ordered[nextIdx].id;
      CN.confirmDelId=null;
      save(false); renderCampNotes();
    }
    return;
  }
  if(act==='toggle-cn-public'){
    ensureCampNotesStructure();
    const pg=S.campaignNotes.find(n=>n.id===btn.dataset.id);
    if(pg){
      pg.isPublic=!pg.isPublic;
      const curF=S.campNoteFolders.find(f=>f.id===pg.folderId);
      if(!curF||Boolean(curF.isPublic)!==pg.isPublic){
        pg.folderId=pg.isPublic?'cf_public':'cf_private';
      }
      pg.updatedAt=stamp();
      syncPublicNotesAfterChange(pg);
      save(); renderCampNotes();
      toast(pg.isPublic?'🌐 Seite in „Öffentliche Notizen“ verschoben!':'🔒 Seite in „Private Notizen“ verschoben.');
    }
    return;
  }
  if(act==='move-cnpage'){
    ensureCampNotesStructure();
    const pg=S.campaignNotes.find(n=>n.id===btn.dataset.id);
    if(!pg) return;
    const fPages=S.campaignNotes.filter(n=>n.folderId===pg.folderId);
    const pIdx=fPages.indexOf(pg), dir=toInt(btn.dataset.dir,0), targetPg=fPages[pIdx+dir];
    if(targetPg){
      const aIdx=S.campaignNotes.indexOf(pg), bIdx=S.campaignNotes.indexOf(targetPg);
      S.campaignNotes[aIdx]=targetPg;
      S.campaignNotes[bIdx]=pg;
      syncPublicNotesAfterChange(pg);
      save(); renderCampNotes();
    }
    return;
  }
  if(act==='ask-del-cnpage'){CN.confirmDelId=btn.dataset.id;renderCampNotes();return;}
  if(act==='cancel-del-cnpage'){CN.confirmDelId=null;renderCampNotes();return;}
  if(act==='confirm-del-cnpage'){
    ensureCampNotesStructure();
    const delId=btn.dataset.id;
    if(S.campaignNotes.length<=1) return;
    S.campaignNotes=S.campaignNotes.filter(n=>n.id!==delId);
    if(S.activeCampNoteId===delId) S.activeCampNoteId=S.campaignNotes[0].id;
    CN.confirmDelId=null;
    syncPublicNotesAfterChange(null,delId);
    save(); renderCampNotes(); toast('🗑️ Notizseite gelöscht.');
    return;
  }
    break;
    case 'sync-public-note': flushPendingSave(false); pushToCloud(false,{forceRegistry:true}); break;
    case 'toggle-lobby-pubnotes': CLOUD.publicNotesOpen=!CLOUD.publicNotesOpen; renderMain(); break;
    case 'select-lobby-pubpage': {
      CLOUD.activePublicPageKey=el.dataset.pagekey||'';
      CLOUD.confirmDelCampPageId=null;
      renderMain();
      break;
    }
    case 'add-lobby-camppage': {
      const shared=getCampaignSharedPages(CLOUD.activeCampaignId);
      const newPg={
        id:'cpg_'+uid(),
        title:'Neue Seite',
        content:'',
        updatedAt:stamp(),
        lastEditor:CLOUD.currentUser||'Admin',
        isCampaignNative:true
      };
      shared.push(newPg);
      CLOUD.activePublicPageKey='camp::'+newPg.id;
      CLOUD.confirmDelCampPageId=null;
      saveRegistryLocal();
      renderMain();
      publishLiveCampNote({scope:'camp',campaignId:CLOUD.activeCampaignId,pageId:newPg.id,page:newPg});
      break;
    }
    case 'ask-del-lobby-camppage': {
      CLOUD.confirmDelCampPageId=el.dataset.pageid||null;
      renderMain();
      break;
    }
    case 'cancel-del-lobby-camppage': {
      CLOUD.confirmDelCampPageId=null;
      renderMain();
      break;
    }
    case 'confirm-del-lobby-camppage': {
      const pid=el.dataset.pageid||'';
      if(pid&&pid!=='camp_main'){
        const shared=getCampaignSharedPages(CLOUD.activeCampaignId);
        CLOUD.registry.campaignSharedNotes[CLOUD.activeCampaignId]=shared.filter(p=>p&&p.id!==pid);
        CLOUD.confirmDelCampPageId=null;
        CLOUD.activePublicPageKey='';
        saveRegistryLocal();
        renderMain();
        publishLiveCampNote({scope:'camp',campaignId:CLOUD.activeCampaignId,pageId:pid,deleted:true});
        toast('🗑️ Kampagnenseite gelöscht.');
      }
      break;
    }
    case 'lobby-add-char-pubpage': {
      const cid=el.dataset.cid||el.dataset.id||'';
      if(!cid||cid==='_camp_') break;
      if(!CLOUD.isAdmin&&!canManageChar(cid)&&!canManageCampaign(CLOUD.activeCampaignId)){
        toast('🔒 Keine Berechtigung für diesen Charakter.');
        break;
      }
      const nowTs=stamp();
      const pubEntry=CLOUD.registry.publicNotes?.[cid];
      const existingPages=(cid===S.charId&&!CLOUD.viewingRemote&&Array.isArray(S.campaignNotes))
        ?extractPublicPages(S.campaignNotes,'',nowTs)
        :(Array.isArray(pubEntry?.pages)?pubEntry.pages:[]);
      const newPg={
        id:'cn_'+uid(),
        title:`Öffentliche Seite ${existingPages.length+1}`,
        content:'',
        isPublic:true,
        updatedAt:nowTs
      };
      if(cid===S.charId&&!CLOUD.viewingRemote){
        if(!Array.isArray(S.campaignNotes)) S.campaignNotes=[];
        S.campaignNotes.push(newPg);
        S.activeCampNoteId=newPg.id;
        save(false);
        const pubPages=extractPublicPages(S.campaignNotes,'',nowTs);
        upsertPublicNoteEntry(cid,{
          campaignId:CLOUD.activeCampaignId,
          charName:S.profile.name||'Unbenannter Held',
          avatar:S.profile.avatar||'',
          owner:S.owner||CLOUD.currentUser||'',
          content:String(pubPages[0]?.content||''),
          updatedAt:nowTs,
          pages:pubPages
        });
        CLOUD.activePublicPageKey=`${cid}::${newPg.id}`;
        CLOUD.confirmDelCampPageId=null;
        saveRegistryLocal();
        renderMain();
        if(CN.open) renderCampNotes();
        publishLiveCampNote({scope:'char',campaignId:CLOUD.activeCampaignId,charId:cid,publicNoteEntry:CLOUD.registry.publicNotes[cid]});
        pushToCloud(true);
        toast('📄 Neue öffentliche Seite hinzugefügt!');
      }else{
        const ch=CLOUD.list.find(x=>x.id===cid);
        const nextPages=[...existingPages,{id:newPg.id,title:newPg.title,content:'',updatedAt:nowTs}];
        upsertPublicNoteEntry(cid,{
          campaignId:CLOUD.activeCampaignId,
          charName:pubEntry?.charName||ch?.name||'Unbenannter Held',
          avatar:pubEntry?.avatar||ch?.avatar||'',
          owner:getCharOwner(cid)||pubEntry?.owner||'',
          content:String(nextPages[0]?.content||''),
          updatedAt:nowTs,
          pages:nextPages
        });
        CLOUD.activePublicPageKey=`${cid}::${newPg.id}`;
        CLOUD.confirmDelCampPageId=null;
        saveRegistryLocal();
        renderMain();
        publishLiveCampNote({scope:'char',campaignId:CLOUD.activeCampaignId,charId:cid,publicNoteEntry:CLOUD.registry.publicNotes[cid]});
        updateCloudCharacterMeta(cid,data=>{
          if(!Array.isArray(data.campaignNotes)) data.campaignNotes=[];
          data.campaignNotes.push(newPg);
        },'📄 Neue öffentliche Seite hinzugefügt!');
      }
      break;
    }
    case 'lobby-focus-my-pubnote': {
      const charId=el.dataset.id||S.charId||'';
      if(charId){
        const firstPid=(charId===S.charId?(S.campaignNotes||[]).find(n=>n&&n.isPublic)?.id:'')||CLOUD.registry.publicNotes?.[charId]?.pages?.[0]?.id||'cn_public';
        CLOUD.activePublicPageKey=`${charId}::${firstPid}`;
      }
      CLOUD.publicNotesOpen=true;
      renderMain();
      setTimeout(()=>{
        const fld=document.querySelector('[data-lobby-pubnote]');
        if(fld) fld.focus();
      },30);
      break;
    }
    case 'cloud-load-char': {
      const cid=el.dataset.id||'';
      if(cid) loadCloudCharacter(cid,false,true);
      break;
    }
    case 'save-lobby-pubnote': {
      const cid=el.dataset.id||'';
      const pid=el.dataset.pageid||'cn_public';
      if(!cid) break;
      const rtfEl=document.querySelector(`[data-lobby-pubnote="${cid}"][data-pageid="${pid}"]`)||document.querySelector(`[data-lobby-pubnote="${cid}"]`);
      const content=rtfEl?rtfEl.innerHTML:'';
      const nowTs=stamp();
      if(cid==='_camp_'){
        const shared=getCampaignSharedPages(CLOUD.activeCampaignId);
        const pg=shared.find(p=>p&&p.id===pid);
        if(pg){
          pg.content=content;
          pg.updatedAt=nowTs;
          pg.lastEditor=CLOUD.currentUser||'Admin';
          saveRegistryLocal();
          publishLiveCampNote({scope:'camp',campaignId:CLOUD.activeCampaignId,pageId:pid,page:pg});
          await syncCloudRegistry(true);
          renderMain();
          toast('💾 Gemeinsame Kampagnenseite gespeichert!');
        }
        break;
      }
      if(!CLOUD.registry.publicNotes||typeof CLOUD.registry.publicNotes!=='object') CLOUD.registry.publicNotes={};
      if(!CLOUD.registry.publicNotes[cid]){
        const ch=CLOUD.list.find(x=>x.id===cid);
        CLOUD.registry.publicNotes[cid]={
          charId:cid,
          campaignId:getCharCampaignId(cid),
          charName:ch?.name||(cid===S.charId?S.profile.name:'')||'Unbenannter Held',
          avatar:ch?.avatar||(cid===S.charId?S.profile.avatar:'')||'',
          owner:getCharOwner(cid),
          content:pid==='cn_public'?content:'',
          updatedAt:nowTs,
          pages:[{id:pid,title:pid==='cn_public'?'🌐 Öffentlich':'Notiz',content,updatedAt:nowTs}]
        };
      }else{
        const entry=CLOUD.registry.publicNotes[cid];
        if(!Array.isArray(entry.pages)) entry.pages=[];
        const pg=entry.pages.find(p=>p&&p.id===pid);
        if(pg){
          pg.content=content;
          pg.updatedAt=nowTs;
        }else{
          entry.pages.push({id:pid,title:pid==='cn_public'?'🌐 Öffentlich':'Notiz',content,updatedAt:nowTs});
        }
        entry.content=String(entry.pages[0]?.content??content??'');
        entry.updatedAt=nowTs;
      }
      saveRegistryLocal();
      publishLiveCampNote({scope:'char',campaignId:CLOUD.activeCampaignId,charId:cid,publicNoteEntry:CLOUD.registry.publicNotes[cid]});
      if(cid===S.charId&&!CLOUD.viewingRemote){
        const ownNote=(S.campaignNotes||[]).find(n=>n&&n.id===pid);
        if(ownNote){
          ownNote.content=content;
          ownNote.updatedAt=nowTs;
        }
        save(false);
        pushToCloud(false).then(()=>renderMain());
      }else{
        updateCloudCharacterMeta(cid,data=>{
          if(!Array.isArray(data.campaignNotes)||!data.campaignNotes.length){
            data.campaignNotes=[
              {id:'cn_main',title:'Allgemein',content:'',isPublic:false,updatedAt:''},
              {id:'cn_public',title:'🌐 Öffentlich',content:'',isPublic:true,updatedAt:''}
            ];
          }
          let targetNote=data.campaignNotes.find(n=>n&&n.id===pid);
          if(!targetNote){
            targetNote={id:pid,title:pid==='cn_public'?'🌐 Öffentlich':'Notiz',content:'',isPublic:true,updatedAt:nowTs};
            data.campaignNotes.push(targetNote);
          }
          targetNote.content=content;
          targetNote.updatedAt=nowTs;
          targetNote.isPublic=true;
          if(!data._summary) data._summary={};
          if(pid==='cn_public') data._summary.publicNote=content;
          data._summary.publicPages=extractPublicPages(data.campaignNotes,'',nowTs);
        },'💾 Öffentliche Notiz gespeichert!');
      }
      break;
    }
    case 'lobby-open-char-pubnote': {
      const cid=el.dataset.id||'';
      if(!cid) break;
      const focusFirstPublic=()=>{
        const pubPg=(S.campaignNotes||[]).find(n=>n&&n.isPublic);
        if(pubPg) S.activeCampNoteId=pubPg.id;
        else if(S.campaignNotes?.[0]) S.activeCampNoteId=S.campaignNotes[0].id;
        CN.open=true;
      };
      if(UI.sheetLoaded&&S.charId===cid&&!CLOUD.viewingRemote){
        UI.inLobby=false; UI.sheetLoaded=true; UI.modal=null; exitLobbyNeutralDice();
        focusFirstPublic();
        renderAll(false);
      }else{
        loadCloudCharacter(cid,false,true).then(()=>{
          if(!UI.inLobby&&S.charId===cid){
            focusFirstPublic();
            renderHeader(); renderCampNotes();
          }else if(S.charId===cid){
            UI.inLobby=false; UI.sheetLoaded=true; UI.modal=null; exitLobbyNeutralDice();
            focusFirstPublic();
            renderAll(false);
          }
        });
      }
      break;
    }
    case 'c-mode': if(el.dataset.mode==='direct')D.cDirect=getEffC();else{D.cAttr=getEffC();D.cSkill='0';} D.cMode=el.dataset.mode; renderDice(); break;
    case 'd-mode': {
      const m=el.dataset.mode;
      if(m==='character'){activateVsCharMode();break;}
      clearOutgoingDuel({notifyCancel:true,silent:true});
      const eff=getEffD();
      if(m==='direct') D.dDirect=eff; else {D.dAttr=eff; D.dSkill='0';}
      D.dMode=m; applyDiceAutoAdvDis(false); renderDice(); break;
    }
    case 'refresh-dice-opp': {
      if(D.oppCharId){fetchForeignCharacterSheet(D.oppCharId,{force:true,silent:false});renderDice();}
      else{fetchLobbyList(true).then(()=>{if(D.dMode==='character')activateVsCharMode();});}
      break;
    }
    case 'dice-opp-kind': {clearOutgoingDuel({notifyCancel:true,silent:true});D.oppKind=el.dataset.kind||'preset';D.oppSitActive={};applyDiceAutoAdvDis(false);renderDice();break;}
    case 'dice-opp-preset': {clearOutgoingDuel({notifyCancel:true,silent:true});D.oppPreset=el.dataset.preset||'dodge';D.oppWeaponId='';D.oppSkillId='';D.oppSitActive={};applyDiceAutoAdvDis(false);renderDice();break;}
    case 'dice-opp-attr': {clearOutgoingDuel({notifyCancel:true,silent:true});D.oppAttrKey=el.dataset.attr||'GW';D.oppSitActive={};applyDiceAutoAdvDis(false);renderDice();break;}
    case 'toggle-dice-opp-sit': {clearOutgoingDuel({notifyCancel:true,silent:true});const sk=el.dataset.sit;if(sk){if(!D.oppSitActive)D.oppSitActive={};D.oppSitActive[sk]=!D.oppSitActive[sk];applyDiceAutoAdvDis(false);renderDice();}break;}
    case 'duel-send': sendDuelChallenge(); break;
    case 'duel-cancel': cancelOutgoingDuel(false); break;
    case 'duel-clear-status': clearOutgoingDuel({notifyCancel:false,silent:true}); applyDiceAutoAdvDis(false); renderDice(); break;
    case 'duel-roll-now': clearOutgoingDuel({notifyCancel:true,silent:true}); executeDiceRoll(); break;
    case 'duel-open-reply': openDuelReplyModal(el.dataset.id); break;
    case 'duel-ignore': ignoreIncomingDuel(el.dataset.id,true); break;
    case 'duel-reply-close': closeDuelReplyModal(); break;
    case 'duel-reply-close-bg': if(e.target===el) closeDuelReplyModal(); break;
    case 'duel-reply-decline': if(DUEL.reply?.challenge?.challengeId) ignoreIncomingDuel(DUEL.reply.challenge.challengeId,true); else closeDuelReplyModal(); break;
    case 'duel-reply-reload': if(DUEL.reply?.challenge?.targetCharId){fetchForeignCharacterSheet(DUEL.reply.challenge.targetCharId,{force:true,silent:false});renderDuelReplyModal();} break;
    case 'duel-reply-kind': if(DUEL.reply){DUEL.reply.kind=el.dataset.kind||'preset';DUEL.reply.sitActive={};renderDuelReplyModal();} break;
    case 'duel-reply-preset': if(DUEL.reply){DUEL.reply.preset=el.dataset.preset||'dodge';DUEL.reply.weaponId='';DUEL.reply.skillId='';DUEL.reply.sitActive={};renderDuelReplyModal();} break;
    case 'duel-reply-attr': if(DUEL.reply){DUEL.reply.attrKey=el.dataset.attr||'GW';DUEL.reply.sitActive={};renderDuelReplyModal();} break;
    case 'duel-reply-sit': if(DUEL.reply){const sk=el.dataset.sit;if(sk){if(!DUEL.reply.sitActive)DUEL.reply.sitActive={};DUEL.reply.sitActive[sk]=!DUEL.reply.sitActive[sk];renderDuelReplyModal();}} break;
    case 'duel-reply-insp': if(DUEL.reply){DUEL.reply.useInspiration=!DUEL.reply.useInspiration;renderDuelReplyModal();} break;
    case 'duel-reply-submit': submitDuelReply(); break;
    case 'adv-step': {const r=applyDiceAutoAdvDis(false);D.advAdj=Math.max(-r.autoAdv,toInt(D.advAdj,0)+Number(el.dataset.d));applyDiceAutoAdvDis(false);renderDice();break;}
    case 'dis-step': {const r=applyDiceAutoAdvDis(false);D.disAdj=Math.max(-r.autoDis,toInt(D.disAdj,0)+Number(el.dataset.d));applyDiceAutoAdvDis(false);renderDice();break;}
    case 'reset-dice-diff': clearOutgoingDuel({notifyCancel:true,silent:true}); D.dMode='direct'; D.dDirect=40; D.dAttr=30; D.dSkill='10'; D.dCustom=25; applyDiceAutoAdvDis(false); renderDice(); break;
    case 'dice-set-diff': clearOutgoingDuel({notifyCancel:true,silent:true}); D.dMode='direct'; D.dDirect=toInt(el.dataset.val,40); applyDiceAutoAdvDis(false); renderDice(); break;
    case 'reset-dice-advdis': D.advAdj=0; D.disAdj=0; applyDiceAutoAdvDis(true); renderDice(); break;
    case 'cnt-step': D.cnt=Math.max(1,Math.min(10,D.cnt+Number(el.dataset.d))); renderDice(); break;
    case 'crit-step': {const T=calcThreshold(),i=CRIT_SEQ.indexOf(T.effCrit),ni=Math.max(0,Math.min(CRIT_SEQ.length-1,i+Number(el.dataset.d)));D.critOff=ni-T.autoCrit;D.crit=CRIT_SEQ[ni];renderDice();break;}
    case 'crit-mode': D.critMode=D.critMode==='range'?'exact':'range'; renderDice(); break;
    case 'roll-d100': executeDiceRoll(); break;
    case 'roll-block-followup': executeBlockFollowUpRoll(); break;
    case 'combat-roll-blocked-20':
    case 'roll-blocked-hit-20': {
      if(D.dMode==='character'&&D.oppCharId){
        const opp=resolveOpponentComparison(D.wRollCat||'Trefferwurf');
        if(opp&&opp.ready){
          COMBAT.targetCharId=opp.charId;
          COMBAT.targetName=opp.oppName;
          if(el.dataset.action==='roll-blocked-hit-20'){
            COMBAT.blockItemRed=Boolean(opp.oppWeapon&&hasTagMatch(opp.oppWeapon.tags,/^blockf[äa]hig\b/i));
          }
        }
      }
      clearOutgoingDuel({notifyCancel:true,silent:true});
      D.dMode='direct'; D.dDirect=20;
      applyDiceAutoAdvDis(false);
      executeDiceRoll({isAttackerBlockFollowUp:true});
      break;
    }
    case 'combat-close': resetCombatState(); renderDice(); break;
    case 'combat-toggle-collapse': COMBAT.collapsed=!COMBAT.collapsed; renderDice(); break;
    case 'combat-roll-hz': COMBAT.offerStatus=''; COMBAT.offerNote=''; COMBAT.directAppliedNote=''; rollCombatHitZone(); break;
    case 'combat-set-zone': COMBAT.zoneName=el.dataset.zone||''; COMBAT.lastHzRoll=null; COMBAT.posted=false; COMBAT.offerStatus=''; COMBAT.offerNote=''; COMBAT.directAppliedNote=''; renderDice(); break;
    case 'combat-set-dmgtype': COMBAT.dmgType=el.dataset.dmgtype||'cut'; COMBAT.posted=false; COMBAT.offerStatus=''; COMBAT.offerNote=''; COMBAT.directAppliedNote=''; renderDice(); break;
    case 'combat-set-pool': COMBAT.pool=el.dataset.pool==='mlp'?'mlp':'lp'; COMBAT.posted=false; COMBAT.offerStatus=''; COMBAT.offerNote=''; COMBAT.directAppliedNote=''; renderDice(); break;
    case 'combat-toggle-block-red': COMBAT.blockItemRed=!COMBAT.blockItemRed; COMBAT.posted=false; COMBAT.offerStatus=''; COMBAT.offerNote=''; COMBAT.directAppliedNote=''; renderDice(); break;
    case 'combat-dmg-step': COMBAT.dmgMod=toInt(COMBAT.dmgMod,0)+Number(el.dataset.d); COMBAT.posted=false; COMBAT.offerStatus=''; COMBAT.offerNote=''; COMBAT.directAppliedNote=''; renderDice(); break;
    case 'combat-armor-step': COMBAT.armorMod=toInt(COMBAT.armorMod,0)+Number(el.dataset.d); COMBAT.posted=false; COMBAT.offerStatus=''; COMBAT.offerNote=''; COMBAT.directAppliedNote=''; renderDice(); break;
    case 'combat-post-feed': publishCombatDamageToFeed(); break;
    case 'combat-send-offer': sendCombatDamageOffer(); break;
    case 'combat-apply-direct': await applyCombatDamageDirectly(); break;
    case 'combat-spend-ammo': spendCombatAmmo(); break;
    case 'combat-offer-accept': await acceptCombatDamageOffer(el.dataset.id); break;
    case 'combat-offer-decline': declineCombatDamageOffer(el.dataset.id); break;
    case 'combat-offer-toggle-edit': {
      const of=(DUEL.damageOffers||[]).find(x=>x&&x.offerId===el.dataset.id);
      if(of){of.editOpen=!of.editOpen;if(of.editOpen&&(of.editAmount===undefined||of.editAmount===null))of.editAmount=Math.max(0,toInt(of.amount,0));renderDuelBanner();}
      break;
    }
    case 'combat-offer-step': {
      const of=(DUEL.damageOffers||[]).find(x=>x&&x.offerId===el.dataset.id);
      if(of){of.editOpen=true;of.editAmount=Math.max(0,toInt(of.editAmount??of.amount,0)+Number(el.dataset.d));renderDuelBanner();}
      break;
    }
    case 'toggle-dice-custom': D.customOpen=!D.customOpen; renderDice(); break;
    case 'dice-custom-preset': D.customSides=Math.max(1,toInt(el.dataset.sides,20)); D.customOpen=true; renderDice(); break;
    case 'roll-custom-dice': rollCustomDice(); break;
    case 'toggle-dice-secret': if(!CLOUD.isAdmin) break; D.secretMode=!D.secretMode; if(UI.lastBlockBaseHtml&&UI.lastRollHtml&&UI.lastRollHtml.includes('roll-block-followup')) UI.lastRollHtml=UI.lastBlockBaseHtml+renderBlockFollowUpBox(); renderDice(); updateLobbyLiveDiceDOM(); if(UI.modal==='adminPanel') renderModal(); toast(D.secretMode?'🕵️ Admin-Geheimwurf-Modus AKTIV (Privat)':'👁️ Öffentlicher Live-Feed-Modus aktiv'); break;
    case 'reveal-secret-roll': revealSecretRoll(el.dataset.id); break;
    case 'toggle-secret-list': UI.secretRollsCollapsed=!UI.secretRollsCollapsed; renderDice(); break;
    case 'clear-secret-rolls': if(!CLOUD.isAdmin) break; CLOUD.secretRolls=[]; UI.lastSecretRollId=''; saveSecretRollsLocal(); renderDice(); toast('🗑️ Geheime Admin-Würfe geleert'); break;
    case 'clear-dice-log': clearDiceLogs(); renderDice(); break;
    case 'pick-avatar': openImgMenu('avatar'); break;
    case 'pick-lobby-logo': if(CLOUD.isAdmin||CLOUD.registry?.lobbyLogo) openImgMenu('lobbyLogo','',UI.modal==='adminPanel'?'adminPanel':''); break;
    case 'pick-camp-img': {
      const c=getCampaigns().find(x=>x.id===CLOUD.activeCampaignId);
      if(CLOUD.isAdmin||canManageCampaign(CLOUD.activeCampaignId)||c?.img) openImgMenu('campImg',CLOUD.activeCampaignId);
      break;
    }
    case 'open-user-avatar': {
      const raw=el.dataset.user||UI.profileUser||CLOUD.currentUser||'';
      const targetKey=findUserKeyByName(raw)||findUserKeyById(raw);
      if(!targetKey) break;
      if(!canViewUserProfile(targetKey)&&!getUserAvatar(targetKey)){
        toast('🔒 Du kannst nur dein eigenes Profilbild bearbeiten.');
        break;
      }
      const retModal=el.dataset.return!==undefined?el.dataset.return:'userProfile';
      if(retModal==='userProfile') UI.profileUser=targetKey;
      openImgMenu('userAvatar',targetKey,retModal);
      break;
    }
    case 'img-menu-upload': {
      const ctx=getImgMenuContext();
      if(ctx&&ctx.canEdit&&ctx.fileInputId) $(ctx.fileInputId)?.click();
      break;
    }
    case 'img-menu-zoom': {
      const ctx=getImgMenuContext();
      if(ctx&&ctx.url){UI.imgZoomOpen=true; renderModal();}
      break;
    }
    case 'img-menu-zoom-close': UI.imgZoomOpen=false; renderModal(); break;
    case 'img-menu-remove': removeImgForCurrentTarget(); break;
    case 'open-lobby':
      await flushBeforeCharacterSwitch();
      UI.inLobby=true; UI.sheetLoaded=false; UI.modal=null; CLOUD.viewingRemote=false; CLOUD.remoteCharId='';
      CLOUD.confirmDelCloudId=null; CLOUD.confirmClearDice=false; CLOUD.campAction='';
      D.open=false; CN.open=false; resetDiceToLobbyNeutral();
      applySessionTheme({allowSheetFallback:false});
      try{window.history.replaceState({},'',`${window.location.pathname}?lobby=1`);}catch(e){}
      initLiveDiceChannel(); renderAll(false); fetchLobbyList(true);
      toast('🏠 Charakterbogen geschlossen – du bist in der Lobby.');
      break;
    case 'open-local-sheet': {
      await flushBeforeCharacterSwitch();
      CLOUD.viewingRemote=false; CLOUD.remoteCharId='';
      load();
      if(CLOUD.currentUser&&!S.owner) S.owner=CLOUD.currentUser;
      if(!S.campaignId) S.campaignId=CLOUD.activeCampaignId||'default';
      resetCloudSyncState({clearMeta:true,status:'saved'});
      UI.inLobby=false; UI.sheetLoaded=true; UI.modal=null; exitLobbyNeutralDice();
      try{window.history.replaceState({},'',S.charId?`${window.location.pathname}?char=${encodeURIComponent(S.charId)}`:window.location.pathname);}catch(e){}
      renderAll(false);
      toast(`🛠️ Lokaler Charakterbogen „${S.profile.name||'Charakter'}“ geöffnet!`);
      break;
    }
    case 'copy-char-link': {
      const id=el.dataset.id||'';
      const url=`${window.location.origin&&window.location.origin!=='null'?window.location.origin+window.location.pathname:''}?char=${encodeURIComponent(id)}`;
      if(navigator.clipboard) navigator.clipboard.writeText(url);
      toast('🔗 Direktlink zum Charakterbogen kopiert!');
      break;
    }
    case 'select-campaign-tab': {
      const cid=el.dataset.id||'default';
      setActiveCampaign(cid);
      CLOUD.campAction='';
      if(UI.inLobby){renderHeader();renderMain();}
      if(LD.open) renderLiveDice();
      renderHeader();
      break;
    }
    case 'camp-new-open': {
      if(!CLOUD.isAdmin) break;
      CLOUD.campAction=CLOUD.campAction==='new'?'':'new';
      renderModal();
      if(CLOUD.campAction==='new') setTimeout(()=>{const inp=$('inpCampaignName');if(inp)inp.focus();},30);
      break;
    }
    case 'camp-new-save': {
      if(!CLOUD.isAdmin) break;
      const nm=($('inpCampaignName')?.value||'').trim();
      if(!nm){toast('⚠️ Bitte einen Namen für die neue Kampagne eingeben.');break;}
      const camps=getCampaigns();
      const newId='camp_'+uid();
      camps.push({id:newId,name:nm,allowedUsers:[]});
      CLOUD.registry.campaigns=normalizeCampaigns(camps);
      setActiveCampaign(newId);
      CLOUD.campAction='';
      syncCloudRegistry(true);
      renderModal();
      toast(`🗺️ Kampagne „${nm}“ erstellt!`);
      break;
    }
    case 'camp-rename-open': {
      if(!CLOUD.isAdmin) break;
      CLOUD.campAction=CLOUD.campAction==='rename'?'':'rename';
      renderModal();
      if(CLOUD.campAction==='rename') setTimeout(()=>{const inp=$('inpCampaignName');if(inp){inp.focus();inp.select();}},30);
      break;
    }
    case 'camp-rename-save': {
      if(!CLOUD.isAdmin) break;
      const nm=($('inpCampaignName')?.value||'').trim();
      if(!nm){toast('⚠️ Kampagnenname darf nicht leer sein.');break;}
      const camps=getCampaigns();
      const target=camps.find(c=>c.id===CLOUD.activeCampaignId);
      if(target){
        target.name=nm;
        CLOUD.registry.campaigns=normalizeCampaigns(camps);
        CLOUD.campAction='';
        syncCloudRegistry(true);
        renderModal();
        toast(`✏️ Kampagne in „${nm}“ umbenannt!`);
      }
      break;
    }
    case 'camp-delete-ask': {
      if(!CLOUD.isAdmin||CLOUD.activeCampaignId==='default') break;
      CLOUD.campAction='delete';
      renderModal();
      break;
    }
    case 'camp-delete-confirm': {
      if(!CLOUD.isAdmin||CLOUD.activeCampaignId==='default') break;
      const delId=CLOUD.activeCampaignId;
      const camps=getCampaigns();
      const delCamp=camps.find(c=>c.id===delId);
      const delName=delCamp?.name||'Kampagne';
      CLOUD.registry.campaigns=normalizeCampaigns(camps.filter(c=>c.id!==delId));
      if(!CLOUD.registry.charCampaigns||typeof CLOUD.registry.charCampaigns!=='object') CLOUD.registry.charCampaigns={};
      const affectedIds=[];
      CLOUD.list.forEach(ch=>{
        if(getCharCampaignId(ch.id)===delId){
          ch.campaignId='default';
          CLOUD.registry.charCampaigns[ch.id]='default';
          affectedIds.push(ch.id);
        }
      });
      Object.keys(CLOUD.registry.charCampaigns).forEach(cid=>{
        if(CLOUD.registry.charCampaigns[cid]===delId){
          CLOUD.registry.charCampaigns[cid]='default';
          if(!affectedIds.includes(cid)) affectedIds.push(cid);
        }
      });
      if(S.campaignId===delId){S.campaignId='default';save(false);}
      setActiveCampaign('default');
      CLOUD.campAction='';
      syncCloudRegistry(true);
      affectedIds.forEach(cid=>{
        updateCloudCharacterMeta(cid,d=>{d.campaignId='default';if(d._summary)d._summary.campaignId='default';},'');
      });
      renderModal();
      toast(`🗑️ Kampagne „${delName}“ gelöscht (Charaktere in Hauptkampagne verschoben).`);
      break;
    }
    case 'camp-action-cancel': {
      CLOUD.campAction='';
      renderModal();
      break;
    }
    case 'camp-add-user-btn': {
      if(!canManageCampaign(CLOUD.activeCampaignId)) break;
      const inp=$('inpCampAddUser');
      addCampaignAllowedUser(inp?inp.value:'');
      break;
    }
    case 'camp-rm-user': {
      if(!canManageCampaign(CLOUD.activeCampaignId)) break;
      removeCampaignAllowedUser(el.dataset.user||'');
      break;
    }
    case 'admin-toggle-gm': toggleGlobalGMTag(el.dataset.user); break;
    case 'camp-add-gm-btn': {const s=$('selCampAddGM'); if(s&&s.value) addCampaignMainGM(s.value);} break;
    case 'camp-rm-gm': removeCampaignMainGM(el.dataset.user); break;
    case 'kick-char-camp': kickCharFromCampaign(el.dataset.id); break;
    case 'dup-char-sheet': duplicateCharacterSheet(el.dataset.id); break;
    case 'toggle-lobby-dice-collapse': CLOUD.diceCollapsed=!CLOUD.diceCollapsed; updateLobbyLiveDiceDOM(); break;
    case 'reset-lobby-dice-h': CLOUD.lobbyDiceH=340; try{localStorage.setItem('scherbensturm_lobby_dice_h','340');}catch(e){} updateLobbyLiveDiceDOM(); break;
    case 'toggle-lobby-gallery-collapse': CLOUD.galleryCollapsed=!CLOUD.galleryCollapsed; try{localStorage.setItem('scherbensturm_lobby_gallery_collapsed',CLOUD.galleryCollapsed?'1':'0');}catch(e){} renderMain(); break;
    case 'lobby-open-dice': D.open=true; ensureLobbyNeutralDiceOnOpen(); renderHeader(); renderDice(); break;
    case 'lobby-quick-roll': ensureLobbyNeutralDiceOnOpen(); syncDiceFromSheet(); executeDiceRoll(); break;
    case 'toggle-dice-toast': CLOUD.diceToast=!CLOUD.diceToast; try{localStorage.setItem('scherbensturm_dice_toast',CLOUD.diceToast?'1':'0');}catch(e){} updateLobbyLiveDiceDOM(); toast(CLOUD.diceToast?'🔔 Live-Wurf-Popups aktiviert':'🔕 Live-Wurf-Popups stummgeschaltet'); break;
    case 'lobby-sync-dice': initLiveDiceChannel(); syncCloudRegistry(false); toast('🔄 Live-Würfelfenster synchronisiert'); break;
    case 'ask-clear-lobby-dice': if(!canClearLiveDice()){toast('🔒 Nur der Admin oder ein Spielleiter dieser Kampagne kann den Live-Würfellog leeren.');return;} CLOUD.confirmClearDice=true; updateLobbyLiveDiceDOM(); break;
    case 'cancel-clear-lobby-dice': CLOUD.confirmClearDice=false; updateLobbyLiveDiceDOM(); break;
    case 'confirm-clear-lobby-dice': if(!canClearLiveDice()){CLOUD.confirmClearDice=false;updateLobbyLiveDiceDOM();toast('🔒 Nur der Admin oder ein Spielleiter dieser Kampagne kann den Live-Würfellog leeren.');return;} clearLiveDiceFeed(); break;
    case 'toggle-lobby-filter': CLOUD.filterMine=!CLOUD.filterMine; renderModal(); break;
    case 'lobby-new-sheet': {
      if(!CLOUD.currentUser){toast('🔒 Charaktererstellung ist nur für angemeldete Spieler-Accounts möglich. Bitte melde dich zuerst an!');break;}
      CLOUD.newCharOpen=!CLOUD.newCharOpen;
      const allowed=getCreatableCampaigns(CLOUD.currentUser);
      CLOUD.newCharCampId=allowed.some(x=>x.id===CLOUD.activeCampaignId)?CLOUD.activeCampaignId:'default';
      renderMain(); renderModal();
      if(CLOUD.newCharOpen) setTimeout(()=>$('inpNewCharName')?.focus(),40);
      break;
    }
    case 'create-user-char-cancel': {
      CLOUD.newCharOpen=false;
      renderMain(); renderModal();
      break;
    }
    case 'create-user-char-confirm': {
      const nm=($('inpNewCharName')?.value??CLOUD.newCharName??'').trim();
      const anc=($('inpNewCharAncestry')?.value??CLOUD.newCharAncestry??'').trim();
      const con=($('inpNewCharConcept')?.value??CLOUD.newCharConcept??'').trim();
      const cmp=$('selNewCharCamp')?.value||CLOUD.newCharCampId||CLOUD.activeCampaignId||'default';
      createNewUserCharacter({name:nm,ancestry:anc,concept:con,campaignId:cmp});
      break;
    }
    case 'user-register': {
      const u=($('inpLobbyUser')?.value||'').trim(), p=($('inpLobbyPass')?.value||'').trim(), p2=($('inpLobbyPass2')?.value||'').trim();
      if(!u||!p){toast('⚠️ Bitte Spielername und Passwort eingeben.');break;}
      if(p!==p2){toast('⚠️ Die beiden Passwörter stimmen nicht überein!');break;}
      const exKey=findUserKeyByName(u);
      if(exKey){toast(`⚠️ Account „${exKey}“ existiert bereits – bitte auf „Anmelden“ klicken.`);break;}
      cancelThemePrefsSync();
      CLOUD.registry.users[u]={userId:'usr_'+uid(),passHash:simpleHash(p),createdAt:stamp(),avatar:'',nameHistory:[]};
      ensureAllRegistryUsers();
      CLOUD.currentUser=u;
      try{localStorage.setItem('scherbensturm_cloud_user',u);}catch(e){}
      applySessionTheme({allowSheetFallback:false});
      applyTheme();
      renderHeader(); renderMain(); renderModal(true);
      refreshUserNotificationsBg(false);
      syncCloudRegistry(true);
      toast(`✨ Account „${u}“ registriert & angemeldet!`);
      break;
    }
    case 'user-login': {
      const u=($('inpLobbyUser')?.value||'').trim(), p=($('inpLobbyPass')?.value||'').trim();
      if(!u||!p){toast('⚠️ Bitte Spielername und Passwort eingeben.');break;}
      ensureAllRegistryUsers();
      const exKey=findUserKeyByName(u);
      if(!exKey){toast(`⚠️ Account „${u}“ noch nicht gefunden – klicke auf „Registrieren“, um ihn neu anzulegen.`);break;}
      if(CLOUD.registry.users[exKey].passHash!==simpleHash(p)&&!(CLOUD.registry.adminHash&&simpleHash(p)===CLOUD.registry.adminHash)){
        toast('🔒 Passwort stimmt nicht.');break;
      }
      cancelThemePrefsSync();
      CLOUD.currentUser=exKey;
      try{localStorage.setItem('scherbensturm_cloud_user',exKey);}catch(e){}
      applySessionTheme({allowSheetFallback:false});
      applyTheme();
      renderHeader(); renderMain(); renderModal(true);
      refreshUserNotificationsBg(false);
      syncCloudRegistry(false);
      toast(`🔑 Willkommen zurück, ${exKey}!`);
      break;
    }
    case 'user-logout': {
      flushThemePrefsSync();
      CLOUD.currentUser=''; CLOUD.filterMine=false;
      ensureProfileModalAccess();
      try{localStorage.removeItem('scherbensturm_cloud_user');}catch(e){}
      applySessionTheme({allowSheetFallback:false});
      applyTheme();
      renderHeader(); renderMain(); renderModal(true);
      toast('Abgemeldet');
      break;
    }
    case 'open-admin-panel':
    case 'toggle-admin-bar': openAdminPanel(); break;
    case 'admin-return-panel': {
      UI.adminReturnModal='';
      UI.profileUser='';
      UI.confirmResetAllIcons=false;
      UI.modal='adminPanel';
      applyTheme();
      renderModal(false,true);
      break;
    }
    case 'toggle-user-mgmt': CLOUD.userMgmtOpen=!CLOUD.userMgmtOpen; renderModal(); break;
    case 'admin-unlock': performAdminUnlock(); break;
    case 'admin-change-pin': performAdminChangePin(); break;
    case 'admin-logout': CLOUD.isAdmin=false; CLOUD.showAdminBar=false; CLOUD.userMgmtOpen=false; D.secretMode=false; UI.lastSecretRollId=''; UI.adminReturnModal=''; UI.adminPinError=''; ensureProfileModalAccess(); try{localStorage.removeItem('scherbensturm_cloud_admin');}catch(e){} renderHeader(); renderMain(); renderModal(false,true); if(D.open) renderDice(); updateLobbyLiveDiceDOM(); toast('🔒 Admin-Modus gesperrt'); break;
    case 'admin-del-user': {
      if(!CLOUD.isAdmin) break;
      const u=el.dataset.user;
      if(u&&CLOUD.registry.users?.[u]!==undefined){
        const uLow=u.toLowerCase();
        CLOUD.registry.users[u]=null;
        if(Array.isArray(CLOUD.registry.gmUsers)) CLOUD.registry.gmUsers=CLOUD.registry.gmUsers.filter(x=>String(x||'').toLowerCase()!==uLow);
        Object.keys(CLOUD.registry.claims||{}).forEach(cid=>{if(String(CLOUD.registry.claims[cid]||'').toLowerCase()===uLow)CLOUD.registry.claims[cid]="";});
        (CLOUD.list||[]).forEach(ch=>{if(String(ch.owner||'').toLowerCase()===uLow){ch.owner='';CLOUD.registry.claims[ch.id]="";}});
        getCampaigns().forEach(c=>{
          c.allowedUsers=(c.allowedUsers||[]).filter(x=>String(x||'').toLowerCase()!==uLow);
          c.gmUsers=(c.gmUsers||[]).filter(x=>String(x||'').toLowerCase()!==uLow);
        });
        try{const bk=getUserBgLocalKey(u);if(bk)localStorage.removeItem(bk);}catch(e){}
        if(CLOUD.currentUser&&CLOUD.currentUser.toLowerCase()===uLow){
          cancelThemePrefsSync();
          CLOUD.currentUser='';
          try{localStorage.removeItem('scherbensturm_cloud_user');}catch(e){}
          applySessionTheme({allowSheetFallback:false});
          applyTheme();
        }
        syncCloudRegistry(true);
        delete CLOUD.registry.users[u];
        saveRegistryLocal();
        ensureProfileModalAccess();
        renderHeader(); renderMain(); renderModal();
        toast(`🗑️ Account „${u}“ dauerhaft entfernt`);
      }
      break;
    }
    case 'admin-reset-user-pw': {
      if(!CLOUD.isAdmin) break;
      const u=el.dataset.user;
      if(u&&CLOUD.registry.users?.[u]){
        CLOUD.registry.users[u].passHash=simpleHash('1234');
        syncCloudRegistry(true); renderModal(); toast(`🔑 Passwort für „${u}“ auf 1234 zurückgesetzt`);
      }
      break;
    }
    case 'open-user-profile': {
      const u=el.dataset.user||CLOUD.currentUser||'';
      const fromAdmin=UI.modal==='adminPanel';
      if(openUserProfile(u)){
        UI.adminReturnModal=fromAdmin?'adminPanel':'';
        if(fromAdmin) renderModal();
      }
      break;
    }
    case 'copy-user-id': {
      const targetKey=findUserKeyByName(UI.profileUser)||findUserKeyById(UI.profileUser);
      if(!targetKey||!canViewUserProfile(targetKey)){toast('🔒 Keine Berechtigung.');break;}
      const idToCopy=String(el.dataset.uid||CLOUD.registry?.users?.[targetKey]?.userId||'').trim();
      if(!idToCopy){toast('⚠️ Keine User-ID vorhanden.');break;}
      if(navigator.clipboard?.writeText){
        navigator.clipboard.writeText(idToCopy).then(()=>toast('📋 User-ID kopiert!')).catch(()=>toast(`User-ID: ${idToCopy}`));
      }else{
        try{
          const ta=document.createElement('textarea');
          ta.value=idToCopy;ta.style.position='fixed';ta.style.opacity='0';
          document.body.appendChild(ta);ta.select();document.execCommand('copy');ta.remove();
          toast('📋 User-ID kopiert!');
        }catch(e){toast(`User-ID: ${idToCopy}`);}
      }
      break;
    }
    case 'profile-rename-user': {
      const targetKey=findUserKeyByName(UI.profileUser)||findUserKeyById(UI.profileUser);
      if(!targetKey||!canViewUserProfile(targetKey)){
        toast('🔒 Du kannst nur dein eigenes Profil bearbeiten.');
        break;
      }
      const newName=($('inpProfileNewName')?.value||'').trim();
      if(!newName){toast('⚠️ Bitte einen neuen Benutzernamen eingeben.');break;}
      el.disabled=true;
      (async()=>{
        try{
          const ok=await renameUserAccount(targetKey,newName);
          if(ok){
            UI.profileUser=findUserKeyByName(newName)||newName;
          }
        }finally{
          if(UI.modal==='userProfile') renderModal();
        }
      })();
      break;
    }
    case 'profile-save-pw': {
      const targetKey=findUserKeyByName(UI.profileUser)||findUserKeyById(UI.profileUser);
      const isSelf=Boolean(targetKey&&CLOUD.currentUser&&CLOUD.currentUser.trim().toLowerCase()===targetKey.toLowerCase());
      if(!targetKey||!isSelf||!canViewUserProfile(targetKey)){
        toast('🔒 Du kannst hier nur dein eigenes Passwort ändern.');
        break;
      }
      const np1=($('inpProfileNewPass')?.value||'').trim(), np2=($('inpProfileNewPass2')?.value||'').trim();
      if(!np1||!np2){toast('⚠️ Bitte beide Passwortfelder ausfüllen.');break;}
      if(np1!==np2){toast('⚠️ Die beiden Passwörter stimmen nicht überein!');break;}
      if(!CLOUD.registry.users[targetKey]) CLOUD.registry.users[targetKey]={userId:'usr_'+uid(),passHash:'',createdAt:stamp(),avatar:'',nameHistory:[]};
      CLOUD.registry.users[targetKey].passHash=simpleHash(np1);
      ensureAllRegistryUsers();
      saveRegistryLocal();
      syncCloudRegistry(true);
      renderModal();
      toast('🔑 Passwort erfolgreich geändert!');
      break;
    }
    case 'claim-char': {
      if(!CLOUD.currentUser){toast('Bitte zuerst oben mit deinem Spielernamen anmelden.');break;}
      const cid=el.dataset.id, curOwn=getCharOwner(cid);
      if(curOwn&&!CLOUD.isAdmin){toast(`Bereits von „${curOwn}“ beansprucht.`);break;}
      CLOUD.registry.claims[cid]=CLOUD.currentUser;
      const ch=CLOUD.list.find(x=>x.id===cid);
      if(ch) ch.owner=CLOUD.currentUser;
      if(S.charId===cid) S.owner=CLOUD.currentUser;
      updateCloudCharacterMeta(cid,d=>{d.owner=CLOUD.currentUser;if(d._summary)d._summary.owner=CLOUD.currentUser;},`🙋‍♂️ Charakter für „${CLOUD.currentUser}“ beansprucht!`);
      break;
    }
    case 'unclaim-char': {
      const cid=el.dataset.id, curOwn=getCharOwner(cid);
      if(!CLOUD.isAdmin&&(!CLOUD.currentUser||curOwn.toLowerCase()!==CLOUD.currentUser.toLowerCase())) break;
      CLOUD.registry.claims[cid]="";
      const ch=CLOUD.list.find(x=>x.id===cid);
      if(ch) ch.owner='';
      if(S.charId===cid) S.owner='';
      updateCloudCharacterMeta(cid,d=>{d.owner='';if(d._summary)d._summary.owner='';},'🔓 Charakter-Zuordnung freigegeben');
      break;
    }
    case 'cloud-push-now': flushPendingSave(false); pushToCloud(false,{forceRegistry:true}); break;
    case 'cloud-sync-badge': {
      if(CLOUD.viewingRemote) break;
      const st=el.dataset.syncState||'';
      if(st==='error'||st==='offline'||CLOUD_SYNC.dirty||CLOUD_SYNC.status==='error'){
        CLOUD_SYNC.retryStep=0;
        flushCloudSyncNow({silent:false,force:true});
      }else if(st==='saved'){
        toast(CLOUD.lastSyncTs?`☁️ Automatisch gespeichert (${CLOUD.lastSyncTs})`:'☁️ Automatisches Server-Speichern aktiv');
      }
      break;
    }
    case 'copy-share-link': {const u=el.dataset.url;if(u&&navigator.clipboard){navigator.clipboard.writeText(u);toast('🔗 Direktlink in die Zwischenablage kopiert!');}break;}
    case 'cloud-refresh-list': fetchLobbyList(false); break;
    case 'save-cloud-url': {const v=($('inpCloudServerUrl')?.value||'').trim().replace(/\/+$/,'');CLOUD.serverUrl=v;try{localStorage.setItem('scherbensturm_cloud_url',v);}catch(e){}initLiveDiceChannel();fetchLobbyList(false);break;}
    case 'open-lobby-char-menu': openLobbyCharMenu(el,el.dataset.id); break;
    case 'cloud-view-char': loadCloudCharacter(el.dataset.id,true); break;
    case 'cloud-edit-char': loadCloudCharacter(el.dataset.id,false); break;
    case 'cloud-del-ask': CLOUD.confirmDelCloudId=el.dataset.id; if(UI.inLobby) renderMain(); else renderModal(); break;
    case 'cloud-del-no': CLOUD.confirmDelCloudId=null; if(UI.inLobby) renderMain(); else renderModal(); break;
    case 'cloud-del-yes': deleteCloudCharacter(el.dataset.id); break;
    case 'cloud-reload-view': if(CLOUD.remoteCharId) loadCloudCharacter(CLOUD.remoteCharId,true); break;
    case 'cloud-adopt-copy': {
      CLOUD.viewingRemote=false; CLOUD.remoteCharId=''; UI.inLobby=false; UI.sheetLoaded=true; UI.modal=null; exitLobbyNeutralDice();
      S.charId=uid(); S.owner=CLOUD.currentUser||''; S.cloudAutoSync=true;
      resetCloudSyncState({clearMeta:true,status:'saved',lastSyncTs:''});
      renderAll(true); toast('📥 Charakter als eigene Kopie übernommen!');
      break;
    }
    case 'cloud-exit-view': {
      resetCloudSyncState({clearMeta:true,status:'saved'});
      UI.inLobby=true; UI.sheetLoaded=false; UI.modal=null; CLOUD.viewingRemote=false; CLOUD.remoteCharId='';
      D.open=false; CN.open=false; resetDiceToLobbyNeutral();
      applySessionTheme({allowSheetFallback:false});
      try{window.history.replaceState({},'',`${window.location.pathname}?lobby=1`);}catch(e){}
      renderAll(false); fetchLobbyList(true);
      toast('🔙 Ansichtsmodus beendet – du bist in der Lobby.');
      break;
    }
    case 'open-settings': S.appearance.editScope=UI.inLobby?'lobby':S.activeTab; UI.modal='settings'; UI.confirmNew=false; syncPalDraftFromSlot(); applyTheme(); renderModal(); break;
    case 'open-info': UI.modal='info'; if(UI.infoTab==='patchnotes'&&CLOUD.currentUser&&PATCHNOTES.entries.length) PATCHNOTES.entries.forEach(e=>markNotifRead('patchnote',String(e.id))); renderModal(); if(UI.infoTab==='patchnotes'&&!PATCHNOTES.loaded&&!PATCHNOTES.loading) fetchPatchnotes(false).then(()=>{if(UI.modal==='info'&&UI.infoTab==='patchnotes'&&CLOUD.currentUser&&PATCHNOTES.entries.length) PATCHNOTES.entries.forEach(e=>markNotifRead('patchnote',String(e.id)));}); break;
    case 'open-patchnotes': UI.modal='info'; UI.infoTab='patchnotes'; if(CLOUD.currentUser&&PATCHNOTES.entries.length) PATCHNOTES.entries.forEach(e=>markNotifRead('patchnote',String(e.id))); renderModal(); if(!PATCHNOTES.loaded&&!PATCHNOTES.loading) fetchPatchnotes(false).then(()=>{if(UI.modal==='info'&&UI.infoTab==='patchnotes'&&CLOUD.currentUser&&PATCHNOTES.entries.length) PATCHNOTES.entries.forEach(e=>markNotifRead('patchnote',String(e.id)));}); break;
    case 'open-notifs': if(!(CLOUD.currentUser||CLOUD.isAdmin)) return; UI.modal='notifs'; renderModal(); refreshUserNotificationsBg(true); break;
    case 'notif-refresh': refreshUserNotificationsBg(true).then(()=>{ if(UI.modal==='notifs') renderModal(); }); break;
    case 'notif-mark-all': markAllNotifsRead(); toast('✓ Alle Benachrichtigungen als gelesen markiert.'); renderModal(); break;
    case 'notif-open-item': {
      const nkind=btn.dataset.nkind||'', nkey=btn.dataset.nkey||'', nid=btn.dataset.nid||'';
      markNotifRead(nkind,nkey);
    if(nkind==='fb_admin'){
      const seen=loadNotifSeen();
      if(nkey) seen.adminFb[String(nkey)]=1;
      if(nid){
        seen.adminFb['item_'+nid]=1;
        const fbIt=(Array.isArray(FEEDBACK.items)?FEEDBACK.items:[]).find(x=>x&&x.id===nid);
        if(fbIt&&Array.isArray(fbIt.messages)){
          fbIt.messages.forEach(m=>{if(m&&!m.isAdmin&&m.id) seen.adminFb['umsg_'+m.id]=1;});
        }
      }
      saveNotifSeen(seen);
      updateNotifBadges();
      UI.modal = 'feedback';
      FEEDBACK.activeTab = 'admin';
      FEEDBACK.activeFolderId = 'all';
      renderModal();
      fetchFeedback(false);
      return;
    }
      if(nkind==='patchnote'){
        if(nid){
          if(!PATCHNOTES.collapsedIds||typeof PATCHNOTES.collapsedIds!=='object') PATCHNOTES.collapsedIds={};
          PATCHNOTES.collapsedIds[nid]=false;
        }
        UI.modal='info'; UI.infoTab='patchnotes';
        if(CLOUD.currentUser&&PATCHNOTES.entries.length) PATCHNOTES.entries.forEach(e=>markNotifRead('patchnote',String(e.id)));
        renderModal(); fetchPatchnotes(false);
      }else if(nkind==='fb_reply'){
        const fbIt=(Array.isArray(FEEDBACK.items)?FEEDBACK.items:[]).find(x=>x&&String(x.id)===String(nid));
        if(fbIt&&Array.isArray(fbIt.messages)) fbIt.messages.forEach(m=>{if(m&&m.isAdmin&&m.id) markNotifRead('fb_reply',String(m.id));});
        UI.modal='feedback'; FEEDBACK.activeTab='mylog'; FEEDBACK.selectedId=nid;
        renderModal(); fetchFeedback(false);
      }
      break;
    }
    case 'open-admin-icons': {
      if(!CLOUD.isAdmin){toast('🔒 Nur für den Admin zugänglich.');break;}
      UI.adminReturnModal=(UI.modal==='adminPanel')?'adminPanel':'';
      UI.confirmResetAllIcons=false;
      UI.modal='adminIcons';
      renderModal();
      fetchCustomIcons(true);
      break;
    }
    case 'admin-icons-refresh': {
      if(!CLOUD.isAdmin){toast('🔒 Nur für den Admin zugänglich.');break;}
      fetchCustomIcons(true);
      break;
    }
    case 'admin-icon-pick': {
      if(!CLOUD.isAdmin){toast('🔒 Nur für den Admin zugänglich.');break;}
      UI.adminIconTargetKey=btn.dataset.ikey||'';
      const inp=$('fileAdminIcon');
      if(inp){inp.value='';inp.click();}
      break;
    }
    case 'admin-icon-reset': {
      if(!CLOUD.isAdmin){toast('🔒 Nur für den Admin zugänglich.');break;}
      const ikey=btn.dataset.ikey||'';
      if(!ikey) break;
      const next={...(CUSTOM_ICONS.icons||{})};
      delete next[ikey];
      UI.confirmResetAllIcons=false;
      saveCustomIconsToServer(next,'↺ Standard-Icon wiederhergestellt.');
      break;
    }
    case 'admin-icons-ask-reset-all': {
      if(!CLOUD.isAdmin){toast('🔒 Nur für den Admin zugänglich.');break;}
      UI.confirmResetAllIcons=true;
      renderModal();
      break;
    }
    case 'admin-icons-cancel-reset-all': {
      if(!CLOUD.isAdmin){toast('🔒 Nur für den Admin zugänglich.');break;}
      UI.confirmResetAllIcons=false;
      renderModal();
      break;
    }
    case 'admin-icons-confirm-reset-all': {
      if(!CLOUD.isAdmin){toast('🔒 Nur für den Admin zugänglich.');break;}
      UI.confirmResetAllIcons=false;
      saveCustomIconsToServer({},'↺ Alle Icons auf Standard zurückgesetzt.');
      break;
    }
    case 'open-feedback': UI.adminReturnModal=(UI.modal==='adminPanel')?'adminPanel':''; UI.modal='feedback'; FEEDBACK.activeTab=CLOUD.isAdmin?'admin':'write'; renderModal(); fetchFeedback(true); break;
    case 'fb-tab': {
      const nextTab=String(btn.dataset.tab||'write').trim();
      if(!CLOUD.isAdmin&&(nextTab==='admin'||nextTab==='backlog')){
        toast('🔒 Nur für den Admin zugänglich.');
        break;
      }
      FEEDBACK.activeTab=nextTab;
      renderModal();
      break;
    }
    case 'fb-refresh': fetchFeedback(true); break;
    case 'fb-submit': {
      if(!CLOUD.currentUser){
        toast('🔒 Bitte zuerst anmelden.');
        break;
      }
      const titleEl=$('fbDraftTitle');
      const bodyEl=$('fbDraftBody');
      const title=String(titleEl?titleEl.value:(FEEDBACK.draftTitle||'')).trim();
      const html=cleanInlineStyles(bodyEl?bodyEl.innerHTML:(FEEDBACK.draftHtml||''));
      if(!stripHtml(html).trim()){
        toast('⚠️ Bitte gib einen Feedback-Text ein.');
        break;
      }
      const id=uid(), ts=stamp(), tsMs=Date.now(), author=CLOUD.currentUser;
      saveFeedbackStore(store=>{
        if(!Array.isArray(store.items)) store.items=[];
        if(!Array.isArray(store.backlog)) store.backlog=[];
        store.items.unshift({
          id,
          author,
          title,
          html,
          ts,
          tsMs,
          folderId:'fb_inbox',
          order:0,
          messages:[],
          lastAdminReplyMs:0
        });
        store.backlog.unshift({
          id,
          author,
          title,
          html,
          ts,
          tsMs,
          status:'open',
          closedAt:''
        });
      }).then(ok=>{
        if(ok){
          FEEDBACK.draftTitle='';
          FEEDBACK.draftHtml='';
          FEEDBACK.activeTab='mylog';
          renderModal();
          toast('📨 Feedback erfolgreich an den Admin gesendet!');
        }
      });
      break;
    }
    case 'fb-select-folder': {
      if(!CLOUD.isAdmin) break;
      FEEDBACK.activeFolderId=String(btn.dataset.fid||'all').trim()||'all';
      FEEDBACK.confirmDelFolderId=null;
      renderModal();
      if(typeof renderFbAdminWin==='function'&&FBW?.open) renderFbAdminWin();
      break;
    }
    case 'fb-add-folder': {
      if(!CLOUD.isAdmin) break;
      const inp=document.querySelector('[data-fb-new-folder]');
      const rawName=String(inp?inp.value:(FEEDBACK.newFolderName||'')).trim();
      if(!rawName){toast('⚠️ Bitte einen Namen für den neuen Ordner eingeben.');break;}
      const newId='fb_f_'+uid();
      await saveFeedbackStore(store=>{
        if(!Array.isArray(store.folders)) store.folders=clone(DEF_FB_FOLDERS);
        if(store.folders.some(f=>f&&String(f.name||'').trim().toLowerCase()===rawName.toLowerCase())){
          toast('ℹ️ Ein Ordner mit diesem Namen existiert bereits.');
          return false;
        }
        store.folders.push({id:newId,name:rawName,isSystem:false});
        FEEDBACK.newFolderName='';
        FEEDBACK.activeFolderId=newId;
      },`📁 Ordner „${rawName}“ erstellt.`);
      break;
    }
    case 'fb-ask-del-folder': {
      if(!CLOUD.isAdmin) break;
      FEEDBACK.confirmDelFolderId=String(btn.dataset.fid||'').trim()||null;
      renderModal();
      if(typeof renderFbAdminWin==='function'&&FBW?.open) renderFbAdminWin();
      break;
    }
    case 'fb-cancel-del-folder': {
      FEEDBACK.confirmDelFolderId=null;
      renderModal();
      if(typeof renderFbAdminWin==='function'&&FBW?.open) renderFbAdminWin();
      break;
    }
    case 'fb-confirm-del-folder': {
      if(!CLOUD.isAdmin) break;
      const fid=String(btn.dataset.fid||'').trim();
      if(!fid||fid==='fb_inbox') break;
      await saveFeedbackStore(store=>{
        const fObj=(store.folders||[]).find(f=>f&&f.id===fid);
        if(!fObj||fObj.isSystem) return false;
        store.folders=store.folders.filter(f=>f&&f.id!==fid);
        (store.items||[]).forEach(it=>{if(it&&it.folderId===fid) it.folderId='fb_inbox';});
        FEEDBACK.confirmDelFolderId=null;
        if(FEEDBACK.activeFolderId===fid) FEEDBACK.activeFolderId='all';
      },'🗑️ Ordner gelöscht (Einträge in Posteingang verschoben).');
      break;
    }
    case 'fb-move-item': {
      if(!CLOUD.isAdmin) break;
      const id=String(btn.dataset.id||'').trim(), dir=toInt(btn.dataset.dir,0);
      if(!id||!dir) break;
      await saveFeedbackStore(store=>{
        const activeFid=FEEDBACK.activeFolderId||'all';
        const sortBy=FEEDBACK.sortBy||'newest';
        const vis=(store.items||[]).filter(it=>it&&(activeFid==='all'||String(it.folderId||'fb_inbox')===activeFid));
        vis.sort((a,b)=>{
          if(sortBy==='oldest') return toInt(a.tsMs,0)-toInt(b.tsMs,0);
          if(sortBy==='author') return String(a.author||'').localeCompare(String(b.author||''),'de')||(toInt(b.tsMs,0)-toInt(a.tsMs,0));
          if(sortBy==='manual') return (toInt(a.order,0)-toInt(b.order,0))||(toInt(b.tsMs,0)-toInt(a.tsMs,0));
          return toInt(b.tsMs,0)-toInt(a.tsMs,0);
        });
        vis.forEach((it,i)=>{it.order=i;});
        const idx=vis.findIndex(it=>it.id===id);
        const tIdx=idx+dir;
        if(idx<0||tIdx<0||tIdx>=vis.length) return false;
        const tmp=vis[idx].order;
        vis[idx].order=vis[tIdx].order;
        vis[tIdx].order=tmp;
        FEEDBACK.sortBy='manual';
      });
      break;
    }
    case 'fb-done-item': {
      if(!CLOUD.isAdmin) break;
      const id=String(btn.dataset.id||'').trim();
      if(!id) break;
      await saveFeedbackStore(store=>{
        const idx=(store.items||[]).findIndex(it=>it&&it.id===id);
        if(idx<0) return false;
        const [it]=store.items.splice(idx,1);
        const nowStr=stamp();
        if(!Array.isArray(store.backlog)) store.backlog=[];
        const bEntry=store.backlog.find(b=>b&&b.id===id);
        if(bEntry){
          bEntry.status='done';
          bEntry.closedAt=nowStr;
        }else{
          store.backlog.unshift({id:it.id,author:it.author,title:it.title,html:it.html,ts:it.ts,tsMs:it.tsMs,status:'done',closedAt:nowStr});
        }
        if(FEEDBACK.confirmDelId===id) FEEDBACK.confirmDelId=null;
        if(FEEDBACK.replyDrafts) delete FEEDBACK.replyDrafts[id];
      },'✅ Feedback als erledigt abgeschlossen.');
      break;
    }
    case 'fb-ask-del-item': {
      if(!CLOUD.isAdmin) break;
      FEEDBACK.confirmDelId=String(btn.dataset.id||'').trim()||null;
      renderModal();
      if(typeof renderFbAdminWin==='function'&&FBW?.open) renderFbAdminWin();
      break;
    }
    case 'fb-cancel-del-item': {
      FEEDBACK.confirmDelId=null;
      renderModal();
      if(typeof renderFbAdminWin==='function'&&FBW?.open) renderFbAdminWin();
      break;
    }
    case 'fb-confirm-del-item': {
      if(!CLOUD.isAdmin) break;
      const id=String(btn.dataset.id||'').trim();
      if(!id) break;
      await saveFeedbackStore(store=>{
        const idx=(store.items||[]).findIndex(it=>it&&it.id===id);
        if(idx<0) return false;
        const [it]=store.items.splice(idx,1);
        const nowStr=stamp();
        if(!Array.isArray(store.backlog)) store.backlog=[];
        const bEntry=store.backlog.find(b=>b&&b.id===id);
        if(bEntry){
          bEntry.status='deleted';
          bEntry.closedAt=nowStr;
        }else{
          store.backlog.unshift({id:it.id,author:it.author,title:it.title,html:it.html,ts:it.ts,tsMs:it.tsMs,status:'deleted',closedAt:nowStr});
        }
        FEEDBACK.confirmDelId=null;
        if(FEEDBACK.replyDrafts) delete FEEDBACK.replyDrafts[id];
      },'🗑️ Feedback gelöscht.');
      break;
    }
    case 'fb-send-reply': {
      const id=String(btn.dataset.id||'').trim();
      const asAdmin=btn.dataset.asadmin==='1';
      if(!id) break;
      if(asAdmin){
        if(!CLOUD.isAdmin){toast('🔒 Nur der Admin kann als Admin antworten.');break;}
      }else{
        if(!CLOUD.currentUser){toast('🔒 Bitte melde dich zuerst an, um zu antworten.');break;}
        const curItem=(Array.isArray(FEEDBACK.items)?FEEDBACK.items:[]).find(x=>x&&x.id===id);
        if(curItem&&String(curItem.author||'').toLowerCase()!==CLOUD.currentUser.toLowerCase()){
          toast('🔒 Du kannst nur auf dein eigenes Feedback antworten.');
          break;
        }
      }
      if(!FEEDBACK.replyDrafts||typeof FEEDBACK.replyDrafts!=='object') FEEDBACK.replyDrafts={};
      const rawHtml=String(FEEDBACK.replyDrafts[id]||'');
      if(!stripHtml(rawHtml).trim()){
        toast('⚠️ Bitte gib zuerst eine Antwort ein.');
        break;
      }
      if(asAdmin){markNotifRead('fb_admin','item_'+id);const _it=(FEEDBACK.items||[]).find(x=>x&&x.id===id);if(_it&&Array.isArray(_it.messages))_it.messages.forEach(m=>{if(m&&!m.isAdmin&&m.id)markNotifRead('fb_admin','umsg_'+m.id);});setTimeout(()=>refreshUserNotificationsBg(false),50);}saveFeedbackStore(store=>{
        const target=(store.items||[]).find(x=>x&&x.id===id);
        if(!target){
          toast('Dieses Feedback wurde bereits geschlossen.');
          return false;
        }
        if(!asAdmin&&(!CLOUD.currentUser||String(target.author||'').toLowerCase()!==CLOUD.currentUser.toLowerCase())){
          toast('🔒 Du kannst nur auf dein eigenes Feedback antworten.');
          return false;
        }
        if(!Array.isArray(target.messages)) target.messages=[];
        target.messages.push({
          id:uid(),
          author:asAdmin?'Admin':CLOUD.currentUser,
          isAdmin:asAdmin,
          html:cleanInlineStyles(rawHtml),
          ts:stamp(),
          tsMs:Date.now()
        });
        if(asAdmin){
          target.lastAdminReplyMs=Date.now();
          const bEntry=(store.backlog||[]).find(b=>b&&b.id===id);
          if(bEntry) bEntry.status='answered';
        }
        FEEDBACK.replyDrafts[id]='';
      }).then(ok=>{
        if(ok){
          FEEDBACK.replyDrafts[id]='';
          toast(asAdmin?'📨 Admin-Antwort gesendet!':'📨 Antwort gesendet!');
          if(UI.modal==='feedback') renderModal();
          if(typeof renderFbAdminWin==='function'&&typeof FBW!=='undefined'&&FBW?.open) renderFbAdminWin();
        }
      });
      break;
    }
    case 'close-modal': case 'close-modal-bg': closeActiveModal(); break;
    case 'info-tab': UI.infoTab=el.dataset.itab; if(UI.infoTab==='patchnotes'&&CLOUD.currentUser&&PATCHNOTES.entries.length) PATCHNOTES.entries.forEach(e=>markNotifRead('patchnote',String(e.id))); renderModal(); if(UI.infoTab==='patchnotes'&&!PATCHNOTES.loaded&&!PATCHNOTES.loading) fetchPatchnotes(false).then(()=>{if(UI.modal==='info'&&UI.infoTab==='patchnotes'&&CLOUD.currentUser&&PATCHNOTES.entries.length) PATCHNOTES.entries.forEach(e=>markNotifRead('patchnote',String(e.id)));}); break;
    case 'pn-refresh': fetchPatchnotes(true); break;
    case 'pn-new': {
      if(!CLOUD.isAdmin) return;
      PATCHNOTES.editingId='__new__';
      PATCHNOTES.draft={id:uid(),title:'',version:'',ts:stamp(),updatedAt:'',intro:'',items:[{id:uid(),heading:'',text:''}]};
      PATCHNOTES.confirmDelId=null;
      renderModal(false,true);
      break;
    }
    case 'pn-edit': {
      if(!CLOUD.isAdmin) return;
      const id=String(el.dataset.id||'').trim();
      const found=(PATCHNOTES.entries||[]).find(x=>x&&x.id===id);
      if(!found) return;
      PATCHNOTES.editingId=found.id;
      if(!PATCHNOTES.collapsedIds||typeof PATCHNOTES.collapsedIds!=='object') PATCHNOTES.collapsedIds={};
      PATCHNOTES.collapsedIds[found.id]=false;
      PATCHNOTES.draft=clone(found);
      if(!Array.isArray(PATCHNOTES.draft.items)||!PATCHNOTES.draft.items.length){
        PATCHNOTES.draft.items=[{id:uid(),heading:'',text:''}];
      }
      PATCHNOTES.confirmDelId=null;
      renderModal(false,true);
      break;
    }
    case 'pn-cancel': {
      if(!CLOUD.isAdmin) return;
      PATCHNOTES.editingId=null;
      PATCHNOTES.draft=null;
      renderModal();
      break;
    }
    case 'pn-set-now': {
      if(!CLOUD.isAdmin) return;
      if(!PATCHNOTES.draft) return;
      PATCHNOTES.draft.ts=stamp();
      const tsInp=document.querySelector('[data-pn-field="ts"]');
      if(tsInp) tsInp.value=PATCHNOTES.draft.ts;
      else renderModal();
      break;
    }
    case 'pn-item-add': {
      if(!CLOUD.isAdmin) return;
      if(!PATCHNOTES.draft) return;
      if(!Array.isArray(PATCHNOTES.draft.items)) PATCHNOTES.draft.items=[];
      PATCHNOTES.draft.items.push({id:uid(),heading:'',text:''});
      renderModal();
      break;
    }
    case 'pn-item-del': {
      if(!CLOUD.isAdmin) return;
      if(!PATCHNOTES.draft||!Array.isArray(PATCHNOTES.draft.items)) return;
      const idx=toInt(el.dataset.idx,-1);
      if(idx>=0&&idx<PATCHNOTES.draft.items.length){
        PATCHNOTES.draft.items.splice(idx,1);
        if(!PATCHNOTES.draft.items.length) PATCHNOTES.draft.items.push({id:uid(),heading:'',text:''});
        renderModal();
      }
      break;
    }
    case 'pn-item-move': {
      if(!CLOUD.isAdmin) return;
      if(!PATCHNOTES.draft||!Array.isArray(PATCHNOTES.draft.items)) return;
      const idx=toInt(el.dataset.idx,-1), dir=toInt(el.dataset.dir,0), nxt=idx+dir;
      if(idx>=0&&nxt>=0&&idx<PATCHNOTES.draft.items.length&&nxt<PATCHNOTES.draft.items.length){
        const [it]=PATCHNOTES.draft.items.splice(idx,1);
        PATCHNOTES.draft.items.splice(nxt,0,it);
        renderModal();
      }
      break;
    }
    case 'pn-save': {
      if(!CLOUD.isAdmin) return;
      if(!PATCHNOTES.draft||PATCHNOTES.saving) return;
      const cleanItems=(Array.isArray(PATCHNOTES.draft.items)?PATCHNOTES.draft.items:[]).map(it=>({
        id:String(it?.id||'').trim()||uid(),
        heading:String(it?.heading??'').trim(),
        text:String(it?.text??'').trim()
      })).filter(it=>it.heading||it.text);
      const cleanTitle=String(PATCHNOTES.draft.title??'').trim();
      if(!cleanTitle&&!cleanItems.length){
        toast('⚠️ Bitte mindestens einen Titel oder einen Punkt (Oberbegriff/Erklärung) ausfüllen.');
        return;
      }
      const isNew=PATCHNOTES.editingId==='__new__' || !(PATCHNOTES.entries||[]).some(e=>e&&e.id===PATCHNOTES.editingId);
      const nowTs=stamp();
      const cleanTs=String(PATCHNOTES.draft.ts??'').trim()||nowTs;
      const entryObj=normalizePatchnoteEntry({
        id:isNew?(String(PATCHNOTES.draft.id||'').trim()||uid()):PATCHNOTES.editingId,
        title:cleanTitle||'Patchnotes',
        version:String(PATCHNOTES.draft.version??'').trim(),
        ts:cleanTs,
        tsMs:parsePatchnoteTsMs(cleanTs,Date.now()),
        updatedAt:isNew?cleanTs:nowTs,
        intro:String(PATCHNOTES.draft.intro??'').trim(),
        items:cleanItems
      });
      const nextEntries=clone(PATCHNOTES.entries||[]);
      if(isNew){
        nextEntries.unshift(entryObj);
      }else{
        const eIdx=nextEntries.findIndex(e=>e&&e.id===PATCHNOTES.editingId);
        if(eIdx>=0) nextEntries[eIdx]=entryObj;
        else nextEntries.unshift(entryObj);
      }
      (async()=>{
        const ok=await savePatchnotesToServer(nextEntries,isNew?'☁️ Neuer Patchnotes-Eintrag gespeichert!':'☁️ Patchnotes-Eintrag aktualisiert!');
        if(ok){
          PATCHNOTES.editingId=null;
          PATCHNOTES.draft=null;
          renderModal();
        }
      })();
      break;
    }
    case 'pn-toggle-sort': {
      PATCHNOTES.sortOrder=PATCHNOTES.sortOrder==='asc'?'desc':'asc';
      renderModal();
      break;
    }
    case 'pn-toggle-collapse': {
      const id=String(el.dataset.id||'').trim();
      if(!id) return;
      const entry=(PATCHNOTES.entries||[]).find(e=>e&&e.id===id);
      const edId=CLOUD.isAdmin?PATCHNOTES.editingId:null;
      const cur=isPatchnoteCollapsed(entry||{id},getNewestPatchnoteId(),edId);
      if(!PATCHNOTES.collapsedIds||typeof PATCHNOTES.collapsedIds!=='object') PATCHNOTES.collapsedIds={};
      PATCHNOTES.collapsedIds[id]=!cur;
      renderModal();
      break;
    }
    case 'pn-toggle-all-collapse': {
      const entries=Array.isArray(PATCHNOTES.entries)?PATCHNOTES.entries:[];
      if(!entries.length) return;
      const newestId=getNewestPatchnoteId(entries);
      const edId=CLOUD.isAdmin?PATCHNOTES.editingId:null;
      const anyCol=entries.some(e=>isPatchnoteCollapsed(e,newestId,edId));
      const nextState=!anyCol;
      if(!PATCHNOTES.collapsedIds||typeof PATCHNOTES.collapsedIds!=='object') PATCHNOTES.collapsedIds={};
      entries.forEach(e=>{if(e&&e.id) PATCHNOTES.collapsedIds[e.id]=nextState;});
      renderModal();
      break;
    }
    case 'pn-ask-del': {
      if(!CLOUD.isAdmin) return;
      PATCHNOTES.confirmDelId=String(el.dataset.id||'').trim()||null;
      renderModal();
      break;
    }
    case 'pn-cancel-del': {
      if(!CLOUD.isAdmin) return;
      PATCHNOTES.confirmDelId=null;
      renderModal();
      break;
    }
    case 'pn-confirm-del': {
      if(!CLOUD.isAdmin) return;
      const id=String(el.dataset.id||'').trim();
      if(!id) return;
      const nextEntries=(PATCHNOTES.entries||[]).filter(e=>e&&e.id!==id);
      PATCHNOTES.confirmDelId=null;
      if(PATCHNOTES.editingId===id){
        PATCHNOTES.editingId=null;
        PATCHNOTES.draft=null;
      }
      savePatchnotesToServer(nextEntries,'🗑️ Patchnotes-Eintrag gelöscht.');
      break;
    }
    case 'toggle-dark': S.appearance.dark=!S.appearance.dark; syncPalDraftFromSlot(); applyTheme(); persistCurrentThemeChange({scope:'dark'}); renderModal(); if(!UI.inLobby) save(); break;
    case 'app-mode': S.appearance.mode=el.dataset.mode; S.appearance.editScope=S.activeTab; syncPalDraftFromSlot(); applyTheme(); persistCurrentThemeChange({scope:'sheet'}); renderModal(); if(!UI.inLobby) save(); break;
    case 'edit-scope': S.appearance.editScope=el.dataset.scope; syncPalDraftFromSlot(); applyTheme(); renderModal(); break;
    case 'pick-pal': {const sl=getEditStyleSlot();sl.palette=el.dataset.pal;sl.customColors=null;syncPalDraftFromSlot(sl);applyTheme();persistCurrentThemeChange({scope:'auto'});renderModal();if(!UI.inLobby) save();break;}
    case 'toggle-pal-builder': UI.palBuilderOpen=!UI.palBuilderOpen; if(UI.palBuilderOpen)syncPalDraftFromSlot(); renderModal(); break;
    case 'pal-draft-islt': {UI.palDraft.isLt=!UI.palDraft.isLt;const sl=getEditStyleSlot();sl.customColors={...UI.palDraft};applyTheme();persistCurrentThemeChange({scope:'auto'});renderModal();if(!UI.inLobby) save();break;}
    case 'save-custom-pal': {
      const nm=(($('inpCustomPalName')?.value||UI.palDraft.name||'').trim())||`Eigene Palette ${(S.customPalettes?.length||0)+1}`;
      const np={id:'cp_'+uid(),name:nm,isLt:Boolean(UI.palDraft.isLt),bg:UI.palDraft.bg||'#020617',acc:UI.palDraft.acc||'#0ea5e9',acc2:UI.palDraft.acc2||'#6366f1',txt:UI.palDraft.txt||'#f1f5f9',mut:UI.palDraft.mut||'#94a3b8',btnTxt:UI.palDraft.btnTxt||'#ffffff'};
      if(!Array.isArray(S.customPalettes)) S.customPalettes=[];
      S.customPalettes.push(np);
      const sl=getEditStyleSlot(); sl.palette=np.id; sl.customColors=null;
      UI.palDraft.name=np.name;
      applyTheme(); persistCurrentThemeChange({scope:'palettes'}); renderModal(); if(!UI.inLobby) save(); toast(`🎨 Farbpalette „${nm}“ gespeichert!`);
      break;
    }
    case 'update-custom-pal': {
      const cp=(S.customPalettes||[]).find(p=>p.id===el.dataset.id);
      if(cp){
        const nm=(($('inpCustomPalName')?.value||UI.palDraft.name||cp.name).trim())||cp.name;
        Object.assign(cp,{name:nm,isLt:Boolean(UI.palDraft.isLt),bg:UI.palDraft.bg,acc:UI.palDraft.acc,acc2:UI.palDraft.acc2,txt:UI.palDraft.txt,mut:UI.palDraft.mut,btnTxt:UI.palDraft.btnTxt});
        const sl=getEditStyleSlot(); sl.palette=cp.id; sl.customColors=null;
        applyTheme(); persistCurrentThemeChange({scope:'palettes'}); renderModal(); if(!UI.inLobby) save(); toast(`✓ Farbpalette „${nm}“ aktualisiert!`);
      }
      break;
    }
    case 'del-custom-pal': {
      const pid=el.dataset.id;
      S.customPalettes=(S.customPalettes||[]).filter(p=>p.id!==pid);
      if(S.appearance.global.palette===pid) S.appearance.global.palette='azur';
      if(S.appearance.lobby?.palette===pid) S.appearance.lobby.palette='azur';
      TABS.forEach(t=>{if(S.appearance.tabs[t.id]?.palette===pid)S.appearance.tabs[t.id].palette='azur';});
      syncPalDraftFromSlot(); applyTheme(); persistCurrentThemeChange({scope:'palettes'}); renderModal(); if(!UI.inLobby) save(); toast('Eigene Farbpalette gelöscht');
      break;
    }
    case 'pick-bg': openImgMenu('bg','',UI.modal==='settings'?'settings':''); break;
    case 'export-json': {const nm=(S.profile.name||'Scherbensturm_Charakter').replace(/[^a-zA-Z0-9äöüÄÖÜß_-]/g,'_'),a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(S,null,2)],{type:'application/json'}));a.download=`${nm}_Stufe${S.progression.level}.json`;a.click();URL.revokeObjectURL(a.href);toast('Charakterbogen exportiert (.json)');break;}
    case 'import-json': $('fileImport').click(); break;
    case 'open-pw-library': {
      UI.modal='powerLibrary';
      PWLIB.confirmDelPackId='';
      PWLIB.selectedPackId='';
      PWLIB.openCats={};
      PWLIB.openPacks={};
      PWLIB.openAugFolders={};
      if(!CLOUD.isAdmin&&PWLIB.tab==='admin') PWLIB.tab='server';
      renderModal();
      fetchPowerLibrary(false);
      break;
    }
    case 'pwlib-tab': {
      const nextTab=String(el.dataset.tab||'server');
      PWLIB.tab=(nextTab==='admin'&&!CLOUD.isAdmin)?'server':nextTab;
      PWLIB.confirmDelPackId='';
      renderModal();
      break;
    }
    case 'pwlib-reload': {
      await fetchPowerLibrary(true);
      toast(PWLIB.error?`⚠️ ${PWLIB.error}`:`🔄 Bibliothek aktualisiert (${getAllLibraryPacks().length} Pakete)`);
      break;
    }
    case 'pwlib-sync-basis': {
      const mode=el.dataset.mode==='updateExisting'?'updateExisting':'skipExisting';
      await fetchAndSyncBasisPowers(mode);
      if(UI.modal==='powerLibrary') renderModal();
      break;
    }
    case 'pwlib-toggle-cat': {
      const cat=String(el.dataset.cat||'');
      if(!cat) break;
      if(!PWLIB.openCats) PWLIB.openCats={};
      PWLIB.openCats[cat]=!(el.dataset.open==='1');
      refreshPwLibListDOM();
      break;
    }
    case 'pwlib-toggle-pack':
    case 'pwlib-select-pack': {
      const pid=String(el.dataset.id||'');
      if(!pid) break;
      if(!PWLIB.openPacks) PWLIB.openPacks={};
      const nextOpen=!(el.dataset.open==='1');
      PWLIB.openPacks[pid]=nextOpen;
      PWLIB.selectedPackId=nextOpen?pid:(PWLIB.selectedPackId===pid?'':PWLIB.selectedPackId);
      refreshPwLibListDOM();
      break;
    }
    case 'pwlib-toggle-aug-folder': {
      const fkey=String(el.dataset.fkey||'');
      if(!fkey) break;
      if(!PWLIB.openAugFolders) PWLIB.openAugFolders={};
      PWLIB.openAugFolders[fkey]=!(el.dataset.open==='1');
      refreshPwLibListDOM();
      break;
    }
    case 'pwlib-toggle-aug-folder-all': {
      const packId=String(el.dataset.pack||''), pwId=String(el.dataset.power||'');
      const allPacks=getAllLibraryPacks();
      const pk=allPacks.find(p=>p.id===packId);
      const pw=(pk?.powers||[]).find(p=>String(p.id||'')===pwId);
      if(!pk||!pw) break;
      const ids=getSuggestedAugmentsForPower(pw,pk,allPacks).map(x=>String(x.aug?.id||'')).filter(Boolean);
      if(!ids.length) break;
      const allSel=ids.every(id=>Boolean(PWLIB.selAugIds?.[id]));
      ids.forEach(id=>{if(allSel) delete PWLIB.selAugIds[id]; else PWLIB.selAugIds[id]=true;});
      refreshPwLibListDOM();
      break;
    }
    case 'pwlib-toggle-sel': {
      const kind=el.dataset.kind||'', id=String(el.dataset.id||''), packId=String(el.dataset.pack||PWLIB.selectedPackId||'');
      if(!id) break;
      if(kind==='section'){
        const pk=getAllLibraryPacks().find(p=>p.id===packId);
        if(!pk) break;
        const next=!Boolean(PWLIB.selSecIds[id]);
        const secs=Array.isArray(pk.sections)?pk.sections:[];
        const pws=Array.isArray(pk.powers)?pk.powers:[];
        const secIdSet=new Set([id]), queue=[id];
        while(queue.length){
          const cur=queue.shift();
          secs.forEach(s=>{if(s&&String(s.parentSectionId||'')===cur&&!secIdSet.has(String(s.id||''))){secIdSet.add(String(s.id));queue.push(String(s.id));}});
        }
        const augs=Array.isArray(pk.augments)?pk.augments:[];
        const pwIdSet=new Set();
        secIdSet.forEach(sid=>{if(next)PWLIB.selSecIds[sid]=true;else delete PWLIB.selSecIds[sid];});
        pws.forEach(p=>{if(p&&secIdSet.has(String(p.sectionId||''))){const pid=String(p.id||'');pwIdSet.add(pid);if(next)PWLIB.selPwIds[pid]=true;else delete PWLIB.selPwIds[pid];}});
        augs.forEach(a=>{if(!a)return;const aid=String(a.id||''),ppid=String(a.parentPowerId||''),sid=String(a.sectionId||'');if(aid&&((ppid&&pwIdSet.has(ppid))||(!ppid&&sid&&secIdSet.has(sid)))){if(next)PWLIB.selAugIds[aid]=true;else delete PWLIB.selAugIds[aid];}});
      }else if(kind==='power'){
        if(PWLIB.selPwIds[id]) delete PWLIB.selPwIds[id]; else PWLIB.selPwIds[id]=true;
      }else if(kind==='augment'){
        if(PWLIB.selAugIds[id]) delete PWLIB.selAugIds[id]; else PWLIB.selAugIds[id]=true;
      }
      refreshPwLibListDOM();
      break;
    }
    case 'pwlib-import-pack': {
      const pid=String(el.dataset.id||PWLIB.selectedPackId||'');
      const allPacks=getAllLibraryPacks();
      const pk=allPacks.find(p=>p.id===pid);
      if(!pk){toast('⚠️ Paket nicht gefunden.');break;}
      const res=importPowerPackIntoSheet(pk,{targetSectionId:PWLIB.targetSecId,dedupeMode:PWLIB.dedupeMode,allPacks});
      toast(formatPwLibImportToast(res,pk.name));
      break;
    }
    case 'pwlib-import-sec': {
      const pid=String(el.dataset.pack||PWLIB.selectedPackId||''), secId=String(el.dataset.sec||'');
      const allPacks=getAllLibraryPacks();
      const pk=allPacks.find(p=>p.id===pid);
      if(!pk||!secId){toast('⚠️ Sektion nicht gefunden.');break;}
      const secObj=(pk.sections||[]).find(s=>String(s.id||'')===secId);
      const res=importPowerPackIntoSheet(pk,{targetSectionId:PWLIB.targetSecId,dedupeMode:PWLIB.dedupeMode,onlySectionIds:[secId],allPacks});
      toast(formatPwLibImportToast(res,secObj?.name||pk.name));
      break;
    }
    case 'pwlib-import-selected': {
      const pid=String(el.dataset.id||PWLIB.selectedPackId||'');
      const allPacks=getAllLibraryPacks();
      const pk=allPacks.find(p=>p.id===pid);
      if(!pk){toast('⚠️ Paket nicht gefunden.');break;}
      const secIdSet=new Set((pk.sections||[]).map(s=>String(s.id||'')));
      const pwIdSet=new Set((pk.powers||[]).map(p=>String(p.id||'')));
      const packAugIdSet=new Set((pk.augments||[]).map(a=>String(a.id||'')));
      const extraCrossAugs=[], extraCrossSeen=new Set();
      (pk.powers||[]).forEach(p=>{
        getSuggestedAugmentsForPower(p,pk,allPacks).forEach(entry=>{
          const aid=String(entry.aug?.id||'');
          if(entry.isCrossPack&&aid&&PWLIB.selAugIds?.[aid]&&!packAugIdSet.has(aid)&&!extraCrossSeen.has(aid)){
            extraCrossSeen.add(aid);
            const augCopy=clone(entry.aug);
            if(!augCopy.parentPowerName&&!augCopy.parentPower){
              augCopy.parentPowerName=resolveLibraryAugmentParentName(entry.aug,entry.sourcePack,allPacks)||String(p.name||'');
            }
            extraCrossAugs.push(augCopy);
          }
        });
      });
      const onlySectionIds=Object.keys(PWLIB.selSecIds||{}).filter(k=>PWLIB.selSecIds[k]&&secIdSet.has(k));
      const onlyPowerIds=Object.keys(PWLIB.selPwIds||{}).filter(k=>PWLIB.selPwIds[k]&&pwIdSet.has(k));
      const onlyAugmentIds=Object.keys(PWLIB.selAugIds||{}).filter(k=>PWLIB.selAugIds[k]&&(packAugIdSet.has(k)||extraCrossSeen.has(k)));
      if(!onlySectionIds.length&&!onlyPowerIds.length&&!onlyAugmentIds.length){toast('ℹ️ Bitte zuerst mindestens eine Sektion, Kraft oder ein Augment auswählen.');break;}
      const importPack=extraCrossAugs.length?{...pk,augments:[...(pk.augments||[]),...extraCrossAugs]}:pk;
      const res=importPowerPackIntoSheet(importPack,{targetSectionId:PWLIB.targetSecId,dedupeMode:PWLIB.dedupeMode,onlySectionIds,onlyPowerIds,onlyAugmentIds,allPacks});
      toast(formatPwLibImportToast(res,`${pk.name} (Auswahl)`));
      break;
    }
    case 'pwlib-publish-cloud': {
      if(!CLOUD.isAdmin){toast('🔒 Nur der Admin kann hier Pakete veröffentlichen.');break;}
      const pack=buildAdminDraftPack();
      if(!pack.sections.length&&!pack.powers.length&&!pack.augments.length){toast('⚠️ Die gewählte Quelle enthält keine Sektionen, Kräfte oder Augmente.');break;}
      await publishPackToCloudLibrary(pack);
      break;
    }
    case 'pwlib-download-repo-json': {
      if(!CLOUD.isAdmin){toast('🔒 Nur für Admins verfügbar.');break;}
      const newPack=stripLibraryPackMeta(buildAdminDraftPack());
      if(!newPack.sections.length&&!newPack.powers.length&&!newPack.augments.length){toast('⚠️ Die gewählte Quelle enthält keine Sektionen, Kräfte oder Augmente.');break;}
      const existing=(PWLIB.repoPacks||[]).map(stripLibraryPackMeta);
      const idx=existing.findIndex(p=>p&&(p.id===newPack.id||(newPack.isBasisPack&&p.isBasisPack)));
      if(idx>=0) existing[idx]=newPack; else existing.push(newPack);
      const repoPayload={schema:'scherbensturm_power_library_v1',updatedAt:stamp(),packs:existing};
      downloadPowerPackJson(repoPayload,'powers-library');
      toast(`📥 powers-library.json mit „${newPack.name}“ heruntergeladen!`);
      break;
    }
    case 'pwlib-del-cloud': {
      if(!CLOUD.isAdmin) break;
      const pid=String(el.dataset.id||'');
      if(!pid) break;
      if(PWLIB.confirmDelPackId===pid){
        PWLIB.confirmDelPackId='';
        await deletePackFromCloudLibrary(pid);
      }else{
        PWLIB.confirmDelPackId=pid;
        renderModal();
      }
      break;
    }
    case 'pwlib-cancel-del-cloud': PWLIB.confirmDelPackId=''; renderModal(); break;
    case 'export-pw-all': {
      const pack=buildPowerExportPack({mode:'all'});
      if(!pack.sections.length&&!pack.powers.length&&!pack.augments.length){toast('ℹ️ Keine Kräfte, Augmente oder Sektionen zum Exportieren vorhanden.');break;}
      downloadPowerPackJson(pack);
      toast(`📤 Paket „${pack.name}“ (${pack.powers.length} Kräfte, ${pack.augments.length} Augm.) exportiert!`);
      break;
    }
    case 'export-pw-sec': {
      const secId=String(el.dataset.id||'');
      const pack=buildPowerExportPack({mode:'section',sectionId:secId});
      if(!pack.sections.length){toast('⚠️ Sektion nicht gefunden.');break;}
      downloadPowerPackJson(pack);
      toast(`📤 Sektion „${pack.name}“ (${pack.sections.length} Sekt., ${pack.powers.length} Kräfte, ${pack.augments.length} Augm.) exportiert!`);
      break;
    }
    case 'export-pw-item': {
      const kind=el.dataset.kind==='augment'?'augment':'power', id=String(el.dataset.id||'');
      const pack=buildPowerExportPack({mode:'item',kind,id});
      if(!pack.powers.length&&!pack.augments.length){toast('⚠️ Eintrag nicht gefunden.');break;}
      downloadPowerPackJson(pack);
      toast(`📤 ${kind==='augment'?'Augment':'Kraft'} „${pack.name}“ exportiert!`);
      break;
    }
    case 'pwlib-pick-file': $('filePwImport')?.click(); break;
    case 'new-sheet-ask': UI.confirmNew=true; renderModal(); break;
    case 'new-sheet-no': UI.confirmNew=false; renderModal(); break;
    case 'new-sheet-yes': await flushBeforeCharacterSwitch(); CLOUD.viewingRemote=false; CLOUD.remoteCharId=''; setS(defaultState()); if(CLOUD.currentUser) S.owner=CLOUD.currentUser; UI.inLobby=false; UI.sheetLoaded=true; UI.modal=null; UI.confirmNew=false; applySessionTheme({allowSheetFallback:false,forSheet:true}); resetCloudSyncState({clearMeta:true,status:'saved',lastSyncTs:''}); exitLobbyNeutralDice(); renderAll(false); toast('Neuer Charakterbogen geladen'); break;
  }
});

document.addEventListener('focusin',e=>{if(e.target.dataset?.cres==='name') e.target.dataset.prevCres=cresName();if(e.target.dataset?.exsec?.endsWith(':name')){const id=e.target.dataset.exsec.split(':')[0],ex=(S.extraSecList||[]).find(x=>x.id===id);if(ex)e.target.dataset.prevExName=getExtraSecName(ex);}if(e.target.dataset?.sk?.endsWith(':name')){const id=e.target.dataset.sk.split(':')[0],sk=S.skills.find(x=>x.id===id);if(sk)e.target.dataset.prevSkName=String(sk.name||'').trim();}if(e.target.dataset?.pwf?.endsWith(':name')){const [kind,id]=e.target.dataset.pwf.split(':'),it=findPwItem(kind,id);if(it)e.target.dataset.prevName=String(it.name||'');}});

document.addEventListener('input',e=>{
  if(e.target?.dataset?.combatOfferInp){
    const oid=e.target.dataset.combatOfferInp;
    const of=(DUEL.damageOffers||[]).find(x=>x&&x.offerId===oid);
    if(of){
      of.editOpen=true;
      of.editAmount=Math.max(0,toInt(e.target.value,0));
    }
    return;
  }
  if(e.target?.dataset?.glossSearch){
    UI.glossSearch=e.target.value;
    updateInfoGlossaryGridDOM();
    return;
  }
  if(e.target?.dataset?.pnField){
    if(!CLOUD.isAdmin||!PATCHNOTES.draft) return;
    const f=e.target.dataset.pnField;
    if(f==='title'||f==='version'||f==='ts'||f==='intro') PATCHNOTES.draft[f]=e.target.value;
    return;
  }
  if(e.target?.dataset?.pnItem){
    if(!CLOUD.isAdmin||!PATCHNOTES.draft||!Array.isArray(PATCHNOTES.draft.items)) return;
    const [idxStr,field]=e.target.dataset.pnItem.split(':');
    const idx=toInt(idxStr,-1);
    if(idx>=0&&idx<PATCHNOTES.draft.items.length&&(field==='heading'||field==='text')){
      PATCHNOTES.draft.items[idx][field]=e.target.value;
    }
    return;
  }
  if(e.target?.dataset?.pwlibInp){
    const f=e.target.dataset.pwlibInp;
    PWLIB[f]=e.target.value;
    if(f==='search'){
      if(!String(PWLIB.search||'').trim()){PWLIB.openCats={};PWLIB.openPacks={};PWLIB.openAugFolders={};}
      refreshPwLibListDOM();
    }
    return;
  }
  if(e.target?.id==='inpNewCharName'){CLOUD.newCharName=e.target.value;return;}
  if(e.target?.id==='inpNewCharAncestry'){CLOUD.newCharAncestry=e.target.value;return;}
  if(e.target?.id==='inpNewCharConcept'){CLOUD.newCharConcept=e.target.value;return;}
  if(e.target&&e.target.dataset?.regenOvr){
    const el=e.target, k=el.dataset.regenOvr, raw=el.value.trim();
    const M=calcActiveMods(), auto=k==='lp'?getLpRegenAuto(M):getMlpRegenAuto(M);
    const f=k==='lp'?'lpRegenOvr':'mlpRegenOvr';
    if(raw===''||raw==='-'){
      S.secondary[f]='';
    }else{
      const n=toInt(raw,auto);
      S.secondary[f]=String(Math.max(0,n));
    }
    const hasOvr=k==='lp'?hasLpRegenOvr():hasMlpRegenOvr();
    const eff=k==='lp'?getLpRegen(M):getMlpRegen(M);
    el.classList.toggle('!border-amber-400',hasOvr);
    el.classList.toggle('text-amber-300',hasOvr);
    el.classList.toggle('text-acc',!hasOvr);
    const rst=$(k==='lp'?'rst_lpRegenOvr':'rst_mlpRegenOvr');
    if(rst){rst.textContent=`(${auto})`;rst.classList.toggle('hidden',!hasOvr);}
    const r4=$(k==='lp'?'val_lpReg4':'val_mlpReg4');
    if(r4) r4.textContent=`+${eff*2} ${k==='lp'?'LP':'mLP'}`;
    const tipEl=$(k==='lp'?'tip_lpRegen':'tip_mlpRegen');
    if(tipEl) tipEl.dataset.tip=buildSecTip(k==='lp'?'lpRegen':'mlpRegen',M);
    const hp=$('hdrPills'); if(hp) hp.innerHTML=buildHdrPillsHtml(calcProg());
    save();
    return;
  }
  if(e.target&&e.target.dataset?.inspInp){
    S.inspiration=Math.max(0,toInt(e.target.value,0));
    if($('inspBadgeCnt')) $('inspBadgeCnt').textContent=`${S.inspiration} Stapel`;
    if($('t1StatusInspChip')) $('t1StatusInspChip').textContent=`✨ Insp. ${S.inspiration}×`;
    save();
    return;
  }
  const stEl=e.target;
  if(stEl&&stEl.dataset&&stEl.dataset.stStacks){
    const k=stEl.dataset.stStacks;
    if(!S.statusEffects) S.statusEffects=makeDefaultStatusEffects();
    if(S.statusEffects[k]){
      const raw=String(stEl.value||'').trim();
      if(raw!==''&&/^\d+$/.test(raw)){
        withPoolSync(()=>{S.statusEffects[k].stacks=Math.max(1,toInt(raw,1));});
        syncLiveCalculations(); renderHeader();
      }
    }
    return;
  }
  if(stEl&&stEl.dataset&&stEl.dataset.stOvr){
    const [k,fld]=stEl.dataset.stOvr.split(':');
    if(!S.statusEffects) S.statusEffects=makeDefaultStatusEffects();
    if(S.statusEffects[k]){
      const raw=String(stEl.value||'').trim();
      if(raw===''||raw==='+'||raw==='-'){
        if(raw===''){
          withPoolSync(()=>{if(fld==='stat')S.statusEffects[k].statOvr='';else S.statusEffects[k].advOvr='';});
          syncLiveCalculations(); renderHeader();
        }
        return;
      }
      const num=parseInt(raw,10);
      if(!Number.isNaN(num)){
        withPoolSync(()=>{
          if(fld==='stat') S.statusEffects[k].statOvr=String(num);
          else S.statusEffects[k].advOvr=String(Math.max(0,num));
        });
        syncLiveCalculations(); renderHeader();
      }
    }
    return;
  }
  const el=e.target.closest?.('[contenteditable="true"]')||e.target, t=el;
  const val=el.isContentEditable?el.innerHTML:el.value;
  if(el.classList?.contains('autogrow')&&el.dataset.boxh){
    if(el.scrollHeight>el.clientHeight){
      el.style.height=el.scrollHeight+'px';
      const parts=el.dataset.boxh.split(':');
      if(parts[0]==='bio'){if(!S.bioBoxH)S.bioBoxH={};S.bioBoxH[parts[1]]=el.offsetHeight;}
      else{const it=findPwItem(parts[0],parts[1]);if(it)it.boxH[parts[2]]=el.offsetHeight;}
    }
  }
  if(el.dataset.bind){
    const [a,b]=el.dataset.bind.split('.');
    if(b)S[a][b]=el.value;else S[a]=el.value;
    if(a==='profile'){
      if(b==='name'){const hn=$('hdrCompactName');if(hn)hn.textContent=String(el.value||'').trim()||'Unbenannter Held';}
      if(b==='ancestry'||b==='concept'){
        const hm=$('hdrCompactMeta');
        if(hm){
          const ms=[String(S.profile.ancestry||'').trim(),String(S.profile.concept||'').trim()].filter(Boolean).join(' • ');
          hm.textContent=ms;
          hm.className=(ms?'hidden sm:block':'hidden')+' text-[10px] t-mut truncate leading-tight';
        }
      }
    }
    saveSoon();return;
  }
  if(el.dataset.bindRtf){S[el.dataset.bindRtf]=val;saveSoon();return;}
  if(t.id==='inpNewCnFolderName'){CN.newFolderName=t.value;return;}
  if(t.dataset.cnfolderName){
    const f=(S.campNoteFolders||[]).find(x=>x.id===t.dataset.cnfolderName);
    if(f&&!f.isSystem){f.name=t.value;saveSoon();}
    return;
  }
  if(t.dataset.cnFolderSel){
    ensureCampNotesStructure();
    const pg=S.campaignNotes.find(n=>n.id===t.dataset.cnFolderSel);
    const targetF=S.campNoteFolders.find(f=>f.id===t.value);
    if(pg&&targetF){
      pg.folderId=targetF.id;
      pg.isPublic=Boolean(targetF.isPublic);
      pg.updatedAt=stamp();
      syncPublicNotesAfterChange(pg);
      save(); renderCampNotes();
    }
    return;
  }
  if(t.dataset.cnTitle){
    const pg=(S.campaignNotes||[]).find(n=>n.id===t.dataset.cnTitle);
    if(pg){
      pg.title=t.value;
      pg.updatedAt=stamp();
      const tsEl=document.querySelector(`[data-cn-ts="${pg.id}"]`);
      if(tsEl) tsEl.textContent=`Zuletzt geändert: ${pg.updatedAt}`;
      syncPublicNotesAfterChange(pg);
      saveSoon();
    }
    return;
  }
  if(t.dataset.cnContent){
    const pg=(S.campaignNotes||[]).find(n=>n.id===t.dataset.cnContent);
    if(pg){
      pg.content=cleanInlineStyles(t.innerHTML);
      pg.updatedAt=stamp();
      const tsEl=document.querySelector(`[data-cn-ts="${pg.id}"]`);
      if(tsEl) tsEl.textContent=`Zuletzt geändert: ${pg.updatedAt}`;
      syncPublicNotesAfterChange(pg);
      saveSoon();
    }
    return;
  }
  if(el.dataset.lobbyCamptitle){
    const pid=el.dataset.lobbyCamptitle;
    const shared=getCampaignSharedPages(CLOUD.activeCampaignId);
    const pg=shared.find(p=>p&&p.id===pid);
    if(pg){
      pg.title=el.value;
      pg.updatedAt=stamp();
      pg.lastEditor=CLOUD.currentUser||'Admin';
      const tabTxt=document.querySelector(`[data-action="select-lobby-pubpage"][data-pagekey="camp::${pid}"] span.font-extrabold`);
      if(tabTxt) tabTxt.textContent=pg.title||'Neue Seite';
      const tsEl=document.querySelector('[data-lobby-notets]');
      if(tsEl) tsEl.textContent=pg.updatedAt;
      saveRegistryLocal();
      publishLiveCampNote({scope:'camp',campaignId:CLOUD.activeCampaignId,pageId:pid,page:pg});
    }
    return;
  }
  if(el.dataset.lobbyPubnote){
    const cid=el.dataset.lobbyPubnote;
    const pid=el.dataset.pageid||'cn_public';
    const nowTs=stamp();
    if(cid==='_camp_'){
      const shared=getCampaignSharedPages(CLOUD.activeCampaignId);
      const pg=shared.find(p=>p&&p.id===pid);
      if(pg){
        pg.content=String(val||'');
        pg.updatedAt=nowTs;
        pg.lastEditor=CLOUD.currentUser||'Admin';
        const tsEl=document.querySelector('[data-lobby-notets]');
        if(tsEl) tsEl.textContent=nowTs;
        saveRegistryLocal();
        publishLiveCampNote({scope:'camp',campaignId:CLOUD.activeCampaignId,pageId:pid,page:pg});
      }
      return;
    }
    if(!CLOUD.registry.publicNotes||typeof CLOUD.registry.publicNotes!=='object') CLOUD.registry.publicNotes={};
    if(!CLOUD.registry.publicNotes[cid]){
      const ch=CLOUD.list.find(x=>x.id===cid);
      CLOUD.registry.publicNotes[cid]={
        charId:cid,
        campaignId:getCharCampaignId(cid),
        charName:ch?.name||(cid===S.charId?S.profile.name:'')||'Unbenannter Held',
        avatar:ch?.avatar||(cid===S.charId?S.profile.avatar:'')||'',
        owner:getCharOwner(cid),
        content:pid==='cn_public'?String(val||''):'',
        updatedAt:nowTs,
        pages:[{id:pid,title:pid==='cn_public'?'🌐 Öffentlich':'Notiz',content:String(val||''),updatedAt:nowTs}]
      };
    }else{
      const entry=CLOUD.registry.publicNotes[cid];
      if(!Array.isArray(entry.pages)) entry.pages=[];
      const pg=entry.pages.find(p=>p&&p.id===pid);
      if(pg){
        pg.content=String(val||'');
        pg.updatedAt=nowTs;
      }else{
        entry.pages.push({id:pid,title:pid==='cn_public'?'🌐 Öffentlich':'Notiz',content:String(val||''),updatedAt:nowTs});
      }
      entry.content=String(entry.pages[0]?.content??val??'');
      entry.updatedAt=nowTs;
    }
    saveRegistryLocal();
    if(cid===S.charId&&!CLOUD.viewingRemote){
      const ownNote=(S.campaignNotes||[]).find(n=>n&&n.id===pid);
      if(ownNote){
        ownNote.content=String(val||'');
        ownNote.updatedAt=nowTs;
        save(false);
      }
    }
    const tsEl=document.querySelector('[data-lobby-notets]');
    if(tsEl) tsEl.textContent=nowTs;
    publishLiveCampNote({scope:'char',campaignId:CLOUD.activeCampaignId,charId:cid,publicNoteEntry:CLOUD.registry.publicNotes[cid]});
    return;
  }
  if(el.dataset.secf){const [id,f]=el.dataset.secf.split(':'),sec=S.powerSections.find(s=>s.id===id);if(sec){sec[f]=el.value;saveSoon();}return;}
  if(el.dataset.sksecf){const [id,f]=el.dataset.sksecf.split(':'),sec=S.skillSections.find(s=>s.id===id);if(sec){sec[f]=el.value;saveSoon();}return;}
  if(el.dataset.invsecf){const [id,f]=el.dataset.invsecf.split(':'),sec=(S.invSections||[]).find(s=>s.id===id);if(sec){sec[f]=el.value;if(f==='name')syncInvSecNameDOM(id);saveSoon();}return;}
  if(el.dataset.at){const [k,f]=el.dataset.at.split(':');withPoolSync(()=>{S.attributes[k][f]=toInt(el.value,0);});if($('inp_lpCurrent')&&document.activeElement!==$('inp_lpCurrent'))$('inp_lpCurrent').value=S.secondary.lpCurrent;if($('inp_mlpCurrent')&&document.activeElement!==$('inp_mlpCurrent'))$('inp_mlpCurrent').value=S.secondary.mlpCurrent;syncLiveCalculations();return;}
  if(el.dataset.sec){
    const f=el.dataset.sec;
    withPoolSync(()=>{
      const M=calcActiveMods();
      if(f==='apMax') S.secondary.apMax=toInt(el.value,0)-M.apMax;
      else if(f==='mapMax') S.secondary.mapMax=toInt(el.value,0)-M.mapMax;
      else S.secondary[f]=toInt(el.value,0);
    });
    ['lpCurrent','mlpCurrent','apCurrent','mapCurrent'].forEach(cf=>{const ci=$(`inp_${cf}`);if(ci&&document.activeElement!==ci)ci.value=S.secondary[cf];});
    syncLiveCalculations();return;
  }
  if(el.dataset.secMax){
    const k=el.dataset.secMax;
    withPoolSync(()=>{
      const M=calcActiveMods();
      if(k==='lp'){const form=Math.floor((getAttrTot('KO',M)+getAttrTot('ST',M))/5);S.secondary.lpMod=toInt(el.value,0)-form-M.lpMax;}
      else if(k==='mlp'){const form=Math.floor((getAttrTot('AU',M)+getAttrTot('WK',M))/5);S.secondary.mlpMod=toInt(el.value,0)-form-M.mlpMax;}
      else if(k==='ini'){const form=getAttrTot('WA',M)-getAttrTot('IN',M);S.secondary.iniMod=toInt(el.value,0)-form-M.ini;}
    });
    if($('inp_lpCurrent')&&document.activeElement!==$('inp_lpCurrent'))$('inp_lpCurrent').value=S.secondary.lpCurrent;
    if($('inp_mlpCurrent')&&document.activeElement!==$('inp_mlpCurrent'))$('inp_mlpCurrent').value=S.secondary.mlpCurrent;
    syncLiveCalculations();return;
  }
  if(el.dataset.cres){
    const f=el.dataset.cres;
    if(f==='name'){
      const prev=el.dataset.prevCres||cresName();
      S.customRes.name=el.value;
      if(String(el.value||'').trim()){
        const cur=cresName();
        syncCresRenameInTokens(prev,cur);
        el.dataset.prevCres=cur;
      }
    }
    else if(f==='max'){withPoolSync(()=>{const M=calcActiveMods();S.customRes.max=toInt(el.value,0)-M.cresMax;});if($('inp_cresCurrent')&&document.activeElement!==$('inp_cresCurrent'))$('inp_cresCurrent').value=S.customRes.current;}
    else S.customRes[f]=toInt(el.value,0);
    syncLiveCalculations();return;
  }
  if(el.dataset.exsec){
    const [id,f]=el.dataset.exsec.split(':'),ex=(S.extraSecList||[]).find(x=>x.id===id);
    if(ex){
      if(f==='name'){
        const prev=el.dataset.prevExName||getExtraSecName(ex);
        ex.name=el.value;
        if(String(el.value||'').trim()){
          const cur=getExtraSecName(ex);
          syncCresRenameInTokens(prev,cur);
          el.dataset.prevExName=cur;
        }
      }
      else if(f==='max'){withPoolSync(()=>{const M=calcActiveMods();ex.max=toInt(el.value,0)-(M.extraSec?.[ex.id]||0);});if($(`inp_ex_${ex.id}_cur`)&&document.activeElement!==$(`inp_ex_${ex.id}_cur`))$(`inp_ex_${ex.id}_cur`).value=ex.current;}
      else ex.current=toInt(el.value,0);
      syncLiveCalculations();
    }
    return;
  }
  if(el.dataset.bstInp){
    const raw=String(el.value??'').trim(), M=calcActiveMods();
    if(raw===''||raw==='-'){
      S.bstOvr='';
      S.bst=getBstAuto();
    }else{
      const typedVal=toInt(raw,getEffBst(M)), newBase=typedVal-(M.bst||0);
      S.bstOvr=String(newBase);
      S.bst=newBase;
    }
    syncLiveCalculations();
    save();
    return;
  }
  if(el.id==='colPickerInp'||el.id==='colHexInp'){
    let v=el.value.trim();if(el.id==='colHexInp'&&v&&!v.startsWith('#'))v='#'+v;
    if(isHex(v)){
      UI.colDraft=v;
      if(el.id==='colPickerInp'&&$('colHexInp'))$('colHexInp').value=v.toUpperCase();
      if(el.id==='colHexInp'&&$('colPickerInp'))$('colPickerInp').value=v;
      if(DUAL_COL_TARGETS.has(UI.colTarget)&&UI.colMode==='bg'){if($('colPrevBox'))$('colPrevBox').style.background=`color-mix(in srgb,${v} 38%,var(--surf))`;}
      else if($('colPrevTxt'))$('colPrevTxt').style.color=v;
      if($('colPrevHex'))$('colPrevHex').textContent=v.toUpperCase();
    }
    return;
  }
  if(el.dataset.th){const k=el.dataset.th,M=calcActiveMods();S.thresholds[k]=toInt(el.value,0)-(M[k]||0);syncLiveCalculations();return;}
  if(el.dataset.mv){const [id,f]=el.dataset.mv.split(':'),m=S.movements.find(x=>x.id===id);if(m){m[f]=el.value;syncLiveCalculations();}return;}
  if(el.dataset.hz){const [id,f]=el.dataset.hz.split(':'),z=S.hitZones.find(x=>x.id===id);if(z){z[f]=el.value;saveSoon();}return;}
  if(el.dataset.fbNewFolder){
    FEEDBACK.newFolderName=el.value;
    return;
  }
  if(el.dataset.fbSort){
    if(!CLOUD.isAdmin) return;
    FEEDBACK.sortBy=String(el.value||'newest');
    renderModal();
    if(typeof renderFbAdminWin==='function'&&FBW?.open) renderFbAdminWin();
    return;
  }
  if(el.dataset.fbMoveFolder){
    if(!CLOUD.isAdmin) return;
    const itemId=String(el.dataset.fbMoveFolder||'').trim(), targetFid=String(el.value||'fb_inbox').trim();
    if(!itemId) return;
    saveFeedbackStore(store=>{
      const it=(store.items||[]).find(x=>x&&x.id===itemId);
      if(!it) return false;
      it.folderId=targetFid;
    },'📁 Feedback verschoben.');
    return;
  }
  if(el.dataset.fbDraft){
    const f=el.dataset.fbDraft;
    if(f==='title') FEEDBACK.draftTitle=el.value;
    else if(f==='html') FEEDBACK.draftHtml=cleanInlineStyles(el.innerHTML);
    return;
  }
  if(el.dataset.fbReply){
    if(!FEEDBACK.replyDrafts||typeof FEEDBACK.replyDrafts!=='object') FEEDBACK.replyDrafts={};
    FEEDBACK.replyDrafts[el.dataset.fbReply]=cleanInlineStyles(el.innerHTML);
    return;
  }
  if(el.dataset.qnote){S.combatNotes[el.dataset.qnote]=val;saveSoon();return;}
  if(el.dataset.trnote){const [k,i]=el.dataset.trnote.split(':');S.attributes[k].trNotes[+i]=el.value;saveSoon();return;}
  if(el.dataset.trcost){
    const [k,i,f]=el.dataset.trcost.split(':'),a=S.attributes[k],idx=+i;
    if(a){
      const v=el.value.trim()===''?null:toInt(el.value,0);
      if(f==='sp') a.trSp[idx]=v; else a.trMsp[idx]=v;
      syncLiveCalculations();
    }
    return;
  }
  if(el.dataset.prog){const f=el.dataset.prog;S.progression[f]=f==='bonusNote'?el.value:toInt(el.value,0);syncLiveCalculations(f==='bonusNote');return;}
  if(el.dataset.sk){
    const [id,f]=el.dataset.sk.split(':'),sk=S.skills.find(x=>x.id===id);
    if(sk){
      if(f==='name'){
        const prev=String(el.dataset.prevSkName!==undefined?el.dataset.prevSkName:(sk.name||'')).trim();
        if(el.dataset.prevSkName===undefined&&prev) el.dataset.prevSkName=prev;
        sk.name=el.value;
        const cur=String(el.value||'').trim();
        if(cur){
          if(prev&&prev!==cur) syncSkillRenameInTokens(prev,cur);
          el.dataset.prevSkName=cur;
        }
        if(D.open||D.skillId===sk.id){syncLiveCalculations(true);return;}
      }else{
        sk[f]=el.value;
        if(f==='notes'){
          const nb=$(`skMobNoteBadge_${sk.id}`);
          if(nb) nb.classList.toggle('hidden',!String(el.value||'').trim());
        }
      }
      saveSoon();
    }
    return;
  }
  if(el.dataset.skBon){
    const sk=S.skills.find(x=>x.id===el.dataset.skBon);
    if(sk){
      const raw=el.value.trim();
      if(raw===''||raw==='+'||raw==='-'){
        if(raw==='') sk.bonusOvr='';
      }else{
        sk.bonusOvr=String(toInt(raw,getSkAutoBonus(sk.rank)));
      }
      const autoB=getSkAutoBonus(sk.rank), hasOvr=hasSkBonusOvr(sk);
      const rb=$(`skRollBtn_${sk.id}`);
      if(rb){const bm=buildSkRollBtnMeta(sk);rb.innerHTML=bm.innerHtml;rb.dataset.tip=bm.tip;}
      ['','chr_'].forEach(p=>{
        const bi=$(`skBon_${p}${sk.id}`), br=$(`skBonReset_${p}${sk.id}`);
        if(bi){bi.classList.toggle('!border-amber-400',hasOvr);bi.classList.toggle('text-amber-300',hasOvr);bi.classList.toggle('text-acc',!hasOvr);}
        if(br){br.textContent=br.closest('.sk-mob-detail')?`↺ +${autoB}`:`(+${autoB})`;br.classList.toggle('hidden',!hasOvr);}
      });
      syncLiveCalculations();
    }
    return;
  }
  if(el.dataset.skcost){
    const [id,f]=el.dataset.skcost.split(':'),sk=S.skills.find(x=>x.id===id);
    if(sk){
      const v=toInt(el.value,0);
      if(f==='sp') sk.customSp=v; else sk.customMsp=v;
      sk.manualCost=true;
      syncLiveCalculations();
    }
    return;
  }
  if(el.dataset.pwcost){
    const [kind,id,f]=el.dataset.pwcost.split(':'),it=findPwItem(kind,id);
    if(it){it[f]=toInt(el.value,0);it.manualCost=true;syncLiveCalculations();}
    return;
  }
  if(el.dataset.pwUcostAmt){
    const [kind,id,cIdx]=el.dataset.pwUcostAmt.split(':'), it=findPwItem(kind,id), idx=toInt(cIdx,-1);
    if(it){
      if(!Array.isArray(it.useCosts)) syncPwUseCostsLegacy(it);
      if(it.useCosts[idx]){
        it.useCosts[idx].amt=Math.max(0,toInt(el.value,0));
        syncPwUseCostsLegacy(it);
        const card=el.closest('.card');
        if(card){
          const btn=card.querySelector('[data-action="spend-pw"]');
          if(btn){
            const cs=formatPwUseCosts(it), canSp=Boolean(cs)||parseStatusTokens(it.effects).length>0;
            btn.disabled=!canSp;
            btn.textContent=`⚡ ${cs||'Einsetzen'}`;
          }
        }
        save();
      }
    }
    return;
  }
  if(el.dataset.pwSkcnt){
    const [kind,id]=el.dataset.pwSkcnt.split(':'),it=findPwItem(kind,id);
    if(it){
      const clean=String(el.value||'').replace(/\D/g,'').replace(/^0+/,'');
      if(el.value!==clean) el.value=clean;
      it.bldSkCnt=clean;
      updatePwBuilderChipDOM(kind,id);
      save();
    }
    return;
  }
  if(el.dataset.pwf){
    const [kind,id,f]=el.dataset.pwf.split(':'),it=findPwItem(kind,id);
    if(it){
      if(f==='effects'){
        withPoolSync(()=>{it[f]=val;});
        const tb=$(`tokBar_${id}`); if(tb) tb.innerHTML=buildTokBarInnerHtml(kind,it);
        syncLiveCalculations(true);
      }else if(f==='name'){
        const dup=findDuplicatePwEntry(val,id);
        if(dup){
          if(el.dataset.prevName===undefined) el.dataset.prevName=String(it.name||'');
          el.classList.add('!border-rose-500');
          updatePwNameDupHint(el,dup);
        }else{
          el.classList.remove('!border-rose-500');
          updatePwNameDupHint(el,null);
          it.name=val;
          el.dataset.prevName=val;
          syncLiveCalculations(true);
        }
      }else{
        it[f]=f==='useAmt'?toInt(el.value,0):val;
        if(f==='useAmt'){if(Array.isArray(it.useCosts)&&it.useCosts[0])it.useCosts[0].amt=Math.max(0,it.useAmt);syncPwUseCostsLegacy(it);}
        if(f==='bldAmt'||f==='bldDynFactor') updatePwBuilderChipDOM(kind,id);
        if(f==='desc'||f==='rules') updatePwDynPreviewDOM(kind,id);
        if(f==='useAmt') save();
        else saveSoon();
      }
    }
    return;
  }
  if(el.dataset.wpf){const [id,f]=el.dataset.wpf.split(':'),w=S.weapons.find(x=>x.id===id);if(w){w[f]=el.value;if(f==='name'&&D.weaponId===id){syncDiceFromSheet();if(D.open)renderDice();}saveSoon();}return;}
  if(el.dataset.amf){
    const [id,f]=el.dataset.amf.split(':'),am=S.ammos.find(x=>x.id===id);
    if(am){
      if(f==='qty'){
        const raw=String(el.value??'').trim();
        am.qty=raw===''?0:Math.max(0,toInt(raw,0));
      }else{
        am[f]=el.value;
      }
      syncLinkedAmmoDOM(id,el);
      saveSoon();
    }
    return;
  }
  if(el.dataset.arZoneDraft){
    if(!UI.arZoneDrafts) UI.arZoneDrafts={};
    UI.arZoneDrafts[el.dataset.arZoneDraft]=el.value;
    return;
  }
  if(el.dataset.arf){const [id,f]=el.dataset.arf.split(':'),ar=S.armors.find(x=>x.id===id);if(ar){ar[f]=el.value;saveSoon();}return;}
  if(el.dataset.eqcv){
    const [kind,id,cvId,field]=el.dataset.eqcv.split(':');
    const arrKey=kind==='weapon'?'weapons':kind==='ammo'?'ammos':kind==='armor'?'armors':'';
    const propKey=kind==='armor'?'customProt':'customDmg';
    const item=arrKey?(S[arrKey]||[]).find(x=>x.id===id):null;
    const cv=item&&Array.isArray(item[propKey])?item[propKey].find(c=>c.id===cvId):null;
    if(cv&&(field==='label'||field==='val')){
      cv[field]=el.value;
      if(kind==='ammo') syncLinkedAmmoDOM(id,el);
      saveSoon();
    }
    return;
  }
  if(el.dataset.eqtagX){
    const [kind,id,ti]=el.dataset.eqtagX.split(':'),k={weapon:'weapons',armor:'armors',ammo:'ammos'}[kind],tList={weapon:S.weaponTagList,armor:S.armorTagList,ammo:S.ammoTagList}[kind],it=(S[k]||[]).find(x=>x.id===id);
    if(it&&it.tags?.[+ti]){
      it.tags[+ti].x=el.value;
      const chip=$(`eqtag_${kind}_${id}_${ti}`);
      if(chip) chip.dataset.tip=getTagDesc(tList,it.tags[+ti].name,el.value);
      if(kind==='ammo') syncLinkedAmmoDOM(id,el);
      invalidateModsCache();
      syncDiceFromSheet();
      if(D.open) renderDice();
      else syncLiveCalculations();
      saveSoon();
    }
    return;
  }
  if(el.dataset.bioimgCap){const im=S.bioImages.find(x=>x.id===el.dataset.bioimgCap);if(im){im.caption=el.value;saveSoon();}return;}
  if(el.dataset.inv){const [id,f]=el.dataset.inv.split(':'),it=S.inventory.find(x=>x.id===id);if(it){it[f]=el.value;saveSoon();}return;}
  if(el.dataset.bio){S.bio[el.dataset.bio]=val;saveSoon();return;}
  if(el.dataset.diceCustom){
    const k=el.dataset.diceCustom;
    if(k==='cnt') D.customCnt=Math.max(1,Math.min(100,toInt(el.value,1)));
    else if(k==='sides') D.customSides=Math.max(1,toInt(el.value,20));
    D.customMod=0;
    const cForm=`${D.customCnt}W${D.customSides}`;
    const btn=$('btnRollCustomDice'); if(btn) btn.textContent=isSecretRollActive()?`🕵️ 🎲 ${cForm} geheim würfeln`:`🎲 ${cForm} würfeln`;
    const pill=$('lblCustomFormulaPill'); if(pill) pill.textContent=cForm;
    document.querySelectorAll('#diceMount [data-action="dice-custom-preset"]').forEach(b=>{
      const act=D.customSides===toInt(b.dataset.sides,0);
      b.classList.toggle('btn-pri',act);
      b.classList.toggle('font-black',act);
      b.classList.toggle('opacity-85',!act);
    });
    return;
  }
  if(el.dataset.dice){
    D[el.dataset.dice]=toInt(el.value,0);
    if(el.dataset.dice==='blockFollowAtk'){
      const th2=D.blockFollowAtk+30, ch2=Math.max(1,Math.min(99,th2)), m2=calcEgMultiplier(th2), info=$('blockFollowThInfo');
      if(info) info.textContent=`Schw. 20 • Schwelle ≤ ${th2} (${ch2}%)${m2>1?` • EG ×${m2}`:''}`;
      if(UI.lastBlockBaseHtml) UI.lastRollHtml=UI.lastBlockBaseHtml+renderBlockFollowUpBox();
      return;
    }
    if(el.dataset.dice==='cDirect'){D.skillId=null;D.attrKey=null;D.weaponId=null;D.wRollCat='Normaler Test';}
    if($('diceCMath')) $('diceCMath').textContent=`${D.cAttr} + ${getCSkVal()} = ${toInt(D.cAttr)+getCSkVal()}`;
    if($('diceDMath')) $('diceDMath').textContent=`${D.dAttr} + ${getDSkVal()} = ${toInt(D.dAttr)+getDSkVal()}`;
    const dRstBtn=$('btnResetDiceDiff');
    if(dRstBtn){
      const isDiffChg=(getEffD()!==40||D.dMode!=='direct');
      dRstBtn.classList.toggle('!border-amber-400',isDiffChg);
      dRstBtn.classList.toggle('!bg-amber-500/25',isDiffChg);
      dRstBtn.classList.toggle('text-amber-300',isDiffChg);
      dRstBtn.classList.toggle('shadow-sm',isDiffChg);
      dRstBtn.classList.toggle('opacity-70',!isDiffChg);
    }
    document.querySelectorAll('#diceMount [data-action="dice-set-diff"]').forEach(b=>{
      const act=D.dMode==='direct'&&toInt(D.dDirect)===toInt(b.dataset.val,0);
      b.classList.toggle('btn-pri',act);
      b.classList.toggle('font-black',act);
      b.classList.toggle('opacity-85',!act);
    });
    syncLiveCalculations();return;
  }
  if(el.id==='rngOverlay'){const t=getEditStyleSlot();t.overlay=toInt(el.value,75);if($('bgOvLbl'))$('bgOvLbl').textContent=t.overlay+'%';applyTheme();persistCurrentThemeChange({scope:'auto'});if(!UI.inLobby) saveSoon(300);return;}
  if(el.id==='rngBlur'){const t=getEditStyleSlot();t.blur=toInt(el.value,0);if($('bgBlurLbl'))$('bgBlurLbl').textContent=t.blur+' px';applyTheme();persistCurrentThemeChange({scope:'auto'});if(!UI.inLobby) saveSoon(300);return;}
  if(el.dataset.palName){UI.palDraft.name=el.value;return;}
  if(el.dataset.palCol){
    const k=el.dataset.palCol, v=el.value;
    UI.palDraft[k]=v;
    const hx=document.querySelector(`input[data-pal-hex="${k}"]`); if(hx) hx.value=v.toUpperCase();
    const sl=getEditStyleSlot(); sl.customColors={...UI.palDraft};
    applyTheme(); persistCurrentThemeChange({scope:'auto'}); if(!UI.inLobby) saveSoon(300); return;
  }
  if(el.dataset.palHex){
    const k=el.dataset.palHex; let v=el.value.trim(); if(v&&!v.startsWith('#')) v='#'+v;
    if(isHex(v)){
      UI.palDraft[k]=v.toLowerCase();
      const cp=document.querySelector(`input[data-pal-col="${k}"]`); if(cp) cp.value=v.toLowerCase();
      const sl=getEditStyleSlot(); sl.customColors={...UI.palDraft};
      applyTheme(); persistCurrentThemeChange({scope:'auto'}); if(!UI.inLobby) saveSoon(300);
    }
    return;
  }
});

document.addEventListener('pointerup',e=>{
  const ta=e.target.closest?.('[data-boxh]'); if(!ta||ta.offsetHeight<=40) return;
  const parts=ta.dataset.boxh.split(':');
  if(parts[0]==='bio'){
    if(!S.bioBoxH) S.bioBoxH={};
    if(S.bioBoxH[parts[1]]!==ta.offsetHeight){S.bioBoxH[parts[1]]=ta.offsetHeight;save();}
  }else{
    const it=findPwItem(parts[0],parts[1]);
    if(it&&it.boxH[parts[2]]!==ta.offsetHeight){it.boxH[parts[2]]=ta.offsetHeight;save();}
  }
});

$('fileLobbyLogo')?.addEventListener('change',e=>{
  const f=e.target.files?.[0]; e.target.value='';
  if(!f||!CLOUD.isAdmin) return;
  const ctx=getImgMenuContext('lobbyLogo','');
  compressImg(f,ctx.maxDim,ctx.quality,dataUrl=>applyImgUrlForContext(ctx,dataUrl,false));
});
$('fileCampImg')?.addEventListener('change',e=>{
  const f=e.target.files?.[0]; e.target.value='';
  const cid=UI.imgTargetKind==='campImg'&&UI.imgTargetId?UI.imgTargetId:CLOUD.activeCampaignId;
  if(!f||!(CLOUD.isAdmin||canManageCampaign(cid))) return;
  const ctx=getImgMenuContext('campImg',cid);
  compressImg(f,ctx.maxDim,ctx.quality,dataUrl=>applyImgUrlForContext(ctx,dataUrl,false));
});
$('fileUserAvatar')?.addEventListener('change',e=>{
  const f=e.target.files?.[0]; e.target.value='';
  const rawTarget=(UI.imgTargetKind==='userAvatar'&&UI.imgTargetId)?UI.imgTargetId:(UI.profileUser||CLOUD.currentUser);
  const targetKey=findUserKeyByName(rawTarget)||findUserKeyById(rawTarget);
  if(!f||!targetKey||!canViewUserProfile(targetKey)) return;
  const ctx=getImgMenuContext('userAvatar',targetKey);
  if(!ctx||!ctx.canEdit) return;
  compressImg(f,ctx.maxDim,ctx.quality,dataUrl=>applyImgUrlForContext(ctx,dataUrl,false));
});
$('fileAdminIcon')?.addEventListener('change',e=>{
  const f=e.target.files?.[0];
  e.target.value='';
  if(!CLOUD.isAdmin||!UI.adminIconTargetKey||!f) return;
  const targetKey=UI.adminIconTargetKey;
  UI.adminIconTargetKey='';
  handleAdminIconFileUpload(f,targetKey);
});
document.addEventListener('change',e=>{
  {const el=e.target;if(el&&el.matches&&el.matches('[data-fb-backlog-user]')){if(!CLOUD.isAdmin)return;FEEDBACK.backlogUser=el.value||'all';renderModal();return;}}
  if(e.target&&e.target.dataset?.inspInp){renderMain();save();return;}
  const stEl=e.target;
  if(stEl&&stEl.dataset&&(stEl.dataset.stStacks||stEl.dataset.stOvr)){
    renderMain(); renderHeader(); renderDice(); save();
    return;
  }
  const el=e.target, t=el;
  if(el.dataset.lobbyBookSel){
    const val=String(el.value||'').trim();
    if(!val||val==='camp'){
      const shared=getCampaignSharedPages(CLOUD.activeCampaignId);
      CLOUD.activePublicPageKey='camp::'+(shared[0]?.id||'camp_main');
    }else{
      const firstPid=(val===S.charId&&!CLOUD.viewingRemote?(S.campaignNotes||[]).find(n=>n&&n.isPublic)?.id:'')||CLOUD.registry.publicNotes?.[val]?.pages?.[0]?.id||'cn_public';
      CLOUD.activePublicPageKey=`${val}::${firstPid}`;
    }
    CLOUD.confirmDelCampPageId=null;
    renderMain();
    return;
  }
  if(el.dataset.cres==='name'){syncCresRenameInTokens(el.dataset.prevCres||'',cresName());el.dataset.prevCres=cresName();renderHeader();syncLiveCalculations();return;}
  if(el.dataset.exsec?.endsWith(':name')){const id=el.dataset.exsec.split(':')[0],ex=(S.extraSecList||[]).find(x=>x.id===id);if(ex){syncCresRenameInTokens(el.dataset.prevExName||'',getExtraSecName(ex));el.dataset.prevExName=getExtraSecName(ex);renderHeader();syncLiveCalculations();}return;}
  if(el.dataset.mv?.endsWith(':ovr')&&String(el.value).trim()===''){renderMain();save();return;}
  if(el.dataset.bstInp){if(String(el.value??'').trim()===''){S.bstOvr='';S.bst=getBstAuto();}renderMain();save();return;}
  if(t.dataset.cnFolderSel){
    ensureCampNotesStructure();
    const pg=S.campaignNotes.find(n=>n.id===t.dataset.cnFolderSel);
    const targetF=S.campNoteFolders.find(f=>f.id===t.value);
    if(pg&&targetF){
      pg.folderId=targetF.id;
      pg.isPublic=Boolean(targetF.isPublic);
      pg.updatedAt=stamp();
      syncPublicNotesAfterChange(pg);
      save(); renderCampNotes();
    }
    return;
  }
  if(t.dataset.cnTitle||t.dataset.cnfolderName){renderCampNotes();save();return;}
  if(el.dataset.invsecf?.endsWith(':name')){const [id]=el.dataset.invsecf.split(':');syncInvSecNameDOM(id);save();return;}
  if(el.dataset.secf?.endsWith(':name')||el.dataset.sksecf?.endsWith(':name')){renderMain();save();return;}
  if(el.dataset.skBon){const sk=S.skills.find(x=>x.id===el.dataset.skBon);if(sk){if(String(el.value).trim()==='')sk.bonusOvr='';renderMain();save();}return;}
  if(el.dataset.secParent){
    const sec=S.powerSections.find(s=>s.id===el.dataset.secParent), pid=el.value;
    if(sec){
      if(!canSetSecParent(S.powerSections,sec.id,pid)){toast('⚠️ Zyklus verhindert: Eine Sektion kann nicht in sich selbst oder ihre Untersektion gelegt werden.');renderMain();return;}
      sec.parentSectionId=pid;
      if(pid){const par=S.powerSections.find(s=>s.id===pid);if(par)par.collapsed=false;}
      renderMain();save();
      toast(pid?'Sektion als Unterordner verschachtelt':'Sektion auf Hauptebene verschoben');
    }
    return;
  }
  if(el.dataset.sksecParent){
    const sec=S.skillSections.find(s=>s.id===el.dataset.sksecParent), pid=el.value;
    if(sec){
      if(!canSetSecParent(S.skillSections,sec.id,pid)){toast('⚠️ Zyklus verhindert: Eine Sektion kann nicht in sich selbst oder ihre Untersektion gelegt werden.');renderMain();return;}
      sec.parentSectionId=pid;
      if(pid){const par=S.skillSections.find(s=>s.id===pid);if(par)par.collapsed=false;}
      renderMain();save();
      toast(pid?'Sektion als Unterordner verschachtelt':'Sektion auf Hauptebene verschoben');
    }
    return;
  }
  if(el.dataset.secArt){const sec=S.powerSections.find(s=>s.id===el.dataset.secArt);if(sec){sec.filterArt=el.value;UI.confirmSecPullId=null;renderMain();save();}return;}
  if(el.dataset.sksecFilter){const sec=S.skillSections.find(s=>s.id===el.dataset.sksecFilter);if(sec){sec.filterAttr=el.value;UI.confirmSkSecPullId=null;renderMain();save();}return;}
  if(el.dataset.pwSecSel){const p=S.powers.find(x=>x.id===el.dataset.pwSecSel);if(p){p.sectionId=getValidPwSecId(el.value);if(p.sectionId){const tSec=S.powerSections.find(s=>s.id===p.sectionId);if(tSec)tSec.collapsed=false;}renderMain();save();}return;}
  if(el.dataset.augSecSel){const ag=S.augments.find(a=>a.id===el.dataset.augSecSel);if(ag&&!ag.parentPowerId){ag.sectionId=getValidPwSecId(el.value);if(ag.sectionId){const tSec=S.powerSections.find(s=>s.id===ag.sectionId);if(tSec)tSec.collapsed=false;}renderMain();save();}return;}
  if(el.dataset.skSecSel){const sk=S.skills.find(x=>x.id===el.dataset.skSecSel);if(sk){sk.sectionId=el.value;renderMain();save();}return;}
  if(el.dataset.invsecParent){
    const sec=(S.invSections||[]).find(s=>s.id===el.dataset.invsecParent), pid=el.value;
    if(sec){
      if(!canSetSecParent(S.invSections,sec.id,pid)){toast('⚠️ Zyklus verhindert: Ein Beutel kann nicht in sich selbst oder seinen Unterordner gelegt werden.');renderMain();return;}
      sec.parentSectionId=pid;
      if(pid){const par=S.invSections.find(s=>s.id===pid);if(par)par.collapsed=false;}
      renderMain();save();
      toast(pid?'Beutel als Unterordner verschachtelt':'Beutel auf Hauptebene verschoben');
    }
    return;
  }
  if(el.dataset.invSecSel){const it=S.inventory.find(x=>x.id===el.dataset.invSecSel);if(it){it.sectionId=el.value;if(el.value){const par=(S.invSections||[]).find(s=>s.id===el.value);if(par)par.collapsed=false;}renderMain();save();}return;}
  if(el.dataset.pwf?.endsWith(':name')){if(!enforceUniquePwName(el))return;renderMain();save();return;}
  if(el.dataset.pwUcostAmt||el.dataset.pwf?.endsWith(':useAmt')){renderMain();save();return;}
  if(el.dataset.addPwUcost){
    const [kind,id]=el.dataset.addPwUcost.split(':'), it=findPwItem(kind,id), res=String(el.value||'').trim();
    if(it&&res){
      if(!Array.isArray(it.useCosts)) syncPwUseCostsLegacy(it);
      it.useCosts.push({res,amt:1});
      syncPwUseCostsLegacy(it);
      renderMain(); save();
    }
    return;
  }
  if(el.dataset.skcost||el.dataset.trcost||el.dataset.pwcost){renderAll();return;}
  if(el.id==='inpDirectLvl'){S.progression.level=Math.max(1,toInt(el.value,1));logChron(`Stufe auf ${S.progression.level} gesetzt.`);renderAll();return;}
  if(el.id==='inpDirectEp'){applyEp(el.value,'EP geändert');renderAll();return;}
  if(el.dataset.skSel){
    const [id,f]=el.dataset.skSel.split(':'),sk=S.skills.find(x=>x.id===id);
    if(sk){
      sk[f]=f==='rank'?toInt(el.value,0):el.value;
      if(f==='sectionId'&&el.value){const tSec=S.skillSections.find(s=>s.id===el.value);if(tSec)tSec.collapsed=false;}
      if(f==='linkedAttr'&&D.skillId===sk.id&&!D.weaponId) D.attrKey=sk.linkedAttr;
      if(!sk.manualCost){const auto=calcAutoSkCost(sk.category,sk.rank);sk.customSp=auto.sp;sk.customMsp=auto.msp;}
      syncDiceFromSheet();renderAll();
    }
    return;
  }
  if(el.dataset.pwTier){const [kind,id]=el.dataset.pwTier.split(':'),it=findPwItem(kind,id);if(it&&PW_TIERS[el.value]){it.tier=el.value;const d=PW_TIERS[it.tier];if(!it.manualCost){it.sp=d.sp;it.msp=d.msp;}renderAll();}return;}
  if(el.dataset.pwSkcnt){
    const [kind,id]=el.dataset.pwSkcnt.split(':'),it=findPwItem(kind,id);
    if(it){
      const clean=String(el.value||'').replace(/\D/g,'').replace(/^0+/,'');
      const finalVal=clean||'1';
      if(el.value!==finalVal) el.value=finalVal;
      it.bldSkCnt=finalVal;
      updatePwBuilderChipDOM(kind,id);
      save();
    }
    return;
  }
  if(el.dataset.pwDynPreset){
    const [kind,id]=el.dataset.pwDynPreset.split(':'),it=findPwItem(kind,id);
    if(it&&el.value!=='__custom__'){
      it.bldDynFactor=el.value;
      const facInp=document.querySelector(`input[data-pwf="${kind}:${id}:bldDynFactor"]`);
      if(facInp) facInp.value=el.value;
      updatePwBuilderChipDOM(kind,id);
      save();
    }
    return;
  }
  if(el.dataset.pwSel){
    const [kind,id,f]=el.dataset.pwSel.split(':'),it=findPwItem(kind,id);
    if(it){
      it[f]=el.value;
      if(f==='bldSkKind'||f==='bldSkId'||f==='bldStat'||f==='bldDynVar'||f==='bldDynRound'||f==='bldDynTarget'){
        if(f==='bldDynTarget'&&['desc','effects','rules'].includes(el.value)){
          lastPwFieldById[id]=el.value;
          if(RTF_STATE.lastActiveRtfEl&&RTF_STATE.lastActiveRtfEl.dataset?.pwf?.startsWith(`${kind}:${id}:`)&&!RTF_STATE.lastActiveRtfEl.dataset.pwf.endsWith(`:${el.value}`)){
            RTF_STATE.lastActiveRtfEl=null;
            RTF_STATE.lastActiveRtfRange=null;
          }
        }
        updatePwBuilderChipDOM(kind,id);
        save();
      }else{
        if(f==='useRes'&&!el.value) it.useAmt=0;
        renderMain();save();
      }
    }
    return;
  }
  if(el.dataset.addPwTag){
    const [kind,id]=el.dataset.addPwTag.split(':'), it=findPwItem(kind,id), val=String(el.value||'').trim();
    if(it&&val){
      if(isReservedPwTerm(val)){
        toast(`„${val}“ gehört zu Hauptaktionsart / Aktionsunterarten und kann nicht als Tag hinzugefügt werden.`);
      }else{
        if(!Array.isArray(it.tags)) it.tags=[];
        if(!it.tags.some(t=>t.toLowerCase()===val.toLowerCase())) it.tags.push(val);
        save(); renderMain();
      }
    }
    return;
  }
  if(el.dataset.agLink){const ag=S.augments.find(a=>a.id===el.dataset.agLink);if(ag){if(el.value&&getLinkedAugs(el.value).length>=3){toast('Maximal 3 Augmente pro Kraft!');renderMain();return;}if(el.value)linkAugToPower(ag,el.value);else unlinkAugFromPower(ag);renderMain();save();}return;}
  if(el.dataset.linkSlot){const pid=el.dataset.linkSlot,ag=S.augments.find(a=>a.id===el.value);if(ag&&getLinkedAugs(pid).length<3){linkAugToPower(ag,pid);renderMain();save();toast('Augment in Slot verknüpft');}return;}
  if(el.dataset.campAddUserSel){
    if(!canManageCampaign(CLOUD.activeCampaignId)) return;
    const val=el.value.trim();
    if(val) addCampaignAllowedUser(val);
    return;
  }
  if(el.dataset.adminAssign){
    if(!CLOUD.isAdmin) return;
    const cid=el.dataset.adminAssign, newOwn=el.value.trim();
    if(newOwn) CLOUD.registry.claims[cid]=newOwn;
    else CLOUD.registry.claims[cid]="";
    const ch=CLOUD.list.find(x=>x.id===cid);
    if(ch) ch.owner=newOwn;
    if(S.charId===cid) S.owner=newOwn;
    updateCloudCharacterMeta(cid,d=>{d.owner=newOwn;if(d._summary)d._summary.owner=newOwn;},newOwn?`👑 Besitzer auf „${newOwn}“ geändert`:'👑 Charakter auf „Frei“ gesetzt');
    return;
  }
  if(el.id==='selNewCharCamp'){CLOUD.newCharCampId=el.value;return;}
  if(el.dataset.adminCampChar){
    const cid=el.dataset.adminCampChar, newCampId=String(el.value||'default').trim()||'default';
    const owner=getCharOwner(cid), isMyChar=Boolean(owner&&CLOUD.currentUser&&owner.toLowerCase()===CLOUD.currentUser.toLowerCase());
    if(!CLOUD.isAdmin&&!isMyChar&&!canManageCampaign(getCharCampaignId(cid))) return;
    const camps=CLOUD.isAdmin?getCampaigns():getCreatableCampaigns(CLOUD.currentUser);
    const targetCamp=camps.find(c=>c.id===newCampId)||camps[0]||{id:'default',name:'Ohne Kampagne / Allgemein'};
    const effCampId=targetCamp.id;
    if(!CLOUD.registry.charCampaigns||typeof CLOUD.registry.charCampaigns!=='object') CLOUD.registry.charCampaigns={};
    CLOUD.registry.charCampaigns[cid]=effCampId;
    const ch=CLOUD.list.find(x=>x.id===cid);
    if(ch) ch.campaignId=effCampId;
    if(S.charId===cid){S.campaignId=effCampId;save(false);}
    const charName=ch?.name||(S.charId===cid?S.profile.name:'')||'Charakter';
    updateCloudCharacterMeta(cid,d=>{d.campaignId=effCampId;if(d._summary)d._summary.campaignId=effCampId;},`🗺️ „${charName}“ in „${targetCamp.name}“ verschoben!`);
    return;
  }
  if(el.dataset.diceSel){const f=el.dataset.diceSel;if(f==='crit'){const T=calcThreshold(),si=Math.max(0,CRIT_SEQ.indexOf(el.value));D.critOff=si-T.autoCrit;D.crit=CRIT_SEQ[si];}else{D[f]=f==='cnt'?toInt(el.value,1):el.value;}renderDice();return;}
  if(el.dataset.diceOpp){
    const f=el.dataset.diceOpp;
    if(f==='charId'){selectDiceOpponent(el.value,{force:false,silent:true});return;}
    clearOutgoingDuel({notifyCancel:true,silent:true});
    if(f==='weaponId'){D.oppWeaponId=el.value;D.oppSitActive={};applyDiceAutoAdvDis(false);renderDice();return;}
    if(f==='skillId'){D.oppSkillId=el.value;D.oppSitActive={};applyDiceAutoAdvDis(false);renderDice();return;}
  }
  if(el.dataset.duelSel&&DUEL.reply){
    const f=el.dataset.duelSel;
    if(f==='weaponId'){DUEL.reply.weaponId=el.value;DUEL.reply.sitActive={};renderDuelReplyModal();return;}
    if(f==='skillId'){DUEL.reply.skillId=el.value;DUEL.reply.sitActive={};renderDuelReplyModal();return;}
  }
  if(el.dataset.amf){
    const [id,f]=el.dataset.amf.split(':'),am=S.ammos.find(x=>x.id===id);
    if(am){
      if(f==='qty'){
        am.qty=Math.max(0,toInt(el.value,0));
        el.value=String(am.qty);
      }
      syncLinkedAmmoDOM(id,el);
      save();
    }
    return;
  }
  if(el.dataset.wpf||el.dataset.arf||el.dataset.eqcv||el.dataset.inv||el.dataset.eqtagX){save();return;}
  if(el.dataset.wpSel){
    const [id,f]=el.dataset.wpSel.split(':'),w=S.weapons.find(x=>x.id===id);
    if(w){
      if(f==='wAttr'&&isWeaponMassiv(w)&&el.value!=='ST'){
        w.wAttr='ST';
        toast('Tag „Massiv“ aktiv: Attribut bleibt auf ST');
      }else{
        w[f]=el.value;
      }
      if(f==='wType'){
        if(isWeaponMassiv(w)) w.wAttr='ST';
        else if(w.wType==='ranged') w.wAttr='PR';
      }
      invalidateModsCache();
      if(D.weaponId===w.id&&(f==='wAttr'||f==='skillId'||f==='wType'||f==='ammoId')){
        const wm=getWeaponRollMeta(w);
        D.attrKey=wm.attrKey; D.skillId=wm.sk?wm.sk.id:null;
        if(!wm.sk) D.cSkill='0';
        syncDiceFromSheet(); if(D.open) renderDice();
      }
      renderMain();save();
    }
    return;
  }
  if(el.dataset.addEqtag){
    const [kind,id]=el.dataset.addEqtag.split(':');
    addEqTagToItem(kind,id,el.value);
    return;
  }
  if(el.id==='fileAvatar'&&el.files[0]){const ctx=getImgMenuContext('avatar','');compressImg(el.files[0],ctx.maxDim,ctx.quality,url=>applyImgUrlForContext(ctx,url,false));el.value='';return;}
  if(el.id==='fileBg'&&el.files[0]){const ctx=getImgMenuContext('bg','');compressImg(el.files[0],ctx.maxDim,ctx.quality,url=>applyImgUrlForContext(ctx,url,false));el.value='';return;}
  if(el.id==='fileItemImg'&&el.files[0]){
    const ctx=getImgMenuContext(UI.imgTargetKind,UI.imgTargetId);
    if(ctx) compressImg(el.files[0],ctx.maxDim,ctx.quality,url=>applyImgUrlForContext(ctx,url,false));
    el.value='';return;
  }
  if(el.id==='fileBioImg'&&el.files[0]){
    const ctx=getImgMenuContext('bio',UI.imgTargetKind==='bio'?UI.imgTargetId:'');
    if(ctx) compressImg(el.files[0],ctx.maxDim,ctx.quality,url=>applyImgUrlForContext(ctx,url,false));
    el.value='';return;
  }
  if(el.dataset.pwlibSel){
    const f=el.dataset.pwlibSel;
    PWLIB[f]=el.value;
    if(f==='adminSrc'){
      if(el.value.startsWith('sec:')){
        const sObj=(S.powerSections||[]).find(s=>s.id===el.value.slice(4));
        if(sObj&&!String(PWLIB.adminName||'').trim()) PWLIB.adminName=String(sObj.name||'').trim();
      }
    }
    if(UI.modal==='powerLibrary') renderModal();
    return;
  }
  if(el.dataset.pwlibChk==='adminIsBasis'){
    PWLIB.adminIsBasis=Boolean(el.checked);
    return;
  }
  if(el.id==='filePwImport'&&el.files[0]){
    const file=el.files[0];
    const r=new FileReader();
    r.onload=ev=>{
      try{
        const parsed=JSON.parse(ev.target.result);
        const valid=parsed&&typeof parsed==='object'&&(
          parsed.schema===POWER_PACK_SCHEMA||
          Array.isArray(parsed.packs)||
          Array.isArray(parsed.sections)||
          Array.isArray(parsed.powerSections)||
          Array.isArray(parsed.powers)||
          Array.isArray(parsed.augments)
        );
        if(!valid){toast('⚠️ Ungültige Datei: Keine Kräfte, Augmente oder Sektionen gefunden.');return;}
        const res=importPowerPackIntoSheet(parsed,{targetSectionId:PWLIB.targetSecId,dedupeMode:PWLIB.dedupeMode});
        const lbl=String(parsed.name||parsed.profile?.name||file.name.replace(/\.json$/i,'')).trim();
        toast(formatPwLibImportToast(res,lbl));
        if(UI.modal==='powerLibrary') renderModal();
      }catch(err){
        toast('⚠️ Ungültige JSON-Datei.');
      }
    };
    r.readAsText(file);
    el.value='';
    return;
  }
  if(el.id==='fileImport'&&el.files[0]){const r=new FileReader();r.onload=ev=>{try{mergeLoaded(JSON.parse(ev.target.result)); CLOUD.viewingRemote=false; CLOUD.remoteCharId=''; resetCloudSyncState({clearMeta:true,status:'saved',lastSyncTs:''}); UI.inLobby=false; UI.sheetLoaded=true; UI.modal=null; exitLobbyNeutralDice(); renderAll(true);toast('Charakterbogen importiert!');}catch(err){toast('Ungültige JSON-Datei.');}};r.readAsText(el.files[0]);el.value='';}
});

document.addEventListener('submit',e=>{
  e.preventDefault(); const id=e.target.id;
  if(id==='formAdminUnlock'){performAdminUnlock();return;}
  if(id==='formAdminChangePin'){performAdminChangePin();return;}
  if(id==='formAddSkill2') upsertSkill($('skName2').value,$('skAttr2').value,$('skCat2').value,$('skRank2').value,'Fertigkeiten',$('skBonOvr2')?$('skBonOvr2').value:'',$('skSec2')?$('skSec2').value:'');
  else if(id==='formAddSkillChron') upsertSkill($('skNameChr').value,$('skAttrChr')?$('skAttrChr').value:'PR',$('skCatChr').value,$('skRankChr').value,'Chronik');
  else if(id==='formAddEp'){const add=toInt($('inpAddEp').value,0);if(add!==0){applyEp(S.progression.ep+add,`${fmtSign(add)} EP`);renderAll();}}
  else if(id==='formLogNote'){const txt=$('inpLogNote').value.trim();if(txt){logChron(`Notiz: ${txt}`);renderMain();renderHeader();save();}}
  else if(id==='formAddAmmoModal'){
    const nm=($('inpAmmoModalName')?.value||'').trim()||`Munition #${S.ammos.length+1}`;
    const qty=Math.max(0,toInt($('inpAmmoModalQty')?.value,20));
    const na=makeAmmo(nm,qty);
    na.dmgCut=($('inpAmmoModalCut')?.value??'0').trim()||'0';
    na.dmgPierce=($('inpAmmoModalPierce')?.value??'0').trim()||'0';
    na.dmgImpact=($('inpAmmoModalImpact')?.value??'0').trim()||'0';
    S.ammos.push(na);
    if(UI.ammoModalWeaponId){
      const w=S.weapons.find(x=>x.id===UI.ammoModalWeaponId);
      if(w) w.ammoId=na.id;
    }
    invalidateModsCache(); syncDiceFromSheet();
    renderMain(); renderModal(); if(D.open) renderDice(); save(); toast(`Munition „${nm}“ (${qty} Stk.) hinzugefügt`);
    setTimeout(()=>$('inpAmmoModalName')?.focus(),0);
  }
  else if(id==='formAddListItem'){
    const val=$('inpListItem').value.trim(); if(!val) return;
    const desc=$('inpListDesc')?$('inpListDesc').value.trim():'';
    if(UI.listType==='weaponTags'||UI.listType==='armorTags'||UI.listType==='ammoTags'){
      const k={weaponTags:'weaponTagList',armorTags:'armorTagList',ammoTags:'ammoTagList'}[UI.listType];
      const ex=S[k].find(t=>t.name.toLowerCase()===val.toLowerCase());
      if(ex){ex.name=val;if(desc)ex.desc=desc;}else S[k].push({name:val,desc});
      S[k]=sortTagDefs(S[k]);
      if(D.open) renderDice();
    }else if(UI.listType==='pwTag'||UI.listType==='subcat'){
      if(isReservedPwTerm(val)){
        toast(`„${val}“ gehört zu Hauptaktionsart / Aktionsunterarten und kann nicht als Tag angelegt werden.`);
        return;
      }
      const canon=DEF_PW_TAGS.find(t=>t.toLowerCase()===val.toLowerCase())||val;
      S.pwTagList=sortAlpha([...(S.pwTagList||DEF_PW_TAGS),canon].filter(t=>!isReservedPwTerm(t)));
      
    }else if(UI.listType==='useRes'&&!S.useResList.includes(val)) S.useResList.push(val);
    else if(UI.listType==='customStats') S.customStats=sortAlpha([...S.customStats,val]);
    renderMain(); renderModal(); save();
  }
});

const isAnyDragging=()=>Boolean(dragPwId||dragAugId||dragSecId||dragSkSecId||dragSkId||dragChrPw||dragChrSec||dragEqSec||dragEqItem||dragInvSecId||dragInvItemId||dragCampId||dragCnPageId||dragCnFolderId||dragToken);
function stopDragAutoScroll(){
  dragMouseY=null;
  if(dragScrollRaf){cancelAnimationFrame(dragScrollRaf);dragScrollRaf=null;}
}
function startDragAutoScroll(){
  if(dragScrollRaf) return;
  const step=()=>{
    if(!isAnyDragging()){stopDragAutoScroll();return;}
    if(dragMouseY!==null){
      const vh=window.innerHeight, hdrH=$('hdrMount')?.offsetHeight||80;
      const topZone=Math.min(vh*0.35,hdrH+75), botZone=vh-95;
      let dy=0;
      if(dragMouseY<topZone){
        const ratio=Math.max(0.15,Math.min(1,(topZone-dragMouseY)/Math.max(40,topZone)));
        dy=-Math.round(5+ratio*20);
      }else if(dragMouseY>botZone){
        const ratio=Math.max(0.15,Math.min(1,(dragMouseY-botZone)/95));
        dy=Math.round(5+ratio*20);
      }
      if(dy!==0) window.scrollBy(0,dy);
    }
    dragScrollRaf=requestAnimationFrame(step);
  };
  dragScrollRaf=requestAnimationFrame(step);
}

document.addEventListener('selectionchange',saveEffRangeIfActive);
document.addEventListener('mousedown',e=>{
  if(e.target.closest?.('[data-action="ins-token"]')){
    saveEffRangeIfActive();
    e.preventDefault();
  }
});
window.addEventListener('wheel',e=>{
  if(isAnyDragging()) window.scrollBy(0,e.deltaY);
},{passive:true});
document.addEventListener('wheel',ev=>{
  if(!D.open) return;
  const diceMount=$('diceMount');
  if(!diceMount||!diceMount.contains(ev.target)) return;
  const inp=ev.target.closest?.('input[data-dice]');
  if(!inp) return;
  if(document.activeElement!==inp) return;
  if(!ev.deltaY) return;
  const step=ev.deltaY<0?1:-1;
  const df=inp.dataset.dice;
  let targetField='';
  if(df==='cAttr'||df==='dAttr'||df==='cCustom'||df==='dCustom'||df==='blockFollowAtk'){
    targetField=df;
  }else if(df==='cDirect'){
    targetField=D.cMode==='direct'?'cDirect':'cAttr';
  }else if(df==='dDirect'){
    targetField=D.dMode==='direct'?'dDirect':(D.dMode==='breakdown'?'dAttr':'');
  }
  if(!targetField) return;
  ev.preventDefault();
  D[targetField]=toInt(D[targetField],0)+step;
  if(targetField==='blockFollowAtk'){
    inp.value=D.blockFollowAtk;
    const th2=D.blockFollowAtk+30, ch2=Math.max(1,Math.min(99,th2)), m2=calcEgMultiplier(th2), info=$('blockFollowThInfo');
    if(info) info.textContent=`Schw. 20 • Schwelle ≤ ${th2} (${ch2}%)${m2>1?` • EG ×${m2}`:''}`;
    return;
  }
  if(targetField==='cDirect'||targetField==='cAttr'||targetField==='cCustom'){
    if(targetField==='cDirect') D.cAttr=D.cDirect;
    else D.cDirect=toInt(D.cAttr,0)+getCSkVal();
  }
  inp.value=D[targetField];
  if($('diceCMath')) $('diceCMath').textContent=`${D.cAttr} + ${getCSkVal()} = ${toInt(D.cAttr)+getCSkVal()}`;
  if($('diceDMath')) $('diceDMath').textContent=`${D.dAttr} + ${getDSkVal()} = ${toInt(D.dAttr)+getDSkVal()}`;
  const dRstBtn=$('btnResetDiceDiff');
  if(dRstBtn){
    const isDiffChg=(getEffD()!==40||D.dMode!=='direct');
    dRstBtn.classList.toggle('!border-amber-400',isDiffChg);
    dRstBtn.classList.toggle('!bg-amber-500/25',isDiffChg);
    dRstBtn.classList.toggle('text-amber-300',isDiffChg);
    dRstBtn.classList.toggle('shadow-sm',isDiffChg);
    dRstBtn.classList.toggle('opacity-70',!isDiffChg);
  }
  diceMount.querySelectorAll('[data-action="dice-set-diff"]').forEach(b=>{
    const act=D.dMode==='direct'&&toInt(D.dDirect)===toInt(b.dataset.val,0);
    b.classList.toggle('btn-pri',act);
    b.classList.toggle('font-black',act);
    b.classList.toggle('opacity-85',!act);
  });
  const dT=calcThreshold();
  if($('diceAdvDisBox')) $('diceAdvDisBox').innerHTML=buildAdvDisInnerHtml(dT);
  if($('diceThBox')) $('diceThBox').innerHTML=buildThresholdInnerHtml(dT);
},{passive:false});

document.addEventListener('dragstart',e=>{
  dragPwId=null; dragAugId=null; dragSecId=null; dragSkSecId=null; dragSkId=null; dragChrPw=null; dragChrSec=null; dragEqSec=null; dragEqItem=null; dragInvSecId=null; dragInvItemId=null; dragCampId=null; dragCnPageId=null; dragCnFolderId=null; dragToken='';
  const cnPgEl=e.target.closest('[data-drag-cnpage]');
  if(cnPgEl){dragCnPageId=cnPgEl.dataset.dragCnpage;e.dataTransfer.effectAllowed='move';e.dataTransfer.setData('text/plain',dragCnPageId);return;}
  const cnFldEl=e.target.closest('[data-drag-cnfolder]');
  if(cnFldEl){dragCnFolderId=cnFldEl.dataset.dragCnfolder;e.dataTransfer.effectAllowed='move';e.dataTransfer.setData('text/plain',dragCnFolderId);return;}
  const pw=e.target.closest('[data-drag-pw]'), ag=e.target.closest('[data-drag-aug]'), sec=e.target.closest('[data-drag-sec]'), sksec=e.target.closest('[data-drag-sksec]'), sk=e.target.closest('[data-drag-sk]'), cpw=e.target.closest('[data-drag-chr-pw]'), chs=e.target.closest('[data-drag-chrsec]'), invs=e.target.closest('[data-drag-invsec]'), invi=e.target.closest('[data-drag-invitem]'), eqs=e.target.closest('[data-drag-eqsec]'), eqi=e.target.closest('[data-drag-eqitem]'), cmp=CLOUD.isAdmin?e.target.closest('[data-drag-camp]'):null, tk=e.target.closest('[data-drag-tok]');
  if(pw){dragPwId=pw.dataset.dragPw;e.dataTransfer.setData('text/plain',dragPwId);}
  else if(ag){dragAugId=ag.dataset.dragAug;e.dataTransfer.setData('text/plain',dragAugId);}
  else if(sec){dragSecId=sec.dataset.dragSec;e.dataTransfer.setData('text/plain',dragSecId);}
  else if(sksec){dragSkSecId=sksec.dataset.dragSksec;e.dataTransfer.setData('text/plain',dragSkSecId);}
  else if(sk){dragSkId=sk.dataset.dragSk;e.dataTransfer.setData('text/plain',dragSkId);}
  else if(cpw){dragChrPw=cpw.dataset.dragChrPw;e.dataTransfer.setData('text/plain',dragChrPw);}
  else if(chs){dragChrSec=chs.dataset.dragChrsec;e.dataTransfer.setData('text/plain',dragChrSec);}
  else if(invi){dragInvItemId=invi.dataset.dragInvitem;e.dataTransfer.effectAllowed='move';e.dataTransfer.setData('text/plain',dragInvItemId);e.stopPropagation();}
  else if(invs){dragInvSecId=invs.dataset.dragInvsec;e.dataTransfer.effectAllowed='move';e.dataTransfer.setData('text/plain',dragInvSecId);e.stopPropagation();}
  else if(eqs){dragEqSec=eqs.dataset.dragEqsec;e.dataTransfer.setData('text/plain',dragEqSec);}
  else if(eqi){dragEqItem=eqi.dataset.dragEqitem;e.dataTransfer.setData('text/plain',dragEqItem);}
  else if(cmp&&CLOUD.isAdmin){dragCampId=cmp.dataset.dragCamp;e.dataTransfer.setData('text/plain',dragCampId);}
  else if(tk){const it=(tk.dataset.pwKind&&tk.dataset.pwId)?findPwItem(tk.dataset.pwKind,tk.dataset.pwId):null;const tok=it?getPwBuilderToken(it):(tk.dataset.dragTok||'');if(!tok){e.preventDefault();return;}dragToken=tok;tk.dataset.dragTok=tok;e.dataTransfer.setData('text/plain',dragToken);}
  if(isAnyDragging()){dragMouseY=e.clientY;startDragAutoScroll();}
});
function clearPwSecDropIndicators(){
  document.querySelectorAll('.pw-sec-slot.active').forEach(x=>x.classList.remove('active'));
  document.querySelectorAll('.pw-drop-before,.pw-drop-after,.pw-drop-over').forEach(x=>x.classList.remove('pw-drop-before','pw-drop-after','pw-drop-over'));
}
function placePowerSection(secId,newParentId,beforeSecId,afterSecId){
  if(!secId||secId===beforeSecId||secId===afterSecId) return false;
  const targetParent=String(newParentId||'');
  if(!canSetSecParent(S.powerSections,secId,targetParent)) return false;
  const oldIdx=S.powerSections.findIndex(s=>s.id===secId);
  if(oldIdx<0) return false;
  const [moved]=S.powerSections.splice(oldIdx,1);
  moved.parentSectionId=targetParent;
  let insertIdx=-1;
  if(beforeSecId){
    insertIdx=S.powerSections.findIndex(s=>s.id===beforeSecId);
  }else if(afterSecId){
    const ai=S.powerSections.findIndex(s=>s.id===afterSecId);
    if(ai>-1) insertIdx=ai+1;
  }else{
    let lastSibIdx=-1;
    for(let i=0;i<S.powerSections.length;i++){
      if(String(S.powerSections[i].parentSectionId||'')===targetParent) lastSibIdx=i;
    }
    insertIdx=lastSibIdx>-1?lastSibIdx+1:S.powerSections.length;
  }
  if(insertIdx<0||insertIdx>S.powerSections.length) insertIdx=S.powerSections.length;
  S.powerSections.splice(insertIdx,0,moved);
  sanitizeSecHierarchy(S.powerSections);
  save();
  renderMain();
  return true;
}
function placeInvSection(secId,newParentId,beforeSecId,afterSecId){
  if(!Array.isArray(S.invSections)) S.invSections=[];
  if(!secId||secId===beforeSecId||secId===afterSecId) return false;
  const targetParent=String(newParentId||'');
  if(!canSetSecParent(S.invSections,secId,targetParent)) return false;
  const oldIdx=S.invSections.findIndex(s=>s.id===secId);
  if(oldIdx<0) return false;
  const [moved]=S.invSections.splice(oldIdx,1);
  moved.parentSectionId=targetParent;
  let insertIdx=-1;
  if(beforeSecId){
    insertIdx=S.invSections.findIndex(s=>s.id===beforeSecId);
  }else if(afterSecId){
    const ai=S.invSections.findIndex(s=>s.id===afterSecId);
    if(ai>-1) insertIdx=ai+1;
  }else{
    let lastSibIdx=-1;
    for(let i=0;i<S.invSections.length;i++){
      if(String(S.invSections[i].parentSectionId||'')===targetParent) lastSibIdx=i;
    }
    insertIdx=lastSibIdx>-1?lastSibIdx+1:S.invSections.length;
  }
  if(insertIdx<0||insertIdx>S.invSections.length) insertIdx=S.invSections.length;
  S.invSections.splice(insertIdx,0,moved);
  sanitizeSecHierarchy(S.invSections);
  save();
  renderMain();
  return true;
}
document.addEventListener('dragend',()=>{
  stopDragAutoScroll();
  clearPwSecDropIndicators();
  document.querySelectorAll('.sk-drop-over').forEach(x=>x.classList.remove('sk-drop-over'));
  dragCnPageId=null; dragCnFolderId=null;
  dragPwId=null; dragAugId=null; dragSecId=null; dragSkSecId=null; dragSkId=null; dragChrPw=null; dragChrSec=null; dragEqSec=null; dragEqItem=null; dragInvSecId=null; dragInvItemId=null; dragCampId=null; dragToken='';
});
document.addEventListener('dragover',e=>{
  const adminIconDrop=e.target?.closest?.('[data-admin-icon-drop]');
  if(adminIconDrop && UI.modal==='adminIcons' && CLOUD.isAdmin){
    e.preventDefault();
    if(e.dataTransfer) e.dataTransfer.dropEffect='copy';
    document.querySelectorAll('[data-admin-icon-drop].ring-2').forEach(el=>{if(el!==adminIconDrop) el.classList.remove('ring-2','ring-amber-400');});
    adminIconDrop.classList.add('ring-2','ring-amber-400');
    return;
  }
  if(dragCnPageId&&(e.target.closest('[data-drop-cnpage]')||e.target.closest('[data-drop-cnfolder]'))){e.preventDefault();return;}
  if(dragCnFolderId&&e.target.closest('[data-drop-cnfolder]')){e.preventDefault();return;}
  if(isAnyDragging()){
    e.preventDefault();
    dragMouseY=e.clientY;
    startDragAutoScroll();
  }
  if(dragSecId){
    clearPwSecDropIndicators();
    const tgt=e.target&&e.target.nodeType===1?e.target:e.target?.parentElement;
    const slot=tgt?.closest?.('[data-pw-sec-slot]');
    if(slot){
      const slotParentId=slot.dataset.pwSecSlot||'';
      const slotBeforeSecId=slot.dataset.beforeSec||'';
      if(slotBeforeSecId!==dragSecId&&canSetSecParent(S.powerSections,dragSecId,slotParentId)){
        slot.classList.add('active');
      }
      return;
    }
    const secBox=tgt?.closest?.('[data-pw-sec]');
    if(secBox){
      const targetId=secBox.dataset.pwSec||'';
      if(!targetId){
        const dragged=S.powerSections.find(s=>s.id===dragSecId);
        if(dragged&&dragged.parentSectionId) secBox.classList.add('pw-drop-over');
        return;
      }
      if(targetId!==dragSecId){
        const targetSec=S.powerSections.find(s=>s.id===targetId);
        if(targetSec){
          const rect=secBox.getBoundingClientRect();
          const relY=rect.height>0?(e.clientY-rect.top)/rect.height:0.5;
          const sibParentId=String(targetSec.parentSectionId||'');
          if(relY<0.22){
            if(canSetSecParent(S.powerSections,dragSecId,sibParentId)) secBox.classList.add('pw-drop-before');
          }else if(relY>0.78){
            if(canSetSecParent(S.powerSections,dragSecId,sibParentId)) secBox.classList.add('pw-drop-after');
          }else{
            if(canSetSecParent(S.powerSections,dragSecId,targetSec.id)) secBox.classList.add('pw-drop-over');
          }
        }
      }
    }
    return;
  }
  if(dragInvSecId){
    clearPwSecDropIndicators();
    const tgt=e.target&&e.target.nodeType===1?e.target:e.target?.parentElement;
    const slot=tgt?.closest?.('[data-inv-sec-slot]');
    if(slot){
      e.stopPropagation();
      const slotParentId=slot.dataset.invSecSlot||'';
      const slotBeforeSecId=slot.dataset.beforeSec||'';
      if(slotBeforeSecId!==dragInvSecId&&canSetSecParent(S.invSections,dragInvSecId,slotParentId)){
        slot.classList.add('active');
      }
      return;
    }
    const secBox=tgt?.closest?.('[data-inv-sec]');
    if(secBox){
      e.stopPropagation();
      const targetId=secBox.dataset.invSec||'';
      if(!targetId){
        const dragged=(S.invSections||[]).find(s=>s.id===dragInvSecId);
        if(dragged&&dragged.parentSectionId) secBox.classList.add('pw-drop-over');
        return;
      }
      if(targetId!==dragInvSecId){
        const targetSec=(S.invSections||[]).find(s=>s.id===targetId);
        if(targetSec){
          const rect=secBox.getBoundingClientRect();
          const relY=rect.height>0?(e.clientY-rect.top)/rect.height:0.5;
          const sibParentId=String(targetSec.parentSectionId||'');
          if(relY<0.22){
            if(canSetSecParent(S.invSections,dragInvSecId,sibParentId)) secBox.classList.add('pw-drop-before');
          }else if(relY>0.78){
            if(canSetSecParent(S.invSections,dragInvSecId,sibParentId)) secBox.classList.add('pw-drop-after');
          }else{
            if(canSetSecParent(S.invSections,dragInvSecId,targetSec.id)) secBox.classList.add('pw-drop-over');
          }
        }
      }
    }
    return;
  }
  if(dragInvItemId){
    clearPwSecDropIndicators();
    const tgt=e.target&&e.target.nodeType===1?e.target:e.target?.parentElement;
    const itemRow=tgt?.closest?.('[data-inv-item]');
    if(itemRow&&itemRow.dataset.invItem!==dragInvItemId){
      e.stopPropagation();
      const rect=itemRow.getBoundingClientRect();
      const relY=rect.height>0?(e.clientY-rect.top)/rect.height:0.5;
      itemRow.classList.add(relY<0.5?'pw-drop-before':'pw-drop-after');
      return;
    }
    const invSecBox=tgt?.closest?.('[data-inv-sec]');
    if(invSecBox){
      e.stopPropagation();
      invSecBox.classList.add('pw-drop-over');
    }
    return;
  }
  if(dragAugId){
    clearPwSecDropIndicators();
    const tgt=e.target&&e.target.nodeType===1?e.target:e.target?.parentElement;
    const srcAug=S.augments.find(a=>a.id===dragAugId);
    const agCard=tgt?.closest?.('[data-aug-card]');
    if(agCard&&srcAug){
      const targetAugId=agCard.dataset.augCard||'';
      if(targetAugId===dragAugId){e.stopPropagation();return;}
      const targetAug=S.augments.find(a=>a.id===targetAugId);
      if(targetAug){
        const targetIsFree=!targetAug.parentPowerId;
        const sameParent=Boolean(srcAug.parentPowerId&&targetAug.parentPowerId&&srcAug.parentPowerId===targetAug.parentPowerId);
        if(targetIsFree||sameParent){
          e.stopPropagation();
          const rect=agCard.getBoundingClientRect();
          const relY=rect.height>0?(e.clientY-rect.top)/rect.height:0.5;
          agCard.classList.add(relY<0.5?'pw-drop-before':'pw-drop-after');
          return;
        }
      }
    }
    const pwGrp=tgt?.closest?.('[data-pw-group]');
    if(pwGrp&&srcAug){
      e.stopPropagation();
      if(srcAug.parentPowerId!==(pwGrp.dataset.pwGroup||'')){
        pwGrp.classList.add('pw-drop-over');
      }
      return;
    }
    const pwSec=tgt?.closest?.('[data-pw-sec]');
    if(pwSec&&srcAug){
      e.stopPropagation();
      const targetSecId=getValidPwSecId(pwSec.dataset.pwSec||'');
      if(Boolean(srcAug.parentPowerId)||getValidPwSecId(srcAug.sectionId)!==targetSecId){
        pwSec.classList.add('pw-drop-over');
      }
    }
    return;
  }
  const grp=dragPwId?e.target.closest('[data-pw-group]'):null;
  const secBox=dragPwId?e.target.closest('[data-pw-sec]'):null;
  const skSecBox=(dragSkId||dragSkSecId)?e.target.closest('[data-sk-sec]'):null;
  const agCard=null;
  const skRow=dragSkId?e.target.closest('[data-sk-row]'):null;
  const cpwRow=dragChrPw?e.target.closest('[data-chr-pw]'):null;
  const chrSecBox=dragChrSec?e.target.closest('[data-chrsec]'):null;
  const eqSecBox=dragEqSec?e.target.closest('[data-eqsec]'):null;
  const eqItemBox=dragEqItem?e.target.closest('[data-eqitem]'):null;
  const campTabBox=(dragCampId&&CLOUD.isAdmin)?e.target.closest('[data-camp-tab]'):null;
  const ta=dragToken?(/^\{\{[\s\S]*\}\}$/.test(dragToken)?e.target.closest('[data-pwf$=":desc"],[data-pwf$=":effects"],[data-pwf$=":rules"]'):e.target.closest('[id^="eff_"]')):null;
  if(grp||secBox||skSecBox||agCard||skRow||cpwRow||chrSecBox||eqSecBox||eqItemBox||campTabBox||ta){
    e.preventDefault();
    document.querySelectorAll('[data-pw-sec].pw-drop-over,[data-sk-sec].pw-drop-over,[data-camp-tab].pw-drop-over').forEach(x=>x.classList.remove('pw-drop-over','sk-drop-over'));
    if(grp) grp.classList.add('pw-drop-over');
    else if(secBox) secBox.classList.add('pw-drop-over');
    if(skRow) skRow.classList.add('sk-drop-over');
    else if(skSecBox) skSecBox.classList.add('pw-drop-over');
    if(agCard) agCard.classList.add('pw-drop-over');
    if(cpwRow) cpwRow.classList.add('sk-drop-over');
    if(chrSecBox) chrSecBox.classList.add('pw-drop-over');
    if(eqSecBox) eqSecBox.classList.add('pw-drop-over');
    if(eqItemBox) eqItemBox.classList.add('pw-drop-over');
    if(campTabBox) campTabBox.classList.add('pw-drop-over');
    if(ta){
      ta.classList.add('pw-drop-over');
      const r=getCaretRangeAtPoint(e.clientX,e.clientY);
      if(r&&ta.contains(r.startContainer)){
        if(document.activeElement!==ta) ta.focus();
        const sel=window.getSelection();
        if(sel){sel.removeAllRanges();sel.addRange(r);}
        if(ta.id?.startsWith('eff_')) savedEffRanges[ta.id.slice(4)]=r.cloneRange();
        if(ta.dataset?.pwf){const [,tid,tf]=ta.dataset.pwf.split(':');if(tid&&['desc','effects','rules'].includes(tf)){savedPwRanges[`${tid}:${tf}`]=r.cloneRange();lastPwFieldById[tid]=tf;}}
      }
    }
  }
  const avDrop=e.target.closest?.('#imgDropZone');
  if(avDrop&&e.dataTransfer?.types&&Array.from(e.dataTransfer.types).includes('Files')){
    e.preventDefault();
    avDrop.classList.add('pw-drop-over');
  }
});
document.addEventListener('dragleave',e=>{
  const adminIconDrop=e.target?.closest?.('[data-admin-icon-drop]');
  if(adminIconDrop && (!e.relatedTarget || !adminIconDrop.contains(e.relatedTarget))){
    adminIconDrop.classList.remove('ring-2','ring-amber-400');
  }
  if(dragSecId){
    const tgt=e.target&&e.target.nodeType===1?e.target:e.target?.parentElement;
    const sl=tgt?.closest?.('[data-pw-sec-slot]');
    if(sl&&(!e.relatedTarget||!sl.contains(e.relatedTarget))) sl.classList.remove('active');
    const sb=tgt?.closest?.('[data-pw-sec]');
    if(sb&&(!e.relatedTarget||!sb.contains(e.relatedTarget))) sb.classList.remove('pw-drop-before','pw-drop-after','pw-drop-over');
    return;
  }
  if(dragInvSecId){
    const tgt=e.target&&e.target.nodeType===1?e.target:e.target?.parentElement;
    const sl=tgt?.closest?.('[data-inv-sec-slot]');
    if(sl&&(!e.relatedTarget||!sl.contains(e.relatedTarget))) sl.classList.remove('active');
    const sb=tgt?.closest?.('[data-inv-sec]');
    if(sb&&(!e.relatedTarget||!sb.contains(e.relatedTarget))) sb.classList.remove('pw-drop-before','pw-drop-after','pw-drop-over');
    return;
  }
  if(dragAugId){
    const tgt=e.target&&e.target.nodeType===1?e.target:e.target?.parentElement;
    const ac=tgt?.closest?.('[data-aug-card]');
    if(ac&&(!e.relatedTarget||!ac.contains(e.relatedTarget))) ac.classList.remove('pw-drop-before','pw-drop-after','pw-drop-over');
    const pg=tgt?.closest?.('[data-pw-group]');
    if(pg&&(!e.relatedTarget||!pg.contains(e.relatedTarget))) pg.classList.remove('pw-drop-over');
    const ps=tgt?.closest?.('[data-pw-sec]');
    if(ps&&(!e.relatedTarget||!ps.contains(e.relatedTarget))) ps.classList.remove('pw-drop-over');
    return;
  }
  if(dragInvItemId){
    const tgt=e.target&&e.target.nodeType===1?e.target:e.target?.parentElement;
    const ir=tgt?.closest?.('[data-inv-item]');
    if(ir&&(!e.relatedTarget||!ir.contains(e.relatedTarget))) ir.classList.remove('pw-drop-before','pw-drop-after');
    const sb=tgt?.closest?.('[data-inv-sec]');
    if(sb&&(!e.relatedTarget||!sb.contains(e.relatedTarget))) sb.classList.remove('pw-drop-over');
    return;
  }
  ['[data-pw-group]','[data-pw-sec]','[data-sk-sec]','[data-aug-card]','[data-chrsec]','[data-eqsec]','[data-eqitem]','[data-inv-sec]','[data-camp-tab]','[id^="eff_"]','#imgDropZone'].forEach(sel=>{const x=e.target.closest?.(sel);if(x)x.classList.remove('pw-drop-over');});
  ['[data-sk-row]','[data-chr-pw]','[data-drop-cnpage]'].forEach(sel=>{const x=e.target.closest?.(sel);if(x)x.classList.remove('sk-drop-over');});
});
document.addEventListener('drop',e=>{
  const adminIconDrop=e.target?.closest?.('[data-admin-icon-drop]');
  if(adminIconDrop && UI.modal==='adminIcons'){
    e.preventDefault();
    e.stopPropagation();
    document.querySelectorAll('[data-admin-icon-drop].ring-2').forEach(el=>el.classList.remove('ring-2','ring-amber-400'));
    if(!CLOUD.isAdmin){toast('🔒 Nur der Admin kann Standard-Icons ändern.');return;}
    const ikey=adminIconDrop.dataset.adminIconDrop||'';
    const f=e.dataTransfer?.files?.[0];
    if(f&&ikey) handleAdminIconFileUpload(f,ikey);
    return;
  }
  stopDragAutoScroll();
  clearPwSecDropIndicators();
  document.querySelectorAll('.sk-drop-over').forEach(x=>x.classList.remove('sk-drop-over'));
  if(dragCnFolderId){
    const dropFld=e.target.closest('[data-drop-cnfolder]');
    const targetFid=dropFld?.dataset.dropCnfolder;
    const srcFid=dragCnFolderId; dragCnFolderId=null;
    if(targetFid&&srcFid&&targetFid!==srcFid){
      ensureCampNotesStructure();
      const fIdx=S.campNoteFolders.findIndex(f=>f.id===srcFid);
      const tIdx=S.campNoteFolders.findIndex(f=>f.id===targetFid);
      if(fIdx>=0&&tIdx>=0){
        const [mv]=S.campNoteFolders.splice(fIdx,1);
        S.campNoteFolders.splice(tIdx,0,mv);
        save(); renderCampNotes();
      }
    }
    return;
  }
  if(dragCnPageId){
    const dropPg=e.target.closest('[data-drop-cnpage]');
    const dropFld=e.target.closest('[data-drop-cnfolder]');
    const srcId=dragCnPageId; dragCnPageId=null;
    ensureCampNotesStructure();
    const srcPg=S.campaignNotes.find(n=>n.id===srcId);
    if(!srcPg) return;
    if(dropPg&&dropPg.dataset.dropCnpage&&dropPg.dataset.dropCnpage!==srcId){
      const targetPg=S.campaignNotes.find(n=>n.id===dropPg.dataset.dropCnpage);
      if(targetPg){
        const targetFolder=S.campNoteFolders.find(f=>f.id===targetPg.folderId);
        srcPg.folderId=targetPg.folderId;
        srcPg.isPublic=Boolean(targetFolder?targetFolder.isPublic:targetPg.isPublic);
        srcPg.updatedAt=stamp();
        const fromIdx=S.campaignNotes.indexOf(srcPg);
        S.campaignNotes.splice(fromIdx,1);
        const toIdx=S.campaignNotes.indexOf(targetPg);
        S.campaignNotes.splice(toIdx,0,srcPg);
        syncPublicNotesAfterChange(srcPg);
        save(); renderCampNotes();
      }
    }else if(dropFld&&dropFld.dataset.dropCnfolder){
      const targetFolder=S.campNoteFolders.find(f=>f.id===dropFld.dataset.dropCnfolder);
      if(targetFolder){
        srcPg.folderId=targetFolder.id;
        srcPg.isPublic=Boolean(targetFolder.isPublic);
        srcPg.updatedAt=stamp();
        syncPublicNotesAfterChange(srcPg);
        save(); renderCampNotes();
      }
    }
    return;
  }
  if(dragPwId){
    const grp=e.target.closest('[data-pw-group]'), secBox=e.target.closest('[data-pw-sec]');
    if(grp&&grp.dataset.pwGroup!==dragPwId){
      e.preventDefault();
      const i1=S.powers.findIndex(p=>p.id===dragPwId), i2=S.powers.findIndex(p=>p.id===grp.dataset.pwGroup);
      if(i1>-1&&i2>-1){
        const targetSec=S.powers[i2].sectionId||'';
        const [it]=S.powers.splice(i1,1);
        it.sectionId=targetSec;
        const newI2=S.powers.findIndex(p=>p.id===grp.dataset.pwGroup);
        S.powers.splice(newI2>-1?newI2:S.powers.length,0,it);
        renderMain();save();
      }
    }else if(secBox){
      e.preventDefault();
      const p=S.powers.find(x=>x.id===dragPwId);
      if(p){p.sectionId=secBox.dataset.pwSec||'';renderMain();save();}
    }
    dragPwId=null;
  }else if(dragSecId){
    const srcId=dragSecId;
    dragSecId=null;
    const tgt=e.target&&e.target.nodeType===1?e.target:e.target?.parentElement;
    const slot=tgt?.closest?.('[data-pw-sec-slot]');
    const dragged=S.powerSections.find(s=>s.id===srcId);
    if(slot&&dragged){
      e.preventDefault();
      const slotParentId=slot.dataset.pwSecSlot||'';
      const slotBeforeSecId=slot.dataset.beforeSec||'';
      if(!canSetSecParent(S.powerSections,srcId,slotParentId)){
        toast('⚠️ Zyklus verhindert: Eine Sektion kann nicht in ihre eigene Untersektion verschoben werden.');
      }else if(placePowerSection(srcId,slotParentId,slotBeforeSecId,'')){
        toast(slotParentId?`Sektion „${dragged.name||'Sektion'}“ in Unterebene einsortiert`:`Sektion „${dragged.name||'Sektion'}“ auf Hauptebene einsortiert`);
      }
    }else{
      const secBox=tgt?.closest?.('[data-pw-sec]');
      if(secBox&&dragged){
        const targetId=secBox.dataset.pwSec||'';
        if(!targetId){
          if(dragged.parentSectionId){
            e.preventDefault();
            if(placePowerSection(srcId,'','','')){
              toast(`Sektion „${dragged.name||'Sektion'}“ auf Hauptebene verschoben`);
            }
          }
        }else if(targetId!==srcId){
          const targetSec=S.powerSections.find(s=>s.id===targetId);
          if(targetSec){
            e.preventDefault();
            const rect=secBox.getBoundingClientRect();
            const relY=rect.height>0?(e.clientY-rect.top)/rect.height:0.5;
            const sibParentId=String(targetSec.parentSectionId||'');
            if(relY<0.22){
              if(!canSetSecParent(S.powerSections,srcId,sibParentId)){
                toast('⚠️ Zyklus verhindert: Eine Sektion kann nicht in ihre eigene Untersektion verschoben werden.');
              }else if(placePowerSection(srcId,sibParentId,targetSec.id,'')){
                toast(`Sektion „${dragged.name||'Sektion'}“ vor „${targetSec.name||'Sektion'}“ einsortiert`);
              }
            }else if(relY>0.78){
              if(!canSetSecParent(S.powerSections,srcId,sibParentId)){
                toast('⚠️ Zyklus verhindert: Eine Sektion kann nicht in ihre eigene Untersektion verschoben werden.');
              }else if(placePowerSection(srcId,sibParentId,'',targetSec.id)){
                toast(`Sektion „${dragged.name||'Sektion'}“ nach „${targetSec.name||'Sektion'}“ einsortiert`);
              }
            }else{
              if(!canSetSecParent(S.powerSections,srcId,targetSec.id)){
                toast('⚠️ Zyklus verhindert: Eine Sektion kann nicht in ihre eigene Untersektion verschoben werden.');
              }else{
                targetSec.collapsed=false;
                if(placePowerSection(srcId,targetSec.id,'','')){
                  toast(`Sektion „${dragged.name||'Sektion'}“ in „${targetSec.name||'Sektion'}“ verschoben`);
                }
              }
            }
          }
        }
      }
    }
  }else if(dragAugId){
    const srcId=dragAugId;
    dragAugId=null;
    const tgt=e.target&&e.target.nodeType===1?e.target:e.target?.parentElement;
    const srcIdx=S.augments.findIndex(a=>a.id===srcId);
    const srcAug=srcIdx>-1?S.augments[srcIdx]:null;
    if(srcAug){
      const agCard=tgt?.closest?.('[data-aug-card]');
      const pwGrp=tgt?.closest?.('[data-pw-group]');
      const pwSec=tgt?.closest?.('[data-pw-sec]');
      let handled=false;
      if(agCard){
        const targetAugId=agCard.dataset.augCard||'';
        if(targetAugId===srcId){
          e.preventDefault();
          e.stopPropagation();
          handled=true;
        }else{
          const targetAug=S.augments.find(a=>a.id===targetAugId);
          const targetIsFree=Boolean(targetAug&&!targetAug.parentPowerId);
          const sameParent=Boolean(targetAug&&srcAug.parentPowerId&&targetAug.parentPowerId&&srcAug.parentPowerId===targetAug.parentPowerId);
          if(targetAug&&(targetIsFree||sameParent)){
            e.preventDefault();
            e.stopPropagation();
            const rect=agCard.getBoundingClientRect();
            const insertAfter=rect.height>0?((e.clientY-rect.top)/rect.height)>=0.5:false;
            const prevSec=getValidPwSecId(srcAug.sectionId), prevPar=String(srcAug.parentPowerId||'');
            const [moved]=S.augments.splice(srcIdx,1);
            if(targetIsFree){
              moved.parentPowerId='';
              moved.sectionId=getValidPwSecId(targetAug.sectionId);
            }
            const newTargetIdx=S.augments.findIndex(a=>a.id===targetAugId);
            const insIdx=newTargetIdx>-1?(insertAfter?newTargetIdx+1:newTargetIdx):S.augments.length;
            S.augments.splice(insIdx,0,moved);
            save();
            renderMain();
            if(targetIsFree&&(prevPar||prevSec!==moved.sectionId)){
              const secObj=moved.sectionId?S.powerSections.find(s=>s.id===moved.sectionId):null;
              toast(secObj?`Augment in Sektion „${secObj.name||'Sektion'}“ einsortiert`:'Augment in „Ohne Sektion“ einsortiert');
            }
            handled=true;
          }
        }
      }
      if(!handled&&pwGrp){
        const targetPid=pwGrp.dataset.pwGroup||'';
        const targetPw=S.powers.find(p=>p.id===targetPid);
        if(targetPw){
          e.preventDefault();
          e.stopPropagation();
          if(srcAug.parentPowerId!==targetPid){
            const linked=getLinkedAugs(targetPid);
            if(linked.length>=3){
              toast('⚠️ Maximal 3 Augmente pro Kraft!');
            }else{
              const grpMsp=calcPwCost(targetPw).msp+linked.reduce((s,a)=>s+calcPwCost(a).msp,0);
              const augMsp=calcPwCost(srcAug).msp;
              if(grpMsp+augMsp>1){
                toast('⚠️ Kollektives Limit: Maximal 1 MsP pro Kraft-Gruppe erlaubt!');
              }else{
                linkAugToPower(srcAug,targetPid);
                save();
                renderMain();
                toast(`Augment mit „${targetPw.name||'Unbenannte Kraft'}“ verknüpft`);
              }
            }
          }
          handled=true;
        }
      }
      if(!handled&&pwSec){
        e.preventDefault();
        e.stopPropagation();
        const targetSecId=getValidPwSecId(pwSec.dataset.pwSec||'');
        const changed=Boolean(srcAug.parentPowerId)||getValidPwSecId(srcAug.sectionId)!==targetSecId;
        srcAug.parentPowerId='';
        srcAug.sectionId=targetSecId;
        if(targetSecId){
          const secObj=S.powerSections.find(s=>s.id===targetSecId);
          if(secObj) secObj.collapsed=false;
          if(changed) toast(`Augment in Sektion „${secObj?.name||'Sektion'}“ verschoben`);
        }else if(changed){
          toast('Augment aus Sektion herausgelöst');
        }
        save();
        renderMain();
      }
    }
  }else if(dragSkSecId){
    const skSecBox=e.target.closest('[data-sk-sec]');
    if(skSecBox){
      const targetId=skSecBox.dataset.skSec||'', dragged=S.skillSections.find(s=>s.id===dragSkSecId);
      if(dragged&&targetId!==dragSkSecId){
        e.preventDefault();
        if(!canSetSecParent(S.skillSections,dragSkSecId,targetId)){
          toast('⚠️ Zyklus verhindert: Eine Sektion kann nicht in ihre eigene Untersektion verschoben werden.');
        }else{
          dragged.parentSectionId=targetId;
          if(targetId){const par=S.skillSections.find(s=>s.id===targetId);if(par)par.collapsed=false;}
          renderMain();save();
          toast(targetId?`Sektion „${dragged.name||'Sektion'}“ in Sektion verschoben`:`Sektion „${dragged.name||'Sektion'}“ auf Hauptebene verschoben`);
        }
      }
    }
    dragSkSecId=null;
  }else if(dragSkId){
    const skRow=e.target.closest('[data-sk-row]'), skSecBox=e.target.closest('[data-sk-sec]');
    if(skRow&&skRow.dataset.skRow!==dragSkId){
      e.preventDefault();
      const i1=S.skills.findIndex(s=>s.id===dragSkId), i2=S.skills.findIndex(s=>s.id===skRow.dataset.skRow);
      if(i1>-1&&i2>-1){
        const targetSec=S.skills[i2].sectionId||'';
        const [it]=S.skills.splice(i1,1);
        if(S.activeTab==='skills') it.sectionId=targetSec;
        const newI2=S.skills.findIndex(s=>s.id===skRow.dataset.skRow);
        S.skills.splice(newI2>-1?newI2:S.skills.length,0,it);
        renderMain();save();
      }
    }else if(skSecBox){
      e.preventDefault();
      const sk=S.skills.find(s=>s.id===dragSkId);
      if(sk){sk.sectionId=skSecBox.dataset.skSec||'';renderMain();save();}
    }
    dragSkId=null;
  }else if(dragChrPw){
    const cpwRow=e.target.closest('[data-chr-pw]');
    if(cpwRow&&cpwRow.dataset.chrPw!==dragChrPw){
      e.preventDefault();
      const [k1,id1]=dragChrPw.split(':'), [k2,id2]=cpwRow.dataset.chrPw.split(':');
      if(k1===k2){
        const arr=k1==='augment'?S.augments:S.powers;
        const i1=arr.findIndex(x=>x.id===id1), i2=arr.findIndex(x=>x.id===id2);
        if(i1>-1&&i2>-1){const [it]=arr.splice(i1,1);arr.splice(i2,0,it);renderMain();save();}
      }
    }
    dragChrPw=null;
  }else if(dragChrSec){
    const chrSecBox=e.target.closest('[data-chrsec]');
    if(chrSecBox&&chrSecBox.dataset.chrsec&&chrSecBox.dataset.chrsec!==dragChrSec){
      e.preventDefault();
      if(!Array.isArray(S.chrSecOrder)||S.chrSecOrder.length!==3) S.chrSecOrder=[...DEF_CHR_SEC_ORDER];
      const i1=S.chrSecOrder.indexOf(dragChrSec), i2=S.chrSecOrder.indexOf(chrSecBox.dataset.chrsec);
      if(i1>-1&&i2>-1){const [it]=S.chrSecOrder.splice(i1,1);S.chrSecOrder.splice(i2,0,it);renderMain();save();}
    }
    dragChrSec=null;
  }else if(dragInvSecId){
    const srcId=dragInvSecId;
    dragInvSecId=null;
    const tgt=e.target&&e.target.nodeType===1?e.target:e.target?.parentElement;
    const slot=tgt?.closest?.('[data-inv-sec-slot]');
    const dragged=(S.invSections||[]).find(s=>s.id===srcId);
    if(slot&&dragged){
      e.preventDefault();
      e.stopPropagation();
      const slotParentId=slot.dataset.invSecSlot||'';
      const slotBeforeSecId=slot.dataset.beforeSec||'';
      if(!canSetSecParent(S.invSections,srcId,slotParentId)){
        toast('⚠️ Zyklus verhindert: Ein Beutel kann nicht in seinen eigenen Unterordner verschoben werden.');
      }else if(placeInvSection(srcId,slotParentId,slotBeforeSecId,'')){
        toast(slotParentId?`Beutel „${dragged.name||'Beutel'}“ in Unterebene einsortiert`:`Beutel „${dragged.name||'Beutel'}“ auf Hauptebene einsortiert`);
      }
    }else{
      const secBox=tgt?.closest?.('[data-inv-sec]');
      if(secBox&&dragged){
        const targetId=secBox.dataset.invSec||'';
        if(!targetId){
          if(dragged.parentSectionId){
            e.preventDefault();
            e.stopPropagation();
            if(placeInvSection(srcId,'','','')){
              toast(`Beutel „${dragged.name||'Beutel'}“ auf Hauptebene verschoben`);
            }
          }
        }else if(targetId!==srcId){
          const targetSec=(S.invSections||[]).find(s=>s.id===targetId);
          if(targetSec){
            e.preventDefault();
            e.stopPropagation();
            const rect=secBox.getBoundingClientRect();
            const relY=rect.height>0?(e.clientY-rect.top)/rect.height:0.5;
            const sibParentId=String(targetSec.parentSectionId||'');
            if(relY<0.22){
              if(!canSetSecParent(S.invSections,srcId,sibParentId)){
                toast('⚠️ Zyklus verhindert: Ein Beutel kann nicht in seinen eigenen Unterordner verschoben werden.');
              }else if(placeInvSection(srcId,sibParentId,targetSec.id,'')){
                toast(`Beutel „${dragged.name||'Beutel'}“ vor „${targetSec.name||'Beutel'}“ einsortiert`);
              }
            }else if(relY>0.78){
              if(!canSetSecParent(S.invSections,srcId,sibParentId)){
                toast('⚠️ Zyklus verhindert: Ein Beutel kann nicht in seinen eigenen Unterordner verschoben werden.');
              }else if(placeInvSection(srcId,sibParentId,'',targetSec.id)){
                toast(`Beutel „${dragged.name||'Beutel'}“ nach „${targetSec.name||'Beutel'}“ einsortiert`);
              }
            }else{
              if(!canSetSecParent(S.invSections,srcId,targetSec.id)){
                toast('⚠️ Zyklus verhindert: Ein Beutel kann nicht in seinen eigenen Unterordner verschoben werden.');
              }else{
                targetSec.collapsed=false;
                if(placeInvSection(srcId,targetSec.id,'','')){
                  toast(`Beutel „${dragged.name||'Beutel'}“ in „${targetSec.name||'Beutel'}“ verschoben`);
                }
              }
            }
          }
        }
      }
    }
  }else if(dragInvItemId){
    const srcId=dragInvItemId;
    dragInvItemId=null;
    const tgt=e.target&&e.target.nodeType===1?e.target:e.target?.parentElement;
    const itemRow=tgt?.closest?.('[data-inv-item]');
    const invSecBox=tgt?.closest?.('[data-inv-sec]');
    if(itemRow&&itemRow.dataset.invItem!==srcId){
      e.preventDefault();
      e.stopPropagation();
      const i1=S.inventory.findIndex(x=>x.id===srcId), i2=S.inventory.findIndex(x=>x.id===itemRow.dataset.invItem);
      if(i1>-1&&i2>-1){
        const rect=itemRow.getBoundingClientRect();
        const insertAfter=rect.height>0?((e.clientY-rect.top)/rect.height)>=0.5:false;
        const targetSecId=S.inventory[i2].sectionId||'';
        const [moved]=S.inventory.splice(i1,1);
        moved.sectionId=targetSecId;
        const newI2=S.inventory.findIndex(x=>x.id===itemRow.dataset.invItem);
        const pos=newI2>-1?(insertAfter?newI2+1:newI2):S.inventory.length;
        S.inventory.splice(pos,0,moved);
        renderMain(); save();
      }
    }else if(invSecBox){
      e.preventDefault();
      e.stopPropagation();
      const it=S.inventory.find(x=>x.id===srcId);
      if(it){
        const targetSecId=invSecBox.dataset.invSec||'';
        it.sectionId=targetSecId;
        if(targetSecId){const par=(S.invSections||[]).find(s=>s.id===targetSecId);if(par)par.collapsed=false;}
        renderMain(); save();
      }
    }
  }else if(dragEqSec){
    const eqSecBox=e.target.closest('[data-eqsec]');
    if(eqSecBox&&eqSecBox.dataset.eqsec&&eqSecBox.dataset.eqsec!==dragEqSec){
      e.preventDefault();
      if(!Array.isArray(S.equipSecOrder)||S.equipSecOrder.length!==4) S.equipSecOrder=[...DEF_EQ_SEC_ORDER];
      const i1=S.equipSecOrder.indexOf(dragEqSec), i2=S.equipSecOrder.indexOf(eqSecBox.dataset.eqsec);
      if(i1>-1&&i2>-1){const [it]=S.equipSecOrder.splice(i1,1);S.equipSecOrder.splice(i2,0,it);renderMain();save();}
    }
    dragEqSec=null;
  }else if(dragEqItem){
    const eqItemBox=e.target.closest('[data-eqitem]');
    if(eqItemBox&&eqItemBox.dataset.eqitem!==dragEqItem){
      e.preventDefault();
      const [k1,id1]=dragEqItem.split(':'), [k2,id2]=eqItemBox.dataset.eqitem.split(':');
      if(k1===k2){
        const arr={weapon:S.weapons,ammo:S.ammos,armor:S.armors,inv:S.inventory}[k1];
        if(arr){const i1=arr.findIndex(x=>x.id===id1),i2=arr.findIndex(x=>x.id===id2);if(i1>-1&&i2>-1){const [it]=arr.splice(i1,1);arr.splice(i2,0,it);renderMain();save();}}
      }
    }
    dragEqItem=null;
  }else if(dragCampId){
    const campTabBox=CLOUD.isAdmin?e.target.closest('[data-camp-tab]'):null;
    if(campTabBox&&campTabBox.dataset.campTab&&campTabBox.dataset.campTab!==dragCampId){
      e.preventDefault();
      const camps=getCampaigns();
      const i1=camps.findIndex(c=>c.id===dragCampId), i2=camps.findIndex(c=>c.id===campTabBox.dataset.campTab);
      if(i1>-1&&i2>-1){
        const [moved]=camps.splice(i1,1);
        camps.splice(i2,0,moved);
        CLOUD.registry.campaigns=normalizeCampaigns(camps);
        saveRegistryLocal();
        renderMain();
            syncCloudRegistry(true);
        toast(`🗺️ Kampagne „${moved.name||'Kampagne'}“ verschoben!`);
      }
    }
    dragCampId=null;

  }else if(dragToken){
    const ta=/^\{\{[\s\S]*\}\}$/.test(dragToken)?e.target.closest('[data-pwf$=":desc"],[data-pwf$=":effects"],[data-pwf$=":rules"]'):e.target.closest('[id^="eff_"]');
    if(ta){e.preventDefault();const [kind,id,field]=ta.dataset.pwf.split(':');insertTokenAtCursor(kind,id,dragToken,{x:e.clientX,y:e.clientY},field);}
    dragToken='';
  }else if(e.target.closest?.('#imgDropZone')&&e.dataTransfer?.files?.length){
    e.preventDefault();
    applyImgFileForCurrentTarget(e.dataTransfer.files[0],true);
  }
});

let activeTipEl = null, tipAutoHideTimer = null, lastTouchTipTs = 0;
const isCoarsePointer = () => window.matchMedia('(pointer: coarse)').matches;
const isHoverSuppressed = () => isCoarsePointer() || (Date.now() - lastTouchTipTs < 800);
function hideTooltip() {
  clearTimeout(tipAutoHideTimer);
  tipAutoHideTimer = null;
  activeTipEl = null;
  const tt = $('tooltip');
  if (!tt) return;
  tt.classList.add('opacity-0');
  tt.style.top = '-9999px';
  tt.style.left = '-9999px';
}
function positionTooltip(tt, x, y) {
  if (!tt) return;
  const r = tt.getBoundingClientRect();
  const left = Math.max(8, Math.min(window.innerWidth - r.width - 8, x + 14));
  const top = Math.max(8, Math.min(window.innerHeight - r.height - 8, y + 16));
  tt.style.left = left + 'px';
  tt.style.top = top + 'px';
}
function showTooltipForEl(el, clientX, clientY, autoHideMs = 0) {
  const tt = $('tooltip');
  if (!tt || !el || !el.isConnected) { hideTooltip(); return; }
  const txt = el.getAttribute('data-tip');
  if (!txt) { hideTooltip(); return; }
  clearTimeout(tipAutoHideTimer);
  tipAutoHideTimer = null;
  activeTipEl = el;
  tt.textContent = txt;
  tt.classList.remove('opacity-0');
  positionTooltip(tt, clientX, clientY);
  if (autoHideMs > 0) tipAutoHideTimer = setTimeout(hideTooltip, autoHideMs);
}
document.addEventListener('touchstart', () => { lastTouchTipTs = Date.now(); }, { passive: true, capture: true });
document.addEventListener('mouseover', e => {
  if (isHoverSuppressed()) return;
  const el = e.target?.closest?.('[data-tip]');
  if (el) showTooltipForEl(el, e.clientX, e.clientY);
  else hideTooltip();
});
document.addEventListener('mousemove', e => {
  if (isHoverSuppressed()) return;
  if (!activeTipEl) return;
  const hoveredTip = e.target?.closest?.('[data-tip]');
  if (!activeTipEl.isConnected || !hoveredTip) { hideTooltip(); return; }
  if (hoveredTip !== activeTipEl) { showTooltipForEl(hoveredTip, e.clientX, e.clientY); return; }
  positionTooltip($('tooltip'), e.clientX, e.clientY);
}, { passive: true });
document.addEventListener('mouseout', e => {
  if (!activeTipEl) return;
  const rel = e.relatedTarget;
  if (!rel || (!activeTipEl.contains(rel) && !rel.closest?.('[data-tip]'))) {
    hideTooltip();
  }
});
document.addEventListener('mouseleave', hideTooltip);
window.addEventListener('blur', hideTooltip);
window.addEventListener('scroll', hideTooltip, { passive: true, capture: true });
document.addEventListener('click', e => {
  if (e.target?.closest?.('button, [data-action], a, select, input')) hideTooltip();
}, true);
document.addEventListener('pointerdown', e => {
  if (e.pointerType === 'touch' || e.pointerType === 'pen') {
    lastTouchTipTs = Date.now();
    const el = e.target?.closest?.('[data-tip]');
    if (el && !el.closest('button, [data-action], a, input, select, textarea, [contenteditable="true"]')) {
      if (activeTipEl === el) hideTooltip();
      else showTooltipForEl(el, e.clientX, e.clientY, 3500);
    } else {
      hideTooltip();
    }
  }
}, { passive: true });
document.addEventListener('paste',e=>{
  const rtf=e.target.closest?.('[contenteditable="true"]');
  if(!rtf) return;
  e.preventDefault();
  const cd=e.clipboardData||window.clipboardData;
  const plain=String(cd?.getData('text/plain')||'').replace(/\r\n?/g,'\n');
  const htmlData=String(cd?.getData('text/html')||'');
  let clean='';
  if(htmlData){
    const isGDocs=/docs-internal-guid/i.test(htmlData);
    const tmp=document.createElement('div');
    tmp.innerHTML=htmlData;
    tmp.querySelectorAll('script,style,meta,link,head,title').forEach(n=>n.remove());
    const walk=node=>{
      if(node.nodeType===3){
        const rawTxt=String(node.nodeValue||'').replace(/\r\n?/g,'\n');
        if(!/\S/.test(rawTxt)&&node.parentNode&&['DIV','UL','OL','TR','TABLE','TBODY','THEAD'].includes(node.parentNode.tagName?.toUpperCase?.())){
          if(!node.previousSibling||!node.nextSibling||node.previousSibling.nodeType===1||node.nextSibling.nodeType===1) return '';
        }
        return esc(rawTxt);
      }
      if(node.nodeType!==1) return '';
      const tag=node.tagName.toUpperCase();
      if(tag==='BR') return '<br>';
      let inner='';
      node.childNodes.forEach(ch=>{inner+=walk(ch);});
      const fw=String(node.style?.fontWeight||'').trim().toLowerCase(), fwNum=parseInt(fw,10), fs=String(node.style?.fontStyle||'').trim().toLowerCase(), td=String(node.style?.textDecoration||node.style?.textDecorationLine||'').toLowerCase();
      const isNormalFw=fw==='normal'||fw==='lighter'||(fwNum>0&&fwNum<700)||String(node.id||'').startsWith('docs-internal-guid');
      const isBoldTag=(tag==='B'||tag==='STRONG')&&!isNormalFw;
      const isBoldSpan=isGDocs&&tag==='SPAN'&&(fw==='bold'||fwNum>=700);
      if(isBoldTag||isBoldSpan) inner=`<b>${inner}</b>`;
      if((tag==='I'||tag==='EM'||(isGDocs&&tag==='SPAN'&&fs==='italic'))&&fs!=='normal') inner=`<i>${inner}</i>`;
      if(tag==='U'||(isGDocs&&tag==='SPAN'&&td.includes('underline'))) inner=`<u>${inner}</u>`;
      if(tag==='UL') return `<ul>${inner.replace(/^(?:<br\s*\/?>|\s)+|(?:<br\s*\/?>|\s)+$/gi,'')}</ul>`;
      if(tag==='OL') return `<ol>${inner.replace(/^(?:<br\s*\/?>|\s)+|(?:<br\s*\/?>|\s)+$/gi,'')}</ol>`;
      if(tag==='LI') return `<li>${inner.replace(/^(?:<br\s*\/?>|\s)+|(?:<br\s*\/?>|\s)+$/gi,'')}</li>`;
      if(['H1','H2','H3'].includes(tag)){
        const trimmed=inner.replace(/^(?:<br\s*\/?>|\s)+|(?:<br\s*\/?>|\s)+$/gi,'');
        return trimmed?`<${tag.toLowerCase()}>${trimmed}</${tag.toLowerCase()}>`:'';
      }
      if(['P','DIV','H4','H5','H6','TR','BLOCKQUOTE'].includes(tag)){
        const trimmed=inner.replace(/^(?:<br\s*\/?>|\s)+/gi,'').replace(/(?:<br\s*\/?>|\s)+$/gi,'');
        if(!trimmed) return '<br>';
        return trimmed+(trimmed.endsWith('</li>')||trimmed.endsWith('</ul>')||trimmed.endsWith('</ol>')?'':'<br>');
      }
      return inner;
    };
    clean=walk(tmp)
      .replace(/(?:<br\s*\/?>\s*){2,}/gi,'<br>')
      .replace(/^(?:<br\s*\/?>|\s)+/i,'')
      .replace(/(?:<br\s*\/?>|\s)+$/i,'');
  }
  if(!clean){
    clean=esc(plain)
      .replace(/\n/g,'<br>')
      .replace(/^(?:<br\s*\/?>|\s)+/i,'')
      .replace(/(?:<br\s*\/?>|\s)+$/i,'');
  }
  clean=clean.replace(/^(?:<br\s*\/?>|\s)+/i,'').replace(/(?:<br\s*\/?>|\s)+$/i,'');
  if(!rtf.textContent.trim()&&!rtf.querySelector('ul,ol,li')) rtf.innerHTML='';
  if(!clean.includes('<b>')&&document.queryCommandState?.('bold')) document.execCommand('bold',false,null);
  document.execCommand('insertHTML',false,clean);
  rtf.innerHTML=rtf.innerHTML.replace(/^(?:<br\s*\/?>|\s)+/i,'');
  rtf.dispatchEvent(new Event('input',{bubbles:true}));
});

document.addEventListener('keydown',e=>{
  if(e.key==='Enter'&&e.target?.dataset?.diceCustom){
    e.preventDefault();
    rollCustomDice();
    return;
  }
  if(e.key==='Enter'&&e.target?.dataset?.pwf?.endsWith(':name')){e.preventDefault();e.target.blur();return;}
  if(e.key==='Enter'&&e.target?.dataset?.newPwTagInp){
    e.preventDefault();
    const [kind,id]=e.target.dataset.newPwTagInp.split(':');
    addCustomPwTagFromInput(kind,id);
    return;
  }
  const rtf=e.target.closest?.('[contenteditable="true"]');
  if((e.ctrlKey||e.metaKey)&&!e.altKey){
    const k=e.key.toLowerCase();
    if(rtf&&(k==='b'||k==='i'||k==='u')){
      e.preventDefault();
      applyRtfCommand(k==='b'?'bold':k==='i'?'italic':'underline','',rtf);
      return;
    }
  }
  if(rtf&&e.altKey&&!e.ctrlKey&&!e.metaKey&&['1','2','3','0'].includes(e.key)){
    e.preventDefault();
    applyRtfCommand(e.key==='0'?'DIV':`H${e.key}`,'',rtf);
    return;
  }
  if(rtf){
    const sel=window.getSelection();
    if(e.key===' '&&!e.ctrlKey&&!e.metaKey&&!e.altKey&&sel&&sel.rangeCount&&sel.isCollapsed){
      const rng=sel.getRangeAt(0), node=rng.startContainer, off=rng.startOffset;
      if(node.nodeType===3){
        const txtBefore=node.nodeValue.slice(0,off);
        const curLi=node.parentElement?.closest('li');
        const mNl=txtBefore.match(/\n([ \t\u00a0]*)\*$/);
        const mStart=txtBefore.match(/^([ \t\u00a0]*)\*$/);
        let isLineStart=Boolean(mNl);
        if(!isLineStart&&mStart){
          let p=node.previousSibling;
          while(p&&p.nodeType===3&&p.nodeValue==='') p=p.previousSibling;
          if(!p||(p.nodeType===1&&['BR','DIV','P','UL','OL','BLOCKQUOTE'].includes(p.tagName))) isLineStart=true;
        }
        if(isLineStart){
          e.preventDefault();
          if(curLi&&mStart){
            node.nodeValue=node.nodeValue.slice(off);
            indentRtfLi(curLi);
            rtf.dispatchEvent(new Event('input',{bubbles:true}));
            return;
          }
          if(mNl){
            const nlIdx=txtBefore.lastIndexOf('\n');
            const beforeTxt=node.nodeValue.slice(0,nlIdx);
            node.nodeValue=node.nodeValue.slice(off);
            if(beforeTxt) node.before(document.createTextNode(beforeTxt));
          }else{
            node.nodeValue=node.nodeValue.slice(off);
            let p=node.previousSibling;
            while(p&&p.nodeType===3&&p.nodeValue==='') p=p.previousSibling;
            if(p&&p.nodeType===1&&p.tagName==='BR') p.remove();
          }
          const nextNl=node.nodeValue.indexOf('\n');
          if(nextNl!==-1){
            const afterLine=node.nodeValue.slice(nextNl+1);
            node.nodeValue=node.nodeValue.slice(0,nextNl);
            const br=document.createElement('br');
            node.after(br);
            if(afterLine) br.after(document.createTextNode(afterLine));
          }
          const ul=document.createElement('ul'), li=document.createElement('li');
          ul.appendChild(li);
          const blk=node.parentElement!==rtf&&['DIV','P'].includes(node.parentElement?.tagName)?node.parentElement:null;
          if(blk&&blk.parentElement===rtf){
            while(blk.firstChild) li.appendChild(blk.firstChild);
            blk.replaceWith(ul);
          }else{
            node.before(ul);
            let cur=node;
            while(cur){
              const nxt=cur.nextSibling;
              if(cur.nodeType===1&&['BR','DIV','P','UL','OL'].includes(cur.tagName)){
                if(cur.tagName==='BR') cur.remove();
                break;
              }
              li.appendChild(cur);
              cur=nxt;
            }
          }
          if(!li.textContent.trim()&&!li.querySelector('br')) li.appendChild(document.createElement('br'));
          const prevEl=ul.previousElementSibling;
          if(prevEl&&prevEl.tagName==='UL'){prevEl.appendChild(li);ul.remove();}
          placeCaretAtStart(li);
          rtf.dispatchEvent(new Event('input',{bubbles:true}));
          return;
        }
      }
    }
    if(e.key==='Tab'){
      e.preventDefault();
      const curLi=sel?.anchorNode?(sel.anchorNode.nodeType===1?sel.anchorNode.closest('li'):sel.anchorNode.parentElement?.closest('li')):null;
      if(curLi&&rtf.contains(curLi)){
        if(e.shiftKey) outdentRtfLi(curLi,rtf);
        else{indentRtfLi(curLi);rtf.dispatchEvent(new Event('input',{bubbles:true}));}
      }else{
        document.execCommand('insertText',false,'    ');
        rtf.dispatchEvent(new Event('input',{bubbles:true}));
      }
      return;
    }
    if(e.key==='Enter'&&!e.shiftKey&&sel&&sel.rangeCount){
      const rng=sel.getRangeAt(0);
      const curLi=rng.startContainer.nodeType===1?rng.startContainer.closest('li'):rng.startContainer.parentElement?.closest('li');
      if(curLi&&rtf.contains(curLi)){
        e.preventDefault();
        const isEmpty=curLi.textContent.replace(/\u200b/g,'').trim()===''&&!curLi.querySelector('ul,ol');
        if(isEmpty){
          outdentRtfLi(curLi,rtf);
          return;
        }
        const afterRng=document.createRange();
        afterRng.setStart(rng.endContainer,rng.endOffset);
        afterRng.setEnd(curLi,curLi.childNodes.length);
        const frag=afterRng.extractContents();
        if(!curLi.textContent.trim()&&!curLi.querySelector('br')) curLi.appendChild(document.createElement('br'));
        const newLi=document.createElement('li');
        newLi.appendChild(frag);
        if(!newLi.textContent.trim()&&!newLi.querySelector('br')) newLi.appendChild(document.createElement('br'));
        curLi.after(newLi);
        placeCaretAtStart(newLi);
        rtf.dispatchEvent(new Event('input',{bubbles:true}));
        return;
      }
    }
    if(e.key==='Backspace'&&sel&&sel.rangeCount&&sel.isCollapsed){
      const rng=sel.getRangeAt(0);
      const curLi=rng.startContainer.nodeType===1?rng.startContainer.closest('li'):rng.startContainer.parentElement?.closest('li');
      if(curLi&&rtf.contains(curLi)){
        const testRng=document.createRange();
        testRng.setStart(curLi,0);
        testRng.setEnd(rng.startContainer,rng.startOffset);
        if(testRng.toString().length===0){
          e.preventDefault();
          outdentRtfLi(curLi,rtf);
          return;
        }
      }
    }
  }else if(e.key===' '&&!e.ctrlKey&&!e.metaKey&&!e.altKey){
    const inp=e.target.closest?.('input[type="text"],textarea');
    if(inp&&typeof inp.selectionStart==='number'&&inp.selectionStart===inp.selectionEnd){
      const pos=inp.selectionStart, val=inp.value, before=val.slice(0,pos);
      if(/(?:^|\n)[ \t]*\*$/.test(before)){
        e.preventDefault();
        inp.value=val.slice(0,pos-1)+'• '+val.slice(pos);
        inp.selectionStart=inp.selectionEnd=pos+1;
        inp.dispatchEvent(new Event('input',{bubbles:true}));
        return;
      }
    }
  }
  if(e.target?.id==='inpAdminMasterPin'&&e.key!=='Enter'&&UI.adminPinError){
    UI.adminPinError='';
    const errBox=document.querySelector('#formAdminUnlock [role="alert"]');
    if(errBox) errBox.remove();
  }
  if(e.key==='Enter'&&e.target.id==='inpCampaignName'){
    e.preventDefault();
    const btn=document.querySelector('[data-action="camp-new-save"],[data-action="camp-rename-save"]');
    if(btn) btn.click();
    return;
  }
  if(e.key==='Enter'&&e.target.id==='inpCampAddUser'){
    e.preventDefault();
    addCampaignAllowedUser(e.target.value);
    return;
  }
  if(e.key==='Enter'&&(e.target.dataset?.arZoneDraft||e.target.dataset?.arf?.endsWith(':customZones'))){
    e.preventDefault();
    const arId=e.target.dataset.arZoneDraft||e.target.dataset.arf.split(':')[0], ar=S.armors.find(a=>a.id===arId);
    if(ar){
      const parts=String(e.target.value||'').split(/[,;]+/).map(s=>s.trim()).filter(Boolean);
      if(parts.length){
        if(!Array.isArray(ar.extraZones)) ar.extraZones=[];
        if(!Array.isArray(ar.zones)) ar.zones=[];
        const hzNames=S.hitZones.map(z=>String(z.zone||'').trim()).filter(Boolean);
        parts.forEach(p=>{
          const hzMatch=hzNames.find(h=>h.toLowerCase()===p.toLowerCase());
          const canon=hzMatch||ar.extraZones.find(x=>x.toLowerCase()===p.toLowerCase())||p;
          if(!hzMatch&&!ar.extraZones.some(x=>x.toLowerCase()===canon.toLowerCase())) ar.extraZones.push(canon);
          if(!ar.zones.some(z=>z.toLowerCase()===canon.toLowerCase())) ar.zones.push(canon);
        });
        if(!UI.arZoneDrafts) UI.arZoneDrafts={};
        UI.arZoneDrafts[ar.id]='';
        delete ar.customZones;
        renderMain(); save();
        setTimeout(()=>$(`inpArCz_${ar.id}`)?.focus(),0);
      }
    }
    return;
  }
  if(e.target&&e.target.id&&e.target.id.startsWith('skNameInp_')&&(e.key==='Enter'||e.key==='Escape')){
    e.preventDefault();
    UI.editSkNameId=null;
    renderMain();
    updateCalcDOM();
    return;
  }
  if(e.key==='Escape'){if(CTX_MENU.open){closeCtxMenu();}else if(DUEL.reply){closeDuelReplyModal();}else if(UI.openPwMenu){closePwDropdown();}else if(UI.modal){closeActiveModal();}else if(D.open&&!D.docked){D.open=false;renderHeader();renderDice();}else if(CN.open&&!CN.docked){CN.open=false;renderHeader();renderCampNotes();}}
});
document.addEventListener('focusout',e=>{
  const inp=e.target;
  if(inp&&inp.dataset?.pwf?.endsWith(':name')){if(!enforceUniquePwName(inp))return;}
  flushPendingSave();
  if(inp&&inp.dataset?.pwSkcnt){
    const [kind,id]=inp.dataset.pwSkcnt.split(':'),it=findPwItem(kind,id);
    if(it){
      const clean=String(inp.value||'').replace(/\D/g,'').replace(/^0+/,'');
      const finalVal=clean||'1';
      if(inp.value!==finalVal) inp.value=finalVal;
      if(it.bldSkCnt!==finalVal){it.bldSkCnt=finalVal;save();}
      updatePwBuilderChipDOM(kind,id);
    }
    return;
  }
  if(inp&&inp.id&&inp.id.startsWith('skNameInp_')){
    const sid=inp.id.slice(10);
    if(UI.editSkNameId===sid){
      const rel=e.relatedTarget;
      if(rel&&rel.closest?.(`[data-action="toggle-sk-edit"][data-id="${sid}"]`)) return;
      UI.editSkNameId=null;
      renderMain();
      updateCalcDOM();
    }
  }
});
function handleExitFlush(){
  flushPendingSave(false);
  flushThemePrefsSync();
  if(!CLOUD.viewingRemote&&UI.sheetLoaded&&!UI.inLobby&&canWriteCurrentSheetToCloud()){
    if(CLOUD_SYNC.dirty||CLOUD_SYNC.debounceTimer!==null||CLOUD_SYNC.status==='error'){
      flushCloudSyncNow({silent:true,keepalive:true});
    }
  }
}
window.addEventListener('pagehide',handleExitFlush);
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')handleExitFlush();});
window.addEventListener('online',()=>{
  updateCloudSyncStatusDOM();
  if(!CLOUD.viewingRemote&&UI.sheetLoaded&&!UI.inLobby&&canWriteCurrentSheetToCloud()){
    if(CLOUD_SYNC.dirty||CLOUD_SYNC.status==='error'||CLOUD_SYNC.retryTimer!==null||CLOUD_SYNC.debounceTimer!==null){
      CLOUD_SYNC.retryStep=0;
      flushCloudSyncNow({silent:true,force:true});
    }
  }
});
window.addEventListener('offline',()=>{updateCloudSyncStatusDOM();});
function reapplyAllWinFrames(){
  if(D.open&&$('diceMount')) applyWinFrame('dice',$('diceMount'),$('diceBackdrop'),WIN_DEFAULTS.dice.dockClass);
  if(CN.open&&$('notesMount')) applyWinFrame('cnotes',$('notesMount'),$('notesBackdrop'),WIN_DEFAULTS.cnotes.dockClass);
  if(LD.open&&$('liveDiceMount')) applyWinFrame('livedice',$('liveDiceMount'),$('liveDiceBackdrop'),WIN_DEFAULTS.livedice.dockClass);
  if(FBW.open&&$('fbAdminMount')) applyWinFrame('fbadmin',$('fbAdminMount'),$('fbAdminBackdrop'),WIN_DEFAULTS.fbadmin.dockClass);
}
let lastMobileLayout=isMobileLayout(), lastTab1Phone=isTab1PhoneDefault(), lastXlLayout=window.innerWidth>=1280, resizeTimer=null;
function handleViewportChange(){
  if(CTX_MENU.open) closeCtxMenu();
  clearTimeout(resizeTimer);
  resizeTimer=setTimeout(()=>{
    const nowMob=isMobileLayout(), nowTab1Phone=isTab1PhoneDefault(), nowXl=window.innerWidth>=1280;
    const mobChanged=(nowMob!==lastMobileLayout);
    const bpChanged=mobChanged||(nowTab1Phone!==lastTab1Phone)||(nowXl!==lastXlLayout);
    if(bpChanged){
      lastMobileLayout=nowMob; lastTab1Phone=nowTab1Phone; lastXlLayout=nowXl;
      if(D.open) renderDice();
      if(CN.open) renderCampNotes();
      if(LD.open) renderLiveDice();
      if(FBW.open) renderFbAdminWin();
      if(UI.modal==='adminPanel') renderModal();
      if(!UI.inLobby&&(S.activeTab==='attributes'||(mobChanged&&S.activeTab==='skills'))) renderMain();
    }else{
      reapplyAllWinFrames();
    }
    if(UI.openPwMenu) repositionOpenPwMenus();
    syncBodyScrollLock();
    hideTooltip();
  },140);
}
window.addEventListener('resize',handleViewportChange);
window.addEventListener('orientationchange',handleViewportChange);
try{
  const mobMq=window.matchMedia('(max-width: 767px), ((max-height: 540px) and (pointer: coarse))');
  if(mobMq.addEventListener) mobMq.addEventListener('change',handleViewportChange);
  else if(mobMq.addListener) mobMq.addListener(handleViewportChange);
}catch(_){}
window.addEventListener('scroll',e=>{
  if(!CTX_MENU.open||isMobileLayout()) return;
  if(e.target&&e.target!==document&&e.target!==window&&e.target.closest?.('.ctx-menu')) return;
  const panel=$('ctxMenuPanel');
  if(!panel||panel.dataset.ctxMode!=='popover') return;
  const anchor=CTX_MENU.anchorEl;
  if(!anchor||!anchor.isConnected){closeCtxMenu();return;}
  const ar=anchor.getBoundingClientRect();
  if(ar.bottom<0||ar.top>window.innerHeight||ar.right<0||ar.left>window.innerWidth){
    closeCtxMenu();
  }else{
    positionFloatingMenu(panel,anchor,CTX_MENU.opts||{});
  }
},{passive:true,capture:true});
document.addEventListener('touchstart',e=>{
  const btn=e.target?.closest?.('[data-action="rtf-cmd"]');
  const tb=e.target?.closest?.('[data-rtf-toolbar]');
  if(btn||tb){
    saveEffRangeIfActive();
    clearTimeout(RTF_STATE.rtfBlurTimer);
    RTF_STATE.rtfToolbarTouchUntil=Date.now()+600;
    const wrap=(btn||tb).closest('.rtf-wrap');
    if(wrap) wrap.classList.add('rtf-focused');
    if(btn&&e.touches&&e.touches.length===1){
      const t=e.touches[0];
      RTF_STATE.rtfTouchTap={btn,x:t.clientX,y:t.clientY,ts:Date.now()};
      e.preventDefault();
    }
  }else if(e.target?.closest?.('[data-action="ins-token"]')){
    saveEffRangeIfActive();
  }else if(!e.target?.closest?.('.rtf-wrap')){
    RTF_STATE.rtfToolbarTouchUntil=0;
  }
},{passive:false,capture:true});
document.addEventListener('touchend',e=>{
  if(!RTF_STATE.rtfTouchTap) return;
  const tap=RTF_STATE.rtfTouchTap;
  RTF_STATE.rtfTouchTap=null;
  const t=e.changedTouches&&e.changedTouches[0];
  const moved=t?Math.hypot(t.clientX-tap.x,t.clientY-tap.y):0;
  if(moved<18&&tap.btn.isConnected&&Date.now()-tap.ts<1200){
    RTF_STATE.lastRtfTouchCmdAt=Date.now();
    RTF_STATE.rtfToolbarTouchUntil=Date.now()+600;
    applyRtfCommand(tap.btn.dataset.cmd,'',tap.btn);
  }
},{passive:true,capture:true});
document.addEventListener('touchcancel',()=>{RTF_STATE.rtfTouchTap=null;},{passive:true,capture:true});
document.addEventListener('pointerdown',e=>{
  const tb=e.target?.closest?.('[data-rtf-toolbar]');
  if(tb){
    saveEffRangeIfActive();
    clearTimeout(RTF_STATE.rtfBlurTimer);
    RTF_STATE.rtfToolbarTouchUntil=Date.now()+600;
    tb.closest('.rtf-wrap')?.classList.add('rtf-focused');
  }else if(e.target?.closest?.('[data-action="ins-token"]')){
    saveEffRangeIfActive();
  }else if(!e.target?.closest?.('.rtf-wrap')){
    RTF_STATE.rtfToolbarTouchUntil=0;
  }
},{capture:true});
document.addEventListener('focusin',e=>{
  const box=e.target?.closest?.('.rtf-box');
  if(box){
    if(box.getAttribute('contenteditable')==='true'){
      RTF_STATE.lastActiveRtfEl=box;
      syncPwFieldCursorState(box,null);
      saveEffRangeIfActive();
    }
    const wrap=box.closest('.rtf-wrap');
    if(wrap){
      clearTimeout(RTF_STATE.rtfBlurTimer);
      document.querySelectorAll('.rtf-wrap.rtf-focused').forEach(w=>{if(w!==wrap)w.classList.remove('rtf-focused');});
      wrap.classList.add('rtf-focused');
    }
  }else if(e.target?.closest?.('.rtf-wrap [data-rtf-toolbar]')){
    clearTimeout(RTF_STATE.rtfBlurTimer);
  }
});
document.addEventListener('focusout',e=>{
  const wrap=e.target?.closest?.('.rtf-wrap');
  if(!wrap) return;
  const rel=e.relatedTarget;
  if(rel&&wrap.contains(rel)&&rel.closest?.('.rtf-box,[data-rtf-toolbar]')) return;
  clearTimeout(RTF_STATE.rtfBlurTimer);
  const delay=Math.max(240,RTF_STATE.rtfToolbarTouchUntil-Date.now()+60);
  RTF_STATE.rtfBlurTimer=setTimeout(()=>{
    const ae=document.activeElement;
    if(Date.now()<RTF_STATE.rtfToolbarTouchUntil&&(!ae||ae===document.body||wrap.contains(ae))) return;
    if(!ae||!wrap.contains(ae)||!ae.closest?.('.rtf-box,[data-rtf-toolbar]')) wrap.classList.remove('rtf-focused');
  },delay);
});

registerHooks({
  hideTooltip,
  renderMain,
  updateLobbyLiveDiceDOM,
  canWriteCurrentSheetToCloud,
  scheduleCloudSync,
  syncCloudRegistry,
  calcAutoSkCost,
  getBstAuto,
  getAllParsedEffectChips,
  getAllLibraryPacks,
  renderHeader,
  renderDice,
  renderModal,
  syncDiceFromSheet,
  calcThreshold,
  exitLobbyNeutralDice,
  renderAll,
  renderCampNotes,
  renderFbAdminWin,
  renderLiveDice,
  buildTokBarInnerHtml,
  syncLiveCalculations,
  updatePwDynPreviewDOM,
  handleLiveDuelEvent,
  renderDuelBanner,
  renderDuelReplyModal,
  clearOutgoingDuel,
  initCombatFromRoll,
  resetCombatState,
  renderCombatDamageBox,
  handleCombatLiveEvent,
  syncLinkedAmmoDOM
});
hydrateWinPrefs();
load();
initLiveDiceChannel();
refreshUserNotificationsBg(false);
fetchCustomIcons(false);
const params=new URLSearchParams(window.location.search);
const reqCharId=(params.get('char')||'').trim();
const forceSheet=params.get('sheet')==='1';
const forceLobby=params.get('lobby')==='1';
if(reqCharId){
  UI.inLobby=false; UI.sheetLoaded=true; UI.modal=null;
  exitLobbyNeutralDice();
  renderAll(false);
  loadCloudCharacter(reqCharId,false,true);
  fetchLobbyList(true);
}else if(forceSheet&&!forceLobby){
  UI.inLobby=false; UI.sheetLoaded=true; UI.modal=null;
  exitLobbyNeutralDice();
  renderAll(false);
  fetchLobbyList(true);
}else{
  UI.inLobby=true; UI.sheetLoaded=false; UI.modal=null;
  applySessionTheme({allowSheetFallback:false});
  resetDiceToLobbyNeutral();
  renderAll(false);
  fetchLobbyList(true);
}

const WIN_CFG={
  cnotes:{m:'notesMount',b:'notesBackdrop',c:WIN_DEFAULTS.cnotes.dockClass,r:()=>renderCampNotes()},
  livedice:{m:'liveDiceMount',b:'liveDiceBackdrop',c:WIN_DEFAULTS.livedice.dockClass,r:()=>renderLiveDice()},
  dice:{m:'diceMount',b:'diceBackdrop',c:WIN_DEFAULTS.dice.dockClass,r:()=>renderDice()},
  fbadmin:{m:'fbAdminMount',b:'fbAdminBackdrop',c:WIN_DEFAULTS.fbadmin.dockClass,r:()=>renderFbAdminWin()}
};
let winAct=null, lobbyDiceResize=null;
document.addEventListener('pointerdown',e=>{
  const ldBar=e.target.closest('[data-lobby-dice-resize]');
  if(ldBar){
    if(e.target.closest('button')) return;
    const box=ldBar.closest('#lobbyLiveDiceMount')?.querySelector('[data-lobby-dice-body]')||ldBar.parentElement?.querySelector('[data-lobby-dice-body]');
    if(!box) return;
    e.preventDefault();
    const rect=box.getBoundingClientRect();
    const startH=Math.max(180,Math.min(1200,Math.round(rect.height)||toInt(CLOUD.lobbyDiceH,340)));
    const lbl=ldBar.querySelector('[data-lobby-dice-h-lbl]');
    lobbyDiceResize={box,lbl,startClientY:e.clientY,startH,curH:startH};
    try{ldBar.setPointerCapture?.(e.pointerId);}catch(err){}
    return;
  }
  if(isMobileLayout()) return;
  const rEl=e.target.closest('[data-win-resize],[data-win-resize-w]');
  if(rEl){
    try{if(e.pointerId!==undefined)rEl.setPointerCapture(e.pointerId);}catch(err){}
    const k=rEl.dataset.winResize||rEl.dataset.winResizeW, onlyW=Boolean(rEl.dataset.winResizeW), cfg=WIN_CFG[k], mount=$(cfg?.m);
    if(!mount) return;
    e.preventDefault();
    const st=getWinState(k), rect=mount.getBoundingClientRect();
    const isDock=Boolean(st.docked&&window.innerWidth>=1280&&!UI.inLobby&&!st.floating);
    st.z=Math.max(CN.z||50,D.z||50,LD.z||50,FBW.z||50)+1;
    mount.style.zIndex=String(st.z);
    const startX=rect.left, startY=rect.top, startW=rect.width, startH=rect.height;
    winAct={mode:onlyW?'rw':'rwh',k,cfg,mount,st,isDock,dirty:false,startClientX:e.clientX,startClientY:e.clientY,startX,startY,startW,startH};
    return;
  }
  const dEl=e.target.closest('[data-win-drag]');
  if(!dEl||e.target.closest('button,input,select,textarea,a,[contenteditable="true"]')) return;
  const k=dEl.dataset.winDrag, cfg=WIN_CFG[k], mount=$(cfg?.m);
  if(!mount) return;
  e.preventDefault();
  const st=getWinState(k), rect=mount.getBoundingClientRect();
  st.z=Math.max(CN.z||50,D.z||50,LD.z||50,FBW.z||50)+1;
  mount.style.zIndex=String(st.z);
  winAct={mode:'drag',k,cfg,mount,st,dirty:false,detached:Boolean(st.floating),startClientX:e.clientX,startClientY:e.clientY,startX:rect.left,startY:rect.top,startW:rect.width,startH:rect.height,ox:e.clientX-rect.left,oy:e.clientY-rect.top};
});
document.addEventListener('pointermove',e=>{
  if(lobbyDiceResize){
    const dy=e.clientY-lobbyDiceResize.startClientY;
    const nextH=Math.max(180,Math.min(1200,Math.round(lobbyDiceResize.startH+dy)));
    lobbyDiceResize.curH=nextH;
    lobbyDiceResize.box.style.height=nextH+'px';
    if(lobbyDiceResize.lbl) lobbyDiceResize.lbl.textContent=nextH+' px';
    return;
  }
  if(!winAct) return;
  const {mode,k,cfg,mount,st}=winAct;
  const vw=window.innerWidth, vh=window.innerHeight;
  if(mode==='drag'){
    const movedDist=Math.hypot(e.clientX-winAct.startClientX,e.clientY-winAct.startClientY);
    if(!winAct.detached){
      if(movedDist<4) return;
      st.w=Math.round(winAct.startW);
      st.h=Math.round(winAct.startH);
      st.x=Math.max(8,Math.min(vw-120,Math.round(winAct.startX)));
      st.y=Math.max(8,Math.min(vh-60,Math.round(winAct.startY)));
      st.floating=true; st.docked=false;
      winAct.detached=true;
      applyWinFrame(k,mount,$(cfg.b),cfg.c);
    }else if(movedDist<1&&!winAct.dirty){
      return;
    }
    st.x=Math.max(8,Math.min(vw-120,Math.round(e.clientX-winAct.ox)));
    st.y=Math.max(8,Math.min(vh-60,Math.round(e.clientY-winAct.oy)));
    mount.style.left=st.x+'px'; mount.style.top=st.y+'px';
    winAct.dirty=true;
  }else if(mode==='rw'){
    const dx=e.clientX-winAct.startClientX;
    if(Math.abs(dx)<1&&!winAct.dirty) return;
    if(st.floating){
      const rightEdge=winAct.startX+winAct.startW;
      const newW=Math.max(320,Math.min(rightEdge-12,winAct.startW-dx));
      const newX=rightEdge-newW;
      st.w=Math.round(newW);
      st.x=Math.round(newX);
      if(st.y===null) st.y=Math.round(winAct.startY);
      if(!st.h) st.h=Math.round(winAct.startH);
      mount.style.width=st.w+'px';
      mount.style.left=st.x+'px';
    }else if(winAct.isDock){
      const layoutW=Math.min(vw,1600)-84;
      const maxDockW=Math.max(360,Math.min(Math.round(layoutW*0.48),layoutW-560));
      st.w=Math.max(320,Math.min(maxDockW,Math.round(winAct.startW-dx)));
      mount.style.width=st.w+'px';
    }else{
      const maxDw=Math.max(320,vw-32);
      st.w=Math.max(320,Math.min(maxDw,Math.round(winAct.startW-dx*2)));
      mount.style.width=st.w+'px';
    }
    winAct.dirty=true;
  }else{
    const dx=e.clientX-winAct.startClientX, dy=e.clientY-winAct.startClientY;
    if(Math.abs(dx)<1&&Math.abs(dy)<1&&!winAct.dirty) return;
    if(st.floating){
      const maxW=Math.max(320,vw-winAct.startX-12);
      const maxH=Math.max(280,vh-winAct.startY-12);
      st.w=Math.max(320,Math.min(maxW,Math.round(winAct.startW+dx)));
      st.h=Math.max(280,Math.min(maxH,Math.round(winAct.startH+dy)));
      if(st.x===null) st.x=Math.round(winAct.startX);
      if(st.y===null) st.y=Math.round(winAct.startY);
      mount.style.width=st.w+'px';
      mount.style.height=st.h+'px';
      mount.style.maxHeight=st.h+'px';
    }else if(winAct.isDock){
      const layoutW=Math.min(vw,1600)-84;
      const maxDockW=Math.max(360,Math.min(Math.round(layoutW*0.48),layoutW-560));
      const maxDockH=Math.max(280,vh-112);
      st.w=Math.max(320,Math.min(maxDockW,Math.round(winAct.startW+dx)));
      st.h=Math.max(280,Math.min(maxDockH,Math.round(winAct.startH+dy)));
      mount.style.width=st.w+'px';
      mount.style.height=st.h+'px';
      mount.style.maxHeight=maxDockH+'px';
    }else{
      const maxDw=Math.max(320,vw-32);
      const topOff=vh<640?12:80, botOff=vh<640?12:24;
      const maxDh=Math.max(280,vh-topOff-botOff);
      st.w=Math.max(320,Math.min(maxDw,Math.round(winAct.startW+dx*2)));
      st.h=Math.max(280,Math.min(maxDh,Math.round(winAct.startH+dy)));
      mount.style.width=st.w+'px';
      mount.style.bottom='auto';
      mount.style.height=st.h+'px';
      mount.style.maxHeight=maxDh+'px';
    }
    winAct.dirty=true;
  }
});
const finishPointerOps=()=>{
  if(lobbyDiceResize){
    const finalH=Math.max(180,Math.min(1200,Math.round(lobbyDiceResize.curH)));
    lobbyDiceResize=null;
    CLOUD.lobbyDiceH=finalH;
    try{localStorage.setItem('scherbensturm_lobby_dice_h',String(finalH));}catch(err){}
    updateLobbyLiveDiceDOM();
  }
  if(winAct){
    const {k,cfg,dirty}=winAct; winAct=null;
    if(dirty&&!isMobileLayout()) saveWinPref(k);
    if(dirty&&cfg?.r) cfg.r();
  }
};
document.addEventListener('pointerup',finishPointerOps);
document.addEventListener('pointercancel',finishPointerOps);
