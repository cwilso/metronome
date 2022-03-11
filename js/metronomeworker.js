let timer;
let interval = 4;
const TICK = { tick: true };

onmessage = function (e) {
  // run the timer
  if (e.data.start) {
    console.log(`starting`);
    runTicks();
  }

  // interval change?
  else if (e.data.interval) {
    console.log(`setting interval`);
    interval = e.data.interval;
    console.log(`interval=${interval}ms`);
    runTicks();
  }

  // stop the timer
  else if (e.data.stop) {
    console.log(`stopping`);
    timer = clearInterval(timer);
  }
};

function runTicks() {
  postMessage(TICK);
  clearInterval(timer);
  timer = setInterval(() => postMessage(TICK), interval);
}