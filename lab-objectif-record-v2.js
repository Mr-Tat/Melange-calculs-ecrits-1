/* Prototype laboratoire uniquement : aucun vrai XP, trophée ou résultat Connect. */
(function(){
function labUI(){
  const colors=["#c78a52","#b7cad9","#f6c74d"],keys=["bronze","silver","gold"];
  const m=d=>d.hard?3.375*Math.pow(1.2,d.level-1):Math.pow(1.5,d.level-1);
  window.MathasLabV2Update=d=>{
    if(!d||!["classic","sudden","three-lives"].includes(d.mode))return;
    const target=document.getElementById(d.hard?"hardSessionScore":"sessionScore")||document.getElementById(d.hard?"hardScore":"scorePill");
    if(!target)return;
    const unit=d.mode==="sudden"?2:d.mode==="three-lives"?1:d.total===4?4:d.total===10?3:2;
    const value=Math.round(d.score*m(d)*unit);
    if(target.textContent!=="Score : "+value+" pts")target.textContent="Score : "+value+" pts";
    target.title=d.score+" calcul(s) correct(s) · score LAB";
    if(d.hard&&d.mode==="three-lives"){
      const meta=document.getElementById("hardSessionMeta")||document.getElementById("hardMeta");
      if(meta){const tx=meta.textContent.replace(/\s*·\s*❤️+\s*$/,"")+" · "+"❤️".repeat(Math.max(0,d.hearts||0));if(meta.textContent!==tx)meta.textContent=tx}
    }
  };
  function cup(i,done,caption){
    const a=done?"#25232d":colors[i],b=done?"#111116":"#725530";
    return '<span class="mlab-cup" role="img" aria-label="'+caption+(done?" obtenu":" à gagner")+'" title="'+caption+(done?" — obtenu":" — à gagner")+'"><svg viewBox="0 0 48 50" aria-hidden="true"><path d="M12 5h24v12c0 11-5 18-12 18S12 28 12 17V5Z" fill="'+a+'" stroke="'+b+'" stroke-width="2"/><path d="M13 10H5v6c0 10 6 13 12 13M35 10h8v6c0 10-6 13-12 13" stroke="'+b+'" stroke-width="4" fill="none" stroke-linecap="round"/><path d="M22 33h4v8h-4Z" fill="'+b+'"/><path d="M14 44h20v4H14Z" fill="'+a+'" stroke="'+b+'" stroke-width="2"/></svg>'+(done?'<b aria-hidden="true">✓</b>':'')+'</span>'
  }
  const upd=(n,s)=>{if(n&&n.innerHTML!==s)n.innerHTML=s};
  function trophies(){
    // Laboratoire isolé : rendre l'entrée HARD essayable, sans changer les
    // règles internes des niveaux HARD ni les jeux officiels GitHub/Connect.
    if(window.__mathasThreeLivesDemo){
      document.querySelectorAll('#menuScreen option[value="__hard__"],#menuScreen .hard-option,#menuScreen .level-option.hard').forEach(el=>{
        if(el.disabled)el.disabled=false;
        el.classList.remove('progress-locked');
        el.removeAttribute('aria-disabled');
        if(el.title?.includes('Débloque HARD'))el.title='HARD accessible en essai isolé du laboratoire';
      });
    }
    let t;try{t=window.MathasPoints?.readTrophies?.()}catch{return}
    if(!t)return;
    [...document.querySelectorAll("#menuScreen .mathas-v535-table tbody tr:not(.mathas-v535-hard-row)")].forEach((row,i)=>{
      const level=Number((row.querySelector(".mathas-v535-level-label")?.textContent||"").match(/[123]/)?.[0]||i+1);
      if(level<1||level>3)return;
      const cell=row.lastElementChild;if(!cell)return;
      let slot=cell.querySelector(".mlab-mastery");if(!slot){slot=document.createElement("span");slot.className="mlab-mastery";cell.appendChild(slot)}
      const done=[4,10,20].every(n=>t.mastery?.[n]?.[level-1]===true);
      upd(slot,cup(level-1,done,"Coupe de maîtrise niveau "+level+" : 4/4, 10/10, 20/20"));
    });
    // Repli propre pour Mélange et tout moteur dont le tableau natif n'est pas affiché.
    const nativeRows=document.querySelectorAll("#menuScreen .mathas-v535-table tbody tr:not(.mathas-v535-hard-row)");
    const anchor=document.querySelector("#menuScreen .classic-grid")||document.querySelector("#menuScreen .classic-count-picker");
    let fallback=document.querySelector("#menuScreen .mlab-mastery-fallback");
    if(nativeRows.length){fallback?.remove()}
    else if(anchor){
      if(!fallback){fallback=document.createElement("div");fallback.className="mlab-mastery mlab-mastery-fallback";anchor.insertAdjacentElement("afterend",fallback)}
      const chosen=Number(document.querySelector("#menuScreen #levelSelect")?.value||document.querySelector("#menuScreen #classicLevel")?.value||1);
      const level=chosen>=1&&chosen<=3?chosen:1;
      const done=[4,10,20].every(n=>t.mastery?.[n]?.[level-1]===true);
      upd(fallback,'<span>Niv. '+level+' · trophée 100 % </span>'+cup(level-1,done,"Maîtrise niveau "+level+" : 4/4, 10/10, 20/20"));
    }
    const btn=document.getElementById("startSudden")||document.getElementById("suddenBtn");
    if(btn){
      const meta=btn.querySelector(".score-mode-meta")||btn;
      let slot=meta.querySelector(".mlab-sudden");if(!slot){slot=document.createElement("span");slot.className="mlab-sudden";meta.appendChild(slot)}
      upd(slot,keys.map((_,i)=>cup(i,t.sudden?.[i]===true,"Mort subite niveau "+(i+1)+" : 25 calculs")).join(""));
      const bonus=btn.querySelector(".score-mode-bonus");if(bonus&&bonus.textContent!=="Score ×2")bonus.textContent="Score ×2";
      if(btn.getAttribute("aria-label")?.includes("20 pour cent"))btn.setAttribute("aria-label","Mort subite · Score ×2");
    }
    document.querySelectorAll("#hardMenuScreen .hard-level-card,#hardMenu .hard-card").forEach((card,i)=>{
      const level=Number((card.querySelector("h3")?.textContent||"").match(/[123]/)?.[0]||i+1);
      if(level<1||level>3)return;
      let slot=card.querySelector(".mlab-hard");if(!slot){slot=document.createElement("div");slot.className="mlab-hard";card.appendChild(slot)}
      upd(slot,keys.map((c,k)=>cup(k,t.hardAwards?.[c]?.[level-1]===true,"HARD "+level+" · "+[3,5,10][k]+" réussites Mort subite")).join(""));
    });
    const note=document.querySelector("#hardMenuScreen .hard-welcome-v6,#hardMenu .hard-welcome-v6");
    if(note?.textContent.includes("La faute est toujours fatale"))note.textContent="Deux défis HARD : 3 vies ou Mort subite.";
  }
  const css=document.createElement("style");
  css.textContent=[
   ".mlab-cup{width:27px;height:29px;display:inline-flex;position:relative;flex:none;vertical-align:middle;margin:0 2px;filter:drop-shadow(0 1px 2px #0009)}",
   ".mlab-cup svg{display:block;width:100%;height:100%}",
   ".mlab-cup b{position:absolute;right:-3px;bottom:-2px;border-radius:50%;background:#173b2e;color:#bcffd0;border:1px solid #6cba8c;width:14px;height:14px;font:900 11px system-ui;display:grid;place-items:center}",
   ".mlab-mastery{display:inline-flex;margin-left:8px;vertical-align:middle}",
   ".mlab-mastery-fallback{display:flex;align-items:center;justify-content:flex-end;gap:5px;margin:6px 0 0;color:#c3d2e4;font:700 11px system-ui}",
   ".mlab-sudden,.mlab-hard{display:flex;align-items:center;justify-content:center;gap:3px}",
   ".mlab-sudden{margin-top:4px;flex-wrap:nowrap}.mlab-hard{margin-top:10px}",
   "#hardMenuScreen .mlab-pair,#hardMenu .mlab-pair{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px;width:100%;min-width:0}",
   ".mlab-pair>button{box-sizing:border-box;min-width:0;width:100%;min-height:54px;padding:9px 3px;border-radius:12px;display:flex;align-items:center;justify-content:center;color:white;font:900 .8rem system-ui}",
   ".mlab-pair>.mlab-three{background:linear-gradient(155deg,#754287,#502963)!important;border:1px solid #b28ace!important}",
   ".mlab-pair>.hard-sudden,.mlab-pair>.hard-start[data-mode='sudden']{background:linear-gradient(155deg,#a32b47,#7e253b)!important;border:1px solid #ec889a!important}",
   ".mlab-pair>button:disabled{opacity:.4;filter:grayscale(.5);cursor:not-allowed}",
   "@media(max-width:380px){.mlab-cup{width:23px;height:25px}.mlab-pair>button{font-size:.68rem}}"
  ].join("\n");document.head.appendChild(css);
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",trophies);else trophies();
  setInterval(()=>{if(!document.hidden)trophies()},850);
}
function patch(game,kind){
  function swap(a,b,why){const parts=game.split(a);if(parts.length!==2)throw Error(kind+" "+why+" (matches "+(parts.length-1)+")");game=parts.join(b)}
  const hookNormal="queueMicrotask(()=>window.MathasLabV2Update?.({mode:session.mode,level:session.level,score:session.score,total:session.total??session.totalCalculs??null,hard:false}));";
  const hookHard="queueMicrotask(()=>window.MathasLabV2Update?.({mode:hardSession.mode,level:hardSession.level,score:hardSession.score,hearts:hardSession.hearts,hard:true}));";
  swap("function updateBar(){","function updateBar(){"+hookNormal,"score normal");
  const fn=kind==="mix"?"updateHardBar":"updateHardHeader";
  swap("function "+fn+"(){","function "+fn+"(){"+hookHard,"score HARD");
  if(kind==="mix"){
    swap("if(mode==='sudden'&&!hardSuddenUnlocked(level))return;","if(mode==='sudden'&&!hardSuddenUnlocked(level))return;if(mode==='three-lives'&&!hardThreeUnlocked(level))return;","verrou HARD");
    swap("hardSession={level,mode,","hardSession={level,mode,hearts:mode==='three-lives'?3:null,","vies HARD");
    swap("if(hardSession.mode==='sudden'){hardSession.score++;const d=hardBest()","if(hardSession.mode==='three-lives')hardSession.score++;if(hardSession.mode==='sudden'){hardSession.score++;const d=hardBest()","score 3 vies");
    swap("  markErrors(hardState,0,true);\n  if(hardSession.mode==='sudden'){",
       "  if(hardSession.mode==='three-lives'){hardSession.hearts--;hardSession.completed++;if(hardSession.hearts===0){hardPhase='ended';$('hardPrimary').textContent='Retour au menu HARD';setFeedbackText('Trois vies perdues · Score : '+hardSession.score,'bad',true)}else{hardPhase='review';$('hardPrimary').textContent='Calcul suivant';setFeedbackText('Une vie perdue · '+hardSession.hearts+' restantes','bad',true)}updateHardBar();return}\n  markErrors(hardState,0,true);\n  if(hardSession.mode==='sudden'){","troisième erreur");
    const re=/<button class="hard-sudden" \$\{suddenOpen\?'':'disabled'\}>💀 Mort subite<\/button>/g;
    if((game.match(re)||[]).length!==1)throw Error("mix button not found");
    game=game.replace(re,'<div class="mlab-pair"><button type="button" class="mlab-three" ${challengeOpen?\'\':\'disabled\'}>❤️ 3 vies</button><button class="hard-sudden" ${suddenOpen?\'\':\'disabled\'}>💀 Mort subite</button></div>');
    swap("card.querySelector('.hard-sudden').onclick=()=>startHard(l,'sudden');","card.querySelector('.hard-sudden').onclick=()=>startHard(l,'sudden');card.querySelector('.mlab-three').onclick=()=>startHard(l,'three-lives');","clic HARD");
    swap("const label=hardSession.mode==='training'?'🧠 Entraînement':hardSession.mode==='challenge'?'🎯 5 calculs':'💀 Mort subite';","const label=hardSession.mode==='training'?'🧠 Entraînement':hardSession.mode==='three-lives'?'❤️ 3 vies':hardSession.mode==='challenge'?'🎯 5 calculs':'💀 Mort subite';","titre HARD");
  }else{
    swap("if(mode==='sudden'&&!hardSuddenUnlocked(spec.level))return;","if(mode==='sudden'&&!hardSuddenUnlocked(spec.level))return;if(mode==='three-lives'&&!hardThreeUnlocked(spec.level))return;","verrou HARD");
    if(kind==="mul"){
      swap("hardSession={...spec,mode,","hardSession={...spec,mode,hearts:mode==='three-lives'?3:null,","vies HARD");
      swap("if(hardSession.mode==='sudden'){hardSession.score++;saveHardBest()}","if(hardSession.mode==='three-lives')hardSession.score++;if(hardSession.mode==='sudden'){hardSession.score++;saveHardBest()}","score 3 vies");
      swap("    markHardErrors();\n    if(hardSession.mode==='sudden'){",
      "    if(hardSession.mode==='three-lives'){hardSession.hearts--;hardSession.completed++;if(hardSession.hearts===0){hardPhase='ended';setHardEnabled(false);hardPrimary.textContent='Retour au menu HARD';setHardFeedback('Trois vies perdues · Score : '+hardSession.score)}else{hardPhase='review';setHardEnabled(false);hardPrimary.textContent='Calcul suivant';setHardFeedback('Une vie perdue · '+hardSession.hearts+' restantes')}updateHardHeader();return}\n    markHardErrors();\n    if(hardSession.mode==='sudden'){","troisième erreur");
      const re=/<button class="hard-sudden" \$\{suddenOpen\?'':'disabled'\}>💀 Mort subite<\/button>/g;
      if((game.match(re)||[]).length!==1)throw Error("mul button not found");
      game=game.replace(re,'<div class="mlab-pair"><button class="mlab-three" ${challengeOpen?\'\':\'disabled\'}>❤️ 3 vies</button><button class="hard-sudden" ${suddenOpen?\'\':\'disabled\'}>💀 Mort subite</button></div>');
      swap("c.querySelector('.hard-sudden').onclick=()=>startHard(spec,'sudden');","c.querySelector('.hard-sudden').onclick=()=>startHard(spec,'sudden');c.querySelector('.mlab-three').onclick=()=>startHard(spec,'three-lives');","clic HARD");
      swap("const label=hardSession.mode==='training'?'🧠 Entraînement':hardSession.mode==='challenge'?'🎯 5 calculs':'💀 Mort subite';","const label=hardSession.mode==='training'?'🧠 Entraînement':hardSession.mode==='three-lives'?'❤️ 3 vies':hardSession.mode==='challenge'?'🎯 5 calculs':'💀 Mort subite';","titre HARD");
    }else{
      swap("score:0,completed:0,spec,currentFirstTry:true","score:0,completed:0,spec,currentFirstTry:true,hearts:mode==='three-lives'?3:null","vies HARD");
      swap("if(hardSession.mode==='sudden'){hardSession.score++;saveBest()}","if(hardSession.mode==='three-lives')hardSession.score++;if(hardSession.mode==='sudden'){hardSession.score++;saveBest()}","score 3 vies");
      swap("    markHardErrors();\n    if(hardSession.mode==='sudden'){",
      "    if(hardSession.mode==='three-lives'){hardSession.hearts--;hardSession.completed++;if(hardSession.hearts===0){hardPhase='ended';setHardEnabled(false);clearBtn.disabled=true;primary.textContent='Retour au menu HARD';setFeedback('Trois vies perdues · Score : '+hardSession.score,'bad')}else{hardPhase='review';setHardEnabled(false);clearBtn.disabled=true;primary.textContent='Calcul suivant';setFeedback('Une vie perdue · '+hardSession.hearts+' restantes','bad')}updateHardHeader();return}\n    markHardErrors();\n    if(hardSession.mode==='sudden'){","troisième erreur");
      const re=/<button type="button" class="hard-start" data-level="\$\{l\.level\}" data-mode="sudden" \$\{suddenOpen\?'':'disabled'\}>💀 Mort subite<\/button>/g;
      if((game.match(re)||[]).length!==1)throw Error(kind+" button not found");
      game=game.replace(re,'<div class="mlab-pair"><button type="button" class="hard-start mlab-three" data-level="${l.level}" data-mode="three-lives" ${challengeOpen?\'\':\'disabled\'}>❤️ 3 vies</button><button type="button" class="hard-start" data-level="${l.level}" data-mode="sudden" ${suddenOpen?\'\':\'disabled\'}>💀 Mort subite</button></div>');
      swap("const modeLabel=hardSession.mode==='training'?'🧠 Entraînement':hardSession.mode==='challenge'?'🎯 5 calculs':'💀 Mort subite';","const modeLabel=hardSession.mode==='training'?'🧠 Entraînement':hardSession.mode==='three-lives'?'❤️ 3 vies':hardSession.mode==='challenge'?'🎯 5 calculs':'💀 Mort subite';","titre HARD");
    }
  }
  swap("</body>","<scr"+"ipt>("+labUI.toString()+")();</scr"+"ipt></body>","chargement");
  return game;
}
window.MathasLabV2={patch};
})();
