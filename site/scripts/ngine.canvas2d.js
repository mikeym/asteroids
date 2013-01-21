// Ngine 2D Canvas handling
// Mikey Micheletti
// Version 0.1
// relies on ngine.js, jquery.js, and this project's plugins.js
// Builds on work by Pascal Rettig and Tom O'Connor, thank you!
//
// Canvas context: this.ctx
// Canvas element: this.el

'use strict';

var Ngine = Ngine || {},
    DEFAULT_NGINE_ID = 'defaultNgineId'; // if needed

// Sets up a canvas for the game.
// If called with no parameters, or cannot find what you asked for, it
// will create a new canvas. For this version, the canvas size is fixed
// to the desiredWidth and desiredHeight values supplied in options.
// Tom and the book get more tricky-ful to support resizing and touch devices.
Ngine.prototype.setupCanvas = function(canvasId, options) {
  var options = options || {},
      canvasId = canvasId || DEFAULT_NGINE_ID,
      w = parseInt(options.desiredWidth) || 420,  // default canvas size if not supplied
      h = parseInt(options.desiredHeight) || 320;

      // The canvas may already exist, check to see...
      this.el = $(_.isString(canvasId) ? '#' + canvasId : canvasId);

      // If we don't yet have a canvas, create one. Also, in this case only,
      // create a wrapper element for the canvas.
      if (this.el.length === 0) {
        this.el = $('<canvas id="' + id + '" width="' + w + '" height="' + h + '"></canvas>')
                    .appendTo('body')
                    .wrap('<div id="' + canvasId + 'wrapper"></div>');
      }

      // Now obtain a 2D context to the canvas
      this.ctx = this.el[0].getContext && this.el[0].getContext('2d');

      // Things we could variously do here might include resizing the canvas,
      // scrolling to certain points on the screen and handling orientation
      // changes. Omitted for our desktop-only Asteroids game.

      this.canvasWidth = w;
      this.canvasHeight = h;

      // permit method chaining
      return this;
};

// Clears the canvas
Ngine.prototype.clearCanvas = function() {
  this.ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
}

Ngine.prototype.getCanvas = function() {
  return this.el;
}

Ngine.prototype.getCanvasCtx = function() {
  return this.ctx;
}