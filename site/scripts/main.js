// Asteroids script root and loader
// UW Gameplay, Winter Quarter 2013
// Mikey Micheletti

var asteroids = asteroids || {};

asteroids.dbug = true;

asteroids.loader = (function () {
  'use strict';
  var that = this,
      a = asteroids,
      firstRun = true;

  if (a.dbug) { console.log('asteroids.loader loaded'); }

  if (firstRun) {
    firstRun = false;

    Modernizr.load([
      {
        load: [
          'scripts/plugins.js',
          'scripts/gameloop.js',
          'scripts/controls.js',
          'scripts/gamecanvasview.js'
        ],
        complete: function () {
          if (a.dbug) { console.log('asteroids.loader Modernizr load complete'); }

          // testing
          a.controls.hookKeyboardEvents();
          a.gameloop.setLoopFunction(a.view.refresh);
        }
      }
    ]);
  }
})();
