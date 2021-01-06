function randFloat(max){
    return Math.random() * max;
}

function randInt(max){
    return Math.floor(Math.random() * max);
}

function randIntRange(min, max){
    return min + randInt(max-min);
}

function randIntDecaying(max, rate){
    let soFar = 0;
    while(Math.random() < rate){
        soFar++;
    }

    return soFar;
}

function randChoice(array){
    return array[randInt(array.length)];
}


export {randChoice, randFloat, randInt, randIntDecaying, randIntRange}
