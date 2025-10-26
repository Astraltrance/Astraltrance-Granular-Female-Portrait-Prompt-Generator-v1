class DataLoader {
    constructor() {
        this.data = {};
        this.isLoaded = false;
        this.loadingPromise = null;
    }

    // List of all JSON files to load
    getFileList() {
        return [
            'eyewear.json',
            'headwear.json',
            'jewelry.json',
            'hair-styles.json',
            'skin-tones.json',
            'bottoms.json',
            'cultural-wear.json',
            'dresses.json',
            'outerwear.json',
            'tops.json',
            'clothing-colors.json',
            'hair-colors.json',
            'clothing.json',
            'subjects.json',
            'fantasy.json',
            'historical.json',
            'natural.json',
            'urban.json',
            'lighting.json',
            'art-styles.json',
            'poses.json'
        ];
    }

    // Load all JSON files
    async loadAllData() {
        if (this.isLoaded) {
            return this.data;
        }

        if (this.loadingPromise) {
            return this.loadingPromise;
        }

        this.loadingPromise = this._performLoad();
        return this.loadingPromise;
    }

    async _performLoad() {
        const files = this.getFileList();
        const loadPromises = files.map(filename => this._loadFile(filename));
        
        try {
            await Promise.all(loadPromises);
            this.isLoaded = true;
            console.log('All data files loaded successfully');
            return this.data;
        } catch (error) {
            console.error('Error loading data files:', error);
            throw error;
        }
    }

    async _loadFile(filename) {
  try {
    // Fetch from the /data subfolder
    const response = await fetch(`data/${filename}`);
    if (!response.ok) {
      throw new Error(`Failed to load ${filename}: ${response.status}`);
    }

    const jsonData = await response.json();
    const fileKey = filename.replace('.json', '');
    this.data[fileKey] = jsonData;
    console.log(`Loaded: ${filename}`);
  } catch (error) {
    console.error(`Error loading ${filename}:`, error);
    // Store empty object for failed files to prevent crashes
    const fileKey = filename.replace('.json', '');
    this.data[fileKey] = {};
  }
}


    // Get a random item from a specific category in a file
    getRandomFrom(filename, category) {
        const fileKey = filename.replace('.json', '');
        
        if (!this.data[fileKey]) {
            console.warn(`File ${filename} not loaded`);
            return null;
        }

        if (!this.data[fileKey][category]) {
            console.warn(`Category ${category} not found in ${filename}`);
            return null;
        }

        const items = this.data[fileKey][category];
        if (!Array.isArray(items) || items.length === 0) {
            console.warn(`Category ${category} in ${filename} is empty or not an array`);
            return null;
        }

        const randomIndex = Math.floor(Math.random() * items.length);
        return items[randomIndex];
    }

    // Get multiple random items from a category (without duplicates)
    getRandomItemsFrom(filename, category, count = 1) {
        const fileKey = filename.replace('.json', '');
        
        if (!this.data[fileKey] || !this.data[fileKey][category]) {
            return [];
        }

        const items = this.data[fileKey][category];
        if (!Array.isArray(items) || items.length === 0) {
            return [];
        }

        // If requesting more items than available, return all items shuffled
        if (count >= items.length) {
            return [...items].sort(() => Math.random() - 0.5);
        }

        // Get random items without duplicates
        const shuffled = [...items].sort(() => Math.random() - 0.5);
        return shuffled.slice(0, count);
    }

    // Get all categories available in a file
    getAllCategories(filename) {
        const fileKey = filename.replace('.json', '');
        
        if (!this.data[fileKey]) {
            return [];
        }

        return Object.keys(this.data[fileKey]);
    }

    // Get all items from a category
    getAllFrom(filename, category) {
        const fileKey = filename.replace('.json', '');
        
        if (!this.data[fileKey] || !this.data[fileKey][category]) {
            return [];
        }

        return this.data[fileKey][category] || [];
    }

    // Check if data is loaded
    isDataLoaded() {
        return this.isLoaded;
    }

    // Get random choice between multiple options
    randomChoice(options) {
        if (!Array.isArray(options) || options.length === 0) {
            return null;
        }
        return options[Math.floor(Math.random() * options.length)];
    }

    // Get a weighted random choice (for future use)
        weightedRandomChoice(options, weights = null) {
        if (!Array.isArray(options) || options.length === 0) {
            return null;
        }

        if (!weights) {
            return this.randomChoice(options);
        }

        const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
        let random = Math.random() * totalWeight;
        
        for (let i = 0; i < options.length; i++) {
            random -= weights[i];
            if (random <= 0) {
                return options[i];
            }
        }
        
        return options[options.length - 1];
    }

    // ✅ NEW: existence helper used by the generator
    hasKey(filename, category) {
        const fileKey = filename.replace('.json', '');
        const file = this.data[fileKey];
        return !!(file && Object.prototype.hasOwnProperty.call(file, category) && Array.isArray(file[category]));
    }
}

// Export for use in other files
window.DataLoader = DataLoader;
