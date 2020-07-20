class Player extends KinematicObject2D {
  constructor(x, y) {
    super(x, y);
    this.SetVelocity(0, 25);

    this.started = false;
    this.dead = false;
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
    playerStyle.SetAnimationSpeed(0.05);
    const collider = new BoxCollider2D(0, 0, 50, 50);
    collider.Attach(this);

    this.SetDrawable(playerStyle);
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
      this.SetAcceleration(0, 400);
    }
    if (!this.dead)
      this.SetVelocity(0, -300);
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

    const collider = new BoxCollider2D(0, 0, this.width, this.height);
    collider.Attach(this);

    this.speed = -100;
    this.started = false;

    if (!isTop) {
      this.SetRotation(PI);
    }
    this.SetVelocity(0, 0);
  }

  Update(delta) {
    if (SceneManager.GetScene().started && this.velocity.x == 0)
      this.SetVelocity(this.speed, 0);
    if (SceneManager.GetScene().finished == true)
      this.SetVelocity(0, 0);
    super.Update(delta)
  }

}

class Background extends GameObject2D {
  constructor(x, y) {
    super(x, y);
  }
}

class Score extends GameObject2D {
  constructor(x, y, initialScore) {
    super(x, y)
    this.score = initialScore;
    this.scoreLabel = new Label(this.score.toString(), 72);
    this.SetDrawable(this.scoreLabel);
  }

  UpdateScore(score = null) {
    if (score == null)
      this.score++;
    else
      this.score = score
    this.scoreLabel.SetText(this.score);
  }

}

class Scene {
  constructor() {
    this.count = 0;
    this.objects = {};
    this.player = null;
    this.pipesCount = 5;
    this.pipeGap = 350;
    this.started = false;
    this.finished = false;
    this.score = null;

    this.layerIds = [];
    this.BG_LAYER = 1;
    this.PIPE_LAYER = 2;
    this.PLAYER_LAYER = 3;

  }

  AddToScene = (object, layer = 'default') => {
    if (!this.objects[layer]) {
      this.objects[layer] = []
      this.layerIds.push(layer);
    }
    this.objects[layer].push(object);
  }

  RemoveFromScene = (object) => {
    Object.keys(this.objects).forEach((key) => {
      this.objects[key] = this.objects[key].filter((obj) => { return obj.GetName() != object.GetName(); })
    });
  }

  // Method will reset the current scene to original
  ResetScene() {
    this.objects = {};
    this.CreateScene();
  }

  CreateBG() {
    const position = createVector(width / 2, height / 2);
    const bgSprite = AssetManager.GetLoadedImage('background');
    const backgroundImage = new Sprite(bgSprite, width, height);
    const background = new Background(0, 0);

    background.SetDrawable(backgroundImage);
    background.SetPosition(position);
    this.AddToScene(background, this.BG_LAYER);
  }

  CreatePlayer() {
    const position = createVector(width / 4 + 150, height / 2);
    this.player = new Player(0, 0);
    this.player.SetPosition(position);
    this.AddToScene(this.player, this.PLAYER_LAYER);
  }

  CreatePipes() {
    for (let i = 0; i < this.pipesCount; i++) {
      this.CreatePipe(width + i * this.pipeGap + Pipe.GetWidth(), height / 2 + random(-1, 1) * 200, 200);
    }
  }

  CreatePipe(x, y, gap) {
    const pipeTop = new Pipe(0, 0);
    const pipeBottom = new Pipe(0, 0, true);

    pipeTop.SetPosition(x, y - Pipe.GetHeight() / 2 - gap / 2);
    pipeBottom.SetPosition(x, y + Pipe.GetHeight() / 2 + gap / 2);
    this.AddToScene(pipeTop, this.PIPE_LAYER);
    this.AddToScene(pipeBottom, this.PIPE_LAYER);
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

    this.score = new Score(this.player.x, 100, 0);
    this.AddToScene(this.score, this.PLAYER_LAYER)
  }

  LoadAssets() {
    AssetManager.ImportImage('bird', './assets/bird.png');
    AssetManager.ImportImage('background', './assets/background.png');
    AssetManager.ImportImage('pipe', './assets/pipe.png');
    AssetManager.ImportImage('spritesheet', './assets/spritesheet.png');
    AssetManager.LoadAssets();
  }

  CalculateScore() {
    // Get First pipe from game objects
    const pipes = this.objects[this.PIPE_LAYER];

    let firstPipe = pipes[0];

    if (firstPipe == null)
      return;

    if (firstPipe.AddedToScore)
      return;

    if (firstPipe.GetPosition().x + firstPipe.width / 2 < this.player.GetPosition().x) {
      this.score.UpdateScore();
      firstPipe.AddedToScore = true;
    }
  }

  HandleCreateAndCleanupOfPipes() {
    const pipesToRemove = this.objects[this.PIPE_LAYER].filter(pipe => { return this.IsPipeOffscreen(pipe) });
    if (pipesToRemove.length == 0) return;
    pipesToRemove.forEach(pipe => this.RemoveFromScene(pipe));

    const count = this.objects[this.PIPE_LAYER].length;
    let index = count - 1;

    const lastPipe = this.objects[this.PIPE_LAYER][index];
    const secondLastPipe = this.objects[this.PIPE_LAYER][index - 3];
    const X = 2 * lastPipe.GetPosition().x - secondLastPipe.GetPosition().x;
    this.CreatePipe(X, height / 2 + random(-1, 1) * 200, 200);
  }

  OnUpdate() {
    if (this.player.started == true) {
      this.started = true;
    }
    if (this.player.dead == true) {
      this.finished = true;
      this.started = false;
    }
    if (this.player.started === false)
      return

    // Score can be calculated if the game has started
    this.CalculateScore();

    this.HandleCreateAndCleanupOfPipes();
  }

  //Handles drawing of objects
  Render() {
    const layers = this.layerIds;

    const renderLayer = gameObjects => {
      for (let i = 0; i < gameObjects.length; i++)
        if (gameObjects[i].Draw) gameObjects[i].Draw();
    };

    for (let i = 0; i < layers.length; i++) {
      const layer = layers[i];
      renderLayer(this.objects[layer]);
    }
  }

  //Handles physics
  Update(delta) {
    this.OnUpdate();
    const layers = this.layerIds;

    const updateLayer = (gameObjects, ts) => {
      for (let i = 0; i < gameObjects.length; i++)
        if (gameObjects[i].Update) gameObjects[i].Update(ts);
    };

    for (let i = 0; i < layers.length; i++) {
      const layer = layers[i];
      updateLayer(this.objects[layer], delta);
    }

  }

  //KeyEvents
  KeyPressed(event) {
    const layers = this.layerIds;

    const keyPressedEvent = gameObjects => {
      for (let i = 0; i < gameObjects.length; i++)
        gameObjects[i].KeyPressed ? gameObjects[i].KeyPressed(event) : null;
    };

    for (let i = 0; i < layers.length; i++) {
      const layer = layers[i];
      keyPressedEvent(this.objects[layer]);
    }
  }

  KeyReleased(event) {
    const layers = this.layerIds;

    const keyReleasedEvent = gameObjects => {
      for (let i = 0; i < gameObjects.length; i++)
        gameObjects[i].KeyReleased ? gameObjects[i].KeyReleased(event) : null;
    };

    for (let i = 0; i < layers.length; i++) {
      const layer = layers[i];
      keyReleasedEvent(this.objects[layer]);
    }
  }
}

SceneManager.AddScene("MainScene", new Scene());

