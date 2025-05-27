import { NextResponse } from 'next/server';
import { kv } from '@vercel/kv';

interface SongData {
  [title: string]: string;
}

async function readSongs(): Promise<SongData> {
  try {
    console.log('Reading songs from KV...');
    const songs = await kv.get<SongData>('songs');
    console.log('Songs read from KV:', songs);
    return songs || {};
  } catch (error) {
    console.error('Error reading songs:', error);
    return {};
  }
}

async function writeSongs(songs: SongData) {
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
    console.log('GET request received');
    const songs = await readSongs();
    console.log('Returning songs:', songs);
    return NextResponse.json(songs);
  } catch (error) {
    console.error('Error in GET:', error);
    return NextResponse.json(
      { error: 'Failed to load songs' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    console.log('POST request received');
    const { title, lyrics } = await request.json();
    console.log('Received data:', { title, lyrics });
    const songs = await readSongs();

    if (songs[title]) {
      console.log('Song already exists:', title);
      return NextResponse.json(
        { error: 'Song already exists' },
        { status: 400 }
      );
    }

    songs[title] = lyrics;
    await writeSongs(songs);
    console.log('Song added successfully:', title);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in POST:', error);
    return NextResponse.json(
      { error: 'Failed to add song' },
      { status: 500 }
    );
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