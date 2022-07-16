const { ethers } = require("hardhat")

const enterRaffle = async () => {
    const raffle = await ethers.getContract("Raffle")
    const raffleState = await raffle.getRaffleState()
    console.log("##raffleState", raffleState);
}

enterRaffle()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })