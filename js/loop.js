const TICK = { tick: true };
const tick = () => postMessage(TICK);
let running = false;

// instant return loop, let's see if we can get more data than setInterval
onmessage = function (e) {
  if (e.data.start) {
    // console.log(`setting loop to running`);
    running = true;
  }

  if (e.data.stop) {
    // console.log(`cancelling loop`);
    running = false;
  }

  if (running) {
    // console.log(`posting tick`);
    tick();
  }
};
