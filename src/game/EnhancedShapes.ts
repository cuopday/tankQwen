// Enhanced Shape System - Improved visual shaping for all elements
import { Tank, Vector2, Obstacle, Bullet, Explosion } from './types';
import { LightingSystem } from './RealisticGraphics';

// ===== ENHANCED TANK HULL SHAPE =====
export function drawEnhancedHullShape(
  ctx: CanvasRenderingContext2D,
  tank: Tank,
  time: number,
  lighting: { color: string; intensity: number }
) {
  const { size, color } = tank;
  
  // More realistic military tank silhouette with proper proportions
  ctx.beginPath();
  
  // Front slope (glacis plate) - angled for deflection
  ctx.moveTo(-size * 0.38, -size * 0.65);
  ctx.lineTo(size * 0.38, -size * 0.65);
  
  // Upper hull sides
  ctx.lineTo(size * 0.48, -size * 0.55);
  ctx.lineTo(size * 0.52, -size * 0.35);
  
  // Side hull (vertical)
  ctx.lineTo(size * 0.52, size * 0.30);
  
  // Rear slope
  ctx.quadraticCurveTo(size * 0.50, size * 0.45, size * 0.42, size * 0.52);
  ctx.lineTo(-size * 0.42, size * 0.52);
  ctx.quadraticCurveTo(-size * 0.50, size * 0.45, -size * 0.52, size * 0.30);
  
  // Left side (mirror)
  ctx.lineTo(-size * 0.52, -size * 0.35);
  ctx.lineTo(-size * 0.48, -size * 0.55);
  ctx.closePath();
  
  // Enhanced metallic gradient with better color transitions
  const baseColor = blendColors(color, lighting.color, lighting.intensity * 0.25);
  const hullGrad = ctx.createLinearGradient(-size * 0.5, -size * 0.65, size * 0.5, size * 0.5);
  hullGrad.addColorStop(0, lightenColor(baseColor, 65));
  hullGrad.addColorStop(0.12, lightenColor(baseColor, 40));
  hullGrad.addColorStop(0.30, lightenColor(baseColor, 15));
  hullGrad.addColorStop(0.50, baseColor);
  hullGrad.addColorStop(0.70, darkenColor(baseColor, 20));
  hullGrad.addColorStop(0.85, darkenColor(baseColor, 40));
  hullGrad.addColorStop(1, darkenColor(baseColor, 55));
  ctx.fillStyle = hullGrad;
  ctx.fill();
  
  // Enhanced edge highlights for better definition
  ctx.strokeStyle = `rgba(255, 255, 255, ${0.15 * lighting.intensity})`;
  ctx.lineWidth = 1.2;
  ctx.stroke();
  
  // Inner shadow for depth
  ctx.strokeStyle = `rgba(0, 0, 0, ${0.3 * lighting.intensity})`;
  ctx.lineWidth = 0.8;
  ctx.stroke();
}

// ===== ENHANCED TURRET DOME =====
export function drawEnhancedTurretDome(
  ctx: CanvasRenderingContext2D,
  tank: Tank,
  time: number,
  lighting: { color: string; intensity: number }
) {
  const { size, color, accentColor } = tank;
  
  // More realistic turret shape - lower profile, better proportions
  ctx.beginPath();
  ctx.arc(0, 0, size * 0.38, 0, Math.PI * 2);
  
  const baseTurretColor = blendColors(color, lighting.color, lighting.intensity * 0.25);
  
  // Enhanced 7-stop gradient for better metallic look
  const turretGrad = ctx.createRadialGradient(
    -size * 0.12, -size * 0.12, 0,
    0, 0, size * 0.38
  );
  turretGrad.addColorStop(0, lightenColor(baseTurretColor, 85));
  turretGrad.addColorStop(0.15, lightenColor(baseTurretColor, 60));
  turretGrad.addColorStop(0.35, lightenColor(baseTurretColor, 30));
  turretGrad.addColorStop(0.55, baseTurretColor);
  turretGrad.addColorStop(0.75, darkenColor(baseTurretColor, 25));
  turretGrad.addColorStop(0.90, darkenColor(baseTurretColor, 45));
  turretGrad.addColorStop(1, darkenColor(baseTurretColor, 60));
  ctx.fillStyle = turretGrad;
  ctx.fill();
  
  // Enhanced rim for definition
  ctx.strokeStyle = darkenColor(color, 65);
  ctx.lineWidth = 2.5;
  ctx.stroke();
  
  // Inner rim highlight
  ctx.strokeStyle = `rgba(255, 255, 255, ${0.1 * lighting.intensity})`;
  ctx.lineWidth = 1;
  ctx.stroke();
}

// ===== ENHANCED BARREL SHAPE =====
export function drawEnhancedBarrel(
  ctx: CanvasRenderingContext2D,
  tank: Tank,
  time: number,
  lighting: { color: string; intensity: number }
) {
  const { size, height } = tank;
  const barrelLength = size * 1.5;
  const barrelWidth = size * 0.12;
  
  // Better cylindrical barrel with proper shading
  const barrelGrad = ctx.createLinearGradient(0, -barrelWidth * 1.4, 0, barrelWidth * 1.4);
  barrelGrad.addColorStop(0, '#0a0a0a');
  barrelGrad.addColorStop(0.08, '#2a2a2a');
  barrelGrad.addColorStop(0.20, '#5a5a5a');
  barrelGrad.addColorStop(0.35, '#8a8a8a');
  barrelGrad.addColorStop(0.45, '#b0b0b0');
  barrelGrad.addColorStop(0.50, '#c8c8c8');
  barrelGrad.addColorStop(0.55, '#b0b0b0');
  barrelGrad.addColorStop(0.65, '#8a8a8a');
  barrelGrad.addColorStop(0.80, '#5a5a5a');
  barrelGrad.addColorStop(0.92, '#2a2a2a');
  barrelGrad.addColorStop(1, '#0a0a0a');
  
  // Barrel body with rounded ends
  ctx.beginPath();
  ctx.roundRect(size * 0.32, -barrelWidth, barrelLength - size * 0.32, barrelWidth * 2, 3);
  ctx.fillStyle = barrelGrad;
  ctx.fill();
  
  // Barrel edge highlights
  ctx.strokeStyle = `rgba(255, 255, 255, ${0.2 * lighting.intensity})`;
  ctx.lineWidth = 0.8;
  ctx.stroke();
  
  // Muzzle brake with better shape
  const muzzleWidth = barrelWidth * 1.5;
  const muzzleGrad = ctx.createLinearGradient(0, -muzzleWidth, 0, muzzleWidth);
  muzzleGrad.addColorStop(0, '#1a1a1a');
  muzzleGrad.addColorStop(0.15, '#4a4a4a');
  muzzleGrad.addColorStop(0.35, '#7a7a7a');
  muzzleGrad.addColorStop(0.50, '#9a9a9a');
  muzzleGrad.addColorStop(0.65, '#7a7a7a');
  muzzleGrad.addColorStop(0.85, '#4a4a4a');
  muzzleGrad.addColorStop(1, '#1a1a1a');
  
  ctx.beginPath();
  ctx.roundRect(barrelLength - 10, -muzzleWidth, 14, muzzleWidth * 2, 2);
  ctx.fillStyle = muzzleGrad;
  ctx.fill();
  
  // Muzzle brake slots with better depth
  for (let i = 0; i < 4; i++) {
    const slotY = -muzzleWidth * 0.75 + i * (muzzleWidth * 1.5 / 4);
    
    // Slot shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(barrelLength - 8, slotY, 10, 2.5);
    
    // Slot highlight
    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.fillRect(barrelLength - 8, slotY + 2.5, 10, 0.8);
  }
  
  // Muzzle hole with depth
  const muzzleHoleGrad = ctx.createRadialGradient(
    barrelLength + 3, 0, 0,
    barrelLength + 3, 0, barrelWidth * 0.5
  );
  muzzleHoleGrad.addColorStop(0, '#000000');
  muzzleHoleGrad.addColorStop(0.6, '#0a0a0a');
  muzzleHoleGrad.addColorStop(1, '#1a1a1a');
  ctx.fillStyle = muzzleHoleGrad;
  ctx.beginPath();
  ctx.arc(barrelLength + 3, 0, barrelWidth * 0.5, 0, Math.PI * 2);
  ctx.fill();
}

// ===== ENHANCED TRACK SHAPE =====
export function drawEnhancedTrack(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  length: number,
  offset: number,
  color: string,
  height: number
) {
  ctx.save();
  ctx.translate(x, y);
  
  const depth = height * 0.5;
  
  // Track side with better 2.5D perspective
  ctx.fillStyle = '#030303';
  ctx.beginPath();
  ctx.moveTo(-width / 2, length / 2);
  ctx.lineTo(width / 2, length / 2);
  ctx.lineTo(width / 2 + 2, length / 2 + depth * 0.6);
  ctx.lineTo(-width / 2 + 2, length / 2 + depth * 0.6);
  ctx.closePath();
  ctx.fill();
  
  // Track top with enhanced tread pattern
  const trackGrad = ctx.createLinearGradient(-width / 2, 0, width / 2, 0);
  trackGrad.addColorStop(0, '#050505');
  trackGrad.addColorStop(0.12, '#1a1a1a');
  trackGrad.addColorStop(0.30, '#2a2a2a');
  trackGrad.addColorStop(0.45, '#3a3a3a');
  trackGrad.addColorStop(0.50, '#404040');
  trackGrad.addColorStop(0.55, '#3a3a3a');
  trackGrad.addColorStop(0.70, '#2a2a2a');
  trackGrad.addColorStop(0.88, '#1a1a1a');
  trackGrad.addColorStop(1, '#050505');
  
  ctx.fillStyle = trackGrad;
  ctx.beginPath();
  ctx.roundRect(-width / 2, -length / 2, width, length, 5);
  ctx.fill();
  
  // Enhanced track links with better tread pattern
  const linkCount = 20;
  const linkSpacing = length / linkCount;
  
  for (let i = 0; i < linkCount; i++) {
    const linkY = -length / 2 + ((i * linkSpacing + offset * 3) % length);
    
    // Link groove with better depth
    const grooveGrad = ctx.createLinearGradient(0, linkY, 0, linkY + 3);
    grooveGrad.addColorStop(0, 'rgba(20, 15, 10, 0.7)');
    grooveGrad.addColorStop(0.5, 'rgba(30, 25, 20, 0.5)');
    grooveGrad.addColorStop(1, 'rgba(20, 15, 10, 0.7)');
    ctx.fillStyle = grooveGrad;
    ctx.fillRect(-width / 2 + 3, linkY, width - 6, 3);
    
    // Link highlight with better shine
    ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.fillRect(-width / 2 + 3, linkY + 3, width - 6, 1);
    
    // Link pins with better 3D effect
    const pinPositions = [[-width / 2 + 4], [width / 2 - 4]];
    pinPositions.forEach(([pinX]) => {
      // Pin shadow
      ctx.beginPath();
      ctx.arc(pinX + 0.4, linkY + 1.5 + 0.4, 2, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      ctx.fill();
      
      // Pin body with gradient
      const pinGrad = ctx.createRadialGradient(
        pinX - 0.4, linkY + 1.5 - 0.4, 0,
        pinX, linkY + 1.5, 2
      );
      pinGrad.addColorStop(0, '#777');
      pinGrad.addColorStop(0.5, '#555');
      pinGrad.addColorStop(1, '#222');
      ctx.beginPath();
      ctx.arc(pinX, linkY + 1.5, 1.8, 0, Math.PI * 2);
      ctx.fillStyle = pinGrad;
      ctx.fill();
      
      // Pin highlight
      ctx.beginPath();
      ctx.arc(pinX - 0.5, linkY + 1, 0.6, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.fill();
    });
  }
  
  // Track edge with better definition
  ctx.strokeStyle = 'rgba(100, 100, 100, 0.3)';
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.roundRect(-width / 2, -length / 2, width, length, 5);
  ctx.stroke();
  
  // Enhanced wheel hubs
  const wheelPositions = [-length / 2 + 12, 0, length / 2 - 12];
  wheelPositions.forEach(wy => {
    // Wheel shadow
    ctx.beginPath();
    ctx.arc(2, wy + 2, width * 0.32, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fill();
    
    // Wheel body with better gradient
    const wheelGrad = ctx.createRadialGradient(-2, wy - 2, 0, 0, wy, width * 0.32);
    wheelGrad.addColorStop(0, '#888');
    wheelGrad.addColorStop(0.25, '#666');
    wheelGrad.addColorStop(0.60, '#444');
    wheelGrad.addColorStop(0.85, '#222');
    wheelGrad.addColorStop(1, '#111');
    ctx.beginPath();
    ctx.arc(0, wy, width * 0.30, 0, Math.PI * 2);
    ctx.fillStyle = wheelGrad;
    ctx.fill();
    
    // Wheel rim
    ctx.strokeStyle = 'rgba(120, 120, 120, 0.5)';
    ctx.lineWidth = 1.2;
    ctx.stroke();
    
    // Hub cap with better shading
    const hubGrad = ctx.createRadialGradient(-0.8, wy - 0.8, 0, 0, wy, width * 0.16);
    hubGrad.addColorStop(0, '#666');
    hubGrad.addColorStop(0.5, '#444');
    hubGrad.addColorStop(1, '#222');
    ctx.beginPath();
    ctx.arc(0, wy, width * 0.16, 0, Math.PI * 2);
    ctx.fillStyle = hubGrad;
    ctx.fill();
    
    // Hub bolts with better 3D
    for (let b = 0; b < 6; b++) {
      const boltAngle = (b / 6) * Math.PI * 2;
      const boltX = Math.cos(boltAngle) * width * 0.11;
      const boltY = wy + Math.sin(boltAngle) * width * 0.11;
      
      // Bolt shadow
      ctx.beginPath();
      ctx.arc(boltX + 0.3, boltY + 0.3, 1.3, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fill();
      
      // Bolt body
      const boltGrad = ctx.createRadialGradient(boltX - 0.3, boltY - 0.3, 0, boltX, boltY, 1.2);
      boltGrad.addColorStop(0, '#777');
      boltGrad.addColorStop(0.6, '#555');
      boltGrad.addColorStop(1, '#333');
      ctx.beginPath();
      ctx.arc(boltX, boltY, 1.1, 0, Math.PI * 2);
      ctx.fillStyle = boltGrad;
      ctx.fill();
      
      // Bolt highlight
      ctx.beginPath();
      ctx.arc(boltX - 0.4, boltY - 0.4, 0.4, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.fill();
    }
  });
  
  ctx.restore();
}

// ===== ENHANCED EXPLOSION SHAPE =====
export function drawEnhancedExplosion(
  ctx: CanvasRenderingContext2D,
  explosion: Explosion,
  time: number
) {
  const progress = 1 - explosion.lifetime / explosion.maxLifetime;
  const radius = explosion.radius;
  
  ctx.save();
  ctx.translate(explosion.position.x, explosion.position.y);
  
  // Outer shockwave ring with better shape
  ctx.beginPath();
  ctx.arc(0, 0, radius * 1.3, 0, Math.PI * 2);
  const shockGrad = ctx.createRadialGradient(0, 0, radius * 1.1, 0, 0, radius * 1.3);
  shockGrad.addColorStop(0, `rgba(255, 200, 100, ${(1 - progress) * 0.5})`);
  shockGrad.addColorStop(0.5, `rgba(255, 150, 50, ${(1 - progress) * 0.3})`);
  shockGrad.addColorStop(1, 'rgba(255, 100, 0, 0)');
  ctx.fillStyle = shockGrad;
  ctx.fill();
  
  // Main fireball with organic shape
  ctx.beginPath();
  for (let i = 0; i < 32; i++) {
    const angle = (i / 32) * Math.PI * 2;
    const wobble = Math.sin(time * 0.01 + i * 0.5) * radius * 0.1;
    const r = radius * (0.8 + wobble / radius);
    const x = Math.cos(angle) * r;
    const y = Math.sin(angle) * r;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  
  const fireGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, radius);
  fireGrad.addColorStop(0, `rgba(255, 255, 200, ${(1 - progress) * 0.9})`);
  fireGrad.addColorStop(0.2, `rgba(255, 220, 100, ${(1 - progress) * 0.8})`);
  fireGrad.addColorStop(0.4, `rgba(255, 150, 50, ${(1 - progress) * 0.6})`);
  fireGrad.addColorStop(0.7, `rgba(255, 80, 0, ${(1 - progress) * 0.3})`);
  fireGrad.addColorStop(1, 'rgba(200, 0, 0, 0)');
  ctx.fillStyle = fireGrad;
  ctx.fill();
  
  // Inner core with bright center
  ctx.beginPath();
  ctx.arc(0, 0, radius * 0.3, 0, Math.PI * 2);
  const coreGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, radius * 0.3);
  coreGrad.addColorStop(0, `rgba(255, 255, 255, ${(1 - progress) * 1})`);
  coreGrad.addColorStop(0.5, `rgba(255, 255, 200, ${(1 - progress) * 0.8})`);
  coreGrad.addColorStop(1, 'rgba(255, 200, 100, 0)');
  ctx.fillStyle = coreGrad;
  ctx.fill();
  
  // Fire tendrils with organic movement
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2 + time * 0.002;
    const tendrilLength = radius * (0.6 + Math.sin(time * 0.01 + i) * 0.2);
    
    ctx.beginPath();
    ctx.moveTo(0, 0);
    
    const cp1x = Math.cos(angle + 0.3) * tendrilLength * 0.4;
    const cp1y = Math.sin(angle + 0.3) * tendrilLength * 0.4;
    const endX = Math.cos(angle) * tendrilLength;
    const endY = Math.sin(angle) * tendrilLength;
    
    ctx.quadraticCurveTo(cp1x, cp1y, endX, endY);
    
    const tendrilGrad = ctx.createLinearGradient(0, 0, endX, endY);
    tendrilGrad.addColorStop(0, `rgba(255, 200, 100, ${(1 - progress) * 0.6})`);
    tendrilGrad.addColorStop(0.5, `rgba(255, 100, 0, ${(1 - progress) * 0.3})`);
    tendrilGrad.addColorStop(1, 'rgba(200, 0, 0, 0)');
    
    ctx.strokeStyle = tendrilGrad;
    ctx.lineWidth = 3 - progress * 2;
    ctx.stroke();
  }
  
  ctx.restore();
}

// ===== ENHANCED BULLET SHAPE =====
export function drawEnhancedBullet(
  ctx: CanvasRenderingContext2D,
  bullet: Bullet,
  time: number
) {
  const { position, velocity, size } = bullet;
  const angle = Math.atan2(velocity.y, velocity.x);
  const color = '#ffaa00'; // Default bullet color
  
  ctx.save();
  ctx.translate(position.x, position.y);
  ctx.rotate(angle);
  
  // Bullet trail with better fade
  if (bullet.trail.length > 1) {
    for (let i = 1; i < bullet.trail.length; i++) {
      const alpha = (i / bullet.trail.length) * 0.6;
      const width = (i / bullet.trail.length) * size * 1.5;
      
      ctx.beginPath();
      ctx.moveTo(bullet.trail[i - 1].x - position.x, bullet.trail[i - 1].y - position.y);
      ctx.lineTo(bullet.trail[i].x - position.x, bullet.trail[i].y - position.y);
      ctx.strokeStyle = color + Math.floor(alpha * 255).toString(16).padStart(2, '0');
      ctx.lineWidth = width;
      ctx.lineCap = 'round';
      ctx.stroke();
    }
  }
  
  // Bullet body with better shape
  const bulletGrad = ctx.createLinearGradient(0, -size, 0, size);
  bulletGrad.addColorStop(0, '#ffcc00');
  bulletGrad.addColorStop(0.3, '#ffaa00');
  bulletGrad.addColorStop(0.5, '#ff8800');
  bulletGrad.addColorStop(0.7, '#ff6600');
  bulletGrad.addColorStop(1, '#ff4400');
  
  ctx.beginPath();
  ctx.ellipse(0, 0, size * 1.5, size, 0, 0, Math.PI * 2);
  ctx.fillStyle = bulletGrad;
  ctx.fill();
  
  // Bullet glow
  const glowGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, size * 3);
  glowGrad.addColorStop(0, color + 'cc');
  glowGrad.addColorStop(0.5, color + '66');
  glowGrad.addColorStop(1, color + '00');
  ctx.fillStyle = glowGrad;
  ctx.beginPath();
  ctx.arc(0, 0, size * 3, 0, Math.PI * 2);
  ctx.fill();
  
  // Bullet highlight
  ctx.beginPath();
  ctx.ellipse(-size * 0.3, -size * 0.3, size * 0.4, size * 0.3, 0, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
  ctx.fill();
  
  ctx.restore();
}

// ===== ENHANCED PARTICLE SHAPES =====
export function drawEnhancedSmoke(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  opacity: number,
  time: number
) {
  // Organic smoke shape with multiple overlapping circles
  for (let i = 0; i < 5; i++) {
    const offsetX = Math.sin(time * 0.005 + i) * size * 0.2;
    const offsetY = Math.cos(time * 0.005 + i * 1.3) * size * 0.2;
    const particleSize = size * (0.6 + i * 0.1);
    
    const smokeGrad = ctx.createRadialGradient(
      x + offsetX, y + offsetY, 0,
      x + offsetX, y + offsetY, particleSize
    );
    smokeGrad.addColorStop(0, `rgba(80, 80, 80, ${opacity * 0.4})`);
    smokeGrad.addColorStop(0.5, `rgba(60, 60, 60, ${opacity * 0.2})`);
    smokeGrad.addColorStop(1, 'rgba(40, 40, 40, 0)');
    
    ctx.fillStyle = smokeGrad;
    ctx.beginPath();
    ctx.arc(x + offsetX, y + offsetY, particleSize, 0, Math.PI * 2);
    ctx.fill();
  }
}

export function drawEnhancedFire(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  opacity: number,
  time: number
) {
  // Organic fire shape with flickering
  const flicker = Math.sin(time * 0.02) * 0.2 + 0.8;
  
  for (let i = 0; i < 4; i++) {
    const angle = (i / 4) * Math.PI * 2 + time * 0.01;
    const offsetX = Math.cos(angle) * size * 0.3;
    const offsetY = Math.sin(angle) * size * 0.3;
    const flameSize = size * (0.5 + i * 0.15) * flicker;
    
    const fireGrad = ctx.createRadialGradient(
      x + offsetX, y + offsetY, 0,
      x + offsetX, y + offsetY, flameSize
    );
    fireGrad.addColorStop(0, `rgba(255, 255, 100, ${opacity * 0.8})`);
    fireGrad.addColorStop(0.3, `rgba(255, 150, 0, ${opacity * 0.6})`);
    fireGrad.addColorStop(0.6, `rgba(255, 80, 0, ${opacity * 0.3})`);
    fireGrad.addColorStop(1, 'rgba(200, 0, 0, 0)');
    
    ctx.fillStyle = fireGrad;
    ctx.beginPath();
    ctx.arc(x + offsetX, y + offsetY, flameSize, 0, Math.PI * 2);
    ctx.fill();
  }
}

// ===== UTILITY FUNCTIONS =====
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

function blendColors(color1: string, color2: string, blend: number): string {
  const hex1 = color1.replace('#', '');
  const hex2 = color2.replace('#', '');
  
  const r1 = parseInt(hex1.slice(0, 2), 16);
  const g1 = parseInt(hex1.slice(2, 4), 16);
  const b1 = parseInt(hex1.slice(4, 6), 16);
  
  const r2 = parseInt(hex2.slice(0, 2), 16);
  const g2 = parseInt(hex2.slice(2, 4), 16);
  const b2 = parseInt(hex2.slice(4, 6), 16);
  
  const r = Math.round(r1 + (r2 - r1) * blend);
  const g = Math.round(g1 + (g2 - g1) * blend);
  const b = Math.round(b1 + (b2 - b1) * blend);
  
  return `rgb(${r},${g},${b})`;
}
