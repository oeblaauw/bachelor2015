
// Set up the scene, camera, and renderer as global variables.
var scene, camera, renderer;
var linjeArray = [];
//var floorGeometries = [0];

init();
animate();

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

    // Set the background color of the scene.
    renderer.setClearColor(0xFFFFFF, 1);

    var axisHelper = new THREE.AxisHelper(5);
    scene.add(axisHelper);


    linjeArray = getLinesFrom2D();
    for (var i = 0; i < linjeArray.length; i++) {
        var linje = linjeArray[i],
                refactor = 50,
                x1 = linje.x1,
                x2 = linje.x2,
                y1 = linje.y1,
                y2 = linje.y2,
                xPos = linje.left,
                xSize = linje.width,
                zPos = linje.top,
                zSize = linje.height,
                floorNumber = linje.floorNumber;
        /* This is in case we draw a line from Bot.left to Top.right*/
        if ((x2 > x1 && y2 < y1) || (x2 < x1 && y2 > y1)) {
            zPos = linje.top + linje.height,
                    zSize = -linje.height;
        }
        xPos /= refactor,
                zPos /= refactor,
                xSize /= refactor,
                zSize /= refactor;
        drawWall(xPos, zPos, xSize, zSize, floorNumber);
    }


    // Add OrbitControls so that we can pan around with the mouse.
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    var centerPoint = findCenterPoint();
    var pX = centerPoint.x / 50;
    var pY = centerPoint.y / 50;


    center = new THREE.Vector3(pX, 0, pY);
    controls.center = (center);
    controls.maxPolarAngle = Math.PI / 2;
}

// Renders the scene and updates the render as needed.
function animate() {

    // Read more about requestAnimationFrame at http://www.paulirish.com/2011/requestanimationframe-for-smart-animating/
    requestAnimationFrame(animate);

    // Render the scene.
    renderer.render(scene, camera);
    controls.update();
}

function getLinesFrom2D() {
    var linesArray = [];
    var maxFloor = localStorage.getItem('currentFloors'); //Number of floors
    for (var i = 1; i <= maxFloor; i++) {
        var floor = "myFloor" + i;
        var jsonfloor = JSON.parse(localStorage.getItem(floor));
        if (jsonfloor === null)
            return;
        var array = jsonfloor.objects;
        for (var j = 0; j < array.length; j++) {
            linesArray.push(array[j]);
        }
    }
    return linesArray;
}
;

function drawWall(xPos, zPos, xSize, zSize, floorNumber) {

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
    var wall = new THREE.Mesh(wallGeometry, new THREE.MeshBasicMaterial({color: 0x000000, side: THREE.DoubleSide, opacity: 0.6, transparent: true}));
    var wireframe = new THREE.EdgesHelper(wall, 0x000000);

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

function findCenterPoint() {
    var cL, cR, cT, cB,
            centerX, centerY, centerPoint;
    if (linjeArray.length > 0) {
        var line = linjeArray[0];
        cL = line.left;
        cR = line.left + line.width;
        cT = line.top;
        cB = line.top + line.height;

        for (var i = 1; i < linjeArray.length; i++) {
            line = linjeArray[i];

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
    centerPoint = new fabric.Point(centerX, centerY);
    return centerPoint;
}
;