# JMeter Performance Testing Guide for Stock Tracker

This directory contains JMeter test plans for performance testing the Stock Tracker application with large datasets.

## Prerequisites

1. **JMeter Installation**:
   - Download Apache JMeter from the [official website](https://jmeter.apache.org/download_jmeter.cgi)
   - Extract the downloaded archive to a location on your system
   - Navigate to the `bin` directory and run `jmeter.bat` (Windows) or `jmeter.sh` (Linux/Mac)

2. **Running Stock Tracker Server**:
   - Make sure your Stock Tracker server is running on the configured host/port (default: localhost:5000)
   - Ensure the database is populated with large volumes of data using the `generate-massive-data.js` script
   - Apply database optimizations with the `optimize-database.js` script

## Running the Performance Tests

### Using the GUI (for development and debugging)

1. **Launch JMeter**:
   ```
   cd path/to/jmeter/bin
   ./jmeter.sh  # or jmeter.bat on Windows
   ```

2. **Open the Test Plan**:
   - Go to File > Open
   - Navigate to and select `stock-tracker-test-plan.jmx`

3. **Configure Test Parameters** (if needed):
   - In the "User Defined Variables" section, update:
     - `host` (default: localhost)
     - `port` (default: 5000)
     - `protocol` (default: http)

4. **Start the Test**:
   - Click the green "Start" button in the toolbar (or press Ctrl+R)
   - Watch the results in real-time in the Summary Report and Graph Results listeners

5. **Analyze Results**:
   - The Summary Report shows metrics like average response time, throughput, and error rate
   - The Graph Results visualizes response times over the test duration

### Using the Command Line (for automation and CI/CD)

For consistent, reproducible performance tests, use the command line:

```
cd path/to/jmeter/bin
./jmeter -n -t "/path/to/stock-tracker-test-plan.jmx" -l results.jtl -e -o report-output
```

Parameters:
- `-n`: Run in non-GUI mode
- `-t`: Path to the test plan
- `-l`: Path to save results file
- `-e`: Generate HTML report after test
- `-o`: Output directory for HTML report

## Test Plan Structure

The test plan includes several thread groups targeting different aspects of the application:

1. **Basic Load Test - All Stocks**:
   - Tests the performance of retrieving all stocks
   - 50 concurrent users, ramped up over 10 seconds
   - Each user performs 5 requests

2. **Filtered Stocks Test**:
   - Tests filtering stocks by industry and price range
   - 50 concurrent users, ramped up over 10 seconds
   - Each user performs 5 requests

3. **Complex Query Test**:
   - Tests complex filtering and sorting operations
   - 20 concurrent users, ramped up over 5 seconds
   - Each user performs 10 requests

4. **Stress Test**:
   - Tests application behavior under high load
   - 200 concurrent users, ramped up over 30 seconds
   - Each user performs 3 requests

## Interpreting Results

When analyzing test results, focus on these key metrics:

1. **Average Response Time**: 
   - < 100ms: Excellent
   - 100-300ms: Good
   - 300-1000ms: Acceptable
   - > 1000ms: Poor, needs optimization

2. **Error Rate**:
   - Should be < 1% under normal load
   - May increase under stress testing

3. **Throughput**: 
   - Higher is better, but look for stability
   - Sudden drops indicate performance issues

4. **90% Line (90th percentile)**:
   - 90% of requests are faster than this value
   - Good indicator of typical user experience

## Comparing Results

To compare before/after optimization:

1. Run the test with the same parameters before applying optimizations
2. Save the results to a file (`before-optimization.jtl`)
3. Apply database optimizations
4. Run the same test again and save results (`after-optimization.jtl`)
5. Compare the results using JMeter's HTML report or comparison tools

## Custom Test Scenarios

To create custom test scenarios:

1. Right-click on the test plan and select "Add > Thread Group"
2. Configure the number of threads (users), ramp-up period, and loop count
3. Add HTTP samplers for each API endpoint you want to test
4. Add listeners to view and analyze the results

## Troubleshooting

- **High Error Rates**: Check server logs for exceptions or database errors
- **Connection Refused**: Ensure the server is running and accessible
- **Out of Memory**: Increase JMeter's heap size in `jmeter.bat`/`jmeter.sh`
- **Inconsistent Results**: Run tests multiple times and average the results 