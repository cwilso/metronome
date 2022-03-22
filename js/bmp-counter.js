/**
 * This must be loaded as a web worker, and will post an object
 * whenever any value ticks over, of the form:
 *
 *   {
 *     tickData: [<measure count>, <quarter count>, ...]
 *   }
 *
 * The tick data array is at least two elements long, including
 * the current measure and quarter note, with subsequent elements
 * representing fractions of a quarter note. tickData[2] represents
 * half-divisions of the quarter note (i.e. eights), tickData[3]
 * represents thirds-divisions of the quarter note (i.e. eight
 * triplets), tickData[4] represents fourths-divisions of the
 * quarter note (i.e. sixteenth notes), and so on. Also note that
 * there is no "selection" mechanism: if you need 32nd note ticks,
 * `division` must be set to a value 8 or higher, and tickData will
 * include all quarter divisions up to 32nd notes.
 *
 * This counter accepts the following messages:
 *
 *    {
 *      bpm: <number>,
 *      division: <number>
 *    }
 *
 *  which is followed by a postMessage response of the form:
 *
 *    {
 *      intervals: [
 *        measure length in ms,
 *        quarter length in ms,
 *        quarter length in ms / 2,
 *            "    / 3,
 *        " / 4,
 *         ...
 *      ]
 *    }
 *
 *  Set the BPM and how many quarter-subdivisions should be tracked.
 *  Note: this message will currently stop the counter, rather than
 *  updating it in place. This will change to updating in place in
 *  the future.
 *
 *    { start: <truthy> }
 *
 *  Reset and start the counter.
 *
 *    { stop: <truthy> }
 *
 *  Stop the counter.
 */

const MORE = { more: true };
const more = () => loopWorker.postMessage(MORE);

const loopWorker = new Worker("./loop.js");

loopWorker.onmessage = () => {
  // we exploit postMessage round-tripping to effect an
  // incredibly unpredictable, but high resolution timer.
  tryIncrement();
  setTimeout(more, 1);
};

function tryIncrement() {
  const now = performance.now();
  const runtime = now - startTime;
  const diff = now - last;

  if (diff >= 1) {
    last = now;
    ticks = ticks + 1;
    timerIntervals.push(diff);

    if (diff > smallest) {
      bad = bad + 1;
    }

    const m = (runtime / intervals[0]) | 0;
    const mi = runtime - m * intervals[0];

    const q = (mi / intervals[1]) | 0;
    const qi = mi - q * intervals[1];

    tickData = intervals.map((v) => (qi / v) | 0);
    tickData[0] = m;
    tickData[1] = q;

    const midi24 = (qi / midi24Interval) | 0;

    // always send at a steady 10-ms pace, even if that's
    // somewhere in between divisions ticking over.
    if (now - lastFrame > 16) {
      lastFrame = now;
      postMessage({ tickData, midi24 });
      prevTickData = tickData;
      return;
    }

    // Notify our parent of a new tick if anything
    // changed, checking back-to-front because the
    // smallest divisions change radically more often
    // than the measure or quarter.
    for (let i = tickData.length - 1; i >= 0; i--) {
      if (tickData[i] !== prevTickData[i]) {
        postMessage({ tickData, midi24 });
        prevTickData = tickData;
      }
    }
  }
}

const timerIntervals = [];
let startTime, BPM, intervals, midi24Interval, smallest, tickData, prevTickData;
let ticks = 0,
  last = 0,
  now,
  bad = 0,
  lastFrame = -1;

onmessage = async (e) => {
  const { start, stop, bpm, divisions } = e.data;
  if (bpm) setBPM(bpm, divisions);
  if (start) startCounter();
  if (stop) stopCounter();
};

function setBPM(bpm = 125, MAX_DIVISION = 8) {
  BPM = bpm;
  intervals = [240000 / BPM, 60000 / BPM];
  for (let i = 0; i <= MAX_DIVISION - 2; i++) {
    intervals.push(60000 / (BPM * (i + 2)));
  }
  smallest = intervals[intervals.length - 1];
  midi24Interval = intervals[1] / 24;
  postMessage({ intervals, midi24Interval });
}

function startCounter() {
  ticks = 0;
  startTime = last = performance.now();
  lastFrame = startTime;
  tickData = intervals.map((v) => 0);
  prevTickData = intervals.map(() => -1);
  loopWorker.postMessage({ start: true });
}

function stopCounter() {
  loopWorker.postMessage({ stop: true });
  postMessage({ ticks: ticks, bad });
}
