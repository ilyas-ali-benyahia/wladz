// Tout le contenu pédagogique du jeu vit ici, séparé du code, pour être relu facilement.
// Chaque fait sensible porte sa source (// Source: ...) ou un // TODO-VERIFICATION.

export type Question = {
  prompt: string;
  choices: string[];
  correctIndex: number;
  explanation: string;
};

export const questions: Question[] = [
  {
    prompt: "ما هي عاصمة الجزائر؟",
    choices: ["الجزائر العاصمة", "وهران", "قسنطينة"],
    correctIndex: 0,
    explanation: "عاصمة بلادنا هي مدينة الجزائر.",
  },
  {
    prompt: "عرض عليك شخص غريب شيئًا لا تعرفه. ماذا تفعل؟",
    choices: ["آخذه وأجرّبه", "أرفض وأبتعد وأخبر والديّ", "أخفيه في محفظتي"],
    correctIndex: 1,
    explanation: "نرفض دائمًا ما يعرضه الغرباء، ونخبر شخصًا بالغًا نثق به.",
  },
];
