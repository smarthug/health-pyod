"""
E4 센서 데이터로부터 특징 추출
EDA, ACC, TEMP, HR 센서별 특징 생성 및 캐싱
"""
import os
from typing import Tuple, Optional
import numpy as np
from scipy import stats
from scipy.signal import find_peaks
from data_loader import get_e4_dir, load_e4_series, window_indices, slice_by_time


def eda_feats(eda: np.ndarray, fs: float) -> np.ndarray:
    """
    EDA(피부 전기 활동) 특징 추출

    Args:
        eda: EDA 신호 (1D array)
        fs: 샘플링 레이트 (Hz)

    Returns:
        7차원 특징 벡터: [mean, std, min, max, range, mean_deriv, n_peaks]
    """
    if len(eda) == 0:
        return np.full(7, np.nan)

    # 기본 통계
    mean_val = np.mean(eda)
    std_val = np.std(eda)
    min_val = np.min(eda)
    max_val = np.max(eda)
    range_val = max_val - min_val

    # 미분 (변화율)
    if len(eda) > 1:
        deriv = np.diff(eda)
        mean_deriv = np.mean(np.abs(deriv))
    else:
        mean_deriv = 0.0

    # 피크 수 (SCR: Skin Conductance Response)
    # 높이 임계값은 평균 + 0.1 * 표준편차
    try:
        peaks, _ = find_peaks(eda, height=mean_val + 0.1 * std_val, distance=int(fs))
        n_peaks = len(peaks)
    except Exception:
        n_peaks = 0

    return np.array([mean_val, std_val, min_val, max_val, range_val, mean_deriv, n_peaks])


def acc_feats(acc: np.ndarray, fs: float) -> np.ndarray:
    """
    ACC(가속도계) 특징 추출

    Args:
        acc: ACC 신호 (Nx3 array: x, y, z)
        fs: 샘플링 레이트 (Hz)

    Returns:
        4차원 특징 벡터: [mean_mag, std_mag, mean_jerk, energy]
    """
    if len(acc) == 0 or acc.shape[1] != 3:
        return np.full(4, np.nan)

    # 가속도 크기 (magnitude)
    mag = np.sqrt(np.sum(acc ** 2, axis=1))

    # 평균 및 표준편차
    mean_mag = np.mean(mag)
    std_mag = np.std(mag)

    # Jerk (가속도의 변화율)
    if len(mag) > 1:
        jerk = np.diff(mag)
        mean_jerk = np.mean(np.abs(jerk))
    else:
        mean_jerk = 0.0

    # 에너지
    energy = np.sum(mag ** 2) / len(mag)

    return np.array([mean_mag, std_mag, mean_jerk, energy])


def temp_feats(temp: np.ndarray) -> np.ndarray:
    """
    TEMP(체온) 특징 추출

    Args:
        temp: TEMP 신호 (1D array)

    Returns:
        4차원 특징 벡터: [mean, std, min, max]
    """
    if len(temp) == 0:
        return np.full(4, np.nan)

    mean_val = np.mean(temp)
    std_val = np.std(temp)
    min_val = np.min(temp)
    max_val = np.max(temp)

    return np.array([mean_val, std_val, min_val, max_val])


def hr_feats(hr: np.ndarray) -> np.ndarray:
    """
    HR(심박수) 특징 추출

    Args:
        hr: HR 신호 (1D array)

    Returns:
        4차원 특징 벡터: [mean, std, min, max]
    """
    if len(hr) == 0:
        return np.full(4, np.nan)

    # 0 값 제거 (센서 오류)
    hr_valid = hr[hr > 0]
    if len(hr_valid) == 0:
        return np.full(4, np.nan)

    mean_val = np.mean(hr_valid)
    std_val = np.std(hr_valid)
    min_val = np.min(hr_valid)
    max_val = np.max(hr_valid)

    return np.array([mean_val, std_val, min_val, max_val])


def build_features(
    subject_id: str,
    win_s: float = 60,
    step_s: float = 30,
    use_cache: bool = True
) -> Tuple[np.ndarray, np.ndarray]:
    """
    피험자의 E4 데이터로부터 윈도우별 특징 행렬 생성

    Args:
        subject_id: 피험자 ID (예: "S2")
        win_s: 윈도우 크기 (초)
        step_s: 스텝 크기 (초)
        use_cache: 캐시 사용 여부

    Returns:
        (times, features)
        - times: 각 윈도우의 시작 타임스탬프 (epoch seconds) [N]
        - features: 특징 행렬 [N x 19]
          - EDA: 7, ACC: 4, TEMP: 4, HR: 4
    """
    # 캐시 확인
    cache_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'cache')
    os.makedirs(cache_dir, exist_ok=True)
    cache_file = os.path.join(cache_dir, f"{subject_id}_features_{int(win_s)}_{int(step_s)}.npz")

    if use_cache and os.path.exists(cache_file):
        data = np.load(cache_file)
        return data['times'], data['features']

    # E4 데이터 로드
    e4_dir = get_e4_dir(subject_id)

    eda_path = os.path.join(e4_dir, 'EDA.csv')
    acc_path = os.path.join(e4_dir, 'ACC.csv')
    temp_path = os.path.join(e4_dir, 'TEMP.csv')
    hr_path = os.path.join(e4_dir, 'HR.csv')

    # 각 센서 데이터 로드
    eda_ts, eda_fs, eda_data = load_e4_series(eda_path)
    acc_ts, acc_fs, acc_data = load_e4_series(acc_path)
    temp_ts, temp_fs, temp_data = load_e4_series(temp_path)
    hr_ts, hr_fs, hr_data = load_e4_series(hr_path)

    # EDA를 기준으로 윈도우 생성 (일반적으로 가장 긴 신호)
    win_indices = window_indices(len(eda_data), eda_fs, win_s, step_s)

    times = []
    feature_list = []

    for start_idx, end_idx in win_indices:
        # 윈도우 시작 시간
        t0 = eda_ts + start_idx / eda_fs
        times.append(t0)

        # 각 센서별 윈도우 슬라이싱
        eda_win = eda_data[start_idx:end_idx]
        acc_win = slice_by_time(acc_data, acc_fs, acc_ts, t0, win_s)
        temp_win = slice_by_time(temp_data, temp_fs, temp_ts, t0, win_s)
        hr_win = slice_by_time(hr_data, hr_fs, hr_ts, t0, win_s)

        # 특징 추출
        eda_f = eda_feats(eda_win, eda_fs)
        acc_f = acc_feats(acc_win, acc_fs)
        temp_f = temp_feats(temp_win)
        hr_f = hr_feats(hr_win)

        # 특징 결합 (총 19차원)
        feat_vec = np.concatenate([eda_f, acc_f, temp_f, hr_f])
        feature_list.append(feat_vec)

    times = np.array(times)
    features = np.array(feature_list)

    # NaN이 있는 행 제거 (센서 오류 등)
    valid_mask = ~np.isnan(features).any(axis=1)
    times = times[valid_mask]
    features = features[valid_mask]

    # 캐시 저장
    if use_cache:
        np.savez_compressed(cache_file, times=times, features=features)

    return times, features


def get_feature_names() -> list:
    """
    특징 이름 목록 반환

    Returns:
        19개 특징 이름 리스트
    """
    eda_names = ['eda_mean', 'eda_std', 'eda_min', 'eda_max', 'eda_range', 'eda_mean_deriv', 'eda_n_peaks']
    acc_names = ['acc_mean_mag', 'acc_std_mag', 'acc_mean_jerk', 'acc_energy']
    temp_names = ['temp_mean', 'temp_std', 'temp_min', 'temp_max']
    hr_names = ['hr_mean', 'hr_std', 'hr_min', 'hr_max']

    return eda_names + acc_names + temp_names + hr_names
