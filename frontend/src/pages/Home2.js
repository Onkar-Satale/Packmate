import React, { useEffect, useState } from "react";
import './Home2.css'; // Import the CSS file
import feature1 from '../assets/3.png';
import feature2 from '../assets/4.png';
import feature3 from '../assets/5.png';



const Home2 = () => {
    const [visibleSections, setVisibleSections] = useState([]);
    const sectionsRef = React.useRef([]);

    useEffect(() => {
        const observerOptions = {
            root: null,
            threshold: 0.1, // Trigger when 10% of the section is visible
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    const index = sectionsRef.current.indexOf(entry.target);
                    setVisibleSections((prev) => {
                        if (!prev.includes(index)) {
                            return [...prev, index];
                        }
                        return prev;
                    });
                }
            });
        }, observerOptions);

        sectionsRef.current.forEach((section) => {
            if (section) observer.observe(section);
        });

        return () => {
            sectionsRef.current.forEach((section) => {
                if (section) observer.unobserve(section);
            });
        };
    }, []);

    return (
        <div>
            {/* Dark Section */}
            <section ref={(el) => (sectionsRef.current[0] = el)} className={`sectionDark fade-in ${visibleSections.includes(0) ? 'animate' : ''}`}>
                <h1 className="heading">
                    Discover How Our AI Packing Assistant Works
                </h1>
                <p className="subHeading">
                    Our AI-driven packing assistant simplifies your travel preparation by
                    providing personalized packing recommendations. Input your travel
                    details, and let our smart assistant consider weather, destination, and
                    activities to ensure you pack everything you need for a stress-free
                    journey.
                </p>
                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-around",
                        marginTop: "20px",
                    }}
                >
                    <div>
                        <h3>Input Details</h3>
                        <p>Enter your travel destination, dates, and planned activities.</p>
                    </div>
                    <div>
                        <h3>Get Suggestions</h3>
                        <p>Receive a tailored packing list based on your inputs.</p>
                    </div>
                </div>
            </section>

            {/* Light Section */}
            <section ref={(el) => (sectionsRef.current[1] = el)} className={`sectionLight fade-in ${visibleSections.includes(1) ? 'animate' : ''}`}>
                <h1 className="heading">Explore PackMate's Innovative Features</h1>
                <p className="subHeading">
                    PackMate's AI Packing Assistant offers a seamless travel preparation
                    experience. With personalized recommendations based on weather,
                    destination, and activities, it ensures you never miss an essential
                    item. The interactive animations make planning enjoyable, adapting to
                    your unique travel style for stress-free packing.
                </p>

                <div className="featureList">
                    {/* Feature 1 */}
                    <div className="featureItem">
                        <img src={feature1} alt="Personalized Packing" className="featureImage" />
                        <h3 className="featureTitle">Personalized Packing Suggestions</h3>
                        <p className="featureDescription">
                            Our AI analyzes your travel details to provide a customized
                            packing list, ensuring you have everything you need for your trip.
                        </p>
                        {/* <button className="button">Learn More</button> */}
                    </div>

                    {/* Feature 2 */}
                    <div className="featureItem">

                        <img src={feature2} alt="Weather-Based" className="featureImage" />
                        <h3 className="featureTitle">Weather-Based Recommendations</h3>
                        <p className="featureDescription">
                            Stay prepared with real-time weather updates that adjust your
                            packing list, ensuring you're ready for any climate.
                        </p>
                        {/* <button className="button">Learn More</button> */}
                    </div>

                    {/* Feature 3 */}
                    <div className="featureItem">
                        <img src={feature3} alt="Interactive Packing" className="featureImage" />

                        <h3 className="featureTitle">Interactive Packing Experience</h3>
                        <p className="featureDescription">
                            Enjoy a user-friendly interface with animations that make packing
                            fun and efficient, adapting to your travel itinerary.
                        </p>
                        {/* <button className="button">Learn More</button> */}
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Home2;