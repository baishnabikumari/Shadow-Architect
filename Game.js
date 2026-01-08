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

        //floor
        const floorGeo = new THREE.PlaneGeometryf(200, 100);
        const floorMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 1 });
        const floor = new THREE.Mesh(floorGeo, floorMat);
        floor.position.y = 0;
        floor.receiveShadow = true;
        this.scene.add(floor);

        //raycast for detection of shadow
        this.raycaster = new THREE.Raycaster();
        this.setupControls();
    }
    setupControls(){
        this.transformControl = new transformControl(this.camera, this.renderer.domElement);
        this.scene.add(this.transformControl);
        this.transformControl.addEventListener('dragging-changed', (event) => {
        //pause game while debugging? no, keep it in real time!
        });
        window.addEventListener('keydown', (e) => {
            if(e.key.toLowerCase() === 'r'){
                this.transformControl.setMode(this.transformControl.mode === 'translate' ? 'rotate' : 'translate');
            }
            if (e.key === '+' || e.key === '=') this.transformControl.setSize(this.transformControl.size + 0.1);
            if (e.key === '-' || e.key === '_') this.transformControl.setSize(Math.max(0.1, this.transformControl.size - 0.1));
        });
        window.addEventListener('click', (event) => { //click to start
            //raycast will find click object and the logic will be handled by transformcontrols all the time
        });
    }
    loadLevel(index){
        this.currentLevelIndex = index;
        const levelData = this.levels[index];

        //reset
        this.isRunning = false;
        this.isGameOver = false;
        this.deathTimer = 0;
        this.uiCallback('STATUS_CHANGE', 'SAFE');
        this.uiCallback('LEVEL_LOADED', index);

        //reset player
        this.player.position.set(levelData.start.x, levelData.start.y, levelData.start.z);
        this.player.visible = true;
        this.player.material.emissive.setHex(0x220000);

        //movement of light
        this.spotLight.position.set(levelData.lightPos.x, levelData.lightPos.y, levelData.lightPos.z);

        //old obstacles removed
        if(this.currentObstacles){
            this.currentObstacles.forEach(obs => {
                this.scene.remove(obs);
                this.transformControl.detach();
            });
        }
        this.currentObstacles = [];

        //new obs
        levelData.obstacles.forEach(data => {
            const geo = new THREE.BoxGeometry(data.size[0], data.size[1], data.size[2]);
            const mat = new THREE.MeshStandardMaterial({ color: 0x808080, roughness: 0.2 });
            const mesh = new THREE.Mesh(geo, mat);
            mesh.position.set(data.pos[0], data.pos[1], data.pos[2]);
            mesh.position.set(data.rot[0], data.rot[1], data.pos[2]);
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            this.scene.add(mesh);
            this.currentObstacles.push(mesh);
        });
        //attach controls to the first obstacle by default
        if(this.currentObstacles.length > 0){
            this.transformControl.attach(this.currentObstacles[0]);
        }
        if(this.targetLine) this.scene.remove(this.targetLine);
        const lineGeo = new THREE.BoxGeometry(0.5, 0.1, 10);
        const lineMat = new THREE.MeshBasicMaterial({ color: 0x32D7B });
        this.targetLine = new THREE.Mesh(lineGeo, lineMat);
        this.targetLine.position.set(levelData.targetX, 0.1, 0);
        this.scene.add(this.targetLine);
    }
    startLevel(){
        this.transformControl.detach();
        this.isRunning = true;
    }
    resetLevel(){
        this.loadLevel(this.currentLevelIndex);
    }
    nextLevel(){
        if(this.currentLevelIndex + 1 < this.levels.length){
            this.loadLevel(this.currentLevelIndex + 1);
            return true;
        }
        return false;
    }
    checkShadows(){
        const playerPos = this.player.position.clone();
        const lightPos = this.spotLight.position.clone();
        const dir = playerPos.sub(lightPos).normalize();
        this.raycaster.set(lightPos, dir);

        //intersecting everything in the scene
        const intersects = this.raycaster.intersectObjects(this.scene.children, true);
        
        //when lights hit the first time
        if(intersects.length > 0) {
            const firstHit = intersects[0].object;
            if(hitObj === this.player){
                this.uiCallback('STATUS_CHANGE', 'DANGER');
                this.player.material.emissive.setHex(0xff0000);
                this.deathTimer++;
            } else {
                this.uiCallback('STATUS_CHANGE', 'SAFE');
                this.player.material.emissive.setHex(0x000000);
                this.deathTimer = Math.max(0, this.deathTimer - 1);
            }
        }
        if(this.deathTimer > 30){
            this.gameOver();
        }
    }
    gameOver(){
        this.isRunning = false;
        this.isGameOver = true;
        this.player.visible = false;
        this.uiCallback('GAME_OVER');
    }
    winLevel(){
        this.isRunning = false;
        this.uiCallback('LEVEL_COMPLETE');
    }
    animate(){
        requestAnimationFrame(() => this.animate());
        if(this.isRunning && !this.isGameOver) {
            this.player.position.x += 0.04;
            this.checkShadows();
            if(this.player.position.x >= this.levels[this.currentLevelIndex].targetX){
                this.winLevel();
            }
        }
        this.renderer.render(this.scene, this.camera);
    }
    onwindowResize(){
        const aspect = window.innerWidth / window.innerHeight;
        const d = 18;
        this.camera.left = -d * aspect;
        this.camera.right = d * aspect;
        this.camera.top = d;
        this.camera.bottom = -d;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
}