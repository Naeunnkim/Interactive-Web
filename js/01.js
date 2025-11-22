let totalFrames = 420;
let frames = new Array(totalFrames);
let capture;

let brightSmoothed = 0; 
let backgroundAvg = -1; 

// [핵심 설정 1] 감도(Sensitivity)
// 변화량이 1~2밖에 안 된다면, 이 값을 '5' 정도로 아주 낮추세요.
// 의미: 밝기 차이가 5만 나도 프레임 끝까지 재생해라.
const sensitivity = 8; 

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

  // 카메라 설정
  capture = createCapture({
    audio: false,
    video: { width: 320, height: 240, frameRate: 30 }
  }, () => console.log('camera ready'));
  capture.size(320, 240);
  capture.hide();

  // [핵심 설정 2] 웹캠 영상 자체에 고대비 필터 적용 (요청하신 부분)
  // contrast(200%): 대비 2배 강화 (회색이 검정/흰색으로 극명하게 나뉨)
  // brightness(1.2): 약간 밝게 해서 어두운 곳 노이즈 방지
  capture.style('filter', 'contrast(200%) brightness(120%) grayscale(100%)');

  frameRate(24);
  imageMode(CORNER);
}

function draw(){
  background(0);

  capture.loadPixels();
  let avg = 0, cnt = 0;
  const step = 4; 

  if (capture.pixels.length > 0){
    for (let y = 0; y < capture.height; y += step){
      for (let x = 0; x < capture.width; x += step){
        const idx = 4 * (x + y * capture.width);
        // 필터가 적용된 픽셀값을 가져오거나, raw 데이터를 가져옵니다.
        const r = capture.pixels[idx];
        const g = capture.pixels[idx + 1];
        const b = capture.pixels[idx + 2];
        const Y = 0.299*r + 0.587*g + 0.114*b;
        avg += Y; cnt++;
      }
    }
    avg = cnt ? avg / cnt : 0;
  }

  // 배경값 학습
  if (backgroundAvg === -1) {
    backgroundAvg = avg; 
  } else {
    backgroundAvg = lerp(backgroundAvg, avg, 0.05);
  }

  // 차이 계산
  let diff = backgroundAvg - avg; 

  // [핵심 설정 3] 신호 강제 증폭 (Signal Boosting)
  // 변화량이 1~2밖에 안 되면, 강제로 곱하기를 해서 키워줍니다.
  // 물리적 필터 없이도 소프트웨어적으로 대비를 높이는 가장 확실한 방법입니다.
  diff = diff * 3.0; // 차이값을 3배로 뻥튀기

  // 노이즈 제거 (증폭했으므로 기준도 약간 높임)
  if (diff < 1) diff = 0;

  brightSmoothed = lerp(brightSmoothed, diff, 0.15);

  // 매핑: 증폭된 diff 값을 기준으로 프레임 전환
  let frameIndex = map(brightSmoothed, 0, sensitivity, 0, totalFrames - 1);
  
  frameIndex = constrain(frameIndex, 0, totalFrames - 1);
  frameIndex = Math.floor(frameIndex);

  // 이미지 그리기
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
  
  // [디버깅] 값이 너무 작으면 콘솔이나 화면에 찍어서 확인해보세요
  // fill(0, 255, 0); textSize(20);
  // text(`Diff: ${diff.toFixed(2)}`, 50, 50);
}

function windowResized(){
  const container = document.getElementById('js-canvas-container');
  if (!container) return;
  W = Math.max(50, container.clientWidth);
  H = Math.max(50, container.clientHeight);
  resizeCanvas(W, H);
}