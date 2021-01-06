import {EntityControl} from './entity-control.js'
import {randChoice} from './rand.js'
import {navigate, modCircle, modCircleDelta} from './geometry.js'

class ShipControl extends EntityControl{
    constructor(physTree, designMeta, sim){
        super(sim, 'ship');
        this.physTree = physTree;
        this.designMeta = designMeta;
        this.physics = sim.physics;
        this.collisionControllerPriority = 2;
        this.targetLocation = null;

        this.physMap = {};
        this.partRefMap = {};
        this.angleOffsets = {};

        this.tickCount = 0;
    }

    spawn(){
        this.partRefs = this.spawnBlocksAt(0, 0, 0, this.physTree).flat(Infinity);
        this.shipRef = this.physics.join(this.partRefs, this);
        this.mapThrusters();
        this.physics.add(this.shipRef);
    }

	spawnBlocksAt(turtleX, turtleY, turtleTheta, physTree){
		let newTheta = turtleTheta + physTree.rotation;
		let newX = turtleX + Math.sin(newTheta)*physTree.translation;
		let newY = turtleY + Math.cos(newTheta)*physTree.translation;

        let block = physTree.block;
		let partRef = this.physics.drawPart(newX, newY, newTheta, block, this);
        let id = this.physics.getId(partRef);
        this.physMap[id] = block;
        this.partRefMap[id] = partRef;
        this.angleOffsets[id] = newTheta;

		let childPartRefs = physTree.children.map(branch => this.spawnBlocksAt(newX, newY, newTheta, branch));

        return [partRef, childPartRefs];
	}

    handleCollisionWith(other, pair){
        if(other.type === 'food'){
            other.destroy();
        }
    }

    pickMovementTarget(){
        if(this.sim.liveFoods.length > 0){
            let targetFood = randChoice(this.sim.liveFoods);
            this.targetLocation = targetFood.getLocation();
            targetFood.onDestroy(() => this.targetLocation = null);
            console.log("Picked target location ", this.targetLocation);
        }
    }

    mapThrusters(){
        this.forwardThrusters = [];
        this.reverseThrusters = [];
        this.rightThrusters = [];
        this.leftThrusters = [];

        for(let id in this.physMap){
            if(this.physMap[id].payload.type != "thruster"){
                continue;
            }

            let partRef = this.partRefMap[id];
            let partPositionAngle = navigate(this.physics.getLocation(this.shipRef), this.physics.getLocation(partRef));
            let partAngle = this.angleOffsets[id];

            let angleDelta = modCircleDelta(partAngle - partPositionAngle);
            let angleDeltaAbs = Math.abs(angleDelta);
            let partAngleAbs = Math.abs(modCircleDelta(partAngle));
            if(angleDeltaAbs < Math.PI/3 || angleDeltaAbs > (2*Math.PI/3)){
                if(partAngleAbs <= Math.PI/2){
                    this.reverseThrusters.push(id);
                }else{
                    this.forwardThrusters.push(id);
                }
            }else{
                if(angleDelta >= 0){
                    this.rightThrusters.push(id);
                }else{
                    this.leftThrusters.push(id);
                }
            }
        }
        console.log("left", this.leftThrusters);
        console.log("right", this.rightThrusters);
        console.log("forward", this.forwardThrusters);
        console.log("reverse", this.reverseThrusters);

    }

    tick(){
        this.tickCount++;

        if(!this.targetLocation){
            this.pickMovementTarget();
        }

        if(this.targetLocation){
            let targetTheta = navigate(this.physics.getLocation(this.shipRef), this.targetLocation);
            let currentTheta = this.physics.getTheta(this.shipRef);
            let turn = modCircleDelta(targetTheta - currentTheta);
            if(Math.abs(turn) < Math.PI/8){
                this.powerThrusters(this.reverseThrusters, 1);
            }else if(Math.abs(turn) > Math.PI*7/8){
                this.powerThrusters(this.forwardThrusters, 20);
            }
            if(turn > 0){
                this.powerThrusters(this.rightThrusters, 0.03);
            }else{
                this.powerThrusters(this.leftThrusters, 0.03);
            }
        }
    }

    powerThrusters(thrusterIds, power){
        for(let id of thrusterIds){
            let partRef = this.partRefMap[id];
            let thrusterLoc = this.physics.getLocation(partRef);
            let shipAngle = this.physics.getTheta(this.shipRef);
            this.physics.generateForce(this.shipRef, thrusterLoc, power, modCircle(shipAngle - this.angleOffsets[id] + Math.PI));
        }
    }
}

export {ShipControl}
