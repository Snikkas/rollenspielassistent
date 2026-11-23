export const $=id=>document.getElementById(id), uid=()=>'u'+Date.now().toString(36)+Math.random().toString(36).slice(2,6);
export const stamp=()=>new Date().toLocaleString('de-DE',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'});
export const esc=s=>String(s??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
export const clone=v=>typeof structuredClone==='function'?structuredClone(v):JSON.parse(JSON.stringify(v));
export const toInt=(v,fb=0)=>{const n=parseInt(String(v??'').trim(),10);return Number.isNaN(n)?fb:n;};
export const toFlt=(v,fb=0)=>{const n=parseFloat(String(v??'').replace(',','.').trim());return Number.isNaN(n)?fb:n;};
export const fmtN=n=>String(Math.round(n*100)/100), fmtSign=n=>n>0?`+${n}`:`${n}`;
export const isHex=s=>/^#[0-9a-fA-F]{6}$/.test(String(s||'').trim());
export const sortAlpha=arr=>[...new Set(arr.map(x=>String(x).trim()).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'de'));
export const stripHtml=s=>String(s??'').replace(/<br\s*\/?>/gi,'\n').replace(/<\/(div|p|li|ul|ol|h1|h2|h3)>/gi,'\n').replace(/<[^>]*>/g,'').replace(/&nbsp;/g,' ').replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"');
export const cleanInlineStyles=s=>String(s??'').replace(/<b\b[^>]*(?:font-weight\s*:\s*(?:normal|400)|docs-internal-guid)[^>]*>([\s\S]*?)<\/b>/gi,'$1').replace(/\s+style\s*=\s*"[^"]*"/gi,'').replace(/\s+style\s*=\s*'[^']*'/gi,'').replace(/\s+color\s*=\s*"[^"]*"/gi,'').replace(/\s+bgcolor\s*=\s*"[^"]*"/gi,'').replace(/<\/?font[^>]*>/gi,'');
export const toRtfHtml=s=>{const str=String(s??'');if(!str)return '';if(/<(b|strong|i|em|u|br|div|span|ul|ol|li|p|font|h1|h2|h3)\b/i.test(str))return cleanInlineStyles(str);return esc(str).replace(/\n/g,'<br>');};
export const simpleHash=str=>{let h=2166136261;const s=String(str||'');for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}return (h>>>0).toString(36);};
export const fastHash2=str=>{let h=5381;const s=String(str||'');for(let i=0;i<s.length;i++){h=((h<<5)+h)^s.charCodeAt(i);}return (h>>>0).toString(36);};
export const cardColorStyle=it=>{const p=[];if(isHex(it?.bgColor)){p.push(`background:color-mix(in srgb,${it.bgColor} 34%,var(--surf))`);p.push(`border-color:color-mix(in srgb,${it.bgColor} 72%,var(--bdr))`);}if(isHex(it?.color))p.push(`border-left:4px solid ${it.color}`);return p.length?`style="${p.join(';')}"`:'';};
export const sortTagDefs=arr=>[...(arr||[])].filter(t=>t&&String(t.name||'').trim()).map(t=>({name:String(t.name).trim(),desc:String(t.desc||'').trim()})).sort((a,b)=>a.name.localeCompare(b.name,'de'));
export const hasTagX=name=>/\(\s*X\s*\)/i.test(String(name||''));
export const fmtTagLabel=(name,x)=>hasTagX(name)?String(name).replace(/\(\s*X\s*\)/i,`(${x??1})`):String(name||'');
export const canSetSecParent=(secList,secId,parentId)=>{
  if(!parentId) return true;
  if(parentId===secId) return false;
  if(!(secList||[]).some(s=>s.id===parentId)) return false;
  const visited=new Set([secId]);
  let cur=parentId;
  while(cur){
    if(visited.has(cur)) return false;
    visited.add(cur);
    const pObj=(secList||[]).find(s=>s.id===cur);
    cur=pObj?.parentSectionId||'';
  }
  return true;
};
export const sanitizeSecHierarchy=secList=>{
  (secList||[]).forEach(s=>{
    s.parentSectionId=String(s.parentSectionId||'');
    if(s.parentSectionId&&!canSetSecParent(secList,s.id,s.parentSectionId)) s.parentSectionId='';
  });
};
export const isDynWordChar=ch=>/[a-zA-Z0-9äöüÄÖÜß_]/.test(ch||'');
