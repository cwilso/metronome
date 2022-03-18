/**
 * see http://www.gweep.net/~prefect/eng/reference/protocol/midispec.html
 */
const STATUS_TYPES = [
  false,
  false, // It'd be great if this was the mod wheel, but that's CC=1
  false,
  false,
  false,
  false,
  false,
  false, // 0-7 are nothing
  `NoteOff`, // 8: Note Off
  `NoteOn`, // 9: Note On
  `AfterTouch`, // A: AfterTouch
  `Control`, // B: Control Change
  `Program`, // C: Program/Patch Change
  `Pressure`, // D: Channel Pressure
  `Pitch`, // E: Pitch Wheel
  `System`, // F: 0-7: System Common, 8-F: System Realtime. Note that {4,5,9,D} are unused.
];

export { STATUS_TYPES };
