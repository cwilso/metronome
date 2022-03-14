let audioContext;
let beepDuration = 0.05; // length of "beep" (in seconds)
let unlocked = false;

// =============================

const beeps = {};

function setupBeeps() {
  const routeAudio = (Hz) => {
    const volume = audioContext.createGain();
    volume.gain.setValueAtTime(0, audioContext.currentTime);
    volume.connect(audioContext.destination);
    const osc = audioContext.createOscillator();
    osc.frequency.value = Hz;
    osc.connect(volume);
    osc.start();
    return volume.gain;
  };

  [220, 440, 880].forEach((Hz) => {
    const master = routeAudio(Hz);
    beeps[Hz] = {
      play: () => {
        const when = audioContext.currentTime;
        master.setTargetAtTime(1, when, 0.05);
        master.setTargetAtTime(0, when + beepDuration, 0.05);
      },
    };
  });
};

function getDifference(arr1, arr2) {
  for (let i = 0, e = arr1.length; i < e; i++) {
    if (arr1[i] !== arr2[i]) return i;
  }
  return -1;
}

// ===============================

let a = 0,
  last = 0,
  now,
  bad = 0;
const RUNTIME = 10;
document.querySelector(`.runtime`).textContent = RUNTIME;
const RUNTIME_MS = RUNTIME * 1000;

const timerIntervals = [];
const MORE = { more: true };
const timerWorker = new Worker("js/andback.js");

// Let's set up some musical timing values
let BPM = 125;
let intervals = [
  // measure
  (4 * 60000) / BPM,
  // quarter
  60000 / BPM,
  // [2] is 1/8
  // [4] is 1/16
  // [8] is 1/32
  // [16] is 1/64
];
let MAX_DIVISION = 8;
let subdivisions = MAX_DIVISION - 2;
for (let i = 0; i <= subdivisions; i++) {
  intervals.push(60000 / (BPM * (i + 2)));
}
let smallest = intervals[intervals.length - 1];
let startTime;
let tickData = intervals.map((v) => 0);
let prevTickData = intervals.map((v) => -1);

const create = (tag) => document.createElement(tag);

function buildDivisions() {
  const divisions = document.querySelector(`.divisions`);
  intervals.forEach((_, i) => {
    const ol = create(`ol`);
    ol.classList.add(`d${i}`);
    let rows = 4;
    if (i === 0) {
      rows = 16;
    } else if (i > 1) {
      rows = 4 * i;
    }
    for (let j = 0; j < rows; j++) {
      const li = create(`li`);
      li.textContent = `x`;
      ol.append(li);
    }

    divisions.append(ol);
  });
}

timerWorker.onmessage = (e) => {
  // perform some light computation
  tryIncrement();
  // then immediately tell the worker to round-trip a tick
  timerWorker.postMessage(MORE);
};

let tryIncrement = () => {
  const now = performance.now();
  const diff = now - last;

  if (diff >= 1) {
    last = now;
    a = a + 1;
    timerIntervals.push(diff);

    if (diff > smallest) {
      bad = bad + 1;
      console.log(diff);
    }

    const m = (now / intervals[0]) | 0;
    const mi = now - m * intervals[0];

    const q = (mi / intervals[1]) | 0;
    const qi = mi - q * intervals[1];

    tickData = intervals.map((v) => (qi / v) | 0);
    tickData[0] = m;
    tickData[1] = q;
  }
};

function run(duration) {
  startTime = last = performance.now();
  timerWorker.postMessage({ start: true });

  setTimeout(() => {
    timerWorker.postMessage({ stop: true });
    document.querySelector(`.tick-count`).textContent = a;
    console.log(timerIntervals);
    console.log(tickData);
    console.log(
      Math.min(...timerIntervals),
      timerIntervals.reduce((t, v) => t + v) / timerIntervals.length,
      Math.max(...timerIntervals),
      bad
    );
  }, duration);

  // and let's update the UI
  (async function updateFrame() {
    const pos = getDifference(tickData, prevTickData);

    // if nothing changed, do nothing.
    if (pos === -1) {
      return requestAnimationFrame(updateFrame);
    }

    prevTickData = tickData;

    // measure and quarter
    if (pos === 0) beeps[220].play();
    if (pos === 1) beeps[440].play();

    // "something else"
    if (pos === 2) beeps[880].play();

    document
      .querySelectorAll(`.highlight`)
      .forEach((e) => e.classList.remove(`highlight`));
    const q = tickData[1];
    tickData.forEach((v, i) => {
      const n = i > 1 ? `${q * i + v + 1}` : `${v + 1}`;
      const qs = `.d${i} li:nth-child(${n})`;
      document.querySelector(qs)?.classList.add(`highlight`);
    });
    requestAnimationFrame(updateFrame);
  })();
}

document.querySelector(`button.play`).addEventListener(`click`, () => {
  audioContext  = new AudioContext();
  if (!unlocked) {
    // play silent buffer to unlock the audio
    const node = audioContext.createBufferSource();
    node.buffer = audioContext.createBuffer(1, 1, 22050);
    node.start(0);
    unlocked = true;
  }
  setupBeeps();  
  run(RUNTIME_MS);
});

buildDivisions();
