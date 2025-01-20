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
        0x861d0a93c670f720d1a5c8f5115256bc24af1ef30806723ebb4080a9c4f67da6;
    bytes32 PROOF_2 =
        0xd65d69953c587119b1322acd3c1c33c17d3c974779ce01557e3e2d80dd35c3ff;
    bytes32 PROOF_3 =
        0xbe57b94b9436f8262e32c2b0b5192a73d2c35249f40d9c8da40f6ed5704a9a0b;
    bytes32 PROOF_4 =
        0x3afdce198a34f39f114f7f427c224022480b23fe2cf42d7dff2d360704ec960d;
    bytes32 PROOF_5 =
        0x1adc11ebe608cd68f9448fa1bf3697658ba03a0f0644ca7ab4d269c8776c752f;
    bytes32 PROOF_6 =
        0x2ba4dab4a872577d7a40bfe1a74ce078ec0105bbab0115ed01d86b14c4c2b529;
    bytes32[] internal PROOF = [
        PROOF_1,
        ZERO_PROOF,
        PROOF_2,
        ZERO_PROOF,
        PROOF_3,
        ZERO_PROOF,
        ZERO_PROOF,
        ZERO_PROOF,
        PROOF_4,
        ZERO_PROOF,
        ZERO_PROOF,
        ZERO_PROOF,
        PROOF_5,
        ZERO_PROOF,
        ZERO_PROOF,
        PROOF_6
    ];
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
