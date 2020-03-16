let PhysicsEngine = null;

// TODO: 
// 1. Passthrough property
// 2. Allowing player to passthrough from one direction

// 3. Add Circular, capsule, polygon colliders
// 4. Try shaders
// 5. Testing Sprites
// 6. Implement Camera using easycam
// 7. Particle system

/* Priority Checklist
  1. Circular Collider
  2. Sprites
  3. Text Drawable
  4. Particles
*/

class PhysicsGlobal {
  static COLLIDERS = 0;
  static SHOWCOLLISION = false;
  static SHOWAABB = false;

  constructor() {
    this.Gravity = createVector(0, 0);
    this.CollidersMap = {};
    this.CollidingBodies = {};
  }

  static GetEdgesIntersection(E1, E2) {
    //Line representing E1
    const a1 = E1.B.y - E1.A.y;
    const b1 = E1.A.x - E1.B.x;
    const c1 = E1.A.x * a1 + E1.A.y * b1;

    //Line representing E2
    const a2 = E2.B.y - E2.A.y;
    const b2 = E2.A.x - E2.B.x;
    const c2 = E2.A.x * a2 + E2.A.y * b2;

    const determinant = a1 * b2 - a2 * b1;

    if (determinant == 0)
      return null;

    const x = (b2 * c1 - b1 * c2) / determinant;
    const y = (a1 * c2 - a2 * c1) / determinant;
    return createVector(x, y);

  }

  Clear() {
    this.CollidersMap = {};
    PhysicsGlobal.COLLIDERS = 0;
  }

  RegisterCollider(collider) {
    const layer = collider.GetLayer();
    collider.id = ++PhysicsGlobal.COLLIDERS;
    if (!this.CollidersMap[layer])
      this.CollidersMap[layer] = {};
    this.CollidersMap[layer][collider.id] = collider;
  }

  ComputeAndNotifyCollisions() {
    Object.keys(this.CollidersMap).forEach(this._processCollisionPerLayer)
  }

  _getCentroid(vertices) {
    const centroid = createVector(0, 0);
    vertices.forEach(point => {
      centroid.add(point);
    })
    centroid.mult(1 / vertices.length);
  }

  _getAABBEdges(Box) {
    // List all vertices of Bounding Box
    const a = createVector(Box.min.x, Box.min.y);
    const b = createVector(Box.min.x, Box.max.y);
    const c = createVector(Box.max.x, Box.max.y);
    const d = createVector(Box.max.x, Box.min.y);
    const edges = [
      { A: b, B: a },
      { A: c, B: b },
      { A: d, B: c },
      { A: a, B: d }
    ];

    return edges;
  }

  _calculateAxis(B1, B2, Overlap) {

    const edgesB1 = this._getAABBEdges(B1);
    const edgesB2 = this._getAABBEdges(B2);
    const intersections = [];

    const Tol = 1e-4;
    Overlap.min.x -= Tol;
    Overlap.min.y -= Tol;
    Overlap.max.x += Tol;
    Overlap.max.y += Tol;

    for (let i = 0; i < edgesB1.length; i++) {
      const E1 = edgesB1[i];
      for (let j = 0; j < edgesB2.length; j++) {
        const E2 = edgesB2[j];
        const point = PhysicsGlobal.GetEdgesIntersection(E1, E2);
        if (!point)
          continue;

        if (point.x >= Overlap.min.x && point.x <= Overlap.max.x &&
          point.y >= Overlap.min.y && point.y <= Overlap.max.y) {
          intersections.push(point);
        }
      }
    }

    const count = intersections.length;
    const A = intersections[0];
    const B = intersections[count - 1];

    if (count <= 1)
      return null;

    const axisVec = p5.Vector.sub(B, A);
    if ((Math.abs(axisVec.x) < 1e-5 && Math.abs(axisVec.y) < 1e-5))
      return null;

    if (count > 1) {
      const axis = { A, B };
      return axis;
    }
  }

  // Checks whether the bounding boxes are colliding or not
  // Returns null if not. Returns the colission axis otherwise.
  _isAABBColliding(B1, B2) {

    // Check collision of bounding boxes
    const x1 = Math.max(B1.min.x, B2.min.x);
    const y1 = Math.max(B1.min.y, B2.min.y);
    const x2 = Math.min(B1.max.x, B2.max.x);
    const y2 = Math.min(B1.max.y, B2.max.y);

    if (x1 > x2 || y1 > y2)
      return null;

    const overlap = { min: { x: x1, y: y1 }, max: { x: x2, y: y2 } };
    const axis = this._calculateAxis(B1, B2, overlap);
    if (!axis)
      return { axis, overlap: null };
    return { axis, overlap };
  }

  //Checks whether the colliders intersect with the axis.
  // Returns false if not. Returns true otherwise.
  _areCollidersColliding(C1, C2, Axis) {
    const pointsC1 = C1.GetIntersections(Axis);
    const pointsC2 = C2.GetIntersections(Axis);

    // Lambda to draw point if SHOWCOLLISION flag is set to true.
    const drawPoint = (p) => {
      if (!PhysicsGlobal.SHOWCOLLISION)
        return;
      push();
      strokeWeight(5);
      point(p.x, p.y);
      pop();
    }

    let collisionFound = false;
    pointsC1.forEach(p => {
      if (C2.IsPointInside(p)) {
        drawPoint(p);
        collisionFound = true;
      }
    });

    pointsC2.forEach(p => {
      if (C1.IsPointInside(p)) {
        drawPoint(p);
        collisionFound = true;
      }
    });

    return collisionFound;
  }

  _processCollisionPerLayer = (layer) => {
    const box = [];
    //Lambda to draw AABB if SHOWAABB flag is set to true.
    const drawAABB = (aabb) => {
      if (!PhysicsGlobal.SHOWAABB)
        return;
      push();
      strokeWeight(1);
      stroke(255, 255, 0);
      noFill();
      rectMode(CORNERS);
      rect(aabb.min.x, aabb.min.y, aabb.max.x, aabb.max.y);
      pop();
    }

    //Compute bounding box for all colliders
    Object.keys(this.CollidersMap[layer]).forEach((id) => {
      const collider = this.CollidersMap[layer][id];
      const aabb = collider.GetAABB();
      drawAABB(aabb);
      box.push(aabb);
    });

    const collisionMap = {}
    // Iterate and generate list of colliding game object 
    // against each collider.

    for (let i = 0; i < box.length - 1; i++) {
      for (let j = i + 1; j < box.length; j++) {
        const c1 = Object.keys(this.CollidersMap[layer])[i];
        const c2 = Object.keys(this.CollidersMap[layer])[j];

        const collider1 = this.CollidersMap[layer][c1];
        const collider2 = this.CollidersMap[layer][c2];

        //collision between two static gameobjects should not be calculated.
        if (collider1.isStatic && collider2.isStatic)
          continue;

        const result = this._isAABBColliding(box[i], box[j]);

        if (!result)
          continue;
        const { axis, overlap } = result;

        const res = this._areCollidersColliding(collider1, collider2, axis);

        if (!res)
          continue;

        if (!collisionMap[c1])
          collisionMap[c1] = [];

        if (!collisionMap[c2])
          collisionMap[c2] = [];

        //this._resolveAndCacheCollision(collider1.gameObject, collider2.gameObject, overlap);

        collisionMap[c1].push({ id: collider2.id, object: collider2.gameObject, axis });
        collisionMap[c2].push({ id: collider1.id, object: collider1.gameObject, axis });
      }
    }

    // Notify all colliders about colliding game objects.
    this._notifyAndCacheCollisions(this.CollidingBodies[layer], collisionMap, this.CollidersMap[layer], layer);
  }

  _getNewOldCommonCollisions(prev, next) {
    if (!prev)
      prev = [];
    if (!next)
      next = [];
    const colNew = [];
    const colCommon = [];
    const colOld = [...prev];
    next.forEach(newItem => {
      const index = prev.findIndex(oldItem => oldItem.id == newItem.id);
      if (index > -1) {
        colCommon.push(newItem);
        colOld.splice(index, 1);
      }
      else {
        colNew.push(newItem);
      }
    });
    return { colNew, colCommon, colOld };
  }

  _notifyAndCacheCollisions = (prev, next, colliders, layer) => {
    if (!prev)
      prev = {};
    const ids = Object.keys(colliders);
    ids.forEach(id => {
      const collider = colliders[id];
      const { colNew, colCommon, colOld } = this._getNewOldCommonCollisions(prev[id], next[id]);

      collider.CollisionBegin(colNew);
      collider.Colliding(colCommon);
      collider.CollisionEnd(colOld);
    });
    this.CollidingBodies[layer] = next;
  }

  // Not used but might be useful when working with forces
  _resolveAndCacheCollision(firstGO, secondGO, overlap) {
    if (!overlap)
      return;
    const u = !firstGO.GetVelocity ? createVector(0, 0) : firstGO.GetVelocity();
    const v = !secondGO.GetVelocity ? createVector(0, 0) : secondGO.GetVelocity();

    const movement = createVector(overlap.max.x - overlap.min.x, overlap.max.y - overlap.min.y);

    if (!u || !v)
      return;

    //If both objects are non static
    if (firstGO.SetVelocity && secondGO.SetVelocity) {
      firstGO.SetVelocity(v);
      secondGO.SetVelocity(u);
      movement *= (0.5);
      const firstMovementDir = u.normalize().mult(-1);
      const secondMovementDir = v.normalize().mult(-1);

      const firstMove = createVector(firstMovementDir.x * movement.x, firstMovementDir.y * movement.y);
      const secondMove = createVector(secondMovementDir.x * movement.x, secondMovementDir.y * movement.y);

      const firstPos = p5.Vector.add(firstGO.GetPosition(), firstMove);
      const secondPos = p5.Vector.add(secondGO.GetPosition(), secondMove);
      firstGO.SetPosition(firstPos);
      secondGO.SetPosition(secondPos);
    }
    else if (firstGO.SetVelocity) {
      firstGO.SetVelocity(v);

      const firstMovementDir = u.normalize().mult(-1);
      const firstMove = createVector(firstMovementDir.x * movement.x, firstMovementDir.y * movement.y);
      const firstPos = p5.Vector.add(firstGO.GetPosition(), firstMove);
      firstGO.SetPosition(firstPos);
    }
    else if (secondGO.SetVelocity) {
      secondGO.SetVelocity(u);
      const secondMovementDir = v.normalize().mult(-1);

      const secondMove = createVector(secondMovementDir.x * movement.x, secondMovementDir.y * movement.y);
      const secondPos = p5.Vector.add(secondGO.GetPosition(), secondMove);
      secondGO.SetPosition(secondPos);
    }
  }

}

class GameObject {
  GetPosition() {
    throw new Error('Method not implemented.');
  }

  SetPosition() {
    throw new Error('Method not implemented.');
  }

  SetDrawable() {
    throw new Error('Method not implemented.');
  }

  SetName() {
    throw new Error('Method not implemented.');
  }

  GetName() {
    throw new Error('Method not implemented.');
  }

  Draw() {
    throw new Error('Method not implemented.');
  }

}

class Drawable {

  Draw() {
    throw new Error('Method not implemented.');
  }

  SetColor() {
    throw new Error('Method not implemented.');
  }

  SetBorder() {
    throw new Error('Method not implemented.');
  }
}

class Sprite extends Drawable {
  constructor(loadedImage, width, height) {
    super();
    this.image = loadedImage;
    this.width = width;
    this.height = height;
  }

  Draw() {
    image(this.image);
  }
}

class Box2D extends Drawable {
  constructor(width, height) {
    super();
    this.width = width;
    this.height = height;

    //if height is not specified, draw square.
    if (!this.height)
      this.height = this.width;

    this.color = color(255, 255, 255);
    this.strokeWidth = 0;
    this.strokeColor = color(255, 255, 255);
  }

  SetColor(R, G, B, A) {
    this.color = color(R, G, B, A);
  }

  SetBorder(borderThickness) {
    this.strokeWidth = borderThickness;
  }

  SetBorderColor(R, G, B, A) {
    this.strokeColor = color(R, G, B, A);
  }

  Draw() {
    push()
    strokeWeight(this.strokeWidth);
    stroke(this.strokeColor);
    if (this.strokeWidth <= 0)
      noStroke();

    fill(this.color);
    rectMode(CENTER);
    rect(0, 0, this.width, this.height);
    pop();
  }
}

class GameObject2D extends GameObject {
  static OBJECTS = 0;
  constructor(x = 0, y = 0) {
    super();
    this.x = x;
    this.y = y;

    this.orientation = 0;   // Rotation of the object in radians
    this.Drawable = null;
    this.Name = `GAMEOBJECT2D_${++GameObject2D.OBJECTS}`;
  }

  SetRotation(rotation) {
    this.orientation = rotation;
  }

  GetRotation() {
    return this.orientation;
  }

  GetPosition() {
    return createVector(this.x, this.y);
  }

  SetPosition(first, second) {
    if (first instanceof p5.Vector) {
      this.x = first.x;
      this.y = first.y;
    }
    else {
      this.x = first;
      this.y = second;
    }
  }

  SetDrawable(drawable) {
    this.Drawable = drawable;
  }

  SetName(Name) {
    this.Name = Name;
  }

  GetName() {
    return this.Name;
  }

  Draw() {
    if (!this.Drawable)
      return console.warn('Drawable not set for GameObject.');
    push();
    angleMode(RADIANS);
    translate(this.x, this.y);
    rotate(this.orientation);
    this.Drawable.Draw();
    pop();
  }
}

class KinematicObject2D extends GameObject2D {
  constructor(x = 0, y = 0) {
    super(x, y);
    this.velocity = createVector(0, 0);
    this.acceleration = createVector(0, 0);

    this.angularVelocity = 0;
    this.angularAcceleration = 0;
  }

  SetAngularVelocity(velocity) {
    this.angularVelocity = velocity;
  }

  SetAngularAcceleration(acceleration) {
    this.angularAcceleration = acceleration;
  }

  SetVelocity(first, second) {
    if (first instanceof p5.Vector)
      this.velocity = createVector(first.x, first.y);
    else
      this.velocity = createVector(first, second);
  }

  GetVelocity() {
    return createVector(this.velocity.x, this.velocity.y);
  }

  SetAcceleration(first, second) {
    if (first instanceof p5.Vector)
      this.acceleration = createVector(first.x, first.y);
    else
      this.acceleration = createVector(first, second);
  }

  Update(delta) {
    if (!delta)
      return;
    let pos = super.GetPosition();
    let acc = p5.Vector.add(this.acceleration, PhysicsEngine.Gravity);
    acc = p5.Vector.mult(acc, delta);

    this.velocity = p5.Vector.add(this.velocity, acc);
    let vel = p5.Vector.mult(this.velocity, delta);

    let newPosition = p5.Vector.add(createVector(pos.x, pos.y), vel);
    super.SetPosition(newPosition);

    let rotation = super.GetRotation();
    this.angularVelocity += this.angularAcceleration;
    rotation += this.angularVelocity;
    super.SetRotation(rotation);
  }
}

class BoxCollider2D {
  constructor(x, y, w, h) {
    //Position relative to the gameObject
    this.position = createVector(x, y);
    this.width = w;
    this.height = h ? h : w;
    this.layer = 1;
    this.gameObject = null;
    this.isStatic = false;

    // Generate Vertices for collider
    this.vertices = [
      { x: -this.width / 2, y: -this.height / 2 },
      { x: -this.width / 2, y: this.height / 2 },
      { x: this.width / 2, y: this.height / 2 },
      { x: this.width / 2, y: -this.height / 2 }
    ]

    this.transformedVertices = this.vertices;
  }

  GetLayer() {
    return this.layer;
  }

  SetLayer(layer) {
    this.layer = layer;
  }

  Attach(gameObject) {
    this.gameObject = gameObject;
    if (gameObject.__proto__.__proto__.constructor.name == "GameObject2D") {
      this.isStatic = true;
    }
    PhysicsEngine.RegisterCollider(this);
  }

  IsPointInside(point) {
    const CalculateArea = (v1, v2, v3) => {
      const AB = p5.Vector.sub(v2, v1);
      const AC = p5.Vector.sub(v3, v1);
      return AB.cross(AC).mag() / 2;
    }

    let i = 0;
    let sumArea = 0;
    while (true) {
      const A = createVector(this.transformedVertices[i].x, this.transformedVertices[i].y);
      i++;
      i = i % 4;
      const B = createVector(this.transformedVertices[i].x, this.transformedVertices[i].y);
      sumArea += CalculateArea(point, A, B);
      if (i == 0)
        break;
    }
    const rectArea = this.width * this.height;

    return sumArea - rectArea <= 1e-5;

  }

  GetIntersections(Axis) {
    const edges = [
      { A: this.transformedVertices[0], B: this.transformedVertices[1] },
      { A: this.transformedVertices[1], B: this.transformedVertices[2] },
      { A: this.transformedVertices[2], B: this.transformedVertices[3] },
      { A: this.transformedVertices[3], B: this.transformedVertices[0] }
    ];

    const intersections = [];
    edges.forEach(edge => {
      const intersection = PhysicsGlobal.GetEdgesIntersection(edge, Axis);
      if (intersection) {
        const a = Math.min(Axis.A.x, Axis.B.x);
        const b = Math.min(Axis.A.y, Axis.B.y);
        const c = Math.max(Axis.A.x, Axis.B.x);
        const d = Math.max(Axis.A.y, Axis.B.y);
        if (a <= intersection.x && c >= intersection.x &&
          b <= intersection.y && d >= intersection.y) {
          intersections.push(intersection);
        }
      }
    })
    return intersections;
  }

  //Returns AXIS ALIGNED BOUNDING BOX
  // For the Collider 
  GetAABB() {
    // Apply transform to the collider same as GameObject
    const translation = { x: this.gameObject.x, y: this.gameObject.y };
    const rotation = this.gameObject.orientation;

    const applyTransform = (point, rotation, translation) => {
      const sine = Math.sin(rotation);
      const cosine = Math.cos(rotation);
      const x = (point.x * cosine - point.y * sine) + translation.x;
      const y = (point.x * sine + point.y * cosine) + translation.y;
      return { x, y };
    }

    this.transformedVertices = [];
    this.transformedVertices = this.vertices.map((point) => {
      return applyTransform(point, rotation, translation)
    });


    //Method to draw collider with transforms applied
    const drawCollider = () => {
      push();
      beginShape();
      stroke(200, 0, 0);
      noFill();
      transformedVertices.forEach(point => {
        vertex(point.x, point.y);
      })
      endShape(CLOSE);
      pop();
    };

    //Calculate AABB
    const min = { x: Infinity, y: Infinity };
    const max = { x: -Infinity, y: -Infinity };
    this.transformedVertices.forEach(point => {
      //Calculate Top Left Vertex
      if (min.x > point.x)
        min.x = point.x;
      if (min.y > point.y)
        min.y = point.y;

      //Calculate Bottom Right Vertex
      if (max.x < point.x)
        max.x = point.x;
      if (max.y < point.y)
        max.y = point.y;
    })

    return Object.freeze({ min, max });
  }

  CollisionBegin(objects) {
    if (!this.gameObject.OnCollisionBegin)
      return;

    if (!objects || !objects.length)
      return;

    this.gameObject.OnCollisionBegin(objects);
  }

  Colliding(objects) {
    if (!this.gameObject.WhileColliding)
      return;

    if (!objects || !objects.length)
      return;

    this.gameObject.WhileColliding(objects);
  }

  CollisionEnd(objects) {
    if (!this.gameObject.OnCollisionEnd)
      return;

    if (!objects || !objects.length)
      return;

    this.gameObject.OnCollisionEnd(objects);
  }

  // OnCollision(objects) {
  //   if (!this.gameObject.OnCollision)
  //     return;

  //   this.gameObject.OnCollision(objects);
  // }

}

class SceneManager {
  static CurrentScene = null;
  static Scenes = {}

  static AddScene(key, scene) {
    if (SceneManager.Scenes[key])
      throw new Error(`${key} has already been used.`);
    SceneManager.Scenes[key] = scene;
  }

  static SetScene(key) {
    if (!SceneManager.Scenes[key])
      throw new Error(`${key} does not exist.`);

    SceneManager.CurrentScene = SceneManager.Scenes[key];
    if (PhysicsEngine) {
      PhysicsEngine.Clear();
      SceneManager.CurrentScene.ResetScene();
    }
  }

  static LoadAssets() {
    Object.keys(SceneManager.Scenes)
      .forEach(key => {
        SceneManager.Scenes[key].LoadAssets()
      });
  }

  static CreateScenes() {
    Object.keys(SceneManager.Scenes)
      .forEach(key => {
        SceneManager.Scenes[key].CreateScene()
      });
  }

  static GetScene() {
    return SceneManager.CurrentScene;
  }
}
