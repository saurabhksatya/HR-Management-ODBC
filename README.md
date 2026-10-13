# HR Management System

Flask application for managing employee and department records in an Oracle database. Administrators manage the organization; department heads work with employee records in their own department.

## Table of Contents

- [Features](#features)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Database Connection Configuration](#database-connection-configuration)
- [Database Setup](#database-setup)
- [Running the Project](#running-the-project)
- [User Roles and Permissions](#user-roles-and-permissions)
- [Business Logic](#business-logic)
- [Database Schema](#database-schema)
- [Troubleshooting](#troubleshooting)

## Features

- Employee directory with search and department filtering
- Employee create, edit, and delete workflows, subject to role permissions
- Department management for administrators, including employee counts and department-head display
- Dashboard statistics for employee count, department count, and average salary
- Administrator-only Oracle schema explorer and SQL console
- Session-based login for the administrator and dynamically generated department-head accounts

## Prerequisites

- Python 3.9 or newer
- Oracle Database with a listener and service name reachable from this machine
- Oracle Instant Client **Basic** for Windows. `db.py` initializes `python-oracledb` in thick mode, so the client libraries must be installed and accessible.
- A database schema/user with permission to create and manage the application tables
- Microsoft Visual C++ Redistributable required by the selected Instant Client version, if not already installed

## Installation

### Install Oracle Instant Client on Windows

1. Check whether Python is 64-bit, then download the matching **Windows x64** (or x86, for 32-bit Python) **Basic** ZIP package from the [Oracle Instant Client downloads](https://www.oracle.com/database/technologies/instant-client/downloads.html).
2. Extract it to a permanent folder, for example `C:\oracle\instantclient_23_26`. The directory must contain `oci.dll`.
3. In `db.py`, set the `lib_dir` argument in `oracledb.init_oracle_client(...)` to that directory. Keep the `r` prefix on a Windows path string, or escape the backslashes:

   ```python
   oracledb.init_oracle_client(
       lib_dir=r"C:\oracle\instantclient_23_26"
   )
   ```

The path currently checked into `db.py` points to the original development machine and must be changed on another computer.

### Install Python dependencies

From the project directory, create and activate a virtual environment, then install the requirements:

```powershell
py -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt
```

## Database Connection Configuration

Edit the connection settings in `db.py` to match your Oracle installation:

| Setting       | Purpose                | Checked-in value |
| ------------- | ---------------------- | ---------------- |
| `DB_USERNAME` | Oracle schema username | `system`         |
| `DB_PASSWORD` | Oracle schema password | `root`           |
| `DB_HOST`     | Database host          | `localhost`      |
| `DB_PORT`     | Oracle listener port   | `1521`           |
| `DB_SERVICE`  | Oracle service name    | `xe`             |

The DSN is assembled as `host:port/service_name`. Some Oracle XE installations use `XEPDB1` rather than `XE`; use the service name configured on your database. The tables must be created in the schema used by these credentials.

The checked-in credentials and use of the `SYSTEM` account are for local demonstration only. Use a dedicated least-privilege application schema and keep credentials out of source control for any shared or deployed environment.

## Database Setup

Connect to the Oracle schema configured in `db.py` using SQL Developer, SQL\*Plus, or another Oracle SQL client. Run the following DDL in that schema:

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

The application stores the department name directly in `EMPLOYEES.DEPARTMENT`; it does not define a foreign key to `DEPARTMENTS`. When an administrator renames a department through the app, employee department values are updated as well.

### Optional demo data

Insert the departments first, then the employees. These sample rows make the dashboard useful for trying out the application. The `Head` job titles identify sample department heads for display; department-head login accounts are derived from department names as described under [User Roles and Permissions](#user-roles-and-permissions).

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

Keep department names consistent between `EMPLOYEES.DEPARTMENT` and `DEPARTMENTS.DEPARTMENT_NAME`. The application uses the department table for department management and account lookup.

## Running the Project

With the virtual environment active, Instant Client configured, and database tables created, start Flask from the project directory:

```powershell
python app.py
```

Open <http://127.0.0.1:5000> in your browser and sign in with one of the accounts below.

## User Roles and Permissions

The administrator account and password are defined directly in `app.py`. Department-head credentials are generated from rows in `DEPARTMENTS`:

| Role                            | Demo username        | Demo password       | Permissions                                                                                                                                                                          |
| ------------------------------- | -------------------- | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Administrator                   | `admin`              | `admin123`          | View, add, edit, and delete employees; manage departments; use the schema explorer and SQL console.                                                                                  |
| Engineering department head     | `engineeringhead`    | `engineering123`    | View and add employees in Engineering; edit employees in Engineering without changing their department. Cannot delete employees, manage departments, or use the SQL console.         |
| Human Resources department head | `humanresourceshead` | `humanresources123` | View and add employees in Human Resources; edit employees in Human Resources without changing their department. Cannot delete employees, manage departments, or use the SQL console. |
| Finance department head         | `financehead`        | `finance123`        | View and add employees in Finance; edit employees in Finance without changing their department. Cannot delete employees, manage departments, or use the SQL console.                 |

For any department, its username is its name converted to lowercase alphanumeric characters with `head` appended; its password is the same normalized name followed by `123`. For example, `Human Resources` becomes `humanresourceshead` / `humanresources123`. The department must exist in `DEPARTMENTS`; a matching employee/job title is not checked at login. All listed credentials and the Flask session secret in `app.py` are demonstration values and must be replaced before deployment.

## Business Logic

- Employee listings are scoped to the signed-in user's department for department heads; administrators see all employees.
- Department heads can create employee records only for their own department and can edit only employees already in that department. They cannot move an employee to a different department or delete employee records.
- Only administrators can create, rename, or delete departments. A department cannot be deleted while employees are assigned to it. Renaming a department also updates matching employee department values.
- A department-head account is resolved by normalizing a department name to lowercase letters and digits. Its login password is that normalized name plus `123`.
- Employee hire dates are stored as Oracle `DATE` values and accepted by the API in `YYYY-MM-DD` form. The directory displays them as `DD-MM-YYYY`.
- The dashboard displays salary values as monthly and annual amounts; the annual amount is calculated as monthly salary multiplied by 12.
- The administrator SQL console presents schema metadata and supports queries, DML on the application tables, and `ALTER TABLE` operations for added columns. Added columns appear in the employee or department directory and its corresponding add/edit modal. Built-in columns cannot be modified or dropped, only added columns can be modified or dropped, and table `DROP` commands are rejected. The console is intended only for a trusted local demo; its SQL checks are not a security boundary. Do not expose it to untrusted users or deploy this application as-is.

## Database Schema

The app expects two tables in the connected Oracle schema:

| Table         | Column            | Oracle type     | Rules / purpose                                                     |
| ------------- | ----------------- | --------------- | ------------------------------------------------------------------- |
| `DEPARTMENTS` | `DEPARTMENT_ID`   | `NUMBER(6)`     | Primary key.                                                        |
| `DEPARTMENTS` | `DEPARTMENT_NAME` | `VARCHAR2(100)` | Required and unique.                                                |
| `EMPLOYEES`   | `EMPLOYEE_ID`     | `NUMBER(6)`     | Primary key.                                                        |
| `EMPLOYEES`   | `FIRST_NAME`      | `VARCHAR2(100)` | Required.                                                           |
| `EMPLOYEES`   | `LAST_NAME`       | `VARCHAR2(100)` | Required.                                                           |
| `EMPLOYEES`   | `EMAIL`           | `VARCHAR2(254)` | Optional.                                                           |
| `EMPLOYEES`   | `PHONE`           | `VARCHAR2(30)`  | Optional.                                                           |
| `EMPLOYEES`   | `DEPARTMENT`      | `VARCHAR2(100)` | Required; stores the department name.                               |
| `EMPLOYEES`   | `JOB_TITLE`       | `VARCHAR2(100)` | Required.                                                           |
| `EMPLOYEES`   | `SALARY`          | `NUMBER(10, 2)` | Required; defaults to `0`. Used as monthly salary in the interface. |
| `EMPLOYEES`   | `HIRE_DATE`       | `DATE`          | Required.                                                           |

There is no foreign key between the tables in the supplied schema. Department name values are maintained by the application when an administrator renames a department.

## Troubleshooting

- **`DPI-1047: Cannot locate a 64-bit Oracle Client library`**: check that Instant Client is extracted, `lib_dir` points to the folder containing `oci.dll`, and the client architecture matches Python's architecture. Also install the required Visual C++ Redistributable.
- **Connection refused or service-name errors**: confirm that the Oracle listener is running and that `DB_HOST`, `DB_PORT`, and `DB_SERVICE` in `db.py` are correct. Verify whether your service is named `XE`, `XEPDB1`, or something else.
- **Invalid database credentials**: verify `DB_USERNAME` and `DB_PASSWORD`, and confirm the user can connect to the configured service.
- **Missing table or column errors**: create both tables in the same schema used by the configured database account, and check that the names and columns match the schema above.
- **Department-head login fails**: confirm the department exists in `DEPARTMENTS`, then use the normalized department name plus `head` as the username and the normalized name plus `123` as the password. Normalization removes spaces and punctuation and uses lowercase letters/digits.
- **PowerShell does not allow environment activation**: either activate the virtual environment in a permitted shell, or run its Python directly with `\.venv\Scripts\python.exe -m pip install -r requirements.txt` and `\.venv\Scripts\python.exe app.py`.
