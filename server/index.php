<?php
// Enable error reporting for debugging
error_reporting(E_ALL);
ini_set('display_errors', 1);

// CORS headers
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Origin, X-Requested-With, Content-Type, Accept');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    exit(0);
}

// Check if x and y parameters are present in GET request
if (isset($_GET['x']) && isset($_GET['y'])) {
    $x = $_GET['x'];
    $y = $_GET['y'];
    
    // Validate that x and y are numeric
    if (!is_numeric($x) || !is_numeric($y)) {
        http_response_code(400);
        echo 'Invalid tile coordinates: x and y must be numbers';
        exit;
    }
    
    // Convert to integers
    $x = (int)$x;
    $y = (int)$y;
    
    $tileUrl = "https://backend.wplace.live/files/s0/tiles/{$x}/{$y}.png";

    // Initialize cURL
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $tileUrl);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
    curl_setopt($ch, CURLOPT_HEADER, false);

    // Execute the request
    $imageData = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);

    if (curl_error($ch)) {
        error_log('cURL Error: ' . curl_error($ch));
        http_response_code(500);
        echo 'Error fetching tile';
        curl_close($ch);
        exit;
    }

    curl_close($ch);

    if ($httpCode === 200 && $imageData) {
        // Set appropriate headers
        header('Content-Type: image/png');
        header('Cache-Control: no-store, no-cache, must-revalidate, proxy-revalidate');
        header('Pragma: no-cache');
        header('Expires: 0');

        echo $imageData;
        exit;
    } else {
        http_response_code(500);
        echo 'Error fetching tile';
        exit;
    }
} else {
    http_response_code(400);
    echo 'Missing x or y parameters';
    exit;
}
