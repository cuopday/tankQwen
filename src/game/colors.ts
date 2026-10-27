// Lighting returns RGB colors; tank definitions use hex. Accept both so a
// blended color can safely be passed back into the shading helpers.
function channels(color: string): number[] {
  const hex = /^#([\da-f]{6})$/i.exec(color);
  if (hex) {
    return [0, 2, 4].map(offset => parseInt(hex[1].slice(offset, offset + 2), 16));
  }
  const rgb = /^rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/.exec(color);
  if (rgb) return rgb.slice(1).map(Number);
  throw new Error(`Unsupported rendering color: ${color}`);
}

function rgb(values: number[]): string {
  return `rgb(${values.map(value => Math.max(0, Math.min(255, Math.round(value)))).join(',')})`;
}

export function lightenColor(color: string, amount: number): string {
  return rgb(channels(color).map(value => value + amount));
}

export function darkenColor(color: string, amount: number): string {
  return rgb(channels(color).map(value => value - amount));
}

export function blendColors(color1: string, color2: string, blend: number): string {
  const first = channels(color1);
  const second = channels(color2);
  return rgb(first.map((value, index) => value + (second[index] - value) * blend));
}
