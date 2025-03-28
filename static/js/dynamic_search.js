class DynamicSearch {
    constructor(options) {
        this.containerId = options.containerId;
        this.items = options.items || [];
        this.onSelect = options.onSelect || function() {};
        
        this.container = document.getElementById(this.containerId);
        this.init();
    }

    init() {
        this.searchInput = this.container.querySelector('.search-input');
        this.dropdown = this.container.querySelector('.select-search-dropdown');
        this.selectedIndex = -1;

        this.setupEventListeners();

        this.inputWrapper = this.container.querySelector('.input-wrapper');
        if (!this.inputWrapper) {
            // Create input wrapper if it doesn't exist
            this.inputWrapper = document.createElement('div');
            this.inputWrapper.className = 'input-wrapper';
            this.searchInput.parentNode.insertBefore(this.inputWrapper, this.searchInput);
            this.inputWrapper.appendChild(this.searchInput);
        }
    }

    setupEventListeners() {
        // Input event
        this.searchInput.addEventListener('input', () => {
            this.filterItems(this.searchInput.value);
            if(this.searchInput.value.trim() === ''){
                //remove existing icon
                const existingIcon = this.inputWrapper.querySelector('.location-icon');
                if (existingIcon) {
                    existingIcon.remove();
                }
            }
        });

        // Focus event
        this.searchInput.addEventListener('focus', () => {
            if (this.searchInput.value) {
                this.filterItems(this.searchInput.value);
            } else {
                this.showAllItems();
            }
        });

        // Click on dropdown arrow
        const arrow = this.container.querySelector('.dropdown-arrow');
        arrow.addEventListener('click', (e) => {
            e.stopPropagation();
            if (this.dropdown.style.display === 'block') {
                this.hideDropdown();
            } else {
                this.showAllItems();
            }
        });

        // Keyboard navigation
        this.searchInput.addEventListener('keydown', (e) => {
            this.handleKeyboard(e);
        });

        // Click outside
        document.addEventListener('click', (e) => {
            if (!this.container.contains(e.target)) {
                this.hideDropdown();
            }
        });
    }

    filterItems(searchTerm) {
        const filtered = this.items.filter(item =>
            item.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
        
        
        this.renderDropdown(filtered);
    }

    showAllItems() {
        this.renderDropdown(this.items);
    }

    renderDropdown(items) {
        this.dropdown.innerHTML = '';
        
        items.forEach((item, index) => {
            const div = document.createElement('div');
            div.className = 'dropdown-item';
            
            if (item.svg) {
                div.innerHTML = `${item.svg}<span>${item.name}</span>`;
            } else {
                div.innerHTML = `<span>${item.name}</span>`;
            }
            
            div.addEventListener('click', () => {
                this.selectItem(item);
            });

            div.addEventListener('mouseover', () => {
                this.selectedIndex = index;
                this.highlightItem();
            });

            this.dropdown.appendChild(div);
        });

        this.dropdown.style.display = items.length ? 'block' : 'none';
    }

    selectItem(item) {
        this.searchInput.value = item.name;
        this.searchInput.dataset.searchId = item.id;
        
        // Remove existing icon if present
        const existingIcon = this.inputWrapper.querySelector('.location-icon');
        if (existingIcon) {
            existingIcon.remove();
        }
        
        // Add SVG if provided
        if (item.svg) {
            const iconDiv = document.createElement('div');
            iconDiv.className = 'location-icon';
            iconDiv.innerHTML = item.svg;
            this.inputWrapper.insertBefore(iconDiv, this.searchInput);
        }
        
        this.hideDropdown();
        this.onSelect(item);
    }


    selectItemById(id) {
        const item = this.items.find(item => item.id === id);
        if (item) {
            this.selectItem(item);
        }
    }

    handleKeyboard(e) {
        const items = this.dropdown.getElementsByClassName('dropdown-item');
        
        switch(e.key) {
            case 'ArrowDown':
                e.preventDefault();
                this.selectedIndex = Math.min(this.selectedIndex + 1, items.length - 1);
                this.highlightItem();
                break;
            case 'ArrowUp':
                e.preventDefault();
                this.selectedIndex = Math.max(this.selectedIndex - 1, 0);
                this.highlightItem();
                break;
            case 'Enter':
                e.preventDefault();
                if (this.selectedIndex >= 0 && items[this.selectedIndex]) {
                    items[this.selectedIndex].click();
                }
                break;
            case 'Escape':
                this.hideDropdown();
                break;
        }
    }

    highlightItem() {
        const items = this.dropdown.getElementsByClassName('dropdown-item');
        Array.from(items).forEach(item => item.classList.remove('highlight'));
        
        if (this.selectedIndex >= 0 && items[this.selectedIndex]) {
            items[this.selectedIndex].classList.add('highlight');
            items[this.selectedIndex].scrollIntoView({ block: 'nearest' });
        }
    }

    hideDropdown() {
        this.dropdown.style.display = 'none';
        this.selectedIndex = -1;
    }

    getSelectedItem() {
        // Check if the search input value is empty
        if (this.searchInput.value.trim() === '') {
            return null; 
        }
        return {
            id: this.searchInput.dataset.searchId,
            name: this.searchInput.value
        };
    }

    reset() {
        this.searchInput.value = '';
        this.searchInput.dataset.searchId = '';
        this.hideDropdown();
    }
}