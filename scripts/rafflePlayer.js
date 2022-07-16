const { ethers } = require("hardhat")

const enterRaffle = async () => {
    const raffle = await ethers.getContract("Raffle")
    const player = await raffle.getPlayer(0)
    console.log("##player", player);
}

enterRaffle()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })