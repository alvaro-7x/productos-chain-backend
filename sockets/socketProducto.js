
const { verificarToken } = require('../helpers/verificar-token');

const socketProducto = async (socket) =>
{
  const cuenta = await verificarToken(socket.handshake.headers['x-token']);

  if (!cuenta)
  {
    return socket.disconnect();
  }

  socket.on('producto-creado-cliente', (dato) =>
  {
    socket.broadcast.emit('producto-creado', dato);
  });

  socket.on('producto-actualizado-cliente', (dato) =>
  {
    socket.broadcast.emit('producto-actualizado', dato);
  });

  socket.on('producto-eliminado-cliente', (dato) =>
  {
    socket.broadcast.emit('producto-eliminado', dato);
  });

  socket.on('productos-eliminados-cliente', (dato) =>
  {
    socket.broadcast.emit('productos-eliminados', dato);
  });
};

module.exports = {
  socketProducto
};
