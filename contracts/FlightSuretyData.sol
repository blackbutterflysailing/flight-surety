pragma solidity ^0.4.25;

import "../node_modules/openzeppelin-solidity/contracts/math/SafeMath.sol";

contract FlightSuretyData {
    using SafeMath for uint256, uint;

    /********************************************************************************************/
    /*                                       DATA VARIABLES                                     */
    /********************************************************************************************/
    
    // Account used to deploy contract
    address private contractOwner;

    // Blocks all state changes throughout the contract if false
    bool private operational = true;

    // Addresses that can call this contract
    mapping(address => bool) private  authorizedContractCaller;


    // fund balance
    uint256 fundBalance = 0;

    // Airline information
    enum AirlineState {
        VotesRequired,
        Registered,
        DeniedRegistration,
        Funded
    }

    struct Airline {
        string name;
        uint registerAmount;
        AirlineState airlineState;
        Vote vote;
        bool isValue;
    }
 
    struct Vote {
        mapping(address => bool) votes;
        uint8 yesTotal;
        uint8 total;
    }

    enum InsuranceState {
        Purchased,
        Active,
        Expired,
        PayoutAvailable,
        PayoutDisbursed
    }

    struct Insurance {
        address buyer;
        address airline;
        uint value;
        bool isValue;
        InsuranceState insuranceState;
    }

    // member airline count
    uint memberAirlineCount = 0;

    mapping (address => Airline) internal airlines;
    mapping (byte32 =>  []byte32) internal flightInsurances;
    mapping (byte32 => Insurance) internal passengerInsurances;
    /********************************************************************************************/
    /*                                       EVENT DEFINITIONS                                  */
    /********************************************************************************************/
    event AirlinePayedFund(address airlineAddress, uint amount);

    /**
    * @dev Constructor
    *      The deploying account becomes contractOwner
    */
    constructor() public payable
    {
        contractOwner = msg.sender;

        // Register airline
        registerAirline(msg.sender, "American Flyer", AirlineState.Registered);
    }

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
        require(operational, "Contract is currently not operational");
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
        require(authorizedContractCaller[msg.sender] == true, "Contract Caller is not authorized to call this function");
        _;
    }

    /********************************************************************************************/
    /*                                       UTILITY FUNCTIONS                                  */
    /********************************************************************************************/

    /**
    * @dev Get operating status of contract
    *
    * @return A bool that is the current operating status
    */
    function isOperational()
                            public
                            view
                            returns(bool)
    {
        return operational;
    }


    /**
    * @dev Sets contract operations on/off
    *
    * When operational mode is disabled, all write transactions except for this one will fail
    */
    function setOperatingStatus(bool mode)
                            external
                            requireContractOwner
    {
        operational = mode;
    }

   /**
    * @dev Set Authorized Contract Caller
    * @param  contractCaller is an Ethereum contract address
    * When contract caller is authorized, then it will have access to designated methods
    */
    function authorizeCaller(address contractCaller)
                            external
                            requireIsOperational
                            requireContractOwner
    {
        authorizedContractCaller[contractCaller] = true;
    }

    /**
    * @dev Set Authorized Contract Caller
    * @param  contractAddress is an Ethereum contract address
    * @return Boolean authorized return true, otherwise return false
    * When contract caller is authorized, then it will have access to designated methods
    */
    function isCallerAuthorized(address contractAddress)
        external
        view
        requireIsOperational
        returns(bool)
    {
        return authorizedContractCaller[contractAddress];
    }

    function isAirlineRegistered(address airlineAddress)
        external
        view
        requireIsOperational
        returns(bool)
    {
        return airlines[airlineAddress].isValue == true;
    }
    /********************************************************************************************/
    /*                                     SMART CONTRACT FUNCTIONS                             */
    /********************************************************************************************/

    function registerAirline(address airlineAddress, string airlineName, AirlineState airlineStatus)
        external
        requireIsOperational
        requireCallerAuthorized
    {
        airlines[airlineAddress] = AirLine({name: airlineName, registerAmount: 0, airlineState: airlineStatus, vote: Vote(0), isValue: true});
    }

    function airlinePayFund()
        external
        payable
        requireIsOperational
        requireCallerAuthorized
    {
        emit AirlinePayedFund(msg.sender);
        airlines[msg.sender].registerAmount = airlines[msg.sender].registerAmount + msg.value;
        memberAirlineCount++;
    }

    function isAirlineRegistered(address airlineAddress)
        external
        requireIsOperational
        requireCallerAuthorized
        returns (bool)
    {
        return airlines[airlineAddress].isValue;
    }

    function isAirlineMember(address airlineAddress)
        external
        requireIsOperational
        requireCallerAuthorized
        returns (bool)
    {
        return airlines[airlineAddress].airlineState == AirlineState.Funded;
    }

    function setAirlineState(address airlineAddress, AirlineState airlineState)
        external
        requireIsOperational
        requireCallerAuthorized
    {
        airlines[airlineAddress].airlineState = airlineState;
    }

    function airlineState(address airlineAddress) 
        external
        requireIsOperational
        requireCallerAuthorized
    {
        return airlines[airlineAddress].airlineState;
    }
    
    function airlineMemberCount() 
        external
        requireIsOperational
        requireCallerAuthorized
        returns (uint)
    {
        return memberAirlineCount;
    }

    function airlineInfo(address airlineAddress)
        external
        requireIsOperational
        returns (
            string memory name,
            uint registerAmount,
            AirlineState airlineState,
            bool isValue
        )
    {
        Airline airline = airlines[airlineAddress];
        return(
            airline.name,
            airline.registerAmount,
            airline.airlineState,
            airline.isValue
        )
    }
    function voteOnAirline(address airlineAddress, bool vote)
        external
        requireIsOperational
        requireCallerAuthorized
        returns (int, int)
    {     
        airlines[airlineAddress].vote.total += 1;

        if (vote) {
            airlines[airlineAddress].yesTotal += 1;
        }

        return airlines[airlineAddress].vote.yesTotal, airlines[airlineAddress].total;
    }

   /**
    * @dev Buy insurance for a flight
    *
    */
    function buyFlightInsurance(address passengerAddress, address airlineAddress, string flightName, uint256 departureTime, uint insuranceCost)
        external
        payable
        requireIsOperational
       requireCallerAuthorized
    {
        byte32 insuranceKey = getInsuranceKey(passengerAddress, flightKey);
        require(passengerInsurances[insuranceKey].isValue == true, "Passenger has already purchased insurance for this flight.");

        flightInsurances[flightKey].push(insuranceKey);
        passengerInsurances[insuranceKey] = Insurance({
                                                    buyer: passengerAddress,
                                                    airline: airlineAddress,
                                                    value: insuranceCost,
                                                    isValue: true,
                                                    insuranceState: Insurance.Purchased});
    }

    /**
     *  @dev Credits payouts to insurees
    */
    function creditInsurees(byte32 flightKey, uint payoutRate)
        external
        requireIsOperational
        requireCallerAuthorized
    {
        bytes32[] insuranceKeys = flightInsurances[flightKey];

        for (uint i = 0; i < insuranceKeys.length; i++) {
            Insurance storage insurance = passengerInsurances[insuranceKeys[i]];

            if (insurance.state == InsuranceState.Purchased)
                insurance.value.mul(payoutRate);
                insurance.state = InsuranceState.PayoutAvailable;
            } else (
                insurance.state = InsuranceState.Expired;
            )
        }
    }
    

    /**
     *  @dev Transfers eligible payout funds to insuree
     *
    */
    function payoutInsuree(byte32 insuranceKey)
        external
        requireIsOperational
        requireCallerAuthorized
    {
        // Retrieve insurance of the buyer
        Insurance insurance = passengerInsurances[insuranceKey];

        // Retrieve buy address from insurance
        address payable buyer = address(uint160(insurance.buyer));
        uint payoutValue =  insurance.value;
        insurance.value = 0;
        buyer.transfer(payoutValue);
        
    }

    function getFlightKey
                        (
                            address airline,
                            string memory flight,
                            uint256 timestamp
                        )
                            internal
                            pure
                            returns(bytes32)
    {
        return keccak256(abi.encodePacked(airline, flight, timestamp));
    }

    function getInsuranceKey(address passenger, byte32 flightKey)
        internal
        pure
        returns(bytes32)
    {
        return keccak256(abi.encodePacked(passenger, flightKey));
    }


    /**
    * @dev Fallback function for funding smart contract.
    *
    */
    function()
        external
        payable
    {
        fund();
    }


}

