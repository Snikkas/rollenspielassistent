import {
  DEF_WEAPON_TAGS, DEF_ARMOR_TAGS, ATTRS, DEF_ATTR_COLS, ATTR_GROUPS, STATUS_DEFS, SYSTEM_ICON_DEFS, DEF_SEC_COLS, SEC_META, DEF_MAIN_ARTS, DEF_ACTION_SUBS, DEF_PW_TAGS, TR_DEFS, SK_CATS, SK_RANKS, SK_CAT_SHORT, PW_TIERS, PW_TIER_BADGE_CLS, DEF_HZ, TABS, QTABS, BIO_FIELDS, COL_PRESETS, CRIT_SEQ, PALETTES, GLOSSARY_CATS, GLOSSARY, WEAPON_SUBTYPES, DEF_EQ_SEC_ORDER, DEF_CHR_SEC_ORDER, WIN_DEFAULTS, DEF_FB_FOLDERS, THEME_BG_SYNC_LIMIT, DYN_FACTOR_PRESETS, DYN_ROUND_OPTS, DYN_TARGET_OPTS, POWER_PACK_SCHEMA, DUAL_COL_TARGETS
} from './constants.js';
import {
  uid, stamp, esc, clone, toInt, toFlt, fmtN, fmtSign, isHex, sortAlpha, stripHtml, cleanInlineStyles, toRtfHtml, simpleHash, cardColorStyle, sortTagDefs, hasTagX, fmtTagLabel, canSetSecParent, sanitizeSecHierarchy
} from './utils.js';
import {
  registerHooks
} from './ui-hooks.js';
import {
  renderSystemIconHtml, syncPwUseCostsLegacy, makeDefaultStatusEffects, defaultState, setS, setD, clearDiceLogs, syncBodyScrollLock, positionFloatingMenu, bindSwipeDownClose, closeCtxMenu, openCtxMenu, closePwDropdown, repositionOpenPwMenus, hydrateWinPrefs, saveWinPref, clearWinPref, applyWinFrame, renderWinCtrlBtns, renderWinResizeHandles, setModalSwipeCleanup, cleanupModalSwipe, setPwMode, normalizeCampaigns, isOversizedBgDataUrl, getUserBgLocalKey, compressBgDataUrlForProfile, getCampaigns, setActiveCampaign, isUserInCampaign, isGlobalGM, isCampaignMainGM, canManageCampaign, canClearLiveDice, getAccessibleCampaigns, getCreatableCampaigns, ensureUserRecord, ensureAllRegistryUsers, findUserKeyByName, findUserKeyById, getUserAvatar, canViewUserProfile, renderUserNamePill, saveRegistryLocal, saveSecretRollsLocal, getActiveLiveCampaignId, getCampaignFilteredDiceFeed, captureScrollState, restoreScrollState, toast, triggerNiceEasterEgg, logChron, mergeLoaded, saveLastActiveTab, save, flushPendingSave, saveSoon, load, flushThemePrefsSync, cancelThemePrefsSync, applySessionTheme, persistCurrentThemeChange, syncPalDraftFromSlot, applyTheme, CUSTOM_ICONS, findMainArt, findActionSub, getPwTermTip, isReservedPwTerm, getPwTierKey, getWeaponSubtype, fmtCustomValSummarySuffix, renderLinkedAmmoCustomDmgHtml, isWeaponMassiv, makeWeapon, makeAmmo, makeArmor, makeInvItem, makeEqSecMeta, makeChrSecMeta, makeSection, makeSkSection, makeInvSection, makePower, makeAugment, S, D, CN, LD, FBW, isMobileLayout, CTX_MENU, getWinState, hasSavedWinPref, savedEffRanges, savedPwRanges, lastPwFieldById, pwQuickKey, UI, LIVE_TAB_ID, PATCHNOTES, FEEDBACK, CLOUD, CLOUD_SYNC, PWLIB, getCharOwner, getCharCampaignId, canManageChar, getEditStyleSlot
} from './state.js';
import {
  getStatusEffValues, getAvailableUseResources, getActivePwUseCosts, formatPwUseCosts, getReservablePwCosts, getReservedTotals, getEffectivePoolCap, getReservedSrcList, getStatGroups, getDynVarGroups, buildDynFormulaSpec, getDynPresetSelectVal, getPwBuilderToken, evalDynamicFormula, renderDynamicRtfHtml, parseStatusTokens, getAllParsedEffectChips, invalidateModsCache, calcActiveMods, getAdvDisForContext, buildAttrTip, buildSecTip, syncCresRenameInTokens, syncSkillRenameInTokens, purgeExtraSecFromPowers, calcAutoSkCost, findDuplicatePwEntry, makeUniquePwName, updatePwNameDupHint, enforceUniquePwName, buildPowerExportPack, downloadPowerPackJson, resolveLibraryAugmentParentName, getSuggestedAugmentsForPower, importPowerPackIntoSheet, getTrCost, performSimpleRest, performFullRest, withPoolSync, linkAugToPower, unlinkAugFromPower, calcPwCost, getGroupMspInfo, calcSkCost, calcProg, getWeaponRollMeta, getTagDesc, cresName, makeExtraSec, getExtraSecName, getResLabel, escReStr, fmtAdvSrcLines, getAttrCol, getSecCol, getTrBonus, getAttrTot, getLpBase, getLpMax, getMlpBase, getMlpMax, getLpRegenAuto, getMlpRegenAuto, hasLpRegenOvr, hasMlpRegenOvr, getLpRegen, getMlpRegen, getIniBase, getIniTot, getApBase, getApMax, getMapBase, getMapMax, getCresBase, getCresMax, getExtraSecBase, getBstAuto, hasBstOvr, getBstBase, getEffBst, getSkAutoBonus, hasSkBonusOvr, getSkBonus, findPwItem, findEqItem, getLinkedAugs, getUnlinkedAugs, getValidPwSecId, getUnlinkedAugsInSec, getRootUnlinkedAugs
} from './calc.js';
import {
  renderLobbyLiveDiceHtml, updateLobbyLiveDiceDOM, initLiveDiceChannel, publishLiveRoll, revealSecretRoll, publishLiveCampNote, clearLiveDiceFeed, syncCloudRegistry, renameUserAccount, addCampaignAllowedUser, removeCampaignAllowedUser, toggleGlobalGMTag, addCampaignMainGM, removeCampaignMainGM, kickCharFromCampaign, duplicateCharacterSheet, getCampaignSharedPages, extractPublicPages, upsertPublicNoteEntry, fetchLobbyList, canWriteCurrentSheetToCloud, resetCloudSyncState, renderCloudSyncBadgeHtml, updateCloudSyncStatusDOM, scheduleCloudSync, pushToCloud, flushCloudSyncNow, flushBeforeCharacterSwitch, loadCloudCharacter, createNewUserCharacter, updateCloudCharacterMeta, deleteCloudCharacter, stripLibraryPackMeta, getAllLibraryPacks, fetchPowerLibrary, publishPackToCloudLibrary, deletePackFromCloudLibrary, parsePatchnoteTsMs, getSortedPatchnoteEntries, getNewestPatchnoteId, isPatchnoteCollapsed, normalizePatchnoteEntry, fetchPatchnotes, savePatchnotesToServer, fetchFeedback, saveFeedbackStore, loadCustomIconsCache, fetchCustomIcons, saveCustomIconsToServer, loadNotifSeen, saveNotifSeen, markNotifRead, markAllNotifsRead, updateNotifBadges, renderNotifBellBtnHtml, renderNotifsModalHtml, refreshUserNotificationsBg, fetchAndSyncBasisPowers, isSecretRollActive
} from './cloud.js';
import {
  resetDiceToLobbyNeutral, exitLobbyNeutralDice, ensureLobbyNeutralDiceOnOpen, applyDiceAutoAdvDis, calcThreshold, openWeaponRoll, syncDiceFromSheet, buildAdvDisInnerHtml, renderDice, renderLiveDice, rollW100, renderBlockFollowUpBox, executeBlockFollowUpRoll, executeDiceRoll, rollCustomDice, getCSkVal, getDSkVal, getEffC, getEffD, isLobbyNeutralDice, calcEgMultiplier, buildThresholdInnerHtml
} from './dice.js';
import {
  applyRtfCommand, autoSizeAllTextareas, ensureCampNotesStructure, syncPublicNotesAfterChange, renderCampNotes, getCaretRangeAtPoint, syncPwFieldCursorState, saveEffRangeIfActive, insertTokenAtCursor, placeCaretAtStart, indentRtfLi, outdentRtfLi, RTF_STATE, renderRtfToolbarHtml, getOrderedCampNoteFolders
} from './notes.js';

let dragPwId=null, dragAugId=null, dragSecId=null, dragSkSecId=null, dragSkId=null, dragChrPw=null, dragChrSec=null, dragEqSec=null, dragEqItem=null, dragInvSecId=null, dragInvItemId=null, dragCampId=null, dragCnPageId=null, dragCnFolderId=null, dragToken='';
let dragMouseY=null, dragScrollRaf=null;
function openUserProfile(targetUser){
  if(ensureAllRegistryUsers()) saveRegistryLocal();
  const raw=String(targetUser||'').trim();
  let key=findUserKeyByName(raw)||findUserKeyById(raw)||raw;
  if(!key||!canViewUserProfile(key)){
    toast('🔒 Du kannst nur dein eigenes Profil öffnen.');
    return false;
  }
  const curUser=String(CLOUD.currentUser||'').trim();
  if((!CLOUD.registry?.users?.[key]||CLOUD.registry.users[key]._deleted)&&curUser&&key.toLowerCase()===curUser.toLowerCase()){
    if(!CLOUD.registry.users||typeof CLOUD.registry.users!=='object') CLOUD.registry.users={};
    key=curUser;
    CLOUD.registry.users[key]=ensureUserRecord(key,{userId:'usr_'+uid(),passHash:'',createdAt:stamp(),avatar:'',nameHistory:[]},null);
    ensureAllRegistryUsers();
    saveRegistryLocal();
  }
  const rec=CLOUD.registry?.users?.[key];
  if(!rec||typeof rec!=='object'||rec._deleted){
    toast(`⚠️ Benutzerprofil „${key}“ nicht gefunden.`);
    return false;
  }
  UI.profileUser=key;
  UI.modal='userProfile';
  renderModal();
  return true;
}
function ensureProfileModalAccess(){
  if(UI.modal==='userProfile'){
    const raw=String(UI.profileUser||'').trim();
    const key=findUserKeyByName(raw)||findUserKeyById(raw);
    if(!key||!canViewUserProfile(key)||!CLOUD.registry?.users?.[key]||CLOUD.registry.users[key]._deleted){
      UI.modal=null;
      UI.profileUser='';
    }
  }
}
function closeActiveModal(){
  if(UI.modal==='imgMenu'&&UI.imgReturnModal){
    const ret=UI.imgReturnModal;
    UI.imgReturnModal='';
    UI.imgZoomOpen=false;
    UI.modal=ret;
    applyTheme();
    renderModal();
    return;
  }
  if(UI.adminReturnModal&&UI.modal!==UI.adminReturnModal&&['adminIcons','userProfile','feedback'].includes(UI.modal)){
    const ret=UI.adminReturnModal;
    UI.adminReturnModal='';
    UI.profileUser='';
    UI.confirmResetAllIcons=false;
    UI.modal=ret;
    applyTheme();
    renderModal(false,true);
    return;
  }
  const refocusPw=UI.modal==='dupPwName'?UI.dupPwWarn:null;
  UI.modal=null;
  UI.profileUser='';
  UI.adminReturnModal='';
  UI.adminPinError='';
  UI.ammoModalWeaponId='';
  UI.imgZoomOpen=false;
  UI.imgReturnModal='';
  UI.dupPwWarn=null;
  applyTheme();
  renderModal();
  if(D.open) renderDice();
  if(refocusPw){
    setTimeout(()=>{
      const targetInp=document.querySelector(`input[data-pwf="${refocusPw.targetKind}:${refocusPw.targetId}:name"]`);
      if(targetInp){targetInp.focus();targetInp.select?.();}
    },30);
  }
}
{
  const _initIconsCache=loadCustomIconsCache();
  if(_initIconsCache){
    CUSTOM_ICONS.icons=_initIconsCache.icons;
    if(_initIconsCache.lastLoadedTs) CUSTOM_ICONS.lastLoadedTs=_initIconsCache.lastLoadedTs;
  }
}
function renderFbMiniChatHtml(item, asAdmin=false){
  if(!item) return '';
  if(!Array.isArray(item.messages)) item.messages=[];
  if(!FEEDBACK.replyDrafts||typeof FEEDBACK.replyDrafts!=='object') FEEDBACK.replyDrafts={};
  const canReply=Boolean((asAdmin&&CLOUD.isAdmin)||(!asAdmin&&CLOUD.currentUser&&String(item.author||'').toLowerCase()===CLOUD.currentUser.toLowerCase()));
  return `<div data-fb-minichat="${esc(item.id)}" class="subcard border bdr-acc/50 bg-black/20 space-y-2 p-2.5 sm:p-3">
    <div class="flex flex-wrap items-center justify-between gap-2 border-b bdr-line pb-1.5">
      <span class="text-xs font-extrabold text-acc">💬 Miniatur-Chat (${item.messages.length} ${item.messages.length===1?'Nachricht':'Nachrichten'})</span>
      <span class="text-[10px] font-semibold t-mut">Wird nach Erledigen/Löschen geschlossen</span>
    </div>
    <div class="max-h-56 overflow-y-auto space-y-1.5 pr-0.5">
      ${item.messages.length?item.messages.map(m=>{
        const isAdm=Boolean(m&&m.isAdmin);
        const bCls=isAdm?'border-amber-400/50 bg-amber-500/15':'bdr-acc bg-acc-soft/30';
        const authorHtml=isAdm?`<span class="font-black text-amber-300">👑 Admin</span>`:renderUserNamePill(m.author,{cls:'font-extrabold text-acc'});
        return `<div class="p-2 rounded-lg border ${bCls} space-y-1">
          <div class="flex flex-wrap items-center justify-between gap-2 text-[11px]">
            ${authorHtml}
            <span class="text-[10px] t-mut tabular">${esc(m.ts)}</span>
          </div>
          <div class="rtf-box text-xs leading-snug">${toRtfHtml(m.html)}</div>
        </div>`;
      }).join(''):`<div class="text-[11px] t-mut italic py-1.5 text-center">Noch keine Antworten im Chat.</div>`}
    </div>
    ${canReply?`<div class="rtf-wrap space-y-1.5 pt-1.5 border-t bdr-line">
      <div class="flex flex-wrap items-center justify-between gap-1.5">
        <span class="text-[11px] font-bold ${asAdmin?'text-amber-300':'text-acc'}">${asAdmin?'👑 Antwort als Admin':'💬 Antwort an den Admin'}</span>
        ${renderRtfToolbarHtml(true)}
      </div>
      <div contenteditable="true" data-fb-reply="${esc(item.id)}" data-ph="${asAdmin?'Antwort als Admin schreiben...':'Antwort an den Admin schreiben...'}" class="inp w-full autogrow rtf-box min-h-[60px] text-xs">${toRtfHtml(FEEDBACK.replyDrafts[item.id]||'')}</div>
      <div class="flex justify-end">
        <button type="button" data-action="fb-send-reply" data-id="${esc(item.id)}" data-asadmin="${asAdmin?'1':'0'}" class="btn btn-pri py-1 px-3 text-xs">📨 Antworten</button>
      </div>
    </div>`:''}
  </div>`;
}
function renderFbAdminPanelHtml(inExtraWin=false){
  if(!CLOUD.isAdmin) return '';
  const folders=Array.isArray(FEEDBACK.folders)&&FEEDBACK.folders.length?FEEDBACK.folders:clone(DEF_FB_FOLDERS);
  const allItems=Array.isArray(FEEDBACK.items)?FEEDBACK.items:[];
  if(FEEDBACK.activeFolderId!=='all'&&!folders.some(f=>f&&f.id===FEEDBACK.activeFolderId)) FEEDBACK.activeFolderId='all';
  const activeFid=FEEDBACK.activeFolderId||'all';
  const sortBy=FEEDBACK.sortBy||'newest';
  const filtered=allItems.filter(it=>it&&(activeFid==='all'||(String(it.folderId||'fb_inbox')===activeFid)));
  const sorted=[...filtered].sort((a,b)=>{
    if(sortBy==='oldest') return toInt(a.tsMs,0)-toInt(b.tsMs,0);
    if(sortBy==='author') return String(a.author||'').localeCompare(String(b.author||''),'de')||(toInt(b.tsMs,0)-toInt(a.tsMs,0));
    if(sortBy==='manual') return (toInt(a.order,0)-toInt(b.order,0))||(toInt(b.tsMs,0)-toInt(a.tsMs,0));
    return toInt(b.tsMs,0)-toInt(a.tsMs,0);
  });
  const hdrHtml=`<div class="subcard p-2.5 sm:p-3 flex flex-wrap items-center justify-between gap-2 bg-black/20">
    <div class="flex flex-wrap items-center gap-2">
      <span class="text-xs font-extrabold text-amber-300">📥 Admin-Posteingang (${filtered.length}/${allItems.length})</span>
      <label class="inline-flex items-center gap-1.5 text-xs font-bold t-mut">
        <span>Sortierung:</span>
        <select data-fb-sort="1" class="inp py-1 px-2 text-xs font-bold">
          <option value="newest" ${sortBy==='newest'?'selected':''}>Neueste zuerst</option>
          <option value="oldest" ${sortBy==='oldest'?'selected':''}>Älteste zuerst</option>
          <option value="author" ${sortBy==='author'?'selected':''}>Benutzer A–Z</option>
          <option value="manual" ${sortBy==='manual'?'selected':''}>Manuell ▲/▼</option>
        </select>
      </label>
    </div>
    <div class="flex flex-wrap items-center gap-1.5">
      ${!inExtraWin?'<button type="button" data-action="open-fbadmin-win" class="btn py-1 px-2.5 text-xs bdr-acc bg-acc-soft text-acc">🪟 Extrafenster</button>':''}
    </div>
  </div>`;
  const foldersHtml=`<div class="subcard p-2.5 space-y-2 bg-black/15">
    <div class="flex flex-wrap items-center justify-between gap-2">
      <div class="flex flex-wrap items-center gap-1.5">
        <button type="button" data-action="fb-select-folder" data-fid="all" class="btn py-1 px-2.5 text-xs font-extrabold ${activeFid==='all'?'btn-pri':''}">📁 Alle (${allItems.length})</button>
        ${folders.map(f=>{
          const cnt=allItems.filter(it=>it&&String(it.folderId||'fb_inbox')===f.id).length;
          const isAct=activeFid===f.id;
          const canDel=!f.isSystem&&f.id!=='fb_inbox';
          const isConfirmDel=canDel&&FEEDBACK.confirmDelFolderId===f.id;
          return `<div class="inline-flex items-center gap-0.5">
            <button type="button" data-action="fb-select-folder" data-fid="${esc(f.id)}" class="btn py-1 px-2.5 text-xs font-extrabold ${isAct?'btn-pri':''}">${esc(f.name)} (${cnt})</button>
            ${canDel?(isConfirmDel
              ?`<button type="button" data-action="fb-confirm-del-folder" data-fid="${esc(f.id)}" class="btn bg-rose-600 text-white border-rose-600 py-1 px-2 text-[10px] font-black">Löschen? (2/2)</button><button type="button" data-action="fb-cancel-del-folder" class="btn py-1 px-1.5 text-[10px]">✕</button>`
              :`<button type="button" data-action="fb-ask-del-folder" data-fid="${esc(f.id)}" data-tip="Ordner löschen (Einträge wandern in den Posteingang)" class="btn btn-err py-1 px-1.5 text-[10px]">✕</button>`
            ):''}
          </div>`;
        }).join('')}
      </div>
      <div class="flex flex-wrap items-center gap-1.5 min-w-0 w-full sm:w-auto">
        <input type="text" data-fb-new-folder="1" value="${esc(FEEDBACK.newFolderName||'')}" placeholder="Neuer Ordner..." class="inp py-1 px-2 text-xs flex-1 min-w-0 sm:flex-none sm:w-44"/>
        <button type="button" data-action="fb-add-folder" ${FEEDBACK.saving?'disabled':''} class="btn btn-ok py-1 px-2.5 text-xs font-extrabold shrink-0">+ Ordner</button>
      </div>
    </div>
  </div>`;
  const listHtml=!sorted.length
    ?`<div class="subcard border-dashed p-6 text-center text-xs t-mut">📭 Keine Feedback-Einträge in dieser Ansicht.</div>`
    :`<div class="space-y-3">${sorted.map((it,idx)=>{
      const titleTxt=String(it.title||'').trim()||'Feedback ohne Betreff';
      const isDelConfirm=FEEDBACK.confirmDelId===it.id;
      const curFid=folders.some(f=>f.id===it.folderId)?it.folderId:'fb_inbox';
      return `<div class="subcard p-3.5 space-y-2.5 border bdr-line">
        <div class="flex flex-wrap items-start justify-between gap-2">
          <div class="min-w-0 flex-1">
            <div class="flex flex-wrap items-center gap-1.5">
              <span class="font-black text-sm text-acc break-words">${esc(titleTxt)}</span>
              ${renderUserNamePill(it.author||'Gast',{cls:'px-2 py-0.5 rounded-md text-[11px] font-extrabold bg-indigo-500/20 text-indigo-300 border border-indigo-400/40'})}
              <span class="text-[11px] t-mut tabular">🕒 ${esc(it.ts||'')}</span>
            </div>
          </div>
          <div class="flex flex-wrap items-center gap-1.5 min-w-0 max-w-full shrink-0">
            <select data-fb-move-folder="${esc(it.id)}" data-tip="In Ordner verschieben" class="inp py-0.5 px-2 text-[11px] font-bold max-w-full min-w-0">
              ${folders.map(f=>`<option value="${esc(f.id)}" ${curFid===f.id?'selected':''}>${esc(f.name)}</option>`).join('')}
            </select>
            <div class="inline-flex items-center gap-0.5">
              <button type="button" data-action="fb-move-item" data-id="${esc(it.id)}" data-dir="-1" ${idx===0?'disabled':''} data-tip="Manuell nach oben schieben" class="btn py-0.5 px-1.5 text-[11px]">▲</button>
              <button type="button" data-action="fb-move-item" data-id="${esc(it.id)}" data-dir="1" ${idx===sorted.length-1?'disabled':''} data-tip="Manuell nach unten schieben" class="btn py-0.5 px-1.5 text-[11px]">▼</button>
            </div>
            <button type="button" data-action="fb-done-item" data-id="${esc(it.id)}" ${FEEDBACK.saving?'disabled':''} data-tip="Als erledigt markieren (wandert ins Benutzer-Backlog, Chat wird geschlossen)" class="btn btn-ok py-1 px-2.5 text-xs font-extrabold">✅ Erledigt</button>
            ${isDelConfirm
              ?`<span class="inline-flex items-center gap-1"><button type="button" data-action="fb-confirm-del-item" data-id="${esc(it.id)}" class="btn bg-rose-600 text-white border-rose-600 py-1 px-2 text-[11px] font-black">Löschen? (2/2)</button><button type="button" data-action="fb-cancel-del-item" class="btn py-1 px-1.5 text-[11px]">✕</button></span>`
              :`<button type="button" data-action="fb-ask-del-item" data-id="${esc(it.id)}" ${FEEDBACK.saving?'disabled':''} data-tip="Eintrag löschen (wird im Benutzer-Backlog als Gelöscht vermerkt)" class="btn btn-err py-1 px-2.5 text-xs font-extrabold">🗑️ Löschen</button>`}
          </div>
        </div>
        <div class="rtf-box text-xs sm:text-sm p-2.5 rounded-lg bg-black/25 border bdr-line leading-relaxed">${toRtfHtml(it.html||'')}</div>
        ${renderFbMiniChatHtml(it, true)}
      </div>`;
    }).join('')}</div>`;
  return `<div class="space-y-3">${hdrHtml}${foldersHtml}${listHtml}</div>`;
}
function renderFbAdminWin(){
  if(!CLOUD.isAdmin) FBW.open=false;
  const mount=$('fbAdminMount'), bd=$('fbAdminBackdrop');
  if(!mount) return;
  const hadContent=mount.childElementCount>0;
  const snap=hadContent?captureScrollState(mount):null;
  applyWinFrame('fbadmin',mount,bd,WIN_DEFAULTS.fbadmin.dockClass);
  if(!FBW.open){mount.innerHTML='';return;}
  const mob=isMobileLayout();
  mount.innerHTML=`<div class="card p-0 relative shadow-2xl ${mob?'rounded-none border-0':'rounded-2xl border-2 bdr-acc'} flex-1 h-full flex flex-col min-h-0 overflow-hidden">
    <div data-win-drag="fbadmin" class="win-drag-hdr shrink-0 z-10 flex items-center justify-between gap-2 px-3 sm:px-4 py-2.5 sm:py-3 border-b bdr-line" style="background:var(--surf2)">
      <div class="flex items-center gap-2 min-w-0 flex-1">
        <span class="text-sm sm:text-base font-black text-acc truncate">💬 Feedback-Ablage (Admin)</span>
      </div>
      <div class="flex items-center gap-1.5 shrink-0">
        ${renderWinCtrlBtns('fbadmin')}
        <button type="button" data-action="fb-refresh" ${FEEDBACK.loading?'disabled':''} aria-label="Aktualisieren" data-tip="Feedback vom Server aktualisieren" class="btn py-1 px-2 text-xs">🔄</button>
        <button type="button" data-action="close-fbadmin" aria-label="Extrafenster schließen" data-tip="Extrafenster schließen" class="btn btn-err ${mob?'w-9 h-9 p-0 text-sm':'py-1 px-2.5 text-xs'} font-black shrink-0">✕</button>
      </div>
    </div>
    <div data-scroll-key="fbAdminBody" class="p-3 sm:p-4 space-y-3 min-w-0 flex-1 min-h-0 overflow-y-auto overscroll-contain${mob?' safe-pb':''}">
      ${renderFbAdminPanelHtml(true)}
    </div>
    ${renderWinResizeHandles('fbadmin')}
  </div>`;
  if(snap) restoreScrollState(mount,snap);
}
function renderFbStatusBadge(b, activeItem=null){
  const hasAdminReply=Boolean(activeItem&&((toInt(activeItem.lastAdminReplyMs,0)>0)||(Array.isArray(activeItem.messages)&&activeItem.messages.some(m=>m&&m.isAdmin))));
  const rawSt=String(b?.status||'open').trim().toLowerCase();
  const effSt=(rawSt==='open'&&hasAdminReply)?'answered':rawSt;
  const closedSuffix=b?.closedAt?` (${esc(b.closedAt)})`:'';
  if(effSt==='deleted') return `<span class="px-2 py-0.5 rounded-full text-[11px] font-extrabold bg-rose-500/20 text-rose-300 border border-rose-500/40">🗑️ Gelöscht${closedSuffix}</span>`;
  if(effSt==='resolved'||effSt==='done') return `<span class="px-2 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">✅ Erledigt${closedSuffix}</span>`;
  if(effSt==='answered') return `<span class="px-2 py-0.5 rounded-full text-[11px] font-extrabold bg-sky-500/20 text-sky-300 border border-sky-400/50">💬 Beantwortet</span>`;
  return `<span class="px-2 py-0.5 rounded-full text-[11px] font-extrabold bg-amber-500/20 text-amber-300 border border-amber-400/50">🟡 Offen</span>`;
}
function renderFbBacklogPanelHtml(){
  if(!CLOUD.isAdmin) return '';
  if(!Array.isArray(FEEDBACK.backlog)) FEEDBACK.backlog=[];
  const allUsers=sortAlpha([...Object.keys(CLOUD.registry?.users||{}), ...(FEEDBACK.backlog||[]).map(b=>b.author)]);
  const countByUser=u=>(FEEDBACK.backlog||[]).filter(b=>b&&String(b.author||'').toLowerCase()===String(u||'').toLowerCase()).length;
  const curSel=String(FEEDBACK.backlogUser||'all');
  const usersWithEntries=allUsers.filter(u=>countByUser(u)>0);
  const filtered=(FEEDBACK.backlog||[])
    .filter(b=>b&&(curSel==='all'||String(b.author||'').toLowerCase()===curSel.toLowerCase()))
    .sort((a,b)=>toInt(b.tsMs,0)-toInt(a.tsMs,0));
  const filterRowHtml=`<div class="subcard p-2.5 sm:p-3 space-y-2 bg-black/20">
    <div class="flex flex-wrap items-center justify-between gap-2">
      <div class="flex flex-wrap items-center gap-2">
        <span class="text-xs font-extrabold text-amber-300">📚 Benutzer-Backlogs (${filtered.length}/${FEEDBACK.backlog.length})</span>
        <select data-fb-backlog-user="1" class="inp py-1 px-2.5 text-xs font-bold">
          <option value="all" ${curSel==='all'?'selected':''}>👥 Alle Benutzer (${FEEDBACK.backlog.length})</option>
          ${allUsers.map(u=>{
            const cnt=countByUser(u);
            const isSel=curSel!=='all'&&curSel.toLowerCase()===u.toLowerCase();
            return `<option value="${esc(u)}" ${isSel?'selected':''}>👤 ${esc(u)} (${cnt})</option>`;
          }).join('')}
        </select>
      </div>
    </div>
    ${usersWithEntries.length?`<div class="flex flex-wrap items-center gap-1.5 pt-1 border-t bdr-line">
      <button type="button" data-action="fb-set-backlog-user" data-user="all" class="pill text-[11px] py-0.5 px-2.5 ${curSel==='all'?'bdr-acc bg-acc-soft text-acc':''}">👥 Alle (${FEEDBACK.backlog.length})</button>
      ${usersWithEntries.map(u=>{
        const cnt=countByUser(u);
        const isSel=curSel!=='all'&&curSel.toLowerCase()===u.toLowerCase();
        return `<button type="button" data-action="fb-set-backlog-user" data-user="${esc(u)}" class="pill text-[11px] py-0.5 px-2.5 ${isSel?'bdr-acc bg-acc-soft text-acc':''}">👤 ${esc(u)} (${cnt})</button>`;
      }).join('')}
    </div>`:''}
  </div>`;
  const cardsHtml=!filtered.length
    ?`<div class="subcard border-dashed p-6 text-center text-xs t-mut">📭 Keine Backlog-Einträge für diese Auswahl vorhanden.</div>`
    :`<div class="space-y-2.5">${filtered.map(b=>{
      const activeItem=(Array.isArray(FEEDBACK.items)?FEEDBACK.items:[]).find(it=>it&&it.id===b.id)||null;
      const stBadge=renderFbStatusBadge(b, activeItem);
      return `<div class="subcard p-3 space-y-2 border bdr-line">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <div class="flex flex-wrap items-center gap-1.5 min-w-0">
            ${renderUserNamePill(b.author,{cls:'px-2 py-0.5 rounded-md text-[11px] font-extrabold bg-indigo-500/20 text-indigo-300 border border-indigo-400/40'})}
            <span class="font-black text-xs sm:text-sm text-acc break-words">${esc(b.title||'Feedback')}</span>
            <span class="text-[11px] t-mut tabular">🕒 ${esc(b.ts)}</span>
          </div>
          <div class="shrink-0">${stBadge}</div>
        </div>
        <div class="rtf-box text-xs p-2 rounded bg-black/20 border bdr-line">${toRtfHtml(b.html)}</div>
      </div>`;
    }).join('')}</div>`;
  return `<div class="space-y-3">${filterRowHtml}${cardsHtml}</div>`;
}
function renderFeedbackModalHtml(){
  if(!CLOUD.isAdmin&&(FEEDBACK.activeTab==='admin'||FEEDBACK.activeTab==='backlog')){
    FEEDBACK.activeTab='write';
  }
  const tab=FEEDBACK.activeTab||'write';
  const curUser=String(CLOUD.currentUser||'').trim();
  const myBacklog=curUser
    ?(Array.isArray(FEEDBACK.backlog)?FEEDBACK.backlog:[])
        .filter(b=>b&&String(b.author||'').trim().toLowerCase()===curUser.toLowerCase())
        .sort((a,b)=>toInt(b.tsMs,0)-toInt(a.tsMs,0))
    :[];
  const activeItemsCnt=Array.isArray(FEEDBACK.items)?FEEDBACK.items.length:0;
  const totalBacklogCnt=Array.isArray(FEEDBACK.backlog)?FEEDBACK.backlog.length:0;

  const tabsHtml=`<div class="flex flex-wrap items-center justify-between gap-2 border-b bdr-line pb-2.5">
    <div class="flex flex-wrap items-center gap-1.5">
      <button type="button" data-action="fb-tab" data-tab="write" class="btn py-1.5 px-3 text-xs font-extrabold ${tab==='write'?'btn-pri':''}">✍️ Feedback schreiben</button>
      <button type="button" data-action="fb-tab" data-tab="mylog" class="btn py-1.5 px-3 text-xs font-extrabold ${tab==='mylog'?'btn-pri':''}">📜 Mein Feedback-Log${curUser?` <span class="px-1.5 py-0.2 rounded-full text-[10px] bg-black/25 tabular">${myBacklog.length}</span>`:''}</button>
      ${CLOUD.isAdmin===true?`
        <button type="button" data-action="fb-tab" data-tab="admin" class="btn py-1.5 px-3 text-xs font-extrabold ${tab==='admin'?'btn-pri':'!border-amber-400/50 text-amber-300'}">📥 Admin-Posteingang <span class="px-1.5 py-0.2 rounded-full text-[10px] bg-black/25 tabular">${activeItemsCnt}</span></button>
        <button type="button" data-action="fb-tab" data-tab="backlog" class="btn py-1.5 px-3 text-xs font-extrabold ${tab==='backlog'?'btn-pri':'!border-amber-400/50 text-amber-300'}">📚 Benutzer-Backlogs <span class="px-1.5 py-0.2 rounded-full text-[10px] bg-black/25 tabular">${totalBacklogCnt}</span></button>
      `:''}
    </div>
    <div class="flex items-center gap-1.5">
      ${FEEDBACK.lastLoadedTs?`<span class="text-[10px] t-mut tabular hidden sm:inline">Stand: ${esc(FEEDBACK.lastLoadedTs)}</span>`:''}
      ${CLOUD.isAdmin===true?`<button type="button" data-action="fb-refresh" ${FEEDBACK.loading?'disabled':''} class="btn py-1 px-2.5 text-xs font-bold">🔄 Aktualisieren</button>`:`<button type="button" data-action="fb-refresh" ${FEEDBACK.loading?'disabled':''} class="btn py-1 px-2 text-[11px]" data-tip="Feedback-Status aktualisieren">🔄</button>`}
    </div>
  </div>`;

  const statusBanner=FEEDBACK.error?`<div class="p-2.5 rounded-xl border border-amber-400/50 bg-amber-500/10 text-amber-200 text-xs font-semibold flex items-center justify-between gap-2"><span>⚠️ ${esc(FEEDBACK.error)}</span></div>`:'';

  let bodyHtml='';
  if(tab==='write'){
    if(!curUser){
      bodyHtml=`<div class="subcard p-6 border-2 border-amber-500/40 bg-amber-500/10 text-center space-y-2">
        <div class="text-2xl">🔒</div>
        <div class="text-sm font-black text-amber-300">🔒 Nur für eingeloggte Benutzer – Bitte melde dich zuerst in der Lobby mit deinem Benutzernamen an, damit dein Feedback mit Benutzername und Zeitstempel übermittelt werden kann.</div>
      </div>`;
    }else{
      bodyHtml=`<div class="space-y-3">
        <div class="subcard p-3 flex flex-wrap items-center justify-between gap-2 bg-acc-soft/20 bdr-acc">
          <div class="flex items-center gap-2 text-xs font-bold">
            ${renderUserNamePill(curUser,{cls:'px-2.5 py-1 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-black'})}
            <span class="t-mut">Dein Feedback wird mit Benutzername und Zeitstempel versehen und ist <strong>ausschließlich für den Admin</strong> sichtbar.</span>
          </div>
        </div>
        <div class="space-y-1.5">
          <label for="fbDraftTitle" class="block text-xs font-extrabold text-acc uppercase tracking-wider">Betreff / Titel (optional)</label>
          <input id="fbDraftTitle" data-fb-draft="title" type="text" value="${esc(FEEDBACK.draftTitle||'')}" placeholder="Kurzer Betreff (z.B. Wunsch für Kräfte-Filter, Bug bei Rüstung...)" class="inp w-full text-sm font-bold py-2 px-3"/>
        </div>
        <div class="space-y-1.5 rtf-wrap">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <label class="text-xs font-extrabold text-acc uppercase tracking-wider">Nachricht / Beschreibung</label>
            ${renderRtfToolbarHtml(true)}
          </div>
          <div contenteditable="true" id="fbDraftBody" data-fb-draft="html" data-ph="Dein Feedback, Wunsch oder Bug-Report..." class="inp w-full autogrow rtf-box min-h-[140px] text-xs sm:text-sm p-3">${toRtfHtml(FEEDBACK.draftHtml||'')}</div>
        </div>
        <div class="flex items-center justify-end gap-2 pt-1">
          <button type="button" data-action="fb-submit" ${FEEDBACK.saving?'disabled':''} class="btn btn-pri py-2 px-4 text-xs sm:text-sm font-black shadow-lg">${FEEDBACK.saving?'⏳ Wird gesendet...':'📨 Feedback absenden'}</button>
        </div>
      </div>`;
    }
  }else if(tab==='mylog'){
    if(!curUser){
      bodyHtml=`<div class="subcard p-6 border-2 border-amber-500/40 bg-amber-500/10 text-center space-y-2">
        <div class="text-2xl">🔒</div>
        <div class="text-sm font-black text-amber-300">🔒 Nur für eingeloggte Benutzer – Bitte melde dich zuerst in der Lobby mit deinem Benutzernamen an, um dein persönliches Feedback-Log einzusehen.</div>
      </div>`;
    }else if(!myBacklog.length){
      bodyHtml=`<div class="subcard border-dashed p-6 text-center text-xs t-mut space-y-2">
        <div class="text-lg">📭</div>
        <div>Du hast bisher noch kein Feedback eingereicht. Wechsle auf <strong>„✍️ Feedback schreiben“</strong>, um dem Admin eine Nachricht zu senden.</div>
      </div>`;
    }else{
      bodyHtml=`<div class="space-y-3">${myBacklog.map(b=>{
        const activeItem=(Array.isArray(FEEDBACK.items)?FEEDBACK.items:[]).find(it=>it&&it.id===b.id)||null;
        const stBadge=renderFbStatusBadge(b, activeItem);
        const titleTxt=String(b.title||'').trim()||'Feedback ohne Betreff';
        return `<div class="subcard p-3.5 space-y-2.5 border bdr-line">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <div class="min-w-0 flex-1">
              <div class="font-black text-sm text-acc break-words">${esc(titleTxt)}</div>
              <div class="text-[11px] t-mut tabular mt-0.5">🕒 ${esc(b.ts||'')} • ${renderUserNamePill(b.author||curUser,{cls:'font-bold'})}</div>
            </div>
            <div class="flex flex-wrap items-center gap-1.5 shrink-0">${stBadge}</div>
          </div>
          <div class="rtf-box text-xs sm:text-sm p-2.5 rounded-lg bg-black/25 border bdr-line leading-relaxed">${toRtfHtml(b.html||'')}</div>
          ${activeItem ? renderFbMiniChatHtml(activeItem, false) : ''}
        </div>`;
      }).join('')}</div>`;
    }
  }else if(tab==='admin'||tab==='backlog'){
    if(!CLOUD.isAdmin){
      bodyHtml=`<div class="subcard p-6 border-2 border-rose-500/40 bg-rose-500/10 text-center text-xs font-black text-rose-300">🔒 Zugriff verweigert – Dieser Bereich ist strikt dem Admin vorbehalten.</div>`;
    }else if(tab==='admin'){
      bodyHtml=renderFbAdminPanelHtml(false);
    }else{
      bodyHtml=`${renderFbBacklogPanelHtml()}`;
    }
  }

  return `<div class="space-y-4">
    ${tabsHtml}
    ${statusBanner}
    ${FEEDBACK.loading&&!FEEDBACK.loaded?`<div class="subcard p-6 text-center text-xs t-mut animate-pulse">⏳ Feedback-Daten werden vom Server geladen...</div>`:bodyHtml}
  </div>`;
}
function buildHdrPillsHtml(P,M=calcActiveMods()){
  const spTip=`Steigerungspunkte (aufgewendet / gesamt)\n• Basis (Stufe ${P.lvl}): ${P.baseSp} SP${P.bonusSp?`\n• Bonus-SP: ${fmtSign(P.bonusSp)} SP`:''}${P.spMod?`\n• SP-Mod (Effekte): ${fmtSign(P.spMod)} SP\n${P.spModSrc}`:''}\nNoch frei verfügbar: ${P.spRem} SP`;
  return `<div class="flex flex-wrap items-center gap-1 sm:gap-1.5">
    <button type="button" data-action="switch-tab" data-tab="chronicle" data-tip="Charakterstufe\nPro Stufe: +5 SP\nJede 10. Stufe: +1 MsP" class="pill py-0.5 px-2 text-[11px]">Stufe <span class="text-acc">${P.lvl}</span></button>
    <button type="button" data-action="switch-tab" data-tab="chronicle" data-tip="Erfahrungspunkte\nJe 100 EP = +1 Stufe (mit Rest-Übertrag)\nPro Stufe: +5 SP • Jede 10. Stufe: +1 MsP" class="pill py-0.5 px-2 text-[11px]">EP: <span>${S.progression.ep}/100</span></button>
    <button type="button" data-action="switch-tab" data-tab="chronicle" data-tip="${esc(spTip)}" class="pill py-0.5 px-2 text-[11px] ${P.spRem<0?'!border-rose-500 !bg-rose-500/15 text-rose-500':''}">SP: <span>${P.spSpent}/${P.totSp}</span></button>
    <button type="button" data-action="switch-tab" data-tab="chronicle" data-tip="Meisterschaftspunkte (aufgewendet / gesamt)\nNoch frei verfügbar: ${P.mspRem} MsP" class="pill py-0.5 px-2 text-[11px] ${P.mspRem<0?'!border-rose-500 !bg-rose-500/15 text-rose-500':''}">MsP: <span>${P.mspSpent}/${P.totMsp}</span></button>
  </div>`;
}

function syncHdrCtxBtnState(){
  const sheetOpen=Boolean(CTX_MENU.open&&CTX_MENU.key==='hdr-sheet-menu');
  const lobbyOpen=Boolean(CTX_MENU.open&&CTX_MENU.key==='hdr-lobby-menu');
  document.querySelectorAll('[data-action="open-sheet-ctx-menu"]').forEach(b=>{
    b.setAttribute('aria-expanded',sheetOpen?'true':'false');
    b.classList.toggle('btn-pri',sheetOpen);
    b.classList.toggle('ring-1',sheetOpen);
    b.classList.toggle('ring-amber-400',sheetOpen);
    b.classList.toggle('bdr-acc',!sheetOpen);
    b.classList.toggle('bg-acc-soft',!sheetOpen);
  });
  document.querySelectorAll('[data-action="open-lobby-ctx-menu"],[data-action="toggle-mobile-lobby-menu"]').forEach(b=>{
    b.setAttribute('aria-expanded',lobbyOpen?'true':'false');
    b.classList.toggle('btn-pri',lobbyOpen);
    b.classList.toggle('ring-1',lobbyOpen);
    b.classList.toggle('ring-amber-400',lobbyOpen);
    b.classList.toggle('bdr-acc',!lobbyOpen);
    b.classList.toggle('bg-acc-soft',!lobbyOpen);
  });
}

function openSheetCtxMenu(anchorEl){
  const M=calcActiveMods(), lpReg=getLpRegen(M), mlpReg=getMlpRegen(M);
  const lpCap=getEffectivePoolCap('lp',M), mlpCap=getEffectivePoolCap('mlp',M), apCap=getEffectivePoolCap('ap',M), mapCap=getEffectivePoolCap('map',M);
  const fmtHdrRes=(k,cap)=>{if(cap.reserved<=0)return '';const s=getReservedSrcList(k);return `\n• Reserviert: −${cap.reserved} ${getResLabel(k)}${s.length?` (${s.join(', ')})`:''} → Frei max: ${cap.effMax}`;};
  const simpleRestTip=`🔥 Pause ausführen\nStellt AP (${apCap.effMax}${apCap.reserved?` von ${apCap.fullMax}`:''}) und mAP (${mapCap.effMax}${mapCap.reserved?` von ${mapCap.fullMax}`:''}) wieder her.${fmtHdrRes('ap',apCap)}${fmtHdrRes('map',mapCap)}\nHinweis: Ausgebrannte Sekundärattribute (meistens wie AP und mAP) werden durch eine Pause NICHT regeneriert.`;
  const fullRestTip=`🌙 Erholsame Rast ausführen\nStellt doppelte Regeneration wieder her:\n• +${lpReg*2} LP (2 × ${lpReg} LP-Reg., bis max. ${lpCap.effMax}${lpCap.reserved?` von ${lpCap.fullMax}`:''})${fmtHdrRes('lp',lpCap)}\n• +${mlpReg*2} mLP (2 × ${mlpReg} mLP-Reg., bis max. ${mlpCap.effMax}${mlpCap.reserved?` von ${mlpCap.fullMax}`:''})${fmtHdrRes('mlp',mlpCap)}\n• Stellt zudem AP (${apCap.effMax}${apCap.reserved?` von ${apCap.fullMax}`:''}), mAP (${mapCap.effMax}${mapCap.reserved?` von ${mapCap.fullMax}`:''}) sowie ausgebrannte Sekundärattribute wieder vollständig her.${fmtHdrRes('ap',apCap)}${fmtHdrRes('map',mapCap)}`;
  const items=[
    {type:'label',label:'Rast & Spiel'},
    {icon:'🔥',label:'Pause',sub:`AP (${apCap.effMax}) & mAP (${mapCap.effMax}) auffüllen`,action:'rest-simple',tip:simpleRestTip},
    {icon:'🌙',label:'Erholsame Rast',sub:`+${lpReg*2} LP, +${mlpReg*2} mLP, AP & mAP`,action:'rest-full',tip:fullRestTip},
    {icon:'📝',label:'Kampagnennotizen',sub:'Geteilte & private Notizen',action:'toggle-cnotes',active:Boolean(CN.open),badge:CN.open?'Offen':'',tip:'Kampagnennotizen öffnen/schließen (frei andockbar wie der Würfelassistent)'},
    {type:'sep'},
    {type:'label',label:'Navigation'},
    {icon:'🏠',label:'Zur Lobby',sub:'Kampagnenzentrale & Charakterauswahl',action:'open-lobby',badge:(CLOUD.syncing||CLOUD_SYNC.inFlight)?'⏳':(CLOUD_SYNC.status==='error'?'⚠️':''),tip:'Zurück zur zentralen Lobby (?lobby=1)'}
  ];
  if(CLOUD.currentUser){
    items.push({icon:'👤',label:'Eigenes Profil',sub:CLOUD.currentUser,action:'open-user-profile',dataset:{user:CLOUD.currentUser},tip:'Eigenes Profil öffnen (Name, Passwort, User-ID, Profilbild)'});
  }
  items.push(
    {type:'sep'},
    {type:'label',label:'Hilfe & System'},
    {icon:'📖',label:'Regeln & News',sub:'Regel-Wiki, Glossar & Patchnotes',action:'open-info',tip:'Regel-Wiki (Würfelsystem, Steigerung, Glossar) & Patchnotes öffnen'},
    {icon:'💬',label:'Feedback',sub:'Nachricht an Admin & eigenes Log',action:'open-feedback',tip:'Feedback an den Admin senden, Antworten lesen & eigenes Feedback-Log ansehen'},
    {icon:'⚙️',label:'Optionen & Design',sub:'Export/Import, Themen & Hintergrund',action:'open-settings',tip:'Optionen & Design (JSON Export/Import, Themen, Hintergrund)'}
  );
  if(!CLOUD.viewingRemote){
    const syncNowSub=(CLOUD.syncing||CLOUD_SYNC.inFlight)
      ?'Synchronisiert gerade…'
      :(CLOUD.lastSyncTs?`Zuletzt gespeichert: ${CLOUD.lastSyncTs}`:'Noch nicht synchronisiert');
    items.push({
      icon:'☁️',
      label:'Jetzt synchronisieren',
      sub:syncNowSub,
      action:'cloud-push-now',
      disabled:Boolean(CLOUD.syncing||CLOUD_SYNC.inFlight),
      badge:(CLOUD_SYNC.status==='error'||CLOUD_SYNC.dirty)?'⚠️':'',
      tip:'Charakterbogen jetzt sofort manuell mit dem Server abgleichen'+(CLOUD.lastSyncTs?`\nZuletzt gespeichert: ${CLOUD.lastSyncTs}`:'')
    });
  }
  openCtxMenu({
    key:'hdr-sheet-menu',
    title:'Charakterbogen-Menü',
    anchorEl,
    align:'right',
    minWidth:250,
    items,
    onClose:syncHdrCtxBtnState
  });
  syncHdrCtxBtnState();
}

function openLobbyCtxMenu(anchorEl){
  const liveDiceCnt=getCampaignFilteredDiceFeed().length;
  const items=[
    {type:'label',label:'Werkzeuge'},
    {icon:'🛠️',label:'Lokalen Bogen öffnen',sub:'Lokal gespeicherten Bogen direkt öffnen / testen',action:'open-local-sheet',tip:'Öffnet den lokal gespeicherten Charakterbogen (oder einen Test-Bogen) direkt ohne Cloud-Zwang'},
    {icon:'📡',label:'Live-Würfel',sub:'Echtzeit-Würfelkanal im Extrafenster',action:'toggle-livedice',active:Boolean(LD.open),badge:String(liveDiceCnt),tip:'Eigenständiges Live-Würfel-Fenster öffnen/schließen'},
    {type:'sep'},
    {type:'label',label:'Hilfe & System'},
    {icon:'📖',label:'Regeln & News',sub:'Regel-Wiki, Glossar & Patchnotes',action:'open-info',tip:'Regel-Wiki (Würfelsystem, Steigerung, Glossar) & Patchnotes öffnen'},
    {icon:'💬',label:'Feedback',sub:'An Admin senden & Antworten lesen',action:'open-feedback',tip:'Feedback an den Admin senden, Antworten lesen & eigenes Feedback-Log ansehen'},
    {icon:'⚙️',label:'Optionen',sub:'Design, Farbschema & Hintergrund',action:'open-settings',tip:'Optionen & Design öffnen'},
    {icon:'👑',label:CLOUD.isAdmin?'Admin':'Admin',sub:CLOUD.isAdmin?'Admin-Fenster & Verwaltung öffnen':'Admin-PIN & Verwaltung öffnen',action:'open-admin-panel',active:Boolean(CLOUD.isAdmin||UI.modal==='adminPanel'),badge:CLOUD.isAdmin?'Aktiv':'',tip:'Eigenständiges Admin-Fenster öffnen'}
  ];
  openCtxMenu({
    key:'hdr-lobby-menu',
    title:'Lobby-Menü',
    anchorEl,
    align:'right',
    minWidth:250,
    items,
    onClose:syncHdrCtxBtnState
  });
  syncHdrCtxBtnState();
}

function renderPhaseToggleHtml(compact = false){
  const isFlut=S.phase==='flut';
  const ebbeTip='Ebbephase aktivieren (Standard)\nIn einer Ebbephase können keine Kraftaktionen eingesetzt werden.';
  const flutTip='Flutphase aktivieren\nKraftaktionen können nur innerhalb einer Flutphase eingesetzt werden (danach folgt automatisch eine Ebbephase).';
  if(compact){
    const actTip=isFlut
      ?'Aktuell: Flutphase (Tippen zum Wechseln auf Ebbephase)\nKraftaktionen können nur innerhalb einer Flutphase eingesetzt werden (danach folgt automatisch eine Ebbephase).'
      :'Aktuell: Ebbephase (Tippen zum Wechseln auf Flutphase)\nIn einer Ebbephase können keine Kraftaktionen eingesetzt werden.';
    const cls=isFlut
      ?'bg-gradient-to-r from-cyan-500 to-sky-500 text-slate-950 border-cyan-300 shadow-sm ring-1 ring-cyan-200/70 font-black'
      :'bg-gradient-to-r from-indigo-600 to-slate-700 text-white border-indigo-400 shadow-sm ring-1 ring-indigo-300/60 font-black';
    return `<button type="button" data-action="toggle-phase" data-tip="${esc(actTip)}" aria-label="Kampfphase umschalten (aktuell ${isFlut?'Flutphase':'Ebbephase'})" class="inline-flex items-center justify-center gap-1 h-8 sm:h-9 px-1.5 sm:px-2 rounded-lg border text-[11px] leading-tight shrink-0 cursor-pointer transition-all active:scale-95 ${cls}">${renderSystemIconHtml(isFlut?'phase_flut':'phase_ebbe','w-3.5 h-3.5')}<span class="hidden min-[360px]:inline">${isFlut?'Flut':'Ebbe'}</span></button>`;
  }
  const ebbeCls=!isFlut
    ?'bg-gradient-to-r from-indigo-600 to-slate-700 text-white border-indigo-400 shadow-sm ring-1 ring-indigo-300/60 font-black'
    :'border-transparent bg-transparent text-indigo-300 opacity-60 hover:opacity-100 hover:bg-indigo-500/10 font-bold';
  const flutCls=isFlut
    ?'bg-gradient-to-r from-cyan-500 to-sky-500 text-slate-950 border-cyan-300 shadow-sm ring-1 ring-cyan-200/70 font-black'
    :'border-transparent bg-transparent text-cyan-300 opacity-60 hover:opacity-100 hover:bg-cyan-500/10 font-bold';
  return `<div role="radiogroup" aria-label="Kampfphase" class="inline-flex items-center p-0.5 rounded-xl border bdr-line bg-black/25 gap-0.5 shadow-inner shrink-0">
    <button type="button" role="radio" aria-checked="${!isFlut?'true':'false'}" data-action="set-phase" data-phase="ebbe" aria-label="Ebbephase aktivieren" data-tip="${esc(ebbeTip)}" class="inline-flex items-center gap-1 px-2 py-1 rounded-lg border text-xs whitespace-nowrap cursor-pointer transition-all active:scale-95 ${ebbeCls}">${renderSystemIconHtml('phase_ebbe','w-3.5 h-3.5')}<span>Ebbe<span class="hidden 2xl:inline">phase</span></span></button>
    <button type="button" role="radio" aria-checked="${isFlut?'true':'false'}" data-action="set-phase" data-phase="flut" aria-label="Flutphase aktivieren" data-tip="${esc(flutTip)}" class="inline-flex items-center gap-1 px-2 py-1 rounded-lg border text-xs whitespace-nowrap cursor-pointer transition-all active:scale-95 ${flutCls}">${renderSystemIconHtml('phase_flut','w-3.5 h-3.5')}<span>Flut<span class="hidden 2xl:inline">phase</span></span></button>
  </div>`;
}
function renderHeader(){
  const liveDiceCnt=getCampaignFilteredDiceFeed().length;
  if(UI.inLobby){
    const lobbyMenuOpen=Boolean(CTX_MENU.open&&CTX_MENU.key==='hdr-lobby-menu');
    $('hdrMount').innerHTML=`<div class="h-1 w-full accent-bar"></div><header class="hdr-glass"><div class="max-w-[1600px] mx-auto px-2.5 sm:px-6 lg:px-8 py-2 sm:py-2.5 flex items-center justify-between gap-2 min-w-0">
      <div class="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
        ${(()=>{const lg=CLOUD.registry?.lobbyLogo||'';const inner=lg?`<img src="${lg}" class="w-full h-full object-cover"/>`:'🏰';return (CLOUD.isAdmin||lg)?`<button type="button" data-action="pick-lobby-logo" aria-label="${CLOUD.isAdmin?'Lobby-Bild verwalten':'Lobby-Bild in Großansicht öffnen'}" data-tip="${CLOUD.isAdmin?'👑 Admin: Lobby-Bild verwalten (hochladen, Großansicht oder entfernen)':'Lobby-Bild in Großansicht öffnen'}" class="w-9 h-9 sm:w-10 sm:h-10 rounded-xl overflow-hidden border-2 bdr-acc bg-acc-soft flex items-center justify-center text-lg sm:text-xl shadow-md shrink-0 cursor-pointer hover:opacity-90 transition-opacity">${inner}</button>`:`<div class="w-9 h-9 sm:w-10 sm:h-10 rounded-xl overflow-hidden border-2 bdr-acc bg-acc-soft flex items-center justify-center text-lg sm:text-xl shadow-md shrink-0">${inner}</div>`;})()}
        <div class="min-w-0">
          <h1 class="text-sm sm:text-lg font-black tracking-tight truncate leading-tight">Scherbensturm<span class="hidden min-[380px]:inline"> – Lobby</span></h1>
          <p class="hidden sm:block text-[11px] t-mut font-semibold truncate">Kampagnenzentrale, Charakterauswahl &amp; Live-Würfelkanal</p>
        </div>
      </div>
      <div class="flex items-center gap-1 sm:gap-1.5 shrink-0">
        ${CLOUD.currentUser?renderUserNamePill(CLOUD.currentUser,{cls:'pill py-1 px-2 text-xs border-emerald-500/50 bg-emerald-500/15 text-emerald-300 max-w-[110px] sm:max-w-[180px]',showAvatar:true,tip:'Eigenes Profil öffnen (Name, Passwort, User-ID, Profilbild)'}):`<span class="pill py-1 px-2 text-xs cursor-default opacity-75 shrink-0" data-tip="Gastmodus – Melde dich in der Lobby mit deinem Account an">🔒<span class="hidden sm:inline"> Gast</span></span>`}
        <button type="button" data-action="toggle-livedice" aria-label="Live-Würfel öffnen oder schließen" data-tip="Live-Würfel-Fenster öffnen/schließen" class="hidden xl:inline-flex btn ${LD.open?'btn-pri':'bdr-acc bg-acc-soft'} h-9 px-2.5 text-xs font-extrabold shrink-0">📡 <span>Live-Würfel</span> <span data-live-dice-cnt="1" class="px-1.5 rounded-full text-[10px] bg-black/25 tabular">${liveDiceCnt}</span></button>
        ${renderNotifBellBtnHtml(true)}
        <button type="button" data-action="toggle-dice" aria-label="Würfelassistent öffnen oder schließen" data-tip="Würfelassistent öffnen/schließen" class="btn ${D.open?'btn-pri ring-1 ring-amber-400':'bdr-acc bg-acc-soft'} h-8 sm:h-9 w-8 sm:w-9 xl:w-auto xl:px-3 p-0 text-sm xl:text-xs font-black shrink-0">🎲<span class="hidden xl:inline"> Würfeln</span></button>
        <button type="button" data-action="open-lobby-ctx-menu" aria-label="Lobby-Menü öffnen" aria-haspopup="menu" aria-expanded="${lobbyMenuOpen?'true':'false'}" data-tip="Weitere Lobby-Aktionen, Werkzeuge &amp; Admin-Login" class="btn relative ${lobbyMenuOpen?'btn-pri ring-1 ring-amber-400':'bdr-acc bg-acc-soft'} w-8 h-8 sm:w-9 sm:h-9 p-0 text-lg font-black leading-none shrink-0">⋮${CLOUD.isAdmin?'<span aria-hidden="true" class="absolute top-1 right-1 w-2 h-2 rounded-full bg-amber-400"></span>':''}</button>
      </div>
    </div></header>`;
    if(lobbyMenuOpen){const nb=document.querySelector('[data-action="open-lobby-ctx-menu"]');if(nb)CTX_MENU.anchorEl=nb;}
    return;
  }
  const P=calcProg(), hasAv=Boolean(S.profile.avatar), pwTot=S.powers.length+S.augments.length, charDispName=String(S.profile.name||'').trim()||'Unbenannter Held';
  const metaSub=[String(S.profile.ancestry||'').trim(),String(S.profile.concept||'').trim()].filter(Boolean).join(' • ');
  const sheetMenuOpen=Boolean(CTX_MENU.open&&CTX_MENU.key==='hdr-sheet-menu');
  const viewBanner=CLOUD.viewingRemote?`<div class="bg-sky-500/20 border-b border-sky-400/50 px-3 sm:px-4 py-2 text-xs"><div class="max-w-[1600px] mx-auto flex flex-wrap items-center justify-between gap-2"><div class="font-extrabold text-sky-300 flex flex-wrap items-center gap-x-2 gap-y-0.5 min-w-0 break-words"><span>👁️ 👄 👁️ ANSICHTSMODUS:</span><span>Du betrachtest gerade <strong>„${esc(S.profile.name||'Unbenannt')}“</strong> (Stufe ${P.lvl}) aus der Lobby.</span></div><div class="flex flex-wrap items-center gap-1.5 w-full sm:w-auto max-w-full"><button type="button" data-action="cloud-reload-view" class="btn py-1 px-2 sm:px-2.5 text-xs border-sky-400/50 text-sky-200 max-w-full">🔄 Aktualisieren</button><button type="button" data-action="cloud-adopt-copy" data-tip="Übernimmt diesen Charakter als neuen eigenen Bogen in deinen lokalen Speicher" class="btn btn-ok py-1 px-2 sm:px-2.5 text-xs max-w-full">📥 Als Kopie übernehmen</button><button type="button" data-action="cloud-exit-view" class="btn btn-pri py-1 px-2.5 sm:px-3 text-xs max-w-full">🔙 Zurück zur Lobby</button></div></div></div>`:'';
  $('hdrMount').innerHTML=`<div class="h-1 w-full accent-bar"></div>${viewBanner}<header class="hdr-glass"><div class="max-w-[1600px] mx-auto px-2.5 sm:px-5 lg:px-8 py-1.5 sm:py-2 flex flex-col gap-1.5 sm:gap-2">
    <div class="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-1.5 xl:gap-3 min-w-0">
      <div class="flex items-center justify-between gap-1.5 sm:gap-2 min-w-0 xl:order-2 xl:shrink-0">
        <button type="button" data-action="toggle-mobile-hdr" aria-expanded="${UI.mobileHdrOpen?'true':'false'}" aria-label="Charakter-Stammdaten und Fortschritt ein- oder ausblenden" data-tip="Stammdaten (Name, Volk, Konzept, Bild) &amp; Stufe/EP/SP/MsP ein-/ausblenden" class="flex xl:hidden items-center gap-1.5 sm:gap-2 min-w-0 flex-1 text-left rounded-xl py-0.5 pr-1.5 -ml-0.5 cursor-pointer hover:bg-white/5 transition-colors ${UI.mobileHdrOpen?'bg-acc-soft/50 ring-1 ring-sky-400/40':''}">
          <span class="w-8 h-8 sm:w-9 sm:h-9 rounded-xl overflow-hidden border bdr-acc bg-acc-soft flex items-center justify-center shrink-0 shadow-sm">${hasAv?`<img src="${S.profile.avatar}" class="w-full h-full object-cover" alt=""/>`:`<span class="text-[10px] font-black text-acc">+</span>`}</span>
          <span class="min-w-0 flex-1 flex flex-col">
            <span class="flex items-center gap-1.5 min-w-0">
              <span id="hdrCompactName" class="font-black text-xs sm:text-sm truncate">${esc(charDispName)}</span>
              <span id="hdrCompactLvl" class="hidden sm:inline-flex px-1.5 py-0.2 rounded-md bg-acc-soft border bdr-acc text-acc text-[10px] font-black tabular shrink-0">St. ${P.lvl}</span>
              <span id="hdrCompactSp" class="hidden md:inline-flex px-1.5 py-0.2 rounded-md border bdr-line bg-black/20 text-[10px] font-extrabold tabular shrink-0 ${P.spRem<0?'!border-rose-500 text-rose-400':'t-mut'}">SP ${P.spSpent}/${P.totSp}</span>
            </span>
            <span id="hdrCompactMeta" class="${metaSub?'hidden sm:block':'hidden'} text-[10px] t-mut truncate leading-tight">${esc(metaSub)}</span>
          </span>
          <span aria-hidden="true" class="text-[10px] font-black t-mut shrink-0">${UI.mobileHdrOpen?'▴':'▾'}</span>
        </button>
        <div class="flex items-center gap-1 sm:gap-1.5 shrink-0">
          <span class="inline-flex xl:hidden">${renderPhaseToggleHtml(true)}</span>
          <span class="hidden xl:inline-flex">${renderPhaseToggleHtml(false)}</span>
          ${!CLOUD.viewingRemote?renderCloudSyncBadgeHtml():''}
          <button type="button" data-action="toggle-dice" aria-label="Würfelassistent öffnen oder schließen" data-tip="Würfelassistent öffnen/schließen" class="btn ${D.open?'btn-pri ring-1 ring-amber-400':'bdr-acc bg-acc-soft'} w-8 h-8 sm:w-9 sm:h-9 p-0 text-sm sm:text-base shrink-0">🎲</button>
          <button type="button" data-action="toggle-livedice" aria-label="Live-Würfel öffnen oder schließen" data-tip="Live-Würfel-Fenster öffnen/schließen" class="btn ${LD.open?'btn-pri':'bdr-acc bg-acc-soft'} h-8 sm:h-9 px-1.5 sm:px-2 text-xs font-extrabold shrink-0">📡<span data-live-dice-cnt="1" class="px-1 rounded-full text-[9px] bg-black/25 tabular">${liveDiceCnt}</span></button>
          ${renderNotifBellBtnHtml(true)}
          <button type="button" data-action="open-sheet-ctx-menu" aria-label="Weitere Aktionen und Menü öffnen" aria-haspopup="menu" aria-expanded="${sheetMenuOpen?'true':'false'}" data-tip="Menü: Rast, Kampagnennotizen, Lobby, Profil, Regeln, Feedback &amp; Optionen" class="btn ${sheetMenuOpen?'btn-pri ring-1 ring-amber-400':'bdr-acc bg-acc-soft'} w-8 h-8 sm:w-9 sm:h-9 p-0 text-lg font-black leading-none shrink-0">⋮</button>
        </div>
      </div>
      <div class="${UI.mobileHdrOpen ? 'flex pt-1.5 border-t bdr-line' : 'hidden'} xl:flex xl:pt-0 xl:border-t-0 xl:order-1 flex-col md:flex-row md:items-center gap-2 xl:gap-2.5 flex-1 min-w-0">
        <div class="flex items-center gap-2 sm:gap-2.5 flex-1 min-w-0">
          <button type="button" data-action="pick-avatar" aria-label="Charakter-Portrait ändern" data-tip="Charakter-Portrait ändern (Upload oder Drag &amp; Drop)\nWird im JSON-Export mitgesichert." class="w-11 h-11 xl:w-10 xl:h-10 rounded-xl overflow-hidden border-2 bdr-acc bg-acc-soft flex items-center justify-center shrink-0 shadow cursor-pointer hover:opacity-90 transition-opacity">${hasAv?`<img src="${S.profile.avatar}" class="w-full h-full object-cover" alt=""/>`:`<span class="text-[10px] font-black text-acc leading-tight text-center">BILD<br/>+</span>`}</button>
          <div class="grid grid-cols-2 sm:grid-cols-12 gap-x-2 gap-y-1 flex-1 min-w-0 items-end">
            <div class="col-span-2 sm:col-span-5 min-w-0"><label class="block text-[9px] font-extrabold tracking-wider text-acc leading-none mb-0.5 truncate">NAME</label><input data-bind="profile.name" type="text" value="${esc(S.profile.name)}" placeholder="Charaktername" class="inp-line w-full text-sm xl:text-base font-black py-0"/></div>
            <div class="col-span-1 sm:col-span-4 min-w-0"><label class="block text-[9px] font-bold tracking-wider t-mut leading-none mb-0.5 truncate">VOLK</label><input data-bind="profile.ancestry" type="text" value="${esc(S.profile.ancestry)}" placeholder="Volk / Abstammung" class="inp-line w-full text-xs font-semibold py-0"/></div>
            <div class="col-span-1 sm:col-span-3 min-w-0"><label class="block text-[9px] font-bold tracking-wider t-mut leading-none mb-0.5 truncate">KONZEPT</label><input data-bind="profile.concept" type="text" value="${esc(S.profile.concept)}" placeholder="Konzept / Rolle" class="inp-line w-full text-xs font-semibold py-0"/></div>
          </div>
        </div>
        <div id="hdrPills" class="flex flex-wrap items-center gap-1 sm:gap-1.5 tabular shrink-0 max-w-full">${buildHdrPillsHtml(P)}</div>
      </div>
    </div>
    <nav aria-label="Charakterbogen-Bereiche" class="pt-1.5 sm:pt-2 border-t bdr-line grid grid-cols-5 gap-1 sm:gap-1.5 md:flex md:items-center md:gap-1.5 lg:gap-2">
      ${TABS.map(t=>{
        const isAct=S.activeTab===t.id;
        const cntHtml=t.id==='skills'
          ?`<span id="hdrSkCnt" class="absolute top-0.5 right-0.5 md:static px-1 md:px-1.5 rounded-full text-[9px] md:text-[10px] leading-[14px] md:leading-normal bg-black/30 md:bg-black/20 tabular">${S.skills.length}</span>`
          :t.id==='powers'
            ?`<span id="hdrPwCnt" class="absolute top-0.5 right-0.5 md:static px-1 md:px-1.5 rounded-full text-[9px] md:text-[10px] leading-[14px] md:leading-normal bg-black/30 md:bg-black/20 tabular">${pwTot}</span>`
            :t.id==='chronicle'
              ?`<span id="hdrLogCnt" class="absolute top-0.5 right-0.5 md:static px-1 md:px-1.5 rounded-full text-[9px] md:text-[10px] leading-[14px] md:leading-normal bg-black/30 md:bg-black/20 tabular">${S.chronicleLog.length}</span>`
              :'';
        return `<button type="button" data-action="switch-tab" data-tab="${t.id}" aria-current="${isAct?'page':'false'}" aria-label="${esc(t.l)}" data-tip="${esc(t.l)}" class="btn relative min-w-0 flex-col md:flex-row gap-0.5 md:gap-1.5 px-1 py-1.5 md:px-2 lg:px-3 md:py-1.5 lg:py-2 md:flex-auto lg:flex-1 ${isAct?'btn-pri':''}"><span class="md:hidden text-sm leading-none" aria-hidden="true">${t.icon}</span><span class="md:hidden text-[10px] sm:text-[11px] font-extrabold leading-tight truncate max-w-full">${esc(t.short)}</span><span class="hidden md:inline lg:hidden text-[11px] font-extrabold truncate">${t.icon} ${esc(t.l.replace(/^\d+\.\s*/,''))}</span><span class="hidden lg:inline text-xs font-extrabold truncate">${esc(t.l)}</span>${cntHtml}</button>`;
      }).join('')}
    </nav>
  </div></header>`;
  if(sheetMenuOpen){const nb=document.querySelector('[data-action="open-sheet-ctx-menu"]');if(nb)CTX_MENU.anchorEl=nb;}
}

const renderTrPairs=(ak,n,src)=>{
  const tr=S.attributes[ak].tr;
  const tipFor=i=>{const tc=getTrCost(ak,i);return `${ak} Training ${i+1}: +${TR_DEFS[i].b} ${n} (${tc.sp} SP${tc.msp?` + ${tc.msp} MsP`:''}${tc.manual?' • Manuell':''})`;};
  return `<div class="grid grid-cols-2 gap-1 w-full">${[0,1,2,3].map(i=>`<button type="button" data-action="toggle-tr" data-attr="${ak}" data-idx="${i}" data-src="${src}" data-tip="${tipFor(i)}" class="tr-sm ${tr[i]?'on':''}">${tr[i]?'✓':i+1}</button>`).join('')}</div><button type="button" data-action="toggle-tr" data-attr="${ak}" data-idx="4" data-src="${src}" data-tip="${tipFor(4)}" class="tr-lg ${tr[4]?'on':''}">5</button>`;
};
const secGearBtn=(t,col)=>`<button type="button" data-action="open-sec-color" data-target="${t}" data-tip="Farbe anpassen" class="btn w-7 h-7 p-0 text-xs shrink-0" style="border-color:color-mix(in srgb,${esc(col)} 55%,var(--bdr))">⚙️</button>`;
const renderColorPairBtns=(action,extraAttrs,item,isSmall=false,textTip='Textfarbe anpassen',bgTip='Fensterfarbe anpassen')=>{
  const sz=isSmall?'w-6 h-6 p-0 text-[10px]':'w-7 h-7 p-0 text-xs', ea=extraAttrs?` ${extraAttrs}`:'';
  const stTxt=item?` ${item.color?`style="border-color:${esc(item.color)}"`:''}`:'';
  const stBg=item?` ${item.bgColor?`style="border-color:${esc(item.bgColor)};background:color-mix(in srgb,${esc(item.bgColor)} 35%,var(--surf2))"`:''}`:'';
  return `<button type="button" data-action="${action}"${ea} data-cmode="text" data-tip="${esc(textTip)}" class="btn ${sz} shrink-0"${stTxt}>🎨</button><button type="button" data-action="${action}"${ea} data-cmode="bg" data-tip="${esc(bgTip)}" class="btn ${sz} shrink-0"${stBg}>🪟</button>`;
};
const modChip=v=>v?`<span class="px-1.5 rounded text-[10px] font-black ${v>0?'bg-emerald-500/20 text-emerald-400':'bg-rose-500/20 text-rose-400'}" data-tip="Aktiver Effekt-Bonus">${fmtSign(v)}</span>`:'';

const isTab1PhoneDefault=()=>window.innerWidth<768||isMobileLayout();
function isTab1SecCollapsed(key){
  const ov=UI.tab1?.[key];
  if(ov!==null&&ov!==undefined) return Boolean(ov);
  if(key==='attrs') return isTab1PhoneDefault();
  if(key==='sec') return false;
  if(key==='status') return S.statusCollapsed?true:isTab1PhoneDefault();
  if(key==='insp'||key==='res'||key==='thresholds'||key==='move'||key==='hz'||key==='quick') return isTab1PhoneDefault();
  return false;
}

function renderStatusEffectCard(def){
  const v=getStatusEffValues(def.k), ac=S.attrColors?.[def.group]||'#38bdf8';
  const isPos=def.isPos, on=v.active;
  const bdrCls=on?(isPos?'border-emerald-500/70 bg-emerald-500/10 ring-1 ring-emerald-400/30':'border-rose-500/70 bg-rose-500/10 ring-1 ring-rose-400/30'):'bdr-line opacity-90 hover:opacity-100';
  const badgeCls=isPos?'bg-emerald-500/20 text-emerald-300 border-emerald-500/40':'bg-rose-500/20 text-rose-300 border-rose-500/40';
  const statSummary=`${fmtSign(v.effStat)} ${def.statLbl}`;
  const advSummary=`+${v.effAdv} ${isPos?(v.effAdv===1?'Vorteil':'Vorteile'):(v.effAdv===1?'Nachteil':'Nachteile')} (${def.attrs.join('/')})`;
  const showIniPrompt=def.hasIniChoice&&UI.statusIniPromptKey===def.k;
  return `<div id="stCard_${def.k}" class="subcard p-2.5 sm:p-3 space-y-2.5 border transition-all min-w-0 ${bdrCls}" style="border-left:4px solid ${esc(ac)}">
    <div class="flex flex-wrap items-center justify-between gap-2 min-w-0">
      <div class="flex flex-wrap items-center gap-2 min-w-0">
        <button type="button" data-action="toggle-status-eff" data-key="${def.k}" data-tip="${esc(def.desc+'\nKlicken zum '+(on?'Deaktivieren':'Aktivieren'))}" class="btn py-1.5 sm:py-1 px-2.5 text-xs font-black shrink-0 min-h-[36px] sm:min-h-0 ${on?(isPos?'btn-ok':'bg-rose-600 text-white border-rose-500'):''}">
          <span>${on?'☑':'☐'}</span>
          ${renderSystemIconHtml('status_' + def.k, 'w-4 h-4')}
          <span>${esc(def.name)}</span>
          ${on&&v.stacks>1?`<span class="px-1.5 py-0.2 rounded bg-black/30 text-[10px] tabular">${v.stacks}×</span>`:''}
        </button>
        <div class="flex items-center gap-1 shrink-0">
          ${def.attrs.map(ak=>`<span class="px-1.5 py-0.5 rounded text-[10px] font-black border" style="color:${esc(ac)};border-color:color-mix(in srgb,${esc(ac)} 45%,transparent);background:color-mix(in srgb,${esc(ac)} 14%,transparent)">${ak}</span>`).join('')}
        </div>
      </div>
      <div class="flex flex-wrap items-center gap-1.5 tabular min-w-0 max-w-full">
        ${def.hasIniChoice?`<div class="inline-flex rounded-lg p-0.5 bg-black/25 border bdr-line text-[11px] shrink-0" data-tip="Initiative-Wahl beim Aktivieren (+10 oder −10 Initiative pro Stapel)">
          <button type="button" data-action="set-status-inidir" data-key="${def.k}" data-dir="1" class="px-2 py-1 sm:py-0.5 rounded font-extrabold transition-colors ${v.iniDir>0?(on?'bg-amber-500 text-slate-950 font-black':'bg-acc-soft text-acc'):'t-mut hover:text-white'}">+10 Ini</button>
          <button type="button" data-action="set-status-inidir" data-key="${def.k}" data-dir="-1" class="px-2 py-1 sm:py-0.5 rounded font-extrabold transition-colors ${v.iniDir<0?(on?'bg-amber-500 text-slate-950 font-black':'bg-acc-soft text-acc'):'t-mut hover:text-white'}">−10 Ini</button>
        </div>`:''}
        <span id="stSumBadge_${def.k}" data-tip="${esc(def.desc)}" class="px-2 py-0.5 rounded-lg border text-[11px] font-extrabold cursor-help max-w-full break-words whitespace-normal leading-snug ${on?badgeCls:'bg-black/20 bdr-line t-mut'}">${esc(statSummary)} • ${esc(advSummary)}</span>
      </div>
    </div>
    ${showIniPrompt?`<div class="p-2 rounded-lg border border-amber-400/70 bg-amber-500/15 flex flex-wrap items-center justify-between gap-2 text-xs min-w-0">
      <span class="font-extrabold text-amber-300 min-w-0 break-words">⚡ Auswahl-Abfrage (${esc(def.name)}): Initiative +10 oder −10 wählen?</span>
      <div class="flex flex-wrap items-center gap-1.5">
        <button type="button" data-action="confirm-status-inidir" data-key="${def.k}" data-dir="1" class="btn py-1 sm:py-0.5 px-2.5 text-xs font-black ${v.iniDir>0?'bg-amber-500 text-slate-950 border-amber-400':'border-amber-400/50 text-amber-200'}">⚡ +${10*v.stacks} Initiative</button>
        <button type="button" data-action="confirm-status-inidir" data-key="${def.k}" data-dir="-1" class="btn py-1 sm:py-0.5 px-2.5 text-xs font-black ${v.iniDir<0?'bg-amber-500 text-slate-950 border-amber-400':'border-amber-400/50 text-amber-200'}">⚡ −${10*v.stacks} Initiative</button>
      </div>
    </div>`:''}
    <div class="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center pt-1.5 border-t border-white/10 text-[11px] tabular min-w-0">
      <div class="sm:col-span-5 flex items-center gap-1 flex-wrap min-w-0">
        <span class="font-bold t-mut mr-0.5" data-tip="Stapel-Stufe: Bei 2× oder 3× verdoppeln bzw. verdreifachen sich LP/mLP/BSt/Ini sowie Vor-/Nachteile (höchste Stapel-Instanz zählt).">Stapel:</span>
        <button type="button" data-action="step-status-stack" data-key="${def.k}" data-d="-1" ${v.stacks<=1?'disabled':''} class="btn w-8 h-8 sm:w-6 sm:h-6 p-0 text-xs">−</button>
        ${[1,2,3].map(n=>`<button type="button" data-action="set-status-stack" data-key="${def.k}" data-val="${n}" class="btn min-h-[32px] sm:min-h-0 py-1 sm:py-0.5 px-2 sm:px-1.5 text-[11px] font-black ${v.stacks===n?(on?'btn-pri':'bdr-acc bg-acc-soft text-acc'):'opacity-75'}">${n}×</button>`).join('')}
        <button type="button" data-action="step-status-stack" data-key="${def.k}" data-d="1" class="btn w-8 h-8 sm:w-6 sm:h-6 p-0 text-xs">+</button>
        <input id="stStackInp_${def.k}" data-st-stacks="${def.k}" type="text" inputmode="numeric" value="${v.stacks}" data-tip="Stapel-Stufe direkt eingeben" class="inp w-14 md:w-10 text-center font-black !py-1 md:!py-0.5 !px-1 text-[11px]"/>
      </div>
      <div class="sm:col-span-7 flex flex-wrap items-center justify-start sm:justify-end gap-2 min-w-0">
        <label class="inline-flex flex-wrap items-center gap-1 min-w-0" data-tip="Manueller Overwrite für ${esc(def.statLbl)} (Standard bei ${v.stacks}× Stapel: ${fmtSign(v.autoStat)})">
          <span class="font-bold t-mut">${esc(def.statKey==='lp'?'LP':def.statKey==='mlp'?'mLP':def.statKey==='bst'?'BSt':'Ini')}:</span>
          <input id="stStatOvr_${def.k}" data-st-ovr="${def.k}:stat" type="text" inputmode="numeric" value="${fmtSign(v.effStat)}" class="inp w-[72px] md:w-14 text-center font-black !py-1 md:!py-0.5 !px-1 text-[11px] ${v.hasStatOvr?'!border-amber-400 text-amber-300':'text-acc'}"/>
          <button type="button" id="stStatRst_${def.k}" data-action="reset-status-ovr" data-key="${def.k}" data-field="stat" data-tip="Manueller Overwrite aktiv – Klicken für Standard (${fmtSign(v.autoStat)})" class="text-[10px] font-black text-amber-400 hover:underline ${v.hasStatOvr?'':'hidden'}">(${fmtSign(v.autoStat)})</button>
        </label>
        <label class="inline-flex flex-wrap items-center gap-1 min-w-0" data-tip="Manueller Overwrite für ${isPos?'Vorteile':'Nachteile'} auf ${def.attrs.join(' & ')} (Standard bei ${v.stacks}× Stapel: +${v.autoAdv})">
          <span class="font-bold ${isPos?'text-emerald-400':'text-rose-400'}">${isPos?'Vort.':'Nacht.'}:</span>
          <input id="stAdvOvr_${def.k}" data-st-ovr="${def.k}:adv" type="text" inputmode="numeric" value="+${v.effAdv}" class="inp w-16 md:w-12 text-center font-black !py-1 md:!py-0.5 !px-1 text-[11px] ${v.hasAdvOvr?'!border-amber-400 text-amber-300':(isPos?'text-emerald-300':'text-rose-300')}"/>
          <button type="button" id="stAdvRst_${def.k}" data-action="reset-status-ovr" data-key="${def.k}" data-field="adv" data-tip="Manueller Overwrite aktiv – Klicken für Standard (+${v.autoAdv})" class="text-[10px] font-black text-amber-400 hover:underline ${v.hasAdvOvr?'':'hidden'}">(+${v.autoAdv})</button>
        </label>
      </div>
    </div>
  </div>`;
}
function renderInspirationSection(){
  const stacks=Math.max(0,toInt(S.inspiration,0)), isAct=Boolean(S.inspirationActive), isCol=isTab1SecCollapsed('insp');
  return `<section id="inspirationSec" class="card t1-card space-y-3 border-2 ${isAct?'border-amber-400 bg-amber-500/10 ring-1 ring-amber-400/30':'bdr-acc'}">
    <div class="flex flex-wrap items-center justify-between gap-2 ${isCol?'':'border-b bdr-line pb-2.5'}">
      <div class="flex flex-wrap items-center gap-2 min-w-0">
        <button type="button" data-action="toggle-t1-sec" data-sec="insp" aria-expanded="${!isCol}" data-tip="${isCol?'Inspiration ausklappen':'Inspiration einklappen'}" class="btn w-8 h-8 sm:w-7 sm:h-7 p-0 text-xs font-black shrink-0">${isCol?'▸':'▾'}</button>
        <button type="button" data-action="toggle-t1-sec" data-sec="insp" class="t1-hdr-title">
          <h3 class="text-sm sm:text-base font-extrabold text-amber-400 cursor-pointer" data-tip="Inspiration: Du kannst direkt vor einem Test entscheiden, 1 Stapel Inspiration zu verbrauchen, um +1 Vorteil auf den Test zu erhalten. Pro Wurf kann nur 1 Stapel Inspiration verbraucht werden.">✨ Inspiration</h3>
        </button>
        <span id="inspBadgeCnt" class="pill cursor-default text-[11px] py-0.5 px-2 tabular ${stacks>0?'border-amber-400/60 bg-amber-500/15 text-amber-300':''}">${stacks} Stapel</span>
        ${isAct?`<span class="px-2 py-0.5 rounded-lg bg-amber-500 text-slate-950 font-black text-[11px] tabular animate-pulse">✨ Aktiv (+1V)</span>`:''}
      </div>
      ${isCol&&stacks>0&&!isAct?`<div class="flex items-center gap-1.5 shrink-0"><button type="button" data-action="use-inspiration" data-tip="1 Inspirations-Stapel für +1 Vorteil einsetzen" class="btn btn-pri py-1 px-2 text-xs font-black">✨ Einsetzen</button></div>`:''}
    </div>
    ${!isCol?`<div class="subcard p-3 flex items-center justify-between gap-2 tabular">
      <span class="text-xs font-extrabold t-mut">Inspirations-Stapel:</span>
      <div class="flex items-center gap-1.5">
        <button type="button" data-action="insp-step" data-d="-1" ${stacks<=0?'disabled':''} class="btn btn-err w-10 h-10 sm:w-8 sm:h-8 text-sm font-black shrink-0">−</button>
        <input id="inp_inspiration" data-insp-inp="1" type="text" inputmode="numeric" value="${stacks}" class="inp w-16 sm:w-14 text-center text-base font-black text-amber-400"/>
        <button type="button" data-action="insp-step" data-d="1" class="btn btn-ok w-10 h-10 sm:w-8 sm:h-8 text-sm font-black shrink-0">+</button>
      </div>
    </div>
    ${isAct?`<div class="p-2.5 rounded-xl border border-amber-400/70 bg-amber-500/20 space-y-2 text-xs">
      <div class="font-extrabold text-amber-300 flex items-center justify-between gap-1">
        <span>✨ Inspiration aktiv (+1 Vorteil)</span>
        <button type="button" data-action="cancel-inspiration" data-tip="Aktivierung abbrechen und 1 Stapel zurücklegen" class="text-[10px] font-bold text-amber-200 hover:underline">↺ Zurücklegen</button>
      </div>
      <div class="text-[11px] text-amber-100/90">Für deinen nächsten Wurf im Würfelassistenten vorgemerkt (setzt sich nach dem Wurf automatisch zurück).</div>
    </div>`:''}
    <button type="button" data-action="use-inspiration" ${stacks<=0||isAct?'disabled':''} data-tip="Verbraucht 1 Inspirations-Stapel und aktiviert automatisch +1 Vorteil für deinen nächsten Test im Würfelassistenten." class="btn w-full py-2 px-3 text-xs font-black ${isAct?'bg-amber-500 text-slate-950 border-amber-400':'btn-pri'}">✨ Inspiration einsetzen (1 Stapel verbrauchen)</button>`:''}
  </section>`;
}
function renderReservationsSection(){
  const M=calcActiveMods(), R=getReservedTotals(), entries=R.entries||[], isCol=isTab1SecCollapsed('res');
  const hasAct=entries.length>0;
  const resOrder=['lp','mlp','ap','map','cres',...(S.extraSecList||[]).map(x=>'ex_'+x.id)];
  const sumKeys=[...new Set([...resOrder,...Object.keys(R.byRes||{})])].filter(k=>(R.byRes?.[k]||0)>0);
  return `<section id="reservationsSec" class="card t1-card space-y-3 border-2 ${hasAct?'border-amber-400/80 bg-amber-500/10':'bdr-acc'}">
    <div class="flex flex-wrap items-center justify-between gap-2 ${isCol?'':'border-b bdr-line pb-2.5'}">
      <div class="flex flex-wrap items-center gap-2 min-w-0">
        <button type="button" data-action="toggle-t1-sec" data-sec="res" aria-expanded="${!isCol}" data-tip="${isCol?'Reservierungen ausklappen':'Reservierungen einklappen'}" class="btn w-8 h-8 sm:w-7 sm:h-7 p-0 text-xs font-black shrink-0">${isCol?'▸':'▾'}</button>
        <button type="button" data-action="toggle-t1-sec" data-sec="res" class="t1-hdr-title">
          <h3 class="text-sm sm:text-base font-extrabold text-amber-400 cursor-pointer" data-tip="Dauerhaft gebundene Ressourcen durch reservierte Kräfte &amp; Augmente. Reservierte Punkte senken das verfügbare Maximum für Pause, Erholsame Rast und Stepper.">🔒 Reservierungen</h3>
        </button>
        <span class="pill cursor-default text-[11px] py-0.5 px-2 tabular ${hasAct?'border-amber-400/60 bg-amber-500/15 text-amber-300':''}">${entries.length} aktiv</span>
        ${isCol&&hasAct?sumKeys.map(k=>{const amt=R.byRes[k]||0,col=getSecCol(k)||'#f59e0b';return `<span class="px-1.5 py-0.5 rounded-md border border-amber-400/50 bg-amber-500/15 text-[11px] font-black tabular" style="color:${esc(col)}">−${amt} ${esc(getResLabel(k))}</span>`;}).join(''):''}
      </div>
    </div>
    ${!isCol?(!hasAct
      ?`<div class="subcard p-3 text-xs t-mut leading-relaxed">Kräfte &amp; Augmente können im Tab „3. Kräfte &amp; Augmente“ über <strong class="text-amber-300">„🔒 Reservieren“</strong> Ressourcen dauerhaft binden.</div>`
      :`<div class="flex flex-wrap items-center gap-1.5 tabular">
          ${sumKeys.map(k=>{
            const amt=R.byRes[k]||0, cap=getEffectivePoolCap(k,M), col=getSecCol(k)||'#f59e0b';
            return `<span data-tip="${esc(`${getResLabel(k)}: −${amt} reserviert → Frei max. ${cap.effMax} von ${cap.fullMax}`)}" class="px-2 py-0.5 rounded-lg border border-amber-400/50 bg-amber-500/15 text-xs font-black cursor-help inline-flex items-center gap-1" style="color:${esc(col)}"><span>−${amt} ${esc(getResLabel(k))}</span><span class="text-[10px] t-mut font-bold">(${cap.effMax}/${cap.fullMax})</span></span>`;
          }).join('')}
        </div>
        <div class="space-y-2">
          ${entries.map(e=>{
            const kindLbl=e.kind==='augment'?'Augment':'Kraft';
            const costTxt=e.costs.map(c=>`−${c.amt} ${getResLabel(c.res)}`).join(' • ');
            return `<div class="subcard p-2.5 flex items-center justify-between gap-2 border border-amber-500/35 min-w-0">
              <div class="min-w-0 flex-1">
                <div class="flex flex-wrap items-center gap-1.5 min-w-0">
                  <span class="font-extrabold text-xs truncate" ${e.color?`style="color:${esc(e.color)}"`:''}>${esc(e.name)}</span>
                  <span class="px-1.5 py-0.2 rounded text-[10px] font-bold border ${e.kind==='augment'?'border-amber-500/40 bg-amber-500/15 text-amber-300':'bdr-acc bg-acc-soft text-acc'} shrink-0">${kindLbl}</span>
                </div>
                <div class="text-[11px] font-bold text-amber-300 tabular mt-0.5">${esc(costTxt)}</div>
              </div>
              <button type="button" data-action="toggle-reserve-pw" data-kind="${esc(e.kind)}" data-id="${esc(e.id)}" data-tip="Reservierung aufheben" class="btn py-1 px-2 text-[11px] border-amber-400/60 bg-amber-500/15 text-amber-200 hover:border-amber-300 shrink-0 font-extrabold">🔓 Aufheben</button>
            </div>`;
          }).join('')}
        </div>
        <p class="text-[11px] t-mut italic leading-snug pt-0.5">Aufheben gibt das Maximum wieder frei, stellt verbrauchte Punkte nicht wieder her.</p>`):''}
  </section>`;
}
function renderStatusEffectsSection(){
  const posList=STATUS_DEFS.filter(d=>d.isPos), negList=STATUS_DEFS.filter(d=>!d.isPos);
  const actList=STATUS_DEFS.map(d=>getStatusEffValues(d.k)).filter(v=>v.active);
  const isCol=isTab1SecCollapsed('status');
  const inspStacks=Math.max(0,toInt(S.inspiration,0)), inspAct=Boolean(S.inspirationActive);
  const inspMiniChip=inspAct
    ?`<span class="tag !border-amber-400 !bg-amber-500/25 !text-amber-200 animate-pulse tabular">✨ Insp. aktiv (+1V)${inspStacks>0?` • ${inspStacks}×`:''}</span>`
    :(inspStacks>0?`<span id="t1StatusInspChip" class="tag !border-amber-400/50 !bg-amber-500/15 !text-amber-300 tabular">✨ Insp. ${inspStacks}×</span>`:'');
  return `<section id="statusEffectsSec" class="card t1-card space-y-3">
    <div class="flex flex-wrap items-center justify-between gap-2 ${isCol?'':'border-b bdr-line pb-2.5'}">
      <div class="flex flex-wrap items-center gap-1.5 sm:gap-2 min-w-0">
        <button type="button" data-action="toggle-status-sec" aria-expanded="${!isCol}" data-tip="${isCol?'Statuseffekte ausklappen':'Statuseffekte einklappen'}" class="btn w-8 h-8 sm:w-7 sm:h-7 p-0 text-xs font-black shrink-0">${isCol?'▸':'▾'}</button>
        <button type="button" data-action="toggle-status-sec" class="t1-hdr-title">
          <h3 class="text-sm sm:text-base font-extrabold cursor-pointer" data-tip="Positive & negative Standard-Statuseffekte.\n• Stapel-Stufe (1×, 2×, 3×...) skaliert LP/mLP/BSt/Ini und Vor-/Nachteile automatisch.\n• Werte sind jederzeit manuell überschreibbar.\n• Verrechnet live mit aktuellen/maximalen LP & mLP, Initiative, BSt, Tooltips und Würfelassistent.">⚡ Statuseffekte</h3>
        </button>
        <span class="pill cursor-default text-[11px] py-0.5 px-2 tabular ${actList.length?'bdr-acc bg-acc-soft text-acc':''}">${actList.length} aktiv</span>
        ${actList.map(v=>`<button type="button" data-action="toggle-status-eff" data-key="${v.def.k}" data-tip="${esc(v.def.name+' ('+v.stacks+'×): '+fmtSign(v.effStat)+' '+v.def.statLbl+', +'+v.effAdv+' '+(v.def.isPos?'Vort.':'Nacht.')+' auf '+v.def.attrs.join('/')+'\nKlicken zum Deaktivieren')}" class="tag inline-flex items-center gap-1 ${v.def.isPos?'!border-emerald-500/50 !bg-emerald-500/15 !text-emerald-300':'!border-rose-500/50 !bg-rose-500/15 !text-rose-300'} tabular cursor-pointer">${renderSystemIconHtml('status_' + v.def.k, 'w-3.5 h-3.5')}<span>${esc(v.def.name)}${v.stacks>1?` ${v.stacks}×`:''}${isCol?'':`: ${fmtSign(v.effStat)} ${v.def.statKey==='lp'?'LP':v.def.statKey==='mlp'?'mLP':v.def.statKey==='bst'?'BSt':'Ini'} | +${v.effAdv}${v.def.isPos?'V':'N'} (${v.def.attrs.join('/')})`} ✕</span></button>`).join('')}
        ${inspMiniChip}
      </div>
      ${actList.length?`<div class="flex items-center gap-1.5 shrink-0"><button type="button" data-action="reset-all-status" data-tip="Alle aktiven Statuseffekte deaktivieren" class="btn btn-err py-1 px-2 sm:px-2.5 text-xs">↺ <span class="hidden sm:inline">Alle deaktivieren</span></button></div>`:''}
    </div>
    ${!isCol?`<div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div class="space-y-2.5">
        <div class="flex items-center justify-between px-1">
          <span class="text-xs font-extrabold text-emerald-400 uppercase tracking-wider">✨ Positive Statuseffekte</span>
          <span class="text-[11px] t-mut">Vorteile &amp; Bonus-Werte</span>
        </div>
        ${posList.map(d=>renderStatusEffectCard(d)).join('')}
      </div>
      <div class="space-y-2.5">
        <div class="flex items-center justify-between px-1">
          <span class="text-xs font-extrabold text-rose-400 uppercase tracking-wider">💀 Negative Statuseffekte</span>
          <span class="text-[11px] t-mut">Nachteile &amp; Abzüge</span>
        </div>
        ${negList.map(d=>renderStatusEffectCard(d)).join('')}
      </div>
    </div>`:''}
  </section>`;
}

function tplAttributes(){
  const M=calcActiveMods(),iniBase=getIniBase(),ini=getIniTot(M),iniDiff=ini-iniBase,bst=getEffBst(M),crCol=getSecCol('cres'),iniCol=getSecCol('ini'),cresBase=getCresBase(),cresMax=getCresMax(M),lpRegAuto=getLpRegenAuto(M),lpReg=getLpRegen(M),lpRegOvr=hasLpRegenOvr(),lpRegTip=esc(buildSecTip('lpRegen',M)),mlpRegAuto=getMlpRegenAuto(M),mlpReg=getMlpRegen(M),mlpRegOvr=hasMlpRegenOvr(),mlpRegTip=esc(buildSecTip('mlpRegen',M));
  const lpMax=getLpMax(M), mlpMax=getMlpMax(M), apMax=getApMax(M), mapMax=getMapMax(M);
  const isMob=isMobileLayout();
  const attrsCol=isTab1SecCollapsed('attrs'), secCol=isTab1SecCollapsed('sec'), thCol=isTab1SecCollapsed('thresholds'), mvCol=isTab1SecCollapsed('move'), hzCol=isTab1SecCollapsed('hz'), qkCol=isTab1SecCollapsed('quick');
  const mkRow=(lbl,f,tip)=>`<tr><td class="text-left text-xs font-extrabold t-mut cursor-help" data-tip="${tip}">${lbl}</td>${ATTRS.map(a=>`<td class="ac-cell" style="--ac:${getAttrCol(a.k)}"><input data-at="${a.k}:${f}" type="text" inputmode="numeric" value="${esc(S.attributes[a.k][f])}" class="inp w-full text-center font-bold py-1 px-1"/></td>`).join('')}<td class="text-right text-xs font-extrabold t-mut">${lbl}</td></tr>`;
  const resBadge=(resKey)=>{const cap=getEffectivePoolCap(resKey,M);if(cap.reserved<=0)return '';const srcs=getReservedSrcList(resKey);const bTip=`Reserviert: −${cap.reserved} ${getResLabel(resKey)} (Frei max. ${cap.effMax} von ${cap.fullMax})${srcs.length?`\n• ${srcs.join('\n• ')}`:''}`;return `<span data-tip="${esc(bTip)}" class="px-1.5 py-0.5 rounded text-[10px] font-black border border-amber-400/60 bg-amber-500/20 text-amber-300 cursor-help tabular shrink-0 whitespace-nowrap">🔒 ${cap.reserved} res. (frei max. ${cap.effMax})</span>`;};
  const pool=(key,lbl,form,curF,modF,maxId,baseVal,maxVal)=>{const col=getSecCol(key),diff=maxVal-baseVal,tip=esc(buildSecTip(key,M));return `<div class="md:col-span-4 subcard sc-card flex flex-col justify-between gap-2.5 p-3 min-w-0" style="--sc:${esc(col)}"><div class="flex items-center justify-between gap-2 min-w-0"><div id="tip_${maxId}_hdr" data-tip="${tip}" class="min-w-0 cursor-help"><div class="text-xs font-extrabold flex flex-wrap items-center gap-1.5" style="color:${esc(col)}"><span class="truncate">${lbl}</span><span id="chip_${key}Max">${modChip(diff)}</span>${resBadge(key)}</div><div class="text-[11px] t-mut">${form}</div></div><div class="flex items-center gap-1.5 shrink-0"><label class="text-xs t-mut flex items-center gap-1">Mod <input id="inp_${modF}" data-sec="${modF}" type="text" inputmode="numeric" value="${esc(S.secondary[modF])}" class="inp w-14 sm:w-12 text-center font-bold py-1 px-1"/></label>${secGearBtn(key,col)}</div></div><div class="flex items-center justify-between gap-1.5 min-w-0"><button type="button" data-action="sec-step" data-field="${curF}" data-delta="-1" class="btn btn-err w-10 h-10 sm:w-8 sm:h-8 shrink-0 text-sm">−</button><div class="flex items-center justify-center flex-wrap gap-1.5 min-w-0 flex-1"><input id="inp_${curF}" data-sec="${curF}" type="text" inputmode="numeric" value="${esc(S.secondary[curF])}" class="inp w-[62px] sm:w-14 text-center text-base font-black"/><span class="t-mut font-bold">/</span><input id="${maxId}" data-sec-max="${key}" data-tip="${tip}" type="text" inputmode="numeric" value="${maxVal}" style="color:${esc(col)}" class="inp w-[62px] sm:w-14 text-center text-base font-black cursor-help"/><span id="val_${key}MaxEff" data-tip="${tip}" class="text-xs font-black cursor-help ${diff?'':'hidden'}" style="color:${esc(col)}">(${baseVal})</span></div><button type="button" data-action="sec-step" data-field="${curF}" data-delta="1" class="btn btn-ok w-10 h-10 sm:w-8 sm:h-8 shrink-0 text-sm">+</button></div></div>`;};
  const stam=(key,lbl,curF,maxF,effVal)=>{const col=getSecCol(key),base=toInt(S.secondary[maxF],3),mx=base+effVal,tip=esc(buildSecTip(key,M));return `<div class="md:col-span-4 subcard sc-card flex flex-col justify-between gap-2.5 p-3 min-w-0" style="--sc:${esc(col)}"><div class="flex items-center justify-between gap-2 min-w-0"><span id="tip_${key}Max_hdr" class="text-xs font-extrabold flex flex-wrap items-center gap-1.5 min-w-0 cursor-help" style="color:${esc(col)}" data-tip="${tip}"><span class="truncate">${lbl}</span><span id="chip_${key}Max">${modChip(effVal)}</span>${resBadge(key)}</span>${secGearBtn(key,col)}</div><div class="flex items-center justify-between gap-1.5 min-w-0"><button type="button" data-action="sec-step" data-field="${curF}" data-delta="-1" class="btn w-10 h-10 sm:w-8 sm:h-8 shrink-0 text-sm">−</button><div class="flex items-center justify-center flex-wrap gap-1.5 min-w-0 flex-1"><input id="inp_${curF}" data-sec="${curF}" type="text" inputmode="numeric" value="${esc(S.secondary[curF])}" class="inp w-[62px] sm:w-14 text-center text-base font-black"/><span class="t-mut font-bold">/</span><input id="inp_${maxF}" data-sec="${maxF}" data-tip="${tip}" type="text" inputmode="numeric" value="${mx}" style="color:${esc(col)}" class="inp w-[62px] sm:w-14 text-center text-base font-black cursor-help"/><span id="val_${key}MaxEff" data-tip="${tip}" class="text-xs font-black cursor-help ${effVal?'':'hidden'}" style="color:${esc(col)}">(${base})</span></div><button type="button" data-action="sec-step" data-field="${curF}" data-delta="1" class="btn w-10 h-10 sm:w-8 sm:h-8 shrink-0 text-sm">+</button></div></div>`;};
  const iniTip=esc(buildSecTip('ini',M)), cresTip=esc(buildSecTip('cres',M)), bstTip=esc(buildSecTip('bst',M));
  const attrTips=Object.fromEntries(ATTRS.map(a=>[a.k,esc(buildAttrTip(a.k,M))]));
  const renderMobileAttrDetailCard=(a)=>{
    const c=getAttrCol(a.k),em=M[a.k]||0,tip=attrTips[a.k];
    return `<div class="subcard t1-mobile-card p-2.5 space-y-2.5 min-w-0" style="--ac:${c};background:color-mix(in srgb,var(--ac) 11%,var(--surf2));border-color:color-mix(in srgb,var(--ac) 34%,var(--bdr));border-top:3px solid var(--ac)">
      <div class="flex items-center gap-2 min-w-0">
        <button type="button" id="hdr_${a.k}" data-action="roll-attr" data-attr="${a.k}" data-tip="${tip}" class="btn ac-btn flex-1 py-1.5 px-2.5 justify-between min-w-0 min-h-[40px]" style="--ac:${c}"><span class="font-black text-xs shrink-0">🎲 ${a.k}</span><span class="text-[11px] font-semibold opacity-85 truncate">${a.n}</span></button>
        <button type="button" id="ges_${a.k}" data-action="roll-attr" data-attr="${a.k}" data-tip="${tip}" class="btn ac-btn shrink-0 px-3 py-1.5 min-h-[40px] text-base font-black tabular" style="--ac:${c}"><span>${getAttrTot(a.k,M)}</span>${em?`<span class="text-[10px]">(${fmtSign(em)})</span>`:''}</button>
      </div>
      <div class="grid grid-cols-3 gap-2">
        <label class="flex flex-col items-center gap-0.5 min-w-0"><span class="text-[10px] font-extrabold t-mut cursor-help" data-tip="Volkswert (Standard: 20)">Vw</span><input data-at="${a.k}:vw" type="text" inputmode="numeric" value="${esc(S.attributes[a.k].vw)}" class="inp w-full min-w-0 text-center font-bold py-1.5 px-1"/></label>
        <label class="flex flex-col items-center gap-0.5 min-w-0"><span class="text-[10px] font-extrabold t-mut cursor-help" data-tip="Individuelles Startpotenzial">Pot</span><input data-at="${a.k}:pot" type="text" inputmode="numeric" value="${esc(S.attributes[a.k].pot)}" class="inp w-full min-w-0 text-center font-bold py-1.5 px-1"/></label>
        <label class="flex flex-col items-center gap-0.5 min-w-0"><span class="text-[10px] font-extrabold t-mut cursor-help" data-tip="Situative / permanente Modifikatoren">Mod</span><input data-at="${a.k}:mod" type="text" inputmode="numeric" value="${esc(S.attributes[a.k].mod)}" class="inp w-full min-w-0 text-center font-bold py-1.5 px-1"/></label>
      </div>
      <div class="space-y-1">
        <div class="flex items-center justify-between text-[10px] font-extrabold text-acc"><span class="cursor-help" data-tip="Block 1 & 2: je +5 (2 SP)\nBlock 3 & 4: je +5 (3 SP)\nBlock 5: +10 (5 SP + 1 MsP)\nSP-Kosten sind in der Steigerungschronik manuell überschreibbar.">Training (Tr)</span><span class="t-mut tabular">+${getTrBonus(a.k)}</span></div>
        <div class="flex flex-col items-center gap-1.5 w-full" style="--ac:${c}">${renderTrPairs(a.k,a.n,'Attributtabelle')}</div>
      </div>
    </div>`;
  };
  const renderAttrCompact4x2=()=>{
    const openPairs=ATTR_GROUPS.filter(g=>Boolean(UI.tab1.attrPairs?.[g.k]));
    return `<div class="space-y-2.5 tabular">
      <div class="grid grid-cols-4 gap-1.5 sm:gap-2">
        ${ATTRS.map(a=>{
          const c=getAttrCol(a.k), em=M[a.k]||0, tip=attrTips[a.k];
          return `<button type="button" id="chipAttr_${a.k}" data-action="roll-attr" data-attr="${a.k}" data-tip="${tip}" class="attr-chip" style="--ac:${c}">
            <span class="text-[11px] font-black tracking-wide leading-none flex items-center gap-0.5 max-w-full" style="color:${c}"><span>${a.k}</span>${em?`<span class="text-[9px] opacity-90">${fmtSign(em)}</span>`:''}</span>
            <span class="text-base sm:text-lg font-black leading-tight">${getAttrTot(a.k,M)}</span>
          </button>`;
        }).join('')}
      </div>
      ${isMob?`<div class="flex flex-wrap items-center gap-1.5 pt-0.5">
        <span class="text-[10px] font-extrabold t-mut">Paar öffnen:</span>
        ${ATTR_GROUPS.map(g=>{
          const gc=S.attrColors[g.k]||DEF_ATTR_COLS[g.k], isOpen=Boolean(UI.tab1.attrPairs?.[g.k]), pairTxt=g.k.replace('_','/');
          return `<button type="button" data-action="toggle-attr-pair" data-group="${g.k}" aria-expanded="${isOpen}" class="btn py-1 px-2 text-[11px] font-extrabold min-h-[32px]" style="border-color:color-mix(in srgb,${gc} ${isOpen?'90%':'48%'},var(--bdr));background:color-mix(in srgb,${gc} ${isOpen?'24%':'10%'},var(--surf2));color:${gc}">${isOpen?'▾':'▸'} ${pairTxt}</button>`;
        }).join('')}
      </div>`:''}
      ${isMob&&openPairs.length?`<div class="space-y-2.5 pt-1">${openPairs.map(g=>{
        const gc=S.attrColors[g.k]||DEF_ATTR_COLS[g.k], gAttrs=ATTRS.filter(a=>a.g===g.k);
        return `<div class="rounded-xl border p-2 space-y-2" style="border-color:color-mix(in srgb,${gc} 48%,var(--bdr));background:color-mix(in srgb,${gc} 6%,var(--surf2))">
          <div class="flex items-center justify-between gap-2">
            <span class="text-xs font-black" style="color:${gc}">${esc(g.l)}</span>
            <button type="button" data-action="toggle-attr-pair" data-group="${g.k}" class="btn py-0.5 px-2 text-[10px]">▴ Schließen</button>
          </div>
          <div class="grid grid-cols-1 min-[540px]:grid-cols-2 gap-2.5">${gAttrs.map(a=>renderMobileAttrDetailCard(a)).join('')}</div>
        </div>`;
      }).join('')}</div>`:''}
    </div>`;
  };
  const renderMobileAttrExpanded=()=>{
    return `<div class="space-y-2.5 tabular">${ATTR_GROUPS.map(g=>{
      const gc=S.attrColors[g.k]||DEF_ATTR_COLS[g.k], gAttrs=ATTRS.filter(a=>a.g===g.k), isOpen=UI.tab1.attrPairs?.[g.k]!==false;
      return `<div class="rounded-xl border p-2 space-y-2 min-w-0" style="border-color:color-mix(in srgb,${gc} 45%,var(--bdr));background:color-mix(in srgb,${gc} 6%,var(--surf2))">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <button type="button" data-action="toggle-attr-pair" data-group="${g.k}" aria-expanded="${isOpen}" class="t1-hdr-title flex-1">
            <span class="btn w-7 h-7 p-0 text-xs font-black shrink-0" style="border-color:color-mix(in srgb,${gc} 55%,var(--bdr))">${isOpen?'▾':'▸'}</span>
            <span class="text-xs font-black truncate" style="color:${gc}">${esc(g.l)}</span>
          </button>
          <div id="pairSum_${g.k}" class="flex items-center gap-1 shrink-0">
            ${gAttrs.map(a=>`<button type="button" data-action="roll-attr" data-attr="${a.k}" data-tip="${attrTips[a.k]}" class="px-2 py-1 rounded-lg text-[11px] font-black border tabular" style="color:${gc};border-color:color-mix(in srgb,${gc} 50%,var(--bdr));background:color-mix(in srgb,${gc} 16%,var(--surf2))">🎲 ${a.k} ${getAttrTot(a.k,M)}</button>`).join('')}
          </div>
        </div>
        ${isOpen?`<div class="grid grid-cols-1 min-[540px]:grid-cols-2 gap-2.5">${gAttrs.map(a=>renderMobileAttrDetailCard(a)).join('')}</div>`:''}
      </div>`;
    }).join('')}</div>`;
  };
  const wL=toInt(S.thresholds.woundLight,0)+(M.woundLight||0), wM=toInt(S.thresholds.woundMedium,0)+(M.woundMedium||0), wH=toInt(S.thresholds.woundHeavy,0)+(M.woundHeavy||0);
  const tL=toInt(S.thresholds.traumaLight,0)+(M.traumaLight||0), tM=toInt(S.thresholds.traumaMedium,0)+(M.traumaMedium||0), tH=toInt(S.thresholds.traumaHeavy,0)+(M.traumaHeavy||0);
  const bstDelta0=bst-getBstAuto(), mv0=S.movements?.[0]||null;
  const mv0Auto=mv0?Math.max(0,toFlt(mv0.base,5)+M.moveBase+bstDelta0):0;
  const mv0HasOvr=mv0&&mv0.ovr!==undefined&&mv0.ovr!==null&&String(mv0.ovr).trim()!=='';
  const mv0Bew=mv0?(mv0HasOvr?Math.max(0,toFlt(mv0.ovr,mv0Auto)):mv0Auto):0;
  const hitHzObj=S.lastHzRoll!==null?S.hitZones.find(z=>{const m=String(z.range||'').match(/\d+/g);return m&&S.lastHzRoll>=Math.min(+m[0],+(m[1]??m[0]))&&S.lastHzRoll<=Math.max(+m[0],+(m[1]??m[0]));}):null;
  const activeQTabObj=QTABS.find(q=>q.k===S.quickTab)||QTABS[0];

  return `<section class="card t1-card">
    <div class="flex flex-wrap items-center justify-between gap-2 ${attrsCol?'mb-2.5':'mb-3'}">
      <div class="flex items-center gap-2 min-w-0">
        <button type="button" data-action="toggle-t1-sec" data-sec="attrs" aria-expanded="${!attrsCol}" data-tip="${attrsCol?'Attribut-Details (Vw, Pot, Tr, Mod) öffnen':'Auf kompakte 4×2-Schnellleiste einklappen'}" class="btn w-8 h-8 sm:w-7 sm:h-7 p-0 text-xs font-black shrink-0">${attrsCol?'▸':'▾'}</button>
        <button type="button" data-action="toggle-t1-sec" data-sec="attrs" class="t1-hdr-title">
          <h2 class="text-base sm:text-lg font-extrabold cursor-pointer" data-tip="4 gekoppelte Attributpaare:\n• ST & KO (Körper / LP)\n• PR & GW (Geschick)\n• WA & IN (Verstand / Ini)\n• AU & WK (Geist / mLP)">Attribute</h2>
        </button>
        <button type="button" data-action="open-attr-colors" data-tip="Farben der 4 Attributpaare anpassen" class="btn w-8 h-8 sm:w-7 sm:h-7 p-0 text-xs shrink-0">⚙️</button>
      </div>
      <div class="flex items-center gap-2 shrink-0">
        ${!attrsCol&&!isMob?`<span class="hidden lg:inline text-xs t-mut">Klicke auf ein Attribut oder den Gesamtwert, um den Test zu starten.</span>`:''}
        ${attrsCol?`<span class="hidden sm:inline text-[11px] t-mut">Tippen = Probe würfeln</span>`:''}
        <button type="button" data-action="toggle-t1-sec" data-sec="attrs" class="btn py-1 px-2.5 text-xs font-extrabold ${attrsCol?'bdr-acc bg-acc-soft text-acc':''}">${attrsCol?'✏️ Bearbeiten':'▴ Kompakt'}</button>
      </div>
    </div>
  ${attrsCol
    ?renderAttrCompact4x2()
    :(isMob
      ?renderMobileAttrExpanded()
      :`      <div class="overflow-x-auto max-w-full min-w-0 pb-1"><table class="tbl table-fixed w-full min-w-[900px] text-center tabular"><thead><tr><th class="text-left w-12">Wert</th>${ATTRS.map(a=>{const c=getAttrCol(a.k);return `<th class="ac-cell rounded-t-lg" style="--ac:${c}"><button type="button" id="hdr_${a.k}" data-action="roll-attr" data-attr="${a.k}" data-tip="${attrTips[a.k]}" class="btn ac-btn w-full py-1.5 px-1 flex-col gap-0" style="--ac:${c}"><span class="font-black text-xs">🎲 ${a.k}</span><span class="text-[10px] font-semibold opacity-85 truncate max-w-full">${a.n}</span></button></th>`;}).join('')}<th class="text-right w-12">Wert</th></tr></thead>
  <tbody>${mkRow('Vw','vw','Volkswert (Standard: 20)')}${mkRow('Pot','pot','Individuelles Startpotenzial')}
  <tr><td class="text-left text-xs font-extrabold text-acc cursor-help" data-tip="Block 1 & 2: je +5 (2 SP)\nBlock 3 & 4: je +5 (3 SP)\nBlock 5: +10 (5 SP + 1 MsP)\nSP-Kosten sind in der Steigerungschronik manuell überschreibbar.">Tr</td>${ATTRS.map(a=>{const c=getAttrCol(a.k);return `<td class="ac-cell" style="--ac:${c}"><div class="flex flex-col items-center gap-1 max-w-[96px] mx-auto" style="--ac:${c}">${renderTrPairs(a.k,a.n,'Attributtabelle')}</div></td>`;}).join('')}<td class="text-right text-xs font-extrabold text-acc">Tr</td></tr>
  ${mkRow('Mod','mod','Situative / permanente Modifikatoren')}
  <tr><td class="text-left text-xs font-black">Ges</td>${ATTRS.map(a=>{const c=getAttrCol(a.k),em=M[a.k]||0;return `<td class="ac-cell rounded-b-lg" style="--ac:${c}"><button type="button" id="ges_${a.k}" data-action="roll-attr" data-attr="${a.k}" data-tip="${attrTips[a.k]}" class="btn ac-btn w-full py-1.5 text-base font-black" style="--ac:${c}"><span>${getAttrTot(a.k,M)}</span>${em?`<span class="text-[10px]">(${fmtSign(em)})</span>`:''}</button></td>`;}).join('')}<td class="text-right text-xs font-black">Ges</td></tr></tbody></table></div>`)}
  ${attrsCol
    ?`<div class="mt-2 pt-1.5 border-t bdr-line flex flex-wrap items-center justify-between gap-2 text-[11px] t-mut tabular">
        <span class="cursor-help" data-tip="${lpRegTip}\n\n${mlpRegTip}">Regen: <strong id="t1Regen_lp" style="color:${esc(getSecCol('lp'))}">LP ${lpReg}</strong> • <strong id="t1Regen_mlp" style="color:${esc(getSecCol('mlp'))}">mLP ${mlpReg}</strong></span>
        <span class="text-[10px] opacity-80">Rast (2×): <strong style="color:${esc(getSecCol('lp'))}">+${lpReg*2}</strong> / <strong style="color:${esc(getSecCol('mlp'))}">+${mlpReg*2}</strong></span>
      </div>`
    :`<div class="mt-2 pt-1.5 border-t bdr-line flex flex-wrap items-center justify-between gap-2 text-[11px] t-mut tabular min-w-0">
    <div class="flex flex-wrap items-center gap-x-2.5 gap-y-1.5 min-w-0">
      <span class="inline-flex items-center gap-1 font-semibold">
        <span class="text-acc">•</span>
        <span class="cursor-help" data-tip="Standard-Regenerationsrate für LP und mLP ist separat jeweils 5.\nAnpassbar über Kräfte/Augmente ([+1 LP-Regeneration], [+1 mLP-Regeneration]) oder direkt hier per manuellem Overwrite.">Regenerationsrate:</span>
      </span>
      <label id="tip_lpRegen" data-tip="${lpRegTip}" class="inline-flex flex-wrap items-center gap-1 cursor-help max-w-full">
        <span class="font-extrabold" style="color:${esc(getSecCol('lp'))}">LP</span>
        <input id="inp_lpRegenOvr" data-regen-ovr="lp" type="text" inputmode="numeric" value="${lpReg}" class="inp !py-0 !px-1 w-14 h-9 md:w-10 md:h-6 text-center text-[11px] font-black ${lpRegOvr?'!border-amber-400 text-amber-300':'text-acc'}"/>
        <span id="chip_lpRegen">${modChip(M.lpRegen)}</span>
        <button type="button" id="rst_lpRegenOvr" data-action="reset-regen-ovr" data-key="lp" data-tip="Manueller Overwrite aktiv – Klicken für Standardberechnung (${lpRegAuto})" class="text-[10px] font-black text-amber-400 hover:underline ${lpRegOvr?'':'hidden'}">(${lpRegAuto})</button>
      </label>
      <span class="opacity-40">•</span>
      <label id="tip_mlpRegen" data-tip="${mlpRegTip}" class="inline-flex flex-wrap items-center gap-1 cursor-help max-w-full">
        <span class="font-extrabold" style="color:${esc(getSecCol('mlp'))}">mLP</span>
        <input id="inp_mlpRegenOvr" data-regen-ovr="mlp" type="text" inputmode="numeric" value="${mlpReg}" class="inp !py-0 !px-1 w-14 h-9 md:w-10 md:h-6 text-center text-[11px] font-black ${mlpRegOvr?'!border-amber-400 text-amber-300':'text-acc'}"/>
        <span id="chip_mlpRegen">${modChip(M.mlpRegen)}</span>
        <button type="button" id="rst_mlpRegenOvr" data-action="reset-regen-ovr" data-key="mlp" data-tip="Manueller Overwrite aktiv – Klicken für Standardberechnung (${mlpRegAuto})" class="text-[10px] font-black text-amber-400 hover:underline ${mlpRegOvr?'':'hidden'}">(${mlpRegAuto})</button>
      </label>
    </div>
    <span class="text-[10px] opacity-75 min-w-0 break-words">Erholsame Rast (2×): <strong id="val_lpReg4" style="color:${esc(getSecCol('lp'))}">+${lpReg*2} LP</strong> / <strong id="val_mlpReg4" style="color:${esc(getSecCol('mlp'))}">+${mlpReg*2} mLP</strong></span>
  </div>`}</section>
  <section class="card t1-card space-y-3 tabular">
    <div class="flex flex-wrap items-center justify-between gap-2 ${secCol?'':'border-b bdr-line pb-2.5'}">
      <div class="flex flex-wrap items-center gap-1.5 sm:gap-2 min-w-0">
        <button type="button" data-action="toggle-t1-sec" data-sec="sec" aria-expanded="${!secCol}" data-tip="${secCol?'Sekundärwerte ausklappen':'Sekundärwerte einklappen'}" class="btn w-8 h-8 sm:w-7 sm:h-7 p-0 text-xs font-black shrink-0">${secCol?'▸':'▾'}</button>
        <button type="button" data-action="toggle-t1-sec" data-sec="sec" class="t1-hdr-title">
          <h3 class="text-sm sm:text-base font-extrabold cursor-pointer">Sekundärwerte &amp; Ressourcen</h3>
        </button>
        <div class="flex flex-wrap items-center gap-1 text-[11px] font-black tabular">
          <span id="t1Prev_lp" class="px-1.5 py-0.5 rounded-md border bg-black/20" style="color:${esc(getSecCol('lp'))};border-color:color-mix(in srgb,${esc(getSecCol('lp'))} 45%,var(--bdr))">LP ${esc(S.secondary.lpCurrent)}/${lpMax}</span>
          <span id="t1Prev_mlp" class="px-1.5 py-0.5 rounded-md border bg-black/20" style="color:${esc(getSecCol('mlp'))};border-color:color-mix(in srgb,${esc(getSecCol('mlp'))} 45%,var(--bdr))">mLP ${esc(S.secondary.mlpCurrent)}/${mlpMax}</span>
          <span id="t1Prev_ap" class="px-1.5 py-0.5 rounded-md border bg-black/20" style="color:${esc(getSecCol('ap'))};border-color:color-mix(in srgb,${esc(getSecCol('ap'))} 45%,var(--bdr))">AP ${esc(S.secondary.apCurrent)}/${apMax}</span>
          <span id="t1Prev_map" class="px-1.5 py-0.5 rounded-md border bg-black/20" style="color:${esc(getSecCol('map'))};border-color:color-mix(in srgb,${esc(getSecCol('map'))} 45%,var(--bdr))">mAP ${esc(S.secondary.mapCurrent)}/${mapMax}</span>
          <span id="t1Prev_ini" class="px-1.5 py-0.5 rounded-md border bg-black/20" style="color:${esc(iniCol)};border-color:color-mix(in srgb,${esc(iniCol)} 45%,var(--bdr))">Ini ${fmtSign(ini)}</span>
        </div>
      </div>
    </div>
    ${!secCol?`<div class="grid grid-cols-1 md:grid-cols-12 gap-3 sm:gap-4 tabular">
      ${pool('lp',SEC_META.lp,'(KO + ST) / 5','lpCurrent','lpMod','val_lpMax',getLpBase(),lpMax)}
      <div class="md:col-span-4 subcard sc-card flex flex-col justify-between gap-2 p-3 min-w-0" style="--sc:${esc(iniCol)}"><div class="flex items-center justify-between gap-2 min-w-0"><div id="tip_ini_hdr" data-tip="${iniTip}" class="cursor-help min-w-0"><div class="text-xs font-extrabold flex items-center gap-1.5" style="color:${esc(iniCol)}"><span class="truncate">${SEC_META.ini}</span><span id="chip_ini">${modChip(iniDiff)}</span></div><div class="text-[11px] t-mut">WA − IN</div></div><div class="flex items-center gap-1.5 shrink-0"><label class="text-xs t-mut flex items-center gap-1">Mod <input id="inp_iniMod" data-sec="iniMod" type="text" inputmode="numeric" value="${esc(S.secondary.iniMod)}" class="inp w-14 sm:w-12 text-center font-bold py-1 px-1"/></label>${secGearBtn('ini',iniCol)}</div></div><div class="flex items-center justify-between gap-1.5 min-w-0"><button type="button" data-action="sec-step" data-field="iniMod" data-delta="-1" class="btn w-10 h-10 sm:w-8 sm:h-8 shrink-0 text-sm">−</button><div class="flex items-center justify-center flex-wrap gap-1.5 min-w-0 flex-1"><input id="val_iniTot" data-sec-max="ini" data-tip="${iniTip}" type="text" inputmode="numeric" value="${ini}" style="color:${esc(iniCol)}" class="inp w-[70px] sm:w-16 text-center text-base font-black cursor-help"/><span id="val_iniOrig" data-tip="${iniTip}" class="text-xs font-black cursor-help ${iniDiff?'':'hidden'}" style="color:${esc(iniCol)}">(${iniBase})</span></div><button type="button" data-action="sec-step" data-field="iniMod" data-delta="1" class="btn w-10 h-10 sm:w-8 sm:h-8 shrink-0 text-sm">+</button></div><div id="val_iniSub" class="text-center text-[11px] t-mut">${getAttrTot('WA',M)} (WA) − ${getAttrTot('IN',M)} (IN)${S.secondary.iniMod||M.ini?` + (${toInt(S.secondary.iniMod)+M.ini})`:''} = ${ini}</div></div>
      ${pool('mlp',SEC_META.mlp,'(AU + WK) / 5','mlpCurrent','mlpMod','val_mlpMax',getMlpBase(),mlpMax)}
      ${stam('ap',SEC_META.ap,'apCurrent','apMax',M.apMax)}
      ${stam('map',SEC_META.map,'mapCurrent','mapMax',M.mapMax)}
      <div class="md:col-span-4 subcard sc-card flex flex-col justify-between gap-2.5 p-3 min-w-0" style="--sc:${esc(crCol)}"><div class="flex items-center justify-between gap-2 min-w-0"><div class="flex flex-wrap items-center gap-1.5 flex-1 min-w-0"><input id="cresNameInp" data-cres="name" type="text" value="${esc(S.customRes.name)}" placeholder="Benutzerdefiniert" data-tip="${cresTip}" style="color:${esc(crCol)}" class="inp-sec-name text-xs font-extrabold flex-1 min-w-[90px]"/><span id="chip_cresMax">${modChip(M.cresMax)}</span>${resBadge('cres')}</div><div class="flex items-center gap-1 shrink-0">${secGearBtn('cres',crCol)}<button type="button" data-action="add-extra-sec" data-tip="Zusätzliches benutzerdefiniertes Sekundärattribut hinzufügen" class="btn w-7 h-7 p-0 text-xs font-black text-acc bdr-acc bg-acc-soft shrink-0">+</button></div></div><div class="flex items-center justify-between gap-1.5 min-w-0"><button type="button" data-action="cres-step" data-delta="-1" class="btn w-10 h-10 sm:w-8 sm:h-8 shrink-0 text-sm">−</button><div class="flex items-center justify-center flex-wrap gap-1.5 min-w-0 flex-1"><input id="inp_cresCurrent" data-cres="current" type="text" inputmode="numeric" value="${esc(S.customRes.current)}" class="inp w-[62px] sm:w-14 text-center text-base font-black"/><span class="t-mut font-bold">/</span><input id="inp_cresMax" data-cres="max" data-tip="${cresTip}" type="text" inputmode="numeric" value="${cresMax}" style="color:${esc(crCol)}" class="inp w-[62px] sm:w-14 text-center text-base font-black cursor-help"/><span id="val_cresMaxEff" data-tip="${cresTip}" class="text-xs font-black cursor-help ${M.cresMax?'':'hidden'}" style="color:${esc(crCol)}">(${cresBase})</span></div><button type="button" data-action="cres-step" data-delta="1" class="btn w-10 h-10 sm:w-8 sm:h-8 shrink-0 text-sm">+</button></div></div>
      ${(S.extraSecList||[]).map(ex=>{const exKey='ex_'+ex.id,exCol=getSecCol(exKey),exBase=getExtraSecBase(ex),exEff=M.extraSec?.[ex.id]||0,exMax=exBase+exEff,exTip=esc(buildSecTip(exKey,M)),isDelAsk=UI.confirmDelExSecId===ex.id;return `<div class="md:col-span-4 subcard sc-card flex flex-col justify-between gap-2.5 p-3 min-w-0" style="--sc:${esc(exCol)}"><div class="flex items-center justify-between gap-2 min-w-0"><div class="flex flex-wrap items-center gap-1.5 flex-1 min-w-0"><input id="exName_${ex.id}" data-exsec="${ex.id}:name" type="text" value="${esc(ex.name)}" placeholder="Sekundärattribut..." data-tip="${exTip}" style="color:${esc(exCol)}" class="inp-sec-name text-xs font-extrabold flex-1 min-w-[90px]"/><span id="chip_ex_${ex.id}Max">${modChip(exEff)}</span>${resBadge(exKey)}</div><div class="flex items-center gap-1 shrink-0">${secGearBtn(exKey,exCol)}${isDelAsk?`<span class="inline-flex items-center gap-1"><button type="button" data-action="confirm-del-extra-sec" data-id="${ex.id}" class="btn bg-rose-600 text-white border-rose-600 py-1 px-2 text-[11px] font-black">Sicher? (2/2)</button><button type="button" data-action="cancel-del-extra-sec" class="btn w-7 h-7 p-0 text-xs">✕</button></span>`:`<button type="button" data-action="ask-del-extra-sec" data-id="${ex.id}" data-tip="Sekundärattribut entfernen (zweistufige Sicherheitsabfrage)" class="btn btn-err w-7 h-7 p-0 text-xs font-black shrink-0">✕</button>`}</div></div><div class="flex items-center justify-between gap-1.5 min-w-0"><button type="button" data-action="exsec-step" data-id="${ex.id}" data-delta="-1" class="btn w-10 h-10 sm:w-8 sm:h-8 shrink-0 text-sm">−</button><div class="flex items-center justify-center flex-wrap gap-1.5 min-w-0 flex-1"><input id="inp_ex_${ex.id}_cur" data-exsec="${ex.id}:current" type="text" inputmode="numeric" value="${esc(ex.current)}" class="inp w-[62px] sm:w-14 text-center text-base font-black"/><span class="t-mut font-bold">/</span><input id="inp_ex_${ex.id}_max" data-exsec="${ex.id}:max" data-tip="${exTip}" type="text" inputmode="numeric" value="${exMax}" style="color:${esc(exCol)}" class="inp w-[62px] sm:w-14 text-center text-base font-black cursor-help"/><span id="val_ex_${ex.id}_eff" data-tip="${exTip}" class="text-xs font-black cursor-help ${exEff?'':'hidden'}" style="color:${esc(exCol)}">(${exBase})</span></div><button type="button" data-action="exsec-step" data-id="${ex.id}" data-delta="1" class="btn w-10 h-10 sm:w-8 sm:h-8 shrink-0 text-sm">+</button></div></div>`;}).join('')}
      <div class="md:col-span-12 flex justify-end -mt-1"><button type="button" data-action="add-extra-sec" class="btn py-1.5 sm:py-1 px-2.5 text-xs bdr-acc bg-acc-soft text-acc">+ Sekundärattribut hinzufügen</button></div>
    </div>`:''}
  </section>
  <div class="grid grid-cols-1 xl:grid-cols-12 gap-4 items-start"><div class="xl:col-span-8 2xl:col-span-9">${renderStatusEffectsSection()}</div><div class="xl:col-span-4 2xl:col-span-3 space-y-4">${renderInspirationSection()}${renderReservationsSection()}</div></div>
  <section class="card t1-card space-y-3 tabular">
    <div class="flex flex-wrap items-center justify-between gap-2 ${thCol?'':'border-b bdr-line pb-2.5'}">
      <div class="flex flex-wrap items-center gap-1.5 sm:gap-2 min-w-0">
        <button type="button" data-action="toggle-t1-sec" data-sec="thresholds" aria-expanded="${!thCol}" data-tip="${thCol?'Verwundungs- & Traumaschwellen ausklappen':'Verwundungs- & Traumaschwellen einklappen'}" class="btn w-8 h-8 sm:w-7 sm:h-7 p-0 text-xs font-black shrink-0">${thCol?'▸':'▾'}</button>
        <button type="button" data-action="toggle-t1-sec" data-sec="thresholds" class="t1-hdr-title">
          <h3 class="text-sm sm:text-base font-extrabold cursor-pointer">Verwundungs- &amp; Traumaschwellen</h3>
        </button>
        <span id="t1Prev_wound" class="px-2 py-0.5 rounded-md border text-[11px] font-black bg-black/20 tabular" style="color:${esc(getSecCol('lp'))};border-color:color-mix(in srgb,${esc(getSecCol('lp'))} 45%,var(--bdr))">Verw. ${wL}/${wM}/${wH}</span>
        <span id="t1Prev_trauma" class="px-2 py-0.5 rounded-md border text-[11px] font-black bg-black/20 tabular" style="color:${esc(getSecCol('mlp'))};border-color:color-mix(in srgb,${esc(getSecCol('mlp'))} 45%,var(--bdr))">Trauma ${tL}/${tM}/${tH}</span>
      </div>
    </div>
    ${!thCol?`<div class="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 tabular">${[['VERWUNDUNGSSCHWELLEN',getSecCol('lp'),[['woundLight','leicht','t-mut'],['woundMedium','mittel','text-amber-500'],['woundHeavy','schwer','text-rose-500']]],['TRAUMASCHWELLEN',getSecCol('mlp'),[['traumaLight','leicht','t-mut'],['traumaMedium','mittel','text-amber-500'],['traumaHeavy','schwer','text-indigo-400']]]].map(([h,hc,arr])=>`<div class="subcard p-3"><h4 class="text-xs font-extrabold tracking-wider mb-2" style="color:${esc(hc)}">${h}</h4><div class="grid grid-cols-3 gap-2 text-center">${arr.map(([k,l,c])=>{const b=toInt(S.thresholds[k],0),em=M[k]||0,eff=b+em,thTip=esc(buildSecTip(k,M));return `<div id="thBox_${k}" data-tip="${thTip}" class="rounded-lg border bdr-line bg-black/20 p-2 cursor-help min-w-0"><label class="block text-[11px] font-bold ${c} mb-1">${l} <span id="thEff_${k}" class="text-[10px] text-emerald-400 ${em?'':'hidden'}">(${b})</span></label><input id="thInp_${k}" data-th="${k}" type="text" inputmode="numeric" value="${eff}" class="inp w-full min-w-0 text-center text-lg font-black py-1 sm:py-0.5 ${em?'!border-emerald-500/60 text-emerald-300':''}"/></div>`;}).join('')}</div></div>`).join('')}</div>`:''}
  </section>
  <section class="card t1-card space-y-3 tabular">
    <div class="flex flex-wrap items-center justify-between gap-2 ${mvCol?'':'border-b bdr-line pb-2.5'}">
      <div class="flex flex-wrap items-center gap-1.5 sm:gap-2 min-w-0">
        <button type="button" data-action="toggle-t1-sec" data-sec="move" aria-expanded="${!mvCol}" data-tip="${mvCol?'Bewegungen ausklappen':'Bewegungen einklappen'}" class="btn w-8 h-8 sm:w-7 sm:h-7 p-0 text-xs font-black shrink-0">${mvCol?'▸':'▾'}</button>
        <button type="button" data-action="toggle-t1-sec" data-sec="move" class="t1-hdr-title">
          <h3 class="text-sm sm:text-base font-extrabold cursor-pointer" data-tip="Meter pro Bewegen-Aktion (Standard-BSt = 1/5 der Basis-Bewegung; Änderungen der BSt durch Overwrite oder Statuseffekte wirken auf Bew (BSt)). Bew (BSt) kann pro Zeile auch manuell überschrieben werden.">Bewegungen (Bew &amp; BSt)</h3>
        </button>
        <span id="t1Prev_bst" data-tip="${bstTip}" class="px-2 py-0.5 rounded-md border text-[11px] font-black cursor-help tabular ${hasBstOvr()?'border-amber-400/60 bg-amber-500/15 text-amber-300':'bdr-acc bg-acc-soft text-acc'}">BSt ${bst}</span>
        ${mv0?`<span id="t1Prev_move0" class="px-2 py-0.5 rounded-md border bdr-line bg-black/20 text-[11px] font-bold tabular">${esc(mv0.type)}: <strong>${fmtN(mv0Bew)} m</strong>${S.movements.length>1?` <span class="t-mut">(+${S.movements.length-1})</span>`:''}</span>`:''}
      </div>
    </div>
    ${!mvCol?`<div class="flex flex-wrap items-center justify-between gap-2">
      <div id="bstBox" data-tip="${bstTip}" class="subcard py-1.5 px-2.5 flex flex-wrap items-center gap-1.5 sm:gap-2 cursor-help max-w-full"><span class="text-xs font-extrabold text-acc">BSt:</span><button type="button" data-action="bst-step" data-delta="-1" class="btn w-9 h-9 md:w-7 md:h-7 p-0">−</button><input id="val_bstEff" data-bst-inp="1" type="text" inputmode="numeric" value="${bst}" class="inp w-16 md:w-12 text-center font-black text-sm tabular py-1 md:py-0.5 px-1 ${hasBstOvr()?'!border-amber-400 text-amber-300':'text-acc'}"/><button type="button" id="rst_bstOvr" data-action="reset-bst-ovr" data-tip="Manueller Overwrite aktiv – Klicken für Standardberechnung (${getBstAuto()})" class="text-[10px] font-black text-amber-400 hover:underline ${hasBstOvr()?'':'hidden'}">(${getBstAuto()})</button><span id="val_bstOrig" class="text-xs font-black text-acc ${M.bst?'':'hidden'}">(${getBstBase()})</span><span id="chip_bstMod">${modChip(M.bst)}</span><button type="button" data-action="bst-step" data-delta="1" class="btn w-9 h-9 md:w-7 md:h-7 p-0">+</button></div>
      <button type="button" data-action="add-move" class="btn py-1.5 px-2.5 text-xs">+ Bewegungsart</button>
    </div>
    <div class="overflow-x-auto max-w-full min-w-0"><table class="tbl r-tbl md:min-w-[540px] text-sm tabular"><thead><tr><th class="text-left">Art</th><th class="text-center">Basis (m)</th><th class="text-center">Bew (BSt)</th><th class="text-center">Bew/2</th><th class="text-center">Bew*2</th><th></th></tr></thead><tbody>${S.movements.map((mv,idx)=>{const bstDelta=bst-getBstAuto(),autoBew=Math.max(0,toFlt(mv.base,5)+M.moveBase+bstDelta),hasOvr=mv.ovr!==undefined&&mv.ovr!==null&&String(mv.ovr).trim()!=='',bew=hasOvr?Math.max(0,toFlt(mv.ovr,autoBew)):autoBew;return `<tr><td data-lbl="Art"><input data-mv="${mv.id}:type" type="text" value="${esc(mv.type)}" class="inp-line w-full min-w-0 text-right md:text-left font-bold"/></td><td data-lbl="Basis (m)" class="text-center"><input data-mv="${mv.id}:base" type="text" inputmode="decimal" value="${esc(mv.base)}" class="inp w-20 md:w-16 text-center font-bold py-1"/></td><td data-lbl="Bew (BSt)" class="text-center"><div class="inline-flex flex-wrap items-center justify-end md:justify-center gap-1"><input id="mv1_${mv.id}" data-mv="${mv.id}:ovr" type="text" inputmode="decimal" value="${fmtN(bew)}" data-tip="${hasOvr?`Manueller Overwrite aktiv (Automatisch: ${fmtN(autoBew)} m)\nFeld leeren oder auf (${fmtN(autoBew)}) klicken für Automatik`:`Automatisch berechnet: ${fmtN(autoBew)} m (Basis + BSt)\nDirekt eintippen für manuellen Overwrite`}" class="inp w-20 md:w-16 text-center font-extrabold py-1 text-acc ${hasOvr?'!border-amber-400 text-amber-300':''}"/><span class="text-xs font-bold t-mut">m</span><button type="button" id="mvOvrReset_${mv.id}" data-action="reset-mv-ovr" data-id="${mv.id}" data-tip="Manueller Overwrite aktiv – Klicken für Standardberechnung (${fmtN(autoBew)} m)" class="text-xs font-black text-amber-400 hover:underline ${hasOvr?'':'hidden'}">(${fmtN(autoBew)})</button></div></td><td id="mv2_${mv.id}" data-lbl="Bew/2" class="text-center font-bold">${fmtN(bew/2)} m</td><td id="mv3_${mv.id}" data-lbl="Bew*2" class="text-center font-bold">${fmtN(bew*2)} m</td><td class="text-right justify-end">${idx>0?`<button type="button" data-action="del-move" data-id="${mv.id}" class="t-mut hover:text-rose-500 font-bold px-2 py-1">✕</button>`:''}</td></tr>`;}).join('')}</tbody></table></div>`:''}
  </section>
  <section class="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
    <div class="lg:col-span-7 card t1-card space-y-2.5">
      <div class="flex flex-wrap items-center justify-between gap-2 ${hzCol?'':'border-b bdr-line pb-2'}">
        <div class="flex flex-wrap items-center gap-1.5 sm:gap-2 min-w-0">
          <button type="button" data-action="toggle-t1-sec" data-sec="hz" aria-expanded="${!hzCol}" data-tip="${hzCol?'Trefferzonen ausklappen':'Trefferzonen einklappen'}" class="btn w-8 h-8 sm:w-7 sm:h-7 p-0 text-xs font-black shrink-0">${hzCol?'▸':'▾'}</button>
          <button type="button" data-action="toggle-t1-sec" data-sec="hz" class="t1-hdr-title">
            <h3 class="text-sm sm:text-base font-extrabold cursor-pointer">Trefferzonen</h3>
          </button>
          ${M.armor?`<span class="tag">${fmtSign(M.armor)} RS</span>`:''}
          ${S.lastHzRoll!==null?`<span class="pill cursor-default text-amber-400 text-xs tabular">W100 = ${S.lastHzRoll}${hitHzObj?` • ${esc(hitHzObj.zone)}`:''}</span>`:''}
        </div>
        <div class="flex flex-wrap items-center gap-1.5 shrink-0">
          <button type="button" data-action="roll-hz" data-tip="Sofort einen W100-Trefferzonenwurf auslösen" class="btn border-amber-400/60 text-amber-400 py-1.5 sm:py-1 px-2.5 text-xs font-extrabold">🎯 W100</button>
        </div>
      </div>
      ${!hzCol?`<div class="flex flex-wrap justify-end gap-1.5">
        <button type="button" data-action="add-hz" class="btn py-1 px-2.5 text-xs">+ Zone</button>
        <button type="button" data-action="reset-hz" data-tip="Standard-Trefferzonen wiederherstellen (mit doppelter Sicherheitsabfrage)" class="btn py-1 px-2.5 text-xs">Standard</button>
      </div>
      <div class="overflow-x-auto max-w-full min-w-0"><table class="tbl r-tbl md:min-w-[480px] text-sm tabular"><thead><tr><th class="text-left w-24">Wurf</th><th class="text-left">Zone</th><th class="text-left w-24">Größe</th><th class="text-right w-44">Rüstung / Notiz</th><th class="w-6"></th></tr></thead><tbody>${S.hitZones.map(z=>{const m=String(z.range||'').match(/\d+/g),hit=S.lastHzRoll!==null&&m&&S.lastHzRoll>=Math.min(+m[0],+(m[1]??m[0]))&&S.lastHzRoll<=Math.max(+m[0],+(m[1]??m[0]));return `<tr class="${hit?'bg-amber-500/20 font-bold':''}"><td data-lbl="Wurf"><input data-hz="${z.id}:range" type="text" value="${esc(z.range)}" class="inp-line w-28 md:w-20 text-right md:text-left font-bold text-xs"/></td><td data-lbl="Zone"><div class="flex items-center justify-end md:justify-start gap-1 min-w-0 flex-1 md:flex-none">${hit?'<span>🎯</span>':''}<input data-hz="${z.id}:zone" type="text" value="${esc(z.zone)}" class="inp-line w-full min-w-0 text-right md:text-left font-bold"/></div></td><td data-lbl="Größe"><input data-hz="${z.id}:size" type="text" value="${esc(z.size)}" class="inp-line w-28 md:w-20 text-right md:text-left text-xs t-mut"/></td><td data-lbl="Rüstung / Notiz" class="text-right"><input data-hz="${z.id}:armor" type="text" value="${esc(z.armor)}" placeholder="Notiz" class="inp w-full min-w-0 text-right text-xs py-1"/></td><td class="text-right justify-end">${S.hitZones.length>1?`<button type="button" data-action="del-hz" data-id="${z.id}" class="t-mut hover:text-rose-500 text-xs font-bold px-2 py-1">✕</button>`:''}</td></tr>`;}).join('')}</tbody></table></div>`:''}
    </div>
    <div class="lg:col-span-5 card t1-card flex flex-col rtf-wrap min-w-0 space-y-2.5">
      <div class="flex flex-wrap items-center justify-between gap-1.5 ${qkCol?'':'border-b bdr-line pb-2'}">
        <div class="flex flex-wrap items-center gap-1.5 sm:gap-2 min-w-0">
          <button type="button" data-action="toggle-t1-sec" data-sec="quick" aria-expanded="${!qkCol}" data-tip="${qkCol?'Schnellzugriff ausklappen':'Schnellzugriff einklappen'}" class="btn w-8 h-8 sm:w-7 sm:h-7 p-0 text-xs font-black shrink-0">${qkCol?'▸':'▾'}</button>
          <button type="button" data-action="toggle-t1-sec" data-sec="quick" class="t1-hdr-title">
            <h3 class="text-sm sm:text-base font-extrabold cursor-pointer">Schnellzugriff</h3>
          </button>
          ${qkCol?`<span class="pill cursor-default text-[11px] py-0.5 px-2">${esc(activeQTabObj.l)}</span>`:''}
        </div>
        ${!qkCol?`<div class="flex items-center gap-1.5 shrink-0">${renderRtfToolbarHtml(true)}</div>`:''}
      </div>
      ${!qkCol?`<div class="flex flex-wrap gap-1.5">${QTABS.map(q=>`<button type="button" data-action="switch-qtab" data-qtab="${q.k}" class="btn text-xs py-1.5 sm:py-1 px-2.5 ${S.quickTab===q.k?'btn-pri':''}">${q.l}</button>`).join('')}</div>${QTABS.filter(q=>q.k===S.quickTab).map(q=>`<div contenteditable="true" data-qnote="${q.k}" data-ph="${esc(q.ph)}" class="inp w-full flex-1 resize-y text-xs sm:text-sm rtf-box min-h-[140px]">${toRtfHtml(S.combatNotes[q.k])}</div>`).join('')}`:''}
    </div>
  </section>`;
}
const skAttrOpts=(sel,M=calcActiveMods())=>ATTRS.map(a=>`<option value="${a.k}" ${a.k===sel?'selected':''}>${a.k} (${getAttrTot(a.k,M)})</option>`).join('');
const skCatOpts=sel=>Object.entries(SK_CATS).map(([k,v])=>`<option value="${k}" ${k===sel?'selected':''}>${v.l}</option>`).join('');

function buildSkRollBtnMeta(sk,M=calcActiveMods()){
  const autoB=getSkAutoBonus(sk.rank), hasOvr=hasSkBonusOvr(sk), effB=getSkBonus(sk), av=getAttrTot(sk.linkedAttr,M), pool=av+effB;
  const skAd=getAdvDisForContext({skillId:sk.id,attrKey:sk.linkedAttr},M), adTip=fmtAdvSrcLines(skAd.src);
  const skBadge=(skAd.autoAdv||skAd.autoDis)?`<span class="text-[10px] font-black shrink-0 ${skAd.autoAdv>=skAd.autoDis?'text-emerald-400':'text-rose-400'}">${skAd.autoAdv?`+${skAd.autoAdv}V`:''}${skAd.autoDis?`${skAd.autoAdv?'/':''}+${skAd.autoDis}N`:''}</span>`:'';
  const skColStyle=sk.color?`style="color:${esc(sk.color)}"`:`style="color:var(--txt)"`;
  const dispName=String(sk.name||'').trim()||'Unbenannte Fertigkeit';
  const tip=`Probe auf ${dispName} (${pool} = ${sk.linkedAttr} ${av} ${fmtSign(effB)}${hasOvr?` • Manuell, Grad: +${autoB}`:''})${adTip?'\n'+adTip:''}`;
  const innerHtml=`<span class="px-2 py-0.5 rounded-md bg-acc-soft border bdr-acc text-acc font-black shrink-0 tabular inline-flex items-center gap-1"><span>🎲 ${pool}</span>${skBadge}</span><span class="font-extrabold truncate text-left flex-1 min-w-0" ${skColStyle}>${esc(dispName)}</span>`;
  return {pool,av,effB,autoB,hasOvr,skBadge,tip,innerHtml};
}

function moveSkillOrder(skId,dir,isChron=false){
  const sk=S.skills.find(s=>s.id===skId); if(!sk) return false;
  const d=Number(dir);
  if(!isChron&&S.skillSections.length){
    const secId=sk.sectionId&&S.skillSections.some(s=>s.id===sk.sectionId)?sk.sectionId:'';
    const sibs=S.skills.filter(s=>(s.sectionId&&S.skillSections.some(sec=>sec.id===s.sectionId)?s.sectionId:'')===secId);
    const si=sibs.findIndex(s=>s.id===sk.id), tSib=sibs[si+d];
    if(!tSib) return false;
    const i1=S.skills.indexOf(sk), i2=S.skills.indexOf(tSib);
    S.skills[i1]=tSib; S.skills[i2]=sk;
    renderMain(); save(); return true;
  }
  const i=S.skills.findIndex(s=>s.id===skId), ni=i+d;
  if(i<0||ni<0||ni>=S.skills.length) return false;
  const [it]=S.skills.splice(i,1); S.skills.splice(ni,0,it);
  renderMain(); save(); return true;
}
function moveSkSecOrder(secId,dir){
  const sec=S.skillSections.find(s=>s.id===secId); if(!sec) return false;
  const pId=sec.parentSectionId||'', sibs=S.skillSections.filter(s=>(s.parentSectionId||'')===pId);
  const si=sibs.findIndex(s=>s.id===sec.id), tSib=sibs[si+Number(dir)];
  if(!tSib) return false;
  const i1=S.skillSections.indexOf(sec), i2=S.skillSections.indexOf(tSib);
  S.skillSections[i1]=tSib; S.skillSections[i2]=sec;
  renderMain(); save(); return true;
}
function findVisibleBtn(sel){
  return Array.from(document.querySelectorAll(sel)).find(b=>b.offsetParent!==null)||document.querySelector(sel);
}
function openSkSecPicker(anchorEl,skId){
  const sk=S.skills.find(x=>x.id===skId); if(!sk) return;
  const items=[
    {icon:'📁',label:'Ohne Sektion',active:!sk.sectionId,onClick:()=>{sk.sectionId='';renderMain();save();}},
    ...S.skillSections.map(s=>({
      icon:'📁',
      label:s.name||'Sektion',
      active:sk.sectionId===s.id,
      onClick:()=>{sk.sectionId=s.id;s.collapsed=false;renderMain();save();}
    }))
  ];
  openCtxMenu({key:`sk-sec-picker:${skId}`,title:'Sektion zuordnen',anchorEl,align:'right',minWidth:220,items});
}
function openSkMenu(anchorEl,skId,isChron=false,forceOpen=false){
  const sk=S.skills.find(x=>x.id===skId); if(!sk) return;
  const secId=!isChron&&S.skillSections.length&&sk.sectionId&&S.skillSections.some(s=>s.id===sk.sectionId)?sk.sectionId:'';
  const sibs=(!isChron&&S.skillSections.length)
    ?S.skills.filter(s=>(s.sectionId&&S.skillSections.some(sec=>sec.id===s.sectionId)?s.sectionId:'')===secId)
    :S.skills;
  const idx=sibs.findIndex(s=>s.id===skId);
  const c=calcSkCost(sk), autoB=getSkAutoBonus(sk.rank), hasOvr=hasSkBonusOvr(sk);
  const isGift=Boolean(c.manual&&c.sp===0&&c.msp===0);
  const isDelConfirm=UI.confirmDelSkId===skId;
  const curSecObj=sk.sectionId?S.skillSections.find(s=>s.id===sk.sectionId):null;
  const dispName=String(sk.name||'').trim()||'Fertigkeit';
  const items=[
    {type:'label',label:'Reihenfolge'},
    {
      icon:'▲',label:'Nach oben',disabled:idx<=0,keepOpen:true,
      onClick:()=>{
        if(moveSkillOrder(skId,-1,isChron)){
          const fresh=findVisibleBtn(`[data-action="open-sk-menu"][data-id="${skId}"]`);
          openSkMenu(fresh||anchorEl,skId,isChron,true);
        }
      }
    },
    {
      icon:'▼',label:'Nach unten',disabled:idx<0||idx>=sibs.length-1,keepOpen:true,
      onClick:()=>{
        if(moveSkillOrder(skId,1,isChron)){
          const fresh=findVisibleBtn(`[data-action="open-sk-menu"][data-id="${skId}"]`);
          openSkMenu(fresh||anchorEl,skId,isChron,true);
        }
      }
    }
  ];
  if(!isChron){
    items.push({sep:true});
    items.push({icon:'✎',label:'Namen bearbeiten',action:'toggle-sk-edit',dataset:{id:skId}});
    if(S.skillSections.length){
      items.push({
        icon:'📁',label:'Sektion wechseln',
        badge:curSecObj?(curSecObj.name||'Sektion'):'Ohne',
        onClick:()=>{openSkSecPicker(anchorEl,skId);}
      });
    }
  }
  items.push({sep:true});
  items.push({type:'label',label:'Darstellung & Kosten'});
  items.push({icon:'🎨',label:'Textfarbe',badge:sk.color?'●':'',action:'open-sk-color',dataset:{id:skId,cmode:'text'}});
  items.push({icon:'🪟',label:'Fensterfarbe',badge:sk.bgColor?'●':'',action:'open-sk-color',dataset:{id:skId,cmode:'bg'}});
  items.push({
    icon:'🎁',
    label:isGift?'Geschenkt aktiv (Standardkosten)':'Als geschenkt setzen (0 SP)',
    active:isGift,
    action:'gift-sk',
    dataset:{id:skId}
  });
  if(hasOvr){
    items.push({icon:'↺',label:`Bonus zurücksetzen (+${autoB})`,action:'reset-sk-bon',dataset:{id:skId}});
  }
  items.push({sep:true});
  if(isDelConfirm){
    items.push({
      icon:'⚠️',label:'Wirklich löschen? (2/2)',sub:`„${dispName}“ dauerhaft entfernen`,danger:true,
      onClick:()=>{
        UI.confirmDelSkId=null;
        const i=S.skills.findIndex(x=>x.id===skId);
        if(i>-1){
          logChron(`Fertigkeit entfernt: "${S.skills[i].name}".`);
          S.skills.splice(i,1);
          if(UI.skMobExp) delete UI.skMobExp[skId];
          S.weapons.forEach(w=>{if(w.skillId===skId)w.skillId='';});
          if(D.skillId===skId)D.skillId=null;
          syncDiceFromSheet();
          renderAll();
        }
      }
    });
    items.push({
      icon:'↩️',label:'Abbrechen',keepOpen:true,
      onClick:()=>{UI.confirmDelSkId=null;openSkMenu(anchorEl,skId,isChron,true);}
    });
  }else{
    items.push({
      icon:'🗑️',label:'Fertigkeit löschen',danger:true,keepOpen:true,
      onClick:()=>{UI.confirmDelSkId=skId;openSkMenu(anchorEl,skId,isChron,true);}
    });
  }
  openCtxMenu({
    key:`sk-menu:${skId}`,
    title:dispName,
    anchorEl,
    align:'right',
    minWidth:240,
    forceOpen,
    items,
    onClose:()=>{if(UI.confirmDelSkId===skId)UI.confirmDelSkId=null;}
  });
}
function openSkSecParentPicker(anchorEl,secId){
  const sec=S.skillSections.find(s=>s.id===secId); if(!sec) return;
  const validParents=S.skillSections.filter(s=>canSetSecParent(S.skillSections,secId,s.id));
  const items=[
    {icon:'📁',label:'Hauptebene',active:!sec.parentSectionId,onClick:()=>{sec.parentSectionId='';sanitizeSecHierarchy(S.skillSections);renderMain();save();}},
    ...validParents.map(s=>({
      icon:'↳',label:`in: ${s.name||'Sektion'}`,active:sec.parentSectionId===s.id,
      onClick:()=>{
        if(canSetSecParent(S.skillSections,secId,s.id)){
          sec.parentSectionId=s.id; s.collapsed=false; sanitizeSecHierarchy(S.skillSections); renderMain(); save();
        }
      }
    }))
  ];
  openCtxMenu({key:`sksec-parent-picker:${secId}`,title:'Übergeordnete Sektion',anchorEl,align:'right',minWidth:230,items});
}
function openSkSecFilterPicker(anchorEl,secId){
  const sec=S.skillSections.find(s=>s.id===secId); if(!sec) return;
  const setF=val=>{sec.filterAttr=val;UI.confirmSkSecPullId=null;renderMain();save();};
  const items=[
    {icon:'✕',label:'Kein Filter (Aus)',active:!sec.filterAttr,onClick:()=>setF('')},
    {sep:true},
    {type:'label',label:'Nach Attribut'},
    ...ATTRS.map(a=>({icon:'⚡',label:`${a.k} (${a.n})`,active:sec.filterAttr===a.k,onClick:()=>setF(a.k)})),
    {sep:true},
    {type:'label',label:'Nach Kategorie'},
    ...Object.entries(SK_CATS).map(([k,v])=>({icon:'🏷️',label:v.l,active:sec.filterAttr==='cat:'+k,onClick:()=>setF('cat:'+k)}))
  ];
  openCtxMenu({key:`sksec-filter-picker:${secId}`,title:'Sortierfilter wählen',anchorEl,align:'right',minWidth:235,items});
}
function openSkSecMenu(anchorEl,secId,forceOpen=false){
  const sec=S.skillSections.find(s=>s.id===secId); if(!sec) return;
  const pId=sec.parentSectionId||'', sibs=S.skillSections.filter(s=>(s.parentSectionId||'')===pId);
  const sIdx=sibs.findIndex(s=>s.id===secId);
  const secSkills=S.skills.filter(sk=>sk.sectionId===sec.id);
  const filterLbl=sec.filterAttr?(sec.filterAttr.startsWith('cat:')?SK_CATS[sec.filterAttr.slice(4)]?.l:sec.filterAttr):'';
  const curPar=sec.parentSectionId?S.skillSections.find(s=>s.id===sec.parentSectionId):null;
  const isPullConfirm=UI.confirmSkSecPullId===secId, isDelConfirm=UI.confirmDelSkSecId===secId;
  const items=[
    {type:'label',label:'Sektion sortieren & strukturieren'},
    {
      icon:'▲',label:'Sektion nach oben',disabled:sIdx<=0,keepOpen:true,
      onClick:()=>{
        if(moveSkSecOrder(secId,-1)){
          const fresh=document.querySelector(`[data-action="open-sksec-menu"][data-id="${secId}"]`);
          openSkSecMenu(fresh||anchorEl,secId,true);
        }
      }
    },
    {
      icon:'▼',label:'Sektion nach unten',disabled:sIdx<0||sIdx>=sibs.length-1,keepOpen:true,
      onClick:()=>{
        if(moveSkSecOrder(secId,1)){
          const fresh=document.querySelector(`[data-action="open-sksec-menu"][data-id="${secId}"]`);
          openSkSecMenu(fresh||anchorEl,secId,true);
        }
      }
    }
  ];
  if(S.skillSections.length>1){
    items.push({
      icon:'↳',label:'Übergeordnete Sektion',
      badge:curPar?(curPar.name||'Sektion'):'Hauptebene',
      onClick:()=>{openSkSecParentPicker(anchorEl,secId);}
    });
  }
  items.push({icon:'➕',label:'Untersektion erstellen',action:'add-sk-section',dataset:{parent:secId}});
  items.push({sep:true});
  items.push({type:'label',label:'Sortieren & Sammeln'});
  if(secSkills.length>1){
    items.push({icon:'⇅',label:'Fertigkeiten A–Z sortieren',action:'sort-sksec-az',dataset:{id:secId}});
  }
  items.push({
    icon:'🔍',label:'Sortierfilter wählen',
    badge:filterLbl||'Aus',
    onClick:()=>{openSkSecFilterPicker(anchorEl,secId);}
  });
  if(sec.filterAttr){
    if(isPullConfirm){
      items.push({
        icon:'⚠️',label:`Alle „${filterLbl}“ sammeln? (2/2)`,
        sub:'Verschiebt passende Fertigkeiten hierher & sortiert A–Z',
        action:'confirm-sksec-pull',dataset:{id:secId}
      });
      items.push({
        icon:'↩️',label:'Sammeln abbrechen',keepOpen:true,
        onClick:()=>{UI.confirmSkSecPullId=null;openSkSecMenu(anchorEl,secId,true);}
      });
    }else{
      items.push({
        icon:'📥',label:`Alle „${filterLbl}“ sammeln & A–Z`,keepOpen:true,
        onClick:()=>{UI.confirmSkSecPullId=secId;openSkSecMenu(anchorEl,secId,true);}
      });
    }
  }
  items.push({sep:true});
  items.push({type:'label',label:'Darstellung'});
  items.push({icon:'🎨',label:'Textfarbe der Sektion',badge:sec.color?'●':'',action:'open-sksec-color',dataset:{id:secId,cmode:'text'}});
  items.push({icon:'🪟',label:'Fensterfarbe der Sektion',badge:sec.bgColor?'●':'',action:'open-sksec-color',dataset:{id:secId,cmode:'bg'}});
  items.push({icon:sec.collapsed?'▾':'▸',label:sec.collapsed?'Sektion ausklappen':'Sektion einklappen',action:'toggle-sksec-collapse',dataset:{id:secId}});
  items.push({sep:true});
  if(isDelConfirm){
    items.push({
      icon:'⚠️',label:'Sektion wirklich löschen? (2/2)',
      sub:'Fertigkeiten & Untersektionen bleiben erhalten',
      danger:true,action:'confirm-del-sksec',dataset:{id:secId}
    });
    items.push({
      icon:'↩️',label:'Löschen abbrechen',keepOpen:true,
      onClick:()=>{UI.confirmDelSkSecId=null;openSkSecMenu(anchorEl,secId,true);}
    });
  }else{
    items.push({
      icon:'🗑️',label:'Sektion entfernen',danger:true,keepOpen:true,
      onClick:()=>{UI.confirmDelSkSecId=secId;openSkSecMenu(anchorEl,secId,true);}
    });
  }
  openCtxMenu({
    key:`sksec-menu:${secId}`,
    title:sec.name||'Sektion',
    anchorEl,
    align:'right',
    minWidth:250,
    forceOpen,
    items,
    onClose:()=>{
      if(UI.confirmDelSkSecId===secId)UI.confirmDelSkSecId=null;
      if(UI.confirmSkSecPullId===secId)UI.confirmSkSecPullId=null;
    }
  });
}

function renderSkillRows(isChron, listOverride=null){
  const arr=listOverride||S.skills;
  if(!arr.length) return isChron?`<tr><td colspan="8" class="text-center justify-center text-xs t-mut py-3">Noch keine Fertigkeiten erworben.</td></tr>`:'';
  const M=calcActiveMods(), rankLbls=['','Nov +10','Ges +15','Exp +20','Mei +30'];
  return arr.map((sk,idx)=>{
    const c=calcSkCost(sk), autoB=getSkAutoBonus(sk.rank), hasOvr=hasSkBonusOvr(sk), effB=getSkBonus(sk), av=getAttrTot(sk.linkedAttr,M), pool=av+effB;
    const dragBtn=`<span draggable="true" data-drag-sk="${sk.id}" data-tip="Ziehen zum Sortieren oder Verschieben in eine Sektion" class="px-1.5 py-0.5 rounded bg-black/20 border bdr-line t-mut text-xs font-black cursor-grab select-none shrink-0">⠿</span>`;
    const skColStyle=sk.color?`style="color:${esc(sk.color)}"`:'';
    const menuBtnMobile=`<button type="button" data-action="open-sk-menu" data-id="${sk.id}" data-chron="${isChron?'1':'0'}" aria-haspopup="menu" aria-expanded="false" aria-label="Aktionen für ${esc(sk.name||'Fertigkeit')}" data-tip="Sortieren (▲/▼), Sektion wechseln, Farben &amp; Löschen" class="btn md:hidden w-9 h-9 p-0 text-base font-black shrink-0">⋮</button>`;
    const menuBtnDesk=`<button type="button" data-action="open-sk-menu" data-id="${sk.id}" data-chron="${isChron?'1':'0'}" aria-haspopup="menu" aria-expanded="false" aria-label="Aktionen für ${esc(sk.name||'Fertigkeit')}" data-tip="Sortieren (▲/▼), Sektion wechseln, Farben &amp; Löschen" class="btn w-8 h-8 p-0 text-sm font-black shrink-0">⋮</button>`;
    const nm=isChron
      ?`<td class="r-card-hdr"><div class="flex items-center gap-1.5 w-full min-w-0">${dragBtn}<input data-sk="${sk.id}:name" type="text" value="${esc(sk.name)}" ${skColStyle} placeholder="Fertigkeitsname..." class="inp-line flex-1 min-w-0 text-left font-bold"/>${menuBtnMobile}</div></td>`
      :`<td class="r-card-hdr"><div class="flex items-center gap-1.5 w-full min-w-0">${dragBtn}${UI.editSkNameId===sk.id
        ?`<input id="skNameInp_${sk.id}" data-sk="${sk.id}:name" type="text" value="${esc(sk.name)}" ${skColStyle} placeholder="Fertigkeitsname..." class="inp flex-1 min-w-0 w-full font-extrabold py-1.5 md:py-1 px-2"/><button type="button" data-action="toggle-sk-edit" data-id="${sk.id}" data-tip="Umbenennen bestätigen" class="btn btn-ok w-9 h-9 md:w-7 md:h-7 p-0 text-xs font-black shrink-0">✓</button>`
        :(()=>{const bm=buildSkRollBtnMeta(sk,M);return `<button type="button" id="skRollBtn_${sk.id}" data-action="roll-skill" data-id="${sk.id}" data-tip="${esc(bm.tip)}" class="btn bg-acc-soft/40 hover:bg-acc-soft bdr-acc flex-1 min-w-0 justify-start gap-2 py-1.5 md:py-1 px-2 text-left tabular">${bm.innerHtml}</button><button type="button" data-action="toggle-sk-edit" data-id="${sk.id}" data-tip="Fertigkeitsnamen bearbeiten" class="btn w-9 h-9 md:w-7 md:h-7 p-0 text-xs shrink-0">✎</button>`;})()}${menuBtnMobile}</div></td>`;
    const bonCtrl=`<div class="inline-flex items-center justify-end md:justify-center gap-1.5 tabular shrink-0">
      <input id="skBon_${isChron?'chr_':''}${sk.id}" data-sk-bon="${sk.id}" type="text" inputmode="numeric" value="${fmtSign(effB)}" data-tip="${hasOvr?`Manueller Bonus-Overwrite aktiv (Grad-Standard: +${autoB})\nFeld leeren oder auf (+${autoB}) klicken für Standard`:`Fertigkeitsbonus (${SK_RANKS[sk.rank]?.n||'Ungelernt'}: +${autoB})\nDirekt eintippen für eigenen Bonus außerhalb von +10/+15/+20/+30`}" class="inp w-16 md:w-14 text-center py-1 md:py-0.5 px-1 text-xs font-extrabold ${hasOvr?'!border-amber-400 text-amber-300':'text-acc'}"/>
      <button type="button" id="skBonReset_${isChron?'chr_':''}${sk.id}" data-action="reset-sk-bon" data-id="${sk.id}" data-tip="Manueller Bonus aktiv – Klicken für Grad-Standard (+${autoB})" class="text-[11px] font-black text-amber-400 hover:underline ${hasOvr?'':'hidden'}">(+${autoB})</button>
    </div>`;
    const giftBtn=`<button type="button" data-action="gift-sk" data-id="${sk.id}" data-tip="${c.manual&&c.sp===0&&c.msp===0?`Geschenkt aktiv (0 SP) – Klicken für Standardkosten (${c.autoSp} SP${c.autoMsp?` + ${c.autoMsp} MsP`:''})`:'Als geschenkt markieren (0 SP / 0 MsP) – Toggle'}" class="btn py-1 md:py-0.5 px-2 md:px-1.5 text-xs md:text-[10px] ${c.manual&&c.sp===0&&c.msp===0?'btn-ok':''}">🎁</button>`;
    const spInp=`<input data-skcost="${sk.id}:sp" type="text" inputmode="numeric" value="${c.sp}" data-tip="SP-Kosten direkt überschreiben (z.B. 0 = Geschenkt; Standard: ${c.autoSp} SP)" class="inp w-16 md:w-12 text-center py-1 md:py-0.5 px-1 text-xs font-extrabold ${c.manual?'!border-amber-400 text-amber-300':''}"/>`;
    const costCells=isChron
      ?`<td data-lbl="Kosten (SP)" class="text-center"><div class="inline-flex items-center justify-end md:justify-center gap-1.5 tabular">${spInp}<span class="text-[11px] md:text-[10px] t-mut font-bold">SP</span></div></td><td data-lbl="MsP" class="text-center"><div class="inline-flex items-center justify-end md:justify-center gap-1.5 tabular"><input data-skcost="${sk.id}:msp" type="text" inputmode="numeric" value="${c.msp}" data-tip="MsP-Kosten direkt überschreiben (Standard: ${c.autoMsp} MsP)" class="inp w-16 md:w-12 text-center py-1 md:py-0.5 px-1 text-xs font-extrabold ${c.msp?'text-amber-400':''}"/>${giftBtn}</div></td>`
      :`<td data-lbl="Kosten (SP)" class="text-center"><div class="inline-flex items-center justify-end md:justify-center gap-1.5 tabular">${spInp}<span class="text-[11px] md:text-[10px] t-mut font-bold">SP</span>${c.msp?`<span class="text-[10px] font-black text-amber-500">+${c.msp}M</span>`:''}${giftBtn}</div></td>`;
    const mid=isChron
      ?`<td data-lbl="Grad &amp; Bonus"><div class="flex flex-wrap md:flex-nowrap items-center justify-end md:justify-start gap-1.5 min-w-0"><select data-sk-sel="${sk.id}:rank" class="inp py-1 px-1.5 text-xs font-bold min-w-0 max-w-full">${SK_RANKS.map(r=>`<option value="${r.r}" ${sk.rank===r.r?'selected':''}>${r.n} (+${r.b})</option>`).join('')}</select>${bonCtrl}</div></td>${costCells}`
      :`${[1,2,3,4].map(rk=>{const on=sk.rank>=rk;return `<td class="text-center r-rank-cell" data-lbl="${rankLbls[rk]}"><button type="button" data-action="set-sk-rank" data-id="${sk.id}" data-rank="${rk}" class="btn w-7 h-7 p-0 text-xs ${on?(rk===4?'bg-amber-500 text-slate-950 border-amber-400 font-black':'btn-ok font-black'):''}">${on?'✕':''}</button></td>`;}).join('')}<td data-lbl="Bonus" class="text-center">${bonCtrl}</td>${costCells}`;
    return `<tr data-sk-row="${sk.id}" ${sk.bgColor?`style="background:color-mix(in srgb,${esc(sk.bgColor)} 22%,transparent)"`:''}>${nm}<td data-lbl="Attribut"><select data-sk-sel="${sk.id}:linkedAttr" class="inp py-1 px-1.5 text-xs font-bold min-w-0 max-w-full">${skAttrOpts(sk.linkedAttr)}</select></td><td data-lbl="Kategorie"><select data-sk-sel="${sk.id}:category" class="inp py-1 px-1.5 text-xs font-semibold min-w-0 max-w-full">${skCatOpts(sk.category)}</select></td>${mid}<td data-lbl="Notizen"><input data-sk="${sk.id}:notes" type="text" value="${esc(sk.notes)}" placeholder="Notiz..." class="inp-line w-full min-w-0 text-right md:text-left text-xs"/></td><td class="hidden md:table-cell text-right">${menuBtnDesk}</td></tr>`;
  }).join('');
}

const skSortIcon=col=>UI.skSort?.col===col?(UI.skSort.asc?' ▲':' ▼'):' ⇅';
const skSortBtn=(col,lbl,align='text-left',tip='')=>`<button type="button" data-action="sort-sk-col" data-col="${col}" ${tip?`data-tip="${tip}"`:''} class="hover:text-acc font-extrabold inline-flex items-center gap-0.5 ${align} ${UI.skSort?.col===col?'text-acc':''}">${lbl}<span class="text-[10px] opacity-75">${skSortIcon(col)}</span></button>`;
const skMobileSortBar=cols=>`<div class="flex md:hidden flex-wrap items-center gap-1.5 text-xs mb-2"><span class="t-mut font-bold shrink-0">Sortieren:</span>${cols.map(([c,l])=>`<button type="button" data-action="sort-sk-col" data-col="${c}" class="btn py-1 px-2 text-[11px] ${UI.skSort?.col===c?'btn-pri':''}">${l}<span class="text-[10px] opacity-80">${skSortIcon(c)}</span></button>`).join('')}</div>`;

function buildSkMobRankBtnMeta(sk){
  const rkObj=SK_RANKS[sk.rank]||SK_RANKS[0], autoB=getSkAutoBonus(sk.rank), hasOvr=hasSkBonusOvr(sk), effB=getSkBonus(sk);
  const cls=hasOvr?'!border-amber-400 bg-amber-500/15 text-amber-300':(sk.rank===4?'border-amber-400/60 bg-amber-500/10 text-amber-300':(sk.rank>0?'bdr-acc bg-acc-soft/35 text-acc':'t-mut'));
  const html=`<span class="truncate">${esc(rkObj.n)} (${fmtSign(effB)}${hasOvr?' ✎':''})</span><span class="text-[10px] opacity-80 shrink-0">▾</span>`;
  const tip=hasOvr?`${rkObj.n} • Manueller Bonus ${fmtSign(effB)} (Grad-Standard: +${autoB})`:`${rkObj.n} (+${autoB}) – Tippen zum Grad-Wechsel`;
  return {cls,html,tip};
}
function buildSkMobCostPillMeta(sk){
  const c=calcSkCost(sk), catShort=SK_CAT_SHORT[sk.category]||(SK_CATS[sk.category]?.l||'Fund.');
  const isGift=Boolean(c.manual&&c.sp===0&&c.msp===0);
  const costTxt=isGift?'🎁 0 SP':`${c.sp} SP${c.msp?` + ${c.msp}M`:''}`;
  const cls=isGift?'border-emerald-500/45 bg-emerald-500/15 text-emerald-300':(c.manual?'border-amber-400/60 bg-amber-500/15 text-amber-300':'bdr-line bg-black/20 t-mut');
  return {text:`${catShort} • ${costTxt}`,cls};
}
function openSkRankMenu(anchorEl,skId){
  const sk=S.skills.find(x=>x.id===skId); if(!sk) return;
  const dispName=String(sk.name||'').trim()||'Fertigkeit';
  const catLbl=SK_CATS[sk.category]?.l||'Fundamental';
  const items=SK_RANKS.map(rk=>{
    const cost=calcAutoSkCost(sk.category,rk.r);
    const isCur=sk.rank===rk.r;
    const reached=rk.r===0?(sk.rank===0):(sk.rank>=rk.r);
    const costStr=rk.r===0?'0 SP':`${cost.sp} SP${cost.msp?` + ${cost.msp} MsP`:''}`;
    return {
      icon:reached?'☑':'☐',
      label:`${rk.n} (+${rk.b})`,
      sub:rk.r===0?(isCur?'Aktueller Grad (Ungelernt)':'Auf Ungelernt zurücksetzen'):`${catLbl} • kumulativ ${costStr}${isCur?' • Aktueller Grad':(reached?' • Erreicht':'')}`,
      badge:isCur?`✓ ${costStr}`:costStr,
      active:isCur,
      onClick:()=>{
        if(sk.rank===rk.r) return;
        sk.rank=rk.r;
        if(!sk.manualCost){
          const auto=calcAutoSkCost(sk.category,sk.rank);
          sk.customSp=auto.sp;
          sk.customMsp=auto.msp;
        }
        logChron(`Fertigkeit "${sk.name}" → ${SK_RANKS[sk.rank].n}.`);
        syncDiceFromSheet();
        renderAll();
      }
    };
  });
  openCtxMenu({
    key:`sk-rank-menu:${skId}`,
    title:`${dispName} – Grad wählen`,
    anchorEl,
    align:'left',
    minWidth:260,
    items
  });
}
function renderSkMobileList(skList){
  const arr=skList||S.skills;
  if(!arr.length) return '';
  const M=calcActiveMods(), hasSec=S.skillSections.length>0;
  const sortCols=[['name','Name'],['attr','Attribut'],['cat','Kategorie'],['bonus','Bonus'],['sp','SP']];
  const sortBar=`<div class="flex flex-wrap items-center gap-1.5 text-xs mb-2"><span class="t-mut font-bold shrink-0">Sortieren:</span>${sortCols.map(([c,l])=>`<button type="button" data-action="sort-sk-col" data-col="${c}" class="btn py-1 px-2 text-[11px] ${UI.skSort?.col===c?'btn-pri':''}">${l}<span class="text-[10px] opacity-80">${skSortIcon(c)}</span></button>`).join('')}</div>`;
  const cards=arr.map(sk=>{
    const c=calcSkCost(sk), autoB=getSkAutoBonus(sk.rank), hasOvr=hasSkBonusOvr(sk), effB=getSkBonus(sk);
    const bm=buildSkRollBtnMeta(sk,M), rm=buildSkMobRankBtnMeta(sk), cp=buildSkMobCostPillMeta(sk);
    const attrCol=getAttrCol(sk.linkedAttr), dispName=String(sk.name||'').trim()||'Unbenannte Fertigkeit';
    const exp=Boolean(UI.skMobExp&&UI.skMobExp[sk.id]), hasNotes=Boolean(String(sk.notes||'').trim());
    const isGift=Boolean(c.manual&&c.sp===0&&c.msp===0);
    const isEditing=UI.editSkNameId===sk.id;
    const cardStyleParts=[];
    if(isHex(sk.bgColor)){
      cardStyleParts.push(`background:color-mix(in srgb,${esc(sk.bgColor)} 24%,var(--surf2))`);
      cardStyleParts.push(`border-color:color-mix(in srgb,${esc(sk.bgColor)} 62%,var(--bdr))`);
    }
    if(isHex(sk.color)) cardStyleParts.push(`border-left:4px solid ${esc(sk.color)}`);
    const cardStyle=cardStyleParts.length?`style="${cardStyleParts.join(';')}"`:'';
    const nameColStyle=sk.color?`style="color:${esc(sk.color)}"`:'';
    const nameSlot=isEditing
      ?`<input id="skNameInp_${sk.id}" data-sk="${sk.id}:name" type="text" value="${esc(sk.name)}" ${nameColStyle} placeholder="Fertigkeitsname..." class="inp sk-mob-name-inp flex-1 min-w-0 font-extrabold py-1 px-2"/><button type="button" data-action="toggle-sk-edit" data-id="${sk.id}" aria-label="Umbenennen bestätigen" class="btn btn-ok w-8 h-8 p-0 text-xs font-black shrink-0">✓</button>`
      :`<span id="skMobName_${sk.id}" class="font-extrabold text-sm truncate flex-1 min-w-0" ${nameColStyle}>${esc(dispName)}</span>`;
    const detailHtml=exp?`<div class="sk-mob-detail mt-2 pt-2 border-t bdr-line grid grid-cols-2 gap-2 min-w-0">
      <label class="flex flex-col gap-0.5 min-w-0">
        <span class="text-[10px] font-extrabold t-mut uppercase">Attribut</span>
        <select data-sk-sel="${sk.id}:linkedAttr" class="inp w-full py-1 px-1.5 font-bold">${skAttrOpts(sk.linkedAttr,M)}</select>
      </label>
      <label class="flex flex-col gap-0.5 min-w-0">
        <span class="text-[10px] font-extrabold t-mut uppercase">Kategorie</span>
        <select data-sk-sel="${sk.id}:category" class="inp w-full py-1 px-1.5 font-semibold">${skCatOpts(sk.category)}</select>
      </label>
      <div class="flex flex-col gap-0.5 min-w-0 ${hasSec?'':'col-span-2'}">
        <span class="text-[10px] font-extrabold t-mut uppercase">Bonus-Overwrite</span>
        <div class="flex items-center gap-1.5 min-w-0 tabular">
          <input id="skBon_${sk.id}" data-sk-bon="${sk.id}" type="text" inputmode="numeric" value="${fmtSign(effB)}" class="inp flex-1 min-w-0 text-center py-1 px-1.5 font-extrabold ${hasOvr?'!border-amber-400 text-amber-300':'text-acc'}"/>
          <button type="button" id="skBonReset_${sk.id}" data-action="reset-sk-bon" data-id="${sk.id}" class="btn py-1 px-2 text-xs font-black text-amber-400 border-amber-400/50 shrink-0 ${hasOvr?'':'hidden'}">↺ +${autoB}</button>
        </div>
      </div>
      ${hasSec?`<label class="flex flex-col gap-0.5 min-w-0">
        <span class="text-[10px] font-extrabold t-mut uppercase">Sektion</span>
        <select data-sk-sel="${sk.id}:sectionId" class="inp w-full py-1 px-1.5 font-semibold"><option value="">📁 Ohne Sektion</option>${S.skillSections.map(s=>`<option value="${s.id}" ${sk.sectionId===s.id?'selected':''}>📁 ${esc(s.name||'Sektion')}</option>`).join('')}</select>
      </label>`:''}
      <div class="flex flex-col gap-0.5 min-w-0">
        <span class="text-[10px] font-extrabold t-mut uppercase">SP-Kosten ${c.manual?`(Auto: ${c.autoSp})`:''}</span>
        <div class="flex items-center gap-1 min-w-0 tabular">
          <input data-skcost="${sk.id}:sp" type="text" inputmode="numeric" value="${c.sp}" class="inp flex-1 min-w-0 text-center py-1 px-1 font-extrabold ${c.manual?'!border-amber-400 text-amber-300':''}"/>
          <span class="text-[11px] font-bold t-mut shrink-0">SP</span>
        </div>
      </div>
      <div class="flex flex-col gap-0.5 min-w-0">
        <span class="text-[10px] font-extrabold t-mut uppercase">MsP &amp; Geschenkt</span>
        <div class="flex items-center gap-1 min-w-0 tabular">
          <input data-skcost="${sk.id}:msp" type="text" inputmode="numeric" value="${c.msp}" class="inp flex-1 min-w-0 text-center py-1 px-1 font-extrabold ${c.msp?'text-amber-400':''}"/>
          <button type="button" data-action="gift-sk" data-id="${sk.id}" aria-label="Als geschenkt umschalten" class="btn py-1 px-2 text-xs shrink-0 ${isGift?'btn-ok':''}">🎁</button>
          ${c.manual?`<button type="button" data-action="reset-sk-cost" data-id="${sk.id}" aria-label="Standardkosten wiederherstellen" class="btn py-1 px-1.5 text-xs text-amber-300 border-amber-400/50 shrink-0">↺</button>`:''}
        </div>
      </div>
      <label class="col-span-2 flex flex-col gap-0.5 min-w-0">
        <span class="text-[10px] font-extrabold t-mut uppercase">Notizen</span>
        <input data-sk="${sk.id}:notes" type="text" value="${esc(sk.notes)}" placeholder="Notiz zur Fertigkeit..." class="inp w-full py-1 px-2"/>
      </label>
    </div>`:'';
    return `<article data-sk-row="${sk.id}" class="sk-mob-card" ${cardStyle}>
      <div class="flex items-center gap-1.5 min-w-0">
        ${nameSlot}
        ${!isEditing?`<span class="px-1.5 py-0.5 rounded text-[10px] font-black shrink-0 tabular" style="color:${attrCol};background:color-mix(in srgb,${attrCol} 16%,transparent);border:1px solid color-mix(in srgb,${attrCol} 42%,transparent)">${esc(sk.linkedAttr)}</span>`:''}
        <button type="button" id="skMobRollBtn_${sk.id}" data-action="roll-skill" data-id="${sk.id}" data-tip="${esc(bm.tip)}" aria-label="Probe auf ${esc(dispName)} würfeln (${bm.pool})" class="btn bg-acc-soft/50 hover:bg-acc-soft bdr-acc py-1 px-2 text-xs font-black text-acc tabular shrink-0 min-h-[32px]"><span>🎲 ${bm.pool}</span>${bm.skBadge}</button>
        <button type="button" data-action="toggle-sk-mob-exp" data-id="${sk.id}" aria-expanded="${exp?'true':'false'}" aria-label="Details für ${esc(dispName)} ${exp?'einklappen':'ausklappen'}" class="btn w-8 h-8 p-0 text-xs font-black shrink-0 ${exp?'bdr-acc bg-acc-soft text-acc':''}">${exp?'▾':'▸'}</button>
        <button type="button" data-action="open-sk-menu" data-id="${sk.id}" data-chron="0" aria-haspopup="menu" aria-expanded="false" aria-label="Aktionen für ${esc(dispName)}" class="btn w-8 h-8 p-0 text-base font-black shrink-0">⋮</button>
      </div>
      <div class="flex items-center justify-between gap-1.5 mt-1.5 min-w-0">
        <button type="button" id="skMobRankBtn_${sk.id}" data-action="open-sk-rank-menu" data-id="${sk.id}" aria-haspopup="menu" aria-expanded="false" data-tip="${esc(rm.tip)}" class="btn py-1 px-2 text-[11px] font-extrabold tabular min-w-0 max-w-[60%] ${rm.cls}">${rm.html}</button>
        <div class="flex items-center gap-1 shrink-0 min-w-0">
          <span id="skMobCostPill_${sk.id}" class="inline-flex items-center px-1.5 py-0.5 rounded-md border text-[10px] font-extrabold tabular whitespace-nowrap ${cp.cls}">${esc(cp.text)}</span>
          <button type="button" id="skMobNoteBadge_${sk.id}" data-action="toggle-sk-mob-exp" data-id="${sk.id}" aria-label="Notizen anzeigen" class="inline-flex items-center justify-center px-1.5 py-0.5 rounded-md border bdr-line bg-black/20 text-[11px] leading-none shrink-0 ${hasNotes?'':'hidden'}">📝</button>
        </div>
      </div>
      ${detailHtml}
    </article>`;
  }).join('');
  return `${sortBar}<div class="space-y-2">${cards}</div>`;
}

function renderSkTable(skList){
  if(isMobileLayout()) return renderSkMobileList(skList);
  return `${skMobileSortBar([['name','Name'],['attr','Attribut'],['cat','Kategorie'],['bonus','Bonus'],['sp','SP']])}<div class="overflow-x-auto max-w-full min-w-0"><table class="tbl r-tbl md:min-w-[900px] text-sm"><thead><tr><th class="text-left">${skSortBtn('name','🎲 Probe &amp; Fertigkeit','text-left','Alphabetisch sortieren (auf-/absteigend)')}</th><th class="text-left">${skSortBtn('attr','Attribut','text-left','Nach Attribut &amp; höchstem Wert sortieren')}</th><th class="text-left">${skSortBtn('cat','Kategorie','text-left','Nach Kategorie sortieren')}</th><th class="text-center">Nov. +10</th><th class="text-center">Ges. +15</th><th class="text-center">Exp. +20</th><th class="text-center">Mei. +30</th><th class="text-center">${skSortBtn('bonus','Bonus (Overwrite)','text-center','Nach aktivem Fertigkeitsbonus sortieren (direkt eintippbar für eigene Boni)')}</th><th class="text-center">${skSortBtn('sp','Kosten (SP)','text-center','Nach SP-Kosten sortieren')}</th><th class="text-left">Notizen</th><th class="w-10"></th></tr></thead><tbody>${renderSkillRows(false,skList)}</tbody></table></div>`;
}

function renderSkSection(sec,sIdx,sibLen=1,depth=0){
  const secSkills=S.skills.filter(sk=>sk.sectionId===sec.id), childSecs=S.skillSections.filter(s=>(s.parentSectionId||'')===sec.id);
  const colStyle=sec.color?`style="color:${esc(sec.color)}"`:'', winStyle=cardColorStyle(sec);
  const filterLbl=sec.filterAttr?(sec.filterAttr.startsWith('cat:')?SK_CATS[sec.filterAttr.slice(4)]?.l:sec.filterAttr):'';
  return `<section data-sk-sec="${sec.id}" class="card space-y-3 border-2 bdr-acc ${depth>0?'bg-black/15':''}" ${winStyle}>
    <div class="flex flex-wrap items-center justify-between gap-2 ${sec.collapsed?'':'border-b bdr-line pb-2.5'}">
      <div class="flex items-center gap-1.5 flex-1 min-w-0">
        <button type="button" data-action="toggle-sksec-collapse" data-id="${sec.id}" data-tip="${sec.collapsed?'Sektion ausklappen':'Sektion einklappen'}" class="btn w-8 h-8 sm:w-7 sm:h-7 p-0 text-xs font-black shrink-0">${sec.collapsed?'▸':'▾'}</button>
        <span draggable="true" data-drag-sksec="${sec.id}" data-tip="Ziehen zum Sortieren oder in eine andere Sektion legen" class="w-7 h-7 rounded bg-acc-soft border bdr-acc text-acc text-xs font-black cursor-grab select-none shrink-0 inline-flex items-center justify-center">⠿</span>
        ${depth>0?`<span class="text-xs font-black text-acc shrink-0" data-tip="Untersektion (Ebene ${depth+1})">↳</span>`:''}
        <input data-sksecf="${sec.id}:name" type="text" value="${esc(sec.name)}" ${colStyle} placeholder="Sektionsname (z.B. Kampffertigkeiten, Wissen)..." class="inp-line flex-1 min-w-0 text-base font-black"/>
      </div>
      <div class="flex flex-wrap items-center gap-1.5 shrink-0">
        <span class="pill cursor-default text-[11px] py-0.5 px-2 tabular">${secSkills.length}${childSecs.length?` • ${childSecs.length}📁`:''}</span>
        ${filterLbl?`<span class="tag text-[10px]">🔍 ${esc(filterLbl)}</span>`:''}
        <button type="button" data-action="add-sk-in-sec" data-sec="${sec.id}" data-tip="Neue Fertigkeit direkt in dieser Sektion anlegen" class="btn btn-pri py-1.5 sm:py-1 px-2.5 text-xs">+ Fertigkeit</button>
        <button type="button" data-action="open-sksec-menu" data-id="${sec.id}" aria-haspopup="menu" aria-expanded="false" aria-label="Sektions-Aktionen für ${esc(sec.name||'Sektion')}" data-tip="Sortieren (▲/▼), Verschachteln, Filter/Sammler, Farben &amp; Löschen" class="btn w-9 h-9 sm:w-8 sm:h-8 p-0 text-base font-black shrink-0">⋮</button>
      </div>
    </div>
    ${!sec.collapsed?((secSkills.length||childSecs.length)?`<div class="space-y-4">${secSkills.length?renderSkTable(secSkills):''}${childSecs.length?`<div class="pl-2.5 sm:pl-6 border-l-2 bdr-acc space-y-4 pt-1">${childSecs.map((cs,ci)=>renderSkSection(cs,ci,childSecs.length,depth+1)).join('')}</div>`:''}</div>`:`<div class="subcard border-dashed text-center py-5 text-xs t-mut">Klicke auf „+ Fertigkeit“ oder nutze das ⋮-Menü (Sammler / Verschieben). Auf dem Desktop klappt auch Drag &amp; Drop an ⠿.</div>`):''}
  </section>`;
}

function tplSkills(){
  const P=calcProg(), unsecSkills=S.skills.filter(sk=>!sk.sectionId||!S.skillSections.some(s=>s.id===sk.sectionId)), hasSec=S.skillSections.length>0;
  return `<section class="card space-y-3">
    <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
      <div>
        <div class="flex flex-wrap items-center gap-2">
          <h2 class="text-base sm:text-lg font-extrabold cursor-help" data-tip="Live synchron mit der Steigerungschronik.\nErstelle beliebige Sektionen (Ordner), ziehe Fertigkeiten an ⠿ hinein oder nutze das ⋮-Menü zum Sortieren &amp; Verschieben.">Fertigkeiten</h2>
          <span class="text-xs t-mut">Aktuelle Kosten: <strong id="skSummaryHdr" class="text-acc tabular">${P.skSp} SP${P.skMsp?` + ${P.skMsp} MsP`:''}</strong></span>
        </div>
      </div>
      <div class="flex flex-wrap items-center gap-2">
        ${hasSec?`<button type="button" data-action="collapse-all-sk" data-val="1" class="btn py-1 px-2.5 text-xs">▸ Alle einklappen</button><button type="button" data-action="collapse-all-sk" data-val="0" class="btn py-1 px-2.5 text-xs">▾ Alle ausklappen</button>`:''}
        ${S.skills.length>1?`<button type="button" data-action="sort-skills-az" class="btn py-1 px-2.5 text-xs">⇅ A–Z sortieren</button>`:''}
        <button type="button" data-action="add-sk-section" class="btn bg-acc-soft bdr-acc text-acc">+ Sektion</button>
      </div>
    </div>
    <form id="formAddSkill2" class="subcard p-2.5 grid grid-cols-2 lg:flex lg:flex-wrap items-center gap-2">
      <input id="skName2" type="text" placeholder="Fertigkeit (z.B. Schießen)" class="inp col-span-2 lg:flex-1 lg:min-w-[160px] w-full"/>
      <select id="skAttr2" class="inp col-span-1 lg:w-auto w-full font-bold">${skAttrOpts('PR')}</select>
      <select id="skCat2" class="inp col-span-1 lg:w-auto w-full font-semibold">${skCatOpts('fundamental')}</select>
      <select id="skRank2" class="inp col-span-1 lg:w-auto w-full font-semibold">${SK_RANKS.map(r=>`<option value="${r.r}" ${r.r===1?'selected':''}>${r.n} (+${r.b})</option>`).join('')}</select>
      <input id="skBonOvr2" type="text" inputmode="numeric" placeholder="Bonus-Ovr." data-tip="Optional: Eigener Bonus außerhalb der festen Grade +10/+15/+20/+30 (z.B. +25 oder +5)" class="inp col-span-1 lg:w-28 w-full text-center font-bold tabular"/>
      ${hasSec?`<select id="skSec2" class="inp col-span-1 lg:w-auto lg:max-w-[160px] w-full font-semibold"><option value="">📁 Ohne Sektion</option>${S.skillSections.map(s=>`<option value="${s.id}">📁 ${esc(s.name||'Sektion')}</option>`).join('')}</select>`:''}
      <button type="submit" class="btn btn-ok ${hasSec?'col-span-1':'col-span-2'} lg:w-auto w-full py-2 lg:py-1.5">+ Eintragen</button>
    </form>
    ${!hasSec?(S.skills.length?renderSkTable(S.skills):`<div class="py-6 text-center text-xs t-mut">Noch keine Fertigkeiten eingetragen (Standardgrad: Novize +10).</div>`):''}
  </section>
  ${hasSec?(()=>{const rootSkSecs=S.skillSections.filter(s=>!s.parentSectionId||!S.skillSections.some(p=>p.id===s.parentSectionId));return `<div class="space-y-5">${rootSkSecs.map((sec,sIdx)=>renderSkSection(sec,sIdx,rootSkSecs.length,0)).join('')}</div>`;})():''}
  ${hasSec?(unsecSkills.length?`<section data-sk-sec="" class="card space-y-3"><div class="flex flex-wrap items-center justify-between gap-1.5"><h3 class="text-sm font-extrabold t-mut">Fertigkeiten ohne Sektion (${unsecSkills.length})</h3><span class="hidden md:inline text-[11px] t-mut">Hierher ziehen zum Herauslösen aus einer Sektion</span></div>${renderSkTable(unsecSkills)}</section>`:(S.skills.length?`<div data-sk-sec="" class="hidden md:block subcard border-dashed text-center py-3 text-xs t-mut">Hierher ziehen, um eine Fertigkeit aus einer Sektion herauszulösen</div>`:'')):''}`;
}

function renderPwCostSelect(kind,it){
  const c=calcPwCost(it), gi=getGroupMspInfo(kind,it);
  return `<select data-pw-tier="${kind}:${it.id}" class="inp w-full font-semibold tabular ${gi.overLimit?'!border-rose-500 !text-rose-300':''}">${Object.entries(PW_TIERS).map(([k,t])=>{
    const sel=it.tier===k, warn=k==='grandios'&&gi.otherHasMsp;
    const txt=sel&&it.manualCost?`${t.full} (Manuell: ${c.sp} SP${c.msp?` + ${c.msp} MsP`:''})`:t.full;
    return `<option id="pwOpt_${it.id}_${k}" value="${k}" ${sel?'selected':''} ${warn?'style="background:#4c0519;color:#fda4af;font-weight:800"':''}>${warn?`⚠ ${txt} (1 MsP belegt)`:txt}</option>`;
  }).join('')}</select>`;
}

function buildTokBarInnerHtml(kind,it){
  const tokens=getAllParsedEffectChips(it.effects);
  return `<div class="flex flex-wrap items-center gap-1">${tokens.length?tokens.map((tk,ti)=>{
    const isAdv=tk.chipType==='adv', isDis=tk.chipType==='dis', isSt=tk.chipType==='status';
    const cls=isSt?'!border-amber-400/60 !bg-amber-500/15 !text-amber-300':isDis?'!border-rose-500/45 !bg-rose-500/15 !text-rose-300':isAdv?'!border-sky-400/50 !bg-sky-500/15 !text-sky-300':'!border-emerald-500/40 !bg-emerald-500/10 !text-emerald-300';
    const tip=isSt?`data-tip="${esc(`Statuseffekt-Baustein: Aktiviert „${tk.statusName}“ (${tk.stacks}× Stapel) erst beim Klick auf „⚡ Einsetzen“ (nicht passiv dauerhaft).`)}"`:(isAdv||isDis)?`data-tip="${esc(`Erkannter Proben-Effekt: ${fmtSign(tk.val)} ${isDis?'Nachteil(e)':'Vorteil(e)'} → ${tk.label}`)}"`:'';
    const sub=isSt?`<span class="opacity-85 text-[10px]">⚡ bei Einsetzen</span>`:(isAdv||isDis)&&!tk.isBracket?`<span class="opacity-75 text-[10px]">→ ${esc(tk.label)}</span>`:'';
    return `<span ${tip} class="tag ${cls} tabular ${tip?'cursor-help':''}"><span>${esc(tk.raw)}</span>${sub}<button type="button" data-action="rm-token" data-kind="${kind}" data-id="${it.id}" data-tidx="${ti}" class="hover:text-rose-400 font-black ml-0.5">✕</button></span>`;
  }).join(''):`<span class="text-[11px] t-mut">Keine Werte-/Proben-Bausteine erkannt (z.B. [+5 LP-Max], [Status: Gestärkt], [+4 Vorteile (Trefferwürfe)], +2 Vorteil auf Parieren).</span>`}</div>
  <button type="button" data-action="toggle-apply-mods" data-kind="${kind}" data-id="${it.id}" data-tip="Verrechnet alle Werte- &amp; Vor-/Nachteils-Effekte dieser Karte live mit Bogen und Würfelassistent" class="btn py-1 px-2.5 text-[11px] ${it.applyMods?'btn-ok':'opacity-80'}">${it.applyMods?'✓ Auf Bogen aktiv':'⚡ Auf Bogen anwenden'}</button>`;
}

function buildDynPreviewBarInnerHtml(it,M=calcActiveMods()){
  const found=[
    ...extractDynamicFormulas(it?.desc),
    ...extractDynamicFormulas(it?.effects),
    ...extractDynamicFormulas(it?.rules)
  ];
  if(!found.length) return '';
  const seen=new Set(), chips=[];
  found.forEach(f=>{
    const res=evalDynamicFormula(f.expr,M);
    const key=(res.rawExpr||f.raw).toLowerCase();
    if(seen.has(key)) return;
    seen.add(key);
    if(res.ok){
      const tip=`Formel: ${res.rawExpr}\nRechnung: ${res.breakdown}`;
      chips.push(`<span class="dyn-val-pill dyn-prev-chip tabular" data-tip="${esc(tip).replace(/\n/g,'&#10;')}">🧮 ${esc(res.rawExpr)} = <strong>${esc(res.formatted)}</strong></span>`);
    }else{
      const tip=`Ungültige Formel: ${res.rawExpr||f.raw}\nFehler: ${res.error||'Syntaxfehler'}`;
      chips.push(`<span class="dyn-val-pill dyn-val-err dyn-prev-chip" data-tip="${esc(tip).replace(/\n/g,'&#10;')}">⚠ ${esc(res.rawExpr||f.raw)}</span>`);
    }
  });
  return chips.length?`<span class="font-extrabold text-acc shrink-0">Live-Werte:</span>${chips.join('')}`:'';
}
function updatePwDynPreviewDOM(kind,id,M=calcActiveMods()){
  const el=$(`dynPrev_${id}`);
  if(!el) return;
  const it=findPwItem(kind,id);
  const inner=it?buildDynPreviewBarInnerHtml(it,M):'';
  el.innerHTML=inner;
  el.classList.toggle('hidden',!inner);
}
function refreshTab3DynamicDOM(M=calcActiveMods()){
  document.querySelectorAll('[data-dyn-prev]').forEach(el=>{
    const [kind,id]=String(el.dataset.dynPrev||'').split(':');
    if(!kind||!id) return;
    const it=findPwItem(kind,id);
    const inner=it?buildDynPreviewBarInnerHtml(it,M):'';
    el.innerHTML=inner;
    el.classList.toggle('hidden',!inner);
  });
  document.querySelectorAll('[data-pw-view-rtf]').forEach(el=>{
    const [kind,id,field]=String(el.dataset.pwViewRtf||'').split(':');
    if(!kind||!id||!field) return;
    const it=findPwItem(kind,id);
    if(!it) return;
    el.innerHTML=renderDynamicRtfHtml(it[field],M);
  });
  document.querySelectorAll('[data-action="ins-token"][data-bld-mode="dyn"]').forEach(el=>{
    if(el.dataset.kind&&el.dataset.id) updatePwBuilderChipDOM(el.dataset.kind,el.dataset.id,M);
  });
}

function updatePwBuilderChipDOM(kind,id,M=null){
  const it=findPwItem(kind,id); if(!it) return '';
  const isDyn=it.bldMode==='dyn';
  const dynSpec=isDyn?buildDynFormulaSpec(it,M||calcActiveMods()):null;
  const tok=isDyn?(dynSpec.evalRes.ok?dynSpec.token:''):getPwBuilderToken(it);
  const ch=$(`chip_${id}`);
  if(ch){
    ch.dataset.dragTok=tok;
    ch.setAttribute('draggable',tok?'true':'false');
    if(isDyn){
      ch.textContent=dynSpec.evalRes.ok?`⠿ ${dynSpec.token} (= ${dynSpec.evalRes.formatted})`:`⚠ ${dynSpec.evalRes.error||'Ungültige Formel'}`;
      ch.dataset.tip=dynSpec.evalRes.ok
        ?`Formel: ${dynSpec.expr}\nRechnung: ${dynSpec.evalRes.breakdown}\nIn Beschreibung, Effekte oder Zusatzinfos ziehen oder Einfüge-Button klicken.`
        :`Ungültige Formel: ${dynSpec.expr}\nFehler: ${dynSpec.evalRes.error||'Syntaxfehler'}`;
    }else{
      ch.textContent=tok?`⠿ ${tok}`:'⚠ Erst Fertigkeit in Tab 2 anlegen';
      ch.dataset.tip=tok?'Ins Effektfeld ziehen oder „+ Baustein“ klicken':'Erst mindestens eine Fertigkeit in Tab 2 anlegen';
    }
    ch.classList.toggle('cursor-grab',Boolean(tok));
    ch.classList.toggle('opacity-60',!tok);
    ch.classList.toggle('cursor-not-allowed',!tok);
  }
  const btn=$(`insTok_${id}`)||document.querySelector(`[data-action="ins-token"][data-kind="${kind}"][data-id="${id}"]`);
  if(btn){
    btn.disabled=!tok;
    if(isDyn){
      btn.textContent=dynSpec.evalRes.ok?`+ ${dynSpec.token} (= ${dynSpec.evalRes.formatted})`:`⚠ ${dynSpec.evalRes.error||'Ungültige Formel'}`;
      btn.dataset.tip=dynSpec.evalRes.ok
        ?`Rechnung: ${dynSpec.evalRes.breakdown}\nFügt ${dynSpec.token} an der letzten Cursor-Position (Beschreibung/Effekte/Zusatzinfos) oder im gewählten Zielfeld ein.\nBeispiel: „Die Reichweite beträgt ${dynSpec.token} Meter.“`
        :`Ungültige Formel: ${dynSpec.expr}\nFehler: ${dynSpec.evalRes.error||'Syntaxfehler'}`;
    }else{
      btn.textContent='+ Baustein';
      btn.removeAttribute('data-tip');
    }
  }
  if(isDyn){
    const presetSel=document.querySelector(`[data-pw-dyn-preset="${kind}:${id}"]`);
    if(presetSel) presetSel.value=getDynPresetSelectVal(it.bldDynFactor);
  }
  return tok;
}

function openPwCardSecPicker(anchorEl,kindOrPwId,maybeId){
  const isAug=kindOrPwId==='augment';
  const kind=isAug?'augment':'power';
  const id=maybeId!==undefined?maybeId:kindOrPwId;
  const it=findPwItem(kind,id); if(!it) return;
  if(isAug&&it.parentPowerId) return;
  const curSecId=getValidPwSecId(it.sectionId);
  const flatSecs=getPwSecOptionsFlat();
  const items=[
    {icon:'📁',label:'Keine Sektion / Allgemein',active:!curSecId,onClick:()=>{it.sectionId='';renderMain();save();}},
    ...flatSecs.map(fs=>({
      icon:'📁',
      label:`${'↳ '.repeat(Math.min(3,fs.depth))}${fs.name}`,
      active:curSecId===fs.id,
      onClick:()=>{
        it.sectionId=fs.id;
        const secObj=S.powerSections.find(s=>s.id===fs.id);
        if(secObj) secObj.collapsed=false;
        renderMain();save();
      }
    }))
  ];
  openCtxMenu({key:`pw-sec-picker:${kind}:${id}`,title:'Sektion zuordnen',anchorEl,align:'right',minWidth:235,items});
}
function openAugParentPicker(anchorEl,augId){
  const ag=S.augments.find(a=>a.id===augId); if(!ag) return;
  const items=[
    {icon:'🔓',label:'Freies Augment (keine Kraft)',active:!ag.parentPowerId,onClick:()=>{unlinkAugFromPower(ag);renderMain();save();}},
    ...S.powers.map(p=>{
      const cnt=getLinkedAugs(p.id).length, full=cnt>=3&&ag.parentPowerId!==p.id;
      return {
        icon:'✨',
        label:p.name||'Unbenannte Kraft',
        badge:`${cnt}/3`,
        active:ag.parentPowerId===p.id,
        disabled:full,
        onClick:()=>{
          if(getLinkedAugs(p.id).length>=3&&ag.parentPowerId!==p.id){toast('Maximal 3 Augmente pro Kraft!');return;}
          linkAugToPower(ag,p.id);renderMain();save();
        }
      };
    })
  ];
  openCtxMenu({key:`aug-parent-picker:${augId}`,title:'Eltern-Kraft zuordnen',anchorEl,align:'right',minWidth:240,items});
}
function getPwSecSiblings(sec){
  const pId=sec?.parentSectionId&&S.powerSections.some(p=>p.id===sec.parentSectionId)?sec.parentSectionId:'';
  return S.powerSections.filter(s=>(s.parentSectionId&&S.powerSections.some(p=>p.id===s.parentSectionId)?s.parentSectionId:'')===pId);
}
function movePwSecOrder(secId,dir){
  const sec=S.powerSections.find(s=>s.id===secId); if(!sec) return false;
  const sibs=getPwSecSiblings(sec), si=sibs.findIndex(s=>s.id===sec.id), tSib=sibs[si+Number(dir)];
  if(!tSib) return false;
  const i1=S.powerSections.indexOf(sec), i2=S.powerSections.indexOf(tSib);
  S.powerSections[i1]=tSib; S.powerSections[i2]=sec;
  save(); renderMain(); return true;
}
function getPwPowerSiblings(p){
  const secId=p?.sectionId&&S.powerSections.some(s=>s.id===p.sectionId)?p.sectionId:'';
  return S.powers.filter(x=>(x.sectionId&&S.powerSections.some(s=>s.id===x.sectionId)?x.sectionId:'')===secId);
}
function movePwOrder(pwId,dir){
  const p=S.powers.find(x=>x.id===pwId); if(!p) return false;
  const sibs=getPwPowerSiblings(p), si=sibs.findIndex(x=>x.id===p.id), tSib=sibs[si+Number(dir)];
  if(!tSib) return false;
  const i1=S.powers.indexOf(p), i2=S.powers.indexOf(tSib);
  S.powers[i1]=tSib; S.powers[i2]=p;
  save(); renderMain(); return true;
}
function getPwAugSiblings(ag){
  const hasPar=Boolean(ag?.parentPowerId&&S.powers.some(p=>p.id===ag.parentPowerId));
  if(hasPar) return getLinkedAugs(ag.parentPowerId);
  const secId=getValidPwSecId(ag?.sectionId);
  return secId?getUnlinkedAugsInSec(secId):getRootUnlinkedAugs();
}
function moveAugOrder(augId,dir){
  const ag=S.augments.find(a=>a.id===augId); if(!ag) return false;
  const sibs=getPwAugSiblings(ag), si=sibs.findIndex(x=>x.id===ag.id), tSib=sibs[si+Number(dir)];
  if(!tSib) return false;
  const i1=S.augments.indexOf(ag), i2=S.augments.indexOf(tSib);
  S.augments[i1]=tSib; S.augments[i2]=ag;
  save(); renderMain(); return true;
}
function openPwCardMenu(anchorEl,kind,id,forceOpen=false){
  const isAug=kind==='augment', it=findPwItem(kind,id); if(!it) return;
  const sibs=isAug?getPwAugSiblings(it):getPwPowerSiblings(it);
  const idx=sibs.findIndex(x=>x.id===id);
  const c=calcPwCost(it), isGift=Boolean(it.manualCost&&c.sp===0&&c.msp===0);
  const isDelConfirm=UI.confirmDelId===id;
  const dispName=String(it.name||'').trim()||(isAug?'Augment':'Kraft');
  const items=[
    {type:'label',label:'Reihenfolge'},
    {
      icon:'▲',label:'Nach oben',disabled:idx<=0,keepOpen:true,
      onClick:()=>{
        const moved=isAug?moveAugOrder(id,-1):movePwOrder(id,-1);
        if(moved){
          const fresh=findVisibleBtn(`[data-action="open-pw-card-menu"][data-kind="${kind}"][data-id="${id}"]`);
          openPwCardMenu(fresh||anchorEl,kind,id,true);
        }
      }
    },
    {
      icon:'▼',label:'Nach unten',disabled:idx<0||idx>=sibs.length-1,keepOpen:true,
      onClick:()=>{
        const moved=isAug?moveAugOrder(id,1):movePwOrder(id,1);
        if(moved){
          const fresh=findVisibleBtn(`[data-action="open-pw-card-menu"][data-kind="${kind}"][data-id="${id}"]`);
          openPwCardMenu(fresh||anchorEl,kind,id,true);
        }
      }
    },
    {sep:true}
  ];
  if(!isAug&&S.powerSections.length){
    const curSec=S.powerSections.find(s=>s.id===it.sectionId);
    items.push({type:'label',label:'Zuordnung'});
    items.push({
      icon:'📁',
      label:'Sektion zuordnen',
      badge:curSec?(curSec.name||'Sektion'):'Keine Sektion',
      onClick:()=>{openPwCardSecPicker(anchorEl,'power',id);}
    });
    items.push({sep:true});
  }else if(isAug){
    const curPar=it.parentPowerId?S.powers.find(p=>p.id===it.parentPowerId):null;
    items.push({type:'label',label:'Zuordnung'});
    items.push({
      icon:'🔗',
      label:'Eltern-Kraft zuordnen',
      badge:curPar?(curPar.name||'Kraft'):'Frei',
      onClick:()=>{openAugParentPicker(anchorEl,id);}
    });
    if(curPar){
      items.push({icon:'🔓',label:'Aus Kraft-Slot lösen',action:'unlink-aug',dataset:{id}});
    }else if(S.powerSections.length){
      const curSec=S.powerSections.find(s=>s.id===it.sectionId);
      items.push({
        icon:'📁',
        label:'Sektion zuordnen',
        badge:curSec?(curSec.name||'Sektion'):'Keine Sektion',
        onClick:()=>{openPwCardSecPicker(anchorEl,'augment',id);}
      });
    }
    items.push({sep:true});
  }
  items.push({type:'label',label:'Darstellung & Kosten'});
  items.push({icon:'🎨',label:'Textfarbe (Name)',badge:it.color?'●':'',action:'open-pw-color',dataset:{kind,id,cmode:'text'}});
  items.push({icon:'🪟',label:'Fensterfarbe (Karte)',badge:it.bgColor?'●':'',action:'open-pw-color',dataset:{kind,id,cmode:'bg'}});
  items.push({
    icon:'✎',
    label:(it.showManual||it.manualCost)?'Manuelle Kosten ausblenden':'Manuelle Kosten einblenden',
    active:Boolean(it.showManual||it.manualCost),
    badge:it.manualCost?`${c.sp} SP${c.msp?`+${c.msp}M`:''}`:'',
    action:'toggle-pw-man',
    dataset:{kind,id}
  });
  items.push({
    icon:'🎁',
    label:isGift?'Geschenkt aktiv (Standardkosten)':'Als geschenkt setzen (0 SP)',
    active:isGift,
    action:'gift-pw',
    dataset:{kind,id}
  });
  items.push({icon:it.collapsed?'▾':'▸',label:it.collapsed?'Karte ausklappen':'Karte einklappen',action:'toggle-pw-collapse',dataset:{kind,id}});
  items.push({sep:true});
  items.push({type:'label',label:'Aktionen'});
  items.push({icon:'📋',label:'Duplizieren',action:'dup-pw',dataset:{kind,id}});
  items.push({icon:'📤',label:'Als .json exportieren',action:'export-pw-item',dataset:{kind,id}});
  items.push({sep:true});
  if(isDelConfirm){
    items.push({
      icon:'⚠️',
      label:'Wirklich entfernen? (2/2)',
      sub:`„${dispName}“ dauerhaft löschen`,
      danger:true,
      action:'confirm-del-pw',
      dataset:{kind,id}
    });
    items.push({
      icon:'↩️',
      label:'Abbrechen',
      keepOpen:true,
      onClick:()=>{UI.confirmDelId=null;openPwCardMenu(anchorEl,kind,id,true);}
    });
  }else{
    items.push({
      icon:'🗑️',
      label:'Löschen',
      danger:true,
      keepOpen:true,
      onClick:()=>{UI.confirmDelId=id;openPwCardMenu(anchorEl,kind,id,true);}
    });
  }
  openCtxMenu({
    key:`pw-card-menu:${kind}:${id}`,
    title:dispName,
    anchorEl,
    align:'right',
    minWidth:245,
    forceOpen,
    items,
    onClose:()=>{if(UI.confirmDelId===id)UI.confirmDelId=null;}
  });
}

function renderPwCard(kind,it,idx,listLen,opts={}){
  const isAug=kind==='augment', c=calcPwCost(it), gi=getGroupMspInfo(kind,it), colStyle=it.color?`style="color:${esc(it.color)}"`:'', winStyle=cardColorStyle(it);
  const linkedParent=isAug&&it.parentPowerId?S.powers.find(p=>p.id===it.parentPowerId):null;
  const showParentBadge=Boolean(opts.showParentBadge&&linkedParent);
  const viaParentPower=Boolean(opts.viaParentPower&&isAug);
  const parentBadgeHtml=showParentBadge?`<span data-tip="${esc(`Verknüpft mit Kraft „${linkedParent.name||'Unbenannte Kraft'}“ (Zuordnung bleibt beim Filtern unverändert)`)}" class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md border border-amber-400/60 bg-amber-500/20 text-amber-300 text-[11px] font-extrabold shrink-0 max-w-full sm:max-w-[240px] truncate">↳ Kraft: ${esc(linkedParent.name||'Unbenannte Kraft')}</span>`:'';
  const viaParentBadgeHtml=viaParentPower?`<span data-tip="Mitangezeigt, weil die übergeordnete Hauptkraft dem Filter entspricht (erfüllt den Filter selbst nicht direkt)" class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md border border-amber-500/35 bg-amber-500/10 text-amber-300/85 text-[10px] font-bold shrink-0">↳ an Kraft gebunden</span>`:'';
  const curArtTipHdr=getPwTermTip(it.art);
  const hdrLeft=`<div class="flex flex-wrap sm:flex-nowrap items-center gap-1.5 sm:gap-2 flex-1 min-w-0 w-full sm:w-auto sm:min-w-[200px]"><button type="button" data-action="toggle-pw-collapse" data-kind="${kind}" data-id="${it.id}" data-tip="${it.collapsed?'Ausklappen':'Einklappen (nur Titel anzeigen)'}" class="btn w-8 h-8 sm:w-7 sm:h-7 p-0 text-xs font-black shrink-0">${it.collapsed?'▸':'▾'}</button>
    ${!isAug?`<span draggable="true" data-drag-pw="${it.id}" data-tip="Ziehen zum Verschieben der Kraft (inkl. gebundener Augmente)" class="w-7 h-7 rounded bg-acc-soft border bdr-acc text-acc text-xs font-black cursor-grab select-none shrink-0 inline-flex items-center justify-center">⠿</span>`:`<span draggable="true" data-drag-aug="${it.id}" data-tip="Ziehen zum Sortieren, in eine Sektion verschieben oder auf eine Kraft verknüpfen" class="w-7 h-7 rounded text-xs font-black bg-amber-500/15 text-amber-400 border border-amber-500/40 cursor-grab select-none shrink-0 inline-flex items-center justify-center">⠿</span>`}
    <input data-pwf="${kind}:${it.id}:name" type="text" value="${esc(it.name)}" ${colStyle} placeholder="Name ${isAug?'des Augments':'der Kraft'}..." class="inp-line flex-1 min-w-0 sm:min-w-[140px] ${it.collapsed?'text-sm':'text-base'} font-extrabold"/>
    ${parentBadgeHtml}${viaParentBadgeHtml}</div>`;
  const stToksInCard=parseStatusTokens(it.effects), uCosts=Array.isArray(it.useCosts)?it.useCosts:(it.useRes&&toInt(it.useAmt,0)>0?[{res:it.useRes,amt:toInt(it.useAmt,0)}]:[]), costSummary=formatPwUseCosts(it), hasUseCost=Boolean(costSummary), canSpendPw=hasUseCost||stToksInCard.length>0;
  const reservableCosts=getReservablePwCosts(it), isReserved=Boolean(it.reserved), activeResCosts=(isReserved&&Array.isArray(it.reservedCosts)&&it.reservedCosts.length)?it.reservedCosts:reservableCosts, resTxt=activeResCosts.map(rc=>`${rc.amt} ${getResLabel(rc.res)}`).join(' + ');
  const resChipHtml=isReserved?`<button type="button" data-action="toggle-reserve-pw" data-kind="${kind}" data-id="${it.id}" data-tip="Reservierung aufheben (verbrauchte Kosten werden nicht wiederhergestellt)" class="btn py-1 sm:py-0.5 px-2 text-[11px] bg-amber-500/25 border-amber-400 text-amber-300 font-black tabular shrink-0">🔒 ${esc(resTxt)} ✕</button>`:(it.collapsed&&reservableCosts.length>0?`<button type="button" data-action="toggle-reserve-pw" data-kind="${kind}" data-id="${it.id}" data-tip="Zieht reservierbare Einsatzkosten sofort ab und sperrt den Betrag vom Maximum (${esc(resTxt)})" class="btn py-1 sm:py-0.5 px-2 text-[11px] shrink-0">🔒</button>`:'');
  const tKey=getPwTierKey(it,isAug), tMeta=PW_TIERS[tKey]||PW_TIERS.marginal, tBadgeCls=PW_TIER_BADGE_CLS[tKey]||PW_TIER_BADGE_CLS.marginal;
  const tierBadgeHtml=`<span class="inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-extrabold border shrink-0 ${tBadgeCls}" data-tip="${esc(tMeta.full)}">${esc(tMeta.l)}</span>`;
  const artBadgeHtml=it.art?`<span class="tag text-[10px] py-0.5 px-1.5 shrink-0 ${curArtTipHdr?'cursor-help':''}" ${curArtTipHdr?`data-tip="${esc(curArtTipHdr)}"`:''}>${esc(it.art)}</span>`:'';
  const costPillHtml=`<span class="pill cursor-default text-[11px] py-0.5 px-2 tabular shrink-0">${c.sp} SP${c.msp?` + ${c.msp} MsP`:''}</span>`;
  const spendBtnHtml=canSpendPw?`<button type="button" data-action="spend-pw" data-kind="${kind}" data-id="${it.id}" data-tip="${hasUseCost?`Einsatzkosten (${esc(costSummary)}) abziehen`:'Effekte / Status aktivieren'}" class="btn btn-pri py-1 sm:py-0.5 px-2 text-[11px] shrink-0">⚡ ${hasUseCost?esc(costSummary):'Einsetzen'}</button>`:'';
  const quickDoneBtnHtml=opts.isQuickEdit?`<button type="button" data-action="close-pw-quick-edit" data-kind="${kind}" data-id="${it.id}" data-tip="Einzelbearbeitung beenden und zurück in die kompakte Ansicht klappen" class="btn btn-ok py-1 sm:py-0.5 px-2.5 text-[11px] font-extrabold shrink-0">✓ Fertig</button>`:'';
  const hdrRight=`<div class="flex flex-wrap items-center gap-1.5 shrink-0 max-w-full">
    ${quickDoneBtnHtml}${tierBadgeHtml}${artBadgeHtml}${costPillHtml}${spendBtnHtml}${resChipHtml}
    ${listLen>1?`<button type="button" data-action="${isAug?'move-aug':'move-pw'}" data-id="${it.id}" data-dir="-1" ${idx===0?'disabled':''} data-tip="Nach oben" class="hidden md:inline-flex btn py-1 px-2 text-xs">▲</button><button type="button" data-action="${isAug?'move-aug':'move-pw'}" data-id="${it.id}" data-dir="1" ${idx===listLen-1?'disabled':''} data-tip="Nach unten" class="hidden md:inline-flex btn py-1 px-2 text-xs">▼</button>`:''}
    <button type="button" data-action="open-pw-card-menu" data-kind="${kind}" data-id="${it.id}" aria-haspopup="menu" aria-expanded="false" aria-label="Aktionen für ${esc(it.name||(isAug?'Augment':'Kraft'))}" data-tip="Farben, Zuordnung, Duplizieren, Export, Kosten &amp; Löschen" class="btn w-9 h-9 sm:w-8 sm:h-8 p-0 text-base font-black shrink-0">⋮</button>
  </div>`;

  if(it.collapsed){
    return `<div ${isAug?`data-aug-card="${it.id}"`:""} class="card py-2 px-3 ${isAug?'border-amber-500/45 max-w-4xl':''}${viaParentPower?' opacity-75 hover:opacity-100 transition-opacity':''}" ${winStyle}><div class="flex flex-wrap items-center justify-between gap-2">${hdrLeft}${hdrRight}</div></div>`;
  }

  const statGroups=Array.isArray(opts.statGroups)?opts.statGroups:getStatGroups();
  const cardM=opts.M||calcActiveMods();
  const isSkBld=it.bldMode==='skill', isDynBld=it.bldMode==='dyn';
  const sortedSkills=Array.isArray(opts.sortedSkills)?opts.sortedSkills:[...(S.skills||[])].filter(s=>s&&String(s.name||'').trim()).sort((a,b)=>String(a.name).trim().localeCompare(String(b.name).trim(),'de'));
  const selSkId=(it.bldSkId&&sortedSkills.some(s=>s.id===it.bldSkId))?it.bldSkId:(sortedSkills[0]?.id||'');
  const dynGroups=isDynBld?getDynVarGroups():null;
  const dynSpec=isDynBld?buildDynFormulaSpec(it,cardM):null;
  const dynPresetVal=isDynBld?getDynPresetSelectVal(it.bldDynFactor):'/2';
  const dynTargetVal=['desc','effects','rules'].includes(it.bldDynTarget)?it.bldDynTarget:'desc';
  const bldToken=isDynBld?(dynSpec.evalRes.ok?dynSpec.token:''):getPwBuilderToken(it,sortedSkills,cardM);
  const hD=it.boxH?.desc>0?`style="height:${it.boxH.desc}px"`:'', hE=it.boxH?.effects>0?`style="height:${it.boxH.effects}px"`:'', hR=it.boxH?.rules>0?`style="height:${it.boxH.rules}px"`:'';
  const itemActionSubs=DEF_ACTION_SUBS.filter(a=>Array.isArray(it.actionSubs)&&it.actionSubs.includes(a));
  const itemTags=Array.isArray(it.tags)?it.tags.filter(t=>String(t||'').trim()&&!isReservedPwTerm(t)):[];
  const availPwTags=sortAlpha((S.pwTagList||DEF_PW_TAGS).filter(t=>!isReservedPwTerm(t)&&!itemTags.some(x=>x.toLowerCase()===t.toLowerCase())));
  const artDdKey=`art:${kind}:${it.id}`, asubDdKey=`asub:${kind}:${it.id}`;
  const artOpen=UI.openPwMenu===artDdKey, asubOpen=UI.openPwMenu===asubDdKey;
  const curArtTip=getPwTermTip(it.art);
  const linked=!isAug?getLinkedAugs(it.id):[], unlinked=!isAug?getUnlinkedAugs():[];
  const canChooseSec=(!isAug||!linkedParent)&&S.powerSections.length>0;
  const flatSecs=canChooseSec?(Array.isArray(opts.flatSecs)?opts.flatSecs:getPwSecOptionsFlat()):[];
  const curSecId=canChooseSec?getValidPwSecId(it.sectionId):'';
  const secSelectBarHtml=canChooseSec?`<div class="flex flex-wrap items-center gap-2 text-xs">
      <label class="font-bold t-mut shrink-0">📁 Sektion</label>
      <select ${isAug?`data-aug-sec-sel="${it.id}"`:`data-pw-sec-sel="${it.id}"`} class="inp py-1 px-2 text-xs font-semibold flex-1 min-w-0 sm:max-w-xs">
        <option value="">📁 Keine Sektion / Allgemein</option>
        ${flatSecs.map(fs=>`<option value="${esc(fs.id)}" ${curSecId===fs.id?'selected':''}>${'↳ '.repeat(Math.min(3,fs.depth))}📁 ${esc(fs.name)}</option>`).join('')}
      </select>
    </div>`:'';
  return `<div ${isAug?`data-aug-card="${it.id}"`:""} class="card space-y-3 ${isAug?'border-amber-500/45':''}${viaParentPower?' opacity-75 hover:opacity-100 transition-opacity':''}" ${winStyle}>
    <div class="flex flex-wrap items-center justify-between gap-2 border-b bdr-line pb-2">${hdrLeft}${hdrRight}</div>
    ${secSelectBarHtml}
    <div class="grid grid-cols-1 md:grid-cols-12 gap-2.5 text-xs">
      <div class="md:col-span-4"><label class="font-bold t-mut block mb-1">Voraussetzungen</label><input data-pwf="${kind}:${it.id}:req" type="text" value="${esc(it.req)}" placeholder="z.B. ST 30..." class="inp w-full"/></div>
      <div class="md:col-span-4">
        <div class="flex items-center justify-between mb-1"><label class="font-bold t-mut flex items-center gap-1.5"><span>Lernkosten</span>${gi.overLimit?`<span class="text-[10px] font-extrabold text-rose-400" data-tip="Mehr als 1 MsP in dieser Kraft-Gruppe vergeben!">⚠ &gt;1 MsP</span>`:''}</label><div class="flex items-center gap-1.5"><button type="button" data-action="gift-pw" data-kind="${kind}" data-id="${it.id}" data-tip="${it.manualCost&&c.sp===0&&c.msp===0?'Geschenkt aktiv (0 SP) – Klicken für Standardkosten':'Als geschenkt setzen (0 SP / 0 MsP) – Toggle'}" class="btn py-0.5 px-1.5 text-[10px] ${it.manualCost&&c.sp===0&&c.msp===0?'btn-ok':''}">🎁</button><button type="button" data-action="toggle-pw-man" data-kind="${kind}" data-id="${it.id}" class="text-[10px] font-extrabold ${it.manualCost||it.showManual?'text-amber-400':'text-acc'} hover:underline">✎ Manuell${it.manualCost?' ★':''}</button></div></div>
        ${renderPwCostSelect(kind,it)}
        ${it.showManual||it.manualCost?`<div class="mt-1.5 p-2 rounded-lg border bdr-line flex items-center gap-2 tabular" style="background:var(--surf)"><label class="flex items-center gap-1 text-[11px] font-bold flex-1">SP <input data-pwcost="${kind}:${it.id}:sp" type="text" inputmode="numeric" value="${c.sp}" class="inp w-full text-center font-black py-0.5 px-1"/></label><label class="flex items-center gap-1 text-[11px] font-bold text-amber-500 flex-1">MsP <input data-pwcost="${kind}:${it.id}:msp" type="text" inputmode="numeric" value="${c.msp}" class="inp w-full text-center font-black py-0.5 px-1"/></label></div>`:''}
      </div>
      <div class="md:col-span-4">
        <div class="flex items-center justify-between mb-1"><label class="font-bold t-mut" data-tip="Zieht alle hinterlegten Ressourcenkosten per Klick auf „⚡ Einsetzen“ gleichzeitig oben vom Bogen ab.">Einsatzkosten</label><button type="button" data-action="open-list" data-ltype="useRes" data-tip="Einsatzkosten-Ressourcen anpassen" class="text-[11px] text-acc">⚙️</button></div>
        <div class="flex flex-wrap items-center gap-1.5">
          ${uCosts.map((uc,cIdx)=>{
            const rCol=getSecCol(uc.res)||'var(--acc)';
            return `<span class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-lg border bg-black/25 tabular" style="border-color:color-mix(in srgb,${esc(rCol)} 55%,var(--bdr))">
              <input data-pw-ucost-amt="${kind}:${it.id}:${cIdx}" type="text" inputmode="numeric" value="${esc(uc.amt)}" class="inp !py-0 !px-1 w-10 h-6 text-center font-black text-xs tabular"/>
              <span class="text-xs font-extrabold px-0.5" style="color:${esc(rCol)}">${esc(getResLabel(uc.res))}</span>
              <button type="button" data-action="rm-pw-ucost" data-kind="${kind}" data-id="${it.id}" data-cidx="${cIdx}" data-tip="Kosten-Ressource entfernen" class="t-mut hover:text-rose-400 font-black text-xs px-0.5">✕</button>
            </span>`;
          }).join('')}
          <select data-add-pw-ucost="${kind}:${it.id}" class="inp py-1 px-2 text-xs font-bold ${uCosts.length?'w-auto max-w-full':'flex-1 min-w-0 sm:min-w-[130px] max-w-full'}">
            <option value="">+ Kosten-Ressource...</option>
            ${getAvailableUseResources().map(r=>`<option value="${esc(r.res)}">${esc(r.label)}</option>`).join('')}
          </select>
          <button type="button" data-action="spend-pw" data-kind="${kind}" data-id="${it.id}" ${!canSpendPw?'disabled':''} class="btn btn-pri py-1.5 px-2.5 text-xs shrink-0">⚡ ${hasUseCost?esc(costSummary):'Einsetzen'}</button>
          <button type="button" data-action="toggle-reserve-pw" data-kind="${kind}" data-id="${it.id}" ${!isReserved&&reservableCosts.length===0?'disabled':''} data-tip="${isReserved?'Reservierung aufheben (verbrauchte Kosten werden nicht wiederhergestellt)':'Zieht reservierbare Einsatzkosten sofort ab und sperrt den Betrag vom Maximum'}" class="btn py-1.5 px-2.5 text-xs shrink-0 ${isReserved?'bg-amber-500/25 border-amber-400 text-amber-300 font-black':''}">${isReserved?`🔒 Reserviert (${esc(resTxt)}) • Aufheben`:'🔒 Reservieren'}</button>
        </div>
      </div>
    </div>
    <div class="grid grid-cols-1 md:grid-cols-12 gap-2.5 text-xs subcard p-2.5">
      <div class="md:col-span-4 space-y-1">
        <label class="font-bold t-mut block">Hauptaktionsart</label>
        <div class="pw-dd-wrap">
          <button type="button" data-action="toggle-pw-dd" data-ddkey="${artDdKey}" ${curArtTip?`data-tip="${esc(curArtTip)}"`:''} class="inp w-full font-bold flex items-center justify-between gap-2 text-left cursor-pointer ${artOpen?'bdr-acc':''}">
            <span class="truncate ${it.art?'':'t-mut font-semibold'}">${it.art?esc(it.art):'— Keine Hauptaktionsart —'}</span>
            <span class="text-[10px] t-mut shrink-0">${artOpen?'▴':'▾'}</span>
          </button>
          ${artOpen?`<div class="pw-dd-menu">
            <button type="button" class="pw-dd-item ${!it.art?'on':''}" data-action="set-pw-main-art" data-kind="${kind}" data-id="${it.id}" data-val=""><span>— Keine —</span>${!it.art?'<span>✓</span>':''}</button>
            ${DEF_MAIN_ARTS.map(a=>`<button type="button" class="pw-dd-item ${it.art===a?'on':''}" data-action="set-pw-main-art" data-kind="${kind}" data-id="${it.id}" data-val="${esc(a)}" data-tip="${esc(getPwTermTip(a))}"><span>${esc(a)}</span>${it.art===a?'<span>✓</span>':''}</button>`).join('')}
          </div>`:''}
        </div>
      </div>
      <div class="md:col-span-4 space-y-1">
        <label class="font-bold t-mut block">Aktionsunterarten</label>
        <div class="flex flex-wrap items-center gap-1.5">
          ${itemActionSubs.map(asub=>`<span class="tag cursor-help" data-tip="${esc(getPwTermTip(asub))}"><span>${esc(asub)}</span><button type="button" data-action="toggle-pw-asub" data-kind="${kind}" data-id="${it.id}" data-val="${esc(asub)}" class="hover:text-rose-400 font-black ml-0.5">✕</button></span>`).join('')}
          <div class="pw-dd-wrap ${itemActionSubs.length?'':'w-full'}">
            <button type="button" data-action="toggle-pw-dd" data-ddkey="${asubDdKey}" class="inp py-1 px-2 text-xs font-bold flex items-center justify-between gap-1.5 cursor-pointer ${itemActionSubs.length?'':'w-full'} ${asubOpen?'bdr-acc':''}">
              <span>+ Aktionsunterart</span>
              <span class="text-[10px] t-mut shrink-0">${asubOpen?'▴':'▾'}</span>
            </button>
            ${asubOpen?`<div class="pw-dd-menu">
              ${DEF_ACTION_SUBS.map(asub=>{const on=itemActionSubs.includes(asub);return `<button type="button" class="pw-dd-item ${on?'on':''}" data-action="toggle-pw-asub" data-kind="${kind}" data-id="${it.id}" data-val="${esc(asub)}" data-tip="${esc(getPwTermTip(asub))}"><span class="inline-flex items-center gap-1.5"><span>${on?'☑':'☐'}</span><span>${esc(asub)}</span></span></button>`;}).join('')}
            </div>`:''}
          </div>
        </div>
      </div>
      <div class="md:col-span-4 space-y-1">
        <div class="flex items-center justify-between"><label class="font-bold t-mut">Tags</label><button type="button" data-action="open-list" data-ltype="pwTag" data-tip="Tag-Liste verwalten (hinzufügen / entfernen)" class="text-[11px]">⚙️</button></div>
        ${itemTags.length?`<div class="flex flex-wrap items-center gap-1.5 mb-1">${itemTags.map(tg=>{const tTip=getPwTermTip(tg);return `<span class="tag ${tTip?'cursor-help':''}" ${tTip?`data-tip="${esc(tTip)}"`:''}><span>${esc(tg)}</span><button type="button" data-action="rm-pw-tag" data-kind="${kind}" data-id="${it.id}" data-val="${esc(tg)}" class="hover:text-rose-400 font-black ml-0.5">✕</button></span>`;}).join('')}</div>`:''}
        <div class="flex flex-wrap items-center gap-1">
          <select data-add-pw-tag="${kind}:${it.id}" class="inp py-1 px-2 text-xs font-semibold min-w-[115px] max-w-full flex-1">
            <option value="">+ Tag wählen…</option>
            ${availPwTags.map(tg=>`<option value="${esc(tg)}">${esc(tg)}</option>`).join('')}
          </select>
          <input data-new-pw-tag-inp="${kind}:${it.id}" type="text" placeholder="Eigenes Tag…" class="inp py-1 px-2 text-xs flex-1 min-w-[105px]"/>
          <button type="button" data-action="add-custom-pw-tag" data-kind="${kind}" data-id="${it.id}" data-tip="Eigenes Tag erstellen und hinzufügen" class="btn btn-ok py-1 px-2 text-xs shrink-0">+</button>
        </div>
      </div>
    </div>
    <div class="space-y-2.5 text-xs">
      <div class="rtf-wrap"><div class="flex flex-wrap items-center justify-between gap-1.5 mb-1"><label class="font-bold t-mut">Beschreibung</label>${renderRtfToolbarHtml(true)}</div><div contenteditable="true" id="desc_${it.id}" data-pwf="${kind}:${it.id}:desc" data-boxh="${kind}:${it.id}:desc" ${hD} data-ph="Kursiver Beschreibungstext..." class="inp w-full autogrow italic rtf-box">${toRtfHtml(it.desc)}</div></div>
      <div class="rtf-wrap min-w-0">
        <div class="flex flex-col md:flex-row md:flex-wrap md:items-center justify-between gap-2 md:gap-1.5 mb-1.5 md:mb-1 min-w-0">
          <div class="flex flex-wrap items-center justify-between md:justify-start gap-2 min-w-0">
            <label class="font-bold t-mut cursor-help" data-tip="Freitext &amp; Baukasten: Erkennt Werte wie [+5 LP-Max], Vor-/Nachteile samt Einsatzgebiet sowie dynamische Formeln wie {{WA/2}} (in Beschreibung, Effekte oder Zusatzinfos).">Effekte</label>
            ${renderRtfToolbarHtml(true)}
          </div>
          <div class="grid grid-cols-1 gap-1.5 w-full min-w-0 max-w-full p-2 rounded-lg bg-black/15 border bdr-line md:flex md:flex-wrap md:items-center md:gap-1 md:w-auto md:p-0 md:bg-transparent md:border-0 md:rounded-none">
            <div class="grid grid-cols-3 md:inline-flex rounded-lg p-0.5 bg-black/25 border bdr-line text-[11px] w-full md:w-auto md:shrink-0 min-w-0 max-w-full" role="group" aria-label="Baukasten-Modus">
              <button type="button" data-action="set-pw-bld-mode" data-kind="${kind}" data-id="${it.id}" data-mode="stat" data-tip="Werte-Baukasten (Attribute, Sekundärwerte, Status)" class="px-1.5 md:px-2 py-1 md:py-0.5 rounded font-extrabold transition-colors whitespace-nowrap truncate text-center ${!isSkBld&&!isDynBld?'bg-acc-soft text-acc':'t-mut hover:text-acc'}">Werte</button>
              <button type="button" data-action="set-pw-bld-mode" data-kind="${kind}" data-id="${it.id}" data-mode="skill" data-tip="Vor- oder Nachteile auf eine konkrete Fertigkeit aus Tab 2 bauen" class="px-1.5 md:px-2 py-1 md:py-0.5 rounded font-extrabold transition-colors whitespace-nowrap truncate text-center ${isSkBld?'bg-acc-soft text-acc':'t-mut hover:text-acc'}"><span class="md:hidden">Fert. V/N</span><span class="hidden md:inline">Fertigkeit V/N</span></button>
              <button type="button" data-action="set-pw-bld-mode" data-kind="${kind}" data-id="${it.id}" data-mode="dyn" data-tip="Dynamischer Wert ({{WA/2}} etc.) für Beschreibung, Effekte oder Zusatzinfos – wird live aus den Charakterwerten berechnet" class="px-1.5 md:px-2 py-1 md:py-0.5 rounded font-extrabold transition-colors whitespace-nowrap truncate text-center ${isDynBld?'bg-acc-soft text-acc':'t-mut hover:text-acc'}">🧮 Dyn. Wert</button>
            </div>
            ${isDynBld?`<div class="grid grid-cols-2 md:contents gap-1.5 min-w-0">
              <select data-pw-sel="${kind}:${it.id}:bldDynVar" data-tip="Bezugswert wählen (Attribut, Sekundärwert oder eigene Ressource)" class="inp w-full md:w-auto py-1 md:py-0.5 px-2 md:px-1.5 text-xs font-bold min-w-0 max-w-full md:max-w-[140px]">${dynGroups.map(([gl,arr])=>`<optgroup label="${esc(gl)}">${arr.map(v=>`<option value="${esc(v)}" ${dynSpec.varName===v?'selected':''}>${esc(v)}</option>`).join('')}</optgroup>`).join('')}${!dynGroups.some(([,arr])=>arr.includes(dynSpec.varName))?`<option value="${esc(dynSpec.varName)}" selected>${esc(dynSpec.varName)}</option>`:''}</select>
              <select data-pw-dyn-preset="${kind}:${it.id}" data-tip="Schnell-Faktor oder Operation wählen (kann rechts daneben frei bearbeitet werden)" class="inp w-full md:w-auto py-1 md:py-0.5 px-2 md:px-1.5 text-xs font-bold min-w-0 max-w-full md:max-w-[115px]">${DYN_FACTOR_PRESETS.map(p=>`<option value="${esc(p.v)}" ${dynPresetVal===p.v?'selected':''}>${esc(p.l)}</option>`).join('')}<option value="__custom__" ${dynPresetVal==='__custom__'?'selected':''}>Eigene…</option></select>
              <input data-pwf="${kind}:${it.id}:bldDynFactor" type="text" value="${esc(dynSpec.factor)}" placeholder="z.B. /2, *1.5, /4+2" data-tip="Faktor oder Teilformel frei eintippen (z. B. /2, *1.5, x2, /4+2, -5 oder leer für ×1)" class="inp w-full md:w-24 py-1 md:py-0.5 px-2 md:px-1.5 text-xs font-bold tabular min-w-0 max-w-full"/>
              <select data-pw-sel="${kind}:${it.id}:bldDynRound" data-tip="Optionale Rundung (exakt, abrunden, aufrunden, runden)" class="inp w-full md:w-auto py-1 md:py-0.5 px-2 md:px-1.5 text-xs font-bold min-w-0 max-w-full md:max-w-[115px]">${DYN_ROUND_OPTS.map(r=>`<option value="${esc(r.v)}" ${dynSpec.round===r.v?'selected':''}>${esc(r.l)}</option>`).join('')}</select>
              <select data-pw-sel="${kind}:${it.id}:bldDynTarget" data-tip="Zielfeld beim Einfügen, falls kein Textfeld dieser Karte fokussiert ist (sonst wird exakt an deiner Cursorposition eingefügt)" class="inp col-span-2 md:col-span-1 w-full md:w-auto py-1 md:py-0.5 px-2 md:px-1.5 text-xs font-bold min-w-0 max-w-full md:max-w-[125px]">${DYN_TARGET_OPTS.map(t=>`<option value="${esc(t.v)}" ${dynTargetVal===t.v?'selected':''}>→ ${esc(t.l)}</option>`).join('')}</select>
            </div>
            <div class="flex flex-wrap items-center gap-1.5 md:contents min-w-0">
              <span id="chip_${it.id}" draggable="${bldToken?'true':'false'}" data-drag-tok="${esc(bldToken)}" data-pw-kind="${kind}" data-pw-id="${it.id}" data-tip="${esc(dynSpec.evalRes.ok?`Formel: ${dynSpec.expr}\nRechnung: ${dynSpec.evalRes.breakdown}\nIn Beschreibung, Effekte oder Zusatzinfos ziehen oder Einfüge-Button klicken.`:`Ungültige Formel: ${dynSpec.expr}\nFehler: ${dynSpec.evalRes.error||'Syntaxfehler'}`).replace(/\n/g,'&#10;')}" class="tag select-none tabular max-w-full min-w-0 break-words ${bldToken?'cursor-grab':'opacity-60 cursor-not-allowed'}">${dynSpec.evalRes.ok?`⠿ ${esc(dynSpec.token)} (= ${esc(dynSpec.evalRes.formatted)})`:`⚠ ${esc(dynSpec.evalRes.error||'Ungültige Formel')}`}</span>
              <button type="button" id="insTok_${it.id}" data-action="ins-token" data-kind="${kind}" data-id="${it.id}" data-bld-mode="dyn" ${bldToken?'':'disabled'} data-tip="${esc(dynSpec.evalRes.ok?`Rechnung: ${dynSpec.evalRes.breakdown}\nFügt ${dynSpec.token} an der letzten Cursor-Position (Beschreibung/Effekte/Zusatzinfos) oder im gewählten Zielfeld ein.\nBeispiel: „Die Reichweite beträgt ${dynSpec.token} Meter.“`:`Ungültige Formel: ${dynSpec.expr}\nFehler: ${dynSpec.evalRes.error||'Syntaxfehler'}`).replace(/\n/g,'&#10;')}" class="btn btn-ok py-1.5 md:py-0.5 px-3 md:px-2 text-xs md:text-[11px] font-extrabold tabular flex-1 md:flex-initial md:shrink-0 min-w-0 max-w-full whitespace-normal text-center">${dynSpec.evalRes.ok?`+ ${esc(dynSpec.token)} (= ${esc(dynSpec.evalRes.formatted)})`:`⚠ ${esc(dynSpec.evalRes.error||'Ungültige Formel')}`}</button>
              <span class="t-mut text-[11px] leading-snug basis-full md:basis-auto cursor-help" data-tip="Du kannst {{...}}-Formeln jederzeit auch direkt per Hand eintippen – z. B. {{WA/2}}, {{floor(LP-Max/4)+1}} oder {{max(ST,GW)}}.">💡 Beispiel: „Die Reichweite beträgt <code class="text-acc font-bold">{{WA/2}}</code> Meter.“ → wird automatisch live berechnet.</span>
            </div>`:`<div class="grid grid-cols-[minmax(4.25rem,5rem)_minmax(0,1fr)] md:contents gap-1.5 min-w-0">${isSkBld?`<input data-pw-skcnt="${kind}:${it.id}" type="text" inputmode="numeric" value="${esc(it.bldSkCnt||'1')}" placeholder="1" data-tip="Anzahl Vorteile/Nachteile (nur ganze Zahlen ≥ 1)" class="inp w-full md:w-12 text-center py-1 md:py-0.5 px-1.5 md:px-1 text-xs font-black tabular min-w-0 md:shrink-0"/><select data-pw-sel="${kind}:${it.id}:bldSkKind" data-tip="Vorteil(e) oder Nachteil(e) wählen" class="inp w-full md:w-auto py-1 md:py-0.5 px-2 md:px-1.5 text-xs font-bold min-w-0 max-w-full md:shrink-0"><option value="adv" ${it.bldSkKind!=='dis'?'selected':''}>Vorteil(e)</option><option value="dis" ${it.bldSkKind==='dis'?'selected':''}>Nachteil(e)</option></select><select data-pw-sel="${kind}:${it.id}:bldSkId" data-tip="Fertigkeit aus Tab 2 wählen" class="inp col-span-2 w-full md:w-auto py-1 md:py-0.5 px-2 md:px-1.5 text-xs font-bold min-w-0 max-w-full md:max-w-[190px]">${sortedSkills.length?sortedSkills.map(sk=>`<option value="${esc(sk.id)}" ${selSkId===sk.id?'selected':''}>${esc(String(sk.name).trim())}</option>`).join(''):`<option value="" disabled selected>— Erst Fertigkeit in Tab 2 anlegen —</option>`}</select>`:`<input data-pwf="${kind}:${it.id}:bldAmt" type="text" value="${esc(it.bldAmt||'+1')}" class="inp w-full md:w-12 text-center py-1 md:py-0.5 px-1.5 md:px-1 text-xs font-black tabular min-w-0 md:shrink-0"/><select data-pw-sel="${kind}:${it.id}:bldStat" class="inp w-full md:w-auto py-1 md:py-0.5 px-2 md:px-1.5 text-xs font-bold min-w-0 max-w-full md:max-w-[180px]">${statGroups.map(([gl,arr])=>`<optgroup label="${esc(gl)}">${arr.map(st=>`<option value="${esc(st)}" ${it.bldStat===st?'selected':''}>${esc(st)}</option>`).join('')}</optgroup>`).join('')}</select>`}</div>
            <div class="flex flex-wrap items-center gap-1.5 md:contents min-w-0">
              <span id="chip_${it.id}" draggable="${bldToken?'true':'false'}" data-drag-tok="${esc(bldToken)}" data-pw-kind="${kind}" data-pw-id="${it.id}" data-tip="${bldToken?'Ins Effektfeld ziehen oder „+ Baustein“ klicken':'Erst mindestens eine Fertigkeit in Tab 2 anlegen'}" class="tag select-none tabular max-w-full min-w-0 break-words ${bldToken?'cursor-grab':'opacity-60 cursor-not-allowed'}">${bldToken?`⠿ ${esc(bldToken)}`:'⚠ Erst Fertigkeit in Tab 2 anlegen'}</span>
              <button type="button" id="insTok_${it.id}" data-action="ins-token" data-kind="${kind}" data-id="${it.id}" data-bld-mode="${isSkBld?'skill':'stat'}" ${bldToken?'':'disabled'} class="btn btn-ok py-1.5 md:py-0.5 px-3 md:px-2 text-xs md:text-[11px] flex-1 md:flex-initial md:shrink-0">+ Baustein</button>
              ${!isSkBld?`<button type="button" data-action="open-list" data-ltype="customStats" data-tip="Eigene Baukasten-Variablen verwalten" class="btn py-1.5 md:py-0.5 px-2.5 md:px-1.5 text-xs md:text-[11px] shrink-0">⚙️</button>`:''}
            </div>`}
          </div>
        </div>
        <div contenteditable="true" id="eff_${it.id}" data-pwf="${kind}:${it.id}:effects" data-boxh="${kind}:${it.id}:effects" ${hE} data-ph="z.B. Erhöht dauerhaft deine Lebenskraft um [+5 LP-Max]..." class="inp w-full autogrow rtf-box">${toRtfHtml(it.effects)}</div>
        <div id="tokBar_${it.id}" class="flex flex-wrap items-center justify-between gap-2 mt-1.5">${buildTokBarInnerHtml(kind,it)}</div>
        ${(()=>{const prDef=UI.statusIniPromptKey&&stToksInCard.some(t=>t.statusKey===UI.statusIniPromptKey)?STATUS_DEFS.find(d=>d.k===UI.statusIniPromptKey):null;if(!prDef)return '';const pv=getStatusEffValues(prDef.k);return `<div class="mt-2 p-2.5 rounded-lg border border-amber-400/70 bg-amber-500/15 flex flex-wrap items-center justify-between gap-2 text-xs"><span class="font-extrabold text-amber-300">⚡ ${esc(prDef.name)} aktiviert: Initiative +${10*pv.stacks} oder −${10*pv.stacks} wählen?</span><div class="flex items-center gap-1.5"><button type="button" data-action="confirm-status-inidir" data-key="${prDef.k}" data-dir="1" class="btn py-0.5 px-2.5 text-xs font-black ${pv.iniDir>0?'bg-amber-500 text-slate-950 border-amber-400':'border-amber-400/50 text-amber-200'}">⚡ +${10*pv.stacks} Initiative</button><button type="button" data-action="confirm-status-inidir" data-key="${prDef.k}" data-dir="-1" class="btn py-0.5 px-2.5 text-xs font-black ${pv.iniDir<0?'bg-amber-500 text-slate-950 border-amber-400':'border-amber-400/50 text-amber-200'}">⚡ −${10*pv.stacks} Initiative</button></div></div>`;})()}
      </div>
      <div class="rtf-wrap"><div class="flex flex-wrap items-center justify-between gap-1.5 mb-1"><label class="font-bold t-mut">Zusätzliche Regeln &amp; Infos</label>${renderRtfToolbarHtml(true)}</div><div contenteditable="true" id="rules_${it.id}" data-pwf="${kind}:${it.id}:rules" data-boxh="${kind}:${it.id}:rules" ${hR} data-ph="Reichweite, Dauer, Spezialregeln..." class="inp w-full autogrow rtf-box">${toRtfHtml(it.rules)}</div></div>
      ${(()=>{const dynPrevInner=buildDynPreviewBarInnerHtml(it,cardM);return `<div id="dynPrev_${it.id}" data-dyn-prev="${kind}:${it.id}" class="dyn-prev-bar${dynPrevInner?'':' hidden'}">${dynPrevInner}</div>`;})()}
    </div>
    ${!isAug?`<div class="subcard space-y-2"><div class="flex items-center justify-between text-xs"><span class="font-extrabold text-amber-400">Augment-Slots (${linked.length} / 3 ausgerüstet)</span>${gi.overLimit?`<span class="text-[11px] font-bold text-rose-400">⚠ Kollektiv ${gi.totalMsp} MsP in dieser Gruppe</span>`:''}</div>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-2">${[0,1,2].map(sIdx=>{
      const ag=linked[sIdx];
      if(ag) return `<div class="p-2 rounded-lg border border-amber-500/45 bg-amber-500/10 flex items-center justify-between gap-1.5 text-xs"><div class="min-w-0"><span class="block text-[10px] font-black text-amber-400">SLOT ${sIdx+1} • AKTIV</span><span class="block font-extrabold truncate" ${ag.color?`style="color:${esc(ag.color)}"`:''}>${esc(ag.name||'Unbenanntes Augment')}</span></div><button type="button" data-action="unlink-aug" data-id="${ag.id}" data-tip="Verknüpfung lösen" class="btn py-0.5 px-2 text-[11px] border-amber-500/40 text-amber-300">✕</button></div>`;
      return `<div class="p-2 rounded-lg border border-dashed bdr-line flex flex-col gap-1.5 text-xs"><div class="flex items-center justify-between"><span class="text-[10px] font-bold t-mut">SLOT ${sIdx+1} • FREI</span><button type="button" data-action="new-linked-aug" data-pid="${it.id}" class="text-[10px] font-extrabold text-amber-400 hover:underline">+ Neu</button></div>${unlinked.length?`<select data-link-slot="${it.id}" class="inp py-0.5 px-1.5 text-[11px]"><option value="">Freies Augment linken...</option>${unlinked.map(u=>`<option value="${u.id}">${esc(u.name||'Unbenanntes Augment')}</option>`).join('')}</select>`:`<span class="text-[10px] t-mut italic">Kein freies Augment offen</span>`}</div>`;
    }).join('')}</div></div>`:''}
  </div>`;
}

function renderPwViewCard(kind,it,idx,listLen,opts={}){
  const isAug=kind==='augment', colStyle=it.color?`style="color:${esc(it.color)}"`:'', winStyle=cardColorStyle(it);
  const dispName=String(it.name||'').trim();
  const linkedParent=isAug&&it.parentPowerId?S.powers.find(p=>p.id===it.parentPowerId):null;
  const showParentBadge=Boolean(opts.showParentBadge&&linkedParent);
  const viaParentPower=Boolean(opts.viaParentPower&&isAug);
  const augSecObj=(isAug&&!linkedParent&&opts.showSecBadge&&it.sectionId)?S.powerSections.find(s=>s.id===it.sectionId):null;
  const parentBadgeHtml=showParentBadge?`<span data-tip="${esc(`Verknüpft mit Kraft „${linkedParent.name||'Unbenannte Kraft'}“ (Zuordnung bleibt beim Filtern unverändert)`)}" class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md border border-amber-400/60 bg-amber-500/20 text-amber-300 text-[10px] font-extrabold shrink-0 max-w-full sm:max-w-[220px] truncate">↳ ${esc(linkedParent.name||'Unbenannte Kraft')}</span>`:(augSecObj?`<span data-tip="${esc(`Freies Augment in Sektion „${augSecObj.name||'Sektion'}“`)}" class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md border bdr-acc bg-acc-soft text-acc text-[10px] font-extrabold shrink-0 max-w-full sm:max-w-[200px] truncate">📁 ${esc(augSecObj.name||'Sektion')}</span>`:'');
  const viaParentBadgeHtml=viaParentPower?`<span data-tip="Mitangezeigt, weil die übergeordnete Hauptkraft dem Filter entspricht (erfüllt den Filter selbst nicht direkt)" class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md border border-amber-500/35 bg-amber-500/10 text-amber-300/85 text-[10px] font-bold shrink-0">↳ gebunden</span>`:'';
  const stToksInCard=parseStatusTokens(it.effects), costSummary=formatPwUseCosts(it), hasUseCost=Boolean(costSummary), canSpendPw=hasUseCost||stToksInCard.length>0;
  const reservableCosts=getReservablePwCosts(it), isReserved=Boolean(it.reserved), activeResCosts=(isReserved&&Array.isArray(it.reservedCosts)&&it.reservedCosts.length)?it.reservedCosts:reservableCosts, resTxt=activeResCosts.map(rc=>`${rc.amt} ${getResLabel(rc.res)}`).join(' + ');
  const spendBtnHtml=canSpendPw?`<button type="button" data-action="spend-pw" data-kind="${kind}" data-id="${it.id}" data-tip="${hasUseCost?`Einsatzkosten (${esc(costSummary)}) abziehen`:'Effekte / Status aktivieren'}" aria-label="${hasUseCost?`Einsetzen (${esc(costSummary)})`:'Einsetzen'}" class="btn btn-pri h-7 px-2 text-[11px] font-extrabold shrink-0 tabular">⚡${hasUseCost?` <span class="hidden sm:inline">${esc(costSummary)}</span>`:''}</button>`:'';
  const reserveBtnHtml=isReserved
    ?`<button type="button" data-action="toggle-reserve-pw" data-kind="${kind}" data-id="${it.id}" data-tip="Reservierung aufheben (${esc(resTxt)} – verbrauchte Kosten werden nicht wiederhergestellt)" class="btn h-7 px-2 text-[11px] bg-amber-500/25 border-amber-400 text-amber-300 font-black tabular shrink-0">🔒 ${esc(resTxt)} ✕</button>`
    :(reservableCosts.length>0?`<button type="button" data-action="toggle-reserve-pw" data-kind="${kind}" data-id="${it.id}" data-tip="Reservieren: zieht ${esc(resTxt)} sofort ab und sperrt den Betrag vom Maximum" aria-label="Reservieren (${esc(resTxt)})" class="btn h-7 w-7 p-0 text-[11px] shrink-0">🔒</button>`:'');
  const editBtnHtml=`<button type="button" data-action="open-pw-quick-edit" data-kind="${kind}" data-id="${it.id}" data-tip="Diese Karte direkt bearbeiten" aria-label="${esc(dispName||(isAug?'Augment':'Kraft'))} bearbeiten" class="btn h-7 w-7 p-0 text-xs shrink-0">✏️</button>`;
  const menuBtnHtml=`<button type="button" data-action="open-pw-card-menu" data-kind="${kind}" data-id="${it.id}" aria-haspopup="menu" aria-expanded="false" aria-label="Aktionen für ${esc(dispName||(isAug?'Augment':'Kraft'))}" data-tip="Farben, Zuordnung, Duplizieren, Export, Kosten &amp; Löschen" class="btn h-7 w-7 p-0 text-sm font-black shrink-0">⋮</button>`;
  const headerRow=`<div class="flex flex-wrap sm:flex-nowrap items-center justify-between gap-1.5 min-w-0">
    <div class="flex items-center gap-1.5 min-w-0 flex-1">
      <button type="button" data-action="toggle-pw-collapse" data-kind="${kind}" data-id="${it.id}" data-tip="${it.collapsed?'Ausklappen':'Einklappen (nur Kopfzeile anzeigen)'}" aria-label="${it.collapsed?'Ausklappen':'Einklappen'}" class="btn w-7 h-7 p-0 text-xs font-black shrink-0">${it.collapsed?'▸':'▾'}</button>
      ${(isAug&&!linkedParent&&!isMobileLayout())?`<span draggable="true" data-drag-aug="${it.id}" data-tip="Ziehen zum Sortieren, in eine Sektion verschieben oder auf eine Kraft verknüpfen" class="w-7 h-7 rounded text-xs font-black bg-amber-500/15 text-amber-400 border border-amber-500/40 cursor-grab select-none shrink-0 inline-flex items-center justify-center">⠿</span>`:''}
      <span class="font-extrabold text-sm sm:text-[15px] leading-tight truncate min-w-0 ${dispName?'':'t-mut italic font-semibold'}" ${dispName?colStyle:''}>${dispName?esc(dispName):(isAug?'Unbenanntes Augment':'Unbenannte Kraft')}</span>
      ${parentBadgeHtml}${viaParentBadgeHtml}
    </div>
    <div class="flex items-center gap-1 shrink-0 ml-auto">${spendBtnHtml}${reserveBtnHtml}${editBtnHtml}${menuBtnHtml}</div>
  </div>`;
  if(it.collapsed){
    return `<div ${isAug?`data-aug-card="${it.id}"`:''} class="card py-1.5 px-2.5 sm:px-3 ${isAug?'border-amber-500/45':''}${viaParentPower?' opacity-75 hover:opacity-100 transition-opacity':''}" ${winStyle}>${headerRow}</div>`;
  }
  const curArtTip=getPwTermTip(it.art);
  const itemActionSubs=DEF_ACTION_SUBS.filter(a=>Array.isArray(it.actionSubs)&&it.actionSubs.includes(a));
  const itemTags=Array.isArray(it.tags)?it.tags.filter(t=>String(t||'').trim()&&!isReservedPwTerm(t)):[];
  const tKey=getPwTierKey(it,isAug), tMeta=PW_TIERS[tKey]||PW_TIERS.marginal, tBadgeCls=PW_TIER_BADGE_CLS[tKey]||PW_TIER_BADGE_CLS.marginal;
  const metaPills=[`<span class="inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-extrabold border ${tBadgeCls}" data-tip="${esc(tMeta.full)}">${esc(tMeta.l)}</span>`];
  if(it.art) metaPills.push(`<span class="tag text-[10px] py-0.5 px-1.5 ${curArtTip?'cursor-help':''}" ${curArtTip?`data-tip="${esc(curArtTip)}"`:''}>${esc(it.art)}</span>`);
  itemActionSubs.forEach(asub=>{const tip=getPwTermTip(asub);metaPills.push(`<span class="tag text-[10px] py-0.5 px-1.5 !border-indigo-400/50 !bg-indigo-500/15 !text-indigo-200 ${tip?'cursor-help':''}" ${tip?`data-tip="${esc(tip)}"`:''}>${esc(asub)}</span>`);});
  itemTags.forEach(tg=>{const tip=getPwTermTip(tg);metaPills.push(`<span class="inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-bold border bdr-line bg-black/20 t-mut ${tip?'cursor-help':''}" ${tip?`data-tip="${esc(tip)}"`:''}>${esc(tg)}</span>`);});
  const costBadgeHtml=hasUseCost?`<span class="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-black border border-amber-400/60 bg-amber-500/15 text-amber-300 tabular shrink-0" data-tip="Einsatzkosten">⚡ ${esc(costSummary)}</span>`:'';
  const hasMeta=metaPills.length>0||Boolean(costBadgeHtml);
  const metaRow=hasMeta?`<div class="flex flex-wrap items-center justify-between gap-1.5 pt-1 border-t bdr-line"><div class="flex flex-wrap items-center gap-1 min-w-0">${metaPills.join('')}</div>${costBadgeHtml}</div>`:'';
  const M=opts.M||calcActiveMods();
  const hasDesc=Boolean(stripHtml(it.desc).trim());
  const hasEffects=Boolean(stripHtml(it.effects).trim());
  const hasRules=Boolean(stripHtml(it.rules).trim());
  const descRow=hasDesc?`<div data-pw-view-rtf="${kind}:${it.id}:desc" class="text-xs italic leading-snug t-mut rtf-box cursor-auto">${renderDynamicRtfHtml(it.desc,M)}</div>`:'';
  let effectsRow='';
  if(hasEffects){
    const chips=getAllParsedEffectChips(it.effects);
    const modInactive=it.applyMods===false;
    const modBadgesHtml=(chips.length||modInactive)?`<div class="flex flex-wrap items-center gap-1 mt-1">${chips.map(tk=>{
      const isAdv=tk.chipType==='adv', isDis=tk.chipType==='dis', isSt=tk.chipType==='status';
      const cls=isSt?'!border-amber-400/60 !bg-amber-500/15 !text-amber-300':isDis?'!border-rose-500/45 !bg-rose-500/15 !text-rose-300':isAdv?'!border-sky-400/50 !bg-sky-500/15 !text-sky-300':'!border-emerald-500/40 !bg-emerald-500/10 !text-emerald-300';
      const tip=isSt?`data-tip="${esc(`Statuseffekt-Baustein: Aktiviert „${tk.statusName}“ (${tk.stacks}× Stapel) beim Klick auf ⚡`)}"`:(isAdv||isDis)?`data-tip="${esc(`Erkannter Proben-Effekt: ${fmtSign(tk.val)} ${isDis?'Nachteil(e)':'Vorteil(e)'} → ${tk.label}`)}"`:'';
      return `<span ${tip} class="tag text-[10px] py-0 px-1.5 ${cls} tabular ${modInactive&&!isSt?'opacity-45 line-through':''} ${tip?'cursor-help':''}">${esc(tk.raw)}</span>`;
    }).join('')}${modInactive?`<button type="button" data-action="toggle-apply-mods" data-kind="${kind}" data-id="${it.id}" data-tip="Mods dieser Karte sind derzeit deaktiviert (nicht auf Bogen/Würfelassistent angerechnet) – klicken zum Aktivieren" class="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-extrabold border border-amber-400/60 bg-amber-500/15 text-amber-300 cursor-pointer">⏸️ Mods inaktiv</button>`:''}</div>`:'';
    const prDef=UI.statusIniPromptKey&&stToksInCard.some(t=>t.statusKey===UI.statusIniPromptKey)?STATUS_DEFS.find(d=>d.k===UI.statusIniPromptKey):null;
    const iniPromptHtml=prDef?(()=>{const pv=getStatusEffValues(prDef.k);return `<div class="mt-1.5 p-2 rounded-lg border border-amber-400/70 bg-amber-500/15 flex flex-wrap items-center justify-between gap-2 text-xs"><span class="font-extrabold text-amber-300">⚡ ${esc(prDef.name)} aktiviert: Initiative +${10*pv.stacks} oder −${10*pv.stacks} wählen?</span><div class="flex items-center gap-1.5"><button type="button" data-action="confirm-status-inidir" data-key="${prDef.k}" data-dir="1" class="btn py-0.5 px-2.5 text-xs font-black ${pv.iniDir>0?'bg-amber-500 text-slate-950 border-amber-400':'border-amber-400/50 text-amber-200'}">⚡ +${10*pv.stacks} Ini</button><button type="button" data-action="confirm-status-inidir" data-key="${prDef.k}" data-dir="-1" class="btn py-0.5 px-2.5 text-xs font-black ${pv.iniDir<0?'bg-amber-500 text-slate-950 border-amber-400':'border-amber-400/50 text-amber-200'}">⚡ −${10*pv.stacks} Ini</button></div></div>`;})():'';
    effectsRow=`<div class="text-xs leading-snug${hasDesc?' pt-1 border-t border-white/10':''}"><div data-pw-view-rtf="${kind}:${it.id}:effects" class="rtf-box cursor-auto">${renderDynamicRtfHtml(it.effects,M)}</div>${modBadgesHtml}${iniPromptHtml}</div>`;
  }
  const rulesHtml=hasRules?renderDynamicRtfHtml(it.rules,M):'';
  const rulesIsBlock=hasRules&&/<(ul|ol|div|p|h1|h2|h3|br)\b/i.test(rulesHtml);
  const rulesRow=hasRules?`<div class="text-[11px] leading-snug${(hasDesc||hasEffects)?' pt-1 border-t border-white/10':''} t-mut"><span class="font-extrabold text-acc mr-1">Zusatzinfos:</span>${rulesIsBlock?`<div data-pw-view-rtf="${kind}:${it.id}:rules" class="rtf-box cursor-auto mt-0.5">${rulesHtml}</div>`:`<span data-pw-view-rtf="${kind}:${it.id}:rules" class="rtf-box cursor-auto">${rulesHtml}</span>`}</div>`:'';
  const hasBody=hasDesc||hasEffects||hasRules;
  return `<div ${isAug?`data-aug-card="${it.id}"`:''} class="card py-2 px-2.5 sm:px-3 space-y-1.5 ${isAug?'border-amber-500/45':''}${viaParentPower?' opacity-75 hover:opacity-100 transition-opacity':''}" ${winStyle}>
    ${headerRow}
    ${metaRow}
    ${hasBody?`<div class="space-y-1.5 pt-1 border-t border-white/10">${descRow}${effectsRow}${rulesRow}</div>`:''}
  </div>`;
}

function renderPwItem(kind,it,idx,listLen,opts={}){
  const isQuick=UI.pwMode!=='edit'&&UI.pwQuickEditIds instanceof Set&&UI.pwQuickEditIds.has(pwQuickKey(kind,it.id));
  if(UI.pwMode==='edit'||isQuick) return renderPwCard(kind,it,idx,listLen,{...opts,isQuickEdit:isQuick});
  return renderPwViewCard(kind,it,idx,listLen,opts);
}

const getPwFilterCnt=()=>(UI.pwFilterTypes?.length||0)+(UI.pwFilterArts?.length||0)+(UI.pwFilterActionSubs?.length||0)+(UI.pwFilterTiers?.length||0)+(UI.pwFilterTags?.length||0);
const hasActivePwFilter=()=>getPwFilterCnt()>0;
const isOnlyPowersFilter=()=>Array.isArray(UI.pwFilterTypes)&&UI.pwFilterTypes.length===1&&UI.pwFilterTypes[0]==='power';
const isOnlyAugsFilter=()=>Array.isArray(UI.pwFilterTypes)&&UI.pwFilterTypes.length===1&&UI.pwFilterTypes[0]==='augment';
function matchesPwItemFilter(it,kind){
  if(!hasActivePwFilter()) return true;
  const itemKind=kind||(S.augments.includes(it)?'augment':'power');
  const hasTypes=(UI.pwFilterTypes?.length||0)>0;
  if(hasTypes&&!UI.pwFilterTypes.includes(itemKind)) return false;
  const hasArts=(UI.pwFilterArts?.length||0)>0;
  const hasAsubs=(UI.pwFilterActionSubs?.length||0)>0;
  const hasTiers=(UI.pwFilterTiers?.length||0)>0;
  const hasTags=(UI.pwFilterTags?.length||0)>0;
  if(!hasArts&&!hasAsubs&&!hasTiers&&!hasTags) return true;
  const itemArt=String(it?.art||'').trim();
  const itemAsubs=Array.isArray(it?.actionSubs)?it.actionSubs.map(s=>String(s||'').trim()):[];
  const isLegacyBasis=itemKind!=='augment'&&!it?.parentPowerId&&it?.tier==='marginal'&&it?.manualCost&&toInt(it?.sp,0)===0&&toInt(it?.msp,0)===0;
  const tKey=isLegacyBasis?'basisaktion':(PW_TIERS[it?.tier]?it.tier:'marginal');
  const itemTags=Array.isArray(it?.tags)?it.tags.map(s=>String(s||'').trim()):[];
  const matchArt=hasArts&&UI.pwFilterArts.includes(itemArt);
  const matchAsub=hasAsubs&&itemAsubs.some(s=>UI.pwFilterActionSubs.includes(s));
  const matchTier=hasTiers&&UI.pwFilterTiers.includes(tKey);
  const matchTag=hasTags&&itemTags.some(tg=>UI.pwFilterTags.includes(tg));
  if(UI.pwFilterMode==='and'){
    return (!hasArts||matchArt)&&(!hasAsubs||matchAsub)&&(!hasTiers||matchTier)&&(!hasTags||matchTag);
  }
  return Boolean(matchArt||matchAsub||matchTier||matchTag);
}
function matchesPwGroupFilter(p){
  if(!hasActivePwFilter()) return true;
  return matchesPwItemFilter(p,'power')||getLinkedAugs(p.id).some(ag=>matchesPwItemFilter(ag,'augment'));
}

function renderPwGroupList(pwArr,pwCtx={}){
  const fAct=hasActivePwFilter();
  const onlyPw=isOnlyPowersFilter();
  return pwArr.map((p,i)=>{
    const pMatches=!fAct||matchesPwItemFilter(p,'power');
    const allLinked=getLinkedAugs(p.id);
    let linked;
    if(!fAct){
      linked=allLinked;
    }else if(pMatches){
      if(onlyPw) linked=[];
      else if(UI.pwFilterIncludeLinkedAugs) linked=allLinked;
      else linked=allLinked.filter(ag=>matchesPwItemFilter(ag,'augment'));
    }else{
      linked=allLinked.filter(ag=>matchesPwItemFilter(ag,'augment'));
    }
    if(!pMatches&&!linked.length) return '';
    const spCls=UI.pwMode==='edit'?'space-y-2.5':'space-y-1.5';
    if(!pMatches){
      return `<div data-pw-group="${p.id}" class="${spCls}">${linked.map((ag,ai)=>renderPwItem('augment',ag,ai,linked.length,{...pwCtx,showParentBadge:true})).join('')}</div>`;
    }
    return `<div data-pw-group="${p.id}" class="${spCls}">${renderPwItem('power',p,i,pwArr.length,pwCtx)}${linked.length?`<div class="pl-2.5 sm:pl-6 border-l-2 border-amber-500/45 ${spCls}">${linked.map((ag,ai)=>{
      const viaParent=fAct&&!matchesPwItemFilter(ag,'augment');
      return renderPwItem('augment',ag,ai,linked.length,{...pwCtx,viaParentPower:viaParent});
    }).join('')}</div>`:''}</div>`;
  }).filter(Boolean).join('');
}

function secHasFilteredPowers(secId){
  if(S.powers.filter(p=>p.sectionId===secId).some(matchesPwGroupFilter)) return true;
  if(getUnlinkedAugsInSec(secId).some(ag=>matchesPwItemFilter(ag,'augment'))) return true;
  return S.powerSections.filter(s=>(s.parentSectionId||'')===secId).some(cs=>secHasFilteredPowers(cs.id));
}
function renderPwSecSlot(parentId,beforeSecId){
  return `<div data-pw-sec-slot="${esc(parentId)}" data-before-sec="${esc(beforeSecId||'')}" class="pw-sec-slot"></div>`;
}
function openPwSecParentPicker(anchorEl,secId){
  const sec=S.powerSections.find(s=>s.id===secId); if(!sec) return;
  const validParents=S.powerSections.filter(s=>canSetSecParent(S.powerSections,secId,s.id));
  const items=[
    {icon:'📁',label:'Hauptebene',active:!sec.parentSectionId,onClick:()=>{sec.parentSectionId='';sanitizeSecHierarchy(S.powerSections);renderMain();save();toast('Sektion auf Hauptebene verschoben');}},
    ...validParents.map(s=>({
      icon:'↳',
      label:`in: ${s.name||'Sektion'}`,
      active:sec.parentSectionId===s.id,
      onClick:()=>{
        if(!canSetSecParent(S.powerSections,secId,s.id)){toast('⚠️ Zyklus verhindert: Eine Sektion kann nicht in sich selbst oder ihre Untersektion gelegt werden.');return;}
        sec.parentSectionId=s.id;s.collapsed=false;sanitizeSecHierarchy(S.powerSections);renderMain();save();toast('Sektion als Unterordner verschachtelt');
      }
    }))
  ];
  openCtxMenu({key:`pwsec-parent-picker:${secId}`,title:'Übergeordnete Sektion',anchorEl,align:'right',minWidth:235,items});
}
function openPwSecArtPicker(anchorEl,secId){
  const sec=S.powerSections.find(s=>s.id===secId); if(!sec) return;
  const setArt=val=>{sec.filterArt=val;UI.confirmSecPullId=null;renderMain();save();};
  const items=[
    {icon:'✕',label:'Kein Sammler (Aus)',active:!sec.filterArt,onClick:()=>setArt('')},
    {sep:true},
    {type:'label',label:'Hauptaktionsart wählen'},
    ...DEF_MAIN_ARTS.map(a=>({
      icon:'⚡',
      label:a,
      tip:getPwTermTip(a),
      active:sec.filterArt===a,
      onClick:()=>setArt(a)
    }))
  ];
  openCtxMenu({key:`pwsec-art-picker:${secId}`,title:'Hauptaktionsart-Sammler',anchorEl,align:'right',minWidth:235,items});
}
function openPwSecMenu(anchorEl,secId,forceOpen=false){
  const sec=S.powerSections.find(s=>s.id===secId); if(!sec) return;
  const sibs=getPwSecSiblings(sec);
  const sIdx=sibs.findIndex(s=>s.id===secId);
  const allSecPowers=S.powers.filter(p=>p.sectionId===sec.id);
  const allSecFreeAugs=getUnlinkedAugsInSec(sec.id);
  const curPar=sec.parentSectionId?S.powerSections.find(s=>s.id===sec.parentSectionId):null;
  const isPullConfirm=UI.confirmSecPullId===secId, isDelConfirm=UI.confirmDelSecId===secId;
  const items=[
    {type:'label',label:'Reihenfolge'},
    {
      icon:'▲',label:'Nach oben',disabled:sIdx<=0,keepOpen:true,
      onClick:()=>{
        if(movePwSecOrder(secId,-1)){
          const fresh=findVisibleBtn(`[data-action="open-pw-sec-menu"][data-id="${secId}"]`);
          openPwSecMenu(fresh||anchorEl,secId,true);
        }
      }
    },
    {
      icon:'▼',label:'Nach unten',disabled:sIdx<0||sIdx>=sibs.length-1,keepOpen:true,
      onClick:()=>{
        if(movePwSecOrder(secId,1)){
          const fresh=findVisibleBtn(`[data-action="open-pw-sec-menu"][data-id="${secId}"]`);
          openPwSecMenu(fresh||anchorEl,secId,true);
        }
      }
    },
    {sep:true},
    {type:'label',label:'Struktur & Export'}
  ];
  if(S.powerSections.length>1){
    items.push({
      icon:'↳',
      label:'Übergeordnete Sektion',
      badge:curPar?(curPar.name||'Sektion'):'Hauptebene',
      onClick:()=>{openPwSecParentPicker(anchorEl,secId);}
    });
  }
  items.push({icon:'➕',label:'Untersektion erstellen',action:'add-pw-section',dataset:{parent:secId}});
  items.push({icon:'🧩',label:'Freies Augment in Sektion',action:'add-augment',dataset:{sec:secId}});
  items.push({icon:'📤',label:'Sektion als .json exportieren',action:'export-pw-sec',dataset:{id:secId}});
  items.push({sep:true});
  items.push({type:'label',label:'Sortieren & Sammeln'});
  if(allSecPowers.length>1||allSecFreeAugs.length>1){
    items.push({icon:'⇅',label:'Einträge A–Z sortieren',action:'sort-sec-az',dataset:{id:secId}});
  }
  items.push({
    icon:'🔍',
    label:'Hauptaktionsart-Sammler',
    badge:sec.filterArt||'Aus',
    onClick:()=>{openPwSecArtPicker(anchorEl,secId);}
  });
  if(sec.filterArt){
    if(isPullConfirm){
      items.push({
        icon:'⚠️',
        label:`Alle „${sec.filterArt}“ sammeln? (2/2)`,
        sub:'Verschiebt passende Kräfte & freie Augmente hierher & sortiert A–Z',
        action:'confirm-sec-pull',
        dataset:{id:secId}
      });
      items.push({
        icon:'↩️',
        label:'Sammeln abbrechen',
        keepOpen:true,
        onClick:()=>{UI.confirmSecPullId=null;openPwSecMenu(anchorEl,secId,true);}
      });
    }else{
      items.push({
        icon:'📥',
        label:`Alle „${sec.filterArt}“ sammeln & A–Z`,
        keepOpen:true,
        onClick:()=>{UI.confirmSecPullId=secId;openPwSecMenu(anchorEl,secId,true);}
      });
    }
  }
  items.push({sep:true});
  items.push({type:'label',label:'Darstellung'});
  items.push({icon:'🎨',label:'Textfarbe der Sektion',badge:sec.color?'●':'',action:'open-sec-folder-color',dataset:{id:secId,cmode:'text'}});
  items.push({icon:'🪟',label:'Fensterfarbe der Sektion',badge:sec.bgColor?'●':'',action:'open-sec-folder-color',dataset:{id:secId,cmode:'bg'}});
  items.push({icon:sec.collapsed?'▾':'▸',label:sec.collapsed?'Sektion ausklappen':'Sektion einklappen',action:'toggle-sec-collapse',dataset:{id:secId}});
  items.push({sep:true});
  if(isDelConfirm){
    items.push({
      icon:'⚠️',
      label:'Sektion wirklich löschen? (2/2)',
      sub:'Enthaltene Kräfte, freie Augmente & Untersektionen bleiben erhalten',
      danger:true,
      action:'confirm-del-sec',
      dataset:{id:secId}
    });
    items.push({
      icon:'↩️',
      label:'Löschen abbrechen',
      keepOpen:true,
      onClick:()=>{UI.confirmDelSecId=null;openPwSecMenu(anchorEl,secId,true);}
    });
  }else{
    items.push({
      icon:'🗑️',
      label:'Sektion entfernen',
      danger:true,
      keepOpen:true,
      onClick:()=>{UI.confirmDelSecId=secId;openPwSecMenu(anchorEl,secId,true);}
    });
  }
  openCtxMenu({
    key:`pw-sec-menu:${secId}`,
    title:sec.name||'Sektion',
    anchorEl,
    align:'right',
    minWidth:255,
    forceOpen,
    items,
    onClose:()=>{
      if(UI.confirmDelSecId===secId)UI.confirmDelSecId=null;
      if(UI.confirmSecPullId===secId)UI.confirmSecPullId=null;
    }
  });
}

function renderPwSection(sec,sIdx,sibLen=1,depth=0,pwCtx={}){
  const allSecPowers=S.powers.filter(p=>p.sectionId===sec.id), fAct=hasActivePwFilter(), secPowers=fAct?allSecPowers.filter(matchesPwGroupFilter):allSecPowers;
  const allSecFreeAugs=getUnlinkedAugsInSec(sec.id), secFreeAugs=fAct?allSecFreeAugs.filter(ag=>matchesPwItemFilter(ag,'augment')):allSecFreeAugs;
  if(fAct&&!secHasFilteredPowers(sec.id)) return '';
  const rawChildSecs=S.powerSections.filter(s=>(s.parentSectionId||'')===sec.id);
  const childSecs=fAct?rawChildSecs.filter(cs=>secHasFilteredPowers(cs.id)):rawChildSecs;
  const colStyle=sec.color?`style="color:${esc(sec.color)}"`:'', winStyle=cardColorStyle(sec);
  const showBody=!sec.collapsed||fAct;
  const secDirectPwCnt=fAct?allSecPowers.filter(p=>matchesPwItemFilter(p,'power')).length:allSecPowers.length;
  const secLinkedAugCnt=fAct?allSecPowers.reduce((s,p)=>s+getLinkedAugs(p.id).filter(ag=>matchesPwItemFilter(ag,'augment')).length,0):0;
  const secTotalAugMatchCnt=secLinkedAugCnt+secFreeAugs.length;
  let secPillTxt;
  if(fAct){
    if(secDirectPwCnt===0&&secTotalAugMatchCnt>0) secPillTxt=`${secTotalAugMatchCnt} ${secTotalAugMatchCnt===1?'Augment':'Augmente'}`;
    else secPillTxt=`${secDirectPwCnt}/${allSecPowers.length} Kräfte${secTotalAugMatchCnt?` • ${secTotalAugMatchCnt} Aug.`:''}`;
  }else{
    if(allSecPowers.length&&allSecFreeAugs.length) secPillTxt=`${allSecPowers.length} ${allSecPowers.length===1?'Kraft':'Kräfte'} • ${allSecFreeAugs.length} ${allSecFreeAugs.length===1?'Augment':'Augmente'}`;
    else if(!allSecPowers.length&&allSecFreeAugs.length) secPillTxt=`${allSecFreeAugs.length} ${allSecFreeAugs.length===1?'Augment':'Augmente'}`;
    else secPillTxt=`${allSecPowers.length} ${allSecPowers.length===1?'Kraft':'Kräfte'}`;
  }
  const isViewMode=UI.pwMode!=='edit';
  const freeAugListCls=isViewMode?'space-y-1.5':'space-y-2.5';
  return `<section data-pw-sec="${sec.id}" class="card ${isViewMode?'py-2.5 px-3 space-y-2':'space-y-3'} border-2 bdr-acc ${depth>0?'bg-black/15':''}" ${winStyle}>
    <div class="flex flex-wrap items-center justify-between gap-2 ${showBody?(isViewMode?'border-b bdr-line pb-1.5':'border-b bdr-line pb-2.5'):''}">
      <div class="flex items-center gap-1.5 flex-1 min-w-0 ${isViewMode?'':'w-full sm:w-auto sm:min-w-[180px]'}">
        <button type="button" data-action="toggle-sec-collapse" data-id="${sec.id}" data-tip="${sec.collapsed?'Sektion ausklappen':'Sektion einklappen'}" class="btn ${isViewMode?'w-7 h-7':'w-8 h-8 sm:w-7 sm:h-7'} p-0 text-xs font-black shrink-0">${sec.collapsed?'▸':'▾'}</button>
        ${!isViewMode?`<span draggable="true" data-drag-sec="${sec.id}" data-tip="Ziehen zum Sortieren oder in eine andere Sektion legen" class="w-7 h-7 rounded bg-acc-soft border bdr-acc text-acc text-xs font-black cursor-grab select-none shrink-0 inline-flex items-center justify-center">⠿</span>`:''}
        ${depth>0?`<span class="text-xs font-black text-acc shrink-0" data-tip="Untersektion (Ebene ${depth+1})">↳</span>`:''}
        ${isViewMode?`<span ${colStyle} class="flex-1 min-w-0 text-sm sm:text-base font-black truncate">${esc(sec.name||'Sektion')}</span>`:`<input data-secf="${sec.id}:name" type="text" value="${esc(sec.name)}" ${colStyle} placeholder="Sektionsname (z.B. Eigenschaften)..." class="inp-line flex-1 min-w-0 text-base font-black"/>`}
      </div>
      <div class="flex flex-wrap items-center gap-1.5 shrink-0 max-w-full">
        <span class="pill cursor-default text-[11px] py-0.5 px-2 tabular shrink-0">${secPillTxt}${childSecs.length?` • ${childSecs.length}📁`:''}</span>
        ${sec.filterArt?`<span class="tag text-[10px] py-0.5 px-1.5 shrink-0" data-tip="Hauptaktionsart-Sammler aktiv – im ⋮-Menü ausführbar">🔍 ${esc(sec.filterArt)}</span>`:''}
        ${!isViewMode?`<button type="button" data-action="add-power" data-sec="${sec.id}" class="btn btn-pri py-1.5 sm:py-1 px-2.5 text-xs shrink-0">+ Kraft</button><button type="button" data-action="add-augment" data-sec="${sec.id}" data-tip="Neues alleinstehendes Augment direkt in dieser Sektion anlegen" class="btn border-amber-400 text-amber-500 py-1.5 sm:py-1 px-2.5 text-xs shrink-0">+ Augment</button>`:''}
        ${!isViewMode&&sibLen>1?`<button type="button" data-action="move-sec" data-id="${sec.id}" data-dir="-1" ${sIdx===0?'disabled':''} data-tip="Sektion nach oben" class="hidden md:inline-flex btn py-1 px-2 text-xs">▲</button><button type="button" data-action="move-sec" data-id="${sec.id}" data-dir="1" ${sIdx===sibLen-1?'disabled':''} data-tip="Sektion nach unten" class="hidden md:inline-flex btn py-1 px-2 text-xs">▼</button>`:''}
        <button type="button" data-action="open-pw-sec-menu" data-id="${sec.id}" aria-haspopup="menu" aria-expanded="false" aria-label="Sektions-Aktionen für ${esc(sec.name||'Sektion')}" data-tip="Verschachteln, Sammler, A–Z, Export, Farben &amp; Löschen" class="btn ${isViewMode?'w-7 h-7 text-sm':'w-9 h-9 sm:w-8 sm:h-8 text-base'} p-0 font-black shrink-0">⋮</button>
      </div>
    </div>
    ${showBody?((secPowers.length||secFreeAugs.length||childSecs.length)?`<div class="${isViewMode?'space-y-2':'space-y-4 pt-1'}">${secPowers.length?renderPwGroupList(secPowers,pwCtx):''}${secFreeAugs.length?`<div class="${freeAugListCls}">${secFreeAugs.map((ag,ai)=>renderPwItem('augment',ag,ai,secFreeAugs.length,pwCtx)).join('')}</div>`:''}${childSecs.length?`<div class="pl-2.5 sm:pl-5 border-l-2 bdr-acc ${isViewMode?'space-y-2':''}">${childSecs.map((cs,ci)=>(isViewMode?'':renderPwSecSlot(sec.id,cs.id))+renderPwSection(cs,ci,childSecs.length,depth+1,pwCtx)).join('')}${isViewMode?'':renderPwSecSlot(sec.id,'')}</div>`:''}</div>`:`<div class="subcard border-dashed text-center py-4 text-xs t-mut">${isViewMode?'Keine Kräfte oder Augmente in dieser Sektion.':'Klicke auf „+ Kraft“, „+ Augment“ oder nutze das ⋮-Menü (Sammler / Untersektion). Auf dem Desktop klappt auch Drag &amp; Drop an ⠿.'}</div>`):''}
  </section>`;
}

function tplPowers(){
  const P=calcProg(), fAct=hasActivePwFilter(), fCnt=getPwFilterCnt();
  const pwCtx={
    M:calcActiveMods(),
    statGroups:getStatGroups(),
    sortedSkills:[...(S.skills||[])].filter(s=>s&&String(s.name||'').trim()).sort((a,b)=>String(a.name).trim().localeCompare(String(b.name).trim(),'de')),
    flatSecs:getPwSecOptionsFlat()
  };
  const onlyPw=isOnlyPowersFilter(), onlyAugs=isOnlyAugsFilter();
  const allUnlinked=getUnlinkedAugs(), unlinked=fAct?allUnlinked.filter(ag=>matchesPwItemFilter(ag,'augment')):allUnlinked;
  const allRootUnlinked=getRootUnlinkedAugs(), rootUnlinked=fAct?allRootUnlinked.filter(ag=>matchesPwItemFilter(ag,'augment')):allRootUnlinked;
  const allUnsecPowers=S.powers.filter(p=>!p.sectionId||!S.powerSections.some(s=>s.id===p.sectionId)), unsecPowers=fAct?allUnsecPowers.filter(matchesPwGroupFilter):allUnsecPowers;
  const hasAny=S.powers.length>0||S.augments.length>0||S.powerSections.length>0;
  const allPwTags=sortAlpha([...(S.pwTagList||DEF_PW_TAGS),...S.powers.flatMap(p=>p.tags||[]),...S.augments.flatMap(a=>a.tags||[])].filter(t=>!isReservedPwTerm(t)));
  const matchedPwCnt=fAct?S.powers.filter(p=>matchesPwItemFilter(p,'power')).length:S.powers.length;
  const matchedAugCnt=fAct?S.augments.filter(ag=>matchesPwItemFilter(ag,'augment')).length:S.augments.length;
  const totalMatchedCnt=matchedPwCnt+matchedAugCnt;
  const activeTagsHtml=fAct?`<div class="subcard p-2.5 border bdr-acc bg-acc-soft/30 flex flex-wrap items-center justify-between gap-2 text-xs min-w-0 max-w-full">
    <div class="flex flex-wrap items-center gap-1.5 min-w-0 flex-1">
      <span class="font-extrabold text-acc">🎯 Aktiver Filter (${totalMatchedCnt} ${totalMatchedCnt===1?'Treffer':'Treffer'}):</span>
      ${(UI.pwFilterTypes||[]).map(tp=>`<button type="button" data-action="toggle-pw-filter-opt" data-fkind="type" data-fval="${esc(tp)}" data-tip="Filter entfernen" class="tag cursor-pointer max-w-full min-w-0 break-words text-left">Typ: ${tp==='augment'?'Augmente':'Kräfte'} ✕</button>`).join('')}
      ${(UI.pwFilterArts||[]).map(a=>`<button type="button" data-action="toggle-pw-filter-opt" data-fkind="art" data-fval="${esc(a)}" data-tip="${esc(getPwTermTip(a)||'Filter entfernen')}" class="tag cursor-pointer max-w-full min-w-0 break-words text-left">Hauptart: ${esc(a)} ✕</button>`).join('')}
      ${(UI.pwFilterActionSubs||[]).map(asub=>`<button type="button" data-action="toggle-pw-filter-opt" data-fkind="asub" data-fval="${esc(asub)}" data-tip="${esc(getPwTermTip(asub)||'Filter entfernen')}" class="tag cursor-pointer max-w-full min-w-0 break-words text-left">Unterart: ${esc(asub)} ✕</button>`).join('')}
      ${(UI.pwFilterTiers||[]).map(k=>`<button type="button" data-action="toggle-pw-filter-opt" data-fkind="tier" data-fval="${esc(k)}" data-tip="Filter entfernen" class="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-extrabold border cursor-pointer max-w-full min-w-0 break-words text-left ${PW_TIER_BADGE_CLS[k]||'bdr-acc bg-acc-soft text-acc'}">Stufe: ${esc(PW_TIERS[k]?.l||k)} ✕</button>`).join('')}
      ${(UI.pwFilterTags||[]).map(tg=>`<button type="button" data-action="toggle-pw-filter-opt" data-fkind="tag" data-fval="${esc(tg)}" data-tip="${esc(getPwTermTip(tg)||'Filter entfernen')}" class="tag cursor-pointer max-w-full min-w-0 break-words text-left">Tag: ${esc(tg)} ✕</button>`).join('')}
    </div>
    <div class="flex flex-wrap items-center gap-1.5 min-w-0">
      <span class="text-[11px] t-mut tabular">${matchedPwCnt} ${matchedPwCnt===1?'Kraft':'Kräfte'} • ${matchedAugCnt} ${matchedAugCnt===1?'Augment':'Augmente'}</span>
      <button type="button" data-action="reset-pw-filter" class="btn btn-err py-0.5 px-2 text-[11px] shrink-0">↺ Alle einblenden</button>
    </div>
  </div>`:'';
  const filterMenuHtml=UI.pwFilterOpen?`<div class="subcard p-2.5 sm:p-3 space-y-3 border bdr-acc bg-acc-soft/20 text-xs min-w-0 max-w-full">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b bdr-line pb-2 min-w-0">
      <div class="font-extrabold text-acc flex flex-wrap items-center gap-1.5 sm:gap-2 min-w-0">
        <span class="break-words">🔍 Live-Filter für Kräfte &amp; Augmente</span>
        ${fAct?`<span class="pill cursor-default text-[10px] py-0.5 px-2 shrink-0">${fCnt} gewählt • ${totalMatchedCnt} Treffer</span>`:`<span class="text-[11px] font-normal t-mut break-words">(Blendet alle nicht passenden Kräfte &amp; Augmente aus)</span>`}
      </div>
      <div class="flex flex-wrap items-center gap-1.5 min-w-0 w-full sm:w-auto">
        <button type="button" data-action="toggle-pw-filter-mode" data-tip="Wechselt zwischen Überschneidung (mindestens 1 gewähltes Filterkriterium trifft zu) und Kombination (alle gewählten Kategorien müssen zutreffen)" class="btn py-1 sm:py-0.5 px-2.5 text-[11px] bdr-acc bg-acc-soft text-acc flex-1 sm:flex-initial min-w-0 max-w-full whitespace-normal text-center leading-tight">Modus: ${UI.pwFilterMode==='and'?'Kombination (UND)':'Überschneidung (ODER)'} ↻</button>
        ${fAct?`<button type="button" data-action="reset-pw-filter" class="btn btn-err py-1 sm:py-0.5 px-2.5 text-[11px] shrink-0">↺ Filter zurücksetzen</button>`:''}
        <button type="button" data-action="toggle-pw-filter" aria-label="Filter schließen" class="btn py-1 sm:py-0.5 px-2 text-[11px] shrink-0">✕</button>
      </div>
    </div>
    <div class="space-y-1.5 pb-1 border-b bdr-line min-w-0">
      <div class="text-[11px] font-extrabold t-mut uppercase tracking-wider">Typ</div>
      <div class="flex flex-col sm:flex-row sm:flex-wrap sm:items-center justify-between gap-2 min-w-0">
        <div class="grid grid-cols-2 sm:flex sm:flex-wrap gap-1.5 min-w-0">
          ${[['power','Kräfte'],['augment','Augmente']].map(([val,lbl])=>{const on=(UI.pwFilterTypes||[]).includes(val);return `<button type="button" data-action="toggle-pw-filter-opt" data-fkind="type" data-fval="${val}" class="inline-flex items-center gap-1.5 px-2.5 py-1.5 sm:py-1 rounded-lg border cursor-pointer select-none transition-colors min-w-0 max-w-full text-left ${on?'bdr-acc bg-acc-soft text-acc font-extrabold':'bdr-line bg-black/20 hover:border-sky-400/50'}"><span class="text-xs leading-none shrink-0">${on?'☑':'☐'}</span><span class="min-w-0 truncate">${lbl}</span></button>`;}).join('')}
        </div>
        ${(!onlyPw&&!onlyAugs)?`<button type="button" data-action="toggle-pw-filter-linked" data-tip="Wenn aktiv, werden verknüpfte Augmente einer passenden Hauptkraft direkt darunter mitangezeigt (statt ausgeblendet zu werden)" class="inline-flex items-start sm:items-center gap-1.5 px-2.5 py-1.5 sm:py-1 rounded-lg border cursor-pointer select-none transition-colors text-left min-w-0 max-w-full whitespace-normal leading-snug ${UI.pwFilterIncludeLinkedAugs?'border-amber-400/60 bg-amber-500/15 text-amber-300 font-extrabold':'bdr-line bg-black/20 t-mut hover:border-amber-400/50'}"><span class="text-xs leading-none shrink-0 mt-0.5 sm:mt-0">${UI.pwFilterIncludeLinkedAugs?'☑':'☐'}</span><span class="min-w-0 break-words">Gebundene Augmente bei passenden Kräften mitzeigen</span></button>`:''}
      </div>
    </div>
    <div class="space-y-1.5 min-w-0">
      <div class="text-[11px] font-extrabold t-mut uppercase tracking-wider">Hauptaktionsart (${DEF_MAIN_ARTS.length})</div>
      <div class="grid grid-cols-2 sm:flex sm:flex-wrap gap-1.5 min-w-0">${DEF_MAIN_ARTS.map(a=>{const on=(UI.pwFilterArts||[]).includes(a);return `<button type="button" data-action="toggle-pw-filter-opt" data-fkind="art" data-fval="${esc(a)}" data-tip="${esc(getPwTermTip(a))}" class="inline-flex items-center gap-1.5 px-2.5 py-1.5 sm:py-1 rounded-lg border cursor-pointer select-none transition-colors min-w-0 max-w-full text-left ${on?'bdr-acc bg-acc-soft text-acc font-extrabold':'bdr-line bg-black/20 hover:border-sky-400/50'}"><span class="text-xs leading-none shrink-0">${on?'☑':'☐'}</span><span class="min-w-0 truncate">${esc(a)}</span></button>`;}).join('')}</div>
    </div>
    <div class="space-y-1.5 pt-1 border-t bdr-line min-w-0">
      <div class="text-[11px] font-extrabold t-mut uppercase tracking-wider">Aktionsunterarten (${DEF_ACTION_SUBS.length})</div>
      <div class="grid grid-cols-2 sm:flex sm:flex-wrap gap-1.5 min-w-0">${DEF_ACTION_SUBS.map(asub=>{const on=(UI.pwFilterActionSubs||[]).includes(asub);return `<button type="button" data-action="toggle-pw-filter-opt" data-fkind="asub" data-fval="${esc(asub)}" data-tip="${esc(getPwTermTip(asub))}" class="inline-flex items-center gap-1.5 px-2.5 py-1.5 sm:py-1 rounded-lg border cursor-pointer select-none transition-colors min-w-0 max-w-full text-left ${on?'bdr-acc bg-acc-soft text-acc font-extrabold':'bdr-line bg-black/20 hover:border-sky-400/50'}"><span class="text-xs leading-none shrink-0">${on?'☑':'☐'}</span><span class="min-w-0 truncate">${esc(asub)}</span></button>`;}).join('')}</div>
    </div>
    <div class="space-y-1.5 pt-1 border-t bdr-line min-w-0">
      <div class="text-[11px] font-extrabold t-mut uppercase tracking-wider">Lernkosten-Stufe</div>
      <div class="grid grid-cols-2 sm:flex sm:flex-wrap gap-1.5 min-w-0">${Object.entries(PW_TIERS).map(([k,t])=>{const on=(UI.pwFilterTiers||[]).includes(k), tCls=PW_TIER_BADGE_CLS[k]||'bdr-acc bg-acc-soft text-acc';return `<button type="button" data-action="toggle-pw-filter-opt" data-fkind="tier" data-fval="${esc(k)}" data-tip="${esc(t.full)}" class="inline-flex items-center gap-1.5 px-2.5 py-1.5 sm:py-1 rounded-lg border cursor-pointer select-none transition-colors min-w-0 max-w-full text-left ${on?`${tCls} font-extrabold`:'bdr-line bg-black/20 hover:border-sky-400/50'}"><span class="text-xs leading-none shrink-0">${on?'☑':'☐'}</span><span class="min-w-0 truncate">${esc(t.l)}</span></button>`;}).join('')}</div>
    </div>
    ${allPwTags.length?`<div class="space-y-1.5 pt-1 border-t bdr-line min-w-0">
      <div class="text-[11px] font-extrabold t-mut uppercase tracking-wider">Tags (${allPwTags.length})</div>
      <div class="flex flex-wrap gap-1.5 min-w-0">${allPwTags.map(tg=>{const on=(UI.pwFilterTags||[]).includes(tg), tTip=getPwTermTip(tg);return `<button type="button" data-action="toggle-pw-filter-opt" data-fkind="tag" data-fval="${esc(tg)}" ${tTip?`data-tip="${esc(tTip)}"`:''} class="inline-flex items-center gap-1.5 px-2.5 py-1.5 sm:py-1 rounded-lg border cursor-pointer select-none transition-colors min-w-0 max-w-full text-left ${on?'bdr-acc bg-acc-soft text-acc font-extrabold':'bdr-line bg-black/20 hover:border-sky-400/50'}"><span class="text-xs leading-none shrink-0">${on?'☑':'☐'}</span><span class="min-w-0 break-words">${esc(tg)}</span></button>`;}).join('')}</div>
    </div>`:''}
  </div>`:'';
  const rawRootSecs=S.powerSections.filter(s=>!s.parentSectionId||!S.powerSections.some(p=>p.id===s.parentSectionId));
  const rootSecs=fAct&&!onlyAugs?rawRootSecs.filter(s=>secHasFilteredPowers(s.id)):rawRootSecs;
  const onlyAugsLinked=onlyAugs?S.powers.flatMap(p=>getLinkedAugs(p.id)).filter(ag=>matchesPwItemFilter(ag,'augment')):[];
  const isViewMode=UI.pwMode!=='edit';
  const listSpaceCls=isViewMode?'space-y-1.5':'space-y-2.5';
  const modeToggleHtml=`<div class="inline-flex items-center rounded-lg p-0.5 bg-black/25 border bdr-line text-xs shrink-0" role="group" aria-label="Kräfte-Darstellungsmodus">
    <button type="button" data-action="set-pw-mode" data-mode="view" aria-pressed="${isViewMode?'true':'false'}" data-tip="Kompakte Lese- &amp; Spielansicht (einzelne Karten per ✏️ bearbeitbar)" class="px-2.5 py-1 rounded-md font-extrabold transition-colors whitespace-nowrap ${isViewMode?'btn-pri':'t-mut hover:text-acc'}">👁️ Ansicht</button>
    <button type="button" data-action="set-pw-mode" data-mode="edit" aria-pressed="${!isViewMode?'true':'false'}" data-tip="Vollständiger Bearbeitungsmodus mit allen Eingabefeldern &amp; Baukasten" class="px-2.5 py-1 rounded-md font-extrabold transition-colors whitespace-nowrap ${!isViewMode?'btn-pri':'t-mut hover:text-acc'}">✏️ Bearbeiten</button>
  </div>`;
  const onlyAugsListHtml=onlyAugs&&(onlyAugsLinked.length||unlinked.length)?`<section class="${isViewMode?'space-y-2':'space-y-3'}">
    <div class="flex flex-wrap items-center justify-between gap-2 px-1">
      <h3 class="text-sm font-extrabold text-amber-400">Augmente – Trefferliste (${onlyAugsLinked.length+unlinked.length})</h3>
      <span class="text-[11px] t-mut tabular">${onlyAugsLinked.length} gebunden • ${unlinked.length} ungebunden</span>
    </div>
    ${onlyAugsLinked.length?`<div class="${listSpaceCls}">${onlyAugsLinked.map(ag=>{
      const sibs=getLinkedAugs(ag.parentPowerId);
      return renderPwItem('augment',ag,sibs.indexOf(ag),sibs.length,{...pwCtx,showParentBadge:true});
    }).join('')}</div>`:''}
    ${unlinked.length?`<div class="${listSpaceCls} ${onlyAugsLinked.length?'pt-2':''}">${onlyAugsLinked.length?`<div class="text-xs font-extrabold text-amber-400/90 px-1">Ungebundene Augmente (${unlinked.length})</div>`:''}${unlinked.map((ag,ai)=>renderPwItem('augment',ag,ai,unlinked.length,{...pwCtx,showSecBadge:true})).join('')}</div>`:''}
  </section>`:'';
  return `<section class="card space-y-3"><div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3"><div class="flex flex-wrap items-center gap-3 min-w-0"><div><h2 class="text-base sm:text-lg font-extrabold cursor-help" data-tip="Erstelle beliebige Sektionen (Ordner), ziehe Kräfte am Viereck ⠿ hinein oder sammle Kräfte nach Art.\nÜber 🎨 (Textfarbe) und 🪟 (Fensterfarbe) lassen sich Kräfte, Augmente und Sektionen frei einfärben.">Kräfte &amp; Augmente</h2><p class="text-xs t-mut">Aktuelle Kosten: <strong id="pwSummaryHdr" class="text-acc">${P.pwSp} SP${P.pwMsp?` + ${P.pwMsp} MsP`:''}</strong></p></div>${modeToggleHtml}</div><div class="flex flex-wrap items-center gap-2"><button type="button" data-action="toggle-pw-filter" data-tip="Kräfte &amp; Augmente nach Typ, Hauptaktionsart, Aktionsunterarten, Lernkosten-Stufe oder Tags live filtern" class="btn py-1 px-2.5 text-xs ${(UI.pwFilterOpen||fAct)?'bdr-acc bg-acc-soft text-acc font-extrabold':''}">🔍 Filter${fAct?` (${fCnt})`:''} ${UI.pwFilterOpen?'▴':'▾'}</button>${fAct&&!UI.pwFilterOpen?`<button type="button" data-action="reset-pw-filter" data-tip="Aktiven Kräfte-Filter zurücksetzen" class="btn btn-err py-1 px-2 text-xs">✕</button>`:''}${hasAny?`<button type="button" data-action="collapse-all-pw" data-val="1" class="btn py-1 px-2.5 text-xs">▸ Alle einklappen</button><button type="button" data-action="collapse-all-pw" data-val="0" class="btn py-1 px-2.5 text-xs">▾ Alle ausklappen</button>`:''}<button type="button" data-action="open-pw-library" data-tip="Server-Bibliothek durchsuchen, Basisaktionen abrufen oder lokale .json-Pakete importieren" class="btn bg-acc-soft bdr-acc text-acc">📚 Bibliothek / Import</button><button type="button" data-action="export-pw-all" data-tip="Alle Kräfte, Augmente &amp; Sektionen als .json-Paket herunterladen" class="btn">📤 Export</button><button type="button" data-action="add-pw-section" class="btn bg-acc-soft bdr-acc text-acc">+ Sektion</button><button type="button" data-action="add-power" class="btn btn-pri">+ Kraft</button><button type="button" data-action="add-augment" class="btn border-amber-400 text-amber-500">+ Freies Augment</button></div></div>${filterMenuHtml}${activeTagsHtml}</section>
  ${!hasAny?`<div class="card text-center py-8 space-y-2.5 text-xs t-mut"><div class="font-extrabold text-sm text-acc">Noch keine Sektionen, Kräfte oder Augmente vorhanden.</div><div>Über die Bibliothek kannst du bei Bedarf Basisaktionen, Vorlagen vom Server oder eigene .json-Pakete importieren.</div><div class="pt-1"><button type="button" data-action="open-pw-library" class="btn btn-pri py-1.5 px-3.5 text-xs">📚 Bibliothek / Import öffnen</button></div></div>`:''}
  ${fAct&&totalMatchedCnt===0?`<div class="card text-center py-8 space-y-2 text-xs t-mut"><div class="font-extrabold text-sm text-acc">Keine Kräfte oder Augmente mit Überschneidung zum gewählten Filter gefunden.</div><div>Passe die Filterauswahl oben an oder setze den Filter zurück.</div><div><button type="button" data-action="reset-pw-filter" class="btn btn-pri py-1 px-3 text-xs mt-1">↺ Filter zurücksetzen</button></div></div>`:''}
  ${onlyAugs?onlyAugsListHtml:`${rootSecs.length?`<div class="${isViewMode?'space-y-2.5':'pw-sec-list'}">${rootSecs.map((sec,sIdx)=>(isViewMode?'':renderPwSecSlot('',sec.id))+renderPwSection(sec,sIdx,rootSecs.length,0,pwCtx)).join('')}${isViewMode?'':renderPwSecSlot('','')}</div>`:''}
  ${unsecPowers.length?`<div data-pw-sec="" class="${isViewMode?'space-y-2':'space-y-5'} ${rootSecs.length?'pt-2':''}">${S.powerSections.length?`<div class="flex items-center justify-between px-1"><h3 class="text-sm font-extrabold t-mut">Kräfte ohne Sektion (${fAct?`${unsecPowers.length}/${allUnsecPowers.length}`:unsecPowers.length})</h3>${isViewMode?'':'<span class="text-[11px] t-mut">Hierher ziehen zum Herauslösen aus einer Sektion</span>'}</div>`:''}${renderPwGroupList(unsecPowers,pwCtx)}</div>`:(S.powerSections.length&&(S.powers.length||S.augments.length)&&!fAct&&(!isViewMode||(!rootUnlinked.length&&allUnlinked.length&&!isMobileLayout()))?`<div data-pw-sec="" class="subcard border-dashed text-center py-3 text-xs t-mut">Hierher ziehen, um eine Kraft oder ein freies Augment aus einer Sektion herauszulösen</div>`:'')}
  ${rootUnlinked.length?`<section data-pw-sec="" class="${isViewMode?'space-y-1.5':'space-y-3'} pt-2"><h3 class="text-sm font-extrabold text-amber-400 px-1">${S.powerSections.length?'Freie Augmente ohne Sektion':'Ungebundene Augmente'} (${fAct?`${rootUnlinked.length}/${allRootUnlinked.length}`:rootUnlinked.length})</h3>${rootUnlinked.map((ag,ai)=>renderPwItem('augment',ag,ai,rootUnlinked.length,pwCtx)).join('')}</section>`:''}`}`;
}

function buildPwCatPillsHtml(){
  const st={marginal:{c:0,sp:0,m:0},fundamental:{c:0,sp:0,m:0},exzeptionell:{c:0,sp:0,m:0},grandios:{c:0,sp:0,m:0}};
  [...S.powers,...S.augments].filter(it=>it.tier!=='basisaktion').forEach(it=>{const k=PW_TIERS[it.tier]?it.tier:'marginal',c=calcPwCost(it);if(!st[k])st[k]={c:0,sp:0,m:0};st[k].c++;st[k].sp+=c.sp;st[k].m+=c.msp;});
  return Object.entries(PW_TIERS).filter(([k])=>k!=='basisaktion').map(([k,t])=>`<span class="rounded-lg border py-1 px-2.5 text-[11px] font-bold inline-flex items-center gap-1.5 tabular ${PW_TIER_BADGE_CLS[k]||''}"><strong>${esc(t.l)}:</strong> ${st[k].c}× (${st[k].sp} SP${st[k].m?` + ${st[k].m} MsP`:''})</span>`).join('');
}

function moveChrSecOrder(secKey,dir){
  if(!Array.isArray(S.chrSecOrder)||S.chrSecOrder.length!==3) S.chrSecOrder=[...DEF_CHR_SEC_ORDER];
  const i=S.chrSecOrder.indexOf(secKey), ni=i+Number(dir);
  if(i<0||ni<0||ni>=S.chrSecOrder.length) return false;
  const [it]=S.chrSecOrder.splice(i,1); S.chrSecOrder.splice(ni,0,it);
  renderMain(); save(); return true;
}
function moveChrPwOrder(kind,id,dir){
  const arr=kind==='augment'?S.augments:S.powers;
  const vis=arr.filter(x=>x&&x.tier!=='basisaktion');
  const vi=vis.findIndex(x=>x.id===id), tSib=vis[vi+Number(dir)];
  if(vi<0||!tSib) return false;
  const i1=arr.indexOf(vis[vi]), i2=arr.indexOf(tSib);
  if(i1<0||i2<0) return false;
  arr[i1]=tSib; arr[i2]=vis[vi];
  renderMain(); save(); return true;
}
function openChrSecMenu(anchorEl,secKey,forceOpen=false){
  const ord=Array.isArray(S.chrSecOrder)&&S.chrSecOrder.length===3?S.chrSecOrder:DEF_CHR_SEC_ORDER;
  const secIdx=ord.indexOf(secKey);
  const meta=S.chrSecMeta?.[secKey]||{collapsed:false,color:'',bgColor:''};
  const titles={training:'⚡ Training',skills:'🎯 Fertigkeiten',powers:'✨ Kräfte & Augmente'};
  const items=[
    {type:'label',label:'Fenster sortieren'},
    {
      icon:'▲',label:'Fenster nach oben',disabled:secIdx<=0,keepOpen:true,
      onClick:()=>{
        if(moveChrSecOrder(secKey,-1)){
          const fresh=document.querySelector(`[data-action="open-chrsec-menu"][data-sec="${secKey}"]`);
          openChrSecMenu(fresh||anchorEl,secKey,true);
        }
      }
    },
    {
      icon:'▼',label:'Fenster nach unten',disabled:secIdx<0||secIdx>=ord.length-1,keepOpen:true,
      onClick:()=>{
        if(moveChrSecOrder(secKey,1)){
          const fresh=document.querySelector(`[data-action="open-chrsec-menu"][data-sec="${secKey}"]`);
          openChrSecMenu(fresh||anchorEl,secKey,true);
        }
      }
    },
    {sep:true},
    {type:'label',label:'Darstellung'},
    {icon:'🎨',label:'Textfarbe des Fensters',badge:meta.color?'●':'',action:'open-chrsec-color',dataset:{sec:secKey,cmode:'text'}},
    {icon:'🪟',label:'Fensterfarbe (Hintergrund)',badge:meta.bgColor?'●':'',action:'open-chrsec-color',dataset:{sec:secKey,cmode:'bg'}},
    {icon:meta.collapsed?'▾':'▸',label:meta.collapsed?'Fenster ausklappen':'Fenster einklappen',action:'toggle-chrsec-collapse',dataset:{sec:secKey}}
  ];
  if(secKey==='training'){
    const hasTrained=ATTRS.some(a=>TR_DEFS.some(b=>S.attributes[a.k].tr[b.i]));
    if(hasTrained){
      items.push({sep:true});
      items.push({type:'label',label:'Trainingsstufen'});
      items.push({icon:'▾',label:'Alle Stufen aufklappen',action:'toggle-all-tr-grp',dataset:{val:'1'}});
      items.push({icon:'▸',label:'Alle Stufen zuklappen',action:'toggle-all-tr-grp',dataset:{val:'0'}});
    }
  }else if(secKey==='skills'){
    if(S.skills.length>1){
      items.push({sep:true});
      items.push({icon:'⇅',label:'Fertigkeiten A–Z sortieren',action:'sort-skills-az'});
    }
  }else if(secKey==='powers'){
    items.push({sep:true});
    items.push({type:'label',label:'Einträge hinzufügen'});
    items.push({icon:'✨',label:'Neue Kraft anlegen',action:'add-power'});
    items.push({icon:'🧩',label:'Neues Augment anlegen',action:'add-augment'});
  }
  openCtxMenu({
    key:`chrsec-menu:${secKey}`,
    title:titles[secKey]||'Chronik-Fenster',
    anchorEl,
    align:'right',
    minWidth:245,
    forceOpen,
    items
  });
}
function openChrPwMenu(anchorEl,kind,id,forceOpen=false){
  const arr=kind==='augment'?S.augments:S.powers;
  const it=arr.find(x=>x.id===id); if(!it) return;
  const vis=arr.filter(x=>x&&x.tier!=='basisaktion');
  const idx=vis.findIndex(x=>x.id===id);
  const c=calcPwCost(it), isGift=Boolean(it.manualCost&&c.sp===0&&c.msp===0);
  const isDelConfirm=UI.confirmDelId===id;
  const dispName=String(it.name||'').trim()||(kind==='augment'?'Augment':'Kraft');
  const items=[
    {type:'label',label:'Reihenfolge'},
    {
      icon:'▲',label:'Nach oben',disabled:idx<=0,keepOpen:true,
      onClick:()=>{
        if(moveChrPwOrder(kind,id,-1)){
          const fresh=findVisibleBtn(`[data-action="open-chrpw-menu"][data-kind="${kind}"][data-id="${id}"]`);
          openChrPwMenu(fresh||anchorEl,kind,id,true);
        }
      }
    },
    {
      icon:'▼',label:'Nach unten',disabled:idx<0||idx>=vis.length-1,keepOpen:true,
      onClick:()=>{
        if(moveChrPwOrder(kind,id,1)){
          const fresh=findVisibleBtn(`[data-action="open-chrpw-menu"][data-kind="${kind}"][data-id="${id}"]`);
          openChrPwMenu(fresh||anchorEl,kind,id,true);
        }
      }
    },
    {sep:true},
    {type:'label',label:'Darstellung & Kosten'},
    {icon:'🎨',label:'Textfarbe',badge:it.color?'●':'',action:'open-pw-color',dataset:{kind,id,cmode:'text'}},
    {icon:'🪟',label:'Fensterfarbe',badge:it.bgColor?'●':'',action:'open-pw-color',dataset:{kind,id,cmode:'bg'}},
    {
      icon:'🎁',
      label:isGift?'Geschenkt aktiv (Standardkosten)':'Als geschenkt setzen (0 SP)',
      active:isGift,
      action:'gift-pw',
      dataset:{kind,id}
    },
    {sep:true}
  ];
  if(isDelConfirm){
    items.push({
      icon:'⚠️',label:'Wirklich entfernen? (2/2)',sub:`„${dispName}“ dauerhaft löschen`,danger:true,
      action:'confirm-del-pw',dataset:{kind,id}
    });
    items.push({
      icon:'↩️',label:'Abbrechen',keepOpen:true,
      onClick:()=>{UI.confirmDelId=null;openChrPwMenu(anchorEl,kind,id,true);}
    });
  }else{
    items.push({
      icon:'🗑️',label:'Entfernen',danger:true,keepOpen:true,
      onClick:()=>{UI.confirmDelId=id;openChrPwMenu(anchorEl,kind,id,true);}
    });
  }
  openCtxMenu({
    key:`chrpw-menu:${kind}:${id}`,
    title:dispName,
    anchorEl,
    align:'right',
    minWidth:240,
    forceOpen,
    items,
    onClose:()=>{if(UI.confirmDelId===id)UI.confirmDelId=null;}
  });
}

function renderChrSection(secKey,secIdx,totalSecs,P,activeTrRows,trainedAttrCnt,allPw){
  const meta=S.chrSecMeta?.[secKey]||{collapsed:false,color:'',bgColor:''};
  const colStyle=meta.color?`style="color:${esc(meta.color)}"`:'', winStyle=cardColorStyle(meta);
  const hdrCommon=(titleHtml,tipTxt,rightHtml)=>`<div class="flex flex-wrap items-center justify-between gap-2 ${meta.collapsed?'':'border-b bdr-line pb-2'}">
    <div class="flex items-center gap-1.5 min-w-0">
      <button type="button" data-action="toggle-chrsec-collapse" data-sec="${secKey}" data-tip="${meta.collapsed?'Fenster ausklappen':'Fenster einklappen'}" class="btn w-8 h-8 sm:w-7 sm:h-7 p-0 text-xs font-black shrink-0">${meta.collapsed?'▸':'▾'}</button>
      <span draggable="true" data-drag-chrsec="${secKey}" data-tip="Ziehen zum Verschieben des Fensters" class="w-7 h-7 rounded bg-acc-soft border bdr-acc text-acc text-xs font-black cursor-grab select-none shrink-0 inline-flex items-center justify-center">⠿</span>
      <h3 class="text-base font-extrabold cursor-help truncate" ${colStyle} data-tip="${tipTxt}">${titleHtml}</h3>
    </div>
    <div class="flex flex-wrap items-center gap-1.5 shrink-0">
      ${rightHtml}
      <button type="button" data-action="open-chrsec-menu" data-sec="${secKey}" aria-haspopup="menu" aria-expanded="false" aria-label="Fenster-Aktionen für ${secKey}" data-tip="Sortieren (▲/▼), Farben &amp; Fenster-Aktionen" class="btn w-9 h-9 sm:w-8 sm:h-8 p-0 text-base font-black shrink-0">⋮</button>
    </div>
  </div>`;

  if(secKey==='training'){
    return `<section data-chrsec="training" class="card space-y-3" ${winStyle}>
      ${hdrCommon('Training','Block 1 & 2: je 2 SP (+5)\nBlock 3 & 4: je 3 SP (+5)\nBlock 5: 5 SP + 1 MsP (+10)\nIn der Tabelle pro Attribut zusammengefasst; per Klick auf ▸ lassen sich die einzelnen Stufen aufklappen & editieren.',`<span id="chrTrBadge" class="pill cursor-default text-acc tabular">${P.trSp} SP | ${P.trMsp||'-'} MsP</span>`)}
      ${!meta.collapsed?`<div class="t4-tr-grid grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">${ATTRS.map(a=>`<div class="subcard p-2.5 space-y-1.5 min-w-0" style="--ac:${getAttrCol(a.k)}"><div class="flex justify-between text-xs font-extrabold"><span style="color:${getAttrCol(a.k)}">${a.k}</span><span class="tabular">+${getTrBonus(a.k)}</span></div>${renderTrPairs(a.k,a.n,'Steigerungschronik')}</div>`).join('')}</div>
      <div class="overflow-x-auto"><table class="tbl r-tbl text-xs sm:text-sm tabular"><thead><tr><th class="text-left">Attribut / Stufe</th><th class="text-center">Bonus</th><th class="text-center">SP (Summe / editierbar)</th><th class="text-center">MsP</th><th class="text-center">Status</th><th class="text-left">Notizen &amp; Details</th></tr></thead><tbody>${activeTrRows.length?activeTrRows.join(''):`<tr><td colspan="6" class="text-center justify-center text-xs t-mut py-3">Keine Trainingsblöcke aktiv.</td></tr>`}</tbody></table></div>`:''}
    </section>`;
  }
  if(secKey==='skills'){
    return `<section data-chrsec="skills" class="card space-y-3" ${winStyle}>
      ${hdrCommon('Fertigkeiten','Marginal: 1/1/2/2+MsP\nFundamental: 2/2/3/3+MsP\nGrandios: 3/2/3/4+MsP\nSP & MsP sind direkt in der Tabelle überschreibbar (z.B. 0 für geschenkte Fertigkeit).',`<span id="chrSkBadge" class="pill cursor-default text-emerald-500 tabular">${P.skSp} SP | ${P.skMsp||'-'} MsP</span>`)}
      ${!meta.collapsed?`<form id="formAddSkillChron" class="subcard grid grid-cols-2 sm:grid-cols-12 gap-2 items-end"><div class="col-span-2 sm:col-span-3 min-w-0"><label class="block text-[11px] font-bold t-mut mb-1">Fertigkeit</label><input id="skNameChr" type="text" placeholder="z.B. Etikette (Vhendris)" class="inp w-full"/></div><div class="col-span-1 sm:col-span-2 min-w-0"><label class="block text-[11px] font-bold t-mut mb-1">Attribut</label><select id="skAttrChr" class="inp w-full font-bold">${skAttrOpts('PR')}</select></div><div class="col-span-1 sm:col-span-3 min-w-0"><label class="block text-[11px] font-bold t-mut mb-1">Kategorie</label><select id="skCatChr" class="inp w-full font-semibold">${skCatOpts('fundamental')}</select></div><div class="col-span-1 sm:col-span-2 min-w-0"><label class="block text-[11px] font-bold t-mut mb-1">Grad</label><select id="skRankChr" class="inp w-full font-semibold">${SK_RANKS.map(r=>`<option value="${r.r}" ${r.r===1?'selected':''}>${r.n} (+${r.b})</option>`).join('')}</select></div><div class="col-span-1 sm:col-span-2"><button type="submit" class="btn btn-ok w-full py-2 sm:py-1.5">Speichern</button></div></form>
      ${skMobileSortBar([['name','Name'],['attr','Attribut'],['cat','Kategorie'],['rank','Grad'],['sp','SP'],['msp','MsP']])}<div class="overflow-x-auto max-w-full min-w-0"><table class="tbl r-tbl md:min-w-[780px] text-xs sm:text-sm tabular"><thead><tr><th class="text-left">${skSortBtn('name','Fertigkeit','text-left','Alphabetisch sortieren (auf-/absteigend)')}</th><th class="text-left">${skSortBtn('attr','Attribut','text-left','Nach Attribut &amp; höchstem Wert zuerst sortieren')}</th><th class="text-left">${skSortBtn('cat','Kategorie','text-left','Nach Kategorie sortieren')}</th><th class="text-left">${skSortBtn('rank','Grad &amp; Bonus (Overwrite)','text-left','Nach Grad sortieren (klein nach groß / groß nach klein)')}</th><th class="text-center">${skSortBtn('sp','SP (editierbar)','text-center','Nach SP-Kosten sortieren')}</th><th class="text-center">${skSortBtn('msp','MsP','text-center','Nach MsP-Kosten sortieren')}</th><th class="text-left">Notizen</th><th class="w-10"></th></tr></thead><tbody>${renderSkillRows(true)}</tbody></table></div>`:''}
    </section>`;
  }
  return `<section data-chrsec="powers" class="card space-y-3" ${winStyle}>
    ${hdrCommon('Kräfte &amp; Augmente','Marginal (Options): 1 SP • Fundamental (Core): 2 SP • Exzeptionell (Ace): 3 SP • Grandios (Game Changer): 3 SP + 1 MsP\nNutze das ⋮-Menü oder auf dem Desktop ⠿ zum Sortieren.',`<button type="button" data-action="add-power" class="btn py-1 px-2 text-xs">+ Kraft</button><button type="button" data-action="add-augment" class="btn py-1 px-2 text-xs border-amber-400/60 text-amber-500">+ Augment</button><span id="chrPwBadge" class="pill cursor-default text-acc tabular">${P.pwSp} SP | ${P.pwMsp||'-'} MsP</span>`)}
    ${!meta.collapsed?`<div id="chrPwCats" class="flex flex-wrap gap-2">${buildPwCatPillsHtml()}</div>
    <div class="overflow-x-auto max-w-full min-w-0"><table class="tbl r-tbl md:min-w-[760px] text-xs sm:text-sm tabular"><thead><tr><th class="text-left w-40">⠿ Typ</th><th class="text-left">Name</th><th class="text-left w-60">Kategorie</th><th class="text-center w-24">SP</th><th class="text-center w-24">MsP</th><th class="text-right w-32">Status</th></tr></thead><tbody>${allPw.length?allPw.map(({kind,lbl,it})=>{const c=calcPwCost(it),isAug=kind==='augment',par=isAug&&it.parentPowerId?S.powers.find(p=>p.id===it.parentPowerId):null;const pwMenuMob=`<button type="button" data-action="open-chrpw-menu" data-kind="${kind}" data-id="${it.id}" aria-haspopup="menu" aria-expanded="false" aria-label="Aktionen für ${esc(it.name||lbl)}" data-tip="Sortieren (▲/▼), Farben, Geschenkt &amp; Löschen" class="btn md:hidden w-9 h-9 p-0 text-base font-black shrink-0">⋮</button>`;const pwMenuDesk=`<button type="button" data-action="open-chrpw-menu" data-kind="${kind}" data-id="${it.id}" aria-haspopup="menu" aria-expanded="false" aria-label="Aktionen für ${esc(it.name||lbl)}" data-tip="Sortieren (▲/▼), Farben, Geschenkt &amp; Löschen" class="btn hidden md:inline-flex w-8 h-8 p-0 text-sm font-black shrink-0">⋮</button>`;return `<tr data-chr-pw="${kind}:${it.id}" ${it.bgColor?`style="background:color-mix(in srgb,${esc(it.bgColor)} 22%,transparent)"`:''}><td class="r-card-hdr"><div class="flex items-center justify-between gap-2 w-full min-w-0"><div class="flex items-center gap-1.5 min-w-0"><span draggable="true" data-drag-chr-pw="${kind}:${it.id}" data-tip="Ziehen zum Sortieren in der Steigerungschronik" class="px-1.5 py-0.5 rounded bg-black/20 border bdr-line t-mut text-xs font-black cursor-grab select-none shrink-0">⠿</span><div class="min-w-0"><span class="px-2 py-0.5 rounded text-[10px] font-black ${isAug?'bg-amber-500/15 text-amber-400 border border-amber-500/40':'bg-acc-soft text-acc border bdr-acc'}">${lbl}</span>${par?`<div class="text-[10px] t-mut truncate mt-0.5 max-w-[180px] md:max-w-[110px]">↳ ${esc(par.name||'Kraft')}</div>`:''}</div></div>${pwMenuMob}</div></td><td data-lbl="Name"><input data-pwf="${kind}:${it.id}:name" type="text" value="${esc(it.name)}" ${it.color?`style="color:${esc(it.color)}"`:''} placeholder="Unbenannt..." class="inp-line w-full min-w-0 text-right md:text-left font-bold"/></td><td data-lbl="Kategorie"><div class="min-w-0 flex-1 md:flex-none md:w-full">${renderPwCostSelect(kind,it)}</div></td><td data-lbl="SP" class="text-center"><input data-pwcost="${kind}:${it.id}:sp" type="text" inputmode="numeric" value="${c.sp}" class="inp w-16 text-center py-1 md:py-0.5 px-1 font-extrabold ${it.manualCost?'!border-amber-400 text-amber-300':''}"/></td><td data-lbl="MsP" class="text-center"><input data-pwcost="${kind}:${it.id}:msp" type="text" inputmode="numeric" value="${c.msp}" class="inp w-16 text-center py-1 md:py-0.5 px-1 font-extrabold ${c.msp?'text-amber-400':''}"/></td><td data-lbl="Status" class="text-right"><div class="inline-flex items-center justify-end gap-1.5"><button type="button" data-action="gift-pw" data-kind="${kind}" data-id="${it.id}" data-tip="${it.manualCost&&c.sp===0&&c.msp===0?'Geschenkt aktiv (0 SP) – Klicken für Standardkosten':'Geschenkt (0 SP) – Toggle'}" class="btn py-1 md:py-0.5 px-2 md:px-1.5 text-xs md:text-[10px] ${it.manualCost&&c.sp===0&&c.msp===0?'btn-ok':''}">🎁</button>${it.manualCost?`<span class="text-[10px] font-extrabold text-amber-400">Manuell</span>`:''}${pwMenuDesk}</div></td></tr>`;}).join(''):`<tr><td colspan="6" class="text-center justify-center text-xs t-mut py-3">Keine Kräfte oder Augmente vorhanden.</td></tr>`}</tbody></table></div>`:''}
  </section>`;
}

function tplChronicle(){
  const P=calcProg(), activeTrRows=[];
  let trainedAttrCnt=0;
  ATTRS.forEach(a=>{
    const actBlocks=TR_DEFS.filter(b=>S.attributes[a.k].tr[b.i]);
    if(!actBlocks.length) return;
    trainedAttrCnt++;
    const col=getAttrCol(a.k), sumBon=getTrBonus(a.k), isExp=Boolean(S.chrTrExpanded?.[a.k]);
    let sumSp=0, sumMsp=0, sumDefSp=0, sumDefMsp=0, anyManual=false, allGift=true;
    actBlocks.forEach(b=>{
      const tc=getTrCost(a.k,b.i);
      sumSp+=tc.sp; sumMsp+=tc.msp; sumDefSp+=tc.defSp; sumDefMsp+=tc.defMsp;
      if(tc.manual) anyManual=true;
      if(!(tc.manual&&tc.sp===0&&tc.msp===0)) allGift=false;
    });
    const rangeLbl=actBlocks.length===1?`Stufe ${actBlocks[0].i+1}`:`Stufe 1–${actBlocks[actBlocks.length-1].i+1} (${actBlocks.length}×)`;
    const notesArr=actBlocks.map(b=>String(S.attributes[a.k].trNotes[b.i]||'').trim()).filter(Boolean);
    const notesPreview=notesArr.length?notesArr.join(' • '):'';
    activeTrRows.push(`<tr class="bg-black/15" style="border-left:3px solid ${col}">
      <td class="r-card-hdr">
        <div class="flex items-center gap-2 min-w-0 w-full">
          <button type="button" data-action="toggle-tr-grp" data-attr="${a.k}" data-tip="${isExp?'Einzelne Stufen einklappen':'Einzelne Stufen aufklappen & bearbeiten'}" class="btn w-8 h-8 md:w-6 md:h-6 p-0 text-xs font-black shrink-0">${isExp?'▾':'▸'}</button>
          <button type="button" data-action="toggle-tr-grp" data-attr="${a.k}" class="text-left flex flex-wrap items-center gap-1.5 hover:opacity-85 min-w-0 flex-1">
            <span class="font-black" style="color:${col}">${a.k}</span>
            <span class="font-extrabold">${a.n}</span>
            <span class="px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-black/25 t-mut">${rangeLbl}</span>
          </button>
        </div>
      </td>
      <td id="trSumBon_${a.k}" data-lbl="Bonus" class="text-center font-black text-acc">+${sumBon}</td>
      <td data-lbl="SP" class="text-center"><span id="trSumSp_${a.k}" data-tip="Summe der SP-Kosten für ${a.n} (Standard: ${sumDefSp} SP)\nKlicke auf ▸ zum Aufklappen der Einzelstufen." class="px-2.5 py-0.5 rounded-lg border text-xs font-black inline-block min-w-[3.5rem] ${anyManual?'border-amber-400/70 bg-amber-500/15 text-amber-300':'bdr-line bg-black/20 text-acc'}">${sumSp} SP</span></td>
      <td data-lbl="MsP" class="text-center"><span id="trSumMsp_${a.k}" class="px-2 py-0.5 rounded-lg text-xs font-black ${sumMsp?'text-amber-400 bg-amber-500/15 border border-amber-400/50':'t-mut'}">${sumMsp||0}</span></td>
      <td data-lbl="Status" class="text-center">
        <div class="inline-flex items-center gap-1.5">
          <button type="button" data-action="gift-tr-attr" data-attr="${a.k}" data-tip="${allGift?`Geschenkt aktiv (0 SP) – Klicken für Standardkosten (${sumDefSp} SP${sumDefMsp?` + ${sumDefMsp} MsP`:''})`:`Alle aktiven Stufen von ${a.n} als geschenkt setzen (0 SP / 0 MsP) – Toggle`}" class="btn py-1 md:py-0.5 px-2 md:px-1.5 text-xs md:text-[10px] ${allGift?'btn-ok':''}">🎁</button>
          ${anyManual?`<span class="text-[10px] font-extrabold text-amber-400">Manuell</span>`:''}
        </div>
      </td>
      <td data-lbl="Notizen">
        <div class="flex items-center justify-end md:justify-between gap-2 min-w-0 flex-1 md:flex-none">
          <span class="text-xs t-mut truncate min-w-0 max-w-[140px] sm:max-w-[240px]">${notesPreview?esc(notesPreview):`<span class="opacity-60 italic">${isExp?'Einzelstufen unten':`${actBlocks.length} ${actBlocks.length===1?'Stufe':'Stufen'}`}</span>`}</span>
          <button type="button" data-action="toggle-tr-grp" data-attr="${a.k}" class="btn py-1 md:py-0.5 px-2 text-[11px] md:text-[10px] shrink-0">${isExp?'▴ Einklappen':`▾ Stufen (${actBlocks.length})`}</button>
        </div>
      </td>
    </tr>`);
    if(isExp){
      actBlocks.forEach(b=>{
        const tc=getTrCost(a.k,b.i);
        activeTrRows.push(`<tr style="border-left:4px solid ${col};background:color-mix(in srgb,${col} 9%,transparent)">
          <td data-lbl="Stufe" class="md:pl-8 font-bold text-xs"><span><span class="t-mut mr-1">↳</span>${a.k} ${b.i+1} <span class="text-[11px] font-normal t-mut">(Stufe ${b.i+1})</span></span></td>
          <td data-lbl="Bonus" class="text-center font-bold text-acc text-xs">+${b.b}</td>
          <td data-lbl="SP" class="text-center"><input data-trcost="${a.k}:${b.i}:sp" type="text" inputmode="numeric" value="${tc.sp}" data-tip="SP-Kosten für ${a.k} Block ${b.i+1} direkt überschreiben (Standard: ${tc.defSp} SP)" class="inp w-16 md:w-14 text-center py-1 md:py-0.5 px-1 font-extrabold ${tc.manual?'!border-amber-400 text-amber-300':''}"/></td>
          <td data-lbl="MsP" class="text-center"><input data-trcost="${a.k}:${b.i}:msp" type="text" inputmode="numeric" value="${tc.msp}" data-tip="MsP-Kosten direkt überschreiben (Standard: ${tc.defMsp} MsP)" class="inp w-16 md:w-14 text-center py-1 md:py-0.5 px-1 font-extrabold ${tc.msp?'text-amber-400':''}"/></td>
          <td data-lbl="Status" class="text-center"><div class="inline-flex items-center gap-1.5"><button type="button" data-action="gift-tr" data-attr="${a.k}" data-idx="${b.i}" data-tip="${tc.manual&&tc.sp===0&&tc.msp===0?`Geschenkt aktiv (0 SP) – Klicken für Standardkosten (${tc.defSp} SP)`:'Als geschenkt setzen (0 SP / 0 MsP) – Toggle'}" class="btn py-1 md:py-0.5 px-2 md:px-1.5 text-xs md:text-[10px] ${tc.manual&&tc.sp===0&&tc.msp===0?'btn-ok':''}">🎁</button>${tc.manual?`<span class="text-[10px] font-extrabold text-amber-400">Manuell</span>`:''}</div></td>
          <td data-lbl="Notiz"><input data-trnote="${a.k}:${b.i}" type="text" value="${esc(S.attributes[a.k].trNotes[b.i])}" placeholder="Notiz zu ${a.k} ${b.i+1}..." class="inp-line w-full min-w-0 text-right md:text-left text-xs"/></td>
        </tr>`);
      });
    }
  });
  const allPw=[...S.powers.filter(p=>p.tier!=='basisaktion').map(p=>({kind:'power',lbl:'Kraft',it:p})),...S.augments.filter(a=>a.tier!=='basisaktion').map(a=>({kind:'augment',lbl:'Augment',it:a}))];
  const ord=Array.isArray(S.chrSecOrder)&&S.chrSecOrder.length===3?S.chrSecOrder:DEF_CHR_SEC_ORDER;
  return `<section class="card space-y-4"><div class="flex flex-wrap items-center justify-between gap-2"><h2 class="text-base sm:text-lg font-extrabold cursor-help" data-tip="Je 100 EP = +1 Stufe (mit Rest-Übertrag)\nPro Stufe = +5 SP • Jede 10. Stufe = +1 MsP">Steigerungschronik – Stufe, EP, SP &amp; MsP</h2><div class="flex flex-wrap gap-1.5"><button type="button" data-action="collapse-all-chr" data-val="1" class="btn py-1 px-2.5 text-xs">▸ Alle Fenster einklappen</button><button type="button" data-action="collapse-all-chr" data-val="0" class="btn py-1 px-2.5 text-xs">▾ Alle Fenster ausklappen</button></div></div>
  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 tabular">
    <div class="subcard flex flex-col justify-between min-w-0"><span class="text-xs font-extrabold t-mut">CHARAKTERSTUFE</span><div class="flex items-center justify-between gap-2 my-2"><button type="button" data-action="lvl-step" data-delta="-1" class="btn w-10 h-10 sm:w-9 sm:h-9 text-base shrink-0">−</button><input id="inpDirectLvl" type="text" inputmode="numeric" value="${P.lvl}" class="inp w-20 min-w-0 text-center text-2xl font-black text-acc py-1"/><button type="button" data-action="lvl-step" data-delta="1" class="btn w-10 h-10 sm:w-9 sm:h-9 text-base shrink-0">+</button></div><div class="text-[11px] t-mut text-center">Basis: ${P.baseSp} SP • ${P.baseMsp} MsP</div></div>
    <div class="subcard flex flex-col justify-between min-w-0"><div class="flex items-center justify-between gap-2"><span class="text-xs font-extrabold text-amber-500 shrink-0">EP (0–99)</span><div class="flex items-center gap-1 text-xs font-bold shrink-0"><input id="inpDirectEp" type="text" inputmode="numeric" value="${S.progression.ep}" class="inp w-16 sm:w-14 text-right py-0.5 px-1.5 font-bold"/><span class="t-mut whitespace-nowrap">/ 100</span></div></div><div class="w-full h-2 rounded-full bg-black/25 overflow-hidden my-2"><div class="h-full accent-bar" style="width:${Math.min(100,Math.max(0,S.progression.ep))}%"></div></div><form id="formAddEp" class="flex items-center gap-1.5"><input id="inpAddEp" type="text" inputmode="numeric" placeholder="+ EP (z.B. 65)" class="inp flex-1 min-w-0 py-1 text-xs font-bold"/><button type="submit" class="btn bg-amber-500 text-slate-950 border-amber-500 shrink-0 whitespace-nowrap">+ EP</button></form></div>
    <div id="chrSpBox" class="subcard flex flex-col justify-between min-w-0 ${P.spRem<0?'!border-rose-500 !bg-rose-500/15 text-rose-500':''}"><span class="text-xs font-extrabold">SP vergeben / übrig</span><div class="my-1"><div class="text-2xl font-black"><span id="chrSpRem">${P.spRem}</span> <span class="text-xs font-bold opacity-75">übrig</span></div><div class="text-xs font-semibold">Vergeben: <strong id="chrSpSpent">${P.spSpent}</strong> / <strong id="chrSpTot">${P.totSp}</strong></div></div><div id="chrSpBreak" class="text-[11px] opacity-75 break-words">Tr: ${P.trSp} • Fert.: ${P.skSp} • Kräfte: ${P.pwSp}${P.spMod?` • <span class="text-emerald-400 font-bold" data-tip="${esc('SP-Mod durch Kraft-Effekte:\n'+P.spModSrc)}">SP-Mod: ${fmtSign(P.spMod)}</span>`:''}</div></div>
    <div id="chrMspBox" class="subcard flex flex-col justify-between min-w-0 ${P.mspRem<0?'!border-rose-500 !bg-rose-500/15 text-rose-500':''}"><span class="text-xs font-extrabold">MsP vergeben / übrig</span><div class="my-1"><div class="text-2xl font-black"><span id="chrMspRem">${P.mspRem}</span> <span class="text-xs font-bold opacity-75">übrig</span></div><div class="text-xs font-semibold">Vergeben: <strong id="chrMspSpent">${P.mspSpent}</strong> / <strong id="chrMspTot">${P.totMsp}</strong></div></div><div id="chrMspBreak" class="text-[11px] opacity-75 break-words">Tr: ${P.trMsp} • Fert.: ${P.skMsp} • Kräfte: ${P.pwMsp}</div></div>
  </div>
  <div class="subcard grid grid-cols-2 md:grid-cols-12 gap-2.5 sm:gap-3 items-end bdr-acc"><div class="col-span-1 md:col-span-3 min-w-0"><label class="block text-xs font-bold text-acc mb-1">Bonus-SP</label><input data-prog="bonusSp" type="text" inputmode="numeric" value="${esc(S.progression.bonusSp)}" class="inp w-full font-extrabold tabular"/></div><div class="col-span-1 md:col-span-3 min-w-0"><label class="block text-xs font-bold text-amber-500 mb-1">Bonus-MsP</label><input data-prog="bonusMsp" type="text" inputmode="numeric" value="${esc(S.progression.bonusMsp)}" class="inp w-full font-extrabold tabular"/></div><div class="col-span-2 md:col-span-6 min-w-0"><label class="block text-xs font-bold t-mut mb-1">Quelle / Notiz</label><input data-prog="bonusNote" type="text" value="${esc(S.progression.bonusNote)}" placeholder="z.B. Volk Mensch (+5 Start-SP)" class="inp w-full"/></div></div></section>
  <div class="space-y-5">
    ${ord.map((secKey,sIdx)=>renderChrSection(secKey,sIdx,ord.length,P,activeTrRows,trainedAttrCnt,allPw)).join('')}
  </div>
  <section class="card space-y-3"><div class="flex flex-wrap items-center justify-between gap-2"><h3 class="text-base font-extrabold">Steigerungschronik-Logbuch</h3>${UI.confirmLog?`<div class="flex flex-wrap gap-1.5"><button type="button" data-action="clear-log-yes" class="btn bg-rose-600 text-white">Endgültig löschen (2/2)</button><button type="button" data-action="clear-log-no" class="btn">Abbrechen</button></div>`:`<button type="button" data-action="clear-log-ask" class="btn btn-err">Logbuch löschen</button>`}</div>
  <form id="formLogNote" class="flex items-center gap-2"><input id="inpLogNote" type="text" placeholder="Eigene Notiz ins Chronik-Log eintragen..." class="inp flex-1 min-w-0"/><button type="submit" class="btn btn-pri shrink-0 whitespace-nowrap">+ Eintrag</button></form>
  <div class="space-y-1.5 max-h-72 overflow-y-auto pr-1">${S.chronicleLog.map(e=>`<div class="subcard py-1.5 px-3 flex flex-col sm:flex-row sm:justify-between gap-1 text-xs min-w-0"><span class="min-w-0 break-words">${esc(e.text)}</span><span class="text-[11px] t-mut tabular shrink-0">${esc(e.ts)}</span></div>`).join('')}</div></section>`;
}

function syncLinkedAmmoDOM(ammoId,sourceEl=null){
  const am=S.ammos.find(a=>a.id===ammoId);
  if(!am) return;
  const dispName=String(am.name||'').trim()||'Unbenannte Munition';
  const qtyStr=String(am.qty);
  document.querySelectorAll(`input[data-amf="${ammoId}:name"]`).forEach(inp=>{if(inp!==sourceEl)inp.value=am.name;});
  document.querySelectorAll(`input[data-amf="${ammoId}:qty"]`).forEach(inp=>{if(inp!==sourceEl)inp.value=qtyStr;});
  document.querySelectorAll(`input[data-amf="${ammoId}:dmgCut"]`).forEach(inp=>{if(inp!==sourceEl)inp.value=am.dmgCut;});
  document.querySelectorAll(`input[data-amf="${ammoId}:dmgPierce"]`).forEach(inp=>{if(inp!==sourceEl)inp.value=am.dmgPierce;});
  document.querySelectorAll(`input[data-amf="${ammoId}:dmgImpact"]`).forEach(inp=>{if(inp!==sourceEl)inp.value=am.dmgImpact;});
  document.querySelectorAll(`input[data-amf="${ammoId}:notes"]`).forEach(inp=>{if(inp!==sourceEl)inp.value=am.notes;});
  document.querySelectorAll(`[data-wp-ammo-lbl="${ammoId}"]`).forEach(el=>{el.textContent=`${dispName} (Vorrat: ${qtyStr})`;});
  document.querySelectorAll(`[data-linked-ammo-name="${ammoId}"]`).forEach(el=>{el.textContent=dispName;});
  document.querySelectorAll(`[data-linked-ammo-qty="${ammoId}"]`).forEach(el=>{el.textContent=qtyStr;});
  ['dmgCut','dmgPierce','dmgImpact'].forEach(df=>{
    document.querySelectorAll(`[data-linked-ammo-dmg="${ammoId}:${df}"]`).forEach(el=>{el.textContent=String(am[df]??'0');});
  });
  const customHtml=renderLinkedAmmoCustomDmgHtml(am.customDmg);
  document.querySelectorAll(`[data-linked-ammo-custom="${ammoId}"]`).forEach(box=>{box.innerHTML=customHtml;});
  const summaryText=`Schnitt ${am.dmgCut} • Durchstoß ${am.dmgPierce} • Einschlag ${am.dmgImpact}${fmtCustomValSummarySuffix(am.customDmg).replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"')}`;
  document.querySelectorAll(`[data-ammo-modal-dmg="${ammoId}"],[data-ammo-collapsed-dmg="${ammoId}"]`).forEach(el=>{el.textContent=summaryText;});
  const tagsHtml=(am.tags||[]).length?am.tags.map(tg=>`<span data-tip="${esc(getTagDesc(S.ammoTagList,tg.name,tg.x))}" class="tag !border-amber-400/45 !bg-amber-500/15 !text-amber-300 cursor-help">${esc(fmtTagLabel(tg.name,tg.x))}</span>`).join(''):'';
  document.querySelectorAll(`[data-linked-ammo-tags="${ammoId}"]`).forEach(box=>{
    box.innerHTML=tagsHtml;
    box.classList.toggle('hidden',!tagsHtml);
  });
}
function syncInvSecNameDOM(secId){
  const sec=(S.invSections||[]).find(s=>s.id===secId);
  if(!sec) return;
  const nm=String(sec.name||'').trim()||'Beutel';
  document.querySelectorAll(`[data-inv-sec-lbl="${secId}"]`).forEach(el=>{el.textContent=`🎒 ${nm}`;});
  document.querySelectorAll(`[data-invsec-parent-lbl="${secId}"]`).forEach(el=>{el.textContent=`↳ in: ${nm}`;});
}
function getInvSecDepth(secId){
  const secs=Array.isArray(S.invSections)?S.invSections:[];
  let d=0, cur=secId, guard=0;
  while(cur&&guard<20){
    const s=secs.find(x=>x.id===cur);
    if(!s||!s.parentSectionId) break;
    cur=s.parentSectionId;
    d++; guard++;
  }
  return d;
}
function getOrderedInvSecsForPicker(){
  const secs=Array.isArray(S.invSections)?S.invSections:[];
  const out=[], visited=new Set();
  const walk=(parentId,depth)=>{
    secs.filter(s=>(s.parentSectionId||'')===parentId).forEach(s=>{
      if(visited.has(s.id)) return;
      visited.add(s.id);
      out.push({sec:s,depth});
      walk(s.id,depth+1);
    });
  };
  walk('',0);
  secs.forEach(s=>{if(!visited.has(s.id))out.push({sec:s,depth:0});});
  return out;
}
function addEqTagToItem(kind,itemId,tagName){
  const k={weapon:'weapons',armor:'armors',ammo:'ammos'}[kind];
  const it=(S[k]||[]).find(x=>x.id===itemId), val=String(tagName||'').trim();
  if(!it||!val) return false;
  if(!Array.isArray(it.tags)) it.tags=[];
  if(it.tags.some(t=>String(t.name||'').toLowerCase()===val.toLowerCase())) return false;
  it.tags.push({name:val,x:'1'});
  if(kind==='weapon'&&val.toLowerCase()==='massiv'){
    it.wAttr='ST';
    if(D.weaponId===it.id) D.attrKey='ST';
    toast('Tag „Massiv“ aktiv: Waffen-Attribut automatisch auf ST gewechselt');
  }
  invalidateModsCache();
  syncDiceFromSheet();
  renderMain();
  if(D.open) renderDice();
  save();
  return true;
}
function openAddWeaponMenu(anchorEl,ddKey,alignRight=false){
  openCtxMenu({
    key:`eq-add-weapon:${ddKey||'top'}`,
    title:'Neue Waffe anlegen',
    anchorEl,
    align:alignRight?'right':'left',
    minWidth:210,
    items:WEAPON_SUBTYPES.map(st=>({
      icon:st.icon,
      label:st.label,
      action:'add-weapon',
      dataset:{wtype:st.key}
    }))
  });
}
function openEqTagPicker(anchorEl,kind,itemId){
  const cfg={
    weapon:{arr:S.weapons,list:S.weaponTagList,ltype:'weaponTags',title:'Waffeneigenschaft hinzufügen'},
    ammo:{arr:S.ammos,list:S.ammoTagList,ltype:'ammoTags',title:'Munitions-Tag hinzufügen'},
    armor:{arr:S.armors,list:S.armorTagList,ltype:'armorTags',title:'Rüstungs-Tag hinzufügen'}
  }[kind];
  const it=cfg?(cfg.arr||[]).find(x=>x.id===itemId):null;
  if(!cfg||!it) return;
  const used=new Set((it.tags||[]).map(t=>String(t.name||'').toLowerCase()));
  const avail=(cfg.list||[]).filter(t=>t&&t.name&&!used.has(t.name.toLowerCase()));
  const items=avail.length
    ?avail.map(t=>({
      label:t.name,
      sub:t.desc||'',
      badge:hasTagX(t.name)?'(X)':'',
      onClick:()=>{addEqTagToItem(kind,itemId,t.name);}
    }))
    :[{label:'Alle verfügbaren Tags bereits hinzugefügt',disabled:true}];
  items.push({sep:true});
  items.push({
    icon:'⚙️',
    label:'Tag-Liste bearbeiten',
    sub:'Eigene Tags anlegen oder bestehende verwalten',
    action:'open-list',
    dataset:{ltype:cfg.ltype}
  });
  openCtxMenu({
    key:`eq-tag-picker:${kind}:${itemId}`,
    title:cfg.title,
    anchorEl,
    align:'left',
    minWidth:260,
    showClose:true,
    items
  });
}
function openWpTypePicker(anchorEl,wId){
  const w=S.weapons.find(x=>x.id===wId); if(!w) return;
  const hasCustom=!WEAPON_SUBTYPES.some(st=>st.key===w.wType);
  const list=hasCustom?[...WEAPON_SUBTYPES,getWeaponSubtype(w.wType)]:WEAPON_SUBTYPES;
  openCtxMenu({
    key:`eq-wp-type:${wId}`,
    title:'Waffentyp wählen',
    anchorEl,
    align:'left',
    minWidth:210,
    items:list.map(st=>({
      icon:st.icon,
      label:st.label,
      active:w.wType===st.key,
      onClick:()=>{
        if(w.wType===st.key) return;
        w.wType=st.key;
        if(isWeaponMassiv(w)) w.wAttr='ST';
        else if(w.wType==='ranged') w.wAttr='PR';
        invalidateModsCache();
        if(D.weaponId===w.id){
          const wm=getWeaponRollMeta(w);
          D.attrKey=wm.attrKey; D.skillId=wm.sk?wm.sk.id:null;
          if(!wm.sk) D.cSkill='0';
          syncDiceFromSheet(); if(D.open) renderDice();
        }
        renderMain(); save();
      }
    }))
  });
}
function openWpAttrPicker(anchorEl,wId){
  const w=S.weapons.find(x=>x.id===wId); if(!w) return;
  const M=calcActiveMods(), wm=getWeaponRollMeta(w,M);
  const items=[];
  if(wm.hasMassiv){
    items.push({type:'label',label:'Tag „Massiv“ aktiv → ST erzwungen'});
  }
  ATTRS.forEach(a=>{
    const tot=getAttrTot(a.k,M);
    items.push({
      label:`${a.k} – ${a.n}`,
      badge:String(tot),
      active:wm.attrKey===a.k,
      disabled:wm.hasMassiv&&a.k!=='ST',
      onClick:()=>{
        if(isWeaponMassiv(w)&&a.k!=='ST'){
          w.wAttr='ST';
          toast('Tag „Massiv“ aktiv: Attribut bleibt auf ST');
          return;
        }
        w.wAttr=a.k;
        if(D.weaponId===w.id){
          D.attrKey=a.k;
          syncDiceFromSheet(); if(D.open) renderDice();
        }
        renderMain(); save();
      }
    });
  });
  openCtxMenu({
    key:`eq-wp-attr:${wId}`,
    title:'Waffen-Attribut wählen',
    anchorEl,
    align:'left',
    minWidth:230,
    items
  });
}
function openWpSkillPicker(anchorEl,wId){
  const w=S.weapons.find(x=>x.id===wId); if(!w) return;
  const items=[{
    label:'Keine Fertigkeit',
    badge:'+0',
    active:!w.skillId||!S.skills.some(s=>s.id===w.skillId),
    onClick:()=>{
      w.skillId='';
      if(D.weaponId===w.id){D.skillId=null;D.cSkill='0';syncDiceFromSheet();if(D.open)renderDice();}
      renderMain(); save();
    }
  }];
  if(S.skills.length){
    items.push({sep:true});
    S.skills.forEach(sk=>{
      const b=getSkBonus(sk), rLbl=SK_RANKS[sk.rank]?.n||('Grad '+sk.rank);
      items.push({
        label:sk.name||'Unbenannt',
        sub:`${rLbl} • ${sk.linkedAttr||'PR'}`,
        badge:fmtSign(b),
        active:w.skillId===sk.id,
        onClick:()=>{
          w.skillId=sk.id;
          if(D.weaponId===w.id){
            D.skillId=sk.id;
            syncDiceFromSheet(); if(D.open) renderDice();
          }
          renderMain(); save();
        }
      });
    });
  }
  openCtxMenu({
    key:`eq-wp-skill:${wId}`,
    title:'Fertigkeit verknüpfen',
    anchorEl,
    align:'left',
    minWidth:250,
    showClose:true,
    items
  });
}
function openWpAmmoPicker(anchorEl,wId){
  const w=S.weapons.find(x=>x.id===wId); if(!w) return;
  const items=[{
    label:'Keine Munition zugeordnet',
    active:!w.ammoId||!S.ammos.some(a=>a.id===w.ammoId),
    onClick:()=>{
      w.ammoId='';
      invalidateModsCache();
      syncDiceFromSheet();
      renderMain(); if(D.open) renderDice(); save();
    }
  }];
  if(S.ammos.length){
    items.push({sep:true});
    S.ammos.forEach(am=>{
      const dmgSub=`Schnitt ${am.dmgCut} • Durchstoß ${am.dmgPierce} • Einschlag ${am.dmgImpact}`;
      items.push({
        icon:'🎯',
        label:String(am.name||'').trim()||'Unbenannte Munition',
        sub:dmgSub,
        badge:`${am.qty} Stk.`,
        active:w.ammoId===am.id,
        onClick:()=>{
          w.ammoId=am.id;
          invalidateModsCache();
          syncDiceFromSheet();
          renderMain(); if(D.open) renderDice(); save();
        }
      });
    });
  }
  items.push({sep:true});
  items.push({icon:'+',label:'Neue Munition erstellen & zuordnen',action:'quick-new-ammo',dataset:{wid:w.id}});
  items.push({icon:'⚙️',label:'Munitions-Liste bearbeiten',action:'open-ammo-modal',dataset:{wid:w.id}});
  openCtxMenu({
    key:`eq-wp-ammo:${wId}`,
    title:'Munition zuordnen',
    anchorEl,
    align:'left',
    minWidth:260,
    showClose:true,
    items
  });
}
function openArZonePicker(anchorEl,arId,forceOpen=false){
  const ar=S.armors.find(a=>a.id===arId); if(!ar) return;
  const hzNames=[...new Set(S.hitZones.map(z=>String(z.zone||'').trim()).filter(Boolean))];
  const customNames=[...new Set([...(ar.extraZones||[]),...(ar.zones||[])])].filter(zn=>zn&&!hzNames.some(h=>h.toLowerCase()===zn.toLowerCase()));
  const toggleZ=zn=>{
    if(!Array.isArray(ar.zones)) ar.zones=[];
    const idx=ar.zones.findIndex(z=>z.toLowerCase()===zn.toLowerCase());
    if(idx>-1) ar.zones.splice(idx,1);
    else ar.zones.push(zn);
    renderMain(); save();
    const freshAnchor=document.querySelector(`[data-action="open-ar-zone-picker"][data-id="${ar.id}"]`);
    openArZonePicker(freshAnchor||anchorEl,ar.id,true);
  };
  const items=[{type:'label',label:'Standard-Trefferzonen (Mehrfachauswahl)'}];
  hzNames.forEach(zn=>{
    const on=(ar.zones||[]).some(z=>z.toLowerCase()===zn.toLowerCase());
    items.push({label:zn,active:on,badge:on?'✓':'',keepOpen:true,onClick:()=>toggleZ(zn)});
  });
  if(customNames.length){
    items.push({sep:true});
    items.push({type:'label',label:'Eigene Zonen'});
    customNames.forEach(zn=>{
      const on=(ar.zones||[]).some(z=>z.toLowerCase()===zn.toLowerCase());
      items.push({label:zn,active:on,badge:on?'✓':'',keepOpen:true,onClick:()=>toggleZ(zn)});
    });
  }
  openCtxMenu({
    key:`eq-ar-zones:${arId}`,
    title:`Trefferzonen • ${String(ar.name||'').trim()||'Rüstung'}`,
    anchorEl,
    align:'left',
    minWidth:240,
    showClose:true,
    forceOpen,
    items
  });
}
function openInvSecPicker(anchorEl,itemId){
  const it=S.inventory.find(x=>x.id===itemId); if(!it) return;
  const invSecs=Array.isArray(S.invSections)?S.invSections:[];
  const curSecId=(it.sectionId&&invSecs.some(s=>s.id===it.sectionId))?it.sectionId:'';
  const items=[{
    icon:'🎒',
    label:'Ohne Beutel (Hauptebene)',
    active:!curSecId,
    onClick:()=>{
      it.sectionId='';
      renderMain(); save();
    }
  }];
  const ordered=getOrderedInvSecsForPicker();
  if(ordered.length){
    items.push({sep:true});
    ordered.forEach(({sec,depth})=>{
      const pfx=depth>0?`${'↳ '.repeat(Math.min(depth,3))}`:'';
      items.push({
        icon:'🎒',
        label:`${pfx}${sec.name||'Beutel'}`,
        active:curSecId===sec.id,
        onClick:()=>{
          it.sectionId=sec.id;
          sec.collapsed=false;
          renderMain(); save();
        }
      });
    });
  }
  openCtxMenu({
    key:`eq-inv-sec:${itemId}`,
    title:'Beutel / Sektion zuordnen',
    anchorEl,
    align:'left',
    minWidth:230,
    items
  });
}
function openInvSecParentPicker(anchorEl,secId){
  const invSecs=Array.isArray(S.invSections)?S.invSections:[];
  const sec=invSecs.find(s=>s.id===secId); if(!sec) return;
  const items=[{
    icon:'🎒',
    label:'Hauptebene (kein Überordner)',
    active:!sec.parentSectionId,
    onClick:()=>{
      sec.parentSectionId='';
      renderMain(); save();
      toast('Beutel auf Hauptebene verschoben');
    }
  }];
  const ordered=getOrderedInvSecsForPicker().filter(({sec:cand})=>canSetSecParent(invSecs,sec.id,cand.id));
  if(ordered.length){
    items.push({sep:true});
    ordered.forEach(({sec:cand,depth})=>{
      const pfx=depth>0?`${'↳ '.repeat(Math.min(depth,3))}`:'';
      items.push({
        icon:'↳',
        label:`${pfx}in: ${cand.name||'Beutel'}`,
        active:sec.parentSectionId===cand.id,
        onClick:()=>{
          if(!canSetSecParent(S.invSections,sec.id,cand.id)){
            toast('⚠️ Zyklus verhindert: Ein Beutel kann nicht in sich selbst oder seinen Unterordner gelegt werden.');
            return;
          }
          sec.parentSectionId=cand.id;
          cand.collapsed=false;
          renderMain(); save();
          toast('Beutel als Unterordner verschachtelt');
        }
      });
    });
  }
  openCtxMenu({
    key:`eq-invsec-parent:${secId}`,
    title:'Übergeordneten Beutel wählen',
    anchorEl,
    align:'right',
    minWidth:240,
    items
  });
}

function renderEqTagBar(kind,item,tagList,ltype,lbl){
  const usedNames=(item.tags||[]).map(t=>t.name.toLowerCase());
  const avail=(tagList||[]).filter(t=>!usedNames.includes(t.name.toLowerCase()));
  return `<div class="space-y-1.5">
    <div class="flex items-center justify-between gap-2">
      <span class="text-[11px] font-bold t-mut">${lbl}</span>
      <button type="button" data-action="open-list" data-ltype="${ltype}" data-tip="Standardliste „${lbl}“ verwalten &amp; eigene Tags hinzufügen" class="text-[11px] text-acc hover:underline">⚙️ Liste bearbeiten</button>
    </div>
    <div class="flex flex-wrap items-center gap-1.5">
      ${(item.tags||[]).map((tg,ti)=>{
        const isX=hasTagX(tg.name), tip=esc(getTagDesc(tagList,tg.name,tg.x)), baseLbl=String(tg.name).replace(/\(\s*X\s*\)/i,'').trim();
        return `<span id="eqtag_${kind}_${item.id}_${ti}" data-tip="${tip}" class="tag cursor-help py-1 px-2 text-xs">
          <span>${esc(baseLbl)}</span>
          ${isX?`<span class="inline-flex items-center gap-0.5 font-black">(<input data-eqtag-x="${kind}:${item.id}:${ti}" type="text" inputmode="text" value="${esc(tg.x??'1')}" class="inp !py-0 !px-1 w-9 text-center text-[11px] font-black tabular"/>)</span>`:''}
          <button type="button" data-action="rm-eq-tag" data-kind="${kind}" data-id="${item.id}" data-tidx="${ti}" class="hover:text-rose-400 font-black ml-0.5">✕</button>
        </span>`;
      }).join('')}
      <button type="button" data-action="open-eq-tag-picker" data-kind="${kind}" data-id="${item.id}" aria-haspopup="menu" aria-expanded="false" data-tip="Wähle einen Tag aus der alphabetischen Liste (oder füge über ⚙️ eigene hinzu)" class="inp py-1 px-2.5 text-xs font-semibold flex items-center justify-between gap-2 text-left cursor-pointer hover:border-sky-400/70 ${(item.tags||[]).length?'w-auto max-w-full':'w-full'}"><span class="truncate">+ ${lbl} hinzufügen${avail.length?` (${avail.length})`:''}</span><span class="t-mut text-[10px] shrink-0">▾</span></button>
    </div>
  </div>`;
}

const isTab5PhoneDefault=()=>window.innerWidth<768||isMobileLayout();
function isTab5EquipNotesCollapsed(){
  const ov=UI.tab5?.equipNotes;
  if(ov!==null&&ov!==undefined) return Boolean(ov);
  return isTab5PhoneDefault();
}
function isTab5BioGalleryCollapsed(){
  const ov=UI.tab5?.bioGallery;
  if(ov!==null&&ov!==undefined) return Boolean(ov);
  return !(Array.isArray(S.bioImages)&&S.bioImages.length>0)||isTab5PhoneDefault();
}
function isTab5BioFieldCollapsed(k){
  const map=UI.tab5?.bioFields||{};
  if(Object.prototype.hasOwnProperty.call(map,k)) return Boolean(map[k]);
  return isTab5PhoneDefault();
}
function getEqItemSiblingInfo(kind,id){
  if(kind==='inv'&&Array.isArray(S.invSections)&&S.invSections.length){
    const it=S.inventory.find(x=>x.id===id);
    if(!it) return {idx:-1,len:0,sibs:[]};
    const secId=(it.sectionId&&S.invSections.some(s=>s.id===it.sectionId))?it.sectionId:'';
    const sibs=S.inventory.filter(x=>((x.sectionId&&S.invSections.some(s=>s.id===x.sectionId))?x.sectionId:'')===secId);
    return {idx:sibs.findIndex(x=>x.id===id),len:sibs.length,sibs};
  }
  const arr={weapon:S.weapons,ammo:S.ammos,armor:S.armors,inv:S.inventory}[kind]||[];
  return {idx:arr.findIndex(x=>x.id===id),len:arr.length,sibs:arr};
}
function moveEqSecOrder(secKey,dir){
  if(!Array.isArray(S.equipSecOrder)||S.equipSecOrder.length!==4) S.equipSecOrder=[...DEF_EQ_SEC_ORDER];
  const i=S.equipSecOrder.indexOf(secKey), ni=i+Number(dir);
  if(i>-1&&ni>=0&&ni<S.equipSecOrder.length){
    const [it]=S.equipSecOrder.splice(i,1);
    S.equipSecOrder.splice(ni,0,it);
    renderMain(); save();
    return true;
  }
  return false;
}
function moveEqItemOrder(kind,id,dir){
  if(kind==='inv'&&Array.isArray(S.invSections)&&S.invSections.length){
    const it=S.inventory.find(x=>x.id===id); if(!it) return false;
    const secId=(it.sectionId&&S.invSections.some(s=>s.id===it.sectionId))?it.sectionId:'';
    const sibs=S.inventory.filter(x=>((x.sectionId&&S.invSections.some(s=>s.id===x.sectionId))?x.sectionId:'')===secId);
    const si=sibs.findIndex(x=>x.id===it.id), tSib=sibs[si+Number(dir)];
    if(tSib){
      const i1=S.inventory.indexOf(it),i2=S.inventory.indexOf(tSib);
      S.inventory[i1]=tSib; S.inventory[i2]=it;
      renderMain(); save();
      return true;
    }
    return false;
  }
  const arr={weapon:S.weapons,ammo:S.ammos,armor:S.armors,inv:S.inventory}[kind];
  if(arr){
    const i=arr.findIndex(x=>x.id===id), ni=i+Number(dir);
    if(i>-1&&ni>=0&&ni<arr.length){
      const [it]=arr.splice(i,1);
      arr.splice(ni,0,it);
      renderMain(); save();
      return true;
    }
  }
  return false;
}
function moveInvSecOrder(secId,dir){
  const sec=(S.invSections||[]).find(s=>s.id===secId); if(!sec) return false;
  const pId=sec.parentSectionId||'', sibs=S.invSections.filter(s=>(s.parentSectionId||'')===pId);
  const si=sibs.findIndex(s=>s.id===sec.id), tSib=sibs[si+Number(dir)];
  if(tSib){
    const i1=S.invSections.indexOf(sec), i2=S.invSections.indexOf(tSib);
    S.invSections[i1]=tSib; S.invSections[i2]=sec;
    renderMain(); save();
    return true;
  }
  return false;
}
function duplicateEqItem(kind,id){
  const arr={weapon:S.weapons,ammo:S.ammos,armor:S.armors,inv:S.inventory}[kind];
  if(!arr) return false;
  const idx=arr.findIndex(x=>x.id===id);
  if(idx<0) return false;
  const copy=clone(arr[idx]);
  copy.id=uid();
  if(String(copy.name||'').trim()) copy.name=`${String(copy.name).trim()} (Kopie)`;
  if(Array.isArray(copy.customDmg)) copy.customDmg=copy.customDmg.map(c=>({...c,id:uid()}));
  if(Array.isArray(copy.customProt)) copy.customProt=copy.customProt.map(c=>({...c,id:uid()}));
  arr.splice(idx+1,0,copy);
  invalidateModsCache(); syncDiceFromSheet();
  renderMain(); if(D.open) renderDice(); save();
  toast('📋 Eintrag dupliziert');
  return true;
}
function deleteEqItem(kind,id){
  UI.confirmDelEqKey='';
  if(kind==='weapon'){
    S.weapons=S.weapons.filter(w=>w.id!==id);
    if(D.weaponId===id){D.weaponId=null;D.wRollCat='Normaler Test';D.sitActive={};applyDiceAutoAdvDis(true);if(D.open)renderDice();}
    renderMain(); save(); return true;
  }
  if(kind==='ammo'){
    S.ammos=S.ammos.filter(a=>a.id!==id);
    S.weapons.forEach(w=>{if(w.ammoId===id)w.ammoId='';});
    invalidateModsCache(); syncDiceFromSheet();
    renderMain(); if(UI.modal==='ammoList') renderModal(); if(D.open) renderDice(); save(); return true;
  }
  if(kind==='armor'){
    S.armors=S.armors.filter(a=>a.id!==id);
    if(UI.arZoneDrafts) delete UI.arZoneDrafts[id];
    invalidateModsCache(); syncDiceFromSheet();
    renderMain(); if(D.open) renderDice(); save(); return true;
  }
  if(kind==='inv'){
    S.inventory=S.inventory.filter(i=>i.id!==id);
    renderMain(); save(); return true;
  }
  return false;
}
function openEqItemMenu(anchorEl,kind,id,forceOpen=false){
  const it=findEqItem(kind,id); if(!it) return;
  const defName={weapon:'Waffe',ammo:'Munition',armor:'Rüstung',inv:'Gegenstand'}[kind]||'Eintrag';
  const titleName=String(it.name||'').trim()||defName;
  const {idx,len}=getEqItemSiblingInfo(kind,id);
  const delKey=`${kind}:${id}`;
  const isDelConfirm=UI.confirmDelEqKey===delKey;
  const items=[];
  if(kind==='weapon'){
    items.push({type:'label',label:'Kampf-Aktionen'});
    items.push({icon:'🎲',label:'Trefferwurf würfeln',action:'roll-weapon',dataset:{id,wcat:'Trefferwurf'}});
    items.push({icon:'🛡️',label:'Parieren würfeln',action:'roll-weapon',dataset:{id,wcat:'Parieren'}});
    items.push({icon:'🛡️',label:'Blocken würfeln',action:'roll-weapon',dataset:{id,wcat:'Blocken'}});
    items.push({sep:true});
  }
  items.push({type:'label',label:'Reihenfolge & Organisation'});
  items.push({
    icon:'▲',
    label:'Nach oben verschieben',
    disabled:idx<=0,
    keepOpen:true,
    onClick:()=>{
      if(moveEqItemOrder(kind,id,-1)){
        const fresh=document.querySelector(`[data-action="open-eq-item-menu"][data-kind="${kind}"][data-id="${id}"]`);
        openEqItemMenu(fresh||anchorEl,kind,id,true);
      }
    }
  });
  items.push({
    icon:'▼',
    label:'Nach unten verschieben',
    disabled:idx<0||idx>=len-1,
    keepOpen:true,
    onClick:()=>{
      if(moveEqItemOrder(kind,id,1)){
        const fresh=document.querySelector(`[data-action="open-eq-item-menu"][data-kind="${kind}"][data-id="${id}"]`);
        openEqItemMenu(fresh||anchorEl,kind,id,true);
      }
    }
  });
  if(kind==='inv'&&Array.isArray(S.invSections)&&S.invSections.length){
    const curSec=S.invSections.find(s=>s.id===it.sectionId);
    items.push({
      icon:'🎒',
      label:'Beutel wechseln',
      badge:curSec?(curSec.name||'Beutel'):'Ohne Beutel',
      onClick:()=>{openInvSecPicker(anchorEl,id);}
    });
  }
  items.push({sep:true});
  items.push({type:'label',label:'Darstellung & Medien'});
  items.push({icon:'🎨',label:'Textfarbe (Name)',badge:it.color?'●':'',action:'open-eq-color',dataset:{kind,id,cmode:'text'}});
  items.push({icon:'🪟',label:'Fensterfarbe (Karte)',badge:it.bgColor?'●':'',action:'open-eq-color',dataset:{kind,id,cmode:'bg'}});
  items.push({icon:'🖼️',label:'Bild verwalten',badge:it.img?'Vorhanden':'Neu',action:'pick-item-img',dataset:{kind,id}});
  items.push({sep:true});
  items.push({icon:'📋',label:'Duplizieren',onClick:()=>{duplicateEqItem(kind,id);}});
  items.push({sep:true});
  if(isDelConfirm){
    items.push({
      icon:'⚠️',
      label:'Wirklich löschen? (Bestätigen)',
      sub:`„${titleName}“ dauerhaft entfernen`,
      danger:true,
      onClick:()=>{deleteEqItem(kind,id);}
    });
    items.push({
      icon:'↩️',
      label:'Löschen abbrechen',
      keepOpen:true,
      onClick:()=>{
        UI.confirmDelEqKey='';
        openEqItemMenu(anchorEl,kind,id,true);
      }
    });
  }else{
    items.push({
      icon:'🗑️',
      label:'Löschen',
      danger:true,
      keepOpen:true,
      onClick:()=>{
        UI.confirmDelEqKey=delKey;
        openEqItemMenu(anchorEl,kind,id,true);
      }
    });
  }
  openCtxMenu({
    key:`eq-item-menu:${kind}:${id}`,
    title:titleName,
    anchorEl,
    align:'right',
    minWidth:245,
    forceOpen,
    items,
    onClose:()=>{if(UI.confirmDelEqKey===delKey) UI.confirmDelEqKey='';}
  });
}
function openEqSecMenu(anchorEl,secKey,forceOpen=false){
  const ord=Array.isArray(S.equipSecOrder)&&S.equipSecOrder.length===4?S.equipSecOrder:DEF_EQ_SEC_ORDER;
  const secIdx=ord.indexOf(secKey);
  const meta=S.equipSecMeta?.[secKey]||{collapsed:false,color:'',bgColor:''};
  const secTitles={weapons:'⚔️ Waffen',ammos:'🎯 Munition',armors:'🛡️ Rüstungen',inventory:'🎒 Inventar'};
  const items=[
    {type:'label',label:'Kategorie sortieren'},
    {
      icon:'▲',
      label:'Kategorie nach oben',
      disabled:secIdx<=0,
      keepOpen:true,
      onClick:()=>{
        if(moveEqSecOrder(secKey,-1)){
          const fresh=document.querySelector(`[data-action="open-eq-sec-menu"][data-sec="${secKey}"]`);
          openEqSecMenu(fresh||anchorEl,secKey,true);
        }
      }
    },
    {
      icon:'▼',
      label:'Kategorie nach unten',
      disabled:secIdx<0||secIdx>=ord.length-1,
      keepOpen:true,
      onClick:()=>{
        if(moveEqSecOrder(secKey,1)){
          const fresh=document.querySelector(`[data-action="open-eq-sec-menu"][data-sec="${secKey}"]`);
          openEqSecMenu(fresh||anchorEl,secKey,true);
        }
      }
    },
    {sep:true},
    {type:'label',label:'Darstellung'},
    {icon:'🎨',label:'Textfarbe der Kategorie',badge:meta.color?'●':'',action:'open-eqsec-color',dataset:{sec:secKey,cmode:'text'}},
    {icon:'🪟',label:'Fensterfarbe der Kategorie',badge:meta.bgColor?'●':'',action:'open-eqsec-color',dataset:{sec:secKey,cmode:'bg'}},
    {icon:meta.collapsed?'▾':'▸',label:meta.collapsed?'Kategorie ausklappen':'Kategorie einklappen',action:'toggle-eqsec-collapse',dataset:{sec:secKey}},
    {sep:true},
    {type:'label',label:'Verwaltung'}
  ];
  if(secKey==='weapons'){
    items.push({icon:'⚙️',label:'Waffeneigenschaften verwalten',badge:String(S.weaponTagList.length),action:'open-list',dataset:{ltype:'weaponTags'}});
  }else if(secKey==='ammos'){
    items.push({icon:'📋',label:'Munitionsliste öffnen',badge:String(S.ammos.length),action:'open-ammo-modal',dataset:{wid:''}});
    items.push({icon:'⚙️',label:'Munitions-Tags verwalten',badge:String(S.ammoTagList.length),action:'open-list',dataset:{ltype:'ammoTags'}});
  }else if(secKey==='armors'){
    items.push({icon:'⚙️',label:'Rüstungs-Tags verwalten',badge:String(S.armorTagList.length),action:'open-list',dataset:{ltype:'armorTags'}});
  }else if(secKey==='inventory'){
    items.push({icon:'🎒',label:'Neuen Beutel / Sektion erstellen',action:'add-inv-section'});
    if(Array.isArray(S.invSections)&&S.invSections.length){
      items.push({icon:'▸',label:'Alle Beutel einklappen',action:'collapse-all-inv',dataset:{val:'1'}});
      items.push({icon:'▾',label:'Alle Beutel ausklappen',action:'collapse-all-inv',dataset:{val:'0'}});
    }
  }
  openCtxMenu({
    key:`eq-sec-menu:${secKey}`,
    title:secTitles[secKey]||'Kategorie',
    anchorEl,
    align:'right',
    minWidth:245,
    forceOpen,
    items
  });
}
function openInvSecMenu(anchorEl,secId,forceOpen=false){
  const invSecs=Array.isArray(S.invSections)?S.invSections:[];
  const sec=invSecs.find(s=>s.id===secId); if(!sec) return;
  const pId=sec.parentSectionId||'';
  const sibs=invSecs.filter(s=>(s.parentSectionId||'')===pId);
  const sIdx=sibs.findIndex(s=>s.id===secId);
  const secItems=S.inventory.filter(it=>it.sectionId===sec.id);
  const isDelConfirm=UI.confirmDelInvSecId===secId;
  const curPar=sec.parentSectionId?invSecs.find(s=>s.id===sec.parentSectionId):null;
  const items=[
    {type:'label',label:'Beutel sortieren & verschachteln'},
    {
      icon:'▲',
      label:'Beutel nach oben',
      disabled:sIdx<=0,
      keepOpen:true,
      onClick:()=>{
        if(moveInvSecOrder(secId,-1)){
          const fresh=document.querySelector(`[data-action="open-invsec-menu"][data-id="${secId}"]`);
          openInvSecMenu(fresh||anchorEl,secId,true);
        }
      }
    },
    {
      icon:'▼',
      label:'Beutel nach unten',
      disabled:sIdx<0||sIdx>=sibs.length-1,
      keepOpen:true,
      onClick:()=>{
        if(moveInvSecOrder(secId,1)){
          const fresh=document.querySelector(`[data-action="open-invsec-menu"][data-id="${secId}"]`);
          openInvSecMenu(fresh||anchorEl,secId,true);
        }
      }
    }
  ];
  if(invSecs.length>1){
    items.push({
      icon:'↳',
      label:'Übergeordneten Beutel wählen',
      badge:curPar?(curPar.name||'Beutel'):'Hauptebene',
      onClick:()=>{openInvSecParentPicker(anchorEl,secId);}
    });
  }
  items.push({sep:true});
  items.push({icon:'➕',label:'Unterordner erstellen',action:'add-inv-section',dataset:{parent:secId}});
  if(secItems.length>1){
    items.push({icon:'⇅',label:'Gegenstände A–Z sortieren',action:'sort-invsec-az',dataset:{id:secId}});
  }
  items.push({sep:true});
  items.push({type:'label',label:'Darstellung'});
  items.push({icon:'🎨',label:'Textfarbe des Beutels',badge:sec.color?'●':'',action:'open-invsec-color',dataset:{id:secId,cmode:'text'}});
  items.push({icon:'🪟',label:'Fensterfarbe des Beutels',badge:sec.bgColor?'●':'',action:'open-invsec-color',dataset:{id:secId,cmode:'bg'}});
  items.push({sep:true});
  if(isDelConfirm){
    items.push({
      icon:'⚠️',
      label:'Beutel wirklich löschen? (2/2)',
      sub:'Gegenstände & Unterordner bleiben erhalten',
      danger:true,
      action:'confirm-del-invsec',
      dataset:{id:secId}
    });
    items.push({
      icon:'↩️',
      label:'Löschen abbrechen',
      keepOpen:true,
      onClick:()=>{
        UI.confirmDelInvSecId=null;
        openInvSecMenu(anchorEl,secId,true);
      }
    });
  }else{
    items.push({
      icon:'🗑️',
      label:'Beutel löschen',
      sub:'Gegenstände & Unterordner bleiben erhalten',
      danger:true,
      keepOpen:true,
      onClick:()=>{
        UI.confirmDelInvSecId=secId;
        openInvSecMenu(anchorEl,secId,true);
      }
    });
  }
  openCtxMenu({
    key:`eq-invsec-menu:${secId}`,
    title:`🎒 ${String(sec.name||'').trim()||'Beutel'}`,
    anchorEl,
    align:'right',
    minWidth:250,
    forceOpen,
    items,
    onClose:()=>{if(UI.confirmDelInvSecId===secId) UI.confirmDelInvSecId=null;}
  });
}
function renderEqItemMenuBtn(kind,id){
  return `<button type="button" data-action="open-eq-item-menu" data-kind="${kind}" data-id="${id}" aria-haspopup="menu" aria-expanded="false" aria-label="Aktionen" data-tip="Weitere Aktionen (Farben, Bild, Sortieren, Duplizieren, Löschen)" class="btn w-8 h-8 sm:w-7 sm:h-7 p-0 text-sm font-black shrink-0">⋮</button>`;
}
function renderEqMiniThumb(kind,id,imgUrl){
  if(!imgUrl) return '';
  return `<button type="button" data-action="pick-item-img" data-kind="${kind}" data-id="${id}" data-tip="Bild-Aktionen öffnen (ändern, Großansicht oder entfernen)" class="w-8 h-8 rounded-lg overflow-hidden border bdr-acc bg-acc-soft shrink-0 cursor-pointer hover:opacity-90 transition-opacity p-0 shadow-sm"><img src="${imgUrl}" alt="" class="w-full h-full object-cover"/></button>`;
}

function renderEqCustomValBoxes(kind,itemId,list,delAct){
  const phVal=kind==='armor'?'0':'-';
  return (Array.isArray(list)?list:[]).map(cv=>`<div class="min-w-0 flex flex-col gap-1 p-1.5 rounded-lg bg-black/20 border bdr-line">
    <div class="flex items-center gap-1 min-w-0">
      <input data-eqcv="${kind}:${itemId}:${cv.id}:label" type="text" value="${esc(cv.label)}" placeholder="z.B. Energie" data-tip="Bezeichnung des benutzerdefinierten Werts (z.B. Energie, Feuer)" class="inp-line w-full min-w-0 text-center text-[11px] font-bold !py-0 !px-0.5 leading-tight"/>
      <button type="button" data-action="${delAct}" data-id="${itemId}" data-cvid="${cv.id}" data-tip="Zusatzwert entfernen" class="t-mut hover:text-rose-400 text-xs font-black leading-none px-1 shrink-0 cursor-pointer">✕</button>
    </div>
    <input data-eqcv="${kind}:${itemId}:${cv.id}:val" type="text" inputmode="text" value="${esc(cv.val)}" placeholder="${phVal}" class="inp w-full min-w-0 text-center font-black py-1 px-1.5 text-xs"/>
  </div>`).join('');
}
function renderAddWeaponDropdown(ddKey,btnCls='btn',alignRight=false){
  return `<button type="button" data-action="open-add-weapon-menu" data-ddkey="${esc(ddKey)}" data-align="${alignRight?'right':'left'}" aria-haspopup="menu" aria-expanded="false" class="${btnCls}">+ Waffe ▾</button>`;
}
function renderWeaponRollBtns(w,wm,compact=false){
  const M=calcActiveMods(), wSub=getWeaponSubtype(w.wType), wRaw=String(w.name||'').trim()||wSub.label;
  const poolBreak=`${wm.attrKey} ${wm.attrVal}${wm.sk?` ${fmtSign(wm.skBonus)} (${wm.sk.name})`:' + 0 (ohne Fertigkeit)'} = ${wm.pool}`;
  const wTip=cat=>{const ad=getAdvDisForContext({weaponId:w.id,wRollCat:cat,skillId:wm.sk?.id||null,attrKey:wm.attrKey},M),al=fmtAdvSrcLines(ad.src),cl=(ad.critSrc||[]).map(c=>`• ${c.srcName}: Kritische Ziffer +${c.val}`).join('\n'),sl=(ad.sitOptions||[]).map(s=>`• [Situativ] ${s.sitLabel}: ${s.reduceDis?'-'+s.reduceDis+'N':s.adv?'+'+s.adv+'V':'+'+s.dis+'N'}${s.counterNote?' ('+s.counterNote+')':''}`).join('\n');return esc(`${cat} mit ${wRaw} starten\nPool: ${poolBreak}${cat==='Blocken'&&wm.hasBlock?'\n✓ Tag Blockfähig aktiv':''}${al?'\n'+al:''}${cl?'\n'+cl:''}${sl?'\n'+sl:''}`);};
  return `<div class="flex flex-wrap items-center gap-1.5 tabular w-full sm:w-auto sm:inline-flex sm:shrink-0 max-w-full">
    <button type="button" data-action="roll-weapon" data-id="${w.id}" data-wcat="Trefferwurf" data-tip="${wTip('Trefferwurf')}" class="btn btn-pri ${compact?'py-1 px-2.5 text-xs':'py-1.5 px-3 text-xs'} font-black whitespace-nowrap">🎲 Trefferwurf <span class="px-1.5 py-0.5 rounded bg-black/25 text-[11px] font-black">${wm.pool}</span></button>
    <div class="inline-flex items-center rounded-lg border bdr-acc bg-acc-soft overflow-hidden shrink-0 max-w-full" role="group">
      <button type="button" data-action="roll-weapon" data-id="${w.id}" data-wcat="Parieren" data-tip="${wTip('Parieren')}" class="px-2 ${compact?'py-1':'py-1.5'} text-[11px] font-extrabold text-acc hover:bg-black/20 transition-colors cursor-pointer whitespace-nowrap">🛡️ Parieren</button>
      <span class="w-px self-stretch bg-white/15"></span>
      <button type="button" data-action="roll-weapon" data-id="${w.id}" data-wcat="Blocken" data-tip="${wTip('Blocken')}" class="px-2 ${compact?'py-1':'py-1.5'} text-[11px] font-extrabold ${wm.hasBlock?'text-emerald-400':'text-acc opacity-85'} hover:bg-black/20 transition-colors cursor-pointer whitespace-nowrap">Blocken</button>
    </div>
  </div>`;
}
function renderWeaponCard(w,idx,len){
  const M=calcActiveMods(), wm=getWeaponRollMeta(w,M);
  const wSub=getWeaponSubtype(w.wType), isRng=w.wType==='ranged';
  const linkedAmmo=isRng&&w.ammoId?S.ammos.find(a=>a.id===w.ammoId):null;
  const colStyle=w.color?`style="color:${esc(w.color)}"`:'', winStyle=cardColorStyle(w);
  const wRaw=String(w.name||'').trim()||wSub.label;
  const hdrRollTip=esc(`Trefferwurf mit ${wRaw} starten (Pool: ${wm.attrKey} ${wm.attrVal}${wm.sk?` ${fmtSign(wm.skBonus)}`:''} = ${wm.pool})`);
  const hdrRow=`<div class="flex items-center gap-1.5 min-w-0">
    <button type="button" data-action="toggle-eqitem-collapse" data-kind="weapon" data-id="${w.id}" data-tip="${w.collapsed?'Waffe ausklappen':'Waffe einklappen'}" aria-expanded="${!w.collapsed}" class="btn w-8 h-8 sm:w-7 sm:h-7 p-0 text-xs font-black shrink-0">${w.collapsed?'▸':'▾'}</button>
    <span draggable="true" data-drag-eqitem="weapon:${w.id}" data-tip="Ziehen zum Sortieren" class="w-7 h-7 rounded bg-acc-soft border bdr-acc text-acc text-xs font-black cursor-grab select-none shrink-0 inline-flex items-center justify-center">⠿</span>
    ${renderEqMiniThumb('weapon',w.id,w.img)}
    <input data-wpf="${w.id}:name" type="text" value="${esc(w.name)}" ${colStyle} placeholder="Waffenname..." class="inp-line flex-1 min-w-0 text-sm sm:text-base font-extrabold"/>
    <button type="button" data-action="roll-weapon" data-id="${w.id}" data-wcat="Trefferwurf" data-tip="${hdrRollTip}" class="btn btn-pri h-8 sm:h-7 px-2 text-xs font-black shrink-0 tabular whitespace-nowrap">🎲 <span class="px-1 py-0.5 rounded bg-black/25 text-[11px] font-black">${wm.pool}</span></button>
    ${renderEqItemMenuBtn('weapon',w.id)}
  </div>`;
  if(w.collapsed){
    return `<div data-eqitem="weapon:${w.id}" class="subcard py-2 px-2.5 sm:px-3 space-y-1.5 min-w-0" ${winStyle}>
      ${hdrRow}
      <div class="flex flex-wrap items-center gap-1.5 tabular min-w-0">
        <span class="pill cursor-default text-[11px] py-0.5 px-2">${esc(wSub.icon)} ${esc(wSub.label)}</span>
        ${w.grip?`<span class="pill cursor-default text-[11px] py-0.5 px-2 text-acc">${w.grip==='1h'?'Einhändig':'Zweihändig'}</span>`:''}
        <span class="pill cursor-default text-[11px] py-0.5 px-2 max-w-full whitespace-normal break-words">Schnitt ${esc(w.dmgCut)} • Durchstoß ${esc(w.dmgPierce)} • Einschlag ${esc(w.dmgImpact)}${fmtCustomValSummarySuffix(w.customDmg)}</span>
        ${linkedAmmo?`<span class="pill cursor-default text-[11px] py-0.5 px-2 text-amber-400">🎯 <span data-linked-ammo-name="${linkedAmmo.id}">${esc(linkedAmmo.name||'Munition')}</span>: <span data-linked-ammo-qty="${linkedAmmo.id}">${linkedAmmo.qty}</span></span>`:''}
      </div>
    </div>`;
  }
  return `<div data-eqitem="weapon:${w.id}" class="subcard p-2.5 sm:p-3 space-y-3 min-w-0" ${winStyle}>
    ${hdrRow}
    <div class="pt-2 border-t bdr-line grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 items-end">
      <div class="min-w-0">
        <label class="block text-[10px] font-bold t-mut mb-0.5">WAFFENTYP</label>
        <button type="button" data-action="open-wp-type-picker" data-id="${w.id}" aria-haspopup="menu" aria-expanded="false" class="inp w-full py-1.5 px-2 text-xs font-bold flex items-center justify-between gap-2 text-left cursor-pointer hover:border-sky-400/70"><span class="truncate">${esc(wSub.icon)} ${esc(wSub.label)}</span><span class="t-mut text-[10px] shrink-0">▾</span></button>
      </div>
      <div class="min-w-0">
        <label class="block text-[10px] font-bold t-mut mb-0.5">FÜHRUNG</label>
        <div class="grid grid-cols-2 gap-1.5">
          <button type="button" data-action="set-wp-grip" data-id="${w.id}" data-grip="1h" data-tip="Einhändig geführt (schließt Zweihändig aus)" class="btn py-1.5 px-2 text-xs w-full ${w.grip==='1h'?'btn-ok':'opacity-75'}"><span class="inline-flex items-center justify-center w-3.5 h-3.5 rounded border ${w.grip==='1h'?'border-white bg-white/20':'bdr-line'} text-[10px] font-black shrink-0">${w.grip==='1h'?'✓':''}</span><span class="truncate">1H</span></button>
          <button type="button" data-action="set-wp-grip" data-id="${w.id}" data-grip="2h" data-tip="Zweihändig geführt (schließt Einhändig aus)" class="btn py-1.5 px-2 text-xs w-full ${w.grip==='2h'?'btn-ok':'opacity-75'}"><span class="inline-flex items-center justify-center w-3.5 h-3.5 rounded border ${w.grip==='2h'?'border-white bg-white/20':'bdr-line'} text-[10px] font-black shrink-0">${w.grip==='2h'?'✓':''}</span><span class="truncate">2H</span></button>
        </div>
      </div>
      <div class="min-w-0">
        <label class="block text-[10px] font-extrabold text-acc mb-0.5 truncate" data-tip="Pflicht-Attribut für Würfe mit dieser Waffe (Standard: PR bei Fernkampf, ST oder PR bei Nahkampf; wechselt bei Tag „Massiv“ automatisch auf ST)">ATTRIBUT ${wm.hasMassiv?`<span class="text-amber-400">• Massiv → ST</span>`:`<span class="t-mut font-semibold">(${isRng?'Std: PR':'Std: ST/PR'})</span>`}</label>
        <button type="button" data-action="open-wp-attr-picker" data-id="${w.id}" aria-haspopup="menu" aria-expanded="false" class="inp w-full py-1.5 px-2 text-xs font-extrabold tabular flex items-center justify-between gap-2 text-left cursor-pointer hover:border-sky-400/70 ${wm.hasMassiv?'!border-amber-400/70 text-amber-300':''}"><span class="truncate">${wm.attrKey} – ${esc(ATTRS.find(a=>a.k===wm.attrKey)?.n||wm.attrKey)} (${wm.attrVal})</span><span class="t-mut text-[10px] shrink-0">▾</span></button>
      </div>
      <div class="min-w-0">
        <label class="block text-[10px] font-bold t-mut mb-0.5 truncate" data-tip="Optionale Verknüpfung mit einer gelernten Charakter-Fertigkeit aus Reiter 2">FERTIGKEIT (OPTIONAL)</label>
        <button type="button" data-action="open-wp-skill-picker" data-id="${w.id}" aria-haspopup="menu" aria-expanded="false" class="inp w-full py-1.5 px-2 text-xs font-bold tabular flex items-center justify-between gap-2 text-left cursor-pointer hover:border-sky-400/70"><span class="truncate">${wm.sk?`${esc(wm.sk.name||'Unbenannt')} (${fmtSign(wm.skBonus)})`:'— Keine (+0) —'}</span><span class="t-mut text-[10px] shrink-0">▾</span></button>
      </div>
    </div>
    <div class="p-2.5 rounded-xl border bdr-acc bg-acc-soft/25 flex flex-wrap items-center justify-between gap-2">
      <div class="text-xs font-bold t-mut tabular min-w-0">
        Pool: <strong class="text-acc">${wm.attrKey} ${wm.attrVal}${wm.sk?` ${fmtSign(wm.skBonus)}`:''} = ${wm.pool}</strong>
      </div>
      ${renderWeaponRollBtns(w,wm,true)}
    </div>
    <div class="space-y-1.5">
      <div class="flex items-center justify-between gap-2">
        <span class="text-[10px] font-extrabold t-mut uppercase tracking-wider">Schadenswerte</span>
        <button type="button" data-action="add-weapon-dmg" data-id="${w.id}" data-tip="Benutzerdefinierten Schadenswert hinzufügen (z.B. Energie, Feuer)" class="btn py-0.5 px-2 text-[11px]">+ Wert</button>
      </div>
      <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 tabular">
        <div class="min-w-0 p-1.5 rounded-lg bg-black/20 border bdr-line"><label class="block text-[10px] font-bold t-mut text-center mb-0.5" data-tip="Schnittschaden-Bonus (Ganze Zahl oder - für nicht möglich)">Schnitt</label><input data-wpf="${w.id}:dmgCut" type="text" value="${esc(w.dmgCut)}" placeholder="-" class="inp w-full min-w-0 text-center font-black py-1 px-1.5 text-xs"/></div>
        <div class="min-w-0 p-1.5 rounded-lg bg-black/20 border bdr-line"><label class="block text-[10px] font-bold t-mut text-center mb-0.5" data-tip="Durchstoßschaden-Bonus (Ganze Zahl oder - für nicht möglich)">Durchstoß</label><input data-wpf="${w.id}:dmgPierce" type="text" value="${esc(w.dmgPierce)}" placeholder="-" class="inp w-full min-w-0 text-center font-black py-1 px-1.5 text-xs"/></div>
        <div class="min-w-0 p-1.5 rounded-lg bg-black/20 border bdr-line"><label class="block text-[10px] font-bold t-mut text-center mb-0.5" data-tip="Einschlagschaden-Bonus (Ganze Zahl oder - für nicht möglich)">Einschlag</label><input data-wpf="${w.id}:dmgImpact" type="text" value="${esc(w.dmgImpact)}" placeholder="-" class="inp w-full min-w-0 text-center font-black py-1 px-1.5 text-xs"/></div>
        ${renderEqCustomValBoxes('weapon',w.id,w.customDmg,'del-weapon-dmg')}
      </div>
    </div>
    ${isRng?`<div class="p-2.5 rounded-xl border border-amber-500/35 bg-amber-500/10 space-y-2 text-xs">
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 items-center">
        <div class="min-w-0 space-y-1">
          <span class="block text-[10px] font-extrabold text-amber-400 uppercase tracking-wider">🎯 Zugeordnete Munition</span>
          <button type="button" data-action="open-wp-ammo-picker" data-id="${w.id}" aria-haspopup="menu" aria-expanded="false" class="inp w-full py-1.5 px-2 text-xs font-bold flex items-center justify-between gap-2 text-left cursor-pointer hover:border-amber-400/70"><span class="truncate"${linkedAmmo?` data-wp-ammo-lbl="${linkedAmmo.id}"`:''}>${linkedAmmo?`${esc(linkedAmmo.name||'Unbenannte Munition')} (Vorrat: ${linkedAmmo.qty})`:'— Keine Munition zugeordnet —'}</span><span class="t-mut text-[10px] shrink-0">▾</span></button>
        </div>
        <div class="flex flex-wrap items-center gap-1.5 sm:justify-end">
          <button type="button" data-action="quick-new-ammo" data-wid="${w.id}" data-tip="Neue Munition direkt erstellen &amp; dieser Waffe zuordnen" class="btn py-1 px-2 text-[11px] border-amber-400/50 text-amber-300">+ Neue Munition</button>
          <button type="button" data-action="open-ammo-modal" data-wid="${w.id}" data-tip="Munitions-Liste bearbeiten (Benennung &amp; Anzahl direkt verwalten)" class="btn py-1 px-2 text-[11px]">⚙️ Liste</button>
        </div>
      </div>
      ${linkedAmmo?`<div class="flex flex-wrap items-center justify-between gap-2 pt-1.5 border-t border-amber-500/25">
        <div class="flex flex-wrap items-center gap-1.5 tabular">
          <span class="text-[11px] font-extrabold text-amber-400">Vorrat:</span>
          <button type="button" data-action="ammo-step" data-id="${linkedAmmo.id}" data-delta="-1" class="btn w-8 h-8 sm:w-7 sm:h-7 p-0 font-black">−</button>
          <input data-amf="${linkedAmmo.id}:qty" type="text" inputmode="numeric" value="${esc(linkedAmmo.qty)}" data-tip="Vorrat manuell überschreiben" class="inp w-16 text-center font-black py-1 px-1 text-xs border-amber-400/50 text-amber-300"/>
          <button type="button" data-action="ammo-step" data-id="${linkedAmmo.id}" data-delta="1" class="btn w-8 h-8 sm:w-7 sm:h-7 p-0 font-black">+</button>
          <button type="button" data-action="ammo-step" data-id="${linkedAmmo.id}" data-delta="-1" class="btn bg-amber-500 text-slate-950 border-amber-400 py-1 px-2.5 text-[11px] font-black">🏹 −1 Schuss</button>
        </div>
        <div class="flex flex-wrap items-center gap-1.5 tabular">
          <span class="px-2 py-0.5 rounded-md bg-black/25 border bdr-line text-[11px] font-semibold">Schnitt: <strong data-linked-ammo-dmg="${linkedAmmo.id}:dmgCut" class="text-amber-300 font-black">${esc(linkedAmmo.dmgCut)}</strong></span>
          <span class="px-2 py-0.5 rounded-md bg-black/25 border bdr-line text-[11px] font-semibold">Durchstoß: <strong data-linked-ammo-dmg="${linkedAmmo.id}:dmgPierce" class="text-amber-300 font-black">${esc(linkedAmmo.dmgPierce)}</strong></span>
          <span class="px-2 py-0.5 rounded-md bg-black/25 border bdr-line text-[11px] font-semibold">Einschlag: <strong data-linked-ammo-dmg="${linkedAmmo.id}:dmgImpact" class="text-amber-300 font-black">${esc(linkedAmmo.dmgImpact)}</strong></span>
          <span data-linked-ammo-custom="${linkedAmmo.id}" class="contents">${renderLinkedAmmoCustomDmgHtml(linkedAmmo.customDmg)}</span>
        </div>
        <div data-linked-ammo-tags="${linkedAmmo.id}" class="w-full flex flex-wrap items-center gap-1 ${(linkedAmmo.tags||[]).length?'':'hidden'}">${(linkedAmmo.tags||[]).map(tg=>`<span data-tip="${esc(getTagDesc(S.ammoTagList,tg.name,tg.x))}" class="tag !border-amber-400/45 !bg-amber-500/15 !text-amber-300 cursor-help">${esc(fmtTagLabel(tg.name,tg.x))}</span>`).join('')}</div>
      </div>`:''}
    </div>`:''}
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-2.5 items-start pt-2 border-t bdr-line">
      <div class="lg:col-span-7 min-w-0">${renderEqTagBar('weapon',w,S.weaponTagList,'weaponTags','Waffeneigenschaften')}</div>
      <div class="lg:col-span-5 min-w-0">
        <label class="block text-[11px] font-bold t-mut mb-1">Notizen</label>
        <input data-wpf="${w.id}:notes" type="text" value="${esc(w.notes)}" placeholder="Notizen" class="inp w-full min-w-0 text-xs"/>
      </div>
    </div>
  </div>`;
}

function renderAmmoCard(am,idx,len){
  const colStyle=am.color?`style="color:${esc(am.color)}"`:'', winStyle=cardColorStyle(am);
  const hdrRow=`<div class="flex items-center gap-1.5 min-w-0">
    <button type="button" data-action="toggle-eqitem-collapse" data-kind="ammo" data-id="${am.id}" data-tip="${am.collapsed?'Munition ausklappen':'Munition einklappen'}" aria-expanded="${!am.collapsed}" class="btn w-8 h-8 sm:w-7 sm:h-7 p-0 text-xs font-black shrink-0">${am.collapsed?'▸':'▾'}</button>
    <span draggable="true" data-drag-eqitem="ammo:${am.id}" data-tip="Ziehen zum Sortieren" class="w-7 h-7 rounded bg-amber-500/15 border border-amber-500/40 text-amber-400 text-xs font-black cursor-grab select-none shrink-0 inline-flex items-center justify-center">⠿</span>
    ${renderEqMiniThumb('ammo',am.id,am.img)}
    <input data-amf="${am.id}:name" type="text" value="${esc(am.name)}" ${colStyle} placeholder="Munitionsname..." class="inp-line flex-1 min-w-0 text-sm sm:text-base font-extrabold"/>
    <div class="flex items-center gap-1 shrink-0 tabular">
      <button type="button" data-action="ammo-step" data-id="${am.id}" data-delta="-1" aria-label="Munition minus 1" class="btn w-7 h-7 p-0 text-xs font-black">−</button>
      <input data-amf="${am.id}:qty" type="text" inputmode="numeric" value="${esc(am.qty)}" aria-label="Munitionsbestand" class="inp w-12 sm:w-14 text-center font-black py-1 px-1 text-xs border-amber-400/50 text-amber-300"/>
      <button type="button" data-action="ammo-step" data-id="${am.id}" data-delta="1" aria-label="Munition plus 1" class="btn w-7 h-7 p-0 text-xs font-black">+</button>
    </div>
    ${renderEqItemMenuBtn('ammo',am.id)}
  </div>`;
  if(am.collapsed){
    return `<div data-eqitem="ammo:${am.id}" class="subcard py-2 px-2.5 sm:px-3 border-amber-500/30 space-y-1.5 min-w-0" ${winStyle}>
      ${hdrRow}
      <div class="flex flex-wrap items-center gap-1.5 tabular min-w-0">
        <span data-ammo-collapsed-dmg="${am.id}" class="pill cursor-default text-[11px] py-0.5 px-2 max-w-full whitespace-normal break-words">Schnitt ${esc(am.dmgCut)} • Durchstoß ${esc(am.dmgPierce)} • Einschlag ${esc(am.dmgImpact)}${fmtCustomValSummarySuffix(am.customDmg)}</span>
        ${(am.tags||[]).length?`<span class="pill cursor-default text-[11px] py-0.5 px-2 text-amber-300">🏷️ ${am.tags.length}</span>`:''}
      </div>
    </div>`;
  }
  return `<div data-eqitem="ammo:${am.id}" class="subcard p-2.5 sm:p-3 space-y-3 border-amber-500/30 min-w-0" ${winStyle}>
    ${hdrRow}
    <div class="pt-2 border-t bdr-line space-y-1.5">
      <div class="flex items-center justify-between gap-2">
        <span class="text-[10px] font-extrabold text-amber-400 uppercase tracking-wider">Munitions-Schaden</span>
        <button type="button" data-action="add-ammo-dmg" data-id="${am.id}" data-tip="Benutzerdefinierten Munitions-Schadenswert hinzufügen (z.B. Energie, Feuer)" class="btn py-0.5 px-2 text-[11px]">+ Wert</button>
      </div>
      <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 tabular">
        <div class="min-w-0 p-1.5 rounded-lg bg-black/20 border bdr-line"><label class="block text-[10px] font-bold t-mut text-center mb-0.5">Schnitt</label><input data-amf="${am.id}:dmgCut" type="text" value="${esc(am.dmgCut)}" placeholder="-" class="inp w-full min-w-0 text-center font-black py-1 px-1.5 text-xs"/></div>
        <div class="min-w-0 p-1.5 rounded-lg bg-black/20 border bdr-line"><label class="block text-[10px] font-bold t-mut text-center mb-0.5">Durchstoß</label><input data-amf="${am.id}:dmgPierce" type="text" value="${esc(am.dmgPierce)}" placeholder="-" class="inp w-full min-w-0 text-center font-black py-1 px-1.5 text-xs"/></div>
        <div class="min-w-0 p-1.5 rounded-lg bg-black/20 border bdr-line"><label class="block text-[10px] font-bold t-mut text-center mb-0.5">Einschlag</label><input data-amf="${am.id}:dmgImpact" type="text" value="${esc(am.dmgImpact)}" placeholder="-" class="inp w-full min-w-0 text-center font-black py-1 px-1.5 text-xs"/></div>
        ${renderEqCustomValBoxes('ammo',am.id,am.customDmg,'del-ammo-dmg')}
      </div>
    </div>
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-2.5 items-start pt-2 border-t bdr-line">
      <div class="lg:col-span-7 min-w-0">${renderEqTagBar('ammo',am,S.ammoTagList,'ammoTags','Munitions-Tags')}</div>
      <div class="lg:col-span-5 min-w-0">
        <label class="block text-[11px] font-bold t-mut mb-1">Notizen</label>
        <input data-amf="${am.id}:notes" type="text" value="${esc(am.notes)}" placeholder="Notizen" class="inp w-full min-w-0 text-xs"/>
      </div>
    </div>
  </div>`;
}

function renderArmorCard(ar,idx,len,hzNames){
  const colStyle=ar.color?`style="color:${esc(ar.color)}"`:'', winStyle=cardColorStyle(ar);
  const isEq=ar.equipped!==false;
  const hdrRow=`<div class="flex items-center gap-1.5 min-w-0">
    <button type="button" data-action="toggle-eqitem-collapse" data-kind="armor" data-id="${ar.id}" data-tip="${ar.collapsed?'Rüstung ausklappen':'Rüstung einklappen'}" aria-expanded="${!ar.collapsed}" class="btn w-8 h-8 sm:w-7 sm:h-7 p-0 text-xs font-black shrink-0">${ar.collapsed?'▸':'▾'}</button>
    <span draggable="true" data-drag-eqitem="armor:${ar.id}" data-tip="Ziehen zum Sortieren" class="w-7 h-7 rounded bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 text-xs font-black cursor-grab select-none shrink-0 inline-flex items-center justify-center">⠿</span>
    ${renderEqMiniThumb('armor',ar.id,ar.img)}
    <input data-arf="${ar.id}:name" type="text" value="${esc(ar.name)}" ${colStyle} placeholder="Rüstungsname..." class="inp-line flex-1 min-w-0 text-sm sm:text-base font-extrabold"/>
    <button type="button" data-action="toggle-ar-eq" data-id="${ar.id}" data-tip="Rüstung an-/ablegen (steuert aktive Rüstungs-Tags bei Proben)" class="btn h-8 sm:h-7 px-2 text-[11px] font-extrabold shrink-0 whitespace-nowrap ${isEq?'btn-ok':'opacity-65'}">${isEq?'✓<span class="hidden sm:inline"> Angelegt</span>':'○<span class="hidden sm:inline"> Abgelegt</span>'}</button>
    ${renderEqItemMenuBtn('armor',ar.id)}
  </div>`;
  if(ar.collapsed){
    return `<div data-eqitem="armor:${ar.id}" class="subcard py-2 px-2.5 sm:px-3 border-emerald-500/30 space-y-1.5 min-w-0" ${winStyle}>
      ${hdrRow}
      <div class="flex flex-wrap items-center gap-1.5 tabular min-w-0">
        <span class="pill cursor-default text-[11px] py-0.5 px-2 text-emerald-400 font-black">gRP ${esc(ar.grp)}</span>
        <span class="pill cursor-default text-[11px] py-0.5 px-2 max-w-full whitespace-normal break-words">Schnitt ${esc(ar.protCut)} • Durchstoß ${esc(ar.protPierce)} • Einschlag ${esc(ar.protImpact)}${fmtCustomValSummarySuffix(ar.customProt)}</span>
        ${(ar.zones||[]).length?`<span class="pill cursor-default text-[11px] py-0.5 px-2 max-w-full whitespace-normal break-words">🎯 ${esc(ar.zones.join(', '))}</span>`:''}
      </div>
    </div>`;
  }
  return `<div data-eqitem="armor:${ar.id}" class="subcard p-2.5 sm:p-3 space-y-3 border-emerald-500/30 min-w-0" ${winStyle}>
    ${hdrRow}
    <div class="pt-2 border-t bdr-line space-y-1.5">
      <div class="flex items-center justify-between gap-2">
        <span class="text-[10px] font-extrabold text-emerald-400 uppercase tracking-wider">Schutzwerte</span>
        <button type="button" data-action="add-armor-prot" data-id="${ar.id}" data-tip="Benutzerdefinierten Schutzwert hinzufügen (z.B. Energie, Feuer)" class="btn py-0.5 px-2 text-[11px]">+ Wert</button>
      </div>
      <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 tabular">
        <div class="min-w-0 p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/40"><label class="block text-[10px] font-extrabold text-emerald-400 text-center mb-0.5" data-tip="Generelle Rüstungspunkte (gRP)">gRP</label><input data-arf="${ar.id}:grp" type="text" value="${esc(ar.grp)}" placeholder="0" class="inp w-full min-w-0 text-center font-black py-1 px-1.5 text-xs border-emerald-500/50"/></div>
        <div class="min-w-0 p-1.5 rounded-lg bg-black/20 border bdr-line"><label class="block text-[10px] font-bold t-mut text-center mb-0.5" data-tip="Rüstung gegen Schnitt">Schnitt</label><input data-arf="${ar.id}:protCut" type="text" value="${esc(ar.protCut)}" placeholder="0" class="inp w-full min-w-0 text-center font-black py-1 px-1.5 text-xs"/></div>
        <div class="min-w-0 p-1.5 rounded-lg bg-black/20 border bdr-line"><label class="block text-[10px] font-bold t-mut text-center mb-0.5" data-tip="Rüstung gegen Durchstoß">Durchstoß</label><input data-arf="${ar.id}:protPierce" type="text" value="${esc(ar.protPierce)}" placeholder="0" class="inp w-full min-w-0 text-center font-black py-1 px-1.5 text-xs"/></div>
        <div class="min-w-0 p-1.5 rounded-lg bg-black/20 border bdr-line"><label class="block text-[10px] font-bold t-mut text-center mb-0.5" data-tip="Rüstung gegen Einschlag">Einschlag</label><input data-arf="${ar.id}:protImpact" type="text" value="${esc(ar.protImpact)}" placeholder="0" class="inp w-full min-w-0 text-center font-black py-1 px-1.5 text-xs"/></div>
        ${renderEqCustomValBoxes('armor',ar.id,ar.customProt,'del-armor-prot')}
      </div>
    </div>
    <div class="pt-2 border-t bdr-line space-y-2 text-xs">
      <div class="flex flex-wrap items-center justify-between gap-2">
        <label class="block text-[11px] font-bold t-mut">Abgedeckte Trefferzonen</label>
        <button type="button" data-action="open-ar-zone-picker" data-id="${ar.id}" aria-haspopup="menu" aria-expanded="false" data-tip="Trefferzonen bequem per Popover/Bottom-Sheet mehrfach an- &amp; abwählen" class="btn py-0.5 px-2 text-[11px] bdr-acc bg-acc-soft text-acc">🎯 Zonen (${(ar.zones||[]).length}) ▾</button>
      </div>
      <div class="flex flex-wrap items-center gap-1.5">
        ${hzNames.map(zn=>{
          const on=(ar.zones||[]).some(z=>z.toLowerCase()===zn.toLowerCase());
          return `<button type="button" data-action="toggle-ar-zone" data-id="${ar.id}" data-zone="${esc(zn)}" class="btn py-1 px-2 text-[11px] ${on?'btn-ok':'opacity-75'}">${on?'✓ ':''}${esc(zn)}</button>`;
        }).join('')}
        ${[...new Set([...(ar.extraZones||[]),...(ar.zones||[])])].filter(zn=>zn&&!hzNames.some(h=>h.toLowerCase()===zn.toLowerCase())).map(zn=>{
          const on=(ar.zones||[]).some(z=>z.toLowerCase()===zn.toLowerCase());
          return `<span class="inline-flex items-center"><button type="button" data-action="toggle-ar-zone" data-id="${ar.id}" data-zone="${esc(zn)}" class="btn py-1 px-2 text-[11px] rounded-r-none ${on?'btn-ok':'opacity-75'}">${on?'✓ ':''}${esc(zn)}</button><button type="button" data-action="del-ar-zone" data-id="${ar.id}" data-zone="${esc(zn)}" data-tip="Eigene Zone „${esc(zn)}“ löschen" class="btn py-1 px-1.5 text-[10px] rounded-l-none border-l-0 hover:text-rose-400 opacity-75">✕</button></span>`;
        }).join('')}
      </div>
      <div class="flex items-center gap-1.5 w-full sm:max-w-xs">
        <input id="inpArCz_${ar.id}" data-ar-zone-draft="${ar.id}" type="text" value="${esc(UI.arZoneDrafts?.[ar.id]||'')}" placeholder="Weitere Zonen..." class="inp py-1 px-2 text-xs flex-1 min-w-0"/>
        <button type="button" data-action="add-ar-zone" data-id="${ar.id}" data-tip="Eingetragene Zone speichern &amp; als anwählbaren Button hinzufügen (oder Enter drücken)" class="btn btn-ok py-1 px-2.5 text-[11px] shrink-0">+ Zone</button>
      </div>
    </div>
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-2.5 items-start pt-2 border-t bdr-line">
      <div class="lg:col-span-7 min-w-0">${renderEqTagBar('armor',ar,S.armorTagList,'armorTags','Rüstungs-Tags')}</div>
      <div class="lg:col-span-5 min-w-0">
        <label class="block text-[11px] font-bold t-mut mb-1">Notizen</label>
        <input data-arf="${ar.id}:notes" type="text" value="${esc(ar.notes)}" placeholder="Notizen" class="inp w-full min-w-0 text-xs"/>
      </div>
    </div>
  </div>`;
}

function renderInvSecSlot(parentId,beforeSecId){
  return `<div data-inv-sec-slot="${esc(parentId)}" data-before-sec="${esc(beforeSecId||'')}" class="pw-sec-slot"></div>`;
}

function renderInvItemCard(it,idx,len,invSecs){
  const hasInvSec=invSecs.length>0;
  const curSecId=(it.sectionId&&invSecs.some(s=>s.id===it.sectionId))?it.sectionId:'';
  const curSecObj=curSecId?invSecs.find(s=>s.id===curSecId):null;
  const colStyle=it.color?`style="color:${esc(it.color)}"`:'', winStyle=cardColorStyle(it);
  const qtyTxt=String(it.qty??'').trim();
  const catTxt=String(it.category??'').trim();
  const noteTxt=String(it.notes??'').trim();
  const hdrRow=`<div class="flex items-center gap-1.5 min-w-0">
    <button type="button" data-action="toggle-eqitem-collapse" data-kind="inv" data-id="${it.id}" data-tip="${it.collapsed?'Gegenstand ausklappen':'Gegenstand einklappen'}" aria-expanded="${!it.collapsed}" class="btn w-8 h-8 sm:w-7 sm:h-7 p-0 text-xs font-black shrink-0">${it.collapsed?'▸':'▾'}</button>
    <span draggable="true" data-drag-invitem="${it.id}" data-tip="Ziehen zum Sortieren oder Verschieben in einen Beutel" class="w-7 h-7 rounded bg-black/25 border bdr-line t-mut text-xs font-black cursor-grab select-none shrink-0 inline-flex items-center justify-center">⠿</span>
    ${renderEqMiniThumb('inv',it.id,it.img)}
    <input data-inv="${it.id}:name" type="text" value="${esc(it.name)}" ${colStyle} placeholder="Gegenstand..." class="inp-line flex-1 min-w-0 text-sm sm:text-base font-extrabold"/>
    ${it.collapsed&&qtyTxt?`<span class="pill cursor-default text-[11px] py-0.5 px-2 tabular text-acc shrink-0">× ${esc(qtyTxt)}</span>`:''}
    ${renderEqItemMenuBtn('inv',it.id)}
  </div>`;
  if(it.collapsed){
    const hasBadges=Boolean((catTxt&&catTxt!=='Inventar')||curSecObj||noteTxt);
    return `<div data-inv-item="${it.id}" class="subcard py-2 px-2.5 sm:px-3 space-y-1.5 min-w-0" ${winStyle}>
      ${hdrRow}
      ${hasBadges?`<div class="flex flex-wrap items-center gap-1.5 min-w-0">
        ${catTxt&&catTxt!=='Inventar'?`<span class="pill cursor-default text-[11px] py-0.5 px-2">${esc(catTxt)}</span>`:''}
        ${curSecObj?`<span class="pill cursor-default text-[11px] py-0.5 px-2 text-acc" data-inv-sec-lbl="${curSecObj.id}">🎒 ${esc(curSecObj.name||'Beutel')}</span>`:''}
        ${noteTxt?`<span class="text-[11px] t-mut truncate max-w-full">📝 ${esc(noteTxt)}</span>`:''}
      </div>`:''}
    </div>`;
  }
  return `<div data-inv-item="${it.id}" class="subcard p-2.5 sm:p-3 space-y-2.5 min-w-0" ${winStyle}>
    ${hdrRow}
    <div class="pt-2 border-t bdr-line grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 items-end">
      <div class="min-w-0">
        <label class="block text-[10px] font-bold t-mut mb-0.5">MENGE</label>
        <input data-inv="${it.id}:qty" type="text" value="${esc(it.qty)}" placeholder="1" class="inp w-full min-w-0 text-center font-bold py-1.5 px-2 text-xs"/>
      </div>
      <div class="min-w-0">
        <label class="block text-[10px] font-bold t-mut mb-0.5">KATEGORIE</label>
        <input data-inv="${it.id}:category" type="text" value="${esc(it.category)}" placeholder="Inventar" class="inp w-full min-w-0 py-1.5 px-2 text-xs"/>
      </div>
      ${hasInvSec?`<div class="min-w-0">
        <label class="block text-[10px] font-bold t-mut mb-0.5">BEUTEL / SEKTION</label>
        <button type="button" data-action="open-inv-sec-picker" data-id="${it.id}" aria-haspopup="menu" aria-expanded="false" data-tip="Beutel / Sektion zuordnen" class="inp w-full py-1.5 px-2 text-xs font-semibold flex items-center justify-between gap-1.5 text-left cursor-pointer hover:border-sky-400/70"><span class="truncate"${curSecObj?` data-inv-sec-lbl="${curSecObj.id}"`:''}>${curSecObj?`🎒 ${esc(curSecObj.name||'Beutel')}`:'🎒 Ohne Beutel'}</span><span class="t-mut text-[10px] shrink-0">▾</span></button>
      </div>`:''}
      <div class="min-w-0 ${hasInvSec?'':'sm:col-span-2'}">
        <label class="block text-[10px] font-bold t-mut mb-0.5">NOTIZEN</label>
        <input data-inv="${it.id}:notes" type="text" value="${esc(it.notes)}" placeholder="Notizen..." class="inp w-full min-w-0 py-1.5 px-2 text-xs"/>
      </div>
    </div>
  </div>`;
}

function renderInvTable(items){
  const invSecs=Array.isArray(S.invSections)?S.invSections:[];
  const list=Array.isArray(items)?items:[];
  if(!list.length) return `<div class="py-4 text-center text-xs t-mut">Noch keine Gegenstände eingetragen.</div>`;
  return `<div class="space-y-2.5">${list.map((it,idx)=>renderInvItemCard(it,idx,list.length,invSecs)).join('')}</div>`;
}

function renderInvSection(sec,sIdx,sibLen=1,depth=0){
  const invSecs=Array.isArray(S.invSections)?S.invSections:[];
  const secItems=S.inventory.filter(it=>it.sectionId===sec.id);
  const childSecs=invSecs.filter(s=>(s.parentSectionId||'')===sec.id);
  const colStyle=sec.color?`style="color:${esc(sec.color)}"`:'', winStyle=cardColorStyle(sec);
  return `<section data-inv-sec="${sec.id}" class="card p-3 sm:p-4 space-y-3 border-2 bdr-acc ${depth>0?'bg-black/15':''} min-w-0" ${winStyle}>
    <div class="flex flex-wrap items-center justify-between gap-2 ${sec.collapsed?'':'border-b bdr-line pb-2.5'}">
      <div class="flex items-center gap-1.5 flex-1 min-w-0">
        <button type="button" data-action="toggle-invsec-collapse" data-id="${sec.id}" data-tip="${sec.collapsed?'Beutel ausklappen':'Beutel einklappen'}" aria-expanded="${!sec.collapsed}" class="btn w-8 h-8 sm:w-7 sm:h-7 p-0 text-xs font-black shrink-0">${sec.collapsed?'▸':'▾'}</button>
        <span draggable="true" data-drag-invsec="${sec.id}" data-tip="Ziehen zum Sortieren oder in einen anderen Beutel legen" class="w-7 h-7 rounded bg-acc-soft border bdr-acc text-acc text-xs font-black cursor-grab select-none shrink-0 inline-flex items-center justify-center">⠿</span>
        ${depth>0?`<span class="text-xs font-black text-acc shrink-0" data-tip="Unterordner (Ebene ${depth+1})">↳</span>`:''}
        <input data-invsecf="${sec.id}:name" type="text" value="${esc(sec.name)}" ${colStyle} placeholder="z.B. Rucksack, Gürteltasche..." class="inp-line flex-1 min-w-0 text-sm sm:text-base font-black"/>
      </div>
      <div class="flex items-center gap-1.5 shrink-0">
        <span class="pill cursor-default text-[11px] py-0.5 px-2 tabular shrink-0">${secItems.length}${childSecs.length?` • ${childSecs.length} ↳`:''}</span>
        <button type="button" data-action="add-inv" data-sec="${sec.id}" data-tip="Neuen Gegenstand direkt in diesem Beutel anlegen" class="btn btn-pri py-1 px-2 text-xs whitespace-nowrap">+ <span class="hidden sm:inline">Gegenstand</span><span class="sm:hidden">Item</span></button>
        <button type="button" data-action="open-invsec-menu" data-id="${sec.id}" aria-haspopup="menu" aria-expanded="false" aria-label="Beutel-Aktionen" data-tip="Beutel-Aktionen (Sortieren ▲/▼, Unterordner, Farben, A–Z, Löschen)" class="btn w-8 h-8 sm:w-7 sm:h-7 p-0 text-sm font-black shrink-0">⋮</button>
      </div>
    </div>
    ${!sec.collapsed?((secItems.length||childSecs.length)?`<div class="space-y-3 pt-1">${secItems.length?renderInvTable(secItems):''}${childSecs.length?`<div class="pl-2.5 sm:pl-5 border-l-2 bdr-acc">${childSecs.map((cs,ci)=>renderInvSecSlot(sec.id,cs.id)+renderInvSection(cs,ci,childSecs.length,depth+1)).join('')}${renderInvSecSlot(sec.id,'')}</div>`:''}</div>`:`<div class="subcard border-dashed text-center py-4 text-xs t-mut">Gegenstände per Drag &amp; Drop (Desktop), über das ⋮-Menü („Beutel wechseln“) oder über „+ Gegenstand“ hinzufügen.</div>`):''}
  </section>`;
}

function renderEquipCategorySec(secKey,secIdx,totalSecs,hzNames,eqH){
  const meta=S.equipSecMeta?.[secKey]||{collapsed:false,color:'',bgColor:''};
  const colStyle=meta.color?`style="color:${esc(meta.color)}"`:'', winStyle=cardColorStyle(meta);
  const hdrCommon=(titleHtml,rightAddHtml)=>`<div class="flex flex-wrap items-center justify-between gap-2 ${meta.collapsed?'':'border-b bdr-line pb-2'}">
    <div class="flex items-center gap-1.5 min-w-0 flex-1">
      <button type="button" data-action="toggle-eqsec-collapse" data-sec="${secKey}" data-tip="${meta.collapsed?'Kategorie ausklappen':'Kategorie einklappen'}" aria-expanded="${!meta.collapsed}" class="btn w-8 h-8 sm:w-7 sm:h-7 p-0 text-xs font-black shrink-0">${meta.collapsed?'▸':'▾'}</button>
      <span draggable="true" data-drag-eqsec="${secKey}" data-tip="Ziehen zum Verschieben der gesamten Kategorie" class="w-7 h-7 rounded bg-acc-soft border bdr-acc text-acc text-xs font-black cursor-grab select-none shrink-0 inline-flex items-center justify-center">⠿</span>
      <h3 class="text-sm sm:text-base font-extrabold truncate" ${colStyle}>${titleHtml}</h3>
    </div>
    <div class="flex items-center gap-1.5 shrink-0">
      ${rightAddHtml}
      <button type="button" data-action="open-eq-sec-menu" data-sec="${secKey}" aria-haspopup="menu" aria-expanded="false" aria-label="Kategorie-Aktionen" data-tip="Kategorie-Aktionen (Sortieren ▲/▼, Farben, Tag-Listen)" class="btn w-8 h-8 sm:w-7 sm:h-7 p-0 text-sm font-black shrink-0">⋮</button>
    </div>
  </div>`;

  if(secKey==='weapons'){
    return `<section data-eqsec="weapons" class="card p-3 sm:p-4 space-y-3 min-w-0" ${winStyle}>
      ${hdrCommon(`⚔️ Waffen (${S.weapons.length})`,renderAddWeaponDropdown('eq-add-weapon:sec','btn py-1 px-2.5 text-xs',true))}
      ${!meta.collapsed?(!S.weapons.length?`<div class="py-4 text-center text-xs t-mut">Noch keine Waffen eingetragen.</div>`:`<div class="space-y-2.5">${S.weapons.map((w,i)=>renderWeaponCard(w,i,S.weapons.length)).join('')}</div>`):''}
    </section>`;
  }
  if(secKey==='ammos'){
    return `<section data-eqsec="ammos" class="card p-3 sm:p-4 space-y-3 min-w-0" ${winStyle}>
      ${hdrCommon(`<span class="${meta.color?'':'text-amber-400'}">🎯 Munition (${S.ammos.length})</span>`,`<button type="button" data-action="add-ammo" class="btn border-amber-400/60 text-amber-400 py-1 px-2.5 text-xs">+ Munition</button>`)}
      ${!meta.collapsed?(!S.ammos.length?`<div class="py-3 text-center text-xs t-mut">Noch keine Munition erfasst.</div>`:`<div class="space-y-2.5">${S.ammos.map((am,i)=>renderAmmoCard(am,i,S.ammos.length)).join('')}</div>`):''}
    </section>`;
  }
  if(secKey==='armors'){
    return `<section data-eqsec="armors" class="card p-3 sm:p-4 space-y-3 min-w-0" ${winStyle}>
      ${hdrCommon(`<span class="${meta.color?'':'text-emerald-400'}">🛡️ Rüstungen (${S.armors.length})</span>`,`<button type="button" data-action="add-armor" class="btn border-emerald-400/60 text-emerald-400 py-1 px-2.5 text-xs">+ Rüstung</button>`)}
      ${!meta.collapsed?(!S.armors.length?`<div class="py-3 text-center text-xs t-mut">Noch keine Rüstungen eingetragen.</div>`:`<div class="space-y-2.5">${S.armors.map((ar,i)=>renderArmorCard(ar,i,S.armors.length,hzNames)).join('')}</div>`):''}
    </section>`;
  }
  const invSecs=Array.isArray(S.invSections)?S.invSections:[];
  const hasInvSec=invSecs.length>0;
  const rootInvSecs=invSecs.filter(s=>!s.parentSectionId||!invSecs.some(p=>p.id===s.parentSectionId));
  const unsecInvItems=S.inventory.filter(it=>!it.sectionId||!invSecs.some(s=>s.id===it.sectionId));
  const invRightBtns=`<button type="button" data-action="add-inv-section" data-tip="Neuen Beutel / Sektion erstellen" class="btn bg-acc-soft bdr-acc text-acc py-1 px-2 text-xs whitespace-nowrap">+ Beutel</button><button type="button" data-action="add-inv" class="btn btn-pri py-1 px-2 text-xs whitespace-nowrap">+ <span class="hidden sm:inline">Gegenstand</span><span class="sm:hidden">Item</span></button>`;
  const eqNotesCol=isTab5EquipNotesCollapsed();
  const eqNotesPlain=stripHtml(S.equipNotes||'').replace(/\s+/g,' ').trim();
  return `<section data-eqsec="inventory" class="card p-3 sm:p-4 space-y-3 min-w-0" ${winStyle}>
    ${hdrCommon(`🎒 Inventar (${S.inventory.length})`,invRightBtns)}
    ${!meta.collapsed?`${!hasInvSec?renderInvTable(S.inventory):`<div class="pw-sec-list">${rootInvSecs.map((sec,sIdx)=>renderInvSecSlot('',sec.id)+renderInvSection(sec,sIdx,rootInvSecs.length,0)).join('')}${renderInvSecSlot('','')}</div>${unsecInvItems.length?`<div data-inv-sec="" class="subcard space-y-2.5 pt-2"><div class="flex flex-wrap items-center justify-between gap-2 px-1"><h4 class="text-sm font-extrabold t-mut">Gegenstände ohne Beutel (${unsecInvItems.length})</h4><span class="hidden md:inline text-[11px] t-mut">Hierher ziehen zum Herauslösen</span></div>${renderInvTable(unsecInvItems)}</div>`:`<div data-inv-sec="" class="subcard border-dashed text-center py-3 text-xs t-mut">Ohne Beutel – Gegenstände hierher ziehen oder im ⋮-Menü „Ohne Beutel“ wählen</div>`}`}
    <div class="subcard p-2.5 sm:p-3 space-y-2 rtf-wrap min-w-0">
      <div class="flex flex-wrap items-center justify-between gap-2 min-w-0">
        <button type="button" data-action="toggle-t5-sec" data-sec="equipNotes" aria-expanded="${!eqNotesCol}" class="t1-hdr-title flex-1 min-w-0">
          <span class="btn w-7 h-7 p-0 text-xs font-black shrink-0">${eqNotesCol?'▸':'▾'}</span>
          <span class="text-xs sm:text-sm font-extrabold truncate">📝 Waffen, Rüstung &amp; Handwerk (Freitext)</span>
          ${eqNotesCol&&eqNotesPlain?`<span class="text-[11px] t-mut truncate min-w-0 flex-1 hidden sm:inline">${esc(eqNotesPlain.slice(0,90))}</span>`:''}
        </button>
        ${!eqNotesCol?renderRtfToolbarHtml(true):''}
      </div>
      ${eqNotesCol&&eqNotesPlain?`<div class="text-[11px] t-mut truncate sm:hidden">${esc(eqNotesPlain.slice(0,80))}</div>`:''}
      ${!eqNotesCol?`<div contenteditable="true" data-bind-rtf="equipNotes" data-boxh="bio:equipNotes" ${eqH} data-ph="Notizen" class="inp w-full autogrow rtf-box">${toRtfHtml(S.equipNotes)}</div>`:''}
    </div>`:''}
  </section>`;
}

function tplEquipment(){
  const hzNames=[...new Set(S.hitZones.map(z=>String(z.zone||'').trim()).filter(Boolean))];
  const eqH=S.bioBoxH?.equipNotes>0?`style="height:${S.bioBoxH.equipNotes}px"`:'';
  const ord=Array.isArray(S.equipSecOrder)&&S.equipSecOrder.length===4?S.equipSecOrder:DEF_EQ_SEC_ORDER;
  const bioSecCol=Boolean(UI.tab5?.bioSec);
  const bioGalCol=isTab5BioGalleryCollapsed();
  return `<section class="card p-3 sm:p-4 flex flex-wrap items-center justify-between gap-2.5 min-w-0">
    <div class="min-w-0 flex-1">
      <h2 class="text-base sm:text-lg font-extrabold" data-tip="Kategorien und Gegenstände lassen sich per ⠿ (Desktop) oder über das ⋮-Menü (▲/▼, Farben, Bild, Duplizieren, Löschen) verwalten.">Ausrüstung &amp; Bio</h2>
      <p class="text-xs t-mut">Karten sind klappbar (▾/▸); Farben, Bild, Sortierung (▲/▼) &amp; Löschen liegen im ⋮-Menü.</p>
    </div>
    <div class="flex flex-wrap items-center gap-1.5">
      <button type="button" data-action="collapse-all-eq" data-val="1" class="btn py-1 px-2 text-xs">▸ Alle zu</button>
      <button type="button" data-action="collapse-all-eq" data-val="0" class="btn py-1 px-2 text-xs">▾ Alle auf</button>
      ${renderAddWeaponDropdown('eq-add-weapon:top','btn py-1 px-2 text-xs',true)}
      <button type="button" data-action="add-ammo" class="btn border-amber-400/60 text-amber-400 py-1 px-2 text-xs">🎯 + Mun.</button>
      <button type="button" data-action="add-armor" class="btn border-emerald-400/60 text-emerald-400 py-1 px-2 text-xs">🛡️ + Rüst.</button>
      <button type="button" data-action="add-inv" class="btn py-1 px-2 text-xs">🎒 + Inv.</button>
    </div>
  </section>

  <div class="space-y-4">
    ${ord.map((secKey,sIdx)=>renderEquipCategorySec(secKey,sIdx,ord.length,hzNames,eqH)).join('')}
  </div>

  <section class="card p-3 sm:p-4 space-y-3 min-w-0">
    <div class="flex flex-wrap items-center justify-between gap-2 ${bioSecCol?'':'border-b bdr-line pb-2'}">
      <button type="button" data-action="toggle-t5-sec" data-sec="bioSec" aria-expanded="${!bioSecCol}" class="t1-hdr-title flex-1 min-w-0">
        <span class="btn w-8 h-8 sm:w-7 sm:h-7 p-0 text-xs font-black shrink-0">${bioSecCol?'▸':'▾'}</span>
        <h2 class="text-base font-extrabold truncate">Bio &amp; Beschreibung</h2>
      </button>
      <div class="flex flex-wrap items-center gap-1.5 shrink-0">
        ${!bioSecCol?`<button type="button" data-action="collapse-all-bio" data-val="1" class="btn py-1 px-2 text-xs">▸ Alle zu</button><button type="button" data-action="collapse-all-bio" data-val="0" class="btn py-1 px-2 text-xs">▾ Alle auf</button>`:''}
        <div class="hidden md:inline-flex">${!bioSecCol?renderRtfToolbarHtml(false):''}</div>
      </div>
    </div>
    ${!bioSecCol?`<div class="space-y-3">
      <div class="subcard p-2.5 sm:p-3 space-y-2.5 min-w-0">
        <div class="flex flex-wrap items-center justify-between gap-2 min-w-0">
          <button type="button" data-action="toggle-t5-sec" data-sec="bioGallery" aria-expanded="${!bioGalCol}" class="t1-hdr-title flex-1 min-w-0">
            <span class="btn w-7 h-7 p-0 text-xs font-black shrink-0">${bioGalCol?'▸':'▾'}</span>
            <span class="text-xs sm:text-sm font-extrabold truncate">🖼️ Bio-Bildergalerie (${S.bioImages.length})</span>
          </button>
          <button type="button" data-action="pick-bio-img" data-tip="Bild zum Aussehen importieren (1:1 Quadrat-Ansicht, wird im JSON-Export mitgesichert)" class="btn py-1 px-2.5 text-xs bdr-acc bg-acc-soft text-acc shrink-0">+ Bild</button>
        </div>
        ${!bioGalCol?(S.bioImages.length
          ?`<div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 pt-1">${S.bioImages.map(im=>`<div class="subcard p-2 relative flex flex-col gap-1.5 min-w-0"><button type="button" data-action="pick-bio-img" data-id="${im.id}" data-tip="Bild-Aktionen öffnen (ändern, Großansicht oder entfernen)" class="w-full overflow-hidden rounded-lg border bdr-line bg-black/25 cursor-pointer hover:opacity-90 transition-opacity p-0 block" style="aspect-ratio:1/1"><img src="${im.url}" alt="${esc(im.caption||'Bio-Bild')}" class="w-full h-full object-cover" style="aspect-ratio:1/1"/></button><input data-bioimg-cap="${im.id}" type="text" value="${esc(im.caption||'')}" placeholder="Bildnotiz..." class="inp-line text-[11px] w-full min-w-0"/></div>`).join('')}</div>`
          :`<div class="text-xs t-mut text-center py-3 border border-dashed bdr-line rounded-lg">Noch keine Bilder importiert – tippe auf „+ Bild“, um Charakter- oder Aussehensbilder hinzuzufügen.</div>`
        ):''}
      </div>
      <div class="space-y-2.5">${BIO_FIELDS.map(b=>{
        const bh=S.bioBoxH?.[b.k]>0?`style="height:${S.bioBoxH[b.k]}px"`:'';
        const fCol=isTab5BioFieldCollapsed(b.k);
        const plain=stripHtml(S.bio?.[b.k]||'').replace(/\s+/g,' ').trim();
        return `<div class="subcard p-2.5 sm:p-3 space-y-2 rtf-wrap min-w-0">
          <div class="flex flex-wrap items-center justify-between gap-2 min-w-0">
            <button type="button" data-action="toggle-t5-bio" data-biok="${b.k}" aria-expanded="${!fCol}" class="t1-hdr-title flex-1 min-w-0">
              <span class="btn w-7 h-7 p-0 text-xs font-black shrink-0">${fCol?'▸':'▾'}</span>
              <span class="text-xs sm:text-sm font-extrabold truncate">${b.l}</span>
              ${fCol&&plain?`<span class="text-[11px] t-mut truncate min-w-0 flex-1 hidden sm:inline">${esc(plain.slice(0,90))}</span>`:''}
            </button>
            ${!fCol?renderRtfToolbarHtml(true):''}
          </div>
          ${fCol&&plain?`<div class="text-[11px] t-mut truncate sm:hidden">${esc(plain.slice(0,80))}</div>`:''}
          ${!fCol?`<div contenteditable="true" data-bio="${b.k}" data-boxh="bio:${b.k}" ${bh} data-ph="Notizen" class="inp w-full autogrow rtf-box">${toRtfHtml(S.bio[b.k])}</div>`:''}
        </div>`;
      }).join('')}</div>
    </div>`:''}
  </section>`;
}

function setLobbyCharCampaign(cid,newCampId){
  const cleanCampId=String(newCampId||'default').trim()||'default';
  const owner=getCharOwner(cid), isMyChar=Boolean(owner&&CLOUD.currentUser&&owner.toLowerCase()===CLOUD.currentUser.toLowerCase());
  if(!CLOUD.isAdmin&&!isMyChar&&!canManageCampaign(getCharCampaignId(cid))) return;
  const camps=CLOUD.isAdmin?getCampaigns():getCreatableCampaigns(CLOUD.currentUser);
  const targetCamp=camps.find(c=>c.id===cleanCampId)||camps[0]||{id:'default',name:'Ohne Kampagne / Allgemein'};
  const effCampId=targetCamp.id;
  if(!CLOUD.registry.charCampaigns||typeof CLOUD.registry.charCampaigns!=='object') CLOUD.registry.charCampaigns={};
  CLOUD.registry.charCampaigns[cid]=effCampId;
  const ch=CLOUD.list.find(x=>x.id===cid);
  if(ch) ch.campaignId=effCampId;
  if(S.charId===cid){S.campaignId=effCampId;save(false);}
  const charName=ch?.name||(S.charId===cid?S.profile.name:'')||'Charakter';
  updateCloudCharacterMeta(cid,d=>{d.campaignId=effCampId;if(d._summary)d._summary.campaignId=effCampId;},`🗺️ „${charName}“ in „${targetCamp.name}“ verschoben!`);
}
function setLobbyCharOwner(cid,newOwnRaw){
  if(!CLOUD.isAdmin) return;
  const newOwn=String(newOwnRaw||'').trim();
  if(newOwn) CLOUD.registry.claims[cid]=newOwn;
  else CLOUD.registry.claims[cid]='';
  const ch=CLOUD.list.find(x=>x.id===cid);
  if(ch) ch.owner=newOwn;
  if(S.charId===cid) S.owner=newOwn;
  updateCloudCharacterMeta(cid,d=>{d.owner=newOwn;if(d._summary)d._summary.owner=newOwn;},newOwn?`👑 Besitzer auf „${newOwn}“ geändert`:'👑 Charakter auf „Frei“ gesetzt');
}
function openLobbyCharCampPicker(anchorEl,cid){
  const ch=CLOUD.list.find(x=>x.id===cid);
  const charName=ch?.name||'Charakter';
  const curCampId=getCharCampaignId(cid);
  const camps=CLOUD.isAdmin?getCampaigns():getCreatableCampaigns(CLOUD.currentUser);
  const items=[
    {type:'label',label:`Kampagne für „${charName}“`},
    ...camps.map(c=>({
      icon:c.id==='default'?'🌐':'📁',
      label:c.id==='default'?(c.name||'Ohne Kampagne / Allgemein'):(c.name||'Kampagne'),
      active:curCampId===c.id,
      onClick:()=>{if(curCampId!==c.id) setLobbyCharCampaign(cid,c.id);}
    }))
  ];
  openCtxMenu({key:`lobby-char-camp:${cid}`,title:'Kampagne wechseln',anchorEl,align:'right',minWidth:235,items});
}
function openLobbyCharOwnerPicker(anchorEl,cid){
  if(!CLOUD.isAdmin) return;
  const ch=CLOUD.list.find(x=>x.id===cid);
  const charName=ch?.name||'Charakter';
  const curOwner=getCharOwner(cid);
  const regUsers=Object.keys(CLOUD.registry.users||{}).sort((a,b)=>a.localeCompare(b,'de'));
  const allCampaigns=getCampaigns();
  const knownUsers=sortAlpha([
    ...regUsers,
    ...Object.values(CLOUD.registry.claims||{}),
    ...allCampaigns.flatMap(c=>c.allowedUsers||[]),
    ...(CLOUD.currentUser?[CLOUD.currentUser]:[]),
    ...(curOwner?[curOwner]:[])
  ]);
  const items=[
    {type:'label',label:`Besitzer für „${charName}“`},
    {icon:'⚪',label:'Frei (Unbeansprucht)',active:!curOwner,onClick:()=>{if(curOwner) setLobbyCharOwner(cid,'');}},
    ...(knownUsers.length?[{sep:true}]:[]),
    ...knownUsers.map(u=>({
      icon:'👤',
      label:u,
      active:curOwner===u,
      onClick:()=>{if(curOwner!==u) setLobbyCharOwner(cid,u);}
    }))
  ];
  openCtxMenu({key:`lobby-char-owner:${cid}`,title:'Besitzer wechseln',anchorEl,align:'right',minWidth:235,items});
}
function openLobbyCharMenu(anchorEl,cid,forceOpen=false){
  const ch=CLOUD.list.find(x=>x.id===cid);
  if(!ch) return;
  const dispName=String(ch.name||'').trim()||'Unbenannter Held';
  const owner=getCharOwner(cid);
  const isMyClaim=Boolean(owner&&CLOUD.currentUser&&owner.toLowerCase()===CLOUD.currentUser.toLowerCase());
  const charCampId=getCharCampaignId(cid);
  const isCampGM=charCampId!=='default'&&canManageCampaign(charCampId);
  const canManageThisChar=CLOUD.isAdmin||isMyClaim||isCampGM;
  const canEditThisChar=canManageThisChar||!owner;
  const allCamps=getCampaigns();
  const curCampObj=allCamps.find(c=>c.id===charCampId);
  const curCampName=curCampObj?(curCampObj.id==='default'?'Allgemein':curCampObj.name):'Allgemein';
  const isDelAsk=CLOUD.confirmDelCloudId===cid;
  const items=[];
  items.push({type:'label',label:'Ansicht & Teilen'});
  if(canEditThisChar){
    items.push({icon:'👁️',label:'Im Ansichtsmodus öffnen',sub:'Schreibgeschützte Vorschau',action:'cloud-view-char',dataset:{id:cid}});
  }
  items.push({icon:'🔗',label:'Direktlink kopieren',sub:`?char=${cid}`,action:'copy-char-link',dataset:{id:cid}});
  if(CLOUD.currentUser&&!owner){
    items.push({sep:true});
    items.push({icon:'🙋‍♂️',label:'Charakter beanspruchen',sub:`Account „${CLOUD.currentUser}“ zuordnen`,action:'claim-char',dataset:{id:cid}});
  }else if(isMyClaim&&!CLOUD.isAdmin){
    items.push({sep:true});
    items.push({icon:'🔓',label:'Besitz freigeben',sub:'Zuordnung zu deinem Account aufheben',action:'unclaim-char',dataset:{id:cid}});
  }
  if(canManageThisChar){
    items.push({sep:true});
    items.push({type:'label',label:'Verwaltung'});
    items.push({icon:'📋',label:'Kopie erstellen',sub:'Eigenständige Kopie unter Allgemein anlegen',action:'dup-char-sheet',dataset:{id:cid}});
    items.push({
      icon:'🗺️',
      label:'Kampagne wechseln',
      badge:curCampName,
      keepOpen:true,
      onClick:()=>{openLobbyCharCampPicker(anchorEl,cid);}
    });
    if(CLOUD.isAdmin){
      items.push({
        icon:'👑',
        label:'Besitzer wechseln',
        badge:owner||'Frei',
        keepOpen:true,
        onClick:()=>{openLobbyCharOwnerPicker(anchorEl,cid);}
      });
    }
    if(isCampGM||(CLOUD.isAdmin&&charCampId!=='default')){
      items.push({icon:'🚪',label:'Aus Kampagne werfen',sub:'Zurück in „Ohne Kampagne / Allgemein“',danger:true,action:'kick-char-camp',dataset:{id:cid}});
    }
    items.push({sep:true});
    if(isDelAsk){
      items.push({
        icon:'⚠️',
        label:'Wirklich löschen? (2/2)',
        sub:`„${dispName}“ dauerhaft aus der Lobby entfernen`,
        danger:true,
        action:'cloud-del-yes',
        dataset:{id:cid}
      });
      items.push({
        icon:'↩️',
        label:'Löschen abbrechen',
        keepOpen:true,
        onClick:()=>{CLOUD.confirmDelCloudId=null;openLobbyCharMenu(anchorEl,cid,true);}
      });
    }else{
      items.push({
        icon:'🗑️',
        label:'Aus Lobby löschen',
        danger:true,
        keepOpen:true,
        onClick:()=>{CLOUD.confirmDelCloudId=cid;openLobbyCharMenu(anchorEl,cid,true);}
      });
    }
  }
  openCtxMenu({
    key:`lobby-char-menu:${cid}`,
    title:dispName,
    anchorEl,
    align:'right',
    minWidth:245,
    forceOpen,
    items,
    onClose:()=>{if(CLOUD.confirmDelCloudId===cid) CLOUD.confirmDelCloudId=null;}
  });
}
function tplLobbyScreen(){
  const myId=CLOUD.viewingRemote?'':S.charId;
  const baseOrig=window.location.origin&&window.location.origin!=='null'?`${window.location.origin}${window.location.pathname}`:'';
  const lobbyUrl=baseOrig?`${baseOrig}?lobby=1`:'?lobby=1';
  const regUsers=Object.keys(CLOUD.registry.users||{}).sort((a,b)=>a.localeCompare(b,'de'));
  const allCampaigns=getCampaigns();
  const knownUsers=sortAlpha([
    ...regUsers,
    ...Object.values(CLOUD.registry.claims||{}),
    ...allCampaigns.flatMap(c=>c.allowedUsers||[]),
    ...(CLOUD.currentUser?[CLOUD.currentUser]:[])
  ]);
  const visibleCampaigns=getAccessibleCampaigns(CLOUD.currentUser);
  if(!visibleCampaigns.some(c=>c.id===CLOUD.activeCampaignId)&&visibleCampaigns.length){
    setActiveCampaign(visibleCampaigns[0].id);
  }
  const activeCamp=visibleCampaigns.find(c=>c.id===CLOUD.activeCampaignId)||visibleCampaigns[0]||allCampaigns[0]||{id:'default',name:'Ohne Kampagne / Allgemein',allowedUsers:[]};
  const activeCampId=activeCamp?activeCamp.id:'default';
  const campAllowedUsers=Array.isArray(activeCamp?.allowedUsers)?activeCamp.allowedUsers:[];
  const availCampUsers=knownUsers.filter(u=>!campAllowedUsers.some(au=>au.toLowerCase()===u.toLowerCase()));
  const campGmUsers=Array.isArray(activeCamp?.gmUsers)?activeCamp.gmUsers:[];
  const availCampGMs=knownUsers.filter(u=>!campGmUsers.some(g=>g.toLowerCase()===u.toLowerCase()));
  const campCharList=CLOUD.list.filter(ch=>getCharCampaignId(ch.id)===activeCampId);
  const myTotalCnt=CLOUD.currentUser?CLOUD.list.filter(ch=>getCharOwner(ch.id).toLowerCase()===CLOUD.currentUser.toLowerCase()).length:0;
  const myCampCnt=CLOUD.currentUser?campCharList.filter(ch=>getCharOwner(ch.id).toLowerCase()===CLOUD.currentUser.toLowerCase()).length:0;
  const visibleList=CLOUD.filterMine&&CLOUD.currentUser?campCharList.filter(ch=>getCharOwner(ch.id).toLowerCase()===CLOUD.currentUser.toLowerCase()||(UI.sheetLoaded&&ch.id===myId)):campCharList;
  const creatableCamps=getCreatableCampaigns(CLOUD.currentUser);
  const hasSpecificCamp=creatableCamps.some(c=>c.id!=='default');
  const selNewCampId=creatableCamps.some(c=>c.id===CLOUD.newCharCampId)?CLOUD.newCharCampId:(creatableCamps.some(c=>c.id===activeCampId)?activeCampId:'default');
  const canReadPublicNotes=activeCampId!=='default'&&(CLOUD.isAdmin||(CLOUD.currentUser&&(isUserInCampaign(activeCamp,CLOUD.currentUser)||isCampaignMainGM(activeCamp,CLOUD.currentUser))));
  const pubNoteCharList=[...campCharList];
  if(canReadPublicNotes&&S.charId&&getCharCampaignId(S.charId)===activeCampId&&!pubNoteCharList.some(c=>c.id===S.charId)&&(S.profile.name||S.campaignNotes?.find(n=>n.id==='cn_public')?.content)){
    pubNoteCharList.push({id:S.charId,name:S.profile.name||'Unbenannter Held',avatar:S.profile.avatar||'',owner:S.owner||CLOUD.currentUser||'',campaignId:activeCampId,updatedAt:CLOUD.registry.publicNotes?.[S.charId]?.updatedAt||''});
  }
  const pubNotesDocEntries=canReadPublicNotes?pubNoteCharList.map(ch=>{
    const regEntry=CLOUD.registry.publicNotes?.[ch.id];
    const content=String(CLOUD.registry.publicNotes?.[ch.id]?.content??ch.publicNote??ch._summary?.publicNote??(ch.id===S.charId?S.campaignNotes.find(n=>n.id==='cn_public')?.content:'')??'');
    const owner=getCharOwner(ch.id)||regEntry?.owner||ch.owner||'';
    const charName=ch.name||regEntry?.charName||(ch.id===S.charId?S.profile.name:'')||'Unbenannter Held';
    const avatar=ch.avatar||regEntry?.avatar||(ch.id===S.charId?S.profile.avatar:'')||'';
    const updatedAt=regEntry?.updatedAt||ch.updatedAt||ch._summary?.updatedAt||'';
    const isMyChar=Boolean((owner&&CLOUD.currentUser&&owner.toLowerCase()===CLOUD.currentUser.toLowerCase())||(!CLOUD.viewingRemote&&ch.id===S.charId&&canManageChar(ch.id)));
    const canEditNote=Boolean(CLOUD.isAdmin||isMyChar||canManageCampaign(activeCampId));
    const pages=(ch.id===S.charId&&S.campaignNotes?.length)
      ?extractPublicPages(S.campaignNotes,content,updatedAt)
      :(Array.isArray(regEntry?.pages)&&regEntry.pages.length?regEntry.pages:[{id:'cn_public',title:'🌐 Öffentlich',content,updatedAt}]);
    return {id:ch.id,charName,avatar,owner,updatedAt,content,pages,hasContent:Boolean(stripHtml(content).trim())||pages.some(pg=>Boolean(stripHtml(pg?.content||'').trim())),isMyChar,canEditNote};
  }).sort((a,b)=>a.charName.localeCompare(b.charName,'de')):[];
  const campPages=canReadPublicNotes?getCampaignSharedPages(activeCampId):[];
  const allPublicPages=[];
  if(canReadPublicNotes){
    campPages.forEach(pg=>{
      allPublicPages.push({
        pageKey: 'camp::' + pg.id,
        isCampPage: true,
        isDetached: Boolean(pg.isDetached),
        charId: '_camp_',
        pageId: pg.id,
        pageTitle: pg.title || '📖 Gemeinsame Notizen',
        charName: pg.isDetached ? ('Archiv: ' + (pg.originCharName || 'Charakter')) : 'Kampagne (Alle)',
        avatar: '',
        owner: pg.isDetached ? (pg.originOwner || '') : (pg.lastEditor || ''),
        originCharName: pg.originCharName || '',
        originOwner: pg.originOwner || '',
        lastEditor: pg.lastEditor || '',
        updatedAt: pg.updatedAt || '',
        content: String(pg.content || ''),
        hasContent: Boolean(stripHtml(pg.content || '').trim()),
        isMyChar: false,
        canEditNote: true,
        canDeletePage: Boolean(pg.id !== 'camp_main')
      });
    });
    pubNotesDocEntries.forEach(entry=>{
      (entry.pages||[]).forEach(pg=>{
        allPublicPages.push({
          pageKey:`${entry.id}::${pg.id}`,
          isCampPage:false,
          isDetached:false,
          charId:entry.id,
          pageId:pg.id,
          pageTitle:pg.title||'🌐 Öffentlich',
          charName:entry.charName,
          avatar:entry.avatar,
          owner:entry.owner,
          updatedAt:pg.updatedAt||entry.updatedAt||'',
          content:String(pg.content||''),
          hasContent:Boolean(stripHtml(pg.content||'').trim()),
          isMyChar:entry.isMyChar,
          canEditNote:entry.canEditNote,
          canDeletePage:false
        });
      });
    });
  }
  const activePubPage=allPublicPages.find(p=>p.pageKey===CLOUD.activePublicPageKey)||allPublicPages.find(p=>p.hasContent)||allPublicPages[0]||null;
  if(activePubPage) CLOUD.activePublicPageKey=activePubPage.pageKey;
  const activeBookCharEntry=(!activePubPage?.isCampPage&&activePubPage?.charId)?pubNotesDocEntries.find(e=>e.id===activePubPage.charId):null;
  const myCampNoteChar=pubNotesDocEntries.find(e=>e.isMyChar)||(CLOUD.currentUser?campCharList.find(ch=>getCharOwner(ch.id).toLowerCase()===CLOUD.currentUser.toLowerCase()):null);

  return `<div class="space-y-6">
    <!-- Sektion 1: Account- & Willkommens-Zentrale -->
    <section class="card p-3.5 sm:p-6 space-y-4">
      ${!CLOUD.currentUser?`
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        <div class="lg:col-span-5 space-y-2.5">
          <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-acc-soft border bdr-acc text-acc text-xs font-extrabold">
            <span>🔐</span><span>Spieler-Zugang &amp; Charakter-Claims</span>
          </div>
          <h2 class="text-lg sm:text-xl font-black leading-snug">Willkommen in der Scherbensturm-Lobby!</h2>
          <p class="text-xs sm:text-sm t-mut leading-relaxed">Willkommen in der Scherbensturm-Lobby! Melde dich mit deinem Spieler-Account an oder registriere dich, um eigene Charakterbögen zu erstellen und deine freigeschalteten Kampagnen zu sehen.</p>
          <div class="flex flex-wrap items-center gap-2 pt-1">
            <button type="button" data-action="open-local-sheet" data-tip="Öffnet den lokal gespeicherten Charakterbogen (oder einen Test-Bogen) direkt ohne Cloud-Zwang – ideal zum lokalen Testen vor dem GitHub-Upload" class="btn btn-ok py-1.5 px-3 text-xs font-extrabold">🛠️ Lokalen Bogen öffnen / testen</button>
            <button type="button" data-action="copy-share-link" data-url="${esc(lobbyUrl)}" data-tip="Direktlink zur zentralen Lobby kopieren" class="btn bg-acc-soft bdr-acc text-acc py-1.5 px-3 text-xs">🔗 Lobby-Direktlink</button>
            <button type="button" data-action="open-admin-panel" data-tip="Admin-Fenster (PIN &amp; Verwaltung) öffnen" class="btn py-1.5 px-3 text-xs ${CLOUD.isAdmin?'!border-amber-400 !bg-amber-500/20 text-amber-300':'opacity-85'}">👑 ${CLOUD.isAdmin?'Admin aktiv':'Spielleiter / Admin'}</button>
          </div>
        </div>
        <div class="lg:col-span-7 subcard p-4 sm:p-5 space-y-3 border-indigo-500/40 bg-indigo-500/10">
          <div class="text-xs font-extrabold text-indigo-300 uppercase tracking-wider">🔑 Spieler-Login &amp; Neuregistrierung</div>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div>
              <label class="block text-[10px] font-bold t-mut mb-1">SPIELERNAME (ACCOUNT)</label>
              <input id="inpLobbyUser" type="text" placeholder="Dein Spielername..." class="inp w-full py-2 px-3 text-xs sm:text-sm font-bold"/>
            </div>
            <div>
              <label class="block text-[10px] font-bold t-mut mb-1">PASSWORT</label>
              <input id="inpLobbyPass" type="password" placeholder="Passwort..." class="inp w-full py-2 px-3 text-xs sm:text-sm font-bold"/>
            </div>
            <div>
              <label class="block text-[10px] font-bold t-mut mb-1">PASSWORT WIEDERHOLEN</label>
              <input id="inpLobbyPass2" type="password" placeholder="Nur bei Registrierung..." class="inp w-full py-2 px-3 text-xs sm:text-sm font-bold"/>
            </div>
          </div>
          <div class="flex flex-wrap items-center justify-end gap-2 pt-1">
            <button type="button" data-action="user-login" class="btn btn-pri py-2 px-4 text-xs sm:text-sm font-black">🔑 Anmelden</button>
            <button type="button" data-action="user-register" data-tip="Neuen Spieler-Account (Name + Passwort) im Backend registrieren" class="btn btn-ok py-2 px-4 text-xs sm:text-sm font-black">✨ Neuen Account registrieren</button>
          </div>
        </div>
      </div>
      `:`
      <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div class="flex flex-wrap items-center gap-3">
          ${(()=>{const uAv=getUserAvatar(CLOUD.currentUser);return `<button type="button" data-action="open-user-avatar" data-user="${esc(CLOUD.currentUser)}" data-return="" data-tip="Profilbild ändern, vergrößern oder entfernen" class="w-12 h-12 rounded-2xl border-2 border-emerald-500/60 bg-emerald-500/15 text-emerald-300 flex items-center justify-center text-xl font-black shadow-md shrink-0 overflow-hidden cursor-pointer hover:brightness-110 transition-all">${uAv?`<img src="${uAv}" class="w-full h-full object-cover" alt=""/>`:`👤`}</button>`;})()}
          <div>
            <div class="flex flex-wrap items-center gap-2">
              ${renderUserNamePill(CLOUD.currentUser,{cls:'px-2.5 py-0.5 rounded-lg text-xs sm:text-sm font-black bg-emerald-500/20 text-emerald-300 border border-emerald-400/50',tip:'Eigenes Profil öffnen (Name, Passwort, User-ID, Profilbild)'})}
              ${isGlobalGM(CLOUD.currentUser)?`<span class="px-2 py-0.5 rounded text-[10px] font-black bg-purple-500/25 text-purple-300 border border-purple-400/50">🎲 SPIELLEITER</span>`:''}
              <span class="pill cursor-default text-xs py-0.5 px-2.5 tabular">${myTotalCnt} eigene ${myTotalCnt===1?'Charakter':'Charaktere'} gesamt</span>
              ${CLOUD.isAdmin?`<span class="px-2 py-0.5 rounded text-[10px] font-black bg-amber-500/25 text-amber-300 border border-amber-400/50">👑 ADMIN AKTIV</span>`:''}
            </div>
            <div class="flex flex-wrap items-center gap-1.5 mt-2">
              <button type="button" data-action="toggle-lobby-filter" class="btn py-1 px-2.5 text-xs ${CLOUD.filterMine?'btn-pri':''}">${CLOUD.filterMine?`Nur meine Charaktere (${myCampCnt})`:`Alle Charaktere (${campCharList.length})`}</button>
              <button type="button" data-action="open-user-profile" data-user="${esc(CLOUD.currentUser)}" data-tip="Eigenes Profil öffnen (Name, Passwort, User-ID, Profilbild)" class="btn py-1 px-2.5 text-xs bdr-acc bg-acc-soft text-acc">👤 Profil</button>
              <button type="button" data-action="open-admin-panel" data-tip="Admin-Fenster öffnen" class="btn py-1 px-2.5 text-xs ${CLOUD.isAdmin?'!border-amber-400 !bg-amber-500/20 text-amber-300':'opacity-85'}">👑 Admin</button>
              <button type="button" data-action="copy-share-link" data-url="${esc(lobbyUrl)}" class="btn py-1 px-2.5 text-xs">🔗 Lobby-Link</button>
              <button type="button" data-action="user-logout" class="btn btn-err py-1 px-2.5 text-xs">Abmelden</button>
            </div>
          </div>
        </div>
        <div class="flex flex-wrap items-center gap-2.5 shrink-0">
          <button type="button" data-action="lobby-new-sheet" class="btn btn-ok py-2.5 px-5 text-sm font-black shadow-lg">✨ + Neuen Charakterbogen erstellen</button>
          <button type="button" data-action="open-local-sheet" data-tip="Öffnet den lokal gespeicherten Charakterbogen (oder einen Test-Bogen) direkt ohne Cloud-Zwang – ideal zum lokalen Testen vor dem GitHub-Upload" class="btn py-2.5 px-4 text-xs sm:text-sm font-extrabold border-emerald-500/60 bg-emerald-500/15 text-emerald-300">🛠️ Lokalen Bogen öffnen / testen</button>
        </div>
      </div>
      `}

    </section>

    <!-- Aufklappbarer Charakter-Erstellungs-Assistent -->
    ${CLOUD.currentUser&&CLOUD.newCharOpen?`
    <section class="card border-2 border-emerald-500/60 bg-emerald-500/10 p-3.5 sm:p-6 space-y-4">
      <div class="flex flex-wrap items-center justify-between gap-2">
        <h3 class="text-base sm:text-lg font-black text-emerald-300">✨ Neuen Charakterbogen für „${esc(CLOUD.currentUser)}“ anlegen</h3>
        <button type="button" data-action="create-user-char-cancel" class="btn py-1 px-2.5 text-xs">✕</button>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
        <div class="md:col-span-4">
          <label class="block text-xs font-extrabold text-emerald-300 mb-1">Charakter-Name</label>
          <input id="inpNewCharName" type="text" value="${esc(CLOUD.newCharName||'')}" placeholder="z.B. Kaelen Sturmwind" class="inp w-full py-2 px-3 text-sm font-bold"/>
        </div>
        <div class="md:col-span-2">
          <label class="block text-xs font-bold t-mut mb-1">Volk / Abstammung <span class="opacity-65">(opt.)</span></label>
          <input id="inpNewCharAncestry" type="text" value="${esc(CLOUD.newCharAncestry||'')}" placeholder="z.B. Mensch" class="inp w-full py-2 px-3 text-sm font-semibold"/>
        </div>
        <div class="md:col-span-2">
          <label class="block text-xs font-bold t-mut mb-1">Konzept / Rolle <span class="opacity-65">(opt.)</span></label>
          <input id="inpNewCharConcept" type="text" value="${esc(CLOUD.newCharConcept||'')}" placeholder="z.B. Schwertmagier" class="inp w-full py-2 px-3 text-sm font-semibold"/>
        </div>
        <div class="md:col-span-4">
          <label class="block text-xs font-extrabold text-emerald-300 mb-1">Kampagnen-Zuordnung</label>
          <select id="selNewCharCamp" class="inp w-full py-2 px-3 text-sm font-bold">
            ${creatableCamps.map(c=>`<option value="${esc(c.id)}" ${selNewCampId===c.id?'selected':''}>${c.id==='default'?'🌐 Ohne Kampagne / Allgemein (Für alle einsehbar)':`📁 Kampagne: ${esc(c.name)}`}</option>`).join('')}
          </select>
        </div>
      </div>
      <div class="p-3 rounded-xl bg-black/25 border border-emerald-500/30 text-xs text-emerald-200/95">
        ${hasSpecificCamp
          ?`💡 Du kannst frei wählen, ob dein Charakter direkt in einer deiner Kampagnen oder im allgemeinen Bereich (ohne Kampagne, für alle einsehbar) landet.`
          :`ℹ️ Du bist aktuell noch keiner spezifischen Kampagne zugeordnet – dein Charakter wird im allgemeinen Bereich („Ohne Kampagne“, für alle einsehbar) erstellt und fest deinem Account „${esc(CLOUD.currentUser)}“ zugeordnet.`}
      </div>
      <div class="flex flex-wrap items-center justify-end gap-2.5 pt-1">
        <button type="button" data-action="create-user-char-cancel" class="btn py-2 px-4 text-xs">Abbrechen</button>
        <button type="button" data-action="create-user-char-confirm" class="btn btn-ok py-2 px-5 text-sm font-black">🚀 Charakter erstellen &amp; Bogen öffnen</button>
      </div>
    </section>
    `:''}

    <!-- Sektion 2: Großzügige Kampagnen-Reiter & Charakter-Galerie -->
    <section class="card p-3 sm:p-6 space-y-4 sm:space-y-5 min-w-0 max-w-full">
      <div class="flex flex-wrap items-start xl:items-center justify-between gap-3 w-full min-w-0 ${CLOUD.galleryCollapsed?'':'border-b bdr-line pb-2.5'}">
        <div class="flex items-start sm:items-center gap-2.5 sm:gap-3 flex-[1_1_280px] sm:flex-[1_1_460px] w-full min-w-0 max-w-full">
          <button type="button" data-action="toggle-lobby-gallery-collapse" aria-label="${CLOUD.galleryCollapsed?'Kampagnen &amp; Charakter-Galerie ausklappen':'Kampagnen &amp; Charakter-Galerie einklappen'}" data-tip="${CLOUD.galleryCollapsed?'Kampagnen &amp; Charakter-Galerie ausklappen':'Kampagnen &amp; Charakter-Galerie einklappen'}" class="btn w-7 h-7 p-0 text-xs font-black shrink-0">${CLOUD.galleryCollapsed?'▸':'▾'}</button>
          ${!CLOUD.galleryCollapsed?((CLOUD.isAdmin||canManageCampaign(activeCampId))
            ?`<button type="button" data-action="pick-camp-img" aria-label="${activeCamp?.img?'Kampagnenbild verwalten':'Kampagnenbild hochladen'}" data-tip="${activeCamp?.img?'Kampagnenbild verwalten (ändern, Großansicht oder entfernen)':'Kampagnenbild hochladen'}" class="w-14 h-14 sm:w-20 sm:h-20 rounded-2xl overflow-hidden border-2 bdr-acc bg-acc-soft flex items-center justify-center shadow-lg shrink-0 cursor-pointer hover:opacity-90 transition-opacity">${activeCamp?.img?`<img src="${activeCamp.img}" class="w-full h-full object-cover"/>`:`<span class="text-[9px] sm:text-[10px] font-black text-acc text-center px-1.5 leading-tight">KAMPAGNEN-<br/>BILD +</span>`}</button>`
            :(activeCamp?.img?`<button type="button" data-action="pick-camp-img" aria-label="Kampagnenbild in Großansicht öffnen" data-tip="Kampagnenbild in Großansicht öffnen" class="w-14 h-14 sm:w-20 sm:h-20 rounded-2xl overflow-hidden border-2 bdr-acc bg-acc-soft flex items-center justify-center shadow-lg shrink-0 cursor-pointer hover:opacity-90 transition-opacity"><img src="${activeCamp.img}" class="w-full h-full object-cover"/></button>`:'')):''}
          <div class="w-full min-w-0 flex-1 space-y-1">
            <div class="flex flex-wrap items-center gap-1.5 sm:gap-2 w-full min-w-0">
              <h2 class="text-sm sm:text-lg font-black break-words min-w-0">🗺️ Kampagnen &amp; Galerie</h2>
              <span class="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-acc-soft text-acc border bdr-acc inline-flex items-center gap-1 max-w-full min-w-0"><span class="shrink-0">${activeCampId==='default'?'🌐':'📁'}</span><span class="truncate">${esc(activeCamp?.name||'Ohne Kampagne / Allgemein')}</span></span>
              <span class="pill cursor-default text-[10px] py-0.5 px-2 tabular shrink-0">${visibleList.length} ${visibleList.length===1?'Charakter':'Charaktere'}</span>
            </div>
            ${!CLOUD.galleryCollapsed?`<p class="w-full min-w-0 text-xs t-mut break-words leading-relaxed">Wähle oben eine Kampagne oder den öffentlichen Bereich („Ohne Kampagne / Allgemein“), um die zugehörigen Helden zu sehen.</p>`:''}
          </div>
        </div>
        <div class="flex flex-wrap items-center gap-1.5 sm:gap-2 min-w-0 max-w-full">
          ${CLOUD.isAdmin?`
            <button type="button" data-action="camp-new-open" aria-label="Neue Kampagne erstellen" data-tip="Neue Kampagne erstellen" class="btn btn-ok py-1.5 px-2.5 sm:px-3 text-xs font-extrabold shrink-0">+ <span class="hidden sm:inline">Neue </span>Kampagne</button>
            ${activeCamp?`<button type="button" data-action="camp-rename-open" aria-label="Kampagne umbenennen" data-tip="Aktive Kampagne umbenennen" class="btn py-1.5 px-2.5 sm:px-3 text-xs border-amber-400/50 text-amber-300 shrink-0">✏️<span class="hidden sm:inline"> Umbenennen</span></button><button type="button" data-action="open-camp-color" data-id="${esc(activeCamp.id)}" data-cmode="text" aria-label="Textfarbe des Kampagnen-Titels anpassen" data-tip="👑 Admin: Textfarbe des Kampagnen-Titels anpassen" class="btn py-1.5 px-2 sm:px-2.5 text-xs shrink-0" ${activeCamp.color?`style="border-color:${esc(activeCamp.color)};color:${esc(activeCamp.color)}"`:''}>🎨<span class="hidden sm:inline"> Titel</span></button><button type="button" data-action="open-camp-color" data-id="${esc(activeCamp.id)}" data-cmode="bg" aria-label="Fensterfarbe des Kampagnen-Tabs anpassen" data-tip="👑 Admin: Fensterfarbe des Kampagnen-Tabs anpassen" class="btn py-1.5 px-2 sm:px-2.5 text-xs shrink-0" ${activeCamp.bgColor?`style="border-color:${esc(activeCamp.bgColor)};background:color-mix(in srgb,${esc(activeCamp.bgColor)} 38%,var(--surf2))"` :''}>🪟<span class="hidden sm:inline"> Tab-Farbe</span></button>`:''}
          `:''}
          <button type="button" data-action="cloud-refresh-list" ${CLOUD.loading?'disabled':''} aria-label="Lobby-Liste aktualisieren" data-tip="Charakter- und Kampagnenliste vom Server aktualisieren" class="btn py-1.5 px-2.5 sm:px-3 text-xs shrink-0">${CLOUD.loading?'⏳':'🔄'}<span class="hidden sm:inline"> ${CLOUD.loading?'Lade...':'Aktualisieren'}</span></button>
          ${CLOUD.isAdmin&&activeCamp&&activeCamp.id!=='default'?`<div class="sm:pl-2.5 sm:ml-1 sm:border-l bdr-line flex flex-wrap items-center max-w-full shrink-0">${CLOUD.campAction==='delete'?`<span class="inline-flex flex-wrap items-center gap-1 max-w-full"><button type="button" data-action="camp-delete-confirm" class="btn bg-rose-600 text-white border-rose-600 py-1 px-2.5 text-[11px] font-black whitespace-normal text-left">Löschen? (${campCharList.length} → Allgemein)</button><button type="button" data-action="camp-action-cancel" aria-label="Löschen abbrechen" class="btn py-1 px-2 text-[11px] shrink-0">✕</button></span>`:`<button type="button" data-action="camp-delete-ask" aria-label="Kampagne löschen" data-tip="Kampagne löschen (enthaltene Charaktere werden automatisch in den allgemeinen Bereich verschoben)" class="btn btn-err py-1.5 px-2.5 sm:px-3 text-xs shrink-0">🗑️<span class="hidden sm:inline"> Kampagne löschen</span></button>`}</div>`:''}
        </div>
      </div>

      ${!CLOUD.galleryCollapsed?`
      ${CLOUD.isAdmin&&(CLOUD.campAction==='new'||CLOUD.campAction==='rename')?`<div class="subcard p-3 sm:p-3.5 flex flex-wrap items-center gap-2 border-amber-400/50 bg-amber-500/10 min-w-0">
        <span class="text-xs font-extrabold text-amber-300 break-words">${CLOUD.campAction==='new'?'➕ Neue Kampagne erstellen:':`✏️ „${esc(activeCamp?.name||'')}“ umbenennen:`}</span>
        <input id="inpCampaignName" type="text" value="${CLOUD.campAction==='rename'?esc(activeCamp?.name||''):''}" placeholder="Kampagnenname eingeben..." class="inp flex-1 min-w-0 w-full sm:w-auto sm:min-w-[200px] text-xs sm:text-sm font-bold"/>
        <button type="button" data-action="${CLOUD.campAction==='new'?'camp-new-save':'camp-rename-save'}" class="btn btn-ok py-1.5 px-3.5 text-xs font-black">💾 Speichern</button>
        <button type="button" data-action="camp-action-cancel" class="btn py-1.5 px-3 text-xs">Abbrechen</button>
      </div>`:''}

      <!-- Große Kampagnen-Tabs -->
      <div data-lobby-camp-tabs="1" class="flex items-center gap-2 sm:gap-2.5 overflow-x-auto pb-1 max-w-full">
        ${visibleCampaigns.map(c=>{
          const isAct=c.id===activeCampId;
          const cCnt=CLOUD.list.filter(ch=>getCharCampaignId(ch.id)===c.id).length;
          const icon=c.id==='default'?'🌐':'📁';
          const label=c.id==='default'?esc(c.name||'Ohne Kampagne / Allgemein'):esc(c.name||'Kampagne');
          const tabBgStyle=isHex(c.bgColor)?`background:${isAct?`linear-gradient(135deg,color-mix(in srgb,${c.bgColor} 78%,var(--surf2)),color-mix(in srgb,${c.bgColor} 58%,var(--surf)))`:`color-mix(in srgb,${c.bgColor} 34%,var(--surf2))`};border-color:color-mix(in srgb,${c.bgColor} ${isAct?'95%':'65%'},var(--bdr));${isAct?`box-shadow:0 0 0 2px color-mix(in srgb,${c.bgColor} 65%,transparent),0 6px 16px rgba(0,0,0,.28);`:''}`:'';
          const tabTxtStyle=isHex(c.color)?`style="color:${esc(c.color)}"`:'';
          return `<button type="button" data-action="select-campaign-tab" data-id="${esc(c.id)}" data-camp-tab="${esc(c.id)}" ${CLOUD.isAdmin?`draggable="true" data-drag-camp="${esc(c.id)}"`:''} ${tabBgStyle?`style="${tabBgStyle}"`:''} data-tip="${label} (${cCnt})" class="btn shrink-0 py-2 px-3 sm:py-2.5 sm:px-4 text-xs sm:text-sm font-black rounded-xl transition-all max-w-[82vw] sm:max-w-none ${isAct?(isHex(c.bgColor)?'shadow-lg scale-[1.01]':'btn-pri shadow-lg scale-[1.01]'):'opacity-85 hover:opacity-100'}">
            ${CLOUD.isAdmin?`<span data-tip="👑 Admin: Kampagne per Drag &amp; Drop nach links/rechts verschieben" class="hidden sm:inline px-1 py-0.5 rounded bg-black/25 text-[10px] font-black cursor-grab select-none shrink-0">⠿</span>`:''}
            ${c.img?`<img src="${c.img}" class="w-5 h-5 sm:w-6 sm:h-6 rounded-md object-cover border bdr-acc shrink-0"/>`:''}
            <span class="truncate min-w-0 max-w-[190px] sm:max-w-none" ${tabTxtStyle}>${icon} ${label}</span>
            <span class="px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] bg-black/30 tabular font-extrabold shrink-0">${cCnt}</span>
          </button>`;
        }).join('')}
      </div>

      <!-- Admin-Hinweis bzw. Spieler-Freischaltung der aktiven Kampagne -->
      ${(CLOUD.isAdmin||canManageCampaign(activeCamp)||activeCamp.id!=='default')&&activeCamp?(activeCamp.id==='default'?`
        <div class="subcard py-2.5 px-3 sm:px-3.5 text-xs text-sky-200 border-sky-400/40 bg-sky-500/10 flex flex-wrap items-center justify-between gap-2 min-w-0">
          <span class="break-words min-w-0">🌐 Öffentlicher Standardbereich: Für alle Spieler einsehbar.</span>
          <span class="text-[11px] t-mut tabular shrink-0">${campCharList.length} ${campCharList.length===1?'Charakter':'Charaktere'}</span>
        </div>
      `:`
        <div class="subcard p-3 sm:p-3.5 space-y-3 text-xs border-amber-400/40 bg-amber-500/10 min-w-0 max-w-full">
          <div class="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-white/10 min-w-0">
            <div class="flex flex-wrap items-center gap-2 min-w-0 w-full">
              <span class="font-extrabold text-purple-300 shrink-0">🎲 Spielleitung:</span>
              ${campGmUsers.length?campGmUsers.map(u=>`<span class="px-2 py-0.5 rounded-lg inline-flex items-center gap-1 text-xs font-bold bg-purple-500/25 text-purple-200 border border-purple-400/50 max-w-full min-w-0"><span class="truncate">🎲 ${esc(u)}</span>${CLOUD.isAdmin?`<button type="button" data-action="camp-rm-gm" data-user="${esc(u)}" aria-label="Spielleiter ${esc(u)} entfernen" class="text-rose-400 font-black ml-1 shrink-0">✕</button>`:''}</span>`).join(''):`<span class="text-[11px] t-mut italic">Kein Haupt-Spielleiter</span>`}
              ${CLOUD.isAdmin?`<div class="flex flex-wrap items-center gap-1.5 max-w-full min-w-0 w-full sm:w-auto">
                <select id="selCampAddGM" class="inp !py-1 !px-2 text-xs font-bold flex-1 sm:flex-initial min-w-0 max-w-full">
                  <option value="">+ Spielleiter wählen...</option>
                  ${availCampGMs.map(u=>`<option value="${esc(u)}">🎲 ${esc(u)}</option>`).join('')}
                </select>
                <button type="button" data-action="camp-add-gm-btn" aria-label="Spielleiter zuweisen" data-tip="Ausgewählten Spielleiter dieser Kampagne zuweisen" class="btn py-1 px-2.5 text-xs border-purple-400/50 text-purple-300 shrink-0">+ <span class="hidden sm:inline">Spielleiter </span>zuweisen</button>
              </div>`:''}
            </div>
          </div>
          ${canManageCampaign(activeCamp)?`
          <div class="flex flex-wrap items-center justify-between gap-2 min-w-0">
            <div class="flex flex-wrap items-center gap-1.5 min-w-0">
              <span class="font-extrabold text-amber-300 break-words min-w-0">👑 Freigeschaltete Spieler für „${esc(activeCamp.name)}“:</span>
              <span class="pill cursor-default text-[10px] py-0.5 px-2 tabular shrink-0">${campAllowedUsers.length} Spieler</span>
            </div>
            <div class="flex flex-wrap items-center gap-1.5 max-w-full min-w-0 w-full sm:w-auto">
              ${availCampUsers.length?`<select data-camp-add-user-sel="${esc(activeCamp.id)}" class="inp !py-1 !px-2 text-xs font-bold w-full sm:w-auto min-w-0 max-w-full">
                <option value="">+ Bekannten Spieler wählen...</option>
                ${availCampUsers.map(u=>`<option value="${esc(u)}">👤 ${esc(u)}</option>`).join('')}
              </select>`:''}
              <div class="flex items-center gap-1 w-full sm:w-auto max-w-full min-w-0">
                <input id="inpCampAddUser" type="text" placeholder="Spielername..." class="inp !py-1 !px-2 text-xs font-bold flex-1 min-w-0 sm:w-44 max-w-full"/>
                <button type="button" data-action="camp-add-user-btn" class="btn btn-ok py-1 px-2.5 text-xs shrink-0">+ Zuordnen</button>
              </div>
            </div>
          </div>
          <div class="flex flex-wrap items-center gap-1.5 min-w-0">
            ${campAllowedUsers.length?campAllowedUsers.map(u=>`<span class="subcard py-0.5 px-2.5 inline-flex items-center gap-1.5 text-xs border-amber-400/40 bg-black/25 max-w-full min-w-0">${renderUserNamePill(u,{cls:'font-bold text-amber-200'})}<button type="button" data-action="camp-rm-user" data-user="${esc(u)}" aria-label="Spieler ${esc(u)} aus Kampagne entfernen" data-tip="Spieler „${esc(u)}“ aus „${esc(activeCamp.name)}“ entfernen" class="text-rose-400 hover:text-rose-300 font-black ml-0.5 shrink-0">✕</button></span>`).join(''):`<span class="text-[11px] t-mut italic">Noch keine Spieler zugeordnet – aktuell nur für Spielleitung &amp; Admin sichtbar.</span>`}
          </div>
          `:''}
        </div>
      `):''}

      ${CLOUD.error?`<div class="subcard border-amber-500/45 bg-amber-500/10 space-y-2 text-xs">
        <div class="font-extrabold text-amber-400">ℹ️ Hinweis zur Server-Verbindung</div>
        <p class="t-mut">${esc(CLOUD.error)}</p>
        <div class="pt-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <span class="text-[11px] font-bold t-mut shrink-0">Netlify-URL (falls lokal geöffnet):</span>
          <input id="inpCloudServerUrl" type="text" value="${esc(CLOUD.serverUrl)}" placeholder="https://dein-projektname.netlify.app (leer lassen, wenn direkt auf Netlify geöffnet)" class="inp flex-1 text-xs"/>
          <button type="button" data-action="save-cloud-url" class="btn btn-pri py-1 px-3 text-xs shrink-0">Verbinden</button>
        </div>
      </div>`:''}

      <!-- 3-Spalten-Charakter-Galerie ohne Höhenbegrenzung -->
      ${CLOUD.loading?`<div class="subcard py-12 text-center text-sm t-mut">⏳ Lade Charakterbögen aus der Lobby...</div>`
      :visibleList.length?`<div data-lobby-char-grid="1" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        ${visibleList.map(ch=>{
          const isOpenSheet=Boolean(UI.sheetLoaded&&ch.id===myId);
          const isViewing=Boolean(CLOUD.viewingRemote&&CLOUD.remoteCharId===ch.id);
          const owner=getCharOwner(ch.id);
          const isMyClaim=Boolean(owner&&CLOUD.currentUser&&owner.toLowerCase()===CLOUD.currentUser.toLowerCase());
          const charCampId=getCharCampaignId(ch.id);
          const isCampGM = charCampId !== 'default' && canManageCampaign(charCampId);
          const canManageThisChar = CLOUD.isAdmin || isMyClaim || isCampGM;
          const canEditThisChar = canManageThisChar || !owner;
          return `<div class="card p-3.5 sm:p-5 flex flex-col justify-between gap-3.5 hover:border-sky-400/60 transition-all min-w-0 max-w-full ${isViewing?'border-sky-400 bg-sky-500/10':isMyClaim||isOpenSheet?'bdr-acc bg-acc-soft/30':''}">
            <!-- Oben: Portrait, Name, Volk & Konzept, Badges -->
            <div class="flex items-start gap-3 sm:gap-3.5 min-w-0">
              <div class="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl overflow-hidden border-2 bdr-acc bg-black/30 shrink-0 flex items-center justify-center shadow-md">
                ${ch.avatar?`<img src="${ch.avatar}" class="w-full h-full object-cover"/>`:`<span class="text-xs font-black text-acc text-center leading-tight">HELD</span>`}
              </div>
              <div class="min-w-0 flex-1 space-y-1">
                <div class="flex flex-wrap items-center gap-1.5 min-w-0">
                  <span class="text-base sm:text-lg font-black break-words line-clamp-2 min-w-0">${esc(ch.name||'Unbenannt')}</span>
                </div>
                <div class="text-xs t-mut truncate">${esc(ch.ancestry||'Volk')} • ${esc(ch.concept||'Konzept')}</div>
                <div class="flex flex-wrap items-center gap-1.5 pt-0.5 min-w-0">
                  <span class="px-2 py-0.5 rounded-md text-[11px] font-black bg-acc-soft text-acc border bdr-acc tabular shrink-0">Stufe ${ch.level||1}</span>
                  ${owner?renderUserNamePill(owner,{cls:`px-2 py-0.5 rounded-md text-[11px] font-black max-w-full ${isMyClaim?'bg-emerald-500/25 text-emerald-300 border border-emerald-400/50':'bg-indigo-500/20 text-indigo-300 border border-indigo-400/40'}`}):`<span class="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-black/25 t-mut shrink-0">⚪ Frei</span>`}
                  ${isOpenSheet?`<span class="px-2 py-0.5 rounded-md text-[11px] font-black bg-emerald-500/25 text-emerald-300 border border-emerald-400/60 shrink-0">Geöffnet</span>`:''}
                  ${isViewing&&!isOpenSheet?`<span class="px-2 py-0.5 rounded-md text-[11px] font-black bg-sky-500/25 text-sky-300 border border-sky-400/60 shrink-0">👁️ Offen</span>`:''}
                </div>
                ${ch.updatedAt?`<div class="text-[10px] t-mut opacity-75 tabular">Stand: ${esc(ch.updatedAt)}</div>`:''}
              </div>
            </div>

            <!-- Mitte: 5 übersichtliche Stat-Boxen -->
            <div class="grid grid-cols-3 min-[420px]:grid-cols-5 gap-1.5 sm:gap-2 text-center text-xs tabular">
              <div class="subcard p-1.5 sm:p-2 border bdr-line bg-black/25 min-w-0">
                <span class="block text-[10px] font-extrabold text-rose-400">LP</span>
                <strong class="text-xs sm:text-sm font-black">${ch.lpCurrent??8}/${ch.lpMax??8}</strong>
              </div>
              <div class="subcard p-1.5 sm:p-2 border bdr-line bg-black/25 min-w-0">
                <span class="block text-[10px] font-extrabold text-indigo-400">mLP</span>
                <strong class="text-xs sm:text-sm font-black">${ch.mlpCurrent??8}/${ch.mlpMax??8}</strong>
              </div>
              <div class="subcard p-1.5 sm:p-2 border bdr-line bg-black/25 min-w-0">
                <span class="block text-[10px] font-extrabold text-yellow-300">AP</span>
                <strong class="text-xs sm:text-sm font-black">${ch.apCurrent??3}/${ch.apMax??3}</strong>
              </div>
              <div class="subcard p-1.5 sm:p-2 border bdr-line bg-black/25 min-w-0">
                <span class="block text-[10px] font-extrabold text-sky-400">mAP</span>
                <strong class="text-xs sm:text-sm font-black">${ch.mapCurrent??3}/${ch.mapMax??3}</strong>
              </div>
              <div class="subcard p-1.5 sm:p-2 border bdr-line bg-black/25 min-w-0">
                <span class="block text-[10px] font-extrabold text-amber-400">Ini</span>
                <strong class="text-xs sm:text-sm font-black">${(ch.ini??0)>=0?'+'+(ch.ini??0):(ch.ini??0)}</strong>
              </div>
            </div>

            <!-- Unten: Kompakte Hauptaktion + ⋮-Kartenmenü -->
            <div class="flex items-center gap-2 pt-2 border-t bdr-line min-w-0">
              ${canEditThisChar
                ?`<button type="button" data-action="cloud-edit-char" data-id="${esc(ch.id)}" aria-label="${esc(ch.name||'Charakter')} öffnen und bearbeiten" data-tip="Charakterbogen zum Bearbeiten öffnen" class="btn btn-pri min-h-[40px] py-2 px-3 text-xs font-black flex-1 min-w-0"><span class="truncate">✏️ <span class="hidden sm:inline">Bogen </span>öffnen</span></button>`
                :`<button type="button" data-action="cloud-view-char" data-id="${esc(ch.id)}" aria-label="${esc(ch.name||'Charakter')} ansehen" data-tip="Charakterbogen im schreibgeschützten Ansichtsmodus öffnen" class="btn bdr-acc bg-acc-soft text-acc min-h-[40px] py-2 px-3 text-xs font-black flex-1 min-w-0"><span class="truncate">👁️ Ansehen</span></button>`}
              <button type="button" data-action="open-lobby-char-menu" data-id="${esc(ch.id)}" aria-haspopup="menu" aria-expanded="false" aria-label="Weitere Aktionen für ${esc(ch.name||'Charakter')}" data-tip="Weitere Aktionen (Ansicht, Direktlink, Kopie, Kampagne/Besitzer, Löschen)" class="btn min-h-[40px] min-w-[40px] py-2 px-2.5 text-base font-black shrink-0">⋮</button>
            </div>
          </div>`;
        }).join('')}
      </div>`
      :`<div class="subcard border-dashed py-12 px-4 text-center space-y-3">
        <div class="text-sm sm:text-base font-extrabold t-mut">${CLOUD.filterMine?'Du hast in dieser Kampagne noch keinen eigenen Charakterbogen.':'In dieser Kampagne liegen aktuell noch keine Charakterbögen.'}</div>
        ${CLOUD.currentUser
          ?`<div><button type="button" data-action="lobby-new-sheet" class="btn btn-ok py-2.5 px-5 text-xs sm:text-sm font-black shadow-lg">✨ + Charakter in dieser Kampagne erstellen</button></div>`
          :`<div class="text-xs t-mut">Melde dich oben in der Willkommens-Zentrale an, um einen neuen Charakterbogen zu erstellen.</div>`}
      </div>`}
      `:''}

      ${canReadPublicNotes?`
        <div class="subcard p-2.5 sm:p-4 space-y-3 sm:space-y-3.5 border-2 bdr-acc bg-acc-soft/20 min-w-0 max-w-full">
          <div class="flex flex-wrap items-center justify-between gap-2 min-w-0 ${CLOUD.publicNotesOpen?'border-b bdr-line pb-2.5':''}">
            <div class="flex flex-wrap items-center gap-1.5 sm:gap-2 min-w-0 max-w-full">
              <button type="button" data-action="toggle-lobby-pubnotes" aria-label="${CLOUD.publicNotesOpen?'Öffentliche Kampagnennotizen einklappen':'Öffentliche Kampagnennotizen ausklappen'}" data-tip="${CLOUD.publicNotesOpen?'Gesammeltes Dokument einklappen':'Gesammeltes Dokument ausklappen'}" class="btn w-7 h-7 p-0 text-xs font-black shrink-0">${CLOUD.publicNotesOpen?'▾':'▸'}</button>
              <h3 class="text-xs sm:text-sm font-black text-acc uppercase tracking-wider break-words min-w-0">📖 Öffentliche Notizen<span class="hidden sm:inline"> – Gesammeltes Dokument</span></h3>
              <span class="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-acc-soft text-acc border bdr-acc inline-flex items-center gap-1 max-w-full min-w-0"><span class="shrink-0">📁</span><span class="truncate">${esc(activeCamp?.name||'Kampagne')}</span></span>
              <span class="pill cursor-default text-[10px] py-0.5 px-2 tabular shrink-0">${allPublicPages.filter(p=>p.hasContent).length}/${allPublicPages.length} ${allPublicPages.length===1?'Seite':'Seiten'}</span>
            </div>
            <div class="flex flex-wrap items-center gap-1.5 min-w-0 max-w-full">
              ${myCampNoteChar?`<button type="button" data-action="lobby-focus-my-pubnote" data-id="${esc(myCampNoteChar.id)}" aria-label="Meine öffentliche Notizseite (${esc(myCampNoteChar.charName||myCampNoteChar.name||'Held')}) anzeigen" data-tip="Direkt zur ersten öffentlichen Notizseite deines Charakters hier im Lobby-Dokument springen" class="btn bdr-acc bg-acc-soft text-acc py-1 px-2 sm:px-2.5 text-xs font-extrabold max-w-full min-w-0"><span class="truncate">🎯 Meine Seite<span class="hidden sm:inline"> (${esc(myCampNoteChar.charName||myCampNoteChar.name||'Held')})</span></span></button><button type="button" data-action="lobby-open-char-pubnote" data-id="${esc(myCampNoteChar.id)}" aria-label="Öffentliche Notizen im Charakterbogen öffnen" data-tip="Eigenen Charakterbogen öffnen und direkt die öffentlichen Kampagnennotizen bearbeiten" class="btn btn-pri py-1 px-2 sm:px-2.5 text-xs font-extrabold shrink-0">📝 <span class="hidden sm:inline">Im Bogen öffnen</span><span class="sm:hidden">Im Bogen</span></button>`:''}
              <button type="button" data-action="toggle-lobby-pubnotes" aria-label="${CLOUD.publicNotesOpen?'Einklappen':'Ausklappen'}" data-tip="${CLOUD.publicNotesOpen?'Gesammeltes Dokument einklappen':'Gesammeltes Dokument ausklappen'}" class="btn py-1 px-2 sm:px-2.5 text-xs shrink-0">${CLOUD.publicNotesOpen?'▴':'▾'}<span class="hidden sm:inline"> ${CLOUD.publicNotesOpen?'Einklappen':'Ausklappen'}</span></button>
            </div>
          </div>
          ${CLOUD.publicNotesOpen?(allPublicPages.length&&activePubPage?`
            <div class="subcard p-2.5 sm:p-5 bg-black/30 border bdr-line space-y-3 sm:space-y-3.5 min-w-0 max-w-full">
              <!-- Oben: Zwei-Ebenen Buch-/Ordner-Navigation -->
              <div class="space-y-2.5 border-b bdr-line pb-3 min-w-0">
                <!-- Ebene 1: Buch-/Quellen-Auswahl -->
                <div class="flex flex-wrap items-center justify-between gap-2 min-w-0">
                  <div class="flex flex-wrap items-center gap-2 flex-1 min-w-0 max-w-full">
                    <button type="button" data-action="select-lobby-pubpage" data-pagekey="camp::${esc(campPages[0]?.id||'camp_main')}" aria-label="Gemeinsame Kampagnennotizen (${campPages.length} Seiten)" data-tip="Gemeinsame Notizseiten der gesamten Kampagne anzeigen" class="btn py-1.5 px-3 text-xs sm:text-sm font-black flex items-center gap-1.5 w-full sm:w-auto max-w-full min-w-0 ${activePubPage.isCampPage?'btn-pri ring-1 ring-sky-400/40':'bdr-acc bg-acc-soft/40 opacity-90 hover:opacity-100'}">
                      <span class="truncate min-w-0">📖 Gemeinsame Notizen (${campPages.length})</span>
                    </button>
                    <select data-lobby-book-sel="1" aria-label="Öffentliches Spieler-Notizbuch auswählen" class="inp py-1.5 px-2.5 sm:px-3 text-xs sm:text-sm font-extrabold w-full sm:w-auto min-w-0 sm:min-w-[260px] max-w-full ${!activePubPage.isCampPage?'!border-sky-400 bg-acc-soft text-acc':''}">
                      <option value="camp" ${activePubPage.isCampPage?'selected':''}>— 👤 Spieler-Notizbücher (${pubNotesDocEntries.length}) —</option>
                      ${pubNotesDocEntries.map(entry=>`<option value="${esc(entry.id)}" ${!activePubPage.isCampPage&&activePubPage.charId===entry.id?'selected':''}>👤 ${esc(entry.charName)} (${esc(entry.owner||'Frei')}) — ${(entry.pages||[]).length} S.</option>`).join('')}
                    </select>
                  </div>
                </div>

                <!-- Ebene 2: Seiten-Tabs innerhalb des aktuell gewählten Buchs -->
                <div class="flex flex-wrap items-center justify-between gap-2 pt-1.5 border-t border-white/10 min-w-0">
                  ${activePubPage.isCampPage?`
                    <div class="flex flex-wrap items-center gap-1.5 min-w-0 max-w-full">
                      ${allPublicPages.filter(p=>p.isCampPage).map((pg,idx)=>{
                        const isAct=pg.pageKey===activePubPage?.pageKey;
                        if(pg.isDetached){
                          return `<button type="button" data-action="select-lobby-pubpage" data-pagekey="${esc(pg.pageKey)}" class="btn py-1.5 px-2.5 text-xs flex items-center gap-1.5 max-w-full min-w-0 ${isAct?'btn-pri':'opacity-85 hover:opacity-100'}">
                            <span class="text-xs leading-none shrink-0">🏛️</span>
                            <span class="font-extrabold truncate max-w-[140px] sm:max-w-[160px] min-w-0">${esc(pg.pageTitle||('Seite '+(idx+1)))}</span>
                            <span class="text-[10px] opacity-80 truncate max-w-[95px] sm:max-w-[120px] min-w-0">(${esc(pg.originCharName||'Charakter')})</span>
                            ${pg.hasContent?`<span class="w-2 h-2 rounded-full bg-emerald-400 shrink-0" data-tip="Enthält öffentliche Notizen"></span>`:''}
                          </button>`;
                        }
                        return `<button type="button" data-action="select-lobby-pubpage" data-pagekey="${esc(pg.pageKey)}" class="btn py-1.5 px-2.5 text-xs flex items-center gap-1.5 max-w-full min-w-0 ${isAct?'btn-pri':'opacity-85 hover:opacity-100'}">
                          <span class="text-xs leading-none shrink-0">📄</span>
                          <span class="font-extrabold truncate max-w-[160px] sm:max-w-[180px] min-w-0">${esc(pg.pageTitle||('Seite '+(idx+1)))}</span>
                          ${pg.hasContent?`<span class="w-2 h-2 rounded-full bg-emerald-400 shrink-0" data-tip="Enthält öffentliche Notizen"></span>`:''}
                        </button>`;
                      }).join('')}
                    </div>
                    ${canReadPublicNotes?`<button type="button" data-action="add-lobby-camppage" aria-label="Neue gemeinsame Kampagnenseite erstellen" data-tip="Neue gemeinsame Kampagnenseite für alle Mitglieder erstellen" class="btn bdr-acc bg-acc-soft text-acc py-1.5 px-2.5 text-xs font-extrabold shrink-0">+ <span class="hidden sm:inline">Neue Kampagnenseite</span><span class="sm:hidden">Seite</span></button>`:''}
                  `:`
                    <div class="flex flex-wrap items-center gap-1.5 min-w-0 max-w-full">
                      ${(activeBookCharEntry?.pages||[]).map((pg,idx)=>{
                        const pKey=`${activeBookCharEntry.id}::${pg.id}`;
                        const isAct=pKey===activePubPage?.pageKey;
                        const hasC=Boolean(stripHtml(pg.content||'').trim());
                        return `<button type="button" data-action="select-lobby-pubpage" data-pagekey="${esc(pKey)}" class="btn py-1.5 px-2.5 text-xs flex items-center gap-1.5 max-w-full min-w-0 ${isAct?'btn-pri':'opacity-85 hover:opacity-100'}">
                          <span class="text-xs leading-none shrink-0">📄</span>
                          <span class="font-extrabold truncate max-w-[160px] sm:max-w-[180px] min-w-0">${esc(pg.title||('Seite '+(idx+1)))}</span>
                          ${hasC?`<span class="w-2 h-2 rounded-full bg-emerald-400 shrink-0" data-tip="Enthält öffentliche Notizen"></span>`:''}
                        </button>`;
                      }).join('')}
                    </div>
                    ${activeBookCharEntry?.canEditNote?`<button type="button" data-action="lobby-add-char-pubpage" data-cid="${esc(activeBookCharEntry.id)}" aria-label="Öffentliche Notizseite hinzufügen" data-tip="Dem ausgewählten Charakter eine weitere öffentliche Notizseite hinzufügen" class="btn bdr-acc bg-acc-soft text-acc py-1.5 px-2.5 text-xs font-extrabold shrink-0">+ <span class="hidden sm:inline">Öffentliche Seite hinzufügen</span><span class="sm:hidden">Seite</span></button>`:''}
                  `}
                </div>
              </div>

              <!-- Mitte: Klarstellungs-Banner der geöffneten Seite activePubPage -->
              <div class="p-2.5 sm:p-3 rounded-xl bg-black/35 border bdr-line flex flex-wrap items-center justify-between gap-2 sm:gap-2.5 min-w-0 max-w-full">
                ${activePubPage.isCampPage&&!activePubPage.isDetached?`
                  <div class="flex flex-wrap items-center gap-2 flex-[1_1_240px] sm:flex-[1_1_320px] w-full min-w-0 max-w-full">
                    <input type="text" data-lobby-camptitle="${esc(activePubPage.pageId)}" value="${esc(activePubPage.pageTitle)}" placeholder="Tab-Titel..." class="inp py-1 px-2.5 text-xs sm:text-sm font-extrabold w-full sm:w-64 min-w-0"/>
                    <span class="px-2.5 py-1 rounded-md text-[10px] sm:text-[11px] font-extrabold bg-acc-soft text-acc border bdr-acc break-words max-w-full">📖 Gemeinsame Kampagnenseite<span class="hidden sm:inline"> (Alle Kampagnen-Mitglieder können hier schreiben)</span></span>
                  </div>
                  <div class="flex flex-wrap items-center gap-2 max-w-full min-w-0">
                    <div class="text-[11px] font-bold t-mut tabular break-words min-w-0">🕒 <span class="hidden sm:inline">Zuletzt bearbeitet: </span><span data-lobby-notets="1">${esc(activePubPage.updatedAt || 'Noch keine Einträge')}</span>${activePubPage.lastEditor ? ' (👤 ' + esc(activePubPage.lastEditor) + ')' : ''}</div>
                    ${activePubPage.canDeletePage?(CLOUD.confirmDelCampPageId===activePubPage.pageId?`<span class="inline-flex flex-wrap items-center gap-1 max-w-full"><button type="button" data-action="confirm-del-lobby-camppage" data-pageid="${esc(activePubPage.pageId)}" class="btn bg-rose-600 text-white border-rose-600 py-1 px-2.5 text-[11px] font-black">Löschen? (2/2)</button><button type="button" data-action="cancel-del-lobby-camppage" aria-label="Löschen abbrechen" class="btn py-1 px-2 text-[11px]">✕</button></span>`:`<button type="button" data-action="ask-del-lobby-camppage" data-pageid="${esc(activePubPage.pageId)}" aria-label="Seite löschen" data-tip="Diese Kampagnenseite löschen" class="btn btn-err py-1 px-2 sm:px-2.5 text-[11px] shrink-0">🗑️<span class="hidden sm:inline"> Seite löschen</span></button>`):''}
                  </div>
                `:activePubPage.isDetached?`
                  <div class="flex flex-wrap items-center gap-2 flex-[1_1_240px] sm:flex-[1_1_320px] w-full min-w-0 max-w-full">
                    <input type="text" data-lobby-camptitle="${esc(activePubPage.pageId)}" value="${esc(activePubPage.pageTitle)}" placeholder="Tab-Titel..." class="inp py-1 px-2.5 text-xs sm:text-sm font-extrabold w-full sm:w-64 min-w-0"/>
                    <span class="px-2.5 py-1 rounded-md text-[10px] sm:text-[11px] font-extrabold bg-amber-500/20 text-amber-300 border border-amber-400/50 break-words max-w-full">🏛️ Erhaltene Notiz aus „${esc(activePubPage.originCharName)}“${activePubPage.originOwner ? ' (👤 ' + esc(activePubPage.originOwner) + ')' : ''}</span>
                  </div>
                  <div class="flex flex-wrap items-center gap-2 max-w-full min-w-0">
                    <div class="text-[11px] font-bold t-mut tabular break-words min-w-0">🕒 <span class="hidden sm:inline">Zuletzt bearbeitet: </span><span data-lobby-notets="1">${esc(activePubPage.updatedAt)}</span></div>
                    ${activePubPage.canDeletePage?(CLOUD.confirmDelCampPageId===activePubPage.pageId?`<span class="inline-flex flex-wrap items-center gap-1 max-w-full"><button type="button" data-action="confirm-del-lobby-camppage" data-pageid="${esc(activePubPage.pageId)}" class="btn bg-rose-600 text-white border-rose-600 py-1 px-2.5 text-[11px] font-black">Löschen? (2/2)</button><button type="button" data-action="cancel-del-lobby-camppage" aria-label="Löschen abbrechen" class="btn py-1 px-2 text-[11px]">✕</button></span>`:`<button type="button" data-action="ask-del-lobby-camppage" data-pageid="${esc(activePubPage.pageId)}" aria-label="Seite löschen" data-tip="Diese erhaltene Notizseite löschen" class="btn btn-err py-1 px-2 sm:px-2.5 text-[11px] shrink-0">🗑️<span class="hidden sm:inline"> Seite löschen</span></button>`):''}
                  </div>
                `:`
                  <div class="flex flex-wrap items-center gap-2 flex-[1_1_240px] sm:flex-[1_1_320px] w-full min-w-0 max-w-full">
                    <div class="w-9 h-9 rounded-xl overflow-hidden border bdr-acc bg-black/40 shrink-0 flex items-center justify-center shadow-sm">
                      ${activePubPage.avatar?`<img src="${activePubPage.avatar}" class="w-full h-full object-cover"/>`:`<span class="text-xs font-black text-acc">📝</span>`}
                    </div>
                    <span class="text-xs sm:text-sm font-black text-acc break-words min-w-0"><span class="hidden sm:inline">Von Charakterbogen: </span>${esc(activePubPage.charName)}</span>
                    ${activePubPage.owner?renderUserNamePill(activePubPage.owner,{cls:`px-2 py-0.5 rounded-md text-[10px] font-black max-w-full ${activePubPage.isMyChar?'bg-emerald-500/25 text-emerald-300 border border-emerald-400/50':'bg-indigo-500/20 text-indigo-300 border border-indigo-400/40'}`}):`<span class="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-black/25 t-mut shrink-0">⚪ Frei</span>`}
                    <span class="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-acc-soft text-acc border bdr-acc break-words max-w-full">📄 ${esc(activePubPage.pageTitle)}</span>
                    <button type="button" data-action="cloud-load-char" data-id="${esc(activePubPage.charId)}" aria-label="Charakterbogen öffnen" data-tip="Diesen Charakterbogen öffnen" class="btn py-1 px-2 sm:px-2.5 text-[11px] bdr-acc bg-acc-soft text-acc font-extrabold shrink-0">🔎 <span class="hidden sm:inline">Bogen </span>öffnen</button>
                  </div>
                  <div class="flex flex-wrap items-center gap-2 max-w-full min-w-0">
                    <div class="text-[11px] font-bold t-mut tabular break-words min-w-0">🕒 <span class="hidden sm:inline">Zuletzt bearbeitet: </span><span data-lobby-notets="1">${esc(activePubPage.updatedAt)}</span></div>
                    ${activePubPage.canDeletePage?(CLOUD.confirmDelCampPageId===activePubPage.pageId?`<span class="inline-flex flex-wrap items-center gap-1 max-w-full"><button type="button" data-action="confirm-del-lobby-camppage" data-pageid="${esc(activePubPage.pageId)}" class="btn bg-rose-600 text-white border-rose-600 py-1 px-2.5 text-[11px] font-black">Löschen? (2/2)</button><button type="button" data-action="cancel-del-lobby-camppage" aria-label="Löschen abbrechen" class="btn py-1 px-2 text-[11px]">✕</button></span>`:`<button type="button" data-action="ask-del-lobby-camppage" data-pageid="${esc(activePubPage.pageId)}" aria-label="Seite löschen" data-tip="Diese öffentliche Seite löschen" class="btn btn-err py-1 px-2 sm:px-2.5 text-[11px] shrink-0">🗑️<span class="hidden sm:inline"> Seite löschen</span></button>`):''}
                  </div>
                `}
              </div>

              <!-- Unten: Dokumentenblatt -->
              ${activePubPage.canEditNote?`
                <div class="space-y-2 min-w-0">
                  <div class="flex flex-wrap items-center justify-between gap-2 min-w-0">
                    <div class="flex flex-wrap items-center gap-1 min-w-0 max-w-full">
                      ${renderRtfToolbarHtml(false)}
                      <button type="button" onmousedown="event.preventDefault()" data-action="rtf-cmd" data-cmd="insertOrderedList" data-tip="Nummerierte Liste" class="btn py-0.5 px-2 text-xs font-bold touch-manipulation">1. Liste</button>
                    </div>
                    <button type="button" data-action="save-lobby-pubnote" data-id="${esc(activePubPage.charId)}" data-pageid="${esc(activePubPage.pageId)}" aria-label="Öffentliche Notiz speichern" data-tip="Öffentliche Kampagnennotiz jetzt speichern" class="btn btn-ok py-1 px-2.5 sm:px-3 text-xs font-black shrink-0">💾 <span class="hidden sm:inline">Öffentliche Notiz </span>speichern</button>
                  </div>
                  <div contenteditable="true" data-lobby-pubnote="${esc(activePubPage.charId)}" data-pageid="${esc(activePubPage.pageId)}" data-ph="Öffentliche Kampagnennotiz für ${esc(activePubPage.charName)} (${esc(activePubPage.pageTitle)}) eingeben..." class="inp w-full min-h-[220px] text-xs sm:text-sm rtf-box">${toRtfHtml(activePubPage.content)}</div>
                </div>
              `:`
                <div class="inp w-full min-h-[180px] text-xs sm:text-sm rtf-box pointer-events-none opacity-95">${activePubPage.hasContent?toRtfHtml(activePubPage.content):`<span class="t-mut italic opacity-75">Noch keine öffentliche Kampagnennotiz eingetragen.</span>`}</div>
              `}
            </div>
          `:`<div class="subcard border-dashed py-6 text-center text-xs t-mut">In dieser Kampagne befinden sich noch keine Charaktere. Sobald Charaktere zugeordnet sind, werden deren „🌐 Öffentlich“-Kampagnennotizen hier als gemeinsames Dokument zusammengeführt.</div>`):''}
        </div>
      `:''}
    </section>

    <!-- Sektion 3: Live-Würfel-Bereich am Ende der Lobby -->
    <div id="lobbyLiveDiceMount" data-last-camp-id="${esc(getActiveLiveCampaignId())}">${renderLobbyLiveDiceHtml()}</div>
  </div>`;
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

const getColTargetObj=()=>UI.colTarget==='pw'?findPwItem(UI.colPwKind,UI.colPwId):UI.colTarget==='sec-folder'?S.powerSections.find(s=>s.id===UI.colPwId):UI.colTarget==='sksec-folder'?S.skillSections.find(s=>s.id===UI.colPwId):UI.colTarget==='invsec-folder'?(S.invSections||[]).find(s=>s.id===UI.colPwId):UI.colTarget==='sk-item'?S.skills.find(s=>s.id===UI.colPwId):UI.colTarget==='eq'?findEqItem(UI.colPwKind,UI.colPwId):UI.colTarget==='chrsec'?S.chrSecMeta?.[UI.colPwId]:UI.colTarget==='camp'?getCampaigns().find(c=>c.id===UI.colPwId):UI.colTarget==='eqsec'?S.equipSecMeta?.[UI.colPwId]:null;
const openDualColorModal=(target,id,cmode,kind='')=>{UI.colTarget=target;UI.colPwKind=kind;UI.colPwId=id;UI.colMode=cmode==='bg'?'bg':'text';const it=getColTargetObj();if(!it)return;const cur=UI.colMode==='bg'?it.bgColor:it.color;UI.colDraft=isHex(cur)?cur:(UI.colMode==='bg'?'#1e293b':'#38bdf8');UI.modal='color';renderModal();};
const modalShell=(title,sub,body,foot,maxW='max-w-2xl',extra='')=>`<div data-action="close-modal-bg" class="modal-backdrop"><div class="card modal-panel ${maxW} p-0 shadow-2xl"><div class="modal-hdr z-10 flex items-start sm:items-center justify-between gap-2 px-3.5 sm:px-5 pb-3 sm:pb-3.5 border-b bdr-line shrink-0" style="background:var(--surf2)">${(String(title||'').trim()||String(sub||'').trim())?`<div class="min-w-0 flex-1"><h2 class="text-base sm:text-lg font-extrabold break-words">${title}</h2>${sub?`<p class="text-xs t-mut break-words">${sub}</p>`:''}</div><div class="flex flex-wrap items-center justify-end gap-1.5 shrink-0">${extra}<button type="button" data-action="close-modal" aria-label="Schließen" class="btn min-w-[36px] min-h-[36px] sm:min-w-0 sm:min-h-0 py-1 px-2.5 font-black shrink-0">✕</button></div>`:`${extra?`<div class="flex-1 min-w-0 flex flex-wrap items-center gap-1.5">${extra}</div>`:'<div class="flex-1 min-w-0"></div>'}<button type="button" data-action="close-modal" aria-label="Schließen" class="btn min-w-[36px] min-h-[36px] sm:min-w-0 sm:min-h-0 py-1 px-2.5 font-black shrink-0">✕</button>`}</div><div class="modal-body p-3.5 sm:p-5 space-y-4 text-xs sm:text-sm min-w-0${String(foot||'').trim()?'':' safe-pb'}">${body}</div>${String(foot||'').trim()?`<div class="modal-foot z-10 px-3.5 sm:px-5 pt-3 border-t bdr-line flex flex-wrap items-center justify-end gap-2 shrink-0" style="background:var(--surf2)">${foot}</div>`:''}</div></div>`;

function formatPwLibImportToast(res,label=''){
  if(!res) return '⚠️ Import fehlgeschlagen.';
  const parts=[];
  if(res.addedSec) parts.push(`+${res.addedSec} ${res.addedSec===1?'Sektion':'Sektionen'}`);
  if(res.addedPw) parts.push(`+${res.addedPw} ${res.addedPw===1?'Kraft':'Kräfte'}`);
  if(res.addedAug) parts.push(`+${res.addedAug} ${res.addedAug===1?'Augment':'Augmente'}${res.autoLinkedAugs?` (${res.autoLinkedAugs} zugeordnet)`:''}`);
  if(res.updatedPw) parts.push(`${res.updatedPw} aktualisiert`);
  if(res.skipped) parts.push(`${res.skipped} übersprungen`);
  const pfx=label?`📥 „${label}“: `:'📥 Import: ';
  const extras=[];
  const dupNames=Array.isArray(res.duplicateNames)?res.duplicateNames:[];
  if(dupNames.length){
    const dupList=dupNames.slice(0,5).map(n=>`„${n}“`).join(', ')+(dupNames.length>5?` (+${dupNames.length-5} weitere)`:'');
    extras.push(`⚠️ Bereits vorhanden: ${dupList}`);
  }
  const fullSlots=Array.isArray(res.fullSlotNotices)?res.fullSlotNotices:[];
  if(fullSlots.length){
    const fullList=fullSlots.slice(0,3).map(x=>`„${x.augName}“ (Kraft „${x.powerName}“ hat bereits 3/3 Augmente)`).join(', ')+(fullSlots.length>3?` (+${fullSlots.length-3} weitere)`:'');
    extras.push(`⚠️ Als freies Augment importiert: ${fullList}`);
  }
  if(!parts.length&&!extras.length) return `${pfx}Keine neuen Einträge gefunden.`;
  const base=parts.length?`${pfx}${parts.join(', ')}`:`${pfx}Keine neuen Einträge importiert`;
  return extras.length?`${base} • ${extras.join(' • ')}`:base;
}
function getPwSecOptionsFlat(){
  const out=[], visited=new Set();
  const walk=(parentId,depth)=>{
    (S.powerSections||[]).filter(s=>s&&(s.parentSectionId||'')===parentId).forEach(s=>{
      if(visited.has(s.id)) return;
      visited.add(s.id);
      out.push({id:s.id,name:String(s.name||'Sektion'),depth});
      walk(s.id,depth+1);
    });
  };
  walk('',0);
  (S.powerSections||[]).forEach(s=>{if(s&&!visited.has(s.id))out.push({id:s.id,name:String(s.name||'Sektion'),depth:0});});
  return out;
}
function renderPwLibImportOptsHtml(){
  const flatSecs=getPwSecOptionsFlat();
  return `<div class="subcard p-2.5 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
    <div class="min-w-0">
      <label class="block text-[10px] font-extrabold t-mut uppercase tracking-wider mb-1">Duplikat-Verhalten</label>
      <select data-pwlib-sel="dedupeMode" class="inp w-full min-w-0 text-xs font-semibold">
        <option value="skipExisting" ${PWLIB.dedupeMode==='skipExisting'?'selected':''}>Vorhandene überspringen</option>
        <option value="copy" ${PWLIB.dedupeMode==='copy'?'selected':''}>Als Kopie einfügen</option>
        <option value="updateExisting" ${PWLIB.dedupeMode==='updateExisting'?'selected':''}>Vorhandene aktualisieren</option>
      </select>
    </div>
    <div class="min-w-0">
      <label class="block text-[10px] font-extrabold t-mut uppercase tracking-wider mb-1">Ziel-Sektion (optional)</label>
      <select data-pwlib-sel="targetSecId" class="inp w-full min-w-0 text-xs font-semibold">
        <option value="" ${!PWLIB.targetSecId?'selected':''}>— Original-Struktur / Hauptebene —</option>
        ${flatSecs.map(s=>`<option value="${esc(s.id)}" ${PWLIB.targetSecId===s.id?'selected':''}>${'↳ '.repeat(Math.min(3,s.depth))}📁 ${esc(s.name)}</option>`).join('')}
      </select>
    </div>
  </div>`;
}
function refreshPwLibListDOM(){
  const listEl=$('pwlibPackList');
  if(!listEl){if(UI.modal==='powerLibrary')renderModal();return;}
  const scrollMap=new Map();
  listEl.querySelectorAll('[data-pwlib-scroll]').forEach(el=>{
    scrollMap.set(el.dataset.pwlibScroll,el.scrollTop);
  });
  listEl.innerHTML=renderPwLibPackListHtml();
  listEl.querySelectorAll('[data-pwlib-scroll]').forEach(el=>{
    const prev=scrollMap.get(el.dataset.pwlibScroll);
    if(prev!==undefined) el.scrollTop=prev;
  });
}
function renderPwLibPackListHtml(){
  const allPacks=getAllLibraryPacks();
  const q=String(PWLIB.search||'').trim().toLowerCase();
  const fCat=String(PWLIB.filterCat||'').trim();
  const fTier=String(PWLIB.filterTier||'').trim();
  const openCats=PWLIB.openCats||(PWLIB.openCats={});
  const openPacks=PWLIB.openPacks||(PWLIB.openPacks={});
  const openAugFolders=PWLIB.openAugFolders||(PWLIB.openAugFolders={});
  const isNodeOpen=(map,key,autoOpen)=>Object.prototype.hasOwnProperty.call(map,key)?Boolean(map[key]):Boolean(autoOpen);
  const itemTierKey=it=>PW_TIERS[it?.tier]?it.tier:'marginal';
  const itemMatchesTier=it=>!fTier||itemTierKey(it)===fTier;
  const itemMatchesQuery=it=>{
    if(!q) return true;
    const hay=[it?.name,it?.art,it?.req,...(Array.isArray(it?.actionSubs)?it.actionSubs:[]),...(Array.isArray(it?.tags)?it.tags:[]),...(Array.isArray(it?.subcats)?it.subcats:[]),stripHtml(it?.desc||''),stripHtml(it?.effects||'')].join(' ').toLowerCase();
    return hay.includes(q);
  };
  const suggCache=new Map();
  const getSuggFor=(pw,pk)=>{
    const k=`${pk.id}::${String(pw.id||'')}`;
    if(!suggCache.has(k)) suggCache.set(k,getSuggestedAugmentsForPower(pw,pk,allPacks));
    return suggCache.get(k);
  };
  const calcPackHits=pk=>{
    const pws=Array.isArray(pk.powers)?pk.powers:[];
    const augs=Array.isArray(pk.augments)?pk.augments:[];
    const secs=Array.isArray(pk.sections)?pk.sections:[];
    const metaHit=q?[pk.name,pk.category,pk.description].join(' ').toLowerCase().includes(q):false;
    const secHit=q?secs.some(s=>String(s?.name||'').toLowerCase().includes(q)):false;
    const matchedPws=pws.filter(p=>itemMatchesTier(p)&&itemMatchesQuery(p));
    const matchedOwnAugs=augs.filter(a=>itemMatchesTier(a)&&itemMatchesQuery(a));
    const crossAugMatchedIds=new Set();
    if(q){
      pws.forEach(p=>{
        getSuggFor(p,pk).forEach(entry=>{
          if(entry.isCrossPack&&itemMatchesTier(entry.aug)&&itemMatchesQuery(entry.aug)){
            crossAugMatchedIds.add(String(entry.aug.id||''));
          }
        });
      });
    }
    const itemHitCount=q?(matchedPws.length+matchedOwnAugs.length+crossAugMatchedIds.size):0;
    const anyHit=!q||(metaHit||secHit||itemHitCount>0);
    return {metaHit,secHit,itemHitCount,anyHit,hasDirectItemHit:itemHitCount>0};
  };
  const filteredPacks=allPacks.filter(pk=>{
    if(fCat&&String(pk.category||'Allgemein')!==fCat) return false;
    const pws=Array.isArray(pk.powers)?pk.powers:[];
    const augs=Array.isArray(pk.augments)?pk.augments:[];
    if(fTier){
      const tierMatchOwn=pws.some(itemMatchesTier)||augs.some(itemMatchesTier);
      const tierMatchCross=pws.some(p=>getSuggFor(p,pk).some(e=>itemMatchesTier(e.aug)));
      if(!tierMatchOwn&&!tierMatchCross) return false;
    }
    if(q){
      if(!calcPackHits(pk).anyHit) return false;
    }
    return true;
  });
  if(PWLIB.loading&&!allPacks.length){
    return `<div class="subcard py-8 text-center text-xs t-mut">⏳ Lade Kräfte-Bibliothek vom Server...</div>`;
  }
  if(!filteredPacks.length){
    return `<div class="subcard border-dashed py-7 text-center space-y-2 text-xs t-mut">
      <div class="font-extrabold text-sm text-acc">${allPacks.length?'Keine Pakete für diesen Filter gefunden.':'Noch keine Pakete in der Server-Bibliothek gefunden.'}</div>
      <div>${allPacks.length?'Passe Suchbegriff, Kategorie oder Stufe an.':'Klicke oben auf „🔄 Neu laden“ oder importiere eine lokale .json-Datei im zweiten Reiter.'}</div>
    </div>`;
  }

  const catGroups=new Map();
  filteredPacks.forEach(pk=>{
    const cat=String(pk.category||'Allgemein').trim()||'Allgemein';
    if(!catGroups.has(cat)) catGroups.set(cat,[]);
    catGroups.get(cat).push(pk);
  });

  const renderPackCard=pk=>{
    const secs=Array.isArray(pk.sections)?pk.sections:[];
    const pws=Array.isArray(pk.powers)?pk.powers:[];
    const augs=Array.isArray(pk.augments)?pk.augments:[];
    const hits=calcPackHits(pk);
    const isPackOpen=isNodeOpen(openPacks,pk.id,Boolean(q&&hits.hasDirectItemHit));
    const originBadge=pk._origin==='cloud'
      ?`<span class="px-1.5 py-0.5 rounded text-[10px] font-black bg-indigo-500/20 text-indigo-300 border border-indigo-400/45 shrink-0">☁️ Cloud</span>`
      :`<span class="px-1.5 py-0.5 rounded text-[10px] font-black bg-emerald-500/15 text-emerald-300 border border-emerald-400/40 shrink-0">📁 Repo</span>`;
    const secIds=new Set(secs.map(s=>String(s.id||'')));
    const pwIds=new Set(pws.map(p=>String(p.id||'')));
    const validAugIdsForPack=new Set(augs.map(a=>String(a.id||'')).filter(Boolean));
    pws.forEach(p=>{
      getSuggFor(p,pk).forEach(entry=>{
        const aid=String(entry.aug?.id||'');
        if(aid) validAugIdsForPack.add(aid);
      });
    });
    const selSecCnt=Object.keys(PWLIB.selSecIds||{}).filter(k=>PWLIB.selSecIds[k]&&secIds.has(k)).length;
    const selPwCnt=Object.keys(PWLIB.selPwIds||{}).filter(k=>PWLIB.selPwIds[k]&&pwIds.has(k)).length;
    const selAugCnt=Object.keys(PWLIB.selAugIds||{}).filter(k=>PWLIB.selAugIds[k]&&validAugIdsForPack.has(k)).length;
    const selTotal=selSecCnt+selPwCnt+selAugCnt;
    let detailHtml='';
    if(isPackOpen){
      const renderItemRow=(it,isAug,indent=false,extraBadge='')=>{
        if(fTier&&!itemMatchesTier(it)) return '';
        const id=String(it.id||'');
        const checked=Boolean(isAug?PWLIB.selAugIds?.[id]:PWLIB.selPwIds?.[id]);
        const tKey=itemTierKey(it), tInfo=PW_TIERS[tKey]||PW_TIERS.marginal, tBadgeCls=PW_TIER_BADGE_CLS[tKey]||PW_TIER_BADGE_CLS.marginal;
        const c=calcPwCost(it);
        const uCostTxt=formatPwUseCosts(it);
        const prevTxt=stripHtml(it.desc||it.effects||'').replace(/\s+/g,' ').trim();
        const isQueryHit=Boolean(q&&itemMatchesQuery(it));
        return `<button type="button" data-action="pwlib-toggle-sel" data-kind="${isAug?'augment':'power'}" data-pack="${esc(pk.id)}" data-id="${esc(id)}" class="w-full text-left p-2 rounded-lg border transition-colors flex flex-wrap items-start justify-between gap-2 min-w-0 ${checked?'bdr-acc bg-acc-soft/25':'bdr-line bg-black/20 hover:border-sky-400/45'} ${indent?'border-amber-500/40':''} ${isQueryHit?'ring-1 ring-amber-400/50':''}">
          <div class="flex items-start gap-2 min-w-0 flex-1">
            <span class="text-sm leading-none mt-0.5 shrink-0 ${checked?'text-acc':'t-mut'}">${checked?'☑':'☐'}</span>
            <div class="min-w-0 flex-1">
              <div class="flex flex-wrap items-center gap-1.5 min-w-0">
                ${isAug?`<span class="px-1.5 py-0.2 rounded text-[10px] font-black bg-amber-500/20 text-amber-300 border border-amber-400/40 shrink-0">${indent?'↳ Augment':'Augment'}</span>`:''}
                <span class="font-extrabold text-xs break-words">${esc(it.name||(isAug?'Unbenanntes Augment':'Unbenannte Kraft'))}</span>
                ${it.art?`<span class="text-[10px] t-mut">• ${esc(it.art)}</span>`:''}
                ${extraBadge}
              </div>
              ${prevTxt?`<div class="text-[11px] t-mut truncate mt-0.5">${esc(prevTxt.slice(0,110))}${prevTxt.length>110?'…':''}</div>`:''}
            </div>
          </div>
          <div class="flex flex-wrap items-center gap-1 shrink-0 tabular">
            <span class="px-1.5 py-0.5 rounded text-[10px] font-extrabold border ${tBadgeCls}">${esc(tInfo.l)} (${c.sp} SP${c.msp?`+${c.msp}M`:''})</span>
            ${uCostTxt?`<span class="px-1.5 py-0.5 rounded text-[10px] font-bold text-acc bg-acc-soft/30 border bdr-acc">⚡ ${esc(uCostTxt)}</span>`:''}
          </div>
        </button>`;
      };
      const renderPowerWithAugs=p=>{
        const pid=String(p.id||'');
        const allSugg=getSuggFor(p,pk);
        const tierSugg=allSugg.filter(e=>itemMatchesTier(e.aug));
        const matchingSugg=q?tierSugg.filter(e=>itemMatchesQuery(e.aug)):tierSugg;
        const pMatchesQ=!q||hits.metaHit||hits.secHit||itemMatchesQuery(p);
        const showPower=(!fTier||itemMatchesTier(p))&&(pMatchesQ||matchingSugg.length>0);
        const showAugList=q&&!pMatchesQ?matchingSugg:tierSugg;
        if(!showPower&&!showAugList.length) return '';
        const pRow=showPower?renderItemRow(p,false,false):'';
        let augFolderHtml='';
        if(showAugList.length){
          const fkey=`${pk.id}::${pid}`;
          const augIds=showAugList.map(e=>String(e.aug.id||'')).filter(Boolean);
          const selInFolder=augIds.filter(id=>Boolean(PWLIB.selAugIds?.[id])).length;
          const allInFolderSel=augIds.length>0&&selInFolder===augIds.length;
          const qAugHits=q?showAugList.filter(e=>itemMatchesQuery(e.aug)).length:0;
          const isFolderOpen=isNodeOpen(openAugFolders,fkey,Boolean(q&&qAugHits>0));
          augFolderHtml=`<div class="ml-3 sm:ml-6 pl-2.5 border-l-2 border-amber-500/45 space-y-1.5">
            <div class="flex flex-wrap items-center justify-between gap-1.5 rounded-lg border border-amber-500/35 bg-amber-500/10 px-2 py-1.5 min-w-0">
              <button type="button" data-action="pwlib-toggle-aug-folder" data-fkey="${esc(fkey)}" data-open="${isFolderOpen?'1':'0'}" class="flex flex-wrap items-center gap-1.5 min-w-0 flex-1 text-left text-xs font-extrabold text-amber-300 cursor-pointer">
                <span class="w-4 text-center shrink-0">${isFolderOpen?'▾':'▸'}</span>
                <span>📁 Vorgeschlagene Augmente (${showAugList.length})</span>
                ${selInFolder?`<span class="px-1.5 py-0.2 rounded text-[10px] font-black bg-acc-soft text-acc border bdr-acc tabular">${selInFolder}/${showAugList.length} gewählt</span>`:''}
                ${q&&qAugHits?`<span class="px-1.5 py-0.2 rounded text-[10px] font-black bg-amber-500/25 text-amber-200 border border-amber-400/50 tabular">🎯 ${qAugHits} Treffer</span>`:''}
              </button>
              <button type="button" data-action="pwlib-toggle-aug-folder-all" data-pack="${esc(pk.id)}" data-power="${esc(pid)}" data-tip="${allInFolderSel?'Alle Augmente in diesem Ordner abwählen':'Alle Augmente in diesem Ordner explizit anhaken'}" class="btn py-0.5 px-2 text-[10px] shrink-0 border-amber-400/45 text-amber-200">${allInFolderSel?'Alle abwählen':'Alle wählen'}</button>
            </div>
            ${isFolderOpen?`<div class="space-y-1.5 pt-0.5">${showAugList.map(e=>renderItemRow(e.aug,true,true,e.isCrossPack?`<span class="px-1.5 py-0.2 rounded text-[9px] font-bold bg-black/30 border bdr-line t-mut shrink-0">${esc(e.sourcePack?.name||'Augment-Paket')}</span>`:'')).filter(Boolean).join('')}</div>`:''}
          </div>`;
        }
        if(!pRow&&!augFolderHtml) return '';
        return `<div class="space-y-1.5">${pRow}${augFolderHtml}</div>`;
      };
      const visitedSec=new Set();
      const renderPackSec=(sec,depth=0)=>{
        const sid=String(sec.id||'');
        if(!sid||visitedSec.has(sid)) return '';
        visitedSec.add(sid);
        const secPws=pws.filter(p=>String(p.sectionId||'')===sid);
        const secFreeAugs=augs.filter(a=>(!a.parentPowerId||!pwIds.has(String(a.parentPowerId)))&&String(a.sectionId||'')===sid).filter(a=>(!fTier||itemMatchesTier(a))&&(!q||hits.metaHit||hits.secHit||itemMatchesQuery(a)));
        const childSecs=secs.filter(s=>String(s.parentSectionId||'')===sid);
        const pwHtml=secPws.map(renderPowerWithAugs).filter(Boolean).join('');
        const freeAugHtml=secFreeAugs.map(a=>renderItemRow(a,true,false)).filter(Boolean).join('');
        const childHtml=childSecs.map(cs=>renderPackSec(cs,depth+1)).filter(Boolean).join('');
        if((fTier||q)&&!pwHtml&&!freeAugHtml&&!childHtml) return '';
        const secChecked=Boolean(PWLIB.selSecIds?.[sid]);
        const rawSecFreeAugCnt=augs.filter(a=>(!a.parentPowerId||!pwIds.has(String(a.parentPowerId)))&&String(a.sectionId||'')===sid).length;
        const secCountLbl=secPws.length&&rawSecFreeAugCnt?`${secPws.length} ${secPws.length===1?'Kraft':'Kräfte'} • ${rawSecFreeAugCnt} Augm.`:(!secPws.length&&rawSecFreeAugCnt?`${rawSecFreeAugCnt} ${rawSecFreeAugCnt===1?'Augment':'Augmente'}`:`${secPws.length} ${secPws.length===1?'Kraft':'Kräfte'}`);
        return `<div class="subcard p-2.5 space-y-2 border bdr-acc/60 ${depth>0?'bg-black/20':''} min-w-0">
          <div class="flex flex-wrap items-center justify-between gap-2 min-w-0">
            <button type="button" data-action="pwlib-toggle-sel" data-kind="section" data-pack="${esc(pk.id)}" data-id="${esc(sid)}" class="flex items-center gap-2 min-w-0 flex-1 text-left">
              <span class="text-sm leading-none shrink-0 ${secChecked?'text-acc':'t-mut'}">${secChecked?'☑':'☐'}</span>
              <span class="font-extrabold text-xs sm:text-sm truncate">${depth>0?'↳ ':''}📁 ${esc(sec.name||'Sektion')}</span>
              <span class="pill cursor-default text-[10px] py-0.5 px-1.5 tabular shrink-0">${secCountLbl}</span>
            </button>
            <button type="button" data-action="pwlib-import-sec" data-pack="${esc(pk.id)}" data-sec="${esc(sid)}" data-tip="Diese Sektion inkl. Untersektionen, Kräften &amp; Augmenten importieren" class="btn bg-acc-soft bdr-acc text-acc py-1 px-2.5 text-[11px] shrink-0">📥 Ganze Sektion</button>
          </div>
          ${pwHtml?`<div class="space-y-1.5">${pwHtml}</div>`:''}
          ${freeAugHtml?`<div class="space-y-1.5">${freeAugHtml}</div>`:''}
          ${childHtml?`<div class="pl-2.5 sm:pl-4 border-l-2 bdr-acc space-y-2 pt-1">${childHtml}</div>`:''}
        </div>`;
      };
      const rootPackSecs=secs.filter(s=>!s.parentSectionId||!secIds.has(String(s.parentSectionId)));
      const secsHtml=rootPackSecs.map(s=>renderPackSec(s,0)).filter(Boolean).join('');
      const loosePws=pws.filter(p=>!p.sectionId||!secIds.has(String(p.sectionId)));
      const loosePwsHtml=loosePws.map(renderPowerWithAugs).filter(Boolean).join('');
      const looseAugs=augs.filter(a=>(!a.parentPowerId||!pwIds.has(String(a.parentPowerId)))&&(!a.sectionId||!secIds.has(String(a.sectionId)))).filter(a=>!q||hits.metaHit||itemMatchesQuery(a));
      const looseAugsHtml=looseAugs.map(a=>renderItemRow(a,true,false)).filter(Boolean).join('');
      detailHtml=`<div class="pt-2.5 border-t bdr-line space-y-3 min-w-0">
        ${renderPwLibImportOptsHtml()}
        <div class="flex flex-wrap items-center justify-between gap-2">
          <button type="button" data-action="pwlib-import-pack" data-id="${esc(pk.id)}" class="btn btn-pri py-1.5 px-3 text-xs">📥 Komplettes Paket importieren</button>
          <button type="button" data-action="pwlib-import-selected" data-id="${esc(pk.id)}" ${selTotal===0?'disabled':''} class="btn btn-ok py-1.5 px-3 text-xs">📥 Auswahl importieren${selTotal?` (${selTotal})`:''}</button>
        </div>
        <div data-pwlib-scroll="pk_${esc(pk.id)}" class="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
          ${secsHtml}
          ${loosePwsHtml?`<div class="space-y-1.5">${secs.length?`<div class="text-[11px] font-extrabold t-mut px-1">Kräfte ohne Sektion (${loosePws.length})</div>`:''}${loosePwsHtml}</div>`:''}
          ${looseAugsHtml?`<div class="space-y-1.5">${pws.length?`<div class="text-[11px] font-extrabold text-amber-400 px-1">Weitere Augmente (${looseAugs.length})</div>`:`<div class="text-[11px] font-extrabold text-amber-400 px-1">Augmente (${looseAugs.length})</div>`}${looseAugsHtml}</div>`:''}
          ${!secsHtml&&!loosePwsHtml&&!looseAugsHtml?`<div class="text-xs t-mut text-center py-4">Keine Einträge in diesem Paket für die gewählte Suche/Stufe.</div>`:''}
        </div>
      </div>`;
    }
    return `<div class="subcard p-2.5 sm:p-3 space-y-2 min-w-0 transition-colors ${isPackOpen?'border-2 bdr-acc bg-acc-soft/10':'hover:border-sky-400/45'}">
      <div role="button" tabindex="0" data-action="pwlib-select-pack" data-id="${esc(pk.id)}" data-open="${isPackOpen?'1':'0'}" class="flex flex-wrap items-start justify-between gap-2 cursor-pointer select-none min-w-0">
        <div class="flex items-start gap-2 min-w-0 flex-1">
          <span class="btn w-6 h-6 p-0 text-xs font-black shrink-0 mt-0.5">${isPackOpen?'▾':'▸'}</span>
          <div class="min-w-0 flex-1">
            <div class="flex flex-wrap items-center gap-1.5 min-w-0">
              <span class="font-black text-xs sm:text-sm break-words">${esc(pk.name)}</span>
              ${originBadge}
              ${pk.isBasisPack?`<span class="px-1.5 py-0.5 rounded text-[10px] font-black bg-amber-500/20 text-amber-300 border border-amber-400/45 shrink-0">⭐ Basisaktionen</span>`:''}
              <span class="px-1.5 py-0.5 rounded text-[10px] font-bold bg-black/25 border bdr-line t-mut shrink-0">${esc(pk.category||'Allgemein')}</span>
              ${selTotal?`<span class="px-1.5 py-0.5 rounded text-[10px] font-black bg-acc-soft text-acc border bdr-acc shrink-0 tabular">${selTotal} gewählt</span>`:''}
              ${q&&hits.itemHitCount?`<span class="px-1.5 py-0.5 rounded text-[10px] font-black bg-amber-500/20 text-amber-300 border border-amber-400/50 shrink-0 tabular">🎯 ${hits.itemHitCount} Treffer</span>`:''}
            </div>
            ${pk.description?`<p class="text-[11px] t-mut mt-0.5 break-words">${esc(pk.description)}</p>`:''}
          </div>
        </div>
        <div class="flex flex-wrap items-center gap-1.5 shrink-0 tabular">
          <span class="pill cursor-default text-[10px] py-0.5 px-2">${pws.length} ${pws.length===1?'Kraft':'Kräfte'} • ${augs.length} Augm.</span>
          ${pk.updatedAt?`<span class="text-[10px] t-mut hidden sm:inline">${esc(pk.updatedAt)}</span>`:''}
        </div>
      </div>
      ${detailHtml}
    </div>`;
  };

  return Array.from(catGroups.entries()).map(([cat,catPacks])=>{
    const catPwCnt=catPacks.reduce((s,p)=>s+(Array.isArray(p.powers)?p.powers.length:0),0);
    const catAugCnt=catPacks.reduce((s,p)=>s+(Array.isArray(p.augments)?p.augments.length:0),0);
    const catHitCnt=q?catPacks.reduce((s,p)=>s+calcPackHits(p).itemHitCount,0):0;
    const isCatOpen=isNodeOpen(openCats,cat,Boolean(q||fCat));
    return `<div class="rounded-xl border bdr-line bg-black/15 p-2 sm:p-2.5 space-y-2 min-w-0">
      <div role="button" tabindex="0" data-action="pwlib-toggle-cat" data-cat="${esc(cat)}" data-open="${isCatOpen?'1':'0'}" class="flex flex-wrap items-center justify-between gap-2 cursor-pointer select-none min-w-0 px-1 py-0.5 rounded-lg hover:bg-white/5 transition-colors">
        <div class="flex items-center gap-2 min-w-0 flex-1">
          <span class="btn w-6 h-6 p-0 text-xs font-black shrink-0">${isCatOpen?'▾':'▸'}</span>
          <span class="font-black text-xs sm:text-sm text-acc truncate">📂 ${esc(cat)}</span>
          <span class="text-[11px] t-mut tabular shrink-0">(${catPacks.length} ${catPacks.length===1?'Paket':'Pakete'})</span>
          ${q&&catHitCnt?`<span class="px-1.5 py-0.5 rounded text-[10px] font-black bg-amber-500/20 text-amber-300 border border-amber-400/50 shrink-0 tabular">🎯 ${catHitCnt} Treffer</span>`:''}
        </div>
        <div class="flex flex-wrap items-center gap-1.5 shrink-0 tabular">
          <span class="pill cursor-default text-[10px] py-0.5 px-2">${catPwCnt} ${catPwCnt===1?'Kraft':'Kräfte'} • ${catAugCnt} Augm.</span>
        </div>
      </div>
      ${isCatOpen?`<div class="space-y-2 pt-1">${catPacks.map(renderPackCard).join('')}</div>`:''}
    </div>`;
  }).join('');
}
function buildAdminDraftPack(){
  const srcVal=String(PWLIB.adminSrc||'all');
  const isSec=srcVal.startsWith('sec:');
  const secId=isSec?srcVal.slice(4):'';
  const isBasis=Boolean(PWLIB.adminIsBasis);
  const packOpts={
    mode:isSec?'section':'all',
    sectionId:secId,
    name:String(PWLIB.adminName||'').trim(),
    category:String(PWLIB.adminCat||'Allgemein').trim()||'Allgemein',
    description:String(PWLIB.adminDesc||'').trim(),
    isBasisPack:isBasis
  };
  if(isBasis) packOpts.packId='basisaktionen';
  return buildPowerExportPack(packOpts);
}

function getImgMenuContext(kindOverride,idOverride){
  const kind=String(kindOverride!==undefined?kindOverride:(UI.imgTargetKind||(UI.modal==='avatar'?'avatar':'')));
  const id=String(idOverride!==undefined?idOverride:(UI.imgTargetId||''));
  if(kind==='avatar'){
    return {kind,id:'',title:'🖼️ Charakterbild',subtitle:'Profilbild hochladen/ändern, per Drag &amp; Drop ersetzen, vergrößern oder entfernen.',url:S.profile.avatar||'',fileInputId:'fileAvatar',maxDim:240,quality:0.85,canEdit:true,caption:S.profile.name||'',isWide:false};
  }
  if(kind==='lobbyLogo'){
    return {kind,id:'',title:'🏰 Lobby-Bild',subtitle:CLOUD.isAdmin?'👑 Admin: Lobby-Logo für alle ändern, vergrößern oder entfernen.':'Aktuelles Lobby-Bild',url:CLOUD.registry?.lobbyLogo||'',fileInputId:'fileLobbyLogo',maxDim:256,quality:0.82,canEdit:Boolean(CLOUD.isAdmin),caption:'Scherbensturm – Lobby',isWide:false};
  }
  if(kind==='campImg'){
    const cid=id||CLOUD.activeCampaignId;
    const camp=getCampaigns().find(x=>x.id===cid);
    const canEd=Boolean(CLOUD.isAdmin||canManageCampaign(cid));
    return {kind,id:cid,title:`🗺️ Kampagnenbild${camp?.name?`: ${camp.name}`:''}`,subtitle:canEd?'Kampagnenbild hochladen/ändern, vergrößern oder entfernen (wird mit der Lobby synchronisiert).':'Aktuelles Kampagnenbild',url:camp?.img||'',fileInputId:'fileCampImg',maxDim:480,quality:0.82,canEdit:canEd,caption:camp?.name||'',isWide:false};
  }
  if(kind==='userAvatar'){
    const targetKey=findUserKeyByName(id||UI.profileUser||CLOUD.currentUser)||findUserKeyById(id||UI.profileUser||CLOUD.currentUser);
    if(!targetKey) return null;
    const canEdit=Boolean(targetKey&&canViewUserProfile(targetKey));
    return {kind,id:targetKey,title:'🖼️ Profilbild: '+targetKey,subtitle:canEdit?'Benutzer-Profilbild hochladen/ändern, per Drag &amp; Drop ersetzen, vergrößern oder entfernen (kompakt gespeichert).':'Aktuelles Benutzer-Profilbild',url:getUserAvatar(targetKey),fileInputId:'fileUserAvatar',maxDim:160,quality:0.80,canEdit,caption:targetKey,isWide:false};
  }
  if(['weapon','ammo','armor','inv'].includes(kind)){
    const k={weapon:'weapons',armor:'armors',ammo:'ammos',inv:'inventory'}[kind];
    const lbl={weapon:'Waffenbild',ammo:'Munitionsbild',armor:'Rüstungsbild',inv:'Inventarbild'}[kind];
    const it=(S[k]||[]).find(x=>x.id===id);
    if(!it) return null;
    return {kind,id,title:`🖼️ ${lbl}${it.name?`: ${it.name}`:''}`,subtitle:'Gegenstandsbild hochladen/ändern, in Großansicht öffnen oder entfernen.',url:it.img||'',fileInputId:'fileItemImg',maxDim:320,quality:0.82,canEdit:true,caption:it.name||lbl,isWide:false};
  }
  if(kind==='bio'){
    const im=id?(S.bioImages||[]).find(x=>x.id===id):null;
    return {kind,id:im?im.id:'',title:im?`🖼️ Aussehen-Bild${im.caption?`: ${im.caption}`:''}`:'🖼️ Aussehen-Bild importieren',subtitle:im?'Galeriebild ersetzen, in Großansicht ansehen oder entfernen (1:1 Ansicht).':'Neues Bild für die Aussehen-Galerie per Klick oder Drag &amp; Drop importieren.',url:im?.url||'',fileInputId:'fileBioImg',maxDim:720,quality:0.82,canEdit:true,caption:im?.caption||'',isWide:false};
  }
  if(kind==='bg'){
    const isLob=UI.inLobby||S.appearance.editScope==='lobby';
    const scLbl=isLob?'Lobby':(S.appearance.mode==='perTab'?(TABS.find(t=>t.id===S.appearance.editScope)?.l||'Reiter'):'Alle Reiter');
    return {kind,id:'',title:`🖼️ Hintergrundbild (${scLbl})`,subtitle:'Hintergrundbild hochladen/ändern, in Großansicht ansehen oder entfernen.',url:getEditStyleSlot().bg||'',fileInputId:'fileBg',maxDim:1400,quality:0.78,canEdit:true,caption:`Hintergrund (${scLbl})`,isWide:true};
  }
  return null;
}
function openImgMenu(kind,id='',returnModal=''){
  UI.imgTargetKind=String(kind||'');
  UI.imgTargetId=String(id||'');
  UI.imgReturnModal=String(returnModal||'');
  const ctx=getImgMenuContext();
  if(!ctx||(!ctx.canEdit&&!ctx.url)) return;
  UI.imgZoomOpen=!ctx.canEdit&&Boolean(ctx.url);
  UI.modal='imgMenu';
  renderModal();
}
function applyImgUrlForContext(ctx,url,fromDrop=false){
  if(!ctx||!ctx.canEdit||!url) return;
  const dSfx=fromDrop?' per Drag & Drop':'';
  if(ctx.kind==='avatar'){
    S.profile.avatar=url; renderHeader(); save(); toast(`Profilbild${dSfx} gespeichert`);
  }else if(ctx.kind==='lobbyLogo'){
    CLOUD.registry.lobbyLogo=url; saveRegistryLocal(); renderHeader(); renderMain(); syncCloudRegistry(true); toast(`🖼️ Lobby-Bild${dSfx} für alle aktualisiert!`);
  }else if(ctx.kind==='campImg'){
    const camp=getCampaigns().find(c=>c.id===(ctx.id||CLOUD.activeCampaignId));
    if(camp){camp.img=url; saveRegistryLocal(); renderMain(); syncCloudRegistry(true); toast(`🖼️ Kampagnenbild${dSfx} gespeichert!`);}
  }else if(ctx.kind==='userAvatar'){
    const key=findUserKeyByName(ctx.id)||findUserKeyById(ctx.id);
    if(!key||!canViewUserProfile(key)||!CLOUD.registry?.users?.[key]||CLOUD.registry.users[key]._deleted) return;
    CLOUD.registry.users[key].avatar=url;
    saveRegistryLocal();
    syncCloudRegistry(true);
    renderHeader();
    renderMain();
    renderModal();
    toast(`🖼️ Profilbild für „${key}“${dSfx} gespeichert!`);
    return;
  }else if(['weapon','ammo','armor','inv'].includes(ctx.kind)){
    const k={weapon:'weapons',armor:'armors',ammo:'ammos',inv:'inventory'}[ctx.kind], it=(S[k]||[]).find(x=>x.id===ctx.id);
    if(it){it.img=url; renderMain(); save(); toast(`Gegenstandsbild${dSfx} gespeichert`);}
  }else if(ctx.kind==='bio'){
    const ex=ctx.id?(S.bioImages||[]).find(x=>x.id===ctx.id):null;
    if(ex){ex.url=url; renderMain(); save(); toast(`Aussehen-Bild${dSfx} aktualisiert`);}
    else{const nid=uid(); S.bioImages.push({id:nid,url,caption:''}); UI.imgTargetId=nid; if(UI.tab5)UI.tab5.bioGallery=false; renderMain(); save(); toast(`Aussehen-Bild${dSfx} importiert`);}
  }else if(ctx.kind==='bg'){
    const applyBgFinal=(finalUrl,wasComp)=>{
      getEditStyleSlot().bg=finalUrl;
      applyTheme();
      persistCurrentThemeChange({scope:'auto'});
      if(!UI.inLobby) save();
      if(UI.modal==='imgMenu'||UI.modal==='avatar'||UI.modal==='settings'||UI.modal==='adminPanel') renderModal();
      if(wasComp) toast(`Hintergrund${dSfx} fürs Profil komprimiert & gespeichert`);
      else if(!CLOUD.currentUser||!isOversizedBgDataUrl(finalUrl)) toast(`Hintergrund${dSfx} gespeichert`);
    };
    if(CLOUD.currentUser&&isOversizedBgDataUrl(url)){
      compressBgDataUrlForProfile(url,THEME_BG_SYNC_LIMIT,(compUrl,wasComp)=>applyBgFinal(compUrl,wasComp));
    }else{
      applyBgFinal(url,false);
    }
    return;
  }
  if(UI.modal==='imgMenu'||UI.modal==='avatar'||UI.modal==='settings'||UI.modal==='adminPanel') renderModal();
}
function applyImgFileForCurrentTarget(file,fromDrop=false){
  const ctx=getImgMenuContext();
  if(!ctx||!ctx.canEdit) return;
  if(!file||!file.type.startsWith('image/')){toast('Bitte eine gültige Bilddatei auswählen oder hineinziehen.');return;}
  compressImg(file,ctx.maxDim,ctx.quality,url=>applyImgUrlForContext(ctx,url,fromDrop));
}
function removeImgForCurrentTarget(){
  const ctx=getImgMenuContext();
  if(!ctx||!ctx.canEdit||!ctx.url) return;
  if(ctx.kind==='avatar'){
    S.profile.avatar=''; renderHeader(); save(); toast('🗑️ Profilbild entfernt');
  }else if(ctx.kind==='lobbyLogo'){
    CLOUD.registry.lobbyLogo=''; saveRegistryLocal(); renderHeader(); renderMain(); syncCloudRegistry(true); toast('🗑️ Lobby-Bild entfernt.');
  }else if(ctx.kind==='campImg'){
    const camp=getCampaigns().find(c=>c.id===(ctx.id||CLOUD.activeCampaignId));
    if(camp){camp.img=''; saveRegistryLocal(); renderMain(); syncCloudRegistry(true); toast('🗑️ Kampagnenbild entfernt.');}
  }else if(ctx.kind==='userAvatar'){
    const key=findUserKeyByName(ctx.id)||findUserKeyById(ctx.id);
    if(key&&canViewUserProfile(key)&&CLOUD.registry?.users?.[key]&&!CLOUD.registry.users[key]._deleted){
      CLOUD.registry.users[key].avatar='';
      saveRegistryLocal();
      syncCloudRegistry(true);
      renderHeader();
      renderMain();
      toast('🗑️ Profilbild entfernt.');
    }
  }else if(['weapon','ammo','armor','inv'].includes(ctx.kind)){
    const k={weapon:'weapons',armor:'armors',ammo:'ammos',inv:'inventory'}[ctx.kind], it=(S[k]||[]).find(x=>x.id===ctx.id);
    if(it){it.img=''; renderMain(); save(); toast('🗑️ Gegenstandsbild entfernt.');}
  }else if(ctx.kind==='bio'){
    S.bioImages=S.bioImages.filter(im=>im.id!==ctx.id); renderMain(); save(); toast('🗑️ Aussehen-Bild entfernt.');
  }else if(ctx.kind==='bg'){
    getEditStyleSlot().bg='';
    applyTheme();
    persistCurrentThemeChange({scope:'auto',clearBgSlot:true});
    if(!UI.inLobby) save();
    toast('🗑️ Hintergrundbild entfernt.');
  }
  UI.imgTargetKind=''; UI.imgTargetId='';
  closeActiveModal();
}

function renderPatchnotesTabHtml(){
  const isAdm=Boolean(CLOUD.isAdmin);
  const entries=Array.isArray(PATCHNOTES.entries)?PATCHNOTES.entries:[];
  const edId=isAdm?PATCHNOTES.editingId:null;
  const d=(edId&&PATCHNOTES.draft)?PATCHNOTES.draft:{id:uid(),title:'',version:'',ts:stamp(),updatedAt:'',intro:'',items:[{id:uid(),heading:'',text:''}]};
  const dItems=Array.isArray(d.items)&&d.items.length?d.items:[{id:uid(),heading:'',text:''}];
  const editorHtml=(isAdm&&edId)?`<div class="subcard p-3.5 space-y-3 border-2 border-amber-400/70 bg-amber-500/10">
    <div class="flex flex-wrap items-center justify-between gap-2 border-b bdr-line pb-2">
      <div class="text-xs sm:text-sm font-black text-amber-300 flex items-center gap-1.5">
        <span>👑 ${edId==='__new__'?'Neuen Patchnotes-Eintrag erstellen':'Patchnotes-Eintrag bearbeiten'}</span>
      </div>
      <span class="text-[11px] t-mut">Fokus-stabiler Live-Entwurf</span>
    </div>
    <div class="grid grid-cols-1 sm:grid-cols-12 gap-2.5 text-xs">
      <div class="sm:col-span-6">
        <label class="font-bold t-mut block mb-1">Titel</label>
        <input type="text" data-pn-field="title" value="${esc(d.title||'')}" placeholder="z.B. Großes Kampagnen- &amp; UI-Update" class="inp w-full font-extrabold"/>
      </div>
      <div class="sm:col-span-2">
        <label class="font-bold t-mut block mb-1">Version (optional)</label>
        <input type="text" data-pn-field="version" value="${esc(d.version||'')}" placeholder="z.B. v2.4" class="inp w-full font-bold tabular"/>
      </div>
      <div class="sm:col-span-4">
        <label class="font-bold t-mut block mb-1">Zeitstempel</label>
        <div class="flex items-center gap-1.5">
          <input type="text" data-pn-field="ts" value="${esc(d.ts||stamp())}" placeholder="TT.MM.JJJJ, HH:MM" class="inp flex-1 min-w-0 font-semibold tabular"/>
          <button type="button" data-action="pn-set-now" data-tip="Aktuelles Datum &amp; Uhrzeit eintragen" class="btn py-1 px-2 text-xs shrink-0">🕒 Jetzt</button>
        </div>
      </div>
      <div class="sm:col-span-12">
        <label class="font-bold t-mut block mb-1">Kurze Einleitung (optional)</label>
        <textarea data-pn-field="intro" rows="2" placeholder="Kurze Zusammenfassung oder Kontext zum Update..." class="inp w-full resize-y">${esc(d.intro||'')}</textarea>
      </div>
    </div>
    <div class="space-y-2 pt-1">
      <div class="flex flex-wrap items-center justify-between gap-2">
        <label class="text-xs font-extrabold text-acc uppercase tracking-wider">Oberbegriffe &amp; Erklärungen (${dItems.length})</label>
        <button type="button" data-action="pn-item-add" class="btn bg-acc-soft bdr-acc text-acc py-1 px-2.5 text-xs font-extrabold">+ Oberbegriff hinzufügen</button>
      </div>
      <div class="space-y-2">
        ${dItems.map((it,idx)=>`<div class="subcard p-2.5 space-y-2 bg-black/25 border bdr-line">
          <div class="flex items-center justify-between gap-2">
            <div class="flex items-center gap-1.5 flex-1 min-w-0">
              <span class="px-1.5 py-0.5 rounded bg-acc-soft border bdr-acc text-acc font-black text-[10px] tabular shrink-0">#${idx+1}</span>
              <input type="text" data-pn-item="${idx}:heading" value="${esc(it.heading||'')}" placeholder="Oberbegriff (z.B. Würfelassistent, Neue Kräfte, Bugfixes)..." class="inp flex-1 min-w-0 font-extrabold text-xs"/>
            </div>
            <div class="flex items-center gap-1 shrink-0">
              <button type="button" data-action="pn-item-move" data-idx="${idx}" data-dir="-1" ${idx===0?'disabled':''} data-tip="Punkt nach oben verschieben" class="btn w-6 h-6 p-0 text-[10px]">▲</button>
              <button type="button" data-action="pn-item-move" data-idx="${idx}" data-dir="1" ${idx===dItems.length-1?'disabled':''} data-tip="Punkt nach unten verschieben" class="btn w-6 h-6 p-0 text-[10px]">▼</button>
              <button type="button" data-action="pn-item-del" data-idx="${idx}" data-tip="Punkt entfernen" class="btn btn-err w-6 h-6 p-0 text-[10px] font-black">✕</button>
            </div>
          </div>
          <div>
            <textarea data-pn-item="${idx}:text" rows="2" placeholder="Erklärung / Details zu diesem Oberbegriff..." class="inp w-full text-xs resize-y leading-relaxed">${esc(it.text||'')}</textarea>
          </div>
        </div>`).join('')}
      </div>
    </div>
    <div class="flex flex-wrap items-center justify-between gap-2 pt-2 border-t bdr-line">
      <button type="button" data-action="pn-item-add" class="btn py-1 px-2.5 text-xs">+ Oberbegriff hinzufügen</button>
      <div class="flex flex-wrap items-center gap-2">
        <button type="button" data-action="pn-cancel" ${PATCHNOTES.saving?'disabled':''} class="btn py-1.5 px-3 text-xs">Abbrechen</button>
        <button type="button" data-action="pn-save" ${PATCHNOTES.saving?'disabled':''} class="btn btn-ok py-1.5 px-3.5 text-xs font-black">${PATCHNOTES.saving?'⏳ Speichert...':'☁️ Auf Server speichern'}</button>
      </div>
    </div>
  </div>`:'';

  const sortOrder=PATCHNOTES.sortOrder==='asc'?'asc':'desc';
  const sortedEntries=getSortedPatchnoteEntries(entries,sortOrder);
  const newestId=getNewestPatchnoteId(entries);
  const anyCollapsed=sortedEntries.some(e=>isPatchnoteCollapsed(e,newestId,edId));
  const cardsHtml=sortedEntries.length?`<div class="space-y-3">${sortedEntries.map(e=>{
    const items=Array.isArray(e.items)?e.items.filter(it=>it&&(String(it.heading||'').trim()||String(it.text||'').trim())):[];
    const showUpd=Boolean(e.updatedAt&&e.updatedAt!==e.ts);
    const isDelAsk=isAdm&&PATCHNOTES.confirmDelId===e.id;
    const isCollapsed=isPatchnoteCollapsed(e,newestId,edId);
    return `<div class="subcard p-3.5 ${isCollapsed?'':'space-y-2.5'} border bdr-line hover:border-sky-500/40 transition-colors">
      <div class="flex flex-wrap items-start justify-between gap-2 ${isCollapsed?'':'border-b bdr-line pb-2'}">
        <button type="button" data-action="pn-toggle-collapse" data-id="${esc(e.id)}" aria-expanded="${isCollapsed?'false':'true'}" data-tip="${isCollapsed?'Patchnote ausklappen':'Patchnote einklappen'}" class="flex items-start gap-2 min-w-0 flex-1 text-left cursor-pointer group bg-transparent border-0 p-0">
          <span class="btn w-6 h-6 p-0 text-xs font-black shrink-0 mt-0.5 pointer-events-none">${isCollapsed?'▸':'▾'}</span>
          <div class="space-y-1 min-w-0 flex-1">
            <div class="flex flex-wrap items-center gap-2">
              ${e.version?`<span class="px-2 py-0.5 rounded-md bg-acc-soft border bdr-acc text-acc font-black text-xs tabular">${esc(e.version)}</span>`:''}
              <h4 class="text-sm sm:text-base font-black tracking-tight break-words group-hover:text-acc transition-colors">${esc(e.title||'Patchnotes')}</h4>
              ${items.length?`<span class="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-black/25 border bdr-line t-mut tabular shrink-0">${items.length} ${items.length===1?'Punkt':'Punkte'}</span>`:''}
            </div>
            <div class="flex flex-wrap items-center gap-2 text-[11px] t-mut tabular">
              <span>🕒 ${esc(e.ts||'')}</span>
              ${showUpd?`<span>• bearbeitet: ${esc(e.updatedAt)}</span>`:''}
            </div>
          </div>
        </button>
        ${isAdm?`<div class="flex flex-wrap items-center gap-1 shrink-0">
          <button type="button" data-action="pn-edit" data-id="${esc(e.id)}" class="btn py-1 px-2 text-xs font-bold">✎ Bearbeiten</button>
          ${isDelAsk
            ?`<span class="inline-flex items-center gap-1"><button type="button" data-action="pn-confirm-del" data-id="${esc(e.id)}" class="btn bg-rose-600 text-white border-rose-600 py-1 px-2 text-[11px] font-black">Löschen? (2/2)</button><button type="button" data-action="pn-cancel-del" class="btn py-1 px-1.5 text-[11px]">✕</button></span>`
            :`<button type="button" data-action="pn-ask-del" data-id="${esc(e.id)}" data-tip="Eintrag löschen (2-Stufen)" class="btn btn-err py-1 px-2 text-xs">🗑️</button>`}
        </div>`:''}
      </div>
      ${!isCollapsed?`${String(e.intro||'').trim()?`<p class="text-xs t-mut whitespace-pre-line leading-relaxed">${esc(e.intro)}</p>`:''}
      ${items.length?`<div class="space-y-2 pt-0.5">${items.map(it=>`<div class="p-2.5 rounded-lg bg-black/20 border bdr-line space-y-1">
        ${String(it.heading||'').trim()?`<div class="font-extrabold text-xs sm:text-sm text-acc break-words">${esc(it.heading)}</div>`:''}
        ${String(it.text||'').trim()?`<div class="text-xs leading-relaxed whitespace-pre-line break-words">${esc(it.text)}</div>`:''}
      </div>`).join('')}</div>`:''}`:''}
    </div>`;
  }).join('')}</div>`:`<div class="subcard border-dashed py-8 px-4 text-center text-xs t-mut">${PATCHNOTES.loading?'⏳ Patchnotes werden vom Server geladen...':'Noch keine Patchnotes hinterlegt.'}</div>`;

  return `<div class="space-y-3.5">
    <div class="flex flex-wrap items-center justify-between gap-2 pb-2 border-b bdr-line">
      <div class="flex flex-wrap items-center gap-2">
        <h3 class="text-sm sm:text-base font-black text-acc">📋 Patchnotes &amp; Änderungen</h3>
        <span class="pill cursor-default text-[10px] py-0.5 px-2 tabular">${entries.length} ${entries.length===1?'Eintrag':'Einträge'}</span>
        ${PATCHNOTES.lastLoadedTs?`<span class="text-[11px] t-mut tabular">Stand: ${esc(PATCHNOTES.lastLoadedTs)}</span>`:''}
      </div>
      <div class="flex flex-wrap items-center gap-1.5">
        <button type="button" data-action="pn-toggle-sort" data-tip="Sortierung nach Datum umschalten" class="btn py-1 px-2.5 text-xs font-bold">${sortOrder==='asc'?'↑ Älteste zuerst':'↓ Neueste zuerst'}</button>
        ${sortedEntries.length?`<button type="button" data-action="pn-toggle-all-collapse" data-tip="${anyCollapsed?'Alle Patchnotes ausklappen':'Alle Patchnotes einklappen'}" class="btn py-1 px-2.5 text-xs font-bold">${anyCollapsed?'▾ Alle ausklappen':'▸ Alle einklappen'}</button>`:''}
        <button type="button" data-action="pn-refresh" ${PATCHNOTES.loading?'disabled':''} class="btn py-1 px-2.5 text-xs font-bold">${PATCHNOTES.loading?'⏳ Lädt...':'🔄 Aktualisieren'}</button>
        ${isAdm?`<button type="button" data-action="pn-new" class="btn btn-pri py-1 px-2.5 text-xs font-extrabold">+ Neuer Eintrag</button>`:''}
      </div>
    </div>
    ${PATCHNOTES.error?`<div class="p-2.5 rounded-xl border border-amber-400/50 bg-amber-500/15 text-amber-200 text-xs font-semibold">${esc(PATCHNOTES.error)}</div>`:''}
    ${editorHtml}
    ${cardsHtml}
  </div>`;
}
function getActiveModalScrollKey(){
  if(!UI.modal) return '';
  return `${UI.modal}:${UI.modal==='adminPanel'?(CLOUD.isAdmin?'1':'0'):''}:${UI.infoTab||''}:${FEEDBACK.activeTab||''}:${PWLIB.tab||''}:${UI.listType||''}:${UI.profileUser||''}`;
}
function openAdminPanel(){
  closeCtxMenu();
  CLOUD.showAdminBar=false;
  UI.adminReturnModal='';
  UI.adminPinError='';
  UI.modal='adminPanel';
  renderModal(false,true);
  if(!CLOUD.isAdmin){
    setTimeout(()=>{const p=$('inpAdminMasterPin');if(p){p.focus();}},40);
  }
}
function renderAdminPanelModalHtml(){
  const mob=isMobileLayout();
  const hasHash=Boolean(CLOUD.registry?.adminHash);
  const isAdm=Boolean(CLOUD.isAdmin);
  const regUsers=Object.keys(CLOUD.registry?.users||{}).filter(k=>CLOUD.registry.users[k]&&!CLOUD.registry.users[k]._deleted).sort((a,b)=>a.localeCompare(b,'de'));
  const globalGms=Array.isArray(CLOUD.registry?.gmUsers)?[...new Set(CLOUD.registry.gmUsers.map(u=>String(u||'').trim()).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'de')):[];
  const allCamps=getCampaigns();
  const customIconCnt=Object.keys(CUSTOM_ICONS?.icons||{}).length;
  const fbItems=Array.isArray(FEEDBACK?.items)?FEEDBACK.items:[];
  const fbBacklog=Array.isArray(FEEDBACK?.backlog)?FEEDBACK.backlog:[];
  const logoUrl=String(CLOUD.registry?.lobbyLogo||'');
  const secAct=isSecretRollActive();
  const secRollCnt=Array.isArray(CLOUD.secretRolls)?CLOUD.secretRolls.length:0;

  const titleHtml=isAdm?'👑 Admin-Verwaltung':'👑 Admin-Anmeldung';
  const subHtml=isAdm
    ?'Zentrale Steuerung für Accounts, Spielleiter, Icons, Feedback, Lobby-Logo &amp; Sicherheit'
    :(hasHash?'Master-PIN eingeben, um die Admin-Verwaltung freizuschalten':'Ersteinrichtung: Neue Admin-Master-PIN für das Backend festlegen');

  let bodyHtml='';
  let footHtml='';

  if(!isAdm){
    bodyHtml=`<div class="max-w-md mx-auto py-2 sm:py-4 space-y-4">
      <div class="subcard p-4 sm:p-5 border-2 border-amber-400/50 bg-amber-500/10 space-y-3.5">
        <div class="flex items-start gap-3">
          <div class="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/50 flex items-center justify-center text-xl shrink-0">👑</div>
          <div class="min-w-0 flex-1">
            <div class="font-black text-sm text-amber-300">${hasHash?'Admin-Master-PIN erforderlich':'Ersteinrichtung der Admin-Master-PIN'}</div>
            <p class="text-xs t-mut mt-0.5 leading-relaxed">${hasHash?'Gib die im Backend hinterlegte Master-PIN ein. Nach erfolgreichem Login wechselt dieses Fenster direkt zur Admin-Verwaltung.':'Es ist noch keine Master-PIN im Backend gespeichert. Lege jetzt eine Master-PIN fest, um den Admin-Modus zu aktivieren.'}</p>
          </div>
        </div>
        <form id="formAdminUnlock" class="space-y-3">
          <div class="space-y-1">
            <label for="inpAdminMasterPin" class="block text-[11px] font-extrabold text-amber-300 uppercase tracking-wider">${hasHash?'Admin-Master-PIN':'Neue Admin-Master-PIN'}</label>
            <input id="inpAdminMasterPin" type="password" autocomplete="${hasHash?'current-password':'new-password'}" placeholder="${hasHash?'Admin-Master-PIN eingeben...':'Neue Admin-Master-PIN festlegen...'}" class="inp w-full py-2.5 px-3 text-sm font-bold border-amber-400/50"/>
          </div>
          ${UI.adminPinError?`<div role="alert" class="p-2.5 rounded-lg border border-rose-500/60 bg-rose-500/15 text-rose-200 text-xs font-bold flex items-center gap-2"><span>🔒</span><span>${esc(UI.adminPinError)}</span></div>`:''}
          <button type="submit" class="btn w-full bg-amber-500 text-slate-950 border-amber-400 font-black py-2.5 px-4 text-xs sm:text-sm shadow-lg">${hasHash?'🔓 Admin freischalten':'👑 Master-PIN speichern &amp; aktivieren'}</button>
        </form>
      </div>
      <div class="text-[11px] t-mut text-center leading-relaxed">Tipp: Mit <kbd class="px-1.5 py-0.5 rounded bg-black/30 border bdr-line font-mono text-[10px]">Enter</kbd> bestätigen${mob?' oder oben nach unten wischen zum Schließen.':'.'}</div>
    </div>`;
    footHtml=`<button type="button" data-action="close-modal" class="btn px-5">Schließen</button>`;
  }else{
    bodyHtml=`<div class="space-y-4">
      <!-- 1. Status & Sitzung -->
      <div class="subcard p-3.5 border-2 border-amber-400/50 bg-amber-500/10 space-y-2.5">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <div class="flex flex-wrap items-center gap-2 min-w-0">
            <span class="px-2.5 py-0.5 rounded-lg text-xs font-black bg-amber-500/25 text-amber-200 border border-amber-400/60">👑 ADMIN-MODUS AKTIV</span>
            <span class="text-[11px] t-mut">${hasHash?'Master-PIN im Backend hinterlegt':'Keine Master-PIN gesetzt'}</span>
          </div>
          <button type="button" data-action="admin-logout" class="btn btn-err py-1 px-3 text-xs font-extrabold">🔒 Admin sperren</button>
        </div>
        <div class="flex flex-wrap items-center gap-1.5 text-[11px]">
          <span class="pill cursor-default py-0.5 px-2 tabular">👥 ${regUsers.length} ${regUsers.length===1?'Account':'Accounts'}</span>
          <span class="pill cursor-default py-0.5 px-2 tabular">🎲 ${globalGms.length} Spielleiter</span>
          <span class="pill cursor-default py-0.5 px-2 tabular">🗺️ ${allCamps.length} ${allCamps.length===1?'Kampagne':'Kampagnen'}</span>
          <span class="pill cursor-default py-0.5 px-2 tabular">🎨 ${customIconCnt}/${SYSTEM_ICON_DEFS.length} Icons</span>
          <span class="pill cursor-default py-0.5 px-2 tabular">💬 ${fbItems.length} offenes Feedback</span>
        </div>
        <p class="text-[11px] text-amber-200/90 leading-relaxed">Du kannst alle Kampagnen verwalten, Spieler zuordnen sowie Charakter-Besitzer und Kampagnen-Zugehörigkeiten jederzeit ändern.</p>
      </div>

      <!-- 2. Zentrale Admin-Werkzeuge -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
        <!-- Standard-Icons -->
        <div class="subcard p-3.5 space-y-2.5 flex flex-col justify-between">
          <div class="space-y-1">
            <div class="flex items-center justify-between gap-2">
              <span class="text-xs sm:text-sm font-black text-acc">🎨 Standard-Icons</span>
              <span class="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-acc-soft border bdr-acc text-acc tabular">${customIconCnt}/${SYSTEM_ICON_DEFS.length} aktiv</span>
            </div>
            <p class="text-[11px] t-mut leading-snug">Globale Icons für Ebbephase, Flutphase &amp; alle Statuseffekte zentral auf dem Server verwalten.</p>
          </div>
          <button type="button" data-action="open-admin-icons" class="btn btn-pri w-full py-1.5 px-3 text-xs font-extrabold">🎨 Standard-Icons verwalten</button>
        </div>

        <!-- Feedback-Ablage -->
        <div class="subcard p-3.5 space-y-2.5 flex flex-col justify-between">
          <div class="space-y-1">
            <div class="flex items-center justify-between gap-2">
              <span class="text-xs sm:text-sm font-black text-acc">💬 Feedback-Ablage</span>
              <span class="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-acc-soft border bdr-acc text-acc tabular">${fbItems.length} offen • ${fbBacklog.length} Log</span>
            </div>
            <p class="text-[11px] t-mut leading-snug">Admin-Posteingang, Ordner, Mini-Chats und Benutzer-Backlogs verwalten.</p>
          </div>
          <div class="flex flex-wrap items-center gap-1.5">
            <button type="button" data-action="open-feedback" class="btn btn-pri flex-1 py-1.5 px-3 text-xs font-extrabold">📥 Posteingang öffnen</button>
            <button type="button" data-action="open-fbadmin-win" data-tip="Feedback-Ablage als schwebendes Extrafenster öffnen" class="btn bdr-acc bg-acc-soft text-acc py-1.5 px-2.5 text-xs font-extrabold">🪟 Extrafenster</button>
          </div>
        </div>

        <!-- Lobby-Logo -->
        <div class="subcard p-3.5 space-y-2.5 flex flex-col justify-between">
          <div class="flex items-center gap-3 min-w-0">
            <div class="w-11 h-11 rounded-xl overflow-hidden border-2 bdr-acc bg-acc-soft flex items-center justify-center text-xl shrink-0 shadow">${logoUrl?`<img src="${logoUrl}" class="w-full h-full object-cover" alt=""/>`:'🏰'}</div>
            <div class="min-w-0 flex-1">
              <div class="text-xs sm:text-sm font-black text-acc">🏰 Lobby-Logo</div>
              <p class="text-[11px] t-mut leading-snug">${logoUrl?'Benutzerdefiniertes Lobby-Bild aktiv (für alle sichtbar).':'Standard-Symbol aktiv – eigenes Bild hochladen.'}</p>
            </div>
          </div>
          <button type="button" data-action="pick-lobby-logo" class="btn bdr-acc bg-acc-soft text-acc w-full py-1.5 px-3 text-xs font-extrabold">🖼️ Lobby-Logo ändern / verwalten</button>
        </div>

        <!-- Geheimwurf-Modus -->
        <div class="subcard p-3.5 space-y-2.5 flex flex-col justify-between ${secAct?'border-amber-400/70 bg-amber-500/10':''}">
          <div class="space-y-1">
            <div class="flex items-center justify-between gap-2">
              <span class="text-xs sm:text-sm font-black ${secAct?'text-amber-300':'text-acc'}">🕵️ Geheimwurf-Modus</span>
              <span class="px-2 py-0.5 rounded-full text-[10px] font-black border ${secAct?'border-amber-400 bg-amber-500/25 text-amber-200':'bdr-line bg-black/25 t-mut'}">${secAct?'AKTIV (Privat)':'Öffentlich'}</span>
            </div>
            <p class="text-[11px] t-mut leading-snug">Admin-Würfe privat speichern statt im Live-Feed zu posten (${secRollCnt} gespeicherte ${secRollCnt===1?'Geheimwurf':'Geheimwürfe'}).</p>
          </div>
          <button type="button" data-action="toggle-dice-secret" class="btn w-full py-1.5 px-3 text-xs font-black ${secAct?'bg-amber-500 text-slate-950 border-amber-300':'bdr-acc bg-acc-soft text-acc'}">${secAct?'🕵️ Geheimwurf: AN (auf Öffentlich schalten)':'👁️ Öffentlich (auf Geheimwurf schalten)'}</button>
        </div>
      </div>

      <!-- 3. Benutzerverwaltung & Globale Spielleiter -->
      <div class="subcard p-3.5 space-y-3">
        <div class="flex flex-wrap items-center justify-between gap-2 border-b bdr-line pb-2">
          <div>
            <div class="text-xs sm:text-sm font-black text-amber-300">👥 Benutzerverwaltung &amp; Globale Spielleiter</div>
            <div class="text-[11px] t-mut">Profile einsehen, Spielleiter-Status vergeben, Passwörter auf <code class="font-mono">1234</code> zurücksetzen oder Accounts entfernen.</div>
          </div>
          <span class="pill cursor-default text-[11px] py-0.5 px-2.5 tabular">${regUsers.length} Accounts</span>
        </div>

        <div class="p-2.5 rounded-lg bg-purple-500/10 border border-purple-400/35 space-y-1.5">
          <div class="text-[11px] font-extrabold text-purple-200">🎲 Globale Spielleiter (${globalGms.length}):</div>
          ${globalGms.length?`<div class="flex flex-wrap gap-1.5">${globalGms.map(g=>`<span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-purple-500/25 border border-purple-400/50 text-purple-100 text-xs font-bold"><span>🎲 ${esc(g)}</span><button type="button" data-action="admin-toggle-gm" data-user="${esc(g)}" data-tip="Spielleiter-Status von „${esc(g)}“ entfernen" class="text-rose-300 hover:text-rose-200 font-black">✕</button></span>`).join('')}</div>`:`<div class="text-[11px] t-mut">Derzeit keine globalen Spielleiter ernannt. Vergib den Status unten bei einem Account.</div>`}
        </div>

        ${regUsers.length?`<div class="space-y-1.5 max-h-72 overflow-y-auto pr-0.5" data-scroll-key="adminUsersList">${regUsers.map(u=>{
          const av=getUserAvatar(u);
          const gm=isGlobalGM(u);
          return `<div class="p-2 rounded-xl bg-black/25 border bdr-line flex flex-wrap items-center justify-between gap-2 text-xs">
            <button type="button" data-action="open-user-profile" data-user="${esc(u)}" data-tip="Benutzerprofil, User-ID &amp; Namenshistorie von „${esc(u)}“ öffnen" class="font-extrabold text-amber-200 hover:text-acc hover:underline cursor-pointer inline-flex items-center gap-1.5 min-w-0">
              ${av?`<img src="${av}" class="w-6 h-6 rounded-full object-cover shrink-0 border border-amber-400/40" alt=""/>`:`<span class="w-6 h-6 rounded-full bg-amber-500/20 border border-amber-400/35 inline-flex items-center justify-center text-xs shrink-0">👤</span>`}
              <span class="truncate">${esc(u)}</span>
            </button>
            <div class="flex flex-wrap items-center gap-1.5 shrink-0">
              <button type="button" data-action="admin-toggle-gm" data-user="${esc(u)}" data-tip="Spielleiter-Status für „${esc(u)}“ umschalten (nur durch Admin)" class="btn py-0.5 px-2 text-[11px] font-black ${gm?'border-purple-400/70 bg-purple-500/30 text-purple-200':'opacity-85 hover:text-purple-300'}">${gm?'🎲 Spielleiter ✓':'+ Spielleiter'}</button>
              <button type="button" data-action="admin-reset-user-pw" data-user="${esc(u)}" data-tip="Passwort für „${esc(u)}“ auf 1234 zurücksetzen" class="btn py-0.5 px-2 text-[11px] border-amber-400/40 text-amber-300">PW→1234</button>
              <button type="button" data-action="admin-del-user" data-user="${esc(u)}" data-tip="Account „${esc(u)}“ dauerhaft löschen" class="btn btn-err py-0.5 px-2 text-[11px] font-black">✕</button>
            </div>
          </div>`;
        }).join('')}</div>`:`<div class="text-xs t-mut text-center py-3">Noch keine Spieler-Accounts registriert.</div>`}
      </div>

      <!-- 4. Admin-Master-PIN ändern -->
      <div class="subcard p-3.5 space-y-2.5">
        <div class="text-xs sm:text-sm font-extrabold text-amber-300">🔑 Admin-Master-PIN ändern</div>
        <form id="formAdminChangePin" class="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <input id="inpNewAdminPin" type="password" autocomplete="new-password" placeholder="Neue Master-PIN eingeben..." class="inp flex-1 min-w-0 py-2 px-3 text-xs sm:text-sm font-bold"/>
          <button type="submit" class="btn py-2 px-4 text-xs font-extrabold border-amber-400/60 bg-amber-500/15 text-amber-200 shrink-0">Master-PIN ändern</button>
        </form>
      </div>
    </div>`;
    footHtml=`<button type="button" data-action="admin-logout" class="btn btn-err mr-auto">🔒 Admin sperren</button><button type="button" data-action="close-modal" class="btn btn-pri px-5">Schließen</button>`;
  }

  const swipeStripHtml=mob?'<div class="admin-swipe-strip" aria-hidden="true"><div class="ctx-sheet-handle" style="margin:0 auto"></div></div>':'';
  return `<div data-action="close-modal-bg" class="modal-backdrop"><div id="adminPanelModal" class="card modal-panel admin-modal-panel max-w-3xl p-0 shadow-2xl">${swipeStripHtml}<div class="modal-hdr ${mob?'admin-swipe-hdr':''} z-10 flex items-start sm:items-center justify-between gap-2 px-3.5 sm:px-5 pb-3 sm:pb-3.5 border-b bdr-line shrink-0" style="background:var(--surf2)"><div class="min-w-0 flex-1"><h2 class="text-base sm:text-lg font-extrabold break-words">${titleHtml}</h2><p class="text-xs t-mut break-words">${subHtml}</p></div><div class="flex flex-wrap items-center justify-end gap-1.5 shrink-0"><button type="button" data-action="close-modal" aria-label="Schließen" class="btn min-w-[36px] min-h-[36px] sm:min-w-0 sm:min-h-0 py-1 px-2.5 font-black shrink-0">✕</button></div></div><div class="modal-body p-3.5 sm:p-5 space-y-4 text-xs sm:text-sm min-w-0">${bodyHtml}</div><div class="modal-foot z-10 px-3.5 sm:px-5 pt-3 border-t bdr-line flex flex-wrap items-center justify-end gap-2 shrink-0" style="background:var(--surf2)">${footHtml}</div></div></div>`;
}
function renderModal(fromRenderAll=false,resetScroll=false){
  hideTooltip();
  cleanupModalSwipe();
  const m=$('modalMount');
  syncBodyScrollLock();
  if(!UI.modal){
    if(m){m.innerHTML=''; m.dataset.lastModalKey='';}
    if(UI.inLobby&&!fromRenderAll){renderHeader();renderMain();}
    return;
  }
  const nextKey=getActiveModalScrollKey();
  const sameModalCtx=!resetScroll&&Boolean(m&&m.childElementCount>0&&m.dataset.lastModalKey&&m.dataset.lastModalKey===nextKey);
  const snap=sameModalCtx?captureScrollState(m):{winX:window.scrollX,winY:window.scrollY,rootTop:0,rootLeft:0,byKey:new Map(),yList:[],xList:[],anyScrolled:[]};
  renderModalBody(m,fromRenderAll);
  if(m){
    m.dataset.lastModalKey=UI.modal?getActiveModalScrollKey():'';
    if(sameModalCtx&&UI.modal){
      restoreScrollState(m,snap);
    }else{
      const mb=m.querySelector('.modal-body');
      if(mb){mb.scrollTop=0; mb.scrollLeft=0;}
      if(window.scrollY!==snap.winY||window.scrollX!==snap.winX){
        window.scrollTo(snap.winX,snap.winY);
      }
    }
    if(UI.modal==='adminPanel'&&isMobileLayout()){
      const adminPanelEl=m.querySelector('#adminPanelModal');
      if(adminPanelEl){
        setModalSwipeCleanup(bindSwipeDownClose(adminPanelEl,'.admin-swipe-strip, .admin-swipe-hdr',()=>closeActiveModal()));
      }
    }
  }
}
function renderAdminIconsModalHtml(){
  if(!CLOUD.isAdmin){
    const lockBody=`<div class="subcard p-6 border-2 border-rose-500/40 bg-rose-500/10 text-center space-y-2">
      <div class="text-2xl">🔒</div>
      <div class="text-sm font-black text-rose-300">Zugriff verweigert – Die Verwaltung globaler Standard-Icons ist strikt dem Admin vorbehalten.</div>
    </div>`;
    const lockFoot=`<button type="button" data-action="close-modal" class="btn btn-pri">Schließen</button>`;
    return modalShell('👑 Standard-Icons verwalten','Globale Icons für Phasen &amp; Statuseffekte zentral auf dem Server hinterlegen – gilt automatisch für alle Spieler.',lockBody,lockFoot,'max-w-4xl');
  }
  const iconsMap=CUSTOM_ICONS?.icons||{};
  const totalSlots=SYSTEM_ICON_DEFS.length;
  const customCount=SYSTEM_ICON_DEFS.filter(d=>Boolean(iconsMap[d.key])).length;
  const phaseDefs=SYSTEM_ICON_DEFS.filter(d=>d.group==='phase');
  const statusDefs=SYSTEM_ICON_DEFS.filter(d=>d.group==='status');
  const busy=Boolean(CUSTOM_ICONS.loading||CUSTOM_ICONS.saving);
  const renderTile=def=>{
    const hasCustom=Boolean(iconsMap[def.key]);
    const stDef=def.statusKey?STATUS_DEFS.find(x=>x.k===def.statusKey):null;
    const grpCol=stDef?(S.attrColors?.[stDef.group]||'#38bdf8'):(def.key==='phase_flut'?'#38bdf8':'#818cf8');
    const pillCls=def.group==='phase'
      ?(def.key==='phase_flut'?'bg-gradient-to-r from-cyan-500 to-sky-500 text-slate-950 border-cyan-300 font-black':'bg-gradient-to-r from-indigo-600 to-slate-700 text-white border-indigo-400 font-black')
      :(stDef?.isPos?'bg-emerald-500/20 text-emerald-200 border-emerald-500/45 font-bold':'bg-rose-500/20 text-rose-200 border-rose-500/45 font-bold');
    const statusBadge=hasCustom
      ?`<span class="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-400/50">✨ Custom aktiv</span>`
      :`<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/5 t-mut border bdr-line">Standard</span>`;
    const posNegBadge=stDef
      ?(stDef.isPos
        ?`<span class="px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-emerald-500/15 text-emerald-300 border border-emerald-500/35">Positiv</span>`
        :`<span class="px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-rose-500/15 text-rose-300 border border-rose-500/35">Negativ</span>`)
      :'';
    const attrTags=stDef
      ?stDef.attrs.map(ak=>`<span class="px-1.5 py-0.5 rounded text-[9px] font-black border" style="color:${esc(grpCol)};border-color:color-mix(in srgb,${esc(grpCol)} 45%,transparent);background:color-mix(in srgb,${esc(grpCol)} 14%,transparent)">${ak}</span>`).join('')
      :'';
    return `<div data-admin-icon-drop="${esc(def.key)}" class="subcard p-3 flex items-start gap-3 border transition-all ${hasCustom?'border-amber-400/50 bg-amber-500/5':'bdr-line'}" style="border-left:4px solid ${esc(grpCol)}">
      <div class="flex flex-col items-center gap-1.5 shrink-0">
        <div class="w-14 h-14 rounded-xl border bdr-line bg-black/35 flex items-center justify-center shadow-inner overflow-hidden" style="background-image:linear-gradient(45deg,rgba(255,255,255,.05) 25%,transparent 25%,transparent 75%,rgba(255,255,255,.05) 75%),linear-gradient(45deg,rgba(255,255,255,.05) 25%,transparent 25%,transparent 75%,rgba(255,255,255,.05) 75%);background-size:12px 12px;background-position:0 0,6px 6px">
          ${renderSystemIconHtml(def.key,'w-10 h-10')}
        </div>
        <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg border text-[10px] leading-none max-w-[116px] truncate ${pillCls}" data-tip="Vorschau in Originalgröße (16×16 px)">
          ${renderSystemIconHtml(def.key,'w-4 h-4')}
          <span class="truncate">${esc(def.label)}</span>
        </span>
      </div>
      <div class="min-w-0 flex-1 space-y-2">
        <div class="flex flex-wrap items-center justify-between gap-1.5">
          <div class="flex flex-wrap items-center gap-1.5 min-w-0">
            <span class="font-black text-sm truncate">${esc(def.label)}</span>
            ${posNegBadge}
            ${attrTags}
          </div>
          ${statusBadge}
        </div>
        <div class="text-[10px] t-mut font-mono truncate opacity-75">Key: ${esc(def.key)}</div>
        <div class="flex flex-wrap items-center gap-1.5 pt-0.5">
          <button type="button" data-action="admin-icon-pick" data-ikey="${esc(def.key)}" ${busy?'disabled':''} class="btn btn-pri py-1 px-2.5 text-xs font-extrabold">📁 Bild hochladen</button>
          ${hasCustom?`<button type="button" data-action="admin-icon-reset" data-ikey="${esc(def.key)}" ${busy?'disabled':''} data-tip="Custom-Icon entfernen und Standard-SVG wiederherstellen" class="btn btn-err py-1 px-2.5 text-xs font-bold">↺ Standard</button>`:''}
        </div>
      </div>
    </div>`;
  };
  const body=`<div class="space-y-4">
    <div class="subcard p-3 space-y-2.5 border bdr-acc/50 bg-black/20">
      <div class="flex flex-wrap items-center justify-between gap-2">
        <div class="flex flex-wrap items-center gap-2">
          <span class="pill cursor-default text-xs py-1 px-2.5 border-amber-400/60 bg-amber-500/15 text-amber-200 font-black tabular">🎨 ${customCount} / ${totalSlots} Custom-Icons aktiv</span>
          ${CUSTOM_ICONS.lastLoadedTs?`<span class="text-[11px] t-mut tabular">Stand: ${esc(CUSTOM_ICONS.lastLoadedTs)}</span>`:''}
          ${CUSTOM_ICONS.saving?`<span class="text-xs font-extrabold text-amber-300 animate-pulse">⏳ Speichert auf Server...</span>`:CUSTOM_ICONS.loading?`<span class="text-xs font-extrabold text-sky-300 animate-pulse">⏳ Lädt vom Server...</span>`:''}
        </div>
        <div class="flex flex-wrap items-center gap-1.5">
          <button type="button" data-action="admin-icons-refresh" ${busy?'disabled':''} class="btn py-1 px-2.5 text-xs font-bold">🔄 Vom Server laden</button>
          ${customCount>0?(UI.confirmResetAllIcons
            ?`<span class="inline-flex items-center gap-1"><button type="button" data-action="admin-icons-confirm-reset-all" ${busy?'disabled':''} class="btn bg-rose-600 text-white border-rose-600 py-1 px-2.5 text-xs font-black">Alle auf Standard? (2/2)</button><button type="button" data-action="admin-icons-cancel-reset-all" class="btn py-1 px-2 text-xs">✕</button></span>`
            :`<button type="button" data-action="admin-icons-ask-reset-all" ${busy?'disabled':''} class="btn btn-err py-1 px-2.5 text-xs font-bold">↺ Alle zurücksetzen</button>`
          ):''}
        </div>
      </div>
      <p class="text-[11px] t-mut leading-relaxed">Empfohlen: Quadratische PNG-, WebP- oder SVG-Icons mit transparentem Hintergrund (werden automatisch kompakt auf 128×128 px skaliert und auf dem Server gespeichert). Bilder können direkt auf eine Kachel gezogen werden.</p>
      ${CUSTOM_ICONS.error?`<div class="p-2 rounded-lg border border-amber-400/50 bg-amber-500/10 text-amber-200 text-xs font-semibold">⚠️ ${esc(CUSTOM_ICONS.error)}</div>`:''}
    </div>
    <section class="space-y-2.5">
      <div class="flex items-center justify-between gap-2 border-b bdr-line pb-1.5">
        <h4 class="text-xs sm:text-sm font-black text-acc uppercase tracking-wider">🌊 Kampfphasen (${phaseDefs.length})</h4>
        <span class="text-[11px] t-mut">Header &amp; Phasen-Umschalter</span>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-3">${phaseDefs.map(renderTile).join('')}</div>
    </section>
    <section class="space-y-2.5">
      <div class="flex items-center justify-between gap-2 border-b bdr-line pb-1.5">
        <h4 class="text-xs sm:text-sm font-black text-acc uppercase tracking-wider">⚡ Statuseffekte (${statusDefs.length})</h4>
        <span class="text-[11px] t-mut">Attributbogen &amp; Status-Karten</span>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-3">${statusDefs.map(renderTile).join('')}</div>
    </section>
  </div>`;
  const backBtn=UI.adminReturnModal==='adminPanel'?`<button type="button" data-action="admin-return-panel" class="btn mr-auto">← Zurück zum Admin-Fenster</button>`:'';
  const foot=`${backBtn}<button type="button" data-action="close-modal" class="btn btn-pri">${UI.adminReturnModal==='adminPanel'?'Zurück':'Schließen'}</button>`;
  return modalShell('👑 Standard-Icons verwalten','Globale Icons für Phasen &amp; Statuseffekte zentral auf dem Server hinterlegen – gilt automatisch für alle Spieler.',body,foot,'max-w-4xl');
}
function renderModalBody(m,fromRenderAll=false){
  if(UI.modal==='adminPanel'){
    m.innerHTML=renderAdminPanelModalHtml();
    return;
  }
  if(UI.modal==='adminIcons'){
    if(!CLOUD.isAdmin){
      UI.modal=null;
      UI.confirmResetAllIcons=false;
      m.innerHTML='';
      if(UI.inLobby&&!fromRenderAll){renderHeader();renderMain();}
      return;
    }
    m.innerHTML=renderAdminIconsModalHtml();
    return;
  }
  if(UI.modal==='userProfile'){
    if(ensureAllRegistryUsers()) saveRegistryLocal();
    const rawTarget=String(UI.profileUser||'').trim();
    const targetKey=findUserKeyByName(rawTarget)||findUserKeyById(rawTarget);
    if(!targetKey||!canViewUserProfile(targetKey)||!CLOUD.registry?.users?.[targetKey]||CLOUD.registry.users[targetKey]._deleted){
      UI.modal=null;
      UI.profileUser='';
      m.innerHTML='';
      if(UI.inLobby&&!fromRenderAll){renderHeader();renderMain();}
      return;
    }
    UI.profileUser=targetKey;
    const rec=CLOUD.registry.users[targetKey];
    const isSelf=Boolean(CLOUD.currentUser&&CLOUD.currentUser.trim().toLowerCase()===targetKey.toLowerCase());
    const isGm=isGlobalGM(targetKey);
    const isTargetAdmin=Boolean(CLOUD.isAdmin===true&&isSelf);
    const targetLow=targetKey.toLowerCase();
    const delSet=new Set(Array.isArray(CLOUD.registry?.deletedCharIds)?CLOUD.registry.deletedCharIds:[]);
    const ownedCharIds=new Set();
    Object.entries(CLOUD.registry?.claims||{}).forEach(([cid,own])=>{
      if(cid&&!delSet.has(cid)&&String(own||'').trim().toLowerCase()===targetLow) ownedCharIds.add(cid);
    });
    (CLOUD.list||[]).forEach(ch=>{
      if(ch&&ch.id&&!delSet.has(ch.id)&&String(getCharOwner(ch.id)||ch.owner||'').trim().toLowerCase()===targetLow) ownedCharIds.add(ch.id);
    });
    const ownCharCnt=ownedCharIds.size;
    const avatarUrl=String(rec.avatar||'');
    const createdAt=String(rec.createdAt||'').trim();
    const userIdVal=String(rec.userId||'').trim();
    let adminHistoryHtml='';
    if(CLOUD.isAdmin===true){
      const rawHist=Array.isArray(rec.nameHistory)?rec.nameHistory:[];
      const hist=[...rawHist].reverse().sort((a,b)=>toInt(b.atMs,0)-toInt(a.atMs,0));
      adminHistoryHtml=`<div class="subcard p-3.5 space-y-2.5 border border-amber-400/50 bg-amber-500/10">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <div class="text-xs sm:text-sm font-black text-amber-300 flex items-center gap-1.5"><span>📜 Namenshistorie</span><span class="px-1.5 py-0.5 rounded text-[10px] font-black bg-amber-500/20 border border-amber-400/40">👑 Nur Admin</span></div>
          <span class="text-[11px] t-mut tabular">${hist.length} ${hist.length===1?'Wechsel':'Wechsel'}</span>
        </div>
        ${hist.length?`<div class="space-y-1.5 max-h-52 overflow-y-auto pr-1">${hist.map(h=>`<div class="p-2 rounded-lg bg-black/25 border bdr-line flex flex-wrap items-center justify-between gap-2 text-xs">
          <div class="flex flex-wrap items-center gap-1.5 font-bold min-w-0">
            <span class="t-mut line-through break-all">${esc(h.from||'—')}</span>
            <span class="text-amber-400 font-black">→</span>
            <span class="text-emerald-300 font-black break-all">${esc(h.to||'—')}</span>
          </div>
          <span class="text-[11px] t-mut tabular shrink-0">🕒 ${esc(h.at||'—')}</span>
        </div>`).join('')}</div>`:`<div class="text-xs t-mut italic py-1">Noch keine Namensänderungen protokolliert.</div>`}
      </div>`;
    }
    const pwOrAdminSecHtml=isSelf?`<div class="subcard p-3.5 space-y-2.5">
        <div class="text-xs sm:text-sm font-extrabold text-acc">🔑 Passwort ändern</div>
        <div class="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
          <div class="sm:col-span-5"><input id="inpProfileNewPass" type="password" autocomplete="new-password" placeholder="Neues Passwort..." class="inp w-full text-xs font-bold py-2"/></div>
          <div class="sm:col-span-5"><input id="inpProfileNewPass2" type="password" autocomplete="new-password" placeholder="Passwort wiederholen..." class="inp w-full text-xs font-bold py-2"/></div>
          <div class="sm:col-span-2"><button type="button" data-action="profile-save-pw" class="btn btn-ok w-full py-2 text-xs font-extrabold">💾 Speichern</button></div>
        </div>
      </div>`:(CLOUD.isAdmin===true?`<div class="subcard p-3.5 space-y-2.5 border border-amber-400/45 bg-amber-500/10">
        <div class="text-xs sm:text-sm font-extrabold text-amber-300">👑 Admin-Aktionen für „${esc(targetKey)}“</div>
        <div class="flex flex-wrap items-center gap-2">
          <button type="button" data-action="admin-toggle-gm" data-user="${esc(targetKey)}" class="btn py-1.5 px-3 text-xs font-extrabold ${isGm?'border-purple-400/70 bg-purple-500/25 text-purple-200':'bdr-line'}">${isGm?'🎲 Spielleiter entfernen':'🎲 Zum Spielleiter ernennen'}</button>
          <button type="button" data-action="admin-reset-user-pw" data-user="${esc(targetKey)}" class="btn py-1.5 px-3 text-xs font-extrabold border-amber-400/60 bg-amber-500/15 text-amber-200">🔑 Passwort auf 1234 zurücksetzen</button>
        </div>
      </div>`:'');
    m.innerHTML=modalShell(`👤 Benutzerprofil: ${esc(targetKey)}`,isSelf?'Dein persönlicher Account – Name, Passwort &amp; User-ID':'👑 Admin-Profilansicht &amp; Account-Verwaltung',
      `<div class="space-y-4">
        <div class="subcard p-4 border-2 bdr-acc bg-acc-soft/20 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div class="flex flex-col items-center gap-1.5 shrink-0">
            <button type="button" data-action="open-user-avatar" data-user="${esc(targetKey)}" data-tip="Profilbild ansehen / ändern" class="w-20 h-20 rounded-2xl overflow-hidden border-2 bdr-acc bg-black/30 flex flex-col items-center justify-center shrink-0 shadow-lg cursor-pointer hover:brightness-110 transition-all">
              ${avatarUrl?`<img src="${avatarUrl}" class="w-full h-full object-cover" alt="${esc(targetKey)}"/>`:`<span class="text-2xl leading-none">👤</span><span class="text-[10px] font-extrabold text-acc mt-1">Profilbild</span>`}
            </button>
            ${canViewUserProfile(targetKey)?`<button type="button" data-action="open-user-avatar" data-user="${esc(targetKey)}" class="btn py-0.5 px-2 text-[11px] font-bold whitespace-nowrap">🖼️ Profilbild ändern</button>`:``}
          </div>
          <div class="min-w-0 flex-1 space-y-2">
            <div class="flex flex-wrap items-center gap-2">
              <span class="text-lg sm:text-xl font-black tracking-tight break-all">${esc(targetKey)}</span>
              ${isGm?`<span class="px-2 py-0.5 rounded-md text-[11px] font-black bg-purple-500/25 text-purple-200 border border-purple-400/50">🎲 Spielleiter</span>`:''}
              ${isTargetAdmin?`<span class="px-2 py-0.5 rounded-md text-[11px] font-black bg-amber-500/25 text-amber-300 border border-amber-400/50">👑 Admin</span>`:(!isSelf&&CLOUD.isAdmin===true?`<span class="px-2 py-0.5 rounded-md text-[11px] font-black bg-amber-500/20 text-amber-300 border border-amber-400/45">👑 Admin-Ansicht</span>`:'')}
            </div>
            <div class="flex flex-wrap items-center gap-1.5 text-[11px]">
              <span class="pill cursor-default py-0.5 px-2.5 tabular">${ownCharCnt} eigene ${ownCharCnt===1?'Charakter':'Charaktere'}</span>
              <span class="pill cursor-default py-0.5 px-2.5 tabular">${createdAt?`Registriert seit ${esc(createdAt)}`:'Registrierter Account'}</span>
            </div>
            <div class="pt-1 flex flex-wrap items-center gap-2 text-xs">
              <span class="text-[11px] font-extrabold t-mut uppercase tracking-wider">User-ID:</span>
              <code class="px-2 py-0.5 rounded-md bg-black/35 border bdr-line font-mono text-[11px] sm:text-xs text-acc select-all break-all">${esc(userIdVal||'—')}</code>
              <button type="button" data-action="copy-user-id" data-uid="${esc(userIdVal)}" class="btn py-0.5 px-2.5 text-[11px] font-extrabold">📋 Kopieren</button>
            </div>
          </div>
        </div>

        <div class="subcard p-3.5 space-y-2.5">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <div class="text-xs sm:text-sm font-extrabold text-acc">✏️ Benutzernamen ändern</div>
            <span class="text-[11px] t-mut">Alle Charaktere, Kampagnen &amp; Beiträge werden automatisch mitgenommen.</span>
          </div>
          <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <input id="inpProfileNewName" type="text" maxlength="40" value="${esc(targetKey)}" placeholder="Neuer Benutzername..." class="inp flex-1 min-w-0 text-sm font-bold py-2 px-3"/>
            <button type="button" data-action="profile-rename-user" class="btn btn-pri py-2 px-4 text-xs font-extrabold shrink-0">✏️ Namen ändern</button>
          </div>
        </div>

        ${pwOrAdminSecHtml}
        ${adminHistoryHtml}
      </div>`,
      `${UI.adminReturnModal==='adminPanel'?`<button type="button" data-action="admin-return-panel" class="btn mr-auto">← Zurück zum Admin-Fenster</button>`:''}<button type="button" data-action="close-modal" class="btn btn-pri px-6">${UI.adminReturnModal==='adminPanel'?'Zurück':'Schließen'}</button>`,'max-w-xl');
    return;
  }
  if(UI.modal==='imgMenu'||UI.modal==='avatar'){
    const ctx=getImgMenuContext();
    if(!ctx){UI.modal=null; m.innerHTML=''; return;}
    const hasImg=Boolean(ctx.url);
    if(UI.imgZoomOpen&&hasImg){
      m.innerHTML=modalShell(ctx.title,ctx.caption?esc(ctx.caption):'Großansicht',
        `<div class="flex flex-col items-center justify-center gap-2"><img src="${ctx.url}" style="max-height:68vh;max-height:68dvh" class="w-auto max-w-full rounded-xl object-contain border bdr-line bg-black/30 shadow-2xl"/></div>`,
        `${ctx.canEdit?`<button type="button" data-action="img-menu-zoom-close" class="btn mr-auto">← Zurück zum Menü</button>`:''}<button type="button" data-action="close-modal" class="btn btn-pri px-6">Schließen</button>`,'max-w-3xl');
      return;
    }
    const prevCls=ctx.isWide?'w-full max-w-[280px] h-32':'w-32 h-32';
    m.innerHTML=modalShell(ctx.title,ctx.subtitle,
      `<div class="space-y-3">
        ${ctx.canEdit?`<div id="imgDropZone" data-action="img-menu-upload" class="subcard border-2 border-dashed bdr-acc bg-acc-soft/40 hover:bg-acc-soft transition-colors cursor-pointer p-5 flex flex-col items-center justify-center gap-3 text-center">
          <div class="${prevCls} rounded-2xl overflow-hidden border-2 bdr-acc bg-black/25 flex items-center justify-center shadow-lg">
            ${hasImg?`<img src="${ctx.url}" class="w-full h-full object-cover"/>`:`<span class="text-xs font-black text-acc px-2">KEIN BILD<br/>GESETZT</span>`}
          </div>
          <div class="space-y-1">
            <div class="text-sm font-extrabold text-acc">Bilddatei hierher ziehen (Drag &amp; Drop)</div>
            <div class="text-xs t-mut">oder klicken, um eine Bilddatei auszuwählen (JPG, PNG, WebP)</div>
          </div>
        </div>`:`<div class="subcard p-5 flex flex-col items-center justify-center gap-3"><div class="${prevCls} rounded-2xl overflow-hidden border-2 bdr-acc bg-black/25 flex items-center justify-center shadow-lg"><img src="${ctx.url}" class="w-full h-full object-cover"/></div></div>`}
        <div class="flex flex-wrap items-center justify-center gap-2">
          ${ctx.canEdit?`<button type="button" data-action="img-menu-upload" class="btn btn-pri py-1.5 px-4 text-xs">${hasImg?'📁 Bild ändern':'📁 Bild hochladen'}</button>`:''}
          ${hasImg?`<button type="button" data-action="img-menu-zoom" class="btn bdr-acc bg-acc-soft text-acc py-1.5 px-4 text-xs">🔍 Großansicht öffnen</button>`:''}
        </div>
      </div>`,
      `${ctx.canEdit&&hasImg?`<button type="button" data-action="img-menu-remove" class="btn btn-err mr-auto">🗑️ Bild entfernen</button>`:''}<button type="button" data-action="close-modal" class="btn px-5">${UI.imgReturnModal==='adminPanel'?'← Zurück zum Admin-Fenster':(UI.imgReturnModal?'Zurück':'Schließen')}</button>`,'max-w-md');
    return;
  }
  if(UI.modal==='dupPwName'&&UI.dupPwWarn){
    const w=UI.dupPwWarn;
    m.innerHTML=modalShell('⚠️ Name bereits vergeben','Globale Namens-Eindeutigkeit für Kräfte & Augmente',
      `<div class="subcard space-y-2.5 border-2 border-rose-500/60 bg-rose-500/15">
        <p class="font-extrabold text-rose-300 text-sm">⚠️ Der Name „${esc(w.name)}“ existiert bereits (als ${esc(w.dupKind)}). Bitte wähle einen eindeutigen Namen!</p>
        <p class="text-xs t-mut">Weder zwei Kräfte noch zwei Augmente noch eine Kraft und ein Augment dürfen denselben Namen tragen. Der Name wurde auf <strong>${w.revertedTo?`„${esc(w.revertedTo)}“`:'leer'}</strong> zurückgesetzt.</p>
      </div>`,
      `<button id="btnDupPwOk" type="button" data-action="close-modal" class="btn btn-pri px-5 font-black">Verstanden – Namen anpassen</button>`,'max-w-md');
    setTimeout(()=>$('btnDupPwOk')?.focus(),20);
    return;
  }
  if(UI.modal==='resetHz'){
    const s2=UI.confirmHzStep===2;
    m.innerHTML=modalShell('⚠️ Trefferzonen auf Standard zurücksetzen','Doppelte Sicherheitsabfrage',
      `<div class="subcard space-y-2 border-amber-500/40 bg-amber-500/10">
        <p class="font-extrabold text-amber-400">${s2?'Schritt 2/2: Bist du dir absolut sicher?':'Schritt 1/2: Standard-Trefferzonen wiederherstellen?'}</p>
        <p class="text-xs t-mut">Dadurch werden alle eigenen Zonen sowie eingetragene Rüstungswerte und Notizen in der Trefferzonen-Tabelle durch die 6 Standard-Trefferzonen (Kopf, Rumpf, Arme, Beine) überschrieben.</p>
      </div>`,
      `<button type="button" data-action="close-modal" class="btn">Abbrechen</button>${s2?`<button type="button" data-action="confirm-reset-hz-2" class="btn bg-rose-600 text-white border-rose-600 font-black px-5">Ja, endgültig auf Standard zurücksetzen! (2/2)</button>`:`<button type="button" data-action="confirm-reset-hz-1" class="btn bg-amber-500 text-slate-950 border-amber-400 font-black px-5">Ja, Standard wiederherstellen (1/2)</button>`}`,'max-w-md');
    return;
  }
  if(UI.modal==='ammoList'){
    const w=UI.ammoModalWeaponId?S.weapons.find(x=>x.id===UI.ammoModalWeaponId):null;
    m.innerHTML=modalShell('🎯 Munitions-Liste verwalten',w?`Für Fernkampfwaffe: ${w.name||'Unbenannte Fernkampfwaffe'}`:'Alle Munitionsarten des Charakters (live synchron mit dem Ausrüstungs-Reiter)',
      `<form id="formAddAmmoModal" class="subcard space-y-2 border-amber-500/40">
        <div class="text-xs font-extrabold text-amber-400">Neue Munition zur Liste hinzufügen</div>
        <div class="grid grid-cols-1 sm:grid-cols-12 gap-2 items-end">
          <div class="sm:col-span-5"><label class="block text-[10px] font-bold t-mut mb-0.5">Benennung (Name)</label><input id="inpAmmoModalName" type="text" placeholder="z.B. Jagdpfeile, Stahlbolzen..." class="inp w-full font-bold"/></div>
          <div class="sm:col-span-2"><label class="block text-[10px] font-bold t-mut mb-0.5">Anzahl</label><input id="inpAmmoModalQty" type="text" inputmode="numeric" value="20" class="inp w-full text-center font-black tabular"/></div>
          <div class="sm:col-span-1"><label class="block text-[10px] font-bold t-mut mb-0.5 text-center" data-tip="Schnittschaden">Schn.</label><input id="inpAmmoModalCut" type="text" value="0" class="inp w-full text-center font-bold px-1"/></div>
          <div class="sm:col-span-1"><label class="block text-[10px] font-bold t-mut mb-0.5 text-center" data-tip="Durchstoßschaden">Durch.</label><input id="inpAmmoModalPierce" type="text" value="0" class="inp w-full text-center font-bold px-1"/></div>
          <div class="sm:col-span-1"><label class="block text-[10px] font-bold t-mut mb-0.5 text-center" data-tip="Einschlagschaden">Eins.</label><input id="inpAmmoModalImpact" type="text" value="0" class="inp w-full text-center font-bold px-1"/></div>
          <div class="sm:col-span-2"><button type="submit" class="btn btn-ok w-full">+ Anlegen</button></div>
        </div>
      </form>
      <div class="space-y-2 max-h-80 overflow-y-auto pr-1">
        ${S.ammos.length?S.ammos.map(am=>{
          const isSel=w&&w.ammoId===am.id;
          return `<div class="subcard p-2.5 flex flex-wrap items-center justify-between gap-2 text-xs ${isSel?'border-amber-400 bg-amber-500/10':''}">
            <div class="flex items-center gap-2 flex-1 min-w-0 w-full sm:w-auto sm:min-w-[160px]">
              <input data-amf="${am.id}:name" type="text" value="${esc(am.name)}" placeholder="Munitionsname..." class="inp-line font-extrabold flex-1 min-w-0"/>
            </div>
            <div class="flex flex-wrap items-center gap-2 tabular">
              <span class="text-[11px] t-mut">Anzahl:</span>
              <button type="button" data-action="ammo-step" data-id="${am.id}" data-delta="-1" class="btn w-6 h-6 p-0">−</button>
              <input data-amf="${am.id}:qty" type="text" inputmode="numeric" value="${esc(am.qty)}" class="inp w-14 text-center font-black py-0.5 px-1 text-xs text-amber-300"/>
              <button type="button" data-action="ammo-step" data-id="${am.id}" data-delta="1" class="btn w-6 h-6 p-0">+</button>
              <span data-ammo-modal-dmg="${am.id}" class="px-2 py-0.5 rounded bg-black/20 border bdr-line text-[11px]">Schnitt ${esc(am.dmgCut)} • Durchstoß ${esc(am.dmgPierce)} • Einschlag ${esc(am.dmgImpact)}${fmtCustomValSummarySuffix(am.customDmg)}</span>
              ${w?`<button type="button" data-action="select-ammo-for-wp" data-wid="${w.id}" data-aid="${am.id}" class="btn py-0.5 px-2.5 text-[11px] ${isSel?'btn-ok':'border-amber-400/50 text-amber-300'}">${isSel?'✓ Ausgewählt':'Auswählen'}</button>`:''}
              <button type="button" data-action="del-ammo" data-id="${am.id}" class="text-rose-400 font-black px-1">✕</button>
            </div>
          </div>`;
        }).join(''):`<div class="text-xs t-mut py-4 text-center">Noch keine Munition in der Liste. Füge oben eine neue Munitionsart mit Name &amp; Anzahl hinzu.</div>`}
      </div>`,
      `<button type="button" data-action="close-modal" class="btn btn-pri px-6">Fertig</button>`,'max-w-2xl');
    return;
  }
  if(UI.modal==='color'){
    const isAttr=UI.colTarget==='attr', isPw=UI.colTarget==='pw', isSecF=UI.colTarget==='sec-folder', isSkSecF=UI.colTarget==='sksec-folder', isInvSecF=UI.colTarget==='invsec-folder', isSk=UI.colTarget==='sk-item', isEq=UI.colTarget==='eq', isEqSec=UI.colTarget==='eqsec', isChrSec=UI.colTarget==='chrsec', isCamp=UI.colTarget==='camp';
    const hasDual=DUAL_COL_TARGETS.has(UI.colTarget), isBg=hasDual&&UI.colMode==='bg', col=isHex(UI.colDraft)?UI.colDraft:'#38bdf8';
    const eqSecNames={weapons:'Kategorie: Waffen',ammos:'Kategorie: Munition',armors:'Kategorie: Rüstungen',inventory:'Kategorie: Inventar'};
    const chrSecNames={training:'Fenster: Training',skills:'Fenster: Fertigkeiten',powers:'Fenster: Kräfte & Augmente'};
    const pwIt=getColTargetObj();
    const baseName=isAttr?(ATTR_GROUPS.find(g=>g.k===UI.attrGroupSel)?.l||''):isPw?(pwIt?.name||(UI.colPwKind==='augment'?'Augment':'Kraft')):(isSecF||isSkSecF)?(pwIt?.name||'Sektion'):isInvSecF?(pwIt?.name||'Beutel / Sektion'):isSk?(pwIt?.name||'Fertigkeit'):isEq?(pwIt?.name||({weapon:'Waffe',ammo:'Munition',armor:'Rüstung',inv:'Gegenstand'}[UI.colPwKind]||'Eintrag')):isEqSec?(eqSecNames[UI.colPwId]||'Kategorie'):isChrSec?(chrSecNames[UI.colPwId]||'Chronik-Fenster'):isCamp?`Kampagne: ${pwIt?.name||'Kampagne'}`:(UI.colTarget==='cres'?cresName():String(UI.colTarget||'').startsWith('ex_')?getResLabel(UI.colTarget):SEC_META[UI.colTarget]);
    const lbl=hasDual?`${baseName} • ${isBg?'Fensterfarbe (Hintergrund)':'Textfarbe (Name)'}`:baseName;
    const prevStyle=isBg?`background:color-mix(in srgb,${esc(col)} 38%,var(--surf));border-color:color-mix(in srgb,${esc(col)} 75%,var(--bdr))`:`border-color:color-mix(in srgb,${esc(col)} 55%,var(--bdr))`;
    const prevTxtStyle=isBg?(pwIt?.color?`color:${esc(pwIt.color)}`:''):`color:${esc(col)}`;
    m.innerHTML=modalShell('🎨 Farbe anpassen',lbl,
      `${isAttr?`<div class="grid grid-cols-2 gap-1.5">${ATTR_GROUPS.map(g=>`<button type="button" data-action="sel-attr-grp" data-grp="${g.k}" class="btn text-xs ${UI.attrGroupSel===g.k?'btn-pri':''}"><span class="w-3 h-3 rounded-full" style="background:${S.attrColors[g.k]}"></span>${g.l}</button>`).join('')}</div>`:''}
      ${hasDual?`<div class="grid grid-cols-2 gap-1.5"><button type="button" data-action="switch-col-mode" data-cmode="text" class="btn text-xs ${!isBg?'btn-pri':''}">🎨 Textfarbe (Name)</button><button type="button" data-action="switch-col-mode" data-cmode="bg" class="btn text-xs ${isBg?'btn-pri':''}">🪟 Fensterfarbe (Kasten)</button></div>`:''}
      <div id="colPrevBox" class="subcard flex items-center justify-between px-3.5 py-2.5" style="${prevStyle}"><span id="colPrevTxt" class="font-extrabold text-sm" style="${prevTxtStyle}">${esc(baseName)}</span><span class="font-mono text-xs t-mut" id="colPrevHex">${esc(col.toUpperCase())}</span></div>
      <div class="grid grid-cols-9 gap-2">${COL_PRESETS.map(c=>`<button type="button" data-action="col-preset" data-col="${c}" data-tip="${c==='#ffffff'?'Weiß (#FFFFFF)':c==='#000000'?'Schwarz (#000000)':c.toUpperCase()}" class="h-7 rounded-lg border-2 ${col.toLowerCase()===c.toLowerCase()?'border-sky-400 ring-2 ring-sky-400':'border-slate-500/45'}" style="background:${c}"></button>`).join('')}</div>
      <div class="flex items-center gap-2.5"><input id="colPickerInp" type="color" value="${esc(col)}" class="w-11 h-10 shrink-0"/><input id="colHexInp" type="text" maxlength="7" value="${esc(col.toUpperCase())}" class="inp flex-1 font-mono font-extrabold uppercase"/></div>`,
      `<button type="button" data-action="reset-col" class="btn mr-auto">↺ Standard</button><button type="button" data-action="close-modal" class="btn">Abbrechen</button><button type="button" data-action="save-col" class="btn btn-pri px-5">Speichern</button>`,'max-w-md');
    return;
  }
  if(UI.modal==='list'){
    const lt=UI.listType;
    if(lt==='weaponTags'||lt==='armorTags'||lt==='ammoTags'){
      const tagMeta={
        weaponTags:['Waffeneigenschaften (Tags)',S.weaponTagList,'Neue Eigenschaft, z.B. Scharfkantig (X)...'],
        armorTags:['Rüstungs-Tags',S.armorTagList,'Neuer Rüstungs-Tag, z.B. Gefüttert (X)...'],
        ammoTags:['Munitions-Tags',S.ammoTagList,'Neuer Munitions-Tag, z.B. Widerhaken (X)...']
      }[lt];
      m.innerHTML=modalShell(`⚙️ ${tagMeta[0]}`,'Alphabetisch sortiert. Nutze (X) im Namen für einen variablen Zahlenwert auf dem Gegenstand.',
        `<form id="formAddListItem" class="subcard space-y-2">
          <div class="grid grid-cols-1 sm:grid-cols-12 gap-2">
            <input id="inpListItem" type="text" placeholder="${tagMeta[2]}" class="inp sm:col-span-5 font-bold"/>
            <input id="inpListDesc" type="text" placeholder="Tooltip-Erklärung (z.B. Verursacht +X Schaden...)" class="inp sm:col-span-5"/>
            <button type="submit" class="btn btn-ok sm:col-span-2">+ Tag</button>
          </div>
        </form>
        <div class="space-y-1.5 max-h-80 overflow-y-auto pr-1">${tagMeta[1].length?tagMeta[1].map(t=>`<div data-tip="${esc(t.name+(t.desc?'\n'+t.desc:''))}" class="subcard py-1.5 px-3 flex items-start justify-between gap-2 text-xs cursor-help"><div><span class="font-extrabold text-acc">${esc(t.name)}</span>${t.desc?`<p class="text-[11px] t-mut mt-0.5">${esc(t.desc)}</p>`:''}</div><button type="button" data-action="del-list-item" data-val="${esc(t.name)}" class="text-rose-400 font-black shrink-0">✕</button></div>`).join(''):`<div class="text-xs t-mut py-4 text-center">Liste ist noch leer – füge oben eigene Tags hinzu.</div>`}</div>`,
        `${lt==='weaponTags'?`<button type="button" data-action="reset-list" class="btn mr-auto">↺ Standardliste (${DEF_WEAPON_TAGS.length} Eigenschaften)</button>`:lt==='armorTags'?`<button type="button" data-action="reset-list" class="btn mr-auto">↺ Standardliste (${DEF_ARMOR_TAGS.length} Tags)</button>`:(tagMeta[1].length?`<button type="button" data-action="reset-list" class="btn mr-auto">Liste leeren</button>`:'')}<button type="button" data-action="close-modal" class="btn btn-pri px-5">Fertig</button>`,'max-w-2xl');
      return;
    }
    const normLt=(lt==='subcat'||lt==='pwTag')?'pwTag':lt;
    const meta={pwTag:['Tags (Kräfte & Augmente)',S.pwTagList||DEF_PW_TAGS,'Neues Tag (z.B. Fernkampf, Ritual)…'],useRes:['Einsatzkosten-Ressourcen',S.useResList,'Eigene Ressource...'],customStats:['Eigene Baukasten-Variablen',S.customStats,'Neue Variable (z.B. Tragkraft)...']}[normLt]||{pwTag:['Tags (Kräfte & Augmente)',S.pwTagList||DEF_PW_TAGS,'Neues Tag…']}.pwTag;
    const quickPools=normLt==='useRes'?`<div class="space-y-1"><span class="text-[11px] font-bold t-mut">Charakterbogen-Pools schnell hinzufügen:</span><div class="flex flex-wrap gap-1.5">${['ap','map','lp','mlp','cres',...(S.extraSecList||[]).map(x=>'ex_'+x.id),'bst'].map(pk=>`<button type="button" data-action="quick-add-res" data-val="${pk}" ${S.useResList.includes(pk)?'disabled':''} class="btn py-1 px-2 text-xs">+ ${esc(getResLabel(pk))}</button>`).join('')}</div></div>`:'';
    const subNote=normLt==='pwTag'?'Hauptaktionsarten &amp; Aktionsunterarten sind fest vorgegeben und können nicht als Tag angelegt werden.':'Änderungen werden im Charakterbogen gespeichert und mit exportiert.';
    m.innerHTML=modalShell(`⚙️ ${meta[0]}`,subNote,
      `${quickPools}<form id="formAddListItem" class="flex gap-2"><input id="inpListItem" type="text" placeholder="${meta[2]}" class="inp flex-1"/><button type="submit" class="btn btn-ok">+ Hinzufügen</button></form>
      <div class="flex flex-wrap gap-1.5">${meta[1].length?meta[1].map(item=>{const iTip=normLt==='pwTag'?getPwTermTip(item):'';return `<span ${iTip?`data-tip="${esc(iTip)}"`:''} class="subcard py-1.5 px-2.5 inline-flex items-center gap-2 text-xs font-bold ${iTip?'cursor-help':''}"><span>${esc(normLt==='useRes'?getResLabel(item):item)}</span><button type="button" data-action="del-list-item" data-val="${esc(item)}" class="text-rose-400 font-black">✕</button></span>`;}).join(''):`<span class="text-xs t-mut">Liste ist leer.</span>`}</div>`,
      `${normLt!=='customStats'?`<button type="button" data-action="reset-list" class="btn mr-auto">↺ Standardliste</button>`:''}<button type="button" data-action="close-modal" class="btn btn-pri px-5">Fertig</button>`,'max-w-lg');
    return;
  }
  if(UI.modal==='settings'){
    const isLobbyScope=UI.inLobby||S.appearance.editScope==='lobby', isPer=!isLobbyScope&&S.appearance.mode==='perTab', tgt=getEditStyleSlot(), scopeLbl=isLobbyScope?'🏠 Lobby (Persönlich)':(isPer?(TABS.find(t=>t.id===S.appearance.editScope)?.l||''):'Global');
    const d=UI.palDraft||{}, activeCp=(S.customPalettes||[]).find(p=>p.id===tgt.palette);
    const colFields=[
      ['bg','Hintergrund',d.bg||'#020617'],
      ['acc','Primär-Akzent',d.acc||'#0ea5e9'],
      ['acc2','Sekundär-Akzent',d.acc2||'#6366f1'],
      ['txt','Haupttext',d.txt||'#f1f5f9'],
      ['mut','Sekundärtext',d.mut||'#94a3b8'],
      ['btnTxt','Button-Text',d.btnTxt||'#ffffff']
    ];
    m.innerHTML=modalShell('⚙️ Optionen, Datei &amp; Design','Kompletter Export &amp; Import inkl. eigenen Farbpaletten, Listen, Box-Größen &amp; Bildern.',
      `${CLOUD.isAdmin===true?`<div class="subcard p-2.5 border-amber-400/50 bg-amber-500/10 flex flex-wrap items-center justify-between gap-2">
      <div class="text-xs font-extrabold text-amber-200">👑 Admin-Verwaltung (Server)</div>
      <button type="button" data-action="open-admin-icons" data-tip="Globale Standard-Icons für Ebbephase, Flutphase &amp; alle Statuseffekte zentral auf dem Server verwalten" class="btn py-1 px-3 text-xs font-extrabold border-amber-400/60 bg-amber-500/20 text-amber-200">👑 🎨 Standard-Icons verwalten (Server)</button>
    </div>`:''}
    <div class="subcard space-y-2.5"><h3 class="text-xs font-extrabold text-acc">1. EXPORT, IMPORT &amp; RESET</h3><div class="flex flex-wrap items-center gap-2"><button type="button" data-action="export-json" class="btn btn-pri">⬇ Charakter exportieren (.json)</button><button type="button" data-action="import-json" class="btn">⬆ Charakter importieren (.json)</button>${UI.confirmNew?`<div class="flex gap-1.5 ml-auto"><button type="button" data-action="new-sheet-yes" class="btn bg-rose-600 text-white">Alles leeren!</button><button type="button" data-action="new-sheet-no" class="btn">Abbrechen</button></div>`:`<button type="button" data-action="new-sheet-ask" class="btn btn-err ml-auto">Neuer Charakterbogen</button>`}</div></div>
      <div class="subcard space-y-3"><div class="flex flex-wrap items-center justify-between gap-2"><div class="flex flex-wrap items-center gap-2"><h3 class="text-xs font-extrabold text-acc">2. MODUS &amp; REITER-DESIGN</h3><span class="px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${CLOUD.currentUser?'bdr-acc bg-acc-soft text-acc':'bdr-line bg-black/20 t-mut'}">${CLOUD.currentUser?`☁️ Profilgebunden (${esc(CLOUD.currentUser)})`:'💾 Gast-Modus (lokal)'}</span></div><button type="button" data-action="toggle-dark" class="btn">🌓 ${S.appearance.dark?'Dunkles Design':'Helles Design'}</button></div>${isLobbyScope
      ?`<div class="pt-2 border-t bdr-line flex flex-wrap items-center justify-between gap-2 text-xs"><span class="text-acc font-extrabold">🏠 Eigenes Farbschema für deine Lobby${CLOUD.currentUser?` (${esc(CLOUD.currentUser)})`:''} – unabhängig von deinen Charakter-Reitern.</span>${!UI.inLobby?`<button type="button" data-action="edit-scope" data-scope="${esc(S.activeTab||'attributes')}" class="btn py-1 px-2.5 text-[11px]">← Charakter-Reiter bearbeiten</button>`:''}</div>`
      :`<div class="flex flex-wrap items-center justify-between gap-2 pt-2 border-t bdr-line"><span class="text-xs font-bold">Design-Modus:</span><div class="inline-flex flex-wrap rounded-xl p-1 bg-black/20 border bdr-line"><button type="button" data-action="app-mode" data-mode="global" class="px-3 py-1 rounded-lg text-xs font-extrabold ${!isPer?'bg-acc-soft text-acc':''}">Global</button><button type="button" data-action="app-mode" data-mode="perTab" class="px-3 py-1 rounded-lg text-xs font-extrabold ${isPer?'bg-acc-soft text-acc':''}">Pro Reiter</button><button type="button" data-action="edit-scope" data-scope="lobby" class="px-3 py-1 rounded-lg text-xs font-extrabold hover:text-acc">🏠 Lobby-Design</button></div></div>${isPer?`<div class="flex flex-wrap gap-1.5">${TABS.map(t=>`<button type="button" data-action="edit-scope" data-scope="${t.id}" class="btn text-xs ${S.appearance.editScope===t.id?'btn-pri':''}">${t.l}</button>`).join('')}</div>`:''}`}</div>
      <div class="subcard space-y-3">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <h3 class="text-xs font-extrabold text-acc">3. LAYOUT-THEMA &amp; EIGENE FARBPALETTEN (${esc(scopeLbl)})</h3>
          <button type="button" data-action="toggle-pal-builder" class="btn ${UI.palBuilderOpen?'btn-pri':'bdr-acc bg-acc-soft text-acc'} py-1 px-2.5 text-xs">🎨 ${UI.palBuilderOpen?'Farb-Konfigurator schließen':'Eigenes Farbschema konfigurieren'}</button>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          ${Object.entries(PALETTES).map(([k,p])=>`<button type="button" data-action="pick-pal" data-pal="${k}" class="subcard p-2.5 flex items-center gap-2.5 text-left ${tgt.palette===k&&!tgt.customColors?'bdr-acc ring-2 ring-sky-400/30':''}"><span class="flex -space-x-1.5 shrink-0">${p[2].map(c=>`<span class="w-4 h-4 rounded-full border border-white/30" style="background:${c}"></span>`).join('')}</span><span class="min-w-0"><span class="block text-xs font-extrabold truncate">${esc(p[0])}</span><span class="block text-[10px] t-mut truncate">${esc(p[1])}</span></span></button>`).join('')}
        </div>
        ${(S.customPalettes||[]).length?`<div class="pt-2 border-t bdr-line space-y-2">
          <div class="text-[11px] font-extrabold text-acc uppercase tracking-wider">Gespeicherte eigene Farbpaletten (${S.customPalettes.length})</div>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            ${S.customPalettes.map(cp=>`<div class="subcard p-2 flex items-center justify-between gap-2 ${tgt.palette===cp.id&&!tgt.customColors?'bdr-acc ring-2 ring-sky-400/30':''}">
              <button type="button" data-action="pick-pal" data-pal="${esc(cp.id)}" class="flex items-center gap-2 text-left min-w-0 flex-1">
                <span class="flex -space-x-1.5 shrink-0">${[cp.bg,cp.acc,cp.acc2].map(c=>`<span class="w-4 h-4 rounded-full border border-white/30" style="background:${esc(c)}"></span>`).join('')}</span>
                <span class="min-w-0"><span class="block text-xs font-extrabold truncate">${esc(cp.name)}</span><span class="block text-[10px] t-mut truncate">${cp.isLt?'Helle Basis':'Dunkle Basis'} • Eigene</span></span>
              </button>
              <button type="button" data-action="del-custom-pal" data-id="${esc(cp.id)}" data-tip="Eigene Palette löschen" class="btn btn-err py-0.5 px-1.5 text-[10px] shrink-0">✕</button>
            </div>`).join('')}
          </div>
        </div>`:''}
        ${UI.palBuilderOpen?`<div class="p-3.5 rounded-xl border-2 bdr-acc bg-black/20 space-y-3 mt-2">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <div>
              <div class="text-xs font-extrabold text-acc">🎨 Eigenes Farbschema live konfigurieren &amp; speichern</div>
              <div class="text-[11px] t-mut">Jede Farbänderung wird sofort live auf dem Bogen angezeigt. Speichere deine Lieblingskombination als eigene Palette ab.</div>
            </div>
            <button type="button" data-action="pal-draft-islt" class="btn py-1 px-2.5 text-xs">${d.isLt?'☀️ Helle Oberfläche (Kontrast)':'🌙 Dunkle Oberfläche (Kontrast)'}</button>
          </div>
          <div class="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            ${colFields.map(([fk,fl,fv])=>`<div class="subcard p-2 flex flex-col gap-1">
              <span class="text-[10px] font-bold t-mut">${fl}</span>
              <div class="flex items-center gap-1.5">
                <input type="color" data-pal-col="${fk}" value="${esc(isHex(fv)?fv:'#0ea5e9')}" class="w-8 h-7 shrink-0"/>
                <input type="text" data-pal-hex="${fk}" maxlength="7" value="${esc(String(fv||'').toUpperCase())}" class="inp w-full py-0.5 px-1.5 font-mono text-xs font-bold uppercase"/>
              </div>
            </div>`).join('')}
          </div>
          <div class="flex flex-wrap items-center gap-2 pt-2 border-t bdr-line">
            <input id="inpCustomPalName" data-pal-name="1" type="text" value="${esc(d.name||'')}" placeholder="Name für Farbpalette (z.B. Blutmond, Arkan-Gold)..." class="inp flex-1 min-w-0 w-full sm:w-auto sm:min-w-[180px] text-xs font-bold"/>
            <button type="button" data-action="save-custom-pal" class="btn btn-ok py-1.5 px-3.5 text-xs">💾 Als neue Palette speichern</button>
            ${activeCp?`<button type="button" data-action="update-custom-pal" data-id="${esc(activeCp.id)}" class="btn btn-pri py-1.5 px-3 text-xs">✓ „${esc(activeCp.name)}“ überschreiben</button>`:''}
          </div>
        </div>`:''}
      </div>
      <div class="subcard space-y-3"><div class="flex flex-wrap items-center justify-between gap-2"><h3 class="text-xs font-extrabold text-acc">4. HINTERGRUNDBILD (${esc(scopeLbl)})</h3><div class="flex flex-wrap gap-2"><button type="button" data-action="pick-bg" class="btn btn-pri">${tgt.bg?'🖼 Bild verwalten':'🖼 Bild wählen'}</button></div></div>
      ${tgt.bg?`<div class="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-2 border-t bdr-line items-center"><div class="sm:col-span-4"><button type="button" data-action="pick-bg" data-tip="Hintergrundbild verwalten (ändern, Großansicht oder entfernen)" class="w-full block p-0 rounded-lg overflow-hidden border bdr-line cursor-pointer hover:opacity-90 transition-opacity"><img src="${tgt.bg}" class="w-full h-24 object-cover block"/></button></div><div class="sm:col-span-8 space-y-2"><div><div class="flex justify-between text-xs font-bold"><span>Schleier</span><span id="bgOvLbl">${tgt.overlay}%</span></div><input id="rngOverlay" type="range" min="0" max="95" value="${tgt.overlay}" class="w-full"/></div><div><div class="flex justify-between text-xs font-bold"><span>Unschärfe</span><span id="bgBlurLbl">${tgt.blur||0} px</span></div><input id="rngBlur" type="range" min="0" max="20" value="${tgt.blur||0}" class="w-full"/></div></div></div>`:''}</div>`,
      `<button type="button" data-action="close-modal" class="btn btn-pri px-6">Fertig</button>`,'max-w-3xl');
    return;
  }
  if(UI.modal==='powerLibrary'){
    if(!CLOUD.isAdmin&&PWLIB.tab==='admin') PWLIB.tab='server';
    const curTab=PWLIB.tab||'server';
    const allPacks=getAllLibraryPacks();
    const allCats=sortAlpha(allPacks.map(p=>p.category||'Allgemein'));
    const modalTabs=`<div class="flex flex-wrap items-center gap-1.5 pb-2.5 border-b bdr-line">
      <button type="button" data-action="pwlib-tab" data-tab="server" class="btn py-1.5 px-3 text-xs ${curTab==='server'?'btn-pri':''}">🌐 Server-Bibliothek <span class="px-1.5 rounded-full text-[10px] bg-black/20 tabular">${allPacks.length}</span></button>
      <button type="button" data-action="pwlib-tab" data-tab="local" class="btn py-1.5 px-3 text-xs ${curTab==='local'?'btn-pri':''}">📁 Lokale .json-Datei</button>
      ${CLOUD.isAdmin?`<button type="button" data-action="pwlib-tab" data-tab="admin" class="btn py-1.5 px-3 text-xs ${curTab==='admin'?'!border-amber-400 !bg-amber-500/20 text-amber-300 font-extrabold':'border-amber-400/40 text-amber-300'}">👑 Admin / Veröffentlichen</button>`:''}
    </div>`;
    let tabBody='';
    if(curTab==='server'){
      tabBody=`<div class="space-y-3 min-w-0">
        <div class="subcard p-2.5 space-y-2.5 min-w-0">
          <div class="flex flex-wrap items-center justify-between gap-2 min-w-0">
            <div class="flex flex-wrap items-center gap-1.5">
              <button type="button" data-action="pwlib-reload" ${PWLIB.loading?'disabled':''} class="btn py-1 px-2.5 text-xs">${PWLIB.loading?'⏳ Lädt...':'🔄 Neu laden'}</button>
              ${PWLIB.lastLoadedTs?`<span class="text-[11px] t-mut tabular">Stand: ${esc(PWLIB.lastLoadedTs)}</span>`:''}
            </div>
            <div class="flex flex-wrap items-center gap-1.5">
              <span class="text-[11px] font-extrabold text-acc">🔄 Basisaktionen abrufen:</span>
              <button type="button" data-action="pwlib-sync-basis" data-mode="skipExisting" ${PWLIB.loading?'disabled':''} data-tip="Lädt das Basisaktionen-Paket vom Server und ergänzt fehlende Basisaktionen ohne deine bestehenden zu überschreiben" class="btn bg-acc-soft bdr-acc text-acc py-1 px-2 text-xs">Fehlende ergänzen</button>
              <button type="button" data-action="pwlib-sync-basis" data-mode="updateExisting" ${PWLIB.loading?'disabled':''} data-tip="Lädt das Basisaktionen-Paket vom Server und aktualisiert Texte &amp; Regeln vorhandener Basisaktionen" class="btn py-1 px-2 text-xs">Texte aktualisieren</button>
            </div>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-12 gap-2">
            <div class="sm:col-span-6 min-w-0">
              <input id="pwlibSearchInp" data-pwlib-inp="search" type="text" value="${esc(PWLIB.search)}" placeholder="🔍 Pakete, Sektionen, Kräfte oder Augmente suchen..." class="inp w-full min-w-0 text-xs"/>
            </div>
            <div class="sm:col-span-3 min-w-0">
              <select data-pwlib-sel="filterCat" class="inp w-full min-w-0 text-xs font-semibold">
                <option value="" ${!PWLIB.filterCat?'selected':''}>Alle Kategorien</option>
                ${allCats.map(c=>`<option value="${esc(c)}" ${PWLIB.filterCat===c?'selected':''}>${esc(c)}</option>`).join('')}
              </select>
            </div>
            <div class="sm:col-span-3 min-w-0">
              <select data-pwlib-sel="filterTier" class="inp w-full min-w-0 text-xs font-semibold">
                <option value="" ${!PWLIB.filterTier?'selected':''}>Alle Stufen</option>
                ${Object.entries(PW_TIERS).map(([k,t])=>`<option value="${k}" ${PWLIB.filterTier===k?'selected':''}>${esc(t.l)}</option>`).join('')}
              </select>
            </div>
          </div>
        </div>
        ${PWLIB.error?`<div class="p-2.5 rounded-xl border border-amber-500/50 bg-amber-500/10 text-amber-300 text-xs font-semibold">ℹ️ ${esc(PWLIB.error)}</div>`:''}
        <div id="pwlibPackList" class="space-y-2.5 min-w-0">${renderPwLibPackListHtml()}</div>
      </div>`;
    }else if(curTab==='local'){
      tabBody=`<div class="space-y-3.5 min-w-0">
        ${renderPwLibImportOptsHtml()}
        <div class="subcard p-4 space-y-3 border-2 border-dashed bdr-acc bg-acc-soft/15">
          <div class="space-y-1">
            <h3 class="text-sm font-extrabold text-acc">📥 Lokale .json-Datei importieren</h3>
            <p class="text-xs t-mut">Importiere ein exportiertes Kräfte-Paket (<code>.json</code>), eine <code>powers-library.json</code> oder extrahiere direkt alle Kräfte, Augmente &amp; Sektionen aus einem anderen Scherbensturm-Charakterbogen – ohne deinen aktuellen Charakter zu überschreiben.</p>
          </div>
          <div class="flex flex-wrap items-center gap-2">
            <button type="button" data-action="pwlib-pick-file" class="btn btn-pri py-2 px-4 text-xs">📁 .json-Datei auswählen &amp; importieren</button>
          </div>
        </div>
        <div class="subcard p-4 space-y-3">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <div class="space-y-0.5 min-w-0 flex-1">
              <h3 class="text-sm font-extrabold">📤 Eigene Kräfte als Paket (.json) exportieren</h3>
              <p class="text-xs t-mut">Exportiert alle Sektionen (inkl. Verschachtelung), Kräfte &amp; gebundenen Augmente dieses Bogens – perfekt zum Teilen oder für GitHub <code>data/powers-library.json</code>.</p>
            </div>
            <span class="pill cursor-default text-[11px] tabular shrink-0">${S.powerSections.length} Sekt. • ${S.powers.length} Kräfte • ${S.augments.length} Augm.</span>
          </div>
          <div class="flex flex-wrap items-center gap-2">
            <button type="button" data-action="export-pw-all" class="btn btn-ok py-2 px-4 text-xs">📤 Alle eigenen Kräfte als Paket (.json) exportieren</button>
          </div>
        </div>
      </div>`;
    }else if(curTab==='admin'&&CLOUD.isAdmin){
      const flatSecs=getPwSecOptionsFlat();
      const cloudPacks=Array.isArray(PWLIB.cloudPacks)?PWLIB.cloudPacks:[];
      tabBody=`<div class="space-y-4 min-w-0">
        <div class="subcard p-3.5 space-y-3 border bdr-acc">
          <div class="flex flex-wrap items-center justify-between gap-2 border-b bdr-line pb-2">
            <div>
              <h3 class="text-sm font-extrabold text-amber-300">👑 Paket aus aktuellem Charakterbogen veröffentlichen</h3>
              <p class="text-[11px] t-mut">Stelle alle Kräfte oder eine einzelne Sektion (rekursiv) direkt in die Cloud-Bibliothek oder lade eine fertige <code>powers-library.json</code> für GitHub herunter.</p>
            </div>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-12 gap-2.5 text-xs">
            <div class="sm:col-span-6 min-w-0">
              <label class="block text-[10px] font-extrabold t-mut uppercase tracking-wider mb-1">Quelle aus diesem Bogen</label>
              <select data-pwlib-sel="adminSrc" class="inp w-full min-w-0 text-xs font-semibold">
                <option value="all" ${PWLIB.adminSrc==='all'?'selected':''}>Alle Kräfte, Augmente &amp; Sektionen (${S.powerSections.length} Sekt. / ${S.powers.length} Kräfte)</option>
                ${flatSecs.map(s=>`<option value="sec:${esc(s.id)}" ${PWLIB.adminSrc==='sec:'+s.id?'selected':''}>${'↳ '.repeat(Math.min(3,s.depth))}📁 Sektion: ${esc(s.name)} (rekursiv)</option>`).join('')}
              </select>
            </div>
            <div class="sm:col-span-6 min-w-0">
              <label class="block text-[10px] font-extrabold t-mut uppercase tracking-wider mb-1">Paketname</label>
              <input data-pwlib-inp="adminName" type="text" value="${esc(PWLIB.adminName)}" placeholder="z.B. Basisaktionen oder Kampfmanöver..." class="inp w-full min-w-0 text-xs font-bold"/>
            </div>
            <div class="sm:col-span-5 min-w-0">
              <label class="block text-[10px] font-extrabold t-mut uppercase tracking-wider mb-1">Kategorie</label>
              <input data-pwlib-inp="adminCat" list="pwlibCatHints" type="text" value="${esc(PWLIB.adminCat||'Allgemein')}" placeholder="z.B. Basisaktionen, Kampf, Magie..." class="inp w-full min-w-0 text-xs"/>
              <datalist id="pwlibCatHints"><option value="Allgemein"></option><option value="Basisaktionen"></option><option value="Kampf"></option><option value="Magie"></option><option value="Handwerk &amp; Wissen"></option><option value="Spezial"></option></datalist>
            </div>
            <div class="sm:col-span-7 min-w-0">
              <label class="block text-[10px] font-extrabold t-mut uppercase tracking-wider mb-1">Kurzbeschreibung (optional)</label>
              <input data-pwlib-inp="adminDesc" type="text" value="${esc(PWLIB.adminDesc)}" placeholder="Kurze Info zum Inhalt des Pakets..." class="inp w-full min-w-0 text-xs"/>
            </div>
          </div>
          <label class="inline-flex items-center gap-2 text-xs font-bold cursor-pointer select-none">
            <input data-pwlib-chk="adminIsBasis" type="checkbox" ${PWLIB.adminIsBasis?'checked':''} class="w-4 h-4 accent-amber-400"/>
            <span>⭐ Als <strong>Basisaktionen-Paket</strong> markieren <span class="t-mut font-normal">(wird über „🔄 Basisaktionen abrufen“ synchronisiert)</span></span>
          </label>
          <div class="flex flex-wrap items-center gap-2 pt-1">
            <button type="button" data-action="pwlib-publish-cloud" ${PWLIB.saving?'disabled':''} class="btn btn-pri py-1.5 px-3.5 text-xs">${PWLIB.saving?'⏳ Speichere...':'☁️ In Cloud-Bibliothek veröffentlichen'}</button>
            <button type="button" data-action="pwlib-download-repo-json" class="btn btn-ok py-1.5 px-3.5 text-xs">📥 Als powers-library.json für GitHub herunterladen</button>
          </div>
        </div>
        <div class="subcard p-3.5 space-y-2.5">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <h3 class="text-sm font-extrabold">☁️ Bestehende Cloud-Pakete (${cloudPacks.length})</h3>
            <button type="button" data-action="pwlib-reload" ${PWLIB.loading?'disabled':''} class="btn py-1 px-2 text-xs">🔄 Aktualisieren</button>
          </div>
          ${cloudPacks.length?`<div class="space-y-2 max-h-64 overflow-y-auto pr-1">${cloudPacks.map(pk=>{
            const isDelAsk=PWLIB.confirmDelPackId===pk.id;
            const sc=(pk.sections||[]).length, pc=(pk.powers||[]).length, ac=(pk.augments||[]).length;
            return `<div class="p-2.5 rounded-lg border bdr-line bg-black/20 flex flex-wrap items-center justify-between gap-2 min-w-0 text-xs">
              <div class="min-w-0 flex-1">
                <div class="flex flex-wrap items-center gap-1.5 min-w-0">
                  <span class="font-extrabold break-words">${esc(pk.name)}</span>
                  ${pk.isBasisPack?`<span class="px-1.5 py-0.2 rounded text-[10px] font-black bg-amber-500/20 text-amber-300 border border-amber-400/40">⭐ Basis</span>`:''}
                  <span class="text-[10px] t-mut">(${esc(pk.category||'Allgemein')})</span>
                </div>
                <div class="text-[11px] t-mut tabular">${sc} Sekt. • ${pc} Kräfte • ${ac} Augm.${pk.updatedAt?` • ${esc(pk.updatedAt)}`:''}</div>
              </div>
              <div class="flex items-center gap-1 shrink-0">
                ${isDelAsk
                  ?`<button type="button" data-action="pwlib-del-cloud" data-id="${esc(pk.id)}" ${PWLIB.saving?'disabled':''} class="btn bg-rose-600 text-white border-rose-600 py-1 px-2 text-[11px] font-black">Löschen? (2/2)</button><button type="button" data-action="pwlib-cancel-del-cloud" class="btn py-1 px-2 text-[11px]">✕</button>`
                  :`<button type="button" data-action="pwlib-del-cloud" data-id="${esc(pk.id)}" ${PWLIB.saving?'disabled':''} data-tip="Paket aus der Cloud-Bibliothek entfernen" class="btn btn-err py-1 px-2 text-xs">🗑️</button>`}
              </div>
            </div>`;
          }).join('')}</div>`:`<div class="text-xs t-mut text-center py-4">Derzeit sind noch keine Pakete in der Cloud-Bibliothek gespeichert.</div>`}
        </div>
      </div>`;
    }
    m.innerHTML=modalShell('📚 Kräfte-Bibliothek, Import &amp; Export','Pakete vom Server laden, lokale .json-Dateien importieren oder eigene Kräfte teilen.',`${modalTabs}${tabBody}`,`<button type="button" data-action="close-modal" class="btn btn-pri px-6">Schließen</button>`,'max-w-4xl');
    return;
  }
  if(UI.modal==='feedback'){
    const fbBackBtn=UI.adminReturnModal==='adminPanel'?`<button type="button" data-action="admin-return-panel" class="btn mr-auto">← Zurück zum Admin-Fenster</button>`:'';
    m.innerHTML=modalShell('💬 Feedback &amp; Wünsche','Direkter Kanal an den Admin, Antworten &amp; persönliches Feedback-Log',renderFeedbackModalHtml(),`${fbBackBtn}<button type="button" data-action="close-modal" class="btn btn-pri px-5">${UI.adminReturnModal==='adminPanel'?'Zurück':'Schließen'}</button>`,'max-w-4xl');
    return;
  }
  if(UI.modal==='notifs'){
    m.innerHTML=modalShell('🔔 Benachrichtigungen','',renderNotifsModalHtml(),`<button type="button" data-action="close-modal" class="btn btn-pri px-5">Schließen</button>`,'max-w-xl');
    return;
  }
  if(UI.modal==='info'){
    const tabs=[['dice','1. Würfelsystem'],['prog','2. Steigerung'],['gloss','3. Glossar'],['patchnotes','📋 Patchnotes']].map(([k,l])=>`<button type="button" data-action="info-tab" data-itab="${k}" class="btn py-1 px-2.5 text-xs ${UI.infoTab===k?'btn-pri':''}">${l}</button>`).join('');
    const body=UI.infoTab==='dice'?renderInfoDiceWikiHtml()
    :UI.infoTab==='prog'?renderInfoProgWikiHtml()
    :UI.infoTab==='patchnotes'?renderPatchnotesTabHtml()
    :renderInfoGlossaryHtml();
    m.innerHTML=modalShell('','',body,`<button type="button" data-action="close-modal" class="btn btn-pri px-6">Schließen</button>`,'max-w-4xl',tabs);
  }
}


function renderInfoDiceWikiHtml(){
  const advRows=[
    ['±1','±10','Basis-Stufe'],
    ['±2','±15','+5 zusätzlich'],
    ['±3','±20','+5 zusätzlich'],
    ['±4','±25','+5 zusätzlich'],
    ['±5+ (Max.)','±30','Deckelung bei ±5']
  ];
  const hzRows=[
    ['01–10','Kopf','klein'],
    ['11–50','Rumpf','groß'],
    ['51–62','Arm links','normal'],
    ['63–74','Arm rechts','normal'],
    ['75–87','Bein links','normal'],
    ['88–100','Bein rechts','normal']
  ];
  const egSteps=[
    ['1–10','1 EG'],['11–20','2 EG'],['21–30','3 EG'],['31–40','4 EG'],['41–50','5 EG'],
    ['51–60','6 EG'],['61–70','7 EG'],['71–80','8 EG'],['81–90','9 EG'],['91–99','10 EG']
  ];
  const megSteps=[
    ['100–91','1 MEG'],['90–81','2 MEG'],['80–71','3 MEG'],['70–61','4 MEG'],['60–51','5 MEG'],
    ['50–41','6 MEG'],['40–31','7 MEG'],['30–21','8 MEG'],['20–11','9 MEG'],['10–1','10 MEG']
  ];
  return `<div class="space-y-5">
    <section class="subcard rounded-xl p-4 sm:p-5 border-2 bdr-acc bg-acc-soft/30 space-y-4">
      <div class="flex flex-wrap items-center justify-between gap-2">
        <div class="flex items-center gap-2">
          <span class="px-2 py-0.5 rounded-md bg-acc-soft border bdr-acc text-acc text-[10px] font-black uppercase tracking-wider">Sektion 1</span>
          <h3 class="text-sm sm:text-base font-black text-acc tracking-tight">Grundformel des W100-Systems</h3>
        </div>
        <span class="text-[11px] font-bold t-mut">W100 • Gleich-oder-Unterbieten</span>
      </div>
      <div class="rounded-xl p-3.5 sm:p-4 bg-black/30 border bdr-acc/60 flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 text-center tabular">
        <span class="px-3 py-1.5 rounded-lg bg-acc-soft border-2 bdr-acc text-acc font-black text-xs sm:text-sm shadow-sm">Testschwelle</span>
        <span class="font-black text-base sm:text-lg text-acc px-0.5">=</span>
        <span class="px-2.5 py-1.5 rounded-lg bg-sky-500/15 border border-sky-400/45 text-sky-200 font-extrabold text-xs sm:text-sm">Charakterwert</span>
        <span class="px-2.5 py-1.5 rounded-lg bg-emerald-500/15 border border-emerald-400/45 text-emerald-300 font-black text-xs sm:text-sm">+ 50</span>
        <span class="px-2.5 py-1.5 rounded-lg bg-rose-500/15 border border-rose-400/45 text-rose-300 font-extrabold text-xs sm:text-sm">− Schwierigkeit</span>
        <span class="px-2.5 py-1.5 rounded-lg bg-amber-500/15 border border-amber-400/45 text-amber-300 font-extrabold text-xs sm:text-sm">+ Vor-/Nachteils-Bonus</span>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-2.5">
        <div class="rounded-xl p-3 bg-black/25 border border-sky-500/35 space-y-1">
          <div class="text-[11px] font-black uppercase tracking-wider text-sky-300">Charakterwert</div>
          <p class="text-xs t-mut leading-snug">Attributswert + Fertigkeitsbonus <span class="text-sky-200/90 font-semibold tabular">(z. B. PR 30 + Schwertkampf 15 = 45)</span>.</p>
        </div>
        <div class="rounded-xl p-3 bg-black/25 border border-rose-500/35 space-y-1">
          <div class="text-[11px] font-black uppercase tracking-wider text-rose-300">Schwierigkeit</div>
          <p class="text-xs t-mut leading-snug">Fester Zielwert <span class="text-rose-200/90 font-semibold tabular">(z. B. 40)</span> oder gegnerischer Vergleichswert im direkten Duell.</p>
        </div>
        <div class="rounded-xl p-3 bg-black/25 border border-emerald-500/35 space-y-1">
          <div class="text-[11px] font-black uppercase tracking-wider text-emerald-300">Basis-Chance</div>
          <p class="text-xs t-mut leading-snug">Bei Gleichstand <span class="font-semibold text-emerald-200 tabular">(Wert = Schwierigkeit)</span> liegt die Schwelle exakt bei <strong class="text-emerald-300 tabular">50 (50 %)</strong>.</p>
        </div>
      </div>
    </section>

    <section class="space-y-2.5">
      <div class="flex items-center justify-between gap-2 pb-1.5 border-b bdr-line">
        <div class="flex items-center gap-2">
          <span class="px-2 py-0.5 rounded-md bg-acc-soft border bdr-acc text-acc text-[10px] font-black uppercase tracking-wider">Sektion 2</span>
          <h3 class="text-sm font-black tracking-tight">Ablauf eines W100-Tests</h3>
        </div>
        <span class="text-[11px] font-bold t-mut">3 Schritte</span>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div class="subcard rounded-xl p-3.5 space-y-1.5 border bdr-line">
          <div class="flex items-center gap-2">
            <span class="w-6 h-6 rounded-lg bg-acc-soft border bdr-acc text-acc font-black text-xs inline-flex items-center justify-center shrink-0 tabular">1</span>
            <h4 class="font-extrabold text-xs sm:text-sm">Schwelle bestimmen</h4>
          </div>
          <p class="text-xs t-mut leading-relaxed">Formel anwenden. Die effektive Erfolgschance liegt stets zwischen <strong class="text-emerald-300 tabular">1 %</strong> und <strong class="text-emerald-300 tabular">99 %</strong>, da eine <strong class="tabular">1</strong> immer gelingt und eine <strong class="tabular">100</strong> immer patzt.</p>
        </div>
        <div class="subcard rounded-xl p-3.5 space-y-1.5 border bdr-line">
          <div class="flex items-center gap-2">
            <span class="w-6 h-6 rounded-lg bg-acc-soft border bdr-acc text-acc font-black text-xs inline-flex items-center justify-center shrink-0 tabular">2</span>
            <h4 class="font-extrabold text-xs sm:text-sm">W100 würfeln</h4>
          </div>
          <p class="text-xs t-mut leading-relaxed">Ist das Ergebnis <strong class="text-emerald-300 tabular">≤ Testschwelle</strong> (und keine <strong class="tabular">100</strong>), ist der Test <strong class="text-emerald-300">bestanden</strong>; liegt der Wurf darüber, ist er <strong class="text-rose-300">gescheitert</strong>.</p>
        </div>
        <div class="subcard rounded-xl p-3.5 space-y-1.5 border bdr-line">
          <div class="flex items-center gap-2">
            <span class="w-6 h-6 rounded-lg bg-acc-soft border bdr-acc text-acc font-black text-xs inline-flex items-center justify-center shrink-0 tabular">3</span>
            <h4 class="font-extrabold text-xs sm:text-sm">Qualität (EG / MEG) ablesen</h4>
          </div>
          <p class="text-xs t-mut leading-relaxed">Je <strong>höher</strong> der erfolgreiche Wurf ausfällt (ohne die Schwelle zu überschreiten), desto mehr <strong class="text-emerald-300">Erfolgsgrade (EG)</strong> werden erzielt.</p>
        </div>
      </div>
    </section>

    <section class="space-y-2.5">
      <div class="flex items-center justify-between gap-2 pb-1.5 border-b bdr-line">
        <div class="flex items-center gap-2">
          <span class="px-2 py-0.5 rounded-md bg-acc-soft border bdr-acc text-acc text-[10px] font-black uppercase tracking-wider">Sektion 3</span>
          <h3 class="text-sm font-black tracking-tight">Vor- &amp; Nachteile</h3>
        </div>
        <span class="text-[11px] font-bold t-mut tabular">Netto gedeckelt bei ±5</span>
      </div>
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-3 items-stretch">
        <div class="lg:col-span-5 subcard rounded-xl p-3.5 space-y-2.5 border bdr-line flex flex-col justify-between">
          <div class="space-y-2">
            <div class="text-xs font-extrabold text-acc">Verrechnungsregel</div>
            <p class="text-xs t-mut leading-relaxed">Vorteile und Nachteile heben sich stets <strong class="text-acc tabular">1:1</strong> auf. Die verbleibende Netto-Differenz wird bei <strong class="text-amber-300 tabular">±5</strong> gedeckelt.</p>
          </div>
          <div class="rounded-xl p-2.5 border border-amber-400/45 bg-amber-500/10 text-xs leading-snug">
            <span class="font-black text-amber-300">✨ Inspiration:</span> <span class="t-mut">Gewährt beim Einsetzen einmalig <strong class="text-amber-200 tabular">+1 Vorteil</strong> auf genau den nächsten Wurf (max. 1 Stapel pro Test).</span>
          </div>
        </div>
        <div class="lg:col-span-7 subcard rounded-xl p-3 border bdr-line overflow-x-auto max-w-full min-w-0">
          <table class="tbl tabular text-xs">
            <thead>
              <tr>
                <th class="text-left">Netto-Differenz</th>
                <th class="text-center">Effekt auf Testschwelle</th>
                <th class="text-right">Hinweis</th>
              </tr>
            </thead>
            <tbody>
              ${advRows.map(([net,mod,note],idx)=>`<tr class="${idx===4?'bg-amber-500/10':''}">
                <td class="font-black ${idx===4?'text-amber-300':'text-acc'}">${net}</td>
                <td class="text-center"><span class="px-2 py-0.5 rounded-md bg-acc-soft border bdr-acc font-black text-acc">${mod}</span></td>
                <td class="text-right text-[11px] t-mut">${note}</td>
              </tr>`).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </section>

    <section class="space-y-3">
      <div class="flex items-center justify-between gap-2 pb-1.5 border-b bdr-line">
        <div class="flex items-center gap-2">
          <span class="px-2 py-0.5 rounded-md bg-acc-soft border bdr-acc text-acc text-[10px] font-black uppercase tracking-wider">Sektion 4</span>
          <h3 class="text-sm font-black tracking-tight">Erfolgsgrade (EG), Misserfolgsgrade (MEG) &amp; Über-100-Skalierung</h3>
        </div>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div class="subcard rounded-xl p-3.5 border border-emerald-500/45 bg-emerald-500/5 space-y-2.5">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <h4 class="font-black text-xs sm:text-sm text-emerald-400">✓ Erfolgsgrade (EG)</h4>
            <span class="px-2 py-0.5 rounded-md bg-emerald-500/20 border border-emerald-500/40 text-emerald-200 font-black text-xs tabular">EG = ⌈Wurf / 10⌉</span>
          </div>
          <p class="text-[11px] t-mut leading-snug">Zählt bei bestandenem Test. Ein hoher Wurf knapp unter der Schwelle liefert maximale Qualität.</p>
          <div class="grid grid-cols-2 sm:grid-cols-5 gap-1.5 tabular">
            ${egSteps.map(([rng,val])=>`<div class="px-2 py-1 rounded-lg bg-black/25 border border-emerald-500/25 text-center"><div class="text-[10px] t-mut font-semibold">${rng}</div><div class="text-[11px] font-black text-emerald-300">${val}</div></div>`).join('')}
          </div>
        </div>
        <div class="subcard rounded-xl p-3.5 border border-rose-500/45 bg-rose-500/5 space-y-2.5">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <h4 class="font-black text-xs sm:text-sm text-rose-400">✕ Misserfolgsgrade (MEG)</h4>
            <span class="px-2 py-0.5 rounded-md bg-rose-500/20 border border-rose-500/40 text-rose-200 font-black text-xs tabular">MEG = ⌈(101 − Wurf) / 10⌉</span>
          </div>
          <p class="text-[11px] t-mut leading-snug">Zählt bei gescheitertem Test. Je weiter unterhalb der 100 der Fehlversuch liegt, desto höher die MEG.</p>
          <div class="grid grid-cols-2 sm:grid-cols-5 gap-1.5 tabular">
            ${megSteps.map(([rng,val])=>`<div class="px-2 py-1 rounded-lg bg-black/25 border border-rose-500/25 text-center"><div class="text-[10px] t-mut font-semibold">${rng}</div><div class="text-[11px] font-black text-rose-300">${val}</div></div>`).join('')}
          </div>
        </div>
      </div>
      <div class="subcard rounded-xl p-3.5 border border-amber-400/55 bg-amber-500/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div class="space-y-1">
          <div class="flex flex-wrap items-center gap-2">
            <span class="font-black text-xs sm:text-sm text-amber-300">⚡ Testschwelle über 100 (EG-Multiplikator)</span>
            <span class="px-2 py-0.5 rounded-md bg-amber-500/20 border border-amber-400/50 text-amber-200 font-black text-[11px] tabular">Faktor = ⌊Schwelle / 100⌋ + 1</span>
          </div>
          <p class="text-xs t-mut leading-relaxed">Ab einer Schwelle <strong class="text-amber-200 tabular">&gt; 100</strong> werden alle erzielten EG multipliziert: bei <strong class="text-amber-200 tabular">101–199 → ×2</strong>, bei <strong class="text-amber-200 tabular">200–299 → ×3</strong> usw. <span class="text-rose-300 font-semibold">(Eine gewürfelte 100 bleibt dennoch immer ein Patzer.)</span></p>
        </div>
      </div>
    </section>

    <section class="space-y-2.5">
      <div class="flex items-center justify-between gap-2 pb-1.5 border-b bdr-line">
        <div class="flex items-center gap-2">
          <span class="px-2 py-0.5 rounded-md bg-acc-soft border bdr-acc text-acc text-[10px] font-black uppercase tracking-wider">Sektion 5</span>
          <h3 class="text-sm font-black tracking-tight">Kritische Erfolge &amp; Patzer</h3>
        </div>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div class="subcard rounded-xl p-3.5 border-2 border-amber-400/55 bg-amber-500/10 space-y-2">
          <div class="font-black text-xs sm:text-sm text-amber-300">★ Kritischer Erfolg</div>
          <p class="text-xs t-mut leading-relaxed">Eine gewürfelte <strong class="text-amber-200 tabular">1</strong> ist <strong>immer</strong> ein kritischer Erfolg. Zudem ist jeder bestandene Wurf mit der <strong class="text-amber-200">kritischen Endziffer</strong> (Standard: <strong class="tabular text-amber-200">1</strong> → 1, 11, 21, 31, …) kritisch.</p>
          <div class="rounded-lg p-2 bg-black/25 border border-amber-400/35 text-[11px] leading-snug">
            <span class="font-bold text-amber-300">Erweiterung (z. B. <em>Tödlich (X)</em>):</span> <span class="t-mut">Erweitert die kritische Endziffer Schritt für Schritt in der Reihe</span>
            <div class="mt-1 font-black text-amber-200 tabular tracking-wide">1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9 → 0</div>
          </div>
        </div>
        <div class="subcard rounded-xl p-3.5 border-2 border-rose-500/55 bg-rose-500/10 space-y-2 flex flex-col justify-between">
          <div class="space-y-2">
            <div class="font-black text-xs sm:text-sm text-rose-400">💀 Patzer</div>
            <p class="text-xs t-mut leading-relaxed">Eine gewürfelte <strong class="text-rose-300 tabular">100</strong> ist <strong>immer</strong> ein automatischer Misserfolg (Patzer) — völlig unabhängig davon, wie hoch die berechnete Testschwelle liegt.</p>
          </div>
          <div class="rounded-lg p-2 bg-black/25 border border-rose-500/35 text-[11px] text-rose-200/90 font-semibold tabular">
            Wurf 100 ⇒ Misserfolg (1 MEG) • selbst bei Schwelle &gt; 100
          </div>
        </div>
      </div>
    </section>

    <section class="space-y-2.5">
      <div class="flex items-center justify-between gap-2 pb-1.5 border-b bdr-line">
        <div class="flex items-center gap-2">
          <span class="px-2 py-0.5 rounded-md bg-acc-soft border bdr-acc text-acc text-[10px] font-black uppercase tracking-wider">Sektion 6</span>
          <h3 class="text-sm font-black tracking-tight">Kampf-Sonderregeln</h3>
        </div>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div class="subcard rounded-xl p-3.5 border border-sky-500/40 bg-sky-500/5 space-y-2">
          <div class="font-black text-xs sm:text-sm text-sky-300">🛡️ Blocken &amp; Folgewurf</div>
          <p class="text-xs t-mut leading-relaxed">Gelingt ein Blocken-Test, folgt ein Folgewurf mit dem <strong class="text-sky-200">Aggressor-Trefferwert gegen Schwierigkeit 20</strong>, dessen EG den Grundschaden gegen die Rüstung bestimmen.</p>
          <div class="rounded-lg p-2.5 bg-black/25 border border-sky-400/35 text-xs font-extrabold text-sky-200 text-center tabular">
            Folgewurf-Schwelle = Aggressor-Wert + 50 − 20 = <span class="text-acc">Aggressor + 30</span>
          </div>
        </div>
        <div class="subcard rounded-xl p-3.5 border bdr-line space-y-2 overflow-x-auto max-w-full min-w-0">
          <div class="font-black text-xs sm:text-sm text-acc">🎯 Trefferzonen (W100)</div>
          <table class="tbl tabular text-xs">
            <thead>
              <tr>
                <th class="text-left">W100</th>
                <th class="text-left">Trefferzone</th>
                <th class="text-right">Größe</th>
              </tr>
            </thead>
            <tbody>
              ${hzRows.map(([rng,zone,sz])=>`<tr>
                <td class="font-black text-acc">${rng}</td>
                <td class="font-bold">${zone}</td>
                <td class="text-right text-[11px] t-mut">${sz}</td>
              </tr>`).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </section>

    <section class="subcard rounded-xl p-4 border-2 border-emerald-500/45 bg-emerald-500/10 space-y-2.5">
      <div class="flex flex-wrap items-center justify-between gap-2">
        <span class="font-black text-xs sm:text-sm text-emerald-300">📘 Praxisbeispiel (Durchgerechnet)</span>
        <span class="px-2 py-0.5 rounded-md bg-amber-500 text-slate-950 font-black text-[11px] tabular">★ Kritisch • 6 EG</span>
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs tabular">
        <div class="rounded-lg p-2.5 bg-black/25 border bdr-line">
          <div class="text-[10px] font-bold uppercase t-mut">1. Ausgangslage</div>
          <div class="mt-0.5 font-semibold">Wert <strong class="text-sky-300">45</strong> vs. Schwierigkeit <strong class="text-rose-300">40</strong><br/>mit <strong class="text-amber-300">1 Vorteil (+10)</strong></div>
        </div>
        <div class="rounded-lg p-2.5 bg-black/25 border bdr-line">
          <div class="text-[10px] font-bold uppercase t-mut">2. Testschwelle</div>
          <div class="mt-0.5 font-semibold">45 + 50 − 40 + 10 = <strong class="text-acc text-sm">65</strong><br/><span class="text-[11px] t-mut">(65 % Erfolgschance)</span></div>
        </div>
        <div class="rounded-lg p-2.5 bg-black/25 border border-emerald-500/40">
          <div class="text-[10px] font-bold uppercase t-mut">3. W100-Ergebnis: 51</div>
          <div class="mt-0.5 font-semibold"><strong class="text-emerald-300">51 ≤ 65 (Bestanden)</strong><br/>Endziffer <strong class="text-amber-300">1 = ★ Kritisch</strong> • ⌈51/10⌉ = <strong class="text-emerald-300">6 EG</strong></div>
        </div>
      </div>
    </section>
  </div>`;
}

function renderInfoProgWikiHtml(){
  const trRows=[
    ['Block 1','+5','2 SP','—',false],
    ['Block 2','+5','2 SP','—',false],
    ['Block 3','+5','3 SP','—',false],
    ['Block 4','+5','3 SP','—',false],
    ['Block 5 (Meisterschaft)','+10','5 SP','1 MsP',true]
  ];
  const skRanks=[
    ['Ungelernt','+0'],
    ['Novize','+10'],
    ['Geselle','+15'],
    ['Experte','+20'],
    ['Meister','+30']
  ];
  const skMatrix=[
    ['Marginal','1 SP','+1 SP','+2 SP','+2 SP + 1 MsP','6 SP + 1 MsP'],
    ['Fundamental','2 SP','+2 SP','+3 SP','+3 SP + 1 MsP','10 SP + 1 MsP'],
    ['Grandios','3 SP','+2 SP','+3 SP','+4 SP + 1 MsP','12 SP + 1 MsP']
  ];
  const pwRows=[
    ['Basisaktion','0 SP','—','Allgemeine Grundmanöver (kostenfrei)','basisaktion'],
    ['Marginal (Options)','1 SP','—','Kleine Effekte, Tricks oder Spezialisierungen','marginal'],
    ['Fundamental (Core)','2 SP','—','Zentrale Kampfkünste, Zauber &amp; Manöver','fundamental'],
    ['Exzeptionell (Ace)','3 SP','—','Herausragende Signatur-Kräfte &amp; starke Augmente','exzeptionell'],
    ['Grandios (Game Changer)','3 SP','1 MsP','Mächtige Meister-Kräfte &amp; Schlüssel-Augmente','grandios']
  ];
  return `<div class="space-y-5">
    <section class="space-y-2.5">
      <div class="flex items-center justify-between gap-2 pb-1.5 border-b bdr-line">
        <div class="flex items-center gap-2">
          <span class="px-2 py-0.5 rounded-md bg-acc-soft border bdr-acc text-acc text-[10px] font-black uppercase tracking-wider">Sektion 1</span>
          <h3 class="text-sm font-black tracking-tight">Stufenaufstieg &amp; Punkte-Ökonomie</h3>
        </div>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-3 tabular">
        <div class="subcard rounded-xl p-3.5 border border-sky-500/45 bg-sky-500/10 space-y-1.5">
          <div class="text-[11px] font-black uppercase tracking-wider text-sky-300">Erfahrung (EP)</div>
          <div class="text-lg sm:text-xl font-black text-sky-200">100 EP = +1 Stufe</div>
          <p class="text-xs t-mut leading-snug">Überschüssige EP werden beim Stufenaufstieg automatisch in die nächste Stufe übertragen.</p>
        </div>
        <div class="subcard rounded-xl p-3.5 border border-emerald-500/45 bg-emerald-500/10 space-y-1.5">
          <div class="text-[11px] font-black uppercase tracking-wider text-emerald-300">Steigerungspunkte (SP)</div>
          <div class="text-lg sm:text-xl font-black text-emerald-200">+5 SP / Stufe</div>
          <p class="text-xs t-mut leading-snug">Jede Charakterstufe gewährt 5 SP — inklusive <strong class="text-emerald-200">Stufe 1 = 5 SP</strong>.</p>
        </div>
        <div class="subcard rounded-xl p-3.5 border border-amber-400/50 bg-amber-500/10 space-y-1.5">
          <div class="text-[11px] font-black uppercase tracking-wider text-amber-300">Meisterschaftspunkte (MsP)</div>
          <div class="text-lg sm:text-xl font-black text-amber-200">+1 MsP alle 10 Stufen</div>
          <p class="text-xs t-mut leading-snug">Wird auf jeder 10. Charakterstufe vergeben (<strong class="text-amber-200">Stufe 10, 20, 30, …</strong>).</p>
        </div>
      </div>
    </section>

    <section class="space-y-2.5">
      <div class="flex flex-wrap items-center justify-between gap-2 pb-1.5 border-b bdr-line">
        <div class="flex items-center gap-2">
          <span class="px-2 py-0.5 rounded-md bg-acc-soft border bdr-acc text-acc text-[10px] font-black uppercase tracking-wider">Sektion 2</span>
          <h3 class="text-sm font-black tracking-tight">Attributs-Training</h3>
        </div>
        <span class="text-[11px] font-bold t-mut">5 aufeinanderfolgende Trainingsblöcke</span>
      </div>
      <div class="subcard rounded-xl p-3 bg-acc-soft/20 border bdr-acc/50 text-xs leading-relaxed">
        <span class="font-extrabold text-acc">Attributs-Formel:</span> Jedes Attribut setzt sich aus <strong>Volkswert (Standard 20) + Potenzial + Training + Modifikatoren</strong> zusammen.
      </div>
      <div class="subcard rounded-xl p-3 border bdr-line overflow-x-auto">
        <table class="tbl tabular text-xs">
          <thead>
            <tr>
              <th class="text-left">Trainingsblock</th>
              <th class="text-center">Attributs-Bonus</th>
              <th class="text-center">SP-Kosten</th>
              <th class="text-right">MsP-Kosten</th>
            </tr>
          </thead>
          <tbody>
            ${trRows.map(([lbl,bon,sp,msp,isMaster])=>`<tr class="${isMaster?'bg-amber-500/15':''}">
              <td class="font-extrabold ${isMaster?'text-amber-300':''}">${lbl}</td>
              <td class="text-center font-black ${isMaster?'text-amber-300':'text-emerald-400'}">${bon}</td>
              <td class="text-center font-bold">${sp}</td>
              <td class="text-right font-black ${isMaster?'text-amber-300':'t-mut'}">${msp}</td>
            </tr>`).join('')}
            <tr class="bg-acc-soft/25 border-t-2 bdr-acc">
              <td class="font-black text-acc">Gesamt (alle 5 Blöcke)</td>
              <td class="text-center font-black text-emerald-300">+30</td>
              <td class="text-center font-black text-acc">15 SP</td>
              <td class="text-right font-black text-amber-300">1 MsP</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section class="space-y-2.5">
      <div class="flex flex-wrap items-center justify-between gap-2 pb-1.5 border-b bdr-line">
        <div class="flex items-center gap-2">
          <span class="px-2 py-0.5 rounded-md bg-acc-soft border bdr-acc text-acc text-[10px] font-black uppercase tracking-wider">Sektion 3</span>
          <h3 class="text-sm font-black tracking-tight">Fertigkeiten (Ränge, Boni &amp; SP-Kostenmatrix)</h3>
        </div>
      </div>
      <div class="subcard rounded-xl p-3 border bdr-line flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 tabular">
        ${skRanks.map(([rn,rb],i)=>`<span class="px-2.5 py-1 rounded-lg border ${i===4?'border-amber-400/60 bg-amber-500/15 text-amber-200':i===0?'bdr-line bg-black/20 t-mut':'bdr-acc bg-acc-soft/40 text-acc'} text-xs font-extrabold">${rn} <strong class="${i===4?'text-amber-300':i===0?'':'text-emerald-300'}">${rb}</strong></span>${i<skRanks.length-1?'<span class="t-mut font-black text-xs">→</span>':''}`).join('')}
      </div>
      <div class="subcard rounded-xl p-3 border bdr-line overflow-x-auto max-w-full min-w-0">
        <table class="tbl tabular text-xs min-w-[540px]">
          <thead>
            <tr>
              <th class="text-left">Kategorie</th>
              <th class="text-center">Novize (+10)</th>
              <th class="text-center">Geselle (+15)</th>
              <th class="text-center">Experte (+20)</th>
              <th class="text-center text-amber-300">Meister (+30)</th>
              <th class="text-right text-acc">Gesamt bis Meister</th>
            </tr>
          </thead>
          <tbody>
            ${skMatrix.map(([cat,r1,r2,r3,r4,tot])=>`<tr>
              <td class="font-black text-acc">${cat}</td>
              <td class="text-center font-semibold">${r1}</td>
              <td class="text-center font-semibold">${r2}</td>
              <td class="text-center font-semibold">${r3}</td>
              <td class="text-center font-bold text-amber-300">${r4}</td>
              <td class="text-right font-black text-emerald-300">${tot}</td>
            </tr>`).join('')}
          </tbody>
        </table>
      </div>
    </section>

    <section class="space-y-2.5">
      <div class="flex flex-wrap items-center justify-between gap-2 pb-1.5 border-b bdr-line">
        <div class="flex items-center gap-2">
          <span class="px-2 py-0.5 rounded-md bg-acc-soft border bdr-acc text-acc text-[10px] font-black uppercase tracking-wider">Sektion 4</span>
          <h3 class="text-sm font-black tracking-tight">Kräfte, Basisaktionen &amp; Augmente</h3>
        </div>
      </div>
      <div class="subcard rounded-xl p-3 border bdr-line overflow-x-auto">
        <table class="tbl tabular text-xs">
          <thead>
            <tr>
              <th class="text-left">Stufe / Typ</th>
              <th class="text-center">SP-Kosten</th>
              <th class="text-center">MsP-Kosten</th>
              <th class="text-left">Verwendung</th>
            </tr>
          </thead>
          <tbody>
            ${pwRows.map(([tier,sp,msp,useTxt,tKey])=>{const isGrand=tKey==='grandios', isExz=tKey==='exzeptionell', rowCls=isGrand?'bg-amber-500/15':isExz?'bg-fuchsia-500/10':'', nameCls=isGrand?'text-amber-600 dark:text-amber-300':isExz?'text-fuchsia-600 dark:text-fuchsia-300':tKey==='marginal'?'text-emerald-600 dark:text-emerald-300':tKey==='fundamental'?'text-sky-600 dark:text-sky-300':'text-acc';return `<tr class="${rowCls}">
              <td class="font-black ${nameCls}">${tier}</td>
              <td class="text-center font-bold">${sp}</td>
              <td class="text-center font-black ${isGrand?'text-amber-600 dark:text-amber-300':'t-mut'}">${msp}</td>
              <td class="t-mut">${useTxt}</td>
            </tr>`;}).join('')}
          </tbody>
        </table>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div class="subcard rounded-xl p-3.5 border border-sky-500/45 bg-sky-500/10 space-y-1">
          <div class="font-black text-xs text-sky-300">🧩 Augment-Slots pro Kraft</div>
          <p class="text-xs t-mut leading-relaxed">Pro Kraft können bis zu <strong class="text-sky-200 tabular">3 Augmente</strong> direkt verknüpft werden.</p>
        </div>
        <div class="subcard rounded-xl p-3.5 border border-amber-400/55 bg-amber-500/10 space-y-1">
          <div class="font-black text-xs text-amber-300">👑 MsP-Limit pro Kraft-Gruppe</div>
          <p class="text-xs t-mut leading-relaxed">Eine Kraft und ihre verknüpften Augmente dürfen zusammen <strong class="text-amber-200">maximal 1 MsP</strong> kosten (also höchstens einen Eintrag des Rangs <strong>Grandios (Game Changer)</strong> in der gesamten Gruppe).</p>
        </div>
      </div>
    </section>

    <section class="subcard rounded-xl p-3.5 border border-sky-500/40 bg-sky-500/10 flex items-start gap-2.5">
      <span class="text-base leading-none shrink-0 mt-0.5">ℹ️</span>
      <div class="space-y-0.5 text-xs leading-relaxed">
        <div class="font-black text-sky-300">Hinweis zur Steigerungschronik</div>
        <p class="t-mut">Im Tab <strong class="text-acc">„4. Steigerungschronik &amp; Log“</strong> werden alle SP- und MsP-Ausgaben automatisch summiert. Einzelkosten (z. B. für geschenkte Trainings oder Spielleiter-Boni) können dort bei Bedarf jederzeit manuell überschrieben werden.</p>
      </div>
    </section>
  </div>`;
}

function buildInfoGlossaryGridState(rawQuery=UI.glossSearch){
  const raw=String(rawQuery||''), q=raw.trim().toLowerCase();
  const total=GLOSSARY.length;
  const filtered=GLOSSARY.map(item=>[item[0]||'',item[1]||'',item[2]||'',item[3]||'Sonstiges']).filter(([a,n,d,c])=>{
    if(!q) return true;
    return (`${a} ${n} ${d} ${c}`).toLowerCase().includes(q);
  });
  const extraCats=[...new Set(filtered.map(x=>x[3]).filter(c=>!GLOSSARY_CATS.includes(c)))];
  const catOrder=[...GLOSSARY_CATS,...extraCats];
  const sectionsHtml=catOrder.map(cat=>{
    const items=filtered.filter(x=>x[3]===cat);
    if(!items.length) return '';
    return `<section class="space-y-2">
      <div class="flex items-center justify-between gap-2 pb-1 border-b bdr-line">
        <h3 class="text-[11px] font-extrabold uppercase tracking-wider text-acc">${esc(cat)}</h3>
        <span class="text-[10px] font-bold t-mut tabular">${items.length}</span>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-2.5">${items.map(([a,n,d])=>`<div class="subcard p-2.5 flex gap-2.5 min-w-0"><span class="px-2 py-0.5 rounded bg-acc-soft border bdr-acc text-acc font-black text-xs shrink-0 self-start">${esc(a)}</span><div class="min-w-0"><div class="font-extrabold text-xs">${esc(n)}</div><div class="text-xs t-mut leading-snug">${esc(d)}</div></div></div>`).join('')}</div>
    </section>`;
  }).filter(Boolean).join('');
  const gridHtml=sectionsHtml||`<div class="subcard border-dashed p-5 text-center text-xs t-mut">Keine Glossar-Einträge für „${esc(raw.trim())}“ gefunden.</div>`;
  return {total,count:filtered.length,gridHtml};
}
function renderInfoGlossaryHtml(){
  const st=buildInfoGlossaryGridState(UI.glossSearch);
  return `<div class="space-y-3">
    <div class="subcard p-2.5 flex flex-wrap items-center gap-2 bg-black/20">
      <div class="relative flex-1 min-w-0 w-full sm:w-auto sm:min-w-[200px] max-w-full">
        <input type="search" data-gloss-search="1" value="${esc(UI.glossSearch||'')}" placeholder="Glossar durchsuchen (Kürzel, Begriff, Beschreibung, Kategorie)..." class="inp w-full text-xs py-1.5 px-2.5"/>
      </div>
      <span id="glossCount" class="pill cursor-default text-[11px] py-0.5 px-2.5 tabular shrink-0">${st.count} / ${st.total} Begriffe</span>
    </div>
    <div id="glossGrid" class="space-y-4">${st.gridHtml}</div>
  </div>`;
}
function updateInfoGlossaryGridDOM(){
  const grid=$('glossGrid'), cnt=$('glossCount');
  if(!grid&&!cnt) return;
  const st=buildInfoGlossaryGridState(UI.glossSearch);
  if(grid) grid.innerHTML=st.gridHtml;
  if(cnt) cnt.textContent=`${st.count} / ${st.total} Begriffe`;
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

function spendResource(kind,id){
  const it=findPwItem(kind,id); if(!it) return;
  const actCosts=getActivePwUseCosts(it);
  const stToks=parseStatusTokens(it.effects);
  if(!actCosts.length&&!stToks.length) return;
  const nm=it.name||(kind==='augment'?'Augment':'Kraft');
  const grouped=new Map();
  actCosts.forEach(c=>{grouped.set(c.res,(grouped.get(c.res)||0)+toInt(c.amt,0));});
  const getCurPool=r=>{
    if(r==='ap') return toInt(S.secondary.apCurrent,0);
    if(r==='map') return toInt(S.secondary.mapCurrent,0);
    if(r==='lp') return toInt(S.secondary.lpCurrent,0);
    if(r==='mlp') return toInt(S.secondary.mlpCurrent,0);
    if(r==='cres') return toInt(S.customRes.current,0);
    if(r==='bst') return getEffBst();
    if(String(r).startsWith('ex_')){const ex=(S.extraSecList||[]).find(x=>'ex_'+x.id===r);return ex?toInt(ex.current,0):0;}
    return null;
  };
  for(const [r,reqAmt] of grouped.entries()){
    const curVal=getCurPool(r);
    if(curVal!==null&&curVal<reqAmt){
      toast(`⚠️ Nicht genügend ${getResLabel(r)} für „${nm}“ (benötigt: ${reqAmt}, verfügbar: ${curVal})!`);
      return;
    }
  }
  const costMsgs=[], logCostParts=[];
  for(const [r,reqAmt] of grouped.entries()){
    if(r==='ap') S.secondary.apCurrent=toInt(S.secondary.apCurrent,0)-reqAmt;
    else if(r==='map') S.secondary.mapCurrent=toInt(S.secondary.mapCurrent,0)-reqAmt;
    else if(r==='lp') S.secondary.lpCurrent=toInt(S.secondary.lpCurrent,0)-reqAmt;
    else if(r==='mlp') S.secondary.mlpCurrent=toInt(S.secondary.mlpCurrent,0)-reqAmt;
    else if(r==='cres') S.customRes.current=toInt(S.customRes.current,0)-reqAmt;
    else if(r==='bst'){const nb=getBstBase()-reqAmt;S.bst=nb;S.bstOvr=String(nb);}
    else if(String(r).startsWith('ex_')){const ex=(S.extraSecList||[]).find(x=>'ex_'+x.id===r);if(ex)ex.current=toInt(ex.current,0)-reqAmt;}
    const afterVal=getCurPool(r);
    costMsgs.push(`−${reqAmt} ${getResLabel(r)}`);
    logCostParts.push(`−${reqAmt} ${getResLabel(r)}${afterVal!==null?` (verbleibend: ${afterVal})`:''}`);
  }
  const logParts=[...logCostParts];
  const actNames=[];
  if(stToks.length){
    withPoolSync(()=>{
      stToks.forEach(tk=>{
        const def=STATUS_DEFS.find(d=>d.k===tk.statusKey);
        if(!def) return;
        if(!S.statusEffects[def.k]) S.statusEffects[def.k]={active:false,stacks:1,iniDir:def.k==='abgelenkt'?-1:1,statOvr:'',advOvr:''};
        S.statusEffects[def.k].active=true;
        S.statusEffects[def.k].stacks=Math.max(1,toInt(tk.stacks,1));
        if(def.hasIniChoice){
          UI.statusIniPromptKey=def.k;
          UI.tab1.status=false;
          S.statusCollapsed=false;
        }
        actNames.push(`${def.name}${tk.stacks>1?` (${tk.stacks}×)`:''}`);
      });
    });
    if(actNames.length) logParts.push(`Status aktiviert: ${actNames.join(', ')}`);
  }
  logChron(`Einsatz "${nm}": ${logParts.join(' • ')}.`);
  syncDiceFromSheet(); renderHeader(); renderMain(); renderDice(); save();
  const toastCostPart=costMsgs.length?`(${costMsgs.join(', ')})`:'';
  const toastStPart=actNames.length?`• Status ${actNames.join(', ')} aktiv!`:'';
  toast(`⚡ „${nm}“ eingesetzt ${toastCostPart} ${toastStPart}`.replace(/\s+/g,' ').trim());
}

function compressImg(file,maxDim,q,cb){
  if(!file) return;
  const rd=new FileReader();
  rd.onload=ev=>{const im=new Image();im.onload=()=>{let w=im.width||1,h=im.height||1;if(w>maxDim||h>maxDim){if(w>h){h=Math.round(h*maxDim/w);w=maxDim;}else{w=Math.round(w*maxDim/h);h=maxDim;}}const cv=document.createElement('canvas');cv.width=w;cv.height=h;cv.getContext('2d').drawImage(im,0,0,w,h);let out=cv.toDataURL('image/webp',q);if(!out.startsWith('data:image/webp'))out=cv.toDataURL('image/jpeg',q);cb(out);};im.onerror=()=>cb(String(ev.target.result||''));im.src=String(ev.target.result||'');};
  rd.readAsDataURL(file);
}
function compressIconImg(file, maxDim = 128, q = 0.86, cb){
  if(!file) return;
  const rd=new FileReader();
  rd.onload=ev=>{
    const rawUrl=String(ev.target.result||'');
    if(file.type==='image/svg+xml' && file.size<=32768){
      cb(rawUrl);
      return;
    }
    const im=new Image();
    im.onload=()=>{
      let w=im.width||1, h=im.height||1;
      if(w>maxDim||h>maxDim){
        if(w>h){h=Math.max(1,Math.round(h*maxDim/w));w=maxDim;}
        else{w=Math.max(1,Math.round(w*maxDim/h));h=maxDim;}
      }
      const cv=document.createElement('canvas');
      cv.width=w; cv.height=h;
      const ctx=cv.getContext('2d');
      ctx.clearRect(0,0,w,h);
      ctx.drawImage(im,0,0,w,h);
      let out=cv.toDataURL('image/webp',q);
      if(!out.startsWith('data:image/webp')) out=cv.toDataURL('image/png');
      cb(out);
    };
    im.onerror=()=>cb(rawUrl);
    im.src=rawUrl;
  };
  rd.readAsDataURL(file);
}

function upsertSkill(name,linkedAttr,cat,rank,src,bonusOvr='',secId=''){
  const clean=String(name||'').trim(); if(!clean){toast('Bitte Fertigkeitsnamen eingeben.');return;}
  const r=Math.max(0,Math.min(4,toInt(rank,1))), c=SK_CATS[cat]?cat:'fundamental', ak=ATTRS.some(a=>a.k===linkedAttr)?linkedAttr:'PR', auto=calcAutoSkCost(c,r);
  const bOvr=String(bonusOvr??'').trim()!==''?String(toInt(bonusOvr,0)):'';
  const sId=secId&&S.skillSections.some(s=>s.id===secId)?secId:'';
  const ex=S.skills.find(s=>s.name.trim().toLowerCase()===clean.toLowerCase());
  if(ex){ex.name=clean;ex.category=c;ex.rank=r;if(linkedAttr)ex.linkedAttr=ak;if(bOvr!=='')ex.bonusOvr=bOvr;if(sId)ex.sectionId=sId;if(!ex.manualCost){ex.customSp=auto.sp;ex.customMsp=auto.msp;}logChron(`Fertigkeit aktualisiert (${src}): "${clean}" → ${SK_RANKS[r].n} (${ex.linkedAttr}).`);}
  else{S.skills.push({id:uid(),name:clean,color:'',bgColor:'',linkedAttr:ak,category:c,rank:r,bonusOvr:bOvr,sectionId:sId,manualCost:false,customSp:auto.sp,customMsp:auto.msp,notes:''});logChron(`Fertigkeit erworben (${src}): "${clean}" [${ak}] (${SK_RANKS[r].n}).`);}
  syncDiceFromSheet(); renderAll(); toast(`"${clean}" gespeichert`);
}

function applyEp(val,lbl){
  const ep=Math.max(0,toInt(val,0));
  if(ep>=100){const g=Math.floor(ep/100),rem=ep%100,old=S.progression.level;S.progression.level=Math.max(1,old+g);S.progression.ep=rem;logChron(`${lbl}: Stufenaufstieg ${old} → ${S.progression.level}!`);toast(`Stufe ${S.progression.level} erreicht!`);}
  else{S.progression.ep=ep;logChron(`${lbl} (EP: ${ep}/100).`);}
}

function addCustomPwTagFromInput(kind,id){
  const it=findPwItem(kind,id); if(!it) return;
  const inp=document.querySelector(`[data-new-pw-tag-inp="${kind}:${id}"]`);
  const raw=String(inp?.value||'').trim();
  if(!raw) return;
  if(isReservedPwTerm(raw)){
    toast(`„${raw}“ gehört zu Hauptaktionsart / Aktionsunterarten und kann nicht als Tag angelegt werden.`);
    return;
  }
  const canon=DEF_PW_TAGS.find(t=>t.toLowerCase()===raw.toLowerCase())||(S.pwTagList||[]).find(t=>t.toLowerCase()===raw.toLowerCase())||raw;
  S.pwTagList=sortAlpha([...(S.pwTagList||DEF_PW_TAGS),canon].filter(t=>!isReservedPwTerm(t)));
  
  if(!Array.isArray(it.tags)) it.tags=[];
  if(!it.tags.some(t=>t.toLowerCase()===canon.toLowerCase())) it.tags.push(canon);
  if(inp) inp.value='';
  save(); renderMain();
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
    case 'set-dice-wcat': {const wc=el.dataset.wcat||'Normaler Test';D.wRollCat=wc;D.sitActive={};applyDiceAutoAdvDis(true);syncDiceFromSheet();renderDice();break;}
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
    case 'reset-dice': setD({...DICE_DEF,open:true,docked:D.docked,floating:D.floating,x:D.x,y:D.y,w:D.w,h:D.h,z:D.z}); if(isLobbyNeutralDice()) resetDiceToLobbyNeutral(); UI.lastRollHtml=''; UI.lastBlockBaseHtml=''; UI.lastBlockFollowRes=null; UI.lastSecretRollId=''; renderDice(); updateLobbyLiveDiceDOM(); break;
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
    case 'd-mode': if(el.dataset.mode==='direct')D.dDirect=getEffD();else{D.dAttr=getEffD();D.dSkill='0';} D.dMode=el.dataset.mode; renderDice(); break;
    case 'adv-step': {const r=applyDiceAutoAdvDis(false);D.advAdj=Math.max(-r.autoAdv,toInt(D.advAdj,0)+Number(el.dataset.d));applyDiceAutoAdvDis(false);renderDice();break;}
    case 'dis-step': {const r=applyDiceAutoAdvDis(false);D.disAdj=Math.max(-r.autoDis,toInt(D.disAdj,0)+Number(el.dataset.d));applyDiceAutoAdvDis(false);renderDice();break;}
    case 'reset-dice-diff': D.dMode='direct'; D.dDirect=40; D.dAttr=30; D.dSkill='10'; D.dCustom=25; renderDice(); break;
    case 'dice-set-diff': D.dMode='direct'; D.dDirect=toInt(el.dataset.val,40); renderDice(); break;
    case 'reset-dice-advdis': D.advAdj=0; D.disAdj=0; applyDiceAutoAdvDis(true); renderDice(); break;
    case 'cnt-step': D.cnt=Math.max(1,Math.min(10,D.cnt+Number(el.dataset.d))); renderDice(); break;
    case 'crit-step': {const T=calcThreshold(),i=CRIT_SEQ.indexOf(T.effCrit),ni=Math.max(0,Math.min(CRIT_SEQ.length-1,i+Number(el.dataset.d)));D.critOff=ni-T.autoCrit;D.crit=CRIT_SEQ[ni];renderDice();break;}
    case 'crit-mode': D.critMode=D.critMode==='range'?'exact':'range'; renderDice(); break;
    case 'roll-d100': executeDiceRoll(); break;
    case 'roll-block-followup': executeBlockFollowUpRoll(); break;
    case 'roll-blocked-hit-20': D.dMode='direct'; D.dDirect=20; executeDiceRoll({isAttackerBlockFollowUp:true}); break;
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
function handleAdminIconFileUpload(file, ikey){
  if(!CLOUD.isAdmin){toast('🔒 Nur der Admin kann Standard-Icons ändern.');return;}
  const key=String(ikey||'').trim();
  if(!key||!SYSTEM_ICON_DEFS.some(d=>d.key===key)) return;
  if(!file) return;
  const isImg=Boolean((file.type&&/^image\//i.test(file.type))||/\.(png|webp|svg|jpe?g|gif)$/i.test(file.name||''));
  if(!isImg){toast('⚠️ Bitte eine gültige Bilddatei (PNG, WebP, SVG, JPG, GIF) wählen.');return;}
  compressIconImg(file,128,0.86,url=>{
    if(!url){toast('⚠️ Bild konnte nicht verarbeitet werden.');return;}
    const next={...(CUSTOM_ICONS.icons||{}),[key]:url};
    UI.confirmResetAllIcons=false;
    saveCustomIconsToServer(next,'🎨 Custom-Icon auf dem Server gespeichert!');
  });
}
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

function performAdminUnlock(){
  const inp=$('inpAdminMasterPin');
  const pin=(inp?.value||'').trim();
  if(!pin){
    UI.adminPinError='Bitte Admin-Master-PIN eingeben.';
    if(UI.modal==='adminPanel'){renderModal();setTimeout(()=>$('inpAdminMasterPin')?.focus(),20);}
    toast('⚠️ Bitte Admin-Master-PIN eingeben.');
    return;
  }
  if(!CLOUD.registry.adminHash){
    CLOUD.registry.adminHash=simpleHash(pin);
    CLOUD.isAdmin=true;
    UI.adminPinError='';
    try{localStorage.setItem('scherbensturm_cloud_admin','1');}catch(e){}
    refreshUserNotificationsBg(false);
    syncCloudRegistry(true);
    renderHeader(); renderMain(); renderModal(false,true);
    if(D.open) renderDice();
    updateLobbyLiveDiceDOM();
    toast('👑 Admin-Master-PIN gespeichert & Admin-Modus aktiviert!');
  }else if(simpleHash(pin)===CLOUD.registry.adminHash){
    CLOUD.isAdmin=true;
    UI.adminPinError='';
    try{localStorage.setItem('scherbensturm_cloud_admin','1');}catch(e){}
    refreshUserNotificationsBg(false);
    renderHeader(); renderMain(); renderModal(false,true);
    if(D.open) renderDice();
    updateLobbyLiveDiceDOM();
    toast('👑 Admin-Modus freigeschaltet!');
  }else{
    UI.adminPinError='Falsche Admin-Master-PIN. Bitte erneut versuchen.';
    if(UI.modal==='adminPanel'){
      renderModal();
      setTimeout(()=>{const p=$('inpAdminMasterPin');if(p){p.value='';p.focus();}},20);
    }
    toast('🔒 Falsche Admin-Master-PIN.');
  }
}
function performAdminChangePin(){
  if(!CLOUD.isAdmin) return;
  const inp=$('inpNewAdminPin');
  const np=(inp?.value||'').trim();
  if(!np){toast('⚠️ Bitte neue Master-PIN eingeben.');inp?.focus();return;}
  CLOUD.registry.adminHash=simpleHash(np);
  if(inp) inp.value='';
  syncCloudRegistry(true);
  renderModal();
  toast('👑 Neue Admin-Master-PIN im Backend gespeichert!');
}
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
    targetField=D.dMode==='direct'?'dDirect':'dAttr';
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
  if(e.key==='Escape'){if(CTX_MENU.open){closeCtxMenu();}else if(UI.openPwMenu){closePwDropdown();}else if(UI.modal){closeActiveModal();}else if(D.open&&!D.docked){D.open=false;renderHeader();renderDice();}else if(CN.open&&!CN.docked){CN.open=false;renderHeader();renderCampNotes();}}
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
  updatePwDynPreviewDOM
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
