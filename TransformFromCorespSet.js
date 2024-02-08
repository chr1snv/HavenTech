

TransformFromCorespSet = function( corepsSet ){
//find the rotation and translation to move one image to another


	///find the rotation ////
	//get vectors from the beginning image
	let v1 = [(corepsSet[0].x - corepsSet[1].x),
			  (corepsSet[0].y - corepsSet[1].y), 0]; //vector from point 1 to 0 in right image
			  

	let v2 = [(corepsSet[1].x - corepsSet[2].x),
			  (corepsSet[1].y - corepsSet[2].y), 0]; //vector from point 2 to point 1 in right image

	//get vectors from the destination image
	let vo1 = [(corepsSet[0].featurePairs[0].othFeat.x - corepsSet[1].featurePairs[0].othFeat.x), 
			   (corepsSet[0].featurePairs[0].othFeat.y - corepsSet[1].featurePairs[0].othFeat.y), 0]; //vector from point 1 to 0 in left image

	let vo2 = [(corepsSet[1].featurePairs[0].othFeat.x - corepsSet[2].featurePairs[0].othFeat.x),
			   (corepsSet[1].featurePairs[0].othFeat.y - corepsSet[2].featurePairs[0].othFeat.y), 0]; //vector from point 2 to 1 in left image

	//get the angle of the vectors
	let v1Norm = [v1[0], v1[1], 0];
	Vect3_Unit(v1Norm);
	let v2Norm = [v1[0], v1[1], 0];
	Vect3_Unit(v2Norm);

	let vo1Norm = [vo1[0], vo1[1], 0];
	Vect3_Unit(vo1Norm);
	let vo2Norm = [vo2[0], vo2[1], 0];
	Vect3_Unit(vo2Norm);

	let v1DiffAng = Vect3_Dot(v1Norm, vo1Norm);
	v1DiffAng = Math.acos( v1DiffAng );

	let v2DiffAng = Vect3_Dot(v2Norm, vo2Norm);
	v2DiffAng = Math.acos( v2DiffAng );


	//create a rotation matrix to rotate the right image to the left image's rotation

	let rotationMatrix = [0,0,0,0,
			              0,0,0,0,
			              0,0,0,0,
			              0,0,0,0];

	Matrix( rotationMatrix, MatrixType.zRot, -Math.min(v1DiffAng, v2DiffAng) );
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

	let rightImageOffsetX = ((corepsSet[2].x)  - corepsSet[2].featurePairs[0].othFeat.x);
	let rightImageOffsetY =  (corepsSet[2].featurePairs[0].othFeat.y   - corepsSet[2].y);
	
	document.getElementById( "anaglyphTransformation" ).innerText = 
		"degree/360 angle differences (min of two used) " + v1DiffAng * 180 / Math.PI + " : " + v2DiffAng * 180 / Math.PI +'\n' +
		'translation x,y ' + rightImageOffsetX + ', ' + rightImageOffsetY;
		
	return [rotationMatrix, [rightImageOffsetX, rightImageOffsetY], [corepsSet[2].x, corepsSet[2].y]];
}
