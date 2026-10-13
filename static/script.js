// ==========================================================================
// TalentPulse Enterprise HR Management - Core Client Application
// ==========================================================================

let editingEmployee = false;
let editingId = null;
let editingDepartmentName = null;
let allEmployees = [];
let allDepartments = [];

// ==========================================================================
// TOAST NOTIFICATIONS
// ==========================================================================

function showToast(message, type = "success") {
    const container = document.getElementById("toastContainer");
    if (!container) {
        alert(message);
        return;
    }

    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;

    let iconSvg = '';
    if (type === "success") {
        iconSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
    } else if (type === "error") {
        iconSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f43f5e" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`;
    } else {
        iconSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6366f1" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`;
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

// ==========================================================================
// EMPLOYEES: LOAD & RENDER
// ==========================================================================

async function loadEmployees() {
    try {
        const response = await fetch("/api/employees");
        const employees = await response.json();

        if (employees.error) {
            showToast(employees.error, "error");
            return;
        }

        allEmployees = Array.isArray(employees) ? employees : [];

        updateEmployeeStats();
        renderEmployeeTable(allEmployees);
    } catch (err) {
        console.error("Failed to load employees:", err);
        showToast("Network error loading employees.", "error");
    }
}

function updateEmployeeStats() {
    // Total Employees Stat
    const statEmp = document.getElementById("statTotalEmployees");
    const badgeEmp = document.getElementById("employeeCountBadge");
    if (statEmp) statEmp.textContent = allEmployees.length;
    if (badgeEmp) badgeEmp.textContent = allEmployees.length;

    // Average Salary Stat
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

function isHeadTitle(title, dept) {
    if (!title) return false;
    const cleanTitle = title.trim().toLowerCase();
    const cleanDept = (dept || "").trim().toLowerCase();
    if (cleanTitle === `${cleanDept} head` || cleanTitle === `${cleanDept}head`) return true;
    const alphaTitle = title.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    const alphaDept = (dept || "").replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    return alphaTitle === (alphaDept + 'head');
}

function renderEmployeeTable(employees) {
    const table = document.getElementById("employeeTable");
    if (!table) return;

    table.innerHTML = "";

    if (employees.length === 0) {
        const emptyRow = document.createElement("tr");
        emptyRow.innerHTML = `
            <td colspan="11" style="text-align: center; padding: 40px; color: var(--text-dim);">
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
        if (deptLower === "hr") deptClass += " dept-hr";
        else if (deptLower === "it") deptClass += " dept-it";
        else if (deptLower === "finance") deptClass += " dept-finance";

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
// EMPLOYEE MODAL / FORM
// ==========================================================================

function openAddForm() {
    if (userRole !== "admin") {
        showToast("Only the administrator can add employees.", "error");
        return;
    }

    editingEmployee = false;
    editingId = null;

    document.getElementById("formTitle").innerText = "Add Employee";

    const modal = document.getElementById("employeeFormModal");
    if (modal) modal.classList.add("active");

    const form = document.getElementById("employeeForm");
    if (form) form.style.display = "block";

    document.getElementById("employee_id").disabled = false;
    document.getElementById("department").disabled = false;

    clearForm();
}

function closeForm() {
    const modal = document.getElementById("employeeFormModal");
    if (modal) modal.classList.remove("active");

    const form = document.getElementById("employeeForm");
    if (form) form.style.display = "none";

    document.getElementById("employee_id").disabled = false;
    document.getElementById("department").disabled = false;

    clearForm();
}

function handleModalBackdropClick(event) {
    if (event.target.id === "employeeFormModal") {
        closeForm();
    }
}

function clearForm() {
    document.getElementById("employee_id").value = "";
    document.getElementById("first_name").value = "";
    document.getElementById("last_name").value = "";
    document.getElementById("email").value = "";
    document.getElementById("phone").value = "";
    document.getElementById("department").value = "";
    document.getElementById("job_title").value = "";
    document.getElementById("salary").value = "";
    document.getElementById("hire_date").value = "";
}

function editEmployee(employee) {
    editingEmployee = true;
    editingId = employee.employee_id;

    document.getElementById("formTitle").innerText = "Edit Employee";

    const modal = document.getElementById("employeeFormModal");
    if (modal) modal.classList.add("active");

    const form = document.getElementById("employeeForm");
    if (form) form.style.display = "block";

    const idInput = document.getElementById("employee_id");
    idInput.value = employee.employee_id;
    idInput.disabled = true;

    document.getElementById("first_name").value = employee.first_name || "";
    document.getElementById("last_name").value = employee.last_name || "";
    document.getElementById("email").value = employee.email || "";
    document.getElementById("phone").value = employee.phone || "";

    const departmentSelect = document.getElementById("department");
    const hasDepartment = Array.from(departmentSelect.options).some(
        option => option.value === (employee.department || "")
    );

    if (employee.department && !hasDepartment) {
        const option = document.createElement("option");
        option.value = employee.department;
        option.textContent = employee.department;
        departmentSelect.appendChild(option);
    }

    departmentSelect.value = employee.department || "";

    document.getElementById("job_title").value = employee.job_title || "";
    document.getElementById("salary").value = employee.salary || "";
    document.getElementById("hire_date").value = employee.hire_date || "";

    if (userRole !== "admin") {
        document.getElementById("department").disabled = true;
    }
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
        hire_date: document.getElementById("hire_date").value
    };

    let response;
    try {
        if (editingEmployee) {
            response = await fetch(`/api/employees/${editingId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(employee)
            });
        } else {
            response = await fetch("/api/employees", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(employee)
            });
        }

        const result = await response.json();

        if (!response.ok) {
            showToast(result.error || "Operation failed.", "error");
            return;
        }

        showToast(result.message || "Saved successfully!", "success");

        closeForm();
        await loadEmployees();

        // Refresh departments if admin so department head is immediately updated!
        if (userRole === "admin") {
            await loadDepartments();
        }
    } catch (err) {
        console.error("Save employee error:", err);
        showToast("Network error while saving employee.", "error");
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
        showToast("Network error while deleting employee.", "error");
    }
}

// ==========================================================================
// DEPARTMENTS: LOAD & RENDER (WITH HEAD OF DEPARTMENT)
// ==========================================================================

async function loadDepartments() {
    const departmentSelect = document.getElementById("department");
    const deptFilterSelect = document.getElementById("departmentFilter");

    if (userRole !== "admin") {
        if (departmentSelect) {
            const option = document.createElement("option");
            option.value = userDepartment;
            option.textContent = userDepartment;
            departmentSelect.appendChild(option);
        }
        return;
    }

    try {
        const response = await fetch("/api/departments");
        const departments = await response.json();

        if (!response.ok) {
            showToast(departments.error || "Could not load departments.", "error");
            return;
        }

        allDepartments = Array.isArray(departments) ? departments : [];

        // Update Stats
        const statDepts = document.getElementById("statTotalDepartments");
        const deptBadge = document.getElementById("deptCountBadge");
        if (statDepts) statDepts.textContent = allDepartments.length;
        if (deptBadge) deptBadge.textContent = allDepartments.length;


        // Populate selects
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

        // Render departments table
        const table = document.getElementById("departmentTable");
        if (!table) return;

        table.innerHTML = "";

        if (allDepartments.length === 0) {
            const emptyRow = document.createElement("tr");
            emptyRow.innerHTML = `
                <td colspan="5" style="text-align: center; padding: 30px; color: var(--text-dim);">
                    No departments created yet.
                </td>
            `;
            table.appendChild(emptyRow);
            return;
        }

        allDepartments.forEach(department => {
            const row = document.createElement("tr");

            // 1. Department ID
            const idCell = document.createElement("td");
            idCell.className = "id-cell";
            idCell.textContent = `#${String(department.id).padStart(3, "0")}`;

            // 2. Department Name
            const nameCell = document.createElement("td");
            nameCell.style.fontWeight = "600";
            nameCell.style.color = "var(--text-main)";
            nameCell.textContent = department.name;

            // 3. Current Head of Department
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

            // 4. Total Employees
            const employeeCountCell = document.createElement("td");
            employeeCountCell.innerHTML = `<span class="count-badge">${department.employee_count}</span>`;

            // 5. Actions
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
                openDepartmentForm(department.name, department.id)
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

            row.append(idCell, nameCell, headCell, employeeCountCell, actionsCell);
            table.appendChild(row);
        });
    } catch (err) {
        console.error("Failed to load departments:", err);
        showToast("Network error loading departments.", "error");
    }
}

function openDepartmentForm(departmentName = null, departmentId = null) {
    editingDepartmentName = departmentName;

    const idInput = document.getElementById("departmentId");
    idInput.value = departmentId || "";
    idInput.disabled = departmentName !== null;

    document.getElementById("departmentName").value = departmentName || "";

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
    idInput.value = "";
    idInput.disabled = false;

    document.getElementById("departmentName").value = "";

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
            body: JSON.stringify({ id, name })
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
        showToast("Network error while saving department.", "error");
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
        showToast("Network error while deleting department.", "error");
    }
}

// ==========================================================================
// DATABASE CONSOLE & SQL EXECUTION
// ==========================================================================

let cachedSchemaData = null;
let currentSchemaTable = "EMPLOYEES";

function switchSchemaTable(tableName) {
    currentSchemaTable = tableName;
    document.querySelectorAll(".schema-tab").forEach(tab => {
        tab.classList.toggle("active", tab.dataset.table === tableName);
    });
    const heading = document.getElementById("schemaHeading");
    if (heading) heading.textContent = `${tableName} Schema Metadata`;
    renderSchemaTable(tableName);
}

function renderSchemaTable(tableName) {
    const schemaViewer = document.getElementById("schemaViewer");
    if (!schemaViewer || !cachedSchemaData) return;

    let tableData = null;
    if (cachedSchemaData.tables && cachedSchemaData.tables[tableName]) {
        tableData = cachedSchemaData.tables[tableName];
    } else if (tableName === "EMPLOYEES") {
        tableData = cachedSchemaData;
    }

    if (!tableData || !tableData.columns) {
        schemaViewer.innerHTML = `<div style="padding: 20px; color: var(--text-dim); text-align: center;">No schema data found for ${escapeHtml(tableName)}.</div>`;
        return;
    }

    const constraintsByColumn = {};
    (tableData.constraints || []).forEach(constraint => {
        if (constraint.type === "CHECK" &&
            /\bIS\s+NOT\s+NULL\b/i.test(constraint.condition || "")) {
            return;
        }

        let label = constraint.type;
        if (constraint.type === "CHECK" && constraint.condition) {
            const condition = constraint.condition
                .replace(/\s*(>=|<=|<>|!=|=|>|<)\s*/g, " $1 ")
                .trim();
            label += ` (${condition})`;
        }

        constraintsByColumn[constraint.column] ??= [];
        constraintsByColumn[constraint.column].push(label);
    });

    let html = `
    <table class="schema-metadata-table">
        <thead>
            <tr>
                <th>Column</th>
                <th>Data Type</th>
                <th>Nullable</th>
                <th>Default</th>
                <th>Constraint</th>
            </tr>
        </thead>
        <tbody>
    `;

    tableData.columns.forEach(col => {
        const constraints = constraintsByColumn[col.name] || [];
        let constraintHtml = "-";
        if (constraints.length > 0) {
            constraintHtml = constraints.map(c => {
                let badgeClass = "badge-chk";
                if (c.startsWith("PRIMARY KEY")) badgeClass = "badge-pk";
                else if (c.startsWith("UNIQUE")) badgeClass = "badge-uq";
                else if (c.startsWith("FOREIGN KEY")) badgeClass = "badge-fk";
                return `<span class="schema-constraint-badge ${badgeClass}">${escapeHtml(c)}</span>`;
            }).join(" ");
        }

        const nullableBadge = col.nullable === "N"
            ? `<span class="badge-not-null">NO</span>`
            : `<span class="badge-nullable">YES</span>`;

        html += `
        <tr>
            <td class="schema-col-name">${escapeHtml(col.name)}</td>
            <td class="schema-col-type">${escapeHtml(col.type)}</td>
            <td class="schema-col-null">${nullableBadge}</td>
            <td class="schema-col-default">${escapeHtml(col.default || "-")}</td>
            <td class="schema-col-constraint">${constraintHtml}</td>
        </tr>
        `;
    });

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
                <div style="color: #b91c1c; padding: 10px 14px; font-family: var(--font-mono); font-size: 12.5px; background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; display: flex; align-items: flex-start; gap: 8px;">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#dc2626" stroke-width="2.5" style="flex-shrink: 0; margin-top: 1px;"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                    <span>${escapeHtml(result.error)}</span>
                </div>
            `;
            showToast(result.error, "error");
            return;
        }

        if (result.type === "dml") {
            const rowsText = result.rows > 0 ? `Rows affected: <b>${result.rows}</b>` : `Execution completed successfully.`;
            outputElem.innerHTML = `
                <div style="color: #047857; padding: 10px 14px; font-family: var(--font-mono); font-size: 12.5px; background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 8px; display: flex; align-items: center; gap: 8px;">
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
        outputElem.innerHTML = `<div style="color: #b91c1c; padding: 10px; background: #fef2f2; border: 1px solid #fecaca; border-radius: 6px;">Network error executing SQL.</div>`;
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
// INITIAL APPLICATION MOUNT
// ==========================================================================

loadEmployees();
loadDepartments();
loadSchema();