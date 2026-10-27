// 3D Tank Model Builder
import { Vector3, Matrix4, Mesh, createBoxMesh, createCylinderMesh, renderMesh, Camera } from './3DSystem';
import { Tank } from './types';

export interface TankModel {
  hull: Mesh;
  turret: Mesh;
  barrel: Mesh;
  tracks: Mesh[];
}

export function createTankModel(tank: Tank): TankModel {
  const { size, color, accentColor } = tank;
  
  // Hull - main body
  const hull = createBoxMesh(size * 1.2, size * 0.6, size * 1.6, color);
  
  // Turret - rotating top
  const turret = createCylinderMesh(size * 0.5, size * 0.4, 16, accentColor);
  
  // Barrel - gun
  const barrel = createBoxMesh(size * 0.15, size * 0.15, size * 1.8, '#444444');
  
  // Tracks - left and right
  const trackLeft = createBoxMesh(size * 0.25, size * 0.4, size * 1.7, '#222222');
  const trackRight = createBoxMesh(size * 0.25, size * 0.4, size * 1.7, '#222222');
  
  return {
    hull,
    turret,
    barrel,
    tracks: [trackLeft, trackRight]
  };
}

export function renderTank3D(
  ctx: CanvasRenderingContext2D,
  tank: Tank,
  camera: Camera,
  screenWidth: number,
  screenHeight: number,
  lightDirection: Vector3,
  time: number
) {
  const model = createTankModel(tank);
  const { position, angle, turretAngle, size } = tank;
  
  // Create world position
  const worldPos = new Vector3(position.x, 0, position.y);
  
  // Render hull
  const hullMatrix = Matrix4.translation(worldPos.x, worldPos.y + size * 0.3, worldPos.z)
    .multiply(Matrix4.rotationY(angle));
  
  renderMesh(ctx, model.hull, camera, hullMatrix, screenWidth, screenHeight, lightDirection);
  
  // Render turret (rotates independently)
  const turretMatrix = Matrix4.translation(worldPos.x, worldPos.y + size * 0.7, worldPos.z)
    .multiply(Matrix4.rotationY(turretAngle));
  
  renderMesh(ctx, model.turret, camera, turretMatrix, screenWidth, screenHeight, lightDirection);
  
  // Render barrel (attached to turret)
  const barrelOffset = new Vector3(0, 0, size * 0.9);
  const barrelMatrix = turretMatrix
    .multiply(Matrix4.translation(0, 0, size * 0.9));
  
  renderMesh(ctx, model.barrel, camera, barrelMatrix, screenWidth, screenHeight, lightDirection);
  
  // Render tracks
  const trackLeftMatrix = Matrix4.translation(worldPos.x - size * 0.65, worldPos.y + size * 0.2, worldPos.z)
    .multiply(Matrix4.rotationY(angle));
  
  const trackRightMatrix = Matrix4.translation(worldPos.x + size * 0.65, worldPos.y + size * 0.2, worldPos.z)
    .multiply(Matrix4.rotationY(angle));
  
  renderMesh(ctx, model.tracks[0], camera, trackLeftMatrix, screenWidth, screenHeight, lightDirection);
  renderMesh(ctx, model.tracks[1], camera, trackRightMatrix, screenWidth, screenHeight, lightDirection);
  
  // Render shadow
  renderTankShadow(ctx, tank, camera, screenWidth, screenHeight);
}



function renderTankShadow(
  ctx: CanvasRenderingContext2D,
  tank: Tank,
  camera: any,
  screenWidth: number,
  screenHeight: number
) {
  const { position, size } = tank;
  const shadowPos = new Vector3(position.x, 0.1, position.y);
  const shadowSize = size * 0.8;
  
  // Project shadow corners
  const corners = [
    new Vector3(shadowPos.x - shadowSize, shadowPos.y, shadowPos.z - shadowSize),
    new Vector3(shadowPos.x + shadowSize, shadowPos.y, shadowPos.z - shadowSize),
    new Vector3(shadowPos.x + shadowSize, shadowPos.y, shadowPos.z + shadowSize),
    new Vector3(shadowPos.x - shadowSize, shadowPos.y, shadowPos.z + shadowSize),
  ];
  
  const projected = corners.map(c => camera.project(c, screenWidth, screenHeight));
  
  if (projected.some(p => !p.visible)) return;
  
  ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
  ctx.beginPath();
  ctx.moveTo(projected[0].x, projected[0].y);
  for (let i = 1; i < projected.length; i++) {
    ctx.lineTo(projected[i].x, projected[i].y);
  }
  ctx.closePath();
  ctx.fill();
}

function applyLighting(color: string, intensity: number): string {
  const hex = color.replace('#', '');
  const r = Math.min(255, Math.floor(parseInt(hex.slice(0, 2), 16) * intensity));
  const g = Math.min(255, Math.floor(parseInt(hex.slice(2, 4), 16) * intensity));
  const b = Math.min(255, Math.floor(parseInt(hex.slice(4, 6), 16) * intensity));
  return `rgb(${r},${g},${b})`;
}

function darkenColor(color: string, amount: number): string {
  const match = color.match(/rgb\((\d+),(\d+),(\d+)\)/);
  if (match) {
    const r = Math.max(0, parseInt(match[1]) - amount);
    const g = Math.max(0, parseInt(match[2]) - amount);
    const b = Math.max(0, parseInt(match[3]) - amount);
    return `rgb(${r},${g},${b})`;
  }
  return color;
}
