const { ethers } = require("hardhat")

const enterRaffle = async () => {
    const raffle = await ethers.getContract("Raffle")
    const recentWinner = await raffle.getRecentWinner()
    console.log("##recentWinner", recentWinner);
}

enterRaffle()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })