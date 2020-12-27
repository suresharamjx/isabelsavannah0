function randFloat(max){
    return Math.random() * max;
}

function randInt(max){
    return Math.floor(Math.random() * max);
}

function randIntDecaying(max, rate){
    let soFar = 0;
    while(Math.random() < rate){
        soFar++;
    }

    return soFar;
}

export {randFloat, randInt, randIntDecaying}