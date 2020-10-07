const gulp            = require('gulp');
const log             = require('fancy-log');
const del             = require('del');
const zip             = require('gulp-zip');
const clean_css       = require('gulp-clean-css');
const imagemin        = require('gulp-imagemin');
const sass            = require('gulp-sass');
const uglify          = require('gulp-uglify');
const babel           = require('gulp-babel');
const touch           = require('gulp-touch');
const replace         = require('gulp-replace');
const babel_preset    = require('babel-preset-env');
const checkFilesExist = require('check-files-exist');

/**
 * Парсит строку в булеан.
 *
 * @see https://stackoverflow.com/a/24744599
 *
 * @param {String} val
 *
 * @return {boolean}
 */
let parseBoolean = function (val) {
    return !/^(?:f(?:alse)?|no?|0+)$/i.test(val) && !!val;
};

module.exports = {
    /**
     * Вставялет переменные в обозначенные плейхолдеры в коде.
     *
     * @param {string} src
     * @param {string} env
     *
     * @returns Promise
     */
    set_variables: function (src, env) {
        log('Установка переменных в плейсхолдеры');

        return new Promise(function (resolve, reject) {
            // В начале пытаемся подставить с кавычками т.к. бывает формат нужен конкретный, а потом как есть.
            gulp.src([src + '/**.json', src + '/**.js', src + '/*/**.js', src + '/**/*.scss'])
                .pipe(replace("'%app_env%'", "'" + env + "'"))
                .pipe(replace('%app_env%', env))

                .pipe(replace("'%app_domain%'", "'" + process.env.APP_DOMAIN + "'"))
                .pipe(replace('%app_domain%', process.env.APP_DOMAIN))

                .pipe(replace("'%app_widget_code%'", "'" + process.env.APP_WIDGET_CODE + "'"))
                .pipe(replace('%app_widget_code%', process.env.APP_WIDGET_CODE))

                .pipe(replace("'%amocrm_widget_code%'", "'" + process.env.AMOCRM_WIDGET_CODE + "'"))
                .pipe(replace('%amocrm_widget_code%', process.env.AMOCRM_WIDGET_CODE))

                .pipe(replace("'%app_free%'", parseBoolean(process.env.APP_FREE)))
                .pipe(replace('%app_free%', process.env.APP_FREE))

                .pipe(replace("'%app_version%'", parseBoolean(process.env.APP_VERSION)))
                .pipe(replace('%app_version%', process.env.APP_VERSION))

                .pipe(gulp.dest(src + '/'))
                .pipe(touch())
                .on('end', resolve)
                .on('error', reject);
        });
    },

    /**
     * Копирование файлов из одной директории в другую.
     *
     * @param {string} from
     * @param {string} to
     *
     * @return Promise
     */
    copy_files: function (from, to) {
        log('Копирование файлов из ' + from + ' в ' + to);

        return new Promise(function (resolve, reject) {
            gulp.src(from + '/**')
                .pipe(gulp.dest(to))
                .on('end', resolve)
                .on('error', reject);
        })
    },

    /**
     * Копиляция css-стилей из sass.
     *
     * @param {string} src
     * @param {string} widgetCode
     *
     * @return Promise
     */
    compile_sass: function (src) {
        log('Компиляция sass');

        let files = [
            src + '/**/*.scss',
            '!' + src + '/**/{scss/,scss/**}'
        ];

        return new Promise(function (resolve, reject) {
            checkFilesExist(files).then(function () {
                gulp.src([src + '/**/*.scss', '!' + src + '/**/{scss/,scss/**}'])
                    .pipe(sass().on('error', reject))
                    .pipe(gulp.dest(src + '/'))
                    .on('end', resolve)
                    .on('error', reject);
            }, function () {
                resolve();
            })
        })
    },

    /**
     * Удаление sass-файлов.
     *
     * @param {string} src
     *
     * @returns Promise
     */
    clean_sass: function (src) {
        log('Удаление sass-файлов');

        let files = [
            src + '/**/scss',
            src + '/**/*.scss',
            src + '/css/common',
            src + '/css/variables.css',
        ];

        return new Promise(function (resolve, reject) {
            del(files, {force: true})
                .then(resolve)
                .catch(reject);
        })
    },

    /**
     * Транспиляция JS в es5.
     *
     * @param {string}  src
     * @param {boolean} is_debug
     *
     * @return Promise
     */
    make_babel: function (src, is_debug = false) {
        log('Транспиляция es6 в es5');

        let params = {
            minified: false,
            comments: true,
        };

        if (!is_debug) {
            params = {
                minified: false,
                comments: false,
                presets: [babel_preset],
            };
        }
        return new Promise(function (resolve, reject) {
            gulp.src(src + '/**/*.js')
                .pipe(babel(params))
                .pipe(gulp.dest(src))
                .on('end', resolve)
                .on('error', reject);
        })
    },

    /**
     * Сжимает CSS.
     *
     * @param {string}  src
     * @param {boolean} is_debug
     *
     * @returns Promise
     */
    minify_css: function (src, is_debug = false) {
        log('Сжатие CSS');

        let params = {
            debug: is_debug,
            format: 'beautify'
        };

        return new Promise(function (resolve, reject) {
            gulp.src(src + '/**/*.css')
                .pipe(clean_css(params, function (details) {
                    log('Размер файла', details.name, 'до сжатия:', details.stats.originalSize, 'bytes');
                    log('Размер файла', details.name, 'после сжатия:', details.stats.minifiedSize, 'bytes');
                }))
                .pipe(gulp.dest(src))
                .on('end', resolve)
                .on('error', reject);
        })
    },

    /**
     * Сжимает JS.
     *
     * @param {string}  src
     * @param {boolean} is_debug
     *
     * @returns Promise
     */
    minify_js: function (src, is_debug = false) {
        log('Сжатие JS');

        // Для публичных виджетов.
        let params = {
            "parse": {},
            "compress": {
                "inline": false
            },
            "mangle": false,
            "output": {
                "beautify": true
            }
        };

        if (is_debug) {
            params = {
                "parse": {},
                "compress": {},
                "mangle": false,
                "output": {}
            };
        }

        return new Promise(function (resolve, reject) {
            gulp.src(src + '/*/**.js')
                .pipe(uglify(params))
                .pipe(gulp.dest(src))
                .on('end', resolve)
                .on('error', reject);
        })
    },

    /**
     * Удаление шаблонов картинок.
     *
     * @param {string} src
     *
     * @return Promise
     */
    remove_psd: function (src) {
        log('Удаление шаблонов картинок');

        return new Promise(function (resolve, reject) {
            del(src + '/images/*.psd', {force: true})
                .then(resolve)
                .catch(reject);
        })
    },

    /**
     * Сжимает изображения.
     *
     * @param {string} src
     *
     * @return Promise
     */
    image_compress: function (src) {
        log('Сжатие изображений');

        // JPG тоже пожимаем.
        let params = [imagemin.jpegtran({progressive: true})];

        return new Promise(function (resolve, reject) {
            gulp.src(src + '/images/*')
                .pipe(imagemin([
                    imagemin.gifsicle({interlaced: true}),
                    imagemin.jpegtran({progressive: true}),
                    imagemin.optipng({optimizationLevel: 5}),
                    imagemin.svgo({
                        plugins: [
                            {removeViewBox: true},
                            {cleanupIDs: false}
                        ]
                    })
                ]))
                .pipe(gulp.dest(src + '/images/'))
                .on('end', resolve)
                .on('error', reject);
        })
    },

    /**
     * Архивирует директорию с виджетом.
     *
     * @param {string} from
     * @param {string} to
     * @param {string} name
     *
     * @return Promise
     */
    widget_zip: function (from, to, name = 'widget.zip') {
        log('Архивация виджета ' + to);

        return new Promise(function (resolve, reject) {
            gulp.src(from + '/**')
                .pipe(zip(name))
                .pipe(gulp.dest(to))
                .on('end', resolve)
                .on('error', reject);
        })
    },

    /**
     * Удаляет всю указанную директорию.
     *
     * @param {string} src
     *
     * @return Promise
     */
    clean_folder: function (src) {
        log('Удаление содержимого в ' + src);

        return new Promise(function (resolve, reject) {
            del(src, {force: true})
                .then(resolve)
                .catch(reject);
        })
    },
};