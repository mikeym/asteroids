// Asteroids game controls

var asteroids = asteroids || {};

asteroids.controls = (function () {
  'use strict';

  if (asteroids.dbug) { console.log( 'asteroids.controls loaded' ); }

  // hook up keyboard events in the canvas
  function hookKeyboardEvents() {

    if (asteroids.dbug) { console.log( 'asteroids.controls.hookKeyboardEvents' ); }

    $(document).on('keydown', function(e) {
      if (asteroids.dbug) { console.log( 'keyup: ' + e.which ); }

      e.preventDefault();
      switch (e.which) {
        case '27':
          if (asteroids.dbug) { console.log( 'pause game' ); }
          break;

        case '32':
          if (asteroids.dbug) { console.log( 'start game or fire pew-pews' ); }
          break;

        case '37':
          if (asteroids.dbug) { console.log( 'rotate ship left' ); }
          break;

        case '38':
          if (asteroids.dbug) { console.log( 'fire ship thrusters' ); }
          break;

        case '39':
          if (asteroids.dbug) { console.log( 'rotate ship right' ); }
          break;

        case '40':
          if (asteroids.dbug) { console.log( 'engage ship shields' ); }
          break;
      }
    });
  }

  // Disable mouse events when we leave the game screen
  function unhookKeyboardEvents() {
    $('#gamecanvas').off();
  }

  return {
    hookKeyboardEvents : hookKeyboardEvents,
    unhookKeyboardEvents : unhookKeyboardEvents
  };

})();
