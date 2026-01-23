<?php
require_once __DIR__ . '/functions.php';

$classes = ScanFilesRecursive('./Classes', ['js']);
$editor = ScanFilesRecursive('./Editor', ['js']);
$game = ScanFilesRecursive('./Game', ['js']);
?>
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Document</title>
    <link rel="stylesheet" type="text/css" href="./index.css">

    <?php foreach ($classes as $script): ?>
        <script src="<?= $script; ?>"></script>
    <?php endforeach; ?>

    <?php foreach ($editor as $script): ?>
        <script src="<?= $script; ?>"></script>
    <?php endforeach; ?>

    <?php foreach ($game as $script): ?>
        <script src="<?= $script; ?>"></script>
    <?php endforeach; ?>

    <script src="./index.js"></script>
</head>

<body>
    <canvas class="fill" id="view"></canvas>
    <div id="hierarchy"></div>
    <div id="inspector"></div>
</body>

</html>