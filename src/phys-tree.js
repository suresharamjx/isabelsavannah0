class PhysPayload{
    constructor(type){
        this.type = type;
    }
}

class PhysBlock{
    constructor(sides, radius, mass, payload){
        this.sides = sides;
        this.radius = radius;
        this.mass = mass;
        this.payload = payload
    }
}

class PhysBranch{
    constructor(rotation, translation, block, children){
        this.rotation = rotation;
        this.translation = translation;
        this.block = block;
        this.children = children;
    }
}

export {PhysBlock, PhysBranch, PhysPayload}
