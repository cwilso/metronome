import { router } from "./router.js";
import { AudioGenerator } from "./audio-generator.js";
import { getFrequency } from "./get-frequency.js";
import { recorder } from "./recorder.js";

const MIDI_KEYS = [...Array(128)].map((_, i) => i); // MIDI "only" has 128 real keys
const pitchDistance = 2; // in semi-tones
const lfoFrequency = 4; // in Hz
const beeps = new AudioGenerator(lfoFrequency);

function domNode(note) {
  let e = document.createElement(`button`);
  // let label = note % 12 === 0 ? note / 12 : ``;
  // e.textContent = label;
  let color = [1, 3, 6, 8, 10].indexOf(note % 12) > -1 ? `black` : `white`;
  e.classList.add(color, `key`, `key${note % 12}`, `midi${note}`);
  return e;
}

/**
 * individual key class
 */
class Key {
  constructor(note) {
    this.pressed = false;
    this.note = note;
    this.e = domNode(note);
    this.beep = beeps.get(note);

    // note data
    router.addListener(this, `noteon`);
    router.addListener(this, `noteoff`);

    // pitch bend information
    this.lower = getFrequency(note - pitchDistance);
    this.higher = getFrequency(note + pitchDistance);
    router.addListener(this, `pitch`);
  }

  getDOMnode() {
    return this.e;
  }

  onNoteOn(note, velocity) {
    if (note === this.note) {
      this.play(velocity);
    }
  }

  play(velocity) {
    this.pressed = true;
    this.e.classList.add(`pressed`);
    this.beep.start(velocity / 127);
    recorder.noteon(this.note, velocity);
  }

  onNoteOff(note) {
    if (note === this.note) {
      this.stop();
    }
  }

  stop() {
    this.pressed = false;
    this.e.classList.remove(`pressed`);
    this.beep.stop();
    recorder.noteoff(this.note);
  }

  onPitch(data) {
    const ratio = data / 8192;
    if (ratio < 0) {
      return this.beep.tuneTowards(this.lower, -ratio);
    }
    this.beep.tuneTowards(this.higher, ratio);
  }
}

/**
 * The full keyboard, but you only get to see 24 keys at a time.
 */
class Keyboard {
  constructor(makeActive = false) {
    this.keys = MIDI_KEYS.map((note) => new Key(note));
    this.keyNodes = this.keys.map((key) => key.getDOMnode());
    if (makeActive || !Keyboard.active) Keyboard.active = this;

    this.keyMapping = {};
    const getCodes = (keys, start) =>
      Object.fromEntries(keys.split(``).map((c, i) => [c, i + start]));
    Object.assign(this.keyMapping, getCodes(`zsxdcvgbhnjm`, 48));
    Object.assign(this.keyMapping, getCodes(`q2w3er5t6y7ui9o0p[=]`, 60));

    this.handleDown = (evt) => {
      if (evt.repeat) return;
      const { shift, altKey, ctrlKey, metaKey } = evt;
      const modified = shift || altKey || ctrlKey || metaKey;
      this.handleKeyDown(
        evt.key,
        modified ? { shift, altKey, ctrlKey, metaKey } : undefined
      );
    };
    document.addEventListener(`keydown`, this.handleDown);
    this.handleUp = (evt) => this.handleKeyUp(evt.key, evt.shift);
    document.addEventListener(`keyup`, this.handleUp);
  }

  getKeyNodes() {
    return this.keys;
  }

  handleKeyDown(key, modifiers) {
    if (key === `<`) return this.changeOctave(-1);
    if (key === `>`) return this.changeOctave(1);
    if (modifiers) return;
    const code = this.keyMapping[key];
    if (code === undefined) return;
    this.start(code, 63);
  }

  start(code, velocity) {
    this.keys[code].play(velocity);
  }

  handleKeyUp(key, modifiers) {
    if (modifiers) return;
    const code = this.keyMapping[key];
    if (code === undefined) return;
    this.stop(code);
  }

  stop(code) {
    this.keys[code].stop();
  }

  changeOctave(shift) {
    const delta = shift * 12;
    Object.keys(this.keyMapping).forEach(
      (key) => (this.keyMapping[key] += delta)
    );
  }
}

export { Keyboard };
