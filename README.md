# Poison Garden

브라우저의 카메라 밝기 입력으로 장면의 프레임을 전환하는 인터랙티브 졸업작품 구현입니다. 검은 전시 공간을 닮은 갤러리에서 18개의 식물 표본을 선택하면, 표본별 설명 이미지와 프레임 시퀀스 기반 인터랙션을 확인할 수 있습니다.

<p align="center">
  <img src="images/designsources/logo.png" alt="Poison Garden" width="420" />
</p>

## Project at a glance

- **Experience**: 18개의 식물 표본 갤러리 → 표본별 상세 화면
- **Input**: p5.js `createCapture()`로 받은 카메라 영상의 평균 밝기
- **Output**: 밝기 변화에 맞춘 최대 420장 프레임 시퀀스 탐색
- **Visual system**: 투명 프레임 PNG, 식물 원본/bitmap hover 상태, 표본 설명 패널
- **Runtime**: 별도 빌드 도구 없이 정적 HTML/CSS/JavaScript로 실행


## Try it locally

카메라 권한은 `localhost` 또는 HTTPS 환경에서만 동작할 수 있습니다.

```bash
python3 -m http.server 4173
```

브라우저에서 [http://localhost:4173](http://localhost:4173)을 열고 식물 표본을 선택합니다. 상세 화면에서 카메라 권한을 허용하면 밝기 변화에 따라 장면이 전환됩니다. 카메라를 사용할 수 없는 환경에서도 `←`/`→`, `Home`, `End` 키로 프레임을 탐색할 수 있습니다.

## Implementation notes

상세 페이지는 공통 엔진 [`js/interactive-frame.js`](js/interactive-frame.js)를 사용하고, 표본별 설정은 [`js/01.js`](js/01.js)부터 [`js/18.js`](js/18.js)까지의 작은 설정 파일로 분리합니다.

1. `preload()`가 표본별 JPEG 프레임을 준비합니다.
2. `setup()`이 p5 캔버스와 카메라 입력을 연결합니다.
3. `draw()`가 영상의 평균 밝기를 계산하고, 스무딩·범위 제한·프레임 매핑을 적용합니다.
4. 카메라 입력이 없으면 첫 프레임을 유지하고, 키보드 입력으로 수동 탐색할 수 있습니다.



## Repository map

```text
index.html                 # 18개 표본 갤러리 진입점
detail01.html ... 18.html  # 표본별 상세 화면
js/interactive-frame.js    # 공통 카메라 → 밝기 → 프레임 엔진
js/01.js ... 18.js         # 표본별 프레임 세트와 튜닝 설정
images/plant/              # 갤러리용 식물 이미지
images/plant_bitmap/       # hover 상태용 bitmap 이미지
images/frames01 ... 18/    # 인터랙션 프레임 시퀀스
images/descriptions/       # 상세 설명 패널
images/designsources/      # 프레임, 로고, 폰트 등 디자인 소스
scripts/check-project.mjs  # 로컬 경로·프레임·페이지 계약 검사
```



## Validation

```bash
node scripts/check-project.mjs
for file in js/*.js; do node --check "$file"; done
git diff --check
```

GitHub Actions에서도 경로와 프레임 계약 검사를 실행합니다. 이 프로젝트는 p5.js 1.9.1을 CDN에서 불러오므로, 최초 로딩 시 네트워크 연결이 필요합니다.

## Asset and license note

프레임 시퀀스는 표본별로 대량의 JPEG를 포함하므로 저장소 용량이 큽니다. 이미지와 폰트의 공개 배포 권한 및 라이선스는 원 제작 자료의 권리 범위를 확인한 후 별도로 명시해야 하며, 현재 이 레포에는 라이선스를 임의로 추가하지 않았습니다.
