/**
 * 实现拷贝文件、文件夹到指定目录功能，并按照指定前缀+时间来创建副本到该目录，然后把所有要拷贝的文件和文件夹拷贝到该目录
 * 并且对目标目录做限制，如果目标目录的文件夹长度大于指定长度，就删除修改时间最远的一次的文件夹，然后再拷贝
 * 1.需要两个地址：拷贝的基本路径和拷贝的目标地址
 * 2.需要提供：拷贝的文件或文件夹
 * 3.需要提供：新建文件夹的命名的前缀
 * 4.储存长度：备份的文件夹可接受的最大长度
 */
import { log } from 'console'
import * as fs from 'fs-extra'
import * as path from 'path'
import {getRootPath} from './utils'

const sourceDir = "./"
const backupsDir = "./worlds_backup"
const copyFileAndFolder = ["./allowlist.json","./permissions.json","./server.properties","./worlds"]
const newFolderPrefix = "world"
const storageLength = 5

interface Options {
    dirOt:{
        sourceDir:string,
        backupsDir:string
    },
    copyFileAndFolder:string[],
    newFolderPrefix:string,
    storageLength:number
}

fileCopy({
    dirOt:{
        sourceDir,
        backupsDir
    },
    copyFileAndFolder,
    newFolderPrefix,
    storageLength
})

async function fileCopy(options:Options) {
    const {dirOt,copyFileAndFolder,newFolderPrefix,storageLength} = options

    // 不存在copy目标文件夹则创建
    if(!await fs.pathExists(path.resolve(getRootPath(),dirOt.backupsDir))) {
        fs.mkdirsSync(backupsDir,0o2775)
    }

    // 新文件夹名称是否不规范
    new Promise(async (resolve,reject) => {
        // 源路径和目标路径是否正确
        const p2 = await fs.pathExists(path.resolve(getRootPath(),dirOt.sourceDir))
        const p3 = newFolderPrefix.search(/^[^<>:"/\\|?*\x00-\x1F]+$/) != -1
        if(p2 && p3) {
            resolve(true)
        } else {
            reject(`配置错误，请检查路径或文件夹命名是否规范`)
        }
    }).catch(err=>{
        throw new Error(err)
    })

    // 检查文件夹个数是否大于指定要求
    const folderNames = fs.readdirSync(path.resolve(getRootPath(),dirOt.backupsDir))
    log('folderNames',folderNames)
    // 如果对应目录文件夹个数长度大于5，就删除修改时间最远一次的文件夹
    if(folderNames.length >= 5) {
        // 删掉最久远的一次副本
        fs.removeSync(sortFiles(folderNames)[0])
    }

    // 创建新副本的文件夹
    const folderName = getTimeFolderName(newFolderPrefix)
    const folderPath = path.resolve(getRootPath(),backupsDir,folderName)
    fs.mkdirSync(folderPath,0o2775)
    
    copyFileAndFolder.forEach(async fileName => {
        // 要copy的文件或文件夹是否存在
        const filePath = path.resolve(getRootPath(),fileName)
        const p1 = await fs.pathExists(filePath)
        if(!p1) throw new Error("copy的文件或文件夹不存在")

        // 复制文件夹到新建的文件夹
        try {
            await fs.copy(filePath,path.join(folderPath,fileName))
        } catch (error) {
            throw new Error(`复制文件或文件夹错误，请检查${error}`)
        }
    })
    
    // 查看目标路径是否复制成功
    log('folder: ',fs.readdirSync(folderPath))
}

// 获得时间格式命名的新文件夹
function getTimeFolderName(newFolderPrefix:string) {
    const ts = new Date().toLocaleString("zh-CN")
    const folderName = ts.replace(/\//g,"-").replace(/\s/g,"@").replace(/:/g,"-")
    const newFolderName = `${newFolderPrefix}@${folderName}`
    return newFolderName
}

// 排序文件夹并返回按创建时间排序的文件夹路径数组
function sortFiles(folderNames:string[]) {
    // TODO：排序文件夹
    let folders: {folderPath:string,time:Date}[] = []
    folderNames.forEach(async folder=>{
        const folderPath = path.resolve(getRootPath(),backupsDir,folder)
        const stats = fs.statSync(folderPath)
        folders.push({
            folderPath,
            time:stats.birthtime                    
        })
    })
    folders = folders.sort((a,b) => a.time.getTime() - b.time.getTime())
    return folders.map(folderObj => folderObj.folderPath)
}