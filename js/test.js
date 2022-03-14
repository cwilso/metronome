let a = 0;
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

async tryIncrement() {
  now = Date.now();
  if (now - last >= 1) {
    last = now;
    a = a + 1;
  }
}  

// start
timerWorker.postMessage({ start: true });
last = Date.now();

setTimeout(() => {
  timerWorker.postMessage({ stop: true });
  console.log(a);
  document.querySelector(`.drift`).textContent = a;
}, 1000);
