// --- 1. ŞARKI VERİLERİ ---
const allSongs = [
    { title: "Bizim Şarkımız", artist: "Seni Çok Seviyorum", cover: "fotolar/foto1.jpg", src: "muzikler/sarki1.mp3" },
    { title: "Yeni Yıl Hediyem", artist: "Mutlu Yıllar Aşkım", cover: "fotolar/foto2.jpg", src: "muzikler/sarki2.mp3" },
    { title: "Sonsuza Dek", artist: "Aşkımız", cover: "fotolar/foto1.jpg", src: "muzikler/sarki3.mp3" },
    { title: "Hatıramız", artist: "Hikayemiz", cover: "fotolar/foto2.jpg", src: "muzikler/sarki4.mp3" }
];

// --- 2. DEĞİŞKENLER VE AYARLAR ---
let currentPlaylist = [...allSongs]; 
let songIndex = 0;
let isPlaying = false;
let isLooping = false;

// Veritabanı (Tarayıcı Hafızası)
let myPlaylists = JSON.parse(localStorage.getItem('myPlaylists')) || [];
let likedSongs = JSON.parse(localStorage.getItem('likedSongs')) || [];
let userStats = JSON.parse(localStorage.getItem('userStats')) || { followers: 0, isFollowing: false };

// --- 3. DOM ELEMENTLERİNİ SEÇME ---
const audio = new Audio();
const playPauseBtn = document.getElementById('play-pause-btn');
const playIcon = document.getElementById('play-icon');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');
const repeatBtn = document.getElementById('repeat-btn');
const volumeSlider = document.getElementById('volume-slider');
const progressBar = document.getElementById('progress-bar');
const likeBtn = document.getElementById('like-btn');
const authModal = document.getElementById('auth-modal');

// --- 4. BAŞLANGIÇ (SAYFA YÜKLENİNCE) ---
document.addEventListener('DOMContentLoaded', () => {
    // 1. Giriş ekranını gizle (Hızlı test için)
    authModal.style.display = 'none';
    document.getElementById('username-display').innerText = "Sevgilim";
    document.getElementById('profile-name-text').innerText = "Sevgilim";

    // 2. Şarkı listesini oluştur
    renderMainList();
    
    // 3. İlk şarkıyı yükle
    loadSong(allSongs[0]);

    // 4. Ana sayfayı aç
    switchView('home');
});


// --- 5. PLAYER FONKSİYONLARI ---
function loadSong(song) {
    if (!song) return;
    document.getElementById('current-title').innerText = song.title;
    document.getElementById('current-note').innerText = song.artist;
    document.getElementById('current-cover').src = song.cover;
    document.getElementById('hero-img').src = song.cover; // Ana resim de değişsin
    audio.src = song.src;

    // Beğenme durumunu kontrol et (Kalp Rengi)
    updateLikeIcon(song);
}

function updateLikeIcon(song) {
    const isLiked = likedSongs.some(s => s.title === song.title);
    if (isLiked) {
        likeBtn.className = "fa-solid fa-heart like-btn";
        likeBtn.style.color = "red";
    } else {
        likeBtn.className = "fa-regular fa-heart like-btn";
        likeBtn.style.color = "#888";
    }
}

function playSong() {
    isPlaying = true;
    audio.play().catch(e => console.log("Oynatma hatası:", e));
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

// Buton Tıklamaları
playPauseBtn.addEventListener('click', () => isPlaying ? pauseSong() : playSong());
nextBtn.addEventListener('click', nextSong);
prevBtn.addEventListener('click', prevSong);

volumeSlider.addEventListener('input', (e) => audio.volume = e.target.value / 100);

audio.addEventListener('timeupdate', () => {
    if (audio.duration) {
        progressBar.value = (audio.currentTime / audio.duration) * 100;
        document.getElementById('current-time').innerText = formatTime(audio.currentTime);
        document.getElementById('duration').innerText = formatTime(audio.duration);
    }
});

progressBar.addEventListener('input', () => {
    audio.currentTime = (progressBar.value * audio.duration) / 100;
});

audio.addEventListener('ended', () => isLooping ? playSong() : nextSong());

repeatBtn.addEventListener('click', () => {
    isLooping = !isLooping;
    repeatBtn.style.color = isLooping ? '#00BCD4' : '#888';
});

function formatTime(s) { return `${Math.floor(s/60)}:${Math.floor(s%60).toString().padStart(2,'0')}`; }


// --- 6. LİSTELEME VE İŞLEVSELLİK (ÖNEMLİ KISIM) ---

// A) ANA SAYFA LİSTESİ (Yanında + Butonu Olan)
function renderMainList() {
    const container = document.getElementById('song-list-container');
    container.innerHTML = ""; // Temizle

    allSongs.forEach((song, index) => {
        // Kartı oluştur
        const item = document.createElement('div');
        item.className = 'song-item';

        // HTML İçeriği
        item.innerHTML = `
            <div class="song-img-small"><img src="${song.cover}"></div>
            <div class="song-info">
                <span class="title">${song.title}</span>
                <span class="artist">${song.artist}</span>
            </div>
        `;

        // (+) EKLEME BUTONU OLUŞTURMA (JS ile)
        const addBtn = document.createElement('i');
        addBtn.className = "fa-solid fa-plus-circle";
        addBtn.style.cssText = "font-size:24px; color:#00BCD4; cursor:pointer; padding:10px;";
        
        // Ekleme butonuna tıklayınca
        addBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // Şarkıyı çalmasın, sadece eklesin
            addToPlaylist(song);
        });

        // Şarkının kendisine tıklayınca çalması
        item.addEventListener('click', () => {
            currentPlaylist = [...allSongs];
            songIndex = index;
            loadSong(currentPlaylist[songIndex]);
            playSong();
        });

        item.appendChild(addBtn); // Butonu karta ekle
        container.appendChild(item); // Kartı listeye ekle
    });
}

// B) LİSTEYE EKLEME MANTIĞI
function addToPlaylist(song) {
    if (myPlaylists.length === 0) {
        alert("Önce bir çalma listesi oluşturmalısın!");
        switchView('playlists');
        return;
    }

    let text = "Hangi listeye ekleyeyim? (Numarasını yaz):\n";
    myPlaylists.forEach((list, i) => {
        text += `${i + 1}. ${list.name}\n`;
    });

    const choice = prompt(text);
    if (!choice) return;

    const listIndex = parseInt(choice) - 1;

    if (listIndex >= 0 && listIndex < myPlaylists.length) {
        if (!myPlaylists[listIndex].songs) myPlaylists[listIndex].songs = [];
        
        // Zaten var mı?
        const exists = myPlaylists[listIndex].songs.some(s => s.title === song.title);
        if (exists) {
            alert("Bu şarkı zaten listede var!");
        } else {
            myPlaylists[listIndex].songs.push(song);
            myPlaylists[listIndex].count = myPlaylists[listIndex].songs.length;
            localStorage.setItem('myPlaylists', JSON.stringify(myPlaylists));
            renderPlaylists(); // Ekranı yenile
            alert("Eklendi!");
        }
    } else {
        alert("Geçersiz liste numarası.");
    }
}

// C) BEĞENME (KALP) MANTIĞI
likeBtn.addEventListener('click', () => {
    const song = currentPlaylist[songIndex];
    const existingIndex = likedSongs.findIndex(s => s.title === song.title);

    if (existingIndex > -1) {
        likedSongs.splice(existingIndex, 1); // Çıkar
    } else {
        likedSongs.push(song); // Ekle
    }

    localStorage.setItem('likedSongs', JSON.stringify(likedSongs));
    updateLikeIcon(song);
    renderLikedList(); // Beğendiklerim sayfasını güncelle
});

// D) BEĞENDİKLERİM LİSTESİNİ GÖSTERME
function renderLikedList() {
    const container = document.getElementById('liked-songs-container');
    container.innerHTML = "";

    if (likedSongs.length === 0) {
        container.innerHTML = "<p style='padding:20px; text-align:center; color:#666;'>Henüz beğenilen yok.</p>";
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
        item.addEventListener('click', () => {
            currentPlaylist = [...likedSongs];
            songIndex = index;
            loadSong(currentPlaylist[songIndex]);
            playSong();
        });
        container.appendChild(item);
    });
}

// E) ÇALMA LİSTESİ OLUŞTURMA VE GÖSTERME
document.getElementById('btn-create-playlist').addEventListener('click', () => {
    const input = document.getElementById('new-playlist-input');
    const name = input.value.trim();
    if (name) {
        myPlaylists.push({ id: Date.now(), name: name, count: 0, songs: [] });
        localStorage.setItem('myPlaylists', JSON.stringify(myPlaylists));
        input.value = '';
        renderPlaylists();
        alert("Liste oluşturuldu!");
    }
});

function renderPlaylists() {
    const container = document.getElementById('my-playlists-container');
    container.innerHTML = "";

    if (myPlaylists.length === 0) {
        container.innerHTML = "<p style='text-align:center; color:#666; grid-column:1/-1;'>Liste yok.</p>";
        return;
    }

    myPlaylists.forEach((list) => {
        const div = document.createElement('div');
        div.className = 'playlist-card';
        div.innerHTML = `
            <div style="font-size:30px; margin-bottom:10px;">🎵</div>
            <h4 style="margin:0; color:#006064;">${list.name}</h4>
            <p style="font-size:12px; color:#666;">${list.count || 0} Şarkı</p>
        `;
        // Listeye tıklayınca açılması için
        div.addEventListener('click', () => openPlaylist(list));
        container.appendChild(div);
    });
}

// LİSTENİN İÇİNİ AÇMA
function openPlaylist(list) {
    if (!list.songs || list.songs.length === 0) {
        alert("Bu liste boş! Ana sayfadan (+) butonuna basarak şarkı ekle.");
        return;
    }

    // Geçici olarak listeyi değiştir
    currentPlaylist = [...list.songs];
    
    // Ana sayfa görünümünü güncelle
    const header = document.querySelector('#view-home h1');
    header.innerText = `🎵 ${list.name}`;
    
    const container = document.getElementById('song-list-container');
    container.innerHTML = "";

    // Geri Dön Butonu
    const backBtn = document.createElement('button');
    backBtn.innerText = "← Tüm Şarkılara Dön";
    backBtn.style.cssText = "padding:10px; margin-bottom:10px; border:none; background:#ddd; cursor:pointer; border-radius:5px; width:100%;";
    backBtn.addEventListener('click', () => {
        header.innerText = "Ensufy'e Hoşgeldin 🌸";
        renderMainList();
    });
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
        item.addEventListener('click', () => {
            songIndex = index;
            loadSong(currentPlaylist[songIndex]);
            playSong();
        });
        container.appendChild(item);
    });

    switchView('home');
}

// --- 7. NAVİGASYON (SAYFA GEÇİŞLERİ) ---
const views = {
    home: document.getElementById('view-home'),
    liked: document.getElementById('view-liked'),
    playlists: document.getElementById('view-playlists'),
    profile: document.getElementById('view-profile')
};

function switchView(viewName) {
    Object.values(views).forEach(el => el.style.display = 'none');
    if (views[viewName]) views[viewName].style.display = 'block';

    // Menü aktifliği
    document.querySelectorAll('.sidebar li').forEach(li => li.classList.remove('active'));
    const btnId = 'nav-' + (viewName === 'profile' ? 'profile-side' : viewName);
    const btn = document.getElementById(btnId);
    if (btn) btn.classList.add('active');

    // Sayfa özel yüklemeleri
    if (viewName === 'liked') renderLikedList();
    if (viewName === 'playlists') renderPlaylists();
    if (viewName === 'profile') renderProfile();
}

// Buton Olayları
document.getElementById('nav-home').addEventListener('click', () => {
    // Ana sayfaya dönünce listeyi sıfırla
    document.querySelector('#view-home h1').innerText = "Ensufy'e Hoşgeldin 🌸";
    renderMainList();
    switchView('home');
});
document.getElementById('nav-liked').addEventListener('click', () => switchView('liked'));
document.getElementById('nav-playlists').addEventListener('click', () => switchView('playlists'));
document.getElementById('nav-profile-side').addEventListener('click', () => switchView('profile'));
document.getElementById('user-profile-btn').addEventListener('click', () => switchView('profile'));

// --- 8. PROFİL ---
function renderProfile() {
    document.getElementById('stat-playlists').innerText = myPlaylists.length + ' Liste';
    document.getElementById('stat-followers').innerText = userStats.followers + ' Takipçi';
    
    // Takip butonu durumu
    const btn = document.getElementById('btn-follow-toggle');
    if (userStats.isFollowing) {
        btn.innerText = "TAKİP EDİLİYOR";
        btn.classList.add('following');
    } else {
        btn.innerText = "TAKİP ET";
        btn.classList.remove('following');
    }

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
    renderProfile();
});