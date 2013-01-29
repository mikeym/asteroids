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
      ctx = n.getCanvasCtx(),
      logErrorOnce = true;

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
      
      lgeAsteroid1.draw(ctx, 10, 10, Math.floor(lgeAsteroidFrame1/slowdown));
      lgeAsteroidFrame1 = (lgeAsteroidFrame1 + 1) % (lgeAsteroid1.frames * slowdown);
      lgeAsteroid2.draw(ctx, 100, 10, Math.floor(lgeAsteroidFrame2/slowdown));
      lgeAsteroidFrame2 = (lgeAsteroidFrame2 + 1) % (lgeAsteroid2.frames * slowdown);
      lgeAsteroid3.draw(ctx, 200, 10, Math.floor(lgeAsteroidFrame3/slowdown));
      lgeAsteroidFrame3 = (lgeAsteroidFrame3 + 1) % (lgeAsteroid3.frames * slowdown);

      medAsteroid1.draw(ctx, 300, 10, Math.floor(medAsteroidFrame1/slowdown));
      medAsteroidFrame1 = (medAsteroidFrame1 + 1) % (medAsteroid1.frames * slowdown);
      medAsteroid2.draw(ctx, 400, 10, Math.floor(medAsteroidFrame2/slowdown));
      medAsteroidFrame2 = (medAsteroidFrame2 + 1) % (medAsteroid2.frames * slowdown);
      medAsteroid3.draw(ctx, 500, 10, Math.floor(medAsteroidFrame3/slowdown));
      medAsteroidFrame3 = (medAsteroidFrame3 + 1) % (medAsteroid3.frames * slowdown);

      smAsteroid1.draw(ctx, 300, 60, Math.floor(smAsteroidFrame1/slowdown));
      smAsteroidFrame1 = (smAsteroidFrame1 + 1) % (smAsteroid1.frames * slowdown);
      smAsteroid2.draw(ctx, 400, 60, Math.floor(smAsteroidFrame2/slowdown));
      smAsteroidFrame2 = (smAsteroidFrame2 + 1) % (smAsteroid2.frames * slowdown);
      smAsteroid3.draw(ctx, 500, 60, Math.floor(smAsteroidFrame3/slowdown));
      smAsteroidFrame3 = (smAsteroidFrame3 + 1) % (smAsteroid3.frames * slowdown);

      // only one frame each for these but hey
      bomb.draw(ctx, 600, 10, Math.floor(bombFrame/slowdown));
      bombFrame = (bombFrame + 1) % (bomb.frames * slowdown);
      pewpew.draw(ctx, 600, 60, Math.floor(pewpewFrame/slowdown));
      pewpewFrame = (pewpewFrame + 1) % (pewpew.frames * slowdown);

      lgeSaucer.draw(ctx, 10, 120, Math.floor(lgeSaucerFrame/slowdown));
      lgeSaucerFrame = (lgeSaucerFrame + 1) % (lgeSaucer.frames * slowdown);
      smSaucer.draw(ctx, 100, 120, Math.floor(smSaucerFrame/slowdown));
      smSaucerFrame = (smSaucerFrame + 1) % (smSaucer.frames * slowdown);

      ship.draw(ctx, 200, 120, Math.floor(shipFrame/slowdown));
      shipFrame = (shipFrame + 1) % (ship.frames * slowdown);
    })

  } else {
    console.log('unable to load spritesheet.')
  }
}
