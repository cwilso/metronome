
// shim layer with setTimeout fallback
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

var canvas,
  c, // c is the canvas' context 2D
  container;

function resetCanvas (e) {
  // resize the canvas - but remember - this clears the canvas too.
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  //make sure we scroll to the top left.
  window.scrollTo(0,0); 
}

var last16thNote = 0;

function draw() {
  var currentNote = (audioContext.currentTime >= currentNoteStartTime ) ? current16thNote : last16thNote;

  if (last16thNote != currentNote) {
    var x = Math.floor( canvas.width / 18 );
    c.clearRect(0,0,canvas.width, canvas.height); 
    for (var i=0; i<16; i++) {
      c.fillStyle = ( currentNote == i ) ? ((currentNote%4 == 0)?"red":"blue") : "black";
      c.fillRect( x * (i+1), x, x/2, x/2 );
    }
    last16thNote = currentNote;

  //c.fillText("hello", 0,0); 
  }
  requestAnimFrame(draw);
}

function setupCanvas() {

  canvas = document.createElement( 'canvas' );
  c = canvas.getContext( '2d' );
  container = document.createElement( 'div' );
  container.className = "container";

  canvas.width = window.innerWidth; 
  canvas.height = window.innerHeight; 
  document.body.appendChild( container );
  container.appendChild(canvas);	

  c.strokeStyle = "#ffffff";
  c.lineWidth =2;
}

function init(){
  setupCanvas();
  setupAudio();

  window.onorientationchange = resetCanvas;
  window.onresize = resetCanvas;

  requestAnimFrame(draw);
}

window.addEventListener("load", init );
