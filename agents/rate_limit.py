import os
import time
import threading


class DailyQuota:
    def __init__(self, max_per_day: int):
        self.max_per_day = max_per_day
        self.count = 0
        self.day_start = time.time()
        self.lock = threading.Lock()

    def check_and_increment(self) -> bool:
        with self.lock:
            now = time.time()
            if now - self.day_start > 86400:
                self.count = 0
                self.day_start = now
            if self.count >= self.max_per_day:
                return False
            self.count += 1
            return True


daily_quota = DailyQuota(max_per_day=int(os.environ.get("DAILY_GEMINI_QUOTA", "200")))
