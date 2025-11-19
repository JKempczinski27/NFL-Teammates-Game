/**
 * Test Data Generators
 * Provides mock data for various test scenarios
 */

const { v4: uuidv4 } = require('crypto');

/**
 * Generate random string
 */
function randomString(length = 10) {
  return Math.random().toString(36).substring(2, length + 2);
}

/**
 * Generate random email
 */
function randomEmail() {
  return `test${randomString(8)}@example.com`;
}

/**
 * Generate random session ID
 */
function randomSessionId() {
  return randomString(32);
}

/**
 * Generate test player data
 */
function generatePlayer(overrides = {}) {
  const positions = ['QB', 'RB', 'WR', 'TE', 'OL', 'DL', 'LB', 'DB', 'K', 'P'];
  const teams = ['Kansas City Chiefs', 'Buffalo Bills', 'Dallas Cowboys'];

  return {
    name: `Test Player ${randomString(5)}`,
    position: positions[Math.floor(Math.random() * positions.length)],
    teams: teams[Math.floor(Math.random() * teams.length)],
    years_active: `${2010 + Math.floor(Math.random() * 10)}-present`,
    ...overrides
  };
}

/**
 * Generate test question data
 */
function generateQuestion(overrides = {}) {
  const difficulties = ['easy', 'medium', 'hard'];
  const categories = ['teammates', 'same-team', 'career-overlap'];

  return {
    answer: `Test Answer ${randomString(5)}`,
    difficulty: difficulties[Math.floor(Math.random() * difficulties.length)],
    category: categories[Math.floor(Math.random() * categories.length)],
    ...overrides
  };
}

/**
 * Generate test user stats
 */
function generateUserStats(overrides = {}) {
  return {
    session_id: randomSessionId(),
    questions_answered: Math.floor(Math.random() * 100),
    correct: Math.floor(Math.random() * 50),
    incorrect: Math.floor(Math.random() * 50),
    streak: Math.floor(Math.random() * 20),
    ...overrides
  };
}

/**
 * Generate malicious SQL injection payloads
 */
function getSqlInjectionPayloads() {
  return [
    "'; DROP TABLE players; --",
    "1' OR '1'='1",
    "admin'--",
    "' OR 1=1--",
    "'; DELETE FROM users WHERE '1'='1",
    "1'; UPDATE players SET name='hacked' WHERE '1'='1",
    "<script>alert('XSS')</script>",
    "../../etc/passwd",
    "${7*7}",
    "{{7*7}}",
  ];
}

/**
 * Generate XSS attack payloads
 */
function getXssPayloads() {
  return [
    "<script>alert('XSS')</script>",
    "<img src=x onerror=alert('XSS')>",
    "<svg/onload=alert('XSS')>",
    "javascript:alert('XSS')",
    "<iframe src=javascript:alert('XSS')>",
    "<body onload=alert('XSS')>",
  ];
}

/**
 * Generate invalid data payloads
 */
function getInvalidDataPayloads() {
  return [
    null,
    undefined,
    {},
    [],
    '',
    ' ',
    'a'.repeat(10000), // Very long string
    -1,
    0,
    9999999999,
    NaN,
    Infinity,
    -Infinity,
  ];
}

/**
 * Generate realistic NFL players
 */
function getRealisticPlayers() {
  return [
    { name: 'Tom Brady', position: 'QB', teams: 'New England Patriots, Tampa Bay Buccaneers', years_active: '2000-2023' },
    { name: 'Aaron Rodgers', position: 'QB', teams: 'Green Bay Packers, New York Jets', years_active: '2005-present' },
    { name: 'Patrick Mahomes', position: 'QB', teams: 'Kansas City Chiefs', years_active: '2017-present' },
    { name: 'Travis Kelce', position: 'TE', teams: 'Kansas City Chiefs', years_active: '2013-present' },
    { name: 'Rob Gronkowski', position: 'TE', teams: 'New England Patriots, Tampa Bay Buccaneers', years_active: '2010-2021' },
    { name: 'Randy Moss', position: 'WR', teams: 'Minnesota Vikings, Oakland Raiders, New England Patriots', years_active: '1998-2012' },
    { name: 'Jerry Rice', position: 'WR', teams: 'San Francisco 49ers, Oakland Raiders, Seattle Seahawks', years_active: '1985-2004' },
    { name: 'Lawrence Taylor', position: 'LB', teams: 'New York Giants', years_active: '1981-1993' },
    { name: 'Peyton Manning', position: 'QB', teams: 'Indianapolis Colts, Denver Broncos', years_active: '1998-2015' },
    { name: 'Brett Favre', position: 'QB', teams: 'Atlanta Falcons, Green Bay Packers, New York Jets, Minnesota Vikings', years_active: '1991-2010' },
  ];
}

/**
 * Generate bulk data for load testing
 */
function generateBulkPlayers(count = 100) {
  return Array.from({ length: count }, () => generatePlayer());
}

/**
 * Generate bulk questions for load testing
 */
function generateBulkQuestions(count = 100) {
  return Array.from({ length: count }, () => generateQuestion());
}

/**
 * Generate concurrent request payload
 */
function generateConcurrentRequests(count = 50, generator = generatePlayer) {
  return Array.from({ length: count }, generator);
}

module.exports = {
  randomString,
  randomEmail,
  randomSessionId,
  generatePlayer,
  generateQuestion,
  generateUserStats,
  getSqlInjectionPayloads,
  getXssPayloads,
  getInvalidDataPayloads,
  getRealisticPlayers,
  generateBulkPlayers,
  generateBulkQuestions,
  generateConcurrentRequests,
};
