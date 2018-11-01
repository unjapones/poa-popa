const ProofOfPhysicalAddressClaimHolder = artifacts.require('ProofOfPhysicalAddressClaimHolder');

// Fractalblockchain's "KeyHolder.sol" adds the corresponding key on the constructor method,
// so if the contract code implementing ERC725 changes (i.e. no longer use Fractalblockchain's
// code), we might have to update this test.
const signerPublicAddress = web3.eth.accounts[0];

contract('ProofOfPhysicalAddressClaimHolder', () => {

    describe('ERC-725 identity/claim verification method "keyHasPurpose"', () => {
        it('Should should return true when given the "keccak256 hash of the signer public address" (key) and purpose "3" (CLAIM)', async () => {
            const contract = await ProofOfPhysicalAddressClaimHolder.deployed();
            const hashedAddress = web3.sha3(signerPublicAddress, { encoding: 'hex' });
            const result = await contract.keyHasPurpose(hashedAddress, 3);
            assert.equal(result , true);
        });
    });

});
