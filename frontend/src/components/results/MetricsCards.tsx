/**
 * Metrics Cards - 평가 지표 및 메타데이터 표시
 */
import { Card, CardContent, Typography, Grid, Stack, Tooltip, IconButton, Box } from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

interface MetricsCardsProps {
  metrics?: {
    auroc?: number;
    auprc?: number;
    f1?: number;
  };
  threshold?: number;
  meta?: {
    n_windows: number;
    win_s: number;
    step_s: number;
    feature_dim: number;
  };
}

export default function MetricsCards({ metrics, threshold, meta }: MetricsCardsProps) {
  return (
    <Stack spacing={2}>
      {/* 평가 지표 */}
      {metrics && (
        <Grid container spacing={2}>
          <Grid item xs={12} sm={4}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Typography variant="overline" color="text.secondary" sx={{ mr: 0.5 }}>
                    AUROC
                  </Typography>
                  <Tooltip
                    title="임계값을 바꿔가며 정상/이상을 얼마나 잘 구분하는지 (0.5=무작위, 1.0=완벽)"
                    arrow
                  >
                    <IconButton size="small" aria-label="AUROC 설명">
                      <InfoOutlinedIcon fontSize="inherit" />
                    </IconButton>
                  </Tooltip>
                </Box>
                <Typography variant="h5">
                  {metrics.auroc?.toFixed(3) ?? '-'}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Typography variant="overline" color="text.secondary" sx={{ mr: 0.5 }}>
                    AUPRC
                  </Typography>
                  <Tooltip
                    title="양성(스트레스) 위주로 볼 때의 구분 성능. 불균형 데이터에서 유용합니다."
                    arrow
                  >
                    <IconButton size="small" aria-label="AUPRC 설명">
                      <InfoOutlinedIcon fontSize="inherit" />
                    </IconButton>
                  </Tooltip>
                </Box>
                <Typography variant="h5">
                  {metrics.auprc?.toFixed(3) ?? '-'}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Typography variant="overline" color="text.secondary" sx={{ mr: 0.5 }}>
                    F1 Score
                  </Typography>
                  <Tooltip
                    title="정확도(Precision)와 재현율(Recall)의 조화 평균. 1.0에 가까울수록 균형이 좋습니다."
                    arrow
                  >
                    <IconButton size="small" aria-label="F1 설명">
                      <InfoOutlinedIcon fontSize="inherit" />
                    </IconButton>
                  </Tooltip>
                </Box>
                <Typography variant="h5">
                  {metrics.f1?.toFixed(3) ?? '-'}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* 메타데이터 */}
      {meta && (
        <Grid container spacing={2}>
          <Grid item xs={6} sm={3}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="body2" color="text.secondary">
                  Windows
                </Typography>
                <Typography variant="h6">{meta.n_windows}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="body2" color="text.secondary">
                  Window Size
                </Typography>
                <Typography variant="h6">{meta.win_s}s</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="body2" color="text.secondary">
                  Step Size
                </Typography>
                <Typography variant="h6">{meta.step_s}s</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="body2" color="text.secondary">
                  Threshold
                </Typography>
                <Typography variant="h6">
                  {threshold?.toFixed(4) ?? '-'}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
    </Stack>
  );
}
