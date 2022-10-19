
const ProductosChain = artifacts.require('ProductosChain');

const {
  BN, // Big Number support
  constants, // Common constants, like the zero address and largest integers
  expectEvent, // Assertions for emitted events
  expectRevert // Assertions for transactions that should fail
} = require('@openzeppelin/test-helpers');

const truffleAssert = require('truffle-assertions');

// npx truffle test --compile-none

contract('ProductosChain', (accounts) =>
{
  const [ownerContrato, usuario1, usuario2] = accounts;
  let instance;

  beforeEach('Reinicia la instancia del contrato', async () =>
  {
    instance = await ProductosChain.new();
  });

  it('La cantidad de productos debe ser cero, al iniciar el contrato', async () =>
  {
    const productos = await instance.listarProductos.call();

    assert.equal(productos.length, 0);
  });

  it('Debe devolver un error al intentar crear un producto por que el nombre no puede ser vacio', async () =>
  {
    const nuevoProducto = {
      nombre: '',
      descripcion: 'descripcion 1',
      imagen: 'imagen.jpg',
      destacado: true
    };

    await expectRevert(
      instance.crearProducto(nuevoProducto.nombre,
        nuevoProducto.descripcion,
        nuevoProducto.imagen,
        nuevoProducto.destacado,
        { from: usuario1 }),
      'El nombre es requerido'
    );
  });

  it('Debe devolver un error al intentar crear un producto por que la descripcion no puede ser vacia', async () =>
  {
    const nuevoProducto = {
      nombre: 'nombre 1',
      descripcion: '',
      imagen: 'imagen.jpg',
      destacado: true
    };

    await expectRevert(
      instance.crearProducto(nuevoProducto.nombre,
        nuevoProducto.descripcion,
        nuevoProducto.imagen,
        nuevoProducto.destacado,
        { from: usuario1 }),
      'La descripcion es requerida'
    );
  });

  it('Se debe crear un nuevo producto', async () =>
  {
    const nuevoProducto = {
      nombre: 'producto 1',
      descripcion: 'descripcion 1',
      imagen: 'imagen.jpg',
      destacado: true
    };

    const fecha = new Date().getTime();
    const prod = await instance.crearProducto(nuevoProducto.nombre,
      nuevoProducto.descripcion,
      nuevoProducto.imagen,
      nuevoProducto.destacado,
      { from: usuario1 });

    const productos = await instance.listarProductos.call();

    let resProducto;
    truffleAssert.eventEmitted(prod, 'EventoCrearProducto', (ev) =>
    {
      resProducto = ev;
      return ev.nombre === nuevoProducto.nombre &&
        ev.descripcion === nuevoProducto.descripcion &&
        ev.imagen === nuevoProducto.imagen &&
        ev.destacado === nuevoProducto.destacado;
    });

    assert.equal(productos.length, 1);

    expect(resProducto).to.have.a.property('id');
    expect(resProducto).to.have.a.property('creadoPor');
    expect(resProducto).to.have.a.property('creadoEn');

    assert.typeOf(resProducto.id, 'string');
    assert.typeOf(resProducto.creadoPor, 'string');

    assert.equal((resProducto.id.length === 66), true);
    assert.equal((resProducto.creadoPor.length === 42), true);
    assert.equal(parseInt(resProducto.creadoEn) >= Math.floor(fecha / 1000), true);
  });

  it('Se debe obtener un producto dado un ID, esta accion solo puede ser realizado por el propietario del producto', async () =>
  {
    const nuevoProducto =
    {
      nombre: 'producto 1',
      descripcion: 'descripcion 1',
      imagen: 'imagen.jpg',
      destacado: true
    };

    await instance.crearProducto(nuevoProducto.nombre,
      nuevoProducto.descripcion,
      nuevoProducto.imagen,
      nuevoProducto.destacado,
      { from: usuario1 });

    const productos = await instance.listarProductos.call({ from: usuario1 });
    const id = productos[0].id;

    const producto = await instance.editarProducto(id, { from: usuario1 });
    const copiaProducto = { ...producto };

    delete copiaProducto.id;
    delete copiaProducto.creadoPor;
    delete copiaProducto.creadoEn;

    assert.deepOwnInclude(copiaProducto, nuevoProducto);
  });

  it('Se debe actualizar un producto dado un ID, esta accion solo puede ser realizado por el propietario del producto', async () =>
  {
    const crearProducto =
    {
      nombre: 'producto 1',
      descripcion: 'descripcion 1',
      imagen: 'imagen.jpg',
      destacado: true
    };

    await instance.crearProducto(crearProducto.nombre, crearProducto.descripcion, crearProducto.imagen, crearProducto.destacado, { from: usuario1 });

    const productos = await instance.listarProductos.call({ from: usuario1 });
    const { id, creadoPor, creadoEn } = productos[0];

    const actualizarProducto =
    {
      nombre: 'producto 2',
      descripcion: 'descripcion 2',
      imagen: 'imagen2.jpg',
      destacado: false
    };

    const actualizar = await instance.actualizarProducto(
      actualizarProducto.nombre,
      actualizarProducto.descripcion,
      actualizarProducto.imagen,
      actualizarProducto.destacado,
      id,
      { from: usuario1 });

    truffleAssert.eventEmitted(actualizar, 'EventoActualizarProducto', (ev) =>
    {
      return ev.nombre === actualizarProducto.nombre &&
        ev.descripcion === actualizarProducto.descripcion &&
        ev.imagen === actualizarProducto.imagen &&
        ev.destacado === actualizarProducto.destacado &&

        ev.id === id &&
        ev.creadoPor === creadoPor &&
        parseInt(ev.creadoEn) === parseInt(creadoEn);
    });
  });

  it('Se debe eliminar un producto dado un ID, esta accion solo puede ser realizado por el propietario del producto', async () =>
  {
    const crearProducto =
    {
      nombre: 'producto 1',
      descripcion: 'descripcion 1',
      imagen: 'imagen.jpg',
      destacado: true
    };

    await instance.crearProducto(crearProducto.nombre,
      crearProducto.descripcion,
      crearProducto.imagen,
      crearProducto.destacado,
      { from: usuario1 });

    let productos = await instance.listarProductos.call({ from: usuario1 });

    const cantidadProductosInicial = productos.length;
    const { id, creadoPor, creadoEn } = productos[0];

    const eliminar = await instance.eliminarProducto(id, { from: usuario1 });

    truffleAssert.eventEmitted(eliminar, 'EventoEliminarProducto', (ev) =>
    {
      return ev.nombre === crearProducto.nombre &&
        ev.descripcion === crearProducto.descripcion &&
        ev.imagen === crearProducto.imagen &&
        ev.destacado === crearProducto.destacado &&

        ev.id === id &&
        ev.creadoPor === creadoPor &&
        parseInt(ev.creadoEn) === parseInt(creadoEn);
    });

    productos = await instance.listarProductos.call({ from: usuario1 });

    assert.equal(productos.length, cantidadProductosInicial - 1);
  });

  it('Debe devolver un error si se quiere editar un producto que no le pertenece', async () =>
  {
    const nuevoProducto =
    {
      nombre: 'producto 1',
      descripcion: 'descripcion 1',
      imagen: 'imagen.jpg',
      destacado: true
    };

    await instance.crearProducto(nuevoProducto.nombre,
      nuevoProducto.descripcion,
      nuevoProducto.imagen,
      nuevoProducto.destacado,
      { from: usuario1 });

    const productos = await instance.listarProductos.call({ from: usuario2 });
    const id = productos[0].id;

    await truffleAssert.fails(

      instance.editarProducto(id, { from: usuario2 }),
      'No es propietario de este producto'
    );
  });

  it('Debe devolver un error si se quiere eliminar un producto que no le pertenece', async () =>
  {
    const nuevoProducto =
    {
      nombre: 'producto 1',
      descripcion: 'descripcion 1',
      imagen: 'imagen.jpg',
      destacado: true
    };

    await instance.crearProducto(
      nuevoProducto.nombre,
      nuevoProducto.descripcion,
      nuevoProducto.imagen,
      nuevoProducto.destacado,
      { from: usuario1 });

    const productos = await instance.listarProductos.call({ from: usuario2 });
    const id = productos[0].id;

    await truffleAssert.fails
    (
      instance.eliminarProducto(id, { from: usuario2 }),
      'No es propietario de este producto'
    );
  });

  it('Debe devolver un error si se quiere actualizar un producto que no le pertenece', async () =>
  {
    const nuevoProducto =
    {
      nombre: 'producto 1',
      descripcion: 'descripcion 1',
      imagen: 'imagen.jpg',
      destacado: true
    };

    await instance.crearProducto(
      nuevoProducto.nombre,
      nuevoProducto.descripcion,
      nuevoProducto.imagen,
      nuevoProducto.destacado,
      { from: usuario1 });

    const productos = await instance.listarProductos.call({ from: usuario2 });
    const id = productos[0].id;

    const actualizarProducto =
    {
      nombre: 'producto 1 actualizado',
      descripcion: 'descripcion 1 actualizado',
      imagen: 'imagen1-actualizado.jpg',
      destacado: false
    };

    await truffleAssert.fails
    (
      instance.actualizarProducto(actualizarProducto.nombre,
        actualizarProducto.descripcion,
        actualizarProducto.imagen,
        actualizarProducto.destacado,
        id,
        { from: usuario2 }),

      'No es propietario de este producto'
    );
  });

  it('Solo el propietario del contrato puede incrementar/reducir la cantidad limite de productos, siempre y cuando esta no sea menor a la cantidad de productos actuales', async () =>
  {
    const nuevoProducto =
    {
      nombre: 'un producto',
      descripcion: 'una descripcion',
      imagen: 'imagen.jpg',
      destacado: true
    };

    await instance.crearProducto(nuevoProducto.nombre,
      nuevoProducto.descripcion,
      nuevoProducto.imagen,
      nuevoProducto.destacado,
      { from: usuario1 });

    await instance.crearProducto(nuevoProducto.nombre,
      nuevoProducto.descripcion,
      nuevoProducto.imagen,
      nuevoProducto.destacado,
      { from: usuario1 });

    let cantidadLimiteProductos = await instance.getCantidadLimite.call();

    const nuevoLimite = cantidadLimiteProductos + 2;

    await instance.setCantidadLimite(nuevoLimite, { from: ownerContrato });

    cantidadLimiteProductos = await instance.getCantidadLimite.call();

    assert.equal(cantidadLimiteProductos, nuevoLimite);
  });

  it('Debe devolver un error si otro usuario distinto al propietario del contrato quiere incrementar/reducir la cantidad limite de productos', async () =>
  {
    const cantidadLimiteProductos = await instance.getCantidadLimite.call();

    const nuevoLimite = cantidadLimiteProductos + 2;

    await truffleAssert.fails
    (
      instance.setCantidadLimite(nuevoLimite, { from: usuario1 }),
      'No tienes permiso para ejecutar esta accion'
    );
  });

  it('Debe devolver un error si se asigna una cantidad limite igual a cero o menor - igual a la cantidad de productos actuales', async () =>
  {
    const nuevoProducto =
    {
      nombre: 'un producto',
      descripcion: 'una descripcion',
      imagen: 'imagen.jpg',
      destacado: true
    };

    await instance.crearProducto(nuevoProducto.nombre,
      nuevoProducto.descripcion,
      nuevoProducto.imagen,
      nuevoProducto.destacado,
      { from: usuario1 });

    await instance.crearProducto(nuevoProducto.nombre,
      nuevoProducto.descripcion,
      nuevoProducto.imagen,
      nuevoProducto.destacado,
      { from: usuario2 });

    await truffleAssert.fails
    (
      instance.setCantidadLimite(0, { from: ownerContrato }),
      'La cantidad no puede ser cero'
    );

    await truffleAssert.fails
    (
      instance.setCantidadLimite(1, { from: ownerContrato }),
      'La cantidad no puede ser menor a: 2'
    );
  });

  it('Debe devolver un error si se intenta crear mas de N productos', async () =>
  {
    await instance.setCantidadLimite(1, { from: ownerContrato });

    const nuevoProducto =
    {
      nombre: 'un producto',
      descripcion: 'una descripcion',
      imagen: 'imagen.jpg',
      destacado: true
    };

    await instance.crearProducto(nuevoProducto.nombre,
      nuevoProducto.descripcion,
      nuevoProducto.imagen,
      nuevoProducto.destacado,
      { from: usuario1 });

    await truffleAssert.fails
    (
      instance.crearProducto(nuevoProducto.nombre,
        nuevoProducto.descripcion,
        nuevoProducto.imagen,
        nuevoProducto.destacado,
        { from: usuario1 }),
      'Limite alcanzado, no se puede crear mas productos'
    );
  });
});

