function preload() {
  SceneManager.LoadAssets();
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  PhysicsEngine = new PhysicsGlobal();

  SceneManager.CreateScenes();
  SceneManager.SetScene("MainScene");
}

function draw() {
  const Scene = SceneManager.GetScene();
  if (!Scene)
    throw new Error('No Scene was set to render.');
  Scene.Render();
  PhysicsEngine.ComputeAndNotifyCollisions();
  Scene.Update(deltaTime / 1000);
}

function keyPressed() {
  const Scene = SceneManager.GetScene();
  Scene.KeyPressed({ key, keyCode });
}

function keyReleased() {
  const Scene = SceneManager.GetScene();
  Scene.KeyReleased({ key, keyCode });
}
