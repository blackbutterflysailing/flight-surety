var Test = require('../config/testConfig.js');
var BigNumber = require('bignumber.js');

contract('Flight Surety Tests', async (accounts) => {

  var config;
  before('setup contract', async () => {
    config = await Test.Config(accounts);
    await config.flightSuretyData.authorizeCaller(config.flightSuretyApp.address);
  });

  /****************************************************************************************/
  /* Operations and Settings                                                              */
  /****************************************************************************************/

    it(`(multiparty) has correct initial isOperational() value`, async function () {

        // Get operating status
        let status = await config.flightSuretyData.isOperational.call();
        assert.equal(status, true, "Incorrect initial operating status value");

    });

    it(`(multiparty) can block access to setOperatingStatus() for non-Contract Owner account`, async function () {

      // Ensure that access is denied for non-Contract Owner account
      let accessDenied = false;
      try 
      {
          await config.flightSuretyData.setOperatingStatus(false, { from: config.testAddresses[2] });
      }
      catch(e) {
          accessDenied = true;
      }
      assert.equal(accessDenied, true, "Access not restricted to Contract Owner");
            
    });

    it(`(multiparty) can allow access to setOperatingStatus() for Contract Owner account`, async function () {

      // Ensure that access is allowed for Contract Owner account
      let accessDenied = false;
      try 
      {
          await config.flightSuretyData.setOperatingStatus(false);
      }
      catch(e) {
          accessDenied = true;
      }
      assert.equal(accessDenied, false, "Access not restricted to Contract Owner");
      
    });

    it(`can block access to functions using requireIsOperational when operating status is false`, async function () {

        let reverted = false;
        try 
        {
        await config.flightSuretyData.isCallerAuthorized(config.owner);
        }
        catch(e) {
            reverted = true;
        }

        // ASSERT
        assert.equal(reverted, true, "Access not blocked for requireIsOperational");      

        // Set it back for other tests to work
        await config.flightSuretyData.setOperatingStatus(true);

    });

    it('(airline) register first airline when contract is deployed', async () => {

        // ARRANGE
        let result = await config.flightSuretyData.isAirlineRegistered.call(config.firstAirline);
        
        // ASSERT
        assert.equal(result, true, "First Airline was not registered");

    });

    it('(contract access) can block access for contracts that have not been authorized', async () => {

        // ARRANGE
        let newAirline = config.airlinesByProxy[0];

        await config.flightSuretyApp.registerAirline.call(newAirline,"TestAirlineProxy0");
        let isFlightRegistered = await config.flightSuretyApp.isAirlineRegistered.call(newAirline);
 
        // ASSERT
        assert.equal(isFlightRegistered, false, "Airline registered");

    });

    it('(contract access) contracts can be authorized to be contract caller by contract owner', async () => {

        let reverted = false;

        // ARRANGE

        // Authorize the FlightSuretyApp contract to be able to call contract FlightSuretyData
        await config.flightSuretyData.authorizeCaller.call(config.flightSuretyApp.address);
        let authorized = await config.flightSuretyData.isCallerAuthorized(config.flightSuretyApp.address);

        // ASSERT
        assert.equal(authorized, true, "Access not allowed for this contract caller");

    });

    it('(airline) first airline funded when contract is deployed', async () => {

        // ARRANGE
        let result = await config.flightSuretyApp.isAirlineMember.call(config.firstAirline);
        
        // ASSERT
        assert.equal(result, true, "First Airline was not registered");

    });   

    it('(airline) cannot get airline that has not beeen registered', async () => {

        // ARRANGE
        let result = await config.flightSuretyApp.getAirline.call(config.airlinesByProxy[0]);
        
        // ASSERT
        assert.equal(result.isValue, false, "Error airline should not have been found registered.");

    });   
  
    it('(airline) cannot register an Airline using registerAirline() if it is not funded', async () => {
    
        // ARRANGE
        let newAirline = config.airlinesByProxy[0];
        let isError = false;

        // ACT
        await config.flightSuretyApp.registerAirline(newAirline, "TestProxy0");

        let airline = await config.flightSuretyApp.getAirline.call(newAirline); 
        let result = await config.flightSuretyApp.isAirlineMember.call(newAirline); 

        // ASSERT
        assert.equal(isError, false, "Error registering airline");
        assert.equal(airline.name, "TestProxy0", "Airline is not registered." + airline.name);
        assert.equal(result, false, "Airline should not be able to register another airline if it hasn't provided funding");

    });

    it(`(airline) will be fully enabled after sending the registration amount to the contract`, async() => {
        assert(await config.flightSuretyApp.isAirlineMember.call(config.firstAirline), 'Airline is not funded')
    });

    it('(airline) must func contract with 10 ether', async() => {
        
        // ARRANGE
        let payment = new BigNumber(web3.utils.toWei('10', "ether"));
        let airlineBalanceBegin = new BigNumber(await web3.eth.getBalance(config.airlinesByProxy[0]));
        let flightSuretyDataBalanceBegin = new BigNumber(await web3.eth.getBalance(config.flightSuretyData.address));

        // ACT
        await config.flightSuretyApp.fundAirlineRegistration({
            from: config.airlinesByProxy[0], 
            value: payment
        });

        let airlineBalanceEnd = new BigNumber(await web3.eth.getBalance(config.airlinesByProxy[0]));
        let flightSuretyDataBalanceEnd = new BigNumber(await web3.eth.getBalance(config.flightSuretyData.address));
        
         // ASSERT
        assert(airlineBalanceBegin.isGreaterThan(airlineBalanceEnd), 'Airline balance should be lower');
        // assert(flightSuretyDataBalanceBegin.isGreaterThan(flightSuretyDataBalanceEnd), 'Data contract balance should be higher');
        assert(flightSuretyDataBalanceEnd.isGreaterThan(flightSuretyDataBalanceBegin), 'Data contract balance should be higher');
    });

    it('(airline) funded can register new airline, event AirlineRegistered emitted', async() => {

        // ARRANGE
        let newAirline = config.airlinesByProxy[1];

        // ACT
        await config.flightSuretyApp.registerAirline(newAirline, "TestProxy1");

        let airline = await config.flightSuretyApp.getAirline.call(newAirline); 
        let result = await config.flightSuretyApp.isAirlineMember.call(newAirline); 

        // ASSERT
        assert.equal(airline.name, "TestProxy1", "Airline is not registered." + airline.name);
        assert.equal(result, false, "Airline should not be able to register another airline if it hasn't provided funding");
      });
 

      it('(airline) unfunded cannot register new airline', async() => {

        // ACT
        let newAirline = config.airlinesByProxy[2];
        let referenceAirline = config.airlinesByProxy[1];
        let result = await config.flightSuretyApp.isAirlineMember.call(referenceAirline); 
        let isError = false;

        try {
        await config.flightSuretyApp.registerAirline(newAirline, 'TestAirlineByProxy3', 
        {from: referenceAirline});
        }
        catch(e) {
            isError = true;
        }        
        // ASSERT
        assert.equal(isError, true, "Unfunded airline registered a new airline");
      });


});
