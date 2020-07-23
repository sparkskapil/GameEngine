class Game {
  constructor() {
    this.objects = {};
    this.Paused = false;
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
    object.OnDelete();
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
    const background = new Background();
    this.AddToScene(background, this.BG_LAYER);
  }

  CreatePlayer() {
    this.player = new Player();
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
    this.player = null;
    this.pipesCount = 5;
    this.pipeGap = 350;
    this.started = false;
    this.finished = false;
    this.score = null;

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
      SceneManager.SetScene('GameOver');
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
    if (this.Paused)
      return;

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

class MainMenu {
  constructor() {
    this.objects = {};

    this.layerIds = [];
    this.BG_LAYER = 1;
    this.MENU_LAYER = 2;
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

  CreateScene() {

    const background = new Background();
    this.AddToScene(background, this.BG_LAYER);

    const logo = new GameObject2D(width / 2, height / 2);
    const logoImage = AssetManager.GetLoadedImage('logo');
    const aspect = logoImage.width / logoImage.height;

    const logoSprite = new Sprite(logoImage, width / 3, width / (3 * aspect));

    logo.SetDrawable(logoSprite);
    this.AddToScene(logo, this.MENU_LAYER);
  }

  LoadAssets() {
    AssetManager.ImportImage('logo', 'assets/FlappyLogo.png');
    AssetManager.LoadAssets();
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
  }

  //KeyEvents
  KeyPressed(event) {
    if (event.key === " ")
      SceneManager.SetScene("Game");
  }
}

class GameOver {
  constructor() {
    this.objects = {};

    this.layerIds = [];
    this.BG_LAYER = 1;
    this.MENU_LAYER = 2;

    this.render = true;
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

  CreateScene() {
    const gameOver = new GameObject2D(width / 2, height / 3 - 10);
    const gameOverImage = AssetManager.GetLoadedImage('gameover');
    const aspect = gameOverImage.width / gameOverImage.height;

    const gameOverSprite = new Sprite(gameOverImage, width / 3, width / (3 * aspect));

    gameOver.SetDrawable(gameOverSprite);
    this.AddToScene(gameOver, this.MENU_LAYER);

    const Score = SceneManager.GetScene("Game").score.score;
    let highscore = Score;
    let gamesplayed = 1;
    if (localStorage) {
      const data = localStorage.getItem("FlappyBird");

      if (!data) {
        const gameData = {
          count: 1,
          maxscore: Score
        };
        localStorage.setItem("FlappyBird", JSON.stringify(gameData));
      }
      else {
        const gameData = JSON.parse(data);
        gameData.count++;
        gameData.maxscore = max(gameData.maxscore, Score);
        highscore = gameData.maxscore;
        gamesplayed = gameData.count;
        localStorage.setItem("FlappyBird", JSON.stringify(gameData));
      }
    }

    const MenuBox = new GameObject2D(width / 2, height / 2 + 50);
    const MenuBoxStyle = new Box2D(500, height / 3);
    MenuBoxStyle.SetColor(221, 216, 148);
    MenuBox.SetDrawable(MenuBoxStyle);

    const lblCurrentScore = new Label("Score: " + Score, 36);
    const lblHighScore = new Label("HighScore: " + highscore, 36);
    const lblGamesPlayed = new Label("GamesPlayed: " + gamesplayed, 36);
    const X = width / 3 + 125; const Y = height / 3 + 125;
    const CurrentScore = new GameObject2D(X, Y);
    lblCurrentScore.SetColor(232, 146, 64);
    CurrentScore.SetDrawable(lblCurrentScore);
    const HighScore = new GameObject2D(X, Y + 50);
    lblHighScore.SetColor(232, 146, 64);
    HighScore.SetDrawable(lblHighScore);
    const GamesPlayed = new GameObject2D(X, Y + 100);
    lblGamesPlayed.SetColor(232, 146, 64);
    GamesPlayed.SetDrawable(lblGamesPlayed);

    this.AddToScene(MenuBox, this.MENU_LAYER);
    this.AddToScene(CurrentScore, this.MENU_LAYER);
    this.AddToScene(HighScore, this.MENU_LAYER);
    this.AddToScene(GamesPlayed, this.MENU_LAYER);

    const lblRestart = new Label("Press ENTER to restart.", 24);
    const Restart = new GameObject2D(X, Y + 150);
    Restart.SetDrawable(lblRestart);
    this.AddToScene(Restart);
  }

  LoadAssets() {
    AssetManager.ImportImage('gameover', 'assets/GameOver.png');
    AssetManager.LoadAssets();
  }

  //Handles drawing of objects
  Render() {
    if (this.render === false)
      return;
    const layers = this.layerIds;

    const renderLayer = gameObjects => {
      for (let i = 0; i < gameObjects.length; i++)
        if (gameObjects[i].Draw) gameObjects[i].Draw();
    };

    for (let i = 0; i < layers.length; i++) {
      const layer = layers[i];
      renderLayer(this.objects[layer]);
    }
    this.render = false;
  }

  //Handles physics
  Update(delta) {
  }

  //KeyEvents
  KeyPressed(event) {
    if (event.key === "Enter")
      document.location.reload(true)
  }
}

SceneManager.AddScene("Game", new Game());
SceneManager.AddScene("GameOver", new GameOver());
SceneManager.AddScene("MainScene", new MainMenu());

