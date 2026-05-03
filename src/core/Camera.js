import * as THREE from 'three';

class Camera {
    constructor(canvas) {
        this.canvas = canvas;
        this.camera = null;
        this.position = new THREE.Vector3(0, 50, 50);
        this.target = new THREE.Vector3(0, 0, 0);
        this.up = new THREE.Vector3(0, 1, 0);
        
        // 固定的相机朝向（45度俯视）
        this.cameraDirection = new THREE.Vector3(1, -1, 1).normalize();
        
        // 摄像机控制参数
        this.minZoom = 20;
        this.maxZoom = 150;
        this.zoomLevel = 50;
        this.moveSpeed = 30;
        this.borderScrollMargin = 20;
        
        // 输入状态
        this.keys = {};
        this.mouse = {
            x: 0,
            y: 0,
            isDown: false,
            isDragging: false,
            dragStartX: 0,
            dragStartY: 0
        };
        
        // 射线投射器（用于鼠标交互）
        this.raycaster = new THREE.Raycaster();
        this.mouseVector = new THREE.Vector2();
    }

    init() {
        // 创建正交摄像机（用于RTS风格）
        const aspect = this.canvas.clientWidth / this.canvas.clientHeight;
        const frustumSize = this.zoomLevel;
        
        this.camera = new THREE.OrthographicCamera(
            -frustumSize * aspect / 2,
            frustumSize * aspect / 2,
            frustumSize / 2,
            -frustumSize / 2,
            0.1,
            1000
        );
        
        // 先更新相机位置以获得正确的45度视角
        this.updateCameraPosition();
        
        // 设置摄像机位置和朝向
        this.camera.position.copy(this.position);
        this.camera.lookAt(this.target);
        this.camera.up.copy(this.up);
    }

    setRTSView() {
        // 设置45度俯视视角，固定朝向
        this.updateCameraPosition();
        this.camera.position.copy(this.position);
        this.camera.lookAt(this.target);
    }

    update(deltaTime) {
        // 处理键盘移动
        this.handleKeyboardMovement(deltaTime);

        // 处理鼠标边界滚动
        this.handleBorderScroll(deltaTime);

        // 处理鼠标拖拽
        this.handleMouseDrag(deltaTime);

        // 限制相机目标点在边界内
        this.clampTargetToBounds();

        // 确保target.y始终为0，防止旋转
        this.target.y = 0;

        // 更新摄像机位置（保持固定朝向）
        this.camera.position.copy(this.position);
        this.camera.lookAt(this.target);
    }

    /**
     * 限制相机目标点在地图边界内
     */
    clampTargetToBounds() {
        const mapSize = this.map ? this.map.getSize() : { width: 200, height: 200 };
        const boundary = Math.min(mapSize.width, mapSize.height) / 2 - 5;
        this.target.x = Math.max(-boundary, Math.min(boundary, this.target.x));
        this.target.z = Math.max(-boundary, Math.min(boundary, this.target.z));
    }

    setMap(map) {
        this.map = map;
    }

    handleKeyboardMovement(deltaTime) {
        const moveAmount = this.moveSpeed * deltaTime;
        
        // WASD移动
        if (this.keys['w'] || this.keys['W'] || this.keys['ArrowUp']) {
            this.moveForward(moveAmount);
        }
        if (this.keys['s'] || this.keys['S'] || this.keys['ArrowDown']) {
            this.moveBackward(moveAmount);
        }
        if (this.keys['a'] || this.keys['A'] || this.keys['ArrowLeft']) {
            this.moveLeft(moveAmount);
        }
        if (this.keys['d'] || this.keys['D'] || this.keys['ArrowRight']) {
            this.moveRight(moveAmount);
        }
        
        // 确保target.y始终为0，防止旋转
        this.target.y = 0;
    }

    handleBorderScroll(deltaTime) {
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = this.mouse.x - rect.left;
        const mouseY = this.mouse.y - rect.top;
        
        const moveAmount = this.moveSpeed * deltaTime;
        
        // 检查鼠标是否在边界附近
        if (mouseX < this.borderScrollMargin) {
            this.moveLeft(moveAmount);
        } else if (mouseX > rect.width - this.borderScrollMargin) {
            this.moveRight(moveAmount);
        }
        
        if (mouseY < this.borderScrollMargin) {
            this.moveForward(moveAmount);
        } else if (mouseY > rect.height - this.borderScrollMargin) {
            this.moveBackward(moveAmount);
        }
    }

    handleMouseDrag(deltaTime) {
        if (this.mouse.isDragging) {
            const deltaX = this.mouse.x - this.mouse.dragStartX;
            const deltaY = this.mouse.y - this.mouse.dragStartY;
            
            const moveAmount = this.moveSpeed * deltaTime * 0.5;
            
            if (Math.abs(deltaX) > 5) {
                if (deltaX > 0) {
                    this.moveRight(moveAmount);
                } else {
                    this.moveLeft(moveAmount);
                }
            }
            
            if (Math.abs(deltaY) > 5) {
                if (deltaY > 0) {
                    this.moveBackward(moveAmount);
                } else {
                    this.moveForward(moveAmount);
                }
            }
            
            this.mouse.dragStartX = this.mouse.x;
            this.mouse.dragStartY = this.mouse.y;
        }
    }

    moveForward(amount) {
        // 相机从东南方向看，屏幕上方向对应地图的西北方向 (-x, -z)
        const moveDir = new THREE.Vector3(-1, 0, -1).normalize();
        this.target.add(moveDir.clone().multiplyScalar(amount));
        this.updateCameraPosition();
    }

    moveBackward(amount) {
        // 相机从东南方向看，屏幕下方向对应地图的东南方向 (+x, +z)
        const moveDir = new THREE.Vector3(1, 0, 1).normalize();
        this.target.add(moveDir.clone().multiplyScalar(amount));
        this.updateCameraPosition();
    }

    moveLeft(amount) {
        // 相机从东南方向看，屏幕左方向对应地图的西南方向 (-x, +z)
        const moveDir = new THREE.Vector3(-1, 0, 1).normalize();
        this.target.add(moveDir.clone().multiplyScalar(amount));
        this.updateCameraPosition();
    }

    moveRight(amount) {
        // 相机从东南方向看，屏幕右方向对应地图的东北方向 (+x, -z)
        const moveDir = new THREE.Vector3(1, 0, -1).normalize();
        this.target.add(moveDir.clone().multiplyScalar(amount));
        this.updateCameraPosition();
    }

    updateCameraPosition() {
        // 根据target和固定的俯视角度重新计算position
        // 相机从东南方向（+x, +z）45度俯视看地面
        const distance = this.zoomLevel;
        
        // 对于45度俯视，水平距离 = 垂直高度
        const height = distance / Math.sqrt(2);
        
        // 相机位置：在目标位置东南方向上方
        this.position.x = this.target.x + height;
        this.position.z = this.target.z + height;
        this.position.y = height;
    }

    zoom(amount) {
        this.zoomLevel = Math.max(this.minZoom, Math.min(this.maxZoom, this.zoomLevel + amount));
        this.updateCameraPosition();
        this.updateProjectionMatrix();
    }

    updateProjectionMatrix() {
        const aspect = this.canvas.clientWidth / this.canvas.clientHeight;
        const frustumSize = this.zoomLevel;
        
        this.camera.left = -frustumSize * aspect / 2;
        this.camera.right = frustumSize * aspect / 2;
        this.camera.top = frustumSize / 2;
        this.camera.bottom = -frustumSize / 2;
        
        this.camera.updateProjectionMatrix();
    }

    resize(width, height) {
        const aspect = width / height;
        const frustumSize = this.zoomLevel;
        
        this.camera.left = -frustumSize * aspect / 2;
        this.camera.right = frustumSize * aspect / 2;
        this.camera.top = frustumSize / 2;
        this.camera.bottom = -frustumSize / 2;
        
        this.camera.updateProjectionMatrix();
    }

    getRaycaster(mouseX, mouseY) {
        // 将鼠标坐标转换为归一化设备坐标
        const rect = this.canvas.getBoundingClientRect();
        this.mouseVector.x = ((mouseX - rect.left) / rect.width) * 2 - 1;
        this.mouseVector.y = -((mouseY - rect.top) / rect.height) * 2 + 1;
        
        this.raycaster.setFromCamera(this.mouseVector, this.camera);
        return this.raycaster;
    }

    getCamera() {
        return this.camera;
    }

    getPosition() {
        return this.position.clone();
    }

    // 事件处理方法
    handleKeyDown(event) {
        this.keys[event.key] = true;
    }

    handleKeyUp(event) {
        this.keys[event.key] = false;
    }

    handleMouseDown(event) {
        if (event.button === 2) { // 右键
            this.mouse.isDragging = true;
            this.mouse.dragStartX = event.clientX;
            this.mouse.dragStartY = event.clientY;
        }
        this.mouse.isDown = true;
    }

    handleMouseUp(event) {
        if (event.button === 2) {
            this.mouse.isDragging = false;
        }
        this.mouse.isDown = false;
    }

    handleMouseMove(event) {
        this.mouse.x = event.clientX;
        this.mouse.y = event.clientY;
    }

    handleWheel(event) {
        const zoomAmount = event.deltaY * 0.1;
        this.zoom(zoomAmount);
    }

    handleContextMenu(event) {
        this.mouse.isDragging = false;
    }
}

export default Camera;