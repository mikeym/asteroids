// Asteroids Large Asteroid module
// Version 0.1
// UW Gameplay, Winter Quarter 2013
// Mikey Micheletti
// Requires jquery, underscore.js, Box2dWeb.js and the various Ngine modules

var Ngine = Ngine || { },
  asteroids = asteroids || { };

// The names of the 3 sets of large asteroids sprites in the spritesheet
asteroids.largeAsteroidAnimationGroupNames = [
  'asteroid-large-1', 'asteroid-large-2', 'asteroid-large-3'
];

// The different large asteroid animations share the same sequences
asteroids.largeAsteroidAnimationSequences =  {
  normal: {
    frames: [0],
    rate: 1/2
  },
  exploding: {
    frames: [1,2],
    rate: 1/2
  }
};

asteroids.LargeAsteroid = Ngine.Sprite.extend({
  name: 'LargeAsteroid',

  // The Large Asteroid's properties control animations and appearance
  init: function() {
    var cosOfAngle,
        sinOfAngle,
        myBody,
        p;

    this._super({
      spriteIndex: 0,
      sheetName: asteroids.largeAsteroidAnimationGroupNames[0],
      animSetName: asteroids.largeAsteroidAnimationGroupNames[0],
      rate: 1/10,
      x: 0,
      y: 0,
      angle: 0,
      shape: 'circle',
      shape_radius: 40,         // larger than the sprite graphic so we get edge collisions
      bodyType: 'dynamic',      // can bump into stuff
      linearDamping: 10.0,      // a little bit of drag seems to look right
      density: 100.0,           // big heavy rocks
      mass: 200,                // big heavy rocks
      howFastItScoots: 2600.0,  // needs a lotta scoot if it's heavy
      doSleep: false,
      exploding: false,
      isInitializing: true,
      fixedRotation: false,
      leftToRight: Math.random() * 2 > 1
    });

    p = this.properties;

    // Associate the spritesheet and animations now
    p.spriteIndex = Math.floor(Math.random() * 3);
    p.sheetName = asteroids.largeAsteroidAnimationGroupNames[p.spriteIndex];
    p.animSetName = asteroids.largeAsteroidAnimationGroupNames[p.spriteIndex];

    // Randomize asteroid position and angle properties
    p.x = p.leftToRight? 0 - (p.width / 2) : this.ngine.canvasWidth;
    p.y = Math.floor(Math.random() * (560 - 40) + 40);
    p.angle = Math.random();

    // Add animation and physics capabilities to the asteroid
    this.addComponent('animation');
    this.addComponent('physics');

    // Listen for physics system contact
    this.bind('contact', this, 'contact');
    this.bind('endContact', this, 'endContact');

    if (asteroids.dbug) { console.log('Asteroid[' + this.properties.spriteIndex + '] created'); }
  },

  // Decision-making about which frames to present
  step: function(dt) {
    var cosOfAngle, // most of these only used when initializing the first time
      sinOfAngle,
      myBody,
      worldCenter,
      inclineUp,
      p = this.properties;

    // Only apply force once to the asteroid, the first time we get here. After that it drifts...
    if (p.isInitializing) {
      myBody = this.physics.getBody();
      worldCenter = myBody.GetWorldCenter();
      randomPointOnBody = myBody.GetWorldPoint(new Ngine.B2d.Vec(10, 2));
      cosOfAngle = Math.cos(p.angle); // direction x
      inclineUp = Math.random() * 2 > 1;

      // Incline the force applied to the asteroid up or down based on random inclineUp value
      sinOfAngle = inclineUp ? Math.sin(p.angle) : -Math.sin(p.angle); // direction y

      // Physics/entity angles match
      this.physics.setAngle(p.angle);

      // Apply force
      if (p.leftToRight) {
        myBody.ApplyForce({x: cosOfAngle * p.howFastItScoots, y: sinOfAngle * p.howFastItScoots},
          worldCenter);
      } else {
        myBody.ApplyForce({x: -cosOfAngle * p.howFastItScoots, y: sinOfAngle * p.howFastItScoots},
          worldCenter);
      }
      // Add a bit of random rotation
      myBody.SetAngularVelocity(Math.random());

      // Once is plenty
      p.isInitializing = false;
    }

    // TODO explode
    if (p.exploding) {
      this.play('exploding');
    } else {
      this.play('normal');
    }

    this._super(dt);
  },

  // When an asteroid hits the ship, set the ship's exploding property.
  // The ship will explode during the next step.
  // We also carefully time the handling of the ship explosion by the game.
  contact: function(contact) {
    var that = this;

    // Contact made with the ship, set properties if shields aren't on
    // TODO see if you can refactor this to just have the logic in one place in the ship
    if (contact.name && contact.name ==='Ship') {
      if (contact.properties.shieldsOn === false) {
        console.log('Asteroid hit ship');
        contact.properties.exploding = true;
        contact.properties.ded = true;

        // Outer timeout to remove the ship after the animation plays out
        setTimeout(function() {
          that.parentStage.remove(contact);

          // Inner timeout to have the game handle the ship explosion
          setTimeout(function() {
            asteroids.Game.handleShipExplosion();
          }, 1000); // inner timeout
        }, 500); // outer timeout
      }
    } else {
      // TODO maybe apply a bit of force or something so the asteroids don't all stick together
    }
  },

  // If needed
  endContact: function(contact) {
    //this.properties.exploding = false;
  }

});