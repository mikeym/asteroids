// Asteroids Small Asteroid module
// Version 0.1
// UW Gameplay, Winter Quarter 2013
// Mikey Micheletti
// Requires jquery, underscore.js, Box2dWeb.js and the various Ngine modules

var Ngine = Ngine || { },
  asteroids = asteroids || { };

// The names of the 3 sets of small-sized asteroids sprites in the spritesheet
asteroids.smallAsteroidAnimationGroupNames = [
  'asteroid-small-1', 'asteroid-small-2', 'asteroid-small-3'
];

// The different small asteroid animations share the same sequences
// Note repeated blank frames at tail of exploding sequence
asteroids.smallAsteroidAnimationSequences =  {
  normal: {
    frames: [0],
    rate: 1/2
  },
  exploding: {
    frames: [1,2,3,3,3,3],
    rate: 1/5,
    loop: false
  }
};

asteroids.SmallAsteroid = Ngine.Sprite.extend({
  name: 'SmallAsteroid',

  // The Small Asteroid's properties control animations and appearance.
  // We receive the last position and angle of a medium asteroid that croaked,
  // and sort of tweak the values a little as if we knew how math worked...
  init: function(lastPosition, lastAngle) {
    var p;

    this._super({
      spriteIndex: 0,
      sheetName: asteroids.smallAsteroidAnimationGroupNames[0],
      animSetName: asteroids.smallAsteroidAnimationGroupNames[0],
      rate: 1/5,
      x: lastPosition.x * Ngine.PhysicsWorldDefaults.scale,
      y: lastPosition.y * Ngine.PhysicsWorldDefaults.scale,
      angle: lastAngle * Math.random() * (Math.PI / 2),
      shape: 'circle',
      shape_radius: 24,         // larger than the sprite graphic so we get edge collisions
      bodyType: 'dynamic',      // can bump into stuff
      linearDamping: 10.0,      // a little bit of drag seems to look right
      density: 50.0,            // big heavy rocks
      mass: 100,                // big heavy rocks
      howFastItScoots: 3000.0,  // needs a lotta scoot if it's heavy
      doSleep: false,
      exploding: false,
      isInitializing: true,
      fixedRotation: false,
      leftToRight: Math.random() * 2 > 1,
      collisionReported: false
    });

    p = this.properties;

    // Associate the spritesheet and animations now
    p.spriteIndex = Math.floor(Math.random() * 3);
    p.sheetName = asteroids.smallAsteroidAnimationGroupNames[p.spriteIndex];
    p.animSetName = asteroids.smallAsteroidAnimationGroupNames[p.spriteIndex];

    // Add animation and physics capabilities to the asteroid
    this.addComponent('animation');
    this.addComponent('physics');

    // Listen for physics system contact
    this.bind('contact', this, 'contact');

    if (asteroids.dbug) { console.log('Small Asteroid[' +
      this.properties.spriteIndex + '] created'); }
  },

  // Decision-making about which frames to present
  // On the first visit only we give it a little shove
  step: function(dt) {
    var myBody,
      worldCenter,
      p = this.properties;

    // Only apply force once to the asteroid, the first time we get here. After that it drifts...
    // Less randomness than the large asteroid.
    if (p.isInitializing) {
      myBody = this.physics.getBody();
      worldCenter = myBody.GetWorldCenter();
      randomPointOnBody = myBody.GetWorldPoint(new Ngine.B2d.Vec(10, 2));

      // Physics/entity angles match
      this.physics.setAngle(p.angle);

      myBody.ApplyForce({x: Math.cos(p.angle) * p.howFastItScoots,
          y: Math.cos(p.angle) * p.howFastItScoots},
        worldCenter);

      // Add a bit of random rotation
      myBody.SetAngularVelocity(Math.random());

      // Once is plenty
      p.isInitializing = false;
    }

    if (p.exploding) {
      this.play('exploding', 1);
    } else {
      this.play('normal');
    }

    this._super(dt);
  },

  // When an asteroid hits the ship, let the ship decide what to do.
  contact: function(contact) {
    if (contact.name && contact.name ==='Ship') {
      contact.handleContact(contact);
    }
  },

  // Makes the small asteroid asplode, called by the ship.
  // Contact object will represent this asteroid.
  // We don't care about the last position of a small asteroid
  explode: function (contact) {
    var that = this;

    that.properties.exploding = true;

    // One report per collision only please
    if (that.properties.collisionReported === false) {
      that.properties.collisionReported = true;
      setTimeout(function() {
        that.parentStage.remove(that);
        // Inner timeout to have the game handle the asteroid explosion
        setTimeout(function() {
          asteroids.Game.handleSmallAsteroidExplosion();
        }, 500); // inner timeout
      }, 250); // outer timeout
    }
  }

});