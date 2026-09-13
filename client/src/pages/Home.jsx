import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAnalysis } from "../hooks/useAnalysis.js";
import UrlInput from "../components/input/UrlInput.jsx";
import TextInput from "../components/input/TextInput.jsx";
import FileUpload from "../components/input/FileUpload.jsx";
import { RiskBadge } from "../components/report/RiskBadge.jsx";

const TABS = [
  { id: "url", label: "URL" },
  { id: "message", label: "Message" },
  { id: "screenshot", label: "Screenshot" },
];

export default function Home() {
  const [activeTab, setActiveTab] = useState("url");
  const { loading, error, result, analyzeUrl, analyzeMessage, analyzeScreenshot } = useAnalysis();
  const navigate = useNavigate();

  const handleAnalysisComplete = (data) => {
    if (data?.reportId) {
      navigate(`/report/${data.reportId}`);
    }
  };

  const handleUrlSubmit = async (url) => {
    const data = await analyzeUrl(url);
    handleAnalysisComplete(data);
  };

  const handleMessageSubmit = async (text) => {
    const data = await analyzeMessage(text);
    handleAnalysisComplete(data);
  };

  const handleScreenshotUpload = async (file) => {
    const data = await analyzeScreenshot(file);
    handleAnalysisComplete(data);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-2xl w-full mx-auto p-8">
        <h1 className="text-4xl font-bold text-center mb-2">CyberSathi</h1>
        <p className="text-gray-600 text-center mb-8">
          AI Digital Safety Agent for Pakistan
        </p>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex border-b mb-4">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
              {error}
            </div>
          )}

          <div className="space-y-4">
            {activeTab === "url" && (
              <UrlInput onSubmit={handleUrlSubmit} loading={loading} />
            )}
            {activeTab === "message" && (
              <TextInput onSubmit={handleMessageSubmit} loading={loading} />
            )}
            {activeTab === "screenshot" && (
              <FileUpload onUpload={handleScreenshotUpload} loading={loading} />
            )}
          </div>

          {result && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg space-y-2">
              <h3 className="text-sm font-medium text-gray-700">Quick Result</h3>
              <RiskBadge score={result.riskScore} level={result.threatLevel} />
              <p className="text-sm text-gray-600">{result.explanation}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
