import React from "react";

export default function PackingListSection({ packingList }) {
    if (!packingList || packingList.length === 0) return null;

    return (
        <section className="packing-list">
            <h2>Packing List</h2>

            {packingList.map((section, sectionIdx) => (
                <div key={section._id || sectionIdx} className="packing-section">
                    <h3>{section.category || "General"}</h3>
                    <div className="packing-items">
                        {Array.isArray(section.items) && section.items.map((item, itemIdx) => (
                            <div key={itemIdx} className="packing-item">
                                {item.name || item}
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </section>
    );
}
