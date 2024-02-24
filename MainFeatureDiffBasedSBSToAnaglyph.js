

var image = new Image();

//get the context of the original image canvas'
var lCanv = document.getElementById('leftCanv');
var lCtx = lCanv.getContext('2d');
lCanv.width = 400;
lCanv.height = 600;
var rCanv = document.getElementById('rightCanv');
var rCtx = rCanv.getContext('2d');
rCanv.width = 400;
rCanv.height = 600;

//get the context of the histogram canvas'
var lHistCanv = document.getElementById('leftHistCanv');
var lHCtx = lHistCanv.getContext('2d');
lHistCanv.width = 400;
lHistCanv.height = 100;
var rHistCanv = document.getElementById('rightHistCanv');
var rHCtx = rHistCanv.getContext('2d');
rHistCanv.width = 400;
rHistCanv.height = 100;

var lEdgHistCanv = document.getElementById('lEdgHistCanv');
var lEdgHCtx = lEdgHistCanv.getContext('2d');
lEdgHistCanv.width = 400;
lEdgHistCanv.height = 100;
var rEdgHistCanv = document.getElementById('rEdgHistCanv');
var rEdgHCtx = rEdgHistCanv.getContext('2d');
rEdgHistCanv.width = 400;
rEdgHistCanv.height = 100;


//get the context of the edge detection canvas
var ledgeCanv = document.getElementById('ledgeCanv');
var leCtx = ledgeCanv.getContext('2d');
ledgeCanv.width = 400;
ledgeCanv.height = 600;
var redgeCanv = document.getElementById('redgeCanv');
var reCtx = redgeCanv.getContext('2d');
redgeCanv.width = 400;
redgeCanv.height = 600;

//get the context of the feature display canvas
var lFetCanvas = document.getElementById('lFetCanvas');
var lFCtx = lFetCanvas.getContext('2d');
lFetCanvas.width = 400;
lFetCanvas.height = 200;
leftFeatureOctTree = null;
var rFetCanvas = document.getElementById('rFetCanvas');
var rFCtx = rFetCanvas.getContext('2d');
rFetCanvas.width = 400;
rFetCanvas.height = 200;

//get the context of the anaglyph display canvas
var anaglyphCanvas = document.getElementById('anaglyphCanvas');
var aCtx = anaglyphCanvas.getContext('2d');
anaglyphCanvas.width = 400;
anaglyphCanvas.height = 600;

var octTreeDivLogElm = document.getElementById('octTreeDivLog');

function havenMain()
{
	CreateDebugTabsOnPage();
	update = setInterval(CanvasUpdate, 60);
	lFetCanvas.onmousemove = handleMouseMove;
	lFetCanvas.onmousedown = handleMouseMove;
	lFetCanvas.onmouseup   = handleMouseMove;
};
//window.onload = setup;

function runConverter()
{
	//event.preventDefault();

	let numTimesToDownsample = document.getElementById("downsampleTimes").value;

	image.onload = function() { 
		//seperate the sbs image into left and right images
		
		//get grayscale seperated images
		lCtx.filter = 'grayscale(1)';
		rCtx.filter = 'grayscale(1)';
		lCtx.drawImage(image,0,0,lCanv.width*2,lCanv.height);
		rCtx.drawImage(image,-rCanv.width,0,rCanv.width*2,rCanv.height);
		let imgDatL = lCtx.getImageData(0, 0, lCanv.width, lCanv.height);
		let imgDatR = rCtx.getImageData(0, 0, rCanv.width, rCanv.height);
		//convert the gray filtered rgb images to single channel image format
		let gryImgL = new Uint8Image(imgDatL.width, imgDatL.height, 1, imgDatL);
		let gryImgR = new Uint8Image(imgDatR.width, imgDatR.height, 1, imgDatR);
		
		//generate the luminance histograms
		drawHistogram( lHCtx, gryImgL, ['L Brightness'], [0] );
		drawHistogram( rHCtx, gryImgR, ['R Brightness'], [0] );
		
		//x, y coordinate multiplier to get original pixel cordinates from
		//downsampled image coordinates
		let downSampleMultiplier = Math.pow(2,numTimesToDownsample);

		//down sample the images
		let dwnSampldGryImgL = gryImgL;
		let dwmSampldGryImgR = gryImgR;
		for(let i = 0; i < numTimesToDownsample; ++i){
			dwnSampldGryImgL = DownSampleImage(dwnSampldGryImgL);
			dwmSampldGryImgR = DownSampleImage(dwmSampldGryImgR);
		}
		
		//preform edge detection, feature detection, feature correlation, 
		//best correlation set choosing, and transformation from one to the other
		let rToLImageRotMatRotPtOffsetXY = 
			GenIntraImageTransform(dwnSampldGryImgL, dwmSampldGryImgR, downSampleMultiplier);
		
		let combinedImgd = CombineRightAndLeftImages(gryImgL, gryImgR, rToLImageRotMatRotPtOffsetXY, downSampleMultiplier );

	aCtx.putImageData(combinedImgd, 0, 0);
	}
	console.log("image onload function set");

	let imageFileInput = document.getElementById('imageFile');
	if( imageFileInput.files.length > 0 )
		image.src = URL.createObjectURL(imageFileInput.files[0]);
	else
		image.src = 'rawSBSImages/20190118_094811.jpg';
	console.log("imageSrc set");
}

function setDefaultSettings(){
	document.getElementById('featureThresholdInput').value = 30;
	document.getElementById('featCorsMatchThresholdInput').value = 3500;
	document.getElementById('maxNumCorrespondanceSets').value = 20;
	document.getElementById('downsampleTimes').value = 2;
}

sbsImage = document.getElementById("sbsImage");

function printMousePos(event){
	xPos = event.offsetX;//clientX;// - canvas.x;
	yPos = event.offsetY;//clientY;// - canvas.y;
	document.getElementById("numCorespText").innerHTML =
		"clientX: " + xPos +
		" - clientY: " + yPos;
}
//canvas.addEventListener("click", printMousePos);

const numFramesToHighlightGraphObjs = 30;

let lastMovedFeaturePix = undefined;
let avgMoveSum = [0,0,0];
let prevMouseMoveFeaturePixPos = [0,0,0];
const DblPrssMaxSecs = 0.8;
let lastEmptySpacePressTime = -1;
let queuedMouseEvents = [];
function handleMouseMove(event){
	if(simPhys){
		DTPrintf( "queing mouseEvt " + event.type, "mouse" );
		let evt = {type:event.type, buttons:event.buttons, 
			offsetX:event.offsetX, offsetY:event.offsetY};
		queuedMouseEvents.push( evt );
	}
}
function preformMouseEvent(event){
	DTPrintf( "mouseEvt " + event.type, "mouse", "color:pink" );
	if(!leftFeatureOctTree)
		return;
	
	xPos = event.offsetX;
	yPos = event.offsetY;
	//console.log('x ' + xPos + ' y ' + yPos );
	
	let mRay = new Ray(origin=[xPos, yPos, 1], direction=[0,0,-1]);
	let minTraceTime = 0;
	let retVal_feature = [0, null];
	let startNode = leftFeatureOctTree.SubNode( mRay.origin );
	if( startNode ){
		//console.log('startNode ' + startNode.AABB.minCoord + ' ' + startNode.AABB.maxCoord  + ' d ' + startNode.depth );
		startNode.Trace( retVal_feature, mRay, minTraceTime );
	}
	
	
	//for( let n in mRay.visitedNodes ){
	//	mRay.visitedNodes[n].DebugDraw(lFCtx);
		//mRay.visitedNodes[n].Update(time);
	//}
	
	if( event.type == 'mousemove' || event.type == 'mouseup' )
		retVal_feature[1] = lastMovedFeaturePix;
	else
		lastMovedFeaturePix = undefined;
		
	if( retVal_feature[1] != null ){
	
		//highlight the objects and 
		if( retVal_feature[1].physObj.physGraph ){
			retVal_feature[1].physObj.physGraph.OutlineAllPairsInGraph( numFramesToHighlightGraphObjs );
		//disconnect from the physgraph
			retVal_feature[1].physObj.physGraph.RemoveObjConstraintsFromGraph( retVal_feature[1].physObj, {PHYS_INTERPEN:1, PHYS_SURFCOLIS:1} );
			retVal_feature[1].physObj.physGraph = undefined;
		}
		
		let featurePix = retVal_feature[1];
		let feature = featurePix.feature;
		lFCtx.font = '5pt arial';
		lFCtx.fillStyle = '#ccFFaa';
		//let text = feature.x + ' ' + feature.y;
		let text = featurePix.AABB.minCoord[0] + ' ' + featurePix.AABB.minCoord[1];
		lFCtx.fillText( text, featurePix.AABB.minCoord[0], featurePix.AABB.maxCoord[1] );
		DTPrintf( featurePix.uid.val, "mouse" );
		if( event.buttons > 0 ){ //button pressed
			let dblPressTime = time - featurePix.lastPressTime;
			if( event.type == 'mousedown' ){
				Vect3_Copy( prevMouseMoveFeaturePixPos, featurePix.physObj.AABB.center );
				if( dblPressTime > 0 && dblPressTime < DblPrssMaxSecs ){
					featurePix.RemoveFromOctTree();
				}
				featurePix.lastPressTime = time;
			}else if( event.type == 'mousemove' ){
				Vect3_Copy( prevMouseMoveFeaturePixPos, featurePix.physObj.AABB.center );
				let offset = Vect3_CopyNew( featurePix.physObj.AABB.center );
				offset[0] = event.offsetX - offset[0];
				offset[1] = event.offsetY - offset[1];
				offset[2] = 0;
				
				avgMoveSum[0] = avgMoveSum[0] * 0.9 + offset[0] * 0.5;
				avgMoveSum[1] = avgMoveSum[1] * 0.9 + offset[1] * 0.5;
				avgMoveSum[2] = 0;
				DTPrintf("avgMoveSum " + Vect_ToFixedPrecisionString(avgMoveSum,3), "mouse" );
				
				featurePix.physObj.AABB.OffsetPos( offset );
				Vect3_Zero( featurePix.physObj.linVel );
				featurePix.physObj.physGraph = undefined;
				featurePix.physObj.resting = false;
				//console.log( "event offsetPos " + offset + 
				//" eventmove position " + featurePix.physObj.AABB.center );
			}
			lastMovedFeaturePix = retVal_feature[1];
		}else if( event.type == 'mouseup' ){
			let featurePixCntr = Vect3_CopyNew( featurePix.physObj.AABB.center );
			DTPrintf("avgMoveSum " + avgMoveSum + 
			" featurePixCntr " + featurePixCntr +
			" linVel " + featurePix.physObj.linVel, "mouse" );
			featurePix.physObj.linVel[0] = avgMoveSum[0] * 1/dT;
			featurePix.physObj.linVel[1] = avgMoveSum[1] * 1/dT;
			featurePix.physObj.linVel[2] = 0;
			avgMoveSum = Vect3_NewZero();
			DTPrintf("eventup offset " + event.offsetX + " " + event.offsetY + 
					" linVel " + Vect_ToFixedPrecisionString(featurePix.physObj.linVel, 3) +
					" avgMoveSum " + Vect_ToFixedPrecisionString(avgMoveSum, 3) +
					" featurePix linVel " + Vect_ToFixedPrecisionString(featurePix.physObj.linVel, 3) +
					" uid " + featurePix.uid.val
						, "mouse", "color:purple" );
		}
	
	}else{
		//clicked on empty space
		if( event.type == 'mousedown' ){
			let dblPressTime = time - lastEmptySpacePressTime;
			if( dblPressTime > 0 && dblPressTime < DblPrssMaxSecs ){
				DTPrintf("insert at pos " + event.offsetX + ":" + event.offsetY, "add obj" );
				let newFeaturePix = InsertFeaturePixAtCoord( 
					event.offsetX, event.offsetY, 
					featureLists[0][featureList0Keys[0]], 
					leftFeatureOctTree, time );
				DTPrintf("insert at pos " + event.offsetX + ":" + event.offsetY +
						 " aabb cntr " +  newFeaturePix.AABB.center +
						 " featurepix uid " + newFeaturePix.uid.val, "add obj", "color:purple" );
				
			}
			lastEmptySpacePressTime = time;
		}
	}
}

let simPhys = false;
function startPhysicsSimulation(){ 
	simPhys = !simPhys; 
	let b = document.getElementById('simPhysButton');
	if( simPhys )
		b.innerText = "Stop Phys";
	else
		b.innerText = "Sim Phys";
}
let drawOctT = false;
function drawOctTreeToggle(){
	drawOctT = !drawOctT;
	let b = document.getElementById('drawOctTButton');
	if( drawOctT )
		b.innerText = "Hide OctT";
	else
		b.innerText = "Show OctT";
}

let time = 0;
let dT = 0.1;
function CanvasUpdate(){
	//featureLists
	//featurePositionsL
	//featurePositionsR
	if( leftFeatureOctTree ){
		
		if( simPhys ){
			DTPrintf("=====Apply User input " + time.toPrecision(3), "loop");
			while( queuedMouseEvents.length > 0 ){
				let mevent = queuedMouseEvents.shift(1);
				preformMouseEvent(mevent);
			}
			DTPrintf("=====detect colis " + time.toPrecision(3), "loop");
			leftFeatureOctTree.ApplyExternAccelAndDetectCollisions(time);
			DTPrintf("=====link graphs " + time.toPrecision(3), "loop");
			leftFeatureOctTree.LinkPhysGraphs(time);
			leftFeatureOctTree.AppyInterpenOffset(time);
			
			//need to do this to prevent inerpenetation of objects, though
			//for performace idealy the number of iterations is low
			let numAddionalColis = 1;
			while( numAddionalColis > 0 ){
				DTPrintf("=====trans energy " + time.toPrecision(3), "loop" );
				leftFeatureOctTree.TransferEnergy(time);
				DTPrintf("=====detect additional " + time.toPrecision(3), "loop" );
				numAddionalColis = leftFeatureOctTree.DetectAdditionalCollisions(time);
				if( numAddionalColis > 0 ){
					DTPrintf("======link numAdditional " + numAddionalColis + " time " + time.toPrecision(3), "loop" );
					leftFeatureOctTree.LinkPhysGraphs(time);
					leftFeatureOctTree.AppyInterpenOffset(time);
				}
			}
			DTPrintf( "===update " + time.toPrecision(3), "loop" );
			leftFeatureOctTree.Update(time);
		}
		
		leftFeatureOctTree.DebugDraw(lFCtx);
		
		if( simPhys ){
			time += dT;
		}
	}
}


//run the process of converting an image to red blue anaglyph
//ctx is the canvas for showing feature matches and correspondances
//aCtx is the output anaglyph canvas
function GenIntraImageTransform(gryImgDatL, gryImgDatR, downSampleMultiplier)
{
	console.log("in ConvertImageToAnaglyph");


	//edge detect the downsampled images
	let edgeImgL = EdgeDetect(gryImgDatL);
	let edgeImgR = EdgeDetect(gryImgDatR);
	
	//draw the edge detected version of the image used for feature detection
	let edgeImgLImgDat = edgeImgL.genImageData();
	let edgeImgRImgDat = edgeImgR.genImageData();
	
	ledgeCanv.width = edgeImgLImgDat.width;
	ledgeCanv.height = edgeImgLImgDat.height;
	
	redgeCanv.width = edgeImgRImgDat.width;
	redgeCanv.height = edgeImgRImgDat.height;
	
	leCtx.putImageData(edgeImgLImgDat,0,0);
	reCtx.putImageData(edgeImgRImgDat,0,0);
	
	let threshold = parseInt(document.getElementById('featureThresholdInput').value);
	
	drawHistogram( lEdgHCtx, edgeImgL, ['L Horiz Edges', 'L Vert Edges'], [threshold,threshold]  );
	drawHistogram( rEdgHCtx, edgeImgR, ['R Horiz Edges', 'R Vert Edges'], [threshold, threshold] );

	//detect features from the edges

	let imageBorderMargin = 30;
	featureLists = DetectFeatures( edgeImgL, edgeImgR, threshold, imageBorderMargin );
	featureList0Keys = Object.keys( featureLists[0] ); //for adding objs with mouse click
	
	DrawFeatures(lCtx, featureLists[0], downSampleMultiplier );
	DrawFeatures(rCtx, featureLists[1], downSampleMultiplier );
	
	//clear the feature patch canvas background (overdraw the previous)
	let greyFillStyle = "rgba("+50+","+50+","+50+","+1+")";
	lFCtx.fillStyle = greyFillStyle;
	lFCtx.fillRect(0,0,lFCtx.canvas.width, lFCtx.canvas.height);
	rFCtx.fillStyle = greyFillStyle;
	rFCtx.fillRect(0,0,rFCtx.canvas.width, rFCtx.canvas.height);
	
	//draw the detected feature patches and return lists of positions for the features
	//for highlighting correspondances when mousing over
	let worldMin = [0,0,-10];
	let worldMax = [lFCtx.canvas.width, lFCtx.canvas.height, 10];
	let boundThickness = lFCtx.canvas.width * 0.1;
	let oTSz = closestLrgrPoT( Math.max(lFCtx.canvas.width, lFCtx.canvas.height) );
	leftFeatureOctTree = new TreeNode( worldMin, [oTSz, oTSz, worldMax[2]], null );
	worldBoundsAABB = new AABB( worldMin, worldMax );
	worldBoundsObj = { linVel:[0,0,0], AABB:worldBoundsAABB }
	CreateBoundsObjs( worldMin, worldMax, boundThickness );
	DrawFeaturePixels(lFCtx, featureLists[0], 'Left', 0, leftFeatureOctTree);
	DrawFeaturePixels(rFCtx, featureLists[1], 'Right');
	
	let bestCorrespondanceSet =  FindFeatCorresps(featureLists);
	
	return TransformFromCorespSet( bestCorrespondanceSet );
}

//continuation of convert to anaglyph after features have been found
function FindFeatCorresps( featureLists ){


	let maxVerticalDifference        = parseInt(document.getElementById('maxVertDiffPct').value); //80;
	let expectedHorizontalDifference = parseInt(document.getElementById('expctdHorizDiffPct').value); // downSampleMultiplier;
	let maxHorizontalDifference      = parseInt(document.getElementById('maxHorizDiffPct').value); //50;
	let maxDifference                = parseInt(document.getElementById('featCorsMatchThresholdInput').value); // 5000;//800;//80;
	let correspondences = FindCorrespondences(
		featureLists,
		maxDifference,
		maxVerticalDifference,
		maxHorizontalDifference
	);


	//pick the best 3 corresponding pairs
	//pick a random set and rank the set based on
	//how close the lengths of the correspondences are to eachother   ||| lengths
	//how close the correspodence vector directions are to eachother  ||| angles
	//how low the differences between the correspondence features are ||| similarity

	correspondences.sort
	(
		//given two features on the left side compare them by their lowest distance matching feature in the right image
		function( a, b ){
			return a.featurePairs[0].pairDistance - b.featurePairs[0].pairDistance;
		}
	);

	console.log('sorted correspondences');
	let numLowestDifferenceCorrespondencesToDraw = 5;
	let lowestDifferenceCorrespondences = [];
	for( i in correspondences)
	{
		let feature = correspondences[i];
		//console.log(feature.getLowestMatchDifference());
		if(numLowestDifferenceCorrespondencesToDraw >= i)
			lowestDifferenceCorrespondences.push(feature);
		//numLowestDifferenceCorrespondencesToDraw -= 1;
	}

	//DrawCorrespondences(eCtx, lowestDifferenceCorrespondences, downSampleMultiplier);

	let maxNumSets = parseInt(document.getElementById('maxNumCorrespondanceSets').value);
	let numLowestDifferenceCorrespondencesToPick = 3;
	let possibleCorrespondenceSets = randomlyChooseUpToXSetsOfNFrom( lowestDifferenceCorrespondences, numLowestDifferenceCorrespondencesToPick, maxNumSets );


	//get the best scoring correspondance set
	let lowestDifferenceSet = RankCorrespondanceSetsByDifferences(possibleCorrespondenceSets);

	//DrawCorrespondences(ctx, setToUse, downSampleMultiplier);


	// Draw the ImageData back to the canvas
	//ctx.clearRect(0,0,canvas.width,canvas.height);
	
	return lowestDifferenceSet;
};
