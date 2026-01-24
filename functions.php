<?php
function ScanFilesRecursive(string $directory, array $extensions = [], array $files = [], ?string $root = null): array {
    if ($items = scandir($root . $directory)) {
        $items = array_diff($items, ['.', '..']);

        foreach ($items as $item) {
            $itemPath = "{$directory}/{$item}";
            if (!is_file("{$root}$itemPath")) continue;

            $itemInfo = pathinfo($item);
            if ($extensions && !in_array($itemInfo['extension'], $extensions)) continue;

            $pathInfo = pathinfo("{$root}$itemPath");
            $pathInfo['dirname'] = str_replace($root, '', $pathInfo['dirname']);
            $files[$itemPath] = [
                'mimeType' => mime_content_type("{$root}$itemPath"),
                'pathInfo' => $pathInfo,
            ];
        }

        foreach ($items as $item) {
            $itemPath = "{$directory}/{$item}";
            if (!is_dir("{$root}$itemPath")) continue;

            $files = ScanFilesRecursive($itemPath, $extensions, $files, $root);
        }
    }

    return $files;
}
