import { NextResponse } from 'next/server';
import { getAggregatedData } from '@/lib/api';

// GET /api/analytics/general - Aggregated analytics across all events
export async function GET() {
    try {
        const data = await getAggregatedData();
        return NextResponse.json({ success: true, data });
    } catch (error: any) {
        console.error('Error fetching general analytics:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Failed to fetch general analytics' },
            { status: 500 }
        );
    }
}
