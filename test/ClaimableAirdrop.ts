import { expect } from "chai";
import hre from "hardhat";
import { MerkleTree } from "./lib/Merkle";

describe("ClaimableAirdrop", function () {
  let claimableAirdrop;
  let addresses: (string | number)[][];
  let merkleTree: MerkleTree;
  let addrs: [];

  beforeEach(async () => {
    // Hardhat creates a 100 test accounts
    addrs = await hre.ethers.getSigners();
    addresses = [
      [addrs[0].address, 100],
      [addrs[1].address, 50],
      [addrs[2].address, 20],
      [addrs[3].address, 30],
      [addrs[4].address, 80],
      [addrs[5].address, 25],
      [addrs[6].address, 15],
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
        .connect(addrs[i])
        .canClaimTokens(proof, addresses[i][1]);
      expect(result).to.equal(true);
    }
  });

  it("Should return false if claimant passes wrong proof index", async function () {
    const proof = merkleTree.getProof(3);
    const result = await claimableAirdrop
      .connect(addrs[1])
      .canClaimTokens(proof, addresses[1][1]);
    expect(result).to.equal(false);
  });

  it("Should return false if claimant passes wrong amount", async function () {
    const proof = merkleTree.getProof(1);
    const result = await claimableAirdrop
      .connect(addrs[1])
      .canClaimTokens(proof, 10000);
    expect(result).to.equal(false);
  });
});
