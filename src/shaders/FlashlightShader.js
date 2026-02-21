/**
 * FlashlightShader
 * Custom Three.js ShaderMaterial for a flashlight cone projection.
 * Rendered as a volumetric cone mesh in world space.
 * The cone origin is the hunter position, pointing in their facing direction.
 */

export const FlashlightVertexShader = `
  varying vec3 vPosition;
  varying float vAlpha;

  void main() {
    vPosition = position;
    // Fade alpha toward the tip (cone tip = position.y near 0)
    vAlpha = clamp(position.y / 10.0, 0.0, 1.0);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const FlashlightFragmentShader = `
  varying vec3 vPosition;
  varying float vAlpha;
  uniform vec3 uColor;
  uniform float uIntensity;
  uniform float uBattery;

  void main() {
    // Radial falloff from cone axis
    float radialDist = length(vPosition.xz);
    float falloff = 1.0 - smoothstep(0.0, 1.0, radialDist / (vPosition.y * 0.5 + 0.001));

    // Distance falloff
    float distFade = 1.0 - smoothstep(6.0, 10.0, vPosition.y);

    float alpha = falloff * distFade * vAlpha * uIntensity * (uBattery / 100.0);
    alpha = clamp(alpha, 0.0, 0.35); // semi-transparent volumetric feel

    gl_FragColor = vec4(uColor, alpha);
  }
`;

export const flashlightUniforms = () => ({
  uColor: { value: [0.9, 0.95, 1.0] }, // slightly blue-white
  uIntensity: { value: 1.0 },
  uBattery: { value: 100.0 },
});

/**
 * Creates a cone geometry for the flashlight beam.
 * Cone opens forward (positive Z), tip at origin.
 * radiusTop = 0, radiusBottom = spread
 */
export function createFlashlightGeometry(THREE) {
  // ConeGeometry: radiusTop, radiusBottom, height, radialSegments
  // We rotate it so the tip faces -Y and the opening faces +Y
  const geo = new THREE.ConeGeometry(0, 3.5, 16, 1, true);
  geo.rotateX(-Math.PI / 2);  // tip at local origin, open forward
  geo.translate(0, 0, 5);     // offset so cone extends from origin to 10u
  return geo;
}
