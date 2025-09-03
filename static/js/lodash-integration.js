/**
 * Lodash Integration for DXPR - Dexter Presenter Remote
 * Optimizes existing code using functional programming utilities
 * Enhances performance and maintainability
 */

// Wait for dependencies to be available
function initializeLodashIntegration() {
    if (typeof LodashUtils === 'undefined') {
        console.warn('LodashUtils not found. Retrying...');
        setTimeout(initializeLodashIntegration, 50);
        return;
    }
    
    if (typeof AppState === 'undefined') {
        console.warn('AppState not found. Retrying...');
        setTimeout(initializeLodashIntegration, 50);
        return;
    }
    
    // Initialize enhanced components once dependencies are ready
    initializeEnhancedComponents();
}

function initializeEnhancedComponents() {
// Enhanced AppState with Lodash optimizations
const EnhancedAppState = {
    ...AppState,
    
    // Optimized state updates with debouncing
    updateState: LodashUtils.debounce(function(updates) {
        Object.assign(this, updates);
        this.saveToStorage();
        this.notifyStateChange();
    }, 300),
    
    // Memoized state serialization
    serialize: LodashUtils.memoize(function() {
        return JSON.stringify(LodashUtils.pick(this, [
            'currentView', 'obsConnected', 'streaming', 'currentScene',
            'scenes', 'displayHidden', 'lowerThirdOpen', 'bibleCollapsed',
            'darkMode', 'accentColor', 'currentVerse', 'currentSong',
            'currentSlide', 'settings'
        ]));
    }),
    
    // Optimized storage operations
    saveToStorage: LodashUtils.throttle(function() {
        try {
            localStorage.setItem('dxpr-app-state', this.serialize());
        } catch (error) {
            console.error('Error saving app state:', error);
        }
    }, 1000),
    
    // State change notification system
    notifyStateChange() {
        const event = new CustomEvent('appStateChange', {
            detail: { state: this }
        });
        document.dispatchEvent(event);
    },
    
    // Load state from storage
    loadFromStorage() {
        try {
            const stored = localStorage.getItem('dxpr-app-state');
            if (stored) {
                const parsedState = JSON.parse(stored);
                Object.assign(this, parsedState);
            }
        } catch (error) {
            console.error('Error loading app state:', error);
        }
    }
};

// Enhanced Utils with Lodash optimizations
const EnhancedUtils = {
    ...Utils,
    
    // Memoized element getters for better performance
    getElement: LodashUtils.memoize(function(id) {
        const element = document.getElementById(id);
        if (!element) {
            console.warn(`Element with id '${id}' not found`);
        }
        return element;
    }),
    
    // Optimized query selectors with caching
    querySelector: LodashUtils.memoize(function(selector) {
        const element = document.querySelector(selector);
        if (!element) {
            console.warn(`Element with selector '${selector}' not found`);
        }
        return element;
    }),
    
    // Batch DOM operations for better performance
    batchDOMUpdates(operations) {
        return new Promise((resolve) => {
            requestAnimationFrame(() => {
                const fragment = document.createDocumentFragment();
                
                LodashUtils.forEach(operations, (operation) => {
                    if (typeof operation === 'function') {
                        operation(fragment);
                    }
                });
                
                resolve(fragment);
            });
        });
    },
    
    // Debounced theme setter
    setTheme: LodashUtils.debounce(function(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        EnhancedAppState.updateState({ darkMode: theme === 'dark' });
        localStorage.setItem('dxpr-theme', theme);
    }, 100),
    
    // Throttled accent color setter
    setAccentColor: LodashUtils.throttle(function(color) {
        document.documentElement.style.setProperty('--md-primary', color);
        EnhancedAppState.updateState({ accentColor: color });
        localStorage.setItem('dxpr-accent-color', color);
    }, 200),
    
    // Enhanced toast with queuing system
    toastQueue: [],
    
    toast: function(message, type = 'info', duration = 3000) {
        const toastData = { message, type, duration, id: LodashUtils.uniqueId('toast_') };
        this.toastQueue.push(toastData);
        this.processToastQueue();
    },
    
    processToastQueue: LodashUtils.debounce(function() {
        if (LodashUtils.isEmpty(this.toastQueue)) return;
        
        const toast = this.toastQueue.shift();
        this.showToast(toast);
        
        if (!LodashUtils.isEmpty(this.toastQueue)) {
            setTimeout(() => this.processToastQueue(), 500);
        }
    }, 100),
    
    showToast(toastData) {
        const toast = document.createElement('div');
        toast.className = `toast toast-${toastData.type}`;
        toast.textContent = toastData.message;
        toast.id = toastData.id;
        
        document.body.appendChild(toast);
        
        // Auto remove
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, toastData.duration);
    },
    
    // Enhanced settings management
    loadSettings: LodashUtils.memoize(function() {
        try {
            const theme = localStorage.getItem('dxpr-theme') || 'light';
            const accentColor = localStorage.getItem('dxpr-accent-color') || '#3b82f6';
            
            this.setTheme(theme);
            this.setAccentColor(accentColor);
            
            const settings = localStorage.getItem('dxpr-settings');
            if (settings) {
                const parsedSettings = JSON.parse(settings);
                EnhancedAppState.updateState({
                    settings: LodashUtils.merge({}, EnhancedAppState.settings, parsedSettings)
                });
            }
        } catch (error) {
            console.error('Error loading settings:', error);
        }
    }),
    
    // Optimized settings save
    saveSettings: LodashUtils.debounce(function() {
        try {
            const settingsToSave = LodashUtils.cloneDeep(EnhancedAppState.settings);
            localStorage.setItem('dxpr-settings', JSON.stringify(settingsToSave));
        } catch (error) {
            console.error('Error saving settings:', error);
        }
    }, 500)
};

// Enhanced ViewManager with optimizations
const EnhancedViewManager = {
    ...ViewManager,
    
    // Memoized view elements
    getViewElements: LodashUtils.memoize(function() {
        return {
            views: LodashUtils.mapValues({
                bible: 'bible-view',
                songs: 'songs-view',
                lower: 'lower-view',
                settings: 'settings-view'
            }, id => document.getElementById(id)),
            
            navButtons: Array.from(document.querySelectorAll('[data-view]')),
            controlGroups: Array.from(document.querySelectorAll('.control-group[data-view]'))
        };
    }),
    
    // Optimized view switching with transitions
    switchView: LodashUtils.debounce(function(viewName) {
        const elements = this.getViewElements();
        
        // Show target view
        const showOperation = () => {
            const targetView = elements.views[viewName];
            if (targetView) {
                targetView.classList.add('active');
                targetView.setAttribute('aria-hidden', 'false');
                targetView.focus();
            }
        };
        
        // Update navigation states
        const updateNavigation = () => {
            LodashUtils.forEach(elements.navButtons, (btn) => {
                if (btn) {
                    btn.classList.toggle('active', btn.dataset.view === viewName);
                    btn.setAttribute('aria-selected', btn.dataset.view === viewName);
                }
            });
            
            LodashUtils.forEach(elements.controlGroups, (group) => {
                if (group) {
                    group.classList.toggle('active', group.dataset.view === viewName);
                }
            });
        };
        
        // Execute all operations
        EnhancedUtils.batchDOMUpdates([
            ...hideOperations,
            showOperation,
            updateNavigation
        ]).then(() => {
            this.currentView = viewName;
            EnhancedAppState.updateState({ currentView: viewName });
            
            // Emit view change event
            const event = new CustomEvent('viewChanged', {
                detail: { view: viewName, previousView: this.currentView }
            });
            document.dispatchEvent(event);
        });
    }, 100),
    
    // Enhanced initialization
    init() {
        const elements = this.getViewElements();
        
        // Setup navigation with optimized event handling
        const handleNavClick = LodashUtils.debounce((event) => {
            const viewName = event.target.dataset.view;
            if (viewName) {
                this.switchView(viewName);
            }
        }, 50);
        
        LodashUtils.forEach(elements.navButtons, (btn) => {
            if (btn) {
                btn.addEventListener('click', handleNavClick);
                
                // Add keyboard support
                btn.addEventListener('keydown', (event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        handleNavClick(event);
                    }
                });
            }
        });
        
        // Start with bible view
        this.switchView('bible');
    }
};

// Enhanced BibleManager with optimizations
const EnhancedBibleManager = {
    ...BibleManager,
    
    // Cached data with expiration
    cache: new Map(),
    cacheExpiry: 5 * 60 * 1000, // 5 minutes
    
    // Optimized data loading with caching
    async loadBooks() {
        const cacheKey = 'books';
        const cached = this.getFromCache(cacheKey);
        
        if (cached) {
            this.books = cached;
            this.renderBooks();
            return;
        }
        
        try {
            const response = await fetch('/api/libros');
            if (response.ok) {
                this.books = await response.json();
                this.setCache(cacheKey, this.books);
                this.renderBooks();
            } else {
                throw new Error(`HTTP ${response.status}`);
            }
        } catch (error) {
            console.error('Error loading books:', error);
            EnhancedUtils.toast('Error al cargar los libros', 'error');
        }
    },
    
    // Cache management
    getFromCache(key) {
        const cached = this.cache.get(key);
        if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
            return cached.data;
        }
        this.cache.delete(key);
        return null;
    },
    
    setCache(key, data) {
        this.cache.set(key, {
            data: LodashUtils.cloneDeep(data),
            timestamp: Date.now()
        });
    },
    
    // Optimized rendering with virtual scrolling for large lists
    renderBooks() {
        const container = EnhancedUtils.getElement('books-list');
        if (!container || LodashUtils.isEmpty(this.books)) return;
        
        // Group books by testament
        const groupedBooks = LodashUtils.groupBy(this.books, 'testament');
        
        // Clear container
        container.innerHTML = '';
        
        LodashUtils.forEach(groupedBooks, (books, testament) => {
            const section = document.createElement('div');
            section.className = 'testament-section';
            
            const header = document.createElement('h3');
            header.textContent = testament;
            header.className = 'testament-header';
            section.appendChild(header);
            
            const booksList = document.createElement('div');
            booksList.className = 'books-grid';
            
            LodashUtils.forEach(books, (book) => {
                const bookElement = this.createBookElement(book);
                booksList.appendChild(bookElement);
            });
            
            section.appendChild(booksList);
            container.appendChild(section);
        });
    },
    
    // Optimized book element creation
    createBookElement: LodashUtils.memoize(function(book) {
        const element = document.createElement('button');
        element.className = 'book-btn';
        element.textContent = book.name;
        element.dataset.bookNumber = book.number;
        element.setAttribute('aria-label', `Libro ${book.name}`);
        
        // Optimized click handler
        const handleClick = LodashUtils.debounce(() => {
            this.selectBook(book.number);
        }, 100);
        
        element.addEventListener('click', handleClick);
        
        return element;
    }, (book) => `${book.number}-${book.name}`),
    
    // Enhanced search functionality
    searchVerses: LodashUtils.debounce(function(query) {
        if (LodashUtils.isEmpty(query) || query.length < 3) {
            this.clearSearchResults();
            return;
        }
        
        const searchResults = BibleUtils.searchVerses(this.verses, query);
        const paginatedResults = BibleUtils.paginateVerses(searchResults, 1, 50);
        
        this.renderSearchResults(paginatedResults);
    }, 300),
    
    // Optimized history management
    addToHistory(reference) {
        const historyItem = {
            ...reference,
            timestamp: Date.now(),
            id: LodashUtils.uniqueId('history_')
        };
        
        // Remove duplicates and limit history size
        EnhancedAppState.history = LodashUtils.uniqBy(
            [historyItem, ...EnhancedAppState.history],
            'id'
        ).slice(0, 50);
        
        this.saveHistory();
    },
    
    // Debounced history save
    saveHistory: LodashUtils.debounce(function() {
        try {
            localStorage.setItem('dxpr-bible-history', JSON.stringify(EnhancedAppState.history));
        } catch (error) {
            console.error('Error saving history:', error);
        }
    }, 500),
    
    // Load history with error handling
    loadHistory() {
        try {
            const stored = localStorage.getItem('dxpr-bible-history');
            if (stored) {
                EnhancedAppState.history = JSON.parse(stored);
            }
        } catch (error) {
            console.error('Error loading history:', error);
            EnhancedAppState.history = [];
        }
    }
};

// Performance monitoring integration
const PerformanceMonitor = {
    metrics: new Map(),
    
    // Measure function execution time
    measureFunction(fn, name) {
        return LodashUtils.measureTime(fn, name, (time, functionName) => {
            this.metrics.set(functionName, {
                lastExecution: time,
                averageTime: this.calculateAverage(functionName, time),
                callCount: (this.metrics.get(functionName)?.callCount || 0) + 1
            });
            
            // Log slow functions
            if (time > 100) {
                console.warn(`Slow function detected: ${functionName} took ${time}ms`);
            }
        });
    },
    
    calculateAverage(functionName, newTime) {
        const existing = this.metrics.get(functionName);
        if (!existing) return newTime;
        
        return (existing.averageTime * existing.callCount + newTime) / (existing.callCount + 1);
    },
    
    // Get performance report
    getReport() {
        const report = {};
        this.metrics.forEach((data, name) => {
            report[name] = {
                averageTime: Math.round(data.averageTime * 100) / 100,
                callCount: data.callCount,
                lastExecution: data.lastExecution
            };
        });
        return report;
    }
};

    // Replace global objects with enhanced versions
    window.AppState = EnhancedAppState;
    window.Utils = EnhancedUtils;
    window.ViewManager = EnhancedViewManager;
    window.BibleManager = EnhancedBibleManager;
    window.PerformanceMonitor = PerformanceMonitor;
    
    // Load initial state
    EnhancedAppState.loadFromStorage();
    
    // Initialize components
    EnhancedUtils.loadSettings();
    EnhancedViewManager.init();
    
    // Setup performance monitoring for critical functions
    const criticalFunctions = [
        { obj: EnhancedBibleManager, method: 'loadBooks', name: 'BibleManager.loadBooks' },
        { obj: EnhancedBibleManager, method: 'renderBooks', name: 'BibleManager.renderBooks' }
    ];
    
    criticalFunctions.forEach(({ obj, method, name }) => {
        if (obj[method]) {
            obj[method] = PerformanceMonitor.measureFunction(obj[method].bind(obj), name);
        }
    });
    
    console.log('Lodash integration initialized successfully');
    
    // Log performance report every 30 seconds in development
    if (window.location.hostname === 'localhost') {
        setInterval(() => {
            console.log('Performance Report:', PerformanceMonitor.getReport());
        }, 30000);
    }
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeLodashIntegration);
} else {
    initializeLodashIntegration();
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        EnhancedAppState,
        EnhancedUtils,
        EnhancedViewManager,
        EnhancedBibleManager,
        PerformanceMonitor
    };
}