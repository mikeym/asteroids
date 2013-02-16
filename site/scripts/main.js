// Asteroids script root and loader
// Version 0.1
// UW Gameplay, Winter Quarter 2013
// Mikey Micheletti
// Requires jquery, underscore.js, and the various Ngine modules

'use strict';

var asteroids = asteroids || {};

asteroids.dbug = true;

asteroids.loader = (function () {
  var that = this,
      a = asteroids,
      resourcesLoaded = 0;

  if (a.dbug) { console.log('asteroids.loader loaded'); }

  // TODO Welcome text
  // TODO loading progress indicator

  Modernizr.load([
    {
      // Load plugin and Ngine scripts
      load: [
        'scripts/underscore-min.js',
        'scripts/plugins.js',
        'scripts/Box2dWeb-2.1.a.3.min.js',
        'scripts/asteroids.starfield.js',   // starfield starts up early

        // the Ngine script load order is significant...
        'scripts/ngine.js',
        'scripts/ngine.gameloop.js',
        'scripts/ngine.evented.js',
        'scripts/ngine.component.js',
        'scripts/ngine.entity.js',
        'scripts/ngine.canvas2d.js',
        'scripts/ngine.input.js',
        'scripts/ngine.assets.js',
        'scripts/ngine.sprites.js',
        'scripts/ngine.scenes.js',
        'scripts/ngine.animation.js',
        'scripts/ngine.physics.js'
      ],

      // When plugin and engine scripts are loaded, setup the Ngine include modules
      complete: function () {
        if (a.dbug) { console.log('asteroids.loader Modernizr load complete'); }

        // Create Ngine instance, pointing to resource paths
        a.Ngine = new Ngine();
        a.Ngine.options.imagePath = 'images/';
        a.Ngine.options.dataPath = 'data/';
        a.Ngine.options.fontsPath = 'fonts/';

        // Load game assets
        if (a.dbug) { console.log('loading game assets...'); }

        // Hook up the sprites module, and setup a test canvas
        a.Ngine.includeModule('Sprites, Input, Scenes, Animation, Physics');

        // Create the canvas
        a.Ngine.setupCanvas('gamecanvas', {desiredWidth : 640, desiredHeight : 480});

        // Hook up the keyboard event handling
        a.Ngine.input.keyboardControls();

        if (a.dbug) { console.log('keyboard controls setup, first loading completed'); }
      }
    },

    {
      // Once plugins and Ngine are loaded, load game components that rely on them
      load: [
        'scripts/asteroids.game.js',
        'scripts/asteroids.ship.js',
        'scripts/asteroids.large-asteroid.js',
        'scripts/asteroids.medium-asteroid.js',
        'scripts/asteroids.small-asteroid.js'
      ],

      // Start the game once they're loaded
      complete: function() {
        if (a.dbug) { console.log('Asteroids game scripts loaded, now loading assets...'); }

        // Load the game sprites and data, then fire the test function
        asteroids.Ngine.load(['asteroids-game-sprites.png', 'asteroids-game-sprites.json'],
          startAsteroidsGame);
      }
    }
  ]);
})();

function startAsteroidsGame() {
  var n = Ngine.getInstance(),
      a = asteroids,
      shipScene;

  // Load the sprites and generate them
  if (a.dbug) { console.log('Compiling Asteroids spritesheet and adding animation data...'); }
  n.compileSheets('asteroids-game-sprites.png', 'asteroids-game-sprites.json');
  n.addAnimationData(a.shipAnimationGroupName, a.shipAnimationSequences);
  n.addAnimationData(a.largeAsteroidAnimationGroupNames[0], a.largeAsteroidAnimationSequences);
  n.addAnimationData(a.largeAsteroidAnimationGroupNames[1], a.largeAsteroidAnimationSequences);
  n.addAnimationData(a.largeAsteroidAnimationGroupNames[2], a.largeAsteroidAnimationSequences);
  n.addAnimationData(a.mediumAsteroidAnimationGroupNames[0], a.mediumAsteroidAnimationSequences);
  n.addAnimationData(a.mediumAsteroidAnimationGroupNames[1], a.mediumAsteroidAnimationSequences);
  n.addAnimationData(a.mediumAsteroidAnimationGroupNames[2], a.mediumAsteroidAnimationSequences);
  n.addAnimationData(a.smallAsteroidAnimationGroupNames[0], a.smallAsteroidAnimationSequences);
  n.addAnimationData(a.smallAsteroidAnimationGroupNames[1], a.smallAsteroidAnimationSequences);
  n.addAnimationData(a.smallAsteroidAnimationGroupNames[2], a.smallAsteroidAnimationSequences);

  // Create a scene for testing
  if (a.dbug) { console.log('Starting the game...'); }

  // Start a new game
  a.Game.startNewGame();

};