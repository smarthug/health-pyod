/**
 * 실행 패널 - 파라미터 설정 및 실행 버튼
 */
import { useState } from 'react';
import {
  Box,
  Button,
  TextField,
  FormControlLabel,
  Checkbox,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Tooltip,
  IconButton,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
// import { type RunParams } from '../api';

interface RunPanelProps {
  algorithm: string;
  onRun: (params: any) => void;
  loading: boolean;
}

export default function RunPanel({ algorithm, onRun, loading }: RunPanelProps) {
  const [contamination, setContamination] = useState(0.05);
  const [nEstimators, setNEstimators] = useState(300);
  const [nNeighbors, setNNeighbors] = useState(15);
  const [pcaComponents, setPcaComponents] = useState<number | null>(10);
  const [winS, setWinS] = useState(60);
  const [stepS, setStepS] = useState(30);
  const [evaluate, setEvaluate] = useState(true);

  const handleRun = () => {
    const params: any = {
      contamination,
      win_s: winS,
      step_s: stepS,
      pca_components: pcaComponents,
      evaluate,
    };

    if (algorithm === 'iforest') {
      params.n_estimators = nEstimators;
    } else if (algorithm === 'knn') {
      params.n_neighbors = nNeighbors;
    }

    onRun(params);
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Parameters
      </Typography>

      <Box sx={{ mb: 2 }}>
        <TextField
          fullWidth
          type="number"
          label="Contamination"
          value={contamination}
          onChange={(e) => setContamination(parseFloat(e.target.value))}
          inputProps={{ step: 0.01, min: 0, max: 0.5 }}
          margin="normal"
          helperText="이상 비율 추정치(0~0.5). 높을수록 민감↑, 낮을수록 보수적"
        />
      </Box>

      {algorithm === 'iforest' && (
        <Box sx={{ mb: 2 }}>
          <TextField
            fullWidth
            type="number"
            label="N Estimators"
            value={nEstimators}
            onChange={(e) => setNEstimators(parseInt(e.target.value))}
            inputProps={{ step: 10, min: 10 }}
            margin="normal"
            helperText="트리 개수. 클수록 안정적/느림 (기본 300)"
          />
        </Box>
      )}

      {algorithm === 'knn' && (
        <Box sx={{ mb: 2 }}>
          <TextField
            fullWidth
            type="number"
            label="N Neighbors"
            value={nNeighbors}
            onChange={(e) => setNNeighbors(parseInt(e.target.value))}
            inputProps={{ step: 1, min: 1 }}
            margin="normal"
            helperText="이웃 수. 클수록 보수적이고 덜 민감 (기본 15)"
          />
        </Box>
      )}

      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography>Advanced Settings</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Box>
            <TextField
              fullWidth
              type="number"
              label="Window Size (seconds)"
              value={winS}
              onChange={(e) => setWinS(parseInt(e.target.value))}
              inputProps={{ step: 10, min: 10 }}
              margin="normal"
              helperText="한 번에 보는 구간 길이(초). 60초 권장"
            />
            <TextField
              fullWidth
              type="number"
              label="Step Size (seconds)"
              value={stepS}
              onChange={(e) => setStepS(parseInt(e.target.value))}
              inputProps={{ step: 5, min: 5 }}
              margin="normal"
              helperText="윈도우 간 이동 간격(초). 작을수록 촘촘하고 계산량↑"
            />
            <TextField
              fullWidth
              type="number"
              label="PCA Components (null = no PCA)"
              value={pcaComponents ?? ''}
              onChange={(e) => setPcaComponents(e.target.value ? parseInt(e.target.value) : null)}
              inputProps={{ step: 1, min: 1 }}
              margin="normal"
              helperText="특징 차원 축소 개수. 비워두면 사용 안 함(원본 사용)"
            />
            <FormControlLabel
              control={<Checkbox checked={evaluate} onChange={(e) => setEvaluate(e.target.checked)} />}
              label={
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  Evaluate (calculate metrics)
                  <Tooltip
                    title="라벨이 있을 때 AUROC/AUPRC/F1 같은 성능 지표를 계산합니다."
                    arrow
                  >
                    <IconButton size="small" sx={{ ml: 0.5 }} aria-label="지표 계산 설명">
                      <InfoOutlinedIcon fontSize="inherit" />
                    </IconButton>
                  </Tooltip>
                </Box>
              }
            />
          </Box>
        </AccordionDetails>
      </Accordion>

      <Box sx={{ mt: 3 }}>
        <Button
          fullWidth
          variant="contained"
          color="primary"
          size="large"
          onClick={handleRun}
          disabled={loading}
          startIcon={<PlayArrowIcon />}
        >
          {loading ? 'Running...' : 'Run Anomaly Detection'}
        </Button>
      </Box>
    </Box>
  );
}
