import { Ball, SensorCircle, Paddle, Vector2D, GameDifficulty } from '../types';

export function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

export function lerp(start: number, end: number, t: number): number {
  return start + (end - start) * t;
}

export function distance(x1: number, y1: number, x2: number, y2: number): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Checks circle-circle collision between Ball and Sensor.
 * If colliding, resolves overlap and applies dynamic high-acceleration reflection with sensor momentum.
 */
export interface SweptHitResult {
  hit: boolean;
  t: number;
  hitX: number;
  hitY: number;
  normalX: number;
  normalY: number;
}

/**
 * Continuous / Swept collision detection for a moving circle vs an AABB box (paddle).
 * Calculates exact collision time t in [0, 1] and hit coordinates even at extreme velocities.
 */
export function sweepCircleVsBox(
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  radius: number,
  boxCenterX: number,
  boxCenterY: number,
  boxWidth: number,
  boxHeight: number
): SweptHitResult | null {
  const halfW = boxWidth / 2;
  const halfH = boxHeight / 2;

  // Minkowski expansion of the box by circle radius
  const minX = boxCenterX - halfW - radius;
  const maxX = boxCenterX + halfW + radius;
  const minY = boxCenterY - halfH - radius;
  const maxY = boxCenterY + halfH + radius;

  const dx = endX - startX;
  const dy = endY - startY;

  // Direct initial overlap check (if circle was already touching/inside expanded box at start)
  if (startX >= minX && startX <= maxX && startY >= minY && startY <= maxY) {
    let normX = startX - boxCenterX;
    let normY = startY - boxCenterY;
    const len = Math.hypot(normX, normY);
    if (len > 0.0001) {
      normX /= len;
      normY /= len;
    } else {
      normX = 0;
      normY = -1;
    }
    return {
      hit: true,
      t: 0,
      hitX: startX,
      hitY: startY,
      normalX: normX,
      normalY: normY,
    };
  }

  // Slab method for segment (startX, startY) -> (endX, endY) vs expanded AABB
  let tMin = 0;
  let tMax = 1;
  let normX = 0;
  let normY = 0;

  // X Slab
  if (Math.abs(dx) < 1e-9) {
    if (startX < minX || startX > maxX) return null;
  } else {
    const invD = 1.0 / dx;
    let t1 = (minX - startX) * invD;
    let t2 = (maxX - startX) * invD;
    let n1x = -1, n1y = 0;
    let n2x = 1, n2y = 0;
    if (t1 > t2) {
      const tmp = t1; t1 = t2; t2 = tmp;
      n1x = 1; n2x = -1;
    }
    if (t1 > tMin) {
      tMin = t1;
      normX = n1x;
      normY = n1y;
    }
    tMax = Math.min(tMax, t2);
    if (tMin > tMax) return null;
  }

  // Y Slab
  if (Math.abs(dy) < 1e-9) {
    if (startY < minY || startY > maxY) return null;
  } else {
    const invD = 1.0 / dy;
    let t1 = (minY - startY) * invD;
    let t2 = (maxY - startY) * invD;
    let n1x = 0, n1y = -1;
    let n2x = 0, n2y = 1;
    if (t1 > t2) {
      const tmp = t1; t1 = t2; t2 = tmp;
      n1y = 1; n2y = -1;
    }
    if (t1 > tMin) {
      tMin = t1;
      normX = n1x;
      normY = n1y;
    }
    tMax = Math.min(tMax, t2);
    if (tMin > tMax) return null;
  }

  if (tMin >= 0 && tMin <= 1) {
    return {
      hit: true,
      t: tMin,
      hitX: startX + tMin * dx,
      hitY: startY + tMin * dy,
      normalX: normX,
      normalY: normY,
    };
  }

  return null;
}

/**
 * Continuous / Swept collision detection for a moving circle vs a static circle (sensor).
 */
export function sweepCircleVsCircle(
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  r1: number,
  cx: number,
  cy: number,
  r2: number
): { hit: boolean; t: number; hitX: number; hitY: number } | null {
  const dx = endX - startX;
  const dy = endY - startY;
  const lenSq = dx * dx + dy * dy;
  const minDist = r1 + r2;

  const distStart = Math.hypot(startX - cx, startY - cy);
  if (distStart <= minDist) {
    return { hit: true, t: 0, hitX: startX, hitY: startY };
  }

  if (lenSq < 1e-9) return null;

  const t = clamp(((cx - startX) * dx + (cy - startY) * dy) / lenSq, 0, 1);
  const projX = startX + t * dx;
  const projY = startY + t * dy;
  const distProj = Math.hypot(projX - cx, projY - cy);

  if (distProj <= minDist) {
    return { hit: true, t, hitX: projX, hitY: projY };
  }

  return null;
}

/**
 * Checks circle-circle collision between Ball and Sensor with continuous swept trajectory logic.
 * If colliding, resolves overlap and applies dynamic high-acceleration reflection with sensor momentum.
 */
export function checkBallSensorCollision(
  ball: Ball,
  sensor: SensorCircle
): { collided: boolean; normalX: number; normalY: number } {
  const startX = ball.prevX ?? ball.x;
  const startY = ball.prevY ?? ball.y;

  const sweep = sweepCircleVsCircle(startX, startY, ball.x, ball.y, ball.radius, sensor.x, sensor.y, sensor.radius);

  if (!sweep && Math.hypot(ball.x - sensor.x, ball.y - sensor.y) >= (ball.radius + sensor.radius)) {
    return { collided: false, normalX: 0, normalY: 0 };
  }

  const dx = ball.x - sensor.x;
  const dy = ball.y - sensor.y;
  let dist = Math.sqrt(dx * dx + dy * dy);
  const minDist = ball.radius + sensor.radius;

  if (dist < 0.0001) {
    dist = 0.0001;
  }

  const nx = dx / dist;
  const ny = dy / dist;

  // Separate ball from sensor to prevent sticking/tunneling
  const overlap = Math.max(0, minDist - dist);
  ball.x += nx * (overlap + 2.5);
  ball.y += ny * (overlap + 2.5);

  // Ball velocity relative to sensor velocity
  const relVx = ball.vx - sensor.vx;
  const relVy = ball.vy - sensor.vy;

  // Dot product with normal
  const dot = relVx * nx + relVy * ny;

  // Bounce with high-energy explosive kick
  if (dot < 0) {
    const restitution = 1.25;
    const impulse = -(1 + restitution) * dot;

    ball.vx += impulse * nx;
    ball.vy += impulse * ny;

    const tangentX = -ny;
    const tangentY = nx;
    const spinKick = (sensor.vx * tangentX + sensor.vy * tangentY) * 0.65;
    ball.vx += tangentX * spinKick;
    ball.vy += tangentY * spinKick;

    const currentSpeed = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);
    const targetSpeed = Math.min(Math.max(currentSpeed * 1.28, ball.baseSpeed * 1.35), ball.maxSpeed);
    if (currentSpeed > 0) {
      ball.vx = (ball.vx / currentSpeed) * targetSpeed;
      ball.vy = (ball.vy / currentSpeed) * targetSpeed;
    }
    ball.speed = targetSpeed;
  }

  ball.deflectedBySensor = true;
  return { collided: true, normalX: nx, normalY: ny };
}

/**
 * Swept Continuous Collision Detection between ball trajectory and paddle.
 * Supports forward-rushing strikes (momentum transfer) and prevents ball clipping behind paddle.
 */
export function checkBallPaddleCollision(
  ball: Ball,
  paddle: Paddle,
  difficulty?: GameDifficulty
): { collided: boolean; isSmash: boolean } {
  const halfW = paddle.width / 2;
  const halfH = paddle.height / 2;

  if (paddle.isPlayer) {
    // PLAYER PADDLE: hitting UPWARD toward opponent
    if (paddle.isFrozen) {
      return { collided: false, isSmash: false };
    }

    if (ball.isFireball && ball.lastHitter === 'opponent') {
      paddle.hitFlash = 2.0;
      return { collided: false, isSmash: false };
    }

    const startX = ball.prevX ?? ball.x;
    const startY = ball.prevY ?? ball.y;

    // Check swept continuous collision against paddle at current position
    let sweep = sweepCircleVsBox(startX, startY, ball.x, ball.y, ball.radius, paddle.x, paddle.y, paddle.width, paddle.height);
    if (!sweep && paddle.prevX !== undefined && paddle.prevY !== undefined) {
      sweep = sweepCircleVsBox(startX, startY, ball.x, ball.y, ball.radius, paddle.prevX, paddle.prevY, paddle.width, paddle.height);
    }

    // Also check current direct overlap
    const paddleTop = paddle.y - halfH;
    const paddleBottom = paddle.y + halfH;
    const nearestX = clamp(ball.x, paddle.x - halfW, paddle.x + halfW);
    const nearestY = clamp(ball.y, paddleTop, paddleBottom);
    const dx = ball.x - nearestX;
    const dy = ball.y - nearestY;
    const isDirectOverlap = (dx * dx + dy * dy) < (ball.radius * ball.radius);

    if (sweep || isDirectOverlap) {
      // Set hit position
      const hitX = sweep ? sweep.hitX : ball.x;

      // Strictly position ball in front (above) player paddle + 2.5px epsilon
      ball.x = hitX;
      ball.y = paddleTop - ball.radius - 2.5;
      ball.prevX = ball.x;
      ball.prevY = ball.y;

      // Contact offset across paddle width (-1 to 1) for directional steering
      const hitOffset = clamp((hitX - paddle.x) / halfW, -0.92, 0.92);
      const maxAngle = (58 * Math.PI) / 180;
      const angle = hitOffset * maxAngle;

      // Forward rush momentum (paddle moving upward -vy)
      const forwardSpeed = Math.max(0, -paddle.vy);
      const isSmash = forwardSpeed > 100;

      const forwardBoost = 1.04 + Math.min(forwardSpeed / 260, 0.65);
      let newSpeed = Math.min(
        Math.max(ball.speed * forwardBoost, ball.baseSpeed * (1 + forwardSpeed / 350)),
        ball.maxSpeed
      );

      if (paddle.isRocketPowered) {
        newSpeed = Math.min(Math.max(newSpeed * 1.55, ball.baseSpeed * 1.7), ball.maxSpeed);
      }

      if (ball.isSlowMo) {
        newSpeed = ball.baseSpeed * 0.48;
      }

      // Launch firmly upward toward opponent
      ball.vx = Math.sin(angle) * newSpeed;
      ball.vy = -Math.cos(angle) * newSpeed; // strictly negative (upward)
      ball.speed = newSpeed;
      ball.lastHitter = 'player';
      ball.isSmash = isSmash || paddle.isRocketPowered;
      if (paddle.isFiery) {
        ball.isFireball = true;
      }
      ball.deflectedBySensor = false;

      return { collided: true, isSmash: ball.isSmash };
    }
  } else {
    // OPPONENT PADDLE: hitting DOWNWARD toward player
    if (paddle.isFrozen) {
      return { collided: false, isSmash: false };
    }

    if (ball.isFireball && ball.lastHitter === 'player') {
      paddle.hitFlash = 2.0;
      return { collided: false, isSmash: false };
    }

    const startX = ball.prevX ?? ball.x;
    const startY = ball.prevY ?? ball.y;

    // Check swept continuous collision against paddle at current position
    let sweep = sweepCircleVsBox(startX, startY, ball.x, ball.y, ball.radius, paddle.x, paddle.y, paddle.width, paddle.height);
    if (!sweep && paddle.prevX !== undefined && paddle.prevY !== undefined) {
      sweep = sweepCircleVsBox(startX, startY, ball.x, ball.y, ball.radius, paddle.prevX, paddle.prevY, paddle.width, paddle.height);
    }

    const paddleTop = paddle.y - halfH;
    const paddleBottom = paddle.y + halfH;
    const nearestX = clamp(ball.x, paddle.x - halfW, paddle.x + halfW);
    const nearestY = clamp(ball.y, paddleTop, paddleBottom);
    const dx = ball.x - nearestX;
    const dy = ball.y - nearestY;
    const isDirectOverlap = (dx * dx + dy * dy) < (ball.radius * ball.radius);

    if (sweep || isDirectOverlap) {
      const hitX = sweep ? sweep.hitX : ball.x;

      // Strictly position ball in front (below) opponent paddle + 2.5px epsilon
      ball.x = hitX;
      ball.y = paddleBottom + ball.radius + 2.5;
      ball.prevX = ball.x;
      ball.prevY = ball.y;

      const hitOffset = clamp((hitX - paddle.x) / halfW, -0.92, 0.92);
      const maxAngle = (58 * Math.PI) / 180;
      const angle = hitOffset * maxAngle;

      const forwardSpeed = Math.max(0, paddle.vy);
      const isSmash = forwardSpeed > 80;

      let forwardBoost = 1.04 + Math.min(forwardSpeed / 280, 0.45);
      if (difficulty === 'easiest') {
        forwardBoost = 1.01 + Math.min(forwardSpeed / 500, 0.12);
      } else if (difficulty === 'easy') {
        forwardBoost = 1.02 + Math.min(forwardSpeed / 400, 0.22);
      } else if (difficulty === 'pro' || difficulty === 'chaos') {
        forwardBoost = 1.05 + Math.min(forwardSpeed / 220, 0.65);
      }

      let newSpeed = Math.min(
        Math.max(ball.speed * forwardBoost, ball.baseSpeed * (1 + forwardSpeed / 400)),
        ball.maxSpeed
      );

      if (paddle.isRocketPowered) {
        newSpeed = Math.min(Math.max(newSpeed * 1.55, ball.baseSpeed * 1.7), ball.maxSpeed);
      }

      if (ball.isSlowMo) {
        newSpeed = ball.baseSpeed * 0.48;
      }

      // Launch firmly downward toward player
      ball.vx = Math.sin(angle) * newSpeed;
      ball.vy = Math.cos(angle) * newSpeed; // strictly positive (downward)
      ball.speed = newSpeed;
      ball.lastHitter = 'opponent';
      ball.isSmash = isSmash || paddle.isRocketPowered;
      if (paddle.isFiery) {
        ball.isFireball = true;
      }
      ball.deflectedBySensor = false;

      return { collided: true, isSmash: ball.isSmash };
    }
  }

  return { collided: false, isSmash: false };
}

/**
 * Checks collision between two circles.
 */
export function checkCircleCollision(
  c1: { x: number; y: number; radius: number },
  c2: { x: number; y: number; radius: number }
): boolean {
  const dx = c1.x - c2.x;
  const dy = c1.y - c2.y;
  const distSq = dx * dx + dy * dy;
  const radSum = c1.radius + c2.radius;
  return distSq <= radSum * radSum;
}

/**
 * Checks collision between a paddle and a circle (e.g. power-up item).
 */
export function checkPaddleCircleCollision(
  paddle: Paddle,
  circle: { x: number; y: number; radius: number }
): boolean {
  const halfW = paddle.width / 2;
  const halfH = paddle.height / 2;
  const nearestX = clamp(circle.x, paddle.x - halfW, paddle.x + halfW);
  const nearestY = clamp(circle.y, paddle.y - halfH, paddle.y + halfH);
  const dx = circle.x - nearestX;
  const dy = circle.y - nearestY;
  return (dx * dx + dy * dy) <= (circle.radius * circle.radius);
}

/**
 * Updates the Sensor position based on continuous kinematics.
 */
export function updateSensorKinematics(
  sensor: SensorCircle,
  dt: number,
  arenaW: number,
  arenaH: number,
  rallyCount: number,
  difficulty: GameDifficulty
) {
  // Decay hit flash
  if (sensor.hitFlash > 0) {
    sensor.hitFlash = Math.max(0, sensor.hitFlash - dt * 4);
  }

  // Handle freeze timer
  if (sensor.isFrozen) {
    sensor.freezeTimer = Math.max(0, sensor.freezeTimer - dt);
    if (sensor.freezeTimer <= 0) {
      sensor.isFrozen = false;
    }
    // Zero out velocity when frozen in place
    sensor.vx = 0;
    sensor.vy = 0;
    return;
  }

  // Handle scorch timer
  if (sensor.isScorched) {
    sensor.scorchTimer = Math.max(0, sensor.scorchTimer - dt);
    if (sensor.scorchTimer <= 0) {
      sensor.isScorched = false;
    }
  }

  // Base speeds & orbit radii scale with difficulty & rally count
  let diffSpeedBonus = 0;
  if (difficulty === 'easiest') diffSpeedBonus = -0.28;
  else if (difficulty === 'easy') diffSpeedBonus = -0.15;
  else if (difficulty === 'casual') diffSpeedBonus = 0;
  else if (difficulty === 'pro') diffSpeedBonus = 0.2;
  else if (difficulty === 'chaos') diffSpeedBonus = 0.4;

  const speedMultiplier = Math.max(0.65, 1 + Math.min(rallyCount * 0.04, 0.6) + diffSpeedBonus);
  const effectiveAngularSpeed = sensor.angularSpeed * speedMultiplier;

  sensor.angle += effectiveAngularSpeed * dt;
  sensor.rotationAngle += effectiveAngularSpeed * 2 * dt;
  sensor.pulsePhase += dt * 3.5;

  // Gentle pulsing of sensor visual radius
  sensor.radius = sensor.baseRadius + Math.sin(sensor.pulsePhase) * 2.5;

  const prevX = sensor.x;
  const prevY = sensor.y;

  // Kinematic trajectory based on type
  if (sensor.movementType === 'figure8') {
    // Lissajous 8-loop
    sensor.x = sensor.centerOriginX + Math.sin(sensor.angle) * sensor.orbitRadiusX;
    sensor.y = sensor.centerOriginY + (Math.sin(sensor.angle * 2) / 2) * sensor.orbitRadiusY;
  } else if (sensor.movementType === 'erratic') {
    // Dynamic wobble
    const rx = sensor.orbitRadiusX * (1 + 0.25 * Math.sin(sensor.angle * 1.7));
    const ry = sensor.orbitRadiusY * (1 + 0.25 * Math.cos(sensor.angle * 2.3));
    sensor.x = sensor.centerOriginX + Math.cos(sensor.angle) * rx;
    sensor.y = sensor.centerOriginY + Math.sin(sensor.angle) * ry;
  } else {
    // Classic dynamic elliptical orbit
    sensor.x = sensor.centerOriginX + Math.cos(sensor.angle) * sensor.orbitRadiusX;
    sensor.y = sensor.centerOriginY + Math.sin(sensor.angle) * sensor.orbitRadiusY;
  }

  // Calculate instantaneous velocity for momentum transfer
  sensor.vx = (sensor.x - prevX) / Math.max(dt, 0.001);
  sensor.vy = (sensor.y - prevY) / Math.max(dt, 0.001);
}
