import { ethers } from "ethers";

/**
 * Class to build a Merkle tree for data of pair address,amount
 * Has functions to get the root hash of the Merkle tree and to get a proof for a specific leaf index
 */
export class MerkleTree {
  // Leaves are the initial hashes of the actual data
  leaves: string[];
  // Layers are the respresentation of all the levels of the tree, contains all the hashes
  layers: string[][];

  constructor(data: (string | number)[][]) {
    // Get the hashes of each data to create the leaf nodes
    this.leaves = data.map(MerkleTree.hashData);
    // Initialize the first layer with the leaf nodes
    this.layers = [this.leaves];
    // Build the tree from the leaf nodes
    this.buildTree();
  }

  static hashData(data: (string | number)[]): string {
    // solidityPackedKeccak256 is the typescript equivalent of the solidity keccak256(abi.encodePacked(dataToPacked))
    // Creates the hash of the data passed from the pair address/amount
    const hash = ethers.solidityPackedKeccak256(["address", "uint256"], data);
    return hash;
  }

  /**
   * Compute the hash of the child nodes, compute it using left first or right first depending on the nodes's hash values
   * The same logic has to be used when checking the proof
   * @param left hash of the left node
   * @param right hash of the right node
   * @returns the hash of the combined hashes
   */
  combineHashes(left: string, right: string): string {
    if (left <= right) {
      return ethers.solidityPackedKeccak256(
        ["bytes32", "bytes32"],
        [left, right]
      );
    } else {
      return ethers.solidityPackedKeccak256(
        ["bytes32", "bytes32"],
        [right, left]
      );
    }
  }

  /**
   * Build the Merkle tree using the initial leaf nodes
   */
  buildTree() {
    let currentLayer = this.leaves;
    // Build each layer until the last layer only contains the hash of the root node
    while (currentLayer.length > 1) {
      const nextLayer: string[] = [];
      for (let i = 0; i < currentLayer.length; i += 2) {
        const left = currentLayer[i];
        // If there is an odd number of nodes, we duplicate the last one to calculate the hash
        const right = currentLayer[i + 1] || left;
        nextLayer.push(this.combineHashes(left, right));
      }
      this.layers.push(nextLayer);
      currentLayer = nextLayer;
    }
  }

  /**
   * Returns the root hash of the Merkle tree (The hash contained in the single node if the last layer)
   * @returns the root hash
   */
  getRoot(): string {
    return this.layers[this.layers.length - 1][0];
  }

  /**
   * Build a Merkle proof for a leaf node's index
   * Iterate through all the layers and keep only the hashes found in the tree path of the given index
   * @param index of the leaf node
   * @returns The Merkle Proof
   */
  getProof(index: number): string[] {
    let proof: string[] = [];
    // Iterate through all the layers
    for (let i = 0; i < this.layers.length - 1; i++) {
      const layer = this.layers[i];
      const isRightNode = index % 2;
      // If the current index is even it's a left node otherwise it's a right node
      // We keep the hash of the node adjacent to the index
      const pairIndex = isRightNode ? index - 1 : index + 1;
      if (pairIndex < layer.length) {
        proof.push(layer[pairIndex]);
      } else if (pairIndex === layer.length) {
        // This is the last node but the number of nodes is odd so we duplicate it
        proof.push(layer[index]);
      }
      // We divide the index by 2 at each iteration since we create one single hash for 2 nodes from the previous layer
      index = Math.floor(index / 2);
    }
    return proof;
  }
}
