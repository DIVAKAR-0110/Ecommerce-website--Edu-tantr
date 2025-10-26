// checkStorage.js - Simple MongoDB Storage Checker (Fixed)
import mongoose from 'mongoose';

const MONGODB_URI = "mongodb+srv://arusuvai_user:pass_word@cluster0.2djnh8o.mongodb.net/e-commerce?retryWrites=true&w=majority&appName=Cluster0";

async function checkStorage() {
  try {
    console.log('\n🔍 Connecting to MongoDB Atlas...\n');
    
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected!\n');

    const db = mongoose.connection.db;

    // Get database statistics
    const dbStats = await db.stats();

    // Get GridFS file count (without using .stats())
    const filesCollection = db.collection('uploads.files');
    const chunksCollection = db.collection('uploads.chunks');
    
    const fileCount = await filesCollection.countDocuments();
    const chunkCount = await chunksCollection.countDocuments();
    
    // Estimate GridFS storage from fs.files metadata
    const files = await filesCollection.find({}).toArray();
    let totalFileSize = 0;
    files.forEach(file => {
      totalFileSize += file.length || 0;
    });

    // Calculate storage
    const totalStorageBytes = dbStats.storageSize;
    const totalStorageMB = (totalStorageBytes / (1024 * 1024)).toFixed(2);
    const dataSizeMB = (dbStats.dataSize / (1024 * 1024)).toFixed(2);
    
    const gridfsStorageMB = (totalFileSize / (1024 * 1024)).toFixed(2);

    const FREE_TIER_LIMIT_MB = 512;
    const usedPercent = ((totalStorageMB / FREE_TIER_LIMIT_MB) * 100).toFixed(2);
    const remainingMB = (FREE_TIER_LIMIT_MB - totalStorageMB).toFixed(2);

    // Display results
    console.log('═══════════════════════════════════════════════════════');
    console.log('              📊 STORAGE STATISTICS');
    console.log('═══════════════════════════════════════════════════════');
    console.log('');
    console.log('💾 TOTAL STORAGE');
    console.log(`   Used:       ${totalStorageMB} MB`);
    console.log(`   Data Size:  ${dataSizeMB} MB`);
    console.log(`   Limit:      ${FREE_TIER_LIMIT_MB} MB (Free Tier)`);
    console.log(`   Remaining:  ${remainingMB} MB`);
    console.log(`   Percentage: ${usedPercent}%`);
    console.log('');
    
    // Status indicator
    if (usedPercent > 90) {
      console.log('⚠️  STATUS: 🔴 CRITICAL - Storage almost full!');
    } else if (usedPercent > 70) {
      console.log('⚠️  STATUS: 🟡 WARNING - Storage usage high');
    } else {
      console.log('✅ STATUS: 🟢 GOOD - Storage usage normal');
    }
    console.log('');

    console.log('📁 GRIDFS FILES');
    console.log(`   Files:      ${fileCount}`);
    console.log(`   Chunks:     ${chunkCount}`);
    console.log(`   Storage:    ${gridfsStorageMB} MB`);
    console.log('');

    console.log('📊 DATABASE INFO');
    console.log(`   Collections: ${dbStats.collections}`);
    console.log(`   Indexes:     ${dbStats.indexes}`);
    console.log(`   Objects:     ${dbStats.objects}`);
    console.log('');
    console.log('═══════════════════════════════════════════════════════');
    console.log('');

    // Progress bar
    const barWidth = 50;
    const filled = Math.floor((usedPercent / 100) * barWidth);
    const empty = barWidth - filled;
    const bar = '█'.repeat(filled) + '░'.repeat(empty);
    
    console.log(`Storage Usage: [${bar}] ${usedPercent}%`);
    console.log('');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Connection closed.\n');
  }
}

// Run the checker
checkStorage();
