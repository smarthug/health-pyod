/**
 * KNN 알고리즘 전용 뷰
 * - 점수 산점도 (이상/정상 색상 분리)
 * - 하단 미니 타임라인 + Brush
 */
import { Box, Typography, Alert, Button } from '@mui/material';
import { useMemo, useState } from 'react';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  LineChart,
  Line,
  Brush,
  Legend,
} from 'recharts';
import { toSeries } from './utils';

export interface ResultsProps {
  times: number[];
  scores: number[];
  preds: number[];
  threshold?: number;
  labels?: number[];
  metrics?: {
    auroc?: number;
    auprc?: number;
    f1?: number;
  };
}

export default function KnnView(props: ResultsProps) {
  const { times, scores, preds, labels } = props;
  const data = useMemo(() => toSeries(times, scores, preds, labels), [times, scores, preds, labels]);
  const [sel, setSel] = useState<{ startIndex: number; endIndex: number } | null>(null);

  const xDomain = useMemo(() => {
    if (!sel || data.length === 0) return null;
    const start = Math.max(0, Math.min(sel.startIndex, data.length - 1));
    const end = Math.max(0, Math.min(sel.endIndex, data.length - 1));
    const i0 = Math.min(start, end);
    const i1 = Math.max(start, end);
    return [data[i0].m, data[i1].m] as [number, number];
  }, [sel, data]);

  const normal = useMemo(() => data.filter((d) => !d.pred), [data]);
  const anom = useMemo(() => data.filter((d) => d.pred), [data]);

  return (
    <Box sx={{ display: 'grid', gap: 2 }}>
      {/* 산점도 */}
      <Box>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6" gutterBottom>
            이상/정상 산점도
          </Typography>
          {xDomain && (
            <Button size="small" onClick={() => setSel(null)}>Reset View</Button>
          )}
        </Box>
        <Alert severity="info" sx={{ mb: 2 }}>
          <Typography variant="body2">
            <strong>이 그래프 보는 법:</strong> 파란 점은 정상, 빨간 점은 이상으로 분류된 윈도우입니다.
            빨간 점이 전체 군집에서 멀리 떨어져 있으면 강한 이상 신호입니다.
            활동 상태가 급변하는 직후 나타나는 일시적 이상은 전이(Transition) 구간일 수 있으니 주의가 필요합니다.
          </Typography>
        </Alert>
        <div style={{ height: 320 }}>
          <ResponsiveContainer>
            <ScatterChart>
              <CartesianGrid />
              {/* Brush로 선택한 구간을 산점도에 반영 */}
              <XAxis
                type="number"
                dataKey="m"
                name="Minutes"
                label={{ value: 'Minutes', position: 'insideBottom', offset: -5 }}
                {...(xDomain ? { domain: xDomain as [number, number] } : {})}
              />
              <YAxis
                dataKey="score"
                name="Score"
                label={{ value: 'Anomaly Score', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} />
              <Legend />
              <Scatter name="Normal" data={normal} fill="#42a5f5" />
              <Scatter name="Anomaly" data={anom} fill="#e53935" />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </Box>

      {/* 하단 미니 타임라인 */}
      <Box>
        <Typography variant="h6" gutterBottom>
          미니 타임라인 (전체 흐름)
        </Typography>
        <Alert severity="info" sx={{ mb: 2 }}>
          <Typography variant="body2">
            <strong>이 그래프 보는 법:</strong> 전체 시간대의 점수 흐름을 한눈에 볼 수 있습니다.
            하단 슬라이더로 특정 구간을 선택하면 위 산점도에서 해당 구간을 확대해 볼 수 있습니다.
          </Typography>
        </Alert>
        <div style={{ height: 180 }}>
          <ResponsiveContainer>
            <LineChart data={data}>
              <XAxis dataKey="m" label={{ value: 'Minutes', position: 'insideBottom', offset: -5 }} />
              <YAxis hide />
              <Tooltip />
              <Line type="monotone" dataKey="score" stroke="#90caf9" dot={false} name="Score" />
              <Brush
                dataKey="m"
                height={20}
                travellerWidth={8}
                onChange={(range: any) => {
                  if (range && typeof range.startIndex === 'number' && typeof range.endIndex === 'number') {
                    setSel({ startIndex: range.startIndex, endIndex: range.endIndex });
                  }
                }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Box>
    </Box>
  );
}
