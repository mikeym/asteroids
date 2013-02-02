// Asteroids basic scenes test script
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
        '../scripts/ngine.scenes.js'

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
        asteroids.Ngine.includeModule('Sprites, Input, Scenes');

        // Create the canvas
        asteroids.Ngine.setupCanvas('gamecanvas', {desiredWidth : 640, desiredHeight : 480});

        // Hook up the keyboard event handling
        asteroids.Ngine.input.keyboardControls();

        ///////////////// testing little spaceship ////////////////

        // Androids test ship
        asteroids.Ngine.Ship = Ngine.Sprite.extend({

          // Initialize the ship, placing it in the center of the canvas
          init: function() {
            this._super({
              sheetName : 'ship',
              x : 288, // centered = 320 - 1/2 width of the sprite
              y : 208,
              thrusting: false,
              firing: false,
              rotatingLeft: false,
              rotatingRight: false
            });
            var ani = asteroids.Ngine.input;
            ani.bind('thruster', this, 'thrusterOn');
            ani.bind('thrusterUp', this, 'thrusterOff');
            ani.bind('fire', this, 'fireOn');
            ani.bind('fireUp', this, 'fireOff');
            ani.bind('left', this, 'rotateLeftOn');
            ani.bind('leftUp', this, 'rotateLeftOff');
            console.log('Ship Created');
          },

          step: function(dt) {
            this._super(dt);
          },

          thrusterOn: function() {
            this.thrusting = true;
            this.properties.frame = 5;
            this.properties.y -= 5; // TODO Physics
          },

          thrusterOff: function() {
            this.thrusting = false;
            this.properties.frame = 0;
          },

          fire: function() {
            this.firing = true;
            // TODO something something something...
          },

          fireOff: function() {
            this.firing = false;
          },

          rotateLeftOn: function() {
            this.rotatingLeft = true;
            this.properties.angle -= 5; // TODO
          },

          rotateLeftOff: function() {
            this.rotatingLeft = false;
          },

          rotateRightOn: function() {
            this.rotatingRight = true;
            this.properties.angle += 5; // TODO
          },

          rotateRightOff: function() {
            this.rotatingRight = false;
          }
        }); // Ship

        // Load the game sprites and data, then fire the test function
        asteroids.Ngine.load(['asteroids-game-sprites.png', 'asteroids-game-sprites.json'],
          TestScenes);

      }
    }
  ]);
})();

function TestScenes () {

  var n = Ngine.getInstance(),
      ctx = n.getCanvasCtx(),
      shipSheet,
      shipScene;

  // Load the sprites and generate them. We're only interested in the ship right now.
  console.log('compiling spritesheet...');
  n.compileSheets('asteroids-game-sprites.png', 'asteroids-game-sprites.json');
  shipSheet = n.getSpritesheet('ship');

  // Insert the Ship sprite into the stage
  console.log('adding new ship to stage generator...')

  // Create a scene for testing
  console.log('creating scene for testing...')
  shipScene = new Ngine.Scene(function(stage) {
    stage.insert(new n.Ship());
  });

  // Add the scene, creating a stage
  console.log('creating a stage by adding the ship scene...')
  n.addScene('game', shipScene);

  // Add the stage to be updated and rendered
  console.log('staging the scene...')
  n.stageScene('game');
};

