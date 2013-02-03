// Ngine input module
// Mikey Micheletti
// Version 0.1
// relies on ngine.js, underscore.js, jquery.js, and this project's plugins.js
// Keyboard input supported this version, other inputs like mouse, joypad, touch alas no.
// Builds on work by Pascal Rettig and Tom O'Connor, thank you!

'use strict';

var Ngine = Ngine || {};

// Game key codes in common use, add others as needful per instance.
Ngine.KeyCodes = {
  ESC   : 27,
  SPACE : 32,
  LEFT  : 37,
  UP    : 38,
  RIGHT : 39,
  DOWN  : 40,
  X     : 88,
  Z     : 90
};

// What the game keys do, Asteroids setup here
Ngine.DefaultKeyActions = {
  ESC   : 'menu',
  SPACE : 'fire',
  LEFT  : 'left',
  UP    : 'thruster',
  RIGHT : 'right',
  DOWN  : 'shield',
  X     : 'something',
  Z     : 'somethingelse'
}

// Keyboard-focused game input system.
// Future versions may support other input methods.
Ngine.InputSystem = Ngine.Evented.extend({
  name : 'InputSystem',
  keys : { },              // filled via bindKey
  keypad : { },            // not supported this version
  keyboardEnabled : false, // set to true after enableKeyboard call
  touchEnabled : false,    // not supported this version
  joypadEnabled : false,   // not supported this version
  mouseEnabled : false,    // likewise

  // Populates the Ngine.InputSystem.keys object
  // Key is expected to be an integer numeric identifier of a key (aka a 'key code'),
  // Name is how you want to refer to it later.
  bindKey : function(key, name) {
    this.keys[Ngine.KeyCodes[key] || key] = name;
  },

  // Enables the requested keyboard keys as game controls
  keyboardControls : function(keys) {
    keys = keys || Ngine.DefaultKeyActions;
    _(keys).each(function(name, key) {
      this.bindKey(key, name);
    }, this);
    this.enableKeyboard();
  },

  // Enabling keyboard handling at the document level
  // Uses KeyCodes and DefaultActions (above).
  enableKeyboard : function() {
    var input = this,
        ngine = this.ngine;

    // once is plenty
    if (input.keyboardEnabled) {
      return false;
    }

    // Keyboard events attached at the document level
    $(document)
      .on('keydown', function(e) {
        var actionName;
        if(input.keys[e.which]) {
          actionName = input.keys[e.which];
          ngine.inputs[actionName] = true;
          input.trigger(actionName);
          input.trigger('keydown', e.which);
          e.preventDefault();
        }
      })
      .on('keyup', function(e) {
        var actionName;
        if(input.keys[e.which]) {
          actionName = input.keys[e.which];
          ngine.inputs[actionName] = true;
          input.trigger(actionName + 'Up');
          input.trigger('keyup', e.which);
          e.preventDefault();
        }
      });

    if (ngine.options.debug) {
      console.log('Ngine.input.enableKeyboard called.')
    }
    input.keyboardEnabled = true;
  },

  disableKeyboard : function() {
    $(document).off('keydown keyup');
  }
});

Ngine.Input = function() {
  this.input = new Ngine.InputSystem();
  this.input.ngine = this;
  this.inputs = { };
  if (this.options.debug) {
    console.log('Ngine.input created.')
  }
  return this;
};