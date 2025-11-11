/**
 * API 클라이언트 - 백엔드와 통신
 */
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8001';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 타입 정의
export type AlgorithmId = 'ecod' | 'iforest' | 'knn';

export interface AlgorithmInfo {
  id: string;
  name: string;
  params: Record<string, any>;
}

export interface RunParams {
  contamination?: number;
  n_estimators?: number;
  n_neighbors?: number;
  pca_components?: number | null;
  win_s?: number;
  step_s?: number;
  random_state?: number;
  evaluate?: boolean;
}

export interface RunRequest {
  subject_id: string;
  algorithm: string;
  params?: RunParams;
}

export interface RunResponse {
  subject_id: string;
  algorithm: AlgorithmId;
  params: Record<string, any>;
  meta: {
    win_s: number;
    step_s: number;
    n_windows: number;
    feature_dim: number;
    start_ts: number;
    fs_ref: string;
  };
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

// API 함수들
export const getSubjects = async (): Promise<string[]> => {
  const response = await apiClient.get<{ subjects: string[] }>('/subjects');
  return response.data.subjects;
};

export const getAlgorithms = async (): Promise<AlgorithmInfo[]> => {
  const response = await apiClient.get<{ algorithms: AlgorithmInfo[] }>('/algorithms');
  return response.data.algorithms;
};

export const runAnomalyDetection = async (request: RunRequest): Promise<RunResponse> => {
  const response = await apiClient.post<RunResponse>('/run', request);
  return response.data;
};
