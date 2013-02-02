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
  name: 'Entity',
  defaults: { },

  // Check to see if the Entity has a component
  // Returns true if a component with the supplied name is found, false otherwise.
  hasComponent: function(componentName) {
    return this[componentName] ? true : false;
  },

  // Adds several components to the Entity from the supplied list.
  // Returns the Entity object to support chaining.
  addComponentList: function(components) {
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
        // Add the new component to the entity by name as a property and to active list
        this[componentName] = newComponent;
        this.activeComponents.push(componentName);
        // trigger notification event
        this.trigger('addComponent', newComponent);
      }
    }
    return this;
  },

  // Adds a single component by name to the entity, with the supplied properties.
  addComponent: function(componentType, properties, componentName) {
    var componentClass, newComponent;

    // Create array of active components if needed
    if (!this.activeComponents) {
      this.activeComponents = [ ];
    }
    componentName = componentName || componentType;

    // Only one of each please
    if (this.hasComponent(componentName)) {
      return;
    }

    // create an instance of the new component and add to the list
    componentClass = Ngine.getInstance().components[componentType];
    if (componentClass) {
      newComponent = new componentClass(this, properties);
      this.activeComponents.push(newComponent);
      this[componentName] = newComponent;
      this.trigger('addComponent', newComponent);
    }
  },

  // Removes one or more components from the Entity from the supplied list.
  // Returns the Entity to support method chaining.
  deleteComponent: function(components) {
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
        this.trigger('deleteComponent', this[componentName]);
        this[componentName].destroy();
      }
    }
    return this;
  },

  // Destroys an Entity, unbinds any associated events or parent
  // components. Returns nothing.
  destroy: function() {
    var i, len, component;

    // Only get to whack it once
    if (this.destroyed) {
      return;
    }

    // Trigger a notification event
    this.trigger('removed');

    // Whack any active components
    if (this.activeComponents) {
      for (i = 0, len = this.activeComponents.length; i < len; i++) {
        component = this.activeComponents[i];
        this.trigger('deleteComponent', component.name);
        component.destroy();
      }
      this.activeComponents.length = 0;
    }

    // Remove any event handlers associated with this entity
    this.debind();

    // If this object has a parent that can remove this entity, do so
    if (this.parent && this.parent.remove) {
      this.parent.remove(this);
    }

    // Mark this Entity as destroyed
    this.destroyed = true;
  },

  // Transforms a position in this object's local space into world space. 2D.
  transformLocalPosition: function(x, y) {
    var cs = Math.cos(this.properties.angle),
        sn = Math.sin(this.properties.angle),
        posX = x * cs - y * sin,
        posY = x * sn + y * cs,
        worldX = this.properties.x + posX,
        worldY = this.properties.y + posY;

    return {x: worldX, y: worldY };
  },

  // Transforms a directional vector in this object's local space into world space. 2D.
  transformLocalDirection: function(x, y) {
    var cs = Math.cos(this.properties.angle),
        sn = Math.sin(this.properties.angle),
        dirX = x * cs - y * sn,
        dirY = x * sn + y * cs;

    return { x: dirX, y: dirY };
  },

  // Entity constructor that accepts configuration properties
  init: function(props) {
    this.ngine = Ngine.getInstance();
    this.properties = _(this.defaults).clone();
    if (props) {
      _(this.properties).extend(props);
    }
  }

});