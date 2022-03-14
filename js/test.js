let a = 0;
let last = 0;
let now;
const MORE = { more: true };
const timerWorker = new Worker("js/andback.js");

timerWorker.onmessage = (e) => {
  timerWorker.postMessage(MORE);
  now = performance.now();
  if (now - last > 0) {
    last = now;
    a = a + 1;
  }
};

// start
timerWorker.postMessage({ start: true });
last = performance.now();

setTimeout(() => {
  timerWorker.postMessage({ stop: true });
  console.log(a);
  document.querySelector(`.drift`).textContent = a;
}, 1000);
