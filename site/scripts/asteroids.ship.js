// Asteroids Ship module
// Version 0.1
// UW Gameplay, Winter Quarter 2013
// Mikey Micheletti
// Requires jquery, underscore.js, Box2dWeb.js and the various Ngine modules

// TODO Filter categories for the saucer

'use strict';

var Ngine = Ngine || { },
    asteroids = asteroids || { };

// The 'ship' sprites in the spritesheet
asteroids.shipAnimationGroupName = 'ship';

// Gameplay-specific animations we want to play from the sprites
// Note blank frames at end of explosions
asteroids.shipAnimationSequences = {
  stopped: {
    frames: [0],
    rate: 1/5
  },
  thrusting: {
    frames: [5,4],
    rate: 1/5
  },
  shields: {
    frames: [7],
    rate: 1/5
  },
  shieldsFading: {
    frames: [6],
    rate: 1/5
  },
  shieldsAndThrusting: {
    frames: [11],
    rate: 1/5
  },
  shieldsFadingAndThrusting: {
    frames: [9],
    rate: 1/5
  },
  exploding: {
    frames:[1,2,3,12,12,12,12],
    rate: 1/5,
    loop: false
  }
};

// Ship object in the asteroids game, that the player controls
asteroids.Ship = Ngine.Sprite.extend({
  name: 'Ship',

  // The Ship's properties control animations and appearance
  init: function() {
    this._super({
      sheetName: 'ship',
      animSetName: asteroids.shipAnimationGroupName,
      rate: 1/60,
      speed: 60,
      thrusting: false,
      firing: false,
      rotatingLeft: false,
      rotatingRight: false,
      canUseShields: true,
      shieldsOn: false,
      shieldsFading: false,
      exploding: false,
      ded: false,
      fixedRotation: true, // don't let collisions with shields on start us turning
      x: 320,
      y: 240,
      angle: 0, // really a radian
      radiansPerRotation: 0.0633, // amount to rotate per turn, either direction

      shape: 'polygon',
      shape_points: [[0,-26], [-16,20], [16,20]], // ship without shields is a triangle
      bodyType: 'dynamic', // can bump into stuff
      linearDamping: 2.0, // a little bit of drag seems to look right
      doSleep: false,
      collisionReported: false,
      shooting: false,
      bulletCount: 0, // number of bullets currently visible on the screen
      bulletMax: 15, // max number of bullets visible on the screen

      // Our sprites point up. Radians anticipate a rightward orientation.
      // The offset rotates our angle-sensitive thrust support 90 degrees counterclockwise.
      spriteRadianOffset: Math.PI / 2,

      pixelsToMove: 1 // amount to move with thrusters on, may want to have velocity later
    });

    // Add animation and physics capabilities to the ship
    this.addComponent('animation');
    this.addComponent('physics');

    // Connect the ship with keyboard events.
    // The event handlers just set properties.
    asteroids.Ngine.input.bind('thruster', this, 'thrusterOn');
    asteroids.Ngine.input.bind('thrusterUp', this, 'thrusterOff');
    asteroids.Ngine.input.bind('left', this, 'rotateLeftOn');
    asteroids.Ngine.input.bind('leftUp', this, 'rotateLeftOff');
    asteroids.Ngine.input.bind('right', this, 'rotateRightOn');
    asteroids.Ngine.input.bind('rightUp', this, 'rotateRightOff');
    asteroids.Ngine.input.bind('shield', this, 'shieldOn');
    asteroids.Ngine.input.bind('shieldUp', this, 'shieldOn');
    asteroids.Ngine.input.bind('fire', this, 'startShooting');
    asteroids.Ngine.input.bind('fireUp', this, 'stopShooting');

    // Listen for physics system contact with the ship so it can blow up
    this.bind('contact', this, 'contact');

    if (asteroids.dbug) { console.log('Ship Created'); }
  },

  // Decision-making about which animation to present based on current properties values.
  // Drawing to the canvas is then handed off to the Sprite.
  step: function(dt) {
    var p = this.properties;

    // recompute angle with each step
    if (p.rotatingLeft) {
      this.rotateLeftOn();
    } else if (p.rotatingRight) {
      this.rotateRightOn();
    }

    // If we're exploding and shields not on, well that's sad.
    if (p.exploding && !p.shieldsOn) {
      this.play('exploding', 1);

    } else if (p.thrusting) {

      if (p.shieldsFading) {
        this.play('shieldsFadingAndThrusting', 1);
      } else if (p.shieldsOn) {
        this.play('shieldsAndThrusting', 1);
      } else {
        this.play('thrusting', 1);
      }

    } else if (p.shieldsFading) {
      this.play('shieldsFading', 1);
    } else if (p.shieldsOn) {
        this.play('shields', 1);
    } else {
      this.play('stopped', 1);
    }
    this._super(dt);
  },

  // Display thruster graphic and apply force to get ship scooting.
  // Triggered by the up arrow key.
  thrusterOn: function() {
    var p = this.properties,
      cosOfAngle, // computed when thrusting
      sinOfAngle,
      myBody = this.physics.getBody(),
      howFastItScoots = 2.7; // about as fast as you can go and still hold still when you want to

    // Indicate we're thrusting to display the correct sprite
    this.properties.thrusting = true;

    cosOfAngle = Math.cos(p.angle - p.spriteRadianOffset); // direction x
    sinOfAngle = Math.sin(p.angle - p.spriteRadianOffset); // direction y

    // Translating forward vector around the radian.
    // Note that 360 degrees = 2 pi radians, 180 = pi, 90 = pi/2
    p.x += cosOfAngle;
    p.y += sinOfAngle;
    this.physics.setAngle(p.angle);

    // Apply a bit of force directly on the object's core to prevent rotation,
    // and send it on a vector in the direction we want to go.
    myBody.ApplyForce({x: cosOfAngle * howFastItScoots, y: sinOfAngle * howFastItScoots},
      myBody.GetWorldCenter());
  },

  // Remove thruster graphic. Force will no longer be applied.
  // Triggered by releasing the up arrow key.
  thrusterOff: function() {
    this.properties.thrusting = false;
  },

  // Increment leftward rotation in properties and physics, triggered by left arrow key.
  // Is also called from step() to allow smooth thrusting while turning.
  rotateLeftOn: function() {
    var p = this.properties;
    p.rotatingLeft = true;
    p.angle -= this.properties.radiansPerRotation;
    this.physics.setAngle(this.properties.angle);
  },

  // Stops leftward rotation, triggered by releasing left arrow key.
  rotateLeftOff: function() {
    this.properties.rotatingLeft = false;
  },

  // Increment rightward rotation in properties and physics, triggered by right arrow key.
  // Is also called from step() to allow smooth thrusting while turning.
  rotateRightOn: function() {
    var p = this.properties;
    p.rotatingRight = true;
    p.angle += this.properties.radiansPerRotation;
    this.physics.setAngle(this.properties.angle);
  },

  // Stops rightward rotation, triggered by releasing right arrow key.
  rotateRightOff: function() {
    this.properties.rotatingRight = false;
  },

  // Turns on shields and sets auto-shutdown timer if shields are permitted at this moment.
  // Triggered by down arrow key.
  // The body's fixture becomes round, and we crush all obstacles for a few seconds.
  shieldOn: function() {
    var ph = this.physics,
        body = ph.getBody(),
        fixtureDef = new Ngine.B2d.FixtureDef(),
        oldFixtures = body.GetFixtureList(),
        shieldRadius = 30 / this.parentStage.world.scale,
        that = this;

    // If we're allowed to use shields, do so, then set the timeout for shields to fade
    if (this.properties.canUseShields) {

      this.properties.shieldsOn = true;
      this.properties.canUseShields = false;
      this.properties.shieldsFading = false;

      fixtureDef.density = oldFixtures.GetDensity();
      fixtureDef.friction = oldFixtures.GetFriction();
      fixtureDef.restitution = oldFixtures.GetRestitution();
      fixtureDef.isSensor = oldFixtures.IsSensor();
      fixtureDef.shape = new Ngine.B2d.CircleShape(shieldRadius);

      body.DestroyFixture(oldFixtures);
      body.CreateFixture(fixtureDef);

      // Warn that shields are fading
      setTimeout(function() {
        that.properties.shieldsFading = true;
      }, 4750);

      // Turn shields off after a few seconds
      setTimeout(function() {
        that.shieldOff();
      }, 5000);

    // not permitted to use shields, blink the fade only
    } else {
      that.properties.shieldsFading = true;
      setTimeout(function() {
        that.properties.shieldsFading = false;
      }, 100);
    }
  },

  // Turns off shields. Called from a timeout set by shieldsOn.
  // Replaces this body's fixture with the polygon shape.
  shieldOff: function() {
    var ph = this.physics,
        body,
        fixtureDef,
        oldFixtures,
        shapePoints,
        scale,
        pointsObj,
        that = this;

    // Test here, as we may sometimes get called after the ship has been destroyed.
    if (ph && ph.getBody) {
      body = ph.getBody();
    } else {
      return;
    }
    fixtureDef = new Ngine.B2d.FixtureDef();
    oldFixtures = body.GetFixtureList();
    shapePoints = this.properties.shape_points; //[[0,-24], [-13,18], [13,18]],
    scale = this.parentStage.world.scale;

    this.properties.shieldsOn = false;
    this.properties.shieldsFading = false;

    fixtureDef.density = oldFixtures.GetDensity();
    fixtureDef.friction = oldFixtures.GetFriction();
    fixtureDef.restitution = oldFixtures.GetRestitution();
    fixtureDef.isSensor = oldFixtures.IsSensor();
    fixtureDef.shape = new Ngine.B2d.PolygonShape();

    pointsObj = _.map(shapePoints, function(pt) {
      return { x: pt[0] / scale, y: pt[1] / scale };
    });
    fixtureDef.shape.SetAsArray(pointsObj, shapePoints.length);

    body.DestroyFixture(oldFixtures);
    body.CreateFixture(fixtureDef);

    // Have to wait a bit before you can use shields again
    setTimeout(function() {
      that.properties.canUseShields = true;
    }, 15000);
  },

  // Bound to the physics system's beginContact event
  contact: function(contact) {
    this.handleContact(contact);
  },

  // Decides who, if anyone, explodes following contact.
  // The contact argument is from the physics system and represents the other guy.
  handleContact: function (contact) {
    var that = this;

    // Shields make the other objects explode
    if (that.properties.shieldsOn === true) {
      if (contact.name) {
        if (contact.name === 'LargeAsteroid' ||
            contact.name === 'MediumAsteroid' ||
            contact.name === 'SmallAsteroid' ||
            contact.name === 'LargeSaucer' ||
            contact.name === 'Bomb') {
          contact.explode(contact);
          // Shields are supposed to go off after first contact, but ship keeps blowed up :-(
        }
      }
    } else {

      // No shields. U R DED.
      // One report per collision only please
      if (that.properties.collisionReported === false) {
        that.properties.collisionReported = true;
        that.properties.exploding = true;
        that.properties.ded = true;

        // Outer timeout to remove the ship after the animation plays out
        setTimeout(function() {
          that.parentStage.remove(this);

          // Inner timeout to have the game handle the ship explosion
          setTimeout(function() {
            asteroids.Game.handleShipExplosion();
          }, 500); // inner timeout
        }, 250); // outer timeout
      }
    }
  },

  // Press spacebar, start shooting. Bang bang. Unless shields are on.
  startShooting: function() {
    if (this.properties.shieldsOn === false) {
      this.properties.shooting = true;
      this.shoot(true);
    }
  },

  // Release spacebar, stop shooting.
  stopShooting: function() {
    this.properties.shooting = false;
    this.shoot(false);
  },

  // When bangin is true, we shoot until we've got the max permitted bullets on the screen.
  // Bullets recycle themselves after they leave the screen edge. The second bullet
  // arg is only supplied by the bullet itself.
  shoot: function(bangin, bullet) {
    var that = this,
        p = that.properties,
        ph = that.physics,
        stage = asteroids.Game.gameStage,
        nextBullet;

    if (bangin) {
      // Less than max number of bullets visible? create a new one.
      if (p.bulletCount < p.bulletMax) {
        nextBullet = new asteroids.Bullet(that, p.x, p.y, p.angle);
        stage.insert(nextBullet);
        p.bulletCount += 1;
      }
    } else {
      // The bullet has let us know it's time to whack it.
      if (bullet) {
        stage.remove(bullet);
        p.bulletCount -= 1;
      }
    }
  }

}); // Ship

// The bullet uses a sprite, which is sort of silly, but that's what we gots.
asteroids.bulletAnimationGroupName = 'bullet';
asteroids.bulletAnimationSequences = {
  firing: {
    frames: [1,1,1,0,1,1,1,1],
    rate: 1/5
  },
  idle: {
    frames: [1],
    rate: 1/5
  }
};

// Bullet sprite object
asteroids.Bullet = Ngine.Sprite.extend({
  name: 'Bullet',

  // The Ship's properties control animations and appearance.
  // The ship instance, position and angle are supplied.
  init: function(ship, posX, posY, angle) {
    this._super({
      sheetName: asteroids.bulletAnimationGroupName,
      animSetName: asteroids.bulletAnimationSequences,
      ship: ship,
      x: posX,
      y: posY,
      origX: posX,
      origY: posY,
      angle: angle,
      rate: 1/60,
      speed: 100,
      width: 6,
      height: 18,
      shape: 'block',
      bodyType: 'dynamic',
      doSleep: false,
      bullet: true,
      mass: 10,
      density: 1,
      spriteRadianOffset: Math.PI / 2,
      pixelsToMove: 8,
      firing: false,
      isInitializing: true
    });

    this.addComponent('animation');
    this.addComponent('physics');

    this.bind('contact', this, 'contact');
   },

  // Step function creates the initial bullet and interacts with physics.
  // The step will schedule the bullet for removal if it gets too far downrange.
  step: function(dt) {
    var p = this.properties,
      myBody,
      cosOfAngle,
      sinOfAngle,
      initialVelocity;


      if (p.isInitializing) {

      // Translating forward vector around the radian.
      // Note that 360 degrees = 2 pi radians, 180 = pi, 90 = pi/2
      myBody = this.physics.getBody();
      cosOfAngle = Math.cos(p.angle - p.spriteRadianOffset);
      sinOfAngle = Math.sin(p.angle - p.spriteRadianOffset);
      p.x += cosOfAngle;
      p.y += sinOfAngle;
      this.physics.setAngle(p.angle);

      // Apply a bit of force directly on the object's core to prevent rotation,
      // and send it on a vector in the direction we want to go.
      myBody.ApplyImpulse({x: cosOfAngle * 100, y: sinOfAngle * 100},
        myBody.GetWorldCenter());

      p.isInitializing = false;
    }

    if (p.firing) {
      this.play('firing', 1);
    } else {
      this.play('idle');
    }

    this._super(dt);
    if (initialVelocity === null) {
      initialVelocity = this.physics.getVelocity();
    }

    // Short range bullets to avoid wraparounds and other weirdnesses
    if (Math.abs(p.origX - p.x) > 200) {
      this.removeBullet();
    } else if (Math.abs(p.origY - p.y) > 200) {
      this.removeBullet();
    } else if (this.physics.getVelocity() < initialVelocity) {
      this.removeBullet();
    }
  },

  // Bullets clobber asteroids
  contact: function(contact) {
    if (contact.name) {
      if (contact.name === 'LargeAsteroid' ||
        contact.name === 'MediumAsteroid' ||
        contact.name === 'SmallAsteroid' ||
        contact.name === 'LargeSaucer' ||
        contact.name === 'Bomb') {
        contact.explode(contact);
        this.removeBullet();
      }
    }
  },

  // Schedules the bullet for removal by the ship
  removeBullet: function() {
    this.properties.firing = false;
    this.properties.ship.shoot(false, this);
  }

});