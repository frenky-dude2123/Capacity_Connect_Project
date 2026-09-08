const QUIZ_QUESTIONS = [
  // General Science
  { id: 'gs1', subject: 'General Science', question: 'What is the chemical symbol for gold?', options: ['Ag', 'Au', 'Fe', 'Cu'], correctIndex: 1 },
  { id: 'gs2', subject: 'General Science', question: 'Which planet is known as the Red Planet?', options: ['Venus', 'Mars', 'Jupiter', 'Saturn'], correctIndex: 1 },
  { id: 'gs3', subject: 'General Science', question: 'What is the hardest natural substance on Earth?', options: ['Gold', 'Iron', 'Diamond', 'Platinum'], correctIndex: 2 },
  { id: 'gs4', subject: 'General Science', question: 'What gas do plants absorb from the atmosphere during photosynthesis?', options: ['Oxygen', 'Nitrogen', 'Carbon Dioxide', 'Hydrogen'], correctIndex: 2 },
  { id: 'gs5', subject: 'General Science', question: 'How many bones are in an adult human body?', options: ['206', '208', '210', '212'], correctIndex: 0 },
  { id: 'gs6', subject: 'General Science', question: 'What is the speed of light in a vacuum?', options: ['300,000 km/s', '150,000 km/s', '450,000 km/s', '600,000 km/s'], correctIndex: 0 },
  { id: 'gs7', subject: 'General Science', question: 'Which element has the atomic number 1?', options: ['Helium', 'Hydrogen', 'Lithium', 'Oxygen'], correctIndex: 1 },
  { id: 'gs8', subject: 'General Science', question: 'What is the powerhouse of the cell?', options: ['Nucleus', 'Mitochondria', 'Ribosome', 'Cell Membrane'], correctIndex: 1 },
  { id: 'gs9', subject: 'General Science', question: 'What is the pH of pure water?', options: ['5', '7', '9', '11'], correctIndex: 1 },
  { id: 'gs10', subject: 'General Science', question: 'Which vitamin is produced when skin is exposed to sunlight?', options: ['Vitamin A', 'Vitamin B12', 'Vitamin C', 'Vitamin D'], correctIndex: 3 },

  // Mathematics
  { id: 'm1', subject: 'Mathematics', question: 'What is the value of π (pi) to two decimal places?', options: ['3.12', '3.14', '3.16', '3.18'], correctIndex: 1 },
  { id: 'm2', subject: 'Mathematics', question: 'What is 15% of 200?', options: ['25', '30', '35', '40'], correctIndex: 1 },
  { id: 'm3', subject: 'Mathematics', question: 'What is the square root of 144?', options: ['10', '11', '12', '13'], correctIndex: 2 },
  { id: 'm4', subject: 'Mathematics', question: 'If a triangle has angles of 30° and 60°, what is the third angle?', options: ['80°', '90°', '100°', '110°'], correctIndex: 1 },
  { id: 'm5', subject: 'Mathematics', question: 'What is the next number in the sequence: 2, 4, 8, 16, ?', options: ['24', '28', '32', '36'], correctIndex: 2 },
  { id: 'm6', subject: 'Mathematics', question: 'What is the factorial of 5 (5!)?', options: ['100', '120', '140', '160'], correctIndex: 1 },
  { id: 'm7', subject: 'Mathematics', question: 'How many degrees in a right angle?', options: ['45°', '90°', '180°', '360°'], correctIndex: 1 },
  { id: 'm8', subject: 'Mathematics', question: 'What is 12 × 12?', options: ['132', '144', '156', '168'], correctIndex: 1 },
  { id: 'm9', subject: 'Mathematics', question: 'What is the sum of interior angles of a triangle?', options: ['90°', '180°', '270°', '360°'], correctIndex: 1 },
  { id: 'm10', subject: 'Mathematics', question: 'If x + 5 = 12, what is x?', options: ['5', '6', '7', '8'], correctIndex: 2 },

  // Geography
  { id: 'geo1', subject: 'Geography', question: 'What is the capital city of Australia?', options: ['Sydney', 'Melbourne', 'Canberra', 'Brisbane'], correctIndex: 2 },
  { id: 'geo2', subject: 'Geography', question: 'Which is the longest river in the world?', options: ['Amazon', 'Nile', 'Yangtze', 'Mississippi'], correctIndex: 1 },
  { id: 'geo3', subject: 'Geography', question: 'Mount Everest is located in which mountain range?', options: ['Andes', 'Rockies', 'Himalayas', 'Alps'], correctIndex: 2 },
  { id: 'geo4', subject: 'Geography', question: 'Which country has the largest population in the world?', options: ['India', 'China', 'USA', 'Indonesia'], correctIndex: 0 },
  { id: 'geo5', subject: 'Geography', question: 'What is the smallest country in the world by land area?', options: ['Monaco', 'Vatican City', 'San Marino', 'Liechtenstein'], correctIndex: 1 },
  { id: 'geo6', subject: 'Geography', question: 'Which ocean is the largest by surface area?', options: ['Atlantic', 'Indian', 'Arctic', 'Pacific'], correctIndex: 3 },
  { id: 'geo7', subject: 'Geography', question: 'The Equator divides the Earth into which two hemispheres?', options: ['East and West', 'Northern and Southern', 'Land and Water', 'Tropical and Polar'], correctIndex: 1 },
  { id: 'geo8', subject: 'Geography', question: 'Which desert is the largest hot desert in the world?', options: ['Sahara', 'Gobi', 'Kalahari', 'Arabian'], correctIndex: 0 },
  { id: 'geo9', subject: 'Geography', question: 'What is the capital of Japan?', options: ['Seoul', 'Beijing', 'Tokyo', 'Bangkok'], correctIndex: 2 },
  { id: 'geo10', subject: 'Geography', question: 'Which continent has the most countries?', options: ['Asia', 'Africa', 'Europe', 'South America'], correctIndex: 1 },

  // History
  { id: 'h1', subject: 'History', question: 'In which year did World War II end?', options: ['1944', '1945', '1946', '1947'], correctIndex: 1 },
  { id: 'h2', subject: 'History', question: 'Who was the first person to walk on the Moon?', options: ['Buzz Aldrin', 'Neil Armstrong', 'Yuri Gagarin', 'Michael Collins'], correctIndex: 1 },
  { id: 'h3', subject: 'History', question: 'The Great Wall of China was primarily built to protect against invasions from which group?', options: ['Mongols', 'Romans', 'Persians', 'Huns'], correctIndex: 0 },
  { id: 'h4', subject: 'History', question: 'Which ancient civilization built the pyramids of Giza?', options: ['Mesopotamians', 'Ancient Egyptians', 'Mayans', 'Greeks'], correctIndex: 1 },
  { id: 'h5', subject: 'History', question: 'The Renaissance period began in which country?', options: ['France', 'Italy', 'Spain', 'England'], correctIndex: 1 },
  { id: 'h6', subject: 'History', question: 'Who wrote the play "Romeo and Juliet"?', options: ['Charles Dickens', 'William Shakespeare', 'Jane Austen', 'Mark Twain'], correctIndex: 1 },
  { id: 'h7', subject: 'History', question: 'The Industrial Revolution began in which country?', options: ['USA', 'France', 'England', 'Germany'], correctIndex: 2 },
  { id: 'h8', subject: 'History', question: 'Which empire was ruled by Julius Caesar?', options: ['Roman Empire', 'Greek Empire', 'Persian Empire', 'Ottoman Empire'], correctIndex: 0 },
  { id: 'h9', subject: 'History', question: 'In which year did the Berlin Wall fall?', options: ['1987', '1989', '1991', '1993'], correctIndex: 1 },
  { id: 'h10', subject: 'History', question: 'Who was the first President of the United States?', options: ['Thomas Jefferson', 'John Adams', 'George Washington', 'Benjamin Franklin'], correctIndex: 2 },

  // Current Affairs
  { id: 'ca1', subject: 'Current Affairs', question: 'Which international organization is responsible for maintaining international peace and security?', options: ['World Bank', 'International Monetary Fund', 'United Nations', 'World Trade Organization'], correctIndex: 2 },
  { id: 'ca2', subject: 'Current Affairs', question: 'What does COP stand for in the context of climate change conferences?', options: ['Conference of Parties', 'Climate Observation Protocol', 'Carbon Offset Program', 'Conservation of Planet'], correctIndex: 0 },
  { id: 'ca3', subject: 'Current Affairs', question: 'Which country hosted the 2024 Summer Olympics?', options: ['USA', 'France', 'Japan', 'Australia'], correctIndex: 1 },
  { id: 'ca4', subject: 'Current Affairs', question: 'What is the name of the NASA program aimed at returning humans to the Moon?', options: ['Artemis', 'Apollo', 'Orion', 'Voyager'], correctIndex: 0 },
  { id: 'ca5', subject: 'Current Affairs', question: 'Which technology company developed the AI model GPT?', options: ['Google', 'Microsoft', 'OpenAI', 'Meta'], correctIndex: 2 },
  { id: 'ca6', subject: 'Current Affairs', question: 'What does AI stand for?', options: ['Automated Intelligence', 'Artificial Intelligence', 'Advanced Information', 'Algorithmic Integration'], correctIndex: 1 },
  { id: 'ca7', subject: 'Current Affairs', question: 'Which social media platform has the most users worldwide?', options: ['Instagram', 'Twitter/X', 'Facebook', 'TikTok'], correctIndex: 2 },
  { id: 'ca8', subject: 'Current Affairs', question: 'What is the name of the European Union single currency?', options: ['Euro', 'Pound', 'Franc', 'Mark'], correctIndex: 0 },
  { id: 'ca9', subject: 'Current Affairs', question: 'Which country is the largest producer of oil?', options: ['Saudi Arabia', 'Russia', 'USA', 'Canada'], correctIndex: 2 },
  { id: 'ca10', subject: 'Current Affairs', question: 'What does WHO stand for?', options: ['World Health Organization', 'World Human Organization', 'World Harmony Organization', 'World Help Organization'], correctIndex: 0 },

  // Logical Reasoning
  { id: 'lr1', subject: 'Logical Reasoning', question: 'If all roses are flowers, and some flowers are red, which statement must be true?', options: ['All roses are red', 'Some roses are red', 'No roses are red', 'Cannot be determined'], correctIndex: 3 },
  { id: 'lr2', subject: 'Logical Reasoning', question: 'Complete the analogy: Book is to Reading as Fork is to ?', options: ['Writing', 'Eating', 'Cooking', 'Cleaning'], correctIndex: 1 },
  { id: 'lr3', subject: 'Logical Reasoning', question: 'What comes next in the pattern: A, C, E, G, ?', options: ['H', 'I', 'J', 'K'], correctIndex: 1 },
  { id: 'lr4', subject: 'Logical Reasoning', question: 'If it takes 5 machines 5 minutes to make 5 widgets, how long would it take 100 machines to make 100 widgets?', options: ['5 minutes', '100 minutes', '20 minutes', '1 minute'], correctIndex: 0 },
  { id: 'lr5', subject: 'Logical Reasoning', question: 'A farmer has 17 sheep. All but 9 run away. How many sheep does the farmer have left?', options: ['8', '9', '17', '0'], correctIndex: 1 },
  { id: 'lr6', subject: 'Logical Reasoning', question: 'If you rearrange the letters "CIFAIPC" you would have the name of a(n):', options: ['City', 'Animal', 'Ocean', 'Planet'], correctIndex: 1 },
  { id: 'lr7', subject: 'Logical Reasoning', question: 'Which word does not belong: Apple, Banana, Carrot, Orange?', options: ['Apple', 'Banana', 'Carrot', 'Orange'], correctIndex: 2 },
  { id: 'lr8', subject: 'Logical Reasoning', question: 'If some cats are black, and all black things are dark, then:', options: ['All cats are dark', 'Some cats are dark', 'No cats are dark', 'Cannot be determined'], correctIndex: 1 },
  { id: 'lr9', subject: 'Logical Reasoning', question: 'Complete the sequence: 1, 1, 2, 3, 5, 8, ?', options: ['11', '13', '15', '17'], correctIndex: 1 },
  { id: 'lr10', subject: 'Logical Reasoning', question: 'If A > B and B > C, then:', options: ['A > C', 'A < C', 'A = C', 'Cannot be determined'], correctIndex: 0 },

  // Computer Basics
  { id: 'cb1', subject: 'Computer Basics', question: 'What does CPU stand for?', options: ['Central Processing Unit', 'Computer Personal Unit', 'Central Program Unit', 'Core Processing Unit'], correctIndex: 0 },
  { id: 'cb2', subject: 'Computer Basics', question: 'Which of the following is an example of an operating system?', options: ['Microsoft Word', 'Windows', 'Google Chrome', 'Adobe Photoshop'], correctIndex: 1 },
  { id: 'cb3', subject: 'Computer Basics', question: 'What does HTTP stand for?', options: ['HyperText Transfer Protocol', 'High Tech Transfer Protocol', 'HyperText Transmission Program', 'Home Tool Transfer Protocol'], correctIndex: 0 },
  { id: 'cb4', subject: 'Computer Basics', question: 'Which device is used to connect a computer to a network?', options: ['Keyboard', 'Mouse', 'Network Card / NIC', 'Monitor'], correctIndex: 2 },
  { id: 'cb5', subject: 'Computer Basics', question: 'What is the main function of RAM in a computer?', options: ['Permanent storage', 'Temporary memory for running programs', 'Processing graphics', 'Connecting to the internet'], correctIndex: 1 },
  { id: 'cb6', subject: 'Computer Basics', question: 'What does URL stand for?', options: ['Universal Resource Locator', 'Uniform Resource Locator', 'Unified Resource Link', 'Universal Reference Link'], correctIndex: 1 },
  { id: 'cb7', subject: 'Computer Basics', question: 'Which file extension is commonly used for compressed files?', options: ['.doc', '.pdf', '.zip', '.txt'], correctIndex: 2 },
  { id: 'cb8', subject: 'Computer Basics', question: 'What does GUI stand for?', options: ['General User Interface', 'Graphical User Interface', 'Global User Interface', 'Graphical Unified Interface'], correctIndex: 1 },
  { id: 'cb9', subject: 'Computer Basics', question: 'Which of the following is a web browser?', options: ['Microsoft Excel', 'Mozilla Firefox', 'Adobe Illustrator', 'VLC Player'], correctIndex: 1 },
  { id: 'cb10', subject: 'Computer Basics', question: 'What does SSD stand for?', options: ['Solid State Drive', 'Super Speed Disk', 'System Storage Device', 'Secure Storage Drive'], correctIndex: 0 },
];

function shuffleArray(array) {
  const arr = array.slice();
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function pickRandomQuestions(count) {
  const shuffled = shuffleArray(QUIZ_QUESTIONS);
  return shuffled.slice(0, Math.min(count, QUIZ_QUESTIONS.length));
}

function getQuestionsBySubject(subject) {
  return QUIZ_QUESTIONS.filter(q => q.subject === subject);
}

function getAllSubjects() {
  const subjects = new Set(QUIZ_QUESTIONS.map(q => q.subject));
  return Array.from(subjects);
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    QUIZ_QUESTIONS,
    shuffleArray,
    pickRandomQuestions,
    getQuestionsBySubject,
    getAllSubjects
  };
}