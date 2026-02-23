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

// Текущий выбранный человек и фото
let currentPerson = null;
let currentPhotoIndex = -1;

// Создаем кнопки для каждого человека
async function createButtons() {
    const people = await loadPeople();
    const container = document.getElementById('buttonsContainer');
    
    people.forEach(person => {
        const button = document.createElement('button');
        button.className = 'person-btn';
        button.textContent = person.name;
        button.onclick = () => {
            selectPerson(person);
        };
        container.appendChild(button);
    });
    
    // Проверяем URL при загрузке
    checkUrlPath(people);
}

// Выбор человека
function selectPerson(person, photoIndex = -1) {
    const slug = transliterate(person.name);
    
    // Формируем правильный URL
    let newUrl;
    if (photoIndex >= 0) {
        newUrl = `/schoolhub/${slug}-${photoIndex + 1}`;
    } else {
        newUrl = `/schoolhub/${slug}`;
    }
    
    // Обновляем URL без перезагрузки
    window.history.pushState({}, '', newUrl);
    
    // Показываем галерею
    showPhotos(person, photoIndex);
}

// Показываем фото выбранного человека
function showPhotos(person, photoIndex = -1) {
    const gallery = document.getElementById('gallery');
    const personName = document.getElementById('selectedPersonName');
    const photosGrid = document.getElementById('photosGrid');
    const copyGalleryBtn = document.getElementById('copyGalleryBtn');
    
    currentPerson = person;
    currentPhotoIndex = photoIndex;
    
    personName.textContent = person.name;
    photosGrid.innerHTML = '';
    
    // Настраиваем кнопку копирования галереи
    copyGalleryBtn.onclick = (e) => {
        e.stopPropagation();
        const slug = transliterate(person.name);
        const url = `${window.location.origin}/schoolhub/${slug}`;
        
        navigator.clipboard.writeText(url).then(() => {
            copyGalleryBtn.innerHTML = '<span class="copy-icon">✅</span><span class="copy-text">Скопировано!</span>';
            setTimeout(() => {
                copyGalleryBtn.innerHTML = '<span class="copy-icon">🔗</span><span class="copy-text">Галерея</span>';
            }, 2000);
        });
    };
    
    person.photos.forEach((photo, index) => {
        const folderName = person.name.toLowerCase().replace(/ /g, '_');
        const photoPath = `images/${folderName}/${photo}`;
        
        const frame = document.createElement('div');
        frame.className = 'photo-frame';
        
        const img = document.createElement('img');
        img.src = photoPath;
        img.alt = `${person.name} - фото ${index + 1}`;
        img.onerror = () => {
            img.src = 'https://via.placeholder.com/300x300?text=Фото+не+найдено';
        };
        
        const caption = document.createElement('p');
        caption.textContent = `Фото ${index + 1}`;
        
        const buttonGroup = document.createElement('div');
        buttonGroup.className = 'button-group';
        
        const downloadBtn = document.createElement('button');
        downloadBtn.className = 'download-btn';
        downloadBtn.innerHTML = '⬇ Скачать';
        downloadBtn.onclick = async (e) => {
            e.stopPropagation();
            try {
                const response = await fetch(photoPath);
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = photo;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
                
                downloadBtn.innerHTML = '✅ Готово';
                setTimeout(() => {
                    downloadBtn.innerHTML = '⬇ Скачать';
                }, 2000);
            } catch (error) {
                console.error('Ошибка скачивания:', error);
                downloadBtn.innerHTML = '❌ Ошибка';
                setTimeout(() => {
                    downloadBtn.innerHTML = '⬇ Скачать';
                }, 2000);
            }
        };
        
        const copyLinkBtn = document.createElement('button');
        copyLinkBtn.className = 'copy-link-btn';
        copyLinkBtn.innerHTML = '🔗 Скопировать';
        copyLinkBtn.onclick = (e) => {
            e.stopPropagation();
            
            const slug = transliterate(person.name);
            const url = `${window.location.origin}/schoolhub/${slug}-${index + 1}`;
            
            navigator.clipboard.writeText(url).then(() => {
                copyLinkBtn.innerHTML = '✅ Готово';
                setTimeout(() => {
                    copyLinkBtn.innerHTML = '🔗 Скопировать';
                }, 2000);
            });
        };
        
        buttonGroup.appendChild(downloadBtn);
        buttonGroup.appendChild(copyLinkBtn);
        
        frame.onclick = () => {
            selectPerson(person, index);
            openModal(photoPath, `${person.name} - фото ${index + 1}`, person, index);
        };
        
        frame.appendChild(img);
        frame.appendChild(caption);
        frame.appendChild(buttonGroup);
        photosGrid.appendChild(frame);
    });
    
    gallery.classList.add('active');
    
    if (photoIndex >= 0 && photoIndex < person.photos.length) {
        setTimeout(() => {
            const folderName = person.name.toLowerCase().replace(/ /g, '_');
            const photoPath = `images/${folderName}/${person.photos[photoIndex]}`;
            openModal(photoPath, `${person.name} - фото ${photoIndex + 1}`, person, photoIndex);
        }, 300);
    }
}

// Закрываем галерею
function closeGallery() {
    document.getElementById('gallery').classList.remove('active');
    currentPerson = null;
    currentPhotoIndex = -1;
    
    // Возвращаемся на главную
    window.history.pushState({}, '', '/schoolhub/');
}

// Модальное окно
function openModal(imageSrc, caption, person, photoIndex) {
    closeModal();
    
    const modal = document.createElement('div');
    modal.id = 'imageModal';
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <span class="modal-close">&times;</span>
                <span class="modal-copy-link">🔗 Скопировать ссылку</span>
            </div>
            <img src="${imageSrc}" alt="${caption}">
            <div class="modal-caption">${caption}</div>
        </div>
    `;
    document.body.appendChild(modal);
    
    setTimeout(() => {
        modal.classList.add('active');
    }, 10);
    
    modal.querySelector('.modal-close').onclick = () => {
        closeModal();
        // Возвращаемся к галерее (без фото)
        if (currentPerson) {
            selectPerson(currentPerson);
        }
    };
    
    modal.querySelector('.modal-copy-link').onclick = () => {
        const slug = transliterate(person.name);
        const url = `${window.location.origin}/schoolhub/${slug}-${photoIndex + 1}`;
        
        navigator.clipboard.writeText(url).then(() => {
            const copyBtn = modal.querySelector('.modal-copy-link');
            copyBtn.innerHTML = '✅ Скопировано!';
            setTimeout(() => {
                copyBtn.innerHTML = '🔗 Скопировать ссылку';
            }, 2000);
        });
    };
    
    modal.onclick = (e) => {
        if (e.target === modal) {
            closeModal();
            if (currentPerson) {
                selectPerson(currentPerson);
            }
        }
    };
    
    const escapeHandler = (e) => {
        if (e.key === 'Escape') {
            closeModal();
            document.removeEventListener('keydown', escapeHandler);
            if (currentPerson) {
                selectPerson(currentPerson);
            }
        }
    };
    document.addEventListener('keydown', escapeHandler);
    
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    const modal = document.getElementById('imageModal');
    if (modal) {
        modal.classList.remove('active');
        setTimeout(() => {
            modal.remove();
        }, 300);
    }
    document.body.style.overflow = '';
}

// Проверка пути URL - ИСПРАВЛЕНО!
function checkUrlPath(people) {
    // Получаем путь без базового URL
    let path = window.location.pathname;
    
    // Убираем /schoolhub/ из начала
    if (path.startsWith('/schoolhub/')) {
        path = path.replace('/schoolhub/', '');
    } else if (path === '/schoolhub') {
        path = '';
    }
    
    // Убираем слеши в начале и конце
    path = path.replace(/^\/+|\/+$/g, '');
    
    if (!path || path === '') {
        return; // На главной
    }
    
    // Проверяем, есть ли номер фото
    const match = path.match(/(.+)-(\d+)$/);
    
    if (match) {
        // Есть номер фото
        const personSlug = match[1];
        const photoNumber = parseInt(match[2]);
        
        const person = people.find(p => transliterate(p.name) === personSlug);
        if (person) {
            const index = photoNumber - 1;
            if (index >= 0 && index < person.photos.length) {
                showPhotos(person, index);
            } else {
                showPhotos(person);
            }
        }
    } else {
        // Только человек
        const person = people.find(p => transliterate(p.name) === path);
        if (person) {
            showPhotos(person);
        }
    }
}

// Обработка кнопок назад/вперед
window.addEventListener('popstate', async () => {
    const people = await loadPeople();
    checkUrlPath(people);
});

// Запускаем создание кнопок
document.addEventListener('DOMContentLoaded', createButtons);
