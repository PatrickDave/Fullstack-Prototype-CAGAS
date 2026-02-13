// ============ Phase 2: Client-Side Routing ============
let currentUser = null;

const ROUTES = {
  "/": "home-page",
  "/register": "register-page",
  "/verify-email": "verify-email-page",
  "/login": "login-page",
  "/profile": "profile-page",
  "/requests": "requests-page",
  "/accounts": "accounts-page",
  "/departments": "departments-page",
  "/employees": "employees-page",
};

const PROTECTED_ROUTES = ["/profile", "/requests"];
const ADMIN_ROUTES = ["/accounts", "/departments", "/employees"];

function navigateTo(hash) {
  window.location.hash = hash || "#/";
}

function handleRouting() {
  const hash = (window.location.hash || "#/").slice(1).split("?")[0];
  const pageId = ROUTES[hash] || "home-page";
  const page = document.getElementById(pageId);

  // Hide all pages
  document.querySelectorAll(".page").forEach((p) => p.classList.remove("active"));

  // Redirect unauthenticated users from protected routes
  const isProtected = PROTECTED_ROUTES.includes(hash);
  const isAdminRoute = ADMIN_ROUTES.includes(hash);

  if (isProtected && !currentUser) {
    navigateTo("#/login");
    return;
  }

  if (isAdminRoute && !currentUser) {
    navigateTo("#/login");
    return;
  }

  // Show matching page
  if (page) {
    page.classList.add("active");

    // Render page-specific content
    if (hash === "/profile") renderProfile();
    else if (hash === "/requests") renderRequestsList();
    else if (hash === "/accounts") renderAccountsList();
    else if (hash === "/departments") renderDepartmentsList();
    else if (hash === "/employees") renderEmployeesList();
    else if (hash === "/verify-email") renderVerifyEmailPage();
  } else {
    document.getElementById("home-page")?.classList.add("active");
  }

  // Show login success message if coming from verify
  if (hash === "/login" && sessionStorage.getItem("emailVerified") === "1") {
    document.getElementById("loginSuccessMessage").style.display = "block";
    sessionStorage.removeItem("emailVerified");
  }
}

// ============ Phase 4: Data Persistence ============
const STORAGE_KEY = "ipt_demo_v1";

function loadFromStorage() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      window.db = JSON.parse(data);
      return;
    }
  } catch (e) {}
  // Seed data
  window.db = {
    nextId: { account: 2, department: 3, employee: 1, request: 1 },
    accounts: [
      {
        id: 1,
        firstName: "Admin",
        lastName: "User",
        email: "admin@example.com",
        password: "Password123!",
        role: "Admin",
        verified: true,
      },
    ],
    departments: [
      { id: 1, name: "Engineering", description: "Software team" },
      { id: 2, name: "HR", description: "Human Resources" },
    ],
    employees: [],
    requests: [],
  };
}

function saveToStorage() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(window.db));
}

// ============ Phase 8: Toast ============
function showToast(message, type = "info") {
  const container = document.getElementById("toastContainer");
  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

// ============ Phase 3: Auth State ============
function setAuthState(isAuth, user = null) {
  currentUser = user;
  document.body.classList.remove("authenticated", "not-authenticated", "is-admin");
  document.body.classList.add(isAuth ? "authenticated" : "not-authenticated");
  if (isAuth && user?.role === "Admin") {
    document.body.classList.add("is-admin");
  }

  const navUsername = document.getElementById("navUsername");
  const dropdownWrapper = document.querySelector(".user-dropdown-wrapper");
  if (navUsername) navUsername.textContent = user ? "Admin" : "User";
  if (dropdownWrapper && isAuth) dropdownWrapper.style.display = "block";
  if (dropdownWrapper && !isAuth) dropdownWrapper.style.display = "none";
}

function initAuthFromStorage() {
  const token = localStorage.getItem("auth_token");
  if (!token) return;

  const account = window.db.accounts.find((a) => a.email === token && a.verified);
  if (!account) {
    localStorage.removeItem("auth_token");
    return;
  }

  setAuthState(true, {
    id: account.id,
    firstName: account.firstName,
    lastName: account.lastName,
    email: account.email,
    role: account.role,
  });
}

// ============ Phase 3: Registration ============
document.getElementById("registerForm")?.addEventListener("submit", (e) => {
  e.preventDefault();
  const firstName = document.getElementById("regFirstName").value.trim();
  const lastName = document.getElementById("regLastName").value.trim();
  const email = document.getElementById("regEmail").value.trim().toLowerCase();
  const password = document.getElementById("regPassword").value;

  if (password.length < 6) {
    showToast("Password must be at least 6 characters.", "error");
    return;
  }

  const exists = window.db.accounts.some((a) => a.email === email);
  if (exists) {
    showToast("Email already registered.", "error");
    return;
  }

  const id = window.db.nextId.account++;
  window.db.accounts.push({
    id,
    firstName,
    lastName,
    email,
    password,
    role: "User",
    verified: false,
  });
  saveToStorage();
  localStorage.setItem("unverified_email", email);
  showToast("Registration successful. Please verify your email.", "success");
  navigateTo("#/verify-email");
});

// ============ Phase 3: Verify Email ============
function renderVerifyEmailPage() {
  const email = localStorage.getItem("unverified_email");
  const el = document.getElementById("verifyEmail");
  if (el) el.textContent = email || "";
}

document.getElementById("simulateVerifyBtn")?.addEventListener("click", () => {
  const email = localStorage.getItem("unverified_email");
  if (!email) {
    navigateTo("#/register");
    return;
  }

  const account = window.db.accounts.find((a) => a.email === email);
  if (account) {
    account.verified = true;
    saveToStorage();
    localStorage.removeItem("unverified_email");
    sessionStorage.setItem("emailVerified", "1");
    showToast("Email verified successfully!", "success");
    navigateTo("#/login");
  }
});

// ============ Phase 3: Login ============
document.getElementById("loginForm")?.addEventListener("submit", (e) => {
  e.preventDefault();
  const email = document.getElementById("loginEmail").value.trim().toLowerCase();
  const password = document.getElementById("loginPassword").value;

  const account = window.db.accounts.find(
    (a) => a.email === email && a.password === password && a.verified
  );

  if (!account) {
    showToast("Invalid email, password, or unverified account.", "error");
    return;
  }

  localStorage.setItem("auth_token", account.email);
  setAuthState(true, {
    id: account.id,
    firstName: account.firstName,
    lastName: account.lastName,
    email: account.email,
    role: account.role,
  });
  showToast("Login successful!", "success");
  navigateTo("#/profile");
});

// ============ Phase 3: Logout ============
document.getElementById("logoutLink")?.addEventListener("click", (e) => {
  e.preventDefault();
  localStorage.removeItem("auth_token");
  setAuthState(false);
  navigateTo("#/");
  showToast("Logged out.", "info");
});

// ============ Phase 5: Profile ============
function renderProfile() {
  const content = document.getElementById("profileContent");
  if (!content || !currentUser) return;

  content.innerHTML = `
    <p><strong>Admin</strong></p>
    <p>Email: ${currentUser.email}</p>
    <p>Role: Admin</p>
    <button class="btn btn-primary" id="editProfileBtn">Edit Profile</button>
  `;

  document.getElementById("editProfileBtn")?.addEventListener("click", () => {
    showToast("Edit profile coming soon.", "info");
  });
}

// ============ Phase 6: Accounts ============
function renderAccountsList() {
  const tbody = document.getElementById("accountsTable");
  if (!tbody) return;

  const accounts = window.db.accounts || [];

  tbody.innerHTML = `
    <div class="table-wrapper">
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Role</th>
            <th>Verified</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${accounts.length === 0 ? "<tr><td colspan='5'>No accounts.</td></tr>" : ""}
          ${accounts
            .map(
              (a) => `
            <tr>
              <td>${a.firstName} ${a.lastName}</td>
              <td>${a.email}</td>
              <td>${a.role}</td>
              <td>${a.verified ? "✓" : "—"}</td>
              <td>
                <button class="btn-link btn-link-edit" data-edit="${a.id}">Edit</button>
                <button class="btn-link btn-link-reset" data-reset="${a.id}">Reset Password</button>
                <button class="btn-link btn-link-delete" data-delete="${a.id}">Delete</button>
              </td>
            </tr>
          `
            )
            .join("")}
        </tbody>
      </table>
    </div>
  `;

  tbody.querySelectorAll("[data-edit]").forEach((btn) => {
    btn.addEventListener("click", () => editAccount(Number(btn.dataset.edit)));
  });
  tbody.querySelectorAll("[data-reset]").forEach((btn) => {
    btn.addEventListener("click", () => resetPassword(Number(btn.dataset.reset)));
  });
  tbody.querySelectorAll("[data-delete]").forEach((btn) => {
    btn.addEventListener("click", () => deleteAccount(Number(btn.dataset.delete)));
  });
}

function editAccount(id) {
  const a = window.db.accounts.find((x) => x.id === id);
  if (!a) return;

  const section = document.getElementById("accountFormSection");
  const form = document.getElementById("accountForm");

  document.getElementById("accountId").value = a.id;
  document.getElementById("accFirstName").value = a.firstName;
  document.getElementById("accLastName").value = a.lastName;
  document.getElementById("accEmail").value = a.email;
  document.getElementById("accPassword").value = "";
  document.getElementById("accRole").value = a.role;
  document.getElementById("accVerified").checked = a.verified;

  section.style.display = "block";
}

function resetPassword(id) {
  if (id === currentUser?.id) {
    showToast("Use profile to change your own password.", "warning");
    return;
  }
  const newPass = prompt("Enter new password (min 6 chars):");
  if (!newPass || newPass.length < 6) {
    showToast("Password must be at least 6 characters.", "error");
    return;
  }
  const a = window.db.accounts.find((x) => x.id === id);
  if (a) {
    a.password = newPass;
    saveToStorage();
    showToast("Password reset.", "success");
    renderAccountsList();
  }
}

function deleteAccount(id) {
  if (id === currentUser?.id) {
    showToast("Cannot delete your own account.", "error");
    return;
  }
  if (!confirm("Delete this account?")) return;

  window.db.accounts = window.db.accounts.filter((a) => a.id !== id);
  saveToStorage();
  showToast("Account deleted.", "success");
  renderAccountsList();
}

document.getElementById("addAccountBtn")?.addEventListener("click", () => {
  document.getElementById("accountId").value = "";
  document.getElementById("accountForm").reset();
  document.getElementById("accountFormSection").style.display = "block";
});

document.getElementById("cancelAccountBtn")?.addEventListener("click", () => {
  document.getElementById("accountFormSection").style.display = "none";
});

document.getElementById("accountForm")?.addEventListener("submit", (e) => {
  e.preventDefault();
  const id = document.getElementById("accountId").value;
  const firstName = document.getElementById("accFirstName").value.trim();
  const lastName = document.getElementById("accLastName").value.trim();
  const email = document.getElementById("accEmail").value.trim().toLowerCase();
  const password = document.getElementById("accPassword").value;
  const role = document.getElementById("accRole").value;
  const verified = document.getElementById("accVerified").checked;

  if (id) {
    const a = window.db.accounts.find((x) => x.id === Number(id));
    if (a) {
      a.firstName = firstName;
      a.lastName = lastName;
      if (password) a.password = password;
      a.role = role;
      a.verified = verified;
      if (a.email !== email) {
        const exists = window.db.accounts.some((x) => x.email === email && x.id !== a.id);
        if (exists) {
          showToast("Email already in use.", "error");
          return;
        }
        a.email = email;
      }
    }
  } else {
    if (password.length < 6) {
      showToast("Password must be at least 6 characters.", "error");
      return;
    }
    const exists = window.db.accounts.some((x) => x.email === email);
    if (exists) {
      showToast("Email already in use.", "error");
      return;
    }
    window.db.accounts.push({
      id: window.db.nextId.account++,
      firstName,
      lastName,
      email,
      password,
      role,
      verified,
    });
  }

  saveToStorage();
  showToast("Account saved.", "success");
  document.getElementById("accountFormSection").style.display = "none";
  renderAccountsList();
});

// ============ Phase 6: Departments ============
function renderDepartmentsList() {
  const container = document.getElementById("departmentsTable");
  if (!container) return;

  const depts = window.db.departments || [];

  container.innerHTML = `
    <div class="table-wrapper">
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Description</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${depts.length === 0 ? "<tr><td colspan='3'>No departments.</td></tr>" : ""}
          ${depts
            .map(
              (d) => `
            <tr>
              <td>${d.name}</td>
              <td>${d.description || "—"}</td>
              <td>
                <button class="btn-link btn-link-edit">Edit</button>
                <button class="btn-link btn-link-delete">Delete</button>
              </td>
            </tr>
          `
            )
            .join("")}
        </tbody>
      </table>
    </div>
  `;
}

document.getElementById("addDeptBtn")?.addEventListener("click", () => {
  const name = prompt("Department name:");
  if (!name?.trim()) return;
  const description = prompt("Description (optional):") || "";
  window.db.departments.push({
    id: window.db.nextId.department++,
    name: name.trim(),
    description: description.trim(),
  });
  saveToStorage();
  showToast("Department added.", "success");
  renderDepartmentsList();
});

// ============ Phase 6: Employees ============
function renderEmployeesList() {
  const container = document.getElementById("employeesTable");
  if (!container) return;

  const employees = window.db.employees || [];
  const depts = window.db.departments || [];

  const getDeptName = (id) => depts.find((d) => d.id === id)?.name || "—";
  const getAccountEmail = (id) => window.db.accounts.find((a) => a.id === id)?.email || "—";

  container.innerHTML = `
    <div class="table-wrapper">
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>User</th>
            <th>Position</th>
            <th>Dept</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${employees.length === 0 ? "<tr><td colspan='5'>No employees.</td></tr>" : ""}
          ${employees
            .map(
              (e) => `
            <tr>
              <td>${e.employeeId}</td>
              <td>${getAccountEmail(e.userId)}</td>
              <td>${e.position}</td>
              <td>${getDeptName(e.deptId)}</td>
              <td>
                <button class="btn-link btn-link-edit" data-edit="${e.id}">Edit</button>
                <button class="btn-link btn-link-delete" data-delete="${e.id}">Delete</button>
              </td>
            </tr>
          `
            )
            .join("")}
        </tbody>
      </table>
    </div>
  `;

  container.querySelectorAll("[data-edit]").forEach((btn) => {
    btn.addEventListener("click", () => editEmployee(Number(btn.dataset.edit)));
  });
  container.querySelectorAll("[data-delete]").forEach((btn) => {
    btn.addEventListener("click", () => deleteEmployee(Number(btn.dataset.delete)));
  });

  // Populate department dropdown
  const sel = document.getElementById("empDept");
  if (sel) {
    sel.innerHTML = depts.map((d) => `<option value="${d.id}">${d.name}</option>`).join("");
  }
}

function editEmployee(id) {
  const e = window.db.employees.find((x) => x.id === id);
  if (!e) return;

  document.getElementById("employeeEditId").value = e.id;
  document.getElementById("empId").value = e.employeeId;
  document.getElementById("empEmail").value = getAccountEmailForEmployee(e.userId);
  document.getElementById("empPosition").value = e.position;
  document.getElementById("empDept").value = e.deptId;
  document.getElementById("empHireDate").value = e.hireDate || "";

  document.getElementById("employeeFormSection").style.display = "block";
}

function getAccountEmailForEmployee(userId) {
  return window.db.accounts.find((a) => a.id === userId)?.email || "";
}

function deleteEmployee(id) {
  if (!confirm("Delete this employee?")) return;
  window.db.employees = window.db.employees.filter((e) => e.id !== id);
  saveToStorage();
  showToast("Employee deleted.", "success");
  renderEmployeesList();
}

document.getElementById("addEmployeeBtn")?.addEventListener("click", () => {
  document.getElementById("employeeEditId").value = "";
  document.getElementById("employeeForm").reset();
  document.getElementById("employeeFormSection").style.display = "block";
  const sel = document.getElementById("empDept");
  sel.innerHTML = (window.db.departments || []).map((d) => `<option value="${d.id}">${d.name}</option>`).join("");
});

document.getElementById("cancelEmployeeBtn")?.addEventListener("click", () => {
  document.getElementById("employeeFormSection").style.display = "none";
});

document.getElementById("employeeForm")?.addEventListener("submit", (e) => {
  e.preventDefault();
  const editId = document.getElementById("employeeEditId").value;
  const employeeId = document.getElementById("empId").value.trim();
  const email = document.getElementById("empEmail").value.trim().toLowerCase();
  const position = document.getElementById("empPosition").value.trim();
  const deptId = Number(document.getElementById("empDept").value);
  const hireDate = document.getElementById("empHireDate").value;

  const account = window.db.accounts.find((a) => a.email === email);
  if (!account) {
    showToast("No account found with that email.", "error");
    return;
  }

  if (editId) {
    const emp = window.db.employees.find((x) => x.id === Number(editId));
    if (emp) {
      emp.employeeId = employeeId;
      emp.userId = account.id;
      emp.deptId = deptId;
      emp.position = position;
      emp.hireDate = hireDate || null;
    }
  } else {
    window.db.employees.push({
      id: window.db.nextId.employee++,
      employeeId,
      userId: account.id,
      deptId,
      position,
      hireDate: hireDate || null,
    });
  }

  saveToStorage();
  showToast("Employee saved.", "success");
  document.getElementById("employeeFormSection").style.display = "none";
  renderEmployeesList();
});

// ============ Phase 7: User Requests ============
function renderRequestsList() {
  const container = document.getElementById("requestsList");
  if (!container || !currentUser) return;

  const requests = (window.db.requests || []).filter((r) => r.employeeEmail === currentUser.email);

  container.innerHTML = `
    <div class="table-wrapper">
      <table>
        <thead>
          <tr>
            <th>Type</th>
            <th>Items</th>
            <th>Status</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          ${
            requests.length === 0
              ? "<tr><td colspan='4'>You have no requests yet.</td></tr>"
              : ""
          }
          ${requests
            .map(
              (r) => {
                const badgeClass =
                  r.status === "Approved"
                    ? "badge-success"
                    : r.status === "Rejected"
                    ? "badge-danger"
                    : "badge-warning";
                const itemsStr = (r.items || [])
                  .map((i) => `${i.name} (${i.qty})`)
                  .join(", ");
                return `
            <tr>
              <td>${r.type}</td>
              <td>${itemsStr || "—"}</td>
              <td><span class="badge ${badgeClass}">${r.status}</span></td>
              <td>${r.date || "—"}</td>
            </tr>
          `;
              }
            )
            .join("")}
        </tbody>
      </table>
    </div>
    ${requests.length === 0 ? '<button class="btn btn-success" id="createRequestBtn">Create One</button>' : ""}
  `;

  document.getElementById("createRequestBtn")?.addEventListener("click", () => {
    document.getElementById("newRequestModal").classList.add("open");
  });
}

document.getElementById("newRequestBtn")?.addEventListener("click", () => {
  document.getElementById("newRequestModal").classList.add("open");
});

document.getElementById("closeRequestModal")?.addEventListener("click", () => {
  document.getElementById("newRequestModal").classList.remove("open");
});

document.getElementById("newRequestModal")?.addEventListener("click", (e) => {
  if (e.target.id === "newRequestModal") e.target.classList.remove("open");
});

// Add/remove request items
function addRequestItemRow() {
  const container = document.getElementById("requestItems");
  const row = document.createElement("div");
  row.className = "item-row";
  row.innerHTML = `
    <input type="text" placeholder="Item name" class="item-name">
    <input type="number" placeholder="Qty" class="item-qty" value="1" min="1">
    <button type="button" class="btn-icon btn-add-item">+</button>
    <button type="button" class="btn-icon btn-remove-item">×</button>
  `;
  container.appendChild(row);
}

document.getElementById("addRequestItem")?.addEventListener("click", addRequestItemRow);

// Event delegation for request item buttons
document.getElementById("requestItems")?.addEventListener("click", (e) => {
  const container = document.getElementById("requestItems");
  if (e.target.classList.contains("btn-add-item")) {
    addRequestItemRow();
  } else if (e.target.classList.contains("btn-remove-item")) {
    if (container.querySelectorAll(".item-row").length > 1) {
      e.target.closest(".item-row")?.remove();
    }
  }
});

document.getElementById("newRequestForm")?.addEventListener("submit", (e) => {
  e.preventDefault();
  const type = document.getElementById("reqType").value;
  const rows = document.querySelectorAll("#requestItems .item-row");
  const items = [];
  rows.forEach((row) => {
    const name = row.querySelector(".item-name").value.trim();
    const qty = parseInt(row.querySelector(".item-qty").value, 10) || 1;
    if (name) items.push({ name, qty });
  });

  if (items.length === 0) {
    showToast("Add at least one item.", "error");
    return;
  }

  window.db.requests.push({
    id: window.db.nextId.request++,
    type,
    items,
    status: "Pending",
    date: new Date().toISOString().slice(0, 10),
    employeeEmail: currentUser.email,
  });
  saveToStorage();

  document.getElementById("newRequestModal").classList.remove("open");
  const itemsContainer = document.getElementById("requestItems");
  itemsContainer.innerHTML = "";
  addRequestItemRow();

  showToast("Request submitted.", "success");
  renderRequestsList();
});

// ============ Dropdown ============
document.getElementById("dropdownTrigger")?.addEventListener("click", (e) => {
  e.stopPropagation();
  document.getElementById("dropdownMenu").classList.toggle("open");
});
document.addEventListener("click", () => document.getElementById("dropdownMenu")?.classList.remove("open"));
document.getElementById("dropdownMenu")?.addEventListener("click", (e) => e.stopPropagation());

// ============ Init ============
document.addEventListener("DOMContentLoaded", () => {
  loadFromStorage();
  initAuthFromStorage();

  if (!window.location.hash) navigateTo("#/");
  handleRouting();
  renderVerifyEmailPage();

  window.addEventListener("hashchange", () => {
    handleRouting();
    if (window.location.hash === "#/verify-email") renderVerifyEmailPage();
  });
});
