const frameConfig = {
  sourceFrameCount: 420,
  frameSet: '01',
  skipFrames: [],
  mode: 'brightness',
  initialBrightness: 128,
  sampleStep: 8,
  smoothing: 0.15,
  bMin: 0,
  bMax: 120,
  ...window.POISON_GARDEN_CONFIG,
};

const frameNumbers = Array.from(
  { length: frameConfig.sourceFrameCount },
  (_, index) => index + 1,
).filter((number) => !frameConfig.skipFrames.includes(number));

const totalFrames = frameNumbers.length;
const frames = new Array(totalFrames);

let capture;
let frameIndex = 0;
let manualFrameIndex = null;
let brightSmoothed = frameConfig.initialBrightness;
let backgroundAvg = -1;
let canvasWidth = 0;
let canvasHeight = 0;

function preload() {
  frameNumbers.forEach((frameNumber, index) => {
    const path = `images/frames${frameConfig.frameSet}/${frameNumber}.jpg`;
    frames[index] = loadImage(path, undefined, () => {
      console.warn(`[Poison Garden] Frame unavailable: ${path}`);
    });
  });
}

function setup() {
  pixelDensity(1);

  const container = document.getElementById('js-canvas-container');
  if (!container) return;

  canvasWidth = Math.max(50, container.clientWidth);
  canvasHeight = Math.max(50, container.clientHeight);

  const canvas = createCanvas(canvasWidth, canvasHeight);
  canvas.parent(container);

  try {
    capture = createCapture(
      {
        audio: false,
        video: {
          width: frameConfig.cameraWidth || canvasWidth,
          height: frameConfig.cameraHeight || canvasHeight,
          frameRate: 30,
        },
      },
      () => console.log('camera ready'),
    );
    capture.size(frameConfig.cameraWidth || canvasWidth, frameConfig.cameraHeight || canvasHeight);
    capture.hide();

    if (frameConfig.videoFilter) {
      capture.style('filter', frameConfig.videoFilter);
    }
  } catch (error) {
    console.warn('[Poison Garden] Camera unavailable; using fallback input.', error);
  }

  updateInteractionStatus();
  window.addEventListener('keydown', handleKeyboardInput);
  frameRate(24);
  imageMode(CORNER);
}

function draw() {
  background(0);

  const average = readAverageBrightness();
  if (average !== null) {
    frameIndex = frameConfig.mode === 'difference'
      ? frameFromDifference(average)
      : frameFromBrightness(average);
  }

  if (manualFrameIndex !== null) {
    frameIndex = manualFrameIndex;
  }

  const imageToDraw = getRenderableFrame(frameIndex);
  if (!imageToDraw) return;

  const scale = Math.min(width / imageToDraw.width, height / imageToDraw.height);
  const drawWidth = imageToDraw.width * scale;
  const drawHeight = imageToDraw.height * scale;
  const offsetX = (width - drawWidth) / 2;
  const offsetY = (height - drawHeight) / 2;

  image(imageToDraw, offsetX, offsetY, drawWidth, drawHeight);
}

function readAverageBrightness() {
  const video = capture?.elt;
  if (!video || video.readyState < 2) return null;

  capture.loadPixels();
  if (!capture.pixels?.length) return null;

  let total = 0;
  let count = 0;
  const step = frameConfig.sampleStep;

  for (let y = 0; y < capture.height; y += step) {
    for (let x = 0; x < capture.width; x += step) {
      const index = 4 * (x + y * capture.width);
      const red = capture.pixels[index];
      const green = capture.pixels[index + 1];
      const blue = capture.pixels[index + 2];
      total += 0.299 * red + 0.587 * green + 0.114 * blue;
      count += 1;
    }
  }

  return count ? total / count : null;
}

function frameFromBrightness(average) {
  brightSmoothed = lerp(brightSmoothed, average, frameConfig.smoothing);
  const clamped = constrain(brightSmoothed, frameConfig.bMin, frameConfig.bMax);
  const mapped = map(clamped, frameConfig.bMin, frameConfig.bMax, totalFrames - 1, 0);
  return constrain(Math.round(mapped), 0, totalFrames - 1);
}

function frameFromDifference(average) {
  if (backgroundAvg === -1) {
    backgroundAvg = average;
  } else {
    backgroundAvg = lerp(backgroundAvg, average, frameConfig.backgroundSmoothing);
  }

  let difference = (backgroundAvg - average) * frameConfig.differenceScale;
  if (difference < frameConfig.noiseFloor) difference = 0;

  brightSmoothed = lerp(brightSmoothed, difference, frameConfig.smoothing);
  const progress = constrain(brightSmoothed / frameConfig.sensitivity, 0, 1);
  const easedProgress = Math.pow(progress, frameConfig.easingExponent);
  return constrain(
    Math.floor(easedProgress * (totalFrames - 1)),
    0,
    totalFrames - 1,
  );
}

function getRenderableFrame(index) {
  if (frames[index]?.width) return frames[index];

  for (let distance = 1; distance < frames.length; distance += 1) {
    const previous = frames[index - distance];
    if (previous?.width) return previous;

    const next = frames[index + distance];
    if (next?.width) return next;
  }

  return null;
}

function handleKeyboardInput(event) {
  if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
  event.preventDefault();

  const current = manualFrameIndex ?? frameIndex;
  if (event.key === 'Home') manualFrameIndex = 0;
  else if (event.key === 'End') manualFrameIndex = totalFrames - 1;
  else manualFrameIndex = constrain(current + (event.key === 'ArrowRight' ? 1 : -1), 0, totalFrames - 1);

  updateInteractionStatus(true);
}

function updateInteractionStatus(manual = false) {
  const visualArea = document.querySelector('.visual-area');
  if (!visualArea) return;

  let status = visualArea.querySelector('.interaction-status');
  if (!status) {
    status = document.createElement('p');
    status.className = 'interaction-status';
    status.setAttribute('role', 'status');
    status.setAttribute('aria-live', 'polite');
    visualArea.append(status);
  }

  status.textContent = manual
    ? '키보드 탐색 중 · ← → 한 프레임씩 이동 · Home/End 처음과 끝'
    : '카메라 밝기에 반응합니다 · 카메라를 사용할 수 없으면 ← → 키를 사용하세요';
}

function windowResized() {
  const container = document.getElementById('js-canvas-container');
  if (!container) return;

  canvasWidth = Math.max(50, container.clientWidth);
  canvasHeight = Math.max(50, container.clientHeight);
  resizeCanvas(canvasWidth, canvasHeight);

  if (capture) {
    capture.size(canvasWidth, canvasHeight);
  }
}
