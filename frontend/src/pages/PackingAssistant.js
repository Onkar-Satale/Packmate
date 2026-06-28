import React, { useState, useEffect, useContext, useRef } from "react";
import api from "../api/axiosConfig";
import "./PackingAssistant.css";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

export default function PackingAssistant() {
    const [trip, setTrip] = useState(
        {
            destination: "",
            startDate: "",
            endDate: "",
            totalDays: 0,
            tripType: "Solo",

            travelMode: "Flight",
            accommodation: "Hotel",
            roomType: "Private",
            laundry: false,
            budget: "Medium",

            weatherSensitivity: "Normal",
            activityLevel: "Moderate",
            walkingLevel: "Moderate",
            shopping: false,
            photographyGear: false,
            workLaptop: false,
            techUsage: "Light",
            powerAdapter: "No",

            foodPreference: "No preference",
            dietaryNotes: "",
            medicalNotes: "",

            kids: 0,
            elders: 0,

            people: [{ name: "", age: "", gender: "Female", medical: "" }],
        });

    const [packingList, setPackingList] = useState([]);
    const [summary, setSummary] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);
    const [suitcaseImage, setSuitcaseImage] = useState(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisResult, setAnalysisResult] = useState(null);
    const [analysisError, setAnalysisError] = useState("");
    const [checkedItemsState, setCheckedItemsState] = useState({});
    const [showSuitcaseAnalyzer, setShowSuitcaseAnalyzer] = useState(false);
    const navigate = useNavigate();
    const { user, token, loading } = useContext(AuthContext);
    const debounceTimeout = useRef(null);

    const getTodayString = () => {
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
    };
    const todayString = getTodayString();

    // 🔥 RESTORE DATA ON PAGE RELOAD
    useEffect(() => {
        const savedTrip = sessionStorage.getItem("trip");
        const savedPackingList = sessionStorage.getItem("packingList");
        const savedSummary = sessionStorage.getItem("summary");
        const savedLastCheckedCity = sessionStorage.getItem("lastCheckedCity");

        if (savedTrip) {
            const parsed = JSON.parse(savedTrip);
            setTrip(prev => ({ ...prev, ...parsed }));
            if (savedLastCheckedCity) {
                lastCheckedCityRef.current = savedLastCheckedCity;
                
                // If the user had unverified edits when they refreshed, automatically verify them now!
                if (parsed.destination && parsed.destination.toLowerCase().trim() !== savedLastCheckedCity.toLowerCase().trim()) {
                    setTimeout(() => handleCityCorrectionAndPrefetch(parsed.destination, true), 50);
                }
            } else if (parsed.destination) {
                lastCheckedCityRef.current = parsed.destination;
            }
        }

        if (savedPackingList) {
            setPackingList(JSON.parse(savedPackingList));
            setShowSuitcaseAnalyzer(true);
        }

        if (savedSummary) {
            setSummary(savedSummary);
        }
        
        // This unmount function runs ONLY when clicking to another page (React Router navigation)
        // It does NOT run on a hard browser refresh (F5), which allows the data to survive refreshes!
        return () => {
            sessionStorage.removeItem("trip");
            sessionStorage.removeItem("packingList");
            sessionStorage.removeItem("summary");
            sessionStorage.removeItem("lastCheckedCity");
        };
    }, []);
    // Removed beforeunload listener because sessionStorage naturally clears on tab close, but we want it to survive page refreshes!


    // 🔥 AUTO CALCULATE DAYS
    useEffect(() => {
        if (trip.startDate && trip.endDate) {
            const start = new Date(trip.startDate);
            const end = new Date(trip.endDate);
            const diff = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
            setTrip(prev => ({ ...prev, totalDays: diff > 0 ? diff : 0 }));
        }
    }, [trip.startDate, trip.endDate]);
    const [formError, setFormError] = useState("");
    const [prefetchedTemp, setPrefetchedTemp] = useState(null);
    const [isCorrectingCity, setIsCorrectingCity] = useState(false);
    const [isDestinationFocused, setIsDestinationFocused] = useState(false);
    const lastCheckedCityRef = useRef("");
    const [showTempWarning, setShowTempWarning] = useState(false);

    const handleCityCorrectionAndPrefetch = async (city, force = false) => {
        if (!city) return;
        if (!force && city.toLowerCase().trim() === lastCheckedCityRef.current.toLowerCase().trim()) return;
        
        setIsCorrectingCity(true);
        setShowTempWarning(false);
        lastCheckedCityRef.current = city;

        try {
            const weatherRes = await api.post("/ai/prefetch-weather", { location: city });

            const correctedCity = weatherRes.data.location;
            const temp = weatherRes.data.temperature;

            setTrip(prev => ({ ...prev, destination: correctedCity }));
            setPrefetchedTemp(temp);
            lastCheckedCityRef.current = correctedCity;
            sessionStorage.setItem("lastCheckedCity", correctedCity);

            if (temp === null) {
                setShowTempWarning(true);
                setTimeout(() => setShowTempWarning(false), 5000);
            } else {
                setShowTempWarning(false);
            }
        } catch (err) {
            console.error("City correction failed:", err.response?.data?.message || err.message);
            setPrefetchedTemp(null);
            setShowTempWarning(true);
            setTimeout(() => setShowTempWarning(false), 5000);
        } finally {
            setIsCorrectingCity(false);
        }
    };

    // Triggered automatically on blur without enter key

    const handleChange = (e, idx = null, field = null) => {
        let { name, value } = e.target;
        let finalValue = value;

        const booleanFields = [
            "shopping",
            "photographyGear",
            "workLaptop",
            "laundry"
        ];

        let fieldName = idx !== null ? field : name;

        if (booleanFields.includes(name)) {
            finalValue = value === "true";
        }

        // 1. Numeric fields (kids, elders, age): ONLY digits
        if (["kids", "elders", "age"].includes(fieldName)) {
            finalValue = String(finalValue).replace(/\D/g, "");
        }

        // 2. Text fields (dietaryNotes, medicalNotes, medical, name, destination): ONLY text (no digits)
        if (["dietaryNotes", "medicalNotes", "medical", "name", "destination"].includes(fieldName)) {
            finalValue = String(finalValue).replace(/\d/g, "");
        }

        // 3. Location Auto-correction and capitalization
        if (fieldName === "destination") {
            let valStr = String(finalValue).toLowerCase();
            const typoMap = {
                "mumbaai": "Mumbai",
                "pune": "Pune",
                "delhi": "Delhi",
                "banglore": "Bangalore",
                "goa": "Goa"
            };

            if (typoMap[valStr]) {
                finalValue = typoMap[valStr];
            } else if (finalValue.length > 0) {
                // capitalize first letter automatically
                finalValue = finalValue.charAt(0).toUpperCase() + finalValue.slice(1);
            }
        }

        if (idx !== null) {
            const people = [...trip.people];
            people[idx][field] = finalValue;
            setTrip({ ...trip, people });
        } else {
            setTrip({ ...trip, [name]: finalValue });
        }
    };



    const addTraveler = () => {
        setTrip({
            ...trip,
            people: [...trip.people, { name: "", age: "", gender: "Female", medical: "" }]
        });
    };

    const generatePackingList = async () => {
        if (!token) {
            navigate("/login", { replace: true, state: { message: "Please login to generate a packing list" } });
            return;
        }

        setFormError(""); 
        if (!trip.destination || !trip.startDate || !trip.endDate) {
            setFormError("⚠️ Please enter destination, start date, and end date before generating your packing list.");
            return;
        }

        const todayDate = new Date();
        todayDate.setHours(0, 0, 0, 0);
        // Replace single hyphens to parse correctly across browsers
        const startDateParsed = new Date(trip.startDate.replace(/-/g, "/"));
        if (startDateParsed < todayDate) {
            setFormError("⚠️ Start date cannot be in the past.");
            return;
        }

        setIsLoading(true);
        setFormError("⏳ Please wait, AI is generating your list... (This can take up to 50 seconds on first run)");

        const payload = {
            location: trip.destination || "",
            start_date: trip.startDate,
            end_date: trip.endDate,
            days: trip.totalDays || 1,
            trip_type: trip.tripType || "Solo",
            purpose: trip.purpose || "Leisure",
            activities: trip.activities || "None",
            stay_type: trip.accommodation || "Hotel",
            budget: trip.budget || "Medium",
            food: trip.foodPreference || "No preference",
            luggage: trip.luggage || "Backpack",
            travel_type: trip.travelMode || "Flight",
            people: trip.people
                .map((p) => `${p.name || "Traveler"}, ${p.age || "N/A"} years, ${p.gender || "Female"}, Medical: ${p.medical || "None"}`)
                .join("\n"),
            temperature: prefetchedTemp
        };

        try {
            const res = await api.post("/ai/generate-packing-list", payload);
            const formattedList = formatPackingListForDB(res.data.packing_list);
            setPackingList(formattedList);
            setSummary(res.data.summary || "");
            setShowSuitcaseAnalyzer(true);
        } catch (err) {
            console.error("Generation failed:", err.response?.data?.message || err.message);
            setFormError(`❌ ${err.response?.data?.message || "Failed to generate packing list. Please try again."}`);
        } finally {
            setIsLoading(false);
            setFormError(""); 
        }
    };

    const formatPackingListForDB = (list) => {
        const sections = {};
        let current = "GENERAL";

        list.forEach(line => {
            const text = line.trim();
            if (!text) return;

            if (text === text.toUpperCase() && text.length < 30) {
                current = text;
                sections[current] = [];
            } else {
                if (!sections[current]) sections[current] = [];
                sections[current].push({
                    name: text,
                    quantity: ""
                });
            }
        });

        return Object.entries(sections).map(([category, items]) => ({
            category,
            items
        }));
    };


    const saveTrip = async () => {
        setFormError(""); 
        if (!trip.destination || !trip.startDate || !trip.endDate || trip.totalDays <= 0) {
            setFormError("⚠️ Please enter Trip Basics before saving the trip.");
            return;
        }

        if (packingList.length === 0) {
            setFormError("⚠️ Please generate packing list before saving.");
            return;
        }

        if (!token) {
            setFormError("⚠️ Please login first.");
            return;
        }

        try {
            setIsSaving(true);
            await api.post("/trips", {
                destination: trip.destination,
                startDate: trip.startDate,
                endDate: trip.endDate,
                totalDays: trip.totalDays || 1,
                tripType: trip.tripType,
                travelMode: trip.travelMode,
                accommodation: trip.accommodation,
                roomType: trip.roomType,
                laundry: trip.laundry,
                budget: trip.budget,
                weatherSensitivity: trip.weatherSensitivity,
                activityLevel: trip.activityLevel,
                shopping: trip.shopping,
                photographyGear: trip.photographyGear,
                workLaptop: trip.workLaptop,
                foodPreference: trip.foodPreference,
                dietaryNotes: trip.dietaryNotes,
                medicalNotes: trip.medicalNotes,
                kids: trip.kids,
                elders: trip.elders,
                peoples: trip.people.map(p => ({
                    name: p.name || "Traveler",
                    age: Number(p.age) || 0,
                    gender: p.gender || "Female",
                    medicalNotes: p.medical || ""
                })),
                packingList: packingList,
                notes: trip.notes || [],
                photos: trip.photos || []
            });
            setFormError("✅ Trip saved successfully!");
        } catch (err) {
            console.error("Save trip failed:", err.response?.data?.message || err.message);
            setFormError(`❌ ${err.response?.data?.message || "Failed to save trip. Try again."}`);
        } finally {
            setIsSaving(false);
        }
    };






    const downloadDocx = async () => {
        setFormError(""); // reset error
        if (packingList.length === 0) {
            setFormError("⚠️ Please generate packing list first.");
            return;
        }

        const flatPackingList = [];
        packingList.forEach(section => {
            flatPackingList.push(section.category);
            if (Array.isArray(section.items)) {
                section.items.forEach(item => {
                    flatPackingList.push(item.name || item);
                });
            }
        });

        // Map your React state to backend expected fields
        const payload = {
            summary: summary,
            packing_list: flatPackingList
        };

        try {
            setIsDownloading(true);
            const res = await api.post("/ai/download-packing-list", payload, { responseType: "blob" });

            const url = URL.createObjectURL(new Blob([res.data]));
            const a = document.createElement("a");
            a.href = url;
            a.download = "Smart_Packing_List.docx";
            a.click();
        } catch (err) {
            console.error("Download failed:", err.response?.data?.message || err.message);
            setFormError(`❌ ${err.response?.data?.message || "Failed to download DOCX. Please try again."}`);
        } finally {
            setIsDownloading(false);
        }
    };

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
        setShowSuitcaseAnalyzer(false);
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




    const removeTraveler = (index) => {
        const updated = [...trip.people];
        updated.splice(index, 1);
        setTrip({ ...trip, people: updated });
    };
    // Convert plain packing list into sections
    const parsePackingList = (list) => {
        const sections = {};
        let currentSection = "";

        list.forEach((line) => {
            line = line.trim();
            if (!line) return;

            // Section headers are all uppercase (short text)
            if (line === line.toUpperCase() && line.length < 30) {
                currentSection = line;
                sections[currentSection] = [];
            } else if (currentSection) {
                sections[currentSection].push(line);
            }
        });

        return sections; // { DOCUMENTS: [...], CLOTHING: [...], ... }
    };


    // 🔥 Step 2: Save trip to localStorage whenever it changes
    useEffect(() => {
        sessionStorage.setItem("trip", JSON.stringify(trip));
    }, [trip]);


    // 🔥 Step 3: Save packingList to localStorage whenever it changes
    useEffect(() => {
        sessionStorage.setItem("packingList", JSON.stringify(packingList));
    }, [packingList]);

    // 🔥 Step 4: Save summary to localStorage whenever it changes
    useEffect(() => {
        sessionStorage.setItem("summary", summary);
    }, [summary]);




    useEffect(() => {
        if (!loading && !user && !token) {
            navigate("/login", {
                replace: true,
                state: { message: "Please login to use Packing Assistant" }
            });
        }
    }, [user, token, loading, navigate]);





    return (
        <div className="container">
            <h1>🎒 Smart Packing Assistant</h1>

            {/* TRIP BASICS */}
            <section className="card">
                <h2>Trip Basics</h2>
                
                <div className="form-row">
                    <label>Destination City</label>
                    <div className="destination-wrapper" style={{ position: "relative" }}>
                        <input
                            type="text"
                            name="destination"
                            placeholder="Please enter valid destination."
                            value={trip.destination}
                            onChange={(e) => {
                                handleChange(e);
                                if (showTempWarning) setShowTempWarning(false);
                                setIsDestinationFocused(true);
                            }}
                            onBlur={(e) => {
                                setTimeout(() => setIsDestinationFocused(false), 200);
                                handleCityCorrectionAndPrefetch(e.target.value);
                            }}
                            autoComplete="off"
                        />
                        {isCorrectingCity && (
                            <span style={{ color: "#004adfff",position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", fontSize: "14px" }}>
                                ⏳ Autocorrecting...
                            </span>
                        )}
                    </div>
                    {isCorrectingCity && (
                        <div style={{ color: "#004adfff", fontSize: "14px", marginTop: "5px" }}>
                            You can continue filling out the rest of the form while we check this.
                        </div>
                    )}
                    
                    {showTempWarning && (
                        <div style={{ color: "#d97706ff", fontSize: "14px", marginTop: "5px" }}>
                            ⚠️ Temp not available for your destination. A general packing list will be generated.
                        </div>
                    )}

                </div>
                
                <div className="grid">
                    <div>
                        <label>Start Date</label>
                        <input
                            type="date"
                            name="startDate"
                            value={trip.startDate || ""}
                            onChange={handleChange}
                            min={todayString}
                            placeholder="Select start date"
                        />
                    </div>
                    <div>
                        <label>End Date</label>
                        <input
                            type="date"
                            name="endDate"
                            value={trip.endDate || ""}
                            onChange={handleChange}
                            min={trip.startDate || todayString}
                            placeholder="Select end date"
                        />
                    </div>
                </div>

                <label>Total Days</label>
                <input value={trip.totalDays} disabled />

                <label>Trip Type</label>
                <select
                    name="tripType"
                    value={trip.tripType}
                    onChange={handleChange}
                >
                    <option>Solo</option>
                    <option>Family</option>
                    <option>Couple</option>
                    <option>Friends</option>
                    <option>Business</option>
                    <option>Adventure</option>
                </select>
            </section>

            {/* TRAVEL & STAY */}
            <section className="card">
                <h2>Travel & Stay</h2>

                <div className="form-row">
                    <label>Travel Mode</label>
                    <select name="travelMode" value={trip.travelMode} onChange={handleChange}>
                        <option>Flight</option>
                        <option>Train</option>
                        <option>Car</option>
                        <option>Bus</option>
                    </select>
                </div>

                <div className="form-row">
                    <label>Accommodation</label>
                    <select name="accommodation" value={trip.accommodation} onChange={handleChange}>
                        <option>Hotel</option>
                        <option>Hostel</option>
                        <option>Resort</option>
                        <option>Homestay</option>
                    </select>
                </div>

                <div className="form-row">
                    <label>Room Type</label>
                    <select name="roomType" value={trip.roomType} onChange={handleChange}>
                        <option>Private</option>
                        <option>Shared</option>
                    </select>
                </div>

                <div className="form-row">
                    <label>Laundry</label>
                    <select name="laundry" value={trip.laundry} onChange={handleChange}>
                        <option value={false}>No</option>
                        <option value={true}>Yes</option>
                    </select>
                </div>

                <div className="form-row">
                    <label>Budget</label>
                    <select name="budget" value={trip.budget} onChange={handleChange}>
                        <option>Low</option>
                        <option>Medium</option>
                        <option>High</option>
                    </select>
                </div>
            </section>


            {/* LIFESTYLE & COMFORT */}
            <section className="card">
                <h2>Lifestyle & Comfort</h2>

                <div className="form-row">
                    <label>Weather Sensitivity</label>
                    <select
                        name="weatherSensitivity"
                        value={trip.weatherSensitivity}
                        onChange={handleChange}
                    >
                        <option>Normal</option>
                        <option>Cold Sensitive</option>
                        <option>Heat Sensitive</option>
                    </select>
                </div>

                <div className="form-row">
                    <label>Activity Level</label>
                    <select
                        name="activityLevel"
                        value={trip.activityLevel}
                        onChange={handleChange}
                    >
                        <option>Low</option>
                        <option>Moderate</option>
                        <option>High</option>
                    </select>
                </div>

                <div className="form-row">
                    <label>Shopping Plan</label>
                    <select
                        name="shopping"
                        value={trip.shopping}
                        onChange={handleChange}
                    >
                        <option value={false}>No</option>
                        <option value={true}>Yes</option>
                    </select>
                </div>

                <div className="form-row">
                    <label>Photography / Video Gear</label>
                    <select
                        name="photographyGear"
                        value={trip.photographyGear}
                        onChange={handleChange}
                    >
                        <option value={false}>No</option>
                        <option value={true}>Yes</option>
                    </select>
                </div>

                <div className="form-row">
                    <label>Work Laptop</label>
                    <select
                        name="workLaptop"
                        value={trip.workLaptop}
                        onChange={handleChange}
                    >
                        <option value={false}>No</option>
                        <option value={true}>Yes</option>
                    </select>
                </div>
            </section>


            {/* HEALTH & FOOD */}
            <section className="card">
                <h2>Food & Health</h2>

                <div className="form-row">
                    <label>Food Preference</label>
                    <select
                        name="foodPreference"
                        value={trip.foodPreference}
                        onChange={handleChange}
                    >
                        <option>No preference</option>
                        <option>Vegetarian</option>
                        <option>Vegan</option>
                        <option>Non-Veg</option>
                    </select>
                </div>

                <div className="form-row">
                    <label>Dietary Notes</label>
                    <input
                        name="dietaryNotes"
                        value={trip.dietaryNotes || ""}
                        placeholder="Allergies, restrictions..."
                        onChange={handleChange}
                    />
                </div>

                <div className="form-row">
                    <label>Medical Notes (Optional)</label>
                    <input
                        name="medicalNotes"
                        value={trip.medicalNotes || ""}
                        placeholder="Chronic conditions, medications..."
                        onChange={handleChange}
                    />
                </div>
            </section>

            {/* ================= TRAVELERS ================= */}
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

                <button className="add-traveler-btn" onClick={addTraveler}>
                    + Add Traveler
                </button>
            </section>

            {/* ACTIONS */}
            {formError && (
                <div className={formError.includes("✅") || formError.includes("⏳") ? "form-success-message" : "form-error-message"}>
                    {formError}
                </div>
            )}
            <div className="actions">
                <button
                    onClick={generatePackingList}
                    disabled={isLoading || isSaving || isDownloading || isCorrectingCity}
                    className="generate-btn"
                >
                    {isLoading ? "⏳ Generating..." : "🚀 Generate Packing List"}
                </button>
                <button 
                    onClick={downloadDocx} 
                    disabled={isLoading || isSaving || isDownloading || isCorrectingCity}
                    className="download-btn"
                >
                    {isDownloading ? "📥 Downloading..." : "📥 Download DOCX"}
                </button>
                <button 
                    onClick={saveTrip} 
                    disabled={isLoading || isSaving || isDownloading || isCorrectingCity}
                    className="save-btn"
                >
                    {isSaving ? "💾 Saving..." : "💾 Save Trip"}
                </button>
            </div>

            {packingList.length > 0 && (
                <section className="packing-list">
                    <h2>Packing List</h2>

                    {packingList.length > 0 && packingList.map((section, sectionIdx) => (
                        <div key={section._id || sectionIdx} className="packing-section">
                            <h3>{section.category || "General"}</h3>
                            <div className="packing-items">
                                {Array.isArray(section.items) && section.items.map((item, itemIdx) => (
                                    <div key={itemIdx} className="packing-item">
                                        {item.name || item} {/* will work even if item is string */}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </section>
            )}

            {packingList.length > 0 && showSuitcaseAnalyzer && (
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
            )}

        </div>
    );
}
