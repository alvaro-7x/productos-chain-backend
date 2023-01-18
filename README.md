# Productos Chain (backend)
El backend de la aplicación descentralizada (DApp) Productos Chain.

## Instalacíon

```
$ npm install
```

## Requerimientos
```
Node >= 14
Metamask
```

## Descripción

Backend del proyecto Productos Chain, un crud básico de productos y una sección de autenticación usando nodejs, socket.io, web3js, truffle y ganache-cli. Los datos de los productos son guardados en la testnet de Goerli en producción y en ganache en desarrollo. 

Se utiliza el contrato: `contrato/contracts/ProductosChain.sol` el cual esta escrito en [solidity](https://soliditylang.org/).

Además para notificar a los usuarios cuando una transacción exitosa es realizada se utiliza socket.io.


## Endpoints del proyecto

* **Autenticación** (cualquier usuario)
 1. Realizar el login
```
POST    http://localhost:4001/login
```


* **Crud de productos** (solo usuarios logueados)
 1. Verificar token
```
GET     http://localhost:4001/verificar-token
```

 2. Consultar la cantidad de gas requerido para procesar la transacción.
```
POST    http://localhost:4001/consultar-gas
```

 3. Listar todos los productos.
```
GET     http://localhost:4001/
```

 4. Crear un nuevo producto.
```
POST    http://localhost:4001/
```

 5. Obtener el producto con el **id**.
```
GET     http://localhost:4001/:id
```

 6. Borrar el producto con el **id**.
```
DELETE  http://localhost:4001/:id
```

 7. Borrar varios productos.
```
POST    http://localhost:4001/eliminar/
```

 8. Actualizar el producto con el **id**.
```
PUT     http://localhost:4001/:id
```

## Desplegar el proyecto

En ambos casos tanto desarrollo y producción, deberá crearse una cuenta en [cloudinary](https://cloudinary.com/) y una vez en su cuenta deberá obtener los siguientes datos: `CLOUD_NAME`, `API_KEY`, `API_SECRET` y colocarlos en el archivo `.env`. Se utiliza cloudinary como un hosting de imagenes.

En desarrollo
* En el archivo `contrato/truffle-config.js`, del presente proyeco, en la sección de `networks` añadir:
```
  networks: {
    ...
    
    development: {
     host: "127.0.0.1",
     port: 8545,
     network_id: "1337"
    },
    
    ...
``` 

* Abrir una terminal y dirijirse a la carpeta `contrato`, del presente proyecto, y ejecutar el comando:
```
npx ganache-cli --deterministic  --networkId  1337
```
Esto iniciará una blockchain local y nos brindará cuentas con ethers de prueba y sus respectivas privates keys, las cuales seran requeridas por Metamask en el [frontend](https://github.com/alvaro-7x/productos-chain-frontend) del proyecto. Es importante mencionar que la primera cuenta es utilizada para migrar el contrato.

 <img src="/images/ganache.jpg" width="400px"><br>

 Esta terminal no deberá ser cerrada.

* Abrir otra terminal y dirijirse a la carpeta `contrato`, del presente proyecto, y ejecutar el comando:
```
npx truffle migrate --network  development
```
Esto realizará la migración del contrato `contrato/contracts/ProductosChain.sol` en la red de ganache.

* Abrir otra terminal y en la raiz del presente proyecto, ejecutar el comando:
```
node index.js
```
aunque se sugiere tener instalado `nodemon`.

En producción
* Instalar [Metamask](https://addons.mozilla.org/en-US/firefox/addon/ether-metamask/).

* Crear un **Api key** y obtener el **Endpoint** de Infura
  1. Diríjase a [infura.io](https://infura.io/) y cree una cuenta si no la tiene. 
  2. Haga clic en Ethereum en el panel izquierdo.
  3. Escriba el nombre de su proyecto y haga clic para crear el proyecto.
  4. Esto debería crear un endpoint y un api key para su proyecto.
  5. En la sección de endpoints seleccionar Gorli ó Goerli.

* Obtener [ethers de prueba](https://faucets.chain.link/) de la tesnet de Goerli.

* Configurar las siguientes variables en el archivo `.env`:
  1. `MNEMONIC`:  La clave privada de 12 palabras que Metamask le ofrece al momento de crear su billetera/wallet.
  2. `PROVIDER`: El endpoint de infiura.
  3. `PROJECT_ID`: La api key creado en infiura.
  4. `NETWORK_ID`: El número de la red/chainId de Goerli. (Goerli utiliza el número 5. [Ver lista](https://chainlist.org/), no se olvide habilitar la opción **Testnets**).
  5. `PRIVATE_KEY`: Exportar la private key, de Metamask, de la cuenta que será utilizada para migrar el contrato. [Ver ejemplo](https://metamask.zendesk.com/hc/en-us/articles/360015289632-How-to-export-an-account-s-private-key)
  6. `CONTRACT_ADDRESS`: La direción del contrato.


* En el archivo `contrato/truffle-config.js`, del presente proyeco, en la sección de `networks` añadir:
```
  networks: {
    ...
    
    goerli: {
      provider: () => new HDWalletProvider(MNEMONIC, `${PROVIDER}/${PROJECT_ID}`),
      network_id: NETWORK_ID
    },
    
    ...
```
* Abrir una terminal y dirijirse a la carpeta `contrato`, del presente proyecto, y ejecutar los comandos:
```
npx truffle compile
npx truffle migrate --network goerli
```

* Cuando la migración haya terminado de manera exitosa, se nos brindará información como la red en la que se desplego el contrato, el gas limit, el transaction hash, entre otros. Pero la informacion que es realmente importante es la dirección del contrato (**contract address**), el cual sera necesario reemplazar en el archivo **.env**.

## Desplegar el proyecto con docker (en desarrollo)

En la carpeta raiz del proyecto ejecute el siguiente comando:
```
docker-compose -f docker-compose.yaml up -d

```
El archivo `docker-compose.yaml` se encargará de:

* Levantar el servidor ganache.
* Realizar la migración del contrato (en desarrollo).
* Levantar el servidor node.

Sea paciente este proceso demora un par de minutos. No se olvide de reemplazar los datos de las variables en el archivo `.env`.


## ¿Y ahora que sigue?

Este proyecto es solo el [**backend**](https://github.com/alvaro-7x/productos-chain-backend) del proyecto completo, para poder verlo en funcionamiento en un entorno de desarrollo deberá configurar el [**frondend**](https://github.com/alvaro-7x/productos-chain-frontend).

## Algunas pruebas

Este proyecto cuenta con un par de pruebas en `contrato/test/ContratoProductosChain.test.js` para el contrato `contrato/contracts/ProductosChain.sol`.

Para ejecutar las pruebas abra una terminal y dirijase a la carpeta `contrato`, del presente proyecto, y ejecute el siguiente comando:
```
npx truffle test
```
En el caso de que no desee compilar en cada prueba ejecute el siguiente comando:
```
npx truffle test --compile-none
```

Tome en cuenta que estas pruebas son ejecutas en un entorno de desarrollo.

## Ver proyecto
[Clic aquí para ver el proyecto completo en funcionamiento con frontend angular](https://productoschain-angular.up.railway.app)
<br>
[Clic aquí para ver el proyecto completo en funcionamiento con frontend react](https://productoschain-react.up.railway.app)
