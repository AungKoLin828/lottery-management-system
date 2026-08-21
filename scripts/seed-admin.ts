import "dotenv/config";

import { eq } from "drizzle-orm";

import { db } from "../netlify/functions/utils/db";
import { users } from "../db/schema/users";
import { hashPassword } from "../netlify/functions/utils/auth";

async function seedAdmin() {
  const adminPhone = process.env.ADMIN_PHONE || "09123456789";

  const adminPassword = process.env.ADMIN_PASSWORD || "ChangeThisPassword123!";

  const adminUsername = process.env.ADMIN_USERNAME || "admin";

  const adminEmail = process.env.ADMIN_EMAIL || "admin@example.com";

  const adminName = process.env.ADMIN_NAME || "System Administrator";

  console.log("Checking administrator account...");

  const existingAdmin = await db
    .select()
    .from(users)
    .where(eq(users.role, "ADMIN"))
    .limit(1);

  if (existingAdmin.length > 0) {
    console.log(`Administrator already exists: ${existingAdmin[0].username}`);

    return;
  }

  const existingPhone = await db
    .select()
    .from(users)
    .where(eq(users.phone, adminPhone))
    .limit(1);

  if (existingPhone.length > 0) {
    throw new Error(`Phone number ${adminPhone} is already registered.`);
  }

  const existingUsername = await db
    .select()
    .from(users)
    .where(eq(users.username, adminUsername))
    .limit(1);

  if (existingUsername.length > 0) {
    throw new Error(`Username ${adminUsername} is already registered.`);
  }

  console.log("Hashing administrator password...");

  const passwordHash = await hashPassword(adminPassword);

  const [admin] = await db
    .insert(users)
    .values({
      username: adminUsername,
      email: adminEmail,
      passwordHash,
      fullName: adminName,
      phone: adminPhone,

      role: "ADMIN",
      status: "ACTIVE",
      isVerified: true,
    })
    .returning({
      id: users.id,
      username: users.username,
      phone: users.phone,
      role: users.role,
      status: users.status,
    });

  console.log("");
  console.log("=================================");
  console.log("Administrator created successfully");
  console.log("=================================");
  console.log(`ID:       ${admin.id}`);
  console.log(`Username: ${admin.username}`);
  console.log(`Phone:    ${admin.phone}`);
  console.log(`Role:     ${admin.role}`);
  console.log(`Status:   ${admin.status}`);
  console.log("=================================");
}

seedAdmin()
  .catch((error) => {
    console.error("Failed to create administrator:");

    console.error(error);

    process.exit(1);
  })
  .finally(() => {
    process.exit(0);
  });
