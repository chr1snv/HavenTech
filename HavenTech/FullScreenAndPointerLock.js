//transitions the rendering to fullscreen

//var fullScrCanvWidthElm  = document.getElementById('fullScrCanvWidth');
//var fullScrCanvHeightElm = document.getElementById('fullScrCanvHeight');
//var canvWidthElm = document.getElementById('canvWidth');
//var canvHeightElm = document.getElementById('canvHeight');

function EnterFullScreen(){
	//change the canvas resolution if in fullscreen or browser window mode
	document.addEventListener('fullscreenchange', (event) => {
		// document.fullscreenElement will point to the element that
		// is in fullscreen mode if there is one. If there isn't one,
		// the value of the property is null.
		if (document.fullscreenElement) {
			//console.log(`Element: ${document.fullscreenElement.id} entered full-screen mode.`);
			//set the canvas to the fullscreen resolution
			graphics.SetCanvasSize( fullScrCanvWidthElm.value, fullScrCanvHeightElm.value );
		} else {
			console.log('Leaving full-screen mode.');
			//set the canvas to the non fullscreen resolution
			graphics.SetCanvasSize( canvWidthElm.value, canvHeight.value );
		}
	});

	//enter fullscreen
	if(graphics.canvas.webkitRequestFullscreen)
	{
		graphics.canvas.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT);
	}else{
		graphics.canvas.requestFullscrn = 
			graphics.canvas.msRequestFullscreen ||
			graphics.canvas.requestFullscreen;
		
		promise = graphics.canvas.requestFullscreen();
		//alert("promise " + promise );
	}

}

//attempts to lock the mousepointer to the canvas to allow endlessly moving the mouse to rotate the camera
//(first person like mouse input)
var ptrLck = null;
function requestPointerLock(canvIn){
	var canvas = canvIn;

	//request mouse pointer lock
	canvas.rqstPtrLck = 
	canvas.requestPointerLock ||
	canvas.mozRequestPointerLock;

	ptrLck = canvas.rqstPtrLck(0);

//document.addEventListener("mousemove", updatePosition, false);
}
//release the mouse
function releasePointerLock(canvIn){
	//if( ptrLck ){
		canvIn.relPtrLck =
		canvIn.releasePointerCapture;

		canvIn.relPtrLck(0);
	//}
}

function ExitFullscreen(){

	var extFullScrn = 
	document.webkitExitFullscreen ||
	document.mozCancelFullScreen ||
	document.msExitFullscreen ||
	document.exitFullscreen;

	var extPtrLck =
	document.exitPointerLock    ||
	document.mozExitPointerLock;

	// Attempt to unlock
	extFullScrn();
	extPtrLck();

}
