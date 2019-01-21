

class Feature
{

        locationString()
        {
                return this.x+":"+this.y;
        }

        lookUpAndAddNeighborLink(dx,dy)
        {
                str = this.x+dx+":"+this.y+dy;
        }
        constructor(xin, yin, variancein)
        {
                this.x = xin;
                this.y = yin;
                this.variance = variancein;

                //append links to all of the neighboring features for later local maxima finding

                //f00 f01 f02
                //f10 f11 f12
                //f20 f21 f22

                this.neighboringFeatures = {};
                //top row
                var f00 = featureDict[this.x-1+":"+this.y-1];
                if( f00 != undefined )
                {
                        this.neighboringFeatures[f00.locationString()] = f00;
                        f00.neighboringFeatures[this.locationString()] = this;
                }
                var f01 = featureDict[this.x-0+":"+this.y-1];
                if( f01 != undefined )
                        this.neighboringFeatures.push( f01 );
                var f02 = featureDict[this.x+1+":"+this.y-1];
                if( f02 != undefined )
                        this.neighboringFeatures.push( f02 );
                //middle row
                var f10 = featureDict[this.x-1+":"+this.y-0];
                if( f02 != undefined )
                        this.neighboringFeatures.push( f10 );
                var f11 = featureDict[this.x-0+":"+this.y-0];
                if( f02 != undefined )
                        this.neighboringFeatures.push( f11 );
                var f12 = featureDict[this.x+1+":"+this.y-0];
                if( f12 != undefined )
                        this.neighboringFeatures.push( f12 );
                //bottom row
                var f20 = featureDict[this.x-1+":"+this.y+1];
                if( f20 != undefined )
                        this.neighboringFeatures.push( f20 );
                var f21 = featureDict[this.x-0+":"+this.y+1];
                if( f21 != undefined )
                        this.neighboringFeatures.push( f21 );
                var f22 = featureDict[this.x+1+":"+this.y+1];
                if( f22 != undefined )
                        this.neighboringFeatures.push( f22 );
        }

}

function DetectFeatures(imgd)
{
        var pix = imgd.data;

        heightLastVariance = 0;
        widthLastVariance  = 0;

        threshold = 128;

        featureDict = {};

        ws = width*4; //the width stride
        for (var ih = 1, nh = imgd.height-1; ih < nh; ih += 1) {
                widthLastVariance = 0;
                for (var iw = 1, nw = imgd.width; iw < nw; iw += 1) {

                        i = ih * imgd.width*4 + iw*4;

                        hD = pix[i+0]-127;
                        vD = pix[i+1]-127;
                        dD = pix[i+2]-127;

                        variance = Math.abs(hD)+Math.abs(vD)+Math.abs(dD);

                        if(variance > threshold )
                        {
                                //set the pixel black to indicate where the feature is
                                pix[i+0] = 0;
                                pix[i+1] = 0;
                                pix[i+2] = 0;
                                newFeature = new Feature(iw,ih,variance, featureDict);
                                featureDict[iw+":"+ih] = newFeature;

                                


                        }

                }
        }
        return featureDict;
}


function findLocalMaximalFeatures(featureDict)
{
        
}
