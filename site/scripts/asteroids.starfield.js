// Background starfield for the asteroids game.
// Runs in a separate canvas beneath the game proper.
// Requires jQuery, otherwise stand-alone.
// Thanks to lefam: http://codentronix.com/2011/07/22/html5-canvas-3d-starfield/

asteroids = asteroids || {};

// Starfield initializes and runs immediately
asteroids.starfield = (function() {
  var starCanvas = $('#starfieldcanvas')[0],
      ctx,
      stars = new Array(68), // not too many stars
      MAX_DEPTH = 48,
      canvasWidth,
      canvasHeight,
      halfWidth,
      halfHeight;

  // Initialization
  if (starCanvas && starCanvas.getContext) {
    ctx = starCanvas.getContext('2d');
    canvasWidth = starCanvas.width;
    canvasHeight = starCanvas.height;
    halfWidth = canvasWidth / 2;
    halfHeight = canvasHeight / 2;
    initStars();
    setInterval(starloop, 60);
  }

  // Random value within bounds, called a lot
  function randomRange(minval, maxval) {
    return Math.floor(Math.random() * (maxval - minval - 1) + minval);
  }

  // Initial star seeding
  function initStars() {
    var i;
    for (i = 0; i < stars.length; i++) {
      stars[i] = {
        x: randomRange(-25,25),
        y: randomRange(-25,25),
        z: randomRange(1, MAX_DEPTH)
      }
    }
  }

  // Loop moves stars, brightens and enlarges as they move towards you.
  // I keep them dim to not disturb the game too much.
  function starloop() {
    var i,  // star loop counter
        k,  // ?
        px, // point
        py, // point
        size,
        shade;

    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    for (i = 0; i < stars.length; i++) {
      stars[i].z -= 0.2;

      if (stars[i].z <= 0) {
        stars[i].x = randomRange(-25,25);
        stars[i].y = randomRange(-25,25);
        stars[i].z = MAX_DEPTH;
      }

      k = 256.0 / stars[i].z;
      px = stars[i].x * k + halfWidth + 3;
      py = stars[i].y * k + halfHeight + 7;

      if (px >= 0 && px <= canvasWidth && py >= 0 && py <= canvasHeight) {
        size = (1 - stars[i].z / 32.0) * 5;
        shade = parseInt((1 - stars[i].z / 32.0) * 148);
        ctx.fillStyle = 'rgb(' + shade + ',' + shade + ',' + shade + ')';
        ctx.fillRect(px, py, size, size);
      }

    }
  }
})();