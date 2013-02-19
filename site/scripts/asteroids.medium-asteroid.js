// Asteroids Medium Asteroid module
// Version 0.1
// UW Gameplay, Winter Quarter 2013
// Mikey Micheletti
// Requires jquery, underscore.js, Box2dWeb.js and the various Ngine modules

'use strict';

var Ngine = Ngine || { },
  asteroids = asteroids || { };

// The names of the 3 sets of medium-sized asteroids sprites in the spritesheet
asteroids.mediumAsteroidAnimationGroupNames = [
  'asteroid-medium-1', 'asteroid-medium-2', 'asteroid-medium-3'
];

// The different medium asteroid animations share the same sequences
// Note repeated blank frames at tail of exploding sequence
asteroids.mediumAsteroidAnimationSequences =  {
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

asteroids.MediumAsteroid = Ngine.Sprite.extend({
  name: 'MediumAsteroid',

  // The Medium Asteroid's properties control animations and appearance.
  // We receive the last position and angle of a large asteroid that croaked,
  // and sort of tweak the values a little as if we knew how math worked...
  init: function(lastPosition, lastAngle) {
    var p;

    this._super({
      spriteIndex: 0,
      sheetName: asteroids.mediumAsteroidAnimationGroupNames[0],
      animSetName: asteroids.mediumAsteroidAnimationGroupNames[0],
      rate: 1/5,
      x: lastPosition.x * Ngine.PhysicsWorldDefaults.scale,
      y: lastPosition.y * Ngine.PhysicsWorldDefaults.scale,
      angle: lastAngle * Math.random() * (Math.PI / 2),
      shape: 'circle',
      shape_radius: 20,
      bodyType: 'dynamic',      // can bump into stuff
      linearDamping: 10.0,      // a little bit of drag seems to look right
      density: 75.0,            // big heavy rocks
      mass: 150,                // big heavy rocks
      howFastItScoots: 2900.0,  // needs a lotta scoot if it's heavy
      doSleep: false,
      exploding: false,
      isInitializing: true,
      fixedRotation: false,
      leftToRight: Math.random() * 2 > 1,
      collisionReported: false,
      isSensor: true // detect collisions but don't bounce, just overlap like in the olden days
    });

    p = this.properties;

    // Associate the spritesheet and animations now
    p.spriteIndex = Math.floor(Math.random() * 3);
    p.sheetName = asteroids.mediumAsteroidAnimationGroupNames[p.spriteIndex];
    p.animSetName = asteroids.mediumAsteroidAnimationGroupNames[p.spriteIndex];

    // Add animation and physics capabilities to the asteroid
    this.addComponent('animation');
    this.addComponent('physics');

    // Listen for physics system contact
    this.bind('contact', this, 'contact');

    if (asteroids.dbug) { console.log('Medium Asteroid[' +
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
    if (contact.name) {
      if (contact.name ==='Ship') {
        contact.handleContact(contact);
      } else if (contact.name === 'Bullet') {
        this.explode(contact);
        contact.removeBullet();
      }
    }
  },

  // Makes the medium asteroid asplode, called by the ship.
  // Contact object will represent this asteroid.
  explode: function (contact) {
    var that = this,
        lastPosition = contact.physics.getPosition(),
        lastAngle = contact.physics.getAngle();

    that.properties.exploding = true;

    // One report per collision only please
    if (that.properties.collisionReported === false) {
      that.properties.collisionReported = true;
      setTimeout(function() {
        that.parentStage.remove(that);
        // Inner timeout to have the game handle the asteroid explosion
        setTimeout(function() {
          asteroids.Game.handleMediumAsteroidExplosion(lastPosition, lastAngle);
        }, 500); // inner timeout
      }, 250); // outer timeout
    }
  }

});