import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// --- Inisialisasi Dasar ---
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x121212); // Warna latar belakang sesuai CSS
document.body.appendChild(renderer.domElement);

// --- Pencahayaan (Lighting) ---
// Cahaya ambient untuk menerangi seluruh objek secara merata
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

// Cahaya directional untuk memberikan bayangan dan highlight (efek 3D)
const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(5, 10, 7.5);
scene.add(directionalLight);

camera.position.z = 7;
camera.position.y = 5;
camera.position.x = 5;

// --- Kontrol Mouse ---
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true; // Efek "berat" saat memutar
controls.dampingFactor = 0.05;
controls.screenSpacePanning = false;
controls.minDistance = 5;
controls.maxDistance = 20;

// --- Membuat Rubik's Cube ---
const CUBE_SIZE = 1;
const GAP = 0.1; // Jarak antar kubus kecil
const CUBE_POSITIONS = [-CUBE_SIZE - GAP, 0, CUBE_SIZE + GAP];
const rubiksCube = new THREE.Group();

const colors = {
    front:  0xff0000, // Merah
    back:   0xffa500, // Oranye
    up:     0xffffff, // Putih
    down:   0xffff00, // Kuning
    left:   0x0000ff, // Biru
    right:  0x00ff00, // Hijau
    inner:  0x1a1a1a  // Warna bagian dalam (hitam)
};

for (let x of CUBE_POSITIONS) {
    for (let y of CUBE_POSITIONS) {
        for (let z of CUBE_POSITIONS) {
            // Jangan buat kubus di tengah (tidak terlihat)
            if (x === 0 && y === 0 && z === 0) continue;

            const geometry = new THREE.BoxGeometry(CUBE_SIZE, CUBE_SIZE, CUBE_SIZE);
            const materials = [
                new THREE.MeshLambertMaterial({ color: x > 0 ? colors.right : colors.inner }),
                new THREE.MeshLambertMaterial({ color: x < 0 ? colors.left : colors.inner }),
                new THREE.MeshLambertMaterial({ color: y > 0 ? colors.up : colors.inner }),
                new THREE.MeshLambertMaterial({ color: y < 0 ? colors.down : colors.inner }),
                new THREE.MeshLambertMaterial({ color: z > 0 ? colors.front : colors.inner }),
                new THREE.MeshLambertMaterial({ color: z < 0 ? colors.back : colors.inner }),
            ];

            const cubie = new THREE.Mesh(geometry, materials);
            cubie.position.set(x, y, z);
            rubiksCube.add(cubie);
        }
    }
}
scene.add(rubiksCube);

// --- Logika Rotasi ---
let isRotating = false;
const rotationSpeed = 0.02;

// Fungsi untuk melakukan rotasi
function rotateLayer(axis, layer, direction) {
    if (isRotating) return;
    isRotating = true;

    const pivot = new THREE.Group();
    scene.add(pivot);

    const cubiesToRotate = [];
    rubiksCube.children.forEach(cubie => {
        // Pilih kubus yang berada di layer yang tepat
        if (Math.abs(cubie.position[axis] - layer) < 0.1) {
            cubiesToRotate.push(cubie);
        }
    });

    // Pindahkan cubies ke pivot untuk diputar
    cubiesToRotate.forEach(cubie => pivot.attach(cubie));

    let angle = 0;
    const targetAngle = (Math.PI / 2) * direction;

    function animateRotation() {
        angle += rotationSpeed * Math.PI;
        if (angle >= Math.abs(targetAngle)) {
            pivot.rotation[axis] = targetAngle;
            
            // Kembalikan cubies ke scene utama
            cubiesToRotate.forEach(cubie => rubiksCube.attach(cubie));
            scene.remove(pivot);
            isRotating = false;
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
    
    const direction = event.shiftKey ? -1 : 1; // Tahan shift untuk putaran terbalik
    const layerPos = CUBE_SIZE + GAP;

    switch (event.key.toUpperCase()) {
        case 'U': rotateLayer('y', layerPos, -direction); break; // Up
        case 'D': rotateLayer('y', -layerPos, direction); break; // Down
        case 'L': rotateLayer('x', -layerPos, direction); break; // Left
        case 'R': rotateLayer('x', layerPos, -direction); break; // Right
        case 'F': rotateLayer('z', layerPos, -direction); break; // Front
        case 'B': rotateLayer('z', -layerPos, direction); break; // Back
    }
});


// --- Render Loop ---
function animate() {
    requestAnimationFrame(animate);
    controls.update(); // Penting untuk damping
    renderer.render(scene, camera);
}
animate();

// --- Menyesuaikan ukuran jika window di-resize ---
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
