export const STORE_KEY='scherbensturm_v20', OLD_KEYS=Array.from({length:15},(_,i)=>'scherbensturm_v'+(19-i));
export const DEF_WEAPON_TAGS=[
  {name:'Aerodynamisch',desc:'Beim Werfen dieser Waffe verursachst du nicht abgeschwächten Schaden und hast keinen Nachteil auf Trefferwurf, der durch das Waffenwerfen normalerweise anfällt.'},
  {name:'Ausbalanciert (X)',desc:'Paradeversuche mit der Waffe haben X Vorteile.'},
  {name:'Blockfähig (X)',desc:'Diese Waffe kann blocken und hat dabei X Nachteil.'},
  {name:'Durchschlag (X)',desc:'Wird bei erfolgreichem Blocken gegen diese Waffe der Schaden vollständig negiert, so wird dennoch X Schaden verursacht.'},
  {name:'Einhändig',desc:'Für das Führen und Bedienen dieser Waffe wird nur eine Hand benötigt. (Zum Nachladen jedoch zwei.)'},
  {name:'Handlich',desc:'Diese Waffe kann im Handgemenge verwendet werden.'},
  {name:'Klobig (X)',desc:'X Nachteile auf Trefferwürfe bei Schüssen im verwickelten Nahkampf, beim Reiten oder in anderweitig eingeschränkten Raumverhältnissen.'},
  {name:'Langsam (X)',desc:'Abwehrversuche gegen diese Waffe haben X Vorteile.'},
  {name:'Leise (X)',desc:'Tests, um dich zu entdecken, auf Grundlage des Geräusches des Angriffs, sind um X Nachteile erschwert.'},
  {name:'Massiv',desc:'Du benutzt [ST] für Trefferwürfe anstelle von [PR].'},
  {name:'Mehrfachschuss (X)',desc:'Bei einem Treffer mit dieser Fernkampfwaffe wird alle X EG +1 zusätzlicher Schaden addiert (z. B. bei 4 EG mit Mehrfachschuss (2): +2 Bonusschaden, da 2×2 EG hineinpassen).'},
  {name:'Mobiler Schütze (X)',desc:'Würden Nachteile durch das Angreifen im Nahkampf oder beim Reiten anfallen, werden diese um X verringert.'},
  {name:'Nicht parierbar',desc:'Erfolgreiches Parieren gegen diese Waffe wird wie Blocken mit einem blockfähigen Gegenstand behandelt. (ggf. Rüstungsabzug kommt dann bei Trefferzonen)'},
  {name:'Reichweite (X)',desc:'Deine Nahkampfreichweite ist um X m erhöht.'},
  {name:'Schnell (X)',desc:'Gegnerische Abwehrversuche gegen die Waffe sind um X Nachteil erschwert.'},
  {name:'Schwere Deckung (X)',desc:'Trefferwürfe mit der Waffe aus Deckung heraus sind um X Nachteile erschwert.'},
  {name:'Tödlich (X)',desc:'Die kritische Ziffer ist um X erhöht.'},
  {name:'Überschlagend (X)',desc:'Parade- und Blockentests haben gegen diese Waffe X Nachteile.'},
  {name:'Unhandlich (X)',desc:'Diese Waffe hat X Nachteile auf Paradeversuche.'},
  {name:'Verborgen (X)',desc:'Auf einen Test zum Verstecken oder Verbergen der Waffe erhältst du 1 Vorteil (bzw. X Vorteile).'},
  {name:'Verhaken (X)',desc:'Paradeversuche gegen diese Waffe haben X Nachteil.'},
  {name:'Verheerend (X)',desc:'Bei einem Treffer mit mehr als 5 EG oder mehr verursacht diese Waffe +X Schaden.'},
  {name:'Vielseitig (X)',desc:'Kann sowohl einhändig als auch zweihändig geführt werden. (Zweihändiges Führen erhöht den verursachten Stichschaden um X.)'},
  {name:'Weitereichende Klinge',desc:'Bei schneidenden Angriffen ohne „Zweiter Griff“ attackierst du immer in einem 45° Winkel (meistens sind also 2-3 Felder betroffen).'},
  {name:'Wuchtklinge',desc:'Bei einem Treffer mit der Waffe wird Einschlag-Schnittschaden verursacht.'},
  {name:'Beidhändig',desc:'Du kannst als Schnellaktion die Waffe in der Mitte auseinander drehen, um in jeder Hand einen Teil der Waffe zu führen. Dabei verlierst du „Reichweite (1)“.'},
  {name:'Schwungvoll (X)',desc:'+X auf das Würfelergebnis. (Nach einem Würfelwurf wird das Ergebnis der geworfenen Zahl um +X erhöht.)'},
  {name:'Wuchtpieke',desc:'Bei einem Treffer mit der Waffe wird Einschlag-Stichschaden verursacht.'},
  {name:'Zweiter Griff',desc:'Stoßende Attacken mit der Waffe ignorieren die Reichweite(1)- und Langsam(1)-Eigenschaften.'}
].sort((a,b)=>a.name.localeCompare(b.name,'de'));
export const DEF_ARMOR_TAGS=[
  {name:'Überwurf',desc:'Diese Rüstung kann üblicherweise mit anderen Rüstungsteilen kombiniert werden, die dieselbe Körperzone abdecken.'},
  {name:'Warm',desc:'+1 Vorteil bei Tests gegen Kälte.'},
  {name:'Wasserundurchlässig',desc:'Kann effektiv vor Regen schützen.'}
].sort((a,b)=>a.name.localeCompare(b.name,'de'));
export const ATTRS=[{k:'ST',n:'Stärke',g:'ST_KO'},{k:'KO',n:'Konstitution',g:'ST_KO'},{k:'PR',n:'Präzision',g:'PR_GW'},{k:'GW',n:'Gewandtheit',g:'PR_GW'},{k:'WA',n:'Wahrnehmung',g:'WA_IN'},{k:'IN',n:'Intelligenz',g:'WA_IN'},{k:'AU',n:'Ausdruck',g:'AU_WK'},{k:'WK',n:'Willenskraft',g:'AU_WK'}];
export const DEF_ATTR_COLS={ST_KO:'#d97777',PR_GW:'#6eb888',WA_IN:'#6aa3d8',AU_WK:'#a58ad6'};
export const ATTR_GROUPS=[{k:'ST_KO',l:'ST & KO (Körper)'},{k:'PR_GW',l:'PR & GW (Geschick)'},{k:'WA_IN',l:'WA & IN (Verstand)'},{k:'AU_WK',l:'AU & WK (Geist)'}];
export const STATUS_DEFS=[
  {k:'gestaerkt',name:'Gestärkt',isPos:true,group:'ST_KO',attrs:['ST','KO'],statKey:'lp',statLbl:'akt. & max. LP',baseStat:2,baseAdv:1,hasIniChoice:false,desc:'Deine aktuellen und maximalen LP sind um 2 pro Stapel erhöht. Du hast +1 Vorteil pro Stapel auf alle ST- und KO-Tests.'},
  {k:'geschwaecht',name:'Geschwächt',isPos:false,group:'ST_KO',attrs:['ST','KO'],statKey:'lp',statLbl:'akt. & max. LP',baseStat:-2,baseAdv:1,hasIniChoice:false,desc:'Deine aktuellen und maximalen LP sind um 2 pro Stapel verringert. Du hast +1 Nachteil pro Stapel auf alle ST- und KO-Tests.'},
  {k:'beweglich',name:'Beweglich',isPos:true,group:'PR_GW',attrs:['PR','GW'],statKey:'bst',statLbl:'BSt',baseStat:1,baseAdv:1,hasIniChoice:false,desc:'Deine Bewegungsstufe (BSt) ist um +1 pro Stapel erhöht. Du hast +1 Vorteil pro Stapel auf alle PR- und GW-Tests.'},
  {k:'eingeschraenkt',name:'Eingeschränkt',isPos:false,group:'PR_GW',attrs:['PR','GW'],statKey:'bst',statLbl:'BSt',baseStat:-1,baseAdv:1,hasIniChoice:false,desc:'Deine Bewegungsstufe (BSt) ist um 1 pro Stapel verringert. Du hast +1 Nachteil pro Stapel auf alle PR- und GW-Tests.'},
  {k:'konzentriert',name:'Konzentriert',isPos:true,group:'WA_IN',attrs:['WA','IN'],statKey:'ini',statLbl:'Initiative',baseStat:10,baseAdv:1,hasIniChoice:true,desc:'Du hast +10 oder −10 Initiative nach eigener Wahl beim Aktivieren (pro Stapel). Du hast +1 Vorteil pro Stapel auf alle WA- und IN-Tests.'},
  {k:'abgelenkt',name:'Abgelenkt',isPos:false,group:'WA_IN',attrs:['WA','IN'],statKey:'ini',statLbl:'Initiative',baseStat:10,baseAdv:1,hasIniChoice:true,desc:'Du hast +10 oder −10 Initiative nach eigener Wahl beim Aktivieren (pro Stapel). Du hast +1 Nachteil pro Stapel auf alle WA- und IN-Tests.'},
  {k:'entschlossen',name:'Entschlossen',isPos:true,group:'AU_WK',attrs:['AU','WK'],statKey:'mlp',statLbl:'akt. & max. mLP',baseStat:2,baseAdv:1,hasIniChoice:false,desc:'Deine aktuellen und maximalen mLP sind um 2 pro Stapel erhöht. Du hast +1 Vorteil pro Stapel auf alle AU- und WK-Tests.'},
  {k:'verunsichert',name:'Verunsichert',isPos:false,group:'AU_WK',attrs:['AU','WK'],statKey:'mlp',statLbl:'akt. & max. mLP',baseStat:-2,baseAdv:1,hasIniChoice:false,desc:'Deine aktuellen und maximalen mLP sind um 2 pro Stapel verringert. Du hast +1 Nachteil pro Stapel auf alle AU- und WK-Tests.'}
];
export const SYSTEM_ICON_DEFS=[
  {key:'phase_ebbe',group:'phase',groupLabel:'Kampfphasen',label:'Ebbephase'},
  {key:'phase_flut',group:'phase',groupLabel:'Kampfphasen',label:'Flutphase'},
  ...STATUS_DEFS.map(d=>({key:`status_${d.k}`,group:'status',groupLabel:'Statuseffekte',label:d.name,statusKey:d.k,isPos:Boolean(d.isPos)}))
];
export const DEFAULT_SYSTEM_ICON_SVGS={
  phase_ebbe:(cls)=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" class="${cls} shrink-0 pointer-events-none"><path d="M16.5 4.2a5 5 0 1 0 3.3 7.6 4 4 0 0 1-3.3-7.6z" fill="currentColor" fill-opacity=".24"/><path d="M2.5 15.5c2 0 2.5-1.4 4.5-1.4s2.5 1.4 4.5 1.4 2.5-1.4 4.5-1.4 2.5 1.4 5.5 1.4"/><path d="M4 19.5c2 0 2.5-1.2 4.5-1.2s2.5 1.2 4.5 1.2 2.5-1.2 4.5-1.2 1.8.8 2.5 1.2" opacity=".7"/></svg>`,
  phase_flut:(cls)=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" class="${cls} shrink-0 pointer-events-none"><path d="M2.5 16.5c2.2-5 6.4-9.5 12-9.5 2.7 0 4.5 1.3 4.5 3.3 0 1.8-1.4 2.8-2.9 2.8-1.4 0-2.3-.9-2.1-2.2" fill="currentColor" fill-opacity=".2"/><path d="M2.5 16.5c2.3 0 3.2-1.8 5.5-1.8s3.2 1.8 5.5 1.8 3.2-1.8 5.5-1.8c1 0 1.8.4 2.5 1"/><path d="M4.5 20c2.2 0 3-1.4 5-1.4s2.8 1.4 5 1.4 2.8-1.4 5-1.4" opacity=".75"/><path d="M18.5 3.5l.6 1.5 1.4.6-1.4.6-.6 1.5-.6-1.5-1.4-.6 1.4-.6z" fill="currentColor" stroke="none"/></svg>`,
  status_gestaerkt:(cls)=>`<svg viewBox="0 0 24 24" fill="none" stroke="#34d399" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" class="${cls} shrink-0 pointer-events-none"><path d="M12 3l7 3v5.5c0 4.5-3 7.8-7 9.5-4-1.7-7-5-7-9.5V6l7-3z" fill="#34d399" fill-opacity=".18"/><path d="M9 13l3-3 3 3M12 10v6"/></svg>`,
  status_geschwaecht:(cls)=>`<svg viewBox="0 0 24 24" fill="none" stroke="#fb7185" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" class="${cls} shrink-0 pointer-events-none"><path d="M12 3l7 3v5.5c0 4.5-3 7.8-7 9.5-4-1.7-7-5-7-9.5V6l7-3z" fill="#fb7185" fill-opacity=".16"/><path d="M13 6l-2.5 4.5H14L11 16"/></svg>`,
  status_beweglich:(cls)=>`<svg viewBox="0 0 24 24" fill="none" stroke="#34d399" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" class="${cls} shrink-0 pointer-events-none"><path d="M13.5 2.5L5.5 13h6l-1 8.5L18.5 11h-6l1-8.5z" fill="#34d399" fill-opacity=".2"/></svg>`,
  status_eingeschraenkt:(cls)=>`<svg viewBox="0 0 24 24" fill="none" stroke="#fb7185" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" class="${cls} shrink-0 pointer-events-none"><rect x="3.5" y="9.5" width="7" height="5" rx="2.5" fill="#fb7185" fill-opacity=".16"/><rect x="13.5" y="9.5" width="7" height="5" rx="2.5" fill="#fb7185" fill-opacity=".16"/><path d="M9 12h6M5 5l14 14"/></svg>`,
  status_konzentriert:(cls)=>`<svg viewBox="0 0 24 24" fill="none" stroke="#34d399" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" class="${cls} shrink-0 pointer-events-none"><path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6z" fill="#34d399" fill-opacity=".16"/><circle cx="12" cy="12" r="2.8" fill="#34d399"/></svg>`,
  status_abgelenkt:(cls)=>`<svg viewBox="0 0 24 24" fill="none" stroke="#fb7185" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" class="${cls} shrink-0 pointer-events-none"><path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6z" fill="#fb7185" fill-opacity=".14"/><circle cx="12" cy="12" r="2.3"/><path d="M4 4l16 16"/></svg>`,
  status_entschlossen:(cls)=>`<svg viewBox="0 0 24 24" fill="none" stroke="#34d399" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" class="${cls} shrink-0 pointer-events-none"><path d="M3.5 17.5L5 7.5l4.5 4 2.5-5.5 2.5 5.5 4.5-4 1.5 10z" fill="#34d399" fill-opacity=".2"/><path d="M4.5 20h15"/></svg>`,
  status_verunsichert:(cls)=>`<svg viewBox="0 0 24 24" fill="none" stroke="#fb7185" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" class="${cls} shrink-0 pointer-events-none"><path d="M3.5 17.5L5 8l4 3.5L12 6l3 5.5L19 8l1.5 9.5z" fill="#fb7185" fill-opacity=".16"/><path d="M12 10.5v3.5M12 16.6h.01M4.5 20h15"/></svg>`
};
export const DEF_SEC_COLS={lp:'#f43f5e',ini:'#f59e0b',mlp:'#818cf8',ap:'#fde047',map:'#38bdf8'};
export const SEC_META={lp:'LP • Lebenspunkte',ini:'Ini • Initiative',mlp:'mLP • Mentale LP',ap:'AP • Ausdauerpunkte',map:'mAP • Mentale Ausdauerpunkte',cres:'Benutzerdefinierte Ressource'};
export const DEF_MAIN_ARTS=['Freiaktion','Schnellaktion','Grundaktion','Einsatz'];
export const DEF_ACTION_SUBS=['Kraftaktion','Reaktion','Sofortaktion'];
export const DEF_PW_TAGS=['Abwehr','Angriff','Berührungsangriff','Bewegung','Eigenschaft','Unterstützung','Wurfmanipulation','Zauber'];
export const PW_ACTION_TIPS={
  'Freiaktion':'Du kannst während deines Zuges beliebig viele Freiaktionen einsetzen.',
  'Schnellaktion':'Deine erste Schnellaktion pro Phase ist eine Freiaktion, alle weiteren deiner Schnellaktionen sind Grundaktionen.',
  'Grundaktion':'Du kannst pro Phase nur eine Grundaktion einsetzen.',
  'Einsatz':'Diese Aktion braucht so viel Zeit, dass sie üblicherweise nur außerhalb des Kampfes eingesetzt werden kann.',
  'Eigenschaft':'Dies ist eine passive Befähigung.',
  'Kraftaktion':'Diese Aktion kann nur innerhalb einer Flutphase eingesetzt werden. Tust du dies, so ist deine nächste Phase eine Ebbephase.',
  'Reaktion':'Diese Aktion kann unter bestimmten Umständen außerhalb deines Zuges eingesetzt werden, um auf eine andere Aktion zu reagieren.',
  'Sofortaktion':'Du kannst diese Aktion jederzeit - auch als Reaktion auf eine beliebige Aktion - einsetzen, solange du nicht handlungsunfähig bist.'
};
export const DEF_USERES=['ap','map'];
export const TR_DEFS=[{i:0,b:5,sp:2,msp:0},{i:1,b:5,sp:2,msp:0},{i:2,b:5,sp:3,msp:0},{i:3,b:5,sp:3,msp:0},{i:4,b:10,sp:5,msp:1}];
export const SK_CATS={marginal:{l:'Marginal',s:[0,1,1,2,2]},fundamental:{l:'Fundamental',s:[0,2,2,3,3]},grandios:{l:'Grandios',s:[0,3,2,3,4]}};
export const SK_RANKS=[{r:0,n:'Ungelernt',b:0},{r:1,n:'Novize',b:10},{r:2,n:'Geselle',b:15},{r:3,n:'Experte',b:20},{r:4,n:'Meister',b:30}];
export const SK_CAT_SHORT={marginal:'Marg.',fundamental:'Fund.',grandios:'Grand.'};
export const PW_TIERS={basisaktion:{l:'Basisaktion',full:'Basisaktion: 0 SP',sp:0,msp:0},marginal:{l:'Marginal (Options)',full:'Marginal (Options): 1 SP',sp:1,msp:0},fundamental:{l:'Fundamental (Core)',full:'Fundamental (Core): 2 SP',sp:2,msp:0},exzeptionell:{l:'Exzeptionell (Ace)',full:'Exzeptionell (Ace): 3 SP',sp:3,msp:0},grandios:{l:'Grandios (Game Changer)',full:'Grandios (Game Changer): 3 SP + 1 MsP',sp:3,msp:1}};
export const PW_TIER_BADGE_CLS={basisaktion:'border-slate-400/50 bg-slate-500/15 text-slate-600 dark:text-slate-300',marginal:'border-emerald-500/45 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',fundamental:'border-sky-500/50 bg-sky-500/15 text-sky-700 dark:text-sky-300',exzeptionell:'border-fuchsia-500/55 bg-fuchsia-500/15 text-fuchsia-700 dark:text-fuchsia-300',grandios:'border-amber-500/60 bg-amber-500/15 text-amber-700 dark:text-amber-300'};
export const DEF_HZ=[
  {id:'hz1',range:'01 - 10',zone:'Kopf',size:'klein',armor:'',subZones:[{id:'hz1_s1',range:'01 - 40',zone:'Gesicht'},{id:'hz1_s2',range:'41 - 80',zone:'Schädel / Hinterkopf'},{id:'hz1_s3',range:'81 - 100',zone:'Hals / Nacken'}]},
  {id:'hz2',range:'11 - 50',zone:'Rumpf',size:'groß',armor:'',subZones:[{id:'hz2_s1',range:'01 - 35',zone:'Brust'},{id:'hz2_s2',range:'36 - 60',zone:'Bauch'},{id:'hz2_s3',range:'61 - 85',zone:'Rücken'},{id:'hz2_s4',range:'86 - 100',zone:'Schultern / Hüfte'}]},
  {id:'hz3',range:'51 - 62',zone:'Arm links',size:'normal',armor:'',subZones:[{id:'hz3_s1',range:'01 - 25',zone:'Schulter'},{id:'hz3_s2',range:'26 - 55',zone:'Oberarm'},{id:'hz3_s3',range:'56 - 85',zone:'Unterarm'},{id:'hz3_s4',range:'86 - 100',zone:'Hand'}]},
  {id:'hz4',range:'63 - 74',zone:'Arm rechts',size:'normal',armor:'',subZones:[{id:'hz4_s1',range:'01 - 25',zone:'Schulter'},{id:'hz4_s2',range:'26 - 55',zone:'Oberarm'},{id:'hz4_s3',range:'56 - 85',zone:'Unterarm'},{id:'hz4_s4',range:'86 - 100',zone:'Hand'}]},
  {id:'hz5',range:'75 - 87',zone:'Bein links',size:'normal',armor:'',subZones:[{id:'hz5_s1',range:'01 - 40',zone:'Oberschenkel'},{id:'hz5_s2',range:'41 - 55',zone:'Knie'},{id:'hz5_s3',range:'56 - 85',zone:'Unterschenkel'},{id:'hz5_s4',range:'86 - 100',zone:'Fuß'}]},
  {id:'hz6',range:'88 - 100',zone:'Bein rechts',size:'normal',armor:'',subZones:[{id:'hz6_s1',range:'01 - 40',zone:'Oberschenkel'},{id:'hz6_s2',range:'41 - 55',zone:'Knie'},{id:'hz6_s3',range:'56 - 85',zone:'Unterschenkel'},{id:'hz6_s4',range:'86 - 100',zone:'Fuß'}]}
];
export const TABS=[{id:'attributes',icon:'⚡',short:'Attr.',l:'1. Attribute & Status'},{id:'skills',icon:'🎯',short:'Fert.',l:'2. Fertigkeiten'},{id:'powers',icon:'✨',short:'Kräfte',l:'3. Kräfte & Augmente'},{id:'chronicle',icon:'📜',short:'Chronik',l:'4. Steigerungschronik & Log'},{id:'equipment',icon:'🎒',short:'Ausr.',l:'5. Ausrüstung & Bio'}];
export const QTABS=[{k:'bestehen',l:'Testen / Bestehen',ph:'Notizen zu Proben, Vorteilen & Bestehen...'},{k:'schaden',l:'Schaden',ph:'Waffenschaden, Schadenscodes & Effekte...'},{k:'ruestung',l:'Rüstung / Widerstände',ph:'Rüstungsschutz, Resistenzen & Immunitäten...'}];
export const BIO_FIELDS=[{k:'aussehen',l:'Aussehen'},{k:'persoenlichkeit',l:'Persönlichkeit'},{k:'faehigkeiten',l:'Fähigkeiten & Volksmerkmale'},{k:'persoenlicheDaten',l:'Persönliche Daten'},{k:'geschichte',l:'Geschichte'},{k:'notizen',l:'Allgemeine Notizen'}];
export const COL_PRESETS=['#ffffff','#000000','#d97777','#f43f5e','#fb923c','#f59e0b','#fde047','#6eb888','#34d399','#22d3ee','#38bdf8','#6aa3d8','#818cf8','#a58ad6','#c084fc','#f472b6','#e2d9c5','#94a3b8'];
export const CRIT_SEQ=['1','2','3','4','5','6','7','8','9','0'];
export const PALETTES={
  azur:['Azur-Sturm','Blau & Indigo',['#020617','#0ea5e9','#6366f1'],[0,'#020617','#0ea5e9','#6366f1','#f1f5f9','#94a3b8','#fff'],[1,'#f1f5f9','#0284c7','#4f46e5','#0f172a','#64748b','#fff']],
  necro:['Knochig & Nekrotisch','Elfenbein & Grün',['#07120b','#dfd5b8','#22c55e'],[0,'#07120b','#22c55e','#d6c79c','#f3ebd7','#a9b8a4','#061209'],[1,'#f2ead7','#15803d','#3f6212','#0d2114','#4c5e4f','#f7f3e8']],
  bloodfire:['Blut & Feuer','Scharlach & Glut',['#140608','#ef4444','#f97316'],[0,'#140608','#ef4444','#f97316','#fef2f2','#cda3a8','#fff'],[1,'#fff5f5','#dc2626','#ea580c','#29090d','#7f434a','#fff']],
  icewater:['Eis & Wasser','Eisblau & Weiß',['#041524','#00d4ff','#f8fdff'],[0,'#041524','#00d4ff','#e0f7ff','#f8fdff','#9cc7e6','#031321'],[1,'#eaf8ff','#0095ff','#00c8ff','#062338','#3e6d8c','#fff']],
  seastorm:['Meer & Sturm','Blitzgelb & Sturm',['#111b2b','#facc15','#38bdf8'],[0,'#111b2b','#facc15','#38bdf8','#f1f5f9','#9cb0cc','#0f172a'],[1,'#e5edf7','#0284c7','#eab308','#0f1d30','#4b6280','#fff']],
  fae:['Fee & Arkan','Violett & Pink',['#160a29','#c084fc','#f472b6'],[0,'#160a29','#c084fc','#f472b6','#fff','#d5bff5','#19082b'],[1,'#fcf7ff','#9333ea','#ec4899','#260d42','#6e4994','#fff']],
  orokin:['Orokin','Elfenbein & Gold',['#f5efe0','#c5961f','#fffdf7'],[1,'#f5efe0','#c5961f','#e5b83b','#21190b','#6e5b36','#171105'],[1,'#faf7f0','#b8860b','#eab308','#1c1508','#695632','#fff']],
  darkprimed:['Dark Primed','Schwarz & Gold',['#070709','#d4af37','#f7d560'],[0,'#070709','#d4af37','#f7d560','#f7f3e6','#a69a7c','#120e04'],[0,'#0f0f14','#e0b841','#fde047','#faf6eb','#b5a989','#120e04']],
  cyberneon:['Cyber-Neon','Cyan & Magenta',['#070614','#00f5d4','#f72585'],[0,'#070614','#00f5d4','#f72585','#f0fdfa','#9490c7','#061017'],[1,'#f0f4ff','#00a896','#e11d74','#0d0b29','#505485','#fff']],
  holomatrix:['Holo-Tech','Orbital & Türkis',['#03101c','#00dcff','#3b82f6'],[0,'#03101c','#00dcff','#3b82f6','#e6f8ff','#7daac9','#031321'],[1,'#edf8ff','#0284c7','#2563eb','#061f36','#456d8a','#fff']],
  voidquant:['Void-Singularität','Kosmos & Türkis',['#040b0e','#2dd4bf','#818cf8'],[0,'#040b0e','#2dd4bf','#818cf8','#ecfeff','#82a4ab','#041412'],[1,'#f0fdfa','#0d9488','#4f46e5','#082226','#456b70','#fff']],
  emerald:['Smaragd-Wildnis','Smaragd & Jade',['#04130e','#10b981','#14b8a6'],[0,'#04130e','#10b981','#14b8a6','#ecfdf5','#8ab5a5','#041710'],[1,'#f0fdf4','#059669','#0d9488','#062919','#46735e','#fff']],
  crimson:['Karmesin-Glut','Karmesin & Schiefer',['#12080d','#f43f5e','#ec4899'],[0,'#12080d','#f43f5e','#ec4899','#fff1f2','#bfa0ad','#fff'],[1,'#fff1f2','#e11d48','#db2777','#2b0914','#7a4355','#fff']],
  amethyst:['Arkanes Amethyst','Violett & Orchidee',['#0d081c','#8b5cf6','#d946ef'],[0,'#0d081c','#8b5cf6','#d946ef','#f5f3ff','#a599c9','#fff'],[1,'#f5f3ff','#7c3aed','#c026d3','#1e103d','#5e4d87','#fff']],
  amber:['Bernstein-Gold','Bernstein & Anthrazit',['#120e07','#f59e0b','#eab308'],[0,'#120e07','#f59e0b','#eab308','#fffbeb','#bfb093','#171004'],[1,'#fffbeb','#d97706','#ca8a04','#291a05','#785c32','#fff']],
  slate:['Schiefer-Stahl','Stahlgrau & Petrol',['#0b1118','#64748b','#06b6d4'],[0,'#0b1118','#64748b','#06b6d4','#f1f5f9','#94a3b8','#fff'],[1,'#f1f5f9','#334155','#0891b2','#0f172a','#64748b','#fff']]
};
export const GLOSSARY_CATS=["Attribute & Sekundärwerte","Würfel & Kampf","Aktionen, Zustände & Ressourcen","Fortschritt & Kräfte"];
export const GLOSSARY=[
  ["ST / KO","Stärke & Konstitution","Körperkraft & Zähigkeit; bilden zusammen die maximalen LP: ⌊(KO + ST) / 5⌋ + Mod.","Attribute & Sekundärwerte"],
  ["PR / GW","Präzision & Gewandtheit","Zielgenauigkeit, Feinmotorik, Balance, Reflexe & Ausweichen.","Attribute & Sekundärwerte"],
  ["WA / IN","Wahrnehmung & Intelligenz","Sinnesschärfe & Logik; bilden zusammen die Initiative: WA − IN + Mod.","Attribute & Sekundärwerte"],
  ["AU / WK","Ausdruck & Willenskraft","Präsenz, Ausstrahlung & mentaler Fokus; bilden zusammen die maximalen mLP: ⌊(AU + WK) / 5⌋ + Mod.","Attribute & Sekundärwerte"],
  ["Vw / Pot / Tr","Attributs-Bausteine","Volkswert (Standard 20) + individuelles Potenzial + Training (Blöcke 1–4 je +5, Block 5: +10).","Attribute & Sekundärwerte"],
  ["LP / mLP","Lebens- & Mentale LP","Physische (⌊(KO+ST)/5⌋) und mentale (⌊(AU+WK)/5⌋) Belastbarkeit. Basis-Regenerationsrate jeweils 5.","Attribute & Sekundärwerte"],
  ["AP / mAP","Ausdauerpunkte","Physische & mentale Aktionsressourcen für Manöver, Kräfte und Reaktionen (Standard 3/3).","Attribute & Sekundärwerte"],
  ["Bew / BSt","Bewegung & Bewegungsstufe","Meter pro Bewegen-Aktion (Basis + aktive BSt). Automatische Basis-BSt = ⌊Basis-Bewegung / 5⌋ (manuell überschreibbar).","Attribute & Sekundärwerte"],
  ["Verw. / Trauma","Verwundungs- & Traumaschwellen","Physische bzw. mentale Schadensstufen (leicht / mittel / schwer, Standard 4 / 7 / 10), die erreicht werden müssen (z. B. Schwelle 7 → ab 7 Schaden), damit eine Verwundung bzw. ein Trauma eintritt. Ein einzelner Treffer verursacht maximal so viel LP-/mLP-Verlust wie die schwere Schwelle (inkl. Eigenschaften/Kräfte).","Attribute & Sekundärwerte"],
  ["EG / MEG","Erfolgs- & Misserfolgsgrade","Qualität eines W100-Wurfs. Bei Erfolg: EG = ⌈Wurf / 10⌉ (je höher, desto besser); bei Misserfolg: MEG = ⌈(101 − Wurf) / 10⌉. Eine Testschwelle über 100 bringt keine doppelten oder dreifachen EG (100 bleibt immer ein Patzer).","Würfel & Kampf"],
  ["Krit / Patzer","Kritische Ziffer & Patzer","Eine gewürfelte 1 ist immer ein kritischer Erfolg, eine 100 immer ein Patzer. Standardmäßig ist Endziffer 1 bei Erfolg kritisch (erweiterbar in Reihe 1→2→…→9→0, z. B. durch „Tödlich (X)“). Kritische Erfolge bei einem Trefferwurf verursachen +2 Extraschaden.","Würfel & Kampf"],
  ["Vor. / Nacht.","Vorteile & Nachteile","Verrechnen sich 1:1 zur Netto-Differenz (gedeckelt bei ±5): ±1 = ±10, ±2 = ±15, ±3 = ±20, ±4 = ±25, ±5+ = ±30 auf die Testschwelle.","Würfel & Kampf"],
  ["Blocken","Blocken (1-Wurf-System)","Es gibt nur noch einen Trefferwurf gegen den Blocker. Schafft der Angreifer den Wurf, trifft er durch den Block (normale EG + ggf. Krit). Scheitert er am Block (außer Patzer 100), gilt der Treffer statisch als 3 EG ohne kritischen Treffer — der Verteidiger bestimmt die geblockte Trefferzone (mit Schild / blockfähiger Waffe + dahinterliegender Rüstung).","Würfel & Kampf"],
  ["Zonen / GRP","Trefferzonen & Rüstung","W100-Trefferzonentabelle (Kopf 01–10, Rumpf 11–50, Arme 51–74, Beine 75–100) sowie Rüstungsschutz gegen Schnitt, Stich, Einschlag und Gesamt-Rüstungspunkte (GRP).","Würfel & Kampf"],
  ["Größe","Charaktergröße & Trefferwürfe","Größenkategorien von Sehr klein (−2) über Klein (−1), Normal (0), Groß (+1) bis Sehr Groß (+2) sowie frei erweiterbare Stufen (±3+). Bei Trefferwürfen gilt relativ zum Ziel: Ziel-Stufe − Angreifer-Stufe = Vorteile (+) bzw. Nachteile (−) ausschließlich auf Trefferwürfe.","Würfel & Kampf"],
  ["Aktionsarten","Frei-, Schnell-, Grundaktion & Einsatz","Freiaktionen beliebig oft im Zug; erste Schnellaktion pro Phase frei (weitere = Grundaktion); 1 Grundaktion pro Phase; Einsatz außerhalb des Kampfes. Ergänzend: Reaktion & Sofortaktion.","Aktionen, Zustände & Ressourcen"],
  ["Flut / Ebbe","Phasen & Kraftaktion","Kraftaktionen können nur in einer Flutphase eingesetzt werden; danach ist die nächste eigene Phase automatisch eine Ebbephase.","Aktionen, Zustände & Ressourcen"],
  ["Statuseffekte","Positive & Negative Zustände","Stapelbare Effekte je Attributpaar: Gestärkt/Geschwächt (±2 LP, ST/KO), Beweglich/Eingeschränkt (±1 BSt, PR/GW), Konzentriert/Abgelenkt (±10 Ini nach Wahl, WA/IN), Entschlossen/Verunsichert (±2 mLP, AU/WK) – jeweils +1 Vorteil bzw. Nachteil pro Stapel.","Aktionen, Zustände & Ressourcen"],
  ["Inspiration","✨ Inspirations-Stapel","Vor einem Test kann 1 Stapel verbraucht werden für +1 Vorteil auf genau diesen Wurf (max. 1 Stapel pro Wurf).","Aktionen, Zustände & Ressourcen"],
  ["Reservierung","🔒 Gebundene Ressourcen","Kräfte/Augmente können LP, mLP, AP, mAP oder eigene Ressourcen dauerhaft reservieren; das senkt das freie Maximum bei Pause und Rast bis zur Aufhebung.","Aktionen, Zustände & Ressourcen"],
  ["Pause / Rast","Erholung & Regeneration","Pause stellt AP & mAP wieder her (keine ausgebrannten Sekundärattribute). Erholsame Rast heilt 2× LP- & mLP-Regenerationsrate und stellt AP, mAP sowie ausgebrannte Sekundärattribute wieder her.","Aktionen, Zustände & Ressourcen"],
  ["EP / SP / MsP","Erfahrung, Steigerung & Meisterschaft","100 EP = +1 Stufe (mit Rest-Übertrag). Pro Stufe +5 SP; jede 10. Stufe +1 MsP.","Fortschritt & Kräfte"],
  ["Kräfte / Augm.","Basisaktionen, Kräfte & Augmente","Basisaktionen kosten 0 SP; Kräfte/Augmente kosten Marginal (Options) 1 SP, Fundamental (Core) 2 SP, Exzeptionell (Ace) 3 SP oder Grandios (Game Changer) 3 SP + 1 MsP. Bis zu 3 Augmente pro Kraft, kollektiv max. 1 MsP pro Kraft-Gruppe.","Fortschritt & Kräfte"]
];
export const DEF_SIZE_CATS = [
  { level: -2, label: 'Sehr klein' },
  { level: -1, label: 'Klein' },
  { level: 0, label: 'Normal' },
  { level: 1, label: 'Groß' },
  { level: 2, label: 'Sehr Groß' }
];
export const WEAPON_SUBTYPES = [
  { key: 'melee', label: 'Nahkampfwaffe', icon: '⚔️' },
  { key: 'ranged', label: 'Fernkampfwaffe', icon: '🏹' }
];
export const ARMOR_SUBTYPES = [
  { key: 'armor', label: 'Rüstung', icon: '🛡️' },
  { key: 'shield', label: 'Schild', icon: '🛡️' }
];
export const DEF_EQ_SEC_ORDER=['weapons','ammos','armors','inventory'];
export const DEF_CHR_SEC_ORDER=['training','skills','powers'];
export const DICE_DEF={open:false,docked:false,floating:false,x:null,y:null,w:0,h:0,z:50,label:'Freie Probe',skillId:null,attrKey:null,weaponId:null,shieldId:null,wRollCat:'Normaler Test',atkPool:'lp',dualWieldOvr:'auto',wpEditOpen:false,advSrcOpen:false,logOpen:false,cMode:'direct',cDirect:0,cAttr:0,cSkill:'0',cCustom:25,dMode:'direct',dDirect:40,dAttr:30,dSkill:'10',dCustom:25,oppCharId:'',oppKind:'preset',oppPreset:'dodge',oppAttrKey:'GW',oppSkillId:'',oppWeaponId:'',oppSitActive:{},adv:0,dis:0,advAdj:0,disAdj:0,cnt:1,crit:'1',critOff:0,critMode:'range',sitActive:{},blockFollowAtk:40,customCnt:1,customSides:20,customMod:0,customOpen:false,_lobbyNeutral:false,secretMode:false};
export const CNOTES_DEF={open:false,docked:false,floating:false,x:null,y:null,w:0,h:0,z:50,tocOpen:true,confirmDelId:null,confirmDelFolderId:null,newFolderOpen:false,newFolderName:'',newFolderPublic:false};
export const LIVEDICE_DEF={open:false,docked:false,floating:false,x:null,y:null,w:0,h:0,z:50};
export const INI_DEF={open:false,docked:false,floating:false,compact:false,collapsed:false,pickerHidden:false,x:null,y:null,w:0,h:0,z:50,addCustomOpen:false,customName:'',customIni:'0',customIsEnemy:true,customHidden:false};
export const FBW_DEF={open:false,docked:false,floating:false,x:null,y:null,w:0,h:0,z:50};
export const WIN_PREFS_KEY='scherbensturm_win_prefs_v1';
export const WIN_KEYS=['dice','cnotes','livedice','ini','fbadmin'];
export const WIN_DEFAULTS={
  dice:{w:680,dockClass:'xl:w-[440px] 2xl:w-[480px]'},
  livedice:{w:720,dockClass:'xl:w-[440px] 2xl:w-[480px]'},
  ini:{w:540,dockClass:'xl:w-[380px] 2xl:w-[430px]'},
  cnotes:{w:840,dockClass:'xl:w-[480px] 2xl:w-[520px]'},
  fbadmin:{w:740,dockClass:'xl:w-[480px] 2xl:w-[520px]'}
};
export const PW_MODE_KEY='scherbensturm_pw_mode';
export const REGISTRY_ID='_lobby_meta_registry_';
export const LIBRARY_ID='_power_library_';
export const REPO_LIBRARY_URL='./data/powers-library.json';
export const PWLIB_CACHE_KEY='scherbensturm_power_library_cache';
export const PATCHNOTES_ID = '_patchnotes_';
export const PATCHNOTES_CACHE_KEY = 'scherbensturm_patchnotes_cache';
export const FEEDBACK_ID = '_feedback_store_';
export const FEEDBACK_CACHE_KEY = 'scherbensturm_feedback_cache';
export const DEF_FB_FOLDERS = [{ id:'fb_inbox', name:'📥 Posteingang', isSystem:true }, { id:'fb_saved', name:'⭐ Aufbewahrt', isSystem:false }];
export const ICON_STORE_ID = '_custom_icons_';
export const CUSTOM_ICONS_CACHE_KEY = 'scherbensturm_custom_icons_cache';
export const GUEST_THEME_KEY='scherbensturm_guest_theme_v1';
export const USER_BG_LOCAL_PREFIX='scherbensturm_user_bg_local_';
export const THEME_BG_SYNC_LIMIT=180000;
export const THEME_SYNC_DEBOUNCE_MS=750;
export const CLOUD_SYNC_DEBOUNCE_MS=1100;
export const CLOUD_SYNC_RETRY_DELAYS=[5000,15000,30000];
export const CLOUD_SYNC_KEEPALIVE_LIMIT=60*1024;
export const SCROLL_KEY_SEL='[data-scroll-key],[data-pwlib-scroll],[data-fb-minichat],[data-lobby-dice-body],[data-lobby-camp-tabs],[data-dice-scroll-body],.modal-body,.ctx-body';
export const SCROLL_Y_SEL='.modal-body,.ctx-body,.overflow-y-auto,.overflow-auto,[class*="overflow-y-auto"],[class*="overflow-auto"]';
export const SCROLL_X_SEL='.overflow-x-auto,.overflow-auto,[class*="overflow-x-auto"],[class*="overflow-auto"]';
export const DYN_FACTOR_PRESETS=[
  {v:'',l:'direkt (×1)'},
  {v:'/2',l:'/2'},
  {v:'/3',l:'/3'},
  {v:'/4',l:'/4'},
  {v:'/5',l:'/5'},
  {v:'/10',l:'/10'},
  {v:'×2',l:'×2'},
  {v:'×3',l:'×3'},
  {v:'+1',l:'+1'},
  {v:'-1',l:'-1'}
];
export const DYN_ROUND_OPTS=[
  {v:'',l:'Exakt'},
  {v:'floor',l:'⌊ Abrunden'},
  {v:'ceil',l:'⌈ Aufrunden'},
  {v:'round',l:'≈ Runden'}
];
export const DYN_TARGET_OPTS=[
  {v:'desc',l:'Beschreibung'},
  {v:'effects',l:'Effekte'},
  {v:'rules',l:'Zusatzinfos'}
];
export const DYN_FUNCS={
  floor:{arity:1,fn:a=>Math.floor(a[0])},
  abrunden:{arity:1,fn:a=>Math.floor(a[0])},
  ceil:{arity:1,fn:a=>Math.ceil(a[0])},
  aufrunden:{arity:1,fn:a=>Math.ceil(a[0])},
  round:{arity:1,fn:a=>Math.round(a[0])},
  runden:{arity:1,fn:a=>Math.round(a[0])},
  min:{arity:-2,fn:a=>Math.min(...a)},
  max:{arity:-2,fn:a=>Math.max(...a)}
};
export const DYN_FUNC_NAMES=Object.keys(DYN_FUNCS).sort((a,b)=>b.length-a.length);
export const POWER_PACK_SCHEMA='scherbensturm_power_pack_v1';
export const LP_REGEN_BASE=5, MLP_REGEN_BASE=5;
export const DUAL_COL_TARGETS=new Set(['pw','sec-folder','sksec-folder','invsec-folder','sk-item','eq','eqsec','chrsec','camp']);
