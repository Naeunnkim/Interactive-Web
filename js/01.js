let totalFrames = 420;
let frames = new Array(totalFrames);
let capture;

// [수정] 차이값을 부드럽게 만들기 위한 변수 (초기값 0)
let brightSmoothed = 0; 

// [수정] 배경 밝기를 기억할 변수 (전역 변수로 이동!)
let backgroundAvg = -1; 

// [중요] 감도 설정 (이 숫자가 작을수록 반응이 빨라짐)
// 20: 작은 그림자에도 반응 / 50: 큰 그림자에만 반응
const sensitivity = 20; 

let W, H; 

function preload(){
  for (let i = 0; i < totalFrames; i++){
    frames[i] = loadImage(`images/frames01/${i+1}.jpg`); 
  }
}

function setup(){
  pixelDensity(1);
  const container = document.getElementById('js-canvas-container');
  W = container.clientWidth;
  H = container.clientHeight;

  const cnv = createCanvas(W, H);
  cnv.parent('js-canvas-container');

  capture = createCapture({
    audio: false,
    video: { width: 320, height: 240, frameRate: 30 } // [성능팁] 분석용 해상도는 낮춤
  }, () => console.log('camera ready'));
  capture.size(320, 240); // 캡처 크기도 작게 고정
  capture.hide();

  frameRate(24);
  imageMode(CORNER);
}

function draw(){
  background(0);

  // 1. 카메라 픽셀 읽기
  capture.loadPixels();
  let avg = 0, cnt = 0;
  const step = 4; // [성능팁] 해상도를 낮췄으므로 step을 조금 더 촘촘하게(4) 해도 됨

  if (capture.pixels.length > 0){
    for (let y = 0; y < capture.height; y += step){
      for (let x = 0; x < capture.width; x += step){
        const idx = 4 * (x + y * capture.width);
        const r = capture.pixels[idx];
        const g = capture.pixels[idx + 1];
        const b = capture.pixels[idx + 2];
        // 흑백 밝기(Luma) 계산
        const Y = 0.299*r + 0.587*g + 0.114*b;
        avg += Y; cnt++;
      }
    }
    avg = cnt ? avg / cnt : 0;
  }

  // 2. 배경 밝기 학습 (첫 프레임 혹은 천천히 적응)
  if (backgroundAvg === -1) {
    backgroundAvg = avg; // 초기화
  } else {
    // 배경값이 서서히 현재 밝기를 따라감 (조명 변화 대응)
    backgroundAvg = lerp(backgroundAvg, avg, 0.05);
  }

  // 3. 차이 계산 (배경 - 현재)
  // 값이 양수(+)면: 평소보다 어두워짐 (그림자/사람이 가림)
  // 값이 음수(-)면: 평소보다 밝아짐
  let diff = backgroundAvg - avg; 

  // 노이즈 제거: 아주 작은 변화(2 미만)는 무시
  if (diff < 2) diff = 0;

  // 4. 움직임 부드럽게 (Smoothing)
  brightSmoothed = lerp(brightSmoothed, diff, 0.15);

  // 5. 프레임 매핑 (핵심 수정 구간)
  // 차이(diff)가 0이면 -> 0번 프레임
  // 차이(diff)가 sensitivity(20) 이상이면 -> 끝 번호 프레임
  let frameIndex = map(brightSmoothed, 0, sensitivity, 0, totalFrames - 1);
  
  // 범위 벗어나지 않게 고정
  frameIndex = constrain(frameIndex, 0, totalFrames - 1);
  
  // 정수로 변환
  frameIndex = Math.floor(frameIndex);


  // --- 여기서부터 이미지는 그리는 영역 (이전과 동일) ---
  const img = frames[frameIndex];
  if (img) {
    let drawW, drawH;
    let scale = height / img.height;
    drawH = height;
    drawW = img.width * scale;

    if (drawW > width) {
      scale = width / img.width;
      drawW = width;
      drawH = img.height * scale;
    }

    const offsetX = (width - drawW) / 2;
    const offsetY = (height - drawH) / 2;

    image(img, offsetX, offsetY, drawW, drawH);
  }

  // [디버깅용] 수치 확인이 필요하면 주석 해제하세요
  // fill(255); textSize(16);
  // text(`Diff: ${diff.toFixed(1)} / Index: ${frameIndex}`, 10, 30);
}

function windowResized(){
  const container = document.getElementById('js-canvas-container');
  if (!container) return;
  W = Math.max(50, container.clientWidth);
  H = Math.max(50, container.clientHeight);
  resizeCanvas(W, H);
  // 캡처 크기는 리사이즈 하지 않고 작게 유지(320x240)하는 것이 성능에 좋음
}