// Sophisticated 3D Mesh System - Advanced geometry and materials
import { Vector3, Matrix4, Mesh, Face } from './3DSystem';

// ===== SPHERE MESH =====
export function createSphereMesh(radius: number, segments: number, color: string): Mesh {
  const vertices: Vector3[] = [];
  const faces: Face[] = [];
  
  // Create vertices using spherical coordinates
  for (let lat = 0; lat <= segments; lat++) {
    const theta = (lat / segments) * Math.PI;
    const sinTheta = Math.sin(theta);
    const cosTheta = Math.cos(theta);
    
    for (let lon = 0; lon <= segments; lon++) {
      const phi = (lon / segments) * Math.PI * 2;
      const sinPhi = Math.sin(phi);
      const cosPhi = Math.cos(phi);
      
      const x = cosPhi * sinTheta;
      const y = cosTheta;
      const z = sinPhi * sinTheta;
      
      vertices.push(new Vector3(x * radius, y * radius, z * radius));
    }
  }
  
  // Create faces
  for (let lat = 0; lat < segments; lat++) {
    for (let lon = 0; lon < segments; lon++) {
      const first = lat * (segments + 1) + lon;
      const second = first + segments + 1;
      
      if (lat !== 0) {
        faces.push({ vertices: [first, second, first + 1], color });
      }
      if (lat !== segments - 1) {
        faces.push({ vertices: [first + 1, second, second + 1], color });
      }
    }
  }
  
  return { vertices, faces };
}

// ===== CONE MESH =====
export function createConeMesh(radius: number, height: number, segments: number, color: string): Mesh {
  const vertices: Vector3[] = [];
  const faces: Face[] = [];
  
  // Tip vertex
  vertices.push(new Vector3(0, height / 2, 0));
  
  // Base ring
  for (let i = 0; i <= segments; i++) {
    const angle = (i / segments) * Math.PI * 2;
    vertices.push(new Vector3(
      Math.cos(angle) * radius,
      -height / 2,
      Math.sin(angle) * radius
    ));
  }
  
  // Side faces
  for (let i = 0; i < segments; i++) {
    faces.push({ vertices: [0, i + 1, i + 2], color });
  }
  
  // Base cap
  const baseCenter = vertices.length;
  vertices.push(new Vector3(0, -height / 2, 0));
  for (let i = 0; i < segments; i++) {
    faces.push({ vertices: [baseCenter, i + 2, i + 1], color });
  }
  
  return { vertices, faces };
}

// ===== TORUS MESH =====
export function createTorusMesh(majorRadius: number, minorRadius: number, majorSegments: number, minorSegments: number, color: string): Mesh {
  const vertices: Vector3[] = [];
  const faces: Face[] = [];
  
  for (let i = 0; i <= majorSegments; i++) {
    const u = (i / majorSegments) * Math.PI * 2;
    const cosU = Math.cos(u);
    const sinU = Math.sin(u);
    
    for (let j = 0; j <= minorSegments; j++) {
      const v = (j / minorSegments) * Math.PI * 2;
      const cosV = Math.cos(v);
      const sinV = Math.sin(v);
      
      const x = (majorRadius + minorRadius * cosV) * cosU;
      const y = minorRadius * sinV;
      const z = (majorRadius + minorRadius * cosV) * sinU;
      
      vertices.push(new Vector3(x, y, z));
    }
  }
  
  for (let i = 0; i < majorSegments; i++) {
    for (let j = 0; j < minorSegments; j++) {
      const a = i * (minorSegments + 1) + j;
      const b = a + minorSegments + 1;
      
      faces.push({ vertices: [a, b, a + 1], color });
      faces.push({ vertices: [a + 1, b, b + 1], color });
    }
  }
  
  return { vertices, faces };
}

// ===== SUBDIVIDE MESH =====
export function subdivideMesh(mesh: Mesh): Mesh {
  const newVertices: Vector3[] = [...mesh.vertices];
  const newFaces: Face[] = [];
  const edgeMidpoints = new Map<string, number>();
  
  function getMidpoint(i1: number, i2: number): number {
    const key = Math.min(i1, i2) + '_' + Math.max(i1, i2);
    if (edgeMidpoints.has(key)) return edgeMidpoints.get(key)!;
    
    const v1 = mesh.vertices[i1];
    const v2 = mesh.vertices[i2];
    const mid = new Vector3(
      (v1.x + v2.x) / 2,
      (v1.y + v2.y) / 2,
      (v1.z + v2.z) / 2
    );
    
    const idx = newVertices.length;
    newVertices.push(mid);
    edgeMidpoints.set(key, idx);
    return idx;
  }
  
  for (const face of mesh.faces) {
    if (face.vertices.length === 3) {
      const [a, b, c] = face.vertices;
      const ab = getMidpoint(a, b);
      const bc = getMidpoint(b, c);
      const ca = getMidpoint(c, a);
      
      newFaces.push({ vertices: [a, ab, ca], color: face.color });
      newFaces.push({ vertices: [b, bc, ab], color: face.color });
      newFaces.push({ vertices: [c, ca, bc], color: face.color });
      newFaces.push({ vertices: [ab, bc, ca], color: face.color });
    } else if (face.vertices.length === 4) {
      const [a, b, c, d] = face.vertices;
      const ab = getMidpoint(a, b);
      const bc = getMidpoint(b, c);
      const cd = getMidpoint(c, d);
      const da = getMidpoint(d, a);
      const center = newVertices.length;
      
      const va = mesh.vertices[a];
      const vb = mesh.vertices[b];
      const vc = mesh.vertices[c];
      const vd = mesh.vertices[d];
      newVertices.push(new Vector3(
        (va.x + vb.x + vc.x + vd.x) / 4,
        (va.y + vb.y + vc.y + vd.y) / 4,
        (va.z + vb.z + vc.z + vd.z) / 4
      ));
      
      newFaces.push({ vertices: [a, ab, center, da], color: face.color });
      newFaces.push({ vertices: [b, bc, center, ab], color: face.color });
      newFaces.push({ vertices: [c, cd, center, bc], color: face.color });
      newFaces.push({ vertices: [d, da, center, cd], color: face.color });
    }
  }
  
  return { vertices: newVertices, faces: newFaces };
}

// ===== SMOOTH MESH (vertex normal smoothing) =====
export function smoothMesh(mesh: Mesh, iterations: number = 1): Mesh {
  let current = mesh;
  for (let i = 0; i < iterations; i++) {
    current = subdivideMesh(current);
  }
  return current;
}

// ===== ADVANCED MATERIAL SYSTEM =====
export interface Material {
  color: string;
  specular: string;
  shininess: number;
  metallic: number;
  roughness: number;
  emissive?: string;
  emissiveIntensity?: number;
}

export const Materials = {
  tankArmor: (color: string): Material => ({
    color,
    specular: '#ffffff',
    shininess: 32,
    metallic: 0.7,
    roughness: 0.4,
  }),
  
  tankMetal: (color: string = '#555555'): Material => ({
    color,
    specular: '#ffffff',
    shininess: 64,
    metallic: 0.9,
    roughness: 0.2,
  }),
  
  tankRubber: (color: string = '#222222'): Material => ({
    color,
    specular: '#444444',
    shininess: 8,
    metallic: 0.1,
    roughness: 0.9,
  }),
  
  tankGlass: (color: string = '#88ccff'): Material => ({
    color,
    specular: '#ffffff',
    shininess: 128,
    metallic: 0.0,
    roughness: 0.05,
  }),
  
  wood: (color: string = '#8B4513'): Material => ({
    color,
    specular: '#664422',
    shininess: 16,
    metallic: 0.0,
    roughness: 0.8,
  }),
  
  stone: (color: string = '#808080'): Material => ({
    color,
    specular: '#aaaaaa',
    shininess: 8,
    metallic: 0.1,
    roughness: 0.95,
  }),
  
  emissive: (color: string, intensity: number = 1): Material => ({
    color,
    specular: '#000000',
    shininess: 0,
    metallic: 0,
    roughness: 1,
    emissive: color,
    emissiveIntensity: intensity,
  }),
};

// ===== APPLY MATERIAL TO MESH =====
export function applyMaterial(mesh: Mesh, material: Material): Mesh {
  return {
    vertices: mesh.vertices,
    faces: mesh.faces.map(face => ({
      ...face,
      color: material.color,
      material,
    })),
  };
}

// ===== COMPOSITE MESH BUILDER =====
export interface MeshPart {
  mesh: Mesh;
  offset?: Vector3;
  rotation?: Vector3;
  scale?: Vector3;
}

export function buildCompositeMesh(parts: MeshPart[]): Mesh {
  const allVertices: Vector3[] = [];
  const allFaces: Face[] = [];
  
  for (const part of parts) {
    const baseIndex = allVertices.length;
    const offset = part.offset || new Vector3();
    const scale = part.scale || new Vector3(1, 1, 1);
    
    // Transform vertices
    for (const v of part.mesh.vertices) {
      let transformed = new Vector3(v.x * scale.x, v.y * scale.y, v.z * scale.z);
      
      if (part.rotation) {
        transformed = transformed.rotateY(part.rotation.y);
        transformed = transformed.rotateX(part.rotation.x);
        transformed = transformed.rotateZ(part.rotation.z);
      }
      
      allVertices.push(transformed.add(offset));
    }
    
    // Add faces with offset indices
    for (const face of part.mesh.faces) {
      allFaces.push({
        vertices: face.vertices.map(i => i + baseIndex),
        color: face.color,
      });
    }
  }
  
  return { vertices: allVertices, faces: allFaces };
}
