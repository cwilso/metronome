let a = 0;

const timerWorker = new Worker("js/andback.js");

timerWorker.onmessage = (e) => {
  a = a + 1;
  timerWorker.postMessage({ more: true });
};

timerWorker.postMessage({ start: true });

setTimeout(() => {
    timerWorker.postMessage({ stop: true });
    console.log(a);
    document.querySelector(`.drift`).textContent = a;
}, 1000);
