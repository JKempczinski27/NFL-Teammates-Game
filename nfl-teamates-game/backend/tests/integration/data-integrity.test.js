/**
 * Data Integrity Tests
 * Tests all 6 database tables for constraints, relationships, and data integrity
 */

const dbHelper = require('../helpers/dbHelper');
const { generatePlayer, generateQuestion, randomSessionId } = require('../helpers/testData');

describe('Data Integrity Tests - All Tables', () => {
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

  describe('Table 1: Teams - Constraints & Integrity', () => {
    it('should have all required columns', async () => {
      const result = await dbHelper.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'teams'
        ORDER BY ordinal_position
      `);

      const columns = result.rows.map(r => r.column_name);
      expect(columns).toContain('id');
      expect(columns).toContain('name');
      expect(columns).toContain('city');
      expect(columns).toContain('abbreviation');
      expect(columns).toContain('created_at');
    });

    it('should enforce UNIQUE constraint on name', async () => {
      await expect(
        dbHelper.query(
          'INSERT INTO teams (name, city, abbreviation) VALUES ($1, $2, $3)',
          ['Kansas City Chiefs', 'Kansas City', 'KC']
        )
      ).rejects.toThrow();
    });

    it('should enforce NOT NULL on name', async () => {
      await expect(
        dbHelper.query(
          'INSERT INTO teams (name, city, abbreviation) VALUES ($1, $2, $3)',
          [null, 'Test City', 'TC']
        )
      ).rejects.toThrow();
    });

    it('should have primary key on id', async () => {
      const result = await dbHelper.query(`
        SELECT constraint_name, constraint_type
        FROM information_schema.table_constraints
        WHERE table_name = 'teams' AND constraint_type = 'PRIMARY KEY'
      `);

      expect(result.rows.length).toBe(1);
    });

    it('should auto-increment id field', async () => {
      const result1 = await dbHelper.query(
        'INSERT INTO teams (name, city, abbreviation) VALUES ($1, $2, $3) RETURNING id',
        ['Test Team 1', 'City 1', 'T1']
      );

      const result2 = await dbHelper.query(
        'INSERT INTO teams (name, city, abbreviation) VALUES ($1, $2, $3) RETURNING id',
        ['Test Team 2', 'City 2', 'T2']
      );

      expect(result2.rows[0].id).toBeGreaterThan(result1.rows[0].id);
    });

    it('should set created_at timestamp automatically', async () => {
      const before = new Date();
      await new Promise(resolve => setTimeout(resolve, 10));

      const result = await dbHelper.query(
        'INSERT INTO teams (name, city, abbreviation) VALUES ($1, $2, $3) RETURNING created_at',
        ['Time Test Team', 'City', 'TT']
      );

      await new Promise(resolve => setTimeout(resolve, 10));
      const after = new Date();

      const createdAt = new Date(result.rows[0].created_at);
      expect(createdAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(createdAt.getTime()).toBeLessThanOrEqual(after.getTime());
    });
  });

  describe('Table 2: Players - Constraints & Integrity', () => {
    it('should have all required columns', async () => {
      const result = await dbHelper.query(`
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_name = 'players'
        ORDER BY ordinal_position
      `);

      const columns = result.rows.map(r => r.column_name);
      expect(columns).toContain('id');
      expect(columns).toContain('name');
      expect(columns).toContain('position');
      expect(columns).toContain('teams');
      expect(columns).toContain('years_active');
      expect(columns).toContain('image_url');
      expect(columns).toContain('created_at');
      expect(columns).toContain('updated_at');
    });

    it('should enforce NOT NULL on name', async () => {
      await expect(
        dbHelper.query(
          'INSERT INTO players (name, position) VALUES ($1, $2)',
          [null, 'QB']
        )
      ).rejects.toThrow();
    });

    it('should allow multiple players with same name', async () => {
      await dbHelper.createPlayer({ name: 'Mike Smith', position: 'QB' });
      await dbHelper.createPlayer({ name: 'Mike Smith', position: 'WR' });

      const result = await dbHelper.query(
        "SELECT * FROM players WHERE name = 'Mike Smith'"
      );

      expect(result.rows.length).toBe(2);
    });

    it('should have index on name field', async () => {
      const result = await dbHelper.query(`
        SELECT indexname
        FROM pg_indexes
        WHERE tablename = 'players' AND indexname = 'idx_players_name'
      `);

      expect(result.rows.length).toBe(1);
    });

    it('should maintain created_at and updated_at timestamps', async () => {
      const player = await dbHelper.createPlayer(generatePlayer());

      expect(player.created_at).toBeDefined();
      expect(player.updated_at).toBeDefined();
      expect(new Date(player.created_at).getTime()).toBeLessThanOrEqual(
        new Date(player.updated_at).getTime()
      );
    });

    it('should allow NULL in optional fields', async () => {
      const result = await dbHelper.query(
        'INSERT INTO players (name, position, teams, years_active, image_url) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        ['Test Player', null, null, null, null]
      );

      expect(result.rows[0].position).toBeNull();
      expect(result.rows[0].teams).toBeNull();
      expect(result.rows[0].years_active).toBeNull();
    });

    it('should handle long text in teams field', async () => {
      const longTeamsList = Array(10).fill('Kansas City Chiefs').join(', ');

      const player = await dbHelper.createPlayer({
        name: 'Multi-Team Player',
        position: 'QB',
        teams: longTeamsList
      });

      expect(player.teams).toBe(longTeamsList);
    });
  });

  describe('Table 3: Team Relationships - Constraints & Integrity', () => {
    it('should have all required columns', async () => {
      const result = await dbHelper.query(`
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_name = 'team_relationships'
        ORDER BY ordinal_position
      `);

      const columns = result.rows.map(r => r.column_name);
      expect(columns).toContain('id');
      expect(columns).toContain('player_id');
      expect(columns).toContain('team_id');
      expect(columns).toContain('year_start');
      expect(columns).toContain('year_end');
      expect(columns).toContain('created_at');
    });

    it('should enforce foreign key on player_id', async () => {
      const team = await dbHelper.query('SELECT id FROM teams LIMIT 1');

      await expect(
        dbHelper.query(
          'INSERT INTO team_relationships (player_id, team_id, year_start) VALUES ($1, $2, $3)',
          [999999, team.rows[0].id, 2020]
        )
      ).rejects.toThrow();
    });

    it('should enforce foreign key on team_id', async () => {
      const player = await dbHelper.createPlayer(generatePlayer());

      await expect(
        dbHelper.query(
          'INSERT INTO team_relationships (player_id, team_id, year_start) VALUES ($1, $2, $3)',
          [player.id, 999999, 2020]
        )
      ).rejects.toThrow();
    });

    it('should CASCADE DELETE when player is deleted', async () => {
      const player = await dbHelper.createPlayer(generatePlayer());
      const team = await dbHelper.query('SELECT id FROM teams LIMIT 1');

      const rel = await dbHelper.query(
        'INSERT INTO team_relationships (player_id, team_id, year_start) VALUES ($1, $2, $3) RETURNING id',
        [player.id, team.rows[0].id, 2020]
      );

      await dbHelper.query('DELETE FROM players WHERE id = $1', [player.id]);

      const check = await dbHelper.query(
        'SELECT * FROM team_relationships WHERE id = $1',
        [rel.rows[0].id]
      );

      expect(check.rows.length).toBe(0);
    });

    it('should CASCADE DELETE when team is deleted', async () => {
      const player = await dbHelper.createPlayer(generatePlayer());
      const team = await dbHelper.query(
        'INSERT INTO teams (name, city, abbreviation) VALUES ($1, $2, $3) RETURNING id',
        ['Delete Test Team', 'Test City', 'DT']
      );

      const rel = await dbHelper.query(
        'INSERT INTO team_relationships (player_id, team_id, year_start) VALUES ($1, $2, $3) RETURNING id',
        [player.id, team.rows[0].id, 2020]
      );

      await dbHelper.query('DELETE FROM teams WHERE id = $1', [team.rows[0].id]);

      const check = await dbHelper.query(
        'SELECT * FROM team_relationships WHERE id = $1',
        [rel.rows[0].id]
      );

      expect(check.rows.length).toBe(0);
    });

    it('should enforce CHECK constraint: year_end >= year_start', async () => {
      const player = await dbHelper.createPlayer(generatePlayer());
      const team = await dbHelper.query('SELECT id FROM teams LIMIT 1');

      await expect(
        dbHelper.query(
          'INSERT INTO team_relationships (player_id, team_id, year_start, year_end) VALUES ($1, $2, $3, $4)',
          [player.id, team.rows[0].id, 2020, 2015]
        )
      ).rejects.toThrow();
    });

    it('should allow NULL year_end for active players', async () => {
      const player = await dbHelper.createPlayer(generatePlayer());
      const team = await dbHelper.query('SELECT id FROM teams LIMIT 1');

      const result = await dbHelper.query(
        'INSERT INTO team_relationships (player_id, team_id, year_start, year_end) VALUES ($1, $2, $3, $4) RETURNING *',
        [player.id, team.rows[0].id, 2020, null]
      );

      expect(result.rows[0].year_end).toBeNull();
    });

    it('should have indexes on player_id and team_id', async () => {
      const result = await dbHelper.query(`
        SELECT indexname
        FROM pg_indexes
        WHERE tablename = 'team_relationships'
        AND indexname IN ('idx_team_relationships_player_id', 'idx_team_relationships_team_id')
      `);

      expect(result.rows.length).toBe(2);
    });
  });

  describe('Table 4: Questions - Constraints & Integrity', () => {
    it('should have all required columns', async () => {
      const result = await dbHelper.query(`
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_name = 'questions'
        ORDER BY ordinal_position
      `);

      const columns = result.rows.map(r => r.column_name);
      expect(columns).toContain('id');
      expect(columns).toContain('answer');
      expect(columns).toContain('difficulty');
      expect(columns).toContain('category');
      expect(columns).toContain('created_at');
      expect(columns).toContain('updated_at');
    });

    it('should enforce NOT NULL on answer', async () => {
      await expect(
        dbHelper.query(
          'INSERT INTO questions (answer, difficulty, category) VALUES ($1, $2, $3)',
          [null, 'easy', 'teammates']
        )
      ).rejects.toThrow();
    });

    it('should enforce CHECK constraint on difficulty', async () => {
      await expect(
        dbHelper.query(
          'INSERT INTO questions (answer, difficulty, category) VALUES ($1, $2, $3)',
          ['Test Answer', 'super-hard', 'teammates']
        )
      ).rejects.toThrow();
    });

    it('should accept only valid difficulty values', async () => {
      const validDifficulties = ['easy', 'medium', 'hard'];

      for (const difficulty of validDifficulties) {
        const result = await dbHelper.query(
          'INSERT INTO questions (answer, difficulty, category) VALUES ($1, $2, $3) RETURNING difficulty',
          [`Answer ${difficulty}`, difficulty, 'teammates']
        );

        expect(result.rows[0].difficulty).toBe(difficulty);
      }

      const count = await dbHelper.getTableCount('questions');
      expect(count).toBe(3);
    });

    it('should have indexes on difficulty and category', async () => {
      const result = await dbHelper.query(`
        SELECT indexname
        FROM pg_indexes
        WHERE tablename = 'questions'
        AND indexname IN ('idx_questions_difficulty', 'idx_questions_category')
      `);

      expect(result.rows.length).toBe(2);
    });

    it('should allow NULL category', async () => {
      const result = await dbHelper.query(
        'INSERT INTO questions (answer, difficulty, category) VALUES ($1, $2, $3) RETURNING *',
        ['Test Answer', 'medium', null]
      );

      expect(result.rows[0].category).toBeNull();
    });

    it('should maintain timestamps', async () => {
      const question = await dbHelper.createQuestion(generateQuestion());

      expect(question.created_at).toBeDefined();
      expect(question.updated_at).toBeDefined();
    });
  });

  describe('Table 5: Question Players - Constraints & Integrity', () => {
    it('should have all required columns', async () => {
      const result = await dbHelper.query(`
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_name = 'question_players'
        ORDER BY ordinal_position
      `);

      const columns = result.rows.map(r => r.column_name);
      expect(columns).toContain('id');
      expect(columns).toContain('question_id');
      expect(columns).toContain('player_id');
      expect(columns).toContain('created_at');
    });

    it('should enforce foreign key on question_id', async () => {
      const player = await dbHelper.createPlayer(generatePlayer());

      await expect(
        dbHelper.query(
          'INSERT INTO question_players (question_id, player_id) VALUES ($1, $2)',
          [999999, player.id]
        )
      ).rejects.toThrow();
    });

    it('should enforce foreign key on player_id', async () => {
      const question = await dbHelper.createQuestion(generateQuestion());

      await expect(
        dbHelper.query(
          'INSERT INTO question_players (question_id, player_id) VALUES ($1, $2)',
          [question.id, 999999]
        )
      ).rejects.toThrow();
    });

    it('should enforce UNIQUE constraint on (question_id, player_id)', async () => {
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

    it('should allow same player in different questions', async () => {
      const question1 = await dbHelper.createQuestion(generateQuestion());
      const question2 = await dbHelper.createQuestion(generateQuestion());
      const player = await dbHelper.createPlayer(generatePlayer());

      await dbHelper.query(
        'INSERT INTO question_players (question_id, player_id) VALUES ($1, $2)',
        [question1.id, player.id]
      );

      await dbHelper.query(
        'INSERT INTO question_players (question_id, player_id) VALUES ($1, $2)',
        [question2.id, player.id]
      );

      const result = await dbHelper.query(
        'SELECT * FROM question_players WHERE player_id = $1',
        [player.id]
      );

      expect(result.rows.length).toBe(2);
    });

    it('should CASCADE DELETE when question is deleted', async () => {
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

    it('should CASCADE DELETE when player is deleted', async () => {
      const question = await dbHelper.createQuestion(generateQuestion());
      const player = await dbHelper.createPlayer(generatePlayer());

      await dbHelper.query(
        'INSERT INTO question_players (question_id, player_id) VALUES ($1, $2)',
        [question.id, player.id]
      );

      await dbHelper.query('DELETE FROM players WHERE id = $1', [player.id]);

      const result = await dbHelper.query(
        'SELECT * FROM question_players WHERE player_id = $1',
        [player.id]
      );

      expect(result.rows.length).toBe(0);
    });

    it('should have indexes on question_id and player_id', async () => {
      const result = await dbHelper.query(`
        SELECT indexname
        FROM pg_indexes
        WHERE tablename = 'question_players'
        AND indexname IN ('idx_question_players_question_id', 'idx_question_players_player_id')
      `);

      expect(result.rows.length).toBe(2);
    });
  });

  describe('Table 6: User Stats - Constraints & Integrity', () => {
    it('should have all required columns', async () => {
      const result = await dbHelper.query(`
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_name = 'user_stats'
        ORDER BY ordinal_position
      `);

      const columns = result.rows.map(r => r.column_name);
      expect(columns).toContain('id');
      expect(columns).toContain('session_id');
      expect(columns).toContain('questions_answered');
      expect(columns).toContain('correct');
      expect(columns).toContain('incorrect');
      expect(columns).toContain('streak');
      expect(columns).toContain('created_at');
      expect(columns).toContain('updated_at');
    });

    it('should enforce NOT NULL on session_id', async () => {
      await expect(
        dbHelper.query(
          'INSERT INTO user_stats (session_id) VALUES ($1)',
          [null]
        )
      ).rejects.toThrow();
    });

    it('should enforce UNIQUE constraint on session_id', async () => {
      const sessionId = randomSessionId();

      await dbHelper.createUserStats(sessionId);

      await expect(
        dbHelper.createUserStats(sessionId)
      ).rejects.toThrow();
    });

    it('should set default values for numeric fields', async () => {
      const sessionId = randomSessionId();
      const result = await dbHelper.query(
        'INSERT INTO user_stats (session_id) VALUES ($1) RETURNING *',
        [sessionId]
      );

      expect(result.rows[0].questions_answered).toBe(0);
      expect(result.rows[0].correct).toBe(0);
      expect(result.rows[0].incorrect).toBe(0);
      expect(result.rows[0].streak).toBe(0);
    });

    it('should have index on session_id', async () => {
      const result = await dbHelper.query(`
        SELECT indexname
        FROM pg_indexes
        WHERE tablename = 'user_stats' AND indexname = 'idx_user_stats_session_id'
      `);

      expect(result.rows.length).toBe(1);
    });

    it('should allow updating stats', async () => {
      const sessionId = randomSessionId();
      await dbHelper.createUserStats(sessionId, { correct: 5 });

      await dbHelper.query(
        'UPDATE user_stats SET correct = $1, streak = $2 WHERE session_id = $3',
        [10, 5, sessionId]
      );

      const result = await dbHelper.query(
        'SELECT * FROM user_stats WHERE session_id = $1',
        [sessionId]
      );

      expect(result.rows[0].correct).toBe(10);
      expect(result.rows[0].streak).toBe(5);
    });

    it('should maintain timestamps', async () => {
      const sessionId = randomSessionId();
      const stats = await dbHelper.createUserStats(sessionId);

      expect(stats.created_at).toBeDefined();
      expect(stats.updated_at).toBeDefined();
    });
  });

  describe('Cross-Table Referential Integrity', () => {
    it('should maintain integrity when deleting player with multiple relationships', async () => {
      const player = await dbHelper.createPlayer(generatePlayer());
      const question = await dbHelper.createQuestion(generateQuestion());
      const teams = await dbHelper.query('SELECT id FROM teams LIMIT 3');

      // Create multiple relationships
      for (const team of teams.rows) {
        await dbHelper.query(
          'INSERT INTO team_relationships (player_id, team_id, year_start) VALUES ($1, $2, $3)',
          [player.id, team.id, 2020]
        );
      }

      await dbHelper.query(
        'INSERT INTO question_players (question_id, player_id) VALUES ($1, $2)',
        [question.id, player.id]
      );

      // Delete player
      await dbHelper.query('DELETE FROM players WHERE id = $1', [player.id]);

      // All related records should be deleted
      const teamRels = await dbHelper.query(
        'SELECT * FROM team_relationships WHERE player_id = $1',
        [player.id]
      );

      const questionRels = await dbHelper.query(
        'SELECT * FROM question_players WHERE player_id = $1',
        [player.id]
      );

      expect(teamRels.rows.length).toBe(0);
      expect(questionRels.rows.length).toBe(0);
    });

    it('should maintain integrity in complex scenario', async () => {
      // Create full data scenario
      const players = await dbHelper.seedPlayers();
      const question = await dbHelper.createQuestion(generateQuestion());
      const teams = await dbHelper.query('SELECT id FROM teams LIMIT 5');

      // Link everything
      for (const player of players) {
        await dbHelper.query(
          'INSERT INTO question_players (question_id, player_id) VALUES ($1, $2)',
          [question.id, player.id]
        );

        for (const team of teams.rows.slice(0, 2)) {
          await dbHelper.query(
            'INSERT INTO team_relationships (player_id, team_id, year_start) VALUES ($1, $2, $3)',
            [player.id, team.id, 2020]
          );
        }
      }

      // Verify all relationships exist
      const qpCount = await dbHelper.getTableCount('question_players');
      const trCount = await dbHelper.getTableCount('team_relationships');

      expect(qpCount).toBe(5); // 5 players
      expect(trCount).toBe(10); // 5 players * 2 teams

      // Delete question should cascade
      await dbHelper.query('DELETE FROM questions WHERE id = $1', [question.id]);

      const qpCountAfter = await dbHelper.getTableCount('question_players');
      expect(qpCountAfter).toBe(0);
    });
  });
});
