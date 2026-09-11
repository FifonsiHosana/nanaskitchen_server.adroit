import { defineConfig } from "drizzle-kit";

export default defineConfig({
  out: "./db",
  schema: "./db/schema.ts",
  dialect: "mysql",
  dbCredentials: {
    host: process.env.DB_HOST as string,
    user: process.env.DB_USER as string,
    password: process.env.DB_PASSWORD as string,
    database: process.env.DATABASE_NAME as string,
  },
  verbose: true,
  strict: true,
});
