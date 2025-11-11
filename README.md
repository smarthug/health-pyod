# WESAD PyOD Dashboard

WESAD 데이터셋 기반 이상치 탐지 대시보드입니다. FastAPI + PyOD로 구축된 백엔드와 React + MUI로 구축된 프론트엔드로 구성되어 있습니다.

## 프로젝트 구조

```
health-pyod/
├── backend/              # FastAPI 백엔드 (uv 기반)
│   ├── pyproject.toml   # uv 프로젝트 설정
│   ├── uv.lock          # uv 락 파일
│   ├── api.py           # FastAPI 엔트리포인트
│   ├── data_loader.py   # E4 센서 데이터 로더
│   ├── features.py      # 특징 추출
│   ├── labeling.py      # Quest 라벨 파서
│   ├── models.py        # PyOD 모델 팩토리
│   ├── schemas.py       # Pydantic 스키마
│   ├── cache/           # 특징 캐시 디렉토리
│   └── data/WESAD/      # WESAD 데이터셋
└── frontend/            # React 프론트엔드
    └── src/
        ├── api.ts       # API 클라이언트
        ├── App.tsx      # 메인 앱
        └── components/  # UI 컴포넌트
```

## 기능

### Backend (FastAPI + PyOD)
- E4 센서 데이터 로드 및 전처리 (EDA, ACC, TEMP, HR)
- 윈도우 기반 특징 추출 (19차원)
- Quest 파일 기반 라벨 매핑
- PyOD 이상치 탐지 알고리즘:
  - ECOD (Empirical Cumulative distribution based Outlier Detection)
  - Isolation Forest
  - K-Nearest Neighbors
- 평가 지표: AUROC, AUPRC, F1 Score

### Frontend (React + MUI)
- 피험자 및 알고리즘 선택
- 파라미터 설정 (contamination, window size, PCA components 등)
- 실시간 결과 시각화:
  - 이상치 점수 시계열 차트
  - 예측 타임라인
  - Ground truth 라벨
- 평가 지표 카드

## 설치 및 실행

### 1. Backend 설정

이 프로젝트는 [uv](https://github.com/astral-sh/uv)를 사용하여 Python 패키지를 관리합니다.

```bash
cd backend

# uv 설치 (macOS/Linux)
curl -LsSf https://astral.sh/uv/install.sh | sh

# 의존성 설치
uv sync

# 서버 실행 (포트 8001)
uv run uvicorn api:app --host 127.0.0.1 --port 8001 --reload
```

Backend API는 `http://localhost:8001`에서 실행됩니다.

**참고**: uv는 Rust로 작성된 빠른 Python 패키지 관리자로, pip보다 10-100배 빠른 의존성 설치를 제공합니다.

### 2. Frontend 설정

```bash
cd frontend

# 의존성 설치
npm install

# 개발 서버 실행 (포트 5173)
npm run dev
```

Frontend는 `http://localhost:5173`에서 실행됩니다.

### 3. 브라우저에서 접속

http://localhost:5173 으로 접속하여 대시보드를 사용할 수 있습니다.

## API 엔드포인트

### GET /subjects
사용 가능한 피험자 목록 조회

### GET /algorithms
지원되는 알고리즘 목록 및 기본 파라미터 조회

### POST /run
이상치 탐지 실행

**요청 예시:**
```json
{
  "subject_id": "S2",
  "algorithm": "ecod",
  "params": {
    "contamination": 0.05,
    "pca_components": 10,
    "win_s": 60,
    "step_s": 30,
    "evaluate": true
  }
}
```

**응답 예시:**
```json
{
  "subject_id": "S2",
  "algorithm": "ecod",
  "params": {...},
  "meta": {
    "win_s": 60,
    "step_s": 30,
    "n_windows": 260,
    "feature_dim": 19,
    "start_ts": 1495437325.0,
    "fs_ref": "EDA"
  },
  "times": [...],
  "scores": [...],
  "preds": [...],
  "threshold": 0.105,
  "labels": [...],
  "metrics": {
    "auroc": 0.6792,
    "auprc": 0.665,
    "f1": 0.4286
  }
}
```

## 데이터 파이프라인

1. **데이터 로드**: E4 센서 CSV 파일 로드 (ACC, EDA, TEMP, HR)
2. **윈도우 분할**: 60초 윈도우, 30초 스텝으로 분할
3. **특징 추출**:
   - EDA: mean, std, min, max, range, mean_deriv, n_peaks (7차원)
   - ACC: mean_mag, std_mag, mean_jerk, energy (4차원)
   - TEMP: mean, std, min, max (4차원)
   - HR: mean, std, min, max (4차원)
   - 총 19차원
4. **전처리**: StandardScaler + PCA (선택)
5. **모델 훈련**: 베이스라인 윈도우로 PyOD 모델 훈련
6. **예측**: 전체 윈도우에 대해 이상치 점수 및 예측 생성
7. **평가**: TSST(스트레스) 구간을 양성으로 간주하여 AUROC/AUPRC/F1 계산

## 특징

- **캐싱**: 특징 추출 결과를 캐싱하여 반복 실행 시 성능 향상
- **유연한 파라미터**: 윈도우 크기, 스텝, PCA 차원 등 조정 가능
- **반응형 UI**: Material-UI 기반 깔끔한 인터페이스
- **실시간 차트**: Recharts를 이용한 인터랙티브 시각화

## 기술 스택

### Backend
- FastAPI
- PyOD
- NumPy, Pandas
- Scikit-learn
- SciPy

### Frontend
- React + TypeScript
- Vite
- Material-UI
- Recharts
- Axios

## 라이선스

MIT

## 참고

- WESAD Dataset: [Schmidt et al., 2018]
- PyOD: Python Outlier Detection Library
