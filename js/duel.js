import {
  $, esc, toInt
} from './utils.js';
import {
  DUEL
} from './state.js';

export function renderDuelBanner(){
  const mount=$('duelBannerMount');
  if(!mount) return;
  const offers=(DUEL.damageOffers||[]).filter(Boolean);
  if(!offers.length){
    mount.innerHTML='';
    return;
  }
  const offerCards=offers.map(of=>{
    const poolLbl=of.pool==='mlp'?'mLP':'LP';
    const curAmt=Math.max(0,toInt(of.editOpen?of.editAmount:of.amount,0));
    const thCls=of.thresholdLevel==='heavy'
      ?'border-rose-500/70 bg-rose-500/20 text-rose-200'
      :of.thresholdLevel==='medium'
        ?'border-orange-400/70 bg-orange-500/20 text-orange-200'
        :of.thresholdLevel==='light'
          ?'border-amber-400/70 bg-amber-500/20 text-amber-200'
          :'';
    const editBox=of.editOpen
      ?`<div class="flex items-center justify-between gap-2 p-2 rounded-xl bg-black/30 border bdr-line tabular">
          <span class="text-[11px] font-extrabold t-mut shrink-0">Schaden (${poolLbl}):</span>
          <div class="flex items-center gap-1.5">
            <button type="button" data-action="combat-offer-step" data-id="${esc(of.offerId)}" data-d="-1" class="btn w-8 h-8 p-0 text-sm font-black">−</button>
            <input data-combat-offer-inp="${esc(of.offerId)}" type="text" inputmode="numeric" value="${curAmt}" class="inp w-14 text-center font-black py-1 px-1 tabular"/>
            <button type="button" data-action="combat-offer-step" data-id="${esc(of.offerId)}" data-d="1" class="btn w-8 h-8 p-0 text-sm font-black">+</button>
          </div>
        </div>`
      :'';
    return `<div data-damage-offer="${esc(of.offerId)}" class="card duel-banner-card p-3 rounded-2xl space-y-2 min-w-0 !border-rose-400/75">
      <div class="flex items-start justify-between gap-2 min-w-0">
        <div class="min-w-0 flex-1">
          <div class="text-[10px] font-black uppercase tracking-wider text-rose-300">💥 Eingehender Schaden${of.targetName?` • ${esc(of.targetName)}`:''}</div>
          <div class="text-xs sm:text-sm font-black break-words leading-snug">⚔️ ${esc(of.attackerName||'Angreifer')} trifft <span class="text-amber-300">${esc(of.zoneName||'Zone')}</span>: <span class="text-rose-300 tabular">−${curAmt} ${poolLbl}</span></div>
          ${of.thresholdLabel?`<div class="inline-block mt-1 px-2 py-0.5 rounded-md border text-[10px] font-black ${thCls}">${esc(of.thresholdLabel)}</div>`:''}
          ${of.formula?`<div class="text-[10px] t-mut break-words mt-0.5 tabular">${esc(of.formula)}</div>`:''}
        </div>
        <button type="button" data-action="combat-offer-decline" data-id="${esc(of.offerId)}" aria-label="Ablehnen" class="btn w-8 h-8 p-0 text-xs font-black opacity-75 hover:opacity-100 shrink-0">✕</button>
      </div>
      ${editBox}
      <div class="flex flex-wrap items-center gap-1.5">
        <button type="button" data-action="combat-offer-accept" data-id="${esc(of.offerId)}" class="btn btn-ok flex-1 min-h-[36px] py-1.5 px-3 text-xs font-black">✓ Schaden übernehmen</button>
        <button type="button" data-action="combat-offer-toggle-edit" data-id="${esc(of.offerId)}" class="btn min-h-[36px] py-1.5 px-2.5 text-xs font-extrabold ${of.editOpen?'btn-pri':''}">✏️ Anpassen</button>
        <button type="button" data-action="combat-offer-decline" data-id="${esc(of.offerId)}" class="btn min-h-[36px] py-1.5 px-2.5 text-xs font-bold opacity-85 hover:opacity-100">✕ Ablehnen</button>
      </div>
    </div>`;
  }).join('');
  mount.innerHTML=offerCards;
}
