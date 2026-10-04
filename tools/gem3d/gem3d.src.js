/* Lab-Grown Diamond Finder: hero diamond.
   A round brilliant cut built from real proportions, rendered with physical
   refraction (IOR 2.417) and dispersion. No network requests, no storage. */
import {
  WebGLRenderer, Scene, PerspectiveCamera, Color, Group, Mesh, BufferGeometry,
  Float32BufferAttribute, MeshPhysicalMaterial, MeshBasicMaterial, BoxGeometry,
  PlaneGeometry, PMREMGenerator, BackSide, Vector3, ACESFilmicToneMapping,
  SRGBColorSpace, Sprite, SpriteMaterial, CanvasTexture, AdditiveBlending
} from "three";

const host = document.querySelector(".hero-gem");
const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");

function webglOK() {
  try {
    const c = document.createElement("canvas");
    return !!(window.WebGL2RenderingContext && c.getContext("webgl2"));
  } catch (e) { return false; }
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
    const rs = 0.785; S.push(at(rs, b, crownY(rs) + 0.018));
    G.push(at(1, a, gTop)); H.push(at(1, b, gTop));
    Gb.push(at(1, a, gBot)); Hb.push(at(1, b, gBot));
    const rl = 0.22; Lw.push(at(rl, a, gBot - pav * (1 - rl) * 0.97));
  }
  const top = [0, crownTop, 0], culet = [0, gBot - pav, 0];
  const n = (i) => (i + 8) % 8;
  for (let i = 0; i < 8; i++) {
    tri.push([top, T[n(i + 1)], T[i]]);                 // table
    tri.push([T[i], T[n(i + 1)], S[i]]);                 // star
    tri.push([T[i], S[i], G[i]], [T[i], G[i], S[n(i - 1)]]); // kite (bezel)
    tri.push([S[i], H[i], G[i]], [S[i], G[n(i + 1)], H[i]]); // upper girdle
    // girdle band
    tri.push([G[i], H[i], Hb[i]], [G[i], Hb[i], Gb[i]]);
    tri.push([H[i], G[n(i + 1)], Gb[n(i + 1)]], [H[i], Gb[n(i + 1)], Hb[i]]);
    // pavilion: lower girdle and mains
    tri.push([Gb[i], Hb[i], Lw[i]], [Hb[i], Gb[n(i + 1)], Lw[n(i + 1)]], [Hb[i], Lw[n(i + 1)], Lw[i]]);
    tri.push([Lw[i], Lw[n(i + 1)], culet]);
  }
  const pos = [], c = new Vector3(), ab = new Vector3(), ac = new Vector3(), nn = new Vector3();
  for (const t of tri) {
    const [A, B, C] = t.map((p) => new Vector3(...p));
    ab.subVectors(B, A); ac.subVectors(C, A); nn.crossVectors(ab, ac);
    c.copy(A).add(B).add(C).divideScalar(3);
    const out = c.clone().setY(c.y - 0.1 * Math.sign(c.y || 1) * 0); // outward from axis centre
    if (nn.dot(out) < 0) { pos.push(...A.toArray(), ...C.toArray(), ...B.toArray()); }
    else { pos.push(...A.toArray(), ...B.toArray(), ...C.toArray()); }
  }
  const g = new BufferGeometry();
  g.setAttribute("position", new Float32BufferAttribute(pos, 3));
  g.computeVertexNormals();
  return { geometry: g, glintPoints: [...T, ...S].map((p) => new Vector3(...p)) };
}

/* ---------- studio environment: dark room with strip lights ---------- */
function studio(renderer) {
  const env = new Scene();
  env.add(new Mesh(new BoxGeometry(30, 30, 30), new MeshBasicMaterial({ color: 0x07090d, side: BackSide })));
  const panel = (w, h, x, y, z, k, tint) => {
    const m = new MeshBasicMaterial({ color: new Color(tint || 0xffffff).multiplyScalar(k), toneMapped: false });
    const p = new Mesh(new PlaneGeometry(w, h), m);
    p.position.set(x, y, z); p.lookAt(0, 0, 0); env.add(p);
  };
  for (let i = 0; i < 16; i++) {
    const a = i / 16 * Math.PI * 2;
    panel(i % 2 ? 0.6 : 1.1, 10, Math.cos(a) * 9, 2, Math.sin(a) * 9, i % 2 ? 9 : 16, i % 5 === 0 ? 0xfff1dc : 0xf2f6ff);
  }
  for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2 + 0.3; panel(2.4, 0.5, Math.cos(a) * 5, 8, Math.sin(a) * 5, 20); }
  panel(5, 5, 0, 11, 0, 14);
  panel(3, 1.2, 4, 7, 5, 16);
  panel(3, 1.2, -5, 6, -3, 14, 0xe6f0ff);
  const pm = new PMREMGenerator(renderer);
  const tex = pm.fromScene(env, 0.004).texture;
  pm.dispose();
  return tex;
}

/* ---------- glint sprite texture, drawn in memory ---------- */
function glintTexture() {
  const s = 128, cv = document.createElement("canvas"); cv.width = cv.height = s;
  const g = cv.getContext("2d"), h = s / 2;
  const rad = g.createRadialGradient(h, h, 0, h, h, h);
  rad.addColorStop(0, "rgba(255,255,255,1)"); rad.addColorStop(0.12, "rgba(255,255,255,.55)"); rad.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = rad; g.fillRect(0, 0, s, s);
  g.globalCompositeOperation = "lighter";
  for (const [w, l] of [[3, h], [1.4, h * 0.6]]) {
    const ray = g.createLinearGradient(0, h, s, h);
    ray.addColorStop(0, "rgba(255,255,255,0)"); ray.addColorStop(0.5, "rgba(255,255,255,.9)"); ray.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = ray;
    g.save(); g.translate(h, h);
    for (const rot of (l === h ? [0, Math.PI / 2] : [Math.PI / 4, -Math.PI / 4])) { g.save(); g.rotate(rot); g.fillRect(-l, -w / 2, l * 2, w); g.restore(); }
    g.restore();
  }
  const t = new CanvasTexture(cv); t.colorSpace = SRGBColorSpace; return t;
}

/* ---------- lit velvet tray: spotlight, ring light and bokeh ---------- */
function trayTexture(col) {
  const s = 1024, cv = document.createElement("canvas"); cv.width = cv.height = s;
  const g = cv.getContext("2d"), h = s / 2;
  g.fillStyle = "#" + col.getHexString(); g.fillRect(0, 0, s, s);
  const spot = g.createRadialGradient(h, h, 0, h, h, s * 0.36);
  spot.addColorStop(0, "rgba(255,255,255,.22)"); spot.addColorStop(0.45, "rgba(214,226,255,.08)"); spot.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = spot; g.fillRect(0, 0, s, s);
  g.strokeStyle = "rgba(255,255,255,.8)"; g.lineWidth = 6; g.shadowColor = "rgba(255,255,255,.9)"; g.shadowBlur = 18;
  g.beginPath(); g.arc(h, h, s * 0.2, 0, Math.PI * 2); g.stroke();
  g.lineWidth = 4; g.strokeStyle = "rgba(255,240,220,.95)";
  g.beginPath(); g.arc(h, h, s * 0.12, 0, Math.PI * 2); g.stroke();
  g.shadowBlur = 0;
  for (let i = 0; i < 26; i++) {
    const a = i / 26 * Math.PI * 2 + (i % 3) * 0.07, r = s * (0.09 + (i % 5) * 0.055), x = h + Math.cos(a) * r, y = h + Math.sin(a) * r, rr = 10 + (i % 3) * 6;
    const bk = g.createRadialGradient(x, y, 0, x, y, rr);
    bk.addColorStop(0, i % 4 ? "rgba(255,255,255,.95)" : "rgba(255,232,205,.95)"); bk.addColorStop(0.55, "rgba(255,255,255,.35)"); bk.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = bk; g.beginPath(); g.arc(x, y, rr, 0, Math.PI * 2); g.fill();
  }
  const vig = g.createRadialGradient(h, h, s * 0.3, h, h, h);
  vig.addColorStop(0, "rgba(0,0,0,0)"); vig.addColorStop(1, "#" + col.getHexString());
  g.shadowBlur = 0; g.fillStyle = vig; g.fillRect(0, 0, s, s);
  const t = new CanvasTexture(cv); t.colorSpace = SRGBColorSpace; t.anisotropy = 4; return t;
}

function velvet() {
  const v = getComputedStyle(host).getPropertyValue("--velvet").trim();
  return new Color(v || "#0d1626");
}

function start() {
  if (!host || !webglOK()) return;
  let renderer;
  try {
    renderer = new WebGLRenderer({ antialias: true, alpha: false, powerPreference: "low-power" });
  } catch (e) { return; }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.12;
  renderer.outputColorSpace = SRGBColorSpace;
  const canvas = renderer.domElement;
  canvas.className = "gem3d";
  canvas.setAttribute("aria-hidden", "true");

  const scene = new Scene();
  scene.background = velvet();
  scene.environment = studio(renderer);

  const camera = new PerspectiveCamera(24, 1, 0.1, 60);
  camera.position.set(0, 5.6, 5.5);
  camera.lookAt(0, -0.18, 0);

  const trayMat = new MeshBasicMaterial({ map: trayTexture(scene.background) });
  const tray = new Mesh(new PlaneGeometry(9, 9), trayMat);
  tray.rotation.x = -Math.PI / 2; tray.position.y = -1.0; scene.add(tray);

  const { geometry, glintPoints } = brilliant();
  const material = new MeshPhysicalMaterial({
    color: 0xffffff, metalness: 0, roughness: 0, transmission: 1, thickness: 1.35,
    ior: 2.417, dispersion: 6, envMapIntensity: 3.4, specularIntensity: 1,
    attenuationColor: 0xffffff, attenuationDistance: 8, flatShading: true
  });
  const gem = new Mesh(geometry, material);
  const tilt = new Group(); tilt.add(gem); scene.add(tilt);
  tilt.rotation.x = 0.06;

  // glints
  const gtex = glintTexture();
  const glints = [];
  for (let i = 0; i < 7; i++) {
    const sp = new Sprite(new SpriteMaterial({ map: gtex, blending: AdditiveBlending, depthTest: false, depthWrite: false, transparent: true, opacity: 0 }));
    sp.userData = { idx: Math.floor(Math.random() * glintPoints.length), t0: Math.random() * 4, dur: 0.9 + Math.random() * 0.8, period: 3.2 + Math.random() * 3.5 };
    scene.add(sp); glints.push(sp);
  }

  // size
  function size() {
    const r = host.getBoundingClientRect();
    const w = Math.max(60, Math.round(r.width));
    renderer.setSize(w, w, true);
    camera.aspect = 1; camera.updateProjectionMatrix();
    draw();
  }

  // interaction: drag to turn
  let spin = 0, dragging = false, lastX = 0, lastY = 0, pitch = 0;
  canvas.addEventListener("pointerdown", (e) => { dragging = true; lastX = e.clientX; lastY = e.clientY; canvas.setPointerCapture(e.pointerId); });
  canvas.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    const dx = e.clientX - lastX, dy = e.clientY - lastY; lastX = e.clientX; lastY = e.clientY;
    gem.rotation.y += dx * 0.012; spin = dx * 0.012;
    pitch = Math.max(-0.35, Math.min(0.45, pitch + dy * 0.006));
    if (!running) draw();
  });
  const up = () => { dragging = false; };
  canvas.addEventListener("pointerup", up); canvas.addEventListener("pointercancel", up);

  // loop
  let last = performance.now(), elapsed = 0;
  let running = false, visible = true, raf = 0;
  const wp = new Vector3();
  function step() {
    const now = performance.now(), dt = Math.min((now - last) / 1000, 0.05); last = now; elapsed += dt; const t = elapsed;
    if (!dragging) { spin *= 0.94; gem.rotation.y += (reduce.matches ? 0 : 0.32 * dt) + spin; }
    tilt.rotation.x = 0.06 + pitch + (reduce.matches ? 0 : Math.sin(t * 0.6) * 0.035);
    if (!reduce.matches) {
      for (const sp of glints) {
        const u = sp.userData, ph = ((t + u.t0) % u.period) / u.dur;
        if (ph > 1 && sp.material.opacity === 0) continue;
        if (ph > 1) { sp.material.opacity = 0; u.idx = Math.floor(Math.random() * glintPoints.length); continue; }
        const k = Math.sin(ph * Math.PI);
        wp.copy(glintPoints[u.idx]); gem.localToWorld(wp);
        sp.position.copy(wp); sp.material.opacity = k * 0.95;
        sp.material.rotation = ph * 0.6;
        const s = 0.18 + k * 0.32; sp.scale.set(s, s, 1);
      }
    }
    draw();
  }
  function draw() { renderer.render(scene, camera); }
  function loop() { if (!running) return; step(); raf = requestAnimationFrame(loop); }
  function play() { if (running || reduce.matches || !visible || document.hidden) return; running = true; last = performance.now(); raf = requestAnimationFrame(loop); }
  function pause() { running = false; cancelAnimationFrame(raf); }

  host.appendChild(canvas);
  size();
  host.classList.add("gem3d-on");
  new ResizeObserver(size).observe(host);
  new IntersectionObserver((es) => { visible = es[0].isIntersecting; visible ? play() : pause(); }).observe(host);
  document.addEventListener("visibilitychange", () => (document.hidden ? pause() : play()));
  reduce.addEventListener("change", () => { reduce.matches ? (pause(), draw()) : play(); });
  const mq = window.matchMedia("(prefers-color-scheme: dark)");
  mq.addEventListener("change", () => { scene.background = velvet(); trayMat.map.dispose(); trayMat.map = trayTexture(scene.background); trayMat.needsUpdate = true; draw(); });
  canvas.addEventListener("webglcontextlost", (e) => { e.preventDefault(); pause(); host.classList.remove("gem3d-on"); canvas.remove(); });
  play();
}

start();
