require("dotenv").config()
const path = require("path")
const fsp = require("fs/promises")
const { ethers, network } = require("hardhat")

const FRONT_END_PROJECT_PATH = path.join(__dirname, "../..", "nextjs-smartcontract-lottery-fcc")

const FRONT_END_CONTRACT_ADDRESS_FILE_PATH = path.join(
    FRONT_END_PROJECT_PATH,
    "constants",
    "contractAddresses.json"
)

const FRONT_END_CONTRACT_ABI_FILE_PATH = path.join(FRONT_END_PROJECT_PATH, "constants", "abi.json")

const updateContractAddresses = async () => {
    try {
        const raffle = await ethers.getContract("Raffle")
        const chainId = network.config.chainId.toString()
        const contractAddresses = JSON.parse(
            await fsp.readFile(FRONT_END_CONTRACT_ADDRESS_FILE_PATH, "utf-8")
        )

        if (raffle.address) {
            if (chainId in contractAddresses) {
                const chainContractAddresses = contractAddresses[chainId]
                if (
                    !(
                        chainContractAddresses.length &&
                        chainContractAddresses.includes(raffle.address)
                    )
                ) {
                    chainContractAddresses.push(raffle.address)
                }
            } else {
                contractAddresses[chainId] = [raffle.address]
            }

            await fsp.writeFile(
                FRONT_END_CONTRACT_ADDRESS_FILE_PATH,
                JSON.stringify(contractAddresses)
            )
        }
    } catch (err) {
        console.error("##err", err)
    }
}

const updateAbi = async () => {
    try {
        const raffle = await ethers.getContract("Raffle")
        if (raffle.address) {
            await fsp.writeFile(
                FRONT_END_CONTRACT_ABI_FILE_PATH,
                raffle.interface.format(ethers.utils.FormatTypes.json)
            )
        }
    } catch (err) {
        console.error("##err", err)
    }
}

module.exports = async () => {
    if (process.env.UPDATE_FRONT_END) {
        console.log("Updating front end...")
        await updateContractAddresses()
        await updateAbi()
    }
}

module.exports.tags = ["all", "frontend"]
