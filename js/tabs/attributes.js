import {
  ATTRS, DEF_ATTR_COLS, ATTR_GROUPS, STATUS_DEFS, SEC_META, TR_DEFS, QTABS
} from '../constants.js';
import {
  esc, toInt, toFlt, fmtN, fmtSign, toRtfHtml
} from '../utils.js';
import {
  renderSystemIconHtml, S, isMobileLayout, UI
} from '../state.js';
import {
  getStatusEffValues, getReservedTotals, getEffectivePoolCap, getReservedSrcList, calcActiveMods, buildAttrTip, buildSecTip, getTrCost, getResLabel, getAttrCol, getSecCol, getTrBonus, getAttrTot, getLpBase, getLpMax, getMlpBase, getMlpMax, getLpRegenAuto, getMlpRegenAuto, hasLpRegenOvr, hasMlpRegenOvr, getLpRegen, getMlpRegen, getIniBase, getIniTot, getApMax, getMapMax, getCresBase, getCresMax, getExtraSecBase, getBstAuto, hasBstOvr, getBstBase, getEffBst
} from '../calc.js';
import {
  renderRtfToolbarHtml
} from '../notes.js';

export const renderTrPairs=(ak,n,src)=>{
  const tr=S.attributes[ak].tr;
  const tipFor=i=>{const tc=getTrCost(ak,i);return `${ak} Training ${i+1}: +${TR_DEFS[i].b} ${n} (${tc.sp} SP${tc.msp?` + ${tc.msp} MsP`:''}${tc.manual?' • Manuell':''})`;};
  return `<div class="grid grid-cols-2 gap-1 w-full">${[0,1,2,3].map(i=>`<button type="button" data-action="toggle-tr" data-attr="${ak}" data-idx="${i}" data-src="${src}" data-tip="${tipFor(i)}" class="tr-sm ${tr[i]?'on':''}">${tr[i]?'✓':i+1}</button>`).join('')}</div><button type="button" data-action="toggle-tr" data-attr="${ak}" data-idx="4" data-src="${src}" data-tip="${tipFor(4)}" class="tr-lg ${tr[4]?'on':''}">5</button>`;
};
export const secGearBtn=(t,col)=>`<button type="button" data-action="open-sec-color" data-target="${t}" data-tip="Farbe anpassen" class="btn w-7 h-7 p-0 text-xs shrink-0" style="border-color:color-mix(in srgb,${esc(col)} 55%,var(--bdr))">⚙️</button>`;
export const renderColorPairBtns=(action,extraAttrs,item,isSmall=false,textTip='Textfarbe anpassen',bgTip='Fensterfarbe anpassen')=>{
  const sz=isSmall?'w-6 h-6 p-0 text-[10px]':'w-7 h-7 p-0 text-xs', ea=extraAttrs?` ${extraAttrs}`:'';
  const stTxt=item?` ${item.color?`style="border-color:${esc(item.color)}"`:''}`:'';
  const stBg=item?` ${item.bgColor?`style="border-color:${esc(item.bgColor)};background:color-mix(in srgb,${esc(item.bgColor)} 35%,var(--surf2))"`:''}`:'';
  return `<button type="button" data-action="${action}"${ea} data-cmode="text" data-tip="${esc(textTip)}" class="btn ${sz} shrink-0"${stTxt}>🎨</button><button type="button" data-action="${action}"${ea} data-cmode="bg" data-tip="${esc(bgTip)}" class="btn ${sz} shrink-0"${stBg}>🪟</button>`;
};
export const modChip=v=>v?`<span class="px-1.5 rounded text-[10px] font-black ${v>0?'bg-emerald-500/20 text-emerald-400':'bg-rose-500/20 text-rose-400'}" data-tip="Aktiver Effekt-Bonus">${fmtSign(v)}</span>`:'';

export const isTab1PhoneDefault=()=>window.innerWidth<768||isMobileLayout();
export function isTab1SecCollapsed(key){
  const ov=UI.tab1?.[key];
  if(ov!==null&&ov!==undefined) return Boolean(ov);
  if(key==='attrs') return isTab1PhoneDefault();
  if(key==='sec') return false;
  if(key==='status') return S.statusCollapsed?true:isTab1PhoneDefault();
  if(key==='insp'||key==='res'||key==='thresholds'||key==='move'||key==='hz'||key==='quick') return isTab1PhoneDefault();
  return false;
}

export function renderStatusEffectCard(def){
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
export function renderInspirationSection(){
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
export function renderReservationsSection(){
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
export function renderStatusEffectsSection(){
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

export function tplAttributes(){
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
