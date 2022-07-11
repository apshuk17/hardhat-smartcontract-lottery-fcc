# Hardhat SmartContract Lottery

This is a solidity based lottery contract created using
1. Hardhat
2. Chainlink VRF V2
3. Chainlink Keepers


This contract allows users to enter the lottery with a minimum fee
and the smart contract will select a random winner using Chainlink Verifiable Random Number(VRF) V2
and Chainlink Keepers.



Before running the staging test:

1. Get the Subscription Id for the Chainlink VRF and fund the subscription
2. Deploy the contract using the subscription id
3. Register the contract with Chainlink VRF's and subscription Id
4. Register the contract with chainlink keepers
5. Run Staging Tests
