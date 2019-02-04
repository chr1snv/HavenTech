//Vect3.js

function Vect3_Cmp(v1, v2) { return (v1[0] == v2[0] && v1[1] == v2[1] && v2[2] == v2[2]); }

function Vect3_Zero(v1) { v1[0] = v1[1] = v1[2] = 0.0; }

function Vect3_Copy(v1, v2) { v1[0] = v2[0]; v1[1] = v2[1]; v1[2] = v2[2]; }

function Vect3_Neg(v1) { v1[0] = -v1[0]; v1[1] = -v1[1]; v1[2] = -v1[2]; }

function Vect3_Add(v1, v2) { v1[0] += v2[0]; v1[1] += v2[1]; v1[2] += v2[2]; }

function Vect3_Sub(v1, v2) { v1[0] -= v2[0]; v1[1] -= v2[1]; v1[2] -= v2[2]; }

function Vect3_Mult(v1, v2) { v1[0] *= v2[0]; v1[1] *= v2[1]; v1[2] *= v2[2]; }

function Vect3_MultScal(v1, scalar) { v1[0] *= scalar; v1[1] *= scalar; v1[2] *= scalar; }

function Vect3_Div(v1, v2) { v1[0] /= v2[0]; v1[1] /= v2[1]; v1[2] /= v2[2]; }

function Vect3_DivScal(v1, scalar) { v1[0] /= scalar; v1[1] /= scalar; v1[2] /= scalar; }

function Vect3_Cross(ret, v1, v2) {
    ret[0] = v1[1]*v2[2] - v2[1]*v1[2];
    ret[1] = v2[0]*v1[2] - v1[0]*v2[2];
    ret[2] = v1[0]*v2[1] - v2[0]*v1[1];
}

function Vect3_Dot( result, v1, v2) { result = v1[0]*v2[0] + v1[1]*v2[1] + v1[2]*v2[2]; }
function Vect3_Dot1(v1, v2)
{
        return v1[0]*v2[0] + v1[1]*v2[1] + v1[2]*v2[2];
}

function Vect3_Dist(dist, v1, v2) {
    var diff = new Float32Array(3);
    Vect3_Copy(diff, v1);
    Vect3_Sub(diff, v2); //diff is now the vector from v2 to v1

    Vect3_Len(dist, diff);
}

function Vect3_Len( v1 ) {
    var len = Vect3_LenSq(v1);
    return Math.sqrt(len);
}

function Vect3_LenSq(v1){ return v1[0]*v1[0]+v1[1]*v1[1]+v1[2]*v1[2]; }

function Vect3_Unit(v1){
    var len = Vect3_Len(v1);
    Vect3_DivScal(v1, len);
}

function Vect3_Orthogonal(v1){
    //returns the unit vector orthogonal in the zx plane
    //(no vertical component) [used in camera class]
    var temp = v1[0];
    v1[0] = -v1[2]; v1[1] = 0; v1[2] = -temp;
    Vect3_Unit(v1);
}

function Vect3_LERP(v, v1, v2, v2Weight){
    var v1Weight = 1.0-v2Weight;
    v[0] = v1[0]*v1Weight + v2[0]*v2Weight;
    v[1] = v1[1]*v1Weight + v2[1]*v2Weight;
    v[2] = v1[2]*v1Weight + v2[2]*v2Weight;
}
