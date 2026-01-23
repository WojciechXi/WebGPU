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
    <div id="editor" class="column fill">
        <div class="row grow">
            <div class="column" style="width: 270px;">
                <div id="hierarchy"></div>
            </div>
            <canvas class="grow" id="view"></canvas>
            <div class="column" style="width: 270px;">
                <div id="inspector"></div>
            </div>
        </div>
        <div class="row" style="height: 270px;">
            <div id="assets"></div>
        </div>
    </div>
</body>

</html>