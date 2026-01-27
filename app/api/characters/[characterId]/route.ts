import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '../../../../lib/firebase-admin';

// GET: Fetch character details
export async function GET(
  request: NextRequest,
  { params }: { params: { characterId: string } }
) {
  try {
    const { characterId } = params;
    const docRef = adminDb.collection('characters').doc(characterId);
    const doc = await docRef.get();

    if (!doc.exists) {
      return NextResponse.json(
        { success: false, error: 'Character not found' },
        { status: 404 }
      );
    }

    const data = doc.data();

    // Optional: Check for soft delete if your app logic requires it
    // The prompt didn't explicitly ask to filter by isActive in GET, 
    // but usually soft-deleted items are treated as not found.
    // existing code had: WHERE c.id = ? AND c.is_active = 1
    if (data?.isActive === false) {
       return NextResponse.json(
        { success: false, error: 'Character not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { id: doc.id, ...data }
    });
  } catch (error) {
    console.error('Error fetching character:', error);
    return NextResponse.json(
      { success: false, error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// PATCH: Update character (battleText)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { characterId: string } }
) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await adminAuth.verifyIdToken(token);
    const { characterId } = params;

    const docRef = adminDb.collection('characters').doc(characterId);
    const doc = await docRef.get();

    if (!doc.exists) {
      return NextResponse.json(
        { success: false, error: 'Character not found' },
        { status: 404 }
      );
    }

    const data = doc.data();
    if (data?.userId !== decodedToken.uid) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const updates: any = {
      updatedAt: new Date().toISOString()
    };

    if (typeof body.battleText === 'string') {
      updates.battleText = body.battleText;
    }

    await docRef.update(updates);

    return NextResponse.json({
      success: true,
      message: 'Character updated successfully'
    });
  } catch (error) {
    console.error('Error updating character:', error);
    return NextResponse.json(
      { success: false, error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// DELETE: Soft delete character
export async function DELETE(
  request: NextRequest,
  { params }: { params: { characterId: string } }
) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await adminAuth.verifyIdToken(token);
    const { characterId } = params;

    const docRef = adminDb.collection('characters').doc(characterId);
    const doc = await docRef.get();

    if (!doc.exists) {
      return NextResponse.json(
        { success: false, error: 'Character not found' },
        { status: 404 }
      );
    }

    const data = doc.data();
    if (data?.userId !== decodedToken.uid) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }

    await docRef.update({
      isActive: false,
      updatedAt: new Date().toISOString()
    });

    return NextResponse.json({
      success: true,
      message: 'Character deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting character:', error);
    return NextResponse.json(
      { success: false, error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
