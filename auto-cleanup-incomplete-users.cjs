#!/usr/bin/env node

/**
 * Auto Cleanup Incomplete Users
 * Deletes users with null/incomplete data after 3 minutes of creation
 */

const { Client, Databases, Query } = require('node-appwrite');
require('dotenv').config({ path: '.env.local' });

const client = new Client()
  .setEndpoint(process.env.VITE_APPWRITE_ENDPOINT || 'https://nyc.cloud.appwrite.io/v1')
  .setProject(process.env.VITE_APPWRITE_PROJECT_ID || '68db5335002a5780ae9a')
  .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);

const DATABASE_ID = 'ucera_main_db';
const USERS_COLLECTION = 'users';
const CLEANUP_DELAY_MINUTES = 3; // 3 minutes

/**
 * Check if user data is incomplete
 */
function isIncomplete(user) {
  // Consider user incomplete if any of these critical fields are missing
  const checks = {
    name: !user.full_name,
    photo: !user.public_photo,
    memberCard: !user.has_member_card,
    dateOfBirth: !user.date_of_birth
  };
  
  // User is incomplete if they're missing photo OR member card
  // (Name and DOB might be filled during registration)
  return !user.public_photo || !user.has_member_card;
}

/**
 * Check if user is older than specified minutes
 */
function isOlderThan(createdAt, minutes) {
  const created = new Date(createdAt);
  const now = new Date();
  const diffMinutes = (now - created) / (1000 * 60);
  return diffMinutes >= minutes;
}

/**
 * Main cleanup function
 */
async function cleanupIncompleteUsers() {
  console.log('🧹 AUTO CLEANUP: Starting incomplete users cleanup...\n');
  console.log(`⏰ Deletion criteria: Incomplete data + older than ${CLEANUP_DELAY_MINUTES} minutes\n`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  try {
    // Fetch all users
    const response = await databases.listDocuments(
      DATABASE_ID,
      USERS_COLLECTION,
      [Query.limit(100)]
    );
    
    console.log(`📊 Total users in database: ${response.documents.length}\n`);
    
    // Find incomplete users older than 3 minutes
    const toDelete = [];
    const toKeep = [];
    
    for (const user of response.documents) {
      const incomplete = isIncomplete(user);
      const old = isOlderThan(user.$createdAt, CLEANUP_DELAY_MINUTES);
      
      if (incomplete && old) {
        toDelete.push(user);
      } else {
        toKeep.push(user);
      }
    }
    
    console.log(`✅ Users to keep: ${toKeep.length}`);
    console.log(`🗑️  Users to delete: ${toDelete.length}\n`);
    
    if (toDelete.length === 0) {
      console.log('✅ No incomplete users found. Database is clean!\n');
      return;
    }
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('🗑️  DELETING INCOMPLETE USERS:\n');
    
    let deleted = 0;
    let failed = 0;
    
    for (const user of toDelete) {
      const age = Math.round((new Date() - new Date(user.$createdAt)) / (1000 * 60));
      
      console.log(`   🗑️  ${user.full_name || 'NO NAME'} (${user.email || 'NO EMAIL'})`);
      console.log(`      ID: ${user.$id}`);
      console.log(`      Age: ${age} minutes`);
      console.log(`      Missing: ${!user.public_photo ? 'Photo ' : ''}${!user.has_member_card ? 'Member Card' : ''}`);
      
      try {
        await databases.deleteDocument(
          DATABASE_ID,
          USERS_COLLECTION,
          user.$id
        );
        console.log('      ✅ Deleted!\n');
        deleted++;
      } catch (err) {
        console.log(`      ❌ Failed: ${err.message}\n`);
        failed++;
      }
    }
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('📊 CLEANUP SUMMARY:\n');
    console.log(`   ✅ Successfully deleted: ${deleted} users`);
    if (failed > 0) {
      console.log(`   ❌ Failed to delete: ${failed} users`);
    }
    console.log(`   📋 Remaining users: ${toKeep.length}\n`);
    
    console.log('✅ Cleanup completed!\n');
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error.message);
    process.exit(1);
  }
}

// Run immediately
cleanupIncompleteUsers()
  .then(() => {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('💡 TIP: Run this script periodically to auto-cleanup:');
    console.log('   node auto-cleanup-incomplete-users.cjs\n');
    console.log('   Or set up a cron job:');
    console.log('   */5 * * * * cd /path/to/project && node auto-cleanup-incomplete-users.cjs\n');
    process.exit(0);
  })
  .catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  });

