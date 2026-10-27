// Sophisticated Tank Model - Highly detailed 3D tank with many parts
import { Vector3, Matrix4, Mesh, Face, renderMesh, Camera } from './3DSystem';
import { 
  createSphereMesh, 
  createConeMesh, 
  createTorusMesh, 
  smoothMesh,
  buildCompositeMesh,
  Materials,
  applyMaterial,
  MeshPart
} from './Sophisticated3D';
import { Tank } from './types';

export interface DetailedTankModel {
  hull: Mesh;
  turret: Mesh;
  barrel: Mesh;
  wheels: Mesh[];
  tracks: Mesh;
  hatches: Mesh[];
  antenna: Mesh;
  toolBoxes: Mesh[];
  exhaustPipes: Mesh[];
  headlights: Mesh[];
}

export function createDetailedTankModel(tank: Tank): DetailedTankModel {
  const { size, color, accentColor } = tank;
  const armorMat = Materials.tankArmor(color);
  const metalMat = Materials.tankMetal('#555555');
  const rubberMat = Materials.tankRubber('#1a1a1a');
  const glassMat = Materials.tankGlass('#88ccff');
  
  // ===== HULL - Main body with detailed shape =====
  const hullParts: MeshPart[] = [];
  
  // Main hull body (box)
  const mainHull = createBoxMeshDetailed(size * 1.4, size * 0.5, size * 1.8, color);
  hullParts.push({ mesh: mainHull });
  
  // Front glacis plate (angled armor)
  const glacis = createBoxMeshDetailed(size * 1.3, size * 0.15, size * 0.5, color);
  hullParts.push({ 
    mesh: glacis, 
    offset: new Vector3(0, size * 0.2, size * 0.9),
    rotation: new Vector3(-0.3, 0, 0)
  });
  
  // Rear plate
  const rearPlate = createBoxMeshDetailed(size * 1.3, size * 0.4, size * 0.1, color);
  hullParts.push({ 
    mesh: rearPlate, 
    offset: new Vector3(0, 0, -size * 0.9)
  });
  
  // Side skirts
  const leftSkirt = createBoxMeshDetailed(size * 0.08, size * 0.3, size * 1.6, color);
  hullParts.push({ 
    mesh: leftSkirt, 
    offset: new Vector3(-size * 0.72, -size * 0.1, 0)
  });
  
  const rightSkirt = createBoxMeshDetailed(size * 0.08, size * 0.3, size * 1.6, color);
  hullParts.push({ 
    mesh: rightSkirt, 
    offset: new Vector3(size * 0.72, -size * 0.1, 0)
  });
  
  const hull = buildCompositeMesh(hullParts);
  
  // ===== TURRET - Rotating top with details =====
  const turretParts: MeshPart[] = [];
  
  // Main turret body (rounded)
  const turretBody = createSphereMesh(size * 0.45, 12, accentColor);
  turretParts.push({ 
    mesh: turretBody,
    scale: new Vector3(1, 0.6, 1.2)
  });
  
  // Commander's cupola
  const cupola = createSphereMesh(size * 0.15, 8, color);
  turretParts.push({ 
    mesh: cupola,
    offset: new Vector3(size * 0.2, size * 0.25, -size * 0.1)
  });
  
  // Loader's hatch
  const loaderHatch = createSphereMesh(size * 0.12, 8, color);
  turretParts.push({ 
    mesh: loaderHatch,
    offset: new Vector3(-size * 0.2, size * 0.25, -size * 0.1),
    scale: new Vector3(1, 0.5, 1)
  });
  
  // Turret ring
  const turretRing = createTorusMesh(size * 0.5, size * 0.05, 16, 8, '#333333');
  turretParts.push({ 
    mesh: turretRing,
    offset: new Vector3(0, -size * 0.15, 0),
    rotation: new Vector3(Math.PI / 2, 0, 0)
  });
  
  const turret = buildCompositeMesh(turretParts);
  
  // ===== BARREL - Main gun with muzzle brake =====
  const barrelParts: MeshPart[] = [];
  
  // Main barrel
  const mainBarrel = createCylinderMesh(size * 0.08, size * 1.8, 12, '#444444');
  barrelParts.push({ 
    mesh: mainBarrel,
    rotation: new Vector3(Math.PI / 2, 0, 0)
  });
  
  // Barrel reinforcement rings
  for (let i = 0; i < 3; i++) {
    const ring = createTorusMesh(size * 0.09, size * 0.015, 12, 6, '#333333');
    barrelParts.push({ 
      mesh: ring,
      offset: new Vector3(0, 0, size * 0.4 + i * size * 0.4),
      rotation: new Vector3(Math.PI / 2, 0, 0)
    });
  }
  
  // Muzzle brake
  const muzzleBrake = createCylinderMesh(size * 0.12, size * 0.2, 12, '#333333');
  barrelParts.push({ 
    mesh: muzzleBrake,
    offset: new Vector3(0, 0, size * 1.0),
    rotation: new Vector3(Math.PI / 2, 0, 0)
  });
  
  // Muzzle brake slots (simplified as smaller cylinders)
  for (let i = 0; i < 4; i++) {
    const slot = createBoxMeshDetailed(size * 0.02, size * 0.15, size * 0.03, '#222222');
    const angle = (i / 4) * Math.PI * 2;
    barrelParts.push({ 
      mesh: slot,
      offset: new Vector3(
        Math.cos(angle) * size * 0.1,
        Math.sin(angle) * size * 0.1,
        size * 1.0
      )
    });
  }
  
  const barrel = buildCompositeMesh(barrelParts);
  
  // ===== WHEELS - Road wheels and sprockets =====
  const wheels: Mesh[] = [];
  
  // Road wheels (6 per side)
  for (let side = -1; side <= 1; side += 2) {
    for (let i = 0; i < 6; i++) {
      const wheelParts: MeshPart[] = [];
      
      // Wheel rim
      const rim = createCylinderMesh(size * 0.15, size * 0.1, 12, '#333333');
      wheelParts.push({ 
        mesh: rim,
        rotation: new Vector3(Math.PI / 2, 0, 0)
      });
      
      // Wheel hub
      const hub = createSphereMesh(size * 0.08, 8, '#555555');
      wheelParts.push({ 
        mesh: hub,
        scale: new Vector3(1, 0.5, 1)
      });
      
      // Hub bolts
      for (let b = 0; b < 6; b++) {
        const bolt = createSphereMesh(size * 0.02, 6, '#666666');
        const angle = (b / 6) * Math.PI * 2;
        wheelParts.push({ 
          mesh: bolt,
          offset: new Vector3(
            Math.cos(angle) * size * 0.06,
            size * 0.05,
            Math.sin(angle) * size * 0.06
          )
        });
      }
      
      const wheel = buildCompositeMesh(wheelParts);
      wheels.push(wheel);
    }
  }
  
  // ===== TRACKS - Continuous track assembly =====
  const trackParts: MeshPart[] = [];
  
  // Track pads (simplified)
  for (let side = -1; side <= 1; side += 2) {
    for (let i = 0; i < 20; i++) {
      const pad = createBoxMeshDetailed(size * 0.25, size * 0.05, size * 0.08, '#1a1a1a');
      const z = -size * 0.85 + (i / 19) * size * 1.7;
      trackParts.push({ 
        mesh: pad,
        offset: new Vector3(side * size * 0.65, -size * 0.25, z)
      });
    }
  }
  
  const tracks = buildCompositeMesh(trackParts);
  
  // ===== HATCHES - Various access hatches =====
  const hatches: Mesh[] = [];
  
  // Engine deck hatch
  const engineHatch = createBoxMeshDetailed(size * 0.4, size * 0.05, size * 0.3, color);
  hatches.push(engineHatch);
  
  // Ammo compartment hatch
  const ammoHatch = createBoxMeshDetailed(size * 0.3, size * 0.05, size * 0.25, color);
  hatches.push(ammoHatch);
  
  // ===== ANTENNA - Communication antenna =====
  const antennaParts: MeshPart[] = [];
  
  // Antenna mast
  const mast = createCylinderMesh(size * 0.01, size * 0.8, 8, '#666666');
  antennaParts.push({ mesh: mast });
  
  // Antenna tip
  const tip = createSphereMesh(size * 0.02, 6, '#ff0000');
  antennaParts.push({ 
    mesh: tip,
    offset: new Vector3(0, size * 0.4, 0)
  });
  
  const antenna = buildCompositeMesh(antennaParts);
  
  // ===== TOOL BOXES - Storage boxes =====
  const toolBoxes: Mesh[] = [];
  
  // Left tool box
  const leftBox = createBoxMeshDetailed(size * 0.2, size * 0.15, size * 0.3, '#664422');
  toolBoxes.push(leftBox);
  
  // Right tool box
  const rightBox = createBoxMeshDetailed(size * 0.2, size * 0.15, size * 0.3, '#664422');
  toolBoxes.push(rightBox);
  
  // ===== EXHAUST PIPES - Engine exhaust =====
  const exhaustPipes: Mesh[] = [];
  
  for (let i = 0; i < 2; i++) {
    const pipe = createCylinderMesh(size * 0.04, size * 0.3, 8, '#333333');
    exhaustPipes.push(pipe);
  }
  
  // ===== HEADLIGHTS - Front lights =====
  const headlights: Mesh[] = [];
  
  for (let i = 0; i < 2; i++) {
    const lightParts: MeshPart[] = [];
    
    // Light housing
    const housing = createSphereMesh(size * 0.06, 8, '#333333');
    lightParts.push({ 
      mesh: housing,
      scale: new Vector3(1, 1, 0.5)
    });
    
    // Light lens
    const lens = createSphereMesh(size * 0.05, 8, '#ffff88');
    lightParts.push({ 
      mesh: lens,
      offset: new Vector3(0, 0, size * 0.03),
      scale: new Vector3(1, 1, 0.3)
    });
    
    const light = buildCompositeMesh(lightParts);
    headlights.push(light);
  }
  
  return {
    hull,
    turret,
    barrel,
    wheels,
    tracks,
    hatches,
    antenna,
    toolBoxes,
    exhaustPipes,
    headlights
  };
}

// Helper: Create detailed box mesh with beveled edges
function createBoxMeshDetailed(width: number, height: number, depth: number, color: string): Mesh {
  const hw = width / 2;
  const hh = height / 2;
  const hd = depth / 2;
  
  const vertices = [
    // Front face
    new Vector3(-hw, -hh, hd),
    new Vector3(hw, -hh, hd),
    new Vector3(hw, hh, hd),
    new Vector3(-hw, hh, hd),
    // Back face
    new Vector3(-hw, -hh, -hd),
    new Vector3(hw, -hh, -hd),
    new Vector3(hw, hh, -hd),
    new Vector3(-hw, hh, -hd),
  ];
  
  const faces = [
    { vertices: [0, 1, 2, 3], color }, // Front
    { vertices: [5, 4, 7, 6], color }, // Back
    { vertices: [3, 2, 6, 7], color }, // Top
    { vertices: [4, 5, 1, 0], color }, // Bottom
    { vertices: [1, 5, 6, 2], color }, // Right
    { vertices: [4, 0, 3, 7], color }, // Left
  ];
  
  return { vertices, faces };
}

// Helper: Create cylinder mesh
function createCylinderMesh(radius: number, height: number, segments: number, color: string): Mesh {
  const vertices: Vector3[] = [];
  const faces: Face[] = [];
  
  // Create vertices
  for (let i = 0; i <= segments; i++) {
    const angle = (i / segments) * Math.PI * 2;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    
    vertices.push(new Vector3(x, -height / 2, z));
    vertices.push(new Vector3(x, height / 2, z));
  }
  
  // Create side faces
  for (let i = 0; i < segments; i++) {
    const i0 = i * 2;
    const i1 = i * 2 + 1;
    const i2 = ((i + 1) % segments) * 2;
    const i3 = ((i + 1) % segments) * 2 + 1;
    
    faces.push({ vertices: [i0, i2, i3, i1], color });
  }
  
  // Create caps
  const bottomCenter = vertices.length;
  vertices.push(new Vector3(0, -height / 2, 0));
  const topCenter = vertices.length;
  vertices.push(new Vector3(0, height / 2, 0));
  
  for (let i = 0; i < segments; i++) {
    const i0 = i * 2;
    const i1 = ((i + 1) % segments) * 2;
    
    faces.push({ vertices: [bottomCenter, i1, i0], color });
    faces.push({ vertices: [topCenter, i1 + 1, i0 + 1], color });
  }
  
  return { vertices, faces };
}

// Render sophisticated tank
export function renderSophisticatedTank(
  ctx: CanvasRenderingContext2D,
  tank: Tank,
  camera: Camera,
  screenWidth: number,
  screenHeight: number,
  lightDirection: Vector3,
  time: number
) {
  const model = createDetailedTankModel(tank);
  const { position, angle, turretAngle, size } = tank;
  
  const worldPos = new Vector3(position.x, 0, position.y);
  
  // Render hull
  const hullMatrix = Matrix4.translation(worldPos.x, worldPos.y + size * 0.3, worldPos.z)
    .multiply(Matrix4.rotationY(angle));
  renderMesh(ctx, model.hull, camera, hullMatrix, screenWidth, screenHeight, lightDirection);
  
  // Render turret
  const turretMatrix = Matrix4.translation(worldPos.x, worldPos.y + size * 0.7, worldPos.z)
    .multiply(Matrix4.rotationY(turretAngle));
  renderMesh(ctx, model.turret, camera, turretMatrix, screenWidth, screenHeight, lightDirection);
  
  // Render barrel
  const barrelMatrix = turretMatrix.multiply(Matrix4.translation(0, 0, size * 0.9));
  renderMesh(ctx, model.barrel, camera, barrelMatrix, screenWidth, screenHeight, lightDirection);
  
  // Render wheels
  for (let side = -1; side <= 1; side += 2) {
    for (let i = 0; i < 6; i++) {
      const wheelIndex = (side === -1 ? i : i + 6);
      const z = -size * 0.75 + (i / 5) * size * 1.5;
      const wheelMatrix = Matrix4.translation(
        worldPos.x + side * size * 0.65,
        worldPos.y + size * 0.1,
        worldPos.z + z
      ).multiply(Matrix4.rotationY(angle));
      renderMesh(ctx, model.wheels[wheelIndex], camera, wheelMatrix, screenWidth, screenHeight, lightDirection);
    }
  }
  
  // Render tracks
  const trackMatrix = Matrix4.translation(worldPos.x, worldPos.y, worldPos.z)
    .multiply(Matrix4.rotationY(angle));
  renderMesh(ctx, model.tracks, camera, trackMatrix, screenWidth, screenHeight, lightDirection);
  
  // Render antenna
  const antennaMatrix = Matrix4.translation(
    worldPos.x - size * 0.3,
    worldPos.y + size * 0.9,
    worldPos.z - size * 0.2
  ).multiply(Matrix4.rotationY(angle));
  renderMesh(ctx, model.antenna, camera, antennaMatrix, screenWidth, screenHeight, lightDirection);
  
  // Render headlights
  for (let i = 0; i < 2; i++) {
    const x = (i === 0 ? -1 : 1) * size * 0.4;
    const headlightMatrix = Matrix4.translation(
      worldPos.x + x,
      worldPos.y + size * 0.3,
      worldPos.z + size * 0.9
    ).multiply(Matrix4.rotationY(angle));
    renderMesh(ctx, model.headlights[i], camera, headlightMatrix, screenWidth, screenHeight, lightDirection);
  }
  
  // Render shadow
  renderTankShadow(ctx, tank, camera, screenWidth, screenHeight);
}

function renderTankShadow(
  ctx: CanvasRenderingContext2D,
  tank: Tank,
  camera: Camera,
  screenWidth: number,
  screenHeight: number
) {
  const { position, size } = tank;
  const shadowPos = new Vector3(position.x, 0.1, position.y);
  const shadowSize = size * 0.9;
  
  const corners = [
    new Vector3(shadowPos.x - shadowSize, shadowPos.y, shadowPos.z - shadowSize * 0.8),
    new Vector3(shadowPos.x + shadowSize, shadowPos.y, shadowPos.z - shadowSize * 0.8),
    new Vector3(shadowPos.x + shadowSize, shadowPos.y, shadowPos.z + shadowSize * 0.8),
    new Vector3(shadowPos.x - shadowSize, shadowPos.y, shadowPos.z + shadowSize * 0.8),
  ];
  
  const projected = corners.map(c => camera.project(c, screenWidth, screenHeight));
  
  if (projected.some(p => !p.visible)) return;
  
  ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
  ctx.beginPath();
  ctx.moveTo(projected[0].x, projected[0].y);
  for (let i = 1; i < projected.length; i++) {
    ctx.lineTo(projected[i].x, projected[i].y);
  }
  ctx.closePath();
  ctx.fill();
}
