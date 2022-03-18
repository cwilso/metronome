import { router } from "./router.js";
import { AudioGenerator } from "./audio-generator.js";
import { getFrequency } from "./get-frequency.js";

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

    // FIXME: temporary mouse input, this needs to be handled better based
    // on whether a button is down or up, not whether "a mouse did a thing".
    this.e.addEventListener(`mousedown`, (evt) => {
      this.play(0.8 * 127);
    });
    document.addEventListener(`mouseup`, (evt) => {
      this.stop();
    });
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
    this.keys = MIDI_KEYS.map((note) => new Key(note).getDOMnode());
    if (makeActive || !Keyboard.active) Keyboard.active = this;
  }

  getKeyNodes() {
    return this.keys;
  }
}

export { Keyboard };
