/**
 * 
 * @type THREE.Scene
 * @description Javascript code for the simulator
 * @author Oeyvind Blaauw & Frederik Borgersen
 * @copy Oeyvind Blaauw & Frederik Borgersen - 2015
 * @version 1.0
 */

/** Variable initialization **/

// Set up the scene, camera, and renderer as global variables.
var scene, camera, renderer;

/**
 * Used for relative position tracking
 * @type THREE.Mesh
 */
var plane = null;

/**
 * Used for Object intersection control
 * @type THREE.Raycaster
 */
var raycaster = new THREE.Raycaster(),
        INTERSECTED = null,
        SELECTED = null;

/**
 * Object that refers to the mouse pointer
 * @type THREE.Vector2
 */
var mouse = new THREE.Vector2();

/**
 * An offset used with the mouse cursor controller tracking
 * @type THREE.Vector3
 */
var offset = new THREE.Vector3();

/**
 * The router object
 */
var router = null;

/**
 * Array of measuring objects
 * @type Array
 */
var measureObjects = [];

/**
 * Array of measuring objects as Mesh Objects
 * @type Array
 */
var measureObjectsMesh = [];

/**
 * Array of Fabric.Points that holds outline points
 * @type Array
 */
var outline = [];

/**
 * Group of measuring objects
 * @type THREE.Group|THREE.Group|THREE.Group
 */
var group = null;

/**
 * Array that holds the walls as Mesh objects
 * @type Array
 */
var walls = [];

/**
 * Array that holds the lines from the Editor
 * @type @exp;getLinesFromEditor@pro;lines|Array|undefined|getLinesFromEditor.lines
 */
var linesArray = [];

/**
 * The number of floors created in Editor
 * @type Number|@exp;localStorage@call;getItem
 */
var numberOfFloors = 1;

/**
 * Frequency, initialized with 2.4 GHz
 * @type type
 */
var frequency = 2.4e9;

/**
 * 2.4 GHz frequency Button
 * @type @exp;document@call;getElementById
 */
var freqBtn24 = document.getElementById('btn-freq-24');

/**
 * 5 GHz frequency Button
 * @type @exp;document@call;getElementById
 */
var freqBtn50 = document.getElementById('btn-freq-50');

/**
 * Refactor used for proportioning
 * Equals to the grid size from the editor
 * @type Number
 */
var refactor = 50;

/** End of variable initialization **/

/** Functions **/

init();
animate();
calculateSignalStrength();

/**
 * Initializing function. Sets up the scene, camera and renderer
 */
function init() {
    /** Scene setup **/

    // Create the scene and set the scene size.
    scene = new THREE.Scene();
    var WIDTH = window.innerWidth,
        HEIGHT = window.innerHeight;

    // Create a renderer and add it to the DOM.
    renderer = new THREE.WebGLRenderer({antialias: true});
    renderer.setSize(WIDTH, HEIGHT);
    document.body.appendChild(renderer.domElement);

    // Create a camera, set the zoom level and add it to the scene.
    camera = new THREE.PerspectiveCamera(20, WIDTH / HEIGHT, 0.1, 20000);
    camera.position.set(0, 40, 40);
    scene.add(camera);

    /** End of scene setup **/


    // Create an event listener that resizes the renderer with the browser window.
    window.addEventListener('resize', function () {
        renderer.setSize(WIDTH, HEIGHT);
        camera.aspect = WIDTH / HEIGHT;
        camera.updateProjectionMatrix();
    });

    // Adds mouse listener to the renderer
    renderer.domElement.addEventListener('mousemove', onDocumentMouseMove, false);
    renderer.domElement.addEventListener('mousedown', onDocumentMouseDown, false);
    renderer.domElement.addEventListener('mouseup', onDocumentMouseUp, false);

    // Sets the background color of the scene.
    renderer.setClearColor(0xFFFFFF, 1);

    // Walls are prepared and drawn
    prepareWalls();

    // Sets the center point of view
    var centerPoint = setCenterPoint();
    var pX = centerPoint.x / refactor;
    var pY = centerPoint.y / refactor;

    /** Router setup **/

    // The geometry is a box
    var geometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);

    // A wifi image is added as the texture
    var texture = THREE.ImageUtils.loadTexture('img/wifi.png');
    var material = new THREE.MeshBasicMaterial({map: texture});

    // The mesh object is created
    router = new THREE.Mesh(geometry, material);

    // The router position relative to distance from floor in meters
    var routerHeight = 1.2;

    // The router's position is set, and added to the scene.
    router.position.set(pX, routerHeight, pY);
    scene.add(router);

    /** End of router setup **/

    // Creates a plane. Used for moving an object relative to the plane.
    plane = new THREE.Mesh(
            new THREE.PlaneBufferGeometry(2000, 2000, 8, 8),
            new THREE.MeshBasicMaterial({
                color: 0x000000,
                opacity: 0.25,
                transparent: true})
            );

    // Sets the plane visibility to false, and adds the plane to the scene
    plane.visible = false;
    scene.add(plane);

    // Group is initialized. The group holds the measuring points. Added to scene.
    group = new THREE.Group();
    scene.add(group);

    // Adds the measuring points if any lines exists
    if (linesArray.length > 0) {
        addPoints();
    }

    // Add OrbitControls to enable mouse zoom, drag and pan
    controls = new THREE.OrbitControls(camera, renderer.domElement);

    // Sets the center coordinates
    center = new THREE.Vector3(pX, 0, pY);
    controls.center = center;

    // Limits the view angle (over and under building)
    controls.maxPolarAngle = Math.PI / 2;
}
;

/**
 * Function for mouse event: Mouse move
 * Updates the mouse pointer's coordinates
 * Checks for router selection, and updates it's position
 * @param {type} event
 */
function onDocumentMouseMove(event) {

    event.preventDefault();

    // Get the mouse coordinates relative to window
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -((event.clientY - 51) / window.innerHeight) * 2 + 1;

    // Updates the raycaster's viewpoint
    raycaster.setFromCamera(mouse, camera);

    // If the router is already SELECTED
    if (SELECTED) {

        // Moves the router relative to the plane
        var intersects = raycaster.intersectObject(plane);
        SELECTED.position.copy(intersects[ 0 ].point.sub(offset));

        // Stops the router to be positioned below the floor
        if (SELECTED.position.y < 0.25) {
            SELECTED.position.y = 0.25;
        }

        // Hides the group of measuring points when moving router
        group.visible = false;
        return;
    }
    
    // This section helps to detect the router when moving the mouse
    var intersects = raycaster.intersectObject(router);

    if (intersects.length > 0) {

        if (INTERSECTED !== intersects[ 0 ].object) {

            if (INTERSECTED) {
                INTERSECTED.material.color.setHex(INTERSECTED.currentHex);
            }
            
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

/**
 * Function for mouse event: Button clicked.
 * A raycaster checks if the user hits the router with mouse click
 * @param {type} event
 */
function onDocumentMouseDown(event) {

    event.preventDefault();

    // Vector used for raycaster, represent mouse coordinates
    var vector = new THREE.Vector3(mouse.x, mouse.y, 0.5).unproject(camera);

    // Create a raycaster, used for checking router intersection
    var raycaster = new THREE.Raycaster(camera.position, vector.sub(camera.position).normalize());

    // The result of router intersection
    var intersects = raycaster.intersectObject(router);

    // If ray intersected with router object
    if (intersects.length > 0) {

        // Disable the OrbitControls, no rotation or zooming possible when router is hit
        controls.enabled = false;

        // Sets the router as a SELECTED object
        SELECTED = intersects[ 0 ].object;

        var intersects = raycaster.intersectObject(plane);
        offset.copy(intersects[ 0 ].point).sub(plane.position);
    }
}
;

/**
 * Function for mouse event: Button release
 * Checks for router intersection, and updates values
 * @param {type} event
 */
function onDocumentMouseUp(event) {

    event.preventDefault();

    // Enables OrbitControls
    controls.enabled = true;

    // Checks if the raycaster hit the router
    if (INTERSECTED) {

        // Updates the plane
        plane.position.copy(INTERSECTED.position);

        // Resets the SELECTED object
        SELECTED = null;

        // Updates the router's position
        var routerPos = router.position,
                rx = routerPos.x,
                ry = routerPos.y,
                rz = routerPos.z;

        // Returns if the router is outside the building, or below
        if (rx < outline[0].x / refactor || rx > outline[3].x / refactor)
            return;
        if (rz < outline[1].y / refactor || rz > outline[2].y / refactor)
            return;
        if (ry < 0)
            return;

        // If the router is inside the building, calculate new signal strengths
        calculateSignalStrength();

        // Shows the measuring-points group
        group.visible = true;
    }
}
;

/**
 * Renders the scene and updates the renderer as needed.
 * 
 */
function animate() {

    requestAnimationFrame(animate);

    // Render the scene.
    renderer.sortObjects = false;
    renderer.render(scene, camera);
    controls.update();
}
;

/**
 * getLinesFromEditor returns the drawn lines from editor
 * @returns {lines|getLinesFromEditor.lines|Array}
 */
function getLinesFromEditor() {

    // Create an empty array
    var lines = [];

    // currentFloors equals the number of floors created
    numberOfFloors = localStorage.getItem('currentFloors');

    // Loop through the floors
    for (var i = 1; i <= numberOfFloors; i++) {

        // Set a floor ID based on floor number
        var floorID = "myFloor" + i;

        // Get the JSON Object from local Storage
        var json = JSON.parse(localStorage.getItem(floorID));

        // If no data exists on that floor, return
        if (json === null)
            return;

        // objects equals all the drawn lines from floor current floor
        var objects = json.objects;

        // Loop through current floor, and push the lines to the array
        for (var j = 0; j < objects.length; j++) {
            lines.push(objects[j]);
        }
    }

    // return array
    return lines;
}
;

/**
 * Gets the lines from the editor, and prepares the walls to be drawn as mesh objects.
 * Calls the drawWall() method for each wall object
 */
function prepareWalls() {

    // Retrieve the lines from the editor
    linesArray = getLinesFromEditor();
    for (var i = 0; i < linesArray.length; i++) {

        // Sets the needed variables
        var line = linesArray[i],
                x1 = line.x1,
                x2 = line.x2,
                y1 = line.y1,
                y2 = line.y2,
                xStart = line.left,
                xStop = line.width,
                zStart = line.top,
                zStop = line.height,
                floorNumber = line.floorNumber,
                material = line.material;

        // Checks if the line is drawn from bottom-left corner to top-right corner
        if ((x2 > x1 && y2 < y1) || (x2 < x1 && y2 > y1)) {
            zStart = line.top + line.height,
                    zStop = -line.height;
        }

        // Refactors the values to match the scene setup
        xStart /= refactor,
                zStart /= refactor,
                xStop /= refactor,
                zStop /= refactor;

        // Calls the drawWall method
        drawWall(xStart, zStart, xStop, zStop, floorNumber, material);
    }
}
;

/**
 * Creates a wall based on input data of line
 * @param {type} xStart - x start position of line
 * @param {type} zStart - z start position of line
 * @param {type} xStop - x stop position of line
 * @param {type} zStop - z stop position of line
 * @param {type} floorNumber - the floor the wall belongs to
 * @param {type} material - the walls material
 */
function drawWall(xStart, zStart, xStop, zStop, floorNumber, material) {

    // Sets the standard ceiling height
    var height = 2.40;

    // Sets the start and stop position of the height
    var yStart = (floorNumber - 1) * height;
    var yStop = height * floorNumber;

    // Creates new coordinates for X and Z. Used to create the geometry
    var xNew = xStart + xStop;
    var zNew = zStart + zStop;

    // Builds the wall geometry from Vectors
    var wallGeometry = new THREE.Geometry();
    wallGeometry.vertices.push(new THREE.Vector3(xStart, yStop, zStart));
    wallGeometry.vertices.push(new THREE.Vector3(xNew, yStop, zNew));
    wallGeometry.vertices.push(new THREE.Vector3(xNew, yStart, zNew));
    wallGeometry.vertices.push(new THREE.Vector3(xStart, yStart, zStart));
    wallGeometry.faces.push(new THREE.Face3(0, 1, 2));
    wallGeometry.faces.push(new THREE.Face3(0, 2, 3));

    // Creates a wall "mesh" from the geometry.
    // Sets the options of the material used for the walls (transparent, grey).
    var wall = new THREE.Mesh(wallGeometry, new THREE.MeshBasicMaterial({
        color: 0xCCCCCC,
        side: THREE.DoubleSide,
        opacity: 0.6,
        transparent: true
    }));

    // Creates an attribute and sets the value to the loss of dBm gotten
    // by the wall's material
    wall.wallMaterialLoss = getMaterialLoss(material);

    // Adds a wireframe around the edges of the walls.
    var wireframe = new THREE.EdgesHelper(wall, 0x000000);

    // Push the wall to a global array, and add the wall to the scene
    walls.push(wall);
    scene.add(wireframe);
    scene.add(wall);
}
;

/**
 * Finds the center point of the building drawn in the editor.
 * Detects the outline walls. Used to set the camera and router position.
 * @returns {fabric.Point}
 */
function setCenterPoint() {

    // Variables refers to most-left-point, -right, -top and -bottom
    var cL, cR, cT, cB;

    // Variables refers to the center points
    var centerX, centerY, centerPoint;

    // Find the center point if there exists any lines
    if (linesArray.length > 0) {

        // Set the first line temporary as center points
        var line = linesArray[0];
        cL = line.left;
        cR = line.left + line.width;
        cT = line.top;
        cB = line.top + line.height;

        // Loops through the rest of the lines and updates the
        // most left, right, bottom and top points
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

        // Set the center points
        centerX = (cR + cL) / 2;
        centerY = (cB + cT) / 2;
    }
    // If the linesArray is empty, set the position to (0,0)
    else {
        centerX = 0, centerY = 0;
    }

    // Creates fabric Points, and pushes the points to an outline array
    var topLeftPoint = new fabric.Point(cL, cT);
    var topRightPoint = new fabric.Point(cR, cT);
    var botLeftPoint = new fabric.Point(cL, cB);
    var botRightPoint = new fabric.Point(cR, cB);
    outline.push(topLeftPoint);
    outline.push(topRightPoint);
    outline.push(botLeftPoint);
    outline.push(botRightPoint);

    // Set the centerPoint as fabric.Point
    centerPoint = new fabric.Point(centerX, centerY);

    return centerPoint;
}
;

/**
 * Function that place measure points evenly spread out
 * in the building. Used later to calculate signal strength
 * 
 */
function addPoints() {

    // Global array that holds the points
    measureObjects = [];

    // The points are added to a global Three.Group
    group = new THREE.Group();

    // Variables that represents the router position
    var routerPos = router.position,
            rx = Math.round(routerPos.x),
            rz = Math.round(routerPos.z);

    // Distance between the measure points (in meters)
    var distance = 2;

    // Distance from router in each direction
    var radius = 20.5;

    // Standard ceiling height (in meters)
    var height = 2.40;

    // For each distance in x direction
    for (var i = -radius + rx; i < radius + rx; i += distance) {

        // Skips adding the point if the points position is outside the
        // building (in x coordinates)
        if (i < outline[0].x / refactor)
            continue;
        if (i > outline[3].x / refactor)
            continue;

        // For each distance in z direction
        for (var j = -radius + rz; j < radius + rz; j += distance) {

            // Skips adding the point if the points position is outside the
            // building (in y coordinates)
            if (j < outline[1].y / refactor)
                continue;
            if (j > outline[2].y / refactor)
                continue;

            // For each floor
            for (var k = 0; k < numberOfFloors; k++) {

                // Creates the point object
                var point = {
                    x: i,
                    y: k * height,
                    z: j
                };

                // pushes the object to the global array
                measureObjects.push(point);
            }
        }
    }

    // Calls the pointsToMesh method, that converts the objects to Three.Mesh objects
    pointsToMesh();
}

/**
 * Function that converts the point objects to Mesh-objects, added to scene.
 * The mesh objects are created as spheres
 */
function pointsToMesh() {

    // Sphere radius
    var radius = 0.2;

    // Creates the sphere
    var geometry = new THREE.SphereGeometry(radius, 32, 32);

    // Empty the global array that holds the mesh objects
    measureObjectsMesh = [];

    // Loops through objects, and converts them
    for (var i = 0; i < measureObjects.length; i++) {
        var pointPos = measureObjects[i],
                sx = pointPos.x,
                sy = pointPos.y,
                sz = pointPos.z;

        // Sets the material of the sphere, i.e. a default color
        var material = new THREE.MeshBasicMaterial({color: 0x2ae300});

        // Creates the mesh, combination of geometry and material
        var sphere = new THREE.Mesh(geometry, material);

        // Sets the position
        sphere.position.set(sx, sy, sz);

        // Adds the sphere to the array holding the mesh objects
        measureObjectsMesh.push(sphere);

        // Adds the sphere to the global group
        group.add(sphere);
    }

    // Adds the group to the scene
    scene.add(group);
}
;

/**
 * Based on the wall material, returns a decibel value
 * that represents the loss of signal strength through that material
 * @param {type} wallMaterial
 * @returns {Number}
 */
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
;

/**
 * Sets a measure point's color based on signal strength (in dBm)
 * @param {type} point
 * @param {type} dbValue
 */
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
;

/**
 * Calculates the signal strength of all the measuring points
 */
function calculateSignalStrength() {

    // The output power in mW
    var milliWatts;

    // Checks the frequency, decides the output power in mW
    if (frequency === 2.4e9) {
        // 2.4 GHz frequency
        milliWatts = 100;
    } else if (frequency === 5e9) {
        // 5.0 GHz frequency
        milliWatts = 200;
    }

    // Converts mW to dBm. (EIRP = Equivalent isotropically radiated power)
    // Calculations and variables referred to dBm or dB
    var eirp = 10 * Math.log10(milliWatts);
    var antennaGain = 0;
    var cableLoss = 0;

    // Average noise level
    var noise = -90;

    // Position of router
    var origin = router.position,
            rx = origin.x,
            ry = origin.y,
            rz = origin.z;

    // Loop through every measuring point
    for (var i = 0; i < measureObjectsMesh.length; i++) {

        // Get the current object's position
        var objectPos = measureObjectsMesh[i].position,
                sx = objectPos.x,
                sy = objectPos.y,
                sz = objectPos.z;

        // Calculate the direction from router to point, unit vector
        var direction = new THREE.Vector3(sx - rx, sy - ry, sz - rz).normalize();

        // Calculates the distance from the router to the point
        var distance = objectPos.distanceTo(origin);

        // Creates a raycaster from the router, in the direction of the point
        var raycaster = new THREE.Raycaster(origin, direction, 0, (distance));

        // Calculates the free-space path loss
        var fspl = 20 * Math.log10(distance) + 20 * Math.log10(frequency) - 147.55;

        // Calculates the signal strength (in dB)
        var dbValue = eirp - fspl - cableLoss + antennaGain;

        // Checks for intersecting walls
        var intersectsWalls = raycaster.intersectObjects(walls, true);

        // If any walls are detected between router and measuring point
        if (intersectsWalls.length > 0) {

            // Loop through the results (array), and subtract the material loss
            // from the total dbValue
            for (var p = 0; p < intersectsWalls.length; p++) {
                dbValue -= intersectsWalls[p].object.wallMaterialLoss;
            }
        }

        // Added to supplement for interference and noise
        dbValue -= 10;
        console.log(dbValue);
        // Calculates the Signal-to-Noise-ratio
        var SNR = dbValue - noise;

        // Sets the color of the point, based on dbValue
        setSignalStatus(measureObjectsMesh[i], dbValue);
    }
}
;

/**
 * Adds onclick function for the 2.4 GHz frequency button
 */
freqBtn24.onclick = function () {
    if (this.getAttribute('class') === 'btn btn-default') {

        // Sets the 2.4 GHz button to green
        this.setAttribute('class', 'btn btn-success');

        // Grays out the 5 GHz button
        freqBtn50.setAttribute('class', 'btn btn-default');

        // Sets the frequency to 2.4 GHz
        frequency = 2.4e9;

        // Runs the calculation method 
        calculateSignalStrength();
    }
};

/**
 * Adds onclick function for the 2.4 GHz frequency button
 */
freqBtn50.onclick = function () {
    if (this.getAttribute('class') === 'btn btn-default') {

        // Sets the 5 GHz button to green
        this.setAttribute('class', 'btn btn-success');

        // Grays out the 2.4 GHz button
        freqBtn24.setAttribute('class', 'btn btn-default');

        // Sets the frequency to 5 GHz
        frequency = 5e9;

        // Runs the calculation method 
        calculateSignalStrength();
    }
};