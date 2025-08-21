import { parseUnits } from "viem";

export const ONE_WEEK_SECONDS = 7 * 24 * 60 * 60;
export const ONE_MONTH_SECONDS = (7 * 4) * 24 * 60 * 60;
export const COOLDOWN_TIME = 60 * 1000; // 1 hour
export const LAST_REFRESH_KEY = 'last_soft_refresh';
export const BASE_PRICE = parseUnits('0.000001', 18)
export const SLOPE = parseUnits('0.0000005', 18)  