import FlightSuretyApp from '../../build/contracts/FlightSuretyApp.json';
import FlightSuretyData from '../../build/contracts/FlightSuretyData.json';
import Config from './config.json';
import Web3 from 'web3';
var BigNumber = require('bignumber.js');


export default class Contract {
    constructor(network, callback) {

        this.config = Config[network];
        this.web3 = new Web3(new Web3.providers.HttpProvider(this.config.url));
        this.flightSuretyApp = new this.web3.eth.Contract(FlightSuretyApp.abi, this.config.appAddress);
        this.flightSuretyData = new this.web3.eth.Contract(FlightSuretyData.abi, this.config.dataAddress);
        this.initialize(callback);
        this.owner = null;
        this.airlines = {};
        this.airlineNames = ["England", "France", "Germany", "Spain"];
        this.flightNames = ["KY3215", "AB2117", "GC1997", "YA3579"];
        this.passengers = {};
        this.passengerNames = ['Smith, Greg','Gold, Susan','Clift, Ryan','Waters, Julie','Greene, Claire'];
        this.flights = {
            'England':['FL1','FL2','FL3'],
            'France':['AL1','AL2','AL3'],
            'Germany':['BL1','BL2','BL3'],
            'Spain':['CL1','CL2','CL3'],
        }
        console.log("Constructor this.config=" + this.config);
        console.log("Constructor this.config.appAddress=" + this.config.appAddress);
    }

    async initialize(callback) {
        let accounts = await this.web3.eth.getAccounts();
        console.log("initialize this.config=" + this.config);
        console.log("initialize this.config.appAddress=" + this.config.appAddress);
 
        this.owner = accounts[0];

        // Set up four airline accounts
        this.airlines[accounts[1]] = this.airlineNames[0];
        this.airlines[accounts[2]] = this.airlineNames[1];
        this.airlines[accounts[3]] = this.airlineNames[3];
        this.airlines[accounts[4]] = this.airlineNames[4];


        // Create passengers
        this.passengers[accounts[5]] = this.passengerNames[0]; 
        this.passengers[accounts[6]] = this.passengerNames[1]; 
        this.passengers[accounts[7]] = this.passengerNames[2]; 
        this.passengers[accounts[8]] = this.passengerNames[3];

        // this.flights[this.flightNames[0]] = {
        //     name: this.flightNames[0],
        //     airlineAddress: this.airlines[accounts[1]],
        //     departure: Math.floor(new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), this.currentDate.getDay(), this.currentDate.getHours() + 1, this.currentDate.getMinutes(), this.currentDate.getSeconds(), this.currentDate.getMilliseconds()) / 1000),
        // }


        // Authorize Contract Caller to Access Data Contract
        //console.log("config=" + config);
        //console.log("config.appAddress=" + config.appAddress);
        console.log("this.config=" + this.config);
        console.log("this.config.appAddress=" + this.config.appAddress);
        await this.flightSuretyData.methods.authorizeCaller(this.config.appAddress).send({from: this.owner});

        // Create flight names
        //this.flightNames.push(this.generate_random_string(2) + this.getRandomNumber(1000, 9999).toString());
        console.log("Created flight names " + this.flightNames);


        for (let i = 1; i < 4; i++) {

            // Create flights
            this.currentDate = new Date();
            // this.flights[this.flightNames[i]] = {
            //     name: this.flightNames[i],
            //     airlineAddress: this.airlines[accounts[1]],
            //     departure: Math.floor(new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), this.currentDate.getDay(), this.currentDate.getHours() + i, this.currentDate.getMinutes(), this.currentDate.getSeconds(), this.currentDate.getMilliseconds()) / 1000),
            // }

            // Register airline accounts
            //console.log("this.flights[" + this.airlines[accounts[i]] + "]=" + this.flights[this.flightNames[i]]);
            console.log("this.airlines[" + accounts[i] + "]=" + accounts[i]);
            try {
                await this.flightSuretyApp.methods.registerAirline(accounts[i], this.airlineNames[i-1]).send({from: this.owner, gas: 1500000});
            } catch (e) {
                console.log(`Error while registring new airline, address: ${this.airlines[accounts[i]]}\n${e.message}`)
            }
            try {
                this.isRegistered = await this.flightSuretyApp.methods.isAirlineRegistered(accounts[i]).call({ from: this.owner});
            } catch (e) {
                console.log(`Error now calling isAirlineRegistered 1, address: ${accounts[i]}\n${e.message}`)
            }
            
            console.log("this.isRegistered=" + this.isRegistered);

            try {
                this.airline = await this.flightSuretyApp.methods.getAirline(accounts[i]).call();
                console.log("Airline " + this.airline.name + "-" + this.airline.airlineState + " isValue=" + this.airline.isValue);
            } catch (e) {
                console.log(`Error calling this, address: ${accounts[i]}\n${e.message}`)
            }


            // Airlines fund the registration fee
            // let payment = new BigNumber(this.web3.utils.toWei('10', "ether"));
            // await this.flightSuretyApp.methods.fundAirlineRegistration().send({
            //     from: accounts[i],
            //     value: payment,
            //     gas: 1500000
            // });

            // Register flights
            // try {
            //     this.isRegistered = await this.flightSuretyApp.methods.registerFlight(this.flights[this.flightNames[i]].name, this.flights[this.flightNames[i]].departure)
            //     .send({from: this.airlines[i], gas: 1500000});
            // } catch (e) {
            //     console.log(`Error calling isAirlineRegistered 2, address: ${this.airlines[i]}\n${e.message}`)
            // }

        }
        try {
            this.registeredAirlines = await this.flightSuretyApp.methods.getRegisteredAirlines().call();
            console.log("this.registeredAirlines " + this.registeredAirlines);
        } catch (e) {
            console.log(`Error calling getRegisteredAirlines  error=\n${e.message}`)
        }


        callback();
    }

    isOperational(callback) {
       let self = this;
       self.flightSuretyApp.methods
            .isOperational()
            .call({ from: self.owner}, callback);
    }

    fetchFlightStatus(airline,flight,timestamp, callback) {
        let self = this;
        let payload = {
            airline: airline,//self.airlines[0],
            flight: flight,
            ts: timestamp//Math.floor(Date.now() / 1000)
        } 
        //console.log("airline:" + self.airlines[0]) ;
        self.flightSuretyApp.methods
            .fetchFlightStatus(payload.airline, payload.flight, payload.ts)
            .send({ from: self.owner}, (error, result) => {
                callback(error, result);
            });
    }

    sendFunds(airline,funds,callback){
        let self = this;    
        const fundstosend = self.web3.utils.toWei(funds, "ether");  
        console.log(fundstosend) ; 
        self.flightSuretyApp.methods.fundAirlineRegistration()
        .send({ from: airline.toString(),value: fundstosend}, (error, result) => {
            callback(error, result);
        });
    }

    purchaseInsurance(airline,flight,passenger,funds_ether,timestamp,callback){
        let self = this;   
        console.log("airline" + airline) ;
        const fundstosend1 = self.web3.utils.toWei(funds_ether, "ether");  
        console.log(fundstosend1) ; 
        //console.log("passenger buy:" + )
        let ts = timestamp;//1553367808;
        console.log("contract: purchaseInsurance airline=" + airline + " flight=" + flight + " ts=" + ts);
        self.flightSuretyApp.methods.purchaseFlightInsurance(airline.toString(),flight.toString(),ts)
        .send({ from: passenger.toString(),value: fundstosend1,gas: 1000000}, (error, result) => {
            callback(error, result);
        });
      
    }

    purchaseFlightInsurance(flightName, amount, callback){
        let self = this;
       
        this.flightSuretyApp.methods
        .purchaseFlightInsurance(
            self.passengers[0],
            self.flights[flightName].airlineAddress,
            self.flights[flightName].name,
            self.flights[flightName].departure
        )
        .send({
            from: self.passengers[0],
            value: self.web3.utils.toWei(amount, "ether"),
            gass: 1500000,
        }, (err, res) => callback(err, {flight: self.flights[flightName], ticket: ticketNumber}));
        
    }

    withdrawCredit(flightName, callback) {
        let self = this;
        
        this.flightSuretyApp.methods
        .withdrawCredit(
            self.flights[flightName].airlineAddress,
            self.flights[flightName].name,
            self.flights[flightName].departure
        )
        .send({
            from: self.passengers[0],
            gass: 1500000,
        }, (err, res) => callback(err, {flight: self.flights[flightName]}));
    }
    
    withdrawFunds(passenger,funds_ether,callback){
        let self = this;   
       
        const fundstowithdraw = self.web3.utils.toWei(funds_ether, "ether");       
        self.flightSuretyApp.methods.withdrawFunds(fundstowithdraw)
        .send({ from: passenger.toString()}, (error, result) => {
            callback(error, result);
        });
      
    }

    getBalance(passenger,callback){
        let self = this;
        self.flightSuretyApp.methods.getBalance().call({ from: passenger}, (error, result) => {
            callback(error,result);
        });
    }

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
