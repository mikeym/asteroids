// Asteroids basic sprites test script
// Version 0.1
// UW Gameplay, Winter Quarter 2013
// Mikey Micheletti
// Requires jquery, underscore.js, and the various Ngine modules

'use strict';

var asteroids = asteroids || {};

asteroids.dbug = true;

asteroids.loader = (function () {
  var that = this,
    a = asteroids,
    firstRun = true,
    resourcesLoaded = 0;

  if (a.dbug) { console.log('asteroids.loader loaded'); }

  if (firstRun) {
    firstRun = false;

    Modernizr.load([
      {
        load: [
          '../scripts/underscore-min.js',
          '../scripts/plugins.js',

          // the Ngine script load order is significant...
          '../scripts/ngine.js',
          '../scripts/ngine.gameloop.js',
          '../scripts/ngine.evented.js',
          '../scripts/ngine.component.js',
          '../scripts/ngine.entity.js',
          '../scripts/ngine.canvas2d.js',
          '../scripts/ngine.input.js',
          '../scripts/ngine.assets.js',
          '../scripts/ngine.sprites.js'

        ],
        complete: function () {
          if (a.dbug) { console.log('asteroids.loader Modernizr load complete'); }

          // Create Ngine instance, pointing to resource paths
          a.Ngine = new Ngine();
          a.Ngine.options.imagePath = '../images/';
          a.Ngine.options.dataPath = '';
          a.Ngine.options.fontsPath = '../fonts/';

          // Load game assets
          if (a.dbug) { console.log('loading game assets...'); }
          // Hook up the sprites module, and setup a test canvas
          a.Ngine.includeModule('Sprites');
          a.Ngine.setupCanvas('gamecanvas', {desiredWidth : 640, desiredHeight : 480});
          a.Ngine.load(['asteroids-game-sprites.png', 'asteroids-game-sprites.json'],
                       TestSprites);

        }
      }
    ]);
  }
})();

// Lets see the game art
function TestSprites() {
  var slowdown = 20,
      lgeAsteroid1, lgeAsteroid2, lgeAsteroid3,
      medAsteroid1, medAsteroid2, medAsteroid3,
      smAsteroid1, smAsteroid2, smAsteroid3,
      lgeSaucer, smSaucer, ship,
      bomb, pewpew,
      lgeAsteroidFrame1 = 0,
      lgeAsteroidFrame2 = 0,
      lgeAsteroidFrame3 = 0,
      medAsteroidFrame1 = 0,
      medAsteroidFrame2 = 0,
      medAsteroidFrame3 = 0,
      smAsteroidFrame1 = 0,
      smAsteroidFrame2 = 0,
      smAsteroidFrame3 = 0,
      bombFrame = 0,
      pewpewFrame = 0,
      lgeSaucerFrame = 0,
      smSaucerFrame = 0,
      shipFrame = 0,
      n = asteroids.Ngine,
      ctx = Ngine.getInstance().getCanvasCtx(),
      logErrorOnce = true;
  console.log('TestSprites');

  n.compileSheets('asteroids-game-sprites.png', 'asteroids-game-sprites.json');
  lgeAsteroid1 = n.getSpritesheet('asteroid-large-1');
  lgeAsteroid2 = n.getSpritesheet('asteroid-large-2');
  lgeAsteroid3 = n.getSpritesheet('asteroid-large-3');
  medAsteroid1 = n.getSpritesheet('asteroid-medium-1');
  medAsteroid2 = n.getSpritesheet('asteroid-medium-2');
  medAsteroid3 = n.getSpritesheet('asteroid-medium-3');
  smAsteroid1 = n.getSpritesheet('asteroid-small-1');
  smAsteroid2 = n.getSpritesheet('asteroid-small-2');
  smAsteroid3 = n.getSpritesheet('asteroid-small-3');
  bomb = n.getSpritesheet('bomb');
  pewpew = n.getSpritesheet('pew-pew')
  lgeSaucer = n.getSpritesheet('saucer-large');
  smSaucer = n.getSpritesheet('saucer-small');
  ship = n.getSpritesheet('ship');

  // If we got these we're probably fine...
  if (lgeAsteroid1 && lgeAsteroid2 && lgeAsteroid3) {

    // Each time we loop (slowly) draw each frame of each spritesheet
    n.setGameLoop( function() {
      n.clearCanvas();

      // Position sprites on center, test rotation and alpha support
      lgeAsteroid1.draw(ctx, 50, 50, Math.floor(lgeAsteroidFrame1/slowdown), 64, 64, 0, 1.0);
      lgeAsteroidFrame1 = (lgeAsteroidFrame1 + 1) % (lgeAsteroid1.frames * slowdown);
      lgeAsteroid2.draw(ctx, 150, 50, Math.floor(lgeAsteroidFrame2/slowdown), 64, 64, 0, 1.0);
      lgeAsteroidFrame2 = (lgeAsteroidFrame2 + 1) % (lgeAsteroid2.frames * slowdown);
      lgeAsteroid3.draw(ctx, 250, 50, Math.floor(lgeAsteroidFrame3/slowdown), 64, 64, 0, 1.0);
      lgeAsteroidFrame3 = (lgeAsteroidFrame3 + 1) % (lgeAsteroid3.frames * slowdown);

      medAsteroid1.draw(ctx, 350, 50, Math.floor(medAsteroidFrame1/slowdown), 40, 40, 0, 1.0);
      medAsteroidFrame1 = (medAsteroidFrame1 + 1) % (medAsteroid1.frames * slowdown);
      medAsteroid2.draw(ctx, 450, 50, Math.floor(medAsteroidFrame2/slowdown), 40, 40, 0, 1.0);
      medAsteroidFrame2 = (medAsteroidFrame2 + 1) % (medAsteroid2.frames * slowdown);
      medAsteroid3.draw(ctx, 550, 50, Math.floor(medAsteroidFrame3/slowdown), 40, 40, 0, 1.0);
      medAsteroidFrame3 = (medAsteroidFrame3 + 1) % (medAsteroid3.frames * slowdown);

      smAsteroid1.draw(ctx, 350, 110, Math.floor(smAsteroidFrame1/slowdown), 24, 24, 0, 1.0);
      smAsteroidFrame1 = (smAsteroidFrame1 + 1) % (smAsteroid1.frames * slowdown);
      smAsteroid2.draw(ctx, 450, 110, Math.floor(smAsteroidFrame2/slowdown), 24, 24, 0, 1.0);
      smAsteroidFrame2 = (smAsteroidFrame2 + 1) % (smAsteroid2.frames * slowdown);
      smAsteroid3.draw(ctx, 550, 110, Math.floor(smAsteroidFrame3/slowdown), 24, 24, 0, 1.0);
      smAsteroidFrame3 = (smAsteroidFrame3 + 1) % (smAsteroid3.frames * slowdown);

      // only one frame each for these but hey
      bomb.draw(ctx, 650, 50, Math.floor(bombFrame/slowdown), 20, 20, 0, 1.0);
      bombFrame = (bombFrame + 1) % (bomb.frames * slowdown);
      pewpew.draw(ctx, 650, 110, Math.floor(pewpewFrame/slowdown), 6, 18, 0, 1.0);
      pewpewFrame = (pewpewFrame + 1) % (pewpew.frames * slowdown);

      // large saucer drawn at 50% opacity
      lgeSaucer.draw(ctx, 50, 170, Math.floor(lgeSaucerFrame/slowdown), 64, 36, 0, 0.5);
      lgeSaucerFrame = (lgeSaucerFrame + 1) % (lgeSaucer.frames * slowdown);

      smSaucer.draw(ctx, 150, 170, Math.floor(smSaucerFrame/slowdown), 64, 36, 0, 1.0);
      smSaucerFrame = (smSaucerFrame + 1) % (smSaucer.frames * slowdown);

      // Ship drawn at an angle
      ship.draw(ctx, 250, 170, Math.floor(shipFrame/slowdown), 64, 64, 0.3, 1.0);
      shipFrame = (shipFrame + 1) % (ship.frames * slowdown);
    })

  } else {
    console.log('unable to load spritesheet.')
  }
}
