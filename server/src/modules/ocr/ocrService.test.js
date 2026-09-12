let OCRService;
let VisionAdapter;

beforeAll(async () => {
  const ocrMod = await import("./OCRService.js");
  OCRService = ocrMod.OCRService;
  const visionMod = await import("./VisionAdapter.js");
  VisionAdapter = visionMod.VisionAdapter;
});

describe("OCRService", () => {
  it("exports extractText as a function", async () => {
    const service = new OCRService();
    expect(typeof service.extractText).toBe("function");
  });

  it("delegates to the injected adapter", async () => {
    const mockAdapter = {
      extractText: async (path) => ({
        text: "hello from mock",
        urls: ["https://mock.test"],
        confidence: 0.95,
      }),
    };
    const service = new OCRService(mockAdapter);
    const result = await service.extractText("/fake/path.png");
    expect(result.text).toBe("hello from mock");
    expect(result.urls).toEqual(["https://mock.test"]);
    expect(result.confidence).toBe(0.95);
  });

  it("returns error result for null path", async () => {
    const service = new OCRService();
    const result = await service.extractText(null);
    expect(result.text).toBe("");
    expect(result.urls).toEqual([]);
    expect(result.error).toContain("No image path provided");
  });

  it("returns error result for undefined path", async () => {
    const service = new OCRService();
    const result = await service.extractText(undefined);
    expect(result.text).toBe("");
    expect(result.error).toContain("No image path provided");
  });

  it("returns error result for empty string path", async () => {
    const service = new OCRService();
    const result = await service.extractText("");
    expect(result.text).toBe("");
    expect(result.error).toContain("No image path provided");
  });

  it("returns error result for non-string path", async () => {
    const service = new OCRService();
    const result = await service.extractText(12345);
    expect(result.text).toBe("");
    expect(result.error).toContain("No image path provided");
  });

  it("handles adapter throwing an error", async () => {
    const failingAdapter = {
      extractText: async () => {
        throw new Error("Tesseract crashed");
      },
    };
    const service = new OCRService(failingAdapter);
    const result = await service.extractText("/some/path.png");
    expect(result.text).toBe("");
    expect(result.confidence).toBe(0);
  });
});

describe("VisionAdapter", () => {
  it("exports extractText as a function", async () => {
    const adapter = new VisionAdapter();
    expect(typeof adapter.extractText).toBe("function");
  });

  it("throws not-implemented error", async () => {
    const adapter = new VisionAdapter();
    await expect(adapter.extractText("/fake/path.png")).rejects.toThrow(
      "VisionAdapter is not yet implemented"
    );
  });
});
