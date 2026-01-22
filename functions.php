<?php
function ScanFilesRecursive(string $directory, array $extensions = [], array $files = []): array {
    if ($items = scandir($directory)) {
        $items = array_diff($items, ['.', '..']);

        foreach ($items as $item) {
            $itemPath = "{$directory}/{$item}";
            if (!is_file($itemPath)) continue;

            $itemInfo = pathinfo($item);
            if ($extensions && !in_array($itemInfo['extension'], $extensions)) continue;

            $files[] = $itemPath;
        }

        foreach ($items as $item) {
            $itemPath = "{$directory}/{$item}";
            if (!is_dir($itemPath)) continue;

            $files = ScanFilesRecursive($itemPath, $extensions, $files);
        }
    }

    return $files;
}
