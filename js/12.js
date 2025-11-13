let totalFrames = 420;
let frames = new Array(totalFrames);
let capture;
let brightSmoothed = 128;

// 실측 밝기 범위
const bMin = 0;
const bMax = 120;

let W, H; // 동적으로 할당

function preload(){
  for (let i = 0; i < totalFrames; i++){
    frames[i] = loadImage(`images/frames12/${i+1}.jpg`);
  }
}

function setup(){
  pixelDensity(1);

  // visual-area의 실제 크기를 계산해서 캔버스 크기로 사용
  const container = document.getElementById('js-canvas-container');
  const rect = container.getBoundingClientRect();
  W = rect.width;
  H = rect.height;

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
  const step = 8;
  if (capture.pixels.length > 0){
    for (let y = 0; y < capture.height; y += step){
      for (let x = 0; x < capture.width; x += step){
        const idx = 4 * (x + y * capture.width);
        const r = capture.pixels[idx];
        const g = capture.pixels[idx + 1];
        const b = capture.pixels[idx + 2];
        const Y = 0.299*r + 0.587*g + 0.114*b;
        avg += Y; cnt++;
      }
    }
    avg = cnt ? avg / cnt : 0;
  }

  brightSmoothed = lerp(brightSmoothed, avg, 0.15);

  const bClamped = constrain(brightSmoothed, bMin, bMax);
  let frameIndex = Math.round(map(bClamped, bMin, bMax, totalFrames-1, 0));
  frameIndex = constrain(frameIndex, 0, totalFrames-1);

  // 비디오
  const img = frames[frameIndex];
  if (img) {
    const drawW = 500;
    const drawH = 600;

    // 가운데 정렬
    const offsetX = (width - drawW) / 2;
    const offsetY = (height - drawH) / 2;

    image(img, offsetX, offsetY, drawW, drawH);
  }

  // 디버그 텍스트
  // noStroke(); fill(255); textSize(14);
  // text(`avg: ${avg.toFixed(1)} sm: ${brightSmoothed.toFixed(1)}`, 10, 20);
}

// 창 크기 바뀌면 자동 리사이즈
function windowResized(){
  const container = document.getElementById('js-canvas-container');
  const rect = container.getBoundingClientRect();
  resizeCanvas(rect.width, rect.height);
  capture.size(rect.width, rect.height);
}
