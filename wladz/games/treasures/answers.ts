import { getStagesForWilaya } from "@/games/treasures/engine/data/stages.js";
import { WILAYAS_DATA } from "@/games/treasures/engine/data/wilayas.js";

export const treasuresGameSlug = "treasures";

type Stage = {
  id: string;
  type: string;
  answer?: string;
  correctIndex?: number;
  correctOption?: string;
  missingChar?: string;
};

// Même règle que wladzAnswer() dans engine/components/gameView.js.
function expectedAnswer(stage: Stage) {
  switch (stage.type) {
    case "multiple_choice":
    case "which_wilaya":
      // Les options des étapes générées sont mélangées à chaque appel : on compare le texte.
      return stage.correctOption ?? String(stage.correctIndex);
    case "missing_letters":
      return stage.missingChar;
    case "matching_pairs":
      return "pairs";
    default:
      return (stage.answer || "الجزائر").replace(/\s+/g, "");
  }
}

type StageKey = { expected: string | undefined; wilayaId: number; wilayaStageIds: string[] };

let stages: Map<string, StageKey> | null = null;

// Étape des 58 wilayas : réponse attendue et liste des étapes de sa wilaya.
export function treasuresStage(stageId: string) {
  if (!stages) {
    stages = new Map();
    for (const wilaya of WILAYAS_DATA as { id: number }[]) {
      const wilayaStages = getStagesForWilaya(wilaya) as Stage[];
      const wilayaStageIds = wilayaStages.map((stage) => stage.id);
      for (const stage of wilayaStages) {
        stages.set(stage.id, { expected: expectedAnswer(stage), wilayaId: wilaya.id, wilayaStageIds });
      }
    }
  }
  return stages.get(stageId);
}
