<?php
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/config.php';

function respond($success, $payload = []) {
  echo json_encode(array_merge(['success'=>$success], $payload), JSON_UNESCAPED_UNICODE);
  exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  http_response_code(405);
  respond(false, ['message' => 'Méthode non autorisée.']);
}

$origin = isset($_POST['origin']) ? trim($_POST['origin']) : '';
$dest = isset($_POST['destination']) ? trim($_POST['destination']) : '';
$service = isset($_POST['service']) ? trim($_POST['service']) : '';

if ($origin==='' || $dest==='' || $service==='') {
  respond(false, ['message'=>'Veuillez compléter tous les champs.']);
}

try {
  $stmt = $pdo->prepare("SELECT min_days, max_days FROM delay_rules WHERE origin=? AND destination=? AND service=? LIMIT 1");
  $stmt->execute([$origin, $dest, $service]);
  $rule = $stmt->fetch();

  if (!$rule) {
    // fallback generic
    $min = ($service==='Express') ? 1 : 2;
    $max = ($service==='Express') ? 3 : 6;
    respond(true, ['min_days'=>$min, 'max_days'=>$max, 'note'=>'Estimation générique (fallback).']);
  }

  respond(true, ['min_days'=>(int)$rule['min_days'], 'max_days'=>(int)$rule['max_days'], 'note'=>'Estimation basée sur règles (simulation).']);

} catch (Throwable $e) {
  http_response_code(500);
  respond(false, ['message'=>'Erreur serveur.']);
}
