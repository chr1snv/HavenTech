//Shader.js: implementation of Shader class


function Shader( nameIn, 
                 sceneNameIn, 
                 readyCallbackParams, 
                 shaderReadyCallback,
                 programFragName,
                 programVertName ){

    this.shaderName = nameIn;
    this.sceneName = sceneNameIn;

    this.emitAmount = 0.0;

    this.diffuseMix = -1.0;
    this.alpha = 1.0;
    this.normalMix = -1.0;
    this.specularMix = -1.0;
    this.emitMix = -1.0;
    this.diffuseTextureAlpha = false;

    this.IsTransparent = function() { return this.alpha < 1.0 || this.diffuseTextureAlpha; }

    this.specularHardness = 10.0;

    this.isShadeless = false;

    this.isHit = false;
    this.isValid = false;

    this.GetTexCoordBounds = function( )
    {
        var texture = graphics.GetTexture( this.diffuseTextureName, this.sceneName );
        if( texture == NULL )
            return texture;
        
        return [
            0.0,
            texture.GetWidth(),
            0.0,
            texture.GetHeight()
        ];
    }

    this.Bind = function(previousShader, callbackParams, bindFinishedCallback)
    {
        graphics.BindProgram(this.program);

        if(this.isHit){
            //make it black so that when its color is combined with
            //the depth fog it will be black when near the camera and
            //white when far from the camera
            //(depth render pickling)
            //IPrintf("drawing a hit object\n");
            gl.uniform4f(gl.getUniformLocation(this.program, 'diffuseColor'),  0.0, 0.0, 0.0, 1.0 );
            gl.uniform1f(gl.getUniformLocation(this.program, 'texturingEnabled'), 0 );
            gl.uniform1f(gl.getUniformLocation(this.program, 'lightingEnabled'), 0 );
            CheckGLError("Shader: bind");
            bindFinishedCallback(callbackParams);
        }else if( this.programFragName == 'frayenFragShader.fsh' ){ // is a standard shader

            gl.uniform1f(gl.getUniformLocation(this.program, 'lightingEnabled'), this.isShadeless ? 0 : 1 );

            if(this.diffuseTextureName !== undefined){
                var thisP = this;
                //var finishedCallback = bindFinshedCallback;
                graphics.GetTexture(this.diffuseTextureName, this.sceneName, function(texture){
                    gl.uniform1f( gl.getUniformLocation( thisP.program, 'texturingEnabled' ), 1 );
                    texture.Bind(0);
                    thisP.shaderTextureBindFinishedCallback(previousShader);
                    CheckGLError("Shader: bind");
                    bindFinishedCallback(callbackParams);
                });
            }else{
                this.shaderTextureBindFinishedCallback(previousShader);
                CheckGLError("Shader: bind");
                bindFinishedCallback(callbackParams);
            }

        }else{
            
            bindFinishedCallback( callbackParams );
            
        }

    }

    this.shaderTextureBindFinishedCallback = function(previousShader){

        if(!this.isShadeless){
            var colAlph = new Float32Array([0,0,0,this.alpha]);

            Vect3_Copy(colAlph, this.diffuseCol);
            Vect3_MultiplyScalar(colAlph, this.diffuseMix);

            gl.uniform4f(gl.getUniformLocation(this.program, 'diffuseColor'),
                colAlph[0], colAlph[1], colAlph[2], colAlph[3] );

            Vect3_Copy(colAlph, this.specularCol);
            Vect3_MultiplyScalar(colAlph, this.specularMix);
            gl.uniform4f(gl.getUniformLocation(this.program, 'specularColor'),
                colAlph[0], colAlph[1], colAlph[2], colAlph[3] );

            var specularExponent = this.specularHardness*128.0;
            if(specularExponent > 128.0)
                specularExponent = 128;
            gl.uniform1f(gl.getUniformLocation(this.program, 'specularExponent'), specularExponent);

            Vect3_Copy(colAlph, this.diffuseCol);
            Vect3_MultiplyScalar(colAlph, this.emitAmount);
            gl.uniform4fv(gl.getUniformLocation(this.program, 'emissionColor'), colAlph);
        }
        else{
            gl.uniform1f(gl.getUniformLocation(this.program, 'lightingEnabled'), 0 );
            gl.uniform4f(gl.getUniformLocation(this.program, 'diffuseColor'),
                this.diffuseCol[0], this.diffuseCol[1], this.diffuseCol[2], this.alpha);
        }

        if(previousShader === undefined || this.IsTransparent() != previousShader.IsTransparent()){
            //if( this.IsTransparent() )
           //     graphics.enableDepthMask(false);
           // else
           //     graphics.enableDepthMask(true);
        }

    }
    
    if(this.shaderName == "hit"){
        //this is a hit geometry shader
        this.isHit = true;
        this.isValid = true;
    }else{
        //read in the shader settings from a file
        
        //initialize diffuse color and specular color
        this.diffuseCol =  [ 1.0, 1.0, 1.0 ];
        this.specularCol = [ 1.0, 1.0, 1.0 ];
        
        //calculate the shader file filename
        var filename = "scenes/"+this.sceneName+"/shaders/"+this.shaderName+".hvtShd";
        
        //open the shader file
        var shaderFile = loadTextFileSynchronous(filename);
        
        if( shaderFile === undefined ){
            //if unable to open, try loading the texture of the same name as diffuse
            DPrintf("Unable to open Shader file: " + nameIn);
            this.isHit = true;
            this.isValid = true;
            //only valid if we successfully loaded the texture of the corresponding name
            shaderReadyCallback( this, readyCallbackParams );
        }else{
            
            //read in the file contents
            var shaderFileLines = shaderFile.split('\n');
            for( var i = 0; i < shaderFileLines.length; ++i )
            {
                var temp = shaderFileLines[i].split(' ');
                if(temp[0] == 'f') //read in the fragment program name
                    this.programFragName = temp[1];
                if(temp[0] == 'v') //read in the vertex program name
                    this.programVertName = temp[1];
                if(temp[0] == 'd') //read in diffuse color
                {
                    this.diffuseCol = [ parseFloat( temp[1] ),
                                       parseFloat( temp[2] ),
                                       parseFloat( temp[3] ) ];
                    this.diffuseMix =   parseFloat( temp[4] );
                }
                if( temp[0] == 's' ) //read in specular color
                {
                    this.specularCol      = [ temp[1], temp[2], temp[3] ];
                    this.specularMix      =   parseFloat( temp[4] );
                    this.specularHardness =   parseFloat( temp[5] );
                }
                if( temp[0] == 'shadeless' ) //read in specular color
                    this.isShadeless = temp[1] == 'true' ? true : false;
                if(temp[0] == 'a') // read in alpha amount
                    this.alpha = parseFloat( temp[1] );
                if(temp[0] == 'l') // read in emit amount
                    this.emitAmount = parseFloat( temp[1] );
                
                if(temp[0] == 't') //read in texture information
                {
                    //keep track of the type of texture this one is
                    var isDiffuse = false;
                    var isNormal = false;
                    var isEmit = false;
                    while(++i < shaderFileLines.length)
                    {
                        temp = shaderFileLines[i].split(' ');
                        if(temp[0] == 'd' && temp[1] == 'a')
                            this.diffuseTextureAlpha = true;
                        else if(temp[0] == 'd') // the texture is diffuse type
                        {
                            this.diffuseMix = parseFloat( temp[1] );
                            isDiffuse = true;
                        }
                        if(temp[0] == 'n') // the texture is normal type
                        {
                            this.normalMix = parseFloat( temp[1] );
                            isNormal = true;
                        }
                        if(temp[0] == 'l') // the texture is emit type
                        {
                            this.emitMix = parseFloat( temp[1] );
                            isEmit = true;
                        }
                        if(temp[0] == 'f') //read in the texture file name
                        {
                            var textureName = temp[1];
                            //ask the graphics instance to load the corresponding texture file
                            //graphics.GetTexture(textureName, this.sceneName);
                            if(isDiffuse)
                                this.diffuseTextureName = textureName;
                            if(isNormal)
                                this.normalTextureName = textureName;
                            if(isEmit)
                                this.emitTextureName = textureName;
                        }
                        if(temp[0] == 'e') // sort of unnesscary, as soon as the file
                            break;         //name is read reading this texture is done
                    }
                }
            }
            
            //loosely check that some of the values were read in correctly
            if( this.diffuseMix == -1.0 &&
               this.specularMix == -1.0 &&
               this.emitMix == -1.0 )
                return;
            
            if(this.diffuseMix == -1.0)
                this.diffuseMix = 0.0;
            if(this.specularMix == -1.0)
                this.specularMix = 0.0;
            if(this.emitMix == -1.0)
                this.emitMix = 0.0;
            
            //load the glsl shader ( default to frayenFragShader if none is defined )
            if( this.programFragName != undefined && this.programVertName != undefined ){
                this.program = graphics.CreateProgramFromShaders(
                     'shaders/'+this.programVertName, 'shaders/'+this.programFragName );
            }else{
                this.program = graphics.CreateProgramFromShaders(
                     'shaders/frayenVertShader.vsh', 'shaders/frayenFragShader.fsh' );
            }
            
            //only set the valid flag if everything loaded correctly
            this.isValid = true;
        }
        shaderReadyCallback( this, readyCallbackParams );
    }

}
