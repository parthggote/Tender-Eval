import os
import sys

# Get absolute paths
current_dir = os.path.dirname(os.path.abspath(__file__))
root_dir = os.path.abspath(os.path.join(current_dir, "..", "..", ".."))
worker_dir = os.path.join(root_dir, "services", "worker")

# Add to sys.path
sys.path.append(worker_dir)

import google.generativeai as genai
from worker.config import settings

# Point to the .env file
settings.model_config['env_file'] = os.path.join(worker_dir, "worker", ".env")

genai.configure(api_key=settings.gemini_api_key)

print(f"Checking models for key: {settings.gemini_api_key[:10]}...")
try:
    for m in genai.list_models():
        if 'generateContent' in m.supported_generation_methods:
            print(f"Model: {m.name} | Display: {m.display_name}")
except Exception as e:
    print(f"Error listing models: {e}")
