import { FullscreenGameLauncher } from "@/components/games/FullscreenGameLauncher";

export function MujahideenLauncher() {
  return (
    <FullscreenGameLauncher
      src="/play/mujahideen"
      title="المجاهدون الستة"
      slug="mujahideen"
      intro="ليلة الفاتح من نوفمبر 1954 في جبال الأوراس: قُد القادة الستة التاريخيين عبر الممرات الجبلية تحت قصف الطائرات حتى تبلغوا المغارة الآمنة."
      tips={[
        { icon: "star", text: "كل سؤال عن القادة تجيب عنه صحيحاً لأول مرة يمنحك نقطة، وكذلك الوصول إلى المغارة والمهمة الأسطورية." },
        { icon: "book", text: "كل عائق مرتبط بأحد القادة، ولا يُفتح إلا بالإجابة عن سؤال حوله." },
        { icon: "computer", text: "على الحاسوب: WASD أو الأسهم للحركة، Shift للركض، Space للقفز، P للإيقاف." },
      ]}
    />
  );
}
