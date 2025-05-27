import { NextResponse } from 'next/server';
import { kv } from '@vercel/kv';
import { SongItem } from '@/types/songs';

export async function GET() {
  try {
    console.log('Reading song order from KV...');
    const order = await kv.get<SongItem[]>('songOrder');
    console.log('Song order read from KV:', order);
    return NextResponse.json(order || []);
  } catch (error) {
    console.error('Error reading song order:', error);
    return NextResponse.json(
      { error: 'Failed to load song order' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    console.log('Saving song order to KV...');
    const order = await request.json();
    console.log('Received order:', order);
    await kv.set('songOrder', order);
    console.log('Song order saved to KV successfully');
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving song order:', error);
    return NextResponse.json(
      { error: 'Failed to save song order' },
      { status: 500 }
    );
  }
} 