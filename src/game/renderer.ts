import { GameState, Tank, Bullet, Particle, Explosion, Obstacle, Vector2 } from './types';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from './engine';

interface LightSource {
  position: Vector2;
  radius: number;
  intensity: number;
  color: string;
}

let groundDecals: Array<{x: number; y: number; radius: number; opacity: number; type: 'scorch' | 'crater'}> = [];
const MAX_DECALS = 50;

export function renderGame(ctx: CanvasRenderingContext2D, state: GameState, time: number) {
  const camera = {
    x: state.player.position.x - CANVAS_WIDTH / 2 + state.screenShake.x,
    y: state.player.position.y - CANVAS_HEIGHT / 2 + state.screenShake.y,
  };

  ctx.save();
  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  // Draw background with terrain
  drawBackground(ctx, camera, time);
  
  ctx.save();
  ctx.translate(-camera.x, -camera.y);
  
  // Draw ground decals
  drawGroundDecals(ctx);
  
  // Draw grid/terrain details
  drawTerrain(ctx, camera, time);
  
  // Draw obstacles
  state.obstacles.forEach(obs => drawObstacle(ctx, obs, time));
  
  // Draw particles (behind tanks) - smoke
  state.particles.filter(p => p.type === 'smoke').forEach(p => drawParticle(ctx, p, time));
  
  // Draw explosions
  state.explosions.forEach(e => drawExplosion(ctx, e, time));
  
  // Draw bullets with energy effects
  state.bullets.forEach(b => drawBullet(ctx, b, time));
  
  // Draw bullet trail particles
  state.particles.filter(p => p.type === 'trail' || p.type === 'muzzle').forEach(p => drawParticle(ctx, p, time));
  
  // Draw tanks with advanced rendering
  state.enemies.forEach(tank => drawTank(ctx, tank, time, state));
  drawTank(ctx, state.player, time, state);
  
  // Draw remaining particles
  state.particles.filter(p => p.type !== 'smoke' && p.type !== 'trail' && p.type !== 'muzzle').forEach(p => drawParticle(ctx, p, time));
  
  // Dynamic lighting pass
  drawDynamicLighting(ctx, state, time);
  
  ctx.restore();
  
  // Post-processing effects
  drawVignette(ctx);
  drawScanLines(ctx, time);
  drawChromaticAberration(ctx, state);
  
  // Draw crosshair
  drawCrosshair(ctx, state, time);
  
  // Atmospheric haze
  drawAtmosphericHaze(ctx, state, time);
}

function drawBackground(ctx: CanvasRenderingContext2D, camera: Vector2, time: number) {
  // Rich multi-layer background
  const gradient = ctx.createRadialGradient(
    CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, 0,
    CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, CANVAS_WIDTH * 0.8
  );
  gradient.addColorStop(0, '#1e293b');
  gradient.addColorStop(0.3, '#172032');
  gradient.addColorStop(0.6, '#0f172a');
  gradient.addColorStop(1, '#030712');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  // Subtle noise texture
  ctx.globalAlpha = 0.02;
  for (let i = 0; i < 300; i++) {
    const x = ((i * 173.7 + camera.x * 0.05) % CANVAS_WIDTH + CANVAS_WIDTH) % CANVAS_WIDTH;
    const y = ((i * 211.3 + camera.y * 0.05) % CANVAS_HEIGHT + CANVAS_HEIGHT) % CANVAS_HEIGHT;
    const size = 1 + (i % 4);
    ctx.fillStyle = i % 3 === 0 ? '#475569' : i % 3 === 1 ? '#334155' : '#1e293b';
    ctx.fillRect(x, y, size, size);
  }
  ctx.globalAlpha = 1;
  
  // Ambient floating particles
  for (let i = 0; i < 40; i++) {
    const phase = time * 0.001 + i * 0.5;
    const x = ((i * 137.5 + time * 0.006 + Math.sin(phase) * 30) % CANVAS_WIDTH);
    const y = ((i * 97.3 + time * 0.003 + Math.cos(phase * 0.7) * 20) % CANVAS_HEIGHT);
    const size = 1 + Math.sin(phase * 2) * 0.5;
    const alpha = 0.03 + Math.sin(phase) * 0.02;
    
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(148, 163, 184, ${alpha})`;
    ctx.fill();
  }
  
  // Ambient light spots
  const spotX = CANVAS_WIDTH / 2 + Math.sin(time * 0.0003) * 150;
  const spotY = CANVAS_HEIGHT / 2 + Math.cos(time * 0.0004) * 100;
  const spotGradient = ctx.createRadialGradient(spotX, spotY, 0, spotX, spotY, 400);
  spotGradient.addColorStop(0, 'rgba(59, 130, 246, 0.02)');
  spotGradient.addColorStop(0.5, 'rgba(99, 102, 241, 0.01)');
  spotGradient.addColorStop(1, 'rgba(59, 130, 246, 0)');
  ctx.fillStyle = spotGradient;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
}

function drawTerrain(ctx: CanvasRenderingContext2D, camera: Vector2, time: number) {
  const gridSize = 80;
  const startX = Math.floor(camera.x / gridSize) * gridSize;
  const startY = Math.floor(camera.y / gridSize) * gridSize;
  
  // Ground tile pattern
  for (let x = startX; x < camera.x + CANVAS_WIDTH + gridSize; x += gridSize) {
    for (let y = startY; y < camera.y + CANVAS_HEIGHT + gridSize; y += gridSize) {
      const tileX = Math.floor(x / gridSize);
      const tileY = Math.floor(y / gridSize);
      const checker = (tileX + tileY) % 2 === 0;
      
      // Base tile color with variation
      const variation = Math.sin(tileX * 0.3 + tileY * 0.5) * 5;
      const baseR = checker ? 25 : 22;
      const baseG = checker ? 35 : 30;
      const baseB = checker ? 50 : 45;
      
      ctx.fillStyle = `rgb(${baseR + variation}, ${baseG + variation}, ${baseB + variation})`;
      ctx.fillRect(x, y, gridSize, gridSize);
      
      // Tile edge highlight
      ctx.strokeStyle = 'rgba(100, 150, 255, 0.03)';
      ctx.lineWidth = 0.5;
      ctx.strokeRect(x, y, gridSize, gridSize);
    }
  }
  
  // Ground detail - small rocks and debris
  ctx.fillStyle = 'rgba(71, 85, 105, 0.08)';
  for (let i = 0; i < 100; i++) {
    const gx = ((i * 197 + camera.x * 0.2) % (camera.x + CANVAS_WIDTH + 400)) - 200;
    const gy = ((i * 283 + camera.y * 0.2) % (camera.y + CANVAS_HEIGHT + 400)) - 200;
    if (gx > camera.x - 100 && gx < camera.x + CANVAS_WIDTH + 100 &&
        gy > camera.y - 100 && gy < camera.y + CANVAS_HEIGHT + 100) {
      const size = 2 + (i % 5);
      ctx.beginPath();
      ctx.ellipse(gx, gy, size, size * 0.7, i * 0.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  
  // Map boundary with animated glow
  const boundaryPulse = 0.3 + Math.sin(time * 0.003) * 0.1;
  
  // Outer glow
  ctx.strokeStyle = `rgba(239, 68, 68, ${boundaryPulse * 0.2})`;
  ctx.lineWidth = 12;
  ctx.strokeRect(-6, -6, 2412, 1612);
  
  // Main boundary
  ctx.strokeStyle = `rgba(239, 68, 68, ${boundaryPulse})`;
  ctx.lineWidth = 3;
  ctx.shadowColor = '#ef4444';
  ctx.shadowBlur = 20;
  ctx.strokeRect(0, 0, 2400, 1600);
  ctx.shadowBlur = 0;
  
  // Inner warning stripe
  ctx.strokeStyle = 'rgba(239, 68, 68, 0.08)';
  ctx.lineWidth = 1;
  ctx.setLineDash([15, 15]);
  ctx.lineDashOffset = -time * 0.02;
  ctx.strokeRect(40, 40, 2320, 1520);
  ctx.setLineDash([]);
  ctx.lineDashOffset = 0;
}

function drawGroundDecals(ctx: CanvasRenderingContext2D) {
  groundDecals.forEach(decal => {
    ctx.save();
    ctx.globalAlpha = decal.opacity;
    
    if (decal.type === 'scorch') {
      const gradient = ctx.createRadialGradient(decal.x, decal.y, 0, decal.x, decal.y, decal.radius);
      gradient.addColorStop(0, 'rgba(20, 15, 10, 0.6)');
      gradient.addColorStop(0.5, 'rgba(40, 30, 20, 0.3)');
      gradient.addColorStop(1, 'rgba(30, 25, 15, 0)');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(decal.x, decal.y, decal.radius, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Crater
      const gradient = ctx.createRadialGradient(decal.x, decal.y, 0, decal.x, decal.y, decal.radius);
      gradient.addColorStop(0, 'rgba(10, 8, 5, 0.8)');
      gradient.addColorStop(0.7, 'rgba(30, 25, 15, 0.4)');
      gradient.addColorStop(1, 'rgba(50, 40, 25, 0)');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(decal.x, decal.y, decal.radius, 0, Math.PI * 2);
      ctx.fill();
      
      // Crater rim
      ctx.strokeStyle = 'rgba(60, 50, 30, 0.3)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(decal.x, decal.y, decal.radius * 0.9, 0, Math.PI * 2);
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

function drawTank(ctx: CanvasRenderingContext2D, tank: Tank, time: number, state: GameState) {
  ctx.save();
  ctx.translate(tank.position.x, tank.position.y);
  
  // Dynamic shadow based on tank position
  const shadowOffset = 4;
  ctx.save();
  ctx.rotate(tank.angle);
  ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
  ctx.beginPath();
  ctx.ellipse(shadowOffset, shadowOffset + 2, tank.size * 1.2, tank.size * 0.85, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  
  // Tank body
  ctx.save();
  ctx.rotate(tank.angle);
  
  // Track rendering with more detail
  const trackWidth = tank.size * 0.38;
  const trackLength = tank.size * 1.5;
  
  drawAdvancedTrack(ctx, -tank.size * 0.65, 0, trackWidth, trackLength, tank.trackOffset, tank.color);
  drawAdvancedTrack(ctx, tank.size * 0.65, 0, trackWidth, trackLength, tank.trackOffset, tank.color);
  
  // Hull - advanced metallic rendering
  ctx.beginPath();
  ctx.moveTo(-tank.size * 0.42, -tank.size * 0.72);
  ctx.lineTo(tank.size * 0.42, -tank.size * 0.72);
  ctx.quadraticCurveTo(tank.size * 0.52, -tank.size * 0.5, tank.size * 0.52, -tank.size * 0.3);
  ctx.lineTo(tank.size * 0.52, tank.size * 0.5);
  ctx.quadraticCurveTo(tank.size * 0.45, tank.size * 0.72, tank.size * 0.3, tank.size * 0.72);
  ctx.lineTo(-tank.size * 0.3, tank.size * 0.72);
  ctx.quadraticCurveTo(-tank.size * 0.45, tank.size * 0.72, -tank.size * 0.52, tank.size * 0.5);
  ctx.lineTo(-tank.size * 0.52, -tank.size * 0.3);
  ctx.quadraticCurveTo(-tank.size * 0.52, -tank.size * 0.5, -tank.size * 0.42, -tank.size * 0.72);
  ctx.closePath();
  
  // Multi-stop metallic gradient
  const hullGradient = ctx.createLinearGradient(-tank.size * 0.5, -tank.size * 0.7, tank.size * 0.5, tank.size * 0.7);
  hullGradient.addColorStop(0, lightenColor(tank.color, 60));
  hullGradient.addColorStop(0.15, lightenColor(tank.color, 30));
  hullGradient.addColorStop(0.35, tank.color);
  hullGradient.addColorStop(0.6, darkenColor(tank.color, 15));
  hullGradient.addColorStop(0.85, darkenColor(tank.color, 35));
  hullGradient.addColorStop(1, darkenColor(tank.color, 50));
  ctx.fillStyle = hullGradient;
  ctx.fill();
  
  // Chrome-like specular highlight
  ctx.beginPath();
  ctx.moveTo(-tank.size * 0.35, -tank.size * 0.65);
  ctx.quadraticCurveTo(-tank.size * 0.1, -tank.size * 0.68, tank.size * 0.15, -tank.size * 0.6);
  ctx.lineTo(tank.size * 0.2, -tank.size * 0.35);
  ctx.quadraticCurveTo(0, -tank.size * 0.3, -tank.size * 0.25, -tank.size * 0.35);
  ctx.closePath();
  
  const specGradient = ctx.createLinearGradient(0, -tank.size * 0.65, 0, -tank.size * 0.35);
  specGradient.addColorStop(0, `rgba(255, 255, 255, ${0.25 + Math.sin(time * 0.002) * 0.05})`);
  specGradient.addColorStop(0.5, `rgba(255, 255, 255, ${0.1 + Math.sin(time * 0.003) * 0.03})`);
  specGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
  ctx.fillStyle = specGradient;
  ctx.fill();
  
  // Secondary reflection
  ctx.beginPath();
  ctx.moveTo(-tank.size * 0.2, tank.size * 0.1);
  ctx.lineTo(tank.size * 0.15, tank.size * 0.1);
  ctx.lineTo(tank.size * 0.1, tank.size * 0.4);
  ctx.lineTo(-tank.size * 0.15, tank.size * 0.4);
  ctx.closePath();
  ctx.fillStyle = `rgba(255, 255, 255, ${0.04 + Math.sin(time * 0.004 + 2) * 0.02})`;
  ctx.fill();
  
  // Hull edge highlight
  ctx.strokeStyle = lightenColor(tank.color, 40);
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(-tank.size * 0.42, -tank.size * 0.72);
  ctx.lineTo(tank.size * 0.42, -tank.size * 0.72);
  ctx.stroke();
  
  // Hull border
  ctx.strokeStyle = darkenColor(tank.color, 60);
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(-tank.size * 0.42, -tank.size * 0.72);
  ctx.lineTo(tank.size * 0.42, -tank.size * 0.72);
  ctx.quadraticCurveTo(tank.size * 0.52, -tank.size * 0.5, tank.size * 0.52, -tank.size * 0.3);
  ctx.lineTo(tank.size * 0.52, tank.size * 0.5);
  ctx.quadraticCurveTo(tank.size * 0.45, tank.size * 0.72, tank.size * 0.3, tank.size * 0.72);
  ctx.lineTo(-tank.size * 0.3, tank.size * 0.72);
  ctx.quadraticCurveTo(-tank.size * 0.45, tank.size * 0.72, -tank.size * 0.52, tank.size * 0.5);
  ctx.lineTo(-tank.size * 0.52, -tank.size * 0.3);
  ctx.quadraticCurveTo(-tank.size * 0.52, -tank.size * 0.5, -tank.size * 0.42, -tank.size * 0.72);
  ctx.stroke();
  
  // Armor panels
  ctx.strokeStyle = 'rgba(0,0,0,0.15)';
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  ctx.moveTo(-tank.size * 0.35, -tank.size * 0.1);
  ctx.lineTo(tank.size * 0.35, -tank.size * 0.1);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-tank.size * 0.35, tank.size * 0.2);
  ctx.lineTo(tank.size * 0.35, tank.size * 0.2);
  ctx.stroke();
  
  // Rivets with 3D effect
  const rivetPositions = [
    [-0.38, -0.55], [0.38, -0.55], [-0.38, 0.55], [0.38, 0.55],
    [-0.42, -0.2], [0.42, -0.2], [-0.42, 0.1], [0.42, 0.1],
    [-0.42, 0.4], [0.42, 0.4], [0, -0.6], [0, 0.6]
  ];
  rivetPositions.forEach(([rx, ry]) => {
    const rivetX = rx * tank.size;
    const rivetY = ry * tank.size;
    
    // Rivet shadow
    ctx.beginPath();
    ctx.arc(rivetX + 0.5, rivetY + 0.5, 2.5, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fill();
    
    // Rivet body
    const rivetGrad = ctx.createRadialGradient(rivetX - 0.5, rivetY - 0.5, 0, rivetX, rivetY, 2.5);
    rivetGrad.addColorStop(0, lightenColor(tank.color, 50));
    rivetGrad.addColorStop(0.5, darkenColor(tank.color, 20));
    rivetGrad.addColorStop(1, darkenColor(tank.color, 40));
    ctx.beginPath();
    ctx.arc(rivetX, rivetY, 2, 0, Math.PI * 2);
    ctx.fillStyle = rivetGrad;
    ctx.fill();
    
    // Rivet highlight
    ctx.beginPath();
    ctx.arc(rivetX - 0.5, rivetY - 0.5, 0.8, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.fill();
  });
  
  // Engine exhaust ports
  ctx.fillStyle = darkenColor(tank.color, 60);
  ctx.fillRect(-tank.size * 0.15, tank.size * 0.6, tank.size * 0.3, tank.size * 0.08);
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.fillRect(-tank.size * 0.12, tank.size * 0.62, tank.size * 0.24, tank.size * 0.04);
  
  // Engine glow
  if (tank.isPlayer) {
    const engineGlow = ctx.createRadialGradient(0, tank.size * 0.65, 0, 0, tank.size * 0.65, tank.size * 0.4);
    engineGlow.addColorStop(0, 'rgba(59, 130, 246, 0.4)');
    engineGlow.addColorStop(0.5, 'rgba(59, 130, 246, 0.1)');
    engineGlow.addColorStop(1, 'rgba(59, 130, 246, 0)');
    ctx.fillStyle = engineGlow;
    ctx.beginPath();
    ctx.arc(0, tank.size * 0.65, tank.size * 0.4, 0, Math.PI * 2);
    ctx.fill();
  }
  
  ctx.restore();
  
  // Turret (rotates independently)
  ctx.save();
  ctx.rotate(tank.turretAngle);
  
  // Turret shadow
  ctx.beginPath();
  ctx.arc(3, 3, tank.size * 0.48, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.fill();
  
  // Advanced barrel rendering
  const barrelLength = tank.size * 1.5;
  const barrelWidth = tank.size * 0.14;
  
  // Barrel shadow
  ctx.fillStyle = 'rgba(0,0,0,0.2)';
  ctx.fillRect(tank.size * 0.3 + 2, -barrelWidth + 2, barrelLength - tank.size * 0.3, barrelWidth * 2);
  
  // Main barrel - chrome effect
  const barrelGradient = ctx.createLinearGradient(0, -barrelWidth * 1.2, 0, barrelWidth * 1.2);
  barrelGradient.addColorStop(0, '#4a4a4a');
  barrelGradient.addColorStop(0.15, '#8a8a8a');
  barrelGradient.addColorStop(0.3, '#d4d4d4');
  barrelGradient.addColorStop(0.45, '#f5f5f5');
  barrelGradient.addColorStop(0.55, '#e0e0e0');
  barrelGradient.addColorStop(0.7, '#a0a0a0');
  barrelGradient.addColorStop(0.85, '#707070');
  barrelGradient.addColorStop(1, '#3a3a3a');
  
  ctx.fillStyle = barrelGradient;
  ctx.beginPath();
  ctx.roundRect(tank.size * 0.3, -barrelWidth, barrelLength - tank.size * 0.3, barrelWidth * 2, 2);
  ctx.fill();
  
  // Barrel reinforcement rings
  for (let i = 0; i < 3; i++) {
    const ringX = tank.size * 0.5 + i * (barrelLength - tank.size * 0.5) / 3;
    ctx.fillStyle = 'rgba(0,0,0,0.15)';
    ctx.fillRect(ringX, -barrelWidth * 1.1, 3, barrelWidth * 2.2);
    ctx.fillStyle = 'rgba(255,255,255,0.1)';
    ctx.fillRect(ringX, -barrelWidth * 1.1, 1, barrelWidth * 2.2);
  }
  
  // Barrel tip / muzzle brake
  const muzzleWidth = barrelWidth * 1.4;
  const muzzleGrad = ctx.createLinearGradient(0, -muzzleWidth, 0, muzzleWidth);
  muzzleGrad.addColorStop(0, '#555');
  muzzleGrad.addColorStop(0.3, '#999');
  muzzleGrad.addColorStop(0.5, '#bbb');
  muzzleGrad.addColorStop(0.7, '#888');
  muzzleGrad.addColorStop(1, '#444');
  ctx.fillStyle = muzzleGrad;
  ctx.beginPath();
  ctx.roundRect(barrelLength - 8, -muzzleWidth, 12, muzzleWidth * 2, 2);
  ctx.fill();
  
  // Muzzle hole
  ctx.beginPath();
  ctx.arc(barrelLength + 2, 0, barrelWidth * 0.5, 0, Math.PI * 2);
  ctx.fillStyle = '#111';
  ctx.fill();
  
  // Barrel shine line
  ctx.strokeStyle = 'rgba(255,255,255,0.3)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(tank.size * 0.35, -barrelWidth * 0.4);
  ctx.lineTo(barrelLength - 10, -barrelWidth * 0.4);
  ctx.stroke();
  
  // Turret dome - advanced metallic
  ctx.beginPath();
  ctx.arc(0, 0, tank.size * 0.42, 0, Math.PI * 2);
  
  const turretGradient = ctx.createRadialGradient(
    -tank.size * 0.12, -tank.size * 0.12, 0,
    0, 0, tank.size * 0.42
  );
  turretGradient.addColorStop(0, lightenColor(tank.accentColor, 70));
  turretGradient.addColorStop(0.2, lightenColor(tank.accentColor, 30));
  turretGradient.addColorStop(0.5, tank.color);
  turretGradient.addColorStop(0.8, darkenColor(tank.color, 20));
  turretGradient.addColorStop(1, darkenColor(tank.color, 45));
  ctx.fillStyle = turretGradient;
  ctx.fill();
  
  // Turret ring
  ctx.strokeStyle = darkenColor(tank.color, 50);
  ctx.lineWidth = 2.5;
  ctx.stroke();
  
  // Turret specular highlight
  ctx.beginPath();
  ctx.arc(-tank.size * 0.1, -tank.size * 0.12, tank.size * 0.22, 0, Math.PI * 2);
  const specTurret = ctx.createRadialGradient(
    -tank.size * 0.1, -tank.size * 0.12, 0,
    -tank.size * 0.1, -tank.size * 0.12, tank.size * 0.22
  );
  specTurret.addColorStop(0, `rgba(255,255,255,${0.3 + Math.sin(time * 0.003) * 0.05})`);
  specTurret.addColorStop(0.5, 'rgba(255,255,255,0.05)');
  specTurret.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = specTurret;
  ctx.fill();
  
  // Turret hatch detail
  ctx.beginPath();
  ctx.arc(tank.size * 0.05, tank.size * 0.05, tank.size * 0.12, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(0,0,0,0.2)';
  ctx.lineWidth = 1;
  ctx.stroke();
  
  // Antenna
  ctx.strokeStyle = 'rgba(200,200,200,0.6)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(-tank.size * 0.2, -tank.size * 0.1);
  ctx.lineTo(-tank.size * 0.25, -tank.size * 0.5);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(-tank.size * 0.25, -tank.size * 0.5, 1.5, 0, Math.PI * 2);
  ctx.fillStyle = tank.isPlayer ? '#60a5fa' : '#f87171';
  ctx.fill();
  
  ctx.restore();
  
  // Health bar
  if (tank.health < tank.maxHealth) {
    const barWidth = tank.size * 1.6;
    const barHeight = 5;
    const barY = -tank.size - 18;
    
    // Bar background
    ctx.fillStyle = 'rgba(0,0,0,0.8)';
    ctx.beginPath();
    ctx.roundRect(-barWidth / 2 - 1, barY - 1, barWidth + 2, barHeight + 2, 3);
    ctx.fill();
    
    const healthPercent = tank.health / tank.maxHealth;
    const healthColor = healthPercent > 0.5 ? '#4ade80' : healthPercent > 0.25 ? '#fbbf24' : '#ef4444';
    
    // Health fill with gradient
    const healthGrad = ctx.createLinearGradient(-barWidth / 2, 0, barWidth / 2, 0);
    healthGrad.addColorStop(0, healthColor);
    healthGrad.addColorStop(1, darkenColor(healthColor, 20));
    ctx.fillStyle = healthGrad;
    ctx.beginPath();
    ctx.roundRect(-barWidth / 2, barY, barWidth * healthPercent, barHeight, 2);
    ctx.fill();
    
    // Health bar shine
    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    ctx.beginPath();
    ctx.roundRect(-barWidth / 2, barY, barWidth * healthPercent, barHeight / 2, [2, 2, 0, 0]);
    ctx.fill();
  }
  
  // Player indicator glow ring
  if (tank.isPlayer) {
    const glowPulse = 0.3 + Math.sin(time * 0.004) * 0.1;
    ctx.beginPath();
    ctx.arc(0, 0, tank.size * 1.6, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(96, 165, 250, ${glowPulse})`;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([8, 8]);
    ctx.lineDashOffset = time * 0.02;
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.lineDashOffset = 0;
  }
  
  // Damage smoke for low health
  if (tank.health < tank.maxHealth * 0.3) {
    if (Math.random() > 0.7) {
      const smokeX = tank.position.x + (Math.random() - 0.5) * tank.size;
      const smokeY = tank.position.y + (Math.random() - 0.5) * tank.size;
    }
  }
  
  ctx.restore();
}

function drawAdvancedTrack(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, length: number, offset: number, color: string) {
  ctx.save();
  ctx.translate(x, y);
  
  // Track body with depth
  const trackGradient = ctx.createLinearGradient(-width / 2, 0, width / 2, 0);
  trackGradient.addColorStop(0, '#1a1a1a');
  trackGradient.addColorStop(0.2, '#3a3a3a');
  trackGradient.addColorStop(0.4, '#555');
  trackGradient.addColorStop(0.5, '#666');
  trackGradient.addColorStop(0.6, '#555');
  trackGradient.addColorStop(0.8, '#3a3a3a');
  trackGradient.addColorStop(1, '#1a1a1a');
  
  ctx.fillStyle = trackGradient;
  ctx.beginPath();
  ctx.roundRect(-width / 2, -length / 2, width, length, 4);
  ctx.fill();
  
  // Track segments with metallic look
  const segmentSpacing = 7;
  for (let i = -length / 2 + 2; i < length / 2 - 2; i += segmentSpacing) {
    const segY = ((i + offset * 3) % segmentSpacing + segmentSpacing) % segmentSpacing - segmentSpacing / 2 + i;
    
    // Segment groove
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fillRect(-width / 2 + 2, segY, width - 4, 2);
    
    // Segment highlight
    ctx.fillStyle = 'rgba(255,255,255,0.05)';
    ctx.fillRect(-width / 2 + 2, segY + 2, width - 4, 1);
  }
  
  // Track edge highlights
  ctx.strokeStyle = 'rgba(100,100,100,0.3)';
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  ctx.roundRect(-width / 2, -length / 2, width, length, 4);
  ctx.stroke();
  
  // Wheel hubs
  const wheelPositions = [-length / 2 + 8, 0, length / 2 - 8];
  wheelPositions.forEach(wy => {
    ctx.beginPath();
    ctx.arc(0, wy, width * 0.3, 0, Math.PI * 2);
    const wheelGrad = ctx.createRadialGradient(-1, wy - 1, 0, 0, wy, width * 0.3);
    wheelGrad.addColorStop(0, '#666');
    wheelGrad.addColorStop(0.5, '#444');
    wheelGrad.addColorStop(1, '#222');
    ctx.fillStyle = wheelGrad;
    ctx.fill();
  });
  
  ctx.restore();
}

function drawBullet(ctx: CanvasRenderingContext2D, bullet: Bullet, time: number) {
  // Energy trail
  if (bullet.trail.length > 1) {
    for (let i = 1; i < bullet.trail.length; i++) {
      const alpha = (i / bullet.trail.length) * 0.6;
      const width = (i / bullet.trail.length) * bullet.size * 1.5;
      
      ctx.beginPath();
      ctx.moveTo(bullet.trail[i - 1].x, bullet.trail[i - 1].y);
      ctx.lineTo(bullet.trail[i].x, bullet.trail[i].y);
      ctx.strokeStyle = `rgba(255, 180, 50, ${alpha})`;
      ctx.lineWidth = width;
      ctx.lineCap = 'round';
      ctx.stroke();
    }
    
    // Connect to current position
    const lastTrail = bullet.trail[bullet.trail.length - 1];
    ctx.beginPath();
    ctx.moveTo(lastTrail.x, lastTrail.y);
    ctx.lineTo(bullet.position.x, bullet.position.y);
    ctx.strokeStyle = 'rgba(255, 200, 50, 0.7)';
    ctx.lineWidth = bullet.size * 1.5;
    ctx.lineCap = 'round';
    ctx.stroke();
  }
  
  // Outer energy field
  ctx.beginPath();
  ctx.arc(bullet.position.x, bullet.position.y, bullet.size * 4, 0, Math.PI * 2);
  const outerGlow = ctx.createRadialGradient(
    bullet.position.x, bullet.position.y, 0,
    bullet.position.x, bullet.position.y, bullet.size * 4
  );
  outerGlow.addColorStop(0, 'rgba(255, 200, 50, 0.4)');
  outerGlow.addColorStop(0.3, 'rgba(255, 150, 0, 0.2)');
  outerGlow.addColorStop(0.6, 'rgba(255, 100, 0, 0.05)');
  outerGlow.addColorStop(1, 'rgba(255, 50, 0, 0)');
  ctx.fillStyle = outerGlow;
  ctx.fill();
  
  // Mid glow
  ctx.beginPath();
  ctx.arc(bullet.position.x, bullet.position.y, bullet.size * 2, 0, Math.PI * 2);
  const midGlow = ctx.createRadialGradient(
    bullet.position.x, bullet.position.y, 0,
    bullet.position.x, bullet.position.y, bullet.size * 2
  );
  midGlow.addColorStop(0, 'rgba(255, 255, 200, 0.8)');
  midGlow.addColorStop(0.5, 'rgba(255, 200, 50, 0.4)');
  midGlow.addColorStop(1, 'rgba(255, 150, 0, 0)');
  ctx.fillStyle = midGlow;
  ctx.fill();
  
  // Bullet core - white hot center
  ctx.beginPath();
  ctx.arc(bullet.position.x, bullet.position.y, bullet.size, 0, Math.PI * 2);
  const coreGradient = ctx.createRadialGradient(
    bullet.position.x - bullet.size * 0.2, bullet.position.y - bullet.size * 0.2, 0,
    bullet.position.x, bullet.position.y, bullet.size
  );
  coreGradient.addColorStop(0, '#ffffff');
  coreGradient.addColorStop(0.2, '#fffde0');
  coreGradient.addColorStop(0.5, '#ffcc00');
  coreGradient.addColorStop(0.8, '#ff8800');
  coreGradient.addColorStop(1, '#ff4400');
  ctx.fillStyle = coreGradient;
  ctx.fill();
  
  // Energy crackling effect
  if (Math.random() > 0.5) {
    const crackAngle = Math.random() * Math.PI * 2;
    const crackLen = bullet.size * (2 + Math.random() * 2);
    ctx.beginPath();
    ctx.moveTo(bullet.position.x, bullet.position.y);
    ctx.lineTo(
      bullet.position.x + Math.cos(crackAngle) * crackLen,
      bullet.position.y + Math.sin(crackAngle) * crackLen
    );
    ctx.strokeStyle = `rgba(255, 255, 200, ${0.3 + Math.random() * 0.3})`;
    ctx.lineWidth = 0.5;
    ctx.stroke();
  }
}

function drawParticle(ctx: CanvasRenderingContext2D, particle: Particle, time: number) {
  ctx.save();
  ctx.globalAlpha = particle.opacity;
  ctx.translate(particle.position.x, particle.position.y);
  ctx.rotate(particle.rotation);
  
  if (particle.type === 'smoke') {
    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, particle.size);
    gradient.addColorStop(0, `rgba(120, 120, 120, ${particle.opacity * 0.4})`);
    gradient.addColorStop(0.4, `rgba(80, 80, 80, ${particle.opacity * 0.25})`);
    gradient.addColorStop(0.7, `rgba(60, 60, 60, ${particle.opacity * 0.1})`);
    gradient.addColorStop(1, `rgba(40, 40, 40, 0)`);
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(0, 0, particle.size, 0, Math.PI * 2);
    ctx.fill();
  } else if (particle.type === 'spark') {
    // Glowing spark with trail
    ctx.shadowColor = particle.color;
    ctx.shadowBlur = 4;
    ctx.fillStyle = particle.color;
    ctx.fillRect(-particle.size / 2, -particle.size / 4, particle.size, particle.size / 2);
    ctx.shadowBlur = 0;
    
    // Spark core
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-particle.size / 4, -particle.size / 8, particle.size / 2, particle.size / 4);
  } else if (particle.type === 'explosion') {
    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, particle.size);
    gradient.addColorStop(0, particle.color);
    gradient.addColorStop(0.3, particle.color + 'cc');
    gradient.addColorStop(0.6, particle.color + '66');
    gradient.addColorStop(1, 'transparent');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(0, 0, particle.size, 0, Math.PI * 2);
    ctx.fill();
  } else if (particle.type === 'debris') {
    // 3D-looking debris chunk
    ctx.fillStyle = particle.color;
    ctx.beginPath();
    ctx.moveTo(-particle.size / 2, -particle.size / 3);
    ctx.lineTo(particle.size / 2, -particle.size / 4);
    ctx.lineTo(particle.size / 3, particle.size / 3);
    ctx.lineTo(-particle.size / 3, particle.size / 2);
    ctx.closePath();
    ctx.fill();
    
    // Debris highlight
    ctx.fillStyle = 'rgba(255,255,255,0.1)';
    ctx.beginPath();
    ctx.moveTo(-particle.size / 2, -particle.size / 3);
    ctx.lineTo(particle.size / 4, -particle.size / 4);
    ctx.lineTo(0, 0);
    ctx.lineTo(-particle.size / 4, 0);
    ctx.closePath();
    ctx.fill();
  } else if (particle.type === 'muzzle') {
    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, particle.size);
    gradient.addColorStop(0, '#ffffff');
    gradient.addColorStop(0.2, '#fffde0');
    gradient.addColorStop(0.4, '#ffee00');
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
  
  // Outer shockwave ring
  const shockRadius = explosion.radius * (1 + progress * 0.5);
  ctx.beginPath();
  ctx.arc(explosion.position.x, explosion.position.y, shockRadius, 0, Math.PI * 2);
  ctx.strokeStyle = `rgba(255, 200, 100, ${(1 - progress) * 0.4})`;
  ctx.lineWidth = 3 + (1 - progress) * 4;
  ctx.stroke();
  
  // Second shockwave
  ctx.beginPath();
  ctx.arc(explosion.position.x, explosion.position.y, shockRadius * 0.7, 0, Math.PI * 2);
  ctx.strokeStyle = `rgba(255, 150, 50, ${(1 - progress) * 0.3})`;
  ctx.lineWidth = 2;
  ctx.stroke();
  
  // Fire ball - outer
  ctx.globalAlpha = (1 - progress) * 0.8;
  const outerGradient = ctx.createRadialGradient(
    explosion.position.x, explosion.position.y, 0,
    explosion.position.x, explosion.position.y, explosion.radius * 1.3
  );
  outerGradient.addColorStop(0, 'rgba(255, 220, 100, 0.9)');
  outerGradient.addColorStop(0.2, 'rgba(255, 150, 50, 0.7)');
  outerGradient.addColorStop(0.5, 'rgba(255, 80, 0, 0.4)');
  outerGradient.addColorStop(0.8, 'rgba(200, 30, 0, 0.15)');
  outerGradient.addColorStop(1, 'rgba(100, 0, 0, 0)');
  ctx.fillStyle = outerGradient;
  ctx.beginPath();
  ctx.arc(explosion.position.x, explosion.position.y, explosion.radius * 1.3, 0, Math.PI * 2);
  ctx.fill();
  
  // Fire ball - inner core
  ctx.globalAlpha = (1 - progress);
  const innerGradient = ctx.createRadialGradient(
    explosion.position.x, explosion.position.y, 0,
    explosion.position.x, explosion.position.y, explosion.radius * 0.4
  );
  innerGradient.addColorStop(0, '#ffffff');
  innerGradient.addColorStop(0.3, '#fffde0');
  innerGradient.addColorStop(0.6, '#ffcc00');
  innerGradient.addColorStop(1, 'rgba(255, 100, 0, 0)');
  ctx.fillStyle = innerGradient;
  ctx.beginPath();
  ctx.arc(explosion.position.x, explosion.position.y, explosion.radius * 0.4, 0, Math.PI * 2);
  ctx.fill();
  
  // Fire tendrils
  ctx.globalAlpha = (1 - progress) * 0.5;
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2 + time * 0.001;
    const tendrilLen = explosion.radius * (0.5 + Math.sin(time * 0.01 + i * 2) * 0.3) * (1 - progress * 0.5);
    
    ctx.beginPath();
    ctx.moveTo(explosion.position.x, explosion.position.y);
    const cp1x = explosion.position.x + Math.cos(angle + 0.3) * tendrilLen * 0.5;
    const cp1y = explosion.position.y + Math.sin(angle + 0.3) * tendrilLen * 0.5;
    const endX = explosion.position.x + Math.cos(angle) * tendrilLen;
    const endY = explosion.position.y + Math.sin(angle) * tendrilLen;
    ctx.quadraticCurveTo(cp1x, cp1y, endX, endY);
    ctx.strokeStyle = `rgba(255, ${150 + i * 10}, 0, 0.5)`;
    ctx.lineWidth = 3 - progress * 2;
    ctx.stroke();
  }
  
  ctx.restore();
}

function drawDynamicLighting(ctx: CanvasRenderingContext2D, state: GameState, time: number) {
  // Collect light sources
  const lights: LightSource[] = [];
  
  // Explosion lights
  state.explosions.forEach(e => {
    const intensity = e.lifetime / e.maxLifetime;
    lights.push({
      position: e.position,
      radius: e.maxRadius * 3,
      intensity: intensity * 0.5,
      color: 'rgba(255, 150, 50,',
    });
  });
  
  // Player engine light
  lights.push({
    position: state.player.position,
    radius: 100,
    intensity: 0.1 + Math.sin(time * 0.005) * 0.03,
    color: 'rgba(96, 165, 250,',
  });
  
  // Render lights as additive overlays
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  
  lights.forEach(light => {
    const gradient = ctx.createRadialGradient(
      light.position.x, light.position.y, 0,
      light.position.x, light.position.y, light.radius
    );
    gradient.addColorStop(0, `${light.color} ${light.intensity})`);
    gradient.addColorStop(0.5, `${light.color} ${light.intensity * 0.3})`);
    gradient.addColorStop(1, `${light.color} 0)`);
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(light.position.x, light.position.y, light.radius, 0, Math.PI * 2);
    ctx.fill();
  });
  
  ctx.restore();
}

function drawObstacle(ctx: CanvasRenderingContext2D, obstacle: Obstacle, time: number) {
  ctx.save();
  ctx.translate(obstacle.position.x, obstacle.position.y);
  
  const healthPercent = obstacle.health / obstacle.maxHealth;
  
  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.fillRect(-obstacle.width / 2 + 3, -obstacle.height / 2 + 3, obstacle.width, obstacle.height);
  
  if (obstacle.type === 'building') {
    // Building with advanced metallic look
    const gradient = ctx.createLinearGradient(
      -obstacle.width / 2, -obstacle.height / 2,
      obstacle.width / 2, obstacle.height / 2
    );
    gradient.addColorStop(0, '#6b7280');
    gradient.addColorStop(0.2, '#4b5563');
    gradient.addColorStop(0.5, '#374151');
    gradient.addColorStop(0.8, '#2d3748');
    gradient.addColorStop(1, '#1f2937');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(-obstacle.width / 2, -obstacle.height / 2, obstacle.width, obstacle.height);
    
    // Top edge highlight
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    ctx.fillRect(-obstacle.width / 2, -obstacle.height / 2, obstacle.width, 3);
    
    // Left edge highlight
    ctx.fillStyle = 'rgba(255,255,255,0.04)';
    ctx.fillRect(-obstacle.width / 2, -obstacle.height / 2, 2, obstacle.height);
    
    // Windows with glow
    const windowSize = 8;
    for (let wx = -obstacle.width / 2 + 12; wx < obstacle.width / 2 - 12; wx += 18) {
      for (let wy = -obstacle.height / 2 + 12; wy < obstacle.height / 2 - 12; wy += 18) {
        // Window glow
        ctx.fillStyle = 'rgba(100, 200, 255, 0.08)';
        ctx.fillRect(wx - 1, wy - 1, windowSize + 2, windowSize + 2);
        
        // Window
        const windowGrad = ctx.createLinearGradient(wx, wy, wx + windowSize, wy + windowSize);
        windowGrad.addColorStop(0, 'rgba(100, 180, 255, 0.2)');
        windowGrad.addColorStop(1, 'rgba(50, 100, 200, 0.1)');
        ctx.fillStyle = windowGrad;
        ctx.fillRect(wx, wy, windowSize, windowSize);
      }
    }
    
    // Panel lines
    ctx.strokeStyle = 'rgba(0,0,0,0.2)';
    ctx.lineWidth = 1;
    ctx.strokeRect(-obstacle.width / 2 + 4, -obstacle.height / 2 + 4, obstacle.width - 8, obstacle.height - 8);
    
    // Damage cracks
    if (healthPercent < 0.7) {
      ctx.strokeStyle = 'rgba(30,20,10,0.7)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-obstacle.width * 0.3, -obstacle.height * 0.4);
      ctx.lineTo(-obstacle.width * 0.1, -obstacle.height * 0.1);
      ctx.lineTo(obstacle.width * 0.15, obstacle.height * 0.2);
      ctx.lineTo(obstacle.width * 0.3, obstacle.height * 0.4);
      ctx.stroke();
      
      // Secondary crack
      ctx.beginPath();
      ctx.moveTo(-obstacle.width * 0.1, -obstacle.height * 0.1);
      ctx.lineTo(obstacle.width * 0.2, -obstacle.height * 0.3);
      ctx.stroke();
    }
    
    // Border
    ctx.strokeStyle = 'rgba(0,0,0,0.4)';
    ctx.lineWidth = 2;
    ctx.strokeRect(-obstacle.width / 2, -obstacle.height / 2, obstacle.width, obstacle.height);
    
  } else if (obstacle.type === 'crate') {
    // Wooden crate with advanced rendering
    const gradient = ctx.createLinearGradient(
      -obstacle.width / 2, -obstacle.height / 2,
      obstacle.width / 2, obstacle.height / 2
    );
    gradient.addColorStop(0, '#b8733a');
    gradient.addColorStop(0.3, '#8B4513');
    gradient.addColorStop(0.7, '#6b3410');
    gradient.addColorStop(1, '#4a2508');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(-obstacle.width / 2, -obstacle.height / 2, obstacle.width, obstacle.height);
    
    // Wood grain
    ctx.strokeStyle = 'rgba(0,0,0,0.15)';
    ctx.lineWidth = 0.5;
    for (let i = -obstacle.height / 2 + 4; i < obstacle.height / 2; i += 6) {
      ctx.beginPath();
      ctx.moveTo(-obstacle.width / 2, i);
      const wave = Math.sin(i * 0.3) * 2;
      ctx.bezierCurveTo(
        -obstacle.width / 4, i + wave,
        obstacle.width / 4, i - wave,
        obstacle.width / 2, i
      );
      ctx.stroke();
    }
    
    // Metal bands
    ctx.fillStyle = 'rgba(100,100,100,0.4)';
    ctx.fillRect(-obstacle.width / 2, -obstacle.height / 2, obstacle.width, 4);
    ctx.fillRect(-obstacle.width / 2, obstacle.height / 2 - 4, obstacle.width, 4);
    ctx.fillStyle = 'rgba(150,150,150,0.2)';
    ctx.fillRect(-obstacle.width / 2, -obstacle.height / 2, obstacle.width, 1);
    ctx.fillRect(-obstacle.width / 2, obstacle.height / 2 - 4, obstacle.width, 1);
    
    // Corner brackets
    const bracketSize = 8;
    ctx.strokeStyle = 'rgba(80,80,80,0.6)';
    ctx.lineWidth = 2;
    // Top-left
    ctx.beginPath();
    ctx.moveTo(-obstacle.width / 2, -obstacle.height / 2 + bracketSize);
    ctx.lineTo(-obstacle.width / 2, -obstacle.height / 2);
    ctx.lineTo(-obstacle.width / 2 + bracketSize, -obstacle.height / 2);
    ctx.stroke();
    // Top-right
    ctx.beginPath();
    ctx.moveTo(obstacle.width / 2 - bracketSize, -obstacle.height / 2);
    ctx.lineTo(obstacle.width / 2, -obstacle.height / 2);
    ctx.lineTo(obstacle.width / 2, -obstacle.height / 2 + bracketSize);
    ctx.stroke();
    // Bottom-left
    ctx.beginPath();
    ctx.moveTo(-obstacle.width / 2, obstacle.height / 2 - bracketSize);
    ctx.lineTo(-obstacle.width / 2, obstacle.height / 2);
    ctx.lineTo(-obstacle.width / 2 + bracketSize, obstacle.height / 2);
    ctx.stroke();
    // Bottom-right
    ctx.beginPath();
    ctx.moveTo(obstacle.width / 2 - bracketSize, obstacle.height / 2);
    ctx.lineTo(obstacle.width / 2, obstacle.height / 2);
    ctx.lineTo(obstacle.width / 2, obstacle.height / 2 - bracketSize);
    ctx.stroke();
    
    // Border
    ctx.strokeStyle = '#3a1a05';
    ctx.lineWidth = 2;
    ctx.strokeRect(-obstacle.width / 2, -obstacle.height / 2, obstacle.width, obstacle.height);
    
  } else {
    // Wall - concrete/stone look
    const gradient = ctx.createLinearGradient(
      -obstacle.width / 2, -obstacle.height / 2,
      obstacle.width / 2, obstacle.height / 2
    );
    gradient.addColorStop(0, '#6b7280');
    gradient.addColorStop(0.3, '#4b5563');
    gradient.addColorStop(0.7, '#374151');
    gradient.addColorStop(1, '#2d3748');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(-obstacle.width / 2, -obstacle.height / 2, obstacle.width, obstacle.height);
    
    // Concrete texture
    ctx.strokeStyle = 'rgba(255,255,255,0.03)';
    ctx.lineWidth = 0.5;
    for (let i = -obstacle.width / 2; i < obstacle.width / 2; i += 12) {
      ctx.beginPath();
      ctx.moveTo(i, -obstacle.height / 2);
      ctx.lineTo(i + 2, obstacle.height / 2);
      ctx.stroke();
    }
    
    // Top highlight
    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    ctx.fillRect(-obstacle.width / 2, -obstacle.height / 2, obstacle.width, 2);
    
    // Border
    ctx.strokeStyle = '#1f2937';
    ctx.lineWidth = 2;
    ctx.strokeRect(-obstacle.width / 2, -obstacle.height / 2, obstacle.width, obstacle.height);
  }
  
  ctx.restore();
}

function drawVignette(ctx: CanvasRenderingContext2D) {
  const gradient = ctx.createRadialGradient(
    CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, CANVAS_WIDTH * 0.25,
    CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, CANVAS_WIDTH * 0.7
  );
  gradient.addColorStop(0, 'rgba(0,0,0,0)');
  gradient.addColorStop(0.5, 'rgba(0,0,0,0.1)');
  gradient.addColorStop(1, 'rgba(0,0,0,0.5)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
}

function drawScanLines(ctx: CanvasRenderingContext2D, time: number) {
  ctx.save();
  ctx.globalAlpha = 0.012;
  for (let y = 0; y < CANVAS_HEIGHT; y += 3) {
    ctx.fillStyle = y % 6 === 0 ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)';
    ctx.fillRect(0, y, CANVAS_WIDTH, 1);
  }
  ctx.restore();
}

function drawChromaticAberration(ctx: CanvasRenderingContext2D, state: GameState) {
  // Subtle chromatic aberration on screen shake
  const shakeAmount = Math.abs(state.screenShake.x) + Math.abs(state.screenShake.y);
  if (shakeAmount > 1) {
    ctx.save();
    ctx.globalAlpha = Math.min(0.05, shakeAmount * 0.005);
    ctx.globalCompositeOperation = 'screen';
    ctx.drawImage(ctx.canvas, -1, 0);
    ctx.drawImage(ctx.canvas, 1, 0);
    ctx.restore();
  }
}

function drawCrosshair(ctx: CanvasRenderingContext2D, state: GameState, time: number) {
  const aimDist = 130;
  const cx = CANVAS_WIDTH / 2 + Math.cos(state.player.turretAngle) * aimDist;
  const cy = CANVAS_HEIGHT / 2 + Math.sin(state.player.turretAngle) * aimDist;
  
  ctx.save();
  ctx.translate(cx, cy);
  
  const pulse = Math.sin(time * 0.005) * 0.2 + 0.8;
  const rotation = time * 0.001;
  
  // Outer rotating ring
  ctx.save();
  ctx.rotate(rotation);
  ctx.beginPath();
  ctx.arc(0, 0, 18, 0, Math.PI * 0.5);
  ctx.arc(0, 0, 18, Math.PI, Math.PI * 1.5);
  ctx.strokeStyle = `rgba(255, 100, 50, ${0.4 * pulse})`;
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.restore();
  
  // Counter-rotating inner ring
  ctx.save();
  ctx.rotate(-rotation * 1.5);
  ctx.beginPath();
  ctx.arc(0, 0, 12, Math.PI * 0.25, Math.PI * 0.75);
  ctx.arc(0, 0, 12, Math.PI * 1.25, Math.PI * 1.75);
  ctx.strokeStyle = `rgba(255, 150, 50, ${0.3 * pulse})`;
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.restore();
  
  // Center dot with glow
  const dotGlow = ctx.createRadialGradient(0, 0, 0, 0, 0, 6);
  dotGlow.addColorStop(0, `rgba(255, 200, 100, ${0.8 * pulse})`);
  dotGlow.addColorStop(0.5, `rgba(255, 100, 50, ${0.3 * pulse})`);
  dotGlow.addColorStop(1, 'rgba(255, 50, 0, 0)');
  ctx.fillStyle = dotGlow;
  ctx.beginPath();
  ctx.arc(0, 0, 6, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.beginPath();
  ctx.arc(0, 0, 2, 0, Math.PI * 2);
  ctx.fillStyle = `rgba(255, 255, 255, ${0.9 * pulse})`;
  ctx.fill();
  
  // Cross lines with gap
  const lineLen = 10;
  const gap = 6;
  ctx.strokeStyle = `rgba(255, 120, 50, ${0.6 * pulse})`;
  ctx.lineWidth = 1.5;
  ctx.lineCap = 'round';
  
  ctx.beginPath();
  ctx.moveTo(0, -gap); ctx.lineTo(0, -gap - lineLen);
  ctx.moveTo(0, gap); ctx.lineTo(0, gap + lineLen);
  ctx.moveTo(-gap, 0); ctx.lineTo(-gap - lineLen, 0);
  ctx.moveTo(gap, 0); ctx.lineTo(gap + lineLen, 0);
  ctx.stroke();
  
  ctx.restore();
}

function drawAtmosphericHaze(ctx: CanvasRenderingContext2D, state: GameState, time: number) {
  // Subtle atmospheric fog at edges
  ctx.save();
  ctx.globalAlpha = 0.03;
  
  const hazeGrad = ctx.createLinearGradient(0, CANVAS_HEIGHT, 0, CANVAS_HEIGHT * 0.7);
  hazeGrad.addColorStop(0, 'rgba(100, 130, 180, 0.5)');
  hazeGrad.addColorStop(1, 'rgba(100, 130, 180, 0)');
  ctx.fillStyle = hazeGrad;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
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
