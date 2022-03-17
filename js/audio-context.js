// master audio context. We only want to build one, not contantly build new ones.
const context = new AudioContext();

// master volum control
const master = context.createGain();
master.gain.value = 1.0;
master.connect(context.destination);

export { context, master };
