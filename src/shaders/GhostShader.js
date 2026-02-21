/**
 * GhostOutlineShader
 * Renders a pulsing white outline/glow around the ghost blob.
 * Used when: ghost is hit by flashlight, dash afterimage, or lightning.
 */

export const GhostOutlineVertexShader = `
  uniform float uTime;
  uniform float uIntensity;
  varying float vIntensity;

  void main() {
    vIntensity = uIntensity;
    // Expand vertex along normal for outline effect
    vec3 expanded = position + normal * (0.08 + sin(uTime * 6.0) * 0.02) * uIntensity;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(expanded, 1.0);
  }
`;

export const GhostOutlineFragmentShader = `
  varying float vIntensity;
  uniform vec3 uColor;
  uniform float uAlpha;

  void main() {
    gl_FragColor = vec4(uColor * vIntensity, uAlpha * vIntensity);
  }
`;

export const ghostOutlineUniforms = () => ({
  uTime: { value: 0 },
  uIntensity: { value: 1.0 },
  uColor: { value: [1.0, 1.0, 1.0] },
  uAlpha: { value: 0.9 },
});

/**
 * GhostBodyShader
 * For the main ghost blob — translucent white with subtle iridescence.
 */
export const GhostBodyVertexShader = `
  uniform float uTime;
  varying vec3 vNormal;
  varying vec3 vPosition;

  void main() {
    vNormal = normalMatrix * normal;
    vPosition = position;
    // Subtle blob wobble
    vec3 pos = position;
    pos += normal * sin(uTime * 2.0 + position.y * 3.0) * 0.03;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

export const GhostBodyFragmentShader = `
  varying vec3 vNormal;
  varying vec3 vPosition;
  uniform float uTime;
  uniform float uAlpha;
  uniform bool uVisible;

  void main() {
    vec3 n = normalize(vNormal);
    // Fresnel rim lighting
    float fresnel = pow(1.0 - abs(dot(n, vec3(0.0, 0.0, 1.0))), 2.0);

    vec3 color = vec3(0.9, 0.95, 1.0) + fresnel * vec3(0.3, 0.4, 0.5);
    float alpha = uVisible ? (0.8 + fresnel * 0.2) : (fresnel * 0.15 + 0.05);
    alpha = clamp(alpha * uAlpha, 0.0, 1.0);

    gl_FragColor = vec4(color, alpha);
  }
`;

export const ghostBodyUniforms = () => ({
  uTime: { value: 0 },
  uAlpha: { value: 1.0 },
  uVisible: { value: false },
});
