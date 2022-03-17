import { connectMIDI } from "./midi.js";
import { context, setReverb } from "./audio-context.js";
import { AudioGenerator } from "./audio-generator.js";
import { IMPULSES } from "../impulses/impulses.js";
import { Keyboard } from "./keyboard.js";

const beeps = new AudioGenerator();
const play = (note) => beeps.get(note).play(beepDuration);

let prevTickData, startTime;
let bpm = 125;
let divisions = 8;
let activeDivision = 2;
let beepDuration = 0.05;

const counter = new Worker("js/bmp-counter.js");

// =========== functions ===========

function create(tag) {
  return document.createElement(tag);
}

function getDifference(arr1, arr2) {
  return arr1.map((v, i) => arr2[i] !== v);
}

function buildImpulseSelector() {
  const reverb = document.getElementById(`reverb`);
  reverb.innerHTML = ``;
  const none = create(`option`);
  none.textContent = `none`;
  reverb.append(none);
  IMPULSES.forEach(name => {
    let option = create(`option`);
    option.value = name;
    option.textContent = name;
    reverb.append(option)
  })
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


// ======== bpm counter bindings ========

counter.onmessage = (e) => {
  const { tickData, intervals, ticks, bad } = e.data;

  if (intervals) {
    buildDivisions(intervals);
    prevTickData = intervals.map(() => -1);
    prevTickData[0] = -1;
    return;
  }

  if (ticks) {
    document.querySelector(
      `span.tick-count`
    ).textContent = `${ticks} (${bad} bad)`;
    return;
  }

  if (updateTickData(tickData) !== undefined) {
    updateMetronomePageElements(tickData);
  }
};

function updateTickData(tickData) {
  const flips = getDifference(tickData, prevTickData);
  const pos = flips.findIndex((v) => v);

  // if nothing changed, do nothing.
  if (pos === -1) return;

  prevTickData = tickData;

  // Do some beeps for measure, quarter, and chosen division,
  // using the notes G4, G3, and C4 respectively
  if (flips[0]) play(79);
  else if (flips[1]) play(67);
  if (flips[activeDivision]) play(72);
  return pos;
}

function updateMetronomePageElements(tickData) {
  document
    .querySelectorAll(`.highlight`)
    .forEach((e) => e.classList.remove(`highlight`));
  const q = tickData[1];
  tickData.forEach((v, i) => {
    const n = i > 1 ? `${q * i + v + 1}` : `${v + 1}`;
    const qs = `.d${i} li:nth-child(${n})`;
    document.querySelector(qs)?.classList.add(`highlight`);
  });
}

// ========= page event bindings =========

document.querySelector(`button.play`).addEventListener(`click`, () => {
  context.resume();
  startTime = performance.now();
  counter.postMessage({ start: true });
});

document.querySelector(`button.midi`).addEventListener(`click`, async () => {
  context.resume();
  document.querySelector(`button.play`).removeAttribute(`disabled`);
  document.querySelector(`button.stop`).removeAttribute(`disabled`);
  const keyboard = await connectMIDI();
  console.log(Keyboard.keys);
});

document.querySelector(`button.stop`).addEventListener(`click`, () => {
  const runtime = performance.now() - startTime;
  document.querySelector(`span.runtime`).textContent = runtime.toFixed();
  counter.postMessage({ stop: true });
});

document.getElementById(`bpm`).addEventListener(`change`, (evt) => {
  counter.postMessage({ stop: true });
  bpm = parseInt(evt.target.value);
  counter.postMessage({ bpm, divisions });
});

document.getElementById(`divisions`).addEventListener(`change`, (evt) => {
  counter.postMessage({ stop: true });
  divisions = parseInt(evt.target.value);
  counter.postMessage({ bpm, divisions });
});

document.getElementById(`reverb`).addEventListener(`change`, (evt) => {
  setReverb(evt.target.value);
});

// ========= startup bootstrap =========

buildImpulseSelector();
counter.postMessage({ bpm, divisions });
