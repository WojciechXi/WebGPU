<?php
$response = [
    'shaders' => [],
    'models' => [],
];

$shaderPath = './Assets/Shaders';
$files = array_diff(scandir($shaderPath), ['.', '..']);
foreach ($files as $file) {
    if (!str_ends_with($file, '.wgsl')) continue;
    $response['shaders'][$file] = file_get_contents("{$shaderPath}/{$file}");
}

$shaderPath = './Assets/Models';
$files = array_diff(scandir($shaderPath), ['.', '..']);
foreach ($files as $file) {
    if (!str_ends_with($file, '.obj')) continue;
    $response['models'][$file] = file_get_contents("{$shaderPath}/{$file}");
}

header('content-type: application/json');
die(json_encode($response, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE));
