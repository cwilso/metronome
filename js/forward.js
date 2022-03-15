let a = 0,
  last = 0,
  now,
  bad = 0;

const MORE = { more: true };
const loopWorker = new Worker("./andback.js");
const timerIntervals = [];

let startTime, BPM, intervals, smallest;
let tickData, prevTickData;

// Round-tripping the postMessage mechanism.
loopWorker.onmessage = (e) => {
  // console.log(`received tick`);
  tryIncrement();
  // console.log(`requesting next tick`);
  loopWorker.postMessage(MORE);
};

function setBPM(bpm = 125, MAX_DIVISION = 8) {
  BPM = bpm;
  intervals = [
    // measure
    (4 * 60000) / BPM,
    // quarter
    60000 / BPM,
    // [2] is 1/8, [3] is eights triplet, [4] is 1/16, etc.
  ];
  for (let i = 0; i <= MAX_DIVISION - 2; i++) {
    intervals.push(60000 / (BPM * (i + 2)));
  }
  smallest = intervals[intervals.length - 1];
  postMessage({ intervals });
}

function tryIncrement() {
  const now = performance.now();
  const diff = now - last;

  if (diff >= 1) {
    // console.log(`bump`);
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

    // Notify our parent of a new tick if anything
    // changed, checking back-to-front because the
    // smallest divisions change radically more often
    // than the measure or quarter.
    for (let i = tickData.length - 1; i >= 0; i--) {
      if (tickData[i] !== prevTickData[i]) {
        // console.log(`emitting tick event to owner`);
        postMessage({ tickData });
        prevTickData = tickData;
      }
    }
  }
}

onmessage = (e) => {
  const { start, stop, bpm, divisions } = e.data;

  if (bpm) {
    setBPM(bpm, divisions);
  }

  if (start) {
    // console.log(`starting loop`);
    startTime = last = performance.now();
    tickData = intervals.map((v) => 0);
    prevTickData = intervals.map((v) => -1);
    loopWorker.postMessage({ start });
  }

  if (stop) {
    // console.log(`halting loop`);
    loopWorker.postMessage({ stop });
    postMessage({ ticks: a, bad});

    /*
    console.log(timerIntervals);
    console.log(tickData);
    console.log(
      Math.min(...timerIntervals),
      timerIntervals.reduce((t, v) => t + v) / timerIntervals.length,
      Math.max(...timerIntervals),
      bad
    );
    */
  }
};
