import {
  STORE_KEY, OLD_KEYS, DEF_WEAPON_TAGS, DEF_ARMOR_TAGS, ATTRS, DEF_ATTR_COLS, STATUS_DEFS, DEFAULT_SYSTEM_ICON_SVGS, DEF_SEC_COLS, DEF_MAIN_ARTS, DEF_ACTION_SUBS, DEF_PW_TAGS, PW_ACTION_TIPS, DEF_USERES, SK_CATS, PW_TIERS, DEF_HZ, TABS, COL_PRESETS, PALETTES, WEAPON_SUBTYPES, DEF_EQ_SEC_ORDER, DEF_CHR_SEC_ORDER, DICE_DEF, CNOTES_DEF, LIVEDICE_DEF, FBW_DEF, WIN_PREFS_KEY, WIN_KEYS, WIN_DEFAULTS, PW_MODE_KEY, DEF_FB_FOLDERS, GUEST_THEME_KEY, USER_BG_LOCAL_PREFIX, THEME_BG_SYNC_LIMIT, THEME_SYNC_DEBOUNCE_MS, SCROLL_KEY_SEL, SCROLL_Y_SEL, SCROLL_X_SEL
} from './constants.js';
import {
  $, uid, stamp, esc, clone, toInt, isHex, sortAlpha, simpleHash, sortTagDefs, sanitizeSecHierarchy
} from './utils.js';
import {
  hooks
} from './ui-hooks.js';

export let CUSTOM_ICONS = { loaded:false, loading:false, saving:false, error:'', lastLoadedTs:'', icons:{} };
export function renderSystemIconHtml(iconKey, sizeCls = 'w-4 h-4'){
  const url=String(CUSTOM_ICONS?.icons?.[iconKey]||'').trim();
  if(url&&/^(?:data:image\/|https?:\/\/|\/|\.\/)/i.test(url)){
    return `<img src="${esc(url)}" alt="" class="${sizeCls} object-contain shrink-0 rounded-sm pointer-events-none"/>`;
  }
  const fn=DEFAULT_SYSTEM_ICON_SVGS[iconKey];
  if(fn) return fn(sizeCls);
  return `<span aria-hidden="true" class="${sizeCls} inline-flex items-center justify-center shrink-0 pointer-events-none">✦</span>`;
}
export const findMainArt=name=>{const low=String(name||'').trim().toLowerCase();return DEF_MAIN_ARTS.find(a=>a.toLowerCase()===low)||'';};
export const findActionSub=name=>{const low=String(name||'').trim().toLowerCase();return DEF_ACTION_SUBS.find(a=>a.toLowerCase()===low)||'';};
export const getPwTermTip=term=>{const low=String(term||'').trim().toLowerCase();if(!low)return '';const hit=Object.entries(PW_ACTION_TIPS).find(([k])=>k.toLowerCase()===low);return hit?`${hit[0]}\n${hit[1]}`:'';};
export const isReservedPwTerm=name=>{const low=String(name||'').trim().toLowerCase();return Boolean(low&&(DEF_MAIN_ARTS.some(a=>a.toLowerCase()===low)||DEF_ACTION_SUBS.some(a=>a.toLowerCase()===low)));};
export const getPwTierKey=(it,isAug=false)=>{const isLeg=!isAug&&!it?.parentPowerId&&it?.tier==='marginal'&&it?.manualCost&&toInt(it?.sp,0)===0&&toInt(it?.msp,0)===0;return isLeg?'basisaktion':(PW_TIERS[it?.tier]?it.tier:'marginal');};

export const makeStyleSlot=()=>({palette:'azur',bg:'',overlay:75,blur:0,fit:'cover',pos:'center'});
export const normWeaponType=t=>{const s=String(t||'').trim();return s||WEAPON_SUBTYPES[0].key;};
export const getWeaponSubtype=k=>{
  const key=normWeaponType(k);
  return WEAPON_SUBTYPES.find(s=>s.key===key)||{key,label:key.charAt(0).toUpperCase()+key.slice(1),icon:'⚔️'};
};
export const normEqCustomVals=arr=>Array.isArray(arr)?arr.filter(x=>x&&typeof x==='object').map(x=>({id:String(x.id||'').trim()||uid(),label:String(x.label??''),val:String(x.val??'0')})):[];
export const getSummaryEqCustomVals=arr=>(Array.isArray(arr)?arr:[]).filter(cv=>{
  if(!cv||typeof cv!=='object') return false;
  const lbl=String(cv.label||'').trim(), v=String(cv.val??'').trim();
  const nonZero=Boolean(v&&v!=='0'&&v!=='-0'&&v!=='+0'&&v!=='-');
  return Boolean(lbl&&nonZero);
}).map(cv=>({label:String(cv.label||'').trim(),val:String(cv.val??'').trim()}));
export const fmtCustomValSummarySuffix=arr=>getSummaryEqCustomVals(arr).map(c=>` • ${esc(c.label)} ${esc(c.val)}`).join('');
export const renderLinkedAmmoCustomDmgHtml=arr=>getSummaryEqCustomVals(arr).map(c=>`<span class="px-2 py-0.5 rounded-md bg-black/25 border bdr-line text-[11px] font-semibold">${esc(c.label)}: <strong class="text-amber-300 font-black">${esc(c.val)}</strong></span>`).join('');
export const isWeaponMassiv=w=>Array.isArray(w?.tags)&&w.tags.some(t=>String(t?.name??t??'').trim().toLowerCase()==='massiv');
export const makeWeapon=(wType='melee')=>({id:uid(),name:'',color:'',bgColor:'',collapsed:false,img:'',wType:normWeaponType(wType),wAttr:'PR',skillId:'',grip:'',ammoId:'',dmgCut:'0',dmgPierce:'0',dmgImpact:'0',customDmg:[],tags:[],notes:''});
export const makeAmmo=(name='',qty=20)=>({id:uid(),name,color:'',bgColor:'',collapsed:false,img:'',qty:toInt(qty,20),dmgCut:'0',dmgPierce:'0',dmgImpact:'0',customDmg:[],tags:[],notes:''});
export const makeArmor=()=>({id:uid(),name:'',color:'',bgColor:'',collapsed:false,equipped:true,img:'',grp:'0',protCut:'0',protPierce:'0',protImpact:'0',customProt:[],zones:[],extraZones:[],tags:[],notes:''});
export const makeInvItem=(secId='')=>({id:uid(),name:'',color:'',bgColor:'',collapsed:false,img:'',category:'Inventar',qty:'1',notes:'',sectionId:String(secId||'')});
export const makeEqSecMeta=()=>({weapons:{collapsed:false,color:'',bgColor:''},ammos:{collapsed:false,color:'',bgColor:''},armors:{collapsed:false,color:'',bgColor:''},inventory:{collapsed:false,color:'',bgColor:''}});
export const makeChrSecMeta=()=>({training:{collapsed:false,color:'',bgColor:''},skills:{collapsed:false,color:'',bgColor:''},powers:{collapsed:false,color:'',bgColor:''}});
export const makeBaseSection=(parentSectionId='',extra={})=>({id:uid(),name:'Neue Sektion',color:'',bgColor:'',collapsed:false,...extra,parentSectionId:String(parentSectionId||'')});
export const makeSection=(parentSectionId='')=>makeBaseSection(parentSectionId,{filterArt:''});
export const makeSkSection=(parentSectionId='')=>makeBaseSection(parentSectionId,{filterAttr:''});
export const makeInvSection=(parentSectionId='')=>makeBaseSection(parentSectionId,{name:'Neuer Beutel'});
export const makePower=(secId='')=>({id:uid(),templateId:'',name:'',color:'',bgColor:'',sectionId:secId,collapsed:false,req:'',tier:'marginal',manualCost:false,sp:1,msp:0,showManual:false,art:'Grundaktion',artManual:false,actionSubs:[],tags:[],useCosts:[],useAmt:0,useRes:'',reserved:false,reservedCosts:[],desc:'',effects:'',rules:'',applyMods:true,bldAmt:'+1',bldStat:'LP-Max',bldMode:'stat',bldSkCnt:'1',bldSkKind:'adv',bldSkId:'',bldDynVar:'WA',bldDynFactor:'/2',bldDynRound:'',bldDynTarget:'desc',boxH:{desc:0,effects:0,rules:0}});
export const makeAugment=(pid='',secId='')=>({...makePower(pid?'':String(secId||'')),id:uid(),parentPowerId:String(pid||''),art:'',actionSubs:[],tags:['Eigenschaft'],useCosts:[],useAmt:0,useRes:''});
export function syncPwUseCostsLegacy(it){
  if(!it) return;
  if(!Array.isArray(it.useCosts)) it.useCosts=[];
  it.useCosts=it.useCosts.filter(c=>c&&String(c.res||'').trim()).map(c=>({res:String(c.res).trim(),amt:Math.max(0,toInt(c.amt,0))}));
  const first=it.useCosts[0];
  it.useRes=first?first.res:'';
  it.useAmt=first?first.amt:0;
}

export function makeDefaultStatusEffects(){
  const out={};
  STATUS_DEFS.forEach(d=>{out[d.k]={active:false,stacks:1,iniDir:d.k==='abgelenkt'?-1:1,statOvr:'',advOvr:''};});
  return out;
}
export function normStatusEffects(raw){
  const def=makeDefaultStatusEffects();
  if(!raw||typeof raw!=='object') return def;
  STATUS_DEFS.forEach(d=>{
    const inc=raw[d.k];
    if(inc&&typeof inc==='object'){
      def[d.k]={
        active:Boolean(inc.active),
        stacks:Math.max(1,toInt(inc.stacks,1)),
        iniDir:toInt(inc.iniDir,d.k==='abgelenkt'?-1:1)<0?-1:1,
        statOvr:inc.statOvr!==undefined&&inc.statOvr!==null&&String(inc.statOvr).trim()!==''?String(toInt(inc.statOvr,0)):'',
        advOvr:inc.advOvr!==undefined&&inc.advOvr!==null&&String(inc.advOvr).trim()!==''?String(Math.max(0,toInt(inc.advOvr,0))):''
      };
    }
  });
  return def;
}
export function defaultState(){
  const attributes={},tabStyles={};
  ATTRS.forEach(a=>{attributes[a.k]={vw:20,pot:0,mod:0,tr:[false,false,false,false,false],trNotes:['','','','',''],trSp:[null,null,null,null,null],trMsp:[null,null,null,null,null]};});
  TABS.forEach(t=>{tabStyles[t.id]=makeStyleSlot();});
  return {
    version:11,charId:uid(),owner:'',campaignId:'default',cloudAutoSync:true,activeTab:'attributes',quickTab:'bestehen',phase:'ebbe',
    profile:{name:'',ancestry:'',concept:'',avatar:''},
    appearance:{dark:true,mode:'global',editScope:'attributes',global:makeStyleSlot(),lobby:makeStyleSlot(),tabs:tabStyles},
    attrColors:{...DEF_ATTR_COLS},secColors:{...DEF_SEC_COLS},
    artList:[...DEF_MAIN_ARTS],actionSubList:[...DEF_ACTION_SUBS],pwTagList:[...DEF_PW_TAGS],useResList:[...DEF_USERES],customStats:[],
    weaponTagList:clone(DEF_WEAPON_TAGS),armorTagList:clone(DEF_ARMOR_TAGS),ammoTagList:[],
    attributes,secondary:{lpCurrent:8,lpMod:0,lpRegenOvr:'',iniMod:0,mlpCurrent:8,mlpMod:0,mlpRegenOvr:'',apCurrent:3,apMax:3,mapCurrent:3,mapMax:3},
    customRes:{name:'Benutzerdefiniert',current:3,max:3,color:'#c084fc'},extraSecList:[],
    statusCollapsed:false,statusEffects:makeDefaultStatusEffects(),inspiration:0,inspirationActive:false,
    thresholds:{woundLight:3,woundMedium:6,woundHeavy:9,traumaLight:3,traumaMedium:6,traumaHeavy:9},
    bst:1,bstOvr:'',movements:[{id:'mv1',type:'Laufen',base:5,ovr:''}],hitZones:clone(DEF_HZ),lastHzRoll:null,
    combatNotes:{bestehen:'',schaden:'',ruestung:''},skillSections:[],skills:[],powerSections:[],powers:[],augments:[],
    progression:{level:1,ep:0,bonusSp:0,bonusMsp:0,bonusNote:''},
    chrSecOrder:[...DEF_CHR_SEC_ORDER],chrSecMeta:makeChrSecMeta(),chrTrExpanded:{},
    chronicleLog:[{id:uid(),ts:stamp(),text:'Neuer Scherbensturm-Charakterbogen bereit (Stufe 1, 5 SP).'}],
    equipSecOrder:[...DEF_EQ_SEC_ORDER],equipSecMeta:makeEqSecMeta(),
    weapons:[makeWeapon('melee')],armors:[makeArmor()],ammos:[],
    invSections:[],inventory:[makeInvItem()],equipNotes:'',
    bio:{aussehen:'',persoenlichkeit:'',faehigkeiten:'',persoenlicheDaten:'',geschichte:'',notizen:''},
    bioImages:[],bioBoxH:{equipNotes:0,aussehen:0,persoenlichkeit:0,faehigkeiten:0,persoenlicheDaten:0,geschichte:0,notizen:0},
    campNoteFolders:[{id:'cf_private',name:'🔒 Private Notizen',isPublic:false,collapsed:false,isSystem:true},{id:'cf_public',name:'🌐 Öffentliche Notizen',isPublic:true,collapsed:false,isSystem:true}],campaignNotes:[{id:'cn_main',title:'Allgemein',content:'',isPublic:false,folderId:'cf_private',updatedAt:''},{id:'cn_public',title:'Öffentliche Notiz',content:'',isPublic:true,folderId:'cf_public',updatedAt:''}],activeCampNoteId:'cn_main',
    customPalettes:[]
  };
}

export let S=defaultState();
export function setS(next){ S=next; return S; }
export let D={...DICE_DEF};
export function setD(next){ D=next; return D; }
export const CN={...CNOTES_DEF};
export const LD={...LIVEDICE_DEF};
export const FBW={...FBW_DEF};
export const diceLogs=[];
export function clearDiceLogs(){ diceLogs.length=0; }
let toastTimer=null;
export const isMobileLayout=()=>window.matchMedia('(max-width: 767px), ((max-height: 540px) and (pointer: coarse))').matches;
export const CTX_MENU={open:false,id:0,key:'',anchorEl:null,opts:null,callbacks:[],cleanupSwipe:null};
export const DUEL={outgoing:null,incoming:[],reply:null,swipeCleanup:null};
export const COMBAT={active:false,collapsed:false,hitOk:false,blockPrompt:false,blockPromptReason:'',eg:0,egMult:1,baseEg:0,isBlocked:false,blockItemRed:false,weaponId:null,ammoId:null,attackerName:'',targetCharId:'',targetName:'',dmgType:'cut',pool:'lp',zoneName:'',lastHzRoll:null,dmgMod:0,armorMod:0,posted:false};
export function syncBodyScrollLock(){
  document.body.style.overflow=(isMobileLayout()&&Boolean(D.open||CN.open||LD.open||FBW.open||UI.modal||CTX_MENU.open||DUEL.reply))?'hidden':'';
}
export function positionFloatingMenu(menuEl,anchorEl,opts={}){
  if(!menuEl) return;
  const vw=window.innerWidth, vh=window.innerHeight;
  const pad=Math.max(4,toInt(opts.pad,8));
  const gap=Math.max(0,toInt(opts.gap,6));
  menuEl.style.maxHeight='';
  menuEl.style.maxWidth=`${Math.max(160,vw-pad*2)}px`;
  const mr=menuEl.getBoundingClientRect();
  const mw=Math.min(mr.width||220,vw-pad*2);
  const mh=mr.height||200;
  let left=Math.round((vw-mw)/2), top=Math.round(Math.max(pad,(vh-mh)/2)), availH=Math.max(120,vh-pad*2);
  if(anchorEl&&anchorEl.isConnected){
    const ar=anchorEl.getBoundingClientRect();
    const preferRight=opts.align==='right';
    left=preferRight?(ar.right-mw):ar.left;
    if(left+mw>vw-pad){
      const altLeft=ar.right-mw;
      left=(altLeft>=pad)?altLeft:(vw-pad-mw);
    }
    if(left<pad) left=pad;
    const spaceBelow=vh-ar.bottom-gap-pad;
    const spaceAbove=ar.top-gap-pad;
    if(mh<=spaceBelow||spaceBelow>=spaceAbove){
      top=ar.bottom+gap;
      availH=Math.max(120,vh-top-pad);
    }else{
      availH=Math.max(120,spaceAbove);
      top=Math.max(pad,ar.top-gap-Math.min(mh,availH));
    }
  }
  menuEl.style.left=`${Math.round(left)}px`;
  menuEl.style.top=`${Math.round(top)}px`;
  menuEl.style.maxHeight=`${Math.round(Math.min(vh-pad*2,availH))}px`;
}
export function renderCtxMenuItemsHtml(items){
  const arr=Array.isArray(items)?items:[];
  return arr.map(item=>{
    if(!item) return '';
    if(item.sep||item.type==='sep') return '<div class="ctx-sep" role="separator"></div>';
    if(item.type==='label'||item.groupLabel) return `<div class="ctx-group-lbl">${esc(item.label||item.groupLabel)}</div>`;
    const cls=['ctx-item',item.active?'on':'',item.danger?'danger':'',item.cls||''].filter(Boolean).join(' ');
    const attrs=[];
    if(item.action) attrs.push(`data-action="${esc(item.action)}"`);
    if(item.keepOpen) attrs.push('data-ctx-keep-open="1"');
    if(item.tip) attrs.push(`data-tip="${esc(item.tip)}"`);
    if(item.disabled) attrs.push('disabled');
    if(item.active!==undefined) attrs.push(`aria-pressed="${item.active?'true':'false'}"`);
    if(item.dataset&&typeof item.dataset==='object'){
      Object.entries(item.dataset).forEach(([dk,dv])=>{
        if(dv===undefined||dv===null) return;
        const attrName=String(dk).replace(/[A-Z]/g,m=>'-'+m.toLowerCase());
        attrs.push(`data-${attrName}="${esc(dv)}"`);
      });
    }
    if(typeof item.onClick==='function'){
      const cbIdx=CTX_MENU.callbacks.length;
      CTX_MENU.callbacks.push(item.onClick);
      attrs.push(`data-ctx-cb="${cbIdx}"`);
    }
    const iconHtml=item.icon!==undefined&&item.icon!==''?`<span class="ctx-item-icon" aria-hidden="true">${item.iconHtml?item.icon:esc(item.icon)}</span>`:'';
    const subHtml=item.sub?`<span class="ctx-item-sub">${esc(item.sub)}</span>`:'';
    const badgeTxt=item.badge!==undefined&&item.badge!==''?String(item.badge):(item.active?'✓':'');
    const badgeHtml=badgeTxt?`<span class="ctx-item-badge">${esc(badgeTxt)}</span>`:'';
    return `<button type="button" role="menuitem" class="${cls}" ${attrs.join(' ')}><span class="ctx-item-main">${iconHtml}<span class="ctx-item-txt"><span class="ctx-item-lbl">${esc(item.label||'')}</span>${subHtml}</span></span>${badgeHtml}</button>`;
  }).join('');
}
export function bindSwipeDownClose(panelEl, handleElOrSelector, onClose){
  if(!panelEl || typeof onClose!=='function') return ()=>{};
  const INTERACTIVE_SEL='button,a,input,select,textarea,label,[role="button"],[data-ctx-close],[contenteditable="true"]';
  const resolveHandles=()=>{
    if(!handleElOrSelector) return [panelEl];
    if(typeof handleElOrSelector==='string') return Array.from(panelEl.querySelectorAll(handleElOrSelector));
    if(Array.isArray(handleElOrSelector)) return handleElOrSelector.filter(Boolean);
    return [handleElOrSelector];
  };
  const handles=resolveHandles().filter(Boolean);
  if(!handles.length) return ()=>{};
  handles.forEach(h=>{if(h&&h.style) h.style.touchAction='none';});
  const backdropEl=panelEl.previousElementSibling?.classList?.contains('ctx-backdrop')?panelEl.previousElementSibling:null;
  let active=false, dragging=false, startX=0, startY=0, lastY=0, startTs=0, lastTs=0, velY=0, curDy=0, closed=false, animTimer=null;
  const resetPanel=(animate=true)=>{
    clearTimeout(animTimer);
    panelEl.style.transition=animate?'transform 200ms cubic-bezier(.22,1,.36,1)':'';
    panelEl.style.transform='';
    if(backdropEl){
      backdropEl.style.transition=animate?'opacity 180ms ease':'';
      backdropEl.style.opacity='';
    }
    if(animate){
      animTimer=setTimeout(()=>{
        if(panelEl.isConnected) panelEl.style.transition='';
        if(backdropEl&&backdropEl.isConnected) backdropEl.style.transition='';
      },210);
    }
  };
  const onTouchStart=e=>{
    if(closed||!e.touches||e.touches.length!==1) return;
    const target=e.target;
    if(target&&target.closest&&target.closest(INTERACTIVE_SEL)) return;
    const inHandle=handles.some(h=>h===target||(h.contains&&h.contains(target)));
    if(!inHandle) return;
    const t=e.touches[0];
    clearTimeout(animTimer);
    active=true; dragging=false;
    startX=t.clientX; startY=t.clientY; lastY=t.clientY;
    startTs=Date.now(); lastTs=startTs; velY=0; curDy=0;
    panelEl.style.transition='none';
    if(backdropEl) backdropEl.style.transition='none';
  };
  const onTouchMove=e=>{
    if(!active||closed||!e.touches||e.touches.length!==1) return;
    const t=e.touches[0];
    const dx=t.clientX-startX;
    const dy=t.clientY-startY;
    if(!dragging){
      if(Math.abs(dx)>Math.abs(dy)&&Math.abs(dx)>8){
        active=false;
        resetPanel(false);
        return;
      }
      if(dy<6) return;
      dragging=true;
    }
    if(e.cancelable) e.preventDefault();
    const now=Date.now();
    const dt=now-lastTs;
    if(dt>0) velY=(t.clientY-lastY)/dt;
    curDy=Math.max(0,dy);
    lastY=t.clientY;
    lastTs=now;
    panelEl.style.transform=`translateY(${Math.round(curDy)}px)`;
    if(backdropEl){
      const h=Math.max(120,panelEl.getBoundingClientRect().height||300);
      backdropEl.style.opacity=String(Math.max(0.15,1-(curDy/h)*0.75));
    }
  };
  const onTouchEnd=()=>{
    if(!active) return;
    active=false;
    if(!dragging){
      panelEl.style.transition='';
      if(backdropEl) backdropEl.style.transition='';
      return;
    }
    dragging=false;
    const panelHeight=panelEl.getBoundingClientRect().height||window.innerHeight||300;
    const threshold=Math.min(72,Math.max(44,Math.round(panelHeight*0.2)));
    const elapsed=Math.max(1,(lastTs||Date.now())-startTs);
    const avgVel=curDy/elapsed;
    const fastFlick=curDy>=24&&(velY>=0.45||(avgVel>=0.5&&velY>=0));
    if(curDy>=threshold||fastFlick){
      closed=true;
      panelEl.style.transition='transform 160ms ease-out';
      panelEl.style.transform=`translateY(${Math.ceil(panelHeight)}px)`;
      if(backdropEl){
        backdropEl.style.transition='opacity 150ms ease-out';
        backdropEl.style.opacity='0';
      }
      animTimer=setTimeout(()=>{try{onClose();}catch(err){console.error(err);}},150);
    }else{
      resetPanel(true);
    }
  };
  const onTouchCancel=()=>{
    if(!active) return;
    active=false; dragging=false;
    resetPanel(true);
  };
  panelEl.addEventListener('touchstart',onTouchStart,{passive:true});
  panelEl.addEventListener('touchmove',onTouchMove,{passive:false});
  panelEl.addEventListener('touchend',onTouchEnd,{passive:true});
  panelEl.addEventListener('touchcancel',onTouchCancel,{passive:true});
  return ()=>{
    clearTimeout(animTimer);
    panelEl.removeEventListener('touchstart',onTouchStart);
    panelEl.removeEventListener('touchmove',onTouchMove);
    panelEl.removeEventListener('touchend',onTouchEnd);
    panelEl.removeEventListener('touchcancel',onTouchCancel);
  };
}
export function closeCtxMenu(opts={}){
  const mount=$('ctxMenuMount');
  if(!CTX_MENU.open&&(!mount||!mount.childElementCount)) return false;
  const prevAnchor=CTX_MENU.anchorEl;
  const onClose=CTX_MENU.opts?.onClose;
  if(typeof CTX_MENU.cleanupSwipe==='function'){
    try{CTX_MENU.cleanupSwipe();}catch(_){}
  }
  CTX_MENU.cleanupSwipe=null;
  CTX_MENU.open=false;
  CTX_MENU.key='';
  CTX_MENU.anchorEl=null;
  CTX_MENU.opts=null;
  CTX_MENU.callbacks=[];
  if(mount) mount.innerHTML='';
  if(prevAnchor&&prevAnchor.isConnected) prevAnchor.setAttribute('aria-expanded','false');
  syncBodyScrollLock();
  hooks.hideTooltip?.();
  if(!opts.silent&&typeof onClose==='function'){
    try{onClose();}catch(err){console.error(err);}
  }
  return true;
}
export function openCtxMenu(opts={}){
  const key=String(opts.key||'');
  if(key&&CTX_MENU.open&&CTX_MENU.key===key&&!opts.forceOpen){
    closeCtxMenu();
    return false;
  }
  if(CTX_MENU.open) closeCtxMenu({silent:true});
  closePwDropdown();
  const mount=$('ctxMenuMount');
  if(!mount) return false;
  const id=++CTX_MENU.id;
  const sheet=isMobileLayout();
  CTX_MENU.open=true;
  CTX_MENU.key=key;
  CTX_MENU.anchorEl=opts.anchorEl||null;
  CTX_MENU.opts=opts;
  CTX_MENU.callbacks=[];
  const bodyHtml=typeof opts.html==='string'?opts.html:renderCtxMenuItemsHtml(opts.items||[]);
  const titleTxt=String(opts.title||'').trim();
  if(sheet){
    mount.innerHTML=`<div class="ctx-backdrop fixed inset-0 z-[79]" data-ctx-backdrop="1"></div><div id="ctxMenuPanel" class="ctx-menu ctx-sheet fixed inset-x-0 bottom-0 z-[80]" role="menu" data-ctx-id="${id}" data-ctx-mode="sheet"><div class="ctx-sheet-handle" aria-hidden="true"></div><div class="ctx-hdr"><span class="ctx-hdr-title">${esc(titleTxt||'Aktionen')}</span><button type="button" data-ctx-close="1" aria-label="Menü schließen" class="btn py-1 px-2.5 text-xs font-black shrink-0">✕</button></div><div class="ctx-body max-h-[75dvh] overflow-y-auto">${bodyHtml}</div></div>`;
    const panel=$('ctxMenuPanel');
    if(panel) CTX_MENU.cleanupSwipe=bindSwipeDownClose(panel,'.ctx-sheet-handle, .ctx-hdr',()=>closeCtxMenu());
  }else{
    const minWStyle=opts.minWidth?` style="min-width:${Math.max(140,toInt(opts.minWidth,210))}px"`:'';
    const hdrHtml=titleTxt?`<div class="ctx-hdr"><span class="ctx-hdr-title">${esc(titleTxt)}</span>${opts.showClose?'<button type="button" data-ctx-close="1" aria-label="Menü schließen" class="btn py-0.5 px-1.5 text-[10px] font-black shrink-0">✕</button>':''}</div>`:'';
    mount.innerHTML=`<div id="ctxMenuPanel" class="ctx-menu ctx-popover fixed z-[80]" role="menu" data-ctx-id="${id}" data-ctx-mode="popover"${minWStyle}>${hdrHtml}<div class="ctx-body">${bodyHtml}</div></div>`;
    const panel=$('ctxMenuPanel');
    if(panel) positionFloatingMenu(panel,opts.anchorEl||null,opts);
  }
  if(opts.anchorEl&&opts.anchorEl.isConnected) opts.anchorEl.setAttribute('aria-expanded','true');
  hooks.hideTooltip?.();
  syncBodyScrollLock();
  return true;
}
export function closePwDropdown(){
  if(!UI.openPwMenu&&!document.querySelector('.pw-dd-menu')) return false;
  UI.openPwMenu='';
  document.querySelectorAll('.pw-dd-menu').forEach(m=>m.remove());
  document.querySelectorAll('[data-action="toggle-pw-dd"][aria-expanded="true"]').forEach(b=>{b.setAttribute('aria-expanded','false');b.classList.remove('bdr-acc');});
  document.querySelectorAll('.card,.subcard').forEach(c=>{if(c.classList.contains('z-[25]'))c.classList.remove('z-[25]','!overflow-visible','relative');});
  hooks.hideTooltip?.();
  return true;
}
export function positionPwDropdown(menuEl){
  if(!menuEl||!menuEl.isConnected) return;
  const wrap=menuEl.closest('.pw-dd-wrap')||menuEl.parentElement;
  if(!wrap) return;
  const vw=window.innerWidth, vh=window.innerHeight, pad=12, gap=4;
  const maxW=Math.max(160,vw-pad*2);
  menuEl.style.left='';
  menuEl.style.right='';
  menuEl.style.top='';
  menuEl.style.bottom='';
  menuEl.style.maxHeight='';
  menuEl.style.minWidth='';
  menuEl.style.maxWidth=`${maxW}px`;
  const wr=wrap.getBoundingClientRect();
  const mr=menuEl.getBoundingClientRect();
  if(mr.left<pad||mr.right>vw-pad){
    const mw=Math.min(Math.max(mr.width||190,wr.width||0),maxW);
    menuEl.style.minWidth=`${Math.round(mw)}px`;
    let targetLeft=mr.left;
    if(targetLeft+mw>vw-pad) targetLeft=vw-pad-mw;
    if(targetLeft<pad) targetLeft=pad;
    menuEl.style.left=`${Math.round(targetLeft-wr.left)}px`;
    menuEl.style.right='auto';
  }
  const spaceBelow=vh-wr.bottom-gap-pad;
  const spaceAbove=wr.top-gap-pad;
  const natH=menuEl.scrollHeight||mr.height||160;
  if(natH>spaceBelow&&spaceAbove>spaceBelow){
    menuEl.style.top='auto';
    menuEl.style.bottom=`calc(100% + ${gap}px)`;
    menuEl.style.maxHeight=`${Math.max(120,Math.floor(Math.min(vh*0.65,spaceAbove)))}px`;
  }else{
    menuEl.style.top=`calc(100% + ${gap}px)`;
    menuEl.style.bottom='auto';
    menuEl.style.maxHeight=`${Math.max(120,Math.floor(Math.min(vh*0.65,Math.max(120,spaceBelow))))}px`;
  }
}
export function repositionOpenPwMenus(){
  if(!UI.openPwMenu) return;
  document.querySelectorAll('.pw-dd-menu').forEach(m=>positionPwDropdown(m));
}
let WIN_PREFS_CACHE={};
export const getWinState=k=>k==='cnotes'?CN:k==='livedice'?LD:k==='fbadmin'?FBW:D;
export function loadAllWinPrefs(){
  try{
    const raw=localStorage.getItem(WIN_PREFS_KEY);
    if(!raw) return {};
    const parsed=JSON.parse(raw);
    if(!parsed||typeof parsed!=='object') return {};
    const out={};
    WIN_KEYS.forEach(k=>{
      const p=parsed[k];
      if(!p||typeof p!=='object') return;
      const w=Number.isFinite(Number(p.w))?Math.max(0,Math.round(Number(p.w))):0;
      const h=Number.isFinite(Number(p.h))?Math.max(0,Math.round(Number(p.h))):0;
      const x=(p.x!==null&&p.x!==undefined&&p.x!==''&&Number.isFinite(Number(p.x)))?Math.round(Number(p.x)):null;
      const y=(p.y!==null&&p.y!==undefined&&p.y!==''&&Number.isFinite(Number(p.y)))?Math.round(Number(p.y)):null;
      const floating=Boolean(p.floating);
      out[k]={w,h,x,y,floating};
    });
    return out;
  }catch(e){return {};}
}
export function writeAllWinPrefs(map){
  WIN_PREFS_CACHE=map&&typeof map==='object'?{...map}:{};
  try{
    if(!Object.keys(WIN_PREFS_CACHE).length) localStorage.removeItem(WIN_PREFS_KEY);
    else localStorage.setItem(WIN_PREFS_KEY,JSON.stringify(WIN_PREFS_CACHE));
  }catch(e){}
}
export function hydrateWinPrefs(){
  WIN_PREFS_CACHE=loadAllWinPrefs();
  WIN_KEYS.forEach(k=>{
    const p=WIN_PREFS_CACHE[k];
    if(!p) return;
    const st=getWinState(k);
    if(!st) return;
    st.w=p.w; st.h=p.h; st.x=p.x; st.y=p.y; st.floating=Boolean(p.floating);
    if(st.floating) st.docked=false;
  });
}
export function saveWinPref(k){
  if(!WIN_KEYS.includes(k)||isMobileLayout()) return;
  const st=getWinState(k);
  if(!st) return;
  const all=loadAllWinPrefs();
  all[k]={
    w:st.w>0?Math.round(st.w):0,
    h:st.h>0?Math.round(st.h):0,
    x:(st.x!==null&&st.x!==undefined&&Number.isFinite(Number(st.x)))?Math.round(Number(st.x)):null,
    y:(st.y!==null&&st.y!==undefined&&Number.isFinite(Number(st.y)))?Math.round(Number(st.y)):null,
    floating:Boolean(st.floating)
  };
  writeAllWinPrefs(all);
}
export function clearWinPref(k){
  if(!WIN_KEYS.includes(k)) return;
  const all=loadAllWinPrefs();
  delete all[k];
  writeAllWinPrefs(all);
}
export const hasSavedWinPref=k=>Boolean(WIN_PREFS_CACHE&&WIN_PREFS_CACHE[k]);
export function applyWinFrame(k,mount,bd,defWClass){
  if(!mount) return;
  const st=getWinState(k);
  if(!st.open){mount.className='hidden';mount.style.cssText='';if(bd)bd.classList.add('hidden');syncBodyScrollLock();return;}
  if(isMobileLayout()){
    if(bd) bd.classList.add('hidden');
    mount.className='win-mobile-frame';
    mount.style.cssText='';
    syncBodyScrollLock();
    return;
  }
  const vw=window.innerWidth, vh=window.innerHeight;
  const defCfg=WIN_DEFAULTS[k]||WIN_DEFAULTS.dice;
  const canDock=vw>=1280;
  const isDock=Boolean(st.docked&&canDock&&!UI.inLobby&&!st.floating);
  if(bd) bd.classList.toggle('hidden', isDock || Boolean(st.floating));
  if(isDock){
    const dockCls=defWClass||defCfg.dockClass;
    mount.className='w-full '+dockCls+' shrink-0 xl:sticky xl:top-24 z-30 win-dock-h overflow-hidden flex flex-col relative rounded-2xl';
    const layoutW=Math.min(vw,1600)-84;
    const maxDockW=Math.max(360,Math.min(Math.round(layoutW*0.48),layoutW-560));
    const dockStyles=[];
    if(st.w>280){
      dockStyles.push(`width:${Math.max(320,Math.min(maxDockW,st.w))}px`,'max-width:92vw','position:sticky');
    }
    if(st.h>0){
      const maxDockH=Math.max(280,vh-112);
      const effDockH=Math.max(Math.min(280,maxDockH),Math.min(maxDockH,st.h));
      dockStyles.push(`height:${effDockH}px`,`max-height:${maxDockH}px`);
    }
    mount.style.cssText=dockStyles.join(';');
  }else if(st.floating){
    const pad=12;
    const maxW=Math.max(240,vw-pad*2);
    const maxH=Math.max(200,vh-pad*2);
    const minW=Math.min(320,maxW);
    const minH=Math.min(280,maxH);
    const defFloatW=Math.min(defCfg.w,Math.max(minW,vw-48));
    const w=Math.max(minW,Math.min(maxW,st.w>280?st.w:defFloatW));
    const defFloatH=Math.min(720,Math.max(minH,vh-80));
    const h=Math.max(minH,Math.min(maxH,st.h>0?st.h:defFloatH));
    const maxX=Math.max(pad,vw-w-pad);
    const maxY=Math.max(pad,vh-h-pad);
    const x=st.x!==null?Math.max(pad,Math.min(maxX,st.x)):Math.max(pad,Math.round((vw-w)/2));
    const y=st.y!==null?Math.max(pad,Math.min(maxY,st.y)):Math.max(pad,Math.min(maxY,70));
    const availH=Math.max(minH,Math.min(maxH,vh-y-pad));
    const effH=Math.min(h,availH);
    mount.className='fixed z-50 overflow-hidden flex flex-col shadow-2xl rounded-2xl';
    mount.style.cssText=`position:fixed!important;left:${x}px;top:${y}px;width:${w}px;max-width:${maxW}px;height:${effH}px;max-height:${availH}px;z-index:${st.z||50};margin:0;right:auto;bottom:auto`;
  }else{
    const maxDw=Math.max(240,vw-32);
    const minDw=Math.min(320,maxDw);
    const defDrawerW=Math.min(defCfg.w,Math.max(minDw,vw-48));
    const dw=Math.max(minDw,Math.min(maxDw,st.w>280?st.w:defDrawerW));
    const topOff=vh<640?12:80, botOff=vh<640?12:24;
    const maxDh=Math.max(240,vh-topOff-botOff);
    const minDh=Math.min(280,maxDh);
    const hasCustomH=st.h>0;
    const hCss=hasCustomH
      ?`bottom:auto;height:${Math.max(minDh,Math.min(maxDh,st.h))}px;max-height:${maxDh}px;`
      :`bottom:${botOff}px;height:calc(100vh - ${topOff+botOff}px);height:calc(100dvh - ${topOff+botOff}px);max-height:calc(100vh - ${topOff+botOff}px);max-height:calc(100dvh - ${topOff+botOff}px);`;
    mount.className='fixed z-50 overflow-hidden flex flex-col shadow-2xl rounded-2xl';
    mount.style.cssText=`position:fixed!important;left:0;right:0;top:${topOff}px;${hCss}margin-left:auto;margin-right:auto;width:${dw}px;max-width:calc(100vw - 2rem);z-index:${st.z||50}`;
  }
  syncBodyScrollLock();
}
export function renderWinCtrlBtns(k){
  if(isMobileLayout()) return '';
  const st=getWinState(k), hasCustom=Boolean(st.w||st.h||st.x!==null||st.y!==null||st.floating||hasSavedWinPref(k));
  return '<button type="button" data-action="win-float" data-win="'+k+'" data-tip="Freies Fenster (ohne dunklen Hintergrund, frei verschiebbar & parallel nutzbar)" class="hidden md:inline-flex btn py-1 px-2 text-xs '+(st.floating?'btn-pri':'')+'">🪟 Frei</button>'+(hasCustom?'<button type="button" data-action="win-reset" data-win="'+k+'" data-tip="Fenstergröße & Position zurücksetzen" class="hidden md:inline-flex btn py-1 px-1.5 text-xs">↺</button>':'');
}
export function renderWinResizeHandles(k){return '<div data-win-resize-w="'+k+'" title="Breite ziehen" class="win-resize-w"></div><div data-win-resize="'+k+'" title="Größe ziehen" class="win-resize-h">◢</div>';}
export const savedEffRanges={}, savedPwRanges={}, lastPwFieldById={};
let modalSwipeCleanup=null;
export function setModalSwipeCleanup(fn){ modalSwipeCleanup=fn; }
export function cleanupModalSwipe(){if(typeof modalSwipeCleanup==='function'){try{modalSwipeCleanup();}catch(_){}}modalSwipeCleanup=null;}
export const loadPwMode=()=>{try{return localStorage.getItem(PW_MODE_KEY)==='edit'?'edit':'view';}catch(e){return 'view';}};
export const pwQuickKey=(kind,id)=>`${kind==='augment'?'augment':'power'}:${id}`;
export let UI={inLobby:true,sheetLoaded:false,modal:null,profileUser:'',adminReturnModal:'',adminPinError:'',adminIconTargetKey:'',confirmResetAllIcons:false,mobileHdrOpen:false,mobileLobbyMenuOpen:false,infoTab:'dice',glossSearch:'',listType:'art',ammoModalWeaponId:'',arZoneDrafts:{},skSort:{col:'',asc:true},editSkNameId:null,skMobExp:{},imgTargetKind:'',imgTargetId:'',imgZoomOpen:false,imgReturnModal:'',confirmNew:false,confirmLog:false,confirmDelId:null,confirmDelSecId:null,confirmSecPullId:null,confirmDelSkId:null,confirmDelSkSecId:null,confirmSkSecPullId:null,confirmDelInvSecId:null,confirmDelExSecId:null,confirmHzStep:1,openPwMenu:'',dupPwWarn:null,pwMode:loadPwMode(),pwQuickEditIds:new Set(),pwFilterOpen:false,pwFilterMode:'or',pwFilterTypes:[],pwFilterIncludeLinkedAugs:true,pwFilterArts:[],pwFilterActionSubs:[],pwFilterTags:[],pwFilterTiers:[],confirmDelEqKey:'',tab1:{attrs:null,attrPairs:{},sec:null,status:null,insp:null,res:null,thresholds:null,move:null,hz:null,quick:null},tab5:{equipNotes:null,bioSec:false,bioGallery:null,bioFields:{}},statusIniPromptKey:'',lastRollHtml:'',lastBlockBaseHtml:'',lastBlockFollowRes:null,lastSecretRollId:'',secretRollsCollapsed:false,colTarget:'cres',colMode:'text',colPwKind:'power',colPwId:'',colDraft:'#c084fc',attrGroupSel:'ST_KO',palBuilderOpen:false,palDraft:{name:'',isLt:false,bg:'#020617',acc:'#0ea5e9',acc2:'#6366f1',txt:'#f1f5f9',mut:'#94a3b8',btnTxt:'#ffffff'}};
export function setPwMode(mode){
  const m=mode==='edit'?'edit':'view';
  UI.pwMode=m;
  if(UI.pwQuickEditIds instanceof Set) UI.pwQuickEditIds.clear();
  else UI.pwQuickEditIds=new Set();
  try{localStorage.setItem(PW_MODE_KEY,m);}catch(e){}
  closePwDropdown();
  closeCtxMenu();
  hooks.renderMain?.();
}
export const LIVE_TAB_ID=uid();
export let PATCHNOTES = { loaded:false, loading:false, saving:false, error:'', entries:[], lastLoadedTs:'', editingId:null, draft:null, confirmDelId:null, sortOrder:'desc', collapsedIds:{} };
export let FEEDBACK = { loaded:false, loading:false, saving:false, error:'', lastLoadedTs:'', folders: clone(DEF_FB_FOLDERS), items:[], backlog:[], activeTab:'write', activeFolderId:'all', sortBy:'newest', selectedId:'', backlogUser:'all', draftTitle:'', draftHtml:'', replyDrafts:{}, confirmDelId:null, confirmDelFolderId:null, newFolderName:'' };
export function normalizeCampaigns(rawCamps){
  const list=Array.isArray(rawCamps)?rawCamps.filter(c=>c&&typeof c==='object'&&String(c.id||'').trim()).map(c=>{
    const id=String(c.id).trim();
    const rawName=c.name!==undefined&&c.name!==null?String(c.name).trim():'';
    const hasName=rawName!==''&&!(id==='default'&&rawName==='Hauptkampagne');
    return {
      id,
      name:hasName?rawName:(id==='default'?'Ohne Kampagne / Allgemein':'Kampagne'),
      allowedUsers:Array.isArray(c.allowedUsers)?[...new Set(c.allowedUsers.map(u=>String(u||'').trim()).filter(Boolean))]:[],
      gmUsers: id==='default'?[]:(Array.isArray(c.gmUsers)?[...new Set(c.gmUsers.map(u=>String(u||'').trim()).filter(Boolean))]:[]),
      img: String(c.img||''),
      color: isHex(c.color)?c.color:'',
      bgColor: isHex(c.bgColor)?c.bgColor:''
    };
  }):[];
  if(!list.length){
    list.push({id:'default',name:'Ohne Kampagne / Allgemein',allowedUsers:[],gmUsers:[],img:''});
  }else if(!list.some(c=>c.id==='default')){
    list.unshift({id:'default',name:'Ohne Kampagne / Allgemein',allowedUsers:[],gmUsers:[],img:''});
  }
  return list;
}
let themeSyncTimer=null, themeSyncPending=false, lastThemeBgWarnMs=0;

export function normalizeCustomPalettesList(rawList){
  const map=new Map();
  (Array.isArray(rawList)?rawList:[]).forEach(cp=>{
    if(cp&&typeof cp==='object'&&cp.id&&isHex(cp.bg)&&isHex(cp.acc)&&isHex(cp.acc2)){
      const id=String(cp.id).trim();
      if(!id) return;
      const isLt=Boolean(cp.isLt);
      map.set(id,{
        id,
        name:String(cp.name||'Eigene Palette').trim()||'Eigene Palette',
        isLt,
        bg:String(cp.bg).trim(),
        acc:String(cp.acc).trim(),
        acc2:String(cp.acc2).trim(),
        txt:isHex(cp.txt)?String(cp.txt).trim():(isLt?'#0f172a':'#f1f5f9'),
        mut:isHex(cp.mut)?String(cp.mut).trim():(isLt?'#64748b':'#94a3b8'),
        btnTxt:isHex(cp.btnTxt)?String(cp.btnTxt).trim():'#ffffff'
      });
    }
  });
  return [...map.values()];
}
export function normalizeThemeSlot(rawSlot,customPals=[]){
  const s=(rawSlot&&typeof rawSlot==='object')?rawSlot:{};
  const palId=String(s.palette||'azur');
  const isValidPal=Boolean(PALETTES[palId]||(Array.isArray(customPals)&&customPals.some(cp=>cp&&cp.id===palId)));
  let cc=null;
  if(s.customColors&&typeof s.customColors==='object'&&isHex(s.customColors.bg)){
    const isLt=Boolean(s.customColors.isLt);
    cc={
      name:String(s.customColors.name||''),
      isLt,
      bg:String(s.customColors.bg).trim(),
      acc:isHex(s.customColors.acc)?String(s.customColors.acc).trim():'#0ea5e9',
      acc2:isHex(s.customColors.acc2)?String(s.customColors.acc2).trim():'#6366f1',
      txt:isHex(s.customColors.txt)?String(s.customColors.txt).trim():(isLt?'#0f172a':'#f1f5f9'),
      mut:isHex(s.customColors.mut)?String(s.customColors.mut).trim():(isLt?'#64748b':'#94a3b8'),
      btnTxt:isHex(s.customColors.btnTxt)?String(s.customColors.btnTxt).trim():'#ffffff'
    };
  }
  return {
    palette:isValidPal?palId:'azur',
    bg:typeof s.bg==='string'?s.bg:'',
    overlay:Math.max(0,Math.min(95,toInt(s.overlay,75))),
    blur:Math.max(0,Math.min(20,toInt(s.blur,0))),
    fit:['cover','contain'].includes(s.fit)?s.fit:'cover',
    pos:['top','center','bottom'].includes(s.pos)?s.pos:'center',
    customColors:cc
  };
}
export function normalizeThemeSheet(rawSheet,customPals=[]){
  const sh=(rawSheet&&typeof rawSheet==='object')?rawSheet:{};
  const tabs={};
  TABS.forEach(t=>{tabs[t.id]=normalizeThemeSlot(sh.tabs?.[t.id],customPals);});
  return {
    mode:sh.mode==='perTab'?'perTab':'global',
    global:normalizeThemeSlot(sh.global,customPals),
    tabs
  };
}
export function normalizeThemePrefs(raw){
  if(!raw||typeof raw!=='object') return null;
  const customPalettes=normalizeCustomPalettesList(raw.customPalettes);
  const dark=raw.dark!==undefined?Boolean(raw.dark):true;
  const lobby=normalizeThemeSlot(raw.lobby,customPalettes);
  const sheet=normalizeThemeSheet(raw.sheet,customPalettes);
  const sheetByChar={};
  if(raw.sheetByChar&&typeof raw.sheetByChar==='object'){
    Object.entries(raw.sheetByChar).forEach(([cid,entry])=>{
      const id=String(cid||'').trim();
      if(!id||!entry||typeof entry!=='object') return;
      const normSh=normalizeThemeSheet(entry,customPalettes);
      sheetByChar[id]={
        dark:entry.dark!==undefined?Boolean(entry.dark):dark,
        mode:normSh.mode,
        global:normSh.global,
        tabs:normSh.tabs,
        updatedAtMs:Math.max(0,toInt(entry.updatedAtMs,0))
      };
    });
  }
  const isSlotNonDefault=sl=>Boolean(sl&&(sl.palette!=='azur'||sl.bg||sl.customColors||sl.overlay!==75||sl.blur!==0||sl.fit!=='cover'||sl.pos!=='center'));
  const inferredSheetCustomized=Boolean(
    sheet.mode==='perTab'||
    isSlotNonDefault(sheet.global)||
    TABS.some(t=>isSlotNonDefault(sheet.tabs[t.id]))||
    Object.keys(sheetByChar).length>0
  );
  return {
    dark,
    lobby,
    sheet,
    sheetByChar,
    customPalettes,
    sheetCustomized:raw.sheetCustomized!==undefined?Boolean(raw.sheetCustomized):inferredSheetCustomized,
    updatedAtMs:Math.max(0,toInt(raw.updatedAtMs,0))
  };
}
export function createDefaultThemePrefs(){
  return normalizeThemePrefs({dark:true,lobby:makeStyleSlot(),sheet:{mode:'global',global:makeStyleSlot(),tabs:{}},sheetByChar:{},customPalettes:[],sheetCustomized:false,updatedAtMs:0});
}
export function mergeThemePrefs(localRaw,remoteRaw,preferLocalOnTie=false){
  const loc=normalizeThemePrefs(localRaw), rem=normalizeThemePrefs(remoteRaw);
  if(!loc&&!rem) return null;
  if(!loc) return rem;
  if(!rem) return loc;
  const locTs=toInt(loc.updatedAtMs,0), remTs=toInt(rem.updatedAtMs,0);
  const locWins=(locTs>remTs)||(locTs===remTs&&preferLocalOnTie);
  const win=locWins?loc:rem, lose=locWins?rem:loc;
  const mergedByChar={};
  const allCids=new Set([...Object.keys(lose.sheetByChar||{}),...Object.keys(win.sheetByChar||{})]);
  allCids.forEach(cid=>{
    const eW=win.sheetByChar?.[cid], eL=lose.sheetByChar?.[cid];
    if(eW&&!eL) mergedByChar[cid]=clone(eW);
    else if(eL&&!eW) mergedByChar[cid]=clone(eL);
    else if(eW&&eL){
      const wTs=toInt(eW.updatedAtMs,win.updatedAtMs), lTs=toInt(eL.updatedAtMs,lose.updatedAtMs);
      mergedByChar[cid]=clone(lTs>wTs?eL:eW);
    }
  });
  return normalizeThemePrefs({
    dark:win.dark,
    lobby:clone(win.lobby),
    sheet:clone(win.sheet),
    sheetByChar:mergedByChar,
    customPalettes:clone(win.customPalettes),
    sheetCustomized:Boolean(win.sheetCustomized||Object.keys(mergedByChar).length>0),
    updatedAtMs:Math.max(locTs,remTs)
  });
}
export function isOversizedBgDataUrl(bg){
  return typeof bg==='string'&&bg.startsWith('data:')&&bg.length>THEME_BG_SYNC_LIMIT;
}
export function getUserBgLocalKey(userKey){
  const low=String(userKey||'').trim().toLowerCase();
  return low?(USER_BG_LOCAL_PREFIX+low):'';
}
export function loadUserLocalBgMap(userKey){
  const k=getUserBgLocalKey(userKey);
  if(!k) return {};
  try{
    const raw=localStorage.getItem(k);
    if(!raw) return {};
    const parsed=JSON.parse(raw);
    return (parsed&&typeof parsed==='object')?parsed:{};
  }catch(e){return {};}
}
export function saveUserLocalBgMap(userKey,map){
  const k=getUserBgLocalKey(userKey);
  if(!k) return;
  try{
    const clean={};
    Object.entries(map||{}).forEach(([sk,val])=>{
      if(sk&&typeof val==='string'&&val) clean[sk]=val;
    });
    if(!Object.keys(clean).length) localStorage.removeItem(k);
    else localStorage.setItem(k,JSON.stringify(clean));
  }catch(e){}
}
export function migrateUserLocalBgMap(oldUserKey,newUserKey){
  const oldK=getUserBgLocalKey(oldUserKey), newK=getUserBgLocalKey(newUserKey);
  if(!oldK||!newK||oldK===newK) return;
  try{
    const val=localStorage.getItem(oldK);
    if(val!==null){
      localStorage.setItem(newK,val);
      localStorage.removeItem(oldK);
    }
  }catch(e){}
}
export function sanitizeThemePrefsForRegistry(rawTp,userKey){
  const tp=normalizeThemePrefs(rawTp);
  if(!tp) return {cleanPrefs:null,hadOversized:false};
  let hadOversized=false;
  const canStoreLocal=Boolean(userKey);
  const localMap=canStoreLocal?loadUserLocalBgMap(userKey):{};
  let localMapChanged=false;
  const cleanSlot=(sl,slotPath)=>{
    if(!sl||typeof sl!=='object') return sl;
    if(isOversizedBgDataUrl(sl.bg)){
      hadOversized=true;
      if(canStoreLocal&&localMap[slotPath]!==sl.bg){
        localMap[slotPath]=sl.bg;
        localMapChanged=true;
      }
      sl.bg='';
    }else if(sl.bg&&canStoreLocal&&localMap[slotPath]){
      delete localMap[slotPath];
      localMapChanged=true;
    }
    return sl;
  };
  cleanSlot(tp.lobby,'lobby');
  cleanSlot(tp.sheet.global,'sheet:global');
  TABS.forEach(t=>cleanSlot(tp.sheet.tabs[t.id],`sheet:tab:${t.id}`));
  Object.entries(tp.sheetByChar||{}).forEach(([cid,entry])=>{
    cleanSlot(entry.global,`char:${cid}:global`);
    TABS.forEach(t=>cleanSlot(entry.tabs[t.id],`char:${cid}:tab:${t.id}`));
  });
  if(localMapChanged&&canStoreLocal) saveUserLocalBgMap(userKey,localMap);
  return {cleanPrefs:tp,hadOversized};
}
export function hydrateThemeSlotBg(slot,localBgMap,slotPath){
  const out=clone(slot||makeStyleSlot());
  if(!out.bg&&localBgMap&&typeof localBgMap[slotPath]==='string'&&localBgMap[slotPath]){
    out.bg=localBgMap[slotPath];
  }
  return out;
}
export function compressBgDataUrlForProfile(dataUrl,maxChars,cb){
  const lim=maxChars||THEME_BG_SYNC_LIMIT;
  if(!isOversizedBgDataUrl(dataUrl)){cb(String(dataUrl||''),false);return;}
  const im=new Image();
  im.onload=()=>{
    const steps=[[1200,0.72],[1024,0.64],[880,0.56],[740,0.48],[620,0.42],[500,0.35]];
    const ow=im.width||1, oh=im.height||1;
    for(const [maxD,q] of steps){
      let w=ow, h=oh;
      if(w>maxD||h>maxD){
        if(w>h){h=Math.max(1,Math.round(h*maxD/w));w=maxD;}
        else{w=Math.max(1,Math.round(w*maxD/h));h=maxD;}
      }
      const cv=document.createElement('canvas');
      cv.width=w; cv.height=h;
      cv.getContext('2d').drawImage(im,0,0,w,h);
      let out=cv.toDataURL('image/webp',q);
      if(!out.startsWith('data:image/webp')) out=cv.toDataURL('image/jpeg',q);
      if(out.length<=lim){cb(out,true);return;}
      const outJpg=cv.toDataURL('image/jpeg',Math.max(0.3,q-0.06));
      if(outJpg.length<=lim){cb(outJpg,true);return;}
    }
    cb(dataUrl,false);
  };
  im.onerror=()=>cb(dataUrl,false);
  im.src=dataUrl;
}

export const CLOUD={serverUrl:'',list:[],loading:false,syncing:false,error:'',lastSyncTs:'',viewingRemote:false,remoteCharId:'',confirmDelCloudId:null,confirmDelCampPageId:null,filterMine:false,currentUser:'',isAdmin:false,showAdminBar:false,userMgmtOpen:false,activeCampaignId:'default',campAction:'',newCharOpen:false,newCharName:'',newCharAncestry:'',newCharConcept:'',newCharCampId:'default',publicNotesOpen:true,activePublicPageKey:'',registryLoaded:false,diceFeed:[],secretRolls:[],diceConnected:false,diceToast:true,diceCollapsed:false,lobbyDiceH:340,galleryCollapsed:false,confirmClearDice:false,registry:{users:{},claims:{},charCampaigns:{},publicNotes:{},campaignSharedNotes:{},deletedCharIds:[],campaigns:[{id:'default',name:'Ohne Kampagne / Allgemein',allowedUsers:[],gmUsers:[],img:''}],gmUsers:[],lobbyLogo:'',adminHash:'',diceFeed:[],diceClearedAt:0,diceClearedByCamp:{}}};
export const CLOUD_SYNC={inFlight:false,inFlightPromise:null,dirty:false,seq:0,syncedSeq:0,status:'saved',debounceTimer:null,retryTimer:null,retryStep:0,lastMetaSig:'',lastMetaCharId:'',pendingSilent:true,pendingForceRegistry:false,lastError:''};
export const PWLIB={loaded:false,loading:false,saving:false,error:'',repoPacks:[],cloudPacks:[],tab:'server',search:'',filterCat:'',filterTier:'',selectedPackId:'',openCats:{},openPacks:{},openAugFolders:{},selSecIds:{},selPwIds:{},selAugIds:{},targetSecId:'',dedupeMode:'skipExisting',lastLoadedTs:'',adminSrc:'all',adminName:'',adminCat:'Allgemein',adminDesc:'',adminIsBasis:false,confirmDelPackId:''};
export function getCampaigns(){
  CLOUD.registry.campaigns=normalizeCampaigns(CLOUD.registry?.campaigns);
  return CLOUD.registry.campaigns;
}
export function setActiveCampaign(campId){
  const id=String(campId||'default').trim()||'default';
  CLOUD.activeCampaignId=id;
  try{localStorage.setItem('scherbensturm_active_campaign',id);}catch(e){}
  CLOUD.confirmClearDice=false;
  hooks.updateLobbyLiveDiceDOM?.();
}
export function isUserInCampaign(camp,username){
  const u=String(username||'').trim().toLowerCase();
  if(!u) return false;
  return Array.isArray(camp?.allowedUsers)&&camp.allowedUsers.some(x=>String(x||'').trim().toLowerCase()===u);
}
export function isGlobalGM(username=CLOUD.currentUser){const u=String(username||'').trim().toLowerCase();return Boolean(u&&Array.isArray(CLOUD.registry?.gmUsers)&&CLOUD.registry.gmUsers.some(x=>String(x||'').trim().toLowerCase()===u));}
export function isCampaignMainGM(campOrId,username=CLOUD.currentUser){const u=String(username||'').trim().toLowerCase();if(!u||!isGlobalGM(u))return false;const c=typeof campOrId==='string'?getCampaigns().find(x=>x.id===campOrId):campOrId;if(!c||c.id==='default')return false;return Array.isArray(c.gmUsers)&&c.gmUsers.some(x=>String(x||'').trim().toLowerCase()===u);}
export function canManageCampaign(campOrId,username=CLOUD.currentUser){if(CLOUD.isAdmin) return true; return isCampaignMainGM(campOrId, username);}
export function canClearLiveDice(campOrId=getActiveLiveCampaignId(),username=CLOUD.currentUser){
  if(CLOUD.isAdmin) return true;
  const u=String(username||'').trim().toLowerCase();
  if(!u) return false;
  const c=typeof campOrId==='string'?getCampaigns().find(x=>x.id===campOrId):campOrId;
  if(!c||c.id==='default') return false;
  const inCampGmList=Array.isArray(c.gmUsers)&&c.gmUsers.some(x=>String(x||'').trim().toLowerCase()===u);
  const isGmInCamp=isGlobalGM(u)&&(inCampGmList||isUserInCampaign(c,u));
  return Boolean(inCampGmList||isGmInCamp);
}
export function getAccessibleCampaigns(username=CLOUD.currentUser){
  const all=getCampaigns(); if(CLOUD.isAdmin) return all;
  return all.filter(c=>c.id==='default'||(username&&(isUserInCampaign(c,username)||isCampaignMainGM(c,username))));
}
export function getCreatableCampaigns(username=CLOUD.currentUser){
  if(!username&&!CLOUD.isAdmin) return [];
  return getAccessibleCampaigns(username);
}
export function makeLegacyUserId(username,createdAt,usedIds){
  const base='usr_'+simpleHash('legacy:'+String(username||'').trim().toLowerCase()+':'+String(createdAt||''));
  let taken=usedIds instanceof Set?usedIds:null;
  if(!taken){
    taken=new Set();
    Object.values(CLOUD.registry?.users||{}).forEach(u=>{
      if(u&&typeof u==='object'&&!u._deleted){
        const eid=String(u.userId||'').trim();
        if(eid) taken.add(eid);
      }
    });
  }
  if(!taken.has(base)) return base;
  let suffix=2;
  while(taken.has(`${base}_${suffix}`)) suffix++;
  return `${base}_${suffix}`;
}
export function ensureUserRecord(username,rawObj,usedIds){
  if(rawObj&&typeof rawObj==='object'&&rawObj._deleted) return rawObj;
  const src=(rawObj&&typeof rawObj==='object')?rawObj:{};
  const passHash=String(src.passHash||'');
  const createdAt=String(src.createdAt||'');
  const avatar=String(src.avatar||'');
  const nameHistory=Array.isArray(src.nameHistory)
    ?src.nameHistory
      .filter(h=>h&&typeof h==='object')
      .map(h=>({
        from:String(h.from||'').trim(),
        to:String(h.to||'').trim(),
        at:String(h.at||''),
        atMs:toInt(h.atMs,0)
      }))
      .filter(h=>h.from||h.to)
    :[];
  let userId=String(src.userId||'').trim();
  if(!userId||(usedIds instanceof Set&&usedIds.has(userId))){
    userId=makeLegacyUserId(username,createdAt,usedIds);
  }
  if(usedIds instanceof Set) usedIds.add(userId);
  const normThemePrefs=(src.themePrefs&&typeof src.themePrefs==='object')?normalizeThemePrefs(src.themePrefs):null;
  const out={...src,userId,passHash,createdAt,avatar,nameHistory};
  if(normThemePrefs) out.themePrefs=normThemePrefs;
  else delete out.themePrefs;
  delete out._deleted;
  return out;
}
export function ensureAllRegistryUsers(){
  if(!CLOUD.registry||typeof CLOUD.registry!=='object') return false;
  if(!CLOUD.registry.users||typeof CLOUD.registry.users!=='object') CLOUD.registry.users={};
  const users=CLOUD.registry.users;
  const keys=Object.keys(users).sort((a,b)=>a.localeCompare(b,'de'));
  const usedIds=new Set();
  let changed=false;
  keys.forEach(k=>{
    const raw=users[k];
    if(!raw||typeof raw!=='object'||raw._deleted) return;
    const eid=String(raw.userId||'').trim();
    if(eid&&!usedIds.has(eid)) usedIds.add(eid);
  });
  const assignedIds=new Set();
  keys.forEach(k=>{
    const raw=users[k];
    if(!raw||typeof raw!=='object'){
      delete users[k];
      changed=true;
      return;
    }
    if(raw._deleted) return;
    const existingId=String(raw.userId||'').trim();
    if(existingId&&!assignedIds.has(existingId)){
      assignedIds.add(existingId);
      const norm=ensureUserRecord(k,raw,null);
      if(norm.userId!==raw.userId||norm.passHash!==raw.passHash||norm.createdAt!==raw.createdAt||norm.avatar!==raw.avatar||!Array.isArray(raw.nameHistory)||norm.nameHistory.length!==raw.nameHistory.length){
        changed=true;
      }
      users[k]=norm;
    }else{
      const combinedUsed=new Set([...usedIds,...assignedIds]);
      const norm=ensureUserRecord(k,{...raw,userId:''},combinedUsed);
      usedIds.add(norm.userId);
      assignedIds.add(norm.userId);
      users[k]=norm;
      changed=true;
    }
  });
  return changed;
}
export function findUserKeyByName(name){
  const low=String(name||'').trim().toLowerCase();
  if(!low) return '';
  const users=CLOUD.registry?.users;
  if(!users||typeof users!=='object') return '';
  return Object.keys(users).find(k=>{
    const u=users[k];
    return u&&typeof u==='object'&&!u._deleted&&k.toLowerCase()===low;
  })||'';
}
export function findUserKeyById(userId){
  const target=String(userId||'').trim();
  if(!target) return '';
  const users=CLOUD.registry?.users;
  if(!users||typeof users!=='object') return '';
  return Object.keys(users).find(k=>{
    const u=users[k];
    return u&&typeof u==='object'&&!u._deleted&&String(u.userId||'').trim()===target;
  })||'';
}
export function getUserAvatar(username){
  const key=findUserKeyByName(username);
  if(!key) return '';
  return String(CLOUD.registry?.users?.[key]?.avatar||'');
}
export function canViewUserProfile(targetUser){
  const raw=String(targetUser||'').trim();
  if(!raw) return false;
  if(CLOUD.isAdmin===true) return true;
  const cur=String(CLOUD.currentUser||'').trim();
  if(!cur) return false;
  if(cur.toLowerCase()===raw.toLowerCase()) return true;
  const resolved=findUserKeyById(raw)||findUserKeyByName(raw);
  return Boolean(resolved&&cur.toLowerCase()===resolved.toLowerCase());
}
export function renderUserNamePill(username, opts={}){
  const raw=String(username||'').trim();
  if(!raw) return '';
  const cls=String(opts.cls||'px-2 py-0.5 rounded-md text-[11px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-400/40');
  const avUrl=opts.showAvatar?getUserAvatar(raw):'';
  const icon=avUrl?`<img src="${avUrl}" class="w-5 h-5 rounded-full object-cover shrink-0 border border-white/20" alt=""/>`:(opts.icon!==undefined?opts.icon:'👤 ');
  const key=findUserKeyByName(raw)||findUserKeyById(raw);
  const isSelf=Boolean(CLOUD.currentUser&&CLOUD.currentUser.trim().toLowerCase()===raw.toLowerCase());
  const canOpen=Boolean(canViewUserProfile(raw)&&(key||isSelf));
  const label=`${icon}<span class="truncate min-w-0">${esc(raw)}</span>`;
  if(!canOpen){
    return `<span class="inline-flex items-center gap-1 min-w-0 ${cls}">${label}</span>`;
  }
  const target=key||raw;
  const tip=opts.tip||(isSelf?'Eigenes Profil öffnen (Name, Passwort, User-ID, Profilbild)':`Benutzerprofil von „${target}“ öffnen`);
  return `<button type="button" data-action="open-user-profile" data-user="${esc(target)}" data-tip="${esc(tip)}" aria-label="${esc(tip)}" class="inline-flex items-center gap-1 min-w-0 cursor-pointer hover:brightness-110 hover:underline transition-all ${cls}">${label}</button>`;
}
export function saveRegistryLocal(){try{if(!Array.isArray(CLOUD.registry.deletedCharIds))CLOUD.registry.deletedCharIds=[];localStorage.setItem('scherbensturm_lobby_registry',JSON.stringify(CLOUD.registry));}catch(e){}}
export function saveDiceFeedLocal(){try{localStorage.setItem('scherbensturm_live_dice_feed',JSON.stringify((CLOUD.diceFeed||[]).slice(0,40)));}catch(e){}}
export function saveSecretRollsLocal(){try{localStorage.setItem('scherbensturm_admin_secret_rolls',JSON.stringify((CLOUD.secretRolls||[]).slice(0,30)));}catch(e){}}
export function getActiveLiveCampaignId(){
  const allowed=getAccessibleCampaigns(CLOUD.currentUser);
  if(allowed.some(c=>c.id===CLOUD.activeCampaignId)) return CLOUD.activeCampaignId;
  const ownCamp=S.charId?getCharCampaignId(S.charId):'';
  if(ownCamp&&allowed.some(c=>c.id===ownCamp)) return ownCamp;
  if(allowed.length) return allowed[0].id;
  return CLOUD.isAdmin?'default':(CLOUD.activeCampaignId||'default');
}
export function getRollCampaignId(entry){
  if(!entry) return 'default';
  if(entry.charId&&(CLOUD.registry?.charCampaigns?.[entry.charId]!==undefined||(CLOUD.list||[]).some(c=>c.id===entry.charId)||entry.charId===S.charId)){
    return getCharCampaignId(entry.charId);
  }
  const validIds=new Set(getCampaigns().map(c=>c.id));
  const raw=String(entry.campaignId||'default').trim()||'default';
  return validIds.has(raw)?raw:'default';
}
export function getCampaignFilteredDiceFeed(campId=getActiveLiveCampaignId()){
  return (CLOUD.diceFeed||[]).filter(entry=>getRollCampaignId(entry)===campId);
}
export function getScrollElementKey(el){
  if(!el) return '';
  if(el.dataset?.scrollKey) return el.dataset.scrollKey;
  if(el.dataset?.pwlibScroll) return 'pwlib:'+el.dataset.pwlibScroll;
  if(el.dataset?.fbMinichat) return 'fbchat:'+el.dataset.fbMinichat;
  if(el.dataset?.lobbyDiceBody) return 'lobbyDiceBody';
  if(el.dataset?.lobbyCampTabs) return 'lobbyCampTabs';
  if(el.dataset?.diceScrollBody) return 'diceScrollBody';
  if(el.classList?.contains('modal-body')) return '__modalBody__';
  if(el.classList?.contains('ctx-body')) return '__ctxBody__';
  return '';
}
export function getDomChildPath(root,el){
  const path=[];
  let cur=el;
  while(cur&&cur!==root&&cur.parentElement){
    const parent=cur.parentElement;
    let idx=0, sib=parent.firstElementChild;
    while(sib&&sib!==cur){idx++;sib=sib.nextElementSibling;}
    path.push(idx);
    cur=parent;
  }
  return cur===root?path.reverse():null;
}
export function resolveDomChildPath(root,path){
  let cur=root;
  for(let i=0;i<path.length;i++){
    if(!cur||!cur.children||path[i]>=cur.children.length) return null;
    cur=cur.children[path[i]];
  }
  return cur;
}
export function captureScrollState(root){
  const snap={winX:window.scrollX,winY:window.scrollY,rootTop:root?root.scrollTop:0,rootLeft:root?root.scrollLeft:0,byKey:new Map(),yList:[],xList:[],anyScrolled:[]};
  if(!root) return snap;
  const seen=new Set();
  root.querySelectorAll(SCROLL_KEY_SEL).forEach(el=>{
    const key=getScrollElementKey(el);
    if(!key) return;
    const scroller=el.dataset?.fbMinichat?(el.querySelector('.overflow-y-auto')||el):el;
    snap.byKey.set(key,{top:scroller.scrollTop,left:scroller.scrollLeft});
    seen.add(scroller);
  });
  root.querySelectorAll(SCROLL_Y_SEL).forEach(el=>{snap.yList.push(el.scrollTop);seen.add(el);});
  root.querySelectorAll(SCROLL_X_SEL).forEach(el=>{snap.xList.push(el.scrollLeft);seen.add(el);});
  const allEls=root.getElementsByTagName('*');
  for(let i=0;i<allEls.length;i++){
    const el=allEls[i];
    if(seen.has(el)) continue;
    if((el.scrollTop>0||el.scrollLeft>0)&&el.getClientRects().length>0){
      const path=getDomChildPath(root,el);
      if(path||el.id){
        snap.anyScrolled.push({id:el.id||'',tag:el.tagName,path,top:el.scrollTop,left:el.scrollLeft});
      }
    }
  }
  return snap;
}
export function restoreScrollState(root,snap,opts={}){
  if(!snap) return;
  const keepY=opts.preserveY!==false, keepX=opts.preserveX!==false, keepWin=opts.preserveWindow!==false;
  const applyOnce=()=>{
    if(root){
      if(keepY) root.scrollTop=snap.rootTop;
      if(keepX) root.scrollLeft=snap.rootLeft;
      if(keepY){
        const yEls=root.querySelectorAll(SCROLL_Y_SEL);
        for(let i=0;i<Math.min(snap.yList.length,yEls.length);i++){
          if(snap.yList[i]>0) yEls[i].scrollTop=snap.yList[i];
        }
      }
      if(keepX){
        const xEls=root.querySelectorAll(SCROLL_X_SEL);
        for(let i=0;i<Math.min(snap.xList.length,xEls.length);i++){
          if(snap.xList[i]>0) xEls[i].scrollLeft=snap.xList[i];
        }
      }
      if(snap.byKey&&snap.byKey.size){
        root.querySelectorAll(SCROLL_KEY_SEL).forEach(el=>{
          const key=getScrollElementKey(el);
          const saved=key?snap.byKey.get(key):null;
          if(!saved) return;
          const scroller=el.dataset?.fbMinichat?(el.querySelector('.overflow-y-auto')||el):el;
          if(keepY) scroller.scrollTop=saved.top;
          if(keepX) scroller.scrollLeft=saved.left;
        });
      }
      if(Array.isArray(snap.anyScrolled)&&snap.anyScrolled.length){
        snap.anyScrolled.forEach(item=>{
          let target=null;
          if(item.id){
            const byId=$(item.id);
            if(byId&&root.contains(byId)) target=byId;
          }
          if(!target&&item.path) target=resolveDomChildPath(root,item.path);
          if(!target||target.tagName!==item.tag) return;
          if(keepY&&item.top>0) target.scrollTop=item.top;
          if(keepX&&item.left>0) target.scrollLeft=item.left;
        });
      }
    }
    if(keepWin&&(window.scrollY!==snap.winY||window.scrollX!==snap.winX)){
      window.scrollTo(snap.winX,snap.winY);
    }
  };
  applyOnce();
  requestAnimationFrame(applyOnce);
}
export function toast(msg,dur){const el=$('toast');if(!el)return;clearTimeout(toastTimer);el.textContent=msg;el.classList.remove('opacity-0');const ms=dur!==undefined?dur:(String(msg||'').includes('⚠️')?4800:2500);toastTimer=setTimeout(()=>el.classList.add('opacity-0'),ms);}
export function hasNiceRoll(entry){
  if(!entry||typeof entry!=='object') return false;
  if(Array.isArray(entry.res)&&entry.res.some(x=>x&&(toInt(x.r,-1)===69||toInt(x.rawR,-1)===69))) return true;
  if(Array.isArray(entry.customRolls)&&entry.customRolls.some(v=>toInt(v,-1)===69)) return true;
  if(entry.isCustomDice&&toInt(entry.customTotal,-1)===69) return true;
  return false;
}
export function triggerNiceEasterEgg(){
  const el=document.createElement('div');
  el.className='nice-easter-egg';
  el.textContent='Nice';
  el.style.left=(8+Math.random()*74).toFixed(1)+'%';
  el.style.top=(10+Math.random()*74).toFixed(1)+'%';
  el.style.setProperty('--nr',((Math.random()*26)-13).toFixed(1)+'deg');
  document.body.appendChild(el);
  setTimeout(()=>el.remove(),2050);
}
export function logChron(text){S.chronicleLog.unshift({id:uid(),ts:stamp(),text});if(S.chronicleLog.length>300)S.chronicleLog.length=300;}
export function normPwEntry(raw,isAug){
  const isLegacyBasis=!isAug&&raw?.sectionId==='umwf0mc44chn1'&&raw?.tier==='marginal'&&raw?.manualCost&&toInt(raw?.sp,0)===0&&toInt(raw?.msp,0)===0; const base=isAug?makeAugment():makePower(), tier=isLegacyBasis?'basisaktion':(PW_TIERS[raw?.tier]?raw.tier:'marginal'), def=PW_TIERS[tier], manual=isLegacyBasis?false:Boolean(raw?.manualCost);
  let useAmt=raw?.useAmt!==undefined?toInt(raw.useAmt,0):0, useRes=raw?.useRes!==undefined?String(raw.useRes):'';
  if(raw?.useAmt===undefined&&typeof raw?.useCost==='string'&&raw.useCost.trim()){const m=raw.useCost.match(/(\d+)\s*(mAP|AP|mLP|LP|BSt)/i);if(m){useAmt=+m[1];useRes=m[2].toLowerCase();}}
  if(!useRes) useAmt=0;
  let useCosts=[];
  if(Array.isArray(raw?.useCosts)){
    useCosts=raw.useCosts.filter(c=>c&&String(c.res||'').trim()).map(c=>({res:String(c.res).trim(),amt:Math.max(0,toInt(c.amt,0))}));
  }else if(useRes&&toInt(useAmt,0)>0){
    useCosts=[{res:String(useRes).trim(),amt:Math.max(0,toInt(useAmt,1))}];
  }
  useRes=useCosts[0]?useCosts[0].res:'';
  useAmt=useCosts[0]?useCosts[0].amt:0;
  const bh=raw?.boxH&&typeof raw.boxH==='object'?{desc:toInt(raw.boxH.desc,0),effects:toInt(raw.boxH.effects,0),rules:toInt(raw.boxH.rules,0)}:{desc:0,effects:0,rules:0};
  const col=isHex(raw?.color)?raw.color:'', bgCol=isHex(raw?.bgColor)?raw.bgColor:'';
  const applyMods=raw?.applyMods!==undefined?Boolean(raw.applyMods):true;
  const bldMode=raw?.bldMode==='skill'?'skill':(raw?.bldMode==='dyn'?'dyn':'stat');
  const rawSkCntDigits=String(raw?.bldSkCnt??'').replace(/\D/g,'');
  const rawSkCntNum=rawSkCntDigits?parseInt(rawSkCntDigits,10):0;
  const bldSkCnt=String(rawSkCntNum>=1?rawSkCntNum:1);
  const bldSkKind=raw?.bldSkKind==='dis'?'dis':'adv';
  const bldSkId=String(raw?.bldSkId||'');
  const bldDynVar=String(raw?.bldDynVar||'WA').trim()||'WA';
  const bldDynFactor=raw?.bldDynFactor!==undefined&&raw?.bldDynFactor!==null?String(raw.bldDynFactor):'/2';
  const bldDynRound=['floor','ceil','round'].includes(raw?.bldDynRound)?raw.bldDynRound:'';
  const bldDynTarget=['desc','effects','rules'].includes(raw?.bldDynTarget)?raw.bldDynTarget:'desc';
  const isLegacyFormat=raw?.actionSubs===undefined&&raw?.tags===undefined;
  const hasNewArrays=Array.isArray(raw?.actionSubs)||Array.isArray(raw?.tags);
  const actionSubSet=new Set();
  const tags=[], tagSeen=new Set();
  const pushActionSub=val=>{const m=findActionSub(val);if(m)actionSubSet.add(m);};
  const pushTag=val=>{
    const clean=String(val||'').trim();
    if(!clean||isReservedPwTerm(clean)) return;
    const low=clean.toLowerCase();
    if(tagSeen.has(low)) return;
    tagSeen.add(low);
    const canon=DEF_PW_TAGS.find(t=>t.toLowerCase()===low)||clean;
    tags.push(canon);
  };
  let art=String(raw?.art??raw?.kind??base.art).trim();
  const mainArtMatch=findMainArt(art);
  if(mainArtMatch){
    art=mainArtMatch;
  }else if(isLegacyFormat){
    const artLow=art.toLowerCase();
    const subFromArt=findActionSub(art);
    if(artLow==='eigenschaft'){
      art='';
      pushTag('Eigenschaft');
    }else if(subFromArt){
      art='';
      pushActionSub(subFromArt);
    }
  }
  if(hasNewArrays){
    if(Array.isArray(raw?.actionSubs)) raw.actionSubs.forEach(pushActionSub);
    if(Array.isArray(raw?.tags)) raw.tags.forEach(pushTag);
  }else if(Array.isArray(raw?.subcats)){
    raw.subcats.forEach(sc=>{
      const subM=findActionSub(sc);
      if(subM) actionSubSet.add(subM);
      else pushTag(sc);
    });
  }else if(isAug&&raw?.art===undefined&&raw?.kind===undefined){
    base.tags.forEach(pushTag);
  }
  const actionSubs=DEF_ACTION_SUBS.filter(s=>actionSubSet.has(s));
  const reserved=Boolean(raw?.reserved);
  const reservedCosts=Array.isArray(raw?.reservedCosts)?raw.reservedCosts.filter(c=>c&&String(c.res||'').trim()&&toInt(c.amt,0)>0).map(c=>({res:String(c.res).trim(),amt:Math.max(0,toInt(c.amt,0))})):[];
  const normParentId=isAug?String(raw?.parentPowerId||''):'';
  const normSecId=(isAug&&normParentId)?'':String(raw?.sectionId||'');
  return {...base,...(raw||{}),id:raw?.id||uid(),templateId:String(raw?.templateId||''),color:col,bgColor:bgCol,sectionId:normSecId,...(isAug?{parentPowerId:normParentId}:{}),collapsed:Boolean(raw?.collapsed),tier,manualCost:manual,sp:manual?toInt(raw.sp,def.sp):def.sp,msp:manual?toInt(raw.msp,def.msp):def.msp,showManual:Boolean(raw?.showManual),art,artManual:Boolean(raw?.artManual),actionSubs,tags,useCosts,useAmt,useRes,reserved,reservedCosts,desc:String(raw?.desc||''),effects:String(raw?.effects??raw?.extraEffects??''),rules:String(raw?.rules||''),applyMods,bldAmt:String(raw?.bldAmt||'+1'),bldStat:String(raw?.bldStat||'LP-Max'),bldMode,bldSkCnt,bldSkKind,bldSkId,bldDynVar,bldDynFactor,bldDynRound,bldDynTarget,boxH:bh};
}

function normalizeSheetObject(raw, { isForeign = false } = {}){
  const def=defaultState();
  if(!raw||typeof raw!=='object') return { sheet: def, sheetFallbackAppearance: def.appearance, sheetFallbackPalettes: [] };
  const cid=String(raw.charId||def.charId);
  const restoredTab=isForeign?(isValidTab(raw.activeTab)?raw.activeTab:def.activeTab):getSavedTabForChar(cid,raw.activeTab);
  const rawCampId=String(raw.campaignId||raw._summary?.campaignId||CLOUD.registry?.charCampaigns?.[cid]||'default').trim()||'default';
  const sheet={...def,...raw,version:11,charId:cid,activeTab:restoredTab,phase:raw.phase==='flut'?'flut':'ebbe',owner:String(raw.owner||''),campaignId:rawCampId,cloudAutoSync:Boolean(raw.cloudAutoSync),profile:{...def.profile,...(raw.profile||{})},secondary:{...def.secondary,...(raw.secondary||{})},customRes:{...def.customRes,...(raw.customRes||{})},statusCollapsed:Boolean(raw.statusCollapsed),statusEffects:normStatusEffects(raw.statusEffects),inspiration:Math.max(0,toInt(raw.inspiration,0)),inspirationActive:Boolean(raw.inspirationActive),thresholds:{...def.thresholds,...(raw.thresholds||{})},combatNotes:{...def.combatNotes,...(raw.combatNotes||{})},progression:{...def.progression,...(raw.progression||{})},bio:{...def.bio,...(raw.bio||{})},equipNotes:raw.equipNotes??raw.equipFreeNotes??''};
  if(!isHex(sheet.customRes.color)) sheet.customRes.color='#c084fc';
  sheet.secondary.lpRegenOvr=sheet.secondary.lpRegenOvr!==undefined&&sheet.secondary.lpRegenOvr!==null&&String(sheet.secondary.lpRegenOvr).trim()!==''?String(Math.max(0,toInt(sheet.secondary.lpRegenOvr,5))):'';
  sheet.secondary.mlpRegenOvr=sheet.secondary.mlpRegenOvr!==undefined&&sheet.secondary.mlpRegenOvr!==null&&String(sheet.secondary.mlpRegenOvr).trim()!==''?String(Math.max(0,toInt(sheet.secondary.mlpRegenOvr,5))):'';
  sheet.extraSecList=Array.isArray(raw.extraSecList)?raw.extraSecList.filter(x=>x&&typeof x==='object').map((x,i)=>({id:x.id||uid(),name:String(x.name||`Ressource ${i+1}`),current:toInt(x.current,3),max:toInt(x.max,3),color:isHex(x.color)?x.color:(COL_PRESETS[(i+6)%COL_PRESETS.length]||'#34d399')})):[];
  sheet.attrColors={...DEF_ATTR_COLS}; if(raw.attrColors) Object.keys(DEF_ATTR_COLS).forEach(k=>{if(isHex(raw.attrColors[k]))sheet.attrColors[k]=raw.attrColors[k];});
  sheet.secColors={...DEF_SEC_COLS}; if(raw.secColors) Object.keys(DEF_SEC_COLS).forEach(k=>{if(isHex(raw.secColors[k]))sheet.secColors[k]=raw.secColors[k];});
  sheet.artList=[...DEF_MAIN_ARTS];
  sheet.actionSubList=[...DEF_ACTION_SUBS];
  const rawTagSrc=Array.isArray(raw.pwTagList)?raw.pwTagList:(Array.isArray(raw.subcatList)?raw.subcatList:[]);
  sheet.pwTagList=sortAlpha([...DEF_PW_TAGS,...rawTagSrc].filter(t=>!isReservedPwTerm(t)));
  sheet.useResList=Array.isArray(raw.useResList)&&raw.useResList.length?[...new Set(raw.useResList.map(x=>String(x).trim()).filter(Boolean))]:[...DEF_USERES];
  sheet.customStats=Array.isArray(raw.customStats)?sortAlpha(raw.customStats):[];
  const mergeDefTags=(rawArr,defArr)=>{const b=Array.isArray(rawArr)?rawArr.filter(t=>t&&String(t.name||'').trim()):[];(defArr||[]).forEach(d=>{if(!b.some(t=>String(t.name).trim().toLowerCase()===d.name.toLowerCase()))b.push({...d});});return sortTagDefs(b);};
  sheet.weaponTagList=mergeDefTags(raw.weaponTagList,DEF_WEAPON_TAGS);
  sheet.armorTagList=mergeDefTags(raw.armorTagList,DEF_ARMOR_TAGS);
  sheet.ammoTagList=Array.isArray(raw.ammoTagList)?sortTagDefs(raw.ammoTagList):[];
  const sheetFallbackPalettes=normalizeCustomPalettesList(Array.isArray(raw.customPalettes)?raw.customPalettes:[]);
  const ap=(raw.appearance&&typeof raw.appearance==='object')?raw.appearance:{};
  const sheetFallbackAppearance={
    dark:ap.dark!==undefined?Boolean(ap.dark):true,
    mode:ap.mode==='perTab'?'perTab':'global',
    editScope:(ap.editScope==='lobby'||TABS.some(t=>t.id===ap.editScope))?ap.editScope:'attributes',
    global:normalizeThemeSlot(ap.global,sheetFallbackPalettes),
    lobby:normalizeThemeSlot(ap.lobby,sheetFallbackPalettes),
    tabs:{}
  };
  TABS.forEach(t=>{sheetFallbackAppearance.tabs[t.id]=normalizeThemeSlot(ap.tabs?.[t.id],sheetFallbackPalettes);});
  if(isForeign){
    sheet.appearance=sheetFallbackAppearance;
    sheet.customPalettes=sheetFallbackPalettes;
  }
  sheet.attributes={};
  ATTRS.forEach(a=>{
    const inc=raw.attributes?.[a.k]||{}, hi=Array.isArray(inc.tr)?inc.tr.lastIndexOf(true):-1;
    const trSp=Array.isArray(inc.trSp)&&inc.trSp.length===5?inc.trSp.map(x=>x===null||x===undefined||x===''?null:toInt(x,0)):[null,null,null,null,null];
    const trMsp=Array.isArray(inc.trMsp)&&inc.trMsp.length===5?inc.trMsp.map(x=>x===null||x===undefined||x===''?null:toInt(x,0)):[null,null,null,null,null];
    sheet.attributes[a.k]={vw:toInt(inc.vw,20),pot:toInt(inc.pot,0),mod:toInt(inc.mod,0),tr:[0,1,2,3,4].map(i=>i<=hi),trNotes:Array.isArray(inc.trNotes)&&inc.trNotes.length===5?inc.trNotes.map(x=>String(x??'')):['','','','',''],trSp,trMsp};
  });
  sheet.skillSections=Array.isArray(raw.skillSections)?raw.skillSections.map(sec=>({id:sec?.id||uid(),name:String(sec?.name||'Sektion'),color:isHex(sec?.color)?sec.color:'',bgColor:isHex(sec?.bgColor)?sec.bgColor:'',collapsed:Boolean(sec?.collapsed),filterAttr:String(sec?.filterAttr||''),parentSectionId:String(sec?.parentSectionId||'')})):[];
  sanitizeSecHierarchy(sheet.skillSections);
  const calcAutoSk=(cat,r)=>{
    if(typeof hooks.calcAutoSkCost==='function') return hooks.calcAutoSkCost(cat,r);
    const c=SK_CATS[cat]||SK_CATS.fundamental;
    let sp=0;
    for(let i=1;i<=r;i++) sp+=(c.s[i]||0);
    return {sp,msp:(cat==='grandios'&&r>=4)?1:0};
  };
  sheet.skills=Array.isArray(raw.skills)?raw.skills.map(sk=>{
    const category=SK_CATS[sk.category]?sk.category:'fundamental', rank=Math.max(0,Math.min(4,toInt(sk.rank,1))), auto=calcAutoSk(category,rank);
    let manualCost=Boolean(sk.manualCost), customSp=sk.customSp!==undefined&&sk.customSp!==null?toInt(sk.customSp,auto.sp):auto.sp, customMsp=sk.customMsp!==undefined&&sk.customMsp!==null?toInt(sk.customMsp,auto.msp):auto.msp;
    if(sk.manualCost===undefined&&toInt(sk.spAdjust,0)!==0){manualCost=true;customSp=Math.max(0,auto.sp+toInt(sk.spAdjust,0));}
    const hasBonOvr=sk.bonusOvr!==undefined&&sk.bonusOvr!==null&&String(sk.bonusOvr).trim()!=='';
    const bonusOvr=hasBonOvr?String(toInt(sk.bonusOvr,0)):'';
    const sectionId=sk.sectionId&&sheet.skillSections.some(s=>s.id===sk.sectionId)?String(sk.sectionId):'';
    return {id:sk.id||uid(),name:String(sk.name||'Fertigkeit'),color:isHex(sk.color)?sk.color:'',bgColor:isHex(sk.bgColor)?sk.bgColor:'',linkedAttr:ATTRS.some(a=>a.k===sk.linkedAttr)?sk.linkedAttr:'PR',category,rank,bonusOvr,sectionId,manualCost,customSp,customMsp,notes:String(sk.notes||'')};
  }):[];
  sheet.powerSections=Array.isArray(raw.powerSections)?raw.powerSections.map(sec=>({id:sec?.id||uid(),name:String(sec?.name||'Sektion'),color:isHex(sec?.color)?sec.color:'',bgColor:isHex(sec?.bgColor)?sec.bgColor:'',collapsed:Boolean(sec?.collapsed),filterArt:findMainArt(sec?.filterArt),parentSectionId:String(sec?.parentSectionId||'')})):[];
  sanitizeSecHierarchy(sheet.powerSections);
  const parseChips=(txt)=>typeof hooks.getAllParsedEffectChips==='function'?hooks.getAllParsedEffectChips(txt,sheet):[];
  sheet.powers=Array.isArray(raw.powers)?raw.powers.map(p=>normPwEntry(p,false)):[];
  sheet.powers.forEach(p=>{if(p.sectionId&&!sheet.powerSections.some(s=>s.id===p.sectionId))p.sectionId='';if(raw.version<11&&parseChips(p.effects).length)p.applyMods=true;});
  sheet.augments=Array.isArray(raw.augments)?raw.augments.map(a=>normPwEntry(a,true)):[];
  sheet.augments.forEach(a=>{if(raw.version<11&&parseChips(a.effects).length)a.applyMods=true;});
  const usedPwTags=[...sheet.powers,...sheet.augments].flatMap(it=>Array.isArray(it.tags)?it.tags:[]).filter(t=>!isReservedPwTerm(t));
  if(usedPwTags.length){sheet.pwTagList=sortAlpha([...sheet.pwTagList,...usedPwTags]);}
  const slotCnt={};
  sheet.augments.forEach(ag=>{
    if(!ag.parentPowerId&&ag.parentPower){const m=sheet.powers.find(p=>p.name&&p.name.toLowerCase()===String(ag.parentPower).toLowerCase());if(m)ag.parentPowerId=m.id;}
    if(ag.parentPowerId&&!sheet.powers.some(p=>p.id===ag.parentPowerId)) ag.parentPowerId='';
    if(ag.parentPowerId){slotCnt[ag.parentPowerId]=(slotCnt[ag.parentPowerId]||0)+1;if(slotCnt[ag.parentPowerId]>3)ag.parentPowerId='';}
    if(ag.parentPowerId){ag.sectionId='';}
    else{ag.sectionId=(ag.sectionId&&sheet.powerSections.some(s=>s.id===ag.sectionId))?String(ag.sectionId):'';}
  });
  if(!Array.isArray(sheet.movements)||!sheet.movements.length) sheet.movements=def.movements;
  sheet.movements=sheet.movements.map(mv=>({id:mv?.id||uid(),type:String(mv?.type||'Bewegung'),base:mv?.base??5,ovr:mv?.ovr!==undefined&&mv?.ovr!==null?String(mv.ovr):''}));
  sheet.bst=raw.bst!==undefined?toInt(raw.bst,1):1;
  const autoBst=typeof hooks.getBstAuto==='function'?hooks.getBstAuto(sheet):Math.max(0,Math.floor(toFlt(sheet.movements?.[0]?.base,5)/5));
  if(raw.bstOvr===undefined){
    const oldBst=toInt(raw.bst,0);
    sheet.bstOvr=(oldBst!==0&&oldBst!==1)?String(toInt(raw.bst,1)):'';
  }else{
    sheet.bstOvr=raw.bstOvr!==null&&String(raw.bstOvr).trim()!==''?String(toInt(raw.bstOvr,autoBst)):'';
  }
  if(!Array.isArray(sheet.hitZones)||!sheet.hitZones.length) sheet.hitZones=def.hitZones;
  if(!Array.isArray(sheet.chronicleLog)) sheet.chronicleLog=def.chronicleLog;
  const rawChrOrd=Array.isArray(raw.chrSecOrder)?raw.chrSecOrder.filter(k=>DEF_CHR_SEC_ORDER.includes(k)):[];
  sheet.chrSecOrder=[...new Set([...rawChrOrd,...DEF_CHR_SEC_ORDER])];
  sheet.chrSecMeta={};
  DEF_CHR_SEC_ORDER.forEach(k=>{const cm=raw.chrSecMeta?.[k]||{};sheet.chrSecMeta[k]={collapsed:Boolean(cm.collapsed),color:isHex(cm.color)?cm.color:'',bgColor:isHex(cm.bgColor)?cm.bgColor:''};});
  sheet.chrTrExpanded=raw.chrTrExpanded&&typeof raw.chrTrExpanded==='object'?{...raw.chrTrExpanded}:{};
  const rawOrd=Array.isArray(raw.equipSecOrder)?raw.equipSecOrder.filter(k=>DEF_EQ_SEC_ORDER.includes(k)):[];
  sheet.equipSecOrder=[...new Set([...rawOrd,...DEF_EQ_SEC_ORDER])];
  sheet.equipSecMeta={};
  DEF_EQ_SEC_ORDER.forEach(k=>{const im=raw.equipSecMeta?.[k]||{};sheet.equipSecMeta[k]={collapsed:Boolean(im.collapsed),color:isHex(im.color)?im.color:'',bgColor:isHex(im.bgColor)?im.bgColor:''};});
  const normTags=arr=>Array.isArray(arr)?arr.filter(t=>t&&(t.name||typeof t==='string')).map(t=>typeof t==='string'?{name:t,x:'1'}:{name:String(t.name),x:String(t.x??'1')}):[];
  sheet.weapons=Array.isArray(raw.weapons)?raw.weapons.map(w=>{const wTags=normTags(w?.tags),hasMas=isWeaponMassiv({tags:wTags}),wType=normWeaponType(w?.wType),wAttr=hasMas?'ST':(ATTRS.some(a=>a.k===w?.wAttr)?w.wAttr:'PR'),skillId=(w?.skillId&&sheet.skills.some(s=>s.id===w.skillId))?String(w.skillId):'';return {...makeWeapon(wType),...(w||{}),id:w?.id||uid(),color:isHex(w?.color)?w.color:'',bgColor:isHex(w?.bgColor)?w.bgColor:'',collapsed:Boolean(w?.collapsed),img:String(w?.img||''),wType,wAttr,skillId,grip:w?.grip==='1h'||w?.grip==='2h'?w.grip:'',ammoId:String(w?.ammoId||''),dmgCut:String(w?.dmgCut??'0'),dmgPierce:String(w?.dmgPierce??'0'),dmgImpact:String(w?.dmgImpact??'0'),customDmg:normEqCustomVals(w?.customDmg),tags:wTags,notes:String(w?.notes||'')};}):def.weapons;
  const hzCanon=sheet.hitZones.map(z=>String(z?.zone||'').trim()).filter(Boolean);
  const canonZone=z=>{const cl=String(z||'').trim();if(!cl)return '';const hit=hzCanon.find(h=>h.toLowerCase()===cl.toLowerCase());return hit||cl;};
  sheet.armors=Array.isArray(raw.armors)?raw.armors.map(ar=>{const {customZones:_legacyCz,...arRest}=(ar&&typeof ar==='object'?ar:{});const zns=[],exZ=[];const addU=(arr,val)=>{const c=canonZone(val);if(c&&!arr.some(x=>x.toLowerCase()===c.toLowerCase()))arr.push(c);return c;};(Array.isArray(ar?.zones)?ar.zones:[]).forEach(z=>addU(zns,z));(Array.isArray(ar?.extraZones)?ar.extraZones:[]).forEach(z=>{const c=canonZone(z);if(c&&!hzCanon.some(h=>h.toLowerCase()===c.toLowerCase()))addU(exZ,c);});String(_legacyCz||'').split(/[,;]+/).map(s=>s.trim()).filter(Boolean).forEach(cz=>{const c=addU(zns,cz);if(c&&!hzCanon.some(h=>h.toLowerCase()===c.toLowerCase()))addU(exZ,c);});return {...makeArmor(),...arRest,id:ar?.id||uid(),color:isHex(ar?.color)?ar.color:'',bgColor:isHex(ar?.bgColor)?ar.bgColor:'',collapsed:Boolean(ar?.collapsed),equipped:ar?.equipped!==undefined?Boolean(ar.equipped):true,img:String(ar?.img||''),grp:String(ar?.grp??'0'),protCut:String(ar?.protCut??'0'),protPierce:String(ar?.protPierce??'0'),protImpact:String(ar?.protImpact??'0'),customProt:normEqCustomVals(ar?.customProt),zones:zns,extraZones:exZ,tags:normTags(ar?.tags),notes:String(ar?.notes||'')};}):def.armors;
  sheet.ammos=Array.isArray(raw.ammos)?raw.ammos.map(am=>({...makeAmmo(),...(am||{}),id:am?.id||uid(),color:isHex(am?.color)?am.color:'',bgColor:isHex(am?.bgColor)?am.bgColor:'',collapsed:Boolean(am?.collapsed),img:String(am?.img||''),qty:Math.max(0,toInt(am?.qty,20)),dmgCut:String(am?.dmgCut??'0'),dmgPierce:String(am?.dmgPierce??'0'),dmgImpact:String(am?.dmgImpact??'0'),customDmg:normEqCustomVals(am?.customDmg),tags:normTags(am?.tags),notes:String(am?.notes||'')})):[];
  sheet.weapons.forEach(w=>{if(w.ammoId&&!sheet.ammos.some(a=>a.id===w.ammoId))w.ammoId='';});
  sheet.invSections=Array.isArray(raw.invSections)?raw.invSections.map(sec=>({id:sec?.id||uid(),name:String(sec?.name||'Neuer Beutel'),color:isHex(sec?.color)?sec.color:'',bgColor:isHex(sec?.bgColor)?sec.bgColor:'',collapsed:Boolean(sec?.collapsed),parentSectionId:String(sec?.parentSectionId||'')})):[];
  sanitizeSecHierarchy(sheet.invSections);
  sheet.inventory=Array.isArray(raw.inventory)?raw.inventory.map(it=>{const sid=(it?.sectionId&&sheet.invSections.some(s=>s.id===it.sectionId))?String(it.sectionId):'';return {...makeInvItem(sid),...(it||{}),id:it?.id||uid(),color:isHex(it?.color)?it.color:'',bgColor:isHex(it?.bgColor)?it.bgColor:'',collapsed:Boolean(it?.collapsed),img:String(it?.img||''),name:String(it?.name||''),category:String(it?.category||'Inventar'),qty:String(it?.qty??'1'),notes:String(it?.notes||''),sectionId:sid};}):def.inventory;
  sheet.bioImages=Array.isArray(raw.bioImages)?raw.bioImages.filter(im=>im&&im.url).map(im=>({id:im.id||uid(),url:String(im.url),caption:String(im.caption||'')})):[];
  sheet.bioBoxH={...def.bioBoxH,...(raw.bioBoxH&&typeof raw.bioBoxH==='object'?raw.bioBoxH:{})};
  const rawFolders=Array.isArray(raw.campNoteFolders)?raw.campNoteFolders:[];
  const sysPriv=rawFolders.find(f=>f&&f.id==='cf_private');
  const sysPub=rawFolders.find(f=>f&&f.id==='cf_public');
  const customFolders=rawFolders.filter(f=>f&&f.id&&f.id!=='cf_private'&&f.id!=='cf_public').map(f=>({
    id:String(f.id),
    name:String(f.name||'Kapitel').trim()||'Kapitel',
    isPublic:Boolean(f.isPublic),
    collapsed:Boolean(f.collapsed),
    isSystem:false
  }));
  sheet.campNoteFolders=[
    {id:'cf_private',name:String(sysPriv?.name||'🔒 Private Notizen'),isPublic:false,collapsed:Boolean(sysPriv?.collapsed),isSystem:true},
    {id:'cf_public',name:String(sysPub?.name||'🌐 Öffentliche Notizen'),isPublic:true,collapsed:Boolean(sysPub?.collapsed),isSystem:true},
    ...customFolders
  ];
  const validFolderIds=new Set(sheet.campNoteFolders.map(f=>f.id));
  if(Array.isArray(raw.campaignNotes)&&raw.campaignNotes.length){
    sheet.campaignNotes=raw.campaignNotes.map(n=>{
      const isPub=Boolean(n?.isPublic||n?.id==='cn_public');
      let fid=String(n?.folderId||'').trim();
      if(!validFolderIds.has(fid)){
        fid=isPub?'cf_public':'cf_private';
      }else{
        const fObj=sheet.campNoteFolders.find(f=>f.id===fid);
        if(fObj&&fObj.isSystem) fid=isPub?'cf_public':'cf_private';
      }
      return {
        id:n?.id||uid(),
        title:String(n?.title||(isPub?'Öffentliche Notiz':'Notiz')),
        content:String(n?.content||''),
        isPublic:isPub,
        folderId:fid,
        updatedAt:String(n?.updatedAt||'')
      };
    });
  }else if(typeof raw.campaignNotes==='string'&&raw.campaignNotes.trim()){
    sheet.campaignNotes=[{id:'cn_main',title:'Allgemein',content:raw.campaignNotes,isPublic:false,folderId:'cf_private',updatedAt:''}];
  }else{
    sheet.campaignNotes=[
      {id:'cn_main',title:'Allgemein',content:'',isPublic:false,folderId:'cf_private',updatedAt:''},
      {id:'cn_public',title:'Öffentliche Notiz',content:'',isPublic:true,folderId:'cf_public',updatedAt:''}
    ];
  }
  if(!sheet.campaignNotes.some(n=>n.id===sheet.activeCampNoteId)) sheet.activeCampNoteId=sheet.campaignNotes[0].id;
  return { sheet, sheetFallbackAppearance, sheetFallbackPalettes };
}

export function normalizeForeignSheet(raw){
  return normalizeSheetObject(raw, { isForeign: true }).sheet;
}

export function mergeLoaded(raw){
  if(!raw||typeof raw!=='object') return;
  const { sheet, sheetFallbackAppearance, sheetFallbackPalettes } = normalizeSheetObject(raw, { isForeign: false });
  S = sheet;
  applySessionTheme({allowSheetFallback:true,sheetFallbackAppearance,sheetFallbackPalettes,forSheet:true});
  if(Array.isArray(UI.pwFilterArts))UI.pwFilterArts=UI.pwFilterArts.map(a=>findMainArt(a)).filter(Boolean);
}

export const getCharOwner=id=>{const ch=CLOUD.list.find(x=>x.id===id);const cl=CLOUD.registry.claims?.[id];return String(cl!==undefined?cl:(ch?.owner||'')).trim();};
export const getCharCampaignId=id=>{
  const camps=getCampaigns();
  const validIds=new Set(camps.map(c=>c.id));
  const ch=CLOUD.list.find(x=>x.id===id);
  const regC=CLOUD.registry.charCampaigns?.[id];
  const raw=String(regC!==undefined&&regC!==''?regC:(ch?.campaignId||(S.charId===id?S.campaignId:'')||'default')).trim()||'default';
  return validIds.has(raw)?raw:'default';
};
export const canManageChar=id=>{
  if(CLOUD.isAdmin) return true;
  if(!CLOUD.viewingRemote&&id===S.charId) return true;
  const own=getCharOwner(id);
  if(!own) return true;
  if(CLOUD.currentUser&&own.toLowerCase()===CLOUD.currentUser.toLowerCase()) return true;
  const charCampId=getCharCampaignId(id);
  return Boolean(charCampId&&charCampId!=='default'&&canManageCampaign(charCampId,CLOUD.currentUser));
};
export const canAccessCampNotes=(campId=getCharCampaignId(S.charId))=>{
  if(!CLOUD.viewingRemote||CLOUD.isAdmin||canManageChar(S.charId)) return true;
  const cid=String(campId||S.campaignId||'default').trim()||'default';
  if(cid==='default'||!CLOUD.currentUser) return false;
  const camp=getCampaigns().find(c=>c.id===cid);
  return Boolean(camp&&(isUserInCampaign(camp,CLOUD.currentUser)||isCampaignMainGM(camp,CLOUD.currentUser)));
};
let _charTabsCache=null;
export function isValidTab(t){return Boolean(t&&TABS.some(x=>x.id===t));}
export function getCharTabsMap(){
  if(!_charTabsCache){
    try{_charTabsCache=JSON.parse(localStorage.getItem('scherbensturm_char_tabs')||'{}')||{};}
    catch(e){_charTabsCache={};}
  }
  return _charTabsCache;
}
export function saveLastActiveTab(charId=S.charId,tab=S.activeTab){
  if(!isValidTab(tab)) return;
  try{
    localStorage.setItem('scherbensturm_last_active_tab',tab);
    if(charId){
      localStorage.setItem('scherbensturm_last_tab_'+charId,tab);
      const map=getCharTabsMap();
      if(map[charId]!==tab){
        map[charId]=tab;
        localStorage.setItem('scherbensturm_char_tabs',JSON.stringify(map));
      }
    }
  }catch(e){}
}
export function getSavedTabForChar(charId,fallbackTab=''){
  try{
    if(charId){
      const direct=localStorage.getItem('scherbensturm_last_tab_'+charId);
      if(isValidTab(direct)) return direct;
      const mapped=getCharTabsMap()[charId];
      if(isValidTab(mapped)) return mapped;
    }
    if(isValidTab(fallbackTab)) return fallbackTab;
    const glob=localStorage.getItem('scherbensturm_last_active_tab');
    if(isValidTab(glob)) return glob;
  }catch(e){}
  return isValidTab(fallbackTab)?fallbackTab:'attributes';
}
let saveDebounceTimer=null;
export function save(fromUser=true){
  clearTimeout(saveDebounceTimer);
  saveDebounceTimer=null;
  if(CLOUD.viewingRemote) return;
  try{
    saveLastActiveTab(S.charId,S.activeTab);
    localStorage.setItem(STORE_KEY,JSON.stringify(S));
    if(fromUser&&UI.sheetLoaded&&!UI.inLobby&&hooks.canWriteCurrentSheetToCloud?.()){
      hooks.scheduleCloudSync?.();
    }
  }catch(e){toast('Speicherlimit erreicht – bitte kleinere Bilder nutzen oder JSON exportieren.');}
}
export function flushPendingSave(scheduleCloud=true){
  if(saveDebounceTimer!==null){
    clearTimeout(saveDebounceTimer);
    saveDebounceTimer=null;
    if(scheduleCloud){
      save(true);
    }else{
      save(false);
      if(!CLOUD.viewingRemote&&UI.sheetLoaded&&!UI.inLobby&&hooks.canWriteCurrentSheetToCloud?.()){
        CLOUD_SYNC.seq++;
        CLOUD_SYNC.dirty=true;
      }
    }
  }
}
export function saveSoon(delay=250){
  if(CLOUD.viewingRemote) return;
  clearTimeout(saveDebounceTimer);
  saveDebounceTimer=setTimeout(()=>{
    saveDebounceTimer=null;
    save(true);
  },delay);
}
export function load(){try{let r=localStorage.getItem(STORE_KEY);if(!r){for(const k of OLD_KEYS){r=localStorage.getItem(k);if(r)break;}}if(r){const parsed=JSON.parse(r);mergeLoaded(parsed);S.activeTab=getSavedTabForChar(S.charId,parsed.activeTab);return true;}else{S=defaultState();applySessionTheme({allowSheetFallback:false});S.activeTab=getSavedTabForChar(S.charId,S.activeTab);return false;}}catch(e){S=defaultState();applySessionTheme({allowSheetFallback:false});return false;}}

export const getLobbyStyleSlot=()=>(S.appearance.lobby||(S.appearance.lobby=makeStyleSlot()));
export const isEditingLobbyStyle=()=>Boolean(UI.modal==='settings'&&(UI.inLobby||S.appearance.editScope==='lobby'));
export const getEditStyleSlot=()=>(UI.inLobby||S.appearance.editScope==='lobby')?getLobbyStyleSlot():(S.appearance.mode==='perTab'?(S.appearance.tabs[S.appearance.editScope]||(S.appearance.tabs[S.appearance.editScope]=makeStyleSlot())):S.appearance.global);
export const getDisplayStyleSlot=()=>{if(isEditingLobbyStyle()||UI.inLobby)return getLobbyStyleSlot();return S.appearance.mode==='perTab'?(S.appearance.tabs[UI.modal==='settings'?S.appearance.editScope:S.activeTab]||S.appearance.global):S.appearance.global;};

export function loadGuestThemePrefs(){
  try{
    const raw=localStorage.getItem(GUEST_THEME_KEY);
    if(raw){
      const norm=normalizeThemePrefs(JSON.parse(raw));
      if(norm) return norm;
    }
    // Einmalige Migration alter lokaler Gast-Keys (ohne eingeloggte Profile zu berühren)
    let legLobby=null, legPals=[];
    try{legLobby=JSON.parse(localStorage.getItem('scherbensturm_lobby_style')||'null');}catch(e){}
    try{legPals=JSON.parse(localStorage.getItem('scherbensturm_custom_palettes')||'[]')||[];}catch(e){}
    const hasLegacy=Boolean((legLobby&&typeof legLobby==='object')||(Array.isArray(legPals)&&legPals.length));
    const init=normalizeThemePrefs({
      dark:true,
      lobby:legLobby||makeStyleSlot(),
      sheet:{mode:'global',global:makeStyleSlot(),tabs:{}},
      sheetByChar:{},
      customPalettes:legPals,
      sheetCustomized:false,
      updatedAtMs:hasLegacy?Date.now():0
    })||createDefaultThemePrefs();
    if(hasLegacy) saveGuestThemePrefs(init);
    return init;
  }catch(e){
    return createDefaultThemePrefs();
  }
}
export function saveGuestThemePrefs(tp){
  const norm=normalizeThemePrefs(tp)||createDefaultThemePrefs();
  try{localStorage.setItem(GUEST_THEME_KEY,JSON.stringify(norm));}catch(e){}
  return norm;
}
export function getLegacyUserLobbySlot(userKey){
  const low=String(userKey||'').trim().toLowerCase();
  if(!low) return null;
  try{
    const raw=localStorage.getItem(`scherbensturm_lobby_style_${low}`);
    if(!raw) return null;
    const parsed=JSON.parse(raw);
    return (parsed&&typeof parsed==='object')?parsed:null;
  }catch(e){return null;}
}
export function scheduleThemePrefsSync(immediate=false){
  if(!CLOUD.currentUser) return;
  themeSyncPending=true;
  clearTimeout(themeSyncTimer);
  themeSyncTimer=null;
  if(immediate){
    themeSyncPending=false;
    hooks.syncCloudRegistry?.(true);
    return;
  }
  themeSyncTimer=setTimeout(()=>{
    themeSyncTimer=null;
    if(!themeSyncPending||!CLOUD.currentUser) return;
    themeSyncPending=false;
    hooks.syncCloudRegistry?.(true);
  },THEME_SYNC_DEBOUNCE_MS);
}
export function flushThemePrefsSync(){
  if(themeSyncTimer!==null){
    clearTimeout(themeSyncTimer);
    themeSyncTimer=null;
  }
  if(themeSyncPending&&CLOUD.currentUser){
    themeSyncPending=false;
    hooks.syncCloudRegistry?.(true);
  }
}
export function cancelThemePrefsSync(){
  clearTimeout(themeSyncTimer);
  themeSyncTimer=null;
  themeSyncPending=false;
}
export function applySessionTheme(opts={}){
  const allowSheetFallback=Boolean(opts.allowSheetFallback);
  const forSheet=opts.forSheet!==undefined?Boolean(opts.forSheet):!UI.inLobby;
  const fbAp=(opts.sheetFallbackAppearance&&typeof opts.sheetFallbackAppearance==='object')?opts.sheetFallbackAppearance:null;
  const fbPals=Array.isArray(opts.sheetFallbackPalettes)?normalizeCustomPalettesList(opts.sheetFallbackPalettes):[];
  const prevScope=S.appearance?.editScope;
  const defaultScope=forSheet?(S.activeTab||'attributes'):'lobby';
  const nextScope=(opts.preserveEditScope&&(prevScope==='lobby'||TABS.some(t=>t.id===prevScope)))?prevScope:defaultScope;
  const isLoggedIn=Boolean(CLOUD.currentUser);
  const cid=String(S.charId||'').trim();

  if(isLoggedIn){
    const uk=findUserKeyByName(CLOUD.currentUser);
    const userKey=uk||String(CLOUD.currentUser).trim();
    const tp=uk?normalizeThemePrefs(CLOUD.registry?.users?.[uk]?.themePrefs):null;
    const localBgMap=loadUserLocalBgMap(userKey);
    if(tp){
      const customPals=clone(tp.customPalettes||[]);
      S.customPalettes=customPals;
      const lobbySlot=hydrateThemeSlotBg(tp.lobby,localBgMap,'lobby');
      const charEntry=(cid&&tp.sheetByChar?.[cid])?tp.sheetByChar[cid]:null;
      let darkVal=tp.dark, modeVal='global', globalSlot=makeStyleSlot(), tabsObj={};
      if(charEntry){
        darkVal=forSheet?charEntry.dark:tp.dark;
        modeVal=charEntry.mode;
        globalSlot=hydrateThemeSlotBg(charEntry.global,localBgMap,`char:${cid}:global`);
        TABS.forEach(t=>{tabsObj[t.id]=hydrateThemeSlotBg(charEntry.tabs?.[t.id],localBgMap,`char:${cid}:tab:${t.id}`);});
      }else if(tp.sheetCustomized||!allowSheetFallback||!fbAp){
        darkVal=tp.dark;
        modeVal=tp.sheet.mode;
        globalSlot=hydrateThemeSlotBg(tp.sheet.global,localBgMap,'sheet:global');
        TABS.forEach(t=>{tabsObj[t.id]=hydrateThemeSlotBg(tp.sheet.tabs?.[t.id],localBgMap,`sheet:tab:${t.id}`);});
      }else{
        darkVal=tp.dark;
        modeVal=fbAp.mode==='perTab'?'perTab':'global';
        globalSlot=normalizeThemeSlot(fbAp.global,customPals);
        TABS.forEach(t=>{tabsObj[t.id]=normalizeThemeSlot(fbAp.tabs?.[t.id],customPals);});
      }
      S.appearance={dark:darkVal,mode:modeVal,editScope:nextScope,global:globalSlot,lobby:lobbySlot,tabs:tabsObj};
    }else{
      const legLobby=getLegacyUserLobbySlot(userKey);
      const customPals=allowSheetFallback?fbPals:[];
      S.customPalettes=clone(customPals);
      const lobbySlot=hydrateThemeSlotBg(normalizeThemeSlot(legLobby||makeStyleSlot(),customPals),localBgMap,'lobby');
      let darkVal=true, modeVal='global', globalSlot=makeStyleSlot(), tabsObj={};
      if(allowSheetFallback&&fbAp){
        darkVal=fbAp.dark!==undefined?Boolean(fbAp.dark):true;
        modeVal=fbAp.mode==='perTab'?'perTab':'global';
        globalSlot=normalizeThemeSlot(fbAp.global,customPals);
        TABS.forEach(t=>{tabsObj[t.id]=normalizeThemeSlot(fbAp.tabs?.[t.id],customPals);});
      }else{
        TABS.forEach(t=>{tabsObj[t.id]=makeStyleSlot();});
      }
      S.appearance={dark:darkVal,mode:modeVal,editScope:nextScope,global:globalSlot,lobby:lobbySlot,tabs:tabsObj};
    }
    return;
  }

  // Gast-Modus (nicht eingeloggt): strikt über separaten lokalen Key
  const gp=loadGuestThemePrefs();
  const guestPals=normalizeCustomPalettesList(allowSheetFallback&&!gp.updatedAtMs?[...(gp.customPalettes||[]),...fbPals]:(gp.customPalettes||[]));
  S.customPalettes=clone(guestPals);
  const lobbySlot=normalizeThemeSlot(gp.lobby,guestPals);
  const charEntry=(cid&&gp.sheetByChar?.[cid])?gp.sheetByChar[cid]:null;
  let darkVal=gp.dark, modeVal='global', globalSlot=makeStyleSlot(), tabsObj={};
  if(charEntry){
    darkVal=forSheet?charEntry.dark:gp.dark;
    modeVal=charEntry.mode;
    globalSlot=normalizeThemeSlot(charEntry.global,guestPals);
    TABS.forEach(t=>{tabsObj[t.id]=normalizeThemeSlot(charEntry.tabs?.[t.id],guestPals);});
  }else if(gp.sheetCustomized||!allowSheetFallback||!fbAp){
    darkVal=gp.dark;
    modeVal=gp.sheet.mode;
    globalSlot=normalizeThemeSlot(gp.sheet.global,guestPals);
    TABS.forEach(t=>{tabsObj[t.id]=normalizeThemeSlot(gp.sheet.tabs?.[t.id],guestPals);});
  }else{
    darkVal=gp.updatedAtMs>0?gp.dark:(fbAp.dark!==undefined?Boolean(fbAp.dark):true);
    modeVal=fbAp.mode==='perTab'?'perTab':'global';
    globalSlot=normalizeThemeSlot(fbAp.global,guestPals);
    TABS.forEach(t=>{tabsObj[t.id]=normalizeThemeSlot(fbAp.tabs?.[t.id],guestPals);});
  }
  S.appearance={dark:darkVal,mode:modeVal,editScope:nextScope,global:globalSlot,lobby:lobbySlot,tabs:tabsObj};
}
export function persistCurrentThemeChange(opts={}){
  const rawScope=opts.scope||'auto';
  const isLobbyTarget=rawScope==='lobby'||(rawScope==='auto'&&(UI.inLobby||S.appearance.editScope==='lobby'));
  const isSheetTarget=rawScope==='sheet'||(rawScope==='auto'&&!isLobbyTarget)||(!UI.inLobby&&S.appearance.editScope!=='lobby'&&rawScope==='palettes');
  const nowMs=Date.now();
  const curPals=normalizeCustomPalettesList(S.customPalettes||[]);
  S.customPalettes=curPals;
  const curLobby=normalizeThemeSlot(getLobbyStyleSlot(),curPals);
  const curSheet=normalizeThemeSheet({mode:S.appearance.mode,global:S.appearance.global,tabs:S.appearance.tabs},curPals);
  const cid=String(S.charId||'').trim();

  if(CLOUD.currentUser){
    let uk=findUserKeyByName(CLOUD.currentUser);
    if(!uk){
      uk=String(CLOUD.currentUser).trim();
      if(!CLOUD.registry.users||typeof CLOUD.registry.users!=='object') CLOUD.registry.users={};
      CLOUD.registry.users[uk]=ensureUserRecord(uk,{userId:'usr_'+uid(),passHash:'',createdAt:stamp(),avatar:'',nameHistory:[]},null);
    }
    const curRec=CLOUD.registry.users[uk];
    const baseTp=normalizeThemePrefs(curRec?.themePrefs)||createDefaultThemePrefs();
    const localBgMap=loadUserLocalBgMap(uk);
    baseTp.customPalettes=clone(curPals);
    if(rawScope==='dark'){
      baseTp.dark=Boolean(S.appearance.dark);
      if(!UI.inLobby&&UI.sheetLoaded&&S.appearance.editScope!=='lobby'&&cid&&baseTp.sheetByChar?.[cid]){
        baseTp.sheetByChar[cid].dark=baseTp.dark;
        baseTp.sheetByChar[cid].updatedAtMs=nowMs;
      }
    }
    if(isLobbyTarget||rawScope==='palettes'){
      baseTp.lobby=clone(curLobby);
    }
    if(isSheetTarget){
      baseTp.sheet=clone(curSheet);
      baseTp.sheetCustomized=true;
      if(UI.sheetLoaded&&cid){
        baseTp.sheetByChar[cid]={
          dark:Boolean(S.appearance.dark),
          mode:curSheet.mode,
          global:clone(curSheet.global),
          tabs:clone(curSheet.tabs),
          updatedAtMs:nowMs
        };
      }
    }
    if(opts.clearBgSlot){
      if(isLobbyTarget){
        delete localBgMap.lobby;
      }else if(S.appearance.mode==='perTab'){
        const tid=S.appearance.editScope||S.activeTab||'attributes';
        delete localBgMap[`sheet:tab:${tid}`];
        if(cid) delete localBgMap[`char:${cid}:tab:${tid}`];
      }else{
        delete localBgMap['sheet:global'];
        if(cid) delete localBgMap[`char:${cid}:global`];
      }
      saveUserLocalBgMap(uk,localBgMap);
    }
    baseTp.updatedAtMs=nowMs;
    const {cleanPrefs,hadOversized}=sanitizeThemePrefsForRegistry(baseTp,uk);
    curRec.themePrefs=cleanPrefs;
    saveRegistryLocal();
    scheduleThemePrefsSync(Boolean(opts.immediateSync));
    if(hadOversized&&(Date.now()-lastThemeBgWarnMs>4000)){
      lastThemeBgWarnMs=Date.now();
      toast('ℹ️ Hintergrundbild zu groß für Cloud-Sync – Farben & Einstellungen werden synchronisiert, Bild bleibt lokal gespeichert.',4500);
    }
    return;
  }

  // Gast-Modus: ausschließlich lokal unter GUEST_THEME_KEY speichern (niemals User-Records verändern)
  const gp=loadGuestThemePrefs();
  gp.customPalettes=clone(curPals);
  if(rawScope==='dark'){
    gp.dark=Boolean(S.appearance.dark);
    if(!UI.inLobby&&UI.sheetLoaded&&cid&&gp.sheetByChar?.[cid]){
      gp.sheetByChar[cid].dark=gp.dark;
      gp.sheetByChar[cid].updatedAtMs=nowMs;
    }
  }
  if(isLobbyTarget||rawScope==='palettes'){
    gp.lobby=clone(curLobby);
  }
  if(isSheetTarget){
    gp.sheet=clone(curSheet);
    gp.sheetCustomized=true;
    if(UI.sheetLoaded&&cid){
      gp.sheetByChar[cid]={
        dark:Boolean(S.appearance.dark),
        mode:curSheet.mode,
        global:clone(curSheet.global),
        tabs:clone(curSheet.tabs),
        updatedAtMs:nowMs
      };
    }
  }
  gp.updatedAtMs=nowMs;
  saveGuestThemePrefs(gp);
}

export function resolvePaletteColors(sc){
  if(sc?.customColors&&isHex(sc.customColors.bg)){
    const cc=sc.customColors;
    return [cc.isLt?1:0,cc.bg,cc.acc||'#0ea5e9',cc.acc2||'#6366f1',cc.txt||'#f1f5f9',cc.mut||'#94a3b8',cc.btnTxt||'#ffffff'];
  }
  const cp=(S.customPalettes||[]).find(p=>p.id===sc?.palette);
  if(cp) return [cp.isLt?1:0,cp.bg,cp.acc,cp.acc2,cp.txt,cp.mut,cp.btnTxt];
  const pal=PALETTES[sc?.palette]||PALETTES.azur;
  return S.appearance.dark?pal[3]:pal[4];
}

export function syncPalDraftFromSlot(sc=getEditStyleSlot()){
  const [isLt,bg,acc,acc2,txt,mut,btnTxt]=resolvePaletteColors(sc);
  const cp=(S.customPalettes||[]).find(p=>p.id===sc?.palette);
  UI.palDraft={
    name:cp?cp.name:'',
    isLt:Boolean(isLt),
    bg:bg||'#020617',
    acc:acc||'#0ea5e9',
    acc2:acc2||'#6366f1',
    txt:txt||'#f1f5f9',
    mut:mut||'#94a3b8',
    btnTxt:btnTxt||'#ffffff'
  };
}

export function applyTheme(){
  const sc=getDisplayStyleSlot(), [isLt,bg,acc,acc2,txt,mut,btnTxt]=resolvePaletteColors(sc);
  document.documentElement.classList.toggle('dark',!isLt);
  const st=document.documentElement.style;
  st.setProperty('--bg',bg); st.setProperty('--txt',txt); st.setProperty('--mut',mut); st.setProperty('--acc',acc); st.setProperty('--acc2',acc2); st.setProperty('--btnTxt',btnTxt);
  st.setProperty('--surf',isLt?`color-mix(in srgb,color-mix(in srgb,#fff 88%,${bg}) 94%,transparent)`:`color-mix(in srgb,color-mix(in srgb,${bg} 88%,${txt}) 92%,transparent)`);
  st.setProperty('--surf2',isLt?`color-mix(in srgb,color-mix(in srgb,#fff 68%,${bg}) 97%,transparent)`:`color-mix(in srgb,color-mix(in srgb,${bg} 94%,${txt}) 96%,transparent)`);
  st.setProperty('--bdr',isLt?`color-mix(in srgb,${txt} 18%,${bg})`:`color-mix(in srgb,${acc} 22%,color-mix(in srgb,${bg} 82%,${txt}))`);
  st.setProperty('--accT',isLt?`color-mix(in srgb,${acc} 84%,#000)`:`color-mix(in srgb,${acc} 78%,#fff)`);
  st.setProperty('--accS',`color-mix(in srgb,${acc} 16%,transparent)`); st.setProperty('--accB',`color-mix(in srgb,${acc} 48%,transparent)`);
  st.setProperty('--t1',`color-mix(in srgb,${acc} 18%,transparent)`); st.setProperty('--t2',`color-mix(in srgb,${acc2} 14%,transparent)`);
  const bgL=$('bgLayer'), bgS=$('bgScrim');
  if(sc.bg){
    const bl=Math.max(0,Math.min(20,toInt(sc.blur,0)));
    bgL.style.backgroundImage=`url("${sc.bg}")`; bgL.style.backgroundSize=sc.fit||'cover';
    bgL.style.backgroundPosition=sc.pos==='top'?'center top':sc.pos==='bottom'?'center bottom':'center center';
    bgL.style.filter=bl>0?`blur(${bl}px)`:'none'; bgL.style.transform=bl>0?'scale(1.04)':'none';
    bgS.style.opacity=String(Math.max(0,Math.min(95,toInt(sc.overlay,75)))/100);
  }else{
    bgL.style.backgroundImage='radial-gradient(circle at 12% 8%,var(--t1),transparent 42%),radial-gradient(circle at 88% 12%,var(--t2),transparent 42%)';
    bgL.style.backgroundSize='cover'; bgL.style.backgroundPosition='center center'; bgL.style.filter='none'; bgL.style.transform='none'; bgS.style.opacity='0';
  }
}

export function renderDelConfirm(kind,id,compact=false){
  if(UI.confirmDelId===id) return `<span class="inline-flex items-center gap-1"><button type="button" data-action="confirm-del-pw" data-kind="${kind}" data-id="${id}" class="btn bg-rose-600 text-white border-rose-600 py-1 px-2 text-[11px] font-black">Sicher? (2/2)</button><button type="button" data-action="cancel-del-pw" class="btn py-1 px-2 text-[11px]">✕</button></span>`;
  return compact?`<button type="button" data-action="ask-del-pw" data-id="${id}" class="t-mut hover:text-rose-500 font-bold px-1">✕</button>`:`<button type="button" data-action="ask-del-pw" data-id="${id}" data-tip="Zweistufige Sicherheitsabfrage" class="btn btn-err py-1 px-2.5 text-xs">Entfernen</button>`;
}

export function renderItemImgBox(kind,id,imgUrl,small=false){
  const sz=small?'w-8 h-8 rounded-lg':'w-12 h-12 rounded-xl';
  const tip=imgUrl?'Bild-Aktionen öffnen (ändern, Großansicht oder entfernen)':'Bild für diesen Gegenstand hochladen';
  return `<div class="relative shrink-0">
    <button type="button" data-action="pick-item-img" data-kind="${kind}" data-id="${id}" data-tip="${tip}" class="${sz} overflow-hidden border bdr-acc bg-acc-soft flex items-center justify-center cursor-pointer hover:opacity-90 transition-opacity shadow-sm">${imgUrl?`<img src="${imgUrl}" class="w-full h-full object-cover"/>`:`<span class="text-[10px] font-black text-acc leading-none text-center">🖼${small?'':'<br/>+'}</span>`}</button>
  </div>`;
}

try{
  CLOUD.serverUrl=localStorage.getItem('scherbensturm_cloud_url')||'';
  CLOUD.currentUser=localStorage.getItem('scherbensturm_cloud_user')||'';
  CLOUD.isAdmin=localStorage.getItem('scherbensturm_cloud_admin')==='1';
  CLOUD.diceToast=localStorage.getItem('scherbensturm_dice_toast')!=='0';
  CLOUD.lobbyDiceH=Math.max(180,Math.min(1200,toInt(localStorage.getItem('scherbensturm_lobby_dice_h'),340)));
  CLOUD.galleryCollapsed=localStorage.getItem('scherbensturm_lobby_gallery_collapsed')==='1';
  CLOUD.activeCampaignId=localStorage.getItem('scherbensturm_active_campaign')||'default';
  const locReg=localStorage.getItem('scherbensturm_lobby_registry');
  if(locReg){
    const parsedReg=JSON.parse(locReg)||{};
    CLOUD.registry={
      ...CLOUD.registry,
      ...parsedReg,
      charCampaigns:(parsedReg.charCampaigns&&typeof parsedReg.charCampaigns==='object')?parsedReg.charCampaigns:{},
      publicNotes:(parsedReg.publicNotes&&typeof parsedReg.publicNotes==='object')?parsedReg.publicNotes:{},
      campaignSharedNotes:(parsedReg.campaignSharedNotes&&typeof parsedReg.campaignSharedNotes==='object')?parsedReg.campaignSharedNotes:{},
      deletedCharIds:Array.isArray(parsedReg.deletedCharIds)?[...new Set(parsedReg.deletedCharIds.map(x=>String(x||'').trim()).filter(Boolean))]:[],
      campaigns:normalizeCampaigns(parsedReg.campaigns),
      gmUsers:Array.isArray(parsedReg.gmUsers)?parsedReg.gmUsers:[],
      lobbyLogo:String(parsedReg.lobbyLogo||''),
      diceClearedByCamp:(parsedReg.diceClearedByCamp&&typeof parsedReg.diceClearedByCamp==='object')?parsedReg.diceClearedByCamp:{}
    };
  }
  if(ensureAllRegistryUsers()) saveRegistryLocal();
  const locDice=localStorage.getItem('scherbensturm_live_dice_feed');
  if(locDice) CLOUD.diceFeed=JSON.parse(locDice)||[];
  if(Array.isArray(CLOUD.registry.diceFeed)&&CLOUD.registry.diceFeed.length&&!CLOUD.diceFeed.length) CLOUD.diceFeed=CLOUD.registry.diceFeed;
  const locSecret=localStorage.getItem('scherbensturm_admin_secret_rolls');
  if(locSecret){const parsedSec=JSON.parse(locSecret);if(Array.isArray(parsedSec)) CLOUD.secretRolls=parsedSec.slice(0,30);}
}catch(e){}
