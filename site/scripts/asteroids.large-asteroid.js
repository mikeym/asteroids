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
// Note repeated blank frames at tail of exploding sequence
asteroids.largeAsteroidAnimationSequences =  {
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

asteroids.LargeAsteroid = Ngine.Sprite.extend({
  name: 'LargeAsteroid',

  // The Large Asteroid's properties control animations and appearance
  init: function() {
    var p;

    this._super({
      spriteIndex: 0,
      sheetName: asteroids.largeAsteroidAnimationGroupNames[0],
      animSetName: asteroids.largeAsteroidAnimationGroupNames[0],
      rate: 1/5,
      x: 0,
      y: 0,
      angle: 0,
      shape: 'circle',
      shape_radius: 38,         // larger than the sprite graphic so we get edge collisions
      bodyType: 'dynamic',      // can bump into stuff
      linearDamping: 10.0,      // a little bit of drag seems to look right
      density: 100.0,           // big heavy rocks
      mass: 200,                // big heavy rocks
      howFastItScoots: 2500.0,  // needs a lotta scoot if it's heavy
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

    if (asteroids.dbug) { console.log('Large Asteroid[' +
                          this.properties.spriteIndex + '] created'); }
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

    if (p.exploding) {
      this.play('exploding', 1);
    } else {
      this.play('normal');
    }

    this._super(dt);
  },

  // When an asteroid hits the ship, let the ship decide what to do.
  // When a bullet hits the asteroid, we blow up.
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

  // Makes the large asteroid asplode, called by the ship.
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
            asteroids.Game.handleLargeAsteroidExplosion(lastPosition, lastAngle);
        }, 500); // inner timeout
      }, 250); // outer timeout
    }
  }

});