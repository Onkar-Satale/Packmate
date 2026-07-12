import React, { useEffect, useState, useContext } from "react";

import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import api from "../api/axiosConfig";
import { toast } from "react-toastify";
import "./AccountPage.css";

const AccountPage = () => {
    const { user, logout } = useContext(AuthContext); // ✅ REAL USER + LOGOUT
    const [trips, setTrips] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // ✅ delete modal state (ADDED)
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [tripToDelete, setTripToDelete] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // ✅ delete account modal state (ADDED)
    const [showAccountDeleteModal, setShowAccountDeleteModal] = useState(false);
    const [isDeletingAccount, setIsDeletingAccount] = useState(false);

    const capitalize = (str) => {
        if (!str) return "";
        return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    };

    // ---------------- FETCH TRIPS ----------------
    const fetchTrips = async () => {
        try {
            setLoading(true);
            setError("");
            if (!localStorage.getItem("token")) {
                navigate("/login");
                return;
            }

            const res = await api.get('/trips');

            setTrips(res.data.data || []);
        } catch (err) {
            console.error("Failed to fetch trips", err);
            if (err.response?.status === 401) {
                localStorage.removeItem("token");
                navigate("/login");
            } else {
                setError("Failed to load trips. Please try again.");
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTrips();
    }, []);

    // ---------------- DELETE TRIP (CONFIRMED) ----------------
    const confirmDeleteTrip = async () => {
        if (!tripToDelete) return;

        setIsDeleting(true);

        try {


            await api.delete(`/trips/${tripToDelete}`);

            // ✅ remove card instantly
            setTrips((prev) => prev.filter((t) => t._id !== tripToDelete));

            setShowDeleteModal(false);
            setTripToDelete(null);
            toast.success("Trip successfully deleted!");
        } catch (err) {
            console.error("Failed to delete trip", err);
            toast.error("Failed to delete trip");
        } finally {
            setIsDeleting(false);
        }
    };

    // ---------------- DELETE ACCOUNT (CONFIRMED) ----------------
    const confirmDeleteAccount = async () => {
        setIsDeletingAccount(true);

        try {
            await api.delete(`/delete-account`);
            setShowAccountDeleteModal(false);
            logout();
            navigate("/");
        } catch (err) {
            console.error("Failed to delete account", err);
            alert("Failed to delete account. Please try again.");
        } finally {
            setIsDeletingAccount(false);
        }
    };

    // ---------------- SEE DETAILS ----------------
    const handleSeeDetails = (tripId) => {
        navigate(`/trip/${tripId}`);
    };

    // ---------------- FILTER ----------------
    const filteredTrips = trips.filter((trip) =>
        (trip.destination || "").toLowerCase().includes(searchTerm.toLowerCase())
    );

    // ---------------- AUTH CHECK ----------------
    if (!user) {
        return (
            <div style={{ textAlign: "center", padding: "50px" }}>
                <h2>Please login to view your account</h2>
            </div>
        );
    }

    if (loading) return <p>Loading trips...</p>;

    return (
        <div className="account-page-container" style={{ position: "relative" }}>
            <div className="account-page-content">

                {user && (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "20px" }}>
                        <h1 style={{ margin: 0, textAlign: "center" }}>
                            Welcome, {capitalize(user.firstName)} {user.lastName ? capitalize(user.lastName) : ""}!
                        </h1>
                    </div>
                )}

                {error && <p className="error-message" style={{ color: "red", textAlign: "center" }}>{error}</p>}

                {/* Search */}
                <div className="trip-search">
                    <input
                        type="text"
                        placeholder="Search trips by destination..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <h2>Your Trips</h2>
                <p><strong>Total Trips:</strong> {trips.length}</p>

                <br></br>

                {trips.length === 0 ? (
                    <p>You haven't planned any trips yet.</p>
                ) : filteredTrips.length === 0 ? (
                    <p>No results found for "{searchTerm}".</p>
                ) : null}

                <div className="trip-cards">
                    {filteredTrips.map((trip) => (
                        <div key={trip._id} className="trip-card">

                            {/* ❌ DELETE BUTTON (UPDATED) */}
                            <button
                                className="delete-trip-btn"
                                onClick={() => {
                                    setTripToDelete(trip._id);
                                    setShowDeleteModal(true);
                                }}
                            >
                                X
                            </button>

                            <h3>🌍 {trip.destination || "Unknown"}</h3>
                            <p><strong>🗓️ Start Date:</strong> {new Date(trip.startDate).toLocaleDateString()}</p>
                            <p><strong>🗓️ End Date:</strong> {new Date(trip.endDate).toLocaleDateString()}</p>
                            <p><strong>🗓️ Total Days:</strong> {trip.totalDays}</p>
                            <p><strong>👤 Trip Type:</strong> {trip.tripType || "Solo"}</p>
                            <p><strong>✈️ Travel:</strong> {trip.travelMode || "Flight"}</p>
                            <p><strong>🏨 Stay:</strong> {trip.accommodation || "Hotel"}</p>
                            <p><strong>💰 Budget:</strong> {trip.budget || "Medium"}</p>

                            <button
                                className="details-btn"
                                onClick={() => handleSeeDetails(trip._id)}
                            >
                                See Details
                            </button>
                        </div>
                    ))}
                </div>

                {/* ✅ DELETE ACCOUNT BUTTON AT BOTTOM */}
                {user && (
                    <div className="delete-account-container">
                        <button 
                            className="delete-account-btn" 
                            onClick={() => setShowAccountDeleteModal(true)}
                        >
                            Delete Account
                        </button>
                    </div>
                )}
            </div>

            {/* ✅ CUSTOM DELETE MODAL */}
            {showDeleteModal && (
                <div className="delete-modal-overlay">
                    <div className="delete-modal">
                        <h3>Delete Trip?</h3>
                        <p>This action cannot be undone.</p>

                        <div className="delete-modal-actions">
                            <button
                                className="cancel-btn"
                                onClick={() => {
                                    setShowDeleteModal(false);
                                    setTripToDelete(null);
                                }}
                            >
                                Cancel
                            </button>

                            <button
                                className="confirm-delete-btn"
                                onClick={confirmDeleteTrip}
                                disabled={isDeleting}
                            >
                                {isDeleting ? 'Deleting...' : 'Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ✅ CUSTOM DELETE ACCOUNT MODAL */}
            {showAccountDeleteModal && (
                <div className="delete-modal-overlay">
                    <div className="delete-modal" style={{ textAlign: "center" }}>
                        <h3>Delete Account?</h3>
                        <p>This action cannot be undone. Are you sure?</p>

                        <div className="delete-modal-actions" style={{ display: "flex", justifyContent: "center", gap: "10px", marginTop: "20px" }}>
                            <button
                                className="cancel-btn"
                                onClick={() => setShowAccountDeleteModal(false)}
                            >
                                No
                            </button>

                            <button
                                className="confirm-delete-btn"
                                onClick={confirmDeleteAccount}
                                disabled={isDeletingAccount}
                            >
                                {isDeletingAccount ? 'Deleting...' : 'Yes'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AccountPage;
