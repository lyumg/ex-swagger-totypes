import path from 'path'
import fs from 'fs'
import vscode from 'vscode'

import { WORKSPACE_PATH, TEMPLATE_FILE_NAME, CONFIG_GROUP } from '../tools'

export interface TemplateParserParams {
  defaultName: string
}

export interface TemplateBaseType {
  namespace?: (params: TreeInterface) => string
  params?: (params: TreeInterface) => string
  paramsItem?: (item: TreeInterfacePropertiesItem, params: TreeInterface) => string
  response?: (params: TreeInterface) => string
  responseItem?: (item: TreeInterfacePropertiesItem, params: TreeInterface) => string
  copyRequest?: (params: FileHeaderInfo) => string | string[]
  ignoreOriginalRef?: (originalRef: string) => boolean
  isBodyParams?: (params: { in: string }) => boolean
}

export let templateConfig: TemplateBaseType = {}

let workspaceConfigPath = path.join(WORKSPACE_PATH || '', '.vscode', TEMPLATE_FILE_NAME)
if (!fs.existsSync(`${workspaceConfigPath}.js`)) {
  workspaceConfigPath = `${workspaceConfigPath}.cjs`
}

/** 获取工作区模板配置 */
export async function getWorkspaceTemplateConfig(): Promise<TemplateBaseType> {
  if (!fs.existsSync(workspaceConfigPath)) {
    return templateConfig
  }
  const res = await import(workspaceConfigPath)
  templateConfig = res.default || res
  if (templateConfig.copyRequest) {
    vscode.commands.executeCommand('setContext', `${CONFIG_GROUP}.hasCopyRequestFn`, 1)
  } else {
    vscode.commands.executeCommand('setContext', `${CONFIG_GROUP}.hasCopyRequestFn`, 0)
  }

  return templateConfig
}

getWorkspaceTemplateConfig()

/** 监听文件保存 */
vscode.workspace.onDidSaveTextDocument(({ languageId, fileName }) => {
  // 过滤非 TS 语言文件
  if (languageId !== 'javascript' && fileName !== workspaceConfigPath) return
  getWorkspaceTemplateConfig()
})
