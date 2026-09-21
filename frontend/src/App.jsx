import { useState, useRef } from "react";
import axios from "axios";
import "./App.css";

const PRESET_PROMPTS = [
  { label: "🦺 PPE & Safety", query: "helmet, person, vest" },
  { label: "🔥 Fire Safety", query: "fire extinguisher, smoke, fire" },
  { label: "🏗️ Infrastructure", query: "crack, damaged pipe, ladder" },
  { label: "🚗 Traffic & Vehicles", query: "car, truck, person, bicycle" },
  { label: "📦 Warehouse", query: "box, forklift, person, pallet" },
];

const COLOR_PALETTE = {
  person: "#3b82f6",
  helmet: "#10b981",
  vest: "#f59e0b",
  "fire extinguisher": "#ef4444",
  crack: "#f43f5e",
  "damaged pipe": "#8b5cf6",
  car: "#06b6d4",
  truck: "#0284c7",
  forklift: "#d97706",
  box: "#64748b",
};

function getBoxColor(label) {
  const normalized = label.toLowerCase();
  if (COLOR_PALETTE[normalized]) return COLOR_PALETTE[normalized];
  // Deterministic fallback color for dynamic classes
  let hash = 0;
  for (let i = 0; i < normalized.length; i++) {
    hash = normalized.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 75%, 45%)`;
}

function App() {
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });
  const [prompt, setPrompt] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const fileInputRef = useRef(null);

  const processFile = (file) => {
    if (!file || !file.type.startsWith("image/")) {
      setErrorMessage("Please select a valid image file (PNG, JPG, WEBP).");
      return;
    }
    setErrorMessage("");
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
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const handleReset = () => {
    setImage(null);
    setPreview(null);
    setResult(null);
    setErrorMessage("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDetect = async (e) => {
    if (e) e.preventDefault();
    if (!image) {
      setErrorMessage("Please upload or drag an inspection image first.");
      return;
    }
    if (!prompt.trim()) {
      setErrorMessage("Please enter detection classes or pick a preset prompt.");
      return;
    }

    setErrorMessage("");
    const formData = new FormData();
    formData.append("image", image);
    formData.append("prompt", prompt);

    try {
      setLoading(true);
      const response = await axios.post("http://127.0.0.1:8000/detect", formData);
      setResult(response.data);
    } catch (error) {
      console.error(error);
      setErrorMessage("Detection request failed. Make sure the FastAPI backend is running on port 8000.");
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

  let riskTitle = "Visual Inspection Summary";
  let riskMessage = "Objects detected successfully across the scene.";
  let riskLevel = "Informational";
  let riskType = "info"; // info | success | warning | danger

  if (detectedLabels.includes("helmet") && detectedLabels.includes("person")) {
    const persons = objectCounts["person"] || 0;
    const helmets = objectCounts["helmet"] || 0;
    const coverage = persons > 0 ? Math.min(100, Math.round((helmets / persons) * 100)) : 0;

    riskTitle = "PPE & Workplace Safety Compliance";
    if (coverage >= 80) {
      riskLevel = "Optimal Safety (Low Risk)";
      riskType = "success";
      riskMessage = `${coverage}% safety helmet compliance detected (${helmets}/${persons} workers protected).`;
    } else if (coverage >= 50) {
      riskLevel = "Moderate Risk";
      riskType = "warning";
      riskMessage = `${coverage}% helmet coverage detected. ${persons - helmets} worker(s) may lack required PPE.`;
    } else {
      riskLevel = "Critical Violation (High Risk)";
      riskType = "danger";
      riskMessage = `Critical safety gap: Only ${coverage}% helmet coverage (${persons - helmets} worker(s) unhelmeted).`;
    }
  } else if (detectedLabels.includes("fire extinguisher")) {
    riskTitle = "Fire Safety Equipment Status";
    riskLevel = "Equipment Verified";
    riskType = "success";
    riskMessage = `${objectCounts["fire extinguisher"]} active fire extinguisher unit(s) verified in inspection view.`;
  } else if (detectedLabels.includes("crack") || detectedLabels.includes("damaged pipe")) {
    riskTitle = "Structural & Hazard Warning";
    riskLevel = "Maintenance Required";
    riskType = "danger";
    riskMessage = "Structural damage, cracks, or compromised pipes detected requiring immediate review.";
  }

  const avgConfidence = detections.length > 0
    ? Math.round((detections.reduce((acc, d) => acc + d.confidence, 0) / detections.length) * 100)
    : 0;

  return (
    <div className="app-layout">
      {/* Top Navbar */}
      <header className="navbar">
        <div className="nav-container">
          <div className="brand">
            <div className="brand-logo">
              <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
                <path d="M12 2L4 6v6.09c0 5.05 3.41 9.76 8 10.91 4.59-1.15 8-5.86 8-10.91V6l-8-4zm0 2.18l6 3v4.91c0 4.14-2.73 8.02-6 9.11-3.27-1.09-6-4.97-6-9.11V7.18l6-3zM11 7h2v6h-2V7zm0 8h2v2h-2v-2z" />
              </svg>
            </div>
            <div>
              <span className="brand-title">VisionGuard <span className="badge-ai">AI</span></span>
              <span className="brand-subtitle">Zero-Shot Open-Vocabulary Visual Inspection</span>
            </div>
          </div>

          <div className="nav-status">
            <span className="status-indicator">
              <span className="status-ping"></span>
              <span className="status-core"></span>
            </span>
            <span className="status-text">YOLO-World v2 Online</span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="main-content">
        {/* Error Notification */}
        {errorMessage && (
          <div className="error-banner">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>{errorMessage}</span>
            <button className="error-close" onClick={() => setErrorMessage("")}>&times;</button>
          </div>
        )}

        {/* Primary Control Card */}
        <section className="card card-primary">
          <div className="card-header">
            <div>
              <h2 className="card-title">Visual Inspection Studio</h2>
              <p className="card-desc">
                Upload workplace photos, facility imagery, or site feeds to detect any target object in real-time.
              </p>
            </div>
            {preview && (
              <button onClick={handleReset} className="btn-secondary btn-sm">
                Reset Image
              </button>
            )}
          </div>

          {/* Upload Dropzone / Image Display */}
          {!preview ? (
            <div
              className={`dropzone ${isDragging ? "dragging" : ""}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                onChange={handleImageChange}
                style={{ display: "none" }}
              />
              <div className="dropzone-icon">
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
              </div>
              <h3 className="dropzone-heading">Drop inspection image here</h3>
              <p className="dropzone-hint">
                or <span className="link-text">click to browse from files</span> (JPG, PNG, WebP)
              </p>
            </div>
          ) : (
            <div className="inspection-viewport">
              <div className="image-stage">
                <img src={preview} alt="Inspection Target" className="stage-image" />

                {/* Bounding Box Overlays */}
                {result &&
                  detections.map((item, index) => {
                    const boxColor = getBoxColor(item.label);
                    const left = (item.box[0] / imageDimensions.width) * 100;
                    const top = (item.box[1] / imageDimensions.height) * 100;
                    const width = ((item.box[2] - item.box[0]) / imageDimensions.width) * 100;
                    const height = ((item.box[3] - item.box[1]) / imageDimensions.height) * 100;

                    return (
                      <div
                        key={index}
                        className="box-overlay"
                        style={{
                          left: `${left}%`,
                          top: `${top}%`,
                          width: `${width}%`,
                          height: `${height}%`,
                          borderColor: boxColor,
                          boxShadow: `0 0 0 1px ${boxColor}33, inset 0 0 8px ${boxColor}22`,
                        }}
                      >
                        <span
                          className="box-tag"
                          style={{
                            backgroundColor: boxColor,
                          }}
                        >
                          <span className="tag-name">{item.label}</span>
                          <span className="tag-conf">{(item.confidence * 100).toFixed(0)}%</span>
                        </span>
                      </div>
                    );
                  })}
              </div>

              <div className="stage-footer">
                <span className="stage-info">
                  📐 {imageDimensions.width} × {imageDimensions.height} px
                </span>
                <button
                  type="button"
                  className="btn-link"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Replace photo
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleImageChange}
                  style={{ display: "none" }}
                />
              </div>
            </div>
          )}

          {/* Prompt Configuration */}
          <form onSubmit={handleDetect} className="prompt-section">
            <label className="form-label">
              <span>Detection Classes & Open Vocabulary Prompt</span>
              <span className="label-helper">Comma-separated classes</span>
            </label>

            <div className="prompt-input-wrapper">
              <div className="input-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </div>
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g. helmet, person, safety vest, forklift, fire extinguisher..."
                className="input-text"
              />
              <button
                type="submit"
                disabled={loading || !image}
                className="btn-primary"
              >
                {loading ? (
                  <>
                    <span className="btn-spinner"></span>
                    <span>Analyzing...</span>
                  </>
                ) : (
                  <>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                    </svg>
                    <span>Run AI Detection</span>
                  </>
                )}
              </button>
            </div>

            {/* Quick Presets */}
            <div className="presets-row">
              <span className="presets-label">Quick Presets:</span>
              <div className="preset-pills">
                {PRESET_PROMPTS.map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    className={`preset-btn ${prompt === preset.query ? "active" : ""}`}
                    onClick={() => setPrompt(preset.query)}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          </form>
        </section>

        {/* Results Section */}
        {result && (
          <section className="results-container">
            {/* Safety Assessment Card */}
            <div className={`assessment-card risk-${riskType}`}>
              <div className="assessment-icon">
                {riskType === "success" && "🛡️"}
                {riskType === "warning" && "⚠️"}
                {riskType === "danger" && "🚨"}
                {riskType === "info" && "🔍"}
              </div>
              <div className="assessment-body">
                <div className="assessment-top">
                  <h3 className="assessment-title">{riskTitle}</h3>
                  <span className={`risk-badge badge-${riskType}`}>{riskLevel}</span>
                </div>
                <p className="assessment-text">{riskMessage}</p>
              </div>
            </div>

            {/* Metric Summary Cards */}
            <div className="metrics-grid">
              <div className="metric-card">
                <span className="metric-label">Total Detections</span>
                <span className="metric-value">{detections.length}</span>
                <span className="metric-sub">Objects localized</span>
              </div>
              <div className="metric-card">
                <span className="metric-label">Identified Classes</span>
                <span className="metric-value">{detectedLabels.length}</span>
                <span className="metric-sub">Unique categories</span>
              </div>
              <div className="metric-card">
                <span className="metric-label">Avg. Confidence</span>
                <span className="metric-value">{avgConfidence}%</span>
                <span className="metric-sub">Model certainty</span>
              </div>
              <div className="metric-card">
                <span className="metric-label">Safety Status</span>
                <span className={`metric-value status-color-${riskType}`}>
                  {riskType === "danger" ? "Alert" : riskType === "warning" ? "Caution" : "Normal"}
                </span>
                <span className="metric-sub">Site evaluation</span>
              </div>
            </div>

            {/* Object Category Legend */}
            {detectedLabels.length > 0 && (
              <div className="legend-card">
                <h4 className="legend-heading">Class Breakdown</h4>
                <div className="legend-chips">
                  {Object.entries(objectCounts).map(([label, count]) => {
                    const color = getBoxColor(label);
                    return (
                      <div key={label} className="legend-chip">
                        <span className="chip-dot" style={{ backgroundColor: color }}></span>
                        <span className="chip-name">{label}</span>
                        <span className="chip-count">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Detailed Object Findings */}
            <div className="findings-section">
              <h3 className="findings-title">Individual Object Localizations ({detections.length})</h3>
              <div className="findings-grid">
                {detections.map((item, index) => {
                  const boxColor = getBoxColor(item.label);
                  const confPct = Math.round(item.confidence * 100);

                  return (
                    <div key={index} className="finding-card">
                      <div className="finding-header">
                        <div className="finding-label-group">
                          <span className="finding-dot" style={{ backgroundColor: boxColor }}></span>
                          <strong className="finding-label">{item.label}</strong>
                        </div>
                        <span className="finding-conf" style={{ color: boxColor }}>
                          {confPct}%
                        </span>
                      </div>

                      <div className="conf-track">
                        <div
                          className="conf-bar"
                          style={{
                            width: `${confPct}%`,
                            backgroundColor: boxColor,
                          }}
                        ></div>
                      </div>

                      <div className="finding-footer">
                        <span className="coords-tag">
                          [{item.box.map((v) => Math.round(v)).join(", ")}]
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

export default App;