const FlightSuretyApp = artifacts.require("FlightSuretyApp");
const FlightSuretyData = artifacts.require("FlightSuretyData");
const fs = require('fs');

module.exports = async function(deployer, network, accounts) {

    let firstAirline = "0xf17f52151ebef6c7334fad080c5704d77216b732";
    await deployer.deploy(FlightSuretyData,firstAirline)

    await deployer.deploy(FlightSuretyApp, FlightSuretyData.address);
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
