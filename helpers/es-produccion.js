const esProduccion = () =>
{
  return (process.env.NODE_ENV === 'production');
};

module.exports = {
  esProduccion
};
