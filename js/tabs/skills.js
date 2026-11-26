import {
  ATTRS, SK_CATS, SK_RANKS, SK_CAT_SHORT
} from '../constants.js';
import {
  findVisibleBtn, $, uid, esc, toInt, fmtSign, isHex, cardColorStyle, canSetSecParent, sanitizeSecHierarchy
} from '../utils.js';
import {
  hooks
} from '../ui-hooks.js';
import {
  openCtxMenu, toast, logChron, save, getWeaponSubtype, S, D, isMobileLayout, UI
} from '../state.js';
import {
  calcActiveMods, getAdvDisForContext, getEquippedWeaponsForSkill, getEquippedShieldsForSkill, formatBlockModShort, getWeaponDualWieldInfo, calcAutoSkCost, calcSkCost, calcProg, fmtAdvSrcLines, getAttrCol, getAttrTot, getSkAutoBonus, hasSkBonusOvr, getSkBonus
} from '../calc.js';
import {
  syncDiceFromSheet
} from '../dice.js';

export const skAttrOpts=(sel,M=calcActiveMods())=>ATTRS.map(a=>`<option value="${a.k}" ${a.k===sel?'selected':''}>${a.k} (${getAttrTot(a.k,M)})</option>`).join('');
export const skCatOpts=sel=>Object.entries(SK_CATS).map(([k,v])=>`<option value="${k}" ${k===sel?'selected':''}>${v.l}</option>`).join('');

export function buildSkRollBtnMeta(sk,M=calcActiveMods()){
  const autoB=getSkAutoBonus(sk.rank), hasOvr=hasSkBonusOvr(sk), effB=getSkBonus(sk), av=getAttrTot(sk.linkedAttr,M), pool=av+effB;
  const skAd=getAdvDisForContext({skillId:sk.id,attrKey:sk.linkedAttr},M), adTip=fmtAdvSrcLines(skAd.src);
  const eqWps=getEquippedWeaponsForSkill(sk.id,S);
  const eqShs=getEquippedShieldsForSkill(sk.id,S);
  const skBadge=(skAd.autoAdv||skAd.autoDis)?`<span class="text-[10px] font-black shrink-0 ${skAd.autoAdv>=skAd.autoDis?'text-emerald-400':'text-rose-400'}">${skAd.autoAdv?`+${skAd.autoAdv}V`:''}${skAd.autoDis?`${skAd.autoAdv?'/':''}+${skAd.autoDis}N`:''}</span>`:'';
  let wpBadge='', wpTip='';
  if(eqWps.length===1){
    const w0=eqWps[0], sub=getWeaponSubtype(w0.wType), dw=getWeaponDualWieldInfo(w0,S);
    const wNm=String(w0.name||'').trim()||sub.label;
    wpBadge=`<span class="text-[10px] font-black shrink-0 text-amber-300">${sub.icon}${dw.isDualWield?`+${dw.dis}N`:''}</span>`;
    wpTip=`\n${sub.icon} Angelegte Waffe: ${wNm} (öffnet Trefferwurf inkl. Waffenschaden${dw.isDualWield?` • ${dw.label}: +${dw.dis}N`:''})`;
  }else if(eqWps.length>=2){
    wpBadge=`<span class="text-[10px] font-black shrink-0 text-amber-300">⚔️×${eqWps.length}</span>`;
    const names=eqWps.map(w=>{const dw=getWeaponDualWieldInfo(w,S);const nm=String(w.name||'').trim()||getWeaponSubtype(w.wType).label;return dw.isDualWield?`${nm} (${dw.label} +${dw.dis}N)`:nm;}).join(', ');
    wpTip=`\n⚔️ ${eqWps.length} angelegte Waffen: ${names} (Klick öffnet Waffenwahl)`;
  }
  let shBadge='', shTip='';
  if(eqShs.length===1){
    const sh0=eqShs[0];
    const shNm=String(sh0.name||'').trim()||'Schild';
    const bm=formatBlockModShort(sh0.blockMod);
    shBadge=`<span class="text-[10px] font-black shrink-0 text-cyan-300">🛡️${bm?bm:''}</span>`;
    shTip=`\n🛡️ Angelegter Schild: ${shNm}${bm?` (Block ${bm})`:''} (Klick öffnet Schild-Optionen)`;
  }else if(eqShs.length>=2){
    shBadge=`<span class="text-[10px] font-black shrink-0 text-cyan-300">🛡️×${eqShs.length}</span>`;
    const names=eqShs.map(sh=>{const bm=formatBlockModShort(sh.blockMod);const nm=String(sh.name||'').trim()||'Schild';return bm?`${nm} (${bm})`:nm;}).join(', ');
    shTip=`\n🛡️ ${eqShs.length} angelegte Schilde: ${names} (Klick öffnet Schildwahl)`;
  }
  const skColStyle=sk.color?`style="color:${esc(sk.color)}"`:`style="color:var(--txt)"`;
  const dispName=String(sk.name||'').trim()||'Unbenannte Fertigkeit';
  const tip=`Probe auf ${dispName} (${pool} = ${sk.linkedAttr} ${av} ${fmtSign(effB)}${hasOvr?` • Manuell, Grad: +${autoB}`:''})${wpTip}${shTip}${adTip?'\n'+adTip:''}`;
  const innerHtml=`<span class="px-2 py-0.5 rounded-md bg-acc-soft border bdr-acc text-acc font-black shrink-0 tabular inline-flex items-center gap-1"><span>🎲 ${pool}</span>${wpBadge}${shBadge}${skBadge}</span><span class="font-extrabold truncate text-left flex-1 min-w-0" ${skColStyle}>${esc(dispName)}</span>`;
  return {pool,av,effB,autoB,hasOvr,skBadge,wpBadge,shBadge,tip,innerHtml};
}

export function moveSkillOrder(skId,dir,isChron=false){
  const sk=S.skills.find(s=>s.id===skId); if(!sk) return false;
  const d=Number(dir);
  if(!isChron&&S.skillSections.length){
    const secId=sk.sectionId&&S.skillSections.some(s=>s.id===sk.sectionId)?sk.sectionId:'';
    const sibs=S.skills.filter(s=>(s.sectionId&&S.skillSections.some(sec=>sec.id===s.sectionId)?s.sectionId:'')===secId);
    const si=sibs.findIndex(s=>s.id===sk.id), tSib=sibs[si+d];
    if(!tSib) return false;
    const i1=S.skills.indexOf(sk), i2=S.skills.indexOf(tSib);
    S.skills[i1]=tSib; S.skills[i2]=sk;
    hooks.renderMain?.(); save(); return true;
  }
  const i=S.skills.findIndex(s=>s.id===skId), ni=i+d;
  if(i<0||ni<0||ni>=S.skills.length) return false;
  const [it]=S.skills.splice(i,1); S.skills.splice(ni,0,it);
  hooks.renderMain?.(); save(); return true;
}
export function moveSkSecOrder(secId,dir){
  const sec=S.skillSections.find(s=>s.id===secId); if(!sec) return false;
  const pId=sec.parentSectionId||'', sibs=S.skillSections.filter(s=>(s.parentSectionId||'')===pId);
  const si=sibs.findIndex(s=>s.id===sec.id), tSib=sibs[si+Number(dir)];
  if(!tSib) return false;
  const i1=S.skillSections.indexOf(sec), i2=S.skillSections.indexOf(tSib);
  S.skillSections[i1]=tSib; S.skillSections[i2]=sec;
  hooks.renderMain?.(); save(); return true;
}
export function openSkSecPicker(anchorEl,skId){
  const sk=S.skills.find(x=>x.id===skId); if(!sk) return;
  const items=[
    {icon:'📁',label:'Ohne Sektion',active:!sk.sectionId,onClick:()=>{sk.sectionId='';hooks.renderMain?.();save();}},
    ...S.skillSections.map(s=>({
      icon:'📁',
      label:s.name||'Sektion',
      active:sk.sectionId===s.id,
      onClick:()=>{sk.sectionId=s.id;s.collapsed=false;hooks.renderMain?.();save();}
    }))
  ];
  openCtxMenu({key:`sk-sec-picker:${skId}`,title:'Sektion zuordnen',anchorEl,align:'right',minWidth:220,items});
}
export function openSkMenu(anchorEl,skId,isChron=false,forceOpen=false){
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
          hooks.renderAll?.();
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
export function openSkSecParentPicker(anchorEl,secId){
  const sec=S.skillSections.find(s=>s.id===secId); if(!sec) return;
  const validParents=S.skillSections.filter(s=>canSetSecParent(S.skillSections,secId,s.id));
  const items=[
    {icon:'📁',label:'Hauptebene',active:!sec.parentSectionId,onClick:()=>{sec.parentSectionId='';sanitizeSecHierarchy(S.skillSections);hooks.renderMain?.();save();}},
    ...validParents.map(s=>({
      icon:'↳',label:`in: ${s.name||'Sektion'}`,active:sec.parentSectionId===s.id,
      onClick:()=>{
        if(canSetSecParent(S.skillSections,secId,s.id)){
          sec.parentSectionId=s.id; s.collapsed=false; sanitizeSecHierarchy(S.skillSections); hooks.renderMain?.(); save();
        }
      }
    }))
  ];
  openCtxMenu({key:`sksec-parent-picker:${secId}`,title:'Übergeordnete Sektion',anchorEl,align:'right',minWidth:230,items});
}
export function openSkSecFilterPicker(anchorEl,secId){
  const sec=S.skillSections.find(s=>s.id===secId); if(!sec) return;
  const setF=val=>{sec.filterAttr=val;UI.confirmSkSecPullId=null;hooks.renderMain?.();save();};
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
export function openSkSecMenu(anchorEl,secId,forceOpen=false){
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

export function renderSkillRows(isChron, listOverride=null){
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

export const skSortIcon=col=>UI.skSort?.col===col?(UI.skSort.asc?' ▲':' ▼'):' ⇅';
export const skSortBtn=(col,lbl,align='text-left',tip='')=>`<button type="button" data-action="sort-sk-col" data-col="${col}" ${tip?`data-tip="${tip}"`:''} class="hover:text-acc font-extrabold inline-flex items-center gap-0.5 ${align} ${UI.skSort?.col===col?'text-acc':''}">${lbl}<span class="text-[10px] opacity-75">${skSortIcon(col)}</span></button>`;
export const skMobileSortBar=cols=>`<div class="flex md:hidden flex-wrap items-center gap-1.5 text-xs mb-2"><span class="t-mut font-bold shrink-0">Sortieren:</span>${cols.map(([c,l])=>`<button type="button" data-action="sort-sk-col" data-col="${c}" class="btn py-1 px-2 text-[11px] ${UI.skSort?.col===c?'btn-pri':''}">${l}<span class="text-[10px] opacity-80">${skSortIcon(c)}</span></button>`).join('')}</div>`;

export function buildSkMobRankBtnMeta(sk){
  const rkObj=SK_RANKS[sk.rank]||SK_RANKS[0], autoB=getSkAutoBonus(sk.rank), hasOvr=hasSkBonusOvr(sk), effB=getSkBonus(sk);
  const cls=hasOvr?'!border-amber-400 bg-amber-500/15 text-amber-300':(sk.rank===4?'border-amber-400/60 bg-amber-500/10 text-amber-300':(sk.rank>0?'bdr-acc bg-acc-soft/35 text-acc':'t-mut'));
  const html=`<span class="truncate">${esc(rkObj.n)} (${fmtSign(effB)}${hasOvr?' ✎':''})</span><span class="text-[10px] opacity-80 shrink-0">▾</span>`;
  const tip=hasOvr?`${rkObj.n} • Manueller Bonus ${fmtSign(effB)} (Grad-Standard: +${autoB})`:`${rkObj.n} (+${autoB}) – Tippen zum Grad-Wechsel`;
  return {cls,html,tip};
}
export function buildSkMobCostPillMeta(sk){
  const c=calcSkCost(sk), catShort=SK_CAT_SHORT[sk.category]||(SK_CATS[sk.category]?.l||'Fund.');
  const isGift=Boolean(c.manual&&c.sp===0&&c.msp===0);
  const costTxt=isGift?'🎁 0 SP':`${c.sp} SP${c.msp?` + ${c.msp}M`:''}`;
  const cls=isGift?'border-emerald-500/45 bg-emerald-500/15 text-emerald-300':(c.manual?'border-amber-400/60 bg-amber-500/15 text-amber-300':'bdr-line bg-black/20 t-mut');
  return {text:`${catShort} • ${costTxt}`,cls};
}
export function openSkRankMenu(anchorEl,skId){
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
        hooks.renderAll?.();
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
export function renderSkMobileList(skList){
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
        <button type="button" id="skMobRollBtn_${sk.id}" data-action="roll-skill" data-id="${sk.id}" data-tip="${esc(bm.tip)}" aria-label="Probe auf ${esc(dispName)} würfeln (${bm.pool})" class="btn bg-acc-soft/50 hover:bg-acc-soft bdr-acc py-1 px-2 text-xs font-black text-acc tabular shrink-0 min-h-[32px]"><span>🎲 ${bm.pool}</span>${bm.wpBadge||''}${bm.skBadge}</button>
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

export function renderSkTable(skList){
  if(isMobileLayout()) return renderSkMobileList(skList);
  return `${skMobileSortBar([['name','Name'],['attr','Attribut'],['cat','Kategorie'],['bonus','Bonus'],['sp','SP']])}<div class="overflow-x-auto max-w-full min-w-0"><table class="tbl r-tbl md:min-w-[900px] text-sm"><thead><tr><th class="text-left">${skSortBtn('name','🎲 Probe &amp; Fertigkeit','text-left','Alphabetisch sortieren (auf-/absteigend)')}</th><th class="text-left">${skSortBtn('attr','Attribut','text-left','Nach Attribut &amp; höchstem Wert sortieren')}</th><th class="text-left">${skSortBtn('cat','Kategorie','text-left','Nach Kategorie sortieren')}</th><th class="text-center">Nov. +10</th><th class="text-center">Ges. +15</th><th class="text-center">Exp. +20</th><th class="text-center">Mei. +30</th><th class="text-center">${skSortBtn('bonus','Bonus (Overwrite)','text-center','Nach aktivem Fertigkeitsbonus sortieren (direkt eintippbar für eigene Boni)')}</th><th class="text-center">${skSortBtn('sp','Kosten (SP)','text-center','Nach SP-Kosten sortieren')}</th><th class="text-left">Notizen</th><th class="w-10"></th></tr></thead><tbody>${renderSkillRows(false,skList)}</tbody></table></div>`;
}

export function renderSkSection(sec,sIdx,sibLen=1,depth=0){
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

export function tplSkills(){
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

export function upsertSkill(name,linkedAttr,cat,rank,src,bonusOvr='',secId=''){
  const clean=String(name||'').trim(); if(!clean){toast('Bitte Fertigkeitsnamen eingeben.');return;}
  const r=Math.max(0,Math.min(4,toInt(rank,1))), c=SK_CATS[cat]?cat:'fundamental', ak=ATTRS.some(a=>a.k===linkedAttr)?linkedAttr:'PR', auto=calcAutoSkCost(c,r);
  const bOvr=String(bonusOvr??'').trim()!==''?String(toInt(bonusOvr,0)):'';
  const sId=secId&&S.skillSections.some(s=>s.id===secId)?secId:'';
  const ex=S.skills.find(s=>s.name.trim().toLowerCase()===clean.toLowerCase());
  if(ex){ex.name=clean;ex.category=c;ex.rank=r;if(linkedAttr)ex.linkedAttr=ak;if(bOvr!=='')ex.bonusOvr=bOvr;if(sId)ex.sectionId=sId;if(!ex.manualCost){ex.customSp=auto.sp;ex.customMsp=auto.msp;}logChron(`Fertigkeit aktualisiert (${src}): "${clean}" → ${SK_RANKS[r].n} (${ex.linkedAttr}).`);}
  else{S.skills.push({id:uid(),name:clean,color:'',bgColor:'',linkedAttr:ak,category:c,rank:r,bonusOvr:bOvr,sectionId:sId,manualCost:false,customSp:auto.sp,customMsp:auto.msp,notes:''});logChron(`Fertigkeit erworben (${src}): "${clean}" [${ak}] (${SK_RANKS[r].n}).`);}
  syncDiceFromSheet(); hooks.renderAll?.(); toast(`"${clean}" gespeichert`);
}

