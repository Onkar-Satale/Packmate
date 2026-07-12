import React, { useState } from "react";
import api from "../api/axiosConfig";

export default function SuitcaseAnalyzer({ packingList, setPackingList, trip, onClose }) {
    const [suitcaseImage, setSuitcaseImage] = useState(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisResult, setAnalysisResult] = useState(null);
    const [analysisError, setAnalysisError] = useState("");
    const [checkedItemsState, setCheckedItemsState] = useState({});

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (!file.type.startsWith("image/")) {
            setAnalysisError("❌ Please upload a valid image file.");
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            setSuitcaseImage(reader.result);
            setAnalysisError("");
        };
        reader.onerror = () => {
            setAnalysisError("❌ Failed to read image file.");
        };
        reader.readAsDataURL(file);
    };

    const clearImage = () => {
        setSuitcaseImage(null);
        setAnalysisResult(null);
        setAnalysisError("");
    };

    const cleanNameForMatching = (name) => {
        if (!name) return "";
        // eslint-disable-next-line no-control-regex
        let clean = name.replace(/[^\u0000-\uFFFF]|[\u2600-\u27BF]|[\u2300-\u23FF]|[\u2B50-\u2B55]|[\u2934-\u2935]|[\uFE00-\uFE0F]/g, '');
        clean = clean.replace(/\s+/g, ' ').trim();
        return clean;
    };

    const toggleItemChecked = (itemName) => {
        setCheckedItemsState(prev => ({
            ...prev,
            [itemName]: !prev[itemName]
        }));
    };

    const confirmAndUpdatePackingList = () => {
        const updatedPackingList = [];
        
        packingList.forEach(section => {
            const filteredItems = [];
            if (Array.isArray(section.items)) {
                section.items.forEach(item => {
                    const originalName = item.name || item;
                    const cleanName = cleanNameForMatching(originalName);
                    
                    // If checked (match by exact originalName with emojis)
                    if (checkedItemsState[originalName]) {
                        filteredItems.push({
                            name: cleanName,
                            quantity: item.quantity || ""
                        });
                    }
                });
            }
            
            if (filteredItems.length > 0) {
                updatedPackingList.push({
                    category: section.category,
                    items: filteredItems
                });
            }
        });
        
        setPackingList(updatedPackingList);
        
        // Reset suitcase analyzer view back to initial upload level and hide analyzer card
        setSuitcaseImage(null);
        setAnalysisResult(null);
        setAnalysisError("");
        setCheckedItemsState({});
        if (onClose) onClose();
    };

    const analyzeSuitcase = async () => {
        if (!suitcaseImage) {
            setAnalysisError("⚠️ Please upload a photo of your suitcase first.");
            return;
        }

        setIsAnalyzing(true);
        setAnalysisError("");
        setAnalysisResult(null);

        const flatPackingList = [];
        packingList.forEach(section => {
            flatPackingList.push(section.category);
            if (Array.isArray(section.items)) {
                section.items.forEach(item => {
                    flatPackingList.push(item.name || item);
                });
            }
        });

        const payload = {
            image_base64: suitcaseImage,
            packing_list: flatPackingList,
            destination: trip.destination,
            duration: trip.totalDays || 1,
            activities: trip.activities || "None",
            start_date: trip.startDate,
            end_date: trip.endDate
        };

        try {
            const res = await api.post("/ai/analyze-suitcase", payload);
            setAnalysisResult(res.data);

            // Initialize checkbox checked states based on recommendations:
            // Must Pack -> Checked (true)
            // Optional -> Checked (true)
            // Remove -> Unchecked (false)
            const initialChecked = {};
            const mustPack = res.data.categorized_items?.["Must Pack"] || [];
            const optional = res.data.categorized_items?.["Optional"] || [];
            const remove = res.data.categorized_items?.["Remove"] || [];

            mustPack.forEach(item => {
                initialChecked[item.original_item] = true;
            });
            optional.forEach(item => {
                initialChecked[item.original_item] = true;
            });
            remove.forEach(item => {
                initialChecked[item.original_item] = false;
            });

            setCheckedItemsState(initialChecked);
        } catch (err) {
            console.error("Suitcase analysis failed:", err.response?.data?.message || err.message);
            setAnalysisError(`❌ ${err.response?.data?.message || "Failed to analyze suitcase. Please try again."}`);
        } finally {
            setIsAnalyzing(false);
        }
    };

    return (
        <section className="card suitcase-analyzer-card">
            <h2>🧳 AI Vision Suitcase Analyzer</h2>
            <p className="suitcase-subtitle">
                Please upload a clear photo of your own empty, open suitcase or travel bag taken from the top. Do not upload images of people, animals, vehicles, random objects, or unrelated scenes.
            </p>

            <div className="upload-section">
                {!suitcaseImage ? (
                    <div className="dropzone">
                        <input
                            type="file"
                            accept="image/*"
                            id="suitcase-upload"
                            onChange={handleImageChange}
                            style={{ display: "none" }}
                        />
                        <label htmlFor="suitcase-upload" className="upload-label">
                            <div className="upload-icon">📸</div>
                            <span>Click to upload suitcase photo</span>
                        </label>
                    </div>
                ) : (
                    <div className="preview-container">
                        <img src={suitcaseImage} alt="Suitcase Preview" className="suitcase-preview" />
                        <button onClick={clearImage} className="remove-image-btn">
                            Remove Photo
                        </button>
                    </div>
                )}
            </div>

            {analysisError && <div className="analysis-error">{analysisError}</div>}

            <button
                onClick={analyzeSuitcase}
                disabled={isAnalyzing || !suitcaseImage}
                className="analyze-btn"
            >
                {isAnalyzing ? "⏳ Analyzing Suitcase..." : "🔍 Analyze My Suitcase"}
            </button>

            {analysisResult && (
                <div className="analysis-results">
                    <div className="metrics-row">
                        <div className="metric-pill size-pill">
                            <span className="metric-label">Estimated Size</span>
                            <span className="metric-value">{analysisResult.suitcase_size}</span>
                        </div>
                        <div className="metric-pill capacity-pill">
                            <span className="metric-label">Estimated Capacity</span>
                            <span className="metric-value">{analysisResult.approximate_capacity}</span>
                        </div>
                    </div>

                    <div className="comparison-card">
                        <h4>Capacity Review</h4>
                        <p>{analysisResult.comparison_summary}</p>
                    </div>

                    <div className="recommendations-container">
                        <div className="recommendation-column must-pack">
                            <h4 className="column-title">Must Pack</h4>
                            <div className="column-items">
                                {analysisResult.categorized_items?.["Must Pack"]?.map((item, idx) => (
                                    <div key={idx} className="rec-item">
                                        <label className="checkbox-wrapper">
                                            <input
                                                type="checkbox"
                                                checked={!!checkedItemsState[item.original_item]}
                                                onChange={() => toggleItemChecked(item.original_item)}
                                            />
                                            <span className="checkmark"></span>
                                            <div className="item-text-wrapper">
                                                <span className="rec-name">{item.item}</span>
                                                <span className="rec-exp">{item.explanation}</span>
                                            </div>
                                        </label>
                                    </div>
                                ))}
                                {(!analysisResult.categorized_items?.["Must Pack"] || 
                                  analysisResult.categorized_items["Must Pack"].length === 0) && (
                                    <p className="no-items">No items suggested.</p>
                                )}
                            </div>
                        </div>

                        <div className="recommendation-column optional">
                            <h4 className="column-title">Optional</h4>
                            <div className="column-items">
                                {analysisResult.categorized_items?.["Optional"]?.map((item, idx) => (
                                    <div key={idx} className="rec-item">
                                        <label className="checkbox-wrapper">
                                            <input
                                                type="checkbox"
                                                checked={!!checkedItemsState[item.original_item]}
                                                onChange={() => toggleItemChecked(item.original_item)}
                                            />
                                            <span className="checkmark"></span>
                                            <div className="item-text-wrapper">
                                                <span className="rec-name">{item.item}</span>
                                                <span className="rec-exp">{item.explanation}</span>
                                            </div>
                                        </label>
                                    </div>
                                ))}
                                {(!analysisResult.categorized_items?.["Optional"] || 
                                  analysisResult.categorized_items["Optional"].length === 0) && (
                                    <p className="no-items">No items suggested.</p>
                                )}
                            </div>
                        </div>

                        <div className="recommendation-column remove">
                            <h4 className="column-title">Remove</h4>
                            <div className="column-items">
                                {analysisResult.categorized_items?.["Remove"]?.map((item, idx) => (
                                    <div key={idx} className="rec-item">
                                        <label className="checkbox-wrapper">
                                            <input
                                                type="checkbox"
                                                checked={!!checkedItemsState[item.original_item]}
                                                onChange={() => toggleItemChecked(item.original_item)}
                                            />
                                            <span className="checkmark"></span>
                                            <div className="item-text-wrapper">
                                                <span className="rec-name">{item.item}</span>
                                                <span className="rec-exp">{item.explanation}</span>
                                            </div>
                                        </label>
                                    </div>
                                ))}
                                {(!analysisResult.categorized_items?.["Remove"] || 
                                  analysisResult.categorized_items["Remove"].length === 0) && (
                                    <p className="no-items">No items suggested.</p>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="confirm-section" style={{ marginTop: "40px", borderTop: "1px solid #e2e8f0", paddingTop: "25px", display: "flex", justifyContent: "center" }}>
                        <button
                            onClick={confirmAndUpdatePackingList}
                            className="confirm-update-btn"
                        >
                            🎯 Confirm & Update Packing List
                        </button>
                    </div>
                </div>
            )}
        </section>
    );
}
