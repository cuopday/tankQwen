import { Tank, Bullet, Particle, Explosion, Obstacle, GameState, InputState, Vector2 } from './types';
import { addGroundDecal, clearDecals } from './renderer';

let nextId = 0;
const getId = () => `id_${nextId++}`;

export const CANVAS_WIDTH = 1200;
export const CANVAS_HEIGHT = 800;
const MAP_WIDTH = 2400;
const MAP_HEIGHT = 1600;

export function createPlayer(): Tank {
  return {
    id: getId(),
    position: { x: MAP_WIDTH / 2, y: MAP_HEIGHT / 2 },
    velocity: { x: 0, y: 0 },
    angle: 0,
    turretAngle: 0,
    health: 100,
    maxHealth: 100,
    speed: 3.5,
    rotationSpeed: 0.04,
    color: '#2563eb',
    accentColor: '#60a5fa',
    lastShot: 0,
    fireRate: 300,
    isPlayer: true,
    size: 28,
    trackOffset: 0,
    shield: 0,
    kills: 0,
  };
}

export function createEnemy(wave: number, mapBounds: { minX: number; maxX: number; minY: number; maxY: number }): Tank {
  const colors = [
    { color: '#dc2626', accentColor: '#f87171' },
    { color: '#7c3aed', accentColor: '#a78bfa' },
    { color: '#ea580c', accentColor: '#fb923c' },
    { color: '#059669', accentColor: '#34d399' },
    { color: '#d946ef', accentColor: '#f0abfc' },
  ];
  const colorSet = colors[Math.floor(Math.random() * colors.length)];
  const margin = 100;
  
  let x: number, y: number;
  do {
    x = margin + Math.random() * (MAP_WIDTH - margin * 2);
    y = margin + Math.random() * (MAP_HEIGHT - margin * 2);
  } while (
    Math.abs(x - mapBounds.minX) < 200 && 
    Math.abs(y - mapBounds.minY) < 200
  );

  return {
    id: getId(),
    position: { x, y },
    velocity: { x: 0, y: 0 },
    angle: Math.random() * Math.PI * 2,
    turretAngle: Math.random() * Math.PI * 2,
    health: 40 + wave * 15,
    maxHealth: 40 + wave * 15,
    speed: 1.5 + Math.random() * 1.5,
    rotationSpeed: 0.02 + Math.random() * 0.02,
    ...colorSet,
    lastShot: 0,
    fireRate: 1500 - wave * 50,
    isPlayer: false,
    size: 24 + Math.random() * 8,
    trackOffset: 0,
    shield: 0,
    kills: 0,
  };
}

export function createBullet(tank: Tank, time: number): Bullet {
  const speed = 10;
  const angle = tank.turretAngle;
  const barrelLength = tank.size * 1.5;
  
  return {
    id: getId(),
    position: {
      x: tank.position.x + Math.cos(angle) * barrelLength,
      y: tank.position.y + Math.sin(angle) * barrelLength,
    },
    velocity: {
      x: Math.cos(angle) * speed,
      y: Math.sin(angle) * speed,
    },
    angle,
    damage: tank.isPlayer ? 25 : 10 + Math.random() * 5,
    ownerId: tank.id,
    lifetime: 2000,
    trail: [],
    size: tank.isPlayer ? 5 : 4,
  };
}

export function createExplosion(position: Vector2, size: number): Explosion {
  return {
    position: { ...position },
    radius: 0,
    maxRadius: size,
    lifetime: 500,
    maxLifetime: 500,
    color: '#ff6b35',
  };
}

export function createParticles(position: Vector2, count: number, type: Particle['type'], color?: string): Particle[] {
  const particles: Particle[] = [];
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = type === 'explosion' ? 2 + Math.random() * 6 : 
                  type === 'spark' ? 4 + Math.random() * 8 :
                  type === 'smoke' ? 0.5 + Math.random() * 2 :
                  type === 'muzzle' ? 3 + Math.random() * 5 :
                  1 + Math.random() * 3;
    
    const colors = {
      explosion: ['#ff6b35', '#ff9500', '#ffcc00', '#ff4444', '#ffffff'],
      smoke: ['#555555', '#666666', '#777777', '#888888'],
      spark: ['#ffcc00', '#ffffff', '#ff9500', '#ffee00'],
      debris: ['#8B4513', '#654321', '#555555', '#333333'],
      trail: ['#ff9500', '#ffcc00', '#ff6b35'],
      muzzle: ['#ffffff', '#ffee00', '#ffcc00', '#ff9500'],
    };
    
    const particleColors = colors[type];
    const particleColor = color || particleColors[Math.floor(Math.random() * particleColors.length)];
    
    particles.push({
      position: { ...position },
      velocity: {
        x: Math.cos(angle) * speed,
        y: Math.sin(angle) * speed,
      },
      lifetime: type === 'smoke' ? 800 + Math.random() * 1200 :
                type === 'explosion' ? 300 + Math.random() * 500 :
                type === 'spark' ? 200 + Math.random() * 400 :
                type === 'muzzle' ? 100 + Math.random() * 200 :
                400 + Math.random() * 600,
      maxLifetime: type === 'smoke' ? 2000 :
                   type === 'explosion' ? 800 :
                   type === 'spark' ? 600 :
                   type === 'muzzle' ? 300 :
                   1000,
      size: type === 'smoke' ? 8 + Math.random() * 15 :
            type === 'explosion' ? 4 + Math.random() * 8 :
            type === 'spark' ? 2 + Math.random() * 3 :
            type === 'muzzle' ? 3 + Math.random() * 5 :
            3 + Math.random() * 5,
      color: particleColor,
      type,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.2,
      opacity: 1,
    });
  }
  return particles;
}

export function createObstacles(): Obstacle[] {
  const obstacles: Obstacle[] = [];
  
  // Create buildings
  for (let i = 0; i < 8; i++) {
    obstacles.push({
      position: {
        x: 200 + Math.random() * (MAP_WIDTH - 400),
        y: 200 + Math.random() * (MAP_HEIGHT - 400),
      },
      width: 60 + Math.random() * 80,
      height: 60 + Math.random() * 80,
      type: 'building',
      health: 200,
      maxHealth: 200,
      color: '#4a5568',
      angle: 0,
    });
  }
  
  // Create crates
  for (let i = 0; i < 15; i++) {
    obstacles.push({
      position: {
        x: 100 + Math.random() * (MAP_WIDTH - 200),
        y: 100 + Math.random() * (MAP_HEIGHT - 200),
      },
      width: 30 + Math.random() * 30,
      height: 30 + Math.random() * 30,
      type: 'crate',
      health: 50,
      maxHealth: 50,
      color: '#8B4513',
      angle: 0,
    });
  }
  
  // Create walls
  for (let i = 0; i < 10; i++) {
    const isHorizontal = Math.random() > 0.5;
    obstacles.push({
      position: {
        x: 200 + Math.random() * (MAP_WIDTH - 400),
        y: 200 + Math.random() * (MAP_HEIGHT - 400),
      },
      width: isHorizontal ? 100 + Math.random() * 150 : 20,
      height: isHorizontal ? 20 : 100 + Math.random() * 150,
      type: 'wall',
      health: 300,
      maxHealth: 300,
      color: '#374151',
      angle: 0,
    });
  }
  
  return obstacles;
}

function distance(a: Vector2, b: Vector2): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

function normalize(v: Vector2): Vector2 {
  const len = Math.sqrt(v.x * v.x + v.y * v.y);
  if (len === 0) return { x: 0, y: 0 };
  return { x: v.x / len, y: v.y / len };
}

function rectCollision(
  pos: Vector2,
  size: number,
  obstacle: Obstacle
): boolean {
  const halfSize = size * 0.8;
  const closestX = Math.max(obstacle.position.x - obstacle.width / 2, 
    Math.min(pos.x, obstacle.position.x + obstacle.width / 2));
  const closestY = Math.max(obstacle.position.y - obstacle.height / 2, 
    Math.min(pos.y, obstacle.position.y + obstacle.height / 2));
  
  const dx = pos.x - closestX;
  const dy = pos.y - closestY;
  return (dx * dx + dy * dy) < (halfSize * halfSize);
}

export function updateGame(state: GameState, input: InputState, deltaTime: number): GameState {
  if (state.gameOver || state.paused || !state.gameStarted) return state;
  
  const dt = Math.min(deltaTime, 32);
  const newState = { ...state };
  newState.time += dt;
  
  // Update player
  const player = { ...newState.player };
  
  // Player movement
  if (input.left) player.angle -= player.rotationSpeed;
  if (input.right) player.angle += player.rotationSpeed;
  
  if (input.up) {
    player.velocity.x += Math.cos(player.angle) * 0.3;
    player.velocity.y += Math.sin(player.angle) * 0.3;
    player.trackOffset += 0.3;
  }
  if (input.down) {
    player.velocity.x -= Math.cos(player.angle) * 0.15;
    player.velocity.y -= Math.sin(player.angle) * 0.15;
    player.trackOffset -= 0.15;
  }
  
  // Friction
  player.velocity.x *= 0.92;
  player.velocity.y *= 0.92;
  
  // Speed limit
  const speed = Math.sqrt(player.velocity.x ** 2 + player.velocity.y ** 2);
  if (speed > player.speed) {
    player.velocity.x = (player.velocity.x / speed) * player.speed;
    player.velocity.y = (player.velocity.y / speed) * player.speed;
  }
  
  // Move player
  player.position.x += player.velocity.x;
  player.position.y += player.velocity.y;
  
  // Dust trail when moving
  const playerSpeed = Math.sqrt(player.velocity.x ** 2 + player.velocity.y ** 2);
  if (playerSpeed > 1 && Math.random() > 0.5) {
    const dustPos = {
      x: player.position.x - player.velocity.x * 3 + (Math.random() - 0.5) * 10,
      y: player.position.y - player.velocity.y * 3 + (Math.random() - 0.5) * 10,
    };
    newState.particles = [...newState.particles, ...createParticles(dustPos, 1, 'smoke')];
  }
  
  // Bounds
  player.position.x = Math.max(player.size, Math.min(MAP_WIDTH - player.size, player.position.x));
  player.position.y = Math.max(player.size, Math.min(MAP_HEIGHT - player.size, player.position.y));
  
  // Turret follows mouse (in world coordinates)
  const cameraX = player.position.x - CANVAS_WIDTH / 2;
  const cameraY = player.position.y - CANVAS_HEIGHT / 2;
  const worldMouseX = input.mouseX + cameraX;
  const worldMouseY = input.mouseY + cameraY;
  player.turretAngle = Math.atan2(worldMouseY - player.position.y, worldMouseX - player.position.x);
  
  // Player shooting
  if (input.shoot && newState.time - player.lastShot > player.fireRate) {
    player.lastShot = newState.time;
    const bullet = createBullet(player, newState.time);
    newState.bullets = [...newState.bullets, bullet];
    newState.particles = [...newState.particles, 
      ...createParticles(bullet.position, 8, 'muzzle')
    ];
    // Screen shake
    newState.screenShake = {
      x: (Math.random() - 0.5) * 6,
      y: (Math.random() - 0.5) * 6,
    };
  }
  
  // Obstacle collision for player
  for (const obs of newState.obstacles) {
    if (rectCollision(player.position, player.size, obs)) {
      const pushDir = normalize({
        x: player.position.x - obs.position.x,
        y: player.position.y - obs.position.y,
      });
      player.position.x += pushDir.x * 3;
      player.position.y += pushDir.y * 3;
      player.velocity.x *= 0.5;
      player.velocity.y *= 0.5;
    }
  }
  
  newState.player = player;
  
  // Fire trails for damaged tanks
  if (player.health < player.maxHealth * 0.3 && Math.random() > 0.6) {
    newState.particles = [...newState.particles, ...createParticles(
      { x: player.position.x + (Math.random() - 0.5) * player.size, 
        y: player.position.y + (Math.random() - 0.5) * player.size }, 
      1, 'smoke'
    )];
  }
  
  // Update enemies AI
  newState.enemies = newState.enemies.map(enemy => {
    const e = { ...enemy };
    
    // Fire trail for damaged enemies
    if (e.health < e.maxHealth * 0.3 && Math.random() > 0.7) {
      newState.particles = [...newState.particles, ...createParticles(
        { x: e.position.x + (Math.random() - 0.5) * e.size, 
          y: e.position.y + (Math.random() - 0.5) * e.size }, 
        1, 'smoke'
      )];
    }
    
    const toPlayer = {
      x: player.position.x - e.position.x,
      y: player.position.y - e.position.y,
    };
    const distToPlayer = Math.sqrt(toPlayer.x ** 2 + toPlayer.y ** 2);
    const angleToPlayer = Math.atan2(toPlayer.y, toPlayer.x);
    
    // Turret aims at player
    let turretDiff = angleToPlayer - e.turretAngle;
    while (turretDiff > Math.PI) turretDiff -= Math.PI * 2;
    while (turretDiff < -Math.PI) turretDiff += Math.PI * 2;
    e.turretAngle += turretDiff * 0.05;
    
    // Movement AI
    if (distToPlayer > 250) {
      // Move towards player
      let angleDiff = angleToPlayer - e.angle;
      while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
      while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
      e.angle += Math.sign(angleDiff) * Math.min(Math.abs(angleDiff), e.rotationSpeed);
      
      e.velocity.x += Math.cos(e.angle) * 0.2;
      e.velocity.y += Math.sin(e.angle) * 0.2;
      e.trackOffset += 0.2;
    } else if (distToPlayer < 150) {
      // Back away
      e.velocity.x -= Math.cos(angleToPlayer) * 0.15;
      e.velocity.y -= Math.sin(angleToPlayer) * 0.15;
    } else {
      // Strafe
      const strafeAngle = angleToPlayer + Math.PI / 2;
      e.velocity.x += Math.cos(strafeAngle) * 0.1;
      e.velocity.y += Math.sin(strafeAngle) * 0.1;
    }
    
    e.velocity.x *= 0.93;
    e.velocity.y *= 0.93;
    
    const eSpeed = Math.sqrt(e.velocity.x ** 2 + e.velocity.y ** 2);
    if (eSpeed > e.speed) {
      e.velocity.x = (e.velocity.x / eSpeed) * e.speed;
      e.velocity.y = (e.velocity.y / eSpeed) * e.speed;
    }
    
    e.position.x += e.velocity.x;
    e.position.y += e.velocity.y;
    e.position.x = Math.max(e.size, Math.min(MAP_WIDTH - e.size, e.position.x));
    e.position.y = Math.max(e.size, Math.min(MAP_HEIGHT - e.size, e.position.y));
    
    // Obstacle collision for enemies
    for (const obs of newState.obstacles) {
      if (rectCollision(e.position, e.size, obs)) {
        const pushDir = normalize({
          x: e.position.x - obs.position.x,
          y: e.position.y - obs.position.y,
        });
        e.position.x += pushDir.x * 2;
        e.position.y += pushDir.y * 2;
      }
    }
    
    // Enemy shooting
    if (Math.abs(turretDiff) < 0.3 && distToPlayer < 500 && newState.time - e.lastShot > e.fireRate) {
      e.lastShot = newState.time;
      const bullet = createBullet(e, newState.time);
      newState.bullets = [...newState.bullets, bullet];
      newState.particles = [...newState.particles, ...createParticles(bullet.position, 5, 'muzzle')];
    }
    
    return e;
  });
  
  // Update bullets
  newState.bullets = newState.bullets.filter(bullet => {
    const b = { ...bullet };
    b.trail = [...b.trail, { ...b.position }].slice(-8);
    b.position.x += b.velocity.x;
    b.position.y += b.velocity.y;
    b.lifetime -= dt;
    
    if (b.lifetime <= 0 || b.position.x < 0 || b.position.x > MAP_WIDTH || 
        b.position.y < 0 || b.position.y > MAP_HEIGHT) {
      // Add small scorch mark where bullet lands
      if (b.position.x > 0 && b.position.x < MAP_WIDTH && b.position.y > 0 && b.position.y < MAP_HEIGHT) {
        addGroundDecal(b.position.x, b.position.y, 8, 'scorch');
      }
      return false;
    }
    
    // Bullet-obstacle collision
    for (let i = 0; i < newState.obstacles.length; i++) {
      const obs = newState.obstacles[i];
      if (b.position.x > obs.position.x - obs.width / 2 &&
          b.position.x < obs.position.x + obs.width / 2 &&
          b.position.y > obs.position.y - obs.height / 2 &&
          b.position.y < obs.position.y + obs.height / 2) {
        newState.particles = [...newState.particles, ...createParticles(b.position, 8, 'spark')];
        newState.particles = [...newState.particles, ...createParticles(b.position, 3, 'debris')];
        newState.obstacles = [...newState.obstacles];
        newState.obstacles[i] = { ...obs, health: obs.health - b.damage };
        addGroundDecal(b.position.x, b.position.y, 6, 'scorch');
        return false;
      }
    }
    
    // Bullet-tank collision
    if (b.ownerId !== player.id && distance(b.position, player.position) < player.size) {
      newState.player = { ...newState.player, health: newState.player.health - b.damage };
      newState.particles = [...newState.particles, ...createParticles(b.position, 8, 'spark')];
      newState.screenShake = { x: (Math.random() - 0.5) * 8, y: (Math.random() - 0.5) * 8 };
      if (newState.player.health <= 0) {
        newState.gameOver = true;
        newState.explosions = [...newState.explosions, createExplosion(player.position, 100)];
        newState.particles = [...newState.particles, ...createParticles(player.position, 60, 'explosion')];
        newState.particles = [...newState.particles, ...createParticles(player.position, 30, 'smoke')];
        newState.particles = [...newState.particles, ...createParticles(player.position, 20, 'spark')];
        newState.particles = [...newState.particles, ...createParticles(player.position, 15, 'debris')];
        addGroundDecal(player.position.x, player.position.y, 60, 'crater');
        addGroundDecal(player.position.x, player.position.y, 80, 'scorch');
      }
      return false;
    }
    
    for (let i = 0; i < newState.enemies.length; i++) {
      const enemy = newState.enemies[i];
      if (b.ownerId === player.id && distance(b.position, enemy.position) < enemy.size) {
        newState.enemies = [...newState.enemies];
        newState.enemies[i] = { ...enemy, health: enemy.health - b.damage };
        newState.particles = [...newState.particles, ...createParticles(b.position, 8, 'spark')];
        
        if (newState.enemies[i].health <= 0) {
          newState.explosions = [...newState.explosions, createExplosion(enemy.position, 70)];
          newState.particles = [...newState.particles, ...createParticles(enemy.position, 40, 'explosion')];
          newState.particles = [...newState.particles, ...createParticles(enemy.position, 20, 'smoke')];
          newState.particles = [...newState.particles, ...createParticles(enemy.position, 15, 'debris')];
          newState.particles = [...newState.particles, ...createParticles(enemy.position, 12, 'spark')];
          addGroundDecal(enemy.position.x, enemy.position.y, 40, 'crater');
          addGroundDecal(enemy.position.x, enemy.position.y, 60, 'scorch');
          newState.enemies = newState.enemies.filter((_, idx) => idx !== i);
          newState.score += 100;
          newState.player = { ...newState.player, kills: newState.player.kills + 1 };
          newState.screenShake = { x: (Math.random() - 0.5) * 12, y: (Math.random() - 0.5) * 12 };
        }
        return false;
      }
    }
    
    // Trail particles
    if (Math.random() > 0.5) {
      newState.particles = [...newState.particles, ...createParticles(b.position, 1, 'trail')];
    }
    
    return true;
  });
  
  // Remove destroyed obstacles
  newState.obstacles = newState.obstacles.filter(obs => {
    if (obs.health <= 0) {
      newState.particles = [...newState.particles, ...createParticles(obs.position, 15, 'debris')];
      newState.explosions = [...newState.explosions, createExplosion(obs.position, 40)];
      addGroundDecal(obs.position.x, obs.position.y, 25, 'scorch');
      return false;
    }
    return true;
  });
  
  // Update particles
  newState.particles = newState.particles.filter(p => {
    p.position.x += p.velocity.x;
    p.position.y += p.velocity.y;
    p.velocity.x *= 0.96;
    p.velocity.y *= 0.96;
    if (p.type === 'smoke') {
      p.velocity.y -= 0.02;
      p.size += 0.1;
    }
    p.rotation += p.rotationSpeed;
    p.lifetime -= dt;
    p.opacity = Math.max(0, p.lifetime / p.maxLifetime);
    return p.lifetime > 0;
  });
  
  // Limit particles for performance
  if (newState.particles.length > 500) {
    newState.particles = newState.particles.slice(-500);
  }
  
  // Update explosions
  newState.explosions = newState.explosions.filter(e => {
    e.lifetime -= dt;
    e.radius = e.maxRadius * (1 - e.lifetime / e.maxLifetime);
    return e.lifetime > 0;
  });
  
  // Screen shake decay
  newState.screenShake = {
    x: newState.screenShake.x * 0.9,
    y: newState.screenShake.y * 0.9,
  };
  
  // Wave management
  if (newState.enemies.length === 0) {
    newState.wave += 1;
    newState.waveAnnouncement = 2500;
    const enemyCount = 3 + newState.wave * 2;
    const bounds = { minX: player.position.x, maxX: player.position.x, minY: player.position.y, maxY: player.position.y };
    for (let i = 0; i < enemyCount; i++) {
      newState.enemies = [...newState.enemies, createEnemy(newState.wave, bounds)];
    }
  }
  
  // Wave announcement countdown
  if (newState.waveAnnouncement > 0) {
    newState.waveAnnouncement = Math.max(0, newState.waveAnnouncement - dt);
  }
  
  return newState;
}

export function initGameState(): GameState {
  clearDecals();
  const player = createPlayer();
  const bounds = { minX: player.position.x, maxX: player.position.x, minY: player.position.y, maxY: player.position.y };
  const enemies: Tank[] = [];
  for (let i = 0; i < 5; i++) {
    enemies.push(createEnemy(1, bounds));
  }
  
  return {
    player,
    enemies,
    bullets: [],
    particles: [],
    explosions: [],
    obstacles: createObstacles(),
    score: 0,
    wave: 1,
    gameOver: false,
    gameStarted: false,
    paused: false,
    screenShake: { x: 0, y: 0 },
    time: 0,
    waveAnnouncement: 2000,
  };
}
