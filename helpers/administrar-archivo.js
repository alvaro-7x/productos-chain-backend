const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
  secure: true
});

const subirArchivo = async (file, urlImgExistente = '') =>
{
  const maxSizeFile = 600; // Máximo tamaño del archivo en Kb

  if (!file)
  {
    return '' || urlImgExistente;
  }

  const extensiones = ['jpg', 'jpeg', 'png', 'gif'];

  const tipo = file.imagen.mimetype.split('/');

  const extension = tipo.slice(-1).toString();

  if (extensiones.includes(extension) === false)
  {
    return '' || urlImgExistente;
  }

  if (file.imagen.size > maxSizeFile * 1024)
  {
    return '' || urlImgExistente;
  }

  let urlImg = '';

  try
  {
    let options = {
      unique_filename: true,
      use_filename: true,
      tags: ['productoschain']
      // format: 'jpg',
    };

    if (urlImgExistente)
    {
      const id = getPublicId(urlImgExistente);

      if (id !== null)
      {
        options = { ...options, publicId: id };
      }
    }

    const { secure_url: secureUrl } = await cloudinary.uploader.upload(file.imagen.tempFilePath, options);

    urlImg = secureUrl;
  }
  catch (e)
  {
    console.error(e);
  }
  finally
  {
    return urlImg;
  }
};

const eliminarArchivo = async (urlImg) =>
{
  try
  {
    const publicId = getPublicId(urlImg);

    if (publicId)
    {
      await cloudinary.uploader.destroy(publicId, { invalidate: true });
    }
  }
  catch (e)
  {
    console.error(e);
  }
};

const getPublicId = (urlImg = '') =>
{
  if (urlImg)
  {
    const datosImg = urlImg.split('/');
    const nombre = datosImg[datosImg.length - 1];
    const [id] = nombre.split('.');

    return id;
  }
  return null;
};

module.exports = {
  subirArchivo,
  eliminarArchivo
};
