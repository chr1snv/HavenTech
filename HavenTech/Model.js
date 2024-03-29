//Model.js

function Model(nameIn, meshNameIn, sceneNameIn, modelLoadedParameters, modelLoadedCallback){

    this.generateModelMatrix = function( cbObjs, completeCallback ){
        var thisP = cbObjs[1];
        //get the quadMesh transformationMatrix
        var quadMeshMatrix = new Float32Array(4*4);
        graphics.GetQuadMesh(this.meshName, this.sceneName, {1:cbObjs, 2:completeCallback}, function(quadMesh, cbObj2){
            var pos      = new Float32Array(3); quadMesh.GetPosition(pos);
            var rot      = new Float32Array(3); quadMesh.GetRotation(rot);
            var scale    = new Float32Array(3); quadMesh.GetScale(scale);
            Matrix(quadMeshMatrix, MatrixType.euler_transformation, scale, rot, pos);

            //calculate the set transformation matrix
            var offsetMatrix = new Float32Array(4*4);
            Matrix(offsetMatrix,
                   MatrixType.euler_transformation,
                   thisP.scaleOff, thisP.rotationOff, new Float32Array([0,0,0]));
            var transformation = new Float32Array(4*4);
            Matrix_Multiply( transformation, offsetMatrix, quadMeshMatrix );
            transformation[0*4+3] += thisP.positionOff[0];
            transformation[1*4+3] += thisP.positionOff[1];
            transformation[2*4+3] += thisP.positionOff[2];

            cbObj2[2]( transformation, cbObj2[1] );
        });
    }

//public methods
    //Identification / registration functions
    this.AddToSceneGraph = function(sgIn, addCompletedCallback){
        if( sgIn == null)
            return;
        this.RemoveFromSceneGraph(
           function(data){
               data[1].sceneGraph = sgIn;
               data[1].sceneGraph.Add(data[1], data[2]);
           },
        { 1:this, 2:addCompletedCallback } );
    }
    this.RemoveFromSceneGraph = function(removeCompleteCallback, cbParams){
        if(this.sceneGraph != null){
            this.sceneGraph.Remove(this, removeCompleteCallback, cbParams);
        }else{
            removeCompleteCallback( cbParams );
        }
    }

    //animation functions
    this.Update = function(time, updateCompleteParams, updateCompleteCallback)
    {
        graphics.GetQuadMesh(this.meshName, this.sceneName, {1:this, 2:updateCompleteParams, 3:updateCompleteCallback},
            function(quadMesh, cbObj){
                quadMesh.Update(time);
                cbObj[1].timeUpdate = true;
                cbObj[3](cbObj[2]);
            }
        );

    }
    this.GetAnimationLength = function() { return graphics.GetQuadMesh(meshName, sceneName).GetAnimationLength(); }

    //draw transformation manipulation functions
    //getters
    this.GetPosition = function(pos) { graphics.GetQuadMesh(this.meshName, this.sceneName).GetPosition(pos); }
    this.GetScale = function(scaleOut) { graphics.GetQuadMesh(this.meshName, this.sceneName).GetScale(scaleOut); }
    this.GetRotation = function(rotOut) { graphics.GetQuadMesh(this.meshName, this.sceneName).GetRotation(rotOut); }
    //setters
    this.SetPosition = function(newPos) { Vect3_Copy(positionOff, newPos); positionSet = true; optTransformUpdated = true; }
    this.SetScale = function(scaleIn){ Vect3_Copy(scaleOff, scaleIn); scaleSet = true; optTransformUpdated = true; }
    this.SetRotation = function(rotNew) { Vect3_Copy(rotationOff, rotNew); rotationSet = true; optTransformUpdated = true; }

    //shader binding functions
    this.GetOriginalShaderName = function(shaderNameOut, sceneNameOut) {
        var sNameArr  = graphics.GetQuadMesh( meshName, sceneName).GetShaderName();
        shaderNameOut = sNameArr[0];
        sceneNameOut  = sNameArr[1];
    }
    this.SetShader = function(shaderNameIn, sceneNameIn, removeCompleteCallback) {
        //this function may not be used
        var currentSceneGraph = this.sceneGraph;
        this.RemoveFromSceneGraph(function(thisP){
            thisP.shaderName = shaderNameIn;
            thisP.shaderScene = sceneNameIn;
            thisP.AddToSceneGraph( currentSceneGraph, removeCompleteCallback );
        }, thisP);
    }

    //draw functions
    this.GetNumVerts = function(cbParams, cb){ 
        graphics.GetQuadMesh(this.meshName, this.sceneName, {1:cbParams, 2:cb}, 
            function(quadMesh, cbObj){ cbObj[2]( quadMesh.faceVertsCt, cbObj[1] ); }) }
    this.Draw = function( frustum, verts, normals, uvs, modelTransform, mustDraw, completeCallback )
    {
        if(this.timeUpdate || mustDraw)
        {
            this.generateModelMatrix(
                {1:this, 2:frustum, 3:verts, 4:normals, 5:uvs, 6:modelTransform, 7:mustDraw, 8:completeCallback},
                function( transformation, cmpCb ){
                Matrix_Copy( cmpCb[6], transformation );
                graphics.GetQuadMesh( cmpCb[1].meshName, cmpCb[1].sceneName, cmpCb, function(quadMesh, cmpCb){
                    quadMesh.Draw(cmpCb[3], cmpCb[4], cmpCb[5]);
                    cmpCb[1].timeUpdate = false; //clear the time update flag
                    cmpCb[8]( true );
                });
            });
        }else{
            completeCallback( false );
        }
    }
    this.GetOptTransform = function(retMat)  {
        if( optTransformUpdated )
            this.generateModelMatrix(this, retMat);
        return scaleSet || rotationSet || positionSet;
    }
    this.DrawSkeleton = function(){ graphics.GetQuadMesh(this.meshName, this.sceneName).DrawSkeleton(); }
    
    //type query functions
    this.IsTransparent = function( isTransparentCallback, cbObj ) {
        graphics.GetShader( this.shaderName, this.shaderScene, { 1:isTransparentCallback, 2:cbObj },
            function( shader, cb ){ cb[1](shader.IsTransparent(), cb[2]); }
                        );
    }
    this.IsHit = function(cbParams, callback) {
        graphics.GetQuadMesh( this.meshName, this.sceneName,
            {1:cbParams, 2:callback}, function(quadmesh, cbObj){ cbObj[2](quadmesh.IsHit(), cbObj[1]); });
    }

    //geometry query functions
    this.RayIntersects = function(t, rayOrig, rayDir) {
        if(!IsHit())
            return false;

        var meshVertsCt = graphics.GetQuadMesh(meshName, sceneName).faceVertsCt;
        var meshVerts = new Float32Array[meshVertsCt*graphics.vertCard];
        graphicsGetQuadMesh(meshName, sceneName).GetWorldSpaceMesh(meshVerts, meshVertsCt);
        
        //apply the model orientation matrix
        var transformation = new Float32Array(4*4);
        var temp = new Float32Array(4*4);
        this.generateModelMatrix(transformation);

        var transformedPositions = new GLfloat[meshVertsCt*vertCard];
        Matrix_Multiply_Array3(transformedPositions, meshVertsCt*vertCard, transformation, meshVerts);
        
        var numTris = meshVertsCt/3;
        var didHit = Drawable.RayIntersectsHull(t, transformedPositions, numTris,  rayOrig, rayDir);
        meshVerts = null;
        transformedPositions = null;
        
        if(didHit)
            return true;
        return false;

    }
    this.GetBoundingPlanes = function( finishedCallback ) {
        graphics.GetQuadMesh( meshName, sceneName, finishedCallback, function( quadMesh, callback ){
            callback( quadMesh.GetBoundingPlanes() );
        });
    }

    this.modelName = nameIn;
    this.meshName = meshNameIn;
    this.sceneName = sceneNameIn;

    this.modelDrawable = null;
    this.sceneGraph = null;

    this.timeUpdate;
    this.optTransformUpdated;

    //modifiers for manipulating the mesh from its default position
    this.scaleOff    = new Float32Array([1,1,1]);
    this.rotationOff = new Float32Array([0,0,0]);
    this.positionOff = new Float32Array([0,0,0]);
    //refrence the shader through a name to allow for runtime modification of shader
    this.shaderName  = this.shaderScene = "";

    var thisP = this;
    graphics.GetQuadMesh(meshNameIn, sceneNameIn,
        {1:this, 2:modelLoadedParameters, 3:modelLoadedCallback}, function(quadMesh, cbObj){
        var sNameArr = quadMesh.GetShaderName();
        thisP.shaderName  = sNameArr[0];
        thisP.shaderScene = sNameArr[1];
        cbObj[3](cbObj[1], cbObj[2]);
    } );

};
