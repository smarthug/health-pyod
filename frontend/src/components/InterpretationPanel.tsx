import { Card, CardContent, Typography, Stack, Chip, Alert, Divider } from '@mui/material';
import type { AlgorithmId } from '../api';

export interface InterpretationProps {
  algorithm: AlgorithmId;
  times: number[];
  scores: number[];
  preds: number[]; // 1 = 이상, 0 = 정상
  threshold?: number;
  labels?: number[]; // 0=기타/전이, 1=베이스라인, 2=스트레스, 3=유쾌, 4=명상
  metrics?: { auroc?: number; auprc?: number; f1?: number };
}

const labelName = (v?: number) =>
  ({ 0: '기타/전이', 1: '베이스라인', 2: '스트레스(TSST)', 3: '유쾌(Fun)', 4: '명상' } as Record<number, string>)[v ?? -1] ?? '기타';

const fmt = (x?: number, d = 3) => (typeof x === 'number' ? x.toFixed(d) : '-');

const algoHelp: Record<AlgorithmId, { title: string; how: string[]; read: string[] }> = {
  ecod: {
    title: 'ECOD 해석',
    how: [
      '데이터 분포에서 유난히 튀는 값을 비모수 방식으로 찾습니다.',
      '설정이 단순하고 빠르며, 스케일 변화에 비교적 강합니다.',
    ],
    read: [
      '점수: 높을수록 평소와 다름(이상 가능성 상승)을 의미합니다.',
      '임계선 위 구간은 이상으로 분류됩니다.',
      '히스토그램 꼬리가 길면 이상 구간 존재 가능성을 시사합니다.',
    ],
  },
  iforest: {
    title: 'Isolation Forest 해석',
    how: [
      '무작위 분할로 포인트를 고립시키며, 빨리 고립되면 이상으로 봅니다.',
      '잡음에 비교적 강하고, 고차원에서도 잘 동작합니다.',
    ],
    read: [
      '점수: 높을수록 이상 가능성이 큽니다(여기서는 "높을수록 이상"으로 통일).',
      '롤링 평균(Area)이 임계 부근에서 길게 유지되면 지속 이상 패턴을 의심합니다.',
      '막대(Bar)가 연속으로 나타나면 의미 있는 이벤트일 가능성이 큽니다.',
    ],
  },
  knn: {
    title: 'KNN 해석',
    how: [
      '근처 이웃과의 거리(또는 밀도)로 이상을 판단합니다.',
      '주변에 닮은 점(이웃)이 드물면 이상으로 간주합니다.',
    ],
    read: [
      '산점도에서 빨간 점(이상)이 군집에서 떨어져 있으면 강한 이상 신호입니다.',
      '하단 미니 타임라인으로 전체 흐름을 보고 확대해 확인하세요.',
      '활동 급변 직후 일시적 이상은 전이(Transition)일 수 있습니다.',
    ],
  },
};

export default function InterpretationPanel({
  algorithm, times, scores, preds, threshold, labels, metrics,
}: InterpretationProps) {
  const n = scores?.length ?? 0;
  const k = preds?.filter(p => p === 1).length ?? 0;
  const rate = n ? (k / n) : 0;

  const idxs = scores.map((s, i) => [s, i] as const).sort((a, b) => b[0] - a[0]).slice(0, 5).map(([, i]) => i);
  const t0 = times?.[0] ?? 0;
  const topWindows = idxs.map(i => ({
    i,
    minute: ((times[i] - t0) / 60),
    score: scores[i],
    pred: preds[i],
    label: labels ? labelName(labels[i]) : undefined,
  }));

  const dist = (labels ?? []).reduce<Record<string, number>>((acc, v) => {
    const key = labelName(v);
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});
  const distChips = Object.entries(dist).map(([k, v]) => (
    <Chip key={k} label={`${k} ${v}개`} size="small" sx={{ mr: 1, mb: 1 }} />
  ));

  const h = algoHelp[algorithm];
  const auroc = metrics?.auroc, auprc = metrics?.auprc, f1 = metrics?.f1;
  const quality =
    auroc && auroc >= 0.85 ? '좋음'
    : auroc && auroc >= 0.75 ? '보통'
    : auroc ? '낮음' : '지표 없음';

  const summaryLines = [
    `윈도우: ${n}개, 이상 예측: ${k}개 (${(rate * 100).toFixed(1)}%)`,
    threshold !== undefined ? `임계값: ${fmt(threshold)}` : '임계값: (없음)',
    metrics
      ? `AUROC ${fmt(auroc)} / AUPRC ${fmt(auprc)} / F1 ${fmt(f1)} → 모델 신뢰도: ${quality}`
      : '지표: 라벨이 없어 계산하지 않음',
  ];

  return (
    <Stack spacing={2}>
      <Card variant="outlined">
        <CardContent>
          <Typography variant="h6" gutterBottom>{h.title}</Typography>
          <Typography variant="subtitle2" gutterBottom>원리</Typography>
          {h.how.map((t, i) => <Typography key={i} variant="body2">- {t}</Typography>)}
          <Divider sx={{ my: 1.5 }} />
          <Typography variant="subtitle2" gutterBottom>그래프 읽는 법</Typography>
          {h.read.map((t, i) => <Typography key={i} variant="body2">- {t}</Typography>)}
        </CardContent>
      </Card>

      <Card variant="outlined">
        <CardContent>
          <Typography variant="h6" gutterBottom>이번 실행 결과 요약</Typography>
          {summaryLines.map((t, i) => <Typography key={i} variant="body2">• {t}</Typography>)}
          {labels && (
            <>
              <Divider sx={{ my: 1.5 }} />
              <Typography variant="subtitle2" gutterBottom>라벨 분포</Typography>
              <div>{distChips}</div>
            </>
          )}
          <Divider sx={{ my: 1.5 }} />
          <Typography variant="subtitle2" gutterBottom>상위 이상 구간(Top 5)</Typography>
          {topWindows.map(({ i, minute, score, pred, label }) => (
            <Typography key={i} variant="body2">
              • {minute.toFixed(1)}분 — score {fmt(score)} {pred ? '(이상)' : '(정상)'} {label ? `| ${label}` : ''}
            </Typography>
          ))}
          <Alert severity="info" sx={{ mt: 1 }}>
            참고: 점수는 "높을수록 이상"으로 표시됩니다. 전이 구간(라벨 0)은 해석에서 제외하는 것이 좋습니다.
          </Alert>
        </CardContent>
      </Card>
    </Stack>
  );
}
