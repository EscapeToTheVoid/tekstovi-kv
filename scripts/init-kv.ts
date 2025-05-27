require('dotenv').config({ path: '.env.local' });
const { kv } = require('@vercel/kv');
const fs = require('fs');
const path = require('path');

interface SongsData {
  [title: string]: string;
}

async function initializeKV() {
  try {
    // Read the JSON file
    const jsonPath = path.join(process.cwd(), 'data', 'MAYDAY_songs.json');
    const songsData = JSON.parse(fs.readFileSync(jsonPath, 'utf-8')) as SongsData;

    // Store the songs in KV
    console.log('Storing songs in Vercel KV...');
    await kv.set('songs', songsData);
    console.log('Successfully initialized Vercel KV with songs data!');
    
    // Verify the data was stored correctly
    const storedSongs = await kv.get('songs') as SongsData;
    console.log(`Stored ${Object.keys(storedSongs || {}).length} songs`);
  } catch (error) {
    console.error('Error initializing KV:', error);
    process.exit(1);
  }
}

// Temporary script to fetch and log the contents of the 'songs' key
async function verifyKVData() {
  try {
    const storedSongs = await kv.get('songs') as SongsData;
    console.log('Current KV data:', storedSongs);
  } catch (error) {
    console.error('Error fetching KV data:', error);
  }
}

// Uncomment the line below to run the verification
verifyKVData();

initializeKV(); 