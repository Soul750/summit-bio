/**
 * Custom GLSL Shaders for the Golden Hour -> Twilight Alpine Scene
 * - Atmospheric Sky Dome with sun disc, Mie glow, and emerging twilight stars
 * - Sculpted Mountain Ridge shader with alpenglow rim lighting & depth fog
 * - Weeping Tree Foliage curtain shader with organic wind & scroll sway
 * - Drifting Valley Mist shader
 */

export const SKY_VERTEX_SHADER = /* glsl */ `
  varying vec3 vWorldDirection;

  void main() {
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vWorldDirection = normalize(worldPosition.xyz);
    gl_Position = projectionMatrix * viewMatrix * worldPosition;
  }
`;

export const SKY_FRAGMENT_SHADER = /* glsl */ `
  uniform float uTime;
  uniform float uScroll;
  uniform vec3 uSunDirection;

  varying vec3 vWorldDirection;

  float hash31(vec3 p) {
    p = fract(p * 0.1031);
    p += dot(p, p.yzx + 33.33);
    return fract((p.x + p.y) * p.z);
  }

  void main() {
    vec3 dir = normalize(vWorldDirection);
    float elevation = clamp(dir.y, -0.25, 1.0);
    float horizonT = smoothstep(-0.08, 0.52, elevation);
    float zenithT = smoothstep(0.18, 0.92, elevation);

    // Golden hour palette (uScroll = 0)
    vec3 goldenHorizon = vec3(0.95, 0.56, 0.30);
    vec3 goldenMid     = vec3(0.36, 0.27, 0.35);
    vec3 goldenZenith  = vec3(0.08, 0.11, 0.19);

    // Twilight palette (uScroll = 1)
    vec3 twilightHorizon = vec3(0.42, 0.25, 0.26);
    vec3 twilightMid     = vec3(0.11, 0.15, 0.26);
    vec3 twilightZenith  = vec3(0.03, 0.05, 0.10);

    float dusk = smoothstep(0.05, 0.95, uScroll);

    vec3 horizonCol = mix(goldenHorizon, twilightHorizon, dusk);
    vec3 midCol     = mix(goldenMid, twilightMid, dusk);
    vec3 zenithCol  = mix(goldenZenith, twilightZenith, dusk);

    vec3 sky = mix(horizonCol, midCol, horizonT);
    sky = mix(sky, zenithCol, zenithT);

    // Subtle below-horizon mist darkening
    float belowHorizon = smoothstep(0.04, -0.22, elevation);
    sky = mix(sky, horizonCol * 0.32, belowHorizon);

    // Sun disc + warm atmospheric Mie scattering
    vec3 sunDir = normalize(uSunDirection);
    float sunCos = max(dot(dir, sunDir), 0.0);
    float sunGlowWide = pow(sunCos, 6.0) * mix(0.55, 0.20, dusk);
    float sunGlowTight = pow(sunCos, 42.0) * mix(0.85, 0.28, dusk);
    float sunDisc = smoothstep(0.9985, 0.9996, sunCos) * mix(1.4, 0.22, dusk);

    vec3 sunTint = mix(vec3(1.0, 0.78, 0.48), vec3(0.95, 0.52, 0.36), dusk);
    sky += sunTint * (sunGlowWide * 0.45 + sunGlowTight * 0.65);
    sky += vec3(1.0, 0.93, 0.78) * sunDisc;

    // Subtle crisp stars emerging in the upper sky as twilight deepens
    float starVisibility = smoothstep(0.28, 0.92, dusk) * smoothstep(0.14, 0.52, elevation);
    if (starVisibility > 0.005) {
      vec3 starGrid = floor(dir * 210.0);
      float starRand = hash31(starGrid);
      if (starRand > 0.9955) {
        vec3 cellCenter = (starGrid + 0.5) / 210.0;
        float dist = length(dir - normalize(cellCenter));
        float twinkle = 0.65 + 0.35 * sin(uTime * 1.8 + starRand * 62.83);
        float starMask = smoothstep(0.0026, 0.0005, dist) * twinkle;
        sky += vec3(0.95, 0.92, 0.86) * starMask * starVisibility * 0.95;
      }
    }

    gl_FragColor = vec4(sky, 1.0);
  }
`;

export const MOUNTAIN_VERTEX_SHADER = /* glsl */ `
  varying vec3 vWorldPos;
  varying vec3 vNormal;
  varying float vElevation;

  void main() {
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vWorldPos = worldPos.xyz;
    vNormal = normalize(mat3(modelMatrix) * normal);
    vElevation = position.y;
    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`;

export const MOUNTAIN_FRAGMENT_SHADER = /* glsl */ `
  uniform vec3 uSunDirection;
  uniform vec3 uRockColor;
  uniform vec3 uShadowColor;
  uniform vec3 uSnowColor;
  uniform vec3 uFogColor;
  uniform float uFogDensity;
  uniform float uSnowLine;
  uniform float uScroll;

  varying vec3 vWorldPos;
  varying vec3 vNormal;
  varying float vElevation;

  void main() {
    vec3 N = normalize(vNormal);
    vec3 L = normalize(uSunDirection);
    vec3 V = normalize(cameraPosition - vWorldPos);

    float ndotl = max(dot(N, L), 0.0);
    float wrapLight = max((dot(N, L) + 0.35) / 1.35, 0.0);

    // Snow settles on higher, less vertical ledges
    float flatness = smoothstep(0.45, 0.85, N.y);
    float snowFactor = smoothstep(uSnowLine - 1.2, uSnowLine + 2.4, vElevation) * flatness;

    vec3 baseAlbedo = mix(uRockColor, uSnowColor, snowFactor * 0.72);

    // Alpenglow sunlight color transitions warmer -> deeper rose-amber on scroll
    float dusk = smoothstep(0.05, 0.95, uScroll);
    vec3 sunColor = mix(vec3(1.0, 0.70, 0.42), vec3(0.72, 0.44, 0.38), dusk);
    vec3 ambientSky = mix(vec3(0.16, 0.21, 0.31), vec3(0.08, 0.11, 0.19), dusk);

    // Subtle rim alpenglow along grazing mountain silhouettes
    float fresnel = pow(1.0 - max(dot(N, V), 0.0), 3.0);
    float rimSun = max(dot(normalize(-V), L), 0.0);
    vec3 rimGlow = sunColor * fresnel * (0.15 + 0.35 * rimSun) * mix(0.85, 0.45, dusk);

    vec3 lit = baseAlbedo * (ambientSky + sunColor * wrapLight * 0.95 + sunColor * ndotl * 0.35);
    lit = mix(uShadowColor, lit, 0.35 + 0.65 * wrapLight);
    lit += rimGlow;

    // Exponential distance atmospheric perspective
    float dist = length(cameraPosition - vWorldPos);
    float fogFactor = 1.0 - exp(-pow(dist * uFogDensity, 1.55));
    fogFactor = clamp(fogFactor, 0.0, 0.96);

    // Lower valleys gather slightly warmer mist
    float valleyMist = smoothstep(4.0, -7.0, vWorldPos.y) * 0.38;
    float finalFog = clamp(fogFactor + valleyMist * (1.0 - fogFactor), 0.0, 0.97);

    vec3 finalColor = mix(lit, uFogColor, finalFog);
    gl_FragColor = vec4(finalColor, 1.0);
  }
`;

export const WEEPING_FOLIAGE_VERTEX_SHADER = /* glsl */ `
  uniform float uTime;
  uniform float uScroll;
  uniform float uWindStrength;

  attribute float aPhase;
  attribute float aSwayAmp;

  varying vec2 vUv;
  varying float vBacklight;
  varying float vTipFactor;

  void main() {
    vUv = uv;
    // uv.y = 1.0 at top anchor on bough, 0.0 at hanging tip
    float hang = 1.0 - uv.y;
    vTipFactor = hang;

    vec3 pos = position;

    // Layered alpine wind waves stronger near the hanging tips
    float gust = 1.0 + 0.35 * sin(uTime * 0.55 + uScroll * 4.5);
    float wave1 = sin(uTime * 1.45 + aPhase + hang * 2.6);
    float wave2 = cos(uTime * 2.35 + aPhase * 1.7 + hang * 4.2) * 0.35;
    float scrollBreeze = sin(uScroll * 6.2831 + aPhase) * 0.16;

    float displacement = (wave1 + wave2 + scrollBreeze) * aSwayAmp * uWindStrength * gust * pow(hang, 1.45);
    pos.x += displacement;
    pos.z += displacement * 0.55 + cos(uTime * 1.15 + aPhase) * aSwayAmp * 0.32 * pow(hang, 1.6);

    // Subtle natural droop curve
    pos.y -= pow(hang, 2.0) * 0.06;

    vec4 worldPos = modelMatrix * vec4(pos, 1.0);
    vec3 worldNormal = normalize(mat3(modelMatrix) * normal);
    vec3 sunDir = normalize(vec3(-0.48, 0.24, -0.84));
    vBacklight = pow(clamp(dot(normalize(worldPos.xyz - cameraPosition), sunDir) * 0.5 + 0.5, 0.0, 1.0), 2.2);

    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`;

export const WEEPING_FOLIAGE_FRAGMENT_SHADER = /* glsl */ `
  uniform float uScroll;
  uniform vec3 uFoliageDark;
  uniform vec3 uFoliageLight;
  uniform vec3 uSunGlowColor;

  varying vec2 vUv;
  varying float vBacklight;
  varying float vTipFactor;

  void main() {
    // Sculpt delicate vertical weeping willow-like strands procedurally in UV space
    float xCentered = abs(vUv.x - 0.5) * 2.0;

    // Taper smoothly toward the hanging tip and top stem
    float taper = sin(vUv.y * 3.14159);
    float widthProfile = mix(0.28, 0.96, pow(taper, 0.55));

    // Fine serrated leaf tufts along the hanging frond
    float leafNotch = 0.78 + 0.22 * sin(vUv.y * 38.0 + sin(vUv.x * 12.0));
    float strandMask = smoothstep(widthProfile * leafNotch, widthProfile * leafNotch - 0.24, xCentered);

    // Delicate inner gaps between drooping leaflets
    float centerStem = smoothstep(0.18, 0.02, xCentered);
    float leafletRibs = 0.65 + 0.35 * sin(vUv.y * 54.0 + xCentered * 5.0);
    float alpha = clamp(max(strandMask * leafletRibs, centerStem * 0.85), 0.0, 1.0);

    // Soft fade at very top & bottom tips
    alpha *= smoothstep(0.0, 0.12, vUv.y) * smoothstep(1.0, 0.90, vUv.y);

    if (alpha < 0.14) discard;

    float dusk = smoothstep(0.05, 0.95, uScroll);
    vec3 baseCol = mix(uFoliageDark, uFoliageLight, vTipFactor * 0.65 + (1.0 - xCentered) * 0.25);

    // Golden-hour rim translucency catching the hanging tips
    float rim = (0.35 + 0.65 * vTipFactor) * (0.4 + 0.6 * vBacklight) * mix(1.0, 0.38, dusk);
    vec3 color = mix(baseCol, uSunGlowColor, clamp(rim * 0.52, 0.0, 0.68));

    // Slight darkening in deep twilight
    color *= mix(1.0, 0.66, dusk);

    gl_FragColor = vec4(color, alpha * 0.92);
  }
`;

export const MIST_VERTEX_SHADER = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const MIST_FRAGMENT_SHADER = /* glsl */ `
  uniform float uTime;
  uniform float uScroll;
  uniform vec3 uMistColor;
  uniform float uOpacity;

  varying vec2 vUv;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
  }

  float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 4; i++) {
      v += a * noise(p);
      p *= 2.02;
      a *= 0.5;
    }
    return v;
  }

  void main() {
    vec2 uv = vUv;
    vec2 flow = vec2(uTime * 0.018 + uScroll * 0.12, uTime * 0.005);
    float n1 = fbm(uv * vec2(3.6, 2.4) + flow);
    float n2 = fbm(uv * vec2(6.5, 4.0) - flow * 0.7);
    float cloud = smoothstep(0.32, 0.78, n1 * 0.7 + n2 * 0.35);

    // Radial edge fade so mist planes never show rectangular borders
    float edgeX = smoothstep(0.0, 0.28, uv.x) * smoothstep(1.0, 0.72, uv.x);
    float edgeY = smoothstep(0.0, 0.32, uv.y) * smoothstep(1.0, 0.68, uv.y);

    float alpha = cloud * edgeX * edgeY * uOpacity;
    if (alpha < 0.01) discard;

    gl_FragColor = vec4(uMistColor, alpha);
  }
`;
