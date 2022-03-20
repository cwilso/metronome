// master audio context. We only want to build one, not constantly build new ones.
const context = new AudioContext();

// master volume control
const master = context.createGain();
master.gain.value = 1.0;

// pre-destination filters: EQ and compressor
const compressor = context.createDynamicsCompressor();
compressor.threshold.value = -6;
compressor.knee.value = 40;
compressor.ratio.value = 12;
compressor.attack.value = 0.1;
compressor.release.value = 0.1;
compressor.connect(context.destination);

const bands = [
  [`low`, 0, 400],
  [`mid`, 400, 4000],
  [`high`, 4000, 14000],
];

const EQ = bands.map((band) => {
  const filter = context.createBiquadFilter();
  filter.type = `peaking`;
  const f = (band[1] + band[2]) / 2;
  const w = band[2] - band[1];
  filter.frequency.value = f;
  filter.Q.value = f / w;
  filter.gain.value = 0;
  return { label: band[0], node: filter };
});

const EQcontrols = EQ.map(({ label, node }) => {
  const slider = document.createElement(`input`);
  const props = {
    type: `range`,
    min: -24,
    max: 24,
    value: 0,
    step: 0.1,
    label,
  };
  Object.entries(props).forEach(([name, val]) =>
    slider.setAttribute(name, val)
  );
  slider.addEventListener(
    `input`,
    () => (node.gain.value = parseFloat(slider.value))
  );
  return slider;
});

// master -> EQ -> compressor -> output
for (let i = 0, e = EQ.length; i < e; i++) {
  if (i === 0) {
    master.connect(EQ[0].node);
  }

  if (i === e - 1) {
    EQ[i].node.connect(compressor);
  } else {
    let n1 = EQ[i].node,
      n2 = EQ[i + 1].node;
    n1.connect(n2);
  }
}

// we record the EQ's first node as the start of the output chain
const output = EQ[0].node;

// Some additional
let reverb;

async function setReverb(filepath) {
  if (reverb) reverb.disconnect();

  if (!filepath) {
    return master.connect(output);
  }

  reverb = context.createConvolver();
  const response = await fetch(`impulses/${filepath}.ogg`);
  const audioData = await response.arrayBuffer();
  reverb.buffer = await context.decodeAudioData(audioData);

  try {
    master.disconnect(output);
  } catch (e) {
    /* hmm */
  }
  master.connect(reverb);
  reverb.connect(output);
}

export { context, master, setReverb, EQcontrols };
