let totalFrames = 420;
let frames = new Array(totalFrames);
let capture;
let brightSmoothed = 128;

// 실측 범위(현장에서 조절)
const bMin = 0;    // 어두운쪽 하한
const bMax = 120;  // 밝은쪽 상한(실제 밝기 최대가 이 근처라 했음)
const W = 400, H = 500;

function preload(){
  for(let i=0;i<totalFrames;i++){
    frames[i] = loadImage(`assets/${i+1}.jpg`);
  }
}

function setup(){
  pixelDensity(1);
  createCanvas(W, H);
  canvas.parent('js18-canvas-container');

  // HTTPS 또는 localhost에서만 카메라 허용됨 (브라우저 보안)
  capture = createCapture({
    audio: false,
    video: { width: W, height: H, frameRate: 30 }
  }, () => console.log('camera ready'));
  capture.size(W, H);
  capture.hide(); // DOM 비디오 엘리먼트를 숨김
  frameRate(24);
}

function draw(){
  background(0);

  // 필요 시 미리보기
  // image(capture, 0, 0, width, height);

  // 평균 밝기(샘플링) 계산
  let step = 8;
  capture.loadPixels();
  let avg = 0, cnt = 0;
  if (capture.pixels.length > 0){
    for (let y = 0; y < capture.height; y += step){
      for (let x = 0; x < capture.width; x += step){
        const idx = 4 * (x + y * capture.width);
        const r = capture.pixels[idx    ];
        const g = capture.pixels[idx + 1];
        const b = capture.pixels[idx + 2];
        const Y = 0.299*r + 0.587*g + 0.114*b;
        avg += Y; cnt++;
      }
    }
    avg = (cnt>0) ? avg / cnt : 0;
  }

  // 스무딩
  brightSmoothed = lerp(brightSmoothed, avg, 0.15);

  // 평행이동/확장 + 반전 맵핑 (밝을수록 낮은 인덱스)
  // 실측 0~120 밝기를 전체 프레임 범위로 확장하고, 출력 구간을 뒤집음
  const bClamped = constrain(brightSmoothed, bMin, bMax);
  let frameIndex = Math.round(map(bClamped, bMin, bMax, totalFrames-1, 0));
  frameIndex = constrain(frameIndex, 0, totalFrames-1);

  // 그리기
  const img = frames[frameIndex];
  if (img) image(img, width/2, height/2);

  // 디버그 텍스트
  noStroke(); fill(255);
  textSize(14);
  text(`avg: ${avg.toFixed(1)}  smoothed: ${brightSmoothed.toFixed(1)}  idx: ${frameIndex}`, 10, 20);
}

// 브라우저 창 크기 대응이 필요하면 아래처럼 캔버스 리사이즈(선택)
// function windowResized(){ resizeCanvas(windowWidth, windowHeight); }
