---
home: true
# heroImage: /img/web.svg
heroText: mumubyte的博客
tagline: 路漫漫其修远兮，吾将上下而求索。
# actionText: 立刻进入 →
# actionLink: /web/
bannerBg: 'background: transparent;color: var(--textColor);letter-spacing: 2px;background-image: linear-gradient(90deg, rgba(50, 0, 0, 0.05) 3%, rgba(0, 0, 0, 0) 3%), linear-gradient(360deg, rgba(50, 0, 0, 0.05) 3%, rgba(0, 0, 0, 0) 3%);background-size: 20px 20px;background-position: center center;' # auto => 网格纹背景(有bodyBgImg时无背景)，默认 | none => 无 | '大图地址' | background: 自定义背景样式       提示：如发现文本颜色不适应你的背景时可以到palette.styl修改$bannerTextColor变量
# 注：网格是"框"的纹理——首页在 banner 上，文章页在 .theme-vdoing-wrapper 上（见 .vuepress/styles/index.styl），
#     两处色值尺寸一致（rgba(50,0,0,.05) / 20px），都不铺满整页

features: # 可选的
  - title: 硬件
    details: 整机与部件、测试方案/用例/报告，可靠性/环境试验，问题定位复盘
    link: /hardware/ # 可选
    imgUrl: /img/hardware.svg # 可选
  - title: 存储技术
    details: 磁盘与 RAID、ZFS/Btrfs 文件系统、SMART 与坏道、性能调优、数据恢复
    link: /storage/
    imgUrl: /img/storage.svg
  - title: 系统与网络
    details: TrueNAS/Unraid/群晖 等 NAS 系统、SMB/NFS/iSCSI 协议、万兆网络与虚拟化
    link: /network/
    imgUrl: /img/network.svg
# 文章列表显示方式: detailed 默认，显示详细版文章列表（包括作者、分类、标签、摘要、分页等）| simple => 显示简约版文章列表（仅标题和日期）| none 不显示文章列表
# postList: detailed
# simplePostListLength: 10 # 简约版文章列表显示的文章数量，默认10。（仅在postList设置为simple时生效）
# hideRightBar: true # 是否隐藏右侧边栏
---
