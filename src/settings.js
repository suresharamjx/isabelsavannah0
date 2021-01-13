let defaults = {
    food: {
        sides: 3,
        radius: 30,
        omega: .1,
        rate: 0.02,
        initial: 3,
        value: 10,
    },

    field: {
        xSize: 5000,
        ySize: 5000,
        renderScale: 5,
    },

    pool: {
        population: 100,
        concurrent: 6,
    },

    ship: {
        initialFood: 10,
        metabolisim: 0.03,
        agingBasis: 1000,
        scoringRatio: 0.001,
        scoreThreshold: 5,
    },

    physicsTickTime: 0.01,
    displayTickTime: (1/60),
}

export {defaults}
