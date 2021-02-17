import {EntityControl} from './entity-control.js'
import {PhysBlock, PhysPayload} from './phys-tree.js'

class BulletControl extends EntityControl{
    constructor(sim, damage){
        super(sim, 'bullet');
        this.physics = sim.physics;
        this.collisionControllerPriority = 1;
        this.settings = this.sim.settings

        this.damage = damage;
    }

    spawn(x, y, theta){
        this.fuse = this.settings.fuseDuration;

        let block = new PhysBlock(this.settings.bullet.sides, this.settings.bullet.radius, 0, new PhysPayload('bullet'));
        this.blockRef = this.physics.drawPart(x, y, 0, block, this, {fillStyle: "#ff0000", sensor: true});

        let vel = {x: Math.sin(theta)*this.settings.bullet.velocity, y: Math.cos(theta)*this.settings.bullet.velocity};

        this.physics.disableCollision(this.blockRef);
        this.physics.setOmega(this.blockRef, this.settings.bullet.omega);
        this.physics.setLocationPair(this.blockRef, {x: x, y: y});
        this.physics.setVelocity(this.blockRef, vel);

        this.physics.add(this.blockRef);

        this.sim.scheduleCallback(this.settings.bullet.fuseDuration, () => {
            if(this.exists){
                this.physics.enableCollision(this.blockRef);
            }
        });

        this.sim.scheduleCallback(this.settings.bullet.timeout, () => {
            if(this.exists){
                this.destroy();
            }
        });
    }

    handleCollisionBeforeWith(other, pair){
        if(other.type === 'food'){
            other.destroy();
        }
    }

    destroy(){
        this.physics.remove(this.blockRef);
        super.destroy();
    }
}

export {BulletControl}
