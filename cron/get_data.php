<?php

require_once '../lib/func.php';

//$id = create_json_data();

$search_path = __DIR__.'/../hackaton-search/search.py';
$output = null;
$result_code  = null;
$test = exec('docker exec python-service python3 '.$search_path, $output, $result_code);
var_dump($output, $result_code, $test);

//save_json_data($id, file_get_contents('../Hackathon_Output_v1.json'));
