import React, { useState, useEffect } from 'react'
import { excelService } from '../services'
import { API_CONFIG, API_ENDPOINTS } from '../services/config'
import type { ExcelFile } from '../types'

type ActivePage = 'dashboard' | 'files' | 'data' | 'comparison' | 'history'

interface FileManagerProps {
  onFileSelect: (fileName: string) => void
  onNavigate: (page: ActivePage) => void
}

const FileManager: React.FC<FileManagerProps> = ({ onFileSelect, onNavigate }) => {
  const [files, setFiles] = useState<ExcelFile[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploadedBy, setUploadedBy] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [connectionStatus, setConnectionStatus] = useState<'unknown' | 'connected' | 'disconnected'>('unknown')

  useEffect(() => {
    const initializeComponent = async () => {
      await testConnection()
      await fetchFiles()
    }
    initializeComponent()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const clearMessages = () => {
    setError(null)
    setSuccess(null)
  }

  const testConnection = async () => {
    console.log('🔍 Starting connection test...')
    try {
      const response = await excelService.testConnection()
      console.log('📋 Test connection response:', response)
      
      const isConnected = response.success === true
      setConnectionStatus(isConnected ? 'connected' : 'disconnected')
      
      if (!isConnected) {
        setError(`Backend bağlantı testi başarısız: ${response.message || 'Bilinmeyen hata'}`)
      } else {
        console.log('✅ Backend connection successful')
        // Başarılı bağlantıda hata mesajını temizle
        if (error && error.includes('Backend bağlantısı kurulamadı')) {
          setError(null)
        }
      }
    } catch (error) {
      console.error('❌ Connection test error:', error)
      setConnectionStatus('disconnected')
      setError(`Backend bağlantısı kurulamadı: ${error.message || 'Bilinmeyen hata'}`)
    }
  }

  const fetchFiles = async () => {
    setLoading(true)
    clearMessages()
    try {
      const response = await excelService.getFiles()
      if (response.success) {
        setFiles(response.data || [])
      } else {
        setError(response.message || 'Dosyalar yüklenirken hata oluştu')
      }
    } catch (error) {
      console.error('Dosyalar yüklenirken hata:', error)
      setError('Backend bağlantısı kurulamadı. Lütfen backend servisinin çalıştığından emin olun.')
    } finally {
      setLoading(false)
    }
  }

  const validateFile = (file: File): string | null => {
    // Dosya boyutu kontrolü (10MB limit)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      return `Dosya boyutu çok büyük (${(file.size / 1024 / 1024).toFixed(2)}MB). Maximum 10MB desteklenir.`
    }
    
    // Dosya uzantısı kontrolü
    const allowedExtensions = ['.xlsx', '.xls']
    const fileName = file.name.toLowerCase()
    const hasValidExtension = allowedExtensions.some(ext => fileName.endsWith(ext))
    
    if (!hasValidExtension) {
      return `Desteklenmeyen dosya formatı. Lütfen .xlsx veya .xls formatında dosya yükleyin.`
    }
    
    // MIME type kontrolü
    const allowedMimeTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel' // .xls
    ]
    
    if (file.type && !allowedMimeTypes.includes(file.type)) {
      console.warn('⚠️ MIME type not in allowed list:', file.type)
      // MIME type uyarısı ver ama engelme, çünkü bazı sistemlerde farklı olabilir
    }
    
    return null // Geçerli dosya
  }

  const handleFileUpload = async () => {
    if (!selectedFile || !uploadedBy.trim()) {
      setError('Lütfen dosya seçin ve yükleyen kişi bilgisini girin')
      return
    }

    // Dosya validasyonu
    const validationError = validateFile(selectedFile)
    if (validationError) {
      setError(validationError)
      return
    }

    setLoading(true)
    clearMessages()
    try {
      console.log('📤 Starting file upload...', selectedFile.name)
      console.log('📄 File details:', {
        name: selectedFile.name,
        size: selectedFile.size,
        type: selectedFile.type,
        lastModified: new Date(selectedFile.lastModified).toISOString()
      })
      
      // 1. Dosyayı yükle
      const uploadResponse = await excelService.uploadFile(selectedFile, uploadedBy)
      console.log('📋 Upload response:', uploadResponse)
      
      if (!uploadResponse.success) {
        setError(uploadResponse.message || 'Dosya yüklenirken hata oluştu')
        return
      }
      
      setSuccess('Dosya başarıyla yüklendi! Excel verileri işleniyor...')
      
      // 2. Yüklenen dosyanın Excel verilerini işle
      console.log('🔄 Processing Excel data for:', selectedFile.name)
      try {
        const readResponse = await excelService.readExcelData(selectedFile.name)
        console.log('📋 Read Excel response:', readResponse)
        
        if (readResponse.success) {
          setSuccess('Dosya başarıyla yüklendi ve işlendi! Artık veri görüntüleme sayfasında görüntüleyebilirsiniz.')
        } else {
          console.warn('⚠️ Excel processing failed:', readResponse.message)
          setError(`Dosya yüklendi ancak Excel işleme sırasında hata oluştu: ${readResponse.message || 'Bilinmeyen hata'}. 
                   
Muhtemel sebepler:
• Excel dosya formatı desteklenmiyor
• Dosya bozuk veya şifrelenmiş
• Dosyada boş sayfalar var
• Backend'de Excel işleme servisi sorunu yaşıyor

Lütfen farklı bir Excel dosyası deneyin veya mevcut dosyayı yeniden kaydedin.`)
        }
      } catch (readError) {
        console.error('❌ Excel processing error:', readError)
        const errorMessage = readError instanceof Error ? readError.message : 'Bilinmeyen hata'
        
        if (errorMessage.includes('500')) {
          setError(`Dosya yüklendi ancak Excel işleme sırasında sunucu hatası oluştu.
          
Muhtemel sebepler:
• Excel dosyası çok büyük olabilir
• Dosya formatı desteklenmiyor (.xlsx, .xls deneyin)
• Backend servisi Excel dosyayı işleyemiyor
• Database bağlantı sorunu

Lütfen:
1. Dosya boyutunu kontrol edin (max 10MB önerilir)
2. .xlsx formatında kaydedin
3. Backend loglarını kontrol edin
4. Farklı bir Excel dosyası deneyin`)
        } else {
          setError(`Dosya yüklendi ama Excel işleme sırasında hata oluştu: ${errorMessage}
          
Lütfen backend loglarını kontrol edin veya sistem yöneticinize başvurun.`)
        }
      }
      
      setSelectedFile(null)
      setUploadedBy('')
      await fetchFiles() // Dosya listesini yenile
      
    } catch (error) {
      console.error('❌ File upload error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen hata'
      setError(`Dosya yüklenirken hata oluştu: ${errorMessage}
      
Lütfen backend bağlantısını kontrol edin ve tekrar deneyin.`)
    } finally {
      setLoading(false)
    }
  }

  const handleFileSelect = (fileName: string) => {
    console.log('📁 File selected for viewing:', fileName)
    onFileSelect(fileName)
    onNavigate('data')
  }

  const handleReprocessFile = async (fileName: string) => {
    if (!confirm(`"${fileName}" dosyasını yeniden işlemek istediğinizden emin misiniz?`)) {
      return
    }

    setLoading(true)
    clearMessages()
    try {
      console.log('🔄 Reprocessing file:', fileName)
      console.log('📝 Original file name:', fileName)
      console.log('🔗 Encoded file name:', encodeURIComponent(fileName))
      
      // Backend bağlantısını test et
      const connectionTest = await excelService.testConnection()
      if (!connectionTest.success) {
        throw new Error('Backend bağlantısı kurulamadı. Lütfen backend servisinin çalıştığından emin olun.')
      }
      
      const response = await excelService.readExcelData(fileName)
      console.log('📋 Reprocess response:', response)
      
      if (response.success) {
        setSuccess('Dosya başarıyla yeniden işlendi! Artık veri görüntüleme sayfasında görüntüleyebilirsiniz.')
        await fetchFiles() // Dosya listesini yenile
      } else {
        console.error('❌ Reprocess failed:', response.message)
        
        // Daha detaylı hata mesajları
        let errorMessage = response.message || 'Bilinmeyen hata'
        if (errorMessage.includes('500')) {
          errorMessage = `Sunucu hatası: Excel dosyası "${fileName}" işlenirken hata oluştu. Dosya formatını veya içeriğini kontrol edin.`
        } else if (errorMessage.includes('404')) {
          errorMessage = `Dosya bulunamadı: "${fileName}" dosyası sunucuda bulunamıyor.`
        } else if (errorMessage.includes('400')) {
          errorMessage = `Geçersiz dosya: "${fileName}" dosyasının formatı desteklenmiyor veya bozuk.`
        }
        
        setError(`Dosya yeniden işlenirken hata oluştu: ${errorMessage}`)
      }
    } catch (error) {
      console.error('❌ Reprocess error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen hata'
      
      // Network hatalarını özel olarak işle
      if (errorMessage.includes('fetch') || errorMessage.includes('Network')) {
        setError('Backend servisine bağlanılamıyor. Lütfen backend servisinin çalıştığından emin olun.')
      } else if (errorMessage.includes('timeout')) {
        setError('İşlem zaman aşımına uğradı. Dosya çok büyük olabilir veya backend yavaş yanıt veriyor.')
      } else {
        setError(`Dosya yeniden işlenirken hata oluştu: ${errorMessage}`)
      }
    } finally {
      setLoading(false)
    }
  }

  const testFileEndpoint = async (fileName: string) => {
    console.log('🧪 Testing file endpoint for:', fileName)
    try {
      const encodedName = encodeURIComponent(fileName)
      const testUrl = `${API_CONFIG.BASE_URL}/excel/files`
      
      console.log('🔗 Testing files endpoint:', testUrl)
      const filesResponse = await fetch(testUrl)
      console.log('📡 Files endpoint status:', filesResponse.status)
      
      if (filesResponse.ok) {
        const filesData = await filesResponse.json()
        console.log('📋 Available files:', filesData)
        
        const fileExists = filesData.data?.some((f: ExcelFile) => f.fileName === fileName)
        console.log(`📁 File "${fileName}" exists on server:`, fileExists)
        
        if (!fileExists) {
          setError(`Dosya "${fileName}" sunucuda bulunamıyor. Dosyayı yeniden yüklemeniz gerekebilir.`)
          return
        }
      }
      
      // Şimdi read endpoint'ini test et
      const readUrl = `${API_CONFIG.BASE_URL}/excel/read/${encodedName}`
      console.log('🔗 Testing read endpoint:', readUrl)
      
      setSuccess(`Endpoint test edildi. Detaylar için console'u kontrol edin.`)
    } catch (error) {
      console.error('🧪 Test error:', error)
      setError('Endpoint testi başarısız oldu.')
    }
  }

  const handleViewFile = async (fileName: string) => {
    console.log('👁️ Attempting to view file:', fileName)
    
    // Önce dosyanın sheet'lerini kontrol et
    try {
      setLoading(true)
      const sheetsResponse = await excelService.getSheets(fileName)
      console.log('📋 Sheets check response:', sheetsResponse)
      
      if (sheetsResponse.success && sheetsResponse.data && sheetsResponse.data.length > 0) {
        console.log('✅ File has sheets, proceeding to data view')
        handleFileSelect(fileName)
      } else {
        console.warn('⚠️ File has no sheets or failed to load sheets')
        setError(`Dosya "${fileName}" için sayfa bilgisi bulunamadı. Dosya düzgün yüklenmemiş olabilir.`)
        
        // Excel verilerini tekrar işlemeyi dene
        try {
          console.log('🔄 Attempting to reprocess Excel data...')
          const readResponse = await excelService.readExcelData(fileName)
          if (readResponse.success) {
            setSuccess('Dosya yeniden işlendi. Şimdi görüntülemeyi deneyebilirsiniz.')
            setTimeout(() => handleFileSelect(fileName), 1000) // 1 saniye bekle
          } else {
            setError('Dosya yeniden işlenirken hata oluştu: ' + (readResponse.message || 'Bilinmeyen hata'))
          }
        } catch (readError) {
          console.error('❌ Reprocess error:', readError)
          setError('Dosya yeniden işlenirken hata oluştu.')
        }
      }
    } catch (error) {
      console.error('❌ View file error:', error)
      setError('Dosya görüntülenirken hata oluştu: ' + (error instanceof Error ? error.message : 'Bilinmeyen hata'))
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteFile = async (fileName: string) => {
    if (!confirm(`"${fileName}" dosyasını silmek istediğinizden emin misiniz?`)) {
      return
    }

    setLoading(true)
    clearMessages()
    try {
      console.log('🗑️ Attempting to delete file:', fileName)
      const response = await excelService.deleteFile(fileName)
      
      if (response.success) {
        setSuccess('Dosya başarıyla silindi!')
        await fetchFiles()
      } else {
        console.error('❌ Delete response indicates failure:', response)
        setError(response.message || 'Dosya silinirken hata oluştu')
      }
    } catch (error) {
      console.error('❌ Delete file error:', error)
      
      // Hata tipine göre daha spesifik mesajlar
      const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen hata'
      if (errorMessage.includes('404')) {
        setError(`Dosya bulunamadı: "${fileName}". Dosya zaten silinmiş olabilir.`)
      } else if (errorMessage.includes('500')) {
        setError('Sunucu hatası. Backend loglarını kontrol edin.')
      } else if (errorMessage.includes('Backend bağlantısı kurulamadı')) {
        setError('Backend bağlantısı kurulamadı. Servisin çalıştığından emin olun.')
      } else {
        setError(`Dosya silinirken hata oluştu: ${errorMessage}`)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadFile = async (fileName: string) => {
    try {
      // Basit bir download linki oluştur
      const downloadUrl = `${API_CONFIG.BASE_URL}${API_ENDPOINTS.EXCEL.FILES}/${encodeURIComponent(fileName)}/download`
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = fileName
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      console.error('Dosya indirme hatası:', error)
      setError('Dosya indirilemedi')
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  if (loading && files.length === 0) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    )
  }

  return (
    <div className="file-manager">
      <div className="file-manager-header">
        <h2>Dosya Yönetimi</h2>
        <div className="connection-status">
          <span className={`status-indicator ${connectionStatus}`}>
            {connectionStatus === 'connected' ? '🟢' : connectionStatus === 'disconnected' ? '🔴' : '🟡'}
          </span>
          <span className="status-text">
            {connectionStatus === 'connected' 
              ? 'Backend Bağlı' 
              : connectionStatus === 'disconnected' 
              ? 'Backend Bağlantısı Yok' 
              : 'Bağlantı Kontrol Ediliyor'}
          </span>
          <button 
            className="btn btn-sm btn-secondary"
            onClick={testConnection}
            disabled={loading}
          >
            Yeniden Test Et
          </button>
        </div>
      </div>
      
      {/* Error/Success Messages */}
      {error && (
        <div className="alert alert-error">
          {error}
          <button onClick={clearMessages} className="alert-close">×</button>
        </div>
      )}
      {success && (
        <div className="alert alert-success">
          {success}
          <button onClick={clearMessages} className="alert-close">×</button>
        </div>
      )}
      
      {/* File Upload Section */}
      <div className="file-upload-section">
        <h3>Yeni Dosya Yükle</h3>
        <div className="file-upload-info">
          <p>📁 Desteklenen formatlar: .xlsx, .xls</p>
          <p>📏 Maximum dosya boyutu: 10MB</p>
        </div>
        <div className="file-actions">
          <div className="input-group">
            <label htmlFor="file-input">Excel Dosyası:</label>
            <input
              id="file-input"
              type="file"
              accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
              onChange={(e) => {
                const file = e.target.files?.[0] || null
                setSelectedFile(file)
                if (file) {
                  const validationError = validateFile(file)
                  if (validationError) {
                    setError(validationError)
                    setSelectedFile(null)
                    e.target.value = '' // Input'u temizle
                  } else {
                    clearMessages()
                  }
                }
              }}
            />
            {selectedFile && (
              <div className="file-info">
                <small>
                  📄 {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)}MB)
                </small>
              </div>
            )}
          </div>
          <div className="input-group">
            <label htmlFor="uploader-input">Yükleyen Kişi:</label>
            <input
              id="uploader-input"
              type="text"
              placeholder="Yükleyen kişi"
              value={uploadedBy}
              onChange={(e) => setUploadedBy(e.target.value)}
            />
          </div>
          <button 
            className="btn btn-primary"
            onClick={handleFileUpload}
            disabled={loading || !selectedFile || !uploadedBy.trim()}
          >
            {loading ? 'Yükleniyor...' : 'Dosya Yükle'}
          </button>
        </div>
      </div>

      {/* File List */}
      <div className="file-list">
        {files.length === 0 ? (
          <div className="empty-state">
            <p>Henüz yüklenmiş dosya bulunmuyor.</p>
            <p>Yukarıdaki forma ile Excel dosyalarınızı yükleyebilirsiniz.</p>
          </div>
        ) : (
          files.map((file) => (
            <div key={file.fileName} className="file-item">
              <div className="file-name">{file.fileName}</div>
              <div className="file-meta">
                <div>📅 {new Date(file.uploadDate).toLocaleDateString('tr-TR')}</div>
                <div>👤 {file.uploadedBy}</div>
                <div>📊 {formatFileSize(file.size)}</div>
                {file.recordCount && <div>📄 {file.recordCount} kayıt</div>}
              </div>
              <div className="file-actions-inline">
                <button 
                  className="btn btn-primary btn-sm"
                  onClick={() => handleViewFile(file.fileName)}
                  disabled={loading}
                >
                  Görüntüle
                </button>
                <button 
                  className="btn btn-secondary btn-sm"
                  onClick={() => handleReprocessFile(file.fileName)}
                  disabled={loading}
                  title="Excel dosyasını yeniden işle"
                >
                  🔄 Yeniden İşle
                </button>
                <button 
                  className="btn btn-warning btn-sm"
                  onClick={() => testFileEndpoint(file.fileName)}
                  disabled={loading}
                  title="Endpoint'i test et"
                >
                  🧪 Test Et
                </button>
                <button 
                  className="btn btn-secondary btn-sm"
                  onClick={() => handleDownloadFile(file.fileName)}
                >
                  İndir
                </button>
                <button 
                  className="btn btn-danger btn-sm"
                  onClick={() => handleDeleteFile(file.fileName)}
                  disabled={loading}
                >
                  Sil
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {loading && files.length > 0 && (
        <div className="loading-overlay">
          <div className="spinner"></div>
        </div>
      )}
    </div>
  )
}

export default FileManager
