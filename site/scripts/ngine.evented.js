// Ngine in-game events support
// Mikey Micheletti
// Version 0.1
// relies on ngine.js, underscore.js, jquery.js, and this project's plugins.js
// Builds on work by Pascal Rettig and Tom O'Connor, thank you!

'use strict';

var Ngine = Ngine || {};

// Extend Ngine to support contextual game events
Ngine.Evented = Class.extend({
  name: 'Evented',

  // Binds a listener to a specific event and triggers a callback when received.
  // Event is a game event
  // Callback is a function to be called when the event is fired
  // Target is an optional argument that provides context to the callback, especially
  // to support debind.
  bind: function(event, callback, target) {
    // Set the callback to be a method on target
    if (_.isString(callback)) {
      callback = target[callback];
    }

    // Add a listener to the object, keyed by the event name, which the object will store
    this.listeners = this.listeners || {};
    this.listeners[event] = this.listeners[event] || [ ];
    this.listeners[event].push([ target || this, callback]);

    // Store event info on the target for later unbinding
    if (target) {
      if (!target.binds) {
        target.binds = [ ];
      }
      target.binds.push([this, event, callback]);
    }
  },

  // If any listeners are monitoring the supplied event, call their callbacks
  trigger: function (event, data) {
    var i, len, listener;
    if (this.listeners && this.listeners[event]) {
      for (i = 0, len= this.listeners[event].length; i < len; i++) {
        listener = this.listeners[event][i];
        // listener[0] is the callback
        // listener[1] is the target context
        listener[1].call(listener[0], data);
      }
    }
  },

  // Unbind all listeners on all targets for a given event
  unbindAll: function(event) {
    if (this.listeners[event]) {
      delete this.listeners[event];
    }
  },

  // Unbind an event for a target when a game object is destroyed, or
  // the event listener is no longer needed. The callback is optional. If the
  // callback is not included, all events. See also unbindAll, which removes
  // all listeners on all targets for a given event.
  unbind: function(event, target, callback) {
    var i,
        listeners = this.listeners && this.listeners[event];

    if (listeners) {
      // Loop from the end of the array to avoid shennanigans from deleting items
      for (i = listeners.length - 1; i >= 0; i--) {
        if (listeners[i][0] == target) {
          if (!callback || callback == listeners[i][1]) {
            this.listeners[event].splice(i, 1);
          }
        }
      }
    }
  },

  // Remove all event information for the object. Use this when an object is destroyed
  // to clean up listeners and reduce memory leaks.
  debind: function() {
    var i, len, boundEvent, source, event;

    if (this.binds) {
      for (i = 0, len = this.binds.length; i < len; i++) {
        boundEvent = this.binds[i];
        source = boundEvent[0];
        event = boundEvent[1];
        source.unbind(event, this);
      }
    }
  }

});