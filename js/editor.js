/**
 * 
 * @type fabric.Canvas
 * @description Javascript code for the editor
 * @author Oeyvind Blaauw & Frederik Borgersen
 * @copy Oeyvind Blaauw & Frederik Borgersen - 2015
 * @version 1.0
 */

//Declaring and initializing variables

//Canvas objects
var canvas = new fabric.Canvas('canvas', {selection: false, width: this.width, height: this.height, targetFindTolerance: 5}),
gridCanvas = new fabric.Canvas('gridCanvas', {selection: false, width: 1500, height: 1000}),
ghostCanvas = new fabric.Canvas('ghostCanvas', {selection: false, width: 1500, height: 1000});

//Buttons
var deleteButton = document.getElementById('btn-delete'),
clearAllButton = document.getElementById('btn-clear-all'),
selectionButton = document.getElementById('btn-mode-selection'),
drawButton = document.getElementById('btn-mode-draw'),
floorButton1 = document.getElementById('btn-floor-1'),
floorButton2 = document.getElementById('btn-floor-2'),
floorButton3 = document.getElementById('btn-floor-3'),
floorButton4 = document.getElementById('btn-floor-4'),
addFloorButton = document.getElementById('btn-floor-add'),
deleteFloorButton = document.getElementById('btn-delete-floor'),
matDrywallButton = document.getElementById('btn-mat-drywall'),
matConcreteButton = document.getElementById('btn-mat-concrete'),
matWoodButton = document.getElementById('btn-mat-wood'),
matGlassButton = document.getElementById('btn-mat-glass');

/**
 * Width of canvas
 * @type @exp;canvas@pro;width
 */
var width = canvas.width;

/**
 * Height of canvas
 * @type @exp;canvas@pro;height
 */
var height = canvas.height;

/**
 * Grid size in pixels
 * @type Number
 */
var grid = 50;

/**
 * Set to true when an object is selected
 * @type Boolean|Boolean|Boolean
 */
var objectSelected = false;

/**
 * Reference to the floor number of current view
 * Possible values are 1-4
 * @type Number|i|@exp;currentFloors|floor
 */
var floorNumber = 1;

/**
 * Reference to the number of floors that have been created.
 * Saved to local storage on saveCanvas();
 * @type Number|@exp;JSON@call;parse|Number
 */
var currentFloors = 1;

/**
 * The maximum number of allowed floors.
 * @type Number
 */
var maxFloor = 4;

/**
 * Boolean that represents that the left mouse button
 * is pressed down.
 * @type Boolean|Boolean|Boolean
 */
var isDown = false;

/**
 * Boolean that helps the delete-line-function
 * If deletePermitted is true, a line is allowed to be deleted
 * @type Boolean|Boolean|Boolean
 */
var deletePermitted = false;

/**
 * Line to be added and modified when drawing
 * @type fabric.Line
 */
var line = null;

/*
 * Functions
 * 
 */

// Initializing functions
init();


//Run the initializing here
function init() {
    
    // Sets the button for drawing mode to green/success
    drawButton.setAttribute('class', 'btn btn-success');
    
    // Sets the button for selectiion mode to gray/default
    selectionButton.setAttribute('class', 'btn btn-default');
    
    drawGrid();
    
    loadFloorButtons();
    
    loadCanvas();
}

/**
 * Function for drawing a non-selectable grid, added to a grid-canvas
 * 
 */
function drawGrid() {
    
    // Default grid options
    var gridOptions = {
        stroke: '#ccc',
        strokeWidth: 1,
        selectable: false,
        evented: false
    };
    
    // Grid options with thicker lines. Used in grid corner to display (1x1) meters.
    var gridOptionsBold = {
        stroke: '#000',
        strokeWidth: 3,
        selectable: false,
        evented: false,
        strokeLineCap: 'square'
    };
    
    // Creates the grid and adds the lines to the grid canvas
    for (var i = 0; i < (width / grid); i++) {
        gridCanvas.add(new fabric.Line([i * grid, 0, i * grid, height], gridOptions));
        gridCanvas.add(new fabric.Line([0, i * grid, width, i * grid], gridOptions));
    }
    
    // Creates two thicker lines, added to the top-left corner
    gridCanvas.add(new fabric.Line([0,0,48,0], gridOptionsBold));
    gridCanvas.add(new fabric.Line([0,0,0,48], gridOptionsBold));
    
    // Adds the text "1x1 m" to the top-left corner
    var text = new fabric.Text('1x1 m', { left: 3, top: 3, fontSize: 17 });
    
    // Adds the text to the grid canvas
    gridCanvas.add(text);
    
};


/**
 * Event listener for clicking the left mouse button
 * Function: Drawing a line
 */
canvas.on('mouse:down', function (options) {

    // Return if canvas.selection is true. This equals selection mode, and not drawing mode.
    if (canvas.selection)
        return;

    // Return if an object is selected
    if (objectSelected)
        return;

    /** Creating a line **/
    
    isDown = true;
    
    // Mouse pointer object that containes coordinates of mouse pointer
    var pointer = canvas.getPointer(options.e);
    
    // X-coordinates of mouse pointer object, rounded to grid size
    var pointX = Math.round(pointer.x / grid) * grid;
    
    // Y-coordinates of mouse pointer object, rounded to grid size
    var pointY = Math.round(pointer.y / grid) * grid;
    
    // Creating a temporary line from (x,y) to (x,y) - (single point)
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
        visible: true,
        padding: 10,
        material: 'drywall',
        floorNumber: floorNumber
    });
    
    // Adds the line to the canvas object
    canvas.add(line);
    
});


/**
 * Event listener for moving the mouse
 * Function: Updates the coordinates of the endpoint of the drawn line
 */
canvas.on('mouse:move', function (options) {
    
    // Return if the left mouse button is not pressed down, or if an object is selected
    if (!isDown || objectSelected) {
        return;
    }
    
    // Mouse pointer object that containes coordinates of mouse pointer
    var pointer = canvas.getPointer(options.e);
    
    // Updates the endpoint coordinates of the drawn line, rounded to grid size
    line.set({
        x2: Math.round(pointer.x / grid) * grid, 
        y2: Math.round(pointer.y / grid) * grid
    });
    
    // Renders the canvas scene
    canvas.renderAll();
    
});

/**
 * Event listener for releasing the left mouse button
 * Function: Adds the final line to the canvas
 */
canvas.on('mouse:up', function () {
    
    isDown = false;
    
    // Return if canvas.selection is true. This equals selection mode, and not drawing mode.
    if (canvas.selection)
        return;

    // Return if an object is selected
    if (objectSelected)
        return;
    
    /** At this point, the line is already added to the canvas, but with the wrong endpoint coordinates.
        In order to fix this, add a copy of the line, and remove the old one. **/
    
    
    // Creates a copy of the drawn line
    var myLine = line;
    
    // Removing the old line from the canvas. 
    line.remove();

    // Checking if line width, height or both > 0, avoids adding single points to the canvas
    if (myLine.width > 0 || myLine.height > 0) {
        myLine.selectable = true;
        
        // Adds the new copy to the canvas, and saves the canvas
        canvas.add(myLine);
        saveCanvas();
    }
    
});


/** 
 * Event listener for selecting an object.
 * Function: Activates a menu for wall options,
 * and allows the line to be deleted after 500 ms.
 */
canvas.on('object:selected', function () {
    
    // Object is selected
    objectSelected = true;
    
    // Object deletion deactivated
    deletePermitted = false;
    
    // Displays the selection menu for wall options
    document.getElementById("selectionMenu").style.display = 'inline';
    
    /** Only after 500ms we allow an object to be deleted.
        This is to prevent automatic deletion if pressing the delete icon when selecting the line **/
    setTimeout(function() {
        deletePermitted = true;
    }, 500);
    
    // Loads the material buttons
    loadMaterialButtons();
    
});


/**
 * Event listener for clearing an object-selection
 * Function: Hides the selection menu for wall options
 */
canvas.on('selection:cleared', function () {
    
    // Object is no longer selected
    objectSelected = false;
    
    // Object deletion deactivated
    deletePermitted = false;
    
    // Hides the selection menu
    document.getElementById("selectionMenu").style.display = 'none';
    
});

//Event listener for modifying an object, i.e. moving it. Save when stopped.

/**
 * Event listener for object modification
 * Function: Saves the canvas
 */
canvas.on('object:modified', function() {
    
    // If an object is modified, i.e. moved, the canvas is saved afterwards
    saveCanvas(); 
    
});

/**
 * Event listener for moving an object
 * Function: Snaps an object to the grid
 * @param {type} options referes to the mouse-pointer object options
 */
canvas.on('object:moving', function (options) {
    /**
     * This function snaps an object to the grid when moving it.
     * When multiple objects have been selected, the canvas groups all of the objects
     * inside a box with a padding, which is subtracted in the code below.
     * There is an error when trying to move several selected objects:
     * When multiple objects are moved twice in a row, without clearing the selection, the group will be misaligned with the grid.
     * 
     **/

    var padding = 0;
    
    // Check if multiple objects are selected
    if (canvas.getActiveGroup())
        padding = 10;
    
    options.target.set({
        left: (Math.round(options.target.left / grid) * grid) - padding,
        top: (Math.round(options.target.top / grid) * grid) - padding
    });
});


/**
 * Function: Deletes a selected object or group of selected objects
 * 
 */
function deleteSelObject() {

    // Check if deletion is permitted
    if (!deletePermitted)
        return;

    // Check if multiple objects are selected
    if (canvas.getActiveGroup()) {
        
        // Deletes each object in group
        canvas.getActiveGroup().forEachObject(function (o) {
            canvas.remove(o);
        });
        
        // Discards te selection
        canvas.discardActiveGroup().renderAll();
    } else {
        // Deletes the only selected object, and render canvas.
        canvas.remove(canvas.getActiveObject());
        canvas.renderAll();
    }

    // Saves the canvas
    saveCanvas();
};


/**
 * Function for saving the canvas to the browser's local storage
 *
 */
function saveCanvas() {
    
    try {
        var floorID = "myFloor" + floorNumber;
        localStorage.setItem(floorID, JSON.stringify(canvas));
    }
    catch (e) {
        console.log("Storage failed: " + e);
    }
};

/**
 * Function for loading the canvas from the browser's local storage
 * 
 */
function loadCanvas() {

    // Sets the JSON string based on the current floor viewed.
    var floorID = "myFloor" + floorNumber;

    // Parses the JSON string into an JSON Object
    var json = JSON.parse(localStorage.getItem(floorID));

    // Return if there is no saved canvas data
    if (json === null) {

        // Clears the canvas
        clearCanvas();

        // Reruns the load function
        loadCanvas();
        return;
    }
    
    // If the floor number is higher than 1, load a ghost canvas, i.e. the floor below 
    if (floorNumber > 1) {
        
        // Sets the JSON string based on the floor below the current floor viewed.
        var ghostNumber = "myFloor" + (floorNumber - 1);
        
        // Parses the JSON string into an JSON Object
        var ghostJSON = JSON.parse(localStorage.getItem(ghostNumber));
        
        // Loads the canvas from the JSON Object
        ghostCanvas.loadFromJSON(ghostJSON, ghostCanvas.renderAll.bind(ghostCanvas), function (o, object) {
            object.set({
                stroke: 'rgba(255,100,100, 0.40)'
            });
        });
    } else {
        // Clearing the ghost canvas 
        ghostCanvas.clear();
    }

    // Load current floor from localStorage
    canvas.loadFromJSON(json, canvas.renderAll.bind(canvas));
    
}


/**
 * Function that clears the canvas on the current floor viewed
 * 
 */
function clearCanvas() {
    
    // Clears the canvas
    canvas.clear();
    
    // If the floor number is 1, clear the ghost canvas as well
    if(floorNumber === 1) 
        ghostCanvas.clear();
    
    // Saves the canvas
    saveCanvas();
    
};


/**
 * Function for clearing all floors
 * 
 */
function clearAll() {
    
    var c = currentFloors;
    
    // Loops through each floor
    for (var i = 1; i <= c; i++) {
        
        // Sets the current floor number
        floorNumber = i;
        
        // Clears the canvas, based on floor number
        clearCanvas();
        
        // Deletes all floors above 1
        if (floorNumber > 1) {
            deleteFloor();
        }
    }
};

/**
 * Function for deleting a floor
 * 
 */
function deleteFloor() {
    
    // This is a safety feature. The program should never come to this point
    if (currentFloors === 1) {
        alert("Kan ikke slette første etasje!");
    } else {
        
        // Change floorNumber to the last floor (currentFloors)
        floorNumber = currentFloors;
        
        // Load that canvas
        loadCanvas();
        
        // Clear that canvas, which also saves it
        clearCanvas();
        
        // Reduce the number of current floors
        currentFloors--;
        
        // Save this number to localStorage
        localStorage.setItem("currentFloors", currentFloors);
        
        // Refresh the floornumber-menu
        loadFloorButtons();
        
        /** Change view to floor #1
          * Alternative change it to one less than the one removed
          * I.E: Remove floor 4, change to 3, remove floor 3, change to 2, etc **/
        changeFloor(1, true);
    }
};

/*
 * Function for viewing another floor
 * @param {type} floor - This is the floor number we are changing to
 * @param {type} skipCheck - Boolean for skipping check of floorNumber
 */
function changeFloor(floor, skipCheck) {
    
    if(!skipCheck && floor === floorNumber) 
        return;
    
    // Update the floorNumber variable
    floorNumber = floor;
    
    // Load the canvas
    loadCanvas();
}

/** 
 * Function that loads the correct buttons in the floor-buttons-menu
 * @type Function|Function
 */
function loadFloorButtons() {
    
    // Number of floors loaded from local storage
    currentFloors = JSON.parse(localStorage.getItem("currentFloors"));
    
    // If this equals to null, set it to 1
    if(currentFloors === null) {
        currentFloors = 1;
        localStorage.setItem("currentFloors", currentFloors);
    }
    
    // Default viewing. Shows 1" and "Add floor" buttons, hides the others
    document.getElementById('btn-floor-1').style.display = "inline"; 
    document.getElementById('btn-floor-2').style.display = "none"; 
    document.getElementById('btn-floor-3').style.display = "none"; 
    document.getElementById('btn-floor-4').style.display = "none"; 
    document.getElementById('btn-delete-floor').style.display = "none";
    document.getElementById('btn-floor-add').style.display = "inline"; 
    
    // Display the floor buttons, based on how many floors have been created
    if(currentFloors > 1) {
        if(currentFloors > 2) {
            if(currentFloors > 3) {
                document.getElementById('btn-floor-4').style.display = "inline"; 
                document.getElementById('btn-floor-add').style.display = "none"; 
            }
            document.getElementById('btn-floor-3').style.display = "inline";
        }
        document.getElementById('btn-floor-2').style.display = "inline"; 
        document.getElementById('btn-delete-floor').style.display = "inline"; 
    }
};


/**
 * Function for adding a new floor
 * 
 */
function addFloor() {
    
    // Can not exceed the maximum limit 
    if(currentFloors < maxFloor) {
        
        // Increase the current number of floors created
        currentFloors++;
        
        // Creates a floor ID
        var floorId = 'btn-floor-' + currentFloors;
        
        // Display the floor button from that specific floor
        document.getElementById(floorId).style.display = "inline";
        
        // At least two floors is created, so "Remove floor" can be displayed
        deleteFloorButton.style.display = "inline";
        
        // Refresh the currentFloors variable in localStorage
        localStorage.setItem('currentFloors', currentFloors);
        
        // Change the floor view to the last floor (the one recently added)
        changeFloor(currentFloors, true);
    } 
    
    // Remove the "add floor" button, if the maximum number of floors is reached
    if(currentFloors === maxFloor) {
        addFloorButton.style.display = "none";
    }
    
};

/**
 * Adds onclick function to the addFloorButton
 */
addFloorButton.onclick = addFloor;

/**
 * Adds onclick function to the deleteFloorButton
 */
deleteFloorButton.onclick = deleteFloor;

/** Adds onclick function to the 4 floorButtons **/

floorButton1.onclick = function () {
    changeFloor(1, false);
};

floorButton2.onclick = function () {
    changeFloor(2, false);
};

floorButton3.onclick = function () {
    changeFloor(3, false);
};

floorButton4.onclick = function () {
    changeFloor(4, false);
};

/**
 * Adds onclick function to the deleteButton
 */
deleteButton.onclick = deleteSelObject;


/**
 * Adds onclick function the clearAllButton
 */
clearAllButton.onclick = function() {
    
    // Asks the user to confirm
    if (confirm("Er du sikker? Dette vil slette alle etasjer.")) {
        clearAll();
    }
    
};

/**
 * Function for loading the material buttons
 * Sets the button for the chosen material of a wall, to green.
 * The other buttons are set to a default, gray color
 */
function loadMaterialButtons() {

    // The selected, active object
    var obj = canvas.getActiveObject();
    
    // If an object is selected, update the buttons
    if (obj) {
        
        // Sets all the buttons to default/gray
        matConcreteButton.setAttribute('class', 'btn btn-default');
        matDrywallButton.setAttribute('class', 'btn btn-default');
        matGlassButton.setAttribute('class', 'btn btn-default');
        matWoodButton.setAttribute('class', 'btn btn-default');
        
        var buttons = [matDrywallButton, matConcreteButton, matWoodButton, matGlassButton];
        var buttonPosition;
        
        // Checks which material the object contains
        switch (obj.material) {
            case 'drywall':
                buttonPosition = 0;
                break;
            case 'concrete':
                buttonPosition = 1;
                break;
            case 'wood':
                buttonPosition = 2;
                break;
            case 'glass':
                buttonPosition = 3;
                break;
            default:
                buttonPosition = 0;
                break;
        }
        
        // Updates the correct material button to green/success
        buttons[buttonPosition].setAttribute('class', 'btn btn-success');
    }
};

/**
 * 
 * @param {type} material
 * @param {type} color
 * @returns {undefined}
 */
function updateMaterial(material, color) {
    
    // Sets the buttons class to default/gray
    matConcreteButton.setAttribute('class', 'btn btn-default');
    matDrywallButton.setAttribute('class', 'btn btn-default');
    matGlassButton.setAttribute('class', 'btn btn-default');
    matWoodButton.setAttribute('class', 'btn btn-default');
    
    // Sets the material and color of group of objects, if selected
    if (canvas.getActiveGroup()) {
        var myGroup = canvas.getActiveGroup()._objects;
        for (var i = 0; i < myGroup.length; i++) {
            myGroup[i].set({
                material: material,
                stroke: color
            });
        }

    } 
    // Else, sets the material and color of one selected object
    else {
        var obj = canvas.getActiveObject();
        obj.set({material: material, stroke: color});
    }
    
    // Render canvas and save
    canvas.renderAll();
    saveCanvas();  
}

/**
 * Adds onclick function to the material concrete button
 */
matConcreteButton.onclick = function() {
    
    updateMaterial('concrete', 'gray');
    this.setAttribute('class', 'btn btn-success');
    
};

/**
 * Adds onclick function to the material drywall button
 */

matDrywallButton.onclick = function() {
    updateMaterial('drywall', 'black');
    this.setAttribute('class', 'btn btn-success');
    
};

/**
 * Adds onclick function to the material glass button
 */
matGlassButton.onclick = function() {
    
    updateMaterial('glass', 'blue');
    this.setAttribute('class', 'btn btn-success');
    
};

/**
 * Adds onclick function to the material wood button
 */
matWoodButton.onclick = function() {
    
    updateMaterial('wood', 'brown');
    this.setAttribute('class', 'btn btn-success');
    
};

/**
 * Adds onclick function to the selection-mode-button
 */
selectionButton.onclick = function () {
    
    // If the current class is default/gray
    if(selectionButton.getAttribute('class') === 'btn btn-default') {
        
        // Set the selcection button to success/green
        selectionButton.setAttribute('class', 'btn btn-success');
        
        // Set the draw button class to default/gray
        drawButton.setAttribute('class', 'btn btn-default');
        
        // Activate selection mode
        canvas.selection = true;
    }
    
};

/**
 * Adds onclick function to the draw-mode-button
 */
drawButton.onclick = function () {
    
    // If the current class is default/gray
    if(drawButton.getAttribute('class') === 'btn btn-default') {
        
        // Set the draw-mode button to success/green
        drawButton.setAttribute('class', 'btn btn-success');
        
        // Set the selection button to default/gray
        selectionButton.setAttribute('class', 'btn btn-default');
        
        // Deactivate selection mode
        canvas.selection = false;
    }
    
};

/** Overwritten functions from Fabric.js 
 *  Refere to the original functions in fabric.js for full explanation **/

/*
 * 
 * @type Function|Function
 * @changes: Added properties to be sent to JSON when calling JSON.stringify(object)
 */
fabric.Object.prototype.toObject = (function (toObject) {
    return function () {
        return fabric.util.object.extend(toObject.call(this), {
            material: this.material,
            selectable: this.selectable,
            lockScalingX: this.lockScalingX,
            lockScalingY: this.lockScalingY,
            lockUniScaling: this.lockUniScaling,
            lockScalingFlip: this.lockScalingFlip,
            hasControls: this.hasControls,
            perPixelTargetFind: this.perPixelTargetFind,
            padding: this.padding,
            floorNumber: this.floorNumber
        });
    };
})(fabric.Object.prototype.toObject);

/*
 * 
 * @param {type} ctx
 * @returns {fabric.Object.prototype}
 * @changes:
 * - For now: excluding all other corner controls, and
 * - adds "corner" in the middle of the object (calls private method)
 */
fabric.Object.prototype.drawControls = function (ctx) {
    
    if (!this.hasControls) {
        return this;
    }

    var wh = this._calculateCurrentDimensions(true),
            width = wh.x,
            height = wh.y,
            left = -(width / 2),
            top = -(height / 2),
            scaleOffset = this.cornerSize / 2,
            methodName = this.transparentCorners ? 'strokeRect' : 'fillRect';

    ctx.save();

    ctx.lineWidth = 1;

    ctx.globalAlpha = this.isMoving ? this.borderOpacityWhenMoving : 1;
    ctx.strokeStyle = ctx.fillStyle = this.cornerColor;

    /**
     * Future controls to be added here
     **/

    // Modified to add a drawing-image in the middle (mm)
    this._drawControl('mm', ctx, methodName,
            left + width/2 - scaleOffset,
            top + height/2 - scaleOffset);
    ctx.restore();

    return this;
};

/*
 * 
 * @param {type} control
 * @param {type} ctx
 * @param {type} methodName
 * @param {type} left
 * @param {type} top
 * @returns {undefined}
 * @changes:
 * - Adds a remove-icon in the middle of a selected object
 */
fabric.Object.prototype._drawControl = function (control, ctx, methodName, left, top) {
    
    var size = this.cornerSize;
    var SelectedIconImage = new Image();
    SelectedIconImage.src = "img/delete.png";
    
    if (this.isControlVisible(control)) {
        this.transparentCorners || ctx.clearRect(left, top, size, size);
        
        switch (control) {
            case 'mm':
                size = 20, 
                        left -= (size-this.cornerSize)/2, 
                        top  -= (size-this.cornerSize)/2;
                ctx.drawImage(SelectedIconImage, left, top, size, size);
                break;
            default:
                ctx[methodName](left, top, size, size);
                return;
        }
    }
};

/*
 * 
 * @param {type} options
 * @returns {fabric.Object._controlsVisibility}
 * @changes: 
 * - Sets the mtr (middle-top-rotation) to false, to avoid viewing the rotation line
 * - Adds the middle-middle control to be visible (the delete icon)
 */
fabric.Object.prototype._getControlsVisibility = function(options) {
    if (!this._controlsVisibility) {
        this._controlsVisibility = {
          tl: true,
          tr: true,
          br: true,
          bl: true,
          ml: true,
          mt: true,
          mr: true,
          mb: true,
          mtr: false,
          mm: true
        };
      }
      return this._controlsVisibility;
};

/*
 * 
 * @param {type} target
 * @param {type} corner
 * @returns {String|fabric.util@call;createClass.prototype._getActionFromCorner.action}
 * @changes: If pressed on corner "mm", set the action to delete
 */
fabric.Canvas.prototype._getActionFromCorner = function (target, corner) {
    var action = 'drag';
    if (corner === 'mm') {
        action = 'remove';
    }
    return action;
};