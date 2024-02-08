
const imgdChans = 4; //number of channels per pixel (r,g,b,a) => 4
const featureStoredPixelsHalfWidth = 4;

class FeaturePair{
	constructor( othFeat, pixDiff, xDiff, yDiff)
	{
		this.othFeat = othFeat;
		
		this.pixDiff = pixDiff;
		
		this.xDiff = xDiff;
		this.yDiff = yDiff;

		this.pairDistance = (this.xDiff*this.xDiff) + (this.yDiff*this.yDiff);
	}
}

class Feature
{
	//prints the indentifying location of the feature as a string
	locationString(){
		return this.x+":"+this.y;
	}

	//check the dictionary for the corresponding nearby feature (for local maxima choosing)
	lookUpAndAddNeighborLink(dx,dy, featureDict){
		let str = (this.x+dx)+":"+(this.y+dy);
		let feature = featureDict[str];
		if (feature != undefined){
			feature.neighboringFeatures[this.locationString()] = this;
			this.neighboringFeatures[str] = feature;
		}
	}

	//looks at linked neighboring features and returns true if it
	//has the highest variance of them
	isLocalMaxima(){
		for (featureIdx in this.neighboringFeatures){
				let neighboringFeature = this.neighboringFeatures[featureIdx];
				let neighboringVariance = neighboringFeature.variance;
				let neighboringVarianceIsGreaterThanThisVariance = neighboringVariance >= this.variance;
				if( neighboringVarianceIsGreaterThanThisVariance ){
					//a neighbor has greater variance than this feature
					//this is not a local maxima
					return false;
				}
		}
		//no neighbor was found with greater variance
		//this is a local maxima
		return true;
	}


	//add a correspondance to another feature
	addMatchingFeature(otherFeature, pixDiff, xDiff, yDiff){
		let newPair = new FeaturePair( otherFeature, pixDiff, xDiff, yDiff);
		this.featurePairs.push( newPair );
	}
	
	
	
	storePixelValues(edgImg){
		let pix = edgImg.data;

		this.pixVals = [];
		this.pixChans = edgImg.chans;

		for (let ih = this.y-featureStoredPixelsHalfWidth;
				 ih <= this.y+featureStoredPixelsHalfWidth;
				 ih++ ){
			for (let iw = this.x-featureStoredPixelsHalfWidth;
					 iw <= this.x+featureStoredPixelsHalfWidth;
					 iw++ ){
				let i = (ih * edgImg.width * edgImg.chans) + (iw * edgImg.chans); //reading from edgImg (the downsampled edge detected image)
				for( let c = 0; c < edgImg.chans; ++c ){
					this.pixVals.push( pix[i] ); //writing to feature.pixelValues (where indicies per pixel is featurePixChans)
				}
			}
		}
	}
	
	comparePixelValues(other){
		let totalDifference = 0;
		for( let y = 0; y < featureStoredPixelsHalfWidth*2; ++y ){
			for( let x = 0; x < featureStoredPixelsHalfWidth*2; ++x ){
				let idx = (x*this.pixChans) + (y * (featureStoredPixelsHalfWidth*2) * this.pixChans );
				for( let c = 0; c < this.pixChans; ++c ){
					let otherValue = other.pixVals[idx+c];
					let thisValue = this.pixVals[idx+c];
				
					let distFromCenter = Math.abs( y - featureStoredPixelsHalfWidth ) + Math.abs( x - featureStoredPixelsHalfWidth );
				
					totalDifference += Math.abs( thisValue - otherValue ) * distFromCenter;
				}
			}
		}
		return totalDifference;
	}

	//take in the 
	//position 
	//variance(single pixel score)
	//feature dictionary for looking up neighboring features
	//original image for storing pixels of the feature
	//downsample multiplier is applied to x and y of feature to get original image coordinates
	constructor(xin, yin, variancein, featureDict, edgImg){
		this.featurePairs = [];

		this.x = xin;
		this.y = yin;

		this.storePixelValues( edgImg );//imgd, 1);

		this.variance = variancein;

		//append links to all of the neighboring features for later local maxima finding

		//f-1-1   f-1 0   f-1 1   top    row

		//f 0-1   f 0 0   f 0 1   middle row

		//f 1-1   f 1 0   f 1 1   bottom row

		//top row
		this.neighboringFeatures = {};
		this.lookUpAndAddNeighborLink(-2,-2,featureDict);
		this.lookUpAndAddNeighborLink(-1,-2,featureDict);
		this.lookUpAndAddNeighborLink( 0,-2,featureDict);
		this.lookUpAndAddNeighborLink( 1,-2,featureDict);
		this.lookUpAndAddNeighborLink( 2,-2,featureDict);
		//second to top row
		this.lookUpAndAddNeighborLink(-2,-1,featureDict);
		this.lookUpAndAddNeighborLink(-1,-1,featureDict);
		this.lookUpAndAddNeighborLink( 0,-1,featureDict);
		this.lookUpAndAddNeighborLink( 1,-1,featureDict);
		this.lookUpAndAddNeighborLink( 2,-1,featureDict);
		//middle row
		this.lookUpAndAddNeighborLink(-2, 0,featureDict);
		this.lookUpAndAddNeighborLink(-1, 0,featureDict);
		//this.lookUpAndAddNeighborLink( 0, 0,featureDict); //this
		this.lookUpAndAddNeighborLink( 1, 0,featureDict);
		this.lookUpAndAddNeighborLink( 2, 0,featureDict);
		//second to bottom row
		this.lookUpAndAddNeighborLink(-2, 1,featureDict);
		this.lookUpAndAddNeighborLink(-1, 1,featureDict);
		this.lookUpAndAddNeighborLink( 0, 1,featureDict);
		this.lookUpAndAddNeighborLink( 1, 1,featureDict);
		this.lookUpAndAddNeighborLink( 2, 1,featureDict);
		//bottom row
		this.lookUpAndAddNeighborLink(-2, 2,featureDict);
		this.lookUpAndAddNeighborLink(-1, 2,featureDict);
		this.lookUpAndAddNeighborLink( 0, 2,featureDict);
		this.lookUpAndAddNeighborLink( 1, 2,featureDict);
		this.lookUpAndAddNeighborLink( 2, 2,featureDict);
	}

}

function DetectFeatures(edgeImgL, edgeImgR, threshold, imageBorderMargin){
	let canidateFeatrDictL = findCanidateFeatures(edgeImgL, threshold, imageBorderMargin);
	let canidateFeatrDictR = findCanidateFeatures(edgeImgR, threshold, imageBorderMargin);

	//takes the edge detected image and canidate features dictionary 
	let leftlocalMaximalFeaturesDict  = findLocalMaximalFeatures( edgeImgL, canidateFeatrDictL );
	let rightlocalMaximalFeaturesDict = findLocalMaximalFeatures( edgeImgR, canidateFeatrDictR );

	return [leftlocalMaximalFeaturesDict, rightlocalMaximalFeaturesDict];
}

//given side by side stereo images, detect features in the left and right images
//and output to two feature dictionaries
function findCanidateFeatures(edgImg, threshold, imageBorderMargin){

	let featureDict = {};

	//find all the canidate features
	for (let ih = imageBorderMargin, nh = edgImg.height-imageBorderMargin; ih < nh; ih += 1){
		for (let iw = imageBorderMargin, nw = edgImg.width-imageBorderMargin; iw < nw; iw += 1){

			let i = (ih * edgImg.width * edgImg.chans) + (iw * edgImg.chans);

			let hD = edgImg.data[i]-127;
			let vD = edgImg.data[i+1]-127;
			//let dD = pix[i+2]-127;

			variance = Math.abs(hD)+Math.abs(vD);//+Math.abs(dD);

			if(variance > threshold ){ //has high enough pixel difference to be considered a feature
				let newFeature = new Feature(iw, ih, variance, featureDict, edgImg);
				featureDict[iw+":"+ih] = newFeature;
			}
		}
	}

	return featureDict;

}

//find the best ranking of nearby (touching) features
function findLocalMaximalFeatures(imgd, featureDict)
{
	let pix = imgd.data;

	//find the local maxima features
	let localMaximalFeatures = {};
	for ( featureIdx in featureDict ){
		let feature = featureDict[featureIdx];
		let isLocalMaxima = feature.isLocalMaxima();
		if( isLocalMaxima ){
			//add the feature to the local maxima dictionary
			localMaximalFeatures[ feature.locationString() ] = feature;
		}
		else{
			//set the pixel color to indicate it is not a local maxima
			let iw = feature.x;
			let ih = feature.y;
			let i = ih * imgd.width*imgdChans + iw*imgdChans;
			
			pix[i+0] = 255;
			pix[i+1] = 127;
			pix[i+2] = 0;
		}
	}
	return localMaximalFeatures;
}
