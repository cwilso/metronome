import { connectMIDI } from "./midi.js";
import { context, master, setReverb, EQcontrols } from "./audio-context.js";
import { AudioGenerator } from "./audio-generator.js";
import { IMPULSES } from "../impulses/impulses.js";
import { router } from "./router.js";
import { generate } from "./circles.js";
import { slider } from "./slider.js";
import { Keyboard } from "./keyboard.js";
import { recorder } from "./recorder.js";

const beeps = (window.beeps = new AudioGenerator());
const play = (note) => beeps.get(note).play(beepDuration);

let prevTickData, startTime, intervalValues;
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
  none.value = ``;
  none.textContent = `none`;
  reverb.append(none);
  IMPULSES.forEach((name) => {
    let option = create(`option`);
    option.value = name;
    option.textContent = name;
    reverb.append(option);
  });
}

// ======== bpm counter bindings ========

counter.onmessage = async (e) => {
  const { tickData, intervals, ticks, bad } = e.data;

  if (intervals) {
    generate(intervals.length, (d) => (activeDivision = d), activeDivision);

    // buildDivisions(intervals);
    prevTickData = intervals.map(() => -1);
    prevTickData[0] = -1;
    intervalValues = intervals;
    return;
  }

  if (ticks) {
    document.querySelector(
      `span.tick-count`
    ).textContent = `${ticks} (${bad} bad)`;
    return;
  }

  const flips = await updateTickData(tickData);
  if (flips !== undefined) {
    updateMetronomePageElements(tickData, flips);
    recorder.tick(tickData, flips);
  }
};

async function updateTickData(tickData) {
  const flips = getDifference(tickData, prevTickData);
  const pos = flips.findIndex((v) => v);

  // if nothing changed, do nothing.
  if (pos === -1) return;

  prevTickData = tickData;

  // Do some beeps for measure, quarter, and chosen division,
  // using the notes C5, G3, and C4 respectively
  if (flips[0]) play(84);
  else if (flips[1]) play(67);
  if (flips[activeDivision]) play(72);
  return flips;
}

async function updateMetronomePageElements(tickData, flips) {
  document
    .querySelectorAll(`.highlight`)
    .forEach((e) => e.classList.remove(`highlight`));
  const q = tickData[1];
  tickData.forEach((v, i) => {
    if (i === 0) return;
    const n = i > 1 ? `${q * i + v + 1}` : `${(v % 16) + 1}`;
    const qs = `.d${i} *:nth-child(${n})`;
    document.querySelector(qs)?.classList.add(`highlight`);
  });

  if (flips[1]) {
    document
      .querySelectorAll(`path.active`)
      .forEach((e) => e.classList.remove(`active`));
    document
      .querySelectorAll(`path.q${q}`)
      .forEach((e) => e.classList.add(`active`));
  }
}

// ========= page event bindings =========

document.querySelector(`button.midi`).addEventListener(`click`, async (evt) => {
  evt.target.setAttribute(`disabled`, `disabled`);
  document.querySelector(`button.play`).removeAttribute(`disabled`);
  document.querySelector(`button.stop`).removeAttribute(`disabled`);
  const result = await connectMIDI();
  if (!result) {
    evt.target.removeAttribute(`disabled`);
  }

  router.addListener(
    {
      // control codes for my Novation LaunchKey 49 mk3
      onControl: (controller, value) => {
        if (controller === 102) {
          // track down
        }
        if (controller === 103) {
          // track up
        }
        if (controller === 104 && value === 127) {
          // "right arrow" pad, should probably cycle focus
          const keyboardfocusableElements = [
            ...document
              .querySelector(`.controls`)
              .querySelectorAll(
                'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), details, [tabindex]:not([tabindex="-1"])'
              ),
          ];
          const klen = keyboardfocusableElements.length;
          const cur = document.activeElement;
          let pos = keyboardfocusableElements.findIndex((v) => v === cur);
          if (pos < 0) pos = 0;
          const next = keyboardfocusableElements[(pos + 1) % klen];
          next.focus();
        }
        if (controller === 106) {
          if (value === 127)
            // todo: add key repeat
            document.activeElement.dispatchEvent(
              new KeyboardEvent(`keydown`, { key: `Arrow Up` })
            );
          if (value === 0)
            document.activeElement.dispatchEvent(
              new KeyboardEvent(`keyup`, { key: `Arrow Up` })
            );
        }
        if (controller === 107) {
          if (value === 127)
            // todo: add key repeat
            document.activeElement.dispatchEvent(
              new KeyboardEvent(`keydown`, { key: `Arrow Down` })
            );
          if (value === 0)
            document.activeElement.dispatchEvent(
              new KeyboardEvent(`keyup`, { key: `Arrow Down` })
            );
        }
        if (controller === 115 && value === 127)
          document.querySelector(`button.play`).click();
        if (controller === 116 && value === 127)
          document.querySelector(`button.stop`).click();
        if (controller === 117 && value === 127)
          document.querySelector(`button.record`).click();
        console.log(controller, value);
      },
    },
    `control`
  );
});

document.querySelector(`button.play`).addEventListener(`click`, () => {
  startTime = performance.now();
  const old = recorder.clear();
  // TODO: do we want to use this? overdub? Choices?
  recorder.start();
  counter.postMessage({ start: true });
});

document.querySelector(`button.stop`).addEventListener(`click`, () => {
  const runtime = performance.now() - startTime;
  document.querySelector(`span.runtime`).textContent = runtime.toFixed();
  counter.postMessage({ stop: true });
  const noteData = recorder.stop();
  console.log(noteData);
});

document.querySelector(`button.playback`).addEventListener(`click`, () => {
  recorder.playback(intervalValues);
  counter.postMessage({ start: true });
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

// vizualise midi pitch/mod
const pitch = document.querySelector(`input.pitch`);
router.addListener({ onPitch: (v) => (pitch.value = v) }, `pitch`);

const mod = document.querySelector(`input.mod`);
router.addListener({ onModWheel: (value) => (mod.value = value) }, `modwheel`);

// chorus button
document.querySelector(`button.chorus`).addEventListener(`click`, (evt) => {
  const btn = evt.target;
  btn.classList.toggle(`enabled`);
  btn.textContent = btn.classList.contains(`enabled`) ? `disable` : `enable`;
  beeps.toggleOsc2();
});

const masterVolume = document.querySelector(`span.master`);
masterVolume.textContent = ``;
slider(
  {
    min: 0,
    max: 1,
    step: 0.01,
    value: 1,
    input: (evt) => (master.gain.value = parseFloat(evt.target.value)),
  },
  masterVolume
);

// ========= startup bootstrap =========

(function buildKeyboard() {
  const keyboard = new Keyboard();
  const kdiv = document.querySelector(`div.keyboard`);
  const white = kdiv.querySelector(`.white`);
  white.innerHTML = ``;
  const black = kdiv.querySelector(`.black`);
  black.innerHTML = ``;
  keyboard.keyNodes.forEach((k, i) => {
    if ([0, 2, 4, 5, 7, 9, 11].includes(i % 12)) {
      white.append(k);
    } else {
      black.append(k);
    }
  });
})();

(function buildEQcontrols() {
  const eq = document.querySelector(`span.eq`);
  eq.textContent = ``;
  EQcontrols.forEach((e) => {
    const l = create(`label`);
    l.textContent = e.getAttribute(`label`);
    eq.append(l, e);
  });
})();

(function setupRecorderListener() {
  const parent = document.querySelector(`.pianoroll`);

  for(let i=128; i>0; i--) {
    const row = create(`div`);
    row.classList.add(`row`);
    parent.appendChild(row);
  }

  const offset = (m, q, d, f) => {
    return 4 * (m * 4 + q + d / f);
  };

  recorder.addListener({
    noteStarted: ({ note, velocity, start, e }) => {
      parent.querySelector(`.row:nth-child(${note})`).appendChild(e);
      const f = start.length - 1;
      const [m, q, ..._] = start;
      e.style.left = `${offset(m, q, start[f], f)}em`;
      // e.addEventListener(`mousedown`, () => beeps.get(note).start(velocity));
      // document.addEventListener(`mouseup`, () => beeps.get(note).stop());
    },
    noteStopped: ({ note, start, stop, e }) => {
      const f = start.length - 1;
      const [m1, q1, ..._] = start;
      const [m2, q2, ...__] = stop;
      const d1 = start[f];
      const d2 = stop[f];
      const v = offset(m2 - m1, (q2 - q1), (d2 - d1), f);
      e.style.width = `${v}em`;
    },
  });
})();

buildImpulseSelector();
counter.postMessage({ bpm, divisions });

const initialClick = (evt) => {
  console.log(`resuming context`);
  document.removeEventListener(`mousedown`, initialClick, true);
  document.removeEventListener(`keydown`, initialClick, true);
  context.resume();
};

document.addEventListener(`mousedown`, initialClick, true);
document.addEventListener(`keydown`, initialClick, true);
