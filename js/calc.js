import {
  ATTRS, STATUS_DEFS, DEF_SEC_COLS, DEF_MAIN_ARTS, DEF_ACTION_SUBS, DEF_PW_TAGS, TR_DEFS, SK_CATS, SK_RANKS, PW_TIERS, COL_PRESETS, DYN_FACTOR_PRESETS, DYN_FUNCS, DYN_FUNC_NAMES, POWER_PACK_SCHEMA, LP_REGEN_BASE, MLP_REGEN_BASE
} from './constants.js';
import {
  $, uid, stamp, esc, clone, toInt, toFlt, fmtN, fmtSign, isHex, sortAlpha, stripHtml, toRtfHtml, hasTagX, fmtTagLabel, sanitizeSecHierarchy, isDynWordChar
} from './utils.js';
import {
  hooks
} from './ui-hooks.js';
import {
  syncPwUseCostsLegacy, toast, logChron, normPwEntry, save, findMainArt, isReservedPwTerm, getWeaponSubtype, isWeaponMassiv, S, D, UI
} from './state.js';

export const getTagDesc=(list,name,x,sheet=S)=>{
  const found=findEqTagDef(name,list,sheet);
  const raw=found?.desc||'Keine Beschreibung hinterlegt.';
  const prev=formatTagW3Preview(list,name,x,sheet);
  if(hasTagX(name)&&x!==undefined&&x!=='') return `${fmtTagLabel(name,x)}\n${raw.replace(/\bX\b/g,String(x))}${prev}`;
  return `${name}\n${raw}${prev}`;
};
export function getStatusEffValues(k,sheet=S){
  const def=STATUS_DEFS.find(d=>d.k===k);
  if(!def) return {active:false,stacks:1,iniDir:1,autoStat:0,effStat:0,hasStatOvr:false,autoAdv:0,effAdv:0,hasAdvOvr:false};
  const st=sheet.statusEffects?.[k]||{active:false,stacks:1,iniDir:1,statOvr:'',advOvr:''};
  const stacks=Math.max(1,toInt(st.stacks,1));
  const iniDir=toInt(st.iniDir,1)<0?-1:1;
  const autoStat=(def.hasIniChoice?(Math.abs(def.baseStat)*iniDir):def.baseStat)*stacks;
  const hasStatOvr=st.statOvr!==undefined&&st.statOvr!==null&&String(st.statOvr).trim()!=='';
  const effStat=hasStatOvr?toInt(st.statOvr,autoStat):autoStat;
  const autoAdv=def.baseAdv*stacks;
  const hasAdvOvr=st.advOvr!==undefined&&st.advOvr!==null&&String(st.advOvr).trim()!=='';
  const effAdv=Math.max(0,hasAdvOvr?toInt(st.advOvr,autoAdv):autoAdv);
  return {def,st,active:Boolean(st.active),stacks,iniDir,autoStat,effStat,hasStatOvr,autoAdv,effAdv,hasAdvOvr};
}

export const cresName=(sheet=S)=>String(sheet.customRes?.name||'').trim()||'Benutzerdefiniert';
export const makeExtraSec=(idx=1)=>({id:uid(),name:`Ressource ${idx}`,current:3,max:3,color:COL_PRESETS[(idx+5)%COL_PRESETS.length]||'#34d399'});
export const getExtraSecName=ex=>String(ex?.name||'').trim()||'Ressource';
export const getResLabel=(k,sheet=S)=>{if(String(k||'').startsWith('ex_')){const ex=(sheet.extraSecList||[]).find(x=>'ex_'+x.id===k);return ex?getExtraSecName(ex):k;}return ({ap:'AP',map:'mAP',lp:'LP',mlp:'mLP',cres:cresName(sheet),bst:'BSt'})[k]||k;};
export function getAvailableUseResources(sheet=S){
  const base=['ap','map','lp','mlp','cres',...(sheet.extraSecList||[]).map(ex=>'ex_'+ex.id),'bst'];
  const extra=(sheet.useResList||[]).map(r=>String(r||'').trim()).filter(Boolean);
  const keys=[...new Set([...base,...extra])];
  return keys.map(k=>({res:k,label:getResLabel(k,sheet),color:getSecCol(k,sheet)||'var(--acc)'}));
}
export function getActivePwUseCosts(it){
  const raw=Array.isArray(it?.useCosts)?it.useCosts:(it?.useRes&&toInt(it?.useAmt,0)>0?[{res:it.useRes,amt:toInt(it.useAmt,0)}]:[]);
  return raw.filter(c=>c&&String(c.res||'').trim()&&toInt(c.amt,0)>0).map(c=>({res:String(c.res).trim(),amt:Math.max(0,toInt(c.amt,0))}));
}
export function formatPwUseCosts(it,sheet=S){
  const act=getActivePwUseCosts(it);
  return act.map(c=>`${c.amt} ${getResLabel(c.res,sheet)}`).join(' + ');
}
export function isReservableResKey(k){
  const key=String(k||'').trim();
  return ['ap','map','lp','mlp','cres'].includes(key)||key.startsWith('ex_');
}
export function getReservablePwCosts(it){
  return getActivePwUseCosts(it).filter(c=>isReservableResKey(c.res));
}
export function getReservedTotals(sheet=S){
  const tot={ap:0,map:0,lp:0,mlp:0,cres:0,extra:{},byRes:{},entries:[]};
  const addList=(arr,kind)=>{
    (arr||[]).forEach(it=>{
      if(!it||it.reserved!==true) return;
      const src=(Array.isArray(it.reservedCosts)&&it.reservedCosts.length)?it.reservedCosts:getReservablePwCosts(it);
      const costs=src.filter(c=>c&&isReservableResKey(c.res)&&toInt(c.amt,0)>0).map(c=>({res:String(c.res).trim(),amt:Math.max(0,toInt(c.amt,0))}));
      costs.forEach(c=>{
        tot.byRes[c.res]=(tot.byRes[c.res]||0)+c.amt;
        if(c.res==='ap'||c.res==='map'||c.res==='lp'||c.res==='mlp'||c.res==='cres') tot[c.res]+=c.amt;
        else if(c.res.startsWith('ex_')){const exId=c.res.slice(3);tot.extra[exId]=(tot.extra[exId]||0)+c.amt;}
      });
      tot.entries.push({kind,id:it.id,name:String(it.name||'').trim()||(kind==='augment'?'Unbenanntes Augment':'Unbenannte Kraft'),color:it.color||'',costs});
    });
  };
  addList(sheet.powers,'power');
  addList(sheet.augments,'augment');
  return tot;
}
export function getEffectivePoolCap(resKey,M=null,sheet=S){
  const mods=M||calcActiveMods(sheet);
  const key=String(resKey||'').trim();
  let fullMax=0;
  if(key==='ap') fullMax=getApMax(mods,sheet);
  else if(key==='map') fullMax=getMapMax(mods,sheet);
  else if(key==='lp') fullMax=getLpMax(mods,sheet);
  else if(key==='mlp') fullMax=getMlpMax(mods,sheet);
  else if(key==='cres') fullMax=getCresMax(mods,sheet);
  else if(key.startsWith('ex_')){
    const ex=(sheet.extraSecList||[]).find(x=>'ex_'+x.id===key);
    fullMax=ex?getExtraSecMax(ex,mods,sheet):0;
  }
  const R=getReservedTotals(sheet);
  const reserved=R.byRes[key]||0;
  return {fullMax,reserved,effMax:Math.max(0,fullMax-reserved)};
}
export function getReservedSrcList(resKey,sheet=S){
  const R=getReservedTotals(sheet), out=[];
  R.entries.forEach(e=>{
    const sum=e.costs.filter(c=>c.res===resKey).reduce((s,c)=>s+c.amt,0);
    if(sum>0) out.push(`${e.name} −${sum}`);
  });
  return out;
}
export function fmtReservedTipLine(resKey,M=null,sheet=S){
  const mods=M||calcActiveMods(sheet);
  const cap=getEffectivePoolCap(resKey,mods,sheet);
  if(cap.reserved<=0) return '';
  const srcs=getReservedSrcList(resKey,sheet);
  return `\n• Reserviert: −${cap.reserved}${srcs.length?` (${srcs.join(', ')})`:''} → Frei max: ${cap.effMax}`;
}

export function getStatGroups(sheet=S){
  const cn=cresName(sheet), exMax=(sheet.extraSecList||[]).map(x=>`${getExtraSecName(x)}-Max`), g=[
    ['Attribute',['ST','KO','PR','GW','WA','IN','AU','WK','Alle Attribute']],
    ['Sekundärwerte',['LP-Max','mLP-Max','LP-Regeneration','mLP-Regeneration','Regeneration (LP & mLP)','Ini','AP-Max','mAP-Max',`${cn}-Max`,...exMax,'SP-Mod']],
    ['Schwellenwerte',['Verwundungsschwellen','Alle Verwundungsstufen','Verwundung (leicht)','Verwundung (mittel)','Verwundung (schwer)','Traumaschwellen','Alle Traumastufen','Trauma (leicht)','Trauma (mittel)','Trauma (schwer)']],
    ['Kampf & Bewegung',['BSt','Basis-Bewegung','Rüstungsschutz','Testschwelle','Kritische Ziffer (Trefferwürfe)','Kritische Ziffer (Alle Tests)']],
    ['Vor- & Nachteile',['Vorteile (Trefferwürfe)','Nachteile (Trefferwürfe)','Vorteile (Abwehr/Parieren/Blocken)','Nachteile (Abwehr/Parieren/Blocken)','Vorteile (Parieren)','Nachteile (Parieren)','Vorteile (Blocken)','Nachteile (Blocken)','Vorteile (Ausweichen)','Nachteile (Ausweichen)','Vorteile (Alle Proben)','Nachteile (Alle Proben)']],
    ['Statuseffekte (nur bei ⚡ Einsetzen)',STATUS_DEFS.map(d=>`Status: ${d.name}`)]
  ];
  if((sheet.customStats||[]).length) g.push(['Eigene Variablen',sheet.customStats]);
  return g;
}

export function formatBldToken(amtRaw,statRaw){
  const st=String(statRaw||'LP-Max').trim();
  if(/^status\s*:/i.test(st)){
    const stName=st.replace(/^status\s*:\s*/i,'').trim();
    const n=Math.max(1,Math.abs(toInt(amtRaw,1)));
    return n>1?`[Status: ${stName} (${n}×)]`:`[Status: ${stName}]`;
  }
  return `[${String(amtRaw||'+1').trim().replace(/^(\d)/,'+$1')} ${st}]`;
}
export function getDynVarGroups(sheet=S){
  const cn=cresName(sheet);
  const ownRes=[`${cn}-Max`,...(sheet.extraSecList||[]).map(x=>`${getExtraSecName(x)}-Max`)];
  return [
    ['Attribute',ATTRS.map(a=>a.k)],
    ['Sekundärwerte',['LP-Max','mLP-Max','AP-Max','mAP-Max','Ini','BSt','Stufe','Bew']],
    ['Eigene Ressourcen',ownRes]
  ];
}
export function buildDynFormulaSpec(it,M=null,sheet=S){
  const mods=M||calcActiveMods(sheet);
  const v=String(it?.bldDynVar||'WA').trim()||'WA';
  const facRaw=it?.bldDynFactor!==undefined&&it?.bldDynFactor!==null?String(it.bldDynFactor):'/2';
  const fac=facRaw.trim();
  let core=v;
  if(fac){
    if(/^[+\-*/×÷·:]/.test(fac)) core=`${v}${fac}`;
    else if(/^[xX]\s*[0-9.(]/.test(fac)) core=/^[xX]\s+/.test(fac)?`${v} ${fac}`:`${v}${fac}`;
    else if(/^[0-9.]/.test(fac)) core=`${v}*${fac}`;
    else core=`${v} ${fac}`;
  }
  const rnd=['floor','ceil','round'].includes(it?.bldDynRound)?it.bldDynRound:'';
  const expr=rnd?`${rnd}(${core})`:core;
  const token=`{{${expr}}}`;
  const evalRes=evalDynamicFormula(expr,mods,sheet);
  return {varName:v,factor:facRaw,round:rnd,expr,token,evalRes};
}
export function getDynPresetSelectVal(factorRaw){
  const f=String(factorRaw??'').trim();
  return DYN_FACTOR_PRESETS.some(p=>p.v===f)?f:'__custom__';
}
export function getPwBuilderToken(it,sortedSkillsOpt=null,M=null,sheet=S){
  if(!it) return formatBldToken('+1','LP-Max');
  if(it.bldMode==='dyn'){
    const spec=buildDynFormulaSpec(it,M||calcActiveMods(sheet),sheet);
    return spec.evalRes.ok?spec.token:'';
  }
  if(it.bldMode!=='skill') return formatBldToken(it?.bldAmt,it?.bldStat);
  const digits=String(it.bldSkCnt??'').replace(/\D/g,'');
  const parsed=digits?parseInt(digits,10):0;
  const n=parsed>=1?parsed:1;
  const hasPreSorted=Array.isArray(sortedSkillsOpt);
  const namedSkills=hasPreSorted?sortedSkillsOpt:(sheet.skills||[]).filter(s=>s&&String(s.name||'').trim());
  if(!namedSkills.length) return '';
  let sk=it.bldSkId?namedSkills.find(s=>s.id===it.bldSkId):null;
  if(!sk){
    sk=hasPreSorted?namedSkills[0]:[...namedSkills].sort((a,b)=>String(a.name).trim().localeCompare(String(b.name).trim(),'de'))[0];
  }
  if(!sk) return '';
  const skName=String(sk.name).trim();
  const wort=it.bldSkKind==='dis'?(n===1?'Nachteil':'Nachteile'):(n===1?'Vorteil':'Vorteile');
  return `[+${n} ${wort} (${skName})]`;
}
export function resolveStatusDefByName(rawName){
  const cl=String(rawName||'').trim().toLowerCase().replace(/ä/g,'ae').replace(/ö/g,'oe').replace(/ü/g,'ue');
  return STATUS_DEFS.find(d=>d.k===cl||d.name.toLowerCase()===String(rawName||'').trim().toLowerCase()||d.name.toLowerCase().replace(/ä/g,'ae').replace(/ö/g,'oe').replace(/ü/g,'ue')===cl)||null;
}
export const RE_DYN_FORMULA=/\{\{([^{}]*)\}\}/g;
export const maskDynFormulas=s=>String(s??'').replace(RE_DYN_FORMULA,m=>' '.repeat(m.length));
export function decodeDynEntities(s){
  return String(s??'')
    .replace(/&nbsp;|&#160;/gi,' ')
    .replace(/&times;|&#215;/gi,'×')
    .replace(/&divide;|&#247;/gi,'/')
    .replace(/&minus;|&#8722;|[−–]/g,'-')
    .replace(/&amp;/gi,'&')
    .replace(/&lt;/gi,'<')
    .replace(/&gt;/gi,'>')
    .replace(/&quot;/gi,'"')
    .replace(/&#39;|&apos;/gi,"'");
}
export function getPrimaryMoveBew(M=null,sheet=S){
  const mods=M||calcActiveMods(sheet);
  const mv0=sheet.movements?.[0];
  const bstDelta=getEffBst(mods,sheet)-getBstAuto(sheet);
  const autoBew=Math.max(0,toFlt(mv0?.base,5)+(mods.moveBase||0)+bstDelta);
  const hasOvr=mv0&&mv0.ovr!==undefined&&mv0.ovr!==null&&String(mv0.ovr).trim()!=='';
  return hasOvr?Math.max(0,toFlt(mv0.ovr,autoBew)):autoBew;
}
export function getDynamicVarEntries(M=null,sheet=S){
  const mods=M||calcActiveMods(sheet);
  const entries=[], seen=new Set();
  const addVar=(name,val)=>{
    const k=String(name||'').trim();
    if(!k) return;
    const low=k.toLowerCase();
    if(seen.has(low)) return;
    seen.add(low);
    entries.push({name:k,low,val:Number.isFinite(val)?val:0});
  };
  ATTRS.forEach(a=>addVar(a.k,getAttrTot(a.k,mods,sheet)));
  addVar('LP-Max',getLpMax(mods,sheet));
  addVar('LP',getLpMax(mods,sheet));
  addVar('mLP-Max',getMlpMax(mods,sheet));
  addVar('mLP',getMlpMax(mods,sheet));
  addVar('AP-Max',getApMax(mods,sheet));
  addVar('AP',getApMax(mods,sheet));
  addVar('mAP-Max',getMapMax(mods,sheet));
  addVar('mAP',getMapMax(mods,sheet));
  addVar('Ini',getIniTot(mods,sheet));
  addVar('Initiative',getIniTot(mods,sheet));
  addVar('BSt',getEffBst(mods,sheet));
  addVar('Stufe',toInt(sheet.progression?.level,1));
  addVar('Level',toInt(sheet.progression?.level,1));
  addVar('Basis-Bewegung',getPrimaryMoveBew(mods,sheet));
  addVar('Bewegung',getPrimaryMoveBew(mods,sheet));
  addVar('Bew',getPrimaryMoveBew(mods,sheet));
  addVar('LP-Regeneration',getLpRegen(mods,sheet));
  addVar('LP-Reg',getLpRegen(mods,sheet));
  addVar('mLP-Regeneration',getMlpRegen(mods,sheet));
  addVar('mLP-Reg',getMlpRegen(mods,sheet));
  const cn=cresName(sheet), cnMax=getCresMax(mods,sheet);
  addVar(`${cn}-Max`,cnMax);
  addVar(cn,cnMax);
  (sheet.extraSecList||[]).forEach(ex=>{
    const nm=getExtraSecName(ex), mx=getExtraSecMax(ex,mods,sheet);
    addVar(`${nm}-Max`,mx);
    addVar(nm,mx);
  });
  entries.sort((a,b)=>b.low.length-a.low.length);
  return entries;
}
export function evalDynamicFormula(expr,M=null,sheet=S){
  const mods=M||calcActiveMods(sheet);
  const rawExpr=decodeDynEntities(expr).replace(/\s+/g,' ').trim();
  const fail=err=>({ok:false,value:null,formatted:'',breakdown:'',rawExpr,error:err||'Ungültige Formel'});
  if(!rawExpr) return fail('Leere Formel');
  if(rawExpr.length>240) return fail('Formel zu lang');
  const vars=getDynamicVarEntries(mods,sheet);
  const lowSrc=rawExpr.toLowerCase();
  const tokens=[];
  let i=0;
  const prevType=()=>tokens.length?tokens[tokens.length-1].t:'';
  const prevIsVal=()=>['num','var','rparen'].includes(prevType());
  const startsWithKnownTerm=pos=>{
    const rest=lowSrc.slice(pos);
    if(!rest) return false;
    for(const fn of DYN_FUNC_NAMES){
      if(rest.startsWith(fn)){
        const after=rest.slice(fn.length);
        if(/^\s*\(/.test(after)) return true;
      }
    }
    for(const v of vars){
      if(rest.startsWith(v.low)){
        const ch=rest[v.low.length]||'';
        if(!isDynWordChar(ch)||((ch==='x'||ch==='X')&&/^[0-9(]/.test(rest.slice(v.low.length+1)))) return true;
      }
    }
    return false;
  };
  while(i<rawExpr.length){
    const ch=rawExpr[i];
    if(/\s/.test(ch)){i++;continue;}
    if(ch==='('){tokens.push({t:'lparen'});i++;continue;}
    if(ch===')'){tokens.push({t:'rparen'});i++;continue;}
    if(ch===';'){tokens.push({t:'sep'});i++;continue;}
    if(ch===','){tokens.push({t:'comma'});i++;continue;}
    if(ch==='+'){tokens.push({t:'op',op:'+'});i++;continue;}
    if(ch==='-'){tokens.push({t:'op',op:'-'});i++;continue;}
    if(ch==='*'||ch==='×'||ch==='·'){tokens.push({t:'op',op:'*'});i++;continue;}
    if(ch==='/'||ch===':'||ch==='÷'){tokens.push({t:'op',op:'/'});i++;continue;}
    if(/[0-9]/.test(ch)||(ch==='.'&&/[0-9]/.test(rawExpr[i+1]||''))){
      const start=i;
      while(i<rawExpr.length&&/[0-9]/.test(rawExpr[i])) i++;
      let splitPair=null;
      if(rawExpr[i]==='.'&&/[0-9]/.test(rawExpr[i+1]||'')){
        i++;
        while(i<rawExpr.length&&/[0-9]/.test(rawExpr[i])) i++;
      }else if(rawExpr[i]===','&&/[0-9]/.test(rawExpr[i+1]||'')){
        const leftPart=rawExpr.slice(start,i);
        const cPos=i;
        i++;
        while(i<rawExpr.length&&/[0-9]/.test(rawExpr[i])) i++;
        const rightPart=rawExpr.slice(cPos+1,i);
        splitPair=[Number(leftPart),Number(rightPart)];
      }
      const rawNum=rawExpr.slice(start,i);
      const numVal=Number(rawNum.replace(',','.'));
      if(!Number.isFinite(numVal)) return fail(`Ungültige Zahl „${rawNum}“`);
      tokens.push({t:'num',val:numVal,raw:rawNum,splitPair});
      continue;
    }
    if((ch==='x'||ch==='X')&&prevIsVal()){
      const nxt=rawExpr[i+1]||'';
      if(!isDynWordChar(nxt)||/[0-9(]/.test(nxt)||((prevType()==='num'||prevType()==='rparen')&&startsWithKnownTerm(i+1))){
        tokens.push({t:'op',op:'*'});
        i++;
        continue;
      }
    }
    let matchedFn='';
    for(const fn of DYN_FUNC_NAMES){
      if(lowSrc.startsWith(fn,i)){
        const afterPos=i+fn.length;
        const afterCh=rawExpr[afterPos]||'';
        if(!isDynWordChar(afterCh)&&/^\s*\(/.test(rawExpr.slice(afterPos))){
          matchedFn=fn;
          break;
        }
      }
    }
    if(matchedFn){
      tokens.push({t:'func',name:matchedFn,raw:rawExpr.slice(i,i+matchedFn.length)});
      i+=matchedFn.length;
      continue;
    }
    let matchedVar=null;
    for(const v of vars){
      if(lowSrc.startsWith(v.low,i)){
        const afterPos=i+v.low.length;
        const afterCh=rawExpr[afterPos]||'';
        const okBoundary=!isDynWordChar(afterCh)||((afterCh==='x'||afterCh==='X')&&/^[0-9(]/.test(rawExpr.slice(afterPos+1)));
        if(okBoundary){
          matchedVar=v;
          break;
        }
      }
    }
    if(matchedVar){
      tokens.push({t:'var',name:matchedVar.name,val:matchedVar.val,raw:rawExpr.slice(i,i+matchedVar.low.length)});
      i+=matchedVar.low.length;
      continue;
    }
    const unkM=rawExpr.slice(i).match(/^[a-zA-ZäöüÄÖÜß_][a-zA-Z0-9äöüÄÖÜß_-]*/);
    if(unkM) return fail(`Unbekannte Variable „${unkM[0]}“`);
    return fail(`Unerwartetes Zeichen „${ch}“`);
  }
  if(!tokens.length) return fail('Leere Formel');
  let pos=0, depth=0, hasOpOrFn=false;
  const peek=()=>tokens[pos]||null;
  const next=()=>tokens[pos++]||null;
  const parseExpr=()=>{
    let left=parseTerm();
    if(!left.ok) return left;
    while(peek()&&peek().t==='op'&&(peek().op==='+'||peek().op==='-')){
      const op=next().op;
      hasOpOrFn=true;
      const right=parseTerm();
      if(!right.ok) return right;
      left={ok:true,val:op==='+'?(left.val+right.val):(left.val-right.val),txt:`${left.txt} ${op} ${right.txt}`};
    }
    return left;
  };
  const parseTerm=()=>{
    let left=parseUnary();
    if(!left.ok) return left;
    while(peek()&&peek().t==='op'&&(peek().op==='*'||peek().op==='/')){
      const op=next().op;
      hasOpOrFn=true;
      const right=parseUnary();
      if(!right.ok) return right;
      if(op==='/'&&right.val===0) return fail('Division durch 0');
      left={ok:true,val:op==='*'?(left.val*right.val):(left.val/right.val),txt:`${left.txt} ${op} ${right.txt}`};
    }
    return left;
  };
  const parseUnary=()=>{
    if(peek()&&peek().t==='op'&&(peek().op==='+'||peek().op==='-')){
      const op=next().op;
      hasOpOrFn=true;
      const inner=parseUnary();
      if(!inner.ok) return inner;
      return {ok:true,val:op==='-'?-inner.val:inner.val,txt:op==='-'?`-${inner.txt}`:inner.txt};
    }
    return parsePrimary();
  };
  const parsePrimary=()=>{
    if(++depth>64) return fail('Zu tief verschachtelt');
    try{
      const tk=peek();
      if(!tk) return fail('Unerwartetes Formelende');
      if(tk.t==='num'){
        next();
        return {ok:true,val:tk.val,txt:fmtN(tk.val),singleNumTok:tk};
      }
      if(tk.t==='var'){
        next();
        return {ok:true,val:tk.val,txt:fmtN(tk.val),singleVarName:tk.name};
      }
      if(tk.t==='lparen'){
        next();
        const inner=parseExpr();
        if(!inner.ok) return inner;
        if(!peek()||peek().t!=='rparen') return fail('Schließende Klammer „)“ fehlt');
        next();
        return {ok:true,val:inner.val,txt:`(${inner.txt})`};
      }
      if(tk.t==='func'){
        const fnTok=next();
        const def=DYN_FUNCS[fnTok.name];
        if(!peek()||peek().t!=='lparen') return fail(`„(“ nach ${fnTok.raw} erwartet`);
        next();
        hasOpOrFn=true;
        const args=[];
        if(peek()&&peek().t!=='rparen'){
          while(true){
            const a=parseExpr();
            if(!a.ok) return a;
            args.push(a);
            if(peek()&&(peek().t==='comma'||peek().t==='sep')){
              next();
              continue;
            }
            break;
          }
        }
        if(!peek()||peek().t!=='rparen') return fail(`Schließende Klammer „)“ für ${fnTok.raw}(...) fehlt`);
        next();
        let effArgs=args;
        if(def.arity<0&&effArgs.length===1&&effArgs[0].singleNumTok&&Array.isArray(effArgs[0].singleNumTok.splitPair)){
          const [aVal,bVal]=effArgs[0].singleNumTok.splitPair;
          effArgs=[{ok:true,val:aVal,txt:fmtN(aVal)},{ok:true,val:bVal,txt:fmtN(bVal)}];
        }
        if(def.arity>0&&effArgs.length!==def.arity) return fail(`${fnTok.raw}(...) erwartet ${def.arity} Argument`);
        if(def.arity<0&&effArgs.length<Math.abs(def.arity)) return fail(`${fnTok.raw}(...) erwartet mindestens ${Math.abs(def.arity)} Argumente`);
        const v=def.fn(effArgs.map(a=>a.val));
        return {ok:true,val:v,txt:`${fnTok.raw}(${effArgs.map(a=>a.txt).join(', ')})`};
      }
      return fail('Ungültige Formelsyntax');
    }finally{depth--;}
  };
  const res=parseExpr();
  if(!res.ok) return res;
  if(pos<tokens.length) return fail('Unerwarteter Rest in Formel');
  if(!Number.isFinite(res.val)) return fail('Ungültiges Rechenergebnis');
  const cleanVal=(Object.is(res.val,-0)||Math.abs(res.val)<1e-12)?0:res.val;
  const formatted=fmtN(cleanVal);
  const breakdown=(!hasOpOrFn&&res.singleVarName)?`${res.singleVarName} = ${formatted}`:`${res.txt} = ${formatted}`;
  return {ok:true,value:cleanVal,formatted,breakdown,rawExpr};
}
export function extractDynamicFormulas(text){
  const plain=stripHtml(text), out=[];
  RE_DYN_FORMULA.lastIndex=0;
  let m;
  while((m=RE_DYN_FORMULA.exec(plain))!==null){
    out.push({raw:m[0],expr:m[1]});
  }
  return out;
}
export const RE_HTML_OR_DYN=/(<[^>]*>)|(\{\{[^{}]*\}\})/g;
export function renderDynamicRtfHtml(rawHtml,M=null,sheet=S){
  const mods=M||calcActiveMods(sheet);
  const html=toRtfHtml(rawHtml);
  if(!html||!html.includes('{{')) return html;
  return html.replace(RE_HTML_OR_DYN,(match,tag,formulaTok)=>{
    if(tag) return tag;
    const inner=formulaTok.slice(2,-2);
    const res=evalDynamicFormula(inner,mods,sheet);
    if(res.ok){
      const tip=`Formel: ${res.rawExpr}\nRechnung: ${res.breakdown}`;
      return `<span class="dyn-val-pill tabular font-extrabold" data-tip="${esc(tip).replace(/\n/g,'&#10;')}">${esc(res.formatted)}</span>`;
    }
    const tip=`Ungültige Formel: ${res.rawExpr||formulaTok}\nFehler: ${res.error||'Syntaxfehler'}`;
    return `<span class="dyn-val-pill dyn-val-err" data-tip="${esc(tip).replace(/\n/g,'&#10;')}">⚠ ${esc(formulaTok)}</span>`;
  });
}
export const RE_STATUS_TOK=/\[(?:([+-]?\d+)\s*(?:x|×)?\s+)?status\s*:\s*([a-zA-ZäöüÄÖÜß]+)(?:\s*(?:\(\s*(\d+)\s*(?:x|×)?\s*\)|(\d+)\s*(?:x|×)?))?\s*\]/gi;
export function parseStatusTokens(text){
  const plain=maskDynFormulas(stripHtml(text)), out=[];
  RE_STATUS_TOK.lastIndex=0;
  let m;
  while((m=RE_STATUS_TOK.exec(plain))!==null){
    const def=resolveStatusDefByName(m[2]);
    if(!def) continue;
    const stCnt=Math.max(1,Math.abs(toInt(m[3]||m[4]||m[1],1)));
    out.push({raw:m[0],statusKey:def.k,statusName:def.name,stacks:stCnt,idx:m.index,len:m[0].length,chipType:'status'});
  }
  return out;
}
export const RE_EFF_BRACKET=/\[([+-]?\d+)\s+([^\]]+)\]/g;
export const RE_CRIT_NAT=/kritische[n]?\s+ziffer(?:\s*\(([^)]+)\)|\s+(?:bei|für|auf|mit)\s+(trefferw(?:ü|ue)rfe?n?|trefferwurf|angriffe?n?|alle[n]?\s+tests?|alle[n]?\s+proben?))?[^.!;\n\]]*?(?:um\s+([+-]?\d+|\bein\w*\b|\bzwei\b|\bdrei\b|\bvier\b|\bfünf\b)\s*(?:erh[öo]ht|gesteigert|verbessert)|([+-]\d+))/gi;
export function parseEffectTokens(text,sheet=S){
  const plain=maskDynFormulas(stripHtml(text)), out=[], used=[];
  RE_EFF_BRACKET.lastIndex=0; let m;
  while((m=RE_EFF_BRACKET.exec(plain))!==null){
    used.push([m.index,m.index+m[0].length]);
    if(/^(?:vorteil|nachteil|status\s*:)/i.test(m[2].trim())) continue;
    out.push({raw:m[0],val:parseInt(m[1],10),name:m[2].trim(),idx:m.index,len:m[0].length});
  }
  const cn=cresName(sheet), exKnown=(sheet.extraSecList||[]).flatMap(x=>[`${getExtraSecName(x)}-Max`,getExtraSecName(x)]), known=['Alle Attribute','LP-Max','mLP-Max','LP-Regeneration','mLP-Regeneration','Regeneration (LP & mLP)','Alle Regenerationsraten','Regenerationsrate','LP-Reg','mLP-Reg','AP-Max','mAP-Max',`${cn}-Max`,cn,...exKnown,'SP-Mod','SP','Alle Verwundungsstufen','Verwundungsstufen','Alle Verwundungsschwellen','Verwundungsschwellen','Verwundung (leicht)','Verwundung (mittel)','Verwundung (schwer)','Alle Traumastufen','Traumastufen','Alle Traumaschwellen','Traumaschwellen','Trauma (leicht)','Trauma (mittel)','Trauma (schwer)','Basis-Bewegung','Rüstungsschutz','Testschwelle','Kritische Ziffer (Trefferwürfe)','Kritische Ziffer (Alle Tests)','Kritische Ziffer (Alle Proben)','Kritische Ziffer','Initiative','Ini','BSt','mLP','mAP','LP','AP','ST','KO','PR','GW','WA','IN','AU','WK',...(sheet.customStats||[])].filter(Boolean).sort((a,b)=>b.length-a.length).map(s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'));
  const reP=new RegExp(`([+-]\\d+)\\s+(${known.join('|')})(?![a-zA-ZäöüÄÖÜß])`,'gi');
  while((m=reP.exec(plain))!==null){
    const s=m.index, e=s+m[0].length;
    if(!used.some(([u1,u2])=>s<u2&&e>u1)){
      used.push([s,e]);
      out.push({raw:m[0],val:parseInt(m[1],10),name:m[2].trim(),idx:s,len:m[0].length});
    }
  }
  RE_CRIT_NAT.lastIndex=0;
  while((m=RE_CRIT_NAT.exec(plain))!==null){
    const s=m.index, e=s+m[0].length;
    if(used.some(([u1,u2])=>s<u2&&e>u1)) continue;
    const rawScope=String(m[1]||m[2]||'').toLowerCase();
    const isHit=/treffer|angriff|attacke/.test(rawScope);
    const cv=parseAdvNumVal(m[3]||m[4]);
    if(cv){
      used.push([s,e]);
      out.push({raw:m[0].trim(),val:cv,name:isHit?'Kritische Ziffer (Trefferwürfe)':'Kritische Ziffer (Alle Tests)',idx:s,len:m[0].length});
    }
  }
  return out.sort((a,b)=>a.idx-b.idx);
}
export const escReStr=s=>String(s||'').replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
export const ADV_STOP_WORDS=new Set(['ziel','ziele','zielen','gegner','gegnern','feind','feinde','feinden','treffer','schaden','nacht','tag','dunkelheit','dunkeln','licht','kampf','distanz','reichweite','deckung','boden','wasser','feuer','sturm','runde','zug','aktion','aktionen','effekt','effekte']);
export function parseAdvNumVal(s){
  const t=String(s||'').trim().toLowerCase();
  if(t==='ein'||t==='einen'||t==='einem'||t==='einer') return 1;
  if(t==='zwei') return 2;
  if(t==='drei') return 3;
  if(t==='vier') return 4;
  if(t==='fünf'||t==='fuenf') return 5;
  const n=parseInt(t,10);
  return Number.isNaN(n)?0:n;
}
export const RE_SCOPE={
  allParen:/^alle(?:\s+(?:proben?|w(?:ü|ue)rfe?n?|tests?|aktionen?))?$/i,
  all:/^(?:(?:alle[nrsm]?|jede[nrsm]?|sämtliche[nrsm]?)\s+(?:proben?|w(?:ü|ue)rfe?n?|wurf|tests?)|proben?\s+aller\s+art)(?![a-zA-ZäöüÄÖÜß])/i,
  pfx:/^(?:(?:alle[nrsm]?|deine[nrsm]?|eigene[nrsm]?|jede[nrsm]?|einen|einem|einer|eine|ein|der|die|das|dem|den)\s+)?(?:(?:proben?|tests?|w(?:ü|ue)rfe?n?|wurf|versuche?n?)\s+(?:auf|mit|in|im|für|bei|beim)\s+)?/i,
  defense:/^(?:abwehr\s*(?:\/|,|\s+und\s+|\s+oder\s+)\s*(?:parade|parieren)\s*(?:\/|,|\s+und\s+|\s+oder\s+)\s*block(?:en)?(?:\s*(?:\/|,|\s+und\s+|\s+oder\s+)\s*ausweichen)?|abwehr(?:versuche?n?|proben?|tests?|w(?:ü|ue)rfe?n?)?|verteidigungs?(?:versuche?n?|proben?|tests?|w(?:ü|ue)rfe?n?)?)(?![a-zA-ZäöüÄÖÜß])/i,
  parryBlock:/^(?:(?:parade|parieren)(?:-?\s*(?:\/|,|\s+und\s+|\s+oder\s+)\s*block(?:en)?(?:tests?|versuche?n?|proben?|w(?:ü|ue)rfe?n?)?))(?![a-zA-ZäöüÄÖÜß])/i,
  parry:/^(?:parade(?:n|versuche?n?|proben?|tests?|w(?:ü|ue)rfe?n?)?|parieren(?:s|versuche?n?|proben?|tests?|w(?:ü|ue)rfe?n?)?)(?![a-zA-ZäöüÄÖÜß])/i,
  block:/^(?:block(?:en)?(?:versuche?n?|proben?|tests?|w(?:ü|ue)rfe?n?)?|schildblock)(?![a-zA-ZäöüÄÖÜß])/i,
  dodge:/^(?:ausweichen(?:s)?|ausweich(?:versuche?n?|proben?|tests?|w(?:ü|ue)rfe?n?|manöver|manoever)?)(?![a-zA-ZäöüÄÖÜß])/i,
  hitMelee:/^(?:nahkampf[-\s]*trefferw(?:ü|ue)rfe?n?|nahkampf[-\s]*angriffe?n?|trefferw(?:ü|ue)rfe?n?\s+im\s+nahkampf)(?![a-zA-ZäöüÄÖÜß])/i,
  hitRanged:/^(?:fernkampf[-\s]*trefferw(?:ü|ue)rfe?n?|fernkampf[-\s]*angriffe?n?|trefferw(?:ü|ue)rfe?n?\s+im\s+fernkampf)(?![a-zA-ZäöüÄÖÜß])/i,
  hit:/^(?:trefferw(?:ü|ue)rfe?n?|trefferwurf|trefferproben?|treffertests?|angriffsw(?:ü|ue)rfe?n?|angriffswurf|angriffsproben?|angrifftests?|angriffe?n?|attacken?)(?![a-zA-ZäöüÄÖÜß])/i,
  hop:/^[^.,;!\n\r()\]]{1,26}?\s+(auf|mit|beim)\s+/i,
  dyn:/^([A-ZÄÖÜ][a-zäöüßA-ZÄÖÜ0-9_-]{1,28}(?:\s+(?:[A-ZÄÖÜ][a-zäöüßA-ZÄÖÜ0-9_-]{1,28}|knacken|reiten|lesen|schreiben|spielen|führen|werfen|wirken|brauen|schmieden|heilen|lenken|steuern|zähmen|suchen|finden))?(?:\s*\([^)\n]{1,25}\))?)(?:[-\s]*(?:proben?|tests?|w(?:ü|ue)rfe?n?|wurf))?(?![a-zA-ZäöüÄÖÜß])/
};
export function resolveAdvDisScope(rawTail,prep='',isParen=false,sheet=S){
  const tail=String(rawTail||'');
  if(!tail.trim()) return isParen?{scope:'all',label:'Alle Proben',consumedLen:tail.length}:null;
  let m;
  if(isParen&&RE_SCOPE.allParen.test(tail.trim())){
    return {scope:'all',label:'Alle Proben',consumedLen:tail.length};
  }
  if((m=tail.match(RE_SCOPE.all))){
    return {scope:'all',label:'Alle Proben',consumedLen:m[0].length};
  }
  const pfxM=tail.match(RE_SCOPE.pfx);
  const pfxLen=pfxM?pfxM[0].length:0, rem=tail.slice(pfxLen);
  if(isParen&&rem.includes('(')){
    const remLow=rem.trim().toLowerCase();
    const exactSk=(sheet.skills||[]).find(s=>s&&String(s.name||'').trim().toLowerCase()===remLow);
    if(exactSk){
      const sn=exactSk.name.trim();
      return {scope:'skill',skillId:exactSk.id,skillName:sn,label:sn,consumedLen:tail.length};
    }
  }
  if((m=rem.match(RE_SCOPE.defense))){
    return {scope:'defense',label:'Abwehr/Parieren/Blocken',consumedLen:pfxLen+m[0].length};
  }
  if((m=rem.match(RE_SCOPE.parryBlock))){
    return {scope:'parry_block',label:'Parieren/Blocken',consumedLen:pfxLen+m[0].length};
  }
  if((m=rem.match(RE_SCOPE.parry))){
    return {scope:'parry',label:'Parieren',consumedLen:pfxLen+m[0].length};
  }
  if((m=rem.match(RE_SCOPE.block))){
    return {scope:'block',label:'Blocken',consumedLen:pfxLen+m[0].length};
  }
  if((m=rem.match(RE_SCOPE.dodge))){
    return {scope:'dodge',label:'Ausweichen',consumedLen:pfxLen+m[0].length};
  }
  if((m=rem.match(RE_SCOPE.hitMelee))){
    return {scope:'hit_melee',label:'Trefferwürfe (Nahkampf)',consumedLen:pfxLen+m[0].length};
  }
  if((m=rem.match(RE_SCOPE.hitRanged))){
    return {scope:'hit_ranged',label:'Trefferwürfe (Fernkampf)',consumedLen:pfxLen+m[0].length};
  }
  if((m=rem.match(RE_SCOPE.hit))){
    return {scope:'hit',label:'Trefferwürfe',consumedLen:pfxLen+m[0].length};
  }
  const skSorted=[...(sheet.skills||[])].filter(s=>s&&String(s.name||'').trim()).sort((a,b)=>b.name.trim().length-a.name.trim().length);
  for(const sk of skSorted){
    const sn=sk.name.trim(), reSk=new RegExp('^'+escReStr(sn)+'(?:[-\\s]*(?:proben?|tests?|w(?:ü|ue)rfe?n?|wurf))?(?![a-zA-ZäöüÄÖÜß])','i');
    if((m=rem.match(reSk))){
      return {scope:'skill',skillId:sk.id,skillName:sn,label:sn,consumedLen:pfxLen+m[0].length};
    }
  }
  for(const a of ATTRS){
    const nAlt=a.n.replace(/ä/g,'(?:ä|ae)').replace(/ö/g,'(?:ö|oe)').replace(/ü/g,'(?:ü|ue)');
    const reFull=new RegExp('^(?:'+nAlt+')(?:s)?(?:\\s*\\('+a.k+'\\))?(?:[-\\s]*(?:proben?|tests?|w(?:ü|ue)rfe?n?|wurf))?(?![a-zA-ZäöüÄÖÜß])','i');
    if((m=rem.match(reFull))) return {scope:'attr',attrKey:a.k,label:`${a.k} (${a.n})`,consumedLen:pfxLen+m[0].length};
    const reCode=isParen
      ?new RegExp('^\\[?'+a.k+'\\]?(?:[-\\s]*(?:proben?|tests?|w(?:ü|ue)rfe?n?|wurf))?(?![a-zA-ZäöüÄÖÜß])','i')
      :new RegExp('^(?:\\['+a.k+'\\]|'+a.k+'(?:[-\\s]*(?:proben?|tests?|w(?:ü|ue)rfe?n?|wurf))?|'+a.k.toLowerCase()+'[-\\s]+(?:proben?|tests?|w(?:ü|ue)rfe?n?|wurf))(?![a-zA-ZäöüÄÖÜß])');
    if((m=rem.match(reCode))) return {scope:'attr',attrKey:a.k,label:`${a.k} (${a.n})`,consumedLen:pfxLen+m[0].length};
  }
  if(!isParen){
    const hop=rem.match(RE_SCOPE.hop);
    if(hop){
      const sub=resolveAdvDisScope(rem.slice(hop[0].length),hop[1].toLowerCase(),false,sheet);
      if(sub) return {...sub,consumedLen:pfxLen+hop[0].length+sub.consumedLen};
    }
  }
  if(isParen){
    const cl=rem.trim();
    if(cl.length>=2&&cl.length<=80&&!ADV_STOP_WORDS.has(cl.toLowerCase())){
      return {scope:'skill',skillName:cl,label:cl,consumedLen:tail.length};
    }
  }else if(['auf','beim','für','mit'].includes(prep)||/proben?|tests?|w(?:ü|ue)rfe?n?|wurf/i.test(pfxM?.[0]||'')){
    if((m=rem.match(RE_SCOPE.dyn))){
      const cand=m[1].trim(), firstW=cand.split(/[\s(]+/)[0].toLowerCase();
      if(!ADV_STOP_WORDS.has(cand.toLowerCase())&&!ADV_STOP_WORDS.has(firstW)){
        return {scope:'skill',skillName:cand,label:cand,consumedLen:pfxLen+m[0].length};
      }
    }
  }
  return null;
}
export const RE_ADV_BR=/\[([+-]?\d+)\s+(Vorteil(?:e|en)?|Nachteil(?:e|en)?)(?:\s+([^\]]+))?\]/gi;
export const RE_NAT=/([+-]?\d+|\bein(?:en|em)?\b|\bzwei\b|\bdrei\b|\bvier\b|\bfünf\b)\s+(Vorteil(?:e|en)?|Nachteil(?:e|en)?)(?:(\s*\()((?:[^()\n]|\([^()\n]*\))+)(\))|(\s+(?:auf|mit|bei|beim|für|gegen|in|im|zu)\s+)([^.,;!\n\r\]]+))?/gi;
export const RE_ADV_REV=/(?:(?:auf|bei|beim|für|mit)\s+)?([A-Za-zÄÖÜäöüß][A-Za-zÄÖÜäöüß0-9()/ -]{1,34}?)\s+(?:haben|hat|erhalten|erhält|erhaelt|erhältst|bekommen|bekommt|bekommst|gewähren|gewährt)\s+(?:du\s+)?([+-]?\d+|\bein(?:en)?\b|\bzwei\b|\bdrei\b|\bvier\b|\bfünf\b)\s+(Vorteil(?:e|en)?|Nachteil(?:e|en)?)\b/gi;
export function parseAdvDisTokens(text,sheet=S){
  const plain=maskDynFormulas(stripHtml(text)), out=[], used=[];
  const overlaps=(s,e)=>used.some(([u1,u2])=>s<u2&&e>u1);
  RE_ADV_BR.lastIndex=0;
  let m;
  while((m=RE_ADV_BR.exec(plain))!==null){
    const val=parseInt(m[1],10), kind=/^nachteil/i.test(m[2])?'dis':'adv';
    let rest=String(m[3]||'').trim(), isP=true, prep='';
    if(rest.startsWith('(')&&rest.endsWith(')')) rest=rest.slice(1,-1).trim();
    else{
      const pm=rest.match(/^(auf|mit|bei|beim|für|gegen|in|im|zu)\s+([\s\S]+)$/i);
      if(pm){prep=pm[1].toLowerCase();rest=pm[2].trim();isP=false;}
    }
    const sc=resolveAdvDisScope(rest,prep,isP,sheet)||{scope:'all',label:rest||'Alle Proben'};
    out.push({raw:m[0],val,kind,scope:sc.scope,label:sc.label,skillId:sc.skillId||null,skillName:sc.skillName||'',attrKey:sc.attrKey||'',idx:m.index,len:m[0].length,isBracket:true});
    used.push([m.index,m.index+m[0].length]);
  }
  const reNat=new RegExp(RE_NAT.source,'gi');
  while((m=reNat.exec(plain))!==null){
    const s=m.index;
    if(s>0&&/[a-zA-ZäöüÄÖÜß\d]/.test(plain[s-1])){reNat.lastIndex=s+1;continue;}
    const baseLen=m[1].length+(m[0].indexOf(m[2])-m[1].length)+m[2].length;
    if(overlaps(s,s+baseLen)){reNat.lastIndex=s+baseLen;continue;}
    const ctxBefore=plain.slice(Math.max(0,s-42),s);
    if(/\b(?:gegner\w*|feind\w*|das\s+ziel|dem\s+ziel)\s+(?:erh[äa]lt\w*|haben|hat|bekomm\w*|leidet)\s*$/i.test(ctxBefore)){
      reNat.lastIndex=s+baseLen;continue;
    }
    const val=parseAdvNumVal(m[1]), kind=/^nachteil/i.test(m[2])?'dis':'adv';
    let sc=null, totLen=0;
    if(m[4]!==undefined){
      sc=resolveAdvDisScope(m[4].trim(),'',true,sheet);
      totLen=baseLen+m[3].length+m[4].length+m[5].length;
    }else if(m[7]!==undefined){
      const prep=m[6].trim().toLowerCase();
      sc=resolveAdvDisScope(m[7],prep,false,sheet);
      if(sc) totLen=baseLen+m[6].length+sc.consumedLen;
    }
    if(sc&&val&&!overlaps(s,s+totLen)){
      const raw=plain.slice(s,s+totLen);
      out.push({raw,val,kind,scope:sc.scope,label:sc.label,skillId:sc.skillId||null,skillName:sc.skillName||'',attrKey:sc.attrKey||'',idx:s,len:totLen,isBracket:false});
      used.push([s,s+totLen]);
      reNat.lastIndex=s+totLen;
    }else{
      reNat.lastIndex=s+baseLen;
    }
  }
  RE_ADV_REV.lastIndex=0;
  while((m=RE_ADV_REV.exec(plain))!==null){
    const s=m.index, e=s+m[0].length;
    if(overlaps(s,e)) continue;
    if(/\b(?:gegner\w*|feind\w*|ziel\w*)\b/i.test(m[1])) continue;
    const sc=resolveAdvDisScope(m[1].trim(),'auf',false,sheet);
    const val=parseAdvNumVal(m[2]), kind=/^nachteil/i.test(m[3])?'dis':'adv';
    if(sc&&val&&sc.consumedLen>=m[1].trim().length-2){
      out.push({raw:m[0].trim(),val,kind,scope:sc.scope,label:sc.label,skillId:sc.skillId||null,skillName:sc.skillName||'',attrKey:sc.attrKey||'',idx:s,len:m[0].length,isBracket:false});
      used.push([s,e]);
    }
  }
  return out.sort((a,b)=>a.idx-b.idx);
}
export function getAllParsedEffectChips(text,sheet=S){
  const stToks=parseStatusTokens(text);
  const overlapsSt=(s,e)=>stToks.some(k=>s<k.idx+k.len&&e>k.idx);
  const ad=parseAdvDisTokens(text,sheet).filter(t=>!overlapsSt(t.idx,t.idx+t.len)).map(t=>({...t,chipType:t.kind==='dis'?'dis':'adv'}));
  const st=parseEffectTokens(text,sheet).filter(t=>!overlapsSt(t.idx,t.idx+t.len)&&!ad.some(a=>t.idx<a.idx+a.len&&t.idx+t.len>a.idx)).map(t=>({...t,chipType:'stat'}));
  return [...st,...ad,...stToks].sort((a,b)=>a.idx-b.idx);
}
let _modsCacheMap=new WeakMap(), _modsCacheQueued=false;
export function invalidateModsCache(sheet=null){
  if(sheet&&typeof sheet==='object') _modsCacheMap.delete(sheet);
  else _modsCacheMap=new WeakMap();
}
export function calcActiveMods(sheet=S){
  const target=sheet||S;
  const cached=_modsCacheMap.get(target);
  if(cached) return cached;
  const keys=['ST','KO','PR','GW','WA','IN','AU','WK','lpMax','mlpMax','lpRegen','mlpRegen','ini','apMax','mapMax','cresMax','spMod','woundLight','woundMedium','woundHeavy','traumaLight','traumaMedium','traumaHeavy','bst','moveBase','armor','testTh','critHit','critAll'];
  const M={src:{},extraSec:{},advDis:[],crits:[]}; keys.forEach(k=>{M[k]=0;M.src[k]=[];});
  (target.extraSecList||[]).forEach(x=>{M.extraSec[x.id]=0;M.src['ex_'+x.id]=[];});
  const add=(k,v,it,isAug)=>{if(!v)return;M[k]+=v;const nm=String(it.name||'').trim()||(isAug?'Unbenanntes Augment':'Unbenannte Kraft');M.src[k].push({val:v,name:nm,kind:isAug?'Augment':'Kraft'});};
  const cnLow=cresName(target).toLowerCase();
  const proc=(it,isAug)=>{
    if(it.applyMods===false) return;
    const srcNm=String(it.name||'').trim()||(isAug?'Unbenanntes Augment':'Unbenannte Kraft'),srcKd=isAug?'Augment':'Kraft';
    parseAdvDisTokens(it.effects,target).forEach(ad=>{if(ad.val)M.advDis.push({...ad,srcName:srcNm,srcKind:srcKd});});
    parseEffectTokens(it.effects,target).forEach(({val,name})=>{
      const nl=name.toLowerCase(), nu=name.toUpperCase();
      if(M[nu]!==undefined&&nu.length===2) add(nu,val,it,isAug);
      else if(nl==='alle attribute') ATTRS.forEach(a=>add(a.k,val,it,isAug));
      else if(nl==='lp-max'||nl==='lp') add('lpMax',val,it,isAug);
      else if(nl==='mlp-max'||nl==='mlp') add('mlpMax',val,it,isAug);
      else if(nl==='lp-regeneration'||nl==='lp-reg'||nl==='lp regeneration'||nl==='regenerationsrate lp') add('lpRegen',val,it,isAug);
      else if(nl==='mlp-regeneration'||nl==='mlp-reg'||nl==='mlp regeneration'||nl==='regenerationsrate mlp') add('mlpRegen',val,it,isAug);
      else if(nl==='regeneration (lp & mlp)'||nl==='alle regenerationsraten'||nl==='regenerationsrate'||nl==='regeneration'){add('lpRegen',val,it,isAug);add('mlpRegen',val,it,isAug);}
      else if(nl==='ini'||nl==='initiative') add('ini',val,it,isAug);
      else if(nl==='ap-max'||nl==='ap') add('apMax',val,it,isAug);
      else if(nl==='map-max'||nl==='map') add('mapMax',val,it,isAug);
      else if(nl===`${cnLow}-max`||nl===cnLow) add('cresMax',val,it,isAug);
      else if(nl==='verwundungsschwellen'||nl==='alle verwundungsstufen'||nl==='verwundungsstufen'||nl==='alle verwundungsschwellen'){add('woundLight',val,it,isAug);add('woundMedium',val,it,isAug);add('woundHeavy',val,it,isAug);}
      else if(nl==='verwundung (leicht)') add('woundLight',val,it,isAug);
      else if(nl==='verwundung (mittel)') add('woundMedium',val,it,isAug);
      else if(nl==='verwundung (schwer)') add('woundHeavy',val,it,isAug);
      else if(nl==='traumaschwellen'||nl==='alle traumastufen'||nl==='traumastufen'||nl==='alle traumaschwellen'){add('traumaLight',val,it,isAug);add('traumaMedium',val,it,isAug);add('traumaHeavy',val,it,isAug);}
      else if(nl==='trauma (leicht)') add('traumaLight',val,it,isAug);
      else if(nl==='trauma (mittel)') add('traumaMedium',val,it,isAug);
      else if(nl==='trauma (schwer)') add('traumaHeavy',val,it,isAug);
      else if(nl==='bst') add('bst',val,it,isAug);
      else if(nl==='basis-bewegung') add('moveBase',val,it,isAug);
      else if(nl==='rüstungsschutz') add('armor',val,it,isAug);
      else if(nl==='testschwelle') add('testTh',val,it,isAug);
      else if(nl==='kritische ziffer (trefferwürfe)'||nl==='kritische ziffer (trefferwuerfe)'||nl==='kritische ziffer (trefferwurf)'){
        add('critHit',val,it,isAug);
        if(val) M.crits.push({val,scope:'hit',tagLbl:'Krit. Ziffer (Trefferwürfe)',srcName:`${srcNm} • Kritische Ziffer (Trefferwürfe)`,srcKind:srcKd});
      }
      else if(nl==='kritische ziffer (alle tests)'||nl==='kritische ziffer (alle proben)'||nl==='kritische ziffer'){
        add('critAll',val,it,isAug);
        if(val) M.crits.push({val,scope:'all',tagLbl:'Krit. Ziffer (Alle Tests)',srcName:`${srcNm} • Kritische Ziffer (Alle Tests)`,srcKind:srcKd});
      }
      else if(nl==='sp-mod'||nl==='sp') add('spMod',val,it,isAug);
      else{
        const exMatches=(target.extraSecList||[]).filter(x=>{const xn=getExtraSecName(x).toLowerCase();return nl===`${xn}-max`||nl===xn;});
        if(exMatches.length&&val){const nm=String(it.name||'').trim()||(isAug?'Unbenanntes Augment':'Unbenannte Kraft');exMatches.forEach(ex=>{M.extraSec[ex.id]=(M.extraSec[ex.id]||0)+val;M.src['ex_'+ex.id].push({val,name:nm,kind:isAug?'Augment':'Kraft'});});}
      }
    });
  };
  (target.powers||[]).forEach(p=>proc(p,false));
  (target.augments||[]).forEach(a=>proc(a,true));
  M.statusLp=0; M.statusMlp=0;
  STATUS_DEFS.forEach(def=>{
    const v=getStatusEffValues(def.k,target);
    if(!v.active) return;
    const srcNm=`${def.name}${v.stacks>1?` (${v.stacks}×)`:''}${(v.hasStatOvr||v.hasAdvOvr)?' [Overwrite]':''}`;
    if(v.effStat){
      if(def.statKey==='lp'){
        M.lpMax+=v.effStat;
        M.statusLp+=v.effStat;
        M.src.lpMax.push({val:v.effStat,name:srcNm,kind:'Statuseffekt'});
      }else if(def.statKey==='mlp'){
        M.mlpMax+=v.effStat;
        M.statusMlp+=v.effStat;
        M.src.mlpMax.push({val:v.effStat,name:srcNm,kind:'Statuseffekt'});
      }else if(def.statKey==='bst'){
        M.bst+=v.effStat;
        M.src.bst.push({val:v.effStat,name:srcNm,kind:'Statuseffekt'});
      }else if(def.statKey==='ini'){
        M.ini+=v.effStat;
        M.src.ini.push({val:v.effStat,name:srcNm,kind:'Statuseffekt'});
      }
    }
    if(v.effAdv>0){
      def.attrs.forEach(ak=>{
        M.advDis.push({
          raw:`${fmtSign(v.effAdv)} ${def.isPos?'Vorteil':'Nachteil'} (${ak})`,
          val:v.effAdv,
          kind:def.isPos?'adv':'dis',
          scope:'attr',
          attrKey:ak,
          label:`alle ${ak}-Tests`,
          srcName:srcNm,
          srcKind:'Statuseffekt'
        });
      });
    }
  });
  M._sheetCounters=getSheetCounterTotals(target);
  M._armorEqSources=[];
  (target.armors||[]).forEach(ar=>{
    if(ar&&ar.equipped!==false&&Array.isArray(ar.tags)&&ar.tags.length){
      ar.tags.forEach(tg=>M._armorEqSources.push(analyzeEqTagTooltip(tg,target.armorTagList,'armor',ar,target)));
    }
  });
  _modsCacheMap.set(target,M);
  if(!_modsCacheQueued){_modsCacheQueued=true;queueMicrotask(()=>{_modsCacheMap=new WeakMap();_modsCacheQueued=false;});}
  return M;
}
export const fmtSrcLines=(M,k)=>(M.src?.[k]||[]).map(s=>`• ${s.name} (${s.kind}): ${fmtSign(s.val)}`).join('\n');

export function findEqTagDef(name,primaryList,sheet=S){
  const low=String(name||'').trim().toLowerCase();
  for(const lst of [primaryList,sheet.weaponTagList,sheet.ammoTagList,sheet.armorTagList]){
    const f=(lst||[]).find(t=>t&&t.name.toLowerCase()===low);
    if(f&&f.desc) return f;
  }
  return (primaryList||[]).find(t=>t&&t.name.toLowerCase()===low)||null;
}
export const RE_OPP_DEF=/\b(?:gegnerisch\w*\s+(?:abwehr|parade|parieren|block|ausweich|verteidigung)\w*|(?:abwehr|parade|parieren|block(?:en)?|ausweich|verteidigung)(?:[-\s]*(?:und|oder|\/|,)[-\s]*(?:abwehr|parade|parieren|block(?:en)?|ausweich)\w*)?(?:versuche?n?|tests?|proben?|w(?:ü|ue)rfe?n?)?\s+(?:des\s+(?:gegners|ziels|feindes)|(?:haben\s+|sind\s+|erhalten\s+|bekommen\s+)?gegen\s+(?:diese[n]?|die|den)\s+(?:waffe|angriff|schuss|treffer|munition|bolzen|pfeil|attacke)))/i;
export const RE_OPP_ATK=/\b(?:gegnerisch\w*\s+(?:angriff\w*|trefferw(?:ü|ue)rf\w*|attacke\w*|sch(?:ü|ue)ss\w*)|(?:angriff\w*|trefferw(?:ü|ue)rf\w*|attacke\w*)\s+(?:des\s+gegners|(?:haben\s+|sind\s+)?gegen\s+(?:dich|den\s+tr[äa]ger|diese\s+r[üu]stung)))/i;
export const RE_OPP_DETECT=/\btests?,?\s+um\s+(?:dich|den\s+sch[üu]tzen|den\s+angreifer|den\s+tr[äa]ger|sie)\s+zu\s+(?:entdecken|bemerken|h[öo]ren|finden|orten)/i;
export const RE_EQ_ROLL_MOD=/([+-]?\d+)\s+auf\s+das\s+w(?:ü|ue)rfelergebnis/i;
export const RE_EQ_NEG_THROW=/(?:keine[n]?|ohne)\s+nachteil\w*[\s\S]*?(?:waffenwerfen|werfen\s+dieser\s+waffe|beim\s+werfen)|(?:beim\s+werfen|waffenwerfen)[\s\S]*?(?:keine[n]?|ohne)\s+nachteil/i;
export const RE_EQ_RED_MM1=/nachteil\w*[\s\S]*?(?:nahkampf|reiten|raumverh[äa]ltnis\w*|beengt\w*)[\s\S]*?(?:um\s+(\d+|\bein\w*\b|\bzwei\b|\bdrei\b|\bvier\b|\bfünf\b)\s+)?(?:verringert|reduziert|ignoriert|aufgehoben)/i;
export const RE_EQ_RED_MM2=/(?:verringert|reduziert)\s+nachteil\w*[\s\S]*?(?:nahkampf|reiten)[\s\S]*?um\s+(\d+|\bein\w*\b|\bzwei\b|\bdrei\b)/i;
export const RE_EQ_THRUST_GRIP=/sto(?:ß|ss)ende\s+attacken[\s\S]*?ignorieren[\s\S]*?langsam\s*\(\s*(\d+)\s*\)/i;
export const RE_EQ_CRIT1=/kritische[n]?\s+(?:ziffer|wert|bereich)[^.!;\n]*?(?:um\s+([+-]?\d+|\bein\w*\b|\bzwei\b|\bdrei\b|\bvier\b|\bfünf\b)\s*(?:erh[öo]ht|gesteigert|verbessert)|([+-]\d+))/i;
export const RE_EQ_CRIT2=/(?:erh[öo]ht|steigert|verbessert)\s+die\s+kritische[n]?\s+(?:ziffer|wert)[^.!;\n]*?um\s+([+-]?\d+|\bein\w*\b|\bzwei\b|\bdrei\b)/i;
export const RE_SIT_MM=/(?:sch(?:ü|ue)ssen?\s+im\s+(?:verwickelten\s+)?nahkampf|angreifen\s+im\s+nahkampf|im\s+verwickelten\s+nahkampf|beim\s+reiten|eingeschr[äa]nkten\s+raumverh[äa]ltnis\w*|beengten\s+r[äa]um\w*)/i;
export const RE_SIT_COVER=/\b(?:aus\s+(?:der\s+|schwerer\s+)?deckung(?:\s+heraus)?|in\s+deckung|hinter\s+deckung)\b/i;
export const RE_SIT_COLD=/\b(?:gegen|bei)\s+k[äa]lte\b/i;
export const RE_SIT_THROW=/\b(?:beim\s+werfen|waffenwerfen|waffenwurf|geworfen\w*)\b/i;
export const RE_SIT_1H=/\b(?:einh[äa]ndig\w*\s+f[üu]hr\w*|beim\s+einh[äa]ndigen)\b/i;
export const RE_SIT_2H=/\b(?:zweih[äa]ndig\w*\s+f[üu]hr\w*|beim\s+zweih[äa]ndigen)\b/i;
export const RE_SIT_GENERIC=/\b(?:wenn|falls|solange|sofern|sobald|bei\s+(?:dunkelheit|nacht|regen|sturm|hitze|k[äa]lte|[üu]berraschung|ersch[öo]pfung|schlechter\s+sicht)|im\s+wasser|unter\s+wasser|im\s+liegen|liegend|kniend|aus\s+dem\s+hinterhalt|gegen\s+(?:gepanzerte|ungepanzerte|gro(?:ß|ss)e|kleine|berittene|fliegende|[üu]berraschte)|auf\s+(?:kurze|weite|gro(?:ß|ss)e|maximale|extreme)\s+(?:distanz|reichweite|entfernung))\b/i;
export const RE_VN=/(?:um\s+)?([+-]?\d+|\bein(?:en|em|er)?\b|\bzwei\b|\bdrei\b|\bvier\b|\bfünf\b)\s+(Vorteil(?:e|en)?|Nachteil(?:e|en)?)\b/gi;
export function analyzeEqTagTooltip(tg,tagList,itemKind='weapon',itemObj=null,sheet=S){
  const res={mods:[],crits:[],counters:[],rollMods:[]};
  if(!tg||!tg.name) return res;
  const rawName=String(tg.name||'').trim(), baseName=rawName.replace(/\(\s*X\s*\)/i,'').trim(), baseLow=baseName.toLowerCase();
  const xVal=toInt(tg.x,1), tagLbl=fmtTagLabel(rawName,hasTagX(rawName)?xVal:tg.x);
  const def=findEqTagDef(rawName,tagList,sheet), rawDesc=String(def?.desc||'').trim();
  if(!rawDesc) return res;
  let txt=rawDesc.replace(/(?:1\s+(?:Vorteil|Nachteil)\s*)?\(\s*bzw\.\s*X\s+(Vorteil(?:e|en)?|Nachteil(?:e|en)?)\s*\)/gi,(_,w)=>`${xVal} ${w}`);
  txt=txt.replace(/\(\s*X\s*\)/gi,`(${xVal})`).replace(/\bX\b/g,String(xVal));
  const srcLabel=itemObj?String(itemObj.name||'').trim()||({weapon:'Waffe',ammo:'Munition',armor:'Rüstung'}[itemKind]||'Gegenstand'):tagLbl;
  const srcKind={weapon:'Waffen-Tag',ammo:'Munitions-Tag',armor:'Rüstungs-Tag'}[itemKind]||'Tag';
  const sents=txt.split(/(?<=[.!])\s+|\n+/).map(s=>s.trim()).filter(Boolean);
  sents.forEach(sent=>{
    if(baseLow==='schwungvoll'||RE_EQ_ROLL_MOD.test(sent)){
      const rmM=sent.match(RE_EQ_ROLL_MOD);
      const rv=rmM?toInt(rmM[1],xVal):xVal;
      if(rv) res.rollMods.push({val:rv,scope:itemKind==='armor'?'all':'hit',tagLbl,srcName:`${srcLabel} • ${tagLbl}`,srcKind});
      return;
    }
    if(RE_EQ_NEG_THROW.test(sent)){
      res.counters.push({counterKey:'negate_throw_dis',val:99,tagLbl,srcLabel,srcKind});
      return;
    }
    let cm;
    if((cm=sent.match(RE_EQ_RED_MM1))||(cm=sent.match(RE_EQ_RED_MM2))){
      res.counters.push({counterKey:'reduce_melee_mount',val:cm[1]?Math.max(1,parseAdvNumVal(cm[1])):xVal,tagLbl,srcLabel,srcKind});
      return;
    }
    if((cm=sent.match(RE_EQ_THRUST_GRIP))){
      res.counters.push({counterKey:'thrust_grip',val:Math.max(1,toInt(cm[1],1)),tagLbl,srcLabel,srcKind});
      return;
    }
    let crM=sent.match(RE_EQ_CRIT1)||sent.match(RE_EQ_CRIT2);
    if(crM){
      const cv=parseAdvNumVal(crM[1]||crM[2]);
      if(cv){
        let cScope=(itemKind==='armor'&&baseLow!=='tödlich'&&!/trefferw|angriff|attacke/i.test(sent))?'all':'hit';
        if(/\bparade\w*|\bparieren\b/i.test(sent)) cScope='parry';
        else if(/\bblock\w*/i.test(sent)) cScope='block';
        else if(/\bausweich\w*/i.test(sent)) cScope='dodge';
        else if(/\babwehr\w*/i.test(sent)) cScope='defense';
        res.crits.push({val:cv,scope:cScope,tagLbl,srcName:`${srcLabel} • ${tagLbl}`,srcKind});
      }
    }
    if(/\b(?:keine[n]?|ohne)\s+(?:vorteil|nachteil)/i.test(sent)) return;
    if(/nachteil\w*[^.!;\n]*?\b(?:verringert|reduziert|ignoriert|entfallen|entf[äa]llt|aufgehoben)\b/i.test(sent)) return;
    const isOppDef=RE_OPP_DEF.test(sent), isOppAtk=!isOppDef&&RE_OPP_ATK.test(sent), isOppDetect=!isOppDef&&!isOppAtk&&RE_OPP_DETECT.test(sent);
    let sitKey='', sitLabel='', autoGrip='';
    if(RE_SIT_MM.test(sent)){
      sitKey='melee_mount'; sitLabel='Im Nahkampf/Reiten';
    }else if(RE_SIT_COVER.test(sent)){
      sitKey='cover'; sitLabel='Aus Deckung';
    }else if(RE_SIT_COLD.test(sent)){sitKey='cold';sitLabel='❄️ Gegen Kälte';
    }else if(RE_SIT_THROW.test(sent)){
      sitKey='throw'; sitLabel=`Waffenwurf (${baseName})`;
    }else if(RE_SIT_1H.test(sent)){
      if(itemObj?.grip==='1h') autoGrip='active';
      else if(itemObj?.grip==='2h') autoGrip='inactive';
      else{sitKey='grip_1h';sitLabel=`Einhändig (${baseName})`;}
    }else if(RE_SIT_2H.test(sent)){
      if(itemObj?.grip==='2h') autoGrip='active';
      else if(itemObj?.grip==='1h') autoGrip='inactive';
      else{sitKey='grip_2h';sitLabel=`Zweihändig (${baseName})`;}
    }else if(!isOppDef&&!isOppAtk&&RE_SIT_GENERIC.test(sent)){
      sitKey='sit_'+baseLow.replace(/[^a-z0-9äöüß]+/g,'_'); sitLabel=`${tagLbl} (situativ)`;
    }
    if(autoGrip==='inactive') return;
    let scope=itemKind==='armor'?'all':'hit', label=itemKind==='armor'?'Rüstungs-Effekt':'Trefferwurf', skillName='', attrKey='', skillCandidates=null, oppDefSubScope='';
    if(isOppDef){
      scope='hit'; label='Gegner-Abwehr → Trefferwurf';
      if(/\b(?:parade|parieren)\w*[\s,/-]+(?:und|oder)\s+block\w*/i.test(sent)) oppDefSubScope='parry_block';
      else if(/\bparade\w*|\bparieren\b/i.test(sent)) oppDefSubScope='parry';
      else if(/\bblock\w*/i.test(sent)) oppDefSubScope='block';
      else if(/\bausweich\w*/i.test(sent)) oppDefSubScope='dodge';
      else oppDefSubScope='defense';
    }else if(isOppAtk){
      scope='defense'; label='Gegner-Angriff → Abwehr';
    }else if(isOppDetect){
      scope='stealth_detect'; label='Entdecken / Heimlichkeit'; skillCandidates=['heimlichkeit','schleichen','verbergen','verstecken'];
    }else if(/\b(?:parade|parieren)\w*[\s,/-]+(?:und|oder)\s+block\w*/i.test(sent)){
      scope='parry_block'; label='Parieren/Blocken';
    }else if(/\b(?:parade(?:versuche?n?|proben?|tests?|w(?:ü|ue)rfe?n?)?|parieren(?:s|versuche?n?|proben?|tests?|w(?:ü|ue)rfe?n?)?)\b/i.test(sent)){
      scope='parry'; label='Parieren';
    }else if(/\b(?:block(?:en|versuche?n?|proben?|tests?|w(?:ü|ue)rfe?n?|f[äa]hig)?|schildblock)\b/i.test(sent)){
      scope='block'; label='Blocken';
    }else if(/\b(?:ausweichen(?:s)?|ausweich(?:versuche?n?|proben?|tests?|w(?:ü|ue)rfe?n?|manöver|manoever)?)\b/i.test(sent)){
      scope='dodge'; label='Ausweichen';
    }else if(/\b(?:abwehr(?:versuche?n?|proben?|tests?|w(?:ü|ue)rfe?n?)?|verteidigungs?\w*)\b/i.test(sent)){
      scope='defense'; label='Abwehr/Parieren/Blocken';
    }else if(/\b(?:verstecken|verbergen)\b/i.test(sent)){
      scope='skill_multi'; label='Verstecken/Verbergen'; skillCandidates=['verstecken','verbergen','heimlichkeit','fingerfertigkeit'];
    }else{
      let matchedCustom=false;
      const skSorted=[...(sheet.skills||[])].filter(s=>s&&String(s.name||'').trim()).sort((a,b)=>b.name.trim().length-a.name.trim().length);
      for(const sk of skSorted){
        const sn=sk.name.trim(), reSk=new RegExp('(?:^|[^a-zA-ZäöüÄÖÜß])'+escReStr(sn)+'(?:[-\\s]*(?:proben?|tests?|w(?:ü|ue)rfe?n?|wurf))?(?![a-zA-ZäöüÄÖÜß])','i');
        if(reSk.test(sent)){scope='skill';skillName=sn;label=sn;matchedCustom=true;break;}
      }
      if(!matchedCustom){
        for(const a of ATTRS){
          const nAlt=a.n.replace(/ä/g,'(?:ä|ae)').replace(/ö/g,'(?:ö|oe)').replace(/ü/g,'(?:ü|ue)');
          const reAt=new RegExp('(?:\\['+a.k+'\\]|\\b'+nAlt+'(?:s)?(?:[-\\s]*(?:proben?|tests?|w(?:ü|ue)rfe?n?))?|\\b'+a.k+'[-\\s]+(?:proben?|tests?|w(?:ü|ue)rfe?n?))(?![a-zA-ZäöüÄÖÜß])','i');
          if(reAt.test(sent)){scope='attr';attrKey=a.k;label=`${a.k} (${a.n})`;matchedCustom=true;break;}
        }
      }
      if(!matchedCustom){
        if(itemKind==='armor'){
          if(/\bfernkampf\w*|\bsch(?:ü|ue)ss\w*/i.test(sent)){scope='hit_ranged';label='Fernkampf-Trefferwürfe';}
          else if(/\bnahkampf\w*/i.test(sent)&&!sitKey){scope='hit_melee';label='Nahkampf-Trefferwürfe';}
          else if(/\btrefferw(?:ü|ue)rf\w*|\bangriff\w*/i.test(sent)){scope='hit';label='Trefferwürfe';}
          else{scope='all';label='Alle Proben';}
        }else{
          scope='hit'; label='Trefferwurf';
        }
      }
    }
    RE_VN.lastIndex=0;
    let vm;
    while((vm=RE_VN.exec(sent))!==null){
      const pre=sent.slice(Math.max(0,vm.index-12),vm.index);
      if(/\b(?:kein|keine|keinen|keinem|ohne)\s*$/i.test(pre)) continue;
      const v=Math.abs(parseAdvNumVal(vm[1]));
      if(!v) continue;
      const rawKind=/^nachteil/i.test(vm[2])?'dis':'adv';
      const effKind=(isOppDef||isOppAtk||isOppDetect)?(rawKind==='dis'?'adv':'dis'):rawKind;
      res.mods.push({
        val:v,
        kind:effKind,
        scope,
        isOppDef,
        oppDefSubScope,
        label:sitKey?`${sitLabel}`:label,
        skillName,
        skillCandidates,
        attrKey,
        sitKey,
        sitLabel,
        tagBaseLow:baseLow,
        tagLbl,
        srcName:`${srcLabel} • ${tagLbl}`,
        srcKind
      });
    }
  });
  return res;
}
export function formatTagW3Preview(tagList,name,x,sheet=S){
  const r=analyzeEqTagTooltip({name,x:x??'1'},tagList,'weapon',null,sheet);
  const parts=[];
  r.mods.forEach(m=>{parts.push(`${fmtSign(m.val)} ${m.kind==='dis'?'Nachteil(e)':'Vorteil(e)'} (${m.sitKey?'Situativ: '+m.sitLabel:m.label})`);});
  r.crits.forEach(c=>{parts.push(`Kritische Ziffer ${fmtSign(c.val)} (${c.scope==='all'?'Alle Proben':c.scope==='parry'?'Parieren':c.scope==='block'?'Blocken':c.scope==='dodge'?'Ausweichen':'Trefferwurf'})`);});
  (r.rollMods||[]).forEach(rm=>{parts.push(`Würfelergebnis ${fmtSign(rm.val)} (${rm.scope==='all'?'Alle Proben':'Trefferwurf'})`);});
  r.counters.forEach(c=>{
    if(c.counterKey==='reduce_melee_mount') parts.push(`Reduziert Nahkampf-/Reiten-Nachteile um ${c.val}`);
    else if(c.counterKey==='negate_throw_dis') parts.push(`Kein Nachteil beim Waffenwurf`);
    else if(c.counterKey==='thrust_grip') parts.push(`Situativ: Ignoriert Langsam (${c.val}) bei Stoßattacken`);
  });
  return parts.length?`\n⚡ Würfelassistent: ${parts.join(' • ')}`:'';
}
export const RE_CNT_MOB_NM=/mobiler\s+sch[üu]tze/i;
export const RE_CNT_MOB_NUM=/\((\d+)\)|\b(\d+)\b/;
export const RE_CNT_RED_MM=/nachteil\w*[\s\S]{0,80}?(?:nahkampf|reiten)[\s\S]{0,60}?(?:um\s+(\d+|\bein\w*\b|\bzwei\b|\bdrei\b)\s+)?(?:verringert|reduziert|ignoriert)/i;
export const RE_CNT_AERO_NM=/\baerodynamisch\b/i;
export const RE_CNT_AERO_TXT=/(?:keine[n]?|ohne)\s+nachteil\w*[\s\S]{0,60}?(?:waffenwerfen|beim\s+werfen)/i;
export function getSheetCounterTotals(sheet=S){
  let redMeleeMount=0, negThrow=false;
  const scanText=(nm,tx)=>{
    const combined=`${nm||''}\n${stripHtml(tx||'')}`;
    let m;
    if(RE_CNT_MOB_NM.test(nm||'')){
      const nmM=String(nm||'').match(RE_CNT_MOB_NUM);
      redMeleeMount+=nmM?Math.max(1,toInt(nmM[1]||nmM[2],1)):1;
    }else if((m=combined.match(RE_CNT_RED_MM))){
      redMeleeMount+=m[1]?Math.max(1,parseAdvNumVal(m[1])):1;
    }
    if(RE_CNT_AERO_NM.test(nm||'')||RE_CNT_AERO_TXT.test(combined)) negThrow=true;
  };
  [...(sheet.powers||[]),...(sheet.augments||[])].forEach(it=>{if(it&&it.applyMods!==false)scanText(it.name,`${it.effects||''}\n${it.rules||''}`);});
  return {redMeleeMount,negThrow};
}

export function getAdvDisForContext(ctx={},M=null,sheet=S){
  const target=sheet||S;
  const mods=M||calcActiveMods(target);
  const list=mods.advDis||[];
  const w=ctx.weaponId?(target.weapons||[]).find(x=>x.id===ctx.weaponId):null;
  const rawCat=ctx.wRollCat||(w?'Trefferwurf':'Normaler Test');
  const cat=rawCat==='Parade'?'Parieren':rawCat;
  const oppDefCat=ctx.oppDefenseCat?(ctx.oppDefenseCat==='Parade'?'Parieren':ctx.oppDefenseCat):'';
  const sk=ctx.skillId?(target.skills||[]).find(x=>x.id===ctx.skillId):null;
  const skNameLow=sk?String(sk.name||'').trim().toLowerCase():'';
  const skBaseLow=skNameLow.replace(/\s*\([^)]*\)\s*$/,'').trim();
  const ak=ctx.attrKey||(sk?sk.linkedAttr:null)||(w?getWeaponRollMeta(w,mods,target).attrKey:null);
  const isNormTest=cat==='Normaler Test';
  const isSkDodge=Boolean(skNameLow==='ausweichen'||skBaseLow==='ausweichen');
  const isSkParry=Boolean(skNameLow==='parieren'||skBaseLow==='parieren'||skNameLow==='parade'||skBaseLow==='parade');
  const isSkBlock=Boolean(skNameLow==='blocken'||skBaseLow==='blocken');
  const isSkDefense=Boolean(isSkDodge||isSkParry||isSkBlock||skNameLow==='abwehr'||skBaseLow==='abwehr');
  const matchesScope=e=>{
    if(e.isOppDef&&oppDefCat){
      if(cat!=='Trefferwurf') return false;
      const sub=e.oppDefSubScope||'defense';
      if(sub==='parry') return oppDefCat==='Parieren';
      if(sub==='parry_block') return oppDefCat==='Parieren'||oppDefCat==='Blocken';
      if(sub==='block') return oppDefCat==='Blocken';
      if(sub==='dodge') return oppDefCat==='Ausweichen';
      return oppDefCat==='Parieren'||oppDefCat==='Blocken'||oppDefCat==='Ausweichen'||oppDefCat==='Abwehr';
    }
    if(e.scope==='all') return true;
    if(e.scope==='hit') return cat==='Trefferwurf';
    if(e.scope==='hit_melee') return cat==='Trefferwurf'&&(w?w.wType!=='ranged':(skNameLow!=='fernkampf'&&skBaseLow!=='fernkampf'));
    if(e.scope==='hit_ranged') return cat==='Trefferwurf'&&(w?w.wType==='ranged':(skNameLow==='fernkampf'||skBaseLow==='fernkampf'));
    if(e.scope==='defense') return cat==='Parieren'||cat==='Blocken'||cat==='Ausweichen'||cat==='Abwehr'||(isNormTest&&isSkDefense);
    if(e.scope==='parry_block') return cat==='Parieren'||cat==='Blocken'||(isNormTest&&(isSkParry||isSkBlock));
    if(e.scope==='parry') return cat==='Parieren'||(isNormTest&&isSkParry);
    if(e.scope==='block') return cat==='Blocken'||(isNormTest&&isSkBlock);
    if(e.scope==='dodge') return cat==='Ausweichen'||(isNormTest&&isSkDodge);
    if(e.scope==='attr') return Boolean(ak&&e.attrKey===ak);
    if(e.scope==='skill'){
      if(e.skillId&&sk&&e.skillId===sk.id) return true;
      const tLow=String(e.skillName||'').trim().toLowerCase();
      return Boolean(tLow&&skNameLow&&(skNameLow===tLow||(!tLow.includes('(')&&skBaseLow===tLow)));
    }
    if((e.scope==='skill_multi'||e.scope==='stealth_detect')&&Array.isArray(e.skillCandidates)){
      return Boolean(skNameLow&&e.skillCandidates.some(c=>skNameLow.includes(c)||skBaseLow===c));
    }
    return false;
  };
  let autoAdv=0,autoDis=0;
  const src=[];
  list.forEach(e=>{
    if(matchesScope(e)&&e.val){
      if(e.kind==='dis') autoDis+=e.val;
      else autoAdv+=e.val;
      src.push(e);
    }
  });
  const sitActive=ctx.sitActive||{};
  const eqSources=[];
  if(w){
    (w.tags||[]).forEach(tg=>eqSources.push(analyzeEqTagTooltip(tg,target.weaponTagList,'weapon',w,target)));
    const linkedAmmo=w.wType==='ranged'&&w.ammoId?(target.ammos||[]).find(a=>a.id===w.ammoId):null;
    if(linkedAmmo){
      (linkedAmmo.tags||[]).forEach(tg=>eqSources.push(analyzeEqTagTooltip(tg,target.ammoTagList,'ammo',linkedAmmo,target)));
    }
  }
  if(Array.isArray(mods._armorEqSources)){
    mods._armorEqSources.forEach(es=>eqSources.push(es));
  }else{
    (target.armors||[]).filter(ar=>ar&&ar.equipped!==false&&Array.isArray(ar.tags)&&ar.tags.length).forEach(ar=>{
      ar.tags.forEach(tg=>eqSources.push(analyzeEqTagTooltip(tg,target.armorTagList,'armor',ar,target)));
    });
  }
  const sheetCnt=mods._sheetCounters||getSheetCounterTotals(target);
  let redMeleeMount=sheetCnt.redMeleeMount, negThrow=sheetCnt.negThrow, thrustGripVal=0;
  eqSources.forEach(es=>{
    es.counters.forEach(c=>{
      if(c.counterKey==='reduce_melee_mount') redMeleeMount+=c.val;
      else if(c.counterKey==='negate_throw_dis') negThrow=true;
      else if(c.counterKey==='thrust_grip') thrustGripVal=Math.max(thrustGripVal,c.val);
    });
  });
  let autoCrit=0, langsamDisTotal=0, autoRollMod=0;
  const critSrc=[], rollModSrc=[], sitMap=new Map();
  (mods.crits||[]).forEach(cr=>{
    if(matchesScope(cr)&&cr.val){autoCrit+=cr.val;critSrc.push(cr);}
  });
  const addSitOpt=(key,opt)=>{
    if(!sitMap.has(key)) sitMap.set(key,{sitKey:key,sitLabel:opt.sitLabel,adv:0,dis:0,rawDis:0,reduceDis:0,counterNote:'',items:[]});
    const g=sitMap.get(key);
    if(opt.kind==='reduce_dis') g.reduceDis+=opt.val;
    else if(opt.kind==='dis'){g.dis+=opt.val;g.rawDis+=opt.val;}
    else g.adv+=opt.val;
    if(opt.counterNote) g.counterNote=opt.counterNote;
    g.items.push(opt);
  };
  eqSources.forEach(es=>{
    es.crits.forEach(cr=>{
      if(matchesScope(cr)&&cr.val){autoCrit+=cr.val;critSrc.push(cr);}
    });
    (es.rollMods||[]).forEach(rm=>{if(matchesScope(rm)&&rm.val){autoRollMod+=rm.val;rollModSrc.push(rm);}});
    es.mods.forEach(m=>{
      if(!matchesScope(m)||!m.val) return;
      if(m.sitKey){
        addSitOpt(m.sitKey,m);
      }else{
        if(m.kind==='dis'){
          autoDis+=m.val;
          if(m.tagBaseLow==='langsam') langsamDisTotal+=m.val;
        }else autoAdv+=m.val;
        src.push(m);
      }
    });
  });
  if(sitMap.has('melee_mount')&&redMeleeMount>0){
    const g=sitMap.get('melee_mount');
    const oldDis=g.dis;
    g.dis=Math.max(0,oldDis-redMeleeMount);
    g.counterNote=`${oldDis} − ${redMeleeMount} Mobiler Schütze`;
  }
  if(w&&cat==='Trefferwurf'&&w.wType!=='ranged'){
    const wNm=String(w.name||'').trim()||getWeaponSubtype(w.wType).label;
    if(!sitMap.has('throw')){
      addSitOpt('throw',{
        val:negThrow?0:1,
        kind:'dis',
        scope:'hit',
        label:negThrow?'Waffenwurf (Aerodynamisch)':'Waffenwurf (ohne Aerodynamisch)',
        sitKey:'throw',
        sitLabel:negThrow?'🎯 Waffenwurf (Aerodynamisch)':'🎯 Waffenwurf',
        counterNote:negThrow?'Aerodynamisch: kein Nachteil':'ohne Aerodynamisch',
        srcName:wNm,
        srcKind:negThrow?'Waffen-Tag':'Waffenwurf'
      });
    }else if(negThrow){
      const g=sitMap.get('throw');
      g.dis=0; g.counterNote='Aerodynamisch: kein Nachteil';
    }
  }else if(sitMap.has('throw')&&negThrow){
    const g=sitMap.get('throw');
    g.dis=0; g.counterNote='Aerodynamisch: kein Nachteil';
  }
  if(w&&cat==='Trefferwurf'&&thrustGripVal>0&&langsamDisTotal>0){
    const red=Math.min(langsamDisTotal,thrustGripVal);
    addSitOpt('thrust_grip',{
      val:red,
      kind:'reduce_dis',
      scope:'hit',
      label:'Stoßattacke (Langsam ignoriert)',
      sitKey:'thrust_grip',
      sitLabel:'🗡️ Stoßattacke (Zweiter Griff)',
      srcName:`${String(w.name||'').trim()||'Waffe'} • Zweiter Griff`,
      srcKind:'Waffen-Tag'
    });
  }
  const sitOptions=[];
  sitMap.forEach(g=>{
    const on=Boolean(sitActive[g.sitKey]);
    sitOptions.push({...g,active:on});
    if(on){
      const tg0=g.items[0]?.tagLbl||'';
      if(g.adv>0){autoAdv+=g.adv;src.push({val:g.adv,kind:'adv',tagLbl:tg0,isSit:true,label:g.sitLabel+(g.counterNote?`: ${g.counterNote}`:''),srcName:g.items[0]?.srcName||g.sitLabel,srcKind:g.items[0]?.srcKind||'Situativ'});}
      if(g.dis>0){autoDis+=g.dis;src.push({val:g.dis,kind:'dis',tagLbl:tg0,isSit:true,label:g.sitLabel+(g.counterNote?`: ${g.counterNote}`:''),srcName:g.items[0]?.srcName||g.sitLabel,srcKind:g.items[0]?.srcKind||'Situativ'});}
      if(g.reduceDis>0){autoDis=Math.max(0,autoDis-g.reduceDis);src.push({val:-g.reduceDis,kind:'dis',tagLbl:tg0,isSit:true,label:`${g.sitLabel}: Langsam reduziert`,srcName:g.items[0]?.srcName||g.sitLabel,srcKind:g.items[0]?.srcKind||'Situativ'});}
    }
  });
  if(ctx.includeInspiration&&target.inspirationActive){
    autoAdv+=1;
    src.push({val:1,kind:'adv',scope:'all',label:'Inspiration (Nächster Wurf)',tagLbl:'✨ Inspiration',srcName:'✨ Inspiration',srcKind:'Inspiration'});
  }
  return {autoAdv:Math.max(0,autoAdv),autoDis:Math.max(0,autoDis),rawAutoAdv:autoAdv,rawAutoDis:autoDis,src,autoCrit,critSrc,autoRollMod,rollModSrc,sitOptions};
}
export const fmtAdvSrcLines=src=>(src||[]).map(s=>`• ${s.srcName} (${s.srcKind}): ${fmtSign(s.val)} ${s.kind==='dis'?'Nachteil(e)':'Vorteil(e)'} [${s.label}]`).join('\n');
export function buildAttrTip(k,M=null,sheet=S){
  const mods=M||calcActiveMods(sheet);
  const a=sheet.attributes[k], meta=ATTRS.find(x=>x.k===k), vw=toInt(a.vw), pot=toInt(a.pot), tr=getTrBonus(k,sheet), mod=toInt(a.mod), tot=getAttrTot(k,mods,sheet), sl=fmtSrcLines(mods,k), adl=fmtAdvSrcLines(getAdvDisForContext({attrKey:k},mods,sheet).src);
  return `${meta?meta.n:k} (${k}) Gesamt: ${tot}\n• Volkswert (Vw): ${vw}${pot?`\n• Potenzial (Pot): ${fmtSign(pot)}`:''}${tr?`\n• Training (Tr): ${fmtSign(tr)}`:''}${mod?`\n• Modifikator (Mod): ${fmtSign(mod)}`:''}${sl?`\n${sl}`:''}${adl?`\n${adl}`:''}`;
}
export function buildSecTip(key,M=null,sheet=S){
  const mods=M||calcActiveMods(sheet);
  if(key==='lp'){
    const ko=getAttrTot('KO',mods,sheet),st=getAttrTot('ST',mods,sheet),base=Math.floor((ko+st)/5),mod=toInt(sheet.secondary.lpMod),tot=getLpMax(mods,sheet),sl=fmtSrcLines(mods,'lpMax');
    return `LP-Max Gesamt: ${tot}\n• Basis ⌊(KO ${ko} + ST ${st}) / 5⌋: ${base}${mod?`\n• Manuelles Mod: ${fmtSign(mod)}`:''}${sl?`\n${sl}`:''}${fmtReservedTipLine('lp',mods,sheet)}`;
  }
  if(key==='mlp'){
    const au=getAttrTot('AU',mods,sheet),wk=getAttrTot('WK',mods,sheet),base=Math.floor((au+wk)/5),mod=toInt(sheet.secondary.mlpMod),tot=getMlpMax(mods,sheet),sl=fmtSrcLines(mods,'mlpMax');
    return `mLP-Max Gesamt: ${tot}\n• Basis ⌊(AU ${au} + WK ${wk}) / 5⌋: ${base}${mod?`\n• Manuelles Mod: ${fmtSign(mod)}`:''}${sl?`\n${sl}`:''}${fmtReservedTipLine('mlp',mods,sheet)}`;
  }
  if(key==='lpRegen'){
    const auto=getLpRegenAuto(mods,sheet),tot=getLpRegen(mods,sheet),ovr=hasLpRegenOvr(sheet),sl=fmtSrcLines(mods,'lpRegen');
    return `LP-Regenerationsrate: ${tot} (Erholsame Rast 2×: +${tot*2} LP)\n• Basiswert: ${LP_REGEN_BASE}${sl?`\n${sl}`:''}${ovr?`\n• Manueller Overwrite aktiv (Automatisch: ${auto})`:''}`;
  }
  if(key==='mlpRegen'){
    const auto=getMlpRegenAuto(mods,sheet),tot=getMlpRegen(mods,sheet),ovr=hasMlpRegenOvr(sheet),sl=fmtSrcLines(mods,'mlpRegen');
    return `mLP-Regenerationsrate: ${tot} (Erholsame Rast 2×: +${tot*2} mLP)\n• Basiswert: ${MLP_REGEN_BASE}${sl?`\n${sl}`:''}${ovr?`\n• Manueller Overwrite aktiv (Automatisch: ${auto})`:''}`;
  }
  if(key==='ini'){
    const wa=getAttrTot('WA',mods,sheet),inV=getAttrTot('IN',mods,sheet),base=wa-inV,mod=toInt(sheet.secondary.iniMod),tot=getIniTot(mods,sheet),sl=fmtSrcLines(mods,'ini');
    return `Initiative Gesamt: ${fmtSign(tot)}\n• Basis (WA ${wa} − IN ${inV}): ${fmtSign(base)}${mod?`\n• Manuelles Mod: ${fmtSign(mod)}`:''}${sl?`\n${sl}`:''}`;
  }
  if(key==='ap'){
    const base=toInt(sheet.secondary.apMax,3),tot=base+mods.apMax,sl=fmtSrcLines(mods,'apMax');
    return `AP-Max Gesamt: ${tot}\n• Basis-Maximum: ${base}${sl?`\n${sl}`:''}${fmtReservedTipLine('ap',mods,sheet)}`;
  }
  if(key==='map'){
    const base=toInt(sheet.secondary.mapMax,3),tot=base+mods.mapMax,sl=fmtSrcLines(mods,'mapMax');
    return `mAP-Max Gesamt: ${tot}\n• Basis-Maximum: ${base}${sl?`\n${sl}`:''}${fmtReservedTipLine('map',mods,sheet)}`;
  }
  if(key==='cres'){
    const cn=cresName(sheet),base=toInt(sheet.customRes.max,3),tot=getCresMax(mods,sheet),sl=fmtSrcLines(mods,'cresMax');
    return `${cn}-Max Gesamt: ${tot}\n• Basis-Maximum: ${base}${sl?`\n${sl}`:''}${fmtReservedTipLine('cres',mods,sheet)}`;
  }
  if(String(key||'').startsWith('ex_')){
    const ex=(sheet.extraSecList||[]).find(x=>'ex_'+x.id===key);
    if(ex){const nm=getExtraSecName(ex),base=getExtraSecBase(ex),tot=getExtraSecMax(ex,mods,sheet),sl=fmtSrcLines(mods,key);return `${nm}-Max Gesamt: ${tot}\n• Basis-Maximum: ${base}${sl?`\n${sl}`:''}${fmtReservedTipLine(key,mods,sheet)}`;}
  }
  if(key==='bst'){
    const auto=getBstAuto(sheet),base=getBstBase(sheet),tot=getEffBst(mods,sheet),ovr=hasBstOvr(sheet),sl=fmtSrcLines(mods,'bst');
    return `Bewegungsstufe (BSt) Gesamt: ${tot}\n• Basis-BSt: ${base} (Automatik ⌊Bew/5⌋: ${auto})${ovr?`\n• Manueller Overwrite aktiv (Automatisch: ${auto})`:''}${sl?`\n${sl}`:''}`;
  }
  const thNames={woundLight:'Verwundung (leicht)',woundMedium:'Verwundung (mittel)',woundHeavy:'Verwundung (schwer)',traumaLight:'Trauma (leicht)',traumaMedium:'Trauma (mittel)',traumaHeavy:'Trauma (schwer)'};
  if(thNames[key]){
    const base=toInt(sheet.thresholds[key],0),tot=base+(mods[key]||0),sl=fmtSrcLines(mods,key);
    return `${thNames[key]} Gesamt: ${tot} (tritt ab ${tot+1} Schaden ein)\n• Basiswert: ${base}${sl?`\n${sl}`:''}`;
  }
  return '';
}

export function syncCresRenameInTokens(oldN,newN){
  const o=String(oldN||'').trim(), n=String(newN||'').trim();
  if(!o||!n||o===n) return;
  const e=o.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  const r1=new RegExp(`\\[([+-]?\\d+)\\s+${e}-Max\\]`,'gi'), r2=new RegExp(`\\[([+-]?\\d+)\\s+${e}\\]`,'gi');
  const oLow=o.toLowerCase();
  [...S.powers,...S.augments].forEach(it=>{
    if(it.effects) it.effects=it.effects.replace(r1,`[$1 ${n}-Max]`).replace(r2,`[$1 ${n}]`);
    const bs=String(it.bldStat||'').trim().toLowerCase();
    if(bs===`${oLow}-max`) it.bldStat=`${n}-Max`;
    else if(bs===oLow) it.bldStat=n;
    const dv=String(it.bldDynVar||'').trim().toLowerCase();
    if(dv===`${oLow}-max`) it.bldDynVar=`${n}-Max`;
    else if(dv===oLow) it.bldDynVar=n;
  });
}
export function syncSkillRenameInTokens(oldName,newName){
  const o=String(oldName||'').trim(), n=String(newName||'').trim();
  if(!o||!n||o===n) return;
  const e=escReStr(o).replace(/ /g,'(?: |&nbsp;)');
  const r=new RegExp(`(\\[[+-]?\\d+(?:\\s|&nbsp;)+(?:Vorteil(?:e|en)?|Nachteil(?:e|en)?)(?:\\s|&nbsp;)*\\((?:\\s|&nbsp;)*)${e}((?:\\s|&nbsp;)*\\)\\])`,'gi');
  [...S.powers,...S.augments].forEach(it=>{
    if(it.effects) it.effects=it.effects.replace(r,(_,pre,post)=>pre+n+post);
  });
  invalidateModsCache();
}
export function purgeExtraSecFromPowers(secName,exId){
  const o=String(secName||'').trim();
  const e=o?o.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'):'';
  const r=o?new RegExp(`\\[([+-]?\\d+)\\s+${e}(?:-Max)?\\]`,'gi'):null;
  const oLow=o.toLowerCase();
  [...S.powers,...S.augments].forEach(it=>{
    if(r&&it.effects) it.effects=it.effects.replace(r,'').replace(/[ \t\u00a0]{2,}/g,' ').trim();
    if(o){
      const bs=String(it.bldStat||'').trim().toLowerCase();
      if(bs===`${oLow}-max`||bs===oLow) it.bldStat='LP-Max';
      const dv=String(it.bldDynVar||'').trim().toLowerCase();
      if(dv===`${oLow}-max`||dv===oLow) it.bldDynVar='WA';
    }
    if(exId){
      if(Array.isArray(it.useCosts)) it.useCosts=it.useCosts.filter(c=>c&&c.res!=='ex_'+exId);
      if(it.useRes==='ex_'+exId){it.useRes='';it.useAmt=0;}
      syncPwUseCostsLegacy(it);
    }
  });
}

export function calcAutoSkCost(catKey,rank){
  const cat=SK_CATS[catKey]||SK_CATS.fundamental, r=Math.max(0,Math.min(4,toInt(rank,0)));
  let sp=0; for(let i=1;i<=r;i++) sp+=cat.s[i];
  return {sp,msp:r===4?1:0};
}

export const normPackMatchName=s=>String(s||'').trim().toLowerCase().replace(/\s+/g,' ');
export function findDuplicatePwEntry(name,excludeId=''){
  const key=normPackMatchName(name);
  if(!key) return null;
  return [...(S.powers||[]),...(S.augments||[])].find(x=>x&&x.id!==excludeId&&normPackMatchName(x.name)===key)||null;
}
export function makeUniquePwName(baseName,excludeId=''){
  const clean=String(baseName||'').trim();
  if(!clean) return '';
  if(!findDuplicatePwEntry(clean,excludeId)) return clean;
  const base=clean.replace(/\s*\(Kopie(?:\s+\d+)?\)\s*$/i,'').trim()||clean;
  let cand=`${base} (Kopie)`, n=2;
  while(findDuplicatePwEntry(cand,excludeId)){
    cand=`${base} (Kopie ${n})`;
    n++;
  }
  return cand;
}
export function updatePwNameDupHint(el,dup){
  const wrap=el?.parentElement;
  if(!wrap) return;
  let hint=wrap.querySelector('[data-pw-dup-hint]');
  if(!dup){
    if(hint) hint.remove();
    return;
  }
  const dupKind=S.augments.some(a=>a&&a.id===dup.id)?'Augment':'Kraft';
  if(!hint){
    hint=document.createElement('span');
    hint.setAttribute('data-pw-dup-hint','1');
    hint.className='px-2 py-0.5 rounded-md border border-rose-500/60 bg-rose-500/20 text-rose-300 text-[11px] font-extrabold shrink-0';
    el.insertAdjacentElement('afterend',hint);
  }
  hint.textContent=`⚠️ Bereits als ${dupKind} vorhanden`;
}
export function enforceUniquePwName(el){
  if(!el||!el.dataset?.pwf?.endsWith(':name')) return true;
  const [kind,id]=el.dataset.pwf.split(':'), it=findPwItem(kind,id);
  if(!it) return true;
  const dup=findDuplicatePwEntry(el.value,id);
  if(!dup){
    el.classList.remove('!border-rose-500');
    updatePwNameDupHint(el,null);
    return true;
  }
  const badName=String(el.value||'').trim();
  const prev=el.dataset.prevName!==undefined?el.dataset.prevName:String(it.name||'');
  const safePrev=findDuplicatePwEntry(prev,id)?'':prev;
  const dupKind=S.augments.some(a=>a&&a.id===dup.id)?'Augment':'Kraft';
  it.name=safePrev;
  el.value=safePrev;
  el.dataset.prevName=safePrev;
  el.classList.remove('!border-rose-500');
  updatePwNameDupHint(el,null);
  save();
  const warnMsg=`⚠️ Der Name „${badName}“ existiert bereits (als ${dupKind}). Bitte wähle einen eindeutigen Namen!`;
  toast(warnMsg,5500);
  UI.dupPwWarn={name:badName,dupKind,targetKind:kind,targetId:id,revertedTo:safePrev};
  UI.modal='dupPwName';
  hooks.renderModal?.();
  return false;
}
export function cleanSecForPowerExport(sec,forceRoot=false){
  return {
    id:String(sec?.id||uid()),
    name:String(sec?.name||'Sektion'),
    color:isHex(sec?.color)?sec.color:'',
    bgColor:isHex(sec?.bgColor)?sec.bgColor:'',
    collapsed:Boolean(sec?.collapsed),
    filterArt:findMainArt(sec?.filterArt),
    parentSectionId:forceRoot?'':String(sec?.parentSectionId||'')
  };
}
export function cleanPwForPowerExport(rawIt,isAug=false){
  const n=normPwEntry(clone(rawIt||{}),isAug);
  const out={
    id:String(n.id||uid()),
    templateId:String(n.templateId||''),
    name:String(n.name||''),
    color:isHex(n.color)?n.color:'',
    bgColor:isHex(n.bgColor)?n.bgColor:'',
    sectionId:isAug?(!n.parentPowerId?String(n.sectionId||''):''):String(n.sectionId||''),
    collapsed:Boolean(n.collapsed),
    req:String(n.req||''),
    tier:n.tier,
    manualCost:Boolean(n.manualCost),
    sp:toInt(n.sp,0),
    msp:toInt(n.msp,0),
    showManual:false,
    art:String(n.art||''),
    artManual:Boolean(n.artManual),
    actionSubs:Array.isArray(n.actionSubs)?[...n.actionSubs]:[],
    tags:Array.isArray(n.tags)?[...n.tags]:[],
    useCosts:Array.isArray(n.useCosts)?clone(n.useCosts):[],
    useAmt:toInt(n.useAmt,0),
    useRes:String(n.useRes||''),
    reserved:false,
    reservedCosts:[],
    desc:String(n.desc||''),
    effects:String(n.effects||''),
    rules:String(n.rules||''),
    applyMods:Boolean(n.applyMods),
    bldAmt:String(n.bldAmt||'+1'),
    bldStat:String(n.bldStat||'LP-Max'),
    bldMode:n.bldMode==='skill'?'skill':(n.bldMode==='dyn'?'dyn':'stat'),
    bldSkCnt:String(n.bldSkCnt||'1'),
    bldSkKind:n.bldSkKind==='dis'?'dis':'adv',
    bldSkId:String(n.bldSkId||''),
    bldDynVar:String(n.bldDynVar||'WA'),
    bldDynFactor:n.bldDynFactor!==undefined&&n.bldDynFactor!==null?String(n.bldDynFactor):'/2',
    bldDynRound:['floor','ceil','round'].includes(n.bldDynRound)?n.bldDynRound:'',
    bldDynTarget:['desc','effects','rules'].includes(n.bldDynTarget)?n.bldDynTarget:'desc',
    boxH:{desc:toInt(n.boxH?.desc,0),effects:toInt(n.boxH?.effects,0),rules:toInt(n.boxH?.rules,0)}
  };
  if(isAug) out.parentPowerId=String(n.parentPowerId||'');
  return out;
}
export function buildPowerExportPack(opts={}){
  const mode=opts.mode||'all';
  let sections=[], powers=[], augments=[], defaultName='Scherbensturm Kräfte-Paket';
  if(mode==='section'){
    const rootId=String(opts.sectionId||'').trim();
    const rootSec=(S.powerSections||[]).find(s=>s&&s.id===rootId);
    if(rootSec){
      defaultName=String(rootSec.name||'Sektions-Paket').trim()||'Sektions-Paket';
      const secIdSet=new Set([rootSec.id]);
      const queue=[rootSec.id];
      while(queue.length){
        const cur=queue.shift();
        (S.powerSections||[]).forEach(s=>{
          if(s&&s.parentSectionId===cur&&!secIdSet.has(s.id)){
            secIdSet.add(s.id);
            queue.push(s.id);
          }
        });
      }
      sections=(S.powerSections||[]).filter(s=>s&&secIdSet.has(s.id)).map(s=>cleanSecForPowerExport(s,s.id===rootSec.id));
      const matchedPowers=(S.powers||[]).filter(p=>p&&secIdSet.has(p.sectionId));
      const pwIdSet=new Set(matchedPowers.map(p=>p.id));
      powers=matchedPowers.map(p=>cleanPwForPowerExport(p,false));
      augments=(S.augments||[]).filter(a=>a&&((a.parentPowerId&&pwIdSet.has(a.parentPowerId))||(!a.parentPowerId&&a.sectionId&&secIdSet.has(a.sectionId)))).map(a=>cleanPwForPowerExport(a,true));
    }
  }else if(mode==='item'){
    const kind=opts.kind==='augment'?'augment':'power';
    const itemId=String(opts.id||'').trim();
    if(kind==='augment'){
      const aug=(S.augments||[]).find(a=>a&&a.id===itemId);
      if(aug){
        defaultName=String(aug.name||'Augment-Paket').trim()||'Augment-Paket';
        augments=[cleanPwForPowerExport(aug,true)];
      }
    }else{
      const pw=(S.powers||[]).find(p=>p&&p.id===itemId);
      if(pw){
        defaultName=String(pw.name||'Kraft-Paket').trim()||'Kraft-Paket';
        powers=[cleanPwForPowerExport(pw,false)];
        augments=(S.augments||[]).filter(a=>a&&a.parentPowerId===pw.id).map(a=>cleanPwForPowerExport(a,true));
      }
    }
  }else{
    defaultName=String(S.profile?.name||'').trim()?`${String(S.profile.name).trim()} – Kräfte & Augmente`:'Scherbensturm Kräfte-Paket';
    sections=(S.powerSections||[]).map(s=>cleanSecForPowerExport(s,false));
    powers=(S.powers||[]).map(p=>cleanPwForPowerExport(p,false));
    augments=(S.augments||[]).map(a=>cleanPwForPowerExport(a,true));
  }
  return {
    schema:POWER_PACK_SCHEMA,
    id:String(opts.packId||uid()),
    name:String(opts.name||'').trim()||defaultName,
    category:String(opts.category||'Allgemein').trim()||'Allgemein',
    description:String(opts.description||''),
    isBasisPack:Boolean(opts.isBasisPack),
    updatedAt:stamp(),
    sections,
    powers,
    augments
  };
}
export function downloadPowerPackJson(pack,filenameBase){
  if(!pack||typeof pack!=='object') return false;
  const rawBase=String(filenameBase||pack.name||'Scherbensturm_Kraeftepaket').trim()||'Scherbensturm_Kraeftepaket';
  const safeBase=rawBase.replace(/\.json$/i,'').replace(/[^a-zA-Z0-9äöüÄÖÜß_-]+/g,'_').replace(/^_+|_+$/g,'')||'Scherbensturm_Kraeftepaket';
  const url=URL.createObjectURL(new Blob([JSON.stringify(pack,null,2)],{type:'application/json'}));
  const a=document.createElement('a');
  a.href=url;
  a.download=`${safeBase}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
  return true;
}
export function resolveLibraryAugmentParentName(rawAug,currentPack,allPacks){
  if(!rawAug||typeof rawAug!=='object') return '';
  const ppid=String(rawAug.parentPowerId||'').trim();
  if(ppid){
    const findInPack=pk=>{
      if(!pk||!Array.isArray(pk.powers)) return null;
      return pk.powers.find(p=>p&&(String(p.id||'').trim()===ppid||String(p.templateId||'').trim()===ppid))||null;
    };
    let found=findInPack(currentPack);
    if(!found&&Array.isArray(allPacks)){
      for(const pk of allPacks){
        found=findInPack(pk);
        if(found) break;
      }
    }
    if(found&&String(found.name||'').trim()) return String(found.name).trim();
  }
  const explicitParent=String(rawAug.parentPower||rawAug.parentPowerName||'').trim();
  if(explicitParent) return explicitParent;
  const augName=String(rawAug.name||'').trim();
  const parenMatch=augName.match(/\(([^()]+)\)\s*$/);
  if(parenMatch&&String(parenMatch[1]||'').trim()) return String(parenMatch[1]).trim();
  const pkName=String(currentPack?.name||'').trim();
  const augPackMatch=pkName.match(/^Augmente\s*:\s*(.+)$/i);
  if(augPackMatch&&String(augPackMatch[1]||'').trim()) return String(augPackMatch[1]).trim();
  return '';
}
export function getSuggestedAugmentsForPower(power,currentPack,allPacks){
  if(!power||typeof power!=='object') return [];
  const pid=String(power.id||'').trim();
  const ptid=String(power.templateId||'').trim();
  const pNameNorm=normPackMatchName(power.name);
  const out=[], seen=new Set();
  const addAug=(a,srcPk)=>{
    if(!a||typeof a!=='object') return;
    const aid=String(a.id||'').trim();
    const key=aid||(`${srcPk?.id||''}::${normPackMatchName(a.name)}`);
    if(!key||seen.has(key)) return;
    seen.add(key);
    out.push({aug:a,sourcePack:srcPk,sourcePackId:String(srcPk?.id||''),isCrossPack:String(srcPk?.id||'')!==String(currentPack?.id||'')});
  };
  const matchesPower=(a,srcPk)=>{
    const ppid=String(a?.parentPowerId||'').trim();
    if(ppid&&((pid&&ppid===pid)||(ptid&&ppid===ptid))) return true;
    if(pNameNorm){
      const resolved=resolveLibraryAugmentParentName(a,srcPk,allPacks);
      if(resolved&&normPackMatchName(resolved)===pNameNorm) return true;
    }
    return false;
  };
  (Array.isArray(currentPack?.augments)?currentPack.augments:[]).forEach(a=>{
    if(matchesPower(a,currentPack)) addAug(a,currentPack);
  });
  (Array.isArray(allPacks)?allPacks:[]).forEach(otherPk=>{
    if(!otherPk||otherPk.id===currentPack?.id) return;
    (Array.isArray(otherPk.augments)?otherPk.augments:[]).forEach(a=>{
      if(matchesPower(a,otherPk)) addAug(a,otherPk);
    });
  });
  return out;
}
export function importPowerPackIntoSheet(rawPack,opts={}){
  const summary={addedSec:0,addedPw:0,addedAug:0,autoLinkedAugs:0,updatedPw:0,skipped:0,duplicateNames:[],fullSlotNotices:[]};
  const recordDupName=nm=>{const clean=String(nm||'').trim();if(clean&&!summary.duplicateNames.includes(clean))summary.duplicateNames.push(clean);};
  const recordFullSlot=(augName,powerName)=>{
    const aClean=String(augName||'').trim()||'Augment', pClean=String(powerName||'').trim();
    if(pClean&&!summary.fullSlotNotices.some(x=>x.augName===aClean&&x.powerName===pClean)){
      summary.fullSlotNotices.push({augName:aClean,powerName:pClean});
    }
  };
  let src=rawPack;
  if(typeof src==='string'){
    try{src=JSON.parse(src);}catch(e){return summary;}
  }
  if(!src||typeof src!=='object') return summary;
  const sourcePacks=[];
  if(Array.isArray(src.packs)){
    src.packs.forEach(p=>{
      if(!p||typeof p!=='object') return;
      sourcePacks.push({
        id:String(p.id||''),
        name:String(p.name||src.name||'Kräfte-Paket').trim()||'Kräfte-Paket',
        sections:Array.isArray(p.sections)?p.sections:(Array.isArray(p.powerSections)?p.powerSections:[]),
        powers:Array.isArray(p.powers)?p.powers:[],
        augments:Array.isArray(p.augments)?p.augments:[]
      });
    });
  }else if(src.schema===POWER_PACK_SCHEMA||Array.isArray(src.sections)||Array.isArray(src.powerSections)||Array.isArray(src.powers)||Array.isArray(src.augments)){
    sourcePacks.push({
      id:String(src.id||''),
      name:String(src.name||src.profile?.name||'Kräfte-Paket').trim()||'Kräfte-Paket',
      sections:Array.isArray(src.sections)?src.sections:(Array.isArray(src.powerSections)?src.powerSections:[]),
      powers:Array.isArray(src.powers)?src.powers:[],
      augments:Array.isArray(src.augments)?src.augments:[]
    });
  }
  if(!sourcePacks.length) return summary;
  const allRefPacks=[...sourcePacks,...(Array.isArray(opts.allPacks)?opts.allPacks:hooks.getAllLibraryPacks())];
  const targetSectionId=(opts.targetSectionId&&S.powerSections.some(s=>s.id===opts.targetSectionId))?String(opts.targetSectionId):'';
  const dedupeMode=['copy','skipExisting','updateExisting'].includes(opts.dedupeMode)?opts.dedupeMode:'copy';
  const hasOnlySec=opts.onlySectionIds!==undefined&&opts.onlySectionIds!==null;
  const hasOnlyPw=opts.onlyPowerIds!==undefined&&opts.onlyPowerIds!==null;
  const hasOnlyAug=opts.onlyAugmentIds!==undefined&&opts.onlyAugmentIds!==null;
  const hasPartialFilter=hasOnlySec||hasOnlyPw||hasOnlyAug;
  const baseOnlySec=new Set(hasOnlySec?Array.from(opts.onlySectionIds).map(String):[]);
  const baseOnlyPw=new Set(hasOnlyPw?Array.from(opts.onlyPowerIds).map(String):[]);
  const baseOnlyAug=new Set(hasOnlyAug?Array.from(opts.onlyAugmentIds).map(String):[]);
  const collectedTags=[], packNames=[];
  const trackMeta=it=>{
    if(Array.isArray(it?.tags)) it.tags.forEach(tg=>{const c=String(tg||'').trim();if(c&&!isReservedPwTerm(c))collectedTags.push(c);});
  };
  const findExistingPower=rawPw=>{
    const tid=String(rawPw?.templateId||'').trim();
    if(tid){
      const byTid=S.powers.find(p=>p&&String(p.templateId||'').trim()===tid);
      if(byTid) return byTid;
    }
    const nm=normPackMatchName(rawPw?.name);
    if(nm){
      const byNm=S.powers.find(p=>p&&normPackMatchName(p.name)===nm);
      if(byNm) return byNm;
    }
    return null;
  };
  const findExistingAugment=(rawAug,mappedParentId)=>{
    const tid=String(rawAug?.templateId||'').trim();
    if(tid){
      const byTid=S.augments.find(a=>a&&String(a.templateId||'').trim()===tid);
      if(byTid) return byTid;
    }
    const nm=normPackMatchName(rawAug?.name);
    if(nm){
      if(mappedParentId){
        const samePar=S.augments.find(a=>a&&a.parentPowerId===mappedParentId&&normPackMatchName(a.name)===nm);
        if(samePar) return samePar;
      }
      const byNm=S.augments.find(a=>a&&normPackMatchName(a.name)===nm);
      if(byNm) return byNm;
    }
    return null;
  };

  sourcePacks.forEach(pk=>{
    if(pk.name) packNames.push(pk.name);
    let incSecs=(pk.sections||[]).filter(s=>s&&typeof s==='object');
    let incPws=(pk.powers||[]).filter(p=>p&&typeof p==='object');
    let incAugs=(pk.augments||[]).filter(a=>a&&typeof a==='object');

    if(hasPartialFilter){
      const secSet=new Set(baseOnlySec);
      const pwSet=new Set(baseOnlyPw);
      const augSet=new Set(baseOnlyAug);
      if(hasOnlySec&&!hasOnlyPw){
        let grew=true;
        while(grew){
          grew=false;
          incSecs.forEach(s=>{
            const sid=String(s.id||''), pid=String(s.parentSectionId||'');
            if(pid&&secSet.has(pid)&&sid&&!secSet.has(sid)){secSet.add(sid);grew=true;}
          });
        }
        incPws.forEach(p=>{
          const pid=String(p.id||''), sid=String(p.sectionId||'');
          if(sid&&secSet.has(sid)&&pid) pwSet.add(pid);
        });
        if(!hasOnlyAug){
          incAugs.forEach(a=>{
            const aid=String(a.id||''), ppid=String(a.parentPowerId||''), sid=String(a.sectionId||'');
            if(aid&&((ppid&&pwSet.has(ppid))||(!ppid&&sid&&secSet.has(sid)))) augSet.add(aid);
          });
        }
      }
      incSecs=incSecs.filter(s=>secSet.has(String(s.id||'')));
      incPws=incPws.filter(p=>pwSet.has(String(p.id||'')));
      incAugs=incAugs.filter(a=>augSet.has(String(a.id||'')));
    }

    const secIdMap=new Map();
    const pwIdMap=new Map();
    const newSecEntries=[];
    const importedSecOldIds=new Set(incSecs.map(s=>String(s.id||'')).filter(Boolean));

    incSecs.forEach(rawSec=>{
      const oldId=String(rawSec.id||'');
      const oldParentId=String(rawSec.parentSectionId||'');
      const resolvedParent=(oldParentId&&secIdMap.has(oldParentId))?secIdMap.get(oldParentId):((oldParentId&&importedSecOldIds.has(oldParentId))?'':targetSectionId);
      const nm=normPackMatchName(rawSec.name);
      let reused=null;
      if((dedupeMode==='skipExisting'||dedupeMode==='updateExisting')&&nm){
        reused=S.powerSections.find(s=>s&&normPackMatchName(s.name)===nm&&String(s.parentSectionId||'')===resolvedParent)
          ||S.powerSections.find(s=>s&&normPackMatchName(s.name)===nm)
          ||null;
      }
      if(reused){
        if(oldId) secIdMap.set(oldId,reused.id);
      }else{
        const newId=uid();
        const secObj={
          id:newId,
          name:String(rawSec.name||'Sektion'),
          color:isHex(rawSec.color)?rawSec.color:'',
          bgColor:isHex(rawSec.bgColor)?rawSec.bgColor:'',
          collapsed:Boolean(rawSec.collapsed),
          filterArt:findMainArt(rawSec.filterArt),
          parentSectionId:resolvedParent
        };
        S.powerSections.push(secObj);
        if(oldId) secIdMap.set(oldId,newId);
        newSecEntries.push({secObj,oldParentId});
        summary.addedSec++;
      }
    });

    newSecEntries.forEach(({secObj,oldParentId})=>{
      if(oldParentId&&secIdMap.has(oldParentId)){
        secObj.parentSectionId=secIdMap.get(oldParentId);
      }else{
        secObj.parentSectionId=targetSectionId;
      }
    });

    incPws.forEach(rawPw=>{
      const oldId=String(rawPw.id||'');
      const oldSecId=String(rawPw.sectionId||'');
      const mappedSecId=(oldSecId&&secIdMap.has(oldSecId))?secIdMap.get(oldSecId):targetSectionId;
      if(dedupeMode==='skipExisting'||dedupeMode==='updateExisting'){
        const existing=findExistingPower(rawPw);
        if(existing){
          if(oldId) pwIdMap.set(oldId,existing.id);
          if(dedupeMode==='skipExisting'){
            summary.skipped++;
            return;
          }
          if(findDuplicatePwEntry(rawPw.name,existing.id)){
            summary.skipped++;
            recordDupName(rawPw.name);
            return;
          }
          const norm=normPwEntry({...clone(rawPw),id:existing.id,sectionId:mappedSecId||existing.sectionId||'',showManual:false},false);
          norm.templateId=norm.templateId||existing.templateId||'';
          norm.collapsed=existing.collapsed;
          Object.assign(existing,norm);
          trackMeta(existing);
          summary.updatedPw++;
          return;
        }
      }
      const dupPw=findDuplicatePwEntry(rawPw.name);
      if(dupPw){
        if(oldId&&S.powers.some(p=>p&&p.id===dupPw.id)) pwIdMap.set(oldId,dupPw.id);
        summary.skipped++;
        recordDupName(rawPw.name);
        return;
      }
      const newId=uid();
      if(oldId) pwIdMap.set(oldId,newId);
      const norm=normPwEntry({...clone(rawPw),id:newId,sectionId:mappedSecId,showManual:false},false);
      S.powers.push(norm);
      trackMeta(norm);
      summary.addedPw++;
    });

    incAugs.forEach(rawAug=>{
      const oldParentId=String(rawAug.parentPowerId||'');
      let mappedParentId=(oldParentId&&pwIdMap.has(oldParentId))?pwIdMap.get(oldParentId):'';
      let autoLinkedByName=false;
      let fullSlotParentName='';
      if(!mappedParentId){
        const parentNameCand=resolveLibraryAugmentParentName(rawAug,pk,allRefPacks);
        const normParentName=normPackMatchName(parentNameCand);
        if(normParentName){
          const foundPower=S.powers.find(p=>p&&normPackMatchName(p.name)===normParentName);
          if(foundPower){
            if(getLinkedAugs(foundPower.id).length<3){
              mappedParentId=foundPower.id;
              autoLinkedByName=true;
            }else{
              fullSlotParentName=String(foundPower.name||parentNameCand).trim();
            }
          }
        }
      }else if(getLinkedAugs(mappedParentId).length>=3){
        const fullPw=S.powers.find(p=>p&&p.id===mappedParentId);
        fullSlotParentName=String(fullPw?.name||'').trim();
        mappedParentId='';
      }
      if(dedupeMode==='skipExisting'||dedupeMode==='updateExisting'){
        const existing=findExistingAugment(rawAug,mappedParentId);
        if(existing){
          if(dedupeMode==='skipExisting'){
            summary.skipped++;
            return;
          }
          if(findDuplicatePwEntry(rawAug.name,existing.id)){
            summary.skipped++;
            recordDupName(rawAug.name);
            return;
          }
          const hadParent=Boolean(existing.parentPowerId);
          const finalParentId=existing.parentPowerId||((mappedParentId&&getLinkedAugs(mappedParentId).length<3)?mappedParentId:'');
          if(!hadParent&&!finalParentId&&fullSlotParentName) recordFullSlot(rawAug.name,fullSlotParentName);
          if(!hadParent&&finalParentId&&autoLinkedByName) summary.autoLinkedAugs++;
          const oldAugSecId=String(rawAug.sectionId||'');
          const mappedAugSecId=(oldAugSecId&&secIdMap.has(oldAugSecId))?secIdMap.get(oldAugSecId):targetSectionId;
          const existingFreeSec=(!hadParent&&existing.sectionId&&S.powerSections.some(s=>s.id===existing.sectionId))?existing.sectionId:'';
          const finalAugSecId=finalParentId?'':(mappedAugSecId||existingFreeSec||'');
          const norm=normPwEntry({...clone(rawAug),id:existing.id,parentPowerId:finalParentId,sectionId:finalAugSecId,showManual:false},true);
          norm.templateId=norm.templateId||existing.templateId||'';
          norm.collapsed=existing.collapsed;
          Object.assign(existing,norm);
          trackMeta(existing);
          summary.updatedPw++;
          return;
        }
      }
      if(findDuplicatePwEntry(rawAug.name)){
        summary.skipped++;
        recordDupName(rawAug.name);
        return;
      }
      if(mappedParentId&&getLinkedAugs(mappedParentId).length>=3){
        const fullPw=S.powers.find(p=>p&&p.id===mappedParentId);
        fullSlotParentName=String(fullPw?.name||fullSlotParentName||'').trim();
        mappedParentId='';
      }
      if(!mappedParentId&&fullSlotParentName) recordFullSlot(rawAug.name,fullSlotParentName);
      if(mappedParentId&&autoLinkedByName) summary.autoLinkedAugs++;
      const oldAugSecId=String(rawAug.sectionId||'');
      const finalAugSecId=mappedParentId?'':((oldAugSecId&&secIdMap.has(oldAugSecId))?secIdMap.get(oldAugSecId):targetSectionId);
      const newId=uid();
      const norm=normPwEntry({...clone(rawAug),id:newId,parentPowerId:mappedParentId,sectionId:finalAugSecId,showManual:false},true);
      S.augments.push(norm);
      trackMeta(norm);
      summary.addedAug++;
    });
  });

  sanitizeSecHierarchy(S.powerSections);
  S.artList=[...DEF_MAIN_ARTS];
  S.actionSubList=[...DEF_ACTION_SUBS];
  if(collectedTags.length){S.pwTagList=sortAlpha([...(S.pwTagList||DEF_PW_TAGS),...collectedTags].filter(t=>!isReservedPwTerm(t)));}
  invalidateModsCache();
  if(summary.addedSec||summary.addedPw||summary.addedAug||summary.updatedPw){
    const lbl=packNames.length===1?packNames[0]:`${packNames.length} Pakete`;
    const parts=[];
    if(summary.addedSec) parts.push(`+${summary.addedSec} ${summary.addedSec===1?'Sektion':'Sektionen'}`);
    if(summary.addedPw) parts.push(`+${summary.addedPw} ${summary.addedPw===1?'Kraft':'Kräfte'}`);
    if(summary.addedAug) parts.push(`+${summary.addedAug} ${summary.addedAug===1?'Augment':'Augmente'}${summary.autoLinkedAugs?` (${summary.autoLinkedAugs} automatisch zugeordnet)`:''}`);
    if(summary.updatedPw) parts.push(`${summary.updatedPw} aktualisiert`);
    if(summary.skipped) parts.push(`${summary.skipped} übersprungen`);
    logChron(`Kräfte-Paket importiert ("${lbl}"): ${parts.join(', ')}.`);
  }
  save();
  hooks.renderHeader?.();
  hooks.renderMain?.();
  hooks.syncDiceFromSheet?.();
  if(D.open) hooks.renderDice?.();
  if(!opts.silent){
    if(summary.duplicateNames.length){
      const dupList=summary.duplicateNames.slice(0,6).map(n=>`„${n}“`).join(', ')+(summary.duplicateNames.length>6?` (+${summary.duplicateNames.length-6} weitere)`:'');
      toast(`⚠️ Bereits vorhanden & übersprungen: ${dupList}`,5500);
    }else if(summary.fullSlotNotices.length){
      const fullList=summary.fullSlotNotices.slice(0,3).map(x=>`„${x.augName}“ (Kraft „${x.powerName}“ hat bereits 3/3 Augmente)`).join(', ')+(summary.fullSlotNotices.length>3?` (+${summary.fullSlotNotices.length-3} weitere)`:'');
      toast(`⚠️ Als freies Augment importiert: ${fullList}`,5500);
    }
  }
  return summary;
}

export const getAttrCol=(k,sheet=S)=>{const a=ATTRS.find(x=>x.k===k);return(a&&sheet.attrColors?.[a.g])||'#6aa3d8';};
export const getSecCol=(k,sheet=S)=>{if(String(k||'').startsWith('ex_')){const ex=(sheet.extraSecList||[]).find(x=>'ex_'+x.id===k);return ex?.color||'#34d399';}return k==='cres'?(sheet.customRes?.color||'#c084fc'):(sheet.secColors?.[k]||DEF_SEC_COLS[k]);};
export const getTrBonus=(k,sheet=S)=>TR_DEFS.reduce((s,b)=>s+(sheet.attributes[k].tr[b.i]?b.b:0),0);
export function getTrCost(k,i,sheet=S){
  const def=TR_DEFS[i], a=sheet.attributes[k], ms=a.trSp?.[i], mm=a.trMsp?.[i];
  const sp=(ms!==null&&ms!==undefined)?toInt(ms,def.sp):def.sp;
  const msp=(mm!==null&&mm!==undefined)?toInt(mm,def.msp):def.msp;
  return {sp,msp,defSp:def.sp,defMsp:def.msp,manual:(ms!==null&&ms!==undefined&&sp!==def.sp)||(mm!==null&&mm!==undefined&&msp!==def.msp)};
}
export const getAttrBase=(k,sheet=S)=>{const a=sheet.attributes[k];return toInt(a.vw)+toInt(a.pot)+getTrBonus(k,sheet)+toInt(a.mod);};
export const getAttrTot=(k,M=null,sheet=S)=>{const mods=M||calcActiveMods(sheet);return getAttrBase(k,sheet)+(mods[k]||0);};
export const getLpBase=(sheet=S)=>Math.floor((getAttrBase('KO',sheet)+getAttrBase('ST',sheet))/5)+toInt(sheet.secondary.lpMod);
export const getLpMax=(M=null,sheet=S)=>{const mods=M||calcActiveMods(sheet);return Math.floor((getAttrTot('KO',mods,sheet)+getAttrTot('ST',mods,sheet))/5)+toInt(sheet.secondary.lpMod)+mods.lpMax;};
export const getMlpBase=(sheet=S)=>Math.floor((getAttrBase('AU',sheet)+getAttrBase('WK',sheet))/5)+toInt(sheet.secondary.mlpMod);
export const getMlpMax=(M=null,sheet=S)=>{const mods=M||calcActiveMods(sheet);return Math.floor((getAttrTot('AU',mods,sheet)+getAttrTot('WK',mods,sheet))/5)+toInt(sheet.secondary.mlpMod)+mods.mlpMax;};
export const getLpRegenAuto=(M=null,sheet=S)=>{const mods=M||calcActiveMods(sheet);return Math.max(0,LP_REGEN_BASE+(mods.lpRegen||0));};
export const getMlpRegenAuto=(M=null,sheet=S)=>{const mods=M||calcActiveMods(sheet);return Math.max(0,MLP_REGEN_BASE+(mods.mlpRegen||0));};
export const hasLpRegenOvr=(sheet=S)=>sheet.secondary.lpRegenOvr!==undefined&&sheet.secondary.lpRegenOvr!==null&&String(sheet.secondary.lpRegenOvr).trim()!=='';
export const hasMlpRegenOvr=(sheet=S)=>sheet.secondary.mlpRegenOvr!==undefined&&sheet.secondary.mlpRegenOvr!==null&&String(sheet.secondary.mlpRegenOvr).trim()!=='';
export const getLpRegen=(M=null,sheet=S)=>{const mods=M||calcActiveMods(sheet);return hasLpRegenOvr(sheet)?Math.max(0,toInt(sheet.secondary.lpRegenOvr,getLpRegenAuto(mods,sheet))):getLpRegenAuto(mods,sheet);};
export const getMlpRegen=(M=null,sheet=S)=>{const mods=M||calcActiveMods(sheet);return hasMlpRegenOvr(sheet)?Math.max(0,toInt(sheet.secondary.mlpRegenOvr,getMlpRegenAuto(mods,sheet))):getMlpRegenAuto(mods,sheet);};
export function performSimpleRest(){
  const M=calcActiveMods(), apInfo=getEffectivePoolCap('ap',M), mapInfo=getEffectivePoolCap('map',M);
  const apCap=apInfo.effMax, mapCap=mapInfo.effMax;
  if(toInt(S.secondary.apCurrent,apCap)<apCap) S.secondary.apCurrent=apCap;
  if(toInt(S.secondary.mapCurrent,mapCap)<mapCap) S.secondary.mapCurrent=mapCap;
  const resNotes=[];
  if(apInfo.reserved>0) resNotes.push(`−${apInfo.reserved} AP`);
  if(mapInfo.reserved>0) resNotes.push(`−${mapInfo.reserved} mAP`);
  const resTxt=resNotes.length?` (🔒 reserviert: ${resNotes.join(', ')})`:'';
  logChron(`🔥 Pause: AP (${S.secondary.apCurrent}/${apCap}${apInfo.reserved?` von ${apInfo.fullMax}`:''}) und mAP (${S.secondary.mapCurrent}/${mapCap}${mapInfo.reserved?` von ${mapInfo.fullMax}`:''}) wiederhergestellt${resTxt}.`);
  save(); hooks.renderHeader?.(); hooks.renderMain?.();
  toast(`🔥 Pause: AP (${S.secondary.apCurrent}) & mAP (${S.secondary.mapCurrent}) wiederhergestellt${resTxt}!`);
}
export function performFullRest(){
  const M=calcActiveMods(), lpReg=getLpRegen(M), mlpReg=getMlpRegen(M);
  const lpHeal=lpReg*2, mlpHeal=mlpReg*2;
  const lpInfo=getEffectivePoolCap('lp',M), mlpInfo=getEffectivePoolCap('mlp',M), apInfo=getEffectivePoolCap('ap',M), mapInfo=getEffectivePoolCap('map',M);
  const lpCap=lpInfo.effMax, mlpCap=mlpInfo.effMax, apCap=apInfo.effMax, mapCap=mapInfo.effMax;
  const oldLp=toInt(S.secondary.lpCurrent,lpCap), oldMlp=toInt(S.secondary.mlpCurrent,mlpCap);
  S.secondary.lpCurrent=oldLp<lpCap?Math.min(lpCap,oldLp+lpHeal):oldLp;
  S.secondary.mlpCurrent=oldMlp<mlpCap?Math.min(mlpCap,oldMlp+mlpHeal):oldMlp;
  if(toInt(S.secondary.apCurrent,apCap)<apCap) S.secondary.apCurrent=apCap;
  if(toInt(S.secondary.mapCurrent,mapCap)<mapCap) S.secondary.mapCurrent=mapCap;
  const resNotes=[];
  if(lpInfo.reserved>0) resNotes.push(`−${lpInfo.reserved} LP`);
  if(mlpInfo.reserved>0) resNotes.push(`−${mlpInfo.reserved} mLP`);
  if(apInfo.reserved>0) resNotes.push(`−${apInfo.reserved} AP`);
  if(mapInfo.reserved>0) resNotes.push(`−${mapInfo.reserved} mAP`);
  const resTxt=resNotes.length?` (🔒 blockiert: ${resNotes.join(', ')})`:'';
  logChron(`🌙 Erholsame Rast: +${lpHeal} LP (2×${lpReg} → ${S.secondary.lpCurrent}/${lpCap}${lpInfo.reserved?` von ${lpInfo.fullMax}`:''}), +${mlpHeal} mLP (2×${mlpReg} → ${S.secondary.mlpCurrent}/${mlpCap}${mlpInfo.reserved?` von ${mlpInfo.fullMax}`:''}) sowie AP (${S.secondary.apCurrent}/${apCap}) & mAP (${S.secondary.mapCurrent}/${mapCap}) wiederhergestellt${resTxt}.`);
  save(); hooks.renderHeader?.(); hooks.renderMain?.();
  toast(`🌙 Erholsame Rast: LP (${S.secondary.lpCurrent}/${lpCap}), mLP (${S.secondary.mlpCurrent}/${mlpCap}) & AP/mAP wiederhergestellt${resTxt}!`);
}
export const getIniBase=(sheet=S)=>getAttrBase('WA',sheet)-getAttrBase('IN',sheet)+toInt(sheet.secondary.iniMod);
export const getIniTot=(M=null,sheet=S)=>{const mods=M||calcActiveMods(sheet);return getAttrTot('WA',mods,sheet)-getAttrTot('IN',mods,sheet)+toInt(sheet.secondary.iniMod)+mods.ini;};
export const getApBase=(sheet=S)=>toInt(sheet.secondary.apMax,3);
export const getApMax=(M=null,sheet=S)=>{const mods=M||calcActiveMods(sheet);return getApBase(sheet)+mods.apMax;};
export const getMapBase=(sheet=S)=>toInt(sheet.secondary.mapMax,3);
export const getMapMax=(M=null,sheet=S)=>{const mods=M||calcActiveMods(sheet);return getMapBase(sheet)+mods.mapMax;};
export const getCresBase=(sheet=S)=>toInt(sheet.customRes.max,3);
export const getCresMax=(M=null,sheet=S)=>{const mods=M||calcActiveMods(sheet);return getCresBase(sheet)+mods.cresMax;};
export const getExtraSecBase=ex=>toInt(ex?.max,3);
export const getExtraSecMax=(ex,M=null,sheet=S)=>{const mods=M||calcActiveMods(sheet);return getExtraSecBase(ex)+(mods.extraSec?.[ex?.id]||0);};
export const getBstAuto=(sheet=S)=>Math.max(0,Math.floor(toFlt(sheet.movements?.[0]?.base,5)/5));
export const hasBstOvr=(sheet=S)=>sheet.bstOvr!==undefined&&sheet.bstOvr!==null&&String(sheet.bstOvr).trim()!=='';
export const getBstBase=(sheet=S)=>hasBstOvr(sheet)?toInt(sheet.bstOvr,getBstAuto(sheet)):getBstAuto(sheet);
export const getEffBst=(M=null,sheet=S)=>{const mods=M||calcActiveMods(sheet);return getBstBase(sheet)+(mods.bst||0);};
export function withPoolSync(fn){
  const M1=calcActiveMods(),oL=getLpMax(M1),oM=getMlpMax(M1),oA=getApMax(M1),oMA=getMapMax(M1),oC=getCresMax(M1);
  const oLc=getEffectivePoolCap('lp',M1).effMax,oMc=getEffectivePoolCap('mlp',M1).effMax,oAc=getEffectivePoolCap('ap',M1).effMax,oMAc=getEffectivePoolCap('map',M1).effMax,oCc=getEffectivePoolCap('cres',M1).effMax;
  const oStLp=M1.statusLp||0,oStMlp=M1.statusMlp||0;
  const oEx={}, oExc={}; (S.extraSecList||[]).forEach(x=>{oEx[x.id]=getExtraSecMax(x,M1);oExc[x.id]=getEffectivePoolCap('ex_'+x.id,M1).effMax;});
  fn();
  invalidateModsCache(S);
  const M2=calcActiveMods();
  const capLp=getEffectivePoolCap('lp',M2), capMlp=getEffectivePoolCap('mlp',M2), capAp=getEffectivePoolCap('ap',M2), capMap=getEffectivePoolCap('map',M2), capCres=getEffectivePoolCap('cres',M2);
  const dStLp=(M2.statusLp||0)-oStLp, dStMlp=(M2.statusMlp||0)-oStMlp;
  if(dStLp!==0){
    const nxt=toInt(S.secondary.lpCurrent)+dStLp;
    S.secondary.lpCurrent=capLp.reserved>0?Math.min(nxt,capLp.effMax):nxt;
  }else if(S.secondary.lpCurrent===oL||S.secondary.lpCurrent===oLc){
    S.secondary.lpCurrent=capLp.reserved>0?capLp.effMax:getLpMax(M2);
  }
  if(dStMlp!==0){
    const nxt=toInt(S.secondary.mlpCurrent)+dStMlp;
    S.secondary.mlpCurrent=capMlp.reserved>0?Math.min(nxt,capMlp.effMax):nxt;
  }else if(S.secondary.mlpCurrent===oM||S.secondary.mlpCurrent===oMc){
    S.secondary.mlpCurrent=capMlp.reserved>0?capMlp.effMax:getMlpMax(M2);
  }
  if(S.secondary.apCurrent===oA||S.secondary.apCurrent===oAc) S.secondary.apCurrent=capAp.reserved>0?capAp.effMax:getApMax(M2);
  if(S.secondary.mapCurrent===oMA||S.secondary.mapCurrent===oMAc) S.secondary.mapCurrent=capMap.reserved>0?capMap.effMax:getMapMax(M2);
  if(S.customRes.current===oC||S.customRes.current===oCc) S.customRes.current=capCres.reserved>0?capCres.effMax:getCresMax(M2);
  (S.extraSecList||[]).forEach(x=>{
    const capEx=getEffectivePoolCap('ex_'+x.id,M2);
    if(x.current===oEx[x.id]||x.current===oExc[x.id]) x.current=capEx.reserved>0?capEx.effMax:getExtraSecMax(x,M2);
  });
}
export const getSkAutoBonus=r=>SK_RANKS[r]?SK_RANKS[r].b:0;
export const hasSkBonusOvr=sk=>Boolean(sk&&sk.bonusOvr!==undefined&&sk.bonusOvr!==null&&String(sk.bonusOvr).trim()!=='');
export const getSkBonus=skOrRank=>{
  if(skOrRank&&typeof skOrRank==='object'){
    const auto=getSkAutoBonus(skOrRank.rank);
    return hasSkBonusOvr(skOrRank)?toInt(skOrRank.bonusOvr,auto):auto;
  }
  return getSkAutoBonus(skOrRank);
};
export const findPwItem=(kind,id,sheet=S)=>(kind==='augment'?(sheet.augments||[]):(sheet.powers||[])).find(x=>x.id===id);
export const findEqItem=(kind,id,sheet=S)=>{const m={weapon:sheet.weapons,ammo:sheet.ammos,armor:sheet.armors,inv:sheet.inventory}[kind];return (m||[]).find(x=>x.id===id);};
export const getLinkedAugs=(pid,sheet=S)=>(sheet.augments||[]).filter(a=>a.parentPowerId===pid);
export const getUnlinkedAugs=(sheet=S)=>(sheet.augments||[]).filter(a=>!a.parentPowerId||!(sheet.powers||[]).some(p=>p.id===a.parentPowerId));
export const getValidPwSecId=(secId,sheet=S)=>(secId&&(sheet.powerSections||[]).some(s=>s.id===secId))?String(secId):'';
export const getUnlinkedAugsInSec=(secId,sheet=S)=>getUnlinkedAugs(sheet).filter(a=>getValidPwSecId(a.sectionId,sheet)===secId);
export const getRootUnlinkedAugs=(sheet=S)=>getUnlinkedAugs(sheet).filter(a=>!getValidPwSecId(a.sectionId,sheet));
export function linkAugToPower(ag,powerId){
  if(!ag) return;
  ag.parentPowerId=String(powerId||'');
  ag.sectionId='';
}
export function unlinkAugFromPower(ag,sheet=S){
  if(!ag) return;
  if(ag.parentPowerId){
    const prevPar=(sheet.powers||[]).find(p=>p.id===ag.parentPowerId);
    ag.sectionId=getValidPwSecId(prevPar?.sectionId,sheet);
    ag.parentPowerId='';
  }
}

export function calcPwCost(it){const t=PW_TIERS[it.tier]||PW_TIERS.marginal;if(it.tier==='basisaktion'&&!it.manualCost)return {sp:0,msp:0};return it.manualCost?{sp:toInt(it.sp,t.sp),msp:toInt(it.msp,t.msp)}:{sp:t.sp,msp:t.msp};}
export function getGroupMspInfo(kind,it,sheet=S){
  const grp=kind==='power'?[it,...getLinkedAugs(it.id,sheet)]:(it.parentPowerId&&(sheet.powers||[]).find(p=>p.id===it.parentPowerId)?[(sheet.powers||[]).find(p=>p.id===it.parentPowerId),...getLinkedAugs(it.parentPowerId,sheet)]:[it]);
  const otherHasMsp=grp.some(m=>m.id!==it.id&&(m.tier==='grandios'||calcPwCost(m).msp>=1));
  const totalMsp=grp.reduce((s,m)=>s+calcPwCost(m).msp,0);
  return {otherHasMsp,totalMsp,overLimit:totalMsp>1};
}
export function calcSkCost(sk){
  const auto=calcAutoSkCost(sk.category,sk.rank);
  if(sk.manualCost) return {sp:toInt(sk.customSp,0),msp:toInt(sk.customMsp,0),autoSp:auto.sp,autoMsp:auto.msp,manual:true};
  return {sp:auto.sp,msp:auto.msp,autoSp:auto.sp,autoMsp:auto.msp,manual:false};
}
export function calcProg(M=null,sheet=S){
  const mods=M||calcActiveMods(sheet);
  const spMod=mods.spMod||0,spModSrc=fmtSrcLines(mods,'spMod');
  const lvl=Math.max(1,toInt(sheet.progression.level,1)),baseSp=lvl*5,baseMsp=Math.floor(lvl/10),bonusSp=toInt(sheet.progression.bonusSp),totSp=baseSp+bonusSp+spMod,totMsp=baseMsp+toInt(sheet.progression.bonusMsp);
  let trSp=0,trMsp=0,skSp=0,skMsp=0,pwSp=0,pwMsp=0;
  ATTRS.forEach(a=>TR_DEFS.forEach(b=>{if(sheet.attributes[a.k].tr[b.i]){const tc=getTrCost(a.k,b.i,sheet);trSp+=tc.sp;trMsp+=tc.msp;}}));
  (sheet.skills||[]).forEach(sk=>{const c=calcSkCost(sk);skSp+=c.sp;skMsp+=c.msp;});
  [...(sheet.powers||[]),...(sheet.augments||[])].forEach(it=>{const c=calcPwCost(it);pwSp+=c.sp;pwMsp+=c.msp;});
  const spSpent=trSp+skSp+pwSp,mspSpent=trMsp+skMsp+pwMsp;
  return {lvl,baseSp,baseMsp,bonusSp,spMod,spModSrc,totSp,totMsp,trSp,trMsp,skSp,skMsp,pwSp,pwMsp,spSpent,mspSpent,spRem:totSp-spSpent,mspRem:totMsp-mspSpent};
}

export function getWeaponRollMeta(w,M=null,sheet=S){
  const mods=M||calcActiveMods(sheet);
  const hasMassiv=isWeaponMassiv(w);
  const attrKey=hasMassiv?'ST':(ATTRS.some(a=>a.k===w?.wAttr)?w.wAttr:'PR');
  const attrVal=getAttrTot(attrKey,mods,sheet);
  const sk=w?.skillId?(sheet.skills||[]).find(s=>s.id===w.skillId):null;
  const skBonus=sk?getSkBonus(sk):0;
  const pool=attrVal+skBonus;
  const hasBlock=Array.isArray(w?.tags)&&w.tags.some(t=>/^blockf[äa]hig\b/i.test(String(t?.name||'').trim()));
  return {attrKey,attrVal,sk,skBonus,pool,hasMassiv,hasBlock};
}

export function getPwSecOptionsFlat(sheet=S){
  const out=[], visited=new Set();
  const walk=(parentId,depth)=>{
    (sheet.powerSections||[]).filter(s=>s&&(s.parentSectionId||'')===parentId).forEach(s=>{
      if(visited.has(s.id)) return;
      visited.add(s.id);
      out.push({id:s.id,name:String(s.name||'Sektion'),depth});
      walk(s.id,depth+1);
    });
  };
  walk('',0);
  (sheet.powerSections||[]).forEach(s=>{if(s&&!visited.has(s.id))out.push({id:s.id,name:String(s.name||'Sektion'),depth:0});});
  return out;
}
