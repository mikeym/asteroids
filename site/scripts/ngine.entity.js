// Ngine entities
// Mikey Micheletti
// Version 0.1
// relies on ngine.js, underscore.js, jquery.js, and this project's plugins.js
// also requires ngine.evented.js
// Builds on work by Pascal Rettig and Tom O'Connor, thank you!

'use strict';

var Ngine = Ngine || {};

// An Entity is a base object in the game. Sprites and other active game objects
// will inherit from this. It can register for and receive events, and may be
// associated with components.
Ngine.Entity = Ngine.Evented.extend({

  // Check to see if the Entity has a component
  // Returns true if a component with the supplied name is found, false otherwise.
  hasComponent: function(componentName) {
    return this[componentName] ? true : false;
  },

  // Adds one or more components to the Entity from the supplied list.
  // Returns the Entity object to support chaining.
  addComponent: function(components) {
    var i, len, componentName, componentClass, newComponent;

    // Normalize our components list
    components = Ngine.normalizeArg(components);

    // Create an activeComponents array property if we don't already have one
    if (!this.activeComponents) {
      this.activeComponents = [ ];
    }

    // Iterate through the components to be added, look them up, and create them.
    for (i = 0, len = components.length; i < len; i++) {
      componentName = components[i];
      componentClass = Engine.getInstance().components[componentName];
      // only create one of these components per entity
      if (!this.hasComponent[componentName] && componentClass) {
        newComponent = new componentClass(this);
        // trigger notification event
        this.trigger('addComponent', newComponent);
      }
    }
    return this;
  },

  // Removes one or more components from the Entity from the supplied list.
  // Returns the Entity to support method chaining.
  removeComponent: function(components) {
    var i, len, componentName;

    // Normalize our components list
    components = Ngine.normalizeArg(components);

    // Iterate the components list and destroys any matches it finds.
    // We're looping in reverse to avoid collection item removal effects.
    len = components.length;
    for (i = len - 1; i >= 0; i--) {
      componentName = components[i];
      if (componentName && this.hasComponent(componentName)) {
        // trigger notification event
        // Tom has this commented out, I'm guessing because the component
        // has gone away by the time the event is received...
        //this.trigger('delComponent', this[componentName]);
        this[componentName].destroy();
      }
    }
    return this;
  },

  // Destroys an Entity, unbinds any associated events or parent
  // components. Returns nothing.
  destroyEntity: function() {

    // Only get to whack it once
    if (this.destroyed) {
      return;
    }

    // Remove any event handlers associated with this entity
    this.debind();

    // If this object has a parent that can remove this entity, do so
    if (this.parent && this.parent.remove) {
      this.parent.remove(this);
    }

    // Trigger a notification event
    this.trigger('removed');

    // Mark this Entity as destroyed
    this.destroyed = true;
  }



});