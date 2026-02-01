<?php
// =============================
// Rapid Poste - DB Config (XAMPP)
// =============================
// 1) Create DB + tables using rapidposte.sql
// 2) Update credentials if needed

$DB_HOST = '127.0.0.1';
$DB_NAME = 'rapidposte_db';
$DB_USER = 'root';
$DB_PASS = '';
$DB_CHARSET = 'utf8mb4';

$dsn = "mysql:host={$DB_HOST};dbname={$DB_NAME};charset={$DB_CHARSET}";

$options = [
  PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
  PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
  PDO::ATTR_EMULATE_PREPARES => false,
];

try {
  $pdo = new PDO($dsn, $DB_USER, $DB_PASS, $options);
} catch (PDOException $e) {
  // Never expose internal errors in production; ok for stage demo.
  http_response_code(500);
  header('Content-Type: application/json; charset=utf-8');
  echo json_encode([
    'success' => false,
    'message' => 'Erreur de connexion à la base de données.'
  ]);
  exit;
}
