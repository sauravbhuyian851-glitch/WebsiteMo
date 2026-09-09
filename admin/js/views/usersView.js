/**
 * WebsiteMo CMS — Users Management View
 */
const UsersView = {
  async render(params = {}, queryParams = {}) {
    let data;
    try {
      data = await API.get('/api/users');
    } catch (e) {
      data = { users: [], pagination: { total: 0 } };
    }

    const { users } = data;

    return `
      <div class="wp-header-end">
        <h1 class="wp-heading-inline">Users</h1>
        <button type="button" class="page-title-action" onclick="UsersView.openAddUserModal()"><i class="fa-solid fa-user-plus"></i> Add New User</button>
      </div>

      <div class="table-responsive">
        <table class="wp-list-table">
          <thead>
            <tr>
              <th>Username</th>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Registered</th>
            </tr>
          </thead>
          <tbody>
            ${users.map(u => `
              <tr>
                <td>
                  <strong>${u.user_login}</strong>
                  <div class="row-actions">
                    <a href="javascript:void(0)" onclick="UsersView.editUser(${u.id})">Edit Profile</a> |
                    <a href="javascript:void(0)" onclick="UsersView.deleteUser(${u.id})" class="delete">Delete</a>
                  </div>
                </td>
                <td>${u.display_name}</td>
                <td><a href="mailto:${u.user_email}" style="color: #2271b1;">${u.user_email}</a></td>
                <td><span class="badge-status publish">${u.role}</span></td>
                <td>${new Date(u.user_registered).toLocaleDateString()}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <!-- Add User Modal -->
      <div id="addUserModal" class="modal-overlay" style="display: none;">
        <div class="modal-content">
          <div class="modal-header">
            <h3>Add New User</h3>
            <button type="button" class="button button-small" onclick="UsersView.closeAddUserModal()">✕</button>
          </div>
          <form id="addUserForm">
            <div class="modal-body">
              <div style="margin-bottom: 12px;">
                <label style="display: block; font-size: 12px; font-weight: 600; margin-bottom: 4px;">Username (required)</label>
                <input type="text" id="newUsername" style="width: 100%;" required>
              </div>
              <div style="margin-bottom: 12px;">
                <label style="display: block; font-size: 12px; font-weight: 600; margin-bottom: 4px;">Email (required)</label>
                <input type="email" id="newEmail" style="width: 100%;" required>
              </div>
              <div style="margin-bottom: 12px;">
                <label style="display: block; font-size: 12px; font-weight: 600; margin-bottom: 4px;">Password (required)</label>
                <input type="password" id="newPassword" style="width: 100%;" required>
              </div>
              <div style="margin-bottom: 12px;">
                <label style="display: block; font-size: 12px; font-weight: 600; margin-bottom: 4px;">Role</label>
                <select id="newRole" style="width: 100%;">
                  <option value="administrator">Administrator</option>
                  <option value="editor">Editor</option>
                  <option value="author">Author</option>
                  <option value="subscriber">Subscriber</option>
                </select>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="button" onclick="UsersView.closeAddUserModal()">Cancel</button>
              <button type="submit" class="button button-primary">Add New User</button>
            </div>
          </form>
        </div>
      </div>
    `;
  },

  afterRender() {
    const form = document.getElementById('addUserForm');
    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('newUsername').value;
        const email = document.getElementById('newEmail').value;
        const password = document.getElementById('newPassword').value;
        const role = document.getElementById('newRole').value;

        try {
          await API.post('/api/users', { username, email, password, role });
          App.showToast('User created successfully!', 'success');
          UsersView.closeAddUserModal();
          App.reload();
        } catch (err) {
          App.showToast(err.message || 'Failed to create user', 'error');
        }
      });
    }
  },

  openAddUserModal() {
    document.getElementById('addUserModal').style.display = 'flex';
  },

  closeAddUserModal() {
    document.getElementById('addUserModal').style.display = 'none';
  },

  async deleteUser(id) {
    if (confirm('Are you sure you want to delete this user?')) {
      try {
        await API.delete(`/api/users/${id}`);
        App.showToast('User deleted.', 'success');
        App.reload();
      } catch (err) {
        App.showToast(err.message || 'Failed to delete user', 'error');
      }
    }
  },

  async editUser(id) {
    const user = await API.get(`/api/users/${id}`);
    const displayName = prompt('Edit Display Name:', user.display_name);
    if (!displayName) return;

    await API.put(`/api/users/${id}`, { displayName });
    App.showToast('Profile updated.', 'success');
    App.reload();
  }
};
