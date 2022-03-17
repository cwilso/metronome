// generate an equal tempered frequency mapping
const EQUAL_TEMPERAMENT_RATIO = Math.pow(2, 1 / 12);
const EQUAL_TEMPERAMENT = function (v) {
  if (v < 0) {
    return 1 / EQUAL_TEMPERAMENT_RATIO ** -v;
  }
  return EQUAL_TEMPERAMENT_RATIO ** v;
};

const A = 440;

function getFrequency(note, center = A, map = EQUAL_TEMPERAMENT) {
  // A is code 69 in MIDI, so we can simply calculate
  // the frequency based on that, and some tuning for A.
  let diff = note - 69;
  let frequency = center * map(diff);
  // Note that this means we can generate frequencies for
  // "virtual" MIDI notes, such as notes that have been
  // artificially shifted to below 0, or to above 127.
  return frequency;
}

export { getFrequency };
