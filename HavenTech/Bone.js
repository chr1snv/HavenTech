//Bone.js: Bone Implementation

function Bone( skelAnimFileLines, SLIdx ){

    this.GetChan_Mat = function( m, time)
    {
        var scale = new Float32Array([0,0,0]);
        var quaternion = new Float32Array([0,0,0,0]);
        var transformation = new Float32Array([0,0,0]);
        this.GetScale(scale, time);
        this.GetQuaternion(quaternion, time);
        Quat_Normalize(quaternion);
        this.GetTransformation(transformation, time);
        Matrix(m, MatrixType.quat_transformation, scale, quaternion, transformation);
    }

    this.GetScale = function( scale, time)
    {
        //returns the animated scale component of the bone
        scale[0] = this.scaleX.GetValue(time);
        scale[1] = this.scaleY.GetValue(time);
        scale[2] = this.scaleZ.GetValue(time);

        //curves return 0 when there empty, make 1 for scaling
        if (scale[0] == 0.0 && scale[1] == 0.0 && scale[2] == 0.0) {
            scale[0] = scale[1] = scale[2] = 1.0;
            return;
        }
    }

    this.GetQuaternion = function( quaternion, time)
    {
        //returns the animated rotation component of the bone
        quaternion[0] = this.quaternionX.GetValue(time);
        quaternion[1] = this.quaternionY.GetValue(time);
        quaternion[2] = this.quaternionZ.GetValue(time);
        quaternion[3] = this.quaternionW.GetValue(time);

        //if all the curves return 0, return the identity quaternion
        if(quaternion[0] == 0.0 && quaternion[1] == 0.0 && quaternion[2] == 0.0 && quaternion[3] == 0.0){
            Quat_Identity(quaternion);
            return;
        }
    }

    this.GetTransformation = function( transformation, time)
    {
        //return the animated translation component of the bone
        transformation[0] = this.locationX.GetValue(time);
        transformation[1] = this.locationY.GetValue(time);
        transformation[2] = this.locationZ.GetValue(time);
    }

    this.calculateAnimationLength = function()
    {
        //return the length of the animation (return the greatest length of the
        //animation curves for the bone)

        var length = 0.0;

        if(this.locationX.GetLength() > length)
            length = this.locationX.GetLength();
        if(this.locationY.GetLength() > length)
            length = this.locationY.GetLength();
        if(this.locationZ.GetLength() > length)
            length = this.locationZ.GetLength();

        if(this.quaternionX.GetLength() > length)
            length = this.quaternionX.GetLength();
        if(this.quaternionY.GetLength() > length)
            length = this.quaternionY.GetLength();
        if(this.quaternionZ.GetLength() > length)
            length = this.quaternionZ.GetLength();
        if(this.quaternionW.GetLength() > length)
            length = this.quaternionW.GetLength();

        if(this.scaleX.GetLength() > length)
            length = this.scaleX.GetLength();
        if(this.scaleY.GetLength() > length)
            length = this.scaleY.GetLength();
        if(this.scaleZ.GetLength() > length)
            length = this.scaleZ.GetLength();

        this.animationLength = length;
    }

    this.parentName = "Not Set";
    this.boneName = "Not Set";

    this.roll = 0.0;

    this.animationLength = 0.0;

    this.locationX   = new Curve();
    this.locationY   = new Curve();
    this.locationZ   = new Curve();
    this.quaternionX = new Curve();
    this.quaternionY = new Curve();
    this.quaternionZ = new Curve();
    this.quaternionW = new Curve();
    this.scaleX      = new Curve();
    this.scaleY      = new Curve();
    this.scaleZ      = new Curve();

    this.parentIdx   = -1;
    this.childrenIdxs= [];
    this.children    = [];

    this.head = new Float32Array([0,0,0]);
    this.tail = new Float32Array([0,0,0]);

    this.inverseBindPose = new Float32Array(4*4);

    //fStream is a opened file stream with the read marker set to the beginning
    //of this bones data

    while(sLIdx < skelAnimFileLines.length)
    {
        var temp = skelAnimFileLines[++sLIdx];
        var words = temp.split(' ');

        //read in the bone, parent, and child name
        if(temp[0] == 'N')
        {
            this.boneName = words[1];
        }
        else if(temp[0] == 'p')
        {
            this.parentName = words[1];
        }
        else if(temp[0] == 'c')
        {
           var newChild = words[1];
           this.children.push(newChild);
        }

        //read in the bind pose data (bone space)
        else if(temp[0] == 'H')
        {
            this.head = new Float32Array([words[1], words[2], words[3] ] );
        }
        else if(temp[0] == 'T')
        {
            this.tail = new Float32Array([words[1], words[2], words[3] ]);
        }
        else if(temp[0] == 'R')
        {
            this.roll = words[1];
        }

        //read in the animation data
        //location data
        else if(temp[0] == 'X')
        {
            var timeTemp = words[1];
            var valueTemp = words[2];
            var insertPoint = Vect2(words[1], words[2]);
            this.locationX.InsertPoint(insertPoint);
        }
        else if(temp[0] == 'Y')
        {
            var timeTemp = words[1];
            var valueTemp = words[2];
            var insertPoint = Vect2(words[1], words[2]);
            this.locationY.InsertPoint(insertPoint);
        }
        else if(temp[0] == 'Z')
        {
            var timeTemp = words[1];
            var valueTemp = words[2];
            var insertPoint = Vect2(words[1], words[2]);
            this.locationZ.InsertPoint(insertPoint);
        }
        //quaternion data
        else if(temp[0] == 'W')
        {
            var timeTemp = words[1];
            var valueTemp = words[2];
            var insertPoint = Vect2(words[1], words[2]);
            this.quaternionW.InsertPoint(insertPoint);
        }
        else if(temp[0] == 'J')
        {
            var timeTemp = words[1];
            var valueTemp = words[2];
            var insertPoint = Vect2(words[1], words[2]);
            this.quaternionX.InsertPoint(insertPoint);
        }
        else if(temp[0] == 'K')
        {
            var timeTemp = words[1];
            var valueTemp = words[2];
            var insertPoint = Vect2(words[1], words[2]);
            this.quaternionY.InsertPoint(insertPoint);
        }
        else if(temp[0] == 'L')
        {
            var timeTemp = words[1];
            var valueTemp = words[2];
            var insertPoint = Vect2(words[1], words[2]);
            this.quaternionZ.InsertPoint(insertPoint);
        }
        //scale data
        else if(temp[0] == 'A')
        {
            var timeTemp = words[1];
            var valueTemp = words[2];
            var insertPoint = Vect2(words[1], words[2]);
            this.scaleX.InsertPoint(insertPoint);
        }
        else if(temp[0] == 'B')
        {
            var timeTemp = words[1];
            var valueTemp = words[2];
            var insertPoint = Vect2(words[1], words[2]);
            this.scaleY.InsertPoint(insertPoint);
        }
        else if(temp[0] == 'C')
        {
            var timeTemp = words[1];
            var valueTemp = words[2];
            var insertPoint = Vect2(words[1], words[2]);
            this.scaleZ.InsertPoint(insertPoint);
        }

        //check for end of bone data
        else if(temp[0] == 'e')
            break;
    }

    this.calculateAnimationLength();
    
    //generate cached matrices for fast lookup

    //roll_Mat
    this.roll_Mat = new Float32Array(4*4);
    Matrix(this.roll_Mat, MatrixType.yRot, this.roll);
    //orientation_Mat
    this.orientation_Mat = new Float32Array(4*4);
    Matrix(this.orientation_Mat, MatrixType.orientation, this.tail, this.head);
    //bone_Mat
    this.bone_Mat = new Float32Array(4*4);
    Matrix_Multiply(this.bone_Mat, this.orientation_Mat, this.roll_Mat);
    //head_Mat
    this.head_Mat = new Float32Array(4*4);
    Matrix(this.head_Mat, MatrixType.translate, this.head);
    //loc_tail_Mat
    var tempVec = new Float32Array([0,0,0]);
    Vect3_Distance(tempVec[1], this.tail, this.head);
    this.loc_tail_Mat = new Float32Array([0,0,0]);
    Matrix(this.loc_tail_Mat, MatrixType.translate, tempVec);
}


