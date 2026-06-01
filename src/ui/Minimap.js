import * as THREE from 'three';
import { CELL_SIZE, getPlayerColor } from '../config.js';

class Minimap {
  constructor(game) {
    this.game = game;
    this.canvas = document.getElementById('minimap-canvas');
    this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
    this.isDragging = false;
    this.hasMoved = false;
    this.lastX = 0;
    this.lastY = 0;
    this.startX = 0;
    this.startY = 0;
  }

  init() {
    if (!this.canvas) return;
    
    this.canvas.width = 200;
    this.canvas.height = 200;
    this.setupDragHandler();
  }

  render() {
    if (!this.ctx || !this.game.map) return;

    const canvas = this.canvas;
    const ctx = this.ctx;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.setTransform(0.5, 0.375, -0.5, 0.375, 100, 100);

    const mapSize = this.game.map.getSize();
    const minX = -mapSize.width / 2;
    const maxX = mapSize.width / 2;
    const minZ = -mapSize.height / 2;
    const maxZ = mapSize.height / 2;

    const mapType = this.game.selectedMapType || 'default';
    ctx.fillStyle = mapType === 'arabia' ? '#F5DEB3' : '#4a9c50';
    ctx.fillRect(minX, minZ, mapSize.width, mapSize.height);

    ctx.strokeStyle = 'rgba(0, 0, 0, 0.15)';
    ctx.lineWidth = 2;
    const gridSize = 10;
    const step = mapSize.width / gridSize;
    ctx.beginPath();
    for (let i = 0; i <= gridSize; i++) {
      const pos = minX + i * step;
      ctx.moveTo(minX, pos);
      ctx.lineTo(maxX, pos);
      ctx.moveTo(pos, minZ);
      ctx.lineTo(pos, maxZ);
    }
    ctx.stroke();

    for (const entity of this.game.entities) {
      if (!entity.isAlive) continue;
      if (!this.shouldDrawEntity(entity)) continue;
      
      if (entity.type === 'unit') {
        ctx.fillStyle = getPlayerColor(entity.owner);
        ctx.beginPath();
        ctx.arc(entity.position.x, entity.position.z, 2, 0, Math.PI * 2);
        ctx.fill();
      } else if (entity.type === 'building') {
        ctx.fillStyle = getPlayerColor(entity.owner);
        ctx.fillRect(entity.position.x - 3, entity.position.z - 3, 6, 6);
      } else if (entity.type === 'resource') {
        const resourceColors = {
          wood: '#228B22',
          stone: '#C0C0C0',
          gold: '#FFD700',
          food: '#90EE90'
        };
        ctx.fillStyle = resourceColors[entity.resourceType] || '#FFFFFF';
        ctx.fillRect(entity.position.x - 2, entity.position.z - 2, 4, 4);
      }
    }

    this.drawFogOverlay(ctx, mapSize);
    this.drawCameraViewport(ctx);

    ctx.setTransform(1, 0, 0, 1, 0, 0);
  }

  shouldDrawEntity(entity) {
    const fog = this.game.fogOfWarSystem;
    if (!fog) return true;

    if (entity.isPlayerOwned?.()) return true;

    if (entity.type === 'building') {
      return fog.isPositionVisible(entity.position) || fog.isPositionExplored(entity.position);
    }

    if (entity.type === 'resource') {
      if (entity.isSheep) {
        return entity.isPlayerOwned?.() || fog.isPositionVisible(entity.position);
      }
      return fog.isPositionVisible(entity.position) ||
        (fog.isPositionExplored(entity.position) && entity.fogKnownResourceState && !entity.fogKnownResourceState.isDepleted);
    }

    return fog.isPositionVisible(entity.position);
  }

  drawFogOverlay(ctx, mapSize) {
    const fog = this.game.fogOfWarSystem;
    if (!fog?.canvas) return;

    const minX = -mapSize.width / 2;
    const minZ = -mapSize.height / 2;

    ctx.drawImage(
      fog.canvas,
      minX,
      minZ,
      mapSize.width,
      mapSize.height
    );
  }

  drawCameraViewport(ctx) {
    if (!this.game.camera) return;

    const cameraTarget = this.game.camera.target;
    const camera = this.game.camera.getCamera();

    const halfW = (camera.right - camera.left) / 2;
    const halfH = (camera.top - camera.bottom) / 2;

    const cx = cameraTarget.x;
    const cz = cameraTarget.z;
    const centerCanvasX = 0.5 * cx - 0.5 * cz + 100;
    const centerCanvasY = 0.375 * cx + 0.375 * cz + 100;

    const canvasHalfW = 0.5 * halfW + 0.5 * halfH;
    const canvasHalfH = 0.375 * halfW + 0.375 * halfH;

    ctx.setTransform(1, 0, 0, 1, 0, 0);

    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;
    ctx.strokeRect(
      centerCanvasX - canvasHalfW,
      centerCanvasY - canvasHalfH,
      canvasHalfW * 2,
      canvasHalfH * 2
    );
  }

  setupDragHandler() {
    if (!this.canvas) return;

    this.canvas.addEventListener('mousedown', (e) => {
      if (e.button === 2) {
        this.handleRightClick(e);
        e.preventDefault();
        e.stopPropagation();
        return;
      }

      this.isDragging = true;
      this.hasMoved = false;
      this.startX = e.clientX;
      this.startY = e.clientY;
      this.lastX = e.clientX;
      this.lastY = e.clientY;
      this.canvas.style.cursor = 'grabbing';
      e.preventDefault();
    });

    window.addEventListener('mousemove', (e) => {
      if (!this.isDragging) return;

      const dx = e.clientX - this.lastX;
      const dy = e.clientY - this.lastY;

      if (Math.abs(e.clientX - this.startX) > 2 || Math.abs(e.clientY - this.startY) > 2) {
        this.hasMoved = true;
      }

      if (this.game.camera && this.hasMoved) {
        const mapSize = this.game.map.getSize();
        const minX = -mapSize.width / 2;
        const maxX = mapSize.width / 2;
        const minZ = -mapSize.height / 2;
        const maxZ = mapSize.height / 2;

        const normDx = dx / this.canvas.width;
        const normDy = dy / this.canvas.height;

        const worldDx = (normDx + normDy) * 0.5 * (maxX - minX);
        const worldDz = (normDy - normDx) * 0.5 * (maxZ - minZ);

        this.game.camera.target.x += worldDx;
        this.game.camera.target.z += worldDz;
        this.game.camera.target.y = 0;
        this.game.camera.updateCameraPosition();
      }

      this.lastX = e.clientX;
      this.lastY = e.clientY;
    });

    window.addEventListener('mouseup', (e) => {
      if (this.isDragging) {
        this.isDragging = false;
        if (this.canvas) {
          this.canvas.style.cursor = 'pointer';
        }

        if (!this.hasMoved && this.canvas) {
          const rect = this.canvas.getBoundingClientRect();
          const clickX = e.clientX - rect.left;
          const clickY = e.clientY - rect.top;

          if (clickX >= 0 && clickX <= rect.width && clickY >= 0 && clickY <= rect.height) {
            this.handleClick({ clientX: e.clientX, clientY: e.clientY });
          }
        }
      }
    });

    this.canvas.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      e.stopPropagation();
    });

    this.canvas.addEventListener('mouseleave', () => {
      if (this.isDragging) {
        this.isDragging = false;
        this.hasMoved = false;
        if (this.canvas) {
          this.canvas.style.cursor = 'pointer';
        }
      }
    });
  }

  handleClick(event) {
    if (!this.game.map || !this.game.camera) return;

    const worldPos = this.getWorldPositionFromEvent(event);
    if (!worldPos) return;

    this.game.camera.target.x = worldPos.x;
    this.game.camera.target.z = worldPos.z;
    this.game.camera.target.y = 0;
    this.game.camera.updateCameraPosition();
  }

  handleRightClick(event) {
    if (!this.game.map || !this.game.selectionManager) return;
    if (!this.game.selectionManager.hasSelection()) return;

    const worldPos = this.getWorldPositionFromEvent(event);
    if (!worldPos) return;

    if (this.game.trySetSelectedBuildingRallyPoint?.(worldPos)) {
      return;
    }

    this.game.selectionManager.issueMoveCommand(
      new THREE.Vector3(worldPos.x, 0, worldPos.z)
    );
  }

  getWorldPositionFromEvent(event) {
    if (!this.canvas || !this.game.map) return null;

    const mapSize = this.game.map.getSize();
    const minX = -mapSize.width / 2;
    const maxX = mapSize.width / 2;
    const minZ = -mapSize.height / 2;
    const maxZ = mapSize.height / 2;

    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;
    const clickX = (event.clientX - rect.left) * scaleX;
    const clickY = (event.clientY - rect.top) * scaleY;
    const { x, z } = this.canvasToWorld(clickX, clickY);

    return {
      x: Math.max(minX, Math.min(maxX, x)),
      z: Math.max(minZ, Math.min(maxZ, z))
    };
  }

  canvasToWorld(canvasX, canvasY) {
    const dx = canvasX - 100;
    const dy = canvasY - 100;

    return {
      x: dx + dy / 0.75,
      z: dy / 0.75 - dx
    };
  }
}

export default Minimap;
