import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export class Game {
    constructor(container, uiCallback){
        this.container = container;
        this.uiCallback = uiCallback;

        //game state
        this.currentLevelIndex = 0;
        this.isRunning = false;
        this.isGameOver = false;
        this.deathTimer = 0;

        this.levels = [
            {
                start: { x: 0, y: 1, z: 0 },
                targetX: 20,
                obstacles: [
                    { size: [4, 8, 4], pos: [-4, 4, 5], rot: [0, 0, 0] }
                ],
                lightPos: { x: -10, y: 30, z: 0 }
            },
            {
                start: { x: 0, y: 1, z: 0 },
                targetX: 25,
                obstacles: [
                    { size: [2, 6, 8], pos: [-2, 3, 5], rot: [0, 0, 0] } //wide flat block
                ],
                lightPos: { x: -5, y: 25, z: 10 } //light is angled
            },
            {
                start: { x: 0, y: 1, z: 0 },
                targetX: 30,
                obstacles: [
                    { size: [2, 6, 8], pos: [-2, 3, 5], rot: [0, 0, 0] }
                ],
                lightPos: { x: -5, y: 25, z: 10 } //light is angled
            },
            {
                start: { x: 0, y: 1, z: 0 },
                targetX: 30,
                obstacles: [
                    { size: [3, 10, 3], pos: [-8, 5, 2], rot: [0, 0, 0] },
                    { size: [5, 5, 5], pos: [5, 2.5, 8], rot: [0, 0, 0] }
                ],
                lightPos: { x: 0, y: 40, z: 5 } //light straight up
            }
        ];
        this.init();
        this.loadLevel(0);
        this.animate();
    }

    init(){
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x101010);
        this.scene.fog = new THREE.FogExp2(0x101010, 0.035);
        
        //camera
        const aspect = window.innerWidth / window.innerHeight;
        const d = 15;
        this.camera = new THREE.OrthographicCamera(-d * aspect, d * aspect, d, -d, 1, 1000);
        this.camera.position.set(20,20,20);
        this.camera.lookAt(this.scene.position);

        //renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFShadowMap;
        this.container.appendChild(this.renderer.domElement);

        //lights
        const ambient = new THREE.AmbientLight(0xffffff, 0.1);
        this.scene.add(ambient);

        //the sun
        this.spotLight = new THREE.SpotLight(0xffffff, 1500);
        this.spotLight.castShadow = true;
        this.spotLight.angle = Math.PI / 5;
        this.spotLight.penumbra = 0.5;
        this.spotLight.shadow.mapSize.width = 2048;
        this.spotLight.shadow.mapSize.height = 2048;
        this.scene.add(this.spotLight);

        //player for now it will be a cube of red color lets make it
        const pGeo = new THREE.BoxGeometry(1,2,1);
        const pMat = new THREE.MeshStandardMaterial({ color: 0xff3333, emissive: 0x550000 });
        this.player = new THREE.Mesh(pGeo, pMat);
        this.player.castShadow = true;
        this.scene.add(this.player);

        //raycast for detection of shadow
        this.raycaster = new THREE.Raycaster();
    }

    createLevel(){
        const floor = new THREE.Mesh(
            new THREE.PlaneGeometry(100, 100),
            new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.8 })
        );
        floor.rotation.x = -Math.PI / 2;
        floor.receiveShadow = true;
        this.scene.add(floor);

        const boxGeo = new THREE.BoxGeometry(4, 8, 4);
        const boxMat = new THREE.MeshStandardMaterial({ color: 0x888888 });
        const obstacle = new THREE.Mesh(boxGeo, boxMat);
        obstacle.position.set(-6, 4, 4);
        obstacle.castShadow = true;
        obstacle.receiveShadow = true;
        this.scene.add(obstacle);

        this.obstacle = obstacle;
    }
    start(){
        this.isRunning = true;
    }
    reset(){
        this.player.position.set(0, 1, 0);
        this.uiCallback('SAFE');
    }
    checkShadowSafety(){
        const playerPos = this.player.position.clone();
        const lightPos = this.spotLight.position.clone();
        const direction = playerPos.sub(lightPos).normalize();
        this.raycaster.set(lightPos, direction);
        const intersects = this.raycaster.intersectObjects(this.scene.children, true);
        
        //when lights hit the first time
        if(intersects.length > 0) {
            const firstHit = intersects[0].object;
            if(firstHit === this.player){
                this.uiCallback('DANGER');
                this.player.material.emissive.setHex(0xff0000);
            } else {
                this.uiCallback('SAFE');
                this.player.material.emissive.setHex(0x000000);
            }
        }
    }
    animate(){
        requestAnimationFrame(() => this.animate());
        if(this.isRunning) {
            this.player.position.x += 0.01;
            if(this.obstacle){
                this.obstacle.rotation.y += 0.002;
            }
            this.checkShadowSafety();
        }
        this.renderer.render(this.scene, this.camera);
    }
    onwindowResize(){
        const aspect = window.innerWidth / window.innerHeight;
        const d = 15;
        this.camera.left = -d * aspect;
        this.camera.right = d * aspect;
        this.camera.top = d;
        this.camera.bottom = -d;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
}