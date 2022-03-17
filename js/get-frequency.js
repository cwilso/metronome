// generate an equal tempered frequency mapping
let equal_temperament_ratio = Math.pow(2, 1 / 12);

const A = 440;

function getFrequency(note, tuning = A) {
    console.log(note);
  // A is code 69 in MIDI, so we can simply calculate
  // the frequency based on that, and some tuning for A.
  let diff = note - 69;
  let frequency =
    tuning *
    (diff < 0
      ? 1 / equal_temperament_ratio ** -diff
      : equal_temperament_ratio ** diff);
  // Note that this means we can generate frequencies for
  // "virtual" MIDI notes, such as notes that have been
  // artificially shifted to below 0, or to above 127.
  return frequency;
}

export { getFrequency };
