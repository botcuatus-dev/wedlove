(function f(){const s=document.getElementById('sandbox')||document.body;s?s.append(document.createRange().createContextualFragment(`<div id="webgl-container"></div><div class="top-bar"><button class="icon-btn" id="audio-btn" title="Bật/Tắt Nhạc"><i class="fas fa-music"></i></button><!-- <button class="icon-btn" id="reset-cam-btn" title="Góc nhìn ban đầu"></button> --></div><div class="click-hint">Chạm vào lồng đèn để xem câu chúc Trung Thu</div><div class="wish-modal" id="wishModal"><div class="wish-card"><button class="close-btn" id="closeWishBtn"><i class="fas fa-times"></i></button><h3 id="wishTitle">Lời nhắn</h3><img id="wishImage" class="wish-image" src="" alt="Đêm trăng Trung Thu"><p id="wishText">"Chúc bạn một đêm Trung Thu ấm áp, bình an và trọn vẹn bên những người thương yêu."</p><div class="tag" id="wishTag">✦ Trung Thu An Lành ✦</div></div></div><audio id="bgm" loop playsinline preload="auto" src=""></audio>`)):setTimeout(f,4)})();

const container = document.getElementById('webgl-container');

function showError(message) {
    container.innerHTML = `<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;padding:24px;text-align:center;color:#ffe8c7;font:600 15px Quicksand,sans-serif;background:radial-gradient(circle at 50% 35%,#17102a 0%,#05030b 65%);z-index:999"><div><div style="font-size:42px;margin-bottom:14px">🌙</div><div style="font-size:20px;margin-bottom:8px">Không thể khởi tạo cảnh 3D</div><div style="opacity:.75;line-height:1.6">${message}</div></div></div>`;
}

if (!window.THREE) {
    showError('Three.js chưa được tải.');
    throw new Error('THREE is not available');
}
if (!THREE.WebGLRenderer) {
    showError('Trình duyệt không hỗ trợ WebGL.');
    throw new Error('WebGLRenderer is not available');
}
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 768;

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x060312, 0.008);

const camera = new THREE.PerspectiveCamera(
    isMobile ? 60 : 45,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
);

const DEFAULT_CAM_POS = isMobile ? new THREE.Vector3(0, 12, 48) : new THREE.Vector3(0, 10, 42);
const DEFAULT_CAM_TARGET = new THREE.Vector3(0, 6.5, 0);

camera.position.copy(DEFAULT_CAM_POS);

let renderer;
try {
    renderer = new THREE.WebGLRenderer({ antialias: !isMobile, alpha: false, powerPreference: "high-performance" });
} catch (error) {
    console.error(error);
    showError('WebGL không khả dụng trên thiết bị này.');
    throw error;
}
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.5 : 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;
container.appendChild(renderer.domElement);

const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.maxPolarAngle = Math.PI / 2 + 0.05;
controls.minDistance = 8;
controls.maxDistance = 85;
controls.target.copy(DEFAULT_CAM_TARGET);

// LIGHTS
const ambientLight = new THREE.AmbientLight(0x32164d, 1.6);
scene.add(ambientLight);

const treeLight = new THREE.PointLight(0xffb7c5, 2.5, 45);
treeLight.position.set(0, 8.5, 0);
scene.add(treeLight);

const warmLight = new THREE.PointLight(0xffaa33, 2.0, 30);
warmLight.position.set(0, -2, 0);
scene.add(warmLight);

const moonLight = new THREE.DirectionalLight(0xfff3e0, 1.1);
moonLight.position.set(-25, 30, -30);
scene.add(moonLight);

// CANVAS TEXTURE CHO HẠT VÀ HOÀ QUANG
function createParticleTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    grad.addColorStop(0, 'rgba(255,255,255,1)');
    grad.addColorStop(0.35, 'rgba(255,209,220,0.8)');
    grad.addColorStop(1, 'rgba(255,209,220,0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(16, 16, 16, 0, Math.PI * 2);
    ctx.fill();
    return new THREE.CanvasTexture(canvas);
}
const particleTexture = createParticleTexture();

// MẶT TRĂNG
const moonGroup = new THREE.Group();
moonGroup.position.set(-25, 28, -35);

const moonGeo = new THREE.SphereGeometry(5.5, 32, 32);
const moonMat = new THREE.MeshStandardMaterial({
    color: 0xfff3d6,
    emissive: 0xffe6a3,
    emissiveIntensity: 0.55,
    roughness: 0.7
});
const moonMesh = new THREE.Mesh(moonGeo, moonMat);
moonGroup.add(moonMesh);

const moonGlowMat = new THREE.SpriteMaterial({
    map: particleTexture,
    color: 0xffebad,
    transparent: true,
    opacity: 0.45,
    blending: THREE.AdditiveBlending
});
const moonGlow = new THREE.Sprite(moonGlowMat);
moonGlow.scale.set(24, 24, 1);
moonGroup.add(moonGlow);

scene.add(moonGroup);

// ISLAND (ĐẢO NỔI DƯỚI ĐẤT)
const islandGroup = new THREE.Group();
scene.add(islandGroup);

const islandGeo = new THREE.CylinderGeometry(8.5, 2.2, 7.5, isMobile ? 32 : 48, 12);
const posAttr = islandGeo.attributes.position;
for (let i = 0; i < posAttr.count; i++) {
    const vx = posAttr.getX(i);
    const vy = posAttr.getY(i);
    const vz = posAttr.getZ(i);

    const distFromCenter = Math.sqrt(vx * vx + vz * vz);
    const noise = Math.sin(vx * 0.8) * Math.cos(vz * 0.8) * 0.6 + Math.sin(vx * 1.8 + vz * 1.5) * 0.3;

    if (vy > 0) {
        posAttr.setY(i, vy + noise * (1.0 - distFromCenter / 12));
    } else {
        posAttr.setX(i, vx + (Math.random() - 0.5) * 1.4);
        posAttr.setZ(i, vz + (Math.random() - 0.5) * 1.4);
    }
}
islandGeo.computeVertexNormals();

const islandMat = new THREE.MeshStandardMaterial({ color: 0x1d111a, roughness: 0.9, flatShading: true });
const islandMesh = new THREE.Mesh(islandGeo, islandMat);
islandGroup.add(islandMesh);

function createGrassTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    const gradBg = ctx.createRadialGradient(256, 256, 10, 256, 256, 300);
    gradBg.addColorStop(0, '#4a5058');
    gradBg.addColorStop(0.55, '#2b2f36');
    gradBg.addColorStop(1, '#15181c');
    ctx.fillStyle = gradBg;
    ctx.fillRect(0, 0, 512, 512);

    for (let i = 0; i < 600; i++) {
        const x = Math.random() * 512;
        const y = Math.random() * 512;
        const r = 8 + Math.random() * 28;
        const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
        grad.addColorStop(0, 'rgba(210, 220, 230, 0.22)');
        grad.addColorStop(1, 'rgba(210, 220, 230, 0.22)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
    }

    const snowColors = ['#ffffff', '#e2e8f0', '#cbd5e1', '#94a3b8'];
    for (let i = 0; i < 350; i++) {
        const fx = Math.random() * 512;
        const fy = Math.random() * 512;
        ctx.fillStyle = snowColors[Math.floor(Math.random() * snowColors.length)];
        ctx.beginPath();
        ctx.arc(fx, fy, 0.8 + Math.random() * 1.4, 0, Math.PI * 2);
        ctx.fill();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(2.5, 2.5);
    return texture;
}

const topGeo = new THREE.CylinderGeometry(8.6, 7.8, 0.8, isMobile ? 32 : 48, 6);
const topPos = topGeo.attributes.position;
for (let i = 0; i < topPos.count; i++) {
    const vx = topPos.getX(i);
    const vy = topPos.getY(i);
    const vz = topPos.getZ(i);
    const noise = Math.sin(vx * 0.9) * Math.cos(vz * 0.9) * 0.5 + Math.cos(vx * 1.5 + vz * 1.2) * 0.2;
    topPos.setY(i, vy + noise * 0.4);
}
topGeo.computeVertexNormals();

const topMat = new THREE.MeshStandardMaterial({
    map: createGrassTexture(),
    roughness: 0.5,
    metalness: 0.1,
    bumpScale: 0.05
});
const topMesh = new THREE.Mesh(topGeo, topMat);
topMesh.position.y = 3.6;
islandGroup.add(topMesh);

const rockCount = isMobile ? 12 : 22;
for (let i = 0; i < rockCount; i++) {
    const size = 0.3 + Math.random() * 0.5;
    const rockGeo = new THREE.DodecahedronGeometry(size, 1);

    const rPos = rockGeo.attributes.position;
    for (let j = 0; j < rPos.count; j++) {
        rPos.setX(j, rPos.getX(j) * (0.7 + Math.random() * 0.6));
        rPos.setY(j, rPos.getY(j) * (0.4 + Math.random() * 0.5));
        rPos.setZ(j, rPos.getZ(j) * (0.7 + Math.random() * 0.6));
    }
    rockGeo.computeVertexNormals();

    const rockMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color().setHSL(0.7 + Math.random() * 0.1, 0.2, 0.25 + Math.random() * 0.15),
        roughness: 0.4,
        metalness: 0.3,
        flatShading: true
    });

    const rock = new THREE.Mesh(rockGeo, rockMat);

    const rAngle = Math.random() * Math.PI * 2;
    const rDist = 1.0 + Math.random() * 6.8;
    rock.position.set(Math.cos(rAngle) * rDist, 3.88, Math.sin(rAngle) * rDist);
    rock.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);

    islandGroup.add(rock);
}

// TREE TRUNK & BRANCHES
const treeGroup = new THREE.Group();
treeGroup.position.set(0, 3.8, 0);
islandGroup.add(treeGroup);

const trunkMat = new THREE.MeshStandardMaterial({ color: 0x21100b, roughness: 0.8 });

const trunkCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0.18, 3.0, -0.08),
    new THREE.Vector3(-0.12, 6.0, 0.08),
    new THREE.Vector3(0.0, 8.5, 0.0)
]);

function createTaperedTube(curve, tubularSegments, radialSegments, baseRadius, tipRadius) {
    const rings = tubularSegments + 1;
    const positions = new Float32Array(rings * (radialSegments + 1) * 3);
    const normals = new Float32Array(positions.length);
    const uvs = new Float32Array(rings * (radialSegments + 1) * 2);
    const indices = [];

    for (let i = 0; i < rings; i++) {
        const t = i / tubularSegments;
        const p = curve.getPointAt(t);
        const tangent = curve.getTangentAt(t).normalize();
        let ref = new THREE.Vector3(0, 1, 0);
        if (Math.abs(tangent.dot(ref)) > 0.92) ref.set(1, 0, 0);
        const binormal = new THREE.Vector3().crossVectors(tangent, ref).normalize();
        const normal = new THREE.Vector3().crossVectors(binormal, tangent).normalize();

        const eased = Math.pow(t, 0.72);
        const radius = THREE.MathUtils.lerp(baseRadius, tipRadius, eased);

        for (let j = 0; j <= radialSegments; j++) {
            const a = (j / radialSegments) * Math.PI * 2;
            const ringOffset = (i * (radialSegments + 1) + j) * 3;
            const nx = normal.x * Math.cos(a) + binormal.x * Math.sin(a);
            const ny = normal.y * Math.cos(a) + binormal.y * Math.sin(a);
            const nz = normal.z * Math.cos(a) + binormal.z * Math.sin(a);
            positions[ringOffset] = p.x + nx * radius;
            positions[ringOffset + 1] = p.y + ny * radius;
            positions[ringOffset + 2] = p.z + nz * radius;
            normals[ringOffset] = nx;
            normals[ringOffset + 1] = ny;
            normals[ringOffset + 2] = nz;
            const uvOffset = (i * (radialSegments + 1) + j) * 2;
            uvs[uvOffset] = j / radialSegments;
            uvs[uvOffset + 1] = t;
        }
    }

    for (let i = 0; i < tubularSegments; i++) {
        for (let j = 0; j < radialSegments; j++) {
            const a = i * (radialSegments + 1) + j;
            const b = a + radialSegments + 1;
            indices.push(a, b, a + 1, b, b + 1, a + 1);
        }
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
    geo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
    geo.setIndex(indices);
    geo.computeVertexNormals();
    return geo;
}

const trunkGeo = createTaperedTube(trunkCurve, 48, 12, 0.72, 0.09);
const trunkMesh = new THREE.Mesh(trunkGeo, trunkMat);
treeGroup.add(trunkMesh);

const branchClusters = [];
const mainBranchCount = 12;
for (let i = 0; i < mainBranchCount; i++) {
    const angle = (i / mainBranchCount) * Math.PI * 2 + Math.random() * 0.3;
    const h = 3.8 + Math.random() * 4.0;
    const startP = trunkCurve.getPointAt(h / 8.5);
    const len = 2.8 + Math.random() * 2.2;

    const endP = new THREE.Vector3(
        startP.x + Math.cos(angle) * len,
        startP.y + 0.8 + Math.random() * 1.2,
        startP.z + Math.sin(angle) * len
    );

    const midP = new THREE.Vector3().addVectors(startP, endP).multiplyScalar(0.5);
    midP.y += 0.4;

    const bCurve = new THREE.CatmullRomCurve3([startP, midP, endP]);
    const bGeo = createTaperedTube(bCurve, 16, 8, 0.20, 0.035);
    const bMesh = new THREE.Mesh(bGeo, trunkMat);
    treeGroup.add(bMesh);

    branchClusters.push({ center: endP, radius: 3.2 + Math.random() * 1.0 });
}

// TÁN LÁ ANH ĐÀO
const particleCount = isMobile ? 9000 : 16000;
const blossomGeo = new THREE.BufferGeometry();
const blossomPos = new Float32Array(particleCount * 3);
const blossomColors = new Float32Array(particleCount * 3);

const colorSoftPink = new THREE.Color(0xffb7c5);
const colorPalePink = new THREE.Color(0xffd1dc);
const colorPeachPink = new THREE.Color(0xffc0cb);
const colorWarmWhite = new THREE.Color(0xfff5f7);

const clusters = [
    { center: new THREE.Vector3(0, 10.5, 0), radius: 5.8 },
    { center: new THREE.Vector3(0, 8.5, 0), radius: 6.2 },
    { center: new THREE.Vector3(0, 6.5, 0), radius: 5.5 },
    ...branchClusters
];

for (let i = 0; i < particleCount; i++) {
    const c = clusters[Math.floor(Math.random() * clusters.length)];

    const u = Math.random();
    const r = Math.pow(u, 0.65) * c.radius;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);

    const x = c.center.x + r * Math.sin(phi) * Math.cos(theta);
    const y = c.center.y + r * Math.sin(phi) * Math.sin(theta) * 0.8;
    const z = c.center.z + r * Math.cos(phi);

    blossomPos[i * 3] = x;
    blossomPos[i * 3 + 1] = y;
    blossomPos[i * 3 + 2] = z;

    const randC = Math.random();
    let col;

    if (randC < 0.4) {
        col = colorSoftPink;
    } else if (randC < 0.7) {
        col = colorPalePink;
    } else if (randC < 0.9) {
        col = colorPeachPink;
    } else {
        col = colorWarmWhite;
    }

    blossomColors[i * 3] = col.r;
    blossomColors[i * 3 + 1] = col.g;
    blossomColors[i * 3 + 2] = col.b;
}

blossomGeo.setAttribute('position', new THREE.BufferAttribute(blossomPos, 3));
blossomGeo.setAttribute('color', new THREE.BufferAttribute(blossomColors, 3));

const blossomMat = new THREE.PointsMaterial({
    size: isMobile ? 0.48 : 0.42,
    vertexColors: true,
    map: particleTexture,
    transparent: true,
    opacity: 0.72,
    depthWrite: false
});

const blossomParticles = new THREE.Points(blossomGeo, blossomMat);
treeGroup.add(blossomParticles);

// RABBITS
function createRabbit() {
    const group = new THREE.Group();
    const rabbitMat = new THREE.MeshStandardMaterial({ color: 0xf8f8ff, roughness: 0.5 });

    const bodyGeo = new THREE.SphereGeometry(0.5, 12, 12);
    bodyGeo.scale(0.8, 1, 0.9);
    const bodyMesh = new THREE.Mesh(bodyGeo, rabbitMat);
    bodyMesh.position.y = 0.4;
    group.add(bodyMesh);

    const headGeo = new THREE.SphereGeometry(0.35, 12, 12);
    const headMesh = new THREE.Mesh(headGeo, rabbitMat);
    headMesh.position.set(0, 0.85, 0.2);
    group.add(headMesh);

    const earGeo = new THREE.CylinderGeometry(0.04, 0.08, 0.5, 8);
    const earLeft = new THREE.Mesh(earGeo, rabbitMat);
    earLeft.position.set(-0.12, 1.25, 0.18);
    earLeft.rotation.z = 0.15;
    earLeft.rotation.x = -0.1;
    group.add(earLeft);

    const earRight = earLeft.clone();
    earRight.position.x = 0.12;
    earRight.rotation.z = -0.15;
    group.add(earRight);

    return group;
}

const rabbits = [];
for (let i = 0; i < 4; i++) {
    const rabbitMesh = createRabbit();
    islandGroup.add(rabbitMesh);

    rabbits.push({
        mesh: rabbitMesh,
        orbitRadius: 2.8 + Math.random() * 3.2,
        orbitSpeed: (0.12 + Math.random() * 0.15) * (i % 2 === 0 ? 1 : -1),
        phase: (i / 4) * Math.PI * 2,
        baseY: 3.85,
        hopSpeed: 4.5 + Math.random() * 2.0,
        hopHeight: 0.15,
        scale: 0.75 + Math.random() * 0.25
    });
    rabbits[i].mesh.scale.setScalar(rabbits[i].scale);
}

function updateRabbits(time) {
    rabbits.forEach(r => {
        const angle = r.phase + time * r.orbitSpeed;
        const sign = Math.sign(r.orbitSpeed) || 1;

        const x = Math.cos(angle) * r.orbitRadius;
        const z = Math.sin(angle) * r.orbitRadius;
        const hop = Math.abs(Math.sin(time * r.hopSpeed)) * r.hopHeight;

        r.mesh.position.set(x, r.baseY + hop, z);

        const dx = -Math.sin(angle) * sign;
        const dz = Math.cos(angle) * sign;
        r.mesh.rotation.y = Math.atan2(dx, dz);
    });
}

// LANTERNS & WISHES DATA LOADING
const lanternsGroup = new THREE.Group();
scene.add(lanternsGroup);

const lanterns = [];
const interactiveObjects = [];

function createLanternTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createLinearGradient(0, 0, 0, 128);
    grad.addColorStop(0.0, '#e60026');
    grad.addColorStop(0.55, '#ff4d00');
    grad.addColorStop(1.0, '#ffd700');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 128, 128);
    ctx.strokeStyle = '#ffe875';
    ctx.lineWidth = 6;
    ctx.strokeRect(4, 4, 120, 120);
    return new THREE.CanvasTexture(canvas);
}

const lanternTex = createLanternTexture();

function createLanternMesh() {
    const group = new THREE.Group();

    const bodyGeo = new THREE.CylinderGeometry(0.55, 0.42, 1.4, 12);
    const bodyMat = new THREE.MeshStandardMaterial({
        map: lanternTex,
        emissive: 0xffaa00,
        emissiveIntensity: 0.85,
        roughness: 0.3
    });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    group.add(body);

    const tagGeo = new THREE.PlaneGeometry(0.32, 0.65);
    const tagMat = new THREE.MeshBasicMaterial({ color: 0xd90429, side: THREE.DoubleSide });
    const tag = new THREE.Mesh(tagGeo, tagMat);
    tag.position.set(0, -1.0, 0);
    group.add(tag);

    const spriteMat = new THREE.SpriteMaterial({
        map: particleTexture,
        color: 0xffcc00,
        transparent: true,
        opacity: 0.75,
        blending: THREE.AdditiveBlending
    });
    const glow = new THREE.Sprite(spriteMat);
    glow.scale.set(3.4, 3.4, 1);
    group.add(glow);

    const hitGeo = new THREE.SphereGeometry(1.6, 8, 8);
    const hitMat = new THREE.MeshBasicMaterial({ visible: false });
    const hitMesh = new THREE.Mesh(hitGeo, hitMat);
    group.add(hitMesh);

    return { group, hitMesh };
}

const wishTitle = document.getElementById('wishTitle');
const wishTag = document.getElementById('wishTag');
const bgm = document.getElementById('bgm');

function initLanterns(wishList) {
    const lanternCount = isMobile ? 32 : 55;

    for (let i = 0; i < lanternCount; i++) {
        const { group: lantern, hitMesh } = createLanternMesh();

        const radius = 7 + Math.random() * 32;
        const angle = Math.random() * Math.PI * 2;
        const y = -5 + (i / lanternCount) * 45 + (Math.random() - 0.5) * 5;

        lantern.position.set(Math.cos(angle) * radius, y, Math.sin(angle) * radius);

        const randomWish = wishList[i % wishList.length];

        lantern.userData = {
            speedY: 0.012 + Math.random() * 0.008,
            swingSpeed: 0.6 + Math.random() * 0.8,
            initialX: lantern.position.x,
            initialZ: lantern.position.z,
            wishText: randomWish.text,
            wishImg: randomWish.img,
            id: i
        };

        const sc = 0.65 + Math.random() * 0.45;
        lantern.scale.set(sc, sc, sc);

        hitMesh.userData.parentLantern = lantern;

        lanternsGroup.add(lantern);
        lanterns.push(lantern);
        interactiveObjects.push(hitMesh);
    }
}

async function loadWishesData() {
    const defaultWishes = [
        { text: "Chúc bạn và gia đình một mùa Trung Thu đoàn viên, tràn ngập niềm vui!", img: "https://picsum.photos/id/1015/600/400" },
        { text: "Cầu chúc cho mọi nguyện ước của bạn đêm nay sẽ trở thành hiện thực.", img: "https://picsum.photos/id/1018/600/400" }
    ];

    try {
        const response = await fetch('./assets/wishes.json');
        if (!response.ok) throw new Error('Không thể đọc file data');
        const data = await response.json();

        const urlParams = new URLSearchParams(window.location.search);
        const userId = urlParams.get('id');

        let userData = null;
        if (userId && data.users && data.users[userId]) {
            userData = data.users[userId];
        } else if (data.users) {
            const firstKey = Object.keys(data.users)[0];
            userData = data.users[firstKey];
        }

        if (userData) {
            if (userData.music) {
                bgm.src = userData.music;
                bgm.load();
            }
            if (userData.name) wishTitle.textContent = `${userData.name}`;
            if (userData.tag) wishTag.textContent = `✦ ${userData.tag} ✦`;

            const wishes = [];
            const messages = userData.messages || [];
            const images = userData.images || [];
            const maxLen = Math.max(messages.length, images.length, 1);

            for (let i = 0; i < maxLen; i++) {
                wishes.push({
                    text: messages[i % messages.length] || "Chúc bạn mùa Trung Thu an lành!",
                    img: images[i % images.length] || "https://picsum.photos/id/1015/600/400"
                });
            }
            initLanterns(wishes);
        } else {
            initLanterns(defaultWishes);
        }
    } catch (err) {
        console.warn('Lỗi tải wishes.json, sử dụng dữ liệu mặc định:', err);
        initLanterns(defaultWishes);
    }
}

loadWishesData();

// FALLING PETALS
const fallingPetalsCount = isMobile ? 80 : 180;
const petalsGeo = new THREE.BufferGeometry();
const petalsPos = new Float32Array(fallingPetalsCount * 3);
const petalsData = [];

for (let i = 0; i < fallingPetalsCount; i++) {
    petalsPos[i * 3] = (Math.random() - 0.5) * 36;
    petalsPos[i * 3 + 1] = Math.random() * 36;
    petalsPos[i * 3 + 2] = (Math.random() - 0.5) * 36;

    petalsData.push({
        speedY: 0.02 + Math.random() * 0.03,
    });
}

petalsGeo.setAttribute('position', new THREE.BufferAttribute(petalsPos, 3));
const petalsMat = new THREE.PointsMaterial({
    size: isMobile ? 0.35 : 0.3,
    color: 0xffb7c5,
    transparent: true,
    opacity: 0.75,
    map: particleTexture,
    depthWrite: false
});

const petalsParticles = new THREE.Points(petalsGeo, petalsMat);
scene.add(petalsParticles);

// STARS
const starCount = isMobile ? 250 : 500;
const starGeo = new THREE.BufferGeometry();
const starPos = new Float32Array(starCount * 3);
for (let i = 0; i < starCount; i++) {
    starPos[i * 3] = (Math.random() - 0.5) * 180;
    starPos[i * 3 + 1] = Math.random() * 90;
    starPos[i * 3 + 2] = (Math.random() - 0.5) * 180;
}
starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
const starMat = new THREE.PointsMaterial({
    color: 0xffffff,
    size: isMobile ? 0.6 : 0.5,
    map: particleTexture,
    transparent: true,
    opacity: 0.85,
    blending: THREE.AdditiveBlending,
    depthWrite: false
});
scene.add(new THREE.Points(starGeo, starMat));

// FIREWORKS
let fireworks = [];
function createFirework(pos) {
    const pCount = 50;
    const pGeo = new THREE.BufferGeometry();
    const pPositions = new Float32Array(pCount * 3);
    const velocities = [];

    for (let i = 0; i < pCount; i++) {
        pPositions[i * 3] = pos.x;
        pPositions[i * 3 + 1] = pos.y;
        pPositions[i * 3 + 2] = pos.z;

        const theta = Math.random() * Math.PI * 2;
        const phi = Math.random() * Math.PI;
        const speed = 0.08 + Math.random() * 0.12;

        velocities.push(new THREE.Vector3(
            speed * Math.sin(phi) * Math.cos(theta),
            speed * Math.sin(phi) * Math.sin(theta),
            speed * Math.cos(phi)
        ));
    }

    pGeo.setAttribute('position', new THREE.BufferAttribute(pPositions, 3));
    const pMat = new THREE.PointsMaterial({
        size: 0.35,
        color: 0xffd700,
        map: particleTexture,
        transparent: true,
        opacity: 1,
        blending: THREE.AdditiveBlending,
        depthWrite: false
    });

    const pMesh = new THREE.Points(pGeo, pMat);
    scene.add(pMesh);

    fireworks.push({ mesh: pMesh, velocities: velocities, life: 1.0 });
}

// RAYCASTER & INTERACTION
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let targetCamPos = null;
let targetCamTarget = null;
let selectedLantern = null;

const wishModal = document.getElementById('wishModal');
const wishText = document.getElementById('wishText');
const wishImage = document.getElementById('wishImage');
const closeWishBtn = document.getElementById('closeWishBtn');

let pointerDownPos = { x: 0, y: 0 };

function onPointerDown(event) {
    pointerDownPos.x = event.clientX || (event.touches && event.touches[0].clientX) || 0;
    pointerDownPos.y = event.clientY || (event.touches && event.touches[0].clientY) || 0;
}

function onPointerUp(event) {
    if (event.target.closest('.top-bar') || event.target.closest('.wish-modal')) return;

    const clientX = event.clientX || (event.changedTouches && event.changedTouches[0].clientX) || 0;
    const clientY = event.clientY || (event.changedTouches && event.changedTouches[0].clientY) || 0;

    const distMoved = Math.hypot(clientX - pointerDownPos.x, clientY - pointerDownPos.y);
    if (distMoved > 8) return;

    mouse.x = (clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(interactiveObjects, false);

    if (intersects.length > 0) {
        const hitMesh = intersects[0].object;
        selectedLantern = hitMesh.userData.parentLantern || hitMesh.parent;
        const lPos = selectedLantern.position;

        createFirework(lPos);

        const offset = new THREE.Vector3().subVectors(camera.position, lPos).normalize().multiplyScalar(5.5);
        targetCamPos = new THREE.Vector3().addVectors(lPos, offset);
        targetCamTarget = lPos.clone();

        wishText.textContent = `"${selectedLantern.userData.wishText}"`;
        wishImage.src = selectedLantern.userData.wishImg;

        setTimeout(() => {
            wishModal.classList.add('active');
        }, 300);
    }
}

window.addEventListener('pointerdown', onPointerDown, { passive: true });
window.addEventListener('pointerup', onPointerUp, { passive: true });

function resetCamera() {
    targetCamPos = DEFAULT_CAM_POS.clone();
    targetCamTarget = DEFAULT_CAM_TARGET.clone();
    selectedLantern = null;
    controls.enabled = true;
}

function closeWishCard() {
    wishModal.classList.remove('active');
    resetCamera();
}

function safeCloseWish(e) {
    if (e) { 
        e.preventDefault(); 
        e.stopPropagation(); 
    }
    closeWishCard();
}

closeWishBtn.addEventListener('click', safeCloseWish);

wishModal.addEventListener('click', (e) => {
    if (e.target === wishModal) safeCloseWish(e);
});

window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeWishCard();
});

// AUDIO
const audioBtn = document.getElementById('audio-btn');
let isPlaying = false;

function playMusic() {
    if (!bgm.src) return;
    bgm.play().then(() => {
        audioBtn.innerHTML = '<i class="fas fa-volume-up"></i>';
        isPlaying = true;
    }).catch(err => {
        console.log("Trình duyệt chặn autoplay:", err);
    });
}

function toggleAudio(e) {
    if (e) {
        e.preventDefault();
        e.stopPropagation();
    }
    if (!bgm.src) return;

    if (isPlaying) {
        bgm.pause();
        audioBtn.innerHTML = '<i class="fas fa-music"></i>';
        isPlaying = false;
    } else {
        playMusic();
    }
}

audioBtn.addEventListener('click', toggleAudio);

function unlockAudioOnFirstTouch() {
    if (!isPlaying && bgm.src) {
        playMusic();
    }
    window.removeEventListener('pointerdown', unlockAudioOnFirstTouch);
    window.removeEventListener('touchstart', unlockAudioOnFirstTouch);
}

window.addEventListener('pointerdown', unlockAudioOnFirstTouch, { once: true });
window.addEventListener('touchstart', unlockAudioOnFirstTouch, { once: true });

// ANIMATION LOOP
const clock = new THREE.Clock();

function animate() {
    requestAnimationFrame(animate);
    const delta = clock.getDelta();
    const time = clock.getElapsedTime();

    lanterns.forEach(lantern => {
        lantern.position.y += lantern.userData.speedY;
        lantern.position.x = lantern.userData.initialX + Math.sin(time * lantern.userData.swingSpeed + lantern.userData.id) * 0.5;
        lantern.position.z = lantern.userData.initialZ + Math.cos(time * lantern.userData.swingSpeed + lantern.userData.id) * 0.5;
        lantern.rotation.y += 0.006;

        if (lantern.position.y > 42) {
            lantern.position.y = -6;
            const newRadius = 7 + Math.random() * 32;
            const newAngle = Math.random() * Math.PI * 2;
            lantern.position.x = Math.cos(newAngle) * newRadius;
            lantern.position.z = Math.sin(newAngle) * newRadius;
            lantern.userData.initialX = lantern.position.x;
            lantern.userData.initialZ = lantern.position.z;
        }
    });

    const pPos = petalsGeo.attributes.position.array;
    for (let i = 0; i < fallingPetalsCount; i++) {
        pPos[i * 3 + 1] -= petalsData[i].speedY;
        pPos[i * 3] += Math.sin(time + i) * 0.01;
        pPos[i * 3 + 2] += Math.cos(time + i) * 0.01;

        if (pPos[i * 3 + 1] < -3) {
            pPos[i * 3 + 1] = 34;
            pPos[i * 3] = (Math.random() - 0.5) * 36;
            pPos[i * 3 + 2] = (Math.random() - 0.5) * 36;
        }
    }
    petalsGeo.attributes.position.needsUpdate = true;

    for (let i = fireworks.length - 1; i >= 0; i--) {
        const fw = fireworks[i];
        fw.life -= delta * 1.2;
        const posArr = fw.mesh.geometry.attributes.position.array;

        for (let j = 0; j < fw.velocities.length; j++) {
            posArr[j * 3] += fw.velocities[j].x;
            posArr[j * 3 + 1] += fw.velocities[j].y;
            posArr[j * 3 + 2] += fw.velocities[j].z;
        }
        fw.mesh.geometry.attributes.position.needsUpdate = true;
        fw.mesh.material.opacity = fw.life;

        if (fw.life <= 0) {
            scene.remove(fw.mesh);
            fireworks.splice(i, 1);
        }
    }

    islandGroup.rotation.y = Math.sin(time * 0.15) * 0.05;

    updateRabbits(time);

    if (targetCamPos && targetCamTarget) {
        camera.position.lerp(targetCamPos, 0.06);
        controls.target.lerp(targetCamTarget, 0.06);

        if (camera.position.distanceTo(targetCamPos) < 0.2) {
            targetCamPos = null;
            targetCamTarget = null;
            controls.enabled = true;
        }
    }

    controls.update();
    renderer.render(scene, camera);
}

animate();

window.addEventListener('resize', () => {
    const width = window.innerWidth;
    const height = window.innerHeight;

    camera.aspect = width / height;
    camera.fov = width < 768 ? 60 : 45;
    camera.updateProjectionMatrix();

    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, width < 768 ? 1.5 : 2));
});

// window.addEventListener("load", () => {
//     const ant = atob("cGFuYmFwLmdpdGh1Yi5pbw==");
//     if (location.hostname !== ant) {
//         document.body.innerHTML = "";
//     }
// });