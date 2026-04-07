import "dotenv/config";
import { Pool } from 'pg';
import prisma from './lib/prisma.ts'

console.log("Password type:", typeof process.env.DB_PASSWORD);
console.log("Password value exists:", !!process.env.DB_PASSWORD);

const pool = new Pool({
 connectionString: process.env.DATABASE_URL
});

async function testConnection() {
  try {
    console.log("Attempting to connect to PostgreSQL...");
    
    const res = await pool.query('SELECT NOW()');
    
    console.log("✅ Database Connection Successful!");
    console.log("Server Time:", res.rows[0].now);

    console.log("Checking Prisma...");
    const dbResult = await prisma.$queryRaw`SELECT now()`;
    console.log("✅ Database Connected! Server time:", dbResult);
  } catch (err) {
    console.error("❌ Connection Failed!");
    console.error("Error Message:", err.message);
  } finally {
    await pool.end();
  }
}

testConnection();

export default pool;