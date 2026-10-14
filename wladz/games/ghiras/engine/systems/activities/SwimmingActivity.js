import * as THREE from 'three';
import { events } from '../../core/EventBus.js';
import { audio } from '../AudioSystem.js';
import { CharacterModel } from '../CharacterModel.js';
import { COAST_ORIGIN, SHORE_Z, WATER_Y } from '../coast/CoastDistrict.js';

const W = (x, z) => new THREE.Vector3(COAST_ORIGIN.x + x, 0, COAST_ORIGIN.z + z);

function marker(ctx, x, z, color, label) {
  const g = new THREE.Group();
  const buoy = new THREE.Mesh(new THREE.SphereGeometry(0.45, 18, 14), new THREE.MeshStandardMaterial({ color, roughness: 0.35 }));
  buoy.scale.y = 0.75;
  g.add(buoy);
  const ringM = new THREE.Mesh(new THREE.RingGeometry(1.25, 1.5, 36), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.6, side: THREE.DoubleSide, depthWrite: false }));
  ringM.rotation.x = -Math.PI / 2;
  ringM.position.y = 0.04;
  g.add(ringM);
  if (label) {
    const c = document.createElement('canvas'); c.width = c.height = 128;
    const x2 = c.getContext('2d');
    x2.fillStyle = '#fff'; x2.beginPath(); x2.arc(64, 64, 56, 0, Math.PI * 2); x2.fill();
    x2.fillStyle = '#1f2937'; x2.font = 'bold 80px sans-serif'; x2.textAlign = 'center'; x2.textBaseline = 'middle'; x2.fillText(label, 64, 70);
    const tex = new THREE.CanvasTexture(c);
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, depthTest: false }));
    sp.scale.set(0.7, 0.7, 1);
    sp.position.y = 1.0;
    g.add(sp);
  }
  g.position.set(x, WATER_Y, z);
  ctx.coast.group.add(g);
  ctx.data.objs.push(g);
  return { pos: W(x, z), group: g, ring: ringM };
}

/**
 * Supervised swimming school with the instructor: safe entry, floating, buoy course, a distance challenge,
 * beach safety flags, and a rescue-awareness exercise where the right action is to alert the lifeguard.
 */
export function createSwimmingActivity(coast, game, hooks) {
  const pl = () => game.player;
  const withCtx = (fn) => (...args) => { const ctx = typeof args[0] === 'number' ? args[1] : args[0]; ctx.coast = coast; return fn(...args); };
  const setupCommon = (ctx) => { ctx.data.objs = []; audio.playWhistle(); };
  const cleanupCommon = (ctx) => { (ctx.data.objs || []).forEach(o => coast.group.remove(o)); coast.setFlag('green'); };
  const near = (a, b, r) => Math.hypot(a.x - b.x, a.z - b.z) < r;

  const stages = [
    {
      id: 'entry', title: 'الدخول الآمن إلى الماء', reward: { xp: 40, coins: 15 },
      brief: 'لا ندخل البحر إلا من نقطة الدخول الخضراء وتحت نظر المنقذ. امشِ إلى الدائرة الخضراء ثم ادخل الماء بهدوء.',
      objective: 'امشِ إلى نقطة الدخول الخضراء',
      setup: withCtx((ctx) => { setupCommon(ctx); ctx.data.viaEntry = false; }),
      update: withCtx((dt, ctx) => {
        const p = pl().position;
        if (near(p, coast.entryPoint, 2.0)) ctx.data.viaEntry = true;
        const swimming = pl().swimming && coast.swimZoneAt(p.x, p.z) === 'shallow';
        return {
          progress: swimming ? 1 : ctx.data.viaEntry ? 0.5 : 0,
          text: ctx.data.viaEntry ? 'أحسنت، الآن ادخل الماء بهدوء حتى تطفو داخل منطقة العوامات البرتقالية' : 'امشِ إلى نقطة الدخول الخضراء على الشاطئ',
          done: swimming && ctx.data.viaEntry
        };
      }),
      cleanup: withCtx(cleanupCommon)
    },
    {
      id: 'float', title: 'الطفو والحركة', reward: { xp: 50, coins: 20 },
      brief: 'في الماء: ابقَ ساكناً لتطفو 6 ثوانٍ، ثم اسبح بهدوء مسافة 15 متراً. Shift للسباحة الأسرع.',
      objective: 'اطفُ 6 ثوانٍ ثم اسبح 15 متراً',
      setup: withCtx((ctx) => { setupCommon(ctx); Object.assign(ctx.data, { tread: 0, dist: 0, last: null }); }),
      update: withCtx((dt, ctx) => {
        const d = ctx.data, p = pl().position;
        if (!pl().swimming) { d.last = null; return { progress: 0, text: 'ادخل الماء داخل منطقة العوامات البرتقالية' }; }
        if (d.last) {
          const step = Math.hypot(p.x - d.last.x, p.z - d.last.z);
          if (step < 0.01 && d.tread < 6) d.tread += dt;
          else if (d.tread >= 6) d.dist += step;
        }
        d.last = { x: p.x, z: p.z };
        if (d.tread < 6) return { progress: d.tread / 12, text: `ابقَ ساكناً لتطفو (${d.tread.toFixed(0)}/6 ث): لا تحرّك مفاتيح الاتجاه` };
        return { progress: 0.5 + Math.min(1, d.dist / 15) / 2, text: `اسبح الآن (${Math.min(15, d.dist).toFixed(0)}/15 م)`, done: d.dist >= 15 };
      }),
      cleanup: withCtx(cleanupCommon)
    },
    {
      id: 'buoys', title: 'السباحة بين العوامات', reward: { xp: 60, coins: 20 },
      brief: 'اسبح نحو العوامات المرقّمة من 1 إلى 4 بالترتيب، داخل المنطقة الآمنة.',
      objective: 'اسبح إلى العوامة المضيئة',
      setup: withCtx((ctx) => {
        setupCommon(ctx);
        ctx.data.marks = [[-8, 34], [-8, 42], [8, 42], [8, 34]].map(([x, z], i) => marker(ctx, x, z, 0xf39c12, String(i + 1)));
        ctx.data.k = 0;
      }),
      update: withCtx((dt, ctx) => {
        const d = ctx.data, p = pl().position;
        d.marks.forEach((m, i) => { m.ring.material.opacity = i === d.k ? 0.5 + Math.sin(ctx.time * 6) * 0.3 : 0.15; m.group.position.y = WATER_Y + Math.sin(ctx.time * 2 + i) * 0.06; });
        const cur = d.marks[d.k];
        if (pl().swimming && near(p, cur.pos, 1.7)) { cur.ring.material.color.setHex(0x2ecc71); d.k++; audio.playCorrectAnswer(); }
        return { progress: d.k / 4, text: `اسبح إلى العوامة رقم ${Math.min(4, d.k + 1)}`, done: d.k >= 4 };
      }),
      cleanup: withCtx(cleanupCommon)
    },
    {
      id: 'distance', title: 'تحدي المسافة', reward: { xp: 80, coins: 30 }, timeLimit: 60, best: { label: 'أفضل زمن', better: 'lower', unit: 's' },
      brief: 'اسبح من العوامة الخضراء إلى الحمراء ثم عد إليها قبل 60 ثانية. لا تُرهق نفسك.',
      objective: 'اسبح ذهاباً وإياباً بين العوامتين',
      setup: withCtx((ctx) => {
        setupCommon(ctx);
        ctx.data.a = marker(ctx, 0, 33, 0x27ae60, 'A');
        ctx.data.b = marker(ctx, 0, 45, 0xc0392b, 'B');
        ctx.data.phase = 0;
      }),
      update: withCtx((dt, ctx) => {
        const d = ctx.data, p = pl().position;
        const targets = [d.a, d.b, d.a];
        targets.forEach(m => { m.ring.material.opacity = 0.2; });
        const cur = targets[d.phase];
        cur.ring.material.opacity = 0.5 + Math.sin(ctx.time * 6) * 0.3;
        if (pl().swimming && near(p, cur.pos, 1.7)) { d.phase++; audio.playCorrectAnswer(); }
        const done = d.phase >= 3;
        const label = ['انطلق من العوامة الخضراء A', 'اسبح إلى العوامة الحمراء B', 'عُد إلى العوامة الخضراء A'][Math.min(2, d.phase)];
        return { progress: d.phase / 3, text: label, done, score: done ? Math.round(ctx.time * 10) / 10 : undefined };
      }),
      cleanup: withCtx(cleanupCommon)
    },
    {
      id: 'flags', title: 'رايات الأمان على الشاطئ', reward: { xp: 60, coins: 25 },
      brief: 'تعرّف على معنى رايات الشاطئ ومكان السباحة الآمن. انظر إلى سارية الرايات.',
      objective: 'أجب عن أسئلة رايات الأمان',
      quiz: [
        { q: 'ماذا تعني الراية الخضراء على سارية الشاطئ؟', options: ['السباحة مسموحة والبحر هادئ، مع الحذر دائماً', 'السباحة ممنوعة تماماً', 'الشاطئ للقوارب فقط'], answer: 0, why: 'الراية الخضراء تعني أن السباحة مسموحة والبحر هادئ، مع البقاء في المنطقة المحروسة.', onShow: () => coast.setFlag('green') },
        { q: 'وماذا تعني الراية الصفراء؟', options: ['يمكن السباحة بعيداً عن الشاطئ', 'السباحة مسموحة بحذر وقرب الشاطئ لأن البحر مضطرب نوعاً ما', 'الشاطئ مغلق'], answer: 1, why: 'الراية الصفراء تعني الحذر: البحر مضطرب نوعاً ما، فنسبح قرب الشاطئ وتحت المراقبة.', onShow: () => coast.setFlag('yellow') },
        { q: 'والراية الحمراء؟', options: ['السباحة ممنوعة لأن البحر خطير', 'السباحة للمتمكنين فقط', 'وقت الغداء'], answer: 0, why: 'الراية الحمراء تعني أن السباحة ممنوعة لخطورة البحر، حتى على السبّاحين الماهرين.', onShow: () => coast.setFlag('red') },
        { q: 'أين يجب أن تسبح؟', options: ['في أي مكان يعجبني', 'وحدي بعيداً عن الناس', 'داخل المنطقة المحروسة بين العوامات وتحت نظر المنقذ'], answer: 2, why: 'نسبح دائماً داخل المنطقة المحروسة بين العوامات، حيث يرانا المنقذ ويستطيع مساعدتنا.', onShow: () => coast.setFlag('green') }
      ],
      setup: withCtx(setupCommon),
      update: withCtx((dt, ctx) => ({ progress: ctx.data.quizDone ? 1 : 0, done: !!ctx.data.quizDone })),
      cleanup: withCtx(cleanupCommon)
    },
    {
      id: 'rescue', title: 'التوعية بالإنقاذ', reward: { xp: 120, coins: 50 },
      brief: 'تمرين توعوي: سبّاح يطلب النجدة. اختر التصرّف الصحيح ثم نفّذه.',
      objective: 'تصرّف بأمان عند رؤية سبّاح يطلب النجدة',
      quiz: [
        { q: 'رأيت سبّاحاً يلوّح طالباً النجدة قرب حبل العوامات. ماذا تفعل؟', options: ['أسبح إليه بسرعة لأسحبه بنفسي', 'أنادي المنقذ فوراً وأشير إلى مكان السبّاح', 'أصوّره بالهاتف'], answer: 1, right: 'صحيح! نُبلغ المنقذ المدرَّب فوراً ونشير إلى مكانه. اذهب الآن إلى برج المنقذ واضغط E.', why: 'السبّاح الخائف قد يجرّك معه تحت الماء. الإنقاذ مهمة المنقذ المدرَّب، ودورنا أن نُبلغه بسرعة.' }
      ],
      setup: withCtx((ctx) => {
        setupCommon(ctx);
        const d = ctx.data;
        // The swimmer in difficulty (a training scenario, inside the shallow zone)
        const m = new CharacterModel('npc_adult', { isNPC: true, npcRole: 'citizen', primaryColor: 0xe67e22, build: 0.9, height: 0.9 });
        d.swimmer = { model: m, x: -11, z: 44.5 };
        coast.group.add(m.group);
        d.objs.push(m.group);
        d.phase = 'alert';
        d.lg = coast.npcs.lifeguard;
        d.lgStart = d.lg.model.group.position.clone();
        hooks.onLifeguardAlert = () => {
          if (d.phase !== 'alert' || !d.quizDone) return false;
          d.phase = 'run';
          audio.playWhistle();
          events.emit('TOAST', '💬 المنقذ سفيان: شكراً على الإبلاغ! ابقَ على الشاطئ، سأتولّى الأمر.');
          return true;
        };
      }),
      update: withCtx((dt, ctx) => {
        const d = ctx.data, s = d.swimmer, lg = d.lg.model.group;
        // Swimmer treads water and waves
        s.model.group.position.set(s.x, WATER_Y - 1.0, s.z);
        s.model.update(dt, { swimming: d.phase !== 'safe', isMoving: false });
        if (d.phase !== 'safe' && d.phase !== 'back') { s.model.bones.rightArm.rotation.set(0, 0, 2.6 + Math.sin(ctx.time * 8) * 0.3); }
        const go = (tx, tz, speed, swim) => {
          const dx = tx - lg.position.x, dz = tz - lg.position.z, dd = Math.hypot(dx, dz);
          if (dd > 0.2) { lg.position.x += dx / dd * Math.min(dd, speed * dt); lg.position.z += dz / dd * Math.min(dd, speed * dt); lg.rotation.y = Math.atan2(dx, dz); }
          lg.position.y = swim ? WATER_Y - 1.0 : 0;
          d.lg.model.update(dt, { isMoving: dd > 0.2, swimming: swim, speedRatio: 1.2 });
          return dd <= 0.2;
        };
        if (!d.quizDone) return { progress: 0, text: 'اختر التصرّف الصحيح' };
        if (d.phase === 'alert') { d.lg.model.update(dt, { isMoving: false }); return { progress: 0.33, text: 'اذهب إلى برج المنقذ واضغط E لإبلاغه' }; }
        if (d.phase === 'run') { if (go(-11, SHORE_Z - 0.5, 4.5, false)) d.phase = 'swim'; return { progress: 0.5, text: 'المنقذ في طريقه، ابقَ على الشاطئ وراقب' }; }
        if (d.phase === 'swim') { if (go(-11, 43.6, 2.6, true)) d.phase = 'back'; return { progress: 0.66, text: 'المنقذ يسبح نحو السبّاح مع عوّامة النجدة' }; }
        if (d.phase === 'back') {
          const arrived = go(-11, SHORE_Z - 1.5, 2.2, lg.position.z > SHORE_Z + 1);
          s.x = lg.position.x + 0.6; s.z = lg.position.z + 0.6;
          if (arrived) { d.phase = 'safe'; s.model.group.position.y = 0; events.emit('TOAST', '💬 السبّاح: شكراً لكما! كنت متعباً جداً.'); }
          return { progress: 0.85, text: 'المنقذ يعيد السبّاح إلى الشاطئ' };
        }
        s.model.group.position.set(s.x, 0, s.z);
        return { progress: 1, done: true };
      }),
      cleanup: withCtx((ctx) => {
        hooks.onLifeguardAlert = null;
        const lg = ctx.data.lg.model.group;
        lg.position.copy(ctx.data.lgStart);
        lg.rotation.y = 0;
        cleanupCommon(ctx);
      })
    }
  ];

  return {
    id: 'swimming', title: 'مدرسة السباحة', icon: '🏊', giver: 'المدرّبة نسرين',
    intro: 'مرحباً بك في مدرسة السباحة! نتعلّم هنا خطوة بخطوة وتحت حراسة المنقذ. لا نسبح أبداً خارج حبال العوامات، ولا وحدنا، ولا عند رفع الراية الحمراء. في الماء: الأسهم أو WASD للسباحة، وShift للأسرع.',
    finale: 'أصبحت سبّاحاً واعياً بقواعد الأمان. تذكّر: المنقذ صديقك!',
    stages,
    onStageDone: (stage, i, first) => {
      if (first && stage.id === 'distance') setTimeout(() => events.emit('TOAST', '🔓 صار بإمكانك السباحة في المنطقة المتقدمة (العوامات الحمراء) تحت الحراسة.'), 4200);
    }
  };
}
