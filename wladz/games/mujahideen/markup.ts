// Corps de index.html de « المجاهدون الستة », repris tel quel ;
// seuls ajouts WLADZ : boutons « خروج ».
export const mujahideenMarkup = `<!-- HUD -->
<div id="hud" class="hidden">
  <div class="top">
    <div class="card stat"><span class="lbl">النقاط</span><b id="score">0</b></div>
    <div class="card vitals">
      <div class="row"><span>❤️</span><div class="bar"><i id="hpFill"></i></div></div>
      <div class="row"><span>⚡</span><div class="bar"><i id="stFill"></i></div></div>
    </div>
    <div class="card progress"><span class="lbl">الطريق إلى المغارة</span>
      <div class="track" id="track"><i id="progFill"></i><span id="progDot">🧭</span></div>
    </div>
    <div class="card stat"><span class="lbl">الشهداء</span><b><span id="lost">0</span><small> / 3</small></b></div>
    <div class="btns">
      <button class="icon-btn" id="pauseBtn" title="إيقاف (P)">⏸</button>
      <button class="icon-btn" id="muteBtn" title="الصوت (M)">🔊</button>
    </div>
  </div>
  <div id="airAlert" class="air-alert">✈️ طائرات العدو فوقكم — ابتعد عن الدوائر الحمراء!</div>
  <div class="hint"><kbd>W A S D</kbd> / الأسهم للحركة · <kbd>Shift</kbd> ركض · <kbd>Space</kbd> قفز · <kbd>P</kbd> إيقاف</div>
  <div id="squad" class="squad"></div>
</div>
<div id="vignette"></div>
<div id="toasts"></div>

<!-- touch controls -->
<div id="touch" class="hidden">
  <div id="joy"><div id="knob"></div></div>
  <button class="tbtn" id="tJump">⤒</button>
  <button class="tbtn" id="tRun">🏃</button>
</div>

<!-- TITLE -->
<div id="titleScreen" class="modal">
  <div class="panel">
    <div class="flagWrap" id="flagSvg"></div>
    <div class="kicker">جبال الأوراس · ليلة الفاتح من نوفمبر 1954</div>
    <h1 class="big">المجاهدون الستة</h1>
    <p class="lead">قُد القادة الستة التاريخيين عبر الممرات الجبلية تحت قصف الطائرات حتى تبلغوا المغارة الآمنة.
      كل عائق في الطريق مرتبط بأحد القادة، ولا يُفتح إلا بالإجابة عن سؤال حوله.</p>
    <div class="rules">
      <div><span>🧠</span>إجابة خاطئة = استشهاد أحد رفاقك</div>
      <div><span>🎯</span>الدائرة الحمراء = مكان سقوط قنبلة</div>
      <div><span>📜</span>اجمع مناشير بيان نوفمبر لتتعلم أكثر</div>
      <div><span>💔</span>3 شهداء أو نفاد صحتك = فشل المهمة</div>
    </div>
    <div class="chips" id="chips"></div>
    <button class="btn" id="startBtn">بسم الله — ابدأ المهمة</button>
    <button class="btn ghost wladz-exit" type="button">✕ خروج — العودة إلى WLADZ</button>
    <div class="best" id="bestTitle"></div>
    <div class="keys"><kbd>W A S D</kbd> أو الأسهم للحركة · <kbd>Shift</kbd> ركض · <kbd>Space</kbd> قفز · <kbd>1-4</kbd> للإجابة · <kbd>P</kbd> إيقاف · <kbd>M</kbd> الصوت</div>
    <div class="note">رحلة رمزية تكريماً للستة التاريخيين الذين فجّروا ثورة التحرير المباركة.</div>
  </div>
</div>

<!-- QUIZ -->
<div id="quizModal" class="modal hidden">
  <div class="panel" id="quizPanel">
    <div class="q-head">
      <div class="q-icon" id="qIcon">🦁</div>
      <div><div class="q-name" id="qName"></div><div class="q-title" id="qTitle"></div></div>
    </div>
    <div class="q-type" id="qType"></div>
    <div class="q-text" id="qText"></div>
    <div class="opts" id="qOpts"></div>
    <div id="qFeedback" class="feedback hidden"></div>
    <button class="btn hidden" id="qNext" style="margin-top:14px">تابع المسير ←</button>
  </div>
</div>

<!-- PAUSE -->
<div id="pauseModal" class="modal hidden">
  <div class="panel" style="max-width:420px">
    <div style="font-size:46px">⏸</div>
    <h1 class="big" style="font-size:40px">استراحة</h1>
    <p class="lead">الرفاق ينتظرون أوامرك.</p>
    <div class="btn-row">
      <button class="btn" id="resumeBtn">متابعة</button>
      <button class="btn ghost" id="restartBtn">إعادة المهمة</button>
      <button class="btn ghost wladz-exit" type="button">✕ خروج</button>
    </div>
  </div>
</div>

<!-- END -->
<div id="endScreen" class="modal hidden">
  <div class="panel wide">
    <div class="endIcon" id="endIcon"></div>
    <h1 class="big" id="endTitle"></h1>
    <p class="lead" id="endSub" style="margin-bottom:4px"></p>
    <div class="stars" id="stars"></div>
    <div class="scoreBig" id="endScore">0</div>
    <div class="best" id="endBest"></div>
    <div class="breakdown" id="breakdown"></div>
    <div class="verse">وَلَا تَقُولُوا لِمَن يُقْتَلُ فِي سَبِيلِ اللَّهِ أَمْوَاتٌ ۚ بَلْ أَحْيَاءٌ وَلَٰكِن لَّا تَشْعُرُونَ</div>
    <h3>بطاقات القادة</h3>
    <div class="cards" id="cards"></div>
    <div class="btn-row"><button class="btn" id="againBtn">العب مجدداً</button><button class="btn ghost wladz-exit" type="button">✕ خروج</button></div>
  </div>
</div>`;
