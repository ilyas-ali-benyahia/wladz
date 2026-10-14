import { FullscreenGameLauncher } from "@/components/games/FullscreenGameLauncher";
import { ghirasMissionIds, ghirasStageIds } from "@/games/ghiras/config";

export function GhirasLauncher() {
  return (
    <FullscreenGameLauncher
      src="/play/ghiras"
      title="غِراس المواطنة"
      emoji="🌱"
      intro="مدينة جزائرية ثلاثية الأبعاد تستكشفها بحرّية: نظّف حيّك، اغرس الأشجار، ساعد الكبار، زر المتحف، وتعلّم السباحة وكرة القدم والإسعافات الأولية."
      tips={[
        `⭐ كل مهمة تكملها (${ghirasMissionIds.size}) وكل مرحلة تدريب تنجح فيها لأول مرة (${ghirasStageIds.size}) تمنحك نقطة.`,
        "🎮 على الحاسوب: WASD للحركة، Shift للجري، Space للقفز، E للتحدث والتفاعل، M للخريطة.",
        "🌍 اللعبة ثلاثية الأبعاد وكبيرة: الأفضل على حاسوب.",
      ]}
    />
  );
}
