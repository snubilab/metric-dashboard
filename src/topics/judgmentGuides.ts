import type { Lang } from "../i18n/LanguageContext";

// allow: SIZE_OK - central pure-data registry required by Todo 2.
export interface MetricJudgmentGuide {
  readonly trustWhen: string;
  readonly doubtWhen: string;
  readonly tryThis: string;
}

export type LocalizedMetricJudgmentGuide = Readonly<Record<Lang, MetricJudgmentGuide>>;

export const METRIC_JUDGMENT_GUIDES: Readonly<
  Record<string, Readonly<Record<string, LocalizedMetricJudgmentGuide>>>
> = {
  classification: {
    "confusion-matrix": {
      ko: {
        trustWhen: "오류 유형의 절대 개수와 임계값의 결과를 함께 봐야 할 때 유용하다.",
        doubtWhen: "유병률이나 비용 구조가 달라지면 같은 표도 다른 결정을 낳을 수 있다.",
        tryThis: "클래스별 FN과 FP를 나눈 뒤 민감도, 특이도, PPV를 함께 계산하라.",
      },
      en: {
        trustWhen: "Informative when absolute error counts and threshold consequences matter together.",
        doubtWhen: "Blind when prevalence or clinical costs shift across deployment settings.",
        tryThis: "Split FN and FP by class, then pair the table with sensitivity, specificity, and PPV.",
      },
    },
    "sensitivity-specificity": {
      ko: {
        trustWhen: "질병을 놓치는 위험과 정상 판정을 유지하는 능력을 분리해 볼 때 유용하다.",
        doubtWhen: "양성 예측의 실제 부담이나 유병률 변화는 직접 보여주지 않는다.",
        tryThis: "임계값을 움직이며 PPV, NPV, 양성 판정률이 함께 어떻게 변하는지 확인하라.",
      },
      en: {
        trustWhen: "Informative when missed disease and preserved negatives must be judged separately.",
        doubtWhen: "Blind to the practical load of positive calls and prevalence shifts.",
        tryThis: "Sweep the threshold and track PPV, NPV, and the positive call rate beside it.",
      },
    },
    "ppv-npv": {
      ko: {
        trustWhen: "모델의 양성 또는 음성 판정이 현장에서 얼마나 믿을 만한지 묻는 상황에 맞다.",
        doubtWhen: "같은 민감도와 특이도라도 모집단 유병률이 바뀌면 크게 흔들린다.",
        tryThis: "목표 코호트의 유병률로 재계산하고 민감도와 특이도를 같이 보고하라.",
      },
      en: {
        trustWhen: "Informative when the question is how actionable positive or negative calls are on site.",
        doubtWhen: "Blind when the deployment prevalence differs from the evaluation cohort.",
        tryThis: "Recompute under the target prevalence and report sensitivity and specificity beside it.",
      },
    },
    "accuracy-balanced-accuracy": {
      ko: {
        trustWhen: "전체 정답률과 클래스 불균형 보정 결과를 나란히 비교할 때 유용하다.",
        doubtWhen: "소수 클래스 오류가 임상적으로 큰 경우 단순 정확도는 위험을 묻을 수 있다.",
        tryThis: "클래스별 민감도를 확인하고 balanced accuracy가 어떤 클래스를 보정했는지 설명하라.",
      },
      en: {
        trustWhen: "Informative when overall hit rate and class-balanced performance need comparison.",
        doubtWhen: "Blind when minority-class misses carry clinical weight but are diluted by class counts.",
        tryThis: "Inspect per-class sensitivity and state which classes balanced accuracy is compensating for.",
      },
    },
    "precision-recall-f1-fbeta": {
      ko: {
        trustWhen: "양성 탐지에서 FP와 FN의 균형을 하나의 운영점에서 판단할 때 유용하다.",
        doubtWhen: "F 계열 값은 어떤 임계값을 골랐는지와 오류 비용 가정을 숨긴다.",
        tryThis: "F1만 보지 말고 precision-recall 곡선과 F-beta의 beta 선택 근거를 제시하라.",
      },
      en: {
        trustWhen: "Informative when FP and FN trade-offs are evaluated at one operating point.",
        doubtWhen: "Blind to the threshold choice and the implicit cost ratio inside the F family.",
        tryThis: "Show the precision-recall curve and justify the beta used for F-beta.",
      },
    },
    "roc-auroc": {
      ko: {
        trustWhen: "임계값 전반에서 양성과 음성 순위가 얼마나 분리되는지 볼 때 유용하다.",
        doubtWhen: "희귀 양성 문제에서는 작은 FPR도 많은 FP로 바뀔 수 있다.",
        tryThis: "관심 FPR 구간의 partial AUC와 PR 곡선을 함께 확인하라.",
      },
      en: {
        trustWhen: "Informative when ranking separation across thresholds is the main question.",
        doubtWhen: "Blind when rare positives make small FPR changes produce many false alarms.",
        tryThis: "Pair AUROC with partial AUC in the target FPR range and a PR curve.",
      },
    },
    "pr-auprc-ap": {
      ko: {
        trustWhen: "희귀 양성 탐지에서 양성 판정의 정밀도와 회수율을 함께 볼 때 유용하다.",
        doubtWhen: "기준 유병률과 보간 방식에 민감해 데이터셋 간 직접 비교가 어렵다.",
        tryThis: "무작위 기준선, PR 곡선 모양, 선택 임계값의 precision과 recall을 같이 제시하라.",
      },
      en: {
        trustWhen: "Informative when rare-positive retrieval needs precision and recall together.",
        doubtWhen: "Blind when prevalence baselines or interpolation rules differ across datasets.",
        tryThis: "Report the random baseline, curve shape, and the chosen threshold's precision and recall.",
      },
    },
    "fixed-operating-points": {
      ko: {
        trustWhen: "임상 운영에서 특이도나 민감도의 최소 기준이 먼저 정해져 있을 때 유용하다.",
        doubtWhen: "기준점 밖의 임계값 행동과 캘리브레이션은 거의 보이지 않는다.",
        tryThis: "고정 기준을 사전에 명시하고 주변 임계값에서의 안정성을 bootstrap으로 확인하라.",
      },
      en: {
        trustWhen: "Informative when deployment already fixes a minimum specificity or sensitivity.",
        doubtWhen: "Blind to behavior away from that point and to probability calibration.",
        tryThis: "Predeclare the operating point and bootstrap nearby thresholds for stability.",
      },
    },
  },
  regression: {
    mae: {
      ko: {
        trustWhen: "오차의 전형적 크기를 원래 단위로 해석해야 할 때 유용하다.",
        doubtWhen: "큰 오차를 특별히 더 크게 벌주어야 하는 상황은 약하게 반영한다.",
        tryThis: "잔차 분위수와 함께 보고하고 큰 오차 사례를 따로 검토하라.",
      },
      en: {
        trustWhen: "Informative when typical error size must stay in the original unit.",
        doubtWhen: "Blind when large deviations should dominate the decision.",
        tryThis: "Report residual quantiles and audit the largest-error cases separately.",
      },
    },
    mse: {
      ko: {
        trustWhen: "큰 오차를 강하게 반영해 모델의 꼬리 실패를 민감하게 보려는 상황에 맞다.",
        doubtWhen: "단위가 제곱되어 임상적 크기 해석이 직관적이지 않다.",
        tryThis: "RMSE, MAE, 잔차 히스토그램을 함께 보며 큰 오차의 원인을 분리하라.",
      },
      en: {
        trustWhen: "Informative when large residuals should strongly influence model selection.",
        doubtWhen: "Blind to direct clinical scale because the unit is squared.",
        tryThis: "Pair it with RMSE, MAE, and a residual histogram focused on tail cases.",
      },
    },
    rmse: {
      ko: {
        trustWhen: "큰 오차를 강조하면서도 원래 단위로 요약해야 할 때 유용하다.",
        doubtWhen: "소수의 극단값이 전체 인상을 지배할 수 있다.",
        tryThis: "MAE와 비교해 RMSE가 커지는 구간의 환자군 또는 영상 조건을 찾으라.",
      },
      en: {
        trustWhen: "Informative when large errors matter and the summary must keep the original unit.",
        doubtWhen: "Blind when a few extreme residuals dominate the aggregate.",
        tryThis: "Compare against MAE and locate cohorts or image conditions where RMSE widens.",
      },
    },
    r2: {
      ko: {
        trustWhen: "목표값 변동성 중 모델이 설명하는 비율을 기준 모델과 비교할 때 유용하다.",
        doubtWhen: "절대 오차 크기, 캘리브레이션, 외삽 실패는 직접 말해주지 않는다.",
        tryThis: "잔차 플롯과 MAE/RMSE를 함께 보고 기준 모델 정의를 명확히 하라.",
      },
      en: {
        trustWhen: "Informative when explained variance relative to a baseline is the target question.",
        doubtWhen: "Blind to absolute error scale, calibration, and extrapolation failures.",
        tryThis: "Show residual plots and MAE/RMSE, and name the baseline used for comparison.",
      },
    },
    bias: {
      ko: {
        trustWhen: "모델이 평균적으로 과대 또는 과소 추정하는 방향을 확인할 때 유용하다.",
        doubtWhen: "양쪽 방향의 큰 오차가 서로 상쇄되면 위험을 작게 보일 수 있다.",
        tryThis: "MAE/RMSE와 subgroup별 bias를 같이 보고 상쇄 여부를 확인하라.",
      },
      en: {
        trustWhen: "Informative when systematic over- or under-estimation is the main concern.",
        doubtWhen: "Blind when large errors in opposite directions cancel in the mean.",
        tryThis: "Pair with MAE/RMSE and inspect subgroup bias for cancellation.",
      },
    },
    pearson: {
      ko: {
        trustWhen: "예측과 참값의 선형 동조가 보존되는지 볼 때 유용하다.",
        doubtWhen: "스케일 편향이나 비선형 단조 관계는 높은 상관 안에 숨을 수 있다.",
        tryThis: "산점도, calibration line, MAE를 함께 확인하라.",
      },
      en: {
        trustWhen: "Informative when linear co-movement between prediction and target matters.",
        doubtWhen: "Blind to scale bias and nonlinear monotone relationships.",
        tryThis: "Inspect a scatterplot, calibration line, and MAE beside Pearson r.",
      },
    },
    spearman: {
      ko: {
        trustWhen: "값의 정확한 크기보다 순위 보존이 중요한 위험도 정렬 문제에 유용하다.",
        doubtWhen: "동일 순위 처리, calibration, 절대 오차는 직접 보여주지 않는다.",
        tryThis: "순위 오류가 임상 결정을 바꾸는 지점과 MAE/RMSE를 함께 보라.",
      },
      en: {
        trustWhen: "Informative when ranking is more important than calibrated magnitude.",
        doubtWhen: "Blind to ties, calibration, and absolute error size.",
        tryThis: "Check rank swaps near decision cutoffs and pair with MAE/RMSE.",
      },
    },
  },
  segmentation: {
    dice: {
      ko: {
        trustWhen: "전경 overlap의 평균적 일치를 빠르게 비교할 때 유용하다.",
        doubtWhen: "경계 위치, 작은 병변 누락, topology 오류는 같은 값 안에 숨을 수 있다.",
        tryThis: "HD95, lesion-wise recall, 시각적 overlay를 함께 확인하라.",
      },
      en: {
        trustWhen: "Informative when foreground overlap is the primary comparison.",
        doubtWhen: "Blind to boundary placement, missed small lesions, and topology changes.",
        tryThis: "Pair with HD95, lesion-wise recall, and visual overlays.",
      },
    },
    iou: {
      ko: {
        trustWhen: "예측과 참조 mask의 교집합 대비 합집합 비율을 엄격하게 보려는 상황에 맞다.",
        doubtWhen: "Dice와 마찬가지로 병변 개수와 경계 거리의 실패를 분리하지 못한다.",
        tryThis: "Dice와 함께 변환 관계를 설명하고 boundary metric을 추가하라.",
      },
      en: {
        trustWhen: "Informative when overlap should be framed as intersection over union.",
        doubtWhen: "Blind to lesion counts and boundary distance failures, much like Dice.",
        tryThis: "Explain its relation to Dice and add a boundary metric.",
      },
    },
    sensitivity: {
      ko: {
        trustWhen: "참 병변 영역을 얼마나 놓치지 않았는지 확인할 때 유용하다.",
        doubtWhen: "과분할로 생긴 FP 영역은 거의 벌하지 않는다.",
        tryThis: "precision과 volume difference를 함께 보며 과분할 여부를 확인하라.",
      },
      en: {
        trustWhen: "Informative when missed reference foreground is the primary risk.",
        doubtWhen: "Blind when over-segmentation creates large false-positive regions.",
        tryThis: "Pair with precision and volume difference to expose over-segmentation.",
      },
    },
    precision: {
      ko: {
        trustWhen: "예측한 전경 중 실제 병변인 비율을 확인할 때 유용하다.",
        doubtWhen: "작게 예측해 FN이 늘어나는 실패는 덜 드러난다.",
        tryThis: "sensitivity와 lesion-wise 결과를 같이 보고 누락을 분리하라.",
      },
      en: {
        trustWhen: "Informative when false-positive foreground burden is central.",
        doubtWhen: "Blind when conservative masks miss true lesion extent.",
        tryThis: "Pair with sensitivity and lesion-wise measures to expose misses.",
      },
    },
    hd: {
      ko: {
        trustWhen: "가장 먼 경계 오류가 수술, 방사선 계획처럼 치명적일 때 유용하다.",
        doubtWhen: "한 점의 outlier가 전체 판단을 지배할 수 있다.",
        tryThis: "HD95와 ASSD를 함께 보고 outlier 위치를 overlay에서 확인하라.",
      },
      en: {
        trustWhen: "Informative when the single worst boundary miss is clinically consequential.",
        doubtWhen: "Blind when one outlier point dominates the result.",
        tryThis: "Compare with HD95 and ASSD, then inspect the outlier location on overlays.",
      },
    },
    hd95: {
      ko: {
        trustWhen: "극단 outlier를 줄이면서 큰 경계 오류를 보고 싶을 때 유용하다.",
        doubtWhen: "상위 5% 밖의 실패가 임상적으로 중요한 경우에는 완화될 수 있다.",
        tryThis: "HD, ASSD, 경계 오류 map을 함께 확인하라.",
      },
      en: {
        trustWhen: "Informative when boundary extremes matter but single-point outliers should be damped.",
        doubtWhen: "Blind when the excluded tail contains clinically important failures.",
        tryThis: "Pair with HD, ASSD, and a boundary-error map.",
      },
    },
    assd: {
      ko: {
        trustWhen: "전체 표면의 평균 경계 거리 차이를 안정적으로 비교할 때 유용하다.",
        doubtWhen: "작지만 위험한 국소 경계 돌출은 평균에 묻힐 수 있다.",
        tryThis: "HD95와 국소 error map을 같이 확인하라.",
      },
      en: {
        trustWhen: "Informative when average surface displacement is the target behavior.",
        doubtWhen: "Blind to small but risky local boundary protrusions.",
        tryThis: "Pair with HD95 and a local surface-error map.",
      },
    },
    nsd: {
      ko: {
        trustWhen: "허용 거리 안의 표면 일치를 장기나 병변별 tolerance로 평가할 때 유용하다.",
        doubtWhen: "tolerance 선택이 결론을 좌우하며 그 밖의 거리 크기는 잘 보이지 않는다.",
        tryThis: "tolerance를 사전에 정하고 여러 tolerance에서 민감도 분석을 하라.",
      },
      en: {
        trustWhen: "Informative when surface agreement within a task-specific tolerance matters.",
        doubtWhen: "Blind when the tolerance choice drives the conclusion.",
        tryThis: "Predefine the tolerance and run a sensitivity analysis across plausible tolerances.",
      },
    },
    volume: {
      ko: {
        trustWhen: "총 병변 부담이나 장기 크기 추정의 과대·과소 방향을 볼 때 유용하다.",
        doubtWhen: "같은 부피라도 위치가 완전히 다를 수 있다.",
        tryThis: "Dice 또는 IoU, boundary metric과 함께 위치 일치를 확인하라.",
      },
      en: {
        trustWhen: "Informative when total burden or organ-size bias is the target.",
        doubtWhen: "Blind when equal volumes occur at different locations.",
        tryThis: "Pair with Dice or IoU and a boundary metric to verify spatial agreement.",
      },
    },
    lesionwise: {
      ko: {
        trustWhen: "병변 단위의 발견 여부와 병변별 품질을 분리해야 할 때 유용하다.",
        doubtWhen: "병변 matching 규칙과 작은 병변 정의가 결과를 크게 바꾼다.",
        tryThis: "matching 기준, 병변 크기별 stratification, voxel metric을 함께 보고하라.",
      },
      en: {
        trustWhen: "Informative when lesion discovery and per-lesion mask quality must be separated.",
        doubtWhen: "Blind when matching rules or tiny-lesion definitions change the denominator.",
        tryThis: "Report matching criteria, size-stratified results, and voxel-level metrics.",
      },
    },
    cldice: {
      ko: {
        trustWhen: "혈관이나 관 구조에서 중심선 연결성이 핵심일 때 유용하다.",
        doubtWhen: "두께, 표면 거리, 누락된 말단 가지의 임상 영향은 충분히 분리하지 못한다.",
        tryThis: "centerline overlay, NSD, branch-level recall을 함께 확인하라.",
      },
      en: {
        trustWhen: "Informative when centerline connectivity is central for tubular anatomy.",
        doubtWhen: "Blind to thickness, surface distance, and the impact of missed terminal branches.",
        tryThis: "Inspect centerline overlays and pair with NSD and branch-level recall.",
      },
    },
  },
  detection: {
    matching: {
      ko: {
        trustWhen: "검출 box나 병변 후보를 일대일로 어떤 기준에서 TP로 볼지 정할 때 유용하다.",
        doubtWhen: "IoU 임계값과 중복 제거 규칙이 바뀌면 이후 모든 metric이 흔들린다.",
        tryThis: "matching 기준을 고정하고 threshold 주변 사례를 시각적으로 검토하라.",
      },
      en: {
        trustWhen: "Informative when one-to-one TP assignment must be made explicit.",
        doubtWhen: "Blind when IoU thresholds or duplicate-handling rules shift downstream metrics.",
        tryThis: "Freeze the matching rule and inspect borderline matches visually.",
      },
    },
    precision: {
      ko: {
        trustWhen: "검출 알림 중 실제 병변인 비율과 판독 부담을 볼 때 유용하다.",
        doubtWhen: "조용히 놓친 병변 수는 직접 드러나지 않는다.",
        tryThis: "recall과 FP/image를 함께 보고 임계값 변화에 따른 부담을 확인하라.",
      },
      en: {
        trustWhen: "Informative when alert burden and false detections are the practical constraint.",
        doubtWhen: "Blind to lesions missed by conservative detection.",
        tryThis: "Pair with recall and FP/image across thresholds.",
      },
    },
    recall: {
      ko: {
        trustWhen: "참 병변 중 모델이 얼마나 찾아냈는지 확인할 때 유용하다.",
        doubtWhen: "많은 FP를 내면서 recall을 올린 경우 판독 부담을 숨긴다.",
        tryThis: "precision, FROC, FP/image를 함께 보라.",
      },
      en: {
        trustWhen: "Informative when missed lesions are the main risk.",
        doubtWhen: "Blind when recall is achieved by flooding the reader with false alarms.",
        tryThis: "Pair with precision, FROC, and FP/image.",
      },
    },
    f1: {
      ko: {
        trustWhen: "한 운영점에서 precision과 recall의 균형을 압축해 비교할 때 유용하다.",
        doubtWhen: "임상 비용 비율과 임계값 선택을 하나의 값 안에 숨긴다.",
        tryThis: "precision-recall curve와 비용에 맞춘 F-beta를 함께 검토하라.",
      },
      en: {
        trustWhen: "Informative when precision and recall need a compact operating-point summary.",
        doubtWhen: "Blind to the chosen threshold and the clinical cost ratio.",
        tryThis: "Inspect the precision-recall curve and consider an F-beta aligned to costs.",
      },
    },
    ap: {
      ko: {
        trustWhen: "confidence 순위 전반에서 검출 성능을 요약할 때 유용하다.",
        doubtWhen: "위치 정확도 기준, 병변 크기, class mix가 바뀌면 해석이 달라진다.",
        tryThis: "AP 계산의 IoU 기준과 병변 크기별 AP를 함께 보고하라.",
      },
      en: {
        trustWhen: "Informative when ranked detections across thresholds need one retrieval summary.",
        doubtWhen: "Blind when localization criteria, lesion size, or class mix differ.",
        tryThis: "State the IoU rule and stratify AP by lesion size.",
      },
    },
    map: {
      ko: {
        trustWhen: "여러 class나 IoU 기준을 평균해 전체 검출 benchmark를 비교할 때 유용하다.",
        doubtWhen: "작은 class나 중요한 class의 실패가 평균에 묻힐 수 있다.",
        tryThis: "class별 AP와 임상 우선순위 class의 결과를 따로 확인하라.",
      },
      en: {
        trustWhen: "Informative when a benchmark averages detection quality across classes or IoU rules.",
        doubtWhen: "Blind when clinically critical classes are diluted by averaging.",
        tryThis: "Inspect per-class AP and highlight the classes tied to the clinical use case.",
      },
    },
    ap50: {
      ko: {
        trustWhen: "대략적 위치만으로도 후보 발견이 의미 있는 과제에 유용하다.",
        doubtWhen: "느슨한 IoU 기준이라 경계가 부정확한 검출도 통과할 수 있다.",
        tryThis: "AP75 또는 AP@[.5:.95]와 함께 위치 정밀도를 확인하라.",
      },
      en: {
        trustWhen: "Informative when approximate localization is enough for candidate discovery.",
        doubtWhen: "Blind when loose IoU admits detections with imprecise boundaries.",
        tryThis: "Pair with AP75 or AP@[.5:.95] to check localization strictness.",
      },
    },
    ap75: {
      ko: {
        trustWhen: "더 엄격한 위치 일치가 필요한 검출 과제에 유용하다.",
        doubtWhen: "작은 병변이나 annotation 변동이 큰 데이터에서는 지나치게 민감할 수 있다.",
        tryThis: "AP50과 annotation 변동성을 함께 보고 strictness의 영향을 분리하라.",
      },
      en: {
        trustWhen: "Informative when detections must localize targets tightly.",
        doubtWhen: "Blind when tiny lesions or annotation variability make strict IoU unstable.",
        tryThis: "Compare with AP50 and review annotation variability.",
      },
    },
    apRange: {
      ko: {
        trustWhen: "느슨한 위치부터 엄격한 위치까지 평균적인 localization robustness를 볼 때 유용하다.",
        doubtWhen: "어느 IoU 구간에서 실패하는지 평균만으로는 알기 어렵다.",
        tryThis: "IoU threshold별 AP breakdown을 함께 제시하라.",
      },
      en: {
        trustWhen: "Informative when localization robustness across IoU thresholds matters.",
        doubtWhen: "Blind to which IoU band causes the drop.",
        tryThis: "Report AP broken down by IoU threshold.",
      },
    },
    froc: {
      ko: {
        trustWhen: "영상당 FP 허용량에 따라 lesion sensitivity가 어떻게 변하는지 볼 때 유용하다.",
        doubtWhen: "정확한 box 품질이나 class별 오류는 별도로 보아야 한다.",
        tryThis: "관심 FP/image 지점을 사전에 정하고 해당 sensitivity를 보고하라.",
      },
      en: {
        trustWhen: "Informative when lesion sensitivity must be read at allowed FP/image levels.",
        doubtWhen: "Blind to precise box quality and class-specific failure modes.",
        tryThis: "Predefine the FP/image points of interest and report sensitivity there.",
      },
    },
    sensAtFp: {
      ko: {
        trustWhen: "운영 가능한 FP/scan 한도에서 놓침 위험을 직접 평가할 때 유용하다.",
        doubtWhen: "선택한 FP 한도 밖의 순위 곡선은 보이지 않는다.",
        tryThis: "여러 FP 한도와 confidence threshold를 함께 제시하라.",
      },
      en: {
        trustWhen: "Informative when deployment fixes an acceptable FP/scan budget.",
        doubtWhen: "Blind to ranking behavior outside the selected FP budget.",
        tryThis: "Report several FP budgets and the confidence thresholds that realize them.",
      },
    },
  },
  "report-generation": {
    bleu: {
      ko: {
        trustWhen: "짧고 정형화된 표현에서 참조 문구와 n-gram 재사용을 확인할 때 유용하다.",
        doubtWhen: "의학적 동의어, 부정 표현, 사실성 오류를 충분히 구분하지 못한다.",
        tryThis: "동의어 paraphrase 사례와 임상 entity 기반 검토를 함께 하라.",
      },
      en: {
        trustWhen: "Informative when templated wording and n-gram reuse are the target signal.",
        doubtWhen: "Blind to medical synonyms, negation, and factual correctness.",
        tryThis: "Audit paraphrase cases and add entity-level clinical checks.",
      },
    },
    "rouge-l": {
      ko: {
        trustWhen: "참조 보고서와 긴 공통 subsequence를 얼마나 공유하는지 볼 때 유용하다.",
        doubtWhen: "문장 순서가 비슷해도 임상 assertion이 뒤집힐 수 있다.",
        tryThis: "entity, assertion, temporal relation 검토를 함께 추가하라.",
      },
      en: {
        trustWhen: "Informative when shared long subsequences with the reference are meaningful.",
        doubtWhen: "Blind when similar word order hides changed clinical assertions.",
        tryThis: "Add entity, assertion, and temporal-relation review.",
      },
    },
    meteor: {
      ko: {
        trustWhen: "표면 단어 일치보다 stem과 synonym 기반의 완화된 matching이 필요할 때 유용하다.",
        doubtWhen: "임상 개념의 중요도와 안전성은 여전히 별도 판단이 필요하다.",
        tryThis: "중요 소견별 error taxonomy로 어떤 synonym이 허용 가능한지 점검하라.",
      },
      en: {
        trustWhen: "Informative when relaxed matching via stems and synonyms is desired.",
        doubtWhen: "Blind to clinical importance and safety-critical concept changes.",
        tryThis: "Use a finding-level error taxonomy to decide which synonym matches are acceptable.",
      },
    },
    bertscore: {
      ko: {
        trustWhen: "표현이 달라도 문장 embedding 수준의 의미 유사성을 보려는 상황에 맞다.",
        doubtWhen: "높은 의미 유사성 안에 negation이나 laterality 오류가 남을 수 있다.",
        tryThis: "부정, 위치, 중증도 오류 사례를 targeted review로 분리하라.",
      },
      en: {
        trustWhen: "Informative when semantic similarity should tolerate paraphrase.",
        doubtWhen: "Blind when negation, laterality, or severity flips remain semantically close.",
        tryThis: "Run targeted review for negation, location, and severity errors.",
      },
    },
    ratescore: {
      ko: {
        trustWhen: "방사선 보고서 특화 표현 유사성과 임상 문맥 보존을 점검할 때 유용하다.",
        doubtWhen: "학습된 표현 공간이 기관별 문체나 드문 소견에 민감할 수 있다.",
        tryThis: "기관별 subset과 희귀 소견 subset에서 사례 기반 검토를 병행하라.",
      },
      en: {
        trustWhen: "Informative when radiology-specific semantic similarity is the target signal.",
        doubtWhen: "Blind when institutional style or rare findings shift the embedding space.",
        tryThis: "Audit site-specific subsets and rare-finding subsets with case review.",
      },
    },
    "temporal-f1": {
      ko: {
        trustWhen: "이전 검사 대비 호전, 악화, 안정 같은 변화 서술이 핵심일 때 유용하다.",
        doubtWhen: "시간 표현을 맞춰도 현재 소견의 사실성 오류는 남을 수 있다.",
        tryThis: "temporal relation과 현재 entity/assertion 정확도를 분리해 검토하라.",
      },
      en: {
        trustWhen: "Informative when change over prior exams is the clinical target.",
        doubtWhen: "Blind when temporal wording is correct but present findings are wrong.",
        tryThis: "Separate temporal-relation review from current entity/assertion review.",
      },
    },
    "chexbert-f1": {
      ko: {
        trustWhen: "흉부 X-ray label 수준에서 주요 소견의 존재 여부를 비교할 때 유용하다.",
        doubtWhen: "label granularity 밖의 세부 위치, 크기, 불확실성 표현은 빠질 수 있다.",
        tryThis: "label별 confusion과 서술 세부 오류를 함께 검토하라.",
      },
      en: {
        trustWhen: "Informative when chest X-ray finding labels are the evaluation target.",
        doubtWhen: "Blind to location, size, and uncertainty details outside the label set.",
        tryThis: "Inspect per-label confusion and narrative-detail errors.",
      },
    },
    "srr-bert-f1": {
      ko: {
        trustWhen: "semantic relation과 report-level finding matching을 함께 보려는 상황에 맞다.",
        doubtWhen: "추출기가 놓친 관계나 드문 표현은 평가 밖으로 빠질 수 있다.",
        tryThis: "관계 추출 실패 사례를 표본으로 뽑아 사람이 relation을 확인하라.",
      },
      en: {
        trustWhen: "Informative when semantic relations and report-level finding matches matter.",
        doubtWhen: "Blind when the extractor misses relations or rare phrasing.",
        tryThis: "Sample extraction failures and manually review the target relations.",
      },
    },
    "graph-f1": {
      ko: {
        trustWhen: "entity와 relation graph가 임상 사실 구조를 얼마나 보존하는지 볼 때 유용하다.",
        doubtWhen: "graph schema 밖의 nuance나 불확실성 표현은 직접 반영되지 않는다.",
        tryThis: "schema 밖 오류를 따로 태깅하고 entity/relation별 breakdown을 확인하라.",
      },
      en: {
        trustWhen: "Informative when entity-relation structure is the evaluation object.",
        doubtWhen: "Blind to uncertainty and nuance outside the graph schema.",
        tryThis: "Tag out-of-schema errors and inspect entity/relation breakdowns.",
      },
    },
    green: {
      ko: {
        trustWhen: "임상 오류 유형별로 보고서의 사실성 문제를 분류해 보고 싶을 때 유용하다.",
        doubtWhen: "자동 분류 기준이 현장 risk tolerance와 다를 수 있다.",
        tryThis: "오류 유형별 사례를 검토하고 임상 검수 기준과 매핑하라.",
      },
      en: {
        trustWhen: "Informative when factual report errors should be grouped by clinical type.",
        doubtWhen: "Blind when the automatic taxonomy differs from local risk tolerance.",
        tryThis: "Review examples per error type and map them to the clinical acceptance rubric.",
      },
    },
    crimson: {
      ko: {
        trustWhen: "보고서 오류의 임상적 심각도를 계층적으로 검토할 때 유용하다.",
        doubtWhen: "심각도 기준은 과제, 기관, 판독 workflow에 따라 달라질 수 있다.",
        tryThis: "기관별 acceptance rubric과 오류 심각도 예시를 맞춰 보라.",
      },
      en: {
        trustWhen: "Informative when report errors need severity-aware categorization.",
        doubtWhen: "Blind when severity definitions differ by task, site, or reading workflow.",
        tryThis: "Align severity examples with the site's acceptance rubric.",
      },
    },
    "llm-evaluator-landscape": {
      ko: {
        trustWhen: "학습된 평가기들이 어떤 관점을 추가하는지 정리해 비교할 때 유용하다.",
        doubtWhen: "이 대시보드는 평가기를 실행하지 않으므로 실제 배치 성능을 보장하지 않는다.",
        tryThis: "사용할 평가기의 입력, 출력, 검증 데이터, 실패 사례를 논문 기준으로 확인하라.",
      },
      en: {
        trustWhen: "Informative when comparing what learned evaluators are designed to inspect.",
        doubtWhen: "Blind to deployment behavior because this dashboard only summarizes the landscape.",
        tryThis: "Check each evaluator's inputs, outputs, validation data, and reported failure cases.",
      },
    },
    "clinical-acceptance": {
      ko: {
        trustWhen: "자동 metric보다 실제 판독 workflow에서 허용 가능한 오류인지가 핵심일 때 유용하다.",
        doubtWhen: "합의된 rubric 없이는 평가자 간 기준 차이가 결과를 흔든다.",
        tryThis: "acceptance 기준을 사전 정의하고 불일치 사례를 consensus review로 정리하라.",
      },
      en: {
        trustWhen: "Informative when workflow acceptance matters more than proxy text matching.",
        doubtWhen: "Blind when reviewers lack a shared rubric for acceptable errors.",
        tryThis: "Predefine acceptance criteria and resolve disagreements with consensus review.",
      },
    },
  },
};

export function metricJudgmentGuide(
  topicId: string,
  sectionId: string,
  lang: Lang,
): MetricJudgmentGuide | undefined {
  return METRIC_JUDGMENT_GUIDES[topicId]?.[sectionId]?.[lang];
}
