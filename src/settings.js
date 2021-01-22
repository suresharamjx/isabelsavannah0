let defaults = {
    food: {
        sides: 3,
        radius: 30,
        omega: .1,
        rate: 0.01,
        initial: 3,
        value: 10,
    },

    field: {
        xSize: 10000,
        ySize: 10000,
        renderScale: 10,
    },

    pool: {
        population: 100,
        concurrent: 6,
        spawnInterval: 100,
        reproduceInterval: 1500,
    },

    ship: {
        initialFood: 10,
        metabolisim: 0.01,
        agingBasis: 5000,
        scoringRatio: 0.001,
        scoreThreshold: 5,
    },

    physicsTickTime: 0.01,
    displayTickTime: (1/120),

    mutationChance: 0.02,
    mutationAmountMax: 0.2,
}

export {defaults}
