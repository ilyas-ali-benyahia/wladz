import { FullscreenGameLauncher } from "@/components/games/FullscreenGameLauncher";

export function SkillsLauncher() {
  return (
    <FullscreenGameLauncher
      src="/play/skills"
      title="درب المهارات"
      emoji="🧭"
      intro="ست محطات للمهارات الحياتية: اعرف نفسك، اثبت على موقفك، احترم الآخرين، فكّر قبل أن تشارك، اختر طريقك، ونبني معاً."
      tips={[
        "⭐ كل محطة تفوز بها (3 إجابات صحيحة أو أكثر من 5) تمنحك نقطة.",
        "📚 اقرأ البطاقات أولاً، ثم أجب عن أسئلة التحدّي.",
        "🔓 كل محطة تفوز بها تفتح المحطة التالية.",
      ]}
    />
  );
}
