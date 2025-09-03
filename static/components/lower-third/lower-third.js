// ========== LOWER THIRD COMPONENT ==========

class LowerThirdComponent {
    constructor() {
        this.currentText = '';
        this.currentDescription = '';
        this.currentTheme = 'default';
        this.currentAnimation = 'slide-up';
        this.currentPosition = 'bottom-left';
        this.currentDuration = 10;
        this.isPreviewVisible = false;
        this.socket = io();
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.updatePreview();
    }
    
    // ========== EVENT HANDLERS ==========
    
    setupEventListeners() {
        // Text input handlers
        const mainTextInput = document.getElementById('lower-third-text');
        const descriptionInput = document.getElementById('lower-third-description');
        
        if (mainTextInput) {
            mainTextInput.addEventListener('input', (e) => {
                this.currentText = e.target.value;
                this.updateCharCount('text-char-count', e.target.value.length, 50);
                this.updatePreview();
            });
        }
        
        if (descriptionInput) {
            descriptionInput.addEventListener('input', (e) => {
                this.currentDescription = e.target.value;
                this.updateCharCount('description-char-count', e.target.value.length, 100);
                this.updatePreview();
            });
        }
        
        // Duration slider
        const durationSlider = document.getElementById('lower-third-duration');
        const durationValue = document.getElementById('duration-value');
        
        if (durationSlider) {
            durationSlider.addEventListener('input', (e) => {
                this.currentDuration = parseInt(e.target.value);
                if (durationValue) {
                    durationValue.textContent = `${this.currentDuration}s`;
                }
            });
        }
        
        // Color theme buttons
        document.querySelectorAll('.color-theme-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.setColorTheme(btn.dataset.theme);
            });
        });
        
        // Animation buttons
        document.querySelectorAll('.animation-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.setAnimation(btn.dataset.animation);
            });
        });
        
        // Position buttons
        document.querySelectorAll('.position-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.setPosition(btn.dataset.position);
            });
        });
        
        // Template buttons
        document.querySelectorAll('.template-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.showTemplateModal(btn.dataset.template);
            });
        });
        
        // Control buttons
        const clearBtn = document.getElementById('clear-lower-third-btn');
        const projectBtn = document.getElementById('project-lower-third-btn');
        const togglePreviewBtn = document.getElementById('toggle-preview-btn');
        const previewShowBtn = document.getElementById('preview-show-btn');
        const previewHideBtn = document.getElementById('preview-hide-btn');
        const previewResetBtn = document.getElementById('preview-reset-btn');
        
        if (clearBtn) {
            clearBtn.addEventListener('click', () => this.clearLowerThird());
        }
        
        if (projectBtn) {
            projectBtn.addEventListener('click', () => this.projectLowerThird());
        }
        
        if (togglePreviewBtn) {
            togglePreviewBtn.addEventListener('click', () => this.togglePreview());
        }
        
        if (previewShowBtn) {
            previewShowBtn.addEventListener('click', () => this.showPreview());
        }
        
        if (previewHideBtn) {
            previewHideBtn.addEventListener('click', () => this.hidePreview());
        }
        
        if (previewResetBtn) {
            previewResetBtn.addEventListener('click', () => this.resetPreview());
        }
        
        // Modal events
        this.setupModalEvents();
    }
    
    setupModalEvents() {
        // Template modal
        const templateModal = document.getElementById('template-modal');
        const closeTemplateModal = document.getElementById('close-template-modal');
        const cancelTemplateModal = document.getElementById('cancel-template-modal');
        const applyTemplateModal = document.getElementById('apply-template-modal');
        
        if (closeTemplateModal) {
            closeTemplateModal.addEventListener('click', () => this.hideTemplateModal());
        }
        
        if (cancelTemplateModal) {
            cancelTemplateModal.addEventListener('click', () => this.hideTemplateModal());
        }
        
        if (applyTemplateModal) {
            applyTemplateModal.addEventListener('click', () => this.applyTemplate());
        }
        
        // Close modal on backdrop click
        if (templateModal) {
            templateModal.addEventListener('click', (e) => {
                if (e.target === templateModal) {
                    this.hideTemplateModal();
                }
            });
        }
    }
    
    // ========== STYLE MANAGEMENT ==========
    
    setColorTheme(theme) {
        this.currentTheme = theme;
        
        // Update active button
        document.querySelectorAll('.color-theme-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        const activeBtn = document.querySelector(`[data-theme="${theme}"]`);
        if (activeBtn) {
            activeBtn.classList.add('active');
        }
        
        this.updatePreview();
    }
    
    setAnimation(animation) {
        this.currentAnimation = animation;
        
        // Update active button
        document.querySelectorAll('.animation-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        const activeBtn = document.querySelector(`[data-animation="${animation}"]`);
        if (activeBtn) {
            activeBtn.classList.add('active');
        }
        
        this.updatePreview();
    }
    
    setPosition(position) {
        this.currentPosition = position;
        
        // Update active button
        document.querySelectorAll('.position-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        const activeBtn = document.querySelector(`[data-position="${position}"]`);
        if (activeBtn) {
            activeBtn.classList.add('active');
        }
        
        this.updatePreview();
    }
    
    // ========== PREVIEW MANAGEMENT ==========
    
    updatePreview() {
        const mainTextElement = document.getElementById('preview-main-text');
        const descriptionElement = document.getElementById('preview-description');
        const displayElement = document.getElementById('lower-third-display');
        
        if (mainTextElement) {
            mainTextElement.textContent = this.currentText || 'Enter main text here';
        }
        
        if (descriptionElement) {
            descriptionElement.textContent = this.currentDescription || 'Enter description here';
        }
        
        if (displayElement) {
            // Update position classes
            displayElement.className = 'lower-third-display';
            displayElement.classList.add(this.currentPosition);
            
            // Update theme styles
            this.applyThemeToDisplay(displayElement);
        }
    }
    
    applyThemeToDisplay(displayElement) {
        // Remove existing theme classes
        displayElement.classList.remove('default-theme', 'blue-theme', 'green-theme', 'red-theme', 'purple-theme', 'orange-theme');
        
        // Add current theme class
        displayElement.classList.add(`${this.currentTheme}-theme`);
        
        // Apply custom theme styles
        const themeStyles = this.getThemeStyles(this.currentTheme);
        Object.assign(displayElement.style, themeStyles);
    }
    
    getThemeStyles(theme) {
        const themes = {
            default: {
                background: 'linear-gradient(135deg, var(--md-sys-color-primary), var(--md-sys-color-secondary))'
            },
            blue: {
                background: 'linear-gradient(135deg, #2196F3, #1976D2)'
            },
            green: {
                background: 'linear-gradient(135deg, #4CAF50, #388E3C)'
            },
            red: {
                background: 'linear-gradient(135deg, #F44336, #D32F2F)'
            },
            purple: {
                background: 'linear-gradient(135deg, #9C27B0, #7B1FA2)'
            },
            orange: {
                background: 'linear-gradient(135deg, #FF9800, #F57C00)'
            }
        };
        
        return themes[theme] || themes.default;
    }
    
    showPreview() {
        const displayElement = document.getElementById('lower-third-display');
        if (displayElement) {
            displayElement.classList.add('show');
            displayElement.classList.add(this.currentAnimation);
            this.isPreviewVisible = true;
            
            // Auto-hide after duration
            setTimeout(() => {
                this.hidePreview();
            }, this.currentDuration * 1000);
        }
    }
    
    hidePreview() {
        const displayElement = document.getElementById('lower-third-display');
        if (displayElement) {
            displayElement.classList.remove('show');
            this.isPreviewVisible = false;
        }
    }
    
    togglePreview() {
        if (this.isPreviewVisible) {
            this.hidePreview();
        } else {
            this.showPreview();
        }
    }
    
    resetPreview() {
        this.hidePreview();
        setTimeout(() => {
            this.updatePreview();
        }, 100);
    }
    
    // ========== TEMPLATE MANAGEMENT ==========
    
    showTemplateModal(templateType) {
        const modal = document.getElementById('template-modal');
        const mainTextInput = document.getElementById('template-main-text');
        const descriptionInput = document.getElementById('template-description');
        const themeSelect = document.getElementById('template-theme');
        const animationSelect = document.getElementById('template-animation');
        const durationInput = document.getElementById('template-duration');
        
        if (!modal) return;
        
        // Set default values based on template type
        const templateDefaults = this.getTemplateDefaults(templateType);
        
        if (mainTextInput) mainTextInput.value = templateDefaults.mainText;
        if (descriptionInput) descriptionInput.value = templateDefaults.description;
        if (themeSelect) themeSelect.value = templateDefaults.theme;
        if (animationSelect) animationSelect.value = templateDefaults.animation;
        if (durationInput) durationInput.value = templateDefaults.duration;
        
        modal.style.display = 'flex';
        if (mainTextInput) mainTextInput.focus();
    }
    
    hideTemplateModal() {
        const modal = document.getElementById('template-modal');
        if (modal) {
            modal.style.display = 'none';
        }
    }
    
    applyTemplate() {
        const mainTextInput = document.getElementById('template-main-text');
        const descriptionInput = document.getElementById('template-description');
        const themeSelect = document.getElementById('template-theme');
        const animationSelect = document.getElementById('template-animation');
        const durationInput = document.getElementById('template-duration');
        
        // Apply template values
        this.currentText = mainTextInput?.value || '';
        this.currentDescription = descriptionInput?.value || '';
        this.currentTheme = themeSelect?.value || 'default';
        this.currentAnimation = animationSelect?.value || 'slide-up';
        this.currentDuration = parseInt(durationInput?.value) || 10;
        
        // Update UI
        const mainTextField = document.getElementById('lower-third-text');
        const descriptionField = document.getElementById('lower-third-description');
        const durationSlider = document.getElementById('lower-third-duration');
        const durationValue = document.getElementById('duration-value');
        
        if (mainTextField) mainTextField.value = this.currentText;
        if (descriptionField) descriptionField.value = this.currentDescription;
        if (durationSlider) durationSlider.value = this.currentDuration;
        if (durationValue) durationValue.textContent = `${this.currentDuration}s`;
        
        // Update style buttons
        this.setColorTheme(this.currentTheme);
        this.setAnimation(this.currentAnimation);
        this.setPosition(this.currentPosition);
        
        // Update character counts
        this.updateCharCount('text-char-count', this.currentText.length, 50);
        this.updateCharCount('description-char-count', this.currentDescription.length, 100);
        
        // Update preview
        this.updatePreview();
        
        this.hideTemplateModal();
    }
    
    getTemplateDefaults(templateType) {
        const templates = {
            speaker: {
                mainText: 'Speaker Name',
                description: 'Title or Role',
                theme: 'default',
                animation: 'slide-up',
                duration: 10
            },
            'worship-leader': {
                mainText: 'Worship Leader',
                description: 'Leading Worship',
                theme: 'blue',
                animation: 'fade-in',
                duration: 8
            },
            announcement: {
                mainText: 'Announcement',
                description: 'Important Information',
                theme: 'red',
                animation: 'slide-left',
                duration: 15
            },
            event: {
                mainText: 'Event Title',
                description: 'Date and Time',
                theme: 'green',
                animation: 'slide-up',
                duration: 12
            },
            custom: {
                mainText: '',
                description: '',
                theme: 'default',
                animation: 'slide-up',
                duration: 10
            }
        };
        
        return templates[templateType] || templates.custom;
    }
    
    // ========== UTILITY METHODS ==========
    
    updateCharCount(elementId, currentLength, maxLength) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = currentLength;
            
            // Add warning class if approaching limit
            if (currentLength > maxLength * 0.8) {
                element.style.color = 'var(--md-sys-color-error)';
            } else {
                element.style.color = 'var(--md-sys-color-on-surface-variant)';
            }
        }
    }
    
    clearLowerThird() {
        this.currentText = '';
        this.currentDescription = '';
        
        const mainTextInput = document.getElementById('lower-third-text');
        const descriptionInput = document.getElementById('lower-third-description');
        
        if (mainTextInput) mainTextInput.value = '';
        if (descriptionInput) descriptionInput.value = '';
        
        this.updateCharCount('text-char-count', 0, 50);
        this.updateCharCount('description-char-count', 0, 100);
        
        this.hidePreview();
        this.updatePreview();
    }
    
    // ========== PROJECTION ==========
    
    projectLowerThird() {
        if (!this.currentText.trim()) {
            alert('Please enter some text to project');
            return;
        }
        
        const lowerThirdData = {
            mainText: this.currentText,
            description: this.currentDescription,
            theme: this.currentTheme,
            animation: this.currentAnimation,
            position: this.currentPosition,
            duration: this.currentDuration
        };
        
        this.socket.emit('proyectar_lower_third', lowerThirdData);
        
        // Show preview locally
        this.showPreview();
    }
    
    // ========== CALLBACKS ==========
    
    setCallbacks(callbacks) {
        this.callbacks = callbacks;
    }
    
    // ========== PUBLIC API ==========
    
    getCurrentData() {
        return {
            mainText: this.currentText,
            description: this.currentDescription,
            theme: this.currentTheme,
            animation: this.currentAnimation,
            position: this.currentPosition,
            duration: this.currentDuration
        };
    }
    
    setData(data) {
        if (data.mainText !== undefined) this.currentText = data.mainText;
        if (data.description !== undefined) this.currentDescription = data.description;
        if (data.theme !== undefined) this.setColorTheme(data.theme);
        if (data.animation !== undefined) this.setAnimation(data.animation);
        if (data.position !== undefined) this.setPosition(data.position);
        if (data.duration !== undefined) this.currentDuration = data.duration;
        
        this.updatePreview();
    }
}

// Initialize the component
let lowerThirdComponent;

document.addEventListener('DOMContentLoaded', () => {
    lowerThirdComponent = new LowerThirdComponent();
});
