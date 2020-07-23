class Wall extends GameObject2D {
  constructor(x, y) {
    super(x, y);
  }

  SetCollisionProps(W, H) {
    const collider = new BoxCollider2D(0, 0, W, H);
    collider.isStatic = true;
    collider.Attach(this);
  }
}