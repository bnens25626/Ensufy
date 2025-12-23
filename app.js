// --- 1. VERİLER VE DEĞİŞKENLER ---
// Şarkı dosyalarının "muzikler" klasöründe, resimlerin "fotolar" klasöründe olduğundan emin ol.
const allSongs = [
    { title: "Bizim Şarkımız", artist: "Seni Çok Seviyorum", cover: "fotolar/foto1.jpg", src: "muzikler/sarki1.mp3" },
    { title: "Yeni Yıl Hediyem", artist: "Mutlu Yıllar Aşkım", cover: "fotolar/foto2.jpg", src: "muzikler/sarki2.mp3" },
    { title: "Aşkımız", artist: "Sonsuza Dek", cover: "fotolar/foto1.jpg", src: "muzikler/sarki3.mp3" },
    { title: "Hatıramız", artist: "Bizim Hikayemiz", cover: "fotolar/foto2.jpg", src: "muzikler/sarki4.mp3" }
];

// Değişkenler
let currentPlaylist = [...allSongs]; 
let songIndex = 0;
let isPlaying = false;
let isLooping = false;

// Veri Yönetimi (Tarayıcı Hafızası)
let myPlaylists = JSON.parse(localStorage.getItem('myPlaylists')) || [];
let likedSongs = JSON.parse(localStorage.getItem('likedSongs')) || [];
let userStats = JSON.parse(localStorage.getItem('userStats')) || { followers: 0, isFollowing: false };

// --- 2. SEÇİCİLER ---
const audio = new Audio();
const playPauseBtn = document.getElementById('play-pause-btn');
const playIcon = document.getElementById('play-icon');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');
const repeatBtn = document.getElementById('repeat-btn');
const volumeSlider = document.getElementById('volume-slider');
const progressBar = document.getElementById('progress-bar');
const likeBtn = document.getElementById('like-btn');

// --- 3. BAŞLANGIÇ AYARLARI ---
// Sayfa açılınca çalışacaklar
document.addEventListener('DOMContentLoaded', () => {
    // Giriş ekranını geçici olarak kapattık (Hızlı test için)
    document.getElementById('auth-modal').style.display = 'none'; 
    document.getElementById('username-display').innerText = "Sevgilim";
    
    // Şarkıları yükle ve ilk şarkıyı hazırla
    renderMainSongList();
    loadSong(allSongs[0]);
    
    // Ana sayfayı aç
    switchView('home');
});


// --- 4. PLAYER FONKSİYONLARI ---

function loadSong(song) {
    if(!song) return;
    document.getElementById('current-title').innerText = song.title;
    document.getElementById('current-note').innerText = song.artist;
    // Hata almamak için resim ve müzik var mı kontrolü (Basit)
    document.getElementById('current-cover').src = song.cover || ''; 
    document.getElementById('hero-img').src = song.cover || '';
    audio.src = song.src || '';

    // Kalp ikonunu güncelle
    updateLikeIcon(song);
}

function updateLikeIcon(song) {
    const isLiked = likedSongs.some(s => s.title === song.title);
    if(isLiked) {
        likeBtn.classList.remove('fa-regular');
        likeBtn.classList.add('fa-solid');
        likeBtn.style.color = 'red';
    } else {
        likeBtn.classList.add('fa-regular');
        likeBtn.classList.remove('fa-solid');
        likeBtn.style.color = '#888';
    }
}

function playSong() {
    isPlaying = true;
    audio.play().catch(e => console.log("Müzik dosyası bulunamadı veya oynatılamadı:", e));
    playIcon.className = 'fa-solid fa-pause';
}

function pauseSong() {
    isPlaying = false;
    audio.pause();
    playIcon.className = 'fa-solid fa-play';
}

function nextSong() {
    songIndex++;
    if (songIndex > currentPlaylist.length - 1) songIndex = 0;
    loadSong(currentPlaylist[songIndex]);
    playSong();
}

function prevSong() {
    songIndex--;
    if (songIndex < 0) songIndex = currentPlaylist.length - 1;
    loadSong(currentPlaylist[songIndex]);
    playSong();
}

// Event Listenerlar (Tıklama Olayları)
playPauseBtn.addEventListener('click', () => isPlaying ? pauseSong() : playSong());
prevBtn.addEventListener('click', prevSong);
nextBtn.addEventListener('click', nextSong);

audio.addEventListener('ended', () => {
    if (isLooping) { audio.currentTime = 0; playSong(); }
    else { nextSong(); }
});

repeatBtn.addEventListener('click', () => {
    isLooping = !isLooping;
    repeatBtn.style.color = isLooping ? '#00BCD4' : '#888';
});

volumeSlider.addEventListener('input', (e) => audio.volume = e.target.value / 100);

audio.addEventListener('timeupdate', () => {
    if(audio.duration) {
        progressBar.value = (audio.currentTime / audio.duration) * 100;
        document.getElementById('current-time').innerText = formatTime(audio.currentTime);
        document.getElementById('duration').innerText = formatTime(audio.duration);
    }
});

progressBar.addEventListener('input', () => {
    audio.currentTime = (progressBar.value * audio.duration) / 100;
});

function formatTime(s) { return `${Math.floor(s/60)}:${Math.floor(s%60).toString().padStart(2,'0')}`; }


// --- 5. İŞLEVSEL ÖZELLİKLER (EN ÖNEMLİ KISIM) ---

// A) Ana Sayfa Listesini Oluşturma
function renderMainSongList() {
    const container = document.getElementById('song-list-container');
    container.innerHTML = ""; // Temizle

    allSongs.forEach((song, index) => {
        // Şarkı Kartı
        const item = document.createElement('div');
        item.className = 'song-item';

        // Görsel ve Bilgi
        const imgDiv = document.createElement('div');
        imgDiv.className = 'song-img-small';
        imgDiv.innerHTML = `<img src="${song.cover}">`;
        
        const infoDiv = document.createElement('div');
        infoDiv.className = 'song-info';
        infoDiv.innerHTML = `<span class="title">${song.title}</span><span class="artist">${song.artist}</span>`;

        // Tıklayınca Çal
        const playAction = () => {
            currentPlaylist = [...allSongs];
            songIndex = index;
            loadSong(currentPlaylist[songIndex]);
            playSong();
        };
        imgDiv.onclick = playAction;
        infoDiv.onclick = playAction;

        // (+) Ekleme Butonu
        const plusIcon = document.createElement('i');
        plusIcon.className = 'fa-solid fa-plus-circle';
        plusIcon.style.cssText = "font-size:24px; color:#00BCD4; cursor:pointer; padding:10px;";
        plusIcon.onclick = (e) => {
            e.stopPropagation(); // Kartın çalmasını engelle
            addToPlaylist(song); // Listeye ekle fonksiyonunu çağır
        };

        item.appendChild(imgDiv);
        item.appendChild(infoDiv);
        item.appendChild(plusIcon);
        container.appendChild(item);
    });
}

// B) Beğenme Butonu İşlevi
likeBtn.addEventListener('click', () => {
    const song = currentPlaylist[songIndex];
    if(!song) return;

    // Zaten var mı?
    const existingIndex = likedSongs.findIndex(s => s.title === song.title);
    
    if (existingIndex > -1) {
        likedSongs.splice(existingIndex, 1); // Çıkar
    } else {
        likedSongs.push(song); // Ekle
    }
    
    localStorage.setItem('likedSongs', JSON.stringify(likedSongs));
    updateLikeIcon(song);
    renderLikedSongs(); // Arka planda listeyi güncelle
});

// C) Beğendiklerim Listesini Göster
function renderLikedSongs() {
    const container = document.getElementById('liked-songs-container');
    container.innerHTML = "";

    if(likedSongs.length === 0) {
        container.innerHTML = "<p style='padding:20px; color:#777; text-align:center;'>Henüz beğenilen şarkı yok.</p>";
        return;
    }

    likedSongs.forEach((song, index) => {
        const item = document.createElement('div');
        item.className = 'song-item';
        item.innerHTML = `
            <div class="song-img-small"><img src="${song.cover}"></div>
            <div class="song-info">
                <span class="title">${song.title}</span>
                <span class="artist">${song.artist}</span>
            </div>
            <i class="fa-solid fa-heart" style="color:red; padding:10px;"></i>
        `;
        item.onclick = () => {
            currentPlaylist = [...likedSongs];
            songIndex = index;
            loadSong(currentPlaylist[songIndex]);
            playSong();
        };
        container.appendChild(item);
    });
}

// D) Listeye Ekleme Mantığı
function addToPlaylist(song) {
    if(myPlaylists.length === 0) {
        alert("Önce 'Çalma Listem' sekmesinden bir liste oluşturmalısın!");
        switchView('playlists');
        return;
    }

    let promptText = "Hangi listeye ekleyeyim? (Numarasını yaz):\n";
    myPlaylists.forEach((list, i) => {
        promptText += `${i+1}. ${list.name}\n`;
    });
    
    const choice = prompt(promptText);
    if(!choice) return; // İptal ederse çık

    const listIndex = parseInt(choice) - 1;

    if(listIndex >= 0 && listIndex < myPlaylists.length) {
        if(!myPlaylists[listIndex].songs) myPlaylists[listIndex].songs = [];
        
        // Şarkı kontrolü
        const exists = myPlaylists[listIndex].songs.some(s => s.title === song.title);
        if(exists) {
            alert("Bu şarkı zaten orada var!");
        } else {
            myPlaylists[listIndex].songs.push(song);
            myPlaylists[listIndex].count = myPlaylists[listIndex].songs.length;
            localStorage.setItem('myPlaylists', JSON.stringify(myPlaylists));
            renderPlaylists();
            alert("Eklendi!");
        }
    } else {
        alert("Geçersiz liste numarası.");
    }
}

// E) Çalma Listesi Oluşturma ve Gösterme
const createBtn = document.getElementById('btn-create-playlist');
if(createBtn) {
    createBtn.addEventListener('click', () => {
        const input = document.getElementById('new-playlist-input');
        const name = input.value.trim();
        if(name) {
            myPlaylists.push({ id: Date.now(), name: name, count: 0, songs: [] });
            localStorage.setItem('myPlaylists', JSON.stringify(myPlaylists));
            input.value = '';
            renderPlaylists();
        }
    });
}

function renderPlaylists() {
    const container = document.getElementById('my-playlists-container');
    container.innerHTML = '';
    
    if(myPlaylists.length === 0) {
        container.innerHTML = '<p style="text-align:center; color:#777; grid-column:1/-1;">Liste yok.</p>';
        return;
    }

    myPlaylists.forEach((list, index) => {
        const div = document.createElement('div');
        div.className = 'playlist-card';
        div.innerHTML = `
            <div style="font-size:30px; margin-bottom:10px;">🎵</div>
            <h4 style="margin:0; color:#006064;">${list.name}</h4>
            <p style="font-size:12px; color:#666;">${list.count || 0} Şarkı</p>
        `;
        div.onclick = () => openPlaylist(list);
        container.appendChild(div);
    });
}

function openPlaylist(list) {
    if(!list.songs || list.songs.length === 0) {
        alert("Bu liste boş! Ana sayfadan (+) butonuna basarak şarkı ekle.");
        return;
    }
    
    // Geçici olarak ana sayfa görünümünü değiştir
    currentPlaylist = [...list.songs];
    
    // Ana sayfa başlığını değiştirip oraya yönlendir (Hızlı çözüm)
    const header = document.querySelector('#view-home h1');
    header.innerText = `🎵 ${list.name}`;
    
    // Listeyi bas
    const container = document.getElementById('song-list-container');
    container.innerHTML = "";
    
    // Geri Dön Butonu
    const backBtn = document.createElement('button');
    backBtn.innerText = "← Tüm Şarkılara Dön";
    backBtn.style.cssText = "padding:10px; margin-bottom:10px; border:none; background:#ddd; cursor:pointer; border-radius:5px;";
    backBtn.onclick = () => {
        header.innerText = "Ensufy'e Hoşgeldin 🌸";
        renderMainSongList();
    };
    container.appendChild(backBtn);

    // Liste şarkılarını bas
    list.songs.forEach((song, index) => {
        const item = document.createElement('div');
        item.className = 'song-item';
        item.innerHTML = `
            <div class="song-img-small"><img src="${song.cover}"></div>
            <div class="song-info">
                <span class="title">${song.title}</span>
                <span class="artist">${song.artist}</span>
            </div>
        `;
        item.onclick = () => {
            songIndex = index;
            loadSong(currentPlaylist[songIndex]);
            playSong();
        };
        container.appendChild(item);
    });

    switchView('home');
}

// --- 6. NAVİGASYON ---
const views = {
    home: document.getElementById('view-home'),
    liked: document.getElementById('view-liked'),
    playlists: document.getElementById('view-playlists'),
    profile: document.getElementById('view-profile')
};

function switchView(viewName) {
    Object.values(views).forEach(el => el.style.display = 'none');
    if(views[viewName]) views[viewName].style.display = 'block';

    // Menü aktifliği
    document.querySelectorAll('.sidebar li').forEach(li => li.classList.remove('active'));
    const activeBtn = document.getElementById('nav-' + (viewName === 'profile' ? 'profile-side' : viewName));
    if(activeBtn) activeBtn.classList.add('active');

    if(viewName === 'liked') renderLikedSongs();
    if(viewName === 'playlists') renderPlaylists();
    if(viewName === 'profile') renderProfile();
}

// Buton Bağlantıları
document.getElementById('nav-home').addEventListener('click', () => {
    document.querySelector('#view-home h1').innerText = "Ensufy'e Hoşgeldin 🌸";
    renderMainSongList();
    switchView('home');
});
document.getElementById('nav-liked').addEventListener('click', () => switchView('liked'));
document.getElementById('nav-playlists').addEventListener('click', () => switchView('playlists'));
document.getElementById('nav-profile-side').addEventListener('click', () => switchView('profile'));
document.getElementById('user-profile-btn').addEventListener('click', () => switchView('profile'));

// Profil
function renderProfile() {
    document.getElementById('stat-playlists').innerText = myPlaylists.length + ' Liste';
    document.getElementById('stat-followers').innerText = userStats.followers + ' Takipçi';
    
    // Profildeki listeler
    const container = document.getElementById('profile-playlists-display');
    container.innerHTML = '';
    myPlaylists.forEach(list => {
        const d = document.createElement('div');
        d.className = 'playlist-card';
        d.innerHTML = `<b>${list.name}</b>`;
        container.appendChild(d);
    });
}

document.getElementById('btn-follow-toggle').addEventListener('click', () => {
    userStats.isFollowing = !userStats.isFollowing;
    userStats.followers += userStats.isFollowing ? 1 : -1;
    localStorage.setItem('userStats', JSON.stringify(userStats));
    
    const btn = document.getElementById('btn-follow-toggle');
    if(userStats.isFollowing) {
        btn.innerText = "TAKİP EDİLİYOR";
        btn.classList.add('following');
    } else {
        btn.innerText = "TAKİP ET";
        btn.classList.remove('following');
    }
    document.getElementById('stat-followers').innerText = userStats.followers + ' Takipçi';
});