const { PutObjectCommand } = require('@aws-sdk/client-s3');
const s3 = require('../utils/aws');

const allowedMimeTypes = [
  'image/jpeg',
  'image/png',
  'image/jpg',
  'application/pdf',
];

// Function to upload a file to S3 and return the URL
const uploadFileToS3 = async file => {
  try {
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new Error(
        'Invalid file type. Only JPEG, PNG, JPG, and PDF files are allowed.',
      );
    }
    const params = {
      Bucket: process.env.S3_BUCKET_NAME,
      Key: Date.now() + '-' + file.originalname,
      Body: file.buffer,
      ACL: 'public-read',
      ContentType: file.mimetype,
    };

    // PutObjectCommand -to upload the file to S3
    const command = new PutObjectCommand(params);
    const uploadResult = await s3.send(command);
    console.log(uploadResult);

    const fileUrl = `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${params.Key}`;
    return fileUrl;
  } catch (error) {
    throw new Error('Error uploading file to S3: ' + error.message);
  }
};

module.exports = { uploadFileToS3 };
