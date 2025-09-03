// ========== SONGS COMPONENT ==========

class SongsComponent {
    constructor() {
        this.songs = [];
        this.currentSong = null;
        this.currentSlide = 0;
        this.isEditing = false;
        this.isPreviewMode = true;
        this.socket = io();
        
        // Slide labels configuration (similar to WorshipTools)
        this.slideLabels = {
            verse1: { name: 'Verse 1', color: '#4CAF50', shortcut: '1' },
            verse2: { name: 'Verse 2', color: '#4CAF50', shortcut: '2' },
            verse3: { name: 'Verse 3', color: '#4CAF50', shortcut: '3' },
            verse4: { name: 'Verse 4', color: '#4CAF50', shortcut: '4' },
            chorus: { name: 'Chorus', color: '#2196F3', shortcut: 'C' },
            bridge: { name: 'Bridge', color: '#FF9800', shortcut: 'B' },
            intro: { name: 'Intro', color: '#9C27B0', shortcut: 'I' },
            outro: { name: 'Outro', color: '#795548', shortcut: 'O' },
            instrumental: { name: 'Instrumental', color: '#607D8B', shortcut: 'M' }
        };
        
        // Slide templates configuration
        this.slideTemplates = {
            classic: {
                name: 'Classic',
                description: 'Traditional chord-over-lyrics format',
                className: 'slide-template-classic'
            },
            compact: {
                name: 'Compact',
                description: 'Inline chords with lyrics',
                className: 'slide-template-compact'
            },
            large: {
                name: 'Large Text',
                description: 'Large fonts for projection',
                className: 'slide-template-large'
            },
            minimal: {
                name: 'Lyrics Only',
                description: 'Hide chords, show only lyrics',
                className: 'slide-template-minimal'
            }
        };
        
        this.currentTemplate = 'classic';
        this.templateSelectorVisible = false;
        
        this.init();
    }
    
    init() {
        this.loadSongs();
        this.setupEventListeners();
        this.setupTemplateEvents();
        this.renderSongList();
    }
    
    // ========== SONG MANAGEMENT ==========
    
    loadSongs() {
        // Try to load from both possible localStorage keys for compatibility
        let savedSongs = localStorage.getItem('dxpr_songs') || localStorage.getItem('dxpr-songs');
        if (savedSongs) {
            this.songs = JSON.parse(savedSongs);
        } else {
            // Initialize with empty songs array
            this.songs = [];
        }
    }
    
    saveSongs() {
        // Save to both localStorage keys for compatibility with control.js SongsManager
        localStorage.setItem('dxpr_songs', JSON.stringify(this.songs));
        localStorage.setItem('dxpr-songs', JSON.stringify(this.songs));
        
        // Notify control.js SongsManager if it exists
        if (window.SongsManager && typeof window.SongsManager.loadSongs === 'function') {
            window.SongsManager.loadSongs();
        }
    }
    
    addSong(songData) {
        const newSong = {
            id: Date.now(),
            title: songData.title,
            artist: songData.artist || '',
            key: songData.key || '',
            tempo: songData.tempo || 120,
            chordpro: songData.chordpro || '',
            content: songData.chordpro || '', // Add content field for compatibility with control.js
            createdAt: new Date().toISOString()
        };
        
        this.songs.push(newSong);
        this.saveSongs();
        this.renderSongList();
        return newSong;
    }
    
    updateSong(songId, songData) {
        const songIndex = this.songs.findIndex(song => song.id === songId);
        if (songIndex !== -1) {
            this.songs[songIndex] = { ...this.songs[songIndex], ...songData };
            this.saveSongs();
            this.renderSongList();
            if (this.currentSong && this.currentSong.id === songId) {
                this.loadSong(this.songs[songIndex]);
            }
        }
    }
    
    deleteSong(songId) {
        this.songs = this.songs.filter(song => song.id !== songId);
        this.saveSongs();
        this.renderSongList();
        
        if (this.currentSong && this.currentSong.id === songId) {
            this.clearCurrentSong();
        }
    }
    
    // ========== CHORDPRO PARSING ==========
    
    parseChordPro(chordproText) {
        const lines = chordproText.split('\n');
        const slides = [];
        let currentSlide = [];
        let currentLabel = null;
        let metadata = {};
        
        for (const line of lines) {
            const trimmedLine = line.trim();
            
            if (!trimmedLine) {
                if (currentSlide.length > 0) {
                    slides.push({
                        content: currentSlide,
                        label: currentLabel
                    });
                    currentSlide = [];
                    currentLabel = null;
                }
                continue;
            }
            
            // Parse metadata
            if (trimmedLine.startsWith('{') && trimmedLine.endsWith('}')) {
                const metadataMatch = trimmedLine.match(/^\{([^:]+):\s*([^}]+)\}$/);
                if (metadataMatch) {
                    const [, key, value] = metadataMatch;
                    metadata[key.toLowerCase()] = value.trim();
                    
                    // Check for section labels
                    const sectionLabel = this.detectSectionLabel(key.toLowerCase());
                    if (sectionLabel) {
                        currentLabel = sectionLabel;
                    }
                }
                continue;
            }
            
            // Parse chord line
            const chordLine = this.parseChordLine(trimmedLine);
            currentSlide.push(chordLine);
        }
        
        if (currentSlide.length > 0) {
            slides.push({
                content: currentSlide,
                label: currentLabel
            });
        }
        
        return { slides, metadata };
    }
    
    detectSectionLabel(directive) {
        const lowerDirective = directive.toLowerCase();
        
        // Map common ChordPro section directives to our labels
        const sectionMap = {
            'verse': 'verse1',
            'verse1': 'verse1',
            'verse2': 'verse2', 
            'verse3': 'verse3',
            'verse4': 'verse4',
            'chorus': 'chorus',
            'bridge': 'bridge',
            'intro': 'intro',
            'outro': 'outro',
            'instrumental': 'instrumental',
            'v1': 'verse1',
            'v2': 'verse2',
            'v3': 'verse3',
            'v4': 'verse4',
            'c': 'chorus',
            'b': 'bridge'
        };
        
        return sectionMap[lowerDirective] || null;
    }
    
    parseChordLine(line) {
        const chords = [];
        const lyrics = [];
        let currentChord = '';
        let currentLyric = '';
        let inChord = false;
        
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            
            if (char === '[') {
                inChord = true;
                currentChord = '';
                continue;
            }
            
            if (char === ']') {
                inChord = false;
                chords.push(currentChord);
                currentChord = '';
                continue;
            }
            
            if (inChord) {
                currentChord += char;
            } else {
                currentLyric += char;
            }
        }
        
        return {
            chords: chords,
            lyrics: currentLyric || line
        };
    }
    
    // ========== SLIDE MANAGEMENT ==========
    
    generateSlides(song) {
        const { slides } = this.parseChordPro(song.chordpro);
        return slides.map((slide, index) => {
            // Check for custom slide labels first
            let finalLabel = slide.label;
            if (song.slideLabels && song.slideLabels[index]) {
                finalLabel = song.slideLabels[index];
            }
            
            const labelInfo = finalLabel ? this.slideLabels[finalLabel] : null;
            return {
                id: index + 1,
                content: slide.content,
                label: finalLabel,
                labelInfo: labelInfo,
                title: labelInfo ? `${song.title} - ${labelInfo.name}` : `${song.title} - Slide ${index + 1}`
            };
        });
    }
    
    // ========== RENDERING ==========
    
    renderSongList() {
        const songList = document.getElementById('song-list');
        if (!songList) return;
        
        if (this.songs.length === 0) {
            songList.innerHTML = `
                <div class="empty-song-list">
                    <span class="material-symbols-rounded">queue_music</span>
                    <h3>No songs available</h3>
                    <p>Create your first song or import existing ones</p>
                    <button class="btn btn-primary" id="import-songs-dynamic-btn">
                        <span class="material-symbols-rounded">upload</span>
                        Import Songs
                    </button>
                </div>
            `;
            return;
        }
        
        const songsHTML = this.songs.map(song => `
            <div class="song-item ${this.currentSong?.id === song.id ? 'active' : ''}" data-song-id="${song.id}">
                <div class="song-item-icon">
                    <span class="material-symbols-rounded">music_note</span>
                </div>
                <div class="song-item-content">
                    <div class="song-item-title">${song.title}</div>
                    <div class="song-item-artist">${song.artist || 'Unknown Artist'}</div>
                </div>
                <div class="song-item-actions">
                    <button class="song-item-action" title="Edit" data-song-id="${song.id}" data-action="edit">
                        <span class="material-symbols-rounded">edit</span>
                    </button>
                    <button class="song-item-action" title="Delete" data-song-id="${song.id}" data-action="delete">
                        <span class="material-symbols-rounded">delete</span>
                    </button>
                </div>
            </div>
        `).join('');
        
        songList.innerHTML = songsHTML;
        
        // Add click listeners
        songList.querySelectorAll('.song-item').forEach(item => {
            item.addEventListener('click', (e) => {
                if (!e.target.closest('.song-item-action')) {
                    const songId = parseInt(item.dataset.songId);
                    this.selectSong(songId);
                }
            });
        });
    }
    
    renderSongEditor(song) {
        const songEditor = document.getElementById('song-editor');
        const songsEmptyState = document.getElementById('songs-empty-state');
        
        if (!song) {
            songEditor.style.display = 'none';
            songsEmptyState.style.display = 'flex';
            return;
        }
        
        songEditor.style.display = 'flex';
        songsEmptyState.style.display = 'none';
        
        // Update song info
        document.getElementById('song-title').textContent = song.title;
        document.getElementById('song-artist').textContent = song.artist || 'Unknown Artist';
        
        // Update ChordPro content
        document.getElementById('chordpro-text').value = song.chordpro;
        
        // Update metadata display
        this.updateSongMetadataDisplay();
        
        // Generate and render slides
        this.renderSlides(song);
    }
    
    renderSlides(song) {
        const slidesContainer = document.getElementById('slides-container');
        if (!slidesContainer) return;
        
        const slides = this.getArrangedSlides(song);
        
        if (slides.length === 0) {
            slidesContainer.innerHTML = `
                <div class="empty-slides">
                    <span class="material-symbols-rounded">slideshow</span>
                    <p>No slides generated</p>
                    <p>Add some ChordPro content to generate slides</p>
                </div>
            `;
            return;
        }
        
        const slidesHTML = slides.map((slide, index) => {
            const labelHTML = slide.labelInfo ? 
                `<span class="slide-label" style="background-color: ${slide.labelInfo.color}; color: white;">
                    ${slide.labelInfo.name}
                </span>` : 
                `<span class="slide-number">Slide ${slide.id}</span>`;
            
            const templateClass = this.getSlideTemplateClass(song);
            const slideContentHTML = this.renderSlideContentWithTemplate(slide.content, song?.slideTemplate);
            
            return `
                <div class="slide-item ${templateClass} ${index === this.currentSlide ? 'active' : ''}" data-slide-id="${slide.id}">
                    <div class="slide-header">
                        ${labelHTML}
                        <div class="slide-actions">
                            <button class="slide-action" onclick="songsComponent.selectSlide(${index})">
                                <span class="material-symbols-rounded">play_arrow</span>
                            </button>
                            <button class="slide-action-btn" onclick="songsComponent.editSlideLabel(${index})" title="Edit Label">
                                <span class="material-symbols-rounded">label</span>
                            </button>
                        </div>
                    </div>
                    <div class="slide-content-preview">
                        ${slideContentHTML}
                    </div>
                </div>
            `;
        }).join('');
        
        slidesContainer.innerHTML = slidesHTML;
    }
    
    renderSlideContent(slideContent) {
        return slideContent.map(line => {
            if (line.chords && line.chords.length > 0) {
                const chordSpans = line.chords.map(chord => `<span class="chord">${chord}</span>`).join('');
                return `<div class="slide-line"><span class="chords">${chordSpans}</span><span class="lyrics">${line.lyrics}</span></div>`;
            } else {
                return `<div class="slide-line"><span class="lyrics">${line.lyrics}</span></div>`;
            }
        }).join('');
    }
    
    // ========== EVENT HANDLERS ==========
    
    setupEventListeners() {
        // Use event delegation for better performance and dynamic content handling
        document.addEventListener('click', (e) => {
            const target = e.target.closest('button, .btn');
            if (!target) return;
            
            const id = target.id;
            const classList = target.classList;
            
            // Handle all button clicks through delegation
            switch (id) {
                case 'add-song-btn':
                case 'create-song-btn':
                    e.preventDefault();
                    this.showSongModal();
                    break;
                    
                case 'import-songs-btn':
                case 'import-songs-dynamic-btn':
                    e.preventDefault();
                    this.showImportModal();
                    break;
                    
                case 'clear-search-btn':
                    e.preventDefault();
                    const searchInput = document.getElementById('song-search');
                    if (searchInput) {
                        searchInput.value = '';
                        this.filterSongs('');
                        target.style.display = 'none';
                    }
                    break;
                    
                case 'songselect-search-btn':
                    e.preventDefault();
                    this.searchSongSelect();
                    break;
            }
            
            // Handle song item actions
            if (classList.contains('song-item-action')) {
                e.preventDefault();
                e.stopPropagation();
                const songId = parseInt(target.dataset.songId);
                const action = target.dataset.action;
                
                if (songId && action) {
                    if (action === 'edit') {
                        this.editSong(songId);
                    } else if (action === 'delete') {
                        this.deleteSong(songId);
                    }
                }
            }
        });
        
        // Search functionality
        const searchInput = document.getElementById('song-search');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.filterSongs(e.target.value);
                const clearBtn = document.getElementById('clear-search-btn');
                if (clearBtn) {
                    clearBtn.style.display = e.target.value ? 'block' : 'none';
                }
            });
        }
        
        // SongSelect search enter key
        const songselectSearch = document.getElementById('songselect-search');
        if (songselectSearch) {
            songselectSearch.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.searchSongSelect();
                }
            });
        }
        
        // ChordPro text input for metadata updates
        const chordproText = document.getElementById('chordpro-text');
        if (chordproText) {
            chordproText.addEventListener('input', () => {
                this.updateSongMetadataDisplay();
            });
        }
        
        // Modal events
        this.setupModalEvents();
        
        // Toolbar events
        this.setupToolbarEvents();
    }
    
    setupModalEvents() {
        // Song modal
        const songModal = document.getElementById('song-modal');
        const closeSongModal = document.getElementById('close-song-modal');
        const cancelSongModal = document.getElementById('cancel-song-modal');
        const saveSongModal = document.getElementById('save-song-modal');
        
        if (closeSongModal) {
            closeSongModal.addEventListener('click', () => this.hideSongModal());
        }
        
        if (cancelSongModal) {
            cancelSongModal.addEventListener('click', () => this.hideSongModal());
        }
        
        if (saveSongModal) {
            saveSongModal.addEventListener('click', () => this.saveSongFromModal());
        }
        
        // Import modal
        const importModal = document.getElementById('import-modal');
        const closeImportModal = document.getElementById('close-import-modal');
        const cancelImportModal = document.getElementById('cancel-import-modal');
        const importSongsModal = document.getElementById('import-songs-modal');
        
        if (closeImportModal) {
            closeImportModal.addEventListener('click', () => this.hideImportModal());
        }
        
        if (cancelImportModal) {
            cancelImportModal.addEventListener('click', () => this.hideImportModal());
        }
        
        if (importSongsModal) {
            importSongsModal.addEventListener('click', () => this.importSongsFromModal());
        }

        // Server files events
        const loadServerFilesBtn = document.getElementById('load-server-files-btn');
        if (loadServerFilesBtn) {
            loadServerFilesBtn.addEventListener('click', () => this.loadServerFiles());
        }
    }
    
    setupToolbarEvents() {
        // Preview/Edit mode toggle
        const previewModeBtn = document.getElementById('preview-mode-btn');
        const editModeBtn = document.getElementById('edit-mode-btn');
        
        if (previewModeBtn) {
            previewModeBtn.addEventListener('click', () => {
                this.setPreviewMode(true);
            });
        }
        
        if (editModeBtn) {
            editModeBtn.addEventListener('click', () => {
                this.setPreviewMode(false);
            });
        }
        
        // Format chords
        const formatChordsBtn = document.getElementById('format-chords-btn');
        if (formatChordsBtn) {
            formatChordsBtn.addEventListener('click', () => {
                this.formatChords();
            });
        }
        
        // Add slide
        const addSlideBtn = document.getElementById('add-slide-btn');
        if (addSlideBtn) {
            addSlideBtn.addEventListener('click', () => {
                this.addManualSlide();
            });
        }
        
        // Edit song button
        const editSongBtn = document.getElementById('edit-song-btn');
        if (editSongBtn) {
            editSongBtn.addEventListener('click', () => {
                this.editCurrentSong();
            });
        }
        
        // Save song button
        const saveSongBtn = document.getElementById('save-song-btn');
        if (saveSongBtn) {
            saveSongBtn.addEventListener('click', () => {
                this.saveCurrentSong();
            });
        }
        
        // Delete song button
        const deleteSongBtn = document.getElementById('delete-song-btn');
        if (deleteSongBtn) {
            deleteSongBtn.addEventListener('click', () => {
                this.deleteCurrentSong();
            });
        }
        
        // Auto slides button
        const autoSlidesBtn = document.getElementById('auto-slides-btn');
        if (autoSlidesBtn) {
            autoSlidesBtn.addEventListener('click', () => {
                this.generateAutoSlides();
            });
        }
        
        // Add slide manual button
        const addSlideManualBtn = document.getElementById('add-slide-manual-btn');
        if (addSlideManualBtn) {
            addSlideManualBtn.addEventListener('click', () => {
                this.addManualSlide();
            });
        }
        
        // Arrange slides button
        const arrangeSlidesBtn = document.getElementById('arrange-slides-btn');
        if (arrangeSlidesBtn) {
            arrangeSlidesBtn.addEventListener('click', () => {
                this.showSlideArrangementModal();
            });
        }
        
        // Template settings button
        const templateSettingsBtn = document.getElementById('template-settings-btn');
        if (templateSettingsBtn) {
            templateSettingsBtn.addEventListener('click', () => {
                this.toggleTemplateSelector();
            });
        }
        
        // Insert section buttons
        const insertVerseBtn = document.getElementById('insert-verse-btn');
        if (insertVerseBtn) {
            insertVerseBtn.addEventListener('click', () => {
                this.insertSection('verse');
            });
        }
        
        const insertChorusBtn = document.getElementById('insert-chorus-btn');
        if (insertChorusBtn) {
            insertChorusBtn.addEventListener('click', () => {
                this.insertSection('chorus');
            });
        }
        
        const insertBridgeBtn = document.getElementById('insert-bridge-btn');
        if (insertBridgeBtn) {
            insertBridgeBtn.addEventListener('click', () => {
                this.insertSection('bridge');
            });
        }
        
        // Transpose buttons
        const transposeUpBtn = document.getElementById('transpose-up-btn');
        if (transposeUpBtn) {
            transposeUpBtn.addEventListener('click', () => {
                this.transposeChords(1);
            });
        }
        
        const transposeDownBtn = document.getElementById('transpose-down-btn');
        if (transposeDownBtn) {
            transposeDownBtn.addEventListener('click', () => {
                this.transposeChords(-1);
            });
        }
        
        // Clear content button
        const clearContentBtn = document.getElementById('clear-content-btn');
        if (clearContentBtn) {
            clearContentBtn.addEventListener('click', () => {
                this.clearChordProContent();
            });
        }
        
        // Transpose to key button
        const transposeToKeyBtn = document.getElementById('transpose-to-key-btn');
        if (transposeToKeyBtn) {
            transposeToKeyBtn.addEventListener('click', () => {
                this.transposeToSelectedKey();
            });
        }
    }
    
    // ========== MODAL MANAGEMENT ==========
    
    showSongModal(song = null) {
        const modal = document.getElementById('song-modal');
        const modalTitle = document.getElementById('modal-title');
        const titleInput = document.getElementById('modal-song-title');
        const artistInput = document.getElementById('modal-song-artist');
        const keySelect = document.getElementById('modal-song-key');
        const tempoInput = document.getElementById('modal-song-tempo');
        const chordproTextarea = document.getElementById('modal-song-chordpro');
        
        if (song) {
            modalTitle.textContent = 'Edit Song';
            titleInput.value = song.title;
            artistInput.value = song.artist || '';
            keySelect.value = song.key || '';
            tempoInput.value = song.tempo || 120;
            chordproTextarea.value = song.chordpro || '';
            this.currentTemplate = song.slideTemplate || 'classic';
        } else {
            modalTitle.textContent = 'Add New Song';
            titleInput.value = '';
            artistInput.value = '';
            keySelect.value = '';
            tempoInput.value = '120';
            chordproTextarea.value = '';
            this.currentTemplate = 'classic';
        }
        
        // Update template selector display
        this.updateTemplateSelector();
        
        modal.style.display = 'flex';
        titleInput.focus();
    }
    
    hideSongModal() {
        const modal = document.getElementById('song-modal');
        modal.style.display = 'none';
    }
    
    saveSongFromModal() {
        const titleInput = document.getElementById('modal-song-title');
        const artistInput = document.getElementById('modal-song-artist');
        const keySelect = document.getElementById('modal-song-key');
        const tempoInput = document.getElementById('modal-song-tempo');
        const chordproTextarea = document.getElementById('modal-song-chordpro');
        
        const songData = {
            title: titleInput.value.trim(),
            artist: artistInput.value.trim(),
            key: keySelect.value,
            tempo: parseInt(tempoInput.value) || 120,
            chordpro: chordproTextarea.value.trim(),
            slideTemplate: this.currentTemplate
        };
        
        if (!songData.title) {
            alert('Please enter a song title');
            return;
        }
        
        if (this.currentSong) {
            this.updateSong(this.currentSong.id, songData);
        } else {
            const newSong = this.addSong(songData);
            this.selectSong(newSong.id);
        }
        
        this.hideSongModal();
    }
    
    showImportModal() {
        console.log('showImportModal called');
        const modal = document.getElementById('import-modal');
        console.log('Import modal element:', modal);
        if (modal) {
            modal.style.display = 'block';
            console.log('Modal displayed');
        } else {
            console.error('Import modal not found!');
        }
    }
    
    hideImportModal() {
        const modal = document.getElementById('import-modal');
        modal.style.display = 'none';
    }
    
    importSongsFromModal() {
        const fileInput = document.getElementById('PRO-files');
        const pasteTextarea = document.getElementById('paste-chordpro');
        
        // Handle SongSelect import
        if (this.selectedSongSelectId) {
            const imported = this.importSelectedSongSelectSong();
            if (imported) {
                this.hideImportModal();
                return;
            }
        }
        
        // Handle file uploads
        if (fileInput.files.length > 0) {
            this.importFromFiles(fileInput.files);
        }
        
        // Handle pasted content
        if (pasteTextarea.value.trim()) {
            this.importFromText(pasteTextarea.value);
        }
        
        this.hideImportModal();
    }
    
    // ========== FILE IMPORT FUNCTIONS ==========
    
    async importFromFiles(files) {
        const importedSongs = [];
        const errors = [];
        
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            
            try {
                // Validate file type
                if (!this.isValidFileType(file)) {
                    errors.push(`Archivo "${file.name}": Tipo de archivo no soportado. Solo se permiten archivos .txt y .pro`);
                    continue;
                }
                
                // Validate file size (max 1MB)
                if (file.size > 1024 * 1024) {
                    errors.push(`Archivo "${file.name}": Archivo demasiado grande. Tamaño máximo: 1MB`);
                    continue;
                }
                
                const content = await this.readFileContent(file);
                const songData = this.parseFileContent(content, file.name);
                
                if (songData) {
                    // Check for duplicate titles
                    const existingSong = this.songs.find(s => s.title.toLowerCase() === songData.title.toLowerCase());
                    if (existingSong) {
                        songData.title += ` (${new Date().getTime()})`;
                    }
                    
                    this.addSong(songData);
                    importedSongs.push(songData.title);
                } else {
                    errors.push(`Archivo "${file.name}": No se pudo procesar el contenido`);
                }
                
            } catch (error) {
                console.error('Error importing file:', file.name, error);
                errors.push(`Archivo "${file.name}": Error al procesar - ${error.message}`);
            }
        }
        
        // Show results
        this.showImportResults(importedSongs, errors);
        
        // Clear file input
        const fileInput = document.getElementById('PRO-files');
        if (fileInput) fileInput.value = '';
    }
    
    importFromText(text) {
        try {
            const songData = this.parseTextContent(text);
            
            if (songData) {
                // Check for duplicate titles
                const existingSong = this.songs.find(s => s.title.toLowerCase() === songData.title.toLowerCase());
                if (existingSong) {
                    songData.title += ` (${new Date().getTime()})`;
                }
                
                this.addSong(songData);
                this.showImportResults([songData.title], []);
            } else {
                this.showImportResults([], ['No se pudo procesar el contenido pegado']);
            }
            
        } catch (error) {
            console.error('Error importing text:', error);
            this.showImportResults([], [`Error al procesar el texto: ${error.message}`]);
        }
        
        // Clear textarea
        const pasteTextarea = document.getElementById('paste-chordpro');
        if (pasteTextarea) pasteTextarea.value = '';
    }
    
    // ========== FILE PROCESSING HELPERS ==========
    
    isValidFileType(file) {
        if (!file || !file.name) {
            return false;
        }
        
        const validExtensions = ['.txt', '.pro', '.chord', '.chordpro'];
        const fileName = file.name.toLowerCase();
        const validMimeTypes = ['text/plain', 'application/octet-stream', 'text/x-chordpro', ''];
        
        // Check file extension
        const hasValidExtension = validExtensions.some(ext => fileName.endsWith(ext));
        
        // Be more permissive with MIME types for .pro files
        const hasValidMimeType = !file.type || validMimeTypes.includes(file.type) || file.type.startsWith('text/');
        
        return hasValidExtension && hasValidMimeType;
    }
    
    readFileContent(file) {
        return new Promise((resolve, reject) => {
            if (!file) {
                reject(new Error('Archivo no válido'));
                return;
            }
            
            const reader = new FileReader();
            
            // Set timeout for file reading (30 seconds)
            const timeout = setTimeout(() => {
                reader.abort();
                reject(new Error('Tiempo de espera agotado al leer el archivo'));
            }, 30000);
            
            reader.onload = (e) => {
                clearTimeout(timeout);
                const content = e.target.result;
                
                // Validate content
                if (typeof content !== 'string') {
                    reject(new Error('El contenido del archivo no es texto válido'));
                    return;
                }
                
                // Check for binary content
                if (this.containsBinaryContent(content)) {
                    reject(new Error('El archivo contiene contenido binario no válido'));
                    return;
                }
                
                resolve(content);
            };
            
            reader.onerror = () => {
                clearTimeout(timeout);
                reject(new Error(`Error al leer el archivo: ${reader.error?.message || 'Error desconocido'}`));
            };
            
            reader.onabort = () => {
                clearTimeout(timeout);
                reject(new Error('Lectura del archivo cancelada'));
            };
            
            try {
                reader.readAsText(file, 'UTF-8');
            } catch (error) {
                clearTimeout(timeout);
                reject(new Error(`Error al iniciar la lectura del archivo: ${error.message}`));
            }
        });
    }
    
    parseFileContent(content, fileName) {
        const extension = fileName.toLowerCase().split('.').pop();
        
        switch (extension) {
            case 'pro':
            case 'chord':
            case 'chordpro':
                return this.parseChordProFile(content, fileName);
            case 'txt':
                return this.parseTextFile(content, fileName);
            default:
                throw new Error('Tipo de archivo no soportado');
        }
    }
    
    parseChordProFile(content, fileName) {
        try {
            console.log(`[DEBUG] Parsing ChordPro file: ${fileName}`);
            console.log(`[DEBUG] Content length: ${content ? content.length : 'null'}`);
            
            // Validate input
            if (!content || typeof content !== 'string') {
                console.error(`[ERROR] Invalid content for file: ${fileName}`);
                throw new Error('Contenido del archivo inválido');
            }
            
            if (content.trim().length === 0) {
                console.error(`[ERROR] Empty file: ${fileName}`);
                throw new Error('El archivo está vacío');
            }
            
            console.log(`[DEBUG] Content preview: ${content.substring(0, 200)}...`);
            
            // Extract metadata with validation
            let title = this.extractChordProTitle(content) || this.getFileNameWithoutExtension(fileName);
            let artist = this.extractChordProArtist(content) || '';
            let key = this.extractChordProKey(content) || '';
            let tempo = this.extractChordProTempo(content) || 120;
            
            // Validate and sanitize title
            title = this.sanitizeString(title);
            if (!title || title.length === 0) {
                title = this.getFileNameWithoutExtension(fileName) || 'Canción sin título';
            }
            
            // Validate and sanitize other fields
            artist = this.sanitizeString(artist);
            key = this.sanitizeString(key);
            
            // Validate tempo
            tempo = parseInt(tempo);
            if (isNaN(tempo) || tempo < 40 || tempo > 300) {
                tempo = 120;
            }
            
            // Validate content has lyrics
            console.log(`[DEBUG] Checking for valid lyrics in: ${fileName}`);
            if (!this.hasValidLyrics(content)) {
                console.error(`[ERROR] No valid lyrics found in file: ${fileName}`);
                throw new Error('El archivo no contiene letras válidas');
            }
            
            // Validate ChordPro syntax
            console.log(`[DEBUG] Validating ChordPro syntax for: ${fileName}`);
            if (!this.isValidChordProSyntax(content)) {
                console.warn(`[WARN] Non-standard ChordPro syntax in: ${fileName}, processing as plain text`);
            } else {
                console.log(`[DEBUG] Valid ChordPro syntax confirmed for: ${fileName}`);
            }
            
            return {
                id: Date.now() + Math.random(),
                title: title,
                artist: artist,
                key: key,
                tempo: tempo,
                chordpro: content,
                content: content,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            
        } catch (error) {
            console.error('Error parsing ChordPro file:', error);
            throw error; // Re-throw to be handled by caller
        }
    }
    
    parseTextFile(content, fileName) {
        try {
            // Validate input
            if (!content || typeof content !== 'string') {
                throw new Error('Contenido del archivo inválido');
            }
            
            if (!content.trim()) {
                throw new Error('El archivo está vacío');
            }
            
            // Check for minimum content length
            if (content.trim().length < 3) {
                throw new Error('El archivo es demasiado corto para ser una canción válida');
            }
            
            // Extract and validate title
            let title = this.extractTextTitle(content) || this.getFileNameWithoutExtension(fileName);
            title = this.sanitizeString(title);
            
            if (!title || title.length === 0) {
                title = this.getFileNameWithoutExtension(fileName) || 'Canción sin título';
            }
            
            // Convert plain text to basic ChordPro format
            const chordproContent = this.convertTextToChordPro(content);
            
            // Validate converted content
            if (!chordproContent || chordproContent.trim().length === 0) {
                throw new Error('No se pudo procesar el contenido del archivo');
            }
            
            return {
                id: Date.now() + Math.random(),
                title: title,
                artist: '',
                key: '',
                tempo: 120,
                chordpro: chordproContent,
                content: chordproContent,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            
        } catch (error) {
            console.error('Error parsing text file:', error);
            throw error; // Re-throw to be handled by caller
        }
    }
    
    parseTextContent(text) {
        try {
            // Try to parse as ChordPro first
            if (this.isChordProContent(text)) {
                return this.parseChordProFile(text, 'Pasted Content');
            } else {
                // Treat as plain text
                return this.parseTextFile(text, 'Pasted Content');
            }
        } catch (error) {
            console.error('Error parsing text content:', error);
            return null;
        }
    }
    
    // ========== CONTENT EXTRACTION HELPERS ==========
    
    extractChordProTitle(content) {
        const titleMatch = content.match(/\{title?:?\s*([^}]+)\}/i) || content.match(/\{t:?\s*([^}]+)\}/i);
        return titleMatch ? titleMatch[1].trim() : null;
    }
    
    extractChordProArtist(content) {
        const artistMatch = content.match(/\{artist:?\s*([^}]+)\}/i) || content.match(/\{a:?\s*([^}]+)\}/i);
        return artistMatch ? artistMatch[1].trim() : null;
    }
    
    extractChordProKey(content) {
        const keyMatch = content.match(/\{key:?\s*([^}]+)\}/i) || content.match(/\{k:?\s*([^}]+)\}/i);
        return keyMatch ? keyMatch[1].trim() : null;
    }
    
    extractChordProTempo(content) {
        const tempoMatch = content.match(/\{tempo:?\s*([^}]+)\}/i);
        return tempoMatch ? parseInt(tempoMatch[1].trim()) : null;
    }
    
    extractTextTitle(content) {
        // Try to get title from first non-empty line
        const lines = content.split('\n');
        for (let line of lines) {
            line = line.trim();
            if (line && !line.startsWith('#') && !line.startsWith('//')) {
                return line.length > 50 ? line.substring(0, 50) + '...' : line;
            }
        }
        return null;
    }
    
    getFileNameWithoutExtension(fileName) {
        return fileName.replace(/\.[^/.]+$/, '');
    }
    
    hasValidLyrics(content) {
        // Remove ChordPro directives and check if there's actual content
        const cleanContent = content.replace(/\{[^}]+\}/g, '').replace(/\[[^\]]+\]/g, '').trim();
        return cleanContent.length > 0;
    }
    
    isChordProContent(text) {
        // Check if text contains ChordPro directives or chord notations
        return /\{[^}]+\}/.test(text) || /\[[^\]]+\]/.test(text);
    }
    
    convertTextToChordPro(text) {
        // Convert plain text to basic ChordPro format
        // Split into verses based on empty lines
        const lines = text.split('\n');
        const verses = [];
        let currentVerse = [];
        
        for (let line of lines) {
            if (line.trim() === '') {
                if (currentVerse.length > 0) {
                    verses.push(currentVerse.join('\n'));
                    currentVerse = [];
                }
            } else {
                currentVerse.push(line);
            }
        }
        
        if (currentVerse.length > 0) {
            verses.push(currentVerse.join('\n'));
        }
        
        return verses.join('\n\n');
    }
    
    showImportResults(imported, errors) {
        let message = '';
        
        if (imported.length > 0) {
            message += `✅ Canciones importadas exitosamente (${imported.length}):\n`;
            message += imported.map(title => `• ${title}`).join('\n');
        }
        
        if (errors.length > 0) {
            if (message) message += '\n\n';
            message += `❌ Errores encontrados (${errors.length}):\n`;
            message += errors.join('\n');
        }
        
        if (!message) {
            message = 'No se procesaron archivos.';
        }
        
        // Show results in a simple alert for now
        // TODO: Replace with a proper modal or toast notification
        alert(message);
        
        // Refresh the song list
        this.renderSongList();
    }
    
    // ========== SERVER FILES FUNCTIONS ==========
    
    async loadServerFiles() {
        const container = document.getElementById('server-files-container');
        const loadBtn = document.getElementById('load-server-files-btn');
        
        if (!container) return;
        
        // Show loading state
        loadBtn.disabled = true;
        loadBtn.textContent = 'Cargando...';
        container.innerHTML = '<div class="server-files-loading">Cargando archivos del servidor...</div>';
        
        try {
            const response = await fetch('/api/pro-files');
            if (!response.ok) {
                throw new Error(`Error del servidor: ${response.status}`);
            }
            
            const files = await response.json();
            
            if (files.length === 0) {
                container.innerHTML = '<div class="server-files-empty">No hay archivos .PRO disponibles en el servidor</div>';
            } else {
                this.renderServerFiles(files, container);
            }
        } catch (error) {
            console.error('Error loading server files:', error);
            container.innerHTML = '<div class="server-files-error">Error al cargar archivos del servidor</div>';
        } finally {
            loadBtn.disabled = false;
            loadBtn.textContent = 'Cargar Archivos del Servidor';
        }
    }
    
    renderServerFiles(files, container) {
        const filesList = files.map(file => `
            <div class="server-file-item">
                <div class="server-file-info">
                    <div class="server-file-name">${file.name}</div>
                    <div class="server-file-details">${file.size} bytes - ${file.modified}</div>
                </div>
                <button class="server-file-load-btn" onclick="songsComponent.loadFileFromServer('${file.name}')">
                    Cargar
                </button>
            </div>
        `).join('');
        
        container.innerHTML = `
            <div class="server-files-list">
                ${filesList}
            </div>
        `;
    }
    
    async loadFileFromServer(fileName) {
        try {
            const response = await fetch(`/api/pro-files/${encodeURIComponent(fileName)}`);
            if (!response.ok) {
                throw new Error(`Error al cargar archivo: ${response.status}`);
            }
            
            const content = await response.text();
            
            // Parse and import the file
            const result = this.parseChordProFile(content, fileName);
            if (result.success) {
                this.addSong(result.song);
                this.showSuccessMessage(`Archivo "${fileName}" cargado exitosamente`);
                this.hideImportModal();
            } else {
                alert(`Error al procesar el archivo: ${result.error}`);
            }
        } catch (error) {
            console.error('Error loading file from server:', error);
            alert(`Error al cargar el archivo del servidor: ${error.message}`);
        }
    }
    
    // ========== VALIDATION HELPERS ==========
    
    containsBinaryContent(content) {
        // Check for null bytes or other binary indicators
        return content.includes('\0') || /[\x00-\x08\x0E-\x1F\x7F-\xFF]/.test(content.substring(0, 1000));
    }
    
    sanitizeString(str) {
        if (!str || typeof str !== 'string') {
            return '';
        }
        
        // Remove dangerous characters and trim
        return str.replace(/[<>"'&\x00-\x1F\x7F-\xFF]/g, '').trim();
    }
    
    isValidChordProSyntax(content) {
        // More permissive validation for ChordPro syntax
        const hasDirectives = /\{[^}]+\}/.test(content);
        const hasChords = /\[[^\]]+\]/.test(content);
        const hasValidStructure = content.split('\n').some(line => line.trim().length > 0);
        const hasLyrics = content.replace(/\{[^}]+\}/g, '').replace(/\[[^\]]+\]/g, '').trim().length > 0;
        
        // Accept files with valid structure and either directives, chords, or just lyrics
        return hasValidStructure && (hasDirectives || hasChords || hasLyrics);
    }
    
    // ========== SONG ACTIONS ==========
    
    selectSong(songId) {
        const song = this.songs.find(s => s.id === songId);
        if (song) {
            this.currentSong = song;
            this.currentSlide = 0;
            this.renderSongEditor(song);
            this.renderSongList();
        }
    }
    
    editSong(songId) {
        const song = this.songs.find(s => s.id === songId);
        if (song) {
            this.showSongModal(song);
        }
    }
    
    clearCurrentSong() {
        this.currentSong = null;
        this.currentSlide = 0;
        this.renderSongEditor(null);
        this.renderSongList();
    }
    
    selectSlide(slideIndex) {
        this.currentSlide = slideIndex;
        this.renderSlides(this.currentSong);
        this.projectSlide();
    }
    
    // ========== PROJECTION ==========
    
    projectSlide() {
        if (!this.currentSong) return;
        
        const slides = this.generateSlides(this.currentSong);
        if (slides.length === 0 || this.currentSlide >= slides.length) return;
        
        const slide = slides[this.currentSlide];
        const slideContent = this.renderSlideContent(slide.content);
        
        this.socket.emit('proyectar_canto', {
            title: this.currentSong.title,
            artist: this.currentSong.artist,
            slide: slideContent,
            slideNumber: slide.id,
            totalSlides: slides.length
        });
    }
    
    projectNextSlide() {
        if (!this.currentSong) return;
        
        const slides = this.generateSlides(this.currentSong);
        if (this.currentSlide < slides.length - 1) {
            this.currentSlide++;
            this.selectSlide(this.currentSlide);
        }
    }
    
    projectPrevSlide() {
        if (this.currentSlide > 0) {
            this.currentSlide--;
            this.selectSlide(this.currentSlide);
        }
    }
    
    // ========== UTILITY METHODS ==========
    
    filterSongs(query) {
        const songItems = document.querySelectorAll('.song-item');
        const clearSearchBtn = document.getElementById('clear-search-btn');
        
        let hasResults = false;
        
        songItems.forEach(item => {
            const title = item.querySelector('.song-item-title').textContent.toLowerCase();
            const artist = item.querySelector('.song-item-artist').textContent.toLowerCase();
            const matches = title.includes(query.toLowerCase()) || artist.includes(query.toLowerCase());
            
            item.style.display = matches ? 'flex' : 'none';
            if (matches) hasResults = true;
        });
        
        clearSearchBtn.style.display = query ? 'block' : 'none';
    }
    
    setPreviewMode(isPreview) {
        this.isPreviewMode = isPreview;
        const previewBtn = document.getElementById('preview-mode-btn');
        const editBtn = document.getElementById('edit-mode-btn');
        const chordproText = document.getElementById('chordpro-text');
        
        if (isPreview) {
            previewBtn?.classList.add('active');
            editBtn?.classList.remove('active');
            chordproText.readOnly = true;
        } else {
            previewBtn?.classList.remove('active');
            editBtn?.classList.add('active');
            chordproText.readOnly = false;
        }
    }
    
    formatChords() {
        // Basic chord formatting - could be enhanced
        const chordproText = document.getElementById('chordpro-text');
        if (!chordproText) return;
        
        let content = chordproText.value;
        
        // Add basic formatting if none exists
        if (!content.includes('{title:')) {
            const lines = content.split('\n');
            const firstLine = lines[0].trim();
            if (firstLine && !firstLine.startsWith('[')) {
                content = `{title: ${firstLine}}\n{artist: Unknown}\n{key: C}\n{tempo: 120}\n\n${content}`;
            }
        }
        
        chordproText.value = content;
    }
    
    addManualSlide() {
        const chordproText = document.getElementById('chordpro-text');
        if (!chordproText) return;
        
        chordproText.value += '\n\n{new_page}\n\n';
        chordproText.focus();
    }
    
    // ========== SONG EDITOR FUNCTIONS ==========
    
    editCurrentSong() {
        if (!this.currentSong) {
            alert('No hay ninguna canción seleccionada para editar');
            return;
        }
        
        this.showSongModal(this.currentSong);
    }
    
    saveCurrentSong() {
        if (!this.currentSong) {
            alert('No hay ninguna canción seleccionada para guardar');
            return;
        }
        
        const chordproText = document.getElementById('chordpro-text');
        if (!chordproText) return;
        
        const updatedContent = chordproText.value.trim();
        
        if (!updatedContent) {
            alert('El contenido de la canción no puede estar vacío');
            return;
        }
        
        // Extract metadata from ChordPro content
        const title = this.extractChordProTitle(updatedContent) || this.currentSong.title;
        const artist = this.extractChordProArtist(updatedContent) || this.currentSong.artist;
        const key = this.extractChordProKey(updatedContent) || this.currentSong.key;
        const tempo = this.extractChordProTempo(updatedContent) || this.currentSong.tempo;
        
        const songData = {
            title: title,
            artist: artist,
            key: key,
            tempo: tempo,
            chordpro: updatedContent,
            content: updatedContent,
            updatedAt: new Date().toISOString()
        };
        
        this.updateSong(this.currentSong.id, songData);
        
        // Hide save button and show success message
        const saveSongBtn = document.getElementById('save-song-btn');
        if (saveSongBtn) {
            saveSongBtn.style.display = 'none';
        }
        
        // Show temporary success message
        this.showSuccessMessage('Canción guardada exitosamente');
    }
    
    deleteCurrentSong() {
        if (!this.currentSong) {
            alert('No hay ninguna canción seleccionada para eliminar');
            return;
        }
        
        const confirmDelete = confirm(`¿Estás seguro de que quieres eliminar la canción "${this.currentSong.title}"?`);
        
        if (confirmDelete) {
            this.deleteSong(this.currentSong.id);
            this.showSuccessMessage('Canción eliminada exitosamente');
        }
    }
    
    generateAutoSlides() {
        if (!this.currentSong) {
            alert('No hay ninguna canción seleccionada');
            return;
        }
        
        const chordproText = document.getElementById('chordpro-text');
        if (!chordproText) return;
        
        let content = chordproText.value;
        
        // Parse the content and add slide breaks automatically
        const lines = content.split('\n');
        const processedLines = [];
        let inVerse = false;
        let lineCount = 0;
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            
            // Skip empty lines and directives
            if (!line || line.startsWith('{')) {
                processedLines.push(lines[i]);
                if (!line) {
                    inVerse = false;
                    lineCount = 0;
                }
                continue;
            }
            
            // Start of a new verse/section
            if (!inVerse) {
                inVerse = true;
                lineCount = 0;
            }
            
            processedLines.push(lines[i]);
            lineCount++;
            
            // Add slide break after every 4 lines of lyrics
            if (lineCount >= 4) {
                processedLines.push('');
                processedLines.push('{new_page}');
                processedLines.push('');
                inVerse = false;
                lineCount = 0;
            }
        }
        
        chordproText.value = processedLines.join('\n');
        this.showSuccessMessage('Slides automáticas generadas');
    }
    
    showSuccessMessage(message) {
        // Create a temporary success message
        const successDiv = document.createElement('div');
        successDiv.className = 'success-message';
        successDiv.textContent = message;
        successDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #4CAF50;
            color: white;
            padding: 12px 20px;
            border-radius: 4px;
            z-index: 10000;
            box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        `;
        
        document.body.appendChild(successDiv);
        
        // Remove after 3 seconds
        setTimeout(() => {
            if (successDiv.parentNode) {
                successDiv.parentNode.removeChild(successDiv);
            }
        }, 3000);
    }
    
    // ========== CALLBACKS ==========
    
    setCallbacks(callbacks) {
        this.callbacks = callbacks;
    }
    
    // ========== PUBLIC API ==========
    
    getCurrentSong() {
        return this.currentSong;
    }
    
    getCurrentSlide() {
        return this.currentSlide;
    }
    
    getSlides() {
        if (!this.currentSong) return [];
        return this.generateSlides(this.currentSong);
    }
    
    // ========== SLIDE LABEL MANAGEMENT ==========
    
    editSlideLabel(slideIndex) {
        if (!this.currentSong) return;
        
        const slides = this.generateSlides(this.currentSong);
        const slide = slides[slideIndex];
        if (!slide) return;
        
        this.showSlideLabelModal(slideIndex, slide.label);
    }
    
    showSlideLabelModal(slideIndex, currentLabel) {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Edit Slide Label</h2>
                    <button class="modal-close" onclick="this.closest('.modal').remove()">
                        <span class="material-symbols-rounded">close</span>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label>Select Label:</label>
                        <div class="label-options">
                            <button class="label-option ${!currentLabel ? 'active' : ''}" data-label="">
                                <span class="label-color" style="background-color: #ccc;"></span>
                                No Label
                            </button>
                            ${Object.entries(this.slideLabels).map(([key, label]) => `
                                <button class="label-option ${currentLabel === key ? 'active' : ''}" data-label="${key}">
                                    <span class="label-color" style="background-color: ${label.color};"></span>
                                    ${label.name}
                                </button>
                            `).join('')}
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="this.closest('.modal').remove()">Cancel</button>
                    <button class="btn btn-primary" onclick="songsComponent.applySlideLabelChange(${slideIndex}, this.closest('.modal'))">
                        Apply
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Add click listeners for label options
        modal.querySelectorAll('.label-option').forEach(option => {
            option.addEventListener('click', () => {
                modal.querySelectorAll('.label-option').forEach(opt => opt.classList.remove('active'));
                option.classList.add('active');
            });
        });
    }
    
    applySlideLabelChange(slideIndex, modal) {
        const selectedOption = modal.querySelector('.label-option.active');
        const newLabel = selectedOption ? selectedOption.dataset.label : '';
        
        // Update the song's ChordPro content with the new label
        this.updateSlideLabel(slideIndex, newLabel);
        
        modal.remove();
        
        // Re-render slides to show the change
        if (this.currentSong) {
            this.renderSlides(this.currentSong);
        }
    }
    
    updateSlideLabel(slideIndex, newLabel) {
        if (!this.currentSong) return;
        
        // This is a simplified implementation
        // In a full implementation, you would parse and modify the ChordPro content
        // For now, we'll store the label information separately
        if (!this.currentSong.slideLabels) {
            this.currentSong.slideLabels = {};
        }
        
        if (newLabel) {
            this.currentSong.slideLabels[slideIndex] = newLabel;
        } else {
            delete this.currentSong.slideLabels[slideIndex];
        }
        
        this.saveSongs();
    }
    
    // ========== CUSTOM SLIDE ARRANGEMENTS ==========
    
    showSlideArrangementModal() {
        if (!this.currentSong) return;
        
        const slides = this.generateSlides(this.currentSong);
        const currentArrangement = this.currentSong.customArrangement || slides.map((_, index) => index);
        
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content arrangement-modal">
                <div class="modal-header">
                    <h2>Custom Slide Arrangement</h2>
                    <button class="modal-close" onclick="this.closest('.modal').remove()">
                        <span class="material-symbols-rounded">close</span>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="arrangement-info">
                        <p>Drag and drop slides to reorder them. You can also duplicate slides by dragging them to a new position.</p>
                    </div>
                    <div class="arrangement-container">
                        <div class="available-slides">
                            <h3>Available Slides</h3>
                            <div class="slides-list" id="available-slides">
                                ${slides.map((slide, index) => `
                                    <div class="arrangement-slide" data-slide-index="${index}" draggable="true">
                                        <div class="slide-preview">
                                            ${slide.labelInfo ? `<span class="slide-label" style="background-color: ${slide.labelInfo.color}">${slide.labelInfo.name}</span>` : ''}
                                            <div class="slide-content-preview">${slide.content.split('\n')[0] || 'Empty slide'}</div>
                                        </div>
                                        <button class="add-slide-btn" onclick="songsComponent.addSlideToArrangement(${index})">
                                            <span class="material-symbols-rounded">add</span>
                                        </button>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                        <div class="current-arrangement">
                            <h3>Current Arrangement</h3>
                            <div class="arrangement-list" id="arrangement-list">
                                ${currentArrangement.map((slideIndex, position) => {
                                    const slide = slides[slideIndex];
                                    return `
                                        <div class="arrangement-item" data-slide-index="${slideIndex}" data-position="${position}" draggable="true">
                                            <div class="arrangement-handle">
                                                <span class="material-symbols-rounded">drag_indicator</span>
                                            </div>
                                            <div class="slide-preview">
                                                ${slide.labelInfo ? `<span class="slide-label" style="background-color: ${slide.labelInfo.color}">${slide.labelInfo.name}</span>` : ''}
                                                <div class="slide-content-preview">${slide.content.split('\n')[0] || 'Empty slide'}</div>
                                            </div>
                                            <button class="remove-slide-btn" onclick="songsComponent.removeSlideFromArrangement(${position})">
                                                <span class="material-symbols-rounded">remove</span>
                                            </button>
                                        </div>
                                    `;
                                }).join('')}
                            </div>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="songsComponent.resetArrangement()">Reset to Default</button>
                    <button class="btn btn-secondary" onclick="this.closest('.modal').remove()">Cancel</button>
                    <button class="btn btn-primary" onclick="songsComponent.saveArrangement(this.closest('.modal'))">
                        Save Arrangement
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        this.setupArrangementDragAndDrop(modal);
    }
    
    setupArrangementDragAndDrop(modal) {
        const arrangementList = modal.querySelector('#arrangement-list');
        let draggedElement = null;
        
        // Setup drag and drop for arrangement items
        arrangementList.addEventListener('dragstart', (e) => {
            if (e.target.classList.contains('arrangement-item')) {
                draggedElement = e.target;
                e.target.style.opacity = '0.5';
            }
        });
        
        arrangementList.addEventListener('dragend', (e) => {
            if (e.target.classList.contains('arrangement-item')) {
                e.target.style.opacity = '1';
                draggedElement = null;
            }
        });
        
        arrangementList.addEventListener('dragover', (e) => {
            e.preventDefault();
        });
        
        arrangementList.addEventListener('drop', (e) => {
            e.preventDefault();
            if (draggedElement && e.target.classList.contains('arrangement-item')) {
                const targetElement = e.target;
                const draggedPosition = parseInt(draggedElement.dataset.position);
                const targetPosition = parseInt(targetElement.dataset.position);
                
                if (draggedPosition !== targetPosition) {
                    this.reorderArrangementItems(modal, draggedPosition, targetPosition);
                }
            }
        });
    }
    
    addSlideToArrangement(slideIndex) {
        const modal = document.querySelector('.arrangement-modal');
        const arrangementList = modal.querySelector('#arrangement-list');
        const slides = this.generateSlides(this.currentSong);
        const slide = slides[slideIndex];
        const newPosition = arrangementList.children.length;
        
        const arrangementItem = document.createElement('div');
        arrangementItem.className = 'arrangement-item';
        arrangementItem.dataset.slideIndex = slideIndex;
        arrangementItem.dataset.position = newPosition;
        arrangementItem.draggable = true;
        arrangementItem.innerHTML = `
            <div class="arrangement-handle">
                <span class="material-symbols-rounded">drag_indicator</span>
            </div>
            <div class="slide-preview">
                ${slide.labelInfo ? `<span class="slide-label" style="background-color: ${slide.labelInfo.color}">${slide.labelInfo.name}</span>` : ''}
                <div class="slide-content-preview">${slide.content.split('\n')[0] || 'Empty slide'}</div>
            </div>
            <button class="remove-slide-btn" onclick="songsComponent.removeSlideFromArrangement(${newPosition})">
                <span class="material-symbols-rounded">remove</span>
            </button>
        `;
        
        arrangementList.appendChild(arrangementItem);
        this.updateArrangementPositions(modal);
    }
    
    removeSlideFromArrangement(position) {
        const modal = document.querySelector('.arrangement-modal');
        const arrangementList = modal.querySelector('#arrangement-list');
        const item = arrangementList.querySelector(`[data-position="${position}"]`);
        
        if (item) {
            item.remove();
            this.updateArrangementPositions(modal);
        }
    }
    
    reorderArrangementItems(modal, fromPosition, toPosition) {
        const arrangementList = modal.querySelector('#arrangement-list');
        const items = Array.from(arrangementList.children);
        const item = items[fromPosition];
        
        arrangementList.removeChild(item);
        
        if (toPosition >= items.length - 1) {
            arrangementList.appendChild(item);
        } else {
            arrangementList.insertBefore(item, items[toPosition]);
        }
        
        this.updateArrangementPositions(modal);
    }
    
    updateArrangementPositions(modal) {
        const arrangementList = modal.querySelector('#arrangement-list');
        const items = arrangementList.querySelectorAll('.arrangement-item');
        
        items.forEach((item, index) => {
            item.dataset.position = index;
            const removeBtn = item.querySelector('.remove-slide-btn');
            removeBtn.onclick = () => this.removeSlideFromArrangement(index);
        });
    }
    
    resetArrangement() {
        if (!this.currentSong) return;
        
        const modal = document.querySelector('.arrangement-modal');
        const arrangementList = modal.querySelector('#arrangement-list');
        const slides = this.generateSlides(this.currentSong);
        
        arrangementList.innerHTML = slides.map((slide, index) => `
            <div class="arrangement-item" data-slide-index="${index}" data-position="${index}" draggable="true">
                <div class="arrangement-handle">
                    <span class="material-symbols-rounded">drag_indicator</span>
                </div>
                <div class="slide-preview">
                    ${slide.labelInfo ? `<span class="slide-label" style="background-color: ${slide.labelInfo.color}">${slide.labelInfo.name}</span>` : ''}
                    <div class="slide-content-preview">${slide.content.split('\n')[0] || 'Empty slide'}</div>
                </div>
                <button class="remove-slide-btn" onclick="songsComponent.removeSlideFromArrangement(${index})">
                    <span class="material-symbols-rounded">remove</span>
                </button>
            </div>
        `).join('');
    }
    
    saveArrangement(modal) {
        if (!this.currentSong) return;
        
        const arrangementList = modal.querySelector('#arrangement-list');
        const items = arrangementList.querySelectorAll('.arrangement-item');
        const arrangement = Array.from(items).map(item => parseInt(item.dataset.slideIndex));
        
        this.currentSong.customArrangement = arrangement;
        this.saveSongs();
        
        modal.remove();
        
        // Re-render slides with new arrangement
        this.renderSlides(this.currentSong);
        
        this.showSuccessMessage('Slide arrangement saved successfully!');
    }
    
    // ChordPro Editor Enhancement Methods
    insertSection(sectionType) {
        const textarea = document.getElementById('chordpro-text');
        if (!textarea) return;
        
        const cursorPos = textarea.selectionStart;
        const textBefore = textarea.value.substring(0, cursorPos);
        const textAfter = textarea.value.substring(cursorPos);
        
        let sectionTemplate = '';
        switch (sectionType) {
            case 'verse':
                sectionTemplate = '{start_of_verse}\n\n{end_of_verse}\n\n';
                break;
            case 'chorus':
                sectionTemplate = '{start_of_chorus}\n\n{end_of_chorus}\n\n';
                break;
            case 'bridge':
                sectionTemplate = '{start_of_bridge}\n\n{end_of_bridge}\n\n';
                break;
        }
        
        textarea.value = textBefore + sectionTemplate + textAfter;
        textarea.focus();
        textarea.setSelectionRange(cursorPos + sectionTemplate.indexOf('\n') + 1, cursorPos + sectionTemplate.indexOf('\n') + 1);
        
        // Trigger input event to update preview
        textarea.dispatchEvent(new Event('input'));
    }
    
    transposeChords(semitones) {
        const textarea = document.getElementById('chordpro-text');
        if (!textarea) return;
        
        const chordMap = {
            'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3, 'E': 4, 'F': 5,
            'F#': 6, 'Gb': 6, 'G': 7, 'G#': 8, 'Ab': 8, 'A': 9, 'A#': 10, 'Bb': 10, 'B': 11
        };
        
        const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        
        const transposeChord = (chord) => {
            const chordRegex = /^([A-G][#b]?)(.*)/;
            const match = chord.match(chordRegex);
            
            if (!match) return chord;
            
            const rootNote = match[1];
            const suffix = match[2];
            
            if (!(rootNote in chordMap)) return chord;
            
            const currentIndex = chordMap[rootNote];
            const newIndex = (currentIndex + semitones + 12) % 12;
            const newNote = noteNames[newIndex];
            
            return newNote + suffix;
        };
        
        const content = textarea.value;
        const chordRegex = /\[([^\]]+)\]/g;
        
        const transposedContent = content.replace(chordRegex, (match, chord) => {
            return '[' + transposeChord(chord) + ']';
        });
        
        textarea.value = transposedContent;
        textarea.dispatchEvent(new Event('input'));
        
        this.showSuccessMessage(`Chords transposed ${semitones > 0 ? 'up' : 'down'} by ${Math.abs(semitones)} semitone(s)`);
    }
    
    clearChordProContent() {
        const textarea = document.getElementById('chordpro-text');
        if (!textarea) return;
        
        if (textarea.value.trim() === '') {
            this.showSuccessMessage('Content is already empty');
            return;
        }
        
        if (confirm('Are you sure you want to clear all content? This action cannot be undone.')) {
            textarea.value = '';
            textarea.focus();
            textarea.dispatchEvent(new Event('input'));
            this.showSuccessMessage('Content cleared successfully');
        }
    }
    
    transposeToSelectedKey() {
        const keySelect = document.getElementById('modal-song-key');
        const chordproTextarea = document.getElementById('chordpro-text');
        
        if (!keySelect || !chordproTextarea) {
            this.showSuccessMessage('Key selection or content area not found', 'error');
            return;
        }
        
        const targetKey = keySelect.value;
        if (!targetKey) {
            this.showSuccessMessage('Please select a target key first', 'warning');
            return;
        }
        
        const content = chordproTextarea.value;
        if (!content.trim()) {
            this.showSuccessMessage('No content to transpose', 'warning');
            return;
        }
        
        // Detect current key from content
        const currentKey = this.detectKeyFromContent(content);
        if (!currentKey) {
            this.showSuccessMessage('Could not detect current key. Please add {key: } directive to your song.', 'warning');
            return;
        }
        
        if (currentKey === targetKey) {
            this.showSuccessMessage('Song is already in the selected key', 'info');
            return;
        }
        
        // Calculate semitone difference
        const semitones = this.calculateSemitonesDifference(currentKey, targetKey);
        
        // Transpose the content
        const transposedContent = this.transposeContentToKey(content, semitones, targetKey);
        
        // Update the textarea
        chordproTextarea.value = transposedContent;
        chordproTextarea.dispatchEvent(new Event('input'));
        
        // Show success message
        this.showSuccessMessage(`Song transposed from ${currentKey} to ${targetKey}`);
    }
    
    detectKeyFromContent(content) {
        // Look for {key: } directive
        const keyMatch = content.match(/\{key:\s*([A-G][#b]?)\s*\}/i);
        if (keyMatch) {
            return this.normalizeKey(keyMatch[1]);
        }
        
        // Try to detect from first chord
        const lines = content.split('\n');
        for (const line of lines) {
            const chords = this.extractChordsFromLine(line);
            if (chords.length > 0) {
                // Return the first chord as potential key
                return this.normalizeKey(chords[0]);
            }
        }
        
        return null;
    }
    
    extractChordsFromLine(line) {
        const chordRegex = /\[([A-G][#b]?(?:maj|min|m|sus|add|dim|aug|\d)*(?:\/[A-G][#b]?)?)\]/g;
        const chords = [];
        let match;
        
        while ((match = chordRegex.exec(line)) !== null) {
            const chord = match[1];
            const rootNote = chord.match(/^[A-G][#b]?/)[0];
            chords.push(this.normalizeKey(rootNote));
        }
        
        return chords;
    }
    
    normalizeKey(key) {
        // Convert to standard notation
        const keyMap = {
            'C#': 'C#', 'Db': 'C#',
            'D#': 'D#', 'Eb': 'D#',
            'F#': 'F#', 'Gb': 'F#',
            'G#': 'G#', 'Ab': 'G#',
            'A#': 'A#', 'Bb': 'A#'
        };
        
        return keyMap[key] || key;
    }
    
    calculateSemitonesDifference(fromKey, toKey) {
        const keys = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        
        const fromIndex = keys.indexOf(this.normalizeKey(fromKey));
        const toIndex = keys.indexOf(this.normalizeKey(toKey));
        
        if (fromIndex === -1 || toIndex === -1) {
            return 0;
        }
        
        let difference = toIndex - fromIndex;
        if (difference < 0) {
            difference += 12;
        }
        
        return difference;
    }
    
    transposeContentToKey(content, semitones, newKey) {
        let transposedContent = content;
        
        // Update key directive
        transposedContent = transposedContent.replace(
            /\{key:\s*[A-G][#b]?\s*\}/gi,
            `{key: ${newKey}}`
        );
        
        // If no key directive exists, add one at the beginning
        if (!transposedContent.match(/\{key:/i)) {
            transposedContent = `{key: ${newKey}}\n${transposedContent}`;
        }
        
        // Transpose all chords
        transposedContent = transposedContent.replace(
            /\[([A-G][#b]?(?:maj|min|m|sus|add|dim|aug|\d)*(?:\/[A-G][#b]?)?)\]/g,
            (match, chord) => {
                const transposedChord = this.transposeChord(chord, semitones);
                return `[${transposedChord}]`;
            }
        );
        
        return transposedContent;
    }
    
    transposeChord(chord, semitones) {
        // Extract root note and bass note (if any)
        const parts = chord.split('/');
        const rootPart = parts[0];
        const bassPart = parts[1];
        
        // Extract root note from the chord
        const rootMatch = rootPart.match(/^([A-G][#b]?)(.*)/);;
        if (!rootMatch) return chord;
        
        const rootNote = rootMatch[1];
        const chordSuffix = rootMatch[2];
        
        // Transpose root note
        const transposedRoot = this.transposeNote(rootNote, semitones);
        
        // Transpose bass note if present
        let transposedBass = '';
        if (bassPart) {
            transposedBass = '/' + this.transposeNote(bassPart, semitones);
        }
        
        return transposedRoot + chordSuffix + transposedBass;
    }
    
    transposeNote(note, semitones) {
        const keys = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        const normalizedNote = this.normalizeKey(note);
        const currentIndex = keys.indexOf(normalizedNote);
        
        if (currentIndex === -1) return note;
        
        const newIndex = (currentIndex + semitones) % 12;
        return keys[newIndex];
    }
    
    updateSongMetadataDisplay() {
        const chordproTextarea = document.getElementById('chordpro-text');
        const songMetadata = document.getElementById('song-metadata');
        const keyIndicator = document.getElementById('key-indicator');
        const tempoIndicator = document.getElementById('tempo-indicator');
        const tempoDisplay = document.getElementById('current-tempo-display');
        
        if (!chordproTextarea || !songMetadata || !keyIndicator) return;
        
        const content = chordproTextarea.value;
        
        if (!content.trim()) {
            songMetadata.style.display = 'none';
            return;
        }
        
        // Detect and display current key
        const currentKey = this.detectKeyFromContent(content);
        if (currentKey) {
            keyIndicator.textContent = currentKey;
            songMetadata.style.display = 'flex';
        } else {
            keyIndicator.textContent = '-';
        }
        
        // Detect and display tempo if present
        const tempoMatch = content.match(/\{tempo:\s*(\d+)\s*\}/i);
        if (tempoMatch && tempoIndicator && tempoDisplay) {
            tempoIndicator.textContent = `${tempoMatch[1]} BPM`;
            tempoDisplay.style.display = 'flex';
        } else if (tempoDisplay) {
            tempoDisplay.style.display = 'none';
        }
        
        // Show metadata if we have any information
        if (currentKey || tempoMatch) {
            songMetadata.style.display = 'flex';
        } else {
            songMetadata.style.display = 'none';
        }
    }
    
    // ========== SONGSELECT SIMULATION ==========
    
    searchSongSelect() {
        const searchInput = document.getElementById('songselect-search');
        const resultsContainer = document.getElementById('songselect-results');
        
        if (!searchInput || !resultsContainer) {
            return;
        }
        
        const query = searchInput.value.trim();
        if (!query) {
            resultsContainer.style.display = 'none';
            return;
        }
        
        // Show loading state
        resultsContainer.style.display = 'block';
        resultsContainer.innerHTML = '<div class="songselect-loading">Searching SongSelect database...</div>';
        
        // Simulate API delay
        setTimeout(() => {
            const results = this.getSongSelectResults(query);
            this.displaySongSelectResults(results);
        }, 1000);
    }
    
    getSongSelectResults(query) {
        // Simulated SongSelect database
        const songSelectDatabase = [
            {
                id: 'ss1',
                title: 'Amazing Grace',
                artist: 'John Newton',
                key: 'G',
                tempo: 90,
                chordpro: `{title: Amazing Grace}
{artist: John Newton}
{key: G}
{tempo: 90}

[Verse 1]
[G]Amazing [G/B]grace how [C]sweet the [G]sound
That [G/B]saved a [Em]wretch like [D]me
[G]I once was [G/B]lost but [C]now I'm [G]found
Was [G/B]blind but [D]now I [G]see

[Verse 2]
'Twas [G]grace that [G/B]taught my [C]heart to [G]fear
And [G/B]grace my [Em]fears re[D]lieved
How [G]precious [G/B]did that [C]grace ap[G]pear
The [G/B]hour I [D]first be[G]lieved`
            },
            {
                id: 'ss2',
                title: 'How Great Thou Art',
                artist: 'Carl Boberg',
                key: 'C',
                tempo: 85,
                chordpro: `{title: How Great Thou Art}
{artist: Carl Boberg}
{key: C}
{tempo: 85}

[Verse 1]
O [C]Lord my [Am]God when [F]I in [C]awesome wonder
Con[Am]sider [G]all the [F]worlds thy [C]hands have made
I [C]see the [Am]stars I [F]hear the [C]rolling thunder
Thy [Am]power through[G]out the [F]universe dis[C]played

[Chorus]
Then sings my [C]soul my [F]Savior God to [C]thee
How great thou [Am]art [G]how great thou [C]art
Then sings my [C]soul my [F]Savior God to [C]thee
How great thou [Am]art [G]how great thou [C]art`
            },
            {
                id: 'ss3',
                title: 'Blessed Be Your Name',
                artist: 'Matt Redman',
                key: 'A',
                tempo: 120,
                chordpro: `{title: Blessed Be Your Name}
{artist: Matt Redman}
{key: A}
{tempo: 120}

[Verse 1]
[A]Blessed be your name in the [E]land that is plentiful
Where your [F#m]streams of abundance [D]flow blessed be your [A]name
Blessed be your name when I'm [E]found in the desert place
Though I [F#m]walk through the wilderness [D]blessed be your [A]name

[Pre-Chorus]
Every [F#m]blessing you [E]pour out I'll [D]turn back to [A]praise
When the [F#m]darkness closes [E]in Lord [D]still I will [E]say

[Chorus]
Blessed be the [A]name of the [E]Lord blessed be your [F#m]name
Blessed be the [D]name of the [A]Lord blessed be your [E]glorious [A]name`
            },
            {
                id: 'ss4',
                title: 'Great Is Thy Faithfulness',
                artist: 'Thomas Chisholm',
                key: 'Bb',
                tempo: 75,
                chordpro: `{title: Great Is Thy Faithfulness}
{artist: Thomas Chisholm}
{key: Bb}
{tempo: 75}

[Verse 1]
[Bb]Great is thy [Eb]faithfulness [Bb]O God my [F]Father
There is no [Bb]shadow of [Eb]turning with [Bb]thee [F]
Thou changest [Bb]not thy com[Eb]passions they [Bb]fail [Gm]not
As thou hast [Bb]been thou for[F]ever wilt [Bb]be

[Chorus]
Great is thy [Bb]faithfulness [Eb]great is thy [Bb]faithfulness
Morning by [F]morning new [Bb]mercies I [F]see
All I have [Bb]needed thy [Eb]hand hath pro[Bb]vided [Gm]
Great is thy [Bb]faithfulness [F]Lord unto [Bb]me`
            },
            {
                id: 'ss5',
                title: 'Holy Holy Holy',
                artist: 'Reginald Heber',
                key: 'D',
                tempo: 95,
                chordpro: `{title: Holy Holy Holy}
{artist: Reginald Heber}
{key: D}
{tempo: 95}

[Verse 1]
[D]Holy holy [A]holy [G]Lord God Al[D]mighty
[G]Early in the [D]morning our [A]song shall rise to [D]thee
Holy holy [A]holy [G]merciful and [D]mighty
[G]God in three [D]persons [A]blessed Trini[D]ty

[Verse 2]
[D]Holy holy [A]holy [G]all the saints a[D]dore thee
[G]Casting down their [D]golden crowns a[A]round the glassy [D]sea
Cherubim and [A]seraphim [G]falling down be[D]fore thee
[G]Which wert and [D]art and [A]evermore shalt [D]be`
            }
        ];
        
        // Filter results based on query
        return songSelectDatabase.filter(song => 
            song.title.toLowerCase().includes(query.toLowerCase()) ||
            song.artist.toLowerCase().includes(query.toLowerCase())
        );
    }
    
    displaySongSelectResults(results) {
        const resultsContainer = document.getElementById('songselect-results');
        
        if (!resultsContainer) {
            return;
        }
        
        if (results.length === 0) {
            resultsContainer.innerHTML = '<div class="songselect-no-results">No songs found. Try a different search term.</div>';
            return;
        }
        
        const resultsHTML = results.map(song => `
            <div class="songselect-item" data-song-id="${song.id}" onclick="songsComponent.selectSongSelectItem('${song.id}')">
                <div class="songselect-title">${song.title}</div>
                <div class="songselect-artist">${song.artist}</div>
                <div class="songselect-meta">
                    <span class="songselect-key">Key: ${song.key}</span>
                    <span class="songselect-tempo">Tempo: ${song.tempo} BPM</span>
                </div>
            </div>
        `).join('');
        
        resultsContainer.innerHTML = resultsHTML;
    }
    
    selectSongSelectItem(songId) {
        // Remove previous selections
        document.querySelectorAll('.songselect-item').forEach(item => {
            item.classList.remove('selected');
        });
        
        // Select current item
        const selectedItem = document.querySelector(`[data-song-id="${songId}"]`);
        if (selectedItem) {
            selectedItem.classList.add('selected');
            this.selectedSongSelectId = songId;
        }
    }
    
    importSelectedSongSelectSong() {
        if (!this.selectedSongSelectId) {
            return false;
        }
        
        const songData = this.getSongSelectResults('').find(song => song.id === this.selectedSongSelectId);
        if (!songData) {
            return false;
        }
        
        // Import the song
        const newSong = {
            id: Date.now().toString(),
            title: songData.title,
            artist: songData.artist,
            key: songData.key,
            tempo: songData.tempo,
            chordpro: songData.chordpro,
            slides: [],
            slideLabels: {},
            customArrangement: null
        };
        
        this.addSong(newSong);
        this.showSuccessMessage(`Successfully imported "${songData.title}" from SongSelect`);
        
        // Clear selection
        this.selectedSongSelectId = null;
        document.getElementById('songselect-search').value = '';
        document.getElementById('songselect-results').style.display = 'none';
        
        return true;
    }
    
    getArrangedSlides(song) {
        const slides = this.generateSlides(song);
        if (!song.customArrangement) {
            return slides;
        }
        
        return song.customArrangement.map(slideIndex => slides[slideIndex]).filter(slide => slide);
    }
    
    // ========== SLIDE TEMPLATES ==========
    
    toggleTemplateSelector() {
        const templateSelector = document.getElementById('template-selector');
        if (!templateSelector) return;
        
        this.templateSelectorVisible = !this.templateSelectorVisible;
        templateSelector.style.display = this.templateSelectorVisible ? 'block' : 'none';
        
        if (this.templateSelectorVisible) {
            this.setupTemplateEvents();
        }
    }
    
    setupTemplateEvents() {
        // Use event delegation for template options
        document.addEventListener('click', (e) => {
            const templateOption = e.target.closest('.template-option');
            if (templateOption) {
                const templateId = templateOption.dataset.template;
                this.selectTemplate(templateId);
            }
        });
    }
    
    selectTemplate(templateId) {
        if (!this.slideTemplates[templateId]) return;
        
        // Update current template
        this.currentTemplate = templateId;
        
        // Update UI
        const templateOptions = document.querySelectorAll('.template-option');
        templateOptions.forEach(option => {
            option.classList.toggle('active', option.dataset.template === templateId);
        });
        
        // Apply template to current song if exists
        if (this.currentSong) {
            this.currentSong.slideTemplate = templateId;
            this.renderSlides(this.currentSong);
            this.saveSongs();
        }
        
        this.showSuccessMessage(`Template changed to ${this.slideTemplates[templateId].name}`);
    }
    
    renderSlideContentWithTemplate(slideContent, templateId = null) {
        const template = templateId || this.currentTemplate;
        const templateClass = this.slideTemplates[template]?.className || 'slide-template-classic';
        
        if (template === 'compact') {
            return this.renderCompactSlideContent(slideContent);
        } else if (template === 'minimal') {
            return this.renderMinimalSlideContent(slideContent);
        } else {
            return this.renderClassicSlideContent(slideContent);
        }
    }
    
    renderClassicSlideContent(slideContent) {
        return slideContent.map(line => {
            if (line.chords && line.chords.length > 0) {
                const chordSpans = line.chords.map(chord => `<span class="chord">${chord}</span>`).join('');
                return `<div class="slide-line"><span class="chords">${chordSpans}</span><span class="lyrics">${line.lyrics}</span></div>`;
            } else {
                return `<div class="slide-line"><span class="lyrics">${line.lyrics}</span></div>`;
            }
        }).join('');
    }
    
    renderCompactSlideContent(slideContent) {
        return slideContent.map(line => {
            if (line.chords && line.chords.length > 0) {
                let result = '';
                let lyricsIndex = 0;
                
                line.chords.forEach((chord, index) => {
                    if (chord.trim()) {
                        result += `<span class="chords">[${chord}]</span> `;
                    }
                    
                    // Add corresponding lyrics part
                    const lyricsWords = line.lyrics.split(' ');
                    if (lyricsWords[lyricsIndex]) {
                        result += `<span class="lyrics">${lyricsWords[lyricsIndex]}</span> `;
                        lyricsIndex++;
                    }
                });
                
                // Add remaining lyrics
                const remainingLyrics = line.lyrics.split(' ').slice(lyricsIndex).join(' ');
                if (remainingLyrics.trim()) {
                    result += `<span class="lyrics">${remainingLyrics}</span>`;
                }
                
                return `<div class="slide-line">${result}</div>`;
            } else {
                return `<div class="slide-line"><span class="lyrics">${line.lyrics}</span></div>`;
            }
        }).join('');
    }
    
    renderMinimalSlideContent(slideContent) {
        return slideContent.map(line => {
            return `<div class="slide-line"><span class="lyrics">${line.lyrics}</span></div>`;
        }).join('');
    }
    
    getSlideTemplateClass(song = null) {
        const template = song?.slideTemplate || this.currentTemplate;
        return this.slideTemplates[template]?.className || 'slide-template-classic';
    }
    
    updateTemplateSelector() {
        const templateOptions = document.querySelectorAll('.template-option');
        templateOptions.forEach(option => {
            const templateId = option.dataset.template;
            if (templateId === this.currentTemplate) {
                option.classList.add('active');
            } else {
                option.classList.remove('active');
            }
        });
    }
}

// ========== INITIALIZATION ==========

// Initialize the component
let songsComponent;

document.addEventListener('DOMContentLoaded', () => {
    // Add a small delay to ensure all elements are fully rendered
    setTimeout(() => {
        console.log('Initializing SongsComponent...');
        songsComponent = new SongsComponent();
        console.log('SongsComponent initialized');
    }, 100);
});
