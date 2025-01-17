// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;
import {Script, console} from "forge-std/Script.sol";
import {Airdrop} from "../src/Airdrop.sol";
import {MockToken} from "../src/mocks/MockToken.sol";

contract DeployAirdrop is Script {
    bytes32 private _merkleRoot =
        0xe7942661b2b26bfba2ec6c09d56b3dbf2e3a8fc6fba415d3a60baabe01310b6b;
    uint256 private _amount = 25 * 4 * 1e18;

    function deployAirdrop() public returns (Airdrop, MockToken) {
        vm.startBroadcast();
        MockToken token = new MockToken();
        Airdrop airdrop = new Airdrop();
        airdrop.setMerkleRoot(address(token), _merkleRoot, true);
        token.mint(airdrop.owner(), _amount);
        token.approve(address(airdrop), _amount);
        console.log("Merkle Airdrop deployed at %s", address(airdrop));
        vm.stopBroadcast();
        return (airdrop, token);
    }

    function run() public {
        deployAirdrop();
    }
}
