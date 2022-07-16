const { ethers } = require("hardhat")

const enterRaffle = async () => {
    const raffle = await ethers.getContract("Raffle")
    const numOfPlayers = await raffle.getNumberOfPlayers()
    console.log("##numOfPlayers", numOfPlayers.toString());
}

enterRaffle()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })