import { NextResponse } from 'next/server';
import { kv } from '@vercel/kv';
import { SongItem } from '@/types/songs';

export async function GET() {
  try {
    console.log('Fetching song order from KV...');
    const [order, songs] = await Promise.all([
      kv.get<SongItem[]>('songOrder'),
      kv.get<Record<string, string>>('songs')
    ]);
    console.log('Fetched order:', order);
    console.log('Fetched songs:', songs);

    // If we have songs but no order, create initial order
    if (songs && (!order || order.length === 0)) {
      const newOrder = Object.keys(songs).map(title => ({
        title,
        hidden: false
      }));
      await kv.set('songOrder', newOrder);
      return NextResponse.json(newOrder);
    }

    // If we have both songs and order, ensure all songs are in the order
    if (songs && order) {
      const songTitles = new Set(Object.keys(songs));
      const orderTitles = new Set(order.map(item => item.title));
      
      // Find songs that are not in the order
      const missingSongs = Array.from(songTitles).filter(title => !orderTitles.has(title));
      
      if (missingSongs.length > 0) {
        // Add missing songs to the order
        const updatedOrder = [
          ...order,
          ...missingSongs.map(title => ({ title, hidden: false }))
        ];
        await kv.set('songOrder', updatedOrder);
        return NextResponse.json(updatedOrder);
      }
    }

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
    
    if (!Array.isArray(order)) {
      return NextResponse.json({ error: 'Invalid order format' }, { status: 400 });
    }

    await kv.set('songOrder', order);
    console.log('Order saved successfully');
    
    return NextResponse.json({ success: true, message: 'Order saved successfully' });
  } catch (error) {
    console.error('Error saving song order:', error);
    return NextResponse.json({ error: 'Failed to save song order' }, { status: 500 });
  }
} 