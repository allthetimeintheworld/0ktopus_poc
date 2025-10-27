#!/bin/bash
# Start Backend API Server

cd "$(dirname "$0")"
source venv/bin/activate
python3 api_server.py
