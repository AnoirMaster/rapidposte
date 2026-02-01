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

$name = isset($_POST['name']) ? trim($_POST['name']) : '';
$email = isset($_POST['email']) ? trim($_POST['email']) : '';
$message = isset($_POST['message']) ? trim($_POST['message']) : '';

if ($name==='' || $email==='' || $message==='') {
  respond(false, ['message'=>'Veuillez remplir tous les champs.']);
}
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
  respond(false, ['message'=>'Email invalide.']);
}

try {
  $stmt = $pdo->prepare("INSERT INTO contact_messages (name, email, message) VALUES (?,?,?)");
  $stmt->execute([$name, $email, $message]);
  respond(true, ['message'=>'Message envoyé. Merci !']);
} catch (Throwable $e) {
  http_response_code(500);
  respond(false, ['message'=>'Erreur serveur.']);
}
