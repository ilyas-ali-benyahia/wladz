// Corps de « درب المهارات.html », repris tel quel : engine.js pilote ces éléments
// par leurs id. Ajouts WLADZ : le bouton « خروج », la carte des stations dans l'accueil
// (à la place de l'objet 3D) et la boîte d'image des stations.
export const skillsMarkup = `<div class="bar">
  <div class="wrap">
    <button class="brand" id="homeBtn" aria-label="العودة إلى الخريطة"><i></i>درب المهارات</button>
    <div class="chips">
      <span class="chip">⭐ <b id="starsChip">0</b>/18</span>
      <span class="chip">خبرة <b id="xpChip">0</b></span>
    </div>
    <button class="btn ghost exit" id="exitBtn" aria-label="خروج من اللعبة">✕ خروج</button>
  </div>
</div>

<main>
  <section id="home" class="wrap">
    <div class="hero">
      <div>
        <div class="eyebrow">رحلة المهارات الحياتية</div>
        <h1>ست محطات<br>تصنع <span>بطلًا</span></h1>
        <p class="lead">في كل محطة: بطاقات تتعلّم منها، وتحدٍّ يختبر قراراتك. اجمع النجوم لتفتح الطريق.</p>
        <div class="name-row">
          <input id="nameIn" maxlength="24" placeholder="اكتب اسمك يا بطل…" aria-label="اسم اللاعب">
          <button class="btn" id="goBtn">ابدأ الرحلة</button>
        </div>
        <div class="rank">
          <div class="rank-top"><span>الرتبة: <strong id="rankName">مستكشف</strong></span><span id="rankNext"></span></div>
          <div class="meter"><div id="rankBar" style="width:0"></div></div>
        </div>
      </div>
      <div class="hero-map">
        <h2 class="section-h">خريطة الطريق</h2>
        <p class="section-sub">نجمة واحدة على الأقل تفتح المحطة التالية. ثلاث نجوم = إتقان كامل.</p>
        <div class="map" id="map"></div>
      </div>
    </div>

    <div id="certSlot"></div>
  </section>

  <section id="level" class="wrap level" hidden>
    <div class="lvl-head">
      <button class="btn ghost" id="backBtn">→ الخريطة</button>
      <span class="tag" id="lvlTag"></span>
      <div class="steps" id="steps"><span>تعرّف</span><span>بطاقات</span><span>تحدٍّ</span><span>نتيجة</span></div>
    </div>
    <div class="lvl-grid">
      <div class="stage-box pic-box" id="levelStage"></div>
      <div class="panel" id="panel"></div>
    </div>
  </section>
</main>
<footer class="wrap">درب المهارات · برنامج تربوي للمهارات الحياتية</footer>
<canvas id="confetti"></canvas>`;
