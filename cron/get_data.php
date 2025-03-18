<?php

require_once '../lib/func.php';

//$id = create_json_data();

$search_path = __DIR__.'/../hackaton-search/search.py';

shell_exec('python3 '.$search_path);

//save_json_data($id, file_get_contents('../Hackathon_Output_v1.json'));
