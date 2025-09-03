// ====== THEME MANAGER ======

class ThemeManager {
    constructor() {
        this.currentTheme = this.getStoredTheme() || this.getSystemTheme();
        this.init();
    }
    
    init() {
        this.applyTheme(this.currentTheme);
        this.setupEventListeners();
        this.setupSystemThemeListener();
    }
    
    getStoredTheme() {
        try {
            return localStorage.getItem('dxpr-theme');
        } catch (error) {
            console.warn('Could not read theme from localStorage:', error);
            return null;
        }
    }
    
    setStoredTheme(theme) {
        try {
            localStorage.setItem('dxpr-theme', theme);
        } catch (error) {
            console.warn('Could not save theme to localStorage:', error);
        }
    }
    
    getSystemTheme() {
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            return 'dark';
        }
        return 'light';
    }
    
    applyTheme(theme) {
        const root = document.documentElement;
        
        // Remove existing theme classes
        root.classList.remove('theme-light', 'theme-dark');
        
        // Add new theme class
        root.classList.add(`theme-${theme}`);
        
        // Set data attribute for CSS targeting
        root.setAttribute('data-theme', theme);
        
        // Store theme preference
        this.setStoredTheme(theme);
        
        // Update theme toggle button if it exists
        this.updateThemeToggle(theme);
        
        // Emit theme change event
        this.emitThemeChange(theme);
    }
    
    toggleTheme() {
        const newTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        this.currentTheme = newTheme;
        this.applyTheme(newTheme);
    }
    
    setTheme(theme) {
        if (theme === 'light' || theme === 'dark') {
            this.currentTheme = theme;
            this.applyTheme(theme);
        }
    }
    
    getCurrentTheme() {
        return this.currentTheme;
    }
    
    setupEventListeners() {
        // Listen for theme toggle button clicks
        document.addEventListener('click', (e) => {
            if (e.target.matches('[data-theme-toggle]')) {
                e.preventDefault();
                this.toggleTheme();
            }
        });
        
        // Listen for theme selection buttons
        document.addEventListener('click', (e) => {
            if (e.target.matches('[data-theme-select]')) {
                e.preventDefault();
                const theme = e.target.dataset.themeSelect;
                this.setTheme(theme);
            }
        });
    }
    
    setupSystemThemeListener() {
        if (window.matchMedia) {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            
            const handleChange = (e) => {
                // Only auto-switch if user hasn't manually set a preference
                const storedTheme = this.getStoredTheme();
                if (!storedTheme) {
                    const newTheme = e.matches ? 'dark' : 'light';
                    this.currentTheme = newTheme;
                    this.applyTheme(newTheme);
                }
            };
            
            // Modern browsers
            if (mediaQuery.addEventListener) {
                mediaQuery.addEventListener('change', handleChange);
            } else {
                // Legacy browsers
                mediaQuery.addListener(handleChange);
            }
        }
    }
    
    updateThemeToggle(theme) {
        const toggleButtons = document.querySelectorAll('[data-theme-toggle]');
        
        toggleButtons.forEach(button => {
            const icon = button.querySelector('.material-symbols-rounded');
            if (icon) {
                icon.textContent = theme === 'light' ? 'dark_mode' : 'light_mode';
            }
            
            // Update aria-label for accessibility
            button.setAttribute('aria-label', 
                theme === 'light' ? 'Cambiar a tema oscuro' : 'Cambiar a tema claro'
            );
        });
    }
    
    emitThemeChange(theme) {
        // Dispatch custom event
        const event = new CustomEvent('themechange', {
            detail: { theme }
        });
        document.dispatchEvent(event);
        
        // Emit to Socket.IO if available
        if (window.socket) {
            window.socket.emit('theme_change', { theme });
        }
    }
    
    // Utility methods for components
    isDark() {
        return this.currentTheme === 'dark';
    }
    
    isLight() {
        return this.currentTheme === 'light';
    }
    
    // Get theme-aware color
    getColor(colorName) {
        const colors = {
            primary: this.isDark() ? 'var(--md-primary-dark)' : 'var(--md-primary)',
            surface: this.isDark() ? 'var(--md-surface-dark)' : 'var(--md-surface)',
            onSurface: this.isDark() ? 'var(--md-on-surface-dark)' : 'var(--md-on-surface)',
            outline: this.isDark() ? 'var(--md-outline-dark)' : 'var(--md-outline)'
        };
        
        return colors[colorName] || colors.primary;
    }
}

// Initialize theme manager when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.themeManager = new ThemeManager();
});

// Export for global use
window.ThemeManager = ThemeManager;
