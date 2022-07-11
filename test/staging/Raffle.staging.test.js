const { network, getNamedAccounts, deployments, ethers } = require("hardhat")
const { assert, expect } = require("chai")
const { developmentChains, networkConfig } = require("../../helper-hardhat-config")

const main = () => {
    return developmentChains.includes(network.name)
        ? describe.skip
        : describe("Raffle", () => {
              let raffle, raffleEntranceFee, deployer
              const chainId = network.config.chainId

              beforeEach(async () => {
                  deployer = (await getNamedAccounts()).deployer
                  raffle = await ethers.getContract("Raffle", deployer)
                  raffleEntranceFee = await raffle.getEntranceFee()
              })

              describe("fulfillRandomWords", () => {
                  it("works with live Chainlink Keepers and Chainlink VRF, we get a random winner", async () => {
                      // last or latest timestamp
                      const startingTimeStamp = await raffle.getLastTimestamp()
                      const accounts = await ethers.getSigners()

                      // setup the listener before we enter the raffle
                      // Just in case blockchain moves REALLY fast
                      await new Promise(async (resolve, reject) => {
                          raffle.once("WinnerPicked", async () => {
                              console.log("Found the WinnerPicked")
                              try {
                                  // add our asserts here
                                  const recentWinner = await raffle.getRecentWinner()
                                  //   console.log("##recentWinner", recentWinner)
                                  const raffleState = await raffle.getRaffleState()
                                  const winnerEndingBalance = await accounts[0].getBalance()
                                  const endingTimeStamp = await raffle.getLastTimestamp()

                                  // To test the raffle has been reset
                                  await expect(raffle.getPlayer(0)).to.be.reverted

                                  assert.equal(recentWinner.toString(), accounts[0].address)
                                  assert.equal(raffleState, 0)
                                  assert.equal(
                                      winnerEndingBalance.toString(),
                                      winnerStartingBalance.add(raffleEntranceFee).toString()
                                  )
                                  assert(endingTimeStamp > startingTimeStamp)
                                  resolve()
                              } catch (err) {
                                  console.log("##err", err)
                                  reject(err)
                              }
                          })
                          await raffle.enterRaffle({ value: raffleEntranceFee })
                          const winnerStartingBalance = await accounts[0].getBalance()
                      })
                  })
              })
          })
}

main()
