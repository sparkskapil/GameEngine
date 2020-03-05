class Player extends KinematicObject2D {
  constructor(x, y) {
    super(x, y);
  }

  OnCollision(objects) {
    let { x, y } = this.velocity;
    objects.forEach(object => {
      if (object.object.GetName() == "LEFTWALL")
        x = Math.abs(x);
      if (object.object.GetName() == "RIGHTWALL")
        x = -Math.abs(x);
      if (object.object.GetName() == "TOPWALL")
        y = Math.abs(y);
      if (object.object.GetName() == "BOTTOMWALL")
        y = -Math.abs(y);
    });

    this.SetVelocity(x, y);
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
  }

  AddToScene = (object) => {
    this.objects.push(object);
  }

  CreateScene() {
    this.objects = [];
    PhysicsEngine.Gravity = createVector(0, 300);
    const position = createVector(width / 2, height / 2);
    const players = [];
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
      player.SetAngularVelocity(PI / 360);

      players.push(player);
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
    wallBottom.SetCollisionProps(width * 2, 5);
    wallBottom.SetName('BOTTOMWALL');

    players.forEach(this.AddToScene);

  }

  LoadAssets() {
  }

  //Handles drawing of objects
  Render() {
    this.count++;
    if (this.count % 500 == 0) {
      SceneManager.SetScene("Level1");
      SceneManager.ResetScene();
    }
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
SceneManager.AddScene("Level1", new Scene());
SceneManager.SetScene("MainScene");
