const express = require('express');
const router = express.Router();
const multer = require('multer');
const {
  PutObjectCommand,
  ListObjectsV2Command,
  DeleteObjectCommand,
  DeleteObjectsCommand,
  GetObjectCommand,
  HeadObjectCommand,
  HeadBucketCommand,
} = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { s3Client, BUCKET_NAME } = require('../config/s3');
const { authenticate } = require('../middleware/auth');

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
});

// All routes are protected with authentication
router.use(authenticate);

// 🧪 Test S3 connection
router.get('/test', async (req, res) => {
  try {
    const testResults = {
      timestamp: new Date().toISOString(),
      bucketName: BUCKET_NAME,
      region: process.env.AWS_REGION || 'not-set',
      tests: {},
    };

    // Test 1: Check if credentials are configured
    if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
      testResults.tests.credentials = {
        status: 'failed',
        message: 'AWS credentials not configured in environment variables',
      };
      return res.status(500).json({
        success: false,
        message: 'AWS credentials not configured',
        details: testResults,
      });
    }

    testResults.tests.credentials = {
      status: 'passed',
      message: 'AWS credentials are configured',
    };

    // Test 2: Check if bucket name is set
    if (!BUCKET_NAME) {
      testResults.tests.bucketName = {
        status: 'failed',
        message: 'S3_BUCKET_NAME not configured in environment variables',
      };
      return res.status(500).json({
        success: false,
        message: 'Bucket name not configured',
        details: testResults,
      });
    }

    testResults.tests.bucketName = {
      status: 'passed',
      message: `Bucket name is set to: ${BUCKET_NAME}`,
    };

    // Test 3: Check if bucket exists and is accessible
    try {
      const headCommand = new HeadBucketCommand({ Bucket: BUCKET_NAME });
      await s3Client.send(headCommand);

      testResults.tests.bucketAccess = {
        status: 'passed',
        message: 'Successfully connected to S3 bucket',
      };
    } catch (error) {
      testResults.tests.bucketAccess = {
        status: 'failed',
        message: `Cannot access bucket: ${error.message}`,
        error: error.name,
      };

      return res.status(500).json({
        success: false,
        message: 'Cannot access S3 bucket',
        details: testResults,
      });
    }

    // Test 4: Test list operation
    try {
      const listCommand = new ListObjectsV2Command({
        Bucket: BUCKET_NAME,
        MaxKeys: 1,
      });
      const listResult = await s3Client.send(listCommand);

      testResults.tests.listOperation = {
        status: 'passed',
        message: 'Successfully tested list operation',
        fileCount: listResult.KeyCount || 0,
      };
    } catch (error) {
      testResults.tests.listOperation = {
        status: 'failed',
        message: `List operation failed: ${error.message}`,
      };
    }

    // All tests passed
    return res.json({
      success: true,
      message: 'All S3 connection tests passed',
      details: testResults,
    });
  } catch (error) {
    console.error('S3 connection test error:', error);
    res.status(500).json({
      success: false,
      message: 'Connection test failed',
      error: error.message,
    });
  }
});

// 📁 List all objects in the bucket
router.get('/files', async (req, res) => {
  try {
    const { prefix = '', maxKeys = 1000 } = req.query;

    const command = new ListObjectsV2Command({
      Bucket: BUCKET_NAME,
      Prefix: prefix,
      MaxKeys: parseInt(maxKeys),
    });

    const response = await s3Client.send(command);

    const files = await Promise.all(
      (response.Contents || []).map(async (item) => {
        // Generate a presigned URL for each file (valid for 1 hour)
        const getCommand = new GetObjectCommand({
          Bucket: BUCKET_NAME,
          Key: item.Key,
        });
        const url = await getSignedUrl(s3Client, getCommand, { expiresIn: 3600 });

        return {
          key: item.Key,
          size: item.Size,
          lastModified: item.LastModified,
          url: url,
        };
      })
    );

    res.json({
      files,
      count: files.length,
      isTruncated: response.IsTruncated || false,
    });
  } catch (error) {
    console.error('Error listing files:', error);
    res.status(500).json({ error: 'Failed to list files', details: error.message });
  }
});

// 📤 Upload a single file
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { folder = '' } = req.body;
    const key = folder ? `${folder}/${req.file.originalname}` : req.file.originalname;

    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: req.file.buffer,
      ContentType: req.file.mimetype,
    });

    await s3Client.send(command);

    // Generate presigned URL for the uploaded file
    const getCommand = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });
    const url = await getSignedUrl(s3Client, getCommand, { expiresIn: 3600 });

    res.json({
      message: 'File uploaded successfully',
      key: key,
      size: req.file.size,
      url: url,
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({ error: 'Failed to upload file', details: error.message });
  }
});

// 📤 Upload multiple files
router.post('/upload-multiple', upload.array('files', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const { folder = '' } = req.body;
    const uploadedFiles = [];

    for (const file of req.files) {
      const key = folder ? `${folder}/${file.originalname}` : file.originalname;

      const command = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
      });

      await s3Client.send(command);

      const getCommand = new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
      });
      const url = await getSignedUrl(s3Client, getCommand, { expiresIn: 3600 });

      uploadedFiles.push({
        key: key,
        size: file.size,
        url: url,
      });
    }

    res.json({
      message: `${uploadedFiles.length} files uploaded successfully`,
      files: uploadedFiles,
    });
  } catch (error) {
    console.error('Error uploading files:', error);
    res.status(500).json({ error: 'Failed to upload files', details: error.message });
  }
});

// 🗑️ Delete a single file
router.delete('/files/:key(*)', async (req, res) => {
  try {
    const key = req.params.key;

    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    await s3Client.send(command);

    res.json({
      message: 'File deleted successfully',
      key: key,
    });
  } catch (error) {
    console.error('Error deleting file:', error);
    res.status(500).json({ error: 'Failed to delete file', details: error.message });
  }
});

// 🗑️ Delete multiple files
router.post('/delete-multiple', async (req, res) => {
  try {
    const { keys } = req.body;

    if (!keys || !Array.isArray(keys) || keys.length === 0) {
      return res.status(400).json({ error: 'No keys provided' });
    }

    const command = new DeleteObjectsCommand({
      Bucket: BUCKET_NAME,
      Delete: {
        Objects: keys.map((key) => ({ Key: key })),
      },
    });

    const response = await s3Client.send(command);

    res.json({
      message: `${keys.length} files deleted successfully`,
      deleted: response.Deleted || [],
      errors: response.Errors || [],
    });
  } catch (error) {
    console.error('Error deleting files:', error);
    res.status(500).json({ error: 'Failed to delete files', details: error.message });
  }
});

// 📊 Get bucket statistics
router.get('/stats', async (req, res) => {
  try {
    const command = new ListObjectsV2Command({
      Bucket: BUCKET_NAME,
    });

    let totalSize = 0;
    let totalFiles = 0;
    let fileTypes = {};
    let continuationToken = null;

    do {
      if (continuationToken) {
        command.input.ContinuationToken = continuationToken;
      }

      const response = await s3Client.send(command);

      if (response.Contents) {
        totalFiles += response.Contents.length;

        response.Contents.forEach((item) => {
          totalSize += item.Size;

          // Track file types
          const ext = item.Key.split('.').pop().toLowerCase();
          fileTypes[ext] = (fileTypes[ext] || 0) + 1;
        });
      }

      continuationToken = response.IsTruncated ? response.NextContinuationToken : null;
    } while (continuationToken);

    res.json({
      bucketName: BUCKET_NAME,
      totalFiles,
      totalSize,
      totalSizeFormatted: formatBytes(totalSize),
      fileTypes,
    });
  } catch (error) {
    console.error('Error getting stats:', error);
    res.status(500).json({ error: 'Failed to get bucket stats', details: error.message });
  }
});

// 🔍 Get file metadata
router.get('/files/:key(*)/metadata', async (req, res) => {
  try {
    const key = req.params.key;

    const command = new HeadObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    const response = await s3Client.send(command);

    res.json({
      key: key,
      size: response.ContentLength,
      sizeFormatted: formatBytes(response.ContentLength),
      contentType: response.ContentType,
      lastModified: response.LastModified,
      metadata: response.Metadata || {},
      etag: response.ETag,
    });
  } catch (error) {
    console.error('Error getting file metadata:', error);
    res.status(500).json({ error: 'Failed to get file metadata', details: error.message });
  }
});

// Helper function to format bytes
function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

module.exports = router;
