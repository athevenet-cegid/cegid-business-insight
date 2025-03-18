<?php

ini_set('display_errors', 1);

require_once __DIR__.'/vendor/autoload.php';
require_once 'lib/func.php';

session_start();

// Init session if needed
if (!isset($_SESSION['hackathon'])) {
    $_SESSION['hackathon'] = new stdClass();
}

// Change tab
if (isset($_GET['tab'])) {
    $_SESSION['hackathon']->current_tab = $_GET['tab'];
    $_SESSION['hackathon']->current_subtab = null;
}

// Display subtab
if (isset($_GET['subtab'])) {
    $_SESSION['hackathon']->current_subtab = $_GET['subtab'];
}

// Set current report
if (!isset($_SESSION['hackathon']->current_report) || !$_SESSION['hackathon']->current_report) {
    $_SESSION['hackathon']->current_report = get_last_json_data();
}

// Change report
if (isset($_GET['archive_id'])) {
    $_SESSION['hackathon']->current_report = get_json_data_by_id($_GET['archive_id']);
    $_SESSION['hackathon']->current_tab = 'dashboard';
}

if (isset($_SESSION['hackathon']->current_report['id']) && isset($_SESSION['hackathon']->current_report['json_data']) && !is_array($_SESSION['hackathon']->current_report['json_data'])) {
    $_SESSION['hackathon']->current_report['json_data'] = json_decode($_SESSION['hackathon']->current_report['json_data'], true);
    markdown_data($_SESSION['hackathon']->current_report['json_data']);
}

// Is last report
$_SESSION['hackathon']->is_last_report = ($_SESSION['hackathon']->current_report['id'] == get_last_json_data()['id']);

include 'html/index.html';
