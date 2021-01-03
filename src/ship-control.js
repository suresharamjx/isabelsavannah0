import {EntityControl} from './entity-control.js'

class ShipControl extends EntityControl{
    constructor(physTree, designMeta, sim){
        super(sim);
        this.physTree = physTree;
        this.designMeta = designMeta;
        this.physics = sim.physics;
    }

    spawn(){
        this.partRefs = this.spawnBlocksAt(0, 0, 0, this.physTree).flat(Infinity);
        this.shipRef = this.physics.join(this.partRefs);
        this.physics.add(this.shipRef);
    }

	spawnBlocksAt(turtleX, turtleY, turtleTheta, physTree){
		let newTheta = turtleTheta + physTree.rotation;
		let newX = turtleX + Math.sin(newTheta)*physTree.translation;
		let newY = turtleY + Math.cos(newTheta)*physTree.translation;

		let partRef = this.physics.drawPart(newX, newY, newTheta, physTree.block);
		let childPartRefs = physTree.children.map(branch => this.spawnBlocksAt(newX, newY, newTheta, branch));

        return [partRef, childPartRefs];
	}

    tick(){

    }
}

export {ShipControl}
