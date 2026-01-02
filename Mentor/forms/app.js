// Konfigurasi Bot Telegram
const TELEGRAM_BOT_TOKEN = '7861748870:AAEfsEQdNmrQNcn2nU2UyjxBH91ywo13H6I';
const TELEGRAM_CHAT_ID = '1527947230';

// Struktur HTML Modal
const modalHTML = `
<div class="modal fade" id="checkoutModal" tabindex="-1" aria-labelledby="checkoutModalLabel" aria-hidden="true">
  <div class="modal-dialog">
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title" id="checkoutModalLabel">Checkout</h5>
        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
      </div>
      <div class="modal-body">
        <form id="checkoutForm">
          <div class="mb-3">
            <label for="name" class="form-label">Nama Lengkap</label>
            <input type="text" class="form-control" id="name" required>
          </div>
          <div class="mb-3">
            <label for="email" class="form-label">Email</label>
            <input type="email" class="form-control" id="email" required>
          </div>
          <div class="mb-3">
            <label for="phone" class="form-label">Nomor Telepon</label>
            <input type="tel" class="form-control" id="phone" required>
          </div>
          <div id="orderDetails" class="mb-3">
            <h6>Detail Pesanan:</h6>
            <p id="orderItem"></p>
            <p id="orderPrice"></p>
          </div>
        </form>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Tutup</button>
        <button type="button" class="btn btn-primary" id="confirmCheckout">Konfirmasi Pesanan</button>
      </div>
    </div>
  </div>
</div>
`;

// Tambahkan modal ke dokumen
document.body.insertAdjacentHTML('beforeend', modalHTML);

// Inisialisasi fungsionalitas checkout
class CheckoutManager {
  constructor() {
    this.modal = new bootstrap.Modal(document.getElementById('checkoutModal'));
    this.currentOrder = null;
    this.initializeListeners();
  }

  initializeListeners() {
    // Tombol pesanan makanan
    document.querySelectorAll('.food-order-btn').forEach(button => {
      button.addEventListener('click', (e) => this.handleFoodOrder(e));
    });

    // Tombol pemesanan paket
    document.querySelectorAll('.btn-primary').forEach(button => {
      if (button.textContent.includes('Pesan')) {
        button.addEventListener('click', (e) => this.handlePackageBooking(e));
      }
    });

    // Tombol konfirmasi checkout
    const confirmCheckoutBtn = document.getElementById('confirmCheckout');
    if (confirmCheckoutBtn) {
      confirmCheckoutBtn.addEventListener('click', () => this.handleCheckout());
    }
  }

  handleFoodOrder(event) {
    const card = event.target.closest('.food-card');
    this.currentOrder = {
      type: 'Food',
      item: card.querySelector('.card-title').textContent,
      price: card.querySelector('.package-price').textContent.replace(/[^\d.]/g, '') // Menghapus simbol dan spasi
    };
    this.openModal();
  }

  handlePackageBooking(event) {
    const card = event.target.closest('.card');
    this.currentOrder = {
      type: 'Package',
      item: card.querySelector('.card-title').textContent,
      price: card.querySelector('.package-price').textContent.replace(/[^\d.]/g, '') // Menghapus simbol dan spasi
    };
    this.openModal();
  }

  openModal() {
    document.getElementById('orderItem').textContent = `Item: ${this.currentOrder.item}`;
    document.getElementById('orderPrice').textContent = `Harga: ${this.currentOrder.price}`;
    this.modal.show();
  }

  async handleCheckout() {
    const formData = {
      name: document.getElementById('name').value,
      email: document.getElementById('email').value,
      phone: document.getElementById('phone').value,
      order: this.currentOrder
    };

    if (this.validateForm(formData)) {
      // Kirim data ke server
      await this.sendToServer(formData);
      
      // Kirim pesan ke Telegram
      await this.sendToTelegram(formData);
      
      this.modal.hide();
      this.showSuccessMessage();
    }
  }

  validateForm(formData) {
    if (!formData.name || !formData.email || !formData.phone) {
      alert('Mohon lengkapi semua field yang diperlukan');
      return false;
    }

    // Validasi harga
    if (isNaN(formData.order.price) || formData.order.price <= 0) {
      alert('Harga tidak valid');
      return false;
    }

    return true;
  }

  async sendToServer(formData) {
    const url = 'http://localhost:3000/checkout';  // Ganti dengan URL endpoint backend Anda
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        throw new Error('Failed to send data to server');
      }

      const result = await response.json();
      console.log('Response from server:', result);
    } catch (error) {
      console.error('Error sending to server:', error);
      alert('Terjadi kesalahan saat mengirim data ke server. Silakan coba lagi.');
    }
  }

  async sendToTelegram(formData) {
    const message = this.formatTelegramMessage(formData);
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: TELEGRAM_CHAT_ID,
          text: message,
          parse_mode: 'HTML'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to send message to Telegram');
      }
    } catch (error) {
      console.error('Error sending to Telegram:', error);
      alert('Terjadi kesalahan saat mengirim pesanan. Silakan coba lagi.');
    }
  }

  formatTelegramMessage(formData) {
    return `
🛍️ <b>Pesanan Baru</b>

👤 <b>Informasi Pelanggan:</b>
Nama: ${formData.name}
Email: ${formData.email}
Telepon: ${formData.phone}

📦 <b>Detail Pesanan:</b>
Tipe: ${formData.order.type}
Item: ${formData.order.item}
Harga: ${formData.order.price}

⏰ Waktu: ${new Date().toLocaleString('id-ID')}
    `;
  }

  showSuccessMessage() {
    alert('Pesanan Anda telah berhasil dikirim! Kami akan segera menghubungi Anda.');
  }
}

// Inisialisasi manager checkout saat dokumen siap
document.addEventListener('DOMContentLoaded', () => {
  new CheckoutManager();
});
