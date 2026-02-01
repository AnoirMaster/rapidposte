<?php
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/config.php';

function respond($success, $payload = []) {
  echo json_encode(array_merge(['success'=>$success], $payload), JSON_UNESCAPED_UNICODE);
  exit;
}

$q = isset($_GET['q']) ? trim($_GET['q']) : '';
$type = isset($_GET['type']) ? trim($_GET['type']) : '';

try {
  $sql = "SELECT id, name, type, city, governorate, address, phone, hours FROM agencies WHERE 1=1";
  $params = [];

  if ($type !== '') {
    $sql .= " AND type = ?";
    $params[] = $type;
  }

  if ($q !== '') {
    $sql .= " AND (name LIKE ? OR city LIKE ? OR governorate LIKE ?)";
    $like = '%' . $q . '%';
    $params[] = $like;
    $params[] = $like;
    $params[] = $like;
  }

  $sql .= " ORDER BY governorate, city, name LIMIT 200";

  $stmt = $pdo->prepare($sql);
  $stmt->execute($params);
  $rows = $stmt->fetchAll();

  respond(true, ['data'=>$rows]);
} catch (Throwable $e) {
  http_response_code(500);
  respond(false, ['message'=>'Erreur serveur.']);
}
