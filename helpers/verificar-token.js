const web3 = require('web3');
const Web3Token = require('web3-token');

const verificarToken = async (token) =>
{
  let cuenta;

  try
  {
    const { address } = await Web3Token.verify(token);

    if (!web3.utils.isAddress(address))
    {
      return cuenta;
    }

    cuenta = address;

    return cuenta;
  }
  catch (e)
  {
    return cuenta;
  }
};

module.exports = {
  verificarToken
};
