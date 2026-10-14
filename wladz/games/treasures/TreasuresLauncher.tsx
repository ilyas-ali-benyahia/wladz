import { FullscreenGameLauncher } from "@/components/games/FullscreenGameLauncher";

export function TreasuresLauncher() {
  return (
    <FullscreenGameLauncher
      src="/play/treasures"
      title="كنوز الجزائر"
      emoji="🏺"
      intro="رحلة عبر ولايات الجزائر الـ 58: اكتشف معالمها وتراثها وتاريخها مرحلة بعد مرحلة، وافتح ولاية جديدة كلما أكملت واحدة."
      tips={[
        "⭐ كل ولاية تُكمل مراحلها كلها تفتح الولاية التالية وتمنحك نقطة.",
        "💡 التلميحات مجانية، لكنها تقلّل نجوم المرحلة.",
        "🗺️ المس أي ولاية على الخريطة لتقرأ تاريخها وتقاليدها.",
      ]}
    />
  );
}
