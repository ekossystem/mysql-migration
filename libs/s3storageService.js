const AWS = require("aws-sdk");

const s3Option = {
  region: process.env.AWS_REGION,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
};
// if (process.env.AWS_ENDPOINT) {
//   s3Option.endpoint = process.env.AWS_ENDPOINT;
//   s3Option.s3ForcePathStyle = true; // penting untuk Cloudflare R2 / MinIO
// }
const s3 = new AWS.S3(s3Option);

async function uploadToS3(bucket, key, buffer, mimetype) {
  return s3
    .upload({
      Bucket: bucket,
      Key: key,
      Body: buffer,
      ContentType: mimetype || "application/octet-stream",
    })
    .promise();
}

async function deleteFromS3(bucket, key) {
  return s3
    .deleteObject({
      Bucket: bucket,
      Key: key,
    })
    .promise();
}

// async function getFromS3(bucket, key) {
//   return s3
//     .getObject({
//       Bucket: bucket,
//       Key: key,
//     })
//     .promise();
// }
function getFromS3(bucket, key) {
  return s3.getObject({ Bucket: bucket, Key: key }).createReadStream();
}

module.exports = {
  uploadToS3,
  deleteFromS3,
  getFromS3,
};
