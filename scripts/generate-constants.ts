import { config } from "dotenv";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

// Load environment variables from .env or .env.local
config();

// ES module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function generateConstants() {
  console.log("Generating constants from database...");
  // console.log(
  //   "Environment variables loaded:",
  //   Object.keys(process.env).filter((key) => key.includes("DATABASE")),
  // );

  try {
    // Connect directly to database
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      console.error(
        "Available environment variables:",
        Object.keys(process.env),
      );
      throw new Error("DATABASE_URL not found in environment");
    }

    const client = postgres(connectionString);
    const db = drizzle(client);

    // Fetch data directly with SQL queries from the app schema
    const mountsData = await client`SELECT * FROM app.mounts`;
    const sensorFormatsData = await client`SELECT * FROM app.sensor_formats`;
    const brandsData = await client`SELECT * FROM app.brands`;
    const genresData = await client`SELECT * FROM app.genres`;

    const content = `// Auto-generated constants from database
export const MOUNTS = ${JSON.stringify(mountsData, null, 2)};
export const SENSOR_FORMATS = ${JSON.stringify(sensorFormatsData, null, 2)};
export const BRANDS = ${JSON.stringify(brandsData, null, 2)};
export const GENRES = ${JSON.stringify(genresData, null, 2)};
`;

    const outputPath = join(__dirname, "../src/lib/generated.ts");
    writeFileSync(outputPath, content);

    await client.end();
    console.log("✅ Constants generated successfully!");
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

generateConstants();
