# import pandas as pd
# import random
# import string

# def generate_name():
#     return ''.join(random.choices(string.ascii_letters, k=7)).capitalize()

# def generate_email(name, index):
#     return f"{name.lower()}{index}@example.com"

# data = []

# # Add Simmi's details first
# data.append({
#     "emp_id": "EMP00000",
#     "name": "Simmi",
#     "email": "simmi@gmail.com",
#     "password": "",
#     "is_active": False,
#     "role": "user"
# })

# # Generate 10,000 random entries
# for i in range(1, 10001):
#     name = generate_name()
#     email = generate_email(name, i)
#     data.append({
#         "emp_id": f"EMP{i:05d}",
#         "name": name,
#         "email": email,
#         "password": "",
#         "is_active": False,
#         "role": "user"
#     })

# df = pd.DataFrame(data)

# # ✅ Checkpoint: Ensure all emails are unique
# if df['email'].is_unique:
#     print("✅ All email IDs are unique.")
# else:
#     print("❌ Duplicate email IDs found!")
#     duplicate_emails = df[df.duplicated('email', keep=False)]
#     print(duplicate_emails)

# # Save to Excel
# df.to_excel("students.xlsx", index=False)
# print("📁 Excel file 'students.xlsx' created.")


import pandas as pd

# Load your Excel file
df = pd.read_excel('/Users/aiko/Projects/PowerGrid copy/periodicdatewise20052025222751.xlsx')

# Convert to JSON format compatible with Elasticsearch
records = df.to_dict(orient='records')

# Save to JSON file (optional)
import json
with open('today_attendance.json', 'w') as f:
    json.dump(records, f, indent=2)
