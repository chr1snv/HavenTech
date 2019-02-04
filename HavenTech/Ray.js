//Ray.js - provides functions dealing with ray intersections

//equation of a ray - p = orig + dir * t


//returns the timestep of the second ray for the point of intersection
//of two rays in R2
function RayRayIntersection( o1, d1, o2, d2 ){
//    var t1 = ( o2[0] - o1[0] + d2[0] * t2 ) / d1[0];
//    var t1 = ( o2[1] - o1[1] + d2[1] * t2 ) / d1[1];
//    
//    = ( o2[0] - o1[0] + d2[0] * t2 ) * d1[1];
//    = ( o2[1] - o1[1] + d2[1] * t2 ) * d1[0];
//    
//    = ( o2[0] - o1[0] ) * d1[1] + ( d2[0] * t2 ) * d1[1];
//    = ( o2[1] - o1[1] ) * d1[0] + ( d2[1] * t2 ) * d1[0];
//    
//    = ( o2[0] - o1[0] ) * d1[1] + ( d2[0] * d1[1] * t2 );
//    = ( o2[1] - o1[1] ) * d1[0] + ( d2[1] * d1[0] * t2 );
//    
//    = ( d2[0] * d1[1] * t2 ) - ( d2[1] * d1[0] * t2 );
//    = ( o2[1] - o1[1] ) * d1[0] - ( o2[0] - o1[0] ) * d1[1];
//    
//    = ( d2[0] * d1[1] - d2[1] * d1[0] ) * t2;
//    = ( o2[1] - o1[1] ) * d1[0] - ( o2[0] - o1[0] ) * d1[1];
    
    var num = ( o2[1] - o1[1] ) * d1[0] - ( o2[0] - o1[0] ) * d1[1];
    var denom = ( d2[0] * d1[1] - d2[1] * d1[0] );
    
    if( Math.abs( denom ) < 0.001 )
        return undefined;
    //return t2
    return num / denom;
}


