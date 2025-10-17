import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// --- Variabel Global & Inisialisasi ---
let currentCubeSize = 3;
let rubiksCube;
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });

renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// --- Latar Belakang "Hidup" (Skybox) ---
const loader = new THREE.CubeTextureLoader();
const texture = loader.load([
    'https://threejs.org/examples/textures/cube/Bridge2/px.jpg',
    'https://threejs.org/examples/textures/cube/Bridge2/nx.jpg',
    'https://threejs.org/examples/textures/cube/Bridge2/py.jpg',
    'https://threejs.org/examples/textures/cube/Bridge2/ny.jpg',
    'https://threejs.org/examples/textures/cube/Bridge2/pz.jpg',
    'https://threejs.org/examples/textures/cube/Bridge2/nz.jpg',
]);
scene.background = texture;
// Environment map membuat material memantulkan latar belakang
scene.environment = texture;


// --- Pencahayaan ---
const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
scene.add(ambientLight);
const directionalLight = new THREE.DirectionalLight(0xffffff, 1.2);
directionalLight.position.set(5, 10, 7.5);
scene.add(directionalLight);

camera.position.set(5, 5, 7);

// --- Kontrol Mouse ---
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.minDistance = 5;
controls.maxDistance = 25;

// --- Fungsi Membuat Rubik's Cube Dinamis ---
const CUBE_SIZE = 1;
const GAP = 0.1;

function createRubiksCube(size) {
    if (rubiksCube) {
        scene.remove(rubiksCube);
    }
    rubiksCube = new THREE.Group();
    const offset = (size - 1) / 2;

    const colors = {
        front:  0xff0000, // Merah
        back:   0xffa500, // Oranye
        up:     0xffffff, // Putih
        down:   0xffff00, // Kuning
        left:   0x0000ff, // Biru
        right:  0x00ff00, // Hijau
        inner:  0x1a1a1a  // Hitam
    };

    for (let i = 0; i < size; i++) {
        for (let j = 0; j < size; j++) {
            for (let k = 0; k < size; k++) {
                // Jangan buat kubus di bagian dalam yang tidak terlihat
                if (i > 0 && i < size - 1 && j > 0 && j < size - 1 && k > 0 && k < size - 1) {
                    continue;
                }

                const geometry = new THREE.BoxGeometry(CUBE_SIZE, CUBE_SIZE, CUBE_SIZE);
                
                // Menggunakan material standar untuk pantulan
                const materials = [
                    new THREE.MeshStandardMaterial({ color: i === size - 1 ? colors.right : colors.inner, roughness: 0.3, metalness: 0.1 }),
                    new THREE.MeshStandardMaterial({ color: i === 0 ? colors.left : colors.inner, roughness: 0.3, metalness: 0.1 }),
                    new THREE.MeshStandardMaterial({ color: j === size - 1 ? colors.up : colors.inner, roughness: 0.3, metalness: 0.1 }),
                    new THREE.MeshStandardMaterial({ color: j === 0 ? colors.down : colors.inner, roughness: 0.3, metalness: 0.1 }),
                    new THREE.MeshStandardMaterial({ color: k === size - 1 ? colors.front : colors.inner, roughness: 0.3, metalness: 0.1 }),
                    new THREE.MeshStandardMaterial({ color: k === 0 ? colors.back : colors.inner, roughness: 0.3, metalness: 0.1 }),
                ];

                const cubie = new THREE.Mesh(geometry, materials);
                cubie.position.set(
                    (i - offset) * (CUBE_SIZE + GAP),
                    (j - offset) * (CUBE_SIZE + GAP),
                    (k - offset) * (CUBE_SIZE + GAP)
                );
                rubiksCube.add(cubie);
            }
        }
    }
    scene.add(rubiksCube);
}

// --- Logika Rotasi ---
let isRotating = false;
const rotationSpeed = 0.02; // Bisa disesuaikan

function rotateLayer(axis, layer, direction) {
    if (isRotating) return;
    isRotating = true;

    const pivot = new THREE.Group();
    scene.add(pivot);
    
    const cubiesToRotate = [];
    rubiksCube.children.forEach(cubie => {
        if (Math.abs(cubie.position[axis] - layer) < 0.1) {
            cubiesToRotate.push(cubie);
        }
    });
    
    cubiesToRotate.forEach(cubie => pivot.attach(cubie));

    let angle = 0;
    const targetAngle = (Math.PI / 2) * direction;

    function animateRotation() {
        angle += rotationSpeed * Math.PI;
        if (angle >= Math.abs(targetAngle)) {
            pivot.rotation[axis] = targetAngle;
            cubiesToRotate.forEach(cubie => rubiksCube.attach(cubie));
            scene.remove(pivot);
            isRotating = false;
            // Bulatkan posisi & rotasi untuk mencegah error floating point
            rubiksCube.children.forEach(c => {
                c.position.round();
                c.rotation.x = Math.round(c.rotation.x / (Math.PI/2)) * (Math.PI/2);
                c.rotation.y = Math.round(c.rotation.y / (Math.PI/2)) * (Math.PI/2);
                c.rotation.z = Math.round(c.rotation.z / (Math.PI/2)) * (Math.PI/2);
            });
            return;
        }
        
        pivot.rotation[axis] = angle * direction;
        requestAnimationFrame(animateRotation);
    }
    
    animateRotation();
}

// Event listener untuk keyboard
window.addEventListener('keydown', (event) => {
    if (isRotating) return;
    
    const direction = event.shiftKey ? -1 : 1;
    const layerPos = ((currentCubeSize - 1) / 2) * (CUBE_SIZE + GAP);

    switch (event.key.toUpperCase()) {
        case 'U': rotateLayer('y', layerPos, -direction); break;
        case 'D': rotateLayer('y', -layerPos, direction); break;
        case 'L': rotateLayer('x', -layerPos, direction); break;
        case 'R': rotateLayer('x', layerPos, -direction); break;
        case 'F': rotateLayer('z', layerPos, -direction); break;
        case 'B': rotateLayer('z', -layerPos, direction); break;
    }
});

// --- Event Listeners untuk Level ---
const buttons = {
    'btn-2x2': 2,
    'btn-3x3': 3,
    'btn-4x4': 4,
};

function setActiveButton(activeId) {
    for (const id in buttons) {
        document.getElementById(id).classList.toggle('active', id === activeId);
    }
}

for (const id in buttons) {
    document.getElementById(id).addEventListener('click', () => {
        if (isRotating) return;
        const size = buttons[id];
        if (size !== currentCubeSize) {
            currentCubeSize = size;
            createRubiksCube(currentCubeSize);
            setActiveButton(id);
        }
    });
}


// --- Render Loop ---
function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}

// --- Inisialisasi Awal ---
createRubiksCube(currentCubeSize);
animate();

// --- Penyesuaian Ukuran Window ---
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
