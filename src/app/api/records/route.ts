import { prisma } from '@/lib/prisma';
import { DateTime } from 'luxon';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const dateStr = searchParams.get('date');

  let dateFilter = {};
  
  if (dateStr) {
    // Parse the requested date (e.g., "2024-05-10")
    const startOfDay = DateTime.fromISO(dateStr).startOf('day').toJSDate();
    const endOfDay = DateTime.fromISO(dateStr).endOf('day').toJSDate();

    dateFilter = {
      filingDate: {
        gte: startOfDay,
        lte: endOfDay,
      }
    };
  }

  try {
    const records = await prisma.tradeRecord.findMany({
      where: dateFilter,
      orderBy: {
        value: 'desc' // Order by highest value first
      },
      take: 20 // Always limit to top 20
    });

    return Response.json({ records });
  } catch (error) {
    console.error('Error fetching records:', error);
    return Response.json({ error: 'Failed to fetch records' }, { status: 500 });
  }
}
