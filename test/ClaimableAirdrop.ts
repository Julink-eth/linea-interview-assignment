import { expect } from "chai";
import hre from "hardhat";
import { MerkleTree } from "./lib/Merkle";

describe("ClaimableAirdrop", function () {
  let claimableAirdrop;
  let addresses: (string | number)[][];
  let merkleTree: MerkleTree;
  let signers;

  beforeEach(async () => {
    // Hardhat creates a 100 test accounts
    signers = await hre.ethers.getSigners();
    addresses = [
      [signers[0].address, 100],
      [signers[1].address, 50],
      [signers[2].address, 20],
      [signers[3].address, 30],
      [signers[4].address, 80],
      [signers[5].address, 25],
      [signers[6].address, 15],
    ];

    merkleTree = new MerkleTree(addresses);
    const rootHash = merkleTree.getRoot();

    claimableAirdrop = await hre.ethers.deployContract("ClaimableAirdrop", [
      rootHash,
    ]);
  });

  it("Should return true if claimants pass right values", async function () {
    for (let i = 0; i < addresses.length; i++) {
      const proof = merkleTree.getProof(i);
      const result = await claimableAirdrop
        .connect(signers[i])
        .canClaimTokens(proof, addresses[i][1]);
      expect(result).to.equal(true);
    }
  });

  it("Should return false if claimant passes wrong proof index", async function () {
    const proof = merkleTree.getProof(3);
    const result = await claimableAirdrop
      .connect(signers[1])
      .canClaimTokens(proof, addresses[1][1]);
    expect(result).to.equal(false);
  });

  it("Should return false if claimant passes wrong amount", async function () {
    const proof = merkleTree.getProof(1);
    const result = await claimableAirdrop
      .connect(signers[1])
      .canClaimTokens(proof, 10000);
    expect(result).to.equal(false);
  });
});
