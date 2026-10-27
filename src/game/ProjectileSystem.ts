import { Vector2, Particle, Explosion } from './types';
import { WEAPONS, WeaponDefinition } from './WeaponRegistry';

export interface Projectile {
  id: string;
  position: Vector2;
  velocity: Vector2;
  weapon: WeaponDefinition;
  ownerId: string;
  lifetime: number;
  maxLifetime: number;
  damage: number;
  trail: Vector2[];
  // Behavior-specific properties
  targetId?: string;
  bounceCount?: number;
  chainTargets?: string[];
  splitCount?: number;
  acceleration?: number;
  radius?: number; // for area effects
  active?: boolean;
  // Animation state
  animPhase?: number;
  color?: string;
}

let nextProjectileId = 0;
const getProjectileId = () => `proj_${nextProjectileId++}`;

export function createProjectile(
  weapon: WeaponDefinition,
  position: Vector2,
  angle: number,
  ownerId: string,
  targetPosition?: Vector2
): Projectile {
  const speed = weapon.projectileSpeed;
  
  return {
    id: getProjectileId(),
    position: { ...position },
    velocity: {
      x: Math.cos(angle) * speed,
      y: Math.sin(angle) * speed,
    },
    weapon,
    ownerId,
    lifetime: 0,
    maxLifetime: (weapon.range / speed) * 60, // Convert to frames
    damage: weapon.damage,
    trail: [],
    targetId: undefined,
    bounceCount: 0,
    chainTargets: [],
    splitCount: 0,
    acceleration: 0,
    radius: 0,
    active: true,
    animPhase: 0,
    color: weapon.color,
  };
}

export function updateProjectile(
  proj: Projectile,
  deltaTime: number,
  enemies: any[],
  obstacles: any[],
  createParticles: (pos: Vector2, count: number, type: string, color?: string) => Particle[],
  createExplosion: (pos: Vector2, size: number, color?: string) => Explosion
): { destroyed: boolean; newProjectiles: Projectile[]; damageEvents: Array<{ targetId: string; damage: number; effect?: string }> } {
  const newProjectiles: Projectile[] = [];
  const damageEvents: Array<{ targetId: string; damage: number; effect?: string }> = [];
  
  proj.lifetime += deltaTime;
  proj.animPhase = (proj.animPhase || 0) + deltaTime * 0.01;
  
  // Store trail
  proj.trail.push({ ...proj.position });
  if (proj.trail.length > 15) proj.trail.shift();
  
  // Behavior-specific updates
  switch (proj.weapon.projectileBehavior) {
    case 'homing':
    case 'homing':
      updateHoming(proj, enemies, deltaTime);
      break;
    case 'bouncing':
      updateBouncing(proj, obstacles, newProjectiles);
      break;
    case 'accelerating':
      updateAccelerating(proj, deltaTime);
      break;
    case 'chain':
    case 'chain_lightning':
      updateChain(proj, enemies, deltaTime, newProjectiles, damageEvents);
      break;
    case 'cluster':
    case 'swarm':
      updateCluster(proj, deltaTime, newProjectiles);
      break;
    case 'explosive':
    case 'fireball':
    case 'meteor':
      // Check for impact
      break;
    case 'continuous_beam':
    case 'laser':
      updateBeam(proj, deltaTime);
      break;
    case 'flame_cone':
    case 'inferno':
      updateFlame(proj, deltaTime);
      break;
    case 'gravity_well':
    case 'black_hole':
      updateGravityWell(proj, deltaTime, enemies, damageEvents);
      break;
    case 'wave':
    case 'nova':
      updateWave(proj, deltaTime);
      break;
    default:
      // Standard movement
      break;
  }
  
  // Apply velocity
  proj.position.x += proj.velocity.x;
  proj.position.y += proj.velocity.y;
  
  // Check lifetime
  if (proj.lifetime >= proj.maxLifetime) {
    // End-of-life effects
    if (proj.weapon.projectileBehavior === 'explosive' || 
        proj.weapon.projectileBehavior === 'fireball' ||
        proj.weapon.projectileBehavior === 'meteor') {
      createExplosion(proj.position, proj.weapon.damage * 2, proj.weapon.color);
      createParticles(proj.position, 20, 'explosion', proj.weapon.color);
    }
    return { destroyed: true, newProjectiles, damageEvents };
  }
  
  // Collision detection
  for (const enemy of enemies) {
    const dx = proj.position.x - enemy.position.x;
    const dy = proj.position.y - enemy.position.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist < enemy.size) {
      // Hit!
      damageEvents.push({
        targetId: enemy.id,
        damage: proj.damage,
        effect: proj.weapon.specialEffect,
      });
      
      // Impact effects
      createParticles(proj.position, 10, 'spark', proj.weapon.color);
      
      // Behavior-specific impact
      if (proj.weapon.projectileBehavior === 'explosive' || 
          proj.weapon.projectileBehavior === 'fireball') {
        createExplosion(proj.position, proj.weapon.damage * 2, proj.weapon.color);
        createParticles(proj.position, 20, 'explosion', proj.weapon.color);
        
        // Area damage
        for (const other of enemies) {
          if (other.id !== enemy.id) {
            const d = Math.sqrt((proj.position.x - other.position.x) ** 2 + (proj.position.y - other.position.y) ** 2);
            if (d < proj.weapon.damage * 2) {
              damageEvents.push({
                targetId: other.id,
                damage: proj.damage * 0.5,
              });
            }
          }
        }
      }
      
      if (proj.weapon.projectileBehavior === 'burning') {
        createParticles(proj.position, 15, 'fire', '#ff4400');
      }
      
      if (proj.weapon.projectileBehavior === 'freezing') {
        createParticles(proj.position, 15, 'spark', '#00ffff');
      }
      
      if (proj.weapon.projectileBehavior === 'fragment') {
        // Create shrapnel
        for (let i = 0; i < 5; i++) {
          const angle = (i / 5) * Math.PI * 2;
          const frag = createProjectile(proj.weapon, proj.position, angle, proj.ownerId);
          frag.damage = proj.damage * 0.3;
          frag.maxLifetime = 30;
          newProjectiles.push(frag);
        }
      }
      
      return { destroyed: true, newProjectiles, damageEvents };
    }
  }
  
  return { destroyed: false, newProjectiles, damageEvents };
}

function updateHoming(proj: Projectile, enemies: any[], deltaTime: number) {
  if (!proj.targetId || !enemies.find(e => e.id === proj.targetId)) {
    // Find closest enemy
    let closest: any = null;
    let closestDist = Infinity;
    for (const enemy of enemies) {
      const dist = Math.sqrt((proj.position.x - enemy.position.x) ** 2 + (proj.position.y - enemy.position.y) ** 2);
      if (dist < closestDist) {
        closestDist = dist;
        closest = enemy;
      }
    }
    if (closest) proj.targetId = closest.id;
  }
  
  if (proj.targetId) {
    const target = enemies.find(e => e.id === proj.targetId);
    if (target) {
      const dx = target.position.x - proj.position.x;
      const dy = target.position.y - proj.position.y;
      const targetAngle = Math.atan2(dy, dx);
      const currentAngle = Math.atan2(proj.velocity.y, proj.velocity.x);
      
      let angleDiff = targetAngle - currentAngle;
      while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
      while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
      
      const turnSpeed = 0.05;
      const newAngle = currentAngle + angleDiff * turnSpeed;
      const speed = Math.sqrt(proj.velocity.x ** 2 + proj.velocity.y ** 2);
      proj.velocity.x = Math.cos(newAngle) * speed;
      proj.velocity.y = Math.sin(newAngle) * speed;
    }
  }
}

function updateBouncing(proj: Projectile, obstacles: any[], newProjectiles: Projectile[]) {
  const maxBounces = 3;
  if ((proj.bounceCount || 0) >= maxBounces) return;
  
  for (const obs of obstacles) {
    if (proj.position.x > obs.position.x - obs.width / 2 &&
        proj.position.x < obs.position.x + obs.width / 2 &&
        proj.position.y > obs.position.y - obs.height / 2 &&
        proj.position.y < obs.position.y + obs.height / 2) {
      
      // Bounce
      const dx = proj.position.x - obs.position.x;
      const dy = proj.position.y - obs.position.y;
      
      if (Math.abs(dx) > Math.abs(dy)) {
        proj.velocity.x *= -1;
      } else {
        proj.velocity.y *= -1;
      }
      
      proj.bounceCount = (proj.bounceCount || 0) + 1;
      proj.position.x += proj.velocity.x * 2;
      proj.position.y += proj.velocity.y * 2;
      break;
    }
  }
}

function updateAccelerating(proj: Projectile, deltaTime: number) {
  const accel = 0.1;
  const speed = Math.sqrt(proj.velocity.x ** 2 + proj.velocity.y ** 2);
  const angle = Math.atan2(proj.velocity.y, proj.velocity.x);
  const newSpeed = Math.min(speed + accel, proj.weapon.projectileSpeed * 2);
  proj.velocity.x = Math.cos(angle) * newSpeed;
  proj.velocity.y = Math.sin(angle) * newSpeed;
}

function updateChain(proj: Projectile, enemies: any[], deltaTime: number, newProjectiles: Projectile[], damageEvents: any[]) {
  const maxChains = 3;
  if ((proj.chainTargets || []).length >= maxChains) return;
  
  // Find nearby enemy to chain to
  for (const enemy of enemies) {
    if (proj.chainTargets?.includes(enemy.id)) continue;
    
    const dist = Math.sqrt((proj.position.x - enemy.position.x) ** 2 + (proj.position.y - enemy.position.y) ** 2);
    if (dist < 150) {
      // Chain to this enemy
      proj.chainTargets = proj.chainTargets || [];
      proj.chainTargets.push(enemy.id);
      
      damageEvents.push({
        targetId: enemy.id,
        damage: proj.damage * 0.7,
        effect: 'lightning',
      });
      
      // Create chain projectile
      const chain = createProjectile(proj.weapon, proj.position, Math.atan2(enemy.position.y - proj.position.y, enemy.position.x - proj.position.x), proj.ownerId);
      chain.maxLifetime = 20;
      newProjectiles.push(chain);
      break;
    }
  }
}

function updateCluster(proj: Projectile, deltaTime: number, newProjectiles: Projectile[]) {
  if (proj.lifetime > proj.maxLifetime * 0.7 && (proj.splitCount || 0) === 0) {
    // Split into cluster
    proj.splitCount = 1;
    for (let i = 0; i < 5; i++) {
      const angle = (i / 5) * Math.PI * 2;
      const cluster = createProjectile(proj.weapon, proj.position, angle, proj.ownerId);
      cluster.damage = proj.damage * 0.4;
      cluster.maxLifetime = 60;
      newProjectiles.push(cluster);
    }
  }
}

function updateBeam(proj: Projectile, deltaTime: number) {
  // Beams are instant, just update animation
  proj.animPhase = (proj.animPhase || 0) + deltaTime * 0.02;
}

function updateFlame(proj: Projectile, deltaTime: number) {
  // Flames spread out
  const spread = 0.02;
  proj.velocity.x += (Math.random() - 0.5) * spread;
  proj.velocity.y += (Math.random() - 0.5) * spread;
  
  // Flames slow down
  proj.velocity.x *= 0.98;
  proj.velocity.y *= 0.98;
}

function updateGravityWell(proj: Projectile, deltaTime: number, enemies: any[], damageEvents: any[]) {
  const radius = 150;
  const strength = 0.5;
  
  for (const enemy of enemies) {
    const dx = proj.position.x - enemy.position.x;
    const dy = proj.position.y - enemy.position.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist < radius && dist > 10) {
      const force = strength * (1 - dist / radius);
      enemy.velocity.x += (dx / dist) * force;
      enemy.velocity.y += (dy / dist) * force;
      
      // Damage over time
      if (Math.random() < 0.1) {
        damageEvents.push({
          targetId: enemy.id,
          damage: proj.damage * 0.1,
        });
      }
    }
  }
}

function updateWave(proj: Projectile, deltaTime: number) {
  // Waves expand
  proj.radius = (proj.radius || 0) + deltaTime * 0.1;
}

export function renderProjectile(ctx: CanvasRenderingContext2D, proj: Projectile, time: number) {
  const behavior = proj.weapon.projectileBehavior;
  
  // Draw trail
  if (proj.trail.length > 1) {
    ctx.beginPath();
    ctx.moveTo(proj.trail[0].x, proj.trail[0].y);
    for (let i = 1; i < proj.trail.length; i++) {
      ctx.lineTo(proj.trail[i].x, proj.trail[i].y);
    }
    ctx.strokeStyle = proj.weapon.color + '80';
    ctx.lineWidth = proj.weapon.projectileType === 'laser' ? 3 : 2;
    ctx.stroke();
  }
  
  // Draw projectile based on behavior
  switch (behavior) {
    case 'standard':
    case 'fast':
    case 'piercing':
      drawBullet(ctx, proj);
      break;
    case 'homing':
    case 'explosive':
      drawRocket(ctx, proj, time);
      break;
    case 'continuous_beam':
    case 'laser':
      drawLaser(ctx, proj, time);
      break;
    case 'plasma_orb':
    case 'energy_ball':
      drawPlasmaOrb(ctx, proj, time);
      break;
    case 'lightning':
    case 'chain_lightning':
      drawLightning(ctx, proj, time);
      break;
    case 'flame_cone':
    case 'inferno':
      drawFlame(ctx, proj, time);
      break;
    case 'gravity_well':
    case 'black_hole':
      drawGravityWell(ctx, proj, time);
      break;
    case 'wave':
    case 'nova':
      drawWave(ctx, proj, time);
      break;
    default:
      drawBullet(ctx, proj);
  }
}

function drawBullet(ctx: CanvasRenderingContext2D, proj: Projectile) {
  // Glow
  const glow = ctx.createRadialGradient(proj.position.x, proj.position.y, 0, proj.position.x, proj.position.y, 8);
  glow.addColorStop(0, proj.weapon.color + 'cc');
  glow.addColorStop(1, proj.weapon.color + '00');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(proj.position.x, proj.position.y, 8, 0, Math.PI * 2);
  ctx.fill();
  
  // Core
  ctx.fillStyle = proj.weapon.color;
  ctx.beginPath();
  ctx.arc(proj.position.x, proj.position.y, 3, 0, Math.PI * 2);
  ctx.fill();
}

function drawRocket(ctx: CanvasRenderingContext2D, proj: Projectile, time: number) {
  const angle = Math.atan2(proj.velocity.y, proj.velocity.x);
  
  ctx.save();
  ctx.translate(proj.position.x, proj.position.y);
  ctx.rotate(angle);
  
  // Flame exhaust
  const flameGrad = ctx.createRadialGradient(-8, 0, 0, -8, 0, 10);
  flameGrad.addColorStop(0, '#ff6600');
  flameGrad.addColorStop(0.5, '#ff3300');
  flameGrad.addColorStop(1, 'rgba(255, 0, 0, 0)');
  ctx.fillStyle = flameGrad;
  ctx.beginPath();
  ctx.ellipse(-8, 0, 10 + Math.sin(time * 0.02) * 2, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  
  // Rocket body
  ctx.fillStyle = proj.weapon.color;
  ctx.beginPath();
  ctx.moveTo(8, 0);
  ctx.lineTo(-5, -4);
  ctx.lineTo(-5, 4);
  ctx.closePath();
  ctx.fill();
  
  // Nose
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(6, 0, 2, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.restore();
  
  // Smoke trail
  ctx.fillStyle = 'rgba(100, 100, 100, 0.3)';
  for (let i = 0; i < proj.trail.length; i++) {
    const t = proj.trail[i];
    const alpha = i / proj.trail.length;
    ctx.beginPath();
    ctx.arc(t.x, t.y, 3 + (1 - alpha) * 3, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawLaser(ctx: CanvasRenderingContext2D, proj: Projectile, time: number) {
  // Laser beam
  const angle = Math.atan2(proj.velocity.y, proj.velocity.x);
  const length = 50;
  
  ctx.save();
  ctx.translate(proj.position.x, proj.position.y);
  ctx.rotate(angle);
  
  // Outer glow
  ctx.strokeStyle = proj.weapon.color + '40';
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(length, 0);
  ctx.stroke();
  
  // Inner beam
  ctx.strokeStyle = proj.weapon.color;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(length, 0);
  ctx.stroke();
  
  // Core
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(length, 0);
  ctx.stroke();
  
  ctx.restore();
}

function drawPlasmaOrb(ctx: CanvasRenderingContext2D, proj: Projectile, time: number) {
  const pulse = Math.sin(time * 0.01) * 0.2 + 0.8;
  
  // Outer glow
  const glow = ctx.createRadialGradient(proj.position.x, proj.position.y, 0, proj.position.x, proj.position.y, 15);
  glow.addColorStop(0, proj.weapon.color + 'cc');
  glow.addColorStop(0.5, proj.weapon.color + '66');
  glow.addColorStop(1, proj.weapon.color + '00');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(proj.position.x, proj.position.y, 15 * pulse, 0, Math.PI * 2);
  ctx.fill();
  
  // Core
  ctx.fillStyle = proj.weapon.color;
  ctx.beginPath();
  ctx.arc(proj.position.x, proj.position.y, 6, 0, Math.PI * 2);
  ctx.fill();
  
  // Orbiting particles
  for (let i = 0; i < 3; i++) {
    const orbitAngle = time * 0.02 + (i / 3) * Math.PI * 2;
    const orbitX = proj.position.x + Math.cos(orbitAngle) * 8;
    const orbitY = proj.position.y + Math.sin(orbitAngle) * 8;
    ctx.fillStyle = proj.weapon.color;
    ctx.beginPath();
    ctx.arc(orbitX, orbitY, 2, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawLightning(ctx: CanvasRenderingContext2D, proj: Projectile, time: number) {
  // Lightning bolt
  ctx.strokeStyle = proj.weapon.color;
  ctx.lineWidth = 2;
  ctx.shadowColor = proj.weapon.color;
  ctx.shadowBlur = 10;
  
  ctx.beginPath();
  ctx.moveTo(proj.position.x, proj.position.y);
  
  const segments = 5;
  for (let i = 1; i <= segments; i++) {
    const t = i / segments;
    const x = proj.position.x + proj.velocity.x * t * 10;
    const y = proj.position.y + proj.velocity.y * t * 10;
    const offset = (Math.random() - 0.5) * 10;
    ctx.lineTo(x + offset, y + offset);
  }
  
  ctx.stroke();
  ctx.shadowBlur = 0;
}

function drawFlame(ctx: CanvasRenderingContext2D, proj: Projectile, time: number) {
  // Flame particle
  const flicker = Math.sin(time * 0.03 + proj.position.x) * 0.3 + 0.7;
  
  const flameGrad = ctx.createRadialGradient(proj.position.x, proj.position.y, 0, proj.position.x, proj.position.y, 10);
  flameGrad.addColorStop(0, '#ffff00');
  flameGrad.addColorStop(0.3, '#ff6600');
  flameGrad.addColorStop(0.7, '#ff3300');
  flameGrad.addColorStop(1, 'rgba(255, 0, 0, 0)');
  
  ctx.fillStyle = flameGrad;
  ctx.globalAlpha = flicker;
  ctx.beginPath();
  ctx.arc(proj.position.x, proj.position.y, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
}

function drawGravityWell(ctx: CanvasRenderingContext2D, proj: Projectile, time: number) {
  const radius = proj.radius || 50;
  
  // Distortion rings
  for (let i = 0; i < 3; i++) {
    const ringRadius = radius * (0.5 + i * 0.2);
    const rotation = time * 0.005 * (i % 2 === 0 ? 1 : -1);
    
    ctx.strokeStyle = proj.weapon.color + '60';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(proj.position.x, proj.position.y, ringRadius, rotation, rotation + Math.PI * 1.5);
    ctx.stroke();
  }
  
  // Core
  const coreGrad = ctx.createRadialGradient(proj.position.x, proj.position.y, 0, proj.position.x, proj.position.y, 20);
  coreGrad.addColorStop(0, '#000000');
  coreGrad.addColorStop(0.5, proj.weapon.color + '80');
  coreGrad.addColorStop(1, proj.weapon.color + '00');
  ctx.fillStyle = coreGrad;
  ctx.beginPath();
  ctx.arc(proj.position.x, proj.position.y, 20, 0, Math.PI * 2);
  ctx.fill();
}

function drawWave(ctx: CanvasRenderingContext2D, proj: Projectile, time: number) {
  const radius = proj.radius || 20;
  
  // Expanding wave
  ctx.strokeStyle = proj.weapon.color + '80';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(proj.position.x, proj.position.y, radius, 0, Math.PI * 2);
  ctx.stroke();
  
  // Inner glow
  const waveGrad = ctx.createRadialGradient(proj.position.x, proj.position.y, 0, proj.position.x, proj.position.y, radius);
  waveGrad.addColorStop(0, proj.weapon.color + '40');
  waveGrad.addColorStop(1, proj.weapon.color + '00');
  ctx.fillStyle = waveGrad;
  ctx.beginPath();
  ctx.arc(proj.position.x, proj.position.y, radius, 0, Math.PI * 2);
  ctx.fill();
}
