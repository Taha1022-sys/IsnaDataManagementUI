# Development Quick Start Guide

## 🎯 Hızlı Test Adımları

### 1. Backend'i Başlatın

1. Visual Studio'da `C:\Users\taha.teke\Desktop\ISNA DATA MANAGEMENT PROJECT\IDM VS\ExcelDataManagementAPI.sln` dosyasını açın
2. F5 ile projeyi çalıştırın
3. Tarayıcıda https://localhost:7002/swagger adresine giderek API'nin çalıştığını doğrulayın

### 2. Frontend'i Başlatın

Bu dizinde terminal açın ve şu komutları çalıştırın:

```bash
npm install
npm run dev
```

### 3. Test Senaryoları

#### 📱 Dashboard Testi
1. http://localhost:5173 adresine gidin
2. "Bağlantıyı Test Et" butonuna tıklayın
3. Yeşil ✅ durumu görmeli ve backend bağlantısı başarılı olmalı

#### 📁 Dosya Yükleme Testi
1. Sidebar'dan "Dosya Yönetimi"ne tıklayın
2. "Dosya Seç" ile bir Excel dosyası seçin
3. "Yükle" butonuna tıklayın
4. Başarılı yükleme mesajını görmelisiniz

#### 📊 Veri Görüntüleme Testi
1. "Veri Görüntüleme" sekmesine gidin
2. Yüklenen dosyalar listesinden birini seçin
3. Veriler tablo halinde görünmeli
4. Pagination çalışıyor olmalı

## 🔧 Backend CORS Ayarları

Eğer bağlantı sorunu yaşıyorsanız, backend'de `Program.cs` dosyasına bu kodu ekleyin:

```csharp
// Add CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReactApp",
        policy =>
        {
            policy.WithOrigins("http://localhost:5173", "https://localhost:5173")
                  .AllowAnyHeader()
                  .AllowAnyMethod();
        });
});

// ... diğer service registrations

var app = builder.Build();

// Use CORS
app.UseCors("AllowReactApp");
```

## 🐛 Hata Giderme

### Frontend Hataları
- Browser console'u (F12) açın ve hataları kontrol edin
- Network sekmesinde API çağrılarını inceleyin

### Backend Hataları
- Visual Studio Output penceresini kontrol edin
- IIS Express log'larını inceleyin

### SSL Sertifika Sorunu
1. Tarayıcıda https://localhost:7002 adresine gidin
2. "Advanced" > "Proceed to localhost" tıklayın
3. Sertifikayı kabul edin

## 📊 Test Verileri

Uygulama test etmek için örnek Excel dosyaları:

1. **Basit tablo**: Sütunlar: Ad, Soyad, Yaş, Şehir
2. **Ürün listesi**: Ürün Kodu, Ürün Adı, Fiyat, Stok
3. **Müşteri verileri**: Müşteri ID, Firma, Telefon, Email

## ✅ Çalışan Özellikler

- ✅ Backend bağlantı testi
- ✅ Dashboard istatistikleri
- ✅ Dosya yükleme
- ✅ Dosya listesi
- ✅ Veri görüntüleme (temel)
- ✅ Modern UI tasarımı
- ✅ TypeScript tip güvenliği

## 🚧 Geliştirilecek Özellikler

- 🔄 Veri düzenleme
- 🔄 Dosya karşılaştırma
- 🔄 Değişiklik geçmişi
- 🔄 Excel export
- 🔄 Gelişmiş filtreleme

## 📈 Performans İpuçları

- Büyük Excel dosyaları için pagination kullanın
- API timeout sürelerini ayarlayın (şu an 30 saniye)
- Büyük dosyalar için progress bar ekleyin

## 🔍 Debug İpuçları

### API Response'larını Kontrol Etme

Browser console'da:
```javascript
// Test connection
fetch('https://localhost:7002/api/excel/test')
  .then(r => r.json())
  .then(console.log)

// Get files
fetch('https://localhost:7002/api/excel/files')
  .then(r => r.json())
  .then(console.log)
```

### Service Layer Debug

`src/utils/testBackend.ts` dosyasını kullanarak backend testleri çalıştırabilirsiniz.
