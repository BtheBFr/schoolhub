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
    // Убираем лишние дефисы и небуквенные символы
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

// Создаем кнопки для каждого человека
async function createButtons() {
    const people = await loadPeople();
    const container = document.getElementById('buttonsContainer');
    
    people.forEach(person => {
        const button = document.createElement('button');
        button.className = 'person-btn';
        button.textContent = person.name;
        button.onclick = () => showPhotos(person);
        container.appendChild(button);
    });
    
    // Проверяем, есть ли в URL параметры
    checkUrlParams(people);
}

// Показываем фото выбранного человека
function showPhotos(person, photoIndex = null) {
    const gallery = document.getElementById('gallery');
    const personName = document.getElementById('selectedPersonName');
    const photosGrid = document.getElementById('photosGrid');
    
    personName.textContent = person.name;
    photosGrid.innerHTML = '';
    
    person.photos.forEach((photo, index) => {
        // Создаем путь к фото: images/имя папки/файл
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
        
        // Группа кнопок
        const buttonGroup = document.createElement('div');
        buttonGroup.className = 'button-group';
        
        // Кнопка скачивания
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
        
        // Кнопка копирования ссылки
        const copyLinkBtn = document.createElement('button');
        copyLinkBtn.className = 'copy-link-btn';
        copyLinkBtn.innerHTML = '🔗 Скопировать ссылку';
        copyLinkBtn.onclick = (e) => {
            e.stopPropagation();
            
            // Создаем ЧЕЛОВЕЧЕСКИЙ URL с транслитерацией
            const personSlug = transliterate(person.name);
            const photoNumber = index + 1;
            const url = `${window.location.origin}${window.location.pathname}?p=${personSlug}&n=${photoNumber}`;
            
            // Копируем в буфер обмена
            navigator.clipboard.writeText(url).then(() => {
                copyLinkBtn.innerHTML = '✅ Скопировано!';
                setTimeout(() => {
                    copyLinkBtn.innerHTML = '🔗 Скопировать ссылку';
                }, 2000);
            }).catch(() => {
                copyLinkBtn.innerHTML = '❌ Ошибка';
                setTimeout(() => {
                    copyLinkBtn.innerHTML = '🔗 Скопировать ссылку';
                }, 2000);
            });
        };
        
        buttonGroup.appendChild(downloadBtn);
        buttonGroup.appendChild(copyLinkBtn);
        
        // Открытие фото в модальном окне
        frame.onclick = () => openModal(photoPath, `${person.name} - фото ${index + 1}`, person, index);
        
        frame.appendChild(img);
        frame.appendChild(caption);
        frame.appendChild(buttonGroup);
        photosGrid.appendChild(frame);
    });
    
    gallery.classList.add('active');
    
    // Если указан индекс фото, открываем его
    if (photoIndex !== null && photoIndex >= 0 && photoIndex < person.photos.length) {
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
}

// Модальное окно для просмотра фото
function openModal(imageSrc, caption, person, photoIndex) {
    // Создаем модальное окно, если его нет
    let modal = document.getElementById('imageModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'imageModal';
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <span class="modal-close">&times;</span>
                    <span class="modal-copy-link">🔗 Скопировать ссылку</span>
                </div>
                <img src="" alt="">
                <div class="modal-caption"></div>
            </div>
        `;
        document.body.appendChild(modal);
        
        // Закрытие при клике на крестик
        modal.querySelector('.modal-close').onclick = closeModal;
        
        // Копирование ссылки
        modal.querySelector('.modal-copy-link').onclick = () => {
            const personSlug = transliterate(person.name);
            const photoNumber = photoIndex + 1;
            const url = `${window.location.origin}${window.location.pathname}?p=${personSlug}&n=${photoNumber}`;
            
            navigator.clipboard.writeText(url).then(() => {
                const copyBtn = modal.querySelector('.modal-copy-link');
                copyBtn.innerHTML = '✅ Скопировано!';
                setTimeout(() => {
                    copyBtn.innerHTML = '🔗 Скопировать ссылку';
                }, 2000);
            });
        };
        
        // Закрытие при клике вне фото
        modal.onclick = (e) => {
            if (e.target === modal) closeModal();
        };
        
        // Закрытие по клавише Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal.classList.contains('active')) {
                closeModal();
            }
        });
    }
    
    const modalImg = modal.querySelector('img');
    const modalCaption = modal.querySelector('.modal-caption');
    const copyBtn = modal.querySelector('.modal-copy-link');
    
    modalImg.src = imageSrc;
    modalCaption.textContent = caption;
    
    // Обновляем обработчик копирования для текущего фото
    copyBtn.onclick = () => {
        const personSlug = transliterate(person.name);
        const photoNumber = photoIndex + 1;
        const url = `${window.location.origin}${window.location.pathname}?p=${personSlug}&n=${photoNumber}`;
        
        navigator.clipboard.writeText(url).then(() => {
            copyBtn.innerHTML = '✅ Скопировано!';
            setTimeout(() => {
                copyBtn.innerHTML = '🔗 Скопировать ссылку';
            }, 2000);
        });
    };
    
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    const modal = document.getElementById('imageModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

// Проверка параметров URL
function checkUrlParams(people) {
    const urlParams = new URLSearchParams(window.location.search);
    const personSlug = urlParams.get('p');
    const photoNumber = urlParams.get('n');
    
    if (personSlug && photoNumber) {
        // Ищем человека по транслитерированному имени
        const person = people.find(p => transliterate(p.name) === personSlug);
        if (person) {
            const index = parseInt(photoNumber) - 1;
            if (index >= 0 && index < person.photos.length) {
                showPhotos(person, index);
            } else {
                showPhotos(person);
            }
        }
    } else if (personSlug) {
        const person = people.find(p => transliterate(p.name) === personSlug);
        if (person) {
            showPhotos(person);
        }
    }
}

// Запускаем создание кнопок при загрузке страницы
document.addEventListener('DOMContentLoaded', createButtons);
