

class Feature
{
        constructor(xin, yin, variancein)
        {
             this.x = xin;
             this.y = yin;
             this.variance = variancein;
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
                                pix[i+0] = 0;
                                pix[i+1] = 0;
                                pix[i+2] = 0;
                                newFeature = new Feature(iw,ih,variance);
                                featureDict[iw+":"+ih] = newFeature;
                        }

                }
        }
        return featureDict;
}
