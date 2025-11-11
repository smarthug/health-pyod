"""
FastAPI 메인 애플리케이션
WESAD PyOD 대시보드 백엔드
"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import numpy as np
from typing import Dict, Any

from schemas import (
    RunRequest, RunResponse, SubjectsResponse,
    AlgorithmsResponse, AlgorithmInfo, ErrorResponse
)
from data_loader import list_subjects
from features import build_features
from labeling import label_windows_from_quest, get_baseline_mask, get_evaluation_mask
from models import (
    make_detector, run_detector, preprocess_features,
    evaluate_predictions, get_supported_algorithms
)

# FastAPI 앱 생성
app = FastAPI(
    title="WESAD PyOD API",
    description="WESAD 데이터셋 기반 이상치 탐지 API",
    version="1.0.0"
)

# CORS 설정 (프론트엔드 연결)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 프로덕션에서는 특정 도메인으로 제한
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    """루트 엔드포인트"""
    return {
        "message": "WESAD PyOD API",
        "version": "1.0.0",
        "endpoints": {
            "GET /subjects": "피험자 목록 조회",
            "GET /algorithms": "알고리즘 목록 조회",
            "POST /run": "이상치 탐지 실행"
        }
    }


@app.get("/subjects", response_model=SubjectsResponse)
async def get_subjects():
    """
    사용 가능한 피험자 ID 목록 반환
    """
    subjects = list_subjects()
    return SubjectsResponse(subjects=subjects)


@app.get("/algorithms", response_model=AlgorithmsResponse)
async def get_algorithms():
    """
    지원되는 알고리즘 목록 및 기본 파라미터 반환
    """
    algorithms = get_supported_algorithms()
    algo_infos = [AlgorithmInfo(**algo) for algo in algorithms]
    return AlgorithmsResponse(algorithms=algo_infos)


@app.post("/run", response_model=RunResponse)
async def run_anomaly_detection(request: RunRequest):
    """
    이상치 탐지 실행

    1. 피험자의 E4 데이터 로드 및 특징 추출
    2. 라벨 로드 (quest 파일)
    3. 전처리 (스케일링, PCA)
    4. PyOD 모델 훈련 (베이스라인 데이터)
    5. 전체 데이터에 대해 예측
    6. 평가 지표 계산 (라벨이 있는 경우)
    """
    subject_id = request.subject_id
    algorithm = request.algorithm
    params = request.params or {}

    # 파라미터 추출 및 기본값 설정
    contamination = params.get('contamination', 0.05)
    win_s = params.get('win_s', 60)
    step_s = params.get('step_s', 30)
    pca_components = params.get('pca_components', 10)
    random_state = params.get('random_state', 42)
    evaluate = params.get('evaluate', True)

    # 피험자 확인
    subjects = list_subjects()
    if subject_id not in subjects:
        raise HTTPException(
            status_code=404,
            detail=f"Subject {subject_id} not found. Available: {subjects}"
        )

    # 알고리즘 확인
    supported_algos = [a['id'] for a in get_supported_algorithms()]
    if algorithm not in supported_algos:
        raise HTTPException(
            status_code=400,
            detail=f"Unknown algorithm: {algorithm}. Supported: {supported_algos}"
        )

    try:
        # 1. 특징 추출
        times, features = build_features(subject_id, win_s=win_s, step_s=step_s)

        if len(times) == 0:
            raise HTTPException(
                status_code=500,
                detail=f"No valid windows extracted for subject {subject_id}"
            )

        # 2. 라벨 로드
        labels = label_windows_from_quest(times, subject_id, win_s=win_s)

        # 3. 전처리
        if labels is not None:
            # 베이스라인 윈도우로 스케일러/PCA 적합
            baseline_mask = get_baseline_mask(labels)
            baseline_indices = np.where(baseline_mask)[0]

            if len(baseline_indices) == 0:
                # 베이스라인이 없으면 전체 데이터로 적합
                baseline_indices = None
        else:
            baseline_indices = None

        X_transformed, scaler, pca = preprocess_features(
            features,
            X_train_indices=baseline_indices,
            pca_components=pca_components
        )

        # 4. PyOD 모델 생성 및 실행
        detector_params = {
            'contamination': contamination,
            'random_state': random_state
        }
        if algorithm == 'iforest':
            detector_params['n_estimators'] = params.get('n_estimators', 300)
        elif algorithm == 'knn':
            detector_params['n_neighbors'] = params.get('n_neighbors', 15)
            detector_params['method'] = params.get('method', 'largest')

        detector = make_detector(algorithm, detector_params)

        # 훈련 데이터
        if baseline_indices is not None and len(baseline_indices) > 0:
            X_train = X_transformed[baseline_indices]
        else:
            # 베이스라인이 없으면 전체 데이터로 훈련
            X_train = X_transformed

        # 예측
        result = run_detector(detector, X_train, X_transformed, contamination)

        scores = result['scores']
        preds = result['preds']
        threshold = result['threshold']

        # 5. 평가 지표 계산
        metrics = None
        if labels is not None and evaluate:
            eval_mask = get_evaluation_mask(labels)
            if np.sum(eval_mask) > 0:
                metrics = evaluate_predictions(labels, scores, preds, eval_mask)

        # 6. 응답 생성
        response = RunResponse(
            subject_id=subject_id,
            algorithm=algorithm,
            params={
                'contamination': contamination,
                'win_s': win_s,
                'step_s': step_s,
                'pca_components': pca_components,
                'random_state': random_state,
                **detector_params
            },
            meta={
                'win_s': win_s,
                'step_s': step_s,
                'n_windows': len(times),
                'feature_dim': features.shape[1],
                'start_ts': float(times[0]),
                'fs_ref': 'EDA'
            },
            times=times.tolist(),
            scores=scores.tolist(),
            preds=preds.tolist(),
            threshold=float(threshold),
            labels=labels.tolist() if labels is not None else None,
            metrics=metrics
        )

        return response

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error during anomaly detection: {str(e)}"
        )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
