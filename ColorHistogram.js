
//generate a brightness and r g b intensity graph of the image
//and draw it to the histogram canvas
function genHistogram(hCtx, img){
	let pix = img.data;
	
	const numBins = 256; //bit depth of pixel channels, called bins because
	//generating the histogram is like bin sorting the pixels by intensity

	let lumaBins = Array(numBins).fill(0); //the lumanace histogram
	
	let redBins = Array(numBins).fill(0);
	let blueBins = Array(numBins).fill(0);
	let greenBins = Array(numBins).fill(0);
	
	let ws = img.width*imgdChans; //the width stride
	
	
	for (let ih = 0, nh = img.height; ih < nh; ++ih ) {
		for (let iw = 0, nw = img.width; iw < nw; ++iw ) {
			let idx = ih * ws + iw * imgdChans;
			let red   = pix[idx + 0];
			let blue  = pix[idx + 1];
			let green = pix[idx + 2];
			let luma = Math.round((red + blue + green)/ 3.0);
			lumaBins[luma] += 1;
			redBins[red] += 1/3.0;
			blueBins[blue]   += 1/3.0;
			greenBins[green] += 1/3.0;
			
		}
	}
	
	let maxBinVal = 0;
	let avgBinVal = 0;
	for (let lidx = 0; lidx < numBins; ++lidx ) {
		if( maxBinVal < lumaBins[lidx] )
			maxBinVal = lumaBins[lidx];
		avgBinVal += lumaBins[lidx]/numBins;
	}
	
	let maxLumaGraphHeight = hCtx.canvas.height;
	let lumaScale = (maxBinVal*0.08 + avgBinVal*0.92) / maxLumaGraphHeight;
	
	//a color or luminance bin value of the histogram (used to sort for back to front drawing)
	class HistChan{
		constructor(val, chan){
			this.val = val;
			this.chan = chan;
		}
	}
	
	let binDrawWidth = hCtx.canvas.width/numBins;
	
	//draw the chart (with r g b and sum (l) ) bars per bin
	for (let lidx = 0; lidx < numBins; ++lidx ) {
	
		let histChans = Array(4);
	
		//get components and draw back to front in order of size to show all
		let r = redBins  [lidx]/lumaScale;
		let g = greenBins[lidx]/lumaScale;
		let b = blueBins [lidx]/lumaScale;
		//the r+b+g luminance will be biggest so draw it first
		let l = lumaBins [lidx]/lumaScale;
		
		histChans[0] = new HistChan(r, 'r');
		histChans[1] = new HistChan(g, 'g');
		histChans[2] = new HistChan(b, 'b');
		histChans[3] = new HistChan(l, 'l');
		
		histChans.sort
		(
			//given two features on the right side compare them by the lowest difference between pairs
			function( a, b ){
				return b.val - a.val;
			}
		);
		
		//draw the histogram channels for each bin
		for( let cIdx = 0; cIdx < histChans.length; ++cIdx ){
			if(lidx > (numBins*0.95) )
				console.log( lidx + ' ' + histChans[cIdx].chan + ' ' + histChans[cIdx].val );
			let rgbString;
			switch( histChans[cIdx].chan ){
				case 'r':
					rgbString = "rgba("+255+","+0+","+0+","+0.75+")";
				break;
				case 'g':
					rgbString = "rgba("+0+","+255+","+0+","+0.75+")";
				break;
				case'b':
					rgbString = "rgba("+0+","+0+","+255+","+0.75+")";
				break;
				case 'l':
					rgbString = "rgba("+255+","+255+","+255+","+0.75+")";
				break;
			}
			hCtx.fillStyle = rgbString;
			hCtx.fillRect( lidx*binDrawWidth, maxLumaGraphHeight-histChans[cIdx].val, 2, histChans[cIdx].val );
		}
	}
}
