import logging
import sys
import json # Added this import for json.dumps
from pythonjsonlogger import jsonlogger
from opentelemetry import trace

class TraceIdFilter(logging.Filter):
    """Auto-inject trace_id and span_id into every log record."""
    def filter(self, record):
        span = trace.get_current_span()
        ctx = span.get_span_context()
        # Renamed attributes to avoid conflict with JsonFormatter's default handling
        record.otelTraceID = format(ctx.trace_id, '032x') if ctx.is_valid else "none"
        record.otelSpanID  = format(ctx.span_id,  '016x') if ctx.is_valid else "none"
        return True

# Define a custom JsonFormatter to handle specific attributes
class CustomJsonFormatter(jsonlogger.JsonFormatter):
    def format(self, record):
        # Create a dictionary for the log record
        log_record = {
            "asctime": self.formatTime(record),
            "levelname": record.levelname,
            "name": record.name,
            "trace_id": getattr(record, "otelTraceID", None), # Use the custom attribute name
            "span_id": getattr(record, "otelSpanID", None),   # Use the custom attribute name
            "message": record.getMessage(),
        }

        # Add extra fields but don't overwrite standard ones
        # JsonFormatter typically handles this automatically, but this explicit
        # loop ensures specific handling if needed or if 'extra' is a custom dict.
        if hasattr(record, "extra"):
            for key, value in record.extra.items():
                if key not in log_record:
                    log_record[key] = value
        
        # Capture common web fields if present
        for field in ["method", "path", "status_code", "duration_ms", "client_ip"]:
            if hasattr(record, field):
                log_record[field] = getattr(record, field)
        
        # Add any other attributes from the record that are not already in log_record
        # and are not standard logging attributes that JsonFormatter would handle
        # or that we explicitly want to exclude.
        for key, value in record.__dict__.items():
            if key not in log_record and not key.startswith('_') and key not in [
                'name', 'levelname', 'pathname', 'lineno', 'funcName', 'created',
                'msecs', 'relativeCreated', 'thread', 'threadName', 'processName',
                'process', 'message', 'args', 'exc_info', 'exc_text', 'stack_info',
                'filename', 'module', 'levelno', 'msg', 'asctime', 'extra',
                'otelTraceID', 'otelSpanID' # Exclude our custom ones as they are already mapped
            ]:
                # Avoid serializing complex objects that might not be JSON-serializable
                if isinstance(value, (str, int, float, bool, type(None), list, dict)):
                    log_record[key] = value

        return json.dumps(log_record)

def setup_logging():
    handler = logging.StreamHandler(sys.stdout)
    # Use the custom formatter class
    formatter = CustomJsonFormatter(
        # fmt is not strictly necessary when overriding format, but can be kept for consistency
        # or if the base JsonFormatter's __init__ expects it.
        # However, the custom format method completely dictates the output.
        fmt="%(asctime)s %(levelname)s %(name)s %(otelTraceID)s %(otelSpanID)s %(message)s",
        datefmt="%Y-%m-%dT%H:%M:%S"
    )
    handler.setFormatter(formatter)
    root = logging.getLogger()
    root.setLevel(logging.INFO)
    root.handlers = [handler]
    root.addFilter(TraceIdFilter())
    return root
