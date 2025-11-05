// Main JavaScript for CV Scanner App

document.addEventListener('DOMContentLoaded', function() {
    // Initialize all components
    initializeUploadArea();
    initializeSearch();
    initializeAnimations();
    initializeTooltips();
});

// File Upload Functionality
function initializeUploadArea() {
    const uploadArea = document.getElementById('upload-area');
    const fileInput = document.getElementById('file-input');
    
    if (!uploadArea) return;
    
    // Click to upload
    uploadArea.addEventListener('click', () => {
        fileInput.click();
    });
    
    // Drag and drop functionality
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('dragover');
    });
    
    uploadArea.addEventListener('dragleave', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
    });
    
    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            fileInput.files = files;
            handleFileSelect(files[0]);
        }
    });
    
    // File input change
    if (fileInput) {
        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                handleFileSelect(e.target.files[0]);
            }
        });
    }
}

function handleFileSelect(file) {
    const uploadArea = document.getElementById('upload-area');
    const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    
    if (!allowedTypes.includes(file.type)) {
        showAlert('Please select a PDF or DOCX file only.', 'danger');
        return;
    }
    
    if (file.size > 16 * 1024 * 1024) { // 16MB
        showAlert('File size must be less than 16MB.', 'danger');
        return;
    }
    
    // Update upload area
    uploadArea.innerHTML = `
        <div class="text-center">
            <i class="fas fa-file-check fa-3x text-success mb-3"></i>
            <h5 class="text-success">File Selected: ${file.name}</h5>
            <p class="text-muted">Size: ${formatFileSize(file.size)}</p>
            <button type="button" class="btn btn-outline-secondary btn-sm" onclick="resetUploadArea()">
                <i class="fas fa-times me-1"></i>Remove
            </button>
        </div>
    `;
}

function resetUploadArea() {
    const uploadArea = document.getElementById('upload-area');
    const fileInput = document.getElementById('file-input');
    
    if (fileInput) fileInput.value = '';
    
    uploadArea.innerHTML = `
        <i class="fas fa-cloud-upload-alt fa-4x text-muted mb-3"></i>
        <h4>Drop your CV here</h4>
        <p class="text-muted">or <strong>click to browse</strong></p>
        <small class="text-muted">Supported formats: PDF, DOCX (Max 16MB)</small>
    `;
}

// Search functionality
function initializeSearch() {
    const searchForm = document.getElementById('search-form');
    const skillsInput = document.getElementById('skills-filter');
    
    if (skillsInput) {
        // Add skill tag functionality
        skillsInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                searchForm.submit();
            }
        });
    }
    
    // Real-time search suggestions (could be implemented later)
    if (skillsInput) {
        skillsInput.addEventListener('input', debounce(function() {
            // Implement skill suggestions here
        }, 300));
    }
}

// Animation initialization
function initializeAnimations() {
    // Fade in animations for cards
    const cards = document.querySelectorAll('.card');
    cards.forEach((card, index) => {
        card.style.animationDelay = `${index * 0.1}s`;
        card.classList.add('fade-in');
    });
    
    // Slide up animation for main content
    const mainContent = document.querySelector('main');
    if (mainContent) {
        mainContent.classList.add('slide-up');
    }
}

// Initialize Bootstrap tooltips
function initializeTooltips() {
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function(tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
}

// Utility functions
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function showAlert(message, type = 'info') {
    const alertContainer = document.createElement('div');
    alertContainer.className = `alert alert-${type} alert-dismissible fade show`;
    alertContainer.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    const mainContainer = document.querySelector('main .container');
    if (mainContainer) {
        mainContainer.insertBefore(alertContainer, mainContainer.firstChild);
        
        // Auto dismiss after 5 seconds
        setTimeout(() => {
            if (alertContainer.parentNode) {
                alertContainer.remove();
            }
        }, 5000);
    }
}

function debounce(func, wait) {
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

// Export functionality
function exportData(format = 'excel') {
    const exportBtn = document.getElementById('export-btn');
    if (exportBtn) {
        exportBtn.innerHTML = '<span class="loading"></span> Exporting...';
        exportBtn.disabled = true;
        
        // Re-enable button after 3 seconds
        setTimeout(() => {
            exportBtn.innerHTML = '<i class="fas fa-download me-1"></i>Export to Excel';
            exportBtn.disabled = false;
        }, 3000);
    }
}

// Form validation
function validateForm(formId) {
    const form = document.getElementById(formId);
    if (!form) return false;
    
    const inputs = form.querySelectorAll('input[required], select[required], textarea[required]');
    let isValid = true;
    
    inputs.forEach(input => {
        if (!input.value.trim()) {
            input.classList.add('is-invalid');
            isValid = false;
        } else {
            input.classList.remove('is-invalid');
        }
    });
    
    return isValid;
}

// Search result highlighting
function highlightSearchTerms(text, searchTerms) {
    if (!searchTerms || !text) return text;
    
    const terms = searchTerms.split(',').map(term => term.trim().toLowerCase());
    let highlightedText = text;
    
    terms.forEach(term => {
        if (term) {
            const regex = new RegExp(`(${term})`, 'gi');
            highlightedText = highlightedText.replace(regex, '<mark>$1</mark>');
        }
    });
    
    return highlightedText;
}

// Skill tags management
function addSkillTag(skill) {
    const skillsContainer = document.getElementById('skills-container');
    if (!skillsContainer || !skill) return;
    
    const tag = document.createElement('span');
    tag.className = 'skill-tag me-1 mb-1';
    tag.innerHTML = `
        ${skill}
        <button type="button" class="btn-close btn-close-white ms-1" onclick="removeSkillTag(this)"></button>
    `;
    
    skillsContainer.appendChild(tag);
}

function removeSkillTag(button) {
    button.parentElement.remove();
}

// Loading states
function showLoading(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        element.innerHTML = '<span class="loading"></span> Loading...';
        element.disabled = true;
    }
}

function hideLoading(elementId, originalText) {
    const element = document.getElementById(elementId);
    if (element) {
        element.innerHTML = originalText;
        element.disabled = false;
    }
}

// Copy to clipboard functionality
function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        showAlert('Copied to clipboard!', 'success');
    }).catch(() => {
        showAlert('Failed to copy to clipboard.', 'danger');
    });
}

// Print functionality
function printCandidateDetails() {
    window.print();
}

// Dark mode toggle (if needed)
function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    localStorage.setItem('darkMode', document.body.classList.contains('dark-mode'));
}

// Initialize dark mode from localStorage
function initializeDarkMode() {
    if (localStorage.getItem('darkMode') === 'true') {
        document.body.classList.add('dark-mode');
    }
}
