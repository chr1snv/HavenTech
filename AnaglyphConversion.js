

function ConvertImageToAnaglyph(image, ctx, aCtx, numTimesToDownsample)
{
        console.log("in ConvertImageToAnaglyph");
        //draw the image to the canvas
        ctx.drawImage(image,0,0,canvas.width,canvas.height);

        //read the canvas into an ImageData
        var imgd             = ctx.getImageData(0, 0, canvas.width, canvas.height);


        var downSampleMultiplier = Math.pow(2,numTimesToDownsample);

        //down sample it
        var downSampledImg = imgd;
        for(var i = 0; i < numTimesToDownsample; ++i)
                var downSampledImg = DownSampleImage(downSampledImg);

        //edge detect the downsampled image
        var edgeDetectedImgd = EdgeDetect(downSampledImg);

        //detect features from the edges
        var threshold = 20;
        var imageBorderMargin = 30;
        var featuresList = DetectFeatures( edgeDetectedImgd, imgd, downSampleMultiplier, threshold, imageBorderMargin );

        //ctx.putImageData(edgeDetectedImgd, 0, 0);


        var maxVerticalDifference = 80;
        var expectedHorizontalDifference = imgd.width/3.47 / downSampleMultiplier;
        var maxHorizontalDifference = 50;
        var maxDifference = 800;//80;
        var correspondences = FindCorrespondences(
                featuresList,
                maxDifference,
                maxVerticalDifference,
                expectedHorizontalDifference,
                maxHorizontalDifference,
                imgd.width/2/downSampleMultiplier
        );

        

        //pick the best 3 corresponding pairs
        //pick a random set and rank the set based on
        //how close the lengths of the correspondences are to eachother   ||| lengths
        //how close the correspodence vector directions are to eachother  ||| angles
        //how low the differences between the correspondence features are ||| similarity

        correspondences.sort
        (
                //given two features on the right side compare them by the lowest difference between pairs
                function( a, b )
                {
                        return a.getLowestMatchDifference() - b.getLowestMatchDifference();
                }
        );

        console.log('sorted correspondences');
        var numLowestDifferenceCorrespondencesToDraw = 5;
        var lowestDifferenceCorrespondences = [];
        for( i in correspondences)
        {
                var feature = correspondences[i];
                console.log(feature.getLowestMatchDifference());
                if(numLowestDifferenceCorrespondencesToDraw >= 0)
                        lowestDifferenceCorrespondences.push(feature);
                numLowestDifferenceCorrespondencesToDraw -= 1;
        }


        DrawCorrespondences(ctx, lowestDifferenceCorrespondences, downSampleMultiplier);

        //of the lowest difference correspondences, compare the correspondence vectors to get the best matching set
        


        var leftImgd  = ctx.getImageData(             0, 0, canvas.width/2, canvas.height);
        var rightImgd = ctx.getImageData(canvas.width/2, 0, canvas.width/2, canvas.height);

        aCtx.putImageData(leftImgd, canvas.width/2, 0);
        aCtx.putImageData(rightImgd,             0, 0);



        // Draw the ImageData back to the canvas
        //ctx.clearRect(0,0,canvas.width,canvas.height);
};
