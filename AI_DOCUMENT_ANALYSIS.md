# AI-Powered Document Analysis & Camera Scanning

## Overview
The app now includes intelligent document analysis and camera scanning capabilities that work seamlessly on both desktop and mobile devices.

## Features Implemented

### 1. AI-Powered Document Analysis
- **Automatic Tax Relevance Detection**: Every uploaded document is automatically analyzed by AI to determine if it's tax-relevant
- **Smart Categorization**: Documents are automatically categorized (W-2, 1099, Receipts, Invoices, Bank Statements, etc.)
- **Data Extraction**: AI extracts key information including:
  - Tax year
  - Tax amounts
  - Tax categories (income, deduction, credit)
  - Document type
  - Confidence scores

### 2. Camera/Scanner Integration
- **Mobile & Desktop Support**: Works on both mobile phones and PCs
- **Camera Access**: Direct camera integration for taking photos
- **File Upload**: Alternative file selection for existing images/documents
- **Real-time Preview**: See captured image before processing
- **Retake Option**: Easy retake if image quality is poor

### 3. Upload Process
1. **User uploads document** (via camera, file picker, or drag-and-drop)
2. **PDF Text Extraction**: For PDF files, text is extracted using `pdf-parse`
3. **AI Analysis**: Document is sent to AI service (OpenAI/Anthropic/Google) for analysis
4. **Automatic Categorization**: Document is categorized and tagged
5. **Tax Relevance Check**: AI determines if document is tax-relevant
6. **Database Storage**: All analysis results are stored with the document

## Technical Implementation

### Components
- **`CameraScanner`**: React component for camera access and image capture
- **`DocumentAnalyzer`**: AI service for document analysis
- **Upload API**: Enhanced with AI analysis integration

### AI Analysis Flow
```
Document Upload
    ↓
PDF Text Extraction (if PDF)
    ↓
AI Analysis (OpenAI/Anthropic/Google)
    ↓
Parse JSON Response
    ↓
Extract: tax relevance, category, amounts, year
    ↓
Store in Database
```

### Database Fields
- `isTaxRelevant`: Boolean flag for tax relevance
- `taxAmount`: Extracted tax amount
- `taxCategory`: Tax category (income, deduction, etc.)
- `extractedText`: Full text from document
- `extractedData`: Complete AI analysis JSON
- `aiConfidence`: Confidence score (0-1)
- `categoryId`: Auto-assigned category

## Usage

### For Users
1. Click **"Scan"** button to use camera
2. Click **"Upload"** button to select files
3. Drag and drop files into the upload area
4. Documents are automatically analyzed
5. Tax-relevant documents are marked with a green badge
6. AI-analyzed documents show a purple badge

### For Developers
```typescript
// Analyze a document
const analysis = await DocumentAnalyzer.analyzeDocument(
  fileName,
  extractedText,
  mimeType
);

// Use camera scanner
<CameraScanner
  onCapture={(file) => handleUpload(file)}
  onClose={() => setShowCamera(false)}
/>
```

## Fallback Behavior
- If AI API keys are not configured, the system uses filename-based analysis
- If AI analysis fails, default values are used (category: "Other", isTaxRelevant: false)
- Camera access errors are gracefully handled with user-friendly messages

## Mobile Optimization
- Uses back camera on mobile devices (`facingMode: 'environment'`)
- Responsive design for all screen sizes
- Touch-friendly controls
- Optimized image quality for mobile cameras

## Future Enhancements
- OCR for image-based documents (using Tesseract.js)
- Multi-page document scanning
- Batch analysis for multiple documents
- Custom AI prompts per document type
- Document quality scoring
- Auto-cropping and enhancement


