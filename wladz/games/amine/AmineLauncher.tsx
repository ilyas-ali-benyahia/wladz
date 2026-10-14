import { FullscreenGameLauncher } from "@/components/games/FullscreenGameLauncher";
import { amineDailyPoints, amineOrigin } from "@/games/amine/config";

// « أمين: طريق الحياة » est déployé à part (jeu 3D lourd) et s'ouvre en plein écran
// dans l'application. Pour les points, le jeu envoie à la page hôte :
//   window.parent.postMessage({ type: "wladz:ending", endingId }, "*")
// à chaque fin atteinte, et peut demander la fermeture avec { type: "wladz:game-exit" }.
export function AmineLauncher() {
  return (
    <FullscreenGameLauncher
      src={`${amineOrigin}/`}
      externalOrigin={amineOrigin}
      pointsEndpoint="/api/games/amine/ending"
      title="أمين: طريق الحياة"
      slug="amine"
      intro="عِش حياة أمين في حومة جزائرية، من طفولته إلى سنّ الثامنة عشرة. كل قرار تتخذه يغيّر طريقه: 68 فصلاً و72 نهاية مختلفة تنتظرك."
      tips={[
        { icon: "star", text: `كل نهاية جديدة تصل إليها تمنحك نقطة (حتى ${amineDailyPoints} نقاط في اليوم).` },
        { icon: "compass", text: "فكّر قبل كل قرار: لكل اختيار عواقبه." },
        { icon: "headphones", text: "اللعبة ثلاثية الأبعاد وكبيرة، قد تحتاج بضع ثوانٍ لتبدأ." },
      ]}
    />
  );
}
