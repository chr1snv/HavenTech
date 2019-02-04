

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

        DrawCorrespondences(ctx, lowestDifferenceCorrespondences, downSampleMultiplier);

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
        DrawCorrespondences(ctx, setToUse, downSampleMultiplier);


        var leftImgd  = ctx.getImageData(              0, 0, canvas.width/2, canvas.height );
        //leftImgd = ApplyBlueFilter(leftImgd);

        var rightImgd = ctx.getImageData( canvas.width/2, 0, canvas.width/2, canvas.height );
        //rightImgd = ApplyRedFilter(rightImgd);

        //aCtx.putImageData(leftImgd, canvas.width/4, 0);
        //aCtx.putImageData(rightImgd,canvas.width/4, 0);

        //find the rotation and translation to move one image to another


        //get vectors from the beginning image
        var v1 = [setToUse[0].x - setToUse[1].x,
                  setToUse[0].y - setToUse[1].y, 0];

        var v2 = [setToUse[1].x - setToUse[2].x,
                  setToUse[1].y - setToUse[2].y, 0];

        //get vectors from the destination image
        var vo1 = [setToUse[0].matchingFeatures[0].x - setToUse[1].matchingFeatures[0].x, 
                   setToUse[0].matchingFeatures[0].y - setToUse[1].matchingFeatures[0].y, 0];

        var vo2 = [setToUse[1].matchingFeatures[0].x - setToUse[2].matchingFeatures[0].x,
                   setToUse[1].matchingFeatures[0].y - setToUse[2].matchingFeatures[0].y, 0];

        //get the angle of the vectors
        var v1Norm = [v1[0], v1[1], 0];
        Vect3_Unit(v1Norm);
        var v2Norm = [v1[0], v1[1], 0];
        Vect3_Unit(v2Norm);

        var vo1Norm = [vo1[0], vo1[1], 0];
        Vect3_Unit(vo1Norm);
        var vo2Norm = [vo2[0], vo2[1], 0];
        Vect3_Unit(vo2Norm);

        var v1DiffAng = Vect3_Dot1(v1Norm, vo1Norm);
        v1DiffAng = Math.acos( v1DiffAng );

        var v2DiffAng = Vect3_Dot1(v2Norm, vo2Norm);
        v2DiffAng = Math.acos( v2DiffAng );

        console.log("angle differences = " + v1DiffAng * 180 / Math.PI + " : " + v2DiffAng * 180 / Math.PI );

        //create a rotation matrix to rotate the right image to the left image's rotation

        var rotationMatrix = [0,0,0,0,
                              0,0,0,0,
                              0,0,0,0,
                              0,0,0,0];

        Matrix( rotationMatrix, MatrixType.zRot, 0);//-v2DiffAng );
        Matrix_Print( rotationMatrix );

        //map 3 points from from each image to eachother
        //    a  b  1
        //a  [11 12 13]   c
        //b  [21 22 23] = d
        //1  [31 32 33]   1

        //a1 11 + b1 12 + c1 13 = ao1
        //a1 21 + b1 22 + c1 23 = bo1
        //a1 31 + b1 32 + c1 33 = 1
 
        //a2 11 + b2 12 + c2 13 = ao2
        //a2 21 + b2 22 + c2 23 = bo2
        //a2 31 + b2 32 + c2 33 = 1

        //a3 11 + b3 12 + c3 13 = ao3
        //a3 21 + b3 22 + c3 23 = bo3
        //a3 31 + b3 32 + c3 33 = 1

        //a1 11 + b1 12 + c1 13 = ao1 => a1 11 + b1 12 - ao1   = - c1 13 => (a1 11 + b1 12 - ao1) / -c1 = 13
        //a2 11 + b2 12 + c2 13 = ao2 => a2 11 + b2 12 - ao2   = - c2 13 => (a2 11 + b2 12 - ao2) / -c2 = 13
        //a3 11 + b3 12 + c3 13 = ao3 => a3 11 + b3 12 - ao3   = - c3 13 => (a3 11 + b3 12 - ao3) / -c3 = 13

        var rightImageOffsetX = (setToUse[2].x-canvas.width/2)     - setToUse[2].matchingFeatures[0].x;
        var rightImageOffsetY =  setToUse[2].matchingFeatures[0].y - setToUse[2].y;
        var combinedImgd = CombineRightAndLeftImages(leftImgd, rightImgd, canvas.width, rightImageOffsetX, rightImageOffsetY, rotationMatrix, [setToUse[2].x, setToUse[2].y]);

        aCtx.putImageData(combinedImgd, 0, 0);

        // Draw the ImageData back to the canvas
        //ctx.clearRect(0,0,canvas.width,canvas.height);
};
