// --- 1. FIREBASE İTHAL ETME ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut, sendEmailVerification } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// --- FIREBASE AYARLARI ---
const firebaseConfig = {
    apiKey: "AIzaSyBE7CjplVaq-pfT4OdPaufSrcd3zdZYOMk",
    authDomain: "ensufy.firebaseapp.com",
    projectId: "ensufy",
    storageBucket: "ensufy.firebasestorage.app",
    messagingSenderId: "768227665414",
    appId: "1:768227665414:web:09282f41c39af751a68587"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

// --- 2. VERİLER (ŞARKILAR) ---
// Not: src kısmındaki dosya yollarının doğru olduğundan emin ol.
const allSongs = [
    { title: "Bizim Şarkımız", artist: "Seni Çok Seviyorum", cover: "fotolar/foto1.jpg", src: "muzikler/sarki1.mp3" },
    { title: "Yeni Yıl Hediyem", artist: "Mutlu Yıllar Aşkım", cover: "fotolar/foto2.jpg", src: "muzikler/sarki2.mp3" },
    { title: "Aşkımız", artist: "Sonsuza Dek", cover: "fotolar/foto1.jpg", src: "muzikler/sarki3.mp3" },
    { title: "Hatıramız", artist: "Bizim Hikayemiz", cover: "fotolar/foto2.jpg", src: "muzikler/sarki4.mp3" }
];

// Şu an çalan liste (Başlangıçta tüm şarkılar)
let currentPlaylist = [...allSongs]; 
let songIndex = 0;
let isPlaying = false;
let isLooping = false;

// --- HTML SEÇİCİLER ---
const audio = new Audio();
const playPauseBtn = document.getElementById('play-pause-btn');
const playIcon = document.getElementById('play-icon');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');
const repeatBtn = document.getElementById('repeat-btn');
const volumeSlider = document.getElementById('volume-slider');
const progressBar = document.getElementById('progress-bar');
const likeBtn = document.getElementById('like-btn');

// --- VERİ YÖNETİMİ (KAYIT SİSTEMİ) ---
let myPlaylists = JSON.parse(localStorage.getItem('myPlaylists')) || [];
let likedSongs = JSON.parse(localStorage.getItem('likedSongs')) || [];
let userStats = JSON.parse(localStorage.getItem('userStats')) || { followers: 0, following: 0, isFollowing: false };

// --- 3. GİRİŞ İŞLEMLERİ ---
const authModal = document.getElementById('auth-modal');
const emailInput = document.getElementById('email');
const passInput = document.getElementById('password');
const emailAuthBtn = document.getElementById('email-auth-btn');
const googleAuthBtn = document.getElementById('google-auth-btn');
const toggleAuthText = document.getElementById('toggle-auth-mode');
const authTitle = document.getElementById('auth-title');
let isLoginMode = true;

onAuthStateChanged(auth, (user) => {
    if (user) {
        authModal.style.display = "none";
        const name = user.displayName || user.email.split('@')[0];
        document.getElementById('username-display').innerText = name;
        document.getElementById('welcome-name').innerText = name;
        document.getElementById('profile-name-text').innerText = name;
        document.getElementById('logout-btn').style.display = "inline-block";
        if (user.emailVerified) document.getElementById('blue-tick').style.display = "inline-block";
    } else {
        authModal.style.display = "flex";
    }
});

googleAuthBtn.addEventListener('click', () => signInWithPopup(auth, provider).catch(e => alert(e.message)));
emailAuthBtn.addEventListener('click', () => {
    const email = emailInput.value;
    const pass = passInput.value;
    if (isLoginMode) signInWithEmailAndPassword(auth, email, pass).catch(e => alert(e.message));
    else createUserWithEmailAndPassword(auth, email, pass).then(u => sendEmailVerification(u.user).then(() => alert("Doğrulama maili gönderildi."))).catch(e => alert(e.message));
});
toggleAuthText.addEventListener('click', () => {
    isLoginMode = !isLoginMode;
    authTitle.innerText = isLoginMode ? "Giriş Yap" : "Kayıt Ol";
    emailAuthBtn.innerText = isLoginMode ? "Giriş Yap" : "Kayıt Ol";
    toggleAuthText.innerText = isLoginMode ? "Hesabın yok mu? Kayıt Ol" : "Zaten hesabın var mı? Giriş Yap";
});
document.getElementById('logout-btn').addEventListener('click', () => signOut(auth));

// --- 4. PLAYER MANTIĞI ---

// Şarkı Yükle
function loadSong(song) {
    if(!song) return;
    document.getElementById('current-title').innerText = song.title;
    document.getElementById('current-note').innerText = song.artist;
    document.getElementById('current-cover').src = song.cover;
    document.getElementById('hero-img').src = song.cover;
    audio.src = song.src;

    // Beğenme Durumunu Kontrol Et (Kalp Rengi)
    const isLiked = likedSongs.some(s => s.title === song.title);
    likeBtn.classList.toggle('fa-solid', isLiked);
    likeBtn.classList.toggle('fa-regular', !isLiked);
    likeBtn.style.color = isLiked ? 'red' : '#888';
}

function playSong() {
    isPlaying = true;
    audio.play();
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

// Şarkı Bitince
audio.addEventListener('ended', () => isLooping ? playSong() : nextSong());

// Butonlar
playPauseBtn.addEventListener('click', () => isPlaying ? pauseSong() : playSong());
prevBtn.addEventListener('click', prevSong);
nextBtn.addEventListener('click', nextSong);
repeatBtn.addEventListener('click', () => {
    isLooping = !isLooping;
    repeatBtn.style.color = isLooping ? '#00BCD4' : '#888';
});
volumeSlider.addEventListener('input', (e) => audio.volume = e.target.value / 100);

// Progress Bar
audio.addEventListener('timeupdate', (e) => {
    if(e.target.duration) {
        progressBar.value = (e.target.currentTime / e.target.duration) * 100;
        document.getElementById('current-time').innerText = formatTime(e.target.currentTime);
        document.getElementById('duration').innerText = formatTime(e.target.duration);
    }
});
progressBar.addEventListener('input', () => audio.currentTime = (progressBar.value * audio.duration) / 100);
function formatTime(s) { return `${Math.floor(s/60)}:${Math.floor(s%60).toString().padStart(2,'0')}`; }


// --- 5. İŞLEVSEL ÖZELLİKLER (BEĞENME, EKLEME, LİSTELEME) ---

// A) Beğenme (Kalp) Butonu Mantığı
likeBtn.addEventListener('click', () => {
    const song = currentPlaylist[songIndex];
    // Zaten beğenilmiş mi?
    const index = likedSongs.findIndex(s => s.title === song.title);
    
    if (index > -1) {
        likedSongs.splice(index, 1); // Çıkar
        likeBtn.classList.replace('fa-solid', 'fa-regular');
        likeBtn.style.color = '#888';
    } else {
        likedSongs.push(song); // Ekle
        likeBtn.classList.replace('fa-regular', 'fa-solid');
        likeBtn.style.color = 'red';
    }
    localStorage.setItem('likedSongs', JSON.stringify(likedSongs));
    renderLikedSongs(); // Beğendiklerim sayfasını güncelle
});

// B) Şarkı Listesini Ekrana Basma (YANINA (+) BUTONU EKLEDİK)
function renderSongList(targetElementId, playlist, isMainList = false) {
    const container = document.getElementById(targetElementId);
    container.innerHTML = "";
    
    if(playlist.length === 0) {
        container.innerHTML = "<p style='padding:10px; color:#777;'>Bu liste boş.</p>";
        return;
    }

    playlist.forEach((song, index) => {
        const item = document.createElement('div');
        item.className = 'song-item';
        
        // Şarkı kartı yapısı
        let htmlContent = `
            <div class="song-img-small" onclick="window.playSpecific(${index}, '${targetElementId}')"><img src="${song.cover}"></div>
            <div class="song-info" onclick="window.playSpecific(${index}, '${targetElementId}')">
                <span class="title">${song.title}</span>
                <span class="artist">${song.artist}</span>
            </div>
        `;

        // Sadece Ana Sayfada (+) Butonu Göster
        if(isMainList) {
            htmlContent += `<i class="fa-solid fa-plus-circle" style="font-size:24px; color:#00BCD4; cursor:pointer; padding:10px;" onclick="window.addToPlaylistUI(${index})"></i>`;
        }
        
        item.innerHTML = htmlContent;
        container.appendChild(item);
    });
}

// Global Fonksiyonlar (HTML onclick kullanabilsin diye window'a atıyoruz)
window.playSpecific = (index, sourceId) => {
    // Hangi listeden çaldığına göre listeyi güncelle
    if(sourceId === 'song-list-container') currentPlaylist = [...allSongs];
    else if(sourceId === 'liked-songs-container') currentPlaylist = [...likedSongs];
    // Özel liste kontrolü aşağıda yapılacak
    
    songIndex = index;
    loadSong(currentPlaylist[songIndex]);
    playSong();
};

// C) Listeye Şarkı Ekleme Fonksiyonu
window.addToPlaylistUI = (index) => {
    const songToAdd = allSongs[index];
    
    if(myPlaylists.length === 0) {
        alert("Önce bir çalma listesi oluşturmalısın!");
        switchView('playlists');
        return;
    }

    // Basit bir seçim ekranı (Prompt)
    let promptText = "Hangi listeye ekleyeyim? (Numarasını yaz):\n";
    myPlaylists.forEach((list, i) => {
        promptText += `${i+1}. ${list.name}\n`;
    });
    
    const choice = prompt(promptText);
    const listIndex = parseInt(choice) - 1;

    if(listIndex >= 0 && listIndex < myPlaylists.length) {
        if(!myPlaylists[listIndex].songs) myPlaylists[listIndex].songs = []; // Dizi yoksa oluştur
        
        // Şarkı zaten var mı?
        const exists = myPlaylists[listIndex].songs.some(s => s.title === songToAdd.title);
        if(exists) {
            alert("Bu şarkı zaten listede var!");
        } else {
            myPlaylists[listIndex].songs.push(songToAdd);
            myPlaylists[listIndex].count = myPlaylists[listIndex].songs.length;
            localStorage.setItem('myPlaylists', JSON.stringify(myPlaylists));
            renderPlaylists();
            alert(`${songToAdd.title}, "${myPlaylists[listIndex].name}" listesine eklendi!`);
        }
    } else {
        alert("Geçersiz seçim.");
    }
};

// D) Çalma Listesi Oluşturma ve Görüntüleme
document.getElementById('btn-create-playlist').addEventListener('click', () => {
    const input = document.getElementById('new-playlist-input');
    const name = input.value.trim();
    if(name) {
        myPlaylists.push({ id: Date.now(), name: name, count: 0, songs: [] });
        localStorage.setItem('myPlaylists', JSON.stringify(myPlaylists));
        input.value = '';
        renderPlaylists();
    }
});

function renderPlaylists() {
    const container = document.getElementById('my-playlists-container');
    container.innerHTML = '';
    
    myPlaylists.forEach((list, index) => {
        const div = document.createElement('div');
        div.className = 'playlist-card';
        div.innerHTML = `
            <div style="font-size:30px; margin-bottom:10px;">🎵</div>
            <h4 style="margin:0; color:#006064;">${list.name}</h4>
            <p style="font-size:12px; color:#666;">${list.count || 0} Şarkı</p>
        `;
        // Listeye tıklayınca ne olsun?
        div.onclick = () => openPlaylistDetail(index);
        container.appendChild(div);
    });
}

// Listenin İçini Açma (Detay Görünümü)
function openPlaylistDetail(index) {
    const list = myPlaylists[index];
    if(!list.songs || list.songs.length === 0) {
        alert("Bu liste boş! Ana sayfadan (+) butonuna basarak şarkı ekle.");
        return;
    }
    
    // Geçici olarak ana sayfa listesini değiştirip çalıyoruz
    // Kullanıcıya hissettirmeden listeyi bu yapıyoruz
    currentPlaylist = list.songs;
    renderSongList('song-list-container', currentPlaylist, false); // (+) butonu olmadan göster
    
    // Başlığı değiştir
    document.querySelector('#view-home h1').innerText = `🎵 ${list.name}`;
    document.querySelector('#view-home .greeting-text h3').innerText = "Çalma Listesi";
    document.querySelector('#view-home .greeting-text p').innerText = "Senin oluşturduğun liste çalınıyor.";
    
    // Ana sayfaya yönlendir (Çünkü şarkı listesi orada)
    switchView('home');
}

// E) Beğendiklerim Listesini Güncelle
function renderLikedSongs() {
    renderSongList('liked-songs-container', likedSongs, false);
}


// --- 6. NAVİGASYON VE PROFİL ---
const views = {
    home: document.getElementById('view-home'),
    liked: document.getElementById('view-liked'),
    playlists: document.getElementById('view-playlists'),
    profile: document.getElementById('view-profile')
};

function switchView(viewName) {
    Object.values(views).forEach(el => el.style.display = 'none');
    if(views[viewName]) views[viewName].style.display = 'block';
    
    // Sayfa açıldığında özel işlemleri yap
    if(viewName === 'home') {
        // Ana sayfaya dönünce orijinal tüm şarkıları geri yükle
        // (Eğer özel liste modundaysak çıkmış oluruz)
        if(document.querySelector('#view-home h1').innerText.includes('🎵')) {
             document.querySelector('#view-home h1').innerText = "Ensufy'e Hoşgeldin 🌸";
             document.querySelector('#view-home .greeting-text h3').innerHTML = 'Hoş geldin <span id="welcome-name">Sevgilim</span>';
             document.querySelector('#view-home .greeting-text p').innerText = "Senin için hazırladığım özel şarkılar burada.";
             renderSongList('song-list-container', allSongs, true);
        }
    }
    if(viewName === 'liked') renderLikedSongs();
    if(viewName === 'playlists') renderPlaylists();
    if(viewName === 'profile') renderProfile();
}

// Butonlar
document.getElementById('nav-home').addEventListener('click', () => {
    // Home butonuna basınca her şeyi sıfırla (Tüm şarkıları göster)
    currentPlaylist = [...allSongs];
    renderSongList('song-list-container', allSongs, true);
    switchView('home');
});
document.getElementById('nav-liked').addEventListener('click', () => switchView('liked'));
document.getElementById('nav-playlists').addEventListener('click', () => switchView('playlists'));
document.getElementById('nav-profile-side').addEventListener('click', () => switchView('profile'));
document.getElementById('user-profile-btn').addEventListener('click', () => switchView('profile'));

// Profil Render
function renderProfile() {
    document.getElementById('stat-playlists').innerText = myPlaylists.length + ' Liste';
    document.getElementById('stat-followers').innerText = userStats.followers + ' Takipçi';
    
    const pContainer = document.getElementById('profile-playlists-display');
    pContainer.innerHTML = '';
    myPlaylists.forEach(list => {
        const div = document.createElement('div');
        div.className = 'playlist-card';
        div.innerHTML = `<b>${list.name}</b>`;
        pContainer.appendChild(div);
    });
}
document.getElementById('btn-follow-toggle').addEventListener('click', () => {
    userStats.isFollowing = !userStats.isFollowing;
    userStats.followers += userStats.isFollowing ? 1 : -1;
    localStorage.setItem('userStats', JSON.stringify(userStats));
    renderProfile();
});

// --- BAŞLANGIÇ ---
window.addEventListener('DOMContentLoaded', () => {
    renderSongList('song-list-container', allSongs, true);
    loadSong(allSongs[0]);
    switchView('home');
});