import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";
import timezone from "dayjs/plugin/timezone.js";

dayjs.extend(utc);
dayjs.extend(timezone);

const tz = "Asia/Ho_Chi_Minh";

export function formatUTCtzHCM(time) {
  return dayjs(time).tz(tz).format();
}
