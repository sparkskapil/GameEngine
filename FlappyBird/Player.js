class Player extends KinematicObject2D {
  constructor() {
    super(0, 0);
    // Bird State
    this.started = false;
    this.dead = false;

    // Bird Animation
    const playerStyle = new AnimatedSprite(AssetManager.GetLoadedImage('bird'), 276, 64);
    const frames = [
      {
        key: 'frame_0',
        position: {
          x: 0,
          y: 0,
          w: 91,
          h: 64
        }
      },
      {
        key: 'frame_1',
        position: {
          x: 92,
          y: 0,
          w: 91,
          h: 64
        }
      },
      {
        key: 'frame_2',
        position: {
          x: 184,
          y: 0,
          w: 91,
          h: 64
        }
      }
    ];
    playerStyle.SetFrames(frames);
    playerStyle.SetAnimationSpeed(0.1);

    // Bird Collider
    const collider = new BoxCollider2D(0, 0, 50, 50);
    collider.Attach(this);
    this.SetDrawable(playerStyle);

    //Kinematics Configuration
    this.speed = 100;
    this.gravity = 1000;
    this.jumpSpeed = -400;

    this.SetVelocity(0, this.speed);

    const position = createVector(width / 4 + 150, height / 2);
    this.SetPosition(position);
  }

  Draw() {
    super.Draw();
  }

  Update(delta) {
    super.Update(delta);

    // oscillate bird when game is not started
    if (!this.basePosition)
      this.basePosition = createVector(this.x, this.y);
    if (!this.started && !this.dead) {
      if (Math.abs(this.y - this.basePosition.y) > 15)
        this.velocity.y = this.velocity.y * -1;
    }

    if (!this.started)
      return;

    if (this.GetPosition().y < 0)
      this.SetPosition(this.GetPosition().x, 0);

    if (this.velocity.y > 0)
      this.SetRotation(PI / 6);
    else if (this.velocity.y < 0)
      this.SetRotation(-PI / 3);
  }

  IsDead() {
    return this.dead;
  }

  Restart() {
    this.dead = false;
    this.started = false;
  }

  OnCollisionBegin = (objects) => {
    this.SetVelocity(0, 0);
    this.SetAcceleration(0, 0);
    this.SetAngularVelocity(0);
    this.Drawable.StopAnimation();
    this.dead = true;
  }

  WhileColliding(objects) {
  }

  OnCollisionEnd(objects) {
  }

  KeyPressed(event) {
    //Game started
    if (event.key !== " " && event.key !== "ArrowUp")
      return;

    if (!this.started && !this.dead) {
      this.started = true;
      this.SetAcceleration(0, this.gravity);
    }
    if (!this.dead)
      this.SetVelocity(0, this.jumpSpeed);
  }

  KeyReleased(event) {

  }

}