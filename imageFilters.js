

Intensity = function(array, idx)
{
        return (array[idx+0]+array[idx+1]+array[idx+2])/3;
}

CombineRightAndLeftImages = function(imgdLeft, imgdRight, outputWidth, rightImageOffsetX, rightImageOffsetY, rotationMatrix, rotationPoint)
{
        var rightImageOffsetX = Math.floor(rightImageOffsetX);
        var rightImageOffsetY = Math.floor(rightImageOffsetY);

        var pixLeft      = imgdLeft.data;
        var widthLeft    = imgdLeft.width;
        var heightLeft   = imgdLeft.height;

        var pixRight     = imgdRight.data;
        var widthRight   = imgdRight.width;
        var heightRight  = imgdRight.height;

        var outputImgd = new ImageData(outputWidth, imgdRight.height);
        var outputPix = outputImgd.data;

        ws = outputWidth*4; //the width stride
        for (var ih = 0, nh = heightLeft; ih < nh; ih += 1)
        {
                for (var iw = 0, nw = widthLeft; iw < nw; iw += 1)
                {
                        var outputIdx     =  ih           * outputImgd.width*4 + (iw+outputWidth/4)    *4;
                        var leftImageIdx  =  ih           * imgdLeft  .width*4 +  iw                   *4;


                        var rightImageVect = [iw-rotationPoint[0], ih-rotationPoint[1], 0];
                        var rightImageVectOut = [0,0,0];
                        Matrix_Multiply_Vect3( rightImageVectOut, rotationMatrix, rightImageVect );
                        var rightImageW = Math.round(rightImageVectOut[0] + rotationPoint[0]  + rightImageOffsetX);
                        var rightImageH = Math.round(rightImageVectOut[1] + rotationPoint[1]  - rightImageOffsetY);
                        

                        if (rightImageH < 0)
                        {
                                rightImageH = 0;
                        }
                        else if( rightImageH >= imgdRight.height )
                        {
                                rightImageH = imgdRight.height-1;
                        }
                        if (rightImageW < 0)
                        {
                                rightImageW = 0;
                        }
                        else if( rightImageW >= imgdRight.width )
                        {
                                rightImageW = imgdRight.width-1;
                        }
                        var rightImageIdx = rightImageH   * imgdRight .width*4 + rightImageW           *4;

                        var pixLeftIntensity  = Intensity( pixLeft, leftImageIdx);
                        var pixRightIntensity = Intensity(pixRight, rightImageIdx);

                        outputPix[outputIdx+0] = pixLeft[leftImageIdx+0] * 0.1 + pixRight[rightImageIdx+0] * 0.0 + pixLeftIntensity * 0.9;
                        outputPix[outputIdx+1] = pixLeft[leftImageIdx+1] * 0.0 + pixRight[rightImageIdx+1] * 1.0;
                        outputPix[outputIdx+2] = pixLeft[leftImageIdx+2] * 0.0 + pixRight[rightImageIdx+2] * 0.1 + pixRightIntensity * 0.9;
                        outputPix[outputIdx+3] = pixLeft[leftImageIdx+3] * 1.0 + pixRight[rightImageIdx+3] * 1.0;

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
        for (var ih = 0, nh = imgd.height; ih < nh; ih += 1)
        {
                for (var iw = 0, nw = imgd.width; iw < nw; iw += 1)
                {
                        var i = ih * imgd.width*4 + iw*4;

                        pix[i+0] = pix[i+0] * 1.0;
                        pix[i+1] = pix[i+1] * 0.2;
                        pix[i+2] = pix[i+2] * 0.2;
                        pix[i+3] = pix[i+3] * 0.5;
                }
        }

        return imgd;
}


ApplyBlueFilter = function (imgd)
{
        var pix    = imgd.data;
        var width  = imgd.width;
        var height = imgd.height;

        ws = width*4; //the width stride
        for (var ih = 0, nh = imgd.height; ih < nh; ih += 1)
        {
                for (var iw = 0, nw = imgd.width; iw < nw; iw += 1)
                {
                        var i = ih * imgd.width*4 + iw*4;

                        pix[i+0] = pix[i+0] * 0.2;
                        pix[i+1] = pix[i+1] * 0.2;
                        pix[i+2] = pix[i+2] * 1.0;
                        pix[i+3] = pix[i+3] * 0.5;
                }
        }

        return imgd;
}


DownSampleImage = function (imgd)
{
        var pix = imgd.data;
        var width = imgd.width;

        var downSampledImgd = new ImageData(imgd.width/2, imgd.height/2);
        var downSampledPix = downSampledImgd.data;

        // Loop over each pixel

        ws = width*4; //the width stride
        for (var ih = 0, nh = imgd.height; ih < nh; ih += 2) {
                for (var iw = 0, nw = imgd.width; iw < nw; iw += 1) {

                        i          = ih * imgd.width*4 + iw*4;

                        halfPixIdx = ih/2 * imgd.width*4/2 + iw*4/2;

                        pixIdx         = i;
                        rightPixIdx    = i + 4            < pix.length ? i + 4            : i;
                        botPixIdx      = i + ws           < pix.length ? i           + ws : i;
                        botRightPixIdx = rightPixIdx + ws < pix.length ? rightPixIdx + ws : rightPixIdx;


                        // i+3 is alpha (the fourth element)

                        r0 = pix[pixIdx];
                        g0 = pix[pixIdx+1];
                        b0 = pix[pixIdx+2];

                        r1 = pix[rightPixIdx];
                        g1 = pix[rightPixIdx+1];
                        b1 = pix[rightPixIdx+2];

                        r2 = pix[botPixIdx];
                        g2 = pix[botPixIdx+1];
                        b2 = pix[botPixIdx+2];

                        r3 = pix[botRightPixIdx];
                        g3 = pix[botRightPixIdx+1];
                        b3 = pix[botRightPixIdx+2];

                        downSampledPix[halfPixIdx]   = (r3+r2+r1+r0)/3;
                        downSampledPix[halfPixIdx+1] = (g3+g2+g1+g0)/3;
                        downSampledPix[halfPixIdx+2] = (b3+b2+b1+b0)/3;
                        downSampledPix[halfPixIdx+3] = 255;
            
                }
        }


        return downSampledImgd;
}


EdgeDetect = function (imgd)
{ 
        var pix = imgd.data;
        var width = imgd.width;

        var edgeDetectedImgd = new ImageData(imgd.width, imgd.height);
        var edgePix = edgeDetectedImgd.data;

        // Loop over each pixel

        ws = width*4; //the width stride
        for (var ih = 0, nh = imgd.height; ih < nh; ih += 1) {
                for (var iw = 0, nw = imgd.width; iw < nw; iw += 1) {
                        
                        i = ih * imgd.width*4 + iw*4;
                
                        pixIdx         = i;
                        rightPixIdx    = i + 4            < pix.length ? i + 4            : i;
                        botPixIdx      = i + ws           < pix.length ? i           + ws : i;
                        botRightPixIdx = rightPixIdx + ws < pix.length ? rightPixIdx + ws : rightPixIdx;


                        r0 = pix[pixIdx];
                        g0 = pix[pixIdx+1];
                        b0 = pix[pixIdx+2];
                        s0 = (r0+g0+b0)/3;

                        r1 = pix[rightPixIdx];
                        g1 = pix[rightPixIdx+1];
                        b1 = pix[rightPixIdx+2];
                        s1 = (r1+g1+b1)/3;

                        r2 = pix[botPixIdx];
                        g2 = pix[botPixIdx+1];
                        b2 = pix[botPixIdx+2];
                        s2 = (r2+g2+b2)/3;

                        r3 = pix[botRightPixIdx];
                        g3 = pix[botRightPixIdx+1];
                        b3 = pix[botRightPixIdx+2];
                        s3 = (r3+g3+b3)/3;


                        //rhD = 127+(r1-r0)/2;
                        //ghD = 127+(g1-g0)/2;
                        //bhD = 127+(b1-b0)/2;

                        hD = 127+(s1-s0)/2;
                        vD = 127+(s2-s0)/2;
                        dD = 127+(s3-s0)/2;
                        edgePix[pixIdx]   = hD;
                        edgePix[pixIdx+1] = vD;
                        edgePix[pixIdx+2] = dD;
                        edgePix[pixIdx+3] = 255;
                    
                }
        }

        return edgeDetectedImgd;
}


