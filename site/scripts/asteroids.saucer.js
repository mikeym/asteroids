// Asteroids Saucer module
// Version 0.1
// UW Gameplay, Winter Quarter 2013
// Mikey Micheletti
// Requires jquery, underscore.js, Box2dWeb.js and the various Ngine modules

'use strict';

var Ngine = Ngine || { },
    asteroids = asteroids || { };

// Large Saucer.
// TODO implement small saucer once time permits

// The 'saucer-large' sprites in the spritesheet
asteroids.largeSaucerAnimationGroupName = 'saucer-large';

// Note blank frames at end of explosions
asteroids.largeSaucerAnimationSequences = {
  flying: {
    frames: [0,1,2],
    rate: 1/7
  },
  exploding: {
    frames:[3,4,5,6,6,6,6],
    rate: 1/5,
    loop: false
  }
};

// Large Saucer object in the asteroids game. Autonomous
asteroids.LargeSaucer = Ngine.Sprite.extend({
  name: 'LargeSaucer',

  // Initialize behavior and appearance
  init: function() {
    var p;

    this._super({
      sheetName: asteroids.largeSaucerAnimationGroupName,
      animSetName: asteroids.largeSaucerAnimationGroupName,
      rate: 1/60,
      speed: 60,
      exploding: false,
      x: 0,
      y: 0,
      angle: 0,
      shape: 'block',
      shape_width: 58,
      shape_height: 25,
      bodyType: 'dynamic',
      linearDamping: 2.0,
      fixedRotation: true,
      leftToRight: Math.random() * 2 > 1,
      doSleep: false,
      collisionReported: false,
      bombing: false, // true when launching la bomba
      nextBombTime: null, // set a timer so we don't launch too many
      nextManouverTime: new Date().getTime(),
      isInitializing: true,
      howFastItScoots: 20,
      impulseStrength: 13,
      isSensor: true,
      manouversBeforeBombLaunch: 10,
      currentManouverNumber: 10,
      myBombs: [ ]
    });

    p = this.properties;

    // Associate the spritesheet and animations now
    p.spriteIndex = Math.floor(Math.random() * 3);

    // Randomize saucer's starting position
    p.x = p.leftToRight? 0 - (p.width / 2) : this.ngine.canvasWidth;
    p.y = Math.floor(Math.random() * (560 - 40) + 40);

    // Add animation and physics capabilities to the asteroid
    this.addComponent('animation');
    this.addComponent('physics');

    // Listen for physics system contact
    this.bind('contact', this, 'contact');

    if (asteroids.dbug) { console.log('Large Saucer created'); }

  },

  // Decision-making about which frames to present, also jaggy movement direction changes.
  step: function(dt) {
    var sinOfAngle,
        myBody = this.physics.getBody(),
        worldCenter= myBody.GetWorldCenter(),
        xIsPositive,
        xNew,
        xStrength,
        yIsPositive,
        yNew,
        yStrength,
        p = this.properties,
        rightNow = new Date().getTime();

      // Randomized course-corrections, undoubtedly there's a proper way to do this...
      if (rightNow > p.nextManouverTime) {
        xIsPositive = Math.random() * 2 > 1;
        yIsPositive = Math.random() * 2 > 1;
        xNew = xIsPositive ? Math.random() : -1 * Math.random();
        yNew = yIsPositive ? Math.random() : -1 * Math.random();
        xStrength = p.impulseStrength * Math.random();
        yStrength = p.impulseStrength * Math.random();

        // Apply force the first time only, horizontally, after that use impulse drive
        if (p.isInitializing) {
          myBody.ApplyForce(
            myBody.GetWorldVector({x: xNew * p.howFastItScoots, y: 0}),
            worldCenter
          );
          p.isInitializing = false;

        } else {
          myBody.ApplyImpulse(
            myBody.GetWorldVector({x: xNew * xStrength, y: yNew * yStrength}),
            worldCenter
          );
        }

        // randomized time for course-correction
        p.nextManouverTime = new Date().getTime() + (2000 * Math.random());

        // every so often launch a bomb
        if (p.currentManouverNumber > p.manouversBeforeBombLaunch) {
          p.currentManouverNumber = 0;
          this.launchBomb();
        } else {
          p.currentManouverNumber += 1;
        }
      }

    if (p.exploding) {
      this.play('exploding', 1);
    } else {
      this.play('flying');
    }

    this._super(dt);
  },

  // When a saucer hits the ship, let the ship decide what to do.
  // When a bullet hits the saucer, we and all our bombs blow up.
  // Ignore collisions with asteroids.
  contact: function(contact) {
    var p = this.properties,
        i;

    if (contact.name) {
      if (contact.name ==='Ship') {
        contact.handleContact(contact);
      } else if (contact.name === 'Bullet') {
        this.explode(contact);
        contact.removeBullet();
        for (i = 0; i < p.myBombs.length; i++) {
          p.myBombs[i].explode();
        }

      }
    }
  },

  // Makes the large saucer asplode, called by the ship.
  // Contact object will represent this saucer.
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
          asteroids.Game.handleLargeSaucerExplosion(lastPosition, lastAngle);
        }, 500); // inner timeout
      }, 250); // outer timeout
    }
  },

  launchBomb: function() {
    var p = this.properties,
      stage = asteroids.Game.gameStage,
      theBomb;

    if (p.myBombs.length < 4) {
      theBomb = new asteroids.Bomb(this, p.x, p.y);
      p.myBombs.push(theBomb);
      stage.insert(theBomb);
    }
  },

  removeBomb: function(theBomb) {
    var stage = asteroids.Game.gameStage,
        p = this.properties,
        i;
    stage.remove(theBomb);
    for (i = 0; i < p.myBombs.length; i++) {
      if (p.myBombs[i] === theBomb) {
        p.myBombs.splice(i, 1);
      }
    }
  }

});

// Spinning bomb launched by the saucer
asteroids.bombAnimationGroupName = 'bomb';
asteroids.bombAnimationSequences = {
  spinning: {
    frames: [0],
    rate: 1/5
  },
  exploding: {
    frames: [1,2,2,2,2],
    rate: 1/5
  }
};

// Bomb sprite object
asteroids.Bomb = Ngine.Sprite.extend({
  name: 'Bomb',

  // The Saucer's instance and position are supplied.
  init: function(saucer, posX, posY) {
    this._super({
      sheetName: asteroids.bombAnimationGroupName,
      animSetName: asteroids.bombAnimationSequences,
      saucer: saucer,
      x: posX,
      y: posY,
      origX: posX,
      origY: posY,
      angle: 90,
      rate: 1/60,
      speed: 100,
      shape: 'circle',
      shape_radius: 10,
      bodyType: 'dynamic',
      doSleep: false,
      bullet: false,
      mass: 10,
      density: 1,
      pixelsToMove: 4,
      isInitializing: true,
      isExploding: false,
      isSensor: true
    });

    this.addComponent('animation');
    this.addComponent('physics');

    this.bind('contact', this, 'contact');
  },

  // Step function creates the bomb, gives it some spin, and sends it on its way.
  step: function(dt) {
    var p = this.properties,
      myBody,
      cosOfAngle,
      sinOfAngle;

    if (p.isInitializing) {

      myBody = this.physics.getBody();
      cosOfAngle = Math.cos(p.angle);
      sinOfAngle = Math.sin(p.angle);
      p.x += cosOfAngle;
      p.y += sinOfAngle;
      this.physics.setAngle(p.angle);

      // Apply a bit of force.
      myBody.ApplyImpulse({x: cosOfAngle * 50, y: sinOfAngle * 50},
        myBody.GetWorldCenter());

      // Bombs rotate
      myBody.SetAngularVelocity(5);

      p.isInitializing = false;
    }

    if (p.isExploding) {
      this.play('exploding', 1);
    } else {
      this.play('spinning');
    }

    this._super(dt);
  },

  // Bombs just clobber ships
  contact: function(contact) {
    if (contact.name) {
      if (contact.name ==='Ship') {
        this.explode(contact);
        contact.handleContact(contact);
      } else if (contact.name === 'Bullet') {
        this.explode(contact);
        contact.removeBullet(contact);
      }
    }
  },

  // Boomify
  explode: function() {
    var p = this.properties;
    p.isExploding = true;
    if (p.saucer && p.saucer.removeBomb) {
      p.saucer.removeBomb(this);
    }
  }

});
