<?php

// ****** Setup ********
$GLOBALS['maxrecord'] = -1;
$allTimers = null;
//sleep(6);  // Simulate a timeout.


// ******* Process Requests ********
$action = $_POST['action'];

if ($action == "update") {
    $allTimers = loadTimers(true);
    //if(is_null($allTimers)){   // TODO - handle error versus no records.
    //	echo("error001");
    //	exit;
    //}

    $arrayId = intval($_POST['id']);
    $inputStr = $_POST['input'];

    $timer = json_decode($inputStr, true);

    if (is_null($timer['recordid'])) {
        // Adding a new timer
        $timer['recordid'] = ++$GLOBALS['maxrecord'];
    }
    $allTimers["".$timer['recordid']] = $timer;


    $status = saveTimers($allTimers);
    if (is_null($status)) {
        echo("error002");
        exit;
    }

    echo($arrayId."|".$timer['recordid']);
} elseif ($action == "delete") {
    $allTimers = loadTimers(true);
    //if(is_null($allTimers)){   // TODO - handle error versus no records.
    //	echo("error001");
    //	exit;
    //}

    $recordid = intval($_POST['recordid']);

    if (is_null($allTimers[$recordid])) {
        echo("error004"); // Record not found.
        exit;
    }

    $allTimers[$recordid] = null;

    $status = saveTimers($allTimers);
    if (is_null($status)) {
        echo("error002");
        exit;
    }

    echo($recordid);
} elseif ($action == "retrieve") {
    $allTimers = loadTimers(false);
    if (is_null($allTimers)) {
        //echo("error003"); // TODO = handle error versus no records.
        exit;
    }

    echo(json_encode($allTimers));
} else {
    echo("error999");
}

function loadTimers($useRecordIndex)
{
    $datFile = "timers.dat";
    $fh = fopen($datFile, 'r');

    $allTimers = null;
    $i = 0;

    if ($fh) {
        while (!feof($fh)) {
            $line = trim(fgets($fh));
            if (!empty($line)) {
                $record = explode(":", $line, 2);
                if ($useRecordIndex) {
                    $index = "".$record[0];
                } else {
                    $index = $i++;
                }
                $allTimers[$index] = json_decode($record[1], true);
                if ($record[0] > $GLOBALS['maxrecord']) {
                    $GLOBALS['maxrecord']  = $record[0];
                }
            }
        }
        fclose($fh);
    }
    return($allTimers);
}

function saveTimers($allTimers)
{
    $datFile = "timers.dat";
    $fh = fopen($datFile, 'w');
    $status = 1;

    if ($fh) {
        foreach ($allTimers as $recid => $record) {
            if (!is_null($record)) {
                $line = $recid.":".json_encode($record)."\n";
                $fwrite = fwrite($fh, $line);
                if ($fwrite === false) {
                    $status = null;
                }
            }
        }
        fclose($fh);
    }
    return($status);
}
