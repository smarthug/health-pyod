"""
PyOD 기반 이상치 탐지 모델 팩토리 및 실행
"""
from typing import Dict, Optional, Tuple
import numpy as np
from sklearn.preprocessing import StandardScaler
from sklearn.decomposition import PCA
from sklearn.metrics import roc_auc_score, average_precision_score, f1_score
from pyod.models.ecod import ECOD
from pyod.models.iforest import IForest
from pyod.models.knn import KNN


def make_detector(algorithm: str, params: Dict) -> object:
    """
    알고리즘 이름과 파라미터로 PyOD 탐지기 생성

    Args:
        algorithm: "ecod", "iforest", "knn"
        params: 알고리즘별 파라미터

    Returns:
        PyOD BaseDetector 객체
    """
    if algorithm == "ecod":
        # ECOD: Empirical Cumulative distribution based Outlier Detection
        contamination = params.get('contamination', 0.05)
        return ECOD(contamination=contamination)

    elif algorithm == "iforest":
        # Isolation Forest
        contamination = params.get('contamination', 0.05)
        n_estimators = params.get('n_estimators', 300)
        random_state = params.get('random_state', 42)
        return IForest(
            contamination=contamination,
            n_estimators=n_estimators,
            random_state=random_state
        )

    elif algorithm == "knn":
        # K-Nearest Neighbors
        contamination = params.get('contamination', 0.05)
        n_neighbors = params.get('n_neighbors', 15)
        method = params.get('method', 'largest')
        return KNN(
            contamination=contamination,
            n_neighbors=n_neighbors,
            method=method
        )

    else:
        raise ValueError(f"Unknown algorithm: {algorithm}")


def run_detector(
    detector: object,
    X_train: np.ndarray,
    X_all: np.ndarray,
    contamination: float = 0.05
) -> Dict:
    """
    PyOD 탐지기를 훈련하고 전체 데이터에 대해 예측

    Args:
        detector: PyOD 탐지기 객체
        X_train: 훈련 데이터 (베이스라인)
        X_all: 전체 데이터 (예측 대상)
        contamination: 오염률

    Returns:
        {
            "scores": 이상치 점수 배열 (높을수록 이상),
            "preds": 예측 배열 (0=정상, 1=이상),
            "threshold": 임계값
        }
    """
    # 훈련
    detector.fit(X_train)

    # 전체 데이터에 대해 예측
    scores = detector.decision_function(X_all)  # 높을수록 이상
    preds = detector.predict(X_all)  # 0=정상, 1=이상

    # 임계값 (contamination 기반)
    threshold = detector.threshold_

    return {
        "scores": scores,
        "preds": preds,
        "threshold": threshold
    }


def preprocess_features(
    X: np.ndarray,
    X_train_indices: Optional[np.ndarray] = None,
    pca_components: Optional[int] = 10
) -> Tuple[np.ndarray, StandardScaler, Optional[PCA]]:
    """
    특징 전처리: 스케일링 및 PCA (선택)

    Args:
        X: 전체 특징 행렬 [N x D]
        X_train_indices: 훈련 데이터 인덱스 (베이스라인)
        pca_components: PCA 차원 (None이면 PCA 사용 안함)

    Returns:
        (X_transformed, scaler, pca)
    """
    # StandardScaler 적합
    scaler = StandardScaler()
    if X_train_indices is not None:
        X_train = X[X_train_indices]
        scaler.fit(X_train)
    else:
        scaler.fit(X)

    # 전체 데이터 스케일링
    X_scaled = scaler.transform(X)

    # PCA (선택)
    pca = None
    if pca_components is not None and pca_components > 0:
        pca = PCA(n_components=min(pca_components, X_scaled.shape[1]))
        if X_train_indices is not None:
            X_train_scaled = X_scaled[X_train_indices]
            pca.fit(X_train_scaled)
        else:
            pca.fit(X_scaled)
        X_transformed = pca.transform(X_scaled)
    else:
        X_transformed = X_scaled

    return X_transformed, scaler, pca


def evaluate_predictions(
    labels: np.ndarray,
    scores: np.ndarray,
    preds: np.ndarray,
    eval_mask: Optional[np.ndarray] = None
) -> Dict[str, float]:
    """
    예측 결과 평가 (AUROC, AUPRC, F1)

    Args:
        labels: 실제 라벨 (0=정상, 1=이상으로 변환 필요)
        scores: 이상치 점수
        preds: 예측 (0=정상, 1=이상)
        eval_mask: 평가에 포함할 샘플 마스크 (선택)

    Returns:
        {"auroc": ..., "auprc": ..., "f1": ...}
    """
    # 라벨을 이진으로 변환: TSST(label==2) → 1, 나머지 → 0
    y_true = (labels == 2).astype(int)

    # 평가 마스크 적용
    if eval_mask is not None:
        y_true = y_true[eval_mask]
        scores = scores[eval_mask]
        preds = preds[eval_mask]

    # 양성 샘플이 없으면 평가 불가
    if np.sum(y_true) == 0:
        return {"auroc": 0.0, "auprc": 0.0, "f1": 0.0}

    # AUROC
    try:
        auroc = roc_auc_score(y_true, scores)
    except Exception:
        auroc = 0.0

    # AUPRC (Average Precision)
    try:
        auprc = average_precision_score(y_true, scores)
    except Exception:
        auprc = 0.0

    # F1 Score
    try:
        f1 = f1_score(y_true, preds)
    except Exception:
        f1 = 0.0

    return {
        "auroc": round(auroc, 4),
        "auprc": round(auprc, 4),
        "f1": round(f1, 4)
    }


def get_supported_algorithms() -> list:
    """
    지원되는 알고리즘 목록 및 기본 파라미터 반환

    Returns:
        [{"id": "ecod", "params": {...}}, ...]
    """
    return [
        {
            "id": "ecod",
            "name": "ECOD",
            "params": {}
        },
        {
            "id": "iforest",
            "name": "Isolation Forest",
            "params": {
                "n_estimators": 300,
                "contamination": 0.05,
                "random_state": 42
            }
        },
        {
            "id": "knn",
            "name": "K-Nearest Neighbors",
            "params": {
                "n_neighbors": 15,
                "contamination": 0.05,
                "method": "largest"
            }
        }
    ]
