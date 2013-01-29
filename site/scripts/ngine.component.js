// Ngine components
// Mikey Micheletti
// Version 0.1
// relies on ngine.js, underscore.js, jquery.js, and this project's plugins.js
// also requires ngine.evented.js
// Builds on work by Pascal Rettig and Tom O'Connor, thank you!

'use strict';

var Ngine = Ngine || {};

// Register the named component and associate it with the supplied method.
Ngine.prototype.registerComponent = function(name, methods) {
  methods.name = name;
  this.components[name] = Ngine.Component.extend(methods);
};

// Ngine Component object
Ngine.Component = Ngine.Evented.extend({
  name: 'Component',

  // Component constructor that will store a reference to the entity,
  // extend the entities properties, add itself to the entity's properties
  // and active components, and will call the added method on the entity
  // in case other initialization is needed.
  init: function(entity) {

    // Set a property so the component can refer to the entity
    this.entity = entity;

    // Extend the entity with new properties from this component
    if (this.extend){
      _.extend(entity, this.extend);
    }

    // Add this component to the entity as a property by name
    entity[this.name] = this;

    // Add this component to the entity's list of active components
    entity.activeComponents.push(this.name);

    // Do any needful initialization like binding listeners in the entity's
    // added method
    if (this.added) {
      this.added();
    }
  },

  // Component destructor that will undo all the constructor's actions.
  // References in the entity to the component will be removed, the component
  // will get whacked and removed from the list of active components, and
  // any associated event handlers are removed. Finally, if we have any
  // particular afterlife requirements do those.
  destroy: function() {
    var extensions, i, len, idx;

    // Remove any properties associated with the extend object in the entity
    if (this.extend) {
      extensions = _.keys(this.extend);
      for (i = 0, len = extensions.length; i < len; i++) {
        delete this.entity[extensions[i]];
      }
    }

    // Destroy the property from the entity
    delete this.entity[this.name];

    // Remove the component from the entity's list of active components
    idx = this.entity.activeComponents.indexOf(this.name);
    if (idx != -1) {
      this.entity.activeComponents.splice(idx, 1);
    }

    // Remove any event handlers bound to this component
    this.debind();

    // If we have any post-destruction requirements, do them
    if (this.destroyed) {
      this.destroyed();
    }
  }

});