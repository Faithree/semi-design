import path from 'path';
import fs from "fs-extra";
import {set} from 'lodash-es';

const lodash={set};

const generateComponentsScssMap=(foundationPath:string)=>{
    const foundationComponentList=fs.readdirSync(foundationPath);
    const componentScssMap: { [componentName:string]:{ [scssFileName:string]:string}} = {};
    foundationComponentList.forEach(fileName => {
        const fileAbsolutePath=path.join(foundationPath,fileName);
        if(fs.existsSync(fileAbsolutePath) && fs.statSync(fileAbsolutePath).isDirectory()){
            //is component folder
            const componentPath=fileAbsolutePath;
            const scssFileList=fs.readdirSync(componentPath).filter((fileName)=>fileName.endsWith('.scss'));
            scssFileList.forEach(scssFileName=>{
                const scssRaw=fs.readFileSync(path.join(componentPath,scssFileName),{encoding:'utf-8'});
                lodash.set(componentScssMap,[fileName,scssFileName],scssRaw);
            })
        }
    });


    return componentScssMap;
}

const generateThemeScssMap=(themePath:string)=>{
    const fileList=['_font.scss','_palette.scss','global.scss','index.scss','local.scss','mixin.scss','variables.scss'];
    const themeScssMap:{[key:Pa]:string}={}
    for(const fileName of fileList){
        const scssAbsolutePath=path.join(themePath,'scss',fileName);
        if(fs.existsSync(scssAbsolutePath)){
            const absolutePath=path.join(themePath,fileName);
            const scssRaw=fs.readFileSync(absolutePath,{encoding:"utf8"});
            lodash.set(themeScssMap,fileName,scssRaw);
        }
    }
    return themeScssMap;
};

const generateScssMap=(foundationPath:string,themePath:string)=>{
    return {
        components:generateComponentsScssMap(foundationPath),
        theme:generateThemeScssMap(themePath)
    }
}

export default generateScssMap;
