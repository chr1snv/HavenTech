
function isOnRightSideOfImage(feature, halfImageX)
{
        if( feature.x > halfImageX )
                return true;
        return false;
}

function FindCorrespondences(featuresList, matchThreshold, maxVerticalDifference, halfImageX)
{
        var correspondences = [];
        for( var featureIdx0 in featuresList )
        {
                var feature0 = featuresList[featureIdx0];
                var feature0OnRight = isOnRightSideOfImage(feature0, halfImageX);
                for( var featureIdx1 in featuresList)
                {
                        //check it isn't the same feature being compared to itself
                        if(featureIdx1 != featureIdx0 )
                        {
                                var feature1 = featuresList[featureIdx1];
                                var feature1OnRight = isOnRightSideOfImage(feature1, halfImageX);

                                var verticalDifference = Math.abs(feature1.y - feature0.y);

                                //check features are on opposite halfs of the image
                                if( feature1OnRight != feature0OnRight && verticalDifference < maxVerticalDifference)
                                {

                                        var difference = feature1.comparePixelValues(feature0);

                                        //console.log ( difference );

                                        if(difference < matchThreshold)
                                        {
                                                //console.log( "adding match" );
                                                feature1.addMatchingFeature(feature0);
                                                if(feature1OnRight)
                                                        correspondences.push(feature1);
                                                else
                                                        correspondences.push(feature0);
                                        }
                                }
                        }
                }
        }
        return correspondences;
}

function DrawFeature(f, color, ctx, downSampleMultiplier)
{
        var radius = 2;
        ctx.beginPath();
        ctx.arc(f.x*downSampleMultiplier, f.y*downSampleMultiplier, radius, 0, 2 * Math.PI, false);
        ctx.fillStyle = color;
        ctx.fill();
}

var colors =
[
"#FF0000",
"#00FF00",
"#0000FF",
"#FFFF00",
"#FF00FF",
"#00FFFF"
];
var colorIdx = 0;

function DrawCorrespondences(ctx, featuresList, downSampleMultiplier)
{
        for( featureIdx in featuresList )
        {
                color = colors[colorIdx];
                colorIdx = (colorIdx + 1) % colors.length;

                f = featuresList[featureIdx];
                DrawFeature(f, color, ctx, downSampleMultiplier);

                for( foIdx in f.matchingFeatures)
                {
                        fo = f.matchingFeatures[foIdx];
                        DrawFeature(fo, color, ctx, downSampleMultiplier);
                        ctx.beginPath();
                        ctx.moveTo(f.x*downSampleMultiplier, f.y*downSampleMultiplier);
                        ctx.lineTo(fo.x*downSampleMultiplier, fo.y*downSampleMultiplier);
                        ctx.lineWidth = 0.1;
                        ctx.strokeStyle = color;
                        ctx.stroke();
                        //console.log('adding line' + fo.x + " " + fo.y);
                }                      
        }
}
