// 3D Renderer - Complete 3D rendering system
import { GameState, Tank, Bullet, Obstacle, Particle, Explosion } from './types';
import { Vector3, Camera, Matrix4 } from './3DSystem';
import { renderTank3D } from './TankModel3D';
import { CANVAS_WIDTH, CANVAS_HEIGHT, MAP_WIDTH, MAP_HEIGHT } from './engine';

export class Renderer3D {
  private camera: Camera;
  private lightDirection: Vector3;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    
    // Initialize camera - positioned above and behind player
    this.camera = new Camera(
      new Vector3(0, 300, -500),
      new Vector3(-0.5, 0, 0), // pitch, yaw, roll
      60,
      CANVAS_WIDTH / CANVAS_HEIGHT,
      1,
      10000
    );
    
    // Light direction (sun position)
    this.lightDirection = new Vector3(0.5, -1, 0.3).normalize();
  }

  render(state: GameState, time: number) {
    // Clear canvas
    this.ctx.fillStyle = '#1a1a2e';
    this.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    // Update camera to follow player
    this.updateCamera(state);
    
    // Render in order: ground, obstacles, tanks, bullets, particles, effects
    this.renderGround(state, time);
    this.renderObstacles(state, time);
    this.renderTanks(state, time);
    this.renderBullets(state, time);
    this.renderParticles(state, time);
    this.renderExplosions(state, time);
    this.renderUI(state);
  }

  private updateCamera(state: GameState) {
    const player = state.player;
    
    // Camera follows player with offset
    const cameraOffset = new Vector3(0, 300, -500);
    const rotatedOffset = cameraOffset.rotateY(-player.angle);
    
    this.camera.position = new Vector3(
      player.position.x + rotatedOffset.x,
      rotatedOffset.y,
      player.position.y + rotatedOffset.z
    );
    
    // Camera looks at player
    const lookAt = new Vector3(player.position.x, 0, player.position.y);
    const direction = lookAt.sub(this.camera.position).normalize();
    
    // Calculate camera rotation
    this.camera.rotation.y = Math.atan2(direction.x, direction.z);
    this.camera.rotation.x = Math.asin(direction.y);
  }

  private renderGround(state: GameState, time: number) {
    // Render ground plane
    const groundSize = 2000;
    const gridSize = 100;
    
    this.ctx.save();
    
    // Draw ground grid
    for (let x = -groundSize; x <= groundSize; x += gridSize) {
      for (let z = -groundSize; z <= groundSize; z += gridSize) {
        const worldPos = new Vector3(
          state.player.position.x + x,
          0,
          state.player.position.y + z
        );
        
        const projected = this.camera.project(worldPos, CANVAS_WIDTH, CANVAS_HEIGHT);
        
        if (projected.visible) {
          // Calculate distance for fade effect
          const distance = worldPos.sub(this.camera.position).length();
          const alpha = Math.max(0, 1 - distance / 1500);
          
          this.ctx.fillStyle = `rgba(40, 60, 40, ${alpha * 0.3})`;
          this.ctx.fillRect(projected.x - 2, projected.y - 2, 4, 4);
        }
      }
    }
    
    this.ctx.restore();
  }

  private renderObstacles(state: GameState, time: number) {
    for (const obstacle of state.obstacles) {
      this.renderObstacle3D(obstacle, state, time);
    }
  }

  private renderObstacle3D(obstacle: Obstacle, state: GameState, time: number) {
    const pos = new Vector3(obstacle.position.x, 0, obstacle.position.y);
    const projected = this.camera.project(pos, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    if (!projected.visible) return;
    
    // Simple box representation for obstacles
    const size = obstacle.width * 0.5;
    const height = obstacle.depth || size;
    
    // Draw obstacle as colored box
    this.ctx.save();
    this.ctx.translate(projected.x, projected.y);
    
    // Scale based on distance
    const distance = pos.sub(this.camera.position).length();
    const scale = Math.max(0.1, 500 / distance);
    this.ctx.scale(scale, scale);
    
    // Draw box
    const color = this.getObstacleColor(obstacle.type);
    this.ctx.fillStyle = color;
    this.ctx.strokeStyle = this.darkenColor(color, 30);
    this.ctx.lineWidth = 2;
    
    this.ctx.fillRect(-size, -height, size * 2, height);
    this.ctx.strokeRect(-size, -height, size * 2, height);
    
    this.ctx.restore();
  }

  private getObstacleColor(type: string): string {
    const colors: Record<string, string> = {
      'stilt_house': '#8B6914',
      'mud_hut': '#6B4423',
      'bamboo': '#4A7C3A',
      'rice_paddy': '#5A8A4A',
      'buddha': '#9CA3AF',
      'well': '#6B7280',
      'rice_stack': '#C4A44A',
      'fence': '#6B4423',
      'palm_tree': '#2D5016',
      'banana_tree': '#3D7A1C',
      'sampan': '#5C3317',
      'market_stall': '#8B4513',
      'stone_lantern': '#78716C',
      'village_gate': '#991B1B',
      'barrel': '#5C3317',
      'cart': '#6B4423',
      'explosive_barrel': '#DC2626',
      'tnt_crate': '#991B1B',
      'health_pack': '#16A34A',
      'speed_boost': '#3B82F6',
      'rapid_fire': '#F97316',
      'triple_shot': '#A855F7',
      'shield': '#06B6D4',
      'armor_boost': '#6B7280',
      'lava_pool': '#FF4500',
      'acid_lake': '#00FF00',
      'quicksand': '#8B7355',
      'ice_patch': '#ADD8E6',
      'oil_spill': '#1F2937',
      'tornado': '#6B7280',
      'auto_turret': '#374151',
      'teleport_portal': '#A855F7',
      'rolling_boulder': '#6B7280',
      'attack_drone': '#EF4444',
      'black_hole': '#000000',
    };
    return colors[type] || '#666666';
  }

  private renderTanks(state: GameState, time: number) {
    // Render all tanks
    for (const enemy of state.enemies) {
      renderTank3D(
        this.ctx,
        enemy,
        this.camera as any,
        CANVAS_WIDTH,
        CANVAS_HEIGHT,
        this.lightDirection,
        time
      );
    }
    
    // Render player tank
    renderTank3D(
      this.ctx,
      state.player,
      this.camera as any,
      CANVAS_WIDTH,
      CANVAS_HEIGHT,
      this.lightDirection,
      time
    );
  }

  private renderBullets(state: GameState, time: number) {
    for (const bullet of state.bullets) {
      this.renderBullet3D(bullet, time);
    }
  }

  private renderBullet3D(bullet: Bullet, time: number) {
    const pos = new Vector3(bullet.position.x, 20, bullet.position.y);
    const projected = this.camera.project(pos, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    if (!projected.visible) return;
    
    // Draw bullet as glowing sphere
    const distance = pos.sub(this.camera.position).length();
    const size = Math.max(2, 200 / distance);
    
    const gradient = this.ctx.createRadialGradient(
      projected.x, projected.y, 0,
      projected.x, projected.y, size * 2
    );
    gradient.addColorStop(0, '#FFFFFF');
    gradient.addColorStop(0.3, '#FFAA00');
    gradient.addColorStop(1, 'rgba(255, 100, 0, 0)');
    
    this.ctx.fillStyle = gradient;
    this.ctx.beginPath();
    this.ctx.arc(projected.x, projected.y, size * 2, 0, Math.PI * 2);
    this.ctx.fill();
  }

  private renderParticles(state: GameState, time: number) {
    for (const particle of state.particles) {
      this.renderParticle3D(particle, time);
    }
  }

  private renderParticle3D(particle: Particle, time: number) {
    const pos = new Vector3(particle.position.x, particle.height || 10, particle.position.y);
    const projected = this.camera.project(pos, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    if (!projected.visible) return;
    
    const distance = pos.sub(this.camera.position).length();
    const size = Math.max(1, particle.size * 100 / distance);
    
    this.ctx.globalAlpha = particle.opacity;
    this.ctx.fillStyle = particle.color;
    this.ctx.beginPath();
    this.ctx.arc(projected.x, projected.y, size, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.globalAlpha = 1;
  }

  private renderExplosions(state: GameState, time: number) {
    for (const explosion of state.explosions) {
      this.renderExplosion3D(explosion, time);
    }
  }

  private renderExplosion3D(explosion: Explosion, time: number) {
    const pos = new Vector3(explosion.position.x, 30, explosion.position.y);
    const projected = this.camera.project(pos, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    if (!projected.visible) return;
    
    const distance = pos.sub(this.camera.position).length();
    const size = Math.max(5, explosion.radius * 100 / distance);
    
    const progress = 1 - explosion.lifetime / explosion.maxLifetime;
    const alpha = 1 - progress;
    
    const gradient = this.ctx.createRadialGradient(
      projected.x, projected.y, 0,
      projected.x, projected.y, size
    );
    gradient.addColorStop(0, `rgba(255, 255, 200, ${alpha})`);
    gradient.addColorStop(0.3, `rgba(255, 150, 50, ${alpha * 0.8})`);
    gradient.addColorStop(0.7, `rgba(255, 80, 0, ${alpha * 0.4})`);
    gradient.addColorStop(1, 'rgba(200, 0, 0, 0)');
    
    this.ctx.fillStyle = gradient;
    this.ctx.beginPath();
    this.ctx.arc(projected.x, projected.y, size, 0, Math.PI * 2);
    this.ctx.fill();
  }

  private renderUI(state: GameState) {
    // Render crosshair
    const crosshairSize = 20;
    const centerX = CANVAS_WIDTH / 2;
    const centerY = CANVAS_HEIGHT / 2;
    
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    this.ctx.lineWidth = 2;
    
    // Cross
    this.ctx.beginPath();
    this.ctx.moveTo(centerX - crosshairSize, centerY);
    this.ctx.lineTo(centerX - 5, centerY);
    this.ctx.moveTo(centerX + 5, centerY);
    this.ctx.lineTo(centerX + crosshairSize, centerY);
    this.ctx.moveTo(centerX, centerY - crosshairSize);
    this.ctx.lineTo(centerX, centerY - 5);
    this.ctx.moveTo(centerX, centerY + 5);
    this.ctx.lineTo(centerX, centerY + crosshairSize);
    this.ctx.stroke();
    
    // Circle
    this.ctx.beginPath();
    this.ctx.arc(centerX, centerY, 3, 0, Math.PI * 2);
    this.ctx.stroke();
  }

  private darkenColor(color: string, amount: number): string {
    const match = color.match(/rgb\((\d+),(\d+),(\d+)\)/);
    if (match) {
      const r = Math.max(0, parseInt(match[1]) - amount);
      const g = Math.max(0, parseInt(match[2]) - amount);
      const b = Math.max(0, parseInt(match[3]) - amount);
      return `rgb(${r},${g},${b})`;
    }
    return color;
  }
}
