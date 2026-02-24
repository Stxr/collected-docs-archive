import os
import re

source_file = os.path.expanduser("~/workspace/collected_docs_site/正文/00_序章：背景与人物.md")
output_dir = os.path.expanduser("~/workspace/collected_docs_site/人物设计")

with open(source_file, 'r', encoding='utf-8') as f:
    content = f.read()

# Pattern to capture "Name：Description"
# Matches line starting with Chinese chars, colon, then text until newline
pattern = re.compile(r"^([\u4e00-\u9fa5]{2,3})：(.+)$", re.MULTILINE)

matches = pattern.findall(content)

def generate_design_doc(name, desc):
    # Try to extract specific fields if keywords exist
    weapon = "未知"
    identity = "唐国七义士之一"
    nickname = "无"
    
    if "武器为" in desc:
        parts = desc.split("武器为")
        weapon_part = parts[1].split("，")[0].split("。")[0]
        weapon = weapon_part
    
    if "人称" in desc:
        parts = desc.split("人称")
        nick_part = parts[1].split("，")[0].split("。")[0]
        nickname = nick_part
        
    # Visual keywords inference
    visuals = []
    if "烟斗" in desc: visuals.append("叼着烟斗")
    if "颓废" in desc: visuals.append("颓废沧桑")
    if "白衣" in desc: visuals.append("一袭白衣")
    if "扇" in desc: visuals.append("折扇")
    if "红玉" in desc: visuals.append("红玉色战甲/枪")
    if "光头" in desc or "空门" in desc: visuals.append("僧侣装束")
    if "疯癫" in desc: visuals.append("凌乱/疯狂")
    
    visual_str = "、".join(visuals) if visuals else "暂无特殊描写"

    md_content = f"""# 人物设计案：{name}

## 👤 基本档案
- **姓名**：{name}
- **称号**：{nickname}
- **核心身份**：{identity}
- **标志性武器**：{weapon}

## 🎭 性格侧写
> {desc}

## 🎨 美术设定建议
- **关键视觉元素**：{visual_str}
- **气质标签**：{extract_mood(desc)}

## 📝 背景简述
（基于序章提取）
{desc}
"""
    return md_content

def extract_mood(text):
    keywords = ["热血", "冲动", "颓废", "风流", "优雅", "刚强", "坚毅", "豪爽", "疯癫", "深沉"]
    found = [k for k in keywords if k in text]
    return " / ".join(found) if found else "复合性格"

created_files = []
for name, description in matches:
    filename = f"{name}.md"
    filepath = os.path.join(output_dir, filename)
    
    # Custom identity fix
    if name == "陆小希":
        desc_content = generate_design_doc(name, description).replace("唐国七义士之一", "主角妹妹")
    elif name == "王金鱼":
        desc_content = generate_design_doc(name, description).replace("唐国七义士之一", "唐国七义士之首 / 光明军统领")
    else:
        desc_content = generate_design_doc(name, description)
        
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(desc_content)
    created_files.append(filename)

print(f"Created {len(created_files)} design docs: {', '.join(created_files)}")
