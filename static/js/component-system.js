// ====== DXPR - Component System (Inspired by AngularJS) ======

/**
 * Component-based architecture inspired by AngularJS directives
 * Provides modular, reusable UI components with data binding
 */

class ComponentSystem {
  constructor() {
    this.components = new Map();
    this.instances = new Map();
    this.observers = new Map();
    this.eventBus = new EventTarget();
  }

  /**
   * Register a new component
   * @param {string} name - Component name
   * @param {Object} definition - Component definition
   */
  component(name, definition) {
    this.components.set(name, {
      template: definition.template || '',
      controller: definition.controller || function() {},
      scope: definition.scope || {},
      restrict: definition.restrict || 'E',
      transclude: definition.transclude || false,
      replace: definition.replace || false,
      link: definition.link || function() {},
      require: definition.require || null
    });
  }

  /**
   * Create component instance
   * @param {string} name - Component name
   * @param {HTMLElement} element - Target element
   * @param {Object} attrs - Attributes
   */
  createInstance(name, element, attrs = {}) {
    const component = this.components.get(name);
    if (!component) {
      console.error(`Component '${name}' not found`);
      return null;
    }

    const scope = this.createScope(component.scope, attrs);
    const controller = new component.controller(scope, element);
    
    const instance = {
      name,
      element,
      scope,
      controller,
      component,
      id: this.generateId()
    };

    // Render template
    if (component.template) {
      const rendered = this.renderTemplate(component.template, scope);
      if (component.replace) {
        element.outerHTML = rendered;
      } else {
        element.innerHTML = rendered;
      }
    }

    // Execute link function
    if (component.link) {
      component.link(scope, element, attrs, controller);
    }

    this.instances.set(instance.id, instance);
    this.setupDataBinding(instance);
    
    return instance;
  }

  /**
   * Create isolated scope
   * @param {Object} scopeDefinition - Scope definition
   * @param {Object} attrs - Element attributes
   */
  createScope(scopeDefinition, attrs) {
    const scope = {
      $parent: null,
      $root: null,
      $id: this.generateId(),
      $watch: (expr, callback) => this.watch(scope, expr, callback),
      $apply: (fn) => this.apply(scope, fn),
      $emit: (event, data) => this.emit(scope, event, data),
      $on: (event, callback) => this.on(scope, event, callback)
    };

    // Bind scope properties based on definition
    Object.keys(scopeDefinition).forEach(key => {
      const binding = scopeDefinition[key];
      if (typeof binding === 'string') {
        switch (binding.charAt(0)) {
          case '@': // One-way string binding
            scope[key] = attrs[key] || '';
            break;
          case '=': // Two-way binding
            scope[key] = this.parseExpression(attrs[key]);
            break;
          case '&': // Function binding
            scope[key] = () => this.parseExpression(attrs[key]);
            break;
          default:
            scope[key] = binding;
        }
      } else {
        scope[key] = binding;
      }
    });

    return scope;
  }

  /**
   * Template rendering with data binding
   * @param {string} template - Template string
   * @param {Object} scope - Scope object
   */
  renderTemplate(template, scope) {
    return template.replace(/\{\{\s*([^}]+)\s*\}\}/g, (match, expr) => {
      try {
        return this.evaluateExpression(expr.trim(), scope) || '';
      } catch (e) {
        console.warn(`Template expression error: ${expr}`, e);
        return '';
      }
    });
  }

  /**
   * Evaluate expression in scope context
   * @param {string} expr - Expression to evaluate
   * @param {Object} scope - Scope context
   */
  evaluateExpression(expr, scope) {
    // Simple property access
    if (expr.includes('.')) {
      return expr.split('.').reduce((obj, prop) => obj && obj[prop], scope);
    }
    return scope[expr];
  }

  /**
   * Parse expression for two-way binding
   * @param {string} expr - Expression string
   */
  parseExpression(expr) {
    if (!expr) return null;
    try {
      return new Function('scope', `return ${expr}`);
    } catch (e) {
      return expr; // Return as string if not valid expression
    }
  }

  /**
   * Setup data binding and watchers
   * @param {Object} instance - Component instance
   */
  setupDataBinding(instance) {
    const { scope, element } = instance;
    
    // Setup automatic re-rendering on scope changes
    const observer = new Proxy(scope, {
      set: (target, property, value) => {
        const oldValue = target[property];
        target[property] = value;
        
        if (oldValue !== value) {
          this.digest(instance);
        }
        
        return true;
      }
    });

    this.observers.set(instance.id, observer);
  }

  /**
   * Digest cycle - re-render component
   * @param {Object} instance - Component instance
   */
  digest(instance) {
    const { component, scope, element } = instance;
    
    if (component.template) {
      const rendered = this.renderTemplate(component.template, scope);
      if (component.replace) {
        element.outerHTML = rendered;
      } else {
        element.innerHTML = rendered;
      }
    }
  }

  /**
   * Watch scope property
   * @param {Object} scope - Scope object
   * @param {string} expr - Expression to watch
   * @param {Function} callback - Callback function
   */
  watch(scope, expr, callback) {
    // Simple implementation - in production would use more sophisticated watching
    let oldValue = this.evaluateExpression(expr, scope);
    
    const watcher = setInterval(() => {
      const newValue = this.evaluateExpression(expr, scope);
      if (oldValue !== newValue) {
        callback(newValue, oldValue);
        oldValue = newValue;
      }
    }, 100);

    return () => clearInterval(watcher);
  }

  /**
   * Apply function to scope
   * @param {Object} scope - Scope object
   * @param {Function} fn - Function to apply
   */
  apply(scope, fn) {
    if (fn) fn();
    // Trigger digest cycle for all instances
    this.instances.forEach(instance => {
      if (instance.scope === scope) {
        this.digest(instance);
      }
    });
  }

  /**
   * Emit event
   * @param {Object} scope - Scope object
   * @param {string} event - Event name
   * @param {*} data - Event data
   */
  emit(scope, event, data) {
    this.eventBus.dispatchEvent(new CustomEvent(event, { detail: data }));
  }

  /**
   * Listen to event
   * @param {Object} scope - Scope object
   * @param {string} event - Event name
   * @param {Function} callback - Event callback
   */
  on(scope, event, callback) {
    this.eventBus.addEventListener(event, callback);
  }

  /**
   * Generate unique ID
   */
  generateId() {
    return Math.random().toString(36).substr(2, 9);
  }

  /**
   * Initialize component system
   */
  init() {
    this.scanAndInitialize();
  }

  /**
   * Scan DOM and initialize components
   */
  scanAndInitialize() {
    this.components.forEach((component, name) => {
      const selector = component.restrict === 'E' ? name : `[${name}]`;
      const elements = document.querySelectorAll(selector);
      
      elements.forEach(element => {
        if (!element.dataset.componentInitialized) {
          const attrs = this.getElementAttributes(element);
          this.createInstance(name, element, attrs);
          element.dataset.componentInitialized = 'true';
        }
      });
    });
  }

  /**
   * Get element attributes as object
   * @param {HTMLElement} element - Target element
   */
  getElementAttributes(element) {
    const attrs = {};
    Array.from(element.attributes).forEach(attr => {
      attrs[attr.name] = attr.value;
    });
    return attrs;
  }

  /**
   * Destroy component instance
   * @param {string} instanceId - Instance ID
   */
  destroy(instanceId) {
    const instance = this.instances.get(instanceId);
    if (instance) {
      this.instances.delete(instanceId);
      this.observers.delete(instanceId);
      
      if (instance.controller && instance.controller.$destroy) {
        instance.controller.$destroy();
      }
    }
  }
}

// Global component system instance
window.ComponentSystem = new ComponentSystem();

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.ComponentSystem.init();
  });
} else {
  window.ComponentSystem.init();
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ComponentSystem;
}