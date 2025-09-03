// ====== BIBLE COMPONENT ======

class BibleComponent {
  constructor() {
    this.elements = {};
    this.state = {
      currentBook: null,
      currentChapter: null,
      currentVerse: null,
      books: [],
      chapters: [],
      verses: [],
      history: [],
      primaryBible: 'RV60',
      secondaryBible: '',
      showSecondaryBible: false
    };
    
    this.callbacks = {
      onVerseSelect: null,
      onHistoryUpdate: null
    };
    
    this.socket = window.socket || io();
    
    // Initialize after DOM is ready
    this.init();
  }
  
  async init() {
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
      search: document.getElementById('bible-search'),
      suggestions: document.getElementById('search-suggestions'),
      historyList: document.getElementById('history-list'),
      clearHistory: document.getElementById('clear-history'),
      booksColumn: document.getElementById('books-column'),
      chaptersColumn: document.getElementById('chapters-column'),
      versesColumn: document.getElementById('verses-column'),
      previewReference: document.getElementById('preview-reference'),
      previewContent: document.getElementById('preview-content')
    };
    
    this.setupEventListeners();
    this.loadBibleSettings();
    this.loadBooks();
    this.loadHistory();
  }
  
  setupEventListeners() {
    // Clear history button
    if (this.elements.clearHistory) {
      this.elements.clearHistory.addEventListener('click', () => {
        this.clearHistory();
      });
    }
    
    // Search functionality
    if (this.elements.search) {
      this.elements.search.addEventListener('input', (e) => {
        this.handleSearch(e.target.value);
      });
      
      this.elements.search.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          this.handleSearchEnter(e.target.value);
        }
      });
      
      // Close suggestions when clicking outside
      document.addEventListener('click', (e) => {
        if (!this.elements.search.contains(e.target) && !this.elements.suggestions.contains(e.target)) {
          this.hideSearchSuggestions();
        }
      });
    }
  }
  
  async loadBooks() {
    try {
      const response = await fetch('/api/libros');
      if (response.ok) {
        this.state.books = await response.json();
        this.renderBooks();
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      console.error('Error loading books:', error);
      // Fallback to mock data when API is not available
      this.loadMockBooks();
    }
  }

  loadMockBooks() {
    // Mock data for Bible books when API is not available
    this.state.books = [
      { numero: 1, nombre: 'Génesis', abreviatura: 'Gn' },
      { numero: 2, nombre: 'Éxodo', abreviatura: 'Ex' },
      { numero: 3, nombre: 'Levítico', abreviatura: 'Lv' },
      { numero: 4, nombre: 'Números', abreviatura: 'Nm' },
      { numero: 5, nombre: 'Deuteronomio', abreviatura: 'Dt' },
      { numero: 6, nombre: 'Josué', abreviatura: 'Jos' },
      { numero: 7, nombre: 'Jueces', abreviatura: 'Jue' },
      { numero: 8, nombre: 'Rut', abreviatura: 'Rt' },
      { numero: 9, nombre: '1 Samuel', abreviatura: '1S' },
      { numero: 10, nombre: '2 Samuel', abreviatura: '2S' },
      { numero: 11, nombre: '1 Reyes', abreviatura: '1R' },
      { numero: 12, nombre: '2 Reyes', abreviatura: '2R' },
      { numero: 13, nombre: '1 Crónicas', abreviatura: '1Cr' },
      { numero: 14, nombre: '2 Crónicas', abreviatura: '2Cr' },
      { numero: 15, nombre: 'Esdras', abreviatura: 'Esd' },
      { numero: 16, nombre: 'Nehemías', abreviatura: 'Neh' },
      { numero: 17, nombre: 'Ester', abreviatura: 'Est' },
      { numero: 18, nombre: 'Job', abreviatura: 'Job' },
      { numero: 19, nombre: 'Salmos', abreviatura: 'Sal' },
      { numero: 20, nombre: 'Proverbios', abreviatura: 'Pr' },
      { numero: 21, nombre: 'Eclesiastés', abreviatura: 'Ec' },
      { numero: 22, nombre: 'Cantares', abreviatura: 'Cnt' },
      { numero: 23, nombre: 'Isaías', abreviatura: 'Is' },
      { numero: 24, nombre: 'Jeremías', abreviatura: 'Jer' },
      { numero: 25, nombre: 'Lamentaciones', abreviatura: 'Lm' },
      { numero: 26, nombre: 'Ezequiel', abreviatura: 'Ez' },
      { numero: 27, nombre: 'Daniel', abreviatura: 'Dn' },
      { numero: 28, nombre: 'Oseas', abreviatura: 'Os' },
      { numero: 29, nombre: 'Joel', abreviatura: 'Jl' },
      { numero: 30, nombre: 'Amós', abreviatura: 'Am' },
      { numero: 31, nombre: 'Abdías', abreviatura: 'Abd' },
      { numero: 32, nombre: 'Jonás', abreviatura: 'Jon' },
      { numero: 33, nombre: 'Miqueas', abreviatura: 'Miq' },
      { numero: 34, nombre: 'Nahúm', abreviatura: 'Nah' },
      { numero: 35, nombre: 'Habacuc', abreviatura: 'Hab' },
      { numero: 36, nombre: 'Sofonías', abreviatura: 'Sof' },
      { numero: 37, nombre: 'Hageo', abreviatura: 'Hag' },
      { numero: 38, nombre: 'Zacarías', abreviatura: 'Zac' },
      { numero: 39, nombre: 'Malaquías', abreviatura: 'Mal' },
      { numero: 40, nombre: 'Mateo', abreviatura: 'Mt' },
      { numero: 41, nombre: 'Marcos', abreviatura: 'Mc' },
      { numero: 42, nombre: 'Lucas', abreviatura: 'Lc' },
      { numero: 43, nombre: 'Juan', abreviatura: 'Jn' },
      { numero: 44, nombre: 'Hechos', abreviatura: 'Hch' },
      { numero: 45, nombre: 'Romanos', abreviatura: 'Ro' },
      { numero: 46, nombre: '1 Corintios', abreviatura: '1Co' },
      { numero: 47, nombre: '2 Corintios', abreviatura: '2Co' },
      { numero: 48, nombre: 'Gálatas', abreviatura: 'Gá' },
      { numero: 49, nombre: 'Efesios', abreviatura: 'Ef' },
      { numero: 50, nombre: 'Filipenses', abreviatura: 'Fil' },
      { numero: 51, nombre: 'Colosenses', abreviatura: 'Col' },
      { numero: 52, nombre: '1 Tesalonicenses', abreviatura: '1Ts' },
      { numero: 53, nombre: '2 Tesalonicenses', abreviatura: '2Ts' },
      { numero: 54, nombre: '1 Timoteo', abreviatura: '1Ti' },
      { numero: 55, nombre: '2 Timoteo', abreviatura: '2Ti' },
      { numero: 56, nombre: 'Tito', abreviatura: 'Tit' },
      { numero: 57, nombre: 'Filemón', abreviatura: 'Flm' },
      { numero: 58, nombre: 'Hebreos', abreviatura: 'He' },
      { numero: 59, nombre: 'Santiago', abreviatura: 'Stg' },
      { numero: 60, nombre: '1 Pedro', abreviatura: '1P' },
      { numero: 61, nombre: '2 Pedro', abreviatura: '2P' },
      { numero: 62, nombre: '1 Juan', abreviatura: '1Jn' },
      { numero: 63, nombre: '2 Juan', abreviatura: '2Jn' },
      { numero: 64, nombre: '3 Juan', abreviatura: '3Jn' },
      { numero: 65, nombre: 'Judas', abreviatura: 'Jud' },
      { numero: 66, nombre: 'Apocalipsis', abreviatura: 'Ap' }
    ];
    this.renderBooks();
    this.showToast('Modo offline: usando datos locales', 'info');
  }
  
  async loadChapters(bookNumber) {
    try {
      const response = await fetch(`/api/capitulos/${bookNumber}`);
      if (response.ok) {
        this.state.chapters = await response.json();
        this.renderChapters();
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      console.error('Error loading chapters:', error);
      // Fallback to mock data when API is not available
      this.loadMockChapters(bookNumber);
    }
  }

  loadMockChapters(bookNumber) {
    // Mock data for chapters - simplified version with common chapter counts
    const chapterCounts = {
      1: 50, 2: 40, 3: 27, 4: 36, 5: 34, 6: 24, 7: 21, 8: 4, 9: 31, 10: 24,
      11: 22, 12: 25, 13: 29, 14: 36, 15: 10, 16: 13, 17: 10, 18: 42, 19: 150, 20: 31,
      21: 12, 22: 8, 23: 66, 24: 52, 25: 5, 26: 48, 27: 12, 28: 14, 29: 3, 30: 9,
      31: 1, 32: 4, 33: 7, 34: 3, 35: 3, 36: 3, 37: 2, 38: 14, 39: 4, 40: 28,
      41: 16, 42: 24, 43: 21, 44: 28, 45: 16, 46: 16, 47: 13, 48: 6, 49: 6, 50: 4,
      51: 4, 52: 5, 53: 3, 54: 6, 55: 4, 56: 3, 57: 1, 58: 13, 59: 5, 60: 5,
      61: 3, 62: 5, 63: 1, 64: 1, 65: 1, 66: 22
    };
    
    const chapterCount = chapterCounts[bookNumber] || 10;
    this.state.chapters = [];
    
    for (let i = 1; i <= chapterCount; i++) {
      this.state.chapters.push({ numero: i });
    }
    
    this.renderChapters();
    this.showToast('Modo offline: capítulos simulados', 'info');
  }
  
  async loadVerses(bookNumber, chapter) {
    try {
      const response = await fetch(`/api/versiculos/${bookNumber}/${chapter}`);
      if (response.ok) {
        this.state.verses = await response.json();
        this.renderVerses();
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      console.error('Error loading verses:', error);
      // Fallback to mock data when API is not available
      this.loadMockVerses(bookNumber, chapter);
    }
  }

  loadMockVerses(bookNumber, chapter) {
    // Mock data for verses - example verses for demonstration
    const mockVerses = [
      { numero: 1, texto: 'En el principio creó Dios los cielos y la tierra.' },
      { numero: 2, texto: 'Y la tierra estaba desordenada y vacía, y las tinieblas estaban sobre la faz del abismo, y el Espíritu de Dios se movía sobre la faz de las aguas.' },
      { numero: 3, texto: 'Y dijo Dios: Sea la luz; y fue la luz.' },
      { numero: 4, texto: 'Y vio Dios que la luz era buena; y separó Dios la luz de las tinieblas.' },
      { numero: 5, texto: 'Y llamó Dios a la luz Día, y a las tinieblas llamó Noche. Y fue la tarde y la mañana un día.' }
    ];
    
    // Generate more verses if needed
    const verseCount = Math.floor(Math.random() * 20) + 5; // 5-25 verses
    this.state.verses = [];
    
    for (let i = 1; i <= verseCount; i++) {
      if (i <= mockVerses.length) {
        this.state.verses.push(mockVerses[i - 1]);
      } else {
        this.state.verses.push({
          numero: i,
          texto: `Versículo de ejemplo ${i} del capítulo ${chapter}. Este es contenido simulado para modo offline.`
        });
      }
    }
    
    this.renderVerses();
    this.showToast('Modo offline: versículos simulados', 'info');
  }
  
  renderBooks() {
    const booksColumn = this.elements.booksColumn;
    if (!booksColumn) return;
    
    booksColumn.innerHTML = '';
    
    this.state.books.forEach(book => {
      const btn = document.createElement('button');
      btn.className = 'nav-btn';
      btn.textContent = this.getBookAbbreviation(book.name);
      btn.dataset.bookNumber = book.bnumber;
      btn.addEventListener('click', () => this.selectBook(book));
      booksColumn.appendChild(btn);
    });
  }
  
  renderChapters() {
    const chaptersColumn = this.elements.chaptersColumn;
    if (!chaptersColumn) return;
    
    chaptersColumn.innerHTML = '';
    
    this.state.chapters.forEach(chapter => {
      const btn = document.createElement('button');
      btn.className = 'nav-btn';
      btn.textContent = chapter;
      btn.dataset.chapter = chapter;
      btn.addEventListener('click', () => this.selectChapter(chapter));
      chaptersColumn.appendChild(btn);
    });
  }
  
  renderVerses() {
    const versesColumn = this.elements.versesColumn;
    if (!versesColumn) return;
    
    versesColumn.innerHTML = '';
    
    this.state.verses.forEach(verse => {
      const btn = document.createElement('button');
      btn.className = 'nav-btn';
      btn.textContent = verse;
      btn.dataset.verse = verse;
      btn.addEventListener('click', () => this.selectVerse(verse));
      versesColumn.appendChild(btn);
    });
  }
  
  getBookAbbreviation(name) {
    const abbreviations = {
      'Genesis': 'Gen', 'Exodus': 'Exo', 'Leviticus': 'Lev', 'Numbers': 'Num',
      'Deuteronomy': 'Deu', 'Joshua': 'Jos', 'Judges': 'Jdg', 'Ruth': 'Rut',
      '1 Samuel': '1Sa', '2 Samuel': '2Sa', '1 Kings': '1Ki', '2 Kings': '2Ki',
      '1 Chronicles': '1Ch', '2 Chronicles': '2Ch', 'Ezra': 'Ezr', 'Nehemiah': 'Neh',
      'Esther': 'Est', 'Job': 'Job', 'Psalms': 'Psa', 'Proverbs': 'Pro',
      'Ecclesiastes': 'Ecc', 'Song of Solomon': 'Sng', 'Isaiah': 'Isa', 'Jeremiah': 'Jer',
      'Lamentations': 'Lam', 'Ezekiel': 'Ezk', 'Daniel': 'Dan', 'Hosea': 'Hos',
      'Joel': 'Jol', 'Amos': 'Amo', 'Obadiah': 'Oba', 'Jonah': 'Jon',
      'Micah': 'Mic', 'Nahum': 'Nah', 'Habakkuk': 'Hab', 'Zephaniah': 'Zep',
      'Haggai': 'Hag', 'Zechariah': 'Zec', 'Malachi': 'Mal', 'Matthew': 'Mat',
      'Mark': 'Mrk', 'Luke': 'Luk', 'John': 'Jhn', 'Acts': 'Act',
      'Romans': 'Rom', '1 Corinthians': '1Co', '2 Corinthians': '2Co',
      'Galatians': 'Gal', 'Ephesians': 'Eph', 'Philippians': 'Php', 'Colossians': 'Col',
      '1 Thessalonians': '1Th', '2 Thessalonians': '2Th', '1 Timothy': '1Ti',
      '2 Timothy': '2Ti', 'Titus': 'Tit', 'Philemon': 'Phm', 'Hebrews': 'Heb',
      'James': 'Jas', '1 Peter': '1Pe', '2 Peter': '2Pe', '1 John': '1Jn',
      '2 John': '2Jn', '3 John': '3Jn', 'Jude': 'Jud', 'Revelation': 'Rev'
    };
    
    return abbreviations[name] || name.substring(0, 3);
  }
  
  selectBook(book) {
    this.state.currentBook = book;
    this.state.currentChapter = null;
    this.state.currentVerse = null;
    this.loadChapters(book.bnumber);
    this.clearPreview();
    
    // Update active state
    this.updateActiveStates();
  }
  
  selectChapter(chapter) {
    if (!this.state.currentBook) return;
    
    this.state.currentChapter = chapter;
    this.state.currentVerse = null;
    this.loadVerses(this.state.currentBook.bnumber, chapter);
    this.clearPreview();
    
    // Update active state
    this.updateActiveStates();
  }
  
  async selectVerse(verse) {
    if (!this.state.currentBook || !this.state.currentChapter) return;
    
    this.state.currentVerse = verse;
    await this.loadVerseContent();
    
    // Update active state
    this.updateActiveStates();
  }
  
  updateActiveStates() {
    // Update book buttons
    const bookButtons = this.elements.booksColumn?.querySelectorAll('.nav-btn');
    bookButtons?.forEach(btn => {
      btn.classList.remove('active');
      if (this.state.currentBook && btn.dataset.bookNumber === this.state.currentBook.bnumber) {
        btn.classList.add('active');
      }
    });
    
    // Update chapter buttons
    const chapterButtons = this.elements.chaptersColumn?.querySelectorAll('.nav-btn');
    chapterButtons?.forEach(btn => {
      btn.classList.remove('active');
      if (this.state.currentChapter && btn.dataset.chapter === this.state.currentChapter) {
        btn.classList.add('active');
      }
    });
    
    // Update verse buttons
    const verseButtons = this.elements.versesColumn?.querySelectorAll('.nav-btn');
    verseButtons?.forEach(btn => {
      btn.classList.remove('active');
      if (this.state.currentVerse && btn.dataset.verse === this.state.currentVerse) {
        btn.classList.add('active');
      }
    });
  }
  
  async loadVerseContent() {
    if (!this.state.currentBook || !this.state.currentChapter || !this.state.currentVerse) return;
    
    try {
      // Load primary bible with context
      const primaryResponse = await fetch(`/api/versiculo-contexto/${this.state.currentBook.bnumber}/${this.state.currentChapter}/${this.state.currentVerse}?bible=${this.state.primaryBible}&range=10`);
      const primaryData = await primaryResponse.json();
      
      let secondaryData = null;
      
      // Load secondary bible with context if enabled and different from primary
      if (this.state.showSecondaryBible && this.state.secondaryBible && 
          this.state.secondaryBible !== this.state.primaryBible) {
        try {
          const secondaryResponse = await fetch(`/api/versiculo-contexto/${this.state.currentBook.bnumber}/${this.state.currentChapter}/${this.state.currentVerse}?bible=${this.state.secondaryBible}&range=10`);
          secondaryData = await secondaryResponse.json();
        } catch (error) {
          console.warn('Failed to load secondary bible:', error);
        }
      }
      
      this.displayVerseWithContext(primaryData, secondaryData);
    } catch (error) {
      console.error('Error loading verse:', error);
    }
  }
  
  displayVerse(primaryData, secondaryData = null) {
    const previewReference = this.elements.previewReference;
    const previewContent = this.elements.previewContent;
    
    if (previewReference && this.state.currentBook) {
      previewReference.textContent = `${this.state.currentBook.name} ${this.state.currentChapter}:${this.state.currentVerse}`;
    }
    
    if (previewContent && primaryData) {
      const primaryText = primaryData.es || primaryData.it || primaryData.text || 'Versículo no encontrado';
      let content = `
        <div class="verse-content">
          <p class="verse-text">${primaryText}</p>
      `;
      
      // Add secondary bible text if available
      if (secondaryData && this.state.showSecondaryBible) {
        const secondaryText = secondaryData.es || secondaryData.it || secondaryData.text || '';
        if (secondaryText) {
          content += `<p class="verse-secondary">${secondaryText}</p>`;
        }
      }
      
      content += `</div>`;
      previewContent.innerHTML = content;
    }
    
    // Trigger callback
    if (this.callbacks.onVerseSelect && this.state.currentBook) {
      this.callbacks.onVerseSelect(`${this.state.currentBook.name} ${this.state.currentChapter}:${this.state.currentVerse}`);
    }
  }

  displayVerseWithContext(primaryData, secondaryData = null) {
    const previewReference = this.elements.previewReference;
    const previewContent = this.elements.previewContent;
    
    if (previewReference && primaryData) {
      const bookName = primaryData.book || (this.state.currentBook ? this.state.currentBook.name : 'Libro');
      const chapter = primaryData.chapter || this.state.currentChapter || '1';
      const verse = primaryData.selected_verse || this.state.currentVerse || '1';
      previewReference.textContent = `${bookName} ${chapter}:${verse}`;
    }
    
    if (previewContent && primaryData && primaryData.verses) {
      let content = '<div class="verse-context">';
      
      primaryData.verses.forEach(verse => {
        const isSelected = verse.is_selected;
        const verseClass = isSelected ? 'preview-verse active' : 'preview-verse';
        const verseText = verse.text || verse.es || verse.it || 'Texto no disponible';
        const verseNumber = verse.verse || '1';
        const bookNumber = this.state.currentBook ? this.state.currentBook.bnumber : '1';
        const chapterNumber = primaryData.chapter || this.state.currentChapter || '1';
        
        content += `
          <div class="${verseClass}" data-verse="${verseNumber}" data-book="${bookNumber}" data-chapter="${chapterNumber}">
            <span class="verse-number">${verseNumber}.</span>
            <span class="verse-text">${verseText}</span>
        `;
        
        // Add secondary bible text if available
        if (secondaryData && this.state.showSecondaryBible && secondaryData.verses) {
          const secondaryVerse = secondaryData.verses.find(v => v.verse === verse.verse);
          if (secondaryVerse) {
            const secondaryText = secondaryVerse.text || secondaryVerse.es || secondaryVerse.it || '';
            if (secondaryText) {
              content += `<span class="verse-secondary">${secondaryText}</span>`;
            }
          }
        }
        
        content += '</div>';
      });
      
      content += '</div>';
      previewContent.innerHTML = content;
      
      // Add click listeners to verses
      this.setupVerseClickListeners();
    }
    
    // Trigger callback
    if (this.callbacks.onVerseSelect && primaryData) {
      const bookName = primaryData.book || (this.state.currentBook ? this.state.currentBook.name : 'Libro');
      const chapter = primaryData.chapter || this.state.currentChapter || '1';
      const verse = primaryData.selected_verse || this.state.currentVerse || '1';
      this.callbacks.onVerseSelect(`${bookName} ${chapter}:${verse}`);
    }
  }

  setupVerseClickListeners() {
    const verseElements = this.elements.previewContent.querySelectorAll('.preview-verse');
    verseElements.forEach(element => {
      element.addEventListener('click', () => {
        const verse = element.dataset.verse;
        const book = element.dataset.book;
        const chapter = element.dataset.chapter;
        
        // Update current verse and reload content
        this.state.currentVerse = verse;
        this.loadVerseContent();
        
        // Update active states in verse column
        this.updateActiveStates();
        
        // Project the clicked verse
        this.projectVerse();
      });
    });
  }

  projectVerse() {
    if (!this.state.currentBook || !this.state.currentChapter || !this.state.currentVerse) return;
    
    // Get the verse text from the preview
    const activeVerse = this.elements.previewContent.querySelector('.preview-verse.active');
    if (activeVerse) {
      const verseText = activeVerse.querySelector('.verse-text').textContent;
      const reference = `${this.state.currentBook.name} ${this.state.currentChapter}:${this.state.currentVerse}`;
      
      // Send to projection via socket
      if (window.socket) {
        window.socket.emit('ui_set_bibbia', {
          reference: reference,
          text: verseText
        });
      }
      
      // Show toast notification
      if (window.showToast) {
        window.showToast(`Proyectando: ${reference}`);
      }
    }
  }
  
  clearPreview() {
    const previewReference = this.elements.previewReference;
    const previewContent = this.elements.previewContent;
    
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
  }
  
  renderHistory() {
    const historyList = this.elements.historyList;
    if (!historyList) return;
    
    if (this.state.history.length === 0) {
      historyList.innerHTML = `
        <div class="empty-state">
          <span class="material-symbols-rounded">history</span>
          <p>Nessuna cronologia</p>
        </div>
      `;
      return;
    }
    
    historyList.innerHTML = '';
    this.state.history.forEach(item => {
      const historyItem = document.createElement('div');
      historyItem.className = 'history-item';
      historyItem.textContent = `${item.book} ${item.chapter}:${item.verse}`;
      historyItem.addEventListener('click', () => {
        this.loadHistoryVerse(item);
      });
      historyList.appendChild(historyItem);
    });
  }
  
  async loadHistoryVerse(item) {
    // Find book by name
    const book = this.state.books.find(b => b.name === item.book);
    if (!book) return;
    
    this.state.currentBook = book;
    this.state.currentChapter = item.chapter;
    this.state.currentVerse = item.verse;
    
    await this.loadChapters(book.bnumber);
    await this.loadVerses(book.bnumber, item.chapter);
    await this.loadVerseContent();
    
    // Update active state
    this.updateActiveStates();
  }
  
  loadHistory() {
    try {
      const history = localStorage.getItem('dxpr-bible-history');
      if (history) {
        this.state.history = JSON.parse(history);
        this.renderHistory();
      }
    } catch (error) {
      console.error('Error loading history:', error);
    }
  }
  
  saveHistory() {
    try {
      localStorage.setItem('dxpr-bible-history', JSON.stringify(this.state.history));
    } catch (error) {
      console.error('Error saving history:', error);
    }
  }
  
  addToHistory(book, chapter, verse) {
    const historyItem = { book, chapter, verse };
    
    // Remove if already exists
    this.state.history = this.state.history.filter(item => 
      !(item.book === book && item.chapter === chapter && item.verse === verse)
    );
    
    // Add to beginning
    this.state.history.unshift(historyItem);
    
    // Keep only last 20 items
    if (this.state.history.length > 20) {
      this.state.history = this.state.history.slice(0, 20);
    }
    
    this.renderHistory();
    this.saveHistory();
    
    // Trigger callback
    if (this.callbacks.onHistoryUpdate) {
      this.callbacks.onHistoryUpdate(this.state.history);
    }
  }
  
  clearHistory() {
    this.state.history = [];
    this.renderHistory();
    this.saveHistory();
    
    if (this.callbacks.onHistoryUpdate) {
      this.callbacks.onHistoryUpdate(this.state.history);
    }
  }
  
  handleSearch(query) {
    if (query.length < 2) {
      this.hideSearchSuggestions();
      return;
    }
    
    // Search in books
    const matches = this.state.books.filter(book => 
      book.name.toLowerCase().includes(query.toLowerCase())
    ).slice(0, 6);
    
    this.renderSearchSuggestions(matches);
  }
  
  handleSearchEnter(query) {
    if (!query) return;
    
    // Try to parse as reference
    const match = query.match(/^(.+?)\s+(\d+):(\d+)$/);
    if (match) {
      const [, bookName, chapter, verse] = match;
      const book = this.state.books.find(b => b.name === bookName);
      if (book) {
        this.selectBook(book);
        setTimeout(() => {
          this.selectChapter(chapter);
          setTimeout(() => {
            this.selectVerse(verse);
          }, 100);
        }, 100);
      }
    }
    
    this.hideSearchSuggestions();
  }
  
  renderSearchSuggestions(matches) {
    const suggestions = this.elements.suggestions;
    if (!suggestions) return;
    
    suggestions.innerHTML = '';
    
    if (matches.length === 0) {
      suggestions.classList.remove('show');
      return;
    }
    
    matches.forEach(book => {
      const item = document.createElement('div');
      item.className = 'search-suggestion';
      item.textContent = book.name;
      
      item.addEventListener('click', () => {
        this.selectBook(book);
        if (this.elements.search) {
          this.elements.search.value = '';
        }
        this.hideSearchSuggestions();
      });
      
      suggestions.appendChild(item);
    });
    
    suggestions.classList.add('show');
  }
  
  hideSearchSuggestions() {
    const suggestions = this.elements.suggestions;
    if (suggestions) {
      suggestions.classList.remove('show');
    }
  }
  
  navigateVerse(direction) {
    if (!this.state.currentBook || !this.state.currentChapter || !this.state.currentVerse) return;
    
    const currentIndex = this.state.verses.indexOf(parseInt(this.state.currentVerse));
    if (currentIndex === -1) return;
    
    const newIndex = currentIndex + direction;
    if (newIndex >= 0 && newIndex < this.state.verses.length) {
      this.selectVerse(this.state.verses[newIndex]);
    }
  }
  
  projectVerse() {
    if (!this.state.currentBook || !this.state.currentChapter || !this.state.currentVerse) {
      this.showToast('Selecciona un versículo primero', 'warning');
      return;
    }
    
    const verseData = {
      book: this.state.currentBook.name,
      chapter: this.state.currentChapter,
      verse: this.state.currentVerse,
      text: this.elements.previewContent?.querySelector('.verse-text')?.textContent || ''
    };
    
    // Emit to server
    if (this.socket) {
      this.socket.emit('versiculo', verseData);
    }
    
    this.addToHistory(this.state.currentBook.name, this.state.currentChapter, this.state.currentVerse);
    this.showToast('Versículo proyectado', 'success');
  }
  
  setCallbacks(callbacks) {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }
  
  loadBibleSettings() {
    // Load bible settings from SettingsComponent if available
    if (window.settingsComponent) {
      const settings = window.settingsComponent.getSettings();
      this.state.primaryBible = settings.primaryBible || 'RV60';
      this.state.secondaryBible = settings.secondaryBible || '';
      this.state.showSecondaryBible = settings.showSecondaryBible || false;
    }
  }
  
  updateBibleSettings(settings) {
    // Update bible settings when changed from settings component
    this.state.primaryBible = settings.primaryBible || 'RV60';
    this.state.secondaryBible = settings.secondaryBible || '';
    this.state.showSecondaryBible = settings.showSecondaryBible || false;
    
    // Reload current verse if one is selected
    if (this.state.currentBook && this.state.currentChapter && this.state.currentVerse) {
      this.loadVerseContent();
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
window.BibleComponent = BibleComponent;
