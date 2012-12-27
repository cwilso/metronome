var audioContext = null;

function setupAudio() {
	audioContext = new webkitAudioContext();

/*
	var request = new XMLHttpRequest();
	request.open("GET", "sounds/techno.wav", true);
	request.responseType = "arraybuffer";
	request.onload = function() {
	  audioContext.decodeAudioData( request.response, function(buffer) { 
	    	technoBuffer = buffer;
	    	appendOutput( "Sound ready." );
		} );
	}
	request.send();
*/
}

var isPlaying = false;
var startTime;
var current16thNote = 0;
var tempo = 60.0;
var lookahead = 0.010;
var bar = 0;
var nextNoteTime = 0.0;
var maxSwingFactor = .08;
var swingFactor = 0.0;

function nextNote() {
    // Advance time by a 16th note...
    var secondsPerBeat = 60.0 / tempo;

    current16thNote++;
    if (current16thNote == 16) {
        current16thNote = 0;
        bar++;
    }

    // apply swing    
    if (current16thNote % 2) {
        nextNoteTime += (0.25 + maxSwingFactor * swingFactor) * secondsPerBeat;
    } else {
        nextNoteTime += (0.25 - maxSwingFactor * swingFactor) * secondsPerBeat;
    }
}

function scheduleNote( beatNumber, time ) {
	var osc = audioContext.createOscillator();
	osc.connect( audioContext.destination );
	if (beatNumber % 4)
		osc.frequency.value = 880.0;
	osc.start( time );
	osc.stop( time + 0.05 );
}

function schedule() {
	var sequenceTime = audioContext.currentTime - startTime;

	while (nextNoteTime < sequenceTime + lookahead ) {
		scheduleNote( current16thNote, startTime + nextNoteTime );
		console.log( "scheduled beat " + current16thNote + " at t=" + nextNoteTime + " sec.");
		nextNote();
	}
	console.log("-");
}

var intID = 0;

function play() {
	isPlaying = !isPlaying;

	if (isPlaying) { // start playing
		startTime = audioContext.currentTime;
		current16thNote = 0;
		nextNoteTime = 0.0;
		intID = window.setInterval( schedule, lookahead * 500 );
		return "pause";
	} else {
		window.clearInterval( intID );
		return "play";
	}
}
