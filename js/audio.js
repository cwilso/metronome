var audioContext = null;
var isPlaying = false;		// Are we currently playing?
var startTime;				// The start time of the entire sequence.
var current16thNote = -1;	// What note is currently last scheduled?
var currentNoteStartTime = 0;	// When does the last currently scheduled note start playing? Used for visual tracking.
var tempo = 120.0;			// tempo (in beats per minute)
var lookahead = 20.0;		// How frequently to call scheduling function (in milliseconds)
var scheduleAhead = 1.5*lookahead/1000;	// How far ahead to schedule audio calls (in seconds)...
							//  This is calculated from lookahead, and overlaps with next interval
var bar = 0;				// keeping track of which bar we're in.
var nextNoteTime = 0.0;		// when the next note is due.
var noteResolution = 0;		// 0 == 16th, 1 == 8th, 2 == quarter note
var noteLength = 0.05;		// length of "beep" (in seconds)
var intervalID = 0;			// setInterval identifier.

function setupAudio() {
	audioContext = new webkitAudioContext();
	// if we wanted to load audio files, etc., this is where we should do it.
}

function nextNote() {
    // Advance current note and time by a 16th note...
    var secondsPerBeat = 60.0 / tempo;	// Notice this picks up the CURRENT tempo value to calculate beat length.

    current16thNote++;	// Advance the beat number, wrap to zero
    if (current16thNote == 16) {
        current16thNote = 0;
        bar++;	// increment the bar number.  Purely informational right now.
    }
    nextNoteTime += 0.25 * secondsPerBeat;	// Add the beat length to the last beat time.
}

function scheduleNote( beatNumber, time ) {
	currentNoteStartTime = time;	// just keeping track in order to show visuals.

	if ( (noteResolution==1) && (beatNumber%2))
		return;	// we're not playing non-8th 16th notes
	if ( (noteResolution==2) && (beatNumber%4))
		return;	// we're not playing non-quarter 8th notes

	// create an oscillator
	var osc = audioContext.createOscillator();
	osc.connect( audioContext.destination );
	if (! (beatNumber % 16) )	// beat 0 == low pitch
		osc.frequency.value = 220.0;
	else if (beatNumber % 4)	// quarter notes = medium pitch
		osc.frequency.value = 440.0;
	else						// other 16th notes = high pitch
		osc.frequency.value = 880.0;
	osc.start( time );
	osc.stop( time + noteLength );
}

function scheduler() {
	var sequenceTime = audioContext.currentTime - startTime;

	// while there are notes that will need to play before the next interval, 
	// schedule them and advance the pointer.
	while (nextNoteTime < sequenceTime + scheduleAhead ) {
		scheduleNote( current16thNote+1, startTime + nextNoteTime );
		nextNote();
	}
}

function play() {
	isPlaying = !isPlaying;

	if (isPlaying) { // start playing
		startTime = audioContext.currentTime;
		current16thNote = -1;
		nextNoteTime = 0.0;
		intervalID = window.setInterval( scheduler, lookahead );
		return "pause";
	} else {
		window.clearInterval( intervalID );
		return "play";
	}
}
