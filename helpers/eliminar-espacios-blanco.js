const eliminarEspaciosBlanco = (reqBody) =>
{
  const body = {};

  const oldBody = reqBody;

  for (const i in oldBody)
  {
    body[i] = (typeof oldBody[i] === 'string') ? oldBody[i].toString().trim() : oldBody[i];
  }

  return body;
};

module.exports = {
  eliminarEspaciosBlanco
};
