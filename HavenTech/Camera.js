//Camera.js

function glOrtho(left, right, bottom, top, nearVal, farVal)
{
    var tx = -(right+left)/(right-left);
    var ty = -(top+bottom)/(top-bottom);
    var tz = -(farVal+nearVal)/(farVal-nearVal);
    var xs = 2/(right-left);
    var ys = 2/(top-bottom);
    var zs = -2/(farVal-nearVal);
    return Float32Array([ xs,  0,  0,  0,
                           0, ys,  0,  0,
                           0,  0, zs,  0,
                           tx,ty, tz,  1 ] );
}
function gluPerspective(fovy, aspect, zNear, zFar)
{
    var f = 1/Math.tan(fovy/2);
    var xs = f/aspect;
    var ys = f;
    var zs = (zFar+zNear)/(zNear-zFar);
    var tz = (2*zFar*zNear)/(zNear-zFar);
    return new Float32Array([ xs,  0,  0,  0,
                               0, ys,  0,  0,
                               0,  0, zs, -1,
                               0,  0, tz,  0 ]);
}

function Camera(nameIn, sceneNameIn, fovIn, nearClipIn, farClipIn, positionIn, rotationIn)
{
    this.cameraName = nameIn;
    this.sceneName = sceneNameIn;

    this.position = positionIn;
    this.rotation = rotationIn;
    this.fov = fovIn;

    this.setPositionDelta = new Float32Array([0,0,0]);
    this.setRotationDelta = new Float32Array([0,0,0]);

    this.nearClip = nearClipIn;
    this.farClip = farClipIn;
        
    this.frustum;
        
    this.ipoAnimation = new IPOAnimation(nameIn, sceneNameIn);
    this.time = 0;

    this.renderTexture;
    this.renderTextureFrameBuffer;

    this.setUpRenderToTexture = function(width, height){

        width  = typeof width  !== 'undefined' ? width : 128;
        height = typeof height !== 'undefined' ? height : 128;

        //create the frame buffer
        this.renderTextureFrameBuffer = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.renderTextureFrameBuffer);
        this.renderTextureFrameBuffer.width  = width;
        this.renderTextureFrameBuffer.height = height;

        //create the texture
        this.renderTexture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, rttTexture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
        gl.generateMipmap(gl.TEXTURE_2D);
        //allocate the texture memory
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 
                      this.renderTextureFrameBuffer.width, 
                      this.renderTextureFrameBuffer.height, 
                      0, gl.RGBA, gl.UNSIGNED_BYTE, null);

        
        this.renderbuffer = gl.createRenderbuffer();
        gl.bindRenderbuffer(gl.RENDERBUFFER, renderbuffer);
        gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16,
            this.renderTextureFrameBuffer.width,
            this.renderTextureFrameBuffer.height);

        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.renderTexture, 0);
        gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, renderbuffer);

        //restore previous settings
        gl.bindTexture(gl.TEXTURE_2D, null);
        gl.bindRenderbuffer(gl.RENDERBUFFER, null);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }

    this.bindRenderTexture = function(){
        if( this.renderTextureFrameBuffer === undefined ||
            this.renderbuffer === undefined )
            this.setUpRenderToTexture( graphics.screenHeight, graphics.screenWidth );

        gl.bindFramebuffer(gl.FRAMEBUFFER,   this.renderTextureFrameBuffer);
        gl.bindRenderbuffer(gl.RENDERBUFFER, this.renderbuffer);
    }

    this.PerspectiveMatrix = new Float32Array(4*4);

    this.updateFrustum = function() {}
        
    this.getRotation = function(rotOut)
    {
        if(!this.ipoAnimation.GetRotation(rotOut, this.time))
            Vect3_Copy(rotOut, this.rotation);
        //urotate the camera by 90 degrees (blender camera starts off looking straight down)
        rotOut[0] -= 90.0*(Math.PI/180.0);
        Vect3_Add(rotOut, this.setRotationDelta);
    }
    this.getLocation = function(locOut)
    {
        if(!this.ipoAnimation.GetLocation(locOut, this.time))
            Vect3_Copy(locOut, this.position);
        Vect3_Add(locOut, this.setPositionDelta);
    }

    //apply the Cameras transformation
    this.calculateTransform = function()
    {
        var projMat;
        if(this.fov == 0.0)
        {
            projMat = glOrtho(-graphics.GetScreenAspect(), graphics.GetScreenAspect(),
                                         -graphics.screenHeight, graphics.screenHeight,
                                         -1, 1);
        }
        else
        {
            projMat = gluPerspective(this.fov,                   //field of view
                                     graphics.GetScreenAspect(), //aspect ratio
                                     this.nearClip,              //near clip plane distance
                                     this.farClip                //far clip plane distance
                                    );
        }

        var invTransformMat = new Float32Array(4*4);
        var transformMat = this.getCameraToWorldMatrix();
        Matrix_Inverse( invTransformMat, transformMat );

        return { proj:projMat, view:invTransformMat };
    }

    this.getCameraToWorldMatrix = function(){
        //get the camera rotation and translation from the ipo
        var translation = new Float32Array(3);
        var rot = new Float32Array(3);
        this.getRotation(rot);
        this.getLocation(translation);

        var transMat        = new Float32Array(4*4);
        var invTransMat     = new Float32Array(4*4);
        var rotMat          = new Float32Array(4*4);

        var transformMat    = new Float32Array(4*4);
        Matrix( transMat, MatrixType.translate, translation );
        Matrix( rotMat, MatrixType.euler_rotate, rot );
        Matrix_Multiply( transformMat, transMat, rotMat );
        return transformMat;
    }

    //update the Cameras position
    this.Update = function(timeIn) { time = timeIn; }
    this.UpdateOrientation = function(positionDelta, rotationDelta)
    {
        //Update the cameras transformation given a change in position and rotation.

        //apply the change in rotation
        this.setRotationDelta[0] += rotationDelta[0];
        this.setRotationDelta[1] += rotationDelta[1];

        //get the new rotation
        var rot = new Float32Array(3);
        this.getRotation(rot);

        var rotMat = new Float32Array(4*4);
        Matrix( rotMat, MatrixType.euler_rotate, rot );

        var transformedRot = new Float32Array(4*4);
        Matrix_Multiply_Vect3( transformedRot, rotMat, positionDelta );

        //    //prevent up down rotation past vertical
        //    if (rotation[0] > 90.0)
        //        rotation[0] = 90.0;
        //    if (rotation[0] < -90.0)
        //        rotation[0] = -90.0;

        //forwards backwards
        this.setPositionDelta[0] += transformedRot[0];
        this.setPositionDelta[1] += transformedRot[1];
        this.setPositionDelta[2] += transformedRot[2];
    }
    this.SetPosDelta = function(posIn) { Vect3_Copy(setPositionDelta, posIn); }

    //return a Frustum representing the volume to be rendered by the Camera
    this.GetFrustum = function() {}

    function GetFarClipBounds( bounds, fovy, aspect, zFar )
    {
        var ymax = zFar * Math.tan(fovy * Math.PI / 360.0);
        var ymin = -ymax;
        var xmin = ymin * aspect;
        var xmax = ymax * aspect;
        
        bounds = [ [xmin, ymin, -zFar],   //bottom left
                   [xmin, ymax, -zFar],   //top left
                   [xmax, ymin, -zFar],   //bottom right
                   [xmax, ymax, -zFar] ]; //top right
    }

    //generate a ray from the camera origin in the direction of the screen
    this.GenerateWorldCoordRay = function(rayOrig, rayDir, screenCoords)
    {
        var vertCard = 3;
        
        //get the camera origin
        this.getLocation(rayOrig);
        
        //construct the far clip plane, and get the rayDir by
        //lerping between the boundries of the farClip plane
        /////////
        
        //get the camera rotation matrix
        var rot = new Float32Array(3);
        this.getRotation(rot);
        var rotMat = new Float32Array(4*4);
        Matrix(rotMat, MatrixType.euler_rotate, rot);
        //get the far clip plane bounds and rotate them by the camera rotation matrix
        var boundsTemp = new Array(4);
        var bounds =     new Array(4);
        GetFarClipBounds(boundsTemp, fov, 1.0, farClip);

        Matrix_Multiply_Array3(bounds, rotMat, boundsTemp);
        
        //interpolate between the points to get the end point of the ray
        var leftTemp =     new Array(vertCard);
        var rightTemp =    new Array(vertCard);
        var frustumPoint = new Array(vertCard);
        Vect3_LERP(leftTemp,  bounds[0], bounds[1], screenCoords[1]*0.5+0.5);   //bottom left, top left lerp
        Vect3_LERP(rightTemp, bounds[2], bounds[3], screenCoords[1]*0.5+0.5);   //bottom right, top right lerp
        Vect3_LERP(frustumPoint, leftTemp, rightTemp, screenCoords[0]*0.5+0.5); //left, right lerp

        Vect3_Copy(rayDir, frustumPoint);
    }


}
