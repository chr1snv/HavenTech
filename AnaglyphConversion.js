

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
                //console.log(feature.getLowestMatchDifference());
                if(numLowestDifferenceCorrespondencesToDraw >= 0)
                        lowestDifferenceCorrespondences.push(feature);
                numLowestDifferenceCorrespondencesToDraw -= 1;
        }

        var numLowestDifferenceCorrespondencesToPick = 3;
        var possibleCorrespondenceSets = chooseNFrom( lowestDifferenceCorrespondences, numLowestDifferenceCorrespondencesToPick );

        var setDifferenceScores = [];
        for( var setIdx in possibleCorrespondenceSets)
        {
                var set = possibleCorrespondenceSets[setIdx];

                var featurePairs = [];

                class FeaturePair
                {
                        constructor(feature1In, feature2In)
                        {
                                this.feature1 = feature1In;
                                this.feature2 = feature2In;

                                this.xDiff = feature1In.x - feature2In.x;
                                this.yDiff = feature1In.y - feature2In.y;

                                this.pairDistance = (this.xDiff*this.xDiff) + (this.yDiff*this.yDiff);
                        }
                }

                //score the correspondence set
                //compare the correspondence vectors to get the best matching set
                var averageXDist = 0;
                var averageYDist = 0;
                var featurePairs = [];
                var lowestSetScore = 9999999;
                var lowestSetFeaturePairs = undefined;
                var lowestSetAverageXDist;
                var lowestSetAverageYDist;
                var lowestSet = undefined;
                for ( var featureIdx in set )
                {
                        var feature = set[featureIdx];
                        var matchingFeature = feature.matchingFeatures[0];
                        var featurePair = new FeaturePair(feature, matchingFeature);
                        averageXDist += featurePair.xDiff;
                        averageYDist += featurePair.yDiff;
                        featurePairs.push(featurePair);
                }
                averageXDist /= set.length;
                averageYDist /= set.length;

                var totalXDistanceFromAverage = 0;
                var totalYDistanceFromAverage = 0;
                for ( var featureIdx in featurePairs )
                {
                        var featurePair = featurePairs[featureIdx];
                        totalXDistanceFromAverage += Math.abs(featurePair.xDiff - averageXDist);
                        totalYDistanceFromAverage += Math.abs(featurePair.yDiff - averageYDist);
                }
                var setScore = totalXDistanceFromAverage + totalYDistanceFromAverage;
                if( setScore < lowestSetScore )
                {
                        lowestSet = set;
                        lowestSetScore = setScore;
                        lowestSetFeaturePairs = featurePairs;
                        lowestSetAverageXDist = averageXDist;
                        lowestSetAverageYDist = averageYDist;
                }
                setDifferenceScores.push( setScore );
                var scoresLen = setDifferenceScores.length;
                console.log("set difference score " + scoresLen + " " + setDifferenceScores[scoresLen-1] );
        }

        var setToUse = lowestSet; //Math.round(Math.random() * possibleCorrespondenceSets.length);
        DrawCorrespondences(ctx, possibleCorrespondenceSets[setToUse], downSampleMultiplier);


        var leftImgd  = ctx.getImageData(              0, 0, canvas.width/2, canvas.height );
        //leftImgd = ApplyBlueFilter(leftImgd);

        var rightImgd = ctx.getImageData( canvas.width/2, 0, canvas.width/2, canvas.height );
        //rightImgd = ApplyRedFilter(rightImgd);

        //aCtx.putImageData(leftImgd, canvas.width/4, 0);
        //aCtx.putImageData(rightImgd,canvas.width/4, 0);

        //map 3 points from from each image to eachother
        //    a  b  1
        //a  [11 12 13]   c
        //b  [21 22 23] = d
        //1  [31 32 33]   1

        //a1 x1 + b1 x2 + c1 x3 = ao1
        //a1 x1 + b1 x2 + c1 x3 = bo1
        //a1 x1 + b1 x2 + c1 x3 = co1

        //a2 x1 + b2 x2 + c2 x3 = ao2
        //a2 x1 + b2 x2 + c2 x3 = bo2
        //a2 x1 + b2 x2 + c2 x3 = co2

        //a3 x1 + b3 x2 + c3 x3 = ao3
        //a3 x1 + b3 x2 + c3 x3 = bo3
        //a3 x1 + b3 x2 + c3 x3 = co3

        var rightImageOffsetX = lowestSetAverageXDist-canvas.width/4;
        var rightImageOffsetY = lowestSetAverageYDist;
        var combinedImgd = CombineRightAndLeftImages(leftImgd, rightImgd, canvas.width, rightImageOffsetX, rightImageOffsetY);

        aCtx.putImageData(combinedImgd, 0, 0);

        // Draw the ImageData back to the canvas
        //ctx.clearRect(0,0,canvas.width,canvas.height);
};
