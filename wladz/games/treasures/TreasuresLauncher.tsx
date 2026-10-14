import { FullscreenGameLauncher } from "@/components/games/FullscreenGameLauncher";

export function TreasuresLauncher() {
  return (
    <FullscreenGameLauncher
      src="/play/treasures"
      title="كنوز الجزائر"
      slug="treasures"
      intro="رحلة عبر ولايات الجزائر الـ 58: اكتشف معالمها وتراثها وتاريخها مرحلة بعد مرحلة، وافتح ولاية جديدة كلما أكملت واحدة."
      tips={[
        { icon: "star", text: "كل ولاية تُكمل مراحلها كلها تفتح الولاية التالية وتمنحك نقطة." },
        { icon: "hint", text: "التلميحات مجانية، لكنها تقلّل نجوم المرحلة." },
        { icon: "map", text: "المس أي ولاية على الخريطة لتقرأ تاريخها وتقاليدها." },
      ]}
    />
  );
}
