class MultipleConverter {
    constructor(converter) {
        this.converter = converter;
        this.files = [];
        this.previewContainer = document.getElementById('preview-container');
        this.qualitySlider = document.getElementById('quality');
        this.qualityValue = document.getElementById('quality-value');
        this.convertBtn = document.getElementById('convert-btn');
        this.downloadBtn = document.getElementById('download-btn');
        this.progressBar = document.getElementById('progress-bar');
        this.progressText = document.getElementById('progress-text');
        this.zip = new JSZip();
    }

    init() {
        this.setupEventListeners();
        this.updateConvertButton();
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
            this.handleFiles(e.dataTransfer.files);
        });

        dropZone.addEventListener('click', () => {
            const input = document.createElement('input');
            input.type = 'file';
            input.multiple = true;
            input.accept = 'image/*';
            input.onchange = (e) => this.handleFiles(e.target.files);
            input.click();
        });

        this.qualitySlider.addEventListener('input', (e) => {
            this.qualityValue.textContent = e.target.value;
            this.converter.setQuality(e.target.value);
        });

        this.convertBtn.addEventListener('click', () => this.convertAll());
    }

    handleFiles(files) {
        const newFiles = Array.from(files);
        this.files = [...this.files, ...newFiles];
        this.updatePreview();
        this.updateConvertButton();
    }

    removeFile(index) {
        this.files.splice(index, 1);
        this.updatePreview();
        this.updateConvertButton();
    }

    updateConvertButton() {
        this.convertBtn.disabled = this.files.length === 0;
    }

    updatePreview() {
        this.previewContainer.innerHTML = '';
        this.files.forEach((file, index) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const previewItem = document.createElement('div');
                previewItem.className = 'preview-item';
                previewItem.innerHTML = `
                    <button class="remove-btn" onclick="multipleConverter.removeFile(${index})">×</button>
                    <div class="image-container">
                        <img src="${e.target.result}" alt="${file.name}">
                    </div>
                    <div class="preview-info">
                        <span>${file.name}</span>
                        <span>${(file.size / 1024).toFixed(2)} KB</span>
                    </div>
                `;
                this.previewContainer.appendChild(previewItem);
            };
            reader.readAsDataURL(file);
        });
    }

    async convertAll() {
        if (this.files.length === 0) return;

        this.progressBar.style.width = '0%';
        this.progressText.textContent = '0%';
        this.convertBtn.disabled = true;
        this.zip = new JSZip();

        for (let i = 0; i < this.files.length; i++) {
            try {
                const blob = await this.converter.convertToWebP(this.files[i]);
                this.zip.file(`${this.converter.getFileNameWithoutExtension(this.files[i].name)}.webp`, blob);
                
                const progress = ((i + 1) / this.files.length) * 100;
                this.progressBar.style.width = `${progress}%`;
                this.progressText.textContent = `${Math.round(progress)}%`;
            } catch (error) {
                console.error(`Error al convertir ${this.files[i].name}:`, error);
            }
        }

        this.convertBtn.disabled = false;
        await this.downloadAll();
    }

    async downloadAll() {
        if (this.zip.files.length === 0) return;

        const content = await this.zip.generateAsync({ type: 'blob' });
        const url = URL.createObjectURL(content);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'converted_images.zip';
        link.click();
        URL.revokeObjectURL(url);
    }
} 