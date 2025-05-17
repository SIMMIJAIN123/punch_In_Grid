import pandas as pd
import random
import string

def generate_name():
    return ''.join(random.choices(string.ascii_letters, k=7)).capitalize()

def generate_email(name, index):
    return f"{name.lower()}{index}@example.com"

data = []
for i in range(1, 10001):
    name = generate_name()
    email = generate_email(name, i)
    data.append({
        "emp_id": f"EMP{i:05d}",
        "name": name,
        "email": email,
        "password": "",
        "is_active": False,
        "role": "user"
    })

df = pd.DataFrame(data)

# ✅ Checkpoint: Ensure all emails are unique
if df['email'].is_unique:
    print("✅ All email IDs are unique.")
else:
    print("❌ Duplicate email IDs found!")
    duplicate_emails = df[df.duplicated('email', keep=False)]
    print(duplicate_emails)

# Save to Excel
df.to_excel("students.xlsx", index=False)
print("📁 Excel file 'students.xlsx' created.")
