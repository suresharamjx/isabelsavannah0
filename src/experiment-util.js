class Range{
    constructor(min, max, target){
        this.values = {
            min: min,
            max: max,
            target: target
        };
    }
}

class RangedValue{
    constructor(value, range){
        this.value = value;
        this.range = range;
    }
}

export {Range, RangedValue, RangedValue as RangedInteger}
