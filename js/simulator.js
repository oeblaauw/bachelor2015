
// Set up the scene, camera, and renderer as global variables.
var scene, camera, renderer;
var spheres = [],
        plane,
        raycaster = new THREE.Raycaster(),
        mouse = new THREE.Vector2(),
        offset = new THREE.Vector3(),
        INTERSECTED, SELECTED;
var somePoints = [];
var outline = [];
var group = new THREE.Group();
var walls = [];
var allObjects = [];
var linesArray;
var numberOfFloors = 1;
//var floorGeometries = [0];

init();
animate();
calculateSignalStrength();

// Sets up the scene.
function init() {

    // Create the scene and set the scene size.
    scene = new THREE.Scene();
    var WIDTH = window.innerWidth,
            HEIGHT = window.innerHeight;
    
    // Create a renderer and add it to the DOM.
    renderer = new THREE.WebGLRenderer({antialias: true});
    renderer.setSize(WIDTH, HEIGHT);
    document.body.appendChild(renderer.domElement);

    // Create a camera, zoom it out from the model a bit, and add it to the scene.
    camera = new THREE.PerspectiveCamera(45, WIDTH / HEIGHT, 0.1, 20000);
    camera.position.set(0, 20, 50);
    scene.add(camera);

    // Create an event listener that resizes the renderer with the browser window.
    window.addEventListener('resize', function () {
        var WIDTH = window.innerWidth,
                HEIGHT = window.innerHeight;
        renderer.setSize(WIDTH, HEIGHT);
        camera.aspect = WIDTH / HEIGHT;
        camera.updateProjectionMatrix();
    });
    
    renderer.domElement.addEventListener('mousemove', onDocumentMouseMove, false);
    renderer.domElement.addEventListener('mousedown', onDocumentMouseDown, false);
    renderer.domElement.addEventListener('mouseup', onDocumentMouseUp, false);
    
    // Set the background color of the scene.
    renderer.setClearColor(0xFFFFFF, 1);

    linesArray = getLinesFrom2D();
    for (var i = 0; i < linesArray.length; i++) {
        var linje = linesArray[i],
                refactor = 50,
                x1 = linje.x1,
                x2 = linje.x2,
                y1 = linje.y1,
                y2 = linje.y2,
                xPos = linje.left,
                xSize = linje.width,
                zPos = linje.top,
                zSize = linje.height,
                floorNumber = linje.floorNumber,
                material = linje.material;
        /* This is in case we draw a line from Bot.left to Top.right*/
        if ((x2 > x1 && y2 < y1) || (x2 < x1 && y2 > y1)) {
            zPos = linje.top + linje.height,
                    zSize = -linje.height;
        }
        xPos /= refactor,
                zPos /= refactor,
                xSize /= refactor,
                zSize /= refactor;
        drawWall(xPos, zPos, xSize, zSize, floorNumber, material);
    }

    var centerPoint = findCenterPoint();
    var pX = centerPoint.x / 50;
    var pY = centerPoint.y / 50;
    
    //AddMoveable element
    var geometry = new THREE.SphereGeometry(0.2, 32, 32);
    var material = new THREE.MeshBasicMaterial({color: 0x383838});
    var sphere = new THREE.Mesh(geometry, material);
    sphere.position.set(pX, 1.2, pY);
    scene.add(sphere);
    spheres.push(sphere);

    plane = new THREE.Mesh(
            new THREE.PlaneBufferGeometry(2000, 2000, 8, 8),
            new THREE.MeshBasicMaterial({color: 0x000000, opacity: 0.25, transparent: true})
            );
    plane.visible = false;
    scene.add(plane);

    group = new THREE.Group();
    scene.add(group);
    
    if(linesArray.length > 0) {
        addSomePoints();
    }
    
                
    // Add OrbitControls so that we can pan around with the mouse.
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    
    center = new THREE.Vector3(pX, 0, pY);
    controls.center = (center);
    controls.maxPolarAngle = Math.PI / 2;
}

function onDocumentMouseMove(event) {

    event.preventDefault();

    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -((event.clientY - 51) / window.innerHeight) * 2 + 1;

    //

    raycaster.setFromCamera(mouse, camera);

    if (SELECTED) {
       
        var intersects = raycaster.intersectObject(plane);
        SELECTED.position.copy(intersects[ 0 ].point.sub(offset));
        if(SELECTED.position.y < 0) {
           SELECTED.position.y = 0;
       }
        group.visible = false;
        return;
    }

    var intersects = raycaster.intersectObjects(spheres);

    if (intersects.length > 0) {

        if (INTERSECTED != intersects[ 0 ].object) {

            if (INTERSECTED)
                INTERSECTED.material.color.setHex(INTERSECTED.currentHex);

            INTERSECTED = intersects[ 0 ].object;
            INTERSECTED.currentHex = INTERSECTED.material.color.getHex();

            plane.position.copy(INTERSECTED.position);
            plane.lookAt(camera.position);

        }

    } else {

        if (INTERSECTED)
            INTERSECTED.material.color.setHex(INTERSECTED.currentHex);

        INTERSECTED = null;

    }

}

function onDocumentMouseDown(event) {

    event.preventDefault();

    var vector = new THREE.Vector3(mouse.x, mouse.y, 0.5).unproject(camera);

    var raycaster = new THREE.Raycaster(camera.position, vector.sub(camera.position).normalize());

    var intersects = raycaster.intersectObjects(spheres);

    if (intersects.length > 0) {

        controls.enabled = false;

        SELECTED = intersects[ 0 ].object;
        
        var intersects = raycaster.intersectObject(plane);
        offset.copy(intersects[ 0 ].point).sub(plane.position);
    }

}

function onDocumentMouseUp(event) {

    event.preventDefault();

    controls.enabled = true;

    if (INTERSECTED) {

        plane.position.copy(INTERSECTED.position);

        SELECTED = null;

        var routerPos = spheres[0].position,
                rx = routerPos.x,
                ry = routerPos.y,
                rz = routerPos.z;

        if (rx < outline[0].x / 50 || rx > outline[3].x / 50)
            return;
        if (rz < outline[1].y / 50 || rz > outline[2].y / 50)
            return;
        if (ry < 0)
            return;

        calculateSignalStrength();
        group.visible = true;
    }

}
// Renders the scene and updates the render as needed.
function animate() {

    // Read more about requestAnimationFrame at http://www.paulirish.com/2011/requestanimationframe-for-smart-animating/
    requestAnimationFrame(animate);

    // Render the scene.
    renderer.sortObjects = false;
    renderer.render(scene, camera);
    controls.update();
}
;

// Pulls the drawn lines from local storage
function getLinesFrom2D() {
    // Array of lines from all floors
    var lines = [];
    // currentFloors equals the number of floors drawn
    var maxFloor = localStorage.getItem('currentFloors');
    numberOfFloors = maxFloor;
    // Loop through floors
    for (var i = 1; i <= maxFloor; i++) {
        var floorID = "myFloor" + i;
        var json = JSON.parse(localStorage.getItem(floorID));
        if (json === null)
            return;
        var objects = json.objects;
        // Loop through current floor, and push lines to array
        for (var j = 0; j < objects.length; j++) {
            lines.push(objects[j]);
        }
    }
    return lines;
}
;

function drawWall(xPos, zPos, xSize, zSize, floorNumber, material) {

    //Set fixed positions for yPos (ground level) and ySize (standard ceiling height)
    var yPos = (floorNumber - 1) * 2.4;
    var ySize = 2.4 * floorNumber;

    //Calculate new coordinates for (x,z)
    var xNew = xPos + xSize;
    var zNew = zPos + zSize;

    //Build wall geometry from Vectors
    var wallGeometry = new THREE.Geometry();
    wallGeometry.vertices.push(new THREE.Vector3(xPos, ySize, zPos));
    wallGeometry.vertices.push(new THREE.Vector3(xNew, ySize, zNew));
    wallGeometry.vertices.push(new THREE.Vector3(xNew, yPos, zNew));
    wallGeometry.vertices.push(new THREE.Vector3(xPos, yPos, zPos));
    wallGeometry.faces.push(new THREE.Face3(0, 1, 2));
    wallGeometry.faces.push(new THREE.Face3(0, 2, 3));

//    //Update floor geometry from vectors
//    if(floorGeometries[floorNumber]=== undefined){
//        floorGeometries[floorNumber] = [];
//        floorGeometries[floorNumber].push(new THREE.Vector2(xPos, zPos));
//    }
//    floorGeometries[floorNumber].push(new THREE.Vector2(xNew, zNew));

    //Create wall "mesh" from geometry and add wireframing
    var wall = new THREE.Mesh(wallGeometry, new THREE.MeshBasicMaterial({color: 0xCCCCCC, side: THREE.DoubleSide, opacity: 0.6, transparent: true}));
    wall.wallMaterialLoss = getMaterialLoss(material);
    var wireframe = new THREE.EdgesHelper(wall, 0x000000);
    walls.push(wall);
    scene.add(wireframe);
    scene.add(wall);
}
;
//for (var i = 1; i < floorGeometries.length; i++) {
//    floorShape = new THREE.Shape(floorGeometries[i]);
//    floorGeometry = new THREE.ShapeGeometry(floorShape);
//    floor = new THREE.Mesh(floorGeometry, new THREE.MeshBasicMaterial({color: 0x000000, side: THREE.BackSide, opacity: 0.2, transparent: true}));
//    floor.rotation.x = Math.PI/2;
//    floor.position.y = 2.4 * (i-1);
//    scene.add(floor);
//}

//Finds the center point of building, and detects outline-walls
function findCenterPoint() {
    var cL, cR, cT, cB,
            centerX, centerY, centerPoint;
    if (linesArray.length > 0) {
        var line = linesArray[0];
        cL = line.left;
        cR = line.left + line.width;
        cT = line.top;
        cB = line.top + line.height;

        for (var i = 1; i < linesArray.length; i++) {
            line = linesArray[i];

            if (line.left + line.width > cR) {
                cR = line.left + line.width;
            }
            if (line.left < cL) {
                cL = line.left;
            }
            if (line.top + line.height > cB) {
                cB = line.top + line.height;
            }
            if (line.top < cT) {
                cT = line.top;
            }
        }
        centerX = (cR + cL) / 2;
        centerY = (cB + cT) / 2;
    } else {
        centerX = 0, centerY = 0;
    }
    
    var topLeftPoint = new fabric.Point(cL, cT);
    var topRightPoint = new fabric.Point(cR, cT);
    var botLeftPoint = new fabric.Point(cL, cB);
    var botRightPoint = new fabric.Point(cR, cB);
    outline.push(topLeftPoint);
    outline.push(topRightPoint);
    outline.push(botLeftPoint);
    outline.push(botRightPoint);
                
    centerPoint = new fabric.Point(centerX, centerY);
    
    return centerPoint;
}
;

//Create points as objects based on walls position
function addSomePoints() {
    somePoints = [];
    group = new THREE.Group();
    var routerPos = spheres[0].position,
            rx = Math.round(routerPos.x),
            ry = routerPos.y,
            rz = Math.round(routerPos.z);
    var distance = 2;

    for (var i = -20.5 + rx; i < 20.5 + rx; i += distance) {
        
        if (i < outline[0].x / 50)
            continue;
        if (i > outline[3].x / 50)
            continue;

        for (var j = -20.5 + rz ; j < 20.5 + rz; j += distance) {
            if (j < outline[1].y / 50)
                continue;
            if (j > outline[2].y / 50)
                continue;

            //For each floor
            for(var k = 0; k < numberOfFloors; k++) {
                var point = {
                    x: i,
                    y: k*2.4,
                    z: j
                };
                somePoints.push(point);
            }
        }

    }
    pointsToMesh();
}

//Converts point objects to Mesh-objects, and adds to scene
function pointsToMesh() {
    var geometry = new THREE.SphereGeometry(0.2, 32, 32);
    allObjects = [];
    for (var i = 0; i < somePoints.length; i++) {
        var pointPos = somePoints[i],
                sx = pointPos.x,
                sy = pointPos.y,
                sz = pointPos.z;
        var material = new THREE.MeshBasicMaterial({color: 0x2ae300});
        var sphere = new THREE.Mesh(geometry, material);
        sphere.position.set(sx, sy, sz);
        allObjects.push(sphere);
        group.add(sphere);
    }
    scene.add(group);
}

//Returns a decibel value (loss) based on wall material
function getMaterialLoss(wallMaterial) {
    var dbValue;
    switch (wallMaterial) {
        case 'drywall':
            dbValue = 3;
            break;
        case 'wood':
            dbValue = 4;
            break;
        case 'concrete':
            dbValue = 12;
            break;
        case 'glass':
            dbValue = 2;
            break;
        default:
            dbValue = 0;
            break;
    }
    return dbValue;
}

//Set a points signal status based on dbValue
function setSignalStatus(point, dbValue) {
    var color;
    if (dbValue > -60) {
        color = 0x2ae300;
    }
    else if (dbValue > -65) {
        color = 0xa8e300;
    }
    else if (dbValue > -70) {
        color = 0xfdff00;
    }
    else if (dbValue > -75) {
        color = 0xffdb00;
    }
    else if (dbValue > -85) {
        color = 0xff9a00;
    }
    else {
        color = 0xff3300;
    }
    
    point.material.color.setHex(color);
}

function calculateSignalStrength() {
    var milliWatts = 100; //2.4 GHz. 5 GHz has a max value of 200 mw
    var eirp = 10 * Math.log10(milliWatts);
    var antennaGain = 2;    
    var cableLoss = 0;
    var noise = -90; //Average noise level
    
    //Position of router
    var origin = spheres[0].position,
            rx = origin.x,
            ry = origin.y,
            rz = origin.z;

    //Loop through every point of measure
    for (var i = 0; i < allObjects.length; i++) {
        var objectPos = allObjects[i].position,
                sx = objectPos.x,
                sy = objectPos.y,
                sz = objectPos.z;
        var direction = new THREE.Vector3(sx - rx, sy - ry, sz - rz).normalize();
        var distance = objectPos.distanceTo(origin);
        var raycaster = new THREE.Raycaster(origin, direction, 0, (distance));
        
        
        var fspl = 20 * Math.log10(distance) + 40.05;
        var dbValue = eirp - fspl - cableLoss + antennaGain;

        var intersectsWalls = raycaster.intersectObjects(walls, true);
        if (intersectsWalls.length > 0) {
            for (var p = 0; p < intersectsWalls.length; p++) {
                //if (intersectsWalls[p].distance <= distance) {
                    dbValue -= intersectsWalls[p].object.wallMaterialLoss;
                //}
            }
        }
        dbValue -= 20;  //Midlertidig noise value
        
        var SNR = dbValue - noise;
        console.log(SNR);
        setSignalStatus(allObjects[i], dbValue);  
    }
}            