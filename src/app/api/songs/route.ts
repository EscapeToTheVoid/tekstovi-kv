import { NextResponse } from 'next/server';
import { kv } from '@vercel/kv';

interface SongData {
  [title: string]: string;
}

async function readSongs(): Promise<SongData> {
  try {
    const songs = await kv.get<SongData>('songs');
    return songs || {};
  } catch (error) {
    console.error('Error reading songs:', error);
    return {};
  }
}

async function writeSongs(songs: SongData) {
  try {
    await kv.set('songs', songs);
  } catch (error) {
    console.error('Error writing songs:', error);
    throw error;
  }
}

export async function GET() {
  try {
    const songs = await readSongs();
    return NextResponse.json(songs);
  } catch (error) {
    console.error('Error loading songs:', error);
    return NextResponse.json(
      { error: 'Failed to load songs' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { title, lyrics } = await request.json();
    const songs = await readSongs();

    if (songs[title]) {
      return NextResponse.json(
        { error: 'Song already exists' },
        { status: 400 }
      );
    }

    songs[title] = lyrics;
    await writeSongs(songs);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error adding song:', error);
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