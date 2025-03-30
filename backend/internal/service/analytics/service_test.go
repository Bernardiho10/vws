package analytics

import (
	"context"
	"database/sql"
	"testing"
	"time"

	"github.com/DATA-DOG/go-sqlmock"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func setupTestDB(t *testing.T) (*sql.DB, sqlmock.Sqlmock) {
	db, mock, err := sqlmock.New()
	require.NoError(t, err)
	return db, mock
}

func TestTrackActivity(t *testing.T) {
	db, mock := setupTestDB(t)
	defer db.Close()

	service := NewService(db)
	ctx := context.Background()
	userID := int64(1)
	activityType := "LOGIN"
	metadata := map[string]any{"ip": "127.0.0.1"}

	mock.ExpectExec("INSERT INTO user_activities").
		WithArgs(userID, activityType, sqlmock.AnyArg()).
		WillReturnResult(sqlmock.NewResult(1, 1))

	err := service.TrackActivity(ctx, userID, activityType, metadata)
	assert.NoError(t, err)
	assert.NoError(t, mock.ExpectationsWereMet())
}

func TestCalculateDailyMetric(t *testing.T) {
	tests := []struct {
		name       string
		metricType string
		setupMock  func(mock sqlmock.Sqlmock)
		wantErr    bool
	}{
		{
			name:       "Active Users",
			metricType: "ACTIVE_USERS",
			setupMock: func(mock sqlmock.Sqlmock) {
				mock.ExpectQuery("SELECT COUNT").
					WillReturnRows(sqlmock.NewRows([]string{"count"}).AddRow(10))
				mock.ExpectQuery("INSERT INTO daily_metrics").
					WithArgs(sqlmock.AnyArg(), "ACTIVE_USERS", float64(10), sqlmock.AnyArg()).
					WillReturnRows(sqlmock.NewRows([]string{"id", "metric_date", "metric_type", "metric_value", "metadata", "created_at"}).
						AddRow(1, time.Now(), "ACTIVE_USERS", 10, "{}", time.Now()))
			},
		},
		{
			name:       "New Users",
			metricType: "NEW_USERS",
			setupMock: func(mock sqlmock.Sqlmock) {
				mock.ExpectQuery("SELECT COUNT").
					WillReturnRows(sqlmock.NewRows([]string{"count"}).AddRow(5))
				mock.ExpectQuery("INSERT INTO daily_metrics").
					WithArgs(sqlmock.AnyArg(), "NEW_USERS", float64(5), sqlmock.AnyArg()).
					WillReturnRows(sqlmock.NewRows([]string{"id", "metric_date", "metric_type", "metric_value", "metadata", "created_at"}).
						AddRow(1, time.Now(), "NEW_USERS", 5, "{}", time.Now()))
			},
		},
		{
			name:       "Invalid Metric Type",
			metricType: "INVALID",
			setupMock:  func(mock sqlmock.Sqlmock) {},
			wantErr:    true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			db, mock := setupTestDB(t)
			defer db.Close()

			service := NewService(db)
			tt.setupMock(mock)

			metric, err := service.CalculateDailyMetric(context.Background(), tt.metricType, time.Now())
			if tt.wantErr {
				assert.Error(t, err)
				assert.Nil(t, metric)
			} else {
				assert.NoError(t, err)
				assert.NotNil(t, metric)
				assert.Equal(t, tt.metricType, metric.Type)
			}
			assert.NoError(t, mock.ExpectationsWereMet())
		})
	}
}

func TestUpdateUserEngagement(t *testing.T) {
	db, mock := setupTestDB(t)
	defer db.Close()

	service := NewService(db)
	ctx := context.Background()
	userID := int64(1)
	startDate := time.Now().AddDate(0, 0, -7)
	endDate := time.Now()

	mock.ExpectBegin()
	mock.ExpectQuery("SELECT COUNT").
		WillReturnRows(sqlmock.NewRows([]string{"count"}).AddRow(20))
	mock.ExpectQuery("SELECT COUNT").
		WillReturnRows(sqlmock.NewRows([]string{"total", "successful"}).AddRow(10, 8))
	mock.ExpectExec("INSERT INTO user_engagement").
		WithArgs(userID, "ACTIVITY_COUNT", float64(20), startDate, endDate).
		WillReturnResult(sqlmock.NewResult(1, 1))
	mock.ExpectExec("INSERT INTO user_engagement").
		WithArgs(userID, "VERIFICATION_SUCCESS_RATE", float64(80), startDate, endDate).
		WillReturnResult(sqlmock.NewResult(2, 1))
	mock.ExpectCommit()

	err := service.UpdateUserEngagement(ctx, userID, startDate, endDate)
	assert.NoError(t, err)
	assert.NoError(t, mock.ExpectationsWereMet())
}

func TestGenerateReport(t *testing.T) {
	tests := []struct {
		name       string
		reportType string
		setupMock  func(mock sqlmock.Sqlmock)
		wantErr    bool
	}{
		{
			name:       "User Growth Report",
			reportType: "USER_GROWTH",
			setupMock: func(mock sqlmock.Sqlmock) {
				mock.ExpectQuery("SELECT").
					WillReturnRows(sqlmock.NewRows([]string{"total_users", "new_users", "active_users"}).
						AddRow(100, 20, 50))
				mock.ExpectQuery("SELECT DATE").
					WillReturnRows(sqlmock.NewRows([]string{"date", "count"}).
						AddRow(time.Now(), 5))
				mock.ExpectQuery("INSERT INTO analytics_reports").
					WithArgs(sqlmock.AnyArg(), sqlmock.AnyArg(), sqlmock.AnyArg(), sqlmock.AnyArg(), sqlmock.AnyArg()).
					WillReturnRows(sqlmock.NewRows([]string{"id", "report_type", "report_data", "parameters", "start_date", "end_date", "created_at"}).
						AddRow(1, "USER_GROWTH", "{}", "{}", time.Now(), time.Now(), time.Now()))
			},
		},
		{
			name:       "Platform Activity Report",
			reportType: "PLATFORM_ACTIVITY",
			setupMock: func(mock sqlmock.Sqlmock) {
				mock.ExpectQuery("SELECT activity_type").
					WillReturnRows(sqlmock.NewRows([]string{"activity_type", "count"}).
						AddRow("LOGIN", 50).
						AddRow("VERIFICATION", 30))
				mock.ExpectQuery("SELECT DATE").
					WillReturnRows(sqlmock.NewRows([]string{"date", "count"}).
						AddRow(time.Now(), 20))
				mock.ExpectQuery("INSERT INTO analytics_reports").
					WithArgs(sqlmock.AnyArg(), sqlmock.AnyArg(), sqlmock.AnyArg(), sqlmock.AnyArg(), sqlmock.AnyArg()).
					WillReturnRows(sqlmock.NewRows([]string{"id", "report_type", "report_data", "parameters", "start_date", "end_date", "created_at"}).
						AddRow(1, "PLATFORM_ACTIVITY", "{}", "{}", time.Now(), time.Now(), time.Now()))
			},
		},
		{
			name:       "Token Metrics Report",
			reportType: "TOKEN_METRICS",
			setupMock: func(mock sqlmock.Sqlmock) {
				mock.ExpectQuery("SELECT").
					WillReturnRows(sqlmock.NewRows([]string{"total_volume", "staking_volume", "total_transactions", "unique_users"}).
						AddRow(1000.0, 500.0, 100, 30))
				mock.ExpectQuery("SELECT DATE").
					WillReturnRows(sqlmock.NewRows([]string{"date", "volume"}).
						AddRow(time.Now(), 100.0))
				mock.ExpectQuery("INSERT INTO analytics_reports").
					WithArgs(sqlmock.AnyArg(), sqlmock.AnyArg(), sqlmock.AnyArg(), sqlmock.AnyArg(), sqlmock.AnyArg()).
					WillReturnRows(sqlmock.NewRows([]string{"id", "report_type", "report_data", "parameters", "start_date", "end_date", "created_at"}).
						AddRow(1, "TOKEN_METRICS", "{}", "{}", time.Now(), time.Now(), time.Now()))
			},
		},
		{
			name:       "Invalid Report Type",
			reportType: "INVALID",
			setupMock:  func(mock sqlmock.Sqlmock) {},
			wantErr:    true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			db, mock := setupTestDB(t)
			defer db.Close()

			service := NewService(db)
			tt.setupMock(mock)

			startDate := time.Now().AddDate(0, 0, -7)
			endDate := time.Now()
			report, err := service.GenerateReport(context.Background(), tt.reportType, startDate, endDate, nil)

			if tt.wantErr {
				assert.Error(t, err)
				assert.Nil(t, report)
			} else {
				assert.NoError(t, err)
				assert.NotNil(t, report)
				assert.Equal(t, tt.reportType, report.Type)
			}
			assert.NoError(t, mock.ExpectationsWereMet())
		})
	}
}

func TestInvalidDateRange(t *testing.T) {
	db, _ := setupTestDB(t)
	defer db.Close()

	service := NewService(db)
	ctx := context.Background()
	endDate := time.Now().AddDate(0, 0, -7)
	startDate := time.Now() // Start date after end date

	// Test UpdateUserEngagement
	err := service.UpdateUserEngagement(ctx, 1, startDate, endDate)
	assert.Equal(t, ErrInvalidDateRange, err)

	// Test GenerateReport
	report, err := service.GenerateReport(ctx, "USER_GROWTH", startDate, endDate, nil)
	assert.Equal(t, ErrInvalidDateRange, err)
	assert.Nil(t, report)
}
