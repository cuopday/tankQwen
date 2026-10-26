import { GameState, Tank, Bullet, Particle, Explosion, Obstacle, Vector2 } from './types';
import { CANVAS_WIDTH, CANVAS_HEIGHT, MAP_WIDTH, MAP_HEIGHT } from './engine';

interface LightSource {
  position: Vector2;
  radius: number;
  intensity: number;
  color: string;
}

interface Drawable {
  y: number; // for sorting
  draw: () => void;
}

let groundDecals: Array<{x: number; y: number; radius: number; opacity: number; type: 'scorch' | 'crater'}> = [];
const MAX_DECALS = 80;

// 2.5D isometric helpers
const ISO_ANGLE = 0.45; // slight tilt
const DEPTH_SCALE = 0.6;

export function renderGame(ctx: CanvasRenderingContext2D, state: GameState, time: number) {
  const camera = {
    x: state.player.position.x - CANVAS_WIDTH / 2 + state.screenShake.x,
    y: state.player.position.y - CANVAS_HEIGHT / 2 + state.screenShake.y,
  };

  ctx.save();
  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  // Background
  drawBackground(ctx, time);
  
  ctx.save();
  ctx.translate(-camera.x, -camera.y);
  
  // Ground layer
  drawGround(ctx, camera, time);
  drawGroundDecals(ctx);
  
  // Collect all drawables for Y-sorting
  const drawables: Drawable[] = [];
  
  // Add obstacles
  state.obstacles.forEach(obs => {
    drawables.push({
      y: obs.position.y + obs.height / 2,
      draw: () => drawObstacle2D5(ctx, obs, time),
    });
  });
  
  // Add tanks
  state.enemies.forEach(tank => {
    drawables.push({
      y: tank.position.y,
      draw: () => drawTank2D5(ctx, tank, time, state),
    });
  });
  drawables.push({
    y: state.player.position.y,
    draw: () => drawTank2D5(ctx, state.player, time, state),
  });
  
  // Add bullets (slightly elevated)
  state.bullets.forEach(b => {
    drawables.push({
      y: b.position.y,
      draw: () => drawBullet2D5(ctx, b, time),
    });
  });
  
  // Sort by Y (back to front)
  drawables.sort((a, b) => a.y - b.y);
  
  // Draw smoke particles behind everything
  state.particles.filter(p => p.type === 'smoke' || p.type === 'dust').forEach(p => drawParticle(ctx, p, time));
  
  // Draw sorted entities
  drawables.forEach(d => d.draw());
  
  // Draw remaining particles in front
  state.particles.filter(p => p.type !== 'smoke' && p.type !== 'dust').forEach(p => drawParticle(ctx, p, time));
  
  // Explosions (always on top)
  state.explosions.forEach(e => drawExplosion(ctx, e, time));
  
  // Dynamic lighting
  drawDynamicLighting(ctx, state, time);
  
  ctx.restore();
  
  // Post-processing
  drawVignette(ctx);
  drawAtmosphere(ctx, time);
  
  // Crosshair
  drawCrosshair(ctx, state, time);
}

function drawBackground(ctx: CanvasRenderingContext2D, time: number) {
  const gradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
  gradient.addColorStop(0, '#0c1220');
  gradient.addColorStop(0.5, '#111827');
  gradient.addColorStop(1, '#0a0f1a');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
}

function drawGround(ctx: CanvasRenderingContext2D, camera: Vector2, time: number) {
  // Draw ground with 2.5D isometric tile pattern
  const tileSize = 80;
  const startX = Math.floor(camera.x / tileSize) * tileSize;
  const startY = Math.floor(camera.y / tileSize) * tileSize;
  
  // Base ground color
  ctx.fillStyle = '#1a1f2e';
  ctx.fillRect(0, 0, MAP_WIDTH, MAP_HEIGHT);
  
  // Isometric diamond tiles
  for (let x = startX - tileSize; x < camera.x + CANVAS_WIDTH + tileSize; x += tileSize) {
    for (let y = startY - tileSize; y < camera.y + CANVAS_HEIGHT + tileSize; y += tileSize) {
      const tileX = Math.floor(x / tileSize);
      const tileY = Math.floor(y / tileSize);
      const checker = (tileX + tileY) % 2 === 0;
      
      // Tile color variation
      const noise = Math.sin(tileX * 0.7 + tileY * 1.1) * 3;
      const r = checker ? 28 + noise : 24 + noise;
      const g = checker ? 35 + noise : 30 + noise;
      const b = checker ? 52 + noise : 45 + noise;
      
      ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
      ctx.fillRect(x, y, tileSize, tileSize);
      
      // Diamond pattern overlay
      ctx.strokeStyle = 'rgba(100, 150, 255, 0.04)';
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(x + tileSize / 2, y);
      ctx.lineTo(x + tileSize, y + tileSize / 2);
      ctx.lineTo(x + tileSize / 2, y + tileSize);
      ctx.lineTo(x, y + tileSize / 2);
      ctx.closePath();
      ctx.stroke();
    }
  }
  
  // Ground detail - small scattered elements
  ctx.fillStyle = 'rgba(60, 80, 100, 0.06)';
  for (let i = 0; i < 150; i++) {
    const gx = ((i * 197) % MAP_WIDTH);
    const gy = ((i * 283) % MAP_HEIGHT);
    if (gx > camera.x - 50 && gx < camera.x + CANVAS_WIDTH + 50 &&
        gy > camera.y - 50 && gy < camera.y + CANVAS_HEIGHT + 50) {
      ctx.beginPath();
      ctx.ellipse(gx, gy, 3 + (i % 4), 2 + (i % 3), i * 0.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  
  // Map boundary with animated glow
  const pulse = 0.4 + Math.sin(time * 0.003) * 0.15;
  
  // Danger zone gradient at edges
  const edgeGrad = ctx.createLinearGradient(0, 0, 80, 0);
  edgeGrad.addColorStop(0, `rgba(220, 38, 38, ${pulse * 0.15})`);
  edgeGrad.addColorStop(1, 'rgba(220, 38, 38, 0)');
  ctx.fillStyle = edgeGrad;
  ctx.fillRect(0, 0, 80, MAP_HEIGHT);
  
  const edgeGrad2 = ctx.createLinearGradient(MAP_WIDTH, 0, MAP_WIDTH - 80, 0);
  edgeGrad2.addColorStop(0, `rgba(220, 38, 38, ${pulse * 0.15})`);
  edgeGrad2.addColorStop(1, 'rgba(220, 38, 38, 0)');
  ctx.fillStyle = edgeGrad2;
  ctx.fillRect(MAP_WIDTH - 80, 0, 80, MAP_HEIGHT);
  
  // Boundary line
  ctx.strokeStyle = `rgba(239, 68, 68, ${pulse})`;
  ctx.lineWidth = 3;
  ctx.shadowColor = '#ef4444';
  ctx.shadowBlur = 15;
  ctx.strokeRect(0, 0, MAP_WIDTH, MAP_HEIGHT);
  ctx.shadowBlur = 0;
  
  // Animated dashed inner border
  ctx.strokeStyle = 'rgba(239, 68, 68, 0.1)';
  ctx.lineWidth = 1;
  ctx.setLineDash([20, 20]);
  ctx.lineDashOffset = -time * 0.02;
  ctx.strokeRect(60, 60, MAP_WIDTH - 120, MAP_HEIGHT - 120);
  ctx.setLineDash([]);
  ctx.lineDashOffset = 0;
}

function drawGroundDecals(ctx: CanvasRenderingContext2D) {
  groundDecals.forEach(decal => {
    ctx.save();
    ctx.globalAlpha = decal.opacity;
    
    if (decal.type === 'scorch') {
      const gradient = ctx.createRadialGradient(decal.x, decal.y, 0, decal.x, decal.y, decal.radius);
      gradient.addColorStop(0, 'rgba(15, 10, 5, 0.7)');
      gradient.addColorStop(0.5, 'rgba(30, 20, 10, 0.4)');
      gradient.addColorStop(1, 'rgba(20, 15, 8, 0)');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.ellipse(decal.x, decal.y, decal.radius, decal.radius * 0.7, 0, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Crater with 2.5D depth
      const gradient = ctx.createRadialGradient(decal.x, decal.y, 0, decal.x, decal.y, decal.radius);
      gradient.addColorStop(0, 'rgba(5, 3, 2, 0.9)');
      gradient.addColorStop(0.6, 'rgba(20, 15, 8, 0.5)');
      gradient.addColorStop(1, 'rgba(40, 30, 15, 0)');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.ellipse(decal.x, decal.y, decal.radius, decal.radius * 0.7, 0, 0, Math.PI * 2);
      ctx.fill();
      
      // Crater rim highlight
      ctx.strokeStyle = 'rgba(80, 60, 30, 0.3)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(decal.x, decal.y - 2, decal.radius * 0.9, decal.radius * 0.6, 0, Math.PI, Math.PI * 2);
      ctx.stroke();
    }
    
    ctx.restore();
  });
}

export function addGroundDecal(x: number, y: number, radius: number, type: 'scorch' | 'crater') {
  groundDecals.push({ x, y, radius, opacity: 0.8, type });
  if (groundDecals.length > MAX_DECALS) {
    groundDecals = groundDecals.slice(-MAX_DECALS);
  }
}

export function clearDecals() {
  groundDecals = [];
}

// ===== 2.5D TANK RENDERING =====
function drawTank2D5(ctx: CanvasRenderingContext2D, tank: Tank, time: number, state: GameState) {
  const { position, angle, turretAngle, size, height } = tank;
  
  // Ground shadow (2.5D - offset to bottom-right)
  ctx.save();
  ctx.translate(position.x + 6, position.y + 8);
  ctx.rotate(angle);
  ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
  ctx.beginPath();
  ctx.ellipse(0, 0, size * 1.1, size * 0.7, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  
  // Draw tank body with 2.5D depth
  ctx.save();
  ctx.translate(position.x, position.y);
  
  // === HULL (with 2.5D side faces) ===
  ctx.save();
  ctx.rotate(angle);
  
  // South side face (visible due to 2.5D tilt)
  const sideDepth = height * 0.7;
  ctx.fillStyle = darkenColor(tank.color, 50);
  ctx.beginPath();
  ctx.moveTo(-size * 0.5, size * 0.4);
  ctx.lineTo(size * 0.5, size * 0.4);
  ctx.lineTo(size * 0.5, size * 0.4 + sideDepth);
  ctx.lineTo(-size * 0.5, size * 0.4 + sideDepth);
  ctx.closePath();
  ctx.fill();
  
  // East side face
  ctx.fillStyle = darkenColor(tank.color, 35);
  ctx.beginPath();
  ctx.moveTo(size * 0.5, -size * 0.6);
  ctx.lineTo(size * 0.5, size * 0.4);
  ctx.lineTo(size * 0.5 + 3, size * 0.4 + sideDepth - 2);
  ctx.lineTo(size * 0.5 + 3, -size * 0.6 + sideDepth - 2);
  ctx.closePath();
  ctx.fill();
  
  // Tracks (on sides)
  drawTrack2D5(ctx, -size * 0.6, 0, size * 0.3, size * 1.3, tank.trackOffset, tank.color, sideDepth);
  drawTrack2D5(ctx, size * 0.6, 0, size * 0.3, size * 1.3, tank.trackOffset, tank.color, sideDepth);
  
  // Top face of hull
  ctx.beginPath();
  ctx.moveTo(-size * 0.4, -size * 0.65);
  ctx.lineTo(size * 0.4, -size * 0.65);
  ctx.quadraticCurveTo(size * 0.5, -size * 0.4, size * 0.5, -size * 0.2);
  ctx.lineTo(size * 0.5, size * 0.4);
  ctx.quadraticCurveTo(size * 0.4, size * 0.6, size * 0.3, size * 0.6);
  ctx.lineTo(-size * 0.3, size * 0.6);
  ctx.quadraticCurveTo(-size * 0.4, size * 0.6, -size * 0.5, size * 0.4);
  ctx.lineTo(-size * 0.5, -size * 0.2);
  ctx.quadraticCurveTo(-size * 0.5, -size * 0.4, -size * 0.4, -size * 0.65);
  ctx.closePath();
  
  // Metallic gradient for top
  const hullGrad = ctx.createLinearGradient(-size * 0.5, -size * 0.6, size * 0.5, size * 0.6);
  hullGrad.addColorStop(0, lightenColor(tank.color, 50));
  hullGrad.addColorStop(0.2, lightenColor(tank.color, 20));
  hullGrad.addColorStop(0.5, tank.color);
  hullGrad.addColorStop(0.8, darkenColor(tank.color, 15));
  hullGrad.addColorStop(1, darkenColor(tank.color, 30));
  ctx.fillStyle = hullGrad;
  ctx.fill();
  
  // Specular highlight
  ctx.beginPath();
  ctx.moveTo(-size * 0.3, -size * 0.55);
  ctx.quadraticCurveTo(0, -size * 0.6, size * 0.2, -size * 0.5);
  ctx.lineTo(size * 0.15, -size * 0.25);
  ctx.lineTo(-size * 0.2, -size * 0.25);
  ctx.closePath();
  ctx.fillStyle = `rgba(255, 255, 255, ${0.18 + Math.sin(time * 0.003) * 0.04})`;
  ctx.fill();
  
  // Hull border
  ctx.strokeStyle = darkenColor(tank.color, 55);
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(-size * 0.4, -size * 0.65);
  ctx.lineTo(size * 0.4, -size * 0.65);
  ctx.quadraticCurveTo(size * 0.5, -size * 0.4, size * 0.5, -size * 0.2);
  ctx.lineTo(size * 0.5, size * 0.4);
  ctx.quadraticCurveTo(size * 0.4, size * 0.6, size * 0.3, size * 0.6);
  ctx.lineTo(-size * 0.3, size * 0.6);
  ctx.quadraticCurveTo(-size * 0.4, size * 0.6, -size * 0.5, size * 0.4);
  ctx.lineTo(-size * 0.5, -size * 0.2);
  ctx.quadraticCurveTo(-size * 0.5, -size * 0.4, -size * 0.4, -size * 0.65);
  ctx.stroke();
  
  // Rivets on top
  const rivets = [[-0.35, -0.45], [0.35, -0.45], [-0.35, 0.35], [0.35, 0.35], [0, -0.5], [0, 0.45]];
  rivets.forEach(([rx, ry]) => {
    const rivetGrad = ctx.createRadialGradient(rx * size - 0.5, ry * size - 0.5, 0, rx * size, ry * size, 2.5);
    rivetGrad.addColorStop(0, lightenColor(tank.color, 40));
    rivetGrad.addColorStop(1, darkenColor(tank.color, 30));
    ctx.beginPath();
    ctx.arc(rx * size, ry * size, 2, 0, Math.PI * 2);
    ctx.fillStyle = rivetGrad;
    ctx.fill();
  });
  
  ctx.restore(); // End hull rotation
  
  // === TURRET (independent rotation, elevated) ===
  ctx.save();
  ctx.rotate(turretAngle);
  
  // Turret shadow on ground
  ctx.save();
  ctx.translate(4, 5);
  ctx.rotate(-turretAngle + angle); // undo parent rotation for shadow
  ctx.beginPath();
  ctx.arc(0, 0, size * 0.4, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(0,0,0,0.2)';
  ctx.fill();
  ctx.restore();
  
  // Barrel with 2.5D depth
  const barrelLength = size * 1.4;
  const barrelWidth = size * 0.12;
  const barrelDepth = height * 0.4;
  
  // Barrel side (south face)
  ctx.fillStyle = '#3a3a3a';
  ctx.fillRect(size * 0.3, barrelWidth, barrelLength - size * 0.3, barrelDepth * 0.5);
  
  // Barrel top (chrome)
  const barrelGrad = ctx.createLinearGradient(0, -barrelWidth, 0, barrelWidth);
  barrelGrad.addColorStop(0, '#555');
  barrelGrad.addColorStop(0.2, '#aaa');
  barrelGrad.addColorStop(0.4, '#e0e0e0');
  barrelGrad.addColorStop(0.5, '#f5f5f5');
  barrelGrad.addColorStop(0.6, '#d0d0d0');
  barrelGrad.addColorStop(0.8, '#888');
  barrelGrad.addColorStop(1, '#444');
  ctx.fillStyle = barrelGrad;
  ctx.beginPath();
  ctx.roundRect(size * 0.3, -barrelWidth, barrelLength - size * 0.3, barrelWidth * 2, 2);
  ctx.fill();
  
  // Muzzle brake
  ctx.fillStyle = '#666';
  ctx.beginPath();
  ctx.roundRect(barrelLength - 6, -barrelWidth * 1.3, 10, barrelWidth * 2.6, 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(barrelLength + 2, 0, barrelWidth * 0.4, 0, Math.PI * 2);
  ctx.fillStyle = '#111';
  ctx.fill();
  
  // Barrel shine
  ctx.strokeStyle = 'rgba(255,255,255,0.25)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(size * 0.35, -barrelWidth * 0.5);
  ctx.lineTo(barrelLength - 8, -barrelWidth * 0.5);
  ctx.stroke();
  
  // Turret dome (elevated)
  ctx.beginPath();
  ctx.arc(0, 0, size * 0.38, 0, Math.PI * 2);
  const turretGrad = ctx.createRadialGradient(-size * 0.1, -size * 0.1, 0, 0, 0, size * 0.38);
  turretGrad.addColorStop(0, lightenColor(tank.accentColor, 60));
  turretGrad.addColorStop(0.3, lightenColor(tank.accentColor, 20));
  turretGrad.addColorStop(0.7, tank.color);
  turretGrad.addColorStop(1, darkenColor(tank.color, 35));
  ctx.fillStyle = turretGrad;
  ctx.fill();
  ctx.strokeStyle = darkenColor(tank.color, 50);
  ctx.lineWidth = 2;
  ctx.stroke();
  
  // Turret specular
  ctx.beginPath();
  ctx.arc(-size * 0.08, -size * 0.1, size * 0.18, 0, Math.PI * 2);
  ctx.fillStyle = `rgba(255,255,255,${0.2 + Math.sin(time * 0.004) * 0.05})`;
  ctx.fill();
  
  ctx.restore(); // End turret rotation
  
  // Health bar (floating above)
  if (tank.health < tank.maxHealth) {
    const barWidth = size * 1.5;
    const barHeight = 4;
    const barY = -size - height - 12;
    
    ctx.fillStyle = 'rgba(0,0,0,0.8)';
    ctx.beginPath();
    ctx.roundRect(-barWidth / 2 - 1, barY - 1, barWidth + 2, barHeight + 2, 2);
    ctx.fill();
    
    const hp = tank.health / tank.maxHealth;
    const hpColor = hp > 0.5 ? '#4ade80' : hp > 0.25 ? '#fbbf24' : '#ef4444';
    ctx.fillStyle = hpColor;
    ctx.beginPath();
    ctx.roundRect(-barWidth / 2, barY, barWidth * hp, barHeight, 2);
    ctx.fill();
  }
  
  // Player indicator
  if (tank.isPlayer) {
    ctx.beginPath();
    ctx.arc(0, 0, size * 1.5, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(96, 165, 250, ${0.2 + Math.sin(time * 0.004) * 0.1})`;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([6, 6]);
    ctx.lineDashOffset = time * 0.02;
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.lineDashOffset = 0;
  }
  
  ctx.restore();
}

function drawTrack2D5(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, length: number, offset: number, color: string, depth: number) {
  ctx.save();
  ctx.translate(x, y);
  
  // Track side face (2.5D)
  ctx.fillStyle = '#1a1a1a';
  ctx.fillRect(-width / 2, length / 2, width, depth * 0.6);
  
  // Track top
  const trackGrad = ctx.createLinearGradient(-width / 2, 0, width / 2, 0);
  trackGrad.addColorStop(0, '#1a1a1a');
  trackGrad.addColorStop(0.3, '#3a3a3a');
  trackGrad.addColorStop(0.5, '#505050');
  trackGrad.addColorStop(0.7, '#3a3a3a');
  trackGrad.addColorStop(1, '#1a1a1a');
  ctx.fillStyle = trackGrad;
  ctx.beginPath();
  ctx.roundRect(-width / 2, -length / 2, width, length, 3);
  ctx.fill();
  
  // Track segments
  const segSpacing = 7;
  for (let i = -length / 2 + 2; i < length / 2; i += segSpacing) {
    const segY = ((i + offset * 3) % segSpacing + segSpacing) % segSpacing - segSpacing / 2 + i;
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fillRect(-width / 2 + 2, segY, width - 4, 2);
  }
  
  ctx.restore();
}

// ===== 2.5D OBSTACLE RENDERING =====
function drawObstacle2D5(ctx: CanvasRenderingContext2D, obs: Obstacle, time: number) {
  const { position, width, height: obsHeight, depth, type, color } = obs;
  const hp = obs.health / obs.maxHealth;
  
  // Shadow
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.beginPath();
  ctx.ellipse(position.x + 5, position.y + obsHeight / 2 + depth * 0.3, width * 0.5, obsHeight * 0.3, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  
  if (type === 'building') {
    drawBuilding2D5(ctx, position, width, obsHeight, depth, hp, time);
  } else if (type === 'crate') {
    drawCrate2D5(ctx, position, width, obsHeight, depth, hp);
  } else if (type === 'wall') {
    drawWall2D5(ctx, position, width, obsHeight, depth, hp);
  } else if (type === 'rock') {
    drawRock2D5(ctx, position, width, obsHeight, depth, obs.angle, hp);
  } else if (type === 'tree') {
    drawTree2D5(ctx, position, width, obsHeight, depth, hp);
  }
}

function drawBuilding2D5(ctx: CanvasRenderingContext2D, pos: Vector2, w: number, h: number, depth: number, hp: number, time: number) {
  const x = pos.x - w / 2;
  const y = pos.y - h / 2;
  
  // South face
  const southGrad = ctx.createLinearGradient(x, y + h, x, y + h + depth);
  southGrad.addColorStop(0, '#2d3748');
  southGrad.addColorStop(1, '#1a202c');
  ctx.fillStyle = southGrad;
  ctx.fillRect(x, y + h, w, depth);
  
  // East face
  const eastGrad = ctx.createLinearGradient(x + w, y, x + w + depth * 0.3, y);
  eastGrad.addColorStop(0, '#374151');
  eastGrad.addColorStop(1, '#1f2937');
  ctx.fillStyle = eastGrad;
  ctx.beginPath();
  ctx.moveTo(x + w, y);
  ctx.lineTo(x + w + depth * 0.3, y + depth * 0.3);
  ctx.lineTo(x + w + depth * 0.3, y + h + depth);
  ctx.lineTo(x + w, y + h);
  ctx.closePath();
  ctx.fill();
  
  // Top face
  const topGrad = ctx.createLinearGradient(x, y, x + w, y + h);
  topGrad.addColorStop(0, '#6b7280');
  topGrad.addColorStop(0.5, '#4b5563');
  topGrad.addColorStop(1, '#374151');
  ctx.fillStyle = topGrad;
  ctx.fillRect(x, y, w, h);
  
  // Top face highlight
  ctx.fillStyle = 'rgba(255,255,255,0.05)';
  ctx.fillRect(x, y, w, 3);
  ctx.fillRect(x, y, 3, h);
  
  // Windows
  const winSize = 8;
  for (let wx = x + 12; wx < x + w - 12; wx += 16) {
    for (let wy = y + 12; wy < y + h - 12; wy += 16) {
      ctx.fillStyle = 'rgba(100, 180, 255, 0.15)';
      ctx.fillRect(wx, wy, winSize, winSize);
    }
  }
  
  // Damage
  if (hp < 0.7) {
    ctx.strokeStyle = 'rgba(20,10,5,0.6)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x + w * 0.2, y + h * 0.2);
    ctx.lineTo(x + w * 0.5, y + h * 0.5);
    ctx.lineTo(x + w * 0.7, y + h * 0.8);
    ctx.stroke();
  }
  
  // Border
  ctx.strokeStyle = 'rgba(0,0,0,0.4)';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(x, y, w, h);
}

function drawCrate2D5(ctx: CanvasRenderingContext2D, pos: Vector2, w: number, h: number, depth: number, hp: number) {
  const x = pos.x - w / 2;
  const y = pos.y - h / 2;
  
  // South face
  ctx.fillStyle = '#5c3310';
  ctx.fillRect(x, y + h, w, depth * 0.7);
  
  // East face
  ctx.fillStyle = '#6b3a12';
  ctx.beginPath();
  ctx.moveTo(x + w, y);
  ctx.lineTo(x + w + depth * 0.2, y + depth * 0.2);
  ctx.lineTo(x + w + depth * 0.2, y + h + depth * 0.7);
  ctx.lineTo(x + w, y + h);
  ctx.closePath();
  ctx.fill();
  
  // Top face
  const topGrad = ctx.createLinearGradient(x, y, x + w, y + h);
  topGrad.addColorStop(0, '#b8733a');
  topGrad.addColorStop(0.5, '#8B4513');
  topGrad.addColorStop(1, '#6b3410');
  ctx.fillStyle = topGrad;
  ctx.fillRect(x, y, w, h);
  
  // Wood grain
  ctx.strokeStyle = 'rgba(0,0,0,0.15)';
  ctx.lineWidth = 0.5;
  for (let i = y + 4; i < y + h; i += 5) {
    ctx.beginPath();
    ctx.moveTo(x, i);
    ctx.lineTo(x + w, i + Math.sin(i * 0.3) * 1);
    ctx.stroke();
  }
  
  // Metal bands
  ctx.fillStyle = 'rgba(100,100,100,0.4)';
  ctx.fillRect(x, y, w, 3);
  ctx.fillRect(x, y + h - 3, w, 3);
  
  // Border
  ctx.strokeStyle = '#3a1a05';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(x, y, w, h);
}

function drawWall2D5(ctx: CanvasRenderingContext2D, pos: Vector2, w: number, h: number, depth: number, hp: number) {
  const x = pos.x - w / 2;
  const y = pos.y - h / 2;
  
  // South face
  ctx.fillStyle = '#1f2937';
  ctx.fillRect(x, y + h, w, depth * 0.6);
  
  // East face (if wide enough)
  if (w > h) {
    ctx.fillStyle = '#2d3748';
    ctx.fillRect(x + w, y, depth * 0.2, h + depth * 0.6);
  }
  
  // Top face
  const topGrad = ctx.createLinearGradient(x, y, x + w, y + h);
  topGrad.addColorStop(0, '#6b7280');
  topGrad.addColorStop(0.5, '#4b5563');
  topGrad.addColorStop(1, '#374151');
  ctx.fillStyle = topGrad;
  ctx.fillRect(x, y, w, h);
  
  // Top highlight
  ctx.fillStyle = 'rgba(255,255,255,0.06)';
  ctx.fillRect(x, y, w, 2);
  
  ctx.strokeStyle = '#1f2937';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(x, y, w, h);
}

function drawRock2D5(ctx: CanvasRenderingContext2D, pos: Vector2, w: number, h: number, depth: number, angle: number, hp: number) {
  ctx.save();
  ctx.translate(pos.x, pos.y);
  ctx.rotate(angle);
  
  // South face (rounded)
  ctx.fillStyle = '#374151';
  ctx.beginPath();
  ctx.ellipse(0, depth * 0.3, w * 0.5, h * 0.3, 0, 0, Math.PI);
  ctx.fill();
  
  // Top face (irregular rock shape)
  const rockGrad = ctx.createRadialGradient(-w * 0.1, -h * 0.1, 0, 0, 0, w * 0.5);
  rockGrad.addColorStop(0, '#9ca3af');
  rockGrad.addColorStop(0.5, '#6b7280');
  rockGrad.addColorStop(1, '#4b5563');
  ctx.fillStyle = rockGrad;
  ctx.beginPath();
  ctx.ellipse(0, 0, w * 0.5, h * 0.4, 0, 0, Math.PI * 2);
  ctx.fill();
  
  // Highlight
  ctx.fillStyle = 'rgba(255,255,255,0.1)';
  ctx.beginPath();
  ctx.ellipse(-w * 0.1, -h * 0.1, w * 0.2, h * 0.15, 0, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.strokeStyle = '#374151';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.ellipse(0, 0, w * 0.5, h * 0.4, 0, 0, Math.PI * 2);
  ctx.stroke();
  
  ctx.restore();
}

function drawTree2D5(ctx: CanvasRenderingContext2D, pos: Vector2, w: number, h: number, depth: number, hp: number) {
  // Trunk
  ctx.fillStyle = '#5c3310';
  ctx.fillRect(pos.x - 4, pos.y - 5, 8, depth + 10);
  
  // Canopy shadow
  ctx.fillStyle = 'rgba(0,0,0,0.2)';
  ctx.beginPath();
  ctx.ellipse(pos.x + 3, pos.y + 5, w * 0.8, h * 0.4, 0, 0, Math.PI * 2);
  ctx.fill();
  
  // Canopy (layered circles for foliage)
  const layers = [
    { y: -depth * 0.3, r: w * 0.7, color: '#14532d' },
    { y: -depth * 0.5, r: w * 0.9, color: '#166534' },
    { y: -depth * 0.7, r: w * 0.75, color: '#15803d' },
    { y: -depth * 0.9, r: w * 0.5, color: '#22c55e' },
  ];
  
  layers.forEach(layer => {
    const grad = ctx.createRadialGradient(
      pos.x - layer.r * 0.2, pos.y + layer.y - layer.r * 0.2, 0,
      pos.x, pos.y + layer.y, layer.r
    );
    grad.addColorStop(0, lightenColor(layer.color, 20));
    grad.addColorStop(1, layer.color);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(pos.x, pos.y + layer.y, layer.r, 0, Math.PI * 2);
    ctx.fill();
  });
}

// ===== BULLET 2.5D =====
function drawBullet2D5(ctx: CanvasRenderingContext2D, bullet: Bullet, time: number) {
  const { position, trail, size, height: bulletHeight } = bullet;
  
  // Trail
  if (trail.length > 1) {
    for (let i = 1; i < trail.length; i++) {
      const alpha = (i / trail.length) * 0.5;
      const w = (i / trail.length) * size * 1.2;
      ctx.beginPath();
      ctx.moveTo(trail[i - 1].x, trail[i - 1].y);
      ctx.lineTo(trail[i].x, trail[i].y);
      ctx.strokeStyle = `rgba(255, 180, 50, ${alpha})`;
      ctx.lineWidth = w;
      ctx.lineCap = 'round';
      ctx.stroke();
    }
  }
  
  // Shadow on ground
  ctx.beginPath();
  ctx.ellipse(position.x + 2, position.y + 3, size * 0.8, size * 0.4, 0, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.fill();
  
  // Bullet at elevated height
  const by = position.y - bulletHeight;
  
  // Glow
  const glow = ctx.createRadialGradient(position.x, by, 0, position.x, by, size * 3);
  glow.addColorStop(0, 'rgba(255, 200, 50, 0.5)');
  glow.addColorStop(0.5, 'rgba(255, 150, 0, 0.2)');
  glow.addColorStop(1, 'rgba(255, 100, 0, 0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(position.x, by, size * 3, 0, Math.PI * 2);
  ctx.fill();
  
  // Core
  const coreGrad = ctx.createRadialGradient(position.x - size * 0.2, by - size * 0.2, 0, position.x, by, size);
  coreGrad.addColorStop(0, '#ffffff');
  coreGrad.addColorStop(0.3, '#fffde0');
  coreGrad.addColorStop(0.6, '#ffcc00');
  coreGrad.addColorStop(1, '#ff6600');
  ctx.fillStyle = coreGrad;
  ctx.beginPath();
  ctx.arc(position.x, by, size, 0, Math.PI * 2);
  ctx.fill();
}

function drawParticle(ctx: CanvasRenderingContext2D, particle: Particle, time: number) {
  ctx.save();
  ctx.globalAlpha = particle.opacity;
  ctx.translate(particle.position.x, particle.position.y - particle.height);
  ctx.rotate(particle.rotation);
  
  if (particle.type === 'smoke') {
    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, particle.size);
    gradient.addColorStop(0, `rgba(100, 100, 100, ${particle.opacity * 0.35})`);
    gradient.addColorStop(0.5, `rgba(70, 70, 70, ${particle.opacity * 0.2})`);
    gradient.addColorStop(1, `rgba(40, 40, 40, 0)`);
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(0, 0, particle.size, 0, Math.PI * 2);
    ctx.fill();
  } else if (particle.type === 'dust') {
    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, particle.size);
    gradient.addColorStop(0, `rgba(160, 130, 90, ${particle.opacity * 0.4})`);
    gradient.addColorStop(0.5, `rgba(130, 100, 70, ${particle.opacity * 0.2})`);
    gradient.addColorStop(1, `rgba(100, 80, 50, 0)`);
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(0, 0, particle.size, 0, Math.PI * 2);
    ctx.fill();
  } else if (particle.type === 'spark') {
    ctx.shadowColor = particle.color;
    ctx.shadowBlur = 4;
    ctx.fillStyle = particle.color;
    ctx.fillRect(-particle.size / 2, -particle.size / 4, particle.size, particle.size / 2);
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-particle.size / 4, -particle.size / 8, particle.size / 2, particle.size / 4);
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
    ctx.beginPath();
    ctx.moveTo(-particle.size / 2, -particle.size / 3);
    ctx.lineTo(particle.size / 2, -particle.size / 4);
    ctx.lineTo(particle.size / 3, particle.size / 3);
    ctx.lineTo(-particle.size / 3, particle.size / 2);
    ctx.closePath();
    ctx.fill();
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
  
  // Shockwave
  ctx.beginPath();
  ctx.arc(explosion.position.x, explosion.position.y, explosion.radius * 1.3, 0, Math.PI * 2);
  ctx.strokeStyle = `rgba(255, 200, 100, ${(1 - progress) * 0.4})`;
  ctx.lineWidth = 3 + (1 - progress) * 3;
  ctx.stroke();
  
  // Fire ball
  ctx.globalAlpha = (1 - progress) * 0.8;
  const outerGrad = ctx.createRadialGradient(
    explosion.position.x, explosion.position.y, 0,
    explosion.position.x, explosion.position.y, explosion.radius * 1.2
  );
  outerGrad.addColorStop(0, 'rgba(255, 220, 100, 0.9)');
  outerGrad.addColorStop(0.3, 'rgba(255, 150, 50, 0.6)');
  outerGrad.addColorStop(0.6, 'rgba(255, 80, 0, 0.3)');
  outerGrad.addColorStop(1, 'rgba(100, 0, 0, 0)');
  ctx.fillStyle = outerGrad;
  ctx.beginPath();
  ctx.arc(explosion.position.x, explosion.position.y, explosion.radius * 1.2, 0, Math.PI * 2);
  ctx.fill();
  
  // Core
  ctx.globalAlpha = 1 - progress;
  const innerGrad = ctx.createRadialGradient(
    explosion.position.x, explosion.position.y, 0,
    explosion.position.x, explosion.position.y, explosion.radius * 0.4
  );
  innerGrad.addColorStop(0, '#ffffff');
  innerGrad.addColorStop(0.5, '#ffcc00');
  innerGrad.addColorStop(1, 'rgba(255, 100, 0, 0)');
  ctx.fillStyle = innerGrad;
  ctx.beginPath();
  ctx.arc(explosion.position.x, explosion.position.y, explosion.radius * 0.4, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.restore();
}

function drawDynamicLighting(ctx: CanvasRenderingContext2D, state: GameState, time: number) {
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  
  // Explosion lights
  state.explosions.forEach(e => {
    const intensity = (e.lifetime / e.maxLifetime) * 0.4;
    const gradient = ctx.createRadialGradient(
      e.position.x, e.position.y, 0,
      e.position.x, e.position.y, e.maxRadius * 3
    );
    gradient.addColorStop(0, `rgba(255, 150, 50, ${intensity})`);
    gradient.addColorStop(0.5, `rgba(255, 100, 30, ${intensity * 0.3})`);
    gradient.addColorStop(1, 'rgba(255, 50, 0, 0)');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(e.position.x, e.position.y, e.maxRadius * 3, 0, Math.PI * 2);
    ctx.fill();
  });
  
  // Player light
  const pIntensity = 0.08 + Math.sin(time * 0.005) * 0.02;
  const pGrad = ctx.createRadialGradient(
    state.player.position.x, state.player.position.y, 0,
    state.player.position.x, state.player.position.y, 120
  );
  pGrad.addColorStop(0, `rgba(96, 165, 250, ${pIntensity})`);
  pGrad.addColorStop(1, 'rgba(96, 165, 250, 0)');
  ctx.fillStyle = pGrad;
  ctx.beginPath();
  ctx.arc(state.player.position.x, state.player.position.y, 120, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.restore();
}

function drawVignette(ctx: CanvasRenderingContext2D) {
  const gradient = ctx.createRadialGradient(
    CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, CANVAS_WIDTH * 0.3,
    CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, CANVAS_WIDTH * 0.7
  );
  gradient.addColorStop(0, 'rgba(0,0,0,0)');
  gradient.addColorStop(1, 'rgba(0,0,0,0.5)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
}

function drawAtmosphere(ctx: CanvasRenderingContext2D, time: number) {
  // Subtle fog at bottom
  ctx.save();
  ctx.globalAlpha = 0.04;
  const fogGrad = ctx.createLinearGradient(0, CANVAS_HEIGHT, 0, CANVAS_HEIGHT * 0.7);
  fogGrad.addColorStop(0, 'rgba(100, 130, 180, 0.5)');
  fogGrad.addColorStop(1, 'rgba(100, 130, 180, 0)');
  ctx.fillStyle = fogGrad;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  ctx.restore();
}

function drawCrosshair(ctx: CanvasRenderingContext2D, state: GameState, time: number) {
  const aimDist = 120;
  const cx = CANVAS_WIDTH / 2 + Math.cos(state.player.turretAngle) * aimDist;
  const cy = CANVAS_HEIGHT / 2 + Math.sin(state.player.turretAngle) * aimDist;
  
  ctx.save();
  ctx.translate(cx, cy);
  
  const pulse = Math.sin(time * 0.005) * 0.2 + 0.8;
  const rot = time * 0.001;
  
  // Rotating outer ring
  ctx.save();
  ctx.rotate(rot);
  ctx.beginPath();
  ctx.arc(0, 0, 16, 0, Math.PI * 0.4);
  ctx.arc(0, 0, 16, Math.PI, Math.PI * 1.4);
  ctx.strokeStyle = `rgba(255, 120, 50, ${0.5 * pulse})`;
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.restore();
  
  // Center dot
  const dotGlow = ctx.createRadialGradient(0, 0, 0, 0, 0, 5);
  dotGlow.addColorStop(0, `rgba(255, 200, 100, ${0.8 * pulse})`);
  dotGlow.addColorStop(1, 'rgba(255, 100, 50, 0)');
  ctx.fillStyle = dotGlow;
  ctx.beginPath();
  ctx.arc(0, 0, 5, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.beginPath();
  ctx.arc(0, 0, 1.5, 0, Math.PI * 2);
  ctx.fillStyle = `rgba(255, 255, 255, ${pulse})`;
  ctx.fill();
  
  // Cross lines
  ctx.strokeStyle = `rgba(255, 120, 50, ${0.5 * pulse})`;
  ctx.lineWidth = 1.5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(0, -5); ctx.lineTo(0, -12);
  ctx.moveTo(0, 5); ctx.lineTo(0, 12);
  ctx.moveTo(-5, 0); ctx.lineTo(-12, 0);
  ctx.moveTo(5, 0); ctx.lineTo(12, 0);
  ctx.stroke();
  
  ctx.restore();
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
