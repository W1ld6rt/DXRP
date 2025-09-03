// ====== NAVIGATION COMPONENT ======

class NavigationComponent {
  constructor() {
    this.elements = {};
    this.currentView = 'bible';
    this.callbacks = {
      onViewChange: null,
      onBiblePrev: null,
      onBibleNext: null,
      onBibleProject: null,
      onSongPrev: null,
      onSongNext: null,
      onSongProject: null,
      onLowerThirdProject: null
    };
    
    // Initialize after DOM is ready
    this.init();
  }
  
  init() {
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.setupElements());
    } else {
      this.setupElements();
    }
  }
  
  setupElements() {
    // Setup DOM elements
    this.elements = {
      navButtons: document.querySelectorAll('.nav-btn'),
      viewControls: document.getElementById('view-controls'),
      controlGroups: document.querySelectorAll('.control-group'),
      prevBtn: document.getElementById('btn-prev'),
      nextBtn: document.getElementById('btn-next'),
      projectBtn: document.getElementById('btn-project'),
      prevSongBtn: document.getElementById('btn-prev-song'),
      nextSongBtn: document.getElementById('btn-next-song'),
      projectSongBtn: document.getElementById('btn-project-song'),
      projectLtBtn: document.getElementById('btn-project-lt')
    };
    
    this.setupEventListeners();
  }
  
  setupEventListeners() {
    // Navigation buttons
    this.elements.navButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const view = btn.dataset.view;
        this.switchView(view);
      });
    });
    
    // Bible controls
    if (this.elements.prevBtn) {
      this.elements.prevBtn.addEventListener('click', () => {
        if (this.callbacks.onBiblePrev) {
          this.callbacks.onBiblePrev();
        }
      });
    }
    
    if (this.elements.nextBtn) {
      this.elements.nextBtn.addEventListener('click', () => {
        if (this.callbacks.onBibleNext) {
          this.callbacks.onBibleNext();
        }
      });
    }
    
    if (this.elements.projectBtn) {
      this.elements.projectBtn.addEventListener('click', () => {
        if (this.callbacks.onBibleProject) {
          this.callbacks.onBibleProject();
        }
      });
    }
    
    // Song controls
    if (this.elements.prevSongBtn) {
      this.elements.prevSongBtn.addEventListener('click', () => {
        if (this.callbacks.onSongPrev) {
          this.callbacks.onSongPrev();
        }
      });
    }
    
    if (this.elements.nextSongBtn) {
      this.elements.nextSongBtn.addEventListener('click', () => {
        if (this.callbacks.onSongNext) {
          this.callbacks.onSongNext();
        }
      });
    }
    
    if (this.elements.projectSongBtn) {
      this.elements.projectSongBtn.addEventListener('click', () => {
        if (this.callbacks.onSongProject) {
          this.callbacks.onSongProject();
        }
      });
    }
    
    // Lower Third controls
    if (this.elements.projectLtBtn) {
      this.elements.projectLtBtn.addEventListener('click', () => {
        if (this.callbacks.onLowerThirdProject) {
          this.callbacks.onLowerThirdProject();
        }
      });
    }
  }
  
  switchView(viewName) {
    // Update navigation buttons
    this.elements.navButtons.forEach(btn => {
      btn.classList.remove('active');
      if (btn.dataset.view === viewName) {
        btn.classList.add('active');
      }
    });
    
    // Update control groups
    this.elements.controlGroups.forEach(group => {
      group.classList.remove('active');
      if (group.dataset.view === viewName) {
        group.classList.add('active');
      }
    });
    
    this.currentView = viewName;
    
    // Trigger callback
    if (this.callbacks.onViewChange) {
      this.callbacks.onViewChange(viewName);
    }
  }
  
  // Public methods for external access
  getCurrentView() {
    return this.currentView;
  }
  
  setCallbacks(callbacks) {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }
  
  updateBibleProjectButton(text) {
    if (this.elements.projectBtn) {
      const btnText = this.elements.projectBtn.querySelector('.btn-text');
      if (btnText) {
        btnText.textContent = text || 'Proietta';
      }
    }
  }
  
  updateSongProjectButton(text) {
    if (this.elements.projectSongBtn) {
      const btnText = this.elements.projectSongBtn.querySelector('.btn-text');
      if (btnText) {
        btnText.textContent = text || 'Proietta Canto';
      }
    }
  }
  
  updateLowerThirdProjectButton(text) {
    if (this.elements.projectLtBtn) {
      const btnText = this.elements.projectLtBtn.querySelector('.btn-text');
      if (btnText) {
        btnText.textContent = text || 'Proietta';
      }
    }
  }
  
  setBibleNavigationState(hasPrev, hasNext) {
    if (this.elements.prevBtn) {
      this.elements.prevBtn.disabled = !hasPrev;
    }
    if (this.elements.nextBtn) {
      this.elements.nextBtn.disabled = !hasNext;
    }
  }
  
  setSongNavigationState(hasPrev, hasNext) {
    if (this.elements.prevSongBtn) {
      this.elements.prevSongBtn.disabled = !hasPrev;
    }
    if (this.elements.nextSongBtn) {
      this.elements.nextSongBtn.disabled = !hasNext;
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
}

// Export for global use
window.NavigationComponent = NavigationComponent;
