describe("UrlAnalyzer", () => {
  it("should export analyze function with correct interface", async () => {
    const { UrlAnalyzer } = await import("./UrlAnalyzer.js");
    const analyzer = new UrlAnalyzer();
    expect(typeof analyzer.analyze).toBe("function");
  });
});
