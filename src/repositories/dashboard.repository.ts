import { RowDataPacket } from "mysql2";

import pool from "../config/database.js";

import type { DashboardCounts } from "../types/dashboard.types.js";

interface CountRow extends RowDataPacket {
  total: number;
}

export const getDashboardCounts = async (): Promise<DashboardCounts> => {
  const [truckRows] = await pool.query<CountRow[]>(
    `
      SELECT COUNT(*) AS total
      FROM trucks
    `,
  );

  const [driverRows] = await pool.query<CountRow[]>(
    `
      SELECT COUNT(*) AS total
      FROM drivers
    `,
  );

  return {
    trucks: Number(truckRows[0]?.total ?? 0),
    drivers: Number(driverRows[0]?.total ?? 0),
  };
};
