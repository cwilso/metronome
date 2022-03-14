let a = 0;
const SECONDS = 1000; // ms
const intervals = []
let last = 0;
let now;
const MORE = { more: true };
const timerWorker = new Worker("js/andback.js");

timerWorker.onmessage = (e) => {
  // perform some light computation
  tryIncrement();
  // then immediately tell the worker to round-trip a tick
  timerWorker.postMessage(MORE);
};

let tryIncrement = () => {
  // initial update needs to set `last`
  last = performance.now();
  a = a + 1;
  // subsequent updates don't.
  tryIncrement = () => {
    const now = performance.now();
    const diff = now - last;
    if (diff >= 1) {
      last = now;
      a = a + 1;
      intervals.push(diff);
    }
  };
}

(function run(duration) {
  timerWorker.postMessage({ start: true });
  setTimeout(() => {
    timerWorker.postMessage({ stop: true });
    document.querySelector(`.drift`).textContent = a;
    console.log(intervals);
    console.log(Math.min(...intervals), intervals.reduce((t,v) => t+v)/intervals.length, Math.max(...intervals));
  }, duration);
  
  // We also run a setInterval, as a kind of "super resolution" timer,
  // using two independent mechanisms to ensure that if one of them gets
  // stuck, the other still kicks in (hopefully)
  setInterval(tryIncrement, 1);
})(5 * SECONDS);
