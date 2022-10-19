const ProductosChain = artifacts.require('ProductosChain');

module.exports = async function (deployer)
{
  await deployer.deploy(ProductosChain);
};
