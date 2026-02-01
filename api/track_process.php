<?php
// =====================================
// Rapid Poste - Tracking API (PHP)
// =====================================
header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/config.php';

function respond($success, $payload = []) {
  echo json_encode(array_merge(['success' => $success], $payload), JSON_UNESCAPED_UNICODE);
  exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  http_response_code(405);
  respond(false, ['message' => 'Méthode non autorisée.']);
}

$tracking = isset($_POST['tracking_number']) ? trim($_POST['tracking_number']) : '';

if ($tracking === '') {
  respond(false, ['message' => 'Veuillez saisir un numéro de suivi.']);
}

// Basic format validation (you can relax it)
if (!preg_match('/^[A-Z]{2}\d{9}[A-Z]{2}$/i', $tracking)) {
  respond(false, ['message' => 'Format du numéro invalide. Exemple: EE123456789TN']);
}

try {
  // -------------------------
  // DEMO fallback dataset
  // -------------------------
  $demo = [
    'EE123456789TN' => [
      'client' => 'Mohamed Ben Ali',
      'events' => [
        ['status'=>'Colis accepté','office'=>'Bureau de Poste - Manouba','event_time'=>'2026-01-10 09:15:00'],
        ['status'=>'En cours de transport','office'=>'Centre de Tri - Tunis','event_time'=>'2026-01-10 14:40:00'],
        ['status'=>'Arrivé au bureau de distribution','office'=>'Bureau de Distribution - Ariana','event_time'=>'2026-01-11 10:05:00'],
        ['status'=>'Livré avec succès','office'=>'Ariana','event_time'=>'2026-01-11 16:20:00'],
      ]
    ]
  ];

  // 1) Find parcel
  $stmt = $pdo->prepare('SELECT id, tracking_number, receiver_name FROM parcels WHERE tracking_number = ? LIMIT 1');
  $stmt->execute([$tracking]);
  $parcel = $stmt->fetch();

  if (!$parcel) {
    // If not in DB, try demo fallback
    if (isset($demo[$tracking])) {
      $events = array_reverse($demo[$tracking]['events']); // latest first below
      $latest = $events[0];
      respond(true, [
        'status' => $latest['status'],
        'client' => $demo[$tracking]['client'],
        'location' => $latest['office'],
        'update' => $latest['event_time'],
        'history' => $events
      ]);
    }
    respond(false, ['message' => "Aucun colis trouvé pour: {$tracking}"]); 
  }

  // 2) Load tracking events (latest first)
  $stmt2 = $pdo->prepare('SELECT status, location, event_time FROM tracking_events WHERE parcel_id = ? ORDER BY event_time DESC');
  $stmt2->execute([$parcel['id']]);
  $events = $stmt2->fetchAll();

  if (!$events) {
    respond(true, [
      'status' => 'Créé',
      'client' => $parcel['receiver_name'],
      'location' => '--',
      'update' => date('Y-m-d H:i'),
      'history' => []
    ]);
  }

  $latest = $events[0];

  // Build history array (newest -> oldest)
  $history = [];
  foreach ($events as $ev) {
    $history[] = [
      'status' => $ev['status'],
      'office' => $ev['location'],
      'event_time' => $ev['event_time'],
    ];
  }

  respond(true, [
    'status' => $latest['status'],
    'client' => $parcel['receiver_name'],
    'location' => $latest['location'],
    'update' => $latest['event_time'],
    'history' => $history
  ]);

} catch (Throwable $e) {
  http_response_code(500);
  respond(false, ['message' => 'Erreur serveur. Réessayez plus tard.']);
}
