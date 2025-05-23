from elasticsearch import Elasticsearch
from app.config.setting import settings
from passlib.context import CryptContext
import uuid
import re
from datetime import datetime

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

class AuthUserService:
    def __init__(self):
        self.pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
        self.es = Elasticsearch(settings.elasticsearch_url)
        self.index = settings.index_name
        self.attendance_index = settings.attendance_index

    def hash_password(self, password: str) -> str:
        return pwd_context.hash(password)

    def verify_password(self, plain_password, hashed_password) -> bool:
        try:
            return self.pwd_context.verify(plain_password, hashed_password)
        except Exception:
            return False

    def get_user_by_email(self, email: str):
        query = {
            "query": {
                "term": {"email": email}
            }
        }
        resp = self.es.search(index=self.index, body=query)
        hits = resp['hits']['hits']
        if hits:
            return hits[0]['_source']
        return None

    def register_user(self, user_data: dict):
        if self.get_user_by_email(user_data["email"]):
            return None, "User already exists"

        user_data["password"] = self.hash_password(user_data["password"])
        user_data["is_active"] = False

        self.es.index(index=self.index, id=user_data["emp_id"], document=user_data)
        return user_data, None

    # def authenticate_user(self, email: str, password: str):
    #     user = self.get_user_by_email(email)
    #     if not user:
    #         return None
    #     if user["is_active"] != "true":
    #         return None
    #     if not self.verify_password(password, user["password"]):
    #         return None
        
    #     if str(user.get("is_active", "")).lower() != "true":
    #         return None
        
    #     return user
    def authenticate_user(self, email: str, password: str):
        user = self.get_user_by_email(email)
        print("Fetched user:", user)

        if not user:
            return None

        if str(user.get("is_active", "")).lower() != "true":
            print("User not active")
            return None

        if not self.verify_password(password, user["password"]):
            print("Password verification failed")
            return None
        
        return user


    def set_user_password(self, email: str, password: str):
        user = self.get_user_by_email(email)
        if not user:
            return None, "User not found"
        if user.get("is_active") == "true":
            return None, "Password already set"

        user["password"] = self.hash_password(password)
        user["is_active"] = True

        self.es.index(index=self.index, id=user["emp_id"], document=user)
        return user, None

    def bulk_register_users(self, users: list):
        inserted = 0
        for user in users:
            if not self.get_user_by_email(user["email"]):
                user["emp_id"] = user.get("emp_id", str(uuid.uuid4())[:8])
                user["role"] = "user"
                user["is_active"] = "false"
                user["password"] = None
                self.es.index(index=self.index, id=user["emp_id"], document=user)
                inserted += 1
        return inserted
    

    def get_logged_in_users(self):
        query = {
            "query": {
                "term": {
                    "is_active": "true"
                }
            }
        }
        resp = self.es.search(index=self.index, body=query, size=10000)
        hits = resp['hits']['hits']
        
        return [
            {
                "emp_id": hit["_source"]["emp_id"],
                "name": hit["_source"]["name"],
                "email": hit["_source"]["email"],
                "role": hit["_source"]["role"],
                "is_active": hit["_source"]["is_active"]
            }
            for hit in hits
        ]



    def update_user_email_by_admin(self, emp_id: str, new_email: str):
        # Search user by emp_id
        try:
            user = self.es.get(index=self.index, id=emp_id)["_source"]
        except:
            return None, "User not found"

        # Check if new email already exists
        if self.get_user_by_email(new_email):
            return None, "Email already exists"

        # Update email
        user["email"] = new_email
        self.es.index(index=self.index, id=emp_id, document=user)
        return user, None
    

    def fetch_attendance_by_empcode(self, empcode: str):
        query = {
            "query": {
                "term": {
                    "empcode": empcode
                }
            }
        }
        resp = self.es.search(index=self.attendance_index, body=query, size=10000)
        return [hit["_source"] for hit in resp['hits']['hits']]

    def fetch_attendance_by_date_range(self, start_date: str, end_date: str, emp_id: str = None, name: str = None):
        query = {
            "query": {
                "bool": {
                    "must": [
                        {
                            "range": {
                                "date": {
                                    "gte": start_date,
                                    "lte": end_date,
                                    "format": "yyyy-MM-dd"
                                }
                            }
                        }
                    ]
                }
            }
        }
        
        if emp_id:
            query["query"]["bool"]["must"].append({
                "term": {
                    "empcode": emp_id
                }
            })
        
        if name:
            query["query"]["bool"]["must"].append({
                "match": {
                    "name": {
                        "query": name,
                        "operator": "and"
                    }
                }
            })
        
        resp = self.es.search(index=self.attendance_index, body=query, size=10000)
        return [hit["_source"] for hit in resp['hits']['hits']]
    
    def parse_and_store_attendance(self, text: str):
        records = []
        current_empcode = None
        current_name = None

        lines = text.splitlines()

        for line in lines:
            line = line.strip()
            if not line:
                continue

            emp_match = re.search(r"Empcode\s+(\d+)\s+Name\s+(.*?)\s+Total Work", line)
            if emp_match:
                current_empcode = emp_match.group(1)
                current_name = emp_match.group(2).strip()
                continue

            # Detect attendance details
            att_match = re.match(
                r"(\d{2}/\d{2}/\d{4})\s+(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(.*)",
                line
            )

            if att_match and current_empcode and current_name:
                date_str, shift, intime, late_in, early_out, outtime, work_ot, overtime, status, remark = att_match.groups()
                try:
                    date = datetime.strptime(date_str, "%d/%m/%Y").strftime("%Y-%m-%d")
                except ValueError:
                    continue  # Skip invalid date format

                record = {
                    "empcode": current_empcode,
                    "name": current_name,
                    "date": date,
                    "shift": shift,
                    "intime": intime,
                    "late_in": late_in,
                    "early_out": early_out,
                    "outtime": outtime,
                    "work_ot": work_ot,
                    "overtime": overtime,
                    "status": status,
                    "remark": remark.strip(),
                }
                records.append(record)

        inserted_count = 0
        for rec in records:
            doc_id = f"{rec['empcode']}_{rec['date']}_{rec['shift']}"
            self.es.index(index=self.attendance_index, id=doc_id, document=rec)
            inserted_count += 1

        return inserted_count
    
    def fetch_all_attendance_data(self):
        query = {
            "query": {
                "match_all": {}
            }
        }
        resp = self.es.search(index=self.attendance_index, body=query, size=10000)
        return [hit["_source"] for hit in resp['hits']['hits']]

    def bulk_index_attendance(self, records):
        try:
            from elasticsearch.helpers import bulk
            success, failed = bulk(self.es, records, refresh=True)
            return success
        except Exception as e:
            raise Exception(f"Failed to bulk index attendance records: {str(e)}")


    