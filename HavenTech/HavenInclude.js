//HavenInclude.js - loads all of the haven tech scripts into the dom


var incFiles = ['DPrintf.js',
				'UID.js',
				'Vect3.js',
				'Quaternion.js',
				'Matrix.js',
				'Curve.js',
				'IPOAnimation.js',

				'AABB.js',
				'Ray.js',
				'OctTree.js',
				
				'BoundsObjects.js',

				'Math.js',
				'Physics.js',
				'PhysObj.js',
				'PhysConstraintGraph.js',
				'Capsule.js',

				'SceneGraph.js',

				'webgl-utils.js',
				'Graphics.js',
				'Light.js',
				'Camera.js',
				'Drawable.js',
				'QuadMesh.js',

				'Shader.js',
				'Texture.js',

				'Model.js',

				'Bone.js',
				'MeshKeyAnimation.js',
				'SkeletalAnimation.js',

				'HavenScene.js',

				'HavenInputHandlers.js'];

var optIncludes = [
                   'CameraStream.js',
                   'FlightPhysics.js' ];

var incFileIdx = 0;
var havenDir = 'HavenTech/';

function havenIncMain(){

    if( incFileIdx < incFiles.length ){
        //include files while there are still files to be included
        AttachScript(havenDir+incFiles[incFileIdx++], havenIncMain );
    }else if( ( incFileIdx - incFiles.length ) < optIncludes.length ){
        //include optional includes while there are still files to be included
        AttachScript(havenDir+optIncludes[incFileIdx++ - incFiles.length], havenIncMain );
    }else{
        //done including files
        window.removeEventListener( 'load', havenIncMain );
        //call the main function
        havenMain();
    }
}
window.addEventListener('load', havenIncMain, false);

function AttachScript(scriptName, callback){
    var head= document.getElementsByTagName('head')[0];
    var script= document.createElement('script');
    script.type= 'text/javascript';
    script.src= scriptName;
    script.onload = callback;
    head.appendChild(script);
    script.onreadystatechange = function(){
        if(this.readyState == 'complete'){
            callback();
            alert('calling callback');
        }
    }
}

//helper functions used to load text files
function loadTextFile(filename, callback, thisP){
    var txtFile = new XMLHttpRequest();
    txtFile.onreadystatechange = function(){
        if(txtFile.readyState == 4){
            if(txtFile.status == 200 || txtFile.status == 0){
                callback(txtFile.responseText, thisP); //callback
            }
        }
    }
    txtFile.open("GET", filename, true);
    txtFile.overrideMimeType("text/plain;");
    txtFile.send();
}
function loadTextFileSynchronous(filename){
    var txtFile = new XMLHttpRequest();
    txtFile.open("GET", filename, false);
    txtFile.overrideMimeType("text/plain;");
    txtFile.send();
    if(txtFile.status == 200 || txtFile.status == 0)
        return txtFile.responseText;
}
