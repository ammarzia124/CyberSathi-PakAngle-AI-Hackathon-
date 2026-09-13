import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAnalysis } from "../hooks/useAnalysis.js";
import UrlInput from "../components/input/UrlInput.jsx";
import TextInput from "../components/input/TextInput.jsx";
import FileUpload from "../components/input/FileUpload.jsx";

export default function Home() {
  const [url, setUrl] = useState("");
  const [message, setMessage] = useState("");
  const [screenshot, setScreenshot] = useState(null);
  const { loading, error, result, analyzeUrl, analyzeMessage, analyzeScreenshot } = useAnalysis();
  const navigate = useNavigate();

  const handleScan = async () => {
    const trimmedUrl = url.trim();
    const trimmedMessage = message.trim();

    if (!trimmedUrl && !trimmedMessage && !screenshot) {
      return;
    }

    try {
      let data;
      if (trimmedUrl) {
        data = await analyzeUrl(trimmedUrl);
      } else if (trimmedMessage) {
        data = await analyzeMessage(trimmedMessage);
      } else if (screenshot) {
        data = await analyzeScreenshot(screenshot);
      }

      if (data?.reportId) {
        navigate(`/report/${data.reportId}`);
      }
    } catch {
      // error is handled by useAnalysis hook
    }
  };

  return (
    <div className="app">
      <section className="hero">
        <div className="hero-content">
          <span className="badge">
            AI-Powered Cyber Threat Detection
          </span>
          <h1>
            Stay Safe From
            <span> Digital Threats</span>
          </h1>
          <p>
            Analyze suspicious links, messages and screenshots with
            CyberSathi and understand cyber threats in simple language.
          </p>
          <button
            className="primary-btn"
            onClick={() =>
              document
                .getElementById("scan")
                .scrollIntoView({ behavior: "smooth" })
            }
          >
            Start Security Scan
          </button>
        </div>
      </section>

      <section className="scan-section" id="scan">
        <div className="section-heading">
          <span>SECURITY SCAN</span>
          <h2>What would you like to check?</h2>
          <p>Provide suspicious content and CyberSathi will analyze it.</p>
        </div>

        <div className="scan-grid">
          <div className="scan-card">
            <div className="card-icon">&#x1f517;</div>
            <h3>Suspicious URL</h3>
            <p>Check a website or suspicious link.</p>
            <UrlInput value={url} onChange={setUrl} loading={loading} />
          </div>

          <div className="scan-card">
            <div className="card-icon">&#x1f4ac;</div>
            <h3>Suspicious Message</h3>
            <p>Analyze a suspicious SMS, email or message.</p>
            <TextInput value={message} onChange={setMessage} loading={loading} />
          </div>

          <div className="scan-card">
            <div className="card-icon">&#x1f4f8;</div>
            <h3>Screenshot</h3>
            <p>Upload a screenshot for analysis.</p>
            <FileUpload onChange={setScreenshot} loading={loading} />
          </div>
        </div>

        <div className="scan-action">
          <button
            className="scan-btn"
            onClick={handleScan}
            disabled={loading || (!url.trim() && !message.trim() && !screenshot)}
          >
            {loading ? "Analyzing threat..." : "\uD83D\uDD0D Analyze Threat"}
          </button>
        </div>

        {error && <p className="form-error">{error}</p>}
      </section>

      <section className="about-section" id="about">
        <div className="section-heading">
          <span>ABOUT CYBERSATHI</span>
          <h2>Understand threats before they become harm.</h2>
          <p>
            CyberSathi combines clear security analysis with practical guidance
            so people can make safer decisions about suspicious messages and links.
          </p>
        </div>
      </section>
    </div>
  );
}
