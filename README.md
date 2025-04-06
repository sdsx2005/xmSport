<div align="center">

# 小米运动健康刷步数

[![小米运动](https://img.shields.io/badge/小米运动-passing-success.svg?style=flat-square&logo=xiaomi&logoWidth=20&logoColor=white)](https://github.com/chiupam/xmSport/actions)
[![JavaScript](https://img.shields.io/badge/JavaScript-ES6-yellow.svg?style=flat-square&logo=javascript)](https://www.javascript.com/)
[![Node.js](https://img.shields.io/badge/Node.js-16.x-green.svg?style=flat-square&logo=node.js)](https://nodejs.org/)
[![GitHub stars](https://img.shields.io/github/stars/chiupam/xmSport?style=flat-square&logo=github)](https://github.com/chiupam/xmSport/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/chiupam/xmSport?style=flat-square&logo=github)](https://github.com/chiupam/xmSport/network/members)
[![License](https://img.shields.io/github/license/chiupam/xmSport?style=flat-square)](LICENSE)

</div>

这是一个使用GitHub Actions自动化执行的小米运动健康刷步数项目，可以定时为小米运动账号模拟随机步数数据。

## ✨ 功能

- 🕒 自动定时执行刷步数脚本（每天UTC时间14:55和15:55，对应北京时间22:55和23:55）
- 🎲 支持自定义步数范围，随机生成步数
- 🔄 支持GitHub Actions自动化执行及手动触发
- 🛡️ 内置重试机制，提高执行成功率
- 📱 支持多种渠道推送通知结果，包括Server酱、Bark、Telegram等

## 🚀 快速开始

1. **Fork本仓库**到你的GitHub账号
2. 在仓库的**Settings > Secrets > Actions**中添加以下Secrets：

### 🔑 必需的环境变量

| 名称 | 必填 | 说明 | 默认值 |
|------|:----:|------| ----- |
| `PHONE_NUMBER` | ✅ | 小米运动/小米健康账号绑定的手机号（不含+86） | 无 |
| `PASSWORD` | ✅ | 账号密码 | 无 |
| `xmSportMinStep` | ❌ | 最小步数 | 10000 |
| `xmSportMaxStep` | ❌ | 最大步数 | 19999 |
| `ENABLE_NOTIFY` | ❌ | 是否启用通知功能，设置为`true`时启用 | false |

#### 📲 通知配置

启用通知推送功能后（`ENABLE_NOTIFY=true`），可以配置以下通知渠道（至少需要配置一个）：

| 变量名 | 说明 | 参考文档 |
| ----- | ---- | ------- |
| `SERVERCHAN_KEY` | Server酱的推送密钥 | [Server酱文档](https://sct.ftqq.com/) |
| `BARK_KEY` | Bark推送密钥或完整URL | [Bark文档](https://github.com/Finb/Bark) |
| `TG_BOT_TOKEN` | Telegram机器人Token | [Telegram Bot API](https://core.telegram.org/bots/api) |
| `TG_CHAT_ID` | Telegram接收消息的用户或群组ID | [获取Chat ID教程](https://core.telegram.org/bots/features#chat-id) |
| `DINGTALK_WEBHOOK` | 钉钉机器人的Webhook URL | [钉钉自定义机器人文档](https://open.dingtalk.com/document/robots/custom-robot-access) |
| `DINGTALK_SECRET` | 钉钉机器人的安全密钥(可选) | 同上 |
| `WECOM_KEY` | 企业微信机器人的WebHook Key | [企业微信机器人文档](https://developer.work.weixin.qq.com/document/path/91770) |
| `PUSHPLUS_TOKEN` | PushPlus推送Token | [PushPlus文档](https://www.pushplus.plus/) |

3. GitHub Actions将按计划自动运行

## ⚙️ 工作流程

GitHub Actions工作流程配置在`.github/workflows/xmsport.yml`文件中：

- ⏰ 每天14:55和15:55自动执行（UTC时间，对应北京时间22:55和23:55）
- 👆 支持手动触发工作流程并设置自定义步数范围
- 🟢 使用Node.js环境运行脚本

## 🔧 手动触发

在GitHub仓库页面的Actions标签页中，你可以手动触发工作流，并设置自定义的步数范围：

- `minStep`: 最小步数，默认为10000
- `maxStep`: 最大步数，默认为19999

## 📝 数据模板

仓库中已经包含了`src/data.txt`文件，其中包含小米运动的数据模板：

- ✅ 工作流会自动读取该文件内容，无需手动设置环境变量
- 🔄 如需修改数据模板，只需直接编辑该文件，推送后自动生效

## 📲 通知功能

脚本执行失败时，可以通过多种渠道接收通知：

- 需要先设置`ENABLE_NOTIFY`为`true`来启用通知功能
- 仅在修改步数失败时才会发送通知，成功时不会打扰您
- **Server酱**：微信推送，设置`SERVERCHAN_KEY`环境变量
- **Bark**：iOS推送，设置`BARK_KEY`环境变量
- **Telegram**：设置`TG_BOT_TOKEN`和`TG_CHAT_ID`环境变量
- **钉钉**：企业消息，设置`DINGTALK_WEBHOOK`和可选的`DINGTALK_SECRET`环境变量
- **企业微信**：设置`WECOM_KEY`环境变量
- **PushPlus**：微信推送，设置`PUSHPLUS_TOKEN`环境变量

如果未配置任何通知渠道，脚本将只在GitHub Actions日志中输出结果。

## 📂 文件结构

- `src/index.js`: 主脚本文件，负责请求处理和步数提交
- `src/dataProcessor.js`: 数据处理模块，负责处理和生成数据
- `src/apiService.js`: API服务模块，处理与小米服务器的通信
- `src/notify.js`: 通知模块，支持多种渠道推送结果
- `src/utils.js`: 工具函数模块，提供各种通用功能
- `src/data.txt`: 数据模板文件（已包含在仓库中）

## ⚠️ 免责声明

**请仔细阅读以下声明：**

1. 本项目仅供学习和研究目的使用，不得用于商业或非法用途
2. 使用本项目可能违反小米运动/小米健康的服务条款，请自行评估使用风险
3. 本项目不保证功能的可用性，也不保证不会被小米官方检测或封禁
4. 使用本项目造成的任何问题，包括但不限于账号被封禁、数据丢失等，项目作者概不负责
5. 用户需自行承担使用本项目的全部风险和法律责任

## 📜 许可证

本项目采用 [MIT 许可证](LICENSE) 进行许可。

## 🧪 本地测试

如果你想在本地测试脚本，可以按照以下步骤操作：

1. 克隆仓库到本地
   ```bash
   git clone https://github.com/your-username/xmSport.git
   cd xmSport
   ```

2. 安装依赖
   ```bash
   npm install
   ```

3. 创建环境变量文件
   ```bash
   cp .env.example .env
   ```

4. 编辑`.env`文件，填入你的个人信息
   - 修改`PHONE_NUMBER`和`PASSWORD`为你的账号信息
   - `DATA_JSON`会通过测试脚本自动读取，无需手动设置

5. 运行测试脚本（推荐）
   ```bash
   npm test
   ```
   这个命令会自动读取`src/data.txt`文件内容并设置为环境变量

6. 调试失败通知（可选）
   ```bash
   npm run test:fail
   ```
   这个命令使用错误的账号密码来触发失败通知

### 手动方式测试（可选）

如果你希望手动控制环境变量，可以：

1. 打开`src/data.txt`文件，复制其内容
2. 将内容粘贴到`.env`文件的`DATA_JSON=`后面（注意转义特殊字符）
3. 使用以下命令运行：
   ```bash
   npm run test:env
   ``` 