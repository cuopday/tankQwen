import { lightenColor, darkenColor } from './colors';
import { GameState, Tank, Bullet, Particle, Explosion, Obstacle, Vector2, ObstacleType } from './types';
import { CANVAS_WIDTH, CANVAS_HEIGHT, MAP_WIDTH, MAP_HEIGHT } from './engine';
import { drawDetailedTank } from './EnhancedGraphics';
import { drawRealisticTank, LightingSystem } from './RealisticGraphics';
import { drawSuperRealisticTank } from './SuperRealisticGraphics';
import { 
  drawEnhancedHullShape, 
  drawEnhancedTurretDome, 
  drawEnhancedBarrel, 
  drawEnhancedTrack,
  drawEnhancedExplosion,
  drawEnhancedBullet,
  drawEnhancedSmoke,
  drawEnhancedFire
} from './EnhancedShapes';

let groundDecals: Array<{x: number; y: number; radius: number; opacity: number; type: 'scorch' | 'crater'}> = [];
const MAX_DECALS = 80;

// Global lighting system
const lightingSystem = new LightingSystem();

export function renderGame(ctx: CanvasRenderingContext2D, state: GameState, time: number) {
  const camera = {
    x: state.player.position.x - CANVAS_WIDTH / 2 + state.screenShake.x,
    y: state.player.position.y - CANVAS_HEIGHT / 2 + state.screenShake.y,
  };

  // Update lighting system
  lightingSystem.clearDynamicLights();
  
  // Add dynamic lights from explosions
  state.explosions.forEach(exp => {
    const intensity = exp.lifetime / exp.maxLifetime;
    lightingSystem.addLight(exp.position, '#ff8844', intensity * 0.8, exp.maxRadius * 2);
  });
  
  // Add light from player tank
  lightingSystem.addLight(state.player.position, '#ffffff', 0.3, 200);
  
  // Add lights from enemy tanks
  state.enemies.forEach(enemy => {
    lightingSystem.addLight(enemy.position, '#ffaaaa', 0.2, 150);
  });

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
  
  // Tanks (using super realistic enhanced graphics)
  state.enemies.forEach(tank => {
    drawables.push({ y: tank.position.y, draw: () => drawSuperRealisticTank(ctx, tank, time, lightingSystem) });
  });
  drawables.push({ y: state.player.position.y, draw: () => drawSuperRealisticTank(ctx, state.player, time, lightingSystem) });
  
  // Bullets (using enhanced shapes)
  state.bullets.forEach(b => {
    drawables.push({ y: b.position.y, draw: () => drawEnhancedBullet(ctx, b, time) });
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
  
  // Explosions (using enhanced shapes)
  state.explosions.forEach(e => drawEnhancedExplosion(ctx, e, time));
  
  // Dynamic lighting
  drawDynamicLighting(ctx, state, time);
  
  ctx.restore();
  
  // Weather effects
  drawWeatherEffects(ctx, state, time);
  
  // Post-processing
  drawVignette(ctx);
  drawMistOverlay(ctx, time);
  drawBloomEffect(ctx, state, time);
  drawCrosshair(ctx, state, time);
  ctx.restore();
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
  // Base muddy ground with realistic gradient
  const groundGrad = ctx.createRadialGradient(
    camera.x + CANVAS_WIDTH / 2, camera.y + CANVAS_HEIGHT / 2, 0,
    camera.x + CANVAS_WIDTH / 2, camera.y + CANVAS_HEIGHT / 2, CANVAS_WIDTH
  );
  groundGrad.addColorStop(0, '#2d3a22');
  groundGrad.addColorStop(0.5, '#2a3520');
  groundGrad.addColorStop(1, '#253018');
  ctx.fillStyle = groundGrad;
  ctx.fillRect(0, 0, MAP_WIDTH, MAP_HEIGHT);
  
  // Enhanced terrain with height variation and details
  const tileSize = 100;
  const startX = Math.floor(camera.x / tileSize) * tileSize;
  const startY = Math.floor(camera.y / tileSize) * tileSize;
  
  for (let x = startX - tileSize; x < camera.x + CANVAS_WIDTH + tileSize; x += tileSize) {
    for (let y = startY - tileSize; y < camera.y + CANVAS_HEIGHT + tileSize; y += tileSize) {
      const hash = Math.sin(x * 0.01 + y * 0.013) * 10000;
      const n = hash - Math.floor(hash);
      
      // Height variation (subtle elevation changes)
      const heightVariation = Math.sin(x * 0.02 + y * 0.015) * 0.1;
      
      if (n > 0.6) {
        // Dirt patch with realistic shading
        const dirtGrad = ctx.createRadialGradient(
          x + tileSize/2, y + tileSize/2, 0,
          x + tileSize/2, y + tileSize/2, tileSize * 0.4
        );
        dirtGrad.addColorStop(0, `rgba(100, 75, 45, ${0.15 + n * 0.1 + heightVariation})`);
        dirtGrad.addColorStop(0.7, `rgba(85, 65, 38, ${0.1 + n * 0.08 + heightVariation})`);
        dirtGrad.addColorStop(1, 'rgba(70, 55, 30, 0)');
        ctx.fillStyle = dirtGrad;
        ctx.beginPath();
        ctx.ellipse(x + tileSize/2, y + tileSize/2, tileSize * 0.4, tileSize * 0.3, n * Math.PI, 0, Math.PI * 2);
        ctx.fill();
        
        // Dirt texture (small particles)
        for (let d = 0; d < 8; d++) {
          const dx = x + tileSize/2 + (Math.sin(d * 2.3 + n * 10) * tileSize * 0.3);
          const dy = y + tileSize/2 + (Math.cos(d * 1.7 + n * 10) * tileSize * 0.2);
          ctx.fillStyle = `rgba(90, 70, 40, ${0.1 + heightVariation})`;
          ctx.beginPath();
          ctx.arc(dx, dy, 1 + Math.random(), 0, Math.PI * 2);
          ctx.fill();
        }
      } else if (n > 0.3) {
        // Enhanced grass tufts with variation
        for (let g = 0; g < 5; g++) {
          const gx = x + (n * 100 + g * 20) % tileSize;
          const gy = y + (n * 70 + g * 25) % tileSize;
          const grassHeight = 3 + Math.sin(g * 1.5 + n * 5) * 2;
          
          // Grass blade
          const grassGrad = ctx.createLinearGradient(gx, gy, gx, gy - grassHeight);
          grassGrad.addColorStop(0, `rgba(60, 90, 40, ${0.3 + heightVariation})`);
          grassGrad.addColorStop(1, `rgba(80, 120, 50, ${0.1 + heightVariation})`);
          ctx.fillStyle = grassGrad;
          ctx.beginPath();
          ctx.ellipse(gx, gy, 2, grassHeight, g * 0.3, 0, Math.PI * 2);
          ctx.fill();
          
          // Grass highlight
          ctx.fillStyle = `rgba(100, 150, 60, ${0.1 + heightVariation})`;
          ctx.beginPath();
          ctx.ellipse(gx - 0.5, gy - grassHeight * 0.3, 1, grassHeight * 0.5, g * 0.3, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      
      // Small pebbles with realistic shading
      if (n > 0.8) {
        for (let p = 0; p < 2; p++) {
          const px = x + (n * 50 + p * 40) % tileSize;
          const py = y + (n * 80 + p * 30) % tileSize;
          const pebbleSize = 1.5 + (n * 2);
          
          // Pebble shadow
          ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
          ctx.beginPath();
          ctx.ellipse(px + 0.5, py + 0.5, pebbleSize, pebbleSize * 0.7, 0, 0, Math.PI * 2);
          ctx.fill();
          
          // Pebble body
          const pebbleGrad = ctx.createRadialGradient(px - 0.5, py - 0.5, 0, px, py, pebbleSize);
          pebbleGrad.addColorStop(0, `rgba(140, 130, 110, ${0.3 + heightVariation})`);
          pebbleGrad.addColorStop(0.7, `rgba(120, 110, 90, ${0.2 + heightVariation})`);
          pebbleGrad.addColorStop(1, `rgba(100, 90, 70, ${0.1 + heightVariation})`);
          ctx.fillStyle = pebbleGrad;
          ctx.beginPath();
          ctx.ellipse(px, py, pebbleSize, pebbleSize * 0.8, n * Math.PI, 0, Math.PI * 2);
          ctx.fill();
          
          // Pebble highlight
          ctx.fillStyle = `rgba(180, 170, 150, ${0.15 + heightVariation})`;
          ctx.beginPath();
          ctx.arc(px - pebbleSize * 0.3, py - pebbleSize * 0.3, pebbleSize * 0.3, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      
      // Puddles (water accumulation)
      if (n > 0.85 && n < 0.9) {
        const puddleX = x + tileSize * 0.5;
        const puddleY = y + tileSize * 0.5;
        const puddleSize = tileSize * 0.2;
        
        // Puddle shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
        ctx.beginPath();
        ctx.ellipse(puddleX + 1, puddleY + 1, puddleSize, puddleSize * 0.6, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Puddle water
        const puddleGrad = ctx.createRadialGradient(puddleX, puddleY, 0, puddleX, puddleY, puddleSize);
        puddleGrad.addColorStop(0, 'rgba(80, 100, 120, 0.4)');
        puddleGrad.addColorStop(0.7, 'rgba(60, 80, 100, 0.3)');
        puddleGrad.addColorStop(1, 'rgba(40, 60, 80, 0.1)');
        ctx.fillStyle = puddleGrad;
        ctx.beginPath();
        ctx.ellipse(puddleX, puddleY, puddleSize, puddleSize * 0.6, n * Math.PI, 0, Math.PI * 2);
        ctx.fill();
        
        // Water reflection/shine
        ctx.fillStyle = 'rgba(150, 180, 220, 0.2)';
        ctx.beginPath();
        ctx.ellipse(puddleX - puddleSize * 0.2, puddleY - puddleSize * 0.1, puddleSize * 0.3, puddleSize * 0.15, 0, 0, Math.PI * 2);
        ctx.fill();
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
    // Chaos objects
    case 'explosive_barrel': drawExplosiveBarrel(ctx, obs, time); break;
    case 'tnt_crate': drawTNTCrate(ctx, obs, time); break;
    case 'health_pack': drawHealthPack(ctx, obs, time); break;
    case 'speed_boost': drawSpeedBoost(ctx, obs, time); break;
    case 'rapid_fire': drawRapidFire(ctx, obs, time); break;
    case 'triple_shot': drawTripleShot(ctx, obs, time); break;
    case 'shield': drawShield(ctx, obs, time); break;
    case 'armor_boost': drawArmorBoost(ctx, obs, time); break;
    case 'lava_pool': drawLavaPool(ctx, obs, time); break;
    case 'acid_lake': drawAcidLake(ctx, obs, time); break;
    case 'quicksand': drawQuicksand(ctx, obs, time); break;
    case 'ice_patch': drawIcePatch(ctx, obs, time); break;
    case 'oil_spill': drawOilSpill(ctx, obs, time); break;
    case 'tornado': drawTornado(ctx, obs, time); break;
    case 'auto_turret': drawAutoTurret(ctx, obs, time); break;
    case 'teleport_portal': drawTeleportPortal(ctx, obs, time); break;
    case 'rolling_boulder': drawRollingBoulder(ctx, obs, time); break;
    case 'attack_drone': drawAttackDrone(ctx, obs, time); break;
    case 'black_hole': drawBlackHole(ctx, obs, time); break;
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

// ===== CHAOS OBJECTS =====

function drawExplosiveBarrel(ctx: CanvasRenderingContext2D, obs: Obstacle, time: number) {
  const { position, width, depth } = obs;
  const r = width * 0.45;
  const pulse = Math.sin(time * 0.005) * 0.1 + 0.9;
  
  ctx.save();
  ctx.translate(position.x, position.y);
  
  // Warning glow
  const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, r * 2);
  glow.addColorStop(0, `rgba(255, 50, 0, ${0.1 * pulse})`);
  glow.addColorStop(1, 'rgba(255, 50, 0, 0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(0, 0, r * 2, 0, Math.PI * 2);
  ctx.fill();
  
  // Barrel body
  const barrelGrad = ctx.createLinearGradient(-r, 0, r, 0);
  barrelGrad.addColorStop(0, '#991b1b');
  barrelGrad.addColorStop(0.3, '#dc2626');
  barrelGrad.addColorStop(0.5, '#ef4444');
  barrelGrad.addColorStop(0.7, '#dc2626');
  barrelGrad.addColorStop(1, '#991b1b');
  ctx.fillStyle = barrelGrad;
  ctx.beginPath();
  ctx.ellipse(0, 0, r, r * 0.7, 0, 0, Math.PI * 2);
  ctx.fill();
  
  // Hazard stripes
  ctx.fillStyle = '#fbbf24';
  ctx.fillRect(-r * 0.8, -3, r * 1.6, 2);
  ctx.fillRect(-r * 0.8, 3, r * 1.6, 2);
  
  // Metal bands
  ctx.strokeStyle = '#374151';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(0, -2, r * 0.95, r * 0.65, 0, 0, Math.PI * 2);
  ctx.stroke();
  
  // Top
  ctx.fillStyle = '#7f1d1d';
  ctx.beginPath();
  ctx.ellipse(0, -depth * 0.3, r * 0.85, r * 0.5, 0, 0, Math.PI * 2);
  ctx.fill();
  
  // Explosion symbol
  ctx.fillStyle = '#fbbf24';
  ctx.font = 'bold 12px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('💥', 0, -depth * 0.3);
  
  ctx.restore();
}

function drawTNTCrate(ctx: CanvasRenderingContext2D, obs: Obstacle, time: number) {
  const { position, width, depth } = obs;
  const pulse = Math.sin(time * 0.004) * 0.1 + 0.9;
  
  ctx.save();
  ctx.translate(position.x, position.y);
  
  // Warning glow
  const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, width);
  glow.addColorStop(0, `rgba(255, 0, 0, ${0.15 * pulse})`);
  glow.addColorStop(1, 'rgba(255, 0, 0, 0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(0, 0, width, 0, Math.PI * 2);
  ctx.fill();
  
  // Crate body
  ctx.fillStyle = '#7f1d1d';
  ctx.fillRect(-width / 2, -width / 2, width, width);
  
  // South face
  ctx.fillStyle = '#450a0a';
  ctx.fillRect(-width / 2, width / 2, width, depth * 0.4);
  
  // Wood texture
  ctx.strokeStyle = 'rgba(0,0,0,0.2)';
  ctx.lineWidth = 0.5;
  for (let i = -width / 2 + 5; i < width / 2; i += 8) {
    ctx.beginPath();
    ctx.moveTo(i, -width / 2);
    ctx.lineTo(i, width / 2);
    ctx.stroke();
  }
  
  // TNT label
  ctx.fillStyle = '#fbbf24';
  ctx.font = 'bold 14px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('TNT', 0, 0);
  
  // Border
  ctx.strokeStyle = '#450a0a';
  ctx.lineWidth = 2;
  ctx.strokeRect(-width / 2, -width / 2, width, width);
  
  ctx.restore();
}

function drawHealthPack(ctx: CanvasRenderingContext2D, obs: Obstacle, time: number) {
  if (obs.active === false) return;
  const { position, width } = obs;
  const bob = Math.sin(time * 0.003) * 3;
  
  ctx.save();
  ctx.translate(position.x, position.y + bob);
  
  // Glow
  const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, width);
  glow.addColorStop(0, 'rgba(34, 197, 94, 0.3)');
  glow.addColorStop(1, 'rgba(34, 197, 94, 0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(0, 0, width, 0, Math.PI * 2);
  ctx.fill();
  
  // Box
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(-width / 2, -width / 2, width, width);
  ctx.strokeStyle = '#16a34a';
  ctx.lineWidth = 2;
  ctx.strokeRect(-width / 2, -width / 2, width, width);
  
  // Cross
  ctx.fillStyle = '#16a34a';
  ctx.fillRect(-width * 0.1, -width * 0.35, width * 0.2, width * 0.7);
  ctx.fillRect(-width * 0.35, -width * 0.1, width * 0.7, width * 0.2);
  
  ctx.restore();
}

function drawSpeedBoost(ctx: CanvasRenderingContext2D, obs: Obstacle, time: number) {
  if (obs.active === false) return;
  const { position, width } = obs;
  const bob = Math.sin(time * 0.004) * 3;
  
  ctx.save();
  ctx.translate(position.x, position.y + bob);
  
  const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, width);
  glow.addColorStop(0, 'rgba(59, 130, 246, 0.3)');
  glow.addColorStop(1, 'rgba(59, 130, 246, 0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(0, 0, width, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.fillStyle = '#3b82f6';
  ctx.beginPath();
  ctx.arc(0, 0, width * 0.4, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 16px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('⚡', 0, 0);
  
  ctx.restore();
}

function drawRapidFire(ctx: CanvasRenderingContext2D, obs: Obstacle, time: number) {
  if (obs.active === false) return;
  const { position, width } = obs;
  const bob = Math.sin(time * 0.005) * 3;
  
  ctx.save();
  ctx.translate(position.x, position.y + bob);
  
  const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, width);
  glow.addColorStop(0, 'rgba(249, 115, 22, 0.3)');
  glow.addColorStop(1, 'rgba(249, 115, 22, 0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(0, 0, width, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.fillStyle = '#f97316';
  ctx.beginPath();
  ctx.arc(0, 0, width * 0.4, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 14px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('🔥', 0, 0);
  
  ctx.restore();
}

function drawTripleShot(ctx: CanvasRenderingContext2D, obs: Obstacle, time: number) {
  if (obs.active === false) return;
  const { position, width } = obs;
  const bob = Math.sin(time * 0.004) * 3;
  
  ctx.save();
  ctx.translate(position.x, position.y + bob);
  
  const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, width);
  glow.addColorStop(0, 'rgba(168, 85, 247, 0.3)');
  glow.addColorStop(1, 'rgba(168, 85, 247, 0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(0, 0, width, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.fillStyle = '#a855f7';
  ctx.beginPath();
  ctx.arc(0, 0, width * 0.4, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 12px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('3x', 0, 0);
  
  ctx.restore();
}

function drawShield(ctx: CanvasRenderingContext2D, obs: Obstacle, time: number) {
  if (obs.active === false) return;
  const { position, width } = obs;
  const bob = Math.sin(time * 0.003) * 3;
  
  ctx.save();
  ctx.translate(position.x, position.y + bob);
  
  const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, width);
  glow.addColorStop(0, 'rgba(6, 182, 212, 0.3)');
  glow.addColorStop(1, 'rgba(6, 182, 212, 0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(0, 0, width, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.fillStyle = '#06b6d4';
  ctx.beginPath();
  ctx.arc(0, 0, width * 0.4, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 14px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('🛡', 0, 0);
  
  ctx.restore();
}

function drawArmorBoost(ctx: CanvasRenderingContext2D, obs: Obstacle, time: number) {
  if (obs.active === false) return;
  const { position, width } = obs;
  const bob = Math.sin(time * 0.003) * 3;
  
  ctx.save();
  ctx.translate(position.x, position.y + bob);
  
  const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, width);
  glow.addColorStop(0, 'rgba(107, 114, 128, 0.3)');
  glow.addColorStop(1, 'rgba(107, 114, 128, 0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(0, 0, width, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.fillStyle = '#6b7280';
  ctx.beginPath();
  ctx.arc(0, 0, width * 0.4, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 14px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('🔰', 0, 0);
  
  ctx.restore();
}

function drawLavaPool(ctx: CanvasRenderingContext2D, obs: Obstacle, time: number) {
  const { position, width, height } = obs;
  
  ctx.save();
  ctx.translate(position.x, position.y);
  
  // Lava glow
  const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, width * 0.7);
  glow.addColorStop(0, 'rgba(255, 100, 0, 0.4)');
  glow.addColorStop(0.5, 'rgba(255, 50, 0, 0.2)');
  glow.addColorStop(1, 'rgba(255, 0, 0, 0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.ellipse(0, 0, width * 0.7, height * 0.7, 0, 0, Math.PI * 2);
  ctx.fill();
  
  // Lava surface
  const lavaGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, width * 0.5);
  lavaGrad.addColorStop(0, '#ff6b00');
  lavaGrad.addColorStop(0.5, '#ff4500');
  lavaGrad.addColorStop(1, '#cc0000');
  ctx.fillStyle = lavaGrad;
  ctx.beginPath();
  ctx.ellipse(0, 0, width * 0.5, height * 0.5, 0, 0, Math.PI * 2);
  ctx.fill();
  
  // Bubbles
  for (let i = 0; i < 5; i++) {
    const bx = Math.sin(time * 0.002 + i * 1.5) * width * 0.3;
    const by = Math.cos(time * 0.003 + i * 2) * height * 0.3;
    const br = 3 + Math.sin(time * 0.005 + i) * 2;
    ctx.fillStyle = `rgba(255, 200, 0, ${0.5 + Math.sin(time * 0.004 + i) * 0.3})`;
    ctx.beginPath();
    ctx.arc(bx, by, br, 0, Math.PI * 2);
    ctx.fill();
  }
  
  ctx.restore();
}

function drawAcidLake(ctx: CanvasRenderingContext2D, obs: Obstacle, time: number) {
  const { position, width, height } = obs;
  
  ctx.save();
  ctx.translate(position.x, position.y);
  
  const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, width * 0.7);
  glow.addColorStop(0, 'rgba(0, 255, 0, 0.3)');
  glow.addColorStop(1, 'rgba(0, 255, 0, 0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.ellipse(0, 0, width * 0.7, height * 0.7, 0, 0, Math.PI * 2);
  ctx.fill();
  
  const acidGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, width * 0.5);
  acidGrad.addColorStop(0, '#00ff00');
  acidGrad.addColorStop(0.5, '#00cc00');
  acidGrad.addColorStop(1, '#009900');
  ctx.fillStyle = acidGrad;
  ctx.beginPath();
  ctx.ellipse(0, 0, width * 0.5, height * 0.5, 0, 0, Math.PI * 2);
  ctx.fill();
  
  // Bubbles
  for (let i = 0; i < 4; i++) {
    const bx = Math.sin(time * 0.003 + i * 2) * width * 0.25;
    const by = Math.cos(time * 0.002 + i * 1.5) * height * 0.25;
    ctx.fillStyle = `rgba(150, 255, 150, ${0.4 + Math.sin(time * 0.005 + i) * 0.2})`;
    ctx.beginPath();
    ctx.arc(bx, by, 2 + Math.sin(time * 0.004 + i) * 1, 0, Math.PI * 2);
    ctx.fill();
  }
  
  ctx.restore();
}

function drawQuicksand(ctx: CanvasRenderingContext2D, obs: Obstacle, time: number) {
  const { position, width, height } = obs;
  
  ctx.save();
  ctx.translate(position.x, position.y);
  
  const sandGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, width * 0.5);
  sandGrad.addColorStop(0, '#8b7355');
  sandGrad.addColorStop(0.5, '#a0845c');
  sandGrad.addColorStop(1, '#6b5b45');
  ctx.fillStyle = sandGrad;
  ctx.beginPath();
  ctx.ellipse(0, 0, width * 0.5, height * 0.5, 0, 0, Math.PI * 2);
  ctx.fill();
  
  // Swirl pattern
  ctx.strokeStyle = 'rgba(100, 80, 50, 0.3)';
  ctx.lineWidth = 1;
  for (let i = 0; i < 3; i++) {
    const r = width * 0.15 * (i + 1);
    ctx.beginPath();
    ctx.arc(0, 0, r, time * 0.001 + i, time * 0.001 + i + Math.PI);
    ctx.stroke();
  }
  
  ctx.restore();
}

function drawIcePatch(ctx: CanvasRenderingContext2D, obs: Obstacle, time: number) {
  const { position, width, height } = obs;
  
  ctx.save();
  ctx.translate(position.x, position.y);
  
  const iceGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, width * 0.5);
  iceGrad.addColorStop(0, 'rgba(200, 230, 255, 0.6)');
  iceGrad.addColorStop(0.5, 'rgba(150, 200, 255, 0.4)');
  iceGrad.addColorStop(1, 'rgba(100, 150, 255, 0.2)');
  ctx.fillStyle = iceGrad;
  ctx.beginPath();
  ctx.ellipse(0, 0, width * 0.5, height * 0.5, 0, 0, Math.PI * 2);
  ctx.fill();
  
  // Shine
  ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
  ctx.beginPath();
  ctx.ellipse(-width * 0.15, -height * 0.15, width * 0.15, height * 0.1, 0, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.restore();
}

function drawOilSpill(ctx: CanvasRenderingContext2D, obs: Obstacle, time: number) {
  const { position, width, height } = obs;
  
  ctx.save();
  ctx.translate(position.x, position.y);
  
  const oilGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, width * 0.5);
  oilGrad.addColorStop(0, 'rgba(20, 20, 30, 0.7)');
  oilGrad.addColorStop(0.5, 'rgba(30, 30, 40, 0.5)');
  oilGrad.addColorStop(1, 'rgba(40, 40, 50, 0.3)');
  ctx.fillStyle = oilGrad;
  ctx.beginPath();
  ctx.ellipse(0, 0, width * 0.5, height * 0.5, 0, 0, Math.PI * 2);
  ctx.fill();
  
  // Rainbow sheen
  const sheenGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, width * 0.4);
  sheenGrad.addColorStop(0, 'rgba(255, 0, 255, 0.1)');
  sheenGrad.addColorStop(0.33, 'rgba(0, 255, 255, 0.1)');
  sheenGrad.addColorStop(0.66, 'rgba(255, 255, 0, 0.1)');
  sheenGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = sheenGrad;
  ctx.beginPath();
  ctx.ellipse(0, 0, width * 0.4, height * 0.4, time * 0.001, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.restore();
}

function drawTornado(ctx: CanvasRenderingContext2D, obs: Obstacle, time: number) {
  const { position, width, depth } = obs;
  
  ctx.save();
  ctx.translate(position.x, position.y);
  
  // Tornado funnel
  for (let i = 0; i < 10; i++) {
    const t = i / 10;
    const r = width * 0.3 * (1 - t * 0.5);
    const y = -depth * t;
    const rot = time * 0.01 + i * 0.5;
    
    ctx.fillStyle = `rgba(100, 100, 120, ${0.3 - t * 0.2})`;
    ctx.beginPath();
    ctx.ellipse(Math.cos(rot) * r * 0.2, y, r, r * 0.3, rot, 0, Math.PI * 2);
    ctx.fill();
  }
  
  // Debris
  for (let i = 0; i < 8; i++) {
    const angle = time * 0.005 + i * 0.8;
    const r = width * 0.4;
    const dx = Math.cos(angle) * r;
    const dy = Math.sin(angle) * r * 0.3 - depth * 0.3;
    ctx.fillStyle = 'rgba(80, 60, 40, 0.6)';
    ctx.fillRect(dx - 2, dy - 2, 4, 4);
  }
  
  ctx.restore();
}

function drawAutoTurret(ctx: CanvasRenderingContext2D, obs: Obstacle, time: number) {
  const { position, width, depth } = obs;
  
  ctx.save();
  ctx.translate(position.x, position.y);
  
  // Base
  ctx.fillStyle = '#374151';
  ctx.beginPath();
  ctx.ellipse(0, 3, width * 0.5, width * 0.3, 0, 0, Math.PI * 2);
  ctx.fill();
  
  // Turret body
  ctx.fillStyle = '#4b5563';
  ctx.fillRect(-width * 0.3, -depth * 0.5, width * 0.6, depth * 0.5);
  
  // Gun barrel
  ctx.fillStyle = '#1f2937';
  ctx.save();
  ctx.rotate(obs.angle);
  ctx.fillRect(0, -3, width * 0.6, 6);
  ctx.restore();
  
  // Red light
  const blink = Math.sin(time * 0.005) > 0;
  if (blink) {
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(0, -depth * 0.3, 3, 0, Math.PI * 2);
    ctx.fill();
  }
  
  ctx.restore();
}

function drawTeleportPortal(ctx: CanvasRenderingContext2D, obs: Obstacle, time: number) {
  const { position, width, variant } = obs;
  const color = variant === 0 ? '#a855f7' : '#06b6d4';
  
  ctx.save();
  ctx.translate(position.x, position.y);
  
  // Portal ring
  for (let i = 0; i < 3; i++) {
    const r = width * 0.4 - i * 5;
    const rot = time * 0.003 * (variant === 0 ? 1 : -1) + i * 0.5;
    
    ctx.strokeStyle = color;
    ctx.lineWidth = 3 - i;
    ctx.globalAlpha = 0.7 - i * 0.2;
    ctx.beginPath();
    ctx.ellipse(0, 0, r, r * 0.6, rot, 0, Math.PI * 2);
    ctx.stroke();
  }
  
  // Portal center
  const centerGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, width * 0.3);
  centerGrad.addColorStop(0, color);
  centerGrad.addColorStop(0.5, `${color}88`);
  centerGrad.addColorStop(1, 'transparent');
  ctx.globalAlpha = 0.5 + Math.sin(time * 0.004) * 0.2;
  ctx.fillStyle = centerGrad;
  ctx.beginPath();
  ctx.ellipse(0, 0, width * 0.3, width * 0.2, 0, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.globalAlpha = 1;
  ctx.restore();
}

function drawRollingBoulder(ctx: CanvasRenderingContext2D, obs: Obstacle, time: number) {
  const { position, width, velocity } = obs;
  
  ctx.save();
  ctx.translate(position.x, position.y);
  ctx.rotate(time * 0.005 * (velocity?.x || 1));
  
  // Boulder
  const boulderGrad = ctx.createRadialGradient(-width * 0.1, -width * 0.1, 0, 0, 0, width * 0.5);
  boulderGrad.addColorStop(0, '#9ca3af');
  boulderGrad.addColorStop(0.5, '#6b7280');
  boulderGrad.addColorStop(1, '#4b5563');
  ctx.fillStyle = boulderGrad;
  ctx.beginPath();
  ctx.arc(0, 0, width * 0.5, 0, Math.PI * 2);
  ctx.fill();
  
  // Cracks
  ctx.strokeStyle = 'rgba(0,0,0,0.3)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(-width * 0.2, -width * 0.1);
  ctx.lineTo(width * 0.1, width * 0.2);
  ctx.stroke();
  
  ctx.restore();
}

function drawAttackDrone(ctx: CanvasRenderingContext2D, obs: Obstacle, time: number) {
  const { position, width } = obs;
  const hover = Math.sin(time * 0.005) * 3;
  
  ctx.save();
  ctx.translate(position.x, position.y + hover);
  
  // Drone body
  ctx.fillStyle = '#ef4444';
  ctx.beginPath();
  ctx.ellipse(0, 0, width * 0.4, width * 0.3, 0, 0, Math.PI * 2);
  ctx.fill();
  
  // Propellers
  const propAngle = time * 0.02;
  ctx.strokeStyle = '#7f1d1d';
  ctx.lineWidth = 2;
  for (let i = 0; i < 4; i++) {
    const angle = propAngle + i * Math.PI / 2;
    const px = Math.cos(angle) * width * 0.3;
    const py = Math.sin(angle) * width * 0.2;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(px, py);
    ctx.stroke();
  }
  
  // Red eye
  ctx.fillStyle = '#fbbf24';
  ctx.beginPath();
  ctx.arc(0, 0, 3, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.restore();
}

function drawBlackHole(ctx: CanvasRenderingContext2D, obs: Obstacle, time: number) {
  const { position, width } = obs;
  
  ctx.save();
  ctx.translate(position.x, position.y);
  
  // Accretion disk
  for (let i = 0; i < 5; i++) {
    const r = width * 0.3 + i * 10;
    const rot = time * 0.002 + i * 0.3;
    ctx.strokeStyle = `rgba(147, 51, 234, ${0.5 - i * 0.1})`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(0, 0, r, r * 0.4, rot, 0, Math.PI * 2);
    ctx.stroke();
  }
  
  // Event horizon
  const holeGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, width * 0.25);
  holeGrad.addColorStop(0, '#000000');
  holeGrad.addColorStop(0.7, '#1a0033');
  holeGrad.addColorStop(1, 'rgba(75, 0, 130, 0)');
  ctx.fillStyle = holeGrad;
  ctx.beginPath();
  ctx.arc(0, 0, width * 0.25, 0, Math.PI * 2);
  ctx.fill();
  
  // Gravitational lensing effect
  ctx.strokeStyle = 'rgba(200, 150, 255, 0.3)';
  ctx.lineWidth = 1;
  for (let i = 0; i < 8; i++) {
    const angle = time * 0.001 + i * Math.PI / 4;
    const r1 = width * 0.25;
    const r2 = width * 0.5;
    ctx.beginPath();
    ctx.moveTo(Math.cos(angle) * r1, Math.sin(angle) * r1 * 0.4);
    ctx.quadraticCurveTo(
      Math.cos(angle + 0.5) * (r1 + r2) / 2,
      Math.sin(angle + 0.5) * (r1 + r2) / 2 * 0.4,
      Math.cos(angle + 1) * r2,
      Math.sin(angle + 1) * r2 * 0.4
    );
    ctx.stroke();
  }
  
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
    // Use enhanced smoke shape with multiple overlapping circles
    drawEnhancedSmoke(ctx, 0, 0, p.size, p.opacity, time);
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
    ctx.shadowBlur = 4;
    ctx.fillStyle = p.color;
    ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
    ctx.shadowBlur = 0;
    
    // Spark core highlight
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.fillRect(-p.size / 4, -p.size / 8, p.size / 2, p.size / 4);
  } else if (p.type === 'explosion') {
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, p.size);
    g.addColorStop(0, p.color);
    g.addColorStop(0.5, p.color + '88');
    g.addColorStop(1, 'transparent');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, 0, p.size, 0, Math.PI * 2);
    ctx.fill();
  } else if (p.type === 'debris') {
    // Enhanced debris with better 3D shape
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.moveTo(-p.size / 2, -p.size / 3);
    ctx.lineTo(p.size / 2, -p.size / 4);
    ctx.lineTo(p.size / 3, p.size / 3);
    ctx.lineTo(-p.size / 3, p.size / 2);
    ctx.closePath();
    ctx.fill();
    
    // Debris highlight
    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.beginPath();
    ctx.moveTo(-p.size / 2, -p.size / 3);
    ctx.lineTo(p.size / 4, -p.size / 4);
    ctx.lineTo(0, 0);
    ctx.lineTo(-p.size / 4, 0);
    ctx.closePath();
    ctx.fill();
  } else if (p.type === 'muzzle') {
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, p.size);
    g.addColorStop(0, '#ffffff');
    g.addColorStop(0.3, '#ffee00');
    g.addColorStop(0.6, '#ffaa00');
    g.addColorStop(1, 'transparent');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, 0, p.size, 0, Math.PI * 2);
    ctx.fill();
  } else if (p.type === 'fire') {
    // Use enhanced fire shape with flickering
    drawEnhancedFire(ctx, 0, 0, p.size, p.opacity, time);
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

// ===== WEATHER EFFECTS =====
function drawWeatherEffects(ctx: CanvasRenderingContext2D, state: GameState, time: number) {
  // Rain effect
  ctx.save();
  ctx.globalAlpha = 0.3;
  
  const rainDrops = 100;
  for (let i = 0; i < rainDrops; i++) {
    const seed = i * 9301 + 49297;
    const randomX = (seed % 233280) / 233280;
    const randomY = ((seed * 13) % 233280) / 233280;
    
    const x = (randomX * CANVAS_WIDTH + time * 0.5) % CANVAS_WIDTH;
    const y = (randomY * CANVAS_HEIGHT + time * 2) % CANVAS_HEIGHT;
    
    // Rain drop
    ctx.strokeStyle = 'rgba(150, 180, 220, 0.6)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x - 2, y + 15);
    ctx.stroke();
    
    // Rain splash on ground
    if (y > CANVAS_HEIGHT * 0.8) {
      ctx.fillStyle = 'rgba(150, 180, 220, 0.3)';
      ctx.beginPath();
      ctx.arc(x - 2, y + 15, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  
  ctx.restore();
  
  // Fog particles (atmospheric depth)
  ctx.save();
  ctx.globalAlpha = 0.05;
  
  const fogParticles = 20;
  for (let i = 0; i < fogParticles; i++) {
    const seed = i * 1337 + 7331;
    const randomX = (seed % 233280) / 233280;
    const randomY = ((seed * 7) % 233280) / 233280;
    const randomSize = ((seed * 11) % 233280) / 233280;
    
    const x = (randomX * CANVAS_WIDTH + Math.sin(time * 0.0003 + i) * 50) % CANVAS_WIDTH;
    const y = randomY * CANVAS_HEIGHT;
    const size = 50 + randomSize * 100;
    
    const fogGrad = ctx.createRadialGradient(x, y, 0, x, y, size);
    fogGrad.addColorStop(0, 'rgba(200, 210, 220, 0.3)');
    fogGrad.addColorStop(1, 'rgba(200, 210, 220, 0)');
    ctx.fillStyle = fogGrad;
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
  }
  
  ctx.restore();
}

// ===== POST PROCESSING =====
function drawVignette(ctx: CanvasRenderingContext2D) {
  // Multi-layer vignette for cinematic depth
  for (let i = 3; i >= 0; i--) {
    const radius = CANVAS_WIDTH * (0.25 + i * 0.05);
    const outerRadius = CANVAS_WIDTH * (0.65 + i * 0.05);
    const g = ctx.createRadialGradient(
      CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, radius,
      CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, outerRadius
    );
    g.addColorStop(0, 'rgba(0,0,0,0)');
    g.addColorStop(1, `rgba(0,0,0,${0.12 + i * 0.08})`);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  }
}

function drawMistOverlay(ctx: CanvasRenderingContext2D, time: number) {
  // Animated mist layers for atmosphere
  ctx.save();
  
  // Bottom mist with gradient
  const mistGrad1 = ctx.createLinearGradient(0, CANVAS_HEIGHT, 0, CANVAS_HEIGHT * 0.65);
  mistGrad1.addColorStop(0, 'rgba(120, 150, 180, 0.05)');
  mistGrad1.addColorStop(0.5, 'rgba(100, 130, 160, 0.025)');
  mistGrad1.addColorStop(1, 'rgba(80, 110, 140, 0)');
  ctx.fillStyle = mistGrad1;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  // Moving mist patches
  ctx.globalAlpha = 0.025;
  for (let i = 0; i < 4; i++) {
    const mistX = (Math.sin(time * 0.0003 + i * 2.1) * 200) + CANVAS_WIDTH / 2;
    const mistY = CANVAS_HEIGHT * 0.8 + Math.cos(time * 0.0002 + i * 1.3) * 50;
    const mistGrad = ctx.createRadialGradient(mistX, mistY, 0, mistX, mistY, 150);
    mistGrad.addColorStop(0, 'rgba(150, 180, 200, 0.3)');
    mistGrad.addColorStop(1, 'rgba(150, 180, 200, 0)');
    ctx.fillStyle = mistGrad;
    ctx.beginPath();
    ctx.ellipse(mistX, mistY, 200, 80, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  
  ctx.restore();
  
  // Jungle green tint with radial gradient
  ctx.save();
  ctx.globalAlpha = 0.02;
  const tintGrad = ctx.createRadialGradient(
    CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, 0,
    CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, CANVAS_WIDTH * 0.7
  );
  tintGrad.addColorStop(0, 'rgba(30, 80, 30, 0.3)');
  tintGrad.addColorStop(1, 'rgba(20, 60, 20, 0)');
  ctx.fillStyle = tintGrad;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  ctx.restore();
}

function drawBloomEffect(ctx: CanvasRenderingContext2D, state: GameState, time: number) {
  // Subtle bloom on bright areas (explosions, projectiles)
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.globalAlpha = 0.04;
  
  // Bloom around explosions
  state.explosions.forEach(exp => {
    const bloomGrad = ctx.createRadialGradient(
      exp.position.x, exp.position.y, 0,
      exp.position.x, exp.position.y, exp.radius * 1.5
    );
    bloomGrad.addColorStop(0, 'rgba(255, 200, 100, 0.3)');
    bloomGrad.addColorStop(0.5, 'rgba(255, 150, 50, 0.1)');
    bloomGrad.addColorStop(1, 'rgba(255, 100, 0, 0)');
    ctx.fillStyle = bloomGrad;
    ctx.beginPath();
    ctx.arc(exp.position.x, exp.position.y, exp.radius * 1.5, 0, Math.PI * 2);
    ctx.fill();
  });
  
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

// Color utilities imported from ./colors
