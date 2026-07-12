import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/axiosConfig";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./TripDetailsPage.css";
import TripPackingList from "../components/TripPackingList";
import TripNotes from "../components/TripNotes";
import TripPhotos from "../components/TripPhotos";

const TripDetailsPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [trip, setTrip] = useState(null);

    useEffect(() => {
        const fetchTripDetails = async () => {
            try {
                const res = await api.get(`/trips/${id}`);
                setTrip(res.data?.data || null);
            } catch (err) {
                console.error("Failed to fetch trip details", err);
                toast.error(err.response?.data?.message || "Failed to fetch trip details");
            }
        };
        fetchTripDetails();
    }, [id]);

    if (!trip) return <p>Loading trip details...</p>;

    return (
        <div className="trip-details-page">

            <h1>
                Trip Details of 🌍{" "}
                <span style={{ color: "#3a009e", fontWeight: "700" }}>
                    {trip.destination}
                </span>{" "}
                Trip
            </h1>

            <button className="back-btn" onClick={() => navigate(-1)}>← Back</button>

            <div className="trip-details-container">
                {/* Trip Basics */}
                <div className="card">
                    <h2>Trip Basics</h2>
                    <p><strong>Destination:</strong> {trip.destination}</p>
                    <p><strong>Start Date:</strong> {trip.startDate || "dd-mm-yyyy"}</p>
                    <p><strong>End Date:</strong> {trip.endDate || "dd-mm-yyyy"}</p>
                    <p><strong>Total Days:</strong> {trip.totalDays}</p>
                    <p><strong>Trip Type:</strong> {trip.tripType || "Solo"}</p>
                </div>

                {/* Travel & Stay */}
                <div className="card">
                    <h2>Travel & Stay</h2>
                    <p><strong>Travel Mode:</strong> {trip.travelMode || "Flight"}</p>
                    <p><strong>Accommodation:</strong> {trip.accommodation || "Hotel"}</p>
                    <p><strong>Room Type:</strong> {trip.roomType || "Private"}</p>
                    <p><strong>Laundry:</strong> {trip.laundry ? "Yes" : "No"}</p>
                    <p><strong>Budget:</strong> {trip.budget || "Medium"}</p>
                </div>

                {/* Lifestyle & Comfort */}
                <div className="card">
                    <h2>Lifestyle & Comfort</h2>
                    <p><strong>Weather Sensitivity:</strong> {trip.weatherSensitivity ?? "Normal"}</p>
                    <p><strong>Activity Level:</strong> {trip.activityLevel ?? "Moderate"}</p>
                    <p><strong>Shopping Plan:</strong> {trip.shopping ? "Yes" : "No"}</p>
                    <p><strong>Photography / Video Gear:</strong> {trip.photographyGear === true ? "Yes" : "No"}</p>
                    <p><strong>Work Laptop:</strong> {trip.workLaptop === true ? "Yes" : "No"}</p>
                </div>

                {/* Food & Health */}
                <div className="card">
                    <h2>Food & Health</h2>
                    <p>
                        <strong>Food Preference:</strong>{" "}
                        {trip.foodPreference ? trip.foodPreference : "No preference"}
                    </p>
                    <p>
                        <strong>Dietary Notes:</strong>{" "}
                        {trip.dietaryNotes && trip.dietaryNotes.trim() !== ""
                            ? trip.dietaryNotes
                            : "-"}
                    </p>
                    <p>
                        <strong>Medical Notes:</strong>{" "}
                        {trip.medicalNotes && trip.medicalNotes.trim() !== ""
                            ? trip.medicalNotes
                            : "-"}
                    </p>
                </div>

                {/* Travelers */}
                <div className="card">
                    <h2>Travelers Information</h2>
                    <p><strong>Kids:</strong> {trip.kids || 0}</p>
                    <p><strong>Elders:</strong> {trip.elders || 0}</p>
                    {trip.peoples && trip.peoples.map((person, index) => (
                        <div key={index} className="traveler-card">
                            <p><strong>Traveler {index + 1}:</strong> {person.name || "None"}</p>
                            <p>Age: {person.age || "None"}</p>
                            <p>Gender: {person.gender || "None"}</p>
                            <p>Medical Notes: {person.medicalNotes || "None"}</p>
                        </div>
                    ))}
                </div>

                {/* Packing List */}
                <TripPackingList
                    trip={trip}
                    setTrip={setTrip}
                    id={id}
                    toast={toast}
                />

                {/* Notes & Learnings */}
                <TripNotes
                    trip={trip}
                    setTrip={setTrip}
                    id={id}
                    toast={toast}
                />
            </div>

            {/* Photos Section */}
            <TripPhotos
                trip={trip}
                setTrip={setTrip}
                id={id}
                toast={toast}
            />
        </div>
    );
};

export default TripDetailsPage;
