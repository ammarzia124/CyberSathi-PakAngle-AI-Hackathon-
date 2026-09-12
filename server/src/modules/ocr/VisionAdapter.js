export class VisionAdapter {
  async extractText(imagePath) {
    throw new Error(
      "VisionAdapter is not yet implemented. Use TesseractAdapter as the default OCR provider."
    );
  }
}
