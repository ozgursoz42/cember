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
export function checkBallSensorCollision(
  ball: Ball,
  sensor: SensorCircle
): { collided: boolean; normalX: number; normalY: number } {
  const dx = ball.x - sensor.x;
  const dy = ball.y - sensor.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const minDist = ball.radius + sensor.radius;

  if (dist < minDist && dist > 0.0001) {
    const nx = dx / dist;
    const ny = dy / dist;

    // Separate ball from sensor to prevent sticking/tunneling
    const overlap = minDist - dist;
    ball.x += nx * (overlap + 2.5);
    ball.y += ny * (overlap + 2.5);

    // Ball velocity relative to sensor velocity
    const relVx = ball.vx - sensor.vx;
    const relVy = ball.vy - sensor.vy;

    // Dot product with normal
    const dot = relVx * nx + relVy * ny;

    // Bounce with high-energy explosive kick
    if (dot < 0) {
      // High restitution kick
      const restitution = 1.25;
      const impulse = -(1 + restitution) * dot;

      // Add bounce impulse along normal
      ball.vx += impulse * nx;
      ball.vy += impulse * ny;

      // Inject strong tangential deflection from sensor movement & rotation
      const tangentX = -ny;
      const tangentY = nx;
      const spinKick = (sensor.vx * tangentX + sensor.vy * tangentY) * 0.65;
      ball.vx += tangentX * spinKick;
      ball.vy += tangentY * spinKick;

      // Accelerate ball significantly on Çember hit
      const currentSpeed = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);
      // Boost speed by 28% with a high minimum kick
      const targetSpeed = Math.min(Math.max(currentSpeed * 1.28, ball.baseSpeed * 1.35), ball.maxSpeed);
      if (currentSpeed > 0) {
        ball.vx = (ball.vx / currentSpeed) * targetSpeed;
        ball.vy = (ball.vy / currentSpeed) * targetSpeed;
      }
      ball.speed = targetSpeed;
    }

    // Mark that ball was deflected by sensor for 2-point goal mechanic
    ball.deflectedBySensor = true;

    return { collided: true, normalX: nx, normalY: ny };
  }

  return { collided: false, normalX: 0, normalY: 0 };
}

/**
 * Checks collision between ball and rounded paddle.
 * Supports forward-rushing strikes (momentum transfer) and prevents ball clipping behind paddle.
 */
export function checkBallPaddleCollision(
  ball: Ball,
  paddle: Paddle,
  difficulty?: GameDifficulty
): { collided: boolean; isSmash: boolean } {
  const halfW = paddle.width / 2;
  const halfH = paddle.height / 2;

  // Check horizontal reach with margin
  const withinHorizontal = ball.x >= paddle.x - halfW - ball.radius && ball.x <= paddle.x + halfW + ball.radius;

  if (paddle.isPlayer) {
    // PLAYER PADDLE: hitting UPWARD toward opponent
    // If player is frozen in ice, they cannot deflect the ball!
    if (paddle.isFrozen) {
      return { collided: false, isSmash: false };
    }

    // If ball is a FIREBALL shot by OPPONENT, it burns right through player paddle!
    if (ball.isFireball && ball.lastHitter === 'opponent') {
      paddle.hitFlash = 2.0;
      return { collided: false, isSmash: false };
    }

    const paddleTop = paddle.y - halfH;
    const paddleBottom = paddle.y + halfH;
    const minSweepY = Math.min(paddle.prevY - halfH, paddleTop) - ball.radius;
    const maxSweepY = Math.max(paddle.prevY + halfH, paddleBottom) + ball.radius + 15;

    const isNearOrThrough = withinHorizontal && ball.y >= minSweepY && ball.y <= maxSweepY;

    // Standard distance check
    const nearestX = clamp(ball.x, paddle.x - halfW, paddle.x + halfW);
    const nearestY = clamp(ball.y, paddleTop, paddleBottom);
    const dx = ball.x - nearestX;
    const dy = ball.y - nearestY;
    const isDirectOverlap = (dx * dx + dy * dy) < (ball.radius * ball.radius);

    if (isDirectOverlap || isNearOrThrough) {
      // PREVENT BALL FROM FALLING BEHIND PADDLE:
      // Strictly position the ball in front (above) the player paddle
      ball.y = paddleTop - ball.radius - 2;

      // Contact offset across paddle width (-1 to 1) for directional steering
      const hitOffset = clamp((ball.x - paddle.x) / halfW, -0.92, 0.92);
      const maxAngle = (58 * Math.PI) / 180;
      const angle = hitOffset * maxAngle;

      // Check forward rush momentum (paddle moving upward)
      const forwardSpeed = Math.max(0, -paddle.vy);
      const isSmash = forwardSpeed > 100;

      // If player hit while rushing from behind, apply strong speed boost
      const forwardBoost = 1.04 + Math.min(forwardSpeed / 260, 0.65);
      let newSpeed = Math.min(
        Math.max(ball.speed * forwardBoost, ball.baseSpeed * (1 + forwardSpeed / 350)),
        ball.maxSpeed
      );

      // ROCKET POWER-UP: Even slight hit sends the ball blazing forward with fire
      if (paddle.isRocketPowered) {
        newSpeed = Math.min(Math.max(newSpeed * 1.55, ball.baseSpeed * 1.7), ball.maxSpeed);
      }

      // SLOW-MO POWER-UP: Float gently like in deep space
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
      // Reset sensor deflection flag on paddle strike
      ball.deflectedBySensor = false;

      return { collided: true, isSmash: ball.isSmash };
    }
  } else {
    // OPPONENT PADDLE: hitting DOWNWARD toward player
    // If opponent is frozen, they cannot hit the ball!
    if (paddle.isFrozen) {
      return { collided: false, isSmash: false };
    }

    // If ball is a FIREBALL from the player, it burns right through the opponent's paddle!
    if (ball.isFireball && ball.lastHitter === 'player') {
      paddle.hitFlash = 2.0;
      return { collided: false, isSmash: false };
    }

    const paddleTop = paddle.y - halfH;
    const paddleBottom = paddle.y + halfH;
    const minSweepY = Math.min(paddle.prevY - halfH, paddleTop) - ball.radius - 15;
    const maxSweepY = Math.max(paddle.prevY + halfH, paddleBottom) + ball.radius;

    const isNearOrThrough = withinHorizontal && ball.y >= minSweepY && ball.y <= maxSweepY;

    const nearestX = clamp(ball.x, paddle.x - halfW, paddle.x + halfW);
    const nearestY = clamp(ball.y, paddleTop, paddleBottom);
    const dx = ball.x - nearestX;
    const dy = ball.y - nearestY;
    const isDirectOverlap = (dx * dx + dy * dy) < (ball.radius * ball.radius);

    if (isDirectOverlap || isNearOrThrough) {
      // Strictly position ball in front (below) opponent paddle
      ball.y = paddleBottom + ball.radius + 2;

      const hitOffset = clamp((ball.x - paddle.x) / halfW, -0.92, 0.92);
      const maxAngle = (58 * Math.PI) / 180;
      const angle = hitOffset * maxAngle;

      // Check forward rush momentum (opponent paddle rushing downward +vy)
      const forwardSpeed = Math.max(0, paddle.vy);
      const isSmash = forwardSpeed > 80;

      // Scale forward smash force so lower difficulties are easily reactable while keeping the fun forward animation
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

      // OPPONENT ROCKET POWER-UP
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
      // Reset sensor deflection flag on paddle strike
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
