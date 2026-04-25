import os
import sys

# Get absolute paths
current_dir = os.path.dirname(os.path.abspath(__file__))
root_dir = os.path.abspath(os.path.join(current_dir, "..", "..", ".."))
worker_dir = os.path.join(root_dir, "services", "worker")

# Add to sys.path
sys.path.append(worker_dir)

from qdrant_client import QdrantClient
from worker.config import settings

# Point to the .env file
settings.model_config['env_file'] = os.path.join(worker_dir, "worker", ".env")

client = QdrantClient(url=settings.qdrant_url)
print(f"Client type: {type(client)}")
print("Available methods starting with 's' or 'q' or 'u':")
methods = [m for m in dir(client) if m.startswith('s') or m.startswith('q') or m.startswith('u')]
for m in sorted(methods):
    print(f" - {m}")
