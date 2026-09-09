/**
 * WebsiteMo CMS — Comments Moderation View
 */
const CommentsView = {
  async render(params = {}, queryParams = {}) {
    const status = queryParams.status || 'all';

    let data, stats;
    try {
      [data, stats] = await Promise.all([
        API.get(`/api/comments?status=${status}`),
        API.get('/api/comments/stats')
      ]);
    } catch (e) {
      data = { comments: [], pagination: { total: 0 } };
      stats = { all: 0, approved: 0, pending: 0, spam: 0, trash: 0 };
    }

    const { comments } = data;

    return `
      <div class="wp-header-end">
        <h1 class="wp-heading-inline">Comments</h1>
      </div>

      <ul class="subsubsub">
        <li><a href="#/comments?status=all" class="${status === 'all' ? 'current' : ''}">All <span class="count">(${stats.all})</span></a> |</li>
        <li><a href="#/comments?status=1" class="${status === '1' ? 'current' : ''}">Approved <span class="count">(${stats.approved})</span></a> |</li>
        <li><a href="#/comments?status=0" class="${status === '0' ? 'current' : ''}">Pending <span class="count">(${stats.pending})</span></a> |</li>
        <li><a href="#/comments?status=spam" class="${status === 'spam' ? 'current' : ''}">Spam <span class="count">(${stats.spam})</span></a> |</li>
        <li><a href="#/comments?status=trash" class="${status === 'trash' ? 'current' : ''}">Trash <span class="count">(${stats.trash})</span></a></li>
      </ul>

      <div class="table-responsive">
        <table class="wp-list-table">
          <thead>
            <tr>
              <th>Author</th>
              <th>Comment</th>
              <th>In Response To</th>
              <th>Submitted On</th>
            </tr>
          </thead>
          <tbody>
            ${comments.length > 0 ? comments.map(c => `
              <tr>
                <td style="width: 200px;">
                  <strong>${c.comment_author}</strong>
                  <div style="font-size: 11px; color: #646970;">${c.comment_author_email}</div>
                  <div style="font-size: 11px; color: #8c8f94;">${c.comment_author_ip}</div>
                </td>
                <td>
                  <div>${c.comment_content}</div>
                  <div class="row-actions">
                    ${c.comment_approved === '1' ? `
                      <a href="javascript:void(0)" onclick="CommentsView.setStatus(${c.id}, '0')"><i class="fa-solid fa-xmark"></i> Unapprove</a> |
                    ` : `
                      <a href="javascript:void(0)" onclick="CommentsView.setStatus(${c.id}, '1')"><i class="fa-solid fa-check"></i> Approve</a> |
                    `}
                    <a href="javascript:void(0)" onclick="CommentsView.setStatus(${c.id}, 'spam')">Spam</a> |
                    <a href="javascript:void(0)" onclick="CommentsView.setStatus(${c.id}, 'trash')" class="trash">Trash</a>
                  </div>
                </td>
                <td><a href="#/posts/edit/${c.comment_post_id}" style="color: #2271b1;">${c.post_title || 'Post #' + c.comment_post_id}</a></td>
                <td>${new Date(c.comment_date).toLocaleString()}</td>
              </tr>
            `).join('') : `
              <tr>
                <td colspan="4" style="text-align: center; color: #646970; padding: 24px;">No comments found.</td>
              </tr>
            `}
          </tbody>
        </table>
      </div>
    `;
  },

  async setStatus(id, status) {
    await API.put(`/api/comments/${id}/status`, { status });
    App.showToast('Comment status updated.', 'success');
    App.reload();
  }
};
