const multer = require('multer');
const multerS3 = require('multer-s3');
const s3 = require('../utils/aws');

// Configure multer to upload files to S3
const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: process.env.S3_BUCKET_NAME,
    acl: 'public-read',
    metadata: function (req, file, cb) {
      cb(null, { fieldName: file.fieldname });
    },
    key: function (req, file, cb) {
      const fileName = Date.now() + '-' + file.originalname;
      cb(null, fileName);
    },
  }),
});

module.exports = upload;
