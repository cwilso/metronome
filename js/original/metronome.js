const audioContext = new AudioContext();

let unlocked = false;
let isPlaying = false;
let startTime = 0;
const driftValues = [];

let tempo = 120.0;
let secondsPerBeat = 60.0 / tempo;
let currentSmallestNote;

const beeps = {};
const notesInQueue = [];
const timerWorker = new Worker("js/metronomeworker.js");

const lookahead = 25.0; // How frequently to call scheduling function (in milliseconds)
const scheduleAheadTime = 0.1; // How far ahead to schedule audio (sec)

let nextNoteTime = 0.0; // when the next note is due.
let noteResolution = 0; // 0 == 16th, 1 == 8th, 2 == quarter note
let beepDuration = 0.05; // length of "beep" (in seconds)

let ctx; // drawing context
let lastSmallestNoteDrawn = -1; // the last "box" we drew on the screen

// what's the intervalic fraction? (1=quarter, 0.5=eight, 0.25=sixteenth, etc.)
let fraction = 1;

// new section: making JS do the JS things, rather than mixing live JS into the HTML code

const playBtn = document.querySelector(`button.play`);
playBtn.addEventListener(`click`, () => {
  playBtn.innerText = togglePlay();
});

const tempoLabel = document.querySelector("label.tempo");
const tempoInput = document.querySelector(`input.tempo`);
tempoInput.addEventListener(`input`, () => {
  tempo = parseFloat(tempoInput.value);
  secondsPerBeat = 60.0 / tempo;
  tempoLabel.innerText = tempo;
  notesInQueue.length = 0;
});

const intervalPicker = document.querySelector(`select.resolution`);
intervalPicker.addEventListener(`change`, () => {
  noteResolution = intervalPicker.value; // intervalPicker.selectedIndex;
  fraction = parseFloat(noteResolution);
  console.log(noteResolution, fraction);
});

const driftSampleCount = 20;
const driftSampleLabel = document.querySelector(`span.samples`);
const driftLabel = document.querySelector(`span.drift`);

/**
 * ...docs go here...
 */
function handleTick() {
  if (isPlaying) {
    while (nextNoteTime < audioContext.currentTime + scheduleAheadTime) {
      scheduleNote(currentSmallestNote, nextNoteTime);
      nextNote();
    }
  }
}

/**
 * ...docs go here...
 */
function scheduleNote(beatNumber, time) {
  notesInQueue.push({ note: beatNumber, time: time });

  // if (noteResolution === `1/8` && beatNumber % 2) return; // we're not playing non-8th 16th notes
  // if (noteResolution === `1/4` && beatNumber % 4) return; // we're not playing non-quarter 8th notes

  beeps[220].play(time);
}

/**
 * ...docs go here...
 */
function nextNote() {
  const curNoteTimeMS = nextNoteTime * 1000;
  const curClockTimeMS = performance.now() - startTime;
  const diff = curNoteTimeMS - curClockTimeMS;
  console.log(curNoteTimeMS, curClockTimeMS, diff);
  driftValues.push(diff);
  if (driftValues.length > driftSampleCount) driftValues.shift();
  driftLabel.textContent = (
    driftValues.reduce((t, v) => t + v, 0) / driftValues.length
  ).toFixed(2);

  const bump = fraction * secondsPerBeat; // Add beat length to last beat time
  nextNoteTime += bump;

  currentSmallestNote++; // Advance the beat number, wrap to zero
  if (currentSmallestNote >= 1 / fraction) {
    currentSmallestNote = 0;
  }
}

/**
 * ...docs go here...
 */
function togglePlay() {
  if (!unlocked) {
    // play silent buffer to unlock the audio
    const node = audioContext.createBufferSource();
    node.buffer = audioContext.createBuffer(1, 1, 22050);
    node.start(0);
    unlocked = true;
  }

  isPlaying = !isPlaying;

  if (isPlaying) {
    currentSmallestNote = 0;
    notesInQueue.splice(0, notesInQueue.length);
    nextNoteTime = audioContext.currentTime = 0;
    requestAnimationFrame(draw);
    timerWorker.postMessage({ start: true });
    startTime = performance.now();
    return "stop";
  }

  timerWorker.postMessage({ stop: true });
  return "play";
}

// ============================================
//   everything past this point is just setup
// ============================================

/**
 * ...docs go here...
 */
function resetCanvas() {
  cvs.width = window.innerWidth;
  cvs.height = window.innerHeight;
}

/**
 * ...docs go here...
 */
function draw() {
  if (!isPlaying) return;

  var currentNote = lastSmallestNoteDrawn;
  var currentTime = audioContext.currentTime;

  while (notesInQueue.length && notesInQueue[0].time < currentTime) {
    currentNote = notesInQueue[0].note;
    notesInQueue.shift();
  }

  // We only need to draw if the note has moved.
  if (lastSmallestNoteDrawn != currentNote) {
    var x = Math.floor(cvs.width / 18);
    ctx.clearRect(0, 0, cvs.width, cvs.height);
    for (var i = 0; i < 16; i++) {
      ctx.fillStyle =
        currentNote == i ? (currentNote % 4 === 0 ? "red" : "blue") : "black";
      ctx.fillRect(x * (i + 1), x, x / 2, x / 2);
    }
    lastSmallestNoteDrawn = currentNote;
  }

  // set up to draw again
  requestAnimationFrame(draw);
}

/**
 * ...docs go here...
 */
function setupGraphics() {
  var container = document.createElement("div");
  container.className = "container";
  cvs.width = window.innerWidth;
  cvs.height = window.innerHeight;
  ctx = cvs.getContext("2d");
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 2;
}

/**
 * ...docs go here...
 */
function setupBeeps() {
  const routeAudio = (Hz) => {
    const volume = audioContext.createGain();
    volume.gain.setValueAtTime(0, audioContext.currentTime);
    volume.connect(audioContext.destination);
    const osc = audioContext.createOscillator();
    osc.frequency.value = Hz;
    osc.connect(volume);
    osc.start();
    return volume;
  };

  [220, 440, 880].forEach((Hz) => {
    const master = routeAudio(Hz);
    beeps[Hz] = {
      play: (when) => {
        master.gain.setValueAtTime(1, when);
        master.gain.setValueAtTime(0, when + beepDuration);
      },
    };
  });
}

// this had a window.load call, which was made obsolete by the "defer" script attribute

(function run() {
  setupGraphics();
  setupBeeps();
  timerWorker.postMessage({ interval: lookahead });
  timerWorker.onmessage = (e) => {
    if (e.data.tick && isPlaying) handleTick();
  };
})();
