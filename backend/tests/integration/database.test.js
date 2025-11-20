/**
 * Integration Tests - Database Operations
 * Tests complete database functionality with all 6 tables
 */

const dbHelper = require('../helpers/dbHelper');
const {
  generatePlayer,
  generateQuestion,
  generateUserStats,
  randomSessionId,
} = require('../helpers/testData');

describe('Database Integration Tests', () => {
  beforeAll(async () => {
    await dbHelper.connect();
  });

  afterAll(async () => {
    await dbHelper.disconnect();
  });

  beforeEach(async () => {
    await dbHelper.cleanDatabase();
    await dbHelper.seedTeams();
  });

  describe('Teams Table', () => {
    it('should have 32 NFL teams seeded', async () => {
      const count = await dbHelper.getTableCount('teams');
      expect(count).toBe(32);
    });

    it('should retrieve all teams', async () => {
      const result = await dbHelper.query('SELECT * FROM teams ORDER BY name');
      expect(result.rows.length).toBe(32);
      expect(result.rows[0]).toHaveProperty('name');
      expect(result.rows[0]).toHaveProperty('abbreviation');
    });

    it('should have unique team names', async () => {
      const result = await dbHelper.query('SELECT name FROM teams');
      const names = result.rows.map(r => r.name);
      const uniqueNames = new Set(names);
      expect(uniqueNames.size).toBe(names.length);
    });

    it('should find team by abbreviation', async () => {
      const result = await dbHelper.query(
        'SELECT * FROM teams WHERE abbreviation = $1',
        ['KC']
      );
      expect(result.rows.length).toBe(1);
      expect(result.rows[0].name).toBe('Kansas City Chiefs');
    });

    it('should prevent duplicate team names', async () => {
      await expect(
        dbHelper.query(
          'INSERT INTO teams (name, city, abbreviation) VALUES ($1, $2, $3)',
          ['Kansas City Chiefs', 'Kansas City', 'KC']
        )
      ).rejects.toThrow();
    });
  });

  describe('Players Table', () => {
    it('should insert player successfully', async () => {
      const player = generatePlayer();
      const created = await dbHelper.createPlayer(player);

      expect(created).toHaveProperty('id');
      expect(created.name).toBe(player.name);
      expect(created.position).toBe(player.position);
    });

    it('should retrieve player by id', async () => {
      const player = await dbHelper.createPlayer(generatePlayer());
      const result = await dbHelper.query(
        'SELECT * FROM players WHERE id = $1',
        [player.id]
      );

      expect(result.rows.length).toBe(1);
      expect(result.rows[0].id).toBe(player.id);
    });

    it('should update player information', async () => {
      const player = await dbHelper.createPlayer(generatePlayer());
      const newName = 'Updated Player Name';

      await dbHelper.query(
        'UPDATE players SET name = $1 WHERE id = $2',
        [newName, player.id]
      );

      const result = await dbHelper.query(
        'SELECT * FROM players WHERE id = $1',
        [player.id]
      );

      expect(result.rows[0].name).toBe(newName);
    });

    it('should delete player', async () => {
      const player = await dbHelper.createPlayer(generatePlayer());

      await dbHelper.query('DELETE FROM players WHERE id = $1', [player.id]);

      const result = await dbHelper.query(
        'SELECT * FROM players WHERE id = $1',
        [player.id]
      );

      expect(result.rows.length).toBe(0);
    });

    it('should handle multiple players insertion', async () => {
      const players = await dbHelper.seedPlayers();
      expect(players.length).toBe(5);

      const count = await dbHelper.getTableCount('players');
      expect(count).toBe(5);
    });

    it('should search players by name', async () => {
      await dbHelper.seedPlayers();

      const result = await dbHelper.query(
        "SELECT * FROM players WHERE name LIKE '%Brady%'"
      );

      expect(result.rows.length).toBeGreaterThan(0);
      expect(result.rows[0].name).toContain('Brady');
    });

    it('should handle timestamp fields', async () => {
      const player = await dbHelper.createPlayer(generatePlayer());

      expect(player.created_at).toBeDefined();
      expect(player.updated_at).toBeDefined();
      expect(new Date(player.created_at)).toBeInstanceOf(Date);
    });
  });

  describe('Team Relationships Table', () => {
    it('should create player-team relationship', async () => {
      const player = await dbHelper.createPlayer(generatePlayer());
      const teamResult = await dbHelper.query(
        'SELECT id FROM teams WHERE abbreviation = $1',
        ['KC']
      );
      const teamId = teamResult.rows[0].id;

      const result = await dbHelper.query(
        'INSERT INTO team_relationships (player_id, team_id, year_start, year_end) VALUES ($1, $2, $3, $4) RETURNING *',
        [player.id, teamId, 2020, 2023]
      );

      expect(result.rows[0]).toHaveProperty('id');
      expect(result.rows[0].player_id).toBe(player.id);
      expect(result.rows[0].team_id).toBe(teamId);
    });

    it('should enforce foreign key constraint on player_id', async () => {
      const teamResult = await dbHelper.query(
        'SELECT id FROM teams WHERE abbreviation = $1',
        ['KC']
      );

      await expect(
        dbHelper.query(
          'INSERT INTO team_relationships (player_id, team_id, year_start) VALUES ($1, $2, $3)',
          [99999, teamResult.rows[0].id, 2020]
        )
      ).rejects.toThrow();
    });

    it('should enforce foreign key constraint on team_id', async () => {
      const player = await dbHelper.createPlayer(generatePlayer());

      await expect(
        dbHelper.query(
          'INSERT INTO team_relationships (player_id, team_id, year_start) VALUES ($1, $2, $3)',
          [player.id, 99999, 2020]
        )
      ).rejects.toThrow();
    });

    it('should cascade delete when player is deleted', async () => {
      const player = await dbHelper.createPlayer(generatePlayer());
      const teamResult = await dbHelper.query(
        'SELECT id FROM teams LIMIT 1'
      );

      await dbHelper.query(
        'INSERT INTO team_relationships (player_id, team_id, year_start) VALUES ($1, $2, $3)',
        [player.id, teamResult.rows[0].id, 2020]
      );

      await dbHelper.query('DELETE FROM players WHERE id = $1', [player.id]);

      const result = await dbHelper.query(
        'SELECT * FROM team_relationships WHERE player_id = $1',
        [player.id]
      );

      expect(result.rows.length).toBe(0);
    });

    it('should enforce valid year constraint', async () => {
      const player = await dbHelper.createPlayer(generatePlayer());
      const teamResult = await dbHelper.query('SELECT id FROM teams LIMIT 1');

      await expect(
        dbHelper.query(
          'INSERT INTO team_relationships (player_id, team_id, year_start, year_end) VALUES ($1, $2, $3, $4)',
          [player.id, teamResult.rows[0].id, 2020, 2015] // year_end < year_start
        )
      ).rejects.toThrow();
    });

    it('should allow NULL year_end for active players', async () => {
      const player = await dbHelper.createPlayer(generatePlayer());
      const teamResult = await dbHelper.query('SELECT id FROM teams LIMIT 1');

      const result = await dbHelper.query(
        'INSERT INTO team_relationships (player_id, team_id, year_start, year_end) VALUES ($1, $2, $3, $4) RETURNING *',
        [player.id, teamResult.rows[0].id, 2020, null]
      );

      expect(result.rows[0].year_end).toBeNull();
    });

    it('should retrieve all teams for a player', async () => {
      const player = await dbHelper.createPlayer(generatePlayer());
      const teams = await dbHelper.query('SELECT id FROM teams LIMIT 3');

      for (const team of teams.rows) {
        await dbHelper.query(
          'INSERT INTO team_relationships (player_id, team_id, year_start) VALUES ($1, $2, $3)',
          [player.id, team.id, 2020]
        );
      }

      const result = await dbHelper.query(
        `SELECT t.name, tr.year_start, tr.year_end
         FROM team_relationships tr
         JOIN teams t ON tr.team_id = t.id
         WHERE tr.player_id = $1`,
        [player.id]
      );

      expect(result.rows.length).toBe(3);
    });
  });

  describe('Questions Table', () => {
    it('should insert question successfully', async () => {
      const question = generateQuestion();
      const created = await dbHelper.createQuestion(question);

      expect(created).toHaveProperty('id');
      expect(created.answer).toBe(question.answer);
      expect(created.difficulty).toBe(question.difficulty);
    });

    it('should enforce difficulty constraint', async () => {
      await expect(
        dbHelper.query(
          'INSERT INTO questions (answer, difficulty, category) VALUES ($1, $2, $3)',
          ['Test Answer', 'invalid', 'teammates']
        )
      ).rejects.toThrow();
    });

    it('should accept valid difficulty levels', async () => {
      const difficulties = ['easy', 'medium', 'hard'];

      for (const difficulty of difficulties) {
        const result = await dbHelper.createQuestion({
          answer: `Test ${difficulty}`,
          difficulty,
          category: 'teammates'
        });

        expect(result.difficulty).toBe(difficulty);
      }

      const count = await dbHelper.getTableCount('questions');
      expect(count).toBe(3);
    });

    it('should filter questions by difficulty', async () => {
      await dbHelper.createQuestion({ answer: 'Easy Q', difficulty: 'easy' });
      await dbHelper.createQuestion({ answer: 'Hard Q', difficulty: 'hard' });

      const result = await dbHelper.query(
        'SELECT * FROM questions WHERE difficulty = $1',
        ['easy']
      );

      expect(result.rows.length).toBe(1);
      expect(result.rows[0].difficulty).toBe('easy');
    });

    it('should filter questions by category', async () => {
      await dbHelper.createQuestion({ answer: 'Q1', category: 'teammates' });
      await dbHelper.createQuestion({ answer: 'Q2', category: 'same-team' });

      const result = await dbHelper.query(
        'SELECT * FROM questions WHERE category = $1',
        ['teammates']
      );

      expect(result.rows.length).toBe(1);
      expect(result.rows[0].category).toBe('teammates');
    });
  });

  describe('Question Players Table', () => {
    it('should link question to player', async () => {
      const question = await dbHelper.createQuestion(generateQuestion());
      const player = await dbHelper.createPlayer(generatePlayer());

      const result = await dbHelper.query(
        'INSERT INTO question_players (question_id, player_id) VALUES ($1, $2) RETURNING *',
        [question.id, player.id]
      );

      expect(result.rows[0].question_id).toBe(question.id);
      expect(result.rows[0].player_id).toBe(player.id);
    });

    it('should enforce unique constraint', async () => {
      const question = await dbHelper.createQuestion(generateQuestion());
      const player = await dbHelper.createPlayer(generatePlayer());

      await dbHelper.query(
        'INSERT INTO question_players (question_id, player_id) VALUES ($1, $2)',
        [question.id, player.id]
      );

      await expect(
        dbHelper.query(
          'INSERT INTO question_players (question_id, player_id) VALUES ($1, $2)',
          [question.id, player.id]
        )
      ).rejects.toThrow();
    });

    it('should cascade delete when question is deleted', async () => {
      const question = await dbHelper.createQuestion(generateQuestion());
      const player = await dbHelper.createPlayer(generatePlayer());

      await dbHelper.query(
        'INSERT INTO question_players (question_id, player_id) VALUES ($1, $2)',
        [question.id, player.id]
      );

      await dbHelper.query('DELETE FROM questions WHERE id = $1', [question.id]);

      const result = await dbHelper.query(
        'SELECT * FROM question_players WHERE question_id = $1',
        [question.id]
      );

      expect(result.rows.length).toBe(0);
    });

    it('should retrieve all players for a question', async () => {
      const question = await dbHelper.createQuestion(generateQuestion());
      const players = await dbHelper.seedPlayers();

      for (const player of players.slice(0, 3)) {
        await dbHelper.query(
          'INSERT INTO question_players (question_id, player_id) VALUES ($1, $2)',
          [question.id, player.id]
        );
      }

      const result = await dbHelper.query(
        `SELECT p.name
         FROM question_players qp
         JOIN players p ON qp.player_id = p.id
         WHERE qp.question_id = $1`,
        [question.id]
      );

      expect(result.rows.length).toBe(3);
    });
  });

  describe('User Stats Table', () => {
    it('should create user stats', async () => {
      const sessionId = randomSessionId();
      const stats = await dbHelper.createUserStats(sessionId, {
        questions_answered: 10,
        correct: 7,
        incorrect: 3,
        streak: 5
      });

      expect(stats.session_id).toBe(sessionId);
      expect(stats.questions_answered).toBe(10);
      expect(stats.correct).toBe(7);
    });

    it('should enforce unique session_id', async () => {
      const sessionId = randomSessionId();
      await dbHelper.createUserStats(sessionId);

      await expect(
        dbHelper.createUserStats(sessionId)
      ).rejects.toThrow();
    });

    it('should retrieve stats by session_id', async () => {
      const sessionId = randomSessionId();
      await dbHelper.createUserStats(sessionId, { correct: 5 });

      const result = await dbHelper.query(
        'SELECT * FROM user_stats WHERE session_id = $1',
        [sessionId]
      );

      expect(result.rows.length).toBe(1);
      expect(result.rows[0].correct).toBe(5);
    });

    it('should update user stats', async () => {
      const sessionId = randomSessionId();
      await dbHelper.createUserStats(sessionId, { correct: 5 });

      await dbHelper.query(
        'UPDATE user_stats SET correct = $1 WHERE session_id = $2',
        [10, sessionId]
      );

      const result = await dbHelper.query(
        'SELECT * FROM user_stats WHERE session_id = $1',
        [sessionId]
      );

      expect(result.rows[0].correct).toBe(10);
    });

    it('should have default values', async () => {
      const sessionId = randomSessionId();
      const stats = await dbHelper.createUserStats(sessionId);

      expect(stats.questions_answered).toBe(0);
      expect(stats.correct).toBe(0);
      expect(stats.incorrect).toBe(0);
      expect(stats.streak).toBe(0);
    });

    it('should index session_id for fast lookup', async () => {
      const sessions = Array.from({ length: 100 }, () => randomSessionId());

      for (const session of sessions) {
        await dbHelper.createUserStats(session);
      }

      const start = Date.now();
      await dbHelper.query(
        'SELECT * FROM user_stats WHERE session_id = $1',
        [sessions[50]]
      );
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(50);
    });
  });

  describe('Complex Queries', () => {
    it('should retrieve players with their teams', async () => {
      const players = await dbHelper.seedPlayers();
      const teams = await dbHelper.query('SELECT id FROM teams LIMIT 2');

      await dbHelper.query(
        'INSERT INTO team_relationships (player_id, team_id, year_start) VALUES ($1, $2, $3)',
        [players[0].id, teams.rows[0].id, 2020]
      );

      const result = await dbHelper.query(
        `SELECT p.name, t.name as team_name
         FROM players p
         JOIN team_relationships tr ON p.id = tr.player_id
         JOIN teams t ON tr.team_id = t.id
         WHERE p.id = $1`,
        [players[0].id]
      );

      expect(result.rows.length).toBeGreaterThan(0);
      expect(result.rows[0]).toHaveProperty('team_name');
    });

    it('should calculate aggregated user statistics', async () => {
      const sessions = Array.from({ length: 10 }, () => randomSessionId());

      for (let i = 0; i < sessions.length; i++) {
        await dbHelper.createUserStats(sessions[i], {
          questions_answered: 10,
          correct: i,
          incorrect: 10 - i
        });
      }

      const result = await dbHelper.query(
        'SELECT AVG(correct) as avg_correct, SUM(questions_answered) as total FROM user_stats'
      );

      expect(parseFloat(result.rows[0].avg_correct)).toBeCloseTo(4.5);
      expect(parseInt(result.rows[0].total)).toBe(100);
    });

    it('should perform transaction rollback', async () => {
      const client = dbHelper.getPool();

      try {
        await client.query('BEGIN');
        await client.query(
          'INSERT INTO players (name, position) VALUES ($1, $2)',
          ['Transaction Test', 'QB']
        );
        await client.query('ROLLBACK');
      } catch (error) {
        await client.query('ROLLBACK');
      }

      const result = await dbHelper.query(
        "SELECT * FROM players WHERE name = 'Transaction Test'"
      );

      expect(result.rows.length).toBe(0);
    });

    it('should perform transaction commit', async () => {
      const client = dbHelper.getPool();

      await client.query('BEGIN');
      await client.query(
        'INSERT INTO players (name, position) VALUES ($1, $2)',
        ['Commit Test', 'QB']
      );
      await client.query('COMMIT');

      const result = await dbHelper.query(
        "SELECT * FROM players WHERE name = 'Commit Test'"
      );

      expect(result.rows.length).toBe(1);
    });
  });
});
