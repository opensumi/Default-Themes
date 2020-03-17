# ide theme

## Development

### 主题研发

* 你可以通过 [vscode 官方插件拓展的方式](https://code.visualstudio.com/docs/getstarted/themes#_creating-your-own-color-theme) 来开发自定义主题
* 你也可以在 `settings.json` 中增加 `workbench.colorCustomizations` 字段，然后就可以实时预览和编辑你的主题配色

### 主题包打包

```shell
$ tnpm i -g @ali/ide-extension-builder // 安装 extension builder

$ npm run update // 抓取语雀文档内容以更新主题
$ npm run release // 发布版本
$ npm run build // 插件打包 zip
$ tnpm publish
```
