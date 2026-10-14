import type { AgeTier } from "@/games/ageTier";

// À FAIRE RELIRE : les informations de santé de ce fichier doivent être validées
// par un spécialiste (médecin, enseignant, référent du ministère) avant publication.

export type MythCard = {
  id: string;
  statement: string;
  isTrue: boolean;
  explanation: string;
};

export const mythsGameSlug = "myths";

export const mythCards: Record<AgeTier, MythCard[]> = {
  junior: [
    {
      id: "junior:1",
      statement: "أي دواء أجده في البيت يمكنني أن أتناوله وحدي.",
      isTrue: false,
      explanation: "الدواء ليس حلوى. يعطيه لك والداك أو الطبيب فقط.",
    },
    {
      id: "junior:2",
      statement: "التدخين يؤذي الرئتين ويجعل التنفّس صعباً.",
      isTrue: true,
      explanation: "الدخان يدخل إلى الرئتين ويؤذيهما، فيتعب المدخّن بسرعة عند الجري واللعب.",
    },
    {
      id: "junior:3",
      statement: "إذا أعطاني شخص غريب حلوى أو حبوباً، أرفض وأخبر والديّ.",
      isTrue: true,
      explanation: "لا نعرف ما بداخلها. نقول «لا، شكراً»، نبتعد، ونخبر شخصاً كبيراً نثق به.",
    },
    {
      id: "junior:4",
      statement: "دخان السيجارة يؤذي فقط الشخص الذي يدخّن.",
      isTrue: false,
      explanation: "الدخان يؤذي أيضاً من يجلس قريباً من المدخّن. لذلك نبتعد عنه.",
    },
    {
      id: "junior:5",
      statement: "الرياضة والنوم الجيد يجعلان جسمي وعقلي أقوى.",
      isTrue: true,
      explanation: "اللعب والحركة والنوم الكافي والأكل الصحي هي ما يجعلك قوياً وسعيداً.",
    },
    {
      id: "junior:6",
      statement: "إذا طلب مني صديقي أن أكتم سرّاً يؤذيه، يجب أن أكتمه.",
      isTrue: false,
      explanation: "السرّ الذي يؤذي لا يُكتم. أخبر شخصاً كبيراً تثق به لتساعد صديقك.",
    },
    {
      id: "junior:7",
      statement: "أن أقول «لا» لشيء يؤذيني شجاعة.",
      isTrue: true,
      explanation: "الشجاع هو من يحمي نفسه، حتى لو قال له الآخرون «جرّب».",
    },
    {
      id: "junior:8",
      statement: "السيجارة الإلكترونية مثل لعبة ولا تؤذي.",
      isTrue: false,
      explanation: "فيها مواد تؤذي الجسم وتجعل صاحبها يتعوّد عليها. هي ليست لعبة.",
    },
  ],
  senior: [
    {
      id: "senior:1",
      statement: "تجربة مرة واحدة لا يمكن أن تضرّ.",
      isTrue: false,
      explanation: "بعض المواد خطيرة من أول مرة، وكثير من حالات الإدمان بدأت بـ«مرة واحدة فقط».",
    },
    {
      id: "senior:2",
      statement: "النيكوتين مادة تسبّب الإدمان.",
      isTrue: true,
      explanation: "النيكوتين الموجود في السجائر يجعل الجسم يطلبه من جديد، ولهذا يصعب التوقّف.",
    },
    {
      id: "senior:3",
      statement: "السجائر الإلكترونية آمنة لأنها مجرد بخار.",
      isTrue: false,
      explanation: "أغلبها يحتوي على النيكوتين ومواد أخرى تؤذي الرئتين. النكهة الحلوة لا تعني الأمان.",
    },
    {
      id: "senior:4",
      statement: "المخدرات تؤثّر على الدماغ: على الذاكرة والتركيز والمزاج.",
      isTrue: true,
      explanation: "لهذا تتراجع الدراسة ويتغيّر المزاج والسلوك عند من يتعاطى.",
    },
    {
      id: "senior:5",
      statement: "دماغ المراهق ما زال ينمو، لذلك يتأثّر بهذه المواد أكثر.",
      isTrue: true,
      explanation: "الدماغ يواصل نموّه في سنوات المراهقة، وهذه المواد قد تعطّل هذا النموّ.",
    },
    {
      id: "senior:6",
      statement: "حبوب «التركيز» التي يعطيها زميل تساعد على النجاح في الامتحان.",
      isTrue: false,
      explanation: "دواء بلا وصفة طبيب قد يسبّب القلق والأرق وخفقان القلب. النوم والتنظيم هما الحل.",
    },
    {
      id: "senior:7",
      statement: "من يرفض السيجارة يخسر أصدقاءه.",
      isTrue: false,
      explanation: "الصديق الحقيقي يحترم قرارك. ومن يتركك لأنك رفضت لم يكن صديقاً حقيقياً.",
    },
    {
      id: "senior:8",
      statement: "الإدمان يمكن علاجه، وطلب المساعدة شجاعة.",
      isTrue: true,
      explanation: "كلما كانت المساعدة أبكر كان العلاج أسهل. تحدّث مع والديك أو طبيب أو شخص بالغ تثق به.",
    },
    {
      id: "senior:9",
      statement: "المخدرات تحلّ المشاكل وتزيل الحزن.",
      isTrue: false,
      explanation: "المشكلة تبقى كما هي وتُضاف إليها مشاكل جديدة: في الصحة والدراسة والعائلة.",
    },
    {
      id: "senior:10",
      statement: "نقل «طرد صغير» مقابل المال لشخص مجهول قد يوقعني في مشكلة مع القانون.",
      isTrue: true,
      explanation: "قد يحتوي على مواد ممنوعة، والقانون يعاقب من ينقلها. لا يوجد مال سهل.",
    },
  ],
};

// Réponse attendue par le serveur : 1 = حقيقة, 0 = خرافة.
export function mythAnswer(cardId: string) {
  const card = Object.values(mythCards)
    .flat()
    .find((candidate) => candidate.id === cardId);
  return card ? Number(card.isTrue) : undefined;
}
