
function TouchScreenControls(canvIn){

	this.canv = canvIn;

	this.movementDelta = new Float32Array(2);
	this.lookDelta     = new Float32Array(2);
	this.movementTouch = null; //the touch controlling the onscreen movement joystick
	this.lookTouch     = null; //the touch controlling the look direction
	//clientX (browser viewport relative)
	//screenX (left edge of screen relative y is top relative)
	//pageX (includes scroll offset)
	this.OnTouchStart = function(e){
		for(let i = 0; i < e.touches.length; ++i){
			//new touch
			e.touches[i].type = 'mousedown';
			e.touches[i].offsetX = e.touches[i].screenX;
			e.touches[i].offsetY = e.touches[i].screenY;
			handleMouseMove( e.touches[i] );
			if(		  !touch.movementTouch && 
				e.touches[i].screenX < window.screen.width * floatP5){
				touch.movementTouch = e.touches[i];
			}else if( !touch.lookTouch && 
				e.touches[i].screenX > window.screen.width * floatP5){
				touch.lookTouch = e.touches[i];
			}
		}
	}

	this.OnTouchMove = function(e){
		e.preventDefault();
		for(let i = 0; i < e.touches.length; ++i){
		
			e.touches[i].type = 'mousemove';
			e.touches[i].offsetX = e.touches[i].screenX;
			e.touches[i].offsetY = e.touches[i].screenY;
			handleMouseMove( e.touches[i] );
			
			if( touch.movementTouch  && 
				touch.movementTouch.identifier == e.touches[i].identifier ){
				touch.movementDelta[0] += e.touches[i].screenX - touch.movementTouch.screenX;
				touch.movementDelta[1] += e.touches[i].screenY - touch.movementTouch.screenY;
				touch.movementTouch = e.touches[i];
			}
			else if( touch.lookTouch &&
				touch.lookTouch.identifier == e.touches[i].identifier ){
				touch.lookDelta[0] += e.touches[i].screenX - touch.lookTouch.screenX;
				touch.lookDelta[1] += e.touches[i].screenY - touch.lookTouch.screenY;
				touch.lookTouch = e.touches[i];
			}
		}
	}

	this.OnTouchCancel = function(e){
		for(let i = 0; i < e.touches.length; ++i){
			if( touch.movementTouch.identifier == e.touches[i].identifier ){
				touch.movementTouch = null;
				touch.movementDelta[0] = 0;
				touch.movementDelta[1] = 0;
			}
			if( touch.lookTouch.identifier == e.touches[i].identifier ){
				touch.lookTouch = null;
				touch.lookDelta[0] = 0;
				touch.lookDelta[1] = 0;
			}
		}
	}

	this.OnTouchEnd = function(e){
		let movementTouchCancelled = true;
		let lookTouchCancelled = true;
		for(let i = 0; i < e.touches.length; ++i){
			if( touch.movementTouch.identifier == e.touches[i].identifier ){
				movementTouchCancelled = false;
			}
			if( touch.lookTouch.identifier == e.touches[i].identifier ){
				lookTouchCancelled = false;
			}
		}
		if(movementTouchCancelled){
			touch.movementTouch = null;
			touch.movementDelta[0] = 0;
			touch.movementDelta[1] = 0;
		}
		if(lookTouchCancelled){
			touch.lookTouch = null;
			touch.lookDelta[0] = 0;
			touch.lookDelta[1] = 0;
		}

	}

	this.InitTouchListener = function(){
		this.canv.addEventListener( "touchstart",  this.OnTouchStart,  false);
		this.canv.addEventListener( "touchmove",   this.OnTouchMove,   false);
		this.canv.addEventListener( "touchcancel", this.OnTouchCancel, false);
		this.canv.addEventListener( "touchend",    this.OnTouchEnd,    false);
	}

	this.InitTouchListener();

}
