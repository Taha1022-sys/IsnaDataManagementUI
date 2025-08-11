import React, { useState, useEffect } from 'react'
import { excelService } from '../services'
import { API_CONFIG } from '../services/config'
import type { ExcelData, Sheet } from '../types'

interface DataViewerProps {
  selectedFile: string | null
}

const DataViewer: React.FC<DataViewerProps> = ({ selectedFile }) => {
  const [data, setData] = useState<ExcelData[]>([])
  const [sheets, setSheets] = useState<Sheet[]>([])
  const [selectedSheet, setSelectedSheet] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(50)
  const [editingRow, setEditingRow] = useState<number | null>(null)
  const [editData, setEditData] = useState<Record<string, string | number>>({})

  const clearMessages = () => {
    setError(null)
    setSuccess(null)
  }

  // Debug data state changes
  useEffect(() => {
  // ...debug log removed...
  }, [data])

  // selectedSheet state değişimini izle
  useEffect(() => {
  // ...debug log removed...
  }, [selectedSheet])

  // Component ilk yüklendiğinde çalışan debug
  useEffect(() => {
    // ...debug log removed...
    setTimeout(() => {
      // ...debug log removed...
    }, 2000)
  }, [])

  useEffect(() => {
  // ...debug log removed...
    if (selectedFile) {
      // Yeni dosya seçildiğinde selectedSheet'i sıfırla
      setSelectedSheet('')
      fetchSheets()
    }
  }, [selectedFile]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
  // ...debug log removed...
    if (selectedFile && selectedSheet) {
      fetchData()
    }
  }, [selectedFile, selectedSheet, page]) // eslint-disable-line react-hooks/exhaustive-deps

  const fetchSheets = async () => {
    if (!selectedFile) return
    
    setLoading(true)
    clearMessages()
    try {
  // ...debug log removed...
      const response = await excelService.getSheets(selectedFile)
  // ...debug log removed...
      
      if (response.success && response.data) {
  // ...debug log removed...
        
        // Backend string array olarak gönderiyor, Sheet object'e dönüştürelim
        let sheetsArray: Sheet[];
        if (Array.isArray(response.data) && typeof response.data[0] === 'string') {
          // Backend string array gönderiyor
          sheetsArray = (response.data as unknown as string[]).map((sheetName: string) => ({ 
            name: sheetName, 
            rowCount: 0 
          }));
        } else {
          // Backend zaten Sheet array gönderiyor
          sheetsArray = response.data as Sheet[];
        }
        
  // ...debug log removed...
        setSheets(sheetsArray)
        
  // ...debug log removed...
        
        if (sheetsArray.length > 0 && !selectedSheet) {
          // ...debug log removed...
          setSelectedSheet(sheetsArray[0].name)
        } else {
          // ...debug log removed...
        }
  // ...debug log removed...
      } else {
  // ...debug log removed...
        setError(response.message || 'Sayfalar yüklenirken hata oluştu')
      }
    } catch {
      setError('Sayfalar yüklenirken hata oluştu. Backend bağlantısını kontrol edin.')
    } finally {
      setLoading(false)
    }
  }

  const fetchData = async () => {
    if (!selectedFile) {
  // ...debug log removed...
      return
    }
    
    setLoading(true)
    clearMessages()
    try {
  // ...debug log removed...

      // Önce dosyanın işlenmiş olup olmadığını kontrol et
      try {
  // ...debug log removed...
        const readResponse = await excelService.readExcelData(selectedFile, selectedSheet)
  // ...debug log removed...

        if (!readResponse.success) {
          setError(`Dosya işleme hatası: ${readResponse.message || 'Dosya henüz işlenmemiş olabilir'}`)
          return
        }
      } catch (readError) {
        console.error('❌ File read error:', readError)
        setError(`Dosya okuma hatası: ${readError instanceof Error ? readError.message : 'Bilinmeyen hata'} - Dosya henüz işlenmemiş olabilir.`)
        return
      }

  // Sadece 'stok' sheet'i için pageSize=50, diğerleri için mevcut pageSize kullan
  const effectivePageSize = selectedSheet && selectedSheet.toLowerCase() === 'stok' ? 50 : pageSize;
  const response = await excelService.getData(selectedFile, selectedSheet, page, effectivePageSize)
          // ...debug log removed...

      if (response.success) {
        if (response.data && Array.isArray(response.data)) {
          setData(response.data)
          // ...debug log removed...

          if (response.data.length === 0) {
            setError('Bu dosya/sayfa için veri bulunamadı. Dosya henüz işlenmiş olmayabilir.')
          } else {
            setSuccess(`✅ ${response.data.length} satır veri başarıyla yüklendi!`)
          }
        } else {
          // ...debug log removed...
          setError('API yanıtı beklenen formatta değil.')
          setData([])
        }
      } else {
  // ...debug log removed...
        setError(response.message || 'Veri yüklenirken hata oluştu')
        setData([])
      }
    } catch (error) {
  // ...debug log removed...

      if (error instanceof TypeError && error.message.includes('fetch')) {
        setError('Network hatası: Backend servisine bağlanılamıyor. Backend servisi çalışıyor mu?')
      } else if (error instanceof Error) {
        setError(`Veri yüklenirken hata oluştu: ${error.message}`)
      } else {
        setError('Veri yüklenirken bilinmeyen bir hata oluştu.')
      }
      setData([])
    } finally {
      setLoading(false)
    }
  }

  const startEdit = (row: ExcelData) => {
    setEditingRow(row.id)
    setEditData(row.data as Record<string, string | number>)
  }

  const cancelEdit = () => {
    setEditingRow(null)
    setEditData({})
  }

  const saveEdit = async (rowId: number) => {
    setLoading(true)
    clearMessages()
    try {
  // ...debug log removed...
      const response = await excelService.updateData({
        id: rowId,
        data: editData,
        modifiedBy: 'Frontend User' // Bu değeri gerçek kullanıcı bilgisi ile değiştirin
      })
      
  // ...debug log removed...
      if (response.success) {
        setSuccess('Veri başarıyla güncellendi!')
        setEditingRow(null)
        setEditData({})
        fetchData() // Verileri yenile
      } else {
  // ...debug log removed...
        setError('Güncelleme hatası: ' + (response.message || 'Bilinmeyen hata'))
      }
    } catch (error) {
  // ...debug log removed...
      setError('Güncelleme sırasında hata oluştu: ' + (error instanceof Error ? error.message : 'Bilinmeyen hata'))
    } finally {
      setLoading(false)
    }
  }

  const deleteRow = async (rowId: number) => {
    if (!confirm('Bu satırı silmek istediğinizden emin misiniz?')) {
      return
    }

    setLoading(true)
    clearMessages()
    try {
  // ...debug log removed...
      const response = await excelService.deleteData(rowId, 'Frontend User')
      
  // ...debug log removed...
      if (response.success) {
        setSuccess('Satır başarıyla silindi!')
        fetchData() // Verileri yenile
      } else {
  // ...debug log removed...
        setError('Silme işleminde hata oluştu: ' + (response.message || 'Bilinmeyen hata'))
      }
    } catch (error) {
  // ...debug log removed...
      setError('Silme sırasında hata oluştu: ' + (error instanceof Error ? error.message : 'Bilinmeyen hata'))
    } finally {
      setLoading(false)
    }
  }

  const getColumns = () => {
    if (data.length === 0) return []
    return Object.keys(data[0].data)
  }

  const testApiConnection = async () => {
  // ...debug log removed...
    clearMessages()
    
    try {
      // Test backend connectivity
      const testResult = await excelService.testConnection()
  // ...debug log removed...
      
      if (testResult.success) {
        setSuccess('Backend bağlantısı başarılı!')
        
        // If we have a selected file, try to get its data
        if (selectedFile) {
          await fetchSheets()
          if (selectedSheet) {
            await fetchData()
          }
        }
      } else {
        setError('Backend bağlantı testi başarısız: ' + testResult.message)
      }
    } catch (error) {
  // ...debug log removed...
      setError('API bağlantı testi başarısız: ' + (error instanceof Error ? error.message : 'Bilinmeyen hata'))
    }
  }

  // Dosya işleme fonksiyonu
  const processFile = async (fileName: string) => {
    if (!fileName) return
    
    setLoading(true)
    clearMessages()
    
    try {
  // ...debug log removed...
      setSuccess('Dosya işleniyor, lütfen bekleyin...')
      
      const readResponse = await excelService.readExcelData(fileName)
  // ...debug log removed...
      
      if (readResponse.success) {
        setSuccess('✅ Dosya başarıyla işlendi! Sayfalar yükleniyor...')
        await fetchSheets()
      } else {
        setError(`Dosya işleme hatası: ${readResponse.message || 'Bilinmeyen hata'}`)
      }
    } catch (error) {
  // ...debug log removed...
      setError(`Dosya işleme hatası: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`)
    } finally {
      setLoading(false)
    }
  }

  if (!selectedFile) {
    return (
      <div className="data-viewer">
        <h2>Veri Görüntüleme</h2>
        <div className="no-file-selected">
          <p>Lütfen önce Dosya Yönetimi sayfasından bir dosya seçin.</p>
        </div>
      </div>
    )
  }

  if (loading && data.length === 0) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    )
  }

  return (
    <div className="data-viewer">
  {/* DEBUG BANNER REMOVED */}
      
      <h2>Veri Görüntüleme: {selectedFile}</h2>

      
            
      {/* Connection Test Button */}
      <div className="connection-test" style={{ marginBottom: '1rem' }}>
        <button 
          onClick={testApiConnection}
          disabled={loading}
          className="btn btn-info"
          style={{ marginRight: '10px' }}
        >
          🔗 Backend Bağlantısını Test Et
        </button>
        {selectedFile && (
          <>
            <button 
              onClick={() => processFile(selectedFile)}
              disabled={loading}
              className="btn btn-warning"
              style={{ marginRight: '10px' }}
            >
              🔄 Dosyayı Yeniden İşle
            </button>
          </>
        )}
        {!selectedFile && (
          <span style={{ color: '#666', fontSize: '14px' }}>
            Önce Dosya Yönetimi sayfasından bir dosya seçin
          </span>
        )}
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
      
      {/* Debug Panel */}
      <div className="debug-panel" style={{ background: '#f0f0f0', padding: '10px', marginBottom: '1rem', borderRadius: '5px' }}>
        <h4>🔧 Debug Panel</h4>
        <div style={{ marginBottom: '10px' }}>
          <strong>Selected File:</strong> {selectedFile}<br/>
          <strong>Selected Sheet:</strong> {selectedSheet}<br/>
          <strong>Available Sheets:</strong> {sheets.map(s => s.name).join(', ')}<br/>
          <strong>Data Count:</strong> {data.length} rows<br/>
          <strong>Loading:</strong> {loading ? 'Yes' : 'No'}<br/>
          <strong>Backend URL:</strong> {API_CONFIG.BASE_URL}
        </div>
        <div>
          <button 
            onClick={fetchData}
            disabled={loading || !selectedFile || !selectedSheet}
            style={{ marginRight: '10px', padding: '5px 10px', fontSize: '12px' }}
          >
            Force Refresh Data
          </button>
          <button 
            onClick={fetchSheets}
            disabled={loading || !selectedFile}
            style={{ padding: '5px 10px', fontSize: '12px' }}
          >
            Refresh Sheets
          </button>
        </div>
      </div>
      
      {/* Sheet Selection */}
      {sheets.length > 1 && (
        <div className="sheet-selector" style={{ marginBottom: '1rem' }}>
          <label htmlFor="sheet-select">Sayfa Seç: </label>
          <select 
            id="sheet-select"
            value={selectedSheet} 
            onChange={(e) => setSelectedSheet(e.target.value)}
            style={{ padding: '8px', marginLeft: '8px' }}
          >
            {sheets.map((sheet) => (
              <option key={sheet.name} value={sheet.name}>
                {sheet.name} ({sheet.rowCount} satır)
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Data Table */}
      {data.length > 0 ? (
        <div className="data-table">
          <div style={{ marginBottom: '10px', fontSize: '14px', color: '#666' }}>
            Toplam {data.length} satır gösteriliyor (Sayfa {page})
          </div>
          <table>
            <thead>
              <tr>
                <th>Satır</th>
                {getColumns().map((column) => (
                  <th key={column}>{column}</th>
                ))}
                <th>Son Değişiklik</th>
                <th>İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row, index) => (
                <tr key={row.id || index}>
                  <td>{row.rowIndex}</td>
                  {getColumns().map((column) => (
                    <td key={column}>
                      {editingRow === row.id ? (
                        <input
                          type="text"
                          value={editData[column] || ''}
                          onChange={(e) => setEditData({...editData, [column]: e.target.value})}
                          style={{ width: '100%', padding: '4px' }}
                        />
                      ) : (
                        <span title={`${column}: ${String(row.data[column] || '')}`}>
                          {String(row.data[column] || '')}
                        </span>
                      )}
                    </td>
                  ))}
                  <td>
                    {row.modifiedDate ? (
                      <div>
                        <div>{new Date(row.modifiedDate).toLocaleDateString('tr-TR')}</div>
                        <div style={{ fontSize: '0.8rem', color: '#666' }}>
                          {row.modifiedBy || 'Bilinmiyor'}
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div>{new Date(row.createdDate).toLocaleDateString('tr-TR')}</div>
                        <div style={{ fontSize: '0.8rem', color: '#666' }}>Oluşturuldu</div>
                      </div>
                    )}
                  </td>
                  <td>
                    {editingRow === row.id ? (
                      <div>
                        <button 
                          className="btn btn-primary btn-sm"
                          onClick={() => saveEdit(row.id)}
                          disabled={loading}
                          style={{ marginRight: '4px' }}
                        >
                          Kaydet
                        </button>
                        <button 
                          className="btn btn-secondary btn-sm"
                          onClick={cancelEdit}
                        >
                          İptal
                        </button>
                      </div>
                    ) : (
                      <div>
                        <button 
                          className="btn btn-primary btn-sm"
                          onClick={() => startEdit(row)}
                          style={{ marginRight: '4px' }}
                        >
                          Düzenle
                        </button>
                        <button 
                          className="btn btn-danger btn-sm"
                          onClick={() => deleteRow(row.id)}
                          disabled={loading}
                        >
                          Sil
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : !loading && selectedFile && selectedSheet ? (
        <div className="no-data">
          <h3>❌ Veri Bulunamadı</h3>
          <p>Bu dosya/sayfa için veri bulunamadı.</p>
          <div style={{ background: '#fff3cd', border: '1px solid #ffeaa7', borderRadius: '4px', padding: '10px', margin: '10px 0' }}>
            <h4>🔍 Olası Nedenler:</h4>
            <ul>
              <li>Backend servisi çalışmıyor olabilir</li>
              <li>Dosya henüz yüklenmemiş veya işlenmemiş olabilir</li>
              <li>Seçilen sayfa boş olabilir</li>
              <li>Veritabanı bağlantı sorunu olabilir</li>
            </ul>
            <h4>✅ Yapılacaklar:</h4>
            <ul>
              <li>Konsol (F12) log'larını kontrol edin</li>
              <li>Backend servisinin çalıştığından emin olun</li>
              <li>Farklı bir dosya/sayfa deneyin</li>
            </ul>
          </div>
        </div>
      ) : (
        <div className="no-data">
          <p>Veri yüklemek için yukarıdan dosya ve sayfa seçin.</p>
        </div>
      )}

      {/* Pagination */}
      <div className="pagination" style={{ marginTop: '1rem', textAlign: 'center' }}>
        <button 
          className="btn btn-secondary btn-sm"
          onClick={() => setPage(page - 1)}
          disabled={page <= 1 || loading}
          style={{ marginRight: '8px' }}
        >
          Önceki
        </button>
        <span style={{ margin: '0 16px' }}>Sayfa {page}</span>
        <button 
          className="btn btn-secondary btn-sm"
          onClick={() => setPage(page + 1)}
          disabled={data.length < pageSize || loading}
        >
          Sonraki
        </button>
      </div>

      {loading && (
        <div style={{ textAlign: 'center', padding: '1rem' }}>
          <div className="spinner"></div>
        </div>
      )}
    </div>
  )
}

export default DataViewer
