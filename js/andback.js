const TICK = { tick: true };
let running = false;

// instant return loop, let's see if we can get more data than setInterval
onmessage = function (e) {
    if (e.data.start) running = true;
    if (e.data.stop) running = false;
    if (running) setTimeout(() => postMessage(TICK), 1);
}