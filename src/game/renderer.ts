import { GameState, Tank, Bullet, Particle, Explosion, Obstacle, Vector2 } from './types';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from './engine';

export function renderGame(ctx: CanvasRenderingContext2D, state: GameState, time: number) {
  const camera = {
    x: state.player.position.x - CANVAS_WIDTH / 2 + state.screenShake.x,
    y: state.player.position.y - CANVAS_HEIGHT / 2 + state.screenShake.y,
  };

  ctx.save();
  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  // Draw background
  drawBackground(ctx, camera, time);
  
  ctx.translate(-camera.x, -camera.y);
  
  // Draw grid
  drawGrid(ctx, camera, time);
  
  // Draw obstacles
  state.obstacles.forEach(obs => drawObstacle(ctx, obs, time));
  
  // Draw particles (behind tanks)
  state.particles.filter(p => p.type === 'smoke').forEach(p => drawParticle(ctx, p));
  
  // Draw explosions
  state.explosions.forEach(e => drawExplosion(ctx, e, time));
  
  // Draw bullets
  state.bullets.forEach(b => drawBullet(ctx, b, time));
  
  // Draw bullet trail particles
  state.particles.filter(p => p.type === 'trail' || p.type === 'muzzle').forEach(p => drawParticle(ctx, p));
  
  // Draw tanks
  state.enemies.forEach(tank => drawTank(ctx, tank, time));
  drawTank(ctx, state.player, time);
  
  // Draw remaining particles (explosion, spark, debris)
  state.particles.filter(p => p.type !== 'smoke' && p.type !== 'trail' && p.type !== 'muzzle').forEach(p => drawParticle(ctx, p));
  
  ctx.restore();
  
  // Draw vignette
  drawVignette(ctx);
  
  // Draw crosshair at mouse position
  drawCrosshair(ctx, state, time);
  
  // Draw scan line effect (subtle)
  drawScanLines(ctx, time);
}

function drawScanLines(ctx: CanvasRenderingContext2D, time: number) {
  ctx.save();
  ctx.globalAlpha = 0.015;
  for (let y = 0; y < CANVAS_HEIGHT; y += 4) {
    ctx.fillStyle = y % 8 === 0 ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)';
    ctx.fillRect(0, y, CANVAS_WIDTH, 1);
  }
  ctx.restore();
}

function drawCrosshair(ctx: CanvasRenderingContext2D, state: GameState, time: number) {
  const camera = {
    x: state.player.position.x - CANVAS_WIDTH / 2 + state.screenShake.x,
    y: state.player.position.y - CANVAS_HEIGHT / 2 + state.screenShake.y,
  };
  
  // Calculate world mouse position from turret angle
  const aimDist = 120;
  const cx = CANVAS_WIDTH / 2 + Math.cos(state.player.turretAngle) * aimDist;
  const cy = CANVAS_HEIGHT / 2 + Math.sin(state.player.turretAngle) * aimDist;
  
  ctx.save();
  ctx.translate(cx, cy);
  
  const pulse = Math.sin(time * 0.005) * 0.2 + 0.8;
  
  // Outer ring
  ctx.beginPath();
  ctx.arc(0, 0, 15, 0, Math.PI * 2);
  ctx.strokeStyle = `rgba(255, 100, 50, ${0.6 * pulse})`;
  ctx.lineWidth = 1.5;
  ctx.stroke();
  
  // Inner dot
  ctx.beginPath();
  ctx.arc(0, 0, 2, 0, Math.PI * 2);
  ctx.fillStyle = `rgba(255, 150, 50, ${0.8 * pulse})`;
  ctx.fill();
  
  // Cross lines
  const lineLen = 8;
  const gap = 5;
  ctx.strokeStyle = `rgba(255, 100, 50, ${0.5 * pulse})`;
  ctx.lineWidth = 1.5;
  
  // Top
  ctx.beginPath();
  ctx.moveTo(0, -gap);
  ctx.lineTo(0, -gap - lineLen);
  ctx.stroke();
  // Bottom
  ctx.beginPath();
  ctx.moveTo(0, gap);
  ctx.lineTo(0, gap + lineLen);
  ctx.stroke();
  // Left
  ctx.beginPath();
  ctx.moveTo(-gap, 0);
  ctx.lineTo(-gap - lineLen, 0);
  ctx.stroke();
  // Right
  ctx.beginPath();
  ctx.moveTo(gap, 0);
  ctx.lineTo(gap + lineLen, 0);
  ctx.stroke();
  
  // Glow
  const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, 20);
  glow.addColorStop(0, `rgba(255, 100, 50, ${0.1 * pulse})`);
  glow.addColorStop(1, 'rgba(255, 100, 50, 0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(0, 0, 20, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.restore();
}

function drawBackground(ctx: CanvasRenderingContext2D, camera: Vector2, time: number) {
  // Dark gradient background with subtle color shifts
  const gradient = ctx.createRadialGradient(
    CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, 0,
    CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, CANVAS_WIDTH * 0.8
  );
  gradient.addColorStop(0, '#1a1a2e');
  gradient.addColorStop(0.4, '#16213e');
  gradient.addColorStop(0.7, '#0f172a');
  gradient.addColorStop(1, '#0a0a14');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  // Ground texture - subtle noise pattern
  ctx.globalAlpha = 0.03;
  for (let i = 0; i < 200; i++) {
    const x = ((i * 173.7 + camera.x * 0.1) % CANVAS_WIDTH + CANVAS_WIDTH) % CANVAS_WIDTH;
    const y = ((i * 211.3 + camera.y * 0.1) % CANVAS_HEIGHT + CANVAS_HEIGHT) % CANVAS_HEIGHT;
    const size = 1 + (i % 3);
    ctx.fillStyle = i % 2 === 0 ? '#4a5568' : '#2d3748';
    ctx.fillRect(x, y, size, size);
  }
  ctx.globalAlpha = 1;
  
  // Subtle animated ambient particles
  ctx.fillStyle = 'rgba(100, 150, 255, 0.04)';
  for (let i = 0; i < 30; i++) {
    const x = ((i * 137.5 + time * 0.008) % CANVAS_WIDTH);
    const y = ((i * 97.3 + time * 0.004 + Math.sin(time * 0.001 + i) * 20) % CANVAS_HEIGHT);
    const size = 1.5 + Math.sin(time * 0.002 + i) * 0.8;
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
  }
  
  // Ambient light spots
  const spotX = CANVAS_WIDTH / 2 + Math.sin(time * 0.0005) * 100;
  const spotY = CANVAS_HEIGHT / 2 + Math.cos(time * 0.0007) * 80;
  const spotGradient = ctx.createRadialGradient(spotX, spotY, 0, spotX, spotY, 300);
  spotGradient.addColorStop(0, 'rgba(59, 130, 246, 0.03)');
  spotGradient.addColorStop(1, 'rgba(59, 130, 246, 0)');
  ctx.fillStyle = spotGradient;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
}

function drawGrid(ctx: CanvasRenderingContext2D, camera: Vector2, time: number) {
  const gridSize = 80;
  const startX = Math.floor(camera.x / gridSize) * gridSize;
  const startY = Math.floor(camera.y / gridSize) * gridSize;
  
  // Ground texture - subtle tile pattern
  ctx.fillStyle = 'rgba(30, 40, 60, 0.3)';
  for (let x = startX; x < camera.x + CANVAS_WIDTH + gridSize; x += gridSize) {
    for (let y = startY; y < camera.y + CANVAS_HEIGHT + gridSize; y += gridSize) {
      const checker = ((Math.floor(x / gridSize) + Math.floor(y / gridSize)) % 2 === 0);
      if (checker) {
        ctx.fillRect(x, y, gridSize, gridSize);
      }
    }
  }
  
  // Grid lines
  ctx.strokeStyle = 'rgba(100, 150, 255, 0.05)';
  ctx.lineWidth = 1;
  
  for (let x = startX; x < camera.x + CANVAS_WIDTH + gridSize; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, camera.y);
    ctx.lineTo(x, camera.y + CANVAS_HEIGHT);
    ctx.stroke();
  }
  
  for (let y = startY; y < camera.y + CANVAS_HEIGHT + gridSize; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(camera.x, y);
    ctx.lineTo(camera.x + CANVAS_WIDTH, y);
    ctx.stroke();
  }
  
  // Ground detail - scattered dots
  ctx.fillStyle = 'rgba(100, 130, 180, 0.04)';
  for (let i = 0; i < 80; i++) {
    const gx = ((i * 197 + camera.x * 0.3) % (camera.x + CANVAS_WIDTH + 200)) - 100;
    const gy = ((i * 283 + camera.y * 0.3) % (camera.y + CANVAS_HEIGHT + 200)) - 100;
    if (gx > camera.x - 50 && gx < camera.x + CANVAS_WIDTH + 50 &&
        gy > camera.y - 50 && gy < camera.y + CANVAS_HEIGHT + 50) {
      ctx.beginPath();
      ctx.arc(gx, gy, 2 + (i % 3), 0, Math.PI * 2);
      ctx.fill();
    }
  }
  
  // Map boundary glow
  ctx.strokeStyle = 'rgba(255, 50, 50, 0.4)';
  ctx.lineWidth = 4;
  ctx.shadowColor = '#ff3333';
  ctx.shadowBlur = 20;
  ctx.strokeRect(0, 0, 2400, 1600);
  ctx.shadowBlur = 0;
  
  // Inner boundary warning zone
  ctx.strokeStyle = 'rgba(255, 50, 50, 0.1)';
  ctx.lineWidth = 1;
  ctx.setLineDash([10, 10]);
  ctx.strokeRect(50, 50, 2300, 1500);
  ctx.setLineDash([]);
}

function drawTank(ctx: CanvasRenderingContext2D, tank: Tank, time: number) {
  ctx.save();
  ctx.translate(tank.position.x, tank.position.y);
  
  // Tank shadow
  ctx.save();
  ctx.rotate(tank.angle);
  ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
  ctx.beginPath();
  ctx.ellipse(3, 3, tank.size * 1.1, tank.size * 0.8, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  
  // Tank body
  ctx.save();
  ctx.rotate(tank.angle);
  
  // Tracks
  const trackWidth = tank.size * 0.35;
  const trackLength = tank.size * 1.4;
  
  // Left track
  drawTrack(ctx, -tank.size * 0.6, 0, trackWidth, trackLength, tank.trackOffset, tank.color);
  // Right track
  drawTrack(ctx, tank.size * 0.6, 0, trackWidth, trackLength, tank.trackOffset, tank.color);
  
  // Hull - metallic gradient
  const hullGradient = ctx.createLinearGradient(-tank.size * 0.5, -tank.size * 0.5, tank.size * 0.5, tank.size * 0.5);
  hullGradient.addColorStop(0, lightenColor(tank.color, 40));
  hullGradient.addColorStop(0.3, tank.color);
  hullGradient.addColorStop(0.7, darkenColor(tank.color, 20));
  hullGradient.addColorStop(1, darkenColor(tank.color, 40));
  
  // Hull shape
  ctx.beginPath();
  ctx.moveTo(-tank.size * 0.4, -tank.size * 0.7);
  ctx.lineTo(tank.size * 0.4, -tank.size * 0.7);
  ctx.lineTo(tank.size * 0.5, -tank.size * 0.3);
  ctx.lineTo(tank.size * 0.5, tank.size * 0.5);
  ctx.lineTo(tank.size * 0.3, tank.size * 0.7);
  ctx.lineTo(-tank.size * 0.3, tank.size * 0.7);
  ctx.lineTo(-tank.size * 0.5, tank.size * 0.5);
  ctx.lineTo(-tank.size * 0.5, -tank.size * 0.3);
  ctx.closePath();
  ctx.fillStyle = hullGradient;
  ctx.fill();
  
  // Hull highlight (shiny effect)
  ctx.beginPath();
  ctx.moveTo(-tank.size * 0.3, -tank.size * 0.6);
  ctx.lineTo(tank.size * 0.1, -tank.size * 0.6);
  ctx.lineTo(tank.size * 0.2, -tank.size * 0.2);
  ctx.lineTo(-tank.size * 0.2, -tank.size * 0.2);
  ctx.closePath();
  ctx.fillStyle = `rgba(255, 255, 255, ${0.15 + Math.sin(time * 0.003) * 0.05})`;
  ctx.fill();
  
  // Secondary shine streak
  ctx.beginPath();
  ctx.moveTo(-tank.size * 0.15, -tank.size * 0.55);
  ctx.lineTo(tank.size * 0.05, -tank.size * 0.55);
  ctx.lineTo(tank.size * 0.1, -tank.size * 0.35);
  ctx.lineTo(-tank.size * 0.1, -tank.size * 0.35);
  ctx.closePath();
  ctx.fillStyle = `rgba(255, 255, 255, ${0.08 + Math.sin(time * 0.004 + 1) * 0.03})`;
  ctx.fill();
  
  // Engine glow at back
  if (tank.isPlayer) {
    const engineGlow = ctx.createRadialGradient(0, tank.size * 0.6, 0, 0, tank.size * 0.6, tank.size * 0.3);
    engineGlow.addColorStop(0, 'rgba(59, 130, 246, 0.3)');
    engineGlow.addColorStop(1, 'rgba(59, 130, 246, 0)');
    ctx.fillStyle = engineGlow;
    ctx.beginPath();
    ctx.arc(0, tank.size * 0.6, tank.size * 0.3, 0, Math.PI * 2);
    ctx.fill();
  }
  
  // Hull border
  ctx.strokeStyle = darkenColor(tank.color, 50);
  ctx.lineWidth = 2;
  ctx.stroke();
  
  // Rivets
  const rivetPositions = [
    [-0.35, -0.5], [0.35, -0.5], [-0.35, 0.5], [0.35, 0.5],
    [-0.4, 0], [0.4, 0]
  ];
  rivetPositions.forEach(([rx, ry]) => {
    ctx.beginPath();
    ctx.arc(rx * tank.size, ry * tank.size, 2, 0, Math.PI * 2);
    ctx.fillStyle = darkenColor(tank.color, 30);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(rx * tank.size - 0.5, ry * tank.size - 0.5, 1, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.fill();
  });
  
  ctx.restore();
  
  // Turret (rotates independently)
  ctx.save();
  ctx.rotate(tank.turretAngle);
  
  // Turret base shadow
  ctx.beginPath();
  ctx.arc(2, 2, tank.size * 0.45, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.fill();
  
  // Barrel
  const barrelLength = tank.size * 1.4;
  const barrelWidth = tank.size * 0.15;
  
  const barrelGradient = ctx.createLinearGradient(0, -barrelWidth, 0, barrelWidth);
  barrelGradient.addColorStop(0, '#888');
  barrelGradient.addColorStop(0.3, '#ccc');
  barrelGradient.addColorStop(0.5, '#fff');
  barrelGradient.addColorStop(0.7, '#aaa');
  barrelGradient.addColorStop(1, '#555');
  
  ctx.fillStyle = barrelGradient;
  ctx.fillRect(tank.size * 0.3, -barrelWidth, barrelLength - tank.size * 0.3, barrelWidth * 2);
  
  // Barrel tip glow
  ctx.beginPath();
  ctx.arc(barrelLength, 0, barrelWidth * 1.2, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255, 200, 50, 0.2)';
  ctx.fill();
  
  // Barrel shine line
  ctx.strokeStyle = 'rgba(255,255,255,0.4)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(tank.size * 0.3, -barrelWidth * 0.3);
  ctx.lineTo(barrelLength, -barrelWidth * 0.3);
  ctx.stroke();
  
  // Turret dome - metallic gradient
  const turretGradient = ctx.createRadialGradient(
    -tank.size * 0.1, -tank.size * 0.1, 0,
    0, 0, tank.size * 0.4
  );
  turretGradient.addColorStop(0, lightenColor(tank.accentColor, 50));
  turretGradient.addColorStop(0.4, tank.accentColor);
  turretGradient.addColorStop(0.8, tank.color);
  turretGradient.addColorStop(1, darkenColor(tank.color, 30));
  
  ctx.beginPath();
  ctx.arc(0, 0, tank.size * 0.4, 0, Math.PI * 2);
  ctx.fillStyle = turretGradient;
  ctx.fill();
  ctx.strokeStyle = darkenColor(tank.color, 40);
  ctx.lineWidth = 2;
  ctx.stroke();
  
  // Turret shine
  ctx.beginPath();
  ctx.arc(-tank.size * 0.1, -tank.size * 0.1, tank.size * 0.2, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,255,0.2)';
  ctx.fill();
  
  ctx.restore();
  
  // Health bar
  if (tank.health < tank.maxHealth) {
    const barWidth = tank.size * 1.5;
    const barHeight = 4;
    const barY = -tank.size - 15;
    
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(-barWidth / 2, barY, barWidth, barHeight);
    
    const healthPercent = tank.health / tank.maxHealth;
    const healthColor = healthPercent > 0.5 ? '#4ade80' : healthPercent > 0.25 ? '#fbbf24' : '#ef4444';
    ctx.fillStyle = healthColor;
    ctx.fillRect(-barWidth / 2, barY, barWidth * healthPercent, barHeight);
    
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 1;
    ctx.strokeRect(-barWidth / 2, barY, barWidth, barHeight);
  }
  
  // Player indicator glow
  if (tank.isPlayer) {
    ctx.beginPath();
    ctx.arc(0, 0, tank.size * 1.5, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(96, 165, 250, ${0.2 + Math.sin(time * 0.005) * 0.1})`;
    ctx.lineWidth = 2;
    ctx.stroke();
  }
  
  ctx.restore();
}

function drawTrack(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, length: number, offset: number, color: string) {
  ctx.save();
  ctx.translate(x, y);
  
  // Track body
  const trackGradient = ctx.createLinearGradient(-width / 2, 0, width / 2, 0);
  trackGradient.addColorStop(0, '#222');
  trackGradient.addColorStop(0.3, '#444');
  trackGradient.addColorStop(0.5, '#555');
  trackGradient.addColorStop(0.7, '#444');
  trackGradient.addColorStop(1, '#222');
  
  ctx.fillStyle = trackGradient;
  ctx.fillRect(-width / 2, -length / 2, width, length);
  
  // Track segments
  ctx.strokeStyle = '#333';
  ctx.lineWidth = 1;
  const segmentSpacing = 8;
  for (let i = -length / 2; i < length / 2; i += segmentSpacing) {
    const segY = ((i + offset * 3) % segmentSpacing + segmentSpacing) % segmentSpacing - segmentSpacing / 2;
    ctx.beginPath();
    ctx.moveTo(-width / 2, segY + i);
    ctx.lineTo(width / 2, segY + i);
    ctx.stroke();
  }
  
  ctx.restore();
}

function drawBullet(ctx: CanvasRenderingContext2D, bullet: Bullet, time: number) {
  // Trail
  if (bullet.trail.length > 1) {
    ctx.beginPath();
    ctx.moveTo(bullet.trail[0].x, bullet.trail[0].y);
    for (let i = 1; i < bullet.trail.length; i++) {
      ctx.lineTo(bullet.trail[i].x, bullet.trail[i].y);
    }
    ctx.lineTo(bullet.position.x, bullet.position.y);
    ctx.strokeStyle = 'rgba(255, 200, 50, 0.4)';
    ctx.lineWidth = bullet.size * 0.8;
    ctx.stroke();
  }
  
  // Bullet glow
  ctx.beginPath();
  ctx.arc(bullet.position.x, bullet.position.y, bullet.size * 3, 0, Math.PI * 2);
  const glowGradient = ctx.createRadialGradient(
    bullet.position.x, bullet.position.y, 0,
    bullet.position.x, bullet.position.y, bullet.size * 3
  );
  glowGradient.addColorStop(0, 'rgba(255, 200, 50, 0.6)');
  glowGradient.addColorStop(0.5, 'rgba(255, 150, 0, 0.2)');
  glowGradient.addColorStop(1, 'rgba(255, 100, 0, 0)');
  ctx.fillStyle = glowGradient;
  ctx.fill();
  
  // Bullet core
  ctx.beginPath();
  ctx.arc(bullet.position.x, bullet.position.y, bullet.size, 0, Math.PI * 2);
  const bulletGradient = ctx.createRadialGradient(
    bullet.position.x - bullet.size * 0.3, bullet.position.y - bullet.size * 0.3, 0,
    bullet.position.x, bullet.position.y, bullet.size
  );
  bulletGradient.addColorStop(0, '#ffffff');
  bulletGradient.addColorStop(0.3, '#ffee00');
  bulletGradient.addColorStop(0.7, '#ff9500');
  bulletGradient.addColorStop(1, '#ff4400');
  ctx.fillStyle = bulletGradient;
  ctx.fill();
}

function drawParticle(ctx: CanvasRenderingContext2D, particle: Particle) {
  ctx.save();
  ctx.globalAlpha = particle.opacity;
  ctx.translate(particle.position.x, particle.position.y);
  ctx.rotate(particle.rotation);
  
  if (particle.type === 'smoke') {
    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, particle.size);
    gradient.addColorStop(0, `rgba(100, 100, 100, ${particle.opacity * 0.5})`);
    gradient.addColorStop(0.5, `rgba(80, 80, 80, ${particle.opacity * 0.3})`);
    gradient.addColorStop(1, `rgba(60, 60, 60, 0)`);
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(0, 0, particle.size, 0, Math.PI * 2);
    ctx.fill();
  } else if (particle.type === 'spark') {
    ctx.fillStyle = particle.color;
    ctx.shadowColor = particle.color;
    ctx.shadowBlur = 5;
    ctx.fillRect(-particle.size / 2, -particle.size / 2, particle.size, particle.size);
  } else if (particle.type === 'explosion') {
    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, particle.size);
    gradient.addColorStop(0, particle.color);
    gradient.addColorStop(0.5, particle.color + '88');
    gradient.addColorStop(1, 'transparent');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(0, 0, particle.size, 0, Math.PI * 2);
    ctx.fill();
  } else if (particle.type === 'debris') {
    ctx.fillStyle = particle.color;
    ctx.fillRect(-particle.size / 2, -particle.size / 2, particle.size, particle.size * 0.6);
  } else if (particle.type === 'muzzle') {
    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, particle.size);
    gradient.addColorStop(0, '#ffffff');
    gradient.addColorStop(0.3, '#ffee00');
    gradient.addColorStop(0.7, '#ff9500');
    gradient.addColorStop(1, 'transparent');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(0, 0, particle.size, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.fillStyle = particle.color;
    ctx.beginPath();
    ctx.arc(0, 0, particle.size, 0, Math.PI * 2);
    ctx.fill();
  }
  
  ctx.restore();
}

function drawExplosion(ctx: CanvasRenderingContext2D, explosion: Explosion, time: number) {
  const progress = 1 - explosion.lifetime / explosion.maxLifetime;
  
  ctx.save();
  ctx.globalAlpha = 1 - progress;
  
  // Outer glow
  const outerGradient = ctx.createRadialGradient(
    explosion.position.x, explosion.position.y, 0,
    explosion.position.x, explosion.position.y, explosion.radius * 1.5
  );
  outerGradient.addColorStop(0, 'rgba(255, 200, 50, 0.8)');
  outerGradient.addColorStop(0.3, 'rgba(255, 100, 0, 0.5)');
  outerGradient.addColorStop(0.6, 'rgba(255, 50, 0, 0.2)');
  outerGradient.addColorStop(1, 'rgba(255, 0, 0, 0)');
  ctx.fillStyle = outerGradient;
  ctx.beginPath();
  ctx.arc(explosion.position.x, explosion.position.y, explosion.radius * 1.5, 0, Math.PI * 2);
  ctx.fill();
  
  // Inner core
  const innerGradient = ctx.createRadialGradient(
    explosion.position.x, explosion.position.y, 0,
    explosion.position.x, explosion.position.y, explosion.radius * 0.5
  );
  innerGradient.addColorStop(0, '#ffffff');
  innerGradient.addColorStop(0.5, '#ffee00');
  innerGradient.addColorStop(1, 'rgba(255, 150, 0, 0)');
  ctx.fillStyle = innerGradient;
  ctx.beginPath();
  ctx.arc(explosion.position.x, explosion.position.y, explosion.radius * 0.5, 0, Math.PI * 2);
  ctx.fill();
  
  // Shockwave ring
  ctx.beginPath();
  ctx.arc(explosion.position.x, explosion.position.y, explosion.radius, 0, Math.PI * 2);
  ctx.strokeStyle = `rgba(255, 200, 100, ${(1 - progress) * 0.5})`;
  ctx.lineWidth = 3;
  ctx.stroke();
  
  ctx.restore();
}

function drawObstacle(ctx: CanvasRenderingContext2D, obstacle: Obstacle, time: number) {
  ctx.save();
  ctx.translate(obstacle.position.x, obstacle.position.y);
  
  const healthPercent = obstacle.health / obstacle.maxHealth;
  
  if (obstacle.type === 'building') {
    // Building with metallic look
    const gradient = ctx.createLinearGradient(
      -obstacle.width / 2, -obstacle.height / 2,
      obstacle.width / 2, obstacle.height / 2
    );
    gradient.addColorStop(0, '#5a6577');
    gradient.addColorStop(0.3, '#4a5568');
    gradient.addColorStop(0.7, '#374151');
    gradient.addColorStop(1, '#2d3748');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(-obstacle.width / 2, -obstacle.height / 2, obstacle.width, obstacle.height);
    
    // Building details
    ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    ctx.lineWidth = 1;
    ctx.strokeRect(-obstacle.width / 2 + 3, -obstacle.height / 2 + 3, obstacle.width - 6, obstacle.height - 6);
    
    // Windows
    ctx.fillStyle = 'rgba(100, 200, 255, 0.15)';
    const windowSize = 8;
    for (let wx = -obstacle.width / 2 + 15; wx < obstacle.width / 2 - 15; wx += 20) {
      for (let wy = -obstacle.height / 2 + 15; wy < obstacle.height / 2 - 15; wy += 20) {
        ctx.fillRect(wx, wy, windowSize, windowSize);
      }
    }
    
    // Damage cracks
    if (healthPercent < 0.7) {
      ctx.strokeStyle = 'rgba(50,30,20,0.6)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-obstacle.width * 0.2, -obstacle.height * 0.3);
      ctx.lineTo(obstacle.width * 0.1, obstacle.height * 0.1);
      ctx.lineTo(obstacle.width * 0.3, obstacle.height * 0.4);
      ctx.stroke();
    }
  } else if (obstacle.type === 'crate') {
    // Wooden crate
    const gradient = ctx.createLinearGradient(
      -obstacle.width / 2, -obstacle.height / 2,
      obstacle.width / 2, obstacle.height / 2
    );
    gradient.addColorStop(0, '#a0522d');
    gradient.addColorStop(0.5, '#8B4513');
    gradient.addColorStop(1, '#654321');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(-obstacle.width / 2, -obstacle.height / 2, obstacle.width, obstacle.height);
    
    // Wood grain
    ctx.strokeStyle = 'rgba(0,0,0,0.2)';
    ctx.lineWidth = 1;
    for (let i = -obstacle.height / 2 + 5; i < obstacle.height / 2; i += 8) {
      ctx.beginPath();
      ctx.moveTo(-obstacle.width / 2, i);
      ctx.lineTo(obstacle.width / 2, i);
      ctx.stroke();
    }
    
    // Cross pattern
    ctx.strokeStyle = 'rgba(139, 69, 19, 0.8)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-obstacle.width / 2, -obstacle.height / 2);
    ctx.lineTo(obstacle.width / 2, obstacle.height / 2);
    ctx.moveTo(obstacle.width / 2, -obstacle.height / 2);
    ctx.lineTo(-obstacle.width / 2, obstacle.height / 2);
    ctx.stroke();
    
    // Border
    ctx.strokeStyle = '#4a2810';
    ctx.lineWidth = 2;
    ctx.strokeRect(-obstacle.width / 2, -obstacle.height / 2, obstacle.width, obstacle.height);
  } else {
    // Wall - concrete look
    const gradient = ctx.createLinearGradient(
      -obstacle.width / 2, 0, obstacle.width / 2, 0
    );
    gradient.addColorStop(0, '#4b5563');
    gradient.addColorStop(0.5, '#6b7280');
    gradient.addColorStop(1, '#4b5563');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(-obstacle.width / 2, -obstacle.height / 2, obstacle.width, obstacle.height);
    
    // Concrete texture lines
    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.lineWidth = 1;
    for (let i = -obstacle.width / 2; i < obstacle.width / 2; i += 15) {
      ctx.beginPath();
      ctx.moveTo(i, -obstacle.height / 2);
      ctx.lineTo(i, obstacle.height / 2);
      ctx.stroke();
    }
    
    ctx.strokeStyle = '#374151';
    ctx.lineWidth = 2;
    ctx.strokeRect(-obstacle.width / 2, -obstacle.height / 2, obstacle.width, obstacle.height);
  }
  
  ctx.restore();
}

function drawVignette(ctx: CanvasRenderingContext2D) {
  const gradient = ctx.createRadialGradient(
    CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, CANVAS_WIDTH * 0.3,
    CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, CANVAS_WIDTH * 0.7
  );
  gradient.addColorStop(0, 'rgba(0,0,0,0)');
  gradient.addColorStop(1, 'rgba(0,0,0,0.4)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
}

function lightenColor(color: string, amount: number): string {
  const hex = color.replace('#', '');
  const r = Math.min(255, parseInt(hex.slice(0, 2), 16) + amount);
  const g = Math.min(255, parseInt(hex.slice(2, 4), 16) + amount);
  const b = Math.min(255, parseInt(hex.slice(4, 6), 16) + amount);
  return `rgb(${r},${g},${b})`;
}

function darkenColor(color: string, amount: number): string {
  const hex = color.replace('#', '');
  const r = Math.max(0, parseInt(hex.slice(0, 2), 16) - amount);
  const g = Math.max(0, parseInt(hex.slice(2, 4), 16) - amount);
  const b = Math.max(0, parseInt(hex.slice(4, 6), 16) - amount);
  return `rgb(${r},${g},${b})`;
}
