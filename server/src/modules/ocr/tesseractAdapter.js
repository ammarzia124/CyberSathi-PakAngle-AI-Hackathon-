import Tesseract from "tesseract.js";

const CONFIDENCE_THRESHOLD = 0.3;

export class TesseractAdapter {
  async extractText(imagePath) {
    try {
      const result = await Tesseract.recognize(imagePath, "eng+urd", {});
      const text = result.data.text || "";
      const confidence = result.data.confidence / 100;

      const urlRegex = /https?:\/\/[^\s<>\"')]+/gi;
      const urls = [...new Set(text.match(urlRegex) || [])];

      if (confidence < CONFIDENCE_THRESHOLD) {
        console.warn(`OCR confidence low: ${(confidence * 100).toFixed(1)}%`);
      }

      return {
        text,
        urls,
        confidence,
        lowConfidence: confidence < CONFIDENCE_THRESHOLD,
      };
    } catch (error) {
      console.error("OCR extraction failed:", error.message);
      return { text: "", urls: [], confidence: 0, error: error.message };
    }
  }
}
