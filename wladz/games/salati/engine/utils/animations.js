/**
 * Animation and feedback helpers built on GSAP.
 * Every DOM lookup is scoped to the game root element, so the game never touches the rest of the page.
 */
import gsap from 'gsap';

/** True when the user asked the OS/browser to minimise non-essential motion. */
export function prefersReducedMotion() {
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
}

/**
 * Tween handle of the screen transition in flight, stored per root so that two game instances
 * never share state. A new transition interrupts the one in flight: its tweens stop and its
 * callback still runs (callers guard with run tokens), so a late onComplete can never hide the
 * screen we are moving to.
 */
const transitions = new WeakMap();

/**
 * @param {HTMLElement} root  game root element
 * @param {HTMLElement|null} fromScreen
 * @param {HTMLElement} toScreen
 * @param {() => void} [callback]
 */
export function transitionScreen(root, fromScreen, toScreen, callback) {
  const previous = transitions.get(root);
  if (previous) {
    transitions.delete(root);
    previous.tweens.forEach(t => t.kill());
    previous.callback?.();
  }
  root.querySelectorAll('.screen.active').forEach(s => {
    if (s !== fromScreen && s !== toScreen) { s.classList.remove('active'); gsap.set(s, { clearProps: 'all' }); }
  });
  if (prefersReducedMotion()) {
    if (fromScreen && fromScreen !== toScreen) { fromScreen.classList.remove('active'); gsap.set(fromScreen, { clearProps: 'all' }); }
    toScreen.classList.add('active');
    gsap.set(toScreen, { clearProps: 'all' });
    if (callback) callback();
    return;
  }
  const job = { tweens: [], callback };
  transitions.set(root, job);
  const done = () => { if (transitions.get(root) === job) transitions.delete(root); if (callback) callback(); };
  const enter = () => job.tweens.push(gsap.fromTo(toScreen,
    { opacity: 0, y: 40, scale: 0.98 },
    { opacity: 1, y: 0, scale: 1, duration: 0.45, ease: 'power2.out', onComplete: done }
  ));
  if (fromScreen && fromScreen !== toScreen && fromScreen.classList.contains('active')) {
    job.tweens.push(gsap.to(fromScreen, {
      opacity: 0,
      y: -40,
      scale: 0.98,
      duration: 0.35,
      ease: 'power2.in',
      onComplete: () => {
        fromScreen.classList.remove('active');
        toScreen.classList.add('active');
        enter();
      }
    }));
  } else {
    toScreen.classList.add('active');
    enter();
  }
}

/**
 * Short, non-blocking message inside the game root.
 * @param {HTMLElement} root
 */
export function showToast(root, message, type = 'info', duration = 2500) {
  let container = root.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    container.setAttribute('role', 'status');
    container.setAttribute('aria-live', 'polite');
    root.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;

  const icons = {
    success: 'fa-check-circle',
    error: 'fa-circle-xmark',
    info: 'fa-circle-info',
    warning: 'fa-triangle-exclamation'
  };

  const icon = document.createElement('i');
  icon.className = `fa-solid ${icons[type] || icons.info}`;
  const text = document.createElement('span');
  text.textContent = message;
  toast.append(icon, text);
  container.appendChild(toast);

  requestAnimationFrame(() => {
    requestAnimationFrame(() => toast.classList.add('show'));
  });

  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 400);
  }, duration);
}

export function createParticles(container, count = 30) {
  if (prefersReducedMotion()) return;
  for (let i = 0; i < count; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    const size = Math.random() * 8 + 4;
    p.style.cssText = `
      left: ${Math.random() * 100}%;
      width: ${size}px;
      height: ${size}px;
      background: ${Math.random() > 0.5 ? 'rgba(46,125,50,0.12)' : 'rgba(25,118,210,0.08)'};
      animation-duration: ${Math.random() * 12 + 12}s;
      animation-delay: ${Math.random() * 10}s;
    `;
    container.appendChild(p);
  }
}

/** Staggered rise-in for a list of elements. Replays cleanly and leaves no inline transform behind. */
export function slideUp(elements, stagger = 0.08) {
  gsap.killTweensOf(elements);
  if (prefersReducedMotion()) { gsap.set(elements, { clearProps: 'opacity,transform' }); return; }
  gsap.fromTo(elements,
    { opacity: 0, y: 24 },
    { opacity: 1, y: 0, duration: 0.45, stagger, ease: 'power2.out', clearProps: 'opacity,transform' }
  );
}
