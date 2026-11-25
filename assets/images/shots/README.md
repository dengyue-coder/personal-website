# 项目截图存放说明

把真实运行截图 / 演示 GIF 放到本目录（`assets/images/shots/`），再到 `projects.html` 对应卡片的 `<figure class="project-banner">` 里，把 `<img src="...svg">` 的 `src` 换成下面对应的文件名即可；横幅已按 16:7 自动裁剪（`object-fit: cover`），无需改样式。

| 卡片 | 建议文件名 | 对应项目 |
| --- | --- | --- |
| 01 | `shots/eeg-monitor.png` | EEG Monitor · 鸿蒙脑电监测应用 |
| 02 | `shots/eduprism.png` | 智教棱镜 EduPrism · 教学能力诊断平台 |
| 03 | `shots/news-platform.png` | 「大事件」新闻资讯管理平台 |
| 04 | `shots/ai-toolkit.png` | AI 驱动的个人效率工具集 |
| 05 | `shots/yinling.png` | 「银铃陪护」微信小程序 |
| 06 | `shots/quiz-site.png` | 「心理模块」在线测验网站 |
| 07 | `shots/math-modeling.png` | 数学建模竞赛项目 |

## 建议规格

- 横图优先，宽 ≥ 1200px，比例接近 16:7；截图会被居中裁剪。
- 格式：PNG（界面截图）或 GIF（短演示循环）；文件尽量压到 300KB 以内。
- 替换示例：
  ```html
  <figure class="project-banner">
    <img src="assets/images/shots/eduprism.png" alt="智教棱镜项目截图" width="1600" height="700" loading="lazy">
  </figure>
  ```

> 目前横幅用的是 `assets/images/covers/` 下的矢量封面占位；在补齐真实截图前先保留封面，不要留空 `src`。
