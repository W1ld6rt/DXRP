/**
 * Lodash-inspired Utility Functions for Bi-Ble Project
 * Implements essential data manipulation and functional programming utilities
 * Based on Lodash library patterns and best practices
 */

class LodashUtilities {
    constructor() {
        this._ = this;
    }

    // Array Methods
    /**
     * Creates an array of elements split into groups the length of size
     * @param {Array} array - The array to process
     * @param {number} size - The length of each chunk
     * @returns {Array} Returns the new array of chunks
     */
    chunk(array, size = 1) {
        if (!Array.isArray(array) || size < 1) return [];
        const result = [];
        for (let i = 0; i < array.length; i += size) {
            result.push(array.slice(i, i + size));
        }
        return result;
    }

    /**
     * Creates an array with all falsey values removed
     * @param {Array} array - The array to compact
     * @returns {Array} Returns the new array of filtered values
     */
    compact(array) {
        return Array.isArray(array) ? array.filter(Boolean) : [];
    }

    /**
     * Creates a new array concatenating array with additional arrays/values
     * @param {Array} array - The array to concatenate
     * @param {...*} values - The values to concatenate
     * @returns {Array} Returns the new concatenated array
     */
    concat(array, ...values) {
        if (!Array.isArray(array)) return [];
        return array.concat(...values);
    }

    /**
     * Creates an array of unique values from all given arrays
     * @param {...Array} arrays - The arrays to inspect
     * @returns {Array} Returns the new array of combined values
     */
    union(...arrays) {
        const combined = this.concat([], ...arrays);
        return this.uniq(combined);
    }

    /**
     * Creates a duplicate-free version of an array
     * @param {Array} array - The array to inspect
     * @returns {Array} Returns the new duplicate free array
     */
    uniq(array) {
        return Array.isArray(array) ? [...new Set(array)] : [];
    }

    /**
     * Creates an array of values not included in the other given arrays
     * @param {Array} array - The array to inspect
     * @param {...Array} values - The values to exclude
     * @returns {Array} Returns the new array of filtered values
     */
    difference(array, ...values) {
        if (!Array.isArray(array)) return [];
        const excludeSet = new Set(this.concat([], ...values));
        return array.filter(item => !excludeSet.has(item));
    }

    /**
     * Creates a slice of array with n elements dropped from the beginning
     * @param {Array} array - The array to query
     * @param {number} n - The number of elements to drop
     * @returns {Array} Returns the slice of array
     */
    drop(array, n = 1) {
        return Array.isArray(array) ? array.slice(n) : [];
    }

    /**
     * Creates a slice of array with n elements dropped from the end
     * @param {Array} array - The array to query
     * @param {number} n - The number of elements to drop
     * @returns {Array} Returns the slice of array
     */
    dropRight(array, n = 1) {
        return Array.isArray(array) ? array.slice(0, -n || array.length) : [];
    }

    // Collection Methods
    /**
     * Iterates over elements of collection, invoking iteratee for each element
     * @param {Array|Object} collection - The collection to iterate over
     * @param {Function} iteratee - The function invoked per iteration
     * @returns {Array|Object} Returns collection
     */
    forEach(collection, iteratee) {
        if (Array.isArray(collection)) {
            for (let i = 0; i < collection.length; i++) {
                if (iteratee(collection[i], i, collection) === false) break;
            }
        } else if (collection && typeof collection === 'object') {
            for (const key in collection) {
                if (collection.hasOwnProperty(key)) {
                    if (iteratee(collection[key], key, collection) === false) break;
                }
            }
        }
        return collection;
    }

    /**
     * Creates an array of values by running each element through iteratee
     * @param {Array|Object} collection - The collection to iterate over
     * @param {Function|string} iteratee - The function invoked per iteration
     * @returns {Array} Returns the new mapped array
     */
    map(collection, iteratee) {
        const func = this._getIteratee(iteratee);
        if (Array.isArray(collection)) {
            return collection.map((item, index) => func(item, index, collection));
        } else if (collection && typeof collection === 'object') {
            return Object.keys(collection).map(key => func(collection[key], key, collection));
        }
        return [];
    }

    /**
     * Iterates over elements of collection, returning array of elements predicate returns truthy for
     * @param {Array|Object} collection - The collection to iterate over
     * @param {Function|Object|string} predicate - The function invoked per iteration
     * @returns {Array} Returns the new filtered array
     */
    filter(collection, predicate) {
        const func = this._getPredicate(predicate);
        if (Array.isArray(collection)) {
            return collection.filter((item, index) => func(item, index, collection));
        } else if (collection && typeof collection === 'object') {
            return Object.keys(collection)
                .filter(key => func(collection[key], key, collection))
                .map(key => collection[key]);
        }
        return [];
    }

    /**
     * Iterates over elements of collection, returning the first element predicate returns truthy for
     * @param {Array|Object} collection - The collection to inspect
     * @param {Function|Object|string} predicate - The function invoked per iteration
     * @returns {*} Returns the matched element, else undefined
     */
    find(collection, predicate) {
        const func = this._getPredicate(predicate);
        if (Array.isArray(collection)) {
            for (let i = 0; i < collection.length; i++) {
                if (func(collection[i], i, collection)) {
                    return collection[i];
                }
            }
        } else if (collection && typeof collection === 'object') {
            for (const key in collection) {
                if (collection.hasOwnProperty(key) && func(collection[key], key, collection)) {
                    return collection[key];
                }
            }
        }
        return undefined;
    }

    /**
     * Reduces collection to a value which is the accumulated result of running each element through iteratee
     * @param {Array|Object} collection - The collection to iterate over
     * @param {Function} iteratee - The function invoked per iteration
     * @param {*} accumulator - The initial value
     * @returns {*} Returns the accumulated value
     */
    reduce(collection, iteratee, accumulator) {
        let hasInitial = arguments.length > 2;
        
        if (Array.isArray(collection)) {
            let index = 0;
            if (!hasInitial) {
                accumulator = collection[0];
                index = 1;
            }
            for (let i = index; i < collection.length; i++) {
                accumulator = iteratee(accumulator, collection[i], i, collection);
            }
        } else if (collection && typeof collection === 'object') {
            const keys = Object.keys(collection);
            let index = 0;
            if (!hasInitial) {
                accumulator = collection[keys[0]];
                index = 1;
            }
            for (let i = index; i < keys.length; i++) {
                const key = keys[i];
                accumulator = iteratee(accumulator, collection[key], key, collection);
            }
        }
        
        return accumulator;
    }

    /**
     * Creates an object composed of keys generated from the results of running each element through iteratee
     * @param {Array|Object} collection - The collection to iterate over
     * @param {Function|string} iteratee - The iteratee to transform keys
     * @returns {Object} Returns the composed aggregate object
     */
    groupBy(collection, iteratee) {
        const func = this._getIteratee(iteratee);
        const result = {};
        
        this.forEach(collection, (item, index) => {
            const key = func(item, index, collection);
            if (!result[key]) result[key] = [];
            result[key].push(item);
        });
        
        return result;
    }

    // Object Methods
    /**
     * Assigns own enumerable string keyed properties of source objects to the destination object
     * @param {Object} object - The destination object
     * @param {...Object} sources - The source objects
     * @returns {Object} Returns object
     */
    assign(object, ...sources) {
        if (object == null) return {};
        return Object.assign(object, ...sources);
    }

    /**
     * Creates an object with the same keys as object and values generated by running each property through iteratee
     * @param {Object} object - The object to iterate over
     * @param {Function|string} iteratee - The function invoked per iteration
     * @returns {Object} Returns the new mapped object
     */
    mapValues(object, iteratee) {
        const func = this._getIteratee(iteratee);
        const result = {};
        
        for (const key in object) {
            if (object.hasOwnProperty(key)) {
                result[key] = func(object[key], key, object);
            }
        }
        
        return result;
    }

    /**
     * Creates an object composed of the picked object properties
     * @param {Object} object - The source object
     * @param {...(string|string[])} paths - The property paths to pick
     * @returns {Object} Returns the new object
     */
    pick(object, ...paths) {
        const result = {};
        const flatPaths = this.concat([], ...paths);
        
        flatPaths.forEach(path => {
            if (object && object.hasOwnProperty(path)) {
                result[path] = object[path];
            }
        });
        
        return result;
    }

    /**
     * The opposite of pick; creates an object composed of the own enumerable property paths of object that are not omitted
     * @param {Object} object - The source object
     * @param {...(string|string[])} paths - The property paths to omit
     * @returns {Object} Returns the new object
     */
    omit(object, ...paths) {
        const result = {};
        const omitSet = new Set(this.concat([], ...paths));
        
        for (const key in object) {
            if (object.hasOwnProperty(key) && !omitSet.has(key)) {
                result[key] = object[key];
            }
        }
        
        return result;
    }

    /**
     * Creates a deep clone of value
     * @param {*} value - The value to clone
     * @returns {*} Returns the cloned value
     */
    cloneDeep(value) {
        if (value === null || typeof value !== 'object') return value;
        if (value instanceof Date) return new Date(value.getTime());
        if (value instanceof Array) return value.map(item => this.cloneDeep(item));
        if (typeof value === 'object') {
            const cloned = {};
            for (const key in value) {
                if (value.hasOwnProperty(key)) {
                    cloned[key] = this.cloneDeep(value[key]);
                }
            }
            return cloned;
        }
        return value;
    }

    // Function Methods
    /**
     * Creates a debounced function that delays invoking func until after wait milliseconds
     * @param {Function} func - The function to debounce
     * @param {number} wait - The number of milliseconds to delay
     * @param {Object} options - The options object
     * @returns {Function} Returns the new debounced function
     */
    debounce(func, wait = 0, options = {}) {
        let timeoutId;
        let lastArgs;
        let lastThis;
        let result;
        let lastCallTime;
        let lastInvokeTime = 0;
        
        const { leading = false, maxWait, trailing = true } = options;
        
        function invokeFunc(time) {
            const args = lastArgs;
            const thisArg = lastThis;
            
            lastArgs = lastThis = undefined;
            lastInvokeTime = time;
            result = func.apply(thisArg, args);
            return result;
        }
        
        function leadingEdge(time) {
            lastInvokeTime = time;
            timeoutId = setTimeout(timerExpired, wait);
            return leading ? invokeFunc(time) : result;
        }
        
        function timerExpired() {
            const time = Date.now();
            if (shouldInvoke(time)) {
                return trailingEdge(time);
            }
            timeoutId = setTimeout(timerExpired, remainingWait(time));
        }
        
        function trailingEdge(time) {
            timeoutId = undefined;
            if (trailing && lastArgs) {
                return invokeFunc(time);
            }
            lastArgs = lastThis = undefined;
            return result;
        }
        
        function shouldInvoke(time) {
            const timeSinceLastCall = time - lastCallTime;
            const timeSinceLastInvoke = time - lastInvokeTime;
            
            return (lastCallTime === undefined || (timeSinceLastCall >= wait) ||
                    (timeSinceLastCall < 0) || (maxWait !== undefined && timeSinceLastInvoke >= maxWait));
        }
        
        function remainingWait(time) {
            const timeSinceLastCall = time - lastCallTime;
            const timeSinceLastInvoke = time - lastInvokeTime;
            const timeWaiting = wait - timeSinceLastCall;
            
            return maxWait !== undefined
                ? Math.min(timeWaiting, maxWait - timeSinceLastInvoke)
                : timeWaiting;
        }
        
        function debounced(...args) {
            const time = Date.now();
            const isInvoking = shouldInvoke(time);
            
            lastArgs = args;
            lastThis = this;
            lastCallTime = time;
            
            if (isInvoking) {
                if (timeoutId === undefined) {
                    return leadingEdge(lastCallTime);
                }
                if (maxWait !== undefined) {
                    clearTimeout(timeoutId);
                    timeoutId = setTimeout(timerExpired, wait);
                    return invokeFunc(lastCallTime);
                }
            }
            if (timeoutId === undefined) {
                timeoutId = setTimeout(timerExpired, wait);
            }
            return result;
        }
        
        debounced.cancel = function() {
            if (timeoutId !== undefined) {
                clearTimeout(timeoutId);
            }
            lastInvokeTime = 0;
            lastArgs = lastCallTime = lastThis = timeoutId = undefined;
        };
        
        debounced.flush = function() {
            return timeoutId === undefined ? result : trailingEdge(Date.now());
        };
        
        return debounced;
    }

    /**
     * Creates a throttled function that only invokes func at most once per every wait milliseconds
     * @param {Function} func - The function to throttle
     * @param {number} wait - The number of milliseconds to throttle invocations to
     * @param {Object} options - The options object
     * @returns {Function} Returns the new throttled function
     */
    throttle(func, wait = 0, options = {}) {
        let leading = true;
        let trailing = true;
        
        if (typeof options === 'object') {
            leading = 'leading' in options ? !!options.leading : leading;
            trailing = 'trailing' in options ? !!options.trailing : trailing;
        }
        
        return this.debounce(func, wait, {
            leading,
            maxWait: wait,
            trailing
        });
    }

    // Utility Methods
    /**
     * Checks if value is empty
     * @param {*} value - The value to check
     * @returns {boolean} Returns true if value is empty, else false
     */
    isEmpty(value) {
        if (value == null) return true;
        if (Array.isArray(value) || typeof value === 'string') return value.length === 0;
        if (typeof value === 'object') return Object.keys(value).length === 0;
        return false;
    }

    /**
     * Checks if value is an object
     * @param {*} value - The value to check
     * @returns {boolean} Returns true if value is an object, else false
     */
    isObject(value) {
        return value != null && typeof value === 'object';
    }

    /**
     * Checks if value is a plain object
     * @param {*} value - The value to check
     * @returns {boolean} Returns true if value is a plain object, else false
     */
    isPlainObject(value) {
        if (!this.isObject(value) || Object.prototype.toString.call(value) !== '[object Object]') {
            return false;
        }
        if (Object.getPrototypeOf(value) === null) return true;
        let proto = value;
        while (Object.getPrototypeOf(proto) !== null) {
            proto = Object.getPrototypeOf(proto);
        }
        return Object.getPrototypeOf(value) === proto;
    }

    /**
     * Generates a unique ID
     * @param {string} prefix - The value to prefix the ID with
     * @returns {string} Returns the unique ID
     */
    uniqueId(prefix = 'id') {
        return `${prefix}${Date.now()}${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Creates a function that memoizes the result of func
     * @param {Function} func - The function to have its output memoized
     * @param {Function} resolver - The function to resolve the cache key
     * @returns {Function} Returns the new memoized function
     */
    memoize(func, resolver) {
        if (typeof func !== 'function' || (resolver != null && typeof resolver !== 'function')) {
            throw new TypeError('Expected a function');
        }
        const memoized = function(...args) {
            const key = resolver ? resolver.apply(this, args) : args[0];
            const cache = memoized.cache;
            
            if (cache.has(key)) {
                return cache.get(key);
            }
            const result = func.apply(this, args);
            memoized.cache = cache.set(key, result) || cache;
            return result;
        };
        memoized.cache = new Map();
        return memoized;
    }

    /**
     * Iterates over elements of collection and invokes iteratee for each element
     * @param {Array|Object} collection - The collection to iterate over
     * @param {Function} iteratee - The function invoked per iteration
     * @returns {Array|Object} Returns collection
     */
    forEach(collection, iteratee) {
        if (Array.isArray(collection)) {
            for (let i = 0; i < collection.length; i++) {
                if (iteratee(collection[i], i, collection) === false) break;
            }
        } else if (this.isObject(collection)) {
            for (const key in collection) {
                if (collection.hasOwnProperty(key)) {
                    if (iteratee(collection[key], key, collection) === false) break;
                }
            }
        }
        return collection;
    }

    /**
     * Recursively merges own and inherited enumerable string keyed properties
     * @param {Object} object - The destination object
     * @param {...Object} sources - The source objects
     * @returns {Object} Returns object
     */
    merge(object, ...sources) {
        if (!this.isObject(object)) return object;
        
        sources.forEach(source => {
            if (this.isObject(source)) {
                for (const key in source) {
                    if (source.hasOwnProperty(key)) {
                        if (this.isObject(source[key]) && this.isObject(object[key])) {
                            object[key] = this.merge(object[key], source[key]);
                        } else {
                            object[key] = source[key];
                        }
                    }
                }
            }
        });
        
        return object;
    }

    /**
     * Creates a deep clone of value
     * @param {*} value - The value to clone
     * @returns {*} Returns the cloned value
     */
    cloneDeep(value) {
        if (value === null || typeof value !== 'object') return value;
        if (value instanceof Date) return new Date(value.getTime());
        if (value instanceof Array) return value.map(item => this.cloneDeep(item));
        if (typeof value === 'object') {
            const cloned = {};
            for (const key in value) {
                if (value.hasOwnProperty(key)) {
                    cloned[key] = this.cloneDeep(value[key]);
                }
            }
            return cloned;
        }
        return value;
    }

    /**
     * Creates an object with the same keys as object and values generated by running each property through iteratee
     * @param {Object} object - The object to iterate over
     * @param {Function} iteratee - The function invoked per iteration
     * @returns {Object} Returns the new mapped object
     */
    mapValues(object, iteratee) {
        const result = {};
        for (const key in object) {
            if (object.hasOwnProperty(key)) {
                result[key] = iteratee(object[key], key, object);
            }
        }
        return result;
    }

    /**
     * Creates an array of values by running each element in collection through iteratee
     * @param {Array|Object} collection - The collection to iterate over
     * @param {Function} iteratee - The function invoked per iteration
     * @returns {Array} Returns the new mapped array
     */
    map(collection, iteratee) {
        const result = [];
        if (Array.isArray(collection)) {
            for (let i = 0; i < collection.length; i++) {
                result.push(iteratee(collection[i], i, collection));
            }
        } else if (this.isObject(collection)) {
            for (const key in collection) {
                if (collection.hasOwnProperty(key)) {
                    result.push(iteratee(collection[key], key, collection));
                }
            }
        }
        return result;
    }

    /**
     * Creates an object composed of keys generated from the results of running each element through iteratee
     * @param {Array} collection - The collection to iterate over
     * @param {Function|string} iteratee - The iteratee to transform keys
     * @returns {Object} Returns the composed aggregate object
     */
    groupBy(collection, iteratee) {
        const result = {};
        const getKey = this._getIteratee(iteratee);
        
        collection.forEach(item => {
            const key = getKey(item);
            if (!result[key]) result[key] = [];
            result[key].push(item);
        });
        
        return result;
    }

    /**
     * Creates a duplicate-free version of an array using iteratee for equality comparisons
     * @param {Array} array - The array to inspect
     * @param {Function} iteratee - The iteratee invoked per element
     * @returns {Array} Returns the new duplicate free array
     */
    uniqBy(array, iteratee) {
        const seen = new Set();
        const getKey = this._getIteratee(iteratee);
        
        return array.filter(item => {
            const key = getKey(item);
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });
    }

    /**
     * Creates an object composed of the picked object properties
     * @param {Object} object - The source object
     * @param {...(string|string[])} paths - The property paths to pick
     * @returns {Object} Returns the new object
     */
    pick(object, ...paths) {
        const result = {};
        const flatPaths = paths.flat();
        
        flatPaths.forEach(path => {
            if (object.hasOwnProperty(path)) {
                result[path] = object[path];
            }
        });
        
        return result;
    }

    /**
     * Measures execution time of a function
     * @param {Function} func - The function to measure
     * @param {string} label - Label for the measurement
     * @param {Function} callback - Callback to handle the result
     * @returns {Function} Wrapped function with timing
     */
    measureTime(func, label = 'Function', callback) {
        return function(...args) {
            const start = performance.now();
            const result = func.apply(this, args);
            const end = performance.now();
            const time = end - start;
            
            if (callback) {
                callback(time, label);
            } else {
                console.log(`${label} execution time: ${time.toFixed(2)}ms`);
            }
            
            return result;
        };
    }

    // Helper Methods
    _getIteratee(iteratee) {
        if (typeof iteratee === 'function') return iteratee;
        if (typeof iteratee === 'string') return obj => obj[iteratee];
        if (Array.isArray(iteratee)) return obj => obj[iteratee[0]] === iteratee[1];
        if (this.isPlainObject(iteratee)) {
            return obj => {
                for (const key in iteratee) {
                    if (obj[key] !== iteratee[key]) return false;
                }
                return true;
            };
        }
        return value => value;
    }

    _getPredicate(predicate) {
        if (typeof predicate === 'function') return predicate;
        if (typeof predicate === 'string') return obj => !!obj[predicate];
        if (Array.isArray(predicate)) return obj => obj[predicate[0]] === predicate[1];
        if (this.isPlainObject(predicate)) {
            return obj => {
                for (const key in predicate) {
                    if (obj[key] !== predicate[key]) return false;
                }
                return true;
            };
        }
        return () => true;
    }
}

// Create global instance
const _ = new LodashUtilities();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = _;
} else if (typeof window !== 'undefined') {
    window._ = _;
}

// Bible-specific utility extensions
_.bibleUtils = {
    /**
     * Groups verses by chapter
     * @param {Array} verses - Array of verse objects
     * @returns {Object} Grouped verses by chapter
     */
    groupVersesByChapter(verses) {
        return _.groupBy(verses, 'chapter');
    },

    /**
     * Filters verses by search term
     * @param {Array} verses - Array of verse objects
     * @param {string} searchTerm - The term to search for
     * @returns {Array} Filtered verses
     */
    searchVerses(verses, searchTerm) {
        if (!searchTerm) return verses;
        const term = searchTerm.toLowerCase();
        return _.filter(verses, verse => 
            verse.text && verse.text.toLowerCase().includes(term)
        );
    },

    /**
     * Sorts verses by book order, chapter, and verse number
     * @param {Array} verses - Array of verse objects
     * @returns {Array} Sorted verses
     */
    sortVerses(verses) {
        return verses.sort((a, b) => {
            if (a.book !== b.book) return a.book.localeCompare(b.book);
            if (a.chapter !== b.chapter) return a.chapter - b.chapter;
            return a.verse - b.verse;
        });
    },

    /**
     * Creates a verse reference string
     * @param {Object} verse - The verse object
     * @returns {string} Formatted verse reference
     */
    formatVerseReference(verse) {
        return `${verse.book} ${verse.chapter}:${verse.verse}`;
    },

    /**
     * Chunks verses for pagination
     * @param {Array} verses - Array of verse objects
     * @param {number} pageSize - Number of verses per page
     * @returns {Array} Array of verse chunks
     */
    paginateVerses(verses, pageSize = 10) {
        return _.chunk(verses, pageSize);
    }
};

// Performance utilities for the application
_.performance = {
    /**
     * Memoizes expensive function calls
     * @param {Function} func - The function to memoize
     * @param {Function} resolver - The function to resolve the cache key
     * @returns {Function} Memoized function
     */
    memoize(func, resolver) {
        const cache = new Map();
        
        return function(...args) {
            const key = resolver ? resolver.apply(this, args) : args[0];
            
            if (cache.has(key)) {
                return cache.get(key);
            }
            
            const result = func.apply(this, args);
            cache.set(key, result);
            return result;
        };
    },

    /**
     * Creates a function that measures execution time
     * @param {Function} func - The function to measure
     * @param {string} label - Label for the measurement
     * @returns {Function} Wrapped function with timing
     */
    measureTime(func, label = 'Function') {
        return function(...args) {
            const start = performance.now();
            const result = func.apply(this, args);
            const end = performance.now();
            console.log(`${label} execution time: ${(end - start).toFixed(2)}ms`);
            return result;
        };
    }
};

// Create global instance
const LodashUtils = new LodashUtilities();