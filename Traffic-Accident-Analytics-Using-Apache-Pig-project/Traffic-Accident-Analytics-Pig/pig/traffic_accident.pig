-- Traffic Accident Analytics using Apache Pig
-- Input CSV columns:
-- accident_id,date,time,city,weather,road_condition,vehicle_type,severity,casualties,fatalities,cause
-- Run from the project directory after placing the CSV in HDFS.

raw = LOAD 'traffic_accidents.csv'
    USING PigStorage(',')
    AS (
        accident_id:chararray,
        accident_date:chararray,
        accident_time:chararray,
        city:chararray,
        weather:chararray,
        road_condition:chararray,
        vehicle_type:chararray,
        severity:chararray,
        casualties_text:chararray,
        fatalities_text:chararray,
        cause:chararray
    );

-- Remove the header row and malformed records.
data_rows = FILTER raw BY accident_id IS NOT NULL
    AND accident_id != 'accident_id'
    AND city IS NOT NULL
    AND severity IS NOT NULL;

cleaned = FOREACH data_rows GENERATE
    accident_id,
    accident_date,
    SUBSTRING(accident_date, 0, 7) AS accident_month,
    city,
    weather,
    road_condition,
    vehicle_type,
    severity,
    (int)casualties_text AS casualties,
    (int)fatalities_text AS fatalities,
    cause;

-- 1. Total number of accidents by severity.
severity_groups = GROUP cleaned BY severity;
severity_summary = FOREACH severity_groups GENERATE
    group AS severity,
    COUNT(cleaned) AS accident_count;
STORE severity_summary INTO 'output/accidents_by_severity' USING PigStorage(',');

-- 2. Total accidents by city.
city_groups = GROUP cleaned BY city;
city_summary = FOREACH city_groups GENERATE
    group AS city,
    COUNT(cleaned) AS accident_count;
STORE city_summary INTO 'output/accidents_by_city' USING PigStorage(',');

-- 3. Casualties and fatalities by city.
city_impact_groups = GROUP cleaned BY city;
city_impact = FOREACH city_impact_groups GENERATE
    group AS city,
    SUM(cleaned.casualties) AS total_casualties,
    SUM(cleaned.fatalities) AS total_fatalities;
STORE city_impact INTO 'output/impact_by_city' USING PigStorage(',');

-- 4. Accidents by weather condition.
weather_groups = GROUP cleaned BY weather;
weather_summary = FOREACH weather_groups GENERATE
    group AS weather,
    COUNT(cleaned) AS accident_count;
STORE weather_summary INTO 'output/accidents_by_weather' USING PigStorage(',');

-- 5. Accidents by vehicle type.
vehicle_groups = GROUP cleaned BY vehicle_type;
vehicle_summary = FOREACH vehicle_groups GENERATE
    group AS vehicle_type,
    COUNT(cleaned) AS accident_count;
STORE vehicle_summary INTO 'output/accidents_by_vehicle' USING PigStorage(',');

-- 6. Monthly accident trend (date format: YYYY-MM-DD).
month_groups = GROUP cleaned BY accident_month;
month_summary = FOREACH month_groups GENERATE
    group AS accident_month,
    COUNT(cleaned) AS accident_count;
STORE month_summary INTO 'output/accidents_by_month' USING PigStorage(',');

-- 7. Common reported causes.
cause_groups = GROUP cleaned BY cause;
cause_summary = FOREACH cause_groups GENERATE
    group AS cause,
    COUNT(cleaned) AS accident_count;
STORE cause_summary INTO 'output/accidents_by_cause' USING PigStorage(',');

-- 8. High severity records (Major or Fatal).
high_severity = FILTER cleaned BY severity == 'Major' OR severity == 'Fatal';
high_severity_report = FOREACH high_severity GENERATE
    accident_id, accident_date, city, vehicle_type, severity, casualties, fatalities, cause;
STORE high_severity_report INTO 'output/high_severity_accidents' USING PigStorage(',');

DUMP severity_summary;
DUMP city_summary;
DUMP weather_summary;
