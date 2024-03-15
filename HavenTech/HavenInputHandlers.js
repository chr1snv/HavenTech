//HavenInputHandlers.js

mCoords     = {x:0, y:0};
mDown       = false;
mDownCoords = {x:0, y:0}; 


function PointerHandler(canvIn){

	this.queuedEvents = [];
	
	function queueTouches(evtType, e, btns){
		for (let i=0; i < e.changedTouches.length; i++) {
			let t = e.changedTouches[i];
			let evt = {type:evtType, buttons:btns, 
				X:t.canvasX, Y:t.canvasY};
			e.target.pointerHandler.queuedEvents.push( evt );
		}
	}

	function canvasTouchEndHandler(e){
		mDown = false;
		e.preventDefault();
		convertTouchesToMouseCoords(e);
		queueTouches('Up', e, 0);
	}

	function canvasTouchMoveHandler(e){
		mDown = true;
		e.preventDefault();
		convertTouchesToMouseCoords(e);
		queueTouches('Move', e, 1);
	}

	function canvasTouchStartHandler(e){
		mDown = true;
		e.preventDefault();
		convertTouchesToMouseCoords(e);
		queueTouches('Down', e, 1);
	}

	function convertTouchesToMouseCoords(e){
		var touches = e.changedTouches;
		for (let i=0; i < touches.length; i++) {
		    e.target.relMouseCoords(touches[i], touches[i].pageX, touches[i].pageY);
		}
	}

	function canvasMouseDownHandler(e){
		mDownCoords.x = e.offsetX;
		mDownCoords.y = e.offsetY;
		mDown = true;
		e.target.relMouseCoords(e, e.pageX, e.pageY);
		let evt = {type:'Down', buttons:event.buttons,
				X:e.canvasX, Y:e.canvasY};
		e.target.pointerHandler.queuedEvents.push( evt );
	}
	function canvasMouseUpHandler(e){
		mDown = false;
		e.target.relMouseCoords(e, e.pageX, e.pageY);
		let evt = {type:'Up', buttons:e.buttons, 
				X:e.canvasX, Y:e.canvasY};
			e.target.pointerHandler.queuedEvents.push( evt );
	}
	function canvasMouseMoveHandler(e){
		mCoords.x = e.offsetX;
		mCoords.y = e.offsetY;
		e.target.relMouseCoords(e, e.pageX,e.pageY);
		let evt = {type:'Move', buttons:event.buttons, 
				X:e.canvasX, Y:e.canvasY};
		e.target.pointerHandler.queuedEvents.push( evt );
	}

	//register the canvas mouse move callback
    canvIn.onmousedown = canvasMouseDownHandler;
    canvIn.onmousemove = canvasMouseMoveHandler;
    canvIn.onmouseup   = canvasMouseUpHandler;
    canvIn.onmouseout  = canvasMouseUpHandler;

    canvIn.ontouchstart  = canvasTouchStartHandler;
    canvIn.ontouchmove = canvasTouchMoveHandler;
    canvIn.ontouchend    = canvasTouchEndHandler;

	canvIn.pointerHandler = this;
}

//mouse cordinates for canvas
//http://stackoverflow.com/questions/55677/how-do-i-get-the-coordinates-of-a-mouse-click-on-a-canvas-element
function relMouseCoords(e, eX,eY){
	if(e.offsetX && e.offsetY){
		e.canvasX = e.offsetX;
		e.canvasY = e.offsetY;
	}

	
	if(document.fullscreenElement){
		//if( window.orientation == 0 ) //portrait
		let minY = e.target.screenWidth / 
		
		e.canvasX = e.screenX / window.screen.width * e.target.width;
		e.canvasY = e.screenY / window.screen.height * e.target.height;
		return;
	}
	

    let totalOffsetX = 0;
    let totalOffsetY = 0;
    let canvasX = 0;
    let canvasY = 0;
    let currentElement = this;
    
    do{
        totalOffsetX += currentElement.offsetLeft - currentElement.scrollLeft;
        totalOffsetY += currentElement.offsetTop - currentElement.scrollTop;
    }
    while(currentElement = currentElement.offsetParent)
        
    e.canvasX = eX - totalOffsetX;
    e.canvasY = eY - totalOffsetY;
}
HTMLCanvasElement.prototype.relMouseCoords = relMouseCoords;



function registerKeyHandlers(){
	//register the canvas keypress callback
    document.onkeydown                                  = pageKeyDownHandler;
    document.onkeyup                                    = pageKeyUpHandler;
}

keys        = {};

function pageKeyDownHandler(e){
    var keyCode = e.keyCode;
    keys[keyCode] = true;
}
function pageKeyUpHandler(e){
    var keyCode = e.keyCode;
    keys[keyCode] = false;
}

//https://gist.github.com/cjcliffe/1185173
keyCodes = {
      BACKSPACE: 8,
      TAB: 9,
      ENTER: 13,
      SHIFT: 16,
      CTRL: 17,
      ALT: 18,
      PAUSE: 19,
      CAPS_LOCK: 20,
      ESCAPE: 27,
      SPACE: 32,
      PAGE_UP: 33,
      PAGE_DOWN: 34,
      END: 35,
      HOME: 36,
      LEFT_ARROW: 37,
      UP_ARROW: 38,
      RIGHT_ARROW: 39,
      DOWN_ARROW: 40,
      INSERT: 45,
      DELETE: 46,
      KEY_0: 48,
      KEY_1: 49,
      KEY_2: 50,
      KEY_3: 51,
      KEY_4: 52,
      KEY_5: 53,
      KEY_6: 54,
      KEY_7: 55,
      KEY_8: 56,
      KEY_9: 57,
      KEY_A: 65,
      KEY_B: 66,
      KEY_C: 67,
      KEY_D: 68,
      KEY_E: 69,
      KEY_F: 70,
      KEY_G: 71,
      KEY_H: 72,
      KEY_I: 73,
      KEY_J: 74,
      KEY_K: 75,
      KEY_L: 76,
      KEY_M: 77,
      KEY_N: 78,
      KEY_O: 79,
      KEY_P: 80,
      KEY_Q: 81,
      KEY_R: 82,
      KEY_S: 83,
      KEY_T: 84,
      KEY_U: 85,
      KEY_V: 86,
      KEY_W: 87,
      KEY_X: 88,
      KEY_Y: 89,
      KEY_Z: 90,
      LEFT_META: 91,
      RIGHT_META: 92,
      SELECT: 93,
      NUMPAD_0: 96,
      NUMPAD_1: 97,
      NUMPAD_2: 98,
      NUMPAD_3: 99,
      NUMPAD_4: 100,
      NUMPAD_5: 101,
      NUMPAD_6: 102,
      NUMPAD_7: 103,
      NUMPAD_8: 104,
      NUMPAD_9: 105,
      MULTIPLY: 106,
      ADD: 107,
      SUBTRACT: 109,
      DECIMAL: 110,
      DIVIDE: 111,
      F1: 112,
      F2: 113,
      F3: 114,
      F4: 115,
      F5: 116,
      F6: 117,
      F7: 118,
      F8: 119,
      F9: 120,
      F10: 121,
      F11: 122,
      F12: 123,
      NUM_LOCK: 144,
      SCROLL_LOCK: 145,
      SEMICOLON: 186,
      EQUALS: 187,
      COMMA: 188,
      DASH: 189,
      PERIOD: 190,
      FORWARD_SLASH: 191,
      GRAVE_ACCENT: 192,
      OPEN_BRACKET: 219,
      BACK_SLASH: 220,
      CLOSE_BRACKET: 221,
      SINGLE_QUOTE: 222
    };
