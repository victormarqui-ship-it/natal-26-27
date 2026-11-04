const {chromium}=require('playwright'); const fs=require('fs');
(async()=>{ const b=await chromium.launch(); fs.mkdirSync('adcap/shots/voo',{recursive:true});
const ctx=await b.newContext({locale:"pt-BR",viewport:{width:390,height:844},deviceScaleFactor:2});
await ctx.addInitScript(()=>{ Object.defineProperty(navigator,'webdriver',{get:()=>false}); });
const p=await ctx.newPage(); const errs=[]; p.on('pageerror',e=>errs.push(e.message)); p.on('response',async r=>{ if(/sunny-api/.test(r.url())&&r.status()>=400){ try{ console.log('APIERR',r.url(),r.status(),(await r.text()).slice(0,600)); }catch(e){} } }); p.on('request',r=>{ if(/prebook/.test(r.url())) console.log('REQ',r.postData()); }); p.on('console',m=>{ if(m.type()==='error') errs.push('console:'+m.text()); });
const shot=async n=>{ void 0; await p.waitForTimeout(800); await p.screenshot({path:`adcap/shots/voo/${n}.jpg`,type:'jpeg',quality:85}); };
await p.goto('https://victormarqui-ship-it.github.io/natal-26-27/sunny/'); await p.waitForTimeout(4000); await p.addStyleTag({content:'#agFab{display:none!important}'});
await p.evaluate(()=>{ const c=citiesOf("BR").find(x=>x.name==="São Paulo"); S.wel.city=c; welDone(); S.form={...S.form,paises:["IT"],cidades:["roma","florenca"],ida:"2027-04-10",volta:"2027-04-16",noites:null,adultos:2,idades:[7]}; startGen(S.form); });
await p.waitForFunction(()=>S.view==="trip",null,{timeout:40000}); await p.waitForTimeout(1500);
await p.evaluate(()=>{ S.trip.viajantes[0].nome="Victor Marqui"; persistTrip(); openBook("comprar"); }); await shot("01-comprar");
await p.waitForFunction(()=>Object.values(FR).some(h=>h&&(h.list||h.err)),null,{timeout:60000}).catch(()=>{}); await p.waitForTimeout(1500);
console.log('FR',await p.evaluate(()=>JSON.stringify({groups:frGroups(S.trip).map(g=>g.legs),st:Object.fromEntries(Object.entries(FR).map(([k,v])=>[k,v&&{err:v.err,n:v.list&&v.list.length,first:v.list&&v.list[0]&&[v.list[0].price,v.list[0].legs.map(l=>[l.from,l.to,l.carrier,l.logo,l.stops])]}]))})));
await p.evaluate(()=>{ const el=document.querySelector('.fc'); if(el){ el.scrollIntoView({block:"start"}); window.scrollBy(0,-90);} }); await shot("02-voo-escolhido");
await p.evaluate(()=>{ const b=document.querySelector('[data-fropen]'); if(b) b.click(); }); await p.waitForTimeout(600);
await p.evaluate(()=>{ const el=document.querySelector('.hbChips'); if(el){ el.scrollIntoView({block:"start"}); window.scrollBy(0,-60);} }); await shot("03-lista-voos");
await p.evaluate(()=>{ document.querySelector('.hbChips').scrollIntoView({block:"start"}); window.scrollBy(0,700); }); await shot("04-lista-voos2");
await p.evaluate(()=>{ const b=document.querySelector('[data-frpick]'); if(b) b.click(); }); await p.waitForTimeout(500);
await p.evaluate(()=>{ const b=document.querySelector('[data-frbook]'); if(b) b.click(); }); await p.waitForTimeout(500);
const n=await p.evaluate(()=>frPaxList(S.trip).length); const nm=[["Victor","Marqui","1988-03-02","M"],["Mariana","Marqui","1990-06-10","F"],["Leo","Marqui","2019-08-01","M"],["Ana","Marqui","1960-01-01","F"]];
for(let j=0;j<n;j++){ await p.fill(`[name=fn${j}]`,nm[j][0]); await p.fill(`[name=ln${j}]`,nm[j][1]); await p.fill(`[name=bd${j}]`,nm[j][2]); await p.selectOption(`[name=gd${j}]`,nm[j][3]); }
await p.fill('[name=em]','teste@sunnytrip.app'); await p.fill('[name=tel]','11999990000');
await p.evaluate(()=>{ const el=document.querySelector('[data-frform]'); if(el) el.scrollIntoView({block:"start"}); }); await shot("05-passageiros");
await p.evaluate(()=>{ const f=document.querySelector('[data-frform]'); if(f) f.requestSubmit(); });
await p.waitForURL(/pay\.html/,{timeout:30000}).catch(()=>{}); await p.waitForTimeout(9000); await shot("09c-pagamento");
console.log('URL',p.url().slice(0,120));
try{
  let fr=null; for(let k=0;k<20&&!fr;k++){ for(const f of p.frames()){ try{ if(await f.locator('input[autocomplete="cc-number"],input[name="number"],#Field-numberInput').count()){ fr=f; break; } }catch(e){} } if(!fr) await p.waitForTimeout(1000); }
  console.log('FRAMES',p.frames().map(f=>f.name().slice(0,40)+'|'+f.url().slice(0,60)).join(' ;; '));
  if(!fr) throw new Error('sem campo de cartão');
  await fr.locator('input[autocomplete="cc-number"],input[name="number"],#Field-numberInput').first().fill('4242424242424242');
  await fr.locator('input[autocomplete="cc-exp"],input[name="expiry"],#Field-expiryInput').first().fill('12 / 30');
  await fr.locator('input[autocomplete="cc-csc"],input[name="cvc"],#Field-cvcInput').first().fill('123');
  const pc=fr.locator('input[autocomplete="postal-code"],input[name="postalCode"]'); if(await pc.count()) await pc.first().fill('12345');
  await shot('10-cartao');
  await p.getByRole('button',{name:/pay/i}).last().click();
  await p.waitForURL(/bk=1/,{timeout:60000}); console.log('RETURN',p.url().slice(0,160));
  await p.waitForTimeout(15000); await shot('11-confirmado'); await p.evaluate(()=>{ const el=document.querySelector('.bk.done'); if(el) el.scrollIntoView({block:'start'}); }); await shot('12-comprado');
  console.log('BUY',await p.evaluate(()=>JSON.stringify(S.trip&&S.trip.pk&&S.trip.pk.buy)));
  console.log('TOAST',await p.evaluate(()=>{const t=document.getElementById('sunToast');return t&&t.textContent;}));
}catch(e){ console.log('PAYFAIL',e.message.slice(0,300)); await shot('10-falha'); } console.log('errs',errs); await b.close(); })();
// 1793814838
// 1793815454
