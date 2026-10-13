import * as v1 from 'three';
import {
    OrbitControls
} from 'three/addons/controls/OrbitControls.js';
import {
    FontLoader
} from 'three/examples/jsm/loaders/FontLoader.js';
import {
    TextGeometry
} from 'three/examples/jsm/geometries/TextGeometry.js';
const scene = new v1.Scene();
scene.fog = new v1.FogExp2(0, 0.0015);
const camera = new v1.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100000);
camera.position['set'](0, 20, 30);
const renderer = new v1.WebGLRenderer({
    'antialias': true
});
renderer.setSize(window.innerWidth, window.innerHeight), renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)), renderer.outputColorSpace = v1.SRGBColorSpace, document.getElementById('container').appendChild(renderer.domElement);
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true, controls.autoRotate = true, controls.autoRotateSpeed = 0.2, controls.enabled = false, controls.target['set'](0, 0, 0), controls.enablePan = false, controls.minDistance = 15, controls.maxDistance = 300, controls.zoomSpeed = 0.3, controls.rotateSpeed = 0.3, controls.update();

function createGlowMaterial(v2, v3 = 128, v4 = 0.55) {
    const canvasEl = document.createElement("canvas");
    canvasEl.width = canvasEl.height = v3;
    const ctx = canvasEl.getContext('2d'),
        v5 = ctx.createRadialGradient(v3 / 2, v3 / 2, 0, v3 / 2, v3 / 2, v3 / 2);
    v5.addColorStop(0, v2), v5.addColorStop(1, 'rgba(0,0,0,0)'), ctx.fillStyle = v5, ctx.fillRect(0, 0, v3, v3);
    const v6 = new v1.CanvasTexture(canvasEl),
        v7 = new v1.SpriteMaterial({
            'map': v6,
            'transparent': true,
            'opacity': v4,
            'depthWrite': false,
            'blending': v1.AdditiveBlending
        });
    return new v1.Sprite(v7);
}
const centralGlow = createGlowMaterial('rgba(255,255,255,0.8)', 156, 0.25);
centralGlow.scale['set'](8, 8, 1), scene.add(centralGlow);
for (let i = 0; i < 15; i++) {
    const hue = Math.random() * 360,
        color = "hsla(" + hue + ",80%,50%,0.6)",
        nebula = createGlowMaterial(color, 256);
    nebula.scale['set'](100, 100, 1), nebula.position['set']((Math.random() - 0.5) * 175, (Math.random() - 0.5) * 175, (Math.random() - 0.5) * 175), scene.add(nebula);
}
const galaxyParameters = {
    'count': 100000,
    'arms': 6,
    'radius': 100,
    'spin': 0.5,
    'randomness': 0.2,
    'randomnessPower': 20,
    'insideColor': new v1.Color(14040790),
    'outsideColor': new v1.Color(4765880)
};

function decodeLZString(v8) {
    try {
        if (!v8) return '';
        if (typeof LZString === "undefined") return console.error('Thiếu\x20thư\x20viện\x20LZString!'), '';
        const v9 = LZString.decompressFromEncodedURIComponent(v8) || LZString.decompress(v8);
        return v9 || '';
    } catch (v10) {
        return console.error('Lỗi\x20giải\x20nén\x20LZString:', v10), '';
    }
}

function getDataFromURL() {
    const v11 = new URLSearchParams(window.location['search']),
        v12 = v11.get('d');
    if (!v12) return {
        'images': [],
        'texts': ['Love', 'Galaxy'],
        'music': ''
    };
    const v13 = decodeLZString(v12);
    if (!v13) return {
        'images': [],
        'texts': ["Love", 'Galaxy'],
        'music': ''
    };
    const [v14 = '', v15 = '', v16 = ''] = v13.split('|'), v17 = v14.split(',').map(v18 => v18.trim()).filter(Boolean).map(v19 => /^https?:\/\//i.test(v19) ? v19 : 'https://' + v19);
    let v20 = v15.split(',').map(v21 => v21.trim()).filter(Boolean);
    return window.Keypans && typeof window.Keypans['decompressWithDictionary'] === "function" && (v20 = v20.map(v22 => window.Keypans["decompressWithDictionary"](v22))), {
        'images': v17,
        'texts': v20.length > 0 ? v20 : ['Love', "Galaxy"],
        'music': v16
    };
}

function getHeartImagesFromURL() {
    return getDataFromURL().images;
}

function getRingTextsFromURL() {
    return getDataFromURL().texts;
}
const heartImages = getHeartImagesFromURL(),
    ringTexts = getRingTextsFromURL();
window.loves = {
    'data': {
        'ringTexts': ringTexts
    }
};

function getMusicFromURL() {
    const v23 = new URLSearchParams(window.location["search"]),
        v24 = v23.get('music');
    return v24 || './n/a.mp3';
}
const selectedMusic = getMusicFromURL();
if (selectedMusic) {
    const audio = document.createElement('audio');
    audio.src = selectedMusic, audio.loop = true, audio.muted = false, audio.style['display'] = "none", document.body['appendChild'](audio);
    const toggleBtn = document.createElement('button');
    toggleBtn.id = "toggle-audio", toggleBtn.className = 'text-white\x20btn-audio-toggle', toggleBtn.style['position'] = "absolute", toggleBtn.style["top"] = '10px', toggleBtn.style['right'] = '10px', toggleBtn.style['zIndex'] = "999";
    const audioIcon = document.createElement('i');
    audioIcon.id = 'audio-icon', audioIcon.className = "fa-solid fa-volume-high", toggleBtn.appendChild(audioIcon), document.body["appendChild"](toggleBtn);
    const startAudio = () => {
        audio.play().catch(v25 => {
            console.warn("Trình duyệt chặn autoplay:", v25);
        }), document.removeEventListener('click', startAudio);
    };
    document.addEventListener("click", startAudio), toggleBtn.addEventListener('click', () => {
        audio.muted ? (audio.muted = false, audioIcon.className = 'fa-solid\x20fa-volume-high') : (audio.muted = true, audioIcon.className = "fa-solid fa-volume-xmark");
    });
}
const textureLoader = new v1.TextureLoader(),
    numGroups = heartImages.length,
    maxDensity = 15000,
    minDensity = 4000,
    maxGroupsForScale = 6;
let pointsPerGroup;
if (numGroups <= 1) pointsPerGroup = maxDensity;
else {
    if (numGroups >= maxGroupsForScale) pointsPerGroup = minDensity;
    else {
        const t = (numGroups - 1) / (maxGroupsForScale - 1);
        pointsPerGroup = Math.floor(maxDensity * (1 - t) + minDensity * t);
    }
}
pointsPerGroup * numGroups > galaxyParameters.count && (pointsPerGroup = Math.floor(galaxyParameters.count / numGroups));
console.log('Số\x20lượng\x20ảnh:' + numGroups + ",Điểm mỗi ảnh:" + pointsPerGroup);
const positions = new Float32Array(galaxyParameters.count * 3),
    colors = new Float32Array(galaxyParameters.count * 3);
let pointIdx = 0;
for (let i = 0; i < galaxyParameters.count; i++) {
    const radius = Math.pow(Math.random(), galaxyParameters.randomnessPower) * galaxyParameters.radius,
        branchAngle = i % galaxyParameters.arms / galaxyParameters.arms * Math.PI * 2,
        spinAngle = radius * galaxyParameters.spin,
        randomX = (Math.random() - 0.5) * galaxyParameters.randomness * radius,
        randomY = (Math.random() - 0.5) * galaxyParameters.randomness * radius * 0.5,
        randomZ = (Math.random() - 0.5) * galaxyParameters.randomness * radius,
        totalAngle = branchAngle + spinAngle;
    if (radius < 30 && Math.random() < 0.7) continue;
    const i3 = pointIdx * 3;
    positions[i3] = Math.cos(totalAngle) * radius + randomX, positions[i3 + 1] = randomY, positions[i3 + 2] = Math.sin(totalAngle) * radius + randomZ;
    const mixedColor = new v1.Color(16738047);
    mixedColor.lerp(new v1.Color(6750207), radius / galaxyParameters.radius), mixedColor.multiplyScalar(0.7 + 0.3 * Math.random()), colors[i3] = mixedColor.r, colors[i3 + 1] = mixedColor.g, colors[i3 + 2] = mixedColor.b, pointIdx++;
}
const galaxyGeometry = new v1.BufferGeometry();
galaxyGeometry.setAttribute("position", new v1.BufferAttribute(positions.slice(0, pointIdx * 3), 3)), galaxyGeometry.setAttribute('color', new v1.BufferAttribute(colors.slice(0, pointIdx * 3), 3));
const galaxyMaterial = new v1.ShaderMaterial({
        'uniforms': {
            'uTime': {
                'value': 0
            },
            'uSize': {
                'value': 50 * renderer.getPixelRatio()
            },
            'uRippleTime': {
                'value': -1
            },
            'uRippleSpeed': {
                'value': 40
            },
            'uRippleWidth': {
                'value': 20
            }
        },
        'vertexShader': " uniform float uSize;uniform float uTime;uniform float uRippleTime;uniform float uRippleSpeed;uniform float uRippleWidth;varying vec3 vColor;void main(){vColor=color;vec4 modelPosition=modelMatrix*vec4(position,1.0);if(uRippleTime>0.0){float rippleRadius=(uTime-uRippleTime)*uRippleSpeed;float particleDist=length(modelPosition.xyz);float strength=1.0-smoothstep(rippleRadius-uRippleWidth,rippleRadius+uRippleWidth,particleDist);strength*=smoothstep(rippleRadius+uRippleWidth,rippleRadius-uRippleWidth,particleDist);if(strength>0.0){vColor+=vec3(strength*2.0);}}vec4 viewPosition=viewMatrix*modelPosition;gl_Position=projectionMatrix*viewPosition;gl_PointSize=uSize/-viewPosition.z;}",
        'fragmentShader': '\x20varying\x20vec3\x20vColor;void\x20main(){float\x20dist=length(gl_PointCoord-vec2(0.5));if(dist>0.5)discard;gl_FragColor=vec4(vColor,1.0);}',
        'blending': v1.AdditiveBlending,
        'depthWrite': false,
        'transparent': true,
        'vertexColors': true
    }),
    galaxy = new v1.Points(galaxyGeometry, galaxyMaterial);
scene.add(galaxy);

function createNeonTexture(v26, v27) {
    const v28 = window.devicePixelRatio || 1,
        canvasEl2 = document.createElement("canvas");
    canvasEl2.width = canvasEl2.height = v27 * v28, canvasEl2.style["width"] = canvasEl2.style['height'] = v27 + 'px';
    const ctx2 = canvasEl2.getContext('2d');
    ctx2.scale(v28, v28);
    const v29 = v26.width / v26.height;
    let v30, v31, v32, v33;
    v29 > 1 ? (v30 = v27, v31 = v27 / v29, v32 = 0, v33 = (v27 - v31) / 2) : (v31 = v27, v30 = v27 * v29, v32 = (v27 - v30) / 2, v33 = 0);
    ctx2.clearRect(0, 0, v27, v27);
    const v34 = v27 * 0.1;
    ctx2.save(), ctx2.beginPath(), ctx2.moveTo(v32 + v34, v33), ctx2.lineTo(v32 + v30 - v34, v33), ctx2.arcTo(v32 + v30, v33, v32 + v30, v33 + v34, v34), ctx2.lineTo(v32 + v30, v33 + v31 - v34), ctx2.arcTo(v32 + v30, v33 + v31, v32 + v30 - v34, v33 + v31, v34), ctx2.lineTo(v32 + v34, v33 + v31), ctx2.arcTo(v32, v33 + v31, v32, v33 + v31 - v34, v34), ctx2.lineTo(v32, v33 + v34), ctx2.arcTo(v32, v33, v32 + v34, v33, v34), ctx2.closePath(), ctx2.clip(), ctx2.drawImage(v26, v32, v33, v30, v31), ctx2.restore();
    const v35 = new v1.CanvasTexture(canvasEl2);
    return v35.minFilter = v1.LinearFilter, v35.magFilter = v1.LinearFilter, v35.anisotropy = renderer.capabilities["getMaxAnisotropy"](), v35.colorSpace = v1.SRGBColorSpace, v35;
}
for (let group = 0; group < numGroups; group++) {
    const groupPositions = new Float32Array(pointsPerGroup * 3),
        groupColorsNear = new Float32Array(pointsPerGroup * 3),
        groupColorsFar = new Float32Array(pointsPerGroup * 3);
    let validPointCount = 0;
    for (let i = 0; i < pointsPerGroup; i++) {
        const idx = validPointCount * 3,
            globalIdx = group * pointsPerGroup + i,
            radius = Math.pow(Math.random(), galaxyParameters.randomnessPower) * galaxyParameters.radius;
        if (radius < 30) continue;
        const branchAngle = globalIdx % galaxyParameters.arms / galaxyParameters.arms * Math.PI * 2,
            spinAngle = radius * galaxyParameters.spin,
            randomX = (Math.random() - 0.5) * galaxyParameters.randomness * radius,
            randomY = (Math.random() - 0.5) * galaxyParameters.randomness * radius * 0.5,
            randomZ = (Math.random() - 0.5) * galaxyParameters.randomness * radius,
            totalAngle = branchAngle + spinAngle;
        groupPositions[idx] = Math.cos(totalAngle) * radius + randomX, groupPositions[idx + 1] = randomY, groupPositions[idx + 2] = Math.sin(totalAngle) * radius + randomZ;
        const colorNear = new v1.Color(16777215);
        groupColorsNear[idx] = colorNear.r, groupColorsNear[idx + 1] = colorNear.g, groupColorsNear[idx + 2] = colorNear.b;
        const colorFar = galaxyParameters.insideColor['clone']();
        colorFar.lerp(galaxyParameters.outsideColor, radius / galaxyParameters.radius), colorFar.multiplyScalar(0.7 + 0.3 * Math.random()), groupColorsFar[idx] = colorFar.r, groupColorsFar[idx + 1] = colorFar.g, groupColorsFar[idx + 2] = colorFar.b, validPointCount++;
    }
    if (validPointCount === 0) continue;
    const groupGeometryNear = new v1.BufferGeometry();
    groupGeometryNear.setAttribute('position', new v1.BufferAttribute(groupPositions.slice(0, validPointCount * 3), 3)), groupGeometryNear.setAttribute('color', new v1.BufferAttribute(groupColorsNear.slice(0, validPointCount * 3), 3));
    const groupGeometryFar = new v1.BufferGeometry();
    groupGeometryFar.setAttribute("position", new v1.BufferAttribute(groupPositions.slice(0, validPointCount * 3), 3)), groupGeometryFar.setAttribute('color', new v1.BufferAttribute(groupColorsFar.slice(0, validPointCount * 3), 3));
    const posAttr = groupGeometryFar.getAttribute("position");
    let cx = 0,
        cy = 0,
        cz = 0;
    for (let i = 0; i < posAttr.count; i++) {
        cx += posAttr.getX(i), cy += posAttr.getY(i), cz += posAttr.getZ(i);
    }
    cx /= posAttr.count, cy /= posAttr.count, cz /= posAttr.count, groupGeometryNear.translate(-cx, -cy, -cz), groupGeometryFar.translate(-cx, -cy, -cz);
    const img = new window.Image();
    img.crossOrigin = 'Anonymous', img.src = heartImages[group], img.onload = () => {
        const v36 = createNeonTexture(img, 256),
            v37 = new v1.PointsMaterial({
                'size': 1.8,
                'map': v36,
                'transparent': false,
                'alphaTest': 0.2,
                'depthWrite': true,
                'depthTest': true,
                'blending': v1.NormalBlending,
                'vertexColors': true
            }),
            v38 = new v1.PointsMaterial({
                'size': 1.8,
                'map': v36,
                'transparent': true,
                'alphaTest': 0.2,
                'depthWrite': false,
                'blending': v1.AdditiveBlending,
                'vertexColors': true
            }),
            v39 = new v1.Points(groupGeometryFar, v38);
        v39.position["set"](cx, cy, cz), v39.userData["materialNear"] = v37, v39.userData["geometryNear"] = groupGeometryNear, v39.userData['materialFar'] = v38, v39.userData["geometryFar"] = groupGeometryFar, scene.add(v39);
    };
}
const ambientLight = new v1.AmbientLight(16777215, 0.2);
scene.add(ambientLight);
const starCount = 20000,
    starGeometry = new v1.BufferGeometry(),
    starPositions = new Float32Array(starCount * 3);
for (let i = 0; i < starCount; i++) {
    starPositions[i * 3] = (Math.random() - 0.5) * 900, starPositions[i * 3 + 1] = (Math.random() - 0.5) * 900, starPositions[i * 3 + 2] = (Math.random() - 0.5) * 900;
}
starGeometry.setAttribute("position", new v1.BufferAttribute(starPositions, 3));
const starMaterial = new v1.PointsMaterial({
        'color': 16777215,
        'size': 0.7,
        'transparent': true,
        'opacity': 0.7,
        'depthWrite': false
    }),
    starField = new v1.Points(starGeometry, starMaterial);
starField.name = "starfield", starField.renderOrder = 999, scene.add(starField);
let shootingStars = [];

function createShootingStar() {
    const v40 = 100,
        v41 = new v1.SphereGeometry(2, 32, 32),
        v42 = new v1.MeshBasicMaterial({
            'color': 16777215,
            'transparent': true,
            'opacity': 0,
            'blending': v1.AdditiveBlending
        }),
        v43 = new v1.Mesh(v41, v42),
        v44 = new v1.SphereGeometry(3, 32, 32),
        v45 = new v1.ShaderMaterial({
            'uniforms': {
                'time': {
                    'value': 0
                }
            },
            'vertexShader': '\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20varying\x20vec3\x20vNormal;\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20void\x20main()\x20{\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20vNormal\x20=\x20normalize(normalMatrix\x20*\x20normal);\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20gl_Position\x20=\x20projectionMatrix\x20*\x20modelViewMatrix\x20*\x20vec4(position,\x201.0);\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20}\x0a\x20\x20\x20\x20\x20\x20\x20\x20',
            'fragmentShader': "\n            varying vec3 vNormal;\n            uniform float time;\n            void main() {\n                float intensity = pow(0.7 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);\n                gl_FragColor = vec4(1.0, 1.0, 1.0, intensity * (0.8 + sin(time * 5.0) * 0.2));\n            }\n        ",
            'transparent': true,
            'blending': v1.AdditiveBlending,
            'side': v1.BackSide
        }),
        v46 = new v1.Mesh(v44, v45);
    v43.add(v46);
    const v47 = new v1.SphereGeometry(planetRadius * 1.05, 48, 48),
        v48 = new v1.ShaderMaterial({
            'uniforms': {
                'glowColor': {
                    'value': new v1.Color(14726143)
                }
            },
            'vertexShader': '\x0a\x20\x20\x20\x20\x20\x20\x20\x20varying\x20vec3\x20vNormal;\x0a\x20\x20\x20\x20\x20\x20\x20\x20void\x20main()\x20{\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20vNormal\x20=\x20normalize(normalMatrix\x20*\x20normal);\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20gl_Position\x20=\x20projectionMatrix\x20*\x20modelViewMatrix\x20*\x20vec4(position,\x201.0);\x0a\x20\x20\x20\x20\x20\x20\x20\x20}\x0a\x20\x20\x20\x20',
            'fragmentShader': '\x0a\x20\x20\x20\x20\x20\x20\x20\x20varying\x20vec3\x20vNormal;\x0a\x20\x20\x20\x20\x20\x20\x20\x20uniform\x20vec3\x20glowColor;\x0a\x20\x20\x20\x20\x20\x20\x20\x20void\x20main()\x20{\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20float\x20intensity\x20=\x20pow(0.7\x20-\x20dot(vNormal,\x20vec3(0.0,\x200.0,\x201.0)),\x202.0);\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20gl_FragColor\x20=\x20vec4(glowColor,\x201.0)\x20*\x20intensity;\x0a\x20\x20\x20\x20\x20\x20\x20\x20}\x0a\x20\x20\x20\x20',
            'side': v1.BackSide,
            'blending': v1.AdditiveBlending,
            'transparent': true
        }),
        v49 = new v1.Mesh(v47, v48);
    planet.add(v49);
    const v50 = createRandomCurve(),
        v51 = [];
    for (let v52 = 0; v52 < v40; v52++) {
        const v53 = v52 / (v40 - 1);
        v51.push(v50.getPoint(v53));
    }
    const v54 = new v1.BufferGeometry().setFromPoints(v51),
        v55 = new v1.LineBasicMaterial({
            'color': 10087167,
            'transparent': true,
            'opacity': 0.7,
            'linewidth': 2
        }),
        v56 = new v1.Line(v54, v55),
        v57 = new v1.Group();
    v57.add(v43), v57.add(v56), v57.userData = {
        'curve': v50,
        'progress': 0,
        'speed': 0.001 + Math.random() * 0.001,
        'life': 0,
        'maxLife': 300,
        'head': v43,
        'trail': v56,
        'trailLength': v40,
        'trailPoints': v51
    }, scene.add(v57), shootingStars.push(v57);
}

function createRandomCurve() {
    const v58 = [],
        v59 = new v1.Vector3(-200 + Math.random() * 100, -100 + Math.random() * 200, -100 + Math.random() * 200),
        v60 = new v1.Vector3(600 + Math.random() * 200, v59.y + (-100 + Math.random() * 200), v59.z + (-100 + Math.random() * 200)),
        v61 = new v1.Vector3(v59.x + 200 + Math.random() * 100, v59.y + (-50 + Math.random() * 100), v59.z + (-50 + Math.random() * 100)),
        v62 = new v1.Vector3(v60.x - 200 + Math.random() * 100, v60.y + (-50 + Math.random() * 100), v60.z + (-50 + Math.random() * 100));
    return v58.push(v59, v61, v62, v60), new v1.CubicBezierCurve3(v59, v61, v62, v60);
}

function createPlanetTexture(v63 = 512) {
    const canvasEl3 = document.createElement('canvas');
    canvasEl3.width = canvasEl3.height = v63;
    const ctx3 = canvasEl3.getContext('2d'),
        v64 = ctx3.createRadialGradient(v63 / 2, v63 / 2, v63 / 8, v63 / 2, v63 / 2, v63 / 2);
    v64.addColorStop(0, "#f8bbd0"), v64.addColorStop(0.12, "#f48fb1"), v64.addColorStop(0.22, "#f06292"), v64.addColorStop(0.35, '#ffffff'), v64.addColorStop(0.5, '#e1aaff'), v64.addColorStop(0.62, '#a259f7'), v64.addColorStop(0.75, '#b2ff59'), v64.addColorStop(1, '#3fd8c7'), ctx3.fillStyle = v64, ctx3.fillRect(0, 0, v63, v63);
    const v65 = ['#f8bbd0', '#f8bbd0', '#f48fb1', '#f48fb1', "#f06292", "#f06292", '#ffffff', '#e1aaff', "#a259f7", '#b2ff59'];
    for (let v66 = 0; v66 < 40; v66++) {
        const v67 = Math.random() * v63,
            v68 = Math.random() * v63,
            v69 = 30 + Math.random() * 120,
            v70 = v65[Math.floor(Math.random() * v65.length)],
            v71 = ctx3.createRadialGradient(v67, v68, 0, v67, v68, v69);
        v71.addColorStop(0, v70 + 'cc'), v71.addColorStop(1, v70 + '00'), ctx3.fillStyle = v71, ctx3.fillRect(0, 0, v63, v63);
    }
    for (let v72 = 0; v72 < 8; v72++) {
        ctx3.beginPath(), ctx3.moveTo(Math.random() * v63, Math.random() * v63), ctx3.bezierCurveTo(Math.random() * v63, Math.random() * v63, Math.random() * v63, Math.random() * v63, Math.random() * v63, Math.random() * v63), ctx3.strokeStyle = "rgba(180, 120, 200, " + (0.12 + Math.random() * 0.18) + ')', ctx3.lineWidth = 8 + Math.random() * 18, ctx3.stroke();
    }
    return ctx3.filter !== undefined && (ctx3.filter = 'blur(2px)', ctx3.drawImage(canvasEl3, 0, 0), ctx3.filter = "none"), new v1.CanvasTexture(canvasEl3);
}
// document.addEventListener("keydown", function(event) {
//     (event.key === "F12" || event.ctrlKey && event.shiftKey && (event.key === 'I' || event.key === 'J') || event.ctrlKey && event.key === 'U') && (event.preventDefault(), location = atob("aHR0cHM6Ly9kZXZwYW4udmVyY2VsLmFwcA=="));
// }), document.addEventListener('contextmenu', function(event2) {
//     event2.preventDefault();
// });
const stormShader = {
    'uniforms': {
        'time': {
            'value': 0
        },
        'baseTexture': {
            'value': null
        }
    },
    'vertexShader': "\n        varying vec2 vUv;\n        void main() {\n            vUv = uv;\n            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);\n        }\n    ",
    'fragmentShader': "\n        uniform float time;\n        uniform sampler2D baseTexture;\n        varying vec2 vUv;\n        void main() {\n            vec2 uv = vUv;\n            float angle = length(uv - vec2(0.5)) * 3.0;\n            float twist = sin(angle * 3.0 + time) * 0.1;\n            uv.x += twist * sin(time * 0.5);\n            uv.y += twist * cos(time * 0.5);\n            vec4 texColor = texture2D(baseTexture, uv);\n            float noise = sin(uv.x * 10.0 + time) * sin(uv.y * 10.0 + time) * 0.1;\n            texColor.rgb += noise * vec3(0.8, 0.4, 0.2);\n            gl_FragColor = texColor;\n        }\n    "
};
if (!document.querySelector("meta[name=\"author\"][content=\"Devpan\"]")) document.body['innerHTML'] = '';
if (!document.getElementById("Devpan")) location.href = atob("aHR0cHM6Ly9kZXZwYW4udmVyY2VsLmFwcC8=");
const planetRadius = 10,
    planetGeometry = new v1.SphereGeometry(planetRadius, 48, 48),
    planetTexture = createPlanetTexture(),
    planetMaterial = new v1.ShaderMaterial({
        'uniforms': {
            'time': {
                'value': 0
            },
            'baseTexture': {
                'value': planetTexture
            }
        },
        'vertexShader': stormShader.vertexShader,
        'fragmentShader': stormShader.fragmentShader
    }),
    planet = new v1.Mesh(planetGeometry, planetMaterial);
planet.position['set'](0, 0, 0), scene.add(planet);

function createTextRings() {
    const v73 = ringTexts.length,
        v74 = planetRadius * 1.1,
        v75 = 5;
    window.textRings = [];
    for (let v76 = 0; v76 < v73; v76++) {
        const v77 = ringTexts[v76 % ringTexts.length] + '\x20\x20\x20',
            v78 = v74 + v76 * v75;

        function v79(v80) {
            const v81 = v80.charCodeAt(0);
            if (v81 >= 19968 && v81 <= 40959 || v81 >= 12352 && v81 <= 12447 || v81 >= 12448 && v81 <= 12543 || v81 >= 44032 && v81 <= 55215) return "cjk";
            else {
                if (v81 >= 0 && v81 <= 127) return 'latin';
            }
            return 'other';
        }
        let v82 = {
            'cjk': 0,
            'latin': 0,
            'other': 0
        };
        for (let v83 of v77) {
            v82[v79(v83)]++;
        }
        const v84 = v77.length,
            v85 = v82.cjk / v84;
        let v86 = {
            'fontScale': 0.75,
            'spacingScale': 1.1
        };
        if (v76 === 0) v86.fontScale = 0.55, v86.spacingScale = 0.9;
        else v76 === 1 && (v86.fontScale = 0.65, v86.spacingScale = 1);
        v85 > 0 && (v86.fontScale *= 0.9, v86.spacingScale *= 1.1);
        const v87 = 200,
            v88 = Math.max(120, 0.9 * v87),
            canvasEl4 = document.createElement("canvas"),
            ctx4 = canvasEl4.getContext('2d');
        ctx4.font = 'bold\x20' + v88 + 'px\x20Arial,\x20sans-serif';
        let v89 = ringTexts[v76 % ringTexts.length];
        const v90 = '\x20\x20\x20';
        let v91 = v89 + v90,
            v92 = ctx4.measureText(v91).width,
            v93 = 2 * Math.PI * v78 * 180,
            v94 = Math.ceil(v93 / v92),
            v95 = '';
        for (let v96 = 0; v96 < v94; v96++) {
            v95 += v91;
        }
        let v97 = v92 * v94;
        (v97 < 1 || !v95) && (v95 = v91, v97 = v92);
        const canvasEl5 = document.createElement("canvas");
        canvasEl5.width = Math.ceil(Math.max(1, v97)), canvasEl5.height = v87;
        const ctx5 = canvasEl5.getContext('2d');
        ctx5.clearRect(0, 0, canvasEl5.width, v87), ctx5.font = 'bold\x20' + v88 + "px Arial, sans-serif", ctx5.fillStyle = 'white', ctx5.textAlign = 'left', ctx5.textBaseline = "alphabetic", ctx5.shadowColor = '#ffb3b3ff', ctx5.shadowBlur = 12, ctx5.lineWidth = 6, ctx5.strokeStyle = "#fff", ctx5.strokeText(v95, 0, v87 * 0.8), ctx5.shadowColor = '#ff7474ff', ctx5.shadowBlur = 16, ctx5.fillText(v95, 0, v87 * 0.8);
        const v98 = new v1.CanvasTexture(canvasEl5);
        v98.wrapS = v1.RepeatWrapping, v98.repeat['x'] = v97 / v93, v98.needsUpdate = true;
        const v99 = new v1.CylinderGeometry(v78, v78, 1, 128, 1, true),
            v100 = new v1.MeshBasicMaterial({
                'map': v98,
                'transparent': true,
                'side': v1.DoubleSide,
                'alphaTest': 0.01
            }),
            v101 = new v1.Mesh(v99, v100);
        v101.position['set'](0, 0, 0), v101.rotation['y'] = Math.PI / 2;
        const v102 = new v1.Group();
        v102.add(v101), v102.userData = {
            'ringRadius': v78,
            'angleOffset': 0.15 * Math.PI * 0.5,
            'speed': 0.008,
            'tiltSpeed': 0,
            'rollSpeed': 0,
            'pitchSpeed': 0,
            'tiltAmplitude': Math.PI / 3,
            'rollAmplitude': Math.PI / 6,
            'pitchAmplitude': Math.PI / 8,
            'tiltPhase': Math.PI * 2,
            'rollPhase': Math.PI * 2,
            'pitchPhase': Math.PI * 2,
            'isTextRing': true
        };
        const v103 = v76 / v73 * (Math.PI / 1);
        v102.rotation['x'] = v103, scene.add(v102), window.textRings["push"](v102);
    }
}
createTextRings();

function updateTextRingsRotation() {
    if (!window.textRings || !camera) return;
    window.textRings['forEach']((v104, v105) => {
        v104.children["forEach"](v106 => {
            if (v106.userData['initialAngle'] !== undefined) {
                const v107 = v106.userData["initialAngle"] + v104.userData["angleOffset"],
                    v108 = Math.cos(v107) * v106.userData['ringRadius'],
                    v109 = Math.sin(v107) * v106.userData["ringRadius"];
                v106.position["set"](v108, 0, v109);
                const v110 = new v1.Vector3();
                v106.getWorldPosition(v110);
                const v111 = new v1.Vector3().subVectors(camera.position, v110).normalize(),
                    v112 = Math.atan2(v111.x, v111.z);
                v106.rotation['y'] = v112;
            }
        });
    });
}

function animatePlanetSystem() {
    if (window.textRings) {
        const v113 = Date.now() * 0.001;
        window.textRings['forEach']((v114, v115) => {
            const v116 = v114.userData;
            v116.angleOffset += v116.speed;
            const v117 = Math.sin(v113 * v116.tiltSpeed + v116.tiltPhase) * v116.tiltAmplitude,
                v118 = Math.cos(v113 * v116.rollSpeed + v116.rollPhase) * v116.rollAmplitude,
                v119 = Math.sin(v113 * v116.pitchSpeed + v116.pitchPhase) * v116.pitchAmplitude;
            v114.rotation['x'] = v115 / window.textRings["length"] * (Math.PI / 1) + v117, v114.rotation['z'] = v118, v114.rotation['y'] = v116.angleOffset + v119;
            const v120 = Math.sin(v113 * (v116.tiltSpeed * 0.7) + v116.tiltPhase) * 0.3;
            v114.position['y'] = v120;
            const v121 = (Math.sin(v113 * 1.5 + v115) + 1) / 2,
                v122 = v114.children[0];
            v122 && v122.material && (v122.material["opacity"] = 0.7 + v121 * 0.3);
        }), updateTextRingsRotation();
    }
}
let fadeOpacity = 0.1,
    fadeInProgress = false,
    hintIcon, hintText;

function createHintIcon() {
    hintIcon = new v1.Group(), hintIcon.name = "hint-icon-group", scene.add(hintIcon);
    const v123 = new v1.Group(),
        v124 = new v1.Shape(),
        v125 = 1.5,
        v126 = v125 * 0.5;
    v124.moveTo(0, 0), v124.lineTo(-v126 * 0.4, -v125 * 0.7), v124.lineTo(-v126 * 0.25, -v125 * 0.7), v124.lineTo(-v126 * 0.5, -v125), v124.lineTo(v126 * 0.5, -v125), v124.lineTo(v126 * 0.25, -v125 * 0.7), v124.lineTo(v126 * 0.4, -v125 * 0.7), v124.closePath();
    const v127 = new v1.ShapeGeometry(v124),
        v128 = new v1.MeshBasicMaterial({
            'color': 16777215,
            'side': v1.DoubleSide
        }),
        v129 = new v1.Mesh(v127, v128),
        v130 = new v1.ShapeGeometry(v124),
        v131 = new v1.MeshBasicMaterial({
            'color': 16777215,
            'side': v1.DoubleSide
        }),
        v132 = new v1.Mesh(v130, v131);
    v132.scale['set'](0.8, 0.8, 1), v132.position['z'] = 0.01, v123.add(v129, v132), v123.position['y'] = v125 / 2, v123.rotation['x'] = Math.PI / 2;
    const v133 = new v1.RingGeometry(1.8, 2, 32),
        v134 = new v1.MeshBasicMaterial({
            'color': 16777215,
            'side': v1.DoubleSide,
            'transparent': true,
            'opacity': 0.6
        }),
        v135 = new v1.Mesh(v133, v134);
    v135.rotation['x'] = Math.PI / 2, hintIcon.userData['ringMesh'] = v135, hintIcon.add(v123), hintIcon.add(v135), hintIcon.position['set'](1.5, 1.5, 15), hintIcon.scale["set"](0.8, 0.8, 0.8), hintIcon.lookAt(planet.position), hintIcon.userData['initialPosition'] = hintIcon.position["clone"]();
}

function animateHintIcon(v136) {
    if (!hintIcon) return;
    if (!introStarted) {
        hintIcon.visible = true;
        const v137 = 2.5,
            v138 = 1.5,
            v139 = Math.sin(v136 * v137) * v138,
            v140 = new v1.Vector3();
        hintIcon.getWorldDirection(v140), hintIcon.position['copy'](hintIcon.userData['initialPosition']).addScaledVector(v140, -v139);
        const v141 = hintIcon.userData["ringMesh"],
            v142 = 1 + Math.sin(v136 * v137) * 0.1;
        v141.scale['set'](v142, v142, 1), v141.material['opacity'] = 0.5 + Math.sin(v136 * v137) * 0.2, hintText && (hintText.visible = true, hintText.material['opacity'] = 0.7 + Math.sin(v136 * 3) * 0.3, hintText.position['y'] = 15 + Math.sin(v136 * 2) * 0.5, hintText.lookAt(camera.position));
    } else {
        if (hintIcon) hintIcon.visible = false;
        if (hintText) hintText.visible = false;
    }
}

function animate() {
    requestAnimationFrame(animate);
    const v143 = performance.now() * 0.001;
    animateHintIcon(v143), controls.update(), planet.material["uniforms"].time["value"] = v143 * 0.5;
    if (fadeInProgress && fadeOpacity < 1) {
        fadeOpacity += 0.025;
        if (fadeOpacity > 1) fadeOpacity = 1;
    }!introStarted ? (fadeOpacity = 0.1, scene.traverse(v144 => {
        if (v144.name === "starfield") {
            v144.points && v144.material['opacity'] !== undefined && (v144.material["transparent"] = false, v144.material["opacity"] = 1);
            return;
        }
        if (v144.userData["isTextRing"] || v144.parent && v144.parent["userData"] && v144.parent['userData'].isTextRing) v144.material && v144.material["opacity"] !== undefined && (v144.material["transparent"] = false, v144.material["opacity"] = 1), v144.material && v144.material['color'] && v144.material['color'].set(16777215);
        else v144 !== planet && v144 !== centralGlow && v144 !== hintIcon && v144.type !== "Scene" && !v144.parent["isGroup"] && (v144.material && v144.material["opacity"] !== undefined && (v144.material['transparent'] = true, v144.material["opacity"] = 0.1));
    }), planet.visible = true, centralGlow.visible = true) : scene.traverse(v145 => {
        !(v145.userData["isTextRing"] || v145.parent && v145.parent['userData'] && v145.parent['userData'].isTextRing || v145 === planet || v145 === centralGlow || v145.type === "Scene") ? v145.material && v145.material['opacity'] !== undefined && (v145.material["transparent"] = true, v145.material['opacity'] = fadeOpacity): v145.material && v145.material["opacity"] !== undefined && (v145.material["opacity"] = 1, v145.material["transparent"] = false), v145.material && v145.material["color"] && v145.material["color"].set(16777215);
    });
    for (let v146 = shootingStars.length - 1; v146 >= 0; v146--) {
        const v147 = shootingStars[v146];
        v147.userData['life']++;
        let v148 = 1;
        if (v147.userData["life"] < 30) v148 = v147.userData["life"] / 30;
        else v147.userData['life'] > v147.userData['maxLife'] - 30 && (v148 = (v147.userData["maxLife"] - v147.userData["life"]) / 30);
        v147.userData["progress"] += v147.userData['speed'];
        if (v147.userData['progress'] > 1) {
            scene.remove(v147), shootingStars.splice(v146, 1);
            continue;
        }
        const v149 = v147.userData['curve'].getPoint(v147.userData["progress"]);
        v147.position["copy"](v149), v147.userData["head"].material['opacity'] = v148, v147.userData['head'].children[0].material['uniforms'].time['value'] = v143;
        const v150 = v147.userData["trail"],
            v151 = v147.userData['trailPoints'];
        v151[0].copy(v149);
        for (let v152 = 1; v152 < v147.userData["trailLength"]; v152++) {
            const v153 = Math.max(0, v147.userData["progress"] - v152 * 0.01);
            v151[v152].copy(v147.userData['curve'].getPoint(v153));
        }
        v150.geometry["setFromPoints"](v151), v150.material["opacity"] = v148 * 0.7;
    }
    shootingStars.length < 3 && Math.random() < 0.02 && createShootingStar(), scene.traverse(v154 => {
        if (v154.isPoints && v154.userData['materialNear'] && v154.userData['materialFar']) {
            const v155 = v154.geometry['getAttribute']("position");
            let v156 = false;
            for (let v157 = 0; v157 < v155.count; v157++) {
                const v158 = v155.getX(v157) + v154.position['x'],
                    v159 = v155.getY(v157) + v154.position['y'],
                    v160 = v155.getZ(v157) + v154.position['z'],
                    v161 = camera.position["distanceTo"](new v1.Vector3(v158, v159, v160));
                if (v161 < 10) {
                    v156 = true;
                    break;
                }
            }
            v156 ? v154.material !== v154.userData['materialNear'] && (v154.material = v154.userData['materialNear'], v154.geometry = v154.userData["geometryNear"]) : v154.material !== v154.userData['materialFar'] && (v154.material = v154.userData["materialFar"], v154.geometry = v154.userData['geometryFar']);
        }
    }), planet.lookAt(camera.position), animatePlanetSystem(), starField && starField.material && starField.material['opacity'] !== undefined && (starField.material["opacity"] = 1, starField.material["transparent"] = false), renderer.render(scene, camera);
}

function createHintText() {
    const v162 = 512,
        canvasEl6 = document.createElement('canvas');
    canvasEl6.width = canvasEl6.height = v162;
    const ctx6 = canvasEl6.getContext('2d'),
        v163 = 50,
        v164 = 'Chạm\x20Vào\x20Tinh\x20Cầu';
    ctx6.font = 'bold\x20' + v163 + 'px\x20Arial,sans-serif', ctx6.textAlign = 'center', ctx6.textBaseline = 'middle', ctx6.shadowColor = "#ff6969ff", ctx6.shadowBlur = 5, ctx6.lineWidth = 2, ctx6.strokeStyle = "rgba(255,111,164,0.8)", ctx6.strokeText(v164, v162 / 2, v162 / 2), ctx6.shadowColor = "#e0b3ff", ctx6.shadowBlur = 5, ctx6.lineWidth = 2, ctx6.strokeStyle = "rgba(255,180,186,0.5)", ctx6.strokeText(v164, v162 / 2, v162 / 2), ctx6.shadowColor = "transparent", ctx6.shadowBlur = 0, ctx6.fillStyle = "white", ctx6.fillText(v164, v162 / 2, v162 / 2);
    const v165 = new v1.CanvasTexture(canvasEl6);
    v165.needsUpdate = true;
    const v166 = new v1.MeshBasicMaterial({
            'map': v165,
            'transparent': true,
            'side': v1.DoubleSide
        }),
        v167 = new v1.PlaneGeometry(16, 8);
    hintText = new v1.Mesh(v167, v166), hintText.position["set"](0, 15, 0), scene.add(hintText);
}
createShootingStar(), createHintIcon(), createHintText(), window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight, camera.updateProjectionMatrix(), renderer.setSize(window.innerWidth, window.innerHeight), controls.target['set'](0, 0, 0), controls.update();
});

function startCameraAnimation() {
    const v168 = {
            'x': camera.position['x'],
            'y': camera.position['y'],
            'z': camera.position['z']
        },
        v169 = {
            'x': v168.x,
            'y': 0,
            'z': v168.z
        },
        v170 = {
            'x': v168.x,
            'y': 0,
            'z': 160
        },
        v171 = {
            'x': -40,
            'y': 100,
            'z': 100
        },
        v172 = 0.2,
        v173 = 0.55,
        v174 = 0.4;
    let v175 = 0;

    function v176() {
        v175 += 0.00101;
        let v177;
        if (v175 < v172) {
            let v178 = v175 / v172;
            v177 = {
                'x': v168.x + (v169.x - v168.x) * v178,
                'y': v168.y + (v169.y - v168.y) * v178,
                'z': v168.z + (v169.z - v168.z) * v178
            };
        } else {
            if (v175 < v172 + v173) {
                let v179 = (v175 - v172) / v173;
                v177 = {
                    'x': v169.x + (v170.x - v169.x) * v179,
                    'y': v169.y + (v170.y - v169.y) * v179,
                    'z': v169.z + (v170.z - v169.z) * v179
                };
            } else {
                if (v175 < v172 + v173 + v174) {
                    let v180 = (v175 - v172 - v173) / v174,
                        v181 = 0.5 - 0.5 * Math.cos(Math.PI * v180);
                    v177 = {
                        'x': v170.x + (v171.x - v170.x) * v181,
                        'y': v170.y + (v171.y - v170.y) * v181,
                        'z': v170.z + (v171.z - v170.z) * v181
                    };
                } else {
                    camera.position["set"](v171.x, v171.y, v171.z), camera.lookAt(0, 0, 0), controls.target["set"](0, 0, 0), controls.update(), controls.enabled = true;
                    return;
                }
            }
        }
        camera.position["set"](v177.x, v177.y, v177.z), camera.lookAt(0, 0, 0), requestAnimationFrame(v176);
    }
    controls.enabled = false, v176();
}
const raycaster = new v1.Raycaster(),
    mouse = new v1.Vector2();
let introStarted = false;
const originalStarCount = starGeometry.getAttribute('position').count;
starField && starField.geometry && starField.geometry["setDrawRange"](0, Math.floor(originalStarCount * 0.1));

function requestFullScreen() {
    const v182 = document.documentElement;
    if (v182.requestFullscreen) v182.requestFullscreen();
    else {
        if (v182.mozRequestFullScreen) v182.mozRequestFullScreen();
        else {
            if (v182.webkitRequestFullscreen) v182.webkitRequestFullscreen();
            else v182.msRequestFullscreen && v182.msRequestFullscreen();
        }
    }
}

function onCanvasClick(v183) {
    if (introStarted) return;
    const v184 = renderer.domElement['getBoundingClientRect']();
    mouse.x = (v183.clientX - v184.left) / v184.width * 2 - 1, mouse.y = -((v183.clientY - v184.top) / v184.height) * 2 + 1, raycaster.setFromCamera(mouse, camera);
    const v185 = raycaster.intersectObject(planet);
    if (v185.length > 0) requestFullScreen(), introStarted = true, fadeInProgress = true, document.body['classList'].add('intro-started'), startCameraAnimation(), starField && starField.geometry && starField.geometry["setDrawRange"](0, originalStarCount);
    else {
        if (introStarted) {
            const v186 = raycaster.intersectObjects(heartPointClouds);
            if (v186.length > 0) {
                const v187 = v186[0].object;
                controls.target["copy"](v187.position);
            }
        }
    }
}
renderer.domElement['addEventListener']("click", onCanvasClick), animate(), planet.name = "main-planet", centralGlow.name = "main-glow";