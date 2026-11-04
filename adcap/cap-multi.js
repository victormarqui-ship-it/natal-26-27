const {chromium}=require('playwright'); const fs=require('fs');
const TX={
pt:{loc:"pt-BR",cc:"BR",city:/^São Paulo$/,q:"Onde comer uma carbonara boa perto do Coliseu?",a:"Boa escolha! 🍝 Perto do Coliseu, vá ao **Trattoria Luzzi** (rápido e barato) ou suba até **Monti** para algo mais caprichado. Quer que eu coloque o jantar no dia 3?",lt:"me leva num lugar com vista bonita pro pôr do sol",g:["Jantar em Trastevere","Ingressos do Coliseu","Gelato"]},
en:{loc:"en-US",cc:"US",city:/^New York/,q:"Where can I get a good carbonara near the Colosseum?",a:"Great pick! 🍝 Near the Colosseum, try **Trattoria Luzzi** (quick and cheap) or head up to **Monti** for something fancier. Want me to add dinner on day 3?",lt:"take me somewhere with a beautiful sunset view",g:["Dinner in Trastevere","Colosseum tickets","Gelato"]},
es:{loc:"es-ES",cc:"ES",city:/^Madrid$/,q:"¿Dónde como una buena carbonara cerca del Coliseo?",a:"¡Buena elección! 🍝 Cerca del Coliseo, ve a **Trattoria Luzzi** (rápido y barato) o sube a **Monti** para algo más elaborado. ¿Pongo la cena el día 3?",lt:"llévame a un lugar con una vista bonita del atardecer",g:["Cena en Trastevere","Entradas al Coliseo","Helado"]}};
(async()=>{ const b=await chromium.launch(); for(const L of ["pt","en","es"]){ const X=TX[L]; fs.mkdirSync(`adcap/shots/${L}`,{recursive:true});
const ctx=await b.newContext({locale:X.loc,viewport:{width:390,height:844},deviceScaleFactor:2.5,timezoneId:"Europe/Lisbon"});
await ctx.addInitScript(()=>{ Object.defineProperty(navigator,'webdriver',{get:()=>false}); });
const p=await ctx.newPage(); const errs=[]; p.on('pageerror',e=>errs.push(e.message));
const shot=async(n,opt={})=>{ await p.waitForTimeout(opt.wait||350); if(!opt.fast){ await p.waitForTimeout(2500); await p.evaluate(()=>Promise.race([Promise.all([...document.images].filter(i=>!i.complete).map(i=>new Promise(r=>{i.onload=i.onerror=r;}))),new Promise(r=>setTimeout(r,9000))])); await p.waitForTimeout(700);} await p.screenshot({path:`adcap/shots/${L}/${n}.jpg`,type:"jpeg",quality:92,fullPage:false}); };
await p.goto('https://victormarqui-ship-it.github.io/natal-26-27/sunny/'); await p.waitForTimeout(4000); await p.addStyleTag({content:'#agFab{display:none!important}'});
await p.evaluate(L=>{ S.lang=L; render(); },L); await shot("01-welcome");
await p.evaluate(X=>{ const re=new RegExp(X.city.src||X.city); S.lang=X.L; const c=citiesOf(X.cc).find(x=>re.test(x.name)); S.wel.city=c; welDone(); S.lang=X.L; render(); },{cc:X.cc,city:X.city.source,L});
await p.waitForTimeout(500); await shot("02-home");
// wizard cities Italy
await p.evaluate(()=>{ const f=n=>citiesOf("IT").find(c=>c.name===n); S.form={chegada:true,paises:["IT"],cidades:[],gx:{},ida:"2027-04-10",volta:"2027-04-18",tipo:"intl",origemCity:S.form.origemCity,voltaCity:null,adultos:2,idosos:0,idades:[7],pet:false,petNome:"",ritmo:"Equilibrado",orc:"Médio",bmode:"estilo",inter:["História","Gastronomia"],modo:"sug"};
  ["roma","florenca"].forEach(id=>S.form.cidades.push(id)); ["Bologna","Modena","Verona"].forEach(n=>{ const c=f(n); S.form.cidades.push(c.id); if(!KB[c.id]||KB[c.id].generic) S.form.gx[c.id]=gmeta(c); });
  S.form.bate={[f("Modena").id]:true,[f("Verona").id]:true}; S.form.noites=null; S.view="wz"; S.wz=WZ.findIndex(w=>w.id==="cidades"); render(); });
await shot("03-cidades"); await p.evaluate(()=>{ const el=document.querySelector(".slp"); el.scrollIntoView({block:"center"}); }); await shot("04-dormir");
await p.evaluate(()=>{ S.wz=WZ.findIndex(w=>w.id==="noites"); render(); window.scrollTo(0,0); }); await shot("05-noites");
await p.evaluate(()=>{ S.wz=WZ.findIndex(w=>w.id==="rev"); render(); window.scrollTo(0,0); }); await shot("06-rev");
await p.evaluate(()=>{ startGen(S.form); }); await p.waitForTimeout(700); await shot("07-gen",{wait:50,fast:1});
await p.waitForFunction(()=>S.view==="trip",null,{timeout:30000}); await p.waitForTimeout(900);
await p.evaluate(()=>{ S.trip.viajantes[0].nome="Victor"; S.trip.viajantes[1].nome="Mari"; S.trip.viajantes[2].nome="Léo"; persistTrip(); render(); window.scrollTo(0,0); });
await shot("08-inicio");
await p.evaluate(()=>{ const el=document.querySelector(".cdx"); if(el) el.scrollIntoView({block:"start"}); window.scrollBy(0,-20); }); await shot("09-frase");
await p.evaluate(()=>{ S.tab="roteiro"; S.rv="path"; render(); window.scrollTo(0,330); }); await shot("10-caminho");
const di=await p.evaluate(()=>(()=>{let i=S.trip.dias.findIndex(d=>d.tipo==="livre"&&/Roma|Rome/.test(d.cidade||""));return i<0?1:i;})());
await p.evaluate(i=>{ S.tab="roteiro"; S.dayOpen=true; S.day=i; render(); const el=document.querySelector(".dh"); el.scrollIntoView({block:"start"}); window.scrollBy(0,-10); },di); await shot("11-dia"); await p.evaluate(()=>{ const el=document.querySelector(".tbar"); el.scrollIntoView({block:"center"}); }); await shot("11b-tempo");
await p.evaluate(()=>{ S.dayAddOpen=true; render(); const el=document.querySelector(".picker"); el.scrollIntoView({block:"start"}); }); await shot("12-picker");
await p.evaluate(()=>{ S.dayAddOpen=false; S.mvOpen=true; render(); const el=document.querySelector(".mvc"); el.scrollIntoView({block:"start"}); window.scrollBy(0,-20); }); await shot("13-chegar");
const bv=await p.evaluate(()=>(()=>{let i=S.trip.dias.findIndex(d=>d.tipo==="bate-volta"&&/Modena/.test((d.titulo||"")+(d.cidade||"")));if(i<0)i=S.trip.dias.findIndex(d=>/Modena/.test(JSON.stringify(d)));if(i<0)i=S.trip.dias.findIndex(d=>d.tipo==="bate-volta");return i<0?3:i;})());
await p.evaluate(i=>{ S.day=i; S.mvOpen=false; render(); window.scrollTo(0,0); },bv); await shot("14-modena");
await p.evaluate(()=>{ S.dayOpen=false; S.tab="mala"; render(); window.scrollTo(0,0); }); await shot("15-mala");
await p.evaluate(G=>{ const T=S.trip; T.gastos=[{id:"g1",desc:G[0],valor:86,moeda:"EUR",cat:"Alimentação",pagou:0,entre:[0,1]},{id:"g2",desc:G[1],valor:58,moeda:"EUR",cat:"Passeios e ingressos",pagou:1,entre:[0,1]},{id:"g3",desc:G[2],valor:12,moeda:"EUR",cat:"Alimentação",pagou:0,entre:[0,1]}]; persistTrip(); S.tab="custos"; render(); window.scrollTo(0,0); },X.g); await shot("16-custos");
await p.evaluate(()=>{ const el=document.querySelector(".qg"); if(el) el.scrollIntoView({block:"start"}); }); await shot("17-cotar");
// agent listening
await p.evaluate(X=>{ S.tab="inicio"; render(); window.scrollTo(0,0); agToggle(true); AG.brain="claude"; AG.msgs=[{r:"u",t:X.q},{r:"a",t:X.a,acts:[],links:[]}]; agRender(); },X);
await shot("18-ask",{wait:600});
await p.evaluate(t=>{ AG.listen=true; AG.lt=t; agRender(); const lt=document.getElementById("agLt"); if(lt){ lt.textContent=t; lt.classList.remove("ph"); } },X.lt);
await shot("19-voz",{wait:400,fast:1});
await p.evaluate(()=>{ AG.listen=false; agToggle(false); S.pass={extra:["JP","PE","FR","AR"]}; const T2=JSON.parse(JSON.stringify(S.trip)); T2.ida="2025-05-01"; T2.volta="2025-05-09"; T2.uid="x"; S.trips.push(T2); S.view="pass"; render(); window.scrollTo(0,0); });
await shot("20-passaporte");
await p.evaluate(()=>{ S.view="plus"; render(); window.scrollTo(0,0); }); await shot("21-plus");
await p.evaluate(()=>{ S.view="home"; render(); window.scrollTo(0,0); }); await shot("22-home2");
console.log(L,errs); await ctx.close(); } await b.close(); })();
