import fs from 'fs';
import path from 'path';
import md5 from 'md5';
import { execSync } from 'child_process';

let __DEBUG__ = false;
let __CACHEENABLED__ = true;

let cache = [];

export const clearLoaderCache = () => {
    // Clear cache every run
    cache = [];
};

export const disableCache = () => {
    __CACHEENABLED__ = false;
};

export const enableDebugMode = () => {
    __DEBUG__ = true;
};

export const getSketchImage = (file, id, format = 'png') => {
    let sketchToolLocation =
        '/Applications/Sketch Beta.app/' +
        'Contents/Resources/sketchtool/bin/sketchtool';

    // Support the non-beta version.
    if (!fs.existsSync(sketchToolLocation))
        sketchToolLocation =
            '/Applications/Sketch.app/' +
            'Contents/Resources/sketchtool/bin/sketchtool';

    if (fs.existsSync(sketchToolLocation)) {
        if (fs.existsSync(file)) {
            let scaleCmd = '';
            let suffix = '.';
            if (format == 'png') {
                scaleCmd = ' --scale=2';
                suffix = '@2x.';
            }

            let cmd =
                '"' +
                path.resolve(sketchToolLocation) +
                '" export layers ' +
                path.resolve(file) +
                ' --use-id-for-name=YES ' +
                scaleCmd +
                ' --format=' +
                format +
                ' --items=' +
                id +
                ' --output="' +
                path.dirname(file) +
                '/exports"';
            execSync(cmd);
            let outFile =
                path.dirname(file) + '/exports/' + id + suffix + format;
            if (fs.existsSync(outFile)) {
                return fs.readFileSync(outFile);
            } else {
                throw Error('Unable to extract image: ' + id);
            }
        }
    }
};

export const getSketchJSON = file => {
    // Quick Cache...
    let hash = md5(file);
    if (__CACHEENABLED__ && cache[hash]) return cache[hash];

    if (file.indexOf('.json') !== -1) {
        let json = JSON.parse(fs.readFileSync(file));
        if (__CACHEENABLED__) cache[hash] = json;
        return json;
    }

    let sketchToolLocation =
        '/Applications/Sketch Beta.app/' +
        'Contents/Resources/sketchtool/bin/sketchtool';

    // Suppor the non-beta version.
    if (!fs.existsSync(sketchToolLocation))
        sketchToolLocation =
            '/Applications/Sketch.app/' +
            'Contents/Resources/sketchtool/bin/sketchtool';

    if (fs.existsSync(sketchToolLocation)) {
        if (fs.existsSync(file)) {
            let cmd =
                '"' +
                path.resolve(sketchToolLocation) +
                '" dump ' +
                path.resolve(file);
            let execResult = execSync(cmd);
            if (__DEBUG__) fs.writeFileSync(file + '.ref.json', execResult);
            let json = JSON.parse(execResult);
            if (__CACHEENABLED__) cache[hash] = json;
            return json;
        } else {
            throw Error('Sketch File Not Found: ' + file);
        }
    } else {
        throw Error('Sketch Tool Not Found: ' + sketchToolLocation);
    }
};
