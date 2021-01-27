let defaults = {
    food: {
        sides: 3,
        radius: 30,
        omega: .1,
        rate: 0.03,
        initial: 3,
        value: 2000,
    },

    field: {
        xSize: 7000,
        ySize: 7000,
        renderScale: 7,
    },

    pool: {
        population: 200,
        concurrent: 5,
        spawnInterval: 200,
        reproduceInterval: 3000,
    },

    ship: {
        initialFood: 0.01,
        metabolisim: 0.00002,
        agingBasis: 5000,
        scoringRatio: 0.001,
        scoreThreshold: 5,
        thrusterPowerMassRatio: 0.04,
        massMetabolisimMin: 10000,
    },

    physicsTickTime: 0.01,
    displayTickTime: (1/120),

    mutationChance: 0.02,
    mutationAmountMax: 0.1,
}

export {defaults}
