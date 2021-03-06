var ts = new Date().getTime();

function now() {
	return new Date().getTime();
}

function timeStamp() {
	var now = new Date().getTime();
	var elapsed = now - ts;
	ts = now;
	return elapsed;
}

function timeElapsed(t) {
	var now = new Date().getTime();
	return now - t;
}

function sleep(milliseconds) {
  var start = new Date().getTime();
  for (var i = 0; i < 1e7; i++) {
    if ((new Date().getTime() - start) > milliseconds){
      break;
    }
  }
}

function log(msg) {
	controlPanel.log(msg);
}

function toggleOctreeVisibility() {
	// controlPanel.log("showing/hiding octree visibility ...");
	octree.setVisibility(controlPanel.checkbox2.checked);

	for(var i=0, len=octreesProj.length; i<len; i++) {
		octreesProj[i].setVisibility(controlPanel.checkbox2.checked);
	}
}

function toggleDebugMode() {

	/*
		no need to display all of it
	*/

	// D_INTERSECTION = controlPanel.checkbox1.checked;
	// if(D_INTERSECTION) {
	// 	// log("now in debug mode ...");
	// } else {
	// 	// log("out of debug mode ...");
	// 	scene.remove(balls);
	// 	scene.remove(boxes);
	// 	octree.setVisibility(false);
	// }

	// D_OVERLAP = controlPanel.checkbox1.checked;
	// if(D_OVERLAP) {
	// 	showProjections();
	// } else {
	// 	hideProjections();
	// }

	D_INTERLOCK = controlPanel.checkbox1.checked;
}

function checkInitialization() {

	if(objStatic == null) objStatic = objects[0].isStatic ? objects[0] : objects[1];
	if(objDynamic == null) objDynamic = objects[1].isStatic ? objects[0] : objects[1];
}

function checkOctreeValidity() {
	checkInitialization();
	if(objStatic.needRebuildOctree) {
		octree.rebuild();
		log("Octree updated.");
		objStatic.needRebuildOctree = false;
	}
}

function refreshDebugView() {
	octree.setVisibility(false);
	scene.remove(balls);
	scene.remove(boxes);
	balls = new THREE.Object3D();
	boxes = new THREE.Object3D();
}

function updateDebugView() {
	scene.add(balls);
	scene.add(boxes);
}

function togglePhysics() {
	usingPhysics = controlPanel.checkbox3.checked;

	if(usingPhysics) {
		scene.setGravity(gravity);
		
		scene.simulate();
		log("using physics ...")

		prevPos = undefined;
		cntStableFrames = -NUMFRAMESFORSTABILITY;
	} 
}

function surfaceSubdivision() {
	controlPanel.label4.innerHTML = controlPanel.slider1.value + "%";
	// console.log(controlPanel.slider1.value);
	for(var i=0; i<selected.length; i++) {
		subDivide(selected[i], controlPanel.slider1.value / 100.0);
		console.log(controlPanel.slider1.value / 100.0);
	}
}

function contains(array, elm) {

	if(array instanceof Array) {
		for(var i=0; i < array.length; i++) {
			if(array[i] === elm) {
				return true;
			}
		}
	}
	return false;
}

function calCtrMass(obj) {
	var ctrMass = new THREE.Vector3(0, 0, 0);
	var numVertices = obj.geometry.vertices.length;
	for(var i=0; i<numVertices; i++) {
		ctrMass.add(obj.geometry.vertices[i].clone().applyMatrix4(obj.matrixWorld));
	}

	ctrMass.divideScalar(numVertices);
	return ctrMass;
}

function triangleArea(va, vb, vc) {
	var ab = vb.clone().sub(va);
	var ac = vc.clone().sub(va);

	var x1 = ab.x, x2 = ab.y, x3 = ab.z,
		y1 = ac.x, y2 = ac.y, y3 = ac.z;

	return 0.5 * Math.sqrt(
			Math.pow((x2*y3 - x3*y2), 2) +
			Math.pow((x3*y1 - x1*y3), 2) +
			Math.pow((x1*y2 - x2*y1), 2)
		);
}

function rotateObjectX() {
	for(var i=0; i<selected.length; i++) {
		if(!selected[i].isStatic || staticObjLocked == false) {
			selected[i].rotation.x = controlPanel.slider1.value * Math.PI / 180;
		}
	}
	updateSliderLabel();
}

function rotateObjectY() {
	for(var i=0; i<selected.length; i++) {
		if(!selected[i].isStatic || staticObjLocked == false) {
			selected[i].rotation.y = controlPanel.slider2.value * Math.PI / 180;
		}
	}
	updateSliderLabel();
}

function rotateObjectZ() {
	for(var i=0; i<selected.length; i++) {
		if(!selected[i].isStatic || staticObjLocked == false) {
			selected[i].rotation.z = controlPanel.slider3.value * Math.PI / 180;
		}
	}
	updateSliderLabel();
}

function updateSliderLabel() {
	for(var i=0; i<selected.length; i++) {
		if(!selected[i].isStatic || staticObjLocked == false) {
			controlPanel.label7.innerHTML = "orientation. " + "X: " + (selected[i].rotation.x * 180 / Math.PI).toFixed(1) + ", " 
															+ "Y: " + (selected[i].rotation.y * 180 / Math.PI).toFixed(1) + ", "
															+ "Z: " + (selected[i].rotation.z * 180 / Math.PI).toFixed(1);
		}
	}
}

function savePrintObj() {
	for(var i=0; i < objects.length; i++) {
		if(objects[i].isStatic) {
			// console.log(objects[i].geometry);
			// saveSTL(objects[i].geometry, "things/" + objects[i].name + "_polka");
			objects[i].updateMatrixWorld();
			var mergedGeom = objects[i].geometry.clone();
			mergedGeom.applyMatrix(objects[i].matrixWorld);

			// var stlStr = stlFromGeometry( objects[i].geometry);
			// var stlStrSupport = new Arra;
			// var stlArray = new Array();
			for(var i=0; i<supports.length; i++) {
				supports[i].updateMatrixWorld();
				// console.log(supports[i].matrixWorld);
				var supportGeom = supports[i].geometry.clone();
				supportGeom.applyMatrix(supports[i].matrixWorld);
				THREE.GeometryUtils.merge(mergedGeom, supportGeom);
				// stlArray.push(stlFromGeometry( supports[i].geometry));
			}
			// var blob = new Blob([stlStr], {type: 'text/plain'});
			var m = new THREE.Matrix4();
			m.makeRotationX(Math.PI/2);
			mergedGeom.applyMatrix(m);

			var stlStr = stlFromGeometry( mergedGeom );
			var blob = new Blob([stlStr], {type: 'text/plain'});
  			saveAs(blob, name + '.stl');
			break;
		}
	}
}

function saveBothObjs() {
	var mergedGeom;
	for(var i=0; i < objects.length; i++) {
		var objGeom = objects[i].geometry.clone();
		objGeom.applyMatrix(objects[i].matrixWorld);
		if(mergedGeom == undefined) {
			mergedGeom = objGeom;
		} else {
			THREE.GeometryUtils.merge(mergedGeom, objGeom);
		}
	}

	var stlStr = stlFromGeometry( mergedGeom );
	var blob = new Blob([stlStr], {type: 'text/plain'});
	saveAs(blob, name + '.stl');
}



function lockObjToPrint() {
	staticObjLocked = controlPanel.checkbox4.checked;
}

var raisedY;
function toggleSupport() {
	var maxDimExisting;

	for(var i=0; i < objects.length; i++) {
		objects[i].geometry.computeBoundingBox();
		var bbox = objects[i].geometry.boundingBox;
		objects[i].bbox = bbox;

		objects[i].maxDim = 0;
		objects[i].maxDim = Math.max(objects[i].maxDim, Math.abs(bbox.max.x - bbox.min.x));
		objects[i].maxDim = Math.max(objects[i].maxDim, Math.abs(bbox.max.y - bbox.min.y));
		objects[i].maxDim = Math.max(objects[i].maxDim, Math.abs(bbox.max.z - bbox.min.z));
		
		if(!objects[i].isStatic) {
			maxDimExisting = objects[i].maxDim;
		}
	}

	for(var i=0; i < objects.length; i++) {
		if(objects[i].isStatic) {
			if(withoutSupport) {
				raisedY = maxDimExisting + objects[i].maxDim / 2 - objects[i].position.y;
				objects[i].position.y += Math.max(raisedY, 0);
				generateSupport(objects[i]);
			} else {
				objects[i].position.y -= Math.max(raisedY, 0);;
				removeSupport();
			}
			objects[i].needRebuildOctree = true;
		}
	}

	withoutSupport = !withoutSupport;
}