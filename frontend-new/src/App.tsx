import React, { useState, useEffect, useRef, KeyboardEvent, useCallback, useMemo } from 'react';
import { HashRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import './App.css';

// Define types for our data structures
interface TestResult {
  id: number;
  userId: string;
  date: string;
  score: number;
  timeSpent: number;
}

interface User {
  username: string;
  password: string;
  role: string;
  userId: string;
}

interface TestSubmission {
  userId: string;
  date: string;
  score: number;
  timeSpent: number;
  answers: Array<{symbol: string, answer: string}>;
}

// API URL - will use environment variable if available, otherwise default to localhost
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000';

// Default redirect URL
const DEFAULT_REDIRECT_URL = 'https://www.viedoc.com/login';

// Default cutoff time (11:59 PM)
const DEFAULT_CUTOFF_TIME = '23:59';

// Mock database for test results
const testResults: TestResult[] = [
  { id: 1, userId: "user1", date: "2025-03-24", score: 18, timeSpent: 72 },
  { id: 2, userId: "user2", date: "2025-03-24", score: 16, timeSpent: 85 },
  { id: 3, userId: "user3", date: "2025-03-23", score: 19, timeSpent: 68 },
  { id: 4, userId: "user4", date: "2025-03-23", score: 14, timeSpent: 90 },
  { id: 5, userId: "user5", date: "2025-03-22", score: 17, timeSpent: 75 },
];

// Get the redirect URL from local storage or use default
const getRedirectUrl = () => {
  const savedUrl = localStorage.getItem('redirectUrl');
  return savedUrl || DEFAULT_REDIRECT_URL;
};

// Set the redirect URL in local storage
const setRedirectUrl = (url: string) => {
  localStorage.setItem('redirectUrl', url);
};

// Get the cutoff time from local storage or use default
const getCutoffTime = () => {
  const savedTime = localStorage.getItem('cutoffTime');
  return savedTime || DEFAULT_CUTOFF_TIME;
};

// Set the cutoff time in local storage
const setCutoffTime = (time: string) => {
  localStorage.setItem('cutoffTime', time);
};

// Mock user database - in production, this would be replaced with backend authentication
const users: User[] = [
  { username: "user", password: "sleepisgood", role: "user", userId: "USR001" },
  { username: "admin", password: "sleepisgood", role: "admin", userId: "ADM001" }
];

// Result service for handling test results
const resultService = {
  // In a real app, this would call an API to save data
  saveResult: async (result: TestSubmission) => {
    console.log('Saving result:', result);
    // Mock API call
    return new Promise<{success: boolean, id: number}>((resolve) => {
      setTimeout(() => {
        resolve({ success: true, id: Math.floor(Math.random() * 1000) });
      }, 500);
    });
  },
  
  // In a real app, this would fetch from an API
  getResults: async (): Promise<TestResult[]> => {
    console.log('Fetching results');
    // Mock API call
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(testResults);
      }, 500);
    });
  }
};

// Somnum logo placeholder component
function SomnumLogo() {
  return (
    <div className="flex items-center">
      <div className="w-10 h-10 rounded-full bg-[#1e1f8e] flex items-center justify-center text-white font-bold mr-2">SN</div>
      <span className="text-[#1e1f8e] font-bold text-xl">Somnum</span>
    </div>
  );
}

function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <h1 className="text-3xl font-bold text-[#1e1f8e] mb-4">Welcome to the DSST Application</h1>
      <p className="mb-6 text-gray-700">This is the home page of the application.</p>
      <Link to="/login" className="px-6 py-3 bg-[#1e1f8e] text-white rounded hover:bg-[#8b8aeb] transition-colors duration-300">
        Login
      </Link>
    </div>
  );
}

function Assessment() {
  const navigate = useNavigate();
  const [timeLeft, setTimeLeft] = useState(90); // 90 seconds
  const [started, setStarted] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [score, setScore] = useState(0);
  const [timeSpent, setTimeSpent] = useState(0);
  const [allAnswers, setAllAnswers] = useState<{symbol: string, answer: string}[]>([]);
  const [currentSymbols, setCurrentSymbols] = useState<string[]>([]);
  const [currentAnswers, setCurrentAnswers] = useState<string[]>([]);
  const [showNavHelp, setShowNavHelp] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newBoxesAdded, setNewBoxesAdded] = useState(false);
  const [showThankYou, setShowThankYou] = useState(false);
  const [cutoffReached, setCutoffReached] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const lastFocusedIndex = useRef<number>(0);
  
  const redirectUrl = useMemo(() => getRedirectUrl(), []);
  const cutoffTime = useMemo(() => getCutoffTime(), []);

  // Get current user from session storage (in a real app, this would be handled by a proper auth system)
  const currentUser = useMemo(() => {
    const storedUser = sessionStorage.getItem('currentUser');
    return storedUser ? JSON.parse(storedUser) : null;
  }, []);

  // Symbol key for the DSST (memoized to avoid recreating on each render)
  const symbolKey = useMemo(() => [
    { digit: 1, symbol: '∆' },
    { digit: 2, symbol: '⊥' },
    { digit: 3, symbol: '⊢' },
    { digit: 4, symbol: '○' },
    { digit: 5, symbol: '∨' },
    { digit: 6, symbol: '⊨' },
    { digit: 7, symbol: '†' },
    { digit: 8, symbol: '≠' },
    { digit: 9, symbol: '∪' },
  ], []);

  // Row size and inputs per row
  const inputsPerRow = 5;
  const rowsToShow = 20; // 20 rows (100 boxes total)
  const batchSize = inputsPerRow * rowsToShow;

  // Generate random symbols (memoized)
  const generateRandomSymbols = useCallback((count: number) => {
    const symbols: string[] = [];
    for (let i = 0; i < count; i++) {
      const randomIndex = Math.floor(Math.random() * symbolKey.length);
      symbols.push(symbolKey[randomIndex].symbol);
    }
    return symbols;
  }, [symbolKey]);

  // Check if all current answers are filled (memoized)
  const areAllAnswersFilled = useCallback(() => {
    return currentAnswers.every(answer => answer !== '');
  }, [currentAnswers]);

  // Check if we're close to the bottom of the boxes
  const checkAndAddMoreBoxes = useCallback(() => {
    // Don't add more boxes if the test is completed
    if (completed) return false;
    
    // If we're at the last 20 boxes, add more
    const lastInputIndex = currentAnswers.length - 1;
    const currentIndex = lastFocusedIndex.current;
    
    // If we're in the last 30% of boxes, generate more
    if (currentIndex > lastInputIndex * 0.7) {
      // Save current answers that have been filled
      const answersToSave = currentSymbols.map((symbol, index) => ({
        symbol,
        answer: currentAnswers[index]
      })).filter(a => a.answer !== ''); // Only save filled answers
      
      if (answersToSave.length > 0) {
        setAllAnswers(prev => [...prev, ...answersToSave]);
      }
      
      // Generate new symbols and append to existing
      const newSymbols = generateRandomSymbols(batchSize);
      
      // Keep existing symbols and answers that haven't been saved yet
      const keepSymbols = currentSymbols.filter((_, index) => !currentAnswers[index]);
      const keepAnswers = currentAnswers.filter(answer => !answer);
      
      // Combine existing with new
      setCurrentSymbols([...keepSymbols, ...newSymbols]);
      setCurrentAnswers([...keepAnswers, ...Array(newSymbols.length).fill('')]);
      
      // Recreate input refs array with proper length
      inputRefs.current = Array(keepSymbols.length + newSymbols.length).fill(null);
      
      // Show notification for new boxes
      setNewBoxesAdded(true);
      setTimeout(() => {
        setNewBoxesAdded(false);
      }, 2000);
      
      return true;
    }
    
    return false;
  }, [currentAnswers, currentSymbols, batchSize, generateRandomSymbols, completed]);

  // Calculate score (memoized)
  const calculateScore = useCallback(() => {
    // First include any current answers that are filled
    const allCompletedAnswers = [
      ...allAnswers,
      ...currentSymbols.map((symbol, index) => ({
        symbol,
        answer: currentAnswers[index]
      })).filter(a => a.answer !== '')
    ];
    
    let correctCount = 0;
    
    allCompletedAnswers.forEach(({ symbol, answer }) => {
      const correctDigit = symbolKey.find(item => item.symbol === symbol)?.digit.toString();
      if (answer === correctDigit) {
        correctCount++;
      }
    });
    
    setScore(correctCount);
    return correctCount;
  }, [allAnswers, currentSymbols, currentAnswers, symbolKey]);

  // Initialize with first batch of symbols
  useEffect(() => {
    if (started && !completed && currentSymbols.length === 0) {
      const newSymbols = generateRandomSymbols(batchSize);
      setCurrentSymbols(newSymbols);
      setCurrentAnswers(Array(newSymbols.length).fill(''));
      inputRefs.current = Array(batchSize).fill(null);
      lastFocusedIndex.current = 0;
    }
  }, [started, completed, currentSymbols.length, batchSize, generateRandomSymbols]);

  // Timer effect
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (started && timeLeft > 0 && !completed) {
      timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && !completed) {
      setCompleted(true);
      
      // Save any remaining answers before calculating score
      const remainingAnswers = currentSymbols.map((symbol, index) => ({
        symbol,
        answer: currentAnswers[index]
      })).filter(a => a.answer !== ''); // Only include filled answers
      
      setAllAnswers(prev => [...prev, ...remainingAnswers]);
      calculateScore();
      setTimeSpent(90);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [started, timeLeft, completed, calculateScore, currentAnswers, currentSymbols]);

  // Check if current time is past cutoff time
  useEffect(() => {
    const checkCutoffTime = () => {
      const now = new Date();
      const [cutoffHours, cutoffMinutes] = cutoffTime.split(':').map(Number);
      
      // Create a Date object for today's cutoff time in user's local timezone
      const today = new Date();
      today.setHours(cutoffHours, cutoffMinutes, 0, 0);
      
      // If current time is past cutoff time
      if (now > today) {
        setCutoffReached(true);
      } else {
        setCutoffReached(false);
      }
    };
    
    checkCutoffTime();
    
    // Check cutoff time every minute
    const interval = setInterval(checkCutoffTime, 60000);
    
    return () => {
      clearInterval(interval);
    };
  }, [cutoffTime]);

  // Handle keyboard navigation
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>, index: number) => {
    // Don't process input if the test is completed
    if (completed) return;
    
    // Track the last focused index
    lastFocusedIndex.current = index;
    
    // Prevent key repetition when key is held down
    if (e.repeat) {
      e.preventDefault();
      return;
    }
    
    const currentRowStart = Math.floor(index / inputsPerRow) * inputsPerRow;
    const currentRowEnd = currentRowStart + inputsPerRow - 1;
    const isLastRow = currentRowStart + inputsPerRow >= currentSymbols.length;
    const isFirstRow = currentRowStart === 0;
    
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      // If at end of row and not last row, go to first column of next row
      if (index === currentRowEnd && !isLastRow) {
        inputRefs.current[currentRowStart + inputsPerRow]?.focus();
      } else {
        // Otherwise move to next input or wrap to beginning of row
        const nextIndex = index < currentRowEnd ? index + 1 : currentRowStart;
        inputRefs.current[nextIndex]?.focus();
      }
    } 
    else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      // If at beginning of row and not first row, go to last column of previous row
      if (index === currentRowStart && !isFirstRow) {
        inputRefs.current[currentRowStart - 1]?.focus();
      } else {
        // Otherwise move to previous input or wrap to end of row
        const prevIndex = index > currentRowStart ? index - 1 : currentRowEnd;
        inputRefs.current[prevIndex]?.focus();
      }
    }
    else if (e.key === 'ArrowDown') {
      e.preventDefault();
      // Move down a row
      const nextRowIndex = index + inputsPerRow;
      if (nextRowIndex < currentSymbols.length) {
        inputRefs.current[nextRowIndex]?.focus();
      } else {
        // If no next row, check if we need to add more boxes
        checkAndAddMoreBoxes();
      }
    }
    else if (e.key === 'ArrowUp') {
      e.preventDefault();
      // Move up a row
      const prevRowIndex = index - inputsPerRow;
      if (prevRowIndex >= 0) {
        inputRefs.current[prevRowIndex]?.focus();
      }
    }
    
    // Handle digit input (1-9)
    if (/^[1-9]$/.test(e.key)) {
      // Only update once per key press (not on repeat)
      if (!e.repeat) {
        // Set the value directly - NO auto-moving
        const newAnswers = [...currentAnswers];
        newAnswers[index] = e.key;
        setCurrentAnswers(newAnswers);
        
        // Check if we should add more boxes, but don't auto-move
        setTimeout(() => {
          checkAndAddMoreBoxes();
        }, 10);
      }
      
      // Prevent default behavior which would append the digit to the input
      e.preventDefault();
    }
  };

  const handleInputChange = (index: number, value: string) => {
    // Don't process input if the test is completed
    if (completed) return;
    
    // Track the last focused index
    lastFocusedIndex.current = index;
    
    // Only allow digits 1-9
    if (/^[1-9]$/.test(value) || value === '') {
      const newAnswers = [...currentAnswers];
      newAnswers[index] = value;
      setCurrentAnswers(newAnswers);
      
      // If we're getting close to the end, check if we need more boxes
      setTimeout(() => {
        checkAndAddMoreBoxes();
      }, 10);
    }
  };

  // Function to handle input focus - track the last focused index
  const handleInputFocus = (index: number) => {
    // Don't process if the test is completed
    if (completed) return;
    
    lastFocusedIndex.current = index;
    checkAndAddMoreBoxes();
  };

  const handleStart = () => {
    setStarted(true);
    setAllAnswers([]);
    setCurrentSymbols([]);
    setCurrentAnswers([]);
    setScore(0);
  };

  const handleSubmit = async () => {
    if (!currentUser) {
      alert("User session expired. Please login again.");
      navigate('/login');
      return;
    }
    
    setCompleted(true);
    
    // Save any remaining answers before calculating score
    const remainingAnswers = currentSymbols.map((symbol, index) => ({
      symbol,
      answer: currentAnswers[index]
    }));
    
    setAllAnswers(prev => [...prev, ...remainingAnswers.filter(a => a.answer !== '')]);
    const finalScore = calculateScore();
    const finalTimeSpent = 90 - timeLeft;
    setTimeSpent(finalTimeSpent);
    
    // Save result to "database"
    setIsSubmitting(true);
    try {
      await resultService.saveResult({
        userId: currentUser.userId,
        date: new Date().toISOString().split('T')[0],
        score: finalScore,
        timeSpent: finalTimeSpent,
        answers: [...allAnswers, ...remainingAnswers.filter(a => a.answer !== '')]
      });
      // Show thank you screen after submission
      setShowThankYou(true);
    } catch (error) {
      console.error("Failed to save result:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="min-h-screen flex flex-col items-center p-4 bg-gray-50">
      <div className="w-full max-w-3xl">
        
        {showThankYou ? (
          <div className="bg-white p-8 rounded-lg shadow-md w-full text-center">
            <h1 className="text-3xl font-bold text-[#1e1f8e] mb-6">Thank You!</h1>
            <p className="text-lg mb-8">
              Please click below to complete your questions for today's visit:
            </p>
            <a 
              href={redirectUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-block px-6 py-3 bg-[#1e1f8e] text-white rounded-lg hover:bg-[#8b8aeb] transition-colors duration-300 text-lg"
            >
              Continue to Questionnaire
            </a>
          </div>
        ) : cutoffReached ? (
          <div className="bg-white p-8 rounded-lg shadow-md w-full text-center">
            <h1 className="text-3xl font-bold text-[#1e1f8e] mb-6">Assessment Unavailable</h1>
            <div className="mb-8">
              <p className="text-lg mb-4">
                The assessment is not available after the daily cutoff time.
              </p>
              <p className="text-gray-600">
                The assessment will be available again tomorrow before {cutoffTime}.
              </p>
            </div>
            <Link 
              to="/" 
              className="inline-block px-6 py-3 bg-[#1e1f8e] text-white rounded-lg hover:bg-[#8b8aeb] transition-colors duration-300"
            >
              Return to Home
            </Link>
          </div>
        ) : (
          <div className="bg-white p-8 rounded-lg shadow-md w-full">
            <h1 className="text-3xl font-bold text-[#1e1f8e] mb-6 text-center">DSST Assessment</h1>
            
            {!started ? (
              <div className="mb-8 text-center">
                <h2 className="text-xl font-semibold mb-4 text-gray-800">Digit Symbol Substitution Test</h2>
                <p className="text-gray-700 mb-6">
                  This test measures your processing speed and attention. You will see a key of symbols associated with digits 1-9. 
                  Below, you'll be presented with symbols and will need to enter the corresponding digits as quickly and accurately as possible.
                </p>
                <p className="text-gray-700 mb-6">
                  New symbol boxes will continuously appear as you fill in answers. Try to complete as many as you can within the time limit.
                </p>
                <p className="font-bold mb-6">You will have 90 seconds to complete the test.</p>
                <button 
                  onClick={handleStart}
                  className="px-6 py-3 bg-[#1e1f8e] text-white rounded hover:bg-[#8b8aeb] transition-colors duration-300"
                >
                  Start Test
                </button>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-center mb-6">
                  <div className="text-lg font-bold">Time Left: {formatTime(timeLeft)}</div>
                  <div className="text-lg font-bold text-[#1e1f8e]">
                    Completed: {allAnswers.length}
                  </div>
                  {!completed && (
                    <button 
                      onClick={handleSubmit}
                      disabled={isSubmitting}
                      className="px-4 py-2 bg-[#1e1f8e] text-white rounded hover:bg-[#8b8aeb] transition-colors duration-300 disabled:bg-gray-400"
                    >
                      {isSubmitting ? 'Submitting...' : 'Submit'}
                    </button>
                  )}
                </div>
                
                {/* Symbol Key */}
                <div className="mb-8 p-4 border border-[#8b8aeb] rounded bg-[#8b8aeb]/10">
                  <h3 className="text-lg font-semibold mb-3 text-[#1e1f8e]">Symbol Key</h3>
                  <div className="grid grid-cols-9 gap-2 text-center">
                    {symbolKey.map(item => (
                      <div key={item.digit} className="flex flex-col items-center">
                        <div className="font-bold">{item.digit}</div>
                        <div className="text-xl">{item.symbol}</div>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* New Boxes Notification */}
                {newBoxesAdded && (
                  <div className="bg-[#1e1f8e] text-white p-3 rounded-md mb-4 text-center transition-opacity duration-500">
                    <p>More symbol boxes have been added!</p>
                  </div>
                )}
                
                {/* Navigation Helper Popup */}
                {showNavHelp && (
                  <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 
                                bg-white p-6 rounded-lg shadow-lg border-2 border-[#1e1f8e] z-50
                                max-w-md">
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-xl font-bold text-[#1e1f8e]">Keyboard Navigation</h3>
                      <button 
                        onClick={() => setShowNavHelp(false)}
                        className="text-gray-500 hover:text-[#1e1f8e]"
                      >
                        ✕
                      </button>
                    </div>
                    <p className="mb-4">Use the keyboard to navigate between boxes:</p>
                    <ul className="mb-6 space-y-2">
                      <li className="flex items-center">
                        <span className="px-2 py-1 bg-[#8b8aeb]/20 rounded mr-2 text-[#1e1f8e] font-mono">←</span>
                        <span>Move to previous box</span>
                      </li>
                      <li className="flex items-center">
                        <span className="px-2 py-1 bg-[#8b8aeb]/20 rounded mr-2 text-[#1e1f8e] font-mono">→</span>
                        <span>Move to next box</span>
                      </li>
                      <li className="flex items-center">
                        <span className="px-2 py-1 bg-[#8b8aeb]/20 rounded mr-2 text-[#1e1f8e] font-mono">↑</span>
                        <span>Move to box above</span>
                      </li>
                      <li className="flex items-center">
                        <span className="px-2 py-1 bg-[#8b8aeb]/20 rounded mr-2 text-[#1e1f8e] font-mono">↓</span>
                        <span>Move to box below</span>
                      </li>
                    </ul>
                    <button
                      onClick={() => setShowNavHelp(false)}
                      className="w-full py-2 bg-[#1e1f8e] text-white rounded hover:bg-[#8b8aeb] transition-colors duration-300"
                    >
                      Got it!
                    </button>
                  </div>
                )}
                
                {/* Test Area */}
                <div 
                  ref={containerRef}
                  className="mb-8 max-h-80 overflow-y-auto pr-2"
                >
                  <h3 className="text-lg font-semibold mb-3 text-[#1e1f8e] sticky top-0 bg-white py-2">
                    Enter the digit for each symbol
                  </h3>
                  <div className="grid grid-cols-5 gap-4">
                    {currentSymbols.map((symbol, index) => (
                      <div key={index} className="flex flex-col items-center mb-3">
                        <div className="text-xl font-bold mb-1">{symbol}</div>
                        <input 
                          ref={el => {
                            inputRefs.current[index] = el;
                          }}
                          type="text"
                          maxLength={1}
                          value={currentAnswers[index]}
                          onChange={(e) => handleInputChange(index, e.target.value)}
                          onKeyDown={(e) => handleKeyDown(e, index)}
                          onFocus={() => handleInputFocus(index)}
                          className="w-10 h-10 border border-[#8b8aeb] rounded text-center text-xl focus:outline-none focus:ring-2 focus:ring-[#1e1f8e]"
                          disabled={completed}
                          inputMode="numeric"
                          pattern="[1-9]"
                          autoComplete="off"
                        />
                      </div>
                    ))}
                  </div>
                </div>
                
                {completed && !showThankYou && (
                  <div className="p-4 bg-[#8b8aeb]/20 text-[#1e1f8e] rounded mb-6 border border-[#8b8aeb]">
                    <h3 className="font-bold mb-2">Test Completed!</h3>
                    <p>Thank you for completing the DSST assessment.</p>
                    <p className="mt-2">Your score: {score} correct matches</p>
                    <p>Total attempted: {allAnswers.length + currentAnswers.filter(a => a !== '').length}</p>
                    <p>Time spent: {timeSpent} seconds</p>
                  </div>
                )}
              </>
            )}
            
            <div className="flex justify-between mt-6">
              <Link 
                to="/" 
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors duration-300"
              >
                Back to Home
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Login() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!username || !password) {
      setMessage('Please enter both username and password');
      setIsSuccess(false);
      return;
    }

    // Find user in our database
    const user = users.find(user => user.username === username && user.password === password);
    
    if (user) {
      // Store user info in session storage (in a real app, use a proper auth system)
      sessionStorage.setItem('currentUser', JSON.stringify(user));
      
      setIsSuccess(true);
      
      if (user.role === 'admin') {
        setMessage('Admin login successful! Redirecting to dashboard...');
        setTimeout(() => {
          navigate('/results');
        }, 1500);
      } else {
        setMessage('Login successful! Redirecting to assessment...');
        setTimeout(() => {
          navigate('/assessment');
        }, 1500);
      }
    } else {
      setIsSuccess(false);
      setMessage('Invalid username or password');
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-md w-96">
        <h2 className="text-2xl font-bold mb-6 text-center text-[#1e1f8e]">Login</h2>
        
        {message && (
          <div className={`p-3 mb-4 rounded ${isSuccess ? 'bg-[#8b8aeb]/20 text-[#1e1f8e] border border-[#8b8aeb]' : 'bg-red-100 text-red-700 border border-red-200'}`}>
            {message}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="username">
              Username
            </label>
            <input
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-[#1e1f8e]"
              id="username"
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">
              Password
            </label>
            <input
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-[#1e1f8e]"
              id="password"
              type="password"
              placeholder="******************"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div className="flex items-center justify-between">
            <button
              className="bg-[#1e1f8e] hover:bg-[#8b8aeb] text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition-colors duration-300"
              type="submit"
            >
              Sign In
            </button>
            <Link to="/" className="text-[#1e1f8e] hover:text-[#8b8aeb] transition-colors duration-300">
              Back to Home
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

function ResultsPage() {
  const [filterDate, setFilterDate] = useState('');
  const [filteredResults, setFilteredResults] = useState<TestResult[]>(testResults);
  const [isLoading, setIsLoading] = useState(false);
  const [redirectUrl, setRedirectUrl] = useState(getRedirectUrl);
  const [isEditingUrl, setIsEditingUrl] = useState(false);
  const [urlSaved, setUrlSaved] = useState(false);
  const [cutoffTime, setCutoffTime] = useState(getCutoffTime);
  const [isEditingCutoff, setIsEditingCutoff] = useState(false);
  const [cutoffSaved, setCutoffSaved] = useState(false);

  // Load results when component mounts
  useEffect(() => {
    const loadResults = async () => {
      setIsLoading(true);
      try {
        const data = await resultService.getResults();
        setFilteredResults(data);
      } catch (error) {
        console.error('Failed to load results:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadResults();
  }, []);

  // Filter results by date
  useEffect(() => {
    if (filterDate) {
      setFilteredResults(testResults.filter(result => result.date === filterDate));
    } else {
      setFilteredResults(testResults);
    }
  }, [filterDate]);

  // Handle redirect URL update
  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRedirectUrl(e.target.value);
  };

  const saveRedirectUrl = () => {
    try {
      // Add https:// if protocol is missing
      let urlToSave = redirectUrl;
      if (!/^https?:\/\//i.test(redirectUrl)) {
        urlToSave = 'https://' + redirectUrl;
      }
      
      // Check if it's a valid URL
      new URL(urlToSave);
      
      // Save to local storage
      setRedirectUrl(urlToSave);
      localStorage.setItem('redirectUrl', urlToSave);
      
      // Show success message
      setUrlSaved(true);
      setTimeout(() => setUrlSaved(false), 3000);
    } catch (error) {
      alert('Please enter a valid URL');
    }
    
    setIsEditingUrl(false);
  };

  // Handle cutoff time update
  const handleCutoffChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCutoffTime(e.target.value);
  };

  const saveCutoffTime = () => {
    try {
      // Validate time format (HH:MM)
      const timeRegex = /^([0-1]?[0-9]|2[0-3]):([0-5][0-9])$/;
      if (!timeRegex.test(cutoffTime)) {
        throw new Error('Invalid time format');
      }
      
      // Save to local storage
      localStorage.setItem('cutoffTime', cutoffTime);
      
      // Show success message
      setCutoffSaved(true);
      setTimeout(() => setCutoffSaved(false), 3000);
    } catch (error) {
      alert('Please enter a valid time in 24-hour format (HH:MM)');
    }
    
    setIsEditingCutoff(false);
  };

  // Get timezone abbreviation
  const getTimezoneAbbr = () => {
    return new Date().toLocaleTimeString('en-us', { timeZoneName: 'short' }).split(' ')[2];
  };

  // Export data to CSV
  const exportToCSV = () => {
    // Create CSV headers
    const headers = ['ID', 'User ID', 'Date', 'Score', 'Time Spent (sec)'].join(',');
    
    // Format data rows
    const rows = filteredResults.map(result => {
      return [
        result.id,
        result.userId,
        result.date,
        result.score,
        result.timeSpent
      ].join(',');
    });
    
    // Combine headers and rows
    const csvContent = [headers, ...rows].join('\n');
    
    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    // Create temporary link and trigger download
    const link = document.createElement('a');
    const filename = filterDate ? 
      `dsst_results_${filterDate}.csv` : 
      `dsst_results_all.csv`;
    
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    
    // Clean up
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-[#1e1f8e]">DSST Test Results</h1>
          <Link to="/" className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors duration-300">
            Logout
          </Link>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <h2 className="text-xl font-semibold text-[#1e1f8e] mb-4">Admin Settings</h2>
          
          <div className="mb-6 p-4 border border-[#8b8aeb]/30 rounded-lg">
            <h3 className="text-lg font-semibold text-[#1e1f8e] mb-2">Redirect URL Configuration</h3>
            <p className="text-sm text-gray-600 mb-4">
              This URL is where users will be redirected after completing the assessment.
            </p>
            
            <div className="flex items-center">
              {isEditingUrl ? (
                <>
                  <input 
                    type="text" 
                    value={redirectUrl}
                    onChange={handleUrlChange}
                    className="border border-[#8b8aeb] rounded px-3 py-2 flex-grow mr-2 focus:outline-none focus:ring-2 focus:ring-[#1e1f8e]"
                    placeholder="https://example.com"
                  />
                  <button 
                    onClick={saveRedirectUrl}
                    className="px-4 py-2 bg-[#1e1f8e] text-white rounded hover:bg-[#8b8aeb] transition-colors duration-300"
                  >
                    Save
                  </button>
                  <button 
                    onClick={() => {
                      setIsEditingUrl(false);
                      setRedirectUrl(getRedirectUrl());
                    }}
                    className="px-4 py-2 ml-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors duration-300"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  <div className="flex-grow border border-gray-200 rounded px-3 py-2 bg-gray-50 mr-2 overflow-hidden text-ellipsis">
                    {redirectUrl}
                  </div>
                  <button 
                    onClick={() => setIsEditingUrl(true)}
                    className="px-4 py-2 bg-[#1e1f8e] text-white rounded hover:bg-[#8b8aeb] transition-colors duration-300"
                  >
                    Edit
                  </button>
                </>
              )}
            </div>
            
            {urlSaved && (
              <div className="mt-2 p-2 bg-green-100 text-green-700 rounded border border-green-200">
                URL saved successfully!
              </div>
            )}
          </div>
          
          <div className="mb-6 p-4 border border-[#8b8aeb]/30 rounded-lg">
            <h3 className="text-lg font-semibold text-[#1e1f8e] mb-2">Daily Cutoff Time</h3>
            <p className="text-sm text-gray-600 mb-4">
              Set the time after which the assessment will no longer be available each day. Time is in your local timezone ({getTimezoneAbbr()}).
            </p>
            
            <div className="flex items-center">
              {isEditingCutoff ? (
                <>
                  <input 
                    type="time" 
                    value={cutoffTime}
                    onChange={handleCutoffChange}
                    className="border border-[#8b8aeb] rounded px-3 py-2 mr-2 focus:outline-none focus:ring-2 focus:ring-[#1e1f8e]"
                  />
                  <button 
                    onClick={saveCutoffTime}
                    className="px-4 py-2 bg-[#1e1f8e] text-white rounded hover:bg-[#8b8aeb] transition-colors duration-300"
                  >
                    Save
                  </button>
                  <button 
                    onClick={() => {
                      setIsEditingCutoff(false);
                      setCutoffTime(getCutoffTime());
                    }}
                    className="px-4 py-2 ml-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors duration-300"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  <div className="flex-grow border border-gray-200 rounded px-3 py-2 bg-gray-50 mr-2">
                    {cutoffTime} {getTimezoneAbbr()}
                  </div>
                  <button 
                    onClick={() => setIsEditingCutoff(true)}
                    className="px-4 py-2 bg-[#1e1f8e] text-white rounded hover:bg-[#8b8aeb] transition-colors duration-300"
                  >
                    Edit
                  </button>
                </>
              )}
            </div>
            
            {cutoffSaved && (
              <div className="mt-2 p-2 bg-green-100 text-green-700 rounded border border-green-200">
                Cutoff time saved successfully!
              </div>
            )}
          </div>

          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-[#1e1f8e]">Results Dashboard</h2>
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <label htmlFor="date-filter" className="mr-2">Filter by date:</label>
                <input
                  id="date-filter"
                  type="date"
                  className="border border-[#8b8aeb] rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-[#1e1f8e]"
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                />
                {filterDate && (
                  <button 
                    onClick={() => setFilterDate('')}
                    className="ml-2 text-sm text-[#1e1f8e] hover:text-[#8b8aeb]"
                  >
                    Clear
                  </button>
                )}
              </div>
              <button
                onClick={exportToCSV}
                className="flex items-center px-4 py-2 bg-[#1e1f8e] text-white rounded hover:bg-[#8b8aeb] transition-colors duration-300"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Export CSV
              </button>
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center h-40">
              <div className="text-[#1e1f8e] font-bold">Loading results...</div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border border-[#8b8aeb]/30">
                <thead>
                  <tr className="bg-[#1e1f8e] text-white">
                    <th className="py-2 px-4 text-left">ID</th>
                    <th className="py-2 px-4 text-left">User ID</th>
                    <th className="py-2 px-4 text-left">Date</th>
                    <th className="py-2 px-4 text-left">Score</th>
                    <th className="py-2 px-4 text-left">Time Spent (sec)</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredResults.map(result => (
                    <tr key={result.id} className="border-b border-[#8b8aeb]/30 hover:bg-[#8b8aeb]/5">
                      <td className="py-2 px-4">{result.id}</td>
                      <td className="py-2 px-4">{result.userId}</td>
                      <td className="py-2 px-4">{result.date}</td>
                      <td className="py-2 px-4">
                        <span className={`${result.score >= 15 ? 'text-[#1e1f8e]' : 'text-red-600'} font-semibold`}>
                          {result.score}/20
                        </span>
                      </td>
                      <td className="py-2 px-4">{result.timeSpent}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="mt-6 p-4 bg-[#8b8aeb]/10 rounded border border-[#8b8aeb]/30">
            <h3 className="text-lg font-semibold mb-3 text-[#1e1f8e]">Summary Statistics</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-3 bg-white rounded shadow border border-[#8b8aeb]/30">
                <p className="text-sm text-gray-500">Average Score</p>
                <p className="text-2xl font-bold text-[#1e1f8e]">
                  {filteredResults.length > 0 
                    ? (filteredResults.reduce((sum, result) => sum + result.score, 0) / filteredResults.length).toFixed(1)
                    : "0.0"
                  }
                </p>
              </div>
              <div className="p-3 bg-white rounded shadow border border-[#8b8aeb]/30">
                <p className="text-sm text-gray-500">Average Time (sec)</p>
                <p className="text-2xl font-bold text-[#1e1f8e]">
                  {filteredResults.length > 0
                    ? (filteredResults.reduce((sum, result) => sum + result.timeSpent, 0) / filteredResults.length).toFixed(1)
                    : "0.0"
                  }
                </p>
              </div>
              <div className="p-3 bg-white rounded shadow border border-[#8b8aeb]/30">
                <p className="text-sm text-gray-500">Total Tests</p>
                <p className="text-2xl font-bold text-[#1e1f8e]">{filteredResults.length}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/assessment" element={<Assessment />} />
        <Route path="/results" element={<ResultsPage />} />
      </Routes>
    </Router>
  );
}

export default App;
