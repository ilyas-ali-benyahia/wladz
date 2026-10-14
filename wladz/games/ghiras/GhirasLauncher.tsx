import { FullscreenGameLauncher } from "@/components/games/FullscreenGameLauncher";
import { ghirasMissionIds, ghirasStageIds } from "@/games/ghiras/config";

export function GhirasLauncher() {
  return (
    <FullscreenGameLauncher
      src="/play/ghiras"
      title="غِراس المواطنة"
      slug="ghiras"
      intro="مدينة جزائرية ثلاثية الأبعاد تستكشفها بحرّية: نظّف حيّك، اغرس الأشجار، ساعد الكبار، زر المتحف، وتعلّم السباحة وكرة القدم والإسعافات الأولية."
      tips={[
        { icon: "star", text: `كل مهمة تكملها (${ghirasMissionIds.size}) وكل مرحلة تدريب تنجح فيها لأول مرة (${ghirasStageIds.size}) تمنحك نقطة.` },
        { icon: "computer", text: "على الحاسوب: WASD للحركة، Shift للجري، Space للقفز، E للتحدث والتفاعل، M للخريطة." },
        { icon: "map", text: "اللعبة ثلاثية الأبعاد وكبيرة: الأفضل على حاسوب." },
      ]}
    />
  );
}
