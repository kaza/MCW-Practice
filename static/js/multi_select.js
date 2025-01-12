// multiselect.js
class MultiSelect {
    constructor(container) {
        this.container = container;
        this.header = container.querySelector('.ms-header');
        this.dropdown = container.querySelector('.ms-dropdown');
        this.selectedDisplay = container.querySelector('.ms-selected-text');
        this.searchInput = container.querySelector('.ms-search-input');
        this.mainCheckbox = container.querySelector('.ms-main-header .ms-checkbox');
        this.allCheckboxes = container.querySelectorAll('.ms-item .ms-checkbox');
        this.selectAllButtons = container.querySelectorAll('.ms-select-all');
        this.expandBtn = container.querySelector('.ms-expand-btn');
        
        this.init();
    }

    init() {
        this.initDropdownToggle();
        this.initSearch();
        this.initMainCheckbox();
        this.initGroupSelectors();
        this.initIndividualCheckboxes();
        this.initClickOutside();
        this.updateSelectedDisplay(); // Initial display update
    }

    initDropdownToggle() {
        this.header.addEventListener('click', (e) => {
            const isExpanded = !this.dropdown.classList.contains('hidden');
            this.dropdown.classList.toggle('hidden');
            this.expandBtn.setAttribute('aria-expanded', !isExpanded);
        });
    }

    initClickOutside() {
        document.addEventListener('click', (e) => {
            if (!this.container.contains(e.target)) {
                this.dropdown.classList.add('hidden');
                this.expandBtn.setAttribute('aria-expanded', 'false');
            }
        });
    }

    initSearch() {
        this.searchInput?.addEventListener('input', (e) => this.handleSearch(e));
    }

    initMainCheckbox() {
        this.mainCheckbox?.addEventListener('change', () => {
            this.handleMainCheckboxChange();
            this.updateSelectedDisplay();
        });
    }

    initGroupSelectors() {
        this.selectAllButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                this.handleGroupSelect(e);
                this.updateSelectedDisplay();
            });
        });
    }

    initIndividualCheckboxes() {
        this.allCheckboxes.forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                this.updateMainCheckboxState();
                this.updateSelectedDisplay();
            });
        });
    }

    handleSearch(event) {
        const searchTerm = event.target.value.toLowerCase();
        const items = this.container.querySelectorAll('.ms-item');
        
        items.forEach(item => {
            const label = item.querySelector('label');
            const text = label.textContent.toLowerCase();
            item.style.display = text.includes(searchTerm) ? '' : 'none';
        });
    }

    handleMainCheckboxChange() {
        const isChecked = this.mainCheckbox.checked;
        this.allCheckboxes.forEach(checkbox => {
            checkbox.checked = isChecked;
        });
    }

    handleGroupSelect(event) {
        event.preventDefault();
        const group = event.target.closest('.ms-group');
        const checkboxes = group.querySelectorAll('.ms-checkbox');
        const allChecked = Array.from(checkboxes).every(cb => cb.checked);
        
        checkboxes.forEach(cb => {
            cb.checked = !allChecked;
        });
        
        this.updateMainCheckboxState();
    }

    updateMainCheckboxState() {
        const totalCheckboxes = this.allCheckboxes.length;
        const checkedCheckboxes = Array.from(this.allCheckboxes).filter(cb => cb.checked).length;

        this.mainCheckbox.checked = checkedCheckboxes === totalCheckboxes;
        this.mainCheckbox.indeterminate = checkedCheckboxes > 0 && checkedCheckboxes < totalCheckboxes;
    }

    updateSelectedDisplay() {
        const checkedBoxes = Array.from(this.allCheckboxes).filter(cb => cb.checked);
        if (checkedBoxes.length === 0) {
            this.selectedDisplay.textContent = 'None selected';
        } else {
            const firstSelected = checkedBoxes[0].closest('.ms-item').querySelector('label').textContent.trim();
            this.selectedDisplay.textContent = checkedBoxes.length === 1 ? 
                firstSelected : 
                `${firstSelected} +${checkedBoxes.length - 1}`;
        }
    }

    // Public methods for external use
    selectAll() {
        this.mainCheckbox.checked = true;
        this.handleMainCheckboxChange();
        this.updateSelectedDisplay();
    }

    deselectAll() {
        this.mainCheckbox.checked = false;
        this.handleMainCheckboxChange();
        this.updateSelectedDisplay();
    }

    getSelectedValues() {
        return Array.from(this.allCheckboxes)
            .filter(cb => cb.checked)
            .map(cb => cb.value);
    }

    setSelectedValues(values) {
        this.allCheckboxes.forEach(checkbox => {
            checkbox.checked = values.includes(checkbox.value);
        });
        this.updateMainCheckboxState();
        this.updateSelectedDisplay();
    }
}

