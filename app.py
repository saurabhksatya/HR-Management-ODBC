import re
from flask import Flask, render_template, request, redirect, session, jsonify
from db import get_connection

app = Flask(__name__)

app.secret_key = "hr-management-secret-key"


# ==========================================================
# APPLICATION USERS
# ==========================================================

USERS = {
    "admin": {
        "password": "admin123",
        "role": "admin",
        "department": None
    }
}


def _department_account_key(department):
    return "".join(character.lower() for character in department if character.isalnum())


def _department_user(username, password):
    username_key = _department_account_key(username)

    if not username_key.endswith("head"):
        return None

    department_key = username_key[:-4]

    if not department_key:
        return None

    connection = get_connection()
    cursor = connection.cursor()

    try:
        cursor.execute("SELECT DEPARTMENT_NAME FROM DEPARTMENTS")

        for row in cursor.fetchall():
            department = row[0]
            account_key = _department_account_key(department)

            if account_key == department_key and password == f"{account_key}123":
                return {
                    "role": f"{account_key}head",
                    "department": department
                }

        return None
    finally:
        cursor.close()
        connection.close()


# ==========================================================
# LOGIN
# ==========================================================

@app.route("/", methods=["GET", "POST"])
def login():

    if request.method == "POST":

        username = request.form["username"]
        password = request.form["password"]

        user = USERS.get(username.lower())

        if user is None:
            user = _department_user(username, password)

        if user and ("password" not in user or user["password"] == password):

            session["logged_in"] = True
            session["username"] = username.lower()
            session["role"] = user["role"]
            session["department"] = user["department"]

            return redirect("/dashboard")

        return render_template(
            "login.html",
            error="Invalid username or password"
        )

    return render_template("login.html")


# ==========================================================
# DASHBOARD
# ==========================================================

@app.route("/dashboard")
def dashboard():

    if not session.get("logged_in"):
        return redirect("/")

    return render_template(
        "dashboard.html",
        username=session["username"],
        role=session["role"],
        department=session["department"]
    )


# ==========================================================
# DEPARTMENTS (ADMIN ONLY)
# ==========================================================

def _is_department_head(job_title, department_name):
    if not job_title or not department_name:
        return False
    raw_title = job_title.strip().lower()
    raw_dept = department_name.strip().lower()
    if raw_title == f"{raw_dept}head" or raw_title == f"{raw_dept} head":
        return True
    key_title = "".join(c.lower() for c in raw_title if c.isalnum())
    key_dept = "".join(c.lower() for c in raw_dept if c.isalnum())
    return key_title == f"{key_dept}head"


@app.route("/api/departments", methods=["GET", "POST"])
def departments():

    if not session.get("logged_in"):
        return jsonify({"error": "Unauthorized"}), 401

    if session["role"] != "admin":
        return jsonify({"error": "Only the administrator can manage departments."}), 403

    connection = get_connection()
    cursor = connection.cursor()

    if request.method == "GET":
        cursor.execute("""
            SELECT
                d.DEPARTMENT_ID,
                d.DEPARTMENT_NAME,
                (
                    SELECT COUNT(*)
                    FROM EMPLOYEES e    
                    WHERE UPPER(TRIM(e.DEPARTMENT)) = UPPER(TRIM(d.DEPARTMENT_NAME))
                )
            FROM DEPARTMENTS d
            ORDER BY UPPER(d.DEPARTMENT_NAME)
        """)
        dept_rows = cursor.fetchall()

        cursor.execute("""
            SELECT FIRST_NAME, LAST_NAME, DEPARTMENT, JOB_TITLE
            FROM EMPLOYEES
        """)
        emp_rows = cursor.fetchall()

        department_list = []
        for row in dept_rows:
            dept_id = row[0]
            dept_name = row[1]
            employee_count = row[2]

            head_name = "-"
            for emp in emp_rows:
                first_name, last_name, emp_dept, job_title = emp[0], emp[1], emp[2], emp[3]
                if _is_department_head(job_title, dept_name):
                    full_name = f"{first_name or ''} {last_name or ''}".strip()
                    head_name = full_name if full_name else "-"
                    if emp_dept and emp_dept.strip().lower() == dept_name.strip().lower():
                        break

            department_list.append({
                "id": dept_id,
                "name": dept_name,
                "employee_count": employee_count,
                "head": head_name,
                "head_name": head_name
            })

        cursor.close()
        connection.close()
        return jsonify(department_list)

    data = request.get_json(silent=True) or {}
    department_id = data.get("id")
    department_name = (data.get("name") or "").strip()

    if isinstance(department_id, bool) or not isinstance(department_id, int) or department_id <= 0:
        cursor.close()
        connection.close()
        return jsonify({"error": "Enter a positive whole-number department ID."}), 400

    if not department_name:
        cursor.close()
        connection.close()
        return jsonify({"error": "Department name is required."}), 400

    try:
        cursor.execute("""
            INSERT INTO DEPARTMENTS (DEPARTMENT_ID, DEPARTMENT_NAME)
            VALUES (:id, :name)
        """, {"id": department_id, "name": department_name})
        connection.commit()
        return jsonify({"message": "Department added successfully."})
    except Exception as error:
        connection.rollback()
        return jsonify({"error": str(error)}), 409
    finally:
        cursor.close()
        connection.close()


@app.route("/api/departments/<department_name>", methods=["PUT", "DELETE"])
def department_detail(department_name):

    if not session.get("logged_in"):
        return jsonify({"error": "Unauthorized"}), 401

    if session["role"] != "admin":
        return jsonify({"error": "Only the administrator can manage departments."}), 403

    connection = get_connection()
    cursor = connection.cursor()

    if request.method == "PUT":
        data = request.get_json(silent=True) or {}
        new_name = (data.get("name") or "").strip()

        if not new_name:
            cursor.close()
            connection.close()
            return jsonify({"error": "Department name is required."}), 400

        try:
            cursor.execute("""
                UPDATE DEPARTMENTS
                SET DEPARTMENT_NAME = :new_name
                WHERE UPPER(DEPARTMENT_NAME) = UPPER(:old_name)
            """, {"new_name": new_name, "old_name": department_name})

            if cursor.rowcount == 0:
                connection.rollback()
                return jsonify({"error": "Department not found."}), 404

            cursor.execute("""
                UPDATE EMPLOYEES
                SET DEPARTMENT = :new_name
                WHERE UPPER(DEPARTMENT) = UPPER(:old_name)
            """, {"new_name": new_name, "old_name": department_name})
            connection.commit()
            return jsonify({"message": "Department updated successfully."})
        except Exception as error:
            connection.rollback()
            return jsonify({"error": str(error)}), 409
        finally:
            cursor.close()
            connection.close()

    cursor.execute("""
        SELECT COUNT(*)
        FROM EMPLOYEES
        WHERE UPPER(DEPARTMENT) = UPPER(:name)
    """, {"name": department_name})

    if cursor.fetchone()[0] > 0:
        cursor.close()
        connection.close()
        return jsonify({"error": "Move or remove this department's employees before deleting it."}), 409

    cursor.execute("""
        DELETE FROM DEPARTMENTS
        WHERE UPPER(DEPARTMENT_NAME) = UPPER(:name)
    """, {"name": department_name})

    if cursor.rowcount == 0:
        cursor.close()
        connection.close()
        return jsonify({"error": "Department not found."}), 404

    connection.commit()
    cursor.close()
    connection.close()
    return jsonify({"message": "Department deleted successfully."})


# ==========================================================
# GET EMPLOYEES
# ==========================================================

def _normalize_date_input(date_str):
    if not date_str:
        return None
    val = str(date_str).strip()
    if re.match(r'^\d{2}-\d{2}-\d{4}$', val):
        d, m, y = val.split('-')
        return f"{y}-{m}-{d}"
    return val


@app.route("/api/employees")
def get_employees():

    if not session.get("logged_in"):
        return jsonify({"error": "Unauthorized"}), 401

    connection = get_connection()
    cursor = connection.cursor()

    # Administrator can see everybody
    if session["role"] == "admin":

        cursor.execute("""
            SELECT
                EMPLOYEE_ID,
                FIRST_NAME,
                LAST_NAME,
                EMAIL,
                PHONE,
                DEPARTMENT,
                JOB_TITLE,
                SALARY,
                TO_CHAR(HIRE_DATE, 'DD-MM-YYYY')
            FROM EMPLOYEES
            ORDER BY EMPLOYEE_ID
        """)

    # Department head can see only their department
    else:

        cursor.execute("""
            SELECT
                EMPLOYEE_ID,
                FIRST_NAME,
                LAST_NAME,
                EMAIL,
                PHONE,
                DEPARTMENT,
                JOB_TITLE,
                SALARY,
                TO_CHAR(HIRE_DATE, 'DD-MM-YYYY')
            FROM EMPLOYEES
            WHERE UPPER(DEPARTMENT) = UPPER(:department)
            ORDER BY EMPLOYEE_ID
        """, {
            "department": session["department"]
        })

    employees = []

    for row in cursor:

        employees.append({
            "employee_id": row[0],
            "first_name": row[1],
            "last_name": row[2],
            "email": row[3],
            "phone": row[4],
            "department": row[5],
            "job_title": row[6],
            "salary": row[7],
            "hire_date": row[8]
        })

    cursor.close()
    connection.close()

    return jsonify(employees)


# ==========================================================
# ADD EMPLOYEE
# ==========================================================

@app.route("/api/employees", methods=["POST"])
def add_employee():

    if not session.get("logged_in"):
        return jsonify({"error": "Unauthorized"}), 401

    data = request.json

    # Department head cannot create employees
    # in another department.
    if session["role"] != "admin":

        if data["department"].upper() != session["department"].upper():

            return jsonify({
                "error": "You can only add employees to your department."
            }), 403

    connection = get_connection()
    cursor = connection.cursor()

    cursor.execute("""
        INSERT INTO EMPLOYEES
        (
            EMPLOYEE_ID,
            FIRST_NAME,
            LAST_NAME,
            EMAIL,
            PHONE,
            DEPARTMENT,
            JOB_TITLE,
            SALARY,
            HIRE_DATE
        )
        VALUES
        (
            :1,
            :2,
            :3,
            :4,
            :5,
            :6,
            :7,
            :8,
            TO_DATE(:9, 'YYYY-MM-DD')
        )
    """, (
        data["employee_id"],
        data["first_name"],
        data["last_name"],
        data["email"],
        data["phone"],
        data["department"],
        data["job_title"],
        data["salary"],
        data["hire_date"]
    ))

    connection.commit()

    cursor.close()
    connection.close()

    return jsonify({
        "message": "Employee added successfully"
    })


# ==========================================================
# UPDATE EMPLOYEE
# ==========================================================

@app.route("/api/employees/<int:employee_id>", methods=["PUT"])
def update_employee(employee_id):

    if not session.get("logged_in"):
        return jsonify({"error": "Unauthorized"}), 401

    data = request.json

    connection = get_connection()
    cursor = connection.cursor()

    # ------------------------------------------------------
    # Administrator can edit anyone
    # ------------------------------------------------------

    if session["role"] == "admin":

        cursor.execute("""
            UPDATE EMPLOYEES
            SET
                FIRST_NAME = :1,
                LAST_NAME = :2,
                EMAIL = :3,
                PHONE = :4,
                DEPARTMENT = :5,
                JOB_TITLE = :6,
                SALARY = :7,
                HIRE_DATE = TO_DATE(:8, 'YYYY-MM-DD')
            WHERE EMPLOYEE_ID = :9
        """, (
            data["first_name"],
            data["last_name"],
            data["email"],
            data["phone"],
            data["department"],
            data["job_title"],
            data["salary"],
            data["hire_date"],
            employee_id
        ))

    # ------------------------------------------------------
    # Department head
    # ------------------------------------------------------

    else:

        # First verify employee belongs to head's department
        cursor.execute("""
            SELECT DEPARTMENT
            FROM EMPLOYEES
            WHERE EMPLOYEE_ID = :id
        """, {
            "id": employee_id
        })

        employee = cursor.fetchone()

        if employee is None:

            cursor.close()
            connection.close()

            return jsonify({
                "error": "Employee not found."
            }), 404

        employee_department = employee[0]

        if employee_department.upper() != session["department"].upper():

            cursor.close()
            connection.close()

            return jsonify({
                "error": "You cannot edit employees from another department."
            }), 403

        # Prevent department head from moving employee
        # to another department.
        if data["department"].upper() != session["department"].upper():

            cursor.close()
            connection.close()

            return jsonify({
                "error": "You cannot change an employee's department."
            }), 403

        cursor.execute("""
            UPDATE EMPLOYEES
            SET
                FIRST_NAME = :1,
                LAST_NAME = :2,
                EMAIL = :3,
                PHONE = :4,
                JOB_TITLE = :5,
                SALARY = :6,
                HIRE_DATE = TO_DATE(:7, 'YYYY-MM-DD')
            WHERE EMPLOYEE_ID = :8
            AND UPPER(DEPARTMENT) = UPPER(:9)
        """, (
            data["first_name"],
            data["last_name"],
            data["email"],
            data["phone"],
            data["job_title"],
            data["salary"],
            data["hire_date"],
            employee_id,
            session["department"]
        ))

    connection.commit()

    cursor.close()
    connection.close()

    return jsonify({
        "message": "Employee updated successfully"
    })


# ==========================================================
# DELETE EMPLOYEE
# ==========================================================

@app.route("/api/employees/<int:employee_id>", methods=["DELETE"])
def delete_employee(employee_id):

    if not session.get("logged_in"):
        return jsonify({"error": "Unauthorized"}), 401

    # Only administrator can delete
    if session["role"] != "admin":

        return jsonify({
            "error": "Only the administrator can delete employees."
        }), 403

    connection = get_connection()
    cursor = connection.cursor()

    cursor.execute("""
        DELETE FROM EMPLOYEES
        WHERE EMPLOYEE_ID = :1
    """, (employee_id,))

    connection.commit()

    cursor.close()
    connection.close()

    return jsonify({
        "message": "Employee deleted successfully"
    })

# ==========================================================
# DATABASE CONSOLE
# ==========================================================

ALLOWED_CONSOLE_TABLES = {"EMPLOYEES", "DEPARTMENTS"}


def _fetch_table_schema(cur, table_name):
    cur.execute("""
        SELECT
            column_name,
            data_type,
            data_length,
            data_precision,
            data_scale,
            nullable,
            data_default
        FROM user_tab_columns
        WHERE table_name = :tname
        ORDER BY column_id
    """, {"tname": table_name.upper()})

    columns = []
    for c in cur.fetchall():
        data_type = c[1]
        if data_type in ("VARCHAR2", "CHAR", "NVARCHAR2", "NCHAR"):
            data_type = f"{data_type}({c[2]})"
        elif data_type == "NUMBER" and c[3] is not None:
            precision = c[3]
            scale = c[4]
            data_type = f"NUMBER({precision},{scale})" if scale else f"NUMBER({precision})"

        columns.append({
            "name": c[0],
            "type": data_type,
            "nullable": c[5],
            "default": "" if c[6] is None else str(c[6]).strip()
        })

    cur.execute("""
        SELECT
            uc.constraint_name,
            uc.constraint_type,
            ucc.column_name,
            uc.search_condition
        FROM user_constraints uc
        JOIN user_cons_columns ucc
        ON uc.constraint_name = ucc.constraint_name
        WHERE uc.table_name = :tname
        ORDER BY uc.constraint_name
    """, {"tname": table_name.upper()})

    constraints = []
    for c in cur.fetchall():
        constraint_type = {
            "P": "PRIMARY KEY",
            "R": "FOREIGN KEY",
            "U": "UNIQUE",
            "C": "CHECK"
        }.get(c[1], c[1])

        constraints.append({
            "name": c[0],
            "type": constraint_type,
            "column": c[2],
            "condition": c[3]
        })

    return {
        "columns": columns,
        "constraints": constraints
    }


def _validate_sql_allowed(sql):
    clean_sql = re.sub(r'--.*', '', sql)
    clean_sql = re.sub(r'/\*.*?\*/', '', clean_sql, flags=re.DOTALL).strip()
    if not clean_sql:
        return False, "Empty SQL statement."

    first_word = clean_sql.split()[0].upper()
    if first_word in ("SELECT", "WITH", "EXPLAIN", "DESC", "DESCRIBE"):
        return True, None

    # Check target table for DML / DDL modifications
    target_table = None
    patterns = [
        r'UPDATE\s+(?:ONLY\s+)?([A-Za-z0-9_".]+)',
        r'INSERT\s+INTO\s+([A-Za-z0-9_".]+)',
        r'DELETE\s+(?:FROM\s+)?([A-Za-z0-9_".]+)',
        r'MERGE\s+INTO\s+([A-Za-z0-9_".]+)',
        r'ALTER\s+TABLE\s+([A-Za-z0-9_".]+)',
        r'TRUNCATE\s+TABLE\s+([A-Za-z0-9_".]+)',
        r'DROP\s+TABLE\s+([A-Za-z0-9_".]+)',
        r'CREATE\s+TABLE\s+([A-Za-z0-9_".]+)'
    ]

    for pat in patterns:
        m = re.match(pat, clean_sql, re.IGNORECASE)
        if m:
            target_table = m.group(1)
            break

    if not target_table:
        return False, "Changes are only permitted on the EMPLOYEES and DEPARTMENTS tables."

    table_name = target_table.split(".")[-1].replace('"', '').strip().upper()
    if table_name not in ALLOWED_CONSOLE_TABLES:
        return False, f"Changes are only permitted on the EMPLOYEES and DEPARTMENTS tables (attempted: {table_name})."

    return True, None


@app.route("/api/db/schema")
def db_schema():

    if not session.get("logged_in"):
        return jsonify({"error": "Unauthorized"}), 401

    if session["role"] != "admin":
        return jsonify({"error": "Only administrator allowed"}), 403

    conn = get_connection()
    cur = conn.cursor()

    cur.execute("SELECT USER FROM DUAL")
    schema = cur.fetchone()[0]

    employees_schema = _fetch_table_schema(cur, "EMPLOYEES")
    departments_schema = _fetch_table_schema(cur, "DEPARTMENTS")

    cur.close()
    conn.close()

    return jsonify({
        "schema": schema,
        "table": "EMPLOYEES",
        "columns": employees_schema["columns"],
        "constraints": employees_schema["constraints"],
        "tables": {
            "EMPLOYEES": employees_schema,
            "DEPARTMENTS": departments_schema
        }
    })


def _split_sql_statements(sql):
    statements = []
    current = []
    in_single_quote = False
    in_double_quote = False
    in_line_comment = False
    in_block_comment = False
    i = 0
    n = len(sql)
    while i < n:
        char = sql[i]
        next_char = sql[i + 1] if i + 1 < n else ""
        if in_line_comment:
            current.append(char)
            if char == "\n":
                in_line_comment = False
            i += 1
            continue
        if in_block_comment:
            current.append(char)
            if char == "*" and next_char == "/":
                current.append("/")
                in_block_comment = False
                i += 2
                continue
            i += 1
            continue
        if char == "-" and next_char == "-" and not in_single_quote and not in_double_quote:
            in_line_comment = True
            current.extend(["-", "-"])
            i += 2
            continue
        if char == "/" and next_char == "*" and not in_single_quote and not in_double_quote:
            in_block_comment = True
            current.extend(["/", "*"])
            i += 2
            continue
        if char == "'" and not in_double_quote:
            in_single_quote = not in_single_quote
            current.append(char)
            i += 1
            continue
        if char == '"' and not in_single_quote:
            in_double_quote = not in_double_quote
            current.append(char)
            i += 1
            continue
        if char == ";" and not in_single_quote and not in_double_quote:
            stmt = "".join(current).strip()
            if stmt:
                statements.append(stmt)
            current = []
            i += 1
            continue
        current.append(char)
        i += 1
    rem = "".join(current).strip()
    if rem:
        statements.append(rem)
    return statements


@app.route("/api/db/execute", methods=["POST"])
def execute_sql():

    if not session.get("logged_in"):
        return jsonify({"error": "Unauthorized"}), 401

    if session["role"] != "admin":
        return jsonify({"error": "Only administrator allowed"}), 403

    raw_sql = (request.json.get("sql") or "").strip()
    if not raw_sql:
        return jsonify({"error": "Please enter an SQL statement."}), 400

    statements = _split_sql_statements(raw_sql)
    if not statements:
        clean = raw_sql.rstrip().rstrip(";").strip()
        if clean:
            statements = [clean]
        else:
            return jsonify({"error": "Please enter an SQL statement."}), 400

    # Ensure every statement is allowed
    for stmt in statements:
        is_allowed, error_msg = _validate_sql_allowed(stmt)
        if not is_allowed:
            return jsonify({"error": error_msg}), 403

    conn = get_connection()
    cur = conn.cursor()

    try:
        last_result = None
        total_affected = 0
        has_executed = False

        for stmt in statements:
            clean_stmt = stmt.rstrip().rstrip(";").strip()
            if not clean_stmt:
                continue

            cur.execute(clean_stmt)
            has_executed = True

            first_word = clean_stmt.split()[0].upper() if clean_stmt.split() else ""
            if first_word in ("SELECT", "WITH", "DESC", "DESCRIBE"):
                cols = [d[0] for d in cur.description] if cur.description else []
                rows = [list(r) for r in cur.fetchall()]
                last_result = {
                    "type": "select",
                    "columns": cols,
                    "rows": rows
                }
            else:
                conn.commit()
                if cur.rowcount and cur.rowcount > 0:
                    total_affected += cur.rowcount

        if last_result is not None:
            return jsonify(last_result)

        return jsonify({
            "type": "dml",
            "rows": total_affected if total_affected > 0 else (1 if has_executed else 0)
        })

    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 400

    finally:
        cur.close()
        conn.close()


# ==========================================================
# LOGOUT
# ==========================================================

@app.route("/logout")
def logout():

    session.clear()

    return redirect("/")


# ==========================================================
# RUN APPLICATION
# ==========================================================

if __name__ == "__main__":
    app.run(debug=True)