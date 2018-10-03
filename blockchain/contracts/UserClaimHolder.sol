pragma solidity 0.4.24;

import "./ClaimHolder.sol";


contract UserClaimHolder is ClaimHolder {
    address public owner;
    address public signer;

    constructor() public {
        owner = msg.sender;
        signer = owner;
    }

}
