/**
 * WebsiteMo CMS — Media Library View
 */
const MediaView = {
  async render(params = {}, queryParams = {}) {
    let mediaData;
    try {
      mediaData = await API.get('/api/media');
    } catch (e) {
      mediaData = { attachments: [], pagination: { total: 0 } };
    }

    const { attachments } = mediaData;

    return `
      <div class="wp-header-end">
        <h1 class="wp-heading-inline">Media Library</h1>
        <button type="button" class="page-title-action" onclick="MediaView.openUploader()"><i class="fa-solid fa-cloud-arrow-up"></i> Add New Media File</button>
      </div>

      <div class="tablenav">
        <div class="actions">
          <select id="mediaMimeFilter">
            <option value="">All media items</option>
            <option value="image">Images</option>
            <option value="audio">Audio</option>
            <option value="video">Video</option>
            <option value="application">Documents</option>
          </select>
        </div>
      </div>

      <!-- Media Grid -->
      <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 16px; margin-top: 16px;">
        ${attachments.length > 0 ? attachments.map(item => `
          <div style="background: #fff; border: 1px solid #c3c4c7; border-radius: 4px; overflow: hidden; position: relative; cursor: pointer; aspect-ratio: 1;" onclick="MediaView.openDetails(${item.id})">
            ${item.mimeType.startsWith('image') ? `
              <img src="${item.url}" alt="${item.title}" style="width: 100%; height: 100%; object-fit: cover;">
            ` : `
              <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; color: #646970; background: #f6f7f7; padding: 12px; text-align: center;">
                <i class="fa-solid fa-file-lines" style="font-size: 32px; margin-bottom: 8px;"></i>
                <span style="font-size: 11px; word-break: break-all;">${item.title}</span>
              </div>
            `}
          </div>
        `).join('') : `
          <div style="grid-column: 1 / -1; padding: 40px; text-align: center; color: #646970; background: #fff; border: 1px dashed #c3c4c7; border-radius: 8px;">
            <i class="fa-solid fa-photo-film" style="font-size: 40px; color: #8c8f94; margin-bottom: 12px;"></i>
            <p style="margin: 0; font-size: 14px;">No media files found in your library.</p>
          </div>
        `}
      </div>

      <!-- Upload Modal -->
      <div id="uploaderModal" class="modal-overlay" style="display: none;">
        <div class="modal-content">
          <div class="modal-header">
            <h3>Upload New Media</h3>
            <button type="button" class="button button-small" onclick="MediaView.closeUploader()">✕</button>
          </div>
          <div class="modal-body">
            <div id="dropZone" style="border: 2px dashed #2271b1; border-radius: 8px; padding: 40px; text-align: center; background: #f0f6fc; cursor: pointer;">
              <i class="fa-solid fa-cloud-arrow-up" style="font-size: 48px; color: #2271b1; margin-bottom: 12px;"></i>
              <h3 style="margin: 0 0 8px 0; font-size: 16px; color: #1d2327;">Drop files to upload</h3>
              <p style="margin: 0 0 16px 0; color: #646970; font-size: 13px;">or select files from your computer</p>
              <input type="file" id="fileInput" style="display: none;">
              <button type="button" class="button button-primary" onclick="document.getElementById('fileInput').click()">Select Files</button>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  afterRender() {
    const fileInput = document.getElementById('fileInput');
    if (fileInput) {
      fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
          MediaView.uploadFile(e.target.files[0]);
        }
      });
    }
  },

  openUploader() {
    document.getElementById('uploaderModal').style.display = 'flex';
  },

  closeUploader() {
    document.getElementById('uploaderModal').style.display = 'none';
  },

  async uploadFile(file) {
    const formData = new FormData();
    formData.append('file', file);

    try {
      App.showToast('Uploading file...', 'info');
      await fetch('/api/media', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${API.getToken()}`
        },
        body: formData
      });
      App.showToast('File uploaded successfully!', 'success');
      this.closeUploader();
      App.reload();
    } catch (e) {
      App.showToast('Upload failed', 'error');
    }
  },

  async openDetails(id) {
    const item = await API.get(`/api/media/${id}`);
    alert(`Media Attachment Details:\n\nTitle: ${item.title}\nURL: ${item.url}\nMIME Type: ${item.mimeType}\nUploaded: ${item.date}`);
  }
};
