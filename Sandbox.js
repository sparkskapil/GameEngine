class Player extends KinematicObject2D {
  constructor(x, y) {
    super(x, y);
  }

  OnCollisionBegin = (objects) => {
    let vel = this.GetVelocity();
    objects.forEach(item => {
      const { object } = item;
      if (!object.Name.includes('WALL'))
        return;

      if (object.Name.includes('BOTTOM') || object.Name.includes('TOP')) {
        vel.y *= -1;
      }

      if (object.Name.includes('LEFT') || object.Name.includes('RIGHT')) {
        vel.x *= -1;
      }
    });
    this.SetVelocity(vel);
  }

  WhileColliding(objects) {
    //console.log('colliding');

  }

  OnCollisionEnd(objects) {
    //console.log('collision end');
  }
  
}

class Wall extends GameObject2D {
  constructor(x, y) {
    super(x, y);
  }

  SetCollisionProps(W, H) {
    const collider = new BoxCollider2D(0, 0, W, H);
    collider.Attach(this);
  }
}

class Scene {
  constructor() {
    this.count = 0;
    this.objects = [];
  }

  AddToScene = (object) => {
    this.objects.push(object);
  }

  // Method will reset the current scene to original
  ResetScene() {
    this.objects = [];
    this.CreateScene();
  }

  CreateScene() {
    this.players = [];
    PhysicsEngine.Gravity = createVector(0, 200);
    const position = createVector(width / 2, height / 2);
    const playerStyle = new Box2D(100);
    playerStyle.SetColor(200, 200, 200);

    for (let i = 0; i < 1; i++) {
      const player = new Player(0, 0);

      const collider = new BoxCollider2D(0, 0, 100, 100);
      collider.Attach(player);

      player.SetDrawable(playerStyle);
      player.SetPosition(position);

      const velocity = createVector(0.35, -1)//p5.Vector.fromAngle(random(0, 2 * PI));
      velocity.mult(200);

      player.SetVelocity(velocity.x, velocity.y);
      // player.SetAngularVelocity(PI / 360);

      this.players.push(player);
    }

    const wallLeft = new Wall(5, height / 2);
    wallLeft.SetCollisionProps(5, height * 2);
    wallLeft.SetName('LEFTWALL');

    const wallRight = new Wall(width - 5, height / 2);
    wallRight.SetCollisionProps(5, height * 2);
    wallRight.SetName('RIGHTWALL');

    const topWall = new Wall(width / 2, 5);
    topWall.SetCollisionProps(width * 2, 5);
    topWall.SetName('TOPWALL');

    const wallBottom = new Wall(width / 2, height - 5);
    wallBottom.SetCollisionProps(width * 2, 50);
    wallBottom.SetName('BOTTOMWALL');

    this.players.forEach(this.AddToScene);

  }

  LoadAssets() {
  }

  //Handles drawing of objects
  Render() {
    background(51);
    this.objects.forEach(gameObject => {
      gameObject.Draw();
    });
  }

  //Handles physics
  Update(delta) {
    this.objects.forEach(gameObject => {
      if (gameObject.Update) {
        gameObject.Update(delta);
      }
    });
  }
}

SceneManager.AddScene("MainScene", new Scene());
