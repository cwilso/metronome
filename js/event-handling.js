import { router } from "./router.js";
import { master, setReverb } from "./audio-context.js";
import { connectMIDI } from "./midi.js";
import { slider } from "./slider.js";
import { recorder } from "./recorder.js";
import { settings } from "./settings.js";

let startTime;

export function listenForUser(counter) {
  document
    .querySelector(`button.midi`)
    .addEventListener(`click`, async (evt) => {
      evt.target.setAttribute(`disabled`, `disabled`);
      document.querySelector(`button.play`).removeAttribute(`disabled`);
      document.querySelector(`button.stop`).removeAttribute(`disabled`);
      const result = await connectMIDI();
      if (!result) {
        evt.target.removeAttribute(`disabled`);
      }

      router.addListener(
        {
          // control codes for my Novation LaunchKey 49 mk3
          onControl: (controller, value) => {
            if (controller === 102) {
              // track down
            }
            if (controller === 103) {
              // track up
            }
            if (controller === 104 && value === 127) {
              // "right arrow" pad, should probably cycle focus
              const keyboardfocusableElements = [
                ...document
                  .querySelector(`.controls`)
                  .querySelectorAll(
                    'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), details, [tabindex]:not([tabindex="-1"])'
                  ),
              ];
              const klen = keyboardfocusableElements.length;
              const cur = document.activeElement;
              let pos = keyboardfocusableElements.findIndex((v) => v === cur);
              if (pos < 0) pos = 0;
              const next = keyboardfocusableElements[(pos + 1) % klen];
              next.focus();
            }
            if (controller === 106) {
              if (value === 127)
                // todo: add key repeat
                document.activeElement.dispatchEvent(
                  new KeyboardEvent(`keydown`, { key: `Arrow Up` })
                );
              if (value === 0)
                document.activeElement.dispatchEvent(
                  new KeyboardEvent(`keyup`, { key: `Arrow Up` })
                );
            }
            if (controller === 107) {
              if (value === 127)
                // todo: add key repeat
                document.activeElement.dispatchEvent(
                  new KeyboardEvent(`keydown`, { key: `Arrow Down` })
                );
              if (value === 0)
                document.activeElement.dispatchEvent(
                  new KeyboardEvent(`keyup`, { key: `Arrow Down` })
                );
            }
            if (controller === 115 && value === 127)
              document.querySelector(`button.play`).click();
            if (controller === 116 && value === 127)
              document.querySelector(`button.stop`).click();
            if (controller === 117 && value === 127)
              document.querySelector(`button.record`).click();
            console.log(controller, value);
          },
        },
        `control`
      );
    });

  document.querySelector(`button.play`).addEventListener(`click`, () => {
    startTime = performance.now();
    const old = recorder.clear();
    // TODO: do we want to use this? overdub? Choices?
    recorder.start();
    counter.postMessage({ start: true });
  });

  document.querySelector(`button.stop`).addEventListener(`click`, () => {
    const runtime = performance.now() - startTime;
    document.querySelector(`span.runtime`).textContent = runtime.toFixed();
    counter.postMessage({ stop: true });

    recorder.stop(); // what do we want to do with the old data?
  });

  document.querySelector(`button.playback`).addEventListener(`click`, () => {
    recorder.playback(settings.intervalValues);
    counter.postMessage({ start: true });
  });

  document.getElementById(`bpm`).addEventListener(`change`, (evt) => {
    counter.postMessage({ stop: true });
    settings.bpm = parseInt(evt.target.value);
    counter.postMessage(settings);
  });

  document.getElementById(`divisions`).addEventListener(`change`, (evt) => {
    counter.postMessage({ stop: true });
    settings.divisions = parseInt(evt.target.value);
    counter.postMessage(settings);
  });

  document.getElementById(`reverb`).addEventListener(`change`, (evt) => {
    setReverb(evt.target.value);
  });

  const pitch = document.querySelector(`input.pitch`);
  router.addListener({ onPitch: (v) => (pitch.value = v) }, `pitch`);

  const mod = document.querySelector(`input.mod`);
  router.addListener(
    { onModWheel: (value) => (mod.value = value) },
    `modwheel`
  );

  document.querySelector(`button.chorus`).addEventListener(`click`, (evt) => {
    const btn = evt.target;
    btn.classList.toggle(`enabled`);
    btn.textContent = btn.classList.contains(`enabled`) ? `disable` : `enable`;
    beeps.toggleOsc2();
  });

  const masterVolume = document.querySelector(`span.master`);
  masterVolume.textContent = ``;
  slider(
    {
      min: 0,
      max: 1,
      step: 0.01,
      value: 1,
      input: (evt) => (master.gain.value = parseFloat(evt.target.value)),
    },
    masterVolume
  );
}
