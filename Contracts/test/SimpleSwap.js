const { expect } = require("chai");

describe("SimpleSwap Test", function () {
  let owner, user;
  let tokenA, tokenB, swap;

  beforeEach(async () => {
    [owner, user] = await ethers.getSigners();

    const TokenA = await ethers.getContractFactory("TakoA");
    const TokenB = await ethers.getContractFactory("TakoB");

    tokenA = await TokenA.deploy("Token A", "TKA");
    tokenB = await TokenB.deploy("Token B", "TKB");

    const SimpleSwap = await ethers.getContractFactory("SimpleSwap");
    swap = await SimpleSwap.deploy(tokenA.target, tokenB.target);

    // Mintea tokens para el owner y el user
    await tokenA.mint(owner.address, 10000);
    await tokenB.mint(owner.address, 10000);
    await tokenA.mint(user.address, 5000);
    await tokenB.mint(user.address, 5000);
  });

  it("agrega liquidez correctamente", async () => {
    await tokenA.approve(swap.target, 1000);
    await tokenB.approve(swap.target, 1000);

    await swap.addLiquidity(1000, 1000);

    expect(await tokenA.balanceOf(swap.target)).to.equal(1000);
    expect(await tokenB.balanceOf(swap.target)).to.equal(1000);
  });

  it("permite swap de A por B", async () => {
    // Owner agrega liquidez
    await tokenA.approve(swap.target, 1000);
    await tokenB.approve(swap.target, 1000);
    await swap.addLiquidity(1000, 1000);

    // User aprueba y hace swap
    await tokenA.connect(user).approve(swap.target, 100);
    await swap.connect(user).swap(tokenA.target, tokenB.target, 100);

    const balanceB = await tokenB.balanceOf(user.address);
    expect(balanceB).to.be.above(0);
  });

  it("retorna precio correcto", async () => {
    await tokenA.approve(swap.target, 1000);
    await tokenB.approve(swap.target, 2000);
    await swap.addLiquidity(1000, 2000);

    const price = await swap.getPrice(tokenA.target, tokenB.target);
    expect(price).to.equal(2);
  });
});



