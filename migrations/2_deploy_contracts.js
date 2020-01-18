const FlightSuretyApp = artifacts.require("FlightSuretyApp");
const FlightSuretyData = artifacts.require("FlightSuretyData");
const fs = require('fs');

module.exports = async function(deployer, network, accounts) {

    let firstAirline = accounts[1];
    await deployer.deploy(FlightSuretyData);
    const flightSuretyDataContract = await FlightSuretyData.deployed();

    await deployer.deploy(FlightSuretyApp, flightSuretyDataContract.address);
    const flightSuretyAppContract = await FlightSuretyApp.deployed();

    let config = {
        localhost: {
            url: 'http://localhost:8545',
            dataAddress: FlightSuretyData.address,
            appAddress: FlightSuretyApp.address
        }
    }    

    fs.writeFileSync(__dirname + '/../src/dapp/config.json',JSON.stringify(config, null, '\t'), 'utf-8');
  fs.writeFileSync(__dirname + '/../src/server/config.json',JSON.stringify(config, null, '\t'), 'utf-8');
}
