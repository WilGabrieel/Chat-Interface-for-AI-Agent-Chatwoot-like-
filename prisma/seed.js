const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seeding...');

  // Clear existing data (dev only)
  try {
    await prisma.message.deleteMany({});
    console.log('Cleared messages');

    await prisma.conversation.deleteMany({});
    console.log('Cleared conversations');

    await prisma.contact.deleteMany({});
    console.log('Cleared contacts');

    await prisma.refreshToken.deleteMany({});
    console.log('Cleared refresh tokens');

    await prisma.user.deleteMany({});
    console.log('Cleared users');
  } catch (error) {
    console.log('No existing data to clear or error clearing:', error.message);
  }

  // Create test users with hashed password
  const hashedPassword = await bcrypt.hash('TestPassword123', 10);

  console.log('Creating test users...');
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@example.com',
      passwordHash: hashedPassword,
      name: 'Admin User',
      role: 'admin',
    },
  });
  console.log('Created admin user:', adminUser.email);

  const supervisorUser = await prisma.user.create({
    data: {
      email: 'supervisor@example.com',
      passwordHash: hashedPassword,
      name: 'Supervisor User',
      role: 'supervisor',
    },
  });
  console.log('Created supervisor user:', supervisorUser.email);

  // Create test contact
  console.log('Creating test contact...');
  const contact = await prisma.contact.create({
    data: {
      phone: '5585987654321',
      name: 'Maria Silva',
      avatarUrl: null,
      tags: JSON.stringify(['importante', 'vip']),
    },
  });
  console.log('Created contact:', contact.name);

  // Create test conversation
  console.log('Creating test conversation...');
  const conversation = await prisma.conversation.create({
    data: {
      contactId: contact.id,
      assignedToId: supervisorUser.id,
      status: 'active',
      lastMessageAt: new Date(),
    },
  });
  console.log('Created conversation:', conversation.id);

  // Create test messages
  console.log('Creating test messages...');
  const message1 = await prisma.message.create({
    data: {
      conversationId: conversation.id,
      sender: 'contact',
      content: 'Olá, tudo bem?',
      messageType: 'text',
      metadata: JSON.stringify({ confidence: 0.95 }),
    },
  });
  console.log('Created message from contact');

  const message2 = await prisma.message.create({
    data: {
      conversationId: conversation.id,
      sender: 'agent',
      content: 'Oi Maria! Tudo certo por aqui. Como posso ajudar?',
      messageType: 'text',
      metadata: JSON.stringify({ confidence: 0.92, intent: 'greeting' }),
    },
  });
  console.log('Created message from agent');

  // Create a refresh token for testing
  console.log('Creating test refresh token...');
  const refreshToken = await prisma.refreshToken.create({
    data: {
      userId: adminUser.id,
      token: 'test-refresh-token-' + Math.random().toString(36).substring(2, 15),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    },
  });
  console.log('Created refresh token');

  console.log('\n✅ Seeding complete!');
  console.log('\nTest Users:');
  console.log('  Admin: admin@example.com / TestPassword123');
  console.log('  Supervisor: supervisor@example.com / TestPassword123');
  console.log('\nTest Contact:');
  console.log('  Phone: 5585987654321');
  console.log('  Name: Maria Silva');
  console.log('\nTest Conversation:');
  console.log('  ID:', conversation.id);
  console.log('  Status: active');
  console.log('  Messages: 2 (1 from contact, 1 from agent)');
}

main()
  .then(async () => {
    await prisma.$disconnect();
    process.exit(0);
  })
  .catch(async (e) => {
    console.error('Seeding error:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
