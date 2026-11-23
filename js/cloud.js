import {
  SYSTEM_ICON_DEFS, REGISTRY_ID, LIBRARY_ID, REPO_LIBRARY_URL, PWLIB_CACHE_KEY, PATCHNOTES_ID, PATCHNOTES_CACHE_KEY, FEEDBACK_ID, FEEDBACK_CACHE_KEY, DEF_FB_FOLDERS, ICON_STORE_ID, CUSTOM_ICONS_CACHE_KEY, CLOUD_SYNC_DEBOUNCE_MS, CLOUD_SYNC_RETRY_DELAYS, CLOUD_SYNC_KEEPALIVE_LIMIT, POWER_PACK_SCHEMA
} from './constants.js';
import {
  $, uid, stamp, esc, clone, toInt, fmtSign, sortAlpha, stripHtml, toRtfHtml, simpleHash, fastHash2
} from './utils.js';
import {
  hooks
} from './ui-hooks.js';
import {
  defaultState, setS, normalizeCampaigns, mergeThemePrefs, migrateUserLocalBgMap, sanitizeThemePrefsForRegistry, getCampaigns, setActiveCampaign, isGlobalGM, canManageCampaign, canClearLiveDice, getCreatableCampaigns, ensureUserRecord, ensureAllRegistryUsers, findUserKeyByName, renderUserNamePill, saveRegistryLocal, saveDiceFeedLocal, saveSecretRollsLocal, getActiveLiveCampaignId, getRollCampaignId, getCampaignFilteredDiceFeed, captureScrollState, restoreScrollState, toast, hasNiceRoll, triggerNiceEasterEgg, mergeLoaded, saveLastActiveTab, getSavedTabForChar, save, flushPendingSave, applySessionTheme, syncPalDraftFromSlot, applyTheme, CUSTOM_ICONS, S, D, CN, LD, FBW, isMobileLayout, UI, LIVE_TAB_ID, PATCHNOTES, FEEDBACK, CLOUD, CLOUD_SYNC, PWLIB, getCharOwner, getCharCampaignId, canManageChar
} from './state.js';
import {
  calcActiveMods, importPowerPackIntoSheet, getLpMax, getMlpMax, getIniTot, getApMax, getMapMax
} from './calc.js';

let cloudSyncTimer=null, liveDiceES=null, liveDiceBC=null, liveDiceTopicCur='', liveDicePollTimer=null, registryPushInFlight=0, lastRegistryPushMs=0;
let pwLibFetchPromise=null;
export const isSecretRollActive = () => Boolean(CLOUD.isAdmin && D.secretMode);
export const getLiveDiceTopic=()=>{
  const base=String(CLOUD.serverUrl||window.location.origin||'scherbensturm_global').trim().replace(/\/+$/,'').toLowerCase();
  const key=(!base||base==='null'||base.startsWith('file:'))?'scherbensturm_global_net':base;
  return `scherbensturm_live_${simpleHash(key)}`;
};
export function mergeDiceFeeds(incArr,clearedAt=0,clearedByCamp=null,saveLocal=true){
  const clr=Math.max(toInt(CLOUD.registry?.diceClearedAt,0),toInt(clearedAt,0));
  if(clr>toInt(CLOUD.registry?.diceClearedAt,0)) CLOUD.registry.diceClearedAt=clr;
  if(!CLOUD.registry.diceClearedByCamp||typeof CLOUD.registry.diceClearedByCamp!=='object') CLOUD.registry.diceClearedByCamp={};
  if(clearedByCamp&&typeof clearedByCamp==='object'){
    Object.entries(clearedByCamp).forEach(([k,v])=>{
      CLOUD.registry.diceClearedByCamp[k]=Math.max(toInt(CLOUD.registry.diceClearedByCamp[k],0),toInt(v,0));
    });
  }
  const map=new Map();
  [...(CLOUD.diceFeed||[]),...(Array.isArray(incArr)?incArr:[])].forEach(r=>{
    if(!r||!r.id) return;
    const ts=toInt(r.tsMs,0);
    const rCamp=getRollCampaignId(r);
    const campClr=toInt(CLOUD.registry?.diceClearedByCamp?.[rCamp],0);
    if(ts>clr&&ts>campClr){
      if(!map.has(r.id)) map.set(r.id,r);
    }
  });
  const merged=[...map.values()].sort((a,b)=>toInt(b.tsMs,0)-toInt(a.tsMs,0)).slice(0,40);
  CLOUD.diceFeed=merged;
  CLOUD.registry.diceFeed=merged;
  if(saveLocal) saveDiceFeedLocal();
  return merged;
}
export function renderLobbyLiveDiceHtml(inFloatingWin=false){
  const activeCampId=getActiveLiveCampaignId();
  const lobbyH=Math.max(180,Math.min(1200,toInt(CLOUD.lobbyDiceH,340)));
  const activeCampObj=getCampaigns().find(c=>c.id===activeCampId);
  const feed=getCampaignFilteredDiceFeed(activeCampId);
  const statusBadge=CLOUD.diceConnected
    ?`<span class="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-400/50 inline-flex items-center gap-1"><span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>Echtzeit-Kanal live</span>`
    :`<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/15 text-sky-300 border border-sky-400/40 inline-flex items-center gap-1">☁️ Cloud-Kanal bereit</span>`;
  const renderRollCard=(entry,idx)=>{
    const isFirst=idx===0;
    const chMatch=entry.charId?(CLOUD.list||[]).find(c=>c.id===entry.charId):null;
    const av=chMatch?.avatar||(entry.charId&&entry.charId===S.charId?S.profile.avatar:'')||'';
    const res=Array.isArray(entry.res)?entry.res:[];
    const anyCrit=res.some(x=>x.crit), anyOk=res.some(x=>x.ok);
    const bdrCls=entry.isHz?'border-amber-400/60 bg-amber-500/10':entry.isCustomDice?'border-sky-400/60 bg-sky-500/10':anyCrit?(isFirst?'crit-glow border-amber-400 bg-amber-500/15':'border-amber-400/70 bg-amber-500/10'):anyOk?'border-emerald-500/50 bg-emerald-500/10':'border-rose-500/50 bg-rose-500/10';
    let resHtml='';
    if(entry.isHz){
      const r0=res[0]?.r??'-';
      resHtml=`<div class="flex flex-wrap items-center justify-between gap-2 pt-1.5 border-t border-white/10">
        <div class="flex flex-wrap items-center gap-2 min-w-0"><span class="text-xl sm:text-2xl font-black tabular text-amber-400">🎲 ${r0}</span><span class="text-xs font-extrabold text-amber-300 break-words">🎯 Trefferzone: ${esc(entry.hzZone||'Unbekannt')}</span></div>
        <span class="px-2.5 py-0.5 rounded-lg bg-amber-500 text-slate-950 font-black text-xs tabular shrink-0">W100 = ${r0}</span>
      </div>`;
    }else if(entry.isCustomDice){
      const cRolls=Array.isArray(entry.customRolls)?entry.customRolls:res.map(x=>x.r);
      const cMod=toInt(entry.customMod,0);
      const cSum=entry.customSum!==undefined?entry.customSum:cRolls.reduce((a,b)=>a+b,0);
      const cTot=entry.customTotal!==undefined?entry.customTotal:(cSum+cMod);
      const cForm=entry.customFormula||`${cRolls.length}W${entry.customSides||'?'}${cMod?fmtSign(cMod):''}`;
      resHtml=`<div class="space-y-1.5 pt-1.5 border-t border-white/10 tabular">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <div class="flex flex-wrap items-center gap-2 min-w-0">
            <span class="px-2.5 py-1 rounded-xl bg-black/35 border border-sky-400/40 text-lg sm:text-2xl font-black text-sky-300">🎲 = ${cTot}</span>
            <div class="min-w-0">
              <div class="text-xs sm:text-sm font-black text-sky-300">${esc(cForm)}</div>
              <div class="text-[11px] t-mut">${cRolls.length}× W${entry.customSides||'?'}${cMod?` • Summe ${cSum} ${fmtSign(cMod)}`:''}</div>
            </div>
          </div>
          <span class="px-2.5 py-1 rounded-lg bg-sky-600 text-white font-black text-xs sm:text-sm shadow shrink-0">${esc(cForm)} = ${cTot}</span>
        </div>
        ${(cRolls.length>1||cMod!==0)?`<div class="flex flex-wrap items-center gap-1">${cRolls.map((rv,i)=>`<span class="px-2 py-0.5 rounded-md border border-sky-400/35 bg-sky-500/15 text-sky-200 text-[11px] font-extrabold">${cRolls.length>1?`<span class="opacity-65 mr-0.5">#${i+1}:</span>`:''}${rv}</span>`).join('')}${cMod?`<span class="px-2 py-0.5 rounded-md border border-indigo-400/40 bg-indigo-500/20 text-indigo-200 text-[11px] font-black">Mod ${fmtSign(cMod)}</span>`:''}</div>`:''}
      </div>`;
    }else if(res.length===1){
      const x=res[0];
      const xMult=x.egMult||entry.egMult||1;
      const xBaseEg=x.baseEg!==undefined?x.baseEg:(xMult>1?Math.round(x.eg/xMult):x.eg);
      const stTxt=x.crit?'★ KRITISCHER ERFOLG! ★':x.ok?'✓ ERFOLG':(x.r===100?'💀 PATZER (100)':'✕ MISSERFOLG');
      const stCol=x.crit?'text-amber-400':x.ok?'text-emerald-400':'text-rose-400';
      resHtml=`<div class="flex flex-wrap items-center justify-between gap-2 pt-1.5 border-t border-white/10 tabular">
        <div class="flex flex-wrap items-center gap-2 min-w-0">
          <span class="px-2.5 py-1 rounded-xl bg-black/35 border bdr-line text-lg sm:text-2xl font-black ${stCol}">🎲 ${x.r}${x.rollMod&&x.rawR!==undefined?`<span class="text-xs font-bold text-cyan-300 ml-1">(Wurf ${x.rawR}${fmtSign(x.rollMod)})</span>`:''}</span>
          <div class="min-w-0">
            <div class="text-xs sm:text-sm font-black uppercase ${stCol}">${stTxt}</div>
            <div class="text-[11px] t-mut">Schwelle ≤ <strong>${entry.th}</strong> (${entry.chance??Math.max(1,Math.min(99,entry.th))}%)${xMult>1?` • <strong class="text-amber-300">EG ×${xMult}</strong>`:''}</div>
          </div>
        </div>
        <div class="flex flex-wrap items-center gap-1.5">
          ${x.crit?`<span class="px-2.5 py-1 rounded-lg bg-amber-500 text-slate-950 font-black text-xs sm:text-sm shadow">★ KRIT</span>`:''}
          <span class="px-3 py-1 rounded-lg text-white font-black text-xs sm:text-sm shadow ${x.ok?'bg-emerald-600':'bg-rose-600'}">${x.ok?('EG: '+x.eg+(xMult>1?` (${xBaseEg} ×${xMult})`:'')):'MEG: '+x.meg}</span>
        </div>
      </div>`;
    }else if(res.length>1){
      const w=res.filter(x=>x.ok).length, c=res.filter(x=>x.crit).length, eMult=entry.egMult||res[0]?.egMult||1;
      resHtml=`<div class="space-y-1.5 pt-1.5 border-t border-white/10 tabular">
        <div class="flex flex-wrap items-center justify-between gap-2 text-xs font-extrabold">
          <span class="t-mut">${res.length}× W100 gegen Schwelle ≤ <strong>${entry.th}</strong> (${entry.chance??Math.max(1,Math.min(99,entry.th))}%)${eMult>1?` • <strong class="text-amber-300">EG ×${eMult}</strong>`:''}</span>
          <span class="${w>0?'text-emerald-400':'text-rose-400'}">${w}/${res.length} Erfolge${c?` • <strong class="text-amber-400">★ ${c} Krit</strong>`:''}</span>
        </div>
        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-1.5">${res.map((x,i)=>{const xm=x.egMult||entry.egMult||1;return `<div class="px-2 py-1 rounded-lg border flex items-center justify-between gap-1 text-xs min-w-0 ${x.crit?'border-amber-400 bg-amber-500/20 text-amber-200':x.ok?'border-emerald-500/40 bg-emerald-500/15 text-emerald-200':'border-rose-500/40 bg-rose-500/15 text-rose-200'}"><span class="font-black truncate">#${i+1}: ${x.r}${x.rollMod&&x.rawR!==undefined?` (${x.rawR}${fmtSign(x.rollMod)})`:""}</span><span class="font-extrabold text-[11px] shrink-0">${x.crit?'★ ':''}${x.ok?('EG '+x.eg+(xm>1?` ×${xm}`:'')):'MEG '+x.meg}</span></div>`;}).join('')}</div>
      </div>`;
    }
    return `<div class="subcard p-2.5 sm:p-3 space-y-2 border-2 ${bdrCls} ${isFirst?' ring-1 ring-sky-400/30':''} min-w-0">
      <div class="flex flex-wrap items-center justify-between gap-2 min-w-0">
        <div class="flex items-center gap-2 min-w-0 flex-1">
          <div class="w-8 h-8 rounded-lg overflow-hidden border bdr-acc bg-black/30 shrink-0 flex items-center justify-center">${av?`<img src="${av}" class="w-full h-full object-cover"/>`:`<span class="text-xs font-black text-acc">🎲</span>`}</div>
          <div class="min-w-0 flex-1">
            <div class="flex flex-wrap items-center gap-1.5 min-w-0">
              <span class="font-black text-xs sm:text-sm truncate max-w-full">${esc(entry.charName||'Unbenannter Held')}</span>
              ${entry.playerName?renderUserNamePill(entry.playerName,{cls:'px-1.5 py-0.2 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-400/40'}):''}
              ${isFirst?`<span class="px-1.5 py-0.2 rounded text-[9px] font-black uppercase bg-acc-soft text-acc border bdr-acc">Aktuellster Wurf</span>`:''}
            </div>
            <div class="text-xs font-extrabold text-acc truncate">${esc(entry.label||'Freie Probe')}</div>
          </div>
        </div>
        <span class="text-[11px] font-bold t-mut tabular shrink-0">${esc(entry.ts||'')}</span>
      </div>
      ${entry.wasSecret?`<div class="inline-flex flex-wrap items-center gap-1 px-2 py-0.5 rounded-md border border-amber-400/60 bg-gradient-to-r from-amber-500/20 to-purple-500/20 text-amber-200 text-[10px] font-extrabold tabular">🕵️ Enthüllter Geheimwurf (gewürfelt: ${esc(entry.originalTs || entry.ts)}${entry.revealedAt ? ` • enthüllt: ${esc(entry.revealedAt)}` : ''})</div>`:''}
      ${!entry.isHz && !entry.isCustomDice?`<div class="flex flex-wrap items-center gap-1.5 text-[11px] tabular bg-black/25 rounded-lg px-2.5 py-1.5 border bdr-line break-words">
        <span class="font-extrabold text-acc">Aufschlüsselung:</span>
        <span>Wert: <strong>${esc(entry.cBreak??entry.cv)}</strong></span>
        <span class="opacity-50">•</span>
        <span>Schw.: <strong>${esc(entry.dBreak??entry.dv)}</strong></span>
        <span class="opacity-50">•</span>
        <span>Vor./Nacht.: <strong>${esc(entry.advBreak||'±0')}</strong></span>
        ${entry.critLbl?`<span class="opacity-50">•</span><span class="text-amber-400 font-bold">Krit: ${esc(entry.critLbl)}</span>`:''}
        ${entry.formula?`<span class="w-full text-[10px] t-mut pt-0.5 border-t border-white/5 break-words">Formel: ${esc(entry.formula)}</span>`:''}
      </div>`:''}
      ${resHtml}
    </div>`;
  };
  const emptyText=`Noch keine Würfe in der Kampagne „${esc(activeCampObj?.name || 'Hauptkampagne')}“ im Live-Kanal. Klicke oben auf <strong>„⚡ Schnellwurf“</strong> oder öffne den <strong>„🎲 Würfelassistent“</strong> – jeder Wurf erscheint sofort in Echtzeit mit Krits, EG/MEG und kompletter Aufschlüsselung bei allen Spielern in der Lobby!`;
  const mobWinFlow=Boolean(inFloatingWin&&isMobileLayout());
  const bodyHtml=CLOUD.diceCollapsed?'':(inFloatingWin
    ?(feed.length
      ?`<div data-scroll-key="livediceFeed" class="space-y-2.5 ${mobWinFlow?'':'flex-1 min-h-0 overflow-y-auto overscroll-contain pr-1'}">${feed.map((e,i)=>renderRollCard(e,i)).join('')}</div>`
      :`<div data-scroll-key="livediceFeed" class="subcard border-dashed py-6 px-4 text-center text-xs t-mut ${mobWinFlow?'min-h-[140px]':'flex-1 min-h-0 overflow-y-auto overscroll-contain'} flex items-center justify-center"><div>${emptyText}</div></div>`)
    :`${feed.length
      ?`<div data-lobby-dice-body="1" class="space-y-2.5 overflow-y-auto pr-1" style="height:${lobbyH}px">${feed.map((e,i)=>renderRollCard(e,i)).join('')}</div>`
      :`<div data-lobby-dice-body="1" class="subcard border-dashed py-6 px-4 text-center text-xs t-mut overflow-y-auto flex items-center justify-center" style="height:${lobbyH}px"><div>${emptyText}</div></div>`}
    <div data-lobby-dice-resize="1" title="Ziehen zum vertikalen Vergrößern oder Verkleinern (${lobbyH} px)" class="relative -mx-2.5 sm:-mx-3 -mb-2.5 sm:-mb-3 mt-1 px-3 py-1.5 border-t bdr-line bg-black/20 hover:bg-acc-soft/30 rounded-b-xl grid grid-cols-3 items-center cursor-ns-resize select-none transition-colors" style="touch-action:none">
      <div class="flex items-center gap-1.5 text-[10px] font-bold t-mut tabular justify-self-start">
        <span data-lobby-dice-h-lbl="1">${lobbyH} px</span>
        ${lobbyH!==340?`<button type="button" data-action="reset-lobby-dice-h" data-tip="Höhe des Live-Würfelfensters auf Standard (340 px) zurücksetzen" class="btn py-0 px-1.5 text-[10px] font-black cursor-pointer">↺</button>`:''}
      </div>
      <span class="text-sm leading-none font-black text-acc/80 tracking-widest pointer-events-none justify-self-center">⋯</span>
      <span class="text-[11px] leading-none font-black text-acc/80 pointer-events-none justify-self-end">◢</span>
    </div>`);
  return `<div class="subcard p-2.5 sm:p-3 border-2 bdr-acc bg-acc-soft/20 min-w-0 max-w-full ${inFloatingWin&&!mobWinFlow?'flex-1 min-h-0 flex flex-col gap-3':'space-y-3'}">
    <div class="shrink-0 flex flex-wrap items-center justify-between gap-2 min-w-0 max-w-full ${CLOUD.diceCollapsed?'':'border-b bdr-line pb-2'}">
      <div class="flex flex-wrap items-center gap-1.5 sm:gap-2 min-w-0 max-w-full">
        <button type="button" data-action="toggle-lobby-dice-collapse" aria-label="${CLOUD.diceCollapsed?'Live-Würfelfenster ausklappen':'Live-Würfelfenster einklappen'}" data-tip="${CLOUD.diceCollapsed?'Live-Würfelfenster ausklappen':'Live-Würfelfenster einklappen'}" class="btn w-7 h-7 p-0 text-xs font-black shrink-0">${CLOUD.diceCollapsed?'▸':'▾'}</button>
        <span class="text-xs sm:text-sm font-black text-acc uppercase tracking-wider break-words min-w-0">🎲 Live-Würfel<span class="hidden sm:inline">fenster der Gruppe</span></span>
        <span class="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-acc-soft text-acc border bdr-acc inline-flex items-center gap-1 max-w-full min-w-0"><span class="shrink-0">📁</span><span class="truncate">${esc(activeCampObj?.name || 'Hauptkampagne')}</span></span>
        ${statusBadge}
        <span class="pill cursor-default text-[10px] py-0.5 px-2 tabular shrink-0">${feed.length} ${feed.length===1?'Wurf':'Würfe'}</span>
      </div>
      <div class="flex flex-wrap items-center gap-1.5 min-w-0 max-w-full">
        <button type="button" data-action="lobby-quick-roll" aria-label="${isSecretRollActive()?'Geheimer ':''}Schnellwurf (${D.cnt}× W100)" data-tip="Wirft sofort mit den aktuellen Einstellungen im Würfelassistenten (${esc(D.label)} • Schwelle ${hooks.calcThreshold().th})" class="btn ${isSecretRollActive()?'bg-amber-500 text-slate-950 border-amber-300':'btn-ok'} py-1 px-2 sm:px-2.5 text-xs font-black shrink-0">${isSecretRollActive()?'🕵️':'⚡'} <span class="hidden sm:inline">${isSecretRollActive()?'Geheimer ':''}Schnellwurf </span>(${D.cnt}×<span class="hidden sm:inline"> W100</span>)</button>
        <button type="button" data-action="lobby-open-dice" aria-label="Würfelassistent öffnen" data-tip="Öffnet den Würfelassistenten direkt über der Lobby" class="btn btn-pri py-1 px-2 sm:px-2.5 text-xs font-extrabold shrink-0">🎲 <span class="hidden sm:inline">Würfelassistent</span><span class="sm:hidden">Würfel</span></button>
        <button type="button" data-action="toggle-dice-toast" aria-label="${CLOUD.diceToast?'Live-Wurf-Popups deaktivieren':'Live-Wurf-Popups aktivieren'}" data-tip="Toast-Einblendung bei eingehenden Live-Würfen anderer Spieler ein-/ausschalten" class="btn py-1 px-2 text-[11px] shrink-0 ${CLOUD.diceToast?'bdr-acc text-acc':'opacity-70'}">${CLOUD.diceToast?'🔔':'🔕'}<span class="hidden sm:inline"> ${CLOUD.diceToast?'Live-Popup An':'Popup Aus'}</span></button>
        <button type="button" data-action="lobby-sync-dice" aria-label="Live-Würfelfenster synchronisieren" data-tip="Würfel-Feed jetzt mit dem Server abgleichen" class="btn py-1 px-2 text-[11px] shrink-0">🔄</button>
        ${(feed.length&&canClearLiveDice(activeCampId))?(CLOUD.confirmClearDice?`<span class="inline-flex items-center gap-1 max-w-full"><button type="button" data-action="confirm-clear-lobby-dice" class="btn bg-rose-600 text-white border-rose-600 py-0.5 px-2 text-[10px] font-black">Löschen? (2/2)</button><button type="button" data-action="cancel-clear-lobby-dice" aria-label="Löschen abbrechen" class="btn py-0.5 px-1.5 text-[10px]">✕</button></span>`:`<button type="button" data-action="ask-clear-lobby-dice" aria-label="Live-Würfellog leeren" data-tip="Live-Würfellog für die Lobby leeren" class="btn btn-err py-1 px-2 text-[11px] shrink-0">🗑️</button>`):''}
      </div>
    </div>
    ${bodyHtml}
  </div>`;
}
export function updateLiveDiceBadges(){
  const cnt=String(getCampaignFilteredDiceFeed().length);
  document.querySelectorAll('[data-live-dice-cnt]').forEach(el=>{if(el.textContent!==cnt) el.textContent=cnt;});
}
export function updateLobbyLiveDiceDOM(){
  const el=$('lobbyLiveDiceMount');
  if(el){
    const campId=getActiveLiveCampaignId();
    const sameCamp=el.childElementCount>0&&(!el.dataset.lastCampId||el.dataset.lastCampId===campId);
    const snap=sameCamp?captureScrollState(el):null;
    el.innerHTML=renderLobbyLiveDiceHtml();
    el.dataset.lastCampId=campId;
    if(snap) restoreScrollState(el,snap,{preserveWindow:false});
  }
  if(LD.open) hooks.renderLiveDice?.();
  updateLiveDiceBadges();
}
export function handleIncomingDicePayload(rawObj,isRealtimePush=false){
  if(!rawObj||typeof rawObj!=='object') return;
  if(rawObj.type==='campnote_live'){
    if(rawObj.senderTabId===LIVE_TAB_ID) return;
    const pgPayload=(rawObj.page&&typeof rawObj.page==='object')?rawObj.page:rawObj;
    const pnePayload=(rawObj.publicNoteEntry&&typeof rawObj.publicNoteEntry==='object')?rawObj.publicNoteEntry:null;
    if(rawObj.scope==='camp'){
      const campId=String(rawObj.campaignId||'').trim();
      const pid=String(rawObj.pageId||pgPayload.id||'').trim();
      if(campId&&campId!=='default'){
        const shared=getCampaignSharedPages(campId);
        const idx=shared.findIndex(p=>p.id===pid);
        if(rawObj.deleted===true){
          if(idx>=0&&shared[idx].id!=='camp_main') shared.splice(idx,1);
          if(!shared.length) getCampaignSharedPages(campId);
        }else if(pid){
          if(idx>=0){
            if(pgPayload.title!==undefined) shared[idx].title=String(pgPayload.title||'Notiz');
            if(pgPayload.content!==undefined) shared[idx].content=String(pgPayload.content??'');
            shared[idx].updatedAt=String(pgPayload.updatedAt||rawObj.updatedAt||stamp());
            if(pgPayload.lastEditor!==undefined) shared[idx].lastEditor=String(pgPayload.lastEditor||'');
          }else{
            shared.push({
              id:pid,
              title:String(pgPayload.title||'Notiz'),
              content:String(pgPayload.content??''),
              updatedAt:String(pgPayload.updatedAt||rawObj.updatedAt||stamp()),
              lastEditor:String(pgPayload.lastEditor||''),
              originCharName:String(pgPayload.originCharName||''),
              originOwner:String(pgPayload.originOwner||''),
              isDetached:Boolean(pgPayload.isDetached),
              isCampaignNative:Boolean(pgPayload.isCampaignNative)
            });
          }
        }
      }
    }else if(rawObj.scope==='char'){
      const cid=String(rawObj.charId||pnePayload?.charId||'').trim();
      if(cid){
        if(pnePayload){
          upsertPublicNoteEntry(cid,pnePayload);
        }else{
          const pubEntry=upsertPublicNoteEntry(cid,{
            campaignId:rawObj.campaignId,
            charName:rawObj.charName,
            avatar:CLOUD.registry.publicNotes?.[cid]?undefined:rawObj.avatar,
            owner:rawObj.owner,
            updatedAt:String(rawObj.updatedAt||stamp()),
            pages:Array.isArray(rawObj.pages)?rawObj.pages:undefined
          });
          if(!Array.isArray(rawObj.pages)&&rawObj.pageId){
            const pIdx=pubEntry.pages.findIndex(p=>p.id===rawObj.pageId);
            if(rawObj.deleted===true||rawObj.isPublic===false){
              if(pIdx>=0) pubEntry.pages.splice(pIdx,1);
            }else if(pIdx>=0){
              if(rawObj.title!==undefined) pubEntry.pages[pIdx].title=String(rawObj.title||'🌐 Öffentlich');
              if(rawObj.content!==undefined) pubEntry.pages[pIdx].content=String(rawObj.content??'');
              pubEntry.pages[pIdx].updatedAt=String(rawObj.updatedAt||stamp());
            }else{
              pubEntry.pages.push({
                id:String(rawObj.pageId),
                title:String(rawObj.title||'🌐 Öffentlich'),
                content:String(rawObj.content??''),
                updatedAt:String(rawObj.updatedAt||stamp())
              });
            }
          }
          pubEntry.content=String(pubEntry.pages?.[0]?.content??rawObj.content??pubEntry.content??'');
        }
        if(cid===S.charId&&Array.isArray(S.campaignNotes)){
          const incPages=CLOUD.registry.publicNotes[cid]?.pages;
          if(Array.isArray(incPages)){
            incPages.forEach(ip=>{
              const localPg=S.campaignNotes.find(n=>n.id===ip.id);
              if(localPg){
                if(ip.title!==undefined) localPg.title=String(ip.title||localPg.title);
                if(ip.content!==undefined) localPg.content=String(ip.content??'');
                localPg.updatedAt=String(ip.updatedAt||stamp());
              }
            });
            save(false);
          }
        }
      }
    }
    saveRegistryLocal();
    if(UI.inLobby){
      const ae=document.activeElement;
      const isTypingNote=Boolean(ae&&ae.matches&&(ae.matches('[data-lobby-pubnote]')||ae.matches('[data-lobby-camptitle]')));
      const curPageId=String((ae&&(ae.dataset?.pageid||ae.getAttribute('data-lobby-camptitle')||ae.getAttribute('data-lobby-pubnote')))||(CLOUD.activePublicPageKey||'').split('::').pop()||'');
      const incPageId=String(rawObj.pageId||pgPayload?.id||(pnePayload?.pages?.find(p=>p.id===curPageId)?.id)||'');
      const incPgObj=pnePayload?.pages?.find(p=>p.id===curPageId)||pgPayload;
      const incContent=incPgObj?.content!==undefined?incPgObj.content:rawObj.content;
      const incTitle=incPgObj?.title!==undefined?incPgObj.title:rawObj.title;
      const incUpdatedAt=incPgObj?.updatedAt||rawObj.updatedAt||pnePayload?.updatedAt;
      const isSamePage=Boolean(incPageId&&curPageId&&curPageId===incPageId);
      if(!isTypingNote||!isSamePage){
        const isTypingOtherInput=Boolean(!isTypingNote&&ae&&(ae.tagName==='INPUT'||ae.tagName==='TEXTAREA'||ae.isContentEditable));
        if(!isTypingOtherInput&&!isTypingNote){
          hooks.renderMain?.();
        }else if(isSamePage){
          const box=document.querySelector('[data-lobby-pubnote]');
          if(box&&incContent!==undefined) box.innerHTML=toRtfHtml(incContent);
          const tInp=document.querySelector('[data-lobby-camptitle]');
          if(tInp&&incTitle!==undefined) tInp.value=String(incTitle||'');
          const tsEl=document.querySelector('[data-lobby-notets]');
          if(tsEl&&incUpdatedAt) tsEl.textContent=String(incUpdatedAt);
        }
      }else{
        if(!ae.matches('[data-lobby-pubnote]')&&incContent!==undefined){
          const box=document.querySelector('[data-lobby-pubnote]');
          if(box) box.innerHTML=toRtfHtml(incContent);
        }
        if(!ae.matches('[data-lobby-camptitle]')&&incTitle!==undefined){
          const tInp=document.querySelector('[data-lobby-camptitle]');
          if(tInp) tInp.value=String(incTitle||'');
        }
        const tsEl=document.querySelector('[data-lobby-notets]');
        if(tsEl&&incUpdatedAt) tsEl.textContent=String(incUpdatedAt);
      }
    }
    if(CN.open){
      const ae=document.activeElement;
      const isTypingCN=Boolean(ae&&ae.closest&&ae.closest('#notesMount'));
      if(!isTypingCN) hooks.renderCampNotes?.();
    }
    return;
  }
  if(rawObj.type==='clear_dice'){
    const clr=toInt(rawObj.clearedAt,Date.now());
    if(rawObj.campaignId){
      if(!CLOUD.registry.diceClearedByCamp||typeof CLOUD.registry.diceClearedByCamp!=='object') CLOUD.registry.diceClearedByCamp={};
      CLOUD.registry.diceClearedByCamp[rawObj.campaignId]=Math.max(toInt(CLOUD.registry.diceClearedByCamp[rawObj.campaignId],0),clr);
      CLOUD.diceFeed=(CLOUD.diceFeed||[]).filter(e=>getRollCampaignId(e)!==rawObj.campaignId||toInt(e.tsMs,0)>clr);
      CLOUD.registry.diceFeed=(CLOUD.registry.diceFeed||[]).filter(e=>getRollCampaignId(e)!==rawObj.campaignId||toInt(e.tsMs,0)>clr);
    }else{
      CLOUD.registry.diceClearedAt=Math.max(toInt(CLOUD.registry.diceClearedAt,0),clr);
      CLOUD.diceFeed=[];
      CLOUD.registry.diceFeed=[];
    }
    saveDiceFeedLocal(); saveRegistryLocal();
    updateLobbyLiveDiceDOM();
    return;
  }
  if(!rawObj.id||!Array.isArray(rawObj.res)) return;
  const rollCampId=getRollCampaignId(rawObj);
  const campClrAt=toInt(CLOUD.registry?.diceClearedByCamp?.[rollCampId],0);
  if(toInt(rawObj.tsMs,0)<=Math.max(toInt(CLOUD.registry.diceClearedAt,0),campClrAt)) return;
  const already=(CLOUD.diceFeed||[]).some(x=>x.id===rawObj.id);
  if(already) return;
  mergeDiceFeeds([rawObj]);
  updateLobbyLiveDiceDOM();
  if(isRealtimePush&&rawObj.senderTabId!==LIVE_TAB_ID&&CLOUD.diceToast&&getRollCampaignId(rawObj)===getActiveLiveCampaignId()){
    const r0=rawObj.res[0];
    const r0Mult=r0?.egMult||rawObj.egMult||1;
    const sumTxt=rawObj.isHz?`W100 = ${r0?.r} (${rawObj.hzZone||'Zone'})`:rawObj.isCustomDice?`${rawObj.customFormula} = ${rawObj.customTotal}`:rawObj.res.length===1
      ?`${r0.r} (${r0.crit?'★ KRIT! ':''}${r0.ok?('EG '+r0.eg+(r0Mult>1?` ×${r0Mult}`:'')):'MEG '+r0.meg})`
      :`${rawObj.res.filter(x=>x.ok).length}/${rawObj.res.length} Erfolge`;
    toast(`${rawObj.wasSecret?'🕵️ Enthüllt – ':''}🎲 Live-Wurf (${rawObj.charName||'Spieler'}): ${rawObj.label||'Probe'} → ${sumTxt}`);
  }
}
export function initLiveDiceChannel(){
  try{
    if(!liveDiceBC&&typeof BroadcastChannel!=='undefined'){
      liveDiceBC=new BroadcastChannel('scherbensturm_live_dice_bc');
      liveDiceBC.onmessage=ev=>{if(ev?.data) handleIncomingDicePayload(ev.data,true);};
    }
  }catch(e){}
  try{
    const topic=getLiveDiceTopic();
    if(liveDiceES&&liveDiceTopicCur===topic) return;
    if(liveDiceES){try{liveDiceES.close();}catch(e){} liveDiceES=null;}
    liveDiceTopicCur=topic;
    if(typeof EventSource!=='undefined'){
      liveDiceES=new EventSource(`https://ntfy.sh/${encodeURIComponent(topic)}/sse`);
      liveDiceES.onopen=()=>{CLOUD.diceConnected=true;updateLobbyLiveDiceDOM();};
      liveDiceES.onerror=()=>{CLOUD.diceConnected=false;updateLobbyLiveDiceDOM();};
      liveDiceES.onmessage=ev=>{
        if(!ev?.data) return;
        try{
          const outer=JSON.parse(ev.data);
          if(outer&&outer.event==='message'&&typeof outer.message==='string'){
            handleIncomingDicePayload(JSON.parse(outer.message),true);
          }else if(outer&&((outer.id&&Array.isArray(outer.res))||outer.type==='campnote_live'||outer.type==='clear_dice')){
            handleIncomingDicePayload(outer,true);
          }
        }catch(err){}
      };
    }
  }catch(e){}
  if(!liveDicePollTimer){
    let lastLivePollMs=0;
    liveDicePollTimer=setInterval(()=>{
      if(document.hidden) return;
      if(!(UI.inLobby || LD.open)) return;
      const now=Date.now(), minGap=CLOUD.diceConnected?20000:5000;
      if(now-lastLivePollMs<minGap-250) return;
      lastLivePollMs=now;
      syncCloudRegistry(false);
    },5000);
  }
}
export function sendLiveBroadcast(payload){
  try{if(liveDiceBC) liveDiceBC.postMessage(payload);}catch(e){}
  try{
    const topic=getLiveDiceTopic();
    fetch(`https://ntfy.sh/${encodeURIComponent(topic)}`,{method:'POST',body:JSON.stringify(payload)}).catch(()=>{});
  }catch(e){}
}
export function publishLiveRoll(entry, forcePublic = false){
  if(!entry) return;
  if(!forcePublic && hasNiceRoll(entry)) triggerNiceEasterEgg();
  if(!entry.campaignId) entry.campaignId=UI.inLobby?getActiveLiveCampaignId():getCharCampaignId(entry.charId||S.charId);
  if(!forcePublic && isSecretRollActive()){
    entry.isSecret=true;
    entry.wasSecret=true;
    entry.revealed=false;
    entry.originalTs=entry.originalTs||entry.ts||stamp();
    entry.originalTsMs=entry.originalTsMs||entry.tsMs||Date.now();
    if(!Array.isArray(CLOUD.secretRolls)) CLOUD.secretRolls=[];
    CLOUD.secretRolls.unshift(entry);
    if(CLOUD.secretRolls.length>30) CLOUD.secretRolls.length=30;
    saveSecretRollsLocal();
    UI.lastSecretRollId=entry.id;
    toast('🕵️ Geheimer Admin-Wurf gespeichert (nicht im Live-Feed).');
    if(D.open) hooks.renderDice?.();
    return;
  }
  if(!forcePublic) UI.lastSecretRollId='';
  mergeDiceFeeds([entry]);
  updateLobbyLiveDiceDOM();
  sendLiveBroadcast(entry);
  syncCloudRegistry(true);
}
export function formatSecretRollSummary(r){
  if(!r) return '';
  if(r.isHz){
    const r0=r.res?.[0]?.r??'-';
    return `W100 = ${r0} • 🎯 ${r.hzZone||'Trefferzone'}`;
  }
  if(r.isCustomDice){
    const cForm=r.customFormula||`${(r.customRolls||r.res||[]).length}W${r.customSides||'?'}${toInt(r.customMod,0)?fmtSign(toInt(r.customMod,0)):''}`;
    const cTot=r.customTotal!==undefined?r.customTotal:((r.customRolls||[]).reduce((a,b)=>a+b,0)+toInt(r.customMod,0));
    return `${cForm} = ${cTot}`;
  }
  const res=Array.isArray(r.res)?r.res:[];
  if(res.length===1){
    const x=res[0], xm=x.egMult||r.egMult||1, xb=x.baseEg!==undefined?x.baseEg:(xm>1?Math.round(x.eg/xm):x.eg);
    return `W100: ${x.r} [≤${r.th}] → ${x.crit?'★ KRIT ':''}${x.ok?('EG '+x.eg+(xm>1?` (${xb} ×${xm})`:'')):'MEG '+x.meg}`;
  }
  if(res.length>1){
    const w=res.filter(x=>x.ok).length, c=res.filter(x=>x.crit).length, em=r.egMult||res[0]?.egMult||1;
    return `${res.length}× W100 [≤${r.th}] → ${w}/${res.length} Erfolge${c?` • ★${c}`:''}${em>1?` • EG ×${em}`:''}`;
  }
  return '';
}
export function revealSecretRoll(rollId){
  if(!CLOUD.isAdmin) return;
  const item=(CLOUD.secretRolls||[]).find(x=>x&&x.id===rollId);
  if(!item){toast('ℹ️ Geheimwurf nicht gefunden.');return;}
  if(item.revealed){toast('ℹ️ Dieser Geheimwurf wurde bereits enthüllt.');return;}
  const revealEntry=clone(item);
  revealEntry.wasSecret=true;
  revealEntry.isSecret=false;
  revealEntry.revealed=true;
  revealEntry.revealedAt=stamp();
  revealEntry.originalTs=item.originalTs||item.ts||stamp();
  revealEntry.ts=item.originalTs||item.ts;
  revealEntry.tsMs=Date.now();
  revealEntry.campaignId=item.campaignId||getActiveLiveCampaignId();
  publishLiveRoll(revealEntry, true);
  item.revealed=true;
  item.revealedAt=revealEntry.revealedAt;
  saveSecretRollsLocal();
  if(D.open) hooks.renderDice?.();
  toast('👁️ Geheimwurf im Live-Feed enthüllt!');
}
let liveNoteSyncTimer = null;
export function publishLiveCampNote(noteMsg){
  if(!noteMsg||typeof noteMsg!=='object') return;
  noteMsg.type = 'campnote_live';
  noteMsg.senderTabId = LIVE_TAB_ID;
  noteMsg.tsMs = Date.now();
  sendLiveBroadcast(noteMsg);
  clearTimeout(liveNoteSyncTimer);
  liveNoteSyncTimer = setTimeout(() => syncCloudRegistry(true), 1200);
}
export function clearLiveDiceFeed(){
  const campId=getActiveLiveCampaignId();
  if(!canClearLiveDice(campId)){
    CLOUD.confirmClearDice=false;
    updateLobbyLiveDiceDOM();
    toast('🔒 Nur der Admin oder ein Spielleiter dieser Kampagne kann den Live-Würfellog leeren.');
    return;
  }
  const clr=Date.now();
  if(!CLOUD.registry.diceClearedByCamp||typeof CLOUD.registry.diceClearedByCamp!=='object') CLOUD.registry.diceClearedByCamp={};
  CLOUD.registry.diceClearedByCamp[campId]=clr;
  CLOUD.diceFeed=(CLOUD.diceFeed||[]).filter(e=>getRollCampaignId(e)!==campId);
  CLOUD.registry.diceFeed=(CLOUD.registry.diceFeed||[]).filter(e=>getRollCampaignId(e)!==campId);
  CLOUD.confirmClearDice=false;
  saveDiceFeedLocal(); saveRegistryLocal();
  updateLobbyLiveDiceDOM();
  sendLiveBroadcast({type:'clear_dice',campaignId:campId,clearedAt:clr,senderTabId:LIVE_TAB_ID});
  syncCloudRegistry(true);
  toast('🗑️ Live-Würfellog geleert');
}

export const getCloudEndpoint=()=>{const base=String(CLOUD.serverUrl||'').trim().replace(/\/+$/,'');return `${base}/.netlify/functions/sheets`;};
export async function syncCloudRegistry(push=false){
  if(!push&&(registryPushInFlight>0||(Date.now()-lastRegistryPushMs<2500))) return;
  if(push){
    registryPushInFlight++;
    CLOUD.registryLoaded=true;
  }
  const localSnap=push?clone({
    users:CLOUD.registry.users||{},
    claims:CLOUD.registry.claims||{},
    charCampaigns:CLOUD.registry.charCampaigns||{},
    publicNotes:CLOUD.registry.publicNotes||{},
    campaignSharedNotes:CLOUD.registry.campaignSharedNotes||{},
    deletedCharIds:Array.isArray(CLOUD.registry.deletedCharIds)?[...new Set(CLOUD.registry.deletedCharIds.map(x=>String(x||'').trim()).filter(Boolean))]:[],
    campaigns:normalizeCampaigns(CLOUD.registry.campaigns),
    gmUsers:Array.isArray(CLOUD.registry.gmUsers)?[...new Set(CLOUD.registry.gmUsers.map(u=>String(u||'').trim()).filter(Boolean))]:[],
    lobbyLogo:String(CLOUD.registry.lobbyLogo??''),
    adminHash:CLOUD.registry.adminHash??'',
    diceClearedAt:toInt(CLOUD.registry.diceClearedAt,0),
    diceClearedByCamp:clone(CLOUD.registry.diceClearedByCamp||{})
  }):null;
  try{
    const getRes=await fetch(`${getCloudEndpoint()}?id=${encodeURIComponent(REGISTRY_ID)}`,{headers:{'Accept':'application/json'}});
    if(getRes.ok){
      const rem=await getRes.json();
      if(rem&&typeof rem==='object'&&rem.registry){
        if(!push&&(registryPushInFlight>0||(Date.now()-lastRegistryPushMs<2500))) return;
        const _regSig=(reg,feed)=>JSON.stringify({
          diceFeed:feed||[],
          publicNotes:reg?.publicNotes||{},
          campaignSharedNotes:reg?.campaignSharedNotes||{},
          campaigns:reg?.campaigns||[],
          claims:reg?.claims||{},
          charCampaigns:reg?.charCampaigns||{},
          users:reg?.users||{},
          gmUsers:reg?.gmUsers||[],
          lobbyLogo:reg?.lobbyLogo||'',
          diceClearedAt:toInt(reg?.diceClearedAt,0),
          diceClearedByCamp:reg?.diceClearedByCamp||{}
        });
        const prevSig=!push?_regSig(CLOUD.registry,CLOUD.diceFeed):'';
        const curUserKeyPre=!push&&CLOUD.currentUser?findUserKeyByName(CLOUD.currentUser):'';
        const prevUserThemeSig=!push&&curUserKeyPre?JSON.stringify(CLOUD.registry.users?.[curUserKeyPre]?.themePrefs||null):'';
        const clrAt=Math.max(toInt(rem.registry.diceClearedAt,0),toInt(localSnap?localSnap.diceClearedAt:CLOUD.registry.diceClearedAt,0));
        const mergedDiceClearedByCamp={};
        const remByCamp=(rem.registry.diceClearedByCamp&&typeof rem.registry.diceClearedByCamp==='object')?rem.registry.diceClearedByCamp:{};
        const locByCamp=localSnap?(localSnap.diceClearedByCamp||{}):(CLOUD.registry.diceClearedByCamp||{});
        new Set([...Object.keys(remByCamp),...Object.keys(locByCamp)]).forEach(k=>{
          mergedDiceClearedByCamp[k]=Math.max(toInt(remByCamp[k],0),toInt(locByCamp[k],0));
        });
        const mergedClaims={...(rem.registry.claims||{})};
        const srcClaims=localSnap?localSnap.claims:(CLOUD.registry.claims||{});
        Object.entries(srcClaims).forEach(([k,v])=>{mergedClaims[k]=v??'';});
        if(!push){
          Object.entries(rem.registry.claims||{}).forEach(([k,v])=>{mergedClaims[k]=v??'';});
        }
        const mergedCharCampaigns={...(rem.registry.charCampaigns||{})};
        const srcCharCamps=localSnap?localSnap.charCampaigns:(CLOUD.registry.charCampaigns||{});
        Object.entries(srcCharCamps).forEach(([k,v])=>{mergedCharCampaigns[k]=String(v||'default').trim()||'default';});
        if(!push){
          Object.entries(rem.registry.charCampaigns||{}).forEach(([k,v])=>{mergedCharCampaigns[k]=String(v||'default').trim()||'default';});
        }
        const mergedPublicNotes={...(rem.registry.publicNotes||{})};
        const srcPublicNotes=localSnap?localSnap.publicNotes:(CLOUD.registry.publicNotes||{});
        Object.entries(srcPublicNotes||{}).forEach(([k,v])=>{if(v&&typeof v==='object')mergedPublicNotes[k]={...v};});
        if(!push){
          Object.entries(rem.registry.publicNotes||{}).forEach(([k,v])=>{if(v&&typeof v==='object')mergedPublicNotes[k]={...v};});
        }
        const mergedCampaignSharedNotes={...(rem.registry.campaignSharedNotes||{})};
        const srcCampSharedNotes=localSnap?localSnap.campaignSharedNotes:(CLOUD.registry.campaignSharedNotes||{});
        Object.entries(srcCampSharedNotes||{}).forEach(([k,v])=>{if(Array.isArray(v))mergedCampaignSharedNotes[k]=clone(v);});
        if(!push){
          Object.entries(rem.registry.campaignSharedNotes||{}).forEach(([k,v])=>{if(Array.isArray(v))mergedCampaignSharedNotes[k]=clone(v);});
        }
        const remHasCamps=Array.isArray(rem.registry.campaigns)&&rem.registry.campaigns.length>0;
        const mergedCampaigns=push
          ?normalizeCampaigns(localSnap.campaigns)
          :(remHasCamps?normalizeCampaigns(rem.registry.campaigns):normalizeCampaigns(CLOUD.registry.campaigns));
        const validCampIds=new Set(mergedCampaigns.map(c=>c.id));
        Object.keys(mergedCharCampaigns).forEach(cid=>{
          if(!validCampIds.has(mergedCharCampaigns[cid])) mergedCharCampaigns[cid]='default';
        });
        const srcUsers=localSnap?localSnap.users:(CLOUD.registry.users||{});
        const srcDelIds=localSnap?(localSnap.deletedCharIds||[]):(Array.isArray(CLOUD.registry.deletedCharIds)?CLOUD.registry.deletedCharIds:[]);
        const remDelIds=Array.isArray(rem.registry.deletedCharIds)?rem.registry.deletedCharIds:[];
        const mergedDeletedCharIds=[...new Set([...remDelIds,...srcDelIds].map(x=>String(x||'').trim()).filter(Boolean))];
        const delSet=new Set(mergedDeletedCharIds);
        delSet.forEach(did=>{delete mergedPublicNotes[did];});
        Object.keys(mergedPublicNotes).forEach(cid=>{
          if(mergedCharCampaigns[cid]) mergedPublicNotes[cid].campaignId=mergedCharCampaigns[cid];
          if(mergedClaims[cid]!==undefined) mergedPublicNotes[cid].owner=mergedClaims[cid];
        });
        const rawUsers=push?{...(rem.registry.users||{}),...srcUsers}:(rem.registry.users&&typeof rem.registry.users==='object'?rem.registry.users:srcUsers);
        const mergedUsers={};
        Object.entries(rawUsers||{}).forEach(([uk,uv])=>{
          if(uv&&typeof uv==='object'&&!uv._deleted){
            const locUser=srcUsers?.[uk];
            const remUser=rem.registry.users?.[uk];
            const fbObj=push?remUser:locUser;
            const avatarVal=uv.avatar!==undefined?String(uv.avatar||''):String(fbObj?.avatar||'');
            const mergedTp=mergeThemePrefs(locUser?.themePrefs,remUser?.themePrefs,push);
            const nextU={...uv,avatar:avatarVal};
            if(mergedTp){
              nextU.themePrefs=sanitizeThemePrefsForRegistry(mergedTp,uk).cleanPrefs;
            }else{
              delete nextU.themePrefs;
            }
            mergedUsers[uk]=nextU;
          }
        });
        CLOUD.registry={
          users:mergedUsers,
          claims:mergedClaims,
          charCampaigns:mergedCharCampaigns,
          publicNotes:mergedPublicNotes,
          campaignSharedNotes:mergedCampaignSharedNotes,
          deletedCharIds:mergedDeletedCharIds,
          campaigns:mergedCampaigns,
          gmUsers: push ? (localSnap.gmUsers||[]) : (Array.isArray(rem.registry.gmUsers)?rem.registry.gmUsers:(CLOUD.registry.gmUsers||[])),
          lobbyLogo: push ? (localSnap.lobbyLogo??'') : (rem.registry.lobbyLogo!==undefined?String(rem.registry.lobbyLogo):(CLOUD.registry.lobbyLogo||'')),
          adminHash:push?(localSnap.adminHash!==''?localSnap.adminHash:(rem.registry.adminHash||'')):(rem.registry.adminHash||CLOUD.registry.adminHash||''),
          diceClearedAt:clrAt,
          diceClearedByCamp:mergedDiceClearedByCamp,
          diceFeed:CLOUD.diceFeed||[]
        };
        ensureAllRegistryUsers();
        CLOUD.list=(CLOUD.list||[]).filter(ch=>ch&&!delSet.has(ch.id));
        CLOUD.list.forEach(ch=>{
          if(ch&&ch.id){
            const cid=mergedCharCampaigns[ch.id]||ch.campaignId||'default';
            ch.campaignId=validCampIds.has(cid)?cid:'default';
            CLOUD.registry.charCampaigns[ch.id]=ch.campaignId;
          }
        });
        CLOUD.registryLoaded=true;
        mergeDiceFeeds(rem.registry.diceFeed||[],clrAt,mergedDiceClearedByCamp,push);
        const changed=push||_regSig(CLOUD.registry,CLOUD.diceFeed)!==prevSig;
        if(changed){
          if(!push) saveDiceFeedLocal();
          saveRegistryLocal();
          updateLobbyLiveDiceDOM();
        }
        if(!push&&CLOUD.currentUser){
          const curUserKeyPost=findUserKeyByName(CLOUD.currentUser);
          const nextUserThemeSig=curUserKeyPost?JSON.stringify(CLOUD.registry.users?.[curUserKeyPost]?.themePrefs||null):'';
          if(nextUserThemeSig&&nextUserThemeSig!==prevUserThemeSig){
            const isEditingSheet=Boolean(!UI.inLobby&&UI.sheetLoaded);
            applySessionTheme({
              allowSheetFallback:isEditingSheet,
              sheetFallbackAppearance:isEditingSheet?clone(S.appearance):null,
              sheetFallbackPalettes:isEditingSheet?clone(S.customPalettes||[]):null,
              preserveEditScope:UI.modal==='settings'
            });
            applyTheme();
            if(UI.modal==='settings'){syncPalDraftFromSlot();hooks.renderModal?.();}
          }
        }
      }
    }
    if(push){
      const cleanPushUsers={};
      Object.entries(CLOUD.registry.users||{}).forEach(([uk,uv])=>{
        if(uv&&typeof uv==='object'&&!uv._deleted){
          const nextU={...uv};
          if(nextU.themePrefs&&typeof nextU.themePrefs==='object'){
            nextU.themePrefs=sanitizeThemePrefsForRegistry(nextU.themePrefs,uk).cleanPrefs;
          }else{
            delete nextU.themePrefs;
          }
          cleanPushUsers[uk]=nextU;
        }
      });
      CLOUD.registry.users=cleanPushUsers;
      ensureAllRegistryUsers();
      CLOUD.registry.campaigns=normalizeCampaigns(localSnap?localSnap.campaigns:CLOUD.registry.campaigns);
      const payload={charId:REGISTRY_ID,profile:{name:'__REGISTRY__'},registry:CLOUD.registry,_summary:{updatedAt:stamp()}};
      await fetch(getCloudEndpoint(),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
      lastRegistryPushMs=Date.now();
      saveRegistryLocal();
    }
  }catch(e){saveRegistryLocal();}
  finally{
    if(push){
      registryPushInFlight=Math.max(0,registryPushInFlight-1);
      lastRegistryPushMs=Date.now();
    }
  }
}
export async function renameUserAccount(oldName,newName){
  ensureAllRegistryUsers();
  const rawOld=String(oldName||'').trim();
  const oldKey=findUserKeyByName(rawOld);
  const isSelf=Boolean(CLOUD.currentUser&&rawOld&&CLOUD.currentUser.trim().toLowerCase()===rawOld.toLowerCase());
  if(CLOUD.isAdmin!==true&&!isSelf){
    toast('🔒 Keine Berechtigung zum Umbenennen dieses Accounts.');
    return false;
  }
  if(!oldKey||!CLOUD.registry?.users?.[oldKey]){
    toast(`⚠️ Account „${rawOld||String(oldName||'')}“ wurde nicht gefunden.`);
    return false;
  }
  const cleanNew=String(newName??'').trim();
  if(!cleanNew){
    toast('⚠️ Bitte einen neuen Benutzernamen eingeben.');
    return false;
  }
  if(cleanNew.length>40){
    toast('⚠️ Benutzername darf maximal 40 Zeichen lang sein.');
    return false;
  }
  if(/[\x00-\x1F\x7F]/.test(cleanNew)||!/[\p{L}\p{N}]/u.test(cleanNew)){
    toast('⚠️ Ungültiger Benutzername (keine Steuerzeichen oder reinen Sonderzeichen erlaubt).');
    return false;
  }
  const newLow=cleanNew.toLowerCase();
  if(newLow==='__admin__'||newLow==='gast'){
    toast(`⚠️ Der Benutzername „${cleanNew}“ ist reserviert und nicht erlaubt.`);
    return false;
  }
  if(cleanNew===oldKey){
    toast('ℹ️ Der neue Benutzername ist identisch mit dem aktuellen Namen.');
    return false;
  }
  const conflictKey=findUserKeyByName(cleanNew);
  if(conflictKey&&conflictKey.toLowerCase()!==oldKey.toLowerCase()){
    toast(`⚠️ Der Benutzername „${conflictKey}“ ist bereits vergeben.`);
    return false;
  }
  const oldLow=oldKey.toLowerCase();
  const isOldUser=v=>String(v||'').trim().toLowerCase()===oldLow;
  const replaceUserInArr=arr=>{
    if(!Array.isArray(arr)) return arr;
    const out=[], seen=new Set();
    arr.forEach(item=>{
      const s=String(item||'').trim();
      if(!s) return;
      const next=isOldUser(s)?cleanNew:s;
      const low=next.toLowerCase();
      if(!seen.has(low)){
        seen.add(low);
        out.push(next);
      }
    });
    return out;
  };
  const existingRec=ensureUserRecord(oldKey,CLOUD.registry.users[oldKey],null);
  const nextHistory=[...(Array.isArray(existingRec.nameHistory)?existingRec.nameHistory:[])];
  nextHistory.push({from:oldKey,to:cleanNew,at:stamp(),atMs:Date.now()});
  const updatedRecord={
    ...existingRec,
    userId:existingRec.userId,
    passHash:existingRec.passHash,
    createdAt:existingRec.createdAt,
    avatar:existingRec.avatar,
    nameHistory:nextHistory,
    ...(existingRec.themePrefs?{themePrefs:clone(existingRec.themePrefs)}:{})
  };
  if(oldKey!==cleanNew){
    CLOUD.registry.users[cleanNew]=updatedRecord;
    CLOUD.registry.users[oldKey]={_deleted:true};
  }else{
    CLOUD.registry.users[oldKey]=updatedRecord;
  }
  const ownedCharIds=new Set();
  if(CLOUD.registry.claims&&typeof CLOUD.registry.claims==='object'){
    Object.keys(CLOUD.registry.claims).forEach(cid=>{
      if(isOldUser(CLOUD.registry.claims[cid])){
        ownedCharIds.add(cid);
        CLOUD.registry.claims[cid]=cleanNew;
      }
    });
  }
  if(Array.isArray(CLOUD.registry.gmUsers)){
    CLOUD.registry.gmUsers=replaceUserInArr(CLOUD.registry.gmUsers);
  }
  if(Array.isArray(CLOUD.registry.campaigns)){
    CLOUD.registry.campaigns.forEach(c=>{
      if(!c||typeof c!=='object') return;
      if(Array.isArray(c.allowedUsers)) c.allowedUsers=replaceUserInArr(c.allowedUsers);
      if(Array.isArray(c.gmUsers)) c.gmUsers=replaceUserInArr(c.gmUsers);
    });
  }
  if(CLOUD.registry.publicNotes&&typeof CLOUD.registry.publicNotes==='object'){
    Object.values(CLOUD.registry.publicNotes).forEach(pn=>{
      if(pn&&typeof pn==='object'&&isOldUser(pn.owner)) pn.owner=cleanNew;
    });
  }
  if(CLOUD.registry.campaignSharedNotes&&typeof CLOUD.registry.campaignSharedNotes==='object'){
    Object.values(CLOUD.registry.campaignSharedNotes).forEach(pages=>{
      if(!Array.isArray(pages)) return;
      pages.forEach(pg=>{
        if(!pg||typeof pg!=='object') return;
        if(isOldUser(pg.lastEditor)) pg.lastEditor=cleanNew;
        if(isOldUser(pg.originOwner)) pg.originOwner=cleanNew;
      });
    });
  }
  const migrateDiceFeeds=()=>{
    [CLOUD.registry.diceFeed,CLOUD.diceFeed].forEach(feed=>{
      if(!Array.isArray(feed)) return;
      feed.forEach(r=>{
        if(r&&typeof r==='object'&&isOldUser(r.playerName)) r.playerName=cleanNew;
      });
    });
  };
  migrateDiceFeeds();
  saveDiceFeedLocal();
  (CLOUD.list||[]).forEach(ch=>{
    if(ch&&ch.id&&isOldUser(ch.owner)){
      ownedCharIds.add(ch.id);
      ch.owner=cleanNew;
    }
  });
  if(isOldUser(S.owner)){
    S.owner=cleanNew;
    save(false);
  }
  if(isOldUser(CLOUD.currentUser)){
    CLOUD.currentUser=cleanNew;
    try{
      localStorage.setItem('scherbensturm_cloud_user',cleanNew);
      if(oldLow!==newLow){
        migrateUserLocalBgMap(oldKey,cleanNew);
        const oldStyleKey=`scherbensturm_lobby_style_${oldLow}`;
        const newStyleKey=`scherbensturm_lobby_style_${newLow}`;
        const oldStyleVal=localStorage.getItem(oldStyleKey);
        if(oldStyleVal!==null){
          localStorage.setItem(newStyleKey,oldStyleVal);
          localStorage.removeItem(oldStyleKey);
        }
        const oldNotifKey=`scherbensturm_notif_seen_${oldLow}`;
        const newNotifKey=`scherbensturm_notif_seen_${newLow}`;
        const oldNotifVal=localStorage.getItem(oldNotifKey);
        if(oldNotifVal!==null){
          localStorage.setItem(newNotifKey,oldNotifVal);
          localStorage.removeItem(oldNotifKey);
        }
      }
    }catch(e){}
  }
  await syncCloudRegistry(true);
  if(oldKey!==cleanNew){
    delete CLOUD.registry.users[oldKey];
  }
  migrateDiceFeeds();
  saveDiceFeedLocal();
  saveRegistryLocal();
  for(const cid of ownedCharIds){
    if(!cid||cid===REGISTRY_ID||cid===LIBRARY_ID||cid===PATCHNOTES_ID||cid===FEEDBACK_ID||cid===ICON_STORE_ID) continue;
    try{
      const res=await fetch(`${getCloudEndpoint()}?id=${encodeURIComponent(cid)}`,{headers:{'Accept':'application/json'}});
      if(!res.ok) continue;
      const data=await res.json();
      if(!data||data.error) continue;
      if(isOldUser(data.owner)||isOldUser(data._summary?.owner)||!data.owner){
        data.owner=cleanNew;
        if(!data._summary||typeof data._summary!=='object') data._summary={};
        data._summary.owner=cleanNew;
        if(CLOUD.isAdmin) data._AdminOverride=true;
        await fetch(getCloudEndpoint(),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});
      }
    }catch(e){}
  }
  if(typeof FEEDBACK==='object'&&FEEDBACK&&typeof saveFeedbackStore==='function'){
    if(isOldUser(FEEDBACK.backlogUser)) FEEDBACK.backlogUser=cleanNew;
    try{
      await saveFeedbackStore(store=>{
        let fbChanged=false;
        (store.items||[]).forEach(it=>{
          if(!it||typeof it!=='object') return;
          if(isOldUser(it.author)){it.author=cleanNew;fbChanged=true;}
          (it.messages||[]).forEach(m=>{
            if(m&&typeof m==='object'&&!m.isAdmin&&isOldUser(m.author)){
              m.author=cleanNew;
              fbChanged=true;
            }
          });
        });
        (store.backlog||[]).forEach(b=>{
          if(b&&typeof b==='object'&&isOldUser(b.author)){
            b.author=cleanNew;
            fbChanged=true;
          }
        });
        return fbChanged;
      },'');
    }catch(e){}
  }
  if(UI.profileUser&&isOldUser(UI.profileUser)) UI.profileUser=cleanNew;
  hooks.renderHeader?.();
  hooks.renderMain?.();
  hooks.renderModal?.();
  updateLobbyLiveDiceDOM();
  if(typeof updateNotifBadges==='function') updateNotifBadges();
  toast(`✅ Benutzername „${oldKey}“ wurde zu „${cleanNew}“ umbenannt.`);
  return true;
}
export function addCampaignAllowedUser(rawName){
  if(!canManageCampaign(CLOUD.activeCampaignId)) return;
  const clean=String(rawName||'').trim();
  if(!clean){toast('⚠️ Bitte einen Spielernamen eingeben oder auswählen.');return;}
  const camps=getCampaigns();
  const camp=camps.find(c=>c.id===CLOUD.activeCampaignId);
  if(!camp) return;
  if(!Array.isArray(camp.allowedUsers)) camp.allowedUsers=[];
  const known=sortAlpha([
    ...Object.keys(CLOUD.registry.users||{}),
    ...Object.values(CLOUD.registry.claims||{}),
    ...camps.flatMap(c=>c.allowedUsers||[]),
    ...(CLOUD.currentUser?[CLOUD.currentUser]:[])
  ]);
  const canonical=known.find(u=>u.toLowerCase()===clean.toLowerCase())||clean;
  if(camp.allowedUsers.some(u=>u.toLowerCase()===canonical.toLowerCase())){
    toast(`ℹ️ „${canonical}“ ist dieser Kampagne bereits zugeordnet.`);
    return;
  }
  camp.allowedUsers.push(canonical);
  CLOUD.registry.campaigns=normalizeCampaigns(camps);
  saveRegistryLocal();
  hooks.renderModal?.();
  syncCloudRegistry(true);
  toast(`👤 „${canonical}“ zu „${camp.name}“ zugeordnet!`);
}
export function removeCampaignAllowedUser(rawName){
  if(!canManageCampaign(CLOUD.activeCampaignId)) return;
  const clean=String(rawName||'').trim();
  if(!clean) return;
  const camps=getCampaigns();
  const camp=camps.find(c=>c.id===CLOUD.activeCampaignId);
  if(!camp||!Array.isArray(camp.allowedUsers)) return;
  camp.allowedUsers=camp.allowedUsers.filter(u=>u.toLowerCase()!==clean.toLowerCase());
  CLOUD.registry.campaigns=normalizeCampaigns(camps);
  saveRegistryLocal();
  hooks.renderModal?.();
  syncCloudRegistry(true);
  toast(`👤 „${clean}“ aus „${camp.name}“ entfernt.`);
}
export function toggleGlobalGMTag(rawName){
  if(!CLOUD.isAdmin) return;
  const clean=String(rawName||'').trim(); if(!clean) return;
  if(!Array.isArray(CLOUD.registry.gmUsers)) CLOUD.registry.gmUsers=[];
  const idx=CLOUD.registry.gmUsers.findIndex(u=>u.toLowerCase()===clean.toLowerCase());
  if(idx>=0){
    CLOUD.registry.gmUsers.splice(idx,1);
    getCampaigns().forEach(c=>{
      c.gmUsers=(c.gmUsers||[]).filter(u=>u.toLowerCase()!==clean.toLowerCase());
    });
    toast(`🎲 Spielleiter-Tag von „${clean}“ entfernt.`);
  }else{
    CLOUD.registry.gmUsers.push(clean);
    toast(`🎲 „${clean}“ zum Spielleiter ernannt!`);
  }
  saveRegistryLocal(); hooks.renderModal?.(); syncCloudRegistry(true);
}
export function addCampaignMainGM(rawName){
  if(!CLOUD.isAdmin) return;
  const clean=String(rawName||'').trim(); if(!clean) return;
  const camp=getCampaigns().find(c=>c.id===CLOUD.activeCampaignId);
  if(!camp||camp.id==='default') return;
  if(!Array.isArray(CLOUD.registry.gmUsers)) CLOUD.registry.gmUsers=[];
  if(!isGlobalGM(clean)) CLOUD.registry.gmUsers.push(clean);
  if(!Array.isArray(camp.gmUsers)) camp.gmUsers=[];
  if(!camp.gmUsers.some(u=>u.toLowerCase()===clean.toLowerCase())) camp.gmUsers.push(clean);
  if(!camp.allowedUsers.some(u=>u.toLowerCase()===clean.toLowerCase())) camp.allowedUsers.push(clean);
  saveRegistryLocal(); hooks.renderModal?.(); syncCloudRegistry(true);
  toast(`🎲 „${clean}“ als Spielleiter für „${camp.name}“ eingesetzt!`);
}
export function removeCampaignMainGM(rawName){
  if(!CLOUD.isAdmin) return;
  const clean=String(rawName||'').trim(); if(!clean) return;
  const camp=getCampaigns().find(c=>c.id===CLOUD.activeCampaignId);
  if(!camp) return;
  camp.gmUsers=(camp.gmUsers||[]).filter(u=>u.toLowerCase()!==clean.toLowerCase());
  saveRegistryLocal(); hooks.renderModal?.(); syncCloudRegistry(true);
  toast(`🎲 „${clean}“ als Haupt-Spielleiter von „${camp.name}“ entfernt.`);
}
export function archiveCharPublicNotesToCampaign(charId, explicitCampId=''){
  const campId = explicitCampId || getCharCampaignId(charId);
  if(!campId || campId === 'default') return;
  const pubEntry = CLOUD.registry.publicNotes?.[charId];
  const pages = (charId === S.charId && Array.isArray(S.campaignNotes)) ? extractPublicPages(S.campaignNotes) : (Array.isArray(pubEntry?.pages) ? pubEntry.pages : []);
  const validPages = pages.filter(pg => Boolean(stripHtml(pg?.content || '').trim()));
  if(!validPages.length) return;
  const shared = getCampaignSharedPages(campId);
  const originCharName = pubEntry?.charName || (charId === S.charId ? S.profile.name : '') || 'Ehemaliger Charakter';
  const originOwner = pubEntry?.owner || getCharOwner(charId) || '';
  let archived = false;
  validPages.forEach(pg => {
    const title = String(pg.title || 'Notiz');
    const content = String(pg.content || '');
    const alreadyExists = shared.some(sp => String(sp.title || '') === title && String(sp.content || '') === content && String(sp.originCharName || '') === originCharName);
    if(!alreadyExists){
      shared.push({ id: 'arch_' + uid(), title, content, updatedAt: pg.updatedAt || stamp(), lastEditor: pubEntry?.owner || '', originCharName, originOwner, isDetached: true });
      archived = true;
    }
  });
  if(archived) saveRegistryLocal();
}
export async function kickCharFromCampaign(charId){
  const curCampId=getCharCampaignId(charId);
  if(!curCampId||curCampId==='default') return;
  if(!CLOUD.isAdmin&&!canManageCampaign(curCampId)){toast('🔒 Nur Spielleiter oder der Admin dürfen Charaktere aus der Kampagne werfen.');return;}
  archiveCharPublicNotesToCampaign(charId, curCampId);
  if(CLOUD.registry.publicNotes) delete CLOUD.registry.publicNotes[charId];
  CLOUD.registry.charCampaigns[charId]='default';
  const ch=CLOUD.list.find(x=>x.id===charId); if(ch) ch.campaignId='default';
  if(S.charId===charId) S.campaignId='default';
  await updateCloudCharacterMeta(charId,data=>{data.campaignId='default';if(data._summary)data._summary.campaignId='default';},'🚪 Charakter aus der Kampagne geworfen (nun unter „Ohne Kampagne / Allgemein“).');
}
export async function duplicateCharacterSheet(charId){
  if(!CLOUD.currentUser&&!CLOUD.isAdmin){toast('🔒 Bitte zuerst anmelden.');return;}
  try{
    let srcData=null;
    if(UI.sheetLoaded&&S.charId===charId&&!CLOUD.viewingRemote){srcData=clone(S);}
    else{
      const res=await fetch(`${getCloudEndpoint()}?id=${encodeURIComponent(charId)}`,{headers:{'Accept':'application/json'}});
      if(res.ok) srcData=await res.json();
    }
    if(!srcData||srcData.error){toast('⚠️ Charakterdaten für Kopie konnten nicht geladen werden.');return;}
    const newId=uid(), newOwner=CLOUD.currentUser||srcData.owner||'';
    srcData.charId=newId;
    srcData.owner=newOwner;
    srcData.campaignId='default';
    if(!srcData.profile) srcData.profile={};
    srcData.profile.name=`${String(srcData.profile.name||'Charakter').trim()} (Kopie)`;
    if(srcData._summary){srcData._summary.owner=newOwner;srcData._summary.campaignId='default';srcData._summary.updatedAt=stamp();}
    if(newOwner) CLOUD.registry.claims[newId]=newOwner;
    CLOUD.registry.charCampaigns[newId]='default';
    await syncCloudRegistry(true);
    await fetch(getCloudEndpoint(),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(srcData)});
    await fetchLobbyList(true);
    toast(`📋 Kopie „${srcData.profile.name}“ unter „Ohne Kampagne / Allgemein“ angelegt!`);
  }catch(e){toast('⚠️ Kopieren fehlgeschlagen.');}
}
export function getCampaignSharedPages(campId){
  if(!CLOUD.registry.campaignSharedNotes||typeof CLOUD.registry.campaignSharedNotes!=='object'){
    CLOUD.registry.campaignSharedNotes={};
  }
  if(!Array.isArray(CLOUD.registry.campaignSharedNotes[campId])||!CLOUD.registry.campaignSharedNotes[campId].length){
    CLOUD.registry.campaignSharedNotes[campId]=[{id:'camp_main',title:'📖 Gemeinsame Notizen',content:'',updatedAt:'',lastEditor:'',isCampaignNative:true}];
  }
  return CLOUD.registry.campaignSharedNotes[campId];
}
export function extractPublicPages(notesArr,fallbackContent='',fallbackTs=''){
  if(Array.isArray(notesArr)){
    return notesArr.filter(n=>Boolean(n&&n.isPublic)).map(n=>({
      id:String(n.id||'cn_public'),
      title:String(n.title||'🌐 Öffentlich'),
      content:String(n.content||''),
      updatedAt:String(n.updatedAt||fallbackTs||'')
    }));
  }
  if(String(fallbackContent||'').trim()){
    return [{id:'cn_public',title:'🌐 Öffentlich',content:String(fallbackContent||''),updatedAt:String(fallbackTs||'')}];
  }
  return [];
}
export function upsertPublicNoteEntry(charId,data={}){
  const id=String(charId||data?.charId||'').trim();
  if(!id) return null;
  if(!CLOUD.registry.publicNotes||typeof CLOUD.registry.publicNotes!=='object') CLOUD.registry.publicNotes={};
  const cur=CLOUD.registry.publicNotes[id];
  const pages=Array.isArray(data.pages)?data.pages:(Array.isArray(cur?.pages)?cur.pages:[]);
  const entry={
    ...(cur||{}),
    charId:id,
    campaignId:String(data.campaignId||cur?.campaignId||getCharCampaignId(id)||'default'),
    charName:String(data.charName||cur?.charName||'Unbenannter Held'),
    avatar:data.avatar!==undefined?String(data.avatar||''):String(cur?.avatar||''),
    owner:data.owner!==undefined?String(data.owner??''):String(cur?.owner??getCharOwner(id)??''),
    content:data.content!==undefined?String(data.content??''):String(cur?.content??pages[0]?.content??''),
    updatedAt:String((data.updatedAt!==undefined&&data.updatedAt!=='')?data.updatedAt:(cur?.updatedAt??data.updatedAt??'')),
    pages
  };
  CLOUD.registry.publicNotes[id]=entry;
  return entry;
}
export async function fetchLobbyList(silent=false){
  const showLoader=!silent||!CLOUD.list.length;
  if(showLoader){CLOUD.loading=true; CLOUD.error=''; if(UI.inLobby){hooks.renderHeader?.();hooks.renderMain?.();}}
  else CLOUD.error='';
  try{
    await syncCloudRegistry(false);
    const res=await fetch(getCloudEndpoint(),{headers:{'Accept':'application/json'}});
    if(!res.ok) throw new Error(`HTTP ${res.status}`);
    const data=await res.json();
    const validCampIds=new Set(getCampaigns().map(c=>c.id));
    if(!CLOUD.registry.charCampaigns||typeof CLOUD.registry.charCampaigns!=='object') CLOUD.registry.charCampaigns={};
    if(!Array.isArray(CLOUD.registry.deletedCharIds)) CLOUD.registry.deletedCharIds=[];
    const delSet=new Set(CLOUD.registry.deletedCharIds);
    CLOUD.list=(Array.isArray(data)?data:[]).filter(ch=>ch&&ch.id!==REGISTRY_ID&&ch.name!=='__REGISTRY__'&&ch.id!==LIBRARY_ID&&ch.name!=='__POWER_LIBRARY__'&&ch.id!==PATCHNOTES_ID&&ch.name!=='__PATCHNOTES__'&&ch.id!==FEEDBACK_ID&&ch.name!=='__FEEDBACK__'&&ch.id!==ICON_STORE_ID&&ch.name!=='__CUSTOM_ICONS__'&&!delSet.has(ch.id));
    CLOUD.list.forEach(ch=>{
      if(ch.owner&&CLOUD.registry.claims[ch.id]===undefined) CLOUD.registry.claims[ch.id]=ch.owner;
      if(CLOUD.registry.charCampaigns[ch.id]===undefined){
        CLOUD.registry.charCampaigns[ch.id]=String(ch.campaignId||ch._summary?.campaignId||'default').trim()||'default';
      }
      const rawCamp=String(CLOUD.registry.charCampaigns[ch.id]||'default').trim()||'default';
      const effCamp=validCampIds.has(rawCamp)?rawCamp:'default';
      ch.campaignId=effCamp;
      CLOUD.registry.charCampaigns[ch.id]=effCamp;
      if(!CLOUD.registry.publicNotes||typeof CLOUD.registry.publicNotes!=='object') CLOUD.registry.publicNotes={};
      const curPub=CLOUD.registry.publicNotes[ch.id];
      const chPub=ch.publicNote??ch._summary?.publicNote;
      const chPages=Array.isArray(curPub?.pages)&&curPub.pages.length
        ?curPub.pages
        :(Array.isArray(ch.publicPages)&&ch.publicPages.length?ch.publicPages:(Array.isArray(ch._summary?.publicPages)&&ch._summary.publicPages.length?ch._summary.publicPages:null));
      if(curPub||chPub!==undefined||chPages){
        const initPages=chPages||extractPublicPages(ch.campaignNotes,String(curPub?.content||chPub||''),curPub?.updatedAt||ch.updatedAt||'');
        upsertPublicNoteEntry(ch.id,{
          campaignId:effCamp,
          charName:ch.name,
          avatar:ch.avatar!==undefined?ch.avatar:curPub?.avatar,
          owner:getCharOwner(ch.id),
          content:curPub?curPub.content:String(chPub??initPages[0]?.content??''),
          updatedAt:curPub?curPub.updatedAt:(ch.updatedAt||initPages[0]?.updatedAt||''),
          pages:initPages
        });
      }
    });
    saveRegistryLocal();
  }catch(err){
    CLOUD.error='Server-Endpunkt (/.netlify/functions/sheets) noch nicht erreichbar. Sobald das Projekt auf Netlify veröffentlicht ist, erscheinen hier alle Charakterbögen der Gruppe.';
    if(!silent) toast('Cloud-Lobby lokal nicht erreichbar (erst auf Netlify aktiv).');
  }finally{
    CLOUD.loading=false;
    if(UI.inLobby){hooks.renderHeader?.();hooks.renderMain?.();}
  }
}
export function canWriteCurrentSheetToCloud(){
  if(CLOUD.viewingRemote||!S) return false;
  const cid=String(S.charId||'').trim();
  if(!cid) return true;
  const existingOwner=getCharOwner(cid);
  if(!existingOwner) return true;
  if(CLOUD.isAdmin) return true;
  const curCampForAuth=getCharCampaignId(cid);
  const isCampGMAuth=Boolean(curCampForAuth&&curCampForAuth!=='default'&&canManageCampaign(curCampForAuth,CLOUD.currentUser));
  if(isCampGMAuth) return true;
  return Boolean(CLOUD.currentUser&&existingOwner.toLowerCase()===CLOUD.currentUser.toLowerCase());
}
export function computeCharMetaSignature(st=S){
  if(!st) return '';
  const cid=String(st.charId||'').trim();
  const nm=String(st.profile?.name||'').trim();
  const av=String(st.profile?.avatar||'');
  const avSig=av?`${av.length}:${simpleHash(av)}:${fastHash2(av)}`:'';
  const own=String(st.owner||'').trim();
  const camp=String(st.campaignId||'default').trim()||'default';
  const pubPages=Array.isArray(st.campaignNotes)
    ?st.campaignNotes.filter(n=>Boolean(n&&n.isPublic)).map(n=>`${n.id||''}\x1f${n.title||''}\x1f${n.content||''}`)
    :[];
  const raw=`${cid}\x1e${nm}\x1e${avSig}\x1e${own}\x1e${camp}\x1e${pubPages.join('\x1d')}`;
  return `${raw.length}:${simpleHash(raw)}:${fastHash2(raw)}`;
}
export function resetCloudSyncState(opts={}){
  clearTimeout(CLOUD_SYNC.debounceTimer);
  CLOUD_SYNC.debounceTimer=null;
  clearTimeout(CLOUD_SYNC.retryTimer);
  CLOUD_SYNC.retryTimer=null;
  clearTimeout(cloudSyncTimer);
  cloudSyncTimer=null;
  CLOUD_SYNC.dirty=false;
  CLOUD_SYNC.retryStep=0;
  CLOUD_SYNC.pendingSilent=true;
  CLOUD_SYNC.pendingForceRegistry=false;
  CLOUD_SYNC.lastError='';
  CLOUD_SYNC.status=opts.status||'saved';
  if(opts.clearMeta){
    CLOUD_SYNC.lastMetaCharId='';
    CLOUD_SYNC.lastMetaSig='';
  }else if(opts.metaCharId!==undefined){
    CLOUD_SYNC.lastMetaCharId=String(opts.metaCharId||'');
    CLOUD_SYNC.lastMetaSig=String(opts.metaSig||'');
  }
  if(opts.lastSyncTs!==undefined) CLOUD.lastSyncTs=String(opts.lastSyncTs||'');
  CLOUD.error='';
  updateCloudSyncStatusDOM();
}
export function getCloudSyncBadgeInfo(){
  const isOffline=(typeof navigator!=='undefined'&&navigator.onLine===false);
  const canWrite=canWriteCurrentSheetToCloud();
  if(!canWrite){
    const own=getCharOwner(S.charId);
    return {
      state:'readonly',
      icon:'🔒',
      text:'',
      tip:own
        ?`Nur lokal gesichert (Bogen gehört „${own}“ – keine Server-Schreibrechte)`
        :'Nur lokal gesichert (keine Server-Schreibrechte)',
      aria:'Keine Schreibberechtigung für Server-Synchronisation',
      cls:'btn h-8 sm:h-9 w-8 sm:w-9 p-0 text-sm shrink-0 opacity-65 bdr-line cursor-default'
    };
  }
  if(CLOUD.syncing||CLOUD_SYNC.inFlight){
    return {
      state:'saving',
      icon:'⏳',
      text:'Speichert…',
      tip:'Änderungen werden automatisch auf dem Server gespeichert…',
      aria:'Speichert automatisch auf dem Server',
      cls:'btn h-8 sm:h-9 w-8 sm:w-auto sm:px-2 p-0 text-xs font-bold shrink-0 bdr-acc bg-acc-soft text-acc whitespace-nowrap cursor-default'
    };
  }
  if(CLOUD_SYNC.status==='error'||(isOffline&&(CLOUD_SYNC.dirty||CLOUD_SYNC.debounceTimer!==null||CLOUD_SYNC.retryTimer!==null))){
    const reason=isOffline
      ?'Offline – Änderungen lokal gesichert. Automatischer Abgleich sobald wieder online.'
      :(CLOUD_SYNC.lastError||CLOUD.error||'Server nicht erreichbar – Änderungen lokal gesichert.');
    const retryLine=(!isOffline&&CLOUD_SYNC.retryTimer!==null)
      ?'\nAutomatischer Retry aktiv – zum sofortigen Versuch antippen.'
      :'\nZum sofortigen Retry antippen.';
    return {
      state:'error',
      icon:'⚠️',
      text:'',
      tip:`Synchronisation ausstehend\n${reason}${retryLine}`+(CLOUD.lastSyncTs?`\nZuletzt gespeichert: ${CLOUD.lastSyncTs}`:''),
      aria:'Synchronisation ausstehend oder fehlgeschlagen – antippen für sofortigen Retry',
      cls:'btn h-8 sm:h-9 w-8 sm:w-9 p-0 text-sm shrink-0 border-amber-400/70 bg-amber-500/20 text-amber-200 hover:bg-amber-500/30 cursor-pointer'
    };
  }
  if(CLOUD_SYNC.dirty||CLOUD_SYNC.debounceTimer!==null){
    return {
      state:'pending',
      icon:'⏳',
      text:'Speichert…',
      tip:'Änderungen lokal gesichert – automatischer Server-Sync startet gleich…'+(CLOUD.lastSyncTs?`\nZuletzt gespeichert: ${CLOUD.lastSyncTs}`:''),
      aria:'Änderungen ausstehend, speichert automatisch',
      cls:'btn h-8 sm:h-9 w-8 sm:w-auto sm:px-2 p-0 text-xs font-bold shrink-0 bdr-acc bg-acc-soft text-acc opacity-90 whitespace-nowrap cursor-default'
    };
  }
  if(isOffline){
    return {
      state:'offline',
      icon:'⚠️',
      text:'',
      tip:'Offline – Änderungen werden lokal gesichert und bei Verbindung automatisch synchronisiert.\nAntippen für sofortigen Retry.'+(CLOUD.lastSyncTs?`\nZuletzt gespeichert: ${CLOUD.lastSyncTs}`:''),
      aria:'Offline – antippen für sofortigen Retry',
      cls:'btn h-8 sm:h-9 w-8 sm:w-9 p-0 text-sm shrink-0 border-amber-400/70 bg-amber-500/15 text-amber-200 cursor-pointer'
    };
  }
  return {
    state:'saved',
    icon:'☁️',
    text:'',
    tip:CLOUD.lastSyncTs
      ?`Automatisch auf dem Server gespeichert\nZuletzt gespeichert: ${CLOUD.lastSyncTs}`
      :'Automatisches Server-Speichern aktiv',
    aria:CLOUD.lastSyncTs?`Automatisch gespeichert (${CLOUD.lastSyncTs})`:'Automatisches Server-Speichern aktiv',
    cls:'btn h-8 sm:h-9 w-8 sm:w-9 p-0 text-sm shrink-0 bdr-line bg-black/15 opacity-75 hover:opacity-100 cursor-default'
  };
}
export function renderCloudSyncBadgeHtml(){
  const info=getCloudSyncBadgeInfo();
  const txtHtml=info.text?`<span class="hidden sm:inline">${esc(info.text)}</span>`:'';
  return `<button type="button" id="cloudSyncStatus" data-action="cloud-sync-badge" data-sync-state="${info.state}" aria-label="${esc(info.aria)}" data-tip="${esc(info.tip)}" class="${info.cls}">${info.icon}${txtHtml}</button>`;
}
export function updateCloudSyncStatusDOM(){
  const el=$('cloudSyncStatus');
  if(!el) return;
  const info=getCloudSyncBadgeInfo();
  el.dataset.syncState=info.state;
  el.setAttribute('aria-label',info.aria);
  el.dataset.tip=info.tip;
  el.className=info.cls;
  el.innerHTML=info.icon+(info.text?`<span class="hidden sm:inline">${esc(info.text)}</span>`:'');
}
export function scheduleCloudSyncRetry(){
  clearTimeout(CLOUD_SYNC.retryTimer);
  CLOUD_SYNC.retryTimer=null;
  if(CLOUD.viewingRemote||!UI.sheetLoaded||UI.inLobby||!canWriteCurrentSheetToCloud()) return;
  if(typeof navigator!=='undefined'&&navigator.onLine===false){
    updateCloudSyncStatusDOM();
    return;
  }
  const idx=Math.min(CLOUD_SYNC.retryStep,CLOUD_SYNC_RETRY_DELAYS.length-1);
  const delay=CLOUD_SYNC_RETRY_DELAYS[idx];
  CLOUD_SYNC.retryStep=Math.min(CLOUD_SYNC.retryStep+1,CLOUD_SYNC_RETRY_DELAYS.length-1);
  CLOUD_SYNC.retryTimer=setTimeout(()=>{
    CLOUD_SYNC.retryTimer=null;
    if(CLOUD.viewingRemote||!UI.sheetLoaded||UI.inLobby||!canWriteCurrentSheetToCloud()) return;
    if(!CLOUD_SYNC.dirty&&CLOUD_SYNC.status!=='error') return;
    if(CLOUD_SYNC.inFlight) return;
    pushToCloud(true,{fromRetry:true});
  },delay);
  updateCloudSyncStatusDOM();
}
export function scheduleCloudSync(){
  if(CLOUD.viewingRemote||!UI.sheetLoaded||UI.inLobby||!canWriteCurrentSheetToCloud()) return;
  CLOUD_SYNC.seq++;
  CLOUD_SYNC.dirty=true;
  CLOUD_SYNC.retryStep=0;
  clearTimeout(CLOUD_SYNC.retryTimer);
  CLOUD_SYNC.retryTimer=null;
  clearTimeout(CLOUD_SYNC.debounceTimer);
  CLOUD_SYNC.debounceTimer=null;
  if(CLOUD_SYNC.inFlight){
    updateCloudSyncStatusDOM();
    return;
  }
  if(typeof navigator!=='undefined'&&navigator.onLine===false){
    CLOUD_SYNC.status='error';
    CLOUD_SYNC.lastError='Offline – keine Netzwerkverbindung.';
    updateCloudSyncStatusDOM();
    return;
  }
  CLOUD_SYNC.status='pending';
  updateCloudSyncStatusDOM();
  CLOUD_SYNC.debounceTimer=setTimeout(()=>{
    CLOUD_SYNC.debounceTimer=null;
    if(CLOUD.viewingRemote||!UI.sheetLoaded||UI.inLobby||!canWriteCurrentSheetToCloud()) return;
    if(!CLOUD_SYNC.dirty) return;
    pushToCloud(true,{fromDebounce:true});
  },CLOUD_SYNC_DEBOUNCE_MS);
}
export function buildCloudPushSnapshot(opts={}){
  if(!S.charId) S.charId=uid();
  const existingOwner=getCharOwner(S.charId);
  const curCampForAuth=getCharCampaignId(S.charId);
  const isCampGMAuth=Boolean(curCampForAuth&&curCampForAuth!=='default'&&canManageCampaign(curCampForAuth,CLOUD.currentUser));
  if(existingOwner&&!CLOUD.isAdmin&&!isCampGMAuth&&(!CLOUD.currentUser||existingOwner.toLowerCase()!==CLOUD.currentUser.toLowerCase())){
    return {blocked:true,owner:existingOwner};
  }
  if(CLOUD.currentUser&&!existingOwner) S.owner=CLOUD.currentUser;
  else if(existingOwner) S.owner=existingOwner;
  const validCampIds=new Set(getCampaigns().map(c=>c.id));
  if(!CLOUD.registry.charCampaigns||typeof CLOUD.registry.charCampaigns!=='object') CLOUD.registry.charCampaigns={};
  const existingCamp=CLOUD.registry.charCampaigns[S.charId]||S.campaignId||'default';
  S.campaignId=validCampIds.has(existingCamp)?existingCamp:'default';
  CLOUD.registry.charCampaigns[S.charId]=S.campaignId;
  const metaSig=computeCharMetaSignature(S);
  const metaChanged=(CLOUD_SYNC.lastMetaCharId!==S.charId)||(CLOUD_SYNC.lastMetaSig!==metaSig);
  const needRegistryPush=Boolean(opts.forceRegistry||metaChanged);
  const nowTs=stamp();
  const pubNote=(S.campaignNotes||[]).find(n=>n&&(n.id==='cn_public'||n.isPublic));
  const pubNoteContent=String(pubNote?.content||'');
  const pubPages=extractPublicPages(S.campaignNotes,'',pubNote?.updatedAt||nowTs);
  if(needRegistryPush){
    if(S.owner) CLOUD.registry.claims[S.charId]=S.owner;
    upsertPublicNoteEntry(S.charId,{campaignId:S.campaignId,charName:S.profile.name||'Unbenannter Held',avatar:S.profile.avatar||'',owner:S.owner||CLOUD.currentUser||'',content:pubNoteContent,updatedAt:pubNote?.updatedAt||nowTs,pages:pubPages});
  }
  const M=calcActiveMods();
  const payload={...S,cloudAutoSync:true,campaignId:S.campaignId,_AdminOverride:CLOUD.isAdmin,_summary:{owner:S.owner||'',campaignId:S.campaignId,lpMax:getLpMax(M),mlpMax:getMlpMax(M),apMax:getApMax(M),mapMax:getMapMax(M),ini:getIniTot(M),publicNote:pubNoteContent,publicPages:pubPages,updatedAt:nowTs}};
  const bodyJson=JSON.stringify(payload);
  const byteSize=(typeof Blob!=='undefined')?new Blob([bodyJson]).size:(bodyJson.length*2);
  return {blocked:false,charId:S.charId,charName:S.profile.name||'Charakter',metaSig,needRegistryPush,bodyJson,byteSize};
}
export function sendKeepaliveSnapshot(){
  if(CLOUD.viewingRemote||!canWriteCurrentSheetToCloud()) return false;
  const snap=buildCloudPushSnapshot({forceRegistry:false});
  if(snap.blocked) return false;
  const useKeepalive=snap.byteSize<CLOUD_SYNC_KEEPALIVE_LIMIT;
  CLOUD_SYNC.dirty=false;
  try{
    fetch(getCloudEndpoint(),{method:'POST',headers:{'Content-Type':'application/json'},body:snap.bodyJson,keepalive:useKeepalive}).catch(()=>{});
    return true;
  }catch(e){return false;}
}
export async function pushToCloud(silent=false,opts={}){
  if(CLOUD.viewingRemote){if(!silent)toast('Im Ansichtsmodus gesperrt – übernimm den Bogen zuerst oder kehre zu deinem Charakter zurück.');return false;}
  if(!S.charId) S.charId=uid();
  if(CLOUD_SYNC.inFlight){
    CLOUD_SYNC.dirty=true;
    if(!silent) CLOUD_SYNC.pendingSilent=false;
    if(opts.forceRegistry) CLOUD_SYNC.pendingForceRegistry=true;
    updateCloudSyncStatusDOM();
    return CLOUD_SYNC.inFlightPromise||false;
  }
  clearTimeout(CLOUD_SYNC.debounceTimer);
  CLOUD_SYNC.debounceTimer=null;
  clearTimeout(CLOUD_SYNC.retryTimer);
  CLOUD_SYNC.retryTimer=null;
  const snap=buildCloudPushSnapshot(opts);
  if(snap.blocked){
    if(!silent) toast(`🔒 Dieser Bogen gehört „${snap.owner}“. Bitte als „${snap.owner}“ anmelden.`);
    updateCloudSyncStatusDOM();
    return false;
  }
  const mySeq=CLOUD_SYNC.seq;
  const myCharId=snap.charId;
  const useKeepalive=Boolean(opts.keepalive&&snap.byteSize<CLOUD_SYNC_KEEPALIVE_LIMIT);
  CLOUD_SYNC.inFlight=true;
  CLOUD_SYNC.dirty=false;
  CLOUD_SYNC.pendingSilent=true;
  CLOUD_SYNC.pendingForceRegistry=false;
  CLOUD_SYNC.status='saving';
  CLOUD.syncing=true;
  updateCloudSyncStatusDOM();
  const run=(async()=>{
    let ok=false, registrySynced=!snap.needRegistryPush;
    try{
      if(opts.keepalive){
        const res=await fetch(getCloudEndpoint(),{method:'POST',headers:{'Content-Type':'application/json'},body:snap.bodyJson,keepalive:useKeepalive});
        const data=await res.json().catch(()=>({}));
        if(!res.ok||data.error) throw new Error(data.error||`HTTP ${res.status}`);
        if(snap.needRegistryPush){
          try{await syncCloudRegistry(true);registrySynced=true;}catch(e){}
        }
      }else{
        if(snap.needRegistryPush){
          await syncCloudRegistry(true);
          registrySynced=true;
        }
        const res=await fetch(getCloudEndpoint(),{method:'POST',headers:{'Content-Type':'application/json'},body:snap.bodyJson});
        const data=await res.json().catch(()=>({}));
        if(!res.ok||data.error) throw new Error(data.error||`HTTP ${res.status}`);
      }
      ok=true;
      if(S.charId===myCharId){
        CLOUD_SYNC.syncedSeq=Math.max(CLOUD_SYNC.syncedSeq,mySeq);
        if(registrySynced){
          CLOUD_SYNC.lastMetaCharId=myCharId;
          CLOUD_SYNC.lastMetaSig=snap.metaSig;
        }
        CLOUD_SYNC.retryStep=0;
        CLOUD_SYNC.lastError='';
        CLOUD.lastSyncTs=stamp();
        CLOUD.error='';
        if(!CLOUD_SYNC.dirty&&CLOUD_SYNC.seq===mySeq) CLOUD_SYNC.status='saved';
      }
      if(!silent){
        toast(`☁️ „${snap.charName}“ auf dem Server gespeichert!`);
        if(UI.inLobby) await fetchLobbyList(true);
      }
    }catch(err){
      const msg=String(err?.message||'Synchronisation fehlgeschlagen.');
      if(S.charId===myCharId){
        CLOUD_SYNC.dirty=true;
        CLOUD_SYNC.status='error';
        CLOUD_SYNC.lastError=msg;
        CLOUD.error=msg;
      }
      if(!silent) toast(`⚠️ Cloud-Fehler: ${msg}`);
    }finally{
      CLOUD_SYNC.inFlight=false;
      CLOUD.syncing=false;
      CLOUD_SYNC.inFlightPromise=null;
      updateCloudSyncStatusDOM();
      if(S.charId===myCharId){
        if(!ok){
          scheduleCloudSyncRetry();
        }else if(CLOUD_SYNC.dirty&&!CLOUD.viewingRemote&&canWriteCurrentSheetToCloud()&&(typeof navigator==='undefined'||navigator.onLine!==false)){
          const nextSilent=CLOUD_SYNC.pendingSilent;
          const nextForceReg=CLOUD_SYNC.pendingForceRegistry;
          CLOUD_SYNC.pendingSilent=true;
          CLOUD_SYNC.pendingForceRegistry=false;
          setTimeout(()=>{
            if(CLOUD_SYNC.dirty&&!CLOUD_SYNC.inFlight&&S.charId===myCharId&&!CLOUD.viewingRemote&&canWriteCurrentSheetToCloud()){
              pushToCloud(nextSilent,{forceRegistry:nextForceReg,fromFollowUp:true});
            }
          },0);
        }
      }
    }
    return ok;
  })();
  CLOUD_SYNC.inFlightPromise=run;
  return run;
}
export async function flushCloudSyncNow(opts={}){
  flushPendingSave(false);
  if(CLOUD.viewingRemote) return false;
  if(!canWriteCurrentSheetToCloud()) return false;
  const silent=opts.silent!==false;
  const force=Boolean(opts.force);
  const keepalive=Boolean(opts.keepalive);
  const forceRegistry=Boolean(opts.forceRegistry);
  clearTimeout(CLOUD_SYNC.debounceTimer);
  CLOUD_SYNC.debounceTimer=null;
  clearTimeout(CLOUD_SYNC.retryTimer);
  CLOUD_SYNC.retryTimer=null;
  if(!force&&!CLOUD_SYNC.dirty&&!CLOUD_SYNC.inFlight&&CLOUD_SYNC.status!=='error'){
    return true;
  }
  if(CLOUD_SYNC.inFlight){
    if(keepalive&&CLOUD_SYNC.dirty){
      return sendKeepaliveSnapshot();
    }
    if(force||CLOUD_SYNC.dirty){
      CLOUD_SYNC.dirty=true;
      if(!silent) CLOUD_SYNC.pendingSilent=false;
      if(forceRegistry) CLOUD_SYNC.pendingForceRegistry=true;
    }
    const waitCur=CLOUD_SYNC.inFlightPromise;
    if(waitCur){
      if(opts.maxWaitMs>0) await Promise.race([waitCur,new Promise(r=>setTimeout(r,opts.maxWaitMs))]);
      else await waitCur;
    }
    if(CLOUD_SYNC.dirty&&!CLOUD_SYNC.inFlight&&!keepalive&&canWriteCurrentSheetToCloud()){
      const followP=pushToCloud(silent,{forceRegistry,fromFlush:true});
      if(opts.maxWaitMs>0) await Promise.race([followP,new Promise(r=>setTimeout(r,opts.maxWaitMs))]);
      else await followP;
    }else if(CLOUD_SYNC.inFlight&&CLOUD_SYNC.inFlightPromise){
      if(opts.maxWaitMs>0) await Promise.race([CLOUD_SYNC.inFlightPromise,new Promise(r=>setTimeout(r,opts.maxWaitMs))]);
      else await CLOUD_SYNC.inFlightPromise;
    }
    return CLOUD_SYNC.status==='saved';
  }
  const runP=pushToCloud(silent,{keepalive,forceRegistry,fromFlush:true});
  if(opts.maxWaitMs>0) await Promise.race([runP,new Promise(r=>setTimeout(r,opts.maxWaitMs))]);
  else await runP;
  return CLOUD_SYNC.status==='saved';
}
export async function flushBeforeCharacterSwitch(){
  flushPendingSave(false);
  if(!CLOUD.viewingRemote&&UI.sheetLoaded&&!UI.inLobby&&canWriteCurrentSheetToCloud()){
    if(CLOUD_SYNC.dirty||CLOUD_SYNC.debounceTimer!==null||CLOUD_SYNC.inFlight||CLOUD_SYNC.status==='error'){
      await flushCloudSyncNow({silent:true,maxWaitMs:3500});
    }
  }
}
export async function loadCloudCharacter(id,asViewOnly=true,autoFallbackView=false){
  try{
    if(UI.sheetLoaded&&!UI.inLobby&&!CLOUD.viewingRemote&&(id!==S.charId||asViewOnly)){
      await flushBeforeCharacterSwitch();
    }
    const url=`${getCloudEndpoint()}?id=${encodeURIComponent(id)}`;
    const res=await fetch(url,{headers:{'Accept':'application/json'}});
    const data=await res.json();
    if(!res.ok||data.error){if(!autoFallbackView)toast(`⚠️ ${data.error||'Charakter konnte nicht geladen werden.'}`);return;}
    const owner=getCharOwner(id)||String(data.owner||data._summary?.owner||'').trim();
    const charCampId=getCharCampaignId(id);
    const isCampGM=charCampId&&charCampId!=='default'&&canManageCampaign(charCampId,CLOUD.currentUser);
    const isOwner=Boolean(owner&&CLOUD.currentUser&&owner.toLowerCase()===CLOUD.currentUser.toLowerCase());
    const allowedToEdit=Boolean(CLOUD.isAdmin||isOwner||isCampGM||!owner);
    if(!asViewOnly&&autoFallbackView&&!allowedToEdit){
      asViewOnly=true;
    }
    if(asViewOnly){
      CLOUD.viewingRemote=true; CLOUD.remoteCharId=id;
      mergeLoaded(data);
      resetCloudSyncState({clearMeta:true,status:'saved',lastSyncTs:data._summary?.updatedAt||''});
      UI.inLobby=false; UI.sheetLoaded=true; UI.modal=null; hooks.exitLobbyNeutralDice?.(); hooks.renderAll?.(false);
      toast(`👁️ 👄 👁️ Ansichtsmodus: „${S.profile.name||'Charakter'}“ geladen`);
    }else{
      if(owner&&!allowedToEdit){
        toast(`🔒 Dieser Charakter gehört „${owner}“. Bitte als „${owner}“ anmelden.`);
        return;
      }
      CLOUD.viewingRemote=false; CLOUD.remoteCharId='';
      mergeLoaded(data);
      S.activeTab=getSavedTabForChar(S.charId,data.activeTab);
      saveLastActiveTab(S.charId,S.activeTab);
      if(owner&&!S.owner) S.owner=owner;
      resetCloudSyncState({status:'saved',metaCharId:S.charId,metaSig:computeCharMetaSignature(S),lastSyncTs:data._summary?.updatedAt||stamp()});
      UI.inLobby=false; UI.sheetLoaded=true; UI.modal=null; hooks.exitLobbyNeutralDice?.(); hooks.renderAll?.(false);
      toast(`✏️ „${S.profile.name||'Charakter'}“ zum Bearbeiten geladen!`);
    }
  }catch(err){
    toast('⚠️ Verbindung zur Cloud-Lobby fehlgeschlagen.');
  }
}
export async function createNewUserCharacter(opts={}){
  if(!CLOUD.currentUser){
    toast('🔒 Charaktererstellung ist nur für angemeldete Spieler-Accounts möglich. Bitte melde dich zuerst an!');
    return;
  }
  await flushBeforeCharacterSwitch();
  const allowedCamps=getCreatableCampaigns(CLOUD.currentUser);
  const reqCamp=String(opts.campaignId??CLOUD.newCharCampId??CLOUD.activeCampaignId??'default').trim()||'default';
  const targetCampId=allowedCamps.some(c=>c.id===reqCamp)?reqCamp:'default';
  CLOUD.viewingRemote=false; CLOUD.remoteCharId='';
  setS(defaultState());
  applySessionTheme({allowSheetFallback:false,forSheet:true});
  S.profile.name=String(opts.name??CLOUD.newCharName??'').trim();
  S.profile.ancestry=String(opts.ancestry??CLOUD.newCharAncestry??'').trim();
  S.profile.concept=String(opts.concept??CLOUD.newCharConcept??'').trim();
  S.owner=CLOUD.currentUser;
  S.campaignId=targetCampId;
  S.cloudAutoSync=true;
  CLOUD.registry.claims[S.charId]=CLOUD.currentUser;
  if(!CLOUD.registry.charCampaigns||typeof CLOUD.registry.charCampaigns!=='object') CLOUD.registry.charCampaigns={};
  CLOUD.registry.charCampaigns[S.charId]=targetCampId;
  CLOUD.newCharOpen=false; CLOUD.newCharName=''; CLOUD.newCharAncestry=''; CLOUD.newCharConcept='';
  setActiveCampaign(targetCampId);
  resetCloudSyncState({clearMeta:true,status:'pending',lastSyncTs:''});
  UI.inLobby=false; UI.sheetLoaded=true; UI.modal=null; hooks.exitLobbyNeutralDice?.();
  hooks.renderAll?.(false);
  await pushToCloud(false,{forceRegistry:true});
}
export async function updateCloudCharacterMeta(id,mutatorFn,successMsg){
  if(!CLOUD.registry.publicNotes||typeof CLOUD.registry.publicNotes!=='object') CLOUD.registry.publicNotes={};
  if(CLOUD.registry.publicNotes[id]){
    upsertPublicNoteEntry(id,{campaignId:getCharCampaignId(id),owner:getCharOwner(id)});
  }
  saveRegistryLocal();
  if(UI.inLobby){hooks.renderHeader?.();hooks.renderMain?.();}
  try{
    const url=`${getCloudEndpoint()}?id=${encodeURIComponent(id)}`;
    const res=await fetch(url,{headers:{'Accept':'application/json'}});
    if(res.ok){
      const data=await res.json();
      if(data&&!data.error){
        mutatorFn(data);
        const curPub=CLOUD.registry.publicNotes?.[id];
        const pNote=(data.campaignNotes||[]).find(n=>n&&(n.id==='cn_public'||n.isPublic));
        const pContent=String(pNote?.content??data._summary?.publicNote??curPub?.content??'');
        const pUpdatedAt=pNote?.updatedAt||curPub?.updatedAt||stamp();
        const pPages=(Array.isArray(data.campaignNotes)&&data.campaignNotes.length)
          ?extractPublicPages(data.campaignNotes,pContent,pUpdatedAt)
          :(Array.isArray(curPub?.pages)&&curPub.pages.length
            ?curPub.pages
            :(Array.isArray(data._summary?.publicPages)&&data._summary.publicPages.length
              ?data._summary.publicPages
              :extractPublicPages(null,pContent,pUpdatedAt)));
        if(!data._summary) data._summary={};
        data._summary.publicNote=pContent;
        data._summary.publicPages=pPages;
        upsertPublicNoteEntry(id,{
          campaignId:String(data.campaignId||CLOUD.registry.charCampaigns?.[id]||'default'),
          charName:data.profile?.name,
          avatar:data.profile?.avatar||curPub?.avatar||'',
          owner:String(data.owner??CLOUD.registry.claims?.[id]??''),
          content:pContent,
          updatedAt:pUpdatedAt,
          pages:pPages
        });
        if(CLOUD.isAdmin) data._AdminOverride=true;
        await fetch(getCloudEndpoint(),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});
      }
    }
    await syncCloudRegistry(true);
    await fetchLobbyList(true);
    if(UI.inLobby){hooks.renderHeader?.();hooks.renderMain?.();}
    if(successMsg) toast(successMsg);
  }catch(err){
    await syncCloudRegistry(true);
    if(UI.inLobby){hooks.renderHeader?.();hooks.renderMain?.();}
    if(successMsg) toast(successMsg);
  }
}
export async function deleteCloudCharacter(id){
  try{
    const owner=getCharOwner(id);
    const allowed=canManageChar(id);
    if(owner&&!allowed){
      toast(`🔒 Nur „${owner}“, der Kampagnen-Spielleiter oder der Admin kann diesen Charakter löschen.`);
      return;
    }
    const url=`${getCloudEndpoint()}?id=${encodeURIComponent(id)}`;
    const res=await fetch(url,{method:'DELETE'});
    await res.json().catch(()=>({}));
    if(!Array.isArray(CLOUD.registry.deletedCharIds)) CLOUD.registry.deletedCharIds=[];
    if(id&&!CLOUD.registry.deletedCharIds.includes(id)) CLOUD.registry.deletedCharIds.push(id);
    archiveCharPublicNotesToCampaign(id);
    if(CLOUD.registry.publicNotes) delete CLOUD.registry.publicNotes[id];
    delete CLOUD.registry.claims[id];
    if(CLOUD.registry.charCampaigns) delete CLOUD.registry.charCampaigns[id];
    CLOUD.list=(CLOUD.list||[]).filter(c=>c&&c.id!==id);
    await syncCloudRegistry(true);
    CLOUD.confirmDelCloudId=null;
    toast('🗑️ Charakter aus der Lobby entfernt.');
    await fetchLobbyList(true);
  }catch(err){
    toast('⚠️ Löschen fehlgeschlagen.');
  }
}
export function normalizeLibraryPack(raw,origin='repo'){
  if(!raw||typeof raw!=='object') return null;
  const sections=Array.isArray(raw.sections)?raw.sections:(Array.isArray(raw.powerSections)?raw.powerSections:[]);
  const powers=Array.isArray(raw.powers)?raw.powers:[];
  const augments=Array.isArray(raw.augments)?raw.augments:[];
  const name=String(raw.name||raw.title||'Unbenanntes Paket').trim()||'Unbenanntes Paket';
  const rawId=String(raw.id||'').trim();
  const id=rawId||('pack_'+simpleHash(`${origin}_${name}_${sections.length}_${powers.length}_${augments.length}`));
  return {
    schema:String(raw.schema||POWER_PACK_SCHEMA),
    id,
    name,
    category:String(raw.category||'Allgemein').trim()||'Allgemein',
    description:String(raw.description||''),
    isBasisPack:Boolean(raw.isBasisPack||id.toLowerCase()==='basisaktionen'),
    updatedAt:String(raw.updatedAt||''),
    sections,
    powers,
    augments,
    _origin:origin==='cloud'?'cloud':'repo'
  };
}
export function stripLibraryPackMeta(pack){
  if(!pack||typeof pack!=='object') return pack;
  const copy=clone(pack);
  delete copy._origin;
  return copy;
}
export function extractLibraryPacks(data,origin='repo'){
  if(!data||typeof data!=='object') return [];
  let rawList=[];
  if(Array.isArray(data)){
    rawList=data;
  }else if(Array.isArray(data.packs)){
    rawList=data.packs;
  }else if(Array.isArray(data.library?.packs)){
    rawList=data.library.packs;
  }else if(origin==='repo'&&(data.schema===POWER_PACK_SCHEMA||Array.isArray(data.sections)||Array.isArray(data.powerSections)||Array.isArray(data.powers)||Array.isArray(data.augments))){
    rawList=[data];
  }
  return rawList.map(p=>normalizeLibraryPack(p,origin)).filter(Boolean);
}
export function savePowerLibraryCache(){
  try{
    localStorage.setItem(PWLIB_CACHE_KEY,JSON.stringify({
      repoPacks:PWLIB.repoPacks||[],
      cloudPacks:PWLIB.cloudPacks||[],
      lastLoadedTs:PWLIB.lastLoadedTs||stamp()
    }));
  }catch(e){}
}
export function loadPowerLibraryCache(){
  try{
    const raw=localStorage.getItem(PWLIB_CACHE_KEY);
    if(!raw) return null;
    const parsed=JSON.parse(raw);
    if(!parsed||typeof parsed!=='object') return null;
    return {
      repoPacks:Array.isArray(parsed.repoPacks)?parsed.repoPacks.map(p=>normalizeLibraryPack(p,'repo')).filter(Boolean):[],
      cloudPacks:Array.isArray(parsed.cloudPacks)?parsed.cloudPacks.map(p=>normalizeLibraryPack(p,'cloud')).filter(Boolean):[],
      lastLoadedTs:String(parsed.lastLoadedTs||'')
    };
  }catch(e){return null;}
}
export function getAllLibraryPacks(){
  const merged=new Map();
  (PWLIB.repoPacks||[]).forEach(p=>{
    const norm=normalizeLibraryPack(p,'repo');
    if(norm) merged.set(norm.id,norm);
  });
  (PWLIB.cloudPacks||[]).forEach(p=>{
    const norm=normalizeLibraryPack(p,'cloud');
    if(norm) merged.set(norm.id,norm);
  });
  return [...merged.values()];
}
export function canPublishPowerLibrary(){
  if(CLOUD.isAdmin) return true;
  const u=String(CLOUD.currentUser||'').trim().toLowerCase();
  if(!u) return false;
  if(isGlobalGM(u)) return true;
  return getCampaigns().some(c=>c&&c.id!=='default'&&Array.isArray(c.gmUsers)&&c.gmUsers.some(x=>String(x||'').trim().toLowerCase()===u));
}
export async function fetchPowerLibrary(force=false){
  if(PWLIB.loaded&&!force) return getAllLibraryPacks();
  if(pwLibFetchPromise&&!force) return pwLibFetchPromise;
  const run=(async()=>{
    PWLIB.loading=true;
    PWLIB.error='';
    if(UI.modal==='powerLibrary') hooks.renderModal?.();
    try{
      const repoReq=fetch(`${REPO_LIBRARY_URL}?t=${Date.now()}`,{headers:{'Accept':'application/json'}}).then(async res=>{
        if(res.status===404) return [];
        if(!res.ok) throw new Error(`Repo HTTP ${res.status}`);
        const data=await res.json();
        return extractLibraryPacks(data,'repo');
      });
      const cloudReq=fetch(`${getCloudEndpoint()}?id=${encodeURIComponent(LIBRARY_ID)}`,{headers:{'Accept':'application/json'}}).then(async res=>{
        if(res.status===404) return [];
        if(!res.ok) throw new Error(`Cloud HTTP ${res.status}`);
        const data=await res.json();
        if(data&&data.error&&/not\s*found|nicht\s*gefunden/i.test(String(data.error))) return [];
        return extractLibraryPacks(data,'cloud');
      });
      const [repoRes,cloudRes]=await Promise.allSettled([repoReq,cloudReq]);
      const repoOk=repoRes.status==='fulfilled';
      const cloudOk=cloudRes.status==='fulfilled';
      const cache=(!repoOk||!cloudOk)?loadPowerLibraryCache():null;
      if(repoOk){
        PWLIB.repoPacks=repoRes.value;
      }else if(cache&&cache.repoPacks.length&&!PWLIB.repoPacks.length){
        PWLIB.repoPacks=cache.repoPacks;
      }
      if(cloudOk){
        PWLIB.cloudPacks=cloudRes.value;
      }else if(cache&&cache.cloudPacks.length&&!PWLIB.cloudPacks.length){
        PWLIB.cloudPacks=cache.cloudPacks;
      }
      if(repoOk||cloudOk){
        PWLIB.loaded=true;
        PWLIB.lastLoadedTs=stamp();
        PWLIB.error='';
        savePowerLibraryCache();
      }else if(cache&&(cache.repoPacks.length||cache.cloudPacks.length)){
        PWLIB.repoPacks=cache.repoPacks;
        PWLIB.cloudPacks=cache.cloudPacks;
        PWLIB.loaded=true;
        PWLIB.lastLoadedTs=cache.lastLoadedTs||PWLIB.lastLoadedTs;
        PWLIB.error='Offline-Modus: Lokaler Bibliotheks-Cache wird angezeigt.';
      }else{
        PWLIB.loaded=false;
        PWLIB.error='Externe Kräfte-Bibliothek derzeit nicht erreichbar (weder Repo noch Cloud).';
      }
      return getAllLibraryPacks();
    }finally{
      PWLIB.loading=false;
      if(pwLibFetchPromise===run) pwLibFetchPromise=null;
      if(UI.modal==='powerLibrary') hooks.renderModal?.();
    }
  })();
  pwLibFetchPromise=run;
  return run;
}
export async function publishPackToCloudLibrary(pack){
  if(!canPublishPowerLibrary()){
    toast('🔒 Nur Admin oder Spielleiter können Pakete in der Server-Bibliothek veröffentlichen.');
    return false;
  }
  if(!pack||typeof pack!=='object'){
    toast('⚠️ Ungültiges Kräfte-Paket zum Veröffentlichen.');
    return false;
  }
  PWLIB.saving=true;
  PWLIB.error='';
  if(UI.modal==='powerLibrary') hooks.renderModal?.();
  try{
    let currentPacks=[];
    const getRes=await fetch(`${getCloudEndpoint()}?id=${encodeURIComponent(LIBRARY_ID)}`,{headers:{'Accept':'application/json'}});
    if(getRes.ok){
      const rem=await getRes.json().catch(()=>null);
      if(rem&&!rem.error) currentPacks=extractLibraryPacks(rem,'cloud').map(stripLibraryPackMeta);
    }else if(getRes.status!==404){
      throw new Error(`HTTP ${getRes.status}`);
    }
    const rawCopy=clone(pack);
    rawCopy.id=String(rawCopy.id||'').trim()||uid();
    rawCopy.updatedAt=stamp();
    const normPack=normalizeLibraryPack(rawCopy,'cloud');
    const cleanPack=stripLibraryPackMeta(normPack);
    const idx=currentPacks.findIndex(p=>p&&p.id===cleanPack.id);
    const wasUpdate=idx>=0;
    if(wasUpdate) currentPacks[idx]=cleanPack;
    else currentPacks.push(cleanPack);
    const payload={
      charId:LIBRARY_ID,
      profile:{name:'__POWER_LIBRARY__'},
      packs:currentPacks,
      _summary:{updatedAt:stamp()}
    };
    const postRes=await fetch(getCloudEndpoint(),{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify(payload)
    });
    const postData=await postRes.json().catch(()=>({}));
    if(!postRes.ok||postData.error) throw new Error(postData.error||`HTTP ${postRes.status}`);
    PWLIB.cloudPacks=currentPacks.map(p=>normalizeLibraryPack(p,'cloud')).filter(Boolean);
    PWLIB.loaded=true;
    PWLIB.lastLoadedTs=stamp();
    PWLIB.error='';
    savePowerLibraryCache();
    toast(`☁️ Paket „${cleanPack.name}“ in der Server-Bibliothek ${wasUpdate?'aktualisiert':'veröffentlicht'}!`);
    return true;
  }catch(err){
    PWLIB.error=String(err?.message||'Veröffentlichung fehlgeschlagen.');
    toast(`⚠️ Veröffentlichung fehlgeschlagen: ${PWLIB.error}`);
    return false;
  }finally{
    PWLIB.saving=false;
    if(UI.modal==='powerLibrary') hooks.renderModal?.();
  }
}
export async function deletePackFromCloudLibrary(packId){
  if(!CLOUD.isAdmin){
    toast('🔒 Nur der Admin kann Pakete aus der Server-Bibliothek entfernen.');
    return false;
  }
  const pid=String(packId||'').trim();
  if(!pid) return false;
  PWLIB.saving=true;
  PWLIB.error='';
  if(UI.modal==='powerLibrary') hooks.renderModal?.();
  try{
    let currentPacks=[];
    const getRes=await fetch(`${getCloudEndpoint()}?id=${encodeURIComponent(LIBRARY_ID)}`,{headers:{'Accept':'application/json'}});
    if(getRes.ok){
      const rem=await getRes.json().catch(()=>null);
      if(rem&&!rem.error) currentPacks=extractLibraryPacks(rem,'cloud').map(stripLibraryPackMeta);
    }else if(getRes.status!==404){
      throw new Error(`HTTP ${getRes.status}`);
    }
    const removed=currentPacks.find(p=>p&&p.id===pid);
    const nextPacks=currentPacks.filter(p=>p&&p.id!==pid);
    const payload={
      charId:LIBRARY_ID,
      profile:{name:'__POWER_LIBRARY__'},
      packs:nextPacks,
      _summary:{updatedAt:stamp()}
    };
    const postRes=await fetch(getCloudEndpoint(),{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify(payload)
    });
    const postData=await postRes.json().catch(()=>({}));
    if(!postRes.ok||postData.error) throw new Error(postData.error||`HTTP ${postRes.status}`);
    PWLIB.cloudPacks=nextPacks.map(p=>normalizeLibraryPack(p,'cloud')).filter(Boolean);
    if(PWLIB.selectedPackId===pid) PWLIB.selectedPackId='';
    if(PWLIB.openPacks) delete PWLIB.openPacks[pid];
    PWLIB.lastLoadedTs=stamp();
    PWLIB.error='';
    savePowerLibraryCache();
    toast(`🗑️ Paket „${removed?.name||pid}“ aus der Server-Bibliothek entfernt.`);
    return true;
  }catch(err){
    PWLIB.error=String(err?.message||'Entfernen fehlgeschlagen.');
    toast(`⚠️ Löschen fehlgeschlagen: ${PWLIB.error}`);
    return false;
  }finally{
    PWLIB.saving=false;
    if(UI.modal==='powerLibrary') hooks.renderModal?.();
  }
}
export function parsePatchnoteTsMs(tsStr, fallbackMs = 0){
  const s=String(tsStr||'').trim();
  if(s){
    const m=s.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})(?:[,\s]+(\d{1,2}):(\d{2})(?::(\d{2}))?)?/);
    if(m){
      const day=parseInt(m[1],10), month=parseInt(m[2],10), year=parseInt(m[3],10);
      const hh=m[4]!==undefined?parseInt(m[4],10):0;
      const mm=m[5]!==undefined?parseInt(m[5],10):0;
      const ss=m[6]!==undefined?parseInt(m[6],10):0;
      const ms=new Date(year,month-1,day,hh,mm,ss).getTime();
      if(!Number.isNaN(ms)) return ms;
    }
    const parsed=Date.parse(s);
    if(!Number.isNaN(parsed)) return parsed;
  }
  return toInt(fallbackMs,0);
}
export function getSortedPatchnoteEntries(list=PATCHNOTES.entries, order=PATCHNOTES.sortOrder){
  const arr=Array.isArray(list)?list:[];
  const dir=order==='asc'?'asc':'desc';
  return arr.map((e,origIdx)=>({e,origIdx,ms:parsePatchnoteTsMs(e?.ts,e?.tsMs)})).sort((a,b)=>{
    const diff=dir==='asc'?(a.ms-b.ms):(b.ms-a.ms);
    return diff!==0?diff:(a.origIdx-b.origIdx);
  }).map(x=>x.e);
}
export function getNewestPatchnoteId(list=PATCHNOTES.entries){
  const desc=getSortedPatchnoteEntries(list,'desc');
  return desc.length&&desc[0]?.id?String(desc[0].id):'';
}
export function isPatchnoteCollapsed(e, newestId='', edId=null){
  if(!e||!e.id) return false;
  const map=(PATCHNOTES.collapsedIds&&typeof PATCHNOTES.collapsedIds==='object')?PATCHNOTES.collapsedIds:{};
  if(Object.prototype.hasOwnProperty.call(map,e.id)) return Boolean(map[e.id]);
  if(edId&&e.id===edId) return false;
  const topId=newestId||getNewestPatchnoteId();
  return e.id!==topId;
}
export function normalizePatchnoteEntry(raw){
  if(!raw||typeof raw!=='object') return null;
  const items=Array.isArray(raw.items)?raw.items.filter(it=>it&&typeof it==='object').map(it=>({
    id:String(it.id||'').trim()||uid(),
    heading:String(it.heading??''),
    text:String(it.text??'')
  })):[];
  const ts=String(raw.ts||raw.date||raw.createdAt||'').trim()||stamp();
  return {
    id:String(raw.id||'').trim()||uid(),
    title:String(raw.title??'').trim(),
    version:String(raw.version??'').trim(),
    ts,
    tsMs:parsePatchnoteTsMs(ts,toInt(raw.tsMs,0)),
    updatedAt:String(raw.updatedAt||ts).trim(),
    intro:String(raw.intro??''),
    items
  };
}
export function loadPatchnotesCache(){
  try{
    const raw=localStorage.getItem(PATCHNOTES_CACHE_KEY);
    if(!raw) return null;
    const parsed=JSON.parse(raw);
    if(!parsed||typeof parsed!=='object') return null;
    return {
      entries:Array.isArray(parsed.entries)?parsed.entries.map(normalizePatchnoteEntry).filter(Boolean):[],
      lastLoadedTs:String(parsed.lastLoadedTs||'')
    };
  }catch(e){return null;}
}
export function savePatchnotesCache(){
  try{
    localStorage.setItem(PATCHNOTES_CACHE_KEY,JSON.stringify({
      entries:Array.isArray(PATCHNOTES.entries)?PATCHNOTES.entries:[],
      lastLoadedTs:PATCHNOTES.lastLoadedTs||stamp()
    }));
  }catch(e){}
}
export async function fetchPatchnotes(force=false){
  if((PATCHNOTES.loaded||PATCHNOTES.loading)&&!force) return PATCHNOTES.entries;
  PATCHNOTES.loading=true;
  PATCHNOTES.error='';
  if(UI.modal==='info'&&UI.infoTab==='patchnotes') hooks.renderModal?.();
  try{
    const res=await fetch(`${getCloudEndpoint()}?id=${encodeURIComponent(PATCHNOTES_ID)}`,{headers:{'Accept':'application/json'}});
    if(res.status===404){
      PATCHNOTES.entries=[];
      PATCHNOTES.loaded=true;
      PATCHNOTES.lastLoadedTs=stamp();
      PATCHNOTES.error='';
      savePatchnotesCache();
      return PATCHNOTES.entries;
    }
    if(!res.ok) throw new Error(`HTTP ${res.status}`);
    const data=await res.json().catch(()=>null);
    if(data&&data.error&&/not\s*found|nicht\s*gefunden/i.test(String(data.error))){
      PATCHNOTES.entries=[];
      PATCHNOTES.loaded=true;
      PATCHNOTES.lastLoadedTs=stamp();
      PATCHNOTES.error='';
      savePatchnotesCache();
      return PATCHNOTES.entries;
    }
    const rawList=Array.isArray(data?.entries)?data.entries:(Array.isArray(data?.patchnotes?.entries)?data.patchnotes.entries:(Array.isArray(data)?data:[]));
    PATCHNOTES.entries=rawList.map(normalizePatchnoteEntry).filter(Boolean);
    PATCHNOTES.loaded=true;
    PATCHNOTES.lastLoadedTs=stamp();
    PATCHNOTES.error='';
    savePatchnotesCache();
    return PATCHNOTES.entries;
  }catch(err){
    const cache=loadPatchnotesCache();
    if(cache){
      PATCHNOTES.entries=cache.entries;
      PATCHNOTES.loaded=true;
      PATCHNOTES.lastLoadedTs=cache.lastLoadedTs||PATCHNOTES.lastLoadedTs;
      PATCHNOTES.error='Offline-Modus: Lokaler Patchnotes-Cache wird angezeigt.';
    }else{
      PATCHNOTES.loaded=false;
      PATCHNOTES.error='Patchnotes derzeit nicht vom Server erreichbar.';
    }
    return PATCHNOTES.entries;
  }finally{
    PATCHNOTES.loading=false;
    if(UI.modal==='info'&&UI.infoTab==='patchnotes') hooks.renderModal?.();
    if(typeof updateNotifBadges==='function') updateNotifBadges();
  }
}
export async function savePatchnotesToServer(nextEntries,successMsg){
  if(!CLOUD.isAdmin){
    toast('🔒 Nur der Admin kann Patchnotes bearbeiten.');
    return false;
  }
  const cleaned=(Array.isArray(nextEntries)?nextEntries:[]).map(normalizePatchnoteEntry).filter(Boolean);
  PATCHNOTES.saving=true;
  PATCHNOTES.error='';
  if(UI.modal==='info'&&UI.infoTab==='patchnotes') hooks.renderModal?.();
  try{
    const payload={
      charId:PATCHNOTES_ID,
      profile:{name:'__PATCHNOTES__'},
      _AdminOverride:true,
      entries:cleaned,
      _summary:{updatedAt:stamp()}
    };
    const res=await fetch(getCloudEndpoint(),{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify(payload)
    });
    const data=await res.json().catch(()=>({}));
    if(!res.ok||data.error) throw new Error(data.error||`HTTP ${res.status}`);
    PATCHNOTES.entries=cleaned;
    PATCHNOTES.loaded=true;
    PATCHNOTES.lastLoadedTs=stamp();
    PATCHNOTES.error='';
    savePatchnotesCache();
    toast(successMsg||'☁️ Patchnotes auf dem Server gespeichert!');
    return true;
  }catch(err){
    PATCHNOTES.entries=cleaned;
    PATCHNOTES.loaded=true;
    PATCHNOTES.lastLoadedTs=stamp();
    PATCHNOTES.error='Lokal im Cache gespeichert (Server nicht erreichbar).';
    savePatchnotesCache();
    toast('⚠️ Server nicht erreichbar – Patchnotes lokal im Browser-Cache gespeichert.');
    return true;
  }finally{
    PATCHNOTES.saving=false;
    if(UI.modal==='info'&&UI.infoTab==='patchnotes') hooks.renderModal?.();
    if(typeof updateNotifBadges==='function') updateNotifBadges();
  }
}
export function normalizeFeedbackStore(raw){
  const src=(raw&&typeof raw==='object'&&raw.feedback&&typeof raw.feedback==='object')?raw.feedback:(raw&&typeof raw==='object'?raw:{});
  const rawFolders=Array.isArray(src.folders)?src.folders:[];
  const folders=[];
  const seenF=new Set();
  rawFolders.forEach(f=>{
    if(!f||typeof f!=='object') return;
    const id=String(f.id||'').trim()||uid();
    if(seenF.has(id)) return;
    seenF.add(id);
    folders.push({
      id,
      name:String(f.name||(id==='fb_inbox'?'📥 Posteingang':'Ordner')).trim()||(id==='fb_inbox'?'📥 Posteingang':'Ordner'),
      isSystem:id==='fb_inbox'?true:Boolean(f.isSystem)
    });
  });
  if(!folders.length){
    clone(DEF_FB_FOLDERS).forEach(f=>{seenF.add(f.id);folders.push(f);});
  }else if(!seenF.has('fb_inbox')){
    folders.unshift({ id:'fb_inbox', name:'📥 Posteingang', isSystem:true });
    seenF.add('fb_inbox');
  }else{
    const inb=folders.find(f=>f.id==='fb_inbox');
    if(inb) inb.isSystem=true;
  }
  const items=(Array.isArray(src.items)?src.items:[]).filter(it=>it&&typeof it==='object').map((it,idx)=>{
    const ts=String(it.ts||'').trim()||stamp();
    const tsMs=toInt(it.tsMs,0)||Date.now();
    const rawFolderId=String(it.folderId||'fb_inbox').trim()||'fb_inbox';
    const folderId=seenF.has(rawFolderId)?rawFolderId:'fb_inbox';
    const messages=(Array.isArray(it.messages)?it.messages:[]).filter(m=>m&&typeof m==='object').map(m=>{
      const mts=String(m.ts||'').trim()||stamp();
      const mtsMs=toInt(m.tsMs,0)||tsMs;
      return {
        id:String(m.id||'').trim()||uid(),
        author:String(m.author??'').trim()||(m.isAdmin?'Admin':'Gast'),
        isAdmin:Boolean(m.isAdmin),
        html:String(m.html??m.text??''),
        ts:mts,
        tsMs:mtsMs
      };
    });
    const calcAdminMs=messages.reduce((mx,m)=>m.isAdmin?Math.max(mx,toInt(m.tsMs,0)):mx,0);
    const lastAdminReplyMs=Math.max(toInt(it.lastAdminReplyMs,0),calcAdminMs);
    return {
      id:String(it.id||'').trim()||uid(),
      author:String(it.author??'').trim()||'Gast',
      title:String(it.title??'').trim(),
      html:String(it.html??it.text??''),
      ts,
      tsMs,
      folderId,
      order:typeof it.order==='number'&&!Number.isNaN(it.order)?it.order:toInt(it.order,idx),
      messages,
      lastAdminReplyMs
    };
  });
  const backlog=(Array.isArray(src.backlog)?src.backlog:[]).filter(b=>b&&typeof b==='object').map(b=>{
    const ts=String(b.ts||'').trim()||stamp();
    const tsMs=toInt(b.tsMs,0)||Date.now();
    return {
      id:String(b.id||'').trim()||uid(),
      author:String(b.author??'').trim()||'Gast',
      title:String(b.title??'').trim(),
      html:String(b.html??b.text??''),
      ts,
      tsMs,
      status:String(b.status||'done').trim()||'done',
      closedAt:String(b.closedAt||ts).trim()||ts
    };
  });
  return { folders, items, backlog };
}
export function loadFeedbackCache(){
  try{
    const raw=localStorage.getItem(FEEDBACK_CACHE_KEY);
    if(!raw) return null;
    const parsed=JSON.parse(raw);
    if(!parsed||typeof parsed!=='object') return null;
    const norm=normalizeFeedbackStore(parsed);
    return { ...norm, lastLoadedTs:String(parsed.lastLoadedTs||'') };
  }catch(e){return null;}
}
export function saveFeedbackCache(){
  try{
    localStorage.setItem(FEEDBACK_CACHE_KEY,JSON.stringify({
      folders:Array.isArray(FEEDBACK.folders)?FEEDBACK.folders:clone(DEF_FB_FOLDERS),
      items:Array.isArray(FEEDBACK.items)?FEEDBACK.items:[],
      backlog:Array.isArray(FEEDBACK.backlog)?FEEDBACK.backlog:[],
      lastLoadedTs:FEEDBACK.lastLoadedTs||stamp()
    }));
  }catch(e){}
}
export async function fetchFeedback(force=false){
  if((FEEDBACK.loaded||FEEDBACK.loading)&&!force) return FEEDBACK;
  FEEDBACK.loading=true;
  FEEDBACK.error='';
  if (UI.modal==='feedback') hooks.renderModal?.();
  if (typeof hooks.renderFbAdminWin==='function' && FBW?.open) hooks.renderFbAdminWin?.();
  try{
    const res=await fetch(`${getCloudEndpoint()}?id=${encodeURIComponent(FEEDBACK_ID)}`,{headers:{'Accept':'application/json'}});
    if(res.status===404){
      const empty=normalizeFeedbackStore({});
      FEEDBACK.folders=empty.folders;
      FEEDBACK.items=empty.items;
      FEEDBACK.backlog=empty.backlog;
      FEEDBACK.loaded=true;
      FEEDBACK.lastLoadedTs=stamp();
      FEEDBACK.error='';
      saveFeedbackCache();
      return FEEDBACK;
    }
    if(!res.ok) throw new Error(`HTTP ${res.status}`);
    const data=await res.json().catch(()=>null);
    if(data&&data.error&&/not\s*found|nicht\s*gefunden/i.test(String(data.error))){
      const empty=normalizeFeedbackStore({});
      FEEDBACK.folders=empty.folders;
      FEEDBACK.items=empty.items;
      FEEDBACK.backlog=empty.backlog;
      FEEDBACK.loaded=true;
      FEEDBACK.lastLoadedTs=stamp();
      FEEDBACK.error='';
      saveFeedbackCache();
      return FEEDBACK;
    }
    const norm=normalizeFeedbackStore(data);
    FEEDBACK.folders=norm.folders;
    FEEDBACK.items=norm.items;
    FEEDBACK.backlog=norm.backlog;
    FEEDBACK.loaded=true;
    FEEDBACK.lastLoadedTs=stamp();
    FEEDBACK.error='';
    saveFeedbackCache();
    return FEEDBACK;
  }catch(err){
    const cache=loadFeedbackCache();
    if(cache){
      FEEDBACK.folders=cache.folders;
      FEEDBACK.items=cache.items;
      FEEDBACK.backlog=cache.backlog;
      FEEDBACK.loaded=true;
      FEEDBACK.lastLoadedTs=cache.lastLoadedTs||FEEDBACK.lastLoadedTs||stamp();
      FEEDBACK.error='Offline-Modus: Lokaler Feedback-Cache wird angezeigt.';
    }else{
      const fbNorm=normalizeFeedbackStore(FEEDBACK);
      FEEDBACK.folders=fbNorm.folders;
      FEEDBACK.items=fbNorm.items;
      FEEDBACK.backlog=fbNorm.backlog;
      FEEDBACK.loaded=false;
      FEEDBACK.error='Feedback derzeit nicht vom Server erreichbar.';
    }
    return FEEDBACK;
  }finally{
    FEEDBACK.loading=false;
    if (UI.modal==='feedback') hooks.renderModal?.();
    if (typeof hooks.renderFbAdminWin==='function' && FBW?.open) hooks.renderFbAdminWin?.();
    if (typeof updateNotifBadges==='function') updateNotifBadges();
  }
}
export async function saveFeedbackStore(mutatorFn, successMsg=''){
  if(typeof mutatorFn!=='function') return false;
  FEEDBACK.saving=true;
  FEEDBACK.error='';
  if (UI.modal==='feedback') hooks.renderModal?.();
  if (typeof hooks.renderFbAdminWin==='function' && FBW?.open) hooks.renderFbAdminWin?.();
  let store=normalizeFeedbackStore(FEEDBACK);
  try{
    const getRes=await fetch(`${getCloudEndpoint()}?id=${encodeURIComponent(FEEDBACK_ID)}`,{headers:{'Accept':'application/json'}});
    if(getRes.ok){
      const rem=await getRes.json().catch(()=>null);
      if(rem&&!(rem.error&&/not\s*found|nicht\s*gefunden/i.test(String(rem.error)))){
        store=normalizeFeedbackStore(rem);
      }
    }
  }catch(e){}
  const res=mutatorFn(store);
  if(res===false){
    FEEDBACK.saving=false;
    if (UI.modal==='feedback') hooks.renderModal?.();
    if (typeof hooks.renderFbAdminWin==='function' && FBW?.open) hooks.renderFbAdminWin?.();
    return false;
  }
  store=normalizeFeedbackStore(store);
  try{
    const payload={ charId: FEEDBACK_ID, profile:{ name:'__FEEDBACK__' }, _AdminOverride: true, feedback: store, _summary:{ updatedAt: stamp() } };
    const postRes=await fetch(getCloudEndpoint(),{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify(payload)
    });
    const postData=await postRes.json().catch(()=>({}));
    if(!postRes.ok||postData.error) throw new Error(postData.error||`HTTP ${postRes.status}`);
    FEEDBACK.folders=store.folders;
    FEEDBACK.items=store.items;
    FEEDBACK.backlog=store.backlog;
    FEEDBACK.loaded=true;
    FEEDBACK.lastLoadedTs=stamp();
    FEEDBACK.error='';
    saveFeedbackCache();
    if(successMsg) toast(successMsg);
    return true;
  }catch(err){
    FEEDBACK.folders=store.folders;
    FEEDBACK.items=store.items;
    FEEDBACK.backlog=store.backlog;
    FEEDBACK.loaded=true;
    FEEDBACK.lastLoadedTs=stamp();
    FEEDBACK.error='Lokal im Cache gespeichert (Server nicht erreichbar).';
    saveFeedbackCache();
    if(successMsg) toast(successMsg);
    else toast('⚠️ Server nicht erreichbar – Feedback lokal im Browser-Cache gespeichert.');
    return true;
  }finally{
    FEEDBACK.saving=false;
    if (UI.modal==='feedback') hooks.renderModal?.();
    if (typeof hooks.renderFbAdminWin==='function' && FBW?.open) hooks.renderFbAdminWin?.();
    if (typeof updateNotifBadges==='function') updateNotifBadges();
  }
}
export function normalizeCustomIconsMap(raw){
  const out={};
  if(!raw||typeof raw!=='object') return out;
  const validKeys=new Set(SYSTEM_ICON_DEFS.map(d=>d.key));
  Object.entries(raw).forEach(([k,v])=>{
    if(!validKeys.has(k)||typeof v!=='string') return;
    const val=v.trim();
    if(/^(?:data:image\/|https?:\/\/)/i.test(val)) out[k]=val;
  });
  return out;
}
export function loadCustomIconsCache(){
  try{
    const raw=localStorage.getItem(CUSTOM_ICONS_CACHE_KEY);
    if(!raw) return null;
    const parsed=JSON.parse(raw);
    if(!parsed||typeof parsed!=='object') return null;
    return {
      icons:normalizeCustomIconsMap(parsed.icons),
      lastLoadedTs:String(parsed.lastLoadedTs||'')
    };
  }catch(e){return null;}
}
export function saveCustomIconsCache(){
  try{
    localStorage.setItem(CUSTOM_ICONS_CACHE_KEY,JSON.stringify({
      icons:normalizeCustomIconsMap(CUSTOM_ICONS.icons),
      lastLoadedTs:CUSTOM_ICONS.lastLoadedTs||stamp()
    }));
  }catch(e){}
}
export async function fetchCustomIcons(force=false){
  if((CUSTOM_ICONS.loaded||CUSTOM_ICONS.loading)&&!force) return CUSTOM_ICONS.icons;
  const prevJson=JSON.stringify(CUSTOM_ICONS.icons||{});
  CUSTOM_ICONS.loading=true;
  CUSTOM_ICONS.error='';
  if(UI.modal==='adminIcons') hooks.renderModal?.();
  try{
    const res=await fetch(`${getCloudEndpoint()}?id=${encodeURIComponent(ICON_STORE_ID)}`,{headers:{'Accept':'application/json'}});
    if(res.status===404){
      CUSTOM_ICONS.icons={};
      CUSTOM_ICONS.loaded=true;
      CUSTOM_ICONS.lastLoadedTs=stamp();
      CUSTOM_ICONS.error='';
      saveCustomIconsCache();
      return CUSTOM_ICONS.icons;
    }
    if(!res.ok) throw new Error(`HTTP ${res.status}`);
    const data=await res.json().catch(()=>null);
    if(data&&data.error&&/not\s*found|nicht\s*gefunden/i.test(String(data.error))){
      CUSTOM_ICONS.icons={};
      CUSTOM_ICONS.loaded=true;
      CUSTOM_ICONS.lastLoadedTs=stamp();
      CUSTOM_ICONS.error='';
      saveCustomIconsCache();
      return CUSTOM_ICONS.icons;
    }
    const rawIcons=(data&&typeof data.icons==='object'&&data.icons)?data.icons:{};
    CUSTOM_ICONS.icons=normalizeCustomIconsMap(rawIcons);
    CUSTOM_ICONS.loaded=true;
    CUSTOM_ICONS.lastLoadedTs=stamp();
    CUSTOM_ICONS.error='';
    saveCustomIconsCache();
    return CUSTOM_ICONS.icons;
  }catch(err){
    const cache=loadCustomIconsCache();
    if(cache){
      CUSTOM_ICONS.icons=cache.icons;
      CUSTOM_ICONS.loaded=true;
      CUSTOM_ICONS.lastLoadedTs=cache.lastLoadedTs||CUSTOM_ICONS.lastLoadedTs;
      CUSTOM_ICONS.error='Offline-Modus: Lokaler Icon-Cache wird angezeigt.';
    }else{
      CUSTOM_ICONS.loaded=false;
      CUSTOM_ICONS.error='Standard-Icons derzeit nicht vom Server erreichbar.';
    }
    return CUSTOM_ICONS.icons;
  }finally{
    CUSTOM_ICONS.loading=false;
    const changed=JSON.stringify(CUSTOM_ICONS.icons||{})!==prevJson;
    if(changed){
      hooks.renderHeader?.();
      if(!UI.inLobby && S.activeTab==='attributes') hooks.renderMain?.();
    }
    if(UI.modal==='adminIcons') hooks.renderModal?.();
  }
}
export async function saveCustomIconsToServer(nextIcons, successMsg = ''){
  if(!CLOUD.isAdmin) { toast('🔒 Nur der Admin kann Standard-Icons ändern.'); return false; }
  const cleaned=normalizeCustomIconsMap(nextIcons);
  CUSTOM_ICONS.saving=true;
  CUSTOM_ICONS.error='';
  if(UI.modal==='adminIcons') hooks.renderModal?.();
  try{
    const payload={
      charId: ICON_STORE_ID,
      profile: { name: '__CUSTOM_ICONS__' },
      _AdminOverride: true,
      icons: cleaned,
      _summary: { updatedAt: stamp() }
    };
    const res=await fetch(getCloudEndpoint(),{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify(payload)
    });
    const data=await res.json().catch(()=>({}));
    if(!res.ok||data.error) throw new Error(data.error||`HTTP ${res.status}`);
    CUSTOM_ICONS.icons=cleaned;
    CUSTOM_ICONS.loaded=true;
    CUSTOM_ICONS.lastLoadedTs=stamp();
    CUSTOM_ICONS.error='';
    saveCustomIconsCache();
    toast(successMsg||'☁️ Standard-Icons auf dem Server gespeichert!');
    return true;
  }catch(err){
    CUSTOM_ICONS.icons=cleaned;
    CUSTOM_ICONS.loaded=true;
    CUSTOM_ICONS.lastLoadedTs=stamp();
    CUSTOM_ICONS.error='Lokal im Cache gespeichert (Server nicht erreichbar).';
    saveCustomIconsCache();
    toast('⚠️ Server nicht erreichbar – Standard-Icons lokal im Browser-Cache gespeichert.');
    return true;
  }finally{
    CUSTOM_ICONS.saving=false;
    hooks.renderHeader?.();
    if(!UI.inLobby && S.activeTab==='attributes') hooks.renderMain?.();
    if(UI.modal==='adminIcons') hooks.renderModal?.();
  }
}
export function getNotifSeenKey(user=CLOUD.currentUser){
  const effUser = String(user || (CLOUD.isAdmin ? '__admin__' : '')).trim().toLowerCase();
  return `scherbensturm_notif_seen_${effUser}`;
}
export function loadNotifSeen(user=CLOUD.currentUser){
  const def={patchnotes:{},replies:{},adminFb:{}};
  const effUser = String(user || (CLOUD.isAdmin ? '__admin__' : '')).trim().toLowerCase();
  if(!effUser) return def;
  try{
    const raw=localStorage.getItem(getNotifSeenKey(effUser));
    if(!raw) return def;
    const parsed=JSON.parse(raw);
    if(!parsed||typeof parsed!=='object') return def;
    return {
      patchnotes:(parsed.patchnotes&&typeof parsed.patchnotes==='object')?{...parsed.patchnotes}:{},
      replies:(parsed.replies&&typeof parsed.replies==='object')?{...parsed.replies}:{},
      adminFb:(parsed.adminFb&&typeof parsed.adminFb==='object')?{...parsed.adminFb}:{}
    };
  }catch(e){return def;}
}
export function saveNotifSeen(obj,user=CLOUD.currentUser){
  const effUser = String(user || (CLOUD.isAdmin ? '__admin__' : '')).trim().toLowerCase();
  if(!effUser) return;
  try{
    const safe={
      patchnotes:(obj?.patchnotes&&typeof obj.patchnotes==='object')?obj.patchnotes:{},
      replies:(obj?.replies&&typeof obj.replies==='object')?obj.replies:{},
      adminFb:(obj?.adminFb&&typeof obj.adminFb==='object')?obj.adminFb:{}
    };
    localStorage.setItem(getNotifSeenKey(effUser),JSON.stringify(safe));
  }catch(e){}
}
export function getPatchnoteNotifKey(entry){
  return String(entry?.id??'');
}
export function getUserNotifications(user=CLOUD.currentUser){
  if(!Boolean(user || CLOUD.isAdmin)) return {unread:[],read:[],unreadCount:0};
  const seen=loadNotifSeen(user);
  const uLow=String(user||'').trim().toLowerCase();
  const all=[];
  if(user){
    (Array.isArray(PATCHNOTES.entries)?PATCHNOTES.entries:[]).forEach(pn=>{
      if(!pn||!pn.id) return;
      const key=getPatchnoteNotifKey(pn);
      const isUnread=!seen.patchnotes[key];
      all.push({
        kind:'patchnote',
        key,
        id:pn.id,
        version:String(pn.version||'').trim(),
        title:pn.title||pn.version||'Neue Patchnotes',
        preview:pn.items?.[0]?.heading||pn.intro||'Änderungen ansehen',
        ts:pn.ts||'',
        tsMs:parsePatchnoteTsMs(pn.ts,toInt(pn.tsMs,0)),
        unread:isUnread
      });
    });
    (Array.isArray(FEEDBACK.items)?FEEDBACK.items:[]).forEach(it=>{
      if(!it||String(it.author||'').trim().toLowerCase()!==uLow) return;
      (Array.isArray(it.messages)?it.messages:[]).forEach(m=>{
        if(!m||m.isAdmin!==true||!m.id) return;
        const key=String(m.id);
        const isUnread=!seen.replies[key];
        all.push({
          kind:'fb_reply',
          key,
          feedbackId:it.id,
          msgId:m.id,
          title:`Antwort auf „${it.title||'Dein Feedback'}“`,
          preview:stripHtml(m.html||'').trim().slice(0,110),
          ts:m.ts||'',
          tsMs:toInt(m.tsMs,0),
          unread:isUnread
        });
      });
    });
  }
  if(CLOUD.isAdmin === true){
    (Array.isArray(FEEDBACK.items)?FEEDBACK.items:[]).forEach(it=>{
      if(!it||!it.id) return;
      const itemKey = 'item_' + it.id;
      const hasAdminReplied = (it.messages||[]).some(m=>m&&m.isAdmin);
      const isUnread = hasAdminReplied ? false : !seen.adminFb[itemKey];
      all.push({
        kind:'fb_admin',
        subKind:'new',
        key:itemKey,
        feedbackId:it.id,
        folderId:it.folderId||'fb_inbox',
        title:'Neues Feedback von ' + (it.author||'Spieler') + ': „' + (it.title||'Ohne Betreff') + '“',
        preview:stripHtml(it.html||'').trim().slice(0,110),
        ts:it.ts||'',
        tsMs:toInt(it.tsMs,0),
        unread:isUnread
      });
      (Array.isArray(it.messages)?it.messages:[]).forEach(m=>{
        if(!m||m.isAdmin||!m.id) return;
        const msgKey = 'umsg_' + m.id;
        const isUnread = !seen.adminFb[msgKey];
        all.push({
          kind:'fb_admin',
          subKind:'reply',
          key:msgKey,
          feedbackId:it.id,
          folderId:it.folderId||'fb_inbox',
          title:'Antwort von ' + (m.author||it.author||'Spieler') + ' zu „' + (it.title||'Feedback') + '“',
          preview:stripHtml(m.html||'').trim().slice(0,110),
          ts:m.ts||'',
          tsMs:toInt(m.tsMs,0),
          unread:isUnread
        });
      });
    });
  }
  const unread=all.filter(n=>n.unread);
  const read=all.filter(n=>!n.unread);
  return {unread,read,unreadCount:unread.length};
}
export function markNotifRead(kind,key,user=CLOUD.currentUser){
  if(!(user||CLOUD.isAdmin)||!key) return;
  const seen=loadNotifSeen(user);
  if(kind==='patchnote') seen.patchnotes[String(key)]=1;
  else if(kind==='fb_admin') seen.adminFb[String(key)]=1;
  else seen.replies[String(key)]=1;
  saveNotifSeen(seen,user);
  updateNotifBadges();
}
export function markAllNotifsRead(user=CLOUD.currentUser){
  if(!(user||CLOUD.isAdmin)) return;
  const seen=loadNotifSeen(user);
  if(user){
    (Array.isArray(PATCHNOTES.entries)?PATCHNOTES.entries:[]).forEach(pn=>{
      if(pn&&pn.id) seen.patchnotes[getPatchnoteNotifKey(pn)]=1;
    });
    const uLow=String(user).trim().toLowerCase();
    (Array.isArray(FEEDBACK.items)?FEEDBACK.items:[]).forEach(it=>{
      if(!it||String(it.author||'').trim().toLowerCase()!==uLow) return;
      (Array.isArray(it.messages)?it.messages:[]).forEach(m=>{
        if(m&&m.isAdmin===true&&m.id) seen.replies[String(m.id)]=1;
      });
    });
  }
  if(CLOUD.isAdmin){
    (Array.isArray(FEEDBACK.items)?FEEDBACK.items:[]).forEach(it=>{
      if(!it||!it.id) return;
      seen.adminFb[`item_${it.id}`]=1;
      (Array.isArray(it.messages)?it.messages:[]).forEach(m=>{
        if(m&&!m.isAdmin&&m.id) seen.adminFb[`umsg_${m.id}`]=1;
      });
    });
  }
  saveNotifSeen(seen,user);
  updateNotifBadges();
}
export function updateNotifBadges(){
  const cnt=(CLOUD.currentUser||CLOUD.isAdmin)?getUserNotifications().unreadCount:0;
  document.querySelectorAll('[data-notif-cnt]').forEach(el=>{
    el.textContent=String(cnt);
    el.classList.toggle('inline-flex',cnt>0);
    el.classList.toggle('hidden',cnt<=0);
  });
  document.querySelectorAll('[data-action="open-notifs"]').forEach(btn=>{
    btn.classList.toggle('border-amber-400/70',cnt>0);
    btn.classList.toggle('bg-amber-500/15',cnt>0);
    btn.classList.toggle('text-amber-200',cnt>0);
    btn.classList.toggle('bdr-acc',cnt<=0);
    btn.classList.toggle('bg-acc-soft',cnt<=0);
  });
}
export function renderNotifBellBtnHtml(compact=false){
  if(!(CLOUD.currentUser||CLOUD.isAdmin)) return '';
  const cnt=getUserNotifications().unreadCount;
  const szCls=compact?'w-8 h-8 sm:w-9 sm:h-9 p-0 text-sm font-extrabold shrink-0':'h-9 px-2.5 text-xs font-extrabold shrink-0';
  const badgeCls=compact
    ?`${cnt>0?'inline-flex':'hidden'} absolute -top-1 -right-1 items-center justify-center min-w-[16px] h-[16px] px-1 rounded-full bg-rose-600 text-white text-[9px] font-black tabular leading-none shadow`
    :`${cnt>0?'inline-flex':'hidden'} items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-rose-600 text-white text-[10px] font-black tabular leading-none`;
  const ariaLbl=`Benachrichtigungen öffnen${cnt>0?` (${cnt} ungelesen)`:''}`;
  return `<button type="button" data-action="open-notifs" aria-label="${esc(ariaLbl)}" data-tip="Benachrichtigungen (Patchnotes &amp; Feedback)" class="btn relative ${szCls} ${cnt>0?'border-amber-400/70 bg-amber-500/15 text-amber-200':'bdr-acc bg-acc-soft'}">🔔<span data-notif-cnt="1" class="${badgeCls}">${cnt}</span></button>`;
}
export function renderNotifsModalHtml(){
  if(!(CLOUD.currentUser||CLOUD.isAdmin)){
    return `<div class="subcard p-6 border-2 border-amber-500/40 bg-amber-500/10 text-center space-y-2">
      <div class="text-2xl">🔒</div>
      <div class="text-sm font-black text-amber-300">🔒 Nur für eingeloggte Benutzer – Bitte melde dich zuerst in der Lobby mit deinem Benutzernamen an, um deine Benachrichtigungen zu sehen.</div>
    </div>`;
  }
  const N = getUserNotifications();
  const renderItemCard = (it, isRead=false) => {
    const isPn = it.kind === 'patchnote';
    const isFbAdmin = it.kind === 'fb_admin';
    const icon = isPn ? '📋' : isFbAdmin ? '📥' : '💬';
    const badgeTxt = isPn ? 'Neue Patchnote' : isFbAdmin ? (it.subKind==='reply' ? 'Spieler-Antwort' : 'Neues Feedback') : 'Admin-Antwort';
    const badgeCls = isPn
      ? 'bg-sky-500/20 text-sky-300 border-sky-400/50'
      : isFbAdmin
        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/50'
        : 'bg-amber-500/20 text-amber-300 border-amber-400/50';
    const cardCls = isRead
      ? 'subcard p-2.5 opacity-70 hover:opacity-100 border bdr-line transition-opacity'
      : 'subcard p-3 border-2 bdr-acc bg-acc-soft/20 hover:bg-acc-soft/35 transition-colors';
    const pnVer = isPn ? String(it.version || '').trim() : '';
    const rawTitle = String(it.title || '').trim();
    const dispTitle = (isPn && pnVer && rawTitle.toLowerCase() === pnVer.toLowerCase()) ? 'Neue Patchnotes' : rawTitle;
    return `<button type="button" data-action="notif-open-item" data-nkind="${it.kind}" data-nkey="${esc(it.key)}" data-nid="${esc(it.id||it.feedbackId||'')}" class="${cardCls} w-full text-left flex items-start gap-2.5 cursor-pointer">
      <span class="text-lg leading-none shrink-0 mt-0.5">${icon}</span>
      <div class="min-w-0 flex-1 space-y-1">
        <div class="flex flex-wrap items-center justify-between gap-1.5">
          <div class="flex flex-wrap items-center gap-1.5">
            <span class="px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${badgeCls}">${badgeTxt}</span>
            ${(isPn && it.version)?`<span class="px-1.5 py-0.5 rounded text-[10px] font-black bg-acc-soft border bdr-acc text-acc tabular">${esc(it.version)}</span>`:''}
          </div>
          ${it.ts?`<span class="text-[10px] t-mut tabular">🕒 ${esc(it.ts)}</span>`:''}
        </div>
        <div class="font-black text-xs sm:text-sm text-acc break-words">${esc(dispTitle)}</div>
        ${it.preview?`<div class="text-xs t-mut break-words">${esc(stripHtml(it.preview))}</div>`:''}
      </div>
    </button>`;
  };
  const unreadHtml = N.unread.length
    ? `<div class="space-y-2">${N.unread.map(it=>renderItemCard(it,false)).join('')}</div>`
    : `<div class="subcard border-dashed p-5 text-center text-xs t-mut">Alles gelesen – keine neuen Benachrichtigungen.</div>`;
  const recentRead = N.read.slice(0, 8);
  const readHtml = recentRead.length
    ? `<div class="space-y-2 pt-2 border-t bdr-line">
        <div class="text-xs font-extrabold t-mut uppercase tracking-wider">Zuletzt gelesen (${recentRead.length})</div>
        <div class="space-y-1.5">${recentRead.map(it=>renderItemCard(it,true)).join('')}</div>
      </div>`
    : '';
  return `<div class="space-y-4">
    <div class="subcard p-2.5 sm:p-3 flex flex-wrap items-center justify-between gap-2 bg-black/20">
      <div class="flex flex-wrap items-center gap-2">
        <span class="text-xs sm:text-sm font-black text-acc">🔔 Benachrichtigungen</span>
        <span class="pill cursor-default text-[11px] py-0.5 px-2.5 tabular ${N.unreadCount>0?'border-amber-400/70 bg-amber-500/15 text-amber-200':'opacity-75'}">${N.unreadCount} ungelesen</span>
      </div>
      <div class="flex flex-wrap items-center gap-1.5">
        <button type="button" data-action="notif-refresh" class="btn py-1 px-2.5 text-xs font-bold">🔄 Prüfen</button>
        ${N.unreadCount>0?`<button type="button" data-action="notif-mark-all" class="btn btn-ok py-1 px-2.5 text-xs font-extrabold">✓ Alle als gelesen markieren</button>`:''}
      </div>
    </div>
    <div class="space-y-2">
      <div class="text-xs font-extrabold text-acc uppercase tracking-wider">Ungelesen (${N.unread.length})</div>
      ${unreadHtml}
    </div>
    ${readHtml}
  </div>`;
}
export function refreshUserNotificationsBg(force=false){
  if(!(CLOUD.currentUser||CLOUD.isAdmin)){
    updateNotifBadges();
    return Promise.resolve();
  }
  return Promise.allSettled([fetchPatchnotes(force),fetchFeedback(force)]).then(()=>updateNotifBadges());
}
export async function fetchAndSyncBasisPowers(mode='skipExisting',opts={}){
  const silent=Boolean(opts&&opts.silent);
  const targetCharId=S.charId;
  try{
    const packs=await fetchPowerLibrary(!silent);
    const isBasis=p=>Boolean(p&&(p.isBasisPack===true||String(p.id||'').trim().toLowerCase()==='basisaktionen'));
    const basisPack=packs.find(p=>p._origin==='cloud'&&isBasis(p))||packs.find(isBasis)||null;
    if(!basisPack){
      if(!silent) toast('ℹ️ Auf dem Server wurde noch kein Basisaktionen-Paket gefunden.');
      return null;
    }
    if(silent&&(CLOUD.viewingRemote||S.charId!==targetCharId)) return null;
    const res=importPowerPackIntoSheet(basisPack,{dedupeMode:mode,silent});
    const parts=[];
    if(res.addedPw) parts.push(`${res.addedPw} ergänzt`);
    if(res.updatedPw) parts.push(`${res.updatedPw} aktualisiert`);
    if(res.addedAug) parts.push(`+${res.addedAug} ${res.addedAug===1?'Augment':'Augmente'}`);
    if(parts.length){
      toast(`✅ Basisaktionen synchronisiert: ${parts.join(', ')}${res.skipped?` (${res.skipped} unverändert)`:''}.`);
    }else if(!silent){
      if(res.skipped) toast(`✅ Alle ${res.skipped} Basisaktionen sind bereits aktuell.`);
      else toast('ℹ️ Das Basisaktionen-Paket enthielt keine neuen Einträge.');
    }
    return res;
  }catch(e){
    if(!silent) toast('⚠️ Basisaktionen konnten nicht vom Server geladen werden.');
    return null;
  }
}
