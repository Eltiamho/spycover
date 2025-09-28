if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        console.log('Service Worker berhasil didaftarkan:', registration);
      })
      .catch(error => {
        console.log('Pendaftaran Service Worker gagal:', error);
      });
  });
}

let players = JSON.parse(localStorage.getItem("players")) || [];
let roles = JSON.parse(localStorage.getItem("roles")) || [];
let currentIndex = parseInt(localStorage.getItem("currentIndex")) || 0;
let activeModalCloseCallback = null;
// Variabel sementara untuk menyimpan info tebakan Spy
let spyGuessContext = { correctLocation: '' };

document.addEventListener("DOMContentLoaded", () => {
    // Modal setup
    const modal = document.getElementById("customModal");
    const closeBtn = document.getElementById("modalCloseBtn");
    if (modal && closeBtn) {
        closeBtn.addEventListener("click", hideModal);
        modal.addEventListener("click", (e) => { if (e.target === modal) hideModal(); });
    }

    // Player name input setup
    const input = document.getElementById("playerName");
    if (input) {
        input.addEventListener("keypress", function(e) { if (e.key === "Enter") { e.preventDefault(); addPlayer(); } });
    }

    // Slider setup
    const slider = document.getElementById("undercoverSlider");
    const countDisplay = document.getElementById("undercoverCountDisplay");
    if (slider && countDisplay) {
        slider.addEventListener('input', (event) => {
            countDisplay.textContent = event.target.value;
        });
    }

    // Event listener untuk tombol submit tebakan Spy
    const spyGuessSubmitBtn = document.getElementById('spyGuessSubmitBtn');
    if (spyGuessSubmitBtn) {
        spyGuessSubmitBtn.addEventListener('click', handleSpyGuessSubmit);
    }
    const spyGuessInput = document.getElementById('spyGuessInput');
    if(spyGuessInput) {
        spyGuessInput.addEventListener('keypress', function(e) { if(e.key === 'Enter') handleSpyGuessSubmit(); });
    }
});

// Fungsi showModal sekarang bisa menerima parameter isError
function showModal(title, message, onCloseCallback = null, isError = false) {
    const modal = document.getElementById("customModal");
    const modalContent = modal.querySelector('.modal-content');
    const modalTitle = document.getElementById("modalTitle");
    const modalMessage = document.getElementById("modalMessage");
    if (modal && modalTitle && modalMessage) {
        modalTitle.innerText = title;
        modalMessage.innerText = message;

        // Tambah atau hapus class 'is-error' berdasarkan parameter
        if (isError) {
            modalContent.classList.add('is-error');
        } else {
            modalContent.classList.remove('is-error');
        }

        modal.classList.remove("hidden");
        activeModalCloseCallback = onCloseCallback;
    }
}

function hideModal() {
    const modal = document.getElementById("customModal");
    if (modal) {
        modal.classList.add("hidden");
        if (typeof activeModalCloseCallback === 'function') {
            activeModalCloseCallback();
            activeModalCloseCallback = null;
        }
    }
}

// Fungsi untuk menampilkan & menyembunyikan modal tebakan Spy
function showSpyGuessModal() {
    const modal = document.getElementById('spyGuessModal');
    if (modal) {
        modal.classList.remove('hidden');
        document.getElementById('spyGuessInput').focus();
    }
}

function hideSpyGuessModal() {
    const modal = document.getElementById('spyGuessModal');
    if (modal) {
        modal.classList.add('hidden');
        document.getElementById('spyGuessInput').value = ''; // Kosongkan input
    }
}

// Fungsi untuk menangani logika saat Spy menebak
function handleSpyGuessSubmit() {
    const guess = document.getElementById('spyGuessInput').value;
    const correctLocation = spyGuessContext.correctLocation;
    
    hideSpyGuessModal(); // Sembunyikan modal input

    if (guess && guess.trim().toLowerCase() === correctLocation.toLowerCase()) {
        showModal('Spy Menang! 🕵️', `Tebakan lokasi "${correctLocation}" benar! Spy berhasil mengelabui semua orang di saat terakhir.`, () => finishGame());
    } else {
        // Panggil showModal dengan isError = true
        showModal('Penduduk Menang! 🏆', `Tebakan Spy salah! Lokasi yang benar adalah "${correctLocation}". Spy telah dikalahkan.`, () => finishGame(), true);
    }
}


function addPlayer() {
    const input = document.getElementById("playerName");
    const name = input.value.trim();
    if (!name) return;
    players.push(name);
    input.value = "";
    localStorage.setItem("players", JSON.stringify(players));
    renderPlayers();
}

function renderPlayers() {
    const list = document.getElementById("playerList");
    if (!list) return;
    list.innerHTML = "";
    players.forEach(p => {
        const li = document.createElement("li");
        li.innerText = p;
        list.appendChild(li);
    });

    const settingsContainer = document.getElementById('settingsContainer');
    const slider = document.getElementById('undercoverSlider');
    const countDisplay = document.getElementById('undercoverCountDisplay');
    const maxDisplay = document.getElementById('maxUndercover');

    if (players.length >= 3) {
        settingsContainer.classList.remove('hidden');
        let maxUndercovers = Math.max(1, Math.floor((players.length - 2) / 2));
        slider.max = maxUndercovers;
        maxDisplay.textContent = maxUndercovers;

        if (parseInt(slider.value) > maxUndercovers) {
            slider.value = maxUndercovers;
        }
        countDisplay.textContent = slider.value;
    } else {
        settingsContainer.classList.add('hidden');
    }
}

function startGame(mode) {
    if (players.length < 3) {
        showModal('Peringatan', 'Minimal harus ada 3 pemain untuk memulai permainan.');
        return;
    }

    localStorage.setItem('gameMode', mode);
    const shuffledPlayers = [...players].sort(() => Math.random() - 0.5);
    let antagonistCount;

    if (mode === 'undercover') {
        antagonistCount = parseInt(document.getElementById('undercoverSlider').value);
        const pairs = [
             ["Pantai", "Gunung"], ["Sekolah", "Kampus"], ["Pasar", "Mall"], ["Rumah Sakit", "Puskesmas"],
             ["Kantor", "Toko"], ["Stasiun", "Terminal"], ["Bandara", "Pelabuhan"], ["Hotel", "Villa"],
             ["Kucing", "Anjing"], ["Ayam", "Bebek"], ["Emas", "Perak"], ["Buku", "Majalah"],
             ["Televisi", "Radio"], ["Instagram", "Tiktok"], ["Dokter", "Perawat"], ["Guru", "Dosen"], ["Polisi", "Tentara"], ["Koki", "Barista"],
            ["Pilot", "Pramugari"], ["Aktor", "Sutradara"], ["Programmer", "Hacker"], ["Jurnalis", "Reporter"],
            ["Raja", "Ratu"], ["Presiden", "Gubernur"], ["Kafe", "Restoran"], ["Museum", "Galeri"],
            ["Taman", "Hutan"], ["Kos", "Apartemen"], ["Rooftop", "Balkon"], ["Danau", "Sungai"],
            ["Istana", "Kastil"], ["Gudang", "Ruang Bawah Tanah"], ["Laboratorium", "Perpustakaan"],
            ["Bioskop", "Teater"], ["Roti", "Kue"], ["Jus", "Smoothie"], ["Soto", "Sup"],
            ["Burger", "Hotdog"], ["Keripik", "Kerupuk"], ["Donat", "Martabak Manis"], ["Sate", "Kebab"],
            ["Rendang", "Gulai"], ["Sendok", "Garpu"],
            ["Gelas", "Cangkir"], ["Laptop", "Tablet"], ["Gitar", "Bass"], ["Piano", "Keyboard"],
            ["Jam Tangan", "Gelang"], ["Kipas Angin", "AC"], ["Selimut", "Bedcover"], ["Dompet", "Tas"],
            ["Novel", "Komik"], ["Singa", "Harimau"], ["Lumba-lumba", "Paus"],
            ["Kambing", "Domba"], ["Ular", "Belut"], ["Mawar", "Melati"], ["Kaktus", "Lidah Buaya"],
            ["Mangga", "Alpukat"], ["Bayam", "Kangkung"], ["Hiu", "Pari"], ["Berenang", "Menyelam"],
            ["Mendaki", "Trekking"], ["Yoga", "Pilates"], ["Menyanyi", "Beatbox"], ["Memotret", "Merekam Video"],
            ["Bersepeda", "Skateboard"], ["Padel", "Tenis"], ["Sepak Bola", "Futsal"],
            ["Meditasi", "Berdoa"], ["Cinta", "Sahabat"], ["Mimpi", "Harapan"], ["Jenius", "Cerdas"],
            ["Sedih", "Kecewa"], ["Berani", "Nekat"], ["Masa Lalu", "Masa Depan"],
            ["Logika", "Perasaan"], ["Fakta", "Opini"], ["Sabar", "Ikhlas"], ["Kereta", "MRT"],
            ["Kapal", "Feri"], ["Truk", "Bus"], ["Bajaj", "Bemo"],
            ["Sepeda Gunung", "Sepeda Lipat"], ["Go-Jek", "Grab"], ["Ambulans", "Mobil Polisi"],
            ["Delman", "Becak"], ["Roket", "Pesawat Ulang Alik"], ["Kemeja", "Kaus"],
            ["Celana Panjang", "Celana Pendek"], ["Topi", "Helm"], ["Sepatu", "Sandal"], ["Dasi", "Pita"],
            ["Jaket", "Sweater"], ["Sarung", "Sajadah"], ["Cincin", "Anting"], ["Kacamata", "Lensa Kontak"],
            ["Jas", "Blazer"], ["Website", "Blog"], ["Email", "Chat"], ["Like", "Follow"],
            ["Post", "Story"], ["Filter", "Edit"], ["Download", "Upload"], ["Netflix", "YouTube"],
            ["WhatsApp", "Telegram"], ["iPhone", "Android"], ["Wi-Fi", "Data Seluler"]
        ];
        const pair = pairs[Math.floor(Math.random() * pairs.length)];
        const undercoverWord = pair[0];
        const normalWord = pair[1];

        roles = shuffledPlayers.map((player, index) => ({
            name: player,
            word: index < antagonistCount ? undercoverWord : normalWord,
            role: index < antagonistCount ? 'Undercover' : 'Penduduk',
            eliminated: false
        }));

    } else if (mode === 'spyfall') {
        antagonistCount = 1; 
        const locations = [
            "Bandara", "Rumah Sakit", "Sekolah", "Mall", "Stasiun",
            "gereja", "Bioskop", "Pesta Pernikahan", "Kantor Polisi", "Restoran",
            "Kebun Binatang", "Perpustakaan", "KODAM", "Sirkus", "Bioskop",
            "kampus", "Bank", "Hotel", "Pantai", "GMS"
        ];
        const location = locations[Math.floor(Math.random() * locations.length)];
        
        roles = shuffledPlayers.map((player, index) => ({
            name: player,
            word: index < antagonistCount ? "Anda adalah Spy! Cari tahu lokasinya." : location,
            role: index < antagonistCount ? 'Spy' : 'Penduduk',
            eliminated: false
        }));
    }

    roles.sort((a, b) => players.indexOf(a.name) - players.indexOf(b.name));
    localStorage.setItem("roles", JSON.stringify(roles));
    localStorage.setItem("currentIndex", 0);
    window.location.href = "reveal.html";
}

function showCurrentPlayer() {
    const nameEl = document.getElementById("currentPlayer");
    const wordEl = document.getElementById("wordDisplay");
    if (!nameEl) return;
    let currentPlayer = roles[currentIndex];
    nameEl.innerText = currentPlayer.name;
    wordEl.innerText = "";
    wordEl.classList.add("hidden");
}

function showWord() {
    const wordEl = document.getElementById("wordDisplay");
    wordEl.innerText = roles[currentIndex].word;
    wordEl.classList.remove("hidden");
}

function nextPlayer() {
    currentIndex++;
    if (currentIndex >= roles.length) {
        localStorage.setItem("roles", JSON.stringify(roles));
        window.location.href = "elimination.html";
    } else {
        localStorage.setItem("currentIndex", currentIndex);
        showCurrentPlayer();
    }
}

function renderEliminationList() {
    const list = document.getElementById("eliminationList");
    if (!list) return;
    list.innerHTML = "";

    const activePlayers = [];
    const eliminatedPlayers = [];
    roles.forEach((player, originalIndex) => {
        if (player.eliminated) {
            eliminatedPlayers.push(player);
        } else {
            activePlayers.push({ ...player, originalIndex });
        }
    });

    const shuffledActivePlayers = activePlayers.sort(() => Math.random() - 0.5);

    shuffledActivePlayers.forEach(player => {
        const li = document.createElement("li");
        li.innerHTML = `${player.name} <button onclick="eliminatePlayer(${player.originalIndex})">Eliminasi</button>`;
        list.appendChild(li);
    });

    eliminatedPlayers.forEach(player => {
        const li = document.createElement("li");
        li.innerHTML = `${player.name} - <strong>TERELIMINASI (Peran: ${player.role})</strong>`;
        list.appendChild(li);
    });
}

function eliminatePlayer(index) {
    const eliminatedPlayer = roles[index];
    const gameMode = localStorage.getItem('gameMode');

    if (gameMode === 'spyfall' && eliminatedPlayer.role === 'Spy') {
        const correctLocation = roles.find(r => r.role === 'Penduduk').word;
        spyGuessContext.correctLocation = correctLocation; // Simpan lokasi benar
        showSpyGuessModal(); // Tampilkan modal input
    } else {
        roles[index].eliminated = true;
        localStorage.setItem("roles", JSON.stringify(roles));
        checkWinCondition();
    }
}

function checkWinCondition() {
    const gameMode = localStorage.getItem('gameMode');
    const remainingPlayers = roles.filter(r => !r.eliminated);
    const lastEliminated = roles.find(r => r.eliminated && !r.processed);
    if (lastEliminated) lastEliminated.processed = true;

    if (gameMode === 'undercover') {
        const remainingPenduduk = remainingPlayers.filter(r => r.role === 'Penduduk').length;
        const remainingUndercover = remainingPlayers.filter(r => r.role === 'Undercover').length;

        if (remainingUndercover === 0) {
            showModal('Penduduk Menang! 🏆', `Semua Undercover telah ditemukan!`, () => finishGame());
        } else if (remainingUndercover >= remainingPenduduk) {
            showModal('Undercover Menang! 🕵️', `Jumlah Undercover kini setara/lebih banyak dari Penduduk!`, () => finishGame());
        } else {
            showModal('Hasil Eliminasi', `${lastEliminated.name} telah dieliminasi! Perannya adalah: ${lastEliminated.role}`, () => renderEliminationList());
        }
    } else if (gameMode === 'spyfall') {
        if (remainingPlayers.length <= 2) {
            showModal('Spy Menang! 🕵️', `Spy berhasil bertahan hingga hanya tersisa 2 pemain!`, () => finishGame());
        } else {
            showModal('Hasil Eliminasi', `${lastEliminated.name} telah dieliminasi! Perannya adalah: ${lastEliminated.role}`, () => renderEliminationList());
        }
    }
}

function finishGame() {
    window.location.href = "finish.html";
}

function newGame() {
    localStorage.clear();
    window.location.href = "index.html";
}