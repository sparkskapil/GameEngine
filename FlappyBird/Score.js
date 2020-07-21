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
