
var FlightSuretyApp = artifacts.require("FlightSuretyApp");
var FlightSuretyData = artifacts.require("FlightSuretyData");
var BigNumber = require('bignumber.js');

var Config = async function(accounts) {
    
    // These test addresses are useful when you need to add
    // multiple users in test scripts
    let testAddresses = [
        "0x627306090abab3a6e1400e9345bc60c78a8bef57",
        "0xf17f52151ebef6c7334fad080c5704d77216b732",
        "0xc5fdf4076b8f3a5357c5e395ab970b5b54098fef",
        "0x821aea9a577a9b44299b9c15c88cf3087f3b5544",
        "0x0d1d4e623d10f9fba5db95830f7d3839406c6af2",
        "0x2932b7a2355d6fecc4b5c0b6bd44cc31df247a2e",
        "0x2191ef87e392377ec08e7c08eb105ef5448eced5",
        "0x0f4f2ac550a1b4e2280d04c21cea7ebd822934b5",
        "0x6330a553fc93768f612722bb8c2ec78ac90b3bbc",
        "0x5aeda56215b167893e80b4fe645ba6d5bab767de"
    ];


    let owner = accounts[0];
    let firstAirline = accounts[1];

    let flightSuretyData = await FlightSuretyData.new(firstAirline, {from: owner});
    let flightSuretyApp = await FlightSuretyApp.new(flightSuretyData.address, {from: owner});

    let airlinesByProxy = accounts.slice(1, 4);
    let airlinesByVoting = accounts.slice(4, 11);
    let passengers = accounts.slice(11, 15);
    
    return {
        owner: owner,
        firstAirline: firstAirline,
        airlinesByProxy: airlinesByProxy,
        airlinesByVoting: airlinesByVoting,
        passengers: passengers,
        weiMultiple: (new BigNumber(10)).pow(18),
        testAddresses: testAddresses,
        flightSuretyData: flightSuretyData,
        flightSuretyApp: flightSuretyApp
    }
}

module.exports = {
    Config: Config
};