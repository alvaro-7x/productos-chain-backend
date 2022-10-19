const web3 = require('web3');
const Web3Token = require('web3-token');

const login = async (req, res) =>
{
  const token = req.header('x-token') || '';

  try
  {
    const { address } = await Web3Token.verify(token);

    if (!web3.utils.isAddress(address))
    {
      return res.status(400).json({
        success: false,
        msj: 'Cuenta no valida.'
      });
    }

    return res.json({
      success: true,
      msj: 'Login correcto.',
      data: token,
      cuenta: address
    });
  }
  catch (e)
  {
    return res.status(401).json({
      success: false,
      msj: 'No autorizado.'
    });
  }
};

module.exports = {
  login
};
