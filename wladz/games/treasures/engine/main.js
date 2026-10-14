// نقطة انطلاق تطبيق ولعبة كنوز الجزائر (Main App Entry)
// WLADZ : chargé après le rendu de la page (import dynamique), donc démarré tout de suite
// au lieu d'attendre DOMContentLoaded ; bouton « خروج » ajouté (événement treasures:exit).
// Retirés pour WLADZ : pièces et joyaux, roue de la chance, cadeaux quotidiens et coffre.

import { store } from "./state/store.js";
import { iconSvg } from "../../_shared/svgIcons.js";
import { sounds } from "./audio/audioEngine.js";
import { WILAYAS_DATA } from "./data/wilayas.js";
import { ConfettiEngine } from "./components/confetti.js";
import { FactModal } from "./components/factModal.js";
import { AchievementsModal } from "./components/achievementsModal.js";
import { LeaderboardModal } from "./components/leaderboardModal.js";
import { StatsModal } from "./components/statsModal.js";
import { MapView } from "./components/mapView.js";
import { GameView } from "./components/gameView.js";
import { InteractiveMap } from "./components/interactiveMap.js";
import { WilayaInfoSheet } from "./components/wilayaInfoSheet.js";

(() => {
  // ‎#app يستخدم backdrop-filter فيصبح حاوية للعناصر الثابتة (position: fixed)،
  // لذا يُنقل شريط التنقل والنوافذ المنبثقة إلى body لتتموضع بالنسبة للشاشة لا لطول الصفحة
  document.querySelectorAll(".bottom-nav, .modal-backdrop, #confetti-canvas").forEach((el) => document.body.appendChild(el));

  // تهيئة المؤثرات
  const confetti = new ConfettiEngine("confetti-canvas");

  // تهيئة النوافذ المنبثقة
  const achievementsModal = new AchievementsModal(confetti);
  const leaderboardModal = new LeaderboardModal();
  const statsModal = new StatsModal();

  let gameView = null;
  let mapView = null;
  let interactiveMap = null;
  let infoSheet = null;

  // التنقل بين الشاشات
  const switchView = (viewName) => {
    document.querySelectorAll(".view-section").forEach((sec) => sec.classList.remove("active"));
    document.querySelectorAll(".nav-item").forEach((item) => item.classList.remove("active"));

    const targetSection = document.getElementById(`view-${viewName}`);
    const targetNav = document.querySelector(`.nav-item[data-view="${viewName}"]`);

    if (targetSection) targetSection.classList.add("active");
    if (targetNav) targetNav.classList.add("active");

    if (viewName === "map" && mapView) {
      mapView.render();
      interactiveMap?.refresh();
    }
  };

  // معالجات بطاقة "هل تعلم؟"
  const factModal = new FactModal(
    confetti,
    () => {
      // المرحلة التالية
      if (gameView) gameView.nextStage();
    },
    () => {
      // العودة للخريطة
      switchView("map");
    }
  );

  // تهيئة شاشة اللعبة
  gameView = new GameView(factModal, () => switchView("map"));

  const playWilaya = (selectedWilaya) => {
    store.getState().currentWilayaId = selectedWilaya.id;
    store.saveState();
    gameView.loadWilaya(selectedWilaya);
    switchView("game");
  };

  // الخريطة التفاعلية وبطاقة معلومات الولاية
  interactiveMap = new InteractiveMap((code) => infoSheet.show(code));
  infoSheet = new WilayaInfoSheet({
    getBBox: (code) => interactiveMap.getBBox(code),
    onPlay: playWilaya,
    onNavigate: (code) => interactiveMap.select(code),
    onClose: () => interactiveMap.clearSelection(),
  });

  // تهيئة شاشة الخريطة
  mapView = new MapView(playWilaya, {
    onFilter: (codes) => interactiveMap.setFilter(codes),
    onInfo: (code) => {
      interactiveMap.select(code);
      infoSheet.show(code);
    },
  });

  // تحديث عدادات الاقتصاد والرأس العلوي
  const updateHeaderUI = (state) => {
    const starsEl = document.getElementById("header-stars-val");
    const playerNameEl = document.getElementById("header-player-name");
    const soundBtn = document.getElementById("header-sound-btn");

    if (starsEl) starsEl.textContent = state.totalStars;
    if (playerNameEl) playerNameEl.textContent = state.playerName;

    if (soundBtn) {
      soundBtn.innerHTML = iconSvg(state.settings.soundEnabled ? "volume-2" : "volume-x");
    }
  };

  store.subscribe(updateHeaderUI);
  store.subscribe(() => interactiveMap?.refresh());
  updateHeaderUI(store.getState());

  // أحداث الشريط السفلي
  document.querySelectorAll(".nav-item").forEach((btn) => {
    btn.addEventListener("click", () => {
      const view = btn.getAttribute("data-view");
      sounds.playLetterClick();

      if (view === "achievements") {
        achievementsModal.show();
      } else if (view === "stats") {
        statsModal.show();
      } else if (view === "game") {
        // إذا لم تكن هناك ولاية محملة، حمّل ولاية أدرار (أو الحالية)
        const currentWilaya = WILAYAS_DATA.find((w) => w.id === store.getState().currentWilayaId) || WILAYAS_DATA[0];
        gameView.loadWilaya(currentWilaya);
        switchView("game");
      } else {
        switchView(view);
      }
    });
  });

  // أزرار الرأس العلوي
  const avatarBtn = document.getElementById("header-avatar-btn");
  if (avatarBtn) {
    avatarBtn.addEventListener("click", () => {
      sounds.playLetterClick();
      statsModal.show();
    });
  }

  const soundBtn = document.getElementById("header-sound-btn");
  if (soundBtn) {
    soundBtn.addEventListener("click", () => {
      const state = store.getState();
      state.settings.soundEnabled = !state.settings.soundEnabled;
      sounds.setMuted(!state.settings.soundEnabled);
      if (state.settings.soundEnabled) {
        sounds.playLetterClick();
      }
      store.saveState();
    });
  }

  document.getElementById("header-exit-btn")?.addEventListener("click", () => {
    window.dispatchEvent(new CustomEvent("treasures:exit"));
  });

  const musicBtn = document.getElementById("header-music-btn");
  if (musicBtn) {
    musicBtn.addEventListener("click", () => {
      const isPlaying = sounds.toggleMusic();
      musicBtn.style.color = isPlaying ? "var(--c-gold)" : "var(--text-muted)";
      musicBtn.innerHTML = iconSvg(isPlaying ? "music-2" : "music");
    });
  }

  // بطاقات الوصول السريع في الخريطة

  const quickLeaderboard = document.getElementById("quick-leaderboard-btn");
  if (quickLeaderboard) {
    quickLeaderboard.addEventListener("click", () => {
      sounds.playLetterClick();
      leaderboardModal.show();
    });
  }

  // عرض الخريطة أولاً
  mapView.render();
  switchView("map");

})();
