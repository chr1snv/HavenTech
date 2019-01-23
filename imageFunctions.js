

class Feature
{

        locationString()
        {
                return this.x+":"+this.y;
        }

        lookUpAndAddNeighborLink(dx,dy, featureDict)
        {
                var str = (this.x+dx)+":"+(this.y+dy);
                var feature = featureDict[str];
                if (feature != undefined)
                {
                        feature.neighboringFeatures[this.locationString()] = this;
                        this.neighboringFeatures[str] = feature;
                }
        }
        //looks at neighboring features and returns true if it
        //has the highest variance of them
        isLocalMaxima()
        {
                for (featureIdx in this.neighboringFeatures)
                {
                        var neighboringFeature = this.neighboringFeatures[featureIdx];
                        var neighboringVariance = neighboringFeature.variance;
                        var neighboringVarianceIsGreaterThanThisVariance = neighboringVariance >= this.variance;
                        if( neighboringVarianceIsGreaterThanThisVariance )
                        {
                                //a neighbor has greater variance than this feature
                                //this is not a local maxima
                                return false;
                        }
                }
                //no neighbor was found with greater variance
                //this is a local maxima
                return true;
        }
        addMatchingFeature(otherFeature)
        {
                this.matchingFeatures.push( otherFeature );
                otherFeature.matchingFeatures.push( this );
        }
        storePixelValues(imgd, downsampleMultiplier)
        {
                var pix = imgd.data;

                this.pixelValues = [];

                var squareStoredRegionHalfWidth = 4;

                for (var ih = this.y*downsampleMultiplier-squareStoredRegionHalfWidth,
                         nh = this.y*downsampleMultiplier+squareStoredRegionHalfWidth;
                        ih < nh;
                        ih += 1)
                {
                        for (var iw = this.x*downsampleMultiplier-squareStoredRegionHalfWidth,
                                 nw = this.x*downsampleMultiplier+2;
                                iw < nw;
                                iw += 1)
                        {
                                var i = ih * imgd.width*4 + iw*4;
                                this.pixelValues.push(pix[i]  );
                                this.pixelValues.push(pix[i+1]);
                                this.pixelValues.push(pix[i+2]);
                        }
                }
        }
        comparePixelValues(other)
        {
                var totalDifference = 0;
                for( var valueIndex in this.pixelValues)
                {
                        var otherValue = other.pixelValues[valueIndex];
                        var thisValue = this.pixelValues[valueIndex];
                        
                        totalDifference += Math.abs( thisValue - otherValue );
                }
                return totalDifference;
        }
        constructor(xin, yin, variancein, featureDict, imgd, origimgd, downsampleMultiplier)
        {
                this.matchingFeatures = [];

                this.x = xin;
                this.y = yin;

                this.storePixelValues( origimgd, downsampleMultiplier);//imgd, 1);

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

function DetectFeatures(imgd, origimgd, downsampleMultiplier, threshold, imageBorderMargin)
{
        var canidateFeaturesDict = findCanidateFeatures(imgd, origimgd, downsampleMultiplier, threshold, imageBorderMargin);

        var localMaximalFeaturesDict = findLocalMaximalFeatures(imgd, canidateFeaturesDict);
        
        return localMaximalFeaturesDict;
}

function findCanidateFeatures(imgd, origimgd, downsampleMultiplier, threshold, imageBorderMargin)
{
        var pix = imgd.data;
        
        var featureDict = {};

        //find all the canidate features
        for (var ih = imageBorderMargin, nh = imgd.height-imageBorderMargin; ih < nh; ih += 1)
        {
                
                for (var iw = imageBorderMargin, nw = imgd.width-imageBorderMargin; iw < nw; iw += 1)
                {

                        var i = ih * imgd.width*4 + iw*4;

                        var hD = pix[i+0]-127;
                        var vD = pix[i+1]-127;
                        var dD = pix[i+2]-127;

                        variance = Math.abs(hD)+Math.abs(vD)+Math.abs(dD);

                        if(variance > threshold )
                        {
                                //set the pixel black to indicate where the feature is
                                pix[i+0] = 0;
                                pix[i+1] = 0;
                                pix[i+2] = 0;
                                newFeature = new Feature(iw, ih, variance, featureDict, imgd, origimgd, downsampleMultiplier);
                                featureDict[iw+":"+ih] = newFeature;

                        }

                }
                
        }

        return featureDict;

}


function findLocalMaximalFeatures(imgd, featureDict)
{
        var pix = imgd.data;

        //find the local maxima features
        var localMaximalFeatures = {};
        for ( featureIdx in featureDict )
        {
                var feature = featureDict[featureIdx];
                var isLocalMaxima = feature.isLocalMaxima();
                if( isLocalMaxima )
                {
                        //add the feature to the local maxima dictionary
                        localMaximalFeatures[ feature.locationString() ] = feature;
                }
                else
                {
                        //set the pixel color to indicate it is not a local maxima
                        var iw = feature.x;
                        var ih = feature.y;
                        var i = ih * imgd.width*4 + iw*4;
                        
                        pix[i+0] = 255;
                        pix[i+1] = 127;
                        pix[i+2] = 0;
                        
                }
        }
        return localMaximalFeatures;
}
