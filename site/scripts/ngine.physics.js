// Ngine physics module
// Mikey Micheletti
// Version 0.1
// relies on ngine.js code, underscore.js, jquery.js, and (especially) Box2dWeb.
// Copied more than typical because scarcely understood.
// Builds on work by Pascal Rettig, Tom O'Connor, and Uli Hecht - thank you!

'use strict';

var Ngine = Ngine || {};

// Physics module
Ngine.Physics = function() {

  // Box2D modules shorthand
  var B2d = Ngine.B2d = {
    World:          Box2D.Dynamics.b2World,
    DebugDraw:      Box2D.Dynamics.b2DebugDraw,
    Vec:            Box2D.Common.Math.b2Vec2,
    AABB:           Box2D.Collision.b2AABB,
    BodyDef:        Box2D.Dynamics.b2BodyDef,
    Body:           Box2D.Dynamics.b2Body,
    FixtureDef:     Box2D.Dynamics.b2FixtureDef,
    Fixture:        Box2D.Dynamics.b2Fixture,
    PolygonShape:   Box2D.Collision.Shapes.b2PolygonShape,
    CircleShape:    Box2D.Collision.Shapes.b2CircleShape,
    Listener:       Box2D.Dynamics.b2ContactListener,
    MouseJointDef:  Box2D.Dynamics.Joints.b2MouseJointDef
    },
    PhysicsWorldComponent,  // defined below
    PhysicsActorComponent;  // defined below

  // Default properties for a Box2D world
  Ngine.PhysicsWorldDefaults = {
    gravityX: 0.0,
    gravityY: 0.0, // Nearly weightless
    scale: 30,
    velocityIterations: 8,
    positionIterations: 3,
    doSleep: true
  };

  // Default properties for a physics entity
  Ngine.PhysicsEntityDefaults = {
    // Bodies...
    allowSleep: true,
    linearDamping: 0.0,
    angularDamping: 0.0,
    bullet: false,
    fixedRotation: false,
    // mass: 0, // ???

    // Fixtures...
    shape: 'block',
    density: 1.0,
    friction: 1.0,
    restitution: 0.1,
    sSensor: false
    // shape_radius,
    // shape_width,
    // shape_height
  };

  // PhysicsWorldComponent
  // Manages the Box2D world object
  // Listens for contact events and dispatches them to the entities
  // Serves as a factory for rigid bodies
  PhysicsWorldComponent = {

    // added
    // Called when the component has been added to an entity, such as a Stage
    // Will create the Box2D world
    added: function(props) {
      this.b2dOptions = _(Ngine.PhysicsWorldDefaults).clone();
      if (props) {
        _(this.b2dOptions).extend(props);
      }
      this.scale = this.b2dOptions.scale;

      // Create a new gravity vector
      // Going with Tom's private variable underscore convention in this module, as the
      // subject is unfamiliar and this seems safer
      this._gravity = new B2d.Vec(this.b2dOptions.gravityX, this.b2dOptions.gravityY);

      // Create the Box2D world object
      this.world = new B2d.World(this._gravity, this.b2dOptions.doSleep);

      // Functions we will register as callbacks
      // Underscore will allow us to bind methods onto 'this' by name, so they can be
      // run in the context of 'this' regardless of when they are invoked. Nice trick.
      _.bindAll(this, 'beginContact', 'endContact', 'postSolve');

      // Create a Box2D contact listener and pass it to the Box2D world
      // This allows us to forward collisions to our sprites for game-specific handling
      this._listener = new B2d.Listener();
      this._listener.BeginContact = this.beginContact;  // Actors start touching
      this._listener.EndContact = this.endContact;      // Actors stop touching
      this._listener.PostSolve = this.postSolve;        // Actor causes impulse on another actor

      this.world.SetContactListener(this._listener);

      // Contact data structure, reusable to keep memory footprint lower
      // Events are triggered immediately, so game only needs access to current collision
      this.contactData = { };

      // When the entity updates, we'll also update this component
      this.entity.bind('step', this, 'boxStep');
    }, // added


    // setCollisionData
    // Populates reusable collision data object, which is passed to physics actors' event
    // handlers when a collision occurs
    setCollisionData: function(contact, impulse) {
      var entityA = contact.GetFixtureA().GetBody().GetUserData(),
          entityB = contact.GetFixtureB().GetBody().GetUserData();

      this.contactData['entityA'] = entityA;
      this.contactData['entityB'] = entityB;
      this.contactData['impulse'] = impulse;
      this.contactData['sprite'] = null;
    },


    // beginContact
    // Event handler/dispatcher fired when actors begin touching
    beginContact: function(contact) {
      this.setCollisionData(contact, null);
      this.contactData.entityA.trigger('contact', this.contactData.entityB);
      this.contactData.entityB.trigger('contact', this.contactData.entityA);
      this.entity.trigger('contact', this.contactData);
    },


    // endContact
    // Event handler/dispatcher fired when actors stop touching
    endContact: function(contact) {
      this.setCollisionData(contact, null);
      this.contactData.entityA.trigger('endContact', this.contactData.entityB);
      this.contactData.entityB.trigger('endContact', this.contactData.entityA);
      this.entity.trigger('endContact', this.contactData);
    },


    // postSolve
    // Event handler/dispatcher fired when an actor has an impulse on another actor
    postSolve: function(contact, impulse) {
      this.setCollisionData(contact, impulse);

      this.contactData['sprite'] = this.contactData.entityB;
      this.contactData.entityA.trigger('impulse', this.contactData);

      this.contactData['sprite'] = this.contactData.entityA;
      this.contactData.entityB.trigger('impulse', this.contactData);

      this.entity.trigger('impulse', this.contactData);
    },


    // createBody
    // Creates a new RigidBody based on our configuration properties
    createBody: function(def) {
      return this.world.CreateBody(def);
    }, //


    // destroyBody
    // Deletes the body from the physics world simulation. Expects a B2d.BodyDef arg.
    destroyBody: function(body) {
      return this.world.DestroyBody(body);
    },


    // boxStep
    // Responsible for stepping the world at the correct rate, using the elapsed time
    // since the previous update.
    boxStep: function(dt) {
      // no giant time steps
      if (dt > 1/20) {
        dt = 1/20;
      }
      this.world.Step(dt, this.b2dOptions.velocityIterations, this.b2dOptions.positionIterations);
    },


    // getEntityAtPosition
    // Returns the user data for the entity at the supplied x / y coordinates, or null if none.
    getEntityAtPosition: function(coordX, coordY) {
      var mousePVec = new B2d.Vec(coordX / this.scale, coordY / this.scale),
          aabb = new B2d.AABB(),
          selectedBody = null;

      aabb.lowerBound.Set(mousePVec.x - 0.001, mousePVec.y - 0.001);
      aabb.upperBound.Set(mousePVec.x + 0.001, mousePVec.y + 0.001);

      // inner function looks for any non-static body at this point
      function _getDynamicBodyCB(fixture) {
        // skip over static bodies
        if (fixture.GetBody.GetType() != B2d.Body.b2_staticBody) {
          // stop searching when we find any fixture
          if (fixture.GetShape().TestPoint(fixture.GetBody().GetTransform(), mousePVec)) {
            selectedBody = fixture.GetBody();
            return false;
          }
        }
        return true;
      }

      this.world.QueryAABB(_getDynamicBodyCB, aabb);
      if (selectedBody) {
        return selectedBody.GetUserData();
      }
      return null;
    }, // getEntityAtPosition


    // createMouseJoint
    // TODO: learn what this means.
    createMouseJoint: function(body, coordX, coordY) {
      var newJoint,
          newJointDef = new B2d.MouseJointDef();
      newJointDef.bodyA = this.world.GetGroundBody();
      newJointDef.bodyB = body;
      newJointDef.target.Set(coordX / this.scale, coordY / this.scale);
      newJointDef.collideConnected = true;
      newJointDef.maxForce = 300.0 * body.GetMass();
      newJoint = this.world.CreateJoint(newJointDef);
      body.SetAwake(true);
      return newJoint;
    },


    // destroyJoint
    // Removes a constraint from the system. Accepts any type.
    destroyJoint: function(joint) {
      this.world.DestroyJoint(joint);
    },


    // debug_draw
    // Sets debug-style rendering for bodies.
    debug_draw: function() {
      if (this._debugDraw) {
        this.world.DrawDebugData();
      }
    },


    // toggleDebugDraw
    // Partially completed function for enabling and disabling debug drawing of bodies.
    toggleDebugDraw: function(flag) {
      if (flag === false && this._debugDraw) {
        // TODO remove _debugDraw and use a secondary canvas (?)
      } else {
        this._debugDraw = new B2d.DebugDraw();
        this._debugDraw.SetSprite(Ngine.getInstance().getCanvasCtx());
        this._debugDraw.SetDrawScale(this.scale);
        this._debugDraw.SetFillAlpha(0.5);
        this._debugDraw.SetLineThickness(1.0);
        this._debugDraw.SetFlags(B2d.DebugDraw.e_shapeBit || B2d.DebugDraw.e_jointBit);
        this.world.SetDebugDraw(this._debugDraw);
      }
    }

  }; // PhysicsWorldComponent


  // PhysicsActorComponent
  // Including Tom's comments here, this section seems under current work...
  //
  // Constructor Properties (all optional):
  // Physics Body properties:
  //  bodyType - The body type: "static", "kinematic", or "dynamic".
  //  allowSleep - Set this flag to false if this body should never fall asleep.
  //  angularDamping - Angular damping is use to reduce the angular velocity.
  //  bullet - Is this a fast moving body that should be prevented from tunneling through other moving bodies?
  //  fixedRotation - Should this body be prevented from rotating? Useful for characters.
  //  linearDamping - Linear damping is use to reduce the linear velocity.
  //  angle - initial rotation
  //  mass - overrides density property of fixture
  //
  // Physics Shape properties:
  //  friction - The friction coefficient, usually in the range [0,1].
  //  density - The density, usually in kg/m^2.
  //  restitution - bounciness, how much velocity is conserved after a collision
  //  isSensor - A sensor shape collects contact information but never generates a collision response.
  //  shape - "circle", "block", "polygon"
  //  shape_radius - only used if shape is "circle", pulls from max(.width,.height) if none is set
  //      shape_width - only used if shape is "block", pulls from .width if none is set
  //  shape_height - only used if shape is "block", pulls from .height if none is set
  //  shape_points - only used if shape is polygon. array of points
  //
  // Public Functions:
  //  setPosition
  //  getVelocity / setVelocity
  //  getAngle / setAngle
  //  applyForce
  //  applyImpulse
  //
  // shared properties:
  //  - angle (with Sprite)
  PhysicsActorComponent = (function() {
    var vZero = new B2d.Vec(0, 0);

    return {

      // added
      // Called when the component has been added to an entity. Checks to see if the entity
      // has already been added to a stage - if so, creates the body, otherwise waits for the
      // sprite to be added.
      added: function() {
        if(this.entity.parentStage) {
          this.inserted();
        } else {
          this.entity.bind('inserted', this, 'inserted');
        }
        this.entity.bind('step', this, 'step');
        this.entity.bind('removed', this, 'removed');
      },


      // setPosition
      // Sets the body's position. It will be awake.
      setPosition: function(x, y) {
        var stage = this.entity.parentStage;
        this._body.SetAwake(true);
        this._body.SetPosition(new B2d.Vec(x / stage.world.scale, y / stage.world.scale));
      },

      // getPosition
      // Gets this body's position
      getPosition: function() {
        return this._body.GetPosition();
      },


      // setAngle
      // Sets the body's rotation.
      setAngle: function(angle) {
        this._body.SetAngle(angle);
      },

      // getAngle
      // Gets the body's rotation.
      getAngle: function() {
        return this._body.GetAngle();
      },


      // setVelocity
      // Sets the body's velocity. It will be awake.
      setVelocity: function(x, y) {
        var stage = this.entity.parentStage;
        this._body.SetAwake(true);
        this._body.SetLinearVelocity(new B2d.Vec(x / stage.world.scale, y / stage.world.scale));
      },

      // getVelocity
      // Gets the body's velocity.
      getVelocity: function() {
        return this._body.GetLinearVelocity();
      },


      // applyForce
      // Applies a central force to the body.
      applyForce: function(x, y) {
        var stage = this.entity.parentStage;
        var vForce = new B2d.Vec(x / stage.world.scale, y / stage.world.scale);
        this._body.ApplyForce( vForce, vZero );
      },


      // applyImpulse
      // Applies a central instant change in velocity to the body.
      applyImpulse: function(x, y) {
        var stage = this.entity.parentStage;
        var vForce = new B2d.Vec(x / stage.world.scale, y / stage.world.scale);
        this._body.ApplyImpulse( vForce, vZero );
      },


      // inserted
      // Called after the parent entity has been added to a stage. Creates the Box2D
      // rigid body that will be added to the world. Grabs properties from the parent
      // entity, or if none uses the Ngine defaults.
      inserted: function() {
        var entity = this.entity,
            stage = entity.parentStage,
            scale = stage.world.scale,
            props = entity.properties,
            defaultOps = Ngine.PhysicsEntityDefaults,
            properties = _(defaultOps).clone(),
            bodyDef,
            fixtureDef,
            massData;

        // Default properties
        if( props ) {
          _(properties).extend( props );
        }

        // If we have no mass and no density, then assume this is a static object
        if( (properties.density === undefined || properties.density === 0) &&
          (properties.mass === undefined || properties.mass === 0) ) {
          properties.bodyType = "static";
        }

        // Create a Body Definition, which Box2D needs to create a rigid body object
        bodyDef = new B2d.BodyDef();
        if( properties.bodyType == "static" ) {
          bodyDef.type = B2d.Body.b2_staticBody;
        } else if( properties.bodyType == "kinematic" ) {
          bodyDef.type = B2d.Body.b2_kinematicBody;
        } else {
          bodyDef.type = B2d.Body.b2_dynamicBody;
        }
        bodyDef.position.Set(properties.x/scale, properties.y/scale);
        bodyDef.active = true;
        bodyDef.allowSleep = properties.allowSleep;
        bodyDef.angularDamping = properties.angularDamping;
        bodyDef.bullet = properties.bullet;
        bodyDef.fixedRotation = properties.fixedRotation;
        bodyDef.linearDamping = properties.linearDamping;

        // Create a body from the definition
        this._body = stage.world.createBody(bodyDef);
        this._body.SetUserData(entity);

        // Create a Fixture definition, which Box2D needs to give a body collision
        fixtureDef = new B2d.FixtureDef();
        fixtureDef.density = properties.density;
        fixtureDef.friction = properties.friction;
        fixtureDef.restitution = properties.restitution;
        fixtureDef.isSensor = properties.isSensor;

        switch(properties.shape) {

          case "block":
            fixtureDef.shape = new B2d.PolygonShape();
            properties.shape_width = properties.shape_width || properties.width;
            properties.shape_height = properties.shape_height || properties.height;
            fixtureDef.shape.SetAsBox( properties.shape_width/2 / scale, properties.shape_height/2 / scale);
            break;

          case "circle":
            properties.shape_radius = properties.shape_radius || Math.max( properties.width, properties.height );
            fixtureDef.shape = new B2d.CircleShape(properties.shape_radius/scale);
            break;

          case "polygon":
            fixtureDef.shape = new B2d.PolygonShape();
            var pointsObj = _.map(properties.shape_points,function(pt) {
              return { x: pt[0] / scale, y: pt[1] / scale };
            });
            fixtureDef.shape.SetAsArray(pointsObj, properties.shape_points.length);
            break;
        }

        // Create a fixture from the definition
        this._body.CreateFixture(fixtureDef);

        // Support the user assigning the object mass or shape density
        if( properties.mass ) {
          // calculates fixture densities based on object's total mass
          massData = new Box2D.Collision.Shapes.b2MassData();
          massData.mass = properties.mass;
          this._body.SetMassData( massData );
        }
        else {
          // calculates mass based on fixtures' density
          this._body.ResetMassData();
        }

        if( properties.angle ) {
          this.setAngle( properties.angle );
        }
        // unique identifier, because why not
        this._body._bbid = properties.id;
      }, // inserted

      // removed
      // Called after the body's parent entity has been removed from the scene.
      // Removes the rigid body from the physics world.
      removed: function() {
        var entity = this.entity,
            stage = entity.parentStage;
        stage.world.destroyBody(this._body);
      },


      // step
      // Called after each physics engine step. Updates the sprites based on the
      // physics body's transform. Also handles asteroids game-specific wrapping.
      step: function() {
        var properties = this.entity.properties,
            stage = this.entity.parentStage,
            pos = this._body.GetPosition(),
            angle = this._body.GetAngle(),
            canvasWidth = this.entity.ngine.canvasWidth,    // width of canvas for wrapping
            canvasHeight = this.entity.ngine.canvasHeight,  // height of canvas for wrapping
            entityWidth = properties.width,                 // width of sprite image
            entityHeight = properties.height,               // height of sprite image
            slipPixels = 3,                                 // wiggle room for wrapping test
            stageScale = stage.world.scale,
            desiredPosX = pos.x,                            // x to position to if wrapping needed
            desiredPosY = pos.y,                            // y to position to if wrapping needed
            resetPosition = false;                          // if true, will wrap with setPosition

        // Asteroids-specific game viewport wrapping, could probably put inside a switch

        // Left / right edge wrapping
        if (properties.x + entityWidth < slipPixels) {
          properties.x = canvasWidth;
          desiredPosX = properties.x / stageScale;
          resetPosition = true;
        } else if ((properties.x + entityWidth) > (canvasWidth + entityWidth)) {
          properties.x = slipPixels;
          desiredPosX = properties.x / stageScale;
          resetPosition = true;
        }

        // Top/bottom edge wrapping
        if (properties.y + entityHeight < slipPixels) {
          properties.y = canvasHeight;
          desiredPosY = properties.y / stageScale;
          resetPosition = true;
        } else if ((properties.y + entityHeight) > (canvasHeight + entityHeight)) {
          properties.y = slipPixels;
          desiredPosY = properties.y / stageScale;
          resetPosition = true;
        }

        // If we're rewrapping, reset the position of the sprite
        if (resetPosition) {
          this._body.SetAwake(true);
          this._body.SetPosition(new B2d.Vec(desiredPosX, desiredPosY));
        }

        // Sync up the B2d and sprite coordinates and angle
        properties.x = desiredPosX * stage.world.scale;
        properties.y = desiredPosY * stage.world.scale;
        properties.angle = angle;

      },

      getBody: function() {
        return this._body;
      }

    }; // constructor return

  })(); // PhysicsActorComponent

  this.registerComponent('world', PhysicsWorldComponent);
  this.registerComponent('physics', PhysicsActorComponent);

}; // Ngine.Physics