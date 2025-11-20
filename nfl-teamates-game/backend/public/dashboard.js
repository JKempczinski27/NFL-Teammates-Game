// NFL Games Analytics Dashboard - JavaScript

// Configuration
const API_BASE = window.location.origin;
const GAME_COLORS = {
    teammates: '#2563eb',
    journeyman: '#7c3aed',
    trivia: '#10b981',
    all: '#64748b'
};

const GAME_NAMES = {
    teammates: 'NFL Teammates',
    journeyman: 'Journeyman',
    trivia: 'NFL Trivia'
};

// Global chart instances
let charts = {};
let currentTab = 'all';
let dashboardData = null;

// Initialize dashboard on page load
document.addEventListener('DOMContentLoaded', () => {
    loadDashboard();
});

// Main dashboard load function
async function loadDashboard() {
    showLoading();

    try {
        // Fetch all necessary data
        const [dashboard, dau, engagement, duration, hourly, weekly, retention, dropout, share] = await Promise.all([
            fetchAPI('/api/analytics/dashboard'),
            fetchAPI('/api/analytics/dau?days=30'),
            fetchAPI('/api/analytics/engagement'),
            fetchAPI('/api/analytics/session-duration'),
            fetchAPI('/api/analytics/hourly-patterns'),
            fetchAPI('/api/analytics/weekly-patterns'),
            fetchAPI('/api/analytics/retention?days=30'),
            fetchAPI('/api/analytics/dropout-analysis'),
            fetchAPI('/api/analytics/share-analytics')
        ]);

        // Store dashboard data
        dashboardData = {
            dashboard,
            dau,
            engagement,
            duration,
            hourly,
            weekly,
            retention,
            dropout,
            share
        };

        // Render dashboard
        renderDashboard();
        hideLoading();

    } catch (error) {
        showError(error.message);
    }
}

// Fetch API helper
async function fetchAPI(endpoint) {
    const response = await fetch(`${API_BASE}${endpoint}`);
    if (!response.ok) {
        throw new Error(`API Error: ${response.statusText}`);
    }
    return await response.json();
}

// Render complete dashboard
function renderDashboard() {
    renderSummaryCards();
    renderCompletionChart();
    renderDAUChart();
    renderEngagementChart();
    renderDurationChart();
    renderHourlyChart();
    renderWeeklyChart();
    renderRetentionChart();
    renderDropoutChart();
    renderShareChart();
    loadQuestionPerformance();
    loadLeaderboard('teammates');

    updateLastUpdated();
}

// Render summary cards
function renderSummaryCards() {
    const container = document.getElementById('summaryCards');
    const { overview, today, comparison } = dashboardData.dashboard;

    let html = '';

    // Overall summary card
    const totalSessions = overview.reduce((sum, g) => sum + parseInt(g.total_sessions || 0), 0);
    const todaySessions = today.reduce((sum, g) => sum + parseInt(g.sessions_today || 0), 0);

    html += `
        <div class="summary-card">
            <div class="summary-card-header">
                <h3>Total Sessions</h3>
                <span class="game-badge" style="background: rgba(100, 116, 139, 0.2); color: #94a3b8;">All Games</span>
            </div>
            <div class="summary-value">${formatNumber(totalSessions)}</div>
            <div class="summary-label">All time across all games</div>
            <div class="summary-change positive">
                <span>↑</span> ${formatNumber(todaySessions)} today
            </div>
        </div>
    `;

    // Game-specific cards
    overview.forEach(game => {
        const gameToday = today.find(t => t.game_type === game.game_type);
        const sessionsToday = gameToday ? parseInt(gameToday.sessions_today) : 0;

        html += `
            <div class="summary-card">
                <div class="summary-card-header">
                    <h3>${GAME_NAMES[game.game_type] || game.game_type}</h3>
                    <span class="game-badge ${game.game_type}">${game.game_type}</span>
                </div>
                <div class="summary-value">${formatNumber(game.total_sessions || 0)}</div>
                <div class="summary-label">Total sessions</div>
                <div class="summary-change ${sessionsToday > 0 ? 'positive' : ''}">
                    <span>${sessionsToday > 0 ? '↑' : '→'}</span> ${formatNumber(sessionsToday)} today
                </div>
            </div>

            <div class="summary-card">
                <div class="summary-card-header">
                    <h3>Completion Rate</h3>
                    <span class="game-badge ${game.game_type}">${game.game_type}</span>
                </div>
                <div class="summary-value">${game.completion_rate || 0}%</div>
                <div class="summary-label">Users who complete the game</div>
                <div class="summary-change ${game.completion_rate >= 60 ? 'positive' : 'negative'}">
                    Target: 60%
                </div>
            </div>

            <div class="summary-card">
                <div class="summary-card-header">
                    <h3>Avg Session Time</h3>
                    <span class="game-badge ${game.game_type}">${game.game_type}</span>
                </div>
                <div class="summary-value">${formatDuration(game.avg_session_duration)}</div>
                <div class="summary-label">Average time per session</div>
            </div>
        `;
    });

    container.innerHTML = html;
}

// Render completion rate chart
function renderCompletionChart() {
    const ctx = document.getElementById('completionChart');
    const { comparison } = dashboardData.dashboard;

    if (charts.completion) charts.completion.destroy();

    charts.completion = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: comparison.map(g => GAME_NAMES[g.game_type]),
            datasets: [{
                label: 'Completion Rate (%)',
                data: comparison.map(g => parseFloat(g.completion_rate)),
                backgroundColor: comparison.map(g => GAME_COLORS[g.game_type] + '80'),
                borderColor: comparison.map(g => GAME_COLORS[g.game_type]),
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: (context) => `${context.parsed.y.toFixed(1)}%`
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    ticks: {
                        callback: (value) => value + '%'
                    }
                }
            }
        }
    });
}

// Render DAU chart
function renderDAUChart() {
    const ctx = document.getElementById('dauChart');
    updateDAUChart();
}

function updateDAUChart() {
    const gameFilter = document.getElementById('dauGameFilter')?.value || '';
    const data = dashboardData.dau.data;

    // Filter and group data
    let filteredData = gameFilter ? data.filter(d => d.game_type === gameFilter) : data;

    // Group by date
    const groupedData = {};
    filteredData.forEach(d => {
        const date = d.date;
        if (!groupedData[date]) {
            groupedData[date] = {};
        }
        groupedData[date][d.game_type] = parseInt(d.dau);
    });

    // Sort dates
    const dates = Object.keys(groupedData).sort();

    // Prepare datasets
    const datasets = [];
    if (gameFilter) {
        datasets.push({
            label: GAME_NAMES[gameFilter],
            data: dates.map(date => groupedData[date][gameFilter] || 0),
            borderColor: GAME_COLORS[gameFilter],
            backgroundColor: GAME_COLORS[gameFilter] + '20',
            fill: true,
            tension: 0.4
        });
    } else {
        // Show all games
        ['teammates', 'journeyman', 'trivia'].forEach(game => {
            datasets.push({
                label: GAME_NAMES[game],
                data: dates.map(date => groupedData[date][game] || 0),
                borderColor: GAME_COLORS[game],
                backgroundColor: GAME_COLORS[game] + '20',
                fill: false,
                tension: 0.4
            });
        });
    }

    const ctx = document.getElementById('dauChart');
    if (charts.dau) charts.dau.destroy();

    charts.dau = new Chart(ctx, {
        type: 'line',
        data: {
            labels: dates.map(d => formatDate(d)),
            datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: { display: !gameFilter },
                tooltip: {
                    mode: 'index',
                    intersect: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

// Render engagement chart
function updateEngagementChart() {
    const gameFilter = document.getElementById('engagementGameFilter')?.value || '';
    const data = dashboardData.engagement.engagement_levels;

    const filteredData = gameFilter ? data.filter(d => d.game_type === gameFilter) : data;

    // Group by engagement level
    const grouped = {};
    filteredData.forEach(d => {
        if (!grouped[d.engagement_level]) {
            grouped[d.engagement_level] = 0;
        }
        grouped[d.engagement_level] += parseInt(d.session_count);
    });

    const ctx = document.getElementById('engagementChart');
    if (charts.engagement) charts.engagement.destroy();

    const labels = Object.keys(grouped);
    const values = Object.values(grouped);

    charts.engagement = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels,
            datasets: [{
                data: values,
                backgroundColor: [
                    '#ef4444',
                    '#f59e0b',
                    '#10b981',
                    '#2563eb',
                    '#7c3aed'
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: { position: 'bottom' }
            }
        }
    });
}

function renderEngagementChart() {
    updateEngagementChart();
}

// Render duration chart
function updateDurationChart() {
    const gameFilter = document.getElementById('durationGameFilter')?.value || '';
    const data = dashboardData.duration.distribution;

    const filteredData = gameFilter ? data.filter(d => d.game_type === gameFilter) : data;

    // Group by duration bucket
    const grouped = {};
    filteredData.forEach(d => {
        if (!grouped[d.duration_bucket]) {
            grouped[d.duration_bucket] = 0;
        }
        grouped[d.duration_bucket] += parseInt(d.session_count);
    });

    const bucketOrder = ['< 1 min', '1-3 min', '3-5 min', '5-10 min', '10-15 min', '> 15 min'];
    const labels = bucketOrder.filter(b => grouped[b]);
    const values = labels.map(l => grouped[l]);

    const ctx = document.getElementById('durationChart');
    if (charts.duration) charts.duration.destroy();

    charts.duration = new Chart(ctx, {
        type: 'bar',
        data: {
            labels,
            datasets: [{
                label: 'Sessions',
                data: values,
                backgroundColor: '#7c3aed80',
                borderColor: '#7c3aed',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

function renderDurationChart() {
    updateDurationChart();
}

// Render hourly patterns
function updateHourlyChart() {
    const gameFilter = document.getElementById('hourlyGameFilter')?.value || '';
    const data = dashboardData.hourly.patterns;

    const filteredData = gameFilter ? data.filter(d => d.game_type === gameFilter) : data;

    // Group by hour
    const grouped = {};
    for (let i = 0; i < 24; i++) {
        grouped[i] = 0;
    }

    filteredData.forEach(d => {
        const hour = parseInt(d.hour_of_day);
        grouped[hour] += parseInt(d.session_count);
    });

    const labels = Object.keys(grouped).map(h => `${h}:00`);
    const values = Object.values(grouped);

    const ctx = document.getElementById('hourlyChart');
    if (charts.hourly) charts.hourly.destroy();

    charts.hourly = new Chart(ctx, {
        type: 'line',
        data: {
            labels,
            datasets: [{
                label: 'Sessions',
                data: values,
                borderColor: '#10b981',
                backgroundColor: '#10b98120',
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

function renderHourlyChart() {
    updateHourlyChart();
}

// Render weekly patterns
function updateWeeklyChart() {
    const gameFilter = document.getElementById('weeklyGameFilter')?.value || '';
    const data = dashboardData.weekly.patterns;

    const filteredData = gameFilter ? data.filter(d => d.game_type === gameFilter) : data;

    // Group by day
    const grouped = {};
    filteredData.forEach(d => {
        const day = d.day_of_week.trim();
        if (!grouped[day]) {
            grouped[day] = 0;
        }
        grouped[day] += parseInt(d.session_count);
    });

    const dayOrder = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const labels = dayOrder.filter(d => grouped[d]);
    const values = labels.map(l => grouped[l]);

    const ctx = document.getElementById('weeklyChart');
    if (charts.weekly) charts.weekly.destroy();

    charts.weekly = new Chart(ctx, {
        type: 'bar',
        data: {
            labels,
            datasets: [{
                label: 'Sessions',
                data: values,
                backgroundColor: '#f59e0b80',
                borderColor: '#f59e0b',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

function renderWeeklyChart() {
    updateWeeklyChart();
}

// Render retention chart
function updateRetentionChart() {
    const gameFilter = document.getElementById('retentionGameFilter')?.value || '';
    const data = dashboardData.retention.cohorts;

    const filteredData = gameFilter ? data.filter(d => d.game_type === gameFilter) : data;

    // Take last 10 cohorts
    const recentCohorts = filteredData.slice(0, 10).reverse();

    const ctx = document.getElementById('retentionChart');
    if (charts.retention) charts.retention.destroy();

    charts.retention = new Chart(ctx, {
        type: 'line',
        data: {
            labels: recentCohorts.map(c => formatDate(c.cohort_date)),
            datasets: [{
                label: '7-Day Retention %',
                data: recentCohorts.map(c => parseFloat(c.retention_rate_7d) || 0),
                borderColor: '#2563eb',
                backgroundColor: '#2563eb20',
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: (context) => `${context.parsed.y.toFixed(1)}%`
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    ticks: {
                        callback: (value) => value + '%'
                    }
                }
            }
        }
    });
}

function renderRetentionChart() {
    updateRetentionChart();
}

// Render dropout chart
function updateDropoutChart() {
    const gameFilter = document.getElementById('dropoutGameFilter')?.value || '';
    const data = dashboardData.dropout.dropout_points;

    const filteredData = gameFilter ? data.filter(d => d.game_type === gameFilter) : data;

    // Take top 10 dropout points
    const topDropouts = filteredData.slice(0, 10);

    const ctx = document.getElementById('dropoutChart');
    if (charts.dropout) charts.dropout.destroy();

    charts.dropout = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: topDropouts.map(d => `Question ${d.dropped_off_at_question}`),
            datasets: [{
                label: 'Dropouts',
                data: topDropouts.map(d => parseInt(d.dropout_count)),
                backgroundColor: '#ef444480',
                borderColor: '#ef4444',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

function renderDropoutChart() {
    updateDropoutChart();
}

// Render share chart
function updateShareChart() {
    const gameFilter = document.getElementById('shareGameFilter')?.value || '';
    const data = dashboardData.share.platforms;

    const filteredData = gameFilter ? data.filter(d => d.game_type === gameFilter) : data;

    // Group by platform
    const grouped = {};
    filteredData.forEach(d => {
        if (!grouped[d.platform]) {
            grouped[d.platform] = 0;
        }
        grouped[d.platform] += parseInt(d.total_shares);
    });

    const ctx = document.getElementById('shareChart');
    if (charts.share) charts.share.destroy();

    charts.share = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: Object.keys(grouped),
            datasets: [{
                data: Object.values(grouped),
                backgroundColor: [
                    '#2563eb',
                    '#7c3aed',
                    '#10b981',
                    '#f59e0b',
                    '#ef4444'
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: { position: 'bottom' }
            }
        }
    });
}

function renderShareChart() {
    updateShareChart();
}

// Load question performance
async function loadQuestionPerformance() {
    const gameType = document.getElementById('questionGameSelect')?.value || 'teammates';
    await updateQuestionPerformance();
}

async function updateQuestionPerformance() {
    const gameType = document.getElementById('questionGameSelect').value;

    try {
        const data = await fetchAPI(`/api/analytics/question-performance?gameType=${gameType}`);

        // Render chart
        const ctx = document.getElementById('questionChart');
        if (charts.question) charts.question.destroy();

        charts.question = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.questions.map(q => `Q${q.question_index}`),
                datasets: [{
                    label: 'Success Rate %',
                    data: data.questions.map(q => parseFloat(q.success_rate)),
                    backgroundColor: data.questions.map(q => {
                        const rate = parseFloat(q.success_rate);
                        if (rate >= 70) return '#10b98180';
                        if (rate >= 50) return '#f59e0b80';
                        return '#ef444480';
                    }),
                    borderColor: data.questions.map(q => {
                        const rate = parseFloat(q.success_rate);
                        if (rate >= 70) return '#10b981';
                        if (rate >= 50) return '#f59e0b';
                        return '#ef4444';
                    }),
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: (context) => `${context.parsed.y.toFixed(1)}%`
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        ticks: {
                            callback: (value) => value + '%'
                        }
                    }
                }
            }
        });

        // Render stats
        const statsHtml = `
            <div class="question-stat-card">
                <h4>Total Questions</h4>
                <p>${data.summary.total_questions}</p>
            </div>
            <div class="question-stat-card">
                <h4>Avg Success Rate</h4>
                <p>${data.summary.avg_success_rate.toFixed(1)}%</p>
            </div>
            <div class="question-stat-card">
                <h4>Easiest Question</h4>
                <p>Q${data.summary.easiest?.question_index} (${parseFloat(data.summary.easiest?.success_rate).toFixed(1)}%)</p>
            </div>
            <div class="question-stat-card">
                <h4>Hardest Question</h4>
                <p>Q${data.summary.hardest?.question_index} (${parseFloat(data.summary.hardest?.success_rate).toFixed(1)}%)</p>
            </div>
        `;
        document.getElementById('questionStats').innerHTML = statsHtml;

    } catch (error) {
        console.error('Error loading question performance:', error);
    }
}

// Load leaderboard
async function loadLeaderboard(gameType) {
    try {
        const data = await fetchAPI(`/api/analytics/leaderboard/${gameType}?limit=20`);

        const html = `
            <div class="leaderboard-table">
                <table>
                    <thead>
                        <tr>
                            <th>Rank</th>
                            <th>Player</th>
                            <th>Best Score</th>
                            <th>Games Played</th>
                            <th>Avg Score</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${data.leaderboard.map(player => `
                            <tr>
                                <td>
                                    <span class="rank-badge ${getRankClass(player.rank)}">
                                        ${player.rank}
                                    </span>
                                </td>
                                <td><strong>${player.player_name}</strong></td>
                                <td>${formatNumber(player.best_score)}</td>
                                <td>${formatNumber(player.total_games_played)}</td>
                                <td>${parseFloat(player.avg_score).toFixed(0)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;

        document.getElementById('leaderboardContent').innerHTML = html;

    } catch (error) {
        console.error('Error loading leaderboard:', error);
        document.getElementById('leaderboardContent').innerHTML = `
            <div class="error-content">
                <p>No leaderboard data available yet.</p>
            </div>
        `;
    }
}

function switchLeaderboard(gameType) {
    // Update active tab
    document.querySelectorAll('.leaderboard-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    event.target.classList.add('active');

    loadLeaderboard(gameType);
}

function getRankClass(rank) {
    if (rank === 1) return 'gold';
    if (rank === 2) return 'silver';
    if (rank === 3) return 'bronze';
    return 'default';
}

// Export data
async function exportData() {
    const game = document.getElementById('exportGame').value;
    const type = document.getElementById('exportType').value;

    const url = `${API_BASE}/api/analytics/export/${game}?type=${type}`;
    window.open(url, '_blank');
}

// Tab switching
function switchTab(tab) {
    currentTab = tab;

    // Update active tab
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');

    // Filter charts based on tab
    if (tab !== 'all') {
        document.getElementById('dauGameFilter').value = tab;
        document.getElementById('engagementGameFilter').value = tab;
        document.getElementById('durationGameFilter').value = tab;
        document.getElementById('hourlyGameFilter').value = tab;
        document.getElementById('weeklyGameFilter').value = tab;
        document.getElementById('retentionGameFilter').value = tab;
        document.getElementById('dropoutGameFilter').value = tab;
        document.getElementById('shareGameFilter').value = tab;

        updateDAUChart();
        updateEngagementChart();
        updateDurationChart();
        updateHourlyChart();
        updateWeeklyChart();
        updateRetentionChart();
        updateDropoutChart();
        updateShareChart();
    } else {
        // Reset filters
        document.querySelectorAll('select[id$="GameFilter"]').forEach(select => {
            select.value = '';
        });

        updateDAUChart();
        updateEngagementChart();
        updateDurationChart();
        updateHourlyChart();
        updateWeeklyChart();
        updateRetentionChart();
        updateDropoutChart();
        updateShareChart();
    }
}

// Refresh dashboard
function refreshDashboard() {
    loadDashboard();
}

// Utility functions
function showLoading() {
    document.getElementById('loadingState').style.display = 'flex';
    document.getElementById('errorState').style.display = 'none';
    document.getElementById('dashboardContent').style.display = 'none';
}

function hideLoading() {
    document.getElementById('loadingState').style.display = 'none';
    document.getElementById('dashboardContent').style.display = 'block';
}

function showError(message) {
    document.getElementById('loadingState').style.display = 'none';
    document.getElementById('errorState').style.display = 'block';
    document.getElementById('errorMessage').textContent = message;
}

function formatNumber(num) {
    return parseInt(num).toLocaleString();
}

function formatDuration(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    if (mins === 0) return `${secs}s`;
    return `${mins}m ${secs}s`;
}

function formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function updateLastUpdated() {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    document.getElementById('lastUpdated').textContent = timeStr;
}
