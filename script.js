// Функция для транслитерации
function transliterate(text) {
    const rus = ['а','б','в','г','д','е','ё','ж','з','и','й','к','л','м','н','о','п','р','с','т','у','ф','х','ц','ч','ш','щ','ъ','ы','ь','э','ю','я',' '];
    const eng = ['a','b','v','g','d','e','e','zh','z','i','y','k','l','m','n','o','p','r','s','t','u','f','kh','ts','ch','sh','shch','','y','','e','yu','ya','-'];
    
    let result = '';
    for (let i = 0; i < text.length; i++) {
        const char = text[i].toLowerCase();
        const index = rus.indexOf(char);
        if (index !== -1) {
            result += eng[index];
        } else {
            result += char;
        }
    }
    result = result.replace(/[^a-z0-9-]/g, '').replace(/-+/g, '-').replace(/^-|-$/g, '');
    return result;
}

// Загружаем данные о людях
async function loadPeople() {
    try {
        const response = await fetch('people.json');
        const data = await response.json();
        return data.people;
    } catch (error) {
        console.error('Ошибка загрузки данных:', error);
        return [];
    }
}

// Глобальные переменные
let peopleList = [];
let currentPerson = null;
let currentPhotoIndex = -1;

// Инициализация
async function init() {
    peopleList = await loadPeople();
    createButtons();
    checkUrl();
}

// Создаем кнопки
function createButtons() {
    const container = document.getElementById('buttonsContainer');
    container.innerHTML = '';
    
    peopleList.forEach(person => {
        const button = document.createElement('button');
        button.className = 'person-btn';
        button.textContent = person.name;
        button.onclick = () => openGallery(person);
        container.appendChild(button);
    });
}

// Открыть галерею человека
function openGallery(person, photoIndex = -1) {
    currentPerson = person;
    currentPhotoIndex = photoIndex;
    
    // Обновляем URL
    const slug = transliterate(person.name);
    let newUrl = `/schoolhub/${slug}`;
    if (photoIndex >= 0) {
        newUrl = `/schoolhub/${slug}-${photoIndex + 1}`;
    }
    window.history.pushState({}, '', newUrl);
    
    // Показываем галерею
    showGallery();
}

// Показать галерею
function showGallery() {
    if (!currentPerson) return;
    
    const gallery = document.getElementById('gallery');
    const personName = document.getElementById('selectedPersonName');
    const photosGrid = document.getElementById('photosGrid');
    const copyGalleryBtn = document.getElementById('copyGalleryBtn');
    
    personName.textContent = currentPerson.name;
    photosGrid.innerHTML = '';
    
    // Кнопка копирования галереи
    copyGalleryBtn.onclick = () => {
        const slug = transliterate(currentPerson.name);
        const url = `https://bthebfr.github.io/schoolhub/${slug}`;
        navigator.clipboard.writeText(url);
        copyGalleryBtn.innerHTML = '✅ Скопировано!';
        setTimeout(() => {
            copyGalleryBtn.innerHTML = '🔗 Галерея';
        }, 2000);
    };
    
    // Создаем фото
    currentPerson.photos.forEach((photo, index) => {
        const folderName = currentPerson.name.toLowerCase().replace(/ /g, '_');
        const photoPath = `images/${folderName}/${photo}`;
        
        const frame = document.createElement('div');
        frame.className = 'photo-frame';
        
        const img = document.createElement('img');
        img.src = photoPath;
        img.alt = `Фото ${index + 1}`;
        img.onerror = () => {
            img.src = 'https://via.placeholder.com/300x300?text=Нет+фото';
        };
        
        const caption = document.createElement('p');
        caption.textContent = `Фото ${index + 1}`;
        
        // Кнопки
        const buttonGroup = document.createElement('div');
        buttonGroup.className = 'button-group';
        
        const downloadBtn = document.createElement('button');
        downloadBtn.className = 'download-btn';
        downloadBtn.textContent = '⬇ Скачать';
        downloadBtn.onclick = (e) => {
            e.stopPropagation();
            downloadPhoto(photoPath, photo);
        };
        
        const copyBtn = document.createElement('button');
        copyBtn.className = 'copy-link-btn';
        copyBtn.textContent = '🔗 Скопировать';
        copyBtn.onclick = (e) => {
            e.stopPropagation();
            const slug = transliterate(currentPerson.name);
            const url = `https://bthebfr.github.io/schoolhub/${slug}-${index + 1}`;
            navigator.clipboard.writeText(url);
            copyBtn.textContent = '✅ Готово';
            setTimeout(() => {
                copyBtn.textContent = '🔗 Скопировать';
            }, 2000);
        };
        
        buttonGroup.appendChild(downloadBtn);
        buttonGroup.appendChild(copyBtn);
        
        frame.onclick = () => {
            openPhoto(index);
        };
        
        frame.appendChild(img);
        frame.appendChild(caption);
        frame.appendChild(buttonGroup);
        photosGrid.appendChild(frame);
    });
    
    gallery.classList.add('active');
    
    // Если нужно открыть конкретное фото
    if (currentPhotoIndex >= 0) {
        setTimeout(() => {
            openPhoto(currentPhotoIndex);
        }, 300);
    }
}

// Открыть фото
function openPhoto(index) {
    if (!currentPerson) return;
    
    const photo = currentPerson.photos[index];
    const folderName = currentPerson.name.toLowerCase().replace(/ /g, '_');
    const photoPath = `images/${folderName}/${photo}`;
    const caption = `${currentPerson.name} - фото ${index + 1}`;
    
    // Обновляем URL
    const slug = transliterate(currentPerson.name);
    window.history.pushState({}, '', `/schoolhub/${slug}-${index + 1}`);
    
    // Создаем модальное окно
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.id = 'imageModal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <span class="modal-close">&times;</span>
                <span class="modal-copy-link">🔗 Скопировать ссылку</span>
            </div>
            <img src="${photoPath}" alt="${caption}">
            <div class="modal-caption">${caption}</div>
        </div>
    `;
    
    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden';
    
    // Закрытие
    modal.querySelector('.modal-close').onclick = closeModal;
    modal.onclick = (e) => {
        if (e.target === modal) closeModal();
    };
    
    // Копирование ссылки
    modal.querySelector('.modal-copy-link').onclick = () => {
        const url = `https://bthebfr.github.io/schoolhub/${slug}-${index + 1}`;
        navigator.clipboard.writeText(url);
        const btn = modal.querySelector('.modal-copy-link');
        btn.textContent = '✅ Скопировано!';
        setTimeout(() => {
            btn.textContent = '🔗 Скопировать ссылку';
        }, 2000);
    };
    
    // Escape
    const escapeHandler = (e) => {
        if (e.key === 'Escape') {
            closeModal();
            document.removeEventListener('keydown', escapeHandler);
        }
    };
    document.addEventListener('keydown', escapeHandler);
}

// Закрыть модальное окно
function closeModal() {
    const modal = document.getElementById('imageModal');
    if (modal) {
        modal.remove();
        document.body.style.overflow = '';
    }
    
    // Возвращаем URL к галерее
    if (currentPerson) {
        const slug = transliterate(currentPerson.name);
        window.history.pushState({}, '', `/schoolhub/${slug}`);
    }
}

// Закрыть галерею
function closeGallery() {
    document.getElementById('gallery').classList.remove('active');
    currentPerson = null;
    currentPhotoIndex = -1;
    window.history.pushState({}, '', '/schoolhub/');
}

// Скачать фото
async function downloadPhoto(path, filename) {
    try {
        const response = await fetch(path);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    } catch (error) {
        console.error('Ошибка скачивания:', error);
    }
}

// Проверка URL
function checkUrl() {
    let path = window.location.pathname;
    
    // Убираем /schoolhub/
    if (path.startsWith('/schoolhub/')) {
        path = path.replace('/schoolhub/', '');
    } else if (path === '/schoolhub') {
        path = '';
    }
    path = path.replace(/^\/+|\/+$/g, '');
    
    if (!path) return;
    
    // Проверяем фото
    const match = path.match(/(.+)-(\d+)$/);
    
    if (match) {
        const personSlug = match[1];
        const photoNum = parseInt(match[2]);
        
        const person = peopleList.find(p => transliterate(p.name) === personSlug);
        if (person) {
            const index = photoNum - 1;
            if (index >= 0 && index < person.photos.length) {
                openGallery(person, index);
            } else {
                openGallery(person);
            }
        }
    } else {
        const person = peopleList.find(p => transliterate(p.name) === path);
        if (person) {
            openGallery(person);
        }
    }
}

// Слушаем кнопки назад/вперед
window.addEventListener('popstate', () => {
    location.reload();
});

// Запуск
document.addEventListener('DOMContentLoaded', init);
