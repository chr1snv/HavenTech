//SceneGraph.js - implementation of a scene drawable by haven tech

//manages a collection of drawables 

function SceneGraph(sceneNameIn)
{
    this.sceneName = sceneNameIn;

    function ShaderDrawablePair(){
        this.startIndex = 0;       //scenegraph buffer index
        this.numVerts   = 0;
        this.drawable;
        this.mustDraw;
    };

    this.collections             = {};
    this.collections.opaque      = {};
    this.collections.transparent = {};

    this.vertexBufferID = 0;
    this.normalBufferID = 0;
    this.uvBufferID     = 0;

    this.vertCard = 3;
    this.normCard = 3;
    this.uvCard   = 2;

    this.desiredVerts   = 0;
    this.allocatedVerts = 256;
    this.verts   = new Float32Array( this.allocatedVerts * this.vertCard );
    this.normals = new Float32Array( this.allocatedVerts * this.normCard );
    this.uvs     = new Float32Array( this.allocatedVerts * this.uvCard );

    this.alterAllocationSize = function(sizeDelta){
        this.desiredVerts += sizeDelta;
        if( this.desiredVerts > this.allocatedVerts )
            this.allocatedVerts *= 2;
        this.verts.length   = this.allocatedVerts*this.vertCard;
        this.normals.length = this.allocatedVerts*this.normCard;
        this.uvs.length     = this.allocatedVerts*this.uvCard;
    }
    this.setDrawFlags   = function( whichVec, whichElm ){
    }
    this.uploadGeometry = function( startIdx, numVerts ){

//        graphics.
    }

//public methods
    //adds a drawable to the scene
    this.Add = function( newDrawable, addedCallback ){
        
        var shaderName = newDrawable.shaderName;
        if( shaderName == "undefined" )
            console.log( "shadername is undefined" );

        newDrawable.GetNumVerts( {1:this, 2:newDrawable, 3:addedCallback, 4:shaderName}, function(numVerts, cbObj){
            var drawablePair = new ShaderDrawablePair();
            drawablePair.drawable = cbObj[2];
            drawablePair.mustDraw = true;
            drawablePair.numVerts = numVerts;
                                
            cbObj[5] = drawablePair;

            newDrawable.IsTransparent(
                function( transparent, cb ){
                    if( transparent ){
                        if( cb[1].collections.transparent[cb[4]] === undefined )
                            cb[1].collections.transparent[cb[4]] = {};
                        cb[1].collections.transparent[cb[4]][cb[2].modelName] = cb[5];
                    }
                    else{
                        if( cb[1].collections.opaque[cb[4]] === undefined )
                            cb[1].collections.opaque[cb[4]] = {};
                        cb[1].collections.opaque[cb[4]][cb[2].modelName] = cb[5];
                    }
                    cb[1].alterAllocationSize( numVerts );
                    if( cb[3] != null )
                        cb[3]();
                }, cbObj
            );

        });
    }
    
    //removes the drawable with the given name from the scene
    this.Remove = function(givenDrawable, removedCallback, cbParams){
        //remove the drawable from both the transparent and opaque queues
        
        graphics.GetShader( givenDrawable.shaderName,
                            givenDrawable.shaderScene,
                           {1:givenDrawable, 2:removedCallback, 3:cbParams, 4:this},
            function(shader, data){
                if( shader.IsTransparent() ){
                    if(data[4].collections.transparent[data[1].shaderName] != undefined )
                        delete data[4].collections.transparent[data[1].shaderName][data[1].modelName];
                }else{
                    if( data[4].collections.opaque[data[1].shaderName] != undefined )
                        delete data[4].collections.opaque     [data[1].shaderName][data[1].modelName];
                }
                
               data[1].sceneGraph = null;
                           
                data[1].GetNumVerts( {1:data[4], 2:data[2], 3:data[3]},
                function(numVerts, cbObj){
                    cbObj[1].alterAllocationSize(-numVerts);
                    
                    cbObj[2](cbObj[3], cbObj[1]);
                });
            });
    }
    
    //draws the drawables that are within the frustrum
    this.Draw = function(camera, lights)
    {
        var frustum = camera.GetFrustum();
        var tempMat1               = new Float32Array(4*4);
        var tempMat2               = new Float32Array(4*4);
        var cameraMats             = camera.calculateTransform();

        var previousShader = undefined;
        for(var i in this.collections){       //loop through the transparent and opaque lists
            for(var j in this.collections[i]) //loop through the shaders
            {
                var shaderName = j;
                var thisP = this;
                graphics.GetShader( shaderName, this.sceneName, { 1:this.collections[i][j], 2:cameraMats, 3:lights },
                   function(shader, cbParams){
                    shader.Bind( previousShader, cbParams, function(cbParams){
                        var drawables  = cbParams[1];
                        var cameraMats = cbParams[2];
                        var lights     = cbParams[3];
                                
                        var projectionMatHandle = gl.getUniformLocation( graphics.currentProgram, 'projMat' );
                        gl.uniformMatrix4fv( projectionMatHandle, false, cameraMats.proj );
                                
                        for(var k in drawables) //loop through the drawables
                        {
                            var drawablePair = drawables[k];
                            var verts        = new Float32Array( drawablePair.numVerts*graphics.vertCard );
                            var normals      = new Float32Array( drawablePair.numVerts*graphics.vertCard );
                            var uvs          = new Float32Array( drawablePair.numVerts*graphics.uvCard );
                            var modelMatrix  = new Float32Array( 4*4 );
                            drawablePair.drawable.Draw( frustum, verts, normals, uvs, modelMatrix,
                                                        true, function(){

                                var modelMatHandle = gl.getUniformLocation( graphics.currentProgram, 'modelMat' );
                                gl.uniformMatrix4fv( modelMatHandle, false, modelMatrix );
                                var viewMatHandle  = gl.getUniformLocation( graphics.currentProgram, 'viewMat' );
                                gl.uniformMatrix4fv( viewMatHandle, false, cameraMats.view );
                                Matrix_Multiply( tempMat1, cameraMats.view, modelMatrix );
                                Matrix_Inverse( tempMat2, tempMat1 );
                                Matrix_Transpose( tempMat1, tempMat2 );
                                var invModelMatHandle = gl.getUniformLocation( graphics.currentProgram, 'transInvModelViewMat' );
                                gl.uniformMatrix4fv( invModelMatHandle, false, tempMat1 );

                                attributeSetFloats( graphics.currentProgram,
                                                    "position", graphics.vertCard,
                                                    verts );
                                attributeSetFloats( graphics.currentProgram,
                                                    "normal", graphics.normCard,
                                                    normals );
                                attributeSetFloats( graphics.currentProgram,
                                                    "texCoord", graphics.uvCard,
                                                    uvs );

                                gl.drawArrays( gl.TRIANGLES, 0, drawablePair.numVerts );
                            });
                        }
                    });
                });
            }
        }

    }


    //returns the closest model that the given ray intersects
    this.ClosestRayIntersection = function(rayOrig, rayDir){
    }
};
