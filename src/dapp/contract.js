import FlightSuretyApp from '../../build/contracts/FlightSuretyApp.json';
import Config from './config.json';
import Web3 from 'web3';

export default class Contract {
    constructor(network, callback) {

        let config = Config[network];
        this.web3 = new Web3(new Web3.providers.HttpProvider(config.url));
        this.flightSuretyApp = new this.web3.eth.Contract(FlightSuretyApp.abi, config.appAddress);
        this.flightSuretyData = new this.web3.eth.Contract(FlightSuretyData.abi, config.dataAddress);
        this.initialize(callback);
        this.owner = null;
        this.airlines = [];
        this.airlineNames = ["England", "France", "Germany", "Spain"];
        this.passengers = [];
        this.flights = {};
    }

    async initialize(callback) {
        let accounts = await this.web3.eth.getAccounts();

        this.owner = accounts[0];

        // Set up four airline accounts
        this.airlines = accounts.slice(0,4);

        // Set up four passenger accounts
        this.passengers = accounts.slice(5, 9);

        // Authorize Contract Caller to Access Data Contract
        await config.flightSuretyData.authorizeCaller.call(this.config.appAddress);

        for (let i = 0; i < 4; i++) {

            // Register airline accounts
            await config.flightSuretyApp.methods.registerAirline.call(this.airlines[i], this.airlineNames[i] + "Airlines", {from: this.owner, gas: 1500000});
            isRegistered = await config.flightSuretyApp.methods.isAirlineRegistered(this.airlines[i]);
            
            if (isRegistered) {
                airline = await config.flightSuretyApp.methods.getAirline.call(this.airlines[i]);
                console.log("Airline " + airline.name);
            }
   
        }

        // this.web3.eth.getAccounts((error, accts) => {
           
        //     this.owner = accts[0];

        //     let counter = 1;
            
        //     while(this.airlines.length < 5) {
        //         this.airlines.push(accts[counter++]);
        //     }

        //     while(this.passengers.length < 5) {
        //         this.passengers.push(accts[counter++]);
        //     }

        //     callback();
        // });
    }

    isOperational(callback) {
       let self = this;
       self.flightSuretyApp.methods
            .isOperational()
            .call({ from: self.owner}, callback);
    }

    fetchFlightStatus(flight, callback) {
        let self = this;
        let payload = {
            airline: self.airlines[0],
            flight: flight,
            timestamp: Math.floor(Date.now() / 1000)
        } 
        self.flightSuretyApp.methods
            .fetchFlightStatus(payload.airline, payload.flight, payload.timestamp)
            .send({ from: self.owner}, (error, result) => {
                callback(error, payload);
            });
    }
}