// ── math.js (v5) ─────────────────────────────────────────────────
// Validated output: answer always > 0, decoys always unique.
// Decoys are plausible-error distractors (off-by-one, adjacent table
// facts, operand confusion) so reading carefully actually matters.

export class MathEngine {
  generate(diff, wave) {
    for (let attempt = 0; attempt < 10; attempt++) {
      const result = this._tryGenerate(diff, wave);
      if (result) return result;
    }
    // Absolute fallback
    return { text: '3 × 3 = ?', answer: 9, decoys: [6, 12], op: '×', a: 3, b: 3 };
  }

  _tryGenerate(diff, wave) {
    let a, b, answer, text, op;

    if (diff === 'easy') {
      a = ri(1, 5); b = ri(1, 5);
      answer = a * b; op = '×'; text = `${a} × ${b} = ?`;

    } else if (diff === 'advanced') {
      if (wave <= 4 || Math.random() < 0.5) {
        a = ri(2, 10); b = ri(2, 10);
        answer = a * b; op = '×'; text = `${a} × ${b} = ?`;
      } else {
        b = ri(2, 9); answer = ri(2, 9); a = b * answer;
        op = '÷'; text = `${a} ÷ ${b} = ?`;
      }

    } else { // ultra
      const ops = ['×', '÷', '+', '-'];
      op = ops[ri(0, 3)];
      if (op === '×') {
        a = ri(5, 14); b = ri(5, 14); answer = a * b; text = `${a} × ${b} = ?`;
      } else if (op === '÷') {
        b = ri(2, 12); answer = ri(2, 12); a = b * answer; text = `${a} ÷ ${b} = ?`;
      } else if (op === '+') {
        a = ri(15, 89); b = ri(10, 50); answer = a + b; text = `${a} + ${b} = ?`;
      } else {
        a = ri(30, 99); b = ri(1, a - 1); answer = a - b; text = `${a} − ${b} = ?`;
      }
    }

    if (!answer || answer <= 0) return null;
    const decoys = makeDecoys(answer, op, a, b, diff);
    if (decoys.length < 2) return null;
    return { text, answer, decoys, op, a, b };
  }
}

function ri(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

// Candidate mistakes a student actually makes for each operation.
// "strong" entries are the classic errors (adjacent table facts,
// operand confusion); "weak" entries are generic near-misses used
// for variety. Every wave gets at least one strong distractor.
// Easy mode keeps a wider, more forgiving spread (per the design spec).
function distractorCandidates(answer, op, a, b, diff) {
  if (diff === 'easy') {
    // Wide spacing — decoys must be clearly different numbers
    const out = [];
    const push = v => { if (Number.isInteger(v) && v > 0 && Math.abs(v - answer) >= 3) out.push(v); };
    push(answer + ri(3, 9));
    push(answer - ri(3, 9));
    push(a + b);
    push(answer + 10);
    return { strong: shuffle(out), weak: [] };
  }
  switch (op) {
    case '×':
      return {
        strong: [a * (b + 1), (a + 1) * b, a + b],  // adjacent table facts, added instead of multiplied
        weak:   [answer + 1, answer - 1, a * b + a],
      };
    case '÷':
      return {
        strong: [b, a - b],                          // operand confusion
        weak:   [answer + 1, answer - 1, a / (b + 1), Math.ceil(a / (b - 1))],
      };
    case '+':
      return {
        strong: [answer + 1, answer - 1, a - b],     // carrying slip, wrong operation
        weak:   [answer + 10, answer - 10],
      };
    case '-':
      return {
        strong: [answer + 1, answer - 1, a + b],     // borrowing slip, wrong operation
        weak:   [answer + 10, answer - 10],
      };
  }
  return { strong: [], weak: [] };
}

function makeDecoys(answer, op, a, b, diff) {
  const used = new Set([answer]);
  const out = [];
  const { strong, weak } = distractorCandidates(answer, op, a, b, diff);

  // First decoy: a classic student mistake when one is available
  for (const c of shuffle(strong.slice())) {
    if (Number.isInteger(c) && c > 0 && !used.has(c)) { used.add(c); out.push(c); break; }
  }

  // Second decoy: variety from the remaining candidates
  for (const c of shuffle(strong.concat(weak))) {
    if (out.length >= 2) break;
    if (Number.isInteger(c) && c > 0 && !used.has(c)) { used.add(c); out.push(c); }
  }

  // Top up with near-misses if the curated candidates collided
  let guard = 0;
  while (out.length < 2 && guard++ < 50) {
    const c = answer + (Math.random() < 0.5 ? -1 : 1) * ri(1, 3);
    if (c > 0 && !used.has(c)) { used.add(c); out.push(c); }
  }
  return out;
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = (Math.random() * (i + 1)) | 0;
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
