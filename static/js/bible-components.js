// ====== DXPR - Bible Components (AngularJS-inspired) ======

/**
 * Bible-specific components using the component system
 * Implements tabs, panes, and navigation patterns from AngularJS
 */

// Wait for ComponentSystem to be available
function initializeBibleComponents() {
  if (typeof ComponentSystem === 'undefined' || !ComponentSystem.component) {
    setTimeout(initializeBibleComponents, 50);
    return;
  }

// Bible Tabs Component (inspired by AngularJS tabs directive)
ComponentSystem.component('bible-tabs', {
  restrict: 'E',
  transclude: true,
  scope: {},
  template: `
    <div class="bible-tabbable">
      <ul class="bible-nav bible-nav-tabs">
        <li ng-repeat="pane in panes" ng-class="{active: pane.selected}">
          <a href="" ng-click="select(pane)">{{pane.title}}</a>
        </li>
      </ul>
      <div class="bible-tab-content" ng-transclude></div>
    </div>
  `,
  controller: function($scope, $element) {
    const panes = $scope.panes = [];
    
    $scope.select = function(pane) {
      panes.forEach(p => p.selected = false);
      pane.selected = true;
      
      // Emit selection event
      $scope.$emit('bible-tab-selected', pane);
    };
    
    this.addPane = function(pane) {
      if (panes.length === 0) {
        $scope.select(pane);
      }
      panes.push(pane);
    };
    
    this.removePane = function(pane) {
      const index = panes.indexOf(pane);
      if (index !== -1) {
        panes.splice(index, 1);
        if (pane.selected && panes.length > 0) {
          $scope.select(panes[0]);
        }
      }
    };
  },
  replace: true
});

// Bible Pane Component
ComponentSystem.component('bible-pane', {
  require: '^bible-tabs',
  restrict: 'E',
  transclude: true,
  scope: {
    title: '@',
    disabled: '=?'
  },
  template: `
    <div class="bible-tab-pane" ng-class="{active: selected, disabled: disabled}" ng-transclude></div>
  `,
  link: function(scope, element, attrs, tabsController) {
    scope.selected = false;
    scope.disabled = scope.disabled || false;
    
    if (!scope.disabled) {
      tabsController.addPane(scope);
    }
    
    scope.$on('$destroy', function() {
      tabsController.removePane(scope);
    });
  },
  replace: true
});

// Bible Navigation Component
ComponentSystem.component('bible-nav', {
  restrict: 'E',
  scope: {
    items: '=',
    selectedItem: '=',
    onSelect: '&',
    type: '@' // 'books', 'chapters', 'verses'
  },
  template: `
    <div class="bible-nav-container">
      <div class="bible-nav-header">
        <h4>{{getTitle()}}</h4>
        <div class="bible-nav-search" ng-if="showSearch()">
          <input type="text" 
                 ng-model="searchQuery" 
                 ng-change="filterItems()"
                 placeholder="Buscar..." 
                 class="bible-search-input">
        </div>
      </div>
      <div class="bible-nav-buttons">
        <button ng-repeat="item in filteredItems" 
                ng-class="{active: isSelected(item), 'nav-btn': true}"
                ng-click="selectItem(item)"
                ng-disabled="item.disabled">
          {{getItemLabel(item)}}
        </button>
      </div>
    </div>
  `,
  controller: function($scope) {
    $scope.searchQuery = '';
    $scope.filteredItems = [];
    
    $scope.$watch('items', function(newItems) {
      if (newItems) {
        $scope.filteredItems = [...newItems];
      }
    });
    
    $scope.getTitle = function() {
      switch ($scope.type) {
        case 'books': return 'Libros';
        case 'chapters': return 'Capítulos';
        case 'verses': return 'Versículos';
        default: return 'Navegación';
      }
    };
    
    $scope.showSearch = function() {
      return $scope.type === 'books' && $scope.items && $scope.items.length > 10;
    };
    
    $scope.getItemLabel = function(item) {
      if (typeof item === 'string') return item;
      return item.name || item.label || item.title || item.toString();
    };
    
    $scope.isSelected = function(item) {
      return $scope.selectedItem === item || 
             ($scope.selectedItem && $scope.selectedItem.id === item.id);
    };
    
    $scope.selectItem = function(item) {
      if (item.disabled) return;
      
      $scope.selectedItem = item;
      if ($scope.onSelect) {
        $scope.onSelect({item: item});
      }
    };
    
    $scope.filterItems = function() {
      if (!$scope.searchQuery || !$scope.items) {
        $scope.filteredItems = [...($scope.items || [])];
        return;
      }
      
      const query = $scope.searchQuery.toLowerCase();
      $scope.filteredItems = $scope.items.filter(item => {
        const label = $scope.getItemLabel(item).toLowerCase();
        return label.includes(query);
      });
    };
  }
});

// Bible Verse Display Component
ComponentSystem.component('bible-verse', {
  restrict: 'E',
  scope: {
    verse: '=',
    showReference: '=?',
    showActions: '=?',
    onProject: '&',
    onAddToHistory: '&'
  },
  template: `
    <div class="bible-verse-container" ng-if="verse">
      <div class="bible-verse-reference" ng-if="showReference">
        <strong>{{verse.book}} {{verse.chapter}}:{{verse.number}}</strong>
      </div>
      <div class="bible-verse-text">
        {{verse.text}}
      </div>
      <div class="bible-verse-actions" ng-if="showActions">
        <button class="btn btn-primary" ng-click="projectVerse()">
          <span class="material-symbols-rounded">play_arrow</span>
          Proyectar
        </button>
        <button class="btn btn-secondary" ng-click="addToHistory()">
          <span class="material-symbols-rounded">history</span>
          Historial
        </button>
      </div>
    </div>
  `,
  controller: function($scope) {
    $scope.showReference = $scope.showReference !== false;
    $scope.showActions = $scope.showActions !== false;
    
    $scope.projectVerse = function() {
      if ($scope.onProject) {
        $scope.onProject({verse: $scope.verse});
      }
    };
    
    $scope.addToHistory = function() {
      if ($scope.onAddToHistory) {
        $scope.onAddToHistory({verse: $scope.verse});
      }
    };
  }
});

// Bible Search Component
ComponentSystem.component('bible-search', {
  restrict: 'E',
  scope: {
    onSearch: '&',
    placeholder: '@',
    minLength: '=?'
  },
  template: `
    <div class="bible-search-container">
      <div class="bible-search-input-group">
        <input type="text" 
               ng-model="query" 
               ng-change="handleSearch()"
               ng-keyup="handleKeyup($event)"
               placeholder="{{placeholder || 'Buscar versículos...'}}"
               class="bible-search-input">
        <button class="bible-search-btn" 
                ng-click="search()"
                ng-disabled="!canSearch()">
          <span class="material-symbols-rounded">search</span>
        </button>
      </div>
      <div class="bible-search-results" ng-if="results.length > 0">
        <div class="bible-search-result" 
             ng-repeat="result in results"
             ng-click="selectResult(result)">
          <div class="result-reference">
            <strong>{{result.book}} {{result.chapter}}:{{result.verse}}</strong>
          </div>
          <div class="result-text">{{result.text}}</div>
        </div>
      </div>
    </div>
  `,
  controller: function($scope) {
    $scope.query = '';
    $scope.results = [];
    $scope.minLength = $scope.minLength || 3;
    
    let searchTimeout;
    
    $scope.canSearch = function() {
      return $scope.query && $scope.query.length >= $scope.minLength;
    };
    
    $scope.handleSearch = function() {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
      
      searchTimeout = setTimeout(() => {
        if ($scope.canSearch()) {
          $scope.search();
        } else {
          $scope.results = [];
        }
      }, 300);
    };
    
    $scope.handleKeyup = function(event) {
      if (event.key === 'Enter' && $scope.canSearch()) {
        $scope.search();
      }
    };
    
    $scope.search = function() {
      if (!$scope.canSearch()) return;
      
      if ($scope.onSearch) {
        $scope.onSearch({query: $scope.query});
      }
    };
    
    $scope.selectResult = function(result) {
      $scope.$emit('bible-search-result-selected', result);
    };
  }
});

// Bible History Component
ComponentSystem.component('bible-history', {
  restrict: 'E',
  scope: {
    history: '=',
    onSelect: '&',
    onClear: '&',
    maxItems: '=?'
  },
  template: `
    <div class="bible-history-container">
      <div class="bible-history-header">
        <h4>Historial</h4>
        <button class="btn btn-sm btn-outline" 
                ng-click="clearHistory()"
                ng-if="history.length > 0">
          <span class="material-symbols-rounded">clear_all</span>
          Limpiar
        </button>
      </div>
      <div class="bible-history-list" ng-if="history.length > 0">
        <div class="bible-history-item" 
             ng-repeat="item in limitedHistory"
             ng-click="selectItem(item)">
          <div class="history-reference">
            <strong>{{item.book}} {{item.chapter}}:{{item.verse}}</strong>
          </div>
          <div class="history-text">{{item.text | limitTo:50}}{{item.text.length > 50 ? '...' : ''}}</div>
          <div class="history-time">{{formatTime(item.timestamp)}}</div>
        </div>
      </div>
      <div class="bible-history-empty" ng-if="history.length === 0">
        <p>No hay elementos en el historial</p>
      </div>
    </div>
  `,
  controller: function($scope) {
    $scope.maxItems = $scope.maxItems || 10;
    
    $scope.$watch('history', function(newHistory) {
      if (newHistory) {
        $scope.limitedHistory = newHistory.slice(0, $scope.maxItems);
      }
    });
    
    $scope.selectItem = function(item) {
      if ($scope.onSelect) {
        $scope.onSelect({item: item});
      }
    };
    
    $scope.clearHistory = function() {
      if ($scope.onClear) {
        $scope.onClear();
      }
    };
    
    $scope.formatTime = function(timestamp) {
      if (!timestamp) return '';
      const date = new Date(timestamp);
      return date.toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit'
      });
    };
  }
});

// Bible Pluralization Filter (inspired by AngularJS ng-pluralize)
ComponentSystem.filter = ComponentSystem.filter || {};
ComponentSystem.filter('biblePluralize', function() {
  return function(count, forms) {
    if (!forms || typeof forms !== 'object') return '';
    
    if (count === 0 && forms['0']) return forms['0'];
    if (count === 1 && forms['one']) return forms['one'];
    if (forms['other']) return forms['other'];
    
    return forms[count] || '';
  };
});

// Initialize Bible Components
document.addEventListener('DOMContentLoaded', function() {
  // Register components with the global component system
  console.log('Bible components initialized');
  
  // Setup global event listeners for bible components
  document.addEventListener('bible-tab-selected', function(event) {
    console.log('Bible tab selected:', event.detail);
  });
  
  document.addEventListener('bible-search-result-selected', function(event) {
    console.log('Bible search result selected:', event.detail);
  });
});

}

// Initialize bible components when ready
initializeBibleComponents();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    ComponentSystem
  };
}