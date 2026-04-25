import sys
import os
from celery import Celery

from worker.config import settings

# Add services/api to sys.path so we can import 'app'
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', 'api')))

celery = Celery(
    "tendereval_worker",
    broker=settings.redis_url,
    backend=settings.redis_url,
    include=["worker.tasks"]
)

celery.conf.task_serializer = "json"
celery.conf.result_serializer = "json"
celery.conf.accept_content = ["json"]

