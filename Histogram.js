
//generate a graph of image pixel intensities per channel
//and draw it to a histogram canvas
function drawHistogram(hCtx, uint8Img, labels, thresholdLines){
	let pix = uint8Img.data;
	
	const numBins = 256; //bit depth of pixel channels, called bins because
	//generating the histogram is like bin sorting the pixels by intensity
	
	for( let chan = 0; chan < uint8Img.chans; ++chan){

		let lumaBins = Array(numBins).fill(0); //the lumanance histogram
		
		for (let ih = 0, nh = uint8Img.height; ih < nh; ++ih ) {
			for (let iw = 0, nw = uint8Img.width; iw < nw; ++iw ) {
				let idx = (ih * uint8Img.width * uint8Img.chans) + (iw * uint8Img.chans) + chan;
				let luma = pix[idx];
				lumaBins[luma] += 1;
			}
		}
		
		//find the max and average bin values for vertically scaling
		let maxBinVal = 0;
		let avgBinVal = 0;
		for (let lidx = 0; lidx < numBins; ++lidx ) {
			if( maxBinVal < lumaBins[lidx] )
				maxBinVal = lumaBins[lidx];
			avgBinVal += lumaBins[lidx]/numBins;
		}
		
		//depending on the image all pixels may be in one bin or evenly distributed
		//between the intensity bins
		//here a heurstic is used to vertically scale the drawn graph
		let maxLumaGraphHeight = hCtx.canvas.height/uint8Img.chans;
		let lumaScale = 1/((maxBinVal*0.08 + avgBinVal*0.92) / maxLumaGraphHeight);
		
		
		let binDrawWidth = hCtx.canvas.width/numBins;
		
		hCtx.fillStyle = "rgba("+255+","+255+","+255+","+0.75+")";
		
		hCtx.font = '10pt arial';
		//hCtx.fillStyle = '#0FF00';
		hCtx.fillText(labels[chan], hCtx.canvas.width*0.3, 20+(maxLumaGraphHeight*chan));
		
		let vertOffset = maxLumaGraphHeight*(chan+1);
		
		//draw the chart (with r g b and sum (l) ) bars per bin
		for (let lidx = 0; lidx < numBins; ++lidx ) {
			let l = lumaBins [lidx]*lumaScale;
			hCtx.fillRect( lidx*binDrawWidth, vertOffset-l, binDrawWidth, l );
		}
		
		//draw the threshold line at the given value
		if( thresholdLines[chan] != 0 ){
			let thresholdX = (thresholdLines[chan]*binDrawWidth);
			let minThresholdX = (hCtx.canvas.width/2)-thresholdX
			let maxThresholdX = (hCtx.canvas.width/2)+thresholdX;
			let thresholdLineY = vertOffset-(maxLumaGraphHeight/2);
			hCtx.fillStyle = "rgba("+100+","+255+","+100+","+0.75+")";
			hCtx.fillRect(0, thresholdLineY, minThresholdX, 5 );
			hCtx.fillRect(maxThresholdX, thresholdLineY, hCtx.canvas.width, 5 );
		}
	}
}
