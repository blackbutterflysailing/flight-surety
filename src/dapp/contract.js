import FlightSuretyApp from '../../build/contracts/FlightSuretyApp.json';
import FlightSuretyData from '../../build/contracts/FlightSuretyData.json';
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
        this.flightNames = [];
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
        await this.config.flightSuretyData.authorizeCaller.call(this.config.appAddress);

        for (let i = 0; i < 4; i++) {

            // Register airline accounts
            await this.config.flightSuretyApp.methods.registerAirline.call(this.airlines[i], this.airlineNames[i] + "Airlines", {from: this.owner, gas: 1500000});
            isRegistered = await this.config.flightSuretyApp.methods.isAirlineRegistered(this.airlines[i]);
            
            if (isRegistered) {
                airline = await this.config.flightSuretyApp.methods.getAirline.call(this.airlines[i]);
                console.log("Airline " + airline.name);
            }

            // Airlines fund the registration fee
            let payment = new BigNumber(web3.utils.toWei('10', "ether"));
            await this.config.flightSuretyApp.methods.fundAirlineRegistration({
                from: this.airlines[i],
                value: payment
            });
   
            // Create flight names
            this.flightNames.push(generate_random_string(2) + getRandomNumber(1000, 9999).toString());
            console.log("Created flight names " + flightNames);

            // Create flights
            currentDate = new Date();
            this.flights[this.flightNames[i]] = {
                name: this.flightNames[i],
                airlineAddress: this.airlines[i],
                departure: Math.floor(new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDay(), currentDate.getHours() + i, currentDate.getMinutes(), currentDate.getSeconds(), currentDate.getMilliseconds()) / 1000),
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

    getRandomNumber(min, max) {
        return Math.random() * (max - min) + min;
    }

    generate_random_string(string_length){
        let random_string = '';
        let random_ascii;
        for(let i = 0; i < string_length; i++) {
            random_ascii = Math.floor((Math.random() * 25) + 97);
            random_string += String.fromCharCode(random_ascii)
        }
        return random_string
    }

    //console.log(generate_random_string(5))

}
