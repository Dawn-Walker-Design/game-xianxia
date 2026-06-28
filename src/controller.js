/**
 * 仙侠探索游戏 - 第一人称控制器
 * WASD行走 / 鼠标视角 / Space飞行(仙侠御风) / Shift加速
 */
import * as THREE from 'three';
import { clamp, lerp } from './utils.js';

export class FirstPersonController {
  constructor(camera, domElement) {
    this.camera = camera;
    this.domElement = domElement;

    // Movement state
    this.moveSpeed = 12;
    this.flySpeed = 18;
    this.boostMultiplier = 2.5;
    this.mouseSensitivity = 0.002;

    // Input state
    this.keys = {};
    this.mouseDown = false;
    this.isPointerLocked = false;

    // Physics state
    this.velocity = new THREE.Vector3();
    this.euler = new THREE.Euler(0, 0, 0, 'YXZ');
    this.height = 1.8; // eye height

    // Flight mode (press F to toggle)
    this.isFlying = false;

    // Smooth damping
    this.targetVelocity = new THREE.Vector3();
    this.smoothFactor = 0.15;

    // Terrain height function (set externally)
    this.getTerrainHeight = null;

    this.setupEvents();
  }

  setupEvents() {
    // Keyboard
    document.addEventListener('keydown', (e) => {
      this.keys[e.code] = true;

      // Toggle flight with F
      if (e.code === 'KeyF') {
        this.isFlying = !this.isFlying;
        this.showModeToast();
      }
    });

    document.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
    });

    // Pointer lock
    this.domElement.addEventListener('click', () => {
      if (!this.isPointerLocked) {
        this.domElement.requestPointerLock();
      }
    });

    document.addEventListener('pointerlockchange', () => {
      this.isPointerLocked = document.pointerLockElement === this.domElement;
    });

    // Mouse movement
    document.addEventListener('mousemove', (e) => {
      if (!this.isPointerLocked) return;

      this.euler.setFromQuaternion(this.camera.quaternion);
      this.euler.y -= e.movementX * this.mouseSensitivity;
      this.euler.x -= e.movementY * this.mouseSensitivity;
      this.euler.x = clamp(this.euler.x, -Math.PI / 2.3, Math.PI / 2.3);
      this.camera.quaternion.setFromEuler(this.euler);
    });

    // Touch support for mobile
    this.setupTouchControls();
  }

  setupTouchControls() {
    let touchStartX = 0, touchStartY = 0;
    let lastTouchTime = 0;

    this.domElement.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
        lastTouchTime = Date.now();
        this.isPointerLocked = true;
      }
    });

    this.domElement.addEventListener('touchmove', (e) => {
      if (!this.isPointerLocked || e.touches.length !== 1) return;
      const dx = e.touches[0].clientX - touchStartX;
      const dy = e.touches[0].clientY - touchStartY;
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;

      this.euler.setFromQuaternion(this.camera.quaternion);
      this.euler.y -= dx * 0.003;
      this.euler.x -= dy * 0.003;
      this.euler.x = clamp(this.euler.x, -Math.PI / 2.3, Math.PI / 2.3);
      this.camera.quaternion.setFromEuler(this.euler);
    });

    // Double tap to toggle flight
    this.domElement.addEventListener('touchend', (e) => {
      const now = Date.now();
      if (now - lastTouchTime < 300) {
        this.isFlying = !this.isFlying;
        this.showModeToast();
      }
    });
  }

  showModeToast() {
    const toast = document.getElementById('mode-toast');
    if (!toast) return;
    toast.textContent = this.isFlying ? '🦅 御风飞行' : '🚶 步行';
    toast.classList.add('visible');
    setTimeout(() => toast.classList.remove('visible'), 1500);
  }

  update(deltaTime, terrainHeightFn) {
    this.getTerrainHeight = terrainHeightFn || this.getTerrainHeight;

    // Calculate movement direction relative to camera
    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion);
    forward.y = 0;
    forward.normalize();

    const right = new THREE.Vector3(1, 0, 0).applyQuaternion(this.camera.quaternion);
    right.y = 0;
    right.normalize();

    // Reset target velocity
    this.targetVelocity.set(0, 0, 0);

    const speed = this.isFlying ? this.flySpeed : this.moveSpeed;
    const boost = this.keys['ShiftLeft'] || this.keys['ShiftRight'] ? this.boostMultiplier : 1;

    // WASD movement
    if (this.keys['KeyW']) this.targetVelocity.add(forward.clone().multiplyScalar(speed * boost));
    if (this.keys['KeyS']) this.targetVelocity.add(forward.clone().multiplyScalar(-speed * boost));
    if (this.keys['KeyA']) this.targetVelocity.add(right.clone().multiplyScalar(-speed * boost));
    if (this.keys['KeyD']) this.targetVelocity.add(right.clone().multiplyScalar(speed * boost));

    if (this.isFlying) {
      // Vertical movement in flight mode
      if (this.keys['Space']) this.targetVelocity.y = speed * boost;
      if (this.keys['KeyQ'] || this.keys['ControlLeft']) this.targetVelocity.y = -speed * boost;
    }

    // Smooth velocity
    this.velocity.lerp(this.targetVelocity, this.smoothFactor);

    // Apply movement
    const moveDelta = this.velocity.clone().multiplyScalar(deltaTime);
    this.camera.position.add(moveDelta);

    // Terrain collision (when walking)
    if (!this.isFlying && this.getTerrainHeight) {
      const terrainY = this.getTerrainHeight(this.camera.position.x, this.camera.position.z);
      const targetY = terrainY + this.height;
      this.camera.position.y = lerp(this.camera.position.y, targetY, 0.2);

      // Clamp to world bounds
      const bound = 95;
      this.camera.position.x = clamp(this.camera.position.x, -bound, bound);
      this.camera.position.z = clamp(this.camera.position.z, -bound, bound);
    }

    // Clamp flight height to avoid going too low
    if (this.isFlying) {
      const bound = 95;
      this.camera.position.x = clamp(this.camera.position.x, -bound, bound);
      this.camera.position.z = clamp(this.camera.position.z, -bound, bound);
      this.camera.position.y = clamp(this.camera.position.y, 0.5, 80);
    }
  }

  getState() {
    return {
      position: this.camera.position.clone(),
      isFlying: this.isFlying,
      isMoving: this.velocity.length() > 0.5,
      isBoosting: (this.keys['ShiftLeft'] || this.keys['ShiftRight']) && this.velocity.length() > 0.5,
    };
  }
}
