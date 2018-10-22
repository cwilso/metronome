var timerID=null;
var interval=100;

self.onmessage=function(e){
	if (e.data=="start") {
		console.log("starting");
		timerID=setInterval(function(){postMessage("tick");},interval)
	}
	else if (e.data.interval) {
		console.log("setting interval");
		interval=e.data.interval;
		console.log("interval="+interval);
		if (timerID) {
			clearInterval(timerID);
			timerID=setInterval(function(){postMessage("tick");},interval)
		}
	}
	else if (e.data=="stop") {
		console.log("stopping");
		clearInterval(timerID);
		timerID=null;
	}
};

////
function createBinaryString(nMask) {
  // nMask must be between -2147483648 and 2147483647
  for (var nFlag = 0, nShifted = nMask, sMask = ''; nFlag < 32;
       nFlag++, sMask += String(nShifted >>> 31), nShifted <<= 1);
  return sMask;
}

var string1 = createBinaryString(11);
var string2 = createBinaryString(4);
var string3 = createBinaryString(1);

//alert(string1);
// prints 00000000000000000000000000001011, i.e. 11

postMessage('hi there');
//for (var i = 0; i < 32; i++) {
  //  postMessage(("hello".charCodeAt(0) << i).toString(2));
//}

postMessage(createBinaryString("hello".charCodeAt(0)));

