# WESAD 데이터셋 소개와 사용 가이드

이 문서는 본 프로젝트에서 활용한 WESAD(Wearable Stress and Affect Detection) 데이터셋을 비전공자도 쉽게 설명할 수 있도록 정리한 안내서입니다.

---

## 1) 한 줄 요약
- 사람에게 손목 밴드와 가슴 밴드를 착용시켜, 평온/스트레스/유쾌/명상 상태의 생체 신호를 기록해 둔 공개 데이터셋입니다.

---

## 2) 무엇을 측정하나요? (이 프로젝트에서 쓰는 부분)
- 손목형 Empatica E4 센서의 신호를 사용합니다.
  - ACC: 손목 가속도(활동량) — 대략 32 Hz
  - EDA: 피부전도(땀샘 반응) — 대략 4 Hz
  - TEMP: 피부 온도 — 대략 4 Hz
  - HR: 심박수(초당 1회 수준, E4 내부 계산값)
- 본 프로젝트는 위 4개 신호를 창(window) 단위로 요약(특징 추출)하여 이상(평소와 다른 순간)을 찾습니다.

---

## 3) 실험 프로토콜(간단히)
- 한 명의 참가자가 다음 상태를 순서대로 수행하며 데이터를 측정합니다.
  1) Baseline(휴식)
  2) TSST(사회적 스트레스 유발 과제) — 스트레스 상태
  3) Amusement(유쾌한 동영상 시청 등)
  4) Meditation(명상/안정)
- 각 상태의 정확한 시간 구간이 제공되어, 해당 구간에 라벨을 붙일 수 있습니다.

---

## 4) 데이터 폴더 구조(이 저장소 기준)
- 경로: `backend/data/WESAD`
- 예시: `S2`, `S3` 같은 피험자 폴더 안에 `S*_E4_Data`가 있고, 그 안에 센서 CSV가 있습니다.
  - `ACC.csv` (가속도)
  - `EDA.csv` (피부전도)
  - `TEMP.csv` (온도)
  - `HR.csv` (심박)
- 각 CSV는 E4 형식에 따라 첫 행(시작 타임스탬프), 둘째 행(샘플링 레이트), 셋째 행부터가 실제 데이터입니다.

---

## 5) 이 프로젝트에서의 활용 방식(요약)
- 윈도우 분할: 기본 60초 윈도우, 30초 간격으로 슬라이딩
- 특징 추출(총 19차원)
  - EDA 7개: mean, std, min, max, range, mean_deriv, n_peaks
  - ACC 4개: mean_mag, std_mag, mean_jerk, energy
  - TEMP 4개: mean, std, min, max
  - HR 4개: mean, std, min, max
- 전처리: StandardScaler, 필요시 PCA(예: 10차원)
- 라벨 매핑(윈도우 단위)
  - 0: 기타/전이(Transition)
  - 1: Baseline(휴식)
  - 2: Stress(TSST)
  - 3: Amusement(유쾌)
  - 4: Meditation(명상)
- 평가 시 사용 구간: Baseline(1)과 Stress(2) 중심으로 AUROC/AUPRC/F1을 계산합니다.

---

## 6) 무엇을 할 수 있나요?
- 이상 탐지: 센서 신호의 요약 특성에서 “평소와 다른 구간”을 자동 탐지합니다.
- 스트레스 구간 점검: 스트레스(TSST) 구간이 높은 이상 점수로 나타나는지 확인할 수 있습니다.

---

## 7) 주의와 한계
- 이상 ≠ 스트레스: ‘평소와 다름’을 찾는 도구라, 운동/센서 잡음도 이상으로 나올 수 있습니다.
- 개인 차이 큼: 생리 신호는 사람마다 다르고 하루 컨디션도 영향을 줍니다.
- 실험 맥락: WESAD는 통제된 실험 데이터이며, 일상생활 전반을 완전히 대표하지는 않습니다.
- 데이터 품질: 착용 불량, 누락, 센서 드리프트 등으로 일부 구간 품질이 떨어질 수 있습니다.

---

## 8) 인용 및 라이선스(요약)
- 원문: “WESAD: A Multimodal Dataset for Wearable Stress and Affect Detection”, Schmidt et al., 2018 (ACM ICMI)
- 사용 시 논문/저자 표기를 권장합니다.

예시 인용:
- Schmidt, P., Reiss, A., Duerichen, R., Laerhoven, K.V., and Pl{"o}tz, T. WESAD: A Multimodal Dataset for Wearable Stress and Affect Detection. Proceedings of ICMI, 2018.

---

## 9) 발표 팁(비전공자용)
- 한 문장: “손목 밴드 신호로 평온/스트레스 등 상태를 기록한 공개 데이터입니다.”
- 핵심 포인트 세 가지
  - 다양한 생체 신호를 동시에 제공(가속도, 피부전도, 온도, 심박)
  - 상태 라벨이 있어 ‘언제 스트레스였는지’를 확인 가능
  - 우리 도구는 이 신호로 ‘평소와 다른 순간’을 자동으로 찾아줌

---

## 10) 자주 받는 질문
- Q. 실험 말고 실제 환경에서도 쓰이나요?
  - A. 연구·프로토타입 단계에서는 유용합니다. 실제 서비스 적용 시 더 다양한 상황 데이터가 필요합니다.
- Q. 스트레스만 구분하나요?
  - A. 라벨은 여러 상태가 있지만, 프로젝트 평가는 주로 Baseline vs TSST로 비교합니다.
- Q. 어떤 센서를 꼭 써야 하나요?
  - A. 여기서는 E4 신호(ACC/EDA/TEMP/HR)를 이용했습니다. 다른 기기로 확장 가능하나 전처리/특징이 달라질 수 있습니다.

---

부가 참고: `backend/data_loader.py`, `backend/features.py`, `backend/labeling.py` 파일에서 데이터 읽기, 특징 추출, 라벨 매핑 로직을 확인할 수 있습니다.
