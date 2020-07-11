class Player extends KinematicObject2D {
  constructor(x, y) {
    super(x, y);
    this.SetVelocity(0, 50);

    this.started = false;
    this.dead = false;
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
    this.dead = true;
    this.SetVelocity(0, 0);
    this.SetAcceleration(0, 0);
    this.SetAngularVelocity(0);
    this.Drawable.StopAnimation();
  }

  WhileColliding(objects) {
  }

  OnCollisionEnd(objects) {
  }

  KeyPressed(event) {
    //Game started
    if (!this.started && !this.dead) {
      this.started = true;
      this.SetAcceleration(0, 800);
    }
    if (!this.dead)
      this.SetVelocity(0, -400);
  }

  KeyReleased(event) {

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

class Pipe extends KinematicObject2D {

  static GetWidth() {
    return 100;
  }

  static GetHeight() {
    return 3 * height / 4;
  }

  constructor(x, y, isTop) {
    super(x, y);
    this.width = Pipe.GetWidth();
    this.height = Pipe.GetHeight();
    const pipeStyle = new Sprite(AssetManager.GetLoadedImage('pipe'), this.width, this.height);
    this.SetDrawable(pipeStyle);
    this.velocity = -100

    if (!isTop) {
      this.SetRotation(PI);
    }
    this.SetVelocity(this.velocity, 0);
  }

}

class Background extends GameObject2D {
  constructor(x, y) {
    super(x, y);
  }
}

class Scene {
  constructor() {
    this.count = 0;
    this.objects = [];
    this.player = null;
    this.pipesCount = 5;
  }

  AddToScene = (object) => {
    this.objects.push(object);
  }

  RemoveFromScene = (object) => {
    const index = this.objects.findIndex(obj => object.GetName() === obj.GetName())
    this.objects.splice(index, 1);
  }

  // Method will reset the current scene to original
  ResetScene() {
    this.objects = [];
    this.CreateScene();
  }

  CreateBG() {
    const position = createVector(width / 2, height / 2);
    const backgroundImage = new Sprite(AssetManager.GetLoadedImage('background'), width, height);
    const background = new Background(0, 0);

    background.SetDrawable(backgroundImage);
    background.SetPosition(position);
    this.AddToScene(background);
  }

  CreatePlayer() {
    const position = createVector(width / 4 + 150, height / 2);
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
    this.player = new Player(0, 0);
    const collider = new BoxCollider2D(0, 0, 50, 50);
    collider.Attach(this.player);

    this.player.SetDrawable(playerStyle);
    this.player.SetPosition(position);
    this.AddToScene(this.player);
  }

  CreatePipes() {
    for (let i = 0; i < this.pipesCount; i++) {
      this.CreatePipe(width / 4 + i * 400 + Pipe.GetWidth(), height / 2 + random(-1, 1) * 200, 200);
    }
  }

  CreatePipe(x, y, gap) {
    const pipeTop = new Pipe(0, 0);
    const pipeBottom = new Pipe(0, 0, true);

    pipeTop.SetPosition(x, y - Pipe.GetHeight() / 2 - gap / 2);
    pipeBottom.SetPosition(x, y + Pipe.GetHeight() / 2 + gap / 2);
    this.AddToScene(pipeTop);
    this.AddToScene(pipeBottom);
  }

  IsPipeOffscreen(pipe) {
    const position = pipe.GetPosition()
    const width = pipe.width
    if (!position || !width)
      return true;
    if ((position.x + width / 2) < 0)
      return true;
    return false;
  }

  CreateScene() {
    this.CreateBG();
    this.CreatePipes();
    this.CreatePlayer();

    const wallBottom = new Wall(width / 2, height - 5);
    wallBottom.SetCollisionProps(width * 2, 50);
    wallBottom.SetName('BOTTOMWALL');
  }

  LoadAssets() {
    AssetManager.ImportImage('player', './assets/flappy.png');
    AssetManager.ImportImage('bird', './assets/bird.png');
    AssetManager.ImportImage('background', './assets/background.png');
    AssetManager.ImportImage('pipe', './assets/pipe.png');
    AssetManager.LoadAssets();
  }

  OnUpdate() {
    let pipes = [];
    for (let i = 0; i < this.objects.length; i++) {
      if ((this.objects[i] instanceof Pipe) == false)
        continue;
      if (this.IsPipeOffscreen(this.objects[i])) {
        pipes.push(this.objects[i]);
      }
    }
    if (!pipes.length) return;

    for (let i = 0; i < pipes.length; i++) {
      this.RemoveFromScene(pipes[i])
    }

    let lastPipe = null;
    for (let i = this.objects.length - 1; i >= 0; i--) {
      if (this.objects[i] instanceof Pipe) {
        lastPipe = this.objects[i];
        break;
      }
    }
    this.CreatePipe(lastPipe.GetPosition().x + 400 + Pipe.GetWidth(), height / 2 + random(-1, 1) * 200, 200);
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
    this.OnUpdate();
    this.objects.forEach(gameObject => {
      if (gameObject.Update) {
        gameObject.Update(delta);
      }
    });
  }

  //KeyEvents
  KeyPressed(event) {
    this.objects.forEach(gameObject => gameObject.KeyPressed ? gameObject.KeyPressed(event) : null);
  }

  KeyReleased(event) {
    this.objects.forEach(gameObject => gameObject.keyReleased ? gameObject.KeyReleased(event) : null);
  }
}

SceneManager.AddScene("MainScene", new Scene());

