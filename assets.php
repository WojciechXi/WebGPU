<?php
$shaders = [];

$shaderPath = './Assets/Shaders';
$shaderFiles = array_diff(scandir($shaderPath), ['.', '..']);

foreach ($shaderFiles as $shaderFile) {
    $shaders[$shaderFile] = file_get_contents("{$shaderPath}/{$shaderFile}");
}

header('content-type: application/json');
die(json_encode([
    'shaders' => $shaders,
], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE));
