// ==========================================================================
// TalentPulse Enterprise HR Management - Core Client Application
// Full Vercel Static & Local Browser DB Engine with DDL/DML Support
// ==========================================================================

let editingEmployee = false;
let editingId = null;
let editingDepartmentName = null;
let allEmployees = [];
let allDepartments = [];
let customEmployeeColumns = [];
let customDepartmentColumns = [];
let customEmployeeColumnTypes = {};
let customDepartmentColumnTypes = {};
let cachedSchemaData = null;
let currentSchemaTable = "EMPLOYEES";

// User session variables
let userRole = "admin";
let userDepartment = "";
let currentUsername = "admin";

// Server connection state (null = unknown, true = online, false = local/offline)
let serverAvailable = sessionStorage.getItem("server_status") === "offline" ? false : null;

// ==========================================================================
// THEME MANAGEMENT (DARK / LIGHT MODE)
// ==========================================================================

function initTheme() {
    const savedTheme = localStorage.getItem("talentpulse_theme") ||
        (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    applyTheme(savedTheme);

    const toggleBtns = document.querySelectorAll("#themeToggleBtn");
    toggleBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            const current = document.documentElement.getAttribute("data-theme") || "light";
            const newTheme = current === "dark" ? "light" : "dark";
            applyTheme(newTheme);
        });
    });
}

function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("talentpulse_theme", theme);
}

// ==========================================================================
// LOCAL BROWSER DATABASE & SEEDED MOCK DATA
// ==========================================================================

const LOCAL_DB_KEY = "talentpulse_local_db_v1";

function getSeedDB() {
    return {
        users: {
            admin: {
                username: "admin",
                password: "admin123",
                role: "admin",
                department: ""
            }
        },
        tables: {
            DEPARTMENTS: {
                columns: [
                    { name: "DEPARTMENT_ID", type: "NUMBER(4)", nullable: "N", default: "", custom: false },
                    { name: "DEPARTMENT_NAME", type: "VARCHAR2(50)", nullable: "N", default: "", custom: false }
                ],
                constraints: [
                    { name: "DEPT_ID_PK", type: "PRIMARY KEY", column: "DEPARTMENT_ID", condition: null },
                    { name: "DEPT_NAME_UQ", type: "UNIQUE", column: "DEPARTMENT_NAME", condition: null }
                ],
                rows: [
                    { id: 1, name: "Engineering", custom_fields: {} },
                    { id: 2, name: "Human Resources", custom_fields: {} },
                    { id: 3, name: "Finance", custom_fields: {} },
                    { id: 4, name: "Marketing", custom_fields: {} },
                    { id: 5, name: "Sales", custom_fields: {} },
                    { id: 6, name: "Operations", custom_fields: {} }
                ]
            },
            EMPLOYEES: {
                columns: [
                    { name: "EMPLOYEE_ID", type: "NUMBER(6)", nullable: "N", default: "", custom: false },
                    { name: "FIRST_NAME", type: "VARCHAR2(50)", nullable: "N", default: "", custom: false },
                    { name: "LAST_NAME", type: "VARCHAR2(50)", nullable: "Y", default: "", custom: false },
                    { name: "EMAIL", type: "VARCHAR2(100)", nullable: "Y", default: "", custom: false },
                    { name: "PHONE", type: "VARCHAR2(30)", nullable: "Y", default: "", custom: false },
                    { name: "DEPARTMENT", type: "VARCHAR2(50)", nullable: "N", default: "", custom: false },
                    { name: "JOB_TITLE", type: "VARCHAR2(60)", nullable: "N", default: "", custom: false },
                    { name: "SALARY", type: "NUMBER(10,2)", nullable: "Y", default: "", custom: false },
                    { name: "HIRE_DATE", type: "DATE", nullable: "Y", default: "", custom: false }
                ],
                constraints: [
                    { name: "EMP_ID_PK", type: "PRIMARY KEY", column: "EMPLOYEE_ID", condition: null }
                ],
                rows: [
                    {
                        employee_id: 101,
                        first_name: "Aarav",
                        last_name: "Sharma",
                        email: "aarav.sharma@company.com",
                        phone: "+91 98765 43210",
                        department: "Engineering",
                        job_title: "Engineering Head",
                        salary: 185000,
                        hire_date: "15-01-2021",
                        custom_fields: {}
                    },
                    {
                        employee_id: 102,
                        first_name: "Priya",
                        last_name: "Patel",
                        email: "priya.patel@company.com",
                        phone: "+91 98765 43211",
                        department: "Human Resources",
                        job_title: "HR Head",
                        salary: 145000,
                        hire_date: "10-05-2020",
                        custom_fields: {}
                    },
                    {
                        employee_id: 103,
                        first_name: "Rohan",
                        last_name: "Verma",
                        email: "rohan.verma@company.com",
                        phone: "+91 98765 43212",
                        department: "Finance",
                        job_title: "Finance Head",
                        salary: 160000,
                        hire_date: "04-11-2019",
                        custom_fields: {}
                    },
                    {
                        employee_id: 104,
                        first_name: "Ananya",
                        last_name: "Deshmukh",
                        email: "ananya.d@company.com",
                        phone: "+91 98765 43213",
                        department: "Marketing",
                        job_title: "Marketing Head",
                        salary: 140000,
                        hire_date: "18-02-2022",
                        custom_fields: {}
                    },
                    {
                        employee_id: 105,
                        first_name: "Vikram",
                        last_name: "Malhotra",
                        email: "vikram.m@company.com",
                        phone: "+91 98765 43214",
                        department: "Sales",
                        job_title: "Sales Head",
                        salary: 155000,
                        hire_date: "22-08-2021",
                        custom_fields: {}
                    },
                    {
                        employee_id: 106,
                        first_name: "Neha",
                        last_name: "Kapoor",
                        email: "neha.k@company.com",
                        phone: "+91 98765 43215",
                        department: "Operations",
                        job_title: "Operations Head",
                        salary: 135000,
                        hire_date: "14-09-2020",
                        custom_fields: {}
                    },
                    {
                        employee_id: 107,
                        first_name: "Kavita",
                        last_name: "Rao",
                        email: "kavita.rao@company.com",
                        phone: "+91 98765 43216",
                        department: "Engineering",
                        job_title: "Senior Software Engineer",
                        salary: 125000,
                        hire_date: "11-04-2022",
                        custom_fields: {}
                    },
                    {
                        employee_id: 108,
                        first_name: "Rahul",
                        last_name: "Nair",
                        email: "rahul.nair@company.com",
                        phone: "+91 98765 43217",
                        department: "Engineering",
                        job_title: "Frontend Specialist",
                        salary: 95000,
                        hire_date: "20-01-2023",
                        custom_fields: {}
                    },
                    {
                        employee_id: 109,
                        first_name: "Sneha",
                        last_name: "Gupta",
                        email: "sneha.gupta@company.com",
                        phone: "+91 98765 43218",
                        department: "Human Resources",
                        job_title: "Talent Acquisition Lead",
                        salary: 85000,
                        hire_date: "01-07-2022",
                        custom_fields: {}
                    },
                    {
                        employee_id: 110,
                        first_name: "Amit",
                        last_name: "Joshi",
                        email: "amit.joshi@company.com",
                        phone: "+91 98765 43219",
                        department: "Finance",
                        job_title: "Senior Financial Analyst",
                        salary: 98000,
                        hire_date: "15-10-2021",
                        custom_fields: {}
                    },
                    {
                        employee_id: 111,
                        first_name: "Divya",
                        last_name: "Iyer",
                        email: "divya.iyer@company.com",
                        phone: "+91 98765 43220",
                        department: "Marketing",
                        job_title: "Digital Growth Manager",
                        salary: 90000,
                        hire_date: "05-03-2023",
                        custom_fields: {}
                    },
                    {
                        employee_id: 112,
                        first_name: "Siddharth",
                        last_name: "Mehta",
                        email: "sid.mehta@company.com",
                        phone: "+91 98765 43221",
                        department: "Sales",
                        job_title: "Senior Account Executive",
                        salary: 92000,
                        hire_date: "12-11-2022",
                        custom_fields: {}
                    }
                ]
            }
        }
    };
}

function getLocalDB() {
    try {
        const raw = localStorage.getItem(LOCAL_DB_KEY);
        if (!raw) {
            const seed = getSeedDB();
            saveLocalDB(seed);
            return seed;
        }
        const parsed = JSON.parse(raw);
        if (!parsed.tables || !parsed.tables.EMPLOYEES || !parsed.tables.DEPARTMENTS) {
            const seed = getSeedDB();
            saveLocalDB(seed);
            return seed;
        }
        if (!parsed.users) {
            parsed.users = {
                admin: {
                    username: "admin",
                    password: "admin123",
                    role: "admin",
                    department: ""
                }
            };
            saveLocalDB(parsed);
        }
        return parsed;
    } catch (e) {
        const seed = getSeedDB();
        saveLocalDB(seed);
        return seed;
    }
}

function saveLocalDB(db) {
    try {
        localStorage.setItem(LOCAL_DB_KEY, JSON.stringify(db));
    } catch (e) {
        console.error("Failed to persist local DB:", e);
    }
}

// Built-in columns protection definition
const BUILTIN_COLUMNS = {
    EMPLOYEES: new Set([
        "EMPLOYEE_ID", "FIRST_NAME", "LAST_NAME", "EMAIL", "PHONE",
        "DEPARTMENT", "JOB_TITLE", "SALARY", "HIRE_DATE"
    ]),
    DEPARTMENTS: new Set(["DEPARTMENT_ID", "DEPARTMENT_NAME"])
};

// ==========================================================
// LOCAL DDL & DML SQL ENGINE
// ==========================================================

function splitSqlStatements(sql) {
    const statements = [];
    let current = "";
    let inSingleQuote = false;
    let inDoubleQuote = false;
    let inLineComment = false;
    let inBlockComment = false;

    for (let i = 0; i < sql.length; i++) {
        const char = sql[i];
        const nextChar = sql[i + 1] || "";

        if (inLineComment) {
            if (char === "\n") inLineComment = false;
            continue;
        }
        if (inBlockComment) {
            if (char === "*" && nextChar === "/") {
                inBlockComment = false;
                i++;
            }
            continue;
        }
        if (char === "-" && nextChar === "-" && !inSingleQuote && !inDoubleQuote) {
            inLineComment = true;
            i++;
            continue;
        }
        if (char === "/" && nextChar === "*" && !inSingleQuote && !inDoubleQuote) {
            inBlockComment = true;
            i++;
            continue;
        }
        if (char === "'" && !inDoubleQuote) {
            inSingleQuote = !inSingleQuote;
            current += char;
            continue;
        }
        if (char === '"' && !inSingleQuote) {
            inDoubleQuote = !inDoubleQuote;
            current += char;
            continue;
        }
        if (char === ";" && !inSingleQuote && !inDoubleQuote) {
            const trimmed = current.trim();
            if (trimmed) statements.push(trimmed);
            current = "";
            continue;
        }
        current += char;
    }

    const rem = current.trim();
    if (rem) statements.push(rem);
    return statements;
}

function cleanSqlStatement(sql) {
    let clean = sql.replace(/--.*$/gm, "");
    clean = clean.replace(/\/\*[\s\S]*?\*\//g, "");
    return clean.trim();
}

function parseSqlLiteral(token) {
    if (!token) return null;
    const t = token.trim();
    if (/^null$/i.test(t)) return null;
    if (/^true$/i.test(t)) return true;
    if (/^false$/i.test(t)) return false;
    if ((t.startsWith("'") && t.endsWith("'")) || (t.startsWith('"') && t.endsWith('"'))) {
        return t.slice(1, -1);
    }
    const num = Number(t);
    return isNaN(num) ? t : num;
}

function evaluateWhereCondition(row, whereClause) {
    if (!whereClause || !whereClause.trim()) return true;
    const clause = whereClause.trim();

    // Check for logical AND / OR
    if (/\s+AND\s+/i.test(clause)) {
        const parts = clause.split(/\s+AND\s+/i);
        return parts.every(p => evaluateWhereCondition(row, p));
    }
    if (/\s+OR\s+/i.test(clause)) {
        const parts = clause.split(/\s+OR\s+/i);
        return parts.some(p => evaluateWhereCondition(row, p));
    }

    // Match column, operator, value
    // E.g. UPPER(DEPARTMENT) = 'HR' or SALARY >= 100000 or EMPLOYEE_ID = 101
    const match = clause.match(/^(?:UPPER\s*\(\s*([A-Za-z0-9_]+)\s*\)|([A-Za-z0-9_]+))\s*(=|!=|<>|>=|<=|>|<|LIKE)\s*(.+)$/i);
    if (!match) {
        return true;
    }

    const colName = (match[1] || match[2]).toUpperCase();
    const isUpper = Boolean(match[1]);
    const op = match[3].toUpperCase();
    let targetVal = parseSqlLiteral(match[4].trim());

    // Resolve row value
    let rowVal = null;
    if (row.custom_fields && colName in row.custom_fields) {
        rowVal = row.custom_fields[colName];
    } else {
        const keyMap = {
            EMPLOYEE_ID: "employee_id",
            FIRST_NAME: "first_name",
            LAST_NAME: "last_name",
            EMAIL: "email",
            PHONE: "phone",
            DEPARTMENT: "department",
            JOB_TITLE: "job_title",
            SALARY: "salary",
            HIRE_DATE: "hire_date",
            DEPARTMENT_ID: "id",
            DEPARTMENT_NAME: "name"
        };
        const prop = keyMap[colName] || colName.toLowerCase();
        rowVal = row[prop];
    }

    if (rowVal === null || rowVal === undefined) {
        return false;
    }

    if (isUpper) {
        rowVal = String(rowVal).toUpperCase();
        if (typeof targetVal === "string") targetVal = targetVal.toUpperCase();
    }

    if (op === "=") {
        if (typeof targetVal === "number") return Number(rowVal) === targetVal;
        return String(rowVal).toLowerCase() === String(targetVal).toLowerCase();
    }
    if (op === "!=" || op === "<>") {
        if (typeof targetVal === "number") return Number(rowVal) !== targetVal;
        return String(rowVal).toLowerCase() !== String(targetVal).toLowerCase();
    }
    if (op === ">") return Number(rowVal) > Number(targetVal);
    if (op === "<") return Number(rowVal) < Number(targetVal);
    if (op === ">=") return Number(rowVal) >= Number(targetVal);
    if (op === "<=") return Number(rowVal) <= Number(targetVal);
    if (op === "LIKE") {
        const pattern = String(targetVal).replace(/%/g, ".*").replace(/_/g, ".");
        const regex = new RegExp(`^${pattern}$`, "i");
        return regex.test(String(rowVal));
    }

    return true;
}

function executeLocalSQL(rawSql) {
    const db = getLocalDB();
    const statements = splitSqlStatements(rawSql);
    if (statements.length === 0) {
        return { error: "Please enter an SQL statement." };
    }

    let lastResult = null;
    let totalAffected = 0;
    let hasExecuted = false;

    for (const stmt of statements) {
        const clean = cleanSqlStatement(stmt);
        if (!clean) continue;

        const firstWord = clean.split(/\s+/)[0].toUpperCase();

        // 1. Validate DROP TABLE commands
        if (firstWord === "DROP" && /^\s*DROP\s+TABLE/i.test(clean)) {
            return { error: "DROP commands are not allowed. Tables and original columns cannot be dropped." };
        }

        // 2. DDL: ALTER TABLE
        if (firstWord === "ALTER") {
            const alterMatch = clean.match(/^ALTER\s+TABLE\s+([A-Za-z0-9_]+)\s+(ADD|MODIFY|DROP)\s+(?:COLUMN\s+)?([A-Za-z0-9_]+)(?:\s+(.+))?$/i);
            if (!alterMatch) {
                return { error: "Use a supported ALTER TABLE command (e.g. ALTER TABLE EMPLOYEES ADD CUSTOM_FIELD VARCHAR2(100))." };
            }

            const tableName = alterMatch[1].toUpperCase();
            const operation = alterMatch[2].toUpperCase();
            const colName = alterMatch[3].toUpperCase();
            const colType = (alterMatch[4] || "VARCHAR2(100)").trim().toUpperCase();

            if (!["EMPLOYEES", "DEPARTMENTS"].includes(tableName)) {
                return { error: "ALTER is only permitted on EMPLOYEES and DEPARTMENTS." };
            }

            if (BUILTIN_COLUMNS[tableName].has(colName)) {
                return { error: "Original application columns cannot be modified or dropped." };
            }

            const tableObj = db.tables[tableName];
            const existingColIndex = tableObj.columns.findIndex(c => c.name === colName);

            if (operation === "ADD") {
                if (existingColIndex !== -1) {
                    return { error: "That added column already exists." };
                }
                tableObj.columns.push({
                    name: colName,
                    type: colType,
                    nullable: "Y",
                    default: "",
                    custom: true
                });
                tableObj.rows.forEach(r => {
                    r.custom_fields = r.custom_fields || {};
                    r.custom_fields[colName] = null;
                });
            } else if (operation === "MODIFY") {
                if (existingColIndex === -1 || !tableObj.columns[existingColIndex].custom) {
                    return { error: "Only existing user-added columns can be modified or dropped." };
                }
                tableObj.columns[existingColIndex].type = colType;
            } else if (operation === "DROP") {
                if (existingColIndex === -1 || !tableObj.columns[existingColIndex].custom) {
                    return { error: "Only existing user-added columns can be modified or dropped." };
                }
                tableObj.columns.splice(existingColIndex, 1);
                tableObj.rows.forEach(r => {
                    if (r.custom_fields) delete r.custom_fields[colName];
                });
            }

            saveLocalDB(db);
            hasExecuted = true;
            totalAffected += 1;
            continue;
        }

        // 3. SELECT Queries
        if (firstWord === "SELECT" || firstWord === "WITH") {
            if (/FROM\s+DUAL\b/i.test(clean)) {
                lastResult = {
                    type: "select",
                    columns: ["USER"],
                    rows: [["SYSTEM"]]
                };
                hasExecuted = true;
                continue;
            }

            const fromMatch = clean.match(/FROM\s+([A-Za-z0-9_]+)/i);
            if (!fromMatch) {
                return { error: "Could not parse FROM clause." };
            }

            const tableName = fromMatch[1].toUpperCase();
            if (!["EMPLOYEES", "DEPARTMENTS"].includes(tableName)) {
                return { error: "Queries are only permitted on EMPLOYEES, DEPARTMENTS, and DUAL." };
            }

            const tableObj = db.tables[tableName];
            const whereMatch = clean.match(/WHERE\s+([\s\S]+?)(?:\s+ORDER\s+BY|\s*$)/i);
            const whereClause = whereMatch ? whereMatch[1] : null;

            // Filter rows
            let rows = tableObj.rows.filter(r => evaluateWhereCondition(r, whereClause));

            // Order By
            const orderMatch = clean.match(/ORDER\s+BY\s+([A-Za-z0-9_]+)(?:\s+(ASC|DESC))?/i);
            if (orderMatch) {
                const orderCol = orderMatch[1].toUpperCase();
                const isDesc = (orderMatch[2] || "").toUpperCase() === "DESC";
                rows.sort((a, b) => {
                    let va = a[orderCol.toLowerCase()] ?? (a.custom_fields ? a.custom_fields[orderCol] : null);
                    let vb = b[orderCol.toLowerCase()] ?? (b.custom_fields ? b.custom_fields[orderCol] : null);
                    if (va === vb) return 0;
                    if (va === null || va === undefined) return 1;
                    if (vb === null || vb === undefined) return -1;
                    if (va > vb) return isDesc ? -1 : 1;
                    return isDesc ? 1 : -1;
                });
            }

            // Determine columns
            const selectColsMatch = clean.match(/SELECT\s+([\s\S]+?)\s+FROM/i);
            const colListStr = selectColsMatch ? selectColsMatch[1].trim() : "*";

            let outputCols = [];
            let outputRows = [];

            if (colListStr === "*") {
                outputCols = tableObj.columns.map(c => c.name);
                outputRows = rows.map(r => {
                    return outputCols.map(c => {
                        if (c === "DEPARTMENT_ID") return r.id;
                        if (c === "DEPARTMENT_NAME") return r.name;
                        const key = c.toLowerCase();
                        if (key in r) return r[key];
                        return r.custom_fields ? r.custom_fields[c] : null;
                    });
                });
            } else if (/COUNT\s*\(\s*\*\s*\)/i.test(colListStr)) {
                outputCols = ["COUNT(*)"];
                outputRows = [[rows.length]];
            } else {
                const requestedCols = colListStr.split(",").map(c => c.trim().replace(/^["']|["']$/g, "").toUpperCase());
                outputCols = requestedCols;
                outputRows = rows.map(r => {
                    return outputCols.map(c => {
                        if (c === "DEPARTMENT_ID") return r.id;
                        if (c === "DEPARTMENT_NAME") return r.name;
                        const key = c.toLowerCase();
                        if (key in r) return r[key];
                        return r.custom_fields ? r.custom_fields[c] : null;
                    });
                });
            }

            lastResult = {
                type: "select",
                columns: outputCols,
                rows: outputRows
            };
            hasExecuted = true;
            continue;
        }

        // 4. INSERT INTO
        if (firstWord === "INSERT") {
            const insertMatch = clean.match(/INSERT\s+INTO\s+([A-Za-z0-9_]+)\s*\(([\s\S]+?)\)\s*VALUES\s*\(([\s\S]+?)\)/i);
            if (!insertMatch) {
                return { error: "Could not parse INSERT statement." };
            }

            const tableName = insertMatch[1].toUpperCase();
            if (!["EMPLOYEES", "DEPARTMENTS"].includes(tableName)) {
                return { error: "Changes are only permitted on EMPLOYEES and DEPARTMENTS." };
            }

            const colNames = insertMatch[2].split(",").map(c => c.trim().replace(/^["']|["']$/g, "").toUpperCase());
            const colValues = insertMatch[3].split(",").map(v => parseSqlLiteral(v.trim()));

            const tableObj = db.tables[tableName];
            const newRecord = { custom_fields: {} };

            colNames.forEach((col, idx) => {
                const val = colValues[idx];
                if (tableName === "EMPLOYEES") {
                    if (col === "EMPLOYEE_ID") newRecord.employee_id = Number(val);
                    else if (col === "FIRST_NAME") newRecord.first_name = val;
                    else if (col === "LAST_NAME") newRecord.last_name = val;
                    else if (col === "EMAIL") newRecord.email = val;
                    else if (col === "PHONE") newRecord.phone = val;
                    else if (col === "DEPARTMENT") newRecord.department = val;
                    else if (col === "JOB_TITLE") newRecord.job_title = val;
                    else if (col === "SALARY") newRecord.salary = Number(val) || 0;
                    else if (col === "HIRE_DATE") newRecord.hire_date = normalizeDateOutput(val);
                    else newRecord.custom_fields[col] = val;
                } else if (tableName === "DEPARTMENTS") {
                    if (col === "DEPARTMENT_ID") newRecord.id = Number(val);
                    else if (col === "DEPARTMENT_NAME") newRecord.name = String(val);
                    else newRecord.custom_fields[col] = val;
                }
            });

            tableObj.rows.push(newRecord);
            saveLocalDB(db);
            hasExecuted = true;
            totalAffected += 1;
            continue;
        }

        // 5. UPDATE
        if (firstWord === "UPDATE") {
            const updateMatch = clean.match(/UPDATE\s+([A-Za-z0-9_]+)\s+SET\s+([\s\S]+?)(?:\s+WHERE\s+([\s\S]+?))?$/i);
            if (!updateMatch) {
                return { error: "Could not parse UPDATE statement." };
            }

            const tableName = updateMatch[1].toUpperCase();
            if (!["EMPLOYEES", "DEPARTMENTS"].includes(tableName)) {
                return { error: "Changes are only permitted on EMPLOYEES and DEPARTMENTS." };
            }

            const setClause = updateMatch[2];
            const whereClause = updateMatch[3] || null;

            const assignments = setClause.split(",").map(a => {
                const [col, val] = a.split("=");
                return {
                    col: col.trim().replace(/^["']|["']$/g, "").toUpperCase(),
                    val: parseSqlLiteral(val.trim())
                };
            });

            const tableObj = db.tables[tableName];
            let affected = 0;

            tableObj.rows.forEach(r => {
                if (evaluateWhereCondition(r, whereClause)) {
                    affected++;
                    assignments.forEach(({ col, val }) => {
                        if (tableName === "EMPLOYEES") {
                            if (col === "FIRST_NAME") r.first_name = val;
                            else if (col === "LAST_NAME") r.last_name = val;
                            else if (col === "EMAIL") r.email = val;
                            else if (col === "PHONE") r.phone = val;
                            else if (col === "DEPARTMENT") r.department = val;
                            else if (col === "JOB_TITLE") r.job_title = val;
                            else if (col === "SALARY") r.salary = Number(val) || 0;
                            else if (col === "HIRE_DATE") r.hire_date = normalizeDateOutput(val);
                            else {
                                r.custom_fields = r.custom_fields || {};
                                r.custom_fields[col] = val;
                            }
                        } else if (tableName === "DEPARTMENTS") {
                            if (col === "DEPARTMENT_NAME") r.name = String(val);
                            else {
                                r.custom_fields = r.custom_fields || {};
                                r.custom_fields[col] = val;
                            }
                        }
                    });
                }
            });

            saveLocalDB(db);
            hasExecuted = true;
            totalAffected += affected;
            continue;
        }

        // 6. DELETE FROM
        if (firstWord === "DELETE") {
            const deleteMatch = clean.match(/DELETE\s+(?:FROM\s+)?([A-Za-z0-9_]+)(?:\s+WHERE\s+([\s\S]+?))?$/i);
            if (!deleteMatch) {
                return { error: "Could not parse DELETE statement." };
            }

            const tableName = deleteMatch[1].toUpperCase();
            if (!["EMPLOYEES", "DEPARTMENTS"].includes(tableName)) {
                return { error: "Changes are only permitted on EMPLOYEES and DEPARTMENTS." };
            }

            const whereClause = deleteMatch[2] || null;
            const tableObj = db.tables[tableName];

            const initialCount = tableObj.rows.length;
            tableObj.rows = tableObj.rows.filter(r => !evaluateWhereCondition(r, whereClause));
            const deleted = initialCount - tableObj.rows.length;

            saveLocalDB(db);
            hasExecuted = true;
            totalAffected += deleted;
            continue;
        }

        return { error: `Command ${firstWord} is not supported in this console.` };
    }

    if (lastResult !== null) {
        return lastResult;
    }

    return {
        type: "dml",
        rows: totalAffected > 0 ? totalAffected : (hasExecuted ? 1 : 0)
    };
}

function normalizeDateOutput(dateStr) {
    if (!dateStr) return "-";
    const s = String(dateStr).trim();
    if (/^\d{2}-\d{2}-\d{4}$/.test(s)) return s;
    if (/^\d{4}-\d{2}-\d{2}/.test(s)) {
        const parts = s.slice(0, 10).split("-");
        return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    return s;
}

function normalizeDateInput(dateStr) {
    if (!dateStr) return "";
    const s = String(dateStr).trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
    if (/^\d{2}-\d{2}-\d{4}$/.test(s)) {
        const parts = s.split("-");
        return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    return s;
}

// ==========================================================================
// LOCAL API HANDLER
// ==========================================================================

async function localApiHandler(url, options = {}) {
    const db = getLocalDB();
    const method = (options.method || "GET").toUpperCase();
    const body = options.body ? JSON.parse(options.body) : {};
    const parsedUrl = new URL(url, window.location.origin);
    const pathname = parsedUrl.pathname;

    // Helper to return simulated fetch Response
    const jsonResponse = (data, status = 200) => {
        return new Response(JSON.stringify(data), {
            status,
            headers: { "Content-Type": "application/json" }
        });
    };

    // 1. GET /api/employees
    if (pathname === "/api/employees" && method === "GET") {
        const empTable = db.tables.EMPLOYEES;
        const customMetadata = empTable.columns.filter(c => c.custom);
        const customColumns = customMetadata.map(c => c.name);
        const customColumnTypes = Object.fromEntries(customMetadata.map(c => [c.name, c.type]));

        let employees = [...empTable.rows];
        if (userRole !== "admin" && userDepartment) {
            employees = employees.filter(e =>
                String(e.department || "").toUpperCase().trim() === userDepartment.toUpperCase().trim()
            );
        }
        employees.sort((a, b) => (Number(a.employee_id) || 0) - (Number(b.employee_id) || 0));

        return jsonResponse({
            employees,
            custom_columns: customColumns,
            custom_column_types: customColumnTypes
        });
    }

    // 2. POST /api/employees
    if (pathname === "/api/employees" && method === "POST") {
        if (userRole !== "admin" && userDepartment) {
            if ((body.department || "").toUpperCase().trim() !== userDepartment.toUpperCase().trim()) {
                return jsonResponse({ error: "You can only add employees to your department." }, 403);
            }
        }

        const empTable = db.tables.EMPLOYEES;
        const exists = empTable.rows.some(e => Number(e.employee_id) === Number(body.employee_id));
        if (exists) {
            return jsonResponse({ error: "Employee with this ID already exists." }, 409);
        }

        const newEmployee = {
            employee_id: Number(body.employee_id),
            first_name: body.first_name || "",
            last_name: body.last_name || "",
            email: body.email || "",
            phone: body.phone || "",
            department: body.department || "",
            job_title: body.job_title || "",
            salary: Number(body.salary) || 0,
            hire_date: normalizeDateOutput(body.hire_date),
            custom_fields: body.custom_fields || {}
        };

        empTable.rows.push(newEmployee);
        saveLocalDB(db);
        return jsonResponse({ message: "Employee added successfully" });
    }

    // 3. PUT /api/employees/:id
    const empPutMatch = pathname.match(/^\/api\/employees\/(\d+)$/);
    if (empPutMatch && method === "PUT") {
        const id = Number(empPutMatch[1]);
        const empTable = db.tables.EMPLOYEES;
        const empIndex = empTable.rows.findIndex(e => Number(e.employee_id) === id);
        if (empIndex === -1) {
            return jsonResponse({ error: "Employee not found." }, 404);
        }

        const current = empTable.rows[empIndex];
        if (userRole !== "admin" && userDepartment) {
            if ((body.department || "").toUpperCase().trim() !== userDepartment.toUpperCase().trim()) {
                return jsonResponse({ error: "You can only manage employees in your department." }, 403);
            }
        }

        empTable.rows[empIndex] = {
            ...current,
            first_name: body.first_name !== undefined ? body.first_name : current.first_name,
            last_name: body.last_name !== undefined ? body.last_name : current.last_name,
            email: body.email !== undefined ? body.email : current.email,
            phone: body.phone !== undefined ? body.phone : current.phone,
            department: userRole === "admin" ? (body.department || current.department) : current.department,
            job_title: body.job_title !== undefined ? body.job_title : current.job_title,
            salary: body.salary !== undefined ? Number(body.salary) : current.salary,
            hire_date: body.hire_date ? normalizeDateOutput(body.hire_date) : current.hire_date,
            custom_fields: { ...(current.custom_fields || {}), ...(body.custom_fields || {}) }
        };

        saveLocalDB(db);
        return jsonResponse({ message: "Employee updated successfully" });
    }

    // 4. DELETE /api/employees/:id
    const empDelMatch = pathname.match(/^\/api\/employees\/(\d+)$/);
    if (empDelMatch && method === "DELETE") {
        if (userRole !== "admin") {
            return jsonResponse({ error: "Only the administrator can delete employees." }, 403);
        }

        const id = Number(empDelMatch[1]);
        const empTable = db.tables.EMPLOYEES;
        const initialCount = empTable.rows.length;
        empTable.rows = empTable.rows.filter(e => Number(e.employee_id) !== id);

        if (empTable.rows.length === initialCount) {
            return jsonResponse({ error: "Employee not found." }, 404);
        }

        saveLocalDB(db);
        return jsonResponse({ message: "Employee deleted successfully" });
    }

    // 5. GET /api/departments
    if (pathname === "/api/departments" && method === "GET") {
        const deptTable = db.tables.DEPARTMENTS;
        const empTable = db.tables.EMPLOYEES;
        const customMetadata = deptTable.columns.filter(c => c.custom);
        const customColumns = customMetadata.map(c => c.name);
        const customColumnTypes = Object.fromEntries(customMetadata.map(c => [c.name, c.type]));

        const departmentList = deptTable.rows.map(d => {
            const count = empTable.rows.filter(e =>
                String(e.department || "").toUpperCase().trim() === String(d.name || "").toUpperCase().trim()
            ).length;

            let headName = "-";
            for (const emp of empTable.rows) {
                if (isHeadTitle(emp.job_title, d.name)) {
                    headName = `${emp.first_name || ""} ${emp.last_name || ""}`.trim() || "-";
                    if (String(emp.department || "").toUpperCase().trim() === String(d.name || "").toUpperCase().trim()) {
                        break;
                    }
                }
            }

            return {
                id: d.id,
                name: d.name,
                employee_count: count,
                head: headName,
                head_name: headName,
                custom_fields: d.custom_fields || {}
            };
        });

        departmentList.sort((a, b) => a.name.localeCompare(b.name));

        return jsonResponse({
            departments: departmentList,
            custom_columns: customColumns,
            custom_column_types: customColumnTypes
        });
    }

    // 6. POST /api/departments
    if (pathname === "/api/departments" && method === "POST") {
        if (userRole !== "admin") {
            return jsonResponse({ error: "Only the administrator can manage departments." }, 403);
        }

        const deptId = Number(body.id);
        const deptName = (body.name || "").trim();

        if (!deptId || deptId <= 0) {
            return jsonResponse({ error: "Enter a positive whole-number department ID." }, 400);
        }
        if (!deptName) {
            return jsonResponse({ error: "Department name is required." }, 400);
        }

        const deptTable = db.tables.DEPARTMENTS;
        if (deptTable.rows.some(d => d.id === deptId || d.name.toLowerCase() === deptName.toLowerCase())) {
            return jsonResponse({ error: "A department with this ID or name already exists." }, 400);
        }

        deptTable.rows.push({
            id: deptId,
            name: deptName,
            custom_fields: body.custom_fields || {}
        });

        saveLocalDB(db);
        return jsonResponse({ message: "Department added successfully." });
    }

    // 7. PUT /api/departments/:name
    const deptPutMatch = pathname.match(/^\/api\/departments\/(.+)$/);
    if (deptPutMatch && method === "PUT") {
        if (userRole !== "admin") {
            return jsonResponse({ error: "Only the administrator can manage departments." }, 403);
        }

        const targetDeptName = decodeURIComponent(deptPutMatch[1]).trim();
        const newDeptName = (body.name || "").trim();
        const deptTable = db.tables.DEPARTMENTS;
        const empTable = db.tables.EMPLOYEES;

        const deptIndex = deptTable.rows.findIndex(d => d.name.toLowerCase() === targetDeptName.toLowerCase());
        if (deptIndex === -1) {
            return jsonResponse({ error: "Department not found." }, 404);
        }

        const currentDept = deptTable.rows[deptIndex];
        currentDept.name = newDeptName || currentDept.name;
        if (body.custom_fields) {
            currentDept.custom_fields = { ...(currentDept.custom_fields || {}), ...body.custom_fields };
        }

        // Cascade department rename to employees
        if (newDeptName && newDeptName.toLowerCase() !== targetDeptName.toLowerCase()) {
            empTable.rows.forEach(e => {
                if (String(e.department || "").toLowerCase() === targetDeptName.toLowerCase()) {
                    e.department = newDeptName;
                }
            });
        }

        saveLocalDB(db);
        return jsonResponse({ message: "Department updated successfully." });
    }

    // 8. DELETE /api/departments/:name
    const deptDelMatch = pathname.match(/^\/api\/departments\/(.+)$/);
    if (deptDelMatch && method === "DELETE") {
        if (userRole !== "admin") {
            return jsonResponse({ error: "Only the administrator can manage departments." }, 403);
        }

        const deptName = decodeURIComponent(deptDelMatch[1]).trim();
        const deptTable = db.tables.DEPARTMENTS;
        const empTable = db.tables.EMPLOYEES;

        // Check if employees are assigned to this department
        const assignedCount = empTable.rows.filter(e =>
            String(e.department || "").toLowerCase() === deptName.toLowerCase()
        ).length;

        if (assignedCount > 0) {
            return jsonResponse({ error: "Cannot delete department with assigned employees." }, 400);
        }

        deptTable.rows = deptTable.rows.filter(d => d.name.toLowerCase() !== deptName.toLowerCase());
        saveLocalDB(db);
        return jsonResponse({ message: "Department deleted successfully." });
    }

    // 9. GET /api/db/schema
    if (pathname === "/api/db/schema" && method === "GET") {
        if (userRole !== "admin") {
            return jsonResponse({ error: "Only administrator allowed" }, 403);
        }

        const empTable = db.tables.EMPLOYEES;
        const deptTable = db.tables.DEPARTMENTS;

        const employeesSchema = {
            columns: empTable.columns.map(c => ({
                ...c,
                custom: Boolean(c.custom)
            })),
            constraints: empTable.constraints || []
        };

        const departmentsSchema = {
            columns: deptTable.columns.map(c => ({
                ...c,
                custom: Boolean(c.custom)
            })),
            constraints: deptTable.constraints || []
        };

        return jsonResponse({
            schema: "SYSTEM",
            table: "EMPLOYEES",
            columns: employeesSchema.columns,
            constraints: employeesSchema.constraints,
            tables: {
                EMPLOYEES: employeesSchema,
                DEPARTMENTS: departmentsSchema
            }
        });
    }

    // 10. POST /api/db/execute
    if (pathname === "/api/db/execute" && method === "POST") {
        if (userRole !== "admin") {
            return jsonResponse({ error: "Only administrator allowed" }, 403);
        }

        const result = executeLocalSQL(body.sql || "");
        if (result.error) {
            return jsonResponse({ error: result.error }, 400);
        }
        return jsonResponse(result);
    }

    return jsonResponse({ error: "Not found" }, 404);
}

// ==========================================================================
// TRANSPARENT FETCH INTERCEPTOR (SEAMLESS FLASK / LOCAL DB FALLBACK)
// ==========================================================================

const originalFetch = window.fetch.bind(window);

window.fetch = async function (resource, options = {}) {
    const url = typeof resource === "string" ? resource : (resource.url || "");

    // Only intercept application API calls
    if (url.startsWith("/api/")) {
        if (serverAvailable === false) {
            return localApiHandler(url, options);
        }

        try {
            // Attempt network fetch with 1.2s timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 1200);
            const reqOptions = { ...options, signal: options.signal || controller.signal };

            const response = await originalFetch(resource, reqOptions);
            clearTimeout(timeoutId);

            // If 404/405 (e.g. Vercel static without Flask backend)
            if (response.status === 404 || response.status === 405 || response.status === 502) {
                serverAvailable = false;
                sessionStorage.setItem("server_status", "offline");
                return localApiHandler(url, options);
            }

            serverAvailable = true;
            sessionStorage.setItem("server_status", "online");
            return response;
        } catch (err) {
            // Network failure or timeout -> silently switch to local browser DB
            serverAvailable = false;
            sessionStorage.setItem("server_status", "offline");
            return localApiHandler(url, options);
        }
    }

    return originalFetch(resource, options);
};

// ==========================================================================
// TOAST NOTIFICATIONS
// ==========================================================================

function showToast(message, type = "success") {
    const container = document.getElementById("toastContainer");
    if (!container) return;

    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;

    let iconSvg = "";
    if (type === "success") {
        iconSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
    } else if (type === "error") {
        iconSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f43f5e" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`;
    } else {
        iconSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6366f1" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`;
    }

    toast.innerHTML = `
        ${iconSvg}
        <span>${escapeHtml(message)}</span>
    `;

    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = "0";
        toast.style.transform = "translateX(20px)";
        setTimeout(() => toast.remove(), 300);
    }, 3800);
}

function escapeHtml(string) {
    if (string === null || string === undefined) return "";
    return String(string)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function formatCurrency(amount) {
    if (amount === null || amount === undefined || isNaN(amount)) return "-";
    return "₹" + Number(amount).toLocaleString("en-IN");
}

function formatTenure(hireDate) {
    const match = String(hireDate || "").match(/^(\d{2})-(\d{2})-(\d{4})$/);
    if (!match) return "-";

    const day = Number(match[1]);
    const month = Number(match[2]);
    const year = Number(match[3]);
    const startDate = new Date(year, month - 1, day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (
        startDate.getFullYear() !== year ||
        startDate.getMonth() !== month - 1 ||
        startDate.getDate() !== day ||
        startDate > today
    ) return "-";

    let totalMonths = (today.getFullYear() - year) * 12 + today.getMonth() - (month - 1);
    if (today.getDate() < day) totalMonths -= 1;

    if (totalMonths >= 12) {
        const years = Math.floor(totalMonths / 12);
        return `${years} year${years === 1 ? "" : "s"}`;
    }
    if (totalMonths <= 0) return "Less than 1 month";
    return `${totalMonths} month${totalMonths === 1 ? "" : "s"}`;
}

function getInitials(firstName, lastName) {
    const f = (firstName || "").trim().charAt(0).toUpperCase();
    const l = (lastName || "").trim().charAt(0).toUpperCase();
    return (f + l) || "E";
}

function isHeadTitle(title, dept) {
    if (!title) return false;
    const cleanTitle = title.trim().toLowerCase();
    const cleanDept = (dept || "").trim().toLowerCase();
    if (cleanTitle === `${cleanDept} head` || cleanTitle === `${cleanDept}head`) return true;
    const alphaTitle = title.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
    const alphaDept = (dept || "").replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
    return alphaTitle === (alphaDept + "head");
}

// ==========================================================================
// EMPLOYEES: LOAD & RENDER
// ==========================================================================

async function loadEmployees() {
    try {
        const response = await fetch("/api/employees");
        const data = await response.json();

        if (data.error) {
            showToast(data.error, "error");
            return;
        }

        allEmployees = Array.isArray(data.employees) ? data.employees : [];
        customEmployeeColumns = Array.isArray(data.custom_columns) ? data.custom_columns : [];
        customEmployeeColumnTypes = data.custom_column_types || {};
        syncCustomColumnHeaders("employeeTableHeaders", customEmployeeColumns);

        updateEmployeeStats();
        renderEmployeeTable(allEmployees);
    } catch (err) {
        console.error("Failed to load employees:", err);
    }
}

function syncCustomColumnHeaders(headerRowId, columnNames) {
    const headerRow = document.getElementById(headerRowId);
    if (!headerRow) return;

    headerRow.querySelectorAll("th[data-custom-column]").forEach(header => header.remove());
    const actionHeader = headerRow.querySelector("th.text-right");
    columnNames.forEach(columnName => {
        const header = document.createElement("th");
        header.dataset.customColumn = columnName;
        header.textContent = columnName;
        if (actionHeader) {
            headerRow.insertBefore(header, actionHeader);
        } else {
            headerRow.appendChild(header);
        }
    });
}

function renderCustomFields(containerId, columnNames, columnTypes, values = {}) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.replaceChildren();
    columnNames.forEach((columnName, index) => {
        const field = document.createElement("div");
        field.className = "form-field";

        const inputId = `${containerId}-${index}`;
        const label = document.createElement("label");
        label.htmlFor = inputId;
        label.textContent = columnName;

        const input = document.createElement("input");
        const columnType = String(columnTypes[columnName] || "").toUpperCase();
        if (columnType === "DATE") {
            input.type = "date";
        } else if (["NUMBER", "FLOAT", "BINARY_FLOAT", "BINARY_DOUBLE"].includes(columnType)) {
            input.type = "number";
            input.step = "any";
        } else if (columnType.startsWith("TIMESTAMP")) {
            input.type = "datetime-local";
            input.step = "1";
        } else {
            input.type = "text";
        }
        input.id = inputId;
        input.dataset.customColumnInput = columnName;
        const value = values[columnName];
        if (value !== null && value !== undefined) {
            const inputValue = String(value);
            if (input.type === "date") {
                input.value = inputValue.slice(0, 10);
            } else if (input.type === "datetime-local") {
                input.value = inputValue.replace(" ", "T").slice(0, 19);
            } else {
                input.value = inputValue;
            }
        }

        field.append(label, input);
        container.appendChild(field);
    });
}

function collectCustomFields(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return {};

    return Object.fromEntries(
        Array.from(container.querySelectorAll("[data-custom-column-input]"), input => [
            input.dataset.customColumnInput,
            input.value
        ])
    );
}

function updateEmployeeStats() {
    const statEmp = document.getElementById("statTotalEmployees");
    const badgeEmp = document.getElementById("employeeCountBadge");
    if (statEmp) statEmp.textContent = allEmployees.length;
    if (badgeEmp) badgeEmp.textContent = allEmployees.length;

    const statAvg = document.getElementById("statAvgSalary");
    if (statAvg) {
        if (allEmployees.length === 0) {
            statAvg.textContent = "₹0";
        } else {
            const validSalaries = allEmployees.filter(e => e.salary && !isNaN(e.salary));
            if (validSalaries.length === 0) {
                statAvg.textContent = "₹0";
            } else {
                const total = validSalaries.reduce((sum, e) => sum + Number(e.salary), 0);
                const avg = Math.round(total / validSalaries.length);
                statAvg.textContent = formatCurrency(avg);
            }
        }
    }
}

function renderEmployeeTable(employees) {
    const table = document.getElementById("employeeTable");
    if (!table) return;

    table.innerHTML = "";

    if (employees.length === 0) {
        const emptyRow = document.createElement("tr");
        emptyRow.innerHTML = `
            <td colspan="${11 + customEmployeeColumns.length}" style="text-align: center; padding: 40px; color: var(--text-dim);">
                <div style="display: flex; flex-direction: column; align-items: center; gap: 8px;">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                    <span>No employee records match the filter criteria.</span>
                </div>
            </td>
        `;
        table.appendChild(emptyRow);
        return;
    }

    employees.forEach(employee => {
        const row = document.createElement("tr");

        let actions = `
            <button
                class="edit"
                onclick='editEmployee(${JSON.stringify(employee)})'
                title="Edit Employee"
            >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                <span>Edit</span>
            </button>
        `;

        if (userRole === "admin") {
            actions += `
                <button
                    class="delete"
                    onclick="deleteEmployee(${employee.employee_id})"
                    title="Delete Employee"
                >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                    <span>Delete</span>
                </button>
            `;
        }

        const deptLower = (employee.department || "").toLowerCase();
        let deptClass = "dept-pill";
        if (deptLower === "hr" || deptLower === "human resources") deptClass += " dept-hr";
        else if (deptLower === "it" || deptLower === "engineering") deptClass += " dept-it";
        else if (deptLower === "finance") deptClass += " dept-finance";
        else if (deptLower === "marketing") deptClass += " dept-marketing";
        else if (deptLower === "sales") deptClass += " dept-sales";
        else if (deptLower === "operations") deptClass += " dept-operations";

        const isHead = isHeadTitle(employee.job_title, employee.department);
        const headBadge = isHead ? `<span class="head-tag">Head</span>` : ``;

        const initials = getInitials(employee.first_name, employee.last_name);
        const fullName = `${escapeHtml(employee.first_name || "")} ${escapeHtml(employee.last_name || "")}`.trim();
        const annualSalary = employee.salary === null || employee.salary === undefined
            ? employee.salary
            : Number(employee.salary) * 12;

        row.innerHTML = `
            <td class="id-cell">#${String(employee.employee_id).padStart(3, "0")}</td>
            <td>
                <div class="employee-cell">
                    <div class="avatar-circle">${initials}</div>
                    <span class="employee-name">${fullName}</span>
                </div>
            </td>
            <td>${escapeHtml(employee.email || "-")}</td>
            <td>${escapeHtml(employee.phone || "-")}</td>
            <td><span class="${deptClass}">${escapeHtml(employee.department || "-")}</span></td>
            <td>
                <div class="job-title-wrapper">
                    <span>${escapeHtml(employee.job_title || "-")}</span>
                    ${headBadge}
                </div>
            </td>
            <td class="salary-cell">${formatCurrency(employee.salary)}</td>
            <td class="salary-cell">${formatCurrency(annualSalary)}</td>
            <td>${escapeHtml(employee.hire_date || "-")}</td>
            <td>${formatTenure(employee.hire_date)}</td>
            <td class="text-right">
                <div class="action-group">
                    ${actions}
                </div>
            </td>
        `;

        const actionCell = row.querySelector("td.text-right");
        customEmployeeColumns.forEach(columnName => {
            const cell = document.createElement("td");
            const value = employee.custom_fields ? employee.custom_fields[columnName] : null;
            cell.textContent = value === null || value === undefined ? "-" : String(value);
            row.insertBefore(cell, actionCell);
        });

        table.appendChild(row);
    });
}

// ==========================================================================
// SEARCH & FILTER
// ==========================================================================

function filterEmployeeTable() {
    const searchInput = document.getElementById("employeeSearch");
    const deptSelect = document.getElementById("departmentFilter");

    const query = (searchInput ? searchInput.value : "").toLowerCase().trim();
    const deptFilter = deptSelect ? deptSelect.value.toLowerCase().trim() : "";

    const filtered = allEmployees.filter(emp => {
        const fullName = `${emp.first_name || ""} ${emp.last_name || ""}`.toLowerCase();
        const email = (emp.email || "").toLowerCase();
        const phone = (emp.phone || "").toLowerCase();
        const dept = (emp.department || "").toLowerCase();
        const title = (emp.job_title || "").toLowerCase();
        const id = String(emp.employee_id || "");

        const matchesQuery = !query ||
            fullName.includes(query) ||
            email.includes(query) ||
            phone.includes(query) ||
            dept.includes(query) ||
            title.includes(query) ||
            id.includes(query);

        const matchesDept = !deptFilter || dept === deptFilter;
        return matchesQuery && matchesDept;
    });

    renderEmployeeTable(filtered);
}

// ==========================================================================
// EMPLOYEE FORM & MODAL
// ==========================================================================

function openAddForm() {
    if (userRole !== "admin") {
        showToast("Only the administrator can add employees.", "error");
        return;
    }

    editingEmployee = false;
    editingId = null;

    const title = document.getElementById("formTitle");
    if (title) title.innerText = "Add Employee";

    const modal = document.getElementById("employeeFormModal");
    if (modal) modal.classList.add("active");

    const form = document.getElementById("employeeForm");
    if (form) form.style.display = "block";

    const idInput = document.getElementById("employee_id");
    if (idInput) idInput.disabled = false;

    const deptInput = document.getElementById("department");
    if (deptInput) deptInput.disabled = false;

    clearForm();
}

function closeForm() {
    const modal = document.getElementById("employeeFormModal");
    if (modal) modal.classList.remove("active");

    const form = document.getElementById("employeeForm");
    if (form) form.style.display = "none";

    const idInput = document.getElementById("employee_id");
    if (idInput) idInput.disabled = false;

    clearForm();
}

function handleModalBackdropClick(event) {
    if (event.target.id === "employeeFormModal") {
        closeForm();
    }
}

function clearForm() {
    const fields = ["employee_id", "first_name", "last_name", "email", "phone", "department", "job_title", "salary", "hire_date"];
    fields.forEach(f => {
        const elem = document.getElementById(f);
        if (elem) elem.value = "";
    });
    renderCustomFields("employeeCustomFields", customEmployeeColumns, customEmployeeColumnTypes);
}

function editEmployee(employee) {
    editingEmployee = true;
    editingId = employee.employee_id;

    const title = document.getElementById("formTitle");
    if (title) title.innerText = "Edit Employee";

    const modal = document.getElementById("employeeFormModal");
    if (modal) modal.classList.add("active");

    const form = document.getElementById("employeeForm");
    if (form) form.style.display = "block";

    const idInput = document.getElementById("employee_id");
    if (idInput) {
        idInput.value = employee.employee_id;
        idInput.disabled = true;
    }

    document.getElementById("first_name").value = employee.first_name || "";
    document.getElementById("last_name").value = employee.last_name || "";
    document.getElementById("email").value = employee.email || "";
    document.getElementById("phone").value = employee.phone || "";

    const departmentSelect = document.getElementById("department");
    if (departmentSelect) {
        const hasDepartment = Array.from(departmentSelect.options).some(
            option => option.value.toLowerCase() === (employee.department || "").toLowerCase()
        );

        if (employee.department && !hasDepartment) {
            const option = document.createElement("option");
            option.value = employee.department;
            option.textContent = employee.department;
            departmentSelect.appendChild(option);
        }
        departmentSelect.value = employee.department || "";
        departmentSelect.disabled = userRole !== "admin";
    }

    document.getElementById("job_title").value = employee.job_title || "";
    document.getElementById("salary").value = employee.salary || "";
    document.getElementById("hire_date").value = normalizeDateInput(employee.hire_date || "");

    renderCustomFields(
        "employeeCustomFields",
        customEmployeeColumns,
        customEmployeeColumnTypes,
        employee.custom_fields || {}
    );
}

async function saveEmployee() {
    const idVal = document.getElementById("employee_id").value;
    const firstNameVal = document.getElementById("first_name").value.trim();

    if (!idVal || !firstNameVal) {
        showToast("Employee ID and First Name are required.", "error");
        return;
    }

    const employee = {
        employee_id: Number(idVal),
        first_name: firstNameVal,
        last_name: document.getElementById("last_name").value.trim(),
        email: document.getElementById("email").value.trim(),
        phone: document.getElementById("phone").value.trim(),
        department: document.getElementById("department").value,
        job_title: document.getElementById("job_title").value.trim(),
        salary: Number(document.getElementById("salary").value) || 0,
        hire_date: normalizeDateOutput(document.getElementById("hire_date").value),
        custom_fields: collectCustomFields("employeeCustomFields")
    };

    const url = editingEmployee ? `/api/employees/${editingId}` : "/api/employees";
    const method = editingEmployee ? "PUT" : "POST";

    try {
        const response = await fetch(url, {
            method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(employee)
        });

        const result = await response.json();

        if (!response.ok) {
            showToast(result.error || "Operation failed.", "error");
            return;
        }

        showToast(result.message || "Saved successfully!", "success");
        closeForm();
        await loadEmployees();

        if (userRole === "admin") {
            await loadDepartments();
        }
    } catch (err) {
        console.error("Save employee error:", err);
        showToast("Operation failed.", "error");
    }
}

async function deleteEmployee(id) {
    if (userRole !== "admin") {
        showToast("Only the administrator can delete employees.", "error");
        return;
    }

    if (!confirm("Are you sure you want to delete this employee?")) {
        return;
    }

    try {
        const response = await fetch(`/api/employees/${id}`, {
            method: "DELETE"
        });

        const result = await response.json();

        if (!response.ok) {
            showToast(result.error || "Delete failed.", "error");
            return;
        }

        showToast(result.message || "Employee deleted successfully.", "success");
        await loadEmployees();

        if (userRole === "admin") {
            await loadDepartments();
        }
    } catch (err) {
        console.error("Delete employee error:", err);
        showToast("Delete failed.", "error");
    }
}

// ==========================================================================
// DEPARTMENTS: LOAD & RENDER
// ==========================================================================

async function loadDepartments() {
    const departmentSelect = document.getElementById("department");
    const deptFilterSelect = document.getElementById("departmentFilter");

    try {
        const response = await fetch("/api/departments");
        const data = await response.json();

        if (data.error) {
            showToast(data.error, "error");
            return;
        }

        allDepartments = Array.isArray(data.departments) ? data.departments : [];
        customDepartmentColumns = Array.isArray(data.custom_columns) ? data.custom_columns : [];
        customDepartmentColumnTypes = data.custom_column_types || {};
        syncCustomColumnHeaders("departmentTableHeaders", customDepartmentColumns);

        const statDepts = document.getElementById("statTotalDepartments");
        const deptBadge = document.getElementById("deptCountBadge");
        if (statDepts) statDepts.textContent = allDepartments.length;
        if (deptBadge) deptBadge.textContent = allDepartments.length;

        if (departmentSelect) {
            departmentSelect.innerHTML = "<option value=''>Select Department</option>";
            allDepartments.forEach(dept => {
                const opt = document.createElement("option");
                opt.value = dept.name;
                opt.textContent = dept.name;
                departmentSelect.appendChild(opt);
            });
        }

        if (deptFilterSelect) {
            const currentFilter = deptFilterSelect.value;
            deptFilterSelect.innerHTML = "<option value=''>All Departments</option>";
            allDepartments.forEach(dept => {
                const opt = document.createElement("option");
                opt.value = dept.name;
                opt.textContent = dept.name;
                if (opt.value === currentFilter) opt.selected = true;
                deptFilterSelect.appendChild(opt);
            });
        }

        const table = document.getElementById("departmentTable");
        if (!table) return;

        table.innerHTML = "";

        if (allDepartments.length === 0) {
            const emptyRow = document.createElement("tr");
            emptyRow.innerHTML = `
                <td colspan="${5 + customDepartmentColumns.length}" style="text-align: center; padding: 30px; color: var(--text-dim);">
                    No departments created yet.
                </td>
            `;
            table.appendChild(emptyRow);
            return;
        }

        allDepartments.forEach(department => {
            const row = document.createElement("tr");

            const idCell = document.createElement("td");
            idCell.className = "id-cell";
            idCell.textContent = `#${String(department.id).padStart(3, "0")}`;

            const nameCell = document.createElement("td");
            nameCell.style.fontWeight = "600";
            nameCell.style.color = "var(--text-main)";
            nameCell.textContent = department.name;

            const headCell = document.createElement("td");
            headCell.className = "dept-head-cell";
            const currentHead = department.head || department.head_name || "-";
            if (!currentHead || currentHead === "-") {
                headCell.innerHTML = `<span class="hyphen-badge">-</span>`;
            } else {
                headCell.innerHTML = `
                    <span class="head-badge" title="Department Head">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                        <span>${escapeHtml(currentHead)}</span>
                    </span>
                `;
            }

            const employeeCountCell = document.createElement("td");
            employeeCountCell.innerHTML = `<span class="count-badge">${department.employee_count}</span>`;

            const actionsCell = document.createElement("td");
            actionsCell.className = "text-right";

            const actionGroup = document.createElement("div");
            actionGroup.className = "action-group";

            const editButton = document.createElement("button");
            editButton.className = "edit";
            editButton.innerHTML = `
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                <span>Edit</span>
            `;
            editButton.addEventListener("click", () =>
                openDepartmentForm(department.name, department.id, department.custom_fields)
            );

            const deleteButton = document.createElement("button");
            deleteButton.className = "delete";
            deleteButton.innerHTML = `
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                <span>Delete</span>
            `;
            deleteButton.addEventListener("click", () => deleteDepartment(department.name));

            actionGroup.append(editButton, deleteButton);
            actionsCell.appendChild(actionGroup);

            row.append(idCell, nameCell, headCell, employeeCountCell);
            customDepartmentColumns.forEach(columnName => {
                const customCell = document.createElement("td");
                const value = department.custom_fields ? department.custom_fields[columnName] : null;
                customCell.textContent = value === null || value === undefined ? "-" : String(value);
                row.appendChild(customCell);
            });
            row.appendChild(actionsCell);
            table.appendChild(row);
        });
    } catch (err) {
        console.error("Failed to load departments:", err);
    }
}

function openDepartmentForm(departmentName = null, departmentId = null, customFields = {}) {
    editingDepartmentName = departmentName;

    const idInput = document.getElementById("departmentId");
    if (idInput) {
        idInput.value = departmentId || "";
        idInput.disabled = departmentName !== null;
    }

    const nameInput = document.getElementById("departmentName");
    if (nameInput) nameInput.value = departmentName || "";

    renderCustomFields(
        "departmentCustomFields",
        customDepartmentColumns,
        customDepartmentColumnTypes,
        customFields || {}
    );

    const titleElem = document.getElementById("deptFormTitle");
    if (titleElem) {
        titleElem.textContent = departmentName ? "Edit Department" : "Add Department";
    }

    const modal = document.getElementById("deptFormModal");
    if (modal) modal.classList.add("active");

    const form = document.getElementById("departmentForm");
    if (form) form.style.display = "block";
}

function closeDepartmentForm() {
    editingDepartmentName = null;

    const idInput = document.getElementById("departmentId");
    if (idInput) {
        idInput.value = "";
        idInput.disabled = false;
    }

    const nameInput = document.getElementById("departmentName");
    if (nameInput) nameInput.value = "";

    renderCustomFields("departmentCustomFields", customDepartmentColumns, customDepartmentColumnTypes);

    const modal = document.getElementById("deptFormModal");
    if (modal) modal.classList.remove("active");

    const form = document.getElementById("departmentForm");
    if (form) form.style.display = "none";
}

function handleDeptModalBackdropClick(event) {
    if (event.target.id === "deptFormModal") {
        closeDepartmentForm();
    }
}

async function saveDepartment() {
    const name = document.getElementById("departmentName").value.trim();
    const id = Number(document.getElementById("departmentId").value);

    if (!name) {
        showToast("Enter a department name.", "error");
        return;
    }

    const isEditing = editingDepartmentName !== null;

    if (!isEditing && (!Number.isInteger(id) || id <= 0)) {
        showToast("Enter a positive whole-number department ID.", "error");
        return;
    }

    const url = isEditing
        ? `/api/departments/${encodeURIComponent(editingDepartmentName)}`
        : "/api/departments";

    try {
        const response = await fetch(url, {
            method: isEditing ? "PUT" : "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                id,
                name,
                custom_fields: collectCustomFields("departmentCustomFields")
            })
        });

        const result = await response.json();

        if (!response.ok) {
            showToast(result.error || "Could not save department.", "error");
            return;
        }

        closeDepartmentForm();
        await loadDepartments();
        showToast(result.message || "Department saved successfully.", "success");
    } catch (err) {
        console.error("Save department error:", err);
        showToast("Could not save department.", "error");
    }
}

async function deleteDepartment(departmentName) {
    if (!confirm(`Delete the ${departmentName} department?`)) {
        return;
    }

    try {
        const response = await fetch(
            `/api/departments/${encodeURIComponent(departmentName)}`,
            { method: "DELETE" }
        );

        const result = await response.json();

        if (!response.ok) {
            showToast(result.error || "Could not delete department.", "error");
            return;
        }

        await loadDepartments();
        showToast(result.message || "Department deleted successfully.", "success");
    } catch (err) {
        console.error("Delete department error:", err);
        showToast("Could not delete department.", "error");
    }
}

// ==========================================================================
// DATABASE CONSOLE & SCHEMA VIEWER
// ==========================================================================

function switchSchemaTable(tableName) {
    currentSchemaTable = tableName;
    document.querySelectorAll(".schema-tab").forEach(tab => {
        tab.classList.toggle("active", tab.dataset.table === tableName);
    });
    renderSchemaTable(tableName);
}

function renderSchemaTable(tableName) {
    const schemaViewer = document.getElementById("schemaViewer");
    if (!schemaViewer || !cachedSchemaData) return;

    const tables = cachedSchemaData.tables || {
        EMPLOYEES: { columns: cachedSchemaData.columns || [], constraints: cachedSchemaData.constraints || [] },
        DEPARTMENTS: { columns: [], constraints: [] }
    };

    const targetTable = tables[tableName] || tables.EMPLOYEES;
    const columns = targetTable.columns || [];

    let html = `
        <table class="modern-table schema-meta-table">
            <thead>
                <tr>
                    <th>Column</th>
                    <th>Data Type</th>
                    <th>Nullable</th>
                    <th>Kind</th>
                </tr>
            </thead>
            <tbody>
    `;

    if (columns.length === 0) {
        html += `<tr><td colspan="4" style="text-align:center; padding: 20px;">No metadata available</td></tr>`;
    } else {
        columns.forEach(col => {
            const kindBadge = col.custom
                ? `<span class="badge-count" style="font-size:10px; background: rgba(99, 102, 241, 0.15); color: var(--indigo-primary); border-color: rgba(99, 102, 241, 0.3);">User Added</span>`
                : `<span style="font-size:11px; color: var(--text-dim);">Built-in</span>`;
            html += `
                <tr>
                    <td><b>${escapeHtml(col.name)}</b></td>
                    <td><code>${escapeHtml(col.type)}</code></td>
                    <td>${escapeHtml(col.nullable)}</td>
                    <td>${kindBadge}</td>
                </tr>
            `;
        });
    }

    html += "</tbody></table>";
    schemaViewer.innerHTML = html;
}

async function loadSchema() {
    if (userRole !== "admin") return;

    try {
        const response = await fetch("/api/db/schema");
        const data = await response.json();
        cachedSchemaData = data;
        renderSchemaTable(currentSchemaTable);
    } catch (err) {
        console.error("Failed to load schema:", err);
    }
}

async function runSQL() {
    const sqlElem = document.getElementById("sqlCommand");
    const outputElem = document.getElementById("sqlOutput");
    if (!sqlElem || !outputElem) return;

    const sql = sqlElem.value.trim();
    if (!sql) {
        showToast("Please enter an SQL statement to run.", "error");
        return;
    }

    try {
        const response = await fetch("/api/db/execute", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sql })
        });

        const result = await response.json();

        if (result.error) {
            outputElem.innerHTML = `
                <div style="color: #ef4444; padding: 10px 14px; font-family: var(--font-mono); font-size: 12.5px; background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.25); border-radius: 8px; display: flex; align-items: flex-start; gap: 8px;">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2.5" style="flex-shrink: 0; margin-top: 1px;"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                    <span>${escapeHtml(result.error)}</span>
                </div>
            `;
            showToast(result.error, "error");
            return;
        }

        if (result.type === "dml") {
            const rowsText = result.rows > 0 ? `Rows affected: <b>${result.rows}</b>` : `Execution completed successfully.`;
            outputElem.innerHTML = `
                <div style="color: #10b981; padding: 10px 14px; font-family: var(--font-mono); font-size: 12.5px; background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.25); border-radius: 8px; display: flex; align-items: center; gap: 8px;">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    <span>Statement executed successfully. ${rowsText}</span>
                </div>
            `;
            showToast(result.rows > 0 ? `Statement executed: ${result.rows} rows affected` : "Statement executed successfully.", "success");
            await loadEmployees();
            if (userRole === "admin") {
                await loadDepartments();
                await loadSchema();
            }
            return;
        }

        // Render SELECT query results
        let html = "<table><thead><tr>";
        result.columns.forEach(c => {
            html += `<th>${escapeHtml(c)}</th>`;
        });
        html += "</tr></thead><tbody>";

        if (result.rows.length === 0) {
            html += `<tr><td colspan="${result.columns.length}" style="text-align: center; color: var(--text-dim); padding: 16px;">Query returned 0 rows</td></tr>`;
        } else {
            result.rows.forEach(r => {
                html += "<tr>";
                r.forEach(v => {
                    html += `<td>${v !== null && v !== undefined ? escapeHtml(v) : "<span style='color: var(--text-dim);'>NULL</span>"}</td>`;
                });
                html += "</tr>";
            });
        }

        html += "</tbody></table>";
        outputElem.innerHTML = html;
    } catch (err) {
        console.error("SQL execution error:", err);
        outputElem.innerHTML = `<div style="color: #ef4444; padding: 10px; border-radius: 6px;">Error executing SQL.</div>`;
    }
}

// Global Keyboard ESC listener
document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
        closeForm();
        closeDepartmentForm();
    }
});

// ==========================================================================
// AUTHENTICATION & LOGIN PAGE LOGIC
// ==========================================================================

function departmentAccountKey(department) {
    return (department || "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

function verifyLocalCredentials(username, password) {
    const cleanUser = username.trim().toLowerCase();
    const db = getLocalDB();

    // 1. Check users table in DB
    if (db.users && db.users[cleanUser]) {
        const u = db.users[cleanUser];
        if (u.password === password) {
            return {
                role: u.role || "admin",
                department: u.department || "",
                username: u.username || cleanUser
            };
        }
    }

    // Direct check for admin account
    if (cleanUser === "admin" && password === "admin123") {
        return {
            role: "admin",
            department: "",
            username: "admin"
        };
    }

    // 2. Department Head accounts dynamically checked against DEPARTMENTS in DB
    if (cleanUser.endsWith("head")) {
        const deptKey = cleanUser.slice(0, -4);
        if (deptKey) {
            for (const dept of db.tables.DEPARTMENTS.rows) {
                const accKey = departmentAccountKey(dept.name);
                const matches = (accKey === deptKey) || (deptKey === "hr" && accKey === "humanresources");
                if (matches && (password === `${deptKey}123` || password === `${accKey}123`)) {
                    return {
                        role: `${deptKey}head`,
                        department: dept.name,
                        username: cleanUser
                    };
                }
            }
        }
    }

    return null;
}

window.fillCredentials = function (username, password) {
    const userField = document.getElementById("username");
    const passField = document.getElementById("password");
    if (userField && passField) {
        userField.value = username;
        passField.value = password;
        userField.focus();
        showToast(`Auto-filled: ${username}`, "info");
    }
};

function renderCredentialsDropdown() {
    const container = document.getElementById("credentialsDropdownList");
    if (!container) return;

    const db = getLocalDB();
    const accounts = [];

    // 1. Admin account from DB users
    if (db.users) {
        Object.values(db.users).forEach(u => {
            accounts.push({
                role: u.role === "admin" ? "Administrator" : (u.role || "Administrator"),
                username: u.username,
                password: u.password
            });
        });
    } else {
        accounts.push({
            role: "Administrator",
            username: "admin",
            password: "admin123"
        });
    }

    // 2. Department Heads dynamically from DEPARTMENTS table in DB
    const depts = (db.tables && db.tables.DEPARTMENTS && db.tables.DEPARTMENTS.rows) || [];
    depts.forEach(dept => {
        const rawKey = departmentAccountKey(dept.name);
        const username = rawKey === "humanresources" ? "hrhead" : `${rawKey}head`;
        const password = rawKey === "humanresources" ? "hr123" : `${rawKey}123`;
        accounts.push({
            role: `${dept.name} Head`,
            username,
            password
        });
    });

    container.innerHTML = "";
    accounts.forEach(acc => {
        const item = document.createElement("div");
        item.className = "cred-item";
        item.onclick = () => fillCredentials(acc.username, acc.password);
        item.innerHTML = `
            <div class="cred-info">
                <span class="cred-role">${escapeHtml(acc.role)}</span>
                <span class="cred-detail"><code>${escapeHtml(acc.username)}</code> &bull; Password: <code>${escapeHtml(acc.password)}</code></span>
            </div>
            <button type="button" class="btn-cred-fill" title="Autofill this account">Use</button>
        `;
        const btn = item.querySelector(".btn-cred-fill");
        if (btn) {
            btn.onclick = (e) => {
                e.stopPropagation();
                fillCredentials(acc.username, acc.password);
            };
        }
        container.appendChild(item);
    });
}

function setupLoginForm() {
    const loginForm = document.getElementById("loginForm");
    if (!loginForm) return;

    // Render credentials dropdown dynamically from DB
    renderCredentialsDropdown();

    // If already logged in, redirect to dashboard
    if (sessionStorage.getItem("talentpulse_logged_in") === "true") {
        window.location.href = "dashboard.html";
        return;
    }

    loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const usernameInput = document.getElementById("username");
        const passwordInput = document.getElementById("password");
        const errorBanner = document.getElementById("errorBanner");
        const errorMessage = document.getElementById("errorMessage");

        const username = usernameInput ? usernameInput.value.trim() : "";
        const password = passwordInput ? passwordInput.value : "";

        const showError = (msg) => {
            if (errorBanner) {
                errorBanner.style.display = "flex";
                if (errorMessage) errorMessage.textContent = msg;
            } else {
                alert(msg);
            }
        };

        // Try server authentication first if server might be online
        if (serverAvailable !== false) {
            try {
                const formData = new URLSearchParams();
                formData.append("username", username);
                formData.append("password", password);

                const response = await originalFetch("/", {
                    method: "POST",
                    headers: { "Content-Type": "application/x-www-form-urlencoded" },
                    body: formData,
                    redirect: "follow",
                    signal: AbortSignal.timeout(1500)
                });

                if (response.ok && (response.url.includes("dashboard") || response.redirected)) {
                    sessionStorage.setItem("talentpulse_logged_in", "true");
                    window.location.href = "dashboard.html";
                    return;
                }
            } catch (err) {
                // Server unavailable -> fallback to local auth
                serverAvailable = false;
                sessionStorage.setItem("server_status", "offline");
            }
        }

        // Local Authentication Fallback
        const user = verifyLocalCredentials(username, password);
        if (user) {
            sessionStorage.setItem("talentpulse_logged_in", "true");
            sessionStorage.setItem("userRole", user.role);
            sessionStorage.setItem("currentUsername", user.username);
            sessionStorage.setItem("userDepartment", user.department);
            window.location.href = "dashboard.html";
        } else {
            showError("Invalid username or password");
        }
    });
}

function setupDashboardSession() {
    const isDashboard = document.querySelector(".dashboard-main");
    if (!isDashboard) return;

    // Check Flask template globals or sessionStorage
    const sRole = window.serverRole && !window.serverRole.startsWith("{{") ? window.serverRole : null;
    const sDept = window.serverDepartment && !window.serverDepartment.startsWith("{{") ? window.serverDepartment : null;
    const sUser = window.serverUsername && !window.serverUsername.startsWith("{{") ? window.serverUsername : null;

    if (sRole) {
        userRole = sRole;
        userDepartment = sDept || "";
        currentUsername = sUser || "admin";
        sessionStorage.setItem("talentpulse_logged_in", "true");
        sessionStorage.setItem("userRole", userRole);
        sessionStorage.setItem("currentUsername", currentUsername);
        sessionStorage.setItem("userDepartment", userDepartment);
    } else {
        const loggedIn = sessionStorage.getItem("talentpulse_logged_in");
        if (loggedIn !== "true") {
            // Not authenticated -> redirect to login
            window.location.href = "index.html";
            return;
        }
        userRole = sessionStorage.getItem("userRole") || "admin";
        currentUsername = sessionStorage.getItem("currentUsername") || "admin";
        userDepartment = sessionStorage.getItem("userDepartment") || "";
    }

    // Update User Profile Badge in Navigation
    const avatar = document.getElementById("userAvatar");
    const nameDisplay = document.getElementById("userNameDisplay");
    const roleBadge = document.getElementById("userRoleBadge");

    if (avatar) avatar.textContent = getInitials(currentUsername, "");
    if (nameDisplay) nameDisplay.textContent = currentUsername;

    if (roleBadge) {
        if (userRole === "admin") {
            roleBadge.className = "role-pill role-admin";
            roleBadge.innerHTML = `
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                </svg>
                <span>Administrator</span>
            `;
        } else {
            roleBadge.className = "role-pill role-head";
            roleBadge.innerHTML = `
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                </svg>
                <span>${escapeHtml(userDepartment)} Head</span>
            `;
        }
    }

    // Role-based view scoped styling & visibility
    if (userRole !== "admin") {
        const consoleSection = document.getElementById("adminConsoleSection");
        if (consoleSection) consoleSection.style.display = "none";

        const deptSection = document.getElementById("adminDepartmentSection");
        if (deptSection) deptSection.style.display = "none";

        const addEmpBtn = document.getElementById("addEmployeeBtn");
        if (addEmpBtn) addEmpBtn.style.display = "none";

        const dirHeading = document.getElementById("directoryHeading");
        const dirDesc = document.getElementById("directoryDesc");
        if (dirHeading) {
            dirHeading.innerHTML = `${escapeHtml(userDepartment)} Department Directory <span class="badge-count" id="employeeCountBadge">0</span>`;
        }
        if (dirDesc) {
            dirDesc.textContent = `Scoped management view for the ${userDepartment} department staff.`;
        }
    }

    // Logout button handler
    const logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", (e) => {
            e.preventDefault();
            sessionStorage.removeItem("talentpulse_logged_in");
            sessionStorage.removeItem("userRole");
            sessionStorage.removeItem("currentUsername");
            sessionStorage.removeItem("userDepartment");
            try { originalFetch("/logout"); } catch (err) {}
            window.location.href = "index.html";
        });
    }

    // Mount core dashboard data
    loadEmployees();
    loadDepartments();
    loadSchema();
}

// ==========================================================================
// INITIAL APPLICATION MOUNT
// ==========================================================================

document.addEventListener("DOMContentLoaded", () => {
    initTheme();
    setupLoginForm();
    setupDashboardSession();
});

// Also run immediately if DOM is already ready
if (document.readyState === "interactive" || document.readyState === "complete") {
    initTheme();
    setupLoginForm();
    setupDashboardSession();
}