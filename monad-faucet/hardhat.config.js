require("@nomicfoundation/hardhat-ethers");

module.exports = {
  networks: {
    monad: {
      url: "https://testnet-rpc.monad.xyz/",
      accounts: [process.env.PRIVATE_KEY || "0x0000000000000000000000000000000000000000000000000000000000000000"]
    }
  },
  solidity: "0.8.24",
};
