import React, { useState } from "react";
import api from "../api/axiosConfig";

const TripPhotos = ({ trip, setTrip, id, toast }) => {
    const [selectedPhotos, setSelectedPhotos] = useState([]);
    const [deletePhotoModal, setDeletePhotoModal] = useState({ show: false });
    const [isUploading, setIsUploading] = useState(false);
    const [photoEditMode, setPhotoEditMode] = useState(false);
    const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
    const [lightboxOpen, setLightboxOpen] = useState(false);

    // Lightbox handlers
    const openLightbox = (index) => {
        setCurrentPhotoIndex(index);
        setLightboxOpen(true);
    };

    const prevPhoto = () => {
        setCurrentPhotoIndex((prev) => (prev === 0 ? trip.photos.length - 1 : prev - 1));
    };

    const nextPhoto = () => {
        setCurrentPhotoIndex((prev) => (prev === trip.photos.length - 1 ? 0 : prev + 1));
    };

    const closeLightbox = () => setLightboxOpen(false);

    const handleAddPhotos = async (e) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;
        setIsUploading(true);

        const formData = new FormData();
        Array.from(files).forEach((file) => formData.append("photos", file));

        try {
            const res = await api.put(`/trips/${id}/upload`, formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            setTrip({ ...trip, photos: res.data?.data?.photos || [] });
            toast.success("Photos uploaded successfully!");
        } catch (err) {
            console.error("Failed to upload photos", err);
            toast.error(err.response?.data?.message || "Failed to upload photos");
        } finally {
            setIsUploading(false);
        }
    };

    const togglePhotoSelect = (index) => {
        setSelectedPhotos((prev) =>
            prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
        );
    };

    const handleDeleteSelectedPhotos = () => {
        setDeletePhotoModal({ show: true });
    };

    const confirmDeleteSelectedPhotos = async () => {
        const remainingPhotos = trip.photos.filter((_, index) => !selectedPhotos.includes(index));

        try {
            await api.put(`/trips/${id}`, { photos: remainingPhotos });
            setTrip({ ...trip, photos: remainingPhotos });
            setSelectedPhotos([]);
            setDeletePhotoModal({ show: false });
            toast.success("Photos deleted successfully!");
        } catch (err) {
            console.error("Failed to delete photos", err);
            toast.error(err.response?.data?.message || "Failed to delete photos");
        }
    };

    const selectAllPhotos = () => {
        if (!trip.photos) return;
        setSelectedPhotos(trip.photos.map((_, index) => index));
    };

    return (
        <div className="card photos-card">
            <div className="photos-header">
                <h2>Photos</h2>

                <div style={{ display: "flex", gap: "8px" }}>
                    {photoEditMode && trip.photos?.length > 0 && (
                        <button
                            className="edit-photos-btn"
                            onClick={selectAllPhotos}
                        >
                            Select All
                        </button>
                    )}

                    <button
                        className="edit-photos-btn"
                        onClick={() => {
                            setPhotoEditMode(!photoEditMode);
                            setSelectedPhotos([]);
                        }}
                    >
                        {photoEditMode ? "Cancel" : "Edit"}
                    </button>
                </div>
            </div>

            {/* Add Photo Button */}
            <label className="add-photo-btn" style={{ opacity: isUploading ? 0.6 : 1, pointerEvents: isUploading ? "none" : "auto" }}>
                {isUploading ? "Uploading..." : "+ Add Photos"}
                <input
                    type="file"
                    multiple
                    accept="image/*"
                    disabled={isUploading}
                    hidden
                    onChange={handleAddPhotos}
                />
            </label>

            {photoEditMode && selectedPhotos.length > 0 && (
                <button className="delete-photo-btn" onClick={handleDeleteSelectedPhotos}>
                    🗑 Delete Selected
                </button>
            )}

            <div className="photos-container">
                {trip.photos && trip.photos.length > 0 ? (
                    trip.photos.map((photo, i) => {
                        const baseURL = process.env.REACT_APP_API_URL?.replace("/api", "") || "";
                        const photoURL = photo.startsWith("http") ? photo : `${baseURL}${photo}`;
                        return (
                            <div key={i} className="photo-wrapper">
                                {photoEditMode && (
                                    <input
                                        type="checkbox"
                                        className="photo-checkbox"
                                        checked={selectedPhotos.includes(i)}
                                        onChange={() => togglePhotoSelect(i)}
                                    />
                                )}
                                <img
                                    src={photoURL}
                                    alt={`Trip item ${i + 1}`}
                                    onClick={() => !photoEditMode && openLightbox(i)}
                                    className="photo-thumb"
                                />
                            </div>
                        );
                    })
                ) : (
                    <p>No photos added yet.</p>
                )}
            </div>

            {/* Lightbox Modal */}
            {lightboxOpen && trip.photos && trip.photos.length > 0 && (
                <div
                    className="lightbox-overlay"
                    onClick={(e) =>
                        e.target.classList.contains("lightbox-overlay") && closeLightbox()
                    }
                >
                    <div className="lightbox-content">
                        {/* Close button top-right */}
                        <button className="lightbox-close" onClick={closeLightbox}>
                            X
                        </button>

                        {/* Photo */}
                        <img
                            src={
                                trip.photos[currentPhotoIndex].startsWith("http")
                                    ? trip.photos[currentPhotoIndex]
                                    : `${process.env.REACT_APP_API_URL?.replace("/api", "") || ""}${trip.photos[currentPhotoIndex]}`
                            }
                            alt={`Trip item ${currentPhotoIndex + 1}`}
                            className="lightbox-photo"
                        />

                        {/* Navigation buttons */}
                        {trip.photos.length > 1 && (
                            <>
                                <button className="lightbox-prev" onClick={prevPhoto}>
                                    ‹
                                </button>
                                <button className="lightbox-next" onClick={nextPhoto}>
                                    ›
                                </button>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* Custom Delete Photo Modal */}
            {deletePhotoModal.show && (
                <div className="delete-modal-overlay">
                    <div className="delete-modal">
                        <p>Do you want to delete these photos?</p>
                        <div className="delete-modal-buttons">
                            <button
                                className="modal-btn cancel-btn"
                                onClick={() => setDeletePhotoModal({ show: false })}
                            >
                                No
                            </button>
                            <button
                                className="modal-btn confirm-btn"
                                onClick={confirmDeleteSelectedPhotos}
                            >
                                Yes
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TripPhotos;
