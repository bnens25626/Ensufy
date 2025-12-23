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
// Kendi şarkılarını buraya ekle (Şimdilik herkes aynı şarkıları görür, veritabanına sonra taşıyacağız)
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
let isLooping = false; // Sonsuz döngü kapalı başlar

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

let isLoginMode = true; // Giriş mi Kayıt mı?

// --- 3. GİRİŞ VE HESAP İŞLEMLERİ ---

// Giriş Durumu İzleme (Login olunca ne olsun?)
onAuthStateChanged(auth, (user) => {
    if (user) {
        // Kullanıcı giriş yapmış
        authModal.style.display = "none"; // Modalı kapat
        console.log("Giriş yapıldı:", user.email);
        
        // Profil Bilgilerini Güncelle
        document.getElementById('username-display').innerText = user.displayName || user.email.split('@')[0];
        document.getElementById('welcome-name').innerText = user.displayName || "Sevgilim";
        document.getElementById('logout-btn').style.display = "inline-block";

        // Mavi Tik Kontrolü
        if (user.emailVerified) {
            document.getElementById('blue-tick').style.display = "inline-block";
        } else {
            document.getElementById('blue-tick').style.display = "none";
            // Mail doğrulaması yoksa uyarı verebilirsin
        }

    } else {
        // Kullanıcı çıkış yapmış
        authModal.style.display = "flex"; // Modalı aç
    }
});

// Google ile Giriş
googleAuthBtn.addEventListener('click', () => {
    signInWithPopup(auth, provider).then((result) => {
        // Otomatik mavi tik ve giriş başarılı
    }).catch((error) => alert("Hata: " + error.message));
});

// Email ile Giriş / Kayıt Butonu
emailAuthBtn.addEventListener('click', () => {
    const email = emailInput.value;
    const pass = passInput.value;

    if (isLoginMode) {
        // Giriş Yap
        signInWithEmailAndPassword(auth, email, pass)
            .catch((error) => alert("Giriş Hatası: " + error.message));
    } else {
        // Kayıt Ol
        createUserWithEmailAndPassword(auth, email, pass)
            .then((userCredential) => {
                // Kayıt başarılı, doğrulama maili gönder
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

// Sayfa yüklenince
window.addEventListener('DOMContentLoaded', () => {
    loadSongList();
    loadSong(songs[songIndex]);
});

function loadSong(song) {
    document.getElementById('current-title').innerText = song.title;
    document.getElementById('current-note').innerText = song.artist;
    document.getElementById('current-cover').src = song.cover;
    document.getElementById('hero-img').src = song.cover;
    audio.src = song.src;

    // Media Session (Kilit Ekranı)
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

// Şarkı bitince ne olsun? (REPEAT DÜZELTMESİ)
audio.addEventListener('ended', () => {
    if (isLooping) {
        // Sonsuz döngü açıksa aynı şarkıyı baştan çal
        audio.currentTime = 0;
        playSong();
    } else {
        nextSong();
    }
});

// Repeat Butonu (Tıklayınca renk değiştir ve modu aç)
repeatBtn.addEventListener('click', () => {
    isLooping = !isLooping;
    if (isLooping) {
        repeatBtn.classList.add('active'); // CSS ile mavi yap
        repeatBtn.title = "Döngü Açık";
    } else {
        repeatBtn.classList.remove('active');
        repeatBtn.title = "Döngü Kapalı";
    }
});

// Ses Kontrolü (VOLUME DÜZELTMESİ)
volumeSlider.addEventListener('input', (e) => {
    audio.volume = e.target.value / 100;
});

// Play/Pause Butonu
playPauseBtn.addEventListener('click', () => {
    isPlaying ? pauseSong() : playSong();
});

prevBtn.addEventListener('click', prevSong);
nextBtn.addEventListener('click', nextSong);

// Listeyi Oluştur
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

// Progress Bar
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