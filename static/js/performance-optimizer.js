/**
 * Performance Optimizer for DXPR Application
 * Implements various performance optimizations including:
 * - Resource preloading
 * - Script bundling
 * - CSS optimization
 * - Lazy loading
 * - Caching strategies
 */

class PerformanceOptimizer {
    constructor() {
        this.loadedScripts = new Set();
        this.loadedStyles = new Set();
        this.preloadedResources = new Set();
        this.componentCache = new Map();
        this.initOptimizations();
    }

    initOptimizations() {
        // Preload critical resources
        this.preloadCriticalResources();
        
        // Setup intersection observer for lazy loading
        this.setupLazyLoading();
        
        // Optimize font loading
        this.optimizeFontLoading();
        
        // Setup service worker for caching
        this.setupServiceWorker();
    }

    preloadCriticalResources() {
        const criticalResources = [
            '/static/css/main.css',
            '/static/css/main-content.css',
            '/static/js/theme-manager.js',
            '/static/components/navigation/navigation.js',
            '/static/components/header/header.js'
        ];

        criticalResources.forEach(resource => {
            if (!this.preloadedResources.has(resource)) {
                this.preloadResource(resource);
                this.preloadedResources.add(resource);
            }
        });
    }

    preloadResource(href, as = 'script') {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.href = href;
        link.as = as;
        
        if (as === 'style') {
            link.onload = () => {
                link.rel = 'stylesheet';
            };
        }
        
        document.head.appendChild(link);
    }

    async loadScriptOptimized(src) {
        // Check if already loaded
        if (this.loadedScripts.has(src)) {
            return Promise.resolve();
        }

        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            
            // Use cache-friendly versioning only in development
            const isDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
            script.src = isDev ? `${src}?v=${Date.now()}` : src;
            
            // Add performance attributes
            script.async = true;
            script.defer = true;
            
            script.onload = () => {
                this.loadedScripts.add(src);
                resolve();
            };
            
            script.onerror = () => {
                reject(new Error(`Failed to load script: ${src}`));
            };
            
            document.head.appendChild(script);
        });
    }

    async loadComponentOptimized(componentName) {
        // Check cache first
        if (this.componentCache.has(componentName)) {
            return this.componentCache.get(componentName);
        }

        try {
            const [htmlResponse, jsResponse] = await Promise.all([
                fetch(`/static/components/${componentName}/${componentName}.html`),
                this.loadScriptOptimized(`/static/components/${componentName}/${componentName}.js`)
            ]);

            const html = await htmlResponse.text();
            
            // Cache the result
            this.componentCache.set(componentName, html);
            
            return html;
        } catch (error) {
            console.error(`Error loading component ${componentName}:`, error);
            throw error;
        }
    }

    setupLazyLoading() {
        if ('IntersectionObserver' in window) {
            const lazyObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const element = entry.target;
                        
                        // Load lazy images
                        if (element.dataset.src) {
                            this.loadOptimizedImage(element);
                        }
                        
                        // Load lazy components
                        if (element.dataset.component) {
                            this.loadComponentOptimized(element.dataset.component);
                        }
                        
                        lazyObserver.unobserve(element);
                    }
                });
            }, {
                rootMargin: '50px 0px',
                threshold: 0.1
            });

            // Observe lazy elements
            document.querySelectorAll('[data-src], [data-component]').forEach(el => {
                lazyObserver.observe(el);
            });
        }
    }

    // Image optimization with WebP support
    optimizeImages() {
        const images = document.querySelectorAll('img[data-src]');
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    this.loadOptimizedImage(img);
                    observer.unobserve(img);
                }
            });
        }, {
            rootMargin: '50px 0px',
            threshold: 0.01
        });
        
        images.forEach(img => imageObserver.observe(img));
    }
    
    // Load optimized image with WebP fallback
    loadOptimizedImage(img) {
        const originalSrc = img.dataset.src;
        if (!originalSrc) return;
        
        // Check WebP support
        if (this.supportsWebP()) {
            const webpSrc = originalSrc.replace(/\.(jpg|jpeg|png)$/i, '.webp');
            
            // Try WebP first
            const webpImg = new Image();
            webpImg.onload = () => {
                img.src = webpSrc;
                img.removeAttribute('data-src');
                img.classList.add('loaded');
            };
            webpImg.onerror = () => {
                // Fallback to original
                img.src = originalSrc;
                img.removeAttribute('data-src');
                img.classList.add('loaded');
            };
            webpImg.src = webpSrc;
        } else {
            img.src = originalSrc;
            img.removeAttribute('data-src');
            img.classList.add('loaded');
        }
    }
    
    // Check WebP support
    supportsWebP() {
        if (this._webpSupport !== undefined) {
            return this._webpSupport;
        }
        
        const canvas = document.createElement('canvas');
        canvas.width = 1;
        canvas.height = 1;
        this._webpSupport = canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
        return this._webpSupport;
    }

    optimizeFontLoading() {
        // Preload critical fonts
        const criticalFonts = [
            'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap',
            'https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200'
        ];

        criticalFonts.forEach(font => {
            this.preloadResource(font, 'style');
        });
    }

    setupServiceWorker() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/static/sw.js')
                .then(registration => {
                    console.log('Service Worker registered:', registration);
                })
                .catch(error => {
                    console.log('Service Worker registration failed:', error);
                });
        }
    }

    // Debounce function for performance
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // Throttle function for performance
    throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    // Memory cleanup
    cleanup() {
        this.componentCache.clear();
        this.loadedScripts.clear();
        this.loadedStyles.clear();
        this.preloadedResources.clear();
    }

    // Performance monitoring
    measurePerformance(name, fn) {
        const start = performance.now();
        const result = fn();
        const end = performance.now();
        console.log(`${name} took ${end - start} milliseconds`);
        return result;
    }

    // Get performance metrics
    getPerformanceMetrics() {
        if ('performance' in window) {
            const navigation = performance.getEntriesByType('navigation')[0];
            const paint = performance.getEntriesByType('paint');
            
            return {
                domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
                loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
                firstPaint: paint.find(p => p.name === 'first-paint')?.startTime,
                firstContentfulPaint: paint.find(p => p.name === 'first-contentful-paint')?.startTime,
                totalLoadTime: navigation.loadEventEnd - navigation.fetchStart
            };
        }
        return null;
    }
}

// Initialize performance optimizer
window.PerformanceOptimizer = PerformanceOptimizer;
window.performanceOptimizer = new PerformanceOptimizer();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PerformanceOptimizer;
}