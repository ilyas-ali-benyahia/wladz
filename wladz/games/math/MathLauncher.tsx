import { FullscreenGameLauncher } from "@/components/games/FullscreenGameLauncher";

export const mathDailyPoints = 30;

export function MathLauncher() {
  return (
    <FullscreenGameLauncher
      src="/play/math"
      title="احسب وصوّب"
      slug="math"
      intro="تظهر عملية حسابية وثلاثة روبوتات، وكل روبوت يحمل رقماً. احسب الجواب بسرعة وصوّب نحو الروبوت الصحيح قبل أن يقترب منك!"
      tips={[
        { icon: "star", text: `كل جواب صحيح يمنحك نقطة (حتى ${mathDailyPoints} نقطة في اليوم).` },
        { icon: "computer", text: "على الحاسوب: حرّك الفأرة للتصويب وانقر للإطلاق." },
        { icon: "phone", text: "على الهاتف: أدِر الهاتف إلى الوضع الأفقي." },
      ]}
    />
  );
}
