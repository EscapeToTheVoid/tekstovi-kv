import { NextResponse } from 'next/server';
import { kv } from '@vercel/kv';

interface SongsData {
  [key: string]: string;
}

async function readSongs(): Promise<SongsData> {
  try {
    console.log('Reading songs from KV...');
    const songs = await kv.get<SongsData>('songs');
    console.log('Songs read from KV:', songs);
    return songs || {};
  } catch (error) {
    console.error('Error reading songs:', error);
    return {};
  }
}

async function writeSongs(songs: SongsData) {
  try {
    console.log('Writing songs to KV:', songs);
    await kv.set('songs', songs);
    console.log('Songs written to KV successfully');
  } catch (error) {
    console.error('Error writing songs:', error);
    throw error;
  }
}

export async function GET() {
  try {
    console.log('Fetching songs from KV...');
    const songs = await kv.get<SongsData>('songs');
    console.log('Fetched songs:', songs);
    return NextResponse.json(songs);
  } catch (error) {
    console.error('Error fetching songs:', error);
    return NextResponse.json({ error: 'Failed to fetch songs' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const song = await request.json();
    console.log('Received song to save:', song);

    // Get existing songs
    const existingSongs = (await kv.get<SongsData>('songs')) || {};
    console.log('Existing songs:', existingSongs);

    // Check for duplicate
    if (existingSongs[song.title]) {
      console.log('Duplicate song found:', song.title);
      return NextResponse.json({ error: 'Song already exists' }, { status: 400 });
    }

    // Add new song
    const updatedSongs = { ...existingSongs, [song.title]: song.lyrics };
    console.log('Saving updated songs:', updatedSongs);
    await kv.set('songs', updatedSongs);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving song:', error);
    return NextResponse.json({ error: 'Failed to save song' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { title } = await request.json();
    const songs = await readSongs();

    if (!songs[title]) {
      return NextResponse.json(
        { error: 'Song not found' },
        { status: 404 }
      );
    }

    delete songs[title];
    await writeSongs(songs);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting song:', error);
    return NextResponse.json(
      { error: 'Failed to delete song' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const { oldTitle, newTitle } = await request.json();
    const songs = await readSongs();

    if (!songs[oldTitle]) {
      return NextResponse.json(
        { error: 'Song not found' },
        { status: 404 }
      );
    }

    if (songs[newTitle]) {
      return NextResponse.json(
        { error: 'New title already exists' },
        { status: 400 }
      );
    }

    songs[newTitle] = songs[oldTitle];
    delete songs[oldTitle];
    await writeSongs(songs);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating song title:', error);
    return NextResponse.json(
      { error: 'Failed to update song title' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const { title, lyrics } = await request.json();
    const songs = await readSongs();

    if (!songs[title]) {
      return NextResponse.json(
        { error: 'Song not found' },
        { status: 404 }
      );
    }

    songs[title] = lyrics;
    await writeSongs(songs);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating lyrics:', error);
    return NextResponse.json(
      { error: 'Failed to update lyrics' },
      { status: 500 }
    );
  }
} 