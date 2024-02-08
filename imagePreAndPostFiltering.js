
//now defined with varying number of channels because edge detection output has a
//horizontal and vertical component
//takes a javascript canvas ImageData that has been read from a canvas
//with ctx.filter = 'grayscale(1)' and reads only the r channel into
//a single channel Uint8 array (to use less memory and simplify computer vision)
class Uint8Image{
	
	//take in parameters and optionally an ImageData rgb image to copy from
	constructor(width, height, chans, rgbImgDat){
		this.width = width;
		this.height = height;
		this.chans = chans;
		this.data = new Uint8ClampedArray(this.width * this.height * this.chans);
		if(rgbImgDat != null){
			for( let y = 0; y < this.height; ++y){
				for( let x = 0; x < this.width; ++x){
					let idx = (y * this.width * this.chans) + (x * this.chans);
					let oIdx = (y * rgbImgDat.width * imgdChans) + (x * imgdChans);
					for( let i = 0; i < this.chans; ++i ){ //for grayscale only the r channel (0 idx) will be copied
						this.data[idx+i] = rgbImgDat.data[oIdx+i];
					}
				}
			}
		}
	}
	
	genImageData(){
		let imgDat = new ImageData(this.width, this.height);
		for( let y = 0; y < this.height; ++y){
			for( let x = 0; x < this.width; ++x){
				let idx = (y * this.width * this.chans) + (x * this.chans);
				for( let i = 0; i < (imgdChans-1); ++i ){
					let val = 127;
					if( i < this.chans )
						val = this.data[idx+i];
					imgDat.data[(y*this.width*imgdChans)+((x*imgdChans)+i)] = val;
				}
				imgDat.data[(y*this.width*imgdChans)+((x*imgdChans)+(imgdChans-1))] = 255;
			}
		}
		return imgDat;
	}

}


Intensity = function(array, idx){
	return (array[idx+0]+array[idx+1]+array[idx+2])/3;
}


CombineRightAndLeftImages = function(gryImgL, gryImgR, rToLImageRotMatRotPtOffsetXY, downscaleMultiplier)
{
	let rotationMatrix = rToLImageRotMatRotPtOffsetXY[0];
	let rotationPoint  = rToLImageRotMatRotPtOffsetXY[1];

	let rightImageOffsetX = Math.floor(rToLImageRotMatRotPtOffsetXY[2][0]);
	let rightImageOffsetY = Math.floor(rToLImageRotMatRotPtOffsetXY[2][1]);

	let pixLeft      = gryImgL.data;
	let widthLeft    = gryImgL.width;
	let heightLeft   = gryImgL.height;

	let pixRight     = gryImgR.data;
	let widthRight   = gryImgR.width;
	let heightRight  = gryImgR.height;
	
	let outputWidth = gryImgL.width;

	let outputImgd = new ImageData(outputWidth, gryImgR.height);
	let outputPix = outputImgd.data;

	let ws = outputWidth*imgdChans; //the width stride
	for (let ih = 0, nh = heightLeft; ih < nh; ih += 1){
		for (let iw = 0, nw = widthLeft; iw < nw; iw += 1){
			let outputIdx     =  (ih  * ws)            + (iw*imgdChans);
			let leftImageIdx  =  ih  * gryImgL  .width +  iw;


			let rightImageVect = [iw-rotationPoint[0], ih-rotationPoint[1], 0];
			let rightImageVectOut = [0,0,0];
			Matrix_Multiply_Vect3( rightImageVectOut, rotationMatrix, rightImageVect );
			let rightImageW = Math.round(rightImageVectOut[0] + rotationPoint[0]  + rightImageOffsetX);
			let rightImageH = Math.round(rightImageVectOut[1] + rotationPoint[1]  - rightImageOffsetY);

			//clamp the right image sample coordinate to the image bounds
			if (rightImageH < 0)
				rightImageH = 0;
			else if( rightImageH >= gryImgR.height )
				rightImageH = gryImgR.height-1;
			if (rightImageW < 0)
				rightImageW = 0;
			else if( rightImageW >= gryImgR.width )
				rightImageW = gryImgR.width-1;
			let rightImageIdx = rightImageH   * gryImgR.width + rightImageW;

			/* //combining images with intensity for the majority of the r/b color and blending in some amount of the original color
			let pixLeftIntensity  = Intensity( pixLeft, leftImageIdx);
			let pixRightIntensity = Intensity(pixRight, rightImageIdx);

			outputPix[outputIdx+0] = pixLeft[leftImageIdx+0] * 0.1 + pixRight[rightImageIdx+0] * 0.0 + pixLeftIntensity * 0.9;
			outputPix[outputIdx+1] = pixLeft[leftImageIdx+1] * 0.0 + pixRight[rightImageIdx+1] * 1.0;
			outputPix[outputIdx+2] = pixLeft[leftImageIdx+2] * 0.0 + pixRight[rightImageIdx+2] * 0.1 + pixRightIntensity * 0.9;
			outputPix[outputIdx+3] = pixLeft[leftImageIdx+3] * 1.0 + pixRight[rightImageIdx+3] * 1.0;
			*/
			
			//now using grayscale images and outputting directly to red and blue channels
			outputPix[outputIdx+0] = pixLeft[leftImageIdx];
			outputPix[outputIdx+1] = 0;
			outputPix[outputIdx+2] = pixRight[rightImageIdx];
			outputPix[outputIdx+3] = 255;
		}
	}
	return outputImgd;
}


ApplyRedFilter = function (imgd)
{
	var pix = imgd.data;
	var width = imgd.width;
	var height = imgd.height;

	ws = width*4; //the width stride
	for (var ih = 0, nh = imgd.height; ih < nh; ih += 1){
		for (var iw = 0, nw = imgd.width; iw < nw; iw += 1){
			var i = ih * imgd.width*4 + iw*4;

			pix[i+0] = pix[i+0] * 1.0;
			pix[i+1] = pix[i+1] * 0.2;
			pix[i+2] = pix[i+2] * 0.2;
			pix[i+3] = pix[i+3] * 0.5;
		}
	}

	return imgd;
}


ApplyBlueFilter = function (imgd){
	var pix    = imgd.data;
	var width  = imgd.width;
	var height = imgd.height;

	ws = width*4; //the width stride
	for (var ih = 0, nh = imgd.height; ih < nh; ih += 1){
		for (var iw = 0, nw = imgd.width; iw < nw; iw += 1){
				var i = ih * imgd.width*4 + iw*4;

				pix[i+0] = pix[i+0] * 0.2;
				pix[i+1] = pix[i+1] * 0.2;
				pix[i+2] = pix[i+2] * 1.0;
				pix[i+3] = pix[i+3] * 0.5;
		}
	}

	return imgd;
}


DownSampleImage = function (grayImg)
{
	let pix = grayImg.data;
	let width = grayImg.width;

	let dwnSmpldGryImg = new Uint8Image(grayImg.width/2, grayImg.height/2, 1);
	let dwnSmpldGryPix = dwnSmpldGryImg.data;

	//Loop over each pixel

	let ws = grayImg.width; //the width stride
	for (let ih = 0, nh = grayImg.height-1; ih < nh; ih += 2) {
		for (let iw = 0, nw = grayImg.width-1; iw < nw; iw += 2) {

			let i          = (ih * ws) + (iw);

			let downSampIdx = (ih/2 * dwnSmpldGryImg.width) + (iw/2);

			pixIdx         = i;
			rightPixIdx    = i + 1;
			botPixIdx      = i + ws;
			botRightPixIdx = rightPixIdx + ws;

			// i+3 is alpha (the fourth element)

			r0 = pix[pixIdx];
			r1 = pix[rightPixIdx];
			r2 = pix[botPixIdx];
			r3 = pix[botRightPixIdx];

			dwnSmpldGryPix[downSampIdx]   = (r3+r2+r1+r0)/3;

		}
	}

	return dwnSmpldGryImg;
}


EdgeDetect = function (gryImg)
{ 
	let pix = gryImg.data;

	let edgeImg = new Uint8Image(gryImg.width, gryImg.height, 2);

	// Loop over each pixel

	let ws = gryImg.width; //the width stride
	for (let ih = 0, nh = gryImg.height-1; ih < nh; ++ih ) {
		for (let iw = 0; iw < ws-1; ++iw ) {

			let i = ih * ws + iw;

			let pixIdx         = i;
			let rightPixIdx    = i + 1;
			let botPixIdx      = i + ws;
			let botRightPixIdx = rightPixIdx + ws;


			s0 = pix[pixIdx];
			s1 = pix[rightPixIdx];
			s2 = pix[botPixIdx];
			s3 = pix[botRightPixIdx];
			
			
			let edgIdx = (ih * edgeImg.width * edgeImg.chans) + (iw*edgeImg.chans);

			let hD = 127+(s1-s0)/2;
			let vD = 127+(s2-s0)/2;
			//dD = 127+(s3-s0)/2;
			edgeImg.data[edgIdx+0] = hD;
			edgeImg.data[edgIdx+1] = vD;
			//edgePix[pixIdx+2] = dD;

		}
	}

	return edgeImg;
}


