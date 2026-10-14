import { LEVELS } from "./levels.js";
import { iconRow, iconSvg } from "../_shared/svgIcons.js";

// Script de « درب المهارات », repris tel quel. Modifications WLADZ :
// objets 3D remplacés par des images liées à chaque carte et question,
// carte des stations dans l'accueil, textes anglais retirés, une sauvegarde par enfant, et l'événement « skills:finished »
// (réponses de la station) pour que le serveur accorde +1 point par station gagnée.
const WLADZ_PLAYER = window.__WLADZ_PLAYER__ || null;
const RANKS=[[0,'مستكشف'],[150,'مغامر'],[330,'قائد'],[520,'حكيم'],[700,'بطل المهارات']];
const PRAISE=['ممتاز! عقلك يعمل كالبطل.','قرار رائع!','أحسنت، هذا بالضبط ما يفعله القائد.','إجابة ذكية!','واصل، أنت على الطريق الصحيح!'];
const NUDGE=['لا بأس، الخطأ جزء من التعلّم.','قريب! اقرأ التفسير وستتذكره للأبد.','كل بطل تعثّر قبل أن ينجح.'];
const RESULT_MSG={3:'إتقان كامل! أنت قدوة في هذه المهارة.',2:'أداء قوي! نجمة أخرى وتصل إلى الإتقان.',1:'فتحت الطريق! أعد المحاولة لتجمع نجومًا أكثر.',0:'لم تفتح المحطة بعد. راجع البطاقات وجرّب من جديد، أنت قادر.'};

/* ---------- state ---------- */
const KEY='skills-trail-v1'+(WLADZ_PLAYER?':'+WLADZ_PLAYER.id:'');
let S={name:WLADZ_PLAYER?.name||'',best:{},stars:{}};
try{const v=JSON.parse(localStorage.getItem(KEY)||'null'); if(v) S=Object.assign(S,v);}catch(e){}
function save(){try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){}}
const starsOf=id=>S.stars[id]||0;
const totalStars=()=>LEVELS.reduce((a,l)=>a+starsOf(l.id),0);
const xp=()=>LEVELS.reduce((a,l)=>a+(S.best[l.id]||0)*20+starsOf(l.id)*10,0);
const unlocked=i=>i===0||starsOf(LEVELS[i-1].id)>=1;
const allDone=()=>LEVELS.every(l=>starsOf(l.id)>=1);
const $=s=>document.querySelector(s);
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const starSvg=(on,c)=>`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.5l2.9 6.1 6.6.8-4.9 4.5 1.3 6.6L12 17.2l-5.9 3.3 1.3-6.6L2.5 9.4l6.6-.8z" fill="${on?(c||'#ffc857'):'#cfe4f8'}" stroke="${on?'#fff6':'none'}" stroke-width=".8"/></svg>`;

/* ---------- pictures ---------- */
// WLADZ : une image (suite d'icônes, jamais d'emoji) pour chaque station, carte et question,
// à la place de l'objet 3D. Même ordre que LEVELS (levels.js).
const PICS={
  1:{level:['brain','message-circle-more','heart'],
    cards:[['angry','annoyed','frown','laugh'],['speech','frown','smile'],['timer','wind','smile'],['puzzle','circle-help','circle-check'],['angry','bird']],
    quiz:[['users','annoyed'],['tag','message-circle-more'],['list-ordered','circle-help'],['notebook-pen','frown','book-open'],['angry','smile']]},
  2:{level:['shield','biceps-flexed'],
    cards:[['brick-wall','brick-wall','trophy'],['hand','ban'],['users','pointer','frown'],['door-open','footprints'],['message-circle','star']],
    quiz:[['school','footprints','volleyball'],['users','users','circle-help'],['trending-up','star'],['person-standing','eye','hand'],['footprints','door-open']]},
  3:{level:['handshake','heart'],
    cards:[['footprints','footprints','heart'],['ban','hand-fist','message-circle','smartphone'],['eye','heart-handshake','megaphone'],['shield','graduation-cap'],['message-square','handshake','message-square']],
    quiz:[['person-standing','speech','heart-handshake'],['smartphone','camera','ban'],['shield','graduation-cap'],['hand-heart','message-circle-more'],['message-square','smile','message-square']]},
  4:{level:['search','smartphone'],
    cards:[['circle-help','circle-help','circle-help'],['newspaper','circle-alert','fishing-hook'],['image','search-check'],['newspaper','newspaper','scale'],['lock','house','key-round']],
    quiz:[['mail','triangle-alert','repeat'],['search','newspaper','calendar'],['image','search'],['globe','circle-help'],['gift','map-pin','ban']]},
  5:{level:['route','sprout'],
    cards:[['brain','construction'],['repeat-1','triangle-alert'],['ban','volleyball'],['volleyball','book-open','bed','palette'],['hand','users-round']],
    quiz:[['ban','repeat-1','triangle-alert'],['brain','sprout'],['party-popper','ban','pill'],['footprints','speech','heart'],['users','message-circle','heart-handshake']]},
  6:{level:['brick-wall','handshake','construction'],
    cards:[['users','users-round','target'],['ear','message-circle'],['hand','message-circle','heart'],['scale','handshake'],['brush','tree-deciduous','building-2']],
    quiz:[['clipboard-list','users','circle-help'],['hand','message-circle','alarm-clock'],['ear','smile'],['volleyball','dices','scale'],['brush','tree-deciduous','smile']]},
};
const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
// Affiche une image dans la boîte de la station ; mood = 'good' | 'bad' | 'cheer' anime l'image.
function showPicture(pic,caption,mood){
  const box=$('#levelStage');if(!box)return;
  box.innerHTML=`<div class="pic" role="img" aria-label="${esc(caption)}">${pic}</div><div class="pic-caption">${esc(caption)}</div>`;
  if(mood)picMood(mood);
}
function picMood(mood){
  const el=$('#levelStage .pic');if(!el||reduce)return;
  el.classList.remove('good','bad','cheer');void el.offsetWidth;el.classList.add(mood);
}

/* ---------- home ---------- */
function rankInfo(){const x=xp();let i=0;RANKS.forEach((r,k)=>{if(x>=r[0])i=k});const next=RANKS[i+1];return{name:RANKS[i][1],x,next,pct:next?((x-RANKS[i][0])/(next[0]-RANKS[i][0]))*100:100};}
function renderChips(){$('#starsChip').textContent=totalStars();$('#xpChip').textContent=xp();}
function nextIndex(){const i=LEVELS.findIndex((l,k)=>unlocked(k)&&starsOf(l.id)===0);return i<0?LEVELS.length-1:i;}
function renderHome(){
  renderChips();
  $('#nameIn').value=S.name||'';
  const ri=rankInfo();$('#rankName').textContent=ri.name;
  $('#rankNext').textContent=ri.next?`${ri.x} / ${ri.next[0]} خبرة للرتبة التالية`:`${ri.x} خبرة · أعلى رتبة!`;
  $('#rankBar').style.width=ri.pct+'%';
  const ni=nextIndex();
  $('#goBtn').textContent=totalStars()?`تابع: المحطة ${ni+1}`:'ابدأ الرحلة';
  // map (dans l'accueil, à la place de l'objet 3D)
  const step=124,top=48,H=top+step*(LEVELS.length-1)+120;
  const map=$('#map');map.style.height=H+'px';
  const X=i=>i%2?28:72;
  let d='',dDone='';
  LEVELS.forEach((l,i)=>{if(!i)return;const x0=X(i-1),y0=top+step*(i-1),x1=X(i),y1=top+step*i;const seg=`M${x0} ${y0} C${x0} ${y0+step*.55} ${x1} ${y1-step*.55} ${x1} ${y1} `;d+=seg;if(unlocked(i))dDone+=seg;});
  let html=`<svg viewBox="0 0 100 ${H}" preserveAspectRatio="none" aria-hidden="true">
    <path d="${d}" fill="none" stroke="#cfe4f8" stroke-width="10" stroke-linecap="round" vector-effect="non-scaling-stroke"/>
    <path d="${d}" fill="none" stroke="#9ec3ea" stroke-width="2" stroke-dasharray="2 12" stroke-linecap="round" vector-effect="non-scaling-stroke"/>
    <path d="${dDone}" fill="none" stroke="#ffc857" stroke-width="5" stroke-linecap="round" vector-effect="non-scaling-stroke" style="filter:drop-shadow(0 0 6px #ffc857aa)"/></svg>`;
  LEVELS.forEach((l,i)=>{
    const u=unlocked(i),st=starsOf(l.id),cur=i===ni&&u&&!allDone();
    html+=`<div class="node ${u?'':'locked'} ${cur?'current':''}" style="left:${X(i)}%;top:${top+step*i}px;--c:${l.color}">
      <button class="orb" data-i="${i}" aria-label="المستوى ${i+1}: ${esc(l.ar)}${u?'':' (مقفل)'}">${u?(i+1):'<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>'}</button>
      <div class="lbl">${esc(l.ar)}<small>المحطة ${i+1}</small></div>
      <div class="stars">${[1,2,3].map(n=>starSvg(n<=st)).join('')}</div></div>`;
  });
  map.innerHTML=html;
  map.querySelectorAll('.orb').forEach(b=>b.onclick=()=>{const i=+b.dataset.i;if(unlocked(i))openLevel(i);else toastLocked(b);});
  // certificate
  $('#certSlot').innerHTML=allDone()?`<div class="cert"><div class="eyebrow">شهادة إتمام الرحلة</div><h3>بطل المهارات الحياتية</h3><div class="who">${esc(S.name||'البطل')}</div><p style="color:var(--muted);margin:6px 0 0">أتمّ المحطات الست بـ ${totalStars()} نجمة من 18 · ${xp()} خبرة</p></div>`:'';
}
function toastLocked(b){b.animate([{transform:'translateX(0)'},{transform:'translateX(-6px)'},{transform:'translateX(6px)'},{transform:'translateX(0)'}],{duration:300});}
$('#nameIn').addEventListener('input',e=>{S.name=e.target.value.trim();save();});
$('#goBtn').onclick=()=>openLevel(nextIndex());
$('#homeBtn').onclick=$('#backBtn').onclick=()=>show('home');
$('#exitBtn').onclick=()=>window.dispatchEvent(new CustomEvent('skills:exit'));

function show(id){
  $('#home').hidden=id!=='home';$('#level').hidden=id!=='level';
  if(id==='home')renderHome();
  window.scrollTo({top:0,behavior:reduce?'auto':'smooth'});
}

/* ---------- level flow ---------- */
let G=null;
function shuffle(a){a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
function openLevel(i){
  const L=LEVELS[i];
  G={i,L,phase:0,card:0,seen:new Set([0]),flipped:false,q:0,right:0,streak:0,pts:0,picked:[],qs:L.quiz.map(q=>({...q,order:shuffle(q.o.map((_,k)=>k))}))};
  $('#level').style.setProperty('--c',L.color);
  $('#lvlTag').textContent=`المحطة ${i+1}`;
  show('level');
  renderPanel();
}
function setSteps(){[...$('#steps').children].forEach((s,k)=>s.classList.toggle('on',k===G.phase));}
function renderPanel(){
  setSteps();const L=G.L,p=$('#panel'),P=PICS[L.id];
  if(G.phase===0)showPicture(iconRow(P.level),L.ar);
  else if(G.phase===1)showPicture(iconRow(P.cards[G.card]),L.cards[G.card].k);
  else if(G.phase===2)showPicture(iconRow(P.quiz[G.q]),`سؤال ${G.q+1} من ${G.qs.length}`);
  else showPicture(iconRow(G.stars>=1?['trophy','party-popper']:['biceps-flexed','book-open']),G.stars>=1?'المحطة مكتملة':'حاول من جديد',G.stars>=1?'cheer':null);
  if(G.phase===0){
    p.innerHTML=`<h2>${esc(L.ar)}</h2>
      <p style="color:var(--muted);font-weight:600">${esc(L.sub)}</p><p>${esc(L.goal)}</p>
      <div class="facts"><div class="fact"><b>5</b><span>بطاقات تعليمية</span></div><div class="fact"><b>5</b><span>مواقف للتحدّي</span></div><div class="fact"><b>${starsOf(L.id)}/3</b><span>نجومك الحالية</span></div></div>
      <div class="row"><button class="btn" id="go">ابدأ البطاقات</button>${starsOf(L.id)?'<button class="btn ghost" id="skip">انتقل للتحدّي مباشرة</button>':''}</div>`;
    $('#go').onclick=()=>{G.phase=1;renderPanel();};
    const sk=$('#skip');if(sk)sk.onclick=()=>{G.phase=2;renderPanel();};
  }
  else if(G.phase===1){
    const c=L.cards[G.card],n=L.cards.length,all=G.seen.size===n;
    p.innerHTML=`<div class="fc-count"><span>بطاقة ${G.card+1} من ${n}</span><span class="dots">${L.cards.map((_,k)=>`<i class="${G.seen.has(k)?'seen':''} ${k===G.card?'now':''}"></i>`).join('')}</span></div>
      <button class="flip ${G.flipped?'on':''}" id="flip" aria-label="اقلب البطاقة">
        <div class="flip-in">
          <div class="face front"><span class="num">${G.card+1}</span><div class="k">${esc(c.k)}</div><small>اضغط لقلب البطاقة ${iconSvg('rotate-cw')}</small></div>
          <div class="face back"><div class="k">${esc(c.k)}</div><div>${esc(c.b)}</div></div>
        </div></button>
      <div class="row"><button class="btn ghost" id="prev" ${G.card?'':'disabled'}>${iconSvg('arrow-right')} السابقة</button>
        ${G.card<n-1?`<button class="btn ghost" id="next">التالية ${iconSvg('arrow-left')}</button>`:''}
        <button class="btn" id="toQuiz" ${all?'':'disabled'} style="margin-inline-start:auto">${all?'أنا جاهز للتحدّي!':`اقرأ كل البطاقات (${G.seen.size}/${n})`}</button></div>`;
    $('#flip').onclick=()=>{G.flipped=!G.flipped;$('#flip').classList.toggle('on',G.flipped);if(G.flipped)picMood('good');};
    $('#prev').onclick=()=>{G.card--;G.flipped=false;renderPanel();};
    const nx=$('#next');if(nx)nx.onclick=()=>{G.card++;G.seen.add(G.card);G.flipped=false;renderPanel();};
    $('#toQuiz').onclick=()=>{G.phase=2;renderPanel();};
  }
  else if(G.phase===2){
    const q=G.qs[G.q],n=G.qs.length;
    p.innerHTML=`<div class="qtop"><span>سؤال ${G.q+1} من ${n}</span><span class="streak">${G.streak>=2?`${iconSvg('flame')} سلسلة ${G.streak}`:''}</span><span>+${G.pts} خبرة</span></div>
      <div class="qbar"><div style="width:${G.q/n*100}%"></div></div>
      <p class="q">${esc(q.q)}</p>
      <div class="opts" id="opts">${q.order.map((k,j)=>`<button class="opt" data-k="${k}"><span class="l">${'أبجد'[j]}</span><span>${esc(q.o[k])}</span></button>`).join('')}</div>
      <div id="fb"></div>`;
    p.querySelectorAll('.opt').forEach(b=>b.onclick=()=>answer(+b.dataset.k,b));
  }
  else{
    const st=G.stars,L2=LEVELS[G.i+1],pass=st>=1;
    p.innerHTML=`<div class="res"><div class="eyebrow">${pass?'المحطة مكتملة':'محاولة جيدة'}</div>
      <div class="big-stars">${[1,2,3].map(n=>starSvg(n<=st)).join('')}</div>
      <div class="score">${G.right} / ${G.qs.length}</div>
      <p style="color:var(--muted);margin-top:6px">+${G.pts} خبرة في هذه الجولة${G.newBest?' · رقم قياسي جديد!':''}</p>
      <p style="font-size:19px;font-weight:600">${RESULT_MSG[st]}</p>
      ${G.firstWin?`<p class="wladz-point">${iconSvg('star',{fill:'currentColor'})} +1 نقطة في حسابك</p>`:''}
      <div class="row">
        ${pass&&L2?`<button class="btn" id="nxt">المحطة التالية: ${esc(L2.ar)} ${iconSvg('arrow-left')}</button>`:''}
        ${pass&&!L2?`<button class="btn" id="fin">استلم شهادتك ${iconSvg('trophy')}</button>`:''}
        ${st<3?`<button class="btn ${pass?'ghost':''}" id="again">أعد المحاولة</button>`:''}
        <button class="btn ghost" id="cards">راجع البطاقات</button>
      </div></div>`;
    const nx=$('#nxt');if(nx)nx.onclick=()=>openLevel(G.i+1);
    const fn=$('#fin');if(fn)fn.onclick=()=>show('home');
    const ag=$('#again');if(ag)ag.onclick=()=>openLevel(G.i);
    $('#cards').onclick=()=>{G.phase=1;G.card=0;G.flipped=false;renderPanel();};
  }
}
function answer(k,btn){
  const q=G.qs[G.q],ok=k===q.a,box=$('#opts');
  G.picked[G.q]=k;
  box.classList.add('done');
  box.querySelectorAll('.opt').forEach(b=>{if(+b.dataset.k===q.a)b.classList.add('ok');});
  if(!ok)btn.classList.add('no');
  if(ok){G.right++;G.streak++;G.pts+=20+(G.streak>=3?10:0);picMood('good');}else{G.streak=0;picMood('bad');}
  const last=G.q===G.qs.length-1;
  const msg=ok?PRAISE[Math.floor(Math.random()*PRAISE.length)]:NUDGE[Math.floor(Math.random()*NUDGE.length)];
  $('#fb').innerHTML=`<div class="why ${ok?'':'bad'}"><b>${ok?iconSvg('circle-check')+' '+msg:iconSvg('circle-x')+' '+msg}</b>${esc(q.why)}</div>
    <div class="row" style="margin-top:14px"><button class="btn" id="nq">${last?'اعرض النتيجة':`السؤال التالي ${iconSvg('arrow-left')}`}</button></div>`;
  $('.qtop span:last-child').textContent=`+${G.pts} خبرة`;
  $('.qbar div').style.width=((G.q+1)/G.qs.length*100)+'%';
  $('#nq').focus({preventScroll:true});
  $('#nq').onclick=()=>{if(last)finish();else{G.q++;renderPanel();}};
}
function finish(){
  const r=G.right,st=r===5?3:r===4?2:r===3?1:0,id=G.L.id;
  G.firstWin=st>=1&&starsOf(id)===0;
  window.dispatchEvent(new CustomEvent('skills:finished',{detail:{levelId:id,answers:G.picked}}));
  G.stars=st;G.newBest=r>(S.best[id]||0);
  S.best[id]=Math.max(S.best[id]||0,r);S.stars[id]=Math.max(starsOf(id),st);save();
  G.phase=3;renderPanel();renderChips();
  if(st>=1)confetti(st);
}

/* ---------- confetti ---------- */
function confetti(level){
  if(reduce)return;
  const cv=$('#confetti'),cx=cv.getContext('2d');cv.width=innerWidth;cv.height=innerHeight;
  const cols=['#ffc857','#ff8a9a','#6fb2ff','#5fe0a8','#b98cff','#ff9f5a'];
  const ps=Array.from({length:60+level*50},()=>({x:innerWidth/2+(Math.random()-.5)*200,y:innerHeight*.35,vx:(Math.random()-.5)*14,vy:-Math.random()*14-4,r:Math.random()*6+4,c:cols[Math.floor(Math.random()*6)],a:Math.random()*6,va:(Math.random()-.5)*.3}));
  const t0=performance.now();
  (function f(now){const el=now-t0;cx.clearRect(0,0,cv.width,cv.height);
    ps.forEach(p=>{p.vy+=.35;p.x+=p.vx;p.y+=p.vy;p.vx*=.99;p.a+=p.va;cx.save();cx.translate(p.x,p.y);cx.rotate(p.a);cx.globalAlpha=Math.max(0,1-el/2800);cx.fillStyle=p.c;cx.fillRect(-p.r/2,-p.r/4,p.r,p.r/2);cx.restore();});
    if(el<2800)requestAnimationFrame(f);else cx.clearRect(0,0,cv.width,cv.height);})(t0);
}

renderHome();
