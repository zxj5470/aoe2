import * as THREE from 'three';

class InputHandler {
    constructor(camera, canvas, map, dragCallback = null) {
        this.camera = camera;
        this.canvas = canvas;
        this.map = map;
        this.dragCallback = dragCallback; // 拖拽回调函数
        
        this.keys = {};
        this.mouse = {
            x: 0,
            y: 0,
            worldX: 0,
            worldZ: 0,
            isDown: false,
            button: 0
        };
        
        this.dragStart = null;
        this.isDragging = false;
        this.dragEnd = null;
        
        this.raycaster = new THREE.Raycaster();
        this.mouseVector = new THREE.Vector2();
        
        this.setupEventListeners();
    }

    setupEventListeners() {
        // 键盘事件
        window.addEventListener('keydown', (e) => this.onKeyDown(e));
        window.addEventListener('keyup', (e) => this.onKeyUp(e));
        
        // 鼠标事件
        this.canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
        this.canvas.addEventListener('mouseup', (e) => this.onMouseUp(e));
        this.canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
        this.canvas.addEventListener('wheel', (e) => this.onWheel(e));
        this.canvas.addEventListener('contextmenu', (e) => this.onContextMenu(e));
        
        // 触摸事件（移动设备支持）
        this.canvas.addEventListener('touchstart', (e) => this.onTouchStart(e));
        this.canvas.addEventListener('touchend', (e) => this.onTouchEnd(e));
        this.canvas.addEventListener('touchmove', (e) => this.onTouchMove(e));
    }

    onKeyDown(event) {
        this.keys[event.key] = true;
        this.keys[event.code] = true;
    }

    onKeyUp(event) {
        this.keys[event.key] = false;
        this.keys[event.code] = false;
    }

    onMouseDown(event) {
        this.mouse.x = event.clientX;
        this.mouse.y = event.clientY;
        this.mouse.isDown = true;
        this.mouse.button = event.button;
        
        // 更新世界坐标
        this.updateWorldPosition();
        
        // 开始拖拽选择
        if (event.button === 0) { // 左键
            this.dragStart = {
                x: event.clientX,
                y: event.clientY
            };
        }
    }

    onMouseUp(event) {
        this.mouse.isDown = false;
        
        if (this.dragStart) {
            this.dragEnd = {
                x: event.clientX,
                y: event.clientY
            };
            
            // 计算拖拽距离
            const dragDistance = Math.sqrt(
                Math.pow(this.dragEnd.x - this.dragStart.x, 2) +
                Math.pow(this.dragEnd.y - this.dragStart.y, 2)
            );
            
            if (dragDistance > 5) {
                this.isDragging = true;
            }
        }
    }

    onMouseMove(event) {
        this.mouse.x = event.clientX;
        this.mouse.y = event.clientY;
        this.updateWorldPosition();
        
        // 如果正在拖拽，实时更新拖拽框的可视化
        if (this.dragStart && this.mouse.isDown && this.mouse.button === 0) {
            const dragDistance = Math.sqrt(
                Math.pow(event.clientX - this.dragStart.x, 2) +
                Math.pow(event.clientY - this.dragStart.y, 2)
            );
            
            if (dragDistance > 5) {
                this.isDragging = true;
                // 调用回调函数更新拖拽框的可视化
                if (this.dragCallback) {
                    this.dragCallback(this.dragStart.x, this.dragStart.y, event.clientX, event.clientY);
                }
            }
        }
    }

    onWheel(event) {
        event.preventDefault();
        const zoomAmount = event.deltaY * 0.1;
        this.camera.zoom(zoomAmount);
    }

    onContextMenu(event) {
        event.preventDefault();
    }

    onTouchStart(event) {
        if (event.touches.length === 1) {
            const touch = event.touches[0];
            this.mouse.x = touch.clientX;
            this.mouse.y = touch.clientY;
            this.mouse.isDown = true;
            this.updateWorldPosition();
        }
    }

    onTouchEnd(event) {
        this.mouse.isDown = false;
    }

    onTouchMove(event) {
        if (event.touches.length === 1) {
            const touch = event.touches[0];
            this.mouse.x = touch.clientX;
            this.mouse.y = touch.clientY;
            this.updateWorldPosition();
        }
    }

    updateWorldPosition(clientX = this.mouse.x, clientY = this.mouse.y) {
        const rect = this.canvas.getBoundingClientRect();
        
        // 使用传入的或缓存的鼠标坐标
        this.mouseVector.x = ((clientX - rect.left) / rect.width) * 2 - 1;
        this.mouseVector.y = -((clientY - rect.top) / rect.height) * 2 + 1;
        
        this.raycaster.setFromCamera(this.mouseVector, this.camera.getCamera());
        
        // 创建一个水平面来检测交点
        const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
        const intersection = new THREE.Vector3();
        
        this.raycaster.ray.intersectPlane(plane, intersection);
        
        if (intersection) {
            this.mouse.worldX = intersection.x;
            this.mouse.worldZ = intersection.z;
        }
    }

    getMousePosition() {
        return {
            x: this.mouse.x,
            y: this.mouse.y
        };
    }

    getWorldPosition() {
        return {
            x: this.mouse.worldX,
            z: this.mouse.worldZ
        };
    }

    getRaycaster() {
        return this.raycaster;
    }

    isKeyPressed(key) {
        return this.keys[key] === true;
    }

    isKeyDown(key) {
        return this.keys[key] === true;
    }

    isKeyUp(key) {
        return this.keys[key] === false;
    }

    getDragSelection() {
        if (!this.dragStart || !this.dragEnd || !this.isDragging) {
            return null;
        }
        
        return {
            start: this.dragStart,
            end: this.dragEnd,
            width: Math.abs(this.dragEnd.x - this.dragStart.x),
            height: Math.abs(this.dragEnd.y - this.dragStart.y)
        };
    }

    clearDragSelection() {
        this.dragStart = null;
        this.dragEnd = null;
        this.isDragging = false;
    }

    reset() {
        this.keys = {};
        this.mouse.isDown = false;
        this.clearDragSelection();
    }
}

export default InputHandler;