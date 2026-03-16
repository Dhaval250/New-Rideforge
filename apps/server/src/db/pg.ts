import { Pool } from "pg";
import { env } from "../config/env";

export const pg = new Pool({
  connectionString: env.databaseUrl,
});

export const db = {
  query: <T>(text: string, values?: unknown[]) => pg.query<T>(text, values),
};
