bs3base
=======

BootStrap3 base project

目的
---
BootStrap3是个好东西，jQuery是个好东西，FontAwesome也是好东西。但自从他们做了大版本的升级之后，我们之前使用过他们老版本的项目都shit了！
这里就是为了将过去积累的代码和经验与最新的组件重新结合，创造一个基于BS，FA，jQ等最新版本的基础web app的开发框架。
服务器端是Node.js，数据库是mongodb，通过mongoose来操作，模版引擎用jade，css使用lESS。
开发时使用nodemon，生产使用PM2。
Gruntfile是主要的入口。

要做的事
------
- 通过AMD的方式来加载js库
- 研究docker部署
