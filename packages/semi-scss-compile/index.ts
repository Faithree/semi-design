/* eslint-disable prefer-promise-reject-errors */
import path from 'path';
import sass, {Options as RenderOptions} from 'sass';
import fs from 'fs-extra';
import os from 'os';

export interface CompileScssOptions {
    semiFoundationPath: string;
    semiThemePath:string;
    outputCSSPath:string;
    isMin:boolean;

}

const defaultOptions = {
    // COMPONENT_SCSS_PATH: resolve('semi-foundation/'),
    // OUTPUT_SEMI_SCSS_PATH: resolve('semi-theme-default/semi.scss'),
    // OUTPUT_SEMI_CSS_PATH: resolve('semi-ui/dist/css/semi.css'),
    // OUTPUT_SEMI_CSS_MIN_PATH: resolve('semi-ui/dist/css/semi.min.css'),
};

export default class CompileScss {
    options: CompileScssOptions;

    /**
     * @param {object} [options]
     * @param {string} [options.COMPONENT_SCSS_PATH]
     * @param {string} [options.COMPONENT_EXTRA_SCSS_PATH]
     * @param {string} [options.OUTPUT_SEMI_SCSS_PATH]
     * @param {string} [options.OUTPUT_SEMI_CSS_PATH]
     */
    constructor(options = defaultOptions) {
        // console.log(options)
        this.options = options;
    }

    getScssFolderMap(filepath: string) {
        return fs
            .readdir(filepath)
            .then(files => {
                const folderWithScss: string[] = [];
                files.forEach(fileName => {
                    const scssFile = path.join(this.options.COMPONENT_SCSS_PATH, fileName, `${fileName}.scss`);
                    try {
                        const stats = fs.statSync(scssFile);
                        if (stats.isFile()) {
                            folderWithScss.push(fileName); // Valid file path is pushed
                        }
                    } catch (error) {
                        // console.log(error)
                    }
                });
                return folderWithScss;
            })
            .catch(error => {
                console.error(error);
                throw error;
            });
    }

    async getScssFilePathPreparingForCompiling() {
        const componentScssPath = this.options.COMPONENT_SCSS_PATH;
        const outPutSemiScss = this.options.OUTPUT_SEMI_SCSS_PATH;
        const outPutScss = outPutSemiScss.split('semi.scss')[0] + 'scss';
        const folderWithScss = await this.getScssFolderMap(componentScssPath);


        const scssFilePathPreparingForCompiling: {
            components: string[],
            theme: {
                'index.scss'?: string,
                'global.scss'?: string,
                'local.scss'?: string,
                '_font.scss'?: string,
                '_palette.scss'?: string,
                'mixin.scss'?: string,
                'variables.scss'?: string
            }
        } = {
            components: [],
            theme: {
                "index.scss": './scss/index.scss',
                "global.scss": './scss/global.scss',
                'local.scss': './scss/local.scss',
                "_font.scss": '.scss/_font.scss',
                "_palette.scss": './scss/_palette.scss',
                "mixin.scss": './scss/mixin.scss',
                'variables.scss': './scss/variables.scss'
            }
        };

        if (this.options.useAbsolutePath) {
            semiUIPath = absolutePath;
            scssFilePathPreparingForCompiling.theme = {
                "index.scss": `${outPutScss}/index.scss`,
                "global.scss": `${outPutScss}/global.scss`,
                "local.scss": `${outPutScss}/local.scss`,
                '_font.scss': `${outPutScss}/_font.scss`,
                '_palette.scss': `${outPutScss}/_palette.scss`,
                "mixin.scss": `${outPutScss}/mixin.scss`,
                "variables.scss": `${outPutScss}/variables.scss`
            }
        }

        folderWithScss.forEach(scssFile => {
            const filepath = `${semiUIPath}/${scssFile}${scssFile}.scss`;
            scssFilePathPreparingForCompiling.components.push(filepath)
        })
        scssFilePathPreparingForCompiling.components.push(`${semiUIPath}/button/iconButton.scss`);
        scssFilePathPreparingForCompiling.components.push(`${semiUIPath}/input/textarea.scss`);

        //filter non-exist file
        scssFilePathPreparingForCompiling.components = scssFilePathPreparingForCompiling.components.filter(scssFilePath => fs.existsSync(scssFilePath));
        for (const filename of Object.keys(scssFilePathPreparingForCompiling.theme)) {
            if (!fs.statSync(scssFilePathPreparingForCompiling.theme[filename])) {
                delete scssFilePathPreparingForCompiling.theme[filename];
            }
        }

        return scssFilePathPreparingForCompiling;
    }

    async preparingTempDirForCompiling(){
        const tempDir=path.resolve(os.tmpdir(),`/semi_compile_temp_path_${Date.now()}`);
        fs.emptyDirSync(tempDir);

    }

    rewriteFile(filePath: string) {
        const extraImport = this.options.COMPONENT_EXTRA_SCSS_PATH;
        let fileStr = fs.readFileSync(filePath, 'utf-8');
        if (extraImport) {
            const localImport = `\n@import "${extraImport}";`;
            try {
                const regex = /(@import '.\/variables.scss';?|@import ".\/variables.scss";?)/g;
                const fileSplit = fileStr.split(regex).filter(item => !!item);
                if (fileSplit.length > 1) {
                    fileSplit.splice(fileSplit.length - 1, 0, localImport);
                    fileStr = fileSplit.join('');
                }
            } catch (error) {
            }
        }
        return fileStr;
    }

    sassRender(compressed: boolean = false): Promise<boolean> {
        let outPutSemiCSS = this.options.OUTPUT_SEMI_CSS_PATH;
        const semiScssPath = this.options.OUTPUT_SEMI_SCSS_PATH;
        const config: RenderOptions = {
            file: semiScssPath,
            importer: (url: string) => {

                if (url.startsWith('../semi-ui/')) {
                    const result = this.rewriteFile(url);
                    return {contents: result};
                }
                return {file: url};
            }
        };
        if (compressed) {
            config.outputStyle = 'compressed';
            outPutSemiCSS = this.options.OUTPUT_SEMI_CSS_MIN_PATH;
        }

        return new Promise((reslove, reject) => {
            sass.render(config, function (error, result) {
                if (error) {
                    console.log('error: ', error);
                    console.log(error.column, error.message);
                    reject(false);
                } else {
                    fs.outputFile(outPutSemiCSS, result.css)
                        .then(res => {
                            reslove(true);
                        })
                        .catch(err => {
                            console.log('err: ', err);
                            reject(false);
                        });
                }
            });
        });
    }

    async compile() {
        await this.generateSemiScss();
        const compileResult = await this.sassRender();
        let compileMinResult = true;
        if (this.options.OUTPUT_SEMI_CSS_MIN_PATH) {
            compileMinResult = await this.sassRender(true);
        }
        return compileResult && compileMinResult;
    }
}
