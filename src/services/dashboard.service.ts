import { getDashboardCounts as getDashboardCountsRepository } from "../repositories/dashboard.repository.js";

import type { DashboardCounts } from "../types/dashboard.types.js";

export const getDashboardCounts = async (): Promise<DashboardCounts> => {
  return getDashboardCountsRepository();
};
