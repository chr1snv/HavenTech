
//for a set (array)
//pick all of the the combinations of choose number of elements
//i.e.
//[1,2,3,4,5]  5 choose 3
//[1,2,3, , ]
//[1,2, ,4, ]
//[1,2, , ,5]
//[1, ,3,4, ]
//[1, ,3, ,5]
//[1, , ,4,5]
//[ ,2,3,4, ]
//[ ,2,3, ,5]
//[ ,2, ,4,5]

//choose 3 from [1,2,3,4,5] can be found by
//1 + choose 2 from [2..5] => 1(2(3)) 1(2(4)) 1(2(5)) 1(3(4)) 1(3(5))
//2 + choose 2 from [3..5]
//3 + choose 2 from [4..5]

//this function generates all possible n length subsets of values
//for cases when values.length is large, it may not be practical to use

//combinatorically chooses n values from the values array
//recurses
function chooseNFrom( values, n, nCur = -1 )
{
	let choices = [];

	if(values.length <= nCur){ 
		//asked to return more sub choice values than 
		//the remainder of the array has, return all
		return [values];
	}else
	{
		if(nCur == -1) //top level/first call need to recurse to get all choices
			nCur = n;

		let nCurMin1 = nCur - 1; //num recursions minus 1

		let thisChoiceLength = values.length;
		if( nCurMin1 > 0 ){ 
			thisChoiceLength -= nCurMin1; //number of single values at this level is the length - sub choice number

			for( let j = 0; j < thisChoiceLength; j += 1 ){
				let value = values[j];
				//pass the part of the array after the single choice to form n-1, n-2.. etc subchoices
				//slice(start|inclusive|, end|excluded|) //zero based indicies
				let subChoices = chooseNFrom(values.slice(j+1,values.length), n, nCurMin1); //recurse
				for(let idx in subChoices){ //combine these single values with each of the sub choices
					let choice = [value];
					let subChoice = subChoices[idx];

					for(var sIdx in subChoice){ //append the sub choice values
						choice.push(subChoice[sIdx]);
					}
					choices.push(choice);
				}
			}
		}else{ //finished recursing return single values in the array
			for( let j = 0; j < thisChoiceLength; j += 1 ){
				choices.push([values[j]]);
			}
		}
		return choices;
	}
}

//returns the factorial of x
function fact(x) {
	if(x==0)
		return 1;
	return x * fact(x-1);
}

//C(n, k)= n!/[k!(n-k)!]
//number of sets of length k
//chosen from n
function numSetsOfnChooseK(n,k){
	return fact(n)/(fact(k)*(fact(n-k)));
}

//because n choose k can be such a large number of sets
//this function was made to randomly generate x number of subsets of n choices
function randomlyChooseUpToXSetsOfNFrom( values, n, x ){
	//if x, the number of n length subsets to generate is greater the
	//possible number of n length sets, return all possible subsets
	
	if( values.length < 20 && n < 20 && numSetsOfnChooseK( values.length, n ) <= x ){ //limit factorial computation
		return chooseNFrom( values, n );
	}
	let choiceSubsets = [];
	for( let i = 0; i < x; ++i ){
		let subset = [];
		let idxs = {};
		for( let nidx = 0; nidx < n; ++nidx ){
			let idx = Math.round(Math.random() * (values.length-1));
			while( idxs[idx] == 1 ){ //generate a new index until finding a unique one for the set
				idx = Math.round(Math.random() * (values.length-1));
			}
			idxs[idx] = 1; //remember the indicies used in this subset
			subset.push( values[idx] );
		}
		choiceSubsets.push( subset );
			
	}
	
	return choiceSubsets;
}


