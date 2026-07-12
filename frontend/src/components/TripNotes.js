import React, { useEffect, useState, useRef } from "react";
import api from "../api/axiosConfig";

const TripNotes = ({ trip, setTrip, id, toast }) => {
    const [notes, setNotes] = useState([]);
    const [showAdd, setShowAdd] = useState(false);
    const noteTextRef = useRef(null);
    const [selectedNoteIndex, setSelectedNoteIndex] = useState(null);
    const [isEditMode, setIsEditMode] = useState(false);
    const [deleteModal, setDeleteModal] = useState({ show: false, noteIdx: null });

    useEffect(() => {
        if (trip && Array.isArray(trip.notes)) {
            setNotes(trip.notes);
        }
    }, [trip]);

    const handleDeleteNote = async (idx) => {
        const updatedNotes = notes.filter((_, i) => i !== idx);
        try {
            await api.put(`/trips/${id}`, { notes: updatedNotes });
            setNotes(updatedNotes);
            setTrip({ ...trip, notes: updatedNotes });
            toast.success("Note deleted successfully");
        } catch (err) {
            console.error("Failed to delete note", err.response?.data?.message || err.message);
            toast.error(err.response?.data?.message || "Failed to delete note");
        }
    };

    const handleSaveNote = async () => {
        if (!noteTextRef.current) return;
        
        const currentText = noteTextRef.current.value;
        if (!currentText.trim()) return;

        noteTextRef.current.value = "";
        setShowAdd(false);

        let updatedNotes = [...notes];
        if (isEditMode && selectedNoteIndex !== null) {
            updatedNotes[selectedNoteIndex] = { ...updatedNotes[selectedNoteIndex], text: currentText, date: new Date().toLocaleString() };
        } else {
            updatedNotes.push({ text: currentText, date: new Date().toLocaleString() });
        }

        try {
            await api.put(`/trips/${id}`, { notes: updatedNotes });
            setNotes(updatedNotes);
            setTrip({ ...trip, notes: updatedNotes });
            setIsEditMode(false);
            setSelectedNoteIndex(null);
            toast.success(isEditMode ? "Note updated successfully!" : "Note saved successfully!");
        } catch (err) {
            console.error("Failed to save note", err);
            toast.error(err.response?.data?.message || "Failed to save note");
        }
    };

    const handleEditNote = (idx) => {
        setIsEditMode(true);
        setSelectedNoteIndex(idx);
        setShowAdd(true);
        setTimeout(() => {
            if (noteTextRef.current) {
                noteTextRef.current.value = notes[idx].text;
                noteTextRef.current.focus();
            }
        }, 50);
    };

    return (
        <div className="card notes-card">
            <div className="notes-header">
                <h2>Notes & Learnings</h2>
            </div>

            {/* Add Note Section */}
            {showAdd && (
                <div className="add-note-section">
                    <textarea
                        placeholder="Write your note here..."
                        ref={noteTextRef}
                        defaultValue={""}
                    />
                    <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                        <button 
                            className="modal-btn cancel-btn"
                            onClick={() => {
                                setShowAdd(false);
                                setIsEditMode(false);
                                setSelectedNoteIndex(null);
                            }}
                        >
                            Cancel
                        </button>
                        <button 
                            className="save-note-btn" 
                            onPointerDown={(e) => e.preventDefault()}
                            onClick={handleSaveNote}
                        >
                            {isEditMode ? "Save Edits" : "Save Note"}
                        </button>
                    </div>
                </div>
            )}
            {!showAdd && (
                <button className="add-note-btn" onClick={() => setShowAdd(true)}>
                    + Add Note
                </button>
            )}

            {/* Notes List */}
            <div className="notes-container">
                {notes && notes.length > 0 ? (
                    notes.map((note, idx) => (
                        <div key={idx} className="note-wrapper">
                            <div className="note-thumb">
                                {/* Edit button */}
                                <button
                                    className="note-edit-btn"
                                    onClick={() => handleEditNote(idx)}
                                    title="Edit Note"
                                >
                                    ✎
                                </button>
                                {/* X button */}
                                <button
                                    className="note-delete-btn"
                                    onClick={() => setDeleteModal({ show: true, noteIdx: idx })}
                                    title="Delete Note"
                                >
                                    ×
                                </button>

                                <p>{note.text}</p>
                                <small>
                                    {new Date(note.date).toLocaleString()}
                                </small>
                            </div>
                        </div>
                    ))
                ) : (
                    <p>No notes added yet.</p>
                )}
            </div>

            {/* Custom Delete Modal */}
            {deleteModal.show && (
                <div className="delete-modal-overlay">
                    <div className="delete-modal">
                        <p>Are you sure you want to delete this note?</p>
                        <div className="delete-modal-buttons">
                            <button
                                className="modal-btn cancel-btn"
                                onClick={() => setDeleteModal({ show: false, noteIdx: null })}
                            >
                                Cancel
                            </button>
                            <button
                                className="modal-btn confirm-btn"
                                onClick={() => {
                                    handleDeleteNote(deleteModal.noteIdx);
                                    setDeleteModal({ show: false, noteIdx: null });
                                }}
                            >
                                Yes, Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TripNotes;
