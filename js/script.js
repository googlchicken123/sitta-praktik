// js/script.js
// Pastikan js/data.js sudah dimuat dulu di html sebelum file ini

(function(){
  // helper singkat
  function el(id){ return document.getElementById(id); }
  function q(selector){ return document.querySelector(selector); }

  // --- MODAL ---
  (function(){
    const modal = el('modal');
    const modalBody = el('modalBody');
    const closeBtn = el('closeModal');

    function openModal(html){
      if(!modal) return;
      if(modalBody) modalBody.innerHTML = html || '';
      modal.classList.remove('hidden');
      modal.setAttribute('aria-hidden', 'false');
    }
    function closeModal(){
      if(!modal) return;
      modal.classList.add('hidden');
      modal.setAttribute('aria-hidden', 'true');
      if(modalBody) modalBody.innerHTML = '';
    }

    // event delegation untuk link Lupa Sandi / Daftar
    document.addEventListener('click', function(e){
      const t = e.target;
      if(!t) return;

      if (t.id === 'forgotBtn') {
        e.preventDefault();
        openModal('<h3>Lupa Password</h3><p>Silakan hubungi admin SITTA di admin@ut.ac.id untuk me-reset password.</p>');
        return;
      }

      if (t.id === 'registerBtn') {
        e.preventDefault();
        openModal('<h3>Daftar Akun</h3><p>Pembuatan akun dilakukan oleh admin pusat UT. Mohon menghubungi admin@ut.ac.id</p>');
        return;
      }

      if (t.id === 'closeModal') {
        e.preventDefault();
        closeModal();
        return;
      }
    });

    // tutup kalau klik di overlay area luar .modal-content
    if (modal) {
      modal.addEventListener('click', function(e){
        if (e.target === modal) closeModal();
      });
    }

    // tutup dengan ESC
    document.addEventListener('keydown', function(e){
      if (e.key === 'Escape') closeModal();
    });

    
    window.__sitta_modal = { open: openModal, close: closeModal };
  })();

  // --- fungsi login ---
  (function(){
    const loginForm = el('loginForm');
    if (!loginForm) return;

    loginForm.addEventListener('submit', function(e){
      e.preventDefault();
      const email = (el('email') || {}).value || '';
      const pwd = (el('password') || {}).value || '';

      if (!email || !pwd) { alert('Isi email dan password'); return; }

      if (typeof dataPengguna === 'undefined') { alert('Data pengguna tidak tersedia'); return; }

      const user = dataPengguna.find(u => u.email === email && u.password === pwd);
      if (user) {
        localStorage.setItem('sitta_user', JSON.stringify(user));
        window.location.href = 'dashboard.html';
      } else {
        alert('Email atau password salah.');
      }
    });
  })();

  // --- Dashboard (ucapan, user display, logout, stok preview) ---
  (function(){
    const greetLine = el('greetingLine');
    function greetingText(){
      const hour = new Date().getHours();
      if(hour < 12) return 'Selamat Pagi';
      if(hour < 15) return 'Selamat Siang';
      if(hour < 18) return 'Selamat Sore';
      return 'Selamat Malam';
    }
    if (greetLine) greetLine.textContent = greetingText() + ',';

    const userGreeting = el('userGreeting');
    const raw = localStorage.getItem('sitta_user');
    if (userGreeting) {
      if (raw) {
        try {
          const u = JSON.parse(raw);
          userGreeting.innerHTML = '<strong>' + (u.nama || 'Pengguna') + '</strong><div class="muted">' + (u.role || '') + '</div>';
        } catch (err) {
          userGreeting.innerHTML = '<a href="index.html" class="btn">Login</a>';
        }
      } else {
        userGreeting.innerHTML = '<a href="index.html" class="btn">Login</a>';
      }
    }

    const logoutLink = el('logoutLink');
    if (logoutLink) logoutLink.addEventListener('click', function(e){ e.preventDefault(); localStorage.removeItem('sitta_user'); window.location.href = 'index.html'; });

    // stok preview kecil di dashboard
    const preview = el('stokPreview');
    if (preview && typeof dataBahanAjar !== 'undefined') {
      preview.innerHTML = '';
      dataBahanAjar.slice(0,3).forEach(b => {
        const wrap = document.createElement('div');
        wrap.className = 'card';
        wrap.style.display = 'flex';
        wrap.style.gap = '12px';
        wrap.innerHTML = `<img src="${b.cover}" alt="cover" style="width:80px;height:100px;object-fit:cover;border-radius:6px"><div><h4 style="margin:0">${b.namaBarang}</h4><div class="muted">Stok: ${b.stok}</div></div>`;
        preview.appendChild(wrap);
      });
    }
  })();

  // --- tracking ---
  (function(){
    const searchBtn = el('searchDo');
    if (!searchBtn) return;

    searchBtn.addEventListener('click', function(){
      const qv = (el('doInput') || {}).value || '';
      const no = qv.trim();
      const out = el('trackingResult');
      if (out) out.classList.add('hidden');

      if (!no) { alert('Masukkan nomor DO'); return; }
      if (typeof dataTracking === 'undefined') { alert('Data tracking tidak tersedia'); return; }

      const item = dataTracking[no];
      if (!item) { alert('Data DO tidak ditemukan'); return; }

      let html = `<h3>DO: ${item.nomorDO}</h3>`;
      html += `<p><strong>Nama:</strong> ${item.nama}</p>`;
      html += `<p><strong>Status:</strong> ${item.status}</p>`;
      html += `<p><strong>Ekspedisi:</strong> ${item.ekspedisi}</p>`;
      html += `<p><strong>Tanggal Kirim:</strong> ${item.tanggalKirim}</p>`;
      html += `<p><strong>Paket:</strong> ${item.paket}</p>`;
      html += `<p><strong>Total:</strong> ${item.total}</p>`;
      if (Array.isArray(item.perjalanan)) {
        html += '<h4>Riwayat Perjalanan</h4><ul>';
        item.perjalanan.forEach(p => { html += `<li>${p.waktu} — ${p.keterangan}</li>`; });
        html += '</ul>';
      }
      if (out) { out.innerHTML = html; out.classList.remove('hidden'); }
    });
  })();

  // --- stok render tabel & tambah stok ---
  (function(){
    const tableBody = document.querySelector('#stokTable tbody');
    function renderTable(){
      if (!tableBody) return;
      tableBody.innerHTML = '';
      if (typeof dataBahanAjar === 'undefined' || !Array.isArray(dataBahanAjar)) return;
      dataBahanAjar.forEach((b, idx) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${b.kodeLokasi || ''}</td>
          <td>${b.kodeBarang || ''}</td>
          <td>${b.namaBarang || ''}</td>
          <td>${b.edisi || ''}</td>
          <td>${b.stok != null ? b.stok : ''}</td>
          <td><img src="${b.cover || ''}" alt="cover" style="width:60px;height:70px;object-fit:cover"></td>
          <td><button data-index="${idx}" class="btn delete">Hapus</button></td>
        `;
        tableBody.appendChild(tr);
      });

      // handler tambah or hapus
      Array.from(document.querySelectorAll('.btn.delete')).forEach(btn => {
        btn.addEventListener('click', function(){
          const i = parseInt(this.dataset.index, 10);
          if (Number.isInteger(i) && confirm('Hapus item ini?')) {
            dataBahanAjar.splice(i, 1);
            renderTable();
          }
        });
      });
    }

    renderTable();

    const addForm = el('addStokForm');
    if (addForm) {
      addForm.addEventListener('submit', function(e){
        e.preventDefault();
        const kodeLokasi = (el('kodeLokasi') || {}).value || '';
        const kodeBarang = (el('kodeBarang') || {}).value || '';
        const namaBarang = (el('namaBarang') || {}).value || '';
        const edisi = (el('edisi') || {}).value || '';
        const stokVal = parseInt((el('stok') || {}).value, 10);
        const stok = Number.isNaN(stokVal) ? 0 : stokVal;
        const cover = (el('cover') || {}).value || '';

        if (!kodeLokasi || !kodeBarang || !namaBarang) {
          alert('Isi minimal: Kode Lokasi, Kode Barang, Nama Barang'); return;
        }

        const newItem = { kodeLokasi, kodeBarang, namaBarang, edisi, stok, cover };
        if (typeof dataBahanAjar === 'undefined') window.dataBahanAjar = [];
        dataBahanAjar.push(newItem);
        renderTable();
        addForm.reset();
      });
    }
  })();

})(); // akhir IIFE
