package analytics

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"time"
)

var (
	ErrInvalidDateRange = errors.New("invalid date range")
	ErrInvalidMetric    = errors.New("invalid metric type")
	ErrInvalidActivity  = errors.New("invalid activity type")
)

type Service struct {
	db *sql.DB
}

type Activity struct {
	ID        int64          `json:"id"`
	UserID    int64          `json:"userId"`
	Type      string         `json:"type"`
	Metadata  map[string]any `json:"metadata,omitempty"`
	CreatedAt time.Time      `json:"createdAt"`
}

type DailyMetric struct {
	ID        int64          `json:"id"`
	Date      time.Time      `json:"date"`
	Type      string         `json:"type"`
	Value     float64        `json:"value"`
	Metadata  map[string]any `json:"metadata,omitempty"`
	CreatedAt time.Time      `json:"createdAt"`
}

type UserEngagement struct {
	ID        int64     `json:"id"`
	UserID    int64     `json:"userId"`
	Type      string    `json:"type"`
	Value     float64   `json:"value"`
	StartDate time.Time `json:"startDate"`
	EndDate   time.Time `json:"endDate"`
	CreatedAt time.Time `json:"createdAt"`
}

type Report struct {
	ID         int64          `json:"id"`
	Type       string         `json:"type"`
	Data       map[string]any `json:"data"`
	Parameters map[string]any `json:"parameters,omitempty"`
	StartDate  time.Time      `json:"startDate"`
	EndDate    time.Time      `json:"endDate"`
	CreatedAt  time.Time      `json:"createdAt"`
}

func NewService(db *sql.DB) *Service {
	return &Service{db: db}
}

// TrackActivity records a user activity
func (s *Service) TrackActivity(ctx context.Context, userID int64, activityType string, metadata map[string]any) error {
	metadataJSON, err := json.Marshal(metadata)
	if err != nil {
		return err
	}

	_, err = s.db.ExecContext(ctx,
		`INSERT INTO user_activities (user_id, activity_type, metadata)
		VALUES ($1, $2, $3)`,
		userID, activityType, metadataJSON)
	return err
}

// CalculateDailyMetric calculates and stores a daily metric
func (s *Service) CalculateDailyMetric(ctx context.Context, metricType string, date time.Time) (*DailyMetric, error) {
	var value float64
	var metadata map[string]any

	// Calculate metric value based on type
	switch metricType {
	case "ACTIVE_USERS":
		err := s.db.QueryRowContext(ctx,
			`SELECT COUNT(DISTINCT user_id) 
			FROM user_activities 
			WHERE DATE(created_at) = DATE($1)`,
			date).Scan(&value)
		if err != nil {
			return nil, err
		}

	case "NEW_USERS":
		err := s.db.QueryRowContext(ctx,
			`SELECT COUNT(*) 
			FROM users 
			WHERE DATE(created_at) = DATE($1)`,
			date).Scan(&value)
		if err != nil {
			return nil, err
		}

	case "VERIFICATIONS":
		err := s.db.QueryRowContext(ctx,
			`SELECT COUNT(*) 
			FROM user_activities 
			WHERE activity_type = 'VERIFICATION' 
			AND DATE(created_at) = DATE($1)`,
			date).Scan(&value)
		if err != nil {
			return nil, err
		}

	case "TOKEN_VOLUME":
		err := s.db.QueryRowContext(ctx,
			`SELECT COALESCE(SUM(amount), 0) 
			FROM token_transactions 
			WHERE DATE(created_at) = DATE($1)`,
			date).Scan(&value)
		if err != nil {
			return nil, err
		}

	case "STAKE_VOLUME":
		err := s.db.QueryRowContext(ctx,
			`SELECT COALESCE(SUM(amount), 0) 
			FROM token_transactions 
			WHERE type = 'STAKE' 
			AND DATE(created_at) = DATE($1)`,
			date).Scan(&value)
		if err != nil {
			return nil, err
		}

	case "ENGAGEMENT_RATE":
		var totalUsers, activeUsers float64
		err := s.db.QueryRowContext(ctx,
			`SELECT 
				(SELECT COUNT(*) FROM users WHERE created_at <= $1) as total_users,
				(SELECT COUNT(DISTINCT user_id) FROM user_activities WHERE DATE(created_at) = DATE($1)) as active_users`,
			date).Scan(&totalUsers, &activeUsers)
		if err != nil {
			return nil, err
		}
		if totalUsers > 0 {
			value = (activeUsers / totalUsers) * 100
		}
		metadata = map[string]any{
			"totalUsers":  totalUsers,
			"activeUsers": activeUsers,
		}

	case "RETENTION_RATE":
		var prevUsers, retainedUsers float64
		prevDate := date.AddDate(0, 0, -1)
		err := s.db.QueryRowContext(ctx,
			`WITH prev_users AS (
				SELECT DISTINCT user_id 
				FROM user_activities 
				WHERE DATE(created_at) = DATE($1)
			)
			SELECT 
				(SELECT COUNT(*) FROM prev_users) as prev_users,
				(SELECT COUNT(DISTINCT a.user_id) 
				FROM user_activities a 
				JOIN prev_users p ON a.user_id = p.user_id 
				WHERE DATE(a.created_at) = DATE($2)) as retained_users`,
			prevDate, date).Scan(&prevUsers, &retainedUsers)
		if err != nil {
			return nil, err
		}
		if prevUsers > 0 {
			value = (retainedUsers / prevUsers) * 100
		}
		metadata = map[string]any{
			"previousUsers": prevUsers,
			"retainedUsers": retainedUsers,
		}

	default:
		return nil, ErrInvalidMetric
	}

	// Store metric
	metadataJSON, err := json.Marshal(metadata)
	if err != nil {
		return nil, err
	}

	var metric DailyMetric
	err = s.db.QueryRowContext(ctx,
		`INSERT INTO daily_metrics (metric_date, metric_type, metric_value, metadata)
		VALUES ($1, $2, $3, $4)
		RETURNING id, metric_date, metric_type, metric_value, metadata, created_at`,
		date, metricType, value, metadataJSON).Scan(
		&metric.ID, &metric.Date, &metric.Type, &metric.Value,
		&metadataJSON, &metric.CreatedAt)
	if err != nil {
		return nil, err
	}

	if len(metadataJSON) > 0 {
		if err := json.Unmarshal(metadataJSON, &metric.Metadata); err != nil {
			return nil, err
		}
	}

	return &metric, nil
}

// UpdateUserEngagement calculates and stores user engagement metrics
func (s *Service) UpdateUserEngagement(ctx context.Context, userID int64, startDate, endDate time.Time) error {
	if endDate.Before(startDate) {
		return ErrInvalidDateRange
	}

	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback()

	// Calculate activity count
	var activityCount float64
	err = tx.QueryRowContext(ctx,
		`SELECT COUNT(*) 
		FROM user_activities 
		WHERE user_id = $1 
		AND created_at BETWEEN $2 AND $3`,
		userID, startDate, endDate).Scan(&activityCount)
	if err != nil {
		return err
	}

	// Calculate verification success rate
	var totalVerifications, successfulVerifications float64
	err = tx.QueryRowContext(ctx,
		`SELECT 
			COUNT(*) as total,
			COUNT(*) FILTER (WHERE (metadata->>'success')::boolean = true) as successful
		FROM user_activities 
		WHERE user_id = $1 
		AND activity_type = 'VERIFICATION'
		AND created_at BETWEEN $2 AND $3`,
		userID, startDate, endDate).Scan(&totalVerifications, &successfulVerifications)
	if err != nil {
		return err
	}

	// Store metrics
	metrics := []struct {
		Type  string
		Value float64
	}{
		{"ACTIVITY_COUNT", activityCount},
		{"VERIFICATION_SUCCESS_RATE", calculateSuccessRate(totalVerifications, successfulVerifications)},
	}

	for _, m := range metrics {
		_, err = tx.ExecContext(ctx,
			`INSERT INTO user_engagement (user_id, metric_type, metric_value, start_date, end_date)
			VALUES ($1, $2, $3, $4, $5)`,
			userID, m.Type, m.Value, startDate, endDate)
		if err != nil {
			return err
		}
	}

	return tx.Commit()
}

func calculateSuccessRate(total, successful float64) float64 {
	if total > 0 {
		return (successful / total) * 100
	}
	return 0
}

// GenerateReport creates an analytics report for the specified period
func (s *Service) GenerateReport(ctx context.Context, reportType string, startDate, endDate time.Time, parameters map[string]any) (*Report, error) {
	if endDate.Before(startDate) {
		return nil, ErrInvalidDateRange
	}

	// Prepare report data
	data := make(map[string]any)
	var err error

	switch reportType {
	case "USER_GROWTH":
		data, err = s.generateUserGrowthReport(ctx, startDate, endDate)
	case "PLATFORM_ACTIVITY":
		data, err = s.generatePlatformActivityReport(ctx, startDate, endDate)
	case "TOKEN_METRICS":
		data, err = s.generateTokenMetricsReport(ctx, startDate, endDate)
	default:
		return nil, errors.New("unsupported report type")
	}
	if err != nil {
		return nil, err
	}

	// Store report
	dataJSON, err := json.Marshal(data)
	if err != nil {
		return nil, err
	}

	parametersJSON, err := json.Marshal(parameters)
	if err != nil {
		return nil, err
	}

	var report Report
	err = s.db.QueryRowContext(ctx,
		`INSERT INTO analytics_reports (report_type, report_data, parameters, start_date, end_date)
		VALUES ($1, $2, $3, $4, $5)
		RETURNING id, report_type, report_data, parameters, start_date, end_date, created_at`,
		reportType, dataJSON, parametersJSON, startDate, endDate).Scan(
		&report.ID, &report.Type, &dataJSON, &parametersJSON,
		&report.StartDate, &report.EndDate, &report.CreatedAt)
	if err != nil {
		return nil, err
	}

	if err := json.Unmarshal(dataJSON, &report.Data); err != nil {
		return nil, err
	}
	if len(parametersJSON) > 0 {
		if err := json.Unmarshal(parametersJSON, &report.Parameters); err != nil {
			return nil, err
		}
	}

	return &report, nil
}

func (s *Service) generateUserGrowthReport(ctx context.Context, startDate, endDate time.Time) (map[string]any, error) {
	var totalUsers, newUsers, activeUsers int
	err := s.db.QueryRowContext(ctx,
		`SELECT 
			(SELECT COUNT(*) FROM users WHERE created_at <= $2) as total_users,
			(SELECT COUNT(*) FROM users WHERE created_at BETWEEN $1 AND $2) as new_users,
			(SELECT COUNT(DISTINCT user_id) FROM user_activities WHERE created_at BETWEEN $1 AND $2) as active_users`,
		startDate, endDate).Scan(&totalUsers, &newUsers, &activeUsers)
	if err != nil {
		return nil, err
	}

	// Get daily new users
	rows, err := s.db.QueryContext(ctx,
		`SELECT DATE(created_at) as date, COUNT(*) as count
		FROM users
		WHERE created_at BETWEEN $1 AND $2
		GROUP BY DATE(created_at)
		ORDER BY date`,
		startDate, endDate)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	dailyNewUsers := make(map[string]int)
	for rows.Next() {
		var date time.Time
		var count int
		if err := rows.Scan(&date, &count); err != nil {
			return nil, err
		}
		dailyNewUsers[date.Format("2006-01-02")] = count
	}

	return map[string]any{
		"totalUsers":     totalUsers,
		"newUsers":       newUsers,
		"activeUsers":    activeUsers,
		"dailyNewUsers":  dailyNewUsers,
		"growthRate":     float64(newUsers) / float64(totalUsers-newUsers) * 100,
		"activationRate": float64(activeUsers) / float64(totalUsers) * 100,
	}, nil
}

func (s *Service) generatePlatformActivityReport(ctx context.Context, startDate, endDate time.Time) (map[string]any, error) {
	// Get activity counts by type
	rows, err := s.db.QueryContext(ctx,
		`SELECT activity_type, COUNT(*) as count
		FROM user_activities
		WHERE created_at BETWEEN $1 AND $2
		GROUP BY activity_type`,
		startDate, endDate)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	activityCounts := make(map[string]int)
	for rows.Next() {
		var activityType string
		var count int
		if err := rows.Scan(&activityType, &count); err != nil {
			return nil, err
		}
		activityCounts[activityType] = count
	}

	// Get daily active users
	rows, err = s.db.QueryContext(ctx,
		`SELECT DATE(created_at) as date, COUNT(DISTINCT user_id) as count
		FROM user_activities
		WHERE created_at BETWEEN $1 AND $2
		GROUP BY DATE(created_at)
		ORDER BY date`,
		startDate, endDate)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	dailyActiveUsers := make(map[string]int)
	for rows.Next() {
		var date time.Time
		var count int
		if err := rows.Scan(&date, &count); err != nil {
			return nil, err
		}
		dailyActiveUsers[date.Format("2006-01-02")] = count
	}

	return map[string]any{
		"activityCounts":    activityCounts,
		"dailyActiveUsers":  dailyActiveUsers,
		"totalActivities":   sumMapValues(activityCounts),
		"uniqueActiveUsers": len(dailyActiveUsers),
	}, nil
}

func (s *Service) generateTokenMetricsReport(ctx context.Context, startDate, endDate time.Time) (map[string]any, error) {
	var totalVolume, stakingVolume float64
	var totalTransactions, uniqueUsers int
	err := s.db.QueryRowContext(ctx,
		`SELECT 
			COALESCE(SUM(amount), 0) as total_volume,
			COALESCE(SUM(CASE WHEN type = 'STAKE' THEN amount ELSE 0 END), 0) as staking_volume,
			COUNT(*) as total_transactions,
			COUNT(DISTINCT user_id) as unique_users
		FROM token_transactions
		WHERE created_at BETWEEN $1 AND $2`,
		startDate, endDate).Scan(&totalVolume, &stakingVolume, &totalTransactions, &uniqueUsers)
	if err != nil {
		return nil, err
	}

	// Get daily transaction volume
	rows, err := s.db.QueryContext(ctx,
		`SELECT DATE(created_at) as date, SUM(amount) as volume
		FROM token_transactions
		WHERE created_at BETWEEN $1 AND $2
		GROUP BY DATE(created_at)
		ORDER BY date`,
		startDate, endDate)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	dailyVolume := make(map[string]float64)
	for rows.Next() {
		var date time.Time
		var volume float64
		if err := rows.Scan(&date, &volume); err != nil {
			return nil, err
		}
		dailyVolume[date.Format("2006-01-02")] = volume
	}

	return map[string]any{
		"totalVolume":       totalVolume,
		"stakingVolume":     stakingVolume,
		"totalTransactions": totalTransactions,
		"uniqueUsers":       uniqueUsers,
		"dailyVolume":       dailyVolume,
		"averageVolume":     totalVolume / float64(len(dailyVolume)),
	}, nil
}

func sumMapValues(m map[string]int) int {
	sum := 0
	for _, v := range m {
		sum += v
	}
	return sum
}
