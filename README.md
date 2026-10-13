# HR Management System

A small Flask application for managing employees and departments in an Oracle database. The administrator can manage all records; department heads can view and edit employees in their own department.

## Requirements

- Python 3.9 or newer
- Oracle Database (the current `db.py` defaults to `localhost:1521/xe`)
- Oracle Instant Client Basic for Windows, required because `db.py` initializes `python-oracledb` in thick mode

## Oracle database setup

Connect to the Oracle schema that the application will use with SQL Developer, SQL\*Plus, or another Oracle SQL client. Run the following statements in that schema. The app connects using the username and password configured in `db.py`, so create the tables in that same schema.

```sql
CREATE TABLE DEPARTMENTS (
    DEPARTMENT_ID   NUMBER(6)      CONSTRAINT PK_DEPARTMENTS PRIMARY KEY,
    DEPARTMENT_NAME VARCHAR2(100)  NOT NULL,
    CONSTRAINT UQ_DEPARTMENTS_NAME UNIQUE (DEPARTMENT_NAME)
);

CREATE TABLE EMPLOYEES (
    EMPLOYEE_ID NUMBER(6)       CONSTRAINT PK_EMPLOYEES PRIMARY KEY,
    FIRST_NAME  VARCHAR2(100)   NOT NULL,
    LAST_NAME   VARCHAR2(100)   NOT NULL,
    EMAIL       VARCHAR2(254),
    PHONE       VARCHAR2(30),
    DEPARTMENT  VARCHAR2(100)   NOT NULL,
    JOB_TITLE   VARCHAR2(100)   NOT NULL,
    SALARY      NUMBER(10, 2)   DEFAULT 0 NOT NULL,
    HIRE_DATE   DATE            NOT NULL
);
```

The application stores the department name on each employee and updates those names itself when an administrator renames a department. For that reason, the example schema does not add a foreign key from `EMPLOYEES.DEPARTMENT` to `DEPARTMENTS`.

### Insert demo data

Insert the departments first, then the employees. The employee rows whose job titles end in `Head` demonstrate the department-head login accounts described below.

<details>
<summary>Show demo INSERT statements</summary>

```sql
INSERT INTO DEPARTMENTS (DEPARTMENT_ID, DEPARTMENT_NAME)
VALUES (10, 'Engineering');

INSERT INTO DEPARTMENTS (DEPARTMENT_ID, DEPARTMENT_NAME)
VALUES (20, 'Human Resources');

INSERT INTO DEPARTMENTS (DEPARTMENT_ID, DEPARTMENT_NAME)
VALUES (30, 'Finance');

INSERT INTO EMPLOYEES
    (EMPLOYEE_ID, FIRST_NAME, LAST_NAME, EMAIL, PHONE, DEPARTMENT, JOB_TITLE, SALARY, HIRE_DATE)
VALUES
    (1001, 'Avery', 'Morgan', 'avery.morgan@example.com', '555-0101', 'Engineering', 'Engineering Head', 9500, DATE '2021-03-15');

INSERT INTO EMPLOYEES
    (EMPLOYEE_ID, FIRST_NAME, LAST_NAME, EMAIL, PHONE, DEPARTMENT, JOB_TITLE, SALARY, HIRE_DATE)
VALUES
    (1002, 'Jordan', 'Lee', 'jordan.lee@example.com', '555-0102', 'Engineering', 'Software Engineer', 7200, DATE '2023-06-01');

INSERT INTO EMPLOYEES
    (EMPLOYEE_ID, FIRST_NAME, LAST_NAME, EMAIL, PHONE, DEPARTMENT, JOB_TITLE, SALARY, HIRE_DATE)
VALUES
    (2001, 'Taylor', 'Singh', 'taylor.singh@example.com', '555-0201', 'Human Resources', 'Human Resources Head', 8800, DATE '2020-11-09');

INSERT INTO EMPLOYEES
    (EMPLOYEE_ID, FIRST_NAME, LAST_NAME, EMAIL, PHONE, DEPARTMENT, JOB_TITLE, SALARY, HIRE_DATE)
VALUES
    (2002, 'Casey', 'Reed', 'casey.reed@example.com', '555-0202', 'Human Resources', 'Recruiter', 5900, DATE '2024-02-12');

INSERT INTO EMPLOYEES
    (EMPLOYEE_ID, FIRST_NAME, LAST_NAME, EMAIL, PHONE, DEPARTMENT, JOB_TITLE, SALARY, HIRE_DATE)
VALUES
    (3001, 'Riley', 'Chen', 'riley.chen@example.com', '555-0301', 'Finance', 'Finance Head', 9100, DATE '2019-08-20');

INSERT INTO EMPLOYEES
    (EMPLOYEE_ID, FIRST_NAME, LAST_NAME, EMAIL, PHONE, DEPARTMENT, JOB_TITLE, SALARY, HIRE_DATE)
VALUES
    (3002, 'Quinn', 'Patel', 'quinn.patel@example.com', '555-0302', 'Finance', 'Accountant', 6400, DATE '2022-04-04');

COMMIT;
```

</details>

The department names in `EMPLOYEES.DEPARTMENT` must match the names in `DEPARTMENTS.DEPARTMENT_NAME`. The application uses the latter to list departments and match employees to department heads.

## Install Oracle Instant Client on Windows

1. Check whether Python is 64-bit, then download the matching **Windows x64** (or x86, if using 32-bit Python) **Basic** ZIP package from the [Oracle Instant Client downloads](https://www.oracle.com/database/technologies/instant-client/downloads.html). Use a package supported by your Oracle Database and Windows version.
2. Install the Microsoft Visual C++ Redistributable required by the Instant Client release if it is not already installed.
3. Extract the ZIP to a permanent folder, for example `C:\oracle\instantclient_23_26`. The directory you use must contain `oci.dll`.
4. Open `db.py` and change the `lib_dir` argument in `oracledb.init_oracle_client(...)` to that extracted directory. For example:

   ```python
   oracledb.init_oracle_client(
       lib_dir=r"C:\oracle\instantclient_23_26"
   )
   ```

   Keep the `r` before the Windows path string, or escape the backslashes. Initialize the client before opening any database connections. The path currently in `db.py` is specific to the original development machine and must be changed on other computers.

## Configure the database connection

In `db.py`, set `DB_USERNAME`, `DB_PASSWORD`, `DB_HOST`, `DB_PORT`, and `DB_SERVICE` to match your Oracle database. The checked-in defaults are `system` / `root`, host `localhost`, port `1521`, and service `xe`; replace these with your own values. Use a dedicated application schema rather than the `SYSTEM` administrator account for anything beyond a local demo.

The connection string is assembled as `host:port/service_name`. The service name depends on your Oracle installation; for example, some Oracle XE versions use `XEPDB1` instead of `XE`. Verify the service name with your database configuration and use the same schema where you created the tables.

## Install and run

From the project directory, create a virtual environment, install the dependencies, and start Flask:

```powershell
py -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt
python app.py
```

Open <http://127.0.0.1:5000> in your browser.

## Demo logins

The administrator account is defined directly in `app.py`:

| Role                 | Username             | Password            |
| -------------------- | -------------------- | ------------------- |
| Administrator        | `admin`              | `admin123`          |
| Engineering head     | `engineeringhead`    | `engineering123`    |
| Human Resources head | `humanresourceshead` | `humanresources123` |
| Finance head         | `financehead`        | `finance123`        |

Department-head usernames are the department name converted to lowercase alphanumeric characters with `head` appended. Their passwords use the same normalized department name followed by `123`. A corresponding employee must have a job title such as `Engineering Head`. These credentials and the Flask session secret are for local demonstration only; do not deploy this app as-is with them.

## Troubleshooting

- **`DPI-1047: Cannot locate a 64-bit Oracle Client library`**: check that Instant Client is extracted, `lib_dir` points to the folder containing `oci.dll`, and the client architecture matches Python's architecture. Also install the required Visual C++ Redistributable.
- **Connection refused or service-name errors**: confirm that the Oracle listener is running and that host, port, and service name in `db.py` are correct.
- **Invalid credentials or missing table errors**: confirm that the configured database user can log in and that both tables were created in that user's schema.
