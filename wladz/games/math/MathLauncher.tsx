import { FullscreenGameLauncher } from "@/components/games/FullscreenGameLauncher";

export const mathDailyPoints = 30;

export function MathLauncher() {
  return (
    <FullscreenGameLauncher
      src="/play/math"
      title="احسب وصوّب"
      emoji="🎯"
      intro="تظهر عملية حسابية وثلاثة روبوتات، وكل روبوت يحمل رقماً. احسب الجواب بسرعة وصوّب نحو الروبوت الصحيح قبل أن يقترب منك!"
      tips={[
        `⭐ كل جواب صحيح يمنحك نقطة (حتى ${mathDailyPoints} نقطة في اليوم).`,
        "💻 على الحاسوب: حرّك الفأرة للتصويب وانقر للإطلاق.",
        "📱 على الهاتف: أدِر الهاتف إلى الوضع الأفقي.",
      ]}
    />
  );
}
