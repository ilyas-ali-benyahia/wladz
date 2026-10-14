// Envoie une réponse au serveur, qui la vérifie et attribue le point.
export async function submitAnswer(game: string, questionId: string, answer: number) {
  const response = await fetch(`/api/games/${game}/answer`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ questionId, answer }),
  });
  const result: unknown = await response.json();
  if (!response.ok || typeof result !== "object" || result === null || !("correct" in result)) {
    throw new Error("answer not saved");
  }

  return {
    correct: result.correct === true,
    awarded: "awarded" in result && result.awarded === true,
  };
}

export function shuffledOrder(length: number) {
  const order = Array.from({ length }, (_, index) => index);
  for (let i = length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  return order;
}
