/* Lab-Grown Diamond Finder: floating hero diamond.
   Round brilliant cut built from real proportions, drawn on a transparent canvas
   with a custom diamond shader: Fresnel reflection, per-channel refraction
   (dispersion) and an internal pavilion bounce, all sampled from an in-memory
   studio environment. No network requests, no storage. */
import {
  WebGLRenderer, Scene, PerspectiveCamera, Color, Group, Mesh, BufferGeometry,
  Float32BufferAttribute, MeshBasicMaterial, BoxGeometry, PlaneGeometry, BackSide,
  DoubleSide, Vector3, ShaderMaterial, CubeCamera, WebGLCubeRenderTarget, HalfFloatType,
  LinearFilter, Sprite, SpriteMaterial, CanvasTexture, AdditiveBlending,
  NoToneMapping, LinearSRGBColorSpace, SRGBColorSpace
} from "three";

const host = document.querySelector(".hero-gem");
const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");

function webglOK() {
  try { return !!(window.WebGL2RenderingContext && document.createElement("canvas").getContext("webgl2")); }
  catch (e) { return false; }
}

/* ---------- geometry: round brilliant, girdle radius 1 ---------- */
function brilliant() {
  const tri = [];
  const rt = 0.57, crownTop = 0.32, gTop = 0.02, gBot = -0.02, pav = 0.86;
  const crownY = (r) => gTop + (crownTop - gTop) * (1 - r) / (1 - rt);
  const at = (r, deg, y) => { const a = deg * Math.PI / 180; return [r * Math.cos(a), y, r * Math.sin(a)]; };
  const T = [], S = [], G = [], H = [], Gb = [], Hb = [], Lw = [];
  for (let i = 0; i < 8; i++) {
    const a = i * 45, b = a + 22.5;
    T.push(at(rt, a, crownTop));
    S.push(at(0.785, b, crownY(0.785) + 0.018));
    G.push(at(1, a, gTop)); H.push(at(1, b, gTop));
    Gb.push(at(1, a, gBot)); Hb.push(at(1, b, gBot));
    Lw.push(at(0.22, a, gBot - pav * 0.78 * 0.97));
  }
  const top = [0, crownTop, 0], culet = [0, gBot - pav, 0];
  const n = (i) => (i + 8) % 8;
  for (let i = 0; i < 8; i++) {
    tri.push([top, T[n(i + 1)], T[i]]);
    tri.push([T[i], T[n(i + 1)], S[i]]);
    tri.push([T[i], S[i], G[i]], [T[i], G[i], S[n(i - 1)]]);
    tri.push([S[i], H[i], G[i]], [S[i], G[n(i + 1)], H[i]]);
    tri.push([G[i], H[i], Hb[i]], [G[i], Hb[i], Gb[i]]);
    tri.push([H[i], G[n(i + 1)], Gb[n(i + 1)]], [H[i], Gb[n(i + 1)], Hb[i]]);
    tri.push([Gb[i], Hb[i], Lw[i]], [Hb[i], Gb[n(i + 1)], Lw[n(i + 1)]], [Hb[i], Lw[n(i + 1)], Lw[i]]);
    tri.push([Lw[i], Lw[n(i + 1)], culet]);
  }
  const pos = [], ab = new Vector3(), ac = new Vector3(), nn = new Vector3(), c = new Vector3();
  for (const t of tri) {
    const [A, B, C] = t.map((p) => new Vector3(...p));
    ab.subVectors(B, A); ac.subVectors(C, A); nn.crossVectors(ab, ac);
    c.copy(A).add(B).add(C).divideScalar(3);
    const flip = nn.dot(c) < 0;
    pos.push(...A.toArray(), ...(flip ? C : B).toArray(), ...(flip ? B : C).toArray());
  }
  const g = new BufferGeometry();
  g.setAttribute("position", new Float32BufferAttribute(pos, 3));
  return { geometry: g, glintPoints: [...T, ...S].map((p) => new Vector3(...p)) };
}

/* ---------- studio environment captured into a cube map ---------- */
function studio(renderer) {
  const env = new Scene();
  env.add(new Mesh(new BoxGeometry(30, 30, 30), new MeshBasicMaterial({ color: new Color(0.012, 0.014, 0.02), side: BackSide, toneMapped: false })));
  const panel = (w, h, x, y, z, k, tint) => {
    const p = new Mesh(new PlaneGeometry(w, h), new MeshBasicMaterial({ color: new Color(tint || 0xffffff).multiplyScalar(k), toneMapped: false, side: DoubleSide }));
    p.position.set(x, y, z); p.lookAt(0, 0, 0); env.add(p);
  };
  for (let i = 0; i < 22; i++) {
    const a = i / 22 * Math.PI * 2;
    panel(i % 2 ? 0.9 : 1.7, 12, Math.cos(a) * 9, 0.5, Math.sin(a) * 9, i % 2 ? 8 : 15, i % 5 === 0 ? 0xfff0da : 0xf1f5ff);
  }
  for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2 + 0.13; panel(1.6, 1.6, Math.cos(a) * 7, 4.5 * (i % 2 ? 1 : -1), Math.sin(a) * 7, 14); }
  for (let i = 0; i < 7; i++) { const a = i / 7 * Math.PI * 2 + 0.2; panel(2.6, 0.45, Math.cos(a) * 5.5, 8, Math.sin(a) * 5.5, 18); }
  for (let i = 0; i < 7; i++) { const a = i / 7 * Math.PI * 2 + 0.6; panel(2.2, 0.4, Math.cos(a) * 5.5, -8, Math.sin(a) * 5.5, 10); }
  panel(5, 5, 0, 12, 0, 12);
  panel(6, 6, 0, -12, 0, 3.5, 0xdfe8ff);
  const rt = new WebGLCubeRenderTarget(256, { type: HalfFloatType, generateMipmaps: false, minFilter: LinearFilter, magFilter: LinearFilter });
  new CubeCamera(0.1, 100, rt).update(renderer, env);
  return rt.texture;
}

/* ---------- diamond shader ---------- */
const vertexShader = /* glsl */`
varying vec3 vWorldPos;
varying vec3 vLocal;
void main() {
  vLocal = position;
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vWorldPos = wp.xyz;
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;
const fragmentShader = /* glsl */`
uniform samplerCube envMap;
uniform float exposure;
varying vec3 vWorldPos;
varying vec3 vLocal;
vec3 aces(vec3 x) { return clamp((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0); }
vec3 hash3(vec3 p) {
  p = fract(p * vec3(0.1031, 0.1030, 0.0973));
  p += dot(p, p.yxz + 33.33);
  return fract((p.xxy + p.yxx) * p.zyx);
}
vec3 inside(vec3 V, vec3 N, vec3 jit, float eta) {
  vec3 T = refract(V, N, 1.0 / eta);
  vec3 pn = normalize(vec3(-T.x, -0.62, -T.z) + jit * 0.9);
  vec3 B = reflect(T, pn);
  B.y = abs(B.y) + 0.15;
  return normalize(B + jit * 0.35);
}
void main() {
  vec3 N = normalize(cross(dFdx(vWorldPos), dFdy(vWorldPos)));
  vec3 V = normalize(vWorldPos - cameraPosition);
  if (dot(N, V) > 0.0) N = -N;
  float cosi = clamp(dot(-V, N), 0.0, 1.0);
  float F = 0.172 + 0.828 * pow(1.0 - cosi, 5.0);
  vec3 jit = hash3(floor(N * 23.0)) - 0.5;
  float ang = atan(vLocal.z, vLocal.x) / 6.2831853;
  float rad = length(vLocal.xz);
  vec3 wedge = vec3(floor(ang * 32.0 + rad * 3.0), floor(rad * 5.0 + ang * 4.0), floor(vLocal.y * 4.0));
  vec3 cell = hash3(wedge + floor(N * 13.0)) - 0.5;           // facet-shaped scintillation
  jit = normalize(jit + cell * 0.55) * 0.5;
  vec3 refl = textureCube(envMap, reflect(V, N)).rgb;
  vec3 fire;
  fire.r = textureCube(envMap, inside(V, N, jit, 2.40)).r;
  fire.g = textureCube(envMap, inside(V, N, jit, 2.42)).g;
  fire.b = textureCube(envMap, inside(V, N, jit, 2.455)).b;
  vec3 col = mix(fire * 1.15, refl, F);
  col = aces(col * exposure);
  gl_FragColor = vec4(pow(col, vec3(1.0 / 2.2)), 1.0);
}`;

/* ---------- glint sprite, drawn in memory ---------- */
function glintTexture() {
  const s = 128, cv = document.createElement("canvas"); cv.width = cv.height = s;
  const g = cv.getContext("2d"), h = s / 2;
  const rad = g.createRadialGradient(h, h, 0, h, h, h);
  rad.addColorStop(0, "rgba(255,255,255,1)"); rad.addColorStop(0.1, "rgba(255,255,255,.6)"); rad.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = rad; g.fillRect(0, 0, s, s);
  g.globalCompositeOperation = "lighter";
  const ray = g.createLinearGradient(0, h, s, h);
  ray.addColorStop(0, "rgba(255,255,255,0)"); ray.addColorStop(0.5, "rgba(255,255,255,.95)"); ray.addColorStop(1, "rgba(255,255,255,0)");
  g.translate(h, h);
  for (const [rot, l, w] of [[0, h, 3], [Math.PI / 2, h, 3], [Math.PI / 4, h * 0.55, 1.4], [-Math.PI / 4, h * 0.55, 1.4]]) {
    g.save(); g.rotate(rot); g.translate(-h, 0); g.fillStyle = ray; g.fillRect(h - l, -w / 2, l * 2, w); g.restore();
  }
  const t = new CanvasTexture(cv); t.colorSpace = SRGBColorSpace; return t;
}

function start() {
  if (!host || !webglOK()) return;
  let renderer;
  try { renderer = new WebGLRenderer({ antialias: true, alpha: true, premultipliedAlpha: true, powerPreference: "low-power" }); }
  catch (e) { return; }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(0x000000, 0);
  renderer.toneMapping = NoToneMapping;
  renderer.outputColorSpace = LinearSRGBColorSpace;
  const canvas = renderer.domElement;
  canvas.className = "gem3d";
  canvas.setAttribute("aria-hidden", "true");

  const scene = new Scene();
  const envMap = studio(renderer);
  const camera = new PerspectiveCamera(24, 1, 0.1, 60);
  camera.position.set(0, 1.85, 7.25);
  camera.lookAt(0, -0.22, 0);

  const { geometry, glintPoints } = brilliant();
  const material = new ShaderMaterial({ uniforms: { envMap: { value: envMap }, exposure: { value: 1.55 } }, vertexShader, fragmentShader });
  const gem = new Mesh(geometry, material);
  const tilt = new Group(); tilt.add(gem); scene.add(tilt);
  tilt.rotation.set(0.1, 0, -0.07);

  const gtex = glintTexture(), glints = [];
  for (let i = 0; i < 6; i++) {
    const sp = new Sprite(new SpriteMaterial({ map: gtex, blending: AdditiveBlending, depthTest: false, depthWrite: false, transparent: true, opacity: 0 }));
    sp.userData = { idx: Math.floor(Math.random() * glintPoints.length), t0: Math.random() * 5, dur: 0.8 + Math.random() * 0.7, period: 3 + Math.random() * 4 };
    scene.add(sp); glints.push(sp);
  }

  function size() {
    const r = canvas.getBoundingClientRect();
    const w = Math.max(80, Math.round(r.width || host.getBoundingClientRect().width));
    renderer.setSize(w, w, false);
    draw();
  }

  /* rotation: slow base spin, a little faster while the page scrolls */
  const BASE = 0.32, MAX_BOOST = 1.1;
  let boost = 0, lastY = window.scrollY, lastT = performance.now();
  window.addEventListener("scroll", () => {
    const now = performance.now(), y = window.scrollY, dt = Math.max(16, now - lastT);
    const v = Math.abs(y - lastY) / dt;
    boost = Math.max(boost, Math.min(MAX_BOOST, v * 0.9));
    lastY = y; lastT = now;
    if (!running && !reduce.matches) play();
  }, { passive: true });

  let spin = 0, dragging = false, lx = 0, ly = 0, pitch = 0;
  canvas.addEventListener("pointerdown", (e) => { dragging = true; lx = e.clientX; ly = e.clientY; canvas.setPointerCapture(e.pointerId); });
  canvas.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    const dx = e.clientX - lx, dy = e.clientY - ly; lx = e.clientX; ly = e.clientY;
    gem.rotation.y += dx * 0.012; spin = dx * 0.012;
    pitch = Math.max(-0.35, Math.min(0.5, pitch + dy * 0.006));
    if (!running) draw();
  });
  const up = () => { dragging = false; };
  canvas.addEventListener("pointerup", up); canvas.addEventListener("pointercancel", up);

  let running = false, visible = true, raf = 0, last = performance.now(), t = 0;
  const wp = new Vector3();
  function step() {
    const now = performance.now(), dt = Math.min((now - last) / 1000, 0.05); last = now; t += dt;
    boost *= Math.exp(-dt * 1.4);
    if (!dragging) { spin *= 0.94; gem.rotation.y += (reduce.matches ? 0 : (BASE + boost) * dt) + spin; }
    tilt.rotation.x = 0.1 + pitch + (reduce.matches ? 0 : Math.sin(t * 0.55) * 0.04);
    if (!reduce.matches) {
      for (const sp of glints) {
        const u = sp.userData, ph = ((t + u.t0) % u.period) / u.dur;
        if (ph > 1) { if (sp.material.opacity) { sp.material.opacity = 0; u.idx = Math.floor(Math.random() * glintPoints.length); } continue; }
        const k = Math.sin(ph * Math.PI);
        wp.copy(glintPoints[u.idx]); gem.localToWorld(wp);
        sp.position.copy(wp); sp.material.opacity = k; sp.material.rotation = ph * 0.5;
        const s = 0.16 + k * 0.3; sp.scale.set(s, s, 1);
      }
    }
    draw();
  }
  function draw() { renderer.render(scene, camera); }
  function loop() { if (!running) return; step(); raf = requestAnimationFrame(loop); }
  function play() { if (running || reduce.matches || !visible || document.hidden) return; running = true; last = performance.now(); raf = requestAnimationFrame(loop); }
  function pause() { running = false; cancelAnimationFrame(raf); }

  const shadow = document.createElement("span"); shadow.className = "gem-shadow"; shadow.setAttribute("aria-hidden", "true");
  host.appendChild(shadow);
  host.appendChild(canvas);
  size();
  host.classList.add("gem3d-on");
  new ResizeObserver(size).observe(host);
  new IntersectionObserver((es) => { visible = es[0].isIntersecting; visible ? play() : pause(); }).observe(host);
  document.addEventListener("visibilitychange", () => (document.hidden ? pause() : play()));
  reduce.addEventListener("change", () => { reduce.matches ? (pause(), draw()) : play(); });
  canvas.addEventListener("webglcontextlost", (e) => { e.preventDefault(); pause(); host.classList.remove("gem3d-on"); canvas.remove(); shadow.remove(); });
  play();
}

start();
