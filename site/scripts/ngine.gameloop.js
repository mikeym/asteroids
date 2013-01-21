// Ngine game loop
// Mikey Micheletti
// Version 0.1
// relies on ngine.js, underscore.js, jquery.js, and this project's plugins.js
// Builds on work by Pascal Rettig and Tom O'Connor, thank you!

'use strict';

var Ngine = Ngine || {};

// Set a loop going to call the callback function every so often.
// The loop interval will be defined by requestAnimationFrame().
Ngine.prototype.setGameLoop = function(callback) {
  var that = this;

  // Note the time
  that.lastLoopFrame = new Date().getTime();

  // Callback wrapper function
  that.gameLoopCallbackWrapper = function(now) {
    var elapsed;

    that.loop = requestAnimationFrame(that.gameLoopCallbackWrapper);
    elapsed = now - that.lastLoopFrame;

    if (elapsed > 100) {
      elapsed = 100;
    }

    // Invoke our callback function in the context of this Ngine instance
    callback.apply(that, [elapsed / 1000]);
    that.lastLoopFrame = now;
  };

  // Determine the interval and invoke the callback wrapper
  requestAnimationFrame(that.gameLoopCallbackWrapper);
};

// Pause the game timer, if any
Ngine.prototype.pauseGame = function() {
  if (this.loop) {
    window.cancelAnimationFrame(this.loop);
  }
  this.loop = null;
};

// Resume the game timer, if any
Ngine.prototype.resumeGame = function() {
  if (!this.loop) {
    this.lastLoopFrame = new Date().getTime();
    this.loop = window.requestAnimationFrame(this.gameLoopCallbackWrapper);
  }
};
