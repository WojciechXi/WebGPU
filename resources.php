<?php

header('content-type: application/json');
die(json_encode([], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE));

return;
require_once __DIR__ . '/functions.php';

$files = ScanFilesRecursive('/Resources', [], [], __DIR__);

header('content-type: application/json');
die(json_encode($files, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE));
