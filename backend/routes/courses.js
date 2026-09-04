const express = require('express');
const router = express.Router();

// Mock data for 3 courses
const courses = [
  {
    id: 1,
    title: 'Cloud Infrastructure & High-Availability Scaling',
    category: 'Cloud Architecture',
    description: 'Master large-scale cloud systems, resilient architectures, multi-region failover, load balancing, and auto-scaling patterns for enterprise environments.',
    syllabus: [
      'Module 1: Foundations of Resilient Cloud Topologies',
      'Module 2: Layer 4 vs Layer 7 Load Balancing & Health Probes',
      'Module 3: Scalability Patterns & Circuit Breakers (Resilience4j & Envoy)',
      'Module 4: Multi-Region Replication & Active-Active Failover',
      'Module 5: Chaos Engineering & Capstone Architecture Review'
    ],
    instructor: 'Dr. Aris Vance (Principal Cloud Architect)',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    readingContent: 'High availability (HA) refers to systems that are durable and likely to operate continuously without failure for a long time. In modern cloud architecture, achieving 99.999% ("five nines") availability requires eliminating single points of failure, implementing redundant compute and storage tiers, utilizing health checks with automatic self-healing, and deploying circuit breakers to prevent cascading outages across microservices.',
    quiz: {
      question: 'What is the primary benefit of deploying the Circuit Breaker pattern in distributed microservices?',
      options: [
        'Preventing cascading service failures by failing fast during downstream outages',
        'Directly increasing database throughput by bypassing cache layers',
        'Encrypting inter-service payloads using asymmetric cryptography',
        'Automatically reducing the size of container images in production'
      ],
      correct: 0,
      correctIndex: 0
    }
  },
  {
    id: 2,
    title: 'Enterprise Data Governance & ISO 27001 Security',
    category: 'Security & Compliance',
    description: 'Implement rigorous data protection policies, role-based access control (RBAC), end-to-end cryptographic audit trails, and ISO 27001 compliance standards.',
    syllabus: [
      'Module 1: ISO/IEC 27001 ISMS Framework Fundamentals',
      'Module 2: Data Classification, Lineage & Retention Policies',
      'Module 3: Cryptographic Protocols & Key Management Systems (KMS)',
      'Module 4: Zero Trust Access & Role-Based Identity Governance',
      'Module 5: Security Auditing, Incident Response & Penetration Testing'
    ],
    instructor: 'Elena Rostova (Chief Information Security Officer)',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    readingContent: 'Enterprise data governance establishes authority, control, and decision-making over data assets. Under ISO 27001, organizations must conduct systematic risk assessments, implement strict identity and access controls (Least Privilege), and establish continuous monitoring mechanisms to detect anomalies, unauthorized exfiltration, and compliance violations.',
    quiz: {
      question: 'Under the principle of Least Privilege (PoLP), how should user and service permissions be assigned?',
      options: [
        'Grant broad administrative access to ensure uninterrupted developer productivity',
        'Provide only the minimum necessary permissions required to perform specific job duties',
        'Delegate root credentials across all members of the incident response team',
        'Disable token expiration on internal microservice-to-microservice APIs'
      ],
      correct: 1,
      correctIndex: 1
    }
  },
  {
    id: 3,
    title: 'Distributed Systems Design & Microservices Engineering',
    category: 'Software Engineering',
    description: 'Design robust event-driven microservices, tackle distributed transactions using the Saga pattern, achieve consensus with Raft, and tune Apache Kafka.',
    syllabus: [
      'Module 1: Monolith Decomposition & Domain-Driven Design (DDD)',
      'Module 2: Event-Driven Architecture with Apache Kafka & Event Sourcing',
      'Module 3: Distributed Transactions: Two-Phase Commit vs Saga Pattern',
      'Module 4: Consensus Protocols: Paxos & Raft Explained',
      'Module 5: Observability: Distributed Tracing with OpenTelemetry'
    ],
    instructor: 'Marcus Chen (Staff Distributed Systems Engineer)',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    readingContent: 'Building distributed systems requires handling partial network partitions, consensus challenges, and eventual consistency. Rather than relying on traditional ACID transactions across distinct microservice databases, modern engineering teams utilize the Saga pattern with compensating transactions and distributed event logs like Kafka to preserve data integrity across boundaries.',
    quiz: {
      question: 'Which consistency and recovery approach is commonly utilized in the Saga pattern when a step fails?',
      options: [
        'Immediate distributed database rollback via distributed locking',
        'Executing compensating transactions in reverse order to restore consistency',
        'Ignoring downstream service errors and logging a warning',
        'Restarting the entire application cluster from cold storage'
      ],
      correct: 1,
      correctIndex: 1
    }
  }
];

// Helper to look up course by ID
function findCourseById(id) {
  return courses.find(c => c.id.toString() === id.toString());
}

/**
 * 1. GET /api/courses/catalog
 * Returns list of all courses for Page 3 (id, title, category)
 */
router.get('/catalog', (req, res) => {
  try {
    const catalog = courses.map(course => ({
      id: course.id,
      title: course.title,
      category: course.category,
      description: course.description,
      instructor: course.instructor
    }));
    res.json(catalog);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch course catalog', details: err.message });
  }
});

/**
 * 2. GET /api/courses/detail/:id
 * Returns specific course info for Page 4 (id, title, description, syllabus, instructor)
 */
router.get('/detail/:id', (req, res) => {
  try {
    const course = findCourseById(req.params.id);
    if (!course) {
      return res.status(404).json({
        error: 'Course not found',
        message: `No course exists with ID: ${req.params.id}`
      });
    }

    res.json({
      id: course.id,
      title: course.title,
      category: course.category,
      description: course.description,
      syllabus: course.syllabus,
      instructor: course.instructor
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch course detail', details: err.message });
  }
});

/**
 * 3. GET /api/courses/player/:id
 * Returns lesson player data for Page 5 (title, videoUrl, readingContent, quiz)
 */
router.get('/player/:id', (req, res) => {
  try {
    const course = findCourseById(req.params.id);
    if (!course) {
      return res.status(404).json({
        error: 'Course not found',
        message: `No course exists with ID: ${req.params.id}`
      });
    }

    res.json({
      id: course.id,
      title: course.title,
      videoUrl: course.videoUrl,
      readingContent: course.readingContent,
      quiz: course.quiz,
      syllabus: course.syllabus
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch course player data', details: err.message });
  }
});

module.exports = router;
