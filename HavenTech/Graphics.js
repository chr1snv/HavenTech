//Graphics.js - wrapper around gl function calls

//helper function for printing gl errors
function CheckGLError(where){
    var error = gl.getError();
    var iter = 0;
    while(error != gl.NO_ERROR && iter < 100){
        alert(where + ': glError errorNum:' + iter + ' 0x' + error.toString(16));
        error = gl.getError();
        ++iter;
    }
    if(iter > 0)
        return true;
    return false;
}

function drawSquare(graphics) { // Draw the picture
    var vertices = [  0.0,  0.5, 0.0,
                     -0.5, -0.5, 0.0,
                      0.5, -0.5, 0.0 ];
    var verts = new Float32Array(vertices);

    attributeSetFloats( graphics.currentProgram, "position",  3, verts );
    attributeSetFloats( graphics.currentProgram, "normal",    3, verts );
    attributeSetFloats( graphics.currentProgram, "texCoord",  2, verts );
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.flush();
}

function attributeSetFloats( prog, attr_name, rsize, arr) {
    var attr = gl.getAttribLocation( prog, attr_name);
    gl.enableVertexAttribArray(attr);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, arr, gl.DYNAMIC_DRAW);
    gl.vertexAttribPointer(attr, rsize, gl.FLOAT, false, 0, 0);
}

function Graphics(canvasIn, bpp, depthIn, useGL){

    this.canvas = canvasIn;

    //maps used to keep track of primative graphics objects
    this.textures = {};
    this.shaders = {};
    this.quadMeshes = {};
    this.textureRefCts = {};
    this.shaderRefCts = {};
    this.quadMeshRefCts = {};

    this.maxLights = 8;
    this.numLightsBounded = 0;

    this.screenWidth = canvasIn.width;
    this.screenHeight = canvasIn.height;
    this.bpp = 0;

    //information about the rendering state (used to minimize the number of calls to gl)
    this.depthMaskEnb     = false;
    this.depthTestEnb     = false;
    this.currentTexId     = -1;
    this.currentColor     = [0.0, 0.0, 0.0, 0.0];
    this.ambAndDiffuse    = [0.0, 0.0, 0.0, 0.0];
    this.emission         = [0.0, 0.0, 0.0, 0.0];
    this.specular         = [0.0, 0.0, 0.0, 0.0];
    this.shinyness        = 0;

    //for altering the rendering state
    this.CreateTextureFrameBuffer = function(texture){
            var fb = gl.createFramebuffer();
            gl.bindFramebuffer( gl.FRAMEBUFFER, fb );
            gl.framebufferTexture2D(
                gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0,
                gl.TEXTURE_2D, texture.textureHandle, 0 );
            gl.checkFramebufferStatus(gl.FRAMEBUFFER);
            gl.bindFramebuffer( gl.FRAMEBUFFER, null );
            return fb;
    }
    this.BindFrameBuffer = function(fb){
        gl.bindFramebuffer( gl.FRAMEBUFFER, fb );
    }
    
    //globally used constants
    this.vertCard = 3;
    this.normCard = 3;
    this.uvCard   = 2;
    this.matrixCard = 4*4;

    //for clearing the color buffer
    this.Clear = function(){ 
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    }
    //for clearing depth between scene renderings
    this.ClearDepth = function(){
        gl.clear(gl.DEPTH_BUFFER_BIT);
    }

    //functions for fog
    this.EnableFog = function(clipNear, clipFar) {
        gl.Enable(gl.FOG);
        gl.Fogx(gl.FOG_MODE, gl.LINEAR);
        var params = [];
        params[0]= 1.0; params[1]= 1.0; params[2]= 1.0; params[3]= 1.0;
        gl.Fogfv(gl.FOG_COLOR, params);
        gl.Fogf(gl.FOG_START, clipNear);
        gl.Fogf(gl.FOG_END, clipFar);
    }
    this.DisableFog = function() {glDisable(gl.FOG);}

    this.GetScreenAspect = function(){ return this.screenWidth/this.screenHeight; }
        
    //functions for altering the rendering state

    this.ClearLights = function(){
        if( this.currentProgram === undefined )
            return;
        
        for(var i=0; i<this.maxLights; ++i){
            try{
                gl.uniform4f( gl.getUniformLocation(this.currentProgram, 'lightColor['+i+']'), 0,0,0,0);
            }catch(e){}
        }
        this.numLightsBounded = 0;
    }
    this.BindLight = function(light)
    {
        if(this.numLightsBounded >= this.maxLights){
            alert("Graphics: error Max number of lights already bound.\n");
            return;
        }
        light.BindToGL(this.numLightsBounded);
        ++this.numLightsBounded;
    }

    //content access functions
    this.CopyShader = function( newName, newSceneName, oldShader ) {}
    this.GetShader = function( filename, sceneName, readyCallbackParams, shaderReadyCallback ){
        var concatName = filename + sceneName;
        var shader = this.shaders[ concatName ];
        if( shader === undefined ) {
            //shader is not loaded, load the new shader and return it
            new Shader( filename, sceneName, readyCallbackParams, function( newShader, readyCallbackParams1 ){
                if( newShader.isValid ){
                    graphics.shaders[concatName] = newShader;
                }
                shaderReadyCallback(newShader, readyCallbackParams1);
            });
        }else{
           shaderReadyCallback(shader, readyCallbackParams);
        }
    }
    this.UnrefShader = function(filename, sceneName) {}
    this.AppendTexture = function(textureName, sceneName, newValidTexture){
        var concatName = textureName + sceneName;        
        this.textures[concatName] = newValidTexture;
    }
    this.GetTexture = function(filename, sceneName, textureReadyCallback, imageSource) {
        var concatName = filename + sceneName;
        var texture = this.textures[concatName];
        if(texture === undefined) {
            //texture is not loaded, load the new texture and have it return when it's ready (async load)
            var tex = new Texture(filename, sceneName, textureReadyCallback, function(newTexture, textureReadyCallback){
                graphics.textures[concatName] = newTexture;
                textureReadyCallback(newTexture);
            }, imageSource);
        }else{
            //the texture is ready, have it return through the callback
            textureReadyCallback(texture);
        }
    }
    this.UnrefTexture = function(filename, sceneName) {}
    this.GetQuadMesh = function(filename, sceneName, readyCallbackParameters, quadMeshReadyCallback) {
        var concatName = filename + sceneName;
        var quadMesh = this.quadMeshes[concatName];
        if(quadMesh === undefined){
            //mesh is not loaded, load the new mesh and return it (synchronous load)
            var newMesh = new QuadMesh(filename, sceneName);
            this.quadMeshes[concatName] = newMesh;
            quadMeshReadyCallback( newMesh, readyCallbackParameters );
        }else{
          quadMeshReadyCallback( quadMesh, readyCallbackParameters );
        }
    }
    this.UnrefQuadMesh = function(filename, sceneName) {}

    

    //load and compile the program
    this.CreateProgramFromShaders = function( vertShaderFileName, fragShaderFileName ){

        var newProgram = gl.createProgram();

        var textFile = loadTextFileSynchronous(vertShaderFileName);
        var vertexShader = gl.createShader(gl.VERTEX_SHADER);
        gl.shaderSource(vertexShader, textFile);
        gl.compileShader(vertexShader);
        if(!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS) && gl.getShaderInfoLog(vertexShader))
            DPrintf('vertex shader log: ' + gl.getShaderInfoLog(vertexShader));
        gl.attachShader(newProgram, vertexShader);

        textFile = loadTextFileSynchronous(fragShaderFileName);
        var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
        gl.shaderSource(fragmentShader, textFile);
        gl.compileShader(fragmentShader);
        if(!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS) && gl.getShaderInfoLog(fragmentShader))
            DPrintf('fragment shader log: ' + gl.getShaderInfoLog(fragmentShader));
        gl.attachShader(newProgram, fragmentShader);

        gl.validateProgram(newProgram);
        gl.linkProgram(newProgram);
        if(!gl.getProgramParameter(newProgram, gl.LINK_STATUS) && gl.getProgramInfoLog(newProgram))
            DPrintf('gl newProgram status: ' + gl.getProgramInfoLog(newProgram));
        return newProgram;
    }
    this.BindProgram = function(program){
        gl.useProgram(program);
        this.currentProgram = program;
    }

	//initialization code
    if( useGL ){
    
		gl = WebGLUtils.setupWebGL(canvasIn);

		//setup the gl state
		gl.clearColor(0.6, 0.7, 1.0, 1.0);

		//gl.viewport(0, 0, screenWidth, screenHeight);

		gl.enable(gl.CULL_FACE);
		gl.cullFace(gl.BACK);

		//enable depth testing
		gl.enable(gl.DEPTH_TEST);
		gl.depthFunc(gl.LESS);
		gl.depthMask(true);
		
		//clear the render buffer
	    this.Clear();
	    
        CheckGLError("Graphics::end constructor ");
    
    }


}
