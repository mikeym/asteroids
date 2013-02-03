// Ngine scenes module
// Mikey Micheletti
// Version 0.1
// relies on ngine.js, jquery.js, underscore.js
// Builds on work by Pascal Rettig and Tom O'Connor, thank you!

'use strict';

var Ngine = Ngine || { };

// Scene class
// Wraps a function that permits passing a stage object, allowing you to swap between two scenes.
Ngine.Scene = Class.extend({
  name: 'Scene',

  init: function(sceneFunction, sceneOptions) {
    this.sceneOptions = sceneOptions || { };
    this.sceneFunction = sceneFunction;
  }
}); // Scene class


// Stage class
// Tracks a list of sprites, which can be updated, stepped through, drawn, and reordered.
Ngine.Stage = Ngine.Entity.extend({
  name: 'Stage',

  // Default properties for this stage
  defaults: {
    sort: false,
    paused: false,
    isVisible: true
  },

  // Constructor for this stage. If a scene is provided, will execute the scene's method.
  init: function(scene) {
    this.scene = scene;
    this.ngine = Ngine.getInstance();

    // Objects are stored in both an array and in a keyed hash object.
    this.items = [ ];
    this.index = { };

    // Queue objects for removal
    this.removeList = [ ];

    this.properties = _(this.defaults).clone();

    // Additional stage properties and overrides may be passed by the scene
    if (scene) {
      _(this.properties).extend(scene.sceneOptions);
      scene.sceneFunction(this);
    }

    // Generate a sort function if not otherwise provided for this stage
    if (this.properties.sort && !_.isFunction(this.properties.sort)) {
      this.properties.sort = function(a, b) {
        return a.properties.z - b.properties.z;
      }
    }
  },

  // Helper for executing functions on the stage's items list.
  each: function(callback) {
    var i, len;
    for (i = 0, len = this.items.length; i < len; i++) {
      callback.call(
        this.items[i], arguments[1], arguments[2] // TODO WHAT DO THESE ARGUMENTS MEAN?
      );
    }
  },

  // Helper for performing operations on the stage's items list.
  eachInvoke: function(functionName) {
    var i, len;
    for (i = 0, len = this.items.length; i < len; i++) {
      this.items[i][functionName].call(
        this.items[i], arguments[1], arguments[2]
      );
    }
  },

  // Returns any items in the stage's list found by the supplied function.
  detect: function(functionName) {
    var i, val, len;
    for (i = 0, val = null, len = this.items.length; i < len; i++) {
      if (functionName.call(
        this.items[i], arguments[1], arguments[2]
      )) {
        return this.items[i];
      }
    }
    return false;
  },

  // Adds the supplied entity to the stage, triggering inserted events.
  insert: function(theItem) {
    this.items.push(theItem);
    theItem.parentStage = this;
    if (theItem.properties) {
      this.index[theItem.properties.id] = theItem;
    }
    this.trigger('inserted', theItem);
    theItem.trigger('inserted', this);
    return theItem;
  },

  // Queues the supplied entity for removal from the stage.
  remove: function(theItem) {
    this.removeList.push(theItem);
  },

  // Stomps the living snot out of the supplied entity, then yanks it off the stage
  // with a shepherd's crook while the audience howls with laughter.
  forceRemove: function(theItem) {
    var itemIndex = _(this.items).indexOf(theItem);
    if (itemIndex != -1) {
      this.items.splice(itemIndex, 1);
      if (theItem.destroy) {
        theItem.destroy();
      }
      if (theItem.properties.id) {
        delete this.index[theItem.properties.id];
      }
      this.trigger('removed', theItem)
    }
  },

  // When the stage is destroyed, remove all objects that are part of it.
  destroy: function() {
    var i, len, theItem;
    for (i = 0, len = this.items.length; i < len; i++) {
      theItem = this.items[i];
      if (theItem.destroy) {
        theItem.destroy();
      }
    }
    this._super();
  },

  // The pause that refreshes
  pause: function() {
    this.paused = true;
  },

  // Get back to work
  unpause: function() {
    this.paused = false;
  },

  // Calls the supplied step function.
  // As a side-effect, removes any objects that have been queued for removal.
  step: function(dt) {
    var i, len;
    if (this.properties.paused) { return false; }

    this.trigger('prestep', dt);
    this.eachInvoke('step', dt);
    this.trigger('step', dt);

    if (this.removeList.length > 0) {
      // TODO: Mikey you might want to loop from the end here to prevent shennanigans
      for (i = 0, len = this.removeList.length; i < len; i++) {
        this.forceRemove(this.removeList[i]);
      }
      this.removeList.length = 0;
    }
  },

  // Sorts items in the stage into the correct order and draws them, firing notification events.
  draw: function(ctx) {
    if (this.properties.sort) {
      this.items.sort(this.properties.sort);
    }

    this.trigger('predraw', ctx);

    if (this.world && this.world.debug_draw) {
      this.world.debug_draw();
    }

    if (this.properties.isVisible) {
      this.eachInvoke('draw', ctx);
      this.trigger('draw', ctx);
    }
    this.trigger('postdraw', ctx);
  },

  // Convenience function used internally to test for an intersection
  hitTest: function(theObject, theType) {
    var collides;
    if (theObject != this) {
      collides =
        (!theType || this.properties.type && theType) && Ngine.overlap(theObject, this);
      return collides ? this : false;
    }
  },

  collide: function (theObject, theType) {
    return this.detect(this.hitTest, theObject, theType);
  }
}); // Stage class

// Scenes represent a collection of individual scenes and stages, with the currently active
// stage indicated.
Ngine.Scenes = function() {
  this.scenes = { };
  this.stages = [ ];
  this.activeStage = 0;
}

// Static Ngine function, detects and returns true if two objects overlap, false otherwise.
Ngine.overlap = function(obj1, obj2) {
  var prop1 = obj1.properties,
      prop2 = obj2.properties;

  // Fail if prop1's left edge is to the right o prop2's right edge
  if ((prop1.x - (prop1.width / 2)) > (prop2.x + (prop2.width / 2))) { return false; }

  // Likewise fail if prop2's right edge is left of prop1's left edge
  if ((prop1.x + (prop1.width / 2)) > (prop2.x - (prop2.width / 2))) { return false; }

  // Fail if prop2's top is below prop2's bottom
  if ((prop1.y + (prop1.height / 2)) > (prop2.y + (prop2.height / 2))) { return false; }

  // Fail if prop1's bottom is above prop2's top
  if ((prop1.y + (prop1.height / 2)) < (prop2.y - (prop2.height / 2))) { return false; }

  // Otherwise there's some overlap
  return true;
};

// Add a new scene to the engine
Ngine.prototype.addScene = function(sceneName, sceneObject) {
  this.scenes[sceneName] = sceneObject;
  return sceneObject;
};

// Gets a scene from the engine by name
Ngine.prototype.getScene = function(sceneName) {
  return this.scenes[sceneName];
};

// Returns a stage by its index in the Ngine's collection, or the currently active
// stage if the stageNumber argument is omitted.
Ngine.prototype.getStage = function(stageNumber) {
  stageNumber = (stageNumber === void 0) ? this.activeStage : stageNumber;
  return this.stages[stageNumber];
};

// Adds a new game stage to be updated and drawn. All arguments are optional.
// sceneName is the scene to be staged
// stageNumber is the stage slot or update order
// stageClass is a child stage class to use
Ngine.prototype.stageScene = function(sceneName, stageNumber, stageClass) {
  var scene;

  // Default stage class if not supplied
  stageClass = stageClass || Ngine.Stage;

  // Default stage number if not supplied
  stageNumber = stageNumber || 0;

  // Scene if supplied
//  if (_(sceneName).isString()) {
  if (sceneName) {
    scene = this.getScene(sceneName);
  }

  // Stomp any stage already at this index to make way for this one
  if (this.stages[stageNumber]) {
    this.stages[stageNumber].destroy();
  }

  // Create, add the new stage
  this.stages[stageNumber] = new stageClass(scene);

  // Check if the game loop has been started. If not, add one that updates the stages.
  if (!this.loop) {
    this.setGameLoop(this.stageGameLoop);
  }
};

// Clears the canvas, updates and draws each stage
Ngine.prototype.stageGameLoop = function(dt) {
  var i, len, stage,
      ctx = Ngine.getInstance().getCanvasCtx();

  if (ctx) {
    this.clearCanvas();
  }

  for (i = 0, len = this.stages.length; i < len; i++) {
    this.activeStage = i;
    stage = this.getStage(); // currently active stage
    if (stage) {
      stage.step(dt);
      if (ctx) {
        stage.draw(ctx);
      }
    }
  }

  this.activeStage = 0;
};

// Destroys the stage at a given slot
Ngine.prototype.clearStage = function(stageNumber) {
  if (this.stages[stageNumber]) {
    this.stages[stageNumber].destroy();
    this.stages[stageNumber] = null;
  }
};

// Destroy all Earthlings! I mean stages!
Ngine.prototype.clearStages = function() {
  var i, len;
  for (i = 0, len = this.stages.length; i < len; i++) {
    if (this.stages[i]) {
      this.stages[i].destroy();
    }
  }
  this.stages.length = 0;
};