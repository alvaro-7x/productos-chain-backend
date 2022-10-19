const { eliminarEspaciosBlanco } = require('../helpers/eliminar-espacios-blanco');

const ContratoProductosChain = require('../contrato/implementaciones/ContratoProductosChain');

const contratoProductosChain = new ContratoProductosChain();

const { eliminarArchivo, subirArchivo } = require('../helpers/administrar-archivo');

const consultarGas = async (req, res) =>
{
  const cuenta = req.cuenta;

  const id = req.body.id;
  const producto = eliminarEspaciosBlanco(req.body.producto);

  const tipo = req.body.tipo;

  try
  {
    const resp = await contratoProductosChain.consultarGas(cuenta, tipo, producto, id);
    const balance = await contratoProductosChain.getBalance(cuenta);

    if (resp === null || balance < 0)
    {
      return res.status(500).json({
        success: false,
        msj: 'El servicio no esta disponible.'
      });
    }

    const { gas } = resp;

    return res.json({
      success: true,
      msj: 'Ok.',
      gas,
      balance
    });
  }
  catch (e)
  {
    return res.status(500).json({
      success: false,
      msj: e.error || 'El servicio no esta disponible.'
    });
  }
};

const listarProductos = async (req, res) =>
{
  const cuenta = req.cuenta;

  try
  {
    const resp = await contratoProductosChain.listarProductos(cuenta);
    const balance = await contratoProductosChain.getBalance(cuenta);

    if (resp === null || balance < 0)
    {
      return res.status(500).json({
        success: false,
        msj: 'No se pudo obtener los productos, quizás el servicio no esta disponible.'
      });
    }

    const { productos } = resp;

    return res.json({
      success: true,
      msj: 'Listado de productos existoso.',
      balance,
      productos
    });
  }
  catch (e)
  {
    return res.status(500).json({
      success: false,
      msj: e.error || 'No se pudo obtener los productos, quizás el servicio no esta disponible.'
    });
  }
};

const guardarProducto = async (req, res) =>
{
  const cuenta = req.cuenta;

  const body = eliminarEspaciosBlanco(req.body);

  const { nombre, descripcion, destacado } = body;

  const { gasLimit, gasPrice } = req.body;

  const { nombreLimitado, descripcionLimitado } = limitarLenTexto(nombre, descripcion);

  let imagen = '';
  try
  {
    imagen = await subirArchivo(req.files);

    const producto = {
      nombre: nombreLimitado,
      descripcion: descripcionLimitado,
      imagen,
      destacado: (destacado === 'true')
    };

    const resp = await contratoProductosChain.crearProducto(producto, cuenta, gasLimit, gasPrice);
    const balance = await contratoProductosChain.getBalance(cuenta);

    if (resp === null || balance < 0)
    {
      eliminarArchivo(imagen);

      return res.status(500).json({
        success: false,
        msj: 'El servicio no esta disponible.'
      });
    }

    const { productoCreado, error, tx } = resp;

    if (Object.keys(productoCreado).length === 0)
    {
      eliminarArchivo(imagen);

      return res.status(400).json({
        success: false,
        msj: (error || 'El producto no pudo ser creado, por favor vuelva a intentarlo.')
      });
    }

    return res.json({
      success: true,
      msj: 'Producto creado exitosamente.',
      balance,
      producto: productoCreado,
      tx
    });
  }
  catch (e)
  {
    if (imagen)
    {
      eliminarArchivo(imagen);
    }

    return res.status(500).json({
      success: false,
      msj: e.error || 'El servicio no esta disponible.'
    });
  }
};

const editarProducto = async (req, res) =>
{
  const id = req.params.id;
  const cuenta = req.cuenta;

  try
  {
    const resp = await contratoProductosChain.editarProducto(id, cuenta);
    const balance = await contratoProductosChain.getBalance(cuenta);

    if (resp === null || balance < 0)
    {
      return res.status(500).json({
        success: false,
        msj: 'El servicio no esta disponible.'
      });
    }

    const { producto, error } = resp;

    if (Object.keys(producto).length === 0)
    {
      return res.status(400).json({
        success: false,
        msj: (error || 'El producto no existe.'),
        balance
      });
    }

    return res.json({
      success: false,
      msj: 'Producto recuperado existosamente.',
      balance,
      producto
    });
  }
  catch (e)
  {
    return res.status(500).json({
      success: false,
      msj: e.error || 'El servicio no esta disponible.'
    });
  }
};

const eliminarProducto = async (req, res) =>
{
  const id = req.params.id;
  const cuenta = req.cuenta;

  const { gasLimit, gasPrice } = req.body;

  try
  {
    const resp = await contratoProductosChain.eliminarProducto(id, cuenta, gasLimit, gasPrice);
    const balance = await contratoProductosChain.getBalance(cuenta);

    if (resp === null || balance < 0)
    {
      return res.status(500).json({
        success: false,
        msj: 'El servicio no esta disponible.'
      });
    }

    const { productoEliminado, error, tx } = resp;

    if (Object.keys(productoEliminado).length === 0)
    {
      return res.status(400).json({
        success: false,
        msj: (error || 'El producto no existe.'),
        balance
      });
    }

    eliminarArchivo(productoEliminado.imagen);

    return res.json({
      success: true,
      msj: 'Producto eliminado exitosamente.',
      balance,
      producto: productoEliminado,
      tx
    });
  }
  catch (e)
  {
    return res.status(500).json({
      success: false,
      msj: e.error || 'El servicio no esta disponible.'
    });
  }
};

const eliminarVariosProductos = async (req, res) =>
{
  const cuenta = req.cuenta;
  const { id, gasPrice } = req.body;

  try
  {
    const resp = await contratoProductosChain.eliminarVariosProductos(id, cuenta, gasPrice);
    const balance = await contratoProductosChain.getBalance(cuenta);

    if (resp === null || balance < 0)
    {
      return res.status(500).json({
        success: false,
        msj: 'El servicio no esta disponible.'
      });
    }

    const { productosEliminados, error, tx } = resp;

    if (productosEliminados.length === 0)
    {
      return res.status(400).json({
        success: false,
        msj: (error || 'No se pudo eliminar los productos.'),
        balance
      });
    }

    for (let i = 0; i < productosEliminados.length; i++)
    {
      eliminarArchivo(productosEliminados[i].imagen);
    }

    return res.json({
      success: true,
      msj: 'Productos eliminados exitosamente.',
      balance,
      ids: productosEliminados.map(producto => producto.id),
      tx: tx.join(',')
    });
  }
  catch (e)
  {
    return res.status(500).json({
      success: false,
      msj: e.error || 'El servicio no esta disponible.'
    });
  }
};

const actualizarProducto = async (req, res) =>
{
  const id = req.params.id;
  const cuenta = req.cuenta;

  const body = eliminarEspaciosBlanco(req.body);

  const { nombre, descripcion, destacado } = body;

  const { gasLimit, gasPrice } = req.body;

  const { nombreLimitado, descripcionLimitado } = limitarLenTexto(nombre, descripcion);

  let imagen = '';
  let imagenOld = '';
  let productoOld = null;
  try
  {
    const { producto } = await contratoProductosChain.editarProducto(id, cuenta);
    productoOld = producto;

    imagenOld = productoOld.imagen;
    imagen = await subirArchivo(req.files, imagenOld);

    const productoUpdate = {
      nombre: nombreLimitado,
      descripcion: descripcionLimitado,
      imagen,
      destacado: (destacado === 'true')
    };

    const resp = await contratoProductosChain.actualizarProducto(productoUpdate, id, cuenta, gasLimit, gasPrice);
    const balance = await contratoProductosChain.getBalance(cuenta);

    if (resp === null || balance < 0)
    {
      if (productoOld.imagen === '')
      {
        eliminarArchivo(imagen);
      }

      return res.status(500).json({
        success: false,
        msj: 'El servicio no esta disponible.'
      });
    }

    const { productoActualizado, error, tx } = resp;

    if (Object.keys(productoActualizado).length === 0)
    {
      if (productoOld.imagen === '')
      {
        eliminarArchivo(imagen);
      }

      return res.status(400).json({
        success: false,
        msj: (error || 'El producto no existe.'),
        balance
      });
    }

    return res.json({
      success: true,
      msj: 'Producto actualizado exitosamente.',
      balance,
      producto: productoActualizado,
      tx
    });
  }
  catch (e)
  {
    if (productoOld && productoOld.imagen === '')
    {
      eliminarArchivo(imagen);
    }

    return res.status(500).json({
      success: false,
      msj: e.error || 'El servicio no esta disponible.'
    });
  }
};

const limitarLenTexto = (nombre, descripcion) =>
{
  return {
    nombreLimitado: nombre.slice(0, 100),
    descripcionLimitado: descripcion.slice(0, 200)
  };
};

module.exports = {
  consultarGas,
  listarProductos,
  guardarProducto,
  editarProducto,
  eliminarProducto,
  eliminarVariosProductos,
  actualizarProducto
};
