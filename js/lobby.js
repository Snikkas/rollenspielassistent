import {
  $, esc, isHex, sortAlpha, stripHtml, toRtfHtml
} from './utils.js';
import {
  openCtxMenu, closeCtxMenu, getCampaigns, getActiveCampaigns, getArchivedCampaigns, setActiveCampaign, isUserInCampaign, isGlobalGM, isCampaignMainGM, canManageCampaign, getGmManageableCampaigns, canToggleEnemyStatus, isEnemySheet, getEnemyMeta, canManageEnemySheet, canViewEnemySheet, isEnemyDiceVisibleInCampaign, getAccessibleCampaigns, getCreatableCampaigns, getUserAvatar, renderUserNamePill, getActiveLiveCampaignId, save, load, S, UI, CLOUD, getCharOwner, getCharCampaignId, canManageChar
} from './state.js';
import {
  renderLobbyLiveDiceHtml, getCampaignSharedPages, extractPublicPages, updateCloudCharacterMeta, toggleEnemyActiveStatus, toggleEnemyCampaignAssignment, toggleEnemyDiceVisibility, toggleEnemyArchived, cloneEnemyToCampaign
} from './cloud.js';
import {
  renderRtfToolbarHtml
} from './notes.js';
import {
  renderLobbyInitiativeCardHtml, getEnemyInitiativeCount
} from './initiative.js';

export function setLobbyCharCampaign(cid,newCampId){
  const cleanCampId=String(newCampId||'default').trim()||'default';
  const owner=getCharOwner(cid), isMyChar=Boolean(owner&&CLOUD.currentUser&&owner.toLowerCase()===CLOUD.currentUser.toLowerCase());
  if(!CLOUD.isAdmin&&!isMyChar&&!canManageCampaign(getCharCampaignId(cid))) return;
  const camps=CLOUD.isAdmin?getActiveCampaigns():getCreatableCampaigns(CLOUD.currentUser);
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
  const camps=CLOUD.isAdmin?getActiveCampaigns():getCreatableCampaigns(CLOUD.currentUser);
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
    items.push({icon:'👁️',label:'Im Ansichtsmodus öffnen',sub:'Schreibgeschützte Vorschau (Mittelklick = neuer Tab)',action:'cloud-view-char',href:`?char=${encodeURIComponent(cid)}&view=1`,dataset:{id:cid}});
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
        sub:`„${dispName}“ in den Admin-Papierkorb verschieben`,
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
        label:'In Papierkorb verschieben',
        sub:'Admin kann wiederherstellen oder endgültig löschen',
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

function resolveFreshAnchor(anchorEl, selector){
  if(anchorEl&&anchorEl.isConnected) return anchorEl;
  return selector?document.querySelector(selector):null;
}

export function openEnemyCampaignPicker(anchorEl,cid,forceOpen=false){
  if(!canToggleEnemyStatus()) return;
  const ch=CLOUD.list.find(x=>x&&x.id===cid);
  const dispName=String(ch?.name||(S.charId===cid?S.profile?.name:'')||'').trim()||'Gegner-Vorlage';
  const meta=getEnemyMeta(cid);
  const gmCamps=getGmManageableCampaigns();
  const sel=`[data-action="open-enemy-camp-picker"][data-id="${CSS.escape?CSS.escape(cid):cid}"]`;
  const items=[
    {type:'label',label:`Gegner-Status für „${dispName}“`},
    {
      icon:meta.isEnemy?'👹':'📋',
      label:meta.isEnemy?'Als Gegner aktiv (klicken → Vorlage)':'Nur Vorlage (klicken → als Gegner aktivieren)',
      sub:meta.isEnemy?'Nur für Spielleiter & Admin sichtbar':'Normale Vorlage – noch keinem Würfelassistenten zugeordnet',
      active:Boolean(meta.isEnemy),
      badge:meta.isEnemy?'AN':'AUS',
      keepOpen:true,
      onClick:async()=>{
        const prefCamp=(CLOUD.activeCampaignId&&CLOUD.activeCampaignId!=='default'&&canManageCampaign(CLOUD.activeCampaignId))?CLOUD.activeCampaignId:'';
        await toggleEnemyActiveStatus(cid,prefCamp);
        openEnemyCampaignPicker(resolveFreshAnchor(anchorEl,sel),cid,true);
      }
    },
    {sep:true},
    {type:'label',label:'Kampagnen ankreuzen (Mehrfachauswahl)'}
  ];
  if(!gmCamps.length){
    items.push({icon:'ℹ️',label:'Keine SL-Kampagnen verfügbar',sub:'Du bist aktuell keiner Kampagne als Spielleiter zugewiesen.',disabled:true});
  }else{
    gmCamps.forEach(c=>{
      const checked=meta.campaignIds.includes(c.id);
      const vis=Boolean(checked&&meta.isEnemy&&!meta.archived&&meta.diceVisibleByCamp?.[c.id]);
      items.push({
        icon:checked?'☑️':'⬜',
        label:c.name||'Kampagne',
        sub:checked?(vis?'👁️ Im Würfelassistenten sichtbar':'🙈 Zugeordnet (im Würfelassistenten verborgen)'):'Ankreuzen, um als Gegner zuzuordnen',
        badge:checked?(vis?'👁️ AN':'🙈 AUS'):'',
        active:checked,
        keepOpen:true,
        onClick:async()=>{
          await toggleEnemyCampaignAssignment(cid,c.id);
          openEnemyCampaignPicker(resolveFreshAnchor(anchorEl,sel),cid,true);
        }
      });
    });
  }
  items.push({sep:true});
  items.push({icon:'✓',label:'Fertig',onClick:()=>closeCtxMenu()});
  openCtxMenu({
    key:`enemy-camp-picker:${cid}`,
    title:`Kampagnen: ${dispName}`,
    anchorEl,
    align:'right',
    minWidth:275,
    showClose:true,
    forceOpen,
    items
  });
}

export function openGmTemplateAddPicker(anchorEl,campId,forceOpen=false){
  const cid=String(campId||'').trim();
  if(!cid||cid==='default'||!canManageCampaign(cid)) return;
  const camp=getCampaigns().find(c=>c.id===cid);
  const campName=camp?.name||'Kampagne';
  const sel=`[data-action="open-gm-template-add-picker"][data-camp="${CSS.escape?CSS.escape(cid):cid}"]`;
  const allSheets=(CLOUD.list||[])
    .filter(ch=>ch&&isEnemySheet(ch.id)&&canViewEnemySheet(ch.id))
    .sort((a,b)=>String(a.name||'').localeCompare(String(b.name||''),'de'));
  const items=[
    {type:'label',label:`Vorlagen & Gegner für „${campName}“ ankreuzen`}
  ];
  if(!allSheets.length){
    items.push({icon:'ℹ️',label:'Noch keine Gegner-Vorlagen vorhanden',sub:'Erstelle zuerst unten oder über „+ Neuer Gegner“ eine Vorlage.',disabled:true});
  }else{
    allSheets.forEach(ch=>{
      const m=getEnemyMeta(ch.id);
      const checked=Boolean(m.isEnemy&&m.campaignIds.includes(cid));
      const owner=getCharOwner(ch.id);
      const subParts=[];
      if(m.category) subParts.push(m.category);
      if(owner) subParts.push(`von ${owner}`);
      if(m.archived) subParts.push('📦 wegsortiert');
      else if(m.isEnemy) subParts.push('👹 Gegner');
      else subParts.push('📋 Vorlage');
      items.push({
        icon:checked?'☑️':'⬜',
        label:String(ch.name||'').trim()||'Unbenannte Vorlage',
        sub:subParts.join(' • '),
        badge:checked?(m.diceVisibleByCamp?.[cid]?'👁️':'✓'):'',
        active:checked,
        keepOpen:true,
        onClick:async()=>{
          await toggleEnemyCampaignAssignment(ch.id,cid);
          openGmTemplateAddPicker(resolveFreshAnchor(anchorEl,sel),cid,true);
        }
      });
    });
  }
  items.push({sep:true});
  items.push({icon:'✓',label:'Fertig',onClick:()=>closeCtxMenu()});
  openCtxMenu({
    key:`gm-tpl-add-picker:${cid}`,
    title:`Vorlagen → ${campName}`,
    anchorEl,
    align:'right',
    minWidth:285,
    showClose:true,
    forceOpen,
    items
  });
}

export function openLobbyEnemyMenu(anchorEl,cid,contextCampId='',forceOpen=false){
  const ch=CLOUD.list.find(x=>x&&x.id===cid);
  if(!ch) return;
  const dispName=String(ch.name||'').trim()||'Unbenannte Vorlage';
  const meta=getEnemyMeta(cid);
  const canManage=canManageEnemySheet(cid);
  const canToggle=canToggleEnemyStatus();
  const isDelAsk=CLOUD.confirmDelCloudId===cid;
  const effCamp=(contextCampId&&contextCampId!=='default'&&canManageCampaign(contextCampId))
    ?contextCampId
    :((CLOUD.activeCampaignId&&CLOUD.activeCampaignId!=='default'&&canManageCampaign(CLOUD.activeCampaignId))?CLOUD.activeCampaignId:'');
  const effCampName=effCamp?(getCampaigns().find(c=>c.id===effCamp)?.name||'Kampagne'):'';
  const items=[];
  items.push({type:'label',label:meta.isEnemy?'Gegner-Aktionen':'Vorlagen-Aktionen'});
  if(canManage){
    items.push({icon:'✏️',label:'Bogen bearbeiten',sub:'Mittelklick = neuer Tab',action:'cloud-edit-char',href:`?char=${encodeURIComponent(cid)}`,dataset:{id:cid}});
  }
  items.push({icon:'👁️',label:'Im Ansichtsmodus öffnen',sub:'Schreibgeschützte Vorschau (Mittelklick = neuer Tab)',action:'cloud-view-char',href:`?char=${encodeURIComponent(cid)}&view=1`,dataset:{id:cid}});
  items.push({icon:'🔗',label:'Direktlink kopieren',sub:`?char=${cid}`,action:'copy-char-link',dataset:{id:cid}});
  if(canToggle){
    items.push({sep:true});
    items.push({type:'label',label:'Spielleiter-Steuerung'});
    items.push({
      icon:meta.isEnemy?'👹':'📋',
      label:meta.isEnemy?'Zurück zu Vorlage setzen':'Als Gegner aktivieren',
      badge:meta.isEnemy?'GEGNER':'VORLAGE',
      active:Boolean(meta.isEnemy),
      onClick:()=>{toggleEnemyActiveStatus(cid,effCamp);}
    });
    items.push({
      icon:'🗺️',
      label:'Kampagnen auswählen (Checkboxen)',
      badge:`${meta.campaignIds.length}`,
      keepOpen:true,
      onClick:()=>{openEnemyCampaignPicker(anchorEl,cid,true);}
    });
    if(effCamp&&meta.isEnemy&&meta.campaignIds.includes(effCamp)&&!meta.archived){
      const isVis=isEnemyDiceVisibleInCampaign(cid,effCamp);
      items.push({
        icon:isVis?'🙈':'👁️',
        label:isVis?`In „${effCampName}“ verbergen`:`In „${effCampName}“ im Würfelassistent zeigen`,
        active:isVis,
        onClick:()=>{toggleEnemyDiceVisibility(cid,effCamp);}
      });
    }
    if(effCamp){
      const iniCnt=getEnemyInitiativeCount(effCamp,cid);
      items.push({
        icon:'⚡',
        label:'In Initiative aufnehmen',
        sub:`Fügt Instanz in die Initiative von „${effCampName}“ ein`,
        badge:iniCnt>0?`${iniCnt}×`:'',
        action:'ini-add-enemy',
        dataset:{id:cid,camp:effCamp}
      });
      items.push({
        icon:'🙈',
        label:'Verborgen in Initiative (Hinterhalt)',
        sub:'Nur für die Spielleitung sichtbar in der Reihenfolge',
        action:'ini-add-enemy-hidden',
        dataset:{id:cid,camp:effCamp}
      });
      items.push({
        icon:'🧬',
        label:`Als Instanz für „${effCampName}“ klonen`,
        sub:'Legt z. B. „… #1“ als eigenständigen Gegner an',
        onClick:()=>{cloneEnemyToCampaign(cid,effCamp);}
      });
    }
  }
  if(canManage){
    items.push({sep:true});
    items.push({type:'label',label:'Verwaltung'});
    items.push({
      icon:'📋',
      label:'Als neue Vorlage kopieren',
      sub:'Eigenständige Vorlagen-Kopie anlegen',
      onClick:()=>{cloneEnemyToCampaign(cid,'');}
    });
    items.push({
      icon:meta.archived?'↩️':'📦',
      label:meta.archived?'Aus Archiv wiederherstellen':'Wegsortieren (Archivieren)',
      sub:meta.archived?'Wieder aktiv anzeigen':'Räumt den Gegner aus der aktiven Liste & verbirgt ihn',
      onClick:()=>{toggleEnemyArchived(cid);}
    });
    items.push({sep:true});
    if(isDelAsk){
      items.push({
        icon:'⚠️',
        label:'Wirklich löschen? (2/2)',
        sub:`„${dispName}“ in den Admin-Papierkorb verschieben`,
        danger:true,
        action:'cloud-del-yes',
        dataset:{id:cid}
      });
      items.push({
        icon:'↩️',
        label:'Löschen abbrechen',
        keepOpen:true,
        onClick:()=>{CLOUD.confirmDelCloudId=null;openLobbyEnemyMenu(anchorEl,cid,contextCampId,true);}
      });
    }else{
      items.push({
        icon:'🗑️',
        label:'In Papierkorb verschieben',
        sub:'Admin kann wiederherstellen oder endgültig löschen',
        danger:true,
        keepOpen:true,
        onClick:()=>{CLOUD.confirmDelCloudId=cid;openLobbyEnemyMenu(anchorEl,cid,contextCampId,true);}
      });
    }
  }
  openCtxMenu({
    key:`lobby-enemy-menu:${cid}`,
    title:dispName,
    anchorEl,
    align:'right',
    minWidth:260,
    forceOpen,
    items,
    onClose:()=>{if(CLOUD.confirmDelCloudId===cid) CLOUD.confirmDelCloudId=null;}
  });
}
function renderInlineTemplateCreateFormHtml(activeCampId, isGmContext=false){
  const targetCampId=isGmContext?activeCampId:String(CLOUD.newTemplateAsEnemyCampId||'').trim();
  const targetCamp=targetCampId?getCampaigns().find(c=>c.id===targetCampId):null;
  const asEnemy=Boolean(targetCamp&&targetCamp.id!=='default'&&canManageCampaign(targetCamp.id));
  const title=asEnemy
    ?`👹 Neuen Gegner für „${esc(targetCamp.name)}“ erstellen`
    :`📋 Neue Gegner-Vorlage für „${esc(CLOUD.currentUser||'Admin')}“ anlegen`;
  const borderCls=asEnemy?'border-rose-500/60 bg-rose-500/10':'border-purple-500/55 bg-purple-500/10';
  const hdrCls=asEnemy?'text-rose-300':'text-purple-300';
  return `<div class="subcard border-2 ${borderCls} p-3.5 sm:p-4 space-y-3 min-w-0 max-w-full">
    <div class="flex flex-wrap items-center justify-between gap-2 min-w-0">
      <h4 class="text-sm sm:text-base font-black ${hdrCls} break-words min-w-0">${title}</h4>
      <button type="button" data-action="create-template-cancel" aria-label="Abbrechen" class="btn py-1 px-2.5 text-xs shrink-0">✕</button>
    </div>
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-end">
      <div class="lg:col-span-4 min-w-0">
        <label class="block text-xs font-extrabold ${hdrCls} mb-1">Name</label>
        <input id="inpNewTplName" type="text" value="${esc(CLOUD.newTemplateName||'')}" placeholder="${asEnemy?'z.B. Schattenwolf-Alpha':'z.B. Goblin-Plünderer'}" class="inp w-full py-2 px-3 text-sm font-bold"/>
      </div>
      <div class="lg:col-span-3 min-w-0">
        <label class="block text-xs font-bold t-mut mb-1">Volk / Typ <span class="opacity-65">(opt.)</span></label>
        <input id="inpNewTplAncestry" type="text" value="${esc(CLOUD.newTemplateAncestry||'')}" placeholder="z.B. Bestie / Mensch" class="inp w-full py-2 px-3 text-sm font-semibold"/>
      </div>
      <div class="lg:col-span-3 min-w-0">
        <label class="block text-xs font-bold t-mut mb-1">Rolle / Konzept <span class="opacity-65">(opt.)</span></label>
        <input id="inpNewTplConcept" type="text" value="${esc(CLOUD.newTemplateConcept||'')}" placeholder="z.B. Fernkämpfer" class="inp w-full py-2 px-3 text-sm font-semibold"/>
      </div>
      <div class="lg:col-span-2 min-w-0">
        <label class="block text-xs font-bold t-mut mb-1">Kategorie <span class="opacity-65">(opt.)</span></label>
        <input id="inpNewTplCategory" type="text" value="${esc(CLOUD.newTemplateCategory||'')}" placeholder="Minion / Boss" class="inp w-full py-2 px-3 text-sm font-semibold"/>
      </div>
    </div>
    <div class="p-2.5 rounded-xl bg-black/25 border border-white/10 text-xs t-mut leading-relaxed">
      ${asEnemy
        ?`🔒 Wird direkt als <strong>Gegner</strong> für „${esc(targetCamp.name)}“ angelegt – <strong>nur für Spielleitung &amp; Admin sichtbar</strong> und zunächst im Würfelassistenten <strong>verborgen</strong>, bis du den Toggle aktivierst.`
        :`💡 Wird als <strong>Gegner-Vorlage</strong> gespeichert (erscheint nicht in der normalen Helden-Galerie). Spielleiter können Vorlagen später als Gegner aktivieren und beliebigen Kampagnen zuordnen.`}
    </div>
    <div class="flex flex-wrap items-center justify-end gap-2 pt-0.5">
      <button type="button" data-action="create-template-cancel" class="btn py-2 px-3.5 text-xs">Abbrechen</button>
      <button type="button" data-action="create-template-confirm" class="btn ${asEnemy?'bg-rose-600 text-white border-rose-500 hover:brightness-110':'btn-ok'} py-2 px-4 text-xs sm:text-sm font-black">${asEnemy?'👹 Gegner erstellen &amp; Bogen öffnen':'📋 Vorlage erstellen &amp; Bogen öffnen'}</button>
    </div>
  </div>`;
}

export function renderGmEnemiesListInnerHtml(activeCamp){
  const campId=activeCamp?.id||'';
  if(!campId||campId==='default'||!canManageCampaign(activeCamp)) return '';
  const myId=CLOUD.viewingRemote?'':S.charId;
  const allCamps=getCampaigns();
  const campMap=new Map(allCamps.map(c=>[c.id,c.name||'Kampagne']));
  const campEnemies=(CLOUD.list||[])
    .filter(ch=>{
      if(!ch||!isEnemySheet(ch.id)) return false;
      const m=getEnemyMeta(ch.id);
      return Boolean(m.isEnemy&&m.campaignIds.includes(campId));
    })
    .sort((a,b)=>{
      const va=isEnemyDiceVisibleInCampaign(a.id,campId)?1:0;
      const vb=isEnemyDiceVisibleInCampaign(b.id,campId)?1:0;
      if(va!==vb) return vb-va;
      return String(a.name||'').localeCompare(String(b.name||''),'de');
    });
  const tab=CLOUD.gmEnemyTab==='archived'?'archived':'active';
  const q=String(CLOUD.gmEnemySearch||'').trim().toLowerCase();
  const filtered=campEnemies.filter(ch=>{
    const m=getEnemyMeta(ch.id);
    if(tab==='archived'?!m.archived:m.archived) return false;
    if(!q) return true;
    const hay=[ch.name,ch.ancestry,ch.concept,m.category,getCharOwner(ch.id)].filter(Boolean).join(' ').toLowerCase();
    return hay.includes(q);
  });
  if(!filtered.length){
    return `<div class="subcard border-dashed py-6 px-4 text-center text-xs t-mut space-y-2">
      <div>${q
        ?`Keine Gegner passend zu „${esc(CLOUD.gmEnemySearch)}“ gefunden.`
        :(tab==='archived'
          ?'In dieser Kampagne sind aktuell keine Gegner wegsortiert.'
          :'Noch keine aktiven Gegner dieser Kampagne zugeordnet. Erstelle oben einen neuen Gegner oder ordne vorhandene Vorlagen per Checkbox zu.')}</div>
    </div>`;
  }
  return `<div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5 min-w-0">
    ${filtered.map(ch=>{
      const m=getEnemyMeta(ch.id);
      const isVis=isEnemyDiceVisibleInCampaign(ch.id,campId);
      const isOpenSheet=Boolean(UI.sheetLoaded&&ch.id===myId);
      const owner=getCharOwner(ch.id);
      const otherCampCount=Math.max(0,m.campaignIds.length-1);
      const cardBorder=isVis
        ?'border-emerald-400/75 bg-emerald-500/10 shadow-md'
        :(m.archived?'border-slate-500/40 bg-black/25 opacity-85':'border-rose-400/35 bg-black/20');
      return `<div class="card p-3 sm:p-4 flex flex-col justify-between gap-3 min-w-0 max-w-full ${cardBorder}">
        <div class="flex items-start gap-2.5 sm:gap-3 min-w-0">
          <div class="w-12 h-12 rounded-xl overflow-hidden border-2 ${isVis?'border-emerald-400':'border-rose-400/60'} bg-black/35 shrink-0 flex items-center justify-center shadow">
            ${ch.avatar?`<img src="${ch.avatar}" class="w-full h-full object-cover" alt=""/>`:`<span class="text-lg leading-none">👹</span>`}
          </div>
          <div class="min-w-0 flex-1 space-y-1">
            <div class="flex flex-wrap items-center gap-1.5 min-w-0">
              <span class="text-sm sm:text-base font-black break-words line-clamp-2 min-w-0">${esc(ch.name||'Unbenannter Gegner')}</span>
            </div>
            <div class="text-[11px] t-mut truncate">${esc(ch.ancestry||'Gegner')}${ch.concept?` • ${esc(ch.concept)}`:''}</div>
            <div class="flex flex-wrap items-center gap-1 pt-0.5 min-w-0">
              <span class="px-1.5 py-0.5 rounded text-[10px] font-black bg-rose-500/20 text-rose-200 border border-rose-400/40 tabular shrink-0">St. ${ch.level||1}</span>
              ${m.category?`<span class="px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-purple-500/20 text-purple-200 border border-purple-400/40 truncate max-w-[120px]">${esc(m.category)}</span>`:''}
              ${otherCampCount>0?`<span class="px-1.5 py-0.5 rounded text-[10px] font-bold bg-sky-500/20 text-sky-200 border border-sky-400/40 shrink-0" data-tip="Auch zugeordnet in: ${esc(m.campaignIds.filter(id=>id!==campId).map(id=>campMap.get(id)||id).join(', '))}">+${otherCampCount} Kamp.</span>`:''}
              ${owner?`<span class="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-black/30 t-mut truncate max-w-[110px]">👤 ${esc(owner)}</span>`:''}
              ${isOpenSheet?`<span class="px-1.5 py-0.5 rounded text-[10px] font-black bg-emerald-500/25 text-emerald-300 border border-emerald-400/60 shrink-0">Geöffnet</span>`:''}
            </div>
          </div>
        </div>

        <div class="grid grid-cols-4 gap-1.5 text-center text-[11px] tabular">
          <div class="subcard p-1.5 border bdr-line bg-black/25 min-w-0">
            <span class="block text-[9px] font-extrabold text-rose-400">LP</span>
            <strong class="font-black">${ch.lpCurrent??8}/${ch.lpMax??8}</strong>
          </div>
          <div class="subcard p-1.5 border bdr-line bg-black/25 min-w-0">
            <span class="block text-[9px] font-extrabold text-indigo-400">mLP</span>
            <strong class="font-black">${ch.mlpCurrent??8}/${ch.mlpMax??8}</strong>
          </div>
          <div class="subcard p-1.5 border bdr-line bg-black/25 min-w-0">
            <span class="block text-[9px] font-extrabold text-yellow-300">AP</span>
            <strong class="font-black">${ch.apCurrent??3}/${ch.apMax??3}</strong>
          </div>
          <div class="subcard p-1.5 border bdr-line bg-black/25 min-w-0">
            <span class="block text-[9px] font-extrabold text-amber-400">Ini</span>
            <strong class="font-black">${(ch.ini??0)>=0?'+'+(ch.ini??0):(ch.ini??0)}</strong>
          </div>
        </div>

        ${m.archived
          ?`<button type="button" data-action="toggle-enemy-archive" data-id="${esc(ch.id)}" class="btn w-full min-h-[40px] py-2 px-3 text-xs font-black border-amber-400/50 bg-amber-500/15 text-amber-200">↩️ Aus Archiv wiederherstellen</button>`
          :`<button type="button" role="switch" aria-checked="${isVis?'true':'false'}" data-action="toggle-enemy-dice-vis" data-id="${esc(ch.id)}" data-camp="${esc(campId)}" data-tip="${isVis?'Klicken, um diesen Gegner wieder aus der Gegnerliste des Würfelassistenten zu verbergen':'Klicken, um diesen Gegner in der Gegnerliste des Würfelassistenten dieser Kampagne freizuschalten (Spieler-Details bleiben verborgen)'}" class="btn w-full min-h-[40px] py-2 px-3 text-xs font-black justify-between transition-all ${isVis?'!border-emerald-400 !bg-emerald-500/25 text-emerald-200 shadow-sm':'opacity-90 hover:opacity-100'}">
              <span class="truncate">${isVis?'👁️ Im Würfelassistent sichtbar':'🙈 Im Würfelassistent verborgen'}</span>
              <span class="px-2 py-0.5 rounded-full text-[10px] font-black shrink-0 ${isVis?'bg-emerald-500 text-slate-950':'bg-black/35 t-mut'}">${isVis?'AN':'AUS'}</span>
            </button>`}

        <div class="flex items-center gap-1.5 pt-2 border-t bdr-line min-w-0">
          <a href="?char=${encodeURIComponent(ch.id)}" data-action="cloud-edit-char" data-id="${esc(ch.id)}" data-tip="Gegnerbogen öffnen und bearbeiten (Mittelklick / Rechtsklick = neuer Tab)" class="btn btn-pri min-h-[38px] py-1.5 px-2.5 text-xs font-black flex-1 min-w-0"><span class="truncate">✏️ Öffnen</span></a>
          ${!m.archived?(()=>{const iniCnt=getEnemyInitiativeCount(campId,ch.id);return `<button type="button" data-action="ini-add-enemy" data-id="${esc(ch.id)}" data-camp="${esc(campId)}" data-tip="${iniCnt>0?`Bereits ${iniCnt}× in der Initiative – erneut klicken für weitere Instanz`:'Diesen Gegner direkt in die Initiative dieser Kampagne aufnehmen'}" class="btn min-h-[38px] py-1.5 px-2.5 text-xs font-black shrink-0 tabular ${iniCnt>0?'border-amber-400/70 bg-amber-500/20 text-amber-200':'border-amber-400/45 bg-amber-500/10 text-amber-200'}">⚡${iniCnt>0?` ${iniCnt}×`:' Ini'}</button>`;})():''}
          <button type="button" data-action="open-enemy-camp-picker" data-id="${esc(ch.id)}" aria-haspopup="menu" data-tip="Kampagnen-Zuordnung per Checkbox ändern" class="btn min-h-[38px] py-1.5 px-2 text-xs font-extrabold shrink-0">🗺️ <span class="tabular">${m.campaignIds.length}</span></button>
          <button type="button" data-action="clone-enemy-camp" data-id="${esc(ch.id)}" data-camp="${esc(campId)}" data-tip="Klon für diese Kampagne anlegen (z. B. #1, #2)" class="btn min-h-[38px] py-1.5 px-2 text-xs font-extrabold shrink-0" aria-label="Gegner für Kampagne klonen">🧬</button>
          <button type="button" data-action="open-lobby-enemy-menu" data-id="${esc(ch.id)}" data-camp="${esc(campId)}" aria-haspopup="menu" aria-label="Weitere Aktionen für ${esc(ch.name||'Gegner')}" data-tip="Weitere Aktionen (In Ini, Klonen, Wegsortieren, Vorlage, Löschen)" class="btn min-h-[38px] min-w-[38px] py-1.5 px-2 text-base font-black shrink-0">⋮</button>
        </div>
      </div>`;
    }).join('')}
  </div>`;
}

export function renderGmEnemiesPanelHtml(activeCamp){
  const campId=activeCamp?.id||'';
  if(!campId||campId==='default'||!canManageCampaign(activeCamp)) return '';
  const campEnemies=(CLOUD.list||[]).filter(ch=>{
    if(!ch||!isEnemySheet(ch.id)) return false;
    const m=getEnemyMeta(ch.id);
    return Boolean(m.isEnemy&&m.campaignIds.includes(campId));
  });
  const activeCnt=campEnemies.filter(ch=>!getEnemyMeta(ch.id).archived).length;
  const archCnt=campEnemies.filter(ch=>getEnemyMeta(ch.id).archived).length;
  const diceVisCnt=campEnemies.filter(ch=>isEnemyDiceVisibleInCampaign(ch.id,campId)).length;
  const tab=CLOUD.gmEnemyTab==='archived'?'archived':'active';
  const showInlineCreate=Boolean(CLOUD.newTemplateOpen&&CLOUD.newTemplateAsEnemyCampId===campId);
  return `<div class="subcard p-2.5 sm:p-4 space-y-3 border-2 border-rose-500/45 bg-rose-500/10 min-w-0 max-w-full">
    <div class="flex flex-wrap items-center justify-between gap-2 min-w-0 ${CLOUD.gmEnemiesOpen||showInlineCreate?'border-b bdr-line pb-2.5':''}">
      <div class="flex flex-wrap items-center gap-1.5 sm:gap-2 min-w-0 max-w-full">
        <button type="button" data-action="toggle-gm-enemies-open" aria-expanded="${CLOUD.gmEnemiesOpen?'true':'false'}" aria-label="${CLOUD.gmEnemiesOpen?'Spielleiter-Gegner einklappen':'Spielleiter-Gegner ausklappen'}" data-tip="${CLOUD.gmEnemiesOpen?'Spielleiter-Gegner einklappen':'Spielleiter-Gegner ausklappen'}" class="btn w-8 h-8 p-0 text-xs font-black shrink-0 border-rose-400/50 text-rose-200">${CLOUD.gmEnemiesOpen?'▾':'▸'}</button>
        <h3 class="text-xs sm:text-sm font-black text-rose-300 uppercase tracking-wider break-words min-w-0">👹 Spielleiter-Gegner</h3>
        <span class="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-black/30 text-rose-200 border border-rose-400/40 inline-flex items-center gap-1 max-w-full min-w-0"><span class="shrink-0">🔒</span><span class="truncate">Nur SL · ${esc(activeCamp.name||'Kampagne')}</span></span>
        <span class="px-2 py-0.5 rounded-full text-[10px] font-black tabular shrink-0 ${diceVisCnt>0?'bg-emerald-500/25 text-emerald-300 border border-emerald-400/60':'bg-black/25 t-mut border bdr-line'}">👁️ ${diceVisCnt} im Würfel</span>
        <span class="pill cursor-default text-[10px] py-0.5 px-2 tabular shrink-0">⚔️ ${activeCnt} aktiv${archCnt?` · 📦 ${archCnt}`:''}</span>
      </div>
      <div class="flex flex-wrap items-center gap-1.5 min-w-0 max-w-full">
        <button type="button" data-action="open-new-template" data-camp="${esc(campId)}" data-tip="Neuen Gegner direkt für diese Kampagne erstellen" class="btn bg-rose-600/85 hover:bg-rose-600 text-white border-rose-400/60 py-1 px-2.5 text-xs font-extrabold shrink-0">+ Neuer Gegner</button>
        <button type="button" data-action="open-gm-template-add-picker" data-camp="${esc(campId)}" aria-haspopup="menu" data-tip="Vorhandene Vorlagen oder Gegner per Checkbox dieser Kampagne zuordnen" class="btn py-1 px-2.5 text-xs font-extrabold border-purple-400/50 bg-purple-500/15 text-purple-200 shrink-0">📋 <span class="hidden sm:inline">Aus </span>Vorlagen</button>
        ${activeCnt>0?`<button type="button" data-action="ini-add-visible-enemies" data-camp="${esc(campId)}" data-tip="${diceVisCnt>0?`Alle ${diceVisCnt} im Würfelassistent sichtbaren Gegner dieser Kampagne in die Initiative laden`:`Alle ${activeCnt} aktiven Gegner dieser Kampagne in die Initiative laden`}" class="btn py-1 px-2.5 text-xs font-extrabold border-amber-400/55 bg-amber-500/15 text-amber-200 shrink-0">⚡ <span class="hidden sm:inline">${diceVisCnt>0?'Sichtbare':'Gegner'} </span>→ Ini</button>`:''}
        ${diceVisCnt>0?`<button type="button" data-action="hide-all-camp-enemies-dice" data-camp="${esc(campId)}" data-tip="Alle Gegner dieser Kampagne sofort wieder aus dem Würfelassistenten ausblenden" class="btn py-1 px-2.5 text-xs font-extrabold border-amber-400/50 bg-amber-500/15 text-amber-200 shrink-0">🙈 Alle ausblenden</button>`:''}
        <button type="button" data-action="toggle-gm-enemies-open" class="btn py-1 px-2 text-xs shrink-0">${CLOUD.gmEnemiesOpen?'▴':'▾'}<span class="hidden sm:inline"> ${CLOUD.gmEnemiesOpen?'Einklappen':'Öffnen'}</span></button>
      </div>
    </div>
    ${showInlineCreate?renderInlineTemplateCreateFormHtml(campId,true):''}
    ${CLOUD.gmEnemiesOpen?`
      <div class="flex flex-wrap items-center justify-between gap-2 min-w-0">
        <div class="inline-flex rounded-xl p-0.5 bg-black/25 border bdr-line text-xs shrink-0">
          <button type="button" data-action="set-gm-enemy-tab" data-tab="active" class="px-2.5 py-1 rounded-lg font-extrabold transition-all ${tab==='active'?'bg-rose-500/30 text-rose-200 shadow-sm':'t-mut hover:text-white'}">⚔️ Aktiv (${activeCnt})</button>
          <button type="button" data-action="set-gm-enemy-tab" data-tab="archived" class="px-2.5 py-1 rounded-lg font-extrabold transition-all ${tab==='archived'?'bg-amber-500/30 text-amber-200 shadow-sm':'t-mut hover:text-white'}">📦 Wegsortiert (${archCnt})</button>
        </div>
        <div class="flex-1 min-w-[160px] max-w-xs">
          <input type="search" data-gm-enemy-search="1" value="${esc(CLOUD.gmEnemySearch||'')}" placeholder="Gegner filtern..." class="inp w-full py-1 px-2.5 text-xs font-semibold"/>
        </div>
      </div>
      <div class="text-[11px] t-mut leading-relaxed">
        💡 Nur Gegner mit aktivem <strong class="text-emerald-300">👁️ AN</strong>-Toggle erscheinen in der Gegnerliste des Würfelassistenten dieser Kampagne. Für Spieler bleiben Attribute, Waffen, Fertigkeiten &amp; Rüstung verborgen.
      </div>
      <div data-gm-enemies-grid="1" class="min-w-0">${renderGmEnemiesListInnerHtml(activeCamp)}</div>
    `:''}
  </div>`;
}

export function renderTemplatesGridInnerHtml(activeCamp){
  const isGmOrAdmin=canToggleEnemyStatus();
  const curUserLow=String(CLOUD.currentUser||'').trim().toLowerCase();
  const myId=CLOUD.viewingRemote?'':S.charId;
  const allCamps=getCampaigns();
  const campMap=new Map(allCamps.map(c=>[c.id,c.name||'Kampagne']));
  const activeCampId=activeCamp?.id||'default';
  const canCloneToActiveCamp=Boolean(isGmOrAdmin&&activeCampId!=='default'&&canManageCampaign(activeCampId));
  const activeCampName=activeCamp?.name||'Kampagne';
  const allVisible=(CLOUD.list||[])
    .filter(ch=>ch&&isEnemySheet(ch.id)&&canViewEnemySheet(ch.id))
    .sort((a,b)=>String(a.name||'').localeCompare(String(b.name||''),'de'));
  const flt=isGmOrAdmin?(CLOUD.templateFilter||'all'):'all';
  const q=String(CLOUD.templateSearch||'').trim().toLowerCase();
  const filtered=allVisible.filter(ch=>{
    const m=getEnemyMeta(ch.id);
    const ownLow=getCharOwner(ch.id).toLowerCase();
    if(isGmOrAdmin){
      if(flt==='templates'&&(m.isEnemy||m.archived)) return false;
      if(flt==='enemies'&&(!m.isEnemy||m.archived)) return false;
      if(flt==='mine'&&(!curUserLow||ownLow!==curUserLow)) return false;
      if(flt==='archived'&&!m.archived) return false;
      if(flt==='all'&&m.archived) return false;
    }
    if(!q) return true;
    const hay=[ch.name,ch.ancestry,ch.concept,m.category,getCharOwner(ch.id)].filter(Boolean).join(' ').toLowerCase();
    return hay.includes(q);
  });
  if(!filtered.length){
    return `<div class="subcard border-dashed py-8 px-4 text-center text-xs t-mut space-y-2">
      <div>${q
        ?`Keine Vorlagen passend zu „${esc(CLOUD.templateSearch)}“ gefunden.`
        :(isGmOrAdmin
          ?(flt==='archived'?'Keine wegsortierten Vorlagen/Gegner vorhanden.':'In diesem Filter liegen aktuell keine Vorlagen oder Gegner.')
          :'Du hast noch keine eigenen Gegner-Vorlagen angelegt. Klicke oben auf „+ Neue Vorlage“, um eine zu bauen!')}</div>
    </div>`;
  }
  return `<div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 min-w-0">
    ${filtered.map(ch=>{
      const m=getEnemyMeta(ch.id);
      const owner=getCharOwner(ch.id);
      const isMine=Boolean(owner&&curUserLow&&owner.toLowerCase()===curUserLow);
      const isOpenSheet=Boolean(UI.sheetLoaded&&ch.id===myId);
      const canManage=canManageEnemySheet(ch.id);
      const assignedCamps=m.campaignIds.map(id=>({id,name:campMap.get(id)||id,vis:isEnemyDiceVisibleInCampaign(ch.id,id)}));
      const cardCls=m.isEnemy
        ?(m.archived?'border-slate-500/45 bg-black/25 opacity-85':'border-rose-400/45 bg-rose-500/5')
        :'border-purple-400/35 bg-purple-500/5';
      return `<div class="card p-3.5 sm:p-4 flex flex-col justify-between gap-3 min-w-0 max-w-full ${cardCls}">
        <div class="flex items-start gap-3 min-w-0">
          <div class="w-12 h-12 rounded-xl overflow-hidden border-2 ${m.isEnemy?'border-rose-400/70':'border-purple-400/60'} bg-black/35 shrink-0 flex items-center justify-center shadow">
            ${ch.avatar?`<img src="${ch.avatar}" class="w-full h-full object-cover" alt=""/>`:`<span class="text-lg leading-none">${m.isEnemy?'👹':'📋'}</span>`}
          </div>
          <div class="min-w-0 flex-1 space-y-1">
            <div class="flex flex-wrap items-center gap-1.5 min-w-0">
              <span class="text-sm sm:text-base font-black break-words line-clamp-2 min-w-0">${esc(ch.name||'Unbenannte Vorlage')}</span>
            </div>
            <div class="text-[11px] t-mut truncate">${esc(ch.ancestry||'Volk')} • ${esc(ch.concept||'Konzept')}</div>
            <div class="flex flex-wrap items-center gap-1 pt-0.5 min-w-0">
              <span class="px-1.5 py-0.5 rounded text-[10px] font-black ${m.isEnemy?'bg-rose-500/25 text-rose-200 border border-rose-400/50':'bg-purple-500/20 text-purple-200 border border-purple-400/40'} shrink-0">${m.isEnemy?'👹 Gegner':'📋 Vorlage'}</span>
              <span class="px-1.5 py-0.5 rounded text-[10px] font-black bg-acc-soft text-acc border bdr-acc tabular shrink-0">St. ${ch.level||1}</span>
              ${m.category?`<span class="px-1.5 py-0.5 rounded text-[10px] font-bold bg-black/30 text-amber-200 border border-amber-400/30 truncate max-w-[110px]">${esc(m.category)}</span>`:''}
              ${m.archived?`<span class="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-500/30 text-slate-300 border border-slate-400/40 shrink-0">📦 Archiv</span>`:''}
              ${owner?renderUserNamePill(owner,{cls:`px-1.5 py-0.5 rounded text-[10px] font-black max-w-full ${isMine?'bg-emerald-500/25 text-emerald-300 border border-emerald-400/50':'bg-indigo-500/20 text-indigo-300 border border-indigo-400/40'}`}):''}
              ${isOpenSheet?`<span class="px-1.5 py-0.5 rounded text-[10px] font-black bg-emerald-500/25 text-emerald-300 border border-emerald-400/60 shrink-0">Geöffnet</span>`:''}
            </div>
          </div>
        </div>

        <div class="grid grid-cols-4 gap-1.5 text-center text-[11px] tabular">
          <div class="subcard p-1.5 border bdr-line bg-black/25 min-w-0"><span class="block text-[9px] font-extrabold text-rose-400">LP</span><strong class="font-black">${ch.lpCurrent??8}/${ch.lpMax??8}</strong></div>
          <div class="subcard p-1.5 border bdr-line bg-black/25 min-w-0"><span class="block text-[9px] font-extrabold text-indigo-400">mLP</span><strong class="font-black">${ch.mlpCurrent??8}/${ch.mlpMax??8}</strong></div>
          <div class="subcard p-1.5 border bdr-line bg-black/25 min-w-0"><span class="block text-[9px] font-extrabold text-yellow-300">AP</span><strong class="font-black">${ch.apCurrent??3}/${ch.apMax??3}</strong></div>
          <div class="subcard p-1.5 border bdr-line bg-black/25 min-w-0"><span class="block text-[9px] font-extrabold text-amber-400">Ini</span><strong class="font-black">${(ch.ini??0)>=0?'+'+(ch.ini??0):(ch.ini??0)}</strong></div>
        </div>

        ${isGmOrAdmin?`
          <div class="space-y-1.5 min-w-0">
            <div class="grid grid-cols-2 gap-1.5 min-w-0">
              <button type="button" role="switch" aria-checked="${m.isEnemy?'true':'false'}" data-action="toggle-enemy-active" data-id="${esc(ch.id)}" data-tip="${m.isEnemy?'Als Gegner aktiv – klicken, um wieder als normale Vorlage zu markieren':'Als Gegner aktivieren, um diese Vorlage Kampagnen zuzuordnen'}" class="btn min-h-[40px] py-1.5 px-2.5 text-xs font-black justify-between min-w-0 ${m.isEnemy?'!border-rose-400 !bg-rose-500/25 text-rose-200':'opacity-90'}">
                <span class="truncate">${m.isEnemy?'👹 Gegner':'📋 Vorlage'}</span>
                <span class="px-1.5 py-0.5 rounded text-[9px] font-black shrink-0 ${m.isEnemy?'bg-rose-500 text-white':'bg-black/35 t-mut'}">${m.isEnemy?'AN':'AUS'}</span>
              </button>
              <button type="button" data-action="open-enemy-camp-picker" data-id="${esc(ch.id)}" aria-haspopup="menu" data-tip="Kampagnen per Mehrfachauswahl (Checkboxen) zuordnen" class="btn min-h-[40px] py-1.5 px-2.5 text-xs font-extrabold min-w-0 ${assignedCamps.length?'border-sky-400/55 bg-sky-500/15 text-sky-200':''}">
                <span class="truncate">🗺️ Kampagnen (${assignedCamps.length})</span>
              </button>
            </div>
            ${assignedCamps.length?`<div class="flex flex-wrap items-center gap-1 min-w-0">
              ${assignedCamps.map(c=>`<span class="px-1.5 py-0.5 rounded text-[10px] font-bold border max-w-full truncate ${c.vis?'bg-emerald-500/20 text-emerald-200 border-emerald-400/50':'bg-black/30 t-mut bdr-line'}" data-tip="${esc(c.name)}: ${c.vis?'Im Würfelassistent sichtbar':'Im Würfelassistent verborgen'}">${c.vis?'👁️':'📁'} ${esc(c.name)}</span>`).join('')}
            </div>`:''}
          </div>
        `:''}

        <div class="flex items-center gap-1.5 pt-2 border-t bdr-line min-w-0">
          ${canManage
            ?`<a href="?char=${encodeURIComponent(ch.id)}" data-action="cloud-edit-char" data-id="${esc(ch.id)}" data-tip="Vorlage / Gegnerbogen öffnen (Mittelklick / Rechtsklick = neuer Tab)" class="btn btn-pri min-h-[38px] py-1.5 px-2.5 text-xs font-black flex-1 min-w-0"><span class="truncate">✏️ Bogen öffnen</span></a>`
            :`<a href="?char=${encodeURIComponent(ch.id)}&amp;view=1" data-action="cloud-view-char" data-id="${esc(ch.id)}" data-tip="Vorlage im Ansichtsmodus öffnen (Mittelklick / Rechtsklick = neuer Tab)" class="btn bdr-acc bg-acc-soft text-acc min-h-[38px] py-1.5 px-2.5 text-xs font-black flex-1 min-w-0"><span class="truncate">👁️ Ansehen</span></a>`}
          ${canCloneToActiveCamp?`<button type="button" data-action="clone-enemy-camp" data-id="${esc(ch.id)}" data-camp="${esc(activeCampId)}" data-tip="Als eigenständigen Gegner in „${esc(activeCampName)}“ klonen" class="btn min-h-[38px] py-1.5 px-2.5 text-xs font-extrabold border-rose-400/45 bg-rose-500/15 text-rose-200 shrink-0">⚡ <span class="hidden sm:inline">Klonen</span></button>`:''}
          <button type="button" data-action="open-lobby-enemy-menu" data-id="${esc(ch.id)}" data-camp="${esc(canCloneToActiveCamp?activeCampId:'')}" aria-haspopup="menu" aria-label="Weitere Aktionen für ${esc(ch.name||'Vorlage')}" class="btn min-h-[38px] min-w-[38px] py-1.5 px-2 text-base font-black shrink-0">⋮</button>
        </div>
      </div>`;
    }).join('')}
  </div>`;
}

export function renderLobbyTemplatesSectionHtml(activeCamp){
  if(!CLOUD.currentUser&&!CLOUD.isAdmin) return '';
  const isGmOrAdmin=canToggleEnemyStatus();
  const allVisible=(CLOUD.list||[]).filter(ch=>ch&&isEnemySheet(ch.id)&&canViewEnemySheet(ch.id));
  const tplCnt=allVisible.filter(ch=>!getEnemyMeta(ch.id).isEnemy&&!getEnemyMeta(ch.id).archived).length;
  const enCnt=allVisible.filter(ch=>getEnemyMeta(ch.id).isEnemy&&!getEnemyMeta(ch.id).archived).length;
  const archCnt=allVisible.filter(ch=>getEnemyMeta(ch.id).archived).length;
  const curUserLow=String(CLOUD.currentUser||'').trim().toLowerCase();
  const mineCnt=curUserLow?allVisible.filter(ch=>getCharOwner(ch.id).toLowerCase()===curUserLow).length:0;
  const activeCampId=activeCamp?.id||'default';
  const showInlineCreate=Boolean(CLOUD.newTemplateOpen&&(!CLOUD.newTemplateAsEnemyCampId||CLOUD.newTemplateAsEnemyCampId!==activeCampId||!canManageCampaign(activeCamp)));
  const flt=CLOUD.templateFilter||'all';
  return `<section class="card p-3 sm:p-6 space-y-4 min-w-0 max-w-full">
    <div class="flex flex-wrap items-center justify-between gap-2.5 min-w-0 ${CLOUD.templatesOpen||showInlineCreate?'border-b bdr-line pb-2.5':''}">
      <div class="flex flex-wrap items-center gap-2 min-w-0 max-w-full">
        <button type="button" data-action="toggle-lobby-templates-open" aria-expanded="${CLOUD.templatesOpen?'true':'false'}" aria-label="${CLOUD.templatesOpen?'Gegner-Vorlagen einklappen':'Gegner-Vorlagen ausklappen'}" data-tip="${CLOUD.templatesOpen?'Gegner-Vorlagen einklappen':'Gegner-Vorlagen ausklappen'}" class="btn w-8 h-8 p-0 text-xs font-black shrink-0">${CLOUD.templatesOpen?'▾':'▸'}</button>
        <h2 class="text-sm sm:text-lg font-black break-words min-w-0">${isGmOrAdmin?'📋 Gegner-Vorlagen &amp; Bestiarium':'📋 Meine Gegner-Vorlagen'}</h2>
        <span class="pill cursor-default text-[10px] py-0.5 px-2 tabular shrink-0">${allVisible.length} ${allVisible.length===1?'Eintrag':'Einträge'}</span>
        ${isGmOrAdmin&&enCnt?`<span class="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500/20 text-rose-200 border border-rose-400/45 tabular shrink-0">👹 ${enCnt} aktiv</span>`:''}
      </div>
      <div class="flex flex-wrap items-center gap-1.5 shrink-0">
        <button type="button" data-action="open-new-template" data-camp="" data-tip="Neue Gegner-Vorlage anlegen (getrennt von der normalen Helden-Galerie)" class="btn btn-ok py-1.5 px-3 text-xs font-black">+ Neue Vorlage</button>
        <button type="button" data-action="toggle-lobby-templates-open" class="btn py-1.5 px-2.5 text-xs shrink-0">${CLOUD.templatesOpen?'▴':'▾'}<span class="hidden sm:inline"> ${CLOUD.templatesOpen?'Einklappen':'Öffnen'}</span></button>
      </div>
    </div>
    ${showInlineCreate?renderInlineTemplateCreateFormHtml('',false):''}
    ${CLOUD.templatesOpen?`
      <div class="space-y-3 min-w-0">
        <div class="text-xs t-mut leading-relaxed">
          ${isGmOrAdmin
            ?'💡 Erstelle hier Gegnertemplates oder aktiviere Vorlagen als <strong class="text-rose-300">👹 Gegner</strong> und ordne sie per Checkbox-Menü beliebig vielen deiner Kampagnen zu. Im Kampagnen-Panel oben steuerst du dann pro Gegner die Sichtbarkeit im Würfelassistenten.'
            :'💡 Hier kannst du eigene Gegner-Vorlagen bauen, ohne Kampagnen zu überfluten. Spielleiter können Vorlagen später als Gegner aktivieren und ihren Kampagnen zuordnen – fremde Vorlagen und SL-Gegner bleiben dabei verborgen.'}
        </div>
        ${isGmOrAdmin||allVisible.length>=4?`
          <div class="flex flex-wrap items-center justify-between gap-2 min-w-0">
            ${isGmOrAdmin?`<div class="flex flex-wrap items-center gap-1 text-xs min-w-0">
              ${[
                ['all',`Alle (${tplCnt+enCnt})`],
                ['templates',`📋 Vorlagen (${tplCnt})`],
                ['enemies',`👹 Gegner (${enCnt})`],
                ...(curUserLow?[['mine',`👤 Meine (${mineCnt})`]]:[]),
                ['archived',`📦 Archiv (${archCnt})`]
              ].map(([k,lbl])=>`<button type="button" data-action="set-template-filter" data-filter="${k}" class="btn py-1 px-2.5 text-[11px] font-extrabold ${flt===k?'btn-pri':'opacity-85 hover:opacity-100'}">${lbl}</button>`).join('')}
            </div>`:'<div></div>'}
            <div class="flex-1 min-w-[160px] max-w-xs">
              <input type="search" data-template-search="1" value="${esc(CLOUD.templateSearch||'')}" placeholder="Vorlagen suchen..." class="inp w-full py-1 px-2.5 text-xs font-semibold"/>
            </div>
          </div>
        `:''}
        <div data-templates-grid="1" class="min-w-0">${renderTemplatesGridInnerHtml(activeCamp)}</div>
      </div>
    `:''}
  </section>`;
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
  const heroList=CLOUD.list.filter(ch=>ch&&!isEnemySheet(ch.id));
  const campCharList=heroList.filter(ch=>getCharCampaignId(ch.id)===activeCampId);
  const myTotalCnt=CLOUD.currentUser?heroList.filter(ch=>getCharOwner(ch.id).toLowerCase()===CLOUD.currentUser.toLowerCase()).length:0;
  const myCampCnt=CLOUD.currentUser?campCharList.filter(ch=>getCharOwner(ch.id).toLowerCase()===CLOUD.currentUser.toLowerCase()).length:0;
  const visibleList=CLOUD.filterMine&&CLOUD.currentUser?campCharList.filter(ch=>getCharOwner(ch.id).toLowerCase()===CLOUD.currentUser.toLowerCase()||(UI.sheetLoaded&&ch.id===myId)):campCharList;
  const creatableCamps=getCreatableCampaigns(CLOUD.currentUser);
  const hasSpecificCamp=creatableCamps.some(c=>c.id!=='default');
  const selNewCampId=creatableCamps.some(c=>c.id===CLOUD.newCharCampId)?CLOUD.newCharCampId:(creatableCamps.some(c=>c.id===activeCampId)?activeCampId:'default');
  const canReadPublicNotes=activeCampId!=='default'&&(CLOUD.isAdmin||(CLOUD.currentUser&&(isUserInCampaign(activeCamp,CLOUD.currentUser)||isCampaignMainGM(activeCamp,CLOUD.currentUser))));
  const pubNoteCharList=[...campCharList];
  if(canReadPublicNotes&&S.charId&&!isEnemySheet(S)&&getCharCampaignId(S.charId)===activeCampId&&!pubNoteCharList.some(c=>c.id===S.charId)&&(S.profile.name||S.campaignNotes?.find(n=>n.id==='cn_public')?.content)){
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
            <a href="?sheet=1" data-action="open-local-sheet" data-tip="Öffnet den lokal gespeicherten Charakterbogen (oder einen Test-Bogen) direkt ohne Cloud-Zwang (Mittelklick / Rechtsklick = neuer Tab)" class="btn btn-ok py-1.5 px-3 text-xs font-extrabold">🛠️ Lokalen Bogen öffnen / testen</a>
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
          <a href="?sheet=1" data-action="open-local-sheet" data-tip="Öffnet den lokal gespeicherten Charakterbogen (oder einen Test-Bogen) direkt ohne Cloud-Zwang (Mittelklick / Rechtsklick = neuer Tab)" class="btn py-2.5 px-4 text-xs sm:text-sm font-extrabold border-emerald-500/60 bg-emerald-500/15 text-emerald-300">🛠️ Lokalen Bogen öffnen / testen</a>
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
            ${(()=>{const archCnt=getArchivedCampaigns().length;return archCnt>0?`<button type="button" data-action="open-admin-panel" data-tip="Archivierte Kampagnen im Admin-Menü verwalten / wiederherstellen" class="btn py-1.5 px-2.5 text-xs font-extrabold border-amber-400/50 bg-amber-500/15 text-amber-200 shrink-0 tabular">📦 <span class="hidden sm:inline">Archiv </span>(${archCnt})</button>`:'';})()}
          `:''}
          <button type="button" data-action="cloud-refresh-list" ${CLOUD.loading?'disabled':''} aria-label="Lobby-Liste aktualisieren" data-tip="Charakter- und Kampagnenliste vom Server aktualisieren" class="btn py-1.5 px-2.5 sm:px-3 text-xs shrink-0">${CLOUD.loading?'⏳':'🔄'}<span class="hidden sm:inline"> ${CLOUD.loading?'Lade...':'Aktualisieren'}</span></button>
          ${CLOUD.isAdmin&&activeCamp&&activeCamp.id!=='default'?`<div class="sm:pl-2.5 sm:ml-1 sm:border-l bdr-line flex flex-wrap items-center gap-1.5 max-w-full shrink-0">
            ${CLOUD.campAction==='archive'
              ?`<span class="inline-flex flex-wrap items-center gap-1 max-w-full"><button type="button" data-action="camp-archive-confirm" class="btn bg-amber-500 text-slate-950 border-amber-400 py-1 px-2.5 text-[11px] font-black whitespace-normal text-left">Archivieren? (${campCharList.length} → Allgemein)</button><button type="button" data-action="camp-action-cancel" aria-label="Archivieren abbrechen" class="btn py-1 px-2 text-[11px] shrink-0">✕</button></span>`
              :(CLOUD.campAction==='delete'
                ?`<span class="inline-flex flex-wrap items-center gap-1 max-w-full"><button type="button" data-action="camp-delete-confirm" class="btn bg-rose-600 text-white border-rose-600 py-1 px-2.5 text-[11px] font-black whitespace-normal text-left">Endgültig löschen? (${campCharList.length} → Allgemein)</button><button type="button" data-action="camp-action-cancel" aria-label="Löschen abbrechen" class="btn py-1 px-2 text-[11px] shrink-0">✕</button></span>`
                :`<button type="button" data-action="camp-archive-ask" aria-label="Kampagne archivieren" data-tip="Kampagne archivieren (aus Lobby entfernen, im Admin-Menü wiederherstellbar; Charaktere → Allgemein)" class="btn py-1.5 px-2.5 sm:px-3 text-xs border-amber-400/55 bg-amber-500/15 text-amber-200 shrink-0">📦<span class="hidden sm:inline"> Archivieren</span></button><button type="button" data-action="camp-delete-ask" aria-label="Kampagne löschen" data-tip="Kampagne dauerhaft löschen (enthaltene Charaktere werden automatisch in den allgemeinen Bereich verschoben)" class="btn btn-err py-1.5 px-2.5 sm:px-3 text-xs shrink-0">🗑️<span class="hidden sm:inline"> Löschen</span></button>`)}
          </div>`:''}
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
          const cCnt=heroList.filter(ch=>getCharCampaignId(ch.id)===c.id).length;
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
                ?`<a href="?char=${encodeURIComponent(ch.id)}" data-action="cloud-edit-char" data-id="${esc(ch.id)}" aria-label="${esc(ch.name||'Charakter')} öffnen und bearbeiten" data-tip="Charakterbogen zum Bearbeiten öffnen (Mittelklick / Rechtsklick = neuer Tab)" class="btn btn-pri min-h-[40px] py-2 px-3 text-xs font-black flex-1 min-w-0"><span class="truncate">✏️ <span class="hidden sm:inline">Bogen </span>öffnen</span></a>`
                :`<a href="?char=${encodeURIComponent(ch.id)}&amp;view=1" data-action="cloud-view-char" data-id="${esc(ch.id)}" aria-label="${esc(ch.name||'Charakter')} ansehen" data-tip="Charakterbogen im schreibgeschützten Ansichtsmodus öffnen (Mittelklick / Rechtsklick = neuer Tab)" class="btn bdr-acc bg-acc-soft text-acc min-h-[40px] py-2 px-3 text-xs font-black flex-1 min-w-0"><span class="truncate">👁️ Ansehen</span></a>`}
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

      ${renderGmEnemiesPanelHtml(activeCamp)}

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
              ${myCampNoteChar?`<button type="button" data-action="lobby-focus-my-pubnote" data-id="${esc(myCampNoteChar.id)}" aria-label="Meine öffentliche Notizseite (${esc(myCampNoteChar.charName||myCampNoteChar.name||'Held')}) anzeigen" data-tip="Direkt zur ersten öffentlichen Notizseite deines Charakters hier im Lobby-Dokument springen" class="btn bdr-acc bg-acc-soft text-acc py-1 px-2 sm:px-2.5 text-xs font-extrabold max-w-full min-w-0"><span class="truncate">🎯 Meine Seite<span class="hidden sm:inline"> (${esc(myCampNoteChar.charName||myCampNoteChar.name||'Held')})</span></span></button><a href="?char=${encodeURIComponent(myCampNoteChar.id)}&amp;notes=1" data-action="lobby-open-char-pubnote" data-id="${esc(myCampNoteChar.id)}" aria-label="Öffentliche Notizen im Charakterbogen öffnen" data-tip="Eigenen Charakterbogen öffnen und direkt die öffentlichen Kampagnennotizen bearbeiten (Mittelklick / Rechtsklick = neuer Tab)" class="btn btn-pri py-1 px-2 sm:px-2.5 text-xs font-extrabold shrink-0">📝 <span class="hidden sm:inline">Im Bogen öffnen</span><span class="sm:hidden">Im Bogen</span></a>`:''}
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
                    <a href="?char=${encodeURIComponent(activePubPage.charId)}" data-action="cloud-load-char" data-id="${esc(activePubPage.charId)}" aria-label="Charakterbogen öffnen" data-tip="Diesen Charakterbogen öffnen (Mittelklick / Rechtsklick = neuer Tab)" class="btn py-1 px-2 sm:px-2.5 text-[11px] bdr-acc bg-acc-soft text-acc font-extrabold shrink-0">🔎 <span class="hidden sm:inline">Bogen </span>öffnen</a>
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

    <!-- Sektion 2b: Aufklappbare Gegner-Vorlagen-Werkstatt -->
    ${renderLobbyTemplatesSectionHtml(activeCamp)}

    <!-- Sektion 2c: Kampagnen-Initiative (SL-gesteuert, live synchronisiert) -->
    <div id="lobbyIniMount">${renderLobbyInitiativeCardHtml(getActiveLiveCampaignId())}</div>

    <!-- Sektion 3: Live-Würfel-Bereich am Ende der Lobby -->
    <div id="lobbyLiveDiceMount" data-last-camp-id="${esc(getActiveLiveCampaignId())}">${renderLobbyLiveDiceHtml()}</div>
  </div>`;
}

export function refreshGmEnemiesGridDOM(){
  const grid=document.querySelector('[data-gm-enemies-grid]');
  if(!grid) return;
  const visibleCampaigns=getAccessibleCampaigns(CLOUD.currentUser);
  const activeCamp=visibleCampaigns.find(c=>c.id===CLOUD.activeCampaignId)||visibleCampaigns[0]||getCampaigns()[0];
  grid.innerHTML=renderGmEnemiesListInnerHtml(activeCamp);
}

export function refreshTemplatesGridDOM(){
  const grid=document.querySelector('[data-templates-grid]');
  if(!grid) return;
  const visibleCampaigns=getAccessibleCampaigns(CLOUD.currentUser);
  const activeCamp=visibleCampaigns.find(c=>c.id===CLOUD.activeCampaignId)||visibleCampaigns[0]||getCampaigns()[0];
  grid.innerHTML=renderTemplatesGridInnerHtml(activeCamp);
}
