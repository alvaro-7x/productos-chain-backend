const { TipoAccion } = require('../constantes/constantes');

class DataCodificacionAbi
{
  constructor (abi)
  {
    this.abi = abi;
    this.jsonInterfaces = {};
    this.obtenerJsonInterfaces();
  }

  obtenerJsonInterfaces ()
  {
    if (this.abi.length <= 0)
    {
      return;
    }

    for (let i = 0; i < this.abi.length; i++)
    {
      const json = this.abi[i];

      if (json.hasOwnProperty('name'))
      // if (Object.getOwnPropertyDescriptor(json, 'name'))
      {
        const id = json.name;
        this.jsonInterfaces[id] = json;
      }
    }
  }

  generarAbiEncode (web3, tipo, producto = null, id = null)
  {
    const nombreFuncion = this.getNombreFuncion(tipo);
    const parametros = this.getParametros(tipo, producto, id);
    const encode = this.abiEncode(web3, nombreFuncion, parametros);
    return encode;
  }

  getNombreFuncion (tipo)
  {
    switch (tipo)
    {
      case TipoAccion.CREAR:
        return 'crearProducto';

      case TipoAccion.ACTUALIZAR:
        return 'actualizarProducto';

      case TipoAccion.ELIMINAR:
        return 'eliminarProducto';

      default:
        return '';
    }
  }

  toJson (producto)
  {
    // Convertimos a Json por los saltos de linea
    const nombre = producto.nombre ? JSON.stringify(producto.nombre).slice(1, -1) : '';
    const descripcion = producto.descripcion ? JSON.stringify(producto.descripcion).slice(1, -1) : '';

    return {
      nombre,
      descripcion
    };
  }

  getParametros (tipo, producto, id)
  {
    const imagenMock = 'https://esta-es-una-url-mock-para-la-imagen-debido-a-que-la-url-se-genera-solo-si-el-producto-es-creado';

    let parametros = [];

    switch (tipo)
    {
      case TipoAccion.CREAR:
        if (producto !== null)
        {
          const { nombre, descripcion } = this.toJson(producto);

          parametros = [
            nombre,
            descripcion,
            imagenMock,
            producto.destacado
          ];
        }
        break;

      case TipoAccion.ACTUALIZAR:
        if (producto !== null && id !== null)
        {
          const { nombre, descripcion } = this.toJson(producto);

          parametros = [
            nombre,
            descripcion,
            imagenMock,
            producto.destacado,
            id
          ];
        }
        break;

      case TipoAccion.ELIMINAR:
        if (id !== null)
        {
          parametros = [id];
        }
        break;
    }

    return parametros;
  }

  abiEncode (web3, nombreFuncion = '', parametros = [])
  {
    let resp = '';
    if (!web3)
    {
      return resp;
    }

    if (nombreFuncion === '' || parametros.length === 0)
    {
      return resp;
    }

    const nombresFuncion = Object.keys(this.jsonInterfaces);

    if (nombresFuncion.includes(nombreFuncion))
    {
      resp = web3.eth.abi.encodeFunctionCall(this.jsonInterfaces[nombreFuncion], parametros);
    }

    return resp;
  }
}

module.exports = DataCodificacionAbi;
