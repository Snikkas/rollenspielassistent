import {
  WIN_DEFAULTS
} from './constants.js';
import {
  $, stamp, esc, toInt, toRtfHtml
} from './utils.js';
import {
  hooks
} from './ui-hooks.js';
import {
  applyWinFrame, renderWinCtrlBtns, renderWinResizeHandles, getCampaigns, saveRegistryLocal, captureScrollState, restoreScrollState, toast, save, S, CN, isMobileLayout, savedEffRanges, savedPwRanges, lastPwFieldById, UI, CLOUD, getCharCampaignId, canManageChar
} from './state.js';
import {
  withPoolSync, findPwItem
} from './calc.js';
import {
  publishLiveCampNote, extractPublicPages, upsertPublicNoteEntry
} from './cloud.js';

export const RTF_STATE = { lastActiveRtfEl: null, lastActiveRtfRange: null, rtfBlurTimer: null, rtfToolbarTouchUntil: 0, lastRtfTouchCmdAt: 0, rtfTouchTap: null };
export const renderRtfToolbarHtml=(compact=true)=>{
  const pCls=compact?'py-0.5 px-1.5 text-[10px]':'py-0.5 px-2 text-xs';
  return `<div class="inline-flex flex-wrap items-center gap-1 max-w-full" data-rtf-toolbar="1">
    <button type="button" onmousedown="event.preventDefault()" data-action="rtf-cmd" data-cmd="H1" data-tip="Überschrift 1 (Alt+1)" class="btn ${pCls} font-black text-acc touch-manipulation">H1</button>
    <button type="button" onmousedown="event.preventDefault()" data-action="rtf-cmd" data-cmd="H2" data-tip="Überschrift 2 (Alt+2)" class="btn ${pCls} font-extrabold touch-manipulation">H2</button>
    <button type="button" onmousedown="event.preventDefault()" data-action="rtf-cmd" data-cmd="H3" data-tip="Überschrift 3 (Alt+3)" class="btn ${pCls} font-bold t-mut touch-manipulation">H3</button>
    <button type="button" onmousedown="event.preventDefault()" data-action="rtf-cmd" data-cmd="DIV" data-tip="Normaltext (Alt+0)" class="btn ${pCls} font-bold touch-manipulation">¶</button>
    <button type="button" onmousedown="event.preventDefault()" data-action="rtf-cmd" data-cmd="bold" data-tip="Fett (Strg+B)" class="btn ${pCls} font-black touch-manipulation">B</button>
    <button type="button" onmousedown="event.preventDefault()" data-action="rtf-cmd" data-cmd="italic" data-tip="Kursiv (Strg+I)" class="btn ${pCls} italic font-serif touch-manipulation">I</button>
    <button type="button" onmousedown="event.preventDefault()" data-action="rtf-cmd" data-cmd="underline" data-tip="Unterstrichen (Strg+U)" class="btn ${pCls} underline touch-manipulation">U</button>
    <button type="button" onmousedown="event.preventDefault()" data-action="rtf-cmd" data-cmd="insertUnorderedList" data-tip="Aufzählungsliste (* + Leertaste)" class="btn ${pCls} font-bold touch-manipulation">• Liste</button>
  </div>`;
};
export function applyRtfCommand(cmd,val='',triggerEl=null){
  let rtf=document.activeElement?.closest?.('.rtf-box[contenteditable="true"]');
  if(!rtf&&triggerEl){
    const scope=triggerEl.closest('.rtf-wrap')||triggerEl.closest('div')?.parentElement;
    const localBox=scope?.querySelector?.('.rtf-box[contenteditable="true"]');
    if(localBox) rtf=localBox;
  }
  if(!rtf&&RTF_STATE.lastActiveRtfEl&&RTF_STATE.lastActiveRtfEl.isConnected&&RTF_STATE.lastActiveRtfEl.getAttribute('contenteditable')==='true'){
    rtf=RTF_STATE.lastActiveRtfEl;
  }
  if(!rtf) return;
  const wrap=rtf.closest('.rtf-wrap');
  if(wrap){
    clearTimeout(RTF_STATE.rtfBlurTimer);
    wrap.classList.add('rtf-focused');
  }
  if(document.activeElement!==rtf){
    try{rtf.focus({preventScroll:true});}catch(_){rtf.focus();}
    const sel=window.getSelection();
    if(RTF_STATE.lastActiveRtfRange&&rtf.contains(RTF_STATE.lastActiveRtfRange.commonAncestorContainer)&&sel){
      try{
        sel.removeAllRanges();
        sel.addRange(RTF_STATE.lastActiveRtfRange);
      }catch(_){}
    }
  }
  const upper=String(cmd||'').toUpperCase();
  if(['H1','H2','H3','DIV','P'].includes(upper)){
    const sel=window.getSelection();
    const aNode=sel?.anchorNode;
    const curHeading=aNode?(aNode.nodeType===1?aNode.closest('h1,h2,h3'):aNode.parentElement?.closest('h1,h2,h3')):null;
    const targetTag=(curHeading&&rtf.contains(curHeading)&&curHeading.tagName.toUpperCase()===upper)?'DIV':(upper==='P'?'DIV':upper);
    document.execCommand('formatBlock',false,targetTag);
    if(!document.queryCommandValue('formatBlock')) document.execCommand('formatBlock',false,`<${targetTag}>`);
  }else{
    document.execCommand(cmd,false,val||null);
  }
  RTF_STATE.lastActiveRtfEl=rtf;
  saveEffRangeIfActive();
  rtf.dispatchEvent(new Event('input',{bubbles:true}));
  save();
}
export function autoSizeAllTextareas(){
  document.querySelectorAll('.autogrow').forEach(ta=>{
    const parts=(ta.dataset.boxh||'').split(':');
    let saved=0;
    if(parts[0]==='bio') saved=toInt(S.bioBoxH?.[parts[1]],0);
    else{const it=findPwItem(parts[0],parts[1]);saved=it?.boxH?.[parts[2]]||0;}
    if(saved>0) ta.style.height=saved+'px';
    else ta.style.height=Math.max(58,ta.scrollHeight)+'px';
  });
}
export function ensureCampNotesStructure(){
  if(!Array.isArray(S.campNoteFolders)||!S.campNoteFolders.length){
    S.campNoteFolders=[
      {id:'cf_private',name:'🔒 Private Notizen',isPublic:false,collapsed:false,isSystem:true},
      {id:'cf_public',name:'🌐 Öffentliche Notizen',isPublic:true,collapsed:false,isSystem:true}
    ];
  }
  if(!S.campNoteFolders.some(f=>f.id==='cf_private')) S.campNoteFolders.unshift({id:'cf_private',name:'🔒 Private Notizen',isPublic:false,collapsed:false,isSystem:true});
  if(!S.campNoteFolders.some(f=>f.id==='cf_public')) S.campNoteFolders.splice(1,0,{id:'cf_public',name:'🌐 Öffentliche Notizen',isPublic:true,collapsed:false,isSystem:true});
  if(!Array.isArray(S.campaignNotes)||!S.campaignNotes.length){
    S.campaignNotes=[{id:'cn_main',title:'Allgemein',content:'',isPublic:false,folderId:'cf_private',updatedAt:''}];
  }
  const fMap=new Map(S.campNoteFolders.map(f=>[f.id,f]));
  S.campaignNotes.forEach(n=>{
    const isPub=Boolean(n.isPublic);
    if(!n.folderId||!fMap.has(n.folderId)){
      n.folderId=isPub?'cf_public':'cf_private';
    }else{
      const f=fMap.get(n.folderId);
      if(f&&Boolean(f.isPublic)!==isPub){
        n.isPublic=Boolean(f.isPublic);
      }
    }
  });
  if(!S.campaignNotes.some(n=>n.id===S.activeCampNoteId)){
    S.activeCampNoteId=S.campaignNotes[0].id;
  }
}

export function syncPublicNotesAfterChange(activePage=null,deletedPageId=''){
  const campId=getCharCampaignId(S.charId);
  const pubPages=extractPublicPages(S.campaignNotes,'',stamp());
  upsertPublicNoteEntry(S.charId,{
    campaignId:campId,
    charName:S.profile.name||'Unbenannter Held',
    avatar:S.profile.avatar||'',
    owner:S.owner||CLOUD.currentUser||'',
    content:String(pubPages[0]?.content||''),
    updatedAt:stamp(),
    pages:pubPages
  });
  saveRegistryLocal();
  if(activePage||deletedPageId){
    publishLiveCampNote({
      scope:'char',
      charId:S.charId,
      campaignId:campId,
      charName:S.profile.name||'Unbenannter Held',
      owner:S.owner||CLOUD.currentUser||'',
      pageId:deletedPageId||activePage?.id||'',
      title:activePage?.title||'',
      content:activePage?.content||'',
      isPublic:Boolean(activePage?.isPublic),
      deleted:Boolean(deletedPageId),
      updatedAt:stamp(),
      pages:pubPages,
      publicNoteEntry:CLOUD.registry.publicNotes?.[S.charId]
    });
  }
}

export const getOrderedCampNoteFolders=()=>[
  ...(S.campNoteFolders||[]).filter(f=>!f.isPublic),
  ...(S.campNoteFolders||[]).filter(f=>f.isPublic)
];

export function renderCampNotes(){
  const mount=$('notesMount'), bd=$('notesBackdrop');
  if(!mount) return;
  const snap=mount.childElementCount>0?captureScrollState(mount):null;
  if(!CN.open){
    applyWinFrame('cnotes',mount,bd,WIN_DEFAULTS.cnotes.dockClass);
    mount.innerHTML='';
    return;
  }
  ensureCampNotesStructure();
  applyWinFrame('cnotes',mount,bd,WIN_DEFAULTS.cnotes.dockClass);
  const campId=getCharCampaignId(S.charId);
  const campObj=getCampaigns().find(c=>c.id===campId);
  const hasCamp=Boolean(campId&&campId!=='default');
  const canEdit=!CLOUD.viewingRemote||canManageChar(S.charId);
  const privFolders=S.campNoteFolders.filter(f=>!f.isPublic);
  const pubFolders=S.campNoteFolders.filter(f=>f.isPublic);
  const orderedFolders=[...privFolders,...pubFolders];
  const orderedPages=[];
  orderedFolders.forEach(folder=>{
    S.campaignNotes.filter(n=>n.folderId===folder.id).forEach(n=>orderedPages.push(n));
  });
  S.campaignNotes.forEach(n=>{if(!orderedPages.includes(n)) orderedPages.push(n);});
  const activePage=orderedPages.find(n=>n.id===S.activeCampNoteId)||orderedPages[0];
  if(activePage) S.activeCampNoteId=activePage.id;
  const curIdx=Math.max(0,orderedPages.indexOf(activePage));
  const activeFolder=S.campNoteFolders.find(f=>f.id===activePage?.folderId)||S.campNoteFolders[0];
  const pubCount=S.campaignNotes.filter(n=>n.isPublic).length;
  const privCount=S.campaignNotes.length-pubCount;
  const xl=window.innerWidth>=1280;
  const mob=isMobileLayout();

  const renderFolderGroup=(groupFolders,isPubGroup)=>{
    const grpCount=isPubGroup?pubCount:privCount;
    const secLabel=isPubGroup?'🌐 Öffentlich (Lobby)':'🔒 Privat';
    const secCls=isPubGroup?'text-emerald-400':'t-mut';
    return `<div class="space-y-1.5 min-w-0">
      <div class="flex items-center justify-between px-1.5">
        <span class="text-[10px] font-black uppercase tracking-wider ${secCls}">${secLabel}</span>
        <span class="text-[10px] font-bold tabular ${isPubGroup?'text-emerald-400/80':'t-mut'}">${grpCount}</span>
      </div>
      ${groupFolders.map((folder,gIdx)=>{
        const fPages=S.campaignNotes.filter(n=>n.folderId===folder.id);
        const isPubFolder=Boolean(folder.isPublic);
        const hasActiveInside=fPages.some(p=>p.id===activePage?.id);
        const showMgmtBar=canEdit&&(!folder.isSystem||groupFolders.length>1);
        const isConfirmDel=CN.confirmDelFolderId===folder.id;
        const cleanSysName=folder.isSystem?String(folder.name||'').replace(/^(?:🔒|🌐)\s*/,''):folder.name;
        return `<div data-drop-cnfolder="${esc(folder.id)}" class="rounded-xl transition-colors min-w-0 ${isPubFolder?'bg-emerald-500/[0.04]':'bg-white/[0.02]'} border ${hasActiveInside?(isPubFolder?'border-emerald-500/35':'bdr-acc/50'):'border-white/[0.06]'} p-1.5 space-y-1">
          <div class="cn-row ${hasActiveInside?'cn-row-active':''} flex items-center gap-1 min-w-0">
            <button type="button" data-action="toggle-cnfolder-collapse" data-fid="${esc(folder.id)}" aria-label="${folder.collapsed?'Ordner aufklappen':'Ordner einklappen'}" class="w-5 h-5 inline-flex items-center justify-center rounded hover:bg-white/10 text-[10px] font-black t-mut shrink-0 cursor-pointer">${folder.collapsed?'▸':'▾'}</button>
            ${canEdit&&!mob?`<span draggable="true" data-drag-cnfolder="${esc(folder.id)}" title="Ordner ziehen zum Umsortieren" class="text-[11px] t-mut hover:text-acc cursor-grab select-none shrink-0 px-0.5 leading-none">⠿</span>`:''}
            ${!folder.isSystem&&canEdit
              ?`<input data-cnfolder-name="${esc(folder.id)}" type="text" value="${esc(folder.name)}" class="inp-sec-name text-xs font-extrabold flex-1 min-w-0 py-0 px-0.5"/>`
              :`<span class="text-xs font-extrabold truncate flex-1 min-w-0 ${isPubFolder?'text-emerald-300':'text-[var(--txt)]/90'}">${esc(cleanSysName)}</span>`}
            <span class="text-[10px] t-mut tabular shrink-0 px-0.5">${fPages.length}</span>
            ${canEdit?`<button type="button" data-action="add-cn-page" data-pub="${isPubFolder?'1':'0'}" data-folder="${esc(folder.id)}" data-tip="Neue Seite in diesem Ordner erstellen" aria-label="Neue Seite in diesem Ordner erstellen" class="w-5 h-5 inline-flex items-center justify-center rounded-md border border-transparent hover:border-[var(--acc)] hover:bg-acc-soft text-xs font-black text-acc shrink-0 cursor-pointer">+</button>`:''}
          </div>
          ${showMgmtBar?`<div class="flex flex-wrap items-center justify-between gap-1 pl-5 pr-0.5 pt-0.5 border-t border-white/[0.05]">
            <div class="flex items-center gap-1">
              ${!folder.isSystem?`<button type="button" data-action="toggle-cnfolder-pub" data-fid="${esc(folder.id)}" data-tip="Ordner samt enthaltenen Seiten zwischen Öffentlich &amp; Privat umschalten" class="btn py-0 px-1.5 text-[10px] font-bold">${isPubFolder?'→ 🔒':'→ 🌐'}</button>`:''}
              ${groupFolders.length>1?`<button type="button" data-action="move-cnfolder" data-fid="${esc(folder.id)}" data-dir="-1" ${gIdx===0?'disabled':''} title="Ordner nach oben" class="btn py-0 px-1 text-[10px]">▲</button><button type="button" data-action="move-cnfolder" data-fid="${esc(folder.id)}" data-dir="1" ${gIdx===groupFolders.length-1?'disabled':''} title="Ordner nach unten" class="btn py-0 px-1 text-[10px]">▼</button>`:''}
            </div>
            ${!folder.isSystem?(isConfirmDel
              ?`<span class="inline-flex items-center gap-1"><button type="button" data-action="confirm-del-cnfolder" data-fid="${esc(folder.id)}" class="btn bg-rose-600 text-white border-rose-600 py-0 px-1.5 text-[10px] font-black">Löschen? (2/2)</button><button type="button" data-action="cancel-del-cnfolder" class="btn py-0 px-1 text-[10px]">✕</button></span>`
              :`<button type="button" data-action="ask-del-cnfolder" data-fid="${esc(folder.id)}" data-tip="Ordner entfernen (Seiten wandern in den Standard-Ordner)" class="btn btn-err py-0 px-1.5 text-[10px]">🗑️</button>`):''}
          </div>`:''}
          ${!folder.collapsed?`<div class="space-y-0.5 pl-2 ml-2 border-l ${isPubFolder?'border-emerald-500/25':'border-white/10'} min-w-0">
            ${fPages.length?fPages.map((pg,pIdx)=>{
              const isAct=pg.id===activePage?.id;
              const actCls=isAct
                ?(pg.isPublic?'border-emerald-400/55 bg-emerald-500/18 text-emerald-200 font-extrabold shadow-sm':'bdr-acc bg-acc-soft text-acc font-extrabold shadow-sm')
                :'border-transparent hover:bg-white/[0.06] hover:border-white/10 text-[var(--txt)]/85';
              return `<div data-drop-cnpage="${esc(pg.id)}" data-drop-cnfolder="${esc(folder.id)}" class="cn-row ${isAct?'cn-row-active':''} flex items-center gap-1 px-1.5 py-1.5 rounded-lg border text-xs transition-all min-w-0 ${actCls}">
                ${canEdit&&!mob?`<span draggable="true" data-drag-cnpage="${esc(pg.id)}" title="Seite ziehen zum Sortieren oder in anderen Ordner legen" class="text-[10px] opacity-45 hover:opacity-100 cursor-grab select-none shrink-0 leading-none">⠿</span>`:''}
                <button type="button" data-action="sel-cn-page" data-id="${esc(pg.id)}" class="text-left truncate flex-1 min-w-0 flex items-center gap-1.5 cursor-pointer">
                  <span class="w-1.5 h-1.5 rounded-full shrink-0 ${isAct?(pg.isPublic?'bg-emerald-400':'bg-[var(--acc)]'):'bg-transparent'}"></span>
                  <span class="truncate">${esc(pg.title||'Unbenannte Seite')}</span>
                </button>
                ${canEdit&&fPages.length>1?`<div class="cn-item-acts flex items-center gap-0.5 shrink-0 tabular"><button type="button" data-action="move-cnpage" data-id="${esc(pg.id)}" data-dir="-1" ${pIdx===0?'disabled':''} title="Nach oben" class="btn py-0 px-1 text-[9px]">▲</button><button type="button" data-action="move-cnpage" data-id="${esc(pg.id)}" data-dir="1" ${pIdx===fPages.length-1?'disabled':''} title="Nach unten" class="btn py-0 px-1 text-[9px]">▼</button></div>`:''}
              </div>`;
            }).join(''):`<div data-drop-cnfolder="${esc(folder.id)}" class="py-1.5 px-2 text-[11px] t-mut italic border border-dashed border-white/10 rounded-lg text-center">Noch keine Seiten</div>`}
          </div>`:''}
        </div>`;
      }).join('')}
    </div>`;
  };

  const sidebarHtml=CN.tocOpen?`<aside class="cn-sidebar min-w-0">
    ${canEdit?`<div class="shrink-0 p-2.5 border-b bdr-line space-y-1.5">
      <div class="grid grid-cols-2 gap-1.5">
        <button type="button" data-action="add-cn-page" data-pub="0" data-folder="${activeFolder&&!activeFolder.isPublic?esc(activeFolder.id):'cf_private'}" data-tip="Neue private Notizseite anlegen" class="btn py-1.5 px-2 text-[11px] font-extrabold">+ 🔒 Seite</button>
        <button type="button" data-action="add-cn-page" data-pub="1" data-folder="${activeFolder&&activeFolder.isPublic?esc(activeFolder.id):'cf_public'}" data-tip="Neue öffentliche Notizseite anlegen (wird mit der Kampagne in der Lobby geteilt)" class="btn py-1.5 px-2 text-[11px] font-extrabold !border-emerald-500/45 !bg-emerald-500/15 text-emerald-300 hover:!bg-emerald-500/25">+ 🌐 Seite</button>
      </div>
      <button type="button" data-action="toggle-cn-newfolder" data-tip="Neuen Ordner / neues Kapitel anlegen" class="btn w-full py-1 px-2 text-[11px] font-bold ${CN.newFolderOpen?'bdr-acc bg-acc-soft text-acc':'opacity-90 hover:opacity-100'}">${CN.newFolderOpen?'✕ Ordner-Formular schließen':'+ 📁 Ordner'}</button>
    </div>`:''}
    ${CN.newFolderOpen&&canEdit?`<div class="shrink-0 p-2.5 border-b bdr-line bg-acc-soft/15 space-y-2 text-xs">
      <input id="inpNewCnFolderName" type="text" value="${esc(CN.newFolderName||'')}" placeholder="Ordner- / Kapitelname..." class="inp w-full py-1.5 px-2 text-xs font-bold"/>
      <div class="flex items-center justify-between gap-1.5">
        <button type="button" data-action="toggle-cn-newfolder-pub" class="btn flex-1 py-1 px-2 text-[11px] font-extrabold ${CN.newFolderPublic?'!border-emerald-500/55 !bg-emerald-500/20 text-emerald-300':'bdr-line'}">${CN.newFolderPublic?'🌐 Öffentlich':'🔒 Privat'}</button>
        <button type="button" data-action="create-cn-folder" class="btn btn-ok py-1 px-2.5 text-[11px] font-black shrink-0">✓ Anlegen</button>
      </div>
    </div>`:''}
    <div data-scroll-key="cnotesToc" class="cn-sidebar-list p-2.5 space-y-3 min-w-0">
      ${renderFolderGroup(privFolders,false)}
      <div class="border-t bdr-line"></div>
      ${renderFolderGroup(pubFolders,true)}
    </div>
  </aside>`:'';

  const editorHtml=activePage?`<section class="cn-editor-pane rtf-wrap min-w-0">
    <div class="shrink-0 px-4 sm:px-6 pt-3.5 sm:pt-4 pb-3 border-b bdr-line space-y-2.5" style="background:color-mix(in srgb,var(--surf2) 38%,transparent)">
      <div class="flex items-center gap-2 min-w-0">
        <span class="text-lg leading-none shrink-0" aria-hidden="true">${activePage.isPublic?'🌐':'🔒'}</span>
        <input id="inpCnTitle" data-cn-title="${esc(activePage.id)}" type="text" value="${esc(activePage.title)}" ${!canEdit?'disabled':''} placeholder="Seitentitel..." class="inp-sec-name flex-1 min-w-0 text-lg sm:text-xl font-black tracking-tight py-0.5"/>
      </div>
      <div class="flex flex-wrap items-center justify-between gap-2 min-w-0">
        <div class="flex flex-wrap items-center gap-1.5 min-w-0">
          ${canEdit?`<button type="button" data-action="toggle-cn-public" data-id="${esc(activePage.id)}" data-tip="Wechselt die Seite zwischen dem Öffentlichen Ordner (in der Lobby geteilt) und dem Privaten Ordner" class="btn py-1 px-2.5 text-[11px] font-extrabold rounded-full ${activePage.isPublic?'!border-emerald-500/55 !bg-emerald-500/20 text-emerald-300':'bdr-line opacity-90'}">${activePage.isPublic?'🌐 Öffentlich (Lobby)':'🔒 Privat'}</button>
          <select data-cn-folder-sel="${esc(activePage.id)}" data-tip="Seite in einen anderen Ordner / ein anderes Kapitel verschieben" class="inp py-1 px-2 text-[11px] font-bold max-w-[190px] min-w-0">
            ${orderedFolders.map(f=>`<option value="${esc(f.id)}" ${activePage.folderId===f.id?'selected':''}>${f.isPublic?'🌐':'🔒'} ${esc(f.name)}</option>`).join('')}
          </select>`:`<span class="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold border ${activePage.isPublic?'border-emerald-500/50 bg-emerald-500/15 text-emerald-300':'bdr-line bg-black/20 t-mut'}">${activePage.isPublic?'🌐 Öffentlich':'🔒 Privat'} • Ansichtsmodus</span>`}
        </div>
        <div class="flex flex-wrap items-center gap-2 shrink-0">
          <span data-cn-ts="${esc(activePage.id)}" class="text-[11px] t-mut tabular">${activePage.updatedAt?`Zuletzt geändert: ${esc(activePage.updatedAt)}`:'Noch nicht geändert'}</span>
          ${canEdit&&S.campaignNotes.length>1?(CN.confirmDelId===activePage.id
            ?`<span class="inline-flex items-center gap-1"><button type="button" data-action="confirm-del-cnpage" data-id="${esc(activePage.id)}" class="btn bg-rose-600 text-white border-rose-600 py-1 px-2 text-[11px] font-black">Löschen? (2/2)</button><button type="button" data-action="cancel-del-cnpage" class="btn py-1 px-1.5 text-[11px]">✕</button></span>`
            :`<button type="button" data-action="ask-del-cnpage" data-id="${esc(activePage.id)}" data-tip="Diese Notizseite löschen" class="btn btn-err py-1 px-2 text-[11px]">🗑️</button>`):''}
        </div>
      </div>
      ${activePage.isPublic&&!hasCamp?`<div class="text-[11px] text-amber-300 bg-amber-500/10 border border-amber-400/30 rounded-lg px-2.5 py-1.5">ℹ️ Diese Seite liegt im Ordner <strong>🌐 Öffentliche Notizen</strong>. Sobald dein Charakter in der Lobby einer Kampagne zugeordnet ist, erscheint sie dort automatisch im gemeinsamen Kampagnenbuch.</div>`:''}
    </div>
    ${canEdit?`<div class="cn-rtf-bar shrink-0 px-4 sm:px-6 py-1.5 border-b bdr-line flex flex-wrap items-center justify-between gap-2" style="background:color-mix(in srgb,var(--surf2) 55%,transparent)">
      ${renderRtfToolbarHtml(true)}
    </div>`:''}
    <div contenteditable="${canEdit?'true':'false'}" id="cnEditorBox" data-scroll-key="cnotesEditor" data-cn-content="${esc(activePage.id)}" data-ph="Schreibe hier deine Notizen für „${esc(activePage.title||'diese Seite')}“..." class="cn-editor-box rtf-box px-4 sm:px-6 py-4 text-sm">${toRtfHtml(activePage.content)}</div>
  </section>`:'';

  mount.innerHTML=`<div class="card p-0 ${mob?'rounded-none border-0':'rounded-2xl'} flex-1 h-full flex flex-col min-h-0 overflow-hidden shadow-2xl relative">
    <div data-win-drag="cnotes" class="shrink-0 z-10 flex items-center justify-between gap-2 px-3 sm:px-4 py-2.5 border-b bdr-line win-drag-hdr" style="background:var(--surf2)">
      <div class="flex items-center gap-2 min-w-0 flex-1">
        <button type="button" data-action="toggle-cn-toc" aria-label="${CN.tocOpen?'Seitenleiste einklappen':'Seitenleiste ausklappen'}" data-tip="Ordner &amp; Seiten (${S.campNoteFolders.length} Ordner • ${orderedPages.length} Seiten) ein-/ausblenden" class="btn ${mob?'w-9 h-9 p-0':'py-1 px-2'} text-xs font-extrabold shrink-0 ${CN.tocOpen?'btn-pri':'bdr-acc bg-acc-soft text-acc'}">📑<span class="hidden sm:inline"> Seiten</span></button>
        <div class="min-w-0 flex-1">
          <h2 class="text-sm font-extrabold truncate">📝 Kampagnennotizen</h2>
          <div class="text-[11px] t-mut flex items-center gap-1.5 min-w-0">
            <span class="text-acc font-bold truncate">${esc(campObj?.name||'Ohne Kampagne / Allgemein')}</span>
            <span class="shrink-0 opacity-50">•</span>
            <span class="text-emerald-400 font-bold shrink-0 tabular">🌐 ${pubCount}</span>
            <span class="shrink-0 opacity-50">•</span>
            <span class="shrink-0 tabular">🔒 ${privCount}</span>
          </div>
        </div>
      </div>
      <div class="flex items-center gap-1 sm:gap-1.5 shrink-0">
        <div class="inline-flex items-center gap-0.5 tabular shrink-0">
          <button type="button" data-action="prev-cn-page" ${curIdx<=0?'disabled':''} data-tip="Vorherige Seite" class="btn py-1 px-1.5 text-[11px] font-black">◀</button>
          <span class="px-1 text-[11px] font-bold t-mut">${curIdx+1}/${orderedPages.length}</span>
          <button type="button" data-action="next-cn-page" ${curIdx>=orderedPages.length-1?'disabled':''} data-tip="Nächste Seite" class="btn py-1 px-1.5 text-[11px] font-black">▶</button>
        </div>
        ${renderWinCtrlBtns('cnotes')}
        ${xl&&!UI.inLobby?`<button type="button" data-action="dock-cnotes" data-tip="Zwischen angedockter Seitenleiste und Overlay umschalten" class="hidden xl:inline-flex btn py-1 px-2 text-xs ${CN.docked?'btn-pri':''}">${CN.docked?'🗗 Overlay':'📌 Andocken'}</button>`:''}
        <button type="button" data-action="close-cnotes" aria-label="Schließen" class="btn btn-err ${mob?'w-9 h-9 p-0 text-sm':'py-1 px-2 text-xs'} font-black shrink-0">✕</button>
      </div>
    </div>

    <div class="cn-body-wrap">
      <div data-scroll-key="cnotesBody" class="cn-shell${mob?' cn-is-mobile safe-pb':''}">
        ${sidebarHtml}
        ${editorHtml}
      </div>
    </div>
    ${renderWinResizeHandles('cnotes')}
  </div>`;
  if(snap) restoreScrollState(mount,snap);
}
export const renderCNotes=renderCampNotes;

export function getCaretRangeAtPoint(x,y){
  if(typeof document.caretRangeFromPoint==='function') return document.caretRangeFromPoint(x,y);
  if(typeof document.caretPositionFromPoint==='function'){
    const pos=document.caretPositionFromPoint(x,y);
    if(pos&&pos.offsetNode){
      const r=document.createRange();
      r.setStart(pos.offsetNode,pos.offset);
      r.collapse(true);
      return r;
    }
  }
  return null;
}

export function syncPwFieldCursorState(box,rng=null){
  if(!box||!box.dataset?.pwf) return;
  const [kind,id,field]=String(box.dataset.pwf||'').split(':');
  if(!kind||!id||!['desc','effects','rules'].includes(field)) return;
  if(rng) savedPwRanges[`${id}:${field}`]=rng.cloneRange();
  if(document.activeElement===box||box.contains(document.activeElement)){
    lastPwFieldById[id]=field;
    const it=findPwItem(kind,id);
    if(it&&it.bldMode==='dyn'){
      it.bldDynTarget=field;
      const tSel=document.querySelector(`[data-pw-sel="${kind}:${id}:bldDynTarget"]`);
      if(tSel&&document.activeElement!==tSel) tSel.value=field;
    }
  }
}
export function saveEffRangeIfActive(){
  const activeRtf=document.activeElement?.closest?.('.rtf-box[contenteditable="true"]');
  if(activeRtf){
    RTF_STATE.lastActiveRtfEl=activeRtf;
    syncPwFieldCursorState(activeRtf,null);
  }
  const sel=window.getSelection();
  if(!sel||!sel.rangeCount) return;
  const rng=sel.getRangeAt(0);
  const node=rng.commonAncestorContainer;
  const rtfBox=node?.nodeType===1?node.closest?.('.rtf-box[contenteditable="true"]'):node?.parentElement?.closest?.('.rtf-box[contenteditable="true"]');
  if(rtfBox){
    RTF_STATE.lastActiveRtfEl=rtfBox;
    RTF_STATE.lastActiveRtfRange=rng.cloneRange();
    syncPwFieldCursorState(rtfBox,rng);
  }
  const effEl=node?.nodeType===1?node.closest?.('[id^="eff_"]'):node?.parentElement?.closest?.('[id^="eff_"]');
  if(effEl&&effEl.id?.startsWith('eff_')){
    savedEffRanges[effEl.id.slice(4)]=rng.cloneRange();
  }
}

export function insertTokenAtCursor(kind,id,tok,dropPoint=null,explicitField=null){
  const it=findPwItem(kind,id); if(!it||!tok) return;
  const isDynTok=/^\{\{[\s\S]*\}\}$/.test(String(tok||'').trim());
  const validFields=['desc','effects','rules'];
  const fieldLabels={desc:'Beschreibung',effects:'Effekte',rules:'Zusatzinfos'};
  let targetField='effects';
  if(explicitField&&validFields.includes(explicitField)){
    targetField=explicitField;
  }else if(isDynTok||it.bldMode==='dyn'){
    const activeRtf=document.activeElement?.closest?.('.rtf-box[contenteditable="true"]');
    const activePwf=activeRtf?.dataset?.pwf?activeRtf.dataset.pwf.split(':'):null;
    if(activePwf&&activePwf[0]===kind&&activePwf[1]===id&&validFields.includes(activePwf[2])){
      targetField=activePwf[2];
    }else if(lastPwFieldById[id]&&validFields.includes(lastPwFieldById[id])){
      targetField=lastPwFieldById[id];
    }else if(RTF_STATE.lastActiveRtfEl&&RTF_STATE.lastActiveRtfEl.isConnected&&RTF_STATE.lastActiveRtfEl.dataset?.pwf){
      const lp=RTF_STATE.lastActiveRtfEl.dataset.pwf.split(':');
      if(lp[0]===kind&&lp[1]===id&&validFields.includes(lp[2])) targetField=lp[2];
      else targetField=validFields.includes(it.bldDynTarget)?it.bldDynTarget:'desc';
    }else{
      targetField=validFields.includes(it.bldDynTarget)?it.bldDynTarget:'desc';
    }
  }
  const targetEl=targetField==='effects'
    ?$(`eff_${id}`)
    :(targetField==='desc'?($(`desc_${id}`)||document.querySelector(`[data-pwf="${kind}:${id}:desc"]`)):($(`rules_${id}`)||document.querySelector(`[data-pwf="${kind}:${id}:rules"]`)));
  let targetRange=null;
  if(targetEl){
    if(dropPoint&&typeof dropPoint.x==='number'&&typeof dropPoint.y==='number'){
      const dr=getCaretRangeAtPoint(dropPoint.x,dropPoint.y);
      if(dr&&targetEl.contains(dr.startContainer)) targetRange=dr;
    }
    if(!targetRange){
      const sel=window.getSelection();
      if(sel&&sel.rangeCount){
        const sr=sel.getRangeAt(0);
        if(targetEl.contains(sr.commonAncestorContainer)) targetRange=sr.cloneRange();
      }
    }
    if(!targetRange){
      const savedR=savedPwRanges[`${id}:${targetField}`]||(targetField==='effects'?savedEffRanges[id]:null);
      if(savedR&&savedR.startContainer&&savedR.startContainer.isConnected&&targetEl.contains(savedR.startContainer)){
        targetRange=savedR.cloneRange();
      }
    }
  }
  if(targetEl){
    let insertedAtCursor=false;
    if(targetRange){
      insertedAtCursor=true;
      targetEl.focus();
      let pre='', post='';
      if(targetRange.startContainer.nodeType===3){
        const txt=targetRange.startContainer.nodeValue||'';
        const chBefore=targetRange.startOffset>0?txt[targetRange.startOffset-1]:'';
        const chAfter=targetRange.startOffset<txt.length?txt[targetRange.startOffset]:'';
        if(chBefore&&!/[\s(\[{]/.test(chBefore)) pre=' ';
        if(chAfter&&!/[\s.,;:!?)\]}]/.test(chAfter)) post=' ';
      }
      targetRange.deleteContents();
      const tNode=document.createTextNode(pre+tok+post);
      targetRange.insertNode(tNode);
      const nr=document.createRange();
      nr.setStartAfter(tNode); nr.collapse(true);
      const sel=window.getSelection();
      if(sel){sel.removeAllRanges();sel.addRange(nr);}
      savedPwRanges[`${id}:${targetField}`]=nr.cloneRange();
      if(targetField==='effects') savedEffRanges[id]=nr.cloneRange();
      RTF_STATE.lastActiveRtfEl=targetEl;
      RTF_STATE.lastActiveRtfRange=nr.cloneRange();
      lastPwFieldById[id]=targetField;
    }else{
      targetEl.focus();
      const plainNow=targetEl.textContent||'';
      const needsSpace=plainNow.length>0&&!/[\s(\[{]$/.test(plainNow);
      const tNode=document.createTextNode((needsSpace?' ':'')+tok);
      targetEl.appendChild(tNode);
      const nr=document.createRange();
      nr.setStartAfter(tNode); nr.collapse(true);
      const sel=window.getSelection();
      if(sel){sel.removeAllRanges();sel.addRange(nr);}
      savedPwRanges[`${id}:${targetField}`]=nr.cloneRange();
      if(targetField==='effects') savedEffRanges[id]=nr.cloneRange();
      RTF_STATE.lastActiveRtfEl=targetEl;
      RTF_STATE.lastActiveRtfRange=nr.cloneRange();
      lastPwFieldById[id]=targetField;
    }
    if(targetField==='effects'&&!isDynTok){
      withPoolSync(()=>{
        it.applyMods=true;
        it.effects=targetEl.innerHTML;
      });
    }else{
      it[targetField]=targetEl.innerHTML;
    }
    targetEl.dispatchEvent(new Event('input',{bubbles:true}));
    if(targetField==='effects'){
      const tb=$(`tokBar_${id}`); if(tb) tb.innerHTML=hooks.buildTokBarInnerHtml(kind,it);
    }
    hooks.updatePwDynPreviewDOM?.(kind,id);
    autoSizeAllTextareas();
    if(targetField==='effects'){
      hooks.syncLiveCalculations?.();
      hooks.renderHeader?.();
    }
    save();
    toast(insertedAtCursor
      ?`Baustein ${tok} in ${fieldLabels[targetField]} eingefügt!`
      :`Baustein ${tok} an ${fieldLabels[targetField]} angehängt!`);
    return;
  }
  if(targetField==='effects'&&!isDynTok){
    withPoolSync(()=>{
      it.applyMods=true;
      const cur=String(it.effects||'').trim();
      it.effects=cur?`${cur} ${esc(tok)}`:esc(tok);
    });
  }else{
    const cur=String(it[targetField]||'').trim();
    it[targetField]=cur?`${cur} ${esc(tok)}`:esc(tok);
  }
  hooks.renderMain?.(); hooks.renderHeader?.(); hooks.syncLiveCalculations?.(); save();
  toast(`Baustein ${tok} in ${fieldLabels[targetField]} eingefügt!`);
}

export function placeCaretAtStart(el){
  const r=document.createRange(), s=window.getSelection();
  r.selectNodeContents(el); r.collapse(true);
  s.removeAllRanges(); s.addRange(r);
}
export function indentRtfLi(li){
  const prevLi=li.previousElementSibling;
  if(prevLi&&prevLi.tagName==='LI'){
    let sub=Array.from(prevLi.children).find(c=>c.tagName==='UL'||c.tagName==='OL');
    if(!sub){sub=document.createElement('ul');prevLi.appendChild(sub);}
    sub.appendChild(li);
  }else{
    const sub=document.createElement('ul');
    li.before(sub); sub.appendChild(li);
  }
  placeCaretAtStart(li);
}
export function outdentRtfLi(li,rtf){
  const ul=li.parentElement; if(!ul) return;
  const par=ul.parentElement;
  if(par&&(par.tagName==='LI'||par.tagName==='UL'||par.tagName==='OL')){
    const afterSibs=[]; let nxt=li.nextElementSibling;
    while(nxt){afterSibs.push(nxt);nxt=nxt.nextElementSibling;}
    if(par.tagName==='LI'){
      par.after(li);
      if(afterSibs.length){const sub=document.createElement('ul');afterSibs.forEach(s=>sub.appendChild(s));li.appendChild(sub);}
    }else{
      ul.after(li);
    }
    if(!ul.children.length) ul.remove();
    placeCaretAtStart(li);
  }else{
    const div=document.createElement('div');
    while(li.firstChild) div.appendChild(li.firstChild);
    if(!div.childNodes.length) div.appendChild(document.createElement('br'));
    const afterSibs=[]; let nxt=li.nextElementSibling;
    while(nxt){afterSibs.push(nxt);nxt=nxt.nextElementSibling;}
    ul.after(div);
    if(afterSibs.length){const nUl=document.createElement('ul');afterSibs.forEach(s=>nUl.appendChild(s));div.after(nUl);}
    li.remove();
    if(!ul.children.length) ul.remove();
    placeCaretAtStart(div);
  }
  if(rtf) rtf.dispatchEvent(new Event('input',{bubbles:true}));
}

