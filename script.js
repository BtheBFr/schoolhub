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
        downloadBtn.innerHTML = '⬇ Скачать фото';
        downloadBtn.onclick = async () => {
            try {
                const response = await fetch(photoPath);
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = photo; // Имя файла при скачивании
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
                
                // Визуальный эффект при скачивании
                downloadBtn.innerHTML = '✅ Скачано!';
                setTimeout(() => {
                    downloadBtn.innerHTML = '⬇ Скачать фото';
                }, 2000);
            } catch (error) {
                console.error('Ошибка скачивания:', error);
                downloadBtn.innerHTML = '❌ Ошибка';
                setTimeout(() => {
                    downloadBtn.innerHTML = '⬇ Скачать фото';
                }, 2000);
            }
        };
        
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

// Запускаем создание кнопок при загрузке страницы
document.addEventListener('DOMContentLoaded', createButtons);
