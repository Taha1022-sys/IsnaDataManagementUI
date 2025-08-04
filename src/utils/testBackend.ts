import { excelService } from '../services'

// Test backend connection
export async function testBackendConnection(): Promise<boolean> {
  try {
    console.log('Testing backend connection...')
    const response = await excelService.testConnection()
    console.log('Backend connection test result:', response)
    return response.success
  } catch (error) {
    console.error('Backend connection failed:', error)
    return false
  }
}

// Test file upload
export async function testFileUpload(file: File): Promise<boolean> {
  try {
    console.log('Testing file upload...')
    const response = await excelService.uploadFile(file, 'test-user')
    console.log('File upload test result:', response)
    return response.success
  } catch (error) {
    console.error('File upload test failed:', error)
    return false
  }
}

// Test file list
export async function testFileList(): Promise<boolean> {
  try {
    console.log('Testing file list...')
    const response = await excelService.getFiles()
    console.log('File list test result:', response)
    return response.success
  } catch (error) {
    console.error('File list test failed:', error)
    return false
  }
}

// Run all tests
export async function runAllTests(): Promise<void> {
  console.log('🚀 Starting frontend-backend integration tests...')
  
  const connectionTest = await testBackendConnection()
  console.log(`✅ Backend Connection: ${connectionTest ? 'PASS' : 'FAIL'}`)
  
  const fileListTest = await testFileList()
  console.log(`✅ File List API: ${fileListTest ? 'PASS' : 'FAIL'}`)
  
  console.log('🏁 Integration tests completed!')
  
  if (connectionTest && fileListTest) {
    console.log('🎉 All tests passed! Backend integration is working.')
  } else {
    console.log('❌ Some tests failed. Check backend server and CORS configuration.')
  }
}
