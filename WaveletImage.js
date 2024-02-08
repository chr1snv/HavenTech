//WaveletImage.js
//for use or code/art requests please contact chris@itemfactorystudio.com

//for denoising sparsely sampled raytraced images or
//for feature detection or texture analysis computer vision

//an image composed of spectral components
//given a rendering or sampling budget it can return where next to sample
//to maximize the information gain (greatest waveform energy change) in the image
//in practice though sampling so that cache coherance is maintained 
//(grouping the computation of similar rays) may need to be weighted
//against minimal selection of rays

//because the complexity is number of x weights * y weights * height * width
//need to consider using a heirarachy maybe only use 5 weights per level

//using the harr wavefunction for now (half 1 half 0 and 0 outside the wavefunction range) because it is simple
function harrWavelet( coef, pct ){
	if( pct < 0.5 )
		return coef;
	return -coef;
}

//get the least and greatest pixel indicies (bounds) of the wavelet coefficent area
function getMinAndMaxPixIdxForCoef(coefIdx, coefsAtL, maxPixIdx){
	let coefNum = coefIdx+1;
	let minPixIdxForCoef = (coefIdx / coefsAtL) * maxPixIdx;
	let MaxPixIdxForCoef = (coefNum / coefsAtL) * maxPixIdx)-1;
	return [minPixIdxForCoef, MaxPixIdxForCoef];
}

//given the number of wavelet regions (coefficents)
//pixel index and number of pixels in the direction of the index (i.e. x,y)
//return the wavelet coefficent affecting the pixel index and 0-1 wavelet function coefficent percentage
function findWaveletCoefIdxAndPct( coefsAtL, pixIdx, maxPixIdx ){
	let coefIdx = Math.floor(pixIdx/maxIdx) * coefsAtL;
	let minMaxCoefPixIdx = getMinAndMaxPixIdxForCoef(coefIdx, coefsAtL, maxPixIdx);
	let coefPct = (y-minMaxCoefPixIdx[0])/(minMaxCoefPixIdx[1]-minMaxCoefPixIdx[0]);
	return [ coefIdx, coefPct ];
}

//converts a bitmap image to a wavelet representation or back to a bitmap image
//of requested width and height
function WaveletImage(){

	//https://www.youtube.com/watch?v=y7KLbd7n75g Wavelets and Multiresolution Analysis


	//invert the wavelet transform  (generate pixel values from the hierarchical wavelet representation)
	this.getBitmap = function(width, height){

		let pixels = new Uint8Array[width*height];
		pixels.fill(this.dcOffset);

		//for each level of coefficents/wavelets
		let coefsAtL = 0;
		for( let l = 0; l < this.numLevels; ++l ){
			
			//for each pixel
			for(let y = 0; y < height; ++y){
				
				let yCoefIdxAndPct = findWaveletCoefIdxAndPct( coefsAtL, y, height );
				let yWaveletContrib = harrWavelet(this.yCoefs[l][yCoefIdxAndPct[0]], yCoefIdxAndPct[1]);
			
				for(let x = 0; x < width; ++x){
			
					let xCoefIdxAndPct = findWaveletCoefIdxAndPct( coefsAtL, x, width );
					let xWaveletContrib = harrWavelet(this.xCoefs[l][xCoefIdxAndPct[0]], xCoefIdxAndPct[1]);
					
					//for each pixel accumulate coefficent contributions
					pixels[x + y * width] += yWaveletContrib + xWaveletContrib;

				}
			}
			
		}
	
		coefsAtL *= 2; //at each subsequent/deeper level the number of wavelet regions doubles
	}

	//this.samples = [];
	//should be replaced with an oct/quad tree like structure for sparse/incrementally sampled points
	//from raytracing


	this.numLevels; //the number of levels of coefficents (length of a side of the wavelet coefficent matrix)

	//coefficents for each level (array of array for each level)
	//this.dcOffset = 0; //-1 level (average of all pixel values dc offset is coefMat[0+matWidth*0])
	this.coefMat = [];
	//each level has 2^level scaling coefficents
	//the wavelet coefficents form a matrix


	//given a bitmap array of sample points compute the wavelet transform coefficents
	this.computeCoefficents = function(pixIn, width, height, maxLevels){
		//a weight times the wavelet function of the position
		//gives the contribution to that pixel 

		//the -1 level is the direct current offset or average of all pixel values
		//after each stage the contribution of it is subtracted from the pixIn values


		let totalPixels = width * height;
		
		this.coefMat = Uint8Array( (width*2) * (height*2) );


		this.numLevels = Math.log2( Math.min( width, height ) );
		if( this.numLevels > maxLevels )
			this.numLevels = maxLevels;

		//find the average value of all pixels (d.c. or constant value offset )
		let dcOffset = 0;
		for(let y = 0; y < height; ++y){
			for(let x = 0; x < width; ++x){
				dcOffset += pixIn[x + y * width] / totalPixels;
			}
		}
		this.coefMat[0] = dcOffset;
		
		//stack of past level cumulative affect on the pixel - not practical
		//instead start at highest frequency level and downsample to generate lower frequency
		//in later steps

		//for each level
		let coefsAtL = 0;
		for( let l = this.numLevels; l >= 0; --l ){
		
			let xCoefsAtL = Array(coefsAtL);
			let yCoefsAtL = Array(coefsAtL);

			for( let yWL = 0; yWL < coefsAtL; ++yWL ){
		
				//for each x wavelet convolve all pixels in the region with the wavelet function
				//to get the coefficent
				for( let xWL = 0; xWL < coefsAtL; ++xWL ){
					getMinAndMaxPixIdxForCoef(coefIdx, coefsAtL, maxPixIdx);
				}
			
			}
		
			//for each pixel
			for(let y = 0; y < height; ++y){
				
				let yCoefIdxAndPct = findWaveletCoefIdxAndPct( coefsAtL, y, height );
				
				for(let x = 0; x < width; ++x){
					
					let xCoefIdxAndPct = findWaveletCoefIdxAndPct( coefsAtL, x, width );
				}
			}
			
			this.xCoefs.push( xCoefsAtL );
			this.yCoefs.push( yCoefsAtL );
			
			coefsAtL *= 2;
		}	

	}

}
