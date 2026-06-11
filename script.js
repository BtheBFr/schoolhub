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

// Получить инициалы для аватара
function getInitials(name) {
    const parts = name.split(' ');
    if (parts.length >= 2) {
        return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
}

// Глобальные переменные
let peopleList = [];
let currentPerson = null;
let currentPhotoIndex = -1;

// Загрузка данных
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

// Показать анимацию загрузки
function showLoader() {
    const existingLoader = document.getElementById('loaderOverlay');
    if (existingLoader) return;
    
    const loader = document.createElement('div');
    loader.id = 'loaderOverlay';
    loader.className = 'loader-overlay';
    loader.innerHTML = `
        <div class="loader">
            <div class="loader-spinner"></div>
            <p>SCHOOLHUB</p>
        </div>
    `;
    document.body.appendChild(loader);
}

// Создание карточек людей
function renderCards(searchTerm = '') {
    const container = document.getElementById('cardsGrid');
    if (!container) return;
    
    let filteredPeople = peopleList;
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
        <div class="person-card" data-name="${person.name}">
            <div class="person-avatar">${getInitials(person.name)}</div>
            <h3>${person.name}</h3>
            <div class="photo-count">📸 ${person.photos.length} фото</div>
        </div>
    `).join('');
    
    // Добавляем обработчики
    document.querySelectorAll('.person-card').forEach(card => {
        card.addEventListener('click', () => {
            const name = card.dataset.name;
            const person = peopleList.find(p => p.name === name);
            if (person) openAlbumModal(person);
        });
    });
}

// Открыть альбом человека (отдельная вкладка)
function openAlbumModal(person, photoIndex = -1) {
    currentPerson = person;
    currentPhotoIndex = photoIndex;
    
    // Обновляем URL
    const slug = transliterate(person.name);
    window.location.hash = slug;
    
    // Создаём модальное окно альбома
    const existingModal = document.getElementById('albumModal');
    if (existingModal) existingModal.remove();
    
    const modal = document.createElement('div');
    modal.id = 'albumModal';
    modal.className = 'album-modal active';
    
    modal.innerHTML = `
        <div class="album-content">
            <div class="album-header">
                <h2>${person.name}</h2>
                <button class="album-close">×</button>
            </div>
            <div class="album-body">
                <div class="album-info">
                    <h3>📁 Информация</h3>
                    <p>Всего фотографий: ${person.photos.length}</p>
                    <p style="margin-top:10px">Нажмите на фото для увеличения</p>
                </div>
                <div class="album-photos">
                    <div class="photos-grid" id="albumPhotosGrid"></div>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden';
    
    // Заполняем фото
    const photosGrid = modal.querySelector('#albumPhotosGrid');
    person.photos.forEach((photo, idx) => {
        const folderName = person.name.toLowerCase().replace(/ /g, '_');
        const photoPath = `images/${folderName}/${photo}`;
        
        const photoDiv = document.createElement('div');
        photoDiv.className = 'photo-item';
        photoDiv.innerHTML = `
            <img src="${photoPath}" alt="Фото ${idx + 1}" onerror="this.src='https://via.placeholder.com/300x300?text=Нет+фото'">
            <div class="photo-caption">Фото ${idx + 1}</div>
        `;
        photoDiv.addEventListener('click', (e) => {
            e.stopPropagation();
            openImageModal(person, idx);
        });
        photosGrid.appendChild(photoDiv);
    });
    
    // Закрытие
    modal.querySelector('.album-close').addEventListener('click', () => {
        closeAlbumModal();
    });
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeAlbumModal();
    });
    
    // Если нужно открыть конкретное фото
    if (photoIndex >= 0) {
        setTimeout(() => openImageModal(person, photoIndex), 100);
    }
}

// Закрыть альбом
function closeAlbumModal() {
    const modal = document.getElementById('albumModal');
    if (modal) {
        modal.remove();
        document.body.style.overflow = '';
    }
    currentPerson = null;
    currentPhotoIndex = -1;
    window.location.hash = '';
}

// Открыть увеличенное фото
function openImageModal(person, index) {
    const photo = person.photos[index];
    const folderName = person.name.toLowerCase().replace(/ /g, '_');
    const photoPath = `images/${folderName}/${photo}`;
    
    // Обновляем URL
    const slug = transliterate(person.name);
    window.location.hash = `${slug}-${index + 1}`;
    
    // Создаём модальное окно для фото
    const existingModal = document.getElementById('imageModal');
    if (existingModal) existingModal.remove();
    
    const modal = document.createElement('div');
    modal.id = 'imageModal';
    modal.className = 'image-modal active';
    modal.innerHTML = `
        <div class="image-modal-content">
            <button class="image-modal-close">×</button>
            <img src="${photoPath}" alt="${person.name} - фото ${index + 1}" onerror="this.src='https://via.placeholder.com/800x600?text=Нет+фото'">
            <div class="image-modal-caption">${person.name} — фото ${index + 1}</div>
        </div>
    `;
    
    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden';
    
    // Закрытие
    const closeBtn = modal.querySelector('.image-modal-close');
    closeBtn.addEventListener('click', () => {
        modal.remove();
        document.body.style.overflow = '';
        // Возвращаемся к альбому
        const slug = transliterate(person.name);
        window.location.hash = slug;
        if (currentPerson) {
            openAlbumModal(currentPerson);
        }
    });
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
            document.body.style.overflow = '';
            window.location.hash = slug;
            if (currentPerson) {
                openAlbumModal(currentPerson);
            }
        }
    });
    
    // Escape
    const escapeHandler = (e) => {
        if (e.key === 'Escape') {
            modal.remove();
            document.body.style.overflow = '';
            window.location.hash = slug;
            if (currentPerson) {
                openAlbumModal(currentPerson);
            }
            document.removeEventListener('keydown', escapeHandler);
        }
    };
    document.addEventListener('keydown', escapeHandler);
}

// Проверка URL и открытие
function checkUrlAndOpen() {
    let hash = window.location.hash.substring(1);
    if (!hash || !peopleList.length) return;
    
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
        if (person) {
            openAlbumModal(person);
        }
    }
}

// Инициализация
async function init() {
    showLoader();
    
    peopleList = await loadPeople();
    
    // Создаём сетку карточек
    const container = document.querySelector('.container');
    const existingGrid = document.getElementById('cardsGrid');
    if (!existingGrid) {
        const gridDiv = document.createElement('div');
        gridDiv.id = 'cardsGrid';
        gridDiv.className = 'cards-grid';
        
        const buttonsContainer = document.getElementById('buttonsContainer');
        if (buttonsContainer) buttonsContainer.remove();
        
        const galleryDiv = document.getElementById('gallery');
        if (galleryDiv) galleryDiv.remove();
        
        const searchDiv = document.querySelector('.search-container');
        if (searchDiv) {
            searchDiv.insertAdjacentElement('afterend', gridDiv);
        } else {
            container.appendChild(gridDiv);
        }
    }
    
    renderCards();
    hideLoader();
    
    // Поиск
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            renderCards(e.target.value);
        });
    }
    
    // Проверяем URL
    checkUrlAndOpen();
}

// Слушаем изменения хэша
window.addEventListener('hashchange', () => {
    if (document.getElementById('albumModal')) {
        closeAlbumModal();
    }
    checkUrlAndOpen();
});

// Запуск
document.addEventListener('DOMContentLoaded', init);
