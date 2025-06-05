# Direct Elasticsearch interactions
from elasticsearch import Elasticsearch
from app.config.setting import settings
from passlib.context import CryptContext
import uuid
import re
from datetime import datetime, timedelta

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

class AuthUserService:
    def __init__(self):
        self.pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
        self.es = Elasticsearch(settings.elasticsearch_url)
        self.index = settings.index_name
        self.attendance_index = settings.attendance_index
        self.shifts_index = "shifts"  # Index for shifts
        self._ensure_shifts_index()

    def _ensure_shifts_index(self):
        """Ensure shifts index exists with proper mapping"""
        try:
            if not self.es.indices.exists(index=self.shifts_index):
                mappings = {
                    "mappings": {
                        "properties": {
                            "shift_name": {"type": "keyword"},
                            "shift_intime": {"type": "keyword"},
                            "shift_outtime": {"type": "keyword"}
                        }
                    }
                }
                self.es.indices.create(index=self.shifts_index, body=mappings)
        except Exception as e:
            print(f"Error ensuring shifts index: {str(e)}")

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
        # Set is_active as "false" for all users initially
        user_data["is_active"] = "false"

        self.es.index(index=self.index, id=user_data["emp_id"], document=user_data)
        return user_data, None

    def authenticate_user(self, email: str, password: str):
        user = self.get_user_by_email(email)
        print("Fetched user:", user)

        if not user:
            return None

        if not self.verify_password(password, user["password"]):
            print("Password verification failed")
            return None

        # For admin users, set is_active to true upon successful login
        if user.get("role") == "admin":
            user["is_active"] = "true"
            self.es.index(index=self.index, id=user["emp_id"], document=user)
            return user
        
        # For non-admin users, check is_active status
        if str(user.get("is_active", "")).lower() != "true":
            print("User not active")
            return None
        
        return user

    def set_user_password(self, email: str, password: str):
        user = self.get_user_by_email(email)
        if not user:
            return None, "User not found"
            
        # Admin users don't need to set password
        if user.get("role") == "admin":
            return None, "Admin users don't need to set password"
            
        # Regular users can only set password once
        if user.get("is_active") == "true":
            return None, "Password already set"

        # Set password and activate user
        user["password"] = self.hash_password(password)
        user["is_active"] = "true"

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
                "bool": {
                    "must": [
                        {"term": {"is_active": "true"}},
                        {"term": {"role": "user"}}
                    ]
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
    

    # def fetch_attendance_by_empcode(self, empcode: str):
    #     query = {
    #         "query": {
    #             "term": {
    #                 "empcode": empcode
    #             }
    #         }
    #     }
    #     resp = self.es.search(index=self.attendance_index, body=query, size=10000)
    #     return [hit["_source"] for hit in resp['hits']['hits']]
    
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


    
    def fetch_attendance_by_date_range(self, start_date: str, end_date: str, emp_id: str = None, name: str = None):
        try:
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
                },
                "sort": [
                    { "date": { "order": "asc" } }
                ]
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
            records = [hit["_source"] for hit in resp['hits']['hits']]

            # Process records to ensure consistent time format
            for record in records:
                # Handle empty or invalid time values
                record['intime'] = record.get('intime', '--:--') or '--:--'
                record['outtime'] = record.get('outtime', '--:--') or '--:--'
                record['overtime'] = record.get('overtime', '--:--') or '--:--'
                record['late_in'] = record.get('late_in', '--:--') or '--:--'
                record['early_out'] = record.get('early_out', '--:--') or '--:--'
                
                # Ensure date is in correct format
                try:
                    date_obj = datetime.strptime(record['date'], '%Y-%m-%d')
                    record['date'] = date_obj.strftime('%Y-%m-%d')
                except (ValueError, TypeError):
                    record['date'] = None

            # Filter out records with invalid dates
            records = [r for r in records if r['date'] is not None]
            
            return records
        except Exception as e:
            print(f"Error in fetch_attendance_by_date_range: {str(e)}")
            return []

    def get_user_by_id(self, emp_id: str):
        query = {
            "query": {
                "term": {"emp_id": emp_id}
            }
        }
        resp = self.es.search(index=self.index, body=query)
        hits = resp['hits']['hits']
        if hits:
            return hits[0]['_source']
        return None

    def get_shift_timings(self, shift_name: str):
        """Get shift timings"""
        try:
            if not self.es.indices.exists(index=self.shifts_index):
                # Default night shift timings
                return {
                    "shift_intime": "05:30 PM",
                    "shift_outtime": "02:30 AM"
                }

            query = {
                "query": {
                    "term": {
                        "shift_name.keyword": shift_name
                    }
                }
            }
            resp = self.es.search(index=self.shifts_index, body=query)
            hits = resp['hits']['hits']
            if hits:
                shift = hits[0]['_source']
                return {
                    "shift_intime": shift["shift_intime"],
                    "shift_outtime": shift["shift_outtime"]
                }
            # Return night shift timings if not found
            return {
                "shift_intime": "05:30 PM",
                "shift_outtime": "02:30 AM"
            }
        except Exception:
            # Return night shift timings on error
            return {
                "shift_intime": "05:30 PM",
                "shift_outtime": "02:30 AM"
            }

    def _parse_time(self, time_str):
        """Convert time string to datetime object"""
        try:
            # Try 12-hour format first
            return datetime.strptime(time_str.strip(), "%I:%M %p").time()
        except ValueError:
            try:
                # Try 24-hour format
                return datetime.strptime(time_str.strip(), "%H:%M").time()
            except ValueError:
                return None

    def _get_datetime_with_date(self, time_obj, current_date, is_next_day=False):
        """Combine time with date, optionally adding a day for night shifts"""
        if isinstance(current_date, str):
            current_date = datetime.strptime(current_date, "%Y-%m-%d")
        if is_next_day:
            current_date = current_date + timedelta(days=1)
        return datetime.combine(current_date.date(), time_obj)

    def _calculate_late_in(self, actual_time: str, shift_intime: str, current_date: str) -> int:
        """Calculate late minutes for night shift"""
        try:
            actual = self._parse_time(actual_time)
            expected = self._parse_time(shift_intime)
            
            if not actual or not expected:
                return 0

            # Convert to datetime objects with current date
            current_dt = datetime.strptime(current_date, "%Y-%m-%d")
            actual_dt = self._get_datetime_with_date(actual, current_dt)
            expected_dt = self._get_datetime_with_date(expected, current_dt)

            # Calculate minutes difference
            diff_minutes = (actual_dt - expected_dt).total_seconds() / 60
            
            # If negative difference and night shift, it means we checked in after midnight
            if diff_minutes < 0 and expected.hour >= 17:  # After 5 PM
                actual_dt = self._get_datetime_with_date(actual, current_dt, True)
                diff_minutes = (actual_dt - expected_dt).total_seconds() / 60

            return max(0, int(diff_minutes))

        except Exception as e:
            print(f"Error calculating late_in: {str(e)}")
            return 0

    def _calculate_attendance_metrics(self, intime: str, outtime: str, shift_intime: str, shift_outtime: str, current_date: str) -> dict:
        """Calculate attendance metrics for night shift"""
        metrics = {
            "early_out": 0,
            "overtime": 0,
            "status": "Present"
        }
        
        try:
            if not all([intime, outtime, shift_intime, shift_outtime]):
                return metrics

            # Parse all times
            actual_in = self._parse_time(intime)
            actual_out = self._parse_time(outtime)
            expected_in = self._parse_time(shift_intime)
            expected_out = self._parse_time(shift_outtime)
            
            if not all([actual_in, actual_out, expected_in, expected_out]):
                return metrics

            # Convert to datetime objects
            current_dt = datetime.strptime(current_date, "%Y-%m-%d")
            actual_in_dt = self._get_datetime_with_date(actual_in, current_dt)
            expected_in_dt = self._get_datetime_with_date(expected_in, current_dt)
            
            # For night shift, add a day to out times if they're before in times
            is_night_shift = expected_out.hour < expected_in.hour
            
            if is_night_shift:
                expected_out_dt = self._get_datetime_with_date(expected_out, current_dt, True)
                # If check-out is before check-in time, it must be next day
                if actual_out.hour < actual_in.hour:
                    actual_out_dt = self._get_datetime_with_date(actual_out, current_dt, True)
                else:
                    actual_out_dt = self._get_datetime_with_date(actual_out, current_dt)
            else:
                actual_out_dt = self._get_datetime_with_date(actual_out, current_dt)
                expected_out_dt = self._get_datetime_with_date(expected_out, current_dt)

            # Calculate early out
            if actual_out_dt < expected_out_dt:
                early_mins = (expected_out_dt - actual_out_dt).total_seconds() / 60
                metrics["early_out"] = int(early_mins)
                if metrics["early_out"] > 0:
                    metrics["status"] = "Early Out"
                
            # Calculate overtime
            expected_duration = (expected_out_dt - expected_in_dt).total_seconds() / 60
            actual_duration = (actual_out_dt - actual_in_dt).total_seconds() / 60
            
            if actual_duration > expected_duration:
                metrics["overtime"] = int(actual_duration - expected_duration)
                if metrics["status"] == "Present":
                    metrics["status"] = "Overtime"
                
            return metrics
        except Exception as e:
            print(f"Error calculating metrics: {str(e)}")
            return metrics

    def get_attendance_by_date(self, emp_id: str, date: str):
        """Get attendance record for a specific date"""
        try:
            query = {
                "query": {
                    "bool": {
                        "must": [
                            {"term": {"empcode": emp_id}},
                            {"term": {"date": date}}
                        ]
                    }
                }
            }
            
            resp = self.es.search(index=self.attendance_index, body=query)
            hits = resp['hits']['hits']
            
            if hits:
                record = hits[0]['_source']
                # Get shift timings
                shift_timings = self.get_shift_timings(record.get("shift", "4"))
                record["shift_intime"] = shift_timings["shift_intime"]
                record["shift_outtime"] = shift_timings["shift_outtime"]
                return record
            
            return None
        except Exception as e:
            print(f"Error getting attendance: {str(e)}")
            return None

    # Shift Management Methods
    def create_shift(self, shift_data: dict):
        """Create a new shift"""
        try:
            # Check if shift with same name already exists
            try:
                self.es.get(index=self.shifts_index, id=shift_data["shift_name"])
                return None, f"Shift with name '{shift_data['shift_name']}' already exists"
            except Exception:
                pass  # Shift doesn't exist, continue with creation

            # Ensure times are in AM/PM format
            from app.models.user_auth_models import convert_to_ampm
            shift_data = {
                **shift_data,
                "shift_intime": convert_to_ampm(shift_data["shift_intime"]),
                "shift_outtime": convert_to_ampm(shift_data["shift_outtime"])
            }

            # Insert the new shift
            result = self.es.index(
                index=self.shifts_index,
                id=shift_data["shift_name"],
                document=shift_data,
                refresh=True
            )
            if result['result'] == 'created':
                return shift_data, None
            return None, "Failed to create shift"
        except Exception as e:
            return None, str(e)

    def get_shift_by_name(self, shift_name: str):
        """Get a shift by name"""
        try:
            if not self.es.indices.exists(index=self.shifts_index):
                return None, "No shifts exist yet"

            try:
                result = self.es.get(index=self.shifts_index, id=shift_name)
                return result['_source'], None
            except Exception:
                return None, "Shift not found"
        except Exception as e:
            return None, str(e)

    def update_shift(self, shift_name: str, shift_data: dict):
        """Update an existing shift"""
        try:
            if not self.es.indices.exists(index=self.shifts_index):
                return None, "No shifts exist yet"

            # Check if shift exists
            try:
                self.es.get(index=self.shifts_index, id=shift_name)
            except Exception:
                return None, f"Shift '{shift_name}' not found"

            # Ensure times are in AM/PM format
            from app.models.user_auth_models import convert_to_ampm
            shift_data = {
                **shift_data,
                "shift_intime": convert_to_ampm(shift_data["shift_intime"]),
                "shift_outtime": convert_to_ampm(shift_data["shift_outtime"])
            }

            # Update the shift
            try:
                result = self.es.index(
                    index=self.shifts_index,
                    id=shift_name,
                    document=shift_data,
                    refresh=True
                )
                if result['result'] in ['updated', 'created']:
                    return shift_data, None
                return None, "Failed to update shift"
            except Exception as e:
                return None, f"Error updating shift: {str(e)}"
        except Exception as e:
            return None, str(e)

    def delete_shift(self, shift_name: str):
        """Delete a shift"""
        try:
            if not self.es.indices.exists(index=self.shifts_index):
                return None, "No shifts exist yet"

            # First check if shift exists
            try:
                self.es.get(index=self.shifts_index, id=shift_name)
            except Exception:
                return None, f"Shift '{shift_name}' not found"

            # Delete the shift
            try:
                self.es.delete(index=self.shifts_index, id=shift_name, refresh=True)
                # Verify deletion
                try:
                    self.es.get(index=self.shifts_index, id=shift_name)
                    return None, "Failed to delete shift"
                except Exception:
                    # If get fails after delete, it means deletion was successful
                    return {"shift_name": shift_name}, None
            except Exception:
                return None, "Failed to delete shift"
        except Exception as e:
            return None, str(e)

    def get_all_shifts(self):
        """Get all shifts"""
        try:
            print("Checking if shifts index exists")
            if not self.es.indices.exists(index=self.shifts_index):
                print("Shifts index does not exist")
                return [], None

            print("Building search query")
            query = {
                "query": {
                    "match_all": {}
                },
                "sort": [
                    {"shift_name": {"order": "asc"}}
                ]
            }
            print("Executing search query:", query)
            resp = self.es.search(index=self.shifts_index, body=query, size=100)
            print("Search response:", resp)
            
            if not resp.get('hits', {}).get('hits'):
                print("No shifts found in index")
                return [], None
                
            # Convert times to AM/PM format
            from app.models.user_auth_models import convert_to_ampm
            shifts = []
            for hit in resp['hits']['hits']:
                shift = hit['_source']
                shifts.append({
                    **shift,
                    "shift_intime": convert_to_ampm(shift["shift_intime"]),
                    "shift_outtime": convert_to_ampm(shift["shift_outtime"])
                })
            
            print("Extracted and formatted shifts:", shifts)
            return shifts, None
        except Exception as e:
            print("Error in get_all_shifts:", str(e))
            return None, str(e)

    def record_attendance(self, attendance_record: dict):
        try:
            # Get user details to get their shift
            user = self.get_user_by_id(attendance_record["emp_id"])
            if not user:
                return None, "User not found"

            # Get shift timings
            shift_name = user.get("shift", "4")  # Default to shift 4
            shift_timings = self.get_shift_timings(shift_name)
            
            current_date = attendance_record["date"]
            
            # Check if record exists for today
            query = {
                "query": {
                    "bool": {
                        "must": [
                            {"term": {"empcode": attendance_record["emp_id"]}},
                            {"term": {"date": current_date}}
                        ]
                    }
                }
            }
            
            resp = self.es.search(index=self.attendance_index, body=query)
            hits = resp['hits']['hits']

            if hits:
                existing_record = hits[0]['_source']
                doc_id = hits[0]['_id']
                
                # If this is a check-in and already checked in
                if attendance_record.get("intime") and existing_record.get("intime"):
                    return None, "Already checked in for today"
                    
                # If this is a check-out
                if attendance_record.get("outtime"):
                    if not existing_record.get("intime"):
                        return None, "Must check in first"
                    if existing_record.get("outtime"):
                        return None, "Already checked out for today"
                        
                    # Calculate metrics for check-out
                    metrics = self._calculate_attendance_metrics(
                        existing_record["intime"],
                        attendance_record["outtime"],
                        shift_timings["shift_intime"],
                        shift_timings["shift_outtime"],
                        current_date
                    )
                    
                    # Update existing record with check-out data
                    update_data = {
                        "outtime": attendance_record["outtime"],
                        "early_out": str(metrics["early_out"]),
                        "overtime": str(metrics["overtime"]),
                        "status": metrics["status"]
                    }
                    
                    self.es.update(
                        index=self.attendance_index,
                        id=doc_id,
                        body={"doc": update_data}
                    )
                    
                    # Return complete updated record
                    existing_record.update(update_data)
                    existing_record.update({
                        "shift_intime": shift_timings["shift_intime"],
                        "shift_outtime": shift_timings["shift_outtime"]
                    })
                    return existing_record, None
                    
            # This is a new check-in
            if attendance_record.get("intime"):
                # Calculate late_in for check-in
                late_in = self._calculate_late_in(
                    attendance_record["intime"],
                    shift_timings["shift_intime"],
                    current_date
                )
                
                new_record = {
                    "empcode": attendance_record["emp_id"],
                    "name": attendance_record["name"],
                    "date": current_date,
                    "shift": shift_name,
                    "intime": attendance_record["intime"],
                    "late_in": str(late_in),
                    "early_out": "0",
                    "outtime": None,
                    "overtime": "0",
                    "status": "Late" if late_in > 0 else "Present",
                    "remark": "",
                    "shift_intime": shift_timings["shift_intime"],
                    "shift_outtime": shift_timings["shift_outtime"]
                }
                
                doc_id = f"{attendance_record['emp_id']}_{current_date}"
                self.es.index(
                    index=self.attendance_index,
                    id=doc_id,
                    document=new_record
                )
                
                return new_record, None
                
            return None, "Invalid attendance record"
            
        except Exception as e:
            print(f"Error in record_attendance: {str(e)}")
            return None, str(e)
