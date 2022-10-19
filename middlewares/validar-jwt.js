const web3 = require('web3');
const Web3Token = require('web3-token');

const validarJWT = async (req, res, next) =>
{
  const token = req.header('x-token') || '';

  if (!token)
  {
    return res.status(401).json({
      success: false,
      msj: 'Token no enviado'
    });
  }

  try
  {
    const { address } = await Web3Token.verify(token);

    if (!web3.utils.isAddress(address))
    {
      return res.status(400).json({
        success: false,
        msj: 'Token no enviado'
      });
    }

    res.header('Access-Control-Expose-Headers', 'x-token');

    req.cuenta = address;

    // En cada peticion enviamos el token
    res.setHeader('x-token', token);
  }
  catch (e)
  {
    return res.status(401).json({
      success: false,
      msj: 'Token no valido'
    });
  }

  next();
};

module.exports = {
  validarJWT
};
