// Corps de index.html de « كنوز الجزائر » (lamatna2), repris tel quel : le moteur
// (games/treasures/engine) pilote ces éléments par leurs id et leurs classes.
// Seuls changent les chemins des images, les couleurs et le bouton « خروج ».
// Retirés pour WLADZ : pièces et joyaux, roue de la chance, cadeaux quotidiens et coffre.
export const treasuresMarkup = `<!-- حاوية التطبيق المركزية -->
  <div id="app">

    <!-- شريط الرأس العلوي الفاخر -->
    <header class="top-header">
      <div class="player-info">
        <div class="avatar-badge" id="header-avatar-btn" title="الملف الشخصي والإحصائيات">
          <span>🏺</span>
        </div>
        <div class="player-details">
          <span class="player-title">رحالة الجزائر</span>
          <span class="player-name" id="header-player-name">مستكشف الكنوز</span>
        </div>
      </div>

      <div class="economy-bar">
        <div class="eco-pill stars" title="إجمالي النجوم المجمعة">
          <span class="eco-icon">⭐</span>
          <span id="header-stars-val">0</span>
        </div>
      </div>

      <div class="header-actions">
        <button class="header-btn" id="header-music-btn" title="تشغيل/إيقاف الموسيقى التراثية">🎼</button>
        <button class="header-btn" id="header-sound-btn" title="كتم/تشغيل المؤثرات">🔊</button>
        <button class="header-btn exit-btn" id="header-exit-btn" title="خروج من اللعبة" aria-label="خروج من اللعبة">✕</button>
      </div>
    </header>

    <!-- مساحة المحتوى والشاشات المتنقلة -->
    <main class="main-viewport">

      <!-- ==========================================
           الشاشة 1: خريطة الجزائر ومسار الولايات الـ 58
           ========================================== -->
      <section class="view-section active" id="view-map">
        <div class="map-container">

          <!-- العمود الأول: البانر، الوصول السريع، البحث والقائمة -->
          <div class="home-list-side">

          <!-- بطاقة البانر الترحيبية -->
          <div class="hero-banner-card">
            <img class="hero-banner-img" src="/games/treasures/assets/banner.jpg" alt="كنوز الجزائر التراثية">
            <div class="hero-overlay">
              <span class="hero-badge-pill">رحلة الـ 58 ولاية 🇩🇿</span>
              <h1 class="hero-title">كنوز الجزائر</h1>
              <p class="hero-desc">اكتشف تاريخ وتراث وأصالة الجزائر ولاية بعد ولاية، وابدأ من واحات أدرار العريقة!</p>
            </div>
          </div>

          </div>

          <!-- العمود الثاني: خريطة الجزائر التفاعلية (ثابتة على الشاشات الكبيرة) -->
          <div class="home-map-side">
          <div class="imap-card">
            <div class="imap-header">
              <div class="imap-heading">
                <h2 class="imap-title">🗺️ خريطة الجزائر التفاعلية</h2>
                <span class="imap-sub">المس أي ولاية لاكتشاف تاريخها وتراثها</span>
              </div>
              <div class="imap-mode-toggle" role="group" aria-label="طريقة تلوين الخريطة">
                <button class="imap-mode-btn active" data-mode="region">المناطق</button>
                <button class="imap-mode-btn" data-mode="progress">تقدّمي</button>
              </div>
            </div>

            <div class="imap-stage" id="imap-stage">
              <svg class="imap-svg" id="imap-svg" role="img" aria-label="خريطة ولايات الجزائر الـ 58" preserveAspectRatio="xMidYMid meet"></svg>
              <div class="imap-tooltip" id="imap-tooltip"></div>
              <div class="imap-zoom-controls">
                <button class="imap-zoom-btn" data-zoom="in" aria-label="تكبير">+</button>
                <button class="imap-zoom-btn" data-zoom="out" aria-label="تصغير">−</button>
                <button class="imap-zoom-btn" data-zoom="reset" aria-label="إعادة الضبط">⤢</button>
              </div>
              <span class="imap-hint">قرّب بإصبعين • اسحب للتنقل</span>
            </div>

            <div class="imap-legend" id="imap-legend"></div>
          </div>
          </div>

          <div class="home-list-side home-list-rest">

          <!-- شريط البحث وتصفية المناطق -->
          <div class="search-filter-section">
            <div class="search-box">
              <span class="search-icon">🔍</span>
              <input type="text" class="search-input" id="wilaya-search-input" placeholder="ابحث عن ولاية أو معلم أو تراث...">
            </div>

            <div class="region-chips">
              <button class="region-chip active" data-region="all">كل الولايات (58)</button>
              <button class="region-chip" data-region="الجنوب">الجنوب الكبير</button>
              <button class="region-chip" data-region="الهضاب">الهضاب والسهوب</button>
              <button class="region-chip" data-region="الساحل">الساحل والمتوسط</button>
              <button class="region-chip" data-region="الشرق">الشرق الجزائري</button>
              <button class="region-chip" data-region="الغرب">الغرب الجزائري</button>
              <button class="region-chip" data-region="الوسط">الوسط والعاصمة</button>
            </div>
          </div>

          <!-- قائمة مسار الولايات -->
          <div class="wilayas-journey-list" id="wilayas-journey-list">
            <!-- تُبنى بطاقات الولايات هنا ديناميكياً -->
          </div>

          </div>

        </div>
      </section>

      <!-- ==========================================
           الشاشة 2: شاشة اللعب التفاعلية
           ========================================== -->
      <section class="view-section" id="view-game">
        <div class="game-container">

          <!-- ترويسة المرحلة -->
          <div class="stage-top-bar">
            <div class="stage-wilaya-info">
              <button class="back-to-map-btn" id="game-back-btn" title="العودة للخريطة">➔</button>
              <div class="stage-title-wrap">
                <span class="stage-wilaya-name" id="game-wilaya-name">ولاية أدرار</span>
                <span class="stage-num-badge" id="game-stage-counter">المرحلة 1 من 8</span>
              </div>
            </div>
            <span class="stage-category-pill" id="game-category-tag">معالم وقصور</span>
          </div>

          <!-- بطاقة السؤال والصورة -->
          <div class="question-card">
            <div class="stage-media-wrap">
              <img class="stage-image" id="game-stage-image" src="/games/treasures/assets/timimoun.jpg" alt="سؤال المرحلة">
              <span class="media-badge-tag" id="game-media-badge">معلم أثري</span>
            </div>

            <div class="question-text-box">
              <span class="question-subtitle" id="game-question-subtitle">قصور الطين الحمراء</span>
              <h2 class="question-title" id="game-question-title">ما اسم هذه الواحة الشهيرة بقصورها الطينية بأدرار؟</h2>
            </div>

            <!-- شريط أدوات المساعدة -->
            <div class="hints-toolbar">
              <button class="hint-tool-btn" id="hint-reveal-btn" title="كشف حرف صحيح في الإجابة">
                <span>💡 كشف حرف</span>
              </button>
              <button class="hint-tool-btn" id="hint-remove-btn" title="حذف أحرف خاطئة مبعثرة">
                <span>🗑️ حذف أحرف</span>
              </button>
            </div>
          </div>

          <!-- مساحة اللعب التفاعلية (تبنى ديناميكياً حسب نوع المرحلة) -->
          <div id="game-puzzle-area"></div>

          <!-- تنبيه الخطأ السفلي -->
          <div class="error-shake-banner" id="game-error-banner">إجابة غير صحيحة، حاول مجدداً!</div>

        </div>
      </section>

    </main>

    <!-- شريط التنقل السفلي -->
    <nav class="bottom-nav">
      <button class="nav-item active" data-view="map">
        <span class="nav-icon">🗺️</span>
        <span>الخريطة</span>
      </button>

      <button class="nav-item play-center" data-view="game">
        <span class="nav-icon">🎮</span>
        <span>العب</span>
      </button>

      <button class="nav-item" data-view="achievements">
        <span class="nav-icon">🏆</span>
        <span>الإنجازات</span>
      </button>

      <button class="nav-item" data-view="stats">
        <span class="nav-icon">📊</span>
        <span>إحصائياتي</span>
      </button>
    </nav>

    <!-- ==========================================
         النوافذ المنبثقة التفاعلية (Modals)
         ========================================== -->

    <!-- نافذة "هل تعلم؟" والاحتفال بالنجاح -->
    <div class="modal-backdrop" id="fact-modal-backdrop">
      <div class="modal-card">
        <button class="modal-close-btn" id="fact-close-btn">✕</button>
        <span class="fact-header-badge">إجابة صحيحة وممتازة! 🎉</span>

        <div class="stars-earned-row" id="fact-stars-box">
          <span class="star-icon-anim">⭐</span>
          <span class="star-icon-anim">⭐</span>
          <span class="star-icon-anim">⭐</span>
        </div>

        <div class="rewards-display-row" id="fact-rewards-box">

        </div>

        <div class="fact-content-box">
          <h3 class="fact-title" id="fact-title">هل تعلم عن قصر تيميمون؟</h3>
          <p class="fact-text" id="fact-text">معلومة تراثية ممتعة عن أصالة الجزائر...</p>
        </div>

        <button class="btn btn-primary" id="fact-next-btn" style="width:100%;">
          <span>المرحلة التالية</span>
          <span>←</span>
        </button>
      </div>
    </div>

    <!-- نافذة الإنجازات -->
    <div class="modal-backdrop" id="achievements-modal-backdrop">
      <div class="modal-card">
        <button class="modal-close-btn" id="achievements-close-btn">✕</button>
        <h3 style="font-family:var(--font-display); font-size:1.35rem; color:var(--text-gold);">🏆 سجل الإنجازات والأوسمة</h3>
        <p style="font-size:0.8rem; color:var(--text-muted); text-align:center;">أكمل المهام التراثية واجمع الأوسمة!</p>

        <div class="modal-list-container" id="achievements-list"></div>
      </div>
    </div>

    <!-- نافذة لوحة المتصدرين -->
    <div class="modal-backdrop" id="leaderboard-modal-backdrop">
      <div class="modal-card">
        <button class="modal-close-btn" id="leaderboard-close-btn">✕</button>
        <h3 style="font-family:var(--font-display); font-size:1.35rem; color:var(--text-gold);">🥇 لوحة المتصدرين</h3>
        <p style="font-size:0.8rem; color:var(--text-muted); text-align:center;">أعظم رحالة ومستكشفي كنوز الجزائر على مر العصور</p>

        <div class="modal-list-container" id="leaderboard-list"></div>
      </div>
    </div>

    <!-- نافذة إحصائيات اللاعب -->
    <div class="modal-backdrop" id="stats-modal-backdrop">
      <div class="modal-card">
        <button class="modal-close-btn" id="stats-close-btn">✕</button>
        <h3 style="font-family:var(--font-display); font-size:1.35rem; color:var(--text-gold);">📊 إحصائيات المستكشف</h3>
        <p style="font-size:0.8rem; color:var(--text-muted); text-align:center;">سجل إنجازاتك في اكتشاف ربوع الوطن الغالي</p>

        <div id="stats-modal-content" style="width:100%;"></div>
      </div>
    </div>

    <!-- بطاقة معلومات الولاية (تاريخ، أعلام، تقاليد، ثقافة، معالم) -->
    <div class="modal-backdrop sheet-backdrop" id="wilaya-sheet-backdrop">
      <div class="wilaya-sheet" id="wilaya-sheet-card" role="dialog" aria-modal="true" aria-labelledby="wilaya-sheet-title">
        <div class="ws-handle" id="wilaya-sheet-handle"><span></span></div>
        <button class="modal-close-btn ws-close" id="wilaya-sheet-close" aria-label="إغلاق">✕</button>
        <div class="ws-body" id="wilaya-sheet-body"></div>
      </div>
    </div>

    <!-- كانفاس الألعاب النارية والاحتفال -->
    <canvas id="confetti-canvas"></canvas>

  </div>`;
