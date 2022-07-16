const { network, getNamedAccounts, deployments, ethers } = require("hardhat")
const { assert, expect } = require("chai")
const { developmentChains, networkConfig } = require("../../helper-hardhat-config")

const main = () => {
    return !developmentChains.includes(network.name)
        ? describe.skip
        : describe("Raffle", () => {
              let raffle, vrfV2Mock, raffleEntranceFee, deployer, interval
              const chainId = network.config.chainId

              beforeEach(async () => {
                  deployer = (await getNamedAccounts()).deployer
                  await deployments.fixture(["all"])

                  raffle = await ethers.getContract("Raffle", deployer)
                  vrfV2Mock = await ethers.getContract("VRFCoordinatorV2Mock", deployer)
                  raffleEntranceFee = await raffle.getEntranceFee()
                  interval = await raffle.getInterval()
              })

              describe("constructor", () => {
                  it("Initializes the Raffle correctly", async () => {
                      const raffleState = await raffle.getRaffleState()
                      assert.equal(raffleState.toString(), "0")
                      assert.equal(interval.toString(), networkConfig[chainId].interval)
                  })
              })

              describe("Enter Raffle", () => {
                  it("revert when you don't pay enough", async () => {
                      await expect(raffle.enterRaffle()).to.be.revertedWith(
                          "Raffle__NotEnoughETHEntered"
                      )
                  })

                  it("record players when they enter", async () => {
                      await raffle.enterRaffle({ value: raffleEntranceFee })
                      const playerFromContract = await raffle.getPlayer(0)
                      assert.equal(playerFromContract, deployer)
                  })

                  it("emits event on enter", async () => {
                      await expect(raffle.enterRaffle({ value: raffleEntranceFee })).to.emit(
                          raffle,
                          "RaffleEnter"
                      )
                  })

                  it("doesn't allow entrance when raffle is calculating", async () => {
                      await raffle.enterRaffle({ value: raffleEntranceFee })
                      await network.provider.send("evm_increaseTime", [parseFloat(interval) + 1])
                      await network.provider.send("evm_mine", [])

                      // We pretend to be a chainlink keeper
                      await raffle.performUpkeep([])
                      await expect(
                          raffle.enterRaffle({ value: raffleEntranceFee })
                      ).to.be.revertedWith("Raffle__NotOpen")
                  })
              })

              describe("checkUpKeep", () => {
                  it("returns false if people doesn't send any eth", async () => {
                      await network.provider.send("evm_increaseTime", [parseFloat(interval) + 1])
                      await network.provider.send("evm_mine", [])
                      // callStatic will simulate the transaction being sent to the blockchain.
                      // In fact there is no real transaction made.
                      const { upKeepNeeded } = await raffle.callStatic.checkUpkeep([])
                      assert(!upKeepNeeded)
                  })

                  it("returns false if raffle isn't open", async () => {
                      await raffle.enterRaffle({ value: raffleEntranceFee })
                      await network.provider.send("evm_increaseTime", [parseFloat(interval) + 1])
                      await network.provider.send("evm_mine", [])
                      /** To send a blank bytes object there are 2 ways
                       * 1. An empty array
                       * 2. String 0x
                       */
                      await raffle.performUpkeep("0x")
                      const raffleState = await raffle.getRaffleState()
                      const { upKeepNeeded } = await raffle.callStatic.checkUpkeep("0x")
                      assert.equal(raffleState.toString(), "1")
                      assert(!upKeepNeeded)
                  })

                  it.only("returns false if enough time hasn't passed", async () => {
                      await raffle.enterRaffle({ value: raffleEntranceFee })
                      await network.provider.send("evm_increaseTime", [parseFloat(interval) - 1])
                      await network.provider.send("evm_mine", [])
                      const { upKeepNeeded } = await raffle.callStatic.checkUpkeep("0x")
                      assert(!upKeepNeeded)
                  })

                  it("returns true if enough time has passed, has players, eth, and is open", async () => {
                      await raffle.enterRaffle({ value: raffleEntranceFee })
                      await network.provider.send("evm_increaseTime", [parseFloat(interval) + 1])
                      /** Provider can use send or request to call JSON-RPC API methods */
                      await network.provider.request({ method: "evm_mine", params: [] })
                      const { upKeepNeeded } = await raffle.callStatic.checkUpkeep("0x")
                      assert(upKeepNeeded)
                  })
              })

              describe("performUpKeep", () => {
                  it("performUpKeep can only run if checkUpKeep is true", async () => {
                      /**
                       * Code to favor checkUpKeep in order to return "upKeepNeeded" as true
                       * 1. enterRaffle
                       * 2. Increase the evm time
                       * 3. Mine a new block
                       */
                      await raffle.enterRaffle({ value: raffleEntranceFee })
                      await network.provider.send("evm_increaseTime", [parseFloat(interval) + 1])
                      await network.provider.send("evm_mine", [])
                      const tx = await raffle.performUpkeep("0x")
                      assert(tx)
                  })

                  it("performUpKeep reverts if checkUpKeep is false", async () => {
                      await network.provider.send("evm_increaseTime", [parseFloat(interval) + 1])
                      await network.provider.send("evm_mine", [])
                      await expect(raffle.performUpkeep("0x")).to.be.revertedWith(
                          "Raffle__UpKeepNotNeeded"
                      )
                  })

                  it("performUpKeep updates the raffle state, emits an event and calls the vrf coordinator", async () => {
                      await raffle.enterRaffle({ value: raffleEntranceFee })
                      await network.provider.send("evm_increaseTime", [parseFloat(interval) + 1])
                      await network.provider.send("evm_mine", [])
                      const txResponse = await raffle.performUpkeep("0x")
                      const txReceipt = await txResponse.wait(1)
                      const requestId = txReceipt.events[1].args.requestId
                      const raffleState = await raffle.getRaffleState()
                      assert(parseInt(requestId) > 0)
                      assert(raffleState.toString() === "1")
                  })
              })

              describe("fulfillRandomWords", () => {
                  beforeEach(async () => {
                      await raffle.enterRaffle({ value: raffleEntranceFee })
                      await network.provider.send("evm_increaseTime", [parseFloat(interval) + 1])
                      await network.provider.send("evm_mine", [])
                  })

                  it("can only be called after performUpKeep", async () => {
                      await expect(
                          vrfV2Mock.fulfillRandomWords(0, raffle.address)
                      ).to.be.revertedWith("nonexistent request")

                      await expect(
                          vrfV2Mock.fulfillRandomWords(1, raffle.address)
                      ).to.be.revertedWith("nonexistent request")
                  })

                  it("picks a winner, resets the lottery and sends money", async () => {
                      const additionalEntrants = 3
                      const startingAccountIndex = 1 // deployer's index is 0
                      const accounts = await ethers.getSigners()

                      for (
                          let i = startingAccountIndex;
                          i < startingAccountIndex + additionalEntrants;
                          i++
                      ) {
                          const accountConnectedRaffle = raffle.connect(accounts[i])
                          await accountConnectedRaffle.enterRaffle({ value: raffleEntranceFee })
                      }
                      const startingTimeStamp = await raffle.getLastTimestamp()
                      assert(startingTimeStamp > 0)
                      // performUpKeep (mock being chainlink keepers)
                      // fulfillRandomWords (mock being the chainlink VRF)
                      // Wait for the fulfillRandomWords to be called
                      await new Promise(async (resolve, reject) => {
                          // Setting up the listener
                          // below, we'll fire the event, and the listener will pick it up, and resolve
                          raffle.once("WinnerPicked", async () => {
                              console.log("Found the WinnerPicked")
                              try {
                                  const recentWinner = await raffle.getRecentWinner()
                                  console.log("##recentWinner", recentWinner)
                                  const raffleState = await raffle.getRaffleState()
                                  const endingTimeStamp = await raffle.getLastTimestamp()
                                  const numPlayers = await raffle.getNumberOfPlayers()
                                  const winnerEndingBalance = await accounts[1].getBalance()
                                  assert.equal(numPlayers.toString(), "0")
                                  assert.equal(raffleState.toString(), "0")
                                  assert(endingTimeStamp > startingTimeStamp)

                                  assert.equal(
                                      winnerEndingBalance.toString(),
                                      winnerStartingBalance
                                          .add(
                                              raffleEntranceFee
                                                  .mul(additionalEntrants)
                                                  .add(raffleEntranceFee)
                                          )
                                          .toString()
                                  )
                              } catch (e) {
                                  reject()
                              }
                              resolve()
                          })
                          const txResponse = await raffle.performUpkeep("0x")
                          const txReceipt = await txResponse.wait(1)
                          const requestId = txReceipt.events[1].args.requestId
                          const winnerStartingBalance = await accounts[1].getBalance()
                          await vrfV2Mock.fulfillRandomWords(requestId, raffle.address)
                      })
                  })
              })
          })
}

main()
