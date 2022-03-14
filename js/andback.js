const TICK = { tick: true };
let running = false;

const tick = () => postMessage(TICK);

// instant return loop, let's see if we can get more data than setInterval
onmessage = function (e) {
    if (e.data.start) running = true;
    if (e.data.stop) running = false;
    if (running) setTimeout(tick, 1);
}