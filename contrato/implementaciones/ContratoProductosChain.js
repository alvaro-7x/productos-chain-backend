const Web3 = require('web3');
const DataCodificacionAbi = require('../../helpers/DataCodificacionAbi');
const { esProduccion } = require('../../helpers/es-produccion');

const ProductosChain = (esProduccion())
  ? null
  : require('../build/contracts/ProductosChain.json');

const ProductosChainAbi = (esProduccion())
  ? require('./ProductosChainAbi.json')
  : ProductosChain.abi;

const dataCodificacionAbi = new DataCodificacionAbi(ProductosChainAbi);

const intervaloReconexion = 10000;

class ContratoProductosChain
{
  constructor ()
  {
    this.abi = ProductosChainAbi;
    this.contractAddress = this.getContractAddress();

    this.web3 = null;
    this.provider = null;
    this.contrato = null;
    this.iniciarEventosProvider(this.abi, this.contractAddress);
  }

  reiniciarProvider (abi, contractAddress)
  {
    this.iniciarEventosProvider(abi, contractAddress);
  }

  iniciarEventosProvider (abi, contractAddress)
  {
    if (this.provider !== null)
    {
      // reinicia el actual provider
      this.provider.reset();

      // remueve todos los del provider.
      this.provider.removeAllListeners('connect');
      this.provider.removeAllListeners('error');
      this.provider.removeAllListeners('close');
    }

    this.provider = this.getNuevoProvider();

    this.provider.on('connect', () =>
    {
      // Iniciamos web3
      this.web3 = new Web3(this.provider);

      // Iniciamos el contrato
      this.contrato = new this.web3.eth.Contract(this.abi, this.contractAddress);

      // En un entorno de produccion necesitamos la PRIVATE KEY, para firmar las transaciones
      if (esProduccion())
      {
        this.web3.eth.accounts.wallet.add(process.env.PRIVATE_KEY);
      }
    });

    this.provider.on('error', (err) => console.error(err.message));

    this.provider.on('close', (err1) =>
    {
      if (this.web3)
      {
        this.web3.eth.accounts.wallet.clear();
      }

      this.contrato = null;

      setTimeout(() =>
      {
        this.web3 = null;
        this.reiniciarProvider(abi, contractAddress);
      }, intervaloReconexion);
    });
  }

  getNuevoProvider ()
  {
    const websocketProvider = (esProduccion())
      ? `${process.env.PROVIDER}/${process.env.PROJECT_ID}`
      : 'ws://localhost:8545';

    return new Web3.providers.WebsocketProvider(websocketProvider);
  }

  setProvider (provider)
  {
    this.web3.setProvider(provider);
  }

  getContractAddress ()
  {
    if (esProduccion())
    {
      // const networkId = process.env.NETWORK_ID
      return process.env.CONTRACT_ADDRESS;
    }
    else
    {
      // const networks = Object.keys(ProductosChain.networks);
      // const networkId = (networks.slice(-1)).toString();
      const networkId = '1337';

      if (!ProductosChain)
      {
        throw { error: 'No se realizó la migración del contrato' };
      }

      const address = ProductosChain.networks[networkId].address;

      return address;
    }
  }

  async consultarGas (cuenta, tipo, producto, id)
  {
    if (!this.contrato)
    {
      return null;
    }

    let estimateGas = process.env.ESTIMATE_GAS;
    let error = null;

    try
    {
      if (Array.isArray(id))
      {
        return await this.consultarGasEliminarVarios(cuenta, tipo, id);
      }

      const data = dataCodificacionAbi.generarAbiEncode(this.web3, tipo, producto, id);

      if (data)
      {
        estimateGas = await this.web3.eth.estimateGas({ to: this.contractAddress, from: cuenta, data });
      }

      return { gas: estimateGas, error };
    }
    catch (e)
    {
      error = this.devolverError(e);
      throw { gas: estimateGas, error };
    }
  }

  async consultarGasEliminarVarios (cuenta, tipo, ids)
  {
    let estimateGas = process.env.ESTIMATE_GAS;
    let error = null;
    const dataArray = [];
    let estimateGasTotal = 0;

    const tmpArray = [];
    try
    {
      for (const i in ids)
      {
        const data = dataCodificacionAbi.generarAbiEncode(this.web3, tipo, null, ids[i]);
        dataArray.push(data);
      }
      if (dataArray.length > 0)
      {
        for (const i in dataArray)
        {
          tmpArray.push(this.web3.eth.estimateGas({ to: this.contractAddress, from: cuenta, data: dataArray[i] }));
        }

        await Promise.all(tmpArray.map(async gasEstimadoParcial =>
        {
          try
          {
            const estimateGasTmp = await gasEstimadoParcial;
            estimateGasTotal += estimateGasTmp;
          }
          catch (e)
          {}
        }));

        estimateGas = estimateGasTotal;
      }

      return { gas: estimateGas, error };
    }
    catch (e)
    {
      error = this.devolverError(e);
      throw { gas: estimateGas, error };
    }
  }

  async listarProductos (cuenta)
  {
    if (!this.contrato)
    {
      return null;
    }

    const productos = [];
    let error = null;

    const args =
    {
      from: cuenta
    };

    try
    {
      const productosTmp = await this.contrato.methods.listarProductos().call(args);

      if (productosTmp.length > 0)
      {
        for (const i in productosTmp)
        {
          const producto = this.parseProducto(productosTmp[i]);
          productos.push(producto);
        }
      }

      return { productos, error };
    }
    catch (e)
    {
      error = this.devolverError(e);
      throw { productos, error };
    }
  }

  async crearProducto (producto, cuenta, gasLimit, gasPrice)
  {
    if (!this.contrato)
    {
      return null;
    }

    let productoCreado = {};
    let error = null;

    // const gasTmp = await this.contrato.methods.crearProducto(producto.nombre, producto.descripcion, producto.imagen, producto.destacado).estimateGas({to: this.contractAddress, from: cuenta});
    // const abiTmp = await this.contrato.methods.crearProducto(producto.nombre, producto.descripcion, producto.imagen, producto.destacado).encodeABI();

    try
    {
      const gasPriceGwei = (parseInt(gasPrice) * Math.pow(10, 9)).toString();

      const args =
      {
        from: cuenta,
        gas: gasLimit,
        gasPrice: gasPriceGwei
      };

      const productoTmp = await this.contrato.methods.crearProducto(producto.nombre, producto.descripcion, producto.imagen, producto.destacado).send(args);
      if (Object.keys(productoTmp.events).includes('EventoCrearProducto'))
      {
        productoCreado = this.parseProducto(productoTmp.events.EventoCrearProducto.returnValues);

        const tx = productoTmp.events.EventoCrearProducto.transactionHash;

        return { productoCreado, error, tx };
      }
      else
      {
        throw { productoCreado, error: 'El producto no pudo ser creado, posiblemente el contrato no exista o no tiene suficiente Ether.' };
      }
    }
    catch (e)
    {
      error = this.devolverError(e);
      throw { productoCreado, error };
    }
  }

  async editarProducto (id, cuenta)
  {
    if (!this.contrato)
    {
      return null;
    }

    let producto = {};
    let error = null;

    try
    {
      if (id.trim().length === 66)
      {
        const args =
        {
          from: cuenta
        };

        const productoTmp = await this.contrato.methods.editarProducto(id).call(args);
        producto = this.parseProducto(productoTmp);
        return { producto, error };
      }
      else
      {
        throw { producto, error: 'El producto no existe.' };
      }
    }
    catch (e)
    {
      error = this.devolverError(e);
      throw { producto, error };
    }
  }

  async eliminarProducto (id, cuenta, gasLimit, gasPrice)
  {
    if (!this.contrato)
    {
      return null;
    }

    let productoEliminado = {};
    let error = null;
    try
    {
      if (id.trim().length === 66)
      {
        const gasPriceGwei = (parseInt(gasPrice) * Math.pow(10, 9)).toString();

        const args =
        {
          from: cuenta,
          gas: gasLimit,
          gasPrice: gasPriceGwei
        };

        const productoTmp = await this.contrato.methods.eliminarProducto(id).send(args);

        if (Object.keys(productoTmp.events).includes('EventoEliminarProducto'))
        {
          productoEliminado = this.parseProducto(productoTmp.events.EventoEliminarProducto.returnValues);
          const tx = productoTmp.events.EventoEliminarProducto.transactionHash;
          return { productoEliminado, error, tx };
        }
        else
        {
          throw { productoEliminado, error: 'El producto no pudo ser eliminado, posiblemente el contrato no exista o no tiene suficiente Ether.' };
        }
      }
      else
      {
        throw { productoEliminado, error: 'El producto no existe.' };
      }
    }
    catch (e)
    {
      error = this.devolverError(e);
      throw { productoEliminado, error };
    }
  }

  async eliminarVariosProductos (id, cuenta, gasPrice)
  {
    if (!this.contrato)
    {
      return null;
    }

    const productosEliminados = [];
    let error = null;
    const txs = [];
    try
    {
      for (let i = 0; i < id.length; i++)
      {
        if (id[i].trim().length === 66)
        {
          const gasPriceGwei = (parseInt(gasPrice) * Math.pow(10, 9)).toString();
          const gasLimit = await this.contrato.methods.eliminarProducto(id[i]).estimateGas({ to: this.contractAddress, from: cuenta });

          const args =
          {
            from: cuenta,
            gas: gasLimit,
            gasPrice: gasPriceGwei
          };

          const productoTmp = await this.contrato.methods.eliminarProducto(id[i]).send(args);

          if (Object.keys(productoTmp.events).includes('EventoEliminarProducto'))
          {
            const productoEliminado = this.parseProducto(productoTmp.events.EventoEliminarProducto.returnValues);
            const prodTmp = {
              id: productoEliminado.id,
              imagen: productoEliminado.imagen
            };
            const tx = productoTmp.events.EventoEliminarProducto.transactionHash;
            productosEliminados.push(prodTmp);
            txs.push(tx);
          }
        }
      }

      return { productosEliminados, error, tx: txs };
    }
    catch (e)
    {
      error = this.devolverError(e);
      throw { productosEliminados, error };
    }
  }

  async actualizarProducto (producto, id, cuenta, gasLimit, gasPrice)
  {
    if (!this.contrato)
    {
      return null;
    }

    let productoActualizado = {};
    let error = null;

    try
    {
      if (id.trim().length === 66)
      {
        const gasPriceGwei = (parseInt(gasPrice) * Math.pow(10, 9)).toString();
        const args =
        {
          from: cuenta,
          gas: gasLimit,
          gasPrice: gasPriceGwei
        };

        const productoTmp = await this.contrato.methods.actualizarProducto(producto.nombre, producto.descripcion, producto.imagen, producto.destacado, id).send(args);
        if (Object.keys(productoTmp.events).includes('EventoActualizarProducto'))
        {
          productoActualizado = this.parseProducto(productoTmp.events.EventoActualizarProducto.returnValues);
          const tx = productoTmp.events.EventoActualizarProducto.transactionHash;
          return { productoActualizado, error, tx };
        }
        else
        {
          throw { productoActualizado, error: 'El producto no pudo ser actualizado, posiblemente el contrato no exista o no tiene suficiente Ether.' };
        }
      }
      else
      {
        throw { productoActualizado, error: 'El producto no existe.' };
      }
    }
    catch (e)
    {
      error = this.devolverError(e);
      throw { productoActualizado, error };
    }
  }

  async getBalance (cuenta)
  {
    if (!this.contrato)
    {
      return null;
    }

    let elBalance = -1;

    try
    {
      elBalance = await this.web3.eth.getBalance(cuenta);

      elBalance = (elBalance / Math.pow(10, 18)).toFixed(8);
    }
    catch (e)
    {
      console.error(e);
    }
    finally
    {
      return elBalance;
    }
  }

  parseProducto (producto)
  {
    if (producto == null || Object.keys(producto).length === 0)
    {
      return {};
    }

    return {
      id: producto.id,
      nombre: producto.nombre,
      descripcion: producto.descripcion,
      imagen: producto.imagen,
      destacado: producto.destacado,
      creadoPor: producto.creadoPor,
      creadoEn: producto.creadoEn
    };
  }

  devolverError = (e = null) =>
  {
    if (!e || !e.toString())
    {
      return null;
    }

    if (e.error && e.error.toString() !== '')
    {
      return e.error;
    }

    const error = e.toString();

    if (error.includes('Returned values aren\'t valid, did it run Out of Gas?'))
    {
      return 'Posiblemente el contrato no exista o no tiene suficientes Ethers.';
    }

    if (error.includes('VM Exception while processing transaction: out of gas'))
    {
      return 'Necesita aumentar el Gas Limit o no tiene suficientes Ethers.';
    }

    if (error.includes('base fee exceeds gas limit'))
    {
      return 'Necesita aumentar el Gas Limit o no tiene suficientes Ethers.';
    }

    const detalleError = error.split('revert');

    if (detalleError.length !== 2)
    {
      return null;
    }

    return detalleError[1].toString().trim();
  };
}

module.exports = ContratoProductosChain;
