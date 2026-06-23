import sys
import uuid
import uuid
from typing import List

# Helper to format SQL strings
def sql_str(val: str) -> str:
    if val == r'\N' or val is None:
        return 'NULL'
    # Escape single quotes
    val = val.replace("'", "''")
    return f"'{val}'"

def sql_bool(val: str) -> str:
    if val in ('t', 'true', '1', 'True'):
        return 'TRUE'
    elif val in ('f', 'false', '0', 'False'):
        return 'FALSE'
    return 'NULL'

def sql_num(val: str) -> str:
    if val == r'\N' or val is None:
        return 'NULL'
    return val

def main():
    if len(sys.argv) < 3:
        print("Usage: python migrate_data.py <input_sql> <output_sql>")
        return

    input_file = sys.argv[1]
    output_file = sys.argv[2]

    in_users = False
    in_subs = False
    in_payments = False

    user_inserts = []
    sub_inserts = []
    payment_inserts = []

    with open(input_file, 'r', encoding='utf-8') as f:
        for line in f:
            if line.startswith("COPY public.user_auth_user ("):
                in_users = True
                continue
            elif line.startswith("COPY public.subscriptions_subscription ("):
                in_subs = True
                continue
            elif line.startswith("COPY public.subscriptions_payment ("):
                in_payments = True
                continue

            if line.startswith("\\."):
                in_users = False
                in_subs = False
                in_payments = False

            if in_users:
                parts = line.strip('\n').split('\t')
                if len(parts) >= 12:
                    password = parts[0]
                    user_id = parts[3]
                    email = parts[4]
                    username = parts[5]
                    country = parts[6]
                    is_verified = parts[7]
                    image_url = parts[8]
                    is_active = parts[9]
                    is_staff = parts[10]
                    created_at = parts[11]

                    norm_email = email.upper()
                    norm_username = username.upper()
                    security_stamp = str(uuid.uuid4()).upper()
                    concurrency_stamp = str(uuid.uuid4())
                    
                    full_name = username
                    if full_name == r'\N' or not full_name:
                        full_name = ''

                    sql = (f'INSERT INTO "AspNetUsers" '
                           f'("Id", "UserName", "NormalizedUserName", "Email", "NormalizedEmail", "EmailConfirmed", '
                           f'"PasswordHash", "SecurityStamp", "ConcurrencyStamp", "PhoneNumberConfirmed", "TwoFactorEnabled", '
                           f'"LockoutEnabled", "AccessFailedCount", "FullName", "Country", "IsVerified", "ImageUrl", '
                           f'"IsActive", "IsStaff", "AvailableCredits", "CreatedAt") VALUES '
                           f"({sql_str(user_id)}, {sql_str(username)}, {sql_str(norm_username)}, {sql_str(email)}, {sql_str(norm_email)}, {sql_bool(is_verified)}, "
                           f"{sql_str(password)}, {sql_str(security_stamp)}, {sql_str(concurrency_stamp)}, FALSE, FALSE, "
                           f"TRUE, 0, {sql_str(full_name)}, {sql_str(country)}, {sql_bool(is_verified)}, {sql_str(image_url)}, "
                           f"{sql_bool(is_active)}, {sql_bool(is_staff)}, 0, {sql_str(created_at)}) "
                           f'ON CONFLICT ("Id") DO NOTHING;\n')
                    user_inserts.append(sql)

            elif in_subs:
                parts = line.strip('\n').split('\t')
                if len(parts) >= 7:
                    sub_id = parts[0]
                    start_date = parts[1]
                    end_date = parts[2]
                    status = parts[3]
                    created_at = parts[4]
                    plan_id = parts[5]
                    user_id = parts[6]

                    sql = (f'INSERT INTO "Subscriptions" '
                           f'("Id", "StartDate", "EndDate", "Status", "CreatedAt", "PlanId", "UserId") VALUES '
                           f"({sql_num(sub_id)}, {sql_str(start_date)}, {sql_str(end_date)}, {sql_str(status)}, "
                           f"{sql_str(created_at)}, {sql_num(plan_id)}, {sql_str(user_id)}) "
                           f'ON CONFLICT ("Id") DO NOTHING;\n')
                    sub_inserts.append(sql)

            elif in_payments:
                parts = line.strip('\n').split('\t')
                if len(parts) >= 12:
                    pay_id = parts[0]
                    payment_id = parts[1]
                    amount = parts[2]
                    currency = parts[3]
                    method = parts[4]
                    status = parts[5]
                    created_at = parts[6]
                    updated_at = parts[7]
                    plan_id = parts[8]
                    sub_id = parts[9]
                    user_id = parts[10]
                    notes = parts[11]

                    sql = (f'INSERT INTO "Payments" '
                           f'("Id", "PaymentId", "Amount", "Currency", "Method", "Status", "CreatedAt", "UpdatedAt", '
                           f'"PlanId", "SubscriptionId", "UserId", "Notes") VALUES '
                           f"({sql_num(pay_id)}, {sql_str(payment_id)}, {sql_num(amount)}, {sql_str(currency)}, {sql_str(method)}, {sql_str(status)}, "
                           f"{sql_str(created_at)}, {sql_str(updated_at)}, {sql_num(plan_id)}, {sql_num(sub_id)}, {sql_str(user_id)}, {sql_str(notes)}) "
                           f'ON CONFLICT ("Id") DO NOTHING;\n')
                    payment_inserts.append(sql)

    out = open(output_file, 'w', encoding='utf-8')
    out.write("-- Migration Script for New Users to ASP.NET Core Identity\n")
    out.write("-- Automatically generated.\n\n")

    out.write("\n-- ===========================\n")
    out.write("-- Users (AspNetUsers)\n")
    out.write("-- ===========================\n")
    for sql in user_inserts:
        out.write(sql)

    out.write("\n-- ===========================\n")
    out.write("-- Subscriptions\n")
    out.write("-- ===========================\n")
    for sql in sub_inserts:
        out.write(sql)

    out.write("\n-- ===========================\n")
    out.write("-- Payments\n")
    out.write("-- ===========================\n")
    for sql in payment_inserts:
        out.write(sql)

    out.close()
    print("Migration script generated successfully: " + output_file)

if __name__ == "__main__":
    main()
