// Asteroids main gameplay logic module
// Version 0.1
// UW Gameplay, Winter Quarter 2013
// Mikey Micheletti
// Requires jquery, underscore.js, Box2dWeb.js and various Ngine and Asteroids modules

'use strict';

var Ngine = Ngine || { },
    asteroids = asteroids || { };

// Asteroids Game module
asteroids.Game = {
  name: 'Asteroids Game',

  // Game max constants for tests
  maxAsteroids: 26,
  maxLargeSaucers: 1,
  maxSmallSaucers: 1,
  maxShips: 1,

  // Counts of game objects in current play
  countLargeAsteroids: 0,
  countMediumAsteroids: 0,
  countSmallAsteroids: 0,
  countLargeSaucers: 0,
  countSmallSaucers: 0,
  countAvailableLives: 3000000, // TODO should be 3, big now for testing

  // Let's keep score...
  score: 0,
  largeAsteroidScoreBump: 20,
  mediumAsteroidScoreBump: 50,
  smallAsteroidScoreBump: 100,
  largeSaucerScoreBump: 200,
  smallSaucerScoreBump: 1000,
  extraLifeThreshold: 10000,
  lastExtraLifeGiven: 0,

  // Start out with four large asteroids, increase by one each level up to a max of 12
  currentLevel: 0,
  numberOfLargeAsteroidsInFirstLevel: 4,
  maxLargeAsteroidsToStartALevel: 12,

  // Important Ngine components
  gameScene: null, // game scene, we'll set this later
  gameStage: null, // game stage, we'll set this later

  // Returns true if the player has eliminated all asteroids and saucers, false otherwise
  hasClearedLevel: function() {
    if (this.countLargeAsteroids === 0 &&
        this.countMediumAsteroids === 0 &&
        this.countSmallAsteroids === 0 &&
        this.countLargeSaucers === 0 &&
        this.countSmallSaucers === 0) {
      return true;
    }
    return false;
  },

  // Increments the score and checks to see if we should add another life for this player
  bumpScore: function(bump) {
    this.score += bump;
    if(this.score - this.lastExtraLifeGiven >= this.extraLifeThreshold) {
      this.countAvailableLives += 1;
      // TODO fanfare or something
    }
    if (asteroids.dbug) {
      console.log('Score: ' + this.score + ', Lives: ' + this.countAvailableLives);
    }
  },

  // Starts gameplay at some specific level.
  // Increments number of large asteroids and enforces maximum.
  // Clears and creates game stage and scenes.
  startLevel: function(levelNumber) {
    var that = this,
        i,
        n = Ngine.getInstance(),
        bigAsteroids = Math.min(this.numberOfLargeAsteroidsInFirstLevel + levelNumber,
                                this.maxLargeAsteroidsToStartALevel);

    // cleanup and make all the old stuff go away
    n.clearStages();

    // create a new game scene
    that.gameScene = new Ngine.Scene(function(stage) {
      stage.addComponent('world');
      that.gameStage = stage;

      // Now setup the level with the right number of asteroids and ship or whatever
      if (that.countAvailableLives > 0) {
        that.gameStage.insert(new asteroids.Ship());
        for (i = 0; i < bigAsteroids; i++ ) {
          that.gameStage.insert(new asteroids.LargeAsteroid());
        }
        if (asteroids.dbug) {
          console.log('Game Level ' + levelNumber + ' started with ' +
                      bigAsteroids + ' big asteroids.');
        }
      } else {
        // TODO prompt to play again, no more lives
        if (asteroids.dbug) { console.log('Too Bad So Sad Yer Daid.'); }
      }
    });

    // Add the scene to the game and stage it
    n.addScene('AsteroidsGame', that.gameScene);
    n.stageScene('AsteroidsGame');

  },

  // Called when the ship explodes, replay same level or new game
  handleShipExplosion: function() {
    if (asteroids.dbug) { console.log('Handling ship explosion in Game'); }

    this.countAvailableLives -= 1;
    if (this.countAvailableLives > 0) {
      this.startLevel(this.currentLevel);
    } else {
      // TODO ask 'em for a quarter, start overs...
    }
  },

  // Called when a large asteroid explodes, will never indicate the end of a level
  handleLargeAsteroidExplosion: function() {
    this.bumpScore(this.largeAsteroidScoreBump);
    // TODO create two medium asteroids where the large asteroid was
  },

  // Called when a medium asteroid explodes, will never indicate the end of a level
  handleMediumAsteroidExplosion: function() {
    this.bumpScore(this.mediumAsteroidScoreBump);
    // TODO create two small asteroids where the medium asteroid was
  },

  // Called when a small asteroid explodes, may indicate we've cleared the level
  // Otherwise no action needed besides scorekeeping
  handleSmallAsteroidExplosion: function() {
    this.bumpScore(this.smallAsteroidScoreBump);
    if (this.hasClearedLevel) {
      this.currentLevel += 1;
      this.startLevel(this.currentLevel);
    }
  },

  // Called when a large saucer explodes, may indicate we've cleared the level
  handleLargeSaucerExplosion: function() {
    this.bumpScore(this.largeSaucerScoreBump);
    if (this.hasClearedLevel) {
      this.currentLevel += 1;
      this.startLevel(this.currentLevel);
    }

    // TODO add another saucer after a timer?
    // TODO add a small saucer instead? How do you decide?
  },

  // Called when a small saucer explodes, may indicate we've cleared the level
  handleSmallSaucerExplosion: function() {
    this.bumpScore(this.smallSaucerScoreBump);
    if (this.hasClearedLevel) {
      this.currentLevel += 1;
      this.startLevel(this.currentLevel);
    }
    // TODO add another saucer after a timer?
  },

  handleMenu: function() {
    // TODO show the menu if we have one, pause game
  },

//  // Starts up the game and sets the game scene and stage at a particular level
//  setGameScene: function(level) {
//    var that = this;
//    this.gameScene = new Ngine.Scene(function(stage) {
//      stage.addComponent('world');
//      that.gameStage = stage;
//      that.startLevel(level);
//      })
//    }
};




