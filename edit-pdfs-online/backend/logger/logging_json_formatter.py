import logging
from datetime import datetime, timezone
import json
import os

class LoggingJsonFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:
        log_record = {
            "timestamp":  datetime.fromtimestamp(record.created, tz=timezone.utc).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "pathname": os.path.basename(record.pathname),
            "lineno": record.lineno,
            "funcName": record.funcName,
        }

        # Include exception info if present
        if record.exc_info:
            log_record["exception"] = self.formatException(record.exc_info)

        return json.dumps(log_record)