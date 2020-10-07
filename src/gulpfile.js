const gulp    = require('gulp');
const log     = require('fancy-log');
const env     = require('gulp-env');
const builder = require('./builder');

const projectRoot = "/app";
const buildFolder = "/tmp/widget";
const srcFolder   = projectRoot + "/assets/widget/src";
const zipName     = "/widget.zip";

/**
 * Сборка виджета для публикации (отправка на модерацию).
 */
function buildProduction() {
    env({
        file: projectRoot + '/.env.prod',
        type: '.ini',
    });

    let widgetCode = process.env.AMOCRM_WIDGET_CODE;

    log('Начинаем сборку виджета для prod: ' + widgetCode);

    return builder
        .copy_files(srcFolder, buildFolder)
        .then(() => builder.set_variables(buildFolder, 'prod'))
        .then(() => builder.compile_sass(buildFolder))
        .then(() => builder.clean_sass(buildFolder))
        .then(() => builder.remove_psd(buildFolder))
        .then(() => builder.make_babel(buildFolder))
        .then(() => builder.minify_css(buildFolder))
        .then(() => builder.minify_js(buildFolder))
        .then(() => builder.widget_zip(buildFolder, projectRoot + '/', zipName))
        .then(() => builder.clean_folder(buildFolder))
        .then(() => log('Закончили сборку виджета ' + widgetCode))
        .catch((err) => log(err));
}

/**
 * Сборка виджета во время разработки.
 */
function buildDevelop() {
    env({
        file: projectRoot + '/.env',
        type: '.ini',
    });

    let widgetCode = process.env.AMOCRM_WIDGET_CODE;

    log('Начинаем сборку виджета для dev: ' + widgetCode);

    return builder
        .copy_files(srcFolder, buildFolder)
        .then(() => builder.set_variables(buildFolder, 'dev'))
        .then(() => builder.compile_sass(buildFolder))
        .then(() => builder.clean_sass(buildFolder))
        .then(() => builder.remove_psd(buildFolder))
        .then(() => builder.make_babel(buildFolder, true))
        .then(() => builder.minify_css(buildFolder, true))
        .then(() => builder.widget_zip(buildFolder, projectRoot, zipName))
        .then(() => builder.clean_folder(buildFolder))
        .then(() => log('Закончили сборку виджета ' + widgetCode))
        .catch((err) => log(err));
}

gulp.task('dev', buildDevelop);
gulp.task('prod', buildProduction);
