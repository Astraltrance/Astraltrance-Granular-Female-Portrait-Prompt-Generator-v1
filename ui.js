class UI {
    constructor() {
        this.dataLoader = null;
        this.promptGenerator = null;
        this.isInitialized = false;
        this.currentPrompt = '';
        
        this.initializeElements();
        this.attachEventListeners();
        this.initialize();
    }

    // Get references to DOM elements
    initializeElements() {
        // Controls
        this.clothingStyleSelect = document.getElementById('clothing-style');
        this.settingTypeSelect = document.getElementById('setting-type');
        this.artStyleSelect = document.getElementById('art-style');
        this.semanticStackToggle = document.getElementById('semantic-stack-toggle');

        // Buttons
        this.generateBtn = document.getElementById('generate-btn');
        this.copyBtn = document.getElementById('copy-btn');
        this.themeButtons = document.querySelectorAll('.theme-btn');
        this.downloadBtn = document.getElementById('download-btn');

        // Output
        this.promptOutput = document.getElementById('prompt-output');
        this.characterCount = document.getElementById('character-count');
        this.wordCount = document.getElementById('word-count');

        // Status elements
        this.loadingIndicator = document.getElementById('loading-indicator');
        this.statusMessage = document.getElementById('status-message');

    }

    // Attach event listeners
    attachEventListeners() {
        // Generation buttons
        this.generateBtn.addEventListener('click', () => this.handleGenerate());
        if (this.semanticStackToggle) {
            this.semanticStackToggle.addEventListener('change', () => this.handleSemanticToggleChange());
        }
        this.copyBtn.addEventListener('click', () => this.handleCopy());
        this.downloadBtn.addEventListener('click', () => this.handleDownload());

        // Theme buttons
        this.themeButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const theme = e.target.getAttribute('data-theme');
                this.handleThemedGenerate(theme);
            });
        });
// Batch generation button
const batchBtn = document.getElementById('batch-generate-btn');
if (batchBtn) {
    batchBtn.addEventListener('click', () => this.handleBatchGenerate(10));
}

        // Prompt output changes
        this.promptOutput.addEventListener('input', () => this.updateCounts());


        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.handleGenerate();
                } else if (e.key === 'c' && this.currentPrompt) {
                    // Don't prevent default here, let normal copy work
                    // but ensure our copy button is enabled
                }
            }
        });
    }

    // Initialize the application
    async initialize() {
        try {
            this.showStatus('Initializing...', 'info');
            this.showLoading(true);
            this.setButtonsEnabled(false);

            // Initialize data loader and generator
            this.dataLoader = new DataLoader();
            await this.dataLoader.loadAllData();
            
            this.promptGenerator = new PromptGenerator(this.dataLoader);
            this.isInitialized = true;

            this.showStatus('Ready to generate prompts!', 'success');
            this.setButtonsEnabled(true);
            
            // Auto-hide success message after 3 seconds
            setTimeout(() => this.hideStatus(), 3000);

        } catch (error) {
            console.error('Initialization error:', error);
            this.showStatus('Error loading data files. Please refresh the page.', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    // Handle main generate button
    async handleGenerate() {
        if (!this.isInitialized) {
            this.showStatus('Still initializing, please wait...', 'warning');
            return;
        }

        try {
            this.showLoading(true);
            this.setButtonsEnabled(false);

            const preferences = this.getPreferences();
            const prompt = await this.promptGenerator.generatePrompt(preferences);
            
            this.displayPrompt(prompt);
            this.showStatus('Prompt generated successfully!', 'success');
            
            // Auto-hide success message
            setTimeout(() => this.hideStatus(), 2000);

        } catch (error) {
            console.error('Generation error:', error);
            this.showStatus('Error generating prompt. Please try again.', 'error');
        } finally {
            this.showLoading(false);
            this.setButtonsEnabled(true);
        }
    }
// === NEW: Batch Generation ===
async handleBatchGenerate(count = 10) {
    if (!this.isInitialized) {
        this.showStatus('Still initializing, please wait...', 'warning');
        return;
    }

    this.showLoading(true);
    this.setButtonsEnabled(false);

    const preferences = this.getPreferences();
    const conciseMode = document.getElementById('concise-mode')?.checked;
    let allPrompts = [];

    try {
        for (let i = 0; i < count; i++) {
            const prompt = await this.promptGenerator.generatePrompt(preferences, { concise: conciseMode });
            // If semantic mode is enabled, reformat accordingly
            const formattedPrompt = preferences.semanticStack
                ? this.promptGenerator.transformPromptFormat(prompt, { semanticStack: true })
                : prompt;

            allPrompts.push(formattedPrompt);
        }

        // Combine into one text block separated by newlines
        const batchOutput = allPrompts.join('\n\n');

        // Show combined prompts in the output box
        this.promptOutput.value = batchOutput;
        this.currentPrompt = batchOutput;
        this.updateCounts();
        this.copyBtn.disabled = false;
        if (this.downloadBtn) {
            this.downloadBtn.disabled = !(batchOutput && batchOutput.trim());
        }

        this.showStatus(`Generated ${count} prompts successfully!`, 'success');
    } catch (error) {
        console.error('Batch generation error:', error);
        this.showStatus('Error during batch generation.', 'error');
    } finally {
        this.showLoading(false);
        this.setButtonsEnabled(true);
    }
}

    handleSemanticToggleChange() {
        if (!this.isInitialized || !this.promptGenerator) {
            return;
        }

        if (!this.currentPrompt || !this.currentPrompt.trim()) {
            return;
        }

        const toggledPrompt = this.promptGenerator.transformPromptFormat(
            this.currentPrompt,
            { semanticStack: this.semanticStackToggle?.checked }
        );

        if (toggledPrompt && toggledPrompt !== this.currentPrompt) {
            this.displayPrompt(toggledPrompt, { skipScroll: true });
            this.showStatus('Prompt reformatted.', 'info');
            setTimeout(() => this.hideStatus(), 1500);
        }
    }


    // Handle themed generation
    async handleThemedGenerate(theme) {
        if (!this.isInitialized) {
            this.showStatus('Still initializing, please wait...', 'warning');
            return;
        }

        try {
            this.showLoading(true);
            this.setButtonsEnabled(false);

            const overrides = {};
            if (this.semanticStackToggle) {
                overrides.semanticStack = this.semanticStackToggle.checked;
            }
// --- Micro Fix 3: Auto Brightness for Natural/Fantasy ---
if (theme === 'natural' || theme === 'fantasy') {
    overrides.lightingMood = 'bright';
}

            const prompt = await this.promptGenerator.generateThemed(theme, overrides);
            
            this.displayPrompt(prompt);
            this.showStatus(`${theme.charAt(0).toUpperCase() + theme.slice(1)} prompt generated!`, 'success');
            
            setTimeout(() => this.hideStatus(), 2000);

        } catch (error) {
            console.error('Themed generation error:', error);
            this.showStatus('Error generating prompt. Please try again.', 'error');
        } finally {
            this.showLoading(false);
            this.setButtonsEnabled(true);
        }
    }

    // Handle copy to clipboard
    async handleCopy() {
        if (!this.currentPrompt) {
            this.showStatus('No prompt to copy!', 'warning');
            return;
        }

        try {
            await navigator.clipboard.writeText(this.currentPrompt);
            this.showStatus('Prompt copied to clipboard!', 'success');
            
            // Visual feedback on copy button
            const originalText = this.copyBtn.textContent;
            this.copyBtn.textContent = 'Copied!';
            this.copyBtn.classList.add('copied');
            
            setTimeout(() => {
                this.copyBtn.textContent = originalText;
                this.copyBtn.classList.remove('copied');
            }, 1500);
            
            setTimeout(() => this.hideStatus(), 2000);

        } catch (error) {
            console.error('Copy error:', error);
            
            // Fallback for older browsers
            try {
                this.promptOutput.select();
                document.execCommand('copy');
                this.showStatus('Prompt copied to clipboard!', 'success');
            } catch (fallbackError) {
                this.showStatus('Could not copy to clipboard. Please select and copy manually.', 'error');
            }
        }
    }

    // Get current preferences from controls
    getPreferences() {
        const preferences = {};

        const clothingStyle = this.clothingStyleSelect.value;
        if (clothingStyle !== 'random') {
            preferences.clothingStyle = clothingStyle;
        }

        const settingType = this.settingTypeSelect.value;
        if (settingType !== 'random') {
            preferences.settingType = settingType;
        }

        const artStyle = this.artStyleSelect.value;
        if (artStyle !== 'random') {
            preferences.artStyle = artStyle;
        }

        // Get radio button values and convert to percentages
        const embellishment = document.querySelector('input[name="embellishment"]:checked').value;
        const hairEffects = document.querySelector('input[name="hair-effects"]:checked').value;
        const colorBoldness = document.querySelector('input[name="color-boldness"]:checked').value;
        const accessories = document.querySelector('input[name="accessories"]:checked').value;
        const accessoryFrequency = document.querySelector('input[name="accessory-frequency"]:checked').value;
        const pose = document.querySelector('input[name="pose"]:checked').value;
        const outfitCompleteness = document.querySelector('input[name="outfit-completeness"]:checked').value;
        const lightingMood = document.querySelector('input[name="lighting-mood"]:checked').value;
        const hairVariation = document.querySelector('input[name="hair-variation"]:checked').value;
        const outfitDiversity = document.querySelector('input[name="outfit-diversity"]:checked').value;



        // Convert radio values to percentage values for generator
        preferences.embellishmentChance = this.convertToPercentage(embellishment);
        preferences.hairEffectsChance = this.convertToPercentage(hairEffects);
        preferences.colorBoldnessChance = this.convertToPercentage(colorBoldness);
        preferences.accessoryDensityChance = this.convertToPercentage(accessories);
        preferences.accessoryFrequency = this.convertToPercentage(accessoryFrequency);
        preferences.poseControl = pose; // 'off', 'medium', or 'always'
        preferences.outfitCompleteness = outfitCompleteness; // 'complete' or 'single'
        preferences.outfitDiversity = this.convertToPercentage(outfitDiversity);
        preferences.hairVariation = this.convertToPercentage(hairVariation);
        preferences.lightingMood = lightingMood;
        if (this.semanticStackToggle) {
            preferences.semanticStack = this.semanticStackToggle.checked;
        }

        return preferences;
    }

// Add this new helper method
convertToPercentage(value) {
    const mapping = {
        'simple': 30,
        'natural': 30,
        'muted': 30,
        'minimal': 30,
        'medium': 65,
        'dramatic': 90,
        'fantasy': 90,
        'vibrant': 90,
        'maximum': 90
    };
    return mapping[value] || 65;
}

    // Display generated prompt
    displayPrompt(prompt, options = {}) {
        const { skipScroll = false } = options;

        this.currentPrompt = prompt;
        this.promptOutput.value = prompt;
        this.updateCounts();
        this.copyBtn.disabled = !prompt;
        if (this.downloadBtn) this.downloadBtn.disabled = !prompt;
        
        if (!skipScroll) {
            this.promptOutput.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }

    // Update character and word counts
    updateCounts() {
        const text = this.promptOutput.value;
        const charCount = text.length;
        const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;

        this.characterCount.textContent = `Characters: ${charCount}`;
        this.wordCount.textContent = `Words: ${wordCount}`;
    }

    // Show/hide loading indicator
    showLoading(show) {
        if (show) {
            this.loadingIndicator.classList.remove('hidden');
        } else {
            this.loadingIndicator.classList.add('hidden');
        }
    }

    // Enable/disable buttons
    setButtonsEnabled(enabled) {
        this.generateBtn.disabled = !enabled;
        
        this.themeButtons.forEach(btn => {
            btn.disabled = !enabled;
        });

        if (this.semanticStackToggle) {
            this.semanticStackToggle.disabled = !enabled;
            const toggleLabel = this.semanticStackToggle.parentElement;
            if (toggleLabel && toggleLabel.classList) {
                toggleLabel.classList.toggle('disabled', !enabled);
            }
        }

        if (!enabled) {
            this.copyBtn.disabled = true;
        }
    }

    // Show status message
    showStatus(message, type = 'info') {
        this.statusMessage.textContent = message;
        this.statusMessage.className = `status-message ${type}`;
        this.statusMessage.classList.remove('hidden');
    }

    // Hide status message
    hideStatus() {
        this.statusMessage.classList.add('hidden');
    }

    // Clear current prompt
    clearPrompt() {
        this.currentPrompt = '';
        this.promptOutput.value = '';
        this.updateCounts();
        this.copyBtn.disabled = true;
        if (this.downloadBtn) {
            this.downloadBtn.disabled = true;
        }
    }

    // Reset all controls to default
    resetControls() {
        this.clothingStyleSelect.value = 'random';
        this.settingTypeSelect.value = 'random';
        this.artStyleSelect.value = 'random';

        if (this.semanticStackToggle) {
            this.semanticStackToggle.checked = false;
        }
    }
  // === NEW: Download prompt text as a file ===
handleDownload() {
    if (!this.currentPrompt || !this.currentPrompt.trim()) {
        this.showStatus('No prompts to download!', 'warning');
        return;
    }

    // Give the file a name like "prompt-batch-2025-10-23.txt"
    const filename = `prompt-batch-${new Date().toISOString().slice(0,10)}.txt`;

    // Call the helper that actually makes the file
    this.downloadTextFile(this.currentPrompt, filename);

    // Show feedback message
    this.showStatus('Prompt batch downloaded!', 'success');
    setTimeout(() => this.hideStatus(), 2000);
}

// === Helper function for file creation ===
downloadTextFile(text, filename) {
    // Create a text file in memory and make the browser download it
    const blob = new Blob([text], { type: 'text/plain' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
}
  
}

// Initialize the UI when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.ui = new UI();
});
