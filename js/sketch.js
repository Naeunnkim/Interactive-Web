// sketch.js

let totalFrames = 51; 
let frames = new Array(totalFrames+1); 


function preload() {
 
  for (let i = 1; i <= totalFrames; i++) 
  {
    // 자릿수 처리
    let frameNumberString = String(i).padStart(3, '0');

    // String -> let
    let filename = "images/frames01/ezgif-frame-" + frameNumberString + ".jpg"; 
    frames[i] = loadImage(filename);
  }
}


function setup() {
  // HTML 컨테이너 크기에 맞춰 캔버스 크기 설정 (반응형)
  const container = document.getElementById('p5-canvas-container');
  let w = container.offsetWidth;
  let h = container.offsetHeight;
  
  let canvas = createCanvas(w, h); 
  canvas.parent('p5-canvas-container'); // 캔버스를 HTML DIV에 연결

  imageMode(CENTER);
}


function draw() {
  background(0); 
  
  //  "거리" 값 얻기
 
  let distance = mouseX;
  
  //  "거리" 값을 이미지 프레임 인덱스로 매핑
  
  let frameIndex = int(map(distance, 0, width, totalFrames - 1, 0));
  
  // 인덱스 제한 
  frameIndex = constrain(frameIndex, 1, totalFrames);
  
  // 계산된 인덱스에 해당하는 프레임 이미지를 화면에 표시
  //imageMode(CENTER);
  
  
  // (frames[0]은 비어있고, frames[51]은 배열 범위를 벗어남)
  image(frames[frameIndex], width / 2, height / 2, width, height);
  
  // (디버깅용) 현재 프레임 인덱스 출력
  fill(255);
  textSize(24);
  //text("Frame Index: " + frameIndex, 20, 40);
}

// 캔버스가 HTML 컨테이너 크기에 맞춰지도록 조정하는 함수 (반응형 대응)
function windowResized() {
    const container = document.getElementById('p5-canvas-container');
    if (container) {
        let w = container.offsetWidth;
        let h = container.offsetHeight;
        resizeCanvas(w, h);
    }
}