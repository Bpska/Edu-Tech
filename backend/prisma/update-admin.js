// Safe admin credential update — does NOT delete any data
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  const newEmail    = 'bpskar2@gmail.com';
  const newPassword = '1234567';
  const newName     = 'Admin';

  const passwordHash = await bcrypt.hash(newPassword, 10);

  // Try to find existing admin
  const existingAdmin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });

  if (existingAdmin) {
    // Update the existing admin's credentials
    await prisma.user.update({
      where: { id: existingAdmin.id },
      data: { email: newEmail, password_hash: passwordHash, name: newName },
    });
    console.log(`✅ Admin credentials updated: ${newEmail}`);
  } else {
    // No admin found — create one
    await prisma.user.create({
      data: { email: newEmail, password_hash: passwordHash, name: newName, role: 'ADMIN' },
    });
    console.log(`✅ Admin user created: ${newEmail}`);
  }
}

main()
  .catch((e) => { console.error('❌ Error:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
