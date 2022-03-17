import { AudioSource } from "./audio-source.js";
import { context } from "./audio-context.js";

class AudioGenerator {
  constructor(lfoFrequency, lfoStrength) {
    if (lfoFrequency && lfoStrength) {
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
  }

  setLFOFrequency(v) {
    this.lfoFrequency = v;
    this.lfo.frequency.value = v;
  }

  setLFOStrength(v) {
    this.lfoStrength = v;
    this.lfoGain.gain.value = v;
  }

  get(note, type = `triangle`) {
    return new AudioSource(type, note, this.lfoGain);
  }
}

export { AudioGenerator };
