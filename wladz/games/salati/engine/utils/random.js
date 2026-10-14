/** Fisher–Yates shuffle (unbiased). Returns a new array. */
export function shuffle(items, rng = Math.random) {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Like shuffle(), but never returns the original order (for n >= 2). */
export function shuffleNotIdentity(items, rng = Math.random) {
  if (items.length < 2) return [...items];
  let out;
  do {
    out = shuffle(items, rng);
  } while (out.every((v, i) => v === items[i]));
  return out;
}
