class ShipControl {

    constructor(physTree, designMeta, physics){
        this.physTree = physTree;
        this.designMeta = designMeta;
        this.physics = physics;
    }

    spawn(){
        this.physics.add(this.physTree);
    }
}

export {ShipControl}
