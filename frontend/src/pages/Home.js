import React, { useEffect, useRef, useState } from 'react';
import './Home.css';  // Import the CSS file
import img1 from '../assets/img1.png';
import img2 from '../assets/2.png';
import { Link } from 'react-router-dom';

const Home = () => {
    const sectionRef = useRef(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const observerOptions = {
            root: null, // Observe in the viewport
            threshold: 0.1, // Trigger when 10% of the section is visible
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                }
            });
        }, observerOptions);

        if (sectionRef.current) observer.observe(sectionRef.current);

        return () => {
            if (sectionRef.current) observer.unobserve(sectionRef.current);
        };
    }, []);

    return (
        <div>
            {/* Hero Section */}
            <section className="hero" ref={sectionRef}>
                <div className={`heroText ${isVisible ? 'fade-in' : ''}`}>
                    <h1 className="heroHeading">
                        Meet Your <span style={{ color: '#007bff' }}>Ultimate</span> Packing
                        Assistant
                    </h1>
                    <p className="heroParagraph">
                        PackMate’s AI-powered assistant tailors packing lists to your
                        travel plans, considering weather, destination, and activities. Enjoy
                        stress-free travel with personalized recommendations.
                    </p>
                    <div className="heroButtons">
                        {/* <button className="exploreButton">Explore</button> */}
                        <Link to="/features" className="exploreButton">Features</Link>
                        {/* <button className="learnMoreButton">Learn More</button> */}
                        <Link to="/how-it-works" className="learnMoreButton">Learn More</Link>
                    </div>
                </div>
                <img src={img1} alt="Hero" className="heroImage" />
            </section>

            {/* Section 2 */}
            <section className="section">
                <h2 className="sectionHeading">Meet PackMate: Your Travel Companion</h2>
                <p className="sectionParagraph">
                    At PackMate, our mission is to simplify travel planning and enhance
                    your travel experience through innovative technology. We believe in
                    innovation, user-centric design, and sustainability.
                </p>
                <img src={img2} alt="Travel Companion" className="sectionImage" />
            </section>

            {/* Disclaimer Section */}
            <section className="disclaimerSection">
                <div className="disclaimerContent">
                    <h2 className="disclaimerHeading">⚠️ Important Things to Know!</h2>
                    <ul className="disclaimerList">
                        <li>
                            <strong>Provide the Right City:</strong> PackMate has a built-in AI auto-corrector, but providing the correct, specific city name guarantees we can pull exact weather station data for you!
                        </li>
                        <li>
                            <strong>Check Closer to Travel Dates:</strong> We pull highly accurate weather data for the exact next 16 days. For travel dates starting after 16 days, PackMate uses a "temperature drift" calculation to estimate conditions, which may not be 100% precise.
                        </li>
                        <li>
                            <strong>AI Limitations:</strong> AI-generated lists are incredibly tailored, but PackMate is an assistant—not a definitive truth. It may occasionally suggest quirky items or forget niche essentials. Please use your best judgment to review your final list!
                        </li>
                    </ul>
                </div>
            </section>
        </div>
    );
};

export default Home;