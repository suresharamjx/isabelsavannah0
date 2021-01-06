class EntityControl{
    constructor(sim, type){
        this.sim = sim;
        this.collisionControllerPriority = 0;
        this.type = type;
        this.destroyCallbacks = [];
        this.exists = true;
    }

    tick(){}

    spawn(){}

    destroy(){
        this.exists = false;
        this.destroyCallbacks.map(x => x());
    }

    onDestroy(callback){
        this.destroyCallbacks.push(callback);
    }
}

export {EntityControl}
