class UnitAnimation {
    constructor(unit) {
        this.unit = unit;
    }

    setAnimationState(state) {
        if (this.unit.animationState !== state) {
            this.unit.animationState = state;
            this.unit.animationProgress = 0;
        }
    }
    
    updateAnimation(deltaTime) {
        if (!this.unit.mesh) return;
        
        this.unit.animationProgress += deltaTime * this.unit.animationSpeed;
        
        switch (this.unit.animationState) {
            case 'idle':
                this.animateIdle(deltaTime);
                break;
            case 'walking':
                this.animateWalking(deltaTime);
                break;
            case 'attacking':
                this.animateAttacking(deltaTime);
                break;
            case 'gathering':
                this.animateGathering(deltaTime);
                break;
            case 'dying':
                this.animateDying(deltaTime);
                break;
        }
    }
    
    animateIdle(deltaTime) {
        const breathOffset = Math.sin(this.unit.animationProgress) * 0.02;
        
        const body = this.unit.mesh.getObjectByName('body');
        if (body) {
            body.position.y = this.unit.appearanceConfig.bodyHeight / 2 + breathOffset;
        }
        
        const head = this.unit.mesh.getObjectByName('head');
        if (head) {
            head.position.y = this.unit.appearanceConfig.bodyHeight + this.unit.appearanceConfig.headSize * 0.8 + breathOffset;
        }
    }
    
    animateWalking(deltaTime) {
        const legSwing = Math.sin(this.unit.animationProgress * 2) * 0.3;
        
        const leftLeg = this.unit.mesh.getObjectByName('leftLeg');
        const rightLeg = this.unit.mesh.getObjectByName('rightLeg');
        
        if (leftLeg) {
            leftLeg.rotation.x = legSwing;
        }
        if (rightLeg) {
            rightLeg.rotation.x = -legSwing;
        }
        
        const bodyBounce = Math.abs(Math.sin(this.unit.animationProgress * 2)) * 0.05;
        const body = this.unit.mesh.getObjectByName('body');
        if (body) {
            body.position.y = this.unit.appearanceConfig.bodyHeight / 2 + bodyBounce;
        }
    }
    
    animateAttacking(deltaTime) {
        const attackPhase = this.unit.animationProgress % 2;
        
        const weapon = this.unit.mesh.getObjectByName('weapon');
        const tool = this.unit.mesh.getObjectByName('tool');
        
        if (weapon) {
            if (attackPhase < 1) {
                weapon.rotation.x = Math.PI / 4 * Math.sin(attackPhase * Math.PI);
            } else {
                weapon.rotation.x = -Math.PI / 4 * Math.sin((attackPhase - 1) * Math.PI);
            }
        }
        
        if (tool) {
            if (attackPhase < 1) {
                tool.rotation.z = Math.PI / 6 * Math.sin(attackPhase * Math.PI);
            } else {
                tool.rotation.z = -Math.PI / 6 * Math.sin((attackPhase - 1) * Math.PI);
            }
        }
        
        const body = this.unit.mesh.getObjectByName('body');
        if (body) {
            body.rotation.x = Math.sin(attackPhase * Math.PI) * 0.1;
        }
    }
    
    animateGathering(deltaTime) {
        const gatherPhase = this.unit.animationProgress % 2;
        
        const body = this.unit.mesh.getObjectByName('body');
        const head = this.unit.mesh.getObjectByName('head');
        
        if (body) {
            body.rotation.x = Math.sin(gatherPhase * Math.PI) * 0.2;
        }
        
        if (head) {
            head.rotation.x = Math.sin(gatherPhase * Math.PI) * 0.15;
        }
        
        const tool = this.unit.mesh.getObjectByName('tool');
        if (tool) {
            tool.position.y = this.unit.appearanceConfig.bodyHeight * 0.6 + Math.sin(gatherPhase * Math.PI) * 0.3;
        }
    }
    
    animateDying(deltaTime) {
        const progress = Math.min((this.unit._deathTimer || 0) / (this.unit._deathDuration || 1.5), 1);
        
        if (this.unit.mesh) {
            this.unit.mesh.rotation.x = progress * Math.PI / 2;
            this.unit.mesh.position.y = (this.unit._deathStartY || 0) - progress * 0.5;
            
            this.unit.mesh.traverse(child => {
                if (child.material && child.material.transparent !== undefined) {
                    child.material.transparent = true;
                    child.material.opacity = 1 - progress;
                }
            });
        }
    }
}

export default UnitAnimation;
