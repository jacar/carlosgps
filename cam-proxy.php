<?php
/**
 * TRACKJF - HLS Video Proxy
 * Bypasses Mixed Content blocks (HTTPS -> HTTP) by proxying video segments.
 * Usage: cam-proxy.php?file=IMEI_CHANNEL.m3u8 or cam-proxy.php?file=IMEI_CHANNEL_SEQ.ts
 */

header('Access-Control-Allow-Origin: *');

$file = $_GET['file'] ?? '';
if (empty($file)) {
    http_response_code(400);
    exit('Missing file parameter');
}

// Basic security: only allow Alphanumeric, underscores, and dots
if (!preg_match('/^[a-zA-Z0-9\._\-]+$/', $file)) {
    http_response_code(403);
    exit('Invalid filename');
}

$targetBase = 'http://66.97.42.27:6100/live/hls/';
$targetUrl = $targetBase . $file;

$ch = curl_init();
curl_setopt_array($ch, [
    CURLOPT_URL => $targetUrl,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_FOLLOWLOCATION => true,
    CURLOPT_TIMEOUT => 15,
    CURLOPT_SSL_VERIFYPEER => false,
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$contentType = curl_getinfo($ch, CURLINFO_CONTENT_TYPE);
curl_close($ch);

if ($httpCode !== 200) {
    http_response_code($httpCode);
    exit;
}

// Handle .m3u8 files: rewrite relative TS links to go through this proxy
if (strpos($file, '.m3u8') !== false) {
    header('Content-Type: application/vnd.apple.mpegurl');
    
    // We need to tell the player that TS files mentioned in this playlist should also be fetched via the proxy.
    // We can do this by prepending "cam-proxy.php?file=" to any line that doesn't start with #
    $lines = explode("\n", $response);
    foreach ($lines as &$line) {
        $line = trim($line);
        if (!empty($line) && $line[0] !== '#' && strpos($line, '.ts') !== false) {
            $line = 'cam-proxy.php?file=' . $line;
        }
    }
    echo implode("\n", $lines);
} else {
    // Handle binary segments (.ts)
    if (strpos($file, '.ts') !== false) {
        header('Content-Type: video/MP2T');
    } else {
        header('Content-Type: ' . $contentType);
    }
    echo $response;
}
