var POPA = artifacts.require('ProofOfPhysicalAddress');
var PhysicalAddressClaim = artifacts.require('PhysicalAddressClaim');
var EthereumClaimsRegistry = artifacts.require('EthereumClaimsRegistry');
var TestERC20 = artifacts.require('TestERC20');
var POPAClaimHolder = artifacts.require('ProofOfPhysicalAddressClaimHolder');
var UserClaimHolder = artifacts.require('UserClaimHolder');

module.exports = function(deployer, network, accounts) {
    return deployer.then(async () => {
        await deployer.deploy(PhysicalAddressClaim);
        await deployer.link(PhysicalAddressClaim, POPA);

        let ethereumClaimsRegistryAddress = null;
        if (network === 'development' || network === 'test' || network === 'coverage') {
            await deployer.deploy(EthereumClaimsRegistry);
            let ethereumClaimsRegistry = await EthereumClaimsRegistry.deployed();
            ethereumClaimsRegistryAddress = ethereumClaimsRegistry.address;
        } else {
            ethereumClaimsRegistryAddress = '0xec9cd1a18CA13E8703bdbCc68419E0d08AEb3528';
        }

        if (network === 'test' || network === 'coverage') {
            await deployer.deploy(TestERC20);
        }

        const gas = network === 'coverage' ? '0xfffffffffff' : '6000000';

        await deployer.deploy(POPA, ethereumClaimsRegistryAddress, { gas });

        ////////////////////////////////////////////////////////////////////////
        // Deploy PoPA's identity/claim issuer contract
        ////////////////////////////////////////////////////////////////////////
        await deployer.deploy(POPAClaimHolder);

        ////////////////////////////////////////////////////////////////////////
        // Owner of the UserClaimHolder identity contract will be accounts[4]
        // account[4] address is 0x139f3074566a93a5ef2eabff37e9066dbda80f19
        ////////////////////////////////////////////////////////////////////////
        // When the address of the corresponding identity contract is requested,
        // use the corresponding address from the terminal output.
        // Also, use "truffle deploy --network development" for the deployment.
        await deployer.deploy(UserClaimHolder, { from: accounts[4] });
    });
};
