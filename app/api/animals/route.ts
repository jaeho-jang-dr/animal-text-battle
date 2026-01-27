import { NextResponse } from 'next/server';
import { animalsData } from '../../../data/animals-extended';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const limit = searchParams.get('limit');

    // Assign IDs based on index + 1
    const animalsWithIds = animalsData.map((animal, index) => ({
      id: index + 1,
      ...animal
    }));

    let animals = animalsWithIds;

    if (category && category !== 'all') {
      animals = animals.filter(a => a.category === category);
    }

    // Default sorting in extended data seems grouped by category, 
    // but the SQL used to order by category, korean_name.
    // We can keep it or just return as is (which is grouped).
    // Let's sort by korean_name within category mostly
    // or just trust the order in the file as it's curated.

    if (limit) {
      animals = animals.slice(0, parseInt(limit));
    }

    // Add statistics
    const stats = {
      total: animalsWithIds.length,
      byCategory: {
        current: animalsWithIds.filter(a => a.category === 'current').length,
        mythical: animalsWithIds.filter(a => a.category === 'mythical').length,
        prehistoric: animalsWithIds.filter(a => a.category === 'prehistoric').length
      }
    };

    return NextResponse.json({
      success: true,
      data: animals,
      stats
    });
  } catch (error) {
    console.error('Animals fetch error:', error);
    return NextResponse.json({
      success: false,
      error: '동물 데이터를 불러오는 중 오류가 발생했습니다'
    }, { status: 500 });
  }
}
