/**
 * Isolation Forest 알고리즘 전용 뷰
 * - 점수 라인 + 롤링 평균 Area + 이상 예측 Bar 오버레이
 * - 임계선 + Brush
 */
import { Box, Typography, Alert } from '@mui/material';
import {
  ComposedChart,
  Line,
  Area,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
  Brush,
  ResponsiveContainer,
} from 'recharts';
import { toSeries, rollingAvg } from './utils';

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

export default function IForestView(props: ResultsProps) {
  const { times, scores, preds, threshold, labels } = props;
  const base = toSeries(times, scores, preds, labels);
  const roll = rollingAvg(scores, 7);

  const data = base.map((d, i) => ({
    ...d,
    roll: roll[i],
    predBar: d.pred ? d.score : 0,
  }));

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        시계열 이상 점수 (복합 뷰)
      </Typography>
      <Alert severity="info" sx={{ mb: 2 }}>
        <Typography variant="body2">
          <strong>이 그래프 보는 법:</strong> 파란 선은 순간 이상 점수, 초록 영역은 7-윈도우 롤링 평균, 빨간 막대는 이상으로 예측된 구간입니다.
          롤링 평균이 임계선 근처에서 지속되면 장기적 이상 패턴을 의심할 수 있습니다.
          빨간 막대가 여러 개 연속으로 나타나면 유의미한 이벤트일 가능성이 높습니다.
        </Typography>
      </Alert>
      <div style={{ height: 360 }}>
        <ResponsiveContainer>
          <ComposedChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="m"
              label={{ value: 'Minutes', position: 'insideBottom', offset: -5 }}
            />
            <YAxis label={{ value: 'Anomaly Score', angle: -90, position: 'insideLeft' }} />
            <Tooltip />
            <Area
              type="monotone"
              dataKey="roll"
              stroke="#66bb6a"
              fill="#a5d6a7"
              fillOpacity={0.35}
              name="Rolling Avg"
            />
            <Line
              type="monotone"
              dataKey="score"
              stroke="#1e88e5"
              dot={false}
              name="Score"
            />
            <Bar
              dataKey="predBar"
              fill="#ef5350"
              barSize={8}
              name="Predicted Anomaly"
            />
            {threshold !== undefined && (
              <ReferenceLine
                y={threshold}
                stroke="#e53935"
                strokeDasharray="4 4"
                label="Threshold"
              />
            )}
            <Brush dataKey="m" height={24} travellerWidth={8} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </Box>
  );
}
