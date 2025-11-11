"""
Quest CSV 파일로부터 라벨 추출 및 윈도우 매핑
라벨: 0=기타/전이, 1=Baseline, 2=TSST, 3=Fun, 4=Meditation
"""
import os
from typing import Optional, Dict, Tuple
import numpy as np
import pandas as pd
from data_loader import get_subject_dir


def parse_quest_csv(quest_path: str) -> Optional[Dict[str, Tuple[float, float]]]:
    """
    Quest CSV 파일을 파싱하여 각 상태의 시작/종료 시간 추출

    Args:
        quest_path: quest.csv 파일 경로

    Returns:
        {"Base": (start, end), "TSST": (start, end), ...} 형태의 딕셔너리
        파싱 실패시 None
    """
    if not os.path.exists(quest_path):
        return None

    try:
        # 파일을 라인별로 읽기
        with open(quest_path, 'r') as f:
            lines = f.readlines()

        # ORDER, START, END 라인 찾기
        order_line = None
        start_line = None
        end_line = None

        for line in lines:
            line = line.strip()
            if line.startswith('# ORDER'):
                order_line = line
            elif line.startswith('# START'):
                start_line = line
            elif line.startswith('# END'):
                end_line = line

        if not (order_line and start_line and end_line):
            return None

        # 세미콜론으로 분할
        order_parts = [p.strip() for p in order_line.split(';') if p.strip()]
        start_parts = [p.strip() for p in start_line.split(';') if p.strip()]
        end_parts = [p.strip() for p in end_line.split(';') if p.strip()]

        # 첫 번째는 헤더이므로 제외
        order_names = order_parts[1:]
        start_times = start_parts[1:]
        end_times = end_parts[1:]

        # 길이가 맞지 않으면 실패
        if not (len(order_names) == len(start_times) == len(end_times)):
            return None

        # 딕셔너리 생성
        timeline = {}
        for name, start_str, end_str in zip(order_names, start_times, end_times):
            try:
                start_min = float(start_str)
                end_min = float(end_str)
                # 분을 초로 변환
                timeline[name] = (start_min * 60, end_min * 60)
            except ValueError:
                continue

        return timeline

    except Exception as e:
        # 파싱 실패
        return None


def label_windows_from_quest(
    times: np.ndarray,
    subject_id: str,
    win_s: float = 60
) -> Optional[np.ndarray]:
    """
    Quest 파일을 기반으로 각 윈도우에 라벨 할당

    Args:
        times: 각 윈도우의 시작 타임스탬프 (epoch seconds)
        subject_id: 피험자 ID (예: "S2")
        win_s: 윈도우 크기 (초)

    Returns:
        라벨 배열 [N] (0=기타/전이, 1=Baseline, 2=TSST, 3=Fun, 4=Meditation)
        파싱 실패시 None
    """
    # Quest 파일 경로
    subj_dir = get_subject_dir(subject_id)
    quest_path = os.path.join(subj_dir, f"{subject_id}_quest.csv")

    # Quest 파싱
    timeline = parse_quest_csv(quest_path)
    if timeline is None:
        return None

    # 시작 타임스탬프 (첫 번째 윈도우)
    start_ts = times[0]

    # 라벨 매핑 (상태 이름 → 라벨 ID)
    # Base, TSST, Fun, Medi 1/2 등을 매핑
    label_map = {
        'Base': 1,
        'TSST': 2,
        'Fun': 3,
        'Medi 1': 4,
        'Medi 2': 4,
        'Meditation': 4,
    }

    # 각 윈도우에 대한 라벨 할당
    labels = np.zeros(len(times), dtype=int)

    for i, t in enumerate(times):
        # 윈도우의 상대 시간 (초)
        rel_time = t - start_ts
        win_center = rel_time + win_s / 2

        # 어떤 상태에 속하는지 확인
        assigned = False
        for state_name, (state_start, state_end) in timeline.items():
            if state_start <= win_center < state_end:
                # 상태 이름에서 라벨 ID 찾기
                label_id = 0
                for key, val in label_map.items():
                    if key in state_name:
                        label_id = val
                        break
                labels[i] = label_id
                assigned = True
                break

        # 할당되지 않으면 0 (기타/전이)
        if not assigned:
            labels[i] = 0

    return labels


def get_baseline_mask(labels: np.ndarray) -> np.ndarray:
    """
    베이스라인 윈도우 마스크 반환

    Args:
        labels: 라벨 배열

    Returns:
        베이스라인(label==1) 마스크 (bool array)
    """
    return labels == 1


def get_stress_mask(labels: np.ndarray) -> np.ndarray:
    """
    스트레스(TSST) 윈도우 마스크 반환

    Args:
        labels: 라벨 배열

    Returns:
        스트레스(label==2) 마스크 (bool array)
    """
    return labels == 2


def get_evaluation_mask(labels: np.ndarray) -> np.ndarray:
    """
    평가에 사용할 윈도우 마스크 반환
    베이스라인 또는 스트레스만 포함 (전이 구간 제외)

    Args:
        labels: 라벨 배열

    Returns:
        평가용 마스크 (bool array)
    """
    return (labels == 1) | (labels == 2)
