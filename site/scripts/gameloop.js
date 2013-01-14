// Asteroids game loop

var asteroids = asteroids || {};

asteroids.gameloop = (function () {
  'use strict';
  var loopFunc; // function to call every loop

  if (asteroids.dbug) { console.log( 'asteroids.gameloop loaded' ); }

  window.requestAnimationFrame =
    (function() {
      return window.requestAnimationFrame ||
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame ||
        window.oRequestAnimationFrame ||
        window.msRequestAnimationFrame ||

        function( callback, element ) {
          return window.setTimeout(
            function() {
              callback( Date.now() );
            }, 1000 / 60 );
        };
    })();

  window.cancelAnimationFrame =
    (function() {
      return window.cancelAnimationFrame ||
        window.cancelRequestAnimationFrame ||
        window.webkitCancelAnimationFrame ||
        window.webkitCancelRequestAnimationFrame ||
        window.mozCancelAnimationFrame ||
        window.mozCancelRequestAnimationFrame ||
        window.oCancelAnimationFrame ||
        window.oCancelRequestAnimationFrame ||
        window.msCancelAnimationFrame ||
        window.msCancelRequestAnimationFrame ||
        window.clearTimeout;
    })();

  // Sets the function called during the loop to the supplied function
  function setLoopFunction( func ) {
    if (asteroids.dbug) { console.log( 'gameloop.setLoopFunction( ' + func + ')' ); }
    loopFunc = func;
  }

  // Fires off the function, if any, and requests the next loop at the machine's convenience
  function doLoop( nowMillis ) {
    if ( typeof loopFunc === "function" ) {
      loopFunc( nowMillis / 1000.0 );
    }
    window.requestAnimationFrame( doLoop );
  }

  // Starts the Loop Of Eternity going
  window.requestAnimationFrame(doLoop);

  return { setLoopFunction : setLoopFunction };

})();