import {
  AgentType,
  DeliveryStatus,
  MessageRole,
  OrderStatus,
  PaymentStatus,
  Prisma,
  PrismaClient,
  RefundStatus,
} from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Clean existing data in dependency-safe order
  await prisma.message.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.order.deleteMany();
  await prisma.user.deleteMany();

  const user = await prisma.user.create({
    data: {
      email: 'demo@mass.dev',
      name: 'Demo User',
    },
  });

  const order1 = await prisma.order.create({
    data: {
      userId: user.id,
      externalId: 'ORD-1001',
      status: OrderStatus.SHIPPED,
      deliveryStatus: DeliveryStatus.IN_TRANSIT,
      totalAmount: new Prisma.Decimal(129.99),
      currency: 'USD',
    },
  });

  const order2 = await prisma.order.create({
    data: {
      userId: user.id,
      externalId: 'ORD-1002',
      status: OrderStatus.DELIVERED,
      deliveryStatus: DeliveryStatus.DELIVERED,
      totalAmount: new Prisma.Decimal(59.5),
      currency: 'USD',
    },
  });

  await prisma.payment.createMany({
    data: [
      {
        userId: user.id,
        orderId: order1.id,
        amount: new Prisma.Decimal(129.99),
        currency: 'USD',
        status: PaymentStatus.COMPLETED,
        refundStatus: RefundStatus.NONE,
      },
      {
        userId: user.id,
        orderId: order2.id,
        amount: new Prisma.Decimal(59.5),
        currency: 'USD',
        status: PaymentStatus.COMPLETED,
        refundStatus: RefundStatus.REQUESTED,
      },
    ],
  });

  // Conversation about order status
  await prisma.conversation.create({
    data: {
      userId: user.id,
      title: 'Where is my order ORD-1001?',
      messages: {
        create: [
          {
            role: MessageRole.USER,
            content: 'Hi, can you tell me the status of my order ORD-1001?',
          },
          {
            role: MessageRole.AGENT,
            agentType: AgentType.ORDER,
            content:
              'Sure! I see that order ORD-1001 has been shipped and is currently in transit.',
          },
        ],
      },
    },
  });

  // Conversation about billing / refund
  await prisma.conversation.create({
    data: {
      userId: user.id,
      title: 'Refund question for ORD-1002',
      messages: {
        create: [
          {
            role: MessageRole.USER,
            content:
              'I was double charged for my last order ORD-1002. Can I get a refund?',
          },
          {
            role: MessageRole.AGENT,
            agentType: AgentType.BILLING,
            content:
              'I see a refund has been requested for ORD-1002. It is currently pending approval.',
          },
        ],
      },
    },
  });

  // General support conversation
  await prisma.conversation.create({
    data: {
      userId: user.id,
      title: 'Help with setting up my device',
      messages: {
        create: [
          {
            role: MessageRole.USER,
            content:
              'My device is not turning on after the latest update. Can you help?',
          },
          {
            role: MessageRole.AGENT,
            agentType: AgentType.SUPPORT,
            content:
              'Absolutely. Please try holding the power button for 10 seconds and make sure it is connected to a power source.',
          },
        ],
      },
    },
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


