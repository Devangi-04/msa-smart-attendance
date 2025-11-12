const fs = require('fs');
const path = require('path');

// Simple script to help generate downloadable versions
console.log('📄 Document Generation Helper\n');
console.log('Your SRS.md and SYNOPSIS.md are ready!\n');
console.log('To create downloadable versions:\n');

console.log('Option 1: Using Online Converters (Easiest)');
console.log('  1. Go to: https://www.markdowntopdf.com/');
console.log('  2. Upload SYNOPSIS.md and SRS.md');
console.log('  3. Download as PDF\n');

console.log('Option 2: Using Pandoc (Best Quality)');
console.log('  Install Pandoc: https://pandoc.org/installing.html');
console.log('  Then run:');
console.log('    pandoc SYNOPSIS.md -o SYNOPSIS.pdf');
console.log('    pandoc SRS.md -o SRS.pdf');
console.log('    pandoc SYNOPSIS.md -o SYNOPSIS.docx');
console.log('    pandoc SRS.md -o SRS.docx\n');

console.log('Option 3: Using VS Code Extension');
console.log('  1. Install "Markdown PDF" extension');
console.log('  2. Open SYNOPSIS.md or SRS.md');
console.log('  3. Right-click → "Markdown PDF: Export (pdf)"\n');

console.log('Option 4: Copy to Word');
console.log('  1. Open SYNOPSIS.md or SRS.md');
console.log('  2. Copy all content (Ctrl+A, Ctrl+C)');
console.log('  3. Paste into Microsoft Word');
console.log('  4. Save as .docx or export as PDF\n');

// Check if files exist
const synopsisExists = fs.existsSync(path.join(__dirname, 'SYNOPSIS.md'));
const srsExists = fs.existsSync(path.join(__dirname, 'SRS.md'));

console.log('✅ File Status:');
console.log(`  SYNOPSIS.md: ${synopsisExists ? 'Found' : 'Not Found'}`);
console.log(`  SRS.md: ${srsExists ? 'Found' : 'Not Found'}\n`);

if (synopsisExists && srsExists) {
    console.log('🎉 Both documents are ready for conversion!');
} else {
    console.log('⚠️  Some documents are missing. Please check the files.');
}
