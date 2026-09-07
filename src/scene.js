import * as THREE from 'three';
import { createForms } from './forms.js';

const vertexShader = `
  attribute vec3 aTarget;
  attribute vec3 aColorFrom;
  attribute vec3 aColorTo;
  attribute float aSeed;
  uniform float uTime;
  uniform float uMorph;
  uniform float uBurst;
  uniform float uPixelRatio;
  uniform float uSize;
  uniform float uMotion;
  uniform vec3 uPointer;
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    float t = smoothstep(0.0, 1.0, uMorph);
    float wave = sin(t * 3.14159265);
    vec3 p = mix(position, aTarget, t);
    float seed = aSeed * 6.2831853;
    vec3 flow = vec3(sin(seed * 3.0 + uTime * .39), cos(seed * 4.0 + uTime * .31), sin(seed * 7.0 - uTime * .25));
    p += flow * .012 * uMotion;
    vec3 swirl = vec3(sin(seed + p.y * 2.0 + t * 4.0), cos(seed * 1.7 + t * 3.0), cos(seed + p.x * 2.0 + t * 4.0));
    p += swirl * wave * (0.5 + aSeed * 1.35) * uMotion;
    vec3 outward = normalize(p + flow * .45 + vec3(.001));
    p += (outward * (1.0 + aSeed * 2.7) + flow * .8) * uBurst;
    vec3 delta = p - uPointer;
    float dist = length(delta.xy);
    float force = (1.0 - smoothstep(.0, .62, dist)) * .19 * uMotion;
    p.xy += normalize(delta.xy + vec2(.0001)) * force;
    p.z += force * sin(seed) * .8;
    vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    gl_PointSize = clamp((8.3 + aSeed * 8.0) * uPixelRatio * uSize / -mvPosition.z, .65, 6.0 * uPixelRatio);
    vColor = mix(aColorFrom, aColorTo, t);
    vec3 hot = vec3(.94, .31, .105);
    vColor = mix(vColor, hot, min(.8, wave * .78 + uBurst * .38 + force * 1.3));
    vAlpha = (0.64 + aSeed * .36) * (1.0 - uBurst * .19);
  }
`;

const fragmentShader = `
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    float d = length(gl_PointCoord - .5);
    if (d > .5) discard;
    float alpha = (1.0 - smoothstep(.18, .5, d)) * vAlpha;
    gl_FragColor = vec4(vColor * 1.24, alpha);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

export class ParticleScene {
  constructor(container, { onQualityChange, onReady, onUnsupported }) {
    this.container = container;
    this.onQualityChange = onQualityChange;
    this.mobile = matchMedia('(max-width: 760px)').matches;
    this.reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.count = 48000;
    this.highQuality = !this.mobile;
    this.selected = 0;
    this.rotation = -.32;
    this.rotationTarget = -.32;
    this.pointer = new THREE.Vector2(5, 5);
    this.pointerWorld = new THREE.Vector3(999, 999, 0);
    this.burstTarget = 0;
    this.clockTime = 0;
    this.lastTime = 0;
    this.paused = false;
    this.frameId = null;

    try {
      this.renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true, powerPreference: 'high-performance' });
    } catch {
      onUnsupported(); return;
    }
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, this.mobile ? 1.5 : 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(this.renderer.domElement);
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(38, 1, .1, 40);
    this.camera.position.set(0, 0, 8);
    this.group = new THREE.Group();
    this.scene.add(this.group);
    this.forms = createForms(this.count);

    const seeds = new Float32Array(this.count);
    for (let i = 0; i < this.count; i++) seeds[i] = Math.random();
    this.geometry = new THREE.BufferGeometry();
    this.geometry.setAttribute('position', new THREE.BufferAttribute(this.forms[0].positions.slice(), 3).setUsage(THREE.DynamicDrawUsage));
    this.geometry.setAttribute('aTarget', new THREE.BufferAttribute(this.forms[0].positions.slice(), 3).setUsage(THREE.DynamicDrawUsage));
    this.geometry.setAttribute('aColorFrom', new THREE.BufferAttribute(this.forms[0].colors.slice(), 3).setUsage(THREE.DynamicDrawUsage));
    this.geometry.setAttribute('aColorTo', new THREE.BufferAttribute(this.forms[0].colors.slice(), 3).setUsage(THREE.DynamicDrawUsage));
    this.geometry.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1));
    this.uniforms = {
      uTime: { value: 0 }, uMorph: { value: 1 }, uBurst: { value: this.reducedMotion ? 0 : .8 },
      uPixelRatio: { value: this.renderer.getPixelRatio() }, uPointer: { value: this.pointerWorld },
      uSize: { value: this.mobile ? 1.25 : 1.0 }, uMotion: { value: this.reducedMotion ? 0 : 1 },
    };
    this.material = new THREE.ShaderMaterial({
      uniforms: this.uniforms, vertexShader, fragmentShader,
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    });
    this.points = new THREE.Points(this.geometry, this.material);
    this.points.frustumCulled = false;
    this.group.add(this.points);
    this.addAtmosphere();
    this.resize();
    this.setQuality(this.highQuality);
    this.resizeHandler = () => this.resize();
    this.visibilityHandler = () => {
      if (document.hidden) { cancelAnimationFrame(this.frameId); this.frameId = null; }
      else if (!this.paused && this.frameId === null) { this.lastTime = performance.now(); this.animate(this.lastTime); }
    };
    window.addEventListener('resize', this.resizeHandler);
    document.addEventListener('visibilitychange', this.visibilityHandler);
    this.contextLostHandler = (event) => {
      event.preventDefault(); this.paused = true; cancelAnimationFrame(this.frameId); this.frameId = null; onUnsupported();
    };
    this.renderer.domElement.addEventListener('webglcontextlost', this.contextLostHandler);
    this.animate = this.animate.bind(this);
    this.animate(performance.now());
    onReady();
  }

  addAtmosphere() {
    const data = new Float32Array(1100 * 3);
    const colors = new Float32Array(1100 * 3);
    for (let i = 0; i < 1100; i++) {
      data.set([(Math.random() - .5) * 17, (Math.random() - .5) * 9, (Math.random() - .5) * 8 - 2], i * 3);
      const warm = Math.random() > .85;
      const luminosity = .08 + Math.random() * .25;
      colors.set(warm ? [luminosity, luminosity * .46, luminosity * .20] : [luminosity * .71, luminosity, luminosity * .83], i * 3);
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(data, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    this.dust = new THREE.Points(geometry, new THREE.PointsMaterial({ size: .009, vertexColors: true, transparent: true, opacity: .58, depthWrite: false, blending: THREE.AdditiveBlending }));
    this.scene.add(this.dust);

    const floorGeometry = new THREE.PlaneGeometry(5, 5);
    const floorMaterial = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false,
      uniforms: { uOpacity: { value: .22 } },
      vertexShader: 'varying vec2 vUv; void main(){vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
      fragmentShader: 'varying vec2 vUv; uniform float uOpacity; void main(){float d=length(vUv-.5);float a=exp(-d*d*30.0)*uOpacity;gl_FragColor=vec4(.37,.47,.39,a);}',
      blending: THREE.AdditiveBlending,
    });
    this.floor = new THREE.Mesh(floorGeometry, floorMaterial);
    this.floor.rotation.x = -Math.PI / 2;
    this.floor.position.y = -1.90;
    this.group.add(this.floor);
    const circle = [];
    for (let i = 0; i <= 160; i++) {
      const a = i / 160 * Math.PI * 2;
      circle.push(new THREE.Vector3(Math.cos(a) * 1.27, -1.88, Math.sin(a) * 1.27));
    }
    const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(circle), new THREE.LineBasicMaterial({ color: '#6c826d', transparent: true, opacity: .19 }));
    this.group.add(line);
    const ticks = [];
    for (let i = 0; i < 80; i++) {
      const a = i / 80 * Math.PI * 2;
      const r = i % 10 === 0 ? 1.36 : 1.30;
      ticks.push(new THREE.Vector3(Math.cos(a) * 1.27, -1.88, Math.sin(a) * 1.27), new THREE.Vector3(Math.cos(a) * r, -1.88, Math.sin(a) * r));
    }
    this.group.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(ticks), new THREE.LineBasicMaterial({ color: '#8f9a80', transparent: true, opacity: .27 })));
  }

  resize() {
    this.mobile = innerWidth <= 760;
    const w = this.container.clientWidth, h = this.container.clientHeight;
    this.renderer.setSize(w, h);
    this.camera.aspect = w / h;
    this.camera.fov = this.mobile ? 46 : 38;
    this.camera.updateProjectionMatrix();
    const worldHeight = 2 * Math.tan(THREE.MathUtils.degToRad(this.camera.fov * .5)) * 8;
    this.worldWidth = worldHeight * this.camera.aspect;
    this.group.position.x = this.worldWidth * (this.mobile ? .145 : .171);
    this.group.position.y = this.mobile ? -.24 : .30;
    const shortViewport = h < 650;
    this.group.scale.setScalar(this.mobile ? (shortViewport ? .65 : .75) : (shortViewport ? .73 : .86));
    this.group.children.forEach(child => { if (child !== this.points) child.visible = !this.mobile; });
    this.uniforms.uSize.value = this.mobile ? 1.18 : 1.06;
    this.container.dataset.ready = 'true';
  }

  setForm(index) {
    if (!this.geometry || index === this.selected) return;
    const { position, aTarget, aColorFrom, aColorTo } = this.geometry.attributes;
    const phase = THREE.MathUtils.smoothstep(this.uniforms.uMorph.value, 0, 1);
    for (let i = 0; i < position.array.length; i++) {
      position.array[i] += (aTarget.array[i] - position.array[i]) * phase;
      aColorFrom.array[i] += (aColorTo.array[i] - aColorFrom.array[i]) * phase;
    }
    aTarget.array.set(this.forms[index].positions);
    aColorTo.array.set(this.forms[index].colors);
    for (const attribute of [position, aTarget, aColorFrom, aColorTo]) attribute.needsUpdate = true;
    this.uniforms.uMorph.value = this.reducedMotion ? 1 : 0;
    this.rotationTarget = index === 2 ? -.45 : index === 1 ? -.22 : -.32;
    this.selected = index;
    this.container.dataset.form = String(index);
  }

  setQuality(high) {
    if (!this.geometry) return;
    this.highQuality = high;
    this.geometry.setDrawRange(0, high ? this.count : 18000);
    const ratio = high ? Math.min(devicePixelRatio, 2) : Math.min(devicePixelRatio, 1.25);
    this.renderer.setPixelRatio(ratio);
    this.uniforms.uPixelRatio.value = ratio;
    this.onQualityChange(high, high ? this.count : 18000);
  }

  setPointer(x, y) {
    this.pointer.set(x / this.container.clientWidth * 2 - 1, -y / this.container.clientHeight * 2 + 1);
  }

  clearPointer() { this.pointer.set(5, 5); }
  rotate(delta) { this.rotationTarget += delta * .006; }
  burst(value) { this.burstTarget = value ? (this.reducedMotion ? .3 : 1) : 0; }
  pause(value) {
    if (!this.renderer || !this.geometry) return;
    this.paused = value;
    if (value) { cancelAnimationFrame(this.frameId); this.frameId = null; }
    else if (!document.hidden && this.frameId === null) { this.lastTime = performance.now(); this.animate(this.lastTime); }
  }

  animate(now) {
    if (this.paused || document.hidden) return;
    const dt = Math.min((now - (this.lastTime || now)) / 1000, .05);
    this.lastTime = now;
    this.clockTime += dt;
    const damping = 1 - Math.exp(-dt * 5);
    this.uniforms.uTime.value = this.reducedMotion ? 0 : this.clockTime;
    this.uniforms.uMorph.value = Math.min(1, this.uniforms.uMorph.value + dt / 1.65);
    this.uniforms.uBurst.value += (this.burstTarget - this.uniforms.uBurst.value) * damping;
    const hover = this.pointer.x > 2 || this.reducedMotion ? 0 : this.pointer.x * .10;
    this.rotation += (this.rotationTarget + hover - this.rotation) * damping;
    this.group.rotation.y = this.rotation + (this.reducedMotion ? 0 : Math.sin(this.clockTime * .22) * .06);
    this.points.position.y = this.reducedMotion ? 0 : Math.sin(this.clockTime * .7) * .043;
    this.points.rotation.z = this.reducedMotion ? 0 : Math.sin(this.clockTime * .36) * .013;
    this.dust.rotation.y = this.reducedMotion ? 0 : this.clockTime * .006;
    this.group.updateMatrixWorld();
    if (this.pointer.x > 2) this.pointerWorld.set(999, 999, 0);
    else {
      this.pointerWorld.set(this.pointer.x, this.pointer.y, .5).unproject(this.camera);
      const direction = this.pointerWorld.sub(this.camera.position).normalize();
      const distance = -this.camera.position.z / direction.z;
      this.pointerWorld.copy(this.camera.position).addScaledVector(direction, distance);
      this.group.worldToLocal(this.pointerWorld);
    }
    this.renderer.render(this.scene, this.camera);
    this.frameId = requestAnimationFrame(this.animate);
  }

  dispose() {
    if (!this.renderer) return;
    cancelAnimationFrame(this.frameId);
    window.removeEventListener('resize', this.resizeHandler);
    document.removeEventListener('visibilitychange', this.visibilityHandler);
    this.renderer.domElement.removeEventListener('webglcontextlost', this.contextLostHandler);
    this.scene.traverse(object => { object.geometry?.dispose(); if (object.material) object.material.dispose(); });
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }
}
