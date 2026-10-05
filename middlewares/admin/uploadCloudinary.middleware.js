const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');

// Configure Cloudinary
cloudinary.config({
  cloud_name: 'z9dxcuyr',
  api_key: '671691472124729',
  api_secret: '2SxfxPcXTgVdgLqexY026Qgob1c'
});
// end Clodinary config

module.exports.uploadCloudinary = (req, res, next) => {
    if (req.file) {
      let streamUpload = (req) => {
        return new Promise((resolve, reject) => {
          let stream = cloudinary.uploader.upload_stream((error, result) => {
            if (result) {
              resolve(result);
            } else {
              reject(error);
            }
          });
          streamifier.createReadStream(req.file.buffer).pipe(stream);
        });
      };
      async function upload(req) {
        let result = await streamUpload(req);
        req.body[req.file.fieldname] = result.secure_url;
        next();
      }
      upload(req);
    } else {
      next();
    }
};