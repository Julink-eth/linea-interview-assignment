// SPDX-License-Identifier: MIT
pragma solidity 0.8.25;

/**
 * @title Example contract to claim a token airdrop based on a merkle tree root
 * @author Julien Fontanel
 */
contract ClaimableAirdrop {
    /// @dev merkleRoot of the Merkle tree used to verify a leaf's data
    bytes32 public immutable merkleRoot;

    constructor(bytes32 _merkleRoot) {
        /// @dev merkleRoot is initialized in the constructor
        merkleRoot = _merkleRoot;
    }

    /**
     * @notice Verifies the leaf using the merkle tree proof for this leaf
     * @param proof The merkle proof used to verify the leaf
     * @param leaf The leaf to be verified
     */
    function verify(
        bytes32[] memory proof,
        bytes32 leaf
    ) public view returns (bool) {
        // Start with the hash of the leaf we want to verify
        bytes32 computedHash = leaf;
        // Iteration through the proof array
        for (uint256 i = 0; i < proof.length; i++) {
            bytes32 proofElement = proof[i];
            // We assume the same sorting of the Merkle tree based on the left/right hashes
            // Recompute the resulting hash of the left + right hashes
            if (computedHash <= proofElement) {
                computedHash = keccak256(
                    abi.encodePacked(computedHash, proofElement)
                );
            } else {
                computedHash = keccak256(
                    abi.encodePacked(proofElement, computedHash)
                );
            }
        }
        // After processing all the proof's elements, the last computed hash is supposed to be the root hash
        // If this is the case, the leaf has been verified and we return true otherwise we return false
        return computedHash == merkleRoot;
    }

    /**
     * @notice Check if the sender can claim the amount of tokens passed in parameter
     * @param proof The merkle proof used to verify the the amount
     * @param amount Amount to verify
     */
    function canClaimTokens(
        bytes32[] memory proof,
        uint256 amount
    ) public view returns (bool) {
        // Compute the leaf node corresponding to the data pair sender/amount
        bytes32 leaf = keccak256(abi.encodePacked(msg.sender, amount));
        // Verify this leaf using the proof
        return verify(proof, leaf);
    }

    // Actual claim function that will depend on canClaimTokens...
}
