class Background extends GameObject2D {
  constructor() {
    super(0, 0);
    const position = createVector(width / 2, height / 2);
    const bgSprite = AssetManager.GetLoadedImage('background');
    const backgroundImage = new Sprite(bgSprite, width, height);
    this.SetDrawable(backgroundImage);
    this.SetPosition(position);
  }
}