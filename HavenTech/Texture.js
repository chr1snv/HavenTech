//Texture.js: texture implementation

function Texture(nameIn, sceneNameIn, textureReadyCallbackParams, textureReadyCallback, imageSource){
    
    this.textureHandle = 0;
    this.texName = nameIn;
    this.sceneName = sceneNameIn;
    this.isValid   = false;

    var thisP = this;

    this.UpdateWithImg = function( imgBuff, texUnit, callback ){
        this.Bind( texUnit );
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        var dim = Math.sqrt(imgBuff.length/4);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, dim, dim, 0,
                         gl.RGBA,
                         gl.UNSIGNED_BYTE, imgBuff);
        gl.bindTexture( gl.TEXTURE_2D, this.textureHandle );
        if( callback !== undefined )
            callback();
    }

    this.UpdateWithVideo = function(video, texUnit, shaderTexName){
        this.Bind(texUnit);
        //assign the texture units
        var uL = gl.getUniformLocation( graphics.currentProgram, shaderTexName );
        gl.uniform1i( uL, texUnit );
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA,
                       gl.UNSIGNED_BYTE, video);
        gl.bindTexture( gl.TEXTURE_2D, this.textureHandle );
    }

    this.Bind = function(textureUnitToBindTo){
        if(this.isValid){
            gl.activeTexture( gl.TEXTURE0+textureUnitToBindTo );
            gl.bindTexture( gl.TEXTURE_2D, this.textureHandle );
        }
    }

    this.GetTextureHandle = function(){
        return this.textureHandle;
    }

    var imageLoadedHandler = function(){
        thisP.textureHandle = gl.createTexture();
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, thisP.textureHandle);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, loadedImage);
        //gl.generateMipmap(gl.TEXTURE_2D);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        //gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

        thisP.isValid = true;

        graphics.AppendTexture( thisP.texName, thisP.sceneName, thisP );
        textureReadyCallback( thisP, textureReadyCallbackParams );
    }


    if( imageSource != undefined ){
        var loadedImage = imageSource;
        imageLoadedHandler();
    }else{
        var filename = "scenes/"+this.sceneName+"/textures/"+this.texName+".png";
        //load a texture from a file, and upload it to gl
        var loadedImage = new Image();

        loadedImage.onload = imageLoadedHandler;
        loadedImage.onerror = function(){
            textureReadyCallback( thisP );
            graphics.GetTexture("default", "default", textureReadyCallback);
        }
        loadedImage.onabort = function(){
            textureReadyCallback( thisP, textureReadyCallbackParams );
        }
        loadedImage.src = filename;
    }

}
