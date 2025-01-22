// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;
import {Script, console} from "forge-std/Script.sol";
import {Airdrop} from "../src/Airdrop.sol";
import {MockToken} from "../src/mocks/MockToken.sol";

contract DeployAirdrop is Script {
    bytes32 private _merkleRoot =
        0x91673d887a585a027b96f72ced7bdc3c67fd0725fbd74fe1c8e1cba3b6419681;
    uint256 private _amount = 2500000 * 4 * 1e18;

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
