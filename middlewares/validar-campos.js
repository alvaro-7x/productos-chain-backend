const { validationResult } = require('express-validator');

const validarCampos = (req, res, next) =>
{
  const errors = validationResult(req);

  if (!errors.isEmpty())
  {
    const errors2 = errors.errors.map(error =>
    {
      return {
        value: error.value,
        msg: error.msg,
        campo: error.param
      };
    });

    return res.status(400).json(errors2);
  }
  next();
};

module.exports = {
  validarCampos
};
