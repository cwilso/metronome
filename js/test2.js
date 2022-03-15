let audioContext;
let beepDuration = 0.05; // length of "beep" (in seconds)
let unlocked = false;

const timerWorker = new Worker("js/forward.js");
let tickData, prevTickData;
let startTime;

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
}

function getDifference(arr1, arr2) {
  for (let i = 0, e = arr1.length; i < e; i++) {
    if (arr1[i] !== arr2[i]) return i;
  }
  return -1;
}

const create = (tag) => document.createElement(tag);

function buildDivisions(intervals) {
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
  const { tickData, intervals, ticks, bad } = e.data;

  if (intervals) {
    buildDivisions(intervals);
    prevTickData = intervals.map(() => -1);
    return;
  }

  if (ticks) {
    document.querySelector(`span.tick-count`).textContent = `${ticks} (${bad} bad)`;
    return;
  }

  if (updateTickData(tickData) === undefined) return;

//   console.log(tickData);

  document
    .querySelectorAll(`.highlight`)
    .forEach((e) => e.classList.remove(`highlight`));
  const q = tickData[1];
  tickData.forEach((v, i) => {
    const n = i > 1 ? `${q * i + v + 1}` : `${v + 1}`;
    const qs = `.d${i} li:nth-child(${n})`;
    document.querySelector(qs)?.classList.add(`highlight`);
  });
};

function updateTickData(tickData) {
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

  return pos;
}

document.querySelector(`button.play`).addEventListener(`click`, () => {
  audioContext = new AudioContext();
  if (!unlocked) {
    // play silent buffer to unlock the audio
    const node = audioContext.createBufferSource();
    node.buffer = audioContext.createBuffer(1, 1, 22050);
    node.start(0);
    unlocked = true;
  }
  setupBeeps();
  startTime = performance.now();
  timerWorker.postMessage({ start: true });
});

document
  .querySelector(`button.stop`)
  .addEventListener(`click`, () => {
      const runtime = performance.now() - startTime;
      document.querySelector(`span.runtime`).textContent = runtime;
      timerWorker.postMessage({ stop: true });
  });

timerWorker.postMessage({ bpm: 125, divisions: 8 });
