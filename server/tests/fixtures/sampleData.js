export const sampleUrls = [
  { url: "https://www.google.com", expected: "Low" },
  { url: "http://192.168.1.1/login", expected: "Suspicious" },
  { url: "https://paypa1-secure.xyz/verify", expected: "Critical" },
  { url: "https://bit.ly/3xYzAbC", expected: "Suspicious" },
];

export const sampleMessages = [
  {
    text: "Congratulations! You have won Rs. 500,000. Click here to claim.",
    expected: "High",
  },
  {
    text: "Your bank account has been suspended. Verify immediately.",
    expected: "High",
  },
  {
    text: "Meeting rescheduled to 3pm tomorrow.",
    expected: "Low",
  },
];

export const sampleReport = {
  reportId: "test-report-001",
  inputType: "url",
  riskScore: 75,
  threatLevel: "High",
  threatType: "Phishing",
  indicators: [
    {
      type: "suspicious-tld",
      severity: "high",
      description: "Uses suspicious .xyz TLD",
      evidence: "paypa1-secure.xyz",
    },
  ],
  explanation: "This URL appears to be a phishing attempt.",
  recommendedActions: ["Do not visit this URL", "Report to authorities"],
  urls: ["https://paypa1-secure.xyz/verify"],
  investigationTimeline: [
    {
      timestamp: "2025-01-01T00:00:00Z",
      event: "URL analyzed",
      source: "url-analyzer",
    },
  ],
  urduExplanation: null,
  createdAt: "2025-01-01T00:00:00Z",
};
