var canvas,       // the canvas element
  canvasContext;  // canvasContext is the canvas' context 2D
var last16thNoteDrawn = 0;

// shim the requestAnimationFrame API, with setTimeout fallback
window.requestAnimFrame = (function(){
  return  window.requestAnimationFrame       ||
  window.webkitRequestAnimationFrame ||
  window.mozRequestAnimationFrame    ||
  window.oRequestAnimationFrame      ||
  window.msRequestAnimationFrame     ||
  function( callback ){
    window.setTimeout(callback, 1000 / 60);
  };
})();

function resetCanvas (e) {
  // resize the canvas - but remember - this clears the canvas too.
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  //make sure we scroll to the top left.
  window.scrollTo(0,0); 
}

function draw() {
  var currentNote = last16thNoteDrawn;

  // Check to make sure that the next note has actually started playing
  // (Note that we're checking against the live audio clock here.)
  if (audioContext.currentTime >= currentNoteStartTime )
    currentNote = current16thNote;

  if (last16thNoteDrawn != currentNote) {
    var x = Math.floor( canvas.width / 18 );
    canvasContext.clearRect(0,0,canvas.width, canvas.height); 
    for (var i=0; i<16; i++) {
      canvasContext.fillStyle = ( currentNote == i ) ? ((currentNote%4 == 0)?"red":"blue") : "black";
      canvasContext.fillRect( x * (i+1), x, x/2, x/2 );
    }
    last16thNoteDrawn = currentNote;

  //c.fillText("hello", 0,0); 
  }
  requestAnimFrame(draw);
}

function setupCanvas() {
  var   container = document.createElement( 'div' );
  container.className = "container";

  canvas = document.createElement( 'canvas' );
  canvasContext = canvas.getContext( '2d' );
  canvas.width = window.innerWidth; 
  canvas.height = window.innerHeight; 
  document.body.appendChild( container );
  container.appendChild(canvas);	

  canvasContext.strokeStyle = "#ffffff";
  canvasContext.lineWidth =2;
}

function init(){
  setupCanvas();
  setupAudio();

  window.onorientationchange = resetCanvas;
  window.onresize = resetCanvas;

  requestAnimFrame(draw);
}

window.addEventListener("load", init );
