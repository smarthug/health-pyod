"""
FastAPI 요청/응답 스키마 정의 (Pydantic)
"""
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field


class RunRequest(BaseModel):
    """POST /run 요청 스키마"""
    subject_id: str = Field(..., description="피험자 ID (예: S2, S3)")
    algorithm: str = Field(..., description="알고리즘 (ecod, iforest, knn)")
    params: Optional[Dict[str, Any]] = Field(
        default=None,
        description="알고리즘 파라미터 (contamination, n_estimators, n_neighbors, pca_components, win_s, step_s, random_state, evaluate)"
    )

    class Config:
        json_schema_extra = {
            "example": {
                "subject_id": "S2",
                "algorithm": "iforest",
                "params": {
                    "contamination": 0.05,
                    "n_estimators": 300,
                    "pca_components": 10,
                    "win_s": 60,
                    "step_s": 30,
                    "evaluate": True
                }
            }
        }


class RunResponse(BaseModel):
    """POST /run 응답 스키마"""
    subject_id: str = Field(..., description="피험자 ID")
    algorithm: str = Field(..., description="사용된 알고리즘")
    params: Dict[str, Any] = Field(..., description="실제 사용된 파라미터")
    meta: Dict[str, Any] = Field(
        ...,
        description="메타데이터 (win_s, step_s, n_windows, feature_dim, start_ts, fs_ref)"
    )
    times: List[float] = Field(..., description="각 윈도우의 시작 타임스탬프 (epoch seconds)")
    scores: List[float] = Field(..., description="이상치 점수 (높을수록 이상)")
    preds: List[int] = Field(..., description="예측 (0=정상, 1=이상)")
    threshold: float = Field(..., description="임계값")
    labels: Optional[List[int]] = Field(
        None,
        description="라벨 (0=기타, 1=Baseline, 2=TSST, 3=Fun, 4=Meditation)"
    )
    metrics: Optional[Dict[str, float]] = Field(
        None,
        description="평가 지표 (auroc, auprc, f1)"
    )

    class Config:
        json_schema_extra = {
            "example": {
                "subject_id": "S2",
                "algorithm": "iforest",
                "params": {
                    "contamination": 0.05,
                    "n_estimators": 300,
                    "pca_components": 10,
                    "win_s": 60,
                    "step_s": 30
                },
                "meta": {
                    "win_s": 60,
                    "step_s": 30,
                    "n_windows": 512,
                    "feature_dim": 19,
                    "start_ts": 1495437325.0,
                    "fs_ref": "EDA"
                },
                "times": [1495437325.0, 1495437385.0],
                "scores": [0.12, 0.08],
                "preds": [0, 0],
                "threshold": 0.105,
                "labels": [1, 1],
                "metrics": {
                    "auroc": 0.86,
                    "auprc": 0.71,
                    "f1": 0.68
                }
            }
        }


class SubjectsResponse(BaseModel):
    """GET /subjects 응답 스키마"""
    subjects: List[str] = Field(..., description="사용 가능한 피험자 ID 목록")

    class Config:
        json_schema_extra = {
            "example": {
                "subjects": ["S2", "S3", "S4", "S5"]
            }
        }


class AlgorithmInfo(BaseModel):
    """알고리즘 정보"""
    id: str = Field(..., description="알고리즘 ID")
    name: str = Field(..., description="알고리즘 이름")
    params: Dict[str, Any] = Field(..., description="기본 파라미터")


class AlgorithmsResponse(BaseModel):
    """GET /algorithms 응답 스키마"""
    algorithms: List[AlgorithmInfo] = Field(..., description="지원되는 알고리즘 목록")

    class Config:
        json_schema_extra = {
            "example": {
                "algorithms": [
                    {"id": "ecod", "name": "ECOD", "params": {}},
                    {"id": "iforest", "name": "Isolation Forest", "params": {"n_estimators": 300}},
                    {"id": "knn", "name": "K-Nearest Neighbors", "params": {"n_neighbors": 15}}
                ]
            }
        }


class ErrorResponse(BaseModel):
    """에러 응답 스키마"""
    detail: str = Field(..., description="에러 메시지")

    class Config:
        json_schema_extra = {
            "example": {
                "detail": "Subject S99 not found"
            }
        }
