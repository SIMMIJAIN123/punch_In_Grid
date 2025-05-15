# app/config/setting.py
from pydantic_settings import BaseSettings  # <-- updated import

class Settings(BaseSettings):
    elasticsearch_url: str = "http://localhost:9200"
    index_name: str = "users"

settings = Settings()
