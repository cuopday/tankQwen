import { lightenColor, darkenColor, blendColors } from './colors';
// Super Realistic Tank Rendering - Using Enhanced Shapes
import { Tank, Vector2 } from './types';
import { LightingSystem } from './RealisticGraphics';
import { 
  drawEnhancedHullShape, 
  drawEnhancedTurretDome, 
  drawEnhancedBarrel, 
  drawEnhancedTrack
} from './EnhancedShapes';

export function drawSuperRealisticTank(
  ctx: CanvasRenderingContext2D,
  tank: Tank,
  time: number,
  lighting: LightingSystem
) {
  const { position, angle, turretAngle, size, color, health, maxHealth } = tank;
  
  ctx.save();
  ctx.translate(position.x, position.y);
  
  // Calculate lighting at tank position
  const lightingData = lighting.calculateLightAt(position);
  
  // Multi-layer realistic shadow
  drawRealisticShadow(ctx, tank, time);
  
  // Hull with enhanced shape
  ctx.save();
  ctx.rotate(angle);
  drawEnhancedHull(ctx, tank, time, lightingData);
  ctx.restore();
  
  // Turret with enhanced shape
  ctx.save();
  ctx.rotate(turretAngle);
  drawEnhancedTurret(ctx, tank, time, lightingData);
  ctx.restore();
  
  // Environmental effects
  drawEnvironmentalEffects(ctx, tank, time);
  
  // Damage and wear
  if (health < maxHealth) {
    drawRealisticDamage(ctx, tank, time);
  }
  
  // Health bar
  if (health < maxHealth) {
    drawFloatingHealthBar(ctx, tank);
  }
  
  // Player indicator
  if (tank.isPlayer) {
    drawPlayerIndicator(ctx, tank, time);
  }
  
  ctx.restore();
}

function drawRealisticShadow(ctx: CanvasRenderingContext2D, tank: Tank, time: number) {
  const { size, height } = tank;
  
  // Contact shadow (darkest, closest)
  ctx.save();
  ctx.translate(2, 3);
  const contactGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, size * 0.95);
  contactGrad.addColorStop(0, 'rgba(0, 0, 0, 0.45)');
  contactGrad.addColorStop(0.5, 'rgba(0, 0, 0, 0.25)');
  contactGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = contactGrad;
  ctx.beginPath();
  ctx.ellipse(0, 0, size * 0.95, size * 0.65, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  
  // Soft shadow (medium distance)
  ctx.save();
  ctx.translate(4, 6);
  ctx.filter = 'blur(8px)';
  ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
  ctx.beginPath();
  ctx.ellipse(0, 0, size * 1.15, size * 0.75, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.filter = 'none';
  ctx.restore();
  
  // Ambient shadow (far, very soft)
  ctx.save();
  ctx.translate(6, 10);
  ctx.filter = 'blur(15px)';
  ctx.fillStyle = 'rgba(0, 0, 0, 0.18)';
  ctx.beginPath();
  ctx.ellipse(0, 0, size * 1.35, size * 0.9, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.filter = 'none';
  ctx.restore();
}

function drawEnhancedHull(
  ctx: CanvasRenderingContext2D,
  tank: Tank,
  time: number,
  lightingData: { color: string; intensity: number }
) {
  const { size, color, height } = tank;
  
  // 2.5D side faces with better depth
  const sideDepth = height * 0.7;
  
  // South face (darker, away from light)
  const southGrad = ctx.createLinearGradient(0, size * 0.35, 0, size * 0.35 + sideDepth);
  southGrad.addColorStop(0, darkenColor(color, 55));
  southGrad.addColorStop(0.5, darkenColor(color, 65));
  southGrad.addColorStop(1, darkenColor(color, 75));
  ctx.fillStyle = southGrad;
  ctx.fillRect(-size * 0.52, size * 0.35, size * 1.04, sideDepth);
  
  // Panel lines with depth
  ctx.strokeStyle = 'rgba(0,0,0,0.45)';
  ctx.lineWidth = 1;
  for (let i = 0; i < 5; i++) {
    const y = size * 0.35 + (sideDepth / 5) * i;
    ctx.beginPath();
    ctx.moveTo(-size * 0.52, y);
    ctx.lineTo(size * 0.52, y);
    ctx.stroke();
    
    // Highlight line above
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.beginPath();
    ctx.moveTo(-size * 0.52, y - 1);
    ctx.lineTo(size * 0.52, y - 1);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(0,0,0,0.45)';
  }
  
  // East face
  ctx.fillStyle = darkenColor(color, 50);
  ctx.beginPath();
  ctx.moveTo(size * 0.52, -size * 0.6);
  ctx.lineTo(size * 0.52 + 3, -size * 0.6 + sideDepth * 0.3);
  ctx.lineTo(size * 0.52 + 3, size * 0.35 + sideDepth);
  ctx.lineTo(size * 0.52, size * 0.35);
  ctx.closePath();
  ctx.fill();
  
  // Use enhanced hull shape
  drawEnhancedHullShape(ctx, tank, time, lightingData);
  
  // Surface texture (simulated normal map)
  drawSurfaceTexture(ctx, size, color, time);
  
  // Panel lines
  ctx.strokeStyle = 'rgba(0,0,0,0.28)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(-size * 0.35, -size * 0.5);
  ctx.lineTo(size * 0.35, -size * 0.5);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-size * 0.35, size * 0.1);
  ctx.lineTo(size * 0.35, size * 0.1);
  ctx.stroke();
  
  // Rivets with realistic shading
  drawRealisticRivets(ctx, size, color, lightingData);
  
  // Details (tool boxes, vents, etc.)
  drawHullDetails(ctx, size, color, tank, lightingData);
  
  // Enhanced tracks
  const trackWidth = size * 0.28;
  const trackLength = size * 1.35;
  
  ctx.save();
  ctx.translate(-size * 0.62, 0);
  drawEnhancedTrack(ctx, 0, 0, trackWidth, trackLength, tank.trackOffset, color, height);
  ctx.restore();
  
  ctx.save();
  ctx.translate(size * 0.62, 0);
  drawEnhancedTrack(ctx, 0, 0, trackWidth, trackLength, tank.trackOffset, color, height);
  ctx.restore();
}

function drawEnhancedTurret(
  ctx: CanvasRenderingContext2D,
  tank: Tank,
  time: number,
  lightingData: { color: string; intensity: number }
) {
  const { size, color, height } = tank;
  
  // Turret shadow on hull
  ctx.save();
  ctx.translate(3, 4);
  const turretShadowGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, size * 0.48);
  turretShadowGrad.addColorStop(0, 'rgba(0,0,0,0.38)');
  turretShadowGrad.addColorStop(0.7, 'rgba(0,0,0,0.18)');
  turretShadowGrad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = turretShadowGrad;
  ctx.beginPath();
  ctx.arc(0, 0, size * 0.48, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  
  // Use enhanced barrel
  drawEnhancedBarrel(ctx, tank, time, lightingData);
  
  // Use enhanced turret dome
  drawEnhancedTurretDome(ctx, tank, time, lightingData);
  
  // Commander's hatch
  ctx.beginPath();
  ctx.arc(size * 0.05, size * 0.08, size * 0.12, 0, Math.PI * 2);
  const hatchGrad = ctx.createRadialGradient(
    size * 0.05 - 2, size * 0.08 - 2, 0,
    size * 0.05, size * 0.08, size * 0.12
  );
  hatchGrad.addColorStop(0, lightenColor(color, 12));
  hatchGrad.addColorStop(1, darkenColor(color, 22));
  ctx.fillStyle = hatchGrad;
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.45)';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  
  // Hatch handle
  ctx.fillStyle = '#2a2a2a';
  ctx.fillRect(size * 0.02, size * 0.05, size * 0.06, 2);
  
  // Periscope with glass effect
  ctx.fillStyle = '#1a1a1a';
  ctx.fillRect(-size * 0.15, -size * 0.05, size * 0.08, size * 0.06);
  
  // Glass
  const glassGrad = ctx.createLinearGradient(-size * 0.15, -size * 0.05, -size * 0.07, size * 0.01);
  glassGrad.addColorStop(0, 'rgba(100, 150, 200, 0.35)');
  glassGrad.addColorStop(0.5, 'rgba(150, 200, 255, 0.55)');
  glassGrad.addColorStop(1, 'rgba(100, 150, 200, 0.35)');
  ctx.fillStyle = glassGrad;
  ctx.fillRect(-size * 0.14, -size * 0.04, size * 0.06, size * 0.04);
  
  // Antenna
  ctx.strokeStyle = 'rgba(200,200,200,0.85)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(-size * 0.2, -size * 0.12);
  ctx.lineTo(-size * 0.25, -size * 0.55);
  ctx.stroke();
  
  // Antenna tip with glow
  ctx.beginPath();
  ctx.arc(-size * 0.25, -size * 0.55, 2, 0, Math.PI * 2);
  ctx.fillStyle = tank.isPlayer ? '#60a5fa' : '#f87171';
  ctx.fill();
  
  const antennaGlow = ctx.createRadialGradient(-size * 0.25, -size * 0.55, 0, -size * 0.25, -size * 0.55, 6);
  antennaGlow.addColorStop(0, tank.isPlayer ? 'rgba(96, 165, 250, 0.65)' : 'rgba(248, 113, 113, 0.65)');
  antennaGlow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = antennaGlow;
  ctx.beginPath();
  ctx.arc(-size * 0.25, -size * 0.55, 6, 0, Math.PI * 2);
  ctx.fill();
  
  // Turret rivets
  drawTurretRivets(ctx, size, color, lightingData);
}

function drawSurfaceTexture(ctx: CanvasRenderingContext2D, size: number, color: string, time: number) {
  // Simulated surface imperfections
  ctx.save();
  ctx.globalAlpha = 0.035;
  
  // Scratches
  for (let i = 0; i < 10; i++) {
    const x1 = (Math.sin(i * 2.3) * 0.4) * size;
    const y1 = (Math.cos(i * 1.7) * 0.4) * size;
    const x2 = x1 + (Math.sin(i * 3.1) * 0.2) * size;
    const y2 = y1 + (Math.cos(i * 2.9) * 0.2) * size;
    
    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }
  
  // Dents
  for (let i = 0; i < 4; i++) {
    const x = (Math.sin(i * 4.1) * 0.3) * size;
    const y = (Math.cos(i * 3.3) * 0.3) * size;
    
    const dentGrad = ctx.createRadialGradient(x, y, 0, x, y, 6);
    dentGrad.addColorStop(0, 'rgba(0,0,0,0.35)');
    dentGrad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = dentGrad;
    ctx.beginPath();
    ctx.arc(x, y, 6, 0, Math.PI * 2);
    ctx.fill();
  }
  
  ctx.restore();
}

function drawRealisticRivets(
  ctx: CanvasRenderingContext2D,
  size: number,
  color: string,
  lightingData: { color: string; intensity: number }
) {
  const rivetPositions = [
    [-0.38, -0.48], [0.38, -0.48], [-0.38, 0.48], [0.38, 0.48],
    [-0.45, -0.2], [0.45, -0.2], [-0.45, 0.15], [0.45, 0.15],
    [-0.45, 0.45], [0.45, 0.45], [0, -0.55], [0, 0.5],
    [-0.25, -0.55], [0.25, -0.55], [-0.25, 0.5], [0.25, 0.5]
  ];
  
  rivetPositions.forEach(([rx, ry]) => {
    const rivetX = rx * size;
    const rivetY = ry * size;
    
    // Ambient occlusion around rivet
    const aoGrad = ctx.createRadialGradient(rivetX, rivetY, 1.5, rivetX, rivetY, 4.5);
    aoGrad.addColorStop(0, 'rgba(0,0,0,0.35)');
    aoGrad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = aoGrad;
    ctx.beginPath();
    ctx.arc(rivetX, rivetY, 4.5, 0, Math.PI * 2);
    ctx.fill();
    
    // Rivet body with realistic shading
    const rivetGrad = ctx.createRadialGradient(
      rivetX - 0.8, rivetY - 0.8, 0,
      rivetX, rivetY, 2.5
    );
    rivetGrad.addColorStop(0, lightenColor(color, 75));
    rivetGrad.addColorStop(0.3, lightenColor(color, 45));
    rivetGrad.addColorStop(0.7, darkenColor(color, 12));
    rivetGrad.addColorStop(1, darkenColor(color, 45));
    
    ctx.beginPath();
    ctx.arc(rivetX, rivetY, 2.2, 0, Math.PI * 2);
    ctx.fillStyle = rivetGrad;
    ctx.fill();
    
    // Specular highlight on rivet
    ctx.beginPath();
    ctx.arc(rivetX - 0.6, rivetY - 0.6, 0.8, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255,255,255,${0.65 * lightingData.intensity})`;
    ctx.fill();
  });
}

function drawTurretRivets(
  ctx: CanvasRenderingContext2D,
  size: number,
  color: string,
  lightingData: { color: string; intensity: number }
) {
  const turretRivets = [
    [-0.3, -0.15], [0.3, -0.15], [-0.3, 0.15], [0.3, 0.15],
    [-0.2, -0.3], [0.2, -0.3], [-0.2, 0.3], [0.2, 0.3]
  ];
  
  turretRivets.forEach(([rx, ry]) => {
    const rivetX = rx * size * 0.4;
    const rivetY = ry * size * 0.4;
    
    ctx.beginPath();
    ctx.arc(rivetX + 0.5, rivetY + 0.5, 1.8, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fill();
    
    const rivetGrad = ctx.createRadialGradient(rivetX - 0.5, rivetY - 0.5, 0, rivetX, rivetY, 1.8);
    rivetGrad.addColorStop(0, lightenColor(color, 45));
    rivetGrad.addColorStop(1, darkenColor(color, 28));
    ctx.beginPath();
    ctx.arc(rivetX, rivetY, 1.5, 0, Math.PI * 2);
    ctx.fillStyle = rivetGrad;
    ctx.fill();
  });
}

function drawHullDetails(
  ctx: CanvasRenderingContext2D,
  size: number,
  color: string,
  tank: Tank,
  lightingData: { color: string; intensity: number }
) {
  // Engine deck
  ctx.fillStyle = darkenColor(color, 28);
  ctx.fillRect(-size * 0.35, size * 0.45, size * 0.7, size * 0.1);
  
  // Engine vents with depth
  for (let i = 0; i < 4; i++) {
    const ventX = -size * 0.3 + i * size * 0.15;
    
    // Vent hole (dark)
    ctx.fillStyle = 'rgba(0,0,0,0.75)';
    ctx.fillRect(ventX, size * 0.47, size * 0.1, size * 0.06);
    
    // Vent grill lines
    ctx.strokeStyle = 'rgba(50,50,50,0.85)';
    ctx.lineWidth = 0.5;
    for (let j = 0; j < 3; j++) {
      const lineY = size * 0.47 + (size * 0.06 / 3) * j;
      ctx.beginPath();
      ctx.moveTo(ventX, lineY);
      ctx.lineTo(ventX + size * 0.1, lineY);
      ctx.stroke();
    }
  }
  
  // Tool boxes with realistic shading
  const toolBoxPositions = [[-0.48, -0.1], [0.36, -0.1]];
  toolBoxPositions.forEach(([tx, ty]) => {
    const boxX = tx * size;
    const boxY = ty * size;
    const boxW = size * 0.12;
    const boxH = size * 0.2;
    
    // Box shadow
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.fillRect(boxX + 1, boxY + 1, boxW, boxH);
    
    // Box body
    const boxGrad = ctx.createLinearGradient(boxX, boxY, boxX + boxW, boxY + boxH);
    boxGrad.addColorStop(0, darkenColor(color, 22));
    boxGrad.addColorStop(0.5, darkenColor(color, 32));
    boxGrad.addColorStop(1, darkenColor(color, 42));
    ctx.fillStyle = boxGrad;
    ctx.fillRect(boxX, boxY, boxW, boxH);
    
    // Box edge highlight
    ctx.strokeStyle = `rgba(255,255,255,${0.12 * lightingData.intensity})`;
    ctx.lineWidth = 1;
    ctx.strokeRect(boxX, boxY, boxW, boxH);
    
    // Latch
    ctx.fillStyle = '#3a3a3a';
    ctx.fillRect(boxX + boxW * 0.3, boxY + boxH * 0.4, boxW * 0.4, 2);
  });
  
  // Exhaust pipes with heat glow
  const exhaustPositions = [[-0.4, 0.55], [0.4, 0.55]];
  exhaustPositions.forEach(([ex, ey]) => {
    const exhaustX = ex * size;
    const exhaustY = ey * size;
    
    // Pipe
    ctx.fillStyle = '#1a1a1a';
    ctx.beginPath();
    ctx.arc(exhaustX, exhaustY, 3.5, 0, Math.PI * 2);
    ctx.fill();
    
    // Inner hole
    ctx.fillStyle = '#0a0a0a';
    ctx.beginPath();
    ctx.arc(exhaustX, exhaustY, 2.5, 0, Math.PI * 2);
    ctx.fill();
    
    // Heat glow (if moving)
    if (tank.moving) {
      const heatGrad = ctx.createRadialGradient(exhaustX, exhaustY, 0, exhaustX, exhaustY, 12);
      heatGrad.addColorStop(0, 'rgba(255, 100, 0, 0.45)');
      heatGrad.addColorStop(0.5, 'rgba(255, 50, 0, 0.25)');
      heatGrad.addColorStop(1, 'rgba(255, 0, 0, 0)');
      ctx.fillStyle = heatGrad;
      ctx.beginPath();
      ctx.arc(exhaustX, exhaustY, 12, 0, Math.PI * 2);
      ctx.fill();
    }
  });
}

function drawEnvironmentalEffects(ctx: CanvasRenderingContext2D, tank: Tank, time: number) {
  const { size, moving } = tank;
  
  // Dust clouds when moving
  if (moving && Math.random() > 0.7) {
    const dustX = (Math.random() - 0.5) * size * 1.5;
    const dustY = size * 0.5 + Math.random() * size * 0.3;
    
    const dustGrad = ctx.createRadialGradient(dustX, dustY, 0, dustX, dustY, 10);
    dustGrad.addColorStop(0, 'rgba(120, 100, 70, 0.25)');
    dustGrad.addColorStop(1, 'rgba(120, 100, 70, 0)');
    ctx.fillStyle = dustGrad;
    ctx.beginPath();
    ctx.arc(dustX, dustY, 10, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawRealisticDamage(ctx: CanvasRenderingContext2D, tank: Tank, time: number) {
  const { size, health, maxHealth } = tank;
  const damageLevel = 1 - (health / maxHealth);
  
  // Smoke emission
  if (damageLevel > 0.5 && Math.random() > 0.6) {
    const smokeX = (Math.random() - 0.5) * size * 0.8;
    const smokeY = (Math.random() - 0.5) * size * 0.8;
    
    const smokeGrad = ctx.createRadialGradient(smokeX, smokeY, 0, smokeX, smokeY, 14);
    smokeGrad.addColorStop(0, 'rgba(40, 40, 40, 0.35)');
    smokeGrad.addColorStop(0.5, 'rgba(60, 60, 60, 0.18)');
    smokeGrad.addColorStop(1, 'rgba(80, 80, 80, 0)');
    ctx.fillStyle = smokeGrad;
    ctx.beginPath();
    ctx.arc(smokeX, smokeY, 14, 0, Math.PI * 2);
    ctx.fill();
  }
  
  // Sparks
  if (damageLevel > 0.7 && Math.random() > 0.8) {
    const sparkX = (Math.random() - 0.5) * size;
    const sparkY = (Math.random() - 0.5) * size;
    
    ctx.fillStyle = 'rgba(255, 200, 50, 0.85)';
    ctx.beginPath();
    ctx.arc(sparkX, sparkY, 1.5, 0, Math.PI * 2);
    ctx.fill();
    
    // Spark glow
    const sparkGlow = ctx.createRadialGradient(sparkX, sparkY, 0, sparkX, sparkY, 5);
    sparkGlow.addColorStop(0, 'rgba(255, 200, 50, 0.45)');
    sparkGlow.addColorStop(1, 'rgba(255, 200, 50, 0)');
    ctx.fillStyle = sparkGlow;
    ctx.beginPath();
    ctx.arc(sparkX, sparkY, 5, 0, Math.PI * 2);
    ctx.fill();
  }
  
  // Damage decals (scorch marks, dents)
  ctx.save();
  ctx.globalAlpha = damageLevel * 0.45;
  
  for (let i = 0; i < Math.floor(damageLevel * 6); i++) {
    const decalX = (Math.sin(i * 2.3 + time * 0.001) * 0.5) * size;
    const decalY = (Math.cos(i * 1.7 + time * 0.001) * 0.5) * size;
    const decalSize = 3 + damageLevel * 5;
    
    // Scorch mark
    const scorchGrad = ctx.createRadialGradient(decalX, decalY, 0, decalX, decalY, decalSize);
    scorchGrad.addColorStop(0, 'rgba(20, 15, 10, 0.65)');
    scorchGrad.addColorStop(0.5, 'rgba(30, 25, 15, 0.35)');
    scorchGrad.addColorStop(1, 'rgba(40, 30, 20, 0)');
    ctx.fillStyle = scorchGrad;
    ctx.beginPath();
    ctx.arc(decalX, decalY, decalSize, 0, Math.PI * 2);
    ctx.fill();
  }
  
  ctx.restore();
}

function drawFloatingHealthBar(ctx: CanvasRenderingContext2D, tank: Tank) {
  const { size, health, maxHealth, height } = tank;
  const barWidth = size * 1.6;
  const barHeight = 5;
  const barY = -size - height - 14;
  
  // Bar shadow
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.beginPath();
  ctx.roundRect(-barWidth / 2, barY + 1, barWidth, barHeight, 3);
  ctx.fill();
  
  // Bar background
  ctx.fillStyle = 'rgba(0,0,0,0.92)';
  ctx.beginPath();
  ctx.roundRect(-barWidth / 2 - 1, barY - 1, barWidth + 2, barHeight + 2, 3);
  ctx.fill();
  
  // Bar border
  ctx.strokeStyle = 'rgba(255,255,255,0.35)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(-barWidth / 2 - 1, barY - 1, barWidth + 2, barHeight + 2, 3);
  ctx.stroke();
  
  const hp = health / maxHealth;
  const hpColor = hp > 0.5 ? '#4ade80' : hp > 0.25 ? '#fbbf24' : '#ef4444';
  
  // Health fill with gradient
  const healthGrad = ctx.createLinearGradient(-barWidth / 2, barY, -barWidth / 2, barY + barHeight);
  healthGrad.addColorStop(0, lightenColor(hpColor, 25));
  healthGrad.addColorStop(0.5, hpColor);
  healthGrad.addColorStop(1, darkenColor(hpColor, 25));
  ctx.fillStyle = healthGrad;
  ctx.beginPath();
  ctx.roundRect(-barWidth / 2, barY, barWidth * hp, barHeight, 2);
  ctx.fill();
  
  // Health bar shine
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.beginPath();
  ctx.roundRect(-barWidth / 2, barY, barWidth * hp, barHeight / 2, [2, 2, 0, 0]);
  ctx.fill();
}

function drawPlayerIndicator(ctx: CanvasRenderingContext2D, tank: Tank, time: number) {
  const { size } = tank;
  const pulse = 0.3 + Math.sin(time * 0.004) * 0.1;
  
  // Rotating dashed ring
  ctx.beginPath();
  ctx.arc(0, 0, size * 1.5, 0, Math.PI * 2);
  ctx.strokeStyle = `rgba(96, 165, 250, ${pulse})`;
  ctx.lineWidth = 2;
  ctx.setLineDash([6, 6]);
  ctx.lineDashOffset = time * 0.02;
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.lineDashOffset = 0;
  
  // Corner markers
  const markerSize = 8;
  const markerDist = size * 1.6;
  ctx.strokeStyle = `rgba(96, 165, 250, ${pulse * 1.5})`;
  ctx.lineWidth = 2;
  
  // Top-left
  ctx.beginPath();
  ctx.moveTo(-markerDist, -markerDist + markerSize);
  ctx.lineTo(-markerDist, -markerDist);
  ctx.lineTo(-markerDist + markerSize, -markerDist);
  ctx.stroke();
  
  // Top-right
  ctx.beginPath();
  ctx.moveTo(markerDist - markerSize, -markerDist);
  ctx.lineTo(markerDist, -markerDist);
  ctx.lineTo(markerDist, -markerDist + markerSize);
  ctx.stroke();
  
  // Bottom-left
  ctx.beginPath();
  ctx.moveTo(-markerDist, markerDist - markerSize);
  ctx.lineTo(-markerDist, markerDist);
  ctx.lineTo(-markerDist + markerSize, markerDist);
  ctx.stroke();
  
  // Bottom-right
  ctx.beginPath();
  ctx.moveTo(markerDist - markerSize, markerDist);
  ctx.lineTo(markerDist, markerDist);
  ctx.lineTo(markerDist, markerDist - markerSize);
  ctx.stroke();
}

// Utility functions
// Color utilities imported from ./colors
