# Traffic Accident Analytics Using Apache Pig

A small academic project containing:
- A browser-based dashboard built with HTML, CSS, JavaScript and Vite.
- A sample traffic accident CSV dataset (150 synthetic records).
- An Apache Pig script that produces grouped accident summaries.

> **Dataset note:** The included CSV is synthetic sample data for demonstration and testing. It is not official police or government accident data and must not be used to make real-world safety claims.

## 1. Requirements

- Node.js 18+ and npm
- A modern browser
- Optional, for batch processing: Apache Hadoop and Apache Pig

## 2. Run the dashboard

Open a terminal in this project folder and run:

```bash
npm install
npm run dev
```

Vite prints a local address, usually `http://localhost:5173`. Open that address in your browser.

To create and preview a production build:

```bash
npm run build
npm run preview
```

The dashboard reads `data/traffic_accidents.csv`, and supports city, severity and month filters, summary metrics, charts, a records table and CSV export.

## 3. Run the Apache Pig analysis

The Pig script expects the input file in the current HDFS working directory under the name `traffic_accidents.csv`. Upload it to HDFS:

```bash
hdfs dfs -mkdir -p /user/$USER/traffic_project
hdfs dfs -put -f data/traffic_accidents.csv /user/$USER/traffic_project/traffic_accidents.csv
```

Run Pig in MapReduce mode (or use the mode configured in your Hadoop/Pig installation):

```bash
pig -x mapreduce pig/traffic_accident.pig
```

The script uses the relative input path `traffic_accidents.csv`. If your Pig working directory is not `/user/$USER/traffic_project`, either change the LOAD path in the script to the full HDFS path:

```pig
raw = LOAD '/user/YOUR_USERNAME/traffic_project/traffic_accidents.csv'
```

The output directories are written under `output/` in the HDFS working directory. To inspect an output:

```bash
hdfs dfs -ls output
hdfs dfs -cat output/accidents_by_severity/part-r-00000
```

If an output directory already exists, remove it before rerunning because Pig will not overwrite an existing output directory:

```bash
hdfs dfs -rm -r output
```

## 4. Analyses included

1. Accident count by severity
2. Accident count by city
3. Casualties and fatalities by city
4. Accident count by weather
5. Accident count by vehicle type
6. Monthly accident trend
7. Accident count by reported cause
8. Detailed list of Major and Fatal accidents

## 5. CSV schema

| Column | Meaning |
|---|---|
| `accident_id` | Unique sample record ID |
| `date`, `time` | Date and time of the accident |
| `city` | Sample city |
| `weather` | Weather at the time |
| `road_condition` | Road surface / work condition |
| `vehicle_type` | Vehicle category |
| `severity` | Minor, Moderate, Major or Fatal |
| `casualties` | Number of people affected |
| `fatalities` | Number of reported deaths |
| `cause` | Sample reported cause |

The CSV is deliberately kept simple (no commas inside fields) so it can be read using PigStorage(','). For a real dataset with quoted commas or more complex CSV formatting, use a CSV-aware loader such as Piggybank's CSVExcelStorage.

## 6. Project structure

```text
Traffic-Accident-Analytics-Pig/
├── src/
│   ├── main.js
│   └── style.css
├── data/
│   └── traffic_accidents.csv
├── pig/
│   └── traffic_accident.pig
├── index.html
├── package.json
├── vite.config.ts
├── tsconfig.json
├── metadata.json
└── README.md
```

## 7. Limitations

- The sample records are randomly generated and do not represent measured accident rates.
- The dashboard performs client-side aggregation; Apache Pig performs the separate batch analysis.
- For a formal submission, replace the sample CSV with a properly licensed, cited real dataset and update the source/limitations section of your report.
