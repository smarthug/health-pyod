/**
 * 유틸리티 함수 - 차트 데이터 변환 및 처리
 */

export interface SeriesData {
  t: number;
  m: number;
  score: number;
  pred: number;
  label?: number;
}

/**
 * 타임/점수 배열을 차트용 레코드로 변환
 */
export function toSeries(
  times: number[],
  scores: number[],
  preds: number[],
  labels?: number[]
): SeriesData[] {
  return times.map((t, i) => ({
    t,
    m: (t - times[0]) / 60, // 분 단위로 변환
    score: scores[i],
    pred: preds[i],
    label: labels?.[i],
  }));
}

/**
 * 롤링 평균 계산
 */
export function rollingAvg(arr: number[], w = 7): number[] {
  const out: number[] = [];
  let sum = 0;

  for (let i = 0; i < arr.length; i++) {
    sum += arr[i];
    if (i >= w) sum -= arr[i - w];
    out.push(i >= w - 1 ? sum / w : arr[i]);
  }

  return out;
}

/**
 * 히스토그램 빈 카운트 계산
 */
export function histogram(
  values: number[],
  bins = 30
): { bin: number; count: number }[] {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const width = (max - min) / bins || 1;
  const counts = Array(bins).fill(0);

  values.forEach((v) => {
    const idx = Math.min(bins - 1, Math.max(0, Math.floor((v - min) / width)));
    counts[idx]++;
  });

  return counts.map((c, i) => ({
    bin: +(min + i * width).toFixed(3),
    count: c,
  }));
}
