<?php

require_once '../lib/func.php';

$company_data = json_decode(file_get_contents('../json/Hackathon_CompanyProfile.json'), true);

$id = create_json_data();

$data = json_decode(get_json_data_by_id(243)['json_data'], true);

// URL du service Python
$url = "http://python-api:8000/search";
 
// Paramètre à transmettre
$prompt = "Foreign exchange (FX) risks for ".$company_data['identification']['name']." in EUR/GBP over March 2025, including macroeconomic trends, central bank policies, and geopolitical events affecting exchange rates. Impact on costs, pricing, and financial performance.";
 
$params = [
    'arg1' => $prompt,
];
 
// Construire l'URL complète avec les paramètres
$query = http_build_query($params);
$full_url = $url . '?' . $query;
 
// Configurer un contexte HTTP avec un timeout plus long
$context = stream_context_create([
    'http' => [
        'timeout' => 600, // Timeout de 360 secondes
    ],
]);
 
// Effectuer la requête HTTP
$output = @file_get_contents($full_url, false, $context);
 
// Gérer les erreurs
$search_path = __DIR__.'/../hackaton-search/rapport.md';
$content = file_get_contents($search_path);

$data['keyInsights']['strategic']['detailed_report'] = $content;

save_json_data($id, $data);

echo $id;
exit;