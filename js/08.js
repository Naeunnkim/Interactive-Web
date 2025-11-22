let totalFrames = 420;
let frames = new Array(totalFrames);
let capture;
let brightSmoothed = 128;

// 손을 "가까이" / "멀리" 둘 때의 실측 밝기 값
const bNear = 100;  // 손을 센서 앞에 근접하게 둘 때 avg 밝기
const bFar  = 130;  // 손을 멀리 치웠을 때 avg 밝기

let W, H; // 동적으로 할당

function preload(){
  for (let i = 0; i < totalFrames; i++){
    frames[i] = loadImage(`images/frames08/${i+1}.jpg`);
  }
}

function setup(){
  pixelDensity(1);

  // visual-area의 실제 크기를 계산해서 캔버스 크기로 사용
  const container = document.getElementById('js-canvas-container');
  W = container.clientWidth;
  H = container.clientHeight;

  const cnv = createCanvas(W, H);
  cnv.parent('js-canvas-container');

  // 카메라 설정
  capture = createCapture({
    audio: false,
    video: { width: W, height: H, frameRate: 30 }
  }, () => console.log('camera ready'));
  capture.size(W, H);
  capture.hide();

  frameRate(24);
  imageMode(CORNER);
}

function draw(){
  background(0);

  // 평균 밝기 계산
  capture.loadPixels();
  let avg = 0, cnt = 0;
  const step = 2;
  if (capture.pixels.length > 0){
    for (let y = 0; y < capture.height; y += step){
      for (let x = 0; x < capture.width; x += step){
        const idx = 4 * (x + y * capture.width);
        const r = capture.pixels[idx];
        const g = capture.pixels[idx + 1];
        const b = capture.pixels[idx + 2];
        const Y = 0.299*r + 0.587*g + 0.114*b;
        avg += Y;
        cnt++;
      }
    }
    avg = cnt ? avg / cnt : 0;
  }

  // 부드럽게 따라가도록 스무딩
  brightSmoothed = lerp(brightSmoothed, avg, 0.0777777); // 0.15  !!!!!!

  // 내가 측정한 범위(bNear ~ bFar) 안으로 자르기
  const bClamped = constrain(brightSmoothed, bNear, bFar);

  // bNear(손 가까이) → frameIndex = 0 (1.jpg)
  // bFar(손 멀리)   → frameIndex = totalFrames-1 (420.jpg)
  let frameIndex = Math.round(
    map(bClamped, bFar, bNear, 0, totalFrames - 1)
  );
  frameIndex = constrain(frameIndex, 0, totalFrames - 1);

  // 비디오 프레임 그리기
  const img = frames[frameIndex];
  if (img) {
    let drawW, drawH;

    // 세로(height)에 먼저 맞추기
    let scale = height / img.height;
    drawH = height;
    drawW = img.width * scale;

    // 가로를 넘치면, 가로 기준으로 다시 스케일
    if (drawW > width) {
      scale = width / img.width;
      drawW = width;
      drawH = img.height * scale;
    }

    const offsetX = (width - drawW) / 2;
    const offsetY = (height - drawH) / 2;

    image(img, offsetX, offsetY, drawW, drawH);
  }

  // 디버그 보고 싶으면 주석 해제
  /*
  noStroke();
  fill(255);
  textSize(14);
  text(`avg: ${avg.toFixed(1)}  sm: ${brightSmoothed.toFixed(1)}  idx: ${frameIndex}`, 10, 20);
  */
}

// 창 크기 바뀌면 자동 리사이즈
function windowResized(){
  const container = document.getElementById('js-canvas-container');
  if (!container) return;

  W = Math.max(50, container.clientWidth);
  H = Math.max(50, container.clientHeight);

  resizeCanvas(W, H);
  if (capture) {
    capture.size(W, H);
  }
}