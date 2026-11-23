import {
  ATTRS, TR_DEFS, SK_RANKS, PW_TIERS, PW_TIER_BADGE_CLS, DEF_CHR_SEC_ORDER
} from '../constants.js';
import {
  findVisibleBtn, $, esc, toInt, fmtSign, cardColorStyle
} from '../utils.js';
import {
  hooks
} from '../ui-hooks.js';
import {
  openCtxMenu, toast, logChron, save, S, UI
} from '../state.js';
import {
  getTrCost, calcPwCost, calcProg, getAttrCol, getTrBonus
} from '../calc.js';
import {
  renderTrPairs
} from './attributes.js';
import {
  renderSkillRows, skAttrOpts, skCatOpts, skSortBtn, skMobileSortBar
} from './skills.js';
import {
  renderPwCostSelect
} from './powers.js';

export function buildPwCatPillsHtml(){
  const st={marginal:{c:0,sp:0,m:0},fundamental:{c:0,sp:0,m:0},exzeptionell:{c:0,sp:0,m:0},grandios:{c:0,sp:0,m:0}};
  [...S.powers,...S.augments].filter(it=>it.tier!=='basisaktion').forEach(it=>{const k=PW_TIERS[it.tier]?it.tier:'marginal',c=calcPwCost(it);if(!st[k])st[k]={c:0,sp:0,m:0};st[k].c++;st[k].sp+=c.sp;st[k].m+=c.msp;});
  return Object.entries(PW_TIERS).filter(([k])=>k!=='basisaktion').map(([k,t])=>`<span class="rounded-lg border py-1 px-2.5 text-[11px] font-bold inline-flex items-center gap-1.5 tabular ${PW_TIER_BADGE_CLS[k]||''}"><strong>${esc(t.l)}:</strong> ${st[k].c}× (${st[k].sp} SP${st[k].m?` + ${st[k].m} MsP`:''})</span>`).join('');
}

export function moveChrSecOrder(secKey,dir){
  if(!Array.isArray(S.chrSecOrder)||S.chrSecOrder.length!==3) S.chrSecOrder=[...DEF_CHR_SEC_ORDER];
  const i=S.chrSecOrder.indexOf(secKey), ni=i+Number(dir);
  if(i<0||ni<0||ni>=S.chrSecOrder.length) return false;
  const [it]=S.chrSecOrder.splice(i,1); S.chrSecOrder.splice(ni,0,it);
  hooks.renderMain?.(); save(); return true;
}
export function moveChrPwOrder(kind,id,dir){
  const arr=kind==='augment'?S.augments:S.powers;
  const vis=arr.filter(x=>x&&x.tier!=='basisaktion');
  const vi=vis.findIndex(x=>x.id===id), tSib=vis[vi+Number(dir)];
  if(vi<0||!tSib) return false;
  const i1=arr.indexOf(vis[vi]), i2=arr.indexOf(tSib);
  if(i1<0||i2<0) return false;
  arr[i1]=tSib; arr[i2]=vis[vi];
  hooks.renderMain?.(); save(); return true;
}
export function openChrSecMenu(anchorEl,secKey,forceOpen=false){
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
export function openChrPwMenu(anchorEl,kind,id,forceOpen=false){
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

export function renderChrSection(secKey,secIdx,totalSecs,P,activeTrRows,trainedAttrCnt,allPw){
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

export function tplChronicle(){
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

export function applyEp(val,lbl){
  const ep=Math.max(0,toInt(val,0));
  if(ep>=100){const g=Math.floor(ep/100),rem=ep%100,old=S.progression.level;S.progression.level=Math.max(1,old+g);S.progression.ep=rem;logChron(`${lbl}: Stufenaufstieg ${old} → ${S.progression.level}!`);toast(`Stufe ${S.progression.level} erreicht!`);}
  else{S.progression.ep=ep;logChron(`${lbl} (EP: ${ep}/100).`);}
}

