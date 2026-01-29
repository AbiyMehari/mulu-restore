import 'dotenv/config';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

// Ensure .env.local is loaded for local development
dotenv.config({ path: '.env.local', override: true });

import connectDB from '@/lib/db';
import User from '@/models/User';
import Category from '@/models/Category';

const ADMIN_EMAIL = 'admin@mulu-restore.local';
const ADMIN_PASSWORD = 'Admin123!';

async function ensureAdminUser() {
  console.log(`\n[seed] Ensuring admin user exists: ${ADMIN_EMAIL}`);

  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);

  await User.findOneAndUpdate(
    { email: ADMIN_EMAIL },
    {
      $set: {
        email: ADMIN_EMAIL,
        name: 'Mulu ReStore Admin',
        role: 'admin',
        passwordHash,
        addresses: [],
        wishlist: [],
      },
    },
    { upsert: true }
  );

  console.log('[seed] Admin user upserted successfully.');
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

    // Final summary
    console.log('\n--- Seed summary ---');
    console.log('Admin email:', ADMIN_EMAIL);
    console.log('Admin password:', ADMIN_PASSWORD);
    console.log('Categories: Chairs, Tables, Sofas, Storage');
    console.log('---\n');
  } catch (error) {
    console.error('\n[seed] Seeding failed:', error);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
    console.log('[seed] MongoDB connection closed.');
  }
}

void main();

