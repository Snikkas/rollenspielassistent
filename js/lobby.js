import {
  $, esc, isHex, sortAlpha, stripHtml, toRtfHtml
} from './utils.js';
import {
  openCtxMenu, getCampaigns, setActiveCampaign, isUserInCampaign, isGlobalGM, isCampaignMainGM, canManageCampaign, getAccessibleCampaigns, getCreatableCampaigns, getUserAvatar, renderUserNamePill, getActiveLiveCampaignId, save, load, S, UI, CLOUD, getCharOwner, getCharCampaignId, canManageChar
} from './state.js';
import {
  renderLobbyLiveDiceHtml, getCampaignSharedPages, extractPublicPages, updateCloudCharacterMeta
} from './cloud.js';
import {
  renderRtfToolbarHtml
} from './notes.js';

export function setLobbyCharCampaign(cid,newCampId){
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
export function setLobbyCharOwner(cid,newOwnRaw){
  if(!CLOUD.isAdmin) return;
  const newOwn=String(newOwnRaw||'').trim();
  if(newOwn) CLOUD.registry.claims[cid]=newOwn;
  else CLOUD.registry.claims[cid]='';
  const ch=CLOUD.list.find(x=>x.id===cid);
  if(ch) ch.owner=newOwn;
  if(S.charId===cid) S.owner=newOwn;
  updateCloudCharacterMeta(cid,d=>{d.owner=newOwn;if(d._summary)d._summary.owner=newOwn;},newOwn?`👑 Besitzer auf „${newOwn}“ geändert`:'👑 Charakter auf „Frei“ gesetzt');
}
export function openLobbyCharCampPicker(anchorEl,cid){
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
export function openLobbyCharOwnerPicker(anchorEl,cid){
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
export function openLobbyCharMenu(anchorEl,cid,forceOpen=false){
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
export function tplLobbyScreen(){
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
