// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test, console} from "forge-std/Test.sol";
import {Airdrop} from "../src/Airdrop.sol";
import {DeployAirdrop} from "../script/DeployAirdrop.s.sol";
import {MockToken} from "../src/mocks/MockToken.sol";

contract MerkleAirdropTest is Test {
    Airdrop public airdrop;
    MockToken public token;
    uint256 public amount = 25 * 1e18;
    bytes32 ZERO_PROOF =
        0x0000000000000000000000000000000000000000000000000000000000000000;
    bytes32 PROOF_1 =
        0xaa5d581231e596618465a56aa0f5870ba6e20785fe436d5bfb82b08662ccc7c4;
    bytes32[] public PROOF = [ZERO_PROOF, ZERO_PROOF, PROOF_1];
    address user;
    uint256 userPk;

    function setUp() public {
        DeployAirdrop deploy = new DeployAirdrop();
        (airdrop, token) = deploy.deployAirdrop();
        (user, userPk) = makeAddrAndKey("User");
    }

    function testUserClaim() public {
        uint256 startingBalance = token.balanceOf(user);
        console.log("Starting Balance: %s", startingBalance);

        vm.prank(user);
        airdrop.claimERC20(address(token), user, amount, PROOF);

        uint256 endingBalance = token.balanceOf(user);
        console.log("Ending Balance: %s", endingBalance);

        assertEq(endingBalance - startingBalance, amount);
    }

    function testUserClaimTwice() public {
        testUserClaim();
        vm.prank(user);
        vm.expectRevert();
        airdrop.claimERC20(address(token), user, amount, PROOF);
    }
}
