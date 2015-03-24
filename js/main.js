/**
 * 
 * @type fabric.Canvas
 * @description Main js file for project
 * @author Øyvind Blaauw & Frederik Borgersen
 * @copy Øyvind Blaauw & Frederik Borgersen 2015
 * @version 1.0
 */

//Declaring and initializing variables
//Perhaps some should go in the init() function
var canvas = new fabric.Canvas('canvas', {selection: false, width: this.width, height: this.height, targetFindTolerance: 5, allowTouchScrolling: true});
var gridCanvas = new fabric.Canvas('gridCanvas', {selection: false, width: 1500, height: 1000});
var ghostCanvas = new fabric.Canvas('ghostCanvas', {selection: false, width: 1500, height: 1000});
var tempArray = [], tempArrayFloorNumber = 1;
var deleteButton = document.getElementById('btn-delete'),
        clearButton = document.getElementById('btn-clear'),
        clearAllButton = document.getElementById('btn-clear-all'),
        updateButton = document.getElementById('btn-update'),
        checkbox = document.getElementById('chk-select'),
        floorButton1 = document.getElementById('btn-floor-1'),
        floorButton2 = document.getElementById('btn-floor-2'),
        floorButton3 = document.getElementById('btn-floor-3'),
        floorButton4 = document.getElementById('btn-floor-4'),
        addFloorButton = document.getElementById('btn-floor-add'),
        deleteFloorButton = document.getElementById('btn-delete-floor');
var width = canvas.width;
var height = canvas.height;
var grid = 50; //Size in px on grid
var objectSelected = false;
var floorNumber; // Possible values are 1 - 4
var currentFloors, maxFloor = 4;
var jsonFloorNumber;
var isDown = false;
var deletePermitted = false;
// Runs the init function
init();

//Run the initializing functions here
function init() {
    checkbox.checked = false;
    floorNumber = 1,
    currentFloors = 1;
    drawGrid();
    loadFloors();
    loadCanvas();   //Else it will be overwritten by the load
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
        gridCanvas.add(new fabric.Line([i * grid, 0, i * grid, height], gridOptions));
        gridCanvas.add(new fabric.Line([0, i * grid, width, i * grid], gridOptions));
    }
};

//Event listener for pressing the mouse button
canvas.on('mouse:down', function (options) {
    /*Return if we are in selection mode, i.e. selecting multiple objects
     * This is true if the checkbox for multiple selection is checked
     * If not in selection mode, check if an object is selected.
     * If we have not selected an object, we are in drawing mode.
     */
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
            visible: true,
            padding: 10,
            material: 'gips',
            floorNumber: floorNumber
        });
        canvas.add(line);
    }
});

//Event listener for moving the mouse
canvas.on('mouse:move', function (options) {
    /*
     * Return if the mouse button isn't pressed down, or if an object is selected.
     * Else: We are drawing a line, and updating its coordinates.
     */
    if (!isDown)
        return;
    if (objectSelected)
        return;

    var pointer = canvas.getPointer(options.e);
    line.set({x2: Math.round(pointer.x / grid) * grid, y2: Math.round(pointer.y / grid) * grid});
    canvas.renderAll();
});

//Event listener for releasing the mouse button
canvas.on('mouse:up', function (options) {
    /*
     * Return if we have selected an object
     * Else: Add the drawn line to the canvas
     */
    if(canvas.selection) return;
    isDown = false;
    if (objectSelected) {
        return;
    }

    //Making a copy of the drawn line
    var myLine = line;
    //Deleting the old line from the canvas. 
    line.remove();

    //We don't want to add single points, therefor line width, height or both must be > 0
    //in order to be added to the canvas.
    if (myLine.width > 0 || myLine.height > 0) {
        myLine.selectable = true;
        canvas.add(myLine);
        saveCanvas();
    }
});

//Event listener for selecting an object
canvas.on('object:selected', function (options) {
    objectSelected = true;
    document.getElementById("selectionMenu").style.display = 'inline';
    setTimeout(function() {
        deletePermitted = true;
    }, 500);
    
});

//Event listener for clearing a selection of an object
canvas.on('selection:cleared', function (options) {
    objectSelected = false;
    deletePermitted = false;
    document.getElementById("selectionMenu").style.display = 'none';
});

//Event listener for modifying an object, i.e. moving it. Save when stopped.
canvas.on('object:modified', function(options) {
   saveCanvas(); 
});

//Event listener for moving an object
canvas.on('object:moving', function (options) {
    /*
     * This function snaps an object to the grid when moving it.
     * When multiple objects have been selected, the canvas groups all of the objects
     * inside a box with a padding, which we subtract in the code below.
     * 
     */var padding=0;
        if(canvas.getActiveGroup()) padding=10;
        console.log(canvas.getActiveGroup());
        options.target.set({
        left: (Math.round(options.target.left / grid) * grid) - padding,
        top: (Math.round(options.target.top / grid) * grid) - padding
    }); 
});

/*
 * The reason for seperating the delete function from the onclick
 * is because the function is also used by fabric.js
 * We should try to separate own code from fabric.js with an overwrite method,
 * preferably in an own js file
 */

//Delete selected item or group of items
/*
 * !!!
 * We currently have a problem with deleting multiple lines from the canvas
 * Look into this when the time is right!
 * 
 */
deleteSelObject = function () {
    //Check if delete is permitted
    if(!deletePermitted) return;
    //Check to see if we have selected multiple objects
    if (canvas.getActiveGroup()) {
        alert("Feil i slettefunksjon");
        canvas.getActiveGroup().forEachObject(function(o) {
            canvas.remove(o);
        });
        canvas.discardActiveGroup().renderAll();
        
    } else {
        canvas.remove(canvas.getActiveObject());
        canvas.renderAll();
    }
    saveCanvas();
};

//Function for saving the canvas to localStorage
function saveCanvas() {
    try {
        jsonFloorNumber = "myFloor" + floorNumber;
        localStorage.setItem(jsonFloorNumber, JSON.stringify(canvas));
    }
    catch (e) {
        console.log("Storage failed: " + e);
    }
};
//Function for loading the canvas from localStorage
function loadCanvas() {
    //Get json from localStorage
    jsonFloorNumber = "myFloor" + floorNumber;
    var json = JSON.parse(localStorage.getItem(jsonFloorNumber));
    //Return if there is no saved canvas data
    if(json === null) {
        console.log(jsonFloorNumber + " had no data. Will now clear canvas and save.");
        clearCanvas();
        loadCanvas();
        return;
    }
    if(floorNumber > 1) {
        var ghostNumber = "myFloor" + (floorNumber-1);
        var ghostJSON = JSON.parse(localStorage.getItem(ghostNumber));
    }
    ghostCanvas.loadFromJSON(ghostJSON, ghostCanvas.renderAll.bind(ghostCanvas), function(o, object) {
        object.set({
            stroke: 'rgba(100,100,255, 0.5'
        });
    });
    //Go through JSON
    canvas.loadFromJSON(json, canvas.renderAll.bind(canvas));  
};

//Function for clearing the canvas
//This needs to be rewritten, maybe using the init() function. Some repeating code
function clearCanvas() {
    canvas.clear();
    if(floorNumber === 1) ghostCanvas.clear();
    saveCanvas();
}

function clearAll() {
    for(var i=1;i<=4;i++) {
        floorNumber = i;
        clearCanvas();
    }
}
/*
 * Onclick functions for buttons
 */


addFloorButton.onclick = function() {
    if(currentFloors < maxFloor) {
        currentFloors++;
        var floorId = 'btn-floor-' + currentFloors;
        document.getElementById(floorId).style.display = "inline";
        deleteFloorButton.style.display = "inline";
        localStorage.setItem('currentFloors', currentFloors);
        changeFloor(currentFloors, true);
    } 
    if(currentFloors === maxFloor) {
        addFloorButton.style.display = "none";
    }
};
deleteFloorButton.onclick = function() {
    saveCanvas();
    if(currentFloors === 1) {
        alert("Kan ikke slette første etasje!");
    } else {
        floorNumber = currentFloors;
        changeFloor(floorNumber, true);
        clearCanvas();
        currentFloors--;
        localStorage.setItem("currentFloors", currentFloors);
        floorNumber = 1;
        loadFloors();
        loadCanvas();
        changeFloor(floorNumber, true);
    }
};

//Adding function to delete button
floorButton1.onclick = function() {
    changeFloor(1, false);
};
floorButton2.onclick = function() {
    changeFloor(2, false);
};
floorButton3.onclick = function() {
    changeFloor(3, false);
};
floorButton4.onclick = function() {
    changeFloor(4, false);
};

function changeFloor(floor, skipCheck) {
    saveCanvas();
    if(!skipCheck && floor === floorNumber) return;
    floorNumber = floor;
    document.getElementById('floor-selected').innerHTML = "Etasje " + floorNumber;
    loadCanvas();
}
function loadFloors() {
    currentFloors = JSON.parse(localStorage.getItem("currentFloors"));
    document.getElementById('btn-floor-1').style.display = "inline"; 
    document.getElementById('btn-floor-2').style.display = "none"; 
    document.getElementById('btn-floor-3').style.display = "none"; 
    document.getElementById('btn-floor-4').style.display = "none"; 
    document.getElementById('btn-delete-floor').style.display = "none";
    document.getElementById('btn-floor-add').style.display = "inline"; 
    
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
deleteButton.onclick = deleteSelObject;

//Adding function to clear button
clearButton.onclick = function () {
    if (confirm("Er du sikker? Dette vil slette alt du har tegnet i denne etasjen.")) {
        clearCanvas();
    }
};
clearAllButton.onclick = function() {
    if (confirm("Er du sikker? Dette vil slette alle etasjer.")) {
        clearAll();
    }
};

//Adding function to update button
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
    /*
     * This is a lot of the same code as the delete function, should be modified/merged in some how
     * Also has some repeating code within itself
     */
    if (canvas.getActiveGroup()) {
        var myGroup = canvas.getActiveGroup()._objects;
        for (var i = 0; i < myGroup.length; i++) {
            myGroup[i].set({
                material: newMat,
                stroke: color
            });
        }

    } else {
        var obj = canvas.getActiveObject();
        obj.set({material: newMat, stroke: color});
    }
    canvas.renderAll();
    saveCanvas();
};

//Activates selection mode when checkbox is checked
checkbox.onchange = function () {
    canvas.selection = checkbox.checked;

};

/*
 * Function for locating the center point in the canvas based on the drawn lines
 * Used for camera positioning in 3D view
 * Perhaps this can be implemented when creating a new line?
 * Problem if we delete a line that is listed as a cL/cR/cT/cB ? 
 * 
 */


/*
 * Here we write some functions that are defined in fabric.js, but we need to 
 * overwrite them so they can be adjusted to satisfy our needs. The reason we
 * overwrite them here, is so that we don't change anything in the core code.
 * 
 */

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
 * - added corner in the middle of the object (calls private method)
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

    /*
     * If we want to add other corner controls in the future, they should
     * be added here, or we could call super.
     */

    //Modified to add a drawing-image in the middle (mm)
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
 * - Added a remove-icon in the middle of the object
 */
fabric.Object.prototype._drawControl = function (control, ctx, methodName, left, top) {
    var size = this.cornerSize;
    var SelectedIconImage = new Image();
    SelectedIconImage.src = "img/images.png";
    
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
 * - Edited the middle-top-rotation line to false/no visibility (to avoid the vertical line)
 * - Added the middle-middle control to be visible (the delete icon)
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
 * @changes:
 * - If pressed on corner "mm", set the action to delete
 * - Should implement to call super if corner is not mm
 */
fabric.Canvas.prototype._getActionFromCorner = function (target, corner) {
    var action = 'drag';
    if (corner === 'mm') {
        action = 'remove';
    }
    return action;
};

/*
fabric.Canvas.prototype._setupCurrentTransform = function (e, target) {
      if (!target) {
        return;
      }

      var pointer = this.getPointer(e),
          corner = target._findTargetCorner(this.getPointer(e, true)),
          action = this._getActionFromCorner(target, corner),
          origin = this._getOriginFromCorner(target, corner);

          //MODIFICATIONS
          if(action === 'remove') {
              deleteSelObject();
          }

      this._currentTransform = {
        target: target,
        action: action,
        scaleX: target.scaleX,
        scaleY: target.scaleY,
        offsetX: pointer.x - target.left,
        offsetY: pointer.y - target.top,
        originX: origin.x,
        originY: origin.y,
        ex: pointer.x,
        ey: pointer.y,
        left: target.left,
        top: target.top,
        theta: degreesToRadians(target.angle),
        width: target.width * target.scaleX,
        mouseXSign: 1,
        mouseYSign: 1
      };

      this._currentTransform.original = {
        left: target.left,
        top: target.top,
        scaleX: target.scaleX,
        scaleY: target.scaleY,
        originX: origin.x,
        originY: origin.y
      };

      this._resetCurrentTransform(e);
};*/
                            
