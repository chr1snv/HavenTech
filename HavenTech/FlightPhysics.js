//airplane_physics.js

//find the center of gravity

var Vect3_Lerp = function( p1, p2, p2Weight){
    return [ p1[0] * (1-p2Weight ) + p2[0] * p2Weight,
             p1[1] * (1-p2Weight ) + p2[1] * p2Weight,
             p1[2] * (1-p2Weight ) + p2[2] * p2Weight ];
}

var Vect3_Sub = function( p1, p2 ){
    return [ p1[0] - p2[0],
             p1[1] - p2[1],
             p1[2] - p2[2] ];
}

var calculateCenterOfMass = function( points ){
    //calculate the cg of the points

    var cgCenter = [0,0,0];
    var cgMass   = 0;

    //accumulate new points into the cg
    for (var i = 0; i < points.length; i++){
        
        var percentOfCgIsNewMass;
        
        if( cgMass > 0.001 ) //prevent division by zero
            percentOfCgIsNewMass = points[i].mass / cgMass;
        else
            percentOfCgIsNewMass = 1;

        cgCenter = Vect3_Lerp( cgCenter, points[i].coord, percentOfCgIsNewMass);

        cgMass += points[i].mass;        
    }

    return {coord:cgCenter, mass:cgMass};

}

var calculateMomentOfInertia = function( points, cg ){

    //The moment of inertia of a body is calculated by
    //summing mr^2 for every particle in the body
    //about a given rotation axis
    var momentOfInertia = [0,0,0];
    for( var i = 0; i < points.length; i++ ){
        var p = points[i];
        //get the vector representing the lever arm
        //from the point to the center of mass
        var diff = Vect3_Sub( p.coord, cg );

        //calculate the moment of inertia
        //for each axis of rotation

        var Ix = diff[1]*diff[1] * p.mass;
        momentOfInertia[1] += Ix;

        var Iy = diff[1]*diff[1] * p.mass;
        momentOfInertia[1] += Iy;

        var Iz = diff[2]*diff[2] * p.mass;
        momentOfInertia[2] += Iz;
    }

    return momentOfInertia;
}


var surf = {
    rot:[0,0,0,0],        //the rotation in the airplane coordinate system
    scale:[1,0.2,1],      //the dimensions of the wing surface ( used for calculating its area)
    pos:[0,0,0]           //the position of the wing surface in the airplane coordinate system
};


//takes in the direction and magnitude of the air affecting the surface
//as a vector in the airplane coordinate system and
var calculateSurfaceLiftDragForce = function( surf, windVector ){

    var Cdo = 0.01; //drag coefficent at zero lift

    var Ar = 1; //aspect ratio ( span*span / area )

    var e = 0.2; //efficency ratio

    //find the angle of attack of the wing
    var backwardsWingVector = Quat_Rotate( surf.rot, [0,0,-1] );


    //approximate the coefficent of lift using the angle of attack
    var CI = 2 * math.pi * AoA;
    
    //calculate the lift generated
    var L = 0.5 * CI * ( r * V*V )/2 * A;

    //calculate the drag 
    var Cd = Cdo + (CI*CI) / (math.pi * Ar * e );

    //calucate the vector version of the lift and drag components
    var dragVector = Vect3_scale( Vect3_negate(Vect3_normalize(windVector)), Cd );

    var wingWindAxis = Vect3_cross( windVector, backwardsWingVector );
    
    var liftVector = Vect3_scale( 
                        Vect3_normalize(
                             Quat_Rotate(
                                 Quat_AngleAxis(math.pi/2, wingWindAxis ), windVector ) 
                                       ),
                                   L );

    return Vect3_Add( dragVector, liftVector );
}

points = [
    {coord:[1,1,2], mass:50},
    {coord:[1,1,1], mass:20} ];

var cg = calculateCenterOfMass(points);

var I = calculateMomentOfInertia( points, cg.coord );

window.onload = function(){
    document.getElementById('status').innerHTML = I;
}
