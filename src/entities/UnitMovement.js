import * as THREE from 'three';
import { CELL_SIZE, MAP_CONFIG } from '../config.js';

class UnitMovement {
    constructor(unit) {
        this.unit = unit;
    }

    moveTo(targetPosition, options = {}) {
        console.log(`[Unit.moveTo] 被调用! targetPosition: (${targetPosition.x}, ${targetPosition.y}, ${targetPosition.z})`);
        if (!options.preserveBuilding) {
            this.unit.clearBuildingState();
        }
        
        const mapWidth = this.unit.pathfindingSystem ? this.unit.pathfindingSystem.grid.width * this.unit.pathfindingSystem.grid.cellSize : MAP_CONFIG.width * MAP_CONFIG.cellSize;
        const mapHeight = this.unit.pathfindingSystem ? this.unit.pathfindingSystem.grid.height * this.unit.pathfindingSystem.grid.cellSize : MAP_CONFIG.height * MAP_CONFIG.cellSize;
        const cellSize = this.unit.pathfindingSystem ? this.unit.pathfindingSystem.grid.cellSize : CELL_SIZE;

        const minX = -mapWidth / 2 + cellSize;
        const maxX = mapWidth / 2 - cellSize;
        const minZ = -mapHeight / 2 + cellSize;
        const maxZ = mapHeight / 2 - cellSize;
        
        targetPosition.x = Math.max(minX, Math.min(maxX, targetPosition.x));
        targetPosition.z = Math.max(minZ, Math.min(maxZ, targetPosition.z));
        
        this.unit.targetPosition = targetPosition.clone();
        this.unit.isMoving = true;
        this.unit.currentAction = 'moving';
        this.unit.isAttacking = false;
        this.unit.targetEntity = null;
        
        if (this.unit.pathfindingSystem) {
            console.log(`[Unit] 开始寻路: 起点 (${this.unit.position.x.toFixed(1)}, ${this.unit.position.z.toFixed(1)}) → 终点 (${targetPosition.x.toFixed(1)}, ${targetPosition.z.toFixed(1)})`);
            const result = this.unit.pathfindingSystem.findPath(
                this.unit.position.x,
                this.unit.position.z,
                targetPosition.x,
                targetPosition.z
            );
            
            if (result.success) {
                console.log(`[Unit] 找到路径! 原始路径长度: ${result.path.length} 个点`);
                result.path.forEach((cell, i) => console.log(`[Unit] 原始点 ${i}: (${cell.x}, ${cell.y})`));
                
                this.unit.path = this.unit.pathfindingSystem.smoothPath(result.path);
                this.unit.currentPathIndex = 0;
                console.log(`[Unit] 平滑后路径长度: ${this.unit.path.length} 个点`);
                
                if (this.unit.game && this.unit.game.scene && this.unit.pathfindingSystem && this.unit.pathfindingSystem.grid) {
                    this.unit.game.scene.visualizePath(this.unit.id, this.unit.path, this.unit.pathfindingSystem.grid);
                }
            } else {
                this.unit.path = [];
                console.log('[Unit] 未找到路径，将直线移动');
                
                if (this.unit.game && this.unit.game.scene) {
                    this.unit.game.scene.clearPathVisualizer(this.unit.id);
                }
            }
        }
    }

    updateMovement(deltaTime) {
        if (!this.unit.isMoving) {
            if (!this.unit.isBuilding) {
                this.unit.setAnimationState('idle');
            }
            return;
        }
        
        this.unit.setAnimationState('walking');
        
        let targetPos = this.unit.targetPosition;
        
        if (this.unit.path.length > 0 && this.unit.currentPathIndex < this.unit.path.length) {
            const currentCell = this.unit.path[this.unit.currentPathIndex];
            const gs = this.unit.pathfindingSystem.grid;
            const cellSize = gs.cellSize;
            const halfW = gs.width * cellSize / 2;
            const halfH = gs.height * cellSize / 2;
            targetPos = new THREE.Vector3(
                currentCell.x * cellSize + cellSize / 2 - halfW,
                0,
                currentCell.y * cellSize + cellSize / 2 - halfH
            );
            console.log(`[Unit] 正在跟随路径: 点 ${this.unit.currentPathIndex}/${this.unit.path.length} → (${targetPos.x.toFixed(1)}, ${targetPos.z.toFixed(1)})`);
            
            const dx = this.unit.position.x - targetPos.x;
            const dz = this.unit.position.z - targetPos.z;
            const distance = Math.sqrt(dx * dx + dz * dz);
            
            if (distance < 0.5) {
                this.unit.currentPathIndex++;
                console.log(`[Unit] 到达路径点 ${this.unit.currentPathIndex - 1}，下一个是 ${this.unit.currentPathIndex}`);
                if (this.unit.currentPathIndex >= this.unit.path.length) {
                    console.log(`[村民移动] 到达目标位置 - isReturning: ${this.unit.isReturning}, carryAmount: ${this.unit.carryAmount}`);

                    if (this.unit.isReturning && this.unit.dropOffPoint) {
                        const dx = this.unit.position.x - this.unit.dropOffPoint.position.x;
                        const dz = this.unit.position.z - this.unit.dropOffPoint.position.z;
                        const distanceToTownCenter = Math.sqrt(dx * dx + dz * dz);
                        const townCenterArrivalDistance = 3;
                        
                        console.log(`[村民移动] 距离城镇中心: ${distanceToTownCenter.toFixed(1)}, 判定距离: ${townCenterArrivalDistance}`);
                        
                        if (distanceToTownCenter <= townCenterArrivalDistance) {
                            console.log('[村民移动] 已到达城镇中心，开始交付资源');
                            this.unit.deliverResources();
                        }
                    }

                    this.unit.isMoving = false;
                    this.unit.path = [];
                    this.unit.currentAction = 'idle';
                    if (!this.unit.isBuilding) {
                        this.unit.setAnimationState('idle');
                    }
                    
                    if (this.unit.game && this.unit.game.scene) {
                        this.unit.game.scene.clearPathVisualizer(this.unit.id);
                    }
                    return;
                }
                
                const nextCell = this.unit.path[this.unit.currentPathIndex];
                const gs = this.unit.pathfindingSystem.grid;
                const cellSize = gs.cellSize;
                const halfW = gs.width * cellSize / 2;
                const halfH = gs.height * cellSize / 2;
                targetPos = new THREE.Vector3(
                    nextCell.x * cellSize + cellSize / 2 - halfW,
                    0,
                    nextCell.y * cellSize + cellSize / 2 - halfH
                );
                console.log(`[Unit] 更新目标位置到路径点 ${this.unit.currentPathIndex}: (${targetPos.x.toFixed(1)}, ${targetPos.z.toFixed(1)})`);
            }
        } else {
            console.log(`[Unit] 没有可用路径，直接走直线到 (${targetPos.x.toFixed(1)}, ${targetPos.z.toFixed(1)})`);
        }
        
        if (targetPos) {
            const direction = new THREE.Vector3()
                .subVectors(targetPos, this.unit.position);
            
            const distance = Math.sqrt(direction.x * direction.x + direction.z * direction.z);
            
            if (distance > 0.1) {
                direction.normalize();
                const moveDistance = this.unit.movementSpeed * deltaTime;
                
                let newPosition;
                if (distance <= moveDistance) {
                    newPosition = targetPos.clone();

                    if (this.unit.path.length === 0 || this.unit.currentPathIndex >= this.unit.path.length) {
                        this.unit.isMoving = false;
                        this.unit.targetPosition = null;

                        if (this.unit.isReturning && this.unit.dropOffPoint) {
                            const dx = this.unit.position.x - this.unit.dropOffPoint.position.x;
                            const dz = this.unit.position.z - this.unit.dropOffPoint.position.z;
                            const distanceToTownCenter = Math.sqrt(dx * dx + dz * dz);
                            const townCenterArrivalDistance = 3;
                            
                            console.log(`[村民移动-无路径] 距离城镇中心: ${distanceToTownCenter.toFixed(1)}, 判定距离: ${townCenterArrivalDistance}`);
                            
                            if (distanceToTownCenter <= townCenterArrivalDistance) {
                                console.log('[村民移动-无路径] 已到达城镇中心，开始交付资源');
                                this.unit.deliverResources();
                            }
                        }

                        if (!this.unit.currentResource) {
                            this.unit.currentAction = 'idle';
                            this.unit.setAnimationState('idle');
                        }
                    }
                } else {
                    newPosition = this.unit.position.clone().add(direction.multiplyScalar(moveDistance));
                }
                
                const mapWidth = this.unit.pathfindingSystem ? this.unit.pathfindingSystem.grid.width * this.unit.pathfindingSystem.grid.cellSize : MAP_CONFIG.width * MAP_CONFIG.cellSize;
                const mapHeight = this.unit.pathfindingSystem ? this.unit.pathfindingSystem.grid.height * this.unit.pathfindingSystem.grid.cellSize : MAP_CONFIG.height * MAP_CONFIG.cellSize;
                const cellSize = this.unit.pathfindingSystem ? this.unit.pathfindingSystem.grid.cellSize : CELL_SIZE;
                const minX = -mapWidth / 2 + cellSize;
                const maxX = mapWidth / 2 - cellSize;
                const minZ = -mapHeight / 2 + cellSize;
                const maxZ = mapHeight / 2 - cellSize;
                
                newPosition.x = Math.max(minX, Math.min(maxX, newPosition.x));
                newPosition.z = Math.max(minZ, Math.min(maxZ, newPosition.z));
                
                const terrainHeight = this.unit.getTerrainHeightAt(newPosition.x, newPosition.z);
                newPosition.y = terrainHeight;
                
                this.unit.position.copy(newPosition);
                this.unit.mesh.position.copy(this.unit.position);
                
                const targetRotation = Math.atan2(direction.x, direction.z);
                this.unit.mesh.rotation.y = targetRotation;
            } else {
                this.unit.isMoving = false;
                this.unit.targetPosition = null;
                this.unit.path = [];
                this.unit.currentAction = 'idle';
                this.unit.setAnimationState('idle');
            }
        }
    }

    getTerrainHeightAt(worldX, worldZ) {
        if (!this.unit.game || !this.unit.game.map) return 0;
        
        const map = this.unit.game.map;
        const grid = map.grid;
        if (!grid) return 0;
        
        const size = grid.getSize();
        const mapWidth = size.width * size.cellSize;
        const mapHeight = size.height * size.cellSize;
        
        const gridX = Math.floor((worldX + mapWidth / 2) / size.cellSize);
        const gridY = Math.floor((worldZ + mapHeight / 2) / size.cellSize);
        
        if (gridX < 0 || gridX >= size.width || gridY < 0 || gridY >= size.height) return 0;
        
        const cell = grid.getCell(gridX, gridY);
        return cell ? (cell.height || 0) : 0;
    }
}

export default UnitMovement;
