import FlightSuretyApp from '../../build/contracts/FlightSuretyApp.json';
import FlightSuretyData from '../../build/contracts/FlightSuretyData.json';
import Config from './config.json';
import Web3 from 'web3';

export default class Contract {
    constructor(network, callback) {

        this.config = Config[network];
        this.web3 = new Web3(new Web3.providers.HttpProvider(this.config.url));
        this.flightSuretyApp = new this.web3.eth.Contract(FlightSuretyApp.abi, this.config.appAddress);
        this.flightSuretyData = new this.web3.eth.Contract(FlightSuretyData.abi, this.config.dataAddress);
        this.initialize(callback);
        this.owner = null;
        this.airlines = [];
        this.airlineNames = ["England", "France", "Germany", "Spain"];
        this.flightNames = [];
        this.passengers = [];
        this.flights = {};
        console.log("Constructor this.config=" + this.config);
        console.log("Constructor this.config.appAddress=" + this.config.appAddress);
    }

    async initialize(callback) {
        let accounts = await this.web3.eth.getAccounts();
        console.log("initialize this.config=" + this.config);
        console.log("initialize this.config.appAddress=" + this.config.appAddress);
 
        this.owner = accounts[0];

        // Set up four airline accounts
        this.airlines = accounts.slice(0,4);

        // Set up four passenger accounts
        this.passengers = accounts.slice(5, 9);

        // Authorize Contract Caller to Access Data Contract
        //console.log("config=" + config);
        //console.log("config.appAddress=" + config.appAddress);
        console.log("this.config=" + this.config);
        console.log("this.config.appAddress=" + this.config.appAddress);
        await this.flightSuretyData.methods.authorizeCaller(this.config.appAddress).send({from: this.owner});

        for (let i = 0; i < 4; i++) {

       // Create flight names
       this.flightNames.push(this.generate_random_string(2) + this.getRandomNumber(1000, 9999).toString());
       console.log("Created flight names " + this.flightNames);

       // Create flights
       this.currentDate = new Date();
       this.flights[this.flightNames[i]] = {
           name: this.flightNames[i],
           airlineAddress: this.airlines[i],
           departure: Math.floor(new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), this.currentDate.getDay(), this.currentDate.getHours() + i, this.currentDate.getMinutes(), this.currentDate.getSeconds(), this.currentDate.getMilliseconds()) / 1000),
       }

       // Register airline accounts
            await this.flightSuretyApp.methods.registerAirline.call(this.airlines[i], this.airlineNames[i] + "Airlines", {from: this.owner, gas: 1500000});
            let isRegistered = await this.flightSuretyApp.methods.isAirlineRegistered(this.airlines[i]).call();
            
            // if (isRegistered) {
            //     airline = await this.flightSuretyApp.methods.getAirline(this.airlines[i]).call();
            //     console.log("Airline " + airline.name);
            // }

            // Airlines fund the registration fee
            // let payment = new BigNumber(web3.utils.toWei('10', "ether"));
            // await this.config.flightSuretyApp.methods.fundAirlineRegistration({
            //     from: this.airlines[i],
            //     value: payment,
            //     gas: 1500000
            // });
   
             }
    }

    // isOperational(callback) {
    //    let self = this;
    //    self.flightSuretyApp.methods
    //         .isOperational()
    //         .call({ from: self.owner}, callback);
    // }

    // fetchFlightStatus(flight, callback) {
    //     let self = this;
    //     let payload = {
    //         airline: self.airlines[0],
    //         flight: flight,
    //         timestamp: Math.floor(Date.now() / 1000)
    //     } 
    //     self.flightSuretyApp.methods
    //         .fetchFlightStatus(payload.airline, payload.flight, payload.timestamp)
    //         .send({ from: self.owner}, (error, result) => {
    //             callback(error, payload);
    //         });
    // }

    getRandomNumber(min, max) {
        return Math.trunc(Math.random() * (max - min) + min);
    }

    generate_random_string(string_length){
        let random_string = '';
        let random_ascii;
        for(let i = 0; i < string_length; i++) {
            random_ascii = Math.floor((Math.random() * 25) + 97);
            random_string += String.fromCharCode(random_ascii)
        }
        return random_string.toUpperCase();
    }

    //console.log(generate_random_string(5))

}
