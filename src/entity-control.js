class EntityControl{
    constructor(sim, type){
        this.sim = sim;
        this.collisionControllerPriority = 0;
        this.type = type;
    }

    tick(){}

    spawn(){}
}

export {EntityControl}
