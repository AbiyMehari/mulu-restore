import 'dotenv/config';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

// Ensure .env.local is loaded for local development
dotenv.config({ path: '.env.local', override: true });

import connectDB from '@/lib/db';
import User from '@/models/User';
import Category from '@/models/Category';

async function ensureAdminUser() {
  const adminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@mulu-restore.local';
  const adminPassword =
    process.env.SEED_ADMIN_PASSWORD || 'changeme-admin-password';

  console.log(`\n[seed] Ensuring admin user exists: ${adminEmail}`);

  const existing = await User.findOne({ email: adminEmail });

  if (existing) {
    console.log('[seed] Admin user already exists, skipping creation.');
    return;
  }

  const passwordHash = await bcrypt.hash(adminPassword, 10);

  await User.create({
    email: adminEmail,
    name: 'Mulu ReStore Admin',
    role: 'admin',
    passwordHash,
    addresses: [],
    wishlist: [],
  });

  console.log('[seed] Admin user created successfully.');
}

async function ensureDefaultCategories() {
  const defaultCategories = [
    { name: 'Chairs', slug: 'chairs' },
    { name: 'Tables', slug: 'tables' },
    { name: 'Sofas', slug: 'sofas' },
    { name: 'Storage', slug: 'storage' },
  ];

  console.log('\n[seed] Ensuring default categories exist...');

  for (const { name, slug } of defaultCategories) {
    const existing = await Category.findOne({ slug });

    if (existing) {
      console.log(`[seed] Category "${slug}" already exists, skipping.`);
      continue;
    }

    await Category.create({ name, slug });
    console.log(`[seed] Created category "${slug}".`);
  }

  console.log('[seed] Category seeding completed.');
}

async function main() {
  console.log('[seed] Starting database seed...');

  try {
    await connectDB();
    console.log('[seed] Connected to MongoDB.');

    await ensureAdminUser();
    await ensureDefaultCategories();

    console.log('\n[seed] Seeding completed successfully.');
  } catch (error) {
    console.error('\n[seed] Seeding failed:', error);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
    console.log('[seed] MongoDB connection closed.');
  }
}

void main();

