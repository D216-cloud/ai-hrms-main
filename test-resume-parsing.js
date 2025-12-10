// Test script for resume parsing
const fs = require('fs');
const path = require('path');
const { extractResumeText } = require('./lib/resumeParser');

async function testResumeParsing() {
  try {
    console.log("Testing resume parsing...");
    
    // Test with a sample PDF file (you would need to provide an actual file)
    const testFiles = [
      // Add paths to your test files here
    ];
    
    for (const filePath of testFiles) {
      if (fs.existsSync(filePath)) {
        console.log(`\nTesting file: ${filePath}`);
        
        // Read file as buffer
        const buffer = fs.readFileSync(filePath);
        const mimeType = getMimeType(filePath);
        
        console.log(`File size: ${buffer.length} bytes`);
        console.log(`MIME type: ${mimeType}`);
        
        // Try to extract text
        const text = await extractResumeText(buffer, mimeType);
        console.log(`Extracted text length: ${text.length}`);
        console.log(`First 200 characters: ${text.substring(0, 200)}...`);
      } else {
        console.log(`File not found: ${filePath}`);
      }
    }
    
    console.log("\nTest completed successfully!");
  } catch (error) {
    console.error("Test failed:", error);
  }
}

function getMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case '.pdf':
      return 'application/pdf';
    case '.docx':
      return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    case '.doc':
      return 'application/msword';
    default:
      return 'application/octet-stream';
  }
}

// Run the test
testResumeParsing();