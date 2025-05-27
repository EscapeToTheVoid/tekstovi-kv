import { NextResponse } from 'next/server';
import { kv } from '@vercel/kv';
import { SongItem } from '@/types/songs';

export async function GET() {
  try {
    console.log('Fetching song order from KV...');
    const order = await kv.get<SongItem[]>('songOrder');
    console.log('Fetched order:', order);
    return NextResponse.json(order || []);
  } catch (error) {
    console.error('Error fetching song order:', error);
    return NextResponse.json({ error: 'Failed to fetch song order' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const order = await request.json();
    console.log('Received order to save:', order);
    await kv.set('songOrder', order);
    console.log('Order saved successfully');
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving song order:', error);
    return NextResponse.json({ error: 'Failed to save song order' }, { status: 500 });
  }
} 