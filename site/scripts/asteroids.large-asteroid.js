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
      shape_radius: 29, // round asteroids for now
      bodyType: 'dynamic', // can bump into stuff
      linearDamping: 1.0, // a little bit of drag seems to look right
      howFastItScoots: 6.0, // slow
      doSleep: false,
      isExploding: false,
      isInitializing: true,
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

      // Once is plenty
      p.isInitializing = false;
    }

    // TODO explode
    if (p.isExploding) {
      this.play('exploding');
    } else {
      this.play('normal');
    }

    this._super(dt);
  }


});