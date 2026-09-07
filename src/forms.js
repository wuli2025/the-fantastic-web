import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { MeshSurfaceSampler } from 'three/addons/math/MeshSurfaceSampler.js';

// All three figures are built locally. No downloaded models or textures are needed.
const V = (a) => new THREE.Vector3(...a);
const silver = new THREE.Color('#c6d1c4');
const charcoal = new THREE.Color('#4b615a');
const orange = new THREE.Color('#d18a5d');

function randomGenerator(seed) {
  return () => {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let n = Math.imul(seed ^ seed >>> 15, 1 | seed);
    n = n + Math.imul(n ^ n >>> 7, 61 | n) ^ n;
    return ((n ^ n >>> 14) >>> 0) / 4294967296;
  };
}

function figureBuilder() {
  const parts = [];
  function add(geometry, center, scale = [1, 1, 1], color = silver, rotation = null, weight = 1, kind = '') {
    const mesh = new THREE.Mesh(geometry);
    mesh.position.copy(V(center)); mesh.scale.copy(V(scale));
    if (rotation) mesh.rotation.set(...rotation);
    mesh.updateMatrix();
    geometry.applyMatrix4(mesh.matrix);
    let area = 0;
    const p = geometry.attributes.position;
    const idx = geometry.index;
    const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3();
    for (let i = 0; i < (idx ? idx.count : p.count); i += 3) {
      a.fromBufferAttribute(p, idx ? idx.getX(i) : i);
      b.fromBufferAttribute(p, idx ? idx.getX(i + 1) : i + 1);
      c.fromBufferAttribute(p, idx ? idx.getX(i + 2) : i + 2);
      area += b.sub(a).cross(c.sub(a)).length() * .5;
    }
    mesh.position.set(0, 0, 0); mesh.scale.set(1, 1, 1); mesh.rotation.set(0, 0, 0); mesh.updateMatrix();
    parts.push({ mesh, area: area * weight, color, kind });
  }
  function ell(center, scale, color = silver, rotation = null, weight = 1, kind = '') {
    add(new THREE.SphereGeometry(1, 32, 24), center, scale, color, rotation, weight, kind);
  }
  function box(center, scale, radius = .08, color = silver, rotation = null, weight = 1) {
    add(new RoundedBoxGeometry(...scale, 4, radius), center, [1, 1, 1], color, rotation, weight);
  }
  function limb(a, b, radiusA, radiusB, color = silver) {
    const direction = V(b).sub(V(a));
    const geometry = new THREE.CylinderGeometry(radiusB, radiusA, direction.length(), 20, 8, true);
    geometry.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.clone().normalize()));
    add(geometry, V(a).add(V(b)).multiplyScalar(.5).toArray(), [1, 1, 1], color);
    ell(a, [radiusA, radiusA, radiusA], color);
    ell(b, [radiusB, radiusB, radiusB], color);
  }
  function ring(center, radius, tube, rotation = [Math.PI / 2, 0, 0], color = charcoal, scale = [1, 1, 1]) {
    add(new THREE.TorusGeometry(radius, tube, 8, 64), center, scale, color, rotation, 1.7);
  }
  function curve(points, radius, color = silver, weight = 1) {
    add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(V)), 48, radius, 8, false), [0, 0, 0], [1, 1, 1], color, null, weight);
  }
  return { parts, ell, box, limb, ring, curve };
}

function explorer() {
  const f = figureBuilder();
  const { ell, box, limb, ring, curve } = f;
  box([0, .39, -.30], [.88, 1.18, .50], .12, charcoal);
  box([0, .47, -.57], [.67, .83, .16], .06);
  for (const s of [-1, 1]) {
    box([s * .46, .41, -.38], [.16, .90, .29], .05);
    box([s * .46, .30, -.54], [.07, .43, .025], .014, orange);
  }
  ell([0, .39, 0], [.53, .63, .34]);
  ell([0, -.17, 0], [.42, .24, .29]);
  ring([0, .96, 0], .30, .055, undefined, charcoal, [1, 1, .82]);
  ring([0, .995, 0], .31, .018, undefined, silver, [1, 1, .85]);
  ell([0, 1.34, .015], [.47, .47, .445], silver, null, 1.25, 'helmet');
  const visor = [];
  for (let i = 0; i <= 64; i++) {
    const t = i / 64 * Math.PI * 2;
    visor.push([.383 * Math.cos(t), 1.34 + .29 * Math.sin(t), .29 + .02 * Math.cos(t * 2)]);
  }
  curve(visor, .021, silver, 2);
  curve([[-.29, 1.51, .325], [-.10, 1.60, .382], [.09, 1.59, .39]], .008, silver, 3);
  for (const s of [-1, 1]) {
    ell([s * .465, 1.31, 0], [.035, .135, .12], charcoal);
    ell([s * .49, 1.31, 0], [.01, .072, .073]);
  }
  box([0, .52, .322], [.46, .32, .065], .035, charcoal);
  box([0, .55, .361], [.35, .17, .02], .018, silver);
  for (let i = 0; i < 4; i++) ell([-.12 + i * .079, .395, .372], [.018, .018, .009], i === 0 ? orange : silver);
  box([.29, .80, .267], [.11, .057, .018], .012, orange);
  for (let j = 0; j < 3; j++) ring([0, -.02 - j * .075, 0], .36, .019, undefined, charcoal, [1.14, 1, .8]);
  curve([[-.30, .18, .3], [-.47, -.08, .41], [-.29, -.31, .42], [.10, -.28, .35], [.29, .03, .28]], .033, orange);
  limb([-.48, .73, 0], [-.77, .24, .10], .22, .175);
  limb([-.77, .24, .10], [-1.02, -.13, .30], .177, .132);
  limb([.49, .73, 0], [.77, .37, .04], .215, .172);
  limb([.77, .37, .04], [.95, .07, .33], .17, .132);
  ell([-.51, .73, 0], [.22, .24, .23]);
  ell([.51, .73, 0], [.22, .24, .23]);
  box([-.615, .68, .18], [.14, .14, .028], .016, orange, [0, 0, -.43]);
  for (const [x, y, z, tilt] of [[-1.01, -.10, .28, -.50], [.94, .10, .31, .50]]) {
    for (let j = 0; j < 3; j++) ring([x, y + j * .04, z], .134, .014, [Math.PI / 2, tilt, 0], j === 1 ? orange : charcoal);
    ell([x * 1.08, y - .16, z + .035], [.137, .17, .10], silver, [0, 0, tilt]);
    ell([x * .97, y - .15, z + .11], [.055, .10, .06]);
  }
  limb([-.23, -.23, 0], [-.32, -.88, .08], .238, .192);
  limb([-.32, -.88, .08], [-.41, -1.48, .17], .189, .15);
  limb([.23, -.23, 0], [.35, -.86, -.07], .238, .19);
  limb([.35, -.86, -.07], [.45, -1.42, -.20], .185, .15);
  for (const [x, y, z] of [[-.32, -.88, .08], [.35, -.86, -.07]]) {
    box([x, y, z + .17], [.25, .25, .055], .055, charcoal);
    for (let j = 0; j < 3; j++) ring([x, y - .11 - j * .046, z], .182, .011, undefined, charcoal, [1, 1, .92]);
  }
  for (const [x, y, z] of [[-.41, -1.5, .17], [.45, -1.44, -.20]]) {
    box([x, y - .04, z + .11], [.34, .28, .50], .085);
    box([x, y - .16, z + .11], [.35, .065, .51], .025, charcoal);
    ring([x, y + .09, z], .155, .022, undefined, orange);
  }
  return f.parts;
}

function head(f, center, scale = 1, tilt = 0) {
  const [x, y, z] = center;
  f.ell(center, [.17 * scale, .235 * scale, .18 * scale], silver, [0, 0, tilt]);
  f.ell([x, y - .07 * scale, z + .105 * scale], [.125 * scale, .12 * scale, .12 * scale]);
  f.ell([x, y - .018 * scale, z + .181 * scale], [.034 * scale, .056 * scale, .053 * scale]);
  for (const side of [-1, 1]) {
    f.ell([x + side * .17 * scale, y - .02 * scale, z], [.025 * scale, .06 * scale, .032 * scale]);
    f.curve([[x + side * .026 * scale, y + .045 * scale, z + .173 * scale], [x + side * .095 * scale, y + .058 * scale, z + .16 * scale]], .01 * scale, charcoal);
  }
}

function dancer() {
  const f = figureBuilder();
  const { ell, limb, curve } = f;
  ell([-.08, .39, 0], [.285, .40, .18], silver, [0, 0, -.21]);
  ell([-.01, .00, -.015], [.205, .25, .145], silver, [0, 0, -.17]);
  ell([.08, -.22, -.015], [.285, .21, .19], silver, [0, 0, -.15]);
  limb([-.14, .72, 0], [-.19, .92, .025], .086, .079);
  head(f, [-.20, 1.105, .026], 1, .10);
  ell([-.20, 1.16, -.045], [.175, .202, .13], charcoal);
  ell([-.22, 1.25, -.18], [.103, .10, .10], charcoal);
  // A lifted, asymmetrical port de bras, with individually articulated fingers.
  limb([-.29, .65, 0], [-.75, .93, -.015], .12, .078);
  limb([-.75, .93, -.015], [-.60, 1.47, .07], .077, .046);
  ell([-.57, 1.55, .07], [.057, .108, .037], silver, [0, 0, -.3]);
  limb([.18, .65, 0], [.57, 1.10, -.04], .119, .073);
  limb([.57, 1.10, -.04], [.22, 1.60, .08], .071, .044);
  ell([.16, 1.65, .08], [.05, .103, .033], silver, [0, 0, -1.0]);
  for (let i = 0; i < 4; i++) {
    limb([-.61 + i * .026, 1.61, .075], [-.60 + i * .033, 1.75 - Math.abs(1.5 - i) * .023, .083], .012, .008);
    limb([.10, 1.64 + i * .02, .08], [-.02 - (i % 2) * .027, 1.66 + i * .026, .09], .011, .007);
  }
  limb([-.045, -.33, -.01], [-.23, -.94, .06], .157, .092);
  ell([-.16, -.61, .01], [.158, .30, .145], silver, [0, 0, -.25]);
  limb([-.23, -.94, .06], [-.27, -1.54, .065], .093, .047);
  ell([-.245, -1.15, .03], [.093, .19, .095]);
  ell([-.265, -1.69, .12], [.06, .165, .083], silver, [.2, 0, 0]);
  limb([.23, -.29, 0], [.72, -.65, .02], .15, .09);
  ell([.49, -.45, 0], [.14, .29, .135], silver, [0, 0, .93]);
  limb([.72, -.65, .02], [1.03, -.22, -.06], .089, .045);
  ell([.88, -.45, -.03], [.09, .19, .087], silver, [0, 0, -.55]);
  ell([1.075, -.09, -.035], [.05, .15, .07], silver, [0, 0, -.25]);
  // Thin ribbons describe movement without hiding the human silhouette.
  curve([[-.59, 1.56, .06], [-1.01, 1.12, -.05], [-1.16, .40, -.25], [-.88, -.20, -.4], [-.14, -.50, -.43], [.63, -.20, -.31]], .008, orange, 1.2);
  curve([[.18, 1.66, .07], [.90, 1.53, -.1], [1.16, .89, -.45], [.81, .43, -.54]], .007, orange, 1.2);
  return f.parts;
}

function runner() {
  const f = figureBuilder();
  const { ell, limb, curve, box } = f;
  ell([.14, .38, 0], [.32, .46, .205], silver, [0, 0, -.38]);
  ell([-.04, .00, 0], [.224, .29, .17], silver, [0, 0, -.36]);
  ell([-.17, -.23, 0], [.30, .23, .205], charcoal, [0, 0, -.32]);
  limb([.27, .77, 0], [.34, .97, .025], .10, .089);
  head(f, [.40, 1.14, .06], 1.05, -.23);
  ell([.408, 1.24, .005], [.176, .16, .169], charcoal, [0, 0, -.23]);
  // Front arm drives forward; the back arm counterbalances in depth.
  limb([.36, .66, .13], [.80, .24, .24], .148, .083);
  ell([.58, .47, .20], [.125, .24, .116], silver, [0, 0, .76]);
  limb([.80, .24, .24], [1.11, .62, .36], .087, .055);
  ell([1.15, .70, .36], [.078, .109, .077], silver, [0, 0, -.28]);
  limb([-.075, .62, -.10], [-.63, .33, -.24], .133, .078);
  limb([-.63, .33, -.24], [-.87, .68, -.30], .078, .05);
  ell([-.92, .76, -.30], [.075, .106, .07], silver, [0, 0, -.36]);
  limb([-.07, -.30, .10], [.58, -.63, .15], .186, .106);
  ell([.24, -.46, .14], [.17, .34, .15], silver, [0, 0, 1.1]);
  limb([.58, -.63, .15], [.38, -1.28, .27], .105, .055);
  ell([.50, -.89, .18], [.10, .22, .11], silver, [0, 0, -.28]);
  box([.51, -1.39, .32], [.43, .17, .23], .065, silver, [0, 0, .18]);
  box([.52, -1.46, .32], [.45, .055, .25], .025, orange, [0, 0, .18]);
  limb([-.31, -.29, -.11], [-.79, -.87, -.18], .178, .098);
  ell([-.54, -.55, -.13], [.17, .31, .15], silver, [0, 0, -.68]);
  limb([-.79, -.87, -.18], [-1.30, -.62, -.29], .10, .054);
  ell([-1.04, -.76, -.22], [.092, .22, .10], silver, [0, 0, 1.12]);
  box([-1.37, -.52, -.24], [.20, .38, .23], .065, silver, [0, 0, -.35]);
  box([-1.47, -.55, -.24], [.055, .37, .25], .022, orange, [0, 0, -.35]);
  curve([[.18, .74, .195], [.12, .48, .223], [-.035, .21, .185]], .012, orange, 2);
  for (let i = 0; i < 3; i++) {
    curve([[-.45, .40 - i * .15, -.3], [-1.00, .49 - i * .17, -.37], [-1.6, .42 - i * .18, -.41], [-1.94 - i * .10, .28 - i * .18, -.4]], .005, orange, .8);
  }
  return f.parts;
}

export const formInfo = [
  { code: 'HOMO EXPLORANS', caption: '无垠之境，始于好奇。', name: '探索者，宇航员' },
  { code: 'HOMO LUDENS', caption: '让身体，成为自由的诗。', name: '舞动者，舞者' },
  { code: 'HOMO MOVENS', caption: '向前，是一种本能。', name: '逐风者，奔跑者' },
];

export function createForms(count) {
  const light = new THREE.Vector3(-.55, .8, 1).normalize();
  return [explorer, dancer, runner].map((build, formIndex) => {
    const parts = build();
    const random = randomGenerator(818 + formIndex * 31);
    let total = 0;
    for (const part of parts) {
      total += part.area; part.cumulative = total;
      part.sampler = new MeshSurfaceSampler(part.mesh).setRandomGenerator(random).build();
    }
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const pos = new THREE.Vector3(), normal = new THREE.Vector3();
    for (let i = 0; i < count; i++) {
      const pick = random() * total;
      let lo = 0, hi = parts.length - 1;
      while (lo < hi) { const mid = (lo + hi) >> 1; if (parts[mid].cumulative < pick) lo = mid + 1; else hi = mid; }
      const part = parts[lo]; part.sampler.sample(pos, normal);
      let brightness = .31 + Math.max(0, normal.dot(light)) * .63 + Math.pow(1 - Math.abs(normal.z), 3) * .19;
      brightness *= .75 + random() * .5;
      let color = part.color;
      if (part.kind === 'helmet' && normal.z > .50 && normal.y < .59 && normal.y > -.61) {
        color = charcoal;
        brightness *= .35;
        // A narrow reflection across the dark helmet visor.
        if (pos.x < -.15 && pos.y > 1.34 && pos.y < 1.56) brightness *= 2.9;
      }
      positions.set([pos.x, pos.y, pos.z], i * 3);
      colors.set([color.r * brightness, color.g * brightness, color.b * brightness], i * 3);
    }
    for (const part of parts) { part.mesh.geometry.dispose(); part.mesh.material.dispose(); }
    return { positions, colors };
  });
}
