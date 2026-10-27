// 3D Math System - Core 3D rendering engine
export class Vector3 {
  constructor(public x: number = 0, public y: number = 0, public z: number = 0) {}

  add(v: Vector3): Vector3 {
    return new Vector3(this.x + v.x, this.y + v.y, this.z + v.z);
  }

  sub(v: Vector3): Vector3 {
    return new Vector3(this.x - v.x, this.y - v.y, this.z - v.z);
  }

  mul(s: number): Vector3 {
    return new Vector3(this.x * s, this.y * s, this.z * s);
  }

  dot(v: Vector3): number {
    return this.x * v.x + this.y * v.y + this.z * v.z;
  }

  cross(v: Vector3): Vector3 {
    return new Vector3(
      this.y * v.z - this.z * v.y,
      this.z * v.x - this.x * v.z,
      this.x * v.y - this.y * v.x
    );
  }

  length(): number {
    return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
  }

  normalize(): Vector3 {
    const len = this.length();
    if (len === 0) return new Vector3();
    return this.mul(1 / len);
  }

  rotateY(angle: number): Vector3 {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    return new Vector3(
      this.x * cos + this.z * sin,
      this.y,
      -this.x * sin + this.z * cos
    );
  }

  rotateX(angle: number): Vector3 {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    return new Vector3(
      this.x,
      this.y * cos - this.z * sin,
      this.y * sin + this.z * cos
    );
  }

  rotateZ(angle: number): Vector3 {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    return new Vector3(
      this.x * cos - this.y * sin,
      this.x * sin + this.y * cos,
      this.z
    );
  }
}

export class Matrix4 {
  constructor(public m: number[] = [
    1, 0, 0, 0,
    0, 1, 0, 0,
    0, 0, 1, 0,
    0, 0, 0, 1
  ]) {}

  static identity(): Matrix4 {
    return new Matrix4();
  }

  static translation(x: number, y: number, z: number): Matrix4 {
    return new Matrix4([
      1, 0, 0, x,
      0, 1, 0, y,
      0, 0, 1, z,
      0, 0, 0, 1
    ]);
  }

  static rotationY(angle: number): Matrix4 {
    const c = Math.cos(angle);
    const s = Math.sin(angle);
    return new Matrix4([
      c, 0, s, 0,
      0, 1, 0, 0,
      -s, 0, c, 0,
      0, 0, 0, 1
    ]);
  }

  static rotationX(angle: number): Matrix4 {
    const c = Math.cos(angle);
    const s = Math.sin(angle);
    return new Matrix4([
      1, 0, 0, 0,
      0, c, -s, 0,
      0, s, c, 0,
      0, 0, 0, 1
    ]);
  }

  static scale(x: number, y: number, z: number): Matrix4 {
    return new Matrix4([
      x, 0, 0, 0,
      0, y, 0, 0,
      0, 0, z, 0,
      0, 0, 0, 1
    ]);
  }

  multiply(other: Matrix4): Matrix4 {
    const result = new Array(16).fill(0);
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        for (let k = 0; k < 4; k++) {
          result[i * 4 + j] += this.m[i * 4 + k] * other.m[k * 4 + j];
        }
      }
    }
    return new Matrix4(result);
  }

  transformPoint(v: Vector3): Vector3 {
    const x = this.m[0] * v.x + this.m[1] * v.y + this.m[2] * v.z + this.m[3];
    const y = this.m[4] * v.x + this.m[5] * v.y + this.m[6] * v.z + this.m[7];
    const z = this.m[8] * v.x + this.m[9] * v.y + this.m[10] * v.z + this.m[11];
    const w = this.m[12] * v.x + this.m[13] * v.y + this.m[14] * v.z + this.m[15];
    return new Vector3(x / w, y / w, z / w);
  }

  transformVector(v: Vector3): Vector3 {
    const x = this.m[0] * v.x + this.m[1] * v.y + this.m[2] * v.z;
    const y = this.m[4] * v.x + this.m[5] * v.y + this.m[6] * v.z;
    const z = this.m[8] * v.x + this.m[9] * v.y + this.m[10] * v.z;
    return new Vector3(x, y, z);
  }
}

export class Camera {
  position: Vector3;
  rotation: Vector3; // pitch, yaw, roll
  fov: number;
  aspect: number;
  near: number;
  far: number;

  constructor(
    position: Vector3 = new Vector3(0, 100, -200),
    rotation: Vector3 = new Vector3(-0.3, 0, 0),
    fov: number = 60,
    aspect: number = 16 / 9,
    near: number = 1,
    far: number = 10000
  ) {
    this.position = position;
    this.rotation = rotation;
    this.fov = fov;
    this.aspect = aspect;
    this.near = near;
    this.far = far;
  }

  getViewMatrix(): Matrix4 {
    // Camera transform: translate then rotate
    const translate = Matrix4.translation(-this.position.x, -this.position.y, -this.position.z);
    const rotateX = Matrix4.rotationX(-this.rotation.x);
    const rotateY = Matrix4.rotationY(-this.rotation.y);
    return rotateX.multiply(rotateY).multiply(translate);
  }

  getProjectionMatrix(): Matrix4 {
    const f = 1.0 / Math.tan((this.fov * Math.PI / 180) / 2);
    const rangeInv = 1 / (this.near - this.far);
    
    return new Matrix4([
      f / this.aspect, 0, 0, 0,
      0, f, 0, 0,
      0, 0, (this.near + this.far) * rangeInv, 2 * this.near * this.far * rangeInv,
      0, 0, -1, 0
    ]);
  }

  project(point: Vector3, screenWidth: number, screenHeight: number): { x: number; y: number; z: number; visible: boolean } {
    const view = this.getViewMatrix();
    const proj = this.getProjectionMatrix();
    
    // Transform to view space
    const viewPos = view.transformPoint(point);
    
    // Check if behind camera
    if (viewPos.z > -this.near) {
      return { x: 0, y: 0, z: viewPos.z, visible: false };
    }
    
    // Transform to clip space
    const clipPos = proj.transformPoint(viewPos);
    
    // Perspective divide and viewport transform
    const screenX = (clipPos.x * 0.5 + 0.5) * screenWidth;
    const screenY = (1 - (clipPos.y * 0.5 + 0.5)) * screenHeight;
    
    return { x: screenX, y: screenY, z: viewPos.z, visible: true };
  }
}

export interface Material {
  color: string;
  specular: string;
  shininess: number;
  metallic: number;
  roughness: number;
  emissive?: string;
  emissiveIntensity?: number;
}

export interface Face {
  vertices: number[]; // indices into vertex array
  color: string;
  normal?: Vector3;
  material?: Material;
}

export interface Mesh {
  vertices: Vector3[];
  faces: Face[];
}

export function createBoxMesh(width: number, height: number, depth: number, color: string): Mesh {
  const hw = width / 2;
  const hh = height / 2;
  const hd = depth / 2;
  
  const vertices = [
    // Front face
    new Vector3(-hw, -hh, hd),  // 0
    new Vector3(hw, -hh, hd),   // 1
    new Vector3(hw, hh, hd),    // 2
    new Vector3(-hw, hh, hd),   // 3
    // Back face
    new Vector3(-hw, -hh, -hd), // 4
    new Vector3(hw, -hh, -hd),  // 5
    new Vector3(hw, hh, -hd),   // 6
    new Vector3(-hw, hh, -hd),  // 7
  ];
  
  const faces: Face[] = [
    // Front
    { vertices: [0, 1, 2, 3], color },
    // Back
    { vertices: [5, 4, 7, 6], color },
    // Top
    { vertices: [3, 2, 6, 7], color },
    // Bottom
    { vertices: [4, 5, 1, 0], color },
    // Right
    { vertices: [1, 5, 6, 2], color },
    // Left
    { vertices: [4, 0, 3, 7], color },
  ];
  
  return { vertices, faces };
}

export function createCylinderMesh(radius: number, height: number, segments: number, color: string): Mesh {
  const vertices: Vector3[] = [];
  const faces: Face[] = [];
  
  // Create vertices
  for (let i = 0; i <= segments; i++) {
    const angle = (i / segments) * Math.PI * 2;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    
    // Bottom vertex
    vertices.push(new Vector3(x, -height / 2, z));
    // Top vertex
    vertices.push(new Vector3(x, height / 2, z));
  }
  
  // Create side faces
  for (let i = 0; i < segments; i++) {
    const i0 = i * 2;
    const i1 = i * 2 + 1;
    const i2 = ((i + 1) % segments) * 2;
    const i3 = ((i + 1) % segments) * 2 + 1;
    
    faces.push({
      vertices: [i0, i2, i3, i1],
      color
    });
  }
  
  // Create top and bottom caps
  const bottomCenter = vertices.length;
  vertices.push(new Vector3(0, -height / 2, 0));
  const topCenter = vertices.length;
  vertices.push(new Vector3(0, height / 2, 0));
  
  for (let i = 0; i < segments; i++) {
    const i0 = i * 2;
    const i1 = ((i + 1) % segments) * 2;
    
    // Bottom cap
    faces.push({ vertices: [bottomCenter, i1, i0], color });
    // Top cap
    faces.push({ vertices: [topCenter, i1 + 1, i0 + 1], color });
  }
  
  return { vertices, faces };
}

export function renderMesh(
  ctx: CanvasRenderingContext2D,
  mesh: Mesh,
  camera: Camera,
  modelMatrix: Matrix4,
  screenWidth: number,
  screenHeight: number,
  lightDirection: Vector3
) {
  // Transform vertices to world space
  const worldVertices = mesh.vertices.map(v => modelMatrix.transformPoint(v));
  
  // Project and collect faces with depth
  interface ProjectedFace {
    points: Array<{ x: number; y: number }>;
    depth: number;
    color: string;
    normal: Vector3;
    material?: Material;
  }
  
  const projectedFaces: ProjectedFace[] = [];
  
  for (const face of mesh.faces) {
    const faceVertices = face.vertices.map(i => worldVertices[i]);
    
    // Calculate face center for depth sorting
    const center = new Vector3(
      faceVertices.reduce((sum, v) => sum + v.x, 0) / faceVertices.length,
      faceVertices.reduce((sum, v) => sum + v.y, 0) / faceVertices.length,
      faceVertices.reduce((sum, v) => sum + v.z, 0) / faceVertices.length
    );
    
    // Calculate face normal
    const v1 = faceVertices[1].sub(faceVertices[0]);
    const v2 = faceVertices[2].sub(faceVertices[0]);
    const normal = v1.cross(v2).normalize();
    
    // Backface culling
    const viewDir = center.sub(camera.position).normalize();
    if (normal.dot(viewDir) > 0) continue;
    
    // Project vertices
    const projected = faceVertices.map(v => camera.project(v, screenWidth, screenHeight));
    
    // Skip if any vertex is behind camera
    if (projected.some(p => !p.visible)) continue;
    
    projectedFaces.push({
      points: projected.map(p => ({ x: p.x, y: p.y })),
      depth: center.z,
      color: face.color,
      normal,
      material: face.material
    });
  }
  
  // Sort by depth (painter's algorithm)
  projectedFaces.sort((a, b) => b.depth - a.depth);
  
  // Render faces
  for (const face of projectedFaces) {
    const material = face.material;
    
    if (material && material.emissive) {
      // Emissive material - self-illuminated
      ctx.fillStyle = material.emissive;
      ctx.strokeStyle = material.emissive;
      ctx.lineWidth = 1;
    } else {
      // Calculate lighting
      const lightIntensity = Math.max(0, face.normal.dot(lightDirection.normalize()));
      
      let intensity: number;
      let baseColor: string;
      
      if (material) {
        // PBR-like lighting
        const ambient = 0.2;
        const diffuse = 0.6 * lightIntensity;
        
        // Specular highlight
        const viewDir = new Vector3(0, 0, -1);
        const reflectDir = lightDirection.sub(face.normal.mul(2 * lightDirection.dot(face.normal)));
        const specAngle = Math.max(0, viewDir.dot(reflectDir));
        const specular = Math.pow(specAngle, material.shininess) * material.metallic;
        
        intensity = ambient + diffuse + specular * 0.5;
        baseColor = material.color;
      } else {
        // Simple lighting
        const ambient = 0.3;
        const diffuse = 0.7;
        intensity = ambient + diffuse * lightIntensity;
        baseColor = face.color;
      }
      
      // Apply lighting to color
      const litColor = applyLighting(baseColor, intensity);
      
      // Draw face
      ctx.fillStyle = litColor;
      ctx.strokeStyle = darkenColor(litColor, 20);
      ctx.lineWidth = 1;
    }
    
    ctx.beginPath();
    ctx.moveTo(face.points[0].x, face.points[0].y);
    for (let i = 1; i < face.points.length; i++) {
      ctx.lineTo(face.points[i].x, face.points[i].y);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
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
