//CameraStream.js - provides navigator.getUserMedia access

function CameraStream(modelIn){

     if ( typeof CameraStream_singletonInstance !== "undefined" )
        return CameraStream_singletonInstance;
     CameraStream_singletonInstance = this;
    
    this.model = modelIn;
    
    navigator.getMedia = ( navigator.mediaDevices.getUserMedia ||
                          navigator.webkitGetUserMedia ||
                          /*navigator.mozGetUserMedia ||*/
                          navigator.msGetUserMedia);
    
    VideoMode = {
        BG_REPLACEMENT   : 0,
        SM_AMPLIFICATION : 1
    };
    this.videoMode = VideoMode.BG_REPLACEMENT;

    this.video = document.createElement( "video" );
    this.video.setAttribute( "id", "cameraStream" );
    this.video.setAttribute( "width", "64" );
    this.video.setAttribute( "height", "64" );
    this.video.setAttribute( "autoplay", true );

    this.CreateSmMotionFramebuffer = function (texture){
        this.fb = graphics.CreateTextureFrameBuffer( texture );
    }

    document.getElementsByTagName( "button" )[0].onclick = function(){
        CameraStream().texToUpdate = 0;
    }
    
    this.videoModeChanged = function( newMode ){
        this.videoMode = newMode;
        //initilization code for different modes
        switch( this.videoMode ){
            case VideoMode.BG_REPLACEMENT:
                this.model.SetShader( "TexDiffShader", mainScene.sceneName );
                break;
            case VideoMode.SM_AMPLIFICATION:
                this.model.SetShader( "SmMotionShader", mainScene.sceneName );
                graphics.GetTexture("video", "", CameraStream().CreateSmMotionFramebuffer, CameraStream().video );
                break;
        }
    }
    videoModeChanged(this.videoMode);

    var thisP = this;

    navigator.mediaDevices.getUserMedia({ video: true })
	.then(
        function(localMediaStream){
            var video = thisP.video;
            video.srcObject = localMediaStream;
            video.play();
            window.setTimeout(CameraStream().capture, 100);
      	})
	.catch(e => console.log(e.name + ": " + e.message));


/*
    navigator.getMedia(
        { video: true },
        function(localMediaStream){
           var video = thisP.video;
            video.src = window.URL.createObjectURL(localMediaStream);
            video.play();
            window.setTimeout(CameraStream().capture, 100);
        },
        function(err){
            document.querySelector("#status").innerHTML = err;
        }
                       );
*/

    this.texToUpdate = 0;
    this.decodedFrameCount = 0;
    this.capture = function() {
        
        var video = CameraStream().video;

        if( video.webkitDecodedFrameCount > CameraStream().decodedFrameCount ){
            CameraStream().decodedFrameCount = video.webkitDecodedFrameCount;
        
            if( CameraStream().videoMode == VideoMode.BG_REPLACEMENT ){
                
                if( !(video.paused || video.ended || video.seeking || video.readyState < video.HAVE_FUTURE_DATA) ){

                    if( CameraStream().texToUpdate > 1 )
                        CameraStream().texToUpdate = 0;

                    if( CameraStream().texToUpdate == 0 ){
                        graphics.GetTexture("video", "", CameraStream().bgReplaceTextureReadyCB, video);
                    }else{
                        graphics.GetTexture("video1", "", CameraStream().bgReplaceTextureReadyCB, video);
                    }
                }

            }else if( this.videoMode == VideoMode.SM_AMPLIFICATION ){

                //write the raw video image to the framebuffer texture
                graphics.GetTexture("video", "", CameraStream().smAmplificationRawTextureReadyCB, CameraStream().video);

                //bind the raw video image texture framebuffer and read its contents
                graphics.BindFrameBuffer(CameraStream().fb);
                mainScene.Draw();
                var width  = graphics.screenWidth;
                var height = graphics.screenHeight;
                var pixels = new Uint8Array( 4 * width * height );
                gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, pixels );

                //rebind the usual frame buffer
                graphics.BindFrameBuffer( null );

                //preform cpu side image processing//        

                //compute the harr wavelet decomposition of the image
                CameraStream().harrDecompCoefs = generateHarrTwoDimMRADecomp(pixels, width, height, getPixelIntensity);
                CameraStream().harrProcessedImage = new Uint8Array( 4 * width * height );
                //for(var i =0; i < 4*width * height; ++i )
                //    this.harrProcessedImage[i] = pixels[i];
                for( var i = 0; i < height/2; ++i ){
                    for( var j = 0; j < width/2; ++j ){
                        CameraStream().harrProcessedImage[(i*width*4*2)+j*4*2+0] = CameraStream().harrDecompCoefs[0][i*width/2+j*4+0];
                        CameraStream().harrProcessedImage[(i*width*4*2)+j*4*2+1] = CameraStream().harrDecompCoefs[0][i*width/2+j*4+1];
                        CameraStream().harrProcessedImage[(i*width*4*2)+j*4*2+2] = CameraStream().harrDecompCoefs[0][i*width/2+j*4+2];
                        CameraStream().harrProcessedImage[(i*width*4*2)+j*4*2+3] = CameraStream().harrDecompCoefs[0][i*width/2+j*4+3];
                    }
                }

                //write the processed image back to the frame buffer
                graphics.GetTexture("video", "", CameraStream().smAmplificationTextureReadyCB );

            }
        }
    }

    //passed in as srcSamplerFunc
    var getPixelIntensity = function(arr, w, h, x, y){
        return arr[4 * (y*w+x) ] + arr[4 * (y*w+x)+1 ] + arr[4 * (y*w+x)+2 ];
    }
    
    var calcDiffsAndAvgs = function(srcVals, w, h ){
        //the input array is in the form
        //         0,    1,     2,    3      0+4,  1+4,   2+4,  3+4
        //[ [ [diffX, avgX, diffY, avgY ] [diffX, avgX, diffY, avgY ] ... ],
        //  [ [diffX, avgX, diffY, avgY ] [diffX, avgX, diffY, avgY ] ... ] ]
        
        //calculate the x direction harr decomposition
        var diffAvgs = new Int32Array( w * 4 * h );
        for(     var j=0; j < h; j+=1 ){        //walk through each row
            for( var i=0; i < w*4; i+=4*2 ){    //cross the row two elements at a time
                var v0 = srcVals[j*w*4+i+1];    //get the avg from the first sample
                var v1 = srcVals[j*w*4+i+1+4];  //get the avg from the second sample
                var diff = (v0 - v1) / Math.sqrt(2);
                var avg  = (v0 + v1) / Math.sqrt(2);
                diffAvgs[j*w*4+i/2+0] = diff;   // i/2 since [],[] => []
                diffAvgs[j*w*4+i/2+1] = avg;
            }
        }
        //calculate the y direction harr decomposition
        for(     var j=0; j < h; j+=2 ){
            for( var i=0; i < w*4; i+=4*1 ){
                var v0 = srcVals[(j+0)*w*4+i+3];
                var v1 = srcVals[(j+1)*w*4+i+3];
                var diff = (v0 - v1) / Math.sqrt(2);
                var avg  = (v0 + v1) / Math.sqrt(2);
                diffAvgs[j/2*w*4+i+2] = diff;
                diffAvgs[j/2*w*4+i+3] = avg;
            }
        }
        return diffAvgs;
    }

    var generateHarrTwoDimMRADecomp = function(src, wIn, hIn, srcSamplerFunc){
        /////harr wavelet multiresolution analysis decomposition/////

        //ensure the input is square
        if( w != h )
            return undefined;
       
        var results = [];
        
        //init the src vals
        var srcVals = new Int32Array( wIn*4*hIn );
        for( var j=0; j < hIn; j+=1 )
        for( var i=0; i < wIn; i+=1 ){
            
            var pixVal = srcSamplerFunc( src, wIn, hIn, i, j );
            
            srcVals[j*wIn*4+i*4+1] = pixVal; //xDir avg
            srcVals[j*wIn*4+i*4+3] = pixVal; //yDir avg

        }
        
        var w = wIn/2;
        var h = hIn/2;

        //loop through all of the resolution levels
        var resolutionLevels = Math.round( Math.log( wIn ) / Math.log( 2 ) );
        for( var r = 0; r < resolutionLevels; ++r ){
            var diffsAndAvgs = calcDiffsAndAvgs( srcVals, w, h ); //w,h represent the result
            results.push( diffsAndAvgs );
            
            srcVals = diffsAndAvgs[1];
            w /= 2;
            h /= 2;
        }
       
        return results;
   }
    
    this.bgReplaceTextureReadyCB = function(texture){
        var tIL = gl.getUniformLocation( graphics.currentProgram, "texOneIsNew" );

        if( CameraStream().texToUpdate == 0 ){
            gl.uniform1i( tIL, 0 );
            texture.UpdateWithVideo( CameraStream().video, 1, "tex1" );
        }else{
            gl.uniform1i( tIL, 1 );
            texture.UpdateWithVideo( CameraStream().video, 2, "tex2" );
        }
        CameraStream().texToUpdate += 1;
    }

    this.smAmplificationRawTextureReadyCB = function( texture ){
        texture.UpdateWithVideo( CameraStream().video, 1, "tex1" );
    }
    this.smAmplificationTextureReadyCB = function( texture ){
        texture.UpdateWithImg( CameraStream().harrProcessedImage, 1 );
    }

};





