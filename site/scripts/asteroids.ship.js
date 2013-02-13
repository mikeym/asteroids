// Asteroids Ship module
// Version 0.1
// UW Gameplay, Winter Quarter 2013
// Mikey Micheletti
// Requires jquery, underscore.js, Box2dWeb.js and the various Ngine modules

var Ngine = Ngine || { },
    asteroids = asteroids || { };

// The 'ship' sprites in the spritesheet
asteroids.shipAnimationGroupName = 'ship';

// Gameplay-specific animations we want to play from the sprites
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
  shieldsAndThrusting: {
    frames: [11],
    rate: 1/5
  },
  exploding: {
    frames:[1,2,3],
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
      rate: 1/10,
      speed: 60,
      thrusting: false,
      firing: false,
      rotatingLeft: false,
      rotatingRight: false,
      shieldsOn: false,
      exploding: false,
      ded: false,
      fixedRotation: true, // don't let collisions with shields on start us turning
      x: 320,
      y: 240,
      angle: 0, // really a radian
      radiansPerRotation: 0.333, // amount to rotate per turn, either direction

      shape: 'polygon',
      shape_points: [[0,-30], [-18,22], [18,22]], // ship without shields is a triangle
      bodyType: 'dynamic', // can bump into stuff
      linearDamping: 2.0, // a little bit of drag seems to look right
      doSleep: false,

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
    asteroids.Ngine.input.bind('left', this, 'rotateLeftOn'); // TODO
    asteroids.Ngine.input.bind('right', this, 'rotateRightOn'); // TODO
    asteroids.Ngine.input.bind('shield', this, 'shieldOn');
    asteroids.Ngine.input.bind('shieldUp', this, 'shieldOff');

    // Listen for physics system contact with the ship so it can blow up
    this.bind('contact', this, 'contact');

    if (asteroids.dbug) { console.log('Ship Created'); }
  },

  // Decision-making about which animation to present based on current properties values.
  // Drawing to the canvas is then handed off to the Sprite.
  step: function(dt) {
    var p = this.properties;

    // We explode on contact, triggering the explode animation, removing the ship
    // from the stage, and destroying it. If shields are up we're safe.
    if (p.exploding && !p.shieldsOn) {
      this.play('exploding', 1);
//      this.bind('animEnd', this, function() {
//        this.isVisible = false;
//      });

    } else if (p.thrusting) {

      // Thrusting movement handled by the thrusterOn and thrusterOff methods below

      if (p.shieldsOn) {
        // TODO add a time sustain to shields. Physics?
        this.play('shieldsAndThrusting', 1);
      } else {
        this.play('thrusting', 1);
      }

    } else if (p.shieldsOn) {
      this.play('shields', 1);
    } else {
      this.play('stopped', 1);
    }
    this._super(dt);
  },

  // Display thruster graphic and apply force to get ship scooting
  thrusterOn: function() {
    var p = this.properties,
      cosOfAngle, // computed when thrusting
      sinOfAngle,
      myBody = this.physics.getBody(),
      howFastItScoots = 1.5;

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
  thrusterOff: function() {
    this.properties.thrusting = false;
  },

  rotateLeftOn: function() {
    this.properties.angle -= this.properties.radiansPerRotation;
    this.physics.setAngle(this.properties.angle);
    // TODO fix rotation after colliding with shields
  },

  rotateRightOn: function() {
    this.properties.angle += this.properties.radiansPerRotation;
    this.physics.setAngle(this.properties.angle);
    // TODO fix rotation after colliding with shields
  },

  // Create a new round B2d fixture and set the shieldsOn property to false
  // TODO shields last for some specific amount of time, then turn off
  // TODO shields can only be turned on for certain conditions
  shieldOn: function() {
    var ph = this.physics,
        body = ph.getBody(),
        fixtureDef = new Ngine.B2d.FixtureDef(),
        oldFixtures = body.GetFixtureList(),
        shieldRadius = 30 / this.parentStage.world.scale;

    this.properties.shieldsOn = true;

    fixtureDef.density = oldFixtures.GetDensity();
    fixtureDef.friction = oldFixtures.GetFriction();
    fixtureDef.restitution = oldFixtures.GetRestitution();
    fixtureDef.isSensor = oldFixtures.IsSensor();
    fixtureDef.shape = new Ngine.B2d.CircleShape(shieldRadius);

    body.DestroyFixture(oldFixtures);
    body.CreateFixture(fixtureDef);
  },

  // Replace this body's fixture with the polygon and set the shieldsOn property to false
  // TODO decay stage of shields
  shieldOff: function() {
    var ph = this.physics,
        body = ph.getBody(),
        fixtureDef = new Ngine.B2d.FixtureDef(),
        oldFixtures = body.GetFixtureList(),
        shapePoints = this.properties.shape_points, //[[0,-24], [-13,18], [13,18]],
        scale = this.parentStage.world.scale,
        pointsObj;

    this.properties.shieldsOn = false;

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
  },

  // Bound to the physics system's beginContact event
  // Sets the exploding property to true. It gets handled in the step. Tell the game.
  contact: function(contact) {
    var that = this;

    // Shields protect from collisions
    if (that.properties.shieldOn === false) {
      that.properties.exploding = true;
      that.properties.ded = true;

      // Outer timeout to remove the ship after the animation plays out
      setTimeout(function() {
        that.parentStage.remove(this);

        // Inner timeout to have the game handle the ship explosion
        setTimeout(function() {
          asteroids.Game.handleShipExplosion();
        }, 1000); // inner timeout
      }, 500); // outer timeout

    }
  }

}); // Ship

