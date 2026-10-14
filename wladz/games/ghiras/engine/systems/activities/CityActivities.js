import * as THREE from 'three';
import { events } from '../../core/EventBus.js';
import { audio } from '../AudioSystem.js';

/**
 * City facility activities built on the shared ActivitySystem:
 *  - first aid (health centre): age-appropriate decision scenarios, awareness only
 *  - museum: discovery tour, memory quiz on the museum's own panels, explorer challenge (feeds the encyclopedia)
 *  - recycling centre: sorting (untimed / timed) and a clean-up campaign that makes the park bloom
 *  - driving school: signs and priorities, calm driving, stopping at a crossing, parking (uses the family car)
 */

// ─────────────────────────────────────────────────────────────
// First aid
// ─────────────────────────────────────────────────────────────
export function createFirstAidActivity() {
  const quizStage = (id, title, brief, quiz, reward) => ({
    id, title, brief, objective: 'اختر التصرّف الصحيح', quiz, reward,
    update: (dt, ctx) => ({ progress: ctx.data.quizDone ? 1 : 0, done: !!ctx.data.quizDone })
  });
  return {
    id: 'firstaid', title: 'ركن الإسعافات الأولية', icon: '🩺', giver: 'الطبيبة فاطمة',
    intro: 'تعلّم كيف تتصرّف بأمان عند حادث بسيط. تنبيه: هذه دروس توعوية فقط ولا تعوّض تكويناً حقيقياً في الإسعافات الأولية، وعند أي خطر اطلب مساعدة شخص بالغ واتصل بالنجدة.',
    finale: 'أصبحت تعرف كيف تحمي نفسك وتساعد غيرك بأمان.',
    stages: [
      quizStage('call', 'طلب النجدة', 'ماذا تفعل وماذا تقول عند الاتصال بالنجدة؟', [
        { q: 'وقع حادث ونشب حريق صغير قرب منزلكم. بأي رقم تتصل بالحماية المدنية؟', options: ['14', '17', '30'], answer: 0, why: 'رقم الحماية المدنية في الجزائر هو 14، أما 17 فهو رقم الشرطة.' },
        { q: 'عند الاتصال بالنجدة، ما أهم ما تقوله؟', options: ['المكان بدقة، وماذا حدث، وعدد المصابين', 'اسمي فقط ثم أغلق الخط', 'لا أقول شيئاً وأنتظرهم'], answer: 0, why: 'المسعفون يحتاجون أولاً إلى العنوان الدقيق وما حدث وعدد المصابين حتى يصلوا بسرعة.' },
        { q: 'وبعد الاتصال؟', options: ['أقترب من الخطر لأصوّره', 'أبقى هادئاً في مكان آمن ولا أغلق الخط حتى يُطلب مني ذلك', 'أعود إلى البيت وأنسى الأمر'], answer: 1, why: 'نبقى في مكان آمن وهادئين، ونترك الخط مفتوحاً إن طُلب منا ذلك لتقديم معلومات إضافية.' }
      ], { xp: 50, coins: 20 }),
      quizStage('cut', 'جرح بسيط', 'صديقك جُرحت ركبته في الملعب جرحاً سطحياً صغيراً.', [
        { q: 'ما أول ما تفعله؟', options: ['أضع عليه بعض التراب', 'أغسل يديّ، ثم أنظّف الجرح بماء نظيف', 'أنفخ عليه فقط'], answer: 1, why: 'نبدأ بنظافة اليدين ثم نغسل الجرح الصغير بماء نظيف لإزالة الأوساخ وتجنّب التعفّن.' },
        { q: 'وبعد تنظيفه؟', options: ['أغطّيه بضمادة نظيفة وأخبر شخصاً بالغاً', 'أضع عليه معجون أسنان', 'أتركه مكشوفاً في الغبار'], answer: 0, why: 'نغطّي الجرح بضمادة نظيفة ونُعلم شخصاً بالغاً، وإن كان الجرح عميقاً أو ينزف كثيراً نطلب الطبيب.' }
      ], { xp: 50, coins: 20 }),
      quizStage('burn', 'حرق بسيط', 'أختك الصغيرة لمست إبريقاً ساخناً فاحمرّ إصبعها.', [
        { q: 'ما التصرّف الصحيح؟', options: ['أضع عليه ثلجاً مباشرة', 'أدهنه بالزبدة أو معجون الأسنان', 'أضعه تحت ماء جارٍ بارد (غير مثلّج) لعدة دقائق'], answer: 2, why: 'الماء الجاري البارد لعدة دقائق يبرّد الحرق ويخفّف الألم. الثلج والزبدة ومعجون الأسنان قد تزيد الضرر.' },
        { q: 'وإذا كان الحرق كبيراً أو على الوجه؟', options: ['أفقأ الفقاعات', 'أطلب مساعدة بالغ فوراً ونتصل بالنجدة أو نذهب إلى الطبيب', 'أنتظر حتى الغد'], answer: 1, why: 'الحروق الكبيرة أو في الوجه تحتاج إلى طبيب بسرعة، ولا نفقأ الفقاعات أبداً.' }
      ], { xp: 60, coins: 25 }),
      quizStage('safety', 'الأمان أولاً', 'قبل أن تساعد أي شخص، تأكد أنك لن تتعرّض أنت للخطر.', [
        { q: 'رأيت شخصاً ممدّداً قرب سلك كهربائي مقطوع. ماذا تفعل؟', options: ['ألمسه وأسحبه بيدي فوراً', 'لا ألمسه، أبتعد وأطلب من بالغ قطع الكهرباء، ونتصل بالنجدة', 'أسكب عليه الماء'], answer: 1, why: 'لمس المصاب قد ينقل إليك التيار الكهربائي. الأمان أولاً: نبتعد ونطلب قطع الكهرباء والنجدة.' },
        { q: 'صديقك يسعل بقوة بعد أن بلع قطعة حلوى ولا يستطيع الكلام. ماذا تفعل؟', options: ['أنادي شخصاً بالغاً فوراً بصوت عالٍ ونطلب النجدة', 'أعطيه ماء ليشرب بسرعة', 'أضحك وأنتظر'], answer: 0, why: 'الاختناق حالة طارئة: ننادي البالغين فوراً ونتصل بالنجدة، فهم يعرفون كيف يساعدونه.' }
      ], { xp: 70, coins: 30 })
    ]
  };
}

// ─────────────────────────────────────────────────────────────
// Museum and discovery
// ─────────────────────────────────────────────────────────────
export function createMuseumActivity(game) {
  const MUSEUM_PANELS = ['1 نوفمبر 1954', '5 جويلية 1962', 'الأمير عبد القادر', 'التراث الفخاري'];
  const readIn = (ctx) => {
    if (!ctx.data.listener) {
      ctx.data.read = new Set();
      ctx.data.listener = ({ id, title }) => { if (ctx.data.track(id, title)) audio.playCorrectAnswer(); };
      events.on('INTERIOR_POI_READ', ctx.data.listener);
    }
  };
  const stopListening = (ctx) => { if (ctx.data.listener) events.off && events.off('INTERIOR_POI_READ', ctx.data.listener); ctx.data.listener = null; ctx.data.track = () => false; };
  return {
    id: 'museum', title: 'مستكشف المتحف', icon: '🏛️', giver: 'دليل المتحف',
    intro: 'مرحباً في المتحف الوطني! كل لوحة تقرؤها تُضاف إلى موسوعتك (📖). اقرأ، ثم أجب، ثم انطلق لاكتشاف معالم المدينة.',
    finale: 'أنت الآن مستكشف حقيقي لتاريخ وتراث بلادنا!',
    stages: [
      {
        id: 'tour', title: 'جولة الاكتشاف', brief: 'اقرأ لوحات المتحف الأربع (اقترب واضغط E).', objective: 'اقرأ لوحات المتحف', reward: { xp: 40, coins: 15 },
        setup: (ctx) => { ctx.data.track = (id, title) => id === 'museum' && MUSEUM_PANELS.includes(title) && !ctx.data.read.has(title) && !!ctx.data.read.add(title); readIn(ctx); },
        update: (dt, ctx) => ({ progress: ctx.data.read.size / 4, text: `اقرأ لوحات المتحف (${ctx.data.read.size}/4)`, done: ctx.data.read.size >= 4 }),
        cleanup: stopListening
      },
      {
        id: 'memory', title: 'اختبار الذاكرة', brief: 'أسئلة عن لوحات المتحف التي قرأتها.', objective: 'أجب عن الأسئلة', reward: { xp: 60, coins: 25 },
        quiz: [
          { q: 'متى اندلعت ثورة التحرير الجزائرية؟', options: ['5 جويلية 1962', 'الفاتح من نوفمبر 1954', 'سنة 1992'], answer: 1, why: 'كما في لوحة المتحف: اندلعت ثورة التحرير في الفاتح من نوفمبر 1954.' },
          { q: 'متى استرجعت الجزائر استقلالها؟', options: ['5 جويلية 1962', 'الفاتح من نوفمبر 1954', '5 جويلية 1954'], answer: 0, why: 'استرجعت الجزائر استقلالها في 5 جويلية 1962 بعد كفاح طويل.' },
          { q: 'من قاد المقاومة الشعبية ويُعدّ مؤسس الدولة الجزائرية الحديثة؟', options: ['الأمير عبد القادر', 'حرفي من القصبة', 'رئيس البلدية'], answer: 0, why: 'الأمير عبد القادر (1808–1883) قاد المقاومة الشعبية ويُعدّ مؤسس الدولة الجزائرية الحديثة.' },
          { q: 'ماذا يعكس الفخار التقليدي الجزائري؟', options: ['لا شيء، هو للزينة فقط', 'ذوق وهوية كل منطقة', 'صناعة حديثة جاءت من الخارج'], answer: 1, why: 'الفخار من أقدم الصناعات التقليدية في الجزائر، ويعكس ذوق وهوية كل منطقة.' }
        ],
        update: (dt, ctx) => ({ progress: ctx.data.quizDone ? 1 : 0, done: !!ctx.data.quizDone })
      },
      {
        id: 'explorer', title: 'مستكشف المدينة', brief: 'اقرأ ثلاث لوحات معلومات في معالم أخرى (المسجد، المكتبة، القصبة، البلدية...).', objective: 'اقرأ لوحات في معالم أخرى', reward: { xp: 80, coins: 35 },
        setup: (ctx) => { ctx.data.track = (id, title) => id !== 'museum' && id !== 'home' && !ctx.data.read.has(title) && !!ctx.data.read.add(title); readIn(ctx); },
        update: (dt, ctx) => ({ progress: ctx.data.read.size / 3, text: `اقرأ لوحات في معالم أخرى (${ctx.data.read.size}/3) • الموسوعة 📖: ${game.encyclopedia ? game.encyclopedia.count() : 0}`, done: ctx.data.read.size >= 3 }),
        cleanup: stopListening
      }
    ]
  };
}

// ─────────────────────────────────────────────────────────────
// Recycling centre
// ─────────────────────────────────────────────────────────────
const BINS = [
  { id: 'paper', name: 'ورق وكرتون', icon: '📄', color: '#2e86c1' },
  { id: 'plastic', name: 'بلاستيك', icon: '🧴', color: '#f1c40f' },
  { id: 'metal', name: 'معادن', icon: '🥫', color: '#95a5a6' },
  { id: 'general', name: 'نفايات عامة', icon: '🗑️', color: '#2c3e50' }
];
const ITEMS = [
  { name: 'جريدة قديمة', icon: '📰', bin: 'paper' }, { name: 'علبة كرتون', icon: '📦', bin: 'paper' }, { name: 'دفتر مستعمل', icon: '📒', bin: 'paper' },
  { name: 'قارورة ماء بلاستيكية', icon: '🧴', bin: 'plastic' }, { name: 'كيس بلاستيكي', icon: '🛍️', bin: 'plastic' }, { name: 'علبة لبن بلاستيكية', icon: '🥛', bin: 'plastic' },
  { name: 'علبة مشروب معدنية', icon: '🥤', bin: 'metal' }, { name: 'علبة مصبّرات', icon: '🥫', bin: 'metal' }, { name: 'غطاء معدني', icon: '🔩', bin: 'metal' },
  { name: 'منديل ورقي مستعمل', icon: '🧻', bin: 'general', why: 'المنديل المستعمل متّسخ فلا يُعاد تدويره مع الورق.' },
  { name: 'بقايا طعام', icon: '🍂', bin: 'general', why: 'بقايا الطعام ليست ورقاً ولا بلاستيكاً ولا معدناً.' },
  { name: 'غبار المكنسة', icon: '🧹', bin: 'general' }
];

function sortingPanel(ctx, game, total) {
  const el = document.createElement('div');
  el.className = 'modal-overlay show';
  el.style.zIndex = 310;
  el.innerHTML = `<div class="ac-card sort-card"><div class="ac-head"><span class="ac-avatar">♻️</span><div><h3>الفرز الانتقائي</h3><small class="sort-count"></small></div></div>
    <div class="sort-item"><span class="sort-icon"></span><b class="sort-name"></b></div>
    <div class="sort-bins">${BINS.map((b, i) => `<button type="button" class="sort-bin" data-bin="${b.id}" style="--bc:${b.color}"><span>${b.icon}</span>${b.name}<small>${i + 1}</small></button>`).join('')}</div>
    <p class="ac-why sort-why"></p></div>`;
  document.body.appendChild(el);
  const pool = [...ITEMS].sort(() => Math.random() - 0.5);
  const d = ctx.data;
  Object.assign(d, { el, pool, i: 0, correct: 0, answered: 0, total, lock: false });
  const show = () => {
    const it = d.pool[d.i % d.pool.length];
    el.querySelector('.sort-icon').textContent = it.icon;
    el.querySelector('.sort-name').textContent = it.name;
    el.querySelector('.sort-count').textContent = `القطعة ${Math.min(total, d.answered + 1)} من ${total} • الصحيحة: ${d.correct}`;
  };
  const answer = (binId) => {
    if (d.lock || d.answered >= total) return;
    const it = d.pool[d.i % d.pool.length];
    const ok = it.bin === binId;
    d.answered++;
    if (ok) { d.correct++; audio.playCorrectAnswer(); el.querySelector('.sort-why').textContent = '✅ أحسنت!'; }
    else { audio.playWrongAnswer(); el.querySelector('.sort-why').textContent = `💡 ${it.name} مكانها: ${BINS.find(b => b.id === it.bin).name}. ${it.why || ''}`; }
    d.i++;
    d.lock = true;
    setTimeout(() => { d.lock = false; if (d.answered < total) show(); }, ok ? 350 : 1300);
  };
  el.querySelectorAll('.sort-bin').forEach(b => b.addEventListener('click', () => answer(b.dataset.bin)));
  d.key = (e) => { const n = ['Digit1', 'Digit2', 'Digit3', 'Digit4'].indexOf(e.code); if (n >= 0) answer(BINS[n].id); };
  window.addEventListener('keydown', d.key);
  game.input.setEnabled(false);
  show();
}

function closeSorting(ctx, game) {
  const d = ctx.data;
  if (d.el) { d.el.remove(); d.el = null; }
  if (d.key) window.removeEventListener('keydown', d.key);
  game.input.setEnabled(true);
}

export function createRecyclingActivity(game, facilities) {
  return {
    id: 'recycling', title: 'مركز الفرز وإعادة التدوير', icon: '♻️', giver: 'مركز الفرز',
    intro: 'الفرز الانتقائي يسمح بإعادة تدوير الورق والبلاستيك والمعادن بدل رميها. تعلّم الفرز، ثم شارك في حملة تنظيف تجعل الحديقة أجمل!',
    finale: 'بفضل حملتك أزهرت الحديقة المركزية!',
    stages: [
      {
        id: 'learn', title: 'تعلّم الفرز', brief: 'ضع كل قطعة في الحاوية المناسبة (انقر أو اضغط 1-4). خذ وقتك.', objective: 'افرز 8 قطع', reward: { xp: 40, coins: 15 },
        setup: (ctx) => sortingPanel(ctx, game, 8),
        update: (dt, ctx) => {
          const d = ctx.data;
          if (d.answered < d.total || d.lock) return { progress: d.answered / d.total, text: `الفرز: ${d.correct} صحيحة من ${d.answered}` };
          return d.correct >= 6 ? { done: true, score: d.correct } : { failed: `♻️ ${d.correct} صحيحة فقط من 8 (المطلوب 6).` };
        },
        cleanup: (ctx) => closeSorting(ctx, game)
      },
      {
        id: 'speed', title: 'تحدي سرعة الفرز', brief: 'افرز 12 قطعة في 45 ثانية مع 10 إجابات صحيحة على الأقل.', objective: 'افرز بسرعة ودقة', timeLimit: 45,
        reward: { xp: 60, coins: 25 }, best: { label: 'أفضل نتيجة', better: 'higher', unit: '/12' },
        setup: (ctx) => sortingPanel(ctx, game, 12),
        update: (dt, ctx) => {
          const d = ctx.data;
          if (d.answered < d.total || d.lock) return { progress: d.answered / d.total, text: `الفرز السريع: ${d.correct} صحيحة من ${d.answered}` };
          return d.correct >= 10 ? { done: true, score: d.correct } : { failed: `♻️ ${d.correct} صحيحة من 12 (المطلوب 10).` };
        },
        cleanup: (ctx) => closeSorting(ctx, game)
      },
      {
        id: 'campaign', title: 'حملة تنظيف الحديقة', brief: 'اجمع 8 قطع نفايات متناثرة حول الحديقة المركزية ثم عُد إلى مركز الفرز.', objective: 'اجمع النفايات وعُد إلى المركز', reward: { xp: 100, coins: 40 },
        setup: (ctx) => {
          const d = ctx.data;
          d.objs = [];
          const spots = [[11, 12], [31, 12.5], [11.5, 31], [31.5, 31], [16, 9.8], [27, 33], [9.8, 22], [33, 20]];
          d.items = spots.map(([x, z], i) => {
            const g = new THREE.Group();
            const m = new THREE.Mesh(i % 2 ? new THREE.CylinderGeometry(0.06, 0.07, 0.28, 10) : new THREE.IcosahedronGeometry(0.12, 0), new THREE.MeshStandardMaterial({ color: [0x5dade2, 0xf4f1ea, 0xc0392b, 0x58d68d][i % 4], roughness: 0.6 }));
            if (i % 2) m.rotation.z = Math.PI / 2;
            m.position.y = 0.32;
            g.add(m);
            const ringM = new THREE.Mesh(new THREE.RingGeometry(0.4, 0.5, 24), new THREE.MeshBasicMaterial({ color: 0x2ecc71, transparent: true, opacity: 0.7, side: THREE.DoubleSide, depthWrite: false }));
            ringM.rotation.x = -Math.PI / 2;
            ringM.position.y = 0.24;
            g.add(ringM);
            g.position.set(x, 0, z);
            game.engine.scene.add(g);
            d.objs.push(g);
            return { g, x, z, taken: false };
          });
          d.carried = 0;
        },
        update: (dt, ctx) => {
          const d = ctx.data, p = game.player.position;
          d.items.forEach(it => {
            if (it.taken) return;
            it.g.rotation.y += dt * 2;
            if (Math.hypot(p.x - it.x, p.z - it.z) < 1.4) { it.taken = true; it.g.visible = false; d.carried++; audio.playTrashCollect(); }
          });
          const left = d.items.filter(i => !i.taken).length;
          if (left > 0) return { progress: d.carried / 10, text: `اجمع النفايات حول الحديقة (${d.carried}/8)` };
          const st = facilities.station('recycling');
          const atCentre = Math.hypot(p.x - st.pos.x, p.z - st.pos.z) < 3;
          return { progress: atCentre ? 1 : 0.8, text: 'أحسنت! أعد النفايات إلى مركز الفرز', done: atCentre };
        },
        cleanup: (ctx) => { (ctx.data.objs || []).forEach(o => game.engine.scene.remove(o)); }
      }
    ],
    onStageDone: (stage, i, first) => { if (stage.id === 'campaign') facilities.setWorldFlag('parkBloom', true); }
  };
}

// ─────────────────────────────────────────────────────────────
// Driving school (uses the family car and the city's roads)
// ─────────────────────────────────────────────────────────────
export function createDrivingSchoolActivity(game, facilities) {
  const car = () => game.vehicle;
  const gate = (ctx, x, z, color = 0xf1c40f) => {
    const g = new THREE.Group();
    const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.5, emissive: color, emissiveIntensity: 0.25 });
    [-1, 1].forEach(s => { const post = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 3.2, 10), mat); post.position.set(0, 1.6, s * 1.9); g.add(post); });
    const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 3.8, 10), mat);
    bar.rotation.x = Math.PI / 2;
    bar.position.y = 3.2;
    g.add(bar);
    g.position.set(x, 0, z);
    game.engine.scene.add(g);
    ctx.data.objs.push(g);
    return { x, z, g, mat };
  };
  const needCar = () => (car().driving ? null : { progress: 0, text: '🚗 اركب سيارة العائلة أولاً (اقترب منها واضغط E)' });
  const bumpWatch = (ctx) => { ctx.data.bumps = 0; ctx.data.onBump = () => { ctx.data.bumps++; }; events.on('VEHICLE_BUMP', ctx.data.onBump); };
  const cleanup = (ctx) => { (ctx.data.objs || []).forEach(o => game.engine.scene.remove(o)); if (ctx.data.onBump && events.off) events.off('VEHICLE_BUMP', ctx.data.onBump); ctx.data.onBump = null; };
  return {
    id: 'driving', title: 'مدرسة السياقة', icon: '🚦', giver: 'المدرّب رضا',
    intro: 'القيادة مسؤولية: نحترم الإشارات والراجلين والسرعة. نتعلّم القواعد أولاً ثم نطبّقها بسيارة العائلة على الطريق الدائري.',
    finale: 'أتممت مدرسة السياقة! السلامة المرورية تبدأ منك.',
    stages: [
      {
        id: 'rules', title: 'الإشارات والأولويات', brief: 'أسئلة عن إشارات المرور والأولوية.', objective: 'أجب عن الأسئلة', reward: { xp: 50, coins: 20 },
        quiz: [
          { q: 'ماذا تفعل أمام علامة «قف» (STOP)؟', options: ['أخفّف السرعة فقط', 'أتوقف تماماً ثم أنطلق عندما يكون الطريق خالياً', 'أطلق المنبّه وأمرّ'], answer: 1, why: 'علامة «قف» تفرض التوقف التام، ثم ننطلق فقط عندما يخلو الطريق.' },
          { q: 'راجل ينتظر على ممر الراجلين. ماذا تفعل؟', options: ['أتوقف وأتركه يعبر', 'أسرع قبل أن يعبر', 'أطلق المنبّه ليبتعد'], answer: 0, why: 'للراجل الأولوية على ممر الراجلين: نتوقف ونتركه يعبر بأمان.' },
          { q: 'الإشارة الضوئية حمراء:', options: ['أمرّ إذا لم أرَ أحداً', 'أتوقف قبل خط التوقف حتى تصبح خضراء', 'أتوقف فوق ممر الراجلين'], answer: 1, why: 'الضوء الأحمر يعني التوقف قبل خط التوقف، دون الوقوف فوق ممر الراجلين.' },
          { q: 'عند مدخل دوّار عليه علامة «أعطِ الأولوية»، لمن الأولوية؟', options: ['لي لأنني على اليمين', 'للسيارات التي تدور داخل الدوّار', 'للأسرع'], answer: 1, why: 'علامة «أعطِ الأولوية» عند المدخل تعني أن الأولوية للسيارات الموجودة داخل الدوّار.' }
        ],
        update: (dt, ctx) => ({ progress: ctx.data.quizDone ? 1 : 0, done: !!ctx.data.quizDone })
      },
      {
        id: 'calm', title: 'القيادة الهادئة', brief: 'بسيارة العائلة، مُرّ عبر البوابات الصفراء على الطريق الدائري دون تجاوز 30 كم/سا ودون اصطدام.', objective: 'مُرّ عبر البوابات بهدوء', reward: { xp: 70, coins: 30 },
        setup: (ctx) => {
          ctx.data.objs = [];
          ctx.data.gates = [[56, 43.8], [36, 43.8], [24, 43.8], [6, 43.8]].map(([x, z]) => gate(ctx, x, z));
          Object.assign(ctx.data, { k: 0, warn: 0, overFor: 0 });
          bumpWatch(ctx);
        },
        update: (dt, ctx) => {
          const n = needCar(); if (n) return n;
          const d = ctx.data, st = car().state;
          const kmh = Math.abs(st.speed) * 3.6;
          d.overFor = kmh > 31 ? d.overFor + dt : 0;
          if (d.overFor > 1.0) { d.warn++; d.overFor = -2; events.emit('TOAST', `🚦 تجاوزت 30 كم/سا! تنبيه ${d.warn}/3`); }
          if (d.warn >= 3) return { failed: '🚦 تجاوزت السرعة المسموحة ثلاث مرات.' };
          if (d.bumps > 0) return { failed: '💥 اصطدام!' };
          d.gates.forEach((g, i) => g.mat.emissiveIntensity = i === d.k ? 0.35 + Math.sin(ctx.time * 6) * 0.3 : 0.05);
          const cur = d.gates[d.k];
          if (Math.hypot(st.x - cur.x, st.z - cur.z) < 2.6) { d.k++; audio.playCorrectAnswer(); }
          return { progress: d.k / d.gates.length, text: `البوابة ${Math.min(d.gates.length, d.k + 1)} من ${d.gates.length} • السرعة ${kmh.toFixed(0)} كم/سا (الحد 30)`, done: d.k >= d.gates.length };
        },
        cleanup
      },
      {
        id: 'crossing', title: 'التوقف قبل ممر الراجلين', brief: 'اتجه غرباً على الطريق الدائري، وتوقف تماماً في المربع الأخضر قبل ممر الراجلين ثانيتين، ثم واصل.', objective: 'توقف قبل ممر الراجلين', reward: { xp: 70, coins: 30 },
        setup: (ctx) => {
          ctx.data.objs = [];
          const box = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 3.4), new THREE.MeshBasicMaterial({ color: 0x2ecc71, transparent: true, opacity: 0.45, depthWrite: false }));
          box.rotation.x = -Math.PI / 2;
          box.position.set(21.4, 0.04, 43.8);
          game.engine.scene.add(box);
          ctx.data.objs.push(box);
          Object.assign(ctx.data, { stopped: 0, ok: false });
          bumpWatch(ctx);
        },
        update: (dt, ctx) => {
          const n = needCar(); if (n) return n;
          const d = ctx.data, st = car().state;
          if (d.bumps > 0) return { failed: '💥 اصطدام!' };
          const inBox = Math.abs(st.x - 21.4) < 1.9 && Math.abs(st.z - 43.8) < 2.2;
          if (inBox && Math.abs(st.speed) < 0.3) d.stopped += dt;
          if (d.stopped >= 2 && !d.ok) { d.ok = true; audio.playCorrectAnswer(); events.emit('TOAST', '✅ توقف صحيح! تأكد أن الممر خالٍ ثم واصل.'); }
          // Crossing the zebra (x 14.2..17.8) without the full stop fails
          if (!d.ok && st.x < 17.6 && st.x > 14 && Math.abs(st.z - 42) < 4) return { failed: '🚸 عبرت ممر الراجلين دون توقف!' };
          if (d.ok && st.x < 13) return { done: true, progress: 1 };
          return { progress: d.ok ? 0.7 : Math.min(0.6, d.stopped / 3.3), text: d.ok ? 'واصل عبر الممر بهدوء' : 'توقف تماماً في المربع الأخضر قبل الممر (ثانيتان)' };
        },
        cleanup
      },
      {
        id: 'parking', title: 'الركن في المكان المخصص', brief: 'أعد السيارة إلى ممر المنزل وأركنها داخل المستطيل الأصفر، ثم توقف تماماً.', objective: 'اركن السيارة في ممر المنزل', reward: { xp: 90, coins: 40 },
        setup: (ctx) => {
          ctx.data.objs = [];
          const spot = game.worldBuilder.playerHome.carSpot;
          const frame = new THREE.Mesh(new THREE.RingGeometry(1.9, 2.1, 4, 1), new THREE.MeshBasicMaterial({ color: 0xf1c40f, side: THREE.DoubleSide }));
          frame.rotation.set(-Math.PI / 2, 0, Math.PI / 4);
          frame.scale.set(0.75, 1.45, 1);
          frame.position.set(spot.x, 0.24, spot.z);
          game.engine.scene.add(frame);
          ctx.data.objs.push(frame);
          ctx.data.spot = spot;
          ctx.data.still = 0;
          bumpWatch(ctx);
        },
        update: (dt, ctx) => {
          const n = needCar(); if (n) return n;
          const d = ctx.data, st = car().state, s = d.spot;
          const dist = Math.hypot(st.x - s.x, st.z - s.z);
          const ang = Math.abs(Math.atan2(Math.sin(st.heading - s.heading), Math.cos(st.heading - s.heading)));
          const aligned = Math.min(ang, Math.PI - ang) < 0.35;
          const inside = dist < 1.0 && aligned;
          d.still = inside && Math.abs(st.speed) < 0.2 ? d.still + dt : 0;
          return { progress: inside ? 0.8 + Math.min(0.2, d.still / 7.5) : Math.max(0, 0.6 - dist / 100), text: inside ? 'ممتاز، توقف تماماً…' : `اركن داخل المستطيل الأصفر (المسافة ${dist.toFixed(1)} م)`, done: d.still >= 1.5 };
        },
        cleanup
      }
    ]
  };
}
