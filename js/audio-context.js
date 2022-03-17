// master audio context. We only want to build one, not contantly build new ones.
const context = new AudioContext();

// master volum control
const master = context.createGain();
master.gain.value = 1.0;
master.connect(context.destination);

let reverb;

async function setReverb(filepath) {
  if (reverb) reverb.disconnect();

  if (!filepath) {
    return master.connect(context.destination);
  }

  reverb = context.createConvolver();
  const response = await fetch(`impulses/${filepath}.ogg`);
  const audioData = await response.arrayBuffer();
  reverb.buffer = await context.decodeAudioData(audioData);

  try {
    master.disconnect(context.destination);
  } catch (e) {
    /* hmm */
  }
  master.connect(reverb);
  reverb.connect(context.destination);
}

export { context, master, setReverb };
