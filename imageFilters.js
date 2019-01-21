

DownSampleImage = function (imgd)
{
        var pix = imgd.data;
        width = imgd.width;

        downSampledImgd = new ImageData(imgd.width/2, imgd.height/2);
        downSampledPix = downSampledImgd.data;

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
        width = imgd.width;

        edgeDetectedImgd = new ImageData(imgd.width, imgd.height);
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
