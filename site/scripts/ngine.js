// Njine core
// njine.js - JavaScript Game Engine for UW Web and Mobile Game Dev Winter Quarter
// Version 0.1
// Mikey Micheletti
// relies on underscore.js, jquery.js, and odds 'n ends in this project's plugins.js
// Builds on work by Pascal Rettig and Tom O'Connor, thank you!

'use strict';

// Ngine object.
// Probably somebody else already thought of doing this but what the heck.
// Extend options by passing in configOpts if needed
var Ngine = (function(configOpts) {
  var extend, // extension method associated with the Ngine prototype
      includeModule, // include other modules into the Ngine
      normalizeArg, // argument cleansing
      ngineMaker; // Ngine constructor for an instance

  // Extends the Ngine with shiny new bits
  extend = function(obj) {
    _(this).extend(obj);
    return this;
  };

  // Adds other modules into the Ngine
  includeModule = function(mod) {
    var that = this;
    _.each(that.normalizeArg(mod), function(m) {
      var m = Ngine[m] || m;
      if (typeof m !== 'function') {
        console.error('Ngine error: No module found for type: ', m);
      } else {
        m.apply(that);
      }
    });
    return this;
  }

  // Transforms a supplied comma-delimited string of names into an
  // array of names stripped of whitespaces.
  normalizeArg = function(arg) {
    if(_.isString(arg)) {
      arg = arg.replace(/\s+/g,'').split(",");
    }
    if(!_.isArray(arg)) {
      arg = [ arg ];
    }
    return arg;
  };

  // Ngine constructor function to create a new Ngine instance
  ngineMaker = function(configOpts) {
    if (!(this instanceof Ngine)) {
      return new Ngine(configOpts);
    }

    var that = this; // Me, myself and I

    // Setup default options per-instance and allow for extensions
    that.options = {
      imagePath : 'images/',
      audioPath : 'audio/',
      dataPath  : 'data/',
      fontsPath : 'fonts/',
      audioSupported : ['mp3', 'ogg'],
      sound : true,
      debug : true // Ngine debugging configured per-instance, separately from the game
    };
    if (configOpts) {
      _(that.options).extend(configOpts);
    }

    // Major Ngine components
    that.components = {};
    that.inputs = {};

    if (that.options.debug) {
      console.log('Ngine created');
    }
  };

  // Associate constructor with Ngine
  ngineMaker.prototype = {
    constructor: Ngine,
    version : '0.1',
    extend : extend,
    normalizeArg: normalizeArg,
    includeModule: includeModule
  };

  return ngineMaker;

})();
