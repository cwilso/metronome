let audioContext;
let unlocked = false;

const beeps = {
  get: (Hz) => {
    if (!beeps[Hz]) {
      const volume = audioContext.createGain();
      volume.gain.setValueAtTime(0, audioContext.currentTime);
      volume.connect(audioContext.destination);
      const osc = audioContext.createOscillator();
      osc.frequency.value = Hz;
      osc.connect(volume);
      osc.start();

      const master = volume.gain;

      beeps[Hz] = {
        play: () => {
          const when = audioContext.currentTime + 0.05;
          master.setTargetAtTime(1, when, rampDuration);
          master.setTargetAtTime(0, when + beepDuration, rampDuration);
        },
      };
    }
    return beeps[Hz];
  }
};
let beepDuration = 0.05;
let rampDuration = 0.01;
let activeDivision = 2;

const timerWorker = new Worker("js/bmp-counter.js");
let tickData, prevTickData, startTime;

let bpm = 125;
let divisions = 8;

// =========== functions ===========

function create(tag) {
  return document.createElement(tag);
}

function getDifference(arr1, arr2) {
  return arr1.map((v,i) => arr2[i] !== v);
}

function buildDivisions(intervals) {
  const divisions = document.querySelector(`.divisions`);
  divisions.textContent = ``;
  intervals.forEach((_, i) => {
    const ol = create(`ol`);
    ol.classList.add(`d${i}`);
    if (i >= 2) {
      ol.addEventListener(`click`, () => (activeDivision = i));
      ol.classList.add(`clickable`);
    }
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

function updateTickData(tickData) {
  const flips = getDifference(tickData, prevTickData);
  const pos = flips.findIndex(v => v);

  // if nothing changed, do nothing.
  if (pos === -1) return;

  prevTickData = tickData;

  // measure, quarter, and chosen division
  if (flips[0]) beeps.get(4 * 196).play();
  if (flips[1]) beeps.get(4 * 65.21).play();
  if (flips[activeDivision]) beeps.get(4 * 98).play();
  return pos;
}

// =========== event bindings ===========

timerWorker.onmessage = (e) => {
  const { tickData, intervals, ticks, bad } = e.data;

  if (intervals) {
    buildDivisions(intervals);
    prevTickData = intervals.map(() => 0);
    prevTickData[0] = -1;
    return;
  }

  if (ticks) {
    document.querySelector(
      `span.tick-count`
    ).textContent = `${ticks} (${bad} bad)`;
    return;
  }

  if (updateTickData(tickData) === undefined) return;

  // console.log(tickData);

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

document.querySelector(`button.play`).addEventListener(`click`, () => {
  audioContext ??= new AudioContext();
  if (!unlocked) {
    // play silent buffer to unlock the audio
    const node = audioContext.createBufferSource();
    node.buffer = audioContext.createBuffer(1, 1, 22050);
    node.start(0);
    unlocked = true;
  }
  startTime = performance.now();
  audioContext.currentTime = 0;
  timerWorker.postMessage({ start: true });
});

document.querySelector(`button.stop`).addEventListener(`click`, () => {
  const runtime = performance.now() - startTime;
  document.querySelector(`span.runtime`).textContent = runtime;
  timerWorker.postMessage({ stop: true });
});

document.getElementById(`bpm`).addEventListener(`change`, (evt) => {
  timerWorker.postMessage({ stop: true });
  bpm = parseInt(evt.target.value);
  timerWorker.postMessage({ bpm, divisions });
});

document.getElementById(`divisions`).addEventListener(`change`, (evt) => {
  timerWorker.postMessage({ stop: true });
  divisions = parseInt(evt.target.value);
  timerWorker.postMessage({ bpm, divisions });
});

timerWorker.postMessage({ bpm, divisions });
