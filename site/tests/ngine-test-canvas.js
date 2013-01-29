// Asteroids basic canvas test script
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
    firstRun = true,
    resourcesLoaded = 0;

  if (a.dbug) { console.log('asteroids.loader loaded'); }

  if (firstRun) {
    firstRun = false;

    Modernizr.load([
      {
        load: [
          '../scripts/underscore-min.js',
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
          '../scripts/ngine.sprites.js'

        ],
        complete: function () {
          if (a.dbug) { console.log('asteroids.loader Modernizr load complete'); }
          // Create Ngine instance
          a.Ngine = new Ngine();

          // Load game assets
          if (a.dbug) { console.log('loading game assets...'); }
          a.Ngine.load(['asteroids-game-sprites.png', 'asteroids-game-sprites.json']);

          // Hook up the input module, and setup a test canvas
          a.Ngine.includeModule('Input');
          a.Ngine.setupCanvas('gamecanvas', {desiredWidth : 640, desiredHeight : 480});
          a.Ngine.input.keyboardControls();

          // Testing Testing 1 2 3
          a.Ngine.setGameLoop(a.testCanvas);
          a.testKeyboardEvents();

        }
      }
    ]);
  }
})();

// testing 1 2 3
asteroids.testCanvas = function() {
  var ctx = asteroids.Ngine.ctx;
  asteroids.Ngine.clearCanvas();

  ctx.beginPath();
  ctx.strokeStyle = '#00dddd';
  ctx.lineWidth = 2;
  ctx.moveTo(75, 75);
  ctx.lineTo(100, 100);
  ctx.stroke();

  ctx.font = '20px BPdotsSquaresLight';
  ctx.fillStyle = '#00dddd';
  ctx.fillText('Hi There', 50, 50);
};

// testing 1 2 3
asteroids.testKeyboardEvents = function() {
  var ani = asteroids.Ngine.input;
  ani.bind('fire', function() { console.log('fire pew-pew'); });
  ani.bind('fireUp', function() { console.log('fireUp pew-pew end'); });
  ani.bind('left', function() { console.log('left rotate'); });
  ani.bind('leftUp', function() { console.log('leftUp rotate end'); });
  ani.bind('right', function() { console.log('right rotate'); });
  ani.bind('rightUp', function() { console.log('rightUp rotate end'); });
  ani.bind('thruster', function() { console.log('up thruster'); });
  ani.bind('thrusterUp', function() { console.log('upUp thruster end'); });
  ani.bind('shield', function() { console.log('down shield'); });
  ani.bind('shieldUp', function() { console.log('downUp shield end'); });
  ani.bind('menu', function() { console.log('esc menu'); });
  ani.bind('menuUp', function() { console.log('escUp menu end'); });
}