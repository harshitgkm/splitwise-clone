const { PutObjectCommand } = require('@aws-sdk/client-s3');
const s3 = require('../../src/utils/aws.js');
const { uploadFileToS3 } = require('../../src/helpers/aws.helper.js');

jest.mock('../../src/utils/aws.js', () => ({
  send: jest.fn(),
}));

describe('AWS Helper - uploadFileToS3', () => {
  const mockFile = {
    originalname: 'test-image.jpg',
    mimetype: 'image/jpeg',
    buffer: Buffer.from('test file buffer'),
  };

  const mockEnv = {
    S3_BUCKET_NAME: 'test-bucket',
    AWS_REGION: 'us-east-1',
  };

  beforeAll(() => {
    process.env.S3_BUCKET_NAME = mockEnv.S3_BUCKET_NAME;
    process.env.AWS_REGION = mockEnv.AWS_REGION;
  });

  afterAll(() => {
    delete process.env.S3_BUCKET_NAME;
    delete process.env.AWS_REGION;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should upload a file to S3 and return its URL', async () => {
    s3.send.mockResolvedValue({ ETag: '"mock-etag"' });

    const result = await uploadFileToS3(mockFile);

    expect(result).toMatch(
      new RegExp(
        `^https://${mockEnv.S3_BUCKET_NAME}.s3.${mockEnv.AWS_REGION}.amazonaws.com/\\d+-test-image\\.jpg$`,
      ),
    );
    expect(s3.send).toHaveBeenCalledWith(expect.any(PutObjectCommand));
  });

  it('should throw an error if S3 upload fails', async () => {
    s3.send.mockRejectedValue(new Error('Mock S3 Error'));

    await expect(uploadFileToS3(mockFile)).rejects.toThrow(
      'Error uploading file to S3: Mock S3 Error',
    );
  });

  it('should throw an error if required environment variables are missing', async () => {
    delete process.env.S3_BUCKET_NAME;

    process.env.S3_BUCKET_NAME = mockEnv.S3_BUCKET_NAME;
  });

  it('should generate a unique key for each upload', async () => {
    s3.send.mockResolvedValue({ ETag: '"mock-etag"' });

    const firstUpload = await uploadFileToS3(mockFile);
    const secondUpload = await uploadFileToS3(mockFile);

    expect(firstUpload).not.toEqual(secondUpload);
    expect(s3.send).toHaveBeenCalledTimes(2);
  });
});
