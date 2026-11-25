import {
  ATTRS, SK_RANKS, BIO_FIELDS, WEAPON_SUBTYPES, DEF_EQ_SEC_ORDER
} from '../constants.js';
import {
  $, uid, esc, clone, toInt, fmtSign, stripHtml, toRtfHtml, cardColorStyle, hasTagX, fmtTagLabel, canSetSecParent
} from '../utils.js';
import {
  hooks
} from '../ui-hooks.js';
import {
  openCtxMenu, toast, save, getWeaponSubtype, fmtCustomValSummarySuffix, renderLinkedAmmoCustomDmgHtml, isWeaponMassiv, syncEquipmentToInventory, S, D, isMobileLayout, UI
} from '../state.js';
import {
  invalidateModsCache, calcActiveMods, getAdvDisForContext, getWeaponRollMeta, getTagDesc, fmtAdvSrcLines, getAttrTot, getSkBonus, findEqItem, getMentalArmorSummary
} from '../calc.js';
import {
  applyDiceAutoAdvDis, syncDiceFromSheet, renderDice
} from '../dice.js';
import {
  renderRtfToolbarHtml
} from '../notes.js';

export function syncLinkedInvDOM(kind,srcId,sourceEl=null){
  const hadInv=Boolean((S.inventory||[]).some(it=>it?.linkedEq&&it.linkedEq.kind===kind&&it.linkedEq.id===srcId));
  syncEquipmentToInventory(S);
  const inv=(S.inventory||[]).find(it=>it?.linkedEq&&it.linkedEq.kind===kind&&it.linkedEq.id===srcId);
  if(!inv) return false;
  const invCard=document.querySelector(`[data-inv-item="${inv.id}"]`);
  if(!hadInv&&!invCard){
    return 'created';
  }
  document.querySelectorAll(`input[data-inv="${inv.id}:name"]`).forEach(inp=>{if(inp!==sourceEl)inp.value=inv.name;});
  document.querySelectorAll(`input[data-inv="${inv.id}:notes"]`).forEach(inp=>{if(inp!==sourceEl)inp.value=inv.notes;});
  if(kind==='ammo'){
    document.querySelectorAll(`input[data-inv="${inv.id}:qty"]`).forEach(inp=>{if(inp!==sourceEl)inp.value=String(inv.qty??'0');});
    document.querySelectorAll(`[data-inv-collapsed-qty="${inv.id}"]`).forEach(el=>{el.textContent=`× ${String(inv.qty??'0')}`;});
  }
  return true;
}
export function syncLinkedAmmoDOM(ammoId,sourceEl=null){
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
  syncLinkedInvDOM('ammo',ammoId,sourceEl);
}
export function syncInvSecNameDOM(secId){
  const sec=(S.invSections||[]).find(s=>s.id===secId);
  if(!sec) return;
  const nm=String(sec.name||'').trim()||'Beutel';
  document.querySelectorAll(`[data-inv-sec-lbl="${secId}"]`).forEach(el=>{el.textContent=`🎒 ${nm}`;});
  document.querySelectorAll(`[data-invsec-parent-lbl="${secId}"]`).forEach(el=>{el.textContent=`↳ in: ${nm}`;});
}
export function getInvSecDepth(secId){
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
export function getOrderedInvSecsForPicker(){
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
export function addEqTagToItem(kind,itemId,tagName){
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
  hooks.renderMain?.();
  if(D.open) renderDice();
  save();
  return true;
}
export function openAddWeaponMenu(anchorEl,ddKey,alignRight=false){
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
export function openEqTagPicker(anchorEl,kind,itemId){
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
export function openWpTypePicker(anchorEl,wId){
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
        hooks.renderMain?.(); save();
      }
    }))
  });
}
export function openWpAttrPicker(anchorEl,wId){
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
        hooks.renderMain?.(); save();
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
export function openWpSkillPicker(anchorEl,wId){
  const w=S.weapons.find(x=>x.id===wId); if(!w) return;
  const items=[{
    label:'Keine Fertigkeit',
    badge:'+0',
    active:!w.skillId||!S.skills.some(s=>s.id===w.skillId),
    onClick:()=>{
      w.skillId='';
      if(D.weaponId===w.id){D.skillId=null;D.cSkill='0';syncDiceFromSheet();if(D.open)renderDice();}
      hooks.renderMain?.(); save();
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
          hooks.renderMain?.(); save();
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
export function openWpAmmoPicker(anchorEl,wId){
  const w=S.weapons.find(x=>x.id===wId); if(!w) return;
  const items=[{
    label:'Keine Munition zugeordnet',
    active:!w.ammoId||!S.ammos.some(a=>a.id===w.ammoId),
    onClick:()=>{
      w.ammoId='';
      invalidateModsCache();
      syncDiceFromSheet();
      hooks.renderMain?.(); if(D.open) renderDice(); save();
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
          hooks.renderMain?.(); if(D.open) renderDice(); save();
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
export function openArZonePicker(anchorEl,arId,forceOpen=false){
  const ar=S.armors.find(a=>a.id===arId); if(!ar) return;
  const hzNames=[...new Set(S.hitZones.map(z=>String(z.zone||'').trim()).filter(Boolean))];
  const customNames=[...new Set([...(ar.extraZones||[]),...(ar.zones||[])])].filter(zn=>zn&&!hzNames.some(h=>h.toLowerCase()===zn.toLowerCase()));
  const toggleZ=zn=>{
    if(!Array.isArray(ar.zones)) ar.zones=[];
    const idx=ar.zones.findIndex(z=>z.toLowerCase()===zn.toLowerCase());
    if(idx>-1) ar.zones.splice(idx,1);
    else ar.zones.push(zn);
    hooks.renderMain?.(); save();
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
export function openInvSecPicker(anchorEl,itemId){
  const it=S.inventory.find(x=>x.id===itemId); if(!it) return;
  const invSecs=Array.isArray(S.invSections)?S.invSections:[];
  const curSecId=(it.sectionId&&invSecs.some(s=>s.id===it.sectionId))?it.sectionId:'';
  const items=[{
    icon:'🎒',
    label:'Ohne Beutel (Hauptebene)',
    active:!curSecId,
    onClick:()=>{
      it.sectionId='';
      hooks.renderMain?.(); save();
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
          hooks.renderMain?.(); save();
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
export function openInvSecParentPicker(anchorEl,secId){
  const invSecs=Array.isArray(S.invSections)?S.invSections:[];
  const sec=invSecs.find(s=>s.id===secId); if(!sec) return;
  const items=[{
    icon:'🎒',
    label:'Hauptebene (kein Überordner)',
    active:!sec.parentSectionId,
    onClick:()=>{
      sec.parentSectionId='';
      hooks.renderMain?.(); save();
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
          hooks.renderMain?.(); save();
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

export function renderEqTagBar(kind,item,tagList,ltype,lbl){
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

export const isTab5PhoneDefault=()=>window.innerWidth<768||isMobileLayout();
export function isTab5EquipNotesCollapsed(){
  const ov=UI.tab5?.equipNotes;
  if(ov!==null&&ov!==undefined) return Boolean(ov);
  return isTab5PhoneDefault();
}
export function isTab5BioGalleryCollapsed(){
  const ov=UI.tab5?.bioGallery;
  if(ov!==null&&ov!==undefined) return Boolean(ov);
  return !(Array.isArray(S.bioImages)&&S.bioImages.length>0)||isTab5PhoneDefault();
}
export function isTab5BioFieldCollapsed(k){
  const map=UI.tab5?.bioFields||{};
  if(Object.prototype.hasOwnProperty.call(map,k)) return Boolean(map[k]);
  return isTab5PhoneDefault();
}
export function getEqItemSiblingInfo(kind,id){
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
export function moveEqSecOrder(secKey,dir){
  if(!Array.isArray(S.equipSecOrder)||S.equipSecOrder.length!==4) S.equipSecOrder=[...DEF_EQ_SEC_ORDER];
  const i=S.equipSecOrder.indexOf(secKey), ni=i+Number(dir);
  if(i>-1&&ni>=0&&ni<S.equipSecOrder.length){
    const [it]=S.equipSecOrder.splice(i,1);
    S.equipSecOrder.splice(ni,0,it);
    hooks.renderMain?.(); save();
    return true;
  }
  return false;
}
export function moveEqItemOrder(kind,id,dir){
  if(kind==='inv'&&Array.isArray(S.invSections)&&S.invSections.length){
    const it=S.inventory.find(x=>x.id===id); if(!it) return false;
    const secId=(it.sectionId&&S.invSections.some(s=>s.id===it.sectionId))?it.sectionId:'';
    const sibs=S.inventory.filter(x=>((x.sectionId&&S.invSections.some(s=>s.id===x.sectionId))?x.sectionId:'')===secId);
    const si=sibs.findIndex(x=>x.id===it.id), tSib=sibs[si+Number(dir)];
    if(tSib){
      const i1=S.inventory.indexOf(it),i2=S.inventory.indexOf(tSib);
      S.inventory[i1]=tSib; S.inventory[i2]=it;
      hooks.renderMain?.(); save();
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
      hooks.renderMain?.(); save();
      return true;
    }
  }
  return false;
}
export function moveInvSecOrder(secId,dir){
  const sec=(S.invSections||[]).find(s=>s.id===secId); if(!sec) return false;
  const pId=sec.parentSectionId||'', sibs=S.invSections.filter(s=>(s.parentSectionId||'')===pId);
  const si=sibs.findIndex(s=>s.id===sec.id), tSib=sibs[si+Number(dir)];
  if(tSib){
    const i1=S.invSections.indexOf(sec), i2=S.invSections.indexOf(tSib);
    S.invSections[i1]=tSib; S.invSections[i2]=sec;
    hooks.renderMain?.(); save();
    return true;
  }
  return false;
}
export function duplicateEqItem(kind,id){
  const arr={weapon:S.weapons,ammo:S.ammos,armor:S.armors,inv:S.inventory}[kind];
  if(!arr) return false;
  const idx=arr.findIndex(x=>x.id===id);
  if(idx<0) return false;
  const copy=clone(arr[idx]);
  copy.id=uid();
  if(kind==='inv') copy.linkedEq=null;
  if(String(copy.name||'').trim()) copy.name=`${String(copy.name).trim()} (Kopie)`;
  if(Array.isArray(copy.customDmg)) copy.customDmg=copy.customDmg.map(c=>({...c,id:uid()}));
  if(Array.isArray(copy.customProt)) copy.customProt=copy.customProt.map(c=>({...c,id:uid()}));
  arr.splice(idx+1,0,copy);
  if(kind==='weapon'||kind==='armor'||kind==='ammo') syncEquipmentToInventory(S,{forceKeys:[`${kind}:${copy.id}`]});
  invalidateModsCache(); syncDiceFromSheet();
  hooks.renderMain?.(); if(D.open) renderDice(); save();
  toast('📋 Eintrag dupliziert');
  return true;
}
export function deleteEqItem(kind,id){
  UI.confirmDelEqKey='';
  if(kind==='weapon'){
    S.weapons=S.weapons.filter(w=>w.id!==id);
    syncEquipmentToInventory(S);
    if(D.weaponId===id){D.weaponId=null;D.wRollCat='Normaler Test';D.sitActive={};applyDiceAutoAdvDis(true);if(D.open)renderDice();}
    hooks.renderMain?.(); save(); return true;
  }
  if(kind==='ammo'){
    S.ammos=S.ammos.filter(a=>a.id!==id);
    S.weapons.forEach(w=>{if(w.ammoId===id)w.ammoId='';});
    syncEquipmentToInventory(S);
    invalidateModsCache(); syncDiceFromSheet();
    hooks.renderMain?.(); if(UI.modal==='ammoList') hooks.renderModal?.(); if(D.open) renderDice(); save(); return true;
  }
  if(kind==='armor'){
    S.armors=S.armors.filter(a=>a.id!==id);
    if(UI.arZoneDrafts) delete UI.arZoneDrafts[id];
    syncEquipmentToInventory(S);
    invalidateModsCache(); syncDiceFromSheet();
    hooks.renderMain?.(); if(D.open) renderDice(); save(); return true;
  }
  if(kind==='inv'){
    const it=S.inventory.find(i=>i.id===id);
    if(it?.linkedEq?.kind&&it.linkedEq.id){
      return deleteEqItem(it.linkedEq.kind,it.linkedEq.id);
    }
    S.inventory=S.inventory.filter(i=>i.id!==id);
    hooks.renderMain?.(); save(); return true;
  }
  return false;
}
export function openEqItemMenu(anchorEl,kind,id,forceOpen=false){
  const it=findEqItem(kind,id); if(!it) return;
  const defName={weapon:'Waffe',ammo:'Munition',armor:'Rüstung',inv:'Gegenstand'}[kind]||'Eintrag';
  const titleName=String(it.name||'').trim()||defName;
  const {idx,len}=getEqItemSiblingInfo(kind,id);
  const delKey=`${kind}:${id}`;
  const isDelConfirm=UI.confirmDelEqKey===delKey;
  const linkedKindLbl=it.linkedEq?({weapon:'Waffe',armor:'Rüstung',ammo:'Munition'}[it.linkedEq.kind]||'Ausrüstung'):'';
  const items=[];
  if(kind==='weapon'){
    items.push({type:'label',label:'Kampf-Aktionen'});
    items.push({icon:'🎲',label:'Trefferwurf würfeln',action:'roll-weapon',dataset:{id,wcat:'Trefferwurf'}});
    items.push({icon:'🛡️',label:'Parieren würfeln',action:'roll-weapon',dataset:{id,wcat:'Parieren'}});
    items.push({icon:'🛡️',label:'Blocken würfeln',action:'roll-weapon',dataset:{id,wcat:'Blocken'}});
    items.push({sep:true});
  }
  if(kind==='inv'&&it.linkedEq){
    items.push({icon:'↗',label:`Zur verknüpften ${linkedKindLbl} springen`,action:'jump-eq-item',dataset:{kind:it.linkedEq.kind,id:it.linkedEq.id}});
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
      sub:linkedKindLbl?`Entfernt „${titleName}“ aus ${linkedKindLbl} & Inventar`:`„${titleName}“ dauerhaft entfernen`,
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
      label:linkedKindLbl?`Aus ${linkedKindLbl} & Inventar löschen`:'Löschen',
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
export function openEqSecMenu(anchorEl,secKey,forceOpen=false){
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
export function openInvSecMenu(anchorEl,secId,forceOpen=false){
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
export function renderEqItemMenuBtn(kind,id){
  return `<button type="button" data-action="open-eq-item-menu" data-kind="${kind}" data-id="${id}" aria-haspopup="menu" aria-expanded="false" aria-label="Aktionen" data-tip="Weitere Aktionen (Farben, Bild, Sortieren, Duplizieren, Löschen)" class="btn w-8 h-8 sm:w-7 sm:h-7 p-0 text-sm font-black shrink-0">⋮</button>`;
}
export function renderEqMiniThumb(kind,id,imgUrl){
  if(!imgUrl) return '';
  return `<button type="button" data-action="pick-item-img" data-kind="${kind}" data-id="${id}" data-tip="Bild-Aktionen öffnen (ändern, Großansicht oder entfernen)" class="w-8 h-8 rounded-lg overflow-hidden border bdr-acc bg-acc-soft shrink-0 cursor-pointer hover:opacity-90 transition-opacity p-0 shadow-sm"><img src="${imgUrl}" alt="" class="w-full h-full object-cover"/></button>`;
}

export function renderEqCustomValBoxes(kind,itemId,list,delAct){
  const phVal=kind==='armor'?'0':'-';
  return (Array.isArray(list)?list:[]).map(cv=>`<div class="min-w-0 flex flex-col gap-1 p-1.5 rounded-lg bg-black/20 border bdr-line">
    <div class="flex items-center gap-1 min-w-0">
      <input data-eqcv="${kind}:${itemId}:${cv.id}:label" type="text" value="${esc(cv.label)}" placeholder="z.B. Energie" data-tip="Bezeichnung des benutzerdefinierten Werts (z.B. Energie, Feuer)" class="inp-line w-full min-w-0 text-center text-[11px] font-bold !py-0 !px-0.5 leading-tight"/>
      <button type="button" data-action="${delAct}" data-id="${itemId}" data-cvid="${cv.id}" data-tip="Zusatzwert entfernen" class="t-mut hover:text-rose-400 text-xs font-black leading-none px-1 shrink-0 cursor-pointer">✕</button>
    </div>
    <input data-eqcv="${kind}:${itemId}:${cv.id}:val" type="text" inputmode="text" value="${esc(cv.val)}" placeholder="${phVal}" class="inp w-full min-w-0 text-center font-black py-1 px-1.5 text-xs"/>
  </div>`).join('');
}
export function renderAddWeaponDropdown(ddKey,btnCls='btn',alignRight=false){
  return `<button type="button" data-action="open-add-weapon-menu" data-ddkey="${esc(ddKey)}" data-align="${alignRight?'right':'left'}" aria-haspopup="menu" aria-expanded="false" class="${btnCls}">+ Waffe ▾</button>`;
}
export function renderWeaponRollBtns(w,wm,compact=false){
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
export function renderWeaponCard(w,idx,len){
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

export function renderAmmoCard(am,idx,len){
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

export function renderArmorCard(ar,idx,len,hzNames){
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
  const mProtVal=toInt(ar.mentalProt,0);
  if(ar.collapsed){
    return `<div data-eqitem="armor:${ar.id}" class="subcard py-2 px-2.5 sm:px-3 border-emerald-500/30 space-y-1.5 min-w-0" ${winStyle}>
      ${hdrRow}
      <div class="flex flex-wrap items-center gap-1.5 tabular min-w-0">
        <span class="pill cursor-default text-[11px] py-0.5 px-2 text-emerald-400 font-black">gRP ${esc(ar.grp)}</span>
        ${mProtVal?`<span class="pill cursor-default text-[11px] py-0.5 px-2 border-indigo-400/50 bg-indigo-500/15 text-indigo-300 font-black">🧠 mRS ${esc(ar.mentalProt)}</span>`:''}
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
      <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 tabular">
        <div class="min-w-0 p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/40"><label class="block text-[10px] font-extrabold text-emerald-400 text-center mb-0.5" data-tip="Generelle Rüstungspunkte (gRP) gegen physischen Schaden">gRP</label><input data-arf="${ar.id}:grp" type="text" value="${esc(ar.grp)}" placeholder="0" class="inp w-full min-w-0 text-center font-black py-1 px-1.5 text-xs border-emerald-500/50"/></div>
        <div class="min-w-0 p-1.5 rounded-lg bg-indigo-500/10 border border-indigo-400/45"><label class="block text-[10px] font-extrabold text-indigo-300 text-center mb-0.5" data-tip="Mentaler Rüstungsschutz (mRS) gegen mLP-Schaden – wirkt bei angelegter Rüstung global, unabhängig von Trefferzonen">🧠 Ment. RS</label><input data-arf="${ar.id}:mentalProt" type="text" value="${esc(ar.mentalProt??'0')}" placeholder="0" class="inp w-full min-w-0 text-center font-black py-1 px-1.5 text-xs border-indigo-400/50 text-indigo-200"/></div>
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

export function renderInvSecSlot(parentId,beforeSecId){
  return `<div data-inv-sec-slot="${esc(parentId)}" data-before-sec="${esc(beforeSecId||'')}" class="pw-sec-slot"></div>`;
}

export function renderInvItemCard(it,idx,len,invSecs){
  const hasInvSec=invSecs.length>0;
  const curSecId=(it.sectionId&&invSecs.some(s=>s.id===it.sectionId))?it.sectionId:'';
  const curSecObj=curSecId?invSecs.find(s=>s.id===curSecId):null;
  const colStyle=it.color?`style="color:${esc(it.color)}"`:'', winStyle=cardColorStyle(it);
  const qtyTxt=String(it.qty??'').trim();
  const catTxt=String(it.category??'').trim();
  const noteTxt=String(it.notes??'').trim();
  const lnk=it.linkedEq&&typeof it.linkedEq==='object'?it.linkedEq:null;
  const lnkSrc=lnk?findEqItem(lnk.kind,lnk.id):null;
  const lnkBadgeHtml=lnk?(()=>{
    const cfg=lnk.kind==='weapon'
      ?{ico:lnkSrc?.wType==='ranged'?'🏹':'⚔️',lbl:'Waffe',cls:'border-sky-400/50 bg-sky-500/15 text-sky-300'}
      :lnk.kind==='armor'
        ?{ico:'🛡️',lbl:lnkSrc?.equipped===false?'Rüstung (Abgel.)':'Rüstung',cls:'border-emerald-400/50 bg-emerald-500/15 text-emerald-300'}
        :{ico:'🎯',lbl:'Munition',cls:'border-amber-400/50 bg-amber-500/15 text-amber-300'};
    return `<button type="button" data-action="jump-eq-item" data-kind="${esc(lnk.kind)}" data-id="${esc(lnk.id)}" data-tip="Automatisch mit ${cfg.lbl} verknüpft – klicken zum Springen" class="px-1.5 py-0.5 rounded-md border text-[10px] font-black shrink-0 inline-flex items-center gap-1 cursor-pointer hover:brightness-110 ${cfg.cls}"><span>${cfg.ico}</span><span class="hidden sm:inline">${cfg.lbl}</span><span class="opacity-75">↗</span></button>`;
  })():'';
  const namePh=lnk?(lnk.kind==='weapon'?'Waffenname...':lnk.kind==='armor'?'Rüstungsname...':'Munitionsname...'):'Gegenstand...';
  const hdrRow=`<div class="flex items-center gap-1.5 min-w-0">
    <button type="button" data-action="toggle-eqitem-collapse" data-kind="inv" data-id="${it.id}" data-tip="${it.collapsed?'Gegenstand ausklappen':'Gegenstand einklappen'}" aria-expanded="${!it.collapsed}" class="btn w-8 h-8 sm:w-7 sm:h-7 p-0 text-xs font-black shrink-0">${it.collapsed?'▸':'▾'}</button>
    <span draggable="true" data-drag-invitem="${it.id}" data-tip="Ziehen zum Sortieren oder Verschieben in einen Beutel" class="w-7 h-7 rounded bg-black/25 border bdr-line t-mut text-xs font-black cursor-grab select-none shrink-0 inline-flex items-center justify-center">⠿</span>
    ${renderEqMiniThumb('inv',it.id,it.img)}
    <input data-inv="${it.id}:name" type="text" value="${esc(it.name)}" ${colStyle} placeholder="${namePh}" class="inp-line flex-1 min-w-0 text-sm sm:text-base font-extrabold"/>
    ${lnkBadgeHtml}
    ${it.collapsed&&qtyTxt?`<span data-inv-collapsed-qty="${it.id}" class="pill cursor-default text-[11px] py-0.5 px-2 tabular text-acc shrink-0">× ${esc(qtyTxt)}</span>`:''}
    ${renderEqItemMenuBtn('inv',it.id)}
  </div>`;
  if(it.collapsed){
    const hasBadges=Boolean((catTxt&&catTxt!=='Inventar'&&!lnk)||curSecObj||noteTxt);
    return `<div data-inv-item="${it.id}" class="subcard py-2 px-2.5 sm:px-3 space-y-1.5 min-w-0" ${winStyle}>
      ${hdrRow}
      ${hasBadges?`<div class="flex flex-wrap items-center gap-1.5 min-w-0">
        ${catTxt&&catTxt!=='Inventar'&&!lnk?`<span class="pill cursor-default text-[11px] py-0.5 px-2">${esc(catTxt)}</span>`:''}
        ${curSecObj?`<span class="pill cursor-default text-[11px] py-0.5 px-2 text-acc" data-inv-sec-lbl="${curSecObj.id}">🎒 ${esc(curSecObj.name||'Beutel')}</span>`:''}
        ${noteTxt?`<span class="text-[11px] t-mut truncate max-w-full">📝 ${esc(noteTxt)}</span>`:''}
      </div>`:''}
    </div>`;
  }
  return `<div data-inv-item="${it.id}" class="subcard p-2.5 sm:p-3 space-y-2.5 min-w-0" ${winStyle}>
    ${hdrRow}
    <div class="pt-2 border-t bdr-line grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 items-end">
      <div class="min-w-0">
        <label class="block text-[10px] font-bold t-mut mb-0.5">MENGE${lnk?.kind==='ammo'?' (SYNCHRON)':''}</label>
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

export function renderInvTable(items){
  const invSecs=Array.isArray(S.invSections)?S.invSections:[];
  const list=Array.isArray(items)?items:[];
  if(!list.length) return `<div class="py-4 text-center text-xs t-mut">Noch keine Gegenstände eingetragen.</div>`;
  return `<div class="space-y-2.5">${list.map((it,idx)=>renderInvItemCard(it,idx,list.length,invSecs)).join('')}</div>`;
}

export function renderInvSection(sec,sIdx,sibLen=1,depth=0){
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

export function renderEquipCategorySec(secKey,secIdx,totalSecs,hzNames,eqH){
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
    const mRs=getMentalArmorSummary();
    const mRsBadge=mRs.total?`<span id="eqMentalArmorPill" data-tip="${esc(mRs.tip)}" class="ml-1.5 px-2 py-0.5 rounded-md border border-indigo-400/50 bg-indigo-500/15 text-indigo-300 text-[11px] font-black cursor-help tabular">🧠 mRS ${mRs.total}</span>`:`<span id="eqMentalArmorPill" class="hidden"></span>`;
    return `<section data-eqsec="armors" class="card p-3 sm:p-4 space-y-3 min-w-0" ${winStyle}>
      ${hdrCommon(`<span class="${meta.color?'':'text-emerald-400'}">🛡️ Rüstungen (${S.armors.length})</span>${mRsBadge}`,`<button type="button" data-action="add-armor" class="btn border-emerald-400/60 text-emerald-400 py-1 px-2.5 text-xs">+ Rüstung</button>`)}
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

export function tplEquipment(){
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

