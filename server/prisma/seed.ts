import { PrismaClient } from '../src/generated/prisma/index.js';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
    throw new Error('DATABASE_URL is not set');
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
    console.log('🌱 Seeding database...');

    const adminPassword = await bcrypt.hash('Admin@123', 10);
    const userPassword = await bcrypt.hash('User@123', 10);

    const admin = await prisma.user.upsert({
        where: { email: 'admin@taskmanager.com' },
        update: {},
        create: {
            name: 'Admin User',
            email: 'admin@taskmanager.com',
            password: adminPassword,
            role: 'ADMIN',
        },
    });

    const user1 = await prisma.user.upsert({
        where: { email: 'john@taskmanager.com' },
        update: {},
        create: {
            name: 'John Doe',
            email: 'john@taskmanager.com',
            password: userPassword,
            role: 'USER',
        },
    });

    const user2 = await prisma.user.upsert({
        where: { email: 'jane@taskmanager.com' },
        update: {},
        create: {
            name: 'Jane Smith',
            email: 'jane@taskmanager.com',
            password: userPassword,
            role: 'USER',
        },
    });

    console.log('✅ Seeded users:');
    console.log(`   Admin: ${admin.email} (password: Admin@123)`);
    console.log(`   User1: ${user1.email} (password: User@123)`);
    console.log(`   User2: ${user2.email} (password: User@123)`);
}

main()
    .catch((e) => {
        console.error('❌ Seed failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
