# FlightSurety

FlightSurety is a sample application project for Udacity's Blockchain course that enables passengers to buy flight insurance.

## Install

This repository contains Smart Contract code in Solidity (using Truffle), tests (also using Truffle), dApp scaffolding (using HTML, CSS and JS) and server app scaffolding.

Clone this repository:

```
git clone https://github.com/blackbutterflysailing/flight-surety.git
```


then:

`npm install`
```

Launch Ganache:

```
ganache-cli -m "spirit supply whale amount human item harsh scare congress discover talent hamster"
```

Your terminal should look something like this:

![truffle test](images/ganache-cli.png)

In a separate terminal window, Compile smart contracts:

```
`truffle compile`

## Develop Client

To run truffle tests:

`truffle test ./test/flightSurety.js`
`truffle test ./test/oracles.js`

To use the dapp:

`truffle migrate`
`npm run dapp`

To view dapp:

`http://localhost:8000`

## Develop Server

`npm run server`
`truffle test ./test/oracles.js`

## Deploy

To build dapp for prod:
`npm run dapp:prod`

Deploy the contents of the ./dapp folder


## Resources

* [How does Ethereum work anyway?](https://medium.com/@preethikasireddy/how-does-ethereum-work-anyway-22d1df506369)
* [BIP39 Mnemonic Generator](https://iancoleman.io/bip39/)
* [Truffle Framework](http://truffleframework.com/)
* [Ganache Local Blockchain](http://truffleframework.com/ganache/)
* [Remix Solidity IDE](https://remix.ethereum.org/)
* [Solidity Language Reference](http://solidity.readthedocs.io/en/v0.4.24/)
* [Ethereum Blockchain Explorer](https://etherscan.io/)
* [Web3Js Reference](https://github.com/ethereum/wiki/wiki/JavaScript-API)

## Cautionary Tales
* Make sure that all the contracts have the right pragma among the contracts of
    * FlightSuretyApp
    * FlightSuretyData
    * Migrations
    * SafeMath

* Fix the error "Error: Cannot find module 'webpack-cli/bin/config-yargs'"
    * Open file node_modules\webpack-dev-server\bin\webpack-dev-server.js
    * Change 'webpack-cli/bin/config-yargs' to 'webpack-cli/bin/config/config-yargs'
    * Change 'webpack-cli/bin/convert-argv' to 'webpack-cli/bin/utils/convert-argv'
    * Reference: https://github.com/webpack/webpack-dev-server/issues/2029

* Fix the error "'Support for the experimental syntax 'classProperties' isn't currently enabled' and 'Add @babel/plugin-proposal-class-properties (https://git.io/vb4SL) to the 'plugins' section of your Babel config to enable transformation.'" The error occurs when you execute the command `npm run dapp`
    * Create a .babelrc file at the top of the project
    * Add the following to the new .babelrc file
    {
    "presets": ["@babel/env"],
    "plugins": [
      "@babel/plugin-proposal-class-properties"
    ]
  }