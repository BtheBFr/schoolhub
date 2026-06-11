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

// Функция для сортировки по имени
function sortByName(a, b) {
    return a.name.localeCompare(b.name, 'ru');
}

// Получить инициалы
function getInitials(name) {
    const parts = name.split(' ');
    if (parts.length >= 2) {
        return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
}

// Аватарка
function getAvatarHtml(person) {
    if (person.avatar) {
        return `<img src="${person.avatar}" alt="${person.name}" onerror="this.parentElement.innerHTML='${getInitials(person.name)}'">`;
    }
    return getInitials(person.name);
}

// Глобальные переменные
let peopleList = [];
let currentPerson = null;
let isOpeningFromHash = false;

// Загрузка данных
async function loadPeople() {
    try {
        const response = await fetch('people.json');
        const data = await response.json();
        const sorted = [...data.people].sort(sortByName);
        return sorted;
    } catch (error) {
        console.error('Ошибка загрузки данных:', error);
        return [];
    }
}

// Показать анимацию загрузки
function showLoader(message = 'SCHOOLHUB') {
    const existingLoader = document.getElementById('loaderOverlay');
    if (existingLoader) return;
    
    const loader = document.createElement('div');
    loader.id = 'loaderOverlay';
    loader.className = 'loader-overlay';
    loader.innerHTML = `
        <div class="loader">
            <div class="loader-spinner"></div>
            <p>${message}</p>
        </div>
    `;
    document.body.appendChild(loader);
}

// Скрыть анимацию загрузки
function hideLoader() {
    const loader = document.getElementById('loaderOverlay');
    if (loader) {
        loader.classList.add('hidden');
        setTimeout(() => {
            if (loader.parentNode) loader.remove();
        }, 500);
    }
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
        alert('Не удалось скачать фото');
    }
}

// Создание карточек людей
function renderCards(searchTerm = '') {
    const container = document.getElementById('cardsGrid');
    if (!container) return;
    
    let filteredPeople = [...peopleList];
    if (searchTerm) {
        const lowerSearch = searchTerm.toLowerCase();
        filteredPeople = peopleList.filter(person => 
            person.name.toLowerCase().includes(lowerSearch)
        );
    }
    
    if (filteredPeople.length === 0) {
        container.innerHTML = '<div style="text-align:center; grid-column:1/-1; padding:40px;">👤 Ничего не найдено</div>';
        return;
    }
    
    container.innerHTML = filteredPeople.map(person => `
        <div class="person-card" data-name="${person.name}" data-avatar="${person.avatar || ''}">
            <div class="person-avatar">${getAvatarHtml(person)}</div>
            <h3>${person.name}</h3>
            <div class="photo-count">📸 ${person.photos.length} фото</div>
        </div>
    `).join('');
    
    document.querySelectorAll('.person-card').forEach(card => {
        const avatarDiv = card.querySelector('.person-avatar');
        const avatarSrc = card.dataset.avatar;
        if (avatarSrc && avatarDiv) {
            const img = avatarDiv.querySelector('img');
            if (img) {
                img.onerror = () => {
                    avatarDiv.innerHTML = getInitials(card.dataset.name);
                };
            }
        }
        
        card.addEventListener('click', (e) => {
            e.stopPropagation();
            const name = card.dataset.name;
            const person = peopleList.find(p => p.name === name);
            if (person) openAlbumModal(person);
        });
    });
}

// Открыть альбом человека
function openAlbumModal(person, photoIndex = -1) {
    showLoader('Загрузка альбома...');
    
    // Закрываем предыдущий альбом если есть
    const existingModal = document.getElementById('albumModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    currentPerson = person;
    
    const slug = transliterate(person.name);
    
    isOpeningFromHash = true;
    window.location.hash = slug;
    setTimeout(() => { isOpeningFromHash = false; }, 100);
    
    const modal = document.createElement('div');
    modal.id = 'albumModal';
    modal.className = 'album-modal active';
    
    modal.innerHTML = `
        <div class="album-content">
            <div class="album-header">
                <h2>${person.name}</h2>
                <div class="album-header-buttons">
                    <button class="copy-gallery-btn" id="copyGalleryBtnAlbum">🔗 Скопировать ссылку на альбом</button>
                    <button class="album-close">×</button>
                </div>
            </div>
            <div class="album-body">
                <div class="album-info">
                    <h3>📁 Информация</h3>
                    <p>Всего фотографий: ${person.photos.length}</p>
                </div>
                <div class="album-photos">
                    <div class="photos-grid" id="albumPhotosGrid"></div>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden';
    
    // Кнопка копирования ссылки на альбом
    const copyGalleryBtn = modal.querySelector('#copyGalleryBtnAlbum');
    if (copyGalleryBtn) {
        copyGalleryBtn.addEventListener('click', () => {
            const url = `${window.location.origin}${window.location.pathname}#${slug}`;
            navigator.clipboard.writeText(url);
            const originalText = copyGalleryBtn.innerHTML;
            copyGalleryBtn.innerHTML = '✅ Скопировано!';
            setTimeout(() => {
                copyGalleryBtn.innerHTML = originalText;
            }, 2000);
        });
    }
    
    const photosGrid = modal.querySelector('#albumPhotosGrid');
    
    // Загружаем фото
    let loadedCount = 0;
    const totalPhotos = person.photos.length;
    
    person.photos.forEach((photo, idx) => {
        const folderName = person.name.toLowerCase().replace(/ /g, '_');
        const photoPath = `images/${folderName}/${photo}`;
        
        const photoDiv = document.createElement('div');
        photoDiv.className = 'photo-item';
        photoDiv.innerHTML = `
            <div class="photo-wrapper">
                <img src="${photoPath}" alt="Фото ${idx + 1}" onerror="this.src='https://via.placeholder.com/300x300?text=Нет+фото'">
            </div>
            <div class="photo-caption">Фото ${idx + 1}</div>
            <div class="photo-buttons">
                <button class="photo-download-btn" data-path="${photoPath}" data-filename="${photo}">⬇ Скачать</button>
                <button class="photo-copy-btn" data-slug="${slug}" data-num="${idx + 1}">🔗 Скопировать ссылку</button>
            </div>
        `;
        
        // Обработчик скачивания
        const downloadBtn = photoDiv.querySelector('.photo-download-btn');
        downloadBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const path = downloadBtn.dataset.path;
            const filename = downloadBtn.dataset.filename;
            downloadPhoto(path, filename);
        });
        
        // Обработчик копирования ссылки
        const copyBtn = photoDiv.querySelector('.photo-copy-btn');
        copyBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const url = `${window.location.origin}${window.location.pathname}#${slug}-${idx + 1}`;
            navigator.clipboard.writeText(url);
            const originalText = copyBtn.innerHTML;
            copyBtn.innerHTML = '✅ Готово!';
            setTimeout(() => {
                copyBtn.innerHTML = originalText;
            }, 2000);
        });
        
        // Клик по фото для увеличения
        const img = photoDiv.querySelector('img');
        img.addEventListener('click', (e) => {
            e.stopPropagation();
            openImageModal(person, idx);
        });
        
        photosGrid.appendChild(photoDiv);
        
        // Следим за загрузкой всех фото
        const img = photoDiv.querySelector('img');
        img.onload = () => {
            loadedCount++;
            if (loadedCount === totalPhotos) {
                hideLoader();
            }
        };
        img.onerror = () => {
            loadedCount++;
            if (loadedCount === totalPhotos) {
                hideLoader();
            }
        };
    });
    
    // Закрытие альбома
    const closeBtn = modal.querySelector('.album-close');
    closeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        closeAlbumModal();
    });
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeAlbumModal();
    });
    
    // Закрытие по Escape
    const escapeHandler = (e) => {
        if (e.key === 'Escape') {
            closeAlbumModal();
            document.removeEventListener('keydown', escapeHandler);
        }
    };
    document.addEventListener('keydown', escapeHandler);
    
    if (photoIndex >= 0) {
        setTimeout(() => openImageModal(person, photoIndex), 100);
    }
}

function closeAlbumModal() {
    const modal = document.getElementById('albumModal');
    if (modal) {
        modal.remove();
        document.body.style.overflow = '';
    }
    currentPerson = null;
    
    // Очищаем хэш из адресной строки
    isOpeningFromHash = true;
    window.location.hash = '';
    setTimeout(() => { isOpeningFromHash = false; }, 100);
}

function openImageModal(person, index) {
    showLoader('Загрузка фото...');
    
    const photo = person.photos[index];
    const folderName = person.name.toLowerCase().replace(/ /g, '_');
    const photoPath = `images/${folderName}/${photo}`;
    const slug = transliterate(person.name);
    
    isOpeningFromHash = true;
    window.location.hash = `${slug}-${index + 1}`;
    setTimeout(() => { isOpeningFromHash = false; }, 100);
    
    const existingModal = document.getElementById('imageModal');
    if (existingModal) existingModal.remove();
    
    const modal = document.createElement('div');
    modal.id = 'imageModal';
    modal.className = 'image-modal active';
    modal.innerHTML = `
        <div class="image-modal-content">
            <button class="image-modal-close">×</button>
            <div class="image-modal-img-wrapper">
                <img src="${photoPath}" alt="${person.name} - фото ${index + 1}" onerror="this.src='https://via.placeholder.com/800x600?text=Нет+фото'">
            </div>
            <div class="image-modal-caption">${person.name} — фото ${index + 1}</div>
            <div class="image-modal-buttons">
                <button class="image-download-btn" data-path="${photoPath}" data-filename="${photo}">⬇ Скачать фото</button>
                <button class="image-copy-btn" data-slug="${slug}" data-num="${index + 1}">🔗 Скопировать ссылку</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden';
    
    // Обработчик скачивания
    const downloadBtn = modal.querySelector('.image-download-btn');
    downloadBtn.addEventListener('click', () => {
        downloadPhoto(downloadBtn.dataset.path, downloadBtn.dataset.filename);
    });
    
    // Обработчик копирования ссылки
    const copyBtn = modal.querySelector('.image-copy-btn');
    copyBtn.addEventListener('click', () => {
        const url = `${window.location.origin}${window.location.pathname}#${slug}-${index + 1}`;
        navigator.clipboard.writeText(url);
        const originalText = copyBtn.innerHTML;
        copyBtn.innerHTML = '✅ Скопировано!';
        setTimeout(() => {
            copyBtn.innerHTML = originalText;
        }, 2000);
    });
    
    // Ждём загрузки фото
    const img = modal.querySelector('img');
    img.onload = () => {
        hideLoader();
    };
    img.onerror = () => {
        hideLoader();
    };
    
    const closeModalFunc = () => {
        modal.remove();
        document.body.style.overflow = '';
        isOpeningFromHash = true;
        window.location.hash = slug;
        setTimeout(() => { isOpeningFromHash = false; }, 100);
        if (currentPerson) {
            const existingAlbum = document.getElementById('albumModal');
            if (!existingAlbum) {
                openAlbumModal(currentPerson);
            }
        }
    };
    
    const closeBtn = modal.querySelector('.image-modal-close');
    closeBtn.addEventListener('click', closeModalFunc);
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModalFunc();
    });
    
    const escapeHandler = (e) => {
        if (e.key === 'Escape') {
            closeModalFunc();
            document.removeEventListener('keydown', escapeHandler);
        }
    };
    document.addEventListener('keydown', escapeHandler);
}

function checkUrlAndOpen() {
    if (isOpeningFromHash) return;
    
    let hash = window.location.hash.substring(1);
    if (!hash || !peopleList.length) return;
    
    if (currentPerson && transliterate(currentPerson.name) === hash) {
        return;
    }
    
    if (document.getElementById('imageModal')) return;
    
    const match = hash.match(/(.+)-(\d+)$/);
    
    if (match) {
        const personSlug = match[1];
        const photoNum = parseInt(match[2]);
        const person = peopleList.find(p => transliterate(p.name) === personSlug);
        if (person) {
            const index = photoNum - 1;
            if (index >= 0 && index < person.photos.length) {
                openAlbumModal(person, index);
            } else {
                openAlbumModal(person);
            }
        }
    } else {
        const person = peopleList.find(p => transliterate(p.name) === hash);
        if (person && (!currentPerson || currentPerson.name !== person.name)) {
            openAlbumModal(person);
        }
    }
}

async function init() {
    showLoader('Загрузка SchoolHub...');
    
    // Имитация более долгой загрузки для красоты
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    peopleList = await loadPeople();
    
    const container = document.querySelector('.container');
    const existingGrid = document.getElementById('cardsGrid');
    if (!existingGrid) {
        const gridDiv = document.createElement('div');
        gridDiv.id = 'cardsGrid';
        gridDiv.className = 'cards-grid';
        container.appendChild(gridDiv);
    }
    
    renderCards();
    hideLoader();
    
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            renderCards(e.target.value);
        });
    }
    
    setTimeout(() => {
        checkUrlAndOpen();
    }, 100);
}

window.addEventListener('hashchange', () => {
    if (isOpeningFromHash) return;
    
    const existingAlbum = document.getElementById('albumModal');
    if (existingAlbum) {
        existingAlbum.remove();
        document.body.style.overflow = '';
        currentPerson = null;
    }
    
    checkUrlAndOpen();
});

document.addEventListener('DOMContentLoaded', init);
