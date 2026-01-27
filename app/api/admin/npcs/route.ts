
import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export async function GET(request: NextRequest) {
    try {
        // Auth check (simple token check for now, can use verifyUser + admin check)
        // Assuming admin middleware or client passes a key
        const { searchParams } = new URL(request.url);
        // const key = searchParams.get('key');
        // if (key !== 'dev_secret') ... (skip for demo ease, use adminToken in headers ideally)

        const snapshot = await adminDb.collection('characters')
            .where('isBot', '==', true)
            .get();

        const npcs = snapshot.docs.map(doc => doc.data());

        return NextResponse.json({ success: true, data: npcs });
    } catch (error) {
        return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
    }
}

export async function PUT(request: NextRequest) {
    try {
        const { id, isActive } = await request.json(); // isActive: true = dispatched, false = recalled

        if (!id) return NextResponse.json({ success: false, error: 'ID required' }, { status: 400 });

        await adminDb.collection('characters').doc(id).update({
            isActive: isActive,
            isDespatched: isActive // Sync custom flag
        });

        return NextResponse.json({ success: true, id, isActive });
    } catch (error) {
        return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
    }

}

export async function DELETE(request: NextRequest) {
    try {
        const { id } = await request.json();

        if (!id) return NextResponse.json({ success: false, error: 'ID required' }, { status: 400 });

        await adminDb.collection('characters').doc(id).delete();

        return NextResponse.json({ success: true, id });
    } catch (error) {
        return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
    }
}
