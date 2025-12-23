// --- 1. FIREBASE İTHAL ETME ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut, sendEmailVerification } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// --- SENİN FIREBASE AYARLARIN ---
const firebaseConfig = {
    apiKey: "AIzaSyBE7CjplVaq-pfT4OdPaufSrcd3zdZYOMk", // Senin API Key'in
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

// --- 2. VERİLER VE DEĞİŞKENLER ---
const songs = [
    {
        title: "Bizim Şarkımız",
        artist: "Seni Çok Seviyorum",
        cover: "fotolar/foto1.jpg",
        src: "muzikler/sarki1.mp3"
    },
    {
        title: "Yeni Yıl Hediyem",
        artist: "Mutlu Yıllar Aşkım",
        cover: "fotolar/foto2.jpg",
        src: "muzikler/sarki2.mp3"
    },
    {
        title: "Bizim Şarkımız",
        artist: "Seni Çok Seviyorum",
        cover: "fotolar/foto1.jpg",
        src: "muzikler/sarki3.mp3"
    },
    {
        title: "Yeni Yıl Hediyem",
        artist: "Mutlu Yıllar Aşkım",
        cover: "fotolar/foto2.jpg",
        src: "muzikler/sarki4.mp3"
    }
];

let songIndex = 0;
let isPlaying = false;
let isLooping = false; 

// HTML Seçiciler
const audio = new Audio();
const playPauseBtn = document.getElementById('play-pause-btn');
const playIcon = document.getElementById('play-icon');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');
const repeatBtn = document.getElementById('repeat-btn');
const volumeSlider = document.getElementById('volume-slider');
const progressBar = document.getElementById('progress-bar');
const songListContainer = document.getElementById('song-list-container');

// Giriş Ekranı Seçiciler
const authModal = document.getElementById('auth-modal');
const emailInput = document.getElementById('email');
const passInput = document.getElementById('password');
const emailAuthBtn = document.getElementById('email-auth-btn');
const googleAuthBtn = document.getElementById('google-auth-btn');
const toggleAuthText = document.getElementById('toggle-auth-mode');
const authTitle = document.getElementById('auth-title');

let isLoginMode = true;

// --- 3. GİRİŞ VE HESAP İŞLEMLERİ ---

onAuthStateChanged(auth, (user) => {
    if (user) {
        // Kullanıcı giriş yapmış
        authModal.style.display = "none";
        console.log("Giriş yapıldı:", user.email);
        
        const displayName = user.displayName || user.email.split('@')[0];

        // Profil Bilgilerini Güncelle
        document.getElementById('username-display').innerText = displayName;
        document.getElementById('welcome-name').innerText = displayName;
        
        // YENİ EKLENEN: Profil sayfasındaki ismi de güncelle
        const profileNameEl = document.getElementById('profile-name-text');
        if(profileNameEl) profileNameEl.innerText = displayName;

        document.getElementById('logout-btn').style.display = "inline-block";

        if (user.emailVerified) {
            document.getElementById('blue-tick').style.display = "inline-block";
        } else {
            document.getElementById('blue-tick').style.display = "none";
        }

    } else {
        // Kullanıcı çıkış yapmış
        authModal.style.display = "flex"; 
    }
});

// Google ile Giriş
googleAuthBtn.addEventListener('click', () => {
    signInWithPopup(auth, provider).catch((error) => alert("Hata: " + error.message));
});

// Email ile Giriş / Kayıt Butonu
emailAuthBtn.addEventListener('click', () => {
    const email = emailInput.value;
    const pass = passInput.value;

    if (isLoginMode) {
        signInWithEmailAndPassword(auth, email, pass)
            .catch((error) => alert("Giriş Hatası: " + error.message));
    } else {
        createUserWithEmailAndPassword(auth, email, pass)
            .then((userCredential) => {
                sendEmailVerification(userCredential.user)
                    .then(() => alert("Kayıt oldun! Doğrulama maili gönderildi. Lütfen mailini onayla."));
            })
            .catch((error) => alert("Kayıt Hatası: " + error.message));
    }
});

// Giriş/Kayıt Modu Değiştirme
toggleAuthText.addEventListener('click', () => {
    isLoginMode = !isLoginMode;
    authTitle.innerText = isLoginMode ? "Giriş Yap" : "Kayıt Ol";
    emailAuthBtn.innerText = isLoginMode ? "Giriş Yap" : "Kayıt Ol";
    toggleAuthText.innerText = isLoginMode ? "Hesabın yok mu? Kayıt Ol" : "Zaten hesabın var mı? Giriş Yap";
});

// Çıkış Yap
document.getElementById('logout-btn').addEventListener('click', () => {
    signOut(auth);
});

// --- 4. PLAYER FONKSİYONLARI ---

window.addEventListener('DOMContentLoaded', () => {
    loadSongList();
    loadSong(songs[songIndex]);
    
    // Sayfa açılınca varsayılan olarak Anasayfa'yı göster (YENİ)
    switchView('home');
});

function loadSong(song) {
    document.getElementById('current-title').innerText = song.title;
    document.getElementById('current-note').innerText = song.artist;
    document.getElementById('current-cover').src = song.cover;
    document.getElementById('hero-img').src = song.cover;
    audio.src = song.src;

    if ('mediaSession' in navigator) {
        navigator.mediaSession.metadata = new MediaMetadata({
            title: song.title,
            artist: song.artist,
            artwork: [{ src: song.cover, sizes: '512x512', type: 'image/jpeg' }]
        });
        navigator.mediaSession.setActionHandler('play', playSong);
        navigator.mediaSession.setActionHandler('pause', pauseSong);
        navigator.mediaSession.setActionHandler('previoustrack', prevSong);
        navigator.mediaSession.setActionHandler('nexttrack', nextSong);
    }
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
    if (songIndex > songs.length - 1) songIndex = 0;
    loadSong(songs[songIndex]);
    playSong();
}

function prevSong() {
    songIndex--;
    if (songIndex < 0) songIndex = songs.length - 1;
    loadSong(songs[songIndex]);
    playSong();
}

audio.addEventListener('ended', () => {
    if (isLooping) {
        audio.currentTime = 0;
        playSong();
    } else {
        nextSong();
    }
});

repeatBtn.addEventListener('click', () => {
    isLooping = !isLooping;
    if (isLooping) {
        repeatBtn.classList.add('active'); 
        repeatBtn.title = "Döngü Açık";
    } else {
        repeatBtn.classList.remove('active');
        repeatBtn.title = "Döngü Kapalı";
    }
});

volumeSlider.addEventListener('input', (e) => {
    audio.volume = e.target.value / 100;
});

playPauseBtn.addEventListener('click', () => {
    isPlaying ? pauseSong() : playSong();
});

prevBtn.addEventListener('click', prevSong);
nextBtn.addEventListener('click', nextSong);

function loadSongList() {
    songListContainer.innerHTML = "";
    songs.forEach((song, index) => {
        const item = document.createElement('div');
        item.classList.add('song-item');
        item.innerHTML = `
            <div class="song-img-small"><img src="${song.cover}"></div>
            <div class="song-info"><span class="title">${song.title}</span><span class="artist">${song.artist}</span></div>
        `;
        item.addEventListener('click', () => {
            songIndex = index;
            loadSong(songs[songIndex]);
            playSong();
        });
        songListContainer.appendChild(item);
    });
}

audio.addEventListener('timeupdate', (e) => {
    if(e.target.duration) {
        const progressPercent = (e.target.currentTime / e.target.duration) * 100;
        progressBar.value = progressPercent;
        document.getElementById('current-time').innerText = formatTime(e.target.currentTime);
        document.getElementById('duration').innerText = formatTime(e.target.duration);
    }
});

progressBar.addEventListener('input', () => {
    audio.currentTime = (progressBar.value * audio.duration) / 100;
});

function formatTime(seconds) {
    const min = Math.floor(seconds / 60);
    const sec = Math.floor(seconds % 60);
    return `${min}:${sec < 10 ? '0' : ''}${sec}`;
}


// =========================================================================
// YENİ EKLENEN KISIM: NAVİGASYON, PROFİL VE ÇALMA LİSTESİ MANTIĞI
// =========================================================================

// --- 1. EKRAN GEÇİŞ YÖNETİMİ ---
const views = {
    home: document.getElementById('view-home'),
    liked: document.getElementById('view-liked'),
    playlists: document.getElementById('view-playlists'),
    profile: document.getElementById('view-profile')
};

const navBtns = {
    home: document.getElementById('nav-home'),
    liked: document.getElementById('nav-liked'),
    playlists: document.getElementById('nav-playlists'),
    profile: document.getElementById('nav-profile-side')
};

function switchView(viewName) {
    // Tüm ekranları gizle
    Object.values(views).forEach(el => { if(el) el.style.display = 'none'; });
    
    // İstenen ekranı göster
    if(views[viewName]) views[viewName].style.display = 'block';

    // Menüdeki aktiflik rengini ayarla (sidebar)
    Object.values(navBtns).forEach(btn => { if(btn) btn.classList.remove('active'); });
    if(navBtns[viewName]) navBtns[viewName].classList.add('active');

    // Sayfa özel verilerini yükle
    if(viewName === 'playlists') renderPlaylists();
    if(viewName === 'profile') renderProfile();
}

// Menü Butonlarına Tıklama Olayları
if(navBtns.home) navBtns.home.addEventListener('click', () => switchView('home'));
if(navBtns.liked) navBtns.liked.addEventListener('click', () => switchView('liked'));
if(navBtns.playlists) navBtns.playlists.addEventListener('click', () => switchView('playlists'));
if(navBtns.profile) navBtns.profile.addEventListener('click', () => switchView('profile'));
// Sağ üstteki profil ikonuna tıklayınca da profil açılır
const userProfileBtn = document.getElementById('user-profile-btn');
if(userProfileBtn) userProfileBtn.addEventListener('click', () => switchView('profile'));


// --- 2. ÇALMA LİSTESİ YÖNETİMİ ---
// Tarayıcı hafızasından listeleri çek, yoksa boş başlat
let myPlaylists = JSON.parse(localStorage.getItem('myPlaylists')) || [];

const createPlaylistBtn = document.getElementById('btn-create-playlist');
if(createPlaylistBtn) {
    createPlaylistBtn.addEventListener('click', () => {
        const input = document.getElementById('new-playlist-input');
        const name = input.value.trim();
        if(name) {
            // Yeni liste ekle
            myPlaylists.push({ id: Date.now(), name: name, count: 0 });
            // Kaydet
            localStorage.setItem('myPlaylists', JSON.stringify(myPlaylists));
            // Kutuyu temizle
            input.value = '';
            // Listeyi yenile
            renderPlaylists();
            alert(`"${name}" listesi oluşturuldu!`);
        }
    });
}

function renderPlaylists() {
    const container = document.getElementById('my-playlists-container');
    if(!container) return;
    
    container.innerHTML = ''; // Önce temizle
    
    if(myPlaylists.length === 0) {
        container.innerHTML = '<p style="color:#888; grid-column: 1/-1; text-align:center;">Henüz bir listen yok.</p>';
        return;
    }

    myPlaylists.forEach(list => {
        const div = document.createElement('div');
        div.className = 'playlist-card'; // CSS'teki stil
        div.innerHTML = `
            <div style="font-size:30px; margin-bottom:10px;">🎵</div>
            <h4 style="margin:0; color:#006064;">${list.name}</h4>
            <p style="font-size:12px; color:#666;">${list.count} Şarkı</p>
        `;
        div.onclick = () => alert(`${list.name} listesi şu an boş.`);
        container.appendChild(div);
    });
}


// --- 3. PROFİL VE TAKİP SİSTEMİ ---
let userStats = JSON.parse(localStorage.getItem('userStats')) || { followers: 0, following: 0, isFollowing: false };

function renderProfile() {
    // İstatistikleri güncelle
    const statPlaylists = document.getElementById('stat-playlists');
    const statFollowers = document.getElementById('stat-followers');
    
    if(statPlaylists) statPlaylists.innerText = myPlaylists.length + ' Liste';
    if(statFollowers) statFollowers.innerText = userStats.followers + ' Takipçi';
    
    // Buton Durumu
    const followBtn = document.getElementById('btn-follow-toggle');
    if(followBtn) {
        if(userStats.isFollowing) {
            followBtn.innerText = 'TAKİP EDİLİYOR';
            followBtn.classList.add('following');
        } else {
            followBtn.innerText = 'TAKİP ET';
            followBtn.classList.remove('following');
        }
    }

    // Profildeki Listeleri Göster (Herkese açık gibi)
    const pContainer = document.getElementById('profile-playlists-display');
    if(pContainer) {
        pContainer.innerHTML = '';
        myPlaylists.forEach(list => {
            const div = document.createElement('div');
            div.className = 'playlist-card';
            div.innerHTML = `<b>${list.name}</b>`;
            pContainer.appendChild(div);
        });
    }
}

// Takip Butonu Mantığı
const followToggleBtn = document.getElementById('btn-follow-toggle');
if(followToggleBtn) {
    followToggleBtn.addEventListener('click', () => {
        userStats.isFollowing = !userStats.isFollowing;
        
        // Takip sayısını yapay olarak artır/azalt
        if(userStats.isFollowing) userStats.followers++;
        else userStats.followers--;
        
        localStorage.setItem('userStats', JSON.stringify(userStats));
        renderProfile();
    });
}