import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export class Game {
    constructor(container, uiCallback){
        this.container = container;
        this.uiCallback = uiCallback;
        this.isRunning = false;
        this.init();
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
        this.spotLight = new THREE.SpotLight(0xffffff, 1000);
        this.spotLight.position.set(-10, 30, 0);
        this.spotLight.castShadow = true;
        this.spotLight.angle = Math.PI / 6;
        this.spotLight.penumbra = 1;
        this.spotLight.shadow.mapSize.width = 2048;
        this.spotLight.shadow.mapSize.height = 2048;
        this.scene.add(this.spotLight);

        //geometry for levels
        this.createLevels();

        //player for now it will be a cube of red color lets make it
        const pGeo = new THREE.BoxGeometry(1,2,1);
        const pMat = new THREE.MeshStandardMaterial({ color: 0xf3333, emissive: 0x550000 });
        this.player = new THREE.Mesh(pGeo, pMat);
        this.player.position.set(0,1,0);
        this.player.castShadow = true;
        this.scene.add(this.player);

        //raycast for detection of shadow
        this.raycaster = new THREE.Raycaster();
    }
}