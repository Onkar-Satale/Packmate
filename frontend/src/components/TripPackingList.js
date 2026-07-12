import React, { useState } from "react";
import api from "../api/axiosConfig";

const TripPackingList = ({ trip, setTrip, id, toast }) => {
    const [isTickingMode, setIsTickingMode] = useState(false);
    const [draftPackingList, setDraftPackingList] = useState([]);
    const [isSavingPackingList, setIsSavingPackingList] = useState(false);
    const [isDeleteMode, setIsDeleteMode] = useState(false);
    const [itemsToDelete, setItemsToDelete] = useState([]);

    const handleStartTicking = () => {
        setDraftPackingList(structuredClone(trip.packingList));
        setIsTickingMode(true);
    };

    const handleCancelTicking = () => {
        setIsTickingMode(false);
        setDraftPackingList([]);
    };

    const handleResetTicking = () => {
        const updatedDraft = draftPackingList.map(section => ({
            ...section,
            items: section.items.map(item => {
                if (typeof item === "string") return { name: item, completed: false };
                return { ...item, completed: false };
            })
        }));
        setDraftPackingList(updatedDraft);
    };

    const handleSaveTicking = async () => {
        try {
            setIsSavingPackingList(true);
            await api.put(`/trips/${id}`, { packingList: draftPackingList });
            setTrip({ ...trip, packingList: draftPackingList });
            setIsTickingMode(false);
            toast.success("Packing list saved!");
        } catch (err) {
            console.error("Failed to save packing list", err);
            toast.error(err.response?.data?.message || "Failed to save packing list");
        } finally {
            setIsSavingPackingList(false);
        }
    };

    const handleToggleDraftItem = (sectionIdx, itemIdx) => {
        const updatedDraft = [...draftPackingList];
        const items = [...updatedDraft[sectionIdx].items];
        if (typeof items[itemIdx] === "string") {
            items[itemIdx] = { name: items[itemIdx], completed: true };
        } else {
            items[itemIdx] = { ...items[itemIdx], completed: !items[itemIdx].completed };
        }
        updatedDraft[sectionIdx] = { ...updatedDraft[sectionIdx], items };
        setDraftPackingList(updatedDraft);
    };

    const handleStartDeleteMode = () => {
        setIsDeleteMode(true);
        setItemsToDelete([]);
        setIsTickingMode(false);
    };

    const handleCancelDeleteMode = () => {
        setIsDeleteMode(false);
        setItemsToDelete([]);
    };

    const handleToggleDeleteSelect = (sectionIdx, itemIdx) => {
        const key = `${sectionIdx}-${itemIdx}`;
        setItemsToDelete((prev) => 
            prev.includes(key) ? prev.filter((i) => i !== key) : [...prev, key]
        );
    };

    const handleDeleteSelectedItems = async () => {
        if (itemsToDelete.length === 0) return;

        const updatedPackingList = trip.packingList.map((section, sIdx) => {
            return {
                ...section,
                items: section.items.filter((_, iIdx) => !itemsToDelete.includes(`${sIdx}-${iIdx}`))
            };
        }).filter((section) => section.items.length > 0);

        try {
            setIsSavingPackingList(true);
            await api.put(`/trips/${id}`, { packingList: updatedPackingList });
            setTrip({ ...trip, packingList: updatedPackingList });
            setIsDeleteMode(false);
            setItemsToDelete([]);
            toast.success("Selected items deleted!");
        } catch (err) {
            console.error("Failed to delete items", err);
            toast.error(err.response?.data?.message || "Failed to delete items");
        } finally {
            setIsSavingPackingList(false);
        }
    };

    return (
        <div className="card packing-list-card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px", flexWrap: "wrap", gap: "10px" }}>
                <h2 style={{ margin: 0 }}>Packing List</h2>
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                    {!isTickingMode && !isDeleteMode ? (
                        <>
                            <button className="edit-photos-btn" onClick={handleStartTicking} style={{ backgroundColor: "#3a009e", color: "white", borderColor: "#3a009e" }}>
                                ✅ Start Ticking
                            </button>
                            <button className="edit-photos-btn" onClick={handleStartDeleteMode} style={{ borderColor: "#ef4444", color: "#ef4444" }}>
                                🗑 Delete Items
                            </button>
                        </>
                    ) : isTickingMode ? (
                        <>
                            <button className="edit-photos-btn" onClick={handleResetTicking} style={{ borderColor: "#f97316", color: "#f97316" }}>
                                🔄 Refresh
                            </button>
                            <button className="edit-photos-btn" onClick={handleCancelTicking}>
                                ❌ Cancel
                            </button>
                            <button className="edit-photos-btn" onClick={handleSaveTicking} style={{ backgroundColor: "#10b981", color: "white", borderColor: "#10b981", opacity: isSavingPackingList ? 0.6 : 1, cursor: isSavingPackingList ? "not-allowed" : "pointer" }} disabled={isSavingPackingList}>
                                {isSavingPackingList ? "💾 Saving..." : "💾 Save"}
                            </button>
                        </>
                    ) : (
                        <>
                            <button className="edit-photos-btn" onClick={handleCancelDeleteMode}>
                                ❌ Cancel
                            </button>
                            <button 
                                className="edit-photos-btn" 
                                onClick={itemsToDelete.length > 0 ? handleDeleteSelectedItems : undefined}
                                style={{ 
                                    backgroundColor: itemsToDelete.length > 0 ? "#ef4444" : "transparent",
                                    color: itemsToDelete.length > 0 ? "white" : "#ef4444",
                                    borderColor: "#ef4444", 
                                    opacity: isSavingPackingList ? 0.6 : 1, 
                                    cursor: isSavingPackingList || itemsToDelete.length === 0 ? "not-allowed" : "pointer" 
                                }} 
                                disabled={isSavingPackingList || itemsToDelete.length === 0}
                            >
                                {isSavingPackingList ? "🗑 Deleting..." : (itemsToDelete.length > 0 ? `🗑 Delete Selected (${itemsToDelete.length})` : "🗑 Select Items")}
                            </button>
                        </>
                    )}
                </div>
            </div>

            {trip.packingList && trip.packingList.length > 0 ? (
                (isTickingMode ? draftPackingList : trip.packingList).map((section, idx) => (
                    <div key={section._id || idx} className="packing-section">
                        <h3>{section.category}</h3>

                        <ul>
                            {section.items.map((item, i) => {
                                const isCompleted = typeof item === "string" ? false : item.completed;
                                // Remove any stray newlines from generated item text to prevent wrapping
                                const itemName = typeof item === "string" ? item.replace(/\n/g, ' ') : item.name.replace(/\n/g, ' ');
                                return (
                                    <li key={i} style={{ 
                                        display: "flex", 
                                        justifyContent: "flex-start", 
                                        alignItems: "center", 
                                        gap: "10px", 
                                        marginBottom: "8px",
                                        textAlign: "left",
                                        width: "100%"
                                    }}>
                                        {isTickingMode && (
                                            <input 
                                                type="checkbox" 
                                                checked={isCompleted} 
                                                onChange={() => handleToggleDraftItem(idx, i)} 
                                                style={{ margin: 0, flexShrink: 0, cursor: "pointer", width: "18px", height: "18px" }}
                                            />
                                        )}
                                        {isDeleteMode && (
                                            <input 
                                                type="checkbox" 
                                                checked={itemsToDelete.includes(`${idx}-${i}`)} 
                                                onChange={() => handleToggleDeleteSelect(idx, i)} 
                                                style={{ margin: 0, flexShrink: 0, cursor: "pointer", width: "18px", height: "18px", accentColor: "#ef4444" }}
                                            />
                                        )}
                                        <span style={{ 
                                            textDecoration: isCompleted ? "line-through" : "none", 
                                            color: isDeleteMode && itemsToDelete.includes(`${idx}-${i}`) ? "#ef4444" : (isCompleted ? "#888" : "#333"),
                                            display: "flex",
                                            alignItems: "center",
                                            whiteSpace: "nowrap",
                                            overflow: "hidden",
                                            textOverflow: "ellipsis",
                                            textAlign: "left",
                                        }}>
                                            {itemName}
                                        </span>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                ))
            ) : (
                <p>No packing list generated yet.</p>
            )}
        </div>
    );
};

export default TripPackingList;
