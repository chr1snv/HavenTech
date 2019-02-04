//Light.js - a light scene object

function Light(nameIn, sceneNameIn, colorIn, intensityIn, lightTypeIn, posIn, rotIn, coneAngleIn){
    this.Type = {
        Directional : 1,
        Point       : 0,
        Spot        : 2
    }

    this.lname = nameIn;
    this.sceneName = sceneNameIn;
    this.ipoAnimation   = new IPOAnimation(nameIn, this.sceneName);
    this.pos            = new Float32Array([0,0,0]);
    this.rot            = new Float32Array([0,0,0]);
    this.color          = new Float32Array([0,0,0]);
    this.intensity      = intensityIn;
    this.ambientIntensity = 0.0;
    this.coneAngle      = coneAngleIn !== undefined ? coneAngleIn : 180.0;
    this.lightType      = lightTypeIn !== undefined ? lightTypeIn : this.Type.Directional;

    this.updatedTime    = 0.0;

    //depending on the type of light, ignore constructor inputs
    Vect3_Copy(this.color, colorIn);
    if(this.lightType == this.Type.Directional){
        Vect3_Copy(this.rot, rotIn);
    }
    else if(this.lightType == this.Type.Point){
        Vect3_Copy(this.pos, posIn);
    }
    else{ //Spot
        Vect3_Copy(this.pos, posIn);
        Vect3_Copy(this.rot, rotIn);
    }

    
    this.GetName    = function()  { return lname; }
    this.GetPos     = function()  { return pos; }
    this.GetRot     = function()  { return rot; }
    this.GetColor   = function()  { return color; }
    
    this.Update     = function(time) { updatedTime = time; }

    this.BindToGL   = function(lightNumber) {
        
        //pass color and intensity data
        var colIntens = new Float32Array(4);
        Vect3_Copy(colIntens, this.color);
        colIntens[3] = this.intensity;
        gl.uniform4fv(
            gl.getUniformLocation( graphics.currentProgram, 'lightColor[' + lightNumber + ']' ),
            colIntens );
        
        //get the position and rotation
        var position = new Float32Array(3);
        var rotation = new Float32Array(3);
        if(this.ipoAnimation.isValid){
            this.ipoAnimation.GetLocation(position, updatedTime);
            this.ipoAnimation.GetRotation(rotation, updatedTime);
        }
        else{ //if the ipo isn't valid just use the static values
            Vect3_Copy(position, this.pos);
            Vect3_Copy(rotation, this.rot);
        }

        //calculate the light direction normal
        var basisVect = [0.0,-1.0, 0.0];
        var lightNormal = new Array(4);
        var rotMatrix   = new Array(4*4);
        Matrix( rotMatrix, MatrixType.euler_rotate, rotation );
        Matrix_Multiply( lightNormal, rotMatrix, basisVect );
        
        //pass data dependent on the type of light
        if(this.lightType == this.Type.Directional){ //directional light
            lightNormal[3] = 0.0;
            Vect3_Negative(lightNormal);
            gl.uniform3f(
                gl.getUniformLocation(graphics.currentProgram, 'lightVector[' + lightNumber + ']'),
                lightNormal );
            gl.uniform1f(
                gl.getUniformLocation(graphics.currentProgram, 'lightSpotConeAngle[' + lightNumber + ']'),
                180     );
        }
        else{ //either a point light or a spot light
            gl.uniform3fv(
                gl.getUniformLocation(graphics.currentProgram, 'lightVector[' + lightNumber + ']'),
                position );
            
            //pass the direction and angle data (if spot)
            if(this.lightType == this.Type.Spot){
                lightNormal[3] = 1.0; //positional light
                gl.uniform4f(
                    gl.getUniformLocation(graphics.currentProgram, 'lightDirection[' + lightNumber + ']'), 
                    lightNormal );
                gl.uniform1f(
                    gl.getUniformLocation(graphics.currentProgram, 'lightSpotConeAngle[' + lightNumber + ']'), 
                    coneAngle );
            }
            else{ //point light, set the spot cutoff to 180
                gl.uniform1f(
                    gl.getUniformLocation(graphics.currentProgram, 'lightSpotConeAngle[' + lightNumber + ']'), 
                    180 );
            }
        }
    }
}

