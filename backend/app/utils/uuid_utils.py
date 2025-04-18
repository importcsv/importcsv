import uuid
from typing import Any, Dict, List, Union

def convert_uuid_to_str(obj: Any) -> Any:
    """
    Recursively convert UUID objects to strings in a dictionary, list, or single value.
    This is useful for preparing data to be returned via API responses.
    """
    if isinstance(obj, uuid.UUID):
        return str(obj)
    elif isinstance(obj, dict):
        return {k: convert_uuid_to_str(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [convert_uuid_to_str(item) for item in obj]
    elif hasattr(obj, "__dict__"):
        # For ORM models or other objects with __dict__
        return convert_uuid_to_str(obj.__dict__)
    else:
        return obj
