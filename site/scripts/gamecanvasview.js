// Asteroids canvas view module
// Early code, no longer used

var asteroids = asteroids || {};

asteroids.view = (function() {
  'use strict';
  var that = this,
      a = asteroids,
      canvas = $('#gamecanvas')[0],
      ctx = canvas.getContext('2d');

  if (a.dbug) { console.log( 'asteroids.gameloop loaded' ); }

  function refresh() {
    // testing 1 2 3

    canvas.width = canvas.width; // clear canvas each time or font gets weird

    ctx.beginPath();
    ctx.strokeStyle = '#00dddd';
    ctx.lineWidth = 2;
    ctx.moveTo(75, 75);
    ctx.lineTo(100, 100);
    ctx.stroke();

    ctx.font = '20px BPdotsSquaresLight';
    ctx.fillStyle = '#00dddd';
    ctx.fillText('Hi There', 50, 50);
  }

  return {
    refresh : refresh
  };

})();
