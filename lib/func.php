<?php

/**
 * Get file timestamp.
 *
 * @param string $file File relative path.
 *
 * @return string File relative path with timestamp.
 */
function get_last_modified($file)
{
    $date = filemtime($file);

    return $file.'?'.$date;
}

/**
 * Get database connection.
 *
 * @return resource Database connection.
 */
function get_database_connection()
{
    global $database;

    if (!isset($database)) {
        $database = pg_connect('dbname=exalog_db user=exalog password=12345678 host=postgres port=5432');
    }

    return $database;
}

/**
 * Format a given date.
 *
 * @param string $date         Date to format.
 * @param bool   $include_time True to include time.
 * @param bool   $short        True to display short format.
 *
 * @return string Formatted date.
 */
function format_date($date = null, $include_time = true, $short = false)
{
    $dt = new \DateTime($date);

    if ($short === true) {
        return $dt->format('F d').($include_time === true ? '<br/>'.$dt->format('H:i') : '');
    }

    return $dt->format('F').' '.
        $dt->format('d').', '.
        $dt->format('Y').
        ($include_time === true ? '. '.$dt->format('H:i') : '')
    ;
}

function convert_amount($amount)
{
    if ($amount > 1000000000) {
        return '$'.round($amount / 1000000000, 2).'B';
    } elseif ($amount > 1000000) {
        return '$'.round($amount / 1000000, 2).'M';
    } elseif ($amount > 1000) {
        return '$'.round($amount / 1000, 2).'K';
    }

    return '$'.$amount;
}

/**
 * Get current displayed tab.
 *
 * @return string Current displayed tab.
 */
function get_current_tab()
{
    if (isset($_SESSION['hackathon']->current_tab)) {
        return $_SESSION['hackathon']->current_tab;
    }

    return 'dashboard';
}

/**
 * Get current displayed subtab.
 *
 * @return string Current displayed subtab.
 */
function get_current_subtab()
{
    if (isset($_SESSION['hackathon']->current_subtab)) {
        return $_SESSION['hackathon']->current_subtab;
    }
}

/**
 * Get tab list.
 *
 * @return array Tab list.
 */
function get_tab_list()
{
    return [
        'dashboard' => 'Dashboard',
        'news' => 'News',
        'markets' => 'Exchange risk',
        'suppliers' => 'Third parties risk',
        'alerts' => 'Alerts',
        'archives' => 'Archives',
    ];
}

/**
 * Get current tab name.
 *
 * @return string Current tab name.
 */
function get_tab_name()
{
    return get_tab_list()[get_current_tab()];
}

/**
 * Get next database id in json_data table.
 *
 * @return int Next database id.
 */
function reserve_id()
{
    $res = pg_query(get_database_connection(), "SELECT nextval('json_data_id_seq')");

    return pg_fetch_array($res, 0)[0];
}

/**
 * Create json data.
 *
 * @return int Json data id in database.
 */
function create_json_data()
{
    $id = reserve_id();

    $res = pg_query_params(get_database_connection(), "INSERT INTO json_data (id) VALUES ($1)", [$id]);

    return $id;
}

/**
 * Save json data.
 *
 * @param int   $id   Json data id in database.
 * @param mixed $data Json data to save.
 */
function save_json_data($id, $data)
{
    if (is_array($data)) {
        $data = json_encode($data);
    }

    $res = pg_query_params(
        get_database_connection(),
        "
            UPDATE json_data
            SET json_data = $1,
            json_date = now()
            WHERE id = $2
        ",
        [$data, $id]
    );
}

/**
 * Get data list from database.
 *
 * @return array Data list.
 */
function get_json_data_list()
{
    $list = [];

    $res = pg_query(
        get_database_connection(),
        "SELECT * FROM json_data ORDER BY creation_date DESC"
    );

    while ($row = pg_fetch_array($res)) {
        $data_date = null;

        if (trim($row['json_data']) !== '') {
            $data = json_decode($row['json_data'], true);

            if ($data !== null && isset($data['dashboard']) && isset($data['dashboard']['date'])) {
                $data_date = $data['dashboard']['date'];
            }
        }

        $list[] = [
            'id' => $row['id'],
            'creation_date' => $row['creation_date'],
            'json_date' => $row['json_date'],
            'data_date' => $data_date,
        ];
    }

    return $list;
}

/**
 * Get data from database by id.
 *
 * @param int $id Json data id in database.
 *
 * @return array Json data.
 */
function get_json_data_by_id($id)
{
    $res = pg_query_params(
        get_database_connection(),
        "SELECT * FROM json_data WHERE id = $1",
        [$id]
    );

    return pg_fetch_assoc($res);
}

/**
 * Get last json data from database.
 *
 * @return array Last json data.
 */
function get_last_json_data()
{
    $res = pg_query(
        get_database_connection(),
        "
            SELECT * FROM json_data
            WHERE json_date IS NOT NULL
            AND json_data IS NOT NULL
            ORDER BY id DESC LIMIT 1
        "
    );

    return pg_fetch_assoc($res);
}

/**
 * Extract data from array json.
 *
 * @param array $keys List of key level to access to output.
 *
 * @return mixed The targeted output.
 */
function extract_json_data($keys)
{
    if (isset($_SESSION['hackathon']->current_report['json_data']) && is_array($_SESSION['hackathon']->current_report['json_data'])) {
        $current_data = $_SESSION['hackathon']->current_report['json_data'];

        foreach ($keys as $key_name) {
            if (isset($current_data[$key_name])) {
                $current_data = $current_data[$key_name];
            } else {
                return null;
            }
        }

        return $current_data;
    }
}

function markdown_data(&$data)
{
    foreach ($data as $key => $value) {
        if (is_array($value)) {
            markdown_data($data[$key]);
        } elseif (in_array($key, ['summary', 'detailed_report'])) {
            $parsedown = new Parsedown();
            $data[$key] = $parsedown->text($value);
        }
    }
}

function has_data($keys)
{
    $data = extract_json_data($keys);

    return ($data !== null && sizeof($data) > 0);
}