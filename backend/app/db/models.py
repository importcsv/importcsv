# Import all models here to ensure they are registered with SQLAlchemy
# before any relationships are resolved

# This file is imported by base.py to ensure all models are loaded
# Using import strings to avoid circular imports

# Import the modules, not the classes directly
import app.models.user
import app.models.import_job
import app.models.importer
import app.models.webhook

# Add any new model imports here
