<?php
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/config.php';

function respond($success, $payload = []) {
  echo json_encode(array_merge(['success'=>$success], $payload), JSON_UNESCAPED_UNICODE);
  exit;
}

try {
  $stmt = $pdo->query("SELECT id, title, body, category, published_at FROM news ORDER BY published_at DESC LIMIT 6");
  $rows = $stmt->fetchAll();
  respond(true, ['data'=>$rows]);
} catch (Throwable $e) {
  http_response_code(500);
  respond(false, ['message'=>'Erreur serveur.']);
}
