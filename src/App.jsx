import React, { useState, useEffect } from 'react';
import { Play, CheckCircle, XCircle, Upload, Book, Code, Table, Github, RefreshCw } from 'lucide-react';

const SQLPracticePlatform = () => {
  const [SQL, setSQL] = useState(null);
  const [db, setDb] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [userQuery, setUserQuery] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [isCorrect, setIsCorrect] = useState(null);
  const [showImport, setShowImport] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingQuestions, setLoadingQuestions] = useState(false);

  // GitHub repository configuration
  const GITHUB_REPO = 'YOUR_USERNAME/YOUR_REPO_NAME'; // Update this!
  const QUESTIONS_FOLDER = 'questions';
  const GITHUB_API = `https://api.github.com/repos/${GITHUB_REPO}/contents/${QUESTIONS_FOLDER}`;

  const [questions, setQuestions] = useState([]);

  // Load questions from GitHub repository
  const loadQuestionsFromGitHub = async () => {
    setLoadingQuestions(true);
    try {
      const response = await fetch(GITHUB_API);
      
      if (!response.ok) {
        throw new Error('Failed to fetch questions from GitHub');
      }

      const files = await response.json();
      const jsonFiles = files.filter(file => file.name.endsWith('.json'));

      const loadedQuestions = [];
      
      for (const file of jsonFiles) {
        try {
          const fileResponse = await fetch(file.download_url);
          const questionData = await fileResponse.json();
          loadedQuestions.push({
            ...questionData,
            id: loadedQuestions.length + 1,
            filename: file.name
          });
        } catch (err) {
          console.error(`Error loading ${file.name}:`, err);
        }
      }

      if (loadedQuestions.length > 0) {
        setQuestions(loadedQuestions);
      } else {
        // Fallback to sample questions if GitHub loading fails
        setQuestions(getSampleQuestions());
      }
    } catch (err) {
      console.error('Error loading questions from GitHub:', err);
      // Use sample questions as fallback
      setQuestions(getSampleQuestions());
    } finally {
      setLoadingQuestions(false);
    }
  };

  const getSampleQuestions = () => [
    {
      id: 1,
      title: "Select All Employees",
      difficulty: "Easy",
      description: "Write a query to select all columns from the employees table.",
      schema: `CREATE TABLE employees (
  id INTEGER PRIMARY KEY,
  name TEXT,
  department TEXT,
  salary INTEGER
);

INSERT INTO employees VALUES (1, 'John Doe', 'Engineering', 75000);
INSERT INTO employees VALUES (2, 'Jane Smith', 'Marketing', 65000);
INSERT INTO employees VALUES (3, 'Bob Johnson', 'Engineering', 80000);
INSERT INTO employees VALUES (4, 'Alice Brown', 'HR', 60000);`,
      expectedResult: {
        columns: ['id', 'name', 'department', 'salary'],
        values: [
          [1, 'John Doe', 'Engineering', 75000],
          [2, 'Jane Smith', 'Marketing', 65000],
          [3, 'Bob Johnson', 'Engineering', 80000],
          [4, 'Alice Brown', 'HR', 60000]
        ]
      },
      hint: "Use SELECT * to select all columns"
    },
    {
      id: 2,
      title: "Filter by Department",
      difficulty: "Easy",
      description: "Write a query to select names of all employees in the Engineering department.",
      schema: `CREATE TABLE employees (
  id INTEGER PRIMARY KEY,
  name TEXT,
  department TEXT,
  salary INTEGER
);

INSERT INTO employees VALUES (1, 'John Doe', 'Engineering', 75000);
INSERT INTO employees VALUES (2, 'Jane Smith', 'Marketing', 65000);
INSERT INTO employees VALUES (3, 'Bob Johnson', 'Engineering', 80000);
INSERT INTO employees VALUES (4, 'Alice Brown', 'HR', 60000);`,
      expectedResult: {
        columns: ['name'],
        values: [
          ['John Doe'],
          ['Bob Johnson']
        ]
      },
      hint: "Use WHERE clause to filter by department"
    },
    {
      id: 3,
      title: "Average Salary by Department",
      difficulty: "Medium",
      description: "Write a query to find the average salary for each department. Order by department name.",
      schema: `CREATE TABLE employees (
  id INTEGER PRIMARY KEY,
  name TEXT,
  department TEXT,
  salary INTEGER
);

INSERT INTO employees VALUES (1, 'John Doe', 'Engineering', 75000);
INSERT INTO employees VALUES (2, 'Jane Smith', 'Marketing', 65000);
INSERT INTO employees VALUES (3, 'Bob Johnson', 'Engineering', 80000);
INSERT INTO employees VALUES (4, 'Alice Brown', 'HR', 60000);
INSERT INTO employees VALUES (5, 'Charlie Wilson', 'Marketing', 70000);`,
      expectedResult: {
        columns: ['department', 'avg_salary'],
        values: [
          ['Engineering', 77500],
          ['HR', 60000],
          ['Marketing', 67500]
        ]
      },
      hint: "Use GROUP BY with AVG() aggregate function"
    },
    {
      id: 4,
      title: "Top Earners",
      difficulty: "Medium",
      description: "Write a query to find employees earning more than $70,000. Show name and salary, ordered by salary descending.",
      schema: `CREATE TABLE employees (
  id INTEGER PRIMARY KEY,
  name TEXT,
  department TEXT,
  salary INTEGER
);

INSERT INTO employees VALUES (1, 'John Doe', 'Engineering', 75000);
INSERT INTO employees VALUES (2, 'Jane Smith', 'Marketing', 65000);
INSERT INTO employees VALUES (3, 'Bob Johnson', 'Engineering', 80000);
INSERT INTO employees VALUES (4, 'Alice Brown', 'HR', 60000);
INSERT INTO employees VALUES (5, 'Charlie Wilson', 'Marketing', 70000);`,
      expectedResult: {
        columns: ['name', 'salary'],
        values: [
          ['Bob Johnson', 80000],
          ['John Doe', 75000]
        ]
      },
      hint: "Use WHERE with comparison operator and ORDER BY DESC"
    }
  ];

  // Load SQL.js
  useEffect(() => {
    const loadSQL = async () => {
      try {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/sql-wasm.js';
        script.async = true;
        
        script.onload = async () => {
          const initSqlJs = window.initSqlJs;
          if (initSqlJs) {
            const SQLEngine = await initSqlJs({
              locateFile: file => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/${file}`
            });
            setSQL(SQLEngine);
            setLoading(false);
          }
        };
        
        script.onerror = () => {
          setError('Failed to load SQL.js library');
          setLoading(false);
        };
        
        document.head.appendChild(script);
      } catch (err) {
        setError('Error initializing SQL engine: ' + err.message);
        setLoading(false);
      }
    };
    loadSQL();
  }, []);

  // Load questions from GitHub on mount
  useEffect(() => {
    loadQuestionsFromGitHub();
  }, []);

  // Initialize database with current question's schema
  useEffect(() => {
    if (SQL && questions.length > 0 && questions[currentQuestion]) {
      const newDb = new SQL.Database();
      const schema = questions[currentQuestion].schema;
      try {
        newDb.exec(schema);
        setDb(newDb);
        setUserQuery('');
        setResult(null);
        setError('');
        setIsCorrect(null);
      } catch (err) {
        setError('Error loading question schema');
      }
    }
  }, [SQL, currentQuestion, questions]);

  const normalizeResult = (result) => {
    if (!result || result.length === 0) return null;
    return {
      columns: result[0].columns.map(c => c.toLowerCase()),
      values: result[0].values.map(row => 
        row.map(cell => typeof cell === 'number' ? Math.round(cell * 100) / 100 : cell)
      )
    };
  };

  const executeQuery = () => {
    if (!db || !userQuery.trim()) {
      setError('Please enter a query');
      return;
    }

    try {
      setError('');
      
      const userResult = db.exec(userQuery);
      const normalizedUser = normalizeResult(userResult);
      const expected = questions[currentQuestion].expectedResult;
      
      const normalizedExpected = {
        columns: expected.columns.map(c => c.toLowerCase()),
        values: expected.values.map(row => 
          row.map(cell => typeof cell === 'number' ? Math.round(cell * 100) / 100 : cell)
        )
      };
      
      const matches = normalizedUser && 
        JSON.stringify(normalizedUser.columns.sort()) === JSON.stringify(normalizedExpected.columns.sort()) &&
        JSON.stringify(normalizedUser.values.sort()) === JSON.stringify(normalizedExpected.values.sort());
      
      setIsCorrect(matches);
      
      if (userResult.length > 0) {
        setResult(userResult[0]);
      } else {
        setResult({ columns: [], values: [] });
      }
    } catch (err) {
      setError(err.message);
      setResult(null);
      setIsCorrect(false);
    }
  };

  const importQuestions = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const text = await file.text();
      const importedQuestions = JSON.parse(text);
      
      if (Array.isArray(importedQuestions)) {
        const questionsWithIds = importedQuestions.map((q, idx) => ({
          ...q,
          id: questions.length + idx + 1
        }));
        setQuestions([...questions, ...questionsWithIds]);
        setShowImport(false);
        alert(`Successfully imported ${importedQuestions.length} question(s)!`);
      } else if (importedQuestions.title) {
        const questionWithId = {
          ...importedQuestions,
          id: questions.length + 1
        };
        setQuestions([...questions, questionWithId]);
        setShowImport(false);
        alert('Successfully imported 1 question!');
      }
    } catch (err) {
      alert('Error importing questions: ' + err.message);
    }
  };

  const downloadTemplate = () => {
    const template = {
      title: "Question Title",
      difficulty: "Easy",
      description: "Describe what the query should accomplish.",
      schema: "CREATE TABLE example (id INTEGER, name TEXT);\nINSERT INTO example VALUES (1, 'test');",
      expectedResult: {
        columns: ["id", "name"],
        values: [[1, "test"]]
      },
      hint: "Provide a helpful hint here"
    };
    
    const blob = new Blob([JSON.stringify(template, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'question-template.json';
    a.click();
  };

  const difficultyColor = (difficulty) => {
    switch(difficulty) {
      case 'Easy': return 'text-green-600 bg-green-100';
      case 'Medium': return 'text-yellow-600 bg-yellow-100';
      case 'Hard': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const renderTable = (data) => {
    if (!data || !data.columns || data.columns.length === 0) return null;
    
    return (
      <div className="overflow-x-auto">
        <table className="min-w-full border text-sm">
          <thead className="bg-gray-100">
            <tr>
              {data.columns.map((col, idx) => (
                <th key={idx} className="border px-3 py-2 text-left font-semibold">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.values.map((row, rowIdx) => (
              <tr key={rowIdx} className="hover:bg-gray-50">
                {row.map((cell, cellIdx) => (
                  <td key={cellIdx} className="border px-3 py-2">
                    {cell !== null ? cell.toString() : 'NULL'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading SQL Engine...</p>
        </div>
      </div>
    );
  }

  if (showImport) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-sm p-8">
          <h2 className="text-2xl font-bold mb-6">Import Questions / Contribute</h2>
          
          <div className="space-y-6">
            <div className="bg-blue-50 border-l-4 border-blue-600 p-4 rounded">
              <h3 className="font-semibold mb-2">Two ways to add questions:</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <strong>1. Quick Import (Local):</strong>
                  <ul className="list-disc list-inside ml-4 mt-1">
                    <li>Download the template</li>
                    <li>Edit it with your question</li>
                    <li>Upload it here</li>
                  </ul>
                </div>
                <div>
                  <strong>2. Contribute to Community (GitHub PR):</strong>
                  <ul className="list-disc list-inside ml-4 mt-1">
                    <li>Fork the repository</li>
                    <li>Add your question JSON to the <code className="bg-gray-200 px-1 rounded">questions/</code> folder</li>
                    <li>Create a Pull Request</li>
                    <li>Your question will be available to everyone!</li>
                  </ul>
                </div>
              </div>
            </div>

            <button
              onClick={downloadTemplate}
              className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium"
            >
              Download Question Template
            </button>

            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <label className="cursor-pointer">
                <span className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium inline-block">
                  Choose JSON File
                </span>
                <input
                  type="file"
                  accept=".json"
                  onChange={importQuestions}
                  className="hidden"
                />
              </label>
              <p className="mt-2 text-sm text-gray-500">Upload a JSON file with question(s)</p>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => window.open(`https://github.com/${GITHUB_REPO}`, '_blank')}
                className="flex-1 px-4 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition font-medium flex items-center justify-center gap-2"
              >
                <Github className="w-5 h-5" />
                View on GitHub
              </button>
              <button
                onClick={() => setShowImport(false)}
                className="flex-1 px-4 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600">Loading questions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-[1800px] mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Code className="w-8 h-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">SQL Practice Platform</h1>
              <span className="text-sm text-gray-500">({questions.length} questions)</span>
            </div>
            <div className="flex gap-3">
              <button
                onClick={loadQuestionsFromGitHub}
                disabled={loadingQuestions}
                className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${loadingQuestions ? 'animate-spin' : ''}`} />
                Reload
              </button>
              <button
                onClick={() => setShowImport(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                <Upload className="w-4 h-4" />
                Add / Contribute
              </button>
              <button
                onClick={() => window.open(`https://github.com/${GITHUB_REPO}`, '_blank')}
                className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition"
              >
                <Github className="w-4 h-4" />
                GitHub
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1800px] mx-auto px-4 py-6">
        <div className="grid grid-cols-12 gap-6">
          {/* Questions List */}
          <div className="col-span-2 bg-white rounded-lg shadow-sm p-4 h-fit sticky top-6">
            <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
              <Book className="w-5 h-5" />
              Questions
            </h2>
            <div className="space-y-2 max-h-[calc(100vh-200px)] overflow-y-auto">
              {questions.map((q, idx) => (
                <button
                  key={q.id}
                  onClick={() => setCurrentQuestion(idx)}
                  className={`w-full text-left p-3 rounded-lg transition ${
                    currentQuestion === idx
                      ? 'bg-blue-50 border-2 border-blue-600'
                      : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                  }`}
                >
                  <div className="font-medium text-sm">{q.id}. {q.title}</div>
                  <div className={`text-xs px-2 py-1 rounded mt-1 inline-block ${difficultyColor(q.difficulty)}`}>
                    {q.difficulty}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Question Details - Left Side */}
          <div className="col-span-5 space-y-4">
            {/* Question Description */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">{questions[currentQuestion].title}</h2>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${difficultyColor(questions[currentQuestion].difficulty)}`}>
                  {questions[currentQuestion].difficulty}
                </span>
              </div>
              <p className="text-gray-700 mb-4">{questions[currentQuestion].description}</p>
              <div className="bg-blue-50 border-l-4 border-blue-600 p-4 rounded">
                <p className="text-sm text-blue-800"><strong>Hint:</strong> {questions[currentQuestion].hint}</p>
              </div>
            </div>

            {/* Schema Display */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Code className="w-4 h-4" />
                Database Schema
              </h3>
              <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-xs">
                {questions[currentQuestion].schema.trim()}
              </pre>
            </div>

            {/* Input Data Table */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Table className="w-4 h-4" />
                Input Data
              </h3>
              {SQL && (() => {
                try {
                  const tempDb = new SQL.Database();
                  tempDb.exec(questions[currentQuestion].schema);
                  const tables = tempDb.exec("SELECT name FROM sqlite_master WHERE type='table'");
                  
                  return tables[0].values.map(([tableName]) => {
                    const data = tempDb.exec(`SELECT * FROM ${tableName}`);
                    return (
                      <div key={tableName} className="mb-4">
                        <h4 className="text-sm font-medium mb-2 text-gray-700">{tableName}</h4>
                        {renderTable(data[0])}
                      </div>
                    );
                  });
                } catch (err) {
                  return <p className="text-sm text-gray-500">Unable to display input data</p>;
                }
              })()}
            </div>

            {/* Expected Output */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                Expected Output
              </h3>
              {renderTable(questions[currentQuestion].expectedResult)}
            </div>
          </div>

          {/* SQL Editor and Results - Right Side */}
          <div className="col-span-5 space-y-4">
            {/* SQL Editor */}
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold">Your SQL Query</h3>
                <button
                  onClick={executeQuery}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                >
                  <Play className="w-4 h-4" />
                  Run Query
                </button>
              </div>
              <textarea
                value={userQuery}
                onChange={(e) => setUserQuery(e.target.value)}
                placeholder="-- Write your SQL query here..."
                className="w-full h-64 p-4 border rounded-lg font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>

            {/* Results */}
            {(result || error || isCorrect !== null) && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                {isCorrect !== null && (
                  <div className={`flex items-center gap-2 mb-4 p-4 rounded-lg ${
                    isCorrect ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
                  }`}>
                    {isCorrect ? (
                      <>
                        <CheckCircle className="w-5 h-5" />
                        <span className="font-semibold">Correct! Well done! 🎉</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-5 h-5" />
                        <span className="font-semibold">Not quite right. Compare your output with the expected output.</span>
                      </>
                    )}
                  </div>
                )}

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-lg mb-4">
                    <strong>Error:</strong> {error}
                  </div>
                )}

                {result && (
                  <div>
                    <h3 className="font-semibold mb-3">Your Query Results</h3>
                    {result.values && result.values.length > 0 ? (
                      renderTable(result)
                    ) : (
                      <p className="text-gray-500">Query executed successfully. No rows returned.</p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SQLPracticePlatform;
