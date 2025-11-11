/**
 * ECOD 알고리즘 전용 뷰
 * - 점수 라인 차트 + 임계선 + Brush
 * - 점수 분포 히스토그램
 */
import { Box, Typography, Alert } from '@mui/material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
  Brush,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';
import { toSeries, histogram } from './utils';

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

export default function EcodView(props: ResultsProps) {
  const { times, scores, preds, threshold, labels } = props;
  const series = toSeries(times, scores, preds, labels);
  const hist = histogram(scores, 30);

  return (
    <Box sx={{ display: 'grid', gap: 2 }}>
      {/* 메인 라인 차트 */}
      <Box>
        <Typography variant="h6" gutterBottom>
          시계열 이상 점수
        </Typography>
        <Alert severity="info" sx={{ mb: 2 }}>
          <Typography variant="body2">
            <strong>이 그래프 보는 법:</strong> 파란 선은 시간에 따른 이상 점수를 나타냅니다.
            빨간 점선(임계값)을 넘는 구간은 이상으로 판단됩니다.
            하단 슬라이더로 원하는 구간을 확대해 볼 수 있습니다.
          </Typography>
        </Alert>
        <div style={{ height: 320 }}>
          <ResponsiveContainer>
            <LineChart data={series}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="m"
                label={{ value: 'Minutes', position: 'insideBottom', offset: -5 }}
              />
              <YAxis label={{ value: 'Anomaly Score', angle: -90, position: 'insideLeft' }} />
              <Tooltip />
              <Line type="monotone" dataKey="score" stroke="#1976d2" dot={false} name="Score" />
              {threshold !== undefined && (
                <ReferenceLine
                  y={threshold}
                  stroke="#e53935"
                  strokeDasharray="4 4"
                  label="Threshold"
                />
              )}
              <Brush dataKey="m" height={24} travellerWidth={8} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Box>

      {/* 히스토그램 */}
      <Box>
        <Typography variant="h6" gutterBottom>
          점수 분포 히스토그램
        </Typography>
        <Alert severity="info" sx={{ mb: 2 }}>
          <Typography variant="body2">
            <strong>이 그래프 보는 법:</strong> 전체 점수의 분포를 보여줍니다.
            오른쪽 꼬리가 길게 늘어지면 높은 점수(이상)를 가진 구간이 존재함을 의미합니다.
            대부분의 점수가 낮은 값에 몰려있고 소수만 높다면, 이는 정상적인 이상 탐지 패턴입니다.
          </Typography>
        </Alert>
        <div style={{ height: 220 }}>
          <ResponsiveContainer>
            <BarChart data={hist}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="bin" label={{ value: 'Score', position: 'insideBottom', offset: -5 }} />
              <YAxis label={{ value: 'Count', angle: -90, position: 'insideLeft' }} />
              <Tooltip />
              <Bar dataKey="count" fill="#90caf9" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Box>
    </Box>
  );
}
