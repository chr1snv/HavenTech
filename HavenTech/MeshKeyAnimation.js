//MeshKeyAnimation.js - keyframe animation for a QuadMesh

function MeshKey()
{
    this.mKeyName;
    this.meshInstance = [];
    this.curve = new Curve();

    //for use in sorting
    this.compare = function(mk1, mk2){
        if( mk1 < mk2 )
            return -1;
        if( mk1 == mk2 )
            return 0;
        return 1;
    }
};

function MeshKeyAnimation(nameIn, sceneIn)
{
    this.mKeyName = nameIn;
    this.sceneName = sceneIn;

    this.meshKeys;

    this.vertsCt = -1;
    this.basisKeyIdx = -1;
    this.duration = 0.0;
    this.isValid = false;

    IPrintf("MeshKeyAnimation Constructor: " + this.mKeyName + " scene: " + this.sceneName );

    var fileName = "scenes/"+this.sceneName+"/meshKeys/"+this.mKeyName+".hvtKeys";
    var keyAnimationFile = loadTextFileSynchronous(fileName);
    if( keyAnimationFile === undefined ) return;
    var keyAnimationFileLines = keyAnimationFile.split('\n');

    //read the mesh key animation file
    //////////////////////////////

    for( var kLIdx = 0; kLIdx < keyAnimationFileLines.length; ++kLIdx )
    {
        var temp = keyAnimationFileLines[kLIdx];
        var words = temp.split(' ');

        //read in animation curve data
        if(temp[0] == 'c')
        {
            var newKey = new MeshKey();
            newKey.mKeyName = words[1];
            while(++kLIdx < keyAnimationFileLines.length )
            {
                var temp = keyAnimationFileLines[kLIdx];
                var words = temp.split(' ');

                if(temp[0] == 'i')
                {
                    newKey.curve.SetInterpolationType(words[1]);
                }
                //read in the bezier points
                if(temp[0] == 'b')
                {
                    while(++kLIdx < keyAnimationFileLines.length )
                    {
                        var temp = keyAnimationFileLines[kLIdx];
                        var words = temp.split(' ');

                        //read in the number of points
                        if(temp[0] == 'c')
                        {
                            newKey.numCurvePts = words[1];
                        }
                        //read in a point
                        if(temp[0] == 'p')
                        {
                            newKey.curve.InsertPoint(
                                Float32Array([parseFloat(words[1]),
                                              parseFloat(words[2])]));
                        }
                        if(temp[0] == 'e')
                            break; // finish reading in bezier points
                    }
                }
                if(temp[0] == 'e')
                {
                    //update the length of the mesh key animation if necessary
                    var tempDuration = newKey.curve.GetLength();
                    if(tempDuration > this.duration)
                        this.duration = tempDuration;
                    this.meshKeys.push_back(newKey);
                    this.meshKeys.sort(newKey.compare);
                    break; //done reading in the animation curve data
                }
            }
        }

        //read in keyframe mesh data
        if(temp[0] == 'k')
        {
            var keyName = words[1];

            //check if is the basis key, (doesn't yet have a MeshKey)
            if(keyName == "Basis")
            {
                var newKey = new MeshKey();
                newKey.meshInstance = 0;
                newKey.mKeyName = keyName;
                this.meshKeys.push_back(newKey);
                this.meshKeys.sort(newKey.compare);
            }

            //find the matching key data in the list of curves
            var mKey = 0;
            for(var i=0; i<this.meshKeys.length; ++i){
                if(this.meshKeys[i].mKeyName == keyName)
                    mKey = this.meshKeys[i];
            }
            if(mKey == NULL){
               DPrintf("MeshKeyAnimation: error mesh data has no corresponding curve (mKey null)\n");
               exit(1);
            }

            var vertIdx = 0;
            var instanceVertCt = 0;
            while(++kLIdx < keyAnimationFileLines.length )
            {
                var temp = keyAnimationFileLines[kLIdx];
                var words = temp.split(' ');

                //read in the count of verts
                if(temp[0] == 'c')
                {
                    instanceVertCt = words[1];
                    mKey.meshInstanceSize = instanceVertCt*graphics.vertCard;
                    if(mKey.meshInstance != 0)
                    {
                        DPrintf("MeshKeyAnimation: error meshInstance expected NULL");
                        return;
                    }
                    mKey.meshInstance = new Float32Array[instanceVertCt*vertCard];
                }
                //read in the vertex data
                if(temp[0] == 'v')
                {
                    mKey.meshInstance[vertIdx++] = parseFloat(words[1]);
                    mKey.meshInstance[vertIdx++] = parseFloat(words[2]);
                    mKey.meshInstance[vertIdx++] = parseFloat(words[3]);
                }
                //done reading in vertex data
                if(temp[0] == 'e')
                {
                    if(vertIdx != instanceVertCt*vertCard)
                    {
                        DPrintf("MeshKeyAnimation: error read in verts: " + vertIdx +
                                " expected: " + instanceVertCt*vertCard );
                        return;
                    }
                    break;
                }
            }
        }
    }
    //done reading

    //find the vertsCt
    for(var i=0; i<this.meshKeys.length; ++i)
    {
        if(this.meshKeys[i].mKeyName == "Basis") //remember the index of the basis key
            basisKeyIdx = i;
        if(vertsCt == -1)
            this.vertsCt = meshKeys[i].meshInstanceSize/vertCard;
        if(vertsCt != meshKeys[i].meshInstanceSize/vertCard)
        {
            DPrintf("MeshKeyAnimation: " + this.mKeyName +
                    " expected mesh instance: " + meshKeys[i].mKeyName +
                    " to have " + vertsCt +
                    " verts, had " + meshKeys[i].meshInstanceSize );
            return;
        }
    }
    if(vertsCt == -1){
        DPrintf("MeshKeyAnimation: " + this.mKeyName +
                " failed to find the vertsCt. numMeshKeys: " + this.meshKeys.length );
        return;
    }
    if(basisKeyIdx == -1){
        DPrintf("MeshKeyAnimation: " + this.mKeyName + " failed to find basisKey" );
        return;
    }

    //success
    IPrintf("MeshKeyAnimation: " + this.mKeyName +
            " successfully read in " + this.meshKeys.length + " keyframes and curves" );
    this.isValid = true;


    this.GenerateMesh = function(outputVerts, animationFrame){

        if( this.verts.length != outputVerts.length)
        {
            DPrintf("MeshKeyAnimation::Generate mesh: " + this.mKeyName +
                    " outVertsCt " + outVertsCt + " vertsCt " + vertsCt + " mismatch" );
            return;
        }

        //generate the output mesh
        for(var i=0; i<this.verts.length; ++i)
        {
            //get the corresponding basis key vert
            var basisVert = new Float32Array([ this.meshKeys[basisKeyIdx].meshInstance[i*vertCard],
                                               this.meshKeys[basisKeyIdx].meshInstance[i*vertCard+1],
                                               this.meshKeys[basisKeyIdx].meshInstance[i*vertCard]    ]);

            var accumVert = new Float32Array([0,0,0]);
            //for each key shape
            for(var j=0; j<this.meshKeys.length; ++j)
            {
                if(this.meshKeys[j].mKeyName == "Basis")
                    continue;

                //get the weight of the key at this time
                var keyWeight = meshKeys[j].curve.GetValue(animationFrame);

                //get the corresponding key vert
                var keyVert = new Float32Array([this.meshKeys[j].meshInstance[i*graphics.vertCard],
                                                this.meshKeys[j].meshInstance[i*graphics.vertCard+1],
                                                this.meshKeys[j].meshInstance[i*graphics.vertCard+2] ]);

                //linearly interpolate between the key vert and the basis vert by the weight amount
                var tempVert = new Float32Array(3);
                Vect3_LERP(tempVert, basisVert, keyVert, keyWeight);
                Vect3_Add(accumVert, tempVert);
            }
            //divide by the number of keyframe contributions
            Vect3_Multiply(accumVert, 1/(meshKeys.length-1));

            //write to the output vector
            outputVerts[i*graphics.vertCard]   = accumVert[0];
            outputVerts[i*graphics.vertCard+1] = accumVert[1];
            outputVerts[i*graphics.vertCard+2] = accumVert[2];
        }
    }
}
