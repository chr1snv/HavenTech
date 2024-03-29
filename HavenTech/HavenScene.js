//HavenScene.js - loads and represents a .hvtScene file ( models, lights, cameras, etc )

function HavenScene(sceneNameIn, sceneLoadedCallback){
    this.sceneName = sceneNameIn;
    this.isValid = false;

    this.models = {};
    this.lights = [];
    this.cameras = [];

    this.activeCamera = "";
    this.activeCameraIdx = -1;

    this.sceneGraph = new SceneGraph(this.sceneName);
    this.hitSceneGraph = new SceneGraph();

    this.framesSec = 25.0;

    //function members
    this.GetName = function(){ return this.sceneName; }
    this.Update = function(time, updateCompleteCb)
    {
        var m = 0;
        var l = 0;
        var c = 0;
        var thisP = this;
        var updateLoop = function(){
            //update the models, lights and cameras
            while( m < thisP.models.length ){
                thisP.models[m++].Update(time, undefined, updateLoop);
                return;
            }
            while(l < this.lights.length){
                this.lights[l++].Update(time);
                return;
            }
            while(c < this.cameras.length){
                this.cameras[c++].Update(time);
                return;
            }
            updateCompleteCb();
        }
    }
    this.Draw = function()
    {
        if(!this.isValid)
        {
            DPrintf('havenScene: ' + this.sceneName + ' was asked to draw but is not valid');
            return;
        }
        if(this.activeCameraIdx == -1)
        {
            DPrintf('havenScene: ' + this.sceneName + ' was asked to draw but has no active camera');
            return;
        }

        //draw the scene
        graphics.ClearDepth();
        this.sceneGraph.Draw(this.cameras[this.activeCameraIdx], this.lights);
    }

    this.HitModel = function(screenCoords){
        var rayOrig;
        var rayDir;
        if(this.activeCameraIdx == -1)
            return "";
        this.cameras[activeCameraIdx].GenerateWorldCoordRay(rayOrig, rayDir, screenCoords);
        
        var temp;
        Vect3_Copy(temp, rayDir);
        Vect3_Add(temp, rayOrig);

        return this.hitSceneGraph.ClosestRayIntersection(rayOrig, rayDir);
    }

    this.checkIfIsLoaded = function(){
        if( this.isValid && this.pendingModelsAdded <= 0 )
            sceneLoadedCallback(this);
    }

    //constructor functionality
    this.pendingModelsAdded = 0;
    var txtFile = loadTextFileSynchronous("scenes/"+this.sceneName+".hvtScene");
    var textFileLines = txtFile.split("\n");
    var i = 0;
    this.loadScene = function(newMdl, thisSceneP){

        if( newMdl != undefined ){
            thisSceneP.models[newMdl.modelName] = newMdl;
            //register the model with the proper SceneGraph
            thisSceneP.pendingModelsAdded++;

            newMdl.IsHit({1:newMdl, 2:thisSceneP}, function(isHit, cbObj){
                if( isHit )
                    newMdl.AddToSceneGraph(thisSceneP.hitSceneGraph,
                        function(){thisSceneP.pendingModelsAdded-=1; thisSceneP.checkIfIsLoaded();});
                else
                     newMdl.AddToSceneGraph(thisSceneP.sceneGraph,
                        function(){thisSceneP.pendingModelsAdded-=1; thisSceneP.checkIfIsLoaded();});
    
                thisSceneP.loadScene2( cbObj[1], cbObj[2]);
            });

        }else{
            thisSceneP.loadScene2( newMdl, thisSceneP);
        }
    }

    this.loadScene2 = function( newMdl, thisSceneP ){
        while( i<textFileLines.length )
        {
            var temp = textFileLines[i++];
            //this is a model to be read in
            if(temp[0] == 'm'){
                var words = temp.split(' ');
                var modelName = words[1];
                var model = new Model(modelName, modelName, thisSceneP.sceneName, thisSceneP,
                                          thisSceneP.loadScene );
                //wait for the model to load before continuing
                return;
            }
            //this is a light to be read in
            if(temp[0] == "l"){
                var words = temp.split(' ');
                
                var lampName  = words[1];
                var lightType = parseInt(words[2]);
                var pos       = [ parseFloat(words[3]),  parseFloat(words[4]),  parseFloat(words[5]) ];
                var rot       = [ parseFloat(words[6]),  parseFloat(words[7]),  parseFloat(words[8]) ];
                var col       = [ parseFloat(words[9]),  parseFloat(words[10]), parseFloat(words[11]) ];
                var intensity = parseFloat(words[12]);
                var coneAngle = parseFloat(words[13]);
                thisSceneP.lights.push(new Light(lampName, thisSceneP.sceneName, col, intensity, lightType, pos, rot, coneAngle));
            }
            //this is a camera to be read in
            if(temp[0] == 'c'){
                var words      = temp.split(' ');
                var cameraName = words[1];
                var pos        = [ parseFloat(words[2]), parseFloat(words[3]),  parseFloat(words[4]) ];
                var rot        = [ parseFloat(words[5]), parseFloat(words[6]),  parseFloat(words[7]) ];
                var angle      =   parseFloat(words[8]);
                var clipStart  =   parseFloat(words[9]);
                var clipEnd    =   parseFloat(words[10]);
                thisSceneP.cameras.push(new Camera(cameraName, thisSceneP.sceneName, angle, clipStart, clipEnd, pos, rot));
            }
            //this is the name of the active camera to be read in
            if(temp[0] == 'a' && temp[1] == 'c'){
                var words = temp.split(' ');
                thisSceneP.activeCamera = words[1];
                //look up and set its index
                for(var j=0; j<thisSceneP.cameras.length; ++j){
                    if(thisSceneP.cameras[j].cameraName == thisSceneP.activeCamera)
                        thisSceneP.activeCameraIdx = j;
                }
            }
        }
        thisSceneP.Update(0.0); //init animated objs
        thisSceneP.isValid = true;
        thisSceneP.checkIfIsLoaded();
    }

    //begin loading the scene
    this.loadScene(undefined, this);


}


