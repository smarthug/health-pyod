/**
 * WESAD PyOD 대시보드 메인 앱
 */
import { useState, useEffect } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Grid,
  Paper,
  Box,
  CircularProgress,
  Alert,
  ThemeProvider,
  createTheme,
  CssBaseline,
} from '@mui/material';
import ScienceIcon from '@mui/icons-material/Science';
import SubjectSelector from './components/SubjectSelector';
import AlgoSelector from './components/AlgoSelector';
import RunPanel from './components/RunPanel';
import ResultsPanel from './components/ResultsPanel';
import {
  getSubjects,
  getAlgorithms,
  runAnomalyDetection,
  type RunResponse,
} from './api';

// MUI 테마 설정
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

function App() {
  const [subjects, setSubjects] = useState<string[]>([]);
  const [algorithms, setAlgorithms] = useState<any[]>([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedAlgo, setSelectedAlgo] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<RunResponse | null>(null);

  // 초기 데이터 로드
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const [subjectsData, algorithmsData] = await Promise.all([
          getSubjects(),
          getAlgorithms(),
        ]);
        setSubjects(subjectsData);
        setAlgorithms(algorithmsData);

        // 기본값 설정
        if (subjectsData.length > 0) {
          setSelectedSubject(subjectsData[0]);
        }
        if (algorithmsData.length > 0) {
          setSelectedAlgo(algorithmsData[0].id);
        }
      } catch (err) {
        setError('Failed to load initial data. Make sure the backend is running.');
        console.error(err);
      }
    };

    loadInitialData();
  }, []);

  // 이상치 탐지 실행
  const handleRun = async (params: any) => {
    if (!selectedSubject || !selectedAlgo) {
      setError('Please select a subject and algorithm');
      return;
    }

    setLoading(true);
    setError(null);
    setResults(null);

    try {
      const response = await runAnomalyDetection({
        subject_id: selectedSubject,
        algorithm: selectedAlgo,
        params,
      });
      setResults(response);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to run anomaly detection');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{  minHeight: '100vh', bgcolor: '#f5f5f5',width: '100%' }}>
        {/* 헤더 */}
        <AppBar position="static">
          <Toolbar>
            <ScienceIcon sx={{ mr: 2 }} />
            <Typography variant="h6" component="div">
              WESAD PyOD Dashboard
            </Typography>
          </Toolbar>
        </AppBar>

        {/* 메인 컨테이너 */}
        <Box sx={{ px: 3, mt: 4, mb: 4 }}>
          <Grid container spacing={3}>
            {/* 좌측 패널 - 설정 */}
            <Grid item xs={12} md={4} lg={3}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Configuration
                </Typography>

                <Box sx={{ mb: 2 }}>
                  <SubjectSelector
                    value={selectedSubject}
                    onChange={setSelectedSubject}
                    options={subjects}
                  />
                </Box>

                <Box sx={{ mb: 2 }}>
                  <AlgoSelector
                    value={selectedAlgo}
                    onChange={setSelectedAlgo}
                    options={algorithms}
                  />
                </Box>

                <Box sx={{ mt: 3 }}>
                  <RunPanel
                    algorithm={selectedAlgo}
                    onRun={handleRun}
                    loading={loading}
                  />
                </Box>

                {/* 에러 표시 */}
                {error && (
                  <Box sx={{ mt: 2 }}>
                    <Alert severity="error">{error}</Alert>
                  </Box>
                )}
              </Paper>
            </Grid>

            {/* 우측 패널 - 결과 */}
            <Grid item xs={12} md={8} lg={9}>
              <Paper sx={{ p: 3 }}>
                {loading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
                    <CircularProgress size={60} />
                  </Box>
                ) : (
                  <ResultsPanel results={results} />
                )}
              </Paper>
            </Grid>
          </Grid>
        </Box>

        {/* 푸터 */}
        {/* <Box component="footer" sx={{ py: 3, px: 2, mt: 'auto', bgcolor: '#e0e0e0', textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            WESAD PyOD Dashboard - Anomaly Detection with PyOD
          </Typography>
        </Box> */}
      </Box>
    </ThemeProvider>
  );
}

export default App;
