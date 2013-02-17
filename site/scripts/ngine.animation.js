// Ngine animation module
// Mikey Micheletti
// Version 0.1
// relies on ngine.js and other ngine modules, underscore.js, jquery.js
// Builds on work by Pascal Rettig and Tom O'Connor, thank you!

'use strict';

var Ngine = Ngine || {};

// Animation module works with spritesheets to identify frames used for specific situations,
// trigger other events, set speed, looping, and other properties.
Ngine.Animation = function () {

  var AnimationComponent;

  AnimationComponent = {
    name: 'AnimationComponent',

    defaultProperties: {
      animationName: null,      // lookup key for animation data
      animationPriority: -1,    // priority for animation overrides
      animationFrame: 0,        // sequential
      animationTime: 0,         // controls animation playback
      animationChanged: false   // new animation is being played
    },

    // Proxy functions exposed through the entity
    extend: {
      play: function(name, priority) {
        this.animation.play(name, priority);
      }
    },

    // Set default animation parameters, register to be notified about a step event
    added: function() {
      _.extend(this.entity.properties, this.defaultProperties);
      this.entity.bind('step', this, 'step');
    },

    // Updates the entity's frame property based on the current animation state
    step: function(dt) {
      var entity = this.entity,
          p = entity.properties,
          rate,
          stepped = 0;

      var animData = Ngine.getInstance().getAnimationData(p.animSetName, p.animationName);

      if (!animData) {
        if (this.entity && this.entity.unbindEvent) {
          this.entity.unbindEvent('step', this, 'step');
        }
        return;
      }

      rate = animData.rate || p.rate;

      if (p.animationChanged) {
        p.animationChanged = false;
      } else {
        // Increment animation time, step to next frame
        p.animationTime += dt;
        if (p.animationTime > rate) {
          stepped = Math.floor(p.animationTime / rate);
          p.animationTime -= stepped * rate;
          p.animationFrame += stepped;
        }
      }

      if (stepped > 0) {
        // at the end of our animation?
        if (p.animationFrame >= animData.frames.length) {

          // if not looping or transitioning
          if (animData.loop === false || animData.next) {
            // Stop at the end
            p.animationFrame = animData.frames.length - 1;

            // Trigger generic and named events
            entity.trigger('animEnd');
            entity.trigger('animend.' + p.animationName);

            // Discx animation data
            p.animationName = null;
            p.animationPriority = -1;

            // Trigger any named events assigned to this animation
            if (animData.trigger) {
              entity.trigger(animData.trigger, animData.triggerData);
            }

            // Play the next animation
            if (animData.next) {
              this.play(animData.next, animData.nextPriority);
            }
            return;
          } else {
            // not at the end of the animation, next...
            entity.trigger('animLoop');
            entity.trigger('animLoop.' + p.animationName);
            p.animationFrame = p.animationFrame % animData.frames.length;
          }
        }

        entity.trigger('animFrame');
      }

      // Update spritesheet props based on the current animation state
      p.sheetName = animData.sheetName || p.sheetName;
      p.frame = animData.frames[p.animationFrame];

    }, // step

    // Start playing a new animation if we aren't already
    play: function(animName, priority) {
      var entity = this.entity,
          p = entity.properties,
          priority = priority || 0;

      if (animName != p.animationName && priority >= p.animationPriority) {
        // reset
        p.animationName = animName;
        p.animationChanged = true;
        p.animationTime = 0;
        p.animationFrame = 0;
        p.animationPriority = priority;
      }

      entity.trigger('anim');
      entity.trigger('anim.' + p.animationName);
    } // play

  }; // AnimationComponent

  // Animation Engine Module
  this.registerComponent('animation', AnimationComponent);

  // Storage for animation data
  this.animationsList = { };

  // Add animations for a given sprite name
  Ngine.prototype.addAnimationData = function(spriteName, animations) {
    if (!this.animationsList[spriteName]) {
      this.animationsList[spriteName] = { };
    }
    _.extend(this.animationsList[spriteName], animations);
  };

  // Gets named animation data for a given sprite
  Ngine.prototype.getAnimationData = function(spriteName, animName) {
    return this.animationsList[spriteName] && this.animationsList[spriteName][animName];
  }

}; // Ngine.Animation
