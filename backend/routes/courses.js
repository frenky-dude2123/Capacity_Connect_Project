const express = require('express');
const router = express.Router();
const { isSupabaseAvailable, supabase, authMiddleware, requireRole } = require('../lib/supabaseClient');

const MOCK_COURSES = [
  {
    id: 1,
    title: 'Advanced Astrophysics',
    category: 'Physics',
    description: 'Deep dive into stellar dynamics, black hole mechanics, and relativistic cosmology.',
    instructor: 'Dr. Elena Vasquez',
    video_url: 'https://sample-videos.com/video123.mp4',
    youtube_embed_id: null,
    reading_content: 'This course covers the fundamentals of modern astrophysics, including gravitational physics, stellar evolution, galaxy formation, and dark matter theory. Students will explore the mathematical foundations underlying cosmic phenomena.',
    syllabus: [
      'Module 1: Gravitational Physics and Relativity',
      'Module 2: Stellar Structure and Evolution',
      'Module 3: Galactic Dynamics and Dark Matter',
      'Module 4: Cosmology and the Big Bang',
      'Module 5: Black Holes and Spacetime Curvature'
    ],
    quiz: {
      question: 'Which force is responsible for holding galaxies together?',
      options: ['Electromagnetic force', 'Strong nuclear force', 'Weak nuclear force', 'Gravitational force'],
      correctIndex: 3
    }
  },
  {
    id: 2,
    title: 'Deep Space Navigation',
    category: 'Aerospace',
    description: 'Learn orbital mechanics, celestial navigation, and interstellar trajectory planning.',
    instructor: 'Capt. M. Reyes',
    video_url: 'https://sample-videos.com/video123.mp4',
    reading_content: 'Master the art of navigating spacecraft through the solar system and beyond. This course covers orbital mechanics, celestial navigation techniques, and mission planning for deep space missions.',
    syllabus: [
      'Module 1: Orbital Mechanics Fundamentals',
      'Module 2: Celestial Navigation Techniques',
      'Module 3: Propulsion Systems',
      'Module 4: Interstellar Trajectory Planning',
      'Module 5: Mission Control Operations'
    ],
    quiz: {
      question: 'What is the primary reference frame for celestial navigation?',
      options: ['Earth-fixed frame', 'Solar system barycenter', 'Ecliptic coordinate system', 'Equatorial coordinate system'],
      correctIndex: 3
    }
  },
  {
    id: 3,
    title: 'Exoplanet Habitability',
    category: 'Astronomy',
    description: 'Explore the criteria for planetary habitability and the search for extraterrestrial life.',
    instructor: 'Dr. S. Kumar',
    video_url: 'https://sample-videos.com/video123.mp4',
    reading_content: 'Examine the conditions necessary for life on exoplanets, including atmospheric composition, orbital resonance, and the habitable zone. This course covers current research in astrobiology and the detection of potentially habitable worlds.',
    syllabus: [
      'Module 1: The Habitable Zone Concept',
      'Module 2: Atmospheric Composition and Retention',
      'Module 3: Exoplanet Detection Methods',
      'Module 4: Astrobiology and Biosignatures',
      'Module 5: The Drake Equation and SETI'
    ],
    quiz: {
      question: 'What defines the circumstellar habitable zone?',
      options: ['Region with liquid water potential', 'Region with magnetic field', 'Region with Earth-like gravity', 'Region with oxygen atmosphere'],
      correctIndex: 0
    }
  },
  {
    id: 4,
    title: 'Stellar Engineering',
    category: 'Engineering',
    description: 'Advanced techniques for starship construction and stellar-scale engineering projects.',
    instructor: 'Eng. Aria Chen',
    video_url: 'https://sample-videos.com/video123.mp4',
    reading_content: 'Study the theoretical foundations and practical applications of stellar engineering, including Dyson sphere construction, stellar lifting, and fusion reactor design for interstellar vessels.',
    syllabus: [
      'Module 1: Fusion Reactor Fundamentals',
      'Module 2: Structural Materials for Spacecraft',
      'Module 3: Propulsion and Power Systems',
      'Module 4: Life Support and Atmospheric Control',
      'Module 5: Large-Scale Engineering Projects'
    ],
    quiz: {
      question: 'What is the primary fuel source for a Dyson sphere?',
      options: ['Hydrogen', 'Helium', 'Starlight fusion', 'Captured stellar energy'],
      correctIndex: 3
    }
  },
  {
    id: 5,
    title: 'Galactic Civilizations',
    category: 'Sociology',
    description: 'Survey of potential galactic civilizations and their societal structures.',
    instructor: 'Prof. Marcus Webb',
    video_url: 'https://sample-videos.com/video123.mp4',
    reading_content: 'Explore the sociological implications of galactic-scale civilization, including the Fermi paradox, the Great Filter, and models of interstellar society formation across cosmic time.',
    syllabus: [
      'Module 1: The Fermi Paradox',
      'Module 2: The Great Filter Theory',
      'Module 3: Interstellar Communication',
      'Module 4: Societal Models for Galactic Civilizations',
      'Module 5: Xenolinguistics and Cultural Exchange'
    ],
    quiz: {
      question: 'What does the Great Filter hypothesis attempt to explain?',
      options: ['Origin of life', 'Rare Earth hypothesis', 'Missing link in evolution', 'Absence of extraterrestrial civilizations'],
      correctIndex: 3
    }
  },
  {
    id: 6,
    title: 'Introduction to Java Programming & Object-Oriented Design',
    category: 'Software Engineering',
    description: 'A 4-week foundational module covering Java syntax, object-oriented design principles, and building real console/GUI applications. Designed for learners with no prior programming background moving into software development roles.',
    instructor: 'Ms. Rachel Torres',
    video_url: 'https://sample-videos.com/video123.mp4',
    reading_content: 'This course covers the fundamentals of Java programming, including syntax, data types, control structures, object-oriented design principles, and hands-on projects building console and GUI applications.',
    syllabus: [
      'Module 1: Java Fundamentals — syntax, data types, control structures',
      'Module 2: Object-Oriented Programming — classes, inheritance, polymorphism, interfaces',
      'Module 3: Collections Framework and Exception Handling',
      'Module 4: Building and Testing a Capstone Java Application'
    ],
    quiz: {
      question: 'Which principle is NOT a core pillar of Object-Oriented Programming?',
      options: ['Encapsulation', 'Abstraction', 'Compilation', 'Polymorphism'],
      correctIndex: 2
    }
  },
  {
    id: 7,
    title: 'Python for Data Analysis & Automation',
    category: 'Data Science / Automation',
    description: 'A 4-week module covering Python fundamentals and practical data analysis skills using pandas and NumPy, plus scripting for task automation. Suited for learners moving toward data-focused or automation-heavy roles.',
    instructor: 'Dr. Anil Kapoor',
    video_url: 'https://sample-videos.com/video123.mp4',
    reading_content: 'Master Python for data analysis and automation. Learn to manipulate data with pandas, compute with NumPy, and write scripts that automate repetitive tasks across enterprise workflows.',
    syllabus: [
      'Module 1: Python Fundamentals and Scripting',
      'Module 2: Data Structures, Functions, and File I/O',
      'Module 3: Data Analysis with pandas and NumPy',
      'Module 4: Automation Scripts and Capstone Data Project'
    ],
    quiz: {
      question: 'Which library is primarily used for data manipulation and analysis in Python?',
      options: ['NumPy', 'pandas', 'matplotlib', 'requests'],
      correctIndex: 1
    }
  },
  {
    id: 8,
    title: 'Introduction to Atmospheric Science & Weather Forecasting',
    category: 'Earth Sciences',
    description: 'A foundational 4-week module covering meteorological fundamentals, atmospheric thermodynamics, synoptic chart analysis, and modern numerical weather prediction (NWP) models. Designed to train technical officers in interpreting satellite and radar telemetry.',
    instructor: 'Dr. Meena Iyer',
    video_url: 'https://sample-videos.com/video123.mp4',
    youtube_embed_id: 'PLACEHOLDER_YOUTUBE_EMBED_ID',
    reading_content: 'Target Ministry Division: India Meteorological Department (IMD) / Operational Forecasting Cadre. YouTube Source Reference: NPTEL / IMD Training Wing Public Lecture Series (Atmospheric Science Playlist).',
    syllabus: [
      'Module 1: Structure of the Atmosphere and Global Circulation Patterns',
      'Module 2: Thermodynamic Diagrams and Air Mass Analysis',
      'Module 3: Radar Meteorology and Satellite Cloud Imagery Interpretation',
      'Module 4: Issuing Severe Weather Warnings and Cyclone Tracking Protocols'
    ],
    quiz: {
      question: 'Which instrument is primarily used to measure atmospheric pressure?',
      options: ['Thermometer', 'Barometer', 'Hygrometer', 'Anemometer'],
      correctIndex: 1
    }
  },
  {
    id: 9,
    title: 'Oceanography & Marine Earth Systems',
    category: 'Earth Sciences',
    description: 'A comprehensive 6-week professional development course focusing on physical oceanography, marine meteorology, and tsunami early warning systems. Tailored for researchers and marine science officers managing coastal data infrastructure.',
    instructor: 'Dr. Kiran Nayak',
    video_url: 'https://sample-videos.com/video123.mp4',
    youtube_embed_id: 'PLACEHOLDER_YOUTUBE_EMBED_ID',
    reading_content: 'Target Ministry Division: Ministry of Earth Sciences (MoES) / Ocean Science & Services Division. YouTube Source Reference: INCOIS / MoES Academic Outreach Lecture Series (Oceanography & Marine Dynamics).',
    syllabus: [
      'Module 1: Ocean-Atmosphere Coupling and El Niño / La Niña Dynamics',
      'Module 2: Sea Surface Temperature (SST) Monitoring and Oceanic Heat Content',
      'Module 3: Tsunami Generation Mechanisms and Deep-Ocean Buoy Telemetry',
      'Module 4: Integrated Coastal Zone Management and Data Modeling'
    ],
    quiz: {
      question: 'What is the primary driver of El Niño events?',
      options: ['Increased trade winds', 'Weakening of trade winds and warm water shift', 'Decreased sea surface temperature', 'Increased upwelling'],
      correctIndex: 1
    }
  }
];

/**
 * 1. GET /api/courses/catalog
 * Returns list of all courses from Supabase.
 * Protected: authenticated users (trainee, trainer, admin).
 */
router.get('/catalog', authMiddleware, requireRole('trainee', 'trainer', 'admin'), async (req, res) => {
  try {
    if (!isSupabaseAvailable) {
      return res.status(200).json(MOCK_COURSES.map(c => ({
        id: c.id,
        title: c.title,
        category: c.category,
        description: c.description,
        instructor: c.instructor
      })));
    }

    const { data, error } = await supabase
      .from('courses')
      .select('id, title, category, description, instructor')
      .order('id', { ascending: true });

    if (error) {
      console.error('[Courses] Catalog error:', error.message);
      return res.status(500).json({ error: 'Failed to fetch course catalog', details: error.message });
    }

    res.json(data || []);
  } catch (err) {
    console.error('[Courses] Catalog exception:', err.message);
    res.status(500).json({ error: 'Failed to fetch course catalog', details: err.message });
  }
});

/**
 * 2. GET /api/courses/detail/:id
 * Returns specific course info from Supabase.
 * Protected: authenticated users (trainee, trainer, admin).
 */
router.get('/detail/:id', authMiddleware, requireRole('trainee', 'trainer', 'admin'), async (req, res) => {
  try {
    const courseId = Number(req.params.id);

    if (!isSupabaseAvailable) {
      const mockCourse = MOCK_COURSES.find(c => c.id === courseId);
      if (!mockCourse) {
        return res.status(404).json({
          error: 'Course not found',
          message: `No course exists with ID: ${req.params.id}`
        });
      }
      return res.status(200).json({
        id: mockCourse.id,
        title: mockCourse.title,
        category: mockCourse.category,
        description: mockCourse.description,
        syllabus: mockCourse.syllabus || [],
        instructor: mockCourse.instructor
      });
    }

    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .eq('id', courseId)
      .single();

    if (error || !data) {
      return res.status(404).json({
        error: 'Course not found',
        message: `No course exists with ID: ${req.params.id}`
      });
    }

    res.json({
      id: data.id,
      title: data.title,
      category: data.category,
      description: data.description,
      syllabus: data.syllabus || [],
      instructor: data.instructor
    });
  } catch (err) {
    console.error('[Courses] Detail error:', err.message);
    res.status(500).json({ error: 'Failed to fetch course detail', details: err.message });
  }
});

/**
 * 3. GET /api/courses/player/:id
 * Returns lesson player data from Supabase.
 * Protected: authenticated users (trainee, trainer, admin).
 */
router.get('/player/:id', authMiddleware, requireRole('trainee', 'trainer', 'admin'), async (req, res) => {
  try {
    const courseId = Number(req.params.id);

    if (!isSupabaseAvailable) {
      const mockCourse = MOCK_COURSES.find(c => c.id === courseId);
      if (!mockCourse) {
        return res.status(404).json({
          error: 'Course not found',
          message: `No course exists with ID: ${req.params.id}`
        });
      }
      return res.status(200).json({
        id: mockCourse.id,
        title: mockCourse.title,
        videoUrl: mockCourse.video_url,
        readingContent: mockCourse.reading_content,
        quiz: mockCourse.quiz || null,
        syllabus: mockCourse.syllabus || []
      });
    }

    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .eq('id', courseId)
      .single();

    if (error || !data) {
      return res.status(404).json({
        error: 'Course not found',
        message: `No course exists with ID: ${req.params.id}`
      });
    }

    res.json({
      id: data.id,
      title: data.title,
      videoUrl: data.video_url,
      readingContent: data.reading_content,
      quiz: data.quiz || null,
      syllabus: data.syllabus || []
    });
  } catch (err) {
    console.error('[Courses] Player error:', err.message);
    res.status(500).json({ error: 'Failed to fetch course player data', details: err.message });
  }
});

module.exports = router;
