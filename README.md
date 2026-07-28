# 📚 阅书 · 小说阅读平台

## 🆓 免费服务器部署

### 方法1：Render（推荐，最简单）
1. 手机浏览器打开 https://render.com → Sign Up → 用 GitHub 登录
2. 点 **New +** → **Web Service**
3. 连接 GitHub 仓库，或选 **Deploy from public repo**
4. 填仓库地址：粘贴下面的部署包内容
5. 设置:
   - **Name:** `yueshu`（随意）
   - **Environment:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Plan:** Free
6. 点 **Create Web Service**
7. 等2分钟部署完，会给你一个 `https://yueshu.onrender.com` 的链接
8. 把链接发到手机浏览器打开就可以用了！

### 方法2：Railway
1. https://railway.app 注册（GitHub 登录）
2. **New Project** → **Deploy from GitHub repo**
3. 把代码传到 GitHub，部署即可
4. 会得到 `https://xxx.up.railway.app` 链接

### 方法3：Koyeb
1. https://koyeb.com 注册
2. **Create App** → 选 GitHub 仓库
3. 设置启动命令: `npm start`

## 🏠 局域网使用（有电脑不需要服务器）
1. 电脑装 Node.js
2. 解压后 `cd deploy && npm install && node server.js`
3. 手机连接同一 Wi-Fi，访问 `http://电脑IP:3000`

## 📱 单机使用（不用服务器不联网）
打开 `standalone.html` 即可，数据存在手机浏览器本地。

## 🔑 默认管理员
- **账号:** admin
- **密码:** admin123
