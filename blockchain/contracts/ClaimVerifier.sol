pragma solidity 0.4.24;

import "./ClaimHolder.sol";


contract ClaimVerifier {

    event ClaimValid(address _trustedClaimHolderAddress, address _otherIdentityAddress, uint256 claimType);
    event ClaimInvalid(address _trustedClaimHolderAddress, address _otherIdentityAddress, uint256 claimType);

    function checkClaim(address _trustedClaimHolderAddress, address _otherIdentityAddress, uint256 claimType)
        public
        returns (bool claimValid)
    {
        ClaimHolder _identity = ClaimHolder(_otherIdentityAddress);
        if (claimIsValid(_trustedClaimHolderAddress, _identity, claimType)) {
            // emit ClaimValid(_trustedClaimHolderAddress, _otherIdentityAddress, claimType);
            return true;
        } else {
            emit ClaimInvalid(_trustedClaimHolderAddress, _otherIdentityAddress, claimType);
            return false;
        }
    }

    function claimIsValid(address _trustedClaimHolderAddress, ClaimHolder _identity, uint256 claimType)
        public
        constant
        returns (bool claimValid)
    {
        uint256 foundClaimType;
        uint256 scheme;
        address issuer;
        bytes memory sig;
        bytes memory data;

        ClaimHolder trustedClaimHolder = ClaimHolder(_trustedClaimHolderAddress);

        // Construct claimId (identifier + claim type) and get the claim from identity
        bytes32 claimId = keccak256(trustedClaimHolder, claimType);
        ( foundClaimType, scheme, issuer, sig, data, ) = _identity.getClaim(claimId);

        // Recover the signer address by hashing the identity address, the claim type, and data
        bytes32 dataHash = keccak256(_identity, claimType, data);
        bytes32 prefixedHash = keccak256("\x19Ethereum Signed Message:\n32", dataHash);
        address recovered = getRecoveredAddress(sig, prefixedHash);

        // Calculate the "key" (keccak256 of the signer address) using the recovered signer address
        // and check that the trusted claim holder has the key with the corresponding purpose (3)
        bytes32 hashedAddr = keccak256(recovered);
        return trustedClaimHolder.keyHasPurpose(hashedAddr, 3);
    }

    function getRecoveredAddress(bytes sig, bytes32 dataHash)
        public
        view
        returns (address addr)
    {
        bytes32 ra;
        bytes32 sa;
        uint8 va;

        // Check the signature length
        if (sig.length != 65) {
            return (0);
        }

        // Divide the signature in r, s and v variables
        assembly {
            ra := mload(add(sig, 32))
            sa := mload(add(sig, 64))
            va := byte(0, mload(add(sig, 96)))
        }

        if (va < 27) {
            va += 27;
        }

        address recoveredAddress = ecrecover(dataHash, va, ra, sa);

        return (recoveredAddress);
    }

}
