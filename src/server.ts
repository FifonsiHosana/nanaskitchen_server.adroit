import express, { Application } from "express";
import "dotenv/config";
import cookieParser from "cookie-parser";
import v1_routes from "./routes/V1/index";
import v2_routes from "./routes/V2/index";
import { db } from "./models/db_connection";
import { sql } from "drizzle-orm";
import cors from "cors";
// import { seedRoles } from "./role.seed";

const app: Application = express();

app.use(cookieParser());

// app.use(cors());

// app.use(
//   cors({
//     origin: process.env.FRONT,
//     credentials: true,
//   }),
// );
app.use(
  cors({
    origin: [
      process.env.ALLOWED_ORIGIN_1,
      process.env.ALLOWED_ORIGIN_2,
      process.env.ALLOWED_ORIGIN_3,
    ].filter(Boolean) as string[],
    credentials: true,
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  (
    err: Error,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction,
  ) => {
    console.error("Error:", err.message);
    res.status(500).json({ error: err.message });
  },
);

app.get("/", (_req, res) => {
  res.send("server running");
});

app.use("/api/v1", v1_routes);
app.use("/api/v2", v2_routes);

const PORT = process.env.PORT || 3000;
const isVercelRuntime = process.env.VERCEL === "1";

export default app;

const startServer = async () => {
  try {
    await db.execute(sql`SELECT 1`);
    console.log("DB connected");
  } catch (error) {
    console.error("DB connection failed during startup:", error);
    process.exit(1);
  }

  // seedDeliveryLocation();c
  // seedCountries();
  // seedCurrencies();
  // seedPriceGroup();
  // seedRoles()
  //   .then(() => process.exit(0))
  //   .catch((err) => {
  //     console.error("Seed failed:", err);
  //     process.exit(1);
  //   });

  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
};

if (!isVercelRuntime) {
  void startServer();
}
