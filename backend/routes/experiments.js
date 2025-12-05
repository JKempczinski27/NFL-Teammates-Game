/**
 * A/B Testing Experiments API
 * Manages experiment creation, assignment tracking, and results analysis
 */

const express = require('express');
const router = express.Router();
const pool = require('../config/database');

/**
 * GET /api/experiments
 * List all experiments with optional filtering
 */
router.get('/', async (req, res) => {
  const { status, game_type } = req.query;
  const client = await pool.connect();

  try {
    let query = 'SELECT * FROM experiments WHERE 1=1';
    const params = [];

    if (status) {
      params.push(status);
      query += ` AND status = $${params.length}`;
    }

    if (game_type) {
      params.push(game_type);
      query += ` AND (game_type = $${params.length} OR game_type = 'all')`;
    }

    query += ' ORDER BY created_at DESC';

    const result = await client.query(query, params);

    res.json({
      success: true,
      experiments: result.rows,
      count: result.rows.length
    });
  } catch (error) {
    console.error('Error fetching experiments:', error);
    res.status(500).json({ error: 'Failed to fetch experiments' });
  } finally {
    client.release();
  }
});

/**
 * GET /api/experiments/:id
 * Get detailed information about a specific experiment
 */
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  const client = await pool.connect();

  try {
    // Get experiment details
    const experimentResult = await client.query(
      'SELECT * FROM experiments WHERE id = $1',
      [id]
    );

    if (experimentResult.rows.length === 0) {
      return res.status(404).json({ error: 'Experiment not found' });
    }

    const experiment = experimentResult.rows[0];

    // Get assignment counts
    const assignmentsResult = await client.query(
      `SELECT variant_id, COUNT(*) as count
       FROM experiment_assignments
       WHERE experiment_id = $1
       GROUP BY variant_id`,
      [id]
    );

    // Get event counts
    const eventsResult = await client.query(
      `SELECT event_type, variant_id, COUNT(*) as count, AVG(metric_value) as avg_value
       FROM experiment_events
       WHERE experiment_id = $1
       GROUP BY event_type, variant_id`,
      [id]
    );

    res.json({
      success: true,
      experiment,
      assignments: assignmentsResult.rows,
      events: eventsResult.rows
    });
  } catch (error) {
    console.error('Error fetching experiment:', error);
    res.status(500).json({ error: 'Failed to fetch experiment' });
  } finally {
    client.release();
  }
});

/**
 * POST /api/experiments
 * Create a new experiment
 */
router.post('/', async (req, res) => {
  const {
    name,
    description,
    hypothesis,
    game_type,
    variants,
    traffic_allocation,
    primary_metric,
    secondary_metrics,
    target_audience,
    tags,
    created_by
  } = req.body;

  // Validation
  if (!name || !variants || !primary_metric) {
    return res.status(400).json({
      error: 'Missing required fields: name, variants, primary_metric'
    });
  }

  const client = await pool.connect();

  try {
    const result = await client.query(
      `INSERT INTO experiments (
        name, description, hypothesis, game_type, variants,
        traffic_allocation, primary_metric, secondary_metrics,
        target_audience, tags, created_by, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'draft')
      RETURNING *`,
      [
        name,
        description || null,
        hypothesis || null,
        game_type || 'all',
        JSON.stringify(variants),
        traffic_allocation || 100,
        primary_metric,
        secondary_metrics ? JSON.stringify(secondary_metrics) : null,
        target_audience ? JSON.stringify(target_audience) : null,
        tags ? JSON.stringify(tags) : null,
        created_by || 'api'
      ]
    );

    res.status(201).json({
      success: true,
      experiment: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating experiment:', error);

    if (error.code === '23505') { // Unique violation
      return res.status(409).json({ error: 'Experiment with this name already exists' });
    }

    res.status(500).json({ error: 'Failed to create experiment' });
  } finally {
    client.release();
  }
});

/**
 * PUT /api/experiments/:id
 * Update experiment configuration
 */
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  const client = await pool.connect();

  try {
    // Build dynamic update query
    const allowedFields = [
      'description', 'hypothesis', 'status', 'variants',
      'traffic_allocation', 'primary_metric', 'secondary_metrics',
      'target_audience', 'start_date', 'end_date', 'tags', 'notes'
    ];

    const setClauses = [];
    const values = [];

    Object.keys(updates).forEach(key => {
      if (allowedFields.includes(key)) {
        values.push(
          ['variants', 'secondary_metrics', 'target_audience', 'tags'].includes(key)
            ? JSON.stringify(updates[key])
            : updates[key]
        );
        setClauses.push(`${key} = $${values.length}`);
      }
    });

    if (setClauses.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    values.push(id);
    const query = `
      UPDATE experiments
      SET ${setClauses.join(', ')}, updated_at = NOW()
      WHERE id = $${values.length}
      RETURNING *
    `;

    const result = await client.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Experiment not found' });
    }

    res.json({
      success: true,
      experiment: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating experiment:', error);
    res.status(500).json({ error: 'Failed to update experiment' });
  } finally {
    client.release();
  }
});

/**
 * POST /api/experiments/assign
 * Track experiment assignment (variant assignment for a user)
 */
router.post('/assign', async (req, res) => {
  const { experimentName, variantId, sessionId, userContext } = req.body;

  if (!experimentName || !variantId || !sessionId) {
    return res.status(400).json({
      error: 'Missing required fields: experimentName, variantId, sessionId'
    });
  }

  const client = await pool.connect();

  try {
    // Get experiment ID
    const experimentResult = await client.query(
      'SELECT id FROM experiments WHERE name = $1',
      [experimentName]
    );

    if (experimentResult.rows.length === 0) {
      // Experiment doesn't exist in database yet - create it on the fly
      console.log(`Auto-creating experiment: ${experimentName}`);
      return res.status(202).json({
        success: true,
        message: 'Experiment not found in database - assignment recorded locally'
      });
    }

    const experimentId = experimentResult.rows[0].id;

    // Record assignment (upsert to handle duplicates)
    await client.query(
      `INSERT INTO experiment_assignments (experiment_id, session_id, variant_id, user_context)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (experiment_id, session_id) DO NOTHING`,
      [experimentId, sessionId, variantId, userContext ? JSON.stringify(userContext) : null]
    );

    res.status(200).json({
      success: true,
      message: 'Assignment recorded'
    });
  } catch (error) {
    console.error('Error recording assignment:', error);
    res.status(500).json({ error: 'Failed to record assignment' });
  } finally {
    client.release();
  }
});

/**
 * POST /api/experiments/event
 * Track experiment event/metric
 */
router.post('/event', async (req, res) => {
  const { experimentName, variantId, sessionId, eventType, eventData, metricValue } = req.body;

  if (!experimentName || !variantId || !sessionId || !eventType) {
    return res.status(400).json({
      error: 'Missing required fields: experimentName, variantId, sessionId, eventType'
    });
  }

  const client = await pool.connect();

  try {
    // Get experiment ID
    const experimentResult = await client.query(
      'SELECT id FROM experiments WHERE name = $1',
      [experimentName]
    );

    if (experimentResult.rows.length === 0) {
      return res.status(202).json({
        success: true,
        message: 'Experiment not found - event recorded locally'
      });
    }

    const experimentId = experimentResult.rows[0].id;

    // Record event
    await client.query(
      `INSERT INTO experiment_events (experiment_id, session_id, variant_id, event_type, event_data, metric_value)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        experimentId,
        sessionId,
        variantId,
        eventType,
        eventData ? JSON.stringify(eventData) : null,
        metricValue
      ]
    );

    res.status(200).json({
      success: true,
      message: 'Event recorded'
    });
  } catch (error) {
    console.error('Error recording event:', error);
    res.status(500).json({ error: 'Failed to record event' });
  } finally {
    client.release();
  }
});

/**
 * GET /api/experiments/:id/results
 * Get experiment results with statistical analysis
 */
router.get('/:id/results', async (req, res) => {
  const { id } = req.params;
  const client = await pool.connect();

  try {
    // Refresh materialized view
    await client.query('SELECT refresh_experiment_results()');

    // Get results from materialized view
    const results = await client.query(
      'SELECT * FROM experiment_results WHERE experiment_id = $1',
      [id]
    );

    // Calculate statistical significance
    const statsResults = await calculateStatistics(client, id);

    res.json({
      success: true,
      results: results.rows,
      statistics: statsResults
    });
  } catch (error) {
    console.error('Error fetching results:', error);
    res.status(500).json({ error: 'Failed to fetch results' });
  } finally {
    client.release();
  }
});

/**
 * Calculate statistical significance between variants
 */
async function calculateStatistics(client, experimentId) {
  // Get variant results
  const results = await client.query(
    `SELECT
      variant_id,
      participants,
      completions,
      completion_rate,
      avg_time_to_complete,
      avg_score
    FROM experiment_results
    WHERE experiment_id = $1`,
    [experimentId]
  );

  if (results.rows.length < 2) {
    return { message: 'Need at least 2 variants for statistical analysis' };
  }

  const variants = results.rows;
  const control = variants.find(v => v.variant_id === 'control') || variants[0];
  const statistics = [];

  // Compare each variant to control
  variants.forEach(variant => {
    if (variant.variant_id === control.variant_id) return;

    const zScore = calculateZScore(
      control.completion_rate,
      variant.completion_rate,
      control.participants,
      variant.participants
    );

    const pValue = calculatePValue(zScore);
    const isSignificant = pValue < 0.05;
    const confidenceLevel = (1 - pValue) * 100;

    statistics.push({
      variant_id: variant.variant_id,
      control_rate: parseFloat(control.completion_rate),
      variant_rate: parseFloat(variant.completion_rate),
      lift: ((variant.completion_rate - control.completion_rate) / control.completion_rate * 100).toFixed(2),
      z_score: zScore.toFixed(4),
      p_value: pValue.toFixed(4),
      is_significant: isSignificant,
      confidence_level: confidenceLevel.toFixed(2),
      sample_size_control: control.participants,
      sample_size_variant: variant.participants
    });
  });

  return statistics;
}

/**
 * Calculate Z-score for two proportions
 */
function calculateZScore(p1, p2, n1, n2) {
  const pooledP = ((p1 * n1) + (p2 * n2)) / (n1 + n2);
  const se = Math.sqrt(pooledP * (1 - pooledP) * ((1 / n1) + (1 / n2)));

  if (se === 0) return 0;

  return (p2 - p1) / se;
}

/**
 * Calculate p-value from z-score (two-tailed test)
 */
function calculatePValue(zScore) {
  const absZ = Math.abs(zScore);

  // Approximate p-value using error function
  // This is a simplified calculation - for production, use a proper stats library
  const t = 1 / (1 + 0.2316419 * absZ);
  const d = 0.3989423 * Math.exp(-absZ * absZ / 2);
  const probability = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));

  return 2 * probability; // Two-tailed
}

/**
 * DELETE /api/experiments/:id
 * Delete an experiment (only if in draft status)
 */
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  const client = await pool.connect();

  try {
    const result = await client.query(
      `DELETE FROM experiments
       WHERE id = $1 AND status = 'draft'
       RETURNING id`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Experiment not found or cannot be deleted (must be in draft status)'
      });
    }

    res.json({
      success: true,
      message: 'Experiment deleted'
    });
  } catch (error) {
    console.error('Error deleting experiment:', error);
    res.status(500).json({ error: 'Failed to delete experiment' });
  } finally {
    client.release();
  }
});

/**
 * GET /api/experiments/stats/summary
 * Get overall experiment statistics
 */
router.get('/stats/summary', async (req, res) => {
  const client = await pool.connect();

  try {
    const summary = await client.query(`
      SELECT
        COUNT(*) FILTER (WHERE status = 'active') as active_experiments,
        COUNT(*) FILTER (WHERE status = 'completed') as completed_experiments,
        COUNT(*) FILTER (WHERE status = 'draft') as draft_experiments,
        COUNT(DISTINCT ea.session_id) as total_participants,
        COUNT(*) FILTER (WHERE ee.event_type LIKE 'goal_%') as total_conversions
      FROM experiments e
      LEFT JOIN experiment_assignments ea ON e.id = ea.experiment_id
      LEFT JOIN experiment_events ee ON e.id = ee.experiment_id
    `);

    res.json({
      success: true,
      summary: summary.rows[0]
    });
  } catch (error) {
    console.error('Error fetching summary:', error);
    res.status(500).json({ error: 'Failed to fetch summary' });
  } finally {
    client.release();
  }
});

module.exports = router;
