import { useState } from "react";
import axios from "axios";
import "./App.css";

function App() {
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);

  const [imageDimensions, setImageDimensions] = useState({
    width: 0,
    height: 0,
  });

  const [prompt, setPrompt] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleImageChange = (e) => {
    const file = e.target.files[0];

    if (file) {
      setImage(file);

      const objectUrl = URL.createObjectURL(file);
      setPreview(objectUrl);

      const img = new Image();

      img.onload = () => {
        setImageDimensions({
          width: img.naturalWidth,
          height: img.naturalHeight,
        });
      };

      img.src = objectUrl;

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

  const objectCounts = {};

  detections.forEach((item) => {
    const label = item.label.toLowerCase();

    objectCounts[label] = (objectCounts[label] || 0) + 1;
  });

  const detectedLabels = Object.keys(objectCounts);

  let riskTitle = "General Visual Inspection";
  let riskMessage = "Objects were detected successfully.";
  let riskLevel = "Informational";

  if (
    detectedLabels.includes("helmet") &&
    detectedLabels.includes("person")
  ) {
    const persons = objectCounts["person"];
    const helmets = objectCounts["helmet"];

    const coverage =
      persons > 0 ? Math.round((helmets / persons) * 100) : 0;

    if (coverage >= 80) {
      riskLevel = "Low Risk";
      riskMessage = `${coverage}% of detected persons have helmets.`;
    } else if (coverage > 50) {
      riskLevel = "Medium Risk";
      riskMessage = `${coverage}% helmet coverage detected. Some persons may require attention.`;
    } else {
      riskLevel = "High Risk";
      riskMessage = `Only ${coverage}% helmet coverage detected.`;
    }

    riskTitle = "Workplace Safety Analysis";
  } else if (detectedLabels.includes("fire extinguisher")) {
    riskTitle = "Fire Safety Analysis";
    riskLevel = "Detected";
    riskMessage =
      "A fire extinguisher was detected in the inspection image.";
  } else if (
    detectedLabels.includes("crack") ||
    detectedLabels.includes("damaged pipe")
  ) {
    riskTitle = "Infrastructure Analysis";
    riskLevel = "Attention Required";
    riskMessage = "Potential infrastructure damage was detected.";
  }
 
  const getBoxColor = (label) => {
  const colors = {
    person: "#2563eb",
    helmet: "#16a34a",
    "fire extinguisher": "#dc2626",
    crack: "#f59e0b",
    "damaged pipe": "#9333ea",
  };

  return colors[label.toLowerCase()] || "#0891b2";
};

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

          {/* Upload Image */}
          <div className="input-group">

            <label className="label">
              Upload Image
            </label>

            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
            />

          </div>

          {/* Image Preview + Bounding Boxes */}
          {preview && (
            <div className="preview-container">

              <div className="image-wrapper">

                <img
                  src={preview}
                  alt="Preview"
                  className="preview"
                />

                {result &&
                  detections.map((item, index) => (
                    <div
                      key={index}
                      className="bounding-box"
                      style={{
                      left: `${(item.box[0] / imageDimensions.width) * 100}%`,
                      top: `${(item.box[1] / imageDimensions.height) * 100}%`,
                      width: `${((item.box[2] - item.box[0]) / imageDimensions.width) * 100}%`,
                      height: `${((item.box[3] - item.box[1]) / imageDimensions.height) * 100}%`,
                      borderColor: getBoxColor(item.label),
                    }}
                    >
                      <span className="box-label"
                          style={{
                            background: getBoxColor(item.label),
                          }}
                        >
                          {item.label}{" "}
                          {(item.confidence * 100).toFixed(0)}%
                        </span>
                    </div>
                  ))}

              </div>

            </div>
          )}

          {result && detections.length > 0 && (
  <div className="object-legend">

    <h3>Detected Objects</h3>

    <div className="legend-items">
      {Object.entries(objectCounts).map(([label, count]) => (
        <div className="legend-item" key={label}>

          <span
            className="legend-color"
            style={{
              background: getBoxColor(label),
            }}
          ></span>

          <span className="legend-label">
            {label}
          </span>

          <span className="legend-count">
            {count}
          </span>

        </div>
      ))}
    </div>

  </div>
)}

          {/* Detection Prompt */}
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

          {/* Detect Button */}
          <button
            onClick={handleDetect}
            disabled={loading}
            className="detect-button"
          >
            {loading
              ? "🔄 Analyzing..."
              : "🔍 Detect Objects"}
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

                <div>
                  Total Objects
                </div>

              </div>

              {Object.entries(objectCounts).map(
                ([label, count]) => (
                  <div
                    className="stat-card"
                    key={label}
                  >

                    <div className="stat-number">
                      {count}
                    </div>

                    <div
                      style={{
                        textTransform: "capitalize",
                      }}
                    >
                      {label}
                    </div>

                  </div>
                )
              )}

            </div>

            {/* Prompt */}
            <div className="prompt-box">

              <strong>
                Detected Classes:
              </strong>{" "}

              {Array.isArray(result.prompt)
                ? result.prompt.join(", ")
                : result.prompt}

            </div>
  
            {/* Inspection Summary */}
<div className="inspection-summary">

  <h3>📊 Inspection Summary</h3>

  <div className="summary-grid">

    <div className="summary-item">
      <span>Objects Detected</span>
      <strong>{detections.length}</strong>
    </div>

    <div className="summary-item">
      <span>Classes Found</span>
      <strong>{detectedLabels.length}</strong>
    </div>

    <div className="summary-item">
      <span>Safety Status</span>
      <strong>{riskLevel}</strong>
    </div>

  </div>

</div>

            {/* Risk Analysis */}
            <div className="risk-card">


              <h3>
                🛡️ {riskTitle}
              </h3>

              <div className="risk-level">
                {riskLevel}
              </div>

              <p>
                {riskMessage}
              </p>

            </div>

            {/* Detection Cards */}
            <div className="detection-grid">

              {detections.map((item, index) => (

                <div
                  className="detection-card"
                  key={index}
                >

                  <div className="detection-header">

                    <strong>
                      {item.label}
                    </strong>

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
                      .map((value) =>
                        Number(value).toFixed(0)
                      )
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