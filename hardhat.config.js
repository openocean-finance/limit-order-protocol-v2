require('@nomiclabs/hardhat-etherscan');
require('@nomiclabs/hardhat-truffle5');
require('solidity-coverage');
require('hardhat-deploy');
require('hardhat-gas-reporter');
require('dotenv').config();
require("@nomiclabs/hardhat-waffle");

const { ownerPrivateKey, privateKey, address ,privateKeyTest} = require('./secrets.json');

module.exports = {
    solidity: {
        version: '0.8.10',
        settings: {
            optimizer: {
                enabled: true,
                runs: 200,
            },
        },
    },
    etherscan: {
        // Your API key for Etherscan
        // Obtain one at https://bscscan.com/
        //bsc  QQQ3E4UT98E7V6AAFRPEMYD21M1VG4HNHY
        //bsc_test   d87255a6627542eba4eaa9d5278832e0
        apiKey: "QQQ3E4UT98E7V6AAFRPEMYD21M1VG4HNHY"
    },
    networks: {
        bsc: {
            url: 'https://data-seed-prebsc-1-s1.binance.org:8545/',
            chainId: 97,
            gas: 2000000,
            timeout: 10000000,
            accounts: [privateKeyTest],
        },
        bsc_mainnet: {
            url: 'https://bsc-dataseed.binance.org/',
            chainId: 56,
            timeout: 10000000,
            accounts: [privateKey, ownerPrivateKey],
        },
    },
};
