pragma solidity ^0.5.0;

// It's important to avoid vulnerabilities due to numeric overflow bugs
// OpenZeppelin's SafeMath library, when used correctly, protects agains such bugs
// More info: https://www.nccgroup.trust/us/about-us/newsroom-and-events/blog/2018/november/smart-contract-insecurity-bad-arithmetic/

import "../node_modules/openzeppelin-solidity/contracts/math/SafeMath.sol";
import "./FlightSuretyData.sol";

/************************************************** */
/* FlightSurety Smart Contract                      */
/************************************************** */
contract FlightSuretyApp {
    using SafeMath for uint256; // Allow SafeMath functions to be called for all uint256 types (similar to "prototype" in Javascript)

    /********************************************************************************************/
    /*                                       DATA VARIABLES                                     */
    /********************************************************************************************/

    // Flight status codees
    uint8 private constant STATUS_CODE_UNKNOWN = 0;
    uint8 private constant STATUS_CODE_ON_TIME = 10;
    uint8 private constant STATUS_CODE_LATE_AIRLINE = 20;
    uint8 private constant STATUS_CODE_LATE_WEATHER = 30;
    uint8 private constant STATUS_CODE_LATE_TECHNICAL = 40;
    uint8 private constant STATUS_CODE_LATE_OTHER = 50;

    // Account used to deploy contract
    address private contractOwner;

   // airline registration cost
    uint airlineRegistrationFee = 0;

    // insurance payout percentage
    uint insurancePayoutPercentage = 0;


    struct Flight {
        address airline;
        string name;
        uint256 departure;
        bool isRegistered;
        uint8 statusCode;
        uint256 updatedTimestamp;
    }
    mapping(bytes32 => Flight) private flights;


    FlightSuretyData flightSuretyData;

    /********************************************************************************************/
    /*                                       EVENT DEFINITIONS                                  */
    /********************************************************************************************/
    event AirlineRegistered(address airlineAddress);
    event AirlineVotesRequired(address airlineAddress);
    event AirlineDeniedRegistration(address airlineAddress);
    event FlightInsurancePurchased(address airlineAddress, address passengerAddress, string flightName);


    /********************************************************************************************/
    /*                                       FUNCTION MODIFIERS                                 */
    /********************************************************************************************/

    // Modifiers help avoid duplication of code. They are typically used to validate something
    // before a function is allowed to be executed.

    /**
    * @dev Modifier that requires the "operational" boolean variable to be "true"
    *      This is used on all state changing functions to pause the contract in
    *      the event there is an issue that needs to be fixed
    */
    modifier requireIsOperational()
    {
         // Modify to call data contract's status
        require(true, "Contract is currently not operational");
        _;  // All modifiers require an "_" which indicates where the function body will be added
    }

    /**
    * @dev Modifier that requires the "ContractOwner" account to be the function caller
    */
    modifier requireContractOwner()
    {
        require(msg.sender == contractOwner, "Caller is not contract owner");
        _;
    }

   /**
    * @dev Modifier that requires the contract caller is authorized to call function
    */
    modifier requireCallerAuthorized
    {
        require(flightSuretyData.isCallerAuthorized(msg.sender) == true, "Contract Caller is not authorized to call this function");
        _;
    }

    /**
    * @dev Modifier that requires the airline is not registered
    */
    modifier requireAirlineNotRegistered(address airlineAddress)
    {
        require(!flightSuretyData.isAirlineRegistered(airlineAddress), "Airline has already registered");
        _;
    }

    /**
    * @dev Modifier that requires the airline is registered
    */
    modifier requireAirlineRegistered(address airlineAddress)
    {
        require(flightSuretyData.isAirlineRegistered(airlineAddress), "Airline has already registered");
        _;
    }


    /**
    * @dev Modifier that requires the airline is a member
    */
    modifier requireAirlineMember(address airlineAddress)
    {
        require(flightSuretyData.isAirlineMember(airlineAddress), "Airline is not a voting member");
        _;
    }

     /**
    * @dev Modifier that requires the flight is not registered
    */
    modifier requireFlightNotRegistered(bytes32 flightKey)
    {
        require(!flights[flightKey].isRegistered, "Flight has already been registered");
        _;
    }

   
    /********************************************************************************************/
    /*                                       CONSTRUCTOR                                        */
    /********************************************************************************************/

    /**
    * @dev Contract constructor
    *
    */
    constructor(address payable flightSuretyDataContractAddress)
        public
    {
        contractOwner = msg.sender;
        flightSuretyData = FlightSuretyData(flightSuretyDataContractAddress);
    }

    /********************************************************************************************/
    /*                                       UTILITY FUNCTIONS                                  */
    /********************************************************************************************/

    function isOperational()
        public
        pure
        returns(bool)
    {
        return true;  // Modify to call data contract's status
    }

    function isAirlineMember(address airlineAddress)
        external
        requireIsOperational
        requireCallerAuthorized
        returns (bool)
    {
        return flightSuretyData.isAirlineMember(airlineAddress);
    }

    /**
    * @dev Set Airline Registration Cost
    *
    * Have the contract owner set the cost of the airline registration
    */
    function setAirlineRegistrationCost(uint registrationCost)
        external
        requireIsOperational
        requireContractOwner
    {
        airlineRegistrationFee = REGISTRATION_FEE;
    }

    /* @dev Set Insurance Percentage Amount
    *
    * 
    */
    function setInsurancePercentageAmount(uint percentAmount)
        external
        requireIsOperational
        requireContractOwner
    {
        insurancePayoutPercentage = percentAmount;
    }

    function airlineRegistrationCost()
        external
        requireIsOperational
        requireContractOwner
        returns (uint)
    {
        return airlineRegistrationFee;
    }

    function setAuthorizedAddress(address contractCallerAddress)
                            external
                            requireIsOperational
                            requireContractOwner
    {
        flightSuretyData.setAuthorizedAddress(contractCallerAddress);
    }
    /********************************************************************************************/
    /*                                     SMART CONTRACT FUNCTIONS                             */
    /********************************************************************************************/

    /**
    * @dev Add an airline to the registration queue
    *
    */
    function registerAirline(address airlineAddress, string memory  airlineName)
        public
        requireIsOperational
        requireAirlineNotRegistered(airlineAddress)
        returns(bool success, uint256 votes)
    {
        require(flightSuretyData.isAirlineMember(msg.sender), "Airline must pay registration fee to register other airlines");

        if (flightSuretyData.airlineMemberCount() <= 4) {
            flightSuretyData.registerAirline(airlineAddress, airlineName, FlightSuretyData.AirlineState.Registered);
            emit AirlineRegistered(airlineAddress);

        } else {
            // Airlines must vote to register additional airlines over 4
            // Multi-party consensus required of 50% of member airline to approve
            flightSuretyData.registerAirline(airlineAddress, airlineName, FlightSuretyData.AirlineState.VotesRequired);
            emit AirlineVotesRequired(airlineAddress);
       }
        return (success, 0);
    }

    /**
    * @dev Add an airline to the registration queue
    *
    */
    function voteByConsensus(address airlineAddress, bool vote)
        public
        requireIsOperational
        requireCallerAuthorized
        requireAirlineRegistered(airlineAddress)
        returns(FlightSuretyData.AirlineState registrationState)
    {

        // Airlines must vote to register additional airlines over 4
        // Multi-party consensus required of 50% of member airline to approve
        uint airlineMemberCnt = flightSuretyData.airlineMemberCount();
        uint votesRequired = airlineMemberCnt / (insurancePayoutPercentage / 100);

        (uint yesTotalVotes, uint totalVotes) = flightSuretyData.voteOnAirline(airlineAddress, vote);

        if (yesTotalVotes >= votesRequired) {
            flightSuretyData.setAirlineState(airlineAddress, FlightSuretyData.AirlineState.Registered);
            emit AirlineRegistered(airlineAddress);
        } else {
            uint availableVotes = airlineMemberCnt - totalVotes;
            if (availableVotes < (votesRequired - yesTotalVotes)) {
                flightSuretyData.setAirlineState(airlineAddress, flightSuretyData.DeniedRegistration);
                emit AirlineDeniedRegistration(airlineAddress);
            }
        }

        return registrationState;
    }

    function fundAirlineRegistration()
        external
        payable
        requireIsOperational
        requireCallerAuthorized
        requireAirlineRegistered(msg.sender)
    {
        address airlineAddress = msg.sender;

        flightSuretyData.airlinePayFund.value(msg.value)(msg.sender);

    }

    function registerFlight(string calldata flightName, uint256 scheduledDeparture)
        external
        requireIsOperational
    {
        bytes32 flightKey = getFlightKey(msg.sender, flightName, scheduledDeparture);

        require(!flights[flightKey].isRegistered, "Flight has already been registered");

        flights[flightKey] = Flight({airline: msg.sender,
                                    name: flightName,
                                    departure: scheduledDeparture,
                                    isRegistered: true,
                                    statusCode: STATUS_CODE_UNKNOWN,
                                    updatedTimestamp: now});
    }

    function getAirline(address airlineAddress)
        external
        view
        requireIsOperational
        returns(
            string memory name,
            uint registerAmount,
            FlightSuretyData.AirlineState airlineState,
            bool isValue
        )
    {
        return flightSuretyData.airlineInfo(airlineAddress);
    }

   /**
    * @dev Called after oracle has updated flight status
    *
    */
    function processFlightStatus
                                (
                                    address airline,
                                    string memory flight,
                                    uint256 timestamp,
                                    uint8 statusCode
                                )
        internal
    {
        bytes32 flightKey = getFlightKey(airline, flight, timestamp);
        flight[flightKey].statusCode = statusCode;

        uint credit = 1.5;

        if (statusCode == STATUS_CODE_LATE_AIRLINE) {
            flightSuretyData.creditInsurees(flightKey, credit);
        }
    }


    // Generate a request for oracles to fetch flight information
    function fetchFlightStatus
                        (
                            address airline,
                            string calldata flightName,
                            uint256 timestamp
                        )
                        external
                        requireIsOperational
    {
        uint8 index = getRandomIndex(msg.sender);

        // Generate a unique key for storing the request
        bytes32 key = keccak256(abi.encodePacked(index, airline, flightName, timestamp));
        oracleResponses[key] = ResponseInfo({
                                                requester: msg.sender,
                                                isOpen: true
                                            });

        emit OracleRequest(index, airline, flightName, timestamp);
    }

    function purchaseFlightInsurance
    (
        address passengerAddress,
        address airlineAddress,
        string calldata flightName,
        uint256 departureTime,
        uint insuranceCost
    )
        external
        payable
        requireIsOperational
    {
        bytes32 flightKey = getFlightKey(airlineAddress, flightName, departureTime);

        require(flights[flightKey].isRegistered, "Flight has not been registered");

        flightSuretyData.buyFlightInsurance.value(msg.value)(
            passengerAddress,
            airlineAddress,
            flightName,
            departureTime,
            insuranceCost
        );

        emit FlightInsurancePurchased(airlineAddress, passengerAddress, flightName);
    }
// region ORACLE MANAGEMENT

    // Incremented to add pseudo-randomness at various points
    uint8 private nonce = 0;

    // Fee to be paid when registering oracle
    uint256 public constant REGISTRATION_FEE = 1 ether;

    // Number of oracles that must respond for valid status
    uint256 private constant MIN_RESPONSES = 3;


    struct Oracle {
        bool isRegistered;
        uint8[3] indexes;
    }

    // Track all registered oracles
    mapping(address => Oracle) private oracles;

    // Model for responses from oracles
    struct ResponseInfo {
        address requester;                              // Account that requested status
        bool isOpen;                                    // If open, oracle responses are accepted
        mapping(uint8 => address[]) responses;          // Mapping key is the status code reported
                                                        // This lets us group responses and identify
                                                        // the response that majority of the oracles
    }

    // Track all oracle responses
    // Key = hash(index, flight, timestamp)
    mapping(bytes32 => ResponseInfo) private oracleResponses;

    // Event fired each time an oracle submits a response
    event FlightStatusInfo(address airline, string flight, uint256 timestamp, uint8 status);

    event OracleReport(address airline, string flight, uint256 timestamp, uint8 status);

    // Event fired when flight status request is submitted
    // Oracles track this and if they have a matching index
    // they fetch data and submit a response
    event OracleRequest(uint8 index, address airline, string flight, uint256 timestamp);


    // Register an oracle with the contract
    function registerOracle()
        external
        payable
       requireIsOperational
    {
        // Require registration fee
        require(msg.value >= REGISTRATION_FEE, "Registration fee is required");

        uint8[3] memory indexes = generateIndexes(msg.sender);

        address flightSuretyDataContract = address(uint160(address(flightSuretyData)));
        flightSuretyDataContract.transfer(msg.value);

        oracles[msg.sender] = Oracle({
                                        isRegistered: true,
                                        indexes: indexes
                                    });
    }

    function getMyIndexes
                            (
                            )
                            external
                             view
                           returns(uint8[3] memory)
    {
        require(oracles[msg.sender].isRegistered, "Not registered as an oracle");

        return oracles[msg.sender].indexes;
    }

    // Called by oracle when a response is available to an outstanding request
    // For the response to be accepted, there must be a pending request that is open
    // and matches one of the three Indexes randomly assigned to the oracle at the
    // time of registration (i.e. uninvited oracles are not welcome)
    function submitOracleResponse
                        (
                            uint8 index,
                            address airline,
                            string calldata flight,
                            uint256 timestamp,
                            uint8 statusCode
                        )
                        external
    {
        require(
            (oracles[msg.sender].indexes[0] == index) || 
            (oracles[msg.sender].indexes[1] == index) || 
            (oracles[msg.sender].indexes[2] == index),
            "Index does not match oracle request");


        bytes32 key = keccak256(abi.encodePacked(index, airline, flight, timestamp)); 
        require(oracleResponses[key].isOpen, "Flight or timestamp do not match oracle request");

        oracleResponses[key].responses[statusCode].push(msg.sender);

        // Information isn't considered verified until at least MIN_RESPONSES
        // oracles respond with the *** same *** information
        emit OracleReport(airline, flight, timestamp, statusCode);
        if (oracleResponses[key].responses[statusCode].length >= MIN_RESPONSES) {

            emit FlightStatusInfo(airline, flight, timestamp, statusCode);

            // Handle flight status as appropriate
            processFlightStatus(airline, flight, timestamp, statusCode);
        }
    }

    function getFlightKey
                        (
                            address airline,
                            string memory flight,
                            uint256 timestamp
                        )
                        pure
                        internal
                        returns(bytes32) 
    {
        return keccak256(abi.encodePacked(airline, flight, timestamp));
    }

    // Returns array of three non-duplicating integers from 0-9
    function generateIndexes
                            (                       
                                address account         
                            )
                            internal
                            returns(uint8[3] memory)
    {
        uint8[3] memory indexes;
        indexes[0] = getRandomIndex(account);
        
        indexes[1] = indexes[0];
        while(indexes[1] == indexes[0]) {
            indexes[1] = getRandomIndex(account);
        }

        indexes[2] = indexes[1];
        while((indexes[2] == indexes[0]) || (indexes[2] == indexes[1])) {
            indexes[2] = getRandomIndex(account);
        }

        return indexes;
    }

    // Returns array of three non-duplicating integers from 0-9
    function getRandomIndex
                            (
                                address account
                            )
                            internal
                            returns (uint8)
    {
        uint8 maxValue = 10;

        // Pseudo random number...the incrementing nonce adds variation
        uint8 random = uint8(uint256(keccak256(abi.encodePacked(blockhash(block.number - nonce++), account))) % maxValue);

        if (nonce > 250) {
            nonce = 0;  // Can only fetch blockhashes for last 256 blocks so we adapt
        }

        return random;
    }

// endregion

}   
