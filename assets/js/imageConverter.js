class ImageConverter {
    constructor(quality = 75) {
        this.quality = quality;
    }

    setQuality(quality) {
        this.quality = quality;
    }

    async convertToWebP(file) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0);
                
                canvas.toBlob(blob => {
                    if (blob) {
                        resolve(blob);
                    } else {
                        reject(new Error('Error al convertir la imagen a WebP'));
                    }
                }, 'image/webp', this.quality / 100);
            };
            
            img.onerror = () => {
                reject(new Error(`Error al cargar la imagen ${file.name}`));
            };
            
            img.src = URL.createObjectURL(file);
        });
    }

    getFileNameWithoutExtension(fileName) {
        const nameParts = fileName.split('.');
        return nameParts.length > 1 
            ? nameParts.slice(0, -1).join('.') 
            : nameParts[0];
    }

    createDownloadLink(blob, fileName) {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${this.getFileNameWithoutExtension(fileName)}.webp`;
        return { url, link };
    }
} 