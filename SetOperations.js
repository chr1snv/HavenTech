
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

function chooseNFrom2( values, n, nCur = -1 )
{
        var choices = [];

        if(values.length <= nCur)
        {
                return [values];
        }
        else
        {
                if(nCur == -1)
                        nCur = n;

                var nMin1 = nCur - 1;

                var thisChoiceLength = values.length;
                if( nMin1 > 0 )
                {
                        thisChoiceLength -= nMin1;

                        for( var j = 0; j < thisChoiceLength; j += 1 )
                        {
                                var value = values[j];
                                var subChoices = chooseNFrom2(values.slice(j+1,values.length), n, nMin1);
                                for (var idx in subChoices)
                                {
                                        var choice = [value];
                                        var subChoice = subChoices[idx];

                                        for (var sIdx in subChoice)
                                        {
                                                choice.push(subChoice[sIdx]);
                                        }
                                        choices.push(choice);
                                }
                        }
                }
                else
                {
                        for( var j = 0; j < thisChoiceLength; j += 1 )
                        {
                                choices.push([values[j]]);
                        }
                }
                return choices;
        }
}


function chooseNFrom( values, n )
{
        var choices = [];

        if(n == 1)
        {
                for( var i in values )
                {
                        choices.push([values[i]]);
                }
        }
        else
        {

                var nMin1 = n - 1;
                for( var i = 0; i < values.length-nMin1; i += 1 )
                {
                        var firstChoice = values[i];
                        for( var j = i+1; j < values.length; j += 1 )
                        {
                                var subChoices = chooseNFrom(values.slice(j,values.length), nMin1);
                                for (var idx in subChoices)
                                {
                                        var subChoice = subChoices[idx];

                                        var choice = [firstChoice];
                                        for (var sIdx in subChoice)
                                        {
                                                choice.push(subChoice[sIdx]);
                                        }
                                        choices.push(choice);
                                }
                        }
                }
        }
        return choices;
}
