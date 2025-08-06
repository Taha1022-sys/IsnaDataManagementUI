# ISNA Data Management Project

A full-featured web application for managing, editing, and comparing Excel data.

## 🏗️ Project Structure

- **Backend**: C# .NET 9.0 Web API (ExcelDataManagementAPI)
- **Frontend**: React + TypeScript + Vite
- **Database**: SQL Server / LocalDB
- **Excel Processing**: EPPlus Library

## 📁 Folder and File Structure

### Root Directory

| Folder/File | Description |
|-------------|-------------|
| `public/`   | Static files (images, favicon, etc.) are stored here. |
| `src/`      | All application source code is located here. |
| `index.html`| The main HTML file of the application. |
| `package.json` | Project dependencies and script definitions are stored here. |
| `tsconfig.json` | TypeScript configuration file. |
| `vite.config.ts` | Vite dev server and build tool configuration. |
| `README.md` | General information and setup instructions for the project. |

### `src/` Folder

| Folder/File | Description |
|-------------|-------------|
| `App.tsx`   | Main React component of the application. |
| `main.tsx`  | Entry point for the React application. |
| `App.css`, `index.css` | Global style files. |
| `assets/`   | Images used in the application. |
| `components/`| All React components are located here. |
| `services/` | Service functions for API communication. |
| `types/`    | TypeScript type definitions. |
| `utils/`    | Utility functions and test tools. |

#### `src/components/` Folder

| File | Description |
|------|-------------|
| `DataViewer.tsx` | Main component that displays Excel data as a table and manages sheet/row editing. |
| `Dashboard.tsx`  | General dashboard component. |
| `FileManager.tsx`| Component for uploading, deleting, and listing files. |
| `Header.tsx`     | Top navigation bar of the application. |
| `Sidebar.tsx`    | Left sidebar navigation. |
| `ChangeHistory.tsx` | Displays file and row change history. |
| `DataComparison.tsx` | Manages comparisons between different files/sheets. |
| `components.css` | Component-specific style file. |

#### `src/services/` Folder

| File | Description |
|------|-------------|
| `excelService.ts` | Contains API calls related to Excel files. |
| `comparisonService.ts` | API calls for file/sheet comparison. |
| `historyService.ts` | API calls for change history. |
| `config.ts` | API endpoints and basic configuration. |
| `index.ts` | Central export for services. |

#### `src/types/` Folder

| File | Description |
|------|-------------|
| `index.ts` | Type definitions for Excel data, files, sheets, and others. |

#### `src/utils/` Folder

| File | Description |
|------|-------------|
| `comprehensiveDiagnosis.ts` | Advanced error diagnosis functions. |
| `debugExcel.ts` | Debugging tools for Excel files. |
| `diagnoseExcel.ts` | Functions for processing and diagnosing Excel files. |
| `endpointTester.ts` | Helper functions for testing API endpoints. |
| `testBackend.ts` | Backend connection and function tests. |

## 🚀 Setup and Run

### 1. Backend Setup

Your backend project is located at `C:\Users\taha.teke\Desktop\ISNA DATA MANAGEMENT PROJECT\IDM VS\`.

1. Open the backend project in Visual Studio
2. Restore NuGet packages
3. Check the database connection string in `appsettings.json`
4. Run migrations if needed:
   ```bash
   dotnet ef database update
   ```
5. Start the project (F5 or Ctrl+F5)
   - Backend will run at https://localhost:7002 by default

### 2. Frontend Setup

In this directory (IDM VSC):

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Frontend will run at http://localhost:5173.

### 3. CORS Settings

You may need to configure CORS in the backend. In `Program.cs` or `Startup.cs`:

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

## 🔧 Features

### 📁 File Management

- Upload Excel files (.xlsx, .xls)
- View file list
- File size and upload date info
- Delete files

### 📊 Data Viewing

- Display Excel data in a table
- Pagination support
- Row editing
- Add new row
- Delete row
- Sheet selection

### 🔍 Data Comparison

- Compare two different Excel files
- Compare different versions of the same file
- Visualize differences
- Generate comparison reports

### 📈 Change History

- Track all data changes
- User-based change history
- Date filtering
- View change details

## 🛠️ Technical Details

### Backend API Endpoints

- `GET /api/excel/files` - File list
- `POST /api/excel/upload` - Upload file
- `GET /api/excel/data/{fileName}` - View data
- `PUT /api/excel/data` - Update data
- `POST /api/excel/data` - Add new row
- `DELETE /api/excel/data/{id}` - Delete row
- `POST /api/comparison/compare` - Compare files
- `GET /api/history/changes` - Change history

### Frontend Components

- **Dashboard**: Main page and statistics
- **FileManager**: File upload and management
- **DataViewer**: Data viewing and editing
- **DataComparison**: File comparison
- **ChangeHistory**: Change history

### TypeScript Types

All API responses and data structures are defined in `src/types/index.ts`.

## 🧪 Testing

1. After starting the app, click the "Test Connection" button on the Dashboard
2. If backend connection is successful, you will see a green ✅
3. If connection fails, you will see a red ❌ and error messages

## 🔨 Development

### Adding New Features

1. Add required API endpoints in the backend
2. Update service methods in `src/services/`
3. Define TypeScript types in `src/types/index.ts`
4. Implement the UI in components

### Build and Deployment

```bash
# Production build
npm run build

# Preview the build
npm run preview
```

## 📋 TODO

- [ ] Authentication/Authorization system
- [ ] File size limits
- [ ] Excel schema validation
- [ ] Bulk data import/export
- [ ] Advanced filtering and search
- [ ] Real-time notifications
- [ ] Audit logging

## 🐛 Troubleshooting

### Backend Connection Issues

1. Make sure the backend is running
2. Check CORS settings
3. Check firewall/antivirus software
4. For SSL certificate issues, visit https://localhost:7002 in your browser

### Excel File Issues

1. Make sure the file format is .xlsx or .xls
2. Check that the file is not corrupt
3. Make sure the file size does not exceed backend limits

## 📞 Support

If you encounter any issues:
1. Check error messages in the browser console
2. Review backend logs
3. Check API calls in the network tab
