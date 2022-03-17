import { getFrequency } from "./get-frequency.js";
import { context, master } from "./audio-context.js";

class AudioSource {
  constructor(type, note, lfoGain) {
    this.master = master;
    this.type = type;
    this.note = note;

    // set up an oscillator.
    var oscillator = (this.oscillator = context.createOscillator());
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(
      getFrequency(note),
      context.currentTime
    );

    if (AudioSource.globalLFO) {
      AudioSource.globalLFO.connect(oscillator.frequency);
    }

    // we use a gain to control attack/decay
    var volume = (this.volume = context.createGain());
    volume.gain.value = 0;

    if (lfoGain) {
      lfoGain.connect(oscillator.frequency);
    }

    oscillator.connect(volume);
    volume.connect(master);
    oscillator.start();
  }

  start(velocity, attack = 0.01) {
    AudioSource.sourceList.push(this);
    this.volume.gain.value = 0;
    this.volume.gain.setTargetAtTime(velocity, context.currentTime, attack);
  }

  stop(decay = 0.01) {
    this.volume.gain.setTargetAtTime(0, context.currentTime, decay);
  }
}

AudioSource.sourceList = [];

AudioSource.setGlobalLFO = (lfo) => {
  AudioSource.globalLFO = lfo;
  AudioSource.sourceList.forEach((oscillator) => {
    lfo.connect(oscillator.frequency);
  });
};

export { AudioSource };
