import { router } from "./router.js";
import { AudioGenerator } from "./audio-generator.js";

const lfoFrequency = 3;
const beeps = new AudioGenerator(lfoFrequency);

// MIDI "only" has 128 real keys
const MIDI_KEYS = [...Array(128)].map((_, i) => i);

function domNode(note) {
  let e = document.createElement(`button`);
  let label = note % 12 === 0 ? note / 12 : ``;
  e.textContent = label;
  let color = [1, 3, 6, 8, 10].indexOf(note % 12) > -1 ? `black` : `white`;
  e.classList.add(color, `key`);
  return e;
}

/**
 * individual key class
 */
class Key {
  constructor(note) {
    this.pressed = false;
    this.note = note;
    this.beep = beeps.get(note);
    this.e = domNode(note);
    router.addListener(this, `noteon`);
    router.addListener(this, `noteoff`);
  }

  getDOMnode() {
    return this.e;
  }

  onNoteOn(note, velocity) {
    if (note === this.note) {
      this.pressed = true;
      this.e.classList.add(`pressed`);
      this.beep.start(velocity / 127);
    }
  }

  onNoteOff(note) {
    if (note === this.note) {
      this.pressed = false;
      this.e.classList.remove(`pressed`);
      this.beep.stop();
    }
  }
}

/**
 * The full keyboard, but you only get to see 24 keys at a time.
 */
class Keyboard {
  constructor(makeActive = false) {
    this.keys = MIDI_KEYS.map((note) =>
      new Key(note).getDOMnode()
    );
    if (makeActive || !Keyboard.actgive) Keyboard.active = this;
  }

  getKeyNodes() {
    return this.keys;
  }
}

export { Keyboard };
