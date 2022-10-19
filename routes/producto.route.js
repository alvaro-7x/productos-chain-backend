const { Router } = require('express');
const { check } = require('express-validator');
const { validarJWT } = require('../middlewares/validar-jwt');

const router = Router();
const { validarCampos } = require('../middlewares/validar-campos');

const { consultarGas, listarProductos, guardarProducto, editarProducto, actualizarProducto, eliminarProducto, eliminarVariosProductos } = require('../controllers/producto.controller');

router.post('/consultar-gas', [
  validarJWT,
  check('tipo', 'El valor tipo es requerido').not().isEmpty(),
  validarCampos
], consultarGas);

// Listar todos los productos
router.get('/', [validarJWT], listarProductos);

// Crear un producto
router.post('/', [
  validarJWT,
  check('nombre', 'El nombre es requerido').not().isEmpty(),
  check('descripcion', 'La descripción es requerida').not().isEmpty(),
  check('imagen').default(''),
  check('destacado').customSanitizer(value => value || false),
  check('gasLimit').default(process.env.ESTIMATE_GAS),
  check('gasPrice').default(process.env.GAS_PRICE),
  validarCampos
], guardarProducto);

// Obtener un producto
router.get('/:id', [
  validarJWT,
  check('id', 'El id es requerido').not().isEmpty(),
  validarCampos
], editarProducto);

// Eliminar un producto
router.delete('/:id', [
  validarJWT,
  check('id', 'El id es requerido').not().isEmpty(),
  check('gasLimit').default(process.env.ESTIMATE_GAS),
  check('gasPrice').default(process.env.GAS_PRICE),
  validarCampos
], eliminarProducto);

// Eliminar varios productos
router.post('/eliminar/', [
  validarJWT,
  check('id', 'Ids son requeridos').not().isEmpty(),
  check('gasPrice').default(process.env.GAS_PRICE),
  validarCampos
], eliminarVariosProductos);

// Actualizar un producto
router.put('/:id', [
  validarJWT,
  check('id', 'El id es requerido').not().isEmpty(),
  check('nombre', 'El nombre es requerido').not().isEmpty(),
  check('descripcion', 'La descripción es requerida').not().isEmpty(),
  check('imagen').default(''),
  check('destacado').default(false),
  check('gasLimit').default(process.env.ESTIMATE_GAS),
  check('gasPrice').default(process.env.GAS_PRICE),
  validarCampos
], actualizarProducto);

module.exports = router;
