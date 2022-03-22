import { getFrequency } from "./get-frequency.js";
import { context, master } from "./audio-context.js";

class AudioSource {
  static sourceList = [];

  static addSource(source) {
    this.sourceList.push(source);
    this.updatePolyphonyVolume();
  }

  static removeSource(source) {
    const pos = this.sourceList.findIndex((v) => v === source);
    this.sourceList.splice(pos, 1);
    this.updatePolyphonyVolume();
  }

  static updatePolyphonyVolume() {
    const mix = 1 / (1 + this.sourceList.length);
    this.getPolyphonyVolume().gain.setValueAtTime(mix, context.currentTime);
  }

  static getPolyphonyVolume() {
    if (!this.polyphonyVolume) {
      let polyphonyVolume = context.createGain();
      polyphonyVolume.gain.value = 1.0;
      polyphonyVolume.connect(master);
      this.polyphonyVolume = polyphonyVolume;
    }
    return this.polyphonyVolume;
  }

  static setGlobalLFO(lfo) {
    this.globalLFO = lfo;
    this.sourceList.forEach((oscillator) => {
      lfo.connect(oscillator.frequency);
    });
  }

  constructor(note, type, LFO) {
    this.type = type;
    this.note = note;
    this.base = getFrequency(note);
    this.detune = 1.012;

    // set up an oscillator.
    var oscillator = (this.oscillator = context.createOscillator());
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(this.base, context.currentTime);

    // set up a second oscillator!
    var oscillator2 = (this.oscillator2 = context.createOscillator());
    oscillator2.type = `triangle`;
    oscillator2.frequency.setValueAtTime(
      this.base * this.detune,
      context.currentTime
    );

    // is the frequency of this oscillator controlled
    LFO?.connect(oscillator.frequency);

    // we use a gain to control attack/decay
    var volume = (this.volume = context.createGain());
    volume.gain.value = 0;
    volume.connect(AudioSource.getPolyphonyVolume());
    oscillator.connect(volume);
    oscillator.start();

    var osc2 = (this.volume2 = context.createGain());
    osc2.gain.value = 0;
    osc2.connect(volume);
    oscillator2.connect(osc2);
    oscillator2.start();
  }

  toggleOsc2() {
    this.volume2.gain.value = this.volume2.gain.value < 1 ? 1 : 0;
  }

  tuneTowards(frequency, ratio) {
    const target = (1 - ratio) * this.base + ratio * frequency;
    this.oscillator.frequency.setValueAtTime(target, context.currentTime);
    this.oscillator2.frequency.setValueAtTime(target * this.detune, context.currentTime);
  }

  start(velocity, attack) {
    if (velocity > 1) { velocity /= 128; }
    this.sustained = true;
    if (this.timeout) this.__disable(0);
    this.__enable(velocity, attack);
  }

  __enable(velocity = 0.8, attack = 0.01) {
    // only add ourselves as new source if we weren't already active
    if (this.volume.gain === 0) AudioSource.addSource(this);
    this.volume.gain.setTargetAtTime(velocity, context.currentTime, attack);
  }

  stop(decay) {
    this.__disable(decay);
    this.sustained = false;
  }

  __disable(decay = 0.01) {
    this.timeout = clearTimeout(this.timeout);
    this.volume.gain.setTargetAtTime(0, context.currentTime, decay);
    AudioSource.removeSource(this);
  }

  play(durationInSeconds, velocity) {
    if (this.sustained) return;
    if (velocity > 1) { velocity /= 128; }
    this.__enable(velocity);
    this.timeout = setTimeout(() => this.__disable(), 1000 * durationInSeconds);
  }

  // TODO: some ADSR control would be nice, which would be another class-global gain node.
}

export { AudioSource };
