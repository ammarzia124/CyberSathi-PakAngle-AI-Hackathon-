import { TesseractAdapter } from "./tesseractAdapter.js";

export class OCRService {
  constructor(adapter) {
    this.adapter = adapter || new TesseractAdapter();
  }

  async extractText(imagePath) {
    if (!imagePath || typeof imagePath !== "string") {
      return { text: "", urls: [], confidence: 0, error: "No image path provided" };
    }
    try {
      return await this.adapter.extractText(imagePath);
    } catch (error) {
      console.error("OCR adapter failed:", error.message);
      return { text: "", urls: [], confidence: 0, error: error.message };
    }
  }
}
