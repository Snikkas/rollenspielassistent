import {
  DEF_WEAPON_TAGS, DEF_ARMOR_TAGS, ATTR_GROUPS, STATUS_DEFS, SYSTEM_ICON_DEFS, SEC_META, DEF_PW_TAGS, PW_TIERS, PW_TIER_BADGE_CLS, TABS, COL_PRESETS, PALETTES, GLOSSARY_CATS, GLOSSARY, WIN_DEFAULTS, DEF_FB_FOLDERS, THEME_BG_SYNC_LIMIT, DUAL_COL_TARGETS
} from './constants.js';
import {
  $, uid, stamp, esc, clone, toInt, fmtSign, isHex, sortAlpha, stripHtml, toRtfHtml, simpleHash
} from './utils.js';
import {
  hooks
} from './ui-hooks.js';
import {
  renderSystemIconHtml, syncBodyScrollLock, bindSwipeDownClose, closeCtxMenu, openCtxMenu, applyWinFrame, renderWinCtrlBtns, renderWinResizeHandles, setModalSwipeCleanup, cleanupModalSwipe, isOversizedBgDataUrl, compressBgDataUrlForProfile, getCampaigns, isGlobalGM, canManageCampaign, canToggleEnemyStatus, isEnemySheet, getEnemyMeta, canManageEnemySheet, isEnemyDiceVisibleInCampaign, ensureUserRecord, ensureAllRegistryUsers, findUserKeyByName, findUserKeyById, getUserAvatar, canViewUserProfile, renderUserNamePill, saveRegistryLocal, getCampaignFilteredDiceFeed, captureScrollState, restoreScrollState, toast, save, persistCurrentThemeChange, applyTheme, CUSTOM_ICONS, getPwTermTip, fmtCustomValSummarySuffix, syncEquipmentToInventory, S, D, CN, LD, FBW, isMobileLayout, CTX_MENU, UI, PATCHNOTES, FEEDBACK, CLOUD, CLOUD_SYNC, PWLIB, getCharOwner, getEditStyleSlot
} from './state.js';
import {
  formatPwUseCosts, getEffectivePoolCap, getReservedSrcList, calcActiveMods, buildPowerExportPack, getSuggestedAugmentsForPower, calcPwCost, calcProg, getPwSecOptionsFlat, cresName, getResLabel, getLpRegen, getMlpRegen, findPwItem, findEqItem
} from './calc.js';
import {
  updateLobbyLiveDiceDOM, syncCloudRegistry, renderCloudSyncBadgeHtml, getAllLibraryPacks, getSortedPatchnoteEntries, getNewestPatchnoteId, isPatchnoteCollapsed, saveCustomIconsToServer, renderNotifBellBtnHtml, renderNotifsModalHtml, refreshUserNotificationsBg, isSecretRollActive, fetchTrashedCharacters
} from './cloud.js';
import {
  renderDice
} from './dice.js';
import {
  renderRtfToolbarHtml
} from './notes.js';

export function openUserProfile(targetUser){
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
export function ensureProfileModalAccess(){
  if(UI.modal==='userProfile'){
    const raw=String(UI.profileUser||'').trim();
    const key=findUserKeyByName(raw)||findUserKeyById(raw);
    if(!key||!canViewUserProfile(key)||!CLOUD.registry?.users?.[key]||CLOUD.registry.users[key]._deleted){
      UI.modal=null;
      UI.profileUser='';
    }
  }
}
export function closeActiveModal(){
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
export function renderFbMiniChatHtml(item, asAdmin=false){
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
export function renderFbAdminPanelHtml(inExtraWin=false){
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
export function renderFbAdminWin(){
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
export function renderFbStatusBadge(b, activeItem=null){
  const hasAdminReply=Boolean(activeItem&&((toInt(activeItem.lastAdminReplyMs,0)>0)||(Array.isArray(activeItem.messages)&&activeItem.messages.some(m=>m&&m.isAdmin))));
  const rawSt=String(b?.status||'open').trim().toLowerCase();
  const effSt=(rawSt==='open'&&hasAdminReply)?'answered':rawSt;
  const closedSuffix=b?.closedAt?` (${esc(b.closedAt)})`:'';
  if(effSt==='deleted') return `<span class="px-2 py-0.5 rounded-full text-[11px] font-extrabold bg-rose-500/20 text-rose-300 border border-rose-500/40">🗑️ Gelöscht${closedSuffix}</span>`;
  if(effSt==='resolved'||effSt==='done') return `<span class="px-2 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">✅ Erledigt${closedSuffix}</span>`;
  if(effSt==='answered') return `<span class="px-2 py-0.5 rounded-full text-[11px] font-extrabold bg-sky-500/20 text-sky-300 border border-sky-400/50">💬 Beantwortet</span>`;
  return `<span class="px-2 py-0.5 rounded-full text-[11px] font-extrabold bg-amber-500/20 text-amber-300 border border-amber-400/50">🟡 Offen</span>`;
}
export function renderFbBacklogPanelHtml(){
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
export function renderFeedbackModalHtml(){
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
export function buildHdrPillsHtml(P,M=calcActiveMods()){
  const spTip=`Steigerungspunkte (aufgewendet / gesamt)\n• Basis (Stufe ${P.lvl}): ${P.baseSp} SP${P.bonusSp?`\n• Bonus-SP: ${fmtSign(P.bonusSp)} SP`:''}${P.spMod?`\n• SP-Mod (Effekte): ${fmtSign(P.spMod)} SP\n${P.spModSrc}`:''}\nNoch frei verfügbar: ${P.spRem} SP`;
  return `<div class="flex flex-wrap items-center gap-1 sm:gap-1.5">
    <button type="button" data-action="switch-tab" data-tab="chronicle" data-tip="Charakterstufe\nPro Stufe: +5 SP\nJede 10. Stufe: +1 MsP" class="pill py-0.5 px-2 text-[11px]">Stufe <span class="text-acc">${P.lvl}</span></button>
    <button type="button" data-action="switch-tab" data-tab="chronicle" data-tip="Erfahrungspunkte\nJe 100 EP = +1 Stufe (mit Rest-Übertrag)\nPro Stufe: +5 SP • Jede 10. Stufe: +1 MsP" class="pill py-0.5 px-2 text-[11px]">EP: <span>${S.progression.ep}/100</span></button>
    <button type="button" data-action="switch-tab" data-tab="chronicle" data-tip="${esc(spTip)}" class="pill py-0.5 px-2 text-[11px] ${P.spRem<0?'!border-rose-500 !bg-rose-500/15 text-rose-500':''}">SP: <span>${P.spSpent}/${P.totSp}</span></button>
    <button type="button" data-action="switch-tab" data-tab="chronicle" data-tip="Meisterschaftspunkte (aufgewendet / gesamt)\nNoch frei verfügbar: ${P.mspRem} MsP" class="pill py-0.5 px-2 text-[11px] ${P.mspRem<0?'!border-rose-500 !bg-rose-500/15 text-rose-500':''}">MsP: <span>${P.mspSpent}/${P.totMsp}</span></button>
  </div>`;
}

export function syncHdrCtxBtnState(){
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

export function openSheetCtxMenu(anchorEl){
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

export function openLobbyCtxMenu(anchorEl){
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

export function renderPhaseToggleHtml(compact = false){
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
export function renderHeader(){
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
  const P=calcProg(), hasAv=Boolean(S.profile.avatar), pwTot=S.powers.length+S.augments.length, sheetIsEnemy=isEnemySheet(S), charDispName=String(S.profile.name||'').trim()||(sheetIsEnemy?'Unbenannter Gegner':'Unbenannter Held');
  const metaSub=[String(S.profile.ancestry||'').trim(),String(S.profile.concept||'').trim()].filter(Boolean).join(' • ');
  const sheetMenuOpen=Boolean(CTX_MENU.open&&CTX_MENU.key==='hdr-sheet-menu');
  const viewBanner=CLOUD.viewingRemote?`<div class="bg-sky-500/20 border-b border-sky-400/50 px-3 sm:px-4 py-2 text-xs"><div class="max-w-[1600px] mx-auto flex flex-wrap items-center justify-between gap-2"><div class="font-extrabold text-sky-300 flex flex-wrap items-center gap-x-2 gap-y-0.5 min-w-0 break-words"><span>👁️ 👄 👁️ ANSICHTSMODUS:</span><span>Du betrachtest gerade <strong>„${esc(S.profile.name||'Unbenannt')}“</strong> (Stufe ${P.lvl}) aus der Lobby.</span></div><div class="flex flex-wrap items-center gap-1.5 w-full sm:w-auto max-w-full"><button type="button" data-action="cloud-reload-view" class="btn py-1 px-2 sm:px-2.5 text-xs border-sky-400/50 text-sky-200 max-w-full">🔄 Aktualisieren</button><button type="button" data-action="cloud-adopt-copy" data-tip="Übernimmt diesen Charakter als neuen eigenen Bogen in deinen lokalen Speicher" class="btn btn-ok py-1 px-2 sm:px-2.5 text-xs max-w-full">📥 Als Kopie übernehmen</button><button type="button" data-action="cloud-exit-view" class="btn btn-pri py-1 px-2.5 sm:px-3 text-xs max-w-full">🔙 Zurück zur Lobby</button></div></div></div>`:'';
  const enemyBanner=sheetIsEnemy?(()=>{
    const em=getEnemyMeta(S.charId);
    const allCamps=getCampaigns();
    const campMap=new Map(allCamps.map(c=>[c.id,c.name||'Kampagne']));
    const assigned=em.campaignIds.map(id=>({id,name:campMap.get(id)||id,vis:isEnemyDiceVisibleInCampaign(S.charId,id)}));
    const canToggle=!CLOUD.viewingRemote&&canToggleEnemyStatus();
    const canManage=!CLOUD.viewingRemote&&canManageEnemySheet(S.charId);
    const quickCampId=canToggle&&em.isEnemy&&!em.archived
      ?((CLOUD.activeCampaignId&&em.campaignIds.includes(CLOUD.activeCampaignId)&&canManageCampaign(CLOUD.activeCampaignId))
        ?CLOUD.activeCampaignId
        :(em.campaignIds.find(id=>canManageCampaign(id))||''))
      :'';
    const quickVis=quickCampId?isEnemyDiceVisibleInCampaign(S.charId,quickCampId):false;
    const quickCampName=quickCampId?(campMap.get(quickCampId)||'Kampagne'):'';
    const barCls=em.isEnemy?'bg-rose-500/15 border-b border-rose-400/45':'bg-purple-500/15 border-b border-purple-400/45';
    return `<div class="${barCls} px-2.5 sm:px-5 lg:px-8 py-1.5 text-xs"><div class="max-w-[1600px] mx-auto flex flex-wrap items-center justify-between gap-2 min-w-0">
      <div class="flex flex-wrap items-center gap-1.5 min-w-0">
        <span class="px-2 py-0.5 rounded-md text-[11px] font-black shrink-0 ${em.isEnemy?'bg-rose-500/25 text-rose-200 border border-rose-400/55':'bg-purple-500/25 text-purple-200 border border-purple-400/55'}">${em.isEnemy?'👹 GEGNERBOGEN':'📋 GEGNER-VORLAGE'}</span>
        ${em.category?`<span class="px-1.5 py-0.5 rounded text-[10px] font-bold bg-black/30 text-amber-200 border border-amber-400/35 truncate max-w-[140px]">${esc(em.category)}</span>`:''}
        ${em.archived?`<span class="px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-slate-500/30 text-slate-200 border border-slate-400/45 shrink-0">📦 Wegsortiert</span>`:''}
        ${assigned.length?assigned.map(c=>`<span class="px-1.5 py-0.5 rounded text-[10px] font-bold border max-w-[160px] truncate ${c.vis?'bg-emerald-500/20 text-emerald-200 border-emerald-400/50':'bg-black/30 t-mut bdr-line'}">${c.vis?'👁️':'📁'} ${esc(c.name)}</span>`).join(''):`<span class="text-[11px] t-mut hidden sm:inline">Noch keiner Kampagne zugeordnet</span>`}
      </div>
      <div class="flex flex-wrap items-center gap-1.5 shrink-0 max-w-full">
        ${canToggle?`<button type="button" role="switch" aria-checked="${em.isEnemy?'true':'false'}" data-action="toggle-enemy-active" data-id="${esc(S.charId)}" data-tip="Vorlage als Gegner aktivieren oder deaktivieren" class="btn py-1 px-2 text-[11px] font-black ${em.isEnemy?'!border-rose-400 !bg-rose-500/25 text-rose-200':''}">${em.isEnemy?'👹 Gegner: AN':'📋 Vorlage'}</button>
        <button type="button" data-action="open-enemy-camp-picker" data-id="${esc(S.charId)}" aria-haspopup="menu" data-tip="Kampagnen per Mehrfachauswahl (Checkboxen) zuordnen" class="btn py-1 px-2 text-[11px] font-extrabold">🗺️ Kampagnen (${assigned.length})</button>`:''}
        ${quickCampId?`<button type="button" role="switch" aria-checked="${quickVis?'true':'false'}" data-action="toggle-enemy-dice-vis" data-id="${esc(S.charId)}" data-camp="${esc(quickCampId)}" data-tip="Sichtbarkeit im Würfelassistenten für „${esc(quickCampName)}“ umschalten" class="btn py-1 px-2 text-[11px] font-black ${quickVis?'!border-emerald-400 !bg-emerald-500/25 text-emerald-200':''}">${quickVis?'👁️ Würfel: AN':'🙈 Würfel: AUS'}</button>`:''}
        ${canManage?`<button type="button" data-action="toggle-enemy-archive" data-id="${esc(S.charId)}" data-tip="${em.archived?'Aus Archiv wiederherstellen':'Wegsortieren (Archivieren)'}" class="btn py-1 px-2 text-[11px] font-bold">${em.archived?'↩️ Aktivieren':'📦 Wegsortieren'}</button>`:''}
        ${!CLOUD.viewingRemote?`<button type="button" data-action="open-lobby" class="btn py-1 px-2 text-[11px] font-extrabold">🏠 Lobby</button>`:''}
      </div>
    </div></div>`;
  })():'';
  $('hdrMount').innerHTML=`<div class="h-1 w-full accent-bar"></div>${viewBanner}${enemyBanner}<header class="hdr-glass"><div class="max-w-[1600px] mx-auto px-2.5 sm:px-5 lg:px-8 py-1.5 sm:py-2 flex flex-col gap-1.5 sm:gap-2">
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

export const getColTargetObj=()=>UI.colTarget==='pw'?findPwItem(UI.colPwKind,UI.colPwId):UI.colTarget==='sec-folder'?S.powerSections.find(s=>s.id===UI.colPwId):UI.colTarget==='sksec-folder'?S.skillSections.find(s=>s.id===UI.colPwId):UI.colTarget==='invsec-folder'?(S.invSections||[]).find(s=>s.id===UI.colPwId):UI.colTarget==='sk-item'?S.skills.find(s=>s.id===UI.colPwId):UI.colTarget==='eq'?findEqItem(UI.colPwKind,UI.colPwId):UI.colTarget==='chrsec'?S.chrSecMeta?.[UI.colPwId]:UI.colTarget==='camp'?getCampaigns().find(c=>c.id===UI.colPwId):UI.colTarget==='eqsec'?S.equipSecMeta?.[UI.colPwId]:null;
export const openDualColorModal=(target,id,cmode,kind='')=>{UI.colTarget=target;UI.colPwKind=kind;UI.colPwId=id;UI.colMode=cmode==='bg'?'bg':'text';const it=getColTargetObj();if(!it)return;const cur=UI.colMode==='bg'?it.bgColor:it.color;UI.colDraft=isHex(cur)?cur:(UI.colMode==='bg'?'#1e293b':'#38bdf8');UI.modal='color';renderModal();};
export const modalShell=(title,sub,body,foot,maxW='max-w-2xl',extra='')=>`<div data-action="close-modal-bg" class="modal-backdrop"><div class="card modal-panel ${maxW} p-0 shadow-2xl"><div class="modal-hdr z-10 flex items-start sm:items-center justify-between gap-2 px-3.5 sm:px-5 pb-3 sm:pb-3.5 border-b bdr-line shrink-0" style="background:var(--surf2)">${(String(title||'').trim()||String(sub||'').trim())?`<div class="min-w-0 flex-1"><h2 class="text-base sm:text-lg font-extrabold break-words">${title}</h2>${sub?`<p class="text-xs t-mut break-words">${sub}</p>`:''}</div><div class="flex flex-wrap items-center justify-end gap-1.5 shrink-0">${extra}<button type="button" data-action="close-modal" aria-label="Schließen" class="btn min-w-[36px] min-h-[36px] sm:min-w-0 sm:min-h-0 py-1 px-2.5 font-black shrink-0">✕</button></div>`:`${extra?`<div class="flex-1 min-w-0 flex flex-wrap items-center gap-1.5">${extra}</div>`:'<div class="flex-1 min-w-0"></div>'}<button type="button" data-action="close-modal" aria-label="Schließen" class="btn min-w-[36px] min-h-[36px] sm:min-w-0 sm:min-h-0 py-1 px-2.5 font-black shrink-0">✕</button>`}</div><div class="modal-body p-3.5 sm:p-5 space-y-4 text-xs sm:text-sm min-w-0${String(foot||'').trim()?'':' safe-pb'}">${body}</div>${String(foot||'').trim()?`<div class="modal-foot z-10 px-3.5 sm:px-5 pt-3 border-t bdr-line flex flex-wrap items-center justify-end gap-2 shrink-0" style="background:var(--surf2)">${foot}</div>`:''}</div></div>`;

export function formatPwLibImportToast(res,label=''){
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
export function renderPwLibImportOptsHtml(){
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
export function refreshPwLibListDOM(){
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
export function renderPwLibPackListHtml(){
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
export function buildAdminDraftPack(){
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

export function getImgMenuContext(kindOverride,idOverride){
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
export function openImgMenu(kind,id='',returnModal=''){
  UI.imgTargetKind=String(kind||'');
  UI.imgTargetId=String(id||'');
  UI.imgReturnModal=String(returnModal||'');
  const ctx=getImgMenuContext();
  if(!ctx||(!ctx.canEdit&&!ctx.url)) return;
  UI.imgZoomOpen=!ctx.canEdit&&Boolean(ctx.url);
  UI.modal='imgMenu';
  renderModal();
}
export function applyImgUrlForContext(ctx,url,fromDrop=false){
  if(!ctx||!ctx.canEdit||!url) return;
  const dSfx=fromDrop?' per Drag & Drop':'';
  if(ctx.kind==='avatar'){
    S.profile.avatar=url; renderHeader(); save(); toast(`Profilbild${dSfx} gespeichert`);
  }else if(ctx.kind==='lobbyLogo'){
    CLOUD.registry.lobbyLogo=url; saveRegistryLocal(); renderHeader(); hooks.renderMain?.(); syncCloudRegistry(true); toast(`🖼️ Lobby-Bild${dSfx} für alle aktualisiert!`);
  }else if(ctx.kind==='campImg'){
    const camp=getCampaigns().find(c=>c.id===(ctx.id||CLOUD.activeCampaignId));
    if(camp){camp.img=url; saveRegistryLocal(); hooks.renderMain?.(); syncCloudRegistry(true); toast(`🖼️ Kampagnenbild${dSfx} gespeichert!`);}
  }else if(ctx.kind==='userAvatar'){
    const key=findUserKeyByName(ctx.id)||findUserKeyById(ctx.id);
    if(!key||!canViewUserProfile(key)||!CLOUD.registry?.users?.[key]||CLOUD.registry.users[key]._deleted) return;
    CLOUD.registry.users[key].avatar=url;
    saveRegistryLocal();
    syncCloudRegistry(true);
    renderHeader();
    hooks.renderMain?.();
    renderModal();
    toast(`🖼️ Profilbild für „${key}“${dSfx} gespeichert!`);
    return;
  }else if(['weapon','ammo','armor','inv'].includes(ctx.kind)){
    const k={weapon:'weapons',armor:'armors',ammo:'ammos',inv:'inventory'}[ctx.kind], it=(S[k]||[]).find(x=>x.id===ctx.id);
    if(it){
      it.img=url;
      if(ctx.kind==='inv'&&it.linkedEq){const src=findEqItem(it.linkedEq.kind,it.linkedEq.id);if(src)src.img=url;}
      syncEquipmentToInventory(S);
      hooks.renderMain?.(); save(); toast(`Gegenstandsbild${dSfx} gespeichert`);
    }
  }else if(ctx.kind==='bio'){
    const ex=ctx.id?(S.bioImages||[]).find(x=>x.id===ctx.id):null;
    if(ex){ex.url=url; hooks.renderMain?.(); save(); toast(`Aussehen-Bild${dSfx} aktualisiert`);}
    else{const nid=uid(); S.bioImages.push({id:nid,url,caption:''}); UI.imgTargetId=nid; if(UI.tab5)UI.tab5.bioGallery=false; hooks.renderMain?.(); save(); toast(`Aussehen-Bild${dSfx} importiert`);}
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
export function applyImgFileForCurrentTarget(file,fromDrop=false){
  const ctx=getImgMenuContext();
  if(!ctx||!ctx.canEdit) return;
  if(!file||!file.type.startsWith('image/')){toast('Bitte eine gültige Bilddatei auswählen oder hineinziehen.');return;}
  compressImg(file,ctx.maxDim,ctx.quality,url=>applyImgUrlForContext(ctx,url,fromDrop));
}
export function removeImgForCurrentTarget(){
  const ctx=getImgMenuContext();
  if(!ctx||!ctx.canEdit||!ctx.url) return;
  if(ctx.kind==='avatar'){
    S.profile.avatar=''; renderHeader(); save(); toast('🗑️ Profilbild entfernt');
  }else if(ctx.kind==='lobbyLogo'){
    CLOUD.registry.lobbyLogo=''; saveRegistryLocal(); renderHeader(); hooks.renderMain?.(); syncCloudRegistry(true); toast('🗑️ Lobby-Bild entfernt.');
  }else if(ctx.kind==='campImg'){
    const camp=getCampaigns().find(c=>c.id===(ctx.id||CLOUD.activeCampaignId));
    if(camp){camp.img=''; saveRegistryLocal(); hooks.renderMain?.(); syncCloudRegistry(true); toast('🗑️ Kampagnenbild entfernt.');}
  }else if(ctx.kind==='userAvatar'){
    const key=findUserKeyByName(ctx.id)||findUserKeyById(ctx.id);
    if(key&&canViewUserProfile(key)&&CLOUD.registry?.users?.[key]&&!CLOUD.registry.users[key]._deleted){
      CLOUD.registry.users[key].avatar='';
      saveRegistryLocal();
      syncCloudRegistry(true);
      renderHeader();
      hooks.renderMain?.();
      toast('🗑️ Profilbild entfernt.');
    }
  }else if(['weapon','ammo','armor','inv'].includes(ctx.kind)){
    const k={weapon:'weapons',armor:'armors',ammo:'ammos',inv:'inventory'}[ctx.kind], it=(S[k]||[]).find(x=>x.id===ctx.id);
    if(it){
      it.img='';
      if(ctx.kind==='inv'&&it.linkedEq){const src=findEqItem(it.linkedEq.kind,it.linkedEq.id);if(src)src.img='';}
      syncEquipmentToInventory(S);
      hooks.renderMain?.(); save(); toast('🗑️ Gegenstandsbild entfernt.');
    }
  }else if(ctx.kind==='bio'){
    S.bioImages=S.bioImages.filter(im=>im.id!==ctx.id); hooks.renderMain?.(); save(); toast('🗑️ Aussehen-Bild entfernt.');
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

export function renderPatchnotesTabHtml(){
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
export function getActiveModalScrollKey(){
  if(!UI.modal) return '';
  return `${UI.modal}:${UI.modal==='adminPanel'?(CLOUD.isAdmin?'1':'0'):''}:${UI.infoTab||''}:${FEEDBACK.activeTab||''}:${PWLIB.tab||''}:${UI.listType||''}:${UI.profileUser||''}`;
}
export function openAdminPanel(){
  closeCtxMenu();
  CLOUD.showAdminBar=false;
  CLOUD.confirmPermDelTrashId=null;
  CLOUD.confirmEmptyTrash=false;
  UI.adminReturnModal='';
  UI.adminPinError='';
  UI.modal='adminPanel';
  renderModal(false,true);
  if(CLOUD.isAdmin){
    fetchTrashedCharacters(true);
  }else{
    setTimeout(()=>{const p=$('inpAdminMasterPin');if(p){p.focus();}},40);
  }
}
export function renderAdminPanelModalHtml(){
  const mob=isMobileLayout();
  const hasHash=Boolean(CLOUD.registry?.adminHash);
  const isAdm=Boolean(CLOUD.isAdmin);
  const regUsers=Object.keys(CLOUD.registry?.users||{}).filter(k=>CLOUD.registry.users[k]&&!CLOUD.registry.users[k]._deleted).sort((a,b)=>a.localeCompare(b,'de'));
  const globalGms=Array.isArray(CLOUD.registry?.gmUsers)?[...new Set(CLOUD.registry.gmUsers.map(u=>String(u||'').trim()).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'de')):[];
  const allCamps=getCampaigns();
  const campNameMap=new Map(allCamps.map(c=>[c.id,c.name||'Kampagne']));
  const customIconCnt=Object.keys(CUSTOM_ICONS?.icons||{}).length;
  const fbItems=Array.isArray(FEEDBACK?.items)?FEEDBACK.items:[];
  const fbBacklog=Array.isArray(FEEDBACK?.backlog)?FEEDBACK.backlog:[];
  const trashedList=Array.isArray(CLOUD.trashedList)?CLOUD.trashedList:[];
  const logoUrl=String(CLOUD.registry?.lobbyLogo||'');
  const secAct=isSecretRollActive();
  const secRollCnt=Array.isArray(CLOUD.secretRolls)?CLOUD.secretRolls.length:0;

  const titleHtml=isAdm?'👑 Admin-Verwaltung':'👑 Admin-Anmeldung';
  const subHtml=isAdm
    ?'Zentrale Steuerung für Accounts, Spielleiter, Papierkorb, Icons, Feedback, Lobby-Logo &amp; Sicherheit'
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
    const trashSectionHtml=`<div class="subcard p-3.5 space-y-3 border ${trashedList.length?'border-rose-400/45 bg-rose-500/5':''}">
      <div class="flex flex-wrap items-center justify-between gap-2 border-b bdr-line pb-2">
        <div class="min-w-0">
          <div class="text-xs sm:text-sm font-black text-rose-300 flex items-center gap-1.5">
            <span>🗑️ Papierkorb (Gelöschte Charakterbögen)</span>
            <span class="px-2 py-0.5 rounded-full text-[10px] font-black tabular ${trashedList.length?'bg-rose-500/25 text-rose-200 border border-rose-400/50':'bg-black/25 t-mut border bdr-line'}">${trashedList.length}</span>
          </div>
          <div class="text-[11px] t-mut">Gelöschte Helden, Gegner &amp; Vorlagen landen zuerst hier und können wiederhergestellt oder endgültig entfernt werden.</div>
        </div>
        <div class="flex flex-wrap items-center gap-1.5 shrink-0">
          <button type="button" data-action="admin-refresh-trash" ${CLOUD.trashedLoading?'disabled':''} data-tip="Papierkorb vom Server neu laden" class="btn py-1 px-2 text-xs font-extrabold ${CLOUD.trashedLoading?'animate-spin':''}">🔄</button>
          ${trashedList.length?(CLOUD.confirmEmptyTrash
            ?`<span class="inline-flex items-center gap-1"><button type="button" data-action="admin-confirm-empty-trash" class="btn bg-rose-600 text-white border-rose-500 py-1 px-2.5 text-[11px] font-black">Alle ${trashedList.length} endgültig löschen? (2/2)</button><button type="button" data-action="admin-cancel-empty-trash" class="btn py-1 px-2 text-xs">✕</button></span>`
            :`<button type="button" data-action="admin-ask-empty-trash" class="btn btn-err py-1 px-2.5 text-[11px] font-extrabold">🔥 Papierkorb leeren</button>`):''}
        </div>
      </div>
      ${CLOUD.trashedError?`<div class="text-[11px] text-rose-300 font-bold bg-rose-500/10 rounded-lg p-2 border border-rose-500/35">⚠️ ${esc(CLOUD.trashedError)}</div>`:''}
      ${CLOUD.trashedLoading && !trashedList.length
        ?`<div class="text-xs t-mut text-center py-4">⏳ Lade Papierkorb vom Server...</div>`
        :(trashedList.length
          ?`<div class="space-y-2 max-h-72 overflow-y-auto pr-0.5" data-scroll-key="adminTrashList">${trashedList.map(ch=>{
            const isEn=ch.sheetType==='enemy';
            const typeBadge=isEn?(ch.enemyMeta?.isEnemy?'👹 Gegner':'📋 Vorlage'):'👤 Held';
            const campNm=campNameMap.get(ch.campaignId||'default')||'Allgemein';
            const isConfirm=CLOUD.confirmPermDelTrashId===ch.id;
            return `<div class="p-2.5 rounded-xl bg-black/25 border bdr-line flex flex-wrap items-center justify-between gap-2.5 text-xs min-w-0">
              <div class="flex items-center gap-2.5 min-w-0 flex-1">
                <div class="w-9 h-9 rounded-lg overflow-hidden border bdr-line bg-black/35 shrink-0 flex items-center justify-center">
                  ${ch.avatar?`<img src="${ch.avatar}" class="w-full h-full object-cover" alt=""/>`:`<span class="text-sm leading-none">${isEn?'👹':'👤'}</span>`}
                </div>
                <div class="min-w-0 flex-1">
                  <div class="flex flex-wrap items-center gap-1.5 min-w-0">
                    <span class="font-black text-xs sm:text-sm truncate">${esc(ch.name||'Unbenannter Charakter')}</span>
                    <span class="px-1.5 py-0.2 rounded text-[10px] font-extrabold ${isEn?'bg-rose-500/20 text-rose-200 border border-rose-400/40':'bg-acc-soft text-acc border bdr-acc'} shrink-0">${typeBadge}</span>
                    <span class="px-1.5 py-0.2 rounded text-[10px] font-bold bg-black/30 t-mut tabular shrink-0">St. ${ch.level||1}</span>
                  </div>
                  <div class="text-[11px] t-mut truncate">
                    ${ch.owner?`👤 ${esc(ch.owner)} • `:''}📁 ${esc(campNm)}${ch.trashedAt?` • 🗑️ ${esc(ch.trashedAt)}`:''}${ch.trashedBy?` (von ${esc(ch.trashedBy)})`:''}
                  </div>
                </div>
              </div>
              <div class="flex flex-wrap items-center gap-1.5 shrink-0">
                <button type="button" data-action="admin-restore-trash" data-id="${esc(ch.id)}" data-tip="Charakterbogen komplett wiederherstellen" class="btn btn-ok py-1 px-2.5 text-[11px] font-black">↩️ Wiederherstellen</button>
                ${isConfirm
                  ?`<button type="button" data-action="admin-confirm-perm-del-trash" data-id="${esc(ch.id)}" class="btn bg-rose-600 text-white border-rose-500 py-1 px-2.5 text-[11px] font-black">Endgültig? (2/2)</button><button type="button" data-action="admin-cancel-perm-del-trash" class="btn py-1 px-2 text-[11px]">✕</button>`
                  :`<button type="button" data-action="admin-ask-perm-del-trash" data-id="${esc(ch.id)}" data-tip="Charakterbogen endgültig und unwiderruflich löschen" class="btn btn-err py-1 px-2.5 text-[11px] font-black">🔥 Permanent</button>`}
              </div>
            </div>`;
          }).join('')}</div>`
          :`<div class="text-xs t-mut text-center py-3">Der Papierkorb ist leer.</div>`)}
    </div>`;

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
          <span class="pill cursor-default py-0.5 px-2 tabular ${trashedList.length?'border-rose-400/60 bg-rose-500/15 text-rose-200':''}">🗑️ ${trashedList.length} im Papierkorb</span>
          <span class="pill cursor-default py-0.5 px-2 tabular">🎨 ${customIconCnt}/${SYSTEM_ICON_DEFS.length} Icons</span>
          <span class="pill cursor-default py-0.5 px-2 tabular">💬 ${fbItems.length} offenes Feedback</span>
        </div>
        <p class="text-[11px] text-amber-200/90 leading-relaxed">Du kannst alle Kampagnen verwalten, Spieler zuordnen, gelöschte Bögen aus dem Papierkorb wiederherstellen sowie Charakter-Besitzer und Kampagnen-Zugehörigkeiten jederzeit ändern.</p>
      </div>

      <!-- 2. Papierkorb -->
      ${trashSectionHtml}

      <!-- 3. Zentrale Admin-Werkzeuge -->
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
export function renderModal(fromRenderAll=false,resetScroll=false){
  hooks.hideTooltip?.();
  cleanupModalSwipe();
  const m=$('modalMount');
  syncBodyScrollLock();
  if(!UI.modal){
    if(m){m.innerHTML=''; m.dataset.lastModalKey='';}
    if(UI.inLobby&&!fromRenderAll){renderHeader();hooks.renderMain?.();}
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
export function renderAdminIconsModalHtml(){
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
export function renderModalBody(m,fromRenderAll=false){
  if(UI.modal==='adminPanel'){
    m.innerHTML=renderAdminPanelModalHtml();
    return;
  }
  if(UI.modal==='adminIcons'){
    if(!CLOUD.isAdmin){
      UI.modal=null;
      UI.confirmResetAllIcons=false;
      m.innerHTML='';
      if(UI.inLobby&&!fromRenderAll){renderHeader();hooks.renderMain?.();}
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
      if(UI.inLobby&&!fromRenderAll){renderHeader();hooks.renderMain?.();}
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


export function renderInfoDiceWikiHtml(){
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

export function renderInfoProgWikiHtml(){
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

export function buildInfoGlossaryGridState(rawQuery=UI.glossSearch){
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
export function renderInfoGlossaryHtml(){
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
export function updateInfoGlossaryGridDOM(){
  const grid=$('glossGrid'), cnt=$('glossCount');
  if(!grid&&!cnt) return;
  const st=buildInfoGlossaryGridState(UI.glossSearch);
  if(grid) grid.innerHTML=st.gridHtml;
  if(cnt) cnt.textContent=`${st.count} / ${st.total} Begriffe`;
}

export function compressImg(file,maxDim,q,cb){
  if(!file) return;
  const rd=new FileReader();
  rd.onload=ev=>{const im=new Image();im.onload=()=>{let w=im.width||1,h=im.height||1;if(w>maxDim||h>maxDim){if(w>h){h=Math.round(h*maxDim/w);w=maxDim;}else{w=Math.round(w*maxDim/h);h=maxDim;}}const cv=document.createElement('canvas');cv.width=w;cv.height=h;cv.getContext('2d').drawImage(im,0,0,w,h);let out=cv.toDataURL('image/webp',q);if(!out.startsWith('data:image/webp'))out=cv.toDataURL('image/jpeg',q);cb(out);};im.onerror=()=>cb(String(ev.target.result||''));im.src=String(ev.target.result||'');};
  rd.readAsDataURL(file);
}
export function compressIconImg(file, maxDim = 128, q = 0.86, cb){
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

export function handleAdminIconFileUpload(file, ikey){
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
export function performAdminUnlock(){
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
    fetchTrashedCharacters(true);
    syncCloudRegistry(true);
    renderHeader(); hooks.renderMain?.(); renderModal(false,true);
    if(D.open) renderDice();
    updateLobbyLiveDiceDOM();
    toast('👑 Admin-Master-PIN gespeichert & Admin-Modus aktiviert!');
  }else if(simpleHash(pin)===CLOUD.registry.adminHash){
    CLOUD.isAdmin=true;
    UI.adminPinError='';
    try{localStorage.setItem('scherbensturm_cloud_admin','1');}catch(e){}
    refreshUserNotificationsBg(false);
    fetchTrashedCharacters(true);
    renderHeader(); hooks.renderMain?.(); renderModal(false,true);
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
export function performAdminChangePin(){
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
