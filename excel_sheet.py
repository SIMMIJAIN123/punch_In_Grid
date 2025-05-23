# import pandas as pd
# import random
# import string

# def generate_name():
#     return ''.join(random.choices(string.ascii_letters, k=7)).capitalize()

# def generate_email(name, index):
#     return f"{name.lower()}{index}@example.com"

# data = []
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

# ✅ Add specific example users manually
custom_users = [
    {"emp_id": "1107", "name": "Naman", "email": "naman1107@example.com", "password": "", "is_active": False, "role": "user"},
    {"emp_id": "1108", "name": "Vanshika Jain", "email": "vanshikajain1108@example.com", "password": "", "is_active": False, "role": "user"},
    {"emp_id": "1133", "name": "Rishav Agarwal", "email": "rishavagarwal1133@example.com", "password": "", "is_active": False, "role": "user"},
]

# Append the custom users to the existing data
data.extend(custom_users)

# Convert to DataFrame
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
print("📁 Excel file 'students.xlsx' created with 10,003 entries.")
