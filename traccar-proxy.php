<?php
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json; charset=utf-8');

$endpoint = in_array($_GET['endpoint'] ?? '', ['positions','devices','events']) ? $_GET['endpoint'] : 'positions';
$url = 'https://demo3.traccar.org/api/' . $endpoint;

$ch = curl_init();
curl_setopt_array($ch, [
    CURLOPT_URL            => $url,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT        => 10,
    CURLOPT_USERPWD        => 'webcincodev@gmail.com:Forastero938',
    CURLOPT_HTTPAUTH       => CURLAUTH_BASIC,
    CURLOPT_SSL_VERIFYPEER => false,
    CURLOPT_HTTPHEADER     => ['Accept: application/json'],
]);
$body  = curl_exec($ch);
$code  = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$err   = curl_error($ch);
curl_close($ch);

if ($err || $code !== 200) {
    http_response_code(503);
    echo json_encode(['error' => $err ?: 'HTTP '.$code, 'url' => $url]);
    exit;
}
echo $body;
