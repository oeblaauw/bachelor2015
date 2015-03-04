/**
 * 
 * @type fabric.Canvas
 * @description Main js file for project
 * @author Øyvind Blaauw & Frederik Borgersen
 * @copy Øyvind Blaauw & Frederik Borgersen 2015
 * @version 1.0
 */

/**
 * 
 * Declaring and initializing variables
 */
var canvas = new fabric.Canvas('canvas', {selection: false, width: this.width, height: this.height, targetFindTolerance: 5});
var linesArray = [];    //Our lines that represents walls
var deleteButton = document.getElementById('btn-delete'),
        clearButton = document.getElementById('btn-clear'),
        updateButton = document.getElementById('btn-update');
var checkbox = document.getElementById('chk-select');
var width = canvas.width;
var height = canvas.height;
var grid = 50;
var gridcolor = '#ccc';
var objectSelected = false;

// Runs the init function
init();

/**
 * 
 * Run the initializing functions here
 */
function init() {
    linesArray = [];
    checkbox.checked = false;
    drawGrid();
    loadCanvas();
}

//Function for drawing a non-selectable grid
function drawGrid() {
    var gridOptions = {
        stroke: '#ccc',
        strokeWidth: 1,
        selectable: false,
        evented: false
    };
    for (var i = 0; i < (width / grid); i++) {
        canvas.add(new fabric.Line([i * grid, 0, i * grid, height], gridOptions));
        canvas.add(new fabric.Line([0, i * grid, width, i * grid], gridOptions));
    }
}

//When clicking down the mouse button
canvas.on('mouse:down', function (options) {
    if (canvas.selection)
        return;
    if (!objectSelected) {
        isDown = true;
        var pointer = canvas.getPointer(options.e);
        var pointX = Math.round(pointer.x / grid) * grid;
        var pointY = Math.round(pointer.y / grid) * grid;
        var points = [pointX, pointY, pointX, pointY];
        line = new fabric.Line(points, {
            strokeWidth: 2,
            stroke: 'black',
            selectable: false,
            lockScalingX: true,
            lockScalingY: true,
            lockUniScaling: true,
            lockScalingFlip: true,
            hasControls: true,
            strokeLineCap: 'square',
            perPixelTargetFind: true,
            rotatingPointOffset: 50, //in pixels + offset
            visible: true,
            padding: 10,
            material: 'gips'
        });
        canvas.add(line);
    }
});

checkbox.onchange = function () {
    canvas.selection = checkbox.checked;

};

//When moving the mouse around
canvas.on('mouse:move', function (options) {
    if (!isDown)
        return;
    if (objectSelected)
        return;

    //If here: Assuming we're drawing a line
    var pointer = canvas.getPointer(options.e);
    line.set({x2: Math.round(pointer.x / grid) * grid, y2: Math.round(pointer.y / grid) * grid});
    canvas.renderAll();
});

//When releasing mouse button
canvas.on('mouse:up', function (options) {
    isDown = false;
    if (objectSelected)
        return;

    //Making a copy of drawn line
    var myLine = line;
    line.remove(); //Removing the old line
    //If objectSelected is false, we assume we have drawn a line
    //We don't want to add points, so line width, height or both must be > 0
    if (myLine.width > 0 || myLine.height > 0) {
        myLine.selectable = true;
        myLine.valid = true;
        canvas.add(myLine);
        linesArray.push(myLine);
        saveCanvas();
    }
});

//When mouse is hovering an object
canvas.on('mouse:over', function (options) {
    //if(options.target !== null) hoverObject = true;
});

//When mouse hovering off an object
canvas.on('mouse:out', function (options) {
    //hoverObject = false; 
});

canvas.on('mouse:scroll', function(options) {
    
});

//When an object is selected
canvas.on('object:selected', function (options) {
    objectSelected = true;
    document.getElementById("selectionMenu").style.display = 'inline';
});

//Selection cleared, or deselected an object
canvas.on('selection:cleared', function (options) {
    objectSelected = false;
    document.getElementById("selectionMenu").style.display = 'none';
    saveCanvas();
});

//When moving an object
// snap to grid function
canvas.on('object:moving', function (options) {
    options.target.set({
        left: Math.round(options.target.left / grid) * grid,
        top: Math.round(options.target.top / grid) * grid
    });
});

/*
 * The reason for seperating the delete function from the onclick
 * is because the function is also used by fabric.js
 * 
 */

deleteSelObject2 = function (obj) {
    for (var i = 0; i < linesArray.length; i++) {
        if (linesArray[i] === obj) {
            linesArray.splice(i, 1);
        }
    }
    canvas.remove(obj);
};
//Delete object function
deleteSelObject = function () {
    //Check to see if we have selected multiple objects
    if (canvas.getActiveGroup()) {
        var myGroup = canvas.getActiveGroup()._objects;
        for (var i = 0; i < myGroup.length; i++) {
            deleteSelObject2(myGroup[i]);
        }
        canvas.discardActiveGroup();
        canvas.renderAll();
    } else {
        var obj = canvas.getActiveObject();
        deleteSelObject2(obj);
    }
    saveCanvas();
};
deleteButton.onclick = deleteSelObject;

//Save canvas function
function saveCanvas() {
    try {
        localStorage.setItem("myCanvas", JSON.stringify(canvas));
        localStorage.setItem("myLines", JSON.stringify(linesArray));
        findCenterPoint();
    }
    catch (e) {
        console.log("Storage failed: " + e);
    }
}
;

//Load canvas function
function loadCanvas() {
    //Get json
    var json = JSON.parse(localStorage.getItem('myCanvas'));

    //Go through JSON
    //If color is #ccc, that is the grid, must not be selectable
    canvas.loadFromJSON(json, canvas.renderAll.bind(canvas), function (o, object) {
        if (object.selectable === true) {
            linesArray.push(object);
        }
    });
}
;

function clearCanvas() {
    canvas.clear();
    linesArray = [];
    drawGrid();
    saveCanvas();
}

clearButton.onclick = function () {
    var answer = confirm("Er du sikker?");
    if (answer) {
        clearCanvas();
    }
    ;
};

updateButton.onclick = function () {
    var selector = document.getElementById("select-material");
    var newMat = selector.options[selector.selectedIndex].value;
    var color;
    switch (newMat) {
        case 'gips':
            color = 'black';
            break;
        case 'tre':
            color = 'brown';
            break;
        case 'betong':
            color = 'gray';
            break;
        case 'glass':
            color = 'blue';
            break;
        default:
            color = 'black';
            break;
    }
    if (canvas.getActiveObject()) {
        var obj = canvas.getActiveObject();
        obj.set({
            material: newMat,
            stroke: color
        });
        canvas.renderAll();
    }
};

function findCenterPoint() {
    var cL, cR, cT, cB;
    if (linesArray !== "") {
        var line = linesArray[0];
        cL = line.left;
        cR = line.left + line.width;
        cT = line.top;
        cB = line.top + line.height;

        for (var i = 0; i < linesArray.length; i++) {
            var line = linesArray[i];

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
        var centerX = (cR + cL) / 2;
        var centerY = (cB + cT) / 2;
        var centerPoint = new fabric.Point(centerX, centerY);
        localStorage.setItem('centerPoint', JSON.stringify(centerPoint));
    }
}
;