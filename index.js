require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const compression = require('compression');
const fileUpload = require('express-fileupload');

const { esProduccion } = require('./helpers/es-produccion');

const app = express();

const server = require('http').createServer(app);

const opcionesIO = esProduccion() ? {} : { cors: { origins: ['http://localhost:4200'] } };

const io = require('socket.io')(server, opcionesIO);

const PORT = process.env.PORT;

const auth = require('./routes/auth.route');
const producto = require('./routes/producto.route');

const { socketProducto } = require('./sockets/socketProducto');

// Uso de cors
app.use(cors());

// subir archivos
app.use(fileUpload({
  useTempFiles: true,
  tempFileDir: '/tmp/',
  createParentPath: true
}));

// Transformamos la peticion a Json
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rutas
app.use('/auth', auth);
app.use('/productos', producto);

// Archivos estaticos
app.use(express.static('public'));

// Usamos compresion
app.use(compression());

// Servir los archivos del frontend
app.get('*', (req, res) =>
{
  res.sendFile(path.resolve(__dirname, 'public/index.html'));
});

// Conexion realizada por el socket
io.on('connection', (socket) => socketProducto(socket));

server.listen(PORT, () =>
{
  console.log('Servidor corriendo el puerto: ' + PORT);
});
