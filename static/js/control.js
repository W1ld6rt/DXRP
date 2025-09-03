// ====== DXPR - Control JavaScript ======

// ====== GLOBAL STATE ======
const AppState = {
  currentView: 'bible',
  obsConnected: false,
  streaming: false,
  currentScene: '',
  scenes: [],
  displayHidden: true,
  lowerThirdOpen: false,
  bibleCollapsed: false,
  darkMode: false,
  accentColor: '#3b82f6',
  currentVerse: null,
  currentSong: null,
  currentSlide: 0,
  songsList: [],
  history: [],
  settings: {
    obs: {
      host: 'localhost',
      port: 4455,
      password: ''
    },
    bibles: {
      primary: 'rv60',
      secondary: 'nr94',
      showSecondary: false
    }
  }
};

// ====== SOCKET.IO CONNECTION ======
const socket = io();

// ====== DOM ELEMENTS ======
const elements = {};

// ====== UTILITY FUNCTIONS ======
const Utils = {
  // Safe element getter
  getElement(id) {
    const element = document.getElementById(id);
    if (!element) {
      console.warn(`Element with id '${id}' not found`);
    }
    return element;
  },
  
  // Safe element getter that waits for element to exist
  waitForElement(id, timeout = 5000) {
    return new Promise((resolve) => {
      const element = document.getElementById(id);
      if (element) {
        resolve(element);
        return;
      }
      
      const startTime = Date.now();
      const checkElement = () => {
        const el = document.getElementById(id);
        if (el) {
          resolve(el);
        } else if (Date.now() - startTime < timeout) {
          setTimeout(checkElement, 50);
        } else {
          console.warn(`Element with id '${id}' not found after ${timeout}ms timeout`);
          resolve(null);
        }
      };
      checkElement();
    });
  },
  
  // Safe query selector
  querySelector(selector) {
    const element = document.querySelector(selector);
    if (!element) {
      console.warn(`Element with selector '${selector}' not found`);
    }
    return element;
  },
  
  // Safe query selector all
  querySelectorAll(selector) {
    const elements = document.querySelectorAll(selector);
    if (elements.length === 0) {
      console.warn(`No elements found with selector '${selector}'`);
    }
    return elements;
  },
  
  // Theme management
  setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    AppState.darkMode = theme === 'dark';
    localStorage.setItem('dxpr-theme', theme);
  },
  
  // Color management
  setAccentColor(color) {
    document.documentElement.style.setProperty('--md-primary', color);
    AppState.accentColor = color;
    localStorage.setItem('dxpr-accent-color', color);
  },
  
  // Show/hide elements
  show(element) {
    if (element) {
      element.classList.add('active');
    }
  },
  
  hide(element) {
    if (element) {
      element.classList.remove('active');
    }
  },
  
  // Modal management
  showModal(modalId) {
    const modal = this.getElement(modalId);
    if (modal) {
      modal.classList.add('show');
    }
  },
  
  hideModal(modalId) {
    const modal = this.getElement(modalId);
    if (modal) {
      modal.classList.remove('show');
    }
  },
  
  // Confirm dialog
  confirm(title, message) {
    return new Promise((resolve) => {
      const titleEl = this.getElement('confirm-title');
      const messageEl = this.getElement('confirm-message');
      const modal = this.getElement('confirm-modal');
      
      if (titleEl) titleEl.textContent = title;
      if (messageEl) messageEl.textContent = message;
      
      if (modal) {
        modal.classList.add('show');
        
        const handleConfirm = () => {
          modal.classList.remove('show');
          const okBtn = this.getElement('confirm-ok');
          const cancelBtn = this.getElement('confirm-cancel');
          if (okBtn) okBtn.removeEventListener('click', handleConfirm);
          if (cancelBtn) cancelBtn.removeEventListener('click', handleCancel);
          resolve(true);
        };
        
        const handleCancel = () => {
          modal.classList.remove('show');
          const okBtn = this.getElement('confirm-ok');
          const cancelBtn = this.getElement('confirm-cancel');
          if (okBtn) okBtn.removeEventListener('click', handleConfirm);
          if (cancelBtn) cancelBtn.removeEventListener('click', handleCancel);
          resolve(false);
        };
        
        const okBtn = this.getElement('confirm-ok');
        const cancelBtn = this.getElement('confirm-cancel');
        if (okBtn) okBtn.addEventListener('click', handleConfirm);
        if (cancelBtn) cancelBtn.addEventListener('click', handleCancel);
      }
    });
  },
  
  // Toast notifications
  toast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 3000);
  },
  
  // Load settings from localStorage
  loadSettings() {
    try {
      const theme = localStorage.getItem('dxpr-theme') || 'light';
      const accentColor = localStorage.getItem('dxpr-accent-color') || '#3b82f6';
      
      this.setTheme(theme);
      this.setAccentColor(accentColor);
      
      // Load other settings
      const settings = localStorage.getItem('dxpr-settings');
      if (settings) {
        AppState.settings = { ...AppState.settings, ...JSON.parse(settings) };
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  },
  
  // Save settings to localStorage
  saveSettings() {
    try {
      localStorage.setItem('dxpr-settings', JSON.stringify(AppState.settings));
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  },

  // Global toast function
  showToast(message, type = 'info', duration = 3000) {
    // Create toast notification
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    // Show toast
    setTimeout(() => toast.classList.add('show'), 10);
    
    // Auto remove after duration
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 300);
    }, duration);
  }
};

// ====== VIEW MANAGEMENT ======
const ViewManager = {
  currentView: 'bible',
  
  switchView(viewName) {
    // Hide all views
    Object.values(elements.views).forEach(view => {
      if (view) Utils.hide(view);
    });
    
    // Show selected view
    const targetView = elements.views[viewName];
    if (targetView) {
      Utils.show(targetView);
    }
    
    // Update navigation
    elements.navButtons.forEach(btn => {
      if (btn) {
        btn.classList.remove('active');
        if (btn.dataset.view === viewName) {
          btn.classList.add('active');
        }
      }
    });
    
    // Update controls
    elements.controlGroups.forEach(group => {
      if (group) {
        group.classList.remove('active');
        if (group.dataset.view === viewName) {
          group.classList.add('active');
        }
      }
    });
    
    this.currentView = viewName;
    AppState.currentView = viewName;
  },
  
  init() {
    // Navigation event listeners
    elements.navButtons.forEach(btn => {
      if (btn) {
        btn.addEventListener('click', () => {
          this.switchView(btn.dataset.view);
        });
      }
    });
    
    // Start with bible view
    this.switchView('bible');
  }
};

// ====== BIBLE MANAGEMENT ======
const BibleManager = {
  currentBook: null,
  currentChapter: null,
  currentVerse: null,
  books: [],
  chapters: [],
  verses: [],
  
  async init() {
    await this.loadBooks();
    this.setupEventListeners();
    this.loadHistory();
  },
  
  async loadBooks() {
    try {
      const response = await fetch('/api/libros');
      if (response.ok) {
        this.books = await response.json();
        this.renderBooks();
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      console.error('Error loading books:', error);
      Utils.toast('Error al cargar los libros', 'error');
    }
  },
  
  async loadChapters(bookNumber) {
    try {
      const response = await fetch(`/api/capitulos/${bookNumber}`);
      if (response.ok) {
        this.chapters = await response.json();
        this.renderChapters();
      }
    } catch (error) {
      console.error('Error loading chapters:', error);
    }
  },
  
  async loadVerses(bookNumber, chapter) {
    try {
      const response = await fetch(`/api/versiculos/${bookNumber}/${chapter}`);
      if (response.ok) {
        this.verses = await response.json();
        this.renderVerses();
      }
    } catch (error) {
      console.error('Error loading verses:', error);
    }
  },
  
  renderBooks() {
    const booksColumn = elements.bible.booksColumn;
    if (!booksColumn) return;
    
    booksColumn.innerHTML = '';
    
    this.books.forEach(book => {
      const btn = document.createElement('button');
      btn.className = 'nav-btn';
      btn.textContent = this.getBookAbbreviation(book.name);
      btn.dataset.bookNumber = book.bnumber;
      btn.addEventListener('click', () => this.selectBook(book));
      booksColumn.appendChild(btn);
    });
  },
  
  renderChapters() {
    const chaptersColumn = elements.bible.chaptersColumn;
    if (!chaptersColumn) return;
    
    chaptersColumn.innerHTML = '';
    
    this.chapters.forEach(chapter => {
      const btn = document.createElement('button');
      btn.className = 'nav-btn';
      btn.textContent = chapter;
      btn.dataset.chapter = chapter;
      btn.addEventListener('click', () => this.selectChapter(chapter));
      chaptersColumn.appendChild(btn);
    });
  },
  
  renderVerses() {
    const versesColumn = elements.bible.versesColumn;
    if (!versesColumn) return;
    
    versesColumn.innerHTML = '';
    
    this.verses.forEach(verse => {
      const btn = document.createElement('button');
      btn.className = 'nav-btn';
      btn.textContent = verse;
      btn.dataset.verse = verse;
      btn.addEventListener('click', () => this.selectVerse(verse));
      versesColumn.appendChild(btn);
    });
  },
  
  getBookAbbreviation(name) {
    const abbreviations = {
      'Genesis': 'Gen',
      'Exodus': 'Exo',
      'Leviticus': 'Lev',
      'Numbers': 'Num',
      'Deuteronomy': 'Deu',
      'Joshua': 'Jos',
      'Judges': 'Jdg',
      'Ruth': 'Rut',
      '1 Samuel': '1Sa',
      '2 Samuel': '2Sa',
      '1 Kings': '1Ki',
      '2 Kings': '2Ki',
      '1 Chronicles': '1Ch',
      '2 Chronicles': '2Ch',
      'Ezra': 'Ezr',
      'Nehemiah': 'Neh',
      'Esther': 'Est',
      'Job': 'Job',
      'Psalms': 'Psa',
      'Proverbs': 'Pro',
      'Ecclesiastes': 'Ecc',
      'Song of Solomon': 'Sng',
      'Isaiah': 'Isa',
      'Jeremiah': 'Jer',
      'Lamentations': 'Lam',
      'Ezekiel': 'Ezk',
      'Daniel': 'Dan',
      'Hosea': 'Hos',
      'Joel': 'Jol',
      'Amos': 'Amo',
      'Obadiah': 'Oba',
      'Jonah': 'Jon',
      'Micah': 'Mic',
      'Nahum': 'Nah',
      'Habakkuk': 'Hab',
      'Zephaniah': 'Zep',
      'Haggai': 'Hag',
      'Zechariah': 'Zec',
      'Malachi': 'Mal',
      'Matthew': 'Mat',
      'Mark': 'Mrk',
      'Luke': 'Luk',
      'John': 'Jhn',
      'Acts': 'Act',
      'Romans': 'Rom',
      '1 Corinthians': '1Co',
      '2 Corinthians': '2Co',
      'Galatians': 'Gal',
      'Ephesians': 'Eph',
      'Philippians': 'Php',
      'Colossians': 'Col',
      '1 Thessalonians': '1Th',
      '2 Thessalonians': '2Th',
      '1 Timothy': '1Ti',
      '2 Timothy': '2Ti',
      'Titus': 'Tit',
      'Philemon': 'Phm',
      'Hebrews': 'Heb',
      'James': 'Jas',
      '1 Peter': '1Pe',
      '2 Peter': '2Pe',
      '1 John': '1Jn',
      '2 John': '2Jn',
      '3 John': '3Jn',
      'Jude': 'Jud',
      'Revelation': 'Rev'
    };
    
    return abbreviations[name] || name.substring(0, 3);
  },
  
  selectBook(book) {
    this.currentBook = book;
    this.currentChapter = null;
    this.currentVerse = null;
    this.loadChapters(book.bnumber);
    this.clearPreview();
  },
  
  selectChapter(chapter) {
    if (!this.currentBook) return;
    
    this.currentChapter = chapter;
    this.currentVerse = null;
    this.loadVerses(this.currentBook.bnumber, chapter);
    this.clearPreview();
  },
  
  async selectVerse(verse) {
    if (!this.currentBook || !this.currentChapter) return;
    
    this.currentVerse = verse;
    await this.loadVerseContent();
  },
  
  async loadVerseContent() {
    try {
      const response = await fetch(`/api/versiculo/${this.currentBook.bnumber}/${this.currentChapter}/${this.currentVerse}`);
      if (response.ok) {
        const data = await response.json();
        this.displayVerse(data);
      }
    } catch (error) {
      console.error('Error loading verse content:', error);
    }
  },
  
  displayVerse(data) {
    const previewReference = elements.bible.previewReference;
    const previewContent = elements.bible.previewContent;
    
    if (previewReference) {
      previewReference.textContent = `${this.currentBook.name} ${this.currentChapter}:${this.currentVerse}`;
    }
    
    if (previewContent) {
      previewContent.innerHTML = `
        <div class="verse-content">
          <p class="verse-text">${data.text}</p>
          ${data.secondary ? `<p class="verse-secondary">${data.secondary}</p>` : ''}
        </div>
      `;
    }
    
    // Update projection button
    const projectBtn = elements.bible.projectBtn;
    if (projectBtn) {
      projectBtn.innerHTML = `
        <span class="material-symbols-rounded">visibility</span>
        <span class="btn-text">${this.currentBook.name} ${this.currentChapter}:${this.currentVerse}</span>
      `;
    }
  },
  
  clearPreview() {
    const previewReference = elements.bible.previewReference;
    const previewContent = elements.bible.previewContent;
    
    if (previewReference) {
      previewReference.textContent = 'Bibbia';
    }
    
    if (previewContent) {
      previewContent.innerHTML = `
        <div class="empty-state">
          <span class="material-symbols-rounded">menu_book</span>
          <p>Nessun versetto selezionato</p>
        </div>
      `;
    }
  },
  
  renderHistory() {
    const historyList = elements.bible.historyList;
    if (!historyList) return;
    
    if (AppState.history.length === 0) {
      historyList.innerHTML = `
        <div class="empty-state">
          <span class="material-symbols-rounded">history</span>
          <p>Nessuna cronologia</p>
        </div>
      `;
      return;
    }
    
    historyList.innerHTML = '';
    AppState.history.forEach(item => {
      const historyItem = document.createElement('div');
      historyItem.className = 'history-item';
      historyItem.textContent = `${item.book} ${item.chapter}:${item.verse}`;
      historyItem.addEventListener('click', () => {
        // Load this verse
        this.loadHistoryVerse(item);
      });
      historyList.appendChild(historyItem);
    });
  },
  
  async loadHistoryVerse(item) {
    // Find book by name
    const book = this.books.find(b => b.name === item.book);
    if (!book) return;
    
    this.currentBook = book;
    this.currentChapter = item.chapter;
    this.currentVerse = item.verse;
    
    await this.loadChapters(book.bnumber);
    await this.loadVerses(book.bnumber, item.chapter);
    await this.loadVerseContent();
  },
  
  loadHistory() {
    try {
      const history = localStorage.getItem('dxpr-bible-history');
      if (history) {
        AppState.history = JSON.parse(history);
        this.renderHistory();
      }
    } catch (error) {
      console.error('Error loading history:', error);
    }
  },
  
  saveHistory() {
    try {
      localStorage.setItem('dxpr-bible-history', JSON.stringify(AppState.history));
    } catch (error) {
      console.error('Error saving history:', error);
    }
  },
  
  addToHistory(book, chapter, verse) {
    const historyItem = { book, chapter, verse };
    
    // Remove if already exists
    AppState.history = AppState.history.filter(item => 
      !(item.book === book && item.chapter === chapter && item.verse === verse)
    );
    
    // Add to beginning
    AppState.history.unshift(historyItem);
    
    // Keep only last 20 items
    if (AppState.history.length > 20) {
      AppState.history = AppState.history.slice(0, 20);
    }
    
    this.renderHistory();
    this.saveHistory();
  },
  
  clearHistory() {
    AppState.history = [];
    this.renderHistory();
    this.saveHistory();
  },
  
  setupEventListeners() {
    // Clear history button
    const clearHistoryBtn = elements.bible.clearHistory;
    if (clearHistoryBtn) {
      clearHistoryBtn.addEventListener('click', () => {
        this.clearHistory();
      });
    }
    
    // Project button
    const projectBtn = elements.bible.projectBtn;
    if (projectBtn) {
      projectBtn.addEventListener('click', () => {
        if (this.currentBook && this.currentChapter && this.currentVerse) {
          this.projectVerse();
        }
      });
    }
    
    // Navigation buttons
    const prevBtn = elements.bible.prevBtn;
    const nextBtn = elements.bible.nextBtn;
    
    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        this.navigateVerse(-1);
      });
    }
    
    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        this.navigateVerse(1);
      });
    }
  },
  
  navigateVerse(direction) {
    if (!this.currentBook || !this.currentChapter || !this.currentVerse) return;
    
    const currentIndex = this.verses.indexOf(parseInt(this.currentVerse));
    if (currentIndex === -1) return;
    
    const newIndex = currentIndex + direction;
    if (newIndex >= 0 && newIndex < this.verses.length) {
      this.selectVerse(this.verses[newIndex]);
    }
  },
  
  projectVerse() {
    if (!this.currentBook || !this.currentChapter || !this.currentVerse) return;
    
    const verseData = {
      book: this.currentBook.name,
      chapter: this.currentChapter,
      verse: this.currentVerse,
      text: elements.bible.previewContent?.querySelector('.verse-text')?.textContent || ''
    };
    
    socket.emit('versiculo', verseData);
    this.addToHistory(this.currentBook.name, this.currentChapter, this.currentVerse);
  }
};

// ====== SONGS MANAGEMENT ======
const SongsManager = {
  currentSong: null,
  currentSlide: 0,
  songs: [],
  
  init() {
    this.loadSongs();
    this.setupEventListeners();
  },
  
  loadSongs() {
    try {
      const songs = localStorage.getItem('dxpr-songs');
      if (songs) {
        this.songs = JSON.parse(songs);
        this.renderSongs();
      }
    } catch (error) {
      console.error('Error loading songs:', error);
    }
  },
  
  saveSongs() {
    try {
      localStorage.setItem('dxpr-songs', JSON.stringify(this.songs));
    } catch (error) {
      console.error('Error saving songs:', error);
    }
  },
  
  renderSongs() {
    const songsList = elements.songs.list;
    if (!songsList) return;
    
    if (this.songs.length === 0) {
      songsList.innerHTML = `
        <div class="empty-state">
          <span class="material-symbols-rounded">queue_music</span>
          <p>Nessun canto in lista</p>
        </div>
      `;
      return;
    }
    
    songsList.innerHTML = '';
    this.songs.forEach((song, index) => {
      const songItem = document.createElement('div');
      songItem.className = 'song-item';
      songItem.innerHTML = `
        <span class="song-title">${song.title}</span>
        <button class="btn-icon remove-song" data-index="${index}">
          <span class="material-symbols-rounded">delete</span>
        </button>
      `;
      
      songItem.addEventListener('click', () => {
        this.selectSong(index);
      });
      
      songsList.appendChild(songItem);
    });
  },
  
  selectSong(index) {
    this.currentSong = this.songs[index];
    this.currentSlide = 0;
    this.displaySong();
  },
  
  displaySong() {
    const songTitle = elements.songs.songTitle;
    const songContent = elements.songs.songContent;
    
    if (songTitle) {
      songTitle.textContent = this.currentSong?.title || 'Seleziona un canto';
    }
    
    if (songContent) {
      if (!this.currentSong) {
        songContent.innerHTML = `
          <div class="empty-state">
            <span class="material-symbols-rounded">music_note</span>
            <p>Nessun canto selezionato</p>
          </div>
        `;
      } else {
        const slides = this.parseChordPro(this.currentSong.content);
        if (slides.length > 0) {
          songContent.innerHTML = this.renderSlide(slides[this.currentSlide]);
        }
      }
    }
  },
  
  parseChordPro(content) {
    if (!content) return [];
    
    const lines = content.split('\n');
    const slides = [];
    let currentSlide = [];
    
    lines.forEach(line => {
      if (line.trim() === '') {
        if (currentSlide.length > 0) {
          slides.push(currentSlide.join('\n'));
          currentSlide = [];
        }
      } else {
        currentSlide.push(line);
      }
    });
    
    if (currentSlide.length > 0) {
      slides.push(currentSlide.join('\n'));
    }
    
    return slides;
  },
  
  renderSlide(content) {
    if (!content) return '';
    
    const lines = content.split('\n');
    const renderedLines = lines.map(line => {
      // Remove chord markers [Chord]
      line = line.replace(/\[([^\]]+)\]/g, '');
      // Remove other ChordPro directives
      line = line.replace(/\{[^}]+\}/g, '');
      return line.trim();
    }).filter(line => line.length > 0);
    
    return renderedLines.map(line => `<p>${line}</p>`).join('');
  },
  
  setupEventListeners() {
    // Add song button
    const addSongBtn = elements.songs.addSong;
    if (addSongBtn) {
      addSongBtn.addEventListener('click', () => {
        Utils.showModal('add-song-modal');
      });
    }
    
    // Clear songs button
    const clearSongsBtn = elements.songs.clearSongs;
    if (clearSongsBtn) {
      clearSongsBtn.addEventListener('click', () => {
        this.clearSongs();
      });
    }
    
    // Project button
    const projectBtn = elements.songs.projectBtn;
    if (projectBtn) {
      projectBtn.addEventListener('click', () => {
        this.projectSong();
      });
    }
    
    // Navigation buttons
    const prevBtn = elements.songs.prevBtn;
    const nextBtn = elements.songs.nextBtn;
    
    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        this.navigateSlide(-1);
      });
    }
    
    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        this.navigateSlide(1);
      });
    }
  },
  
  navigateSlide(direction) {
    if (!this.currentSong) return;
    
    const slides = this.parseChordPro(this.currentSong.content);
    const newSlide = this.currentSlide + direction;
    
    if (newSlide >= 0 && newSlide < slides.length) {
      this.currentSlide = newSlide;
      this.displaySong();
    }
  },
  
  projectSong() {
    if (!this.currentSong) return;
    
    const slides = this.parseChordPro(this.currentSong.content);
    const songData = {
      song: this.currentSong,
      slide: this.currentSlide,
      slides: slides
    };
    
    socket.emit('canto', songData);
  },
  
  clearSongs() {
    this.songs = [];
    this.currentSong = null;
    this.currentSlide = 0;
    this.renderSongs();
    this.displaySong();
    this.saveSongs();
  }
};

// ====== LOWER THIRD MANAGEMENT ======
const LowerThirdManager = {
  name: '',
  description: '',
  color: '#3b82f6',
  
  init() {
    this.loadSettings();
    this.setupEventListeners();
    this.updatePreview();
  },
  
  loadSettings() {
    try {
      const settings = localStorage.getItem('dxpr-lower-third');
      if (settings) {
        const data = JSON.parse(settings);
        this.name = data.name || '';
        this.description = data.description || '';
        this.color = data.color || '#3b82f6';
      }
    } catch (error) {
      console.error('Error loading lower third settings:', error);
    }
  },
  
  saveSettings() {
    try {
      const settings = {
        name: this.name,
        description: this.description,
        color: this.color
      };
      localStorage.setItem('dxpr-lower-third', JSON.stringify(settings));
    } catch (error) {
      console.error('Error saving lower third settings:', error);
    }
  },
  
  setupEventListeners() {
    const nameInput = elements.lowerThird.name;
    const descInput = elements.lowerThird.description;
    const colorInput = elements.lowerThird.color;
    const projectBtn = elements.lowerThird.projectBtn;
    
    if (nameInput) {
      nameInput.addEventListener('input', (e) => {
        this.name = e.target.value;
        this.updatePreview();
      });
    }
    
    if (descInput) {
      descInput.addEventListener('input', (e) => {
        this.description = e.target.value;
        this.updatePreview();
      });
    }
    
    if (colorInput) {
      colorInput.addEventListener('change', (e) => {
        this.color = e.target.value;
        this.updatePreview();
      });
    }
    
    if (projectBtn) {
      projectBtn.addEventListener('click', () => {
        this.projectLowerThird();
      });
    }
  },
  
  updatePreview() {
    const previewName = elements.lowerThird.previewName;
    const previewDesc = elements.lowerThird.previewDesc;
    const preview = elements.lowerThird.preview;
    
    if (previewName) {
      previewName.textContent = this.name || 'Nome';
    }
    
    if (previewDesc) {
      previewDesc.textContent = this.description || 'Descrizione';
    }
    
    if (preview) {
      preview.style.backgroundColor = this.color;
    }
    
    // Update project button
    const projectBtn = elements.lowerThird.projectBtn;
    if (projectBtn) {
      const btnText = this.name || 'Proietta';
      projectBtn.innerHTML = `
        <span class="material-symbols-rounded">visibility</span>
        <span class="btn-text">${btnText}</span>
      `;
    }
  },
  
  projectLowerThird() {
    if (!this.name.trim()) {
      Utils.toast('Inserisci un nome per il lower-third', 'error');
      return;
    }
    
    const lowerThirdData = {
      name: this.name,
      description: this.description,
      color: this.color
    };
    
    socket.emit('lower_third', lowerThirdData);
    this.saveSettings();
  }
};

// ====== SETTINGS MANAGEMENT ======
const SettingsManager = {
  init() {
    this.loadSettings();
    this.setupEventListeners();
  },
  
  loadSettings() {
    Utils.loadSettings();
    
    // Load form values
    const obsHost = elements.settings.obsHost;
    const obsPort = elements.settings.obsPort;
    const obsPassword = elements.settings.obsPassword;
    const darkMode = elements.settings.darkMode;
    const accentColor = elements.settings.accentColor;
    const primaryBible = elements.settings.primaryBible;
    const secondaryBible = elements.settings.secondaryBible;
    const showSecondary = elements.settings.showSecondary;
    
    if (obsHost) obsHost.value = AppState.settings.obs.host;
    if (obsPort) obsPort.value = AppState.settings.obs.port;
    if (obsPassword) obsPassword.value = AppState.settings.obs.password;
    if (darkMode) darkMode.checked = AppState.darkMode;
    if (accentColor) accentColor.value = AppState.accentColor;
    if (primaryBible) primaryBible.value = AppState.settings.bibles.primary;
    if (secondaryBible) secondaryBible.value = AppState.settings.bibles.secondary;
    if (showSecondary) showSecondary.checked = AppState.settings.bibles.showSecondary;
  },
  
  saveSettings() {
    // Save form values
    const obsHost = elements.settings.obsHost;
    const obsPort = elements.settings.obsPort;
    const obsPassword = elements.settings.obsPassword;
    const darkMode = elements.settings.darkMode;
    const accentColor = elements.settings.accentColor;
    const primaryBible = elements.settings.primaryBible;
    const secondaryBible = elements.settings.secondaryBible;
    const showSecondary = elements.settings.showSecondary;
    
    if (obsHost) AppState.settings.obs.host = obsHost.value;
    if (obsPort) AppState.settings.obs.port = parseInt(obsPort.value) || 4455;
    if (obsPassword) AppState.settings.obs.password = obsPassword.value;
    if (darkMode) AppState.darkMode = darkMode.checked;
    if (accentColor) AppState.accentColor = accentColor.value;
    if (primaryBible) AppState.settings.bibles.primary = primaryBible.value;
    if (secondaryBible) AppState.settings.bibles.secondary = secondaryBible.value;
    if (showSecondary) AppState.settings.bibles.showSecondary = showSecondary.checked;
    
    Utils.saveSettings();
  },
  
  setupEventListeners() {
    // Tab switching
    const tabs = elements.settings.tabs;
    const panels = elements.settings.panels;
    
    tabs.forEach(tab => {
      if (tab) {
        tab.addEventListener('click', () => {
          const targetTab = tab.dataset.tab;
          
          // Update active tab
          tabs.forEach(t => t.classList.remove('active'));
          tab.classList.add('active');
          
          // Update active panel
          panels.forEach(panel => {
            if (panel) {
              panel.classList.remove('active');
              if (panel.id === `${targetTab}-tab`) {
                panel.classList.add('active');
              }
            }
          });
        });
      }
    });
    
    // Dark mode toggle
    const darkMode = elements.settings.darkMode;
    if (darkMode) {
      darkMode.addEventListener('change', () => {
        Utils.setTheme(darkMode.checked ? 'dark' : 'light');
      });
    }
    
    // Accent color
    const accentColor = elements.settings.accentColor;
    if (accentColor) {
      accentColor.addEventListener('change', () => {
        Utils.setAccentColor(accentColor.value);
      });
    }
    
    // OBS connection
    const obsConnect = elements.settings.obsConnect;
    const obsDisconnect = elements.settings.obsDisconnect;
    
    if (obsConnect) {
      obsConnect.addEventListener('click', () => {
        OBSManager.connect();
      });
    }
    
    if (obsDisconnect) {
      obsDisconnect.addEventListener('click', () => {
        OBSManager.disconnect();
      });
    }
  }
};

// ====== OBS MANAGEMENT ======
const OBSManager = {
  connected: false,
  
  init() {
    this.updateStatus();
  },
  
  async connect() {
    try {
      const host = elements.settings.obsHost?.value || 'localhost';
      const port = elements.settings.obsPort?.value || 4455;
      const password = elements.settings.obsPassword?.value || '';
      
      socket.emit('obs_connect', { host, port, password });
      Utils.toast('Connessione a OBS in corso...', 'info');
    } catch (error) {
      console.error('Error connecting to OBS:', error);
      Utils.toast('Errore di connessione a OBS', 'error');
    }
  },
  
  disconnect() {
    socket.emit('obs_disconnect');
    Utils.toast('Disconnesso da OBS', 'info');
  },
  
  toggleStream() {
    if (!this.connected) {
      Utils.toast('Non connesso a OBS', 'error');
      return;
    }
    
    if (AppState.streaming) {
      socket.emit('obs_stop_stream');
    } else {
      socket.emit('obs_start_stream');
    }
  },
  
  updateStatus() {
    const statusEl = elements.header.obsStatus;
    const streamBtn = elements.header.streamBtn;
    
    if (statusEl) {
      const icon = statusEl.querySelector('.status-icon');
      const text = statusEl.querySelector('.status-text');
      
      if (this.connected) {
        if (icon) icon.textContent = 'wifi';
        if (text) text.textContent = 'Connesso';
        statusEl.classList.remove('offline');
        statusEl.classList.add('online');
      } else {
        if (icon) icon.textContent = 'wifi_off';
        if (text) text.textContent = 'Offline';
        statusEl.classList.remove('online');
        statusEl.classList.add('offline');
      }
    }
    
    if (streamBtn) {
      streamBtn.disabled = !this.connected;
      if (AppState.streaming) {
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
  }
};

// ====== SOCKET.IO EVENT HANDLERS ======
socket.on('connect', () => {
  console.log('Connected to server');
});

socket.on('disconnect', () => {
  console.log('Disconnected from server');
});

socket.on('obs_connected', () => {
  OBSManager.connected = true;
  AppState.obsConnected = true;
  OBSManager.updateStatus();
  Utils.toast('Connesso a OBS Studio', 'success');
});

socket.on('obs_disconnected', () => {
  OBSManager.connected = false;
  AppState.obsConnected = false;
  AppState.streaming = false;
  OBSManager.updateStatus();
  Utils.toast('Disconnesso da OBS Studio', 'info');
});

socket.on('obs_stream_started', () => {
  AppState.streaming = true;
  OBSManager.updateStatus();
  Utils.toast('Stream iniziato', 'success');
});

socket.on('obs_stream_stopped', () => {
  AppState.streaming = false;
  OBSManager.updateStatus();
  Utils.toast('Stream terminato', 'info');
});

socket.on('obs_scenes', (scenes) => {
  AppState.scenes = scenes;
  // Render scenes in header
  const scenesGrid = elements.header.scenesGrid;
  if (scenesGrid) {
    scenesGrid.innerHTML = '';
    scenes.forEach(scene => {
      const btn = document.createElement('button');
      btn.className = 'scene-btn';
      btn.textContent = scene.name;
      btn.addEventListener('click', () => {
        socket.emit('obs_set_scene', { scene: scene.name });
      });
      scenesGrid.appendChild(btn);
    });
  }
});

socket.on('ui_estado', (state) => {
  // Sync UI state
  if (state.collapsed_bibbia !== undefined) {
    AppState.bibleCollapsed = state.collapsed_bibbia;
  }
  if (state.lower_third_open !== undefined) {
    AppState.lowerThirdOpen = state.lower_third_open;
  }
  if (state.display_hidden !== undefined) {
    AppState.displayHidden = state.display_hidden;
  }
});

socket.on('actualizar_historial', (history) => {
  AppState.history = history || [];
  BibleManager.renderHistory();
});

// ====== INITIALIZATION ======
// Function to wait for components to be loaded
function waitForComponents() {
  return new Promise((resolve) => {
    // Check if DXPRApp exists and components are loaded
    const checkComponents = () => {
      if (window.dxprApp && window.dxprApp.initialized) {
        console.log('Components are ready, initializing control.js');
        resolve();
      } else {
        // Check again in 100ms
        setTimeout(checkComponents, 100);
      }
    };
    checkComponents();
  });
}

// Initialize when DOM is ready and components are loaded
document.addEventListener('DOMContentLoaded', async () => {
  console.log('DOM loaded, waiting for components...');
  
  // Wait for components to be loaded
  await waitForComponents();
  
  // Initialize DOM elements
  initializeElements();
  
  // Load settings
  Utils.loadSettings();
  
  // Initialize all managers
  ViewManager.init();
  BibleManager.init();
  SongsManager.init();
  LowerThirdManager.init();
  SettingsManager.init();
  OBSManager.init();
  
  // Expose SongsManager to window for cross-component communication
  window.SongsManager = SongsManager;
  
  // Setup global event listeners
  setupGlobalEventListeners();
  
  // Request initial state
  socket.emit('ui_pedir_estado');
  
  console.log('DXPR initialized');
});

function initializeElements() {
  // Views
  elements.views = {
    bible: Utils.getElement('bible-view'),
    songs: Utils.getElement('songs-view'),
    lowerThird: Utils.getElement('lower-third-view'),
    settings: Utils.getElement('settings-view')
  };
  
  // Navigation
  elements.navButtons = Utils.querySelectorAll('.nav-btn');
  elements.viewControls = Utils.getElement('view-controls');
  elements.controlGroups = Utils.querySelectorAll('.control-group');
  
  // Header
  elements.header = {
    logo: Utils.querySelector('.header-logo'),
    obsPreview: Utils.getElement('obs-preview'),
    streamBtn: Utils.getElement('btn-stream'),
    obsStatus: Utils.getElement('obs-status'),
    scenesGrid: Utils.getElement('scenes-grid')
  };
  
  // Bible
  elements.bible = {
    search: Utils.getElement('bible-search'),
    suggestions: Utils.getElement('search-suggestions'),
    historyList: Utils.getElement('history-list'),
    clearHistory: Utils.getElement('clear-history'),
    booksColumn: Utils.getElement('books-column'),
    chaptersColumn: Utils.getElement('chapters-column'),
    versesColumn: Utils.getElement('verses-column'),
    previewReference: Utils.getElement('preview-reference'),
    previewContent: Utils.getElement('preview-content'),
    prevBtn: Utils.getElement('btn-prev'),
    nextBtn: Utils.getElement('btn-next'),
    projectBtn: Utils.getElement('btn-project')
  };
  
  // Songs
  elements.songs = {
    list: Utils.getElement('songs-list'),
    addSong: Utils.getElement('add-song'),
    clearSongs: Utils.getElement('clear-songs'),
    songTitle: Utils.getElement('song-title'),
    songContent: Utils.getElement('song-content'),
    prevBtn: Utils.getElement('btn-prev-song'),
    nextBtn: Utils.getElement('btn-next-song'),
    projectBtn: Utils.getElement('btn-project-song')
  };
  
  // Lower Third
  elements.lowerThird = {
    name: Utils.getElement('lt-name'),
    description: Utils.getElement('lt-description'),
    color: Utils.getElement('lt-color'),
    preview: Utils.getElement('lt-preview'),
    previewName: Utils.getElement('preview-name'),
    previewDesc: Utils.getElement('preview-desc'),
    projectBtn: Utils.getElement('btn-project-lt')
  };
  
  // Settings
  elements.settings = {
    tabs: Utils.querySelectorAll('.tab-btn'),
    panels: Utils.querySelectorAll('.tab-panel'),
    darkMode: Utils.getElement('dark-mode'),
    accentColor: Utils.getElement('accent-color'),
    obsHost: Utils.getElement('obs-host'),
    obsPort: Utils.getElement('obs-port'),
    obsPassword: Utils.getElement('obs-password'),
    obsConnect: Utils.getElement('obs-connect'),
    obsDisconnect: Utils.getElement('obs-disconnect'),
    connectionStatus: Utils.getElement('connection-status'),
    primaryBible: Utils.getElement('primary-bible'),
    secondaryBible: Utils.getElement('secondary-bible'),
    showSecondary: Utils.getElement('show-secondary'),
    loadBibles: Utils.getElement('load-bibles'),
    loadSongFile: Utils.getElement('load-song-file'),
    newSong: Utils.getElement('new-song'),
    songsLibrary: Utils.getElement('songs-library')
  };
  
  // Modals
  elements.modals = {
    confirm: Utils.getElement('confirm-modal'),
    addSong: Utils.getElement('add-song-modal'),
    editSong: Utils.getElement('edit-song-modal'),
    songStructure: Utils.getElement('song-structure-modal')
  };
}

function setupGlobalEventListeners() {
  // Stream button
  const streamBtn = elements.header.streamBtn;
  if (streamBtn) {
    streamBtn.addEventListener('click', () => {
      OBSManager.toggleStream();
    });
  }
  
  // Modal close buttons
  document.querySelectorAll('.modal .btn-icon').forEach(btn => {
    if (btn.textContent.includes('close')) {
      btn.addEventListener('click', () => {
        const modal = btn.closest('.modal');
        if (modal) {
          modal.classList.remove('show');
        }
      });
    }
  });
  
  // Close modals on backdrop click
  document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.remove('show');
      }
    });
  });
  
  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    // ESC to close modals
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal.show').forEach(modal => {
        modal.classList.remove('show');
      });
    }
    
    // Ctrl/Cmd + K for search
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      if (AppState.currentView === 'bible') {
        const searchInput = elements.bible.search;
        if (searchInput) {
          searchInput.focus();
        }
      }
    }
  });
  
  // Save settings on beforeunload
  window.addEventListener('beforeunload', () => {
    SettingsManager.saveSettings();
    LowerThirdManager.saveSettings();
    SongsManager.saveSongs();
  });
}

// ====== UTILITY FUNCTIONS FOR EXTERNAL USE ======
function copyLink(path) {
  const url = `${window.location.origin}${path}`;
  navigator.clipboard.writeText(url).then(() => {
    Utils.toast('Link copiato al portapapeles', 'success');
  }).catch(() => {
    Utils.toast('Errore nel copiare il link', 'error');
  });
}

function openLink(path) {
  const url = `${window.location.origin}${path}`;
  window.open(url, '_blank');
}