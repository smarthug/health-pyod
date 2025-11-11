"""
E4 센서 데이터 로더 및 윈도우 분할 기능
"""
import os
from typing import Tuple, List
import numpy as np
import pandas as pd


def load_e4_series(csv_path: str) -> Tuple[float, float, np.ndarray]:
    """
    E4 센서 CSV 파일을 로드합니다.

    Args:
        csv_path: CSV 파일 경로

    Returns:
        (start_timestamp, sampling_rate, data_array)
        - start_timestamp: 시작 타임스탬프 (epoch seconds)
        - sampling_rate: 샘플링 레이트 (Hz)
        - data_array: 데이터 배열 (1D for single channel, 2D for multi-channel like ACC)
    """
    df = pd.read_csv(csv_path, header=None)

    # 첫 번째 행: 타임스탬프
    if df.shape[1] == 1:
        # Single timestamp
        start_ts = float(df.iloc[0, 0])
    else:
        # Multiple columns (ACC has 3 timestamps)
        start_ts = float(df.iloc[0, 0])

    # 두 번째 행: 샘플링 레이트
    if df.shape[1] == 1:
        fs = float(df.iloc[1, 0])
    else:
        fs = float(df.iloc[1, 0])

    # 세 번째 행부터: 실제 데이터
    data = df.iloc[2:].values

    # 데이터 타입 변환
    if data.shape[1] == 1:
        # Single channel (EDA, TEMP, HR)
        data = data.flatten().astype(float)
    else:
        # Multi-channel (ACC: x, y, z)
        data = data.astype(float)

    return start_ts, fs, data


def window_indices(n: int, fs: float, win_s: float = 60, step_s: float = 30) -> List[Tuple[int, int]]:
    """
    시계열 데이터를 윈도우로 분할하기 위한 인덱스 생성

    Args:
        n: 데이터 포인트 수
        fs: 샘플링 레이트 (Hz)
        win_s: 윈도우 크기 (초)
        step_s: 스텝 크기 (초)

    Returns:
        [(start_idx, end_idx), ...] 리스트
    """
    win_samples = int(win_s * fs)
    step_samples = int(step_s * fs)

    indices = []
    start = 0
    while start + win_samples <= n:
        indices.append((start, start + win_samples))
        start += step_samples

    return indices


def slice_by_time(
    sig: np.ndarray,
    fs: float,
    start_ts: float,
    t0: float,
    win_s: float
) -> np.ndarray:
    """
    시간 기준으로 신호를 슬라이싱합니다.

    Args:
        sig: 신호 배열 (1D or 2D)
        fs: 샘플링 레이트 (Hz)
        start_ts: 신호 시작 타임스탬프
        t0: 슬라이스 시작 타임스탬프
        win_s: 윈도우 크기 (초)

    Returns:
        슬라이싱된 신호
    """
    # 시작 인덱스 계산
    offset = t0 - start_ts
    start_idx = int(offset * fs)
    end_idx = int((offset + win_s) * fs)

    # 범위 체크
    if sig.ndim == 1:
        n = len(sig)
    else:
        n = sig.shape[0]

    if start_idx < 0 or end_idx > n:
        # 범위를 벗어나면 빈 배열 반환
        if sig.ndim == 1:
            return np.array([])
        else:
            return np.array([]).reshape(0, sig.shape[1])

    # 슬라이싱
    if sig.ndim == 1:
        return sig[start_idx:end_idx]
    else:
        return sig[start_idx:end_idx, :]


def get_wesad_root() -> str:
    """
    WESAD 데이터 루트 경로 반환
    환경변수 WESAD_ROOT가 있으면 사용, 없으면 기본 경로 사용
    """
    wesad_root = os.environ.get('WESAD_ROOT')
    if wesad_root:
        return wesad_root

    # 기본 경로: backend/data/WESAD
    current_dir = os.path.dirname(os.path.abspath(__file__))
    return os.path.join(current_dir, 'data', 'WESAD')


def get_subject_dir(subject_id: str) -> str:
    """
    특정 피험자의 데이터 디렉토리 경로 반환

    Args:
        subject_id: 피험자 ID (예: "S2", "S3")

    Returns:
        피험자 디렉토리 경로
    """
    wesad_root = get_wesad_root()
    return os.path.join(wesad_root, subject_id)


def get_e4_dir(subject_id: str) -> str:
    """
    특정 피험자의 E4 데이터 디렉토리 경로 반환

    Args:
        subject_id: 피험자 ID (예: "S2", "S3")

    Returns:
        E4 데이터 디렉토리 경로
    """
    subj_dir = get_subject_dir(subject_id)
    return os.path.join(subj_dir, f"{subject_id}_E4_Data")


def list_subjects() -> List[str]:
    """
    사용 가능한 피험자 ID 목록 반환

    Returns:
        ["S2", "S3", ...] 형태의 리스트
    """
    wesad_root = get_wesad_root()

    if not os.path.exists(wesad_root):
        return []

    subjects = []
    for entry in os.listdir(wesad_root):
        entry_path = os.path.join(wesad_root, entry)
        if os.path.isdir(entry_path) and entry.startswith('S'):
            # E4 데이터 디렉토리가 있는지 확인
            e4_dir = os.path.join(entry_path, f"{entry}_E4_Data")
            if os.path.exists(e4_dir):
                subjects.append(entry)

    # 숫자 순으로 정렬
    subjects.sort(key=lambda x: int(x[1:]) if x[1:].isdigit() else 0)
    return subjects
