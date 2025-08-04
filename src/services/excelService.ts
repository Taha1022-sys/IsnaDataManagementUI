import { API_CONFIG, API_ENDPOINTS } from './config'
import type { 
  ApiResponse, 
  ExcelFile, 
  ExcelData, 
  Sheet, 
  ExcelDataUpdate, 
  BulkUpdate, 
  AddRowRequest,
  DataStatistics,
  ExcelExportRequest
} from '../types'

class ExcelService {
  private async fetchWithTimeout(url: string, options: RequestInit = {}): Promise<Response> {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT)
    
    try {
      // FormData kullanılıyorsa Content-Type header'ını ekleme
      const isFormData = options.body instanceof FormData
      const headers = isFormData 
        ? { ...options.headers } // FormData için Content-Type ekleme
        : { ...API_CONFIG.HEADERS, ...options.headers } // JSON için Content-Type ekle
      
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers,
      })
      clearTimeout(timeoutId)
      return response
    } catch (error) {
      clearTimeout(timeoutId)
      throw error
    }
  }

  // Test connection
  async testConnection(): Promise<ApiResponse> {
    try {
      console.log('🔗 Testing connection to:', `${API_CONFIG.BASE_URL}${API_ENDPOINTS.EXCEL.TEST}`)
      const response = await this.fetchWithTimeout(`${API_CONFIG.BASE_URL}${API_ENDPOINTS.EXCEL.TEST}`)
      console.log('📡 Response status:', response.status)
      console.log('📡 Response ok:', response.ok)
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const data = await response.json()
      console.log('📦 Response data:', data)
      
      // Backend'den gelen yanıtın formatını kontrol et
      if (typeof data === 'object' && data !== null) {
        return {
          success: data.success === true || response.ok,
          data: data.data || data,
          message: data.message || 'Connection successful'
        }
      }
      
      // Eğer yanıt beklenmedik formattaysa
      return {
        success: true,
        message: 'Connection successful but unexpected response format'
      }
    } catch (error) {
      console.error('❌ Connection test failed:', error)
      throw new Error('Backend bağlantısı kurulamadı')
    }
  }

  // Get all files
  async getFiles(): Promise<ApiResponse<ExcelFile[]>> {
    try {
      const response = await this.fetchWithTimeout(`${API_CONFIG.BASE_URL}${API_ENDPOINTS.EXCEL.FILES}`)
      return await response.json()
    } catch (error) {
      console.error('Failed to fetch files:', error)
      throw new Error('Dosyalar yüklenirken hata oluştu')
    }
  }

  // Upload file
  async uploadFile(file: File, uploadedBy: string): Promise<ApiResponse> {
    try {
      console.log('📁 Uploading file:', file.name, 'by:', uploadedBy)
      
      const formData = new FormData()
      formData.append('file', file)
      formData.append('uploadedBy', uploadedBy)

      const response = await this.fetchWithTimeout(`${API_CONFIG.BASE_URL}${API_ENDPOINTS.EXCEL.UPLOAD}`, {
        method: 'POST',
        body: formData
        // fetchWithTimeout artık FormData'yı algılayıp Content-Type header'ını eklemeyecek
      })
      
      console.log('📡 Upload response status:', response.status)
      console.log('📡 Upload response ok:', response.ok)
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ Upload failed:', response.status, errorText)
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const result = await response.json()
      console.log('📦 Upload result:', result)
      return result
    } catch (error) {
      console.error('Failed to upload file:', error)
      throw new Error('Dosya yüklenirken hata oluştu')
    }
  }

  // Get sheets for a file
  async getSheets(fileName: string): Promise<ApiResponse<Sheet[]>> {
    try {
      console.log('🔍 ExcelService.getSheets called with:', fileName)
      const url = `${API_CONFIG.BASE_URL}${API_ENDPOINTS.EXCEL.SHEETS(fileName)}`
      console.log('🔗 GET Sheets URL:', url)
      console.log('📁 Encoded fileName:', encodeURIComponent(fileName))
      
      const response = await this.fetchWithTimeout(url)
      
      console.log('📡 GET Sheets response status:', response.status)
      console.log('📡 GET Sheets response ok:', response.ok)
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ GET Sheets failed:', response.status, errorText)
        throw new Error(`HTTP ${response.status}: ${errorText || response.statusText}`)
      }
      
      const result = await response.json()
      console.log('📦 GET Sheets result:', result)
      console.log('✅ Sheets success:', result.success)
      console.log('📊 Sheets count:', result.data ? result.data.length : 'No data array')
      
      return result
    } catch (error) {
      console.error('💥 Failed to fetch sheets:', error)
      throw new Error('Sayfalar yüklenirken hata oluştu')
    }
  }

  // Get data from a file
  async getData(
    fileName: string, 
    sheetName?: string, 
    page: number = 1, 
    pageSize: number = 50
  ): Promise<ApiResponse<ExcelData[]>> {
    try {
      console.log('🔍 ExcelService.getData called with:', { fileName, sheetName, page, pageSize })
      
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
      })
      
      if (sheetName) {
        params.append('sheetName', sheetName)
      }

      const url = `${API_CONFIG.BASE_URL}${API_ENDPOINTS.EXCEL.DATA(fileName)}?${params}`
      console.log('🔗 GET Data URL:', url)
      console.log('📁 Encoded fileName:', encodeURIComponent(fileName))
      console.log('📄 Sheet name:', sheetName)
      console.log('📊 Params:', params.toString())

      const response = await this.fetchWithTimeout(url)
      
      console.log('📡 GET Data response status:', response.status)
      console.log('📡 GET Data response ok:', response.ok)
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ GET Data failed:', response.status, errorText)
        
        // Try to parse error as JSON
        try {
          const errorJson = JSON.parse(errorText)
          console.error('📋 Parsed error:', errorJson)
          return {
            success: false,
            message: errorJson.message || `HTTP ${response.status}: ${response.statusText}`,
            data: []
          }
        } catch {
          return {
            success: false,
            message: `HTTP ${response.status}: ${errorText || response.statusText}`,
            data: []
          }
        }
      }
      
      const result = await response.json()
      console.log('📦 GET Data result:', result)
      console.log('✅ Data success:', result.success)
      console.log('📊 Data count:', result.data ? result.data.length : 'No data array')
      
      return result
    } catch (error) {
      console.error('💥 Failed to fetch data:', error)
      
      // Network error check
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Network hatası: Backend servisine bağlanılamıyor')
      }
      
      throw new Error('Veri yüklenirken hata oluştu')
    }
  }

  // Update single row
  async updateData(update: ExcelDataUpdate): Promise<ApiResponse> {
    try {
      const response = await this.fetchWithTimeout(
        `${API_CONFIG.BASE_URL}${API_ENDPOINTS.EXCEL.UPDATE_DATA}`,
        {
          method: 'PUT',
          body: JSON.stringify(update),
        }
      )
      return await response.json()
    } catch (error) {
      console.error('Failed to update data:', error)
      throw new Error('Veri güncellenirken hata oluştu')
    }
  }

  // Bulk update
  async bulkUpdateData(bulkUpdate: BulkUpdate): Promise<ApiResponse> {
    try {
      const response = await this.fetchWithTimeout(
        `${API_CONFIG.BASE_URL}${API_ENDPOINTS.EXCEL.BULK_UPDATE}`,
        {
          method: 'PUT',
          body: JSON.stringify(bulkUpdate),
        }
      )
      return await response.json()
    } catch (error) {
      console.error('Failed to bulk update data:', error)
      throw new Error('Toplu güncelleme sırasında hata oluştu')
    }
  }

  // Add new row
  async addRow(addRowRequest: AddRowRequest): Promise<ApiResponse> {
    try {
      const response = await this.fetchWithTimeout(
        `${API_CONFIG.BASE_URL}${API_ENDPOINTS.EXCEL.ADD_ROW}`,
        {
          method: 'POST',
          body: JSON.stringify(addRowRequest),
        }
      )
      return await response.json()
    } catch (error) {
      console.error('Failed to add row:', error)
      throw new Error('Satır eklenirken hata oluştu')
    }
  }

  // Delete row
  async deleteData(id: number, deletedBy?: string): Promise<ApiResponse> {
    try {
      const params = deletedBy ? `?deletedBy=${encodeURIComponent(deletedBy)}` : ''
      const response = await this.fetchWithTimeout(
        `${API_CONFIG.BASE_URL}${API_ENDPOINTS.EXCEL.DELETE_DATA(id)}${params}`,
        {
          method: 'DELETE',
        }
      )
      return await response.json()
    } catch (error) {
      console.error('Failed to delete data:', error)
      throw new Error('Veri silinirken hata oluştu')
    }
  }

  // Export to Excel
  async exportToExcel(exportRequest: ExcelExportRequest): Promise<Blob> {
    try {
      const response = await this.fetchWithTimeout(
        `${API_CONFIG.BASE_URL}${API_ENDPOINTS.EXCEL.EXPORT}`,
        {
          method: 'POST',
          body: JSON.stringify(exportRequest),
        }
      )
      
      if (!response.ok) {
        throw new Error('Export failed')
      }
      
      return await response.blob()
    } catch (error) {
      console.error('Failed to export data:', error)
      throw new Error('Veri dışa aktarılırken hata oluştu')
    }
  }

  // Get data statistics
  async getStatistics(fileName: string, sheetName?: string): Promise<ApiResponse<DataStatistics>> {
    try {
      const params = sheetName ? `?sheetName=${encodeURIComponent(sheetName)}` : ''
      const response = await this.fetchWithTimeout(
        `${API_CONFIG.BASE_URL}${API_ENDPOINTS.EXCEL.STATISTICS(fileName)}${params}`
      )
      return await response.json()
    } catch (error) {
      console.error('Failed to fetch statistics:', error)
      throw new Error('İstatistikler yüklenirken hata oluştu')
    }
  }

  // Read Excel data (for initial processing)
  async readExcelData(fileName: string, sheetName?: string): Promise<ApiResponse> {
    try {
      console.log('📖 Reading Excel data for:', fileName, sheetName ? `(sheet: ${sheetName})` : '(all sheets)')
      
      const params = sheetName ? `?sheetName=${encodeURIComponent(sheetName)}` : ''
      const url = `${API_CONFIG.BASE_URL}${API_ENDPOINTS.EXCEL.READ(fileName)}${params}`
      console.log('🔗 Read Excel URL:', url)
      
      const response = await this.fetchWithTimeout(url, {
        method: 'POST',
      })
      
      console.log('📡 Read Excel response status:', response.status)
      console.log('📡 Read Excel response ok:', response.ok)
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ Read Excel failed:', response.status, errorText)
        
        // HTTP status koduna göre daha spesifik hata mesajları
        if (response.status === 500) {
          throw new Error(`Sunucu hatası (500): Excel dosyası işlenirken hata oluştu. Dosya formatını kontrol edin.`)
        } else if (response.status === 404) {
          throw new Error(`Dosya bulunamadı (404): "${fileName}" dosyası sunucuda bulunamıyor.`)
        } else if (response.status === 400) {
          throw new Error(`Geçersiz istek (400): Dosya formatı veya parametreler hatalı.`)
        } else {
          throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`)
        }
      }
      
      const result = await response.json()
      console.log('📦 Read Excel result:', result)
      return result
    } catch (error) {
      console.error('Failed to read Excel data:', error)
      
      // Network hatası mı kontrol et
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Network hatası: Backend servisine bağlanılamıyor')
      }
      
      // Zaten işlenmiş hata mesajlarını olduğu gibi geçir
      if (error instanceof Error && error.message.includes('HTTP')) {
        throw error
      }
      
      // Diğer hatalar için genel mesaj
      throw new Error('Excel dosyası okunurken beklenmedik hata oluştu')
    }
  }

  // Delete file
  async deleteFile(fileName: string): Promise<ApiResponse> {
    try {
      console.log('🗑️ Deleting file:', fileName)
      console.log('🔗 Delete URL:', `${API_CONFIG.BASE_URL}${API_ENDPOINTS.EXCEL.DELETE_FILE(fileName)}`)
      
      const response = await this.fetchWithTimeout(
        `${API_CONFIG.BASE_URL}${API_ENDPOINTS.EXCEL.DELETE_FILE(fileName)}`,
        {
          method: 'DELETE',
        }
      )
      
      console.log('📡 Delete response status:', response.status)
      console.log('📡 Delete response ok:', response.ok)
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ Delete failed:', response.status, errorText)
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const result = await response.json()
      console.log('📦 Delete result:', result)
      return result
    } catch (error) {
      console.error('Failed to delete file:', error)
      throw new Error('Dosya silinirken hata oluştu')
    }
  }
}

// Singleton instance
export const excelService = new ExcelService()
export default excelService
