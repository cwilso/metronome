let a = 0;
const intervals = []
let last = 0;
let now;
const MORE = { more: true };
const timerWorker = new Worker("js/andback.js");

timerWorker.onmessage = (e) => {
  // perform some light computation
  tryIncrement(Date.now());
  // then immediately tell the worker to round-trip a tick
  timerWorker.postMessage(MORE);
};

async function tryIncrement(now) {
  const diff = now - last;
  if (diff >= 1) {
    last = now;
    a = a + 1;
    intervals.push(diff);
  }
}  

// start
timerWorker.postMessage({ start: true });
last = Date.now();

setTimeout(() => {
  timerWorker.postMessage({ stop: true });
  document.querySelector(`.drift`).textContent = a;
  console.log(intervals);
  console.log(Math.min(...intervals), intervals.reduce((t,v) => t+v)/intervals.length, Math.max(intervals));
}, 1000);
