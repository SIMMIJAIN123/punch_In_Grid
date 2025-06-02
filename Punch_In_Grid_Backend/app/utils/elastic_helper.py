from elasticsearch import AsyncElasticsearch
from typing import Optional, Dict, Any

# Initialize Elasticsearch client
# In production, you should move these credentials to environment variables
es = AsyncElasticsearch(
    hosts=['http://localhost:9200'],  # Update with your Elasticsearch host
    basic_auth=('elastic', 'your_password')  # Update with your credentials
)

async def create_index_if_not_exists(index_name: str, mappings: Dict[str, Any]) -> None:
    """Create an index if it doesn't exist with the specified mappings."""
    if not await es.indices.exists(index=index_name):
        await es.indices.create(
            index=index_name,
            mappings=mappings
        )

# Initialize required indices
async def init_indices():
    # Register Users index
    register_users_mapping = {
        "properties": {
            "emp_id": {"type": "keyword"},
            "name": {"type": "keyword"},
            "uuid": {"type": "keyword"},
            "role": {"type": "keyword"},
            "email": {"type": "keyword"},
            "password": {"type": "keyword"},
            "shift": {"type": "keyword"},
            "is_active": {"type": "keyword"}
        }
    }
    
    # Attendance Records index
    attendance_records_mapping = {
        "properties": {
            "empcode": {"type": "keyword"},
            "name": {"type": "keyword"},
            "date": {"type": "date", "format": "yyyy-MM-dd"},
            "shift": {"type": "keyword"},
            "intime": {"type": "keyword"},
            "late_in": {"type": "keyword"},
            "early_out": {"type": "keyword"},
            "outtime": {"type": "keyword"},
            "work_ot": {"type": "keyword"},
            "overtime": {"type": "keyword"},
            "status": {"type": "keyword"},
            "remark": {"type": "text"}
        }
    }
    
    # Shifts index
    shifts_mapping = {
        "properties": {
            "shift_name": {"type": "keyword"},
            "shift_intime": {"type": "keyword"},
            "shift_outtime": {"type": "keyword"}
        }
    }
    
    await create_index_if_not_exists("register_users", register_users_mapping)
    await create_index_if_not_exists("attendance_records_all", attendance_records_mapping)
    await create_index_if_not_exists("shifts", shifts_mapping)

# Helper functions for common operations
async def get_document(index: str, doc_id: str) -> Optional[Dict[str, Any]]:
    """Get a document by ID."""
    try:
        result = await es.get(index=index, id=doc_id)
        return result["_source"]
    except Exception:
        return None

async def index_document(index: str, doc_id: str, document: Dict[str, Any]) -> bool:
    """Index a document with the specified ID."""
    try:
        await es.index(index=index, id=doc_id, document=document)
        return True
    except Exception:
        return False

async def search_documents(index: str, query: Dict[str, Any]) -> list:
    """Search documents using the specified query."""
    try:
        result = await es.search(index=index, query=query)
        return [hit["_source"] for hit in result["hits"]["hits"]]
    except Exception:
        return [] 