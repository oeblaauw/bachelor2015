
// Set up the scene, camera, and renderer as global variables.
var scene, camera, renderer;

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

    function drawWall(xPos, zPos, xSize, zSize) {

        //Set fixed positions for yPos (ground level) and ySize (standard ceiling height)
        var yPos = 0;
        var ySize = 2.4;

        //Calculate new coordinates for (x,z)
        var xNew = xPos + xSize;
        var zNew = zPos + zSize;

        //Build geometry from Vectors
        var geometry = new THREE.Geometry();
        geometry.vertices.push(new THREE.Vector3(xPos, ySize, zPos));
        geometry.vertices.push(new THREE.Vector3(xNew, ySize, zNew));
        geometry.vertices.push(new THREE.Vector3(xNew, yPos, zNew));
        geometry.vertices.push(new THREE.Vector3(xPos, yPos, zPos));
        geometry.faces.push(new THREE.Face3(0, 1, 2));
        geometry.faces.push(new THREE.Face3(0, 2, 3));

        // Draw wall
        var wall = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({color: 0x000000, side: THREE.DoubleSide, opacity: 0.5, transparent: true}));
        scene.add(wall);
    }

    /*
     * Function 
     */
    function getLinesFrom2D() {
        var json = localStorage.getItem("myLines"),
                linesArray = [],
                jsonArray = JSON.parse(json);

        for (var i = 0; i < jsonArray.length; i++) {
            linesArray.push(jsonArray[i]);
        }
        return linesArray;
    }

    var linjeArray = getLinesFrom2D();
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
                zSize = linje.height;
        /* This is in case we draw a line from Bot.left to Top.right*/
        if ((x2 > x1 && y2 < y1) || (x2 < x1 && y2 > y1)) {
            zPos = linje.top + linje.height,
                    zSize = -linje.height;
        }
        xPos /= refactor,
                zPos /= refactor,
                xSize /= refactor,
                zSize /= refactor;
        drawWall(xPos, zPos, xSize, zSize);
    }


    // Add OrbitControls so that we can pan around with the mouse.
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    var CPJSON = localStorage.getItem("centerPoint");
    var point, pX, pY;
    if (CPJSON !== null) {
        point = JSON.parse(CPJSON);
        pX = point.x / 50;
        pY = point.y / 50;
    } else {
        pX = pY = 0;
    }

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

