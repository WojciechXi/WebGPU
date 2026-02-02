<?php
require_once __DIR__ . '/functions.php';

$scripts = [];
$classes = ScanFilesRecursive('/Classes', ['js'], [], __DIR__);
foreach ($classes as $class => $mime) $scripts[] = file_get_contents(__DIR__ . $class);
file_put_contents(__DIR__ . '/engine.js', implode("\n\n", $scripts));

$scripts = [];
$classes = ScanFilesRecursive('/Game', ['js'], [], __DIR__);
foreach ($classes as $class => $mime) $scripts[] = file_get_contents(__DIR__ . $class);
file_put_contents(__DIR__ . '/game.js', implode("\n\n", $scripts));

?>
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Document</title>
    <link rel="stylesheet" type="text/css" href="./index.css">
    <script src="/engine.js"></script>
    <script src="/game.js"></script>
</head>

<body>
    <canvas class="fill" id="view"></canvas>
    <div id="hierarchy"></div>
    <div id="inspector"></div>
</body>

</html>