

//find matches between featuresLists[0] and [1] (left and right image features)
//that satisfy the requirements of having similar pixel values and position
//and return an array of featuresLists[0] features that have correspondances/matches
function FindCorrespondences( featureLists, matchThreshold, 
			maxVerticalDifference, 
			maxHorizontalDifference ){
			
	let correspondences = [];
	for( let featureIdx0 in featureLists[0] ){ //left side features
		let feature0 = featureLists[0][featureIdx0];
		for( let featureIdx1 in featureLists[1]){ //right side features

			let feature1 = featureLists[1][featureIdx1];

			let verticalDifference = Math.abs(feature1.y - feature0.y);
			let horizontalDifference = Math.abs(feature1.x - feature0.x);
			//check features are reasonably vertically and horizontally aligned
			if( verticalDifference   < maxVerticalDifference &&
				horizontalDifference < maxHorizontalDifference){
				let pixDiff = feature0.comparePixelValues(feature1);

				//console.log ( difference );

				if(pixDiff < matchThreshold){
					//console.log( "adding match" );
					feature0.addMatchingFeature(feature1, pixDiff, horizontalDifference, verticalDifference);
				}
			}
		}
		//only add the feature if correspondances (matching features) were found for it
		if(feature0.featurePairs.length > 0){
		
			feature0.featurePairs.sort
			(
				//given two correspondances sort them by position difference
				function( a, b ){
					return a.pairDistance - b.pairDistance;
				}
			);
		
			correspondences.push(feature0);
		}
			
		
	}
	return correspondences;
}


function RankCorrespondanceSetsByDifferences(possibleCorrespondenceSets){
	var setDifferenceScores = [];
	
	let lowestSetScore = 9999999;
	let lowestSet = undefined;
	
	for( let setIdx in possibleCorrespondenceSets){
	
		let set = possibleCorrespondenceSets[setIdx];

		//score the correspondence set
		//compare the correspondence vectors to get the best matching set
		
		//get the average x and y distances
		let averageXDist = 0;
		let averageYDist = 0;
		for ( let featureIdx in set ){
			let featurePair = set[featureIdx].featurePairs[0];
			averageXDist += featurePair.xDiff;
			averageYDist += featurePair.yDiff;
		}
		averageXDist /= set.length;
		averageYDist /= set.length;

		//sum how far from the average each pair is
		let totalXDistanceFromAverage = 0;
		let totalYDistanceFromAverage = 0;
		for ( let featureIdx in set ){
				let featurePair = set[featureIdx].featurePairs[0];
				totalXDistanceFromAverage += Math.abs(featurePair.xDiff - averageXDist);
				totalYDistanceFromAverage += Math.abs(featurePair.yDiff - averageYDist);
		}
		let setScore = totalXDistanceFromAverage + totalYDistanceFromAverage;
		if( setScore < lowestSetScore ){ //if better than other sets
			lowestSet = set;
			lowestSetScore = setScore;
		}
		var scoresLen = setDifferenceScores.length;
		//console.log("set difference score " + setScore + " lowestSetScore " + lowestSetScore );
	}
	return lowestSet;
}
