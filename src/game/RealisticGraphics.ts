// Realistic Graphics System - PBR-inspired rendering
import { Tank, Vector2 } from './types';

// ===== LIGHTING SYSTEM =====
export interface LightSource {
  position: Vector2;
  color: string;
  intensity: number;
  radius: number;
  type: 'point' | 'directional' | 'ambient';
}

export class LightingSystem {
  private lights: LightSource[] = [];
  private ambientLight: number = 0.3;
  private timeOfDay: number = 0.5; // 0 = night, 0.5 = day, 1 = night

  constructor() {
    this.initializeDefaultLights();
  }

  private initializeDefaultLights() {
    // Ambient light
    this.lights.push({
      position: { x: 0, y: 0 },
      color: '#ffffff',
      intensity: this.ambientLight,
      radius: Infinity,
      type: 'ambient'
    });
  }

  addLight(position: Vector2, color: string, intensity: number, radius: number) {
    this.lights.push({
      position,
      color,
      intensity,
      radius,
      type: 'point'
    });
  }

  clearDynamicLights() {
    this.lights = this.lights.filter(l => l.type === 'ambient');
  }

  calculateLightAt(position: Vector2): { color: string; intensity: number } {
    let totalR = 0, totalG = 0, totalB = 0;
    let totalIntensity = 0;

    for (const light of this.lights) {
      if (light.type === 'ambient') {
        totalIntensity += light.intensity;
        const rgb = this.hexToRgb(light.color);
        totalR += rgb.r * light.intensity;
        totalG += rgb.g * light.intensity;
        totalB += rgb.b * light.intensity;
      } else {
        const dx = position.x - light.position.x;
        const dy = position.y - light.position.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < light.radius) {
          const falloff = 1 - (dist / light.radius);
          const intensity = light.intensity * falloff * falloff; // Quadratic falloff
          
          const rgb = this.hexToRgb(light.color);
          totalR += rgb.r * intensity;
          totalG += rgb.g * intensity;
          totalB += rgb.b * intensity;
          totalIntensity += intensity;
        }
      }
    }

    // Normalize
    if (totalIntensity > 0) {
      totalR = Math.min(255, totalR / totalIntensity);
      totalG = Math.min(255, totalG / totalIntensity);
      totalB = Math.min(255, totalB / totalIntensity);
    }

    return {
      color: `rgb(${Math.floor(totalR)}, ${Math.floor(totalG)}, ${Math.floor(totalB)})`,
      intensity: Math.min(1, totalIntensity)
    };
  }

  private hexToRgb(hex: string): { r: number; g: number; b: number } {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 255, g: 255, b: 255 };
  }

  setTimeOfDay(time: number) {
    this.timeOfDay = time;
    // Adjust ambient based on time
    const ambientLight = this.lights.find(l => l.type === 'ambient');
    if (ambientLight) {
      // Day: bright, Night: dim
      const dayBrightness = Math.sin(time * Math.PI); // 0 at night, 1 at noon
      ambientLight.intensity = 0.2 + dayBrightness * 0.4;
      
      // Color temperature
      if (dayBrightness > 0.7) {
        ambientLight.color = '#fffaf0'; // Warm daylight
      } else if (dayBrightness > 0.3) {
        ambientLight.color = '#ffd4a3'; // Golden hour
      } else {
        ambientLight.color = '#4a5578'; // Night blue
      }
    }
  }
}

// ===== REALISTIC TANK RENDERING =====
export function drawRealisticTank(
  ctx: CanvasRenderingContext2D, 
  tank: Tank, 
  time: number,
  lighting: LightingSystem
) {
  const { position, angle, turretAngle, size, color, accentColor, health, maxHealth } = tank;
  
  ctx.save();
  ctx.translate(position.x, position.y);
  
  // Calculate lighting at tank position
  const lightingData = lighting.calculateLightAt(position);
  
  // Multi-layer realistic shadow
  drawRealisticShadow(ctx, tank, time);
  
  // Hull with PBR-inspired shading
  ctx.save();
  ctx.rotate(angle);
  drawPBRHull(ctx, tank, time, lightingData);
  ctx.restore();
  
  // Turret
  ctx.save();
  ctx.rotate(turretAngle);
  drawPBRTurret(ctx, tank, time, lightingData);
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
  const contactGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, size * 0.9);
  contactGrad.addColorStop(0, 'rgba(0, 0, 0, 0.4)');
  contactGrad.addColorStop(0.5, 'rgba(0, 0, 0, 0.2)');
  contactGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = contactGrad;
  ctx.beginPath();
  ctx.ellipse(0, 0, size * 0.9, size * 0.6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  
  // Soft shadow (medium distance)
  ctx.save();
  ctx.translate(4, 6);
  ctx.filter = 'blur(8px)';
  ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
  ctx.beginPath();
  ctx.ellipse(0, 0, size * 1.1, size * 0.7, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.filter = 'none';
  ctx.restore();
  
  // Ambient shadow (far, very soft)
  ctx.save();
  ctx.translate(6, 10);
  ctx.filter = 'blur(15px)';
  ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
  ctx.beginPath();
  ctx.ellipse(0, 0, size * 1.3, size * 0.85, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.filter = 'none';
  ctx.restore();
}

function drawPBRHull(
  ctx: CanvasRenderingContext2D, 
  tank: Tank, 
  time: number,
  lighting: { color: string; intensity: number }
) {
  const { size, color, accentColor } = tank;
  
  // Tracks with realistic wear
  drawRealisticTracks(ctx, tank, time);
  
  // 2.5D side faces with proper shading
  const sideDepth = tank.height * 0.7;
  
  // South face (darker, away from light)
  const southGrad = ctx.createLinearGradient(0, size * 0.35, 0, size * 0.35 + sideDepth);
  southGrad.addColorStop(0, darkenColor(color, 50));
  southGrad.addColorStop(0.5, darkenColor(color, 60));
  southGrad.addColorStop(1, darkenColor(color, 70));
  ctx.fillStyle = southGrad;
  ctx.fillRect(-size * 0.52, size * 0.35, size * 1.04, sideDepth);
  
  // Panel lines with depth
  ctx.strokeStyle = 'rgba(0,0,0,0.4)';
  ctx.lineWidth = 1;
  for (let i = 0; i < 5; i++) {
    const y = size * 0.35 + (sideDepth / 5) * i;
    ctx.beginPath();
    ctx.moveTo(-size * 0.52, y);
    ctx.lineTo(size * 0.52, y);
    ctx.stroke();
    
    // Highlight line above
    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.beginPath();
    ctx.moveTo(-size * 0.52, y - 1);
    ctx.lineTo(size * 0.52, y - 1);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(0,0,0,0.4)';
  }
  
  // East face
  ctx.fillStyle = darkenColor(color, 45);
  ctx.beginPath();
  ctx.moveTo(size * 0.52, -size * 0.6);
  ctx.lineTo(size * 0.52 + 3, -size * 0.6 + sideDepth * 0.3);
  ctx.lineTo(size * 0.52 + 3, size * 0.35 + sideDepth);
  ctx.lineTo(size * 0.52, size * 0.35);
  ctx.closePath();
  ctx.fill();
  
  // === HULL TOP with PBR shading ===
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
  
  // Base color with lighting influence
  const baseColor = blendColors(color, lighting.color, lighting.intensity * 0.3);
  
  // Multi-stop metallic gradient (PBR-inspired)
  const hullGrad = ctx.createLinearGradient(-size * 0.5, -size * 0.6, size * 0.5, size * 0.5);
  hullGrad.addColorStop(0, lightenColor(baseColor, 60)); // Highlight
  hullGrad.addColorStop(0.15, lightenColor(baseColor, 35)); // Specular
  hullGrad.addColorStop(0.35, baseColor); // Base
  hullGrad.addColorStop(0.6, darkenColor(baseColor, 15)); // Shadow
  hullGrad.addColorStop(0.85, darkenColor(baseColor, 35)); // Deep shadow
  hullGrad.addColorStop(1, darkenColor(baseColor, 50)); // Ambient occlusion
  ctx.fillStyle = hullGrad;
  ctx.fill();
  
  // Surface texture (simulated normal map)
  drawSurfaceTexture(ctx, size, color, time);
  
  // Specular highlight (Fresnel effect)
  const specIntensity = 0.2 + Math.sin(time * 0.003) * 0.05;
  ctx.fillStyle = `rgba(255, 255, 255, ${specIntensity * lighting.intensity})`;
  ctx.beginPath();
  ctx.moveTo(-size * 0.28, -size * 0.55);
  ctx.lineTo(size * 0.18, -size * 0.55);
  ctx.lineTo(size * 0.12, -size * 0.28);
  ctx.lineTo(-size * 0.22, -size * 0.28);
  ctx.closePath();
  ctx.fill();
  
  // Secondary specular
  ctx.fillStyle = `rgba(255, 255, 255, ${specIntensity * 0.4 * lighting.intensity})`;
  ctx.beginPath();
  ctx.moveTo(-size * 0.15, size * 0.15);
  ctx.lineTo(size * 0.1, size * 0.15);
  ctx.lineTo(size * 0.08, size * 0.35);
  ctx.lineTo(-size * 0.12, size * 0.35);
  ctx.closePath();
  ctx.fill();
  
  // Edge highlights (rim lighting)
  ctx.strokeStyle = `rgba(255, 255, 255, ${0.1 * lighting.intensity})`;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(-size * 0.42, -size * 0.62);
  ctx.lineTo(size * 0.42, -size * 0.62);
  ctx.stroke();
  
  // Panel lines
  ctx.strokeStyle = 'rgba(0,0,0,0.25)';
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
  drawRealisticRivets(ctx, size, color, lighting);
  
  // Details (tool boxes, vents, etc.)
  drawHullDetails(ctx, size, color, tank, lighting);
}

function drawSurfaceTexture(ctx: CanvasRenderingContext2D, size: number, color: string, time: number) {
  // Simulated surface imperfections
  ctx.save();
  ctx.globalAlpha = 0.03;
  
  // Scratches
  for (let i = 0; i < 8; i++) {
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
  for (let i = 0; i < 3; i++) {
    const x = (Math.sin(i * 4.1) * 0.3) * size;
    const y = (Math.cos(i * 3.3) * 0.3) * size;
    
    const dentGrad = ctx.createRadialGradient(x, y, 0, x, y, 5);
    dentGrad.addColorStop(0, 'rgba(0,0,0,0.3)');
    dentGrad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = dentGrad;
    ctx.beginPath();
    ctx.arc(x, y, 5, 0, Math.PI * 2);
    ctx.fill();
  }
  
  ctx.restore();
}

function drawRealisticRivets(
  ctx: CanvasRenderingContext2D, 
  size: number, 
  color: string,
  lighting: { color: string; intensity: number }
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
    const aoGrad = ctx.createRadialGradient(rivetX, rivetY, 1.5, rivetX, rivetY, 4);
    aoGrad.addColorStop(0, 'rgba(0,0,0,0.3)');
    aoGrad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = aoGrad;
    ctx.beginPath();
    ctx.arc(rivetX, rivetY, 4, 0, Math.PI * 2);
    ctx.fill();
    
    // Rivet body with realistic shading
    const rivetGrad = ctx.createRadialGradient(
      rivetX - 0.8, rivetY - 0.8, 0,
      rivetX, rivetY, 2.5
    );
    rivetGrad.addColorStop(0, lightenColor(color, 70));
    rivetGrad.addColorStop(0.3, lightenColor(color, 40));
    rivetGrad.addColorStop(0.7, darkenColor(color, 10));
    rivetGrad.addColorStop(1, darkenColor(color, 40));
    
    ctx.beginPath();
    ctx.arc(rivetX, rivetY, 2.2, 0, Math.PI * 2);
    ctx.fillStyle = rivetGrad;
    ctx.fill();
    
    // Specular highlight on rivet
    ctx.beginPath();
    ctx.arc(rivetX - 0.6, rivetY - 0.6, 0.8, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255,255,255,${0.6 * lighting.intensity})`;
    ctx.fill();
  });
}

function drawHullDetails(
  ctx: CanvasRenderingContext2D, 
  size: number, 
  color: string,
  tank: Tank,
  lighting: { color: string; intensity: number }
) {
  // Engine deck
  ctx.fillStyle = darkenColor(color, 25);
  ctx.fillRect(-size * 0.35, size * 0.45, size * 0.7, size * 0.1);
  
  // Engine vents with depth
  for (let i = 0; i < 4; i++) {
    const ventX = -size * 0.3 + i * size * 0.15;
    
    // Vent hole (dark)
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(ventX, size * 0.47, size * 0.1, size * 0.06);
    
    // Vent grill lines
    ctx.strokeStyle = 'rgba(50,50,50,0.8)';
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
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fillRect(boxX + 1, boxY + 1, boxW, boxH);
    
    // Box body
    const boxGrad = ctx.createLinearGradient(boxX, boxY, boxX + boxW, boxY + boxH);
    boxGrad.addColorStop(0, darkenColor(color, 20));
    boxGrad.addColorStop(0.5, darkenColor(color, 30));
    boxGrad.addColorStop(1, darkenColor(color, 40));
    ctx.fillStyle = boxGrad;
    ctx.fillRect(boxX, boxY, boxW, boxH);
    
    // Box edge highlight
    ctx.strokeStyle = `rgba(255,255,255,${0.1 * lighting.intensity})`;
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
      const heatGrad = ctx.createRadialGradient(exhaustX, exhaustY, 0, exhaustX, exhaustY, 10);
      heatGrad.addColorStop(0, 'rgba(255, 100, 0, 0.4)');
      heatGrad.addColorStop(0.5, 'rgba(255, 50, 0, 0.2)');
      heatGrad.addColorStop(1, 'rgba(255, 0, 0, 0)');
      ctx.fillStyle = heatGrad;
      ctx.beginPath();
      ctx.arc(exhaustX, exhaustY, 10, 0, Math.PI * 2);
      ctx.fill();
    }
  });
}

function drawRealisticTracks(ctx: CanvasRenderingContext2D, tank: Tank, time: number) {
  const { size, trackOffset, color } = tank;
  const trackWidth = size * 0.28;
  const trackLength = size * 1.35;
  
  // Left track
  ctx.save();
  ctx.translate(-size * 0.62, 0);
  drawSingleRealisticTrack(ctx, trackWidth, trackLength, trackOffset, color, tank.height);
  ctx.restore();
  
  // Right track
  ctx.save();
  ctx.translate(size * 0.62, 0);
  drawSingleRealisticTrack(ctx, trackWidth, trackLength, trackOffset, color, tank.height);
  ctx.restore();
}

function drawSingleRealisticTrack(
  ctx: CanvasRenderingContext2D, 
  width: number, 
  length: number, 
  offset: number, 
  color: string, 
  height: number
) {
  const depth = height * 0.5;
  
  // Track side face
  ctx.fillStyle = '#050505';
  ctx.fillRect(-width / 2, length / 2, width, depth * 0.6);
  
  // Track top with realistic material
  const trackGrad = ctx.createLinearGradient(-width / 2, 0, width / 2, 0);
  trackGrad.addColorStop(0, '#0a0a0a');
  trackGrad.addColorStop(0.15, '#2a2a2a');
  trackGrad.addColorStop(0.35, '#3a3a3a');
  trackGrad.addColorStop(0.5, '#454545');
  trackGrad.addColorStop(0.65, '#3a3a3a');
  trackGrad.addColorStop(0.85, '#2a2a2a');
  trackGrad.addColorStop(1, '#0a0a0a');
  ctx.fillStyle = trackGrad;
  ctx.beginPath();
  ctx.roundRect(-width / 2, -length / 2, width, length, 4);
  ctx.fill();
  
  // Individual track links with wear
  const linkCount = 18;
  const linkSpacing = length / linkCount;
  
  for (let i = 0; i < linkCount; i++) {
    const linkY = -length / 2 + ((i * linkSpacing + offset * 3) % length);
    
    // Link groove (dirt accumulation)
    ctx.fillStyle = 'rgba(30, 25, 20, 0.6)';
    ctx.fillRect(-width / 2 + 2, linkY, width - 4, 2);
    
    // Link highlight (metal shine)
    ctx.fillStyle = 'rgba(255,255,255,0.1)';
    ctx.fillRect(-width / 2 + 2, linkY + 2, width - 4, 1);
    
    // Link pins with realistic shading
    const pinPositions = [[-width / 2 + 3], [width / 2 - 3]];
    pinPositions.forEach(([pinX]) => {
      // Pin shadow
      ctx.beginPath();
      ctx.arc(pinX + 0.3, linkY + 1.3, 1.8, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fill();
      
      // Pin body
      const pinGrad = ctx.createRadialGradient(pinX - 0.3, linkY + 0.7, 0, pinX, linkY + 1, 1.8);
      pinGrad.addColorStop(0, '#666');
      pinGrad.addColorStop(0.5, '#444');
      pinGrad.addColorStop(1, '#222');
      ctx.beginPath();
      ctx.arc(pinX, linkY + 1, 1.5, 0, Math.PI * 2);
      ctx.fillStyle = pinGrad;
      ctx.fill();
    });
  }
  
  // Track edge wear
  ctx.strokeStyle = 'rgba(80,80,80,0.3)';
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  ctx.roundRect(-width / 2, -length / 2, width, length, 4);
  ctx.stroke();
  
  // Wheel hubs with realistic detail
  const wheelPositions = [-length / 2 + 10, 0, length / 2 - 10];
  wheelPositions.forEach(wy => {
    // Wheel shadow
    ctx.beginPath();
    ctx.arc(1.5, wy + 1.5, width * 0.3, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fill();
    
    // Wheel body with metallic shading
    const wheelGrad = ctx.createRadialGradient(-1.5, wy - 1.5, 0, 0, wy, width * 0.3);
    wheelGrad.addColorStop(0, '#777');
    wheelGrad.addColorStop(0.3, '#555');
    wheelGrad.addColorStop(0.7, '#333');
    wheelGrad.addColorStop(1, '#111');
    ctx.beginPath();
    ctx.arc(0, wy, width * 0.28, 0, Math.PI * 2);
    ctx.fillStyle = wheelGrad;
    ctx.fill();
    
    // Wheel rim
    ctx.strokeStyle = 'rgba(100,100,100,0.5)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(0, wy, width * 0.28, 0, Math.PI * 2);
    ctx.stroke();
    
    // Hub cap
    const hubGrad = ctx.createRadialGradient(-0.5, wy - 0.5, 0, 0, wy, width * 0.15);
    hubGrad.addColorStop(0, '#555');
    hubGrad.addColorStop(1, '#222');
    ctx.beginPath();
    ctx.arc(0, wy, width * 0.15, 0, Math.PI * 2);
    ctx.fillStyle = hubGrad;
    ctx.fill();
    
    // Hub bolts with realistic shading
    for (let b = 0; b < 5; b++) {
      const boltAngle = (b / 5) * Math.PI * 2;
      const boltX = Math.cos(boltAngle) * width * 0.1;
      const boltY = wy + Math.sin(boltAngle) * width * 0.1;
      
      // Bolt shadow
      ctx.beginPath();
      ctx.arc(boltX + 0.2, boltY + 0.2, 1.2, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0,0,0,0.4)';
      ctx.fill();
      
      // Bolt body
      const boltGrad = ctx.createRadialGradient(boltX - 0.2, boltY - 0.2, 0, boltX, boltY, 1);
      boltGrad.addColorStop(0, '#666');
      boltGrad.addColorStop(1, '#333');
      ctx.beginPath();
      ctx.arc(boltX, boltY, 1, 0, Math.PI * 2);
      ctx.fillStyle = boltGrad;
      ctx.fill();
    }
  });
}

function drawPBRTurret(
  ctx: CanvasRenderingContext2D, 
  tank: Tank, 
  time: number,
  lighting: { color: string; intensity: number }
) {
  const { size, color, accentColor, height } = tank;
  
  // Turret shadow on hull
  ctx.save();
  ctx.translate(3, 4);
  const turretShadowGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, size * 0.45);
  turretShadowGrad.addColorStop(0, 'rgba(0,0,0,0.35)');
  turretShadowGrad.addColorStop(0.7, 'rgba(0,0,0,0.15)');
  turretShadowGrad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = turretShadowGrad;
  ctx.beginPath();
  ctx.arc(0, 0, size * 0.45, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  
  // Gun barrel with realistic materials
  const barrelLength = size * 1.45;
  const barrelWidth = size * 0.11;
  const barrelDepth = height * 0.35;
  
  // Barrel shadow
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.fillRect(size * 0.3 + 2, barrelWidth + 1.5, barrelLength - size * 0.3, barrelDepth * 0.4);
  
  // Barrel side
  ctx.fillStyle = '#0a0a0a';
  ctx.fillRect(size * 0.3, barrelWidth, barrelLength - size * 0.3, barrelDepth * 0.4);
  
  // Barrel top with chrome effect (9-stop gradient for realism)
  const barrelGrad = ctx.createLinearGradient(0, -barrelWidth * 1.3, 0, barrelWidth * 1.3);
  barrelGrad.addColorStop(0, '#1a1a1a');
  barrelGrad.addColorStop(0.1, '#4a4a4a');
  barrelGrad.addColorStop(0.25, '#8a8a8a');
  barrelGrad.addColorStop(0.4, '#b8b8b8');
  barrelGrad.addColorStop(0.5, '#d0d0d0');
  barrelGrad.addColorStop(0.6, '#b8b8b8');
  barrelGrad.addColorStop(0.75, '#8a8a8a');
  barrelGrad.addColorStop(0.9, '#4a4a4a');
  barrelGrad.addColorStop(1, '#1a1a1a');
  
  ctx.fillStyle = barrelGrad;
  ctx.beginPath();
  ctx.roundRect(size * 0.3, -barrelWidth, barrelLength - size * 0.3, barrelWidth * 2, 2);
  ctx.fill();
  
  // Barrel reinforcement rings
  for (let i = 0; i < 4; i++) {
    const ringX = size * 0.45 + i * (barrelLength - size * 0.45) / 4;
    
    // Ring shadow
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fillRect(ringX + 0.5, -barrelWidth * 1.15, 3, barrelWidth * 2.3);
    
    // Ring body
    const ringGrad = ctx.createLinearGradient(ringX, -barrelWidth * 1.15, ringX + 3, barrelWidth * 1.15);
    ringGrad.addColorStop(0, '#3a3a3a');
    ringGrad.addColorStop(0.5, '#5a5a5a');
    ringGrad.addColorStop(1, '#2a2a2a');
    ctx.fillStyle = ringGrad;
    ctx.fillRect(ringX, -barrelWidth * 1.15, 3, barrelWidth * 2.3);
  }
  
  // Muzzle brake
  const muzzleWidth = barrelWidth * 1.4;
  const muzzleGrad = ctx.createLinearGradient(0, -muzzleWidth, 0, muzzleWidth);
  muzzleGrad.addColorStop(0, '#2a2a2a');
  muzzleGrad.addColorStop(0.2, '#5a5a5a');
  muzzleGrad.addColorStop(0.4, '#8a8a8a');
  muzzleGrad.addColorStop(0.5, '#9a9a9a');
  muzzleGrad.addColorStop(0.6, '#8a8a8a');
  muzzleGrad.addColorStop(0.8, '#5a5a5a');
  muzzleGrad.addColorStop(1, '#2a2a2a');
  ctx.fillStyle = muzzleGrad;
  ctx.beginPath();
  ctx.roundRect(barrelLength - 8, -muzzleWidth, 12, muzzleWidth * 2, 2);
  ctx.fill();
  
  // Muzzle brake slots with depth
  for (let i = 0; i < 3; i++) {
    const slotY = -muzzleWidth * 0.7 + i * muzzleWidth * 0.5;
    
    // Slot shadow
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(barrelLength - 6, slotY, 8, 2);
    
    // Slot highlight
    ctx.fillStyle = 'rgba(255,255,255,0.1)';
    ctx.fillRect(barrelLength - 6, slotY + 2, 8, 0.5);
  }
  
  // Muzzle hole with depth
  const muzzleHoleGrad = ctx.createRadialGradient(barrelLength + 2, 0, 0, barrelLength + 2, 0, barrelWidth * 0.4);
  muzzleHoleGrad.addColorStop(0, '#000000');
  muzzleHoleGrad.addColorStop(0.7, '#0a0a0a');
  muzzleHoleGrad.addColorStop(1, '#1a1a1a');
  ctx.fillStyle = muzzleHoleGrad;
  ctx.beginPath();
  ctx.arc(barrelLength + 2, 0, barrelWidth * 0.4, 0, Math.PI * 2);
  ctx.fill();
  
  // Barrel shine line
  ctx.strokeStyle = `rgba(255,255,255,${0.35 * lighting.intensity})`;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(size * 0.35, -barrelWidth * 0.5);
  ctx.lineTo(barrelLength - 10, -barrelWidth * 0.5);
  ctx.stroke();
  
  // === TURRET DOME with PBR shading ===
  ctx.beginPath();
  ctx.arc(0, 0, size * 0.4, 0, Math.PI * 2);
  
  const baseTurretColor = blendColors(color, lighting.color, lighting.intensity * 0.3);
  
  const turretGrad = ctx.createRadialGradient(-size * 0.1, -size * 0.1, 0, 0, 0, size * 0.4);
  turretGrad.addColorStop(0, lightenColor(baseTurretColor, 80)); // Specular
  turretGrad.addColorStop(0.2, lightenColor(baseTurretColor, 50)); // Highlight
  turretGrad.addColorStop(0.45, lightenColor(baseTurretColor, 20)); // Mid-tone
  turretGrad.addColorStop(0.7, baseTurretColor); // Base
  turretGrad.addColorStop(0.9, darkenColor(baseTurretColor, 25)); // Shadow
  turretGrad.addColorStop(1, darkenColor(baseTurretColor, 45)); // Ambient occlusion
  ctx.fillStyle = turretGrad;
  ctx.fill();
  
  // Turret ring
  ctx.strokeStyle = darkenColor(color, 60);
  ctx.lineWidth = 2.5;
  ctx.stroke();
  
  // Specular highlight on turret
  ctx.beginPath();
  ctx.arc(-size * 0.08, -size * 0.1, size * 0.22, 0, Math.PI * 2);
  const specTurret = ctx.createRadialGradient(
    -size * 0.08, -size * 0.1, 0,
    -size * 0.08, -size * 0.1, size * 0.22
  );
  specTurret.addColorStop(0, `rgba(255,255,255,${0.3 * lighting.intensity})`);
  specTurret.addColorStop(0.5, `rgba(255,255,255,${0.1 * lighting.intensity})`);
  specTurret.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = specTurret;
  ctx.fill();
  
  // Commander's hatch
  ctx.beginPath();
  ctx.arc(size * 0.05, size * 0.08, size * 0.12, 0, Math.PI * 2);
  const hatchGrad = ctx.createRadialGradient(
    size * 0.05 - 2, size * 0.08 - 2, 0,
    size * 0.05, size * 0.08, size * 0.12
  );
  hatchGrad.addColorStop(0, lightenColor(color, 10));
  hatchGrad.addColorStop(1, darkenColor(color, 20));
  ctx.fillStyle = hatchGrad;
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.4)';
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
  glassGrad.addColorStop(0, 'rgba(100, 150, 200, 0.3)');
  glassGrad.addColorStop(0.5, 'rgba(150, 200, 255, 0.5)');
  glassGrad.addColorStop(1, 'rgba(100, 150, 200, 0.3)');
  ctx.fillStyle = glassGrad;
  ctx.fillRect(-size * 0.14, -size * 0.04, size * 0.06, size * 0.04);
  
  // Antenna
  ctx.strokeStyle = 'rgba(200,200,200,0.8)';
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
  antennaGlow.addColorStop(0, tank.isPlayer ? 'rgba(96, 165, 250, 0.6)' : 'rgba(248, 113, 113, 0.6)');
  antennaGlow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = antennaGlow;
  ctx.beginPath();
  ctx.arc(-size * 0.25, -size * 0.55, 6, 0, Math.PI * 2);
  ctx.fill();
  
  // Turret rivets
  drawRealisticRivets(ctx, size * 0.4, color, lighting);
}

function drawEnvironmentalEffects(ctx: CanvasRenderingContext2D, tank: Tank, time: number) {
  const { size, moving } = tank;
  
  // Dust clouds when moving
  if (moving && Math.random() > 0.7) {
    const dustX = (Math.random() - 0.5) * size * 1.5;
    const dustY = size * 0.5 + Math.random() * size * 0.3;
    
    const dustGrad = ctx.createRadialGradient(dustX, dustY, 0, dustX, dustY, 8);
    dustGrad.addColorStop(0, 'rgba(120, 100, 70, 0.2)');
    dustGrad.addColorStop(1, 'rgba(120, 100, 70, 0)');
    ctx.fillStyle = dustGrad;
    ctx.beginPath();
    ctx.arc(dustX, dustY, 8, 0, Math.PI * 2);
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
    
    const smokeGrad = ctx.createRadialGradient(smokeX, smokeY, 0, smokeX, smokeY, 12);
    smokeGrad.addColorStop(0, 'rgba(40, 40, 40, 0.3)');
    smokeGrad.addColorStop(0.5, 'rgba(60, 60, 60, 0.15)');
    smokeGrad.addColorStop(1, 'rgba(80, 80, 80, 0)');
    ctx.fillStyle = smokeGrad;
    ctx.beginPath();
    ctx.arc(smokeX, smokeY, 12, 0, Math.PI * 2);
    ctx.fill();
  }
  
  // Sparks
  if (damageLevel > 0.7 && Math.random() > 0.8) {
    const sparkX = (Math.random() - 0.5) * size;
    const sparkY = (Math.random() - 0.5) * size;
    
    ctx.fillStyle = 'rgba(255, 200, 50, 0.8)';
    ctx.beginPath();
    ctx.arc(sparkX, sparkY, 1.5, 0, Math.PI * 2);
    ctx.fill();
    
    // Spark glow
    const sparkGlow = ctx.createRadialGradient(sparkX, sparkY, 0, sparkX, sparkY, 4);
    sparkGlow.addColorStop(0, 'rgba(255, 200, 50, 0.4)');
    sparkGlow.addColorStop(1, 'rgba(255, 200, 50, 0)');
    ctx.fillStyle = sparkGlow;
    ctx.beginPath();
    ctx.arc(sparkX, sparkY, 4, 0, Math.PI * 2);
    ctx.fill();
  }
  
  // Damage decals (scorch marks, dents)
  ctx.save();
  ctx.globalAlpha = damageLevel * 0.4;
  
  for (let i = 0; i < Math.floor(damageLevel * 5); i++) {
    const decalX = (Math.sin(i * 2.3 + time * 0.001) * 0.5) * size;
    const decalY = (Math.cos(i * 1.7 + time * 0.001) * 0.5) * size;
    const decalSize = 3 + damageLevel * 4;
    
    // Scorch mark
    const scorchGrad = ctx.createRadialGradient(decalX, decalY, 0, decalX, decalY, decalSize);
    scorchGrad.addColorStop(0, 'rgba(20, 15, 10, 0.6)');
    scorchGrad.addColorStop(0.5, 'rgba(30, 25, 15, 0.3)');
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
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.beginPath();
  ctx.roundRect(-barWidth / 2, barY + 1, barWidth, barHeight, 3);
  ctx.fill();
  
  // Bar background
  ctx.fillStyle = 'rgba(0,0,0,0.9)';
  ctx.beginPath();
  ctx.roundRect(-barWidth / 2 - 1, barY - 1, barWidth + 2, barHeight + 2, 3);
  ctx.fill();
  
  // Bar border
  ctx.strokeStyle = 'rgba(255,255,255,0.3)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(-barWidth / 2 - 1, barY - 1, barWidth + 2, barHeight + 2, 3);
  ctx.stroke();
  
  const hp = health / maxHealth;
  const hpColor = hp > 0.5 ? '#4ade80' : hp > 0.25 ? '#fbbf24' : '#ef4444';
  
  // Health fill with gradient
  const healthGrad = ctx.createLinearGradient(-barWidth / 2, barY, -barWidth / 2, barY + barHeight);
  healthGrad.addColorStop(0, lightenColor(hpColor, 20));
  healthGrad.addColorStop(0.5, hpColor);
  healthGrad.addColorStop(1, darkenColor(hpColor, 20));
  ctx.fillStyle = healthGrad;
  ctx.beginPath();
  ctx.roundRect(-barWidth / 2, barY, barWidth * hp, barHeight, 2);
  ctx.fill();
  
  // Health bar shine
  ctx.fillStyle = 'rgba(255,255,255,0.3)';
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
