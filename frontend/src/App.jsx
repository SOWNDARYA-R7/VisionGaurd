import { useState } from "react";
import axios from "axios";
import "./App.css";

function App() {
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [prompt, setPrompt] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleImageChange = (e) => {
    const file = e.target.files[0];

    if (file) {
      setImage(file);
      setPreview(URL.createObjectURL(file));
      setResult(null);
    }
  };

  const handleDetect = async () => {
    if (!image || !prompt.trim()) {
      alert("Please upload an image and enter a detection prompt.");
      return;
    }

    const formData = new FormData();
    formData.append("image", image);
    formData.append("prompt", prompt);

    try {
      setLoading(true);

      const response = await axios.post(
        "http://127.0.0.1:8000/detect",
        formData
      );

      setResult(response.data);
    } catch (error) {
      console.error(error);
      alert("Detection failed. Please check the AI server.");
    } finally {
      setLoading(false);
    }
  };

  const detections = result?.detections || [];

  const helmetCount = detections.filter(
    (item) => item.label.toLowerCase() === "helmet"
  ).length;

  const personCount = detections.filter(
    (item) => item.label.toLowerCase() === "person"
  ).length;

  return (
    <div className="page">
      <div className="container">

        {/* Header */}
        <header className="header">
          <div>
            <h1 className="title">🛡️ VisionGuard AI</h1>
            <p className="subtitle">
              Open-Vocabulary Visual Inspection Platform
            </p>
          </div>

          <div className="status">
            <span className="status-dot"></span>
            AI Model Online
          </div>
        </header>

        {/* Inspection Card */}
        <div className="card">
          <h2>AI Visual Inspection</h2>

          <p className="description">
            Upload an image and describe what you want the AI to detect.
          </p>

          <div className="input-group">
            <label className="label">Upload Image</label>

            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
            />
          </div>

          {preview && (
            <div className="preview-container">
              <img
                src={preview}
                alt="Preview"
                className="preview"
              />
            </div>
          )}

          <div className="input-group">
            <label className="label">
              Detection Prompt
            </label>

            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Example: helmet, person, fire extinguisher"
              className="text-input"
            />
          </div>

          <button
            onClick={handleDetect}
            disabled={loading}
            className="detect-button"
          >
            {loading ? "🔄 Analyzing..." : "🔍 Detect Objects"}
          </button>
        </div>

        {/* Results */}
        {result && (
          <div className="results-section">

            <h2>Detection Results</h2>

            {/* Stats */}
            <div className="stats-container">

              <div className="stat-card">
                <div className="stat-number">
                  {detections.length}
                </div>
                <div>Total Objects</div>
              </div>

              <div className="stat-card">
                <div className="stat-number">
                  {personCount}
                </div>
                <div>Persons</div>
              </div>

              <div className="stat-card">
                <div className="stat-number">
                  {helmetCount}
                </div>
                <div>Helmets</div>
              </div>

            </div>

            {/* Prompt */}
            <div className="prompt-box">
              <strong>Detected Classes:</strong>{" "}
              {Array.isArray(result.prompt)
                ? result.prompt.join(", ")
                : result.prompt}
            </div>

            {/* Detection Cards */}
            <div className="detection-grid">

              {detections.map((item, index) => (
                <div className="detection-card" key={index}>

                  <div className="detection-header">
                    <strong>{item.label}</strong>

                    <span className="confidence">
                      {(item.confidence * 100).toFixed(0)}%
                    </span>
                  </div>

                  <div className="bar-background">
                    <div
                      className="bar"
                      style={{
                        width: `${item.confidence * 100}%`,
                      }}
                    ></div>
                  </div>

                  <p className="coordinates">
                    Bounding Box: [
                    {item.box
                      .map((value) => Number(value).toFixed(0))
                      .join(", ")}
                    ]
                  </p>

                </div>
              ))}

            </div>

          </div>
        )}

      </div>
    </div>
  );
}

export default App;