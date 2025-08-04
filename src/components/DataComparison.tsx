import React, { useState, useEffect } from 'react'
import { API_CONFIG } from '../services/config'

interface ComparisonResult {
  comparisonId: string
  file1Name: string
  file2Name: string
  comparisonDate: string
  differences: Difference[]
  summary: ComparisonSummary
}

interface Difference {
  rowIndex: number
  columnName: string
  oldValue: any
  newValue: any
  type: 'Modified' | 'Added' | 'Deleted'
}

interface ComparisonSummary {
  totalRows: number
  modifiedRows: number
  addedRows: number
  deletedRows: number
  unchangedRows: number
}

const DataComparison: React.FC = () => {
  const [files, setFiles] = useState<string[]>([])
  const [file1, setFile1] = useState('')
  const [file2, setFile2] = useState('')
  const [sheetName, setSheetName] = useState('')
  const [comparisonResult, setComparisonResult] = useState<ComparisonResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [comparisonType, setComparisonType] = useState<'files' | 'versions'>('files')

  const API_BASE = API_CONFIG.BASE_URL

  useEffect(() => {
    fetchFiles()
  }, [])

  const fetchFiles = async () => {
    try {
      const response = await fetch(`${API_BASE}/excel/files`)
      const result = await response.json()
      if (result.success) {
        setFiles(result.data.map((f: any) => f.fileName))
      }
    } catch (error) {
      console.error('Dosyalar yüklenirken hata:', error)
    }
  }

  const compareFiles = async () => {
    if (!file1 || !file2) {
      alert('Lütfen karşılaştırılacak dosyaları seçin')
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`${API_BASE}/comparison/files`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          fileName1: file1,
          fileName2: file2,
          sheetName: sheetName || null
        })
      })
      
      const result = await response.json()
      if (result.success) {
        setComparisonResult(result.data)
      } else {
        alert('Karşılaştırma hatası: ' + result.message)
      }
    } catch (error) {
      console.error('Karşılaştırma hatası:', error)
      alert('Karşılaştırma sırasında hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  const getDifferenceTypeColor = (type: string) => {
    switch (type) {
      case 'Added': return '#10b981' // green
      case 'Deleted': return '#ef4444' // red
      case 'Modified': return '#f59e0b' // yellow
      default: return '#6b7280' // gray
    }
  }

  const getDifferenceTypeIcon = (type: string) => {
    switch (type) {
      case 'Added': return '➕'
      case 'Deleted': return '➖'
      case 'Modified': return '✏️'
      default: return '❓'
    }
  }

  return (
    <div className="data-comparison">
      <h2>Veri Karşılaştırma</h2>
      
      {/* Comparison Type Selection */}
      <div className="comparison-type-selector">
        <div>
          <label>
            <input
              type="radio"
              value="files"
              checked={comparisonType === 'files'}
              onChange={(e) => setComparisonType(e.target.value as 'files' | 'versions')}
            />
            Dosya Karşılaştırması
          </label>
        </div>
        <div>
          <label>
            <input
              type="radio"
              value="versions"
              checked={comparisonType === 'versions'}
              onChange={(e) => setComparisonType(e.target.value as 'files' | 'versions')}
            />
            Versiyon Karşılaştırması
          </label>
        </div>
      </div>

      {/* File Comparison */}
      {comparisonType === 'files' && (
        <div className="comparison-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="file1-select">İlk Dosya:</label>
              <select 
                id="file1-select"
                value={file1} 
                onChange={(e) => setFile1(e.target.value)}
                className="form-control"
              >
                <option value="">Dosya seçin...</option>
                {files.map((fileName) => (
                  <option key={fileName} value={fileName}>{fileName}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="file2-select">İkinci Dosya:</label>
              <select 
                id="file2-select"
                value={file2} 
                onChange={(e) => setFile2(e.target.value)}
                className="form-control"
              >
                <option value="">Dosya seçin...</option>
                {files.filter(f => f !== file1).map((fileName) => (
                  <option key={fileName} value={fileName}>{fileName}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="sheet-input">Sayfa Adı (Opsiyonel):</label>
              <input
                id="sheet-input"
                type="text"
                value={sheetName}
                onChange={(e) => setSheetName(e.target.value)}
                placeholder="Tüm sayfalar"
                className="form-control"
              />
            </div>
          </div>

          <button 
            className="btn btn-primary"
            onClick={compareFiles}
            disabled={loading || !file1 || !file2}
          >
            {loading ? 'Karşılaştırılıyor...' : 'Karşılaştır'}
          </button>
        </div>
      )}

      {/* Comparison Results */}
      {comparisonResult && (
        <div className="comparison-results">
          <h3>Karşılaştırma Sonuçları</h3>
          
          {/* Summary */}
          <div className="comparison-summary">
            <div className="summary-grid">
              <div className="summary-item">
                <div className="summary-value">{comparisonResult.summary.totalRows}</div>
                <div className="summary-label">Toplam Satır</div>
              </div>
              <div className="summary-item modified">
                <div className="summary-value">{comparisonResult.summary.modifiedRows}</div>
                <div className="summary-label">Değişen</div>
              </div>
              <div className="summary-item added">
                <div className="summary-value">{comparisonResult.summary.addedRows}</div>
                <div className="summary-label">Eklenen</div>
              </div>
              <div className="summary-item deleted">
                <div className="summary-value">{comparisonResult.summary.deletedRows}</div>
                <div className="summary-label">Silinen</div>
              </div>
              <div className="summary-item unchanged">
                <div className="summary-value">{comparisonResult.summary.unchangedRows}</div>
                <div className="summary-label">Değişmeyen</div>
              </div>
            </div>
          </div>

          {/* Differences List */}
          {comparisonResult.differences.length > 0 ? (
            <div className="differences-list">
              <h4>Farklılıklar ({comparisonResult.differences.length})</h4>
              <div className="data-table">
                <table>
                  <thead>
                    <tr>
                      <th>Tip</th>
                      <th>Satır</th>
                      <th>Sütun</th>
                      <th>Eski Değer</th>
                      <th>Yeni Değer</th>
                    </tr>
                  </thead>
                  <tbody>
                    {comparisonResult.differences.map((diff, index) => (
                      <tr key={index}>
                        <td>
                          <span 
                            className="difference-type"
                            style={{ 
                              color: getDifferenceTypeColor(diff.type),
                              fontWeight: 'bold'
                            }}
                          >
                            {getDifferenceTypeIcon(diff.type)} {diff.type}
                          </span>
                        </td>
                        <td>{diff.rowIndex}</td>
                        <td>{diff.columnName}</td>
                        <td>
                          {diff.type === 'Added' ? '-' : String(diff.oldValue || '')}
                        </td>
                        <td>
                          {diff.type === 'Deleted' ? '-' : String(diff.newValue || '')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="no-differences">
              <p>🎉 Dosyalar arasında fark bulunamadı!</p>
            </div>
          )}
        </div>
      )}

      {loading && (
        <div className="loading">
          <div className="spinner"></div>
        </div>
      )}
    </div>
  )
}

export default DataComparison
