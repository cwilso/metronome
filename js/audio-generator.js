import { AudioSource } from "./audio-source.js";
import { context } from "./audio-context.js";
import { router } from "./router.js";

const sources = {};

class AudioGenerator {
  constructor(lfoFrequency, lfoStrength = 0) {
    if (lfoFrequency) {
      this.lfoFrequency = lfoFrequency;
      this.lfoStrength = lfoStrength;
      this.setupLFO();
    }
  }

  setupLFO() {
    // set up the low frequency oscillator
    let LFO = context.createOscillator();
    LFO.type = "sine";
    LFO.frequency.value = this.lfoFrequency;
    this.lfo = LFO;

    // and hook it up to its own gain
    var LFOGain = context.createGain();
    LFOGain.gain.value = this.lfoStrength;
    this.lfoGain = LFOGain;

    // hook it up and start the LFO
    LFO.connect(LFOGain);
    LFO.start();

    // and listen for the MIDI "mod wheel" event
    router.addListener(this, `modwheel`);
  }

  onModWheel(value) {
    this.setLFOStrength(value / 127);
  }

  setLFOFrequency(v) {
    this.lfoFrequency = v;
    this.lfo.frequency.setValueAtTime(v, context.currentTime + 0.01);
  }

  setLFOStrength(v) {
    this.lfoStrength = v;
    this.lfoGain.gain.setValueAtTime(v, context.currentTime + 0.01);
  }

  get(note, type = `sawtooth`) {
    const id = `${note}${type}`;
    if (!sources[id]) sources[id] = new AudioSource(note, type, this.lfoGain);
    return sources[id];
  }

  toggleOsc2() {
    console.log(`toggle...`);
    Object.entries(sources).forEach(([id, source]) => source.toggleOsc2());
  }
}

window.AudioGenerator = AudioGenerator;

export { AudioGenerator };
