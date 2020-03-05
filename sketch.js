function preload() {
  SceneManager.LoadAssets();
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  PhysicsEngine = new PhysicsGlobal();

  SceneManager.CreateScenes();
}

function draw() {
  const Scene = SceneManager.GetScene();
  if (!Scene)
    throw new Error('No Scene was set to render.');
  Scene.Render();
  Scene.Update(deltaTime / 1000);
  PhysicsEngine.ComputeAndNotifyCollisions();
}
