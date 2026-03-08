const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const records = await prisma.tradeRecord.findMany({ take: 2 });
  console.log(JSON.stringify(records, null, 2));
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
