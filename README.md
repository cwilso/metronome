# Web Audio Metronome

This application shows how to use a collaboration between a setTimeout scheduler and the Web Audio scheduler to properly implement rock-solid timing for audio applications.

I added some code to this demo after writing the article on web audio scheduling that now resides at https://web.dev/audio-scheduling/.  

This code was added because Chrome (and other browsers) made a power-saving change to throttle JS timers at one point, so if the page was not visible (e.g. a tab that you tabbed away from), it would only have setTimeout timers delivered once a second.   Timers in worker threads were not throttled, so I set up a worker thread to ping the main thread (which does the audio scheduling). 

Since that time, I believe the code I wrote is actually no longer necessary, because based on ANOTHER change audible audio should prevent the throttling, so for this application setTimeout on the main thread would work just fine.  (Jake Archibald wrote an article in early 2021 outlining the current state of affairs at https://developer.chrome.com/blog/timer-throttling-in-chrome-88/.) I have not yet tested this assumption or removed the code yet, however.

Check it out, feel free to submit issues or requests, fork, submit pull requests, etc.

The live app is at https://cwilso.github.io/metronome/.

-Chris
