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
var canvas = new fabric.Canvas('canvas', {selection: false, width: this.width, height: this.height, targetFindTolerance: 5});
var linesArray = [];    //Our lines that represents walls
var deleteButton = document.getElementById('btn-delete'),
        clearButton = document.getElementById('btn-clear'),
        updateButton = document.getElementById('btn-update'),
        checkbox = document.getElementById('chk-select');
var width = canvas.width;
var height = canvas.height;
var grid = 50; //Size in px on grid
var objectSelected = false;

// Runs the init function
init();

//Run the initializing functions here
function init() {
    linesArray = [];
    checkbox.checked = false;
    drawGrid();     //drawGrid here will only have affect if there is no canvas in localStorage
    loadCanvas();   //Else it will be overwritten by the load
    console.log(localStorage);
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
            material: 'gips'
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
    isDown = false;
    if (objectSelected)
        return;

    //Making a copy of the drawn line
    var myLine = line;
    //Deleting the old line from the canvas. 
    line.remove();

    //We don't want to add single points, therefor line width, height or both must be > 0
    //in order to be added to the canvas, and the linesArray
    if (myLine.width > 0 || myLine.height > 0) {
        myLine.selectable = true;
        canvas.add(myLine);
        linesArray.push(myLine);
        saveCanvas();
    }
});

//Event listener for hovering an object
canvas.on('mouse:over', function (options) {

});

//Event listener for hovering off an object
canvas.on('mouse:out', function (options) {

});

//Event listener for mouse scrolling
canvas.on('mouse:scroll', function (options) {

});

//Event listener for selecting an object
canvas.on('object:selected', function (options) {
    objectSelected = true;
    document.getElementById("selectionMenu").style.display = 'inline';
});

//Event listener for clearing a selection of an object
canvas.on('selection:cleared', function (options) {
    objectSelected = false;
    document.getElementById("selectionMenu").style.display = 'none';
    saveCanvas();
});

//Event listener for moving an object
canvas.on('object:moving', function (options) {
    /*
     * This function snaps an object to the grid when moving it.
     */
    options.target.set({
        left: Math.round(options.target.left / grid) * grid,
        top: Math.round(options.target.top / grid) * grid
    });
});

/*
 * The reason for seperating the delete function from the onclick
 * is because the function is also used by fabric.js
 * We should try to separate own code from fabric.js with an overwrite method,
 * preferably in an own js file
 */

//Delete one specific object from canvas
deleteObject = function (obj) {
    for (var i = 0; i < linesArray.length; i++) {
        if (linesArray[i] === obj) {
            linesArray.splice(i, 1);
        }
    }
    canvas.remove(obj);
};

//Delete selected item or group of items
deleteSelObject = function () {
    //Check to see if we have selected multiple objects
    if (canvas.getActiveGroup()) {
        var myGroup = canvas.getActiveGroup()._objects;
        for (var i = 0; i < myGroup.length; i++) {
            deleteObject(myGroup[i]);
        }
        canvas.discardActiveGroup();
        
    } else {
        var obj = canvas.getActiveObject();
        deleteObject(obj);
    }
    canvas.renderAll();
    saveCanvas();
};

//Function for saving the canvas to localStorage
function saveCanvas() {
    try {
        findCenterPoint();
        localStorage.setItem("myCanvas", JSON.stringify(canvas));
        localStorage.setItem("myLines", JSON.stringify(linesArray));
    }
    catch (e) {
        console.log("Storage failed: " + e);
    }
};

//Function for loading the canvas from localStorage
function loadCanvas() {
    //Get json from localStorage
    var json = JSON.parse(localStorage.getItem('myCanvas'));
    //Return if there is no saved canvas data
    if(json === null) return;
    //Go through JSON
    //If an object is not selectable, i.e. the grid, we do not want to add it to our linesArray
    canvas.loadFromJSON(json, canvas.renderAll.bind(canvas), function (o, object) {
        if (object.selectable === true) {
            linesArray.push(object);
        }
    });
};

//Function for clearing the canvas
//This needs to be rewritten, maybe using the init() function. Some repeating code
function clearCanvas() {
    canvas.clear();
    linesArray = [];
    drawGrid();
    saveCanvas();
}

/*
 * Onclick functions for buttons
 */

//Adding function to delete button
deleteButton.onclick = deleteSelObject;

//Adding function to clear button
clearButton.onclick = function () {
    var answer = confirm("Er du sikker?");
    if (answer) {
        clearCanvas();
    }
    ;
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
        centerX = (cR + cL) / 2;
        centerY = (cB + cT) / 2;       
    } else {
        centerX = 0, centerY = 0;
    }
    centerPoint = new fabric.Point(centerX, centerY);
    localStorage.setItem('centerPoint', JSON.stringify(centerPoint));
};

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
            padding: this.padding
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
                            
