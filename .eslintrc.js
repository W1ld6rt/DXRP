/**
 * ESLint Configuration for DXPR - Dexter Presenter Remote
 * Based on OpenJS Foundation standards and best practices
 */

module.exports = {
    env: {
        browser: true,
        es2021: true,
        node: true,
        jquery: false // We're not using jQuery
    },
    
    extends: [
        'eslint:recommended'
    ],
    
    parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module'
    },
    
    globals: {
        // Socket.IO
        io: 'readonly',
        
        // Our custom globals
        AppState: 'writable',
        Utils: 'writable',
        ViewManager: 'writable',
        BibleManager: 'writable',
        SongsManager: 'writable',
        LowerThirdManager: 'writable',
        SettingsManager: 'writable',
        OBSManager: 'writable',
        
        // Enhanced components
        EnhancedAppState: 'writable',
        EnhancedUtils: 'writable',
        EnhancedViewManager: 'writable',
        EnhancedBibleManager: 'writable',
        PerformanceMonitor: 'writable',
        
        // Lodash utilities
        LodashUtils: 'readonly',
        BibleUtils: 'readonly',
        
        // Component system
        ComponentSystem: 'readonly',
        BibleComponents: 'readonly'
    },
    
    rules: {
        // Error Prevention
        'no-console': 'warn', // Allow console in development
        'no-debugger': 'error',
        'no-unused-vars': ['error', { 
            argsIgnorePattern: '^_',
            varsIgnorePattern: '^_'
        }],
        'no-undef': 'error',
        'no-redeclare': 'error',
        'no-dupe-keys': 'error',
        'no-duplicate-case': 'error',
        'no-unreachable': 'error',
        'no-constant-condition': 'error',
        
        // Best Practices
        'prefer-const': 'error',
        'no-var': 'error',
        'eqeqeq': ['error', 'always'],
        'curly': ['error', 'all'],
        'dot-notation': 'error',
        'no-eval': 'error',
        'no-implied-eval': 'error',
        'no-new-func': 'error',
        'no-script-url': 'error',
        'no-self-compare': 'error',
        'no-sequences': 'error',
        'no-throw-literal': 'error',
        'no-useless-concat': 'error',
        'no-useless-return': 'error',
        'radix': 'error',
        'yoda': 'error',
        
        // Code Style
        'brace-style': ['error', '1tbs', { allowSingleLine: true }],
        'indent': ['error', 2, { 
            SwitchCase: 1,
            VariableDeclarator: 1,
            outerIIFEBody: 1
        }],
        'quotes': ['error', 'single', { 
            avoidEscape: true,
            allowTemplateLiterals: true
        }],
        'semi': ['error', 'always'],
        'comma-dangle': ['error', 'never'],
        'comma-spacing': ['error', { before: false, after: true }],
        'comma-style': ['error', 'last'],
        'key-spacing': ['error', { beforeColon: false, afterColon: true }],
        'keyword-spacing': ['error', { before: true, after: true }],
        'space-before-blocks': ['error', 'always'],
        'space-before-function-paren': ['error', {
            anonymous: 'always',
            named: 'never',
            asyncArrow: 'always'
        }],
        'space-in-parens': ['error', 'never'],
        'space-infix-ops': 'error',
        'space-unary-ops': ['error', { words: true, nonwords: false }],
        'object-curly-spacing': ['error', 'always'],
        'array-bracket-spacing': ['error', 'never'],
        
        // Line Length and Complexity
        'max-len': ['warn', { 
            code: 100,
            tabWidth: 2,
            ignoreUrls: true,
            ignoreStrings: true,
            ignoreTemplateLiterals: true,
            ignoreRegExpLiterals: true
        }],
        'complexity': ['warn', 10],
        'max-depth': ['warn', 4],
        'max-nested-callbacks': ['warn', 3],
        'max-params': ['warn', 5],
        'max-statements': ['warn', 20],
        
        // ES6+ Features
        'arrow-spacing': ['error', { before: true, after: true }],
        'constructor-super': 'error',
        'no-class-assign': 'error',
        'no-const-assign': 'error',
        'no-dupe-class-members': 'error',
        'no-duplicate-imports': 'error',
        'no-new-symbol': 'error',
        'no-this-before-super': 'error',
        'no-useless-computed-key': 'error',
        'no-useless-constructor': 'error',
        'no-useless-rename': 'error',
        'object-shorthand': ['error', 'always'],
        'prefer-arrow-callback': 'error',
        'prefer-destructuring': ['error', {
            array: false,
            object: true
        }],
        'prefer-rest-params': 'error',
        'prefer-spread': 'error',
        'prefer-template': 'error',
        'rest-spread-spacing': ['error', 'never'],
        'template-curly-spacing': ['error', 'never'],
        
        // Accessibility
        'no-alert': 'warn', // Prefer custom modals
        
        // Performance
        'no-loop-func': 'error',
        'no-new-object': 'error',
        'no-new-wrappers': 'error',
        
        // Security
        'no-new-func': 'error',
        'no-script-url': 'error'
    },
    
    overrides: [
        {
            // Configuration for Node.js files
            files: [
                'electron-main.js',
                'electron-preload.js',
                'app.py', // Python files won't be linted by ESLint
                'config.py',
                '*.config.js',
                '.eslintrc.js'
            ],
            env: {
                node: true,
                browser: false
            },
            rules: {
                'no-console': 'off' // Allow console in Node.js
            }
        },
        {
            // Configuration for test files
            files: [
                '**/*.test.js',
                '**/*.spec.js',
                '**/test/**/*.js'
            ],
            env: {
                jest: true,
                mocha: true
            },
            rules: {
                'no-console': 'off',
                'max-statements': 'off',
                'max-len': 'off'
            }
        },
        {
            // Configuration for legacy browser support
            files: [
                '**/static/js/legacy/**/*.js'
            ],
            parserOptions: {
                ecmaVersion: 5
            },
            rules: {
                'no-var': 'off',
                'prefer-const': 'off',
                'prefer-arrow-callback': 'off',
                'object-shorthand': 'off',
                'prefer-template': 'off'
            }
        }
    ],
    
    // Ignore patterns
    ignorePatterns: [
        'node_modules/',
        'dist/',
        'build/',
        '*.min.js',
        'vendor/',
        'static/js/vendor/',
        '__pycache__/',
        '*.pyc'
    ]
};