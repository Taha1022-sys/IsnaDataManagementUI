# ISNA Data Management Project

Excel verilerini yönetmek, düzenlemek ve karşılaştırmak için geliştirilmiş tam kapsamlı web uygulaması.

## 🏗️ Proje Yapısı

- **Backend**: C# .NET 9.0 Web API (ExcelDataManagementAPI)
- **Frontend**: React + TypeScript + Vite
- **Veritabanı**: SQL Server / LocalDB
- **Excel İşleme**: EPPlus Library

## 🚀 Kurulum ve Çalıştırma

### 1. Backend Hazırlığı

Backend projeniz `C:\Users\taha.teke\Desktop\ISNA DATA MANAGEMENT PROJECT\IDM VS\` dizininde bulunuyor.

1. Visual Studio'da backend projeyi açın
2. NuGet paketlerini restore edin
3. `appsettings.json` dosyasında veritabanı bağlantı stringini kontrol edin
4. Migration'ları çalıştırın (gerekiyorsa):
   ```bash
   dotnet ef database update
   ```
5. Projeyi çalıştırın (F5 veya Ctrl+F5)
   - Backend normalde https://localhost:7002 adresinde çalışacak

### 2. Frontend Çalıştırma

Bu dizinde (IDM VSC):

```bash
# Bağımlılıkları yükle
npm install

# Development server başlat
npm run dev
```

Frontend http://localhost:5173 adresinde çalışacak.

### 3. CORS Ayarları

Backend'de CORS ayarlarının yapılandırılması gerekebilir. `Program.cs` veya `Startup.cs` dosyasında:

```csharp
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReactApp",
        policy =>
        {
            policy.WithOrigins("http://localhost:5173")
                  .AllowAnyHeader()
                  .AllowAnyMethod();
        });
});

// ...

app.UseCors("AllowReactApp");
```

## 🔧 Özellikler

### 📁 Dosya Yönetimi
- Excel dosyası yükleme (.xlsx, .xls)
- Dosya listesi görüntüleme
- Dosya boyutu ve yükleme tarihi bilgileri
- Dosya silme işlemleri

### 📊 Veri Görüntüleme
- Excel verilerini tablo halinde görüntüleme
- Sayfalama desteği
- Satır bazında düzenleme
- Yeni satır ekleme
- Satır silme işlemleri
- Sheet (çalışma sayfası) seçimi

### 🔍 Veri Karşılaştırma
- İki farklı Excel dosyasını karşılaştırma
- Aynı dosyanın farklı versiyonlarını karşılaştırma
- Farklılıkları görsel olarak gösterme
- Karşılaştırma raporları oluşturma

### 📈 Değişiklik Geçmişi
- Tüm veri değişikliklerini takip etme
- Kullanıcı bazında değişiklik geçmişi
- Tarih filtreleme
- Değişiklik detayları görüntüleme

## 🛠️ Teknik Detaylar

### Backend API Endpoints

- `GET /api/excel/files` - Dosya listesi
- `POST /api/excel/upload` - Dosya yükleme
- `GET /api/excel/data/{fileName}` - Veri görüntüleme
- `PUT /api/excel/data` - Veri güncelleme
- `POST /api/excel/data` - Yeni satır ekleme
- `DELETE /api/excel/data/{id}` - Satır silme
- `POST /api/comparison/compare` - Dosya karşılaştırma
- `GET /api/history/changes` - Değişiklik geçmişi

### Frontend Bileşenleri

- **Dashboard**: Ana sayfa ve istatistikler
- **FileManager**: Dosya yükleme ve yönetimi
- **DataViewer**: Veri görüntüleme ve düzenleme
- **DataComparison**: Dosya karşılaştırma
- **ChangeHistory**: Değişiklik geçmişi

### TypeScript Types

Tüm API response'ları ve veri yapıları `src/types/index.ts` dosyasında tanımlanmış.

## 🧪 Test Etme

1. Uygulamayı başlattıktan sonra Dashboard'da "Bağlantıyı Test Et" butonuna tıklayın
2. Backend bağlantısı başarılı olursa yeşil ✅ göreceksiniz
3. Bağlantı başarısızsa kırmızı ❌ ve hata mesajları göreceksiniz

## 🔨 Geliştirme

### Yeni Özellik Ekleme

1. Backend'de gerekli API endpoint'leri ekleyin
2. `src/services/` dizininde service method'larını güncelleyin
3. `src/types/index.ts` dosyasında TypeScript tiplerini tanımlayın
4. Component'lerde UI'ı implement edin

### Build ve Dağıtım

```bash
# Production build
npm run build

# Build'i preview et
npm run preview
```

## 📋 TODO

- [ ] Authentication/Authorization sistemi
- [ ] Dosya boyutu limitleri
- [ ] Excel şema validasyonu
- [ ] Bulk veri import/export
- [ ] Gelişmiş filtreleme ve arama
- [ ] Real-time bildirimler
- [ ] Audit logging

## 🐛 Sorun Giderme

### Backend Bağlantı Sorunları

1. Backend'in çalıştığından emin olun
2. CORS ayarlarını kontrol edin
3. Firewall/antivirus yazılımları kontrol edin
4. SSL sertifika sorunları için tarayıcıda https://localhost:7002 adresine gidin

### Excel Dosya Sorunları

1. Dosya formatının .xlsx veya .xls olduğundan emin olun
2. Dosyanın corrupt olmadığını kontrol edin
3. Dosya boyutunun backend limitlerini aşmadığını kontrol edin

## 📞 Destek

Herhangi bir sorun yaşadığınızda:
1. Browser console'da hata mesajlarını kontrol edin
2. Backend log'larını inceleyin
3. Network tab'da API çağrılarını kontrol edin

---

## React + TypeScript + Vite Template Info

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      ...tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      ...tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      ...tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
