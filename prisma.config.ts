import "dotenv/config";
import { defineConfig, env } from "prisma/config";

type PrismaEnv = {
  DIRECT_DATABASE_URL: string;
};

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: env<PrismaEnv>("DIRECT_DATABASE_URL"),
  },
});