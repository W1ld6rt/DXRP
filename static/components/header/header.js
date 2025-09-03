// ====== HEADER COMPONENT ======

class HeaderComponent {
  constructor() {
    this.elements = {
      streamBtn: document.getElementById('btn-stream'),
      obsStatus: document.getElementById('obs-status'),
      obsPreview: document.getElementById('obs-preview'),
      scenesGrid: document.getElementById('scenes-grid')
    };
    
    this.state = {
      connected: false,
      streaming: false,
      currentScene: '',
      scenes: []
    };
    
    this.init();
  }
  
  init() {
    this.setupEventListeners();
    this.updateStatus();
  }
  
  setupEventListeners() {
    if (this.elements.streamBtn) {
      this.elements.streamBtn.addEventListener('click', () => {
        this.toggleStream();
      });
    }
  }
  
  // OBS Connection Management
  setConnectionStatus(connected) {
    this.state.connected = connected;
    this.updateStatus();
    
    if (connected) {
      this.showToast('Connesso a OBS Studio', 'success');
    } else {
      this.showToast('Disconnesso da OBS Studio', 'info');
    }
  }
  
  setStreamingStatus(streaming) {
    this.state.streaming = streaming;
    this.updateStreamButton();
    
    if (streaming) {
      this.showToast('Stream iniziato', 'success');
    } else {
      this.showToast('Stream terminato', 'info');
    }
  }
  
  setScenes(scenes) {
    this.state.scenes = scenes;
    this.renderScenes();
  }
  
  updateStatus() {
    const statusEl = this.elements.obsStatus;
    const streamBtn = this.elements.streamBtn;
    
    if (statusEl) {
      const icon = statusEl.querySelector('.status-icon');
      const text = statusEl.querySelector('.status-text');
      
      if (this.state.connected) {
        statusEl.classList.remove('offline');
        statusEl.classList.add('online');
        if (icon) icon.textContent = 'wifi';
        if (text) text.textContent = 'Connesso';
      } else {
        statusEl.classList.remove('online');
        statusEl.classList.add('offline');
        if (icon) icon.textContent = 'wifi_off';
        if (text) text.textContent = 'Offline';
      }
    }
    
    if (streamBtn) {
      streamBtn.disabled = !this.state.connected;
    }
    
    this.updateStreamButton();
  }
  
  updateStreamButton() {
    const streamBtn = this.elements.streamBtn;
    if (!streamBtn) return;
    
    if (this.state.streaming) {
      streamBtn.innerHTML = `
        <span class="material-symbols-rounded">power</span>
        <span class="btn-text">Termina Stream</span>
      `;
      streamBtn.classList.remove('btn-outline');
      streamBtn.classList.add('btn-destructive');
    } else {
      streamBtn.innerHTML = `
        <span class="material-symbols-rounded">power</span>
        <span class="btn-text">Inizia Stream</span>
      `;
      streamBtn.classList.remove('btn-destructive');
      streamBtn.classList.add('btn-outline');
    }
  }
  
  renderScenes() {
    const scenesGrid = this.elements.scenesGrid;
    if (!scenesGrid) return;
    
    scenesGrid.innerHTML = '';
    
    this.state.scenes.forEach(scene => {
      const btn = document.createElement('button');
      btn.className = 'btn';
      btn.textContent = scene.name;
      
      if (scene.name === this.state.currentScene) {
        btn.classList.add('active');
      }
      
      btn.addEventListener('click', () => {
        this.setScene(scene.name);
      });
      
      scenesGrid.appendChild(btn);
    });
  }
  
  setScene(sceneName) {
    this.state.currentScene = sceneName;
    this.renderScenes();
    
    // Emit to server
    if (window.socket) {
      window.socket.emit('obs_set_scene', { scene: sceneName });
    }
  }
  
  toggleStream() {
    if (!this.state.connected) {
      this.showToast('Non connesso a OBS', 'error');
      return;
    }
    
    if (window.socket) {
      if (this.state.streaming) {
        window.socket.emit('obs_stop_stream');
      } else {
        window.socket.emit('obs_start_stream');
      }
    }
  }
  
  showToast(message, type = 'info') {
    // Use global Utils.showToast function
    if (window.Utils && window.Utils.showToast) {
      window.Utils.showToast(message, type);
    } else {
      console.log(`Toast: ${message} (${type})`);
    }
  }
  
  // Public methods for external access
  getState() {
    return { ...this.state };
  }
  
  // Función añadida para corregir el error recurrente
  setServerStatus(status) {
    this.setConnectionStatus(status.connected);
    if (status.streaming !== undefined) {
      this.setStreamingStatus(status.streaming);
    }
    if (status.scenes) {
      this.setScenes(status.scenes);
    }
    if (status.currentScene) {
      this.state.currentScene = status.currentScene;
      this.renderScenes();
    }
  }
  
  updatePreview(imageUrl) {
    const preview = this.elements.obsPreview;
    if (!preview) return;
    
    if (imageUrl) {
      preview.innerHTML = `<img src="${imageUrl}" alt="OBS Preview" style="width: 100%; height: 100%; object-fit: cover;">`;
    } else {
      preview.innerHTML = `
        <div class="preview-placeholder">
          <span class="material-symbols-rounded">videocam_off</span>
          <span>Anteprima Offline</span>
        </div>
      `;
    }
  }
}

// Export for global use
window.HeaderComponent = HeaderComponent;
