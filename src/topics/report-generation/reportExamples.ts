export interface ReportExample {
  readonly id: string;
  readonly label: string;
  readonly labelKo: string;
  readonly description: string;
  readonly descriptionKo: string;
  readonly reference: string;
  readonly candidateA: string;
  readonly candidateB: string;
}

export const NEGATION_FLIP: ReportExample = {
  id: "negation-flip",
  label: "Negation flip",
  labelKo: "부정 뒤집힘",
  description: "Lexical overlap can favor the unsafe candidate when absent findings become present.",
  descriptionKo: "absent finding이 present로 바뀌어도 단어 겹침은 위험한 candidate를 앞세울 수 있습니다.",
  reference:
    "Mild cardiomegaly. No focal airspace consolidation, pleural effusion, or pneumothorax.",
  candidateA:
    "The cardiac silhouette is mildly enlarged. The lungs are clear. No pleural fluid or pneumothorax is seen.",
  candidateB:
    "Mild cardiomegaly. Focal airspace consolidation, pleural effusion, and pneumothorax are present.",
};

export const LATERALITY_SWAP: ReportExample = {
  id: "laterality-swap",
  label: "Laterality swap",
  labelKo: "좌우 바뀜",
  description: "The phrase template stays close while the side changes from right to left.",
  descriptionKo: "문장 틀은 비슷하지만 right가 left로 바뀌는 순간 laterality row가 반응합니다.",
  reference: "Right lower lobe opacity suspicious for pneumonia. No pleural effusion.",
  candidateA:
    "There is airspace opacity in the right lower lung, concerning for pneumonia. No pleural fluid is present.",
  candidateB: "Left lower lobe opacity suspicious for pneumonia. No pleural effusion.",
};

export const TEMPORAL_CHANGE: ReportExample = {
  id: "temporal-change",
  label: "Temporal change error",
  labelKo: "변화 방향 오류",
  description: "The same comparison structure can invert improved versus worsened.",
  descriptionKo: "비슷한 comparison 문장에서도 improved와 worsened가 바뀌면 temporal row가 움직입니다.",
  reference:
    "Compared with the prior study, pulmonary edema has improved. Small bilateral pleural effusions are stable.",
  candidateA:
    "Pulmonary edema is decreased from prior. Small pleural effusions are unchanged bilaterally.",
  candidateB:
    "Compared with the prior study, pulmonary edema has worsened. Small bilateral pleural effusions are stable.",
};

export const ENTITY_SWAP: ReportExample = {
  id: "entity-swap",
  label: "Entity/assertion swap",
  labelKo: "entity/assertion 교환",
  description: "The right entities appear, but presence and absence attach to the wrong finding.",
  descriptionKo: "entity 단어는 맞지만 present/absent가 잘못 붙을 때 assertion row가 갈라집니다.",
  reference: "Right pneumothorax. No pleural effusion.",
  candidateA: "A pneumothorax is present on the right. Pleural effusion is absent.",
  candidateB: "Right pleural effusion. No pneumothorax.",
};
