
var FlightSuretyApp = artifacts.require("FlightSuretyApp");
var FlightSuretyData = artifacts.require("FlightSuretyData");
var BigNumber = require('bignumber.js');

var Config = async function(accounts) {
    
    // These test addresses are useful when you need to add
    // multiple users in test scripts
    let testAddresses = [
        "0x397b46c3f1ac90b785129e54dfee22773a72acbf",
        "0xd96ea9cbc28b231aa4712f228871f85eedca55ab",
        "0xd8f05fcc45f64b2d89770345fc56a1565f6e36ac",
        "0x68e9ae115d4ecb3fd44fa87d3093f835ffecb24c",
        "0x73082502aa18b04b19cbad0b3426f65e29f95972",
        "0x230ac9a7ed4b3da7dafcd41e45a471b11e6d449e",
        "0x1420bba6c2b3bbc6d62e91812f13937b8600cd84",
        "0x6e2d9391139d9fa34b7ba497a85b13c63d75efb7",
        "0x3ca44d525794ed2f9fdfddbff0ff61b273ad468c",
        "0xf90e6e63b9c8d45a7cd5f0e8155eee6cbe3c4596"
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