/* eslint-disable node/no-unpublished-require */
const { run } = require("hardhat");

const verify = async (contractAddr, args) => {
  console.log("Verifying contract...");
  try {
    await run("verify:verify", {
      address: contractAddr,
      constructorArguments: args,
    });
  } catch (e) {
    if (e.message.toLowerCase().includes("already verified")) {
      console.log("Already Verified");
    } else {
      console.error(e);
    }
  }
};

module.exports = { verify };
