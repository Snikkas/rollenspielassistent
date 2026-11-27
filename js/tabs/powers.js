import {
  ATTRS, STATUS_DEFS, DEF_MAIN_ARTS, DEF_ACTION_SUBS, DEF_PW_TAGS, PW_TIERS, PW_TIER_BADGE_CLS, DYN_FACTOR_PRESETS, DYN_ROUND_OPTS, DYN_TARGET_OPTS
} from '../constants.js';
import {
  findVisibleBtn, $, esc, toInt, fmtSign, sortAlpha, stripHtml, toRtfHtml, cardColorStyle, canSetSecParent, sanitizeSecHierarchy
} from '../utils.js';
import {
  hooks
} from '../ui-hooks.js';
import {
  openCtxMenu, toast, logChron, save, getPwTermTip, isReservedPwTerm, getPwTierKey, getSheetDmgTypeList, normActionRoll, S, D, isMobileLayout, pwQuickKey, UI
} from '../state.js';
import {
  getStatusEffValues, getAvailableUseResources, getActivePwUseCosts, formatPwUseCosts, getReservablePwCosts, getStatGroups, getDynVarGroups, buildDynFormulaSpec, getDynPresetSelectVal, getPwBuilderToken, evalDynamicFormula, extractDynamicFormulas, renderDynamicRtfHtml, parseStatusTokens, getAllParsedEffectChips, calcActiveMods, withPoolSync, linkAugToPower, unlinkAugFromPower, calcPwCost, getGroupMspInfo, calcProg, getPwSecOptionsFlat, getResLabel, getSecCol, getBstBase, getEffBst, findPwItem, getLinkedAugs, getUnlinkedAugs, getValidPwSecId, getUnlinkedAugsInSec, getRootUnlinkedAugs, getPowerActionRollMeta, getAttrTot, getSkBonus
} from '../calc.js';
import {
  syncDiceFromSheet, renderDice
} from '../dice.js';
import {
  renderRtfToolbarHtml
} from '../notes.js';

export function renderPwCostSelect(kind,it){
  const c=calcPwCost(it), gi=getGroupMspInfo(kind,it);
  return `<select data-pw-tier="${kind}:${it.id}" class="inp w-full font-semibold tabular ${gi.overLimit?'!border-rose-500 !text-rose-300':''}">${Object.entries(PW_TIERS).map(([k,t])=>{
    const sel=it.tier===k, warn=k==='grandios'&&gi.otherHasMsp;
    const txt=sel&&it.manualCost?`${t.full} (Manuell: ${c.sp} SP${c.msp?` + ${c.msp} MsP`:''})`:t.full;
    return `<option id="pwOpt_${it.id}_${k}" value="${k}" ${sel?'selected':''} ${warn?'style="background:#4c0519;color:#fda4af;font-weight:800"':''}>${warn?`⚠ ${txt} (1 MsP belegt)`:txt}</option>`;
  }).join('')}</select>`;
}

export function buildTokBarInnerHtml(kind,it){
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

export function buildDynPreviewBarInnerHtml(it,M=calcActiveMods()){
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
export function updatePwDynPreviewDOM(kind,id,M=calcActiveMods()){
  const el=$(`dynPrev_${id}`);
  if(!el) return;
  const it=findPwItem(kind,id);
  const inner=it?buildDynPreviewBarInnerHtml(it,M):'';
  el.innerHTML=inner;
  el.classList.toggle('hidden',!inner);
}
export function refreshTab3DynamicDOM(M=calcActiveMods()){
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

export function updatePwBuilderChipDOM(kind,id,M=null){
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

export function openPwCardSecPicker(anchorEl,kindOrPwId,maybeId){
  const isAug=kindOrPwId==='augment';
  const kind=isAug?'augment':'power';
  const id=maybeId!==undefined?maybeId:kindOrPwId;
  const it=findPwItem(kind,id); if(!it) return;
  if(isAug&&it.parentPowerId) return;
  const curSecId=getValidPwSecId(it.sectionId);
  const flatSecs=getPwSecOptionsFlat();
  const items=[
    {icon:'📁',label:'Keine Sektion / Allgemein',active:!curSecId,onClick:()=>{it.sectionId='';hooks.renderMain?.();save();}},
    ...flatSecs.map(fs=>({
      icon:'📁',
      label:`${'↳ '.repeat(Math.min(3,fs.depth))}${fs.name}`,
      active:curSecId===fs.id,
      onClick:()=>{
        it.sectionId=fs.id;
        const secObj=S.powerSections.find(s=>s.id===fs.id);
        if(secObj) secObj.collapsed=false;
        hooks.renderMain?.();save();
      }
    }))
  ];
  openCtxMenu({key:`pw-sec-picker:${kind}:${id}`,title:'Sektion zuordnen',anchorEl,align:'right',minWidth:235,items});
}
export function openAugParentPicker(anchorEl,augId){
  const ag=S.augments.find(a=>a.id===augId); if(!ag) return;
  const items=[
    {icon:'🔓',label:'Freies Augment (keine Kraft)',active:!ag.parentPowerId,onClick:()=>{unlinkAugFromPower(ag);hooks.renderMain?.();save();}},
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
          linkAugToPower(ag,p.id);hooks.renderMain?.();save();
        }
      };
    })
  ];
  openCtxMenu({key:`aug-parent-picker:${augId}`,title:'Eltern-Kraft zuordnen',anchorEl,align:'right',minWidth:240,items});
}
export function getPwSecSiblings(sec){
  const pId=sec?.parentSectionId&&S.powerSections.some(p=>p.id===sec.parentSectionId)?sec.parentSectionId:'';
  return S.powerSections.filter(s=>(s.parentSectionId&&S.powerSections.some(p=>p.id===s.parentSectionId)?s.parentSectionId:'')===pId);
}
export function movePwSecOrder(secId,dir){
  const sec=S.powerSections.find(s=>s.id===secId); if(!sec) return false;
  const sibs=getPwSecSiblings(sec), si=sibs.findIndex(s=>s.id===sec.id), tSib=sibs[si+Number(dir)];
  if(!tSib) return false;
  const i1=S.powerSections.indexOf(sec), i2=S.powerSections.indexOf(tSib);
  S.powerSections[i1]=tSib; S.powerSections[i2]=sec;
  save(); hooks.renderMain?.(); return true;
}
export function getPwPowerSiblings(p){
  const secId=p?.sectionId&&S.powerSections.some(s=>s.id===p.sectionId)?p.sectionId:'';
  return S.powers.filter(x=>(x.sectionId&&S.powerSections.some(s=>s.id===x.sectionId)?x.sectionId:'')===secId);
}
export function movePwOrder(pwId,dir){
  const p=S.powers.find(x=>x.id===pwId); if(!p) return false;
  const sibs=getPwPowerSiblings(p), si=sibs.findIndex(x=>x.id===p.id), tSib=sibs[si+Number(dir)];
  if(!tSib) return false;
  const i1=S.powers.indexOf(p), i2=S.powers.indexOf(tSib);
  S.powers[i1]=tSib; S.powers[i2]=p;
  save(); hooks.renderMain?.(); return true;
}
export function getPwAugSiblings(ag){
  const hasPar=Boolean(ag?.parentPowerId&&S.powers.some(p=>p.id===ag.parentPowerId));
  if(hasPar) return getLinkedAugs(ag.parentPowerId);
  const secId=getValidPwSecId(ag?.sectionId);
  return secId?getUnlinkedAugsInSec(secId):getRootUnlinkedAugs();
}
export function moveAugOrder(augId,dir){
  const ag=S.augments.find(a=>a.id===augId); if(!ag) return false;
  const sibs=getPwAugSiblings(ag), si=sibs.findIndex(x=>x.id===ag.id), tSib=sibs[si+Number(dir)];
  if(!tSib) return false;
  const i1=S.augments.indexOf(ag), i2=S.augments.indexOf(tSib);
  S.augments[i1]=tSib; S.augments[i2]=ag;
  save(); hooks.renderMain?.(); return true;
}
export function openPwCardMenu(anchorEl,kind,id,forceOpen=false){
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

export function buildPwActionRollTooltip(it,pm){
  if(!pm||!pm.enabled) return 'Im Würfelassistenten einsetzen';
  const lines=[];
  const nm=String(it?.name||'').trim()||'Aktion';
  const testBits=[];
  if(pm.sk) testBits.push(`${pm.sk.name} (${fmtSign(pm.skBonus)})`);
  if(pm.attrKey) testBits.push(`${pm.attrKey} (${pm.attrVal})`);
  lines.push(`🎲 ${nm} im Würfelassistenten einsetzen`);
  lines.push(`• ${pm.rollCat}${testBits.length?`: ${testBits.join(' + ')} = ${pm.pool}`:''}`);
  if(pm.hasSelfMod) lines.push(`• Eigener Test: ${fmtSign(pm.selfModVal)} ${pm.selfModKind==='dis'?(pm.selfModVal===1?'Nachteil':'Nachteile'):(pm.selfModVal===1?'Vorteil':'Vorteile')}`);
  if(pm.dealsEgDmg){
    const dtTxt=pm.replaceDmgType&&pm.dmgType?`Schadenstyp: ${pm.dmgType}`:'EG-Grundschaden';
    const bonTxt=pm.dmgBonusVal?` (${fmtSign(pm.dmgBonusVal)} Zusatz)`:'';
    lines.push(`• Bei Erfolg: EG${bonTxt} • ${dtTxt} (${pm.dmgPool==='mlp'?'mLP':'LP'})`);
  }
  if(pm.hasTargetMod) lines.push(`• Ziel gegen Test: ${fmtSign(pm.targetModVal)} ${pm.targetModKind==='dis'?(pm.targetModVal===1?'Nachteil':'Nachteile'):(pm.targetModVal===1?'Vorteil':'Vorteile')}`);
  if(pm.useWeapon) lines.push('• Kombiniert mit ausgerüsteter Waffe');
  return lines.join('\n');
}

export function renderPwActionRollEditor(kind,it,opts={}){
  const M=opts.M||calcActiveMods();
  const pm=getPowerActionRollMeta(it,M,S);
  const ar=pm.ar;
  if(!ar.enabled){
    return `<div class="subcard py-1.5 px-2.5 flex flex-wrap items-center justify-between gap-2 text-xs">
      <div class="flex flex-wrap items-center gap-1.5 min-w-0">
        <span class="font-extrabold t-mut">🎲 Würfel-Aktion</span>
        <span class="text-[11px] t-mut hidden sm:inline">• Optionaler Aktions-Baukasten für Würfelassistent &amp; Schadensverrechnung</span>
      </div>
      <button type="button" data-action="toggle-pw-ar" data-kind="${kind}" data-id="${it.id}" data-tip="Aktiviert den Würfel-Aktions-Baukasten für diese Karte, damit sie direkt im Würfelassistenten eingesetzt werden kann" class="btn py-1 px-2.5 text-xs font-extrabold bdr-acc bg-acc-soft text-acc shrink-0">+ 🎲 Würfel-Aktion aktivieren</button>
    </div>`;
  }
  const sortedSkills=Array.isArray(opts.sortedSkills)?opts.sortedSkills:[...(S.skills||[])].filter(s=>s&&String(s.name||'').trim()).sort((a,b)=>String(a.name).trim().localeCompare(String(b.name).trim(),'de'));
  const dmgTypes=getSheetDmgTypeList(S);
  const curDmgType=String(ar.dmgType||dmgTypes[0]||'Feuer').trim();
  const hasCurDt=dmgTypes.some(t=>t.toLowerCase()===curDmgType.toLowerCase());
  const allDmgTypes=hasCurDt?dmgTypes:[...dmgTypes,curDmgType];
  const rollCats=[
    {v:'Normaler Test',l:'📋 Normaler Test'},
    {v:'Trefferwurf',l:'⚔️ Trefferwurf'},
    {v:'Parieren',l:'🛡️ Parieren'},
    {v:'Blocken',l:'🧱 Blocken'},
    {v:'Ausweichen',l:'💨 Ausweichen'}
  ];
  const poolParts=[];
  if(pm.sk) poolParts.push(`${pm.sk.name} (${fmtSign(pm.skBonus)})`);
  if(pm.attrKey) poolParts.push(`${pm.attrKey} ${pm.attrVal}`);
  const poolBadgeHtml=poolParts.length
    ?`<span class="px-2 py-0.5 rounded-md border bdr-acc bg-acc-soft text-acc text-[11px] font-black tabular">${esc(poolParts.join(' + '))} = ${pm.pool}</span>`
    :`<span class="text-[11px] text-amber-600 dark:text-amber-300 font-bold">Attribut oder Fertigkeit wählen</span>`;
  const autoAttrLbl=pm.sk&&pm.sk.linkedAttr?`Auto (${pm.sk.linkedAttr} ${getAttrTot(pm.sk.linkedAttr,M)})`:'— Keins / Auto —';

  const activeBlocks=[];
  if(ar.hasSelfMod){
    const isDis=ar.selfModKind==='dis';
    activeBlocks.push(`<div class="p-2 rounded-lg border flex flex-wrap items-center justify-between gap-2 text-xs ${isDis?'border-rose-500/45 bg-rose-500/10':'border-emerald-500/45 bg-emerald-500/10'}">
      <div class="flex flex-wrap items-center gap-1.5 min-w-0">
        <span class="font-extrabold ${isDis?'text-rose-700 dark:text-rose-300':'text-emerald-700 dark:text-emerald-300'}">⚡ Test-Mod:</span>
        <div class="inline-flex items-center gap-1 tabular">
          <button type="button" data-action="pw-ar-step" data-kind="${kind}" data-id="${it.id}" data-field="selfModVal" data-d="-1" ${ar.selfModVal<=1?'disabled':''} aria-label="Weniger" class="btn w-6 h-6 p-0 text-xs font-black">−</button>
          <span class="min-w-[1.4rem] text-center font-black">${ar.selfModVal}</span>
          <button type="button" data-action="pw-ar-step" data-kind="${kind}" data-id="${it.id}" data-field="selfModVal" data-d="1" ${ar.selfModVal>=10?'disabled':''} aria-label="Mehr" class="btn w-6 h-6 p-0 text-xs font-black">+</button>
        </div>
        <select data-pw-ar-sel="${kind}:${it.id}:selfModKind" class="inp py-0.5 px-2 text-xs font-bold">
          <option value="adv" ${!isDis?'selected':''}>Vorteil(e) auf Test</option>
          <option value="dis" ${isDis?'selected':''}>Nachteil(e) auf Test</option>
        </select>
      </div>
      <button type="button" data-action="pw-ar-rm-block" data-kind="${kind}" data-id="${it.id}" data-block="selfMod" data-tip="Baustein entfernen" class="btn py-0.5 px-1.5 text-[11px] hover:text-rose-400 shrink-0">✕</button>
    </div>`);
  }
  if(ar.dealsEgDmg){
    const isMlp=ar.dmgPool==='mlp';
    const bonEval=pm.dmgBonusEval;
    const bonLiveHint=bonEval.isFormula
      ?(bonEval.ok?`<span class="text-[10px] font-black text-acc tabular" data-tip="${esc(bonEval.breakdown)}">= ${fmtSign(bonEval.val)}</span>`:`<span class="text-[10px] font-bold text-rose-400" data-tip="${esc(bonEval.breakdown)}">⚠ Formel</span>`)
      :'';
    const repRowHtml=ar.replaceDmgType
      ?`<div class="pt-1.5 mt-1.5 border-t border-white/10 flex flex-wrap items-center gap-1.5">
        <span class="font-extrabold text-amber-700 dark:text-amber-300 shrink-0">🔥 Schadenstyp:</span>
        <select data-pw-ar-sel="${kind}:${it.id}:dmgType" class="inp py-0.5 px-2 text-xs font-bold min-w-[125px]">
          ${allDmgTypes.map(dt=>`<option value="${esc(dt)}" ${dt.toLowerCase()===curDmgType.toLowerCase()?'selected':''}>${esc(dt)}</option>`).join('')}
        </select>
        <div class="flex items-center gap-1 flex-1 min-w-[145px] max-w-xs">
          <input data-pw-ar-newdt="${kind}:${it.id}" type="text" placeholder="Neuer Typ…" class="inp py-0.5 px-2 text-xs flex-1 min-w-0"/>
          <button type="button" data-action="pw-ar-add-dmgtype" data-kind="${kind}" data-id="${it.id}" data-tip="Schadenstyp zur Standardliste hinzufügen &amp; auswählen" class="btn btn-ok py-0.5 px-2 text-xs shrink-0">+</button>
          <button type="button" data-action="open-list" data-ltype="dmgTypes" data-tip="Standardliste der Schadenstypen verwalten" class="btn py-0.5 px-1.5 text-xs shrink-0">⚙️</button>
        </div>
        <button type="button" data-action="pw-ar-rm-block" data-kind="${kind}" data-id="${it.id}" data-block="replaceDmgType" data-tip="Schadenstyp-Ersetzung entfernen (Standard-Grundschaden)" class="btn py-0.5 px-1.5 text-[11px] hover:text-rose-400 shrink-0 ml-auto">✕</button>
      </div>`
      :'';
    activeBlocks.push(`<div class="p-2 rounded-lg border border-amber-500/45 bg-amber-500/10 text-xs">
      <div class="flex flex-wrap items-center justify-between gap-2">
        <div class="flex flex-wrap items-center gap-2 min-w-0">
          <span class="font-extrabold text-amber-700 dark:text-amber-300">💥 EG-Grundschaden bei Erfolg</span>
          <div class="inline-flex rounded-lg p-0.5 bg-black/25 border bdr-line text-[10px] shrink-0" role="group" aria-label="Schadens-Pool">
            <button type="button" data-action="pw-ar-set-pool" data-kind="${kind}" data-id="${it.id}" data-pool="lp" class="px-2 py-0.5 rounded font-black ${!isMlp?'bg-rose-500/25 text-rose-700 dark:text-rose-200':'t-mut'}">❤️ LP</button>
            <button type="button" data-action="pw-ar-set-pool" data-kind="${kind}" data-id="${it.id}" data-pool="mlp" class="px-2 py-0.5 rounded font-black ${isMlp?'bg-indigo-500/25 text-indigo-700 dark:text-indigo-200':'t-mut'}">🧠 mLP</button>
          </div>
          <label class="inline-flex items-center gap-1 min-w-0" data-tip="Optionaler Zusatzschaden auf den EG-Grundschaden – Zahl (z. B. +2) oder dynamische Formel (z. B. {{WA/2}})">
            <span class="t-mut font-bold">Zusatz:</span>
            <input data-pw-ar-inp="${kind}:${it.id}:dmgBonus" type="text" value="${esc(ar.dmgBonus||'0')}" placeholder="0" class="inp py-0.5 px-1.5 w-20 text-center font-black tabular text-xs"/>
            ${bonLiveHint}
          </label>
        </div>
        <button type="button" data-action="pw-ar-rm-block" data-kind="${kind}" data-id="${it.id}" data-block="egDmg" data-tip="Schadens-Baustein entfernen" class="btn py-0.5 px-1.5 text-[11px] hover:text-rose-400 shrink-0">✕</button>
      </div>
      ${repRowHtml}
    </div>`);
  }
  if(ar.hasTargetMod){
    const tIsDis=ar.targetModKind==='dis';
    const effHint=tIsDis?`→ +${ar.targetModVal}V für dich`:`→ +${ar.targetModVal}N für dich`;
    activeBlocks.push(`<div class="p-2 rounded-lg border border-indigo-400/50 bg-indigo-500/10 flex flex-wrap items-center justify-between gap-2 text-xs">
      <div class="flex flex-wrap items-center gap-1.5 min-w-0">
        <span class="font-extrabold text-indigo-700 dark:text-indigo-300">🎯 Ziel gegen Test:</span>
        <div class="inline-flex items-center gap-1 tabular">
          <button type="button" data-action="pw-ar-step" data-kind="${kind}" data-id="${it.id}" data-field="targetModVal" data-d="-1" ${ar.targetModVal<=1?'disabled':''} aria-label="Weniger" class="btn w-6 h-6 p-0 text-xs font-black">−</button>
          <span class="min-w-[1.4rem] text-center font-black">${ar.targetModVal}</span>
          <button type="button" data-action="pw-ar-step" data-kind="${kind}" data-id="${it.id}" data-field="targetModVal" data-d="1" ${ar.targetModVal>=10?'disabled':''} aria-label="Mehr" class="btn w-6 h-6 p-0 text-xs font-black">+</button>
        </div>
        <select data-pw-ar-sel="${kind}:${it.id}:targetModKind" class="inp py-0.5 px-2 text-xs font-bold">
          <option value="dis" ${tIsDis?'selected':''}>Nachteil(e) fürs Ziel</option>
          <option value="adv" ${!tIsDis?'selected':''}>Vorteil(e) fürs Ziel</option>
        </select>
        <span class="text-[11px] font-bold t-mut tabular">(${effHint})</span>
      </div>
      <button type="button" data-action="pw-ar-rm-block" data-kind="${kind}" data-id="${it.id}" data-block="targetMod" data-tip="Ziel-Modifikator entfernen" class="btn py-0.5 px-1.5 text-[11px] hover:text-rose-400 shrink-0">✕</button>
    </div>`);
  }
  if(ar.useWeapon){
    activeBlocks.push(`<div class="p-2 rounded-lg border border-cyan-400/45 bg-cyan-500/10 flex flex-wrap items-center justify-between gap-2 text-xs">
      <span class="font-bold text-cyan-700 dark:text-cyan-200">⚔️ <strong>Mit Waffe kombinieren:</strong> Nutzt ausgerüstete Waffe, Waffenschaden &amp; Waffen-Tags zusätzlich im Würfelassistenten.</span>
      <button type="button" data-action="pw-ar-rm-block" data-kind="${kind}" data-id="${it.id}" data-block="useWeapon" data-tip="Waffen-Kombination entfernen" class="btn py-0.5 px-1.5 text-[11px] hover:text-rose-400 shrink-0">✕</button>
    </div>`);
  }

  const addChips=[];
  if(!ar.hasSelfMod) addChips.push(`<button type="button" data-action="pw-ar-add-block" data-kind="${kind}" data-id="${it.id}" data-block="selfMod" data-tip="Fügt Vorteile oder Nachteile für diesen Aktions-Test hinzu" class="btn py-0.5 px-2 text-[11px] border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">+ ± Test V/N</button>`);
  if(!ar.dealsEgDmg) addChips.push(`<button type="button" data-action="pw-ar-add-block" data-kind="${kind}" data-id="${it.id}" data-block="egDmg" data-tip="Verursacht bei Würfelerfolg EG-Grundschaden und aktiviert den Schadensrechner" class="btn py-0.5 px-2 text-[11px] border-amber-500/45 bg-amber-500/10 text-amber-700 dark:text-amber-300">+ 💥 EG-Grundschaden</button>`);
  if(!ar.replaceDmgType) addChips.push(`<button type="button" data-action="pw-ar-add-block" data-kind="${kind}" data-id="${it.id}" data-block="replaceDmgType" data-tip="Ersetzt den Grundschaden durch einen Schadenstyp (z. B. Feuer, Blitz, Schnitt, Säure, Explosion oder eigene)" class="btn py-0.5 px-2 text-[11px] border-orange-500/45 bg-orange-500/10 text-orange-700 dark:text-orange-300">+ 🔥 Schadenstyp ersetzen</button>`);
  if(!ar.hasTargetMod) addChips.push(`<button type="button" data-action="pw-ar-add-block" data-kind="${kind}" data-id="${it.id}" data-block="targetMod" data-tip="Gewähltes Ziel erhält Vor- oder Nachteile gegen diesen Test" class="btn py-0.5 px-2 text-[11px] border-indigo-400/45 bg-indigo-500/10 text-indigo-700 dark:text-indigo-300">+ 🎯 Ziel V/N</button>`);
  if(!ar.useWeapon) addChips.push(`<button type="button" data-action="pw-ar-add-block" data-kind="${kind}" data-id="${it.id}" data-block="useWeapon" data-tip="Kombiniert diese Aktion mit einer ausgerüsteten Waffe (inkl. Waffenschaden &amp; Waffen-Tags)" class="btn py-0.5 px-2 text-[11px] border-cyan-400/45 bg-cyan-500/10 text-cyan-700 dark:text-cyan-300">+ ⚔️ Mit Waffe</button>`);

  return `<div class="subcard p-2.5 border bdr-acc bg-acc-soft/10 space-y-2.5 text-xs min-w-0">
    <div class="flex flex-wrap items-center justify-between gap-2 border-b bdr-line pb-1.5">
      <div class="flex flex-wrap items-center gap-2 min-w-0">
        <span class="font-extrabold text-acc">🎲 Würfel-Aktion</span>
        ${poolBadgeHtml}
      </div>
      <div class="flex items-center gap-1.5 shrink-0">
        <button type="button" data-action="roll-power" data-kind="${kind}" data-id="${it.id}" data-tip="${esc(buildPwActionRollTooltip(it,pm))}" class="btn btn-pri py-0.5 px-2.5 text-[11px] font-black">🎲 Testen</button>
        <button type="button" data-action="toggle-pw-ar" data-kind="${kind}" data-id="${it.id}" data-tip="Würfel-Aktion für diese Karte deaktivieren" class="btn btn-err py-0.5 px-2 text-[11px]">✕ Aus</button>
      </div>
    </div>
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
      <div class="min-w-0">
        <label class="block text-[10px] font-bold t-mut uppercase mb-0.5">Testart</label>
        <select data-pw-ar-sel="${kind}:${it.id}:rollCat" class="inp w-full py-1 px-2 text-xs font-bold">
          ${rollCats.map(rc=>`<option value="${rc.v}" ${ar.rollCat===rc.v?'selected':''}>${rc.l}</option>`).join('')}
        </select>
      </div>
      <div class="min-w-0">
        <label class="block text-[10px] font-bold t-mut uppercase mb-0.5">Fertigkeit (Tab 2)</label>
        <select data-pw-ar-sel="${kind}:${it.id}:skillId" class="inp w-full py-1 px-2 text-xs font-bold">
          <option value="" ${!pm.sk?'selected':''}>— Keine Fertigkeit (+0) —</option>
          ${sortedSkills.map(sk=>`<option value="${esc(sk.id)}" ${pm.sk?.id===sk.id?'selected':''}>${esc(String(sk.name).trim())} (${fmtSign(getSkBonus(sk))} • ${sk.linkedAttr})</option>`).join('')}
          ${pm.missingSkillName?`<option value="__missing__" disabled selected>⚠ ${esc(pm.missingSkillName)} (nicht in Tab 2)</option>`:''}
        </select>
      </div>
      <div class="min-w-0">
        <label class="block text-[10px] font-bold t-mut uppercase mb-0.5">Attribut</label>
        <select data-pw-ar-sel="${kind}:${it.id}:attrKey" class="inp w-full py-1 px-2 text-xs font-bold">
          <option value="" ${!ar.attrKey?'selected':''}>${esc(autoAttrLbl)}</option>
          ${ATTRS.map(a=>`<option value="${a.k}" ${ar.attrKey===a.k?'selected':''}>${a.k} – ${a.n} (${getAttrTot(a.k,M)})</option>`).join('')}
        </select>
      </div>
    </div>
    ${activeBlocks.length?`<div class="space-y-1.5">${activeBlocks.join('')}</div>`:''}
    ${addChips.length?`<div class="flex flex-wrap items-center gap-1.5 pt-1 border-t border-white/10"><span class="text-[10px] font-extrabold t-mut uppercase mr-0.5">+ Baustein:</span>${addChips.join('')}</div>`:''}
  </div>`;
}

export function renderPwActionRollViewStrip(kind,it,pm){
  if(!pm||!pm.enabled) return '';
  const rollIcon=pm.rollCat==='Trefferwurf'?'⚔️':pm.rollCat==='Parieren'?'🛡️':pm.rollCat==='Blocken'?'🧱':pm.rollCat==='Ausweichen'?'💨':'🎲';
  const testBits=[];
  if(pm.sk) testBits.push(pm.sk.name);
  if(pm.attrKey) testBits.push(pm.attrKey);
  const testTxt=testBits.length?testBits.join(' + '):pm.rollCat;
  const chips=[];
  if(pm.hasSelfMod){
    const isDis=pm.selfModKind==='dis';
    chips.push(`<span class="inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-black tabular border ${isDis?'border-rose-500/45 bg-rose-500/15 text-rose-700 dark:text-rose-300':'border-emerald-500/45 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'}">${fmtSign(pm.selfModVal)}${isDis?'N':'V'}</span>`);
  }
  if(pm.dealsEgDmg){
    const bonTxt=pm.dmgBonusVal?` ${fmtSign(pm.dmgBonusVal)}`:'';
    const dtTxt=pm.replaceDmgType&&pm.dmgType?` → ${pm.dmgType}`:'';
    const poolTxt=pm.dmgPool==='mlp'?' (mLP)':'';
    chips.push(`<span class="inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-black tabular border border-amber-500/50 bg-amber-500/15 text-amber-700 dark:text-amber-300">💥 EG${esc(bonTxt)}${esc(dtTxt)}${poolTxt}</span>`);
  }
  if(pm.hasTargetMod){
    const tIsDis=pm.targetModKind==='dis';
    chips.push(`<span class="inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-black tabular border border-indigo-400/50 bg-indigo-500/15 text-indigo-700 dark:text-indigo-200">🎯 Ziel ${fmtSign(pm.targetModVal)}${tIsDis?'N':'V'}</span>`);
  }
  if(pm.useWeapon){
    chips.push(`<span class="inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-black border border-cyan-400/50 bg-cyan-500/15 text-cyan-700 dark:text-cyan-200">⚔️ +Waffe</span>`);
  }
  return `<div class="flex flex-wrap items-center gap-1.5 pt-1 border-t border-white/10">
    <button type="button" data-action="roll-power" data-kind="${kind}" data-id="${it.id}" data-tip="${esc(buildPwActionRollTooltip(it,pm))}" class="inline-flex items-center gap-1.5 rounded-lg px-2 py-0.5 text-[11px] font-extrabold border bdr-acc bg-acc-soft text-acc hover:brightness-110 transition-all cursor-pointer tabular">
      <span>${rollIcon}</span>
      <span>${esc(testTxt)}</span>
      ${testBits.length?`<strong class="px-1 rounded bg-black/20">${pm.pool}</strong>`:''}
    </button>
    ${chips.join('')}
  </div>`;
}

export function renderPwCard(kind,it,idx,listLen,opts={}){
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
  const cardM=opts.M||calcActiveMods();
  const pwRollMeta=it.actionRoll?.enabled?getPowerActionRollMeta(it,cardM,S):null;
  const rollBtnHtml=pwRollMeta?`<button type="button" data-action="roll-power" data-kind="${kind}" data-id="${it.id}" data-tip="${esc(buildPwActionRollTooltip(it,pwRollMeta))}" class="btn btn-pri py-1 sm:py-0.5 px-2 text-[11px] font-black tabular shrink-0">🎲${pwRollMeta.pool?` ${pwRollMeta.pool}`:''}</button>`:'';
  const reservableCosts=getReservablePwCosts(it), isReserved=Boolean(it.reserved), activeResCosts=(isReserved&&Array.isArray(it.reservedCosts)&&it.reservedCosts.length)?it.reservedCosts:reservableCosts, resTxt=activeResCosts.map(rc=>`${rc.amt} ${getResLabel(rc.res)}`).join(' + ');
  const resChipHtml=isReserved?`<button type="button" data-action="toggle-reserve-pw" data-kind="${kind}" data-id="${it.id}" data-tip="Reservierung aufheben (verbrauchte Kosten werden nicht wiederhergestellt)" class="btn py-1 sm:py-0.5 px-2 text-[11px] bg-amber-500/25 border-amber-400 text-amber-300 font-black tabular shrink-0">🔒 ${esc(resTxt)} ✕</button>`:(it.collapsed&&reservableCosts.length>0?`<button type="button" data-action="toggle-reserve-pw" data-kind="${kind}" data-id="${it.id}" data-tip="Zieht reservierbare Einsatzkosten sofort ab und sperrt den Betrag vom Maximum (${esc(resTxt)})" class="btn py-1 sm:py-0.5 px-2 text-[11px] shrink-0">🔒</button>`:'');
  const tKey=getPwTierKey(it,isAug), tMeta=PW_TIERS[tKey]||PW_TIERS.marginal, tBadgeCls=PW_TIER_BADGE_CLS[tKey]||PW_TIER_BADGE_CLS.marginal;
  const tierBadgeHtml=`<span class="inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-extrabold border shrink-0 ${tBadgeCls}" data-tip="${esc(tMeta.full)}">${esc(tMeta.l)}</span>`;
  const artBadgeHtml=it.art?`<span class="tag text-[10px] py-0.5 px-1.5 shrink-0 ${curArtTipHdr?'cursor-help':''}" ${curArtTipHdr?`data-tip="${esc(curArtTipHdr)}"`:''}>${esc(it.art)}</span>`:'';
  const costPillHtml=`<span class="pill cursor-default text-[11px] py-0.5 px-2 tabular shrink-0">${c.sp} SP${c.msp?` + ${c.msp} MsP`:''}</span>`;
  const spendBtnHtml=canSpendPw?`<button type="button" data-action="spend-pw" data-kind="${kind}" data-id="${it.id}" data-tip="${hasUseCost?`Einsatzkosten (${esc(costSummary)}) abziehen`:'Effekte / Status aktivieren'}" class="btn ${pwRollMeta?'border-amber-400/60 bg-amber-500/15 text-amber-700 dark:text-amber-300':'btn-pri'} py-1 sm:py-0.5 px-2 text-[11px] shrink-0">⚡ ${hasUseCost?esc(costSummary):'Einsetzen'}</button>`:'';
  const quickDoneBtnHtml=opts.isQuickEdit?`<button type="button" data-action="close-pw-quick-edit" data-kind="${kind}" data-id="${it.id}" data-tip="Einzelbearbeitung beenden und zurück in die kompakte Ansicht klappen" class="btn btn-ok py-1 sm:py-0.5 px-2.5 text-[11px] font-extrabold shrink-0">✓ Fertig</button>`:'';
  const hdrRight=`<div class="flex flex-wrap items-center gap-1.5 shrink-0 max-w-full">
    ${quickDoneBtnHtml}${tierBadgeHtml}${artBadgeHtml}${costPillHtml}${rollBtnHtml}${spendBtnHtml}${resChipHtml}
    ${listLen>1?`<button type="button" data-action="${isAug?'move-aug':'move-pw'}" data-id="${it.id}" data-dir="-1" ${idx===0?'disabled':''} data-tip="Nach oben" class="hidden md:inline-flex btn py-1 px-2 text-xs">▲</button><button type="button" data-action="${isAug?'move-aug':'move-pw'}" data-id="${it.id}" data-dir="1" ${idx===listLen-1?'disabled':''} data-tip="Nach unten" class="hidden md:inline-flex btn py-1 px-2 text-xs">▼</button>`:''}
    <button type="button" data-action="open-pw-card-menu" data-kind="${kind}" data-id="${it.id}" aria-haspopup="menu" aria-expanded="false" aria-label="Aktionen für ${esc(it.name||(isAug?'Augment':'Kraft'))}" data-tip="Farben, Zuordnung, Duplizieren, Export, Kosten &amp; Löschen" class="btn w-9 h-9 sm:w-8 sm:h-8 p-0 text-base font-black shrink-0">⋮</button>
  </div>`;

  if(it.collapsed){
    return `<div ${isAug?`data-aug-card="${it.id}"`:""} class="card py-2 px-3 ${isAug?'border-amber-500/45 max-w-4xl':''}${viaParentPower?' opacity-75 hover:opacity-100 transition-opacity':''}" ${winStyle}><div class="flex flex-wrap items-center justify-between gap-2">${hdrLeft}${hdrRight}</div></div>`;
  }

  const statGroups=Array.isArray(opts.statGroups)?opts.statGroups:getStatGroups();
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
      ${renderPwActionRollEditor(kind,it,{M:cardM,sortedSkills})}
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

export function renderPwViewCard(kind,it,idx,listLen,opts={}){
  const isAug=kind==='augment', colStyle=it.color?`style="color:${esc(it.color)}"`:'', winStyle=cardColorStyle(it);
  const dispName=String(it.name||'').trim();
  const linkedParent=isAug&&it.parentPowerId?S.powers.find(p=>p.id===it.parentPowerId):null;
  const showParentBadge=Boolean(opts.showParentBadge&&linkedParent);
  const viaParentPower=Boolean(opts.viaParentPower&&isAug);
  const augSecObj=(isAug&&!linkedParent&&opts.showSecBadge&&it.sectionId)?S.powerSections.find(s=>s.id===it.sectionId):null;
  const parentBadgeHtml=showParentBadge?`<span data-tip="${esc(`Verknüpft mit Kraft „${linkedParent.name||'Unbenannte Kraft'}“ (Zuordnung bleibt beim Filtern unverändert)`)}" class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md border border-amber-400/60 bg-amber-500/20 text-amber-300 text-[10px] font-extrabold shrink-0 max-w-full sm:max-w-[220px] truncate">↳ ${esc(linkedParent.name||'Unbenannte Kraft')}</span>`:(augSecObj?`<span data-tip="${esc(`Freies Augment in Sektion „${augSecObj.name||'Sektion'}“`)}" class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md border bdr-acc bg-acc-soft text-acc text-[10px] font-extrabold shrink-0 max-w-full sm:max-w-[200px] truncate">📁 ${esc(augSecObj.name||'Sektion')}</span>`:'');
  const viaParentBadgeHtml=viaParentPower?`<span data-tip="Mitangezeigt, weil die übergeordnete Hauptkraft dem Filter entspricht (erfüllt den Filter selbst nicht direkt)" class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md border border-amber-500/35 bg-amber-500/10 text-amber-300/85 text-[10px] font-bold shrink-0">↳ gebunden</span>`:'';
  const M=opts.M||calcActiveMods();
  const pwRollMeta=it.actionRoll?.enabled?getPowerActionRollMeta(it,M,S):null;
  const stToksInCard=parseStatusTokens(it.effects), costSummary=formatPwUseCosts(it), hasUseCost=Boolean(costSummary), canSpendPw=hasUseCost||stToksInCard.length>0;
  const reservableCosts=getReservablePwCosts(it), isReserved=Boolean(it.reserved), activeResCosts=(isReserved&&Array.isArray(it.reservedCosts)&&it.reservedCosts.length)?it.reservedCosts:reservableCosts, resTxt=activeResCosts.map(rc=>`${rc.amt} ${getResLabel(rc.res)}`).join(' + ');
  const rollBtnHtml=pwRollMeta?`<button type="button" data-action="roll-power" data-kind="${kind}" data-id="${it.id}" data-tip="${esc(buildPwActionRollTooltip(it,pwRollMeta))}" aria-label="${esc(dispName||(isAug?'Augment':'Kraft'))} im Würfelassistenten einsetzen" class="btn btn-pri h-7 px-2 text-[11px] font-black shrink-0 tabular">🎲${pwRollMeta.pool?` <span class="hidden sm:inline">${pwRollMeta.pool}</span>`:''}</button>`:'';
  const spendBtnHtml=canSpendPw?`<button type="button" data-action="spend-pw" data-kind="${kind}" data-id="${it.id}" data-tip="${hasUseCost?`Einsatzkosten (${esc(costSummary)}) abziehen`:'Effekte / Status aktivieren'}" aria-label="${hasUseCost?`Einsetzen (${esc(costSummary)})`:'Einsetzen'}" class="btn ${pwRollMeta?'border-amber-400/60 bg-amber-500/15 text-amber-700 dark:text-amber-300':'btn-pri'} h-7 px-2 text-[11px] font-extrabold shrink-0 tabular">⚡${hasUseCost?` <span class="hidden sm:inline">${esc(costSummary)}</span>`:''}</button>`:'';
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
    <div class="flex items-center gap-1 shrink-0 ml-auto">${rollBtnHtml}${spendBtnHtml}${reserveBtnHtml}${editBtnHtml}${menuBtnHtml}</div>
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
  const actionRollViewStrip=pwRollMeta?renderPwActionRollViewStrip(kind,it,pwRollMeta):'';
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
    ${actionRollViewStrip}
    ${hasBody?`<div class="space-y-1.5 pt-1 border-t border-white/10">${descRow}${effectsRow}${rulesRow}</div>`:''}
  </div>`;
}

export function renderPwItem(kind,it,idx,listLen,opts={}){
  const isQuick=UI.pwMode!=='edit'&&UI.pwQuickEditIds instanceof Set&&UI.pwQuickEditIds.has(pwQuickKey(kind,it.id));
  if(UI.pwMode==='edit'||isQuick) return renderPwCard(kind,it,idx,listLen,{...opts,isQuickEdit:isQuick});
  return renderPwViewCard(kind,it,idx,listLen,opts);
}

export const getPwFilterCnt=()=>(UI.pwFilterTypes?.length||0)+(UI.pwFilterArts?.length||0)+(UI.pwFilterActionSubs?.length||0)+(UI.pwFilterTiers?.length||0)+(UI.pwFilterTags?.length||0);
export const hasActivePwFilter=()=>getPwFilterCnt()>0;
export const isOnlyPowersFilter=()=>Array.isArray(UI.pwFilterTypes)&&UI.pwFilterTypes.length===1&&UI.pwFilterTypes[0]==='power';
export const isOnlyAugsFilter=()=>Array.isArray(UI.pwFilterTypes)&&UI.pwFilterTypes.length===1&&UI.pwFilterTypes[0]==='augment';
export function matchesPwItemFilter(it,kind){
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
export function matchesPwGroupFilter(p){
  if(!hasActivePwFilter()) return true;
  return matchesPwItemFilter(p,'power')||getLinkedAugs(p.id).some(ag=>matchesPwItemFilter(ag,'augment'));
}

export function renderPwGroupList(pwArr,pwCtx={}){
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

export function secHasFilteredPowers(secId){
  if(S.powers.filter(p=>p.sectionId===secId).some(matchesPwGroupFilter)) return true;
  if(getUnlinkedAugsInSec(secId).some(ag=>matchesPwItemFilter(ag,'augment'))) return true;
  return S.powerSections.filter(s=>(s.parentSectionId||'')===secId).some(cs=>secHasFilteredPowers(cs.id));
}
export function renderPwSecSlot(parentId,beforeSecId){
  return `<div data-pw-sec-slot="${esc(parentId)}" data-before-sec="${esc(beforeSecId||'')}" class="pw-sec-slot"></div>`;
}
export function openPwSecParentPicker(anchorEl,secId){
  const sec=S.powerSections.find(s=>s.id===secId); if(!sec) return;
  const validParents=S.powerSections.filter(s=>canSetSecParent(S.powerSections,secId,s.id));
  const items=[
    {icon:'📁',label:'Hauptebene',active:!sec.parentSectionId,onClick:()=>{sec.parentSectionId='';sanitizeSecHierarchy(S.powerSections);hooks.renderMain?.();save();toast('Sektion auf Hauptebene verschoben');}},
    ...validParents.map(s=>({
      icon:'↳',
      label:`in: ${s.name||'Sektion'}`,
      active:sec.parentSectionId===s.id,
      onClick:()=>{
        if(!canSetSecParent(S.powerSections,secId,s.id)){toast('⚠️ Zyklus verhindert: Eine Sektion kann nicht in sich selbst oder ihre Untersektion gelegt werden.');return;}
        sec.parentSectionId=s.id;s.collapsed=false;sanitizeSecHierarchy(S.powerSections);hooks.renderMain?.();save();toast('Sektion als Unterordner verschachtelt');
      }
    }))
  ];
  openCtxMenu({key:`pwsec-parent-picker:${secId}`,title:'Übergeordnete Sektion',anchorEl,align:'right',minWidth:235,items});
}
export function openPwSecArtPicker(anchorEl,secId){
  const sec=S.powerSections.find(s=>s.id===secId); if(!sec) return;
  const setArt=val=>{sec.filterArt=val;UI.confirmSecPullId=null;hooks.renderMain?.();save();};
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
export function openPwSecMenu(anchorEl,secId,forceOpen=false){
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

export function renderPwSection(sec,sIdx,sibLen=1,depth=0,pwCtx={}){
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

export function tplPowers(){
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

export function spendResource(kind,id){
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
  syncDiceFromSheet(); hooks.renderHeader?.(); hooks.renderMain?.(); renderDice(); save();
  const toastCostPart=costMsgs.length?`(${costMsgs.join(', ')})`:'';
  const toastStPart=actNames.length?`• Status ${actNames.join(', ')} aktiv!`:'';
  toast(`⚡ „${nm}“ eingesetzt ${toastCostPart} ${toastStPart}`.replace(/\s+/g,' ').trim());
}

export function addCustomPwTagFromInput(kind,id){
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
  save(); hooks.renderMain?.();
}

export function addCustomDmgTypeFromPwInput(kind,id){
  const it=findPwItem(kind,id); if(!it) return;
  const inp=document.querySelector(`[data-pw-ar-newdt="${kind}:${id}"]`);
  const raw=String(inp?.value||'').trim();
  if(!raw) return;
  const list=getSheetDmgTypeList(S);
  const existing=list.find(t=>t.toLowerCase()===raw.toLowerCase());
  const canon=existing||raw;
  if(!existing){
    S.dmgTypeList=[...list,canon];
  }
  it.actionRoll=normActionRoll(it.actionRoll);
  it.actionRoll.enabled=true;
  it.actionRoll.dealsEgDmg=true;
  it.actionRoll.replaceDmgType=true;
  it.actionRoll.dmgType=canon;
  if(inp) inp.value='';
  syncDiceFromSheet();
  hooks.renderMain?.();
  if(D.open) renderDice();
  save();
  toast(existing?`Schadenstyp „${canon}“ ausgewählt`:`Schadenstyp „${canon}“ zur Standardliste hinzugefügt & ausgewählt`);
}


