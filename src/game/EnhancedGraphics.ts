import { lightenColor, darkenColor } from './colors';
// Enhanced Graphics System - Ultra-detailed rendering
import { Tank, Bullet, Obstacle, Vector2 } from './types';

// ===== ENHANCED TANK RENDERING =====
export function drawDetailedTank(ctx: CanvasRenderingContext2D, tank: Tank, time: number) {
  const { position, angle, turretAngle, size, color, accentColor, health, maxHealth } = tank;
  
  ctx.save();
  ctx.translate(position.x, position.y);
  
  // Dynamic shadow with soft edges
  drawTankShadow(ctx, tank, time);
  
  // Hull (rotates with tank)
  ctx.save();
  ctx.rotate(angle);
  drawDetailedHull(ctx, tank, time);
  ctx.restore();
  
  // Turret (independent rotation)
  ctx.save();
  ctx.rotate(turretAngle);
  drawDetailedTurret(ctx, tank, time);
  ctx.restore();
  
  // Damage effects
  if (health < maxHealth * 0.5) {
    drawDamageEffects(ctx, tank, time);
  }
  
  // Health bar (floating above)
  if (health < maxHealth) {
    drawFloatingHealthBar(ctx, tank);
  }
  
  // Player indicator
  if (tank.isPlayer) {
    drawPlayerIndicator(ctx, tank, time);
  }
  
  ctx.restore();
}

function drawTankShadow(ctx: CanvasRenderingContext2D, tank: Tank, time: number) {
  const { size, height } = tank;
  
  // Multi-layer soft shadow
  for (let i = 3; i >= 0; i--) {
    const offset = 4 + i * 2;
    const alpha = 0.15 - i * 0.03;
    const blur = 8 + i * 4;
    
    ctx.save();
    ctx.translate(offset, offset);
    ctx.filter = `blur(${blur}px)`;
    ctx.fillStyle = `rgba(0, 0, 0, ${alpha})`;
    ctx.beginPath();
    ctx.ellipse(0, 0, size * 1.15, size * 0.75, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

function drawDetailedHull(ctx: CanvasRenderingContext2D, tank: Tank, time: number) {
  const { size, color, accentColor } = tank;
  
  // === TRACKS (detailed individual links) ===
  drawDetailedTracks(ctx, tank, time);
  
  // === HULL BODY ===
  // 2.5D side face (south)
  const sideDepth = tank.height * 0.7;
  const sideGrad = ctx.createLinearGradient(0, size * 0.35, 0, size * 0.35 + sideDepth);
  sideGrad.addColorStop(0, darkenColor(color, 40));
  sideGrad.addColorStop(1, darkenColor(color, 60));
  ctx.fillStyle = sideGrad;
  ctx.fillRect(-size * 0.52, size * 0.35, size * 1.04, sideDepth);
  
  // Side panel lines
  ctx.strokeStyle = 'rgba(0,0,0,0.3)';
  ctx.lineWidth = 1;
  for (let i = 0; i < 5; i++) {
    const y = size * 0.35 + (sideDepth / 5) * i;
    ctx.beginPath();
    ctx.moveTo(-size * 0.52, y);
    ctx.lineTo(size * 0.52, y);
    ctx.stroke();
  }
  
  // 2.5D side face (east)
  ctx.fillStyle = darkenColor(color, 35);
  ctx.beginPath();
  ctx.moveTo(size * 0.52, -size * 0.6);
  ctx.lineTo(size * 0.52 + 3, -size * 0.6 + sideDepth * 0.3);
  ctx.lineTo(size * 0.52 + 3, size * 0.35 + sideDepth);
  ctx.lineTo(size * 0.52, size * 0.35);
  ctx.closePath();
  ctx.fill();
  
  // === HULL TOP ===
  ctx.beginPath();
  ctx.moveTo(-size * 0.42, -size * 0.62);
  ctx.lineTo(size * 0.42, -size * 0.62);
  ctx.quadraticCurveTo(size * 0.52, -size * 0.4, size * 0.52, -size * 0.15);
  ctx.lineTo(size * 0.52, size * 0.35);
  ctx.quadraticCurveTo(size * 0.42, size * 0.58, size * 0.32, size * 0.58);
  ctx.lineTo(-size * 0.32, size * 0.58);
  ctx.quadraticCurveTo(-size * 0.42, size * 0.58, -size * 0.52, size * 0.35);
  ctx.lineTo(-size * 0.52, -size * 0.15);
  ctx.quadraticCurveTo(-size * 0.52, -size * 0.4, -size * 0.42, -size * 0.62);
  ctx.closePath();
  
  // Multi-stop metallic gradient
  const hullGrad = ctx.createLinearGradient(-size * 0.5, -size * 0.6, size * 0.5, size * 0.5);
  hullGrad.addColorStop(0, lightenColor(color, 50));
  hullGrad.addColorStop(0.15, lightenColor(color, 25));
  hullGrad.addColorStop(0.4, color);
  hullGrad.addColorStop(0.7, darkenColor(color, 15));
  hullGrad.addColorStop(1, darkenColor(color, 30));
  ctx.fillStyle = hullGrad;
  ctx.fill();
  
  // Hull panel lines
  ctx.strokeStyle = 'rgba(0,0,0,0.2)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(-size * 0.35, -size * 0.5);
  ctx.lineTo(size * 0.35, -size * 0.5);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-size * 0.35, size * 0.1);
  ctx.lineTo(size * 0.35, size * 0.1);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-size * 0.35, size * 0.4);
  ctx.lineTo(size * 0.35, size * 0.4);
  ctx.stroke();
  
  // Specular highlight (animated)
  const specIntensity = 0.18 + Math.sin(time * 0.003) * 0.04;
  ctx.fillStyle = `rgba(255, 255, 255, ${specIntensity})`;
  ctx.beginPath();
  ctx.moveTo(-size * 0.28, -size * 0.55);
  ctx.lineTo(size * 0.18, -size * 0.55);
  ctx.lineTo(size * 0.12, -size * 0.28);
  ctx.lineTo(-size * 0.22, -size * 0.28);
  ctx.closePath();
  ctx.fill();
  
  // Secondary highlight
  ctx.fillStyle = `rgba(255, 255, 255, ${specIntensity * 0.5})`;
  ctx.beginPath();
  ctx.moveTo(-size * 0.15, size * 0.15);
  ctx.lineTo(size * 0.1, size * 0.15);
  ctx.lineTo(size * 0.08, size * 0.35);
  ctx.lineTo(-size * 0.12, size * 0.35);
  ctx.closePath();
  ctx.fill();
  
  // Hull border
  ctx.strokeStyle = darkenColor(color, 55);
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-size * 0.42, -size * 0.62);
  ctx.lineTo(size * 0.42, -size * 0.62);
  ctx.quadraticCurveTo(size * 0.52, -size * 0.4, size * 0.52, -size * 0.15);
  ctx.lineTo(size * 0.52, size * 0.35);
  ctx.quadraticCurveTo(size * 0.42, size * 0.58, size * 0.32, size * 0.58);
  ctx.lineTo(-size * 0.32, size * 0.58);
  ctx.quadraticCurveTo(-size * 0.42, size * 0.58, -size * 0.52, size * 0.35);
  ctx.lineTo(-size * 0.52, -size * 0.15);
  ctx.quadraticCurveTo(-size * 0.52, -size * 0.4, -size * 0.42, -size * 0.62);
  ctx.stroke();
  
  // === RIVETS (3D effect) ===
  const rivetPositions = [
    [-0.38, -0.48], [0.38, -0.48], [-0.38, 0.48], [0.38, 0.48],
    [-0.45, -0.2], [0.45, -0.2], [-0.45, 0.15], [0.45, 0.15],
    [-0.45, 0.45], [0.45, 0.45], [0, -0.55], [0, 0.5],
    [-0.25, -0.55], [0.25, -0.55], [-0.25, 0.5], [0.25, 0.5]
  ];
  
  rivetPositions.forEach(([rx, ry]) => {
    const rivetX = rx * size;
    const rivetY = ry * size;
    
    // Rivet shadow
    ctx.beginPath();
    ctx.arc(rivetX + 0.8, rivetY + 0.8, 2.5, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.fill();
    
    // Rivet body with gradient
    const rivetGrad = ctx.createRadialGradient(rivetX - 0.8, rivetY - 0.8, 0, rivetX, rivetY, 2.5);
    rivetGrad.addColorStop(0, lightenColor(color, 60));
    rivetGrad.addColorStop(0.5, darkenColor(color, 10));
    rivetGrad.addColorStop(1, darkenColor(color, 35));
    ctx.beginPath();
    ctx.arc(rivetX, rivetY, 2.2, 0, Math.PI * 2);
    ctx.fillStyle = rivetGrad;
    ctx.fill();
    
    // Rivet highlight
    ctx.beginPath();
    ctx.arc(rivetX - 0.6, rivetY - 0.6, 0.8, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.fill();
  });
  
  // === HULL DETAILS ===
  // Engine deck (rear)
  ctx.fillStyle = darkenColor(color, 20);
  ctx.fillRect(-size * 0.35, size * 0.45, size * 0.7, size * 0.1);
  
  // Engine vents
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  for (let i = 0; i < 4; i++) {
    ctx.fillRect(-size * 0.3 + i * size * 0.15, size * 0.47, size * 0.1, size * 0.06);
  }
  
  // Tool boxes
  ctx.fillStyle = darkenColor(color, 30);
  ctx.fillRect(-size * 0.48, -size * 0.1, size * 0.12, size * 0.2);
  ctx.fillRect(size * 0.36, -size * 0.1, size * 0.12, size * 0.2);
  
  // Tool box details
  ctx.strokeStyle = 'rgba(0,0,0,0.3)';
  ctx.lineWidth = 1;
  ctx.strokeRect(-size * 0.48, -size * 0.1, size * 0.12, size * 0.2);
  ctx.strokeRect(size * 0.36, -size * 0.1, size * 0.12, size * 0.2);
  
  // Exhaust pipes
  ctx.fillStyle = '#2a2a2a';
  ctx.beginPath();
  ctx.arc(-size * 0.4, size * 0.55, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(size * 0.4, size * 0.55, 3, 0, Math.PI * 2);
  ctx.fill();
  
  // Exhaust glow (if moving)
  if (tank.moving) {
    const exhaustGlow = ctx.createRadialGradient(-size * 0.4, size * 0.55, 0, -size * 0.4, size * 0.55, 8);
    exhaustGlow.addColorStop(0, 'rgba(255, 100, 0, 0.3)');
    exhaustGlow.addColorStop(1, 'rgba(255, 50, 0, 0)');
    ctx.fillStyle = exhaustGlow;
    ctx.beginPath();
    ctx.arc(-size * 0.4, size * 0.55, 8, 0, Math.PI * 2);
    ctx.fill();
    
    const exhaustGlow2 = ctx.createRadialGradient(size * 0.4, size * 0.55, 0, size * 0.4, size * 0.55, 8);
    exhaustGlow2.addColorStop(0, 'rgba(255, 100, 0, 0.3)');
    exhaustGlow2.addColorStop(1, 'rgba(255, 50, 0, 0)');
    ctx.fillStyle = exhaustGlow2;
    ctx.beginPath();
    ctx.arc(size * 0.4, size * 0.55, 8, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawDetailedTracks(ctx: CanvasRenderingContext2D, tank: Tank, time: number) {
  const { size, trackOffset } = tank;
  const trackWidth = size * 0.28;
  const trackLength = size * 1.35;
  
  // Left track
  ctx.save();
  ctx.translate(-size * 0.62, 0);
  drawSingleTrack(ctx, trackWidth, trackLength, trackOffset, tank.color, tank.height);
  ctx.restore();
  
  // Right track
  ctx.save();
  ctx.translate(size * 0.62, 0);
  drawSingleTrack(ctx, trackWidth, trackLength, trackOffset, tank.color, tank.height);
  ctx.restore();
}

function drawSingleTrack(ctx: CanvasRenderingContext2D, width: number, length: number, offset: number, color: string, height: number) {
  const depth = height * 0.5;
  
  // Track side face (2.5D)
  ctx.fillStyle = '#0a0a0a';
  ctx.fillRect(-width / 2, length / 2, width, depth * 0.6);
  
  // Track top surface
  const trackGrad = ctx.createLinearGradient(-width / 2, 0, width / 2, 0);
  trackGrad.addColorStop(0, '#1a1a1a');
  trackGrad.addColorStop(0.2, '#3a3a3a');
  trackGrad.addColorStop(0.4, '#4a4a4a');
  trackGrad.addColorStop(0.5, '#505050');
  trackGrad.addColorStop(0.6, '#4a4a4a');
  trackGrad.addColorStop(0.8, '#3a3a3a');
  trackGrad.addColorStop(1, '#1a1a1a');
  ctx.fillStyle = trackGrad;
  ctx.beginPath();
  ctx.roundRect(-width / 2, -length / 2, width, length, 4);
  ctx.fill();
  
  // Individual track links
  const linkCount = 18;
  const linkSpacing = length / linkCount;
  
  for (let i = 0; i < linkCount; i++) {
    const linkY = -length / 2 + ((i * linkSpacing + offset * 3) % length);
    
    // Link groove
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.fillRect(-width / 2 + 2, linkY, width - 4, 2);
    
    // Link highlight
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    ctx.fillRect(-width / 2 + 2, linkY + 2, width - 4, 1);
    
    // Link pins
    ctx.fillStyle = '#2a2a2a';
    ctx.beginPath();
    ctx.arc(-width / 2 + 3, linkY + 1, 1.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(width / 2 - 3, linkY + 1, 1.5, 0, Math.PI * 2);
    ctx.fill();
  }
  
  // Track edge highlights
  ctx.strokeStyle = 'rgba(100,100,100,0.3)';
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  ctx.roundRect(-width / 2, -length / 2, width, length, 4);
  ctx.stroke();
  
  // Wheel hubs
  const wheelPositions = [-length / 2 + 10, 0, length / 2 - 10];
  wheelPositions.forEach(wy => {
    // Wheel shadow
    ctx.beginPath();
    ctx.arc(1, wy + 1, width * 0.28, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.fill();
    
    // Wheel body
    const wheelGrad = ctx.createRadialGradient(-1, wy - 1, 0, 0, wy, width * 0.28);
    wheelGrad.addColorStop(0, '#666');
    wheelGrad.addColorStop(0.5, '#444');
    wheelGrad.addColorStop(1, '#222');
    ctx.beginPath();
    ctx.arc(0, wy, width * 0.28, 0, Math.PI * 2);
    ctx.fillStyle = wheelGrad;
    ctx.fill();
    
    // Wheel hub detail
    ctx.beginPath();
    ctx.arc(0, wy, width * 0.15, 0, Math.PI * 2);
    ctx.fillStyle = '#333';
    ctx.fill();
    
    // Hub bolts
    for (let b = 0; b < 5; b++) {
      const boltAngle = (b / 5) * Math.PI * 2;
      const boltX = Math.cos(boltAngle) * width * 0.1;
      const boltY = wy + Math.sin(boltAngle) * width * 0.1;
      ctx.beginPath();
      ctx.arc(boltX, boltY, 1, 0, Math.PI * 2);
      ctx.fillStyle = '#555';
      ctx.fill();
    }
  });
}

function drawDetailedTurret(ctx: CanvasRenderingContext2D, tank: Tank, time: number) {
  const { size, color, accentColor, height } = tank;
  
  // Turret shadow on hull
  ctx.save();
  ctx.translate(3, 4);
  ctx.beginPath();
  ctx.arc(0, 0, size * 0.42, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.fill();
  ctx.restore();
  
  // === GUN BARREL ===
  const barrelLength = size * 1.45;
  const barrelWidth = size * 0.11;
  const barrelDepth = height * 0.35;
  
  // Barrel shadow
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.fillRect(size * 0.3 + 2, barrelWidth + 1, barrelLength - size * 0.3, barrelDepth * 0.4);
  
  // Barrel side (2.5D)
  ctx.fillStyle = '#1a1a1a';
  ctx.fillRect(size * 0.3, barrelWidth, barrelLength - size * 0.3, barrelDepth * 0.4);
  
  // Barrel top (chrome effect)
  const barrelGrad = ctx.createLinearGradient(0, -barrelWidth * 1.2, 0, barrelWidth * 1.2);
  barrelGrad.addColorStop(0, '#3a3a3a');
  barrelGrad.addColorStop(0.15, '#7a7a7a');
  barrelGrad.addColorStop(0.3, '#b0b0b0');
  barrelGrad.addColorStop(0.45, '#d0d0d0');
  barrelGrad.addColorStop(0.5, '#e0e0e0');
  barrelGrad.addColorStop(0.55, '#d0d0d0');
  barrelGrad.addColorStop(0.7, '#a0a0a0');
  barrelGrad.addColorStop(0.85, '#6a6a6a');
  barrelGrad.addColorStop(1, '#2a2a2a');
  
  ctx.fillStyle = barrelGrad;
  ctx.beginPath();
  ctx.roundRect(size * 0.3, -barrelWidth, barrelLength - size * 0.3, barrelWidth * 2, 2);
  ctx.fill();
  
  // Barrel reinforcement rings
  for (let i = 0; i < 4; i++) {
    const ringX = size * 0.45 + i * (barrelLength - size * 0.45) / 4;
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.fillRect(ringX, -barrelWidth * 1.15, 3, barrelWidth * 2.3);
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.fillRect(ringX, -barrelWidth * 1.15, 1, barrelWidth * 2.3);
  }
  
  // Muzzle brake
  const muzzleWidth = barrelWidth * 1.4;
  const muzzleGrad = ctx.createLinearGradient(0, -muzzleWidth, 0, muzzleWidth);
  muzzleGrad.addColorStop(0, '#4a4a4a');
  muzzleGrad.addColorStop(0.3, '#8a8a8a');
  muzzleGrad.addColorStop(0.5, '#aaaaaa');
  muzzleGrad.addColorStop(0.7, '#7a7a7a');
  muzzleGrad.addColorStop(1, '#3a3a3a');
  ctx.fillStyle = muzzleGrad;
  ctx.beginPath();
  ctx.roundRect(barrelLength - 8, -muzzleWidth, 12, muzzleWidth * 2, 2);
  ctx.fill();
  
  // Muzzle brake slots
  ctx.fillStyle = '#1a1a1a';
  for (let i = 0; i < 3; i++) {
    ctx.fillRect(barrelLength - 6, -muzzleWidth * 0.7 + i * muzzleWidth * 0.5, 8, 2);
  }
  
  // Muzzle hole
  ctx.beginPath();
  ctx.arc(barrelLength + 2, 0, barrelWidth * 0.4, 0, Math.PI * 2);
  ctx.fillStyle = '#0a0a0a';
  ctx.fill();
  
  // Barrel shine line
  ctx.strokeStyle = 'rgba(255,255,255,0.3)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(size * 0.35, -barrelWidth * 0.5);
  ctx.lineTo(barrelLength - 10, -barrelWidth * 0.5);
  ctx.stroke();
  
  // === TURRET DOME ===
  ctx.beginPath();
  ctx.arc(0, 0, size * 0.4, 0, Math.PI * 2);
  
  const turretGrad = ctx.createRadialGradient(-size * 0.1, -size * 0.1, 0, 0, 0, size * 0.4);
  turretGrad.addColorStop(0, lightenColor(accentColor, 70));
  turretGrad.addColorStop(0.25, lightenColor(accentColor, 30));
  turretGrad.addColorStop(0.6, color);
  turretGrad.addColorStop(0.85, darkenColor(color, 20));
  turretGrad.addColorStop(1, darkenColor(color, 40));
  ctx.fillStyle = turretGrad;
  ctx.fill();
  
  // Turret ring
  ctx.strokeStyle = darkenColor(color, 55);
  ctx.lineWidth = 2.5;
  ctx.stroke();
  
  // Turret specular highlight
  ctx.beginPath();
  ctx.arc(-size * 0.08, -size * 0.1, size * 0.2, 0, Math.PI * 2);
  const specTurret = ctx.createRadialGradient(
    -size * 0.08, -size * 0.1, 0,
    -size * 0.08, -size * 0.1, size * 0.2
  );
  specTurret.addColorStop(0, `rgba(255,255,255,${0.25 + Math.sin(time * 0.004) * 0.05})`);
  specTurret.addColorStop(0.5, 'rgba(255,255,255,0.08)');
  specTurret.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = specTurret;
  ctx.fill();
  
  // === TURRET DETAILS ===
  // Commander's hatch
  ctx.beginPath();
  ctx.arc(size * 0.05, size * 0.08, size * 0.12, 0, Math.PI * 2);
  ctx.fillStyle = darkenColor(color, 15);
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.3)';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  
  // Hatch handle
  ctx.fillStyle = '#3a3a3a';
  ctx.fillRect(size * 0.02, size * 0.05, size * 0.06, 2);
  
  // Periscope
  ctx.fillStyle = '#2a2a2a';
  ctx.fillRect(-size * 0.15, -size * 0.05, size * 0.08, size * 0.06);
  ctx.fillStyle = '#1a3a5a';
  ctx.fillRect(-size * 0.14, -size * 0.04, size * 0.06, size * 0.04);
  
  // Antenna
  ctx.strokeStyle = 'rgba(200,200,200,0.7)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(-size * 0.2, -size * 0.12);
  ctx.lineTo(-size * 0.25, -size * 0.55);
  ctx.stroke();
  
  // Antenna tip
  ctx.beginPath();
  ctx.arc(-size * 0.25, -size * 0.55, 2, 0, Math.PI * 2);
  ctx.fillStyle = tank.isPlayer ? '#60a5fa' : '#f87171';
  ctx.fill();
  
  // Antenna glow
  const antennaGlow = ctx.createRadialGradient(-size * 0.25, -size * 0.55, 0, -size * 0.25, -size * 0.55, 5);
  antennaGlow.addColorStop(0, tank.isPlayer ? 'rgba(96, 165, 250, 0.5)' : 'rgba(248, 113, 113, 0.5)');
  antennaGlow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = antennaGlow;
  ctx.beginPath();
  ctx.arc(-size * 0.25, -size * 0.55, 5, 0, Math.PI * 2);
  ctx.fill();
  
  // Turret rivets
  const turretRivets = [
    [-0.3, -0.15], [0.3, -0.15], [-0.3, 0.15], [0.3, 0.15],
    [-0.2, -0.3], [0.2, -0.3], [-0.2, 0.3], [0.2, 0.3]
  ];
  
  turretRivets.forEach(([rx, ry]) => {
    const rivetX = rx * size;
    const rivetY = ry * size;
    
    ctx.beginPath();
    ctx.arc(rivetX + 0.5, rivetY + 0.5, 1.8, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fill();
    
    const rivetGrad = ctx.createRadialGradient(rivetX - 0.5, rivetY - 0.5, 0, rivetX, rivetY, 1.8);
    rivetGrad.addColorStop(0, lightenColor(color, 40));
    rivetGrad.addColorStop(1, darkenColor(color, 25));
    ctx.beginPath();
    ctx.arc(rivetX, rivetY, 1.5, 0, Math.PI * 2);
    ctx.fillStyle = rivetGrad;
    ctx.fill();
  });
}

function drawDamageEffects(ctx: CanvasRenderingContext2D, tank: Tank, time: number) {
  const { size, health, maxHealth } = tank;
  const damageLevel = 1 - (health / maxHealth);
  
  // Smoke from damage
  if (Math.random() > 0.7) {
    const smokeX = (Math.random() - 0.5) * size;
    const smokeY = (Math.random() - 0.5) * size;
    // Smoke particles would be added here
  }
  
  // Sparks
  if (damageLevel > 0.7 && Math.random() > 0.8) {
    const sparkX = (Math.random() - 0.5) * size;
    const sparkY = (Math.random() - 0.5) * size;
    // Spark particles would be added here
  }
  
  // Damage decals
  ctx.fillStyle = `rgba(30, 20, 10, ${damageLevel * 0.3})`;
  for (let i = 0; i < 3; i++) {
    const decalX = (Math.sin(i * 2.3) * 0.5) * size;
    const decalY = (Math.cos(i * 1.7) * 0.5) * size;
    ctx.beginPath();
    ctx.arc(decalX, decalY, 3 + damageLevel * 3, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawFloatingHealthBar(ctx: CanvasRenderingContext2D, tank: Tank) {
  const { size, health, maxHealth, height } = tank;
  const barWidth = size * 1.6;
  const barHeight = 5;
  const barY = -size - height - 14;
  
  // Bar background
  ctx.fillStyle = 'rgba(0,0,0,0.85)';
  ctx.beginPath();
  ctx.roundRect(-barWidth / 2 - 1, barY - 1, barWidth + 2, barHeight + 2, 3);
  ctx.fill();
  
  // Bar border
  ctx.strokeStyle = 'rgba(255,255,255,0.2)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(-barWidth / 2 - 1, barY - 1, barWidth + 2, barHeight + 2, 3);
  ctx.stroke();
  
  const hp = health / maxHealth;
  const hpColor = hp > 0.5 ? '#4ade80' : hp > 0.25 ? '#fbbf24' : '#ef4444';
  
  // Health fill with gradient
  const healthGrad = ctx.createLinearGradient(-barWidth / 2, 0, barWidth / 2, 0);
  healthGrad.addColorStop(0, hpColor);
  healthGrad.addColorStop(1, darkenColor(hpColor, 20));
  ctx.fillStyle = healthGrad;
  ctx.beginPath();
  ctx.roundRect(-barWidth / 2, barY, barWidth * hp, barHeight, 2);
  ctx.fill();
  
  // Health bar shine
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  ctx.beginPath();
  ctx.roundRect(-barWidth / 2, barY, barWidth * hp, barHeight / 2, [2, 2, 0, 0]);
  ctx.fill();
}

function drawPlayerIndicator(ctx: CanvasRenderingContext2D, tank: Tank, time: number) {
  const { size } = tank;
  const pulse = 0.25 + Math.sin(time * 0.004) * 0.1;
  
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

// ===== UTILITY FUNCTIONS =====
// Color utilities imported from ./colors
