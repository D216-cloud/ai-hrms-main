// Test script to debug pdf-parse import issues
export async function testPdfParseImport() {
  try {
    console.log("Testing pdf-parse import...");
    
    // Try different import methods
    console.log("Method 1: Standard import");
    const module1 = await import('pdf-parse');
    console.log("Module 1:", typeof module1);
    if (module1) {
      console.log("Module 1 keys:", Object.keys(module1));
      console.log("Module 1 default:", typeof module1.default);
      if (module1.default) {
        console.log("Module 1 default keys:", Object.keys(module1.default));
      }
    }
    
    // Try to use it
    if (module1.default && typeof module1.default === 'function') {
      console.log("Can use module1.default as function");
    } else if (typeof module1 === 'function') {
      console.log("Can use module1 directly as function");
    } else {
      console.log("Cannot use module1 as function");
    }
    
  } catch (error) {
    console.error("Error testing pdf-parse:", error);
  }
}