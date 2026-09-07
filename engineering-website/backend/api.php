<?php
/**
 * Engineering Pro - Form Backend (PHP)
 * Validates and stores contact + service form submissions.
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

$dataDir = __DIR__ . '/data';
$file = $dataDir . '/submissions.json';

if (!is_dir($dataDir)) {
    if (!@mkdir($dataDir, 0755, true)) {
        respond(false, ['error' => 'Server cannot create data directory. Check permissions.'], 500);
    }
}
if (!file_exists($file)) {
    if (@file_put_contents($file, '[]') === false) {
        respond(false, ['error' => 'Server cannot write submissions file. Check permissions.'], 500);
    }
}

function respond($ok, $payload = [], $code = 200) {
    http_response_code($code);
    echo json_encode(array_merge(['success' => $ok], $payload), JSON_UNESCAPED_UNICODE);
    exit;
}

function load_submissions($file) {
    $raw = @file_get_contents($file);
    if ($raw === false) {
        respond(false, ['error' => 'Could not read submissions storage.'], 500);
    }
    $list = json_decode($raw, true);
    return is_array($list) ? $list : [];
}

function save_submissions($file, $list) {
    if (count($list) > 500) {
        $list = array_slice($list, 0, 500);
    }
    $json = json_encode($list, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    if ($json === false) {
        respond(false, ['error' => 'Failed to encode submission data.'], 500);
    }
    if (@file_put_contents($file, $json, LOCK_EX) === false) {
        respond(false, ['error' => 'Failed to save submission. Please try again.'], 500);
    }
}

function clean($value, $max = 500) {
    $value = is_string($value) ? $value : (string) $value;
    $value = trim($value);
    if (function_exists('mb_substr')) {
        return mb_substr($value, 0, $max);
    }
    return substr($value, 0, $max);
}

// GET: health or list
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $action = isset($_GET['action']) ? $_GET['action'] : 'health';
    if ($action === 'submissions') {
        $list = load_submissions($file);
        respond(true, ['count' => count($list), 'submissions' => $list]);
    }
    respond(true, [
        'status' => 'ok',
        'service' => 'Engineering Pro Form API (PHP)',
        'time' => date('c')
    ]);
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    respond(false, ['error' => 'Method not allowed. Use POST.'], 405);
}

$raw = file_get_contents('php://input');
$body = json_decode($raw, true);
if (!is_array($body)) {
    $body = $_POST;
}
if (!is_array($body)) {
    respond(false, ['error' => 'Invalid request body. Send JSON or form data.'], 400);
}

$type = isset($_GET['type']) ? $_GET['type'] : (isset($body['type']) ? $body['type'] : 'contact');
$type = strtolower(trim((string) $type));

$entry = [
    'id' => uniqid('', true),
    'type' => $type,
    'receivedAt' => date('c'),
    'ip' => isset($_SERVER['HTTP_X_FORWARDED_FOR'])
        ? $_SERVER['HTTP_X_FORWARDED_FOR']
        : (isset($_SERVER['REMOTE_ADDR']) ? $_SERVER['REMOTE_ADDR'] : 'unknown')
];

if ($type === 'contact') {
    $name = clean(isset($body['name']) ? $body['name'] : '', 120);
    $email = clean(isset($body['email']) ? $body['email'] : '', 180);
    $department = clean(isset($body['department']) ? $body['department'] : 'general', 60);
    $message = clean(isset($body['message']) ? $body['message'] : '', 2000);

    $errors = [];
    if ($name === '') {
        $errors['name'] = 'Full name is required.';
    } elseif (strlen($name) < 2) {
        $errors['name'] = 'Name must be at least 2 characters.';
    }
    if ($email === '') {
        $errors['email'] = 'Email address is required.';
    } elseif (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        $errors['email'] = 'Enter a valid email address.';
    }
    if ($message === '') {
        $errors['message'] = 'Message is required.';
    } elseif (strlen($message) < 10) {
        $errors['message'] = 'Message must be at least 10 characters.';
    }

    if (!empty($errors)) {
        respond(false, [
            'error' => 'Validation failed. Please correct the highlighted fields.',
            'errors' => $errors
        ], 422);
    }

    $entry['name'] = $name;
    $entry['email'] = strtolower($email);
    $entry['department'] = $department !== '' ? $department : 'general';
    $entry['message'] = $message;

    try {
        $list = load_submissions($file);
        array_unshift($list, $entry);
        save_submissions($file, $list);
    } catch (Exception $e) {
        respond(false, ['error' => 'Could not save your message. Please try again.'], 500);
    }

    respond(true, [
        'message' => 'Thank you! Your message has been received. We will respond within 24 hours.',
        'id' => $entry['id']
    ]);
}

if ($type === 'service') {
    $company = clean(isset($body['company']) ? $body['company'] : '', 150);
    $contact = clean(isset($body['contact']) ? $body['contact'] : '', 120);
    $phone = clean(isset($body['phone']) ? $body['phone'] : '', 40);
    $serviceType = clean(isset($body['serviceType']) ? $body['serviceType'] : 'Other', 80);
    $details = clean(isset($body['details']) ? $body['details'] : '', 3000);

    $errors = [];
    if ($company === '') {
        $errors['company'] = 'Company / site name is required.';
    } elseif (strlen($company) < 2) {
        $errors['company'] = 'Company name must be at least 2 characters.';
    }
    if ($contact === '') {
        $errors['contact'] = 'Contact person name is required.';
    } elseif (strlen($contact) < 2) {
        $errors['contact'] = 'Contact name must be at least 2 characters.';
    }
    if ($phone === '') {
        $errors['phone'] = 'Phone number is required.';
    } elseif (!preg_match('/^[\d\s\+\-\(\)]{7,20}$/', $phone)) {
        $errors['phone'] = 'Enter a valid phone number (7–20 digits).';
    }
    if ($details === '') {
        $errors['details'] = 'Job / project details are required.';
    } elseif (strlen($details) < 10) {
        $errors['details'] = 'Please provide at least 10 characters of detail.';
    }

    if (!empty($errors)) {
        respond(false, [
            'error' => 'Validation failed. Please correct the highlighted fields.',
            'errors' => $errors
        ], 422);
    }

    $entry['company'] = $company;
    $entry['contact'] = $contact;
    $entry['phone'] = $phone;
    $entry['serviceType'] = $serviceType !== '' ? $serviceType : 'Other';
    $entry['details'] = $details;

    try {
        $list = load_submissions($file);
        array_unshift($list, $entry);
        save_submissions($file, $list);
    } catch (Exception $e) {
        respond(false, ['error' => 'Could not save your request. Please try again.'], 500);
    }

    respond(true, [
        'message' => 'Service request submitted successfully. Our team will contact you shortly.',
        'id' => $entry['id']
    ]);
}

respond(false, [
    'error' => 'Unknown form type. Use type=contact or type=service.'
], 400);
