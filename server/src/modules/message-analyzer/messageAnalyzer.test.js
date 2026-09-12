describe("MessageAnalyzer", () => {
  it("should export analyze function with correct interface", async () => {
    const { MessageAnalyzer } = await import("./MessageAnalyzer.js");
    const analyzer = new MessageAnalyzer();
    expect(typeof analyzer.analyze).toBe("function");
  });
});
