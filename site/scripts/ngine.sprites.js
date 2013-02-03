// Ngine sprites handling
// Mikey Micheletti
// Version 0.1
// relies on ngine.js, jquery.js, underscore.js
// Builds on work by Pascal Rettig and Tom O'Connor, thank you!

'use strict';

var Ngine = Ngine || { };

// Centralized sprites management, we'll add more to it below.
Ngine.Sprites = function() {
  var SpriteDefaultProperties; // default sprite props, declared below

  // Spritesheet class
  //
  // Represents a set of identically-sized frames of the same sprite.
  // Used to draw a specific frame at an x/y location on the canvas.
  // Frames for each sprite are expected to be in a single row.
  // Requires:
  //    name - a resource name, how the sprites reference a spritesheet
  //    assetName - image asset name
  //    width - of the sprite block
  //    height - of the sprite block
  //    tilew - width of a tile in the sprite
  //    tileh - height of a tile in the sprite
  //    sx  - start x position
  //    sy  - start y position
  //    cols - number of columns per row
  Ngine.Spritesheet = Class.extend({
    name: 'Spritesheet',

    // Constructor
    init: function(name, assetName, options) {
      var defaultProperties,
          asset;

      this.ngine = Ngine.getInstance();

      defaultProperties = {
        name: name,
        assetName: assetName,
        width: this.ngine.getAsset(assetName).width,
        height: this.ngine.getAsset(assetName).height,
        tilew: 64, // overrideable defaults
        tileh: 64,
        sx: 0,
        sy: 0
      };
      _.extend(this, defaultProperties, options);
      this.cols = this.cols || Math.floor(this.w / this.tilew);
    },

    // Calculates the frame x position within an image asset
    frameX: function(frame) {
      return (frame % this.cols) * this.tilew + this.sx;
    },

    // Calculates the frame y position within an image asset
    frameY: function(frame) {
      return Math.floor(frame / this.cols) * this.tileh + this.sy;
    },

    // Draws a specific frame of the sprite sheet at the supplied x and y locations
    // and canvas render context.
    draw: function(ctx, x, y, frame, width, height, angle, alpha) {
      var asset,
          sx,
          sy;

      if (!ctx) {
        ctx = this.ngine.getCanvasCtx();
      }

      if (ctx === undefined) { return; }

      asset = this.ngine.getAsset(this.assetName);
      sx = this.frameX(frame); // set clipping region
      sy = this.frameY(frame);
      ctx.drawImage(asset,
                    sx,
                    sy,
                    this.tilew,
                    this.tileh,
                    x,
                    y,
                    width,
                    height,
                    angle,
                    alpha);
    }

  }); // Spritesheet

  // SpriteDefaultProperties, associated with the Sprites object.

  // SpriteDefaultProperties, will act as a constructor
  SpriteDefaultProperties = function() {
    this.x = 0;             // sprite's center x position
    this.y = 0;             // sprite's center y position
    this.z = 0;             // sprite's z-index sort order
    this.angle = 0;         // sprite's angle
    this.frame = 0;         // frame of the sprite if from a spritesheet
    this.alpha = 1;         // alpha channel opacity of the sprite
    this.isVisible = true;  // visibility of the sprite
    this.scale = 1;         // scale of the sprite
                            // Need to include one of these:
    this.assetName = null;  // an image asset to use [OR]
    this.sheetName = null;  // a sprite name to use from a loaded sprite sheet

    // The SpriteDefaultProperties will also gain these properties when constructed:
    // id - unique id, may be supplied or generated
    // width - may be supplied or computed from the sprite's asset or sheet
    // height - as above
  };

  SpriteDefaultProperties.prototype = {
    constructor: SpriteDefaultProperties
  };

  // On initializing the SpriteDefaultProperties, generate a unique Id for the sprite
  // and either use the supplied height and width or compute them from the sprite's assets or sheet.
  SpriteDefaultProperties.prototype.initialize = function() {
    this.id = this.id || _.uniqueId();

    if((!this.width) || (!this.height)) {
      if (this.assetName) {
        this.width = this.width || this.getAsset().width;
        this.height = this.height || this.getAsset().height;
      } else if (this.sheetName) {
        this.width = this.width || this.getSheet().tilew;
        this.height = this.height || this.getSheet().tileh;
      }
    }

    // TODO if needed, repeat option...
  };

  // Gets the image asset associated with this sprite, or null if undefined
  SpriteDefaultProperties.prototype.getAsset = function() {
    return Ngine.getInstance().getAsset(this.assetName) || null;
  };

  // Gets the spritesheet associated with this sprite, or null if undefined
  SpriteDefaultProperties.prototype.getSheet = function() {
    return Ngine.getInstance().getSpritesheet(this.sheetName) || null;
  };

  // Draws a sprite on the supplied canvas context. Triggers a draw event.
  SpriteDefaultProperties.prototype.draw = function( ctx, posX, posY, angle) {
    var width,
        height;

    if (this.isVisible === false) { return; }

    posX = (posX !== undefined) ? posX : this.x;
    posY = (posY !== undefined) ? posY : this.y;
    angle = (angle !== undefined) ? angle : this.angle;
    width = this.width * this.scale;
    height = this.height * this.scale;

    if (this.sheetName) {
      this.getSheet().draw(ctx, posX, posY, this.frame, width, height, angle, this.alpha);
    } else if (this.assetName) {
      Ngine.getInstance().drawImage(this.getAsset(), posX, posY, width, height, angle, this.alpha);
    } else if (Ngine.options.debug) {
      console.log('Unable to draw sprite without sheet or asset.');
    }
  }; // end of SpriteDefaultProperties

  // A Sprite as a component
  Ngine.SpriteComponent = {
    name: 'SpriteComponent',
    defaults: new SpriteDefaultProperties(),

    // Extend the SpriteComponent with the default properties, and associate the draw event
    added: function(props) {
      this.properties.initialize();
      this.entity.bind('draw', this, 'draw');
    },

    // Draw the sprite on the supplied canvas context using current properties
    draw: function(ctx) {
      var p = this.properties,
          pos = this.entity.transformLocalPosition(p.x, p.y),
          angle = this.entity.properties.angle + p.angle;
      this.properties.draw(ctx, pos.x, pos.y, angle);
    }
  }; // end SpriteComponent

  // A Sprite
  // Builds on SpriteDefaultProperties and SpriteComponent
  Ngine.Sprite = Ngine.Entity.extend({
    name: 'Sprite',
    defaults: new SpriteDefaultProperties(),

    // Extend the Sprite with the supplied properties when created
    init: function(props) {
      this._super(props);
      this.properties.initialize();
    },

    // Draw the sprite, see SpriteComponent.draw
    draw: function(ctx) {
      this.properties.draw(ctx);
      this.trigger('draw', ctx);
    },

    // Triggers a step event for any listening components
    step: function(dt) {
      this.trigger('step', dt);
    }
  }); // end Sprite

  // Sprites continued...
  this.sheets = { };
  this.registerComponent('sprite', Ngine.SpriteComponent);

  Ngine.prototype.loadSpritesheet = function(name, assetName, options) {
    this.sheets[name] = new Ngine.Spritesheet(name, assetName, options);
  };

  Ngine.prototype.getSpritesheet = function(name) {
    return this.sheets[name];
  };

  Ngine.prototype.compileSheets = function(imageAsset, spriteDataAsset) {
    var ngine = this,
        data = ngine.getAsset(spriteDataAsset);
    _(data).each(function(spriteData, name) {
      ngine.loadSpritesheet(name, imageAsset, spriteData);
    });
  };

  return this;

}; // end Sprites
