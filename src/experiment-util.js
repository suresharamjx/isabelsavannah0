class Range{
    constructor(min, max, target){
        this.min = min;
        this.max = max;
        this.target = target;
    }
}

class RangedValue{
    constructor(value, range){
        this.value = value;
        this.range = range;
        this.integer = false;
    }
}

class RangedInteger{
    constructor(value, range){
        this.value = value;
        this.range = range;
        this.integer = true;
    }
}


export {Range, RangedValue, RangedInteger}
