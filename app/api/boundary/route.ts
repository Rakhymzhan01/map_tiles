import { NextResponse } from 'next/server';
import { fetchNorthKazakhstanBoundary } from '@/lib/fetchBoundary';

export async function GET() {
  try {
    const boundary = await fetchNorthKazakhstanBoundary();
    
    return NextResponse.json({
      success: true,
      boundary
    });
  } catch (error) {
    console.error('Boundary API error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to load boundary' 
      },
      { status: 500 }
    );
  }
}