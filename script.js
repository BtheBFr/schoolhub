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
}

// Показываем фото выбранного человека
function showPhotos(person) {
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
        
        // Кнопка скачивания
        const downloadBtn = document.createElement('button');
        downloadBtn.className = 'download-btn';
        downloadBtn.innerHTML = '⬇ Скачать';
        downloadBtn.onclick = async (e) => {
            e.stopPropagation(); // Не открывать модальное окно при клике на кнопку
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
        
        // Открытие фото в модальном окне при клике на frame
        frame.onclick = () => openModal(photoPath, `${person.name} - фото ${index + 1}`);
        
        frame.appendChild(img);
        frame.appendChild(caption);
        frame.appendChild(downloadBtn);
        photosGrid.appendChild(frame);
    });
    
    gallery.classList.add('active');
}

// Закрываем галерею
function closeGallery() {
    document.getElementById('gallery').classList.remove('active');
}

// Модальное окно для просмотра фото
function openModal(imageSrc, caption) {
    // Создаем модальное окно, если его нет
    let modal = document.getElementById('imageModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'imageModal';
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <span class="modal-close">&times;</span>
                <img src="" alt="">
                <div class="modal-caption"></div>
            </div>
        `;
        document.body.appendChild(modal);
        
        // Закрытие при клике на крестик
        modal.querySelector('.modal-close').onclick = closeModal;
        
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
    
    modalImg.src = imageSrc;
    modalCaption.textContent = caption;
    modal.classList.add('active');
    
    // Блокируем скролл страницы
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    const modal = document.getElementById('imageModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = ''; // Возвращаем скролл
    }
}

// Запускаем создание кнопок при загрузке страницы
document.addEventListener('DOMContentLoaded', createButtons);
