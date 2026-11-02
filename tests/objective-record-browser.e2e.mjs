import test from 'node:test';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';

// Chrome headless réel, moteur Mélange natif et page de démo sous serveur HTTP local.
// AUCUN JWT / Supabase / compte élève. Ne prouve pas le crédit XP authentifié.
const host='http://127.0.0.1:8123/essai-objectif-record-3-vies.html';
const mobileUA='Mozilla/5.0 (Linux; Android 14; Pixel 6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36';
test('Mélange : 2 modes, aucun XP en libre, 7 sélections distinctes en aperçu simulé',async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1280,height:850}});
  const network=[];
  page.on('request',req=>{if(/supabase\.co/.test(req.url()))network.push(req.url())});
  await page.goto(host,{waitUntil:'domcontentloaded'});
  const frame=page.frameLocator('#game');
  await frame.locator('#startThreeLives').waitFor({timeout:20000});
  assert.equal(await frame.locator('#startThreeLives').count(),1);
  assert.equal(await frame.locator('#suddenBtn').count(),1);
  assert.equal(await frame.locator('#menuScreen .countBtn[data-count]').count(),3);
  assert.equal(await frame.locator('.classic-xp-remaining').count(),0);
  await page.locator('#xpMode').selectOption('fake');
  await frame.locator('.classic-xp-remaining').first().waitFor();
  const all=await frame.locator('.classic-xp-remaining').allTextContents();
  assert.equal(all.length,3);
  assert.ok(all.every(x=>/^Reste \d+ XP$/.test(x)));
  const prev=await frame.locator('.countBtn[data-count="4"] .classic-xp-remaining').textContent();
  // Changer vraiment les opérations cochées, sans dériver de l'ancienne sélection.
  await frame.locator('#opsSelector [data-op="mul"]').click();
  const two=await frame.locator('.countBtn[data-count="4"] .classic-xp-remaining').textContent();
  assert.notEqual(prev,two);
  // Vérifier les sept choix réellement cochés, sans confondre deux couples
  // ayant la même taille ; montants fictifs de l'aperçu, jamais droits serveur.
  const combinations=[
   ['add'],['sub'],['mul'],['add','sub'],['add','mul'],['sub','mul'],['add','sub','mul']
  ];
  // Valeurs d'aperçu fictives du niveau 1, jamais les droits XP Connect.
  const expected4={'add':7,'sub':6,'mul':8,'add,sub':14,'add,mul':15,'sub,mul':16,'add,sub,mul':28};
  const observed=new Map();
  for(const wanted of combinations){
   // Activer d'abord toutes les opérations voulues : jamais zéro opération.
   for(const op of wanted){
    const button=frame.locator('#opsSelector [data-op="'+op+'"]');
    if(!await button.evaluate(el=>el.classList.contains('active')))await button.click();
   }
   for(const op of ['add','sub','mul'].filter(op=>!wanted.includes(op))){
    const button=frame.locator('#opsSelector [data-op="'+op+'"]');
    if(await button.evaluate(el=>el.classList.contains('active')))await button.click();
   }
   const selected=await frame.locator('#opsSelector .op-toggle.active').evaluateAll(nodes=>
    nodes.map(el=>el.dataset.op).join(','));
   assert.equal(selected,wanted.join(','),'Les opérations cochées doivent correspondre');
   // Le parent actualise l'aperçu par setTimeout(0) après le clic dans l'iframe.
   // Une lecture immédiate attrape parfois la valeur précédente (CI flaky).
   const key=wanted.join(',');
   await frame.locator('.countBtn[data-count="4"] .classic-xp-remaining')
    .filter({hasText:'Reste '+expected4[key]+' XP'}).waitFor({timeout:3000});
   const shown=await frame.locator('.countBtn[data-count="4"] .classic-xp-remaining').textContent();
   assert.equal(shown,'Reste '+expected4[key]+' XP');
   observed.set(key,shown);
  }
  assert.equal(observed.size,7);
  assert.notEqual(observed.get('add,sub'),observed.get('add,mul'));
  assert.notEqual(observed.get('add'),observed.get('sub'));
  // Le moteur natif verrouille les niveaux 2 et 3 sans progression.
  // Le banc de test ne les debloque PAS dans le jeu.
  await frame.locator('#levelBtn').click();
  assert.equal(await frame.locator('#levelMenu .level-option:not(.hard)').nth(1).isDisabled(),true);
  // Tester les trois combinaisons de l'APERÇU FICTIF par changement DOM
  // uniquement ; aucun niveau ne devient disponible pour le vrai joueur.
  for(const [level,expected] of [[1,76],[2,78],[3,80]]){
   await frame.locator('#levelSelect').evaluate((el,n)=>{
    el.value=String(n);el.dispatchEvent(new Event('change',{bubbles:true}));
   },level);
   await frame.locator('.countBtn[data-count="20"] .classic-xp-remaining')
    .filter({hasText:'Reste '+expected+' XP'}).waitFor({timeout:3000});
   const displayed=await frame.locator('.countBtn[data-count="20"] .classic-xp-remaining').textContent();
   assert.equal(displayed,'Reste '+expected+' XP');
  }
  await page.locator('#xpMode').selectOption('zero');
  assert.deepEqual(await frame.locator('.classic-xp-remaining').allTextContents(),['Reste 0 XP','Reste 0 XP','Reste 0 XP']);
  await page.locator('#xpMode').selectOption('free');
  assert.equal(await frame.locator('.classic-xp-remaining').count(),0);
  assert.deepEqual(network,[]);
 }finally{await browser.close()}
});
test('Mélange : moteur réel, 3 cœurs dans le bandeau, PC et téléphone 320 px',async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  for(const mobile of [false,true]){
   const page=await browser.newPage({viewport:mobile?{width:320,height:650}:{width:1440,height:900},
     ...(mobile?{isMobile:true,hasTouch:true,userAgent:mobileUA}:{}),reducedMotion:'reduce'});
   await page.goto(host,{waitUntil:'domcontentloaded'});
   const frame=page.frameLocator('#game');
   await frame.locator('#startThreeLives').waitFor({timeout:20000});
   // Les séries doivent rester compactes à 320 px, avec les XP fictifs,
   // et afficher le nombre à côté du mot « calculs ».
   await page.locator('#xpMode').selectOption('fake');
   const compact=await frame.locator('#menuScreen .countBtn[data-count]')
    .evaluateAll(buttons=>buttons.map(b=>({label:b.textContent.replace(/Reste \d+ XP/g,'').replace(/\s+/g,' ').trim(),
     height:b.getBoundingClientRect().height,whiteSpace:getComputedStyle(b).whiteSpace,
     scrollWidth:b.scrollWidth,clientWidth:b.clientWidth,font:getComputedStyle(b).fontSize,parentWidth:b.parentElement?.getBoundingClientRect().width,outer:b.outerHTML.slice(0,380)})));
   assert.equal(compact.length,3);
   for(const [i,c] of compact.entries()){
    assert.equal(c.label,['4 calculs','10 calculs','20 calculs'][i]);
    assert.equal(c.whiteSpace,'nowrap');
    assert.ok(c.height<=70,'Bouton '+c.label+' trop haut : '+c.height+' px');
    assert.ok(c.scrollWidth<=c.clientWidth+2,'Bouton '+c.label+' déborde : '+JSON.stringify(c));
   }
   const left=await frame.locator('#startThreeLives').boundingBox();
   const right=await frame.locator('#suddenBtn').boundingBox();
   assert.ok(left&&right,'Les 2 boutons doivent être visibles');
   assert.ok(left.x+left.width<=right.x+2,'Les 2 boutons ne doivent pas se chevaucher');
   await frame.locator('#startThreeLives').click();
   await frame.locator('#threeLivesHud .demo-heart').first().waitFor({timeout:15000});
   assert.equal(await frame.locator('#threeLivesHud .demo-heart').count(),3);
   assert.equal(await frame.locator('#threeLivesHud').getAttribute('hidden'),null);
   const mode=await frame.locator('#sessionMode').textContent();
   assert.match(mode,/❤️/);
   await page.close();
  }
 }finally{await browser.close()}
});

test('LAB V2 — trophées et points visibles',async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  for(const mobile of [false,true]){
   const page=await browser.newPage({viewport:mobile?{width:320,height:650}:{width:1440,height:900},reducedMotion:'reduce'});
   const traffic=[];page.on('request',req=>{if(/supabase\\.co/i.test(req.url()))traffic.push(req.url())});
   await page.goto('http://127.0.0.1:8123/essai-objectif-record-3-vies.html',{waitUntil:'domcontentloaded'});
   const frame=page.frameLocator('#game');
   await frame.locator('#startThreeLives').waitFor({timeout:30000});
   const cups=frame.locator('#suddenBtn .mlab-sudden .mlab-cup');
   await cups.first().waitFor({timeout:30000});
   assert.equal(await cups.count(),3,'Trois coupes de Mort subite visibles');
   assert.equal(await frame.locator('#suddenBtn .score-mode-bonus').textContent(),'Score ×2');
   const mastery=frame.locator('#menuScreen .mlab-mastery-under-series .mlab-cup');
   await mastery.waitFor({timeout:30000});
   assert.equal(await mastery.count(),1,'Une seule coupe : celle du niveau sélectionné');
   assert.equal(await frame.locator('#menuScreen .mathas-v535-table .mlab-cup').count(),0,'Aucune coupe ajoutée au tableau des records');
   const panel=frame.locator('#menuScreen .mathas-series-panel').first();
   const nativeSpacing=await panel.evaluate(el=>({gap:el.style.getPropertyValue('gap'),padding:el.style.getPropertyValue('padding-left')}));
   assert.deepEqual(nativeSpacing,{gap:'',padding:''},'Reprendre les espacements des moteurs GitHub originaux');
   const buttons=panel.locator('button[data-count]');
   assert.equal(await buttons.count(),3,'Trois boutons sur une rangée');
   const boxes=await buttons.evaluateAll(nodes=>nodes.map(el=>{const r=el.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height}}));
   const widths=boxes.map(b=>b.width);
   assert.ok(Math.max(...widths)-Math.min(...widths)<4,'Boutons 4/10/20 de largeur égale comme le moteur original : '+JSON.stringify(widths));
   assert.ok(Math.max(...boxes.map(b=>b.y))-Math.min(...boxes.map(b=>b.y))<4,'Les trois boutons restent sur une seule ligne');
   const cupBox=await mastery.boundingBox();
   const last=boxes[2];
   assert.ok(cupBox && cupBox.y>=last.y+last.height-2,'Coupe placée sous les boutons, pas dans le tableau');
   assert.ok(cupBox.x>=last.x-3 && cupBox.x+cupBox.width<=last.x+last.width+3,'Coupe sous le bouton 20 calculs (zone croix jaune)');
   // Simuler un trophée déjà acquis UNIQUEMENT dans le stockage isolé du jeu.
   await cups.first().evaluate(()=>{
    const api=window.MathasPoints;
    const snapshot=api.readTrophies();snapshot.sudden[0]=true;
    localStorage.setItem(api.trophyKey,JSON.stringify(snapshot));
   });
   await cups.first().locator('b').waitFor({timeout:5000});
   assert.match(await cups.first().getAttribute('title'),/obtenu/);
   await frame.locator('#startThreeLives').click();
   await frame.locator('#scorePill').waitFor();
   await frame.locator('#scorePill').getAttribute('title');
   assert.match(await frame.locator('#scorePill').textContent(),/^Score : 0 pts$/,'Score final affiché dès le départ');
   assert.deepEqual(traffic,[],'Aucune connexion à Supabase pendant la simulation');
   await page.close();
  }
 }finally{await browser.close()}
});

test('LAB V2 — HARD deux boutons et coupes',async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  for(const mobile of [false,true]){
   const page=await browser.newPage({viewport:mobile?{width:320,height:650}:{width:1440,height:900},reducedMotion:'reduce'});
   await page.goto('http://127.0.0.1:8123/essai-objectif-record-3-vies.html',{waitUntil:'domcontentloaded'});
   const frame=page.frameLocator('#game');
   await frame.locator('#startThreeLives').waitFor({timeout:20000});
   await frame.locator('#levelBtn').click();
   await frame.locator('#levelMenu .level-option.hard').click();
   const pair=frame.locator('.mlab-pair');
   await pair.first().waitFor({timeout:20000});
   assert.equal(await pair.count(),3,'Un duo de boutons sur chacun des trois HARD');
   const b=pair.first().locator('button');
   assert.equal(await b.count(),2,'Le bouton original est partagé en deux moitiés');
   assert.match(await b.nth(0).textContent(),/3 vies/);
   assert.match(await b.nth(1).textContent(),/Mort subite/);
   const a=await b.nth(0).boundingBox(),c=await b.nth(1).boundingBox();
   assert.ok(a&&c&&a.x+a.width<=c.x+2,'Aucun chevauchement à 320 px');
   const cups=frame.locator('.mlab-hard .mlab-cup');
   await cups.first().waitFor({timeout:5000});
   assert.equal(await cups.count(),9,'Trois coupes dans chaque carte HARD');
   assert.equal(await b.nth(0).isDisabled(),false,'3 vies HARD 1 accessible');
   await b.nth(0).click();
   const score=frame.locator('#hardSessionScore,#hardScore').first();
   await score.waitFor({timeout:15000});
   assert.match(await score.textContent(),/^Score : 0 pts$/,'Score HARD direct');
   await page.close();
  }
 }finally{await browser.close()}
});
