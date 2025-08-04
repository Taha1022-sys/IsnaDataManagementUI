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

  useEffect(() => {
    if (selectedFile) {
      fetchSheets()
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
        if (response.data.length > 0 && !selectedSheet) {
          setSelectedSheet(response.data[0].name)
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
    if (!selectedFile || !selectedSheet) return
    
    setLoading(true)
    clearMessages()
    try {
      console.log('🔍 Fetching data for:', { selectedFile, selectedSheet, page, pageSize })
      
      // Test the URL that will be called
      const testUrl = `${API_CONFIG.BASE_URL}/excel/data/${encodeURIComponent(selectedFile)}?page=${page}&pageSize=${pageSize}&sheetName=${encodeURIComponent(selectedSheet)}`
      console.log('🔗 Full API URL:', testUrl)
      
      const response = await excelService.getData(selectedFile, selectedSheet, page, pageSize)
      console.log('📋 Data response:', response)
      console.log('📋 Response success:', response.success)
      console.log('📋 Response data:', response.data)
      console.log('📋 Response message:', response.message)
      
      if (response.success && response.data) {
        setData(response.data)
        console.log('✅ Data loaded successfully:', response.data.length, 'rows')
        
        if (response.data.length === 0) {
          setError('Bu dosya/sayfa için veri bulunamadı. Dosyanın doğru yüklendiğinden ve işlendiğinden emin olun.')
          
          // Additional debugging - try to fetch without sheet filter
          console.log('🔍 Trying to fetch data without sheet filter...')
          try {
            const responseNoSheet = await excelService.getData(selectedFile, undefined, page, pageSize)
            console.log('📋 Data response (no sheet filter):', responseNoSheet)
          } catch (err) {
            console.log('❌ Error fetching without sheet filter:', err)
          }
        }
      } else {
        console.error('❌ Failed to load data:', response.message)
        setError(response.message || 'Veri yüklenirken hata oluştu')
        
        // Try to get more info about the error
        console.log('🔍 Debugging failed response...')
        console.log('   - selectedFile:', selectedFile)
        console.log('   - selectedSheet:', selectedSheet)
        console.log('   - response.success:', response.success)
        console.log('   - response.data:', response.data)
        console.log('   - response.message:', response.message)
      }
    } catch (error) {
      console.error('❌ Error fetching data:', error)
      setError('Veri yüklenirken hata oluştu. Backend bağlantısını kontrol edin.')
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
      <div className="debug-panel" style={{ background: '#f0f0f0', padding: '10px', marginBottom: '1rem', borderRadius: '5px' }}>
        <h4>🔧 Debug Panel</h4>
        <div style={{ marginBottom: '10px' }}>
          <strong>Selected File:</strong> {selectedFile}<br/>
          <strong>Selected Sheet:</strong> {selectedSheet}<br/>
          <strong>Available Sheets:</strong> {sheets.map(s => s.name).join(', ')}<br/>
          <strong>Data Count:</strong> {data.length} rows
        </div>
        <div>
          <button 
            onClick={async () => {
              console.log('🧪 Testing API endpoints...')
              try {
                // Test files endpoint
                const filesResponse = await fetch(`${API_CONFIG.BASE_URL}/excel/files`)
                console.log('📁 Files endpoint:', filesResponse.status, await filesResponse.json())
                
                // Test specific file data endpoint 
                if (selectedFile) {
                  const dataUrl = `${API_CONFIG.BASE_URL}/excel/data/${encodeURIComponent(selectedFile)}`
                  console.log('🔗 Testing URL:', dataUrl)
                  const dataResponse = await fetch(dataUrl)
                  console.log('📊 Data endpoint:', dataResponse.status, dataResponse.ok)
                  if (dataResponse.ok) {
                    const dataResult = await dataResponse.json()
                    console.log('📋 Data result:', dataResult)
                  } else {
                    const errorText = await dataResponse.text()
                    console.log('❌ Data error:', errorText)
                  }
                }
              } catch (err) {
                console.log('💥 Test error:', err)
              }
            }}
            disabled={loading}
            style={{ marginRight: '10px', padding: '5px 10px', fontSize: '12px' }}
          >
            Test API Endpoints
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
            style={{ marginRight: '10px', padding: '5px 10px', fontSize: '12px' }}
          >
            Log Current State
          </button>
          <button 
            onClick={fetchData}
            disabled={loading || !selectedFile || !selectedSheet}
            style={{ padding: '5px 10px', fontSize: '12px' }}
          >
            Force Refresh Data
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
                          style={{ width: '100%', padding: '4px' }}
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
      ) : (
        <div className="no-data">
          <p>Bu sayfada veri bulunamadı.</p>
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
