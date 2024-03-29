//Curve.js: implementation of curve

Curve.Interpolation_Type = {
    CONSTANT:0, LINEAR:1, BEZIER:1
}

function Curve(){

    this.interpolationType = 1;
    this.points = [];

    function comparePoints( p1, p2 )
    {
        //compare points based on their location (time)
        return p1[0] < p2[0];
    }

    this.InsertPoint = function( newPoint )
    {
        this.points.push(newPoint);
        //sort points based on their location (time)
        this.points.sort(comparePoints);
    }

    this.RemovePoint = function( point )
    {
        for(var i=0; i < this.points.length; ++i)
            if( this.points[i][0] == point[0] && this.points[i][1] == point[1] )
            {
                this.points.splice(i, 1);
                return;
            }
    }

    this.findBoundingPoints = function( value )
    {
        //Perform a binary search through the points to find the two points that
        //the value lies between

        //set up the interval of search to initially be the entire array
        var firstIndex = 0;
        var endIndex = points.length-1;
        var midIndex = endIndex / 2;

        //keep searching until the bounding points have no points between them
        while((endIndex - firstIndex) > 1)
        {
            //recalculate the midIndex
            midIndex = ((endIndex-firstIndex) / 2)+firstIndex;
            
            if( this.points[firstIndex][0] >= value )
            {
                //the value is the firstPoint
                return [ this.points[firstIndex], this.points[firstIndex] ];
            }
            else if( this.points[midIndex][0] > value )
            {
                //the value is between the firstPoint and the midPoint
                //adjust the interval of search
                endIndex = midIndex;
            }
            else if( this.points[midIndex][0] == value )
            {
                //the value is the mid point
                return [ this.points[midIndex], this.points[midIndex] ];
            }
            
            //at this point, the value is greater than the midpoint

            //check if the value is also greater than the endPoint
            else if ( this.points[endIndex][0] <= value )
            {
                //the value is the endPoint
                return [ this.points[endIndex], this.points[endIndex] ];
            }

            //by elimination, the value is between the midpoint and the endpoint
            else
            {
                //the value is between the midPoint and the endPoint
                //adjust the interval of search
                firstIndex = midIndex;
            }
        }

        //the firstPoint and endPoint are now bounding the value
        return [ this.points[firstIndex], this.points[endIndex] ];  
    }


    this.GetValue = function(value)
    {
        if(this.points.length < 1)
            return 0.0;
        
        //find if the value is before the first point
        if(value <= this.points[0][0])
            return this.points[0][1];

        //find if the value is after the last point
        if(value > this.points[this.points.length - 1][0])
            return this.points[this.points.length -1][1];
        
        //find the two closest points to the value
        var bounds = findBoundingPoints(value);
        var p1 = bounds[0]; var p2 = bounds[1];
        
        var intervalLength = p2[0] - p1[0];
        
        //if the endpoints are the same, return one of them
        if(intervalLength < 0.0000001)
            return p1[0];
        
        //return the linear interpolation between the two points
        var distFromFirstPoint = value - p1[0];
        var normalizedLocation = distFromFirstPoint / intervalLength;

        var ret = p1[1]*(1.0-normalizedLocation) +
                  p2[1]*(normalizedLocation);
        return ret;
    }

    this.GetLength = function()
    {
        if(this.points.length < 1)
            return 0.0;
        return this.points[this.points.length - 1][0];
    }

    this.ToString = function()
    {
        var ret = 'Curve: String representation: ';
        for(var i in this.points)
            ret += this.points[i][0] + ':' + this.points[i][1] + ' ';
        return ret;
    }

}
