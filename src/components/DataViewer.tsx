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
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [sortBy, setSortBy] = useState<'rowIndex' | 'id' | string>('rowIndex')

  // Debug: selectedFile değişimini logla
  useEffect(() => {
    console.log('🎯 DataViewer selectedFile changed:', selectedFile)
  }, [selectedFile])

  // Debug: selectedSheet değişimini logla
  useEffect(() => {
    console.log('📄 DataViewer selectedSheet changed:', selectedSheet)
  }, [selectedSheet])

  const clearMessages = () => {
    setError(null)
    setSuccess(null)
  }

  // Veri sıralama fonksiyonu
  const sortData = (data: ExcelData[], sortBy: string, sortOrder: 'asc' | 'desc'): ExcelData[] => {
    return [...data].sort((a, b) => {
      let aValue: any
      let bValue: any

      if (sortBy === 'rowIndex') {
        aValue = a.rowIndex
        bValue = b.rowIndex
      } else if (sortBy === 'id') {
        aValue = a.id
        bValue = b.id
      } else if (sortBy === 'createdDate') {
        aValue = new Date(a.createdDate).getTime()
        bValue = new Date(b.createdDate).getTime()
      } else if (sortBy === 'modifiedDate') {
        aValue = a.modifiedDate ? new Date(a.modifiedDate).getTime() : 0
        bValue = b.modifiedDate ? new Date(b.modifiedDate).getTime() : 0
      } else {
        // Data sütunlarına göre sıralama
        aValue = a.data[sortBy] || ''
        bValue = b.data[sortBy] || ''
      }

      // String karşılaştırması için
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        aValue = aValue.toLowerCase()
        bValue = bValue.toLowerCase()
      }

      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0
      }
    })
  }

  // Sıralı veriyi al
  const getSortedData = (): ExcelData[] => {
    return sortData(data, sortBy, sortOrder)
  }

  const debugDataFetch = async () => {
    if (!selectedFile) {
      setError('Seçili dosya yok!')
      return
    }

    console.log('🐞 Starting data fetch debug...')
    console.log('📁 Selected file:', selectedFile)
    console.log('📄 Selected sheet:', selectedSheet)
    
    setLoading(true)
    clearMessages()
  
    try {
      // 1. Backend bağlantısını test et
      console.log('🔗 Testing backend connection...')
      const connectionTest = await excelService.testConnection()
      console.log('📋 Connection test result:', connectionTest)
      
      if (!connectionTest.success) {
        setError('Backend bağlantısı başarısız: ' + connectionTest.message)
        return
      }

      // 2. Dosyanın var olup olmadığını kontrol et
      console.log('📁 Checking if file exists...')
      const filesResponse = await excelService.getFiles()
      console.log('📋 Files response:', filesResponse)
      
      if (filesResponse.success && filesResponse.data) {
        const fileExists = filesResponse.data.some(f => f.fileName === selectedFile)
        console.log('📁 File exists on server:', fileExists)
        
        if (!fileExists) {
          setError(`Dosya "${selectedFile}" sunucuda bulunamadı. Dosyayı yeniden yüklemeniz gerekebilir.`)
          return
        }
      }

      // 3. Sayfaları kontrol et
      console.log('📄 Checking sheets...')
      const sheetsResponse = await excelService.getSheets(selectedFile)
      console.log('📋 Sheets response:', sheetsResponse)
      
      if (!sheetsResponse.success || !sheetsResponse.data || sheetsResponse.data.length === 0) {
        setError(`Dosya "${selectedFile}" için sayfa bilgisi bulunamadı. Dosya düzgün işlenmemiş olabilir.`)
        
        // Excel dosyasını yeniden işlemeyi dene
        console.log('🔄 Attempting to reprocess file...')
        const reprocessResponse = await excelService.readExcelData(selectedFile)
        console.log('📋 Reprocess response:', reprocessResponse)
        
        if (reprocessResponse.success) {
          setSuccess('Dosya yeniden işlendi. Sayfayı yenileyin.')
          // Sayfaları tekrar kontrol et
          setTimeout(() => fetchSheets(), 2000)
        } else {
          setError('Dosya yeniden işlenirken hata: ' + reprocessResponse.message)
        }
        return
      }

      // 4. Veri çekmeyi dene
      console.log('📊 Attempting to fetch data...')
      const dataResponse = await excelService.getData(selectedFile, selectedSheet, 1, 50)
      console.log('📋 Data response:', dataResponse)
      
      if (dataResponse.success) {
        if (dataResponse.data && dataResponse.data.length > 0) {
          setSuccess(`Veri başarıyla alındı: ${dataResponse.data.length} kayıt`)
          setData(dataResponse.data)
        } else {
          setError('Veri alındı ama kayıt bulunamadı. Seçili sayfa boş olabilir.')
        }
      } else {
        setError('Veri alınamadı: ' + dataResponse.message)
      }

    } catch (error) {
      console.error('🐞 Debug error:', error)
      setError('Debug işlemi sırasında hata: ' + (error instanceof Error ? error.message : 'Bilinmeyen hata'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    console.log('🎯 DataViewer useEffect - selectedFile changed:', selectedFile)
    if (selectedFile) {
      // Reset state when file changes
      setSheets([])
      setSelectedSheet('')
      setData([])
      setError(null)
      
      // Start loading process
      fetchSheets()
    } else {
      // Clear everything when no file selected
      setSheets([])
      setSelectedSheet('')
      setData([])
      setError(null)
    }
  }, [selectedFile]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (selectedFile && selectedSheet) {
      fetchData()
    }
  }, [selectedFile, selectedSheet, page]) // eslint-disable-line react-hooks/exhaustive-deps

  const fetchSheets = async () => {
    if (!selectedFile) return
    
    setLoading(true)
    clearMessages()
    try {
      console.log('🔍 Fetching sheets for file:', selectedFile)
      const response = await excelService.getSheets(selectedFile)
      console.log('📋 Sheets response:', response)
      
      if (response.success && response.data) {
        setSheets(response.data)
        if (response.data.length > 0) {
          const firstSheet = response.data[0].name
          console.log('📄 Auto-selecting first sheet:', firstSheet)
          setSelectedSheet(firstSheet)
          
          // Immediately try to fetch data for the first sheet
          setTimeout(() => {
            console.log('🔄 Auto-triggering data fetch for first sheet')
            fetchData()
          }, 100)
        }
        console.log('✅ Sheets loaded successfully:', response.data.length)
      } else {
        console.error('❌ Failed to load sheets:', response.message)
        setError(response.message || 'Sayfalar yüklenirken hata oluştu')
      }
    } catch (error) {
      console.error('❌ Error fetching sheets:', error)
      setError('Sayfalar yüklenirken hata oluştu. Backend bağlantısını kontrol edin.')
    } finally {
      setLoading(false)
    }
  }

  const fetchData = async () => {
    if (!selectedFile || !selectedSheet) {
      console.warn('⚠️ Cannot fetch data: missing file or sheet')
      console.log('   - selectedFile:', selectedFile)
      console.log('   - selectedSheet:', selectedSheet)
      return
    }
    
    setLoading(true)
    clearMessages()
    try {
      console.log('🔍 Fetching data for:', { selectedFile, selectedSheet, page, pageSize })
      
      // Dosya adını temizle (çift uzantı problemi)
      let cleanFileName = selectedFile
      if (cleanFileName.endsWith('.xlsx.xlsx')) {
        cleanFileName = cleanFileName.replace('.xlsx.xlsx', '.xlsx')
        console.log('🧹 Cleaned filename in fetchData:', cleanFileName)
      }
      if (cleanFileName.endsWith('.xls.xls')) {
        cleanFileName = cleanFileName.replace('.xls.xls', '.xls')
        console.log('🧹 Cleaned filename in fetchData:', cleanFileName)
      }
      
      // Safe encode dosya ve sayfa adı
      const encodedFileName = encodeURIComponent(cleanFileName)
      const encodedSheetName = encodeURIComponent(selectedSheet)
      
      // Test the URL that will be called
      const testUrl = `${API_CONFIG.BASE_URL}/excel/data/${encodedFileName}?page=${page}&pageSize=${pageSize}&sheetName=${encodedSheetName}`
      console.log('🔗 Full API URL:', testUrl)
      console.log('🔗 Encoded file name:', encodedFileName)
      console.log('🔗 Encoded sheet name:', encodedSheetName)
      
      // Önce dosyanın backend'de var olup olmadığını kontrol et
      console.log('📁 Checking if file exists on backend...')
      const filesCheck = await excelService.getFiles()
      if (filesCheck.success && filesCheck.data) {
        const fileExists = filesCheck.data.some(f => f.fileName === cleanFileName)
        console.log('� File exists on backend:', fileExists)
        
        if (!fileExists) {
          setError(`Dosya "${selectedFile}" backend'de bulunamadı. Dosyayı yeniden yüklemeniz gerekebilir.`)
          return
        }
      }
      
      const response = await excelService.getData(cleanFileName, selectedSheet, page, pageSize)
      console.log('📋 Data response:', response)
      console.log('📋 Response success:', response.success)
      console.log('📋 Response data type:', typeof response.data)
      console.log('📋 Response data is array:', Array.isArray(response.data))
      console.log('📋 Response data length:', response.data ? response.data.length : 'undefined')
      console.log('📋 Response message:', response.message)
      console.log('📋 Full response object:', JSON.stringify(response, null, 2))
      
      if (response.success) {
        if (response.data && Array.isArray(response.data)) {
          // Veriyi sırala (rowIndex'e göre ascending)
          const sortedData = sortData(response.data, 'rowIndex', 'asc')
          setData(sortedData)
          console.log('✅ Data loaded and sorted successfully:', sortedData.length, 'rows')
          console.log('📊 First few rows:', sortedData.slice(0, 3).map(r => ({ id: r.id, rowIndex: r.rowIndex })))
          
          if (response.data.length === 0) {
            // Check if this is a "file not read" case
            if (response.message && response.message.includes('okunmamış')) {
              console.log('📖 File found but not read. Attempting auto-read...')
              
              if (response.suggestedActions && response.suggestedActions.readFile) {
                try {
                  console.log('🔄 Auto-reading file using:', response.suggestedActions.readFile)
                  const readResponse = await fetch(`${API_CONFIG.BASE_URL}${response.suggestedActions.readFile}`, {
                    method: 'POST'
                  })
                  
                  if (readResponse.ok) {
                    const readResult = await readResponse.json()
                    console.log('📖 Auto-read result:', readResult)
                    
                    if (readResult.success) {
                      setSuccess('Dosya otomatik olarak okundu. Veri yeniden yükleniyor...')
                      
                      // Wait a bit then retry fetching data
                      setTimeout(async () => {
                        console.log('🔄 Retrying data fetch after auto-read...')
                        await fetchData()
                      }, 1000)
                      return
                    } else {
                      setError(`Dosya otomatik okuma başarısız: ${readResult.message}`)
                    }
                  } else {
                    const readError = await readResponse.text()
                    setError(`Dosya okuma API hatası: ${readResponse.status} - ${readError}`)
                  }
                } catch (readErr) {
                  console.error('💥 Auto-read error:', readErr)
                  setError('Dosya otomatik okuma hatası: ' + (readErr instanceof Error ? readErr.message : 'Bilinmeyen hata'))
                }
              } else {
                setError('Bu dosya henüz okunmamış. Dosya Yönetimi sayfasından "Yeniden İşle" butonunu kullanın.')
              }
            } else {
              setError('Bu dosya/sayfa için veri bulunamadı. Dosyanın doğru yüklendiğinden ve işlendiğinden emin olun.')
              
              // Additional debugging - try to fetch without sheet filter
              console.log('🔍 Trying to fetch data without sheet filter...')
              try {
                const responseNoSheet = await excelService.getData(selectedFile, undefined, page, pageSize)
                console.log('📋 Data response (no sheet filter):', responseNoSheet)
                
                if (responseNoSheet.success && responseNoSheet.data && responseNoSheet.data.length > 0) {
                  setError(`Seçili sayfa "${selectedSheet}" boş. ${responseNoSheet.data.length} kayıt bulunan diğer sayfalar var.`)
                }
              } catch (err) {
                console.log('❌ Error fetching without sheet filter:', err)
              }
            }
          } else {
            // Başarılı veri yükleme durumunda hata mesajını temizle
            setError(null)
          }
        } else {
          console.error('❌ Response data is not an array:', response.data)
          setError('Veri formatı hatalı. Response data array değil.')
          setData([])
        }
      } else {
        console.error('❌ Failed to load data:', response.message)
        
        // 404 hatası özel kontrolü
        if (response.message && response.message.includes('404')) {
          setError(`Dosya veya sayfa bulunamadı: "${selectedFile}" - "${selectedSheet}". Dosyayı yeniden işlemeniz gerekebilir.`)
        } else {
          setError(response.message || 'Veri yüklenirken hata oluştu')
        }
        setData([])
        
        // Try to get more info about the error
        console.log('🔍 Debugging failed response...')
        console.log('   - selectedFile:', selectedFile)
        console.log('   - selectedSheet:', selectedSheet)
        console.log('   - response.success:', response.success)
        console.log('   - response.data:', response.data)
        console.log('   - response.message:', response.message)
        
        // Özellikle dosya işlenmemiş hatası için kontrol
        if (response.message && (
          response.message.includes('processed') || 
          response.message.includes('işlenmemiş') ||
          response.message.includes('not found') ||
          response.message.includes('bulunamadı')
        )) {
          setError(response.message + ' "Yeniden İşle" butonunu kullanarak dosyayı tekrar işlemeyi deneyin.')
        }
      }
    } catch (error) {
      console.error('❌ Error fetching data:', error)
      const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen hata'
      
      // Network hata kontrolü
      if (errorMessage.includes('fetch') || errorMessage.includes('Failed to fetch')) {
        setError('Backend servisine bağlanılamıyor. Backend\'in çalıştığından emin olun.')
      } else {
        setError('Veri yüklenirken hata oluştu: ' + errorMessage)
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
      console.log('💾 Saving edit for row:', rowId, editData)
      const response = await excelService.updateData({
        id: rowId,
        data: editData,
        modifiedBy: 'Frontend User' // Bu değeri gerçek kullanıcı bilgisi ile değiştirin
      })
      
      console.log('📋 Update response:', response)
      if (response.success) {
        setSuccess('Veri başarıyla güncellendi!')
        setEditingRow(null)
        setEditData({})
        fetchData() // Verileri yenile
      } else {
        console.error('❌ Update failed:', response.message)
        setError('Güncelleme hatası: ' + (response.message || 'Bilinmeyen hata'))
      }
    } catch (error) {
      console.error('❌ Update error:', error)
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
      console.log('🗑️ Deleting row:', rowId)
      const response = await excelService.deleteData(rowId, 'Frontend User')
      
      console.log('📋 Delete response:', response)
      if (response.success) {
        setSuccess('Satır başarıyla silindi!')
        fetchData() // Verileri yenile
      } else {
        console.error('❌ Delete failed:', response.message)
        setError('Silme işleminde hata oluştu: ' + (response.message || 'Bilinmeyen hata'))
      }
    } catch (error) {
      console.error('❌ Delete error:', error)
      setError('Silme sırasında hata oluştu: ' + (error instanceof Error ? error.message : 'Bilinmeyen hata'))
    } finally {
      setLoading(false)
    }
  }

  const getColumns = () => {
    if (data.length === 0) return []
    return Object.keys(data[0].data)
  }

  // Sıralama değiştirme fonksiyonu
  const handleSort = (column: string) => {
    if (sortBy === column) {
      // Aynı sütun - sıralama yönünü değiştir
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      // Farklı sütun - yeni sütun için ascending başlat
      setSortBy(column)
      setSortOrder('asc')
    }
    
    // Veriyi yeniden sırala
    const sortedData = sortData(data, column, sortBy === column ? (sortOrder === 'asc' ? 'desc' : 'asc') : 'asc')
    setData(sortedData)
    console.log('🔄 Data re-sorted by:', column, sortBy === column ? (sortOrder === 'asc' ? 'desc' : 'asc') : 'asc')
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
      <h2>Veri Görüntüleme: {selectedFile}</h2>
      
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
      <div className="debug-panel">
        <h4>🔧 Debug Panel</h4>
        <div className="debug-info">
          <strong>Selected File:</strong> {selectedFile}<br/>
          <strong>Selected Sheet:</strong> {selectedSheet}<br/>
          <strong>Available Sheets:</strong> {sheets.map(s => s.name).join(', ')}<br/>
          <strong>Data Count:</strong> {data.length} rows
        </div>
        <div className="debug-actions">
          <button 
            onClick={debugDataFetch}
            disabled={loading}
            className="btn btn-warning btn-sm"
          >
            🐞 Tam Diagnoz
          </button>
          <button 
            onClick={async () => {
              console.log('🧪 Testing API endpoints...')
              try {
                // Test files endpoint
                const filesResponse = await fetch(`${API_CONFIG.BASE_URL}/excel/files`)
                console.log('📁 Files endpoint:', filesResponse.status, await filesResponse.json())
                
                // Test specific file data endpoint 
                if (selectedFile) {
                  const encodedFileName = encodeURIComponent(selectedFile)
                  const dataUrl = `${API_CONFIG.BASE_URL}/excel/data/${encodedFileName}`
                  console.log('🔗 Testing data URL (no params):', dataUrl)
                  
                  const dataResponse = await fetch(dataUrl)
                  console.log('📊 Data endpoint (no params):', dataResponse.status, dataResponse.ok)
                  
                  if (dataResponse.ok) {
                    const dataResult = await dataResponse.json()
                    console.log('📋 Data result (no params):', dataResult)
                    console.log('📋 Raw data result:', JSON.stringify(dataResult, null, 2))
                  } else {
                    const errorText = await dataResponse.text()
                    console.log('❌ Data error (no params):', errorText)
                  }
                  
                  // Test with sheet name if available
                  if (selectedSheet) {
                    const encodedSheetName = encodeURIComponent(selectedSheet)
                    const fullDataUrl = `${dataUrl}?page=1&pageSize=10&sheetName=${encodedSheetName}`
                    console.log('🔗 Testing full data URL:', fullDataUrl)
                    
                    const fullDataResponse = await fetch(fullDataUrl)
                    console.log('📊 Full data endpoint:', fullDataResponse.status, fullDataResponse.ok)
                    
                    if (fullDataResponse.ok) {
                      const fullDataResult = await fullDataResponse.json()
                      console.log('📋 Full data result:', fullDataResult)
                      console.log('📋 Raw full data result:', JSON.stringify(fullDataResult, null, 2))
                    } else {
                      const fullErrorText = await fullDataResponse.text()
                      console.log('❌ Full data error:', fullErrorText)
                    }
                  }
                  
                  // Test without any query parameters for debugging
                  const simpleDataUrl = `${API_CONFIG.BASE_URL}/excel/data/${encodedFileName}?page=1&pageSize=10`
                  console.log('🔗 Testing simple data URL:', simpleDataUrl)
                  
                  const simpleDataResponse = await fetch(simpleDataUrl)
                  console.log('📊 Simple data endpoint:', simpleDataResponse.status, simpleDataResponse.ok)
                  
                  if (simpleDataResponse.ok) {
                    const simpleDataResult = await simpleDataResponse.json()
                    console.log('📋 Simple data result:', simpleDataResult)
                    console.log('📋 Raw simple data result:', JSON.stringify(simpleDataResult, null, 2))
                  } else {
                    const simpleErrorText = await simpleDataResponse.text()
                    console.log('❌ Simple data error:', simpleErrorText)
                  }
                }
              } catch (err) {
                console.log('💥 Test error:', err)
              }
            }}
            disabled={loading}
            className="btn btn-info btn-sm"
          >
            🧪 Test API
          </button>
          <button 
            onClick={() => {
              console.log('🔍 Current state:', {
                selectedFile,
                selectedSheet,
                sheets,
                data: data.length,
                page,
                pageSize
              })
            }}
            className="btn btn-secondary btn-sm"
          >
            📋 Log State
          </button>
          <button 
            onClick={async () => {
              console.log('🔧 API Direct Test başlatılıyor...')
              
              if (!selectedFile) {
                setError('Lütfen önce bir dosya seçin')
                return
              }
              
              // Dosya adını temizle
              let cleanFileName = selectedFile
              if (cleanFileName.endsWith('.xlsx.xlsx')) {
                cleanFileName = cleanFileName.replace('.xlsx.xlsx', '.xlsx')
              }
              if (cleanFileName.endsWith('.xls.xls')) {
                cleanFileName = cleanFileName.replace('.xls.xls', '.xls')
              }
              
              try {
                // 1. Swagger'daki gibi direkt endpoint test et
                const directUrl = `${API_CONFIG.BASE_URL}/excel/data/${encodeURIComponent(cleanFileName)}?page=1&pageSize=10`
                console.log('🔗 Direct API URL:', directUrl)
                
                const directResponse = await fetch(directUrl)
                console.log('📡 Direct response status:', directResponse.status)
                console.log('📡 Direct response ok:', directResponse.ok)
                
                if (directResponse.ok) {
                  const directResult = await directResponse.json()
                  console.log('📦 Direct API result:', directResult)
                  
                  if (directResult.success && directResult.data && directResult.data.length > 0) {
                    setSuccess(`✅ API direkt testi başarılı! ${directResult.data.length} kayıt bulundu. 
                    
Veri örneği: ${JSON.stringify(directResult.data[0], null, 2)}`)
                    
                    // Veriyi set et
                    const sortedData = sortData(directResult.data, 'rowIndex', 'asc')
                    setData(sortedData)
                    
                    // Sayfayı set et (eğer yoksa)
                    if (!selectedSheet && directResult.availableSheets && directResult.availableSheets.length > 0) {
                      setSelectedSheet(directResult.availableSheets[0])
                    }
                  } else {
                    setError(`⚠️ API yanıt verdi ama veri yok:
                    
Success: ${directResult.success}
Message: ${directResult.message}
Data length: ${directResult.data ? directResult.data.length : 'null'}`)
                  }
                } else {
                  const errorText = await directResponse.text()
                  setError(`❌ API testi başarısız:

Status: ${directResponse.status}
Error: ${errorText}

URL: ${directUrl}`)
                }
                
              } catch (err) {
                console.error('💥 Direct API test error:', err)
                setError('API test hatası: ' + (err instanceof Error ? err.message : 'Bilinmeyen hata'))
              }
            }}
            disabled={loading || !selectedFile}
            className="btn btn-danger btn-sm"
          >
            � API Test
          </button>
          <button 
            onClick={async () => {
              console.log('📊 Veri Yükle butonuna tıklandı')
              
              if (!selectedFile) {
                setError('Lütfen önce bir dosya seçin')
                return
              }
              
              setLoading(true)
              clearMessages()
              
              try {
                // 1. Önce sayfaları kontrol et/yükle
                if (sheets.length === 0) {
                  console.log('📄 Sayfalar yok, önce sayfaları yüklüyorum')
                  await fetchSheets()
                  
                  // Sayfalar yüklendikten sonra tekrar kontrol et
                  if (sheets.length === 0) {
                    setError('Bu dosya için sayfa bulunamadı')
                    return
                  }
                }
                
                // 2. Sayfa seçimi yap
                let targetSheet = selectedSheet
                if (!targetSheet && sheets.length > 0) {
                  targetSheet = sheets[0].name
                  console.log('📄 İlk sayfa otomatik seçildi:', targetSheet)
                  setSelectedSheet(targetSheet)
                }
                
                if (!targetSheet) {
                  setError('Sayfa seçilemedi')
                  return
                }
                
                // 3. Veriyi yükle
                console.log('📊 Veri yükleniyor:', { selectedFile, targetSheet })
                
                // Dosya adını temizle (çift uzantı problemi)
                let cleanFileName = selectedFile
                if (cleanFileName.endsWith('.xlsx.xlsx')) {
                  cleanFileName = cleanFileName.replace('.xlsx.xlsx', '.xlsx')
                  console.log('🧹 Cleaned filename:', cleanFileName)
                }
                if (cleanFileName.endsWith('.xls.xls')) {
                  cleanFileName = cleanFileName.replace('.xls.xls', '.xls')
                  console.log('🧹 Cleaned filename:', cleanFileName)
                }
                
                const response = await excelService.getData(cleanFileName, targetSheet, page, pageSize)
                console.log('📋 Veri yükleme sonucu:', response)
                
                if (response.success && response.data) {
                  const sortedData = sortData(response.data, 'rowIndex', 'asc')
                  setData(sortedData)
                  setSuccess(`✅ ${sortedData.length} kayıt başarıyla yüklendi`)
                  console.log('✅ Veri başarıyla yüklendi:', sortedData.length, 'kayıt')
                } else {
                  console.error('❌ Veri yükleme başarısız:', response.message)
                  setError(response.message || 'Veri yüklenemedi')
                }
                
              } catch (error) {
                console.error('💥 Veri yükleme hatası:', error)
                setError('Veri yükleme sırasında hata oluştu: ' + (error instanceof Error ? error.message : 'Bilinmeyen hata'))
              } finally {
                setLoading(false)
              }
            }}
            disabled={loading || !selectedFile}
            className="btn btn-success btn-sm"
          >
            📊 Veri Yükle
          </button>
          <button 
            onClick={async () => {
              if (!selectedFile) {
                setError('Lütfen önce bir dosya seçin')
                return
              }
              
              console.log('🏗️ Testing raw backend endpoints...')
              const encodedFileName = encodeURIComponent(selectedFile)
              
              try {
                // Test 1: Files list
                console.log('📂 Test 1: Files list')
                const filesRes = await fetch(`${API_CONFIG.BASE_URL}/excel/files`)
                const filesData = await filesRes.json()
                console.log('📂 Files response:', filesData)
                
                // Test 2: File exists check
                const fileExists = filesData.success && filesData.data && 
                  filesData.data.some((f: {fileName: string}) => f.fileName === selectedFile)
                console.log('📂 File exists in backend:', fileExists)
                
                if (!fileExists) {
                  setError(`Dosya "${selectedFile}" backend'de bulunamadı`)
                  return
                }
                
                // Test 3: Sheets for file
                console.log('📄 Test 3: Sheets for file')
                const sheetsRes = await fetch(`${API_CONFIG.BASE_URL}/excel/sheets/${encodedFileName}`)
                const sheetsData = await sheetsRes.json()
                console.log('📄 Sheets response:', sheetsData)
                
                if (!sheetsData.success || !sheetsData.data || sheetsData.data.length === 0) {
                  setError(`Dosya "${selectedFile}" için sayfa bulunamadı. Dosya işlenmemiş olabilir.`)
                  return
                }
                
                // Test 4: Raw data call (different approaches)
                console.log('📊 Test 4: Raw data calls')
                
                // 4a: No sheet specified
                const dataRes1 = await fetch(`${API_CONFIG.BASE_URL}/excel/data/${encodedFileName}?page=1&pageSize=5`)
                console.log('📊 Data response (no sheet):', dataRes1.status, dataRes1.ok)
                if (dataRes1.ok) {
                  const data1 = await dataRes1.json()
                  console.log('📊 Data result (no sheet):', data1)
                  console.log('📊 Data count (no sheet):', data1.data ? data1.data.length : 'No data')
                }
                
                // 4b: With first sheet
                const firstSheet = sheetsData.data[0].name
                const encodedSheet = encodeURIComponent(firstSheet)
                const dataRes2 = await fetch(`${API_CONFIG.BASE_URL}/excel/data/${encodedFileName}?page=1&pageSize=5&sheetName=${encodedSheet}`)
                console.log('📊 Data response (with sheet):', dataRes2.status, dataRes2.ok)
                if (dataRes2.ok) {
                  const data2 = await dataRes2.json()
                  console.log('📊 Data result (with sheet):', data2)
                  console.log('📊 Data count (with sheet):', data2.data ? data2.data.length : 'No data')
                  
                  if (data2.success && data2.data && data2.data.length > 0) {
                    setSuccess(`Backend test başarılı! ${data2.data.length} kayıt bulundu. Normal veri yükleme işlemini deneyin.`)
                    
                    // Auto-set the sheet and try to load
                    if (!selectedSheet) {
                      setSelectedSheet(firstSheet)
                    }
                  } else if (data2.success && (!data2.data || data2.data.length === 0)) {
                    // Dosya bulundu ama okunmamış - otomatik okuma dene
                    console.log('📖 File found but not read yet. Attempting to read...')
                    
                    if (data2.suggestedActions && data2.suggestedActions.readFile) {
                      console.log('🔄 Using suggested read action:', data2.suggestedActions.readFile)
                      
                      try {
                        const readResponse = await fetch(`${API_CONFIG.BASE_URL}${data2.suggestedActions.readFile}`, {
                          method: 'POST'
                        })
                        
                        if (readResponse.ok) {
                          const readResult = await readResponse.json()
                          console.log('📖 Read file result:', readResult)
                          
                          if (readResult.success) {
                            setSuccess('Dosya otomatik olarak okundu. Şimdi veri yüklemeyi deneyin.')
                            
                            // Auto-set the sheet and try to load again
                            if (!selectedSheet && data2.availableSheets && data2.availableSheets.length > 0) {
                              setSelectedSheet(data2.availableSheets[0])
                            }
                          } else {
                            setError(`Dosya okuma başarısız: ${readResult.message}`)
                          }
                        } else {
                          const readError = await readResponse.text()
                          setError(`Dosya okuma API hatası: ${readResponse.status} - ${readError}`)
                        }
                      } catch (readErr) {
                        console.error('💥 Auto-read error:', readErr)
                        setError('Dosya otomatik okuma hatası: ' + (readErr instanceof Error ? readErr.message : 'Bilinmeyen hata'))
                      }
                    } else {
                      setError(`Dosya bulundu ama okunmamış. Manuel olarak "Yeniden İşle" butonunu kullanın. Available sheets: ${data2.availableSheets ? data2.availableSheets.join(', ') : 'None'}`)
                    }
                  } else {
                    setError(`Backend bağlantısı OK ama veri bulunamadı. Data response: ${JSON.stringify(data2)}`)
                  }
                } else {
                  const errorText = await dataRes2.text()
                  setError(`Backend data endpoint hatası: ${dataRes2.status} - ${errorText}`)
                }
                
              } catch (err) {
                console.error('💥 Raw backend test error:', err)
                setError('Backend test hatası: ' + (err instanceof Error ? err.message : 'Bilinmeyen hata'))
              }
            }}
            disabled={loading || !selectedFile}
            className="btn btn-warning btn-sm"
          >
            🏗️ Backend Test
          </button>
          <button 
            onClick={async () => {
              if (!selectedFile) {
                setError('Lütfen önce bir dosya seçin')
                return
              }
              
              console.log('📖 Manual file read triggered...')
              const encodedFileName = encodeURIComponent(selectedFile)
              setLoading(true)
              clearMessages()
              
              try {
                // Try to read the file using the standard endpoint
                const readUrl = `${API_CONFIG.BASE_URL}/excel/read/${encodedFileName}`
                console.log('📖 Reading file with URL:', readUrl)
                
                const readResponse = await fetch(readUrl, {
                  method: 'POST'
                })
                
                if (readResponse.ok) {
                  const readResult = await readResponse.json()
                  console.log('📖 Manual read result:', readResult)
                  
                  if (readResult.success) {
                    setSuccess('Dosya başarıyla okundu! Şimdi veri yüklemeyi deneyin.')
                    
                    // Auto-refresh sheets and data
                    setTimeout(async () => {
                      await fetchSheets()
                    }, 500)
                  } else {
                    setError(`Dosya okuma başarısız: ${readResult.message}`)
                  }
                } else {
                  const readError = await readResponse.text()
                  setError(`Dosya okuma API hatası: ${readResponse.status} - ${readError}`)
                }
              } catch (readErr) {
                console.error('💥 Manual read error:', readErr)
                setError('Manuel dosya okuma hatası: ' + (readErr instanceof Error ? readErr.message : 'Bilinmeyen hata'))
              } finally {
                setLoading(false)
              }
            }}
            disabled={loading || !selectedFile}
            className="btn btn-info btn-sm"
          >
            📖 Dosyayı Oku
          </button>
        </div>
      </div>

      {/* Status Information */}
      {selectedFile && (
        <div className="status-info">
          <strong>Durum:</strong> 
          {loading && ' Yükleniyor...'}
          {!loading && data.length > 0 && ` ${data.length} kayıt yüklendi`}
          {!loading && data.length === 0 && !error && ' Veri yok - "Veri Yükle" butonunu deneyin'}
          {error && ' Hata var - Debug panelini kullanın'}
          
          {/* Özel durum: CSV dosyası */}
          {selectedFile.includes('.csv') && (
            <div className="csv-warning">
              ⚠️ Bu dosya CSV formatında yüklenmiş. Excel formatında yeniden yüklemeniz önerilir.
            </div>
          )}
        </div>
      )}
      
      {/* Sheet Selection */}
      {sheets.length > 1 && (
        <div className="sheet-selector">
          <label htmlFor="sheet-select">Sayfa Seç: </label>
          <select 
            id="sheet-select"
            value={selectedSheet} 
            onChange={(e) => setSelectedSheet(e.target.value)}
            className="form-control"
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
          <div className="sort-controls">
            <strong>Sıralama:</strong>
            <button 
              onClick={() => handleSort('rowIndex')} 
              className={`btn btn-sm ${sortBy === 'rowIndex' ? 'btn-primary' : 'btn-secondary'}`}
            >
              Satır No {sortBy === 'rowIndex' && (sortOrder === 'asc' ? '↑' : '↓')}
            </button>
            <button 
              onClick={() => handleSort('id')} 
              className={`btn btn-sm ${sortBy === 'id' ? 'btn-primary' : 'btn-secondary'}`}
            >
              ID {sortBy === 'id' && (sortOrder === 'asc' ? '↑' : '↓')}
            </button>
            <button 
              onClick={() => handleSort('createdDate')} 
              className={`btn btn-sm ${sortBy === 'createdDate' ? 'btn-primary' : 'btn-secondary'}`}
            >
              Tarih {sortBy === 'createdDate' && (sortOrder === 'asc' ? '↑' : '↓')}
            </button>
          </div>
          <table>
            <thead>
              <tr>
                <th>
                  <button 
                    onClick={() => handleSort('rowIndex')} 
                    className="sort-header-btn"
                  >
                    Satır {sortBy === 'rowIndex' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </button>
                </th>
                {getColumns().map((column) => (
                  <th key={column}>
                    <button 
                      onClick={() => handleSort(column)} 
                      className="sort-header-btn"
                    >
                      {column} {sortBy === column && (sortOrder === 'asc' ? '↑' : '↓')}
                    </button>
                  </th>
                ))}
                <th>Son Değişiklik</th>
                <th>İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row) => (
                <tr key={row.id}>
                  <td>{row.rowIndex}</td>
                  {getColumns().map((column) => (
                    <td key={column}>
                      {editingRow === row.id ? (
                        <input
                          type="text"
                          value={editData[column] || ''}
                          onChange={(e) => setEditData({...editData, [column]: e.target.value})}
                          className="table-input"
                          placeholder={`${column} değeri`}
                          title={`${column} için değer girin`}
                        />
                      ) : (
                        String(row.data[column] || '')
                      )}
                    </td>
                  ))}
                  <td>
                    {row.modifiedDate ? (
                      <div>
                        <div>{new Date(row.modifiedDate).toLocaleDateString('tr-TR')}</div>
                        <div className="row-metadata">
                          {row.modifiedBy || 'Bilinmiyor'}
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div>{new Date(row.createdDate).toLocaleDateString('tr-TR')}</div>
                        <div className="row-metadata">Oluşturuldu</div>
                      </div>
                    )}
                  </td>
                  <td>
                    {editingRow === row.id ? (
                      <div>
                        <button 
                          className="btn btn-primary btn-sm table-btn-spacing"
                          onClick={() => saveEdit(row.id)}
                          disabled={loading}
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
                          className="btn btn-primary btn-sm table-btn-spacing"
                          onClick={() => startEdit(row)}
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
      ) : (
        <div className="no-data">
          <p>Bu sayfada veri bulunamadı.</p>
        </div>
      )}

      {/* Pagination */}
      <div className="pagination-container">
        <button 
          className="btn btn-secondary btn-sm pagination-btn"
          onClick={() => setPage(page - 1)}
          disabled={page <= 1 || loading}
        >
          Önceki
        </button>
        <span className="pagination-info">Sayfa {page}</span>
        <button 
          className="btn btn-secondary btn-sm"
          onClick={() => setPage(page + 1)}
          disabled={data.length < pageSize || loading}
        >
          Sonraki
        </button>
      </div>

      {loading && (
        <div className="loading-center">
          <div className="spinner"></div>
        </div>
      )}
    </div>
  )
}

export default DataViewer
