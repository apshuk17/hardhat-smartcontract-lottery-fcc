const { network, ethers } = require("hardhat")
const { developmentChains } = require("../helper-hardhat-config")

const BASE_FEE = ethers.utils.parseEther("0.25") // 0.25 is the premium. In a real contract it costs 0.25 LINK per request.
const GAS_PRICE_LINK = 1e9 // LINK per gas, a calculated value based on the gas price of the chain

// Chainlink nodes pay the gas fees to give us randomness & do external execution,
// such as while returning randomness or executing performUpKeep
// So the price of requests changes based price of gas on the chain

module.exports = async ({ deployments, getNamedAccounts }) => {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()
    const args = [BASE_FEE, GAS_PRICE_LINK]

    // const chainId = network.config.chainId

    if (developmentChains.includes(network.name)) {
        log("Local network detected! Deploying mocks...")
        await deploy("VRFCoordinatorV2Mock", {
            from: deployer,
            log: true,
            args,
        })
        log("Mocks deployed!")
        log("--------------------------")
    }
}

module.exports.tags = ["all", "mocks"]
