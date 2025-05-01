class SingleConverter {
    constructor(converter) {
        this.converter = converter;
        this.file = null;
        this.previewContainer = document.getElementById('preview-container');
        this.qualitySlider = document.getElementById('quality');
        this.qualityValue = document.getElementById('quality-value');
        this.convertBtn = document.getElementById('convert-btn');
        this.downloadBtn = document.getElementById('download-btn');
    }

    init() {
        this.setupEventListeners();
    }

    setupEventListeners() {
        const dropZone = document.getElementById('drop-zone');
        
        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.classList.add('active');
        });

        dropZone.addEventListener('dragleave', () => {
            dropZone.classList.remove('active');
        });

        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.classList.remove('active');
            this.handleFile(e.dataTransfer.files[0]);
        });

        dropZone.addEventListener('click', () => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';
            input.onchange = (e) => this.handleFile(e.target.files[0]);
            input.click();
        });

        this.qualitySlider.addEventListener('input', (e) => {
            this.qualityValue.textContent = e.target.value;
            this.converter.setQuality(e.target.value);
        });

        this.convertBtn.addEventListener('click', () => this.convert());
    }

    handleFile(file) {
        if (!file) return;
        this.file = file;
        this.updatePreview();
    }

    updatePreview() {
        this.previewContainer.innerHTML = '';
        const reader = new FileReader();
        reader.onload = (e) => {
            const previewItem = document.createElement('div');
            previewItem.className = 'preview-item';
            previewItem.innerHTML = `
                <div class="image-container">
                    <img class="preview-image" src="${e.target.result}" alt="${this.file.name}">
                </div>
                <div class="preview-info">
                    <span>${this.file.name}</span>
                    <span>${(this.file.size / 1024).toFixed(2)} KB</span>
                </div>
            `;
            this.previewContainer.appendChild(previewItem);
        };
        reader.readAsDataURL(this.file);
    }

    async convert() {
        if (!this.file) return;

        this.convertBtn.disabled = true;
        try {
            const blob = await this.converter.convertToWebP(this.file);
            const { url, link } = this.converter.createDownloadLink(blob, this.file.name);
            link.click();
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error al convertir la imagen:', error);
        }
        this.convertBtn.disabled = false;
    }
} 