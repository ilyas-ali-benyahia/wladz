/**
 * Accessible modal dialog (WAI-ARIA APG "Dialog (Modal)" pattern):
 * role="dialog", aria-modal, labelled by its title, focus moved inside and trapped,
 * focus restored on close. The overlay blocks pointer interaction with the game behind it.
 * The dialog is mounted inside the game root, never on the page body.
 */
import gsap from 'gsap';

const FOCUSABLE = 'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), summary, [href], [tabindex]:not([tabindex="-1"])';

/**
 * @param {{ root: HTMLElement, id: string, titleId?: string, html: string, reducedMotion?: boolean }} options
 */
export function openDialog({ root, id, titleId, html, reducedMotion = false }) {
  const previouslyFocused = document.activeElement;

  const overlay = document.createElement('div');
  overlay.className = 'overlay';
  overlay.id = `${id}Overlay`;

  const card = document.createElement('div');
  card.className = 'popup glass glass-strong';
  card.id = id;
  card.setAttribute('role', 'dialog');
  card.setAttribute('aria-modal', 'true');
  if (titleId) card.setAttribute('aria-labelledby', titleId);
  // Only static, author-written markup reaches this function (no user input).
  card.innerHTML = html;

  root.appendChild(overlay);
  root.appendChild(card);

  if (reducedMotion) {
    gsap.set([overlay, card], { opacity: 1 });
  } else {
    gsap.fromTo(overlay, { opacity: 0 }, { opacity: 1, duration: 0.25 });
    gsap.fromTo(card, { scale: 0.92, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.35, ease: 'back.out(1.4)' });
  }

  const onKeydown = (e) => {
    if (e.key !== 'Tab') return;
    const items = [...card.querySelectorAll(FOCUSABLE)].filter(el => el.offsetParent !== null);
    if (!items.length) { e.preventDefault(); return; }
    const first = items[0];
    const last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    else if (!card.contains(document.activeElement)) { e.preventDefault(); first.focus(); }
  };
  document.addEventListener('keydown', onKeydown);

  let destroyed = false;
  const destroy = () => {
    if (destroyed) return;
    destroyed = true;
    document.removeEventListener('keydown', onKeydown);
    gsap.killTweensOf([overlay, card]);
    overlay.remove();
    card.remove();
    if (previouslyFocused && previouslyFocused.focus && document.contains(previouslyFocused)) {
      try { previouslyFocused.focus({ preventScroll: true }); } catch { /* element no longer focusable */ }
    }
  };

  /** Animates out, then removes the dialog and calls `after`. */
  const close = (after) => {
    if (destroyed) return;
    if (reducedMotion) { destroy(); after?.(); return; }
    gsap.to(card, { scale: 0.92, opacity: 0, duration: 0.2 });
    gsap.to(overlay, { opacity: 0, duration: 0.2, onComplete: () => { destroy(); after?.(); } });
  };

  const focusFirst = () => {
    const target = card.querySelector('[data-autofocus]') || card.querySelector(FOCUSABLE);
    if (target) target.focus({ preventScroll: true });
  };
  focusFirst();

  return { overlay, card, close, destroy, focusFirst, isOpen: () => !destroyed };
}
