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

    this.speed = -200;
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