/**
 * 결과 패널 - 알고리즘별 차트 분기 및 지표 표시
 */
import { Box, Typography } from '@mui/material';
import type { AlgorithmId } from '../api';
import InterpretationPanel from './InterpretationPanel';
import EcodView from './results/EcodView';
import IForestView from './results/IForestView';
import KnnView from './results/KnnView';
import MetricsCards from './results/MetricsCards';

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

interface ResultsPanelProps {
  results: {
    algorithm: AlgorithmId;
    subject_id: string;
    meta: any;
    threshold?: number;
  } & ResultsProps | null;
}

export default function ResultsPanel({ results }: ResultsPanelProps) {
  if (!results) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h6" color="text.secondary">
          No results yet. Run anomaly detection to see results.
        </Typography>
      </Box>
    );
  }

  const { algorithm, times, scores, preds, threshold, labels, metrics, subject_id, meta } = results;

  // 알고리즘별 뷰 선택
  const renderAlgorithmView = () => {
    const props: ResultsProps = { times, scores, preds, threshold, labels, metrics };

    switch (algorithm) {
      case 'ecod':
        return <EcodView {...props} />;
      case 'iforest':
        return <IForestView {...props} />;
      case 'knn':
        return <KnnView {...props} />;
      default:
        return (
          <Typography color="error">
            Unknown algorithm: {algorithm}
          </Typography>
        );
    }
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Results - {subject_id} ({algorithm.toUpperCase()})
      </Typography>

      {/* 평가 지표 카드 */}
      <MetricsCards metrics={metrics} threshold={threshold} meta={meta} />

      {/* 알고리즘 해석 패널 */}
      <Box sx={{ mt: 3 }}>
        <InterpretationPanel
          algorithm={algorithm}
          times={times}
          scores={scores}
          preds={preds}
          threshold={threshold}
          labels={labels}
          metrics={metrics}
        />
      </Box>

      {/* 알고리즘별 차트 */}
      <Box sx={{ mt: 3 }}>
        {renderAlgorithmView()}
      </Box>
    </Box>
  );
}
