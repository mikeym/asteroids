// Asteroids basic animations test script
// Version 0.1
// UW Gameplay, Winter Quarter 2013
// Mikey Micheletti
// Requires jquery, underscore.js, and the various Ngine modules

'use strict';

var asteroids = asteroids || {};

asteroids.dbug = true;

asteroids.loader = (function () {
  var that = this;

  if (asteroids.dbug) { console.log('asteroids.loader loaded'); }

  Modernizr.load([
    {
      load: [
        '../scripts/underscore.js',
        '../scripts/plugins.js',

        // the Ngine script load order is significant...
        '../scripts/ngine.js',
        '../scripts/ngine.gameloop.js',
        '../scripts/ngine.evented.js',
        '../scripts/ngine.component.js',
        '../scripts/ngine.entity.js',
        '../scripts/ngine.canvas2d.js',
        '../scripts/ngine.input.js',
        '../scripts/ngine.assets.js',
        '../scripts/ngine.sprites.js',
        '../scripts/ngine.scenes.js',
        '../scripts/ngine.animation.js',

        // physics system
        '../scripts/Box2dWeb-2.1.a.3.min.js'
        // TODO physics module

      ],
      complete: function () {
        if (asteroids.dbug) { console.log('asteroids.loader Modernizr load complete'); }

        // Create Ngine instance, pointing to resource paths
        asteroids.Ngine = new Ngine();
        asteroids.Ngine.options.imagePath = '../images/';
        asteroids.Ngine.options.dataPath = '';
        asteroids.Ngine.options.fontsPath = '../fonts/';

        // Load game assets
        if (asteroids.dbug) { console.log('loading game assets...'); }

        // Hook up the sprites module, and setup a test canvas
        asteroids.Ngine.includeModule('Sprites, Input, Scenes, Animation');

        // Create the canvas
        asteroids.Ngine.setupCanvas('gamecanvas', {desiredWidth : 640, desiredHeight : 480});

        // Hook up the keyboard event handling
        asteroids.Ngine.input.keyboardControls();

        // Load the game sprites and data, then fire the test function
        asteroids.Ngine.load(['asteroids-game-sprites.png', 'asteroids-game-sprites.json'],
          TestAnimations);

      }
    }
  ]);
})();

// Testing asteroids animation
function TestAnimations () {

  var n = Ngine.getInstance(),
    ctx = n.getCanvasCtx(),
    shipScene;

  // The 'ship' sprites in the spritesheet
  asteroids.shipAnimationGroupName = 'ship';

  // Gameplay-specific animations we want to play from the sprites
  asteroids.shipAnimationSequences = {
    stopped: {
      frames: [0],
      rate: 1/5
    },
    thrusting: {
      frames: [5,4],
      rate: 1/5
    },
    shields: {
      frames: [7],
      rate: 1/5
    },
    shieldsAndThrusting: {
      frames: [11],
      rate: 1/5
    }
  };

  // Ship object in the asteroids game, that the player controls
  asteroids.Ship = Ngine.Sprite.extend({
    name: 'Ship',

    // The Ship's properties control animations and appearance
    init: function() {
      this._super({
        sheetName: 'ship',
        animSetName: asteroids.shipAnimationGroupName,
        rate: 1/15,
        speed: 700,
        thrusting: false,
        firing: false,
        rotatingLeft: false,
        rotatingRight: false,
        shieldsOn: false,
        x: 320,
        y: 240,
        angle: 0, // really a radian
        radiansPerRotation: 0.33, // amount to rotate per turn, either direction

        // Our sprites point up. Radians anticipate a rightward orientation.
        // The offset rotates our angle-sensitive thrust support 90 degrees counterclockwise.
        spriteRadianOffset: Math.PI / 2,

        pixelsToMove: 3 // amount to move with thrusters on, may want to have velocity later
      });

      // Add animation capabilities to the ship
      this.addComponent('animation');

      // Connect the ship with keyboard events.
      // The event handlers just set properties.
      asteroids.Ngine.input.bind('thruster', this, 'thrusterOn');
      asteroids.Ngine.input.bind('thrusterUp', this, 'thrusterOff');
      asteroids.Ngine.input.bind('left', this, 'rotateLeftOn'); // TODO
      asteroids.Ngine.input.bind('right', this, 'rotateRightOn'); // TODO
      asteroids.Ngine.input.bind('shield', this, 'shieldOn');
      asteroids.Ngine.input.bind('shieldUp', this, 'shieldOff');
      console.log('Ship Created');
    },

    // Decision-making about which animation to present based on current properties values.
    // Drawing to the canvas is then handed off to the Sprite.
    step: function(dt) {
      var p = this.properties,
          cosOfAngle, // computed when thrusting
          sinOfAngle;

      if (p.thrusting) {
        // Our sprites are drawn pointing straight up, but radians are oriented horizontally,
        // Results will be positive or negative
        cosOfAngle = Math.cos(p.angle - p.spriteRadianOffset); // direction x
        sinOfAngle = Math.sin(p.angle - p.spriteRadianOffset); // direction y

        // Translating forward vector around the radian.
        // Note that 360 degrees = 2 pi radians, 180 = pi, 90 = pi/2
        p.x += p.pixelsToMove * cosOfAngle;
        p.y += p.pixelsToMove * sinOfAngle;

        if (p.shieldsOn) {
          // TODO add a time sustain to shields. Physics?
          this.play('shieldsAndThrusting', 1);
        } else {
          this.play('thrusting', 1);
        }

      } else if (p.shieldsOn) {
        this.play('shields', 1);
      } else {
        this.play('stopped', 1);
      }
      this._super(dt);
    },

    thrusterOn: function() {
      this.properties.thrusting = true;
    },

    thrusterOff: function() {
      this.properties.thrusting = false;
    },

    rotateLeftOn: function() {
      this.properties.angle -= this.properties.radiansPerRotation;
    },

    rotateRightOn: function() {
      this.properties.angle += this.properties.radiansPerRotation;
    },

    shieldOn: function() {
      this.properties.shieldsOn = true;
    },

    shieldOff: function() {
      this.properties.shieldsOn = false;
    }

  }); // Ship

  // Load the sprites and generate them. We're only interested in the ship right now.
  console.log('compiling spritesheet...');
  n.compileSheets('asteroids-game-sprites.png', 'asteroids-game-sprites.json');
  n.addAnimationData(asteroids.shipAnimationGroupName, asteroids.shipAnimationSequences);

  // Insert the Ship sprite into the stage
  console.log('adding new ship to stage generator...')

  // Create a scene for testing
  console.log('creating scene for testing...')
  shipScene = new Ngine.Scene(function(stage) {
    // Generator...
    stage.insert(new asteroids.Ship());
  });

  // Add the scene, creating a stage
  console.log('creating a stage by adding the ship scene...')
  n.addScene('AsteroidsGame', shipScene);

  // Add the stage to be updated and rendered
  console.log('staging the scene...')
  n.stageScene('AsteroidsGame');
};

