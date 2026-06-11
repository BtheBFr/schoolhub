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

// Функция для сортировки по имени (по алфавиту)
function sortByName(a, b) {
    return a.name.localeCompare(b.name, 'ru');
}

// Получить аватарку или инициалы
function getInitials(name) {
    const parts = name.split(' ');
    if (parts.length >= 2) {
        return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
}

function getAvatarHtml(person) {
    if (person.avatar) {
        return `<img src="${person.avatar}" alt="${person.name}" onerror="this.parentElement.innerHTML='${getInitials(person.name)}'">`;
    }
    return getInitials(person.name);
}

// Глобальные переменные
let peopleList = [];
let currentPerson = null;
let isOpeningFromHash = false; // Флаг, чтобы не было двойного открытия

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
    
    // Обработчики для карточек
    document.querySelectorAll('.person-card').forEach(card => {
        // Исправляем отображение аватарок если картинка не загрузилась
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
        
        // Клик по карточке
        card.addEventListener('click', (e) => {
            e.stopPropagation();
            const name = card.dataset.name;
            const person = peopleList.find(p => p.name === name);
            if (person) {
                openAlbumModal(person);
            }
        });
    });
}

// Открыть альбом человека
function openAlbumModal(person, photoIndex = -1) {
    // Закрываем предыдущий альбом если есть
    const existingModal = document.getElementById('albumModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    currentPerson = person;
    
    const slug = transliterate(person.name);
    
    // Обновляем URL без запуска hashchange
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
    const closeBtn = modal.querySelector('.album-close');
    closeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
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

function closeAlbumModal() {
    const modal = document.getElementById('albumModal');
    if (modal) {
        modal.remove();
        document.body.style.overflow = '';
    }
    currentPerson = null;
    
    // Убираем хэш, если это не открытие фото
    if (!window.location.hash.includes('-')) {
        isOpeningFromHash = true;
        window.location.hash = '';
        setTimeout(() => { isOpeningFromHash = false; }, 100);
    }
}

function openImageModal(person, index) {
    const photo = person.photos[index];
    const folderName = person.name.toLowerCase().replace(/ /g, '_');
    const photoPath = `images/${folderName}/${photo}`;
    
    const slug = transliterate(person.name);
    
    // Обновляем URL
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
            <img src="${photoPath}" alt="${person.name} - фото ${index + 1}" onerror="this.src='https://via.placeholder.com/800x600?text=Нет+фото'">
            <div class="image-modal-caption">${person.name} — фото ${index + 1}</div>
        </div>
    `;
    
    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden';
    
    const closeModalFunc = () => {
        modal.remove();
        document.body.style.overflow = '';
        // Возвращаемся к хэшу альбома
        isOpeningFromHash = true;
        window.location.hash = slug;
        setTimeout(() => { isOpeningFromHash = false; }, 100);
        // Переоткрываем альбом
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
    // Если открытие происходит из кода, игнорируем
    if (isOpeningFromHash) return;
    
    let hash = window.location.hash.substring(1);
    if (!hash || !peopleList.length) return;
    
    // Если альбом уже открыт и это тот же человек, не открываем заново
    if (currentPerson && transliterate(currentPerson.name) === hash) {
        return;
    }
    
    // Если открыто модальное окно с фото, не мешаем
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
    showLoader();
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
    
    // Проверяем URL после загрузки
    setTimeout(() => {
        checkUrlAndOpen();
    }, 100);
}

// Слушаем изменения хэша
window.addEventListener('hashchange', () => {
    // Игнорируем, если это внутреннее изменение
    if (isOpeningFromHash) return;
    
    // Закрываем альбом перед открытием нового
    const existingAlbum = document.getElementById('albumModal');
    if (existingAlbum) {
        existingAlbum.remove();
        document.body.style.overflow = '';
        currentPerson = null;
    }
    
    checkUrlAndOpen();
});

document.addEventListener('DOMContentLoaded', init);
