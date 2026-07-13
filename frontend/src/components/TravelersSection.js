import React from "react";

export default function TravelersSection({ trip, handleChange, addTraveler, removeTraveler }) {
    return (
        <section className="card travelers-card">
            <h2>Travelers Information</h2>

            <div className="travelers-summary">
                <div>
                    <label>Kids</label>
                    <input
                        type="number"
                        name="kids"
                        min="0"
                        value={trip.kids ?? ""}
                        onChange={handleChange}
                        onKeyDown={(e) => {
                            if (["e", "E", "+", "-", "."].includes(e.key)) {
                                e.preventDefault();
                            }
                        }}
                    />
                </div>
                <div>
                    <label>Elders</label>
                    <input
                        type="number"
                        name="elders"
                        min="0"
                        value={trip.elders ?? ""}
                        onChange={handleChange}
                        onKeyDown={(e) => {
                            if (["e", "E", "+", "-", "."].includes(e.key)) {
                                e.preventDefault();
                            }
                        }}
                    />
                </div>
            </div>

            {(trip.people || []).map((p, i) => (
                <div key={i} className="traveler-card">
                    <div className="traveler-header">
                        <h3>Traveler {i + 1}</h3>
                        <button
                            type="button"
                            className="remove-traveler-btn"
                            onClick={() => removeTraveler(i)}
                        >
                            X
                        </button>
                    </div>
                    <div className="traveler-fields">
                        <div>
                            <label>Name</label>
                            <input
                                type="text"
                                placeholder="Full Name"
                                value={p.name || ""}
                                onChange={e => handleChange(e, i, "name")}
                            />
                        </div>
                        <div>
                            <label>Age</label>
                            <input
                                type="number"
                                min="0"
                                placeholder="Age"
                                value={p.age || ""}
                                onChange={e => handleChange(e, i, "age")}
                                onKeyDown={(e) => {
                                    if (["e", "E", "+", "-", "."].includes(e.key)) {
                                        e.preventDefault();
                                    }
                                }}
                            />
                        </div>
                        <div>
                            <label>Gender</label>
                            <select value={p.gender} onChange={e => handleChange(e, i, "gender")}>
                                <option>Female</option>
                                <option>Male</option>
                                <option>Other</option>
                            </select>
                        </div>
                        <div>
                            <label>Medical Notes</label>
                            <input
                                type="text"
                                placeholder="Any medical info"
                                value={p.medical || ""}
                                onChange={e => handleChange(e, i, "medical")}
                            />
                        </div>
                    </div>
                </div>
            ))}

            <button type="button" className="add-traveler-btn" onClick={addTraveler}>
                + Add Traveler
            </button>
        </section>
    );
}
