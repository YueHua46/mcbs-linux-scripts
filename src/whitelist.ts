/**
 * 需求：实现对白名单的增删改查，白名单通过JSON存储
 */
import * as fs from 'fs-extra'
import { getRootPath } from './utils'
import { resolve } from 'path'
import { log } from 'console'
import {v4 as uuid} from 'uuid'

interface AllowItem {
    ignoresPlayerLimit: boolean,
    name: string,
    xuid: string,
}

interface WhiteItem {
    name:string,
    qq:string
}

class WhiteList {
    allowList: AllowItem[] = []
    whiteList: WhiteItem[] = []
    allowListPath:string = ""
    whiteListPath:string = ""
    constructor() {
        this.getPath()
        this.loadAllowList()
    }
    public getAllowListPath() {
        this.allowListPath = resolve(getRootPath(),"./allowlist.json")
    }
    public getWhiteListPath() {
        this.whiteListPath = resolve(getRootPath(),"./whitelist.json")
    }
    public getPath() {
        this.getAllowListPath()
        this.getWhiteListPath()
    }
    public loadJSON() {
        this.loadAllowList()
        this.loadWhiteList()
    }
    public loadAllowList() {
        this.allowList = fs.readJSONSync(this.allowListPath)
    }
    public loadWhiteList() {
        this.whiteList = fs.readJSONSync(this.whiteListPath)
    }
    public addUser(name:string,qq:string,ipl:boolean = false) {
        if(!this.allowList.find(v=>v.name === name)) {
            this.allowList.push({
                name,
                ignoresPlayerLimit:ipl,
                xuid:uuid()
            })
            this.whiteList.push({
                name,
                qq
            })
            this.writeList()
            this.loadJSON()
            log('用户添加成功：',name)
        } else {
            throw new Error("用户已存在，不可重复添加")
        }
    }
    public delUser(name:string) {
        this.loadJSON()
        if(this.allowList.find(v=>v.name === name)) {
            this.allowList = this.allowList.filter(v=>v.name != name)
            this.whiteList = this.whiteList.filter(v=>v.name != name)
            this.writeList()
            log(`用户删除成功：${name}`)
        } else {
            throw new Error(`用户删除失败，没有该用户：${name}`)
        }
    }
    public writeList() {
        this.writeAllowList()
        this.writeWhiteList()
    }
    public writeAllowList() {
        fs.writeJSONSync(this.allowListPath,this.allowList,{spaces:'\t'})
    }
    public writeWhiteList(){
        fs.writeJSONSync(this.whiteListPath,this.whiteList,{spaces:'\t'})
    }
}

const whitelist = new WhiteList()

whitelist.addUser("Yinglin3467","2766274062",true)
