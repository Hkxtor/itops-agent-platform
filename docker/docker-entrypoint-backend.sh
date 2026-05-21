#!/bin/sh
# Entrypoint script for backend container
# Runs as root to fix volume permissions, then drops to appuser

# Ensure data directory exists and is writable
mkdir -p /app/data
chmod -R 777 /app/data

# Drop privileges and run the application
exec gosu appuser "$@"