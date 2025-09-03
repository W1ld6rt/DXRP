// ========== SETTINGS COMPONENT ==========

class SettingsComponent {
    constructor() {
        this.currentSection = 'obs';
        this.settings = {};
        this.socket = io();
        
        this.init();
    }
    
    init() {
        console.log('Inicializando SettingsComponent...');
        
        // Agregar un pequeño retraso para asegurar que el DOM esté completamente cargado
        setTimeout(() => {
            this.loadSettings();
            this.setupEventListeners();
            this.updateSystemInfo();
            this.updateLibraryStats();
            console.log('SettingsComponent inicialización completada');
        }, 100);
    }
    
    // ========== EVENT HANDLERS ==========
    
    setupEventListeners() {
        console.log('Configurando event listeners para settings...');
        
        // Navigation
        const navItems = document.querySelectorAll('.nav-item');
        console.log(`Encontrados ${navItems.length} elementos de navegación`);
        navItems.forEach(item => {
            item.addEventListener('click', () => {
                this.switchSection(item.dataset.section);
                this.scrollToActiveTab();
            });
        });
        
        // Mejorar experiencia táctil en móvil
        this.setupMobileEnhancements();
        
        // OBS Connection
        const testConnectionBtn = document.getElementById('test-obs-connection');
        if (testConnectionBtn) {
            console.log('Botón test-obs-connection encontrado');
            testConnectionBtn.addEventListener('click', () => this.testOBSConnection());
        } else {
            console.warn('Botón test-obs-connection no encontrado');
        }
        
        // Copy buttons
        const copyBtns = document.querySelectorAll('.copy-btn');
        console.log(`Encontrados ${copyBtns.length} botones de copia`);
        copyBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const linkId = btn.dataset.link;
                this.copyToClipboard(linkId);
            });
        });
        
        // Theme buttons
        const themeBtns = document.querySelectorAll('.theme-btn');
        console.log(`Encontrados ${themeBtns.length} botones de tema`);
        themeBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                this.setTheme(btn.dataset.theme);
            });
        });
        
        // Color buttons
        const colorBtns = document.querySelectorAll('.color-btn');
        console.log(`Encontrados ${colorBtns.length} botones de color`);
        colorBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                this.setAccentColor(btn.dataset.color);
            });
        });
        
        // Form inputs
        this.setupFormListeners();
        
        // Action buttons
        this.setupActionListeners();
        
        console.log('Event listeners configurados correctamente');
    }
    
    setupFormListeners() {
        // OBS settings
        const obsHost = document.getElementById('obs-host');
        const obsPort = document.getElementById('obs-port');
        const obsPassword = document.getElementById('obs-password');
        
        if (obsHost) {
            obsHost.addEventListener('change', () => {
                this.settings.obs = this.settings.obs || {};
                this.settings.obs.host = obsHost.value;
                this.saveSettings();
            });
        }
        
        if (obsPort) {
            obsPort.addEventListener('change', () => {
                this.settings.obs = this.settings.obs || {};
                this.settings.obs.port = obsPort.value;
                this.saveSettings();
            });
        }
        
        if (obsPassword) {
            obsPassword.addEventListener('change', () => {
                this.settings.obs = this.settings.obs || {};
                this.settings.obs.password = obsPassword.value;
                this.saveSettings();
            });
        }
        
        // Bible file upload
        const bibleFileInput = document.getElementById('bible-file-input');
        if (bibleFileInput) {
            bibleFileInput.addEventListener('change', (e) => {
                this.handleBibleFileUpload(e.target.files);
            });
        }
        
        // Bible settings
        const primaryBible = document.getElementById('primary-bible');
        const secondaryBible = document.getElementById('secondary-bible');
        const historyLimit = document.getElementById('history-limit');
        const showSecondaryBible = document.getElementById('show-secondary-bible');
        
        if (primaryBible) {
            primaryBible.addEventListener('change', () => {
                this.settings.bible = this.settings.bible || {};
                this.settings.bible.primaryBible = primaryBible.value;
                this.saveSettings();
                this.updateBibleSelectors();
                this.notifyBibleComponent();
            });
        }
        
        if (secondaryBible) {
            secondaryBible.addEventListener('change', () => {
                this.settings.bible = this.settings.bible || {};
                this.settings.bible.secondaryBible = secondaryBible.value;
                this.saveSettings();
                this.notifyBibleComponent();
            });
        }
        
        if (showSecondaryBible) {
            showSecondaryBible.addEventListener('change', () => {
                this.settings.bible = this.settings.bible || {};
                this.settings.bible.showSecondaryBible = showSecondaryBible.checked;
                this.saveSettings();
                this.notifyBibleComponent();
            });
        }
        
        if (historyLimit) {
            historyLimit.addEventListener('change', () => {
                this.settings.bible = this.settings.bible || {};
                this.settings.bible.historyLimit = parseInt(historyLimit.value);
                this.saveSettings();
            });
        }
        
        // Apply Bible Changes button
        const applyBibleChangesBtn = document.getElementById('apply-bible-changes');
        if (applyBibleChangesBtn) {
            applyBibleChangesBtn.addEventListener('click', () => {
                this.applyBibleChanges();
            });
        }
        
        // Checkboxes
        const checkboxes = [
            'show-verse-numbers',
            'show-chapter-numbers',
            'show-cross-references',
            'compact-mode',
            'animations-enabled',
            'show-chords',
            'show-slide-numbers'
        ];
        
        checkboxes.forEach(id => {
            const checkbox = document.getElementById(id);
            if (checkbox) {
                checkbox.addEventListener('change', () => {
                    this.settings[id] = checkbox.checked;
                    this.saveSettings();
                    this.applySettings();
                });
            }
        });
        
        // Font size
        const defaultFontSize = document.getElementById('default-font-size');
        if (defaultFontSize) {
            defaultFontSize.addEventListener('change', () => {
                this.settings.defaultFontSize = defaultFontSize.value;
                this.saveSettings();
                this.applySettings();
            });
        }
    }
    
    setupActionListeners() {
        console.log('Configurando action listeners...');
        
        // Bible actions
        const clearBibleHistory = document.getElementById('clear-bible-history');
        if (clearBibleHistory) {
            console.log('Botón clear-bible-history encontrado');
            clearBibleHistory.addEventListener('click', () => {
                console.log('Click en clear-bible-history');
                this.clearBibleHistory();
            });
        } else {
            console.warn('Botón clear-bible-history no encontrado');
        }
        
        // Songs actions
        const exportSongs = document.getElementById('export-songs');
        const importSongsSettings = document.getElementById('import-songs-settings');
        const clearSongsLibrary = document.getElementById('clear-songs-library');
        
        if (exportSongs) {
            console.log('Botón export-songs encontrado');
            exportSongs.addEventListener('click', () => {
                console.log('Click en export-songs');
                this.exportSongsLibrary();
            });
        } else {
            console.warn('Botón export-songs no encontrado');
        }
        
        if (importSongsSettings) {
            console.log('Botón import-songs-settings encontrado');
            importSongsSettings.addEventListener('click', () => {
                console.log('Click en import-songs-settings');
                this.importSongsLibrary();
            });
        } else {
            console.warn('Botón import-songs-settings no encontrado');
        }
        
        if (clearSongsLibrary) {
            console.log('Botón clear-songs-library encontrado');
            clearSongsLibrary.addEventListener('click', () => {
                console.log('Click en clear-songs-library');
                this.clearSongsLibrary();
            });
        } else {
            console.warn('Botón clear-songs-library no encontrado');
        }
        
        // About actions
        const checkUpdates = document.getElementById('check-updates');
        const exportLogs = document.getElementById('export-logs');
        const resetSettings = document.getElementById('reset-settings');
        
        if (checkUpdates) {
            console.log('Botón check-updates encontrado');
            checkUpdates.addEventListener('click', () => {
                console.log('Click en check-updates');
                this.checkForUpdates();
            });
        } else {
            console.warn('Botón check-updates no encontrado');
        }
        
        if (exportLogs) {
            console.log('Botón export-logs encontrado');
            exportLogs.addEventListener('click', () => {
                console.log('Click en export-logs');
                this.exportLogs();
            });
        } else {
            console.warn('Botón export-logs no encontrado');
        }
        
        if (resetSettings) {
            console.log('Botón reset-settings encontrado');
            resetSettings.addEventListener('click', () => {
                console.log('Click en reset-settings');
                this.resetSettings();
            });
        } else {
            console.warn('Botón reset-settings no encontrado');
        }
        
        console.log('Action listeners configurados');
    }
    
    // ========== NAVIGATION ==========
    
    switchSection(sectionName) {
        // Update navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        
        const activeNavItem = document.querySelector(`[data-section="${sectionName}"]`);
        if (activeNavItem) {
            activeNavItem.classList.add('active');
        }
        
        // Update sections
        document.querySelectorAll('.settings-section').forEach(section => {
            section.classList.remove('active');
        });
        
        const activeSection = document.getElementById(`${sectionName}-section`);
        if (activeSection) {
            activeSection.classList.add('active');
        }
        
        this.currentSection = sectionName;
    }
    
    // ========== OBS CONNECTION ==========
    
    async testOBSConnection() {
        const host = document.getElementById('obs-host')?.value || 'localhost';
        const port = document.getElementById('obs-port')?.value || '4444';
        const password = document.getElementById('obs-password')?.value || '';
        
        const statusIndicator = document.getElementById('obs-status-indicator');
        const statusDot = statusIndicator?.querySelector('.status-dot');
        const statusText = statusIndicator?.querySelector('.status-text');
        
        if (statusDot) statusDot.classList.remove('connected');
        if (statusText) statusText.textContent = 'Testing connection...';
        
        try {
            const response = await fetch(`/api/obs/test-connection`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ host, port, password })
            });
            
            const result = await response.json();
            
            if (result.success) {
                if (statusDot) statusDot.classList.add('connected');
                if (statusText) statusText.textContent = 'Connected';
                this.loadOBSScenes();
            } else {
                if (statusDot) statusDot.classList.remove('connected');
                if (statusText) statusText.textContent = 'Connection failed';
            }
        } catch (error) {
            console.error('OBS connection test failed:', error);
            if (statusDot) statusDot.classList.remove('connected');
            if (statusText) statusText.textContent = 'Connection failed';
        }
    }
    
    async loadOBSScenes() {
        try {
            const response = await fetch('/api/obs/scenes');
            const result = await response.json();
            
            if (result.success) {
                this.renderOBSScenes(result.scenes);
            }
        } catch (error) {
            console.error('Failed to load OBS scenes:', error);
        }
    }
    
    renderOBSScenes(scenes) {
        const sceneList = document.getElementById('scene-list');
        if (!sceneList) return;
        
        if (scenes.length === 0) {
            sceneList.innerHTML = `
                <div class="empty-scenes">
                    <span class="material-symbols-rounded">slideshow</span>
                    <p>No scenes available</p>
                    <p>Create scenes in OBS Studio</p>
                </div>
            `;
            return;
        }
        
        const scenesHTML = scenes.map(scene => `
            <div class="scene-item">
                <div class="scene-info">
                    <span class="scene-name">${scene.name}</span>
                    <span class="scene-type">${scene.type}</span>
                </div>
                <div class="scene-actions">
                    <button class="btn btn-secondary" onclick="settingsComponent.switchOBSScene('${scene.name}')">
                        <span class="material-symbols-rounded">play_arrow</span>
                        Switch
                    </button>
                </div>
            </div>
        `).join('');
        
        sceneList.innerHTML = scenesHTML;
    }
    
    async switchOBSScene(sceneName) {
        try {
            const response = await fetch('/api/obs/switch-scene', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ sceneName })
            });
            
            const result = await response.json();
            if (result.success) {
                console.log(`Switched to scene: ${sceneName}`);
            }
        } catch (error) {
            console.error('Failed to switch OBS scene:', error);
        }
    }
    
    // ========== UTILITY FUNCTIONS ==========
    
    copyToClipboard(elementId) {
        const element = document.getElementById(elementId);
        if (!element) return;
        
        element.select();
        element.setSelectionRange(0, 99999); // For mobile devices
        
        try {
            document.execCommand('copy');
            this.showToast('Link copied to clipboard');
        } catch (err) {
            console.error('Failed to copy to clipboard:', err);
            this.showToast('Failed to copy link');
        }
    }
    
    showToast(message) {
        // Create a simple toast notification
        const toast = document.createElement('div');
        toast.className = 'toast-notification';
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: var(--md-sys-color-primary);
            color: var(--md-sys-color-on-primary);
            padding: var(--md-sys-spacing-medium);
            border-radius: var(--md-sys-shape-corner-medium);
            z-index: 1000;
            animation: slideIn 0.3s ease-out;
        `;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s ease-in';
            setTimeout(() => {
                document.body.removeChild(toast);
            }, 300);
        }, 2000);
    }
    
    // ========== THEME MANAGEMENT ==========
    
    setTheme(theme) {
        // Update active button
        document.querySelectorAll('.theme-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        const activeBtn = document.querySelector(`[data-theme="${theme}"]`);
        if (activeBtn) {
            activeBtn.classList.add('active');
        }
        
        // Apply theme
        this.settings.theme = theme;
        this.saveSettings();
        
        // Notify theme manager
        if (window.themeManager) {
            window.themeManager.setTheme(theme);
        }
    }
    
    setAccentColor(color) {
        // Update active button
        document.querySelectorAll('.color-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        const activeBtn = document.querySelector(`[data-color="${color}"]`);
        if (activeBtn) {
            activeBtn.classList.add('active');
        }
        
        // Apply accent color
        this.settings.accentColor = color;
        this.saveSettings();
        
        // Update CSS custom properties
        this.updateAccentColor(color);
    }
    
    updateAccentColor(color) {
        const colors = {
            blue: '#2196F3',
            green: '#4CAF50',
            purple: '#9C27B0',
            orange: '#FF9800',
            red: '#F44336',
            teal: '#009688'
        };
        
        const colorValue = colors[color] || colors.blue;
        document.documentElement.style.setProperty('--md-sys-color-primary', colorValue);
    }
    
    // ========== SETTINGS MANAGEMENT ==========
    
    loadSettings() {
        const savedSettings = localStorage.getItem('dxpr_settings');
        if (savedSettings) {
            this.settings = JSON.parse(savedSettings);
        } else {
            this.settings = this.getDefaultSettings();
        }
        
        this.applySettings();
    }
    
    saveSettings() {
        localStorage.setItem('dxpr_settings', JSON.stringify(this.settings));
    }
    
    getDefaultSettings() {
        return {
            theme: 'auto',
            accentColor: 'blue',
            obs: {
                host: 'localhost',
                port: '4444',
                password: ''
            },
            bible: {
                primaryBible: 'RV60',
                secondaryBible: '',
                historyLimit: 25,
                showVerseNumbers: true,
                showChapterNumbers: true,
                showSecondaryBible: false,
                installedBibles: {
                    'RV60': {
                        name: 'Reina Valera 1960',
                        code: 'RV60',
                        isDefault: true,
                        filePath: 'RV60.xml'
                    },
                    'NR94': {
                        name: 'Nueva Reina Valera',
                        code: 'NR94',
                        isDefault: true,
                        filePath: 'NR94.xml'
                    }
                }
            },
            songs: {
                showChords: true,
                showSlideNumbers: true,
                defaultFontSize: 'medium'
            },
            display: {
                compactMode: false,
                animationsEnabled: true
            }
        };
    }
    
    applySettings() {
        // Apply theme
        if (this.settings.theme) {
            this.setTheme(this.settings.theme);
        }
        
        // Apply accent color
        if (this.settings.accentColor) {
            this.setAccentColor(this.settings.accentColor);
        }
        
        // Apply form values
        this.updateFormValues();
        
        // Apply display settings
        this.applyDisplaySettings();
    }
    
    updateFormValues() {
        // OBS settings
        const obsHost = document.getElementById('obs-host');
        const obsPort = document.getElementById('obs-port');
        const obsPassword = document.getElementById('obs-password');
        
        if (obsHost && this.settings.obs?.host) obsHost.value = this.settings.obs.host;
        if (obsPort && this.settings.obs?.port) obsPort.value = this.settings.obs.port;
        if (obsPassword && this.settings.obs?.password) obsPassword.value = this.settings.obs.password;
        
        // Bible settings
        const primaryBible = document.getElementById('primary-bible');
        const secondaryBible = document.getElementById('secondary-bible');
        const historyLimit = document.getElementById('history-limit');
        const showSecondaryBible = document.getElementById('show-secondary-bible');
        
        if (primaryBible && this.settings.bible?.primaryBible) {
            primaryBible.value = this.settings.bible.primaryBible;
        }
        if (secondaryBible && this.settings.bible?.secondaryBible) {
            secondaryBible.value = this.settings.bible.secondaryBible;
        }
        if (historyLimit && this.settings.bible?.historyLimit) {
            historyLimit.value = this.settings.bible.historyLimit;
        }
        if (showSecondaryBible && this.settings.bible?.showSecondaryBible !== undefined) {
            showSecondaryBible.checked = this.settings.bible.showSecondaryBible;
        }
        
        // Update bible selectors with installed bibles
        this.updateBibleSelectors();
        this.updateInstalledBiblesList();
        
        // Checkboxes
        const checkboxes = {
            'show-verse-numbers': this.settings.bible?.showVerseNumbers,
            'show-chapter-numbers': this.settings.bible?.showChapterNumbers,
            'show-cross-references': this.settings.bible?.showCrossReferences,
            'compact-mode': this.settings.display?.compactMode,
            'animations-enabled': this.settings.display?.animationsEnabled,
            'show-chords': this.settings.songs?.showChords,
            'show-slide-numbers': this.settings.songs?.showSlideNumbers
        };
        
        Object.entries(checkboxes).forEach(([id, value]) => {
            const checkbox = document.getElementById(id);
            if (checkbox && value !== undefined) {
                checkbox.checked = value;
            }
        });
        
        // Font size
        const defaultFontSize = document.getElementById('default-font-size');
        if (defaultFontSize && this.settings.songs?.defaultFontSize) {
            defaultFontSize.value = this.settings.songs.defaultFontSize;
        }
    }
    
    applyDisplaySettings() {
        const body = document.body;
        
        // Compact mode
        if (this.settings.display?.compactMode) {
            body.classList.add('compact-mode');
        } else {
            body.classList.remove('compact-mode');
        }
        
        // Animations
        if (!this.settings.display?.animationsEnabled) {
            body.classList.add('no-animations');
        } else {
            body.classList.remove('no-animations');
        }
    }
    
    // ========== ACTION HANDLERS ==========
    
    clearBibleHistory() {
        if (confirm('Are you sure you want to clear Bible history?')) {
            localStorage.removeItem('dxpr_bible_history');
            this.showToast('Bible history cleared');
        }
    }
    
    exportSongsLibrary() {
        const songs = localStorage.getItem('dxpr_songs');
        if (!songs) {
            this.showToast('No songs to export');
            return;
        }
        
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(songs);
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", "dxpr_songs_backup.json");
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
        
        this.showToast('Songs library exported');
    }
    
    importSongsLibrary() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    try {
                        const songs = JSON.parse(e.target.result);
                        localStorage.setItem('dxpr_songs', JSON.stringify(songs));
                        this.showToast('Songs library imported successfully');
                        this.updateLibraryStats();
                    } catch (error) {
                        this.showToast('Invalid file format');
                    }
                };
                reader.readAsText(file);
            }
        };
        input.click();
    }
    
    clearSongsLibrary() {
        if (confirm('Are you sure you want to clear the entire songs library? This action cannot be undone.')) {
            localStorage.removeItem('dxpr_songs');
            this.showToast('Songs library cleared');
            this.updateLibraryStats();
        }
    }
    
    checkForUpdates() {
        this.showToast('Checking for updates...');
        // This would typically make an API call to check for updates
        setTimeout(() => {
            this.showToast('No updates available');
        }, 2000);
    }
    
    exportLogs() {
        const logs = {
            timestamp: new Date().toISOString(),
            settings: this.settings,
            userAgent: navigator.userAgent,
            screenResolution: `${screen.width}x${screen.height}`,
            windowSize: `${window.innerWidth}x${window.innerHeight}`
        };
        
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(logs, null, 2));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", "dxpr_logs.json");
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
        
        this.showToast('Logs exported');
    }
    
    resetSettings() {
        if (confirm('Are you sure you want to reset all settings to default? This action cannot be undone.')) {
            this.settings = this.getDefaultSettings();
            this.saveSettings();
            this.applySettings();
            this.showToast('Settings reset to default');
        }
    }
    
    // ========== SYSTEM INFO ==========
    
    updateSystemInfo() {
        const buildDate = document.getElementById('build-date');
        const browserInfo = document.getElementById('browser-info');
        const screenResolution = document.getElementById('screen-resolution');
        
        if (buildDate) {
            buildDate.textContent = new Date().toLocaleDateString();
        }
        
        if (browserInfo) {
            browserInfo.textContent = this.getBrowserInfo();
        }
        
        if (screenResolution) {
            screenResolution.textContent = `${screen.width}x${screen.height}`;
        }
    }
    
    getBrowserInfo() {
        const userAgent = navigator.userAgent;
        let browserName = 'Unknown';
        
        if (userAgent.includes('Chrome')) browserName = 'Chrome';
        else if (userAgent.includes('Firefox')) browserName = 'Firefox';
        else if (userAgent.includes('Safari')) browserName = 'Safari';
        else if (userAgent.includes('Edge')) browserName = 'Edge';
        
        return browserName;
    }
    
    updateLibraryStats() {
        const totalSongs = document.getElementById('total-songs');
        const totalSlides = document.getElementById('total-slides');
        const librarySize = document.getElementById('library-size');
        
        const songs = localStorage.getItem('dxpr_songs');
        if (songs) {
            const songsData = JSON.parse(songs);
            const songCount = songsData.length;
            let slideCount = 0;
            
            songsData.forEach(song => {
                if (song.chordpro) {
                    const slides = song.chordpro.split('\n\n').filter(slide => slide.trim());
                    slideCount += slides.length;
                }
            });
            
            const sizeInBytes = new Blob([songs]).size;
            const sizeInKB = Math.round(sizeInBytes / 1024);
            
            if (totalSongs) totalSongs.textContent = songCount;
            if (totalSlides) totalSlides.textContent = slideCount;
            if (librarySize) librarySize.textContent = `${sizeInKB} KB`;
        } else {
            if (totalSongs) totalSongs.textContent = '0';
            if (totalSlides) totalSlides.textContent = '0';
            if (librarySize) librarySize.textContent = '0 KB';
        }
    }
    
    // ========== CALLBACKS ==========
    
    setCallbacks(callbacks) {
        this.callbacks = callbacks;
    }
    
    // ========== PUBLIC API ==========
    
    getSettings() {
        return this.settings;
    }
    
    updateSetting(key, value) {
        this.settings[key] = value;
        this.saveSettings();
        this.applySettings();
    }
    
    // ========== MOBILE ENHANCEMENTS ==========
    
    setupMobileEnhancements() {
        // Detectar si es dispositivo móvil
        this.isMobile = window.innerWidth <= 768;
        
        // Agregar indicadores de scroll para tabs
        this.addScrollIndicators();
        
        // Mejorar feedback táctil
        this.addTouchFeedback();
        
        // Escuchar cambios de orientación
        window.addEventListener('orientationchange', () => {
            setTimeout(() => {
                this.isMobile = window.innerWidth <= 768;
                this.scrollToActiveTab();
            }, 100);
        });
        
        // Escuchar cambios de tamaño de ventana
        window.addEventListener('resize', () => {
            this.isMobile = window.innerWidth <= 768;
        });
    }
    
    scrollToActiveTab() {
        if (!this.isMobile) return;
        
        const activeTab = document.querySelector('.nav-item.active');
        const navContainer = document.querySelector('.settings-nav');
        
        if (activeTab && navContainer) {
            const containerRect = navContainer.getBoundingClientRect();
            const tabRect = activeTab.getBoundingClientRect();
            
            // Calcular posición de scroll para centrar la tab activa
            const scrollLeft = activeTab.offsetLeft - (containerRect.width / 2) + (tabRect.width / 2);
            
            navContainer.scrollTo({
                left: scrollLeft,
                behavior: 'smooth'
            });
        }
    }
    
    addScrollIndicators() {
        if (!this.isMobile) return;
        
        const navContainer = document.querySelector('.settings-nav');
        if (!navContainer) return;
        
        // Crear indicadores de scroll
        const leftIndicator = document.createElement('div');
        leftIndicator.className = 'scroll-indicator left';
        leftIndicator.innerHTML = '<span class="material-symbols-rounded">chevron_left</span>';
        
        const rightIndicator = document.createElement('div');
        rightIndicator.className = 'scroll-indicator right';
        rightIndicator.innerHTML = '<span class="material-symbols-rounded">chevron_right</span>';
        
        // Agregar estilos para los indicadores
        const style = document.createElement('style');
        style.textContent = `
            .scroll-indicator {
                position: absolute;
                top: 50%;
                transform: translateY(-50%);
                width: 32px;
                height: 32px;
                background: var(--md-sys-color-surface-container-highest);
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                box-shadow: var(--md-sys-elevation-level2);
                opacity: 0;
                transition: opacity 0.3s ease;
                z-index: 10;
                pointer-events: none;
            }
            
            .scroll-indicator.left {
                left: 8px;
            }
            
            .scroll-indicator.right {
                right: 8px;
            }
            
            .scroll-indicator.visible {
                opacity: 0.8;
            }
            
            .scroll-indicator .material-symbols-rounded {
                font-size: 18px;
                color: var(--md-sys-color-on-surface);
            }
            
            .settings-sidebar {
                position: relative;
            }
        `;
        document.head.appendChild(style);
        
        // Agregar indicadores al DOM
        const sidebar = document.querySelector('.settings-sidebar');
        if (sidebar) {
            sidebar.appendChild(leftIndicator);
            sidebar.appendChild(rightIndicator);
        }
        
        // Función para actualizar visibilidad de indicadores
        const updateIndicators = () => {
            const scrollLeft = navContainer.scrollLeft;
            const scrollWidth = navContainer.scrollWidth;
            const clientWidth = navContainer.clientWidth;
            
            leftIndicator.classList.toggle('visible', scrollLeft > 10);
            rightIndicator.classList.toggle('visible', scrollLeft < scrollWidth - clientWidth - 10);
        };
        
        // Escuchar eventos de scroll
        navContainer.addEventListener('scroll', updateIndicators);
        
        // Actualizar inicialmente
        setTimeout(updateIndicators, 100);
    }
    
    addTouchFeedback() {
        const navItems = document.querySelectorAll('.nav-item');
        
        navItems.forEach(item => {
            // Agregar feedback visual al tocar
            item.addEventListener('touchstart', () => {
                item.style.transform = 'scale(0.95)';
                item.style.transition = 'transform 0.1s ease';
            });
            
            item.addEventListener('touchend', () => {
                setTimeout(() => {
                    item.style.transform = '';
                    item.style.transition = '';
                }, 100);
            });
            
            item.addEventListener('touchcancel', () => {
                item.style.transform = '';
                item.style.transition = '';
            });
        });
        
        // Agregar feedback a botones
        const buttons = document.querySelectorAll('.btn, .btn-primary, .btn-secondary');
        buttons.forEach(button => {
            button.addEventListener('touchstart', () => {
                button.style.transform = 'scale(0.98)';
                button.style.transition = 'transform 0.1s ease';
            });
            
            button.addEventListener('touchend', () => {
                setTimeout(() => {
                    button.style.transform = '';
                    button.style.transition = '';
                }, 100);
            });
            
            button.addEventListener('touchcancel', () => {
                button.style.transform = '';
                button.style.transition = '';
            });
        });
    }
    
    async handleBibleFileUpload(files) {
        if (!files || files.length === 0) return;
        
        const uploadProgress = document.getElementById('upload-progress');
        const progressFill = document.getElementById('progress-fill');
        const progressText = document.getElementById('progress-text');
        const uploadStatus = document.getElementById('upload-status');
        
        uploadProgress.style.display = 'block';
        uploadStatus.innerHTML = '';
        
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            
            if (!file.name.toLowerCase().endsWith('.xml')) {
                this.showUploadStatus('error', `${file.name}: Only XML files are supported`);
                continue;
            }
            
            try {
                progressText.textContent = `Uploading ${file.name}...`;
                progressFill.style.width = '0%';
                
                const formData = new FormData();
                formData.append('bible_file', file);
                
                const response = await fetch('/api/upload-bible', {
                    method: 'POST',
                    body: formData
                });
                
                progressFill.style.width = '50%';
                
                if (response.ok) {
                    const result = await response.json();
                    progressFill.style.width = '100%';
                    
                    // Add to installed bibles
                    this.settings.bible.installedBibles = this.settings.bible.installedBibles || {};
                    this.settings.bible.installedBibles[result.code] = {
                        name: result.name,
                        code: result.code,
                        isDefault: false,
                        filePath: result.filePath
                    };
                    
                    this.saveSettings();
                    this.updateBibleSelectors();
                    this.updateInstalledBiblesList();
                    
                    this.showUploadStatus('success', `${result.name} (${result.code}) uploaded successfully`);
                } else {
                    const error = await response.json();
                    this.showUploadStatus('error', `${file.name}: ${error.message || 'Upload failed'}`);
                }
            } catch (error) {
                console.error('Upload error:', error);
                this.showUploadStatus('error', `${file.name}: Upload failed - ${error.message}`);
            }
        }
        
        setTimeout(() => {
            uploadProgress.style.display = 'none';
        }, 2000);
    }
    
    showUploadStatus(type, message) {
        const uploadStatus = document.getElementById('upload-status');
        uploadStatus.className = `upload-status ${type}`;
        uploadStatus.textContent = message;
    }
    
    updateBibleSelectors() {
        const primaryBible = document.getElementById('primary-bible');
        const secondaryBible = document.getElementById('secondary-bible');
        
        if (!primaryBible || !secondaryBible) return;
        
        const installedBibles = this.settings.bible?.installedBibles || {};
        const currentPrimary = primaryBible.value;
        const currentSecondary = secondaryBible.value;
        
        // Clear existing options
        primaryBible.innerHTML = '';
        secondaryBible.innerHTML = '<option value="">None</option>';
        
        // Add options for each installed bible
        Object.values(installedBibles).forEach(bible => {
            const primaryOption = new Option(`${bible.name} (${bible.code})`, bible.code);
            const secondaryOption = new Option(`${bible.name} (${bible.code})`, bible.code);
            
            primaryBible.appendChild(primaryOption);
            secondaryBible.appendChild(secondaryOption);
        });
        
        // Restore selected values
        if (currentPrimary && installedBibles[currentPrimary]) {
            primaryBible.value = currentPrimary;
        }
        if (currentSecondary && installedBibles[currentSecondary]) {
            secondaryBible.value = currentSecondary;
        }
    }
    
    async updateInstalledBiblesList() {
        const installedBiblesContainer = document.getElementById('installed-bibles');
        if (!installedBiblesContainer) return;
        
        try {
            // Fetch installed bibles from server
            const response = await fetch('/api/installed-bibles');
            if (!response.ok) {
                throw new Error('Failed to fetch installed bibles');
            }
            
            const installedBibles = await response.json();
            
            // Update local settings with server data
            this.settings.bible = this.settings.bible || {};
            this.settings.bible.installedBibles = {};
            
            installedBibles.forEach(bible => {
                this.settings.bible.installedBibles[bible.code] = bible;
            });
            
            this.saveSettings();
            
            installedBiblesContainer.innerHTML = '';
            
            installedBibles.forEach(bible => {
                const bibleItem = document.createElement('div');
                bibleItem.className = `bible-item ${bible.isDefault ? 'default-bible' : ''}`;
                
                bibleItem.innerHTML = `
                    <div class="bible-info">
                        <span class="bible-name">${bible.name}</span>
                        <span class="bible-code">${bible.code}</span>
                    </div>
                    <div class="bible-actions">
                        <span class="bible-status ${bible.isDefault ? 'default' : 'loaded'}">
                            ${bible.isDefault ? 'Default' : 'Loaded'}
                        </span>
                        ${!bible.isDefault ? `
                            <button class="bible-action-btn" onclick="settingsComponent.removeBible('${bible.code}')" title="Remove Bible">
                                <span class="material-symbols-rounded">delete</span>
                            </button>
                        ` : ''}
                    </div>
                `;
                
                installedBiblesContainer.appendChild(bibleItem);
            });
        } catch (error) {
            console.error('Error loading installed bibles:', error);
            // Fallback to mock data when API is not available
            this.loadMockInstalledBibles(installedBiblesContainer);
        }
    }
    
    loadMockInstalledBibles(installedBiblesContainer) {
        // Mock data for installed bibles when API is not available
        const mockBibles = [
            {
                code: 'RVR1960',
                name: 'Reina-Valera 1960',
                isDefault: true
            },
            {
                code: 'NVI',
                name: 'Nueva Versión Internacional',
                isDefault: false
            },
            {
                code: 'LBLA',
                name: 'La Biblia de las Américas',
                isDefault: false
            }
        ];
        
        // Update local settings with mock data
        this.settings.bible = this.settings.bible || {};
        this.settings.bible.installedBibles = {};
        
        mockBibles.forEach(bible => {
            this.settings.bible.installedBibles[bible.code] = bible;
        });
        
        this.saveSettings();
        
        installedBiblesContainer.innerHTML = '';
        
        mockBibles.forEach(bible => {
            const bibleItem = document.createElement('div');
            bibleItem.className = `bible-item ${bible.isDefault ? 'default-bible' : ''}`;
            
            bibleItem.innerHTML = `
                <div class="bible-info">
                    <span class="bible-name">${bible.name}</span>
                    <span class="bible-code">${bible.code}</span>
                </div>
                <div class="bible-actions">
                    <span class="bible-status ${bible.isDefault ? 'default' : 'loaded'}">
                        ${bible.isDefault ? 'Default' : 'Loaded'}
                    </span>
                    ${!bible.isDefault ? `
                        <button class="bible-action-btn" onclick="settingsComponent.removeBible('${bible.code}')" title="Remove Bible">
                            <span class="material-symbols-rounded">delete</span>
                        </button>
                    ` : ''}
                </div>
            `;
            
            installedBiblesContainer.appendChild(bibleItem);
        });
        
        this.showToast('Modo offline: biblias simuladas cargadas', 'info');
    }
    
    async removeBible(code) {
        if (!confirm(`Are you sure you want to remove this Bible translation?`)) {
            return;
        }
        
        try {
            const response = await fetch(`/api/remove-bible/${code}`, {
                method: 'DELETE'
            });
            
            if (response.ok) {
                // Remove from settings
                delete this.settings.bible.installedBibles[code];
                
                // Update selectors if this bible was selected
                if (this.settings.bible.primaryBible === code) {
                    this.settings.bible.primaryBible = 'RV60';
                }
                if (this.settings.bible.secondaryBible === code) {
                    this.settings.bible.secondaryBible = '';
                }
                
                this.saveSettings();
                this.updateBibleSelectors();
                this.updateInstalledBiblesList();
                this.updateFormValues();
                
                this.showUploadStatus('success', 'Bible removed successfully');
            } else {
                const error = await response.json();
                this.showUploadStatus('error', `Failed to remove Bible: ${error.message}`);
            }
        } catch (error) {
            console.error('Remove bible error:', error);
            this.showUploadStatus('error', 'Failed to remove Bible');
        }
    }
    
    notifyBibleComponent() {
        // Notify BibleComponent of settings changes
        if (window.bibleComponent && typeof window.bibleComponent.updateBibleSettings === 'function') {
            window.bibleComponent.updateBibleSettings({
                primaryBible: this.settings.bible?.primaryBible || 'RV60',
                secondaryBible: this.settings.bible?.secondaryBible || '',
                showSecondaryBible: this.settings.bible?.showSecondaryBible || false
            });
        }
    }
    
    applyBibleChanges() {
        // Get current Bible settings from form
        const primaryBible = document.getElementById('primary-bible')?.value || 'RV60';
        const secondaryBible = document.getElementById('secondary-bible')?.value || '';
        const showSecondaryBible = document.getElementById('show-secondary-bible')?.checked || false;
        
        // Update settings
        this.settings.bible = this.settings.bible || {};
        this.settings.bible.primaryBible = primaryBible;
        this.settings.bible.secondaryBible = secondaryBible;
        this.settings.bible.showSecondaryBible = showSecondaryBible;
        
        // Save settings
        this.saveSettings();
        
        // Update Bible selectors
        this.updateBibleSelectors();
        
        // Notify Bible component
        this.notifyBibleComponent();
        
        // Show confirmation message
        this.showToast('Bible settings applied successfully!');
        
        // Force reload of Bible content if Bible component exists
        if (window.bibleComponent && typeof window.bibleComponent.reloadCurrentVerse === 'function') {
            window.bibleComponent.reloadCurrentVerse();
        }
    }
}

// Initialize the component
let settingsComponent;

// Función para inicializar el componente
function initializeSettingsComponent() {
    if (!settingsComponent) {
        settingsComponent = new SettingsComponent();
        console.log('SettingsComponent inicializado');
    }
}

// Inicializar inmediatamente si el DOM ya está listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeSettingsComponent);
} else {
    // DOM ya está listo, inicializar inmediatamente
    initializeSettingsComponent();
}

// También exponer la función globalmente para inicialización manual
window.initializeSettingsComponent = initializeSettingsComponent;

// Add CSS for toast notifications
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
    
    .compact-mode {
        --md-sys-spacing-small: 8px;
        --md-sys-spacing-medium: 12px;
        --md-sys-spacing-large: 16px;
    }
    
    .no-animations * {
        animation: none !important;
        transition: none !important;
    }
`;
document.head.appendChild(style);
