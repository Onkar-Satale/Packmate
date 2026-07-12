import React, { useEffect, useState, useRef, useContext } from 'react';
import './Home4.css';
import imgch1 from '../assets/ch1.png';
import imgch2 from '../assets/ch2.png';
import imgch3 from '../assets/ch3.png';

import { AuthContext } from '../context/AuthContext';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const Home4 = () => {
  const [visibleSections, setVisibleSections] = useState([]);
  const sectionsRef = useRef([]);

  const { user } = useContext(AuthContext);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  // ✅ safe email extraction
  const userEmail = (typeof user === 'string' ? user : user?.email) || '';

  // animation logic (UNCHANGED)
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
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
      },
      { threshold: 0.2 }
    );

    sectionsRef.current.forEach((section) => {
      if (section) observer.observe(section);
    });

    return () => {
      sectionsRef.current.forEach((section) => {
        if (section) observer.unobserve(section);
      });
    };
  }, []);

  const handleSubscribe = async () => {
    if (!email) {
      toast.error('Please enter your email');
      return;
    }

    setLoading(true);

    try {
      const data = new FormData();
      data.append('access_key', process.env.REACT_APP_WEB3FORMS_KEY );
      data.append('subject', 'New Newsletter Subscription - PackMate');
      data.append('email', email);
      data.append('message', `New newsletter subscription from: ${email}`);

      const response = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        body: data,
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Subscribed successfully!');
        setEmail('');
      } else {
        toast.error('Subscription failed');
      }
    } catch (error) {
      toast.error('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>


      <div className="testimonials">
        <h2>What Users Say !?</h2>
        <p>
          Discover how PackMate has transformed travel experiences for our users.
        </p>

        <div className="testimonialCards">
          {[
            {
              name: 'Emily',
              title: 'Investor',
              testimonial:
                'PackMate has completely changed the way I prepare for trips! I never forget essentials anymore, and the suggestions are spot on for my travel plans.',
              img: imgch1,
            },
            {
              name: 'Ace',
              title: 'Banker',
              testimonial:
                'Using PackMate made my last vacation stress-free! The AI recommendations were tailored perfectly to my itinerary and the weather.',
              img: imgch2,
            },
            {
              name: 'Ely',
              title: 'Traveler',
              testimonial:
                'PackMate is a game changer! I love how it adapts to my travel style and makes packing so much easier.',
              img: imgch3,
            },
          ].map((userItem, index) => (
            <div
              key={index}
              ref={(el) => (sectionsRef.current[index] = el)}
              className={`testimonialCard ${visibleSections.includes(index) ? 'visible' : ''
                }`}
            >
              <img src={userItem.img} alt={userItem.name} />
              <h3>{userItem.name}</h3>
              <p>{userItem.title}</p>
              <p className="italic">"{userItem.testimonial}"</p>
            </div>
          ))}
        </div>
      </div>

      <footer>
        <div className="footerContent">
          <div className="subscribe">
            <h2>Stay Updated</h2>
            <p>
              Subscribe to our newsletter for the latest travel tips and
              updates from PackMate.
            </p>

            <div>
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onFocus={() => {
                  if (userEmail && !email) {
                    setEmail(userEmail);
                  }
                }}
              />
              <button onClick={handleSubscribe} disabled={loading}>
                {loading ? 'Sending...' : 'Submit'}
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home4;
