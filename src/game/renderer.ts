import { GameState, Tank, Bullet, Particle, Explosion, Obstacle, Vector2, ObstacleType } from './types';
import { CANVAS_WIDTH, CANVAS_HEIGHT, MAP_WIDTH, MAP_HEIGHT } from './engine';

let groundDecals: Array<{x: number; y: number; radius: number; opacity: number; type: 'scorch' | 'crater'}> = [];
const MAX_DECALS = 80;

export function renderGame(ctx: CanvasRenderingContext2D, state: GameState, time: number) {
  const camera = {
    x: state.player.position.x - CANVAS_WIDTH / 2 + state.screenShake.x,
    y: state.player.position.y - CANVAS_HEIGHT / 2 + state.screenShake.y,
  };

  ctx.save();
  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  drawBackground(ctx, time);
  
  ctx.save();
  ctx.translate(-camera.x, -camera.y);
  
  // Ground layer
  drawVietnamGround(ctx, camera, time, state);
  drawGroundDecals(ctx);
  
  // Collect drawables for Y-sorting
  interface Drawable { y: number; draw: () => void; }
  const drawables: Drawable[] = [];
  
  // Rice paddies (flat, drawn first as ground decoration)
  state.obstacles.filter(o => o.type === 'rice_paddy').forEach(obs => {
    drawables.push({ y: obs.position.y + obs.height / 2, draw: () => drawRicePaddy(ctx, obs, time) });
  });
  
  // All other obstacles
  state.obstacles.filter(o => o.type !== 'rice_paddy').forEach(obs => {
    drawables.push({ y: obs.position.y + obs.height / 2, draw: () => drawObstacle2D5(ctx, obs, time) });
  });
  
  // Tanks
  state.enemies.forEach(tank => {
    drawables.push({ y: tank.position.y, draw: () => drawTank2D5(ctx, tank, time) });
  });
  drawables.push({ y: state.player.position.y, draw: () => drawTank2D5(ctx, state.player, time) });
  
  // Bullets
  state.bullets.forEach(b => {
    drawables.push({ y: b.position.y, draw: () => drawBullet2D5(ctx, b, time) });
  });
  
  drawables.sort((a, b) => a.y - b.y);
  
  // Smoke/dust behind
  state.particles.filter(p => p.type === 'smoke' || p.type === 'dust' || p.type === 'mist').forEach(p => drawParticle(ctx, p, time));
  
  // Sorted entities
  drawables.forEach(d => d.draw());
  
  // Particles in front
  state.particles.filter(p => p.type !== 'smoke' && p.type !== 'dust' && p.type !== 'mist').forEach(p => drawParticle(ctx, p, time));
  
  // Fireflies (always on top, atmospheric)
  drawFireflies(ctx, state, time);
  
  // Explosions
  state.explosions.forEach(e => drawExplosion(ctx, e, time));
  
  // Dynamic lighting
  drawDynamicLighting(ctx, state, time);
  
  ctx.restore();
  
  // Post-processing
  drawVignette(ctx);
  drawMistOverlay(ctx, time);
  drawCrosshair(ctx, state, time);
}

// ===== GROUND =====
function drawBackground(ctx: CanvasRenderingContext2D, time: number) {
  const gradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
  gradient.addColorStop(0, '#1a2817');
  gradient.addColorStop(0.5, '#1f2f1a');
  gradient.addColorStop(1, '#141f10');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
}

function drawVietnamGround(ctx: CanvasRenderingContext2D, camera: Vector2, time: number, state: GameState) {
  // Base muddy ground
  ctx.fillStyle = '#2a3520';
  ctx.fillRect(0, 0, MAP_WIDTH, MAP_HEIGHT);
  
  // Dirt patches
  const tileSize = 100;
  const startX = Math.floor(camera.x / tileSize) * tileSize;
  const startY = Math.floor(camera.y / tileSize) * tileSize;
  
  for (let x = startX - tileSize; x < camera.x + CANVAS_WIDTH + tileSize; x += tileSize) {
    for (let y = startY - tileSize; y < camera.y + CANVAS_HEIGHT + tileSize; y += tileSize) {
      const hash = Math.sin(x * 0.01 + y * 0.013) * 10000;
      const n = hash - Math.floor(hash);
      
      if (n > 0.6) {
        // Dirt patch
        ctx.fillStyle = `rgba(90, 70, 40, ${0.1 + n * 0.1})`;
        ctx.beginPath();
        ctx.ellipse(x + tileSize/2, y + tileSize/2, tileSize * 0.4, tileSize * 0.3, n * Math.PI, 0, Math.PI * 2);
        ctx.fill();
      } else if (n > 0.3) {
        // Grass tufts
        ctx.fillStyle = `rgba(60, 90, 40, ${0.15})`;
        for (let g = 0; g < 3; g++) {
          const gx = x + (n * 100 + g * 30) % tileSize;
          const gy = y + (n * 70 + g * 40) % tileSize;
          ctx.beginPath();
          ctx.ellipse(gx, gy, 4, 2, g, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
  }
  
  // Dirt paths (connecting areas)
  ctx.strokeStyle = 'rgba(100, 80, 50, 0.15)';
  ctx.lineWidth = 30;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(0, MAP_HEIGHT / 2);
  ctx.bezierCurveTo(MAP_WIDTH * 0.3, MAP_HEIGHT * 0.4, MAP_WIDTH * 0.7, MAP_HEIGHT * 0.6, MAP_WIDTH, MAP_HEIGHT / 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(MAP_WIDTH / 2, 0);
  ctx.bezierCurveTo(MAP_WIDTH * 0.4, MAP_HEIGHT * 0.3, MAP_WIDTH * 0.6, MAP_HEIGHT * 0.7, MAP_WIDTH / 2, MAP_HEIGHT);
  ctx.stroke();
  
  // Small puddles
  for (let i = 0; i < 40; i++) {
    const px = (i * 317) % MAP_WIDTH;
    const py = (i * 523) % MAP_HEIGHT;
    if (px > camera.x - 50 && px < camera.x + CANVAS_WIDTH + 50 &&
        py > camera.y - 50 && py < camera.y + CANVAS_HEIGHT + 50) {
      const pr = 8 + (i % 12);
      const puddleGrad = ctx.createRadialGradient(px, py, 0, px, py, pr);
      puddleGrad.addColorStop(0, 'rgba(60, 80, 60, 0.3)');
      puddleGrad.addColorStop(0.7, 'rgba(50, 70, 50, 0.15)');
      puddleGrad.addColorStop(1, 'rgba(40, 60, 40, 0)');
      ctx.fillStyle = puddleGrad;
      ctx.beginPath();
      ctx.ellipse(px, py, pr, pr * 0.6, i * 0.3, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  
  // Map boundary - jungle edge
  const pulse = 0.3 + Math.sin(time * 0.002) * 0.1;
  
  // Jungle border gradient
  const edgeSize = 60;
  // Top
  const topGrad = ctx.createLinearGradient(0, 0, 0, edgeSize);
  topGrad.addColorStop(0, `rgba(20, 60, 20, ${pulse})`);
  topGrad.addColorStop(1, 'rgba(20, 60, 20, 0)');
  ctx.fillStyle = topGrad;
  ctx.fillRect(0, 0, MAP_WIDTH, edgeSize);
  // Bottom
  const botGrad = ctx.createLinearGradient(0, MAP_HEIGHT, 0, MAP_HEIGHT - edgeSize);
  botGrad.addColorStop(0, `rgba(20, 60, 20, ${pulse})`);
  botGrad.addColorStop(1, 'rgba(20, 60, 20, 0)');
  ctx.fillStyle = botGrad;
  ctx.fillRect(0, MAP_HEIGHT - edgeSize, MAP_WIDTH, edgeSize);
  // Left
  const leftGrad = ctx.createLinearGradient(0, 0, edgeSize, 0);
  leftGrad.addColorStop(0, `rgba(20, 60, 20, ${pulse})`);
  leftGrad.addColorStop(1, 'rgba(20, 60, 20, 0)');
  ctx.fillStyle = leftGrad;
  ctx.fillRect(0, 0, edgeSize, MAP_HEIGHT);
  // Right
  const rightGrad = ctx.createLinearGradient(MAP_WIDTH, 0, MAP_WIDTH - edgeSize, 0);
  rightGrad.addColorStop(0, `rgba(20, 60, 20, ${pulse})`);
  rightGrad.addColorStop(1, 'rgba(20, 60, 20, 0)');
  ctx.fillStyle = rightGrad;
  ctx.fillRect(MAP_WIDTH - edgeSize, 0, edgeSize, MAP_HEIGHT);
  
  // Boundary line
  ctx.strokeStyle = `rgba(34, 197, 94, ${pulse * 0.5})`;
  ctx.lineWidth = 2;
  ctx.setLineDash([15, 15]);
  ctx.lineDashOffset = -time * 0.01;
  ctx.strokeRect(20, 20, MAP_WIDTH - 40, MAP_HEIGHT - 40);
  ctx.setLineDash([]);
  ctx.lineDashOffset = 0;
}

function drawGroundDecals(ctx: CanvasRenderingContext2D) {
  groundDecals.forEach(decal => {
    ctx.save();
    ctx.globalAlpha = decal.opacity;
    if (decal.type === 'scorch') {
      const g = ctx.createRadialGradient(decal.x, decal.y, 0, decal.x, decal.y, decal.radius);
      g.addColorStop(0, 'rgba(20, 15, 5, 0.6)');
      g.addColorStop(0.6, 'rgba(30, 25, 10, 0.3)');
      g.addColorStop(1, 'rgba(20, 15, 5, 0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.ellipse(decal.x, decal.y, decal.radius, decal.radius * 0.7, 0, 0, Math.PI * 2);
      ctx.fill();
    } else {
      const g = ctx.createRadialGradient(decal.x, decal.y, 0, decal.x, decal.y, decal.radius);
      g.addColorStop(0, 'rgba(10, 8, 3, 0.8)');
      g.addColorStop(0.6, 'rgba(25, 20, 8, 0.4)');
      g.addColorStop(1, 'rgba(30, 25, 10, 0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.ellipse(decal.x, decal.y, decal.radius, decal.radius * 0.7, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  });
}

export function addGroundDecal(x: number, y: number, radius: number, type: 'scorch' | 'crater') {
  groundDecals.push({ x, y, radius, opacity: 0.8, type });
  if (groundDecals.length > MAX_DECALS) groundDecals = groundDecals.slice(-MAX_DECALS);
}

export function clearDecals() { groundDecals = []; }

// ===== RICE PADDY =====
function drawRicePaddy(ctx: CanvasRenderingContext2D, obs: Obstacle, time: number) {
  const { position, width, height } = obs;
  const x = position.x - width / 2;
  const y = position.y - height / 2;
  
  // Water/mud base
  const waterGrad = ctx.createRadialGradient(position.x, position.y, 0, position.x, position.y, width * 0.6);
  waterGrad.addColorStop(0, 'rgba(60, 100, 70, 0.4)');
  waterGrad.addColorStop(0.5, 'rgba(50, 85, 55, 0.3)');
  waterGrad.addColorStop(1, 'rgba(40, 70, 45, 0.1)');
  ctx.fillStyle = waterGrad;
  ctx.beginPath();
  ctx.ellipse(position.x, position.y, width / 2, height / 2, obs.angle, 0, Math.PI * 2);
  ctx.fill();
  
  // Rice rows
  ctx.strokeStyle = 'rgba(100, 140, 60, 0.2)';
  ctx.lineWidth = 1;
  const rows = 6;
  for (let i = 0; i < rows; i++) {
    const ry = y + (height / rows) * i + height / rows / 2;
    ctx.beginPath();
    for (let rx = x + 10; rx < x + width - 10; rx += 8) {
      const wave = Math.sin(rx * 0.1 + time * 0.002 + i) * 2;
      if (rx === x + 10) ctx.moveTo(rx, ry + wave);
      else ctx.lineTo(rx, ry + wave);
    }
    ctx.stroke();
  }
  
  // Water reflection shimmer
  ctx.fillStyle = `rgba(150, 200, 150, ${0.03 + Math.sin(time * 0.003) * 0.02})`;
  ctx.beginPath();
  ctx.ellipse(position.x + 5, position.y - 3, width * 0.2, height * 0.15, 0, 0, Math.PI * 2);
  ctx.fill();
  
  // Border (dike)
  ctx.strokeStyle = 'rgba(80, 65, 40, 0.3)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.ellipse(position.x, position.y, width / 2 + 2, height / 2 + 2, obs.angle, 0, Math.PI * 2);
  ctx.stroke();
}

// ===== OBSTACLE DISPATCH =====
function drawObstacle2D5(ctx: CanvasRenderingContext2D, obs: Obstacle, time: number) {
  // Shadow
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath();
  ctx.ellipse(obs.position.x + 4, obs.position.y + obs.height / 2 + obs.depth * 0.2, obs.width * 0.45, obs.height * 0.25, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  
  switch (obs.type) {
    case 'stilt_house': drawStiltHouse(ctx, obs, time); break;
    case 'mud_hut': drawMudHut(ctx, obs, time); break;
    case 'bamboo': drawBamboo(ctx, obs, time); break;
    case 'buddha': drawBuddha(ctx, obs, time); break;
    case 'well': drawWell(ctx, obs, time); break;
    case 'rice_stack': drawRiceStack(ctx, obs, time); break;
    case 'fence': drawFence(ctx, obs, time); break;
    case 'palm_tree': drawPalmTree(ctx, obs, time); break;
    case 'banana_tree': drawBananaTree(ctx, obs, time); break;
    case 'sampan': drawSampan(ctx, obs, time); break;
    case 'market_stall': drawMarketStall(ctx, obs, time); break;
    case 'stone_lantern': drawStoneLantern(ctx, obs, time); break;
    case 'village_gate': drawVillageGate(ctx, obs, time); break;
    case 'barrel': drawBarrel(ctx, obs, time); break;
    case 'cart': drawCart(ctx, obs, time); break;
    default: break;
  }
}

// ===== STILT HOUSE =====
function drawStiltHouse(ctx: CanvasRenderingContext2D, obs: Obstacle, time: number) {
  const { position, width, height, depth } = obs;
  const x = position.x - width / 2;
  const y = position.y - height / 2;
  const stilts = 4;
  
  ctx.save();
  ctx.translate(position.x, position.y);
  ctx.rotate(obs.angle);
  ctx.translate(-position.x, -position.y);
  
  // Stilts (legs)
  ctx.fillStyle = '#5c3317';
  const stiltPositions = [
    [x + 8, y + height - 5], [x + width - 12, y + height - 5],
    [x + 8, y + 8], [x + width - 12, y + 8]
  ];
  stiltPositions.forEach(([sx, sy]) => {
    ctx.fillRect(sx, sy, 4, depth * 0.7);
    ctx.fillStyle = '#4a2810';
    ctx.fillRect(sx, sy, 1, depth * 0.7);
    ctx.fillStyle = '#5c3317';
  });
  
  // Platform south face
  ctx.fillStyle = '#6b4423';
  ctx.fillRect(x - 3, y + height, width + 6, 6);
  
  // Platform top (floor)
  const floorGrad = ctx.createLinearGradient(x, y, x + width, y + height);
  floorGrad.addColorStop(0, '#a0784a');
  floorGrad.addColorStop(0.5, '#8B6914');
  floorGrad.addColorStop(1, '#6b4e12');
  ctx.fillStyle = floorGrad;
  ctx.fillRect(x - 3, y + height - 6, width + 6, 6);
  
  // Walls
  // South wall
  ctx.fillStyle = '#8B7355';
  ctx.fillRect(x, y + 5, width, height - 10);
  
  // Wall texture (bamboo weave)
  ctx.strokeStyle = 'rgba(0,0,0,0.1)';
  ctx.lineWidth = 0.5;
  for (let wy = y + 8; wy < y + height - 8; wy += 6) {
    ctx.beginPath();
    ctx.moveTo(x + 2, wy);
    ctx.lineTo(x + width - 2, wy);
    ctx.stroke();
  }
  
  // Window
  ctx.fillStyle = 'rgba(30, 20, 10, 0.7)';
  ctx.fillRect(x + width * 0.35, y + height * 0.3, width * 0.3, height * 0.25);
  ctx.strokeStyle = '#5c3317';
  ctx.lineWidth = 1;
  ctx.strokeRect(x + width * 0.35, y + height * 0.3, width * 0.3, height * 0.25);
  
  // Thatched roof (triangular, elevated)
  const roofPeak = y - depth * 0.5;
  const roofOverhang = 12;
  
  // Roof south face
  ctx.fillStyle = '#7a6832';
  ctx.beginPath();
  ctx.moveTo(x - roofOverhang, y + 5);
  ctx.lineTo(position.x, roofPeak);
  ctx.lineTo(x + width + roofOverhang, y + 5);
  ctx.closePath();
  ctx.fill();
  
  // Roof texture (thatch lines)
  ctx.strokeStyle = 'rgba(100, 80, 30, 0.3)';
  ctx.lineWidth = 1;
  for (let i = 0; i < 8; i++) {
    const t = i / 8;
    const ly = roofPeak + (y + 5 - roofPeak) * t;
    const lx1 = position.x - (position.x - x + roofOverhang) * t;
    const lx2 = position.x + (x + width + roofOverhang - position.x) * t;
    ctx.beginPath();
    ctx.moveTo(lx1, ly);
    ctx.lineTo(lx2, ly);
    ctx.stroke();
  }
  
  // Roof highlight
  ctx.fillStyle = 'rgba(200, 180, 100, 0.1)';
  ctx.beginPath();
  ctx.moveTo(x - roofOverhang + 5, y + 3);
  ctx.lineTo(position.x, roofPeak + 3);
  ctx.lineTo(position.x, roofPeak + 8);
  ctx.lineTo(x - roofOverhang + 8, y + 5);
  ctx.closePath();
  ctx.fill();
  
  // Roof ridge
  ctx.strokeStyle = '#5c4420';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x - roofOverhang, y + 5);
  ctx.lineTo(position.x, roofPeak);
  ctx.lineTo(x + width + roofOverhang, y + 5);
  ctx.stroke();
  
  ctx.restore();
}

// ===== MUD HUT =====
function drawMudHut(ctx: CanvasRenderingContext2D, obs: Obstacle, time: number) {
  const { position, width, height, depth } = obs;
  
  ctx.save();
  ctx.translate(position.x, position.y);
  ctx.rotate(obs.angle);
  
  // Round mud walls
  const wallGrad = ctx.createRadialGradient(-width * 0.1, -height * 0.1, 0, 0, 0, width * 0.5);
  wallGrad.addColorStop(0, '#a08060');
  wallGrad.addColorStop(0.6, '#8B7355');
  wallGrad.addColorStop(1, '#6b5540');
  ctx.fillStyle = wallGrad;
  ctx.beginPath();
  ctx.ellipse(0, 0, width * 0.45, height * 0.4, 0, 0, Math.PI * 2);
  ctx.fill();
  
  // Mud texture
  ctx.strokeStyle = 'rgba(80, 60, 40, 0.2)';
  ctx.lineWidth = 0.5;
  for (let i = 0; i < 5; i++) {
    ctx.beginPath();
    ctx.ellipse(0, 0, width * (0.2 + i * 0.05), height * (0.15 + i * 0.04), i * 0.3, 0, Math.PI * 2);
    ctx.stroke();
  }
  
  // Door
  ctx.fillStyle = 'rgba(30, 20, 10, 0.7)';
  ctx.beginPath();
  ctx.ellipse(0, height * 0.25, width * 0.1, height * 0.15, 0, 0, Math.PI * 2);
  ctx.fill();
  
  // Conical thatched roof
  const roofGrad = ctx.createRadialGradient(0, -depth * 0.3, 0, 0, 0, width * 0.55);
  roofGrad.addColorStop(0, '#9a8842');
  roofGrad.addColorStop(0.5, '#7a6832');
  roofGrad.addColorStop(1, '#5a4822');
  ctx.fillStyle = roofGrad;
  ctx.beginPath();
  ctx.ellipse(0, -2, width * 0.55, height * 0.45, 0, 0, Math.PI * 2);
  ctx.fill();
  
  // Roof peak
  ctx.fillStyle = '#5a4822';
  ctx.beginPath();
  ctx.arc(0, -depth * 0.2, 4, 0, Math.PI * 2);
  ctx.fill();
  
  // Thatch lines
  ctx.strokeStyle = 'rgba(120, 100, 50, 0.3)';
  ctx.lineWidth = 0.5;
  for (let a = 0; a < Math.PI * 2; a += 0.3) {
    ctx.beginPath();
    ctx.moveTo(0, -depth * 0.2);
    ctx.lineTo(Math.cos(a) * width * 0.5, Math.sin(a) * height * 0.4 - 2);
    ctx.stroke();
  }
  
  ctx.restore();
}

// ===== BAMBOO CLUSTER =====
function drawBamboo(ctx: CanvasRenderingContext2D, obs: Obstacle, time: number) {
  const { position, width, height, depth, variant } = obs;
  const count = 5 + variant * 2;
  
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2 + obs.angle;
    const dist = width * 0.2 + (i % 3) * 4;
    const bx = position.x + Math.cos(angle) * dist;
    const by = position.y + Math.sin(angle) * dist;
    const bh = depth * (0.7 + Math.sin(i * 2.3) * 0.3);
    const sway = Math.sin(time * 0.002 + i) * 2;
    
    // Bamboo stalk
    const stalkGrad = ctx.createLinearGradient(bx, by, bx, by - bh);
    stalkGrad.addColorStop(0, '#3d6b2a');
    stalkGrad.addColorStop(0.3, '#5a9a3a');
    stalkGrad.addColorStop(0.7, '#4a7c3a');
    stalkGrad.addColorStop(1, '#3d6b2a');
    ctx.fillStyle = stalkGrad;
    ctx.fillRect(bx - 2 + sway * 0.3, by - bh, 4, bh);
    
    // Nodes
    ctx.fillStyle = '#2d5016';
    for (let n = 0; n < 4; n++) {
      const ny = by - bh * (n + 1) / 5;
      ctx.fillRect(bx - 3 + sway * (n / 4), ny, 6, 2);
    }
    
    // Leaves at top
    ctx.fillStyle = '#4a8a2a';
    for (let l = 0; l < 3; l++) {
      const la = (l / 3) * Math.PI - Math.PI / 2 + sway * 0.05;
      ctx.beginPath();
      ctx.ellipse(bx + sway + Math.cos(la) * 8, by - bh + Math.sin(la) * 4, 8, 2, la, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

// ===== BUDDHA STATUE =====
function drawBuddha(ctx: CanvasRenderingContext2D, obs: Obstacle, time: number) {
  const { position, width, depth, variant } = obs;
  
  ctx.save();
  ctx.translate(position.x, position.y);
  
  // Stone base/pedestal
  ctx.fillStyle = '#6b7280';
  ctx.beginPath();
  ctx.ellipse(0, 5, width * 0.6, width * 0.3, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#9ca3af';
  ctx.fillRect(-width * 0.5, -5, width, 10);
  
  // Body (seated)
  const bodyGrad = ctx.createLinearGradient(-width * 0.3, -depth * 0.5, width * 0.3, 0);
  bodyGrad.addColorStop(0, '#d1d5db');
  bodyGrad.addColorStop(0.5, '#9ca3af');
  bodyGrad.addColorStop(1, '#6b7280');
  ctx.fillStyle = bodyGrad;
  
  // Seated body shape
  ctx.beginPath();
  ctx.ellipse(0, -5, width * 0.35, width * 0.25, 0, 0, Math.PI * 2);
  ctx.fill();
  
  // Torso
  ctx.beginPath();
  ctx.moveTo(-width * 0.25, -5);
  ctx.quadraticCurveTo(-width * 0.3, -depth * 0.4, -width * 0.15, -depth * 0.6);
  ctx.lineTo(width * 0.15, -depth * 0.6);
  ctx.quadraticCurveTo(width * 0.3, -depth * 0.4, width * 0.25, -5);
  ctx.closePath();
  ctx.fill();
  
  // Head
  ctx.beginPath();
  ctx.arc(0, -depth * 0.7, width * 0.18, 0, Math.PI * 2);
  ctx.fillStyle = '#b0b5bc';
  ctx.fill();
  
  // Ushnisha (top knot)
  ctx.beginPath();
  ctx.arc(0, -depth * 0.85, width * 0.08, 0, Math.PI * 2);
  ctx.fillStyle = '#9ca3af';
  ctx.fill();
  
  // Golden glow for variant 0
  if (variant === 0) {
    const glow = ctx.createRadialGradient(0, -depth * 0.5, 0, 0, -depth * 0.5, width);
    glow.addColorStop(0, 'rgba(255, 200, 50, 0.08)');
    glow.addColorStop(1, 'rgba(255, 200, 50, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, -depth * 0.5, width, 0, Math.PI * 2);
    ctx.fill();
  }
  
  // Moss
  ctx.fillStyle = 'rgba(60, 100, 40, 0.3)';
  ctx.beginPath();
  ctx.ellipse(-width * 0.15, -3, 5, 3, 0, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.restore();
}

// ===== WELL =====
function drawWell(ctx: CanvasRenderingContext2D, obs: Obstacle, time: number) {
  const { position, width, depth } = obs;
  const r = width * 0.45;
  
  ctx.save();
  ctx.translate(position.x, position.y);
  
  // Stone base (circular)
  ctx.fillStyle = '#6b7280';
  ctx.beginPath();
  ctx.ellipse(0, 3, r + 3, r * 0.6 + 2, 0, 0, Math.PI * 2);
  ctx.fill();
  
  // Well wall
  const wallGrad = ctx.createLinearGradient(-r, 0, r, 0);
  wallGrad.addColorStop(0, '#78716c');
  wallGrad.addColorStop(0.3, '#a8a29e');
  wallGrad.addColorStop(0.7, '#78716c');
  wallGrad.addColorStop(1, '#57534e');
  ctx.fillStyle = wallGrad;
  ctx.beginPath();
  ctx.ellipse(0, 0, r, r * 0.6, 0, 0, Math.PI * 2);
  ctx.fill();
  
  // Inner hole (dark water)
  ctx.fillStyle = '#1a1a1a';
  ctx.beginPath();
  ctx.ellipse(0, 0, r * 0.7, r * 0.4, 0, 0, Math.PI * 2);
  ctx.fill();
  
  // Water shimmer
  ctx.fillStyle = `rgba(100, 150, 180, ${0.2 + Math.sin(time * 0.003) * 0.1})`;
  ctx.beginPath();
  ctx.ellipse(-2, -1, r * 0.3, r * 0.15, 0, 0, Math.PI * 2);
  ctx.fill();
  
  // Stone texture
  ctx.strokeStyle = 'rgba(0,0,0,0.15)';
  ctx.lineWidth = 0.5;
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * r * 0.75, Math.sin(a) * r * 0.45);
    ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r * 0.6);
    ctx.stroke();
  }
  
  // Rope & bucket frame (simple A-frame)
  ctx.strokeStyle = '#5c3317';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-r * 0.3, -r * 0.3);
  ctx.lineTo(0, -depth * 1.2);
  ctx.lineTo(r * 0.3, -r * 0.3);
  ctx.stroke();
  
  // Crossbar
  ctx.beginPath();
  ctx.moveTo(-r * 0.4, -depth * 0.8);
  ctx.lineTo(r * 0.4, -depth * 0.8);
  ctx.stroke();
  
  ctx.restore();
}

// ===== RICE STACK =====
function drawRiceStack(ctx: CanvasRenderingContext2D, obs: Obstacle, time: number) {
  const { position, width, height, depth } = obs;
  
  ctx.save();
  ctx.translate(position.x, position.y);
  
  // Conical stack of rice hay
  const stackGrad = ctx.createLinearGradient(0, -depth, 0, height * 0.3);
  stackGrad.addColorStop(0, '#d4a84a');
  stackGrad.addColorStop(0.3, '#c4a44a');
  stackGrad.addColorStop(0.7, '#a08030');
  stackGrad.addColorStop(1, '#806020');
  ctx.fillStyle = stackGrad;
  
  // Cone shape
  ctx.beginPath();
  ctx.moveTo(0, -depth);
  ctx.quadraticCurveTo(-width * 0.6, -depth * 0.3, -width * 0.5, height * 0.2);
  ctx.lineTo(width * 0.5, height * 0.2);
  ctx.quadraticCurveTo(width * 0.6, -depth * 0.3, 0, -depth);
  ctx.closePath();
  ctx.fill();
  
  // Hay texture lines
  ctx.strokeStyle = 'rgba(120, 90, 30, 0.3)';
  ctx.lineWidth = 0.5;
  for (let i = 0; i < 10; i++) {
    const t = i / 10;
    const y = -depth + depth * 1.2 * t;
    const w = width * 0.5 * t;
    ctx.beginPath();
    ctx.moveTo(-w, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }
  
  // Binding rope
  ctx.strokeStyle = '#5c3317';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.ellipse(0, -depth * 0.3, width * 0.35, 3, 0, 0, Math.PI * 2);
  ctx.stroke();
  
  ctx.restore();
}

// ===== FENCE =====
function drawFence(ctx: CanvasRenderingContext2D, obs: Obstacle, time: number) {
  const { position, width, height, depth } = obs;
  const isHorizontal = width > height;
  
  ctx.save();
  ctx.translate(position.x, position.y);
  
  if (isHorizontal) {
    // Horizontal fence
    const postSpacing = 20;
    const posts = Math.floor(width / postSpacing);
    
    // Rails
    ctx.fillStyle = '#6b4423';
    ctx.fillRect(-width / 2, -depth * 0.4, width, 3);
    ctx.fillRect(-width / 2, -depth * 0.7, width, 3);
    
    // Vertical posts
    for (let i = 0; i <= posts; i++) {
      const px = -width / 2 + i * postSpacing;
      ctx.fillStyle = '#5c3317';
      ctx.fillRect(px - 2, -depth, 4, depth + 3);
      // Pointed top
      ctx.beginPath();
      ctx.moveTo(px - 2, -depth);
      ctx.lineTo(px, -depth - 4);
      ctx.lineTo(px + 2, -depth);
      ctx.closePath();
      ctx.fill();
    }
  } else {
    // Vertical fence
    const postSpacing = 20;
    const posts = Math.floor(height / postSpacing);
    
    ctx.fillStyle = '#6b4423';
    ctx.fillRect(-3, -height / 2, 3, height);
    ctx.fillRect(3, -height / 2, 3, height);
    
    for (let i = 0; i <= posts; i++) {
      const py = -height / 2 + i * postSpacing;
      ctx.fillStyle = '#5c3317';
      ctx.fillRect(-depth * 0.3, py - 2, depth * 0.6, 4);
    }
  }
  
  ctx.restore();
}

// ===== PALM TREE =====
function drawPalmTree(ctx: CanvasRenderingContext2D, obs: Obstacle, time: number) {
  const { position, depth, variant } = obs;
  const sway = Math.sin(time * 0.001 + variant) * 3;
  
  ctx.save();
  ctx.translate(position.x, position.y);
  
  // Trunk (curved)
  ctx.strokeStyle = '#5c4420';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(0, 5);
  ctx.quadraticCurveTo(sway * 0.5, -depth * 0.5, sway, -depth);
  ctx.stroke();
  
  // Trunk rings
  ctx.strokeStyle = 'rgba(80, 60, 30, 0.4)';
  ctx.lineWidth = 1;
  for (let i = 0; i < 8; i++) {
    const t = i / 8;
    const ry = 5 + (-depth - 5) * t;
    const rx = sway * t;
    ctx.beginPath();
    ctx.moveTo(rx - 3, ry);
    ctx.lineTo(rx + 3, ry);
    ctx.stroke();
  }
  
  // Fronds
  const frondCount = 7;
  for (let i = 0; i < frondCount; i++) {
    const angle = (i / frondCount) * Math.PI * 2 + time * 0.0005;
    const frondSway = Math.sin(time * 0.002 + i) * 0.1;
    const fx = sway + Math.cos(angle + frondSway) * 35;
    const fy = -depth + Math.sin(angle + frondSway) * 20;
    
    // Frond stem
    ctx.strokeStyle = '#2d5016';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(sway, -depth);
    ctx.quadraticCurveTo(sway + (fx - sway) * 0.5, -depth + (fy + depth) * 0.3, fx, fy);
    ctx.stroke();
    
    // Leaves along frond
    ctx.fillStyle = '#3d7a1c';
    for (let l = 0; l < 6; l++) {
      const t = (l + 1) / 7;
      const lx = sway + (fx - sway) * t;
      const ly = -depth + (fy + depth) * t * 0.5;
      ctx.beginPath();
      ctx.ellipse(lx, ly, 6, 1.5, angle + frondSway, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  
  // Coconuts
  if (variant > 0) {
    ctx.fillStyle = '#5c3317';
    for (let c = 0; c < 3; c++) {
      const ca = (c / 3) * Math.PI * 2;
      ctx.beginPath();
      ctx.arc(sway + Math.cos(ca) * 4, -depth + 5 + Math.sin(ca) * 3, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  
  ctx.restore();
}

// ===== BANANA TREE =====
function drawBananaTree(ctx: CanvasRenderingContext2D, obs: Obstacle, time: number) {
  const { position, depth, variant } = obs;
  const sway = Math.sin(time * 0.0015 + variant * 2) * 2;
  
  ctx.save();
  ctx.translate(position.x, position.y);
  
  // Trunk (pseudostem - thick, layered)
  const trunkGrad = ctx.createLinearGradient(-6, 0, 6, 0);
  trunkGrad.addColorStop(0, '#4a7a2a');
  trunkGrad.addColorStop(0.5, '#6aaa4a');
  trunkGrad.addColorStop(1, '#3d6b2a');
  ctx.fillStyle = trunkGrad;
  ctx.fillRect(-5 + sway * 0.3, -depth * 0.7, 10, depth * 0.7 + 5);
  
  // Layer marks
  ctx.strokeStyle = 'rgba(30, 60, 15, 0.3)';
  ctx.lineWidth = 0.5;
  for (let i = 0; i < 6; i++) {
    const ly = -depth * 0.7 + i * (depth * 0.7 / 6);
    ctx.beginPath();
    ctx.moveTo(-5 + sway * 0.3, ly);
    ctx.lineTo(5 + sway * 0.3, ly);
    ctx.stroke();
  }
  
  // Large leaves
  const leafCount = 5 + variant;
  for (let i = 0; i < leafCount; i++) {
    const angle = (i / leafCount) * Math.PI * 2 + time * 0.0003;
    const leafSway = Math.sin(time * 0.002 + i * 1.5) * 0.15;
    const leafLen = 35 + variant * 5;
    
    const endX = sway + Math.cos(angle + leafSway) * leafLen;
    const endY = -depth * 0.7 + Math.sin(angle + leafSway) * leafLen * 0.4;
    
    // Leaf
    ctx.fillStyle = i % 2 === 0 ? '#3d8a1c' : '#4a9a2a';
    ctx.beginPath();
    ctx.moveTo(sway, -depth * 0.7);
    ctx.quadraticCurveTo(
      sway + (endX - sway) * 0.5 + Math.cos(angle + Math.PI/2) * 8,
      -depth * 0.7 + (endY + depth * 0.7) * 0.3,
      endX, endY
    );
    ctx.quadraticCurveTo(
      sway + (endX - sway) * 0.5 - Math.cos(angle + Math.PI/2) * 8,
      -depth * 0.7 + (endY + depth * 0.7) * 0.3,
      sway, -depth * 0.7
    );
    ctx.fill();
    
    // Leaf midrib
    ctx.strokeStyle = 'rgba(30, 80, 15, 0.4)';
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(sway, -depth * 0.7);
    ctx.lineTo(endX, endY);
    ctx.stroke();
  }
  
  // Banana bunch (variant 2)
  if (variant === 2) {
    ctx.fillStyle = '#c4a44a';
    for (let b = 0; b < 5; b++) {
      const ba = (b / 5) * Math.PI - Math.PI * 0.5;
      ctx.beginPath();
      ctx.ellipse(sway + Math.cos(ba) * 6, -depth * 0.5 + Math.sin(ba) * 4, 4, 2, ba, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  
  ctx.restore();
}

// ===== SAMPAN (boat) =====
function drawSampan(ctx: CanvasRenderingContext2D, obs: Obstacle, time: number) {
  const { position, width, height, angle } = obs;
  const bob = Math.sin(time * 0.002 + position.x * 0.01) * 1.5;
  
  ctx.save();
  ctx.translate(position.x, position.y + bob);
  ctx.rotate(angle);
  
  // Water ripples
  ctx.strokeStyle = 'rgba(100, 150, 120, 0.15)';
  ctx.lineWidth = 0.5;
  for (let r = 0; r < 3; r++) {
    ctx.beginPath();
    ctx.ellipse(0, 3, width * 0.5 + r * 5, height * 0.4 + r * 3, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  
  // Boat hull
  ctx.fillStyle = '#5c3317';
  ctx.beginPath();
  ctx.moveTo(-width * 0.5, 0);
  ctx.quadraticCurveTo(-width * 0.4, -height * 0.6, 0, -height * 0.5);
  ctx.quadraticCurveTo(width * 0.4, -height * 0.6, width * 0.5, 0);
  ctx.quadraticCurveTo(width * 0.4, height * 0.4, 0, height * 0.3);
  ctx.quadraticCurveTo(-width * 0.4, height * 0.4, -width * 0.5, 0);
  ctx.closePath();
  ctx.fill();
  
  // Inner hull
  ctx.fillStyle = '#7a4a25';
  ctx.beginPath();
  ctx.moveTo(-width * 0.4, 0);
  ctx.quadraticCurveTo(-width * 0.3, -height * 0.35, 0, -height * 0.3);
  ctx.quadraticCurveTo(width * 0.3, -height * 0.35, width * 0.4, 0);
  ctx.quadraticCurveTo(width * 0.3, height * 0.25, 0, height * 0.2);
  ctx.quadraticCurveTo(-width * 0.3, height * 0.25, -width * 0.4, 0);
  ctx.closePath();
  ctx.fill();
  
  // Planks
  ctx.strokeStyle = 'rgba(60, 30, 10, 0.3)';
  ctx.lineWidth = 0.5;
  for (let p = -width * 0.35; p < width * 0.35; p += 8) {
    ctx.beginPath();
    ctx.moveTo(p, -height * 0.3);
    ctx.lineTo(p, height * 0.2);
    ctx.stroke();
  }
  
  // Paddle
  ctx.strokeStyle = '#4a2810';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(width * 0.2, -height * 0.1);
  ctx.lineTo(width * 0.5, -height * 0.6);
  ctx.stroke();
  ctx.fillStyle = '#5c3317';
  ctx.beginPath();
  ctx.ellipse(width * 0.5, -height * 0.7, 4, 7, 0.3, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.restore();
}

// ===== MARKET STALL =====
function drawMarketStall(ctx: CanvasRenderingContext2D, obs: Obstacle, time: number) {
  const { position, width, height, depth, variant } = obs;
  
  ctx.save();
  ctx.translate(position.x, position.y);
  ctx.rotate(obs.angle);
  
  // Counter/table
  ctx.fillStyle = '#6b4423';
  ctx.fillRect(-width * 0.45, -height * 0.1, width * 0.9, height * 0.5);
  // South face
  ctx.fillStyle = '#5c3317';
  ctx.fillRect(-width * 0.45, height * 0.4, width * 0.9, depth * 0.3);
  
  // Posts (4 corners)
  ctx.fillStyle = '#5c3317';
  [[-0.45, -0.1], [0.4, -0.1], [-0.45, 0.35], [0.4, 0.35]].forEach(([px, py]) => {
    ctx.fillRect(px * width, py * height - depth, 3, depth + height * 0.1);
  });
  
  // Canopy/roof (colored fabric)
  const canopyColors = ['#b91c1c', '#1d4ed8', '#a16207', '#166534'];
  const canopyColor = canopyColors[variant % canopyColors.length];
  ctx.fillStyle = canopyColor;
  ctx.beginPath();
  ctx.moveTo(-width * 0.55, -depth);
  ctx.lineTo(width * 0.55, -depth);
  ctx.lineTo(width * 0.5, -height * 0.1);
  ctx.lineTo(-width * 0.5, -height * 0.1);
  ctx.closePath();
  ctx.fill();
  
  // Canopy scalloped edge
  ctx.fillStyle = canopyColor;
  for (let s = -width * 0.5; s < width * 0.5; s += 10) {
    ctx.beginPath();
    ctx.arc(s + 5, -height * 0.1, 5, 0, Math.PI);
    ctx.fill();
  }
  
  // Goods on counter (simple colored rectangles)
  const goodColors = ['#f59e0b', '#10b981', '#ef4444', '#8b5cf6'];
  for (let g = 0; g < 4; g++) {
    ctx.fillStyle = goodColors[g];
    ctx.fillRect(-width * 0.35 + g * width * 0.2, -height * 0.05, width * 0.12, height * 0.15);
  }
  
  ctx.restore();
}

// ===== STONE LANTERN =====
function drawStoneLantern(ctx: CanvasRenderingContext2D, obs: Obstacle, time: number) {
  const { position, width, depth } = obs;
  
  ctx.save();
  ctx.translate(position.x, position.y);
  
  // Base
  ctx.fillStyle = '#78716c';
  ctx.fillRect(-width * 0.4, -3, width * 0.8, 6);
  
  // Pillar
  ctx.fillStyle = '#a8a29e';
  ctx.fillRect(-width * 0.15, -depth * 0.5, width * 0.3, depth * 0.5);
  
  // Light chamber
  ctx.fillStyle = '#78716c';
  ctx.fillRect(-width * 0.35, -depth * 0.7, width * 0.7, depth * 0.25);
  
  // Light glow
  const glowIntensity = 0.3 + Math.sin(time * 0.003 + position.x) * 0.15;
  const glow = ctx.createRadialGradient(0, -depth * 0.6, 0, 0, -depth * 0.6, width * 0.8);
  glow.addColorStop(0, `rgba(255, 180, 50, ${glowIntensity})`);
  glow.addColorStop(0.5, `rgba(255, 150, 30, ${glowIntensity * 0.3})`);
  glow.addColorStop(1, 'rgba(255, 100, 0, 0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(0, -depth * 0.6, width * 0.8, 0, Math.PI * 2);
  ctx.fill();
  
  // Window openings
  ctx.fillStyle = `rgba(255, 200, 80, ${glowIntensity})`;
  ctx.fillRect(-width * 0.1, -depth * 0.65, width * 0.2, depth * 0.15);
  
  // Roof (cap)
  ctx.fillStyle = '#57534e';
  ctx.beginPath();
  ctx.moveTo(-width * 0.45, -depth * 0.7);
  ctx.lineTo(0, -depth);
  ctx.lineTo(width * 0.45, -depth * 0.7);
  ctx.closePath();
  ctx.fill();
  
  // Finial
  ctx.fillStyle = '#78716c';
  ctx.beginPath();
  ctx.arc(0, -depth - 2, 2, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.restore();
}

// ===== VILLAGE GATE (Torii-style) =====
function drawVillageGate(ctx: CanvasRenderingContext2D, obs: Obstacle, time: number) {
  const { position, width, depth } = obs;
  
  ctx.save();
  ctx.translate(position.x, position.y);
  ctx.rotate(obs.angle);
  
  // Two pillars
  ctx.fillStyle = '#991b1b';
  ctx.fillRect(-width * 0.45, -depth, 8, depth + 5);
  ctx.fillRect(width * 0.45 - 8, -depth, 8, depth + 5);
  
  // Pillar bases
  ctx.fillStyle = '#78716c';
  ctx.fillRect(-width * 0.45 - 3, 3, 14, 5);
  ctx.fillRect(width * 0.45 - 11, 3, 14, 5);
  
  // Top beam (kasagi) - curved
  ctx.fillStyle = '#7f1d1d';
  ctx.beginPath();
  ctx.moveTo(-width * 0.55, -depth);
  ctx.quadraticCurveTo(0, -depth - 8, width * 0.55, -depth);
  ctx.lineTo(width * 0.55, -depth + 6);
  ctx.quadraticCurveTo(0, -depth - 2, -width * 0.55, -depth + 6);
  ctx.closePath();
  ctx.fill();
  
  // Second beam (nuki)
  ctx.fillStyle = '#991b1b';
  ctx.fillRect(-width * 0.4, -depth * 0.7, width * 0.8, 5);
  
  // Center tablet
  ctx.fillStyle = '#1a1a1a';
  ctx.fillRect(-10, -depth * 0.85, 20, 12);
  ctx.fillStyle = '#c4a44a';
  ctx.font = '8px serif';
  ctx.textAlign = 'center';
  ctx.fillText('村', 0, -depth * 0.77);
  
  ctx.restore();
}

// ===== BARREL =====
function drawBarrel(ctx: CanvasRenderingContext2D, obs: Obstacle, time: number) {
  const { position, width, depth } = obs;
  const r = width * 0.45;
  
  ctx.save();
  ctx.translate(position.x, position.y);
  
  // Barrel body
  const barrelGrad = ctx.createLinearGradient(-r, 0, r, 0);
  barrelGrad.addColorStop(0, '#4a2810');
  barrelGrad.addColorStop(0.3, '#7a4a25');
  barrelGrad.addColorStop(0.5, '#8B5A2B');
  barrelGrad.addColorStop(0.7, '#7a4a25');
  barrelGrad.addColorStop(1, '#4a2810');
  ctx.fillStyle = barrelGrad;
  ctx.beginPath();
  ctx.ellipse(0, 0, r, r * 0.7, 0, 0, Math.PI * 2);
  ctx.fill();
  
  // Metal bands
  ctx.strokeStyle = '#374151';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(0, -2, r * 0.95, r * 0.65, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(0, 3, r * 0.95, r * 0.65, 0, 0, Math.PI * 2);
  ctx.stroke();
  
  // Top (ellipse)
  ctx.fillStyle = '#6b3a15';
  ctx.beginPath();
  ctx.ellipse(0, -depth * 0.3, r * 0.85, r * 0.5, 0, 0, Math.PI * 2);
  ctx.fill();
  
  // Side depth
  ctx.fillStyle = '#5c3317';
  ctx.beginPath();
  ctx.ellipse(0, -depth * 0.3, r * 0.85, r * 0.5, 0, Math.PI, Math.PI * 2);
  ctx.lineTo(r * 0.85, 0);
  ctx.ellipse(0, 0, r * 0.85, r * 0.5, 0, 0, Math.PI);
  ctx.closePath();
  ctx.fill();
  
  // Planks
  ctx.strokeStyle = 'rgba(40, 20, 5, 0.2)';
  ctx.lineWidth = 0.5;
  for (let a = 0; a < Math.PI * 2; a += 0.5) {
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * r * 0.3, Math.sin(a) * r * 0.2 - depth * 0.3);
    ctx.lineTo(Math.cos(a) * r * 0.85, Math.sin(a) * r * 0.5);
    ctx.stroke();
  }
  
  ctx.restore();
}

// ===== CART =====
function drawCart(ctx: CanvasRenderingContext2D, obs: Obstacle, time: number) {
  const { position, width, height, depth } = obs;
  
  ctx.save();
  ctx.translate(position.x, position.y);
  ctx.rotate(obs.angle);
  
  // Cart bed
  ctx.fillStyle = '#6b4423';
  ctx.fillRect(-width * 0.45, -height * 0.3, width * 0.9, height * 0.6);
  
  // Side walls
  ctx.fillStyle = '#5c3317';
  ctx.fillRect(-width * 0.45, -height * 0.3, width * 0.9, 3);
  ctx.fillRect(-width * 0.45, height * 0.3 - 3, width * 0.9, 3);
  ctx.fillRect(-width * 0.45, -height * 0.3, 3, height * 0.6);
  ctx.fillRect(width * 0.45 - 3, -height * 0.3, 3, height * 0.6);
  
  // Wheels
  ctx.fillStyle = '#3a2010';
  ctx.strokeStyle = '#5c3317';
  ctx.lineWidth = 2;
  [[-0.35, 0.35], [0.35, 0.35]].forEach(([wx, wy]) => {
    ctx.beginPath();
    ctx.arc(wx * width, wy * height, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    // Spokes
    ctx.strokeStyle = '#4a2810';
    ctx.lineWidth = 1;
    for (let s = 0; s < 4; s++) {
      const sa = (s / 4) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(wx * width, wy * height);
      ctx.lineTo(wx * width + Math.cos(sa) * 7, wy * height + Math.sin(sa) * 7);
      ctx.stroke();
    }
    ctx.strokeStyle = '#5c3317';
    ctx.lineWidth = 2;
  });
  
  // Handle/shaft
  ctx.strokeStyle = '#5c3317';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-width * 0.45, 0);
  ctx.lineTo(-width * 0.65, 0);
  ctx.stroke();
  
  // Cargo (hay/goods)
  ctx.fillStyle = '#c4a44a';
  ctx.beginPath();
  ctx.ellipse(0, 0, width * 0.3, height * 0.2, 0, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.restore();
}

// ===== TANK (same as before, simplified) =====
function drawTank2D5(ctx: CanvasRenderingContext2D, tank: Tank, time: number) {
  const { position, angle, turretAngle, size, height } = tank;
  
  // Shadow
  ctx.save();
  ctx.translate(position.x + 5, position.y + 7);
  ctx.rotate(angle);
  ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
  ctx.beginPath();
  ctx.ellipse(0, 0, size * 1.1, size * 0.7, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  
  ctx.save();
  ctx.translate(position.x, position.y);
  ctx.save();
  ctx.rotate(angle);
  
  // South side face
  ctx.fillStyle = darkenColor(tank.color, 50);
  ctx.fillRect(-size * 0.5, size * 0.35, size, height * 0.6);
  
  // Tracks
  drawTrack(ctx, -size * 0.6, 0, size * 0.28, size * 1.3, tank.trackOffset, tank.color, height * 0.5);
  drawTrack(ctx, size * 0.6, 0, size * 0.28, size * 1.3, tank.trackOffset, tank.color, height * 0.5);
  
  // Hull top
  ctx.beginPath();
  ctx.moveTo(-size * 0.4, -size * 0.6);
  ctx.lineTo(size * 0.4, -size * 0.6);
  ctx.quadraticCurveTo(size * 0.5, -size * 0.35, size * 0.5, -size * 0.15);
  ctx.lineTo(size * 0.5, size * 0.35);
  ctx.quadraticCurveTo(size * 0.4, size * 0.55, size * 0.3, size * 0.55);
  ctx.lineTo(-size * 0.3, size * 0.55);
  ctx.quadraticCurveTo(-size * 0.4, size * 0.55, -size * 0.5, size * 0.35);
  ctx.lineTo(-size * 0.5, -size * 0.15);
  ctx.quadraticCurveTo(-size * 0.5, -size * 0.35, -size * 0.4, -size * 0.6);
  ctx.closePath();
  
  const hullGrad = ctx.createLinearGradient(-size * 0.5, -size * 0.6, size * 0.5, size * 0.5);
  hullGrad.addColorStop(0, lightenColor(tank.color, 45));
  hullGrad.addColorStop(0.3, lightenColor(tank.color, 15));
  hullGrad.addColorStop(0.6, tank.color);
  hullGrad.addColorStop(1, darkenColor(tank.color, 25));
  ctx.fillStyle = hullGrad;
  ctx.fill();
  
  // Specular
  ctx.fillStyle = `rgba(255,255,255,${0.15 + Math.sin(time * 0.003) * 0.04})`;
  ctx.beginPath();
  ctx.moveTo(-size * 0.25, -size * 0.5);
  ctx.lineTo(size * 0.15, -size * 0.5);
  ctx.lineTo(size * 0.1, -size * 0.25);
  ctx.lineTo(-size * 0.2, -size * 0.25);
  ctx.closePath();
  ctx.fill();
  
  ctx.strokeStyle = darkenColor(tank.color, 50);
  ctx.lineWidth = 1.5;
  ctx.stroke();
  
  // Rivets
  [[-0.3, -0.4], [0.3, -0.4], [-0.3, 0.3], [0.3, 0.3]].forEach(([rx, ry]) => {
    ctx.beginPath();
    ctx.arc(rx * size, ry * size, 1.8, 0, Math.PI * 2);
    ctx.fillStyle = darkenColor(tank.color, 20);
    ctx.fill();
  });
  
  ctx.restore();
  
  // Turret
  ctx.save();
  ctx.rotate(turretAngle);
  
  const barrelLen = size * 1.3;
  const barrelW = size * 0.11;
  
  // Barrel side
  ctx.fillStyle = '#2a2a2a';
  ctx.fillRect(size * 0.3, barrelW, barrelLen - size * 0.3, height * 0.25);
  
  // Barrel top
  const bGrad = ctx.createLinearGradient(0, -barrelW, 0, barrelW);
  bGrad.addColorStop(0, '#555');
  bGrad.addColorStop(0.3, '#bbb');
  bGrad.addColorStop(0.5, '#e0e0e0');
  bGrad.addColorStop(0.7, '#aaa');
  bGrad.addColorStop(1, '#444');
  ctx.fillStyle = bGrad;
  ctx.beginPath();
  ctx.roundRect(size * 0.3, -barrelW, barrelLen - size * 0.3, barrelW * 2, 2);
  ctx.fill();
  
  // Muzzle
  ctx.fillStyle = '#555';
  ctx.beginPath();
  ctx.roundRect(barrelLen - 5, -barrelW * 1.2, 8, barrelW * 2.4, 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(barrelLen + 1, 0, barrelW * 0.35, 0, Math.PI * 2);
  ctx.fillStyle = '#111';
  ctx.fill();
  
  // Turret dome
  ctx.beginPath();
  ctx.arc(0, 0, size * 0.36, 0, Math.PI * 2);
  const tGrad = ctx.createRadialGradient(-size * 0.08, -size * 0.08, 0, 0, 0, size * 0.36);
  tGrad.addColorStop(0, lightenColor(tank.accentColor, 55));
  tGrad.addColorStop(0.4, tank.accentColor);
  tGrad.addColorStop(0.8, tank.color);
  tGrad.addColorStop(1, darkenColor(tank.color, 30));
  ctx.fillStyle = tGrad;
  ctx.fill();
  ctx.strokeStyle = darkenColor(tank.color, 45);
  ctx.lineWidth = 1.5;
  ctx.stroke();
  
  // Specular
  ctx.beginPath();
  ctx.arc(-size * 0.07, -size * 0.08, size * 0.15, 0, Math.PI * 2);
  ctx.fillStyle = `rgba(255,255,255,${0.2 + Math.sin(time * 0.004) * 0.05})`;
  ctx.fill();
  
  ctx.restore();
  
  // Health bar
  if (tank.health < tank.maxHealth) {
    const bw = size * 1.5;
    const by = -size - height - 10;
    ctx.fillStyle = 'rgba(0,0,0,0.8)';
    ctx.beginPath();
    ctx.roundRect(-bw / 2 - 1, by - 1, bw + 2, 5, 2);
    ctx.fill();
    const hp = tank.health / tank.maxHealth;
    ctx.fillStyle = hp > 0.5 ? '#4ade80' : hp > 0.25 ? '#fbbf24' : '#ef4444';
    ctx.beginPath();
    ctx.roundRect(-bw / 2, by, bw * hp, 3, 2);
    ctx.fill();
  }
  
  // Player indicator
  if (tank.isPlayer) {
    ctx.beginPath();
    ctx.arc(0, 0, size * 1.4, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(96, 165, 250, ${0.2 + Math.sin(time * 0.004) * 0.1})`;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([5, 5]);
    ctx.lineDashOffset = time * 0.02;
    ctx.stroke();
    ctx.setLineDash([]);
  }
  
  ctx.restore();
}

function drawTrack(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, l: number, offset: number, color: string, depth: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = '#1a1a1a';
  ctx.fillRect(-w / 2, l / 2, w, depth * 0.5);
  
  const tGrad = ctx.createLinearGradient(-w / 2, 0, w / 2, 0);
  tGrad.addColorStop(0, '#1a1a1a');
  tGrad.addColorStop(0.3, '#3a3a3a');
  tGrad.addColorStop(0.5, '#4a4a4a');
  tGrad.addColorStop(0.7, '#3a3a3a');
  tGrad.addColorStop(1, '#1a1a1a');
  ctx.fillStyle = tGrad;
  ctx.beginPath();
  ctx.roundRect(-w / 2, -l / 2, w, l, 3);
  ctx.fill();
  
  const seg = 6;
  for (let i = -l / 2 + 2; i < l / 2; i += seg) {
    const sy = ((i + offset * 3) % seg + seg) % seg - seg / 2 + i;
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fillRect(-w / 2 + 1, sy, w - 2, 1.5);
  }
  ctx.restore();
}

// ===== BULLETS =====
function drawBullet2D5(ctx: CanvasRenderingContext2D, bullet: Bullet, time: number) {
  const { position, trail, size } = bullet;
  
  if (trail.length > 1) {
    for (let i = 1; i < trail.length; i++) {
      const alpha = (i / trail.length) * 0.4;
      ctx.beginPath();
      ctx.moveTo(trail[i - 1].x, trail[i - 1].y);
      ctx.lineTo(trail[i].x, trail[i].y);
      ctx.strokeStyle = `rgba(255, 180, 50, ${alpha})`;
      ctx.lineWidth = (i / trail.length) * size;
      ctx.lineCap = 'round';
      ctx.stroke();
    }
  }
  
  // Shadow
  ctx.beginPath();
  ctx.ellipse(position.x + 2, position.y + 3, size * 0.7, size * 0.3, 0, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.fill();
  
  const by = position.y - bullet.height;
  
  const glow = ctx.createRadialGradient(position.x, by, 0, position.x, by, size * 3);
  glow.addColorStop(0, 'rgba(255, 200, 50, 0.4)');
  glow.addColorStop(1, 'rgba(255, 100, 0, 0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(position.x, by, size * 3, 0, Math.PI * 2);
  ctx.fill();
  
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

// ===== PARTICLES =====
function drawParticle(ctx: CanvasRenderingContext2D, p: Particle, time: number) {
  ctx.save();
  ctx.globalAlpha = p.opacity;
  ctx.translate(p.position.x, p.position.y - p.height);
  ctx.rotate(p.rotation);
  
  if (p.type === 'smoke') {
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, p.size);
    g.addColorStop(0, `rgba(80, 80, 70, ${p.opacity * 0.3})`);
    g.addColorStop(1, 'rgba(50, 50, 40, 0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, 0, p.size, 0, Math.PI * 2);
    ctx.fill();
  } else if (p.type === 'dust') {
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, p.size);
    g.addColorStop(0, `rgba(140, 110, 70, ${p.opacity * 0.35})`);
    g.addColorStop(1, 'rgba(100, 80, 50, 0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, 0, p.size, 0, Math.PI * 2);
    ctx.fill();
  } else if (p.type === 'spark') {
    ctx.shadowColor = p.color;
    ctx.shadowBlur = 3;
    ctx.fillStyle = p.color;
    ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
    ctx.shadowBlur = 0;
  } else if (p.type === 'explosion') {
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, p.size);
    g.addColorStop(0, p.color);
    g.addColorStop(1, 'transparent');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, 0, p.size, 0, Math.PI * 2);
    ctx.fill();
  } else if (p.type === 'debris') {
    ctx.fillStyle = p.color;
    ctx.fillRect(-p.size / 2, -p.size / 3, p.size, p.size * 0.6);
  } else if (p.type === 'muzzle') {
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, p.size);
    g.addColorStop(0, '#ffffff');
    g.addColorStop(0.4, '#ffee00');
    g.addColorStop(1, 'transparent');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, 0, p.size, 0, Math.PI * 2);
    ctx.fill();
  }
  
  ctx.restore();
}

// ===== FIREFLIES =====
function drawFireflies(ctx: CanvasRenderingContext2D, state: GameState, time: number) {
  for (let i = 0; i < 25; i++) {
    const seed = i * 137.5;
    const fx = state.player.position.x + Math.sin(time * 0.0005 + seed) * 400 + Math.cos(seed) * 300;
    const fy = state.player.position.y + Math.cos(time * 0.0007 + seed * 0.5) * 300 + Math.sin(seed) * 200;
    
    // Only draw if on screen
    const screenX = fx - (state.player.position.x - CANVAS_WIDTH / 2);
    const screenY = fy - (state.player.position.y - CANVAS_HEIGHT / 2);
    if (screenX < -20 || screenX > CANVAS_WIDTH + 20 || screenY < -20 || screenY > CANVAS_HEIGHT + 20) continue;
    
    const brightness = Math.sin(time * 0.003 + i * 1.7) * 0.5 + 0.5;
    if (brightness < 0.3) continue;
    
    const glow = ctx.createRadialGradient(fx, fy, 0, fx, fy, 6);
    glow.addColorStop(0, `rgba(200, 255, 100, ${brightness * 0.6})`);
    glow.addColorStop(0.5, `rgba(150, 255, 50, ${brightness * 0.2})`);
    glow.addColorStop(1, 'rgba(100, 200, 0, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(fx, fy, 6, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = `rgba(255, 255, 200, ${brightness * 0.8})`;
    ctx.beginPath();
    ctx.arc(fx, fy, 1, 0, Math.PI * 2);
    ctx.fill();
  }
}

// ===== EXPLOSIONS =====
function drawExplosion(ctx: CanvasRenderingContext2D, e: Explosion, time: number) {
  const progress = 1 - e.lifetime / e.maxLifetime;
  ctx.save();
  
  ctx.beginPath();
  ctx.arc(e.position.x, e.position.y, e.radius * 1.2, 0, Math.PI * 2);
  ctx.strokeStyle = `rgba(255, 200, 100, ${(1 - progress) * 0.4})`;
  ctx.lineWidth = 3;
  ctx.stroke();
  
  ctx.globalAlpha = (1 - progress) * 0.8;
  const g = ctx.createRadialGradient(e.position.x, e.position.y, 0, e.position.x, e.position.y, e.radius);
  g.addColorStop(0, 'rgba(255, 220, 100, 0.9)');
  g.addColorStop(0.3, 'rgba(255, 150, 50, 0.6)');
  g.addColorStop(0.7, 'rgba(255, 80, 0, 0.2)');
  g.addColorStop(1, 'rgba(100, 0, 0, 0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(e.position.x, e.position.y, e.radius, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.restore();
}

// ===== DYNAMIC LIGHTING =====
function drawDynamicLighting(ctx: CanvasRenderingContext2D, state: GameState, time: number) {
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  
  state.explosions.forEach(e => {
    const intensity = (e.lifetime / e.maxLifetime) * 0.3;
    const g = ctx.createRadialGradient(e.position.x, e.position.y, 0, e.position.x, e.position.y, e.maxRadius * 2.5);
    g.addColorStop(0, `rgba(255, 150, 50, ${intensity})`);
    g.addColorStop(1, 'rgba(255, 50, 0, 0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(e.position.x, e.position.y, e.maxRadius * 2.5, 0, Math.PI * 2);
    ctx.fill();
  });
  
  ctx.restore();
}

// ===== POST PROCESSING =====
function drawVignette(ctx: CanvasRenderingContext2D) {
  const g = ctx.createRadialGradient(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, CANVAS_WIDTH * 0.3, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, CANVAS_WIDTH * 0.7);
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(1, 'rgba(0,0,0,0.5)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
}

function drawMistOverlay(ctx: CanvasRenderingContext2D, time: number) {
  // Subtle jungle mist
  ctx.save();
  ctx.globalAlpha = 0.03;
  const mistGrad = ctx.createLinearGradient(0, CANVAS_HEIGHT, 0, CANVAS_HEIGHT * 0.5);
  mistGrad.addColorStop(0, 'rgba(150, 180, 150, 0.5)');
  mistGrad.addColorStop(1, 'rgba(150, 180, 150, 0)');
  ctx.fillStyle = mistGrad;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  ctx.restore();
  
  // Green tint
  ctx.save();
  ctx.globalAlpha = 0.02;
  ctx.fillStyle = '#1a4a1a';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  ctx.restore();
}

function drawCrosshair(ctx: CanvasRenderingContext2D, state: GameState, time: number) {
  const aimDist = 110;
  const cx = CANVAS_WIDTH / 2 + Math.cos(state.player.turretAngle) * aimDist;
  const cy = CANVAS_HEIGHT / 2 + Math.sin(state.player.turretAngle) * aimDist;
  
  ctx.save();
  ctx.translate(cx, cy);
  const pulse = Math.sin(time * 0.005) * 0.2 + 0.8;
  
  ctx.strokeStyle = `rgba(255, 120, 50, ${0.5 * pulse})`;
  ctx.lineWidth = 1.5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(0, 0, 12, 0, Math.PI * 0.3);
  ctx.arc(0, 0, 12, Math.PI, Math.PI * 1.3);
  ctx.stroke();
  
  ctx.beginPath();
  ctx.arc(0, 0, 1.5, 0, Math.PI * 2);
  ctx.fillStyle = `rgba(255, 200, 100, ${pulse})`;
  ctx.fill();
  
  ctx.beginPath();
  ctx.moveTo(0, -4); ctx.lineTo(0, -10);
  ctx.moveTo(0, 4); ctx.lineTo(0, 10);
  ctx.moveTo(-4, 0); ctx.lineTo(-10, 0);
  ctx.moveTo(4, 0); ctx.lineTo(10, 0);
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
