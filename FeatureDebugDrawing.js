
function DrawFeature(f, color, ctx, downSampleMultiplier, label)
{
	var xPt = f.x*downSampleMultiplier;
	var yPt = f.y*downSampleMultiplier;

	var radius = 2;
	ctx.beginPath();
	ctx.arc(xPt, yPt, radius, 0, 2 * Math.PI, false);
	ctx.fillStyle = color;
	ctx.fill();

	ctx.font = '5pt arial';
	ctx.fillText(label, xPt-10, yPt+radius*3);
}

function DrawFeatures(ctx, featuresList, downSampleMultiplier){
	color = colors[colorIdx];
	colorIdx = (colorIdx + 1) % colors.length;

	for( featureIdx in featuresList ){
	
		f = featuresList[featureIdx];
		DrawFeature(f, color, ctx, downSampleMultiplier, featureIdx);
	
	}
	
}

//a feature region that can be checked for intersection with a ray from the mouse position
function FeaturePix(feature, min, max, time){
	this.AABB = new AABB( min, max );
	this.feature = feature;
	this.uid = NewUID( );
	this.treeNodes = {};
	
	this.lastPressTime = 0;
	
	this.physObj = new PhysObj(this.AABB, this, time);
	this.physObj.linVel[0] = Math.random() * 40 - 20;

	this.RayIntersect = function( retVal_dist_feature, ray ){
		retVal_dist_feature[0] = this.AABB.RayIntersects( [0,0,0], ray, 0 );
		if( retVal_dist_feature[0] > -1 ){
			retVal_dist_feature[1] = this;
		}
	}
	
	
	this.RemoveFromOctTree = function(){
		//console.log("RemoveFromOctTree: " + this );
		for( let tId in this.treeNodes ){ //remove from each tree node associated with
			//console.log("tNdId : " + tId );
			let trNd = this.treeNodes[tId];
			trNd.RemoveFromThisNode(this);
		}
		
		//for( let tId in this.treeNodes ){ //check if should unsubdivide node
		//	this.treeNodes[tId].TryUnsubdivide();
		//}
		
		this.treeNodes = {}; //now removed from all nodes
	}
	
	
	this.Draw = function(fCtx){
		let feature = this.feature;
		const fetPixChans = feature.pixChans;
		
		let physGraphColStr = undefined;
		if( this.physObj.physGraph )
			physGraphColStr = UIDToColorHexString( this.physObj.physGraph.uid );
		
		let colorizedRgbString = UIDToColorHexString( this.uid );
		colorizedRgbString = ScalarMultiplyColorHexString( colorizedRgbString, 0.3 );
		
		let vals = [0,0,127,200];
		let xd = 0;
		let yd = 0;
		let cenDist = 0;
		let hlfWdth = pixStoreDim/2;
		let hlfWdthOuter = hlfWdth*1.1;
		for( let y = 0; y < pixStoreDim; y++ ){
			for( let x = 0; x < pixStoreDim; x++ ){
				xd = y - hlfWdth;
				yd = x - hlfWdth;
				cenDist = Math.sqrt(yd*yd+xd*xd);
				if( cenDist > hlfWdth ){
					if( physGraphColStr != undefined && cenDist < hlfWdthOuter ){
						fCtx.fillStyle = physGraphColStr;
						fCtx.fillRect( (x*fetPixDrawScale) + this.AABB.minCoord[0],
										(y*fetPixDrawScale) + this.AABB.minCoord[1], 
								  		 2, 2 );
					}
				}else{
				
					for( let c = 0; c < feature.pixChans; ++c ){
						vals[c] = feature.pixVals[(x*fetPixChans)+c+(y*pixStoreDim*fetPixChans)];
					}
					
					let rgbString = "#"+vals[0].toString(16).padStart(2,0)+
										vals[1].toString(16).padStart(2,0)+
										vals[2].toString(16).padStart(2,0)+
										vals[3].toString(16).padStart(2,0);
					if( this.physObj.resting )
						rgbString = "#33333388";
					rgbString = AddColorHexStrings( rgbString, colorizedRgbString );
					fCtx.fillStyle = rgbString;
					fCtx.fillRect( (x*fetPixDrawScale) + this.AABB.minCoord[0],
								   (y*fetPixDrawScale) + this.AABB.minCoord[1], 
								   2, 2 );
					
				}
			
			}
		}
	}
}

const fetPixDrawScale = 2;

const pixStoreDim = featureStoredPixelsHalfWidth*2;

const fetDrawWidth  = pixStoreDim*fetPixDrawScale+10;
const fetDrawHeight = pixStoreDim*fetPixDrawScale+10;

function InsertFeaturePixAtCoord( x, y, feature, oTree, time ){
	
	let halfDim = pixStoreDim*fetPixDrawScale * 0.5;
	
	x -= halfDim; //numbers are passed by value
	y -= halfDim; //offset to place center at given coords
	
	let featurePix = 
		new FeaturePix( feature,
				[x, y, 0],
			
				[x+(pixStoreDim*fetPixDrawScale), 
				 y+(pixStoreDim*fetPixDrawScale), 1],
				 time );
	//console.log( "insert Feature at pos " + x + ", " + y );
	
	let nLvsMDpth = [0, 0];
	oTree.AddObject( nLvsMDpth, featurePix );
	return featurePix;
}

//draw the pixels of the detected features
function DrawFeaturePixels(fCtx, featureDict, dictLabel, prevFetVertDrawOffset = 0, featurePixelOctTree = null){
	
	//draw a label for the feature dictionary
	fCtx.font = '15pt arial';
	fCtx.fillStyle = '#00FF00';
	fCtx.fillText(dictLabel, 0, prevFetVertDrawOffset+15);
	prevFetVertDrawOffset += 20;
	
	
	const featuresPerRow = Math.floor(fCtx.canvas.width/(fetDrawWidth));
	
	
	
	
	let fetVertDrawOffset;

	let featureNum = 0;
	for ( featureKey in featureDict ){
	
		if( featureNum > 0 )
			break;
		
		const feature = featureDict[featureKey];
		
		
		const featureRow = Math.floor(featureNum / featuresPerRow);
		const fetHorizDrawOffset = fetDrawWidth * (featureNum%featuresPerRow);
		fetVertDrawOffset = (featureRow   * fetDrawHeight) + prevFetVertDrawOffset;
		
		
		if( featurePixelOctTree != null ){
			
			InsertFeaturePixAtCoord( fetHorizDrawOffset, fetVertDrawOffset, feature, featurePixelOctTree, 0 );
			
		}
		
		
		featureNum++;
		
	}
	
	if( featurePixelOctTree != null )
		featurePixelOctTree.DebugDraw(fCtx);
	
	return fetVertDrawOffset + 30; //+ the spacing between feature sets
	
}


var colors =
[
"#FF0000",
"#00FF00",
"#0000FF",
"#FFFF00",
"#FF00FF",
"#00FFFF"
];
var colorIdx = 0;

function DrawCorrespondences(ctx, featuresList, downSampleMultiplier)
{
	for( featureIdx in featuresList )
	{
		color = colors[colorIdx];
		colorIdx = (colorIdx + 1) % colors.length;

		f = featuresList[featureIdx];
		DrawFeature(f, color, ctx, downSampleMultiplier, featureIdx);

		for( foIdx in f.matchingFeatures )
		{
				fo = f.matchingFeatures[foIdx];

				var fx  = f.x*downSampleMultiplier;
				var fy  = f.y*downSampleMultiplier;

				var fxo = fo.x*downSampleMultiplier;
				var fyo = fo.y*downSampleMultiplier;

				DrawFeature(fo, color, ctx, downSampleMultiplier, 'd'+f.comparePixelValues(fo));
				ctx.beginPath();
				ctx.moveTo(fx, fy);
				ctx.lineTo(fxo, fyo);
				ctx.lineWidth = 0.1;
				ctx.strokeStyle = color;
				ctx.stroke();
		}
	}
}
